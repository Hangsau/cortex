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
import os
import re
import sys
from datetime import date
from pathlib import Path

import yaml

# ── 路徑 ──
# 預設本機 Windows 路徑；CI 透過 VORTEX_SRC / HUGO_ROOT env var 覆寫
VORTEX_SRC  = Path(os.environ.get("VORTEX_SRC", r"C:\claudehome\projects\TheVortexProject"))
HUGO_ROOT   = Path(os.environ.get("HUGO_ROOT",  r"C:\claudehome\projects\my-site"))
HUGO_VORTEX = HUGO_ROOT / "content" / "vortex"
STATE_FILE  = HUGO_ROOT / "tools" / "vortex_sync_state.json"

# ── Drills 合併（canonical → my-site 單檔） ──
DRILL_STROKES = ["freestyle", "backstroke", "breaststroke", "butterfly", "sculling", "udk", "starts-turns"]
DRILL_SRC_DIR = VORTEX_SRC / "Drills"
DRILL_DST     = HUGO_ROOT / "data" / "vortex" / "drills.yaml"

# ── 教學誤區（canonical 兩層 → my-site 只 public） ──
TEACHING_ERRORS_SRC = VORTEX_SRC / "canonical" / "instructional" / "teaching-errors.yaml"
TEACHING_ERRORS_DST = HUGO_ROOT / "data" / "vortex" / "teaching-errors.yaml"

# ── 技術分析（canonical → my-site；全 public，diagnostic 仍剝離保險） ──
TECH_ANALYSIS_SRC = VORTEX_SRC / "canonical" / "instructional" / "technical-analysis.yaml"
TECH_ANALYSIS_DST = HUGO_ROOT / "data" / "vortex" / "technical-analysis.yaml"

# ── 來源註冊表（canonical → my-site；只匯出公開白名單欄位，internal notes 不帶） ──
SOURCES_SRC = VORTEX_SRC / "canonical" / "_sources.yaml"
SOURCES_DST = HUGO_ROOT / "data" / "vortex" / "source-registry.yaml"

# ── L 指標矩陣（canonical 兩層 → my-site 只 public） ──
L_INDICATORS_SRC = VORTEX_SRC / "canonical" / "technica" / "l-indicators.yaml"
L_INDICATORS_DST = HUGO_ROOT / "data" / "vortex" / "l-indicators.yaml"

# ── 水感層級（canonical 多層 → my-site 只 public） ──
WATER_SENSE_LEVELS_SRC = VORTEX_SRC / "canonical" / "technica" / "water-sense-levels.yaml"
WATER_SENSE_LEVELS_DST = HUGO_ROOT / "data" / "vortex" / "water-sense-levels.yaml"

# ── ADM 發展矩陣（canonical 兩層 → my-site data/adm，只 public） ──
ADM_MATRIX_SRC = VORTEX_SRC / "canonical" / "development" / "matrix.yaml"
ADM_MATRIX_DST = HUGO_ROOT / "data" / "adm" / "matrix.yaml"

# ── ADM 技術基準（canonical 兩層 → my-site data/adm，只 public） ──
ADM_STANDARDS_SRC = VORTEX_SRC / "canonical" / "development" / "technical-standards.yaml"
ADM_STANDARDS_DST = HUGO_ROOT / "data" / "adm" / "standards.yaml"

# ── 週期化（canonical → my-site data/periodization；全 public，無 diagnostic 層） ──
PERIODIZATION_SRC_DIR = VORTEX_SRC / "canonical" / "periodization"
PERIODIZATION_DST_DIR = HUGO_ROOT / "data" / "periodization"
PERIODIZATION_FILES   = ["structure", "taper", "zones", "dryland", "_index"]

# ── 心理層（canonical 兩層 → my-site 只 public） ──
PSYCHOLOGY_SRC = VORTEX_SRC / "canonical" / "psychology" / "psychology.yaml"
PSYCHOLOGY_DST = HUGO_ROOT / "data" / "vortex" / "psychology.yaml"

# ── 運動傷害（canonical promoted artifact → my-site；剝除內部 QA 旗標） ──
INJURIES_SRC = VORTEX_SRC / "canonical" / "health" / "injuries.yaml"
INJURIES_DST = HUGO_ROOT / "data" / "vortex" / "injuries.yaml"

