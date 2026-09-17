"""驗收靜態 CSCS 題庫；從任何工作目錄執行皆讀取本 repo 的資料。"""

import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from collections import defaultdict
from itertools import combinations
from pathlib import Path
import re
from statistics import mean, pstdev

import yaml


ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "data" / "cscs"
BANK_DIR = SOURCE_DIR / "_quiz_bank"
COGNITIVE_LEVELS = ("recall", "application", "analysis")
LANGS = ("zh", "en")
# G15：比較限定詞。R3 是本考試的核心出題特徵——沒有這類詞的 application / analysis 題，
# 幾乎一定是真假判斷題，干擾項一眼就死。中文用字面比對，英文用詞邊界避免 most 誤中 almost。
QUALIFIERS_ZH = ("最", "首先", "優先", "第一步", "主要", "首要")
QUALIFIERS_EN = re.compile(
    r"\b(most|least|primary|primarily|best|greatest|first|highest|lowest|"
    r"minimum|maximum|largest|smallest|main)\b",
    re.IGNORECASE,
)
OPTION_COUNT = 3  # NSCA 官方樣題一律三選項；四選一是坊間題庫的習慣，不是本考試的格式
TOLERANCE = 1  # 配題表允許的每格誤差
# G22：同一個 item 至多幾題。章節來源只有 60–70 條 item 卻要出 100 題，同 item 出 2 題
# 是設計的一部分；第 3 題就開始在同一句話上打轉，鑑別的是題目而不是知識。
MAX_ITEM_QUESTIONS = 2
LENGTH_RATIO = 1.5  # G4：最長 / 最短選項。2.0 放行了「muscles pull only」這種電報體正解

# G17：把希臘字母當英文單字的縮寫（ν 代替 frequency、ΔP 代替 pressure difference）是湊長度的手法，
# 不是術語。合法用法一律帶連字號接續（α-motor unit、γ-motor neuron）或是 µ 開頭的單位（µm）。
GREEK = re.compile(r"[Ͱ-Ͽἀ-῿∆]")
GREEK_OK = re.compile(r"[Ͱ-Ͽἀ-῿](?=-\w)|[μµ](?=[a-zA-Z])")

# G18：數字題的三個選項必須量同一件事。同單位擋不掉「250 µm 肌纖維直徑 vs 2 µm 肌節長度」，
# 但擋得掉混用量級單位（nm vs µm）這種最常見的湊選項手法。只認長度／質量／時間／體積，
# 不認 %／reps／sets——課程設計題的選項本來就會同時出現那幾個。
#
# 斜線接續的比值是**一個**單位，不是兩個：`g/kg`、`mL/kg/min` 量的是單一件事，
# 拆成 g 與 kg 會把營養章整批正常題判成混用單位（ch10 的蛋白質攝取題就是這樣誤殺的，
# 而章節來源自己就把它寫成 `unit: g/kg 體重/日`）。比值與絕對量混用仍然擋得住——
# `g/kg` 與 `kg` 是兩個不同的 token。
_UNIT = r"(?:nm|µm|μm|um|mm|cm|km|m|kg|lb|mg|g|ms|min|hr|h|s|mL|L)"
MEASURE_UNIT = re.compile(rf"(?<![A-Za-z]){_UNIT}(?:/{_UNIT})*(?![A-Za-z])")

# G20：干擾項不准在文字裡評價自己。ch05 與 ch06 各出現一批「選項尾巴掛一句錯因」的送分題：
# `Direction reverses, reads the analysis as a 5 to 10 percent rise`、
# 「FOR → 急性疲勞 → NFOR → OTS，順序顛倒、恢復時間錯置」、
# 「荷爾蒙種類會完全改變，出現書中沒有的新胜肽」。
# 這些全部過得了其他 19 道閘，但考生不必讀書就能刪掉它們。
# 選項只陳述一個說法，評價它是 why_wrong 的工作。
# 只收「一望即知是在講自己錯了」的字眼；「相反」「下降」這類可以是正當的內容敘述，不收。
GIVEAWAY = re.compile(
    r"顛倒|反轉|錯置|誤植|張冠李戴|書中沒有|書中未|教材沒有|與書中不符|並非書中|"
    r"\b(reverses|reversed|inverted|inflates|inflated|overstates|overstated|"
    r"understates|understated|misreads|misread|mistakenly|erroneously|incorrectly)\b",
    re.IGNORECASE,
)


