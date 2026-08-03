#!/usr/bin/env python3
"""套用 codex 回傳的 `DELETE:` 編號清單，把對應的 related 連結從 chNN.yaml 刪掉。

編號對應 cscs_related_export.py 產生的 .prompts/chNN-links.json（1-based）。
只動 related，其他欄位逐位元不變（呼叫者仍會跑 cscs_related_verify.py 證明）。

用法：
    python tools/cscs_related_apply.py ch18 --answer .prompts/logs/ch18-answer.md
"""
import argparse
import io
import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CSCS = ROOT / "data" / "cscs"


def parse_numbers(text: str) -> list:
    m = re.search(r"DELETE:\s*\n?([\d,\s]+)", text)
    if not m:
        sys.exit("找不到 DELETE: 區塊")
    return sorted({int(n) for n in re.findall(r"\d+", m.group(1))})


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("chid")
    ap.add_argument("--answer", required=True)
    args = ap.parse_args()

    rows = json.loads(io.open(ROOT / ".prompts" / f"{args.chid}-links.json", encoding="utf-8").read())
    nums = parse_numbers(io.open(args.answer, encoding="utf-8").read())
    bad = [n for n in nums if not 1 <= n <= len(rows)]
    if bad:
        sys.exit(f"編號超出範圍 1..{len(rows)}：{bad}")

    drop = {}
    for n in nums:
        r = rows[n - 1]
        drop.setdefault(r["src"], set()).add(r["dst"])

    path = CSCS / f"{args.chid}.yaml"
    text = io.open(path, encoding="utf-8").read()
    lines = text.split("\n")
    out = []
    cur = None
    in_related = False
    removed = 0
    for line in lines:
        m = re.match(r"^  - id: (ch\d{2}\.[\w.-]+)", line)
        if m:
            cur, in_related = m.group(1), False
        elif re.match(r"^ {4}related:", line):
            in_related = True
            out.append(line)
            continue
        elif re.match(r"^ {4}\w+:", line):
            in_related = False
        if in_related:
            m2 = re.match(r"^ {4}- (ch\d{2}\.[\w.-]+)\s*$", line)
            if m2 and m2.group(1) in drop.get(cur, ()):
                removed += 1
                continue
        out.append(line)

    # 清掉因刪光而變空的 related: 區塊（留著會產出 related: null，Hugo 端不吃）
    final = []
    for n, line in enumerate(out):
        if re.match(r"^ {4}related:\s*$", line):
            nxt = out[n + 1] if n + 1 < len(out) else ""
            if not re.match(r"^ {4}- ch\d{2}\.", nxt):
                continue
        final.append(line)

    new_text = "\n".join(final)
    yaml.safe_load(new_text)  # 落盤前先確認還是合法 YAML
    io.open(path, "w", encoding="utf-8", newline="\n").write(new_text)
    print(f"{args.chid}: 指定 {len(nums)} 條、實際刪除 {removed} 條")
    if removed != len(nums):
        print("[!] 數字對不上，去查 related 區塊格式")


if __name__ == "__main__":
    main()
