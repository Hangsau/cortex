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
                walk_strings(yaml.safe_load(handle), used)
        except (OSError, UnicodeError, yaml.YAMLError):
            continue
        unseen = used - corpus
        if unseen:
            result[path.name] = "".join(sorted(unseen))
    return result


def check_bank(bank_dir: Path = BANK_DIR, source_dir: Path = SOURCE_DIR):
    """回傳 (完整錯誤清單, 題數, 章數)，不修改任何來源或題庫檔案。"""
    errors = []
    total = 0
    chapters = set()
    stems_seen = {}
    chapter_questions = defaultdict(list)

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

            # G10：認知層級須為指定的三者之一；章內比例於全部題目讀完後驗收。
            cognitive = question.get("cognitive")
            if cognitive not in COGNITIVE_LEVELS:
                fail(path, qid, "G10", "cognitive 必須是 recall / application / analysis")
            chapter_questions[chapter].append((path, qid, cognitive))

            # G7：item 必須存在於對應章節，locator 必須逐字相同。
            item_id = question.get("item")
            item = items.get(item_id) if isinstance(item_id, str) else None
            if item is None:
                fail(path, qid, "G7", f"對應章節找不到 item：{item_id}")
            elif (
                not isinstance(item.get("locator"), str)
                or not item["locator"].strip()
                or question.get("locator") != item["locator"]
            ):
                fail(path, qid, "G7", "locator 必須與來源 item 完全相同且非空")

            # G6：完整問句的形式門檻，且禁止完整搬用來源 q 字串。
            stem = question.get("stem")
            if not isinstance(stem, str) or len(stem) < 12 or not stem.endswith("？"):
                fail(path, qid, "G6", "stem 必須至少 12 字且以「？」結尾")
            if item is not None:
                source_q = item.get("q")
                if not isinstance(source_q, str) or not source_q:
                    fail(path, qid, "G7", "來源 item 缺少非空字串 q，無法驗收 G6")
                elif isinstance(stem, str) and source_q in stem:
                    fail(path, qid, "G6", "stem 完整包含來源 item 的 q 字串")

            # G8：同章、同 item 的 stem 不得重複，即使題目 id 不同亦然。
            if isinstance(item_id, str) and isinstance(stem, str):
                key = (chapter, item_id, stem)
                if key in stems_seen:
                    fail(path, qid, "G8", f"同 item 的 stem 與題目 {stems_seen[key]} 重複")
                else:
                    stems_seen[key] = qid

            # G1：恰好四個選項、恰好一個布林 true，並驗收選項基本型別。
            options = question.get("options")
            if not isinstance(options, list):
                fail(path, qid, "G1", "options 必須是四個選項的清單")
                continue
            if len(options) != 4:
                fail(path, qid, "G1", f"選項數量為 {len(options)}，必須恰好 4 個")
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

                # G5：每個非正解須有錯因，與自身選項的字元 Jaccard 不得 > 0.6。
                if option.get("correct") is not True:
                    why_wrong = option.get("why_wrong")
                    if not isinstance(why_wrong, str) or not why_wrong.strip():
                        fail(path, qid, "G5", f"干擾項 {index} 缺少非空 why_wrong")
                    elif isinstance(text, str) and jaccard(why_wrong, text) > 0.6:
                        fail(path, qid, "G5", f"干擾項 {index} 的錯因重疊率 {jaccard(why_wrong, text):.3f} > 0.6")

            if len(options) != 4 or not valid_texts:
                continue
            texts = [option["text"] for option in options]
            lengths = [len(text) for text in texts]

            # G2：正解長度不得超過其餘三個選項最長者的 1.15 倍。
            if len(correct_indices) == 1:
                correct_index = correct_indices[0]
                other_max = max(length for i, length in enumerate(lengths) if i != correct_index)
                if lengths[correct_index] * 100 > other_max * 115:
                    fail(path, qid, "G2", f"正解長度 {lengths[correct_index]} > 干擾項最大長度 {other_max} × 1.15")

            # G3：四個選項是完整母體；使用母體標準差 / 平均，門檻 0.4。
            cv = pstdev(lengths) / mean(lengths)
            if cv > 0.4:
                fail(path, qid, "G3", f"選項長度變異係數 {cv:.3f} > 0.4")

            # G4：最長者不得超過最短者的 2.0 倍。
            if max(lengths) > min(lengths) * 2:
                fail(path, qid, "G4", f"最長選項 {max(lengths)} > 最短選項 {min(lengths)} × 2.0")

            # G9：逐一檢查全部六組選項配對，字元 Jaccard 不得 > 0.6。
            for left, right in combinations(range(4), 2):
                overlap = jaccard(texts[left], texts[right])
                if overlap > 0.6:
                    fail(path, qid, "G9", f"選項 {left + 1} / {right + 1} 的重疊率 {overlap:.3f} > 0.6")

    # G10：按章彙總，恰好 40% 可通過；違規章的 recall 題逐題列出。
    for chapter, rows in chapter_questions.items():
        recall_rows = [row for row in rows if row[2] == "recall"]
        if len(recall_rows) * 5 > len(rows) * 2:
            for path, qid, _ in recall_rows:
                fail(path, qid, "G10", f"{chapter} 的 recall 比例 {len(recall_rows)}/{len(rows)} > 40%")

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
