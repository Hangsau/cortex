"""Validate canonical chapter guides and rebuild deterministic reading indices.

This checks structure and source locators, not the truth of every sentence.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

import yaml

from book_sources import BOOKS, BOOK_ROOT, REPORT, SITE

DATA = SITE / "data" / "reading"
INDEX = DATA / "index.json"
SOURCE = re.compile(r'\{\{< reading-source from="(\d+)" to="(\d+)" >\}\}')
HEADING = re.compile(r'^## (.+) \{#([a-z][a-z0-9-]+)\}\s*$', re.M)


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids, self.links = [], []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.append(attrs["id"])
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])


def check(write_index: bool, html_root: Path | None) -> dict:
    errors = []

    def require(condition, message):
        if not condition:
            errors.append(message)

    books = json.loads((DATA / "books.json").read_text(encoding="utf-8"))
    topics = json.loads((DATA / "topics.json").read_text(encoding="utf-8"))
    terms = json.loads((DATA / "terms.json").read_text(encoding="utf-8"))
    pairings = json.loads((DATA / "pairings.json").read_text(encoding="utf-8"))
    units, expected_paths = [], set()
    sources, term_uses, topic_units = defaultdict(list), defaultdict(list), defaultdict(list)
    han_count = 0
    for key, book in books.items():
        require(len(book["chapters"]) == len(BOOKS[key]["chapters"]), f"{key}: chapter count drift")
        for row, canonical in zip(book["chapters"], BOOKS[key]["chapters"]):
            require((row["number"], row["title"], row["start"], row["end"], row["group"]) == canonical, f"{row['id']}: catalog drift; rerun source audit")
            path = SITE / "content" / row["path"] / "index.md"
            expected_paths.add(path)
            require(path.is_file(), f"Missing chapter {path}")
            if not path.is_file():
                continue
            raw = path.read_text(encoding="utf-8")
            parts = raw.split("---", 2)
            if len(parts) != 3:
                errors.append(f"{path}: missing front matter")
                continue
            meta, body = yaml.safe_load(parts[1]), parts[2].strip()
            identity = row["id"]
            require(meta.get("id") == identity, f"{identity}: ID mismatch")
            require(meta.get("reader_book") == key and meta.get("chapter") == row["number"], f"{identity}: chapter/book mismatch")
            require(meta.get("title") == row["title"], f"{identity}: title mismatch")
            require(meta.get("status") == "guide" and meta.get("content_type") == "chapter-guide", f"{identity}: publication type missing")
            require(meta.get("source_ids") == [book["source_id"]], f"{identity}: source ID mismatch")
            require(bool(meta.get("description")) and bool(meta.get("created")) and bool(meta.get("updated")), f"{identity}: incomplete metadata")
            require(not meta.get("draft", False), f"{identity}: unexpectedly draft")
            require(row["group"] in topics, f"{identity}: unknown topic")
            headings = list(HEADING.finditer(body))
            require(len(headings) >= 3, f"{identity}: insufficient continuous sections")
            require(len(headings) == len(re.findall(r'^## ', body, re.M)), f"{identity}: missing stable heading ID")
            require(len({h[2] for h in headings}) == len(headings), f"{identity}: duplicate section ID")
            require(not re.search(r'TODO|待補|待撰|TBD|undefined|\uFFFD', body), f"{identity}: unfinished text")
            han_count += len(re.findall(r'[\u4e00-\u9fff]', body))
            sections = []
            for i, heading in enumerate(headings):
                text = body[heading.end(): headings[i + 1].start() if i + 1 < len(headings) else len(body)]
                refs = [{"from": int(m[1]), "to": int(m[2])} for m in SOURCE.finditer(text)]
                require(bool(refs), f"{identity}#{heading[2]}: missing locator")
                for ref in refs:
                    require(row["start"] <= ref["from"] <= ref["to"] <= row["end"], f"{identity}#{heading[2]}: locator outside chapter {ref}")
                    for page in range(ref["from"], ref["to"] + 1):
                        require((BOOK_ROOT / BOOKS[key]["folder"] / "pages" / f"p{page:04}.png").is_file(), f"{identity}: missing source page {page}")
                require(len(re.findall(r'[\u4e00-\u9fff]', text)) >= 70, f"{identity}#{heading[2]}: empty or fragmentary section")
                sections.append({"id": identity + "." + heading[2], "title": heading[1], "anchor": heading[2], "source_id": book["source_id"], "pdf_pages": refs})
            for term in meta.get("terms", []):
                require(term in terms, f"{identity}: unknown term {term}")
                term_uses[term].append(identity)
            unit = {"id": identity, "title": meta["title"], "description": meta["description"], "content_type": "chapter-guide", "path": row["path"], "topic": row["group"], "source_id": book["source_id"], "terms": meta.get("terms", []), "body_sha256": hashlib.sha256(body.encode()).hexdigest(), "sections": sections}
            units.append(unit)
            sources[book["source_id"]].append(identity)
            topic_units[row["group"]].append(identity)
    actual_paths = {p for book in books.values() for p in (SITE / "content/library" / book["slug"]).glob("ch*/index.md")}
    require(actual_paths == expected_paths, "Chapter files differ from canonical catalog")
    ids = {u["id"] for u in units}
    require(len(ids) == len(units) == 33, "Expected 33 unique chapter guides")
    require(set(terms) == set(term_uses), f"Unused or missing terms: {set(terms) ^ set(term_uses)}")
    require(set(topics) == set(topic_units), "Unused or missing topics")
    require(all(len(x) >= 2 for x in topic_units.values()), "Topics must join multiple chapters")
    seen_pairs = set()
    for pair in pairings:
        require(len(pair) == 2 and all(x in ids for x in pair), f"Invalid chapter pairing: {pair}")
        require(pair[0].split('.')[0] != pair[1].split('.')[0], f"Not a cross-book pairing: {pair}")
        key = tuple(sorted(pair))
        require(key not in seen_pairs, f"Duplicate pairing: {pair}")
        seen_pairs.add(key)
    index = {"generated_by": "tools/reading_check.py --write-index", "schema": 1,
             "coverage": "33 main-chapter guides; selected main concepts, not full translation or full semantic verification; appendices and front/back matter have no separate guide",
             "topic_order": ["foundations", "tissues", "upper", "axial", "lower", "gait", "applied"],
             "units": units, "by_topic": dict(topic_units), "by_source": dict(sources), "by_term": dict(term_uses)}
    serialized = json.dumps(index, ensure_ascii=False, indent=2) + "\n"
    if write_index and not errors:
        INDEX.write_text(serialized, encoding="utf-8")
    else:
        require(INDEX.is_file() and INDEX.read_text(encoding="utf-8") == serialized, "Reading index is stale; run --write-index")
    checked_links = 0
    if html_root:
        pages = [html_root / u["path"] / "index.html" for u in units]
        pages += [html_root / "library" / b["slug"] / "index.html" for b in books.values()]
        pages += [html_root / "library/kinesiology/topics/index.html"]
        parsed = {}
        for path in pages:
            require(path.is_file(), f"Missing rendered page: {path}")
            if path.is_file():
                parsed[path] = Page(path.read_text(encoding="utf-8"))
        for path, page in parsed.items():
            require(len(page.ids) == len(set(page.ids)), f"Duplicate HTML anchor: {path}")
            for href in page.links:
                url = urlsplit(href)
                if url.scheme and url.scheme not in ("http", "https"):
                    continue
                if url.netloc and url.hostname not in ("127.0.0.1", "localhost", "hangsau.github.io"):
                    continue
                relative = unquote(url.path)
                if relative.startswith('/cortex/originals/'):
                    continue  # Separately exercised against the local server.
                if not relative:
                    target = path
                elif relative.startswith('/cortex/'):
                    target = html_root / relative[len('/cortex/'):]
                elif relative.startswith('/'):
                    errors.append(f"Deployment prefix missing: {href}")
                    continue
                else:
                    target = path.parent / relative
                if target.is_dir():
                    target /= "index.html"
                require(target.is_file(), f"Broken link in {path.name}: {href}")
                if target.is_file() and url.fragment and target.suffix == '.html':
                    other = parsed.get(target) or Page(target.read_text(encoding="utf-8"))
                    require(unquote(url.fragment) in other.ids, f"Broken anchor: {href}")
                checked_links += 1
        require(not (html_root / "originals").exists(), "Original pages must stay outside the public build")
    return {"chapters": len(units), "sections": sum(len(u["sections"]) for u in units), "chinese_characters": han_count,
            "terms": len(terms), "topics": len(topics), "cross_book_pairings": len(pairings), "checked_html_links": checked_links,
            "semantic_limit": index["coverage"], "errors": errors}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-index", action="store_true")
    parser.add_argument("--html", type=Path)
    args = parser.parse_args()
    result = check(args.write_index, args.html)
    REPORT.mkdir(parents=True, exist_ok=True)
    (REPORT / "reading-validation.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if result["errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
