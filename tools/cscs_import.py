"""一次性匯入：把 content/library/essentials-of-strength-training/chNN/*.md
與 Google Sheets 閃卡 CSV，轉成 data/cscs/chNN.yaml。

跑完之後 data/cscs/ 就是唯一真相源，本腳本退役（不是 sync 工具，不要重跑覆蓋人工補完的內容）。
用法：python tools/cscs_import.py [--dry-run]
"""
import csv
import io
import re
import sys
import urllib.request
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "content" / "library" / "essentials-of-strength-training"
OUT = ROOT / "data" / "cscs"
CSV_URL = re.search(
    r'cscsFlashcardsCSV\s*=\s*"([^"]+)"', (ROOT / "hugo.toml").read_text(encoding="utf-8")
).group(1)


def read_front_matter(text):
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", text, re.S)
    if not m:
        return {}, text
    return yaml.safe_load(m.group(1)) or {}, m.group(2)


def parse_topic(md_path):
    fm, body = read_front_matter(md_path.read_text(encoding="utf-8-sig"))
    items = []
    for i, chunk in enumerate(re.split(r"^## ", body, flags=re.M)[1:], 1):
        lines = [l.rstrip() for l in chunk.strip().split("\n")]
        heading = lines[0].strip()
        answer = "\n".join(lines[1:]).strip()
        if not heading:
            continue
        items.append({
            "id": f"{md_path.parent.name}.{md_path.stem}.i{i:02d}",
            "q": heading,
            # 舊版把「；」當條列分隔符寫在 layout 裡；改成資料層的 list，標點回歸標點
            "a": [s.strip() for s in answer.split("；") if s.strip()],
            "detail": "",
            "terms": [],
            "numbers": [],
            "concepts": [],
            "related": [],
            "locator": "",
        })
    return {
        "id": md_path.stem,
        "title": fm.get("title", md_path.stem),
        "desc": fm.get("description", ""),
        "tag": (fm.get("tags") or [""])[0],
        "items": items,
    }


def fetch_cards():
    with urllib.request.urlopen(CSV_URL) as r:
        text = r.read().decode("utf-8")
    rows = list(csv.reader(io.StringIO(text)))
    by_ch = {}
    for row in rows[1:]:
        if len(row) < 3 or not row[0].strip():
            continue
        by_ch.setdefault(row[0].strip(), []).append({
            "q": row[1].strip(),
            "a": row[2].strip(),
            "tag": (row[3].strip() if len(row) > 3 else ""),
        })
    return by_ch


def main():
    dry = "--dry-run" in sys.argv
    cards = fetch_cards()
    OUT.mkdir(parents=True, exist_ok=True)
    total_items = 0

    for ch_dir in sorted(p for p in SRC.iterdir() if p.is_dir() and re.fullmatch(r"ch\d+", p.name)):
        idx_fm, _ = read_front_matter((ch_dir / "_index.md").read_text(encoding="utf-8-sig"))
        topics = [parse_topic(p) for p in sorted(ch_dir.glob("*.md")) if p.stem != "_index"]
        total_items += sum(len(t["items"]) for t in topics)
        doc = {
            "id": ch_dir.name,
            "weight": idx_fm.get("weight", 0),
            "title": idx_fm.get("title", ch_dir.name),
            "topics": topics,
            "cards": cards.get(ch_dir.name, []),
        }
        dest = OUT / f"{ch_dir.name}.yaml"
        print(f"{dest.name}: {len(topics)} topics / {sum(len(t['items']) for t in topics)} items / {len(doc['cards'])} cards")
        if not dry:
            dest.write_text(
                yaml.safe_dump(doc, allow_unicode=True, sort_keys=False, width=100),
                encoding="utf-8",
            )
    print(f"\n總計 {total_items} 個知識單位")


if __name__ == "__main__":
    main()
