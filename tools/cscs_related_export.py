#!/usr/bin/env python3
"""把一章的現有 related 連結攤平成編號清單，產出「不需讀檔」的減法 prompt。

codex 的 Windows sandbox 已無法 spawn 任何子行程（連 Get-Content 都被拒），
所以它讀不到 yaml 也跑不了驗收。這支把判斷所需的全部資訊內嵌進 prompt，
codex 只要輸出要刪掉的編號，由 cscs_related_apply.py 機械套用。

用法：
    python tools/cscs_related_export.py ch18
"""
import argparse
import io
import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CSCS = ROOT / "data" / "cscs"

MAX_PER_ITEM = 3
MAX_INNER = 8


def all_titles() -> dict:
    out = {}
    for path in sorted(CSCS.glob("ch??.yaml")):
        data = yaml.safe_load(io.open(path, encoding="utf-8").read())
        for topic in data["topics"]:
            for it in topic["items"]:
                out[it["id"]] = it["q"]
    return out


def chapter_titles() -> dict:
    out = {}
    for path in sorted(CSCS.glob("ch??.yaml")):
        md = ROOT / "content" / "library" / "essentials-of-strength-training" / path.stem / "_index.md"
        m = re.search(r'^title:\s*"?(.+?)"?\s*$', io.open(md, encoding="utf-8").read(), re.M) if md.exists() else None
        out[path.stem] = m.group(1) if m else ""
    return out


def build(chid: str):
    data = yaml.safe_load(io.open(CSCS / f"{chid}.yaml", encoding="utf-8").read())
    titles = all_titles()
    chtitles = chapter_titles()

    rows = []
    for topic in data["topics"]:
        for it in topic["items"]:
            for target in it.get("related") or []:
                rows.append({"src": it["id"], "src_q": it["q"], "dst": target, "dst_q": titles.get(target, "?")})

    inner = sum(1 for r in rows if r["dst"].startswith(chid + "."))
    lines = []
    cur = None
    for n, r in enumerate(rows, 1):
        if r["src"] != cur:
            cur = r["src"]
            lines.append(f"\n[{r['src']}] {r['src_q']}")
        mark = "（章內）" if r["dst"].startswith(chid + ".") else ""
        lines.append(f"  {n}. -> {r['dst']}{mark} | {r['dst_q']}")

    ch_list = "\n".join(
        f"- {c} {t}" for c, t in sorted(chtitles.items()) if c != chid
    )

    prompt = f"""# 任務：CSCS 第 {int(chid[2:])} 章（{chtitles.get(chid, '')}）延伸連結減法

## 執行模式

**非互動、純文字輸出。不要讀任何檔案、不要執行任何指令、不要修改任何檔案。**
你的本機 sandbox 目前無法啟動子行程，所以判斷所需的全部資料都已內嵌在下面。
你唯一要交付的是一份**要刪掉的編號清單**，由呼叫者機械套用。
不要輸出計畫、不要問問題，直接給結果。

## 背景

這是一個 CSCS 教材知識庫，全書 24 章、1557 條 item（原子知識單位）。每條 item 可以有
`related` 延伸連結指向別條 item，在網站上呈現成 wiki 式的跳轉。

前幾輪的派工文件犯了一個錯——下了「每條 item 至少 N 個連結」的數量下限，結果模型為了
湊滿數字，生出「標題有共同字就連過去」的假連結。**這一輪要修的就是這種東西。**

**這次沒有任何數量下限。**做完之後總連結數比現在少很多，是預期中的正確結果
（已完成的 ch06 / ch12 / ch17 / ch10 各砍 27–58%）。某條 item 一條連結都不剩是可接受的
正確答案，留空好過湊一個。

## 判準

**只有一條：讀者正在讀 A 這條，會不會想跳去讀 B 那條？**答不出具體理由就刪。

要刪的典型樣態（都是前幾章抓到的實際案例）：

- **標題有共同字就連**——兩邊講的其實不是同一件事
- **平行主題並列而非依賴**——例：阻力訓練的休息期 -> 有氧訓練課之間的恢復；
  兩章各自在講自己領域的同名概念，讀者不會跨過去
- **同 topic 內相鄰兩條互指**——讀者已經在同一頁的上下文裡，跳過去是導覽上的空操作
- **泛泛連到某章的總論條目**，但來源條目根本沒有依賴那個總論
- **同一個目標 id 被大量不同來源條目重複引用**，而那些來源之間其實沒有共同需求
- **方向相反**（預防 ≠ 應變、定義 ≠ 測量程序、安排 ≠ 辨識）

要保留的：來源條目真的有下游依賴、讀者讀完會需要那條才能接著理解或執行。
密依賴的章對（技術章↔生物力學章、測驗原則↔測試管理）本來就會連得多，那是真的，照實保留。

## 硬上限（只能靠刪達成）

1. 每條 item 最多 {MAX_PER_ITEM} 個連結（目前有超標的請一定刪到符合）
2. 章內連結（標「（章內）」者）最多 {MAX_INNER} 條，目前有 {inner} 條
3. 不得新增連結——這一輪只刪不加

## 全書章名（判斷跨章關係用）

{ch_list}

## 本章現有的 {len(rows)} 條連結

格式：`編號. -> 目標 id | 目標的標題句`，同一條 item 底下的連結歸在該 item 的標題句之下。
{chr(10).join(lines)}

## 輸出格式（嚴格遵守）

先輸出一行 `DELETE:`，接著一行以逗號分隔的編號（要刪掉的），例如：

```
DELETE:
3,7,8,11,15,16,22
```

編號之後另起一段，用繁體中文寫：

1. 刪了幾條、佔原本 {len(rows)} 條的百分比
2. **至少 12 個實例的刪除理由**（寫「編號 N：因為……」，說清楚為什麼那條答不出
   「讀者為什麼會想跳過去」）
3. 你判斷「雖然看起來多、但每一條都站得住」而刻意保留的章對，以及理由
"""
    return prompt, rows


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("chid")
    args = ap.parse_args()
    if not re.fullmatch(r"ch\d{2}", args.chid):
        sys.exit(f"chid 格式應為 chNN，收到 {args.chid!r}")

    prompt, rows = build(args.chid)
    dest = ROOT / ".prompts" / f"{args.chid}-related-v4.md"
    dest.parent.mkdir(exist_ok=True)
    io.open(dest, "w", encoding="utf-8", newline="\n").write(prompt)
    idx = ROOT / ".prompts" / f"{args.chid}-links.json"
    io.open(idx, "w", encoding="utf-8", newline="\n").write(json.dumps(rows, ensure_ascii=False, indent=1))
    print(f"{dest}  ({len(prompt)} chars, {len(rows)} links)")
    print(f"{idx}")


if __name__ == "__main__":
    main()