def _allocation():
    """章 → (總題數, recall, application, analysis, 英文題數)，來源是 cscs_quiz_spec.md 第六節。

    配題直接複製該 domain 的官方認知層級配比，所以這張表改動前要先改規格，
    不是反過來——規格是派工時送出去的那份，工具只是它的機器版本。
    """
    table = {}

    def assign(chapters, total, recall, application, analysis, english):
        for chapter in chapters:
            table[chapter] = (total, recall, application, analysis, english)

    def span(first, last):
        return [f"ch{n:02d}" for n in range(first, last + 1)]

    assign(span(1, 7), 35, 10, 20, 5, 13)
    assign(["ch08"], 100, 30, 60, 10, 33)
    assign(span(9, 11), 20, 5, 10, 5, 8)
    assign(span(12, 13), 55, 8, 30, 17, 18)
    assign(span(14, 16), 48, 8, 25, 15, 15)
    assign(span(17, 22), 38, 3, 18, 17, 13)
    assign(span(23, 24), 40, 28, 12, 0, 13)
    return table


ALLOCATION = _allocation()


class StrictLoader(yaml.SafeLoader):
    """拒絕重複 YAML key，避免選項或答案被解析器靜默覆寫。"""


def unique_mapping(loader, node, deep=False):
    mapping = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        try:
            duplicate = key in mapping
        except TypeError as exc:
            raise yaml.YAMLError("YAML mapping 的 key 必須可雜湊") from exc
        if duplicate:
            raise yaml.YAMLError(
                f"第 {key_node.start_mark.line + 1} 行重複的 key：{key}"
            )
        mapping[key] = loader.construct_object(value_node, deep=deep)
    return mapping


StrictLoader.add_constructor(
    yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping
)


def jaccard(a: str, b: str) -> float:
    """依原始字元集合計算，包含標點及空白，不做正規化。"""
    left, right = set(a), set(b)
    union = left | right
    return len(left & right) / len(union) if union else 0.0


def jaccard_words(a: str, b: str) -> float:
    """英文用：依詞集合計算，大小寫不敏感。

    英文的字元集合量的是字母表重疊，不是相似度——`Capillary density increases markedly`
    與 `Mitochondrial volume declines sharply` 一個詞都不共用，字元 Jaccard 卻是 0.667。
    ch04–ch06 的英文題被 G9 判失敗的 16 對裡有 13 對是這種誤殺。
    改用詞集合後，真正的近重複（鏡像句、只改一個動詞）落在 0.556–0.750，
    語意不同的落在 0.000–0.333，兩組分得開。
    """
    left = set(re.findall(r"\w+", a.lower()))
    right = set(re.findall(r"\w+", b.lower()))
    union = left | right
    return len(left & right) / len(union) if union else 0.0


NUMERIC_CHARS = re.compile(r"[0-9,.\-–—~%]+")


def differ_only_in_numbers(a: str, b: str) -> bool:
    """兩個選項是不是「只有數值不同」——扣掉數字與其分隔符後剩下的文字完全一樣。

    G9 要擋的是**考生不必讀書就能刪掉**的近重複：鏡像句、只換一個動詞。
    數值選項不屬於這一類：`560–700 g` 與 `210–280 g` 的字元重疊率 0.667、
    `2,040 kcal per day` 與 `2,480 kcal per day` 的詞重疊率 0.667，
    但兩者的差別正是題目要考的那個量，看得懂單位也刪不掉任何一個。
    最極端的一筆是 ch10 的每日能量消耗組成題：三個選項是同三個百分比帶的不同配對，
    字元集合完全相同、重疊率 1.000，而它是本章最好的一題。

    這跟 `jaccard_words` 的理由是同一條——重疊率量錯了東西就會誤殺，
    修的是度量不是內容。條件收得很緊（扣掉數字後必須**完全**相同，且數字本身要有差異），
    所以「只換一個動詞」那類仍然照擋。
    """
    if a == b:
        return False
    residue_a = NUMERIC_CHARS.sub("", a)
    residue_b = NUMERIC_CHARS.sub("", b)
    return residue_a == residue_b


