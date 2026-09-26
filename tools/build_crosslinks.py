"""跨系列知識連結：組裝上線資料（Claude 撰寫，2026-09-26）。

採用規則（寧可少連，不要錯連）：
  score ≥ 0.08：初審 link=true 即採用
  score < 0.08：初審 link=true 且嚴格複審 keep=true 才採用
輸出 next/data/crosslinks.json：{單位 id: [{to, book, title, path, rel, why}, …]}，雙向，
每個單位依關係類型（機制 → 同一概念 → 應用 → 數據）再依分數排序。

用法：python -X utf8 tools/build_crosslinks.py
"""
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "next" / "crosslinks"
OUT = ROOT / "next" / "data" / "crosslinks.json"
CUT = 0.08
REL_ORDER = {"機制": 0, "同一概念": 1, "應用": 2, "數據": 3}


AB = re.compile(r"(?<![A-Za-z])([AB])(?![A-Za-z型])")


def reword(why, forward):
    """初審理由用 A／B 指涉（A＝來源、B＝連到的那篇）。顯示在 src 頁時：自己＝「這裡」、對方＝「它」。"""
    here, there = ("A", "B") if forward else ("B", "A")
    out = AB.sub(lambda m: "這裡" if m.group(1) == here else "它", why)
    out = re.sub(r"(這裡|它)\s+(?=[一-鿿])", lambda m: m.group(1), out)
    return re.sub(r"(?<=[一-鿿，、])\s+(這裡|它)", lambda m: m.group(1), out)


def lines(p):
    return [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()] if p.exists() else []


def main():
    units = json.loads((DIR / "units.json").read_text(encoding="utf-8"))
    verify = {(v["a"], v["b"]): v["keep"] for v in lines(DIR / "verify.jsonl")}
    links = defaultdict(list)
    kept = 0
    for j in lines(DIR / "judgments.jsonl"):
        if not j.get("link"):
            continue
        if j["score"] < CUT and not verify.get((j["a"], j["b"]), False):
            continue
        kept += 1
        for src, dst, fwd in ((j["a"], j["b"], True), (j["b"], j["a"], False)):
            u = units[dst]
            links[src].append({
                "to": dst, "book": u["book"], "title": u["title"], "path": u["path"],
                "rel": j.get("rel", ""), "why": reword(j.get("why", ""), fwd), "score": j["score"],
            })
    for k, lst in links.items():
        lst.sort(key=lambda x: (REL_ORDER.get(x["rel"], 9), -x["score"]))
        for x in lst:
            del x["score"]
    # 每頁有哪些單位：版型用來只輸出本頁需要的連結（路徑為 # 之前的部分）
    pages = defaultdict(list)
    for k in links:
        page, _, anchor = units[k]["path"].partition("#")
        pages[page].append({"id": k, "anchor": anchor})
    OUT.write_text(json.dumps({"links": links, "pages": pages}, ensure_ascii=False, separators=(",", ":")),
                   encoding="utf-8")
    print(f"採用 {kept} 對；有跨系列連結的單位 {len(links)} 個 → {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
