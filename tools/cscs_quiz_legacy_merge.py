"""把舊的 287 題題庫併進 `data/cscs/_quiz_bank/`。

舊檔是 AI 生成的四選項英文題，沒有任何欄位指回 `data/cscs/` 的知識單位，
也沒有 `locator`。專案規範要求每題可追溯來源，所以**不是照單全收，是逐題裁決**：
對不回任何知識單位的、與現有題目重複的、正解在來源裡站不住的，一律丟掉。

流程分兩段。第一段是機械檢索（TF-IDF 餘弦）把 1557 條知識單位縮到每題 6 個候選；
第二段把題目、候選條目全文、以及該條目在現有題庫裡已有的題幹一起送給模型，
由它裁決要不要收、收的話對到哪一條，並把四選項轉成三選項、補上兩則 `why_wrong`。

收進來的題標 `pool: extra`，不進 G10/G13 的配題表——那張表是照官方 DCO 權重配出來的
模擬卷藍圖，讓舊檔剛好有幾題來決定格子，等於把驗收基準交給一份來路不明的檔案。

    python -X utf8 tools/cscs_quiz_legacy_merge.py --retrieve     # 只建候選，不發請求
    python -X utf8 tools/cscs_quiz_legacy_merge.py --dry-run      # 印第一批 prompt
    python -X utf8 tools/cscs_quiz_legacy_merge.py --limit 20     # 先跑前 20 題試水
    python -X utf8 tools/cscs_quiz_legacy_merge.py                # 全跑
    python -X utf8 tools/cscs_quiz_legacy_merge.py --apply        # 把裁決結果寫進題庫
"""
import argparse
import glob
import io
import json
import math
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cscs_quiz_direct import (  # noqa: E402
    MAX_TOKENS,
    apply_patch,
    length_targets,
    load_yaml_lenient,
    merge_usage,
    report,
    strip_fence,
    stream_call,
)
from cscs_quiz_bank_check import check_bank  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "data" / "cscs"
BANK_DIR = SOURCE_DIR / "_quiz_bank"
LEGACY = Path("C:/claudehome/resources/raw/notes/CSCS_Full_QuestionBank.md")
WORK = Path("C:/claudehome/tmp")
VERDICTS = WORK / "legacy_verdicts.json"

BATCH = 5          # 一次送幾題：每題還要帶 6 條候選全文，再多會把 prompt 撐爛
CANDIDATES = 6
MIN_SCORE = 0.20   # 低於此分表示全庫沒有相近條目，直接判無來源
MAX_ITEM_QUESTIONS = 2   # 與 cscs_quiz_bank_check.py 的 G22 同值
FIX_ROUNDS = 4

STOP = set("""a an the of to in for and or is are was were be been being on at by with as
that this these those it its from which what who whom whose when where why how not no
does do did can could should would may might will shall than then there their them they
he she his her you your we our i me my if but so such into over under more most less
least each any all both other another same following during between within without""".split())


# ---------------------------------------------------------------- 解析舊檔

HEAD = re.compile(r"^### (\d+)\.\s*(.*)$")
OPT = re.compile(r"^([A-Z])\)\s*(.*)$")
ANS = re.compile(r"^\*\*Answer:\*\*\s*(.*)$")
RAT = re.compile(r"^\*\*Rationale:\*\*\s*(.*)$")


def parse_legacy():
    records, cur, field = [], None, None
    for line in LEGACY.open(encoding="utf-8").read().split("\n"):
        head = HEAD.match(line)
        if head:
            if cur:
                records.append(cur)
            cur = {"n": int(head.group(1)), "stem": head.group(2).strip(),
                   "options": [], "answer": "", "rationale": ""}
            field = "stem"
            continue
        if cur is None:
            continue
        for pattern, key in ((OPT, "option"), (ANS, "answer"), (RAT, "rationale")):
            match = pattern.match(line)
            if match:
                if key == "option":
                    cur["options"].append([match.group(1), match.group(2).strip()])
                else:
                    cur[key] = match.group(1).strip()
                field = key
                break
        else:
            text = line.strip()
            if text and text != "---" and field in ("stem", "answer", "rationale"):
                cur[field] += " " + text
    if cur:
        records.append(cur)
    return records


