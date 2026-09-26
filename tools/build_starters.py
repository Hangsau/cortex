"""書房首頁「今天的短篇」候選清單（Claude 撰寫，2026-09-26）。

四組各收 1–6 分鐘能讀完的單位；首頁由 study.js 每次進來隨機抽一組（使用者 2026-09-26 決定：本機閱讀紀錄不可靠，不以讀過沒讀過篩），
可按「換一組」。讀本小節的分鐘數以字數估（與 study.js 同為每分鐘 450 字）。

用法：python -X utf8 tools/build_starters.py   → next/data/starters.json
（需先跑 tools/build_library.py：學習與氣質兩組取自 next/data/library.json）
"""
import json
import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "next" / "data" / "starters.json"
CPM = 450
SECTION_RE = re.compile(r"^## (.+?)\s*\{#([a-z0-9-]+)\}\s*$", re.M)
FRONT_RE = re.compile(r"^---.*?\n---\s*\n", re.S)


def plain(s):
    s = re.sub(r"\{\{[<%].*?[>%]\}\}", " ", str(s or ""))
    s = re.sub(r"<[^>]+>|[*_`#>\[\]()]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def reading():
    books = json.loads((ROOT / "data/reading/books.json").read_text(encoding="utf-8"))
    out = []
    for key, slug, short in (("neumann", "kinesiology", "肌動學"), ("nordin", "basic-biomechanics", "生物力學")):
        for ch in books[key]["chapters"]:
            md = ROOT / "content/library" / slug / f"ch{ch['number']:02d}" / "index.md"
            if not md.exists():
                continue
            text = FRONT_RE.sub("", md.read_text(encoding="utf-8"), count=1)
            parts = SECTION_RE.split(text)
            for n_sec, i in enumerate(range(1, len(parts) - 2, 3)):
                if n_sec % 3:  # 每章第 1、4、7…節，控制首頁要下載的清單大小
                    continue
                body = plain(parts[i + 2])
                mins = max(1, round(len(body) / CPM))
                if 1 <= mins <= 6:
                    out.append({
                        "k": f"約 {mins} 分鐘",
                        "t": f"{short}第 {ch['number']} 章：{parts[i].strip()}",
                        "d": "",
                        "p": f"library/{slug}/ch{ch['number']:02d}/#{parts[i + 1]}",
                    })
    return out


def cscs():
    """CSCS 隨機五題：一章一筆；首頁隨機抽一章，選擇題頁再從該章題庫隨機抽 5 題直接開始。"""
    lib = json.loads((ROOT / "next/data/library.json").read_text(encoding="utf-8"))
    chapters = next(s for s in lib["series"] if s["id"] == "cscs")["chapters"]
    return [{
        "k": "約 5 分鐘",
        "t": f"CSCS 隨機五題：第 {c['n']} 章 · {c['title']}",
        "d": "從這章題庫隨機抽 5 題，答錯的會連回課本那一條",
        "p": f"library/essentials-of-strength-training/quiz/?ch={c['id']}&n=5",
    } for c in chapters]


def from_library():
    lib = json.loads((ROOT / "next/data/library.json").read_text(encoding="utf-8"))
    learning, temperament = [], []
    for s in lib["series"]:
        if s["id"] in ("mnfl", "ust"):
            label = "學習技法" if s["id"] == "mnfl" else "課堂策略"
            learning += [{"k": "約 2 分鐘", "t": f"一個{label}：{e['title']}", "d": e["desc"], "p": e["path"]} for e in s["entries"]]
        if s["id"] == "temperament":
            temperament += [{"k": "約 2 分鐘", "t": f"一個氣質維度：{e['title']}", "d": e["desc"], "p": e["path"]} for e in s["entries"]]
            temperament += [{"k": "約 5 分鐘", "t": f"氣質：{c['title']}", "d": c["desc"], "p": c["path"]} for c in s["chapters"]]
    return learning, temperament


def main():
    learning, temperament = from_library()
    groups = {"reading": reading(), "cscs": cscs(), "learning": learning, "temperament": temperament}
    OUT.write_text(json.dumps({"groups": groups}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("starters.json：", {k: len(v) for k, v in groups.items()}, f"{OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