# ── 呼吸（canonical 章節目錄 → my-site data/breathing；全 public，無 diagnostic 層） ──
# safety 列首：缺氧昏迷是讀其他節點的前提，渲染時必置頂
BREATHING_SRC_DIR = VORTEX_SRC / "canonical" / "breathing"
BREATHING_DST_DIR = HUGO_ROOT / "data" / "breathing"
BREATHING_FILES   = ["safety", "framework", "physiology", "training", "regulation", "_index"]

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

# ── 自訂 layout 對照（slug → layout）──
# 預設 content 走 Hugo lookup（vortex/single.html，純 markdown 渲染）。
# 已設計成 master-detail 的頁面在此指定專屬 layout，body 由 layout 接管，
# .Content 不再使用。sync 重跑時這裡會把 layout 欄位寫回 frontmatter，
# 避免覆蓋掉手動設定。
LAYOUT_MAP = {
    "water-sense-guide": "vortex-water-sense",
}

# ── 自訂標題對照（slug → title）──
# canonical markdown 的 H1 標題若與公開站想呈現的不同，在此覆寫。
TITLE_OVERRIDE = {
    "water-sense-guide": "什麼是水感",
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
                      layer: str, layer_name: str, strokes: list,
                      layout: str = "") -> str:
    lines = ["---"]
    lines.append(f'title: "{title}"')
    if description:
        esc = description.replace('"', '\\"')
        lines.append(f'description: "{esc}"')
    lines.append(f'slug: "{slug}"')
    lines.append(f'layer: "{layer}"')
    lines.append(f'layer_name: "{layer_name}"')
    if layout:
        lines.append(f'layout: "{layout}"')
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


def sync_drills(dry_run: bool):
    """讀 5 個 canonical drills_*.yaml，依 stroke 順序合併成 my-site 單檔 drills.yaml。

    canonical 是 single source of truth；本函式只搬運，不改內容。
    輸出沿用 my-site 既有 block-style（PyYAML 預設 block dump 即對齊），
    並把 canonical 新增的 how_to 欄位一併帶過。

    categories 取自 Drills/_categories.yaml（drills 標籤的單一真相源），
    與 teaching-errors / technical-analysis 同一模式；layout 不得硬編副本。
    """
    cat_data = yaml.safe_load(
        (DRILL_SRC_DIR / "_categories.yaml").read_text(encoding="utf-8")
    ) or {}

    all_drills = []
    per_stroke = []
    for stroke in DRILL_STROKES:
        src = DRILL_SRC_DIR / f"drills_{stroke}.yaml"
        data = yaml.safe_load(src.read_text(encoding="utf-8"))
        drills = (data or {}).get("drills", []) or []
        per_stroke.append((stroke, len(drills)))
        all_drills.extend(drills)

    howto_count = sum(1 for d in all_drills if d.get("how_to"))

    print()
    print("=== Drills 合併 ===")
    for stroke, n in per_stroke:
        print(f"  {stroke:12s} {n}")
    print(f"  TOTAL        {len(all_drills)}  (how_to: {howto_count})")
    print(f"  categories   {len(cat_data.get('categories') or [])}")

    if dry_run:
        print("  [dry-run，未寫入 drills.yaml]")
        return

    out = yaml.safe_dump(
        {"categories": cat_data.get("categories", []) or [], "drills": all_drills},
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False,
        width=4096,
    )
    DRILL_DST.write_text(out, encoding="utf-8")
    print(f"  寫入 {DRILL_DST.relative_to(HUGO_ROOT)}")


def sync_teaching_errors(dry_run: bool):
    """讀 canonical teaching-errors.yaml（兩層），剝除 diagnostic 層，
    只把 public 層寫進 my-site data/vortex/teaching-errors.yaml。

    公開/診斷鐵則：A/B/C 三型診斷只在 swim-coach，不上公開站。
    本函式是公開站的最後一道剝離保險——即使 canonical 寫了 diagnostic，
    這裡也不會帶過去。
    """
    if not TEACHING_ERRORS_SRC.exists():
        print()
        print("=== 教學誤區 ===")
        print(f"  [跳過] 找不到 {TEACHING_ERRORS_SRC}")
        return

    data = yaml.safe_load(TEACHING_ERRORS_SRC.read_text(encoding="utf-8")) or {}
    errors_in = data.get("errors", []) or []

    errors_out = []
    for e in errors_in:
        pub = e.get("public", {}) or {}
        rec = {
            "id":       e.get("id"),
            "stroke":   e.get("stroke"),
            "category": e.get("category"),
            "title":    e.get("title"),
        }
        rec.update(pub)          # 只帶 public 欄位，diagnostic 整塊不取
        errors_out.append(rec)

    out_data = {
        "categories": data.get("categories", []),
        "errors":     errors_out,
    }

    by_stroke = {}
    for e in errors_out:
        by_stroke[e["stroke"]] = by_stroke.get(e["stroke"], 0) + 1

    print()
    print("=== 教學誤區（public 層）===")
    for s, n in sorted(by_stroke.items()):
        print(f"  {s:14s} {n}")
    print(f"  TOTAL          {len(errors_out)}")

    if dry_run:
        print("  [dry-run，未寫入 teaching-errors.yaml]")
        return

    out = yaml.safe_dump(
        out_data,
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False,
        width=4096,
    )
    TEACHING_ERRORS_DST.write_text(out, encoding="utf-8")
    print(f"  寫入 {TEACHING_ERRORS_DST.relative_to(HUGO_ROOT)}")


