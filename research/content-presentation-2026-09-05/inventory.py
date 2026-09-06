"""Reproduce this research snapshot; reads site sources, writes only inventory.json.

Run from any directory: python -X utf8 PATH/TO/inventory.py
Requires the already installed PyYAML. No build, sync, network, or LLM calls.
This is a structural inventory, not a semantic audit or a publication gate.
"""
from collections import Counter
from datetime import datetime
import hashlib
import json
from pathlib import Path
import re
import subprocess

import yaml

OUT = Path(__file__).resolve().parent
ROOT = OUT.parent.parent


def relative(path):
    return path.relative_to(ROOT).as_posix()


def fingerprint(path):
    raw = path.read_bytes()
    return {"path": relative(path), "bytes": len(raw),
            "sha256": hashlib.sha256(raw).hexdigest()}


def load(path):
    return yaml.safe_load(path.read_text(encoding="utf-8-sig"))


pages = []
for path in sorted((ROOT / "content").rglob("*.md")):
    text = path.read_text(encoding="utf-8-sig")
    # Only whole-line delimiters; a description may itself contain '---'.
    front = re.match(r"\A---\s*\n(.*?)\n---\s*(?:\n|$)", text, re.S)
    if not front:
        raise ValueError(f"Unsupported front matter: {relative(path)}")
    meta = yaml.safe_load(front.group(1)) or {}
    body = text[front.end():].strip()
    pages.append({**fingerprint(path), "title": meta.get("title"),
                  "description": meta.get("description"),
                  "layout": meta.get("layout", "(default)"),
                  "draft": meta.get("draft", False),
                  "aliases": meta.get("aliases", []),
                  "body_chars": len(body),
                  "review_status": "metadata_only"})

documents = {}
data_files = []
for path in sorted((ROOT / "data").rglob("*.yaml")):
    doc = load(path)
    if not isinstance(doc, dict):
        raise ValueError(f"Expected mapping: {relative(path)}")
    documents[relative(path)] = doc
    group = path.parent.name
    owner = ("TheVortexProject; synced public view" if group in
             {"vortex", "adm", "breathing", "periodization", "movement"}
             else "my-site")
    data_files.append({**fingerprint(path), "owner": owner,
                       "top_level": {k: len(v) if isinstance(v, (list, dict))
                                     else type(v).__name__ for k, v in doc.items()},
                       "review_status": "structure_only"})

chapters = [d for p, d in documents.items() if re.search(r"/ch\d+\.yaml$", p)]
items = [i for d in chapters for t in d["topics"] for i in t["items"]]
registry = documents["data/vortex/source-registry.yaml"]["sources"]
home = documents["data/home.yaml"]
destinations = [e["url"] for d in home["domains"]
                for k in ("primary", "secondary") for e in d[k]]
destinations.append(home["footer_link"]["url"])
movement_keys = {"actions": "actions", "muscle-groups": "muscle_groups",
                 "stroke-demands": "demands", "interventions": "interventions"}
counts = {
    "content_markdown": len(pages), "data_yaml": len(data_files),
    "layout_html": len(list((ROOT / "layouts").rglob("*.html"))),
    "data_bytes": sum(d["bytes"] for d in data_files),
    "page_sections": dict(Counter(p["path"].split("/")[1]
                                  if p["path"] != "content/_index.md" else "home"
                                  for p in pages)),
    "declared_layouts": dict(Counter(p["layout"] for p in pages)),
    "empty_markdown_bodies": sum(p["body_chars"] == 0 for p in pages),
    "cscs_chapters": len(chapters),
    "cscs_topics": sum(len(d["topics"]) for d in chapters),
    "cscs_items": len(items), "cscs_cards": sum(len(d["cards"]) for d in chapters),
    "cscs_field_presence": {k: sum(bool(i.get(k)) for i in items) for k in
                            ("id", "q", "a", "detail", "terms", "numbers",
                             "related", "concepts", "locator")},
    "drills": len(documents["data/vortex/drills.yaml"]["drills"]),
    "technical_points": len(documents["data/vortex/technical-analysis.yaml"]["points"]),
    "teaching_errors": len(documents["data/vortex/teaching-errors.yaml"]["errors"]),
    "injuries": len(documents["data/vortex/injuries.yaml"]["injuries"]),
    "stroke_moves": sum(len(documents[f"data/vortex/{s}.yaml"]["moves"])
                        for s in ("free", "back", "breast", "fly", "udk", "starts-turns")),
    "movement": {name: len(documents[f"data/movement/{name}.yaml"][key])
                 for name, key in movement_keys.items()},
    "mnfl_techniques": sum(len(t["techniques"]) for t in documents["data/mnfl/techniques.yaml"]["themes"]),
    "ust_chapters": len(documents["data/ust/chapters.yaml"]["chapters"]),
    "ust_strategies": len(documents["data/ust/strategies.yaml"]["strategies"]),
    "quiz_child": len(documents["data/temperament/quiz.yaml"]["items_child"]),
    "quiz_self": len(documents["data/temperament/quiz.yaml"]["items_self"]),
    "source_registry": len(registry),
    "source_registry_status": dict(Counter(s.get("verification_status", "missing")
                                          for s in registry.values())),
    "home_domains": len(home["domains"]), "home_quick_actions": len(home["quick_actions"]),
    "home_distinct_destinations": len(set(destinations)),
}
context_files = [p for folder in ("layouts", "static", ".github")
                 for p in (ROOT / folder).rglob("*") if p.is_file()]
context_files += [ROOT / name for name in ("hugo.toml", "tools/sync_vortex.py")]
snapshot = {
    "schema_version": 1, "run_id": "content-presentation-2026-09-05",
    "generated_at": datetime.now().astimezone().isoformat(),
    "git_head": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
    "coverage": "All content/*.md and data/*.yaml recursively; metadata and structure only.",
    "limitations": ["No semantic completeness, live route, browser, or source-truth verification.",
                    "Empty Markdown may render substantial data/template content.",
                    "Counts use native collection units; do not sum them as unique knowledge.",
                    "Working-copy byte hashes include Windows line endings."],
    "counts": counts, "home_destinations": destinations,
    "pages": pages, "data_files": data_files,
    "presentation_inputs": [fingerprint(p) for p in sorted(context_files)],
}
target = OUT / "inventory.json"
target.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"output": relative(target), "counts": counts}, ensure_ascii=False, indent=2))
