#!/usr/bin/env python3
"""
sync_vortex.py — 把 TheVortexProject 內容同步進 my-site Hugo

用法：
  python tools/sync_vortex.py           # 執行同步
  python tools/sync_vortex.py --dry-run # 只報告差異，不寫入

狀態追蹤：tools/vortex_sync_state.json
  每個來源檔記錄 SHA-256，下次執行時比對是否有異動。
"""

import hashlib
import json
import re
import sys
from datetime import date
from pathlib import Path

# ── 路徑 ──
VORTEX_SRC  = Path(r"C:\claudehome\projects\TheVortexProject")
HUGO_ROOT   = Path(r"C:\claudehome\projects\my-site")
HUGO_VORTEX = HUGO_ROOT / "content" / "vortex"
STATE_FILE  = HUGO_ROOT / "tools" / "vortex_sync_state.json"

# ── Layer 設定 ──
LAYERS = {
    "Technica":     {"slug": "technica",     "name": "水感框架"},
    "Bridge":       {"slug": "bridge",       "name": "感知橋接"},
    "Instructional":{"slug": "instructional","name": "技術深探"},
}

# ── 檔名 → URL slug（明確對照，不自動猜） ──
SLUG_MAP = {
    # Technica
    "水感指南":              "water-sense-guide",
    "自由式水感框架":        "freestyle-water-sense",
    "仰式水感框架":          "backstroke-water-sense",
    "蛙式水感框架":          "breaststroke-water-sense",
    "蝶式水感框架":          "butterfly-water-sense",
    "技術指標_L級對應框架":  "technical-indicators-l-level",
    # Bridge
    "自由式感知橋接":        "freestyle-perception-bridge",
    "仰式感知橋接":          "backstroke-perception-bridge",
    "蛙式感知橋接":          "breaststroke-perception-bridge",
    "蝶式感知橋接":          "butterfly-perception-bridge",
    "水下蝶腳感知橋接":      "underwater-dolphin-kick-bridge",
    "出發轉身感知橋接":      "starts-turns-bridge",
    # Instructional
    "自由式深度技術分析":    "freestyle-technical-analysis",
    "自由式教學誤區深探":    "freestyle-teaching-errors",
    "仰式深度技術分析":      "backstroke-technical-analysis",
    "仰式教學誤區深探":      "backstroke-teaching-errors",
    "蛙式深度技術分析":      "breaststroke-technical-analysis",
    "蛙式教學誤區深探":      "breaststroke-teaching-errors",
    "蝶式深度技術分析":      "butterfly-technical-analysis",
    "蝶式教學誤區深探":      "butterfly-teaching-errors",
    "水下蝶腳技術分析":      "underwater-dolphin-kick-analysis",
    "水下蝶腳教學誤區深探":  "underwater-dolphin-kick-errors",
    "出發與轉身技術分析":    "starts-turns-technical-analysis",
    "出發與轉身教學誤區深探":"starts-turns-teaching-errors",
}

# ── Stroke 偵測（從檔名關鍵字推斷） ──
def detect_strokes(stem: str) -> list:
    strokes = []
    if "自由式" in stem:
        strokes.append("自由式")
    if "仰式" in stem:
        strokes.append("仰式")
    if "蛙式" in stem:
        strokes.append("蛙式")
    if "蝶式" in stem or "水下蝶腳" in stem:
        strokes.append("蝶式")
    if "水下蝶腳" in stem:
        strokes.append("水下蝶腳")
    if "出發" in stem or "轉身" in stem:
        strokes.append("出發與轉身")
    return strokes


def extract_title(content: str) -> str:
    for line in content.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return "Untitled"


def extract_description(content: str) -> str:
    """第一個 # 標題後第一個有意義的一行"""
    lines = content.splitlines()
    past_title = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("# ") and not past_title:
            past_title = True
            continue
        if not past_title:
            continue
        if not stripped or stripped == "---" or stripped == "---\n":
            continue
        # blockquote → 取第一句
        if stripped.startswith("> "):
            text = stripped[2:].strip()
            text = re.sub(r'[*_`]', '', text)
            text = text.split("。")[0] + ("。" if "。" in text else "")
            if len(text) > 6:
                return text[:160]
        # 跳過子標題
        if stripped.startswith("#"):
            continue
        # italic 行 (*text*)
        if stripped.startswith("*") and stripped.endswith("*") and len(stripped) > 4:
            text = stripped.strip("*").strip()
            text = re.sub(r'[*_`]', '', text)
            if len(text) > 6:
                return text[:160]
        # 普通段落
        if not stripped.startswith(">"):
            text = re.sub(r'[*_`\[\]]', '', stripped)
            if len(text) > 6:
                return text[:160]
    return ""