def sync_technical_analysis(dry_run: bool):
    """讀 canonical technical-analysis.yaml，剝除 diagnostic 層（若有），
    只把 public 層寫進 my-site data/vortex/technical-analysis.yaml。

    技術分析屬物理/生物力學內容，原則上全 public；此函式仍做剝離保險，
    與 sync_teaching_errors 對齊——canonical 即使誤寫 diagnostic 也不會帶過去。
    """
    if not TECH_ANALYSIS_SRC.exists():
        print()
        print("=== 技術分析 ===")
        print(f"  [跳過] 找不到 {TECH_ANALYSIS_SRC}")
        return

    data = yaml.safe_load(TECH_ANALYSIS_SRC.read_text(encoding="utf-8")) or {}
    points_in = data.get("points", []) or []

    points_out = []
    for p in points_in:
        pub = p.get("public", {}) or {}
        rec = {
            "id":       p.get("id"),
            "stroke":   p.get("stroke"),
            "category": p.get("category"),
            "title":    p.get("title"),
        }
        if p.get("also_strokes"):
            rec["also_strokes"] = p["also_strokes"]
        if p.get("joint_region"):
            rec["joint_region"] = p["joint_region"]
        if p.get("nav_zh"):
            rec["nav_zh"] = p["nav_zh"]
        rec.update(pub)          # 只帶 public 欄位，diagnostic 整塊不取
        points_out.append(rec)

    out_data = {
        "categories":    data.get("categories", []),
        "joint_regions": data.get("joint_regions", []),
        "points":        points_out,
    }

    by_stroke = {}
    for p in points_out:
        by_stroke[p["stroke"]] = by_stroke.get(p["stroke"], 0) + 1

    print()
    print("=== 技術分析（public 層）===")
    for s, n in sorted(by_stroke.items()):
        print(f"  {s:14s} {n}")
    print(f"  TOTAL          {len(points_out)}")

    if dry_run:
        print("  [dry-run，未寫入 technical-analysis.yaml]")
        return

    out = yaml.safe_dump(
        out_data,
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False,
        width=4096,
    )
    TECH_ANALYSIS_DST.write_text(out, encoding="utf-8")
    print(f"  寫入 {TECH_ANALYSIS_DST.relative_to(HUGO_ROOT)}")


# 來源註冊表公開白名單：只有列在這裡的欄位會進公開站。
# 用白名單而非黑名單，因為 canonical 之後可能新增內部欄位——
# 黑名單（如 del rec["notes"]）擋不住還沒被想到的欄位。
PUBLIC_SOURCE_FIELDS = (
    "id", "display", "type", "verification_status",
    "title", "authors", "et_al", "year", "container",
    "identifier", "url", "retrieved_on",
)


def _source_link(rec: dict) -> str:
    """算出一筆來源的可點連結；沒有可解析的識別碼時回空字串。

    順序固定，第一個命中就用：頂層 url → identifier.url → doi → pmcid → pmid。
    只有 ISBN 的書回空字串是正常狀態——不去拼書店 / Google Books 網址，那是編造。
    """
    if rec.get("url"):
        return str(rec["url"])
    ident = rec.get("identifier") or {}
    if not isinstance(ident, dict):
        return ""
    if ident.get("url"):
        return str(ident["url"])
    if ident.get("doi"):
        return f"https://doi.org/{ident['doi']}"
    if ident.get("pmcid"):
        return f"https://pmc.ncbi.nlm.nih.gov/articles/{ident['pmcid']}/"
    if ident.get("pmid"):
        return f"https://pubmed.ncbi.nlm.nih.gov/{ident['pmid']}/"
    return ""