def usable(record) -> bool:
    """原檔就沒有標準答案的題目無從查證，直接丟掉。"""
    letters = {c for c, _ in record["options"]}
    match = re.match(r"^([A-Z])\)", record["answer"])
    return bool(match) and match.group(1) in letters


# ---------------------------------------------------------------- 檢索


def tokens(text):
    return [w for w in re.findall(r"[a-z0-9]+", text.lower())
            if w not in STOP and len(w) > 2]


def load_items():
    items = []
    for path in sorted(SOURCE_DIR.glob("ch*.yaml")):
        chid = path.stem
        src = yaml.safe_load(path.open(encoding="utf-8").read())
        for topic in src.get("topics", []):
            for it in topic.get("items", []):
                answers = [str(x) for x in (it.get("a") or [])]
                items.append({
                    "id": it["id"],
                    "ch": chid,
                    "q": it.get("q", ""),
                    "a": answers,
                    "detail": it.get("detail") or "",
                    "locator": it.get("locator") or "",
                    "blob": " ".join([it.get("q", "")] + answers
                                     + [it.get("detail") or ""]
                                     + [str(x) for x in (it.get("terms") or [])]),
                })
    return items


def load_bank():
    """回傳 item id → 既有題幹清單，以及每章允許的 dco。"""
    stems = defaultdict(list)
    dco_by_chapter = defaultdict(Counter)
    for path in sorted(BANK_DIR.glob("ch*.yaml")):
        bank = yaml.safe_load(path.open(encoding="utf-8").read())
        for q in bank["questions"]:
            stems[q["item"]].append(q["stem"])
            dco_by_chapter[path.stem][q["dco"]] += 1
    return stems, dco_by_chapter


def retrieve(records, items):
    docs = [tokens(it["blob"]) for it in items]
    df = Counter()
    for d in docs:
        df.update(set(d))
    n = len(docs)
    idf = {w: math.log(n / (1 + c)) for w, c in df.items()}

    vecs = []
    for d in docs:
        tf = Counter(d)
        v = {w: (1 + math.log(c)) * idf.get(w, 0.0) for w, c in tf.items()}
        norm = math.sqrt(sum(x * x for x in v.values())) or 1.0
        vecs.append({w: x / norm for w, x in v.items()})

    inverted = defaultdict(list)
    for i, v in enumerate(vecs):
        for w in v:
            inverted[w].append(i)

    out = {}
    for r in records:
        query = " ".join([r["stem"]] + [t for _, t in r["options"]] + [r["rationale"]])
        tf = Counter(tokens(query))
        qv = {w: (1 + math.log(c)) * idf[w] for w, c in tf.items() if w in idf}
        qnorm = math.sqrt(sum(x * x for x in qv.values())) or 1.0
        qv = {w: x / qnorm for w, x in qv.items()}

        scores = defaultdict(float)
        for w, x in qv.items():
            for i in inverted.get(w, ()):
                scores[i] += x * vecs[i].get(w, 0.0)
        ranked = sorted(scores.items(), key=lambda kv: -kv[1])[:CANDIDATES]
        out[r["n"]] = [(items[i], round(s, 3)) for i, s in ranked]
    return out


# ---------------------------------------------------------------- prompt

