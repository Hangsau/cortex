"""由 data/cscs/ 生成按考試權重配比的模擬題。

抓別人的題是單次性的，自己的 1557 條知識單位可以無限出題——而且每題都帶
locator，答錯能直接回到書上那一段。配題比例來自 _domains.yaml 的 scored，
不是照章節平均分，否則會照內容量出題（d1 佔內容 29% 但只考 23%）。

干擾項取自「同章但不同主題」的條目。亂數取全書會出現一眼就排除的荒謬選項；
但取同主題的兄弟條目更糟——同主題常常在講同一個概念的不同面向，三個選項會
同時成立（實測 ch14 柔軟度那組就是這樣整題作廢）。同章不同主題是唯一兼顧
「用語夠像」與「敘述不會剛好也對」的距離。

即使如此，偶爾仍會抽到對本題也成立的敘述，所以每題都印干擾項的來源 id——
看到可疑的就回去讀那兩條，不要靠工具猜。

涵蓋範圍的硬限制：三型題（fact / number / term）都是從單一知識單位出的記憶題，
而官方 DCO 的認知層級配題只有 23% 是記憶（pa1 更只有 2/44）。這份模擬考照
domain 權重配比，但不照認知層級配比——考滿分不代表會過。應用與分析那四分之三
在 _applied.yaml 的題型分支，那層目前還沒接進出題器。

用法：
  python tools/cscs_quiz.py                      # 190 題全考試權重配比
  python tools/cscs_quiz.py --n 40               # 40 題，仍照權重
  python tools/cscs_quiz.py --domain d6-testing  # 只出某 domain
  python tools/cscs_quiz.py --chapter ch19       # 只出某章（忽略權重）
  python tools/cscs_quiz.py --seed 7 --json out.json
"""
import argparse
import json
import random
import sys
from pathlib import Path

import yaml

DATA = Path(__file__).resolve().parent.parent / "data" / "cscs"

sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def load(name):
    return yaml.safe_load((DATA / f"{name}.yaml").read_text(encoding="utf-8"))


def collect(chapters):
    """攤平成 (ch, topic, item) 三元組，保留主題歸屬供抽干擾項用。"""
    rows = []
    for ch_id, ch in chapters.items():
        for topic in ch["topics"]:
            for item in topic["items"]:
                rows.append((ch_id, topic["id"], item))
    return rows


def too_close(a, b):
    """字面重疊過高的干擾項等於重複選項，要丟掉。"""
    if a == b:
        return True
    sa, sb = set(a), set(b)
    if not sa or not sb:
        return True
    return len(sa & sb) / len(sa | sb) > 0.6


def pick_distractors(pool, correct, rng, k=3):
    rng.shuffle(pool)
    out, used = [], set()
    for text, src in pool:
        if too_close(correct, text):
            continue
        if src in used:  # 同一條目出兩個選項會讓四選一變成二選一
            continue
        if any(too_close(text, t) for t, _ in out):
            continue
        used.add(src)
        out.append((text, src))
        if len(out) == k:
            return out
    return None


def q_fact(ch_id, topic_id, item, by_chapter, rng):
    # 題幹只有「在柔軟度計畫中的位置」這種依附上文的短句時，離開原章節就看不懂
    if len(item["q"]) < 8:
        return None
    bullets = [b for b in (item.get("a") or []) if isinstance(b, str) and len(b) > 6]
    if not bullets:
        return None
    # a 是有序的：第一條通常直接回答 q，越後面越是補充。取兩次索引取小值偏向前段，
    # 否則會抽到「這些動作對髖膝踝的需求不同」這種讀起來沒回答題幹的補充句。
    correct = bullets[min(rng.randrange(len(bullets)), rng.randrange(len(bullets)))]
    pool = [
        (b, sib["id"])
        for sib_topic, sib in by_chapter[ch_id]
        if sib_topic != topic_id
        for b in (sib.get("a") or [])
        if isinstance(b, str) and len(b) > 6
    ]
    d = pick_distractors(pool, correct, rng)
    if not d:
        return None
    return {
        "kind": "fact",
        "stem": f"關於「{item['q']}」，下列哪一項正確？",
        "correct": correct,
        "distractors": d,
        "item": item["id"],
        "locator": item.get("locator", ""),
    }