def sync_source_registry(dry_run: bool):
    """讀 canonical _sources.yaml，只取公開白名單欄位，
    輸出成以 id 為 key 的 mapping 進 my-site data/vortex/source-registry.yaml。

    公開/內部鐵則：canonical 的 notes 是維護者裁決註記（適用範圍、「不是泳者來源」、
    計數更正這類判斷），絕不進公開站。本函式用白名單 PUBLIC_SOURCE_FIELDS 過濾——
    canonical 新增任何內部欄位都不會無聲外洩。

    link 在此層算好（doi / pmcid / pmid / url 五路優先序），Hugo template 不做分支；
    算不出來就不寫 link 這個 key（只有 ISBN 的書即屬此類）。
    輸出 map 而非 list，讓 layout 能 `index $reg "src.xxx"` 直接查。
    """
    if not SOURCES_SRC.exists():
        print()
        print("=== 來源註冊表 ===")
        print(f"  [跳過] 找不到 {SOURCES_SRC}")
        return

    data = yaml.safe_load(SOURCES_SRC.read_text(encoding="utf-8")) or {}
    srcs_in = data.get("sources", []) or []

    sources_out = {}
    for s in srcs_in:
        sid = s.get("id")
        if not sid:
            print(f"  [WARN] 來源缺 id，跳過：{str(s.get('display'))[:60]}")
            continue
        if sid in sources_out:
            print(f"  [WARN] 來源 id 重複，保留第一筆：{sid}")
            continue
        rec = {k: s[k] for k in PUBLIC_SOURCE_FIELDS if k in s}
        link = _source_link(s)
        if link:
            rec["link"] = link
        sources_out[sid] = rec

    out_data = {
        "schema_version": 2,
        "generated_from": "canonical/_sources.yaml",
    }
    if data.get("generated_date"):
        out_data["generated_date"] = str(data["generated_date"])
    out_data["sources"] = sources_out

    n_verified   = sum(1 for r in sources_out.values() if r.get("verification_status") == "verified")
    n_unverified = sum(1 for r in sources_out.values() if r.get("verification_status") == "unverified")
    n_link       = sum(1 for r in sources_out.values() if r.get("link"))

    print()
    print("=== 來源註冊表（公開白名單）===")
    print(f"  verified       {n_verified}")
    print(f"  unverified     {n_unverified}")
    print(f"  有連結         {n_link}")
    print(f"  TOTAL          {len(sources_out)}")

    if dry_run:
        print("  [dry-run，未寫入 data/vortex/source-registry.yaml]")
        return

    out = yaml.safe_dump(
        out_data,
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False,
        width=4096,
    )
    SOURCES_DST.write_text(out, encoding="utf-8")
    print(f"  寫入 {SOURCES_DST.relative_to(HUGO_ROOT)}")


def sync_l_indicators(dry_run: bool):
    """讀 canonical l-indicators.yaml（兩層），剝除每格的 diagnostic 層，
    只把 public 層寫進 my-site data/vortex/l-indicators.yaml。

    公開/診斷鐵則：失效訊號（failure_signal）與 A/B/C 三型（type）只在 swim-coach，
    不上公開站。本函式是公開站最後一道剝離保險——levels / strokes / 每格 public /
    usage_boundaries 帶過去，indicators 的 diagnostic 整塊不取。
    """
    if not L_INDICATORS_SRC.exists():
        print()
        print("=== L 指標矩陣 ===")
        print(f"  [跳過] 找不到 {L_INDICATORS_SRC}")
        return

    data = yaml.safe_load(L_INDICATORS_SRC.read_text(encoding="utf-8")) or {}
    inds_in = data.get("indicators", []) or []

    inds_out = []
    for i in inds_in:
        pub = i.get("public", {}) or {}
        rec = {
            "id":     i.get("id"),
            "stroke": i.get("stroke"),
            "level":  i.get("level"),
            "aspect": i.get("aspect"),
        }
        rec.update(pub)          # 只帶 public 欄位，diagnostic 整塊不取
        inds_out.append(rec)

    out_data = {
        "levels":           data.get("levels", []),
        "strokes":          data.get("strokes", []),
        "indicators":       inds_out,
        "usage_boundaries": data.get("usage_boundaries", []),
    }

    by_stroke = {}
    for i in inds_out:
        by_stroke[i["stroke"]] = by_stroke.get(i["stroke"], 0) + 1

    print()
    print("=== L 指標矩陣（public 層）===")
    for s, n in sorted(by_stroke.items()):
        print(f"  {s:14s} {n}")
    print(f"  TOTAL          {len(inds_out)}")

    if dry_run:
        print("  [dry-run，未寫入 l-indicators.yaml]")
        return

    out = yaml.safe_dump(
        out_data,
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False,
        width=4096,
    )
    L_INDICATORS_DST.write_text(out, encoding="utf-8")
    print(f"  寫入 {L_INDICATORS_DST.relative_to(HUGO_ROOT)}")


