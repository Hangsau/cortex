#!/usr/bin/env python3
"""把 tools/cscs_delegate_prompt.md 套版成某一章的派工 prompt，寫到 .prompts/chNN-reconcile.md。

用法：
    python tools/cscs_make_prompt.py ch08 [--note "本章特別注意：..."]

章況（topic 數 / item 數 / 卡片數 / topic id / 卡片 tag / 哪些欄位是空的）一律從 yaml 現讀，
不手填——ch07 曾因手寫「52 張卡」實際 53 張而誤導 agent。
"""
import argparse
import io
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
BOOKS = Path(r"C:\claudehome\resources\books\Essentials_of_Strength_Training_and_Conditioning,_Fourth_Edition")


def find_src(chnum: int) -> str:
    hits = sorted(BOOKS.glob(f"ch{chnum:02d}_*.md"))
    if len(hits) != 1:
        sys.exit(f"源書章節檔比對到 {len(hits)} 個（期望 1）：{[h.name for h in hits]}")
    return hits[0].name


def build_status(data: dict, chid: str) -> str:
    topics = data["topics"]
    items = [it for t in topics for it in t["items"]]
    cards = data.get("cards") or []

    empty = {f: sum(1 for it in items if not it.get(f)) for f in ("locator", "detail", "terms", "numbers")}
    n = len(items)
    counts = sorted({len(t["items"]) for t in topics})
    per = f"每個 {counts[0]} 條 item" if len(counts) == 1 else f"每個 topic {min(counts)}–{max(counts)} 條 item"

    lines = [
        f"`data/cscs/{chid}.yaml`：{len(topics)} 個 topic，{per}，共 {n} 條；另有 {len(cards)} 張 cards。",
        "",
        "topic id（順序與 id 都不要動）：",
        " / ".join(f"`{t['id']}`" for t in topics),
        "",
    ]

    if all(v == n for v in empty.values()):
        lines.append(
            f"**{n} 條的 `locator` / `detail` / `terms` / `numbers` 全部是空的，`q` / `a` 全部未經查證**"
            "——整章都要對帳，沒有可以跳過的 topic。`concepts` 已由批次腳本標好，判斷明顯不對才改。"
        )
    else:
        detail = "、".join(f"`{f}` 空 {v}/{n}" for f, v in empty.items())
        lines.append(f"欄位現況：{detail}。已有值的欄位同樣未經查證，一併對帳。")

    tags = sorted({c.get("tag", "") for c in cards} - {""})
    if tags:
        lines += ["", "閃卡的 `tag` 分類（重寫時沿用既有值）：" + " / ".join(f"`{t}`" for t in tags) + "。"]
    return "\n".join(lines)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("chid", help="例：ch08")
    ap.add_argument("--note", default="", help="附加在章況末尾的本章特別注意事項")
    args = ap.parse_args()

    if not re.fullmatch(r"ch\d{2}", args.chid):
        sys.exit(f"chid 格式應為 chNN，收到 {args.chid!r}")
    chnum = int(args.chid[2:])

    yaml_path = ROOT / "data" / "cscs" / f"{args.chid}.yaml"
    data = yaml.safe_load(io.open(yaml_path, encoding="utf-8").read())

    status = build_status(data, args.chid)
    if args.note:
        status += "\n\n" + args.note

    tpl = io.open(ROOT / "tools" / "cscs_delegate_prompt.md", encoding="utf-8").read()
    out = (
        tpl.replace("__CHNN__", f"{chnum:02d}")
        .replace("__CHID__", args.chid)
        .replace("__CHNUM__", str(chnum))
        .replace("__NCARDS__", str(len(data.get("cards") or [])))
        .replace("__SRCFILE__", find_src(chnum))
        .replace("__STATUS__", status)
    )
    left = sorted(set(re.findall(r"__[A-Z]+__", out)))
    if left:
        sys.exit(f"仍有未替換的佔位符：{left}")

    dest = ROOT / ".prompts" / f"{args.chid}-reconcile.md"
    dest.parent.mkdir(exist_ok=True)
    io.open(dest, "w", encoding="utf-8", newline="\n").write(out)
    print(f"{dest}  ({len(out)} chars)")
    print(status)


if __name__ == "__main__":
    main()
