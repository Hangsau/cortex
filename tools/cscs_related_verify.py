#!/usr/bin/env python3
"""`related` 減法輪的欄位凍結驗收：比對 working tree 與 git HEAD 的 chNN.yaml。

不採信 agent 自述——這支負責證明「除了 related 之外零改動」，以及規則層全綠。

用法：
    python tools/cscs_related_verify.py ch12 [--base HEAD]
"""
import argparse
import collections
import io
import re
import subprocess
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CSCS = ROOT / "data" / "cscs"

MAX_PER_ITEM = 3
MAX_INNER = 8


def head_yaml(chid: str, base: str) -> dict:
    rel = f"data/cscs/{chid}.yaml"
    raw = subprocess.run(
        ["git", "show", f"{base}:{rel}"], cwd=ROOT, capture_output=True, check=True
    ).stdout.decode("utf-8")
    return yaml.safe_load(raw)


def items_of(data: dict):
    return [(t["id"], it) for t in data["topics"] for it in t["items"]]


def strip_related(data: dict) -> dict:
    return {
        "meta": {k: v for k, v in data.items() if k not in ("topics", "cards")},
        "cards": data.get("cards"),
        "topics": [
            {
                **{k: v for k, v in t.items() if k != "items"},
                "items": [{k: v for k, v in it.items() if k != "related"} for it in t["items"]],
            }
            for t in data["topics"]
        ],
    }


def all_ids() -> set:
    ids = set()
    for path in sorted(CSCS.glob("ch??.yaml")):
        data = yaml.safe_load(io.open(path, encoding="utf-8").read())
        ids.update(it["id"] for _, it in items_of(data))
    return ids


def stats(chid: str, data: dict) -> dict:
    inner = 0
    same_topic = []
    cross = collections.Counter()
    dist = collections.Counter()
    for topic_id, it in items_of(data):
        rel = it.get("related") or []
        dist[len(rel)] += 1
        for target in rel:
            if target.split(".")[0] == chid:
                inner += 1
                if target.rsplit(".", 1)[0].split(".", 1)[1] == topic_id:
                    same_topic.append(f"{it['id']} -> {target}")
            else:
                cross[target.split(".")[0]] += 1
    total = inner + sum(cross.values())
    top = cross.most_common(1)
    return {
        "total": total,
        "inner": inner,
        "cross": cross,
        "dist": dict(sorted(dist.items())),
        "empty": dist.get(0, 0),
        "same_topic": same_topic,
        "top": f"{top[0][0]} {top[0][1]} 條 = {round(top[0][1] / sum(cross.values()) * 100, 1)}%" if top else "-",
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("chid")
    ap.add_argument("--base", default="HEAD")
    args = ap.parse_args()

    path = CSCS / f"{args.chid}.yaml"
    text = io.open(path, encoding="utf-8").read()
    new = yaml.safe_load(text)
    old = head_yaml(args.chid, args.base)

    errors = []

    if strip_related(new) != strip_related(old):
        old_map = {it["id"]: it for _, it in items_of(old)}
        new_map = {it["id"]: it for _, it in items_of(new)}
        if set(old_map) != set(new_map):
            errors.append(
                f"item id 集合被動過：少了 {sorted(set(old_map) - set(new_map))[:5]}、"
                f"多了 {sorted(set(new_map) - set(old_map))[:5]}"
            )
        if old.get("cards") != new.get("cards"):
            errors.append("cards 區塊被改動（本輪應逐位元相同）")
        for iid in sorted(set(old_map) & set(new_map)):
            for field in set(old_map[iid]) | set(new_map[iid]):
                if field == "related":
                    continue
                if old_map[iid].get(field) != new_map[iid].get(field):
                    errors.append(f"{iid}.{field} 被改動（本輪只准動 related）")
        if not errors:
            errors.append("related 以外有改動，但逐欄位比對沒抓到——topic 層級的欄位被動過")

    ids = all_ids()
    for _, it in items_of(new):
        rel = it.get("related") or []
        if len(rel) > MAX_PER_ITEM:
            errors.append(f"{it['id']} 有 {len(rel)} 個 related，上限 {MAX_PER_ITEM}")
        if it["id"] in rel:
            errors.append(f"{it['id']} 自指")
        if len(set(rel)) != len(rel):
            errors.append(f"{it['id']} 有重複的 related 目標")
        for target in rel:
            if target not in ids:
                errors.append(f"{it['id']} -> {target} 斷鏈")

    # yaml.safe_load 對重複 key 是後者覆蓋前者、不報錯，所以要在原文層擋
    starts = [n for n, line in enumerate(text.splitlines()) if re.match(r"  - id: ch\d{2}\.", line)]
    raw_lines = text.splitlines()
    for s, e in zip(starts, starts[1:] + [len(raw_lines)]):
        keys = [line.split(":")[0].strip() for line in raw_lines[s:e] if re.match(r"^ {4}\w+:", line)]
        dupes = {k for k in keys if keys.count(k) > 1}
        if dupes:
            errors.append(f"{raw_lines[s].split('id: ')[1]} 有重複的 key {sorted(dupes)}（Hugo 會建置失敗）")

    bad_indent = [
        n for n, line in enumerate(text.splitlines(), 1) if re.match(r"^ {6}- ch\d{2}\.", line)
    ]
    if bad_indent:
        errors.append(f"{len(bad_indent)} 行 related 用了 6 空白縮排（應為 4），首見於第 {bad_indent[0]} 行")

    before, after = stats(args.chid, old), stats(args.chid, new)
    delta = after["total"] - before["total"]
    pct = round(delta / before["total"] * 100, 1) if before["total"] else 0
    print(f"== {args.chid} ==")
    print(f"連結數 {before['total']} -> {after['total']}（{delta:+d}，{pct:+}%）")
    print(f"跨章 {before['total'] - before['inner']} -> {after['total'] - after['inner']}、"
          f"章內 {before['inner']} -> {after['inner']}（上限 {MAX_INNER}）")
    print(f"落點章數 {len(before['cross'])} -> {len(after['cross'])}；最大單章 {before['top']} -> {after['top']}")
    print(f"分佈 {before['dist']} -> {after['dist']}；空白 item {before['empty']} -> {after['empty']}")
    if after["same_topic"]:
        print(f"[!] 同 topic 內互指 {len(after['same_topic'])} 條（人工判斷是否為空操作）：")
        for line in after["same_topic"][:10]:
            print(f"    {line}")
    if after["inner"] > MAX_INNER:
        errors.append(f"章內連結 {after['inner']} 條，超過上限 {MAX_INNER}")

    if errors:
        print(f"\n[FAIL] {len(errors)} 個錯誤")
        for e in errors[:40]:
            print(f"  - {e}")
        sys.exit(1)
    print("\n[OK] 欄位凍結與規則層全綠")


if __name__ == "__main__":
    main()
