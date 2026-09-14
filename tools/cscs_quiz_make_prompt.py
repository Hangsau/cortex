#!/usr/bin/env python3
"""把 tools/cscs_quiz_delegate_prompt.md 套版成某一章的出題派工 prompt。

用法：
    python tools/cscs_quiz_make_prompt.py ch08

配題數、item 數、行數、可用的 dco id 一律從資料現讀，不手填——手寫的數字會過期，
而 agent 會照著過期的數字寫（ch07 那次手寫「52 張卡」實際 53 張的教訓）。
"""
import argparse
import io
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from cscs_quiz_bank_check import ALLOCATION  # noqa: E402

# R6 的測驗組合題下限，來源是 cscs_quiz_spec.md 第六節；驗收工具驗不到，靠 prompt 交代。
BATTERY_MINIMUM = {**{f"ch{n:02d}": 6 for n in (12, 13)},
                   **{f"ch{n:02d}": 4 for n in range(17, 23)}}


def dco_list(chid: str) -> str:
    with (ROOT / "data" / "cscs" / "_domains.yaml").open(encoding="utf-8") as handle:
        domains = yaml.safe_load(handle)["domains"]
    prefixes = {
        domain["id"].split("-", 1)[0]
        for domain in domains
        if chid in (domain.get("chapters") or []) or chid in (domain.get("also") or [])
    }
    if not prefixes:
        sys.exit(f"{chid} 不屬於任何 domain，先修 _domains.yaml")

    with (ROOT / "data" / "cscs" / "_dco.yaml").open(encoding="utf-8") as handle:
        dco = yaml.safe_load(handle)["domains"]

    lines = []
    for domain in dco:
        if domain["id"].split("-", 1)[0] not in prefixes:
            continue
        lines.append(f"**{domain['id']}**")
        for task in domain["tasks"]:
            knowledge = task.get("knowledge") or []
            if not knowledge:
                # pa4 沒有 knowledge statement，只能填 task 層 id。
                lines.append(f"- `{task['id']}` {task['text']}")
                continue
            lines.append(f"- `{task['id']}` {task['text']}")
            for entry in knowledge:
                lines.append(f"  - `{entry['id']}` {entry['text']}")
        lines.append("")
    return "\n".join(lines).rstrip()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("chid", help="例：ch08")
    args = parser.parse_args()

    if not re.fullmatch(r"ch\d{2}", args.chid):
        sys.exit(f"chid 格式應為 chNN，收到 {args.chid!r}")
    if args.chid not in ALLOCATION:
        sys.exit(f"{args.chid} 不在配題表內")

    source = ROOT / "data" / "cscs" / f"{args.chid}.yaml"
    raw = io.open(source, encoding="utf-8").read()
    data = yaml.safe_load(raw)
    items = [item for topic in data["topics"] for item in topic["items"]]

    total, recall, application, analysis, english = ALLOCATION[args.chid]
    if total > len(items) * 2:
        sys.exit(f"{args.chid} 只有 {len(items)} 條 item，出不到 {total} 題（每 item 上限 2 題）")

    minimum = BATTERY_MINIMUM.get(args.chid)
    battery = (
        f"**本章至少 {minimum} 題必須是運動員測驗組合題**（規格 R6）：運動項目 + 身高體重 + "
        "4–6 項測驗結果，問「哪一項最需要改善 / 下一個區塊該加什麼」，三個選項是三個訓練標的。"
        if minimum
        else "本章不強制測驗組合題。"
    )

    template = io.open(ROOT / "tools" / "cscs_quiz_delegate_prompt.md", encoding="utf-8").read()
    out = (
        template.replace("__CHID__", args.chid)
        .replace("__NTOTAL__", str(total))
        .replace("__NRECALL__", str(recall))
        .replace("__NAPPLICATION__", str(application))
        .replace("__NANALYSIS__", str(analysis))
        .replace("__NENGLISH__", str(english))
        .replace("__NITEMS__", str(len(items)))
        .replace("__NLINES__", str(raw.count("\n") + 1))
        .replace("__BATTERY__", battery)
        .replace("__DCOLIST__", dco_list(args.chid))
    )
    left = sorted(set(re.findall(r"__[A-Z]+__", out)))
    if left:
        sys.exit(f"仍有未替換的佔位符：{left}")

    dest = ROOT / ".prompts" / f"{args.chid}-quiz.md"
    dest.parent.mkdir(exist_ok=True)
    io.open(dest, "w", encoding="utf-8", newline="\n").write(out)
    print(f"{dest}  ({len(out)} chars)")
    print(f"{args.chid}：{len(items)} 條 item → {total} 題（{recall}/{application}/{analysis}，英文 {english}）")


if __name__ == "__main__":
    main()