RULES = """你要把一份來路不明的舊 CSCS 題庫逐題裁決，決定哪些可以併進現有題庫。

現有題庫的每一題都能指回 data/cscs/ 的一條知識單位（item），並帶該條目的 locator。
舊題沒有這個欄位，所以你的第一件事是判斷：**這題的正解，是不是候選條目之一真的講過的事**。

判 reject 的情形（五選一，寫進 reason）：
- no-source：候選條目沒有一條支持這題的正解。正解可能是對的，但本教材沒收，就不能收。
- duplicate：候選條目底下列出的既有題幹，已經有一題在考同一件事。
- item-full：唯一支持這題的條目標了「已滿額」。內容沒問題，但一條目至多兩題，收不下。
- unsound：正解與候選條目的說法衝突，或題目本身有兩個對的選項、沒有對的選項。
- untestable：題目依賴教材沒給的公式、常模表或數值，算不出答案。

判 accept 時，把它改寫成現有題庫的格式，規則如下：

1. item 必須是候選清單裡的 id，原封不動抄。locator 抄該條目的 locator。
   **要挑正解本身在講的那一條，不是拿正解當對照組的那一條**——正解是「Type I」時，
   掛在「Type IIa 與 IIx 差在哪」下面是錯的，即使那條順帶提到了 Type I。
   正解在候選裡只有旁敲側擊、沒有一條正面講，那就是 no-source。
2. cognitive 三選一：recall（背得出來就答得出）、application（把原則套到情境）、
   analysis（要比較或推斷才答得出）。
3. dco 從候選條目所屬章節的既有 dco 挑一個（清單會附在候選旁）。
4. lang 一律 en。
5. stem 至少 8 個英文單字、以問號結尾。cognitive 是 application 或 analysis 時，
   stem 必須含 most / best / primary / greatest / first / highest / lowest / largest
   之類的限定詞，否則三個選項可能同時成立。
6. 選項恰好三個、恰好一個 correct: true。從原本的干擾項裡挑兩個最強的，其餘丟掉。
7. 三個選項的長度要接近：**正解不得超過最長干擾項的 1.15 倍**，
   最長選項不得超過最短的 1.5 倍。選項文字裡不准出現分號。
   長度靠調整詳略達成——補上限定條件或收掉冗詞。**不准把單字截短湊字數**
   （Leucine 寫成 Leucin 就是這樣來的），也不准加贅字。
8. **題幹不准把正解講完**。題幹寫出整句定義、三個選項各自附上自己的定義，
   考生只要比對字面就能選，不需要懂任何東西——這種題判 unsound。
   要考定義就給情境（「踮腳尖時腓腸肌屬於哪一類槓桿」），不要給定義問名字。
9. 每個干擾項要寫 why_wrong，至少 8 個英文單字，講「考生為什麼會被它騙」，
   不是講「它錯了」。**不准出現 reverses / reversed / inverted / inflates /
   overstates / understates / misreads / mistakenly / erroneously / incorrectly**
   這些字——那等於在選項旁邊貼答案。
10. 干擾項是算出來的數值時，why_wrong 要講對它是怎麼算錯的。
    250 磅做 10 次、用 Epley 估 1RM，285 磅是把次數當成 4 次算的、310 磅是當成 7 次，
    兩者對調就是錯的。寫之前自己把數字代一次。
11. 不准引入候選條目沒有的事實。原題的 rationale 只是參考，不是來源。

輸出 YAML 清單，每個舊題一筆，不要任何說明文字，不要 code fence：

- n: <舊題編號>
  verdict: reject
  reason: "no-source：候選條目都在講 X，沒有一條講到這題問的 Y"

- n: <舊題編號>
  verdict: accept
  item: ch03.energy-capacity.i07
  dco: sf1.E.1
  cognitive: recall
  locator: "第 3 章 · Energy Production and Capacity"
  stem: "..."
  options:
  - text: "..."
    correct: true
  - text: "..."
    correct: false
    why_wrong: "..."
  - text: "..."
    correct: false
    why_wrong: "..."
"""


def question_block(record, cands, bank_stems, dco_by_chapter):
    out = ["", "=" * 60, f"舊題 {record['n']}", f"題幹：{record['stem']}"]
    for letter, text in record["options"]:
        out.append(f"  {letter}) {text}")
    out.append(f"原標答案：{record['answer']}")
    out.append(f"原附解析：{record['rationale']}")
    out.append("")
    out.append(f"候選條目（{len(cands)} 條，item 只能從這裡挑）：")
    for item, score in cands:
        out.append(f"  --- {item['id']}  相似度 {score}")
        out.append(f"      Q: {item['q']}")
        for a in item["a"]:
            out.append(f"      A: {a}")
        if item["detail"]:
            out.append(f"      D: {item['detail']}")
        out.append(f"      locator: {item['locator']}")
        existing = bank_stems.get(item["id"], [])
        if len(existing) >= MAX_ITEM_QUESTIONS:
            out.append("      ** 本條目已滿額（一條至多兩題），不能再選 **")
        if existing:
            out.append("      既有題幹（撞到就判 duplicate）：")
            for stem in existing:
                out.append(f"        · {stem}")
        else:
            out.append("      既有題幹：無")
    chapters = sorted({item["ch"] for item, _ in cands})
    for ch in chapters:
        allowed = ", ".join(sorted(dco_by_chapter.get(ch, {})))
        out.append(f"  {ch} 可用的 dco：{allowed or '（無）'}")
    return out


