"""從源書 Markdown 機械抽取兩樣東西，供補完深度層時當依據：

  1. term pool  —— 每章 `Key Terms` 清單（767 條），含首次出現的章別
  2. section map —— 每章的 `##`/`###` 標題與行號區間，讓 topic 對得回源書段落

輸出到 tools/_source_index.json（不進 data/，因為這不是網站資料，是補完工序的中繼物）。

刻意不做的事：不猜中文譯名、不生定義。書裡的破折號定義列全書只有 73 行，
其餘定義散在敘述裡——硬抽會得到一堆半句，比空著更糟。
"""
import io
import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BOOK = Path(
    r"C:\claudehome\resources\books"
    r"\Essentials_of_Strength_Training_and_Conditioning,_Fourth_Edition"
)
OUT = Path(__file__).parent / "_source_index.json"

# 「term——定義」的破折號列，是全書唯一有結構的定義來源
DASH_DEF = re.compile(r"^  \* ([a-zA-Z][^—\n]{0,80}?)—(.+)$", re.M)


def chapter_key(path):
    return path.name[:4]


def parse(path):
    text = io.open(path, encoding="utf-8", errors="replace").read()
    lines = text.split("\n")

    m = re.search(r"#+ Key Terms\n(.*?)\n#+ ", text, re.S)
    terms = re.findall(r"^  \* (.+)$", m.group(1), re.M) if m else []

    sections = []
    for i, line in enumerate(lines):
        hm = re.match(r"^(#{2,4}) (.+)$", line)
        if hm:
            sections.append({"level": len(hm.group(1)), "title": hm.group(2).strip(), "line": i + 1})
    for a, b in zip(sections, sections[1:]):
        a["end"] = b["line"] - 1
    if sections:
        sections[-1]["end"] = len(lines)

    defs = {}
    for term, body in DASH_DEF.findall(text):
        # 「moment arm (also called force arm, ...)」→ 主名 + 別名
        head = term.strip()
        alias = re.search(r"\((?:also called|also known as) ([^)]+)\)", head)
        main = re.sub(r"\s*\([^)]*\)\s*", " ", head).strip()
        defs[main] = {
            "en_def": body.strip(),
            "aliases": [a.strip() for a in alias.group(1).split(",")] if alias else [],
        }

    return {"file": path.name, "terms": [t.strip() for t in terms], "sections": sections, "defs": defs}


def main():
    chapters = {}
    for p in sorted(BOOK.glob("ch*.md")):
        chapters[chapter_key(p)] = parse(p)

    all_terms = {}
    for ch, data in chapters.items():
        for t in data["terms"]:
            all_terms.setdefault(t, []).append(ch)

    OUT.write_text(
        json.dumps({"chapters": chapters, "term_pool": all_terms}, ensure_ascii=False, indent=1),
        encoding="utf-8",
    )

    n_def = sum(len(c["defs"]) for c in chapters.values())
    n_sec = sum(len(c["sections"]) for c in chapters.values())
    empty = [ch for ch, c in chapters.items() if not c["terms"]]
    print(f"chapters      : {len(chapters)}")
    print(f"term pool     : {len(all_terms)} 條（無 Key Terms 段的章：{', '.join(empty) or '無'}）")
    print(f"dash defs     : {n_def} 條（唯一有結構的英文定義）")
    print(f"sections      : {n_sec}")
    print(f"-> {OUT}")


if __name__ == "__main__":
    main()
