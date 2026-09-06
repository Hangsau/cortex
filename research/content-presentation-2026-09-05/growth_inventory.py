"""Read-only growth study snapshot. Writes only growth-inventory.json beside this script.

Run: python -X utf8 research/content-presentation-2026-09-05/growth_inventory.py
Counts describe working files, not publication eligibility or completed translation.
No build, sync, network, model calls, or upstream mutations. Requires existing PyYAML.
"""
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess

import yaml

OUT = Path(__file__).resolve().parent
SITE = OUT.parent.parent
PROJECTS = SITE.parent
started = datetime.now(timezone.utc).isoformat()


def fingerprint(path):
    raw = path.read_bytes()
    return {"path": path.relative_to(PROJECTS).as_posix(), "bytes": len(raw),
            "sha256": hashlib.sha256(raw).hexdigest()}


def json_read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def git_head(path):
    result = subprocess.run(["git", "-C", str(path), "rev-parse", "HEAD"],
                            capture_output=True, text=True)
    return result.stdout.strip() if result.returncode == 0 else None


project_names = ["my-site", "TheVortexProject", "swim-coach", "knowledge-hub",
                 "psychology-knowledge-atlas", "neurochemistry-knowledge-atlas",
                 "chinese-classics-corpus", "religions-history",
                 "kinetic-chain-knowledge-atlas", "taiwan-k12-curriculum"]
documents = []
for name in project_names:
    for filename in ["CLAUDE.md", "HANDOFF.md", "MAP.md", "PLAN.md", "ROADMAP.md"]:
        path = PROJECTS / name / filename
        if path.is_file():
            documents.append(fingerprint(path))
for rel in [
    "TheVortexProject/RESEARCH_PLAN.md",
    "TheVortexProject/plans/recovery_integration_plancheck.md",
    "TheVortexProject/plans/骨關節動作肌群訓練伸展圖譜_plancheck.md",
    "TheVortexProject/plans/periodization_integration_plancheck.md",
    "swim-coach/plans/menu_generator_plan.md",
    "knowledge-hub/registry/projects.yaml",
    "chinese-classics-corpus/SCHEMA.md",
    "religions-history/STRATEGY.md",
    "religions-history/.implementation_site-v1-psych-tags.md",
    "religions-history/.implementation_roadmap-core518-site-v1.md",
]:
    documents.append(fingerprint(PROJECTS / rel))

corpora = {}
for name in ["chinese-classics-corpus", "religions-history"]:
    root = PROJECTS / name / "translations"
    meta_paths = sorted(root.glob("*/meta.json"))
    manifest = []
    states, languages, tiers = Counter(), Counter(), Counter()
    raw_files, annotations = [], []
    counts = Counter()
    for path in meta_paths:
        meta = json_read(path)
        manifest.append(fingerprint(path))
        states[str(meta.get("translation_status", "<missing>"))] += 1
        languages[str(meta.get("language", "<missing>"))] += 1
        tiers[str(meta.get("tier", "<missing>"))] += 1
        counts["alias_of_nonempty"] += bool(meta.get("alias_of"))
        translation = path.parent / "01-translation.md"
        counts["translation_file_nonempty"] += translation.exists() and translation.stat().st_size > 0
        counts["status_done_and_nonempty_file"] += (meta.get("translation_status") == "done"
                                                  and translation.exists() and translation.stat().st_size > 0)
        raw = path.parent / "raw" / "original.txt"
        if raw.exists():
            raw_files.append({"path": raw.relative_to(PROJECTS).as_posix(),
                              "bytes": raw.stat().st_size})
        annotation = path.parent / "annotations.json"
        if annotation.exists():
            data = json_read(annotation)
            if not isinstance(data, list):
                raise ValueError(f"Unexpected annotation shape: {annotation}")
            annotations.append(fingerprint(annotation))
            counts["annotation_records"] += len(data)
            for record in data:
                if "psych_domains" not in record:
                    counts["annotation_domains_missing"] += 1
                elif record["psych_domains"] is None:
                    counts["annotation_domains_null"] += 1
                elif record["psych_domains"] == []:
                    counts["annotation_domains_empty"] += 1
                else:
                    counts["annotation_domains_nonempty"] += 1
    manifest_digest = hashlib.sha256(json.dumps(manifest, sort_keys=True).encode()).hexdigest()
    annotation_digest = hashlib.sha256(json.dumps(annotations, sort_keys=True).encode()).hexdigest()
    corpora[name] = {
        "directory_count": sum(p.is_dir() for p in root.iterdir()),
        "meta_file_count": len(meta_paths), "counts": dict(counts),
        "translation_status": dict(states), "language_values": dict(languages), "tiers": dict(tiers),
        "raw_file_count": len(raw_files), "raw_bytes": sum(x["bytes"] for x in raw_files),
        "largest_raw_files": sorted(raw_files, key=lambda x: (-x["bytes"], x["path"]))[:5],
        "annotation_file_count": len(annotations), "meta_manifest_sha256": manifest_digest,
        "annotation_manifest_sha256": annotation_digest,
        "limitations": ["Raw files measured by filesystem bytes; not fully read or validated.",
                        "Translation presence/status is not completeness, quality, rights, or publication approval.",
                        "Sequential working-tree snapshot; upstream jobs may change files during collection."]}