def sync_water_sense_levels(dry_run: bool):
    """讀 canonical water-sense-levels.yaml（多層），剝除每個 level 的 diagnostic 層，
    只把 public 層寫進 my-site data/vortex/water-sense-levels.yaml。

    公開/診斷鐵則：三型診斷（three_types、diagnostic.*、stagnation_by_type）只在
    swim-coach，不上公開站。本函式是公開站最後一道剝離保險——strokes / 每個 level 的
    id/stroke/level/name_zh/tagline + public 帶過去；three_types、appendices、
    每 level 的 diagnostic 整塊不取。
    """
    if not WATER_SENSE_LEVELS_SRC.exists():
        print()
        print("=== 水感層級 ===")
        print(f"  [跳過] 找不到 {WATER_SENSE_LEVELS_SRC}")
        return

    data = yaml.safe_load(WATER_SENSE_LEVELS_SRC.read_text(encoding="utf-8")) or {}
    levels_in = data.get("levels", []) or []

    levels_out = []
    for lv in levels_in:
        pub = lv.get("public", {}) or {}
        rec = {
            "id":      lv.get("id"),
            "stroke":  lv.get("stroke"),
            "level":   lv.get("level"),
            "name_zh": lv.get("name_zh"),
            "tagline": lv.get("tagline"),
        }
        rec.update(pub)          # 只帶 public 欄位，diagnostic / three_types 整塊不取
        levels_out.append(rec)

    out_data = {
        "strokes": data.get("strokes", []),
        "levels":  levels_out,
    }

    by_stroke = {}
    for lv in levels_out:
        by_stroke[lv["stroke"]] = by_stroke.get(lv["stroke"], 0) + 1

    print()
    print("=== 水感層級（public 層）===")
    for s, n in sorted(by_stroke.items()):
        print(f"  {s:14s} {n}")
    print(f"  TOTAL          {len(levels_out)}")

    if dry_run:
        print("  [dry-run，未寫入 water-sense-levels.yaml]")
        return

    out = yaml.safe_dump(
        out_data,
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False,
        width=4096,
    )
    WATER_SENSE_LEVELS_DST.write_text(out, encoding="utf-8")
    print(f"  寫入 {WATER_SENSE_LEVELS_DST.relative_to(HUGO_ROOT)}")


def sync_adm_matrix(dry_run: bool):
    """讀 canonical development/matrix.yaml（cells 兩層），剝除 diagnostic 層，
    把 public 層還原成 adm-matrix.html 現讀格式寫進 my-site data/adm/matrix.yaml。

    canonical 是 single source of truth；本函式只搬運 public，不改內容。
    輸出結構：pillars[].{id, name, icon, stages[].{id, summary, points}}
      - pillar 順序依 canonical pillars 清單（physical/technical/mental/life）
      - stage 只取 has_cells:true（l2t/t2t/t2c/t2w）；FUN(has_cells:false) 整階段不出（邊界）
      - cell 只帶 public.{summary,points}，diagnostic / links 整塊不取
    """
    if not ADM_MATRIX_SRC.exists():
        print()
        print("=== ADM 發展矩陣 ===")
        print(f"  [跳過] 找不到 {ADM_MATRIX_SRC}")
        return

    data = yaml.safe_load(ADM_MATRIX_SRC.read_text(encoding="utf-8")) or {}
    pillars_in = data.get("pillars", []) or []
    stages_in  = data.get("stages", []) or []
    cells_in   = data.get("cells", []) or []

    # 只保留有內容的 stage，依 canonical 順序（FUN has_cells:false 排除）
    stage_keys = [s["key"] for s in stages_in if s.get("has_cells")]

    # 以 (pillar, stage) 索引 cell
    by_ps = {(c.get("pillar"), c.get("stage")): c for c in cells_in}

    pillars_out = []
    for p in pillars_in:
        pkey = p.get("key")
        stages_out = []
        for skey in stage_keys:
            cell = by_ps.get((pkey, skey))
            if cell is None:
                continue   # 該支柱該階段無 cell（理論上 16 格全滿，防呆）
            pub = cell.get("public", {}) or {}
            stages_out.append({
                "id":      skey,
                "summary": pub.get("summary", ""),
                "points":  pub.get("points", []) or [],
            })
        pillars_out.append({
            "id":     pkey,
            "name":   p.get("name_zh"),
            "icon":   p.get("icon"),
            "stages": stages_out,
        })

    print()
    print("=== ADM 發展矩陣（public 層）===")
    for p in pillars_out:
        print(f"  {p['id']:10s} stages={len(p['stages'])}")
    total_cells = sum(len(p["stages"]) for p in pillars_out)
    print(f"  TOTAL cells    {total_cells}  (stages/pillar: {len(stage_keys)})")

    if dry_run:
        print("  [dry-run，未寫入 data/adm/matrix.yaml]")
        return

    out = yaml.safe_dump(
        {"pillars": pillars_out},
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False,
        width=4096,
    )
    ADM_MATRIX_DST.write_text(out, encoding="utf-8")
    print(f"  寫入 {ADM_MATRIX_DST.relative_to(HUGO_ROOT)}")


