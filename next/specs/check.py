"""新版預覽站逐工作單驗收（Claude 撰寫；M3 不准修改本檔）。

用法：python -X utf8 next/specs/check.py W1|W3|W4|W5|W6|W7|W8
全部通過印 PASS 並 exit 0；否則列出失敗項並 exit 1。
"""
import html
import json
import random
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "next"
LINKS = ROOT / "next" / "data" / "vortex_links.json"
FAILS = []

SEG = {"move": "moves", "drill": "drills", "tech": "tech", "error": "errors",
       "problem": "problems", "injury": "injuries", "level": "levels", "psy": "mind", "psyc": "mind"}
EXPECT = {"move": 51, "drill": 179, "tech": 222, "error": 104, "problem": 73,
          "injury": 47, "level": 26, "psy": 8, "psyc": 62}
STROKES = ["free", "back", "breast", "fly", "udk", "starts-turns"]
LISTS = ["drills", "tech", "errors", "problems", "injuries", "levels", "mind", "moves"]


def fail(msg):
    FAILS.append(msg)


def run(cmd, timeout=600):
    started = time.time()
    proc = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True,
                          encoding="utf-8", errors="replace", timeout=timeout)
    return proc, time.time() - started


def build_next():
    if OUT.exists():
        shutil.rmtree(OUT)
    proc, secs = run(["hugo", "--minify", "--config", "hugo.next.toml"])
    if proc.returncode != 0:
        out = "\n".join(l for l in (proc.stdout + proc.stderr).splitlines() if not l.startswith("WARN"))
        fail(f"hugo next 建置失敗（exit {proc.returncode}）：\n{out[-4000:]}")
    return secs


def page(rel):
    p = OUT / rel / "index.html"
    if not p.exists():
        fail(f"缺頁面：public/next/{rel}/index.html")
        return ""
    return p.read_text(encoding="utf-8")


def text_of(doc):
    return html.unescape(re.sub(r"<[^>]+>", " ", doc))


def load_links():
    if not LINKS.exists():
        fail("缺 next/data/vortex_links.json（先跑 tools/build_vortex_links.py）")
        return None
    return json.loads(LINKS.read_text(encoding="utf-8"))


def global_checks():
    for p in OUT.rglob("*.html"):
        doc = p.read_text(encoding="utf-8")
        rel = p.relative_to(OUT).as_posix()
        if "map[" in doc:
            fail(f"{rel} 出現 map[（直接印出 map）")
        if "%!" in doc:
            fail(f"{rel} 出現 Go 格式錯誤 %!（printf 型別不符）")
        for href in re.findall(r'href="?([a-z][^" >#]*/)#', doc):
            if not href.startswith(("http", "mailto")):
                fail(f"{rel} 有相對路徑錨點連結 {href}#…（應用 relURL）")
                break
        if re.search(r"\sstyle=", doc):
            fail(f"{rel} 有 inline style 屬性")
        if re.search(r"<h[23][^>]*>\s*</h[23]>", doc):
            fail(f"{rel} 有空標題")
    for p in (ROOT / "next" / "assets").rglob("*.css"):
        if "!important" in p.read_text(encoding="utf-8"):
            fail(f"{p.relative_to(ROOT).as_posix()} 使用 !important")


def w1():
    for script in ["tools/build_vortex_links.py", "tools/test_vortex_links.py"]:
        proc, _ = run([sys.executable, "-X", "utf8", script])
        if proc.returncode != 0:
            fail(f"{script} 失敗：\n{(proc.stdout + proc.stderr)[-3000:]}")
    d = load_links()
    if not d:
        return
    counts = {}
    for u in d["units"].values():
        counts[u["type"]] = counts.get(u["type"], 0) + 1
    for t, n in EXPECT.items():
        if counts.get(t) != n:
            fail(f"units type={t} 數量 {counts.get(t)} ≠ {n}")
    practice = sum(1 for es in d["out"].values() for e in es if e["rel"] == "practice")
    if practice != 103:
        fail(f"practice 邊 {practice} ≠ 103")


