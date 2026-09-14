#!/usr/bin/env python3
"""把某章題庫的每一題，和它 `item` 指到的源條目並排印出來，供人工逐題查證。

19 道閘只驗格式。內容缺陷（干擾項答的是別的問題、`why_wrong` 編造機制、把源檔敘述
改幾個數字、跨 item 撞同一個正解概念）全部要靠人眼比對源檔的 `a` / `detail`——ch02 與
ch03 都是全綠之後才抓到的。這支工具只是把「翻兩個檔對照」變成一次輸出，不做任何判斷。

用法：
    python -X utf8 tools/cscs_quiz_verify_dump.py ch04
    python -X utf8 tools/cscs_quiz_verify_dump.py ch04 --dupes   # 只看疑似撞概念的題組
"""
import argparse
import io
import sys
from collections import defaultdict
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent


def load(path: Path):
    return yaml.safe_load(io.open(path, encoding="utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("chid")
    parser.add_argument("--dupes", action="store_true", help="只列共用同一 item 的題組")
    args = parser.parse_args()

    bank = ROOT / "data" / "cscs" / "_quiz_bank" / f"{args.chid}.yaml"
    source = ROOT / "data" / "cscs" / f"{args.chid}.yaml"
    if not bank.exists():
        sys.exit(f"{bank} 不存在")

    items = {
        item["id"]: item
        for topic in load(source)["topics"]
        for item in topic["items"]
    }
    questions = load(bank)["questions"]

    if args.dupes:
        by_item = defaultdict(list)
        for question in questions:
            by_item[question["item"]].append(question["id"])
        for item_id, ids in sorted(by_item.items()):
            if len(ids) > 1:
                print(f"{item_id}: {', '.join(ids)}")
        return

    for question in questions:
        item = items.get(question["item"])
        print("=" * 78)
        print(f"{question['id']}  [{question['lang']}/{question['cognitive']}]  dco={question['dco']}")
        print(f"STEM  {question['stem']}")
        for option in question["options"]:
            mark = "✔" if option.get("correct") else " "
            print(f"  {mark} {option['text']}")
            if option.get("why_wrong"):
                print(f"      → {option['why_wrong']}")
        if item is None:
            print(f"!! 源檔查無 {question['item']}")
            continue
        print(f"-- 源 {item['id']}：{item['q']}")
        for answer in item["a"]:
            print(f"   a: {answer}")
        if item.get("detail"):
            print(f"   detail: {item['detail']}")
        for number in item.get("numbers") or []:
            print(f"   num: {number['v']} {number['unit']} — {number['of']}")


if __name__ == "__main__":
    main()