# ---------------------------------------------------------------- 主流程


def dump_bank(path: Path, data) -> None:
    text = yaml.safe_dump(data, allow_unicode=True, sort_keys=False,
                          default_flow_style=False, width=10 ** 6)
    io.open(path, "w", encoding="utf-8", newline="\n").write(text)


def apply_verdicts() -> int:
    """把 accept 的裁決寫進各章題庫，標 `pool: extra`。"""
    if not VERDICTS.exists():
        print("還沒有裁決檔，先跑一次裁決", file=sys.stderr)
        return 1

    accepted, seen = [], set()
    for entry in json.loads(VERDICTS.read_text(encoding="utf-8")):
        if entry.get("verdict") != "accept" or entry.get("n") in seen:
            continue
        seen.add(entry["n"])
        accepted.append(entry)

    by_chapter = defaultdict(list)
    for entry in accepted:
        by_chapter[str(entry["item"]).split(".")[0]].append(entry)

    added, skipped = 0, []
    for chapter, entries in sorted(by_chapter.items()):
        path = BANK_DIR / f"{chapter}.yaml"
        bank = yaml.safe_load(io.open(path, encoding="utf-8").read())
        questions = bank["questions"]

        # 一條目至多兩題（G22）。這是計數約束，交給模型自律就會破——試點 20 題裡
        # 就有一題落在已經有兩題的條目上。滿額的在這裡直接擋掉，不寫進檔案。
        per_item = Counter(q["item"] for q in questions)
        # id 沿用既有的 `<item>.qN`，從該 item 目前最大的 N 往後接，避免撞 G21。
        used = {q["id"] for q in questions}
        written = 0
        for entry in entries:
            item = entry["item"]
            if per_item[item] >= MAX_ITEM_QUESTIONS:
                skipped.append((entry["n"], item))
                continue
            per_item[item] += 1
            index = 1
            while f"{item}.q{index}" in used:
                index += 1
            qid = f"{item}.q{index}"
            used.add(qid)
            questions.append({
                "id": qid,
                "item": item,
                "dco": entry["dco"],
                "lang": entry.get("lang", "en"),
                "cognitive": entry["cognitive"],
                "pool": "extra",
                "stem": entry["stem"],
                "locator": entry["locator"],
                "options": entry["options"],
            })
            added += 1
            written += 1

        if not written:
            continue
        dump_bank(path, bank)
        print(f"{chapter}：加入 {written} 題，全章 {len(questions)} 題")

    print(f"合計寫入 {added} 題（accept {len(accepted)} 題）")
    if skipped:
        print("條目已滿額而丟掉：" + "、".join(f"#{n} {item}" for n, item in skipped))
    return 0


ERROR_LINE = re.compile(r"^data/cscs/_quiz_bank/(ch\d\d)\.yaml:([^:]+):")

FIX_RULES = """下面這幾題沒通過題庫的結構閘。逐題改寫，修掉列出的每一條，其餘不要動。

硬規則（改寫時一併守住，不要修好一條又踩另一條）：
- id / item / dco / lang / cognitive / locator / pool 原樣保留，一個字都不准改。
- 選項恰好三個、恰好一個 correct: true；選項文字裡不准有分號。
- 每個干擾項都要有 why_wrong，至少 8 個英文單字，講「考生為什麼會被它騙」。
- why_wrong 不准照抄自己那個選項的字面，要換一組詞講背後的誤解。
- why_wrong 不准出現 reverses / reversed / inverted / inflates / overstates /
  understates / misreads / mistakenly / erroneously / incorrectly。
- cognitive 是 application 或 analysis 時，題幹必須含 most / best / primary /
  greatest / first / highest / lowest / largest 之類的限定詞。
- 不准引入原題沒有的事實；改寫的是措辭與詳略，不是內容。

輸出 YAML 清單，每題一筆完整題目（所有欄位都要，不是只給改動處），
不要任何說明文字，不要 code fence。"""