def w3():
    for f in ["hugo.next.toml", "next/layouts/baseof.html", "next/content/_index.md", "next/content/vortex/_index.md"]:
        if not (ROOT / f).exists():
            fail(f"缺 {f}")
    dy = (ROOT / ".github/workflows/deploy.yml").read_text(encoding="utf-8")
    if "hugo.next.toml" not in dy or "next preview build failed" not in dy:
        fail("deploy.yml 未加入不影響正式站的 next 建置步驟")
    build_next()
    home = page("")
    for needle in ["site-head", "series-vortex", "vortex/"]:
        if needle not in home:
            fail(f"站首頁缺 {needle}")
    tmp = tempfile.mkdtemp()
    proc, _ = run(["hugo", "--minify", "-d", tmp])
    shutil.rmtree(tmp, ignore_errors=True)
    if proc.returncode != 0:
        fail("正式站（舊版）建置被影響而失敗")


def w4():
    secs = build_next()
    if secs > 120:
        fail(f"建置 {secs:.0f} 秒 > 120")
    d = load_links()
    if not d:
        return
    for t, seg in SEG.items():
        want = sum(1 for u in d["units"].values() if SEG[u["type"]] == seg)
        got = len(list((OUT / "vortex" / seg).glob("*/index.html")))
        if got != want:
            fail(f"vortex/{seg}/ 頁數 {got} ≠ {want}")
    for s in STROKES:
        page(f"vortex/{s}")
    for s in LISTS:
        page(f"vortex/{s}")
    global_checks()


def w5():
    build_next()
    d = load_links()
    if not d:
        return
    rng = random.Random(7)
    by_type = {}
    for uid, u in d["units"].items():
        by_type.setdefault(u["type"], []).append(uid)
    for t, ids in by_type.items():
        for uid in rng.sample(sorted(ids), min(5, len(ids))):
            u = d["units"][uid]
            doc = page(u["path"].strip("/"))
            if not doc:
                continue
            if "unit-kicker" not in doc:
                fail(f"{uid} 缺 unit-kicker")
            hook = re.sub(r"\*\*", "", u.get("hook") or "").strip()[:10]
            if hook and hook not in text_of(doc):
                fail(f"{uid} 看不到一句話 hook「{hook}」")
            if t == "error" and "很多人以為" not in doc:
                fail(f"{uid} 誤區頁缺「很多人以為」")
            linked = d["out"].get(uid) or d["in"].get(uid)
            if linked and "next-read" not in doc:
                fail(f"{uid} 有連結卻沒有「接著看」")
    edges = [(f, e["to"]) for f, es in d["out"].items() for e in es]
    for f, t in rng.sample(edges, min(30, len(edges))):
        fp, tp = d["units"][f]["path"], d["units"][t]["path"]
        if tp not in page(fp.strip("/")):
            fail(f"{f} 頁沒有連到 {t}")
        if fp not in page(tp.strip("/")):
            fail(f"{t} 頁沒有反向連回 {f}（雙向連結）")
    global_checks()


def w6():
    build_next()
    d = load_links()
    if not d:
        return
    for s in STROKES:
        doc = page(f"vortex/{s}")
        if "mv-row" not in doc:
            fail(f"vortex/{s} 缺 mv-row")
        for mid in d["strokes"][s]["moves"]:
            if d["units"][mid]["path"] not in doc:
                fail(f"vortex/{s} 缺動作連結 {mid}")
        for t in ["error", "tech"]:
            if not any(u["path"] in doc for u in d["units"].values() if u["type"] == t and u["stroke"] == s):
                fail(f"vortex/{s} 沒有任何 {t} 連結")
    global_checks()


def w7():
    build_next()
    d = load_links()
    if not d:
        return
    for seg, types in [("drills", ["drill"]), ("errors", ["error"]), ("tech", ["tech"]), ("mind", ["psy", "psyc"])]:
        doc = page(f"vortex/{seg}")
        want = [u["path"] for u in d["units"].values() if u["type"] in types]
        miss = [p for p in want if p not in doc]
        if miss:
            fail(f"vortex/{seg} 缺 {len(miss)}/{len(want)} 條連結，例：{miss[:3]}")
    doc = page("vortex/drills")
    for needle in ["data-filter", "data-stroke", "filter", "<ol"]:
        if needle not in doc:
            fail(f"vortex/drills 缺 {needle}")
    global_checks()


