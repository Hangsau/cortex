"""跨系列知識連結：候選產生器（Claude 撰寫，2026-09-26）。

把三方內容拆成可連結的小單位，用字元二元組＋英文詞的 TF-IDF 餘弦相似度，
替每個單位找出「其他系列」裡最像的幾個，輸出候選對給 LLM 判斷。
這一步只負責「不要漏掉」，不負責「是不是真的相通」——真假由 crosslink_judge.py 判定，
未通過判斷的候選一律不上線（不為了連而連）。

單位：
  R  讀本小節（content/library/{kinesiology,basic-biomechanics}/chNN/index.md 的 ## 小節）
  C  CSCS 知識單位（data/cscs/chNN.yaml 的 items）
  V  Vortex：動作圖譜動作／肌群、技術分析、傷害、呼吸節點、週期化節點
配對只取跨系列（R–C、R–V、C–V）與兩冊讀本之間（Rn–Rk）。

用法：python -X utf8 tools/crosslink_candidates.py [--top 4] [--min 0.12]
輸出：next/crosslinks/units.json（單位清單：id、系列、標題、摘要、網址）
      next/crosslinks/candidates.jsonl（每行一對：a、b、score）
"""
import argparse
import json
import math
import re
from collections import Counter, defaultdict
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "next" / "crosslinks"


def load_yaml(p):
    return yaml.safe_load(p.read_text(encoding="utf-8"))


def plain(s):
    if s is None:
        return ""
    if isinstance(s, (list, tuple)):
        return " ".join(plain(x) for x in s)
    if isinstance(s, dict):
        return " ".join(plain(v) for k, v in s.items() if k not in ("id", "source_ids", "sources", "links", "cross_ref_ids"))
    s = str(s)
    s = re.sub(r"\{\{[<%].*?[>%]\}\}", " ", s)
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"[*_`#>\[\]()]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


# ---------------------------------------------------------------- 單位抽取

def reader_units():
    books = json.loads((ROOT / "data/reading/books.json").read_text(encoding="utf-8"))
    out = []
    for key, slug, short in (("neumann", "kinesiology", "肌動學"), ("nordin", "basic-biomechanics", "生物力學")):
        for ch in books[key]["chapters"]:
            md = ROOT / "content/library" / slug / f"ch{ch['number']:02d}" / "index.md"
            if not md.exists():
                continue
            text = md.read_text(encoding="utf-8")
            text = re.sub(r"^---.*?\n---\s*\n", "", text, flags=re.S)
            parts = re.split(r"^## (.+?)\s*\{#([a-z0-9-]+)\}\s*$", text, flags=re.M)
            for i in range(1, len(parts) - 2, 3):
                title, anchor, body = parts[i].strip(), parts[i + 1], plain(parts[i + 2])
                out.append({
                    "id": f"{key}.ch{ch['number']:02d}.{anchor}",
                    "series": "R-" + key,
                    "book": short,
                    "title": f"{short}第{ch['number']}章 · {title}",
                    "text": f"{title} {body}",
                    "summary": body[:160],
                    "path": f"library/{slug}/ch{ch['number']:02d}/#{anchor}",
                })
    return out


def cscs_units():
    terms = load_yaml(ROOT / "data/cscs/_terms.yaml")
    out = []
    for n in range(1, 25):
        ch = load_yaml(ROOT / f"data/cscs/ch{n:02d}.yaml")
        for t in ch["topics"]:
            for it in t["items"]:
                en = " ".join(terms[k]["en"] for k in (it.get("terms") or []) if k in terms)
                body = plain(it.get("a")) + " " + plain(it.get("detail"))
                out.append({
                    "id": it["id"],
                    "series": "C",
                    "book": "CSCS",
                    "title": f"CSCS第{n}章 · {t['title']} · {it['q']}",
                    "text": f"{t['title']} {it['q']} {body} {en}",
                    "summary": plain(it.get("a"))[:160],
                    "path": f"library/essentials-of-strength-training/ch{n:02d}/#{it['id']}",
                })
    return out


