# my-site（Cortex）全站健康檢查報告

> 日期：2026-06-23 · 審查機制：4 路 inventory agent 深讀 → Claude 第一手 grep 驗證 → M3 兩輪最嚴格審查（簽核通過）
> 完整討論逐字稿：`research/m3-health-check-discussion.md`
> 5 維度：位置適切性 · 內容正確性 · 完整性／缺口 · 模組化缺陷 · 改善空間

---

## 0. 總評

整站結構**健康**。內容層普遍有確定性標記與引用、模組化紀律到位（partial/data/JS 共用乾淨）。
本次發現的問題集中在**少數真實內容缺口**（背式教學誤區、udk/出發轉身 drills）與**3 項便宜的模組化／文件瑕疵**（已即刻修畢）。
**重要澄清**：M3 質疑的「canonical↔my-site 同步漂移」經第一手驗證為**無漂移**（逐式條目數完全相同，raw diff 來自 sync 剝診斷層的設計行為）。

---

## 1. 內容覆蓋矩陣（grep 實數，6 泳式）

| 泳式 | 水感招式 | drills | teaching-errors | technical-analysis | bridge |
|------|---------|--------|------------------|---------------------|--------|
| 自由式 free | 8 | 34 | **23** | 26 | ✓ |
| 仰式 back | 9 | 31 | **5 ⚠** | 27 | ✓ |
| 蛙式 breast | 11 | 43 | 12 | 31 | ✓ |
| 蝶式 fly | 9 | 40 | 14 | 35 | ✓ |
| 海豚腳 udk | 7 | **0 ⚠** | 13 | 29 | ✓ |
| 出發轉身 s-t | 7 | **0 ⚠** | 9 | 40 | ✓ |

總量：drills 129 · teaching-errors 76 · technical-analysis 188 · bridge 6/6 齊全。

---

## 2. 五維度發現

### (a) 位置適切性 — 健康
- 週期化頁（上輪已修：dryland/zones 重排、感知橋接 teaser、rail 圖例）位置合理。
- bridge 6 式、ADM、breathing、injuries、psychology、levels 皆置於正確 section。
- psychology 有雙 layout（psychology / psychology-read）共用同份資料 → 兩入口都仍上線，屬「探索 vs 通讀」雙模式，非孤兒。
- Notebook 3 個 `_index.md` 為空殼，屬刻意 scaffold，非錯置。

### (b) 內容正確性 — 大致健康，2 小瑕疵
- 普遍有 🔵🟢🟡🟠🔴 確定性標記與引用；背式 5 條誤區雖少但**每條深**（back.err1 含 Gonjo 2020/2021 + Race Club 三引用 + perception_impact）。
- ⚠ `data/vortex/breast.yaml` 一處 `🟠 Ward` 缺年份 → P2 查源。
- ✅ temperament types 比例（40/10/15/35）**已自我標 🟡＋「約」並註明須回 NYLS 原文核實** → 正確處置，免動。

### (c) 完整性／缺口 — 2 個真缺口
- ⚠⚠ **背式 teaching-errors 僅 5 條**（free 23 / fly 14 / udk 13 / breast 12 / s-t 9 的明顯離群）。canonical 端亦為 5（commit 自記「仰5」）→ 真缺口。
- ⚠ **udk 與 starts-turns 各 0 條 drills**，而連續四式各 31–43 條；兩者在 teaching-errors/technical-analysis 都有覆蓋，唯獨 drills 缺 → M3 判定真缺非刻意。
- Notebook 全空（刻意，不列缺口）。
- CSCS 24 章齊全、mnfl(47 技法)/ust(10 章+24 策略)/temperament(9 維+18 題測驗) 完整無 stub。

### (d) 模組化缺陷 — 乾淨，3 項已修
- ✅ `cscs-chapter.css:104,108` 兩處 `!important` → 改 `.cell.center:hover` specificity（違反 CLAUDE.md「不用 !important」已消除）。
- ✅ `CLAUDE.md` ADM 段 `.Site.Data.*` → `index hugo.Data`（程式碼早已全遷，文件補齊）。
- ✅ `MAP.md` 3 處過時宣稱更正（database/standards 載 vortex.js 且無 inline JS；stroke dict 已抽 `partials/vortex/stroke-dicts.html`；`.Site.Data` 命中 0）。
- 低優先殘留：key→slug 映射 dict（`free→freestyle`）在 stroke/database/drills 各 inline 一份（資料小、方向不同，暫不抽）。

### (e) 改善空間
- `vortex.css` 76KB/2016 行偏大，但按 section 切分（vortex-nav/injuries/techo 等輔助檔），可接受。
- `vortex-water-sense.html` 全 hardcoded、對應 .md body 死碼 → 已自我標註，刻意設計。
- 無孤兒 layout、無 missing data key、partial/JS 共用紀律良好。

---

## 3. 下一步計畫（追加內容查核／蒐集資料）

全部走 **canonical ＋ 三關校正（符合研究＋反問＋反推）**，不在健康檢查輪倉促寫。

| 優先 | 任務 | 目標 | 落點 |
|------|------|------|------|
| **P1** | 背式教學誤區補充 | 5 → **≥14**（cluster 中位，不灌水到 free 的 23） | `canonical/instructional/teaching-errors.yaml` → sync |
| **P1** | udk / starts-turns drills | udk **≥3–5** kick drill；starts-turns **≥5** 蹬台/翻牆 drill | `canonical` drills → sync |
| **P2** | breast Ward 引用 | 查源補年份 | `canonical/technica` breast |
| **P2** | drills 顆粒度複查 | 補完後抽讀，發現空殼再補一輪（M3 強調：非寫進報告就結案） | drills.yaml |

---

## 4. M3 監督紀錄（驗證後採納／駁回）

- ✅ 採納：背式對稱線 ≥14、starts-turns drills ≥5、breast Ward 維持研究任務。
- ✅ 駁回（第一手 grep 證偽）：① M3「同步漂移」疑慮 → 逐式條目數完全相同，無漂移；② M3「背式可能空殼」→ 抽讀證實每條深；③ M3「492 筆」→ 數據中不存在，判定幻覺捨棄。
- M3 第 2 輪簽核通過。