def w8():
    build_next()
    d = load_links()
    if not d:
        return
    doc = page("vortex")
    for s in STROKES:
        if f"vortex/{s}/" not in doc:
            fail(f"首頁缺泳式 {s}")
    errs = {u["path"] for u in d["units"].values() if u["type"] == "error" and u["path"] in doc}
    if len(errs) < 7:  # 2026-09-26 視覺重做：一大六小
        fail(f"首頁誤區連結只有 {len(errs)} 條（要 7）")
    for lv in ["free.L0", "free.L6"]:
        if d["units"][lv]["path"] not in doc:
            fail(f"首頁缺級別 {lv}")
    for s in ["drills", "errors", "tech", "problems", "injuries", "mind"]:  # moves 由泳式頁進、levels 由階梯進
        if f"vortex/{s}/" not in doc:
            fail(f"首頁缺集合 {s}")
    global_checks()


LIB = ROOT / "next" / "data" / "library.json"
LIB_EXPECT = {"kinesiology": (16, 0), "basic-biomechanics": (17, 0), "cscs": (24, 0),
              "mnfl": (0, 20), "ust": (10, 18), "temperament": (5, 9)}


def l1():
    proc, _ = run([sys.executable, "-X", "utf8", "tools/build_library.py"])
    if proc.returncode != 0:
        fail("build_library.py 失敗：" + (proc.stdout + proc.stderr)[-3000:])
        return
    if not LIB.exists():
        fail("缺 next/data/library.json")
        return
    raw = LIB.read_text(encoding="utf-8")
    d = json.loads(raw)
    ids = [s["id"] for s in d.get("series", [])]
    if ids != list(LIB_EXPECT):
        fail(f"series 順序／內容錯：{ids}")
    keys = {"id", "group", "group_name", "title", "title_en", "author", "edition", "lead", "path",
            "chapters_label", "chapters", "entries_label", "entries", "tools"}
    paths = []
    for s in d.get("series", []):
        miss = keys - set(s)
        if miss:
            fail(f"{s.get('id')} 缺欄位 {sorted(miss)}")
            continue
        want = LIB_EXPECT.get(s["id"], (None, None))
        if (len(s["chapters"]), len(s["entries"])) != want:
            fail(f"{s['id']} chapters/entries = {len(s['chapters'])}/{len(s['entries'])}，應為 {want}")
        if not s["title"] or not s["lead"]:
            fail(f"{s['id']} 缺 title 或 lead")
        for c in s["chapters"]:
            if not c.get("title") or not c.get("desc"):
                fail(f"{s['id']} 章 {c.get('id')} 缺 title 或 desc")
            paths.append(c.get("path", ""))
            if s["id"] in ("kinesiology", "basic-biomechanics"):
                md = ROOT / "content" / c["path"] / "index.md"
                if not md.exists():
                    fail(f"{c['path']} 對不到 content 檔")
        for e in s["entries"]:
            if not e.get("title") or not e.get("desc") or not e.get("group_name"):
                fail(f"{s['id']} 條目 {e.get('id')} 缺 title／desc／group_name")
            paths.append(e.get("path", ""))
        paths.append(s["path"])
    bad = [p for p in paths if not p.endswith("/") or p.startswith("/") or "cortex" in p]
    if bad:
        fail(f"path 格式錯：{bad[:5]}")
    dup = {p for p in paths if paths.count(p) > 1}
    if dup:
        fail(f"path 重複：{sorted(dup)[:5]}")
    for needle in ["map[", "False", "None", "**"]:
        if needle in raw:
            fail(f"library.json 出現 {needle!r}")


