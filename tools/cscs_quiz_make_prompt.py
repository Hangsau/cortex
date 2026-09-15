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
BATTERY_MINIMUM = {**{f"ch{n:02d}": 15 for n in (12, 13)},
                   **{f"ch{n:02d}": 10 for n in range(17, 23)}}


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


def battery_note(chid: str) -> str:
    minimum = BATTERY_MINIMUM.get(chid)
    if not minimum:
        return "本章不強制測驗組合題。"
    return (
        f"**本章至少 {minimum} 題必須是運動員測驗組合題**（規格 R6）：運動項目 + 身高體重 + "
        "4–6 項測驗結果，問「哪一項最需要改善 / 下一個區塊該加什麼」，三個選項是三個訓練標的。"
    )


def write_prompt(name: str, text: str) -> None:
    left = sorted(set(re.findall(r"__[A-Z]+__", text)))
    if left:
        sys.exit(f"仍有未替換的佔位符：{left}")
    dest = ROOT / ".prompts" / f"{name}.md"
    dest.parent.mkdir(exist_ok=True)
    io.open(dest, "w", encoding="utf-8", newline="\n").write(text)
    print(f"{dest}  ({len(text)} chars)")


def write_topup(chid: str) -> None:
    """補題：既有題目一條不動，只在 questions 後面接上差額。

    差額逐欄算（cognitive 三欄 + zh/en），不讓 agent 自己減；新題的 item 限定在
    「本章從沒出過題」的那批，撞題就結構上不可能發生。
    """
    source = ROOT / "data" / "cscs" / f"{chid}.yaml"
    raw = io.open(source, encoding="utf-8").read()
    items = [item for topic in yaml.safe_load(raw)["topics"] for item in topic["items"]]

    bank_path = ROOT / "data" / "cscs" / "_quiz_bank" / f"{chid}.yaml"
    if not bank_path.exists():
        sys.exit(f"{chid} 還沒有題庫，補題無從補起——先跑不帶 --topup 的整章出題")
    questions = yaml.safe_load(io.open(bank_path, encoding="utf-8").read())["questions"]

    total, recall, application, analysis, english = ALLOCATION[chid]
    have = {key: sum(1 for q in questions if q.get("cognitive") == key)
            for key in ("recall", "application", "analysis")}
    have_en = sum(1 for q in questions if q.get("lang") == "en")

    need = {
        "recall": recall - have["recall"],
        "application": application - have["application"],
        "analysis": analysis - have["analysis"],
    }
    need_en = english - have_en
    need_zh = (total - english) - (len(questions) - have_en)
    new_total = total - len(questions)

    if new_total <= 0:
        sys.exit(f"{chid} 已有 {len(questions)} 題，達到配額 {total}，不需補題")
    short = [f"{k} 少 {v}" for k, v in {**need, "en": need_en, "zh": need_zh}.items() if v < 0]
    if short:
        sys.exit(f"{chid} 既有題目超出配額（{'、'.join(short)}），補題補不回來，需重寫整章")
    if sum(need.values()) != new_total or need_en + need_zh != new_total:
        sys.exit(f"{chid} 差額對不上：cognitive {need}、en {need_en}、zh {need_zh}、總計 {new_total}")

    used = {q["item"] for q in questions}
    free = [item for item in items if item["id"] not in used]
    if len(free) < new_total:
        sys.exit(f"{chid} 只剩 {len(free)} 條未出過題的 item，補不了 {new_total} 題")

    template = io.open(ROOT / "tools" / "cscs_quiz_topup_prompt.md", encoding="utf-8").read()
    out = (
        template.replace("__CHID__", chid)
        .replace("__NNEW__", str(new_total))
        .replace("__NOLD__", str(len(questions)))
        .replace("__NTOTAL__", str(total))
        .replace("__NRECALL__", str(need["recall"]))
        .replace("__NAPPLICATION__", str(need["application"]))
        .replace("__NANALYSIS__", str(need["analysis"]))
        .replace("__NENGLISH__", str(need_en))
        .replace("__NZH__", str(need_zh))
        .replace("__NITEMS__", str(len(items)))
        .replace("__NLINES__", str(raw.count("\n") + 1))
        .replace("__BATTERY__", battery_note(chid))
        .replace("__FREEITEMS__", "\n".join(f"- `{i['id']}` {i['q']}" for i in free))
        .replace("__DCOLIST__", dco_list(chid))
    )
    write_prompt(f"{chid}-quiz-topup", out)
    print(
        f"{chid}：既有 {len(questions)} 題 → 補 {new_total} 題"
        f"（{need['recall']}/{need['application']}/{need['analysis']}，"
        f"英文 {need_en}、中文 {need_zh}），可用 item {len(free)} 條"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("chid", help="例：ch08")
    parser.add_argument(
        "--review", action="store_true",
        help="改套第二輪的審查 prompt（抓閘門擋不到的爛干擾項），輸出 chNN-quiz-review.md",
    )
    parser.add_argument(
        "--topup", action="store_true",
        help="補題：既有題目不動，只補到配額（給 ch01–ch03 這種舊配額寫成的章），"
             "輸出 chNN-quiz-topup.md",
    )
    args = parser.parse_args()

    if not re.fullmatch(r"ch\d{2}", args.chid):
        sys.exit(f"chid 格式應為 chNN，收到 {args.chid!r}")
    if args.chid not in ALLOCATION:
        sys.exit(f"{args.chid} 不在配題表內")

    if args.review:
        template = io.open(
            ROOT / "tools" / "cscs_quiz_review_prompt.md", encoding="utf-8"
        ).read()
        write_prompt(f"{args.chid}-quiz-review", template.replace("__CHID__", args.chid))
        return

    if args.topup:
        write_topup(args.chid)
        return

    source = ROOT / "data" / "cscs" / f"{args.chid}.yaml"
    raw = io.open(source, encoding="utf-8").read()
    data = yaml.safe_load(raw)
    items = [item for topic in data["topics"] for item in topic["items"]]

    total, recall, application, analysis, english = ALLOCATION[args.chid]
    if total > len(items) * 2:
        sys.exit(f"{args.chid} 只有 {len(items)} 條 item，出不到 {total} 題（每 item 上限 2 題）")

    battery = battery_note(args.chid)

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
    write_prompt(f"{args.chid}-quiz", out)
    print(f"{args.chid}：{len(items)} 條 item → {total} 題（{recall}/{application}/{analysis}，英文 {english}）")


if __name__ == "__main__":
    main()