def strip_title_h1(content: str) -> str:
    """移除第一個 # 標題行（layout 已用 .Title 渲染），保留其餘內容"""
    lines = content.splitlines()
    result = []
    removed = False
    for line in lines:
        if not removed and line.startswith("# "):
            removed = True
            continue
        result.append(line)
    # 去掉標題後的前置空行
    while result and not result[0].strip():
        result.pop(0)
    return "\n".join(result)


def strip_existing_frontmatter(content: str) -> str:
    if content.startswith("---"):
        end = content.find("---", 3)
        if end != -1:
            return content[end + 3:].lstrip()
    return content


def build_frontmatter(title: str, description: str, slug: str,
                      layer: str, layer_name: str, strokes: list) -> str:
    lines = ["---"]
    lines.append(f'title: "{title}"')
    if description:
        esc = description.replace('"', '\\"')
        lines.append(f'description: "{esc}"')
    lines.append(f'slug: "{slug}"')
    lines.append(f'layer: "{layer}"')
    lines.append(f'layer_name: "{layer_name}"')
    if strokes:
        lines.append("strokes:")
        for s in strokes:
            lines.append(f'  - "{s}"')
    lines.append("draft: false")
    lines.append("---")
    return "\n".join(lines) + "\n\n"


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return {"files": {}}


def save_state(state: dict):
    STATE_FILE.write_text(
        json.dumps(state, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )


def main():
    dry_run = "--dry-run" in sys.argv
    results = {"new": [], "changed": [], "same": [], "unknown": []}

    state = load_state()
    files_state = state.setdefault("files", {})

    for layer_dir, layer_cfg in LAYERS.items():
        src_dir = VORTEX_SRC / layer_dir
        dst_dir = HUGO_VORTEX / layer_cfg["slug"]
        if not dry_run:
            dst_dir.mkdir(parents=True, exist_ok=True)

        for src_file in sorted(src_dir.glob("*.md")):
            stem = src_file.stem
            rel_key = f"{layer_dir}/{src_file.name}"

            slug = SLUG_MAP.get(stem)
            if slug is None:
                results["unknown"].append(rel_key)
                print(f"[WARN]    未知 slug，跳過：{rel_key}")
                continue

            dst_file = dst_dir / f"{slug}.md"
            cur_hash = file_hash(src_file)
            prev = files_state.get(rel_key, {})

            if not dst_file.exists():
                status = "new"
            elif prev.get("hash") != cur_hash:
                status = "changed"
            else:
                status = "same"

            results[status].append(rel_key)

            raw = src_file.read_text(encoding="utf-8")
            body = strip_existing_frontmatter(raw)
            title = extract_title(body)
            desc  = extract_description(body)
            body_no_h1 = strip_title_h1(body)

            if status == "same":
                print(f"[SAME]    {rel_key}")
                continue

            tag = "NEW" if status == "new" else "CHANGED"
            print(f"[{tag:7s}] {rel_key}")
            print(f"           title: {title}")
            print(f"           desc:  {desc[:80] if desc else '(none)'}")
            print(f"           slug:  {slug}  strokes: {detect_strokes(stem)}")
            print(f"           dest:  {dst_file.relative_to(HUGO_ROOT)}")

            if not dry_run:
                fm = build_frontmatter(
                    title=title, description=desc, slug=slug,
                    layer=layer_cfg["slug"], layer_name=layer_cfg["name"],
                    strokes=detect_strokes(stem),
                )
                dst_file.write_text(fm + body_no_h1, encoding="utf-8")
                files_state[rel_key] = {
                    "hash":      cur_hash,
                    "slug":      slug,
                    "dest":      str(dst_file.relative_to(HUGO_ROOT)),
                    "synced_at": str(date.today()),
                }

    if not dry_run:
        state["files"] = files_state
        save_state(state)

    print()
    print("=== 同步摘要 ===")
    print(f"  NEW:     {len(results['new'])}")
    print(f"  CHANGED: {len(results['changed'])}")
    print(f"  SAME:    {len(results['same'])}")
    if results["unknown"]:
        print(f"  UNKNOWN: {len(results['unknown'])} (未設定 slug，跳過)")
    if dry_run:
        print("  [dry-run，未實際寫入]")


if __name__ == "__main__":
    main()