def l3():
    import yaml
    build_next()
    base = "library/essentials-of-strength-training"
    concepts = yaml.safe_load((ROOT / "data/cscs/_concepts.yaml").read_text(encoding="utf-8"))
    by_concept = {k: 0 for k in concepts}
    rng = random.Random(3)
    rel_samples = []
    for n in range(1, 25):
        key = f"ch{n:02d}"
        ch = yaml.safe_load((ROOT / f"data/cscs/{key}.yaml").read_text(encoding="utf-8"))
        doc = page(f"{base}/{key}")
        if not doc:
            continue
        items = [i for t in ch["topics"] for i in t["items"]]
        got = doc.count("ck-item")
        if got < len(items):
            fail(f"{key} ck-item {got} < {len(items)}")
        for t in ch["topics"]:
            if f"#{t['id']}" not in doc:
                fail(f"{key} 左側目錄缺小節錨點 #{t['id']}")
                break
        miss = [i["id"] for i in items if i["id"] not in doc]
        if miss:
            fail(f"{key} 缺 item 錨點 {len(miss)} 個，例 {miss[:2]}")
        with_terms = sum(1 for i in items if i.get("terms"))
        if with_terms and doc.count("ck-terms") < with_terms:
            fail(f"{key} 術語列 {doc.count('ck-terms')} < 有術語的 item {with_terms}")
        if "ck-quiz-toggle" not in doc or "cscs" not in doc:
            fail(f"{key} 缺自測按鈕或 cscs.js")
        for i in items:
            for c in i.get("concepts") or []:
                by_concept[c] = by_concept.get(c, 0) + 1
            for r in i.get("related") or []:
                rel_samples.append((key, i["id"], r))
    for key, src, r in rng.sample(rel_samples, min(25, len(rel_samples))):
        doc = page(f"{base}/{key}")
        target_ch = r.split(".")[0]
        if target_ch == key:
            if f"#{r}" not in doc:
                fail(f"{src} 缺同章相關連結 #{r}")
        elif f"{target_ch}/#{r}" not in doc:
            fail(f"{src} 缺跨章相關連結 {target_ch}/#{r}")
    doc = page(f"{base}/concepts")
    for k, n in by_concept.items():
        if f"id={k}" not in doc and f'id="{k}"' not in doc:
            fail(f"概念頁缺 #{k}")
    links = doc.count(f"{base}/ch")
    total = sum(by_concept.values())
    if links < total:
        fail(f"概念頁 item 連結 {links} < 應有 {total}")
    global_checks()


def _lib_series(sid):
    d = json.loads(LIB.read_text(encoding="utf-8"))
    return next(s for s in d["series"] if s["id"] == sid)


def l4():
    import yaml
    build_next()
    for sid in ("mnfl", "ust"):
        s = _lib_series(sid)
        home = page(s["path"].strip("/"))
        for e in s["entries"] + s["chapters"]:
            if e["path"] not in home:
                fail(f"{sid} 系列首頁缺連結 {e['path']}")
            doc = page(e["path"].strip("/"))
            if doc and e["title"] not in text_of(doc):
                fail(f"{e['path']} 看不到標題 {e['title']}")
            if doc and "lib-entry" not in doc and "lib-chapter" not in doc:
                fail(f"{e['path']} 未使用 lib-entry／lib-chapter 骨架")
    strat = yaml.safe_load((ROOT / "data/ust/strategies.yaml").read_text(encoding="utf-8"))["strategies"]
    for n in range(1, 11):
        doc = page(f"library/uncommon-sense-teaching/ch{n:02d}")
        for s in strat:
            if int(s["chapter"]) == n and f"strategies/{s['id']}/" not in doc:
                fail(f"UST 第 {n} 章缺本章策略 {s['id']}")
    for s in strat:
        doc = page(f"library/uncommon-sense-teaching/strategies/{s['id']}")
        if f"uncommon-sense-teaching/ch{int(s['chapter']):02d}/" not in doc:
            fail(f"策略 {s['id']} 沒有連回出處章")
    idx = page("library/uncommon-sense-teaching/strategies")
    if sum(1 for s in strat if f"strategies/{s['id']}/" in idx) != len(strat):
        fail("UST 策略總表未列出全部策略")
    for f in (ROOT / "next/assets/css").glob("entry.css"):
        if "#1B5E69" in f.read_text(encoding="utf-8") or "#2B4A7A" in f.read_text(encoding="utf-8"):
            fail("entry.css 使用了資料裡的 color")
    global_checks()


