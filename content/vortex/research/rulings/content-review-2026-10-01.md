---
title: "內容審查 2026-10-01 — 矛盾與明顯錯誤修正追蹤"
slug: "content-review-2026-10-01"
layer: "research"
layer_name: "審查與裁決紀錄"
research_status: "審查紀錄"
draft: false
---

> 起因：2026-10-01 全面讀過 canonical 的 teaching-errors（104）、technical-analysis（222）、
> l-indicators、water-sense-levels，找出 59 處矛盾／錯誤。驗證器 0 ERROR 看不到這類問題。
> 範圍外（未讀）：psychology、health、movement、problems、Drills、散文 .md、periodization 細讀。
>
> **使用者授權（2026-10-01）**：全部修；可撞配額，撞了就接回來，不可遺失資料；
> 內容判斷題走「MiniMax-M3 ＋ Sonnet ＋ Opus（本 session）」三方辯論再裁決。
>
> **工作協議（斷線接手看這段）**
> 1. A 類（事實可查證／算術／筆誤）→ 自己查證後直接修，不辯論。
> 2. B／C／D 類需判斷者 → 依泳式分批做辯論卷宗 `plans/內容審查_2026-10-01/卷宗_<批>.md`，
>    MiniMax（`claude-m3-lite -p`，前置 `C:/claudehome/tools/m3-reviewer-role.md`）與
>    Sonnet（Agent model=sonnet）各自獨立作答寫檔 `立場_<批>_<模型>.md`，分歧項再一輪反駁，
>    Opus 裁決寫 `裁決_<批>.md`，然後改 canonical。
> 3. **每批改完立刻**：`python tools/validate.py` → `python tools/build_knowledge_map.py`
>    → `python tools/build_indices.py` → commit → `git push origin master`，並更新下表狀態。
> 4. 撞 limit：停派、把進行中檔案 commit、在本檔「斷點」寫剩餘清單，用 shotclock 排 reset+10 分恢復。
> 5. 線上分支是 `master`。

## 斷點

（無——2026-10-02 全部 59 條處理完畢）

## 清單

狀態：⬜ 未處理／🗣 辯論中／✅ 已修（附 commit）／⏸ 裁決為不改（附理由）

### A. 明顯錯誤（直接修）

| # | 條目 | 問題 | 狀態 |
|---|---|---|---|
| 1 | breast.tech.6 | 「肘露出水面回臂」寫成進階技術；蛙式規則要求除轉身前／終點最後一划外肘在水下 | ✅ A批 |
| 2 | starts-turns.tech.29 | 「仰式位置（背面朝上）」應為腹面朝上 | ✅ A批 |
| 3 | back.err5 | 「自由式下踢靠膕繩肌屈膝」→ 下踢是伸膝；「方向完全相反」與 back.tech.15/30 衝突 | ✅ A批 |
| 4 | back.tech.10、breast.tech.4 | 「前臂正對推進方向時升力係數最大」→ 平板正對水流是阻力係數最大 | ✅ A批 |
| 6 | breast.tech.15 | 「每多一度髖旋轉推進 +5%」數量級不可能 | ✅ A批 |
| 7 | breast.tech.10、breast.err2、breast.tech.11 | r=0.35、p<0.08 寫成「顯著」 | ✅ A批 |
| 8 | free.tech.34 | 「阻力與偏離程度平方成正比」無此物理；Cd 實測值標 🔵 | ✅ A批 |
| 9 | starts-turns.err9 | 「力量(42%)×方向(r=0.76)×流線」假公式 | ✅ A批 |
| 10 | free.tech.10 | 「前鋸肌是唯一全程工作」→ Pink 1991 是前鋸肌＋肩胛下肌 | ✅ A批 |
| 12 | udk.tech.5 | 兩相都寫「上踢→下踢過渡」 | ✅ A批 |
| 39b | fly.tech.11 | Mason 1992 排序「依次 1.9、2.3」反了 | ✅ A批 |
| 41b | fly.tech.24 | cross_ref 指 fly.tech.34（EVF）指錯 | ✅ A批 |
| 49 | starts-turns.tech.4、err10 vs tech.43 | 同一組量測 0.12 vs 0.15 秒（5.56−5.41=0.15） | ✅ A批 |
| 53 | free.tech.8、free.L5.lift-phase-duration | 0.34 秒對到 120 與 100 划／分兩種划頻 | ✅ A批 |
| 55 | water-sense-levels back.L5 | 仍以 Gonjo 2020 撐「抬高回臂側肩」 | ✅ A批 |
| 56 | l-indicators back.L4.roll-stability | 引 González-Ravé 2025（出發轉身綜述）撐旋轉縮小 | ✅ A批 |
| 57 | l-indicators breast.L3.recovery-drag | 「收腿阻力 r=0.35」→ r=0.35 是膝外旋與游速 | ✅ A批 |
| 59 | free.tech.27、starts-turns.tech.42、free.L3.evf | Race Club 量測標 🟢，與 udk.tech.9 判 🟠 不一致 | ✅ A批 |

### B. 互相矛盾／需判斷（三方辯論）

**自由式批**（✅ 2026-10-02，裁決見 `內容審查_2026-10-01/裁決_自由式.md`）：11（菁英 EMG 推論旋轉發動者）、13（SR–SL 負相關必然？＋ L4 5% 門檻）、14（L5「SR 與速度負相關消失」）、
15（hip-driven 六拍 vs 兩拍）、16（轉髖：被動跟隨 vs hip-snap；旋轉發動者兩版）、17（指縫 10°/3.2mm vs 5–10mm、機制）、
18（S 形兩種解釋）、19（手臂 85–90% vs 腿 30%）、20（拳頭游指標方向與單位）、21（L4 肩旋轉縮小＝失守？）、
22（踝柔軟度 vs 力量優先，跨 free/back/breast/fly 殘留）、23（free.err14 角度先動成績後動）、54（彎→直動能四倍；辛烷值類比）

