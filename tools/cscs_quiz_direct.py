#!/usr/bin/env python3
"""單次 API 直送出題：把全部脈絡 inline 一次送出，回傳純 YAML，本腳本自己寫檔。

取代 `claude-m3 -p < .prompts/chNN-quiz.md` 那條管道。舊管道慢的根因不是模型，是把
MiniMax 當 agent 跑：prompt 只有 5.6KB，卻要它自己用工具去讀 spec 25KB + 章節 yaml 60KB
+ 語料 26KB，每個 tool 往返都重送整段對話，十幾個 turn 下來等效輸入是內容本身的好幾倍。
一次貼完、一次回完，等效輸入就只有內容本身一份。

三個成本控制：穩定前綴（規格 / 語料 / 章節 yaml / dco / 輸出格式）掛 `cache_control`，
同一章的每一批與每一輪修正都命中快取；修正輪只收回被點名的那幾題（局部替換），
不讓模型整份重出——整份重出會連沒被點名的題目一起改壞；**題數不交給模型數**，
改成叫它多寫四成、由腳本挑到剛好（見 select_questions）。

用法：
    python -X utf8 tools/cscs_quiz_direct.py ch08                # 出題 + 自動修到過閘
    python -X utf8 tools/cscs_quiz_direct.py ch08 --part 1/3     # 分批出題
    python -X utf8 tools/cscs_quiz_direct.py ch08 --fix-only     # 只修既有題庫（整章）
    python -X utf8 tools/cscs_quiz_direct.py ch08 --review       # 第二輪：逐題審內容改干擾項
    python -X utf8 tools/cscs_quiz_direct.py ch08 --dry-run      # 只組 prompt 印大小
    python -X utf8 tools/cscs_quiz_direct.py ch08 --select-test  # 離線試挑選，不呼叫 API
    python -X utf8 tools/cscs_quiz_direct.py --smoke             # 極小串流請求驗 SSE 解析

配題數、item 數、dco 白名單一律從資料現讀（沿用 cscs_quiz_make_prompt 的函式），
不在本檔複製一份——手寫的數字會過期，而模型會照著過期的數字寫。
"""
import argparse
import json
import re
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

import requests
import yaml

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from cscs_quiz_bank_check import ALLOCATION, OPTION_COUNT, TOLERANCE, check_bank  # noqa: E402
from cscs_quiz_make_prompt import battery_note, dco_list  # noqa: E402

ENDPOINT = "https://api.minimax.io/anthropic/v1/messages"
TOKEN_PATH = Path.home() / ".minimax-token"
MODEL = "MiniMax-M3"
MAX_TOKENS = 64000
TIMEOUT = (30, 600)  # (connect, read)：一章上百題的生成可以跑好幾分鐘
MAX_FIX_ROUNDS = 5  # 修正輪改成只重出被點名的題目後，每輪成本低很多，值得多跑幾輪
MAX_FEEDBACK_LINES = 80
# 超量生成倍率。實跑證實模型數不準（要 33 題交 35 → 重出交 31 → 再重出交 35），
# 五輪全燒在湊數量上、一條品質錯誤都沒修到。改成叫它多寫四成、由腳本挑到剛好，
# 配額類的錯誤（題數 / 認知配比 / 中英配比）在結構上就不可能出現。
OVERGEN_RATIO = 1.4
MAX_ITEM_QUESTIONS = 2  # 規格：同一個 item 最多出 2 題
PROGRESS_STEP = 2000  # 每收這麼多字元更新一次 stderr 進度

SYSTEM = "你是 CSCS 考題撰寫者。只輸出 YAML，不要任何說明文字，不要 markdown code fence。"

REQUIRED_FIELDS = ("id", "item", "dco", "lang", "cognitive", "stem", "locator", "options")
# 審查輪不准動的欄位（`stem` 不在內：正解只是把題幹換句話說時要靠改提問角度救）。
FIXED_FIELDS = ("id", "item", "dco", "lang", "cognitive", "locator")
REVIEW_CHUNK = 20  # 一輪審幾題：太多會讓模型只挑幾題交差，太少則每題攤到的往返成本上升


# ---------------------------------------------------------------- 資料讀取


def read_text(path: Path) -> str:
    return path.open(encoding="utf-8").read()


def chapter_items(chid: str) -> list:
    """回傳本章全部 item（保持 yaml 內的順序）。"""
    data = yaml.safe_load(read_text(ROOT / "data" / "cscs" / f"{chid}.yaml"))
    return [item for topic in data["topics"] for item in topic["items"]]


def topic_of(item_id) -> str:
    """item id 是 `chNN.topic-slug.item-slug`，中間那段就是 topic。

    取不到就回空字串，讓所有異常 id 落在同一組——挑選器只拿它做排序鍵，
    在這裡 sys.exit 會把「有一筆 id 沒寫好」放大成整批出題失敗。
    """
    parts = item_id.split(".") if isinstance(item_id, str) else []
    return parts[1] if len(parts) > 2 else ""


def chapter_topics(chid: str) -> list:
    """回傳本章 topic slug 清單，保持 yaml 內的順序。"""
    data = yaml.safe_load(read_text(ROOT / "data" / "cscs" / f"{chid}.yaml"))
    return [topic_of(topic["items"][0]["id"]) for topic in data["topics"] if topic.get("items")]


def topic_spread_note(chid: str, total: int, used_items) -> str:
    """要模型把題目攤到每個 topic，並點名目前覆蓋不足的那幾個。

    挑選器（select_questions）雖然把 topic 當第二順位排序鍵，但它只能在模型交出的候選池裡
    挑——池子裡本來就沒有某個 topic，balance 這一層就無事可做。ch19 實跑：8 個 topic 拿到
    7/7/7/7/6/2/1/1，`sprint-technique` 與 `sprint-speed-components` 這兩個「速度與敏捷」
    章最核心的執行主題各只有 1 題，而閘與配題表都看不到主題分布（它們只驗 cognitive／lang
    邊際）。所以要求必須下到 prompt 這一層。
    """
    topics = chapter_topics(chid)
    if not topics:
        return ""
    target = total / len(topics)
    # ch23 實跑 7/7/5/5/4/4/4/4：舊的 -1/+2 區間（4–7）把兩倍差都算合規，
    # 等於沒有約束。收成 ±1 讓「攤平」這件事在 prompt 層真的有下限。
    floor, ceiling = max(1, round(target) - 1), round(target) + 1
    done = Counter(topic_of(i) for i in used_items)
    lines = [
        f"# 主題覆蓋（本章 {len(topics)} 個 topic，全章共 {total} 題）",
        "",
        f"**每個 topic 全章要有 {floor}–{ceiling} 題**，不要把題目擠在少數幾個概念型主題上。"
        "動作執行、技術、測驗這類主題和機制類主題一樣要考到。"
        "**攤開主題不是放寬欄位要求**——冷門主題的題目照樣要有 `locator` 等必填欄位，"
        "也照樣要湊滿本批的英文題數。",
        "",
    ]
    if done:
        lines += ["| topic | 先前批次已出 |", "|---|---|"]
        lines += [f"| `{t}` | {done.get(t, 0)} |" for t in topics]
        lead = max(done.get(t, 0) for t in topics)
        lack = [t for t in topics if done.get(t, 0) < lead]
        if lack:
            lines += [
                "",
                "先前批次的覆蓋並不平均。**本批請優先從下列落後的 topic 取材**"
                "（每個都要有候選題，而且要寫足餘裕讓我挑得動）：",
                "",
                "\n".join(f"- `{t}`（目前 {done.get(t, 0)} 題，領先的 topic 已有 {lead} 題）"
                          for t in lack),
            ]
    else:
        lines += ["\n".join(f"- `{t}`" for t in topics)]
    return "\n".join(lines)


def dco_allowed(chid: str) -> set:
    """從 dco_list() 的輸出抽出合法 id 集合。

    白名單的算法（domain 前綴 → task / knowledge 層 id）只存在 dco_list 一處；
    在這裡重算一遍就會有兩份可能漂移的真相，所以改成解析它的輸出。
    """
    return set(re.findall(r"`([^`]+)`", dco_list(chid)))


def load_bank(chid: str):
    path = ROOT / "data" / "cscs" / "_quiz_bank" / f"{chid}.yaml"
    if not path.exists():
        return []
    data = yaml.safe_load(read_text(path))
    questions = (data or {}).get("questions")
    return questions if isinstance(questions, list) else []


# ---------------------------------------------------------------- 配額切分


def split_int(total: int, parts: int) -> list:
    """把整數切成 parts 份，最後一份吃餘數。"""
    base = total // parts
    out = [base] * parts
    out[-1] = total - base * (parts - 1)
    return out


def quota_for(chid: str, part):
    """回傳 (total, recall, application, analysis, english)。

    分批時**總題數由三個 cognitive 分批數加總而來**，不獨立切——各欄各自取整會讓
    「三欄加總 ≠ 總題數」，模型收到自相矛盾的規格只會亂寫。
    """
    total, recall, application, analysis, english = ALLOCATION[chid]
    if part is None:
        return total, recall, application, analysis, english

    index, parts = part
    levels = [split_int(n, parts)[index - 1] for n in (recall, application, analysis)]
    part_english = split_int(english, parts)[index - 1]
    part_total = sum(levels)

    if sum(split_int(recall, parts)) != recall or part_total <= 0:
        sys.exit(f"{chid} 的 --part {index}/{parts} 切不出有效配額")
    if part_english > part_total:
        sys.exit(f"--part {index}/{parts}：英文題 {part_english} 多於本批總題數 {part_total}")
    return part_total, levels[0], levels[1], levels[2], part_english


def target_grid(quota) -> dict:
    """(cognitive, lang) -> 目標題數；cognitive 與 lang 兩邊的邊際都精確等於配題表。

    配題表只給了 cognitive 三欄與英文題總數，沒給交叉表。英文題按各層級的題數比例分配，
    餘數用最大餘數法補齊——這樣 G10（cognitive 邊際）與 G13（英文邊際）同時精確成立。
    """
    total, recall, application, analysis, english = quota
    rows = []
    for name, size in (("recall", recall), ("application", application), ("analysis", analysis)):
        exact = english * size / total if total else 0.0
        rows.append([name, size, min(int(exact), size), exact - int(exact)])
    for row in sorted(rows, key=lambda r: -r[3])[:english - sum(r[2] for r in rows)]:
        if row[2] < row[1]:
            row[2] += 1

    grid = {}
    for name, size, english_count, _ in rows:
        grid[(name, "en")] = english_count
        grid[(name, "zh")] = size - english_count
    return grid


def topup_plan(chid: str, base_questions: list):
    """補題模式的 (配額, 目標格)：全章目標格減掉既有題庫已經佔掉的格子。

    **不可以在「差額」上重跑 `target_grid()`**。最大餘額法對差額各自進位，加回既有題庫
    不會等於全章目標——`--part` 就是這樣錯的：ch24 三批各自算出 10/18/3/9，而全章目標是
    9/19/4/8，`run_chapter` 又把這個漂掉的格子餵給 `select_questions`。這裡改成先展開
    全章目標再扣既有，配額由扣完的格子加總反推，兩者依定義一致。
    """
    grid = target_grid(ALLOCATION[chid])
    have = Counter(
        (q.get("cognitive"), q.get("lang"))
        for q in base_questions if isinstance(q, dict)
    )
    remain = {key: value - have[key] for key, value in grid.items()}
    over = [
        f"{cog}/{lang} 已有 {have[(cog, lang)]} 題、全章目標只有 {grid[(cog, lang)]} 題"
        for (cog, lang), value in sorted(remain.items()) if value < 0
    ]
    if over:
        sys.exit(f"{chid} 既有題庫已超出全章目標，補題補不了（要先 --fix-only 修剪）："
                 + "；".join(over))
    quota = (
        sum(remain.values()),
        remain[("recall", "en")] + remain[("recall", "zh")],
        remain[("application", "en")] + remain[("application", "zh")],
        remain[("analysis", "en")] + remain[("analysis", "zh")],
        sum(value for (_, lang), value in remain.items() if lang == "en"),
    )
    if quota[0] <= 0:
        sys.exit(f"{chid} 既有 {len(base_questions)} 題已經滿足配題表，不需要補題")
    return quota, remain


