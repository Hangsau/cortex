"""跨系列知識連結：逐對判斷（Claude 撰寫，2026-09-26）。

讀 next/crosslinks/candidates.jsonl，每批 40 對送 MiniMax-M3（直呼 API，穩定前綴掛 cache_control），
判斷兩個單位是否「講同一個具體現象／結構／機制，讀了一邊能實質幫助理解另一邊」。
只有判定 link=true 的才會上線；主題相近但不同一件事的一律捨棄（不為了連而連）。

結果逐批追加到 next/crosslinks/judgments.jsonl（可中斷續跑：已判過的對不重送）。
遇到 HTTP 429／額度字樣就停止並 exit 2，不重試空轉。

用法：python -X utf8 tools/crosslink_judge.py [--batch 40] [--limit N]
"""
import argparse
import json
import re
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "next" / "crosslinks"
ENDPOINT = "https://api.minimax.io/anthropic/v1/messages"
MODEL = "MiniMax-M3"
TOKEN = (Path.home() / ".minimax-token").read_text(encoding="utf-8").strip()

RULES = """你是運動科學教科書的編輯，負責判斷兩段內容之間該不該放「相關閱讀」連結。

每一對有 A 與 B，各附標題與摘要（摘要是原文開頭，可能截斷）。來源有：
- 肌動學（Neumann《肌肉骨骼系統肌動學》中文讀本的小節）
- 生物力學（Nordin《肌肉骨骼系統基礎生物力學》中文讀本的小節）
- CSCS（《肌力與體能訓練精要》的知識單位）
- Vortex（游泳教學研究：技術分析、運動傷害、動作圖譜、呼吸、週期化）

link=true 的條件（兩項都要成立）：
1. 兩邊講的是**同一個具體的**現象、結構、機制、動作或數量（例如都在講「肩胛骨上旋的肌肉力偶」「肌腱的應力—應變曲線」「步態站立期的髖外展力矩」）。
2. 讀 A 的人點進 B，能得到實質的補充：另一個角度的解釋、機制、實務應用、數據或對照。

以下一律 link=false：
- 只是同一個身體部位或同一大主題（都跟「肩」有關、都在講「肌肉」），但講的是不同的事。
- 只有共用一兩個名詞。
- 摘要資訊不足以確定是同一件事——不確定就是 false，不要猜。

rel（link=true 時必填，擇一）：
- 同一概念：兩邊解釋同一個概念，角度或深淺不同
- 機制：一邊是現象或應用，另一邊解釋背後的解剖／力學／生理機制
- 應用：一邊是原理，另一邊是訓練、教學或游泳上的應用
- 數據：一邊提供對方主張的量化數據或測量方法

why（link=true 時必填）：一句繁體中文，30 字以內，說明「讀 A 的人為什麼該看 B」，要具體，不要空話。

輸出格式：只輸出 JSON Lines，每對一行，依輸入順序，不要其他文字、不要 code fence：
{"i": 序號, "link": true, "rel": "機制", "why": "…"}
{"i": 序號, "link": false}
"""


def call(user_text):
    payload = {
        "model": MODEL,
        "max_tokens": 8000,
        "system": [{"type": "text", "text": RULES, "cache_control": {"type": "ephemeral"}}],
        "messages": [{"role": "user", "content": user_text}],
    }
    headers = {"x-api-key": TOKEN, "anthropic-version": "2023-06-01", "content-type": "application/json"}
    r = requests.post(ENDPOINT, headers=headers, json=payload, timeout=(30, 600))
    if r.status_code == 429 or re.search(r"limit|quota|額度", r.text[:500], re.I) and r.status_code >= 400:
        print(f"額度或限流：HTTP {r.status_code} {r.text[:300]}", file=sys.stderr)
        sys.exit(2)
    if r.status_code != 200:
        raise RuntimeError(f"HTTP {r.status_code}: {r.text[:500]}")
    data = r.json()
    return "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text"), data.get("usage", {})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--batch", type=int, default=40)
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()
    units = json.loads((DIR / "units.json").read_text(encoding="utf-8"))
    cands = [json.loads(l) for l in (DIR / "candidates.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]
    out = DIR / "judgments.jsonl"
    done = set()
    if out.exists():
        for l in out.read_text(encoding="utf-8").splitlines():
            if l.strip():
                j = json.loads(l)
                done.add((j["a"], j["b"]))
    todo = [c for c in cands if (c["a"], c["b"]) not in done]
    if args.limit:
        todo = todo[: args.limit]
    print(f"候選 {len(cands)}，已判 {len(done)}，本次 {len(todo)}", flush=True)

    def desc(uid):
        u = units[uid]
        return f"{u['title']}｜{u['summary']}"

    for s in range(0, len(todo), args.batch):
        chunk = todo[s:s + args.batch]
        lines = [f"[{i}] A：{desc(c['a'])}\n    B：{desc(c['b'])}" for i, c in enumerate(chunk)]
        for attempt in range(3):
            try:
                text, usage = call("\n".join(lines))
                break
            except (requests.RequestException, RuntimeError) as e:
                print(f"第 {attempt + 1} 次失敗：{e}", file=sys.stderr)
                time.sleep(10)
        else:
            sys.exit("連續失敗，停止")
        got = {}
        for l in text.splitlines():
            l = l.strip().strip("`")
            if not l.startswith("{"):
                continue
            try:
                j = json.loads(l)
                got[int(j["i"])] = j
            except (ValueError, KeyError):
                continue
        with out.open("a", encoding="utf-8") as f:
            for i, c in enumerate(chunk):
                j = got.get(i)
                if j is None:
                    continue  # 沒回的下次重判
                rec = {"a": c["a"], "b": c["b"], "score": c["score"], "link": bool(j.get("link"))}
                if rec["link"]:
                    rec["rel"] = j.get("rel", "")
                    rec["why"] = j.get("why", "")
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")
        yes = sum(1 for j in got.values() if j.get("link"))
        print(f"批 {s // args.batch + 1}：回 {len(got)}/{len(chunk)}，連 {yes}｜usage {usage}", flush=True)


if __name__ == "__main__":
    main()
