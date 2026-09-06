"""Read-only source access and provenance for the two book readers."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
WORKSPACE = SITE.parents[1]
BOOK_ROOT = WORKSPACE / "resources" / "books"
PDF_ROOT = WORKSPACE / "resources" / "raw" / "pdf" / "inbox"
REPORT = SITE / "research" / "book-readers-2026-09-06"
BOOKS = {
    "neumann": {
        "folder": "Kinesiology_of_the_Musculoskeletal_System_3rd_ed",
        "pdf_prefix": "kinesiology-of-the-musculoskeletal-system-3rd-edition",
        "source_id": "src.neumann-2017", "slug": "kinesiology",
        "title": "肌肉骨骼系統肌動學", "edition": "第 3 版",
        "title_en": "Kinesiology of the Musculoskeletal System",
        "author": "Donald A. Neumann", "isbn": "9780323287531",
        "description": "從關節、肌肉與力矩，讀懂身體如何完成動作。",
        "chapters": [
            (1,"動作的共同語言",23,47,"foundations"),
            (2,"關節的結構與功能",48,66,"foundations"),
            (3,"肌肉如何產生力量",67,96,"foundations"),
            (4,"用力學理解動作",97,134,"foundations"),
            (5,"肩帶：讓手臂抬起的合作",139,195,"upper"),
            (6,"肘與前臂：靠近、遠離與轉向",196,238,"upper"),
            (7,"手腕：手部操作的底座",239,270,"upper"),
            (8,"手：抓握與精細操作",271,324,"upper"),
            (9,"脊柱的骨骼與關節",340,411,"axial"),
            (10,"脊柱的肌肉與動作控制",412,457,"axial"),
            (11,"咀嚼與呼吸的肌動學",458,489,"axial"),
            (12,"髖：連接軀幹與下肢",500,560,"lower"),
            (13,"膝：承重中的活動與穩定",561,618,"lower"),
            (14,"踝與足：適應地面並推進",619,677,"lower"),
            (15,"把關節串成行走",678,731,"gait"),
            (16,"從行走進入跑步",732,753,"gait"),
        ],
    },
    "nordin": {
        "folder": "Basic_Biomechanics_of_the_Musculoskeletal_System_4th_ed",
        "pdf_prefix": "basic-biomechanics-of-the-musculoskeletal-system-north-american-edition",
        "source_id": "src.nordin-frankel-2012", "slug": "basic-biomechanics",
        "title": "肌肉骨骼系統基礎生物力學", "edition": "第 4 版",
        "title_en": "Basic Biomechanics of the Musculoskeletal System",
        "author": "Margareta Nordin · Victor H. Frankel", "isbn": "9781609133351",
        "description": "從組織如何承受負荷，讀懂關節與整體動作的力學。",
        "chapters": [
            (1,"力學的基本工具",18,39,"foundations"),
            (2,"骨：有結構的承重材料",40,75,"tissues"),
            (3,"關節軟骨：固體與液體共同承重",76,117,"tissues"),
            (4,"肌腱與韌帶：拉力與時間",118,143,"tissues"),
            (5,"周邊神經與神經根",144,165,"tissues"),
            (6,"骨骼肌：可調節的力量來源",166,195,"tissues"),
            (7,"膝關節的負荷分配",196,221,"lower"),
            (8,"髖關節的受力平衡",222,239,"lower"),
            (9,"足踝如何承重與推進",240,269,"lower"),
            (10,"腰椎如何承受負荷",270,301,"axial"),
            (11,"頸椎的活動與穩定",302,337,"axial"),
            (12,"肩關節的動態穩定",338,359,"upper"),
            (13,"肘關節的力學",360,379,"upper"),
            (14,"手腕與手的負荷傳遞",380,411,"upper"),
            (15,"骨折固定的力學原理",412,419,"applied"),
            (16,"人工關節的力學原理",420,441,"applied"),
            (17,"步態：整合動作與力量",442,460,"gait"),
        ],
    },
}


def book_pages(key: str) -> dict[int, dict]:
    """Merge split chapter files by physical PDF page, without altering text."""
    root = BOOK_ROOT / BOOKS[key]["folder"]
    result = {}
    for path in sorted(root.glob("*.md")):
        if path.name.startswith("_"):
            continue
        parts = re.split(r"<!-- page (\d+) -->", path.read_text(encoding="utf-8-sig"))
        for i in range(1, len(parts), 2):
            page = int(parts[i])
            if page in result:
                raise ValueError(f"Duplicate physical page: {key} {page}")
            result[page] = {"file": path.name, "text": parts[i + 1].strip()}
    return result


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            hasher.update(block)
    return hasher.hexdigest()


def inspect(key: str, chapter: int, patterns: list[str], limit: int) -> None:
    row = next(c for c in BOOKS[key]["chapters"] if c[0] == chapter)
    pages = book_pages(key)
    for page in range(row[2], row[3] + 1):
        text = pages[page]["text"]
        paragraphs = re.split(r"\n\s*\n", text)
        matches = [p for p in paragraphs if len(p) > 160 and
                   (not patterns or any(re.search(x, p, re.I) for x in patterns)) and
                   not p.startswith(("![", "<", "|"))]
        if matches:
            print(f"\n--- {key} chapter {chapter}, PDF page {page} ---")
            print("\n\n".join(matches[:2])[:limit])


def audit() -> None:
    import fitz
    from datetime import datetime, timezone
    report = {"run": "book-readers-2026-09-06", "checked_at": datetime.now(timezone.utc).isoformat(),
              "method": "Local user-provided textbooks; physical PDF pages are locators. No source-text repair or full-book semantic verification is claimed.",
              "books": {}, "errors": []}
    catalog = {}
    for key, book in BOOKS.items():
        pdf = next(PDF_ROOT.glob(book["pdf_prefix"] + "*.pdf"))
        pages = book_pages(key)
        with fitz.open(pdf) as doc:
            count = len(doc)
            toc = doc.get_toc()
        missing = sorted(set(range(1, count + 1)) - pages.keys())
        missing_images = [p for p in range(1, count + 1)
                          if not (BOOK_ROOT / book["folder"] / "pages" / f"p{p:04}.png").is_file()]
        if missing or missing_images:
            report["errors"].append({"book": key, "missing_pages": missing, "missing_images": missing_images})
        root = BOOK_ROOT / book["folder"]
        report["books"][key] = {
            "source_id": book["source_id"], "discovery_path": str(pdf.relative_to(WORKSPACE)),
            "pdf_sha256": digest(pdf), "pdf_pages": count,
            "metadata_available": True, "abstract_available": False,
            "fulltext_status": "complete", "readability": "degraded",
            "page_images_available": count - len(missing_images),
            "extraction_status": "existing automated extraction; chapter boundaries reassembled by PDF page",
            "semantic_review": "Selected explanatory passages and figures; not a line-by-line review of the full book",
            "known_issues": ["OCR/text-layer artifacts", "headings and figure labels mixed", "PDF page numbers differ from printed folios"],
            "markdown_sha256": {p.name: digest(p) for p in sorted(root.glob("*.md")) if not p.name.startswith("_")},
            "chapter_files": {str(c[0]): sorted({pages[p]["file"] for p in range(c[2], c[3]+1)}) for c in book["chapters"]},
            "toc": toc,
        }
        catalog[key] = {k: v for k, v in book.items() if k not in ("folder", "pdf_prefix", "chapters")}
        catalog[key]["page_count"] = count
        catalog[key]["chapters"] = [{"number": c[0], "title": c[1], "start": c[2], "end": c[3], "group": c[4],
                                      "id": f"{key}.ch{c[0]:02}", "path": f"library/{book['slug']}/ch{c[0]:02}/"} for c in book["chapters"]]
    REPORT.mkdir(parents=True, exist_ok=True)
    (REPORT / "source-audit.json").write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    target = SITE / "data" / "reading"
    target.mkdir(parents=True, exist_ok=True)
    (target / "books.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({"books": len(catalog), "chapters": sum(len(b["chapters"]) for b in catalog.values()), "errors": report["errors"]}))
    if report["errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["audit", "inspect"])
    parser.add_argument("--book", choices=BOOKS, default="neumann")
    parser.add_argument("--chapter", type=int, default=1)
    parser.add_argument("--find", nargs="*", default=[])
    parser.add_argument("--limit", type=int, default=1000)
    args = parser.parse_args()
    if args.command == "audit":
        audit()
    else:
        inspect(args.book, args.chapter, args.find, args.limit)
