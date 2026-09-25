"""vortex_links.json 驗收（W1）。全部通過印 ALL PASS，否則 exit 1。"""
import json
import subprocess
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "vortex"
OUT = ROOT / "next" / "data" / "vortex_links.json"
STROKES = ["free", "back", "breast", "fly", "udk", "starts-turns"]
EXPECT = {"move": 51, "drill": 179, "tech": 222, "error": 104, "problem": 73,
          "injury": 47, "level": 26, "psy": 8, "psyc": 62}
fails = []


def check(cond, msg):
    if not cond:
        fails.append(msg)


def load(name):
    return yaml.safe_load((DATA / name).read_text(encoding="utf-8"))


proc = subprocess.run([sys.executable, "-X", "utf8", str(ROOT / "tools" / "build_vortex_links.py")],
                      capture_output=True, text=True, encoding="utf-8")
check(proc.returncode == 0, f"build 失敗：{proc.stderr[-2000:]}")
d = json.loads(OUT.read_text(encoding="utf-8"))
units, out, inn = d["units"], d["out"], d["in"]

psy = load("psychology.yaml")["themes"]
recount = {
    "move": sum(len(load(f"{s}.yaml")["moves"]) for s in STROKES),
    "drill": len(load("drills.yaml")["drills"]),
    "tech": len(load("technical-analysis.yaml")["points"]),
    "error": len(load("teaching-errors.yaml")["errors"]),
    "problem": len(load("problems.yaml")["problems"]),
    "injury": len(load("injuries.yaml")["injuries"]),
    "level": len(load("water-sense-levels.yaml")["levels"]),
    "psy": len(psy),
    "psyc": sum(len(t.get("concepts") or []) for t in psy),
}
got = {}
for u in units.values():
    got[u["type"]] = got.get(u["type"], 0) + 1
for t, n in EXPECT.items():
    check(recount[t] == n, f"{t} 重算 {recount[t]} ≠ 預期 {n}")
    check(got.get(t) == recount[t], f"{t} JSON {got.get(t)} ≠ 重算 {recount[t]}")

names = sum(len(m.get("drills") or []) for s in STROKES for m in load(f"{s}.yaml")["moves"])
practice = sum(1 for es in out.values() for e in es if e["rel"] == "practice")
check(practice == names == 103, f"practice {practice}、move.drills 名稱 {names}，應皆為 103")
check(not [x for x in d["stats"]["unresolved"] if x["field"].startswith("drills")], "有 move.drills 名稱解析失敗")
check(not any(e["rel"] == "fixes" for es in out.values() for e in es), "不應有 fixes 邊")

fwd = {(f, e["to"], e["rel"]) for f, es in out.items() for e in es}
rev = {(e["from"], t, e["rel"]) for t, es in inn.items() for e in es}
check(fwd == rev, f"in 不是 out 的反向（差 {len(fwd ^ rev)} 條）")
check(all(t in units for _, t, _ in fwd), "有 out 邊指向不存在的 unit")
check(set(out) == set(units) == set(inn), "out／in 必須涵蓋每個 unit")

paths = [u["path"] for u in units.values()]
check(all(p.startswith("vortex/") and p.endswith("/") for p in paths), "path 格式錯")
check(len(set(paths)) == len(paths), "path 有重複")

level_strokes = {u["stroke"] for u in units.values() if u["type"] == "level"}
dmap = {"freestyle": "free", "backstroke": "back", "breaststroke": "breast", "butterfly": "fly",
        "underwater_dolphin_kick": "udk", "starts_turns": "starts-turns"}
for dr in load("drills.yaml")["drills"]:
    has = any(e["rel"] == "level" for e in out[dr["id"]])
    could = any(dmap.get(s, s) in level_strokes for s in dr["strokes"])
    check(has or not could, f"drill {dr['id']} 應有 level 邊")

check("map[" not in OUT.read_text(encoding="utf-8"), "JSON 內出現 map[")

if fails:
    print("FAIL")
    for f in fails:
        print(" -", f)
    sys.exit(1)
print("ALL PASS")