def option_overlap(a: str, b: str, lang: str) -> tuple:
    """回傳 (重疊率, 上限)。中文沿用字元集合——中文沒有詞間空白，單字本身就是語素，
    字元重疊確實反映語意重疊（平行數字三連的 0.938 是真陽性）。

    實測 ch04–ch05 已查證合格的內容：中文選項兩兩字元重疊平均 0.201，餘裕很大；
    英文同一算法平均 0.486、最高 0.593，永遠貼著 0.6 這條線走——那不是內容有問題，
    是算法在英文上量錯了東西。
    """
    if lang == "en":
        return jaccard_words(a, b), 0.5
    return jaccard(a, b), 0.6


def why_wrong_overlap(why: str, text: str, lang: str) -> tuple:
    """G5 用。同 `option_overlap` 的理由：英文比詞，中文比字元。

    英文上限取 0.45——合格內容的詞重疊最高 0.238，而「錯因只是把選項加個 not 複述一次」
    落在 0.5，兩者分得開。更細緻的複述抓不到是預期的，那本來就該由第二輪審查與人工查證負責；
    字元版連「完全不同的兩句話」都在擋，抓到的是雜訊不是複述。
    """
    if lang == "en":
        return jaccard_words(why, text), 0.45
    return jaccard(why, text), 0.6


def cjk(text: str) -> set:
    return {c for c in text if "一" <= c <= "鿿"}


def walk_strings(node, seen: set):
    if isinstance(node, dict):
        for key, value in node.items():
            walk_strings(key, seen)
            walk_strings(value, seen)
    elif isinstance(node, list):
        for value in node:
            walk_strings(value, seen)
    elif isinstance(node, str):
        seen |= cjk(node)


def novel_chars(bank_dir: Path = BANK_DIR, source_dir: Path = SOURCE_DIR):
    """G11：題庫用了哪些字不曾出現在已審的 1557 條正體語料裡。

    簡體字（帶→带）和錯字在語法層完全合法，G1–G10 全數放行，人眼在 1500 題
    規模也看不完。以語料字集當白名單是自校正的——語料本身就是驗收過的正體。
    回報而不判失敗：新章節自然會帶進新的正體字（攏、閘），擋下來只會製造假失敗。
    """
    corpus = set()
    for path in sorted(source_dir.glob("*.yaml")):
        try:
            with path.open(encoding="utf-8") as handle:
                walk_strings(yaml.safe_load(handle), corpus)
        except (OSError, UnicodeError, yaml.YAMLError):
            continue
    if not corpus:
        return {"-": "無法建立語料字集，G11 未執行"}

    result = {}
    for path in sorted(bank_dir.glob("*.yaml")):
        used = set()
        try:
            with path.open(encoding="utf-8") as handle:
                data = yaml.safe_load(handle)
        except (OSError, UnicodeError, yaml.YAMLError):
            continue
        # 英文題的 why_wrong 仍可能寫中文，但題幹與選項是英文；整份掃會把英文題裡
        # 引用的專有名詞漢字一併倒進來。只掃 lang != en 的題目。
        if isinstance(data, dict) and isinstance(data.get("questions"), list):
            data = [
                question for question in data["questions"]
                if not (isinstance(question, dict) and question.get("lang") == "en")
            ]
        walk_strings(data, used)
        unseen = used - corpus
        if unseen:
            result[path.name] = "".join(sorted(unseen))
    return result