def magnitude(v):
    """取數值的量級參考。區間（'15–19'、'5-10'）取第一個數。"""
    head = str(v).replace(",", "").replace("≥", "").replace("≤", "")
    for sep in ("–", "-", "~"):
        if sep in head[1:]:
            head = head[0] + head[1:].split(sep)[0]
            break
    try:
        return abs(float(head))
    except ValueError:
        return None


def in_scale(a, b):
    if a is None or b is None:
        return True
    if a == 0 or b == 0:
        return a == b
    return 0.2 <= a / b <= 5


def perturb(v, unit, rng):
    """由正解倍率生成三個同量級的假值。只吃單一數值，區間（'1.5–2.0'）不處理。"""
    try:
        base = float(str(v).replace(",", ""))
    except ValueError:
        return None
    if base == 0:
        return None
    decimals = len(str(v).split(".")[1]) if "." in str(v) else 0
    out, seen = [], {str(v)}
    for f in rng.sample([0.5, 0.67, 0.75, 1.25, 1.5, 2.0, 3.0], 7):
        cand = round(base * f, decimals)
        text = f"{cand:.{decimals}f}" if decimals else str(int(cand))
        if text in seen:
            continue
        seen.add(text)
        out.append((f"{text} {unit}", "（倍率擾動）"))
        if len(out) == 3:
            return out
    return None


def q_number(ch_id, topic_id, item, by_unit, rng):
    nums = [n for n in (item.get("numbers") or []) if n.get("v") and n.get("of")]
    if not nums:
        return None
    n = rng.choice(nums)
    unit = n["unit"]
    correct = f"{n['v']} {unit}"
    # 同單位還不夠：「年度訓練計畫的持續時間」配到「2004 年」、「2,300 m」配到
    # 「2.7 m」都是一眼排除的送分選項。差距超過五倍的一律不當干擾項。
    base = magnitude(n["v"])
    pool = [
        (f"{o['v']} {unit}", oid)
        for o, oid in by_unit.get(unit, [])
        if oid != item["id"]
        and str(o["v"]) != str(n["v"])
        and in_scale(base, magnitude(o["v"]))
    ]
    d = pick_distractors(pool, correct, rng)
    if not d:
        # 單位獨一無二的數字（「8 條線」）在全書找不到同單位兄弟，改用倍率擾動。
        # 數字題是 CSCS 的大宗，只靠同單位配對會讓這型別幾乎出不出來。
        d = perturb(n["v"], unit, rng)
    if not d:
        return None
    return {
        "kind": "number",
        "stem": f"「{item['q']}」：{n['of']}是多少？",
        "correct": correct,
        "distractors": d,
        "item": item["id"],
        "locator": item.get("locator", ""),
    }


def q_term(ch_id, topic_id, item, terms, by_chapter_terms, rng):
    keys = [k for k in (item.get("terms") or []) if k in terms]
    if not keys:
        return None
    key = rng.choice(keys)
    t = terms[key]
    if not t.get("en") or not t.get("zh"):
        return None
    pool = [
        (terms[k]["zh"], k)
        for k in by_chapter_terms.get(ch_id, [])
        if k != key and terms[k].get("zh")
    ]
    d = pick_distractors(pool, t["zh"], rng)
    if not d:
        return None
    return {
        "kind": "term",
        "stem": f"{t['en']} 的中文是？",
        "correct": t["zh"],
        "distractors": d,
        "item": item["id"],
        "locator": item.get("locator", ""),
    }


