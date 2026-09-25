"""建立 Vortex 知識點雙向連結索引。

讀 data/vortex/*.yaml，輸出 next/data/vortex_links.json。
執行：python -X utf8 tools/build_vortex_links.py
"""
from __future__ import annotations

import json
import sys
from collections import OrderedDict
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "vortex"
OUT = ROOT / "next" / "data" / "vortex_links.json"

MOVE_FILES = ["free", "back", "breast", "fly", "udk", "starts-turns"]
SEG = {"move": "moves", "drill": "drills", "tech": "tech", "error": "errors",
       "problem": "problems", "injury": "injuries", "level": "levels",
       "psy": "mind", "psyc": "mind"}

# drill.strokes -> internal key
DRILL_STROKE_MAP = {
    "freestyle": "free",
    "backstroke": "back",
    "breaststroke": "breast",
    "butterfly": "fly",
    "underwater_dolphin_kick": "udk",
    "starts_turns": "starts-turns",
}

# strokes that have no levels
NO_LEVEL_STROKES = {"udk", "starts-turns"}

# strokes where L0/L1 are absent
L0L1_MISSING = {"breast", "fly"}


def load_yaml(path):
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def slugify(text):
    return text.lower().replace(".", "-").replace("_", "-")


def _clean(text):
    """去掉 ** 與空白，截到 80 字。"""
    if not isinstance(text, str):
        return ""
    t = text.replace("**", "").strip()
    if not t:
        return ""
    if len(t) > 80:
        t = t[:80] + "…"
    return t


def hook_from_move(rec):
    return _clean(rec.get("one"))


def hook_from_drill(rec):
    return _clean(rec.get("purpose_zh"))


def hook_from_tech(rec):
    return _clean(rec.get("summary"))


def hook_from_error(rec):
    return _clean(rec.get("misconception"))


def hook_from_problem(rec):
    obs = rec.get("observable")
    if isinstance(obs, list):
        first = next((x for x in obs if isinstance(x, str) and x.strip()), "")
    else:
        first = obs if isinstance(obs, str) else ""
    txt = _clean(first)
    if not txt:
        txt = _clean(rec.get("mechanism_summary"))
    return txt


def hook_from_injury(rec):
    return _clean(rec.get("en"))


def hook_from_level(rec):
    return _clean(rec.get("tagline"))


def hook_from_psy(rec):
    txt = _clean(rec.get("when_zh"))
    if not txt:
        txt = _clean(rec.get("lead_zh"))
    return txt


def hook_from_psyc(rec):
    return _clean(rec.get("phenomenon"))


HOOKERS = {
    "move": hook_from_move,
    "drill": hook_from_drill,
    "tech": hook_from_tech,
    "error": hook_from_error,
    "problem": hook_from_problem,
    "injury": hook_from_injury,
    "level": hook_from_level,
    "psy": hook_from_psy,
    "psyc": hook_from_psyc,
}


def path_for(unit_type, uid, *, stroke=None, n=None):
    if unit_type == "move":
        return f"vortex/moves/{stroke}-{n}/"
    seg = SEG[unit_type]
    return f"vortex/{seg}/{slugify(uid)}/"


def _add_edge(out_edges, in_edges, frm, to, rel):
    if frm == to:
        return
    out_edges.setdefault(frm, [])
    out_edges.setdefault(to, [])
    in_edges.setdefault(frm, [])
    in_edges.setdefault(to, [])
    # dedup on (to, rel)
    for e in out_edges[frm]:
        if e["to"] == to and e["rel"] == rel:
            return
    out_edges[frm].append({"to": to, "rel": rel})
    for e in in_edges[to]:
        if e["from"] == frm and e["rel"] == rel:
            return
    in_edges[to].append({"from": frm, "rel": rel})


def _dedup_edges(edges, *, direction="out"):
    """edges: dict id -> list; 去重保序。direction='out' 用 to/in 鍵，'in' 用 from/in 鍵。"""
    new = {}
    other_key = "to" if direction == "out" else "from"
    for frm, es in edges.items():
        seen = set()
        lst = []
        for e in es:
            key = (e[other_key], e["rel"])
            if key in seen:
                continue
            seen.add(key)
            lst.append({other_key: e[other_key], "rel": e["rel"]})
        new[frm] = lst
    return new


