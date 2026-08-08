#!/usr/bin/env python3
"""缺口輪的加法套用：把 `來源 id -> 目標 id` 清單寫進對應章的 related。

減法輪的 cscs_related_apply.py 只會刪，缺口輪需要反向補連結，所以另開這支。
輸入檔裡每一行含 `A -> B` 就算一條（`|` 之後是理由，忽略），`#` 開頭略過。

用法：
    python tools/cscs_gap_apply.py --answer .prompts/logs/ch08-gap-final.md [--dry-run]
"""
import argparse
import io
import re
import sys
from collections import defaultdict
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CSCS = ROOT / "data" / "cscs"

MAX_PER_ITEM = 3
ARROW = re.compile(r"(ch\d{2}\.[\w.-]+?)\s*->\s*(ch\d{2}\.[\w.-]+)")


def load_all() -> dict:
    out = {}
    for path in sorted(CSCS.glob("ch??.yaml")):
        data = yaml.safe_load(io.open(path, encoding="utf-8").read())
        for topic in data["topics"]:
            for it in topic["items"]:
                out[it["id"]] = it
    return out


def parse(text: str) -> list:
    pairs = []
    for line in text.splitlines():
        if line.lstrip().startswith("#"):
            continue
        m = ARROW.search(line)
        if m:
            pairs.append((m.group(1), m.group(2)))
    return pairs


def insert(chid: str, adds: dict) -> int:
    """adds: {source_id: [target_id, ...]}；回傳實際寫入的連結數。"""
    path = CSCS / f"{chid}.yaml"
    lines = io.open(path, encoding="utf-8").read().split("\n")
    out = []
    cur = None
    pending = []          # 還沒寫進去的目標
    in_related = False
    written = 0

    def flush():
        nonlocal pending, written
        for target in pending:
            out.append(f"    - {target}")
            written += 1
        pending = []

    def guard():
        # 走到下一條 item 還有沒落地的，代表該 item 既無 related 也無 locator；
        # 硬寫下去會被接到上一個欄位的 list 裡（靜默改壞 concepts），寧可停。
        if pending:
            sys.exit(f"{cur} 找不到 related 或 locator 欄位，無法安全插入 {pending}")

    for line in lines:
        m = re.match(r"^  - id: (ch\d{2}\.[\w.-]+)", line)
        if m:
            guard()
            cur = m.group(1)
            in_related = False
            pending = list(adds.get(cur, []))
            out.append(line)
            continue

        if re.match(r"^ {4}related:\s*\[\s*\]\s*$", line) and pending:
            out.append("    related:")   # 空的 inline list 改成 block 才能掛條目
            flush()
            in_related = False
            continue

        if re.match(r"^ {4}related:\s*$", line):
            in_related = True
            out.append(line)
            continue

        if in_related and not re.match(r"^ {4}- ch\d{2}\.", line):
            flush()                      # related 區塊結束，補在既有條目之後
            in_related = False

        if re.match(r"^ {4}\w+:", line) and pending and not in_related:
            # 還沒遇到 related（該 item 原本沒這個欄位）→ 插在 locator 之前
            if line.startswith("    locator:"):
                out.append("    related:")
                flush()
        out.append(line)

    guard()
    text = "\n".join(out)
    yaml.safe_load(text)                 # 落盤前確認仍是合法 YAML
    io.open(path, "w", encoding="utf-8", newline="\n").write(text)
    return written


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--answer", required=True)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    items = load_all()
    pairs = parse(io.open(args.answer, encoding="utf-8").read())
    if not pairs:
        sys.exit("輸入檔裡找不到任何 `A -> B` 連結")

    errors = []
    by_chapter = defaultdict(lambda: defaultdict(list))
    counts = {i: len(it.get("related") or []) for i, it in items.items()}
    seen = set()
    for src, dst in pairs:
        if src not in items:
            errors.append(f"來源 id 不存在：{src}")
            continue
        if dst not in items:
            errors.append(f"目標 id 不存在：{dst}")
            continue
        if src == dst:
            errors.append(f"自指：{src}")
            continue
        if dst in (items[src].get("related") or []):
            errors.append(f"已存在，不重複加：{src} -> {dst}")
            continue
        if (src, dst) in seen:
            errors.append(f"輸入檔內重複：{src} -> {dst}")
            continue
        counts[src] += 1
        if counts[src] > MAX_PER_ITEM:
            errors.append(f"{src} 加完會有 {counts[src]} 個 related，上限 {MAX_PER_ITEM}")
            continue
        seen.add((src, dst))
        by_chapter[src.split(".")[0]][src].append(dst)

    if errors:
        print(f"[FAIL] {len(errors)} 個問題：")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)

    total = sum(len(v) for ch in by_chapter.values() for v in ch.values())
    print(f"待寫入 {total} 條，涉及 {len(by_chapter)} 章")
    for chid in sorted(by_chapter):
        n = sum(len(v) for v in by_chapter[chid].values())
        print(f"  {chid}: {n} 條")
    if args.dry_run:
        return

    for chid in sorted(by_chapter):
        written = insert(chid, by_chapter[chid])
        expect = sum(len(v) for v in by_chapter[chid].values())
        status = "OK" if written == expect else "[!] 數字對不上"
        print(f"{chid}: 寫入 {written}/{expect} {status}")


if __name__ == "__main__":
    main()