def fix_targets():
    """跑閘，回傳 (chapter → [(question, 錯誤行)], 全部錯誤行)。只挑 pool: extra 的題。"""
    errors, _, _ = check_bank()
    by_qid = defaultdict(list)
    for line in errors:
        match = ERROR_LINE.match(line)
        if match and match.group(2) != "-":
            by_qid[(match.group(1), match.group(2))].append(line)

    targets = defaultdict(list)
    for (chapter, qid), lines in sorted(by_qid.items()):
        bank = yaml.safe_load(io.open(BANK_DIR / f"{chapter}.yaml", encoding="utf-8").read())
        for question in bank["questions"]:
            if question["id"] == qid and question.get("pool") == "extra":
                targets[chapter].append((question, lines))
                break
    return targets, errors


def fix_block(question, lines):
    out = ["", "=" * 60, "錯誤："]
    out += [f"  {line}" for line in lines]

    # G2／G4 是純長度計數，而模型不會數數——目標先算好給它，跟正卷的修正輪同一套算法。
    if any(line.split(":", 3)[2] in ("G2", "G3", "G4") for line in lines):
        lengths, low, high = length_targets(question["options"])
        goal = (f"恰好 {low} 字元（三個一樣長）" if low >= high
                else f"{low}–{high} 字元（三個都落在區間內）")
        out.append(f"  ※ 三個選項目前是 {' / '.join(str(n) for n in lengths)} 字元，"
                   f"請全部改寫成 {goal}。長度連標點與空格一起算，why_wrong 不計入。")
    out.append("")
    out.append(yaml.safe_dump([question], allow_unicode=True, sort_keys=False,
                              default_flow_style=False, width=10 ** 6))
    return out