def allocate(domains, n, only_domain):
    """按 scored 比例配額，餘數給最大小數（配少一題就是靜默漏一個 domain）。"""
    ds = [d for d in domains if not only_domain or d["id"] == only_domain]
    total = sum(d["scored"] for d in ds)
    raw = {d["id"]: n * d["scored"] / total for d in ds}
    alloc = {k: int(v) for k, v in raw.items()}
    for k in sorted(raw, key=lambda k: raw[k] - alloc[k], reverse=True)[: n - sum(alloc.values())]:
        alloc[k] += 1
    return alloc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=190)
    ap.add_argument("--domain")
    ap.add_argument("--chapter")
    ap.add_argument("--seed", type=int)
    ap.add_argument("--json")
    args = ap.parse_args()

    rng = random.Random(args.seed)
    terms = load("_terms")
    domains = load("_domains")["domains"]
    chapters = {p.stem: load(p.stem) for p in sorted(DATA.glob("ch*.yaml"))}

    rows = collect(chapters)
    by_chapter = {}
    by_unit = {}
    by_chapter_terms = {}
    for ch_id, topic_id, item in rows:
        by_chapter.setdefault(ch_id, []).append((topic_id, item))
        for n in item.get("numbers") or []:
            if n.get("unit") and n.get("v"):
                by_unit.setdefault(n["unit"], []).append((n, item["id"]))
        for k in item.get("terms") or []:
            if k in terms:
                by_chapter_terms.setdefault(ch_id, []).append(k)

    if args.chapter:
        buckets = {args.chapter: [r for r in rows if r[0] == args.chapter]}
        alloc = {args.chapter: args.n}
    else:
        ch_domain = {ch: d["id"] for d in domains for ch in d["chapters"]}
        buckets = {}
        for r in rows:
            buckets.setdefault(ch_domain[r[0]], []).append(r)
        alloc = allocate(domains, args.n, args.domain)

    # 術語題只考中譯，是三型裡最淺的，壓在 15%；敘述題才逼你分辨概念
    kinds = ["fact"] * 12 + ["number"] * 5 + ["term"] * 3
    questions = []
    for bucket, want in alloc.items():
        pool = list(buckets.get(bucket, []))
        rng.shuffle(pool)
        got, cursor = 0, 0
        while got < want and cursor < len(pool) * 3:
            ch_id, topic_id, item = pool[cursor % len(pool)]
            cursor += 1
            first = rng.choice(kinds)
            order = [first] + [k for k in ("fact", "number", "term") if k != first]
            q = None
            for kind in order:
                if kind == "fact":
                    q = q_fact(ch_id, topic_id, item, by_chapter, rng)
                elif kind == "number":
                    q = q_number(ch_id, topic_id, item, by_unit, rng)
                else:
                    q = q_term(ch_id, topic_id, item, terms, by_chapter_terms, rng)
                if q:
                    break
            if q:
                q["bucket"] = bucket
                q["chapter"] = ch_id
                questions.append(q)
                got += 1
        if got < want:
            print(f"# 警告：{bucket} 只出到 {got}/{want} 題", file=sys.stderr)

    for q in questions:
        opts = [(q["correct"], None)] + q["distractors"]
        rng.shuffle(opts)
        q["options"] = [o[0] for o in opts]
        q["answer"] = next(i for i, o in enumerate(opts) if o[1] is None)
        q["distractor_sources"] = [s for _, s in q["distractors"] if s]

    if args.json:
        Path(args.json).write_text(
            json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"{len(questions)} 題寫入 {args.json}")
        return 0

    print(f"# CSCS 模擬題（{len(questions)} 題，seed={args.seed}）\n")
    print("> 全為記憶型題目。官方 DCO 只有 23% 是記憶題，本卷不反映應用與分析的配比。\n")
    for i, q in enumerate(questions, 1):
        print(f"**{i}.**（{q['bucket']} / {q['chapter']} / {q['kind']}）{q['stem']}")
        for j, o in enumerate(q["options"]):
            print(f"   {'ABCD'[j]}. {o}")
        print()
    print("\n---\n\n## 答案與出處\n")
    for i, q in enumerate(questions, 1):
        src = "、".join(q["distractor_sources"])
        print(f"{i}. **{'ABCD'[q['answer']]}** — `{q['item']}`　{q['locator']}")
        print(f"   干擾項出自：{src}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