def _invert_edges(out_edges):
    inv = {}
    for frm, es in out_edges.items():
        inv.setdefault(frm, [])
    for frm, es in out_edges.items():
        for e in es:
            inv.setdefault(e["to"], []).append({"from": frm, "rel": e["rel"]})
    new_inv = {}
    for to, es in inv.items():
        seen = set()
        lst = []
        for e in es:
            key = (e["from"], e["rel"])
            if key in seen:
                continue
            seen.add(key)
            lst.append({"from": e["from"], "rel": e["rel"]})
        new_inv[to] = lst
    return new_inv


def main():
    units = OrderedDict()
    out_edges = {}
    in_edges = {}
    unresolved = []
    categories = {}
    strokes_meta = {}

    # ---------- move ----------
    for stroke in MOVE_FILES:
        yd = load_yaml(DATA / f"{stroke}.yaml")
        premise = yd.get("premise") or ""
        moves = sorted(yd.get("moves", []), key=lambda m: m.get("n", 0))
        move_ids = []
        for mv in moves:
            n = mv.get("n")
            uid = f"{stroke}.move.{n}"
            unit = {
                "type": "move",
                "title": mv.get("name", ""),
                "hook": hook_from_move(mv),
                "stroke": stroke,
                "category": "",
                "category_name": "",
                "path": path_for("move", uid, stroke=stroke, n=n),
                "record": dict(mv),
            }
            units[uid] = unit
            out_edges.setdefault(uid, [])
            in_edges.setdefault(uid, [])
            move_ids.append(uid)
        strokes_meta[stroke] = {
            "name_zh": {
                "free": "自由式", "back": "仰式", "breast": "蛙式",
                "fly": "蝶式", "udk": "水下海豚腿", "starts-turns": "出發與轉身",
            }[stroke],
            "premise": premise,
            "moves": move_ids,
        }

    # ---------- drill ----------
    yd = load_yaml(DATA / "drills.yaml")
    categories["drill"] = [{"key": c["key"], "name_zh": c["name_zh"]} for c in yd.get("categories", [])]
    cat_map_drill = {c["key"]: c["name_zh"] for c in yd.get("categories", [])}

    name_to_drills = {}
    for dr in yd.get("drills", []):
        name = dr.get("name_zh") or ""
        name_to_drills.setdefault(name, []).append(dr["id"])

    for dr in yd.get("drills", []):
        uid = dr["id"]
        cat = dr.get("category") or ""
        unit = {
            "type": "drill",
            "title": dr.get("name_zh", ""),
            "hook": hook_from_drill(dr),
            "stroke": "",
            "category": cat,
            "category_name": cat_map_drill.get(cat, cat),
            "path": path_for("drill", uid),
            "record": dict(dr),
        }
        units[uid] = unit
        out_edges.setdefault(uid, [])
        in_edges.setdefault(uid, [])

    # ---------- level ----------
    yd_lv = load_yaml(DATA / "water-sense-levels.yaml")
    level_ids = set()
    for lv in yd_lv.get("levels", []):
        uid = lv["id"]
        unit = {
            "type": "level",
            "title": lv.get("name_zh", ""),
            "hook": hook_from_level(lv),
            "stroke": lv.get("stroke", ""),
            "category": "",
            "category_name": "",
            "path": path_for("level", uid),
            "record": dict(lv),
        }
        units[uid] = unit
        out_edges.setdefault(uid, [])
        in_edges.setdefault(uid, [])
        level_ids.add(uid)

    # ---------- tech ----------
    yd = load_yaml(DATA / "technical-analysis.yaml")
    categories["tech"] = [{"key": c["key"], "name_zh": c["name_zh"]} for c in yd.get("categories", [])]
    cat_map_tech = {c["key"]: c["name_zh"] for c in yd.get("categories", [])}
    for p in yd.get("points", []):
        uid = p["id"]
        cat = p.get("category") or ""
        unit = {
            "type": "tech",
            "title": p.get("nav_zh", "") or p.get("title", ""),
            "hook": hook_from_tech(p),
            "stroke": p.get("stroke", ""),
            "category": cat,
            "category_name": cat_map_tech.get(cat, cat),
            "path": path_for("tech", uid),
            "record": dict(p),
        }
        units[uid] = unit
        out_edges.setdefault(uid, [])
        in_edges.setdefault(uid, [])

    # ---------- error ----------
    yd = load_yaml(DATA / "teaching-errors.yaml")
    categories["error"] = [{"key": c["key"], "name_zh": c["name_zh"]} for c in yd.get("categories", [])]
    cat_map_err = {c["key"]: c["name_zh"] for c in yd.get("categories", [])}
    for e in yd.get("errors", []):
        uid = e["id"]
        cat = e.get("category") or ""
        unit = {
            "type": "error",
            "title": e.get("title", ""),
            "hook": hook_from_error(e),
            "stroke": e.get("stroke", ""),
            "category": cat,
            "category_name": cat_map_err.get(cat, cat),
            "path": path_for("error", uid),
            "record": dict(e),
        }
        units[uid] = unit
        out_edges.setdefault(uid, [])
        in_edges.setdefault(uid, [])

    # ---------- problem ----------
    yd = load_yaml(DATA / "problems.yaml")
    categories["problem"] = [{"key": c["key"], "name_zh": c["name_zh"]} for c in yd.get("categories", [])]
    cat_map_problem = {c["key"]: c["name_zh"] for c in yd.get("categories", [])}
    for p in yd.get("problems", []):
        uid = p["id"]
        cat = p.get("category") or ""
        unit = {
            "type": "problem",
            "title": p.get("title", ""),
            "hook": hook_from_problem(p),
            "stroke": p.get("stroke", ""),
            "category": cat,
            "category_name": cat_map_problem.get(cat, cat),
            "path": path_for("problem", uid),
            "record": dict(p),
        }
        units[uid] = unit
        out_edges.setdefault(uid, [])
        in_edges.setdefault(uid, [])

    # ---------- injury ----------
    yd = load_yaml(DATA / "injuries.yaml")
    categories["injury"] = [{"key": c["key"], "name_zh": c["name_zh"]} for c in yd.get("categories", [])]
    cat_map_inj = {c["key"]: c["name_zh"] for c in yd.get("categories", [])}
    for it in yd.get("injuries", []):
        uid = it["id"]
        cat = it.get("category") or ""
        unit = {
            "type": "injury",
            "title": it.get("zh", ""),
            "hook": hook_from_injury(it),
            "stroke": "",
            "category": cat,
            "category_name": cat_map_inj.get(cat, cat),
            "path": path_for("injury", uid),
            "record": dict(it),
        }
        units[uid] = unit
        out_edges.setdefault(uid, [])
        in_edges.setdefault(uid, [])

    # ---------- psychology ----------
    yd = load_yaml(DATA / "psychology.yaml")
    for t in yd.get("themes", []):
        uid = t["id"]
        unit = {
            "type": "psy",
            "title": t.get("nav_zh", "") or t.get("name_zh", ""),
            "hook": hook_from_psy(t),
            "stroke": "",
            "category": "",
            "category_name": "",
            "path": path_for("psy", uid),
            "record": {k: v for k, v in t.items() if k != "concepts"},
        }
        units[uid] = unit
        out_edges.setdefault(uid, [])
        in_edges.setdefault(uid, [])

        for cp in t.get("concepts", []) or []:
            cuid = cp["id"]
            cunit = {
                "type": "psyc",
                "title": cp.get("nav_zh", "") or cp.get("name_zh", ""),
                "hook": hook_from_psyc(cp),
                "stroke": "",
                "category": "",
                "category_name": "",
                "path": path_for("psyc", cuid),
                "record": dict(cp),
            }
            units[cuid] = cunit
            out_edges.setdefault(cuid, [])
            in_edges.setdefault(cuid, [])
            _add_edge(out_edges, in_edges, cuid, uid, "part_of")

    # ---------- edges ----------
    # practice: move -> drill (by name)
    for stroke in MOVE_FILES:
        yd = load_yaml(DATA / f"{stroke}.yaml")
        for mv in yd.get("moves", []):
            n = mv.get("n")
            from_id = f"{stroke}.move.{n}"
            drill_names = mv.get("drills") or []
            for dname in drill_names:
                if not isinstance(dname, str):
                    continue
                candidates = name_to_drills.get(dname, [])
                if not candidates:
                    unresolved.append({"from": from_id, "ref": dname, "field": "drills"})
                    continue
                # 唯一同名直接連；同名多個才做泳式篩選
                if len(candidates) == 1:
                    _add_edge(out_edges, in_edges, from_id, candidates[0], "practice")
                    continue
                by_stroke = []
                for cid in candidates:
                    crec = units[cid]["record"]
                    cs = [DRILL_STROKE_MAP.get(s, s) for s in crec.get("strokes", [])]
                    if stroke in cs:
                        by_stroke.append(cid)
                if not by_stroke:
                    # 沒有對應泳式，仍直接連全部（跨泳式）；不記 drills，避免誤判
                    for cid in candidates:
                        _add_edge(out_edges, in_edges, from_id, cid, "practice")
                    continue
                if len(by_stroke) > 1:
                    unresolved.append({
                        "from": from_id, "ref": dname, "field": "drills-ambiguous",
                    })
                for cid in by_stroke:
                    _add_edge(out_edges, in_edges, from_id, cid, "practice")

    # deficiency_fixes 是外部書本的 Common Stroke Deficiencies 編號（TheVortexProject 已退役），
    # 不是 move 序號，不建連結。drill ↔ move 只靠 move.drills 的 practice 邊（反向由 in 提供）。
    drills_yaml = load_yaml(DATA / "drills.yaml")

    # ---------- edges: level (drill -> level via l_target) ----------
    for dr in drills_yaml.get("drills", []):
        did = dr["id"]
        strokes = [DRILL_STROKE_MAP.get(s, s) for s in dr.get("strokes", [])]
        l_targets = dr.get("l_target") or []
        for sk in strokes:
            for L in l_targets:
                cand = f"{sk}.{L}"
                if cand in level_ids:
                    _add_edge(out_edges, in_edges, did, cand, "level")

    # ---------- edges: ref (cross_ref_ids + problem.links + injury.links) ----------
    def _emit_refs(unit_id, refs, field_name):
        for r in refs or []:
            if not isinstance(r, str) or not r:
                continue
            if r in units:
                _add_edge(out_edges, in_edges, unit_id, r, "ref")
            else:
                unresolved.append({"from": unit_id, "ref": r, "field": field_name})

    for uid, u in units.items():
        if u["type"] in ("tech", "error", "problem"):
            _emit_refs(uid, u["record"].get("cross_ref_ids"), "cross_ref_ids")

    for uid, u in units.items():
        if u["type"] != "problem":
            continue
        lk = u["record"].get("links") or {}
        _emit_refs(uid, lk.get("technical_analysis"), "links.technical_analysis")
        _emit_refs(uid, lk.get("drills"), "links.drills")

    for uid, u in units.items():
        if u["type"] != "injury":
            continue
        lk = u["record"].get("links") or {}
        _emit_refs(uid, lk.get("mechanism_link_ids"), "links.mechanism_link_ids")
        _emit_refs(uid, lk.get("technical_link_ids"), "links.technical_link_ids")
        _emit_refs(uid, lk.get("perception_link_ids"), "links.perception_link_ids")

    # ---------- stats ----------
    units_by_type = {}
    for u in units.values():
        units_by_type[u["type"]] = units_by_type.get(u["type"], 0) + 1
    edges_by_rel = {}
    for uid, es in out_edges.items():
        for e in es:
            edges_by_rel[e["rel"]] = edges_by_rel.get(e["rel"], 0) + 1

    out_json = OrderedDict()
    out_json["units"] = units
    out_json["out"] = _dedup_edges(out_edges, direction="out")
    out_json["in"] = _dedup_edges(in_edges, direction="in")
    out_json["strokes"] = strokes_meta
    out_json["categories"] = categories
    out_json["stats"] = {
        "units_by_type": dict(sorted(units_by_type.items())),
        "edges_by_rel": dict(sorted(edges_by_rel.items())),
        "unresolved": unresolved,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as f:
        json.dump(out_json, f, ensure_ascii=False, indent=None, separators=(",", ":"))

    type_str = " ".join(f"{k}={v}" for k, v in sorted(units_by_type.items()))
    rel_str = " ".join(f"{k}={v}" for k, v in sorted(edges_by_rel.items()))
    print(f"units: {type_str}")
    print(f"edges: {rel_str}")
    print(f"unresolved: {len(unresolved)}")


if __name__ == "__main__":
    main()