def select_questions(pool: list, grid: dict, used_items=(), error_counts=None):
    """從候選池挑出剛好符合 grid 的組合，回傳 (選中, 丟棄, 各格缺口)。

    挑選順序：候選最緊的格子先挑（寬鬆的格子後面還有得選）；格內優先保留 item 還沒用過的
    題目，其次是所屬 topic 出得最少的，再其次是閘門錯誤少的，最後照原順序穩定排序。

    topic 那一層是 ch15 補上的。這個函式只保證 cognitive × lang 兩條邊際，主題分布整個
    交給模型決定——ch15 實跑的結果是 body-positioning 8 題、upper-body 0 題，而 12 個
    topic 各有 8 條 item，等於整章有一個主題的器材動作完全沒考到。它排在 item 之後：
    「同一個 item 出第二題」比「主題偏一點」更傷，優先序不能對調。

    `MAX_ITEM_QUESTIONS` 是硬上限，填不滿就照實回報 shortfall。曾經有一條「填不滿就放寬」
    的路徑，它正是 ch08 那 4 個 item 各出 3 題的來源；而修剪既有題庫時把第 3 題丟掉本來
    就是我們要的行為——湊滿格子不值得用「同一句話出第三題」去換。
    """
    error_counts = error_counts or {}
    buckets = defaultdict(list)
    for position, question in enumerate(pool):
        if isinstance(question, dict):
            buckets[(question.get("cognitive"), question.get("lang"))].append(position)

    item_count = Counter(used_items)
    topic_count = Counter(topic_of(item) for item in used_items)
    chosen = set()
    shortfall = {}

    def rank(position):
        question = pool[position]
        return (
            item_count[question.get("item")],
            topic_count[topic_of(question.get("item"))],
            error_counts.get(question.get("id"), 0),
            position,
        )

    for cell in sorted(grid, key=lambda c: len(buckets.get(c, [])) - grid[c]):
        need = grid[cell]
        if need <= 0:
            continue
        # 每挑一題就重算名次，不是一次排好再照順序拿——item_count / topic_count 會被
        # 自己的挑選改變，用固定順序的話格內就完全不會自我修正（25 題的 application
        # 格全擠在同一個 topic 也照樣挑完）。候選池只有幾十筆，重排的代價可以忽略。
        picked = []
        remaining = list(buckets.get(cell, []))
        while len(picked) < need and remaining:
            remaining.sort(key=rank)
            position = None
            for candidate in remaining:
                if item_count[pool[candidate].get("item")] < MAX_ITEM_QUESTIONS:
                    position = candidate
                    break
            if position is None:
                break
            remaining.remove(position)
            picked.append(position)
            item_count[pool[position].get("item")] += 1
            topic_count[topic_of(pool[position].get("item"))] += 1
        if len(picked) < need:
            shortfall[cell] = need - len(picked)
        chosen.update(picked)

    selected = [pool[i] for i in sorted(chosen)]
    dropped = [pool[i] for i in range(len(pool)) if i not in chosen]
    return selected, dropped, shortfall


def assign_ids(questions: list, used_ids=()) -> list:
    """就地把 `id` 改成 `<item>.qN`：同一個 item 的第 1 題 q1、第 2 題 q2，依序不跳號。

    id 不能交給模型決定。ch08 實跑寫出 101 題卻只有 72 個唯一 id，因為模型把每一題都
    命名成 `<item>.q1`——而同 item 出 2 題本來就是設計（源檔 64 個 item 要涵蓋 100 題）。
    那些題目每一題都合法、G1–G20 一條都擋不下來，但按 id 做局部修正時會無聲吃掉其中一題。

    `used_ids` 是先前批次已經寫進檔的 id，本批的編號從它們之後接續。
    """
    taken = set(used_ids)
    highest = Counter()
    for existing in taken:
        match = re.fullmatch(r"(.+)\.q(\d+)", existing)
        if match:
            highest[match.group(1)] = max(highest[match.group(1)], int(match.group(2)))

    for question in questions:
        if not isinstance(question, dict) or not isinstance(question.get("item"), str):
            continue
        item_id = question["item"]
        number = highest[item_id] + 1
        while f"{item_id}.q{number}" in taken:
            number += 1
        highest[item_id] = number
        question["id"] = f"{item_id}.q{number}"
        taken.add(question["id"])

    # 指派完還重複代表這個函式自己有 bug，不是資料問題，所以用 assert 不是回報錯誤。
    assigned = [q.get("id") for q in questions if isinstance(q, dict)]
    duplicated = sorted(qid for qid, count in Counter(assigned).items() if count > 1)
    if duplicated:
        raise AssertionError(f"assign_ids 指派後仍有重複 id：{duplicated}")
    return questions


def trim_item_overflow(questions: list, weights: list):
    """把超過 MAX_ITEM_QUESTIONS 題的 item 砍回上限，回傳 (保留, 丟棄)。

    丟哪一題：閘門錯誤多的先丟（`weights` 是逐題的錯誤條數），同分丟後出現的那一題。
    """
    by_item = defaultdict(list)
    for position, question in enumerate(questions):
        if isinstance(question, dict):
            by_item[question.get("item")].append(position)

    discard = set()
    for positions in by_item.values():
        if len(positions) > MAX_ITEM_QUESTIONS:
            discard.update(sorted(positions, key=lambda p: (weights[p], p))[MAX_ITEM_QUESTIONS:])

    keep = [q for index, q in enumerate(questions) if index not in discard]
    dropped = [q for index, q in enumerate(questions) if index in discard]
    return keep, dropped


def describe_grid(grid: dict) -> str:
    return "、".join(
        f"{cognitive}/{lang} {count}"
        for (cognitive, lang), count in sorted(grid.items())
        if count
    )


# ---------------------------------------------------------------- prompt 組裝


def build_sections(chid: str, quota, used_items: list, part, bank=None, grid=None):
    """回傳 (穩定前綴段落, 變動段落)，兩者都是 [(段名, 內容)]。

    切分點就是 cache 斷點：前面那組同一章的每一批、每一輪修正都逐字相同，後面那組
    （配額表、已用過的 item）每批都不一樣。prompt cache 命中的是**共同前綴**，
    把會變的東西擺前面等於每次都從零開始算——實跑四輪 cache_read 卡在 146 就是這個原因。

    `bank` 有值代表 --fix-only 模式：不出題，改成把既有題庫攤在前綴裡等著被點名修正。
    """
    total, recall, application, analysis, english = quota
    items = chapter_items(chid)
    source_raw = read_text(ROOT / "data" / "cscs" / f"{chid}.yaml")

    stable = [
        (
            "出題規格",
            "# 出題規格（tools/cscs_quiz_spec.md）\n\n"
            "以下整份規格的每一條規則都適用，不要跳讀。\n\n"
            + read_text(ROOT / "tools" / "cscs_quiz_spec.md"),
        ),
        (
            "考古題語料",
            "# 考古題參考語料（tools/cscs_quiz_reference_items.md）\n\n"
            "**它的頁碼是第 5 版，本專案是第 4 版；語料裡的內容不可拿來出題**，"
            "只看題型與鑑別邏輯。\n\n"
            + read_text(ROOT / "tools" / "cscs_quiz_reference_items.md"),
        ),
        (
            "章節素材",
            f"# 本章知識單位（data/cscs/{chid}.yaml，共 {len(items)} 條 item）\n\n"
            "**你只能從這裡取材**，題目的 `item` 與 `locator` 都要從這份檔案抄。\n\n"
            "```yaml\n" + source_raw + "\n```",
        ),
        ("dco 白名單", f"# `dco` 只能填下列 id，填別的會被驗收退回\n\n{dco_list(chid)}"),
        ("輸出格式", output_format_section(chid)),
    ]

    if bank is not None:
        # --fix-only：要修的題庫本身在整個 run 裡都不變，所以放進快取前綴。
        stable[-1] = ("修正任務", fix_task_section(chid, bank))
        return stable, []

    over = {key: int(round(value * OVERGEN_RATIO)) for key, value in (
        ("total", total), ("recall", recall),
        ("application", application), ("analysis", analysis), ("english", english),
    )}
    lines = [
        "# 本批要寫幾題",
        "",
        f"**請寫 {over['total']} 題**——這比我最後要用的數量多出約四成，是刻意的。",
        "我會自己從你交的題目裡挑出符合配額的組合，多的直接丟棄，所以**每一格都要有餘裕**：",
        "",
        "| 認知層級 | 請至少寫 | （我最後只會留） |",
        "|---|---|---|",
        f"| recall | {over['recall']} | {recall} |",
        f"| application | {over['application']} | {application} |",
        f"| analysis | {over['analysis']} | {analysis} |",
        f"| 英文題（`lang: en`） | {over['english']} | {english} |",
        "",
        "**我挑選時看的是下面這張交叉表，不是上面那兩條邊際**——"
        "`cognitive` 總數與英文題總數都對、但某一格是 0，我就湊不出合格的組合：",
        "",
        "| `cognitive` × `lang` | 請至少寫 | （我最後只會留） |",
        "|---|---|---|",
        *[f"| `cognitive: {cog}` ＋ `lang: {lang}` | {max(1, int(round(count * OVERGEN_RATIO))) if count else 0}"
          f" | {count} |"
          for (cog, lang), count in sorted((grid or target_grid(quota)).items())],
        "",
        "- **不要為了湊數量而犧牲品質**，寧可每題都寫好；數量由我挑，你負責品質。",
        "- 上表「我最後只會留」是 0 的格子**一題都不要寫**；不是 0 的格子**每一格都要有餘裕**。",
        "- **盡量每題用不同的 item**（同一個 item 最多 2 題）——我挑選時優先保留不重複的。",
        "- 每題選項**恰好 3 個**（不是 4 個）。",
        "",
        topic_spread_note(chid, ALLOCATION[chid][0], used_items),
        "",
        battery_note(chid),
        "",
        TOP_GATES,
    ]
    if part is not None:
        index, parts = part
        lines.insert(3, f"這是 {chid} 的第 {index}/{parts} 批，只寫本批，不要重複其他批次的題目。\n")
    if used_items:
        lines += [
            "",
            "下列 item 在先前的批次已經出過題，**本批一題都不准用它們**：",
            "",
            "\n".join(f"- `{i}`" for i in sorted(used_items)),
        ]
    return stable, [("本批硬規格", "\n".join(lines))]


def fix_task_section(chid: str, bank: list) -> str:
    """--fix-only 的任務說明：把整章現況攤開，之後每輪只收回被點名的題目。"""
    dumped = yaml.safe_dump(bank, allow_unicode=True, sort_keys=False,
                            default_flow_style=False, width=10**6)
    return (
        f"# 任務：修正 {chid} 既有題庫\n\n"
        f"下面是 `data/cscs/_quiz_bank/{chid}.yaml` 目前的 {len(bank)} 題。"
        "**不要重新出題、不要增刪題目、不要改 `id` / `item` / `cognitive` / `lang`**，"
        "只修我接下來點名的那幾題的 `stem` / `options` / `why_wrong` / `dco` / `locator`。\n\n"
        "```yaml\n" + dumped + "```\n\n" + TOP_GATES
    )


def build_blocks(stable: list, volatile: list) -> list:
    """組成 Anthropic content blocks，穩定前綴那塊掛 cache_control。

    MiniMax 這個 endpoint 吃 Anthropic 的 `cache_control`（實測同段內容第二次呼叫
    input_tokens 4445 → 1、cache_read_input_tokens 4572），斷點以前的內容整段快取。
    """
    blocks = [
        {
            "type": "text",
            "text": join_sections(stable),
            "cache_control": {"type": "ephemeral"},
        }
    ]
    if volatile:
        blocks.append({"type": "text", "text": join_sections(volatile)})
    return blocks


def join_sections(sections: list) -> str:
    return "\n\n---\n\n".join(text for _, text in sections)


# 最常被實跑擋下的幾道閘。同樣的規則在 spec 全文裡都有，但埋在 25KB 散文中間等於沒寫——
# ch08 第一批的 G15 連續被擋 5 題就是這樣來的。祈使句、一條一行、放在 prompt 最尾端。
TOP_GATES = """## 最常被擋下的閘（違反任何一條，該題直接退回重寫）

- application 與 analysis 題的題幹**必須**帶比較限定詞：最／最主要／最不／首先／優先／
  most／least／primary／best／greatest／first。考生要排序，不是判真假。
- 同一題三個選項的長度差不得超過 1.5 倍（最長 ≤ 最短 × 1.5），且正解不得是最長的那個。
- 三個選項兩兩之間的重疊率有上限（中文比字元 ≤ 0.6、英文比詞 ≤ 0.5）。
- **只要三個選項的差別在數值，共同的限定語就全部搬進題幹，選項只留數值**。
  這條最常被違反的不是「純數字題」而是帶單位片語的題：`每公斤體重 8 至 10 公克` ×3、
  `介於百分之六到八的濃度` ×3、`10 to 12 g per kg of body weight per day` ×3 都會撞 G9。
  正確寫法是題幹問「每日每公斤體重應攝取多少公克？」，選項寫 `8–10`／`3–5`／`12–14`。
- 英文 stem 至少 8 個詞且以 `?` 結尾；中文 stem 至少 12 字且以全形「？」結尾。
- 選項本文不得出現「顛倒／反轉／錯置／誤植／書中沒有／reverses／inflated／overstates／
  misreads」這類評價自己的字眼——錯因的語言只能寫在 `why_wrong` 裡。
- 否定題（`EXCEPT` /「何者不是」）本章至多 1 題，可以完全不寫。"""