def sync_adm_standards(dry_run: bool):
    """讀 canonical development/technical-standards.yaml（std 兩層），剝除 diagnostic 層，
    把 public 層寫進 my-site data/adm/standards.yaml（結構化技術基準）。

    公開/診斷鐵則：diagnostic 整塊不取（ADM 技術基準 diagnostic 原則為 null，
    此函式仍做剝離保險）。framework / applies_note 頂層帶過去。

    註：appendix-a.md（手寫散文，含左右鏡像分節）不由本函式改動——canonical std
    為左右合併的有損表示，回寫散文會更動既有頁面。本函式只產出結構化 data 檔，
    appendix-a.md 維持原狀直到另建結構化技術基準頁（見 HANDOFF 待決）。
    """
    if not ADM_STANDARDS_SRC.exists():
        print()
        print("=== ADM 技術基準 ===")
        print(f"  [跳過] 找不到 {ADM_STANDARDS_SRC}")
        return

    data = yaml.safe_load(ADM_STANDARDS_SRC.read_text(encoding="utf-8")) or {}
    stds_in = data.get("standards", []) or []

    stds_out = []
    for s in stds_in:
        pub = s.get("public", {}) or {}
        rec = {"id": s.get("id")}
        rec.update(pub)          # 只帶 public 欄位，diagnostic / links 整塊不取
        stds_out.append(rec)

    out_data = {
        "framework":    data.get("framework"),
        "applies_note": data.get("applies_note"),
        "standards":    stds_out,
    }

    print()
    print("=== ADM 技術基準（public 層）===")
    print(f"  TOTAL standards {len(stds_out)}")

    if dry_run:
        print("  [dry-run，未寫入 data/adm/standards.yaml]")
        return

    out = yaml.safe_dump(
        out_data,
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False,
        width=4096,
    )
    ADM_STANDARDS_DST.write_text(out, encoding="utf-8")
    print(f"  寫入 {ADM_STANDARDS_DST.relative_to(HUGO_ROOT)}")


def sync_periodization(dry_run: bool):
    """讀 canonical periodization/{structure,taper,zones}.yaml，搬進 my-site
    data/periodization/。

    週期化是已出版的公開知識（Bompa 教科書），canonical 無 public/diagnostic 分層，
    全部可公開——本函式整檔搬運，不剝離、不改內容。canonical 是 single source of truth。
    每檔保留 domain/sub/cert/source/swim_application 等欄位供 layout 取用與標記呈現。
    """
    print()
    print("=== 週期化（全 public）===")
    if not PERIODIZATION_SRC_DIR.exists():
        print(f"  [跳過] 找不到 {PERIODIZATION_SRC_DIR}")
        return

    if not dry_run:
        PERIODIZATION_DST_DIR.mkdir(parents=True, exist_ok=True)

    for name in PERIODIZATION_FILES:
        src = PERIODIZATION_SRC_DIR / f"{name}.yaml"
        if not src.exists():
            print(f"  [跳過] 找不到 {src.name}")
            continue
        data = yaml.safe_load(src.read_text(encoding="utf-8")) or {}
        top_keys = [k for k in data.keys() if k not in ("domain", "sub", "schema_version", "source_repos")]
        print(f"  {name:10s} top-level: {', '.join(top_keys)}")

        if dry_run:
            continue

        dst = PERIODIZATION_DST_DIR / f"{name}.yaml"
        out = yaml.safe_dump(
            data,
            allow_unicode=True,
            default_flow_style=False,
            sort_keys=False,
            width=4096,
        )
        dst.write_text(out, encoding="utf-8")
        print(f"             寫入 {dst.relative_to(HUGO_ROOT)}")

    if dry_run:
        print("  [dry-run，未寫入 data/periodization/]")