def load_dco(source_dir: Path = SOURCE_DIR):
    """G12 用：回傳 (合法 dco id 集合, domain 前綴 → 該 domain 涵蓋的章節集合)。

    dco id 接受 task 層（sf1.A）與 knowledge 層（sf1.A.1）兩種粒度；章節歸屬取自
    `_domains.yaml` 的 chapters 與 also——`also` 是「這章也被該 domain 考到」的次要歸屬，
    不納入的話跨章主題（例如營養章被課程設計考到）會被誤判成填錯 dco。
    """
    ids = set()
    chapters = defaultdict(set)
    try:
        with (source_dir / "_dco.yaml").open(encoding="utf-8") as handle:
            dco = yaml.safe_load(handle)
        with (source_dir / "_domains.yaml").open(encoding="utf-8") as handle:
            domains = yaml.safe_load(handle)
    except (OSError, UnicodeError, yaml.YAMLError):
        return None, None

    if not isinstance(dco, dict) or not isinstance(dco.get("domains"), list):
        return None, None
    for domain in dco["domains"]:
        if not isinstance(domain, dict) or not isinstance(domain.get("tasks"), list):
            continue
        for task in domain["tasks"]:
            if not isinstance(task, dict) or not isinstance(task.get("id"), str):
                continue
            ids.add(task["id"])
            # pa2.B 的 knowledge id 是 `pa2.B.*.a` 這種模板，`*` 代表四個器材類別之一；
            # 展開後才是真實 id（`_dco.yaml` 該處註解寫的就是這個意思）。
            classes = [
                cls for cls in task.get("equipment_classes") or []
                if isinstance(cls, dict) and isinstance(cls.get("id"), str)
            ]
            for knowledge in task.get("knowledge") or []:
                if not (isinstance(knowledge, dict) and isinstance(knowledge.get("id"), str)):
                    continue
                kid = knowledge["id"]
                if "*" in kid and classes:
                    for cls in classes:
                        ids.add(kid.replace("*", cls["id"].rsplit(".", 1)[-1]))
                else:
                    ids.add(kid)

    if not isinstance(domains, dict) or not isinstance(domains.get("domains"), list):
        return None, None
    for domain in domains["domains"]:
        if not isinstance(domain, dict) or not isinstance(domain.get("id"), str):
            continue
        prefix = domain["id"].split("-", 1)[0]
        for key in ("chapters", "also"):
            for chapter in domain.get(key) or []:
                if isinstance(chapter, str):
                    chapters[prefix].add(chapter)
    return ids, chapters