def output_format_section(chid: str) -> str:
    return f"""# 輸出格式

只輸出一份 YAML，第一個字元是 `m`（meta 的 m），最後一個字元是 YAML 內容的結尾。
不要寫任何說明文字，不要包 ``` code fence。

```yaml
meta:
  chapter: {chid}
  source: data/cscs/{chid}.yaml
questions:
  - id: <item-id>.q1
    item: <必須是 {chid}.yaml 裡真實存在的 item id>
    dco: <白名單其中一個>
    lang: zh
    cognitive: application
    stem: <中文題以全形「？」結尾，至少 12 字；英文題以「?」結尾，至少 8 個詞>
    locator: <與該 item 的 locator 逐字相同，一個字都不能差>
    options:
      - text: <短名詞片語>
        correct: true
      - text: <短名詞片語>
        correct: false
        why_wrong: <考生犯了哪個思考錯誤，不是把選項換句話說>
      - text: <短名詞片語>
        correct: false
        why_wrong: <同上>
```

## ⚠ YAML 安全條款（整份炸掉最常見的原因，先看這段）

`stem`、選項的 `text`、`why_wrong` 這三種欄位，只要字串裡含有 `:`、`#`、`"`、`'`，
或是以數字開頭（像 `1.5`、`12`），**整個字串一律用雙引號包住**：

```yaml
    stem: "Which coaching cue is most appropriate when an athlete is: landing hard?"
      - text: "1.5"
```

字串內本身有雙引號時，用**兩個雙引號**跳脫：`"he said ""attack the ground"" first"`。

裸的冒號會讓整份檔案報廢、整輪作廢重來（`... when an athlete is:` 已經發生過一次）。
**輸出前把整份 YAML 從頭到尾自己檢查一遍合法性**，確認每個含特殊字元的字串都有引號。

硬性要求，逐條核對後再輸出：

- **正解不寫 `why_wrong`**；兩個干擾項都要寫。
- **干擾項必須是讀得不夠細的人會選的東西**。`bones contract to move joints` 這種一眼就假的不算。
- **application 與 analysis 題的題幹一定要有比較限定詞**（中文：最主要／最不／首先／優先；
  英文：most／least／primary／best／greatest／first）。
- **三個選項語法平行、長度相近**：最長不得超過最短的 1.5 倍，正解不得是最長的那個。
  長度靠三個一起改寫到同一長度帶達成，不准用縮寫、希臘字母或分號把某一個縮掉。
- **數字題的三個選項必須是同一個量的三個數值**——同單位、同被測對象。
- **不要自己拼術語**。只用本章 yaml 出現過的詞，或該領域公認的標準術語。
- **`locator` 逐字複製**來源 item 的 `locator`。
- **中文題不可出現簡體字**；**英文題不是中文題的翻譯**，同一 item 的中英題要問不同角度。
- **`lang: en` 的題目，`stem`／選項 `text`／`why_wrong` 三者全部寫英文**，一個中文字都不要出現
  （`why_wrong` 最容易漏，它也要是完整英文句子、至少 8 個詞）；`lang: zh` 則三者全部寫中文。
- **同一個 item 最多出 2 題**，題幹不得重複。
- 否定題（`EXCEPT` /「何者不是」）**本章至多 1 題**，可以完全不寫。
- **不要寫任何百分位、族群平均、常模門檻的數字**——本庫沒有常模表，寫了就是編造。"""


def est_tokens(text: str) -> int:
    """粗估 token 數。中英混排沒有現成 tokenizer 可用，只作數量級參考。"""
    ascii_n = sum(1 for char in text if ord(char) < 128)
    return round(ascii_n / 4 + (len(text) - ascii_n) / 1.5)


# ---------------------------------------------------------------- API


def api_token() -> str:
    if not TOKEN_PATH.exists():
        sys.exit(f"找不到 token：{TOKEN_PATH}")
    token = TOKEN_PATH.open(encoding="utf-8").read().strip()
    if not token:
        sys.exit(f"{TOKEN_PATH} 是空的")
    return token


def merge_usage(target: dict, source) -> None:
    if not isinstance(source, dict):
        return
    for key in ("input_tokens", "output_tokens", "cache_read_input_tokens"):
        value = source.get(key)
        if isinstance(value, int) and value > target.get(key, 0):
            target[key] = value


def stream_call(messages: list, max_tokens: int, label: str):
    """送出一次串流請求，回傳 (text, usage, 耗時秒)。"""
    payload = {
        "model": MODEL,
        "max_tokens": max_tokens,
        "system": SYSTEM,
        "messages": messages,
        "stream": True,
    }
    headers = {
        "x-api-key": api_token(),
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "accept": "text/event-stream",
    }

    chunks = []
    usage = {}
    started = time.time()
    next_mark = PROGRESS_STEP
    received = 0

    print(f"[{label}] 送出 {len(messages)} 則訊息，等待回應…", file=sys.stderr)
    try:
        response = requests.post(
            ENDPOINT, headers=headers, json=payload, stream=True, timeout=TIMEOUT
        )
    except requests.RequestException as exc:
        sys.exit(f"[{label}] 連線失敗：{exc}")

    with response:
        if response.status_code != 200:
            body = response.text[:2000]
            sys.exit(f"[{label}] HTTP {response.status_code}：{body}")
        for raw in response.iter_lines():
            if not raw:
                continue
            line = raw.decode("utf-8", "replace") if isinstance(raw, bytes) else raw
            if not line.startswith("data:"):
                continue
            body = line[5:].strip()
            if not body or body == "[DONE]":
                continue
            try:
                event = json.loads(body)
            except json.JSONDecodeError:
                continue

            kind = event.get("type")
            if kind == "content_block_delta":
                delta = event.get("delta") or {}
                text = delta.get("text")
                if isinstance(text, str):
                    chunks.append(text)
                    received += len(text)
                    if received >= next_mark:
                        next_mark = received + PROGRESS_STEP
                        print(
                            f"\r[{label}] 已收 {received} 字元 / "
                            f"已耗 {time.time() - started:.0f} 秒",
                            end="",
                            file=sys.stderr,
                            flush=True,
                        )
            elif kind == "message_start":
                merge_usage(usage, (event.get("message") or {}).get("usage"))
            elif kind == "message_delta":
                merge_usage(usage, event.get("usage"))
            elif kind == "error":
                print("", file=sys.stderr)
                sys.exit(f"[{label}] 串流回報錯誤：{event.get('error')}")

    elapsed = time.time() - started
    if received >= PROGRESS_STEP:
        print("", file=sys.stderr)
    text = "".join(chunks)
    if not text.strip():
        sys.exit(f"[{label}] 回應是空的（耗時 {elapsed:.1f} 秒，usage={usage}）")
    return text, usage, elapsed


def report(label: str, usage: dict, elapsed: float) -> None:
    print(
        f"[{label}] 耗時 {elapsed:.1f} 秒｜"
        f"input {usage.get('input_tokens', 0)}／"
        f"output {usage.get('output_tokens', 0)}／"
        f"cache_read {usage.get('cache_read_input_tokens', 0)}"
    )


# ---------------------------------------------------------------- 解析與驗證


def strip_fence(text: str) -> str:
    body = text.strip()
    if body.startswith("```"):
        body = re.sub(r"^```[a-zA-Z]*\s*\n", "", body)
        body = re.sub(r"\n```\s*$", "", body)
    return body.strip()


ITEM_DASH = re.compile(r"^(\s*)- id:")


def reindent_block_sequence(text: str) -> str:
    """把 `- id: …` 的破折號縮排對齊到它自己欄位的縮排減 2。

    模型偶爾會讓第一題的破折號掉到第 0 欄，欄位卻跟其他題一樣縮 4 格：

        - id: ch13.statistics.i04.q1
            item: ch13.statistics.i04
          - id: ch13.statistics.i06.q1
            item: ch13.statistics.i06

    第 2 題起完全合法，只有第一題的破折號對不齊，YAML 就整份報
    `mapping values are not allowed here`——ch13 第 1 批就是這樣把 5 題 analysis
    連同整包丟掉，內容其實沒問題。這是看不見的字元問題，寫進提示沒有用
    （同 `strip_strings` 的尾端空白），只能機械修。

    只認 `- id:`（每題的第一個欄位固定是 id），所以選項的 `- text:` 不會被動到；
    而且只在 `yaml.safe_load` 已經失敗、輸出本來就要被丟掉時才呼叫。
    """
    lines = text.split("\n")
    fixed = list(lines)
    changed = False

    for index, line in enumerate(lines):
        match = ITEM_DASH.match(line)
        if not match:
            continue
        body = next(
            (len(l) - len(l.lstrip(" ")) for l in lines[index + 1:] if l.strip()),
            None,
        )
        if body is None or body < 2:
            continue
        want = body - 2
        if want != len(match.group(1)):
            fixed[index] = " " * want + line.lstrip(" ")
            changed = True

    return "\n".join(fixed) if changed else text


def load_yaml_lenient(text: str):
    """先照原樣解析，失敗才套機械修排版再試一次。"""
    try:
        return yaml.safe_load(text)
    except yaml.YAMLError:
        repaired = reindent_block_sequence(text)
        if repaired == text:
            raise
        return yaml.safe_load(repaired)


def strip_strings(value):
    """遞迴把所有字串的頭尾空白去掉。

    模型會把題幹寫成 `stem: 'Which ... sugar units? '`——**引號裡的尾端空白 YAML 會原樣保留**，
    而 G6 用 `stem.endswith("?")` 判句尾。結果是題幹看起來完全正確卻一直不過閘，
    模型也修不動（它看不見那個空白）：ch09 第一次生成就這樣燒完五輪修正、停在 13 條錯誤。
    這種「看不見的字元」只能機械清掉，寫進提示沒有用。
    """
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        return [strip_strings(entry) for entry in value]
    if isinstance(value, dict):
        return {key: strip_strings(entry) for key, entry in value.items()}
    return value


def parse_questions(text: str):
    """回傳 (questions, 錯誤清單)。解析不出來時 questions 為 None。"""
    try:
        data = load_yaml_lenient(strip_fence(text))
    except yaml.YAMLError as exc:
        return None, [f"YAML 解析失敗：{' '.join(str(exc).splitlines())}"]
    if not isinstance(data, dict):
        return None, ["輸出的頂層必須是 mapping（含 meta 與 questions）"]
    questions = data.get("questions")
    if not isinstance(questions, list) or not questions:
        return None, ["questions 必須是非空清單"]
    return strip_strings(questions), []


def validate_questions(questions: list, chid: str, item_ids: set, allowed_dco: set):
    """逐題結構檢查，回傳 (錯誤清單, 不合格的索引集合)。

    刻意**不數配額**：超量生成的候選池裡壞掉一題就丟那一題，沒有理由讓整批重出。
    這裡只驗「檔案能不能用」的那幾項；G2–G20 那種品質閘交給 cscs_quiz_bank_check。
    """
    errors = []
    broken = set()

    for number, question in enumerate(questions, 1):
        if not isinstance(question, dict):
            errors.append(f"第 {number} 題不是 mapping")
            broken.add(number - 1)
            continue
        qid = question.get("id") or f"第 {number} 題"
        local = []

        missing = [
            field for field in REQUIRED_FIELDS
            if not isinstance(question.get(field), (str, list)) or not question.get(field)
        ]
        if missing:
            local.append(f"{qid}：缺少必填欄位 {'／'.join(missing)}")

        # id 唯一性不在這裡驗：id 由 assign_ids 機械指派，模型交來的 id 只是佔位。
        # 曾經有一條「id 重複」規則，它把 ch08 那 29 題合法候選當成壞題丟掉。
        item_id = question.get("item")
        if isinstance(item_id, str) and item_id not in item_ids:
            local.append(f"{qid}：item `{item_id}` 不存在於 {chid}.yaml")
        dco = question.get("dco")
        if isinstance(dco, str) and dco not in allowed_dco:
            local.append(f"{qid}：dco `{dco}` 不在本章白名單")
        # 這兩欄是機械挑選的分格依據，值不合法的題目挑選時會整題落在沒人要的格子裡。
        if question.get("cognitive") not in ("recall", "application", "analysis"):
            local.append(f"{qid}：cognitive 必須是 recall／application／analysis")
        if question.get("lang") not in ("zh", "en"):
            local.append(f"{qid}：lang 必須是 zh 或 en")

        options = question.get("options")
        if not isinstance(options, list):
            local.append(f"{qid}：options 必須是清單")
        else:
            if len(options) != 3:
                local.append(f"{qid}：選項有 {len(options)} 個，必須恰好 3 個")
            correct = sum(
                1 for option in options
                if isinstance(option, dict) and option.get("correct") is True
            )
            if correct != 1:
                local.append(f"{qid}：correct: true 有 {correct} 個，必須恰好 1 個")

        if local:
            broken.add(number - 1)
            errors.extend(local)

    return errors, broken


def validate_quota(questions: list, quota) -> list:
    """配額檢查。超量生成模式下由 select_questions 保證成立，這裡只是最後確認。"""
    total, recall, application, analysis, english = quota
    errors = []

    if abs(len(questions) - total) > TOLERANCE:
        errors.append(f"本批共 {len(questions)} 題，配額要求 {total} 題（±{TOLERANCE}）")

    counts = Counter(
        question.get("cognitive") for question in questions
        if isinstance(question, dict) and isinstance(question.get("cognitive"), str)
    )
    english_count = sum(
        1 for question in questions
        if isinstance(question, dict) and question.get("lang") == "en"
    )

    for level, expected in (
        ("recall", recall), ("application", application), ("analysis", analysis)
    ):
        actual = counts.get(level, 0)
        if abs(actual - expected) > TOLERANCE:
            errors.append(f"{level} 有 {actual} 題，配額要求 {expected} 題（±{TOLERANCE}）")
    if abs(english_count - english) > TOLERANCE:
        errors.append(f"英文題有 {english_count} 題，配額要求 {english} 題（±{TOLERANCE}）")
    return errors


# ---------------------------------------------------------------- 寫檔與閘門


def backup_dir() -> Path:
    path = ROOT / ".prompts" / "backup"
    path.mkdir(parents=True, exist_ok=True)
    return path


def stamp() -> str:
    return datetime.now().strftime("%Y%m%d-%H%M%S")