def l5():
    build_next()
    s = _lib_series("temperament")
    home = page("temperament")
    for c in s["chapters"] + s["entries"]:
        if c["path"] not in home:
            fail(f"氣質首頁缺連結 {c['path']}")
        doc = page(c["path"].strip("/"))
        if not doc:
            continue
        if "確定性：🔵 經典" not in text_of(doc):
            fail(f"{c['path']} 缺確定性圖例")
        for raw in (">keogh<", ">lead<", ">strategies<", ">synthesis<", ">teaching<", ">classroom<"):
            if raw in doc:
                fail(f"{c['path']} 把英文 key {raw} 印給讀者")
    traits = page("temperament/traits")
    for e in s["entries"]:
        if e["path"] not in traits:
            fail(f"九個維度頁缺連到 {e['path']}")
    fit = text_of(page("temperament/fit"))
    for needle in ("適配", "教室"):
        if needle not in fit:
            fail(f"適配度頁缺「{needle}」內容")
    global_checks()



def _yaml(rel):
    import yaml
    return yaml.safe_load((ROOT / rel).read_text(encoding="utf-8"))


def _ids_in(doc, ids, label):
    miss = [i for i in ids if f"id={i}" not in doc and f'id="{i}"' not in doc]
    if miss:
        fail(f"{label} 缺錨點 {len(miss)}/{len(ids)}，例 {miss[:3]}")


def _index_ids(rel):
    d = _yaml(rel)
    out = []
    def walk(o):
        if isinstance(o, dict):
            if "id" in o and isinstance(o["id"], str):
                out.append(o["id"])
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
    walk(d)
    return out


def v2():
    build_next()
    doc = page("vortex/water-sense")
    if not doc:
        return
    old = (ROOT / "layouts/vortex/vortex-water-sense.html").read_text(encoding="utf-8")
    old = re.sub(r"\{\{.*?\}\}", " ", old, flags=re.S)
    sents = [s for s in re.split(r"[。！？\n]", text_of(old)) if len(re.findall(r"[\u4e00-\u9fff]", s)) >= 12]
    new = re.sub(r"\s+", "", text_of(doc))
    hit = sum(1 for s in sents if re.sub(r"\s+", "", s) in new)
    if sents and hit / len(sents) < 0.95:
        fail(f"水感導讀文字保留 {hit}/{len(sents)}（需 ≥95%）")
    global_checks()


def v3():
    build_next()
    doc = page("vortex/breathing")
    if not doc:
        return
    i_safe = doc.find("br-safety")
    i_block = doc.find("le-block")
    if i_safe < 0 or (i_block >= 0 and i_block < i_safe):
        fail("安全段落不是第一個內容區塊")
    else:
        seg = doc[i_safe:doc.find("</section>", i_safe)]
        if "<details" in seg:
            fail("安全段落被放進可收合區塊")
    _ids_in(doc, _index_ids("data/breathing/_index.yaml"), "呼吸章")
    global_checks()


def v4():
    build_next()
    doc = page("vortex/periodization")
    if not doc:
        return
    _ids_in(doc, _index_ids("data/periodization/_index.yaml"), "週期化章")
    for needle in ("id=planner", "planner", "pz-table"):
        if needle not in doc:
            fail(f"週期化頁缺 {needle}")
    global_checks()


def v5():
    build_next()
    for rel in ("vortex/adm", "vortex/adm/matrix", "vortex/adm/standards", "vortex/adm/background"):
        page(rel)
    m = text_of(page("vortex/adm/matrix"))
    for stage in ("學習訓練", "訓練為訓練", "訓練為競賽", "訓練為勝利"):
        if stage not in m:
            fail(f"矩陣缺階段 {stage}")
    std = _yaml("data/adm/standards.yaml")
    n = len(std if isinstance(std, list) else next(v for v in std.values() if isinstance(v, list)))
    got = page("vortex/adm/standards").count("data-stroke")
    if got < n:
        fail(f"技術標準項目 {got} < {n}")
    home = page("vortex/adm")
    for sub in ("adm/matrix/", "adm/standards/", "adm/background/"):
        if sub not in home:
            fail(f"ADM 總覽缺連結 {sub}")
    global_checks()