def sync_psychology(dry_run: bool):
    """讀 canonical psychology.yaml（theme→concept，每概念兩層），剝除 diagnostic 層，
    只把 public 層寫進 my-site data/vortex/psychology.yaml。

    公開/診斷鐵則：「泳者說 X → 判斷」的判讀訊號（reading_signals / probe）、三型對應
    （abc_link）只在 swim-coach，不上公開站。本函式是公開站最後一道剝離保險——
    theme 的 id/name_zh/order/premise(public) 與每個 concept 的 id/name_zh/order + public
    帶過去；concept 的 diagnostic 整塊不取。
    """
    if not PSYCHOLOGY_SRC.exists():
        print()
        print("=== 心理層 ===")
        print(f"  [跳過] 找不到 {PSYCHOLOGY_SRC}")
        return

    data = yaml.safe_load(PSYCHOLOGY_SRC.read_text(encoding="utf-8")) or {}
    themes_in = data.get("themes", []) or []

    themes_out = []
    total_concepts = 0
    for t in themes_in:
        concepts_out = []
        for c in t.get("concepts", []) or []:
            pub = c.get("public", {}) or {}
            rec = {
                "id":      c.get("id"),
                "name_zh": c.get("name_zh"),
                "nav_zh":  c.get("nav_zh"),    # 短導航標籤（左欄用，可掃讀）
                "order":   c.get("order"),
                "status":  c.get("status"),
            }
            rec.update(pub)          # 只帶 public 欄位，diagnostic 整塊不取
            concepts_out.append(rec)
        total_concepts += len(concepts_out)
        themes_out.append({
            "id":            t.get("id"),
            "name_zh":       t.get("name_zh"),
            "nav_zh":        t.get("nav_zh"),     # 短導航標籤（左欄用）
            "when_zh":       t.get("when_zh"),    # 處境線：什麼狀況該讀這個（左欄白話副標）
            "order":         t.get("order"),
            "status":        t.get("status"),
            "band":          t.get("band"),          # 三帶定位：初學端 / 貫穿全程 / 進階競技端
            "l_band":        t.get("l_band"),         # L 範圍（如 L0–L2）
            "level_tag":     t.get("level_tag"),      # 分級標籤（初學 / 全程 / 進階·競技）
            "concept_count": t.get("concept_count"),  # planned 主題沒有 concepts，用這個顯示數量
            "lead_zh":       t.get("lead_zh"),        # READ 模式章首白話導引（敘事黏合層）
            "bridge_zh":     t.get("bridge_zh"),      # READ 模式章尾橋接到下一章
            "premise":       t.get("premise"),        # premise 本身即 public 層
            "concepts":      concepts_out,
        })

    out_data = {
        "domain":      data.get("domain"),
        "domain_name_zh": data.get("domain_name_zh"),
        "intro_zh":    data.get("intro_zh"),   # READ 模式序章（敘事黏合層，domain 頂層）
        "outro_zh":    data.get("outro_zh"),   # READ 模式尾聲
        "themes":      themes_out,
    }

    print()
    print("=== 心理層（public 層）===")
    for t in themes_out:
        print(f"  {t['name_zh']:10s} concepts={len(t['concepts'])}")
    print(f"  TOTAL concepts {total_concepts}")

    if dry_run:
        print("  [dry-run，未寫入 data/vortex/psychology.yaml]")
        return

    out = yaml.safe_dump(
        out_data,
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False,
        width=4096,
    )
    PSYCHOLOGY_DST.write_text(out, encoding="utf-8")
    print(f"  寫入 {PSYCHOLOGY_DST.relative_to(HUGO_ROOT)}")