def save_raw(chid: str, text: str) -> Path:
    """先把原始回應存檔，再做任何可能中止的驗證——一次生成很貴，不能被 exit 吃掉。"""
    path = backup_dir() / f"{chid}.{stamp()}.raw.txt"
    path.open("w", encoding="utf-8", newline="\n").write(text)
    return path


def guard_bank(questions: list) -> None:
    """寫檔前的自我保護。壞掉的題庫不該有機會落盤——落盤之後就得靠人去發現。"""
    ids = Counter(q.get("id") for q in questions if isinstance(q, dict))
    duplicated = sorted(qid for qid, count in ids.items() if count > 1)
    if duplicated:
        raise RuntimeError(f"拒絕寫檔：題目 id 重複 {duplicated}")

    items = Counter(q.get("item") for q in questions if isinstance(q, dict))
    over = sorted(f"{item}（{count} 題）" for item, count in items.items()
                  if count > MAX_ITEM_QUESTIONS)
    if over:
        raise RuntimeError(f"拒絕寫檔：item 超過 {MAX_ITEM_QUESTIONS} 題 {over}")


def write_bank(chid: str, base_questions: list, questions: list, raw_text=None) -> None:
    guard_bank(base_questions + questions)
    path = ROOT / "data" / "cscs" / "_quiz_bank" / f"{chid}.yaml"
    if path.exists():
        backup = backup_dir() / f"{chid}.{stamp()}.yaml"
        backup.open("w", encoding="utf-8", newline="\n").write(read_text(path))
        print(f"既有題庫已備份到 {backup.relative_to(ROOT).as_posix()}")

    # 原文只有在「解析回來跟 questions 一模一樣」時才可信：strip_strings 清掉的尾端空白
    # 就住在原文裡，照抄等於把剛修好的東西寫回去。
    verbatim = False
    if raw_text is not None and not base_questions:
        try:
            parsed = yaml.safe_load(strip_fence(raw_text))
            verbatim = isinstance(parsed, dict) and parsed.get("questions") == questions
        except yaml.YAMLError:
            verbatim = False

    if not verbatim:
        # 要跟先前批次合併、或題目已被局部修正過，就只能重新序列化；
        # 只有「第 0 輪、沒有 base、且原文已經是乾淨的」才能直接寫原文，保留模型輸出的排版。
        body = yaml.safe_dump(
            {
                "meta": {"chapter": chid, "source": f"data/cscs/{chid}.yaml"},
                "questions": base_questions + questions,
            },
            allow_unicode=True,
            sort_keys=False,
            default_flow_style=False,
            width=10**6,
        )
    else:
        body = strip_fence(raw_text) + "\n"

    path.parent.mkdir(parents=True, exist_ok=True)
    path.open("w", encoding="utf-8", newline="\n").write(body)
    print(f"已寫入 {path.relative_to(ROOT).as_posix()}（{len(base_questions) + len(questions)} 題）")


def gate_errors(chid: str, own_ids: set, part):
    """跑驗收閘並拆成 (本批要修的, 其他批次的, 章級統計的)。

    分批時本批只看得到自己那幾題，其他批次題目的錯誤丟回去也修不了。
    章級（qid 為 `-`）的 G10／G13 題數統計**永遠獨立一欄、只印不修**：它沒有對應的
    題目可以改，回灌只會讓模型去加題減題——ch08 第二批五輪全燒在這上面，一條品質
    錯誤都沒修到。題數現在由 select_questions 機械保證，不再是模型的工作。
    """
    errors, _, _ = check_bank()
    prefix = f"data/cscs/_quiz_bank/{chid}.yaml:"
    mine, others, counting = [], [], []

    for line in errors:
        if not line.startswith(prefix):
            continue
        qid = line[len(prefix):].split(":", 1)[0]
        if qid == "-":
            counting.append(line)
        elif qid in own_ids:
            mine.append(line)
        else:
            others.append(line)
    return mine, others, counting


def error_counts_by_id(chid: str, lines: list) -> Counter:
    """把閘門錯誤行數成 id → 條數，供挑選／修剪時「錯最多的先丟」用。"""
    prefix = f"data/cscs/_quiz_bank/{chid}.yaml:"
    counts = Counter()
    for line in lines:
        if line.startswith(prefix):
            counts[line[len(prefix):].split(":", 1)[0]] += 1
    return counts


def format_errors(errors: list) -> str:
    shown = errors[:MAX_FEEDBACK_LINES]
    extra = "" if len(errors) <= MAX_FEEDBACK_LINES else (
        f"\n\n（另有 {len(errors) - MAX_FEEDBACK_LINES} 條同類錯誤未列出，一併自查修正。）"
    )
    return "\n".join(shown) + extra


def full_fix_message(errors: list, total: int) -> str:
    """整份重出。只在還沒有任何一份可用題庫時使用（第 0 輪就解析失敗 / 配額不符）。"""
    return (
        "你剛才的輸出沒通過結構檢查：\n\n"
        + format_errors(errors)
        + f"\n\n重新輸出完整 YAML（含 meta 與全部 {total} 題），"
        "只輸出 YAML，不要說明文字、不要 code fence。"
        "特別注意題幹與選項裡的冒號、井號、引號必須用雙引號包住整個字串。"
    )


LENGTH_GATES = ("G2", "G4")  # 這兩道閘是純長度計數，可以先把目標算好給模型


def option_length(text: str) -> int:
    """選項長度，跟閘門同一套算法。

    `cscs_quiz_bank_check.py` 的 G2／G4 用的是 `lengths = [len(text) for text in texts]`，
    中英文都一樣算字元（連標點與空格），不分詞。這裡不另寫一版——算法只要差一個字，
    算出來的目標就是不可達的，給了比不給更糟。
    """
    return len(text)


def length_targets(options: list):
    """回傳 (目前三個長度, 下界 a, 上界 b)：三個選項都落在 [a, b] 就同時過 G2 與 G4。

    推導：三個長度都在 `[a, b]` 且 `b <= floor(1.15a)` 時——
    G2 的正解 ≤ b ≤ 1.15a ≤ 1.15 × 干擾項最大值（干擾項長度至少 a）；
    G4 的最長 / 最短 ≤ b / a ≤ 1.15 < 1.5。順帶把 G3 的變異係數也壓到遠低於 0.4。
    `a` 取目前三個長度的中位數：維持原本的詳略程度，不把短選項硬撐長、也不逼長的縮成電報體。
    `a < 7` 時 `floor(1.15a) == a`，這時就是「三個寫成一樣長」。
    """
    lengths = [option_length(option.get("text", "")) for option in options]
    low = sorted(lengths)[1]
    return lengths, low, low * 115 // 100


def length_hints(questions: list, errors: list) -> str:
    """把 G2／G4 的計數約束換算成「請寫成幾個字」的具體目標，附在錯誤清單後面。

    這兩道閘是純計數約束，而這個模型不會數數——第 2 輪的配額漂移是同一個病，當時的解法是
    把計數改成腳本機械執行。選項文字沒辦法機械改寫，但**目標可以先算好給它**：原本的訊息
    只講「你現在是 7 和 6」，沒講要寫成幾個字，模型每輪憑感覺重寫、每輪再差一個字。
    """
    named = set()
    for line in errors:
        parts = line.split(":", 3)
        if len(parts) >= 3 and parts[2] in LENGTH_GATES:
            named.add(parts[1])
    if not named:
        return ""

    lines = []
    for question in questions:
        if not isinstance(question, dict) or question.get("id") not in named:
            continue
        options = question.get("options")
        if not isinstance(options, list) or len(options) != OPTION_COUNT:
            continue
        if not all(isinstance(o, dict) and isinstance(o.get("text"), str) for o in options):
            continue
        lengths, low, high = length_targets(options)
        unit = "字元" if question.get("lang") == "en" else "字"
        goal = (f" 恰好 {low} {unit}（三個一樣長）" if low == high
                else f" {low}–{high} {unit}（三個都落在這個區間內）")
        lines.append(
            f"- `{question['id']}`：三個選項目前是 "
            f"{' / '.join(str(n) for n in lengths)} {unit}，請全部改寫成{goal}。"
        )
    if not lines:
        return ""

    return (
        "\n\n**G2 與 G4 只看長度，目標我已經算好了**，照下面的字數寫就會同時過這兩道閘"
        "（長度是連標點一起算的字元數，英文題連空格一起算；`why_wrong` 不計入，不用改）：\n\n"
        + "\n".join(lines)
        + "\n\n達到字數靠調整詳略——把省略的限定條件補回去、或把冗詞收掉，"
        "不要加贅字湊數，也不要把正解削成電報體。"
    )


def patch_output_format(lead: str) -> str:
    """局部替換的輸出格式。修正輪與審查輪共用一份，兩邊只有開頭那句不同。"""
    return (
        lead
        + "，格式是一個 YAML list，每個元素就是完整的一題"
        "（欄位與原本相同：id / item / dco / lang / cognitive / stem / locator / options）。"
        "\n\n- `id` 必須與原本那題**完全相同**，我會照 id 逐題替換。"
        "\n- **不要輸出 `meta`**，**不要輸出沒有要改的題目**。"
        "\n- 不要改動 `cognitive` 與 `lang`，那兩欄改了會讓全批配比失衡。"
        "\n- 只輸出 YAML，不要說明文字、不要 code fence。"
        "\n\n格式範例：\n\n"
        "```yaml\n"
        "- id: ch08.xxx.i01.q1\n"
        "  item: ch08.xxx.i01\n"
        "  dco: sf2.A.1\n"
        "  lang: zh\n"
        "  cognitive: application\n"
        "  stem: \"…最主要的原因是什麼？\"\n"
        "  locator: \"…\"\n"
        "  options:\n"
        "    - text: \"…\"\n"
        "      correct: true\n"
        "    - text: \"…\"\n"
        "      correct: false\n"
        "      why_wrong: \"…\"\n"
        "    - text: \"…\"\n"
        "      correct: false\n"
        "      why_wrong: \"…\"\n"
        "```"
    )


def patch_fix_message(errors: list, hints: str = "") -> str:
    """局部修正：只要被點名的那幾題。

    整份重出有兩個實測到的代價——output 每輪 7k tokens，而且沒被點名的題目會被連帶改掉
    （ch08 第一批重出後 analysis 從 3 題漂到 13 題）。只收回被點名的題目，兩件事一起解掉。

    `hints` 是 `length_hints()` 算出的字數目標，接在清單後面當額外指示，不取代清單
    （其他閘號的錯誤還是靠那份清單）。
    """
    return (
        "驗收閘 `tools/cscs_quiz_bank_check.py` 對你剛才的輸出回報下列錯誤，"
        "每行格式是 `檔案:題目id:閘號:說明`（閘號對照規格第七節的表）：\n\n"
        + format_errors(errors)
        + hints
        + "\n\n"
        + patch_output_format("**只輸出需要修正的那幾題**")
    )


def review_criteria(chid: str) -> str:
    """從 `tools/cscs_quiz_review_prompt.md` 取「第二步」與「第三步」兩節。

    那份檔案原本是寫給 agent 的：第一步叫它自己開三個檔、第四步叫它跑閘門改到全綠。
    新管道把題庫與章節素材都放進快取前綴、閘門由本腳本跑，那兩節是 harness 指令不是
    審查準則，帶進來只會讓模型去找它沒有的工具。中間兩節（七個問題 + 可改欄位）才是內容。
    """
    text = read_text(ROOT / "tools" / "cscs_quiz_review_prompt.md").replace("__CHID__", chid)
    start = text.find("## 第二步")
    end = text.find("## 第四步")
    if start < 0 or end < 0:
        sys.exit("cscs_quiz_review_prompt.md 找不到「第二步」或「第四步」標題，無法切出審查準則")
    return text[start:end].rstrip().rstrip("-").rstrip()


# 審查準則第 1 問（「會不會有人選它」）單獨拿去執行，會把干擾項改成「真的對」而不是
# 「錯得像對的」。2026-09-17 ch08 第一批實測：18 題裡 2 題變成三個選項同時成立。
# 第 3 問本來就擋得住，但它排在後面，模型照順序做到第 1 問就收手了——所以另立一節寫在最後。
REVIEW_PRIORITY = """## 這一輪的優先序（與上面第 1 問衝突時以本節為準）

第 1 問要求干擾項「像對的」，但它有一條不可跨越的界線：**干擾項必須是錯的**。
凡是你在 `why_wrong` 裡寫得出「這確實是教材說的」「這也是教材列舉的一項」「本身沒錯，
只是不夠全面／不是最佳答案」的選項，一律不准當干擾項——那不是難題，是沒有正解的題。

下面兩個反例都是 2026-09-17 這一輪自己改出來的，改完比改前更糟：

- 題幹「下列何者最符合教材對『喚醒』的測量指標描述？」，正解「心率與自陳量表並列」，
  干擾項被改成「血壓與兒茶酚胺濃度」「腦電圖與肌電圖」——這兩組**都是**教材列的喚醒指標，
  三個選項同時成立，考生沒有辦法選。
- 題幹「教材對『狀態焦慮與表現關係』的最忠實描述為何？」，正解「可能正負或無」，
  干擾項被改成「受運動員技能程度調節」「受任務複雜度調節」——兩個都是教材寫的調節變項。

**正確的改法是把鄰近概念錯置**：方向講反、層次搞混、把 A 的機制安到 B 身上。
同一批裡改對的那一題長這樣：漏接的原因從「桌球屬於低度競賽、無須專注」（不必讀書就知道是假的）
改成「高特質焦慮使其運動單位徵召失敗」——聽起來專業、考生會猶豫，但教材沒有這個連結，它是錯的。
干擾項讓人猶豫靠的是**錯得像對的**，不是靠**真的對**。"""