def fix_pass() -> int:
    """對 pool: extra 的題跑修正輪，直到閘門乾淨或連續兩輪原地打轉。"""
    usage_total, elapsed_total = {}, 0.0
    previous = None

    for round_index in range(1, FIX_ROUNDS + 1):
        targets, errors = fix_targets()
        if not targets:
            print(f"第 {round_index} 輪：額外題已無錯誤")
            break

        count = sum(len(v) for v in targets.values())
        print(f"第 {round_index} 輪：{count} 題待修（{len(targets)} 章）")
        current = frozenset(errors)
        if current == previous:
            print("與上一輪完全相同，原地打轉，停手交人工", file=sys.stderr)
            break
        previous = current

        for chapter, entries in sorted(targets.items()):
            body = [FIX_RULES, "", f"本章 {len(entries)} 題："]
            for question, lines in entries:
                body += fix_block(question, lines)

            label = f"fix {chapter} r{round_index}"
            text, usage, elapsed = stream_call(
                [{"role": "user", "content": "\n".join(body)}], MAX_TOKENS, label)
            merge_usage(usage_total, usage)
            elapsed_total += elapsed

            patches = load_yaml_lenient(strip_fence(text))
            if not isinstance(patches, list):
                print(f"[{label}] 回應不是清單，跳過", file=sys.stderr)
                continue

            path = BANK_DIR / f"{chapter}.yaml"
            bank = yaml.safe_load(io.open(path, encoding="utf-8").read())
            merged, patch_errors = apply_patch(bank["questions"], patches)
            if patch_errors:
                for line in patch_errors:
                    print(f"[{label}] {line}", file=sys.stderr)
                continue
            bank["questions"] = merged
            dump_bank(path, bank)

    report("legacy 修正合計", usage_total, elapsed_total)
    targets, _ = fix_targets()
    left = sum(len(v) for v in targets.values())
    print(f"額外題剩餘錯誤：{left} 題")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="把裁決結果寫進題庫")
    ap.add_argument("--fix", action="store_true", help="對已寫入的額外題跑修正輪")
    ap.add_argument("--retrieve", action="store_true", help="只做檢索並印分布")
    ap.add_argument("--dry-run", action="store_true", help="印第一批 prompt 就停")
    ap.add_argument("--limit", type=int, default=0, help="只處理前 N 題")
    args = ap.parse_args()

    if args.apply:
        sys.exit(apply_verdicts())
    if args.fix:
        sys.exit(fix_pass())

    records = [r for r in parse_legacy() if usable(r)]
    dropped = 287 - len(records)
    print(f"舊檔 287 題，原檔沒有標準答案而丟掉 {dropped} 題，進入裁決 {len(records)} 題")

    items = load_items()
    bank_stems, dco_by_chapter = load_bank()
    cands = retrieve(records, items)

    thin = [r["n"] for r in records if not cands[r["n"]] or cands[r["n"]][0][1] < MIN_SCORE]
    if thin:
        print(f"最佳候選低於 {MIN_SCORE}，判定全庫沒有相近條目：{thin}")
    records = [r for r in records if r["n"] not in set(thin)]

    if args.retrieve:
        buckets = Counter()
        for r in records:
            s = cands[r["n"]][0][1]
            buckets["0.5+" if s >= 0.5 else "0.35+" if s >= 0.35 else "0.2+"] += 1
        print("最佳候選分數：", dict(buckets))
        return

    if args.limit:
        records = records[: args.limit]

    batches = [records[i:i + BATCH] for i in range(0, len(records), BATCH)]
    print(f"共 {len(records)} 題，分 {len(batches)} 批")

    # 一題一個裁決。模型偶爾會對同一題吐兩筆（實測 n=4 同時回 duplicate 與 no-source），
    # 留第一筆即可，但必須在這裡擋掉，否則統計與套用階段都會重複計數。
    verdicts, seen = [], set()

    def collect(entry):
        n = entry.get("n")
        if n in seen:
            return False
        seen.add(n)
        verdicts.append(entry)
        return True

    if VERDICTS.exists():
        for entry in json.loads(VERDICTS.read_text(encoding="utf-8")):
            collect(entry)
        batches = [[r for r in b if r["n"] not in seen] for b in batches]
        batches = [b for b in batches if b]
        print(f"已有 {len(verdicts)} 題的裁決，剩 {len(batches)} 批要跑")

    usage_total, elapsed_total = {}, 0.0
    for index, batch in enumerate(batches, 1):
        body = [RULES, "", f"本批 {len(batch)} 題："]
        for record in batch:
            body += question_block(record, cands[record["n"]], bank_stems, dco_by_chapter)
        prompt = "\n".join(body)

        if args.dry_run:
            print(prompt)
            return

        label = f"legacy {index}/{len(batches)}"
        text, usage, elapsed = stream_call(
            [{"role": "user", "content": prompt}], MAX_TOKENS, label)
        merge_usage(usage_total, usage)
        elapsed_total += elapsed

        parsed = load_yaml_lenient(strip_fence(text))
        if not isinstance(parsed, list):
            print(f"[{label}] 回應不是清單，整批跳過", file=sys.stderr)
            (WORK / f"legacy_batch{index}_raw.txt").write_text(text, encoding="utf-8")
            continue
        wanted = {r["n"] for r in batch}
        got = 0
        for entry in parsed:
            if isinstance(entry, dict) and entry.get("n") in wanted:
                got += collect(entry)
        VERDICTS.write_text(json.dumps(verdicts, ensure_ascii=False, indent=1),
                            encoding="utf-8")
        print(f"[{label}] 收到 {got}/{len(batch)} 題裁決，累計 {len(verdicts)}")

    report("legacy 合計", usage_total, elapsed_total)
    counts = Counter(v.get("verdict") for v in verdicts)
    print("裁決結果：", dict(counts))
    reasons = Counter(str(v.get("reason", "")).split("：")[0]
                      for v in verdicts if v.get("verdict") == "reject")
    print("退件原因：", dict(reasons))
    print("已寫出", VERDICTS)


main()