**仰式批**（✅ 2026-10-02，見 `裁決_仰式.md`）：24（back.err7 vs back.err14 呼吸節律）、25（back.err4 肩壓低 vs back.tech.6）、26（back.tech.7 無 hip-driven vs back.err4）、
27（back.tech.12 推至大腿 vs back.err12）、28（肘角 100–120 vs 屈曲 90–100）、29（上踢佔比 70–90 vs 70–80）、
58（back.tech.24 Psycharakis & Sanders 是否自由式研究）

**蛙式批**（✅ 2026-10-02，見 `裁決_蛙式.md`）：5（髖內旋 vs 外旋，tech.10/11/13/15/21/36、L3）、30（Barrowman wave/flat；預設風格）、31（手腳能否重疊）、
32（收腿快慢）、33（breast.err8 換氣時機證據）、34（外划寬度）、35（tech.27 疲勞穩定性殘留＋🟢未查證）、36（滑行長短）

**蝶式批**（✅ 2026-10-02，見 `裁決_蝶式.md`）：37（入水拇指 45° vs 掌平行）、38（入水停頓 vs 立刻外划）、39a（哪一踢最強）、40（tech.15 S 形）、41a（tech.25–27 優先序殘留）

**水下／出發轉身批**（✅ 2026-10-02，見 `裁決_水下出發轉身.md`）：42（水下比水面快？）、43（起踢時機）、44（上踢主推進？）、45（踢幅 0.2–0.3 身長 vs 輪廓線內）、
46（出發深度 0.9m vs 0.4–0.6m）、47（仰式出發角度）、48（出發膝角）、50（UDK 速度數字情境）、
另併入：starts-turns.tech.6 vs err1 起跳角度通則

**框架批**（✅ 2026-10-02）：51（SWOLF 級距：兩檔不一致＋跨泳式蛙式最低）、52（兩側換氣 L2 vs L3）

## 批次紀錄

（每批完成後追加：批名、commit、改了哪些 ID、裁決摘要）

- **A 批（2026-10-02）**：18 條全修。查證：SW 7.3 肘部條文（補登到 src.world-aquatics-2023-swimming-technical-rules notes）、
  Pink 1991 為前鋸肌＋肩胛下肌兩條全程活化（且是正常肩研究，未量疲勞）。#5 髖內外旋與 #29 上踢佔比留給蛙式／仰式辯論批；
  #7 只改「顯著」措辭，內外旋方向待 #5。validate 0 ERROR／133 WARN（原 135）。

- **自由式批（2026-10-02）**：題 11、13–23、54 全改。第一手查證 Marinho 2010（PMID 20147761）重寫指縫兩條；
  拳頭游指標全框架統一為百分比（L3 縮小中、L4 ≤15%、L5 <10%，🔵 框架設計）；踝柔軟度優先論在 free/back/breast/fly
  與 L 框架全部改成「先評估、孰先依個別」。validate 0 ERROR／133 WARN。
- **仰式批（2026-10-02）**：題 24–29、58 全改。back.err7／err14 改成可並存（吐氣綁拍 vs 不規定吸氣次數）；
  back.tech.6 由 🔵 降 🟠；Psycharakis & Sanders 2008（MSSE 40:2129）經查證為 200 m 自由式，back.tech.24 降為 🔴 假說。
- **蛙式批（2026-10-02）**：題 5、30–36 全改。#5 兩方相反，Opus 外部查證採「髖內旋」（屈髖屈膝下內旋使腳落在膝外側），
  tech.10／11／27、err4、L3 改正；Barrowman 依 1990 SI 報導改為 wave；tech.27 疲勞序列降 🔴。
- **蝶式批（2026-10-02）**：題 37–41a 全改。入水「動量轉換」機制刪除（降 🟠）；兩踢強弱改為「資料判不出」；
  fly.err1 不再宣稱直線後推（與自家三相結構矛盾）；解剖能力序號全刪。
- **水下／出發轉身批（2026-10-02）**：題 42–48、50、34x 全改。MiniMax 在題 50 臆測受試族群、題 48 臆測肌群互補，均未採用；
  起踢時機刪「減速量與時機無關」（違反 v² 阻力）；出發深度與 UDK 深度分階段；膝角 90–120 不再當出發通則。
- **框架批（2026-10-02）**：#51 l-indicators 通用級距改成與 water-sense-levels 自由式一致並註明「各泳式不同」。
  **更正初版報告**：原稱「蛙式 SWOLF 最低不合理」是錯的——SWOLF 計划數，蛙式每週期一划，划數本就少，菁英兩式 SWOLF 相近。
  #52 呼吸 L2「兩側換得到氣」與水感 L3「兩側對稱覺察」是同一條線的前後兩步，加註說明，不改分級。

## 收尾

- 三方辯論：MiniMax 五批、Sonnet 五批、Opus 立場與裁決（自由式另有獨立立場檔，其餘四批立場寫在裁決檔）。
- 不採用的辯手意見都寫在裁決檔（含 MiniMax 臆測族群／肌群、四倍動能、外旋方向等）。
- 仍待查證（沒有寫進公開層當事實）：Nicol 2022 是否含蛙式疲勞腳速資料；Strzała 2013 原文；Staunton 2025 書目；
  Mason 1992 第二踢與上划是否合併；各 UDK 速度數字的量測段。