def _strip_injury(rec):
    """剝除內部 QA 層：去掉 audit（內部稽核）與 flags.pending_verification
    （未驗證數字，鐵則不進 public）。保留 flags.contested + vintage_warning
    （誠實揭露學界分歧，對公眾有教育價值）。其餘欄位皆屬公開衛教內容。
    """
    out = {k: v for k, v in rec.items() if k != "audit"}
    fl = out.get("flags")
    if isinstance(fl, dict):
        out["flags"] = {k: v for k, v in fl.items() if k != "pending_verification"}
    return out


def sync_injuries(dry_run: bool):
    """讀 canonical health/injuries.yaml（promoted artifact），剝除內部 QA 旗標，
    寫進 my-site data/vortex/injuries.yaml。

    公開鐵則：pending_verification 內的未驗證數字不進公開站；audit 內部欄位剝除。
    本函式是公開站最後一道剝離保險——即使 canonical 帶了待驗證旗標也不會公開。
    全光譜：population_notes 各族群並列原樣帶過，不窄化單一受眾。
    """
    if not INJURIES_SRC.exists():
        print()
        print("=== 運動傷害 ===")
        print(f"  [跳過] 找不到 {INJURIES_SRC}")
        return

    data = yaml.safe_load(INJURIES_SRC.read_text(encoding="utf-8")) or {}
    injuries_out = [_strip_injury(r) for r in (data.get("injuries") or [])]
    # meta_references 是 Phase 2 內部整合輔助（跨條目流行病學），不渲染、不公開。

    out_data = {
        "categories":             data.get("categories", []),
        "certainty_legend":       data.get("certainty_legend"),
        "evidence_grade_legend":  data.get("evidence_grade_legend"),
        "injuries":               injuries_out,
    }

    by_cat = {}
    for r in injuries_out:
        by_cat[r.get("category")] = by_cat.get(r.get("category"), 0) + 1

    print()
    print("=== 運動傷害（public 層）===")
    for c in (data.get("categories") or []):
        print(f"  {c['id']:32s} {by_cat.get(c['id'], 0)}")
    print(f"  TOTAL injuries {len(injuries_out)}")

    if dry_run:
        print("  [dry-run，未寫入 data/vortex/injuries.yaml]")
        return

    out = yaml.safe_dump(
        out_data,
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False,
        width=4096,
    )
    INJURIES_DST.write_text(out, encoding="utf-8")
    print(f"  寫入 {INJURIES_DST.relative_to(HUGO_ROOT)}")


def sync_breathing(dry_run: bool):
    """讀 canonical breathing/*.yaml，搬進 my-site data/breathing/。

    呼吸章三條線（感知 / 生理 / 喚醒調節）全是公開知識，canonical 無 public/diagnostic
    分層——本函式整檔搬運，不剝離、不改內容。canonical 是 single source of truth。
    """
    print()
    print("=== 呼吸（全 public）===")
    if not BREATHING_SRC_DIR.exists():
        print(f"  [跳過] 找不到 {BREATHING_SRC_DIR}")
        return

    if not dry_run:
        BREATHING_DST_DIR.mkdir(parents=True, exist_ok=True)

    for name in BREATHING_FILES:
        src = BREATHING_SRC_DIR / f"{name}.yaml"
        if not src.exists():
            print(f"  [跳過] 找不到 {src.name}")
            continue
        data = yaml.safe_load(src.read_text(encoding="utf-8")) or {}
        top_keys = [k for k in data.keys() if k not in ("domain", "sub", "schema_version")]
        print(f"  {name:10s} top-level: {', '.join(top_keys)}")

        if dry_run:
            continue

        dst = BREATHING_DST_DIR / f"{name}.yaml"
        out = yaml.safe_dump(
            data,
            allow_unicode=True,
            default_flow_style=False,
            sort_keys=False,
            width=4096,
        )
        dst.write_text(out, encoding="utf-8")
        print(f"  寫入 {dst.relative_to(HUGO_ROOT)}")


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
            title = TITLE_OVERRIDE.get(slug) or extract_title(body)
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
                    layout=LAYOUT_MAP.get(slug, ""),
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

    sync_drills(dry_run)
    sync_teaching_errors(dry_run)
    sync_technical_analysis(dry_run)
    sync_source_registry(dry_run)
    sync_l_indicators(dry_run)
    sync_water_sense_levels(dry_run)
    sync_adm_matrix(dry_run)
    sync_adm_standards(dry_run)
    sync_periodization(dry_run)
    sync_psychology(dry_run)
    sync_injuries(dry_run)
    sync_breathing(dry_run)

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