# 模型改壞的時候會在 `why_wrong` 裡自己承認（「確實是教材列舉的」），這些詞是最省的訊號。
# 只印不擋：措辭會變，當成閘門一定有漏網，但印出來至少不會無聲通過。
ADMISSION_PATTERN = re.compile(
    r"確實是|確實為|同屬教材|也是教材|教材提到的|教材列舉的另|本身沒錯|本身正確|雖然正確|說法正確"
)


def flag_self_admitted(patches: list) -> list:
    """挑出 `why_wrong` 自承「這個干擾項其實是對的」的題目 id。"""
    flagged = []
    for patch in patches:
        if not isinstance(patch, dict):
            continue
        options = patch.get("options")
        if not isinstance(options, list):
            continue
        for option in options:
            if isinstance(option, dict) and ADMISSION_PATTERN.search(str(option.get("why_wrong", ""))):
                flagged.append(patch.get("id"))
                break
    return flagged


def review_message(chid: str, ids: list) -> str:
    listing = "\n".join(f"- `{qid}`" for qid in ids)
    return (
        f"# 本輪要審的題目（{len(ids)} 題）\n\n"
        "上面那份題庫已經過完全部驗收閘：題數配比、`locator`、`dco`、認知層級都對了。"
        "**本輪不要重新檢查那些**，只抓閘門擋不到的東西——內容上站不住腳的干擾項。\n\n"
        "本輪只審下列 id，其他題一個字都不要動：\n\n"
        + listing
        + "\n\n---\n\n"
        + review_criteria(chid)
        + "\n\n---\n\n"
        + REVIEW_PRIORITY
        + "\n\n---\n\n"
        + patch_output_format("**只輸出你實際改過的那幾題**；這一批若一題都不用改就輸出 `[]`")
    )


def sibling_of(questions: list, qid: str):
    """同一個 `item` 底下的另一題（同 item 最多兩題，所以最多一個）。"""
    target = next((q for q in questions if isinstance(q, dict) and q.get("id") == qid), None)
    if not target:
        return None
    for other in questions:
        if isinstance(other, dict) and other.get("item") == target.get("item") \
                and other.get("id") != qid:
            return other
    return None


def render_question(question: dict) -> str:
    lines = [f"  題幹：{question.get('stem', '')}"]
    for option in question.get("options") or []:
        mark = "正解" if option.get("correct") else "干擾"
        lines.append(f"  [{mark}] {option.get('text', '')}")
    return "\n".join(lines)


def redo_message(chid: str, questions: list, targets: list) -> str:
    """重出輪：點名的題目與它的同 item 兄弟題在考同一件事，要改考別的事實。

    章節配額比可用 item 多時（ch08 是 100 題 / 54 個 item），規格允許同一個 item 出兩題，
    但沒有任何閘門檢查那兩題是不是同一題——ch08 實測 36 對裡有 24 對是把第一題翻成另一個
    語言或換句話說。閘門只數 id 唯一與每 item ≤2 題，這一類只有讀內容才看得出來。

    `targets` 是 `(id, 指定考點)` 的清單。第一輪只給散文（「挑沒被考過的那條」）的結果是
    17 題裡 12 題換了場景與語言、正解還是同一個事實——跟審查輪一樣，**沒有點名到具體哪一
    條事實的規則等於沒下**。所以這裡把來源條目的 `a` 逐條編號攤在題目旁邊，再由呼叫端用
    `--ids-file` 的 `id | 指定考點` 指定要考哪一條。`lang` / `cognitive` 鎖住綁章節配額。
    """
    items = {item["id"]: item for item in chapter_items(chid)}
    blocks = []
    for qid, directive in targets:
        target = next((q for q in questions if isinstance(q, dict) and q.get("id") == qid), None)
        if not target:
            continue
        sibling = sibling_of(questions, qid)
        part = [f"### `{qid}`（{target.get('lang')} / {target.get('cognitive')}），"
                f"來源條目 `{target.get('item')}`"]

        item = items.get(target.get("item")) or {}
        facts = [f"  F{index}. {text}" for index, text in enumerate(item.get("a") or [], 1)]
        if item.get("detail"):
            facts.append(f"  D. {item['detail']}")
        if facts:
            part.append(f"\n來源條目可考的事實（`{item.get('q', '')}`）：\n")
            part.append("\n".join(facts))

        if sibling:
            part.append(f"\n**同 item 的另一題 `{sibling.get('id')}`"
                        f"（{sibling.get('lang')} / {sibling.get('cognitive')}）已經考掉的內容："
                        "這題不准再考一次**\n")
            part.append(render_question(sibling))
        part.append("\n**要重出的就是下面這題**（它跟上面那題在考同一件事）：\n")
        part.append(render_question(target))
        if directive:
            part.append(f"\n**這題指定改考：{directive}**")
        blocks.append("\n".join(part))

    return (
        f"# 本輪要重出的題目（{len(blocks)} 題）\n\n"
        "下面每一題都跟它同一個來源條目底下的另一題**在考同一個事實**——"
        "有的是直接翻成另一個語言，有的是換句話說。這種題目過得了全部驗收閘"
        "（id 唯一、每個 item ≤2 題都成立），但等於把題庫的一半浪費掉。\n\n"
        "**要做的是換一個考點，不是把題幹改寫得漂亮一點。**"
        "每一題下面都列了來源條目可考的事實（F1、F2…與 `detail` 的 D），"
        "並寫明兄弟題已經考掉哪一條、這題指定改考哪一條。"
        "**照指定的那一條出，不要自己換一條，也不要回頭考兄弟題那條。**\n\n"
        "四條硬限制：\n\n"
        "- **`lang` 與 `cognitive` 一個字都不能改**，它們綁著章節的中英比與認知層級配比。\n"
        "- 新題的正解不可以跟上面列出的那一題的正解是同一個概念，"
        "**也不可以只是把它換成另一個語言**——換個運動項目、換個場景都不算換考點。\n"
        "- **正解只能寫來源事實裡出現過的東西**，不要補上教材沒寫的量表名稱、數字或專有名詞。\n"
        "- 干擾項照舊必須是錯的。寫得出「這確實也是教材說的」就是廢題。\n\n"
        "---\n\n"
        + "\n\n".join(blocks)
        + "\n\n---\n\n"
        + patch_output_format("**輸出上面點名的每一題的完整新版**")
    )


def lock_fixed_fields(questions: list, patches: list):
    """審查輪只准改 `stem` 與 `options`，其餘欄位一律用原題的值蓋回去。

    提示裡寫「不准動」擋不住模型順手改 `cognitive`——那一欄漂一題，整章認知配比就不合格，
    而閘門要到章級統計才看得出來（那時已經不知道是哪一題漂的）。機械覆蓋比事後抓便宜。
    """
    by_id = {
        question["id"]: question for question in questions
        if isinstance(question, dict) and isinstance(question.get("id"), str)
    }
    locked = []
    reverted = 0
    for patch in patches:
        original = by_id.get(patch.get("id")) if isinstance(patch, dict) else None
        if original is None:
            locked.append(patch)
            continue
        fixed = {field: original[field] for field in FIXED_FIELDS if field in original}
        reverted += sum(1 for field, value in fixed.items() if patch.get(field) != value)
        locked.append({**patch, **fixed})
    if reverted:
        print(f"審查輪改動了 {reverted} 個不准改的欄位，已還原成原值")
    return locked


def parse_patch(text: str, allow_empty: bool = False):
    """回傳 (題目 list, 錯誤清單)。接受裸 list，也接受被包進 `questions:` 的 list。"""
    try:
        data = load_yaml_lenient(strip_fence(text))
    except yaml.YAMLError as exc:
        return None, [f"YAML 解析失敗：{' '.join(str(exc).splitlines())}"]
    if isinstance(data, dict):
        data = data.get("questions")
    if not isinstance(data, list):
        return None, ["修正輪的輸出必須是一個 YAML list，每個元素是完整的一題"]
    if not data:
        # 審查輪的空 list 是合法答案（這批沒有要改的），修正輪的不是（點名了就得交）。
        return ([], []) if allow_empty else (None, ["修正輪回傳 0 題；至少要輸出一題被點名的題目"])
    return data, []


def apply_patch(questions: list, patches: list):
    """按 id 逐題替換，回傳 (替換後的題目 list, 錯誤清單)。

    擋兩件事：回傳的 id 不在本批題庫裡（模型自己編了新題或改了 id），以及一題都沒替換到。
    有任何一條不成立就整批不套用——半套的替換會讓檔案停在說不清楚的狀態。
    """
    index_of = {
        question.get("id"): position
        for position, question in enumerate(questions)
        if isinstance(question, dict) and isinstance(question.get("id"), str)
    }
    merged = list(questions)
    errors = []
    applied = set()

    for position, patch in enumerate(patches, 1):
        if not isinstance(patch, dict):
            errors.append(f"修正輪第 {position} 個元素不是 mapping")
            continue
        qid = patch.get("id")
        if not isinstance(qid, str) or qid not in index_of:
            errors.append(f"修正輪回傳的 id `{qid}` 不在本批題庫裡，無法替換；請用原本的 id")
            continue
        if qid in applied:
            errors.append(f"修正輪把 `{qid}` 回傳了兩次")
            continue
        applied.add(qid)
        merged[index_of[qid]] = patch

    if not errors and not applied:
        errors.append("修正輪沒有替換到任何題目")
    if errors:
        return questions, errors
    print(f"局部修正：替換了 {len(applied)} 題（{'、'.join(sorted(applied))}）")
    return merged, []


def topup_message(shortfall: dict, free_items: list) -> str:
    """補件請求：只補挑不滿的那幾格，走跟局部修正同一條「只收回一個 YAML list」的管道。

    這是超量生成唯一會失手的情形（某一格寫太少）。補這幾題比整份重出便宜兩個量級，
    而且不會動到已經挑好的題目。
    """
    cells = "\n".join(
        f"- `cognitive: {cognitive}` ＋ `lang: {lang}`：再寫 {count} 題"
        for (cognitive, lang), count in sorted(shortfall.items())
    )
    listing = "\n".join(f"- `{item_id}`" for item_id in free_items[:60])
    return (
        "你交的題目我已經挑過一輪，下面這幾格數量不夠，挑不滿配額。"
        "**只補這幾格，其他的不要重寫**：\n\n"
        + cells
        + f"\n\n下列 item 還有空位（同一個 item 全章至多 {MAX_ITEM_QUESTIONS} 題），"
        "請從這裡挑，這次每個 item 最多再寫一題：\n\n"
        + listing
        + "\n\n**只輸出一個 YAML list**，每個元素是完整的一題"
        "（id / item / dco / lang / cognitive / stem / locator / options）。"
        "\n\n- `id` 要是新的，不可以跟先前交過的題目重複。"
        "\n- `cognitive` 與 `lang` 必須剛好是我上面指定的值。"
        "\n- **不要輸出 `meta`**，不要重複先前交過的題目，不要說明文字、不要 code fence。"
    )


def grid_shortfall(questions: list, grid: dict) -> dict:
    """現有題庫離目標配額還差幾題，逐格算。只回報缺的，多出來的格子交給修剪處理。"""
    have = Counter(
        (q.get("cognitive"), q.get("lang")) for q in questions if isinstance(q, dict)
    )
    return {cell: need - have.get(cell, 0) for cell, need in grid.items()
            if need - have.get(cell, 0) > 0}


def free_item_ids(chid: str, questions: list) -> list:
    """還沒用滿 `MAX_ITEM_QUESTIONS` 的 item。

    補件時不能沿用「完全沒用過的 item」那個算法：ch08 的 64 個 item 早就全部用過了，
    照那樣算會得到一份空清單，模型只好自己亂挑，挑到的多半是已經有 2 題的那些。
    """
    used = Counter(q.get("item") for q in questions if isinstance(q, dict))
    return [item["id"] for item in chapter_items(chid)
            if used.get(item["id"], 0) < MAX_ITEM_QUESTIONS]


def topup_id_note(renamed: list) -> str:
    """補件題目被重新編號後，要先把新舊 id 對照告訴模型。

    補件那幾題不在快取前綴的題庫快照裡（前綴在補件之前就定稿了，重建它等於丟掉快取），
    模型只在自己那則回覆裡看過它們、而且看到的是它自己取的 id。下一輪點名時如果直接給
    新 id，模型會對不上是哪一題。
    """
    if not renamed:
        return ""
    lines = "\n".join(f"- 你寫的 `{old}` → 現在是 `{new}`" for old, new in renamed)
    return (
        "先說明一件事：`id` 一律由腳本按 `<item>.qN` 機械指派，所以你剛補的那幾題被重新編號了，"
        "接下來的錯誤清單用的是**新的 id**：\n\n" + lines + "\n\n"
    )


