"""書房首頁「今天的短篇」候選清單（Claude 撰寫，2026-09-26）。

四組各收 1–6 分鐘能讀完的單位；首頁由 study.js 每天挑一組（依日期決定、優先沒讀過的），
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
    out = []
    for n in range(1, 25):
        ch = yaml.safe_load((ROOT / f"data/cscs/ch{n:02d}.yaml").read_text(encoding="utf-8"))
        for topic in ch["topics"]:
            if not topic.get("items"):
                continue
            it = topic["items"][0]
            ans = it.get("a") or []
            out.append({
                "k": "約 1 分鐘",
                "t": f"CSCS 第 {n} 章：{it['q']}",
                "d": plain(ans[0] if ans else it.get("detail", ""))[:60],
                "p": f"library/essentials-of-strength-training/ch{n:02d}/#{it['id']}",
            })
    return out


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
