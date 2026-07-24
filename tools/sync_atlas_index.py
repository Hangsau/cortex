#!/usr/bin/env python3
"""my-site consumer：把 knowledge-hub 產生的固定索引投影進 data/。

層級：atlas(canonical) -> knowledge-hub build_indexes(索引) -> **本站 consumer**。
本站只讀 hub 的 `reports/neurochem-index.json`（consumer 選定的固定 snapshot），
複製到 `data/neurochem/index.json` 供 Hugo layout 純渲染；本站**不讀任何 atlas 路徑**、
不改內容、不追浮動最新版（要換版就重跑本腳本選新 snapshot）。

用法：python tools/sync_atlas_index.py [--hub <knowledge-hub 路徑>]
"""
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITE_ROOT = HERE.parent
DEFAULT_HUB = SITE_ROOT.parent / "knowledge-hub"


def main(argv=None):
    ap = argparse.ArgumentParser(description="投影 knowledge-hub neurochem 索引進本站 data/")
    ap.add_argument("--hub", default=str(DEFAULT_HUB))
    args = ap.parse_args(argv)

    src = Path(args.hub) / "reports" / "neurochem-index.json"
    if not src.exists():
        raise SystemExit(f"[sync] 找不到 hub 索引：{src}\n"
                         f"       先在 knowledge-hub 跑 python tools/build_indexes.py")

    index = json.loads(src.read_text(encoding="utf-8"))
    manifest = index.get("manifest", {})

    dest_dir = SITE_ROOT / "data" / "neurochem"
    dest_dir.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, dest_dir / "index.json")

    state = {
        "synced_from": str(src),
        "source_commit": manifest.get("source_commit"),
        "content_hash": manifest.get("content_hash"),
        "generated_at": manifest.get("generated_at"),
        "project_id": manifest.get("project_id"),
        "learnable_claims": len(index.get("learnable_claims", [])),
    }
    (HERE / "atlas_sync_state.json").write_text(
        json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[sync] {state['project_id']} @ {str(state['source_commit'])[:10]}  "
          f"learnable={state['learnable_claims']}  -> data/neurochem/index.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