def merge_topup(questions: list, extra: list, shortfall: dict):
    """把補件收回來的題目併進題庫，回傳 (併入後, 實收的題目, 逐格收了幾題, 新舊 id 對照)。

    只收「確實有缺口的格子」且「item 還有空位」的題目。模型補到別格或補到滿了的 item，
    收下去只會把 G10 從缺口變成超額、或是讓 `guard_bank` 直接拒絕寫檔。
    """
    room = Counter(shortfall)
    used = Counter(q.get("item") for q in questions if isinstance(q, dict))
    taken = Counter()
    accepted = []

    for question in extra:
        if not isinstance(question, dict):
            continue
        cell = (question.get("cognitive"), question.get("lang"))
        item_id = question.get("item")
        if room[cell] <= 0 or used[item_id] >= MAX_ITEM_QUESTIONS:
            continue
        room[cell] -= 1
        used[item_id] += 1
        taken[cell] += 1
        accepted.append(question)

    before = [q.get("id") for q in accepted]
    assign_ids(accepted, {q.get("id") for q in questions if isinstance(q, dict)})
    renamed = [(old, q.get("id")) for old, q in zip(before, accepted) if old != q.get("id")]
    return questions + accepted, accepted, taken, renamed


# ---------------------------------------------------------------- 主流程


def accumulate(totals: dict, usage: dict) -> None:
    for key in totals:
        totals[key] += usage.get(key, 0)


def print_errors(errors: list, limit: int = 10) -> None:
    for line in errors[:limit]:
        print(f"  {line}")
    if len(errors) > limit:
        print(f"  …另有 {len(errors) - limit} 條")


def patch_loop(chid, label, messages, base_questions, questions, item_ids, allowed_dco,
               part, totals, errors, armed=False):
    """「閘 → 局部修正」共用迴圈，回傳 (題目, 最終錯誤, 耗時)。

    `armed=True` 代表第 1 輪的請求已經包在 messages 最後那則使用者訊息裡（--fix-only
    會把錯誤清單跟快取前綴併在同一則送出，省一次往返）。
    """
    elapsed_total = 0.0
    previous = None

    for round_no in range(1, MAX_FIX_ROUNDS + 1):
        if armed:
            armed = False
        else:
            messages.append({
                "role": "user",
                "content": patch_fix_message(errors, length_hints(questions, errors)),
            })

        raw_text, usage, elapsed = stream_call(messages, MAX_TOKENS, f"{label} 修正 {round_no}")
        save_raw(chid, raw_text)
        accumulate(totals, usage)
        elapsed_total += elapsed
        messages.append({"role": "assistant", "content": raw_text})
        report(f"{label} 第 {round_no} 輪", usage, elapsed)

        patches, problems = parse_patch(raw_text)
        merged = questions
        if not problems:
            merged, problems = apply_patch(questions, patches)
        if not problems:
            structural, broken = validate_questions(merged, chid, item_ids, allowed_dco)
            if broken:
                problems = structural

        if problems:
            # 修正輪自己寫壞了：不寫檔，把問題原樣丟回去，下一輪重修同一批題目。
            print(f"[{label} 第 {round_no} 輪] 修正輪的輸出有 {len(problems)} 條問題，不寫檔")
            print_errors(problems)
            errors = problems
            continue

        questions = merged
        write_bank(chid, base_questions, questions)
        own_ids = {q.get("id") for q in questions if isinstance(q, dict)}
        errors, others, counting = gate_errors(chid, own_ids, part)
        if others:
            print(f"另有 {len(others)} 條錯誤屬於其他批次的題目，本次不修")
        if counting:
            print(f"另有 {len(counting)} 條章級題數統計錯誤（只印不修，題數由挑選保證）")
        print(f"[{label} 第 {round_no} 輪] 驗收閘剩餘錯誤：{len(errors)} 條")
        if not errors:
            print(f"{label}：全綠。")
            return questions, [], elapsed_total
        print_errors(errors)

        # 模型每輪都交得出修正、錯誤清單卻一字不變 = 它修不動這幾題（ch01 空轉了 5 輪）。
        # 這類卡關一律是機械性限制（裸標籤選項字元重疊、中英名詞長度天生差距），
        # 再跑幾輪只是重複同一個失敗，直接停下來交給人工改比較快。
        signature = frozenset(errors)
        if signature == previous:
            print(f"{label}：第 {round_no} 輪的錯誤與上一輪完全相同，判定模型修不動，"
                  f"提前停在 {len(errors)} 條交人工。")
            return questions, errors, elapsed_total
        previous = signature

    print(f"{label}：用完 {MAX_FIX_ROUNDS} 輪修正仍有 {len(errors)} 條錯誤，停在這裡。")
    return questions, errors, elapsed_total


def print_totals(totals: dict, elapsed: float, errors: list) -> None:
    seen_input = totals["input_tokens"] + totals["cache_read_input_tokens"]
    hit_rate = totals["cache_read_input_tokens"] / seen_input * 100 if seen_input else 0.0
    print(
        f"\n總計：耗時 {elapsed:.1f} 秒｜"
        f"input {totals['input_tokens']}／output {totals['output_tokens']}／"
        f"cache_read {totals['cache_read_input_tokens']}"
        f"（佔總輸入 {hit_rate:.1f}%）｜"
        f"最終狀態：{'過閘' if not errors else f'剩 {len(errors)} 條錯誤'}"
    )


def run_chapter(chid: str, part, topup: bool = False) -> int:
    base_questions = load_bank(chid) if topup or (part and part[0] > 1) else []
    if topup:
        quota, grid = topup_plan(chid, base_questions)
    else:
        quota = quota_for(chid, part)
        grid = target_grid(quota)
    total = quota[0]
    over_total = int(round(total * OVERGEN_RATIO))
    item_ids = {item["id"] for item in chapter_items(chid)}
    allowed_dco = dco_allowed(chid)

    used_items = sorted({q.get("item") for q in base_questions if isinstance(q, dict)})

    stable, volatile = build_sections(chid, quota, used_items, part, grid=grid)
    blocks = build_blocks(stable, volatile)
    messages = [{"role": "user", "content": blocks}]

    label = f"{chid} 補題" if topup else (chid if part is None else f"{chid} {part[0]}/{part[1]}")
    prompt_chars = sum(len(block["text"]) for block in blocks)
    print(f"{label}：要 {over_total} 題、挑 {total} 題"
          f"（{quota[1]}/{quota[2]}/{quota[3]}，英文 {quota[4]}）"
          f"，prompt {prompt_chars} 字元 ≈ {est_tokens(join_sections(stable + volatile))} tokens"
          f"（快取前綴 {len(blocks[0]['text'])} 字元）")
    if base_questions:
        print(f"既有 {len(base_questions)} 題（{len(used_items)} 個 item 已用過），本批接在後面")

    totals = {"input_tokens": 0, "output_tokens": 0, "cache_read_input_tokens": 0}
    total_elapsed = 0.0

    # ---- 第一階段：拿到超量候選池 ----
    raw_text, usage, elapsed = stream_call(messages, MAX_TOKENS, f"{label} 出題")
    save_raw(chid, raw_text)
    accumulate(totals, usage)
    total_elapsed += elapsed
    report(f"{label} 出題", usage, elapsed)

    pool, problems = parse_questions(raw_text)
    if pool is None:
        # 整份解析不出來（多半是題幹裸冒號）才重出一次，這是唯一還會整份重來的情形。
        print(f"[{label}] 候選池解析失敗：{len(problems)} 條")
        print_errors(problems)
        messages.append({"role": "assistant", "content": raw_text})
        messages.append({"role": "user", "content": full_fix_message(problems, over_total)})
        raw_text, usage, elapsed = stream_call(messages, MAX_TOKENS, f"{label} 重出")
        save_raw(chid, raw_text)
        accumulate(totals, usage)
        total_elapsed += elapsed
        report(f"{label} 重出", usage, elapsed)
        pool, problems = parse_questions(raw_text)
        if pool is None:
            print(f"[{label}] 重出仍然解析不了，停在這裡。")
            print_errors(problems)
            print_totals(totals, total_elapsed, problems)
            return 1
    messages.append({"role": "assistant", "content": raw_text})

    # ---- 第二階段：丟掉壞題，機械挑到剛好 ----
    structural, broken = validate_questions(pool, chid, item_ids, allowed_dco)
    if broken:
        print(f"候選池 {len(pool)} 題，其中 {len(broken)} 題結構不合格，直接丟棄（不回灌）：")
        print_errors(structural, 6)
        pool = [question for index, question in enumerate(pool) if index not in broken]
    print(f"候選池可用 {len(pool)} 題，要挑 {total} 題（{describe_grid(grid)}）")

    selected, dropped, shortfall = select_questions(pool, grid, used_items)
    if shortfall:
        print(f"有 {sum(shortfall.values())} 題挑不滿（{describe_grid(shortfall)}），發一次補件請求")
        taken = {q.get("item") for q in pool if isinstance(q, dict)} | set(used_items)
        free_items = [item["id"] for item in chapter_items(chid) if item["id"] not in taken]
        messages.append({"role": "user", "content": topup_message(shortfall, free_items)})
        raw_text, usage, elapsed = stream_call(messages, MAX_TOKENS, f"{label} 補件")
        save_raw(chid, raw_text)
        accumulate(totals, usage)
        total_elapsed += elapsed
        messages.append({"role": "assistant", "content": raw_text})
        report(f"{label} 補件", usage, elapsed)

        extra, problems = parse_patch(raw_text)
        if problems:
            print(f"補件輪解析失敗（{problems[0]}），用現有候選池繼續")
        else:
            known = {q.get("id") for q in pool if isinstance(q, dict)}
            _, bad = validate_questions(extra, chid, item_ids, allowed_dco)
            extra = [
                question for index, question in enumerate(extra)
                if index not in bad and isinstance(question, dict)
                and question.get("id") not in known
            ]
            print(f"補件收到 {len(extra)} 題可用，併入候選池重挑")
            pool = pool + extra
        selected, dropped, shortfall = select_questions(pool, grid, used_items)

    if shortfall:
        # 補件之後還是不夠：寧可少幾題進檔，也不要退回「叫模型重出湊數」的老路。
        print(f"補件後仍缺 {sum(shortfall.values())} 題（{describe_grid(shortfall)}），"
              f"本批以 {len(selected)} 題收尾")
    print(f"挑中 {len(selected)} 題，丟棄 {len(dropped)} 題")
    quota_errors = validate_quota(selected, quota)
    if quota_errors:
        print("挑選後配額仍不符（這不該發生）：")
        print_errors(quota_errors)

    # ---- 第三階段：指派 id → 寫檔 → 閘 → 局部修正 ----
    # 一定要在挑選之後：超量候選池同一個 item 可能有四五題，在挑選前編號會跑到 q5。
    assign_ids(selected, {q.get("id") for q in base_questions if isinstance(q, dict)})
    write_bank(chid, base_questions, selected)
    own_ids = {q.get("id") for q in selected if isinstance(q, dict)}
    errors, others, counting = gate_errors(chid, own_ids, part)
    if others:
        print(f"另有 {len(others)} 條錯誤屬於其他批次的題目，本次不修")
    if counting:
        print(f"另有 {len(counting)} 條章級題數統計錯誤（只印不修，題數由挑選保證）")
    print(f"[{label} 第 0 輪] 驗收閘剩餘錯誤：{len(errors)} 條")

    if errors:
        print_errors(errors)
        _, errors, fix_elapsed = patch_loop(
            chid, label, messages, base_questions, selected,
            item_ids, allowed_dco, part, totals, errors,
        )
        total_elapsed += fix_elapsed
    else:
        print(f"{label}：全綠。")

    print_totals(totals, total_elapsed, errors)
    return 0 if not errors else 1