def v6():
    build_next()
    d = load_links()
    if not d:
        return
    doc = page("vortex/psychology")
    for u in d["units"].values():
        if u["type"] in ("psy", "psyc") and u["path"] not in doc:
            fail(f"心理長讀缺連結 {u['path']}")
            break
    joints = page("vortex/joints")
    for u in d["units"].values():
        if u["type"] == "tech" and u["category"] == "joint" and u["path"] not in joints:
            fail(f"骨關節頁缺 {u['path']}")
    mv = page("vortex/movement")
    total = 0
    for f in ("actions", "muscle-groups", "stroke-demands", "interventions"):
        data = _yaml(f"data/movement/{f}.yaml")
        lists = [v for v in data.values() if isinstance(v, list)] if isinstance(data, dict) else [data]
        ids = [e["id"] for l in lists for e in l if isinstance(e, dict) and "id" in e]
        total += len(ids)
        _ids_in(mv, ids, f"動作圖譜 {f}")
    if total == 0:
        fail("動作圖譜讀不到任何 id")
    global_checks()


def v7():
    build_next()
    d = load_links()
    if not d:
        return
    lv = [u for u in d["units"].values() if u["type"] == "level"]
    has = sum(1 for u in lv if "layer-indicators" in page(u["path"].strip("/")))
    if has < 10:
        fail(f"只有 {has}/{len(lv)} 個級別頁有指標區塊")
    global_checks()


def _chapter_json(sub, key):
    total = 0
    for n in range(1, 25):
        f = OUT / "library/essentials-of-strength-training" / sub / f"ch{n:02d}.json"
        if not f.exists():
            fail(f"缺 {sub}/ch{n:02d}.json")
            continue
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except Exception as e:
            fail(f"{sub}/ch{n:02d}.json 不是合法 JSON：{e}")
            continue
        items = data if isinstance(data, list) else next((v for v in data.values() if isinstance(v, list)), [])
        total += len(items)
    return total


def t1():
    build_next()
    doc = page("library/essentials-of-strength-training/quiz")
    if doc and "cscs-quiz" not in doc:
        fail("選擇題頁沒有載入 cscs-quiz.js")
    want = 0
    for n in range(1, 25):
        b = _yaml(f"data/cscs/_quiz_bank/ch{n:02d}.yaml")
        want += len(b if isinstance(b, list) else next(v for v in b.values() if isinstance(v, list)))
    got = _chapter_json("quiz", "questions")
    if got != want:
        fail(f"題庫 JSON 共 {got} 題，題庫原檔 {want} 題")
    global_checks()


def t2():
    build_next()
    doc = page("library/essentials-of-strength-training/cards")
    if doc and "cscs-cards" not in doc:
        fail("閃卡頁沒有載入 cscs-cards.js")
    want = sum(len(_yaml(f"data/cscs/ch{n:02d}.yaml").get("cards") or []) for n in range(1, 25))
    got = _chapter_json("cards", "cards")
    if got != want:
        fail(f"閃卡 JSON 共 {got} 張，原檔 {want} 張")
    global_checks()


def t3():
    build_next()
    doc = page("temperament/quiz")
    if not doc:
        return
    m = re.search(r'<script[^>]*id=["]?tq-data["]?[^>]*>(.*?)</script>', doc, re.S)
    if not m:
        fail("缺 tq-data 嵌入資料")
    else:
        try:
            json.loads(m.group(1))
        except Exception as e:
            fail(f"tq-data 不是合法 JSON：{e}")
    if "temp-quiz" not in doc:
        fail("自測頁沒有載入 temp-quiz.js")
    global_checks()


def t4():
    build_next()
    doc = page("library/kinesiology/learning-map")
    links = set(re.findall(r"library/kinesiology/(ch\d\d)/", doc))
    if not links:
        fail("學習地圖沒有任何章節連結")
    for c in links:
        if not (OUT / "library/kinesiology" / c / "index.html").exists():
            fail(f"學習地圖連到不存在的章 {c}")
    global_checks()



