#!/usr/bin/env python3
"""產生某一章的 `related` 減法輪派工 prompt，寫到 .prompts/chNN-related-v3.md。

第四輪的設計原則（第三輪學到的）：只給上限、不給任何數量下限。
下限只能靠加達成，必然誘發湊數；上限只能靠刪或改達成，不會。

用法：
    python tools/cscs_related_prompt.py ch12 [--note "本章特別注意：..."]
"""
import argparse
import collections
import io
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CSCS = ROOT / "data" / "cscs"

MAX_PER_ITEM = 3
MAX_TARGET_SHARE = 35
MAX_INNER = 8


def load(chid: str) -> dict:
    return yaml.safe_load(io.open(CSCS / f"{chid}.yaml", encoding="utf-8").read())


def items_of(data: dict):
    return [it for t in data["topics"] for it in t["items"]]


def stats(chid: str, data: dict) -> dict:
    inner = 0
    cross = collections.Counter()
    dist = collections.Counter()
    for it in items_of(data):
        rel = it.get("related") or []
        dist[len(rel)] += 1
        for target in rel:
            if target.split(".")[0] == chid:
                inner += 1
            else:
                cross[target.split(".")[0]] += 1
    total = inner + sum(cross.values())
    top = cross.most_common(1)
    return {
        "items": len(items_of(data)),
        "total": total,
        "inner": inner,
        "cross": cross,
        "dist": dict(sorted(dist.items())),
        "top_ch": top[0][0] if top else "",
        "top_n": top[0][1] if top else 0,
        "top_share": round(top[0][1] / sum(cross.values()) * 100, 1) if top else 0.0,
    }


def chapter_titles() -> dict:
    out = {}
    for path in sorted(CSCS.glob("ch??.yaml")):
        chid = path.stem
        md = ROOT / "content" / "library" / "essentials-of-strength-training" / chid / "_index.md"
        title = ""
        if md.exists():
            m = re.search(r'^title:\s*"?(.+?)"?\s*$', io.open(md, encoding="utf-8").read(), re.M)
            if m:
                title = m.group(1)
        out[chid] = title
    return out