def vortex_units():
    links = json.loads((ROOT / "next/data/vortex_links.json").read_text(encoding="utf-8"))
    out = []
    for uid, u in links["units"].items():
        if u["type"] not in ("tech", "injury"):
            continue
        r = u["record"]
        out.append({
            "id": uid, "series": "V", "book": "Vortex",
            "title": f"Vortex · {u['title']}",
            "text": f"{u['title']} {plain(r)}",
            "summary": (u.get("hook") or "")[:160],
            "path": u["path"],
        })
    for f, label, anchor_base in (("actions", "動作圖譜", "vortex/movement/"), ("muscle-groups", "動作圖譜", "vortex/movement/")):
        d = load_yaml(ROOT / f"data/movement/{f}.yaml")
        lst = next(v for v in d.values() if isinstance(v, list))
        for e in lst:
            name = e.get("name_zh") or e.get("name")
            out.append({
                "id": e["id"], "series": "V", "book": "Vortex",
                "title": f"Vortex {label} · {name}",
                "text": f"{name} {plain(e)}",
                "summary": plain(e.get("definition") or e.get("description"))[:160],
                "path": f"{anchor_base}#{e['id']}",
            })
    for sub, page in (("breathing", "vortex/breathing/"), ("periodization", "vortex/periodization/")):
        idx = load_yaml(ROOT / f"data/{sub}/_index.yaml")
        nodes = []

        def walk(o):
            if isinstance(o, dict):
                if isinstance(o.get("id"), str) and o.get("name_zh"):
                    nodes.append(o)
                for v in o.values():
                    walk(v)
            elif isinstance(o, list):
                for v in o:
                    walk(v)
        walk(idx)
        for nd in nodes:
            out.append({
                "id": nd["id"], "series": "V", "book": "Vortex",
                "title": f"Vortex {'呼吸' if sub == 'breathing' else '週期化'} · {nd['name_zh']}",
                "text": f"{nd['name_zh']} {plain(nd.get('gist_zh'))} {plain(nd)}",
                "summary": plain(nd.get("gist_zh"))[:160],
                "path": f"{page}#{nd['id']}",
            })
    return out


# ---------------------------------------------------------------- 相似度

def tokens(text):
    text = text.lower()
    han = re.findall(r"[一-鿿]+", text)
    grams = [run[i:i + 2] for run in han for i in range(len(run) - 1)]
    words = [w for w in re.findall(r"[a-z]{3,}", text)]
    return grams + words


def vectors(units):
    docs = [Counter(tokens(u["text"])) for u in units]
    df = Counter()
    for d in docs:
        df.update(d.keys())
    n = len(docs)
    vecs = []
    for d in docs:
        v = {t: (1 + math.log(c)) * math.log(n / df[t]) for t, c in d.items() if df[t] < n * 0.05}
        norm = math.sqrt(sum(x * x for x in v.values())) or 1.0
        vecs.append({t: x / norm for t, x in v.items()})
    return vecs


def allowed(a, b):
    sa, sb = a["series"], b["series"]
    if sa == sb:
        return False
    if sa.startswith("R") and sb.startswith("R"):
        return True  # 兩冊讀本之間
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--top", type=int, default=4)
    ap.add_argument("--min", type=float, default=0.12)
    args = ap.parse_args()
    units = reader_units() + cscs_units() + vortex_units()
    vecs = vectors(units)
    index = defaultdict(list)
    for i, v in enumerate(vecs):
        for t, x in v.items():
            index[t].append((i, x))
    pairs = {}
    for i, v in enumerate(vecs):
        scores = defaultdict(float)
        for t, x in v.items():
            for j, y in index[t]:
                if j != i:
                    scores[j] += x * y
        best = [(s, j) for j, s in scores.items() if s >= args.min and allowed(units[i], units[j])]
        best.sort(reverse=True)
        taken = Counter()
        for s, j in best:
            key = units[j]["series"][0]
            if taken[key] >= args.top:
                continue
            taken[key] += 1
            a, b = sorted((units[i]["id"], units[j]["id"]))
            pairs[(a, b)] = max(pairs.get((a, b), 0), round(s, 4))
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "units.json").write_text(json.dumps(
        {u["id"]: {k: u[k] for k in ("series", "book", "title", "summary", "path")} for u in units},
        ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    with (OUT / "candidates.jsonl").open("w", encoding="utf-8") as f:
        for (a, b), s in sorted(pairs.items(), key=lambda kv: -kv[1]):
            f.write(json.dumps({"a": a, "b": b, "score": s}, ensure_ascii=False) + "\n")
    by = Counter(u["series"] for u in units)
    kinds = Counter("".join(sorted((next(u for u in units if u["id"] == a)["series"][0],
                                    next(u for u in units if u["id"] == b)["series"][0]))) for a, b in list(pairs)[:0])
    print(f"單位 {len(units)}：{dict(by)}；候選對 {len(pairs)}")


if __name__ == "__main__":
    main()