def p4():
    """全站連結稽核：每個站內連結的目標頁必須存在；帶 #錨點者，目標頁必須有該 id。"""
    import urllib.parse
    build_next()
    base = "/cortex/next/"
    ids_cache = {}

    def ids_of(f):
        if f not in ids_cache:
            doc = f.read_text(encoding="utf-8")
            ids_cache[f] = set(re.findall(r'\sid="?([^"\s>]+)', doc))
        return ids_cache[f]

    pages_n = links_n = 0
    broken, bad_anchor = [], []
    for f in OUT.rglob("*.html"):
        doc = f.read_text(encoding="utf-8")
        if "此頁已搬移" in doc:
            continue  # 舊網址轉址頁，指向切換後的正式網址
        pages_n += 1
        here = "/" + f.parent.relative_to(OUT).as_posix()
        for href in re.findall(r'href="?([^"\s>]+)', doc):
            href = html.unescape(href)
            if href.startswith(("http:", "https:", "mailto:", "javascript:", "data:")):
                continue
            path, _, frag = href.partition("#")
            if path == "":
                target = f
            elif path.startswith(base):
                rel = urllib.parse.unquote(path[len(base):])
                target = OUT / rel
                if rel.endswith((".css", ".js", ".json", ".png", ".jpg", ".svg", ".xml")):
                    if not target.exists():
                        broken.append(f"{here} → {href}")
                    continue
                target = target / "index.html"
            elif path.startswith("/"):
                broken.append(f"{here} → {href}（不在 {base} 底下）")
                continue
            else:
                continue  # 相對連結（Markdown 長文內）另由 global_checks 規範
            links_n += 1
            if not target.exists():
                broken.append(f"{here} → {href}")
                continue
            if frag and urllib.parse.unquote(frag) not in ids_of(target):
                bad_anchor.append(f"{here} → {href}")
    print(f"稽核 {pages_n} 頁、{links_n} 條站內連結")
    # 孤兒頁：沒有任何其他頁連到它（2026-09-26 Vortex 七個專頁做好卻沒放進目錄與首頁，連結稽核抓不到）
    linked = set()
    for f in OUT.rglob("*.html"):
        doc = f.read_text(encoding="utf-8")
        if "此頁已搬移" in doc:
            continue
        for href in re.findall(r'href="?([^"\s>#]+)', doc):
            if href.startswith(base):
                linked.add((OUT / urllib.parse.unquote(href[len(base):]) / "index.html").resolve())
    orphans = []
    for f in OUT.rglob("index.html"):
        if f.parent in (OUT, OUT / "library") or "此頁已搬移" in f.read_text(encoding="utf-8"):  # /library/ 是舊網址的書房落點
            continue
        if f.resolve() not in linked:
            orphans.append("/" + f.parent.relative_to(OUT).as_posix() + "/")
    for o in sorted(orphans)[:40]:
        fail(f"孤兒頁（沒有任何頁連到它）：{o}")
    for b in sorted(set(broken))[:40]:
        fail(f"斷連結：{b}")
    for b in sorted(set(bad_anchor))[:40]:
        fail(f"錨點不存在：{b}")
    if len(set(broken)) > 40 or len(set(bad_anchor)) > 40:
        fail(f"（共 {len(set(broken))} 條斷連結、{len(set(bad_anchor))} 條錨點錯誤，只列前 40）")
    global_checks()


if __name__ == "__main__":
    step = (sys.argv[1] if len(sys.argv) > 1 else "").upper()
    fn = {"P4": p4, "L1": l1, "L3": l3, "L4": l4, "L5": l5, "V2": v2, "V3": v3, "V4": v4, "V5": v5, "V6": v6, "V7": v7, "T1": t1, "T2": t2, "T3": t3, "T4": t4, "W1": w1, "W3": w3, "W4": w4, "W5": w5, "W6": w6, "W7": w7, "W8": w8}.get(step)
    if not fn:
        sys.exit("用法：check.py L1|W1|W3|W4|W5|W6|W7|W8")
    fn()
    if FAILS:
        print(f"FAIL {step}（{len(FAILS)} 項）")
        for m in FAILS[:60]:
            print(" -", m)
        sys.exit(1)
    print(f"PASS {step}")