def check_bank(bank_dir: Path = BANK_DIR, source_dir: Path = SOURCE_DIR):
    """回傳 (完整錯誤清單, 題數, 章數)，不修改任何來源或題庫檔案。"""
    errors = []
    total = 0
    chapters = set()
    stems_seen = {}
    chapter_questions = defaultdict(list)
    negative_stems = defaultdict(list)
    ids_seen = {}  # G21：(章, 題目 id) → 先出現的題號
    item_usage = defaultdict(lambda: defaultdict(list))  # G22：章 → item → 用到它的題目 id
    dco_ids, dco_chapters = load_dco(source_dir)

    def fail(path, question_id, rule, explanation):
        try:
            filename = path.relative_to(ROOT).as_posix()
        except ValueError:
            filename = path.as_posix()
        # YAML 解析錯誤可能有多行；每筆診斷仍維持「檔案:題號:規則:說明」。
        label = " ".join(str(question_id).splitlines())
        message = " ".join(str(explanation).splitlines())
        errors.append(f"{filename}:{label}:{rule}:{message}")

    def read_yaml(path, report_path, rule):
        try:
            with path.open(encoding="utf-8") as handle:
                return yaml.load(handle, Loader=StrictLoader)
        except (OSError, UnicodeError, yaml.YAMLError) as exc:
            fail(report_path, "-", rule, f"無法讀取 {path.name}：{exc}")
            return None

    files = sorted(bank_dir.glob("*.yaml"))
    if not files:
        fail(bank_dir, "-", "G1", "題庫不存在或沒有 YAML 檔案")

    for path in files:
        data = read_yaml(path, path, "G1")
        if not isinstance(data, dict):
            fail(path, "-", "G1", "題庫頂層必須是 mapping")
            continue

        # G7：檔名與 meta 指向同一章；只從固定來源目錄載入對應 chNN.yaml。
        chapter = path.stem
        if not re.fullmatch(r"ch[0-9]{2}", chapter):
            fail(path, "-", "G7", "題庫檔名必須是 chNN.yaml")
            continue
        chapters.add(chapter)
        meta = data.get("meta")
        if not isinstance(meta, dict):
            fail(path, "-", "G7", "缺少 meta mapping")
        elif (
            meta.get("chapter") != chapter
            or meta.get("source") != f"data/cscs/{chapter}.yaml"
        ):
            fail(path, "-", "G7", "meta.chapter / meta.source 必須對應題庫檔名")

        source = read_yaml(source_dir / path.name, path, "G7")
        items = {}
        if not isinstance(source, dict) or not isinstance(source.get("topics"), list):
            fail(path, "-", "G7", "章節來源缺少 topics 清單")
        else:
            for topic in source["topics"]:
                if not isinstance(topic, dict) or not isinstance(topic.get("items"), list):
                    fail(path, "-", "G7", "來源 topic 缺少 items 清單")
                    continue
                for item in topic["items"]:
                    if not isinstance(item, dict) or not isinstance(item.get("id"), str):
                        fail(path, "-", "G7", "來源 item 缺少字串 id")
                        continue
                    if item["id"] in items:
                        fail(path, "-", "G7", f"來源 item id 重複：{item['id']}")
                    items[item["id"]] = item

        questions = data.get("questions")
        if not isinstance(questions, list) or not questions:
            fail(path, "-", "G1", "questions 必須是非空清單")
            continue
        total += len(questions)

        for number, question in enumerate(questions, 1):
            if not isinstance(question, dict):
                fail(path, number, "G1", "每題必須是 mapping")
                continue
            qid = question.get("id")
            if not isinstance(qid, str) or not qid.strip():
                qid = number
                fail(path, qid, "G1", "每題必須有非空字串 id")
            else:
                # G21：題目 id 全章唯一。模型把同一個 item 的兩題都命名成 `<item>.q1` 時，
                # 每一題本身都合法，靠 G1–G20 一條都擋不下來，但按 id 做局部修正時
                # 會無聲吃掉其中一題。id 該由出題腳本機械指派，這道閘負責證明它有做到。
                if (chapter, qid) in ids_seen:
                    fail(path, qid, "G21", f"題目 id 重複（與第 {ids_seen[(chapter, qid)]} 題相同）")
                else:
                    ids_seen[(chapter, qid)] = number

            # G10：認知層級須為指定的三者之一；章內比例於全部題目讀完後驗收。
            cognitive = question.get("cognitive")
            if cognitive not in COGNITIVE_LEVELS:
                fail(path, qid, "G10", "cognitive 必須是 recall / application / analysis")

            # G13：語言標記；章內中英題數於全部題目讀完後驗收。
            lang = question.get("lang")
            if lang not in LANGS:
                fail(path, qid, "G13", "lang 必須是 zh 或 en")
            chapter_questions[chapter].append((path, qid, cognitive, lang))

            # G12：dco 必須是 _dco.yaml 裡真實存在的 task 或 knowledge id，
            # 且其 domain 要涵蓋本章——否則「運動科學 48 題」可能全擠在肌肉解剖。
            dco = question.get("dco")
            if dco_ids is None:
                fail(path, qid, "G12", "無法讀取 _dco.yaml / _domains.yaml，G12 未執行")
            elif not isinstance(dco, str) or dco not in dco_ids:
                fail(path, qid, "G12", f"dco 不存在於 _dco.yaml：{dco}")
            else:
                prefix = dco.split(".", 1)[0]
                if chapter not in dco_chapters.get(prefix, set()):
                    fail(path, qid, "G12", f"{dco} 所屬的 {prefix} 不涵蓋 {chapter}")

            # G7：item 必須存在於對應章節，locator 必須逐字相同。
            item_id = question.get("item")
            item = items.get(item_id) if isinstance(item_id, str) else None
            if isinstance(item_id, str):
                item_usage[chapter][item_id].append(qid)  # G22，讀完整章後才判
            if item is None:
                fail(path, qid, "G7", f"對應章節找不到 item：{item_id}")
            elif (
                not isinstance(item.get("locator"), str)
                or not item["locator"].strip()
                or question.get("locator") != item["locator"]
            ):
                fail(path, qid, "G7", "locator 必須與來源 item 完全相同且非空")

            # G6：完整問句的形式門檻，且題幹必須在來源標題句之外自己貢獻一個子句。
            # 不用「包含即失敗」：218 條來源 q 短於 8 字，其中多數是純主題名詞
            # （膝關節、第一類槓桿），寫那個主題的題目必然會用到那幾個字。真正要擋的是
            # 「把 q 加個『是什麼？』就當題幹」，那是扣掉 q 之後所剩無幾的那種。
            stem = question.get("stem")
            if not isinstance(stem, str) or not stem.strip():
                fail(path, qid, "G6", "stem 必須是非空字串")
            elif lang == "en":
                if len(stem.split()) < 8 or not stem.endswith("?"):
                    fail(path, qid, "G6", "英文 stem 必須至少 8 個詞且以「?」結尾")
            elif len(stem) < 12 or not stem.endswith("？"):
                fail(path, qid, "G6", "中文 stem 必須至少 12 字且以全形「？」結尾")

            # G15：推理題的題幹必須要求排序而非判真假。recall 題不受此限。
            if isinstance(stem, str) and cognitive in ("application", "analysis"):
                has_qualifier = (
                    bool(QUALIFIERS_EN.search(stem)) if lang == "en"
                    else any(word in stem for word in QUALIFIERS_ZH)
                )
                if not has_qualifier:
                    fail(path, qid, "G15", f"{cognitive} 題的題幹缺少比較限定詞（最／most／primary…）")

            # G14：否定題（EXCEPT / 何者不是）鑑別力低又容易漏看否定詞，每章至多 1 題。
            if isinstance(stem, str) and ("EXCEPT" in stem or "不是" in stem or "何者不" in stem):
                negative_stems[chapter].append((path, qid))

            # 扣掉來源 q 的自帶內容檢查只對中文題成立：來源 q 是中文，英文題不會包含它。
            if item is not None and lang != "en":
                source_q = item.get("q")
                if not isinstance(source_q, str) or not source_q:
                    fail(path, qid, "G7", "來源 item 缺少非空字串 q，無法驗收 G6")
                elif (
                    isinstance(stem, str)
                    and source_q in stem
                    and len(stem) - len(source_q) < 12
                ):
                    fail(path, qid, "G6", "stem 扣掉來源 q 之後不足 12 字，等於把標題句改寫成問句")

            # G8：同章、同 item 的 stem 不得重複，即使題目 id 不同亦然。
            if isinstance(item_id, str) and isinstance(stem, str):
                key = (chapter, item_id, stem)
                if key in stems_seen:
                    fail(path, qid, "G8", f"同 item 的 stem 與題目 {stems_seen[key]} 重複")
                else:
                    stems_seen[key] = qid

            # G1：恰好三個選項、恰好一個布林 true，並驗收選項基本型別。
            options = question.get("options")
            if not isinstance(options, list):
                fail(path, qid, "G1", f"options 必須是 {OPTION_COUNT} 個選項的清單")
                continue
            if len(options) != OPTION_COUNT:
                fail(path, qid, "G1", f"選項數量為 {len(options)}，必須恰好 {OPTION_COUNT} 個")
            correct_indices = [
                index for index, option in enumerate(options)
                if isinstance(option, dict) and option.get("correct") is True
            ]
            if len(correct_indices) != 1:
                fail(path, qid, "G1", f"correct: true 有 {len(correct_indices)} 個，必須恰好 1 個")
            valid_texts = True
            for index, option in enumerate(options, 1):
                if not isinstance(option, dict):
                    valid_texts = False
                    fail(path, qid, "G1", f"選項 {index} 必須是 mapping")
                    continue
                text = option.get("text")
                if not isinstance(text, str) or not text.strip():
                    valid_texts = False
                    fail(path, qid, "G1", f"選項 {index} 的 text 必須是非空字串")
                if type(option.get("correct")) is not bool:
                    fail(path, qid, "G1", f"選項 {index} 的 correct 必須是布林值")

                # G16：分號等於把兩個子句塞進一格，是為了湊長度而不是為了說清楚。
                if isinstance(text, str) and (";" in text or "；" in text):
                    fail(path, qid, "G16", f"選項 {index} 含分號，選項必須是單一片語")

                # G20：選項文字不准評價自己。錯因的語言放 why_wrong，不放 text。
                if isinstance(text, str):
                    tell = GIVEAWAY.search(text)
                    if tell:
                        fail(path, qid, "G20", f"選項 {index} 在文字裡自承錯誤（{tell.group(0)}），改成中性敘述")

                # G17：希臘字母只能當術語的一部分，不能拿來替代英文單字。
                if isinstance(text, str):
                    stripped = GREEK_OK.sub("", text)
                    bad = GREEK.findall(stripped)
                    if bad:
                        fail(path, qid, "G17", f"選項 {index} 把希臘字母當縮寫用：{''.join(sorted(set(bad)))}")

                # G5：每個非正解須有錯因，與自身選項的字元 Jaccard 不得 > 0.6。
                if option.get("correct") is not True:
                    why_wrong = option.get("why_wrong")
                    if not isinstance(why_wrong, str) or not why_wrong.strip():
                        fail(path, qid, "G5", f"干擾項 {index} 缺少非空 why_wrong")
                    elif isinstance(text, str):
                        rate, limit = why_wrong_overlap(why_wrong, text, lang)
                        if rate > limit:
                            fail(path, qid, "G5", f"干擾項 {index} 的錯因重疊率 {rate:.3f} > {limit}")

                    # G19：錯因要說清楚考生犯了哪個思考錯誤。`Structure ≠ actuator.` 這種
                    # 電報體在字元重疊率上完全合格，對讀的人卻等於沒寫。
                    if isinstance(why_wrong, str) and why_wrong.strip():
                        short = (
                            len(why_wrong.split()) < 8 if lang == "en"
                            else len(why_wrong) < 12
                        )
                        if short:
                            fail(path, qid, "G19", f"干擾項 {index} 的 why_wrong 過短，要寫出思考錯誤")

            if len(options) != OPTION_COUNT or not valid_texts:
                continue
            texts = [option["text"] for option in options]
            lengths = [len(text) for text in texts]

            # G2：正解長度不得超過其餘兩個選項最長者的 1.15 倍。
            if len(correct_indices) == 1:
                correct_index = correct_indices[0]
                other_max = max(length for i, length in enumerate(lengths) if i != correct_index)
                if lengths[correct_index] * 100 > other_max * 115:
                    fail(path, qid, "G2", f"正解長度 {lengths[correct_index]} > 干擾項最大長度 {other_max} × 1.15")

            # G3：三個選項是完整母體；使用母體標準差 / 平均，門檻 0.4。
            cv = pstdev(lengths) / mean(lengths)
            if cv > 0.4:
                fail(path, qid, "G3", f"選項長度變異係數 {cv:.3f} > 0.4")

            # G4：最長者不得超過最短者的 1.5 倍。三個選項要一起改寫到同一長度帶，
            # 不是把兩個寫滿、剩一個縮成電報體。
            if max(lengths) > min(lengths) * LENGTH_RATIO:
                fail(
                    path, qid, "G4",
                    f"最長選項 {max(lengths)} > 最短選項 {min(lengths)} × {LENGTH_RATIO}",
                )

            # G18：帶度量單位的選項必須用同一個單位，否則三個選項量的不是同一件事。
            units = {unit for text in texts for unit in MEASURE_UNIT.findall(text)}
            if len(units) > 1:
                fail(path, qid, "G18", f"選項混用度量單位 {sorted(units)}，數字選項必須同單位")

            # G9：逐一檢查全部三組選項配對。英文比詞（上限 0.5），中文比字元（上限 0.6）。
            for left, right in combinations(range(OPTION_COUNT), 2):
                if differ_only_in_numbers(texts[left], texts[right]):
                    continue
                overlap, limit = option_overlap(texts[left], texts[right], lang)
                if overlap > limit:
                    fail(
                        path, qid, "G9",
                        f"選項 {left + 1} / {right + 1} 的重疊率 {overlap:.3f} > {limit}",
                    )

    # G10 / G13：按章彙總對照配題表。誤差容許 ±1 題，逐格回報差在哪裡。
    # 章沒寫完就會亮紅燈，這是刻意的——配題表是驗收基準不是建議值，
    # 差 3 題的章節和完全沒寫的章節一樣都還沒過。
    for chapter, rows in sorted(chapter_questions.items()):
        target = ALLOCATION.get(chapter)
        if target is None:
            fail(BANK_DIR / f"{chapter}.yaml", "-", "G10", f"{chapter} 不在配題表內")
            continue
        expected_total, *expected_levels, expected_en = target
        if abs(len(rows) - expected_total) > TOLERANCE:
            fail(
                BANK_DIR / f"{chapter}.yaml", "-", "G10",
                f"{chapter} 共 {len(rows)} 題，配題表要求 {expected_total} 題（±{TOLERANCE}）",
            )
        for level, expected in zip(COGNITIVE_LEVELS, expected_levels):
            actual = sum(1 for row in rows if row[2] == level)
            if abs(actual - expected) > TOLERANCE:
                fail(
                    BANK_DIR / f"{chapter}.yaml", "-", "G10",
                    f"{chapter} 的 {level} 有 {actual} 題，配題表要求 {expected} 題（±{TOLERANCE}）",
                )
        actual_en = sum(1 for row in rows if row[3] == "en")
        if abs(actual_en - expected_en) > TOLERANCE:
            fail(
                BANK_DIR / f"{chapter}.yaml", "-", "G13",
                f"{chapter} 的英文題有 {actual_en} 題，配題表要求 {expected_en} 題（±{TOLERANCE}）",
            )

    # G22：同一個 item 至多 MAX_ITEM_QUESTIONS 題。章級規則，回報時列出是哪幾題。
    for chapter, usage in sorted(item_usage.items()):
        for item_id, qids in sorted(usage.items()):
            if len(qids) > MAX_ITEM_QUESTIONS:
                fail(
                    BANK_DIR / f"{chapter}.yaml", "-", "G22",
                    f"item {item_id} 出了 {len(qids)} 題，至多 {MAX_ITEM_QUESTIONS} 題"
                    f"（{'、'.join(str(q) for q in qids)}）",
                )

    # G14：否定題每章至多 1 題。語料 47 題裡只有 2 題是 EXCEPT，比例本來就低。
    for chapter, rows in sorted(negative_stems.items()):
        if len(rows) > 1:
            for path, qid in rows:
                fail(path, qid, "G14", f"{chapter} 有 {len(rows)} 題否定題，每章至多 1 題")

    return errors, total, len(chapters)


def main() -> int:
    errors, count, chapter_count = check_bank()
    if errors:
        print("\n".join(errors))
        return 1
    print(f"quiz bank OK（{count} 題 / {chapter_count} 章）")
    for filename, chars in novel_chars().items():
        print(f"G11 語料未見字（逐字確認是否簡體或錯字）：{filename}：{chars}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
