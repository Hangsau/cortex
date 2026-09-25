#!/usr/bin/env python3
"""產生 next/data/library.json：書房（Vortex 以外）六個系列的統一資料索引。

只依賴 PyYAML 與標準函式庫。輸出 UTF-8、ensure_ascii=False、緊密分隔。
"""
import json
import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
OUT_PATH = ROOT / "next" / "data" / "library.json"
DATA_DIR = ROOT / "data"
CONTENT_DIR = ROOT / "content"


# ---------- YAML 與 Markdown front matter 讀取 ----------

class StrLoader(yaml.SafeLoader):
    """把 yes/no/on/off 當字串，避免 traits.yaml 的 key 被解析成布林。"""
    pass


for _ch in "yYnNoO":
    StrLoader.yaml_implicit_resolvers[_ch] = [
        r for r in StrLoader.yaml_implicit_resolvers.get(_ch, [])
        if r[0] != "tag:yaml.org,2002:bool"
    ]


# 讀本 books.json 的 chapter group 是英文代碼，網站顯示用中文篇名
PART_ZH = {
    "foundations": "基礎：動作的共同語言",
    "tissues": "組織：骨、軟骨、肌腱與肌肉",
    "upper": "上肢",
    "axial": "中軸：脊柱與軀幹",
    "lower": "下肢",
    "applied": "應用：固定與置換",
    "gait": "行走與跑步",
}


def load_yaml(path):
    return yaml.load(path.read_text(encoding="utf-8"), Loader=StrLoader)


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def load_front(path):
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.DOTALL)
    if not m:
        return {}
    return yaml.load(m.group(1), Loader=StrLoader)


# ---------- 文字清理輔助 ----------

def clean(text, n=60):
    if not text:
        return ""
    s = re.sub(r"\*\*", "", text)
    s = re.sub(r"\s+", " ", s).strip()
    return s[:n]


def _chapter_desc(slug, ch_num):
    md = CONTENT_DIR / "library" / slug / f"ch{ch_num:02d}" / "index.md"
    if not md.exists():
        return ""
    fm = load_front(md)
    return fm.get("description", "") or ""


# ---------- 系列建構 ----------

def build_kinesiology():
    books = load_json(DATA_DIR / "reading" / "books.json")
    neu = books["neumann"]
    fm = load_front(CONTENT_DIR / "library" / "kinesiology" / "_index.md")
    chapters = []
    for ch in neu["chapters"]:
        nn = ch["number"]
        chapters.append({
            "n": nn,
            "id": ch["id"],
            "title": ch["title"],
            "desc": _chapter_desc("kinesiology", nn),
            "path": ch["path"],
            "part": PART_ZH.get(ch.get("group", "") or "", ch.get("group", "") or ""),
        })
    return {
        "id": "kinesiology",
        "group": "strength",
        "group_name": "肌力與動作",
        "title": neu["title"],
        "title_en": neu.get("title_en", ""),
        "author": neu.get("author", ""),
        "edition": neu.get("edition", "") or "",
        "lead": fm.get("description", "") or "",
        "path": "library/kinesiology/",
        "chapters_label": "章",
        "chapters": chapters,
        "entries_label": "",
        "entries": [],
        "tools": [
            {"title": "跨書主題對照",
             "desc": "同一個主題在兩本書怎麼講",
             "path": "library/kinesiology/topics/"},
        ],
    }