def run_fix_only(chid: str) -> int:
    """只修既有題庫，不出新題。

    分批出題留下的跨批殘渣（ch08 第一批剩 1 條、第二批剩 19 條）在分批模式下永遠被
    歸類成「其他批次的錯誤」而不會被修。這個模式一次看整章、不做批次過濾。
    """
    quota = quota_for(chid, None)
    total = quota[0]
    questions = load_bank(chid)
    if not questions:
        sys.exit(f"{chid} 還沒有題庫，--fix-only 沒有東西可以修")
    item_ids = {item["id"] for item in chapter_items(chid)}
    allowed_dco = dco_allowed(chid)
    label = f"{chid} fix"

    all_ids = {q.get("id") for q in questions if isinstance(q, dict)}
    errors, _, counting = gate_errors(chid, all_ids, None)
    print(f"{label}：現有 {len(questions)} 題（唯一 id {len(all_ids)} 個），配額 {total} 題；"
          f"題目級錯誤 {len(errors)} 條、章級統計錯誤 {len(counting)} 條")

    # ---- 修復前置：id 重編 + item 超量修剪 ----
    # 必須在 build_sections 之前跑完：那個函式會把整份題庫攤進快取前綴給模型看，
    # 修在後面的話模型看到的 id 會跟錯誤清單裡的 id 對不上。
    # 逐題的錯誤條數要在重編 id 之前先抓，重編之後閘門那份清單的 id 就對不上了。
    counts = error_counts_by_id(chid, errors)
    weights = [counts.get(q.get("id"), 0) if isinstance(q, dict) else 0 for q in questions]
    questions, overflow = trim_item_overflow(questions, weights)
    before_ids = [q.get("id") for q in questions if isinstance(q, dict)]
    assign_ids(questions)
    renamed = sum(
        1 for question, old in zip([q for q in questions if isinstance(q, dict)], before_ids)
        if question.get("id") != old
    )

    if overflow or renamed:
        if overflow:
            # 不印被丟那題的 id：重編之前的 id 是模型給的（整章都叫 `<item>.q1`），
            # 印出來會跟重編後留下的 q1 撞名，看起來像丟錯題。改印 item + 題幹開頭。
            print(f"{label}：item 超過 {MAX_ITEM_QUESTIONS} 題，丟棄 " + "、".join(
                f"{q.get('item', '?')}「{str(q.get('stem', ''))[:18]}…」" for q in overflow
            ))
        if renamed:
            print(f"{label}：重編 {renamed} 個題目 id（現在 {len(questions)} 題全部唯一）")
        write_bank(chid, [], questions)
        all_ids = {q.get("id") for q in questions if isinstance(q, dict)}
        errors, _, counting = gate_errors(chid, all_ids, None)
        print(f"{label}：修復後題目級錯誤 {len(errors)} 條、章級統計錯誤 {len(counting)} 條")

    # ---- 超額就先機械修剪，不要叫模型刪題 ----
    if len(questions) > total:
        counts = error_counts_by_id(chid, errors)
        selected, dropped, shortfall = select_questions(
            questions, target_grid(quota), error_counts=counts
        )
        if shortfall:
            print(f"修剪會讓 {describe_grid(shortfall)} 挑不滿，維持現狀不修剪")
        else:
            print(f"超額 {len(questions) - total} 題，修剪成 {len(selected)} 題；"
                  f"丟棄：{'、'.join(q.get('id', '?') for q in dropped)}")
            assign_ids(selected)  # 丟掉 q1 只留 q2 會跳號，重編一次維持「依序不跳號」
            write_bank(chid, [], selected)
            questions = selected
            all_ids = {q.get("id") for q in questions if isinstance(q, dict)}
            errors, _, counting = gate_errors(chid, all_ids, None)
            print(f"修剪後：題目級錯誤 {len(errors)} 條、章級統計錯誤 {len(counting)} 條")

    if counting:
        print("章級統計錯誤（只印不修）：")
        print_errors(counting, 6)

    shortfall = grid_shortfall(questions, target_grid(quota))
    if not errors and not shortfall:
        print(f"{label}：題目級全綠、配額也滿了，沒有要修的。")
        return 0
    print_errors(errors)

    # 要修的題庫整份放進快取前綴。修復前置一定要在這之前跑完：這裡會把整份題庫攤給模型看，
    # 修在後面的話模型看到的 id 會跟錯誤清單裡的 id 對不上。
    stable, _ = build_sections(chid, quota, [], None, bank=questions)
    totals = {"input_tokens": 0, "output_tokens": 0, "cache_read_input_tokens": 0}
    elapsed_total = 0.0

    # ---- 補件：--fix-only 只會修、只會修剪，不補的話 G10 那幾條永遠紅著 ----
    if shortfall:
        print(f"{label}：配額缺 {sum(shortfall.values())} 題（{describe_grid(shortfall)}），"
              f"發一次補件請求")
        blocks = build_blocks(stable, [("補件", topup_message(shortfall, free_item_ids(chid, questions)))])
        messages = [{"role": "user", "content": blocks}]
        print(f"prompt {sum(len(block['text']) for block in blocks)} 字元"
              f"（快取前綴 {len(blocks[0]['text'])} 字元）")

        raw_text, usage, elapsed = stream_call(messages, MAX_TOKENS, f"{label} 補件")
        save_raw(chid, raw_text)
        accumulate(totals, usage)
        elapsed_total += elapsed
        messages.append({"role": "assistant", "content": raw_text})
        report(f"{label} 補件", usage, elapsed)

        # 補不到就照實印一行往下走：補件失敗不該讓整輪修正停擺。
        extra, problems = parse_patch(raw_text)
        renamed = []
        if problems:
            print(f"{label}：補件輪解析失敗（{problems[0]}），維持現有題數繼續修")
        else:
            _, bad = validate_questions(extra, chid, item_ids, allowed_dco)
            extra = [q for index, q in enumerate(extra) if index not in bad]
            questions, accepted, taken, renamed = merge_topup(questions, extra, shortfall)
            print(f"{label}：補件收到 {len(extra)} 題可用、實收 {len(accepted)} 題"
                  f"（{describe_grid(taken) or '無'}），現在 {len(questions)} 題")
            if accepted:
                write_bank(chid, [], questions)
            still = grid_shortfall(questions, target_grid(quota))
            if still:
                print(f"{label}：補件後仍缺 {sum(still.values())} 題（{describe_grid(still)}）")
        all_ids = {q.get("id") for q in questions if isinstance(q, dict)}
        errors, _, counting = gate_errors(chid, all_ids, None)
        print(f"{label}：補件後題目級錯誤 {len(errors)} 條、章級統計錯誤 {len(counting)} 條")

        # 補缺口不等於總數對。有格子缺就一定有格子多（總和是固定的 100），只補不修剪會
        # 從「少 3 題」變成「多 4 題」——實測 97 補 7 題變 104，G10 與 G13 一起轉紅。
        if len(questions) > total:
            counts = error_counts_by_id(chid, errors)
            selected, dropped, still = select_questions(
                questions, target_grid(quota), error_counts=counts
            )
            if still:
                print(f"{label}：補件後修剪會讓 {describe_grid(still)} 挑不滿，維持 {len(questions)} 題")
            else:
                print(f"{label}：補件後超額 {len(questions) - total} 題，修剪成 {len(selected)} 題；"
                      f"丟棄：{'、'.join(q.get('id', '?') for q in dropped)}")
                # 這裡刻意不重編 id：模型已經看過這份題庫（在快取前綴裡）也收過新舊 id 對照，
                # 再改一次編號會讓接下來點名的 id 對不上。編號跳號不違反任何一道閘。
                questions = selected
                write_bank(chid, [], questions)
                all_ids = {q.get("id") for q in questions if isinstance(q, dict)}
                errors, _, counting = gate_errors(chid, all_ids, None)
                print(f"{label}：修剪後題目級錯誤 {len(errors)} 條、章級統計錯誤 {len(counting)} 條")
        if counting:
            print_errors(counting, 6)
        if errors:
            messages.append({
                "role": "user",
                "content": topup_id_note(renamed)
                + patch_fix_message(errors, length_hints(questions, errors)),
            })
        armed = True
    else:
        # 沒有缺口時把第 1 輪的錯誤清單跟快取前綴併在同一則送出，省一次往返。
        blocks = build_blocks(stable, [
            ("本輪要修的題目", patch_fix_message(errors, length_hints(questions, errors))),
        ])
        messages = [{"role": "user", "content": blocks}]
        print(f"prompt {sum(len(block['text']) for block in blocks)} 字元"
              f"（快取前綴 {len(blocks[0]['text'])} 字元）")
        armed = True

    if not errors:
        print(f"{label}：題目級全綠，沒有要修的。")
        print_totals(totals, elapsed_total, errors)
        return 0

    _, errors, elapsed = patch_loop(
        chid, label, messages, [], questions,
        item_ids, allowed_dco, None, totals, errors, armed=armed,
    )
    print_totals(totals, elapsed_total + elapsed, errors)
    return 0 if not errors else 1


def run_review(chid: str) -> int:
    """第二輪：逐題審內容，抓閘門擋不到的爛干擾項。

    舊管道這一輪是派 agent 讀 `tools/cscs_quiz_review_prompt.md` 自己改檔；這裡改成
    同一條「快取前綴 + 局部替換」的管道。分批點名是因為一次叫它審一百題，它會挑幾題
    交差；每批寫一次盤，中途斷掉只損失進行中那一批。

    快取前綴裡的題庫是**開跑那一刻的版本**，不隨各批改動更新——重建前綴等於每批都
    重算兩萬多 token。代價是後面的批次看到的前面題目是舊文字，只影響「跨題撞概念」
    那一問；換掉整份快取不值得。
    """
    quota = quota_for(chid, None)
    questions = load_bank(chid)
    if not questions:
        sys.exit(f"{chid} 還沒有題庫，--review 沒有東西可以審")
    item_ids = {item["id"] for item in chapter_items(chid)}
    allowed_dco = dco_allowed(chid)
    label = f"{chid} review"

    all_ids = {q.get("id") for q in questions if isinstance(q, dict)}
    errors, _, counting = gate_errors(chid, all_ids, None)
    print(f"{label}：現有 {len(questions)} 題；題目級錯誤 {len(errors)} 條、"
          f"章級統計錯誤 {len(counting)} 條")
    if errors:
        print("提醒：審查輪是給已經過閘的題庫用的，先跑 --fix-only 把閘門修綠比較省事。")

    stable, _ = build_sections(chid, quota, [], None, bank=questions)
    totals = {"input_tokens": 0, "output_tokens": 0, "cache_read_input_tokens": 0}
    elapsed_total = 0.0

    ids = [q["id"] for q in questions if isinstance(q, dict) and isinstance(q.get("id"), str)]
    chunks = [ids[start:start + REVIEW_CHUNK] for start in range(0, len(ids), REVIEW_CHUNK)]
    changed = 0
    flagged = []

    for number, chunk in enumerate(chunks, 1):
        blocks = build_blocks(stable, [("本輪要審的題目", review_message(chid, chunk))])
        messages = [{"role": "user", "content": blocks}]
        raw_text, usage, elapsed = stream_call(
            messages, MAX_TOKENS, f"{label} 第 {number}/{len(chunks)} 批"
        )
        save_raw(chid, raw_text)
        accumulate(totals, usage)
        elapsed_total += elapsed
        report(f"{label} 第 {number}/{len(chunks)} 批", usage, elapsed)

        patches, problems = parse_patch(raw_text, allow_empty=True)
        if problems:
            print(f"{label} 第 {number} 批解析失敗（{problems[0]}），跳過這批")
            continue
        if not patches:
            print(f"{label} 第 {number} 批：模型判定這 {len(chunk)} 題都不用改")
            continue

        outside = [p.get("id") for p in patches if isinstance(p, dict) and p.get("id") not in chunk]
        if outside:
            print(f"{label} 第 {number} 批交回 {len(outside)} 題不在本批名單內，丟棄："
                  + "、".join(str(qid) for qid in outside[:6]))
            patches = [p for p in patches if isinstance(p, dict) and p.get("id") in chunk]
        if not patches:
            continue

        merged, problems = apply_patch(questions, lock_fixed_fields(questions, patches))
        if not problems:
            structural, broken = validate_questions(merged, chid, item_ids, allowed_dco)
            if broken:
                problems = structural
        if problems:
            print(f"{label} 第 {number} 批的輸出有 {len(problems)} 條問題，不寫檔")
            print_errors(problems)
            continue

        questions = merged
        write_bank(chid, [], questions)
        changed += len(patches)
        flagged += flag_self_admitted(patches)
        all_ids = {q.get("id") for q in questions if isinstance(q, dict)}
        errors, _, _ = gate_errors(chid, all_ids, None)
        print(f"{label} 第 {number} 批：改了 {len(patches)} 題，"
              f"閘門錯誤 {len(errors)} 條（累計改 {changed} 題）")

    print(f"\n{label}：{len(chunks)} 批審完，共改 {changed} 題。")
    if flagged:
        print(f"下列 {len(flagged)} 題的 `why_wrong` 自承干擾項其實是對的，逐題看過再收："
              + "、".join(str(qid) for qid in flagged))
    if errors:
        # 審查是照內容改的，改完撞回長度閘很正常；照原本那條局部修正管道收尾。
        print_errors(errors)
        stable, _ = build_sections(chid, quota, [], None, bank=questions)
        blocks = build_blocks(stable, [
            ("本輪要修的題目", patch_fix_message(errors, length_hints(questions, errors))),
        ])
        messages = [{"role": "user", "content": blocks}]
        _, errors, fix_elapsed = patch_loop(
            chid, label, messages, [], questions,
            item_ids, allowed_dco, None, totals, errors, armed=True,
        )
        elapsed_total += fix_elapsed

    print_totals(totals, elapsed_total, errors)
    return 0 if not errors else 1


