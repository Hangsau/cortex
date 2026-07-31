"""找出「正文已對帳修正，但閃卡還在講舊說法」的落差。

卡片與知識單位是同一個 yaml 裡的兩個平行區塊，彼此沒有 id 關聯——
`cards` 只有 q/a/tag，沒有 locator、沒有 numbers。所以對帳工序修掉一條
item 之後，沒有任何機制保證對應的卡片跟著改。ch01 的「軸心骨約 80 塊」
是靠人記得去 cards 裡撈同一句才一起修掉的。

這支用數字當探針：卡片裡出現的數字，如果整章的 items 都沒有，那多半
就是被修掉後遺留在卡片上的舊值。數字是最好的探針，因為對帳最常改的
就是數字，而且數字比句子好比對。

輸出是複查清單，不是硬閘——卡片本來就可能有 items 沒有的補充數字。
有命中就去看一眼，確認是遺留還是本來就只在卡片上。

用法：
  python tools/cscs_card_sync.py            # 全部章節
  python tools/cscs_card_sync.py ch01 ch02  # 只看指定章節
"""
import collections
import re
import sys
from pathlib import Path

import yaml

DATA = Path(__file__).resolve().parent.parent / "data" / "cscs"

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# 純序數／編號類數字（第 1 章、圖 2.3、i01）不是知識內容，比對它們只會製造雜訊
NUM = re.compile(r"\d+(?:[.,]\d+)*")

# 生成當時整句崩掉的卡片（ch21/23/24 尤其多），字面上看是「稐前期」「察態硬為疑說慢碟」
# 這種無意義字串。最有效的探針是全語料字頻：崩壞會拉進一堆別處不出現的怪字，
# 所以一張卡若含 3 個以上「全語料只出現 1-2 次」的漢字，多半是壞的。
# 門檻設 3 是因為 1-2 個罕用字很可能只是正常的專有名詞（瑜珈、牙釉質、雞皮疙瘩）。
CJK = re.compile("[一-鿿]")
RARE_MAX = 2
RARE_HITS = 3


def digits(text):
    """取出數字並去掉千分位逗號，讓『23,600』與『23600』視為同一個數。"""
    return {m.group(0).replace(",", "") for m in NUM.finditer(text)}


def all_card_text():
    """字頻基準一律取全 24 章，不受 argv 篩選影響。"""
    for p in sorted(DATA.glob("ch*.yaml")):
        ch = yaml.safe_load(p.read_text(encoding="utf-8"))
        for card in ch.get("cards") or []:
            yield p.stem, f"{card.get('q', '')} {card.get('a', '')}"


def item_text(topic_list):
    parts = []
    for topic in topic_list:
        for item in topic["items"]:
            parts.append(item.get("q") or "")
            parts.extend(item.get("a") or [])
            parts.append(item.get("detail") or "")
            for n in item.get("numbers") or []:
                parts.append(f"{n.get('v')} {n.get('unit')} {n.get('of')}")
    return "\n".join(str(p) for p in parts)


def main():
    only = set(sys.argv[1:])
    chapters = sorted(p.stem for p in DATA.glob("ch*.yaml"))
    if only:
        chapters = [c for c in chapters if c in only]

    total_cards = 0
    flagged = []
    cards = []

    for ch_id in chapters:
        ch = yaml.safe_load((DATA / f"{ch_id}.yaml").read_text(encoding="utf-8"))
        pool = digits(item_text(ch["topics"]))
        for card in ch.get("cards") or []:
            total_cards += 1
            text = f"{card.get('q', '')} {card.get('a', '')}"
            cards.append((ch_id, text))
            orphans = sorted(digits(text) - pool)
            if orphans:
                flagged.append((ch_id, card.get("q", ""), orphans))

    # 字頻要用全語料算，只掃單章會把該章的正常專有名詞誤判成罕見字
    freq = collections.Counter()
    for _, text in all_card_text():
        freq.update(CJK.findall(text))
    rare = {c for c, n in freq.items() if n <= RARE_MAX}

    garbled = []
    for ch_id, text in cards:
        hits = sorted(set(CJK.findall(text)) & rare)
        if len(hits) >= RARE_HITS:
            garbled.append((ch_id, "".join(hits), text))

    print(f"卡片 {total_cards} 張，其中 {len(flagged)} 張帶有正文查不到的數字\n")
    cur = None
    for ch_id, q, orphans in flagged:
        if ch_id != cur:
            print(f"--- {ch_id} ---")
            cur = ch_id
        print(f"  {', '.join(orphans):<24} {q[:44]}")

    if flagged:
        print("\n逐張看過：是對帳時漏改的舊值，還是卡片本來就有的補充數字。")

    if garbled:
        print(f"\n=== 疑似生成崩壞 {len(garbled)} 張 ===")
        cur = None
        for ch_id, hits, text in garbled:
            if ch_id != cur:
                n = sum(1 for g in garbled if g[0] == ch_id)
                print(f"--- {ch_id}（{n} 張）---")
                cur = ch_id
            print(f"  {hits:<14} {text[:62]}")
        print("\n門檻是『含 3 個以上全語料罕見字』，會誤報正常專有名詞，逐張看過再改。")


if __name__ == "__main__":
    main()