def build_basic_biomechanics():
    books = load_json(DATA_DIR / "reading" / "books.json")
    nor = books["nordin"]
    fm = load_front(CONTENT_DIR / "library" / "basic-biomechanics" / "_index.md")
    chapters = []
    for ch in nor["chapters"]:
        nn = ch["number"]
        chapters.append({
            "n": nn,
            "id": ch["id"],
            "title": ch["title"],
            "desc": _chapter_desc("basic-biomechanics", nn),
            "path": ch["path"],
            "part": PART_ZH.get(ch.get("group", "") or "", ch.get("group", "") or ""),
        })
    tools = []
    topics_md = CONTENT_DIR / "library" / "basic-biomechanics" / "topics" / "index.md"
    if topics_md.exists():
        tools.append({
            "title": "跨書主題對照",
            "desc": "同一個主題在兩本書怎麼講",
            "path": "library/basic-biomechanics/topics/",
        })
    return {
        "id": "basic-biomechanics",
        "group": "strength",
        "group_name": "肌力與動作",
        "title": nor["title"],
        "title_en": nor.get("title_en", ""),
        "author": nor.get("author", ""),
        "edition": nor.get("edition", "") or "",
        "lead": fm.get("description", "") or "",
        "path": "library/basic-biomechanics/",
        "chapters_label": "章",
        "chapters": chapters,
        "entries_label": "",
        "entries": [],
        "tools": tools,
    }


def build_cscs():
    chapters = []
    total_items = 0
    for n in range(1, 25):
        d = load_yaml(DATA_DIR / "cscs" / f"ch{n:02d}.yaml")
        topics = d.get("topics", [])
        total_items += sum(len(t.get("items", [])) for t in topics)
        first3 = [t.get("title", "") for t in topics[:3]]
        desc = "、".join(first3)
        if len(topics) > 3:
            desc += "等"
        chapters.append({
            "n": n,
            "id": f"ch{n:02d}",
            "title": d.get("title", ""),
            "desc": desc,
            "path": f"library/essentials-of-strength-training/ch{n:02d}/",
            "part": "",
        })
    concepts = load_yaml(DATA_DIR / "cscs" / "_concepts.yaml")
    concept_count = len(concepts)
    lead = (
        f"NSCA 肌力與體能專家（CSCS）認證的指定教材。"
        f"24 章拆成 {total_items:,} 條知識單位，"
        f"每條都有答案、深度說明與原書出處。"
    )
    return {
        "id": "cscs",
        "group": "strength",
        "group_name": "肌力與動作",
        "title": "肌力與體能訓練精要",
        "title_en": "Essentials of Strength Training and Conditioning",
        "author": "Haff, Triplett",
        "edition": "第 4 版",
        "lead": lead,
        "path": "library/essentials-of-strength-training/",
        "chapters_label": "章",
        "chapters": chapters,
        "entries_label": "",
        "entries": [],
        "tools": [
            {"title": "概念索引",
             "desc": f"{concept_count} 條概念，跨章節照概念讀",
             "path": "library/essentials-of-strength-training/concepts/"},
        ],
    }


def build_mnfl():
    d = load_yaml(DATA_DIR / "mnfl" / "techniques.yaml")
    entries = []
    for theme in d["themes"]:
        for tech in theme.get("techniques", []):
            entries.append({
                "id": tech["id"],
                "title": tech.get("name", ""),
                "desc": clean(tech.get("essence", "")),
                "path": f"library/mind-for-numbers/{tech['id']}/",
                "group": theme["id"],
                "group_name": theme.get("name", ""),
            })
    tech_total = len(entries)
    theme_total = len(d["themes"])
    lead = (
        f"給學習者的方法書。{tech_total} 個讓學習更有效的技法，"
        f"依{theme_total}個主題分組，每個技法都寫了原理與做法。"
    )
    return {
        "id": "mnfl",
        "group": "learning",
        "group_name": "學習與教學",
        "title": "大腦喜歡這樣學",
        "title_en": "A Mind for Numbers",
        "author": "芭芭拉・歐克莉（Barbara Oakley）",
        "edition": "",
        "lead": lead,
        "path": "library/mind-for-numbers/",
        "chapters_label": "",
        "chapters": [],
        "entries_label": "技法",
        "entries": entries,
        "tools": [],
    }