def run_redo(chid: str, targets: list) -> int:
    """重出點名的題目，讓它跟同 item 的兄弟題考不一樣的事實。

    跟 `run_review` 共用同一條「快取前綴 + 局部替換」管道，差別只在這輪要求整題換考點，
    所以 `stem` 必須改、`lock_fixed_fields` 照舊擋住 `lang` / `cognitive`（綁章節配比）。
    一批最多 REVIEW_CHUNK 題：重出比審查吃 output，一次太多會截斷。
    """
    quota = quota_for(chid, None)
    questions = load_bank(chid)
    if not questions:
        sys.exit(f"{chid} 還沒有題庫，--redo 沒有東西可以重出")
    known = {q.get("id") for q in questions if isinstance(q, dict)}
    ids = [qid for qid, _ in targets]
    missing = [qid for qid in ids if qid not in known]
    if missing:
        sys.exit(f"{chid} 題庫裡沒有這些 id：" + "、".join(missing))

    item_ids = {item["id"] for item in chapter_items(chid)}
    allowed_dco = dco_allowed(chid)
    label = f"{chid} redo"
    print(f"{label}：要重出 {len(ids)} 題")

    stable, _ = build_sections(chid, quota, [], None, bank=questions)
    totals = {"input_tokens": 0, "output_tokens": 0, "cache_read_input_tokens": 0}
    elapsed_total = 0.0
    batches = [targets[start:start + REVIEW_CHUNK] for start in range(0, len(targets), REVIEW_CHUNK)]
    chunks = [[qid for qid, _ in batch] for batch in batches]
    changed = 0
    flagged = []
    errors = []

    for number, (batch, chunk) in enumerate(zip(batches, chunks), 1):
        blocks = build_blocks(stable, [("本輪要重出的題目", redo_message(chid, questions, batch))])
        messages = [{"role": "user", "content": blocks}]
        raw_text, usage, elapsed = stream_call(
            messages, MAX_TOKENS, f"{label} 第 {number}/{len(chunks)} 批"
        )
        save_raw(chid, raw_text)
        accumulate(totals, usage)
        elapsed_total += elapsed
        report(f"{label} 第 {number}/{len(chunks)} 批", usage, elapsed)

        patches, problems = parse_patch(raw_text)
        if problems:
            print(f"{label} 第 {number} 批解析失敗（{problems[0]}），跳過這批")
            continue

        outside = [p.get("id") for p in patches if isinstance(p, dict) and p.get("id") not in chunk]
        if outside:
            print(f"{label} 第 {number} 批交回 {len(outside)} 題不在本批名單內，丟棄："
                  + "、".join(str(qid) for qid in outside[:6]))
            patches = [p for p in patches if isinstance(p, dict) and p.get("id") in chunk]
        skipped = [qid for qid in chunk if qid not in {p.get("id") for p in patches}]
        if skipped:
            print(f"{label} 第 {number} 批沒有交回 {len(skipped)} 題，維持原樣："
                  + "、".join(skipped))
        if not patches:
            continue

        merged, problems = apply_patch(questions, lock_fixed_fields(questions, patches))
        if not problems:
            structural, broken = validate_questions(merged, chid, item_ids, allowed_dco)
            if broken:
                problems = structural
        if problems:
            print(f"{label} 第 {number} 批的輸出有 {len(problems)} 條問題，不寫檔")
            print_errors(problems)
            continue

        questions = merged
        write_bank(chid, [], questions)
        changed += len(patches)
        flagged += flag_self_admitted(patches)
        all_ids = {q.get("id") for q in questions if isinstance(q, dict)}
        errors, _, _ = gate_errors(chid, all_ids, None)
        print(f"{label} 第 {number} 批：重出 {len(patches)} 題，"
              f"閘門錯誤 {len(errors)} 條（累計 {changed} 題）")

    print(f"\n{label}：共重出 {changed} 題。")
    if flagged:
        print(f"下列 {len(flagged)} 題的 `why_wrong` 自承干擾項其實是對的，逐題看過再收："
              + "、".join(str(qid) for qid in flagged))
    if errors:
        print_errors(errors)
        stable, _ = build_sections(chid, quota, [], None, bank=questions)
        blocks = build_blocks(stable, [
            ("本輪要修的題目", patch_fix_message(errors, length_hints(questions, errors))),
        ])
        messages = [{"role": "user", "content": blocks}]
        _, errors, fix_elapsed = patch_loop(
            chid, label, messages, [], questions,
            item_ids, allowed_dco, None, totals, errors, armed=True,
        )
        elapsed_total += fix_elapsed

    print_totals(totals, elapsed_total, errors)
    return 0 if not errors else 1


def select_test(chid: str, part=None) -> int:
    """離線驗挑選邏輯：拿既有題庫當候選池，印「挑哪些、丟哪些、各欄是否剛好相符」。

    配 `--part K/N` 就是模擬實跑：候選池比目標多，挑到剛好；不配就是 --fix-only 的修剪。
    """
    quota = quota_for(chid, part)
    questions = load_bank(chid)
    if not questions:
        sys.exit(f"{chid} 還沒有題庫")

    grid = target_grid(quota)
    all_ids = {q.get("id") for q in questions if isinstance(q, dict)}
    gate_lines, _, counting = gate_errors(chid, all_ids, None)
    counts = error_counts_by_id(chid, gate_lines)
    pool_cells = Counter(
        (q.get("cognitive"), q.get("lang")) for q in questions if isinstance(q, dict)
    )

    print(f"{chid}：候選池 {len(questions)} 題 → 目標 {quota[0]} 題"
          f"（{quota[1]}/{quota[2]}/{quota[3]}，英文 {quota[4]}）")
    print(f"題目級閘門錯誤 {len(gate_lines)} 條、章級統計錯誤 {len(counting)} 條")

    selected, dropped, shortfall = select_questions(questions, grid, error_counts=counts)
    chosen_cells = Counter(
        (q.get("cognitive"), q.get("lang")) for q in selected if isinstance(q, dict)
    )

    print(f"\n{'格':<18}{'候選':>6}{'目標':>6}{'選中':>6}   相符")
    for cell in sorted(set(grid) | set(pool_cells)):
        mark = "相符" if chosen_cells.get(cell, 0) == grid.get(cell, 0) else "不符"
        print(f"{cell[0] + '/' + cell[1]:<18}{pool_cells.get(cell, 0):>6}"
              f"{grid.get(cell, 0):>6}{chosen_cells.get(cell, 0):>6}   {mark}")

    quota_errors = validate_quota(selected, quota)
    print(f"\n挑中 {len(selected)} 題、丟棄 {len(dropped)} 題；"
          f"缺口 {describe_grid(shortfall) or '無'}")
    print("邊際配額：" + ("全部相符" if not quota_errors else "不符"))
    print_errors(quota_errors)

    item_used = Counter(q.get("item") for q in selected if isinstance(q, dict))
    repeated = {item: n for item, n in item_used.items() if n > 1}
    print(f"選中的 item：{len(item_used)} 個不重複"
          f"，其中 {len(repeated)} 個出現 2 題，超過 2 題的有 "
          f"{sum(1 for n in item_used.values() if n > MAX_ITEM_QUESTIONS)} 個")

    print(f"\n丟棄（{len(dropped)} 題，格式 id [閘錯數] item）：")
    for question in dropped:
        qid = question.get("id", "?")
        print(f"  {qid:<28}[{counts.get(qid, 0)}] {question.get('item')}")
    print(f"\n保留（{len(selected)} 題）：")
    print("  " + "、".join(q.get("id", "?") for q in selected))
    return 0


def dry_run(chid: str, part) -> int:
    quota = quota_for(chid, part)
    base_questions = load_bank(chid) if part and part[0] > 1 else []
    used_items = sorted({q.get("item") for q in base_questions if isinstance(q, dict)})
    stable, volatile = build_sections(chid, quota, used_items, part)
    blocks = build_blocks(stable, volatile)

    print(f"{chid}"
          + (f" --part {part[0]}/{part[1]}" if part else "")
          + f"：目標 {quota[0]} 題（{quota[1]}/{quota[2]}/{quota[3]}，英文 {quota[4]}）")
    print(f"{'段名':<14}{'字元':>10}{'估計 tokens':>14}")
    for name, text in stable:
        print(f"{name:<14}{len(text):>10}{est_tokens(text):>14}")
    print("---- cache 斷點：以上整段掛 cache_control: ephemeral ----")
    for name, text in volatile:
        print(f"{name:<14}{len(text):>10}{est_tokens(text):>14}")

    print(f"{'system':<14}{len(SYSTEM):>10}{est_tokens(SYSTEM):>14}")
    cached, live = blocks[0]["text"], blocks[1]["text"]
    print(f"{'快取前綴':<14}{len(cached):>10}{est_tokens(cached):>14}")
    print(f"{'每批重算':<14}{len(live):>10}{est_tokens(live):>14}")
    print(f"{'合計':<14}{len(cached) + len(live):>10}"
          f"{est_tokens(cached) + est_tokens(live):>14}")
    return 0


def smoke() -> int:
    """極小請求，但刻意用正式流程的 content blocks + cache_control payload 形狀。

    純字串 content 驗不到「endpoint 收不收 cache_control」——那正是實跑會整批失敗的地方。
    """
    blocks = [
        {
            "type": "text",
            "text": "這是一段用來驗證 cache_control payload 形狀的固定前綴。",
            "cache_control": {"type": "ephemeral"},
        },
        {"type": "text", "text": "只回覆這兩個字，不要任何其他內容：測試"},
    ]
    text, usage, elapsed = stream_call([{"role": "user", "content": blocks}], 64, "smoke")
    print(f"回應：{text.strip()!r}")
    report("smoke", usage, elapsed)
    print("content blocks + cache_control payload 被接受（未報 400）")
    return 0


def parse_part(value: str):
    match = re.fullmatch(r"(\d+)/(\d+)", value.strip())
    if not match:
        sys.exit(f"--part 格式應為 K/N，收到 {value!r}")
    index, parts = int(match.group(1)), int(match.group(2))
    if parts < 1 or not 1 <= index <= parts:
        sys.exit(f"--part {value} 超出範圍")
    return index, parts


def collect_ids(chid: str, values: list, path: str | None) -> list:
    """把 --ids / --ids-file 收成去重後的 `(完整 id, 指定考點)` 清單（保留給定順序）。

    `--ids-file` 一行一題，`id | 指定考點` 的後半可省略；`--ids` 只收 id（逗號或空白分隔）。
    指定考點不是可有可無的裝飾——見 `redo_message` 的 docstring，不點名就會換湯不換藥。
    """
    raw = []
    for value in values:
        raw.extend((token, "") for token in re.split(r"[,\s]+", value))
    if path:
        text = Path(path).read_text(encoding="utf-8")
        for line in text.splitlines():
            line = line.split("#", 1)[0].strip()
            if not line:
                continue
            token, _, directive = line.partition("|")
            raw.append((token.strip(), directive.strip()))
    targets = []
    seen = set()
    for token, directive in raw:
        token = token.strip()
        if not token:
            continue
        if not token.startswith(f"{chid}."):
            token = f"{chid}.{token}"
        if token in seen:
            continue
        seen.add(token)
        targets.append((token, directive))
    if not targets:
        sys.exit("--redo 要用 --ids 或 --ids-file 指定要重出哪幾題")
    return targets


def main() -> int:
    parser = argparse.ArgumentParser(description="單次 API 直送出題")
    parser.add_argument("chid", nargs="?", help="例：ch08")
    parser.add_argument("--part", help="分批出題，格式 K/N")
    parser.add_argument("--topup", action="store_true",
                        help="補題：既有題庫一題不動，只補到配題表差額（目標格由全章目標減既有）")
    parser.add_argument("--fix-only", nargs="?", const=True, metavar="chNN",
                        help="不出題，只對既有題庫跑「閘 → 局部修正」（整章，不做批次過濾）")
    parser.add_argument("--review", nargs="?", const=True, metavar="chNN",
                        help="第二輪：逐題審內容、改爛干擾項（分批點名，閘門由本腳本收尾）")
    parser.add_argument("--redo", nargs="?", const=True, metavar="chNN",
                        help="重出點名的題目（同 item 兩題撞考點時用），id 由 --ids / --ids-file 給")
    parser.add_argument("--ids", action="append", default=[], metavar="ID[,ID...]",
                        help="--redo 的題目 id，逗號或空白分隔，可重複給；省略 chNN. 前綴會自動補上")
    parser.add_argument("--ids-file", metavar="PATH",
                        help="--redo 的題目 id 清單檔，一行一個（`#` 開頭為註解）")
    parser.add_argument("--dry-run", action="store_true", help="只組 prompt 印大小，不呼叫 API")
    parser.add_argument("--smoke", action="store_true", help="極小串流請求，驗 SSE 解析")
    parser.add_argument("--select-test", action="store_true",
                        help="拿既有題庫當離線測資試挑選，不呼叫 API")
    args = parser.parse_args()

    if args.smoke:
        return smoke()

    # `ch08 --fix-only` 與 `--fix-only ch08` 兩種寫法都收。
    fix_only = bool(args.fix_only)
    review = bool(args.review)
    redo = bool(args.redo)
    chid = (
        args.chid
        or (args.fix_only if isinstance(args.fix_only, str) else None)
        or (args.review if isinstance(args.review, str) else None)
        or (args.redo if isinstance(args.redo, str) else None)
    )
    if not chid:
        parser.error("要指定 chid（或用 --smoke）")
    if not re.fullmatch(r"ch\d{2}", chid):
        sys.exit(f"chid 格式應為 chNN，收到 {chid!r}")
    if chid not in ALLOCATION:
        sys.exit(f"{chid} 不在配題表內")
    if (fix_only or review or redo) and args.part:
        sys.exit("--fix-only / --review / --redo 一次看整章，不能跟 --part 併用")
    if args.topup and (args.part or fix_only or review or redo):
        sys.exit("--topup 是單批接在既有題庫後面，不能跟 --part / --fix-only / --review / --redo 併用")
    if sum([fix_only, review, redo]) > 1:
        sys.exit("--fix-only / --review / --redo 是三輪不同的事，分開跑")
    if (args.ids or args.ids_file) and not redo:
        sys.exit("--ids / --ids-file 只有 --redo 用得到")

    part = parse_part(args.part) if args.part else None
    if args.select_test:
        return select_test(chid, part)
    if args.dry_run:
        return dry_run(chid, part)
    if redo:
        return run_redo(chid, collect_ids(chid, args.ids, args.ids_file))
    if review:
        return run_review(chid)
    if fix_only:
        return run_fix_only(chid)
    return run_chapter(chid, part, topup=args.topup)


if __name__ == "__main__":
    raise SystemExit(main())