def build(chid: str, note: str) -> str:
    data = load(chid)
    s = stats(chid, data)
    titles = chapter_titles()
    chnum = int(chid[2:])

    spread = "  ".join(
        f"{ch}:{n}({round(n / sum(s['cross'].values()) * 100)}%)" for ch, n in s["cross"].most_common()
    )
    dist_txt = " / ".join(f"{k} 個連結：{v} 條 item" for k, v in s["dist"].items())

    flat = len(s["dist"]) == 1
    if flat:
        k = next(iter(s["dist"]))
        diagnosis = (
            f"**{s['items']} 條 item 沒有一條例外、全部剛好 {k} 個連結（`{s['dist']}`）。**\n"
            f"這不可能是有機結果——這是舊派工文件寫的「每條至少 {k} 個」被逐條踩滿。"
            f"換句話說，這章的連結有相當比例不是因為關係存在才連，是因為數字要湊滿才連。"
        )
    else:
        diagnosis = (
            f"每條 item 的連結數分佈：{dist_txt}。"
            "分佈本身看起來還算有機，但仍要逐條過一次減法。"
        )

    concentration = ""
    if s["top_share"] >= MAX_TARGET_SHARE:
        concentration = (
            f"\n**另外，`{s['top_ch']}` 佔了跨章連結的 {s['top_share']}%（{s['top_n']} 條），"
            f"超過 {MAX_TARGET_SHARE}% 上限。**這通常代表「反正跟那章有關就連過去」。"
            f"注意：打散的方法是**刪掉其中湊數的那些**，不是去別章補新的來稀釋分母。"
            f"若逐條檢查後發現 `{s['top_ch']}` 那些連結每一條都站得住（設施章↔法律章這種密依賴是真的存在的），"
            f"就照實保留並在回報裡說明理由——上限量錯了東西的時候，以逐條判斷為準。\n"
        )

    inner_line = ""
    if s["inner"] > MAX_INNER:
        inner_line = (
            f"\n**章內連結現在有 {s['inner']} 條，上限是 {MAX_INNER} 條。**"
            "同一 topic 內相鄰兩條 item 互指是最常見的湊數型態——讀者本來就在同一頁的上下文裡，"
            "跳過去是導覽上的空操作，一律刪。\n"
        )

    return f"""# 任務：CSCS 第 {chnum} 章 `related` 減法輪（刪掉湊數連結）

## 執行模式

**非互動模式。沒有人會回覆你，輸出計畫等確認等於這次派工完全失敗。**
不要先提計畫、不要問「有需要調整的地方嗎」。讀完本文件就直接動手改檔案。

## 工作範圍（硬邊界）

工作根目錄：`C:\\claudehome`

**唯一允許修改的檔案**：`projects\\my-site\\data\\cscs\\{chid}.yaml`

**只允許改每個 item 的 `related:` 欄位。** `id` / `q` / `a` / `detail` / `terms` / `numbers` / `concepts` / `locator` 一個字都不要動，topic 順序與 topic id 不要動，`cards:` 區塊一個位元都不要動。呼叫者會跑欄位凍結 diff，動到其他欄位就整批退回。

**YAML 縮排照原檔慣例**：`related:` 底下每一項是 4 個空白 + `- `，跟 `terms:` / `concepts:` 同層，不要改成 6 空白。

**禁止**：修改任何其他檔案；執行任何會改變 working tree 的 git 指令（`commit` / `add` / `stash` / `checkout --` / `reset` / `clean` / `pull` / `push` / `rebase` 全部禁止）。改完就停，由呼叫者驗收與 commit。

## 最重要的一條：這次沒有數量目標

**這份任務沒有「總連結至少幾條」「落點至少幾章」的下限，一條都沒有。**

前幾輪的派工文件下了數量下限，結果是模型為了湊數字生出「標題有共同字就連」的連結（實例：ch02「橫切面」↔ ch15「正手握」互指，理由只有「旋前發生在橫切面」這種字面關聯）。**這一輪要修的就是這種東西，所以不要再製造它。**

**判準只有一條：讀者正在讀 A，會不會想跳去讀 B？**答不出具體理由就刪掉。
**做完之後總連結數比現在少很多，是這次預期中的正確結果。**前六章的實測是各砍 30–45%。

**不要為了「補平」而去別章找新連結。**這一輪的動作以刪為主；只有在刪完之後、你確實看到某條 item 有真實的下游依賴卻沒連到，才補，且要在回報裡說明那條依賴是什麼。

## {chid} 現況（{titles.get(chid, "")}）

- {s['items']} 條 item、{s['total']} 條連結（跨章 {s['total'] - s['inner']}、章內 {s['inner']}）
- 跨章落點：`{spread}`

{diagnosis}
{concentration}{inner_line}
## 要做的事：逐條過一次減法

**{s['items']} 條 item 一條都不要跳過。**對每一條現有連結問：「讀者讀到這條 item 時，為什麼會想跳去那一條？」

說不出具體理由的直接刪掉。特別檢查以下型態（這些都是前幾輪抓到的實際案例）：

- **標題有共同字就連的**——兩邊講的其實不是同一件事
- **同 topic 內相鄰兩條互指**——讀者已經在同一頁，跳過去是空操作
- **泛泛連到某章的總論條目**，但來源條目根本沒有依賴那個總論
- **把通則問題侷限成特定訓練模式**（例：一般督導責任 → 只講增強式訓練的監督）
- **同一個目標 id 被大量不同來源條目重複引用**，而那些來源之間其實沒有共同需求
- **方向相反的連結**（預防 ≠ 應變、定義 ≠ 測量程序、安排 ≠ 辨識）

## 上限（硬條件，只能靠刪或改達成，不能靠加）

1. **每條 item 最多 {MAX_PER_ITEM} 個 `related`**。
2. **單一目標章不得超過跨章連結總數的 {MAX_TARGET_SHARE}%**（除非你逐條檢查後判定那是真密依賴，並在回報說明）。
3. **章內連結最多 {MAX_INNER} 條**，且必須是真依賴。
4. **0 斷鏈、0 自指**（`related` 不得指向自己的 id）。
5. **某條 item 真的找不到值得連的目標，`related` 就留空**——留空好過湊一個。前六章各出現 1–21 條空白 item，那是設計奏效的證據，不是缺漏。

## 可用的目標 id

`projects\\my-site\\.prompts\\all-item-ids.md` 列出全書 24 章的 `id | 標題句`。**要新增或改連結時先查這份**，字串必須一模一樣，多一個字少一個字都算斷鏈。

## 驗收（你自己要跑到綠才算完成）

```
cd C:\\claudehome\\projects\\my-site
python tools/cscs_check.py {chid}
```

輸出的「錯誤」一條都不准留。YAML 必須能 `yaml.safe_load` 通過。

## 完成後回報

1. 總連結數（跟原本 {s['total']} 條比，減了幾條、幾 %）、跨章／章內各幾條
2. 連到哪些章、各幾條、最大單章佔跨章的百分比
3. **刪掉了哪幾條、各自的理由**（至少列 8 個實例，寫清楚為什麼那條說不出「讀者為什麼會想跳過去」）
4. 幾條 item 的 `related` 是空的
5. `python tools/cscs_check.py {chid}` 的最後輸出原文
{note and chr(10) + "## 本章特別注意" + chr(10) * 2 + note + chr(10)}"""


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("chid")
    ap.add_argument("--note", default="")
    args = ap.parse_args()

    if not re.fullmatch(r"ch\d{2}", args.chid):
        sys.exit(f"chid 格式應為 chNN，收到 {args.chid!r}")

    out = build(args.chid, args.note)
    dest = ROOT / ".prompts" / f"{args.chid}-related-v3.md"
    dest.parent.mkdir(exist_ok=True)
    io.open(dest, "w", encoding="utf-8", newline="\n").write(out)
    print(f"{dest}  ({len(out)} chars)")


if __name__ == "__main__":
    main()