cscs_samples = []
for path in sorted((SITE / "data" / "cscs").glob("ch*.yaml")):
    chapter = yaml.safe_load(path.read_text(encoding="utf-8-sig"))
    items = [item for topic in chapter["topics"] for item in topic["items"]]
    cscs_samples.append({**fingerprint(path), "chapter": chapter["title"],
                         "sample_ids": [items[0]["id"], items[-1]["id"]],
                         "selection": "first and last item in source order; questions and answer excerpts inspected",
                         "limitations": "Boundary sample only; not representative semantic audit or evidence verification."})

profiles = []
for path in sorted((PROJECTS / "psychology-knowledge-atlas" / "views" / "specs").glob("*.json")):
    data = json_read(path)
    profiles.append({**fingerprint(path), "id": data.get("id"),
                     "sections": [{"id": s.get("id"), "title": s.get("title")}
                                  for s in data.get("sections", [])]})

sample_files = []
for rel in ["neurochemistry-knowledge-atlas/articles/dopamine.md",
            "chinese-classics-corpus/translations/sunzi-bingfa/meta.json",
            "chinese-classics-corpus/translations/sunzi-bingfa/annotations.json",
            "religions-history/translations/dhammapada/meta.json",
            "swim-coach/rules/menu_rules.yaml",
            "TheVortexProject/.github/workflows/notify-mysite.yml"]:
    sample_files.append(fingerprint(PROJECTS / rel))

result = {
    "schema_version": 1, "run_id": "content-presentation-2026-09-05-growth",
    "started_at_utc": started, "finished_at_utc": datetime.now(timezone.utc).isoformat(),
    "project_heads": {name: git_head(PROJECTS / name) for name in project_names},
    "documents": documents, "document_read_depth": "Recent sections, plans, indexes and targeted passages; fingerprints do not imply full reading.",
    "corpora": corpora, "cscs_boundary_samples": cscs_samples,
    "psychology_reader_profiles": profiles, "sample_files": sample_files,
    "integration_probes": {rel: (PROJECTS / rel).exists() for rel in [
        "TheVortexProject/canonical/recovery", "swim-coach/rules/menu_rules.yaml",
        "my-site/data/menu_rules.yaml", "religions-history/site"]},
}
target = OUT / "growth-inventory.json"
target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"output": str(target), "documents": len(documents),
                  "cscs_sample_count": sum(len(s["sample_ids"]) for s in cscs_samples),
                  "corpora": {k: {a: v[a] for a in ["meta_file_count", "raw_bytes", "annotation_file_count", "counts"]}
                              for k, v in corpora.items()}}, ensure_ascii=False, indent=2))