def build_ust():
    chap = load_yaml(DATA_DIR / "ust" / "chapters.yaml")
    chapters = []
    for ch in chap["chapters"]:
        subtitle = (ch.get("subtitle") or "").strip()
        if not subtitle:
            subtitle = clean(ch.get("claim", ""), 60)
        chapters.append({
            "n": ch["num"],
            "id": f"ust.ch{ch['num']:02d}",
            "title": ch.get("title", ""),
            "desc": subtitle,
            "path": f"library/uncommon-sense-teaching/ch{ch['num']:02d}/",
            "part": "",
        })
    strat = load_yaml(DATA_DIR / "ust" / "strategies.yaml")
    cat_by_id = {c["id"]: c.get("name", "") for c in strat.get("categories", [])}
    entries = []
    for s in strat["strategies"]:
        cat = s.get("category", "")
        entries.append({
            "id": s["id"],
            "title": s.get("name", ""),
            "desc": clean(s.get("essence", "")),
            "path": f"library/uncommon-sense-teaching/strategies/{s['id']}/",
            "group": cat,
            "group_name": cat_by_id.get(cat, ""),
        })
    chap_total = len(chap["chapters"])
    strat_total = len(strat["strategies"])
    lead = (
        f"給教學者的版本。{chap_total} 章教學手冊與 {strat_total} 個課堂策略，"
        f"從大腦怎麼學推到課堂怎麼教。"
    )
    return {
        "id": "ust",
        "group": "learning",
        "group_name": "學習與教學",
        "title": "大腦喜歡這樣學・強效教學版",
        "title_en": "Uncommon Sense Teaching",
        "author": "Barbara Oakley、Beth Rogowsky、Terrence Sejnowski",
        "edition": "",
        "lead": lead,
        "path": "library/uncommon-sense-teaching/",
        "chapters_label": "章",
        "chapters": chapters,
        "entries_label": "策略",
        "entries": entries,
        "tools": [],
    }


def build_temperament():
    traits = load_yaml(DATA_DIR / "temperament" / "traits.yaml")
    entries = []
    for dim in traits["dimensions"]:
        entries.append({
            "id": dim["key"],
            "title": dim.get("name_zh", ""),
            "desc": dim.get("definition", ""),
            "path": f"temperament/traits/{dim['key']}/",
            "group": "traits",
            "group_name": "九個維度",
        })
    chapters = [
        {"n": 1, "id": "temp.traits", "title": "九個維度",
         "desc": "描述孩子的九把尺", "path": "temperament/traits/", "part": ""},
        {"n": 2, "id": "temp.types", "title": "三型傾向",
         "desc": "好養型、慢熱型、磨難型，以及無法歸類的多數",
         "path": "temperament/types/", "part": ""},
        {"n": 3, "id": "temp.frameworks", "title": "現代框架",
         "desc": "五種當代氣質框架怎麼看同一件事",
         "path": "temperament/frameworks/", "part": ""},
        {"n": 4, "id": "temp.fit", "title": "適配度應用",
         "desc": "不同氣質需要什麼樣的環境配合",
         "path": "temperament/fit/", "part": ""},
        {"n": 5, "id": "temp.critique", "title": "批判與邊界",
         "desc": "這套理論能說什麼、不能說什麼",
         "path": "temperament/critique/", "part": ""},
    ]
    return {
        "id": "temperament",
        "group": "temperament",
        "group_name": "氣質",
        "title": "兒童九種氣質",
        "title_en": "Temperament · Goodness of Fit",
        "author": "Thomas & Chess 等",
        "edition": "",
        "lead": (
            "氣質沒有好壞，決定孩子發展的是氣質與環境要求之間的適配度。"
            "九個維度、三型傾向、五種現代框架，以及怎麼配合。"
        ),
        "path": "temperament/",
        "chapters_label": "篇",
        "chapters": chapters,
        "entries_label": "維度",
        "entries": entries,
        "tools": [],
    }


def main():
    series = [
        build_kinesiology(),
        build_basic_biomechanics(),
        build_cscs(),
        build_mnfl(),
        build_ust(),
        build_temperament(),
    ]
    out = {"series": series}
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(out, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    parts = [f"{s['id']}: {len(s['chapters'])}/{len(s['entries'])}" for s in series]
    print("library.json 寫入完成：" + ", ".join(parts))


if __name__ == "__main__":
    main()
