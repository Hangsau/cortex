# my-site（Cortex）全站健康檢查報告

> 日期：2026-06-23 · 審查機制：4 路 inventory agent 深讀 → Claude 第一手 grep 驗證 → M3 三輪最嚴格審查（簽核通過；第 3 輪為補強內容覆審，見 §5）
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
| 仰式 back | 9 | 31 | **9 ✅**（原 5，補 err6–9） | 27 | ✓ |
| 蛙式 breast | 11 | 43 | 12 | 31 | ✓ |
| 蝶式 fly | 9 | 40 | 14 | 35 | ✓ |
| 海豚腳 udk | 7 | **5 ✅**（原 0） | 13 | 29 | ✓ |
| 出發轉身 s-t | 7 | **5 ✅**（原 0） | 9 | 40 | ✓ |

總量（補強後）：drills 139（+10）· teaching-errors 80（+4）· technical-analysis 188 · bridge 6/6 齊全。

---

## 2. 五維度發現

### (a) 位置適切性 — 健康
- 週期化頁（上輪已修：dryland/zones 重排、感知橋接 teaser、rail 圖例）位置合理。
- bridge 6 式、ADM、breathing、injuries、psychology、levels 皆置於正確 section。
- psychology 有雙 layout（psychology / psychology-read）共用同份資料 → 兩入口都仍上線，屬「探索 vs 通讀」雙模式，非孤兒。
- Notebook 3 個 `_index.md` 為空殼，屬刻意 scaffold，非錯置。

### (b) 內容正確性 — 大致健康，2 小瑕疵
- 普遍有 🔵🟢🟡🟠🔴 確定性標記與引用；背式 5 條誤區雖少但**每條深**（back.err1 含 Gonjo 2020/2021 + Race Club 三引用 + perception_impact）。
- ✅ Ward 引用缺年份 → 已查證補為 **Ward 2018**（碩士論文，U Hawaii Manoa；JSR Vol. 26）。注：原報告誤寫位置在 `breast.yaml`，實際在 `canonical/instructional/technical-analysis.yaml:780` ＋ `canonical/technica/l-indicators.yaml:481,491`（haiku 子代理誤歸因，已 grep 證實並更正）。
- ✅ temperament types 比例（40/10/15/35）**已自我標 🟡＋「約」並註明須回 NYLS 原文核實** → 正確處置，免動。

### (c) 完整性／缺口 — 2 個真缺口（✅ 已補）
- ✅ **背式 teaching-errors 5 → 9**（補 err6 直臂划手 / err7 呼吸無節律 / err8 僵直腿過度矯正 / err9 拱背）。**刻意停在 9 不灌水到 14**：嚴格套「教練主動這樣教」收錄標準後，多數背式「常見錯誤」文獻實為選手習慣（crossover、高頭位）非教練錯口令，硬湊到 14 會違反「不灌水」鐵則。詳見 §4 M3 內容覆審。
- ✅ **udk / starts-turns 各補 5 條 drills**（UDK1–5、ST1–5）。管線原本無此兩 slot → 新增 canonical `Drills/drills_{udk,starts-turns}.yaml`＋`sync_vortex.py DRILL_STROKES`＋layout 分類名「出發轉身」。
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
| ~~P1~~ ✅ | 背式教學誤區補充 | 5 → **9**（停在收錄標準容許上限，不灌水到 14；見 §4） | `canonical/.../teaching-errors.yaml` → synced |
| ~~P1~~ ✅ | udk / starts-turns drills | udk **5** + starts-turns **5**（含管線 slot 新增） | `canonical/Drills/` → synced |
| ~~P2~~ ✅ | Ward 引用 | 已補 **Ward 2018**（technical-analysis.yaml + l-indicators.yaml + 2 份散文 5 處，全式統一） | 已完成 |
| **P2**（未來） | drills 顆粒度複查 | 補完後抽讀，發現空殼再補一輪（M3 強調：非寫進報告就結案） | drills.yaml |

---

## 4. M3 監督紀錄（驗證後採納／駁回）

- ✅ 採納：背式對稱線 ≥14、starts-turns drills ≥5、breast Ward 維持研究任務（已查證為 Ward 2018，位置誤歸因已更正）。
- ✅ 駁回（第一手 grep 證偽）：① M3「同步漂移」疑慮 → 逐式條目數完全相同，無漂移；② M3「背式可能空殼」→ 抽讀證實每條深；③ M3「492 筆」→ 數據中不存在，判定幻覺捨棄。
- M3 第 2 輪簽核通過。

---

## 5. M3 內容覆審（補強內容後第 3 輪，逐項驗證採納／駁回）

補完 back.err6–9 + 10 drills + Ward 後，再送 M3 以反幻覺角色審查（`tools/m3-reviewer-role.md`，每輪前置）。M3 本輪**未捏造任何數字**（護欄生效）。逐項裁決：

**採納（M3 提出且查證成立）**
- ✅ **C1 Ward 引用全集**：M3 要求 grep 全部 Ward 引用 → 查出散文層另有 5 處「Ward 研究」缺年份（`蛙式深度技術分析.md` 3 處、`技術指標_L級對應框架.md` 2 處）→ 已全部補為 Ward 2018，與資料層統一。**這是 M3 真正抓到的 gap。**
- ✅ **C3 scope 對齊**：M3 要求 Ward 引用範圍須與蛙式研究對齊 → 驗證三處引用（technical-analysis 蛙式 late-kick、l-indicators `breast.L4`/`breast.L5`）**全為 stroke:breast**，無跨式 scope creep。

**駁回（第一手驗證／WebSearch 證偽，非嘴硬）**
- ❌ **A2 候選 a–d**（M3 列「漏掉的教練主動誤區」）：a 划手到大腿=正確口令非誤區；b 頭不要動=正確；c 膝蓋踢出水面=已含在 err5；d 永遠六拍=背式大致正確。**最嚴格審查者的最佳候選無一通過收錄標準 → 反向驗證 5→9 停在 9 是把關非偷懶。**
- ❌ **B1-1 UDK3「4×5」格式疑為自創**：WebSearch yourswimlog 原文確認「4×5 max-effort tethered, ~60s rest, 2–3×/週」**逐字相符** → 來源真實，不改。
- ❌ **B1-2/B1-3/B2-1/B2-2 perception_goal 疑為占位**：讀檔證實 UDK4 為「在最佳頻率時，每一下都感覺腳背確實壓到水」、UDK5 為 udk-specific 蹬牆 race-tempo、旗下/流線皆具體 → M3 因無 repo 存取的推測，證偽。

**邊界透明標註（M3 A3/A4 合理但已自我揭露）**
- ⚠ **err6 直臂划水**、**err9 拱背**：M3 質疑「是否教練主動教 vs 選手自然犯錯」。兩條本就是**收錄標準的邊界案例**，內容已自帶 🟠 標記＋明文揭露爭議（err9 `misconception` 直書「爭議點在口令本身容易被做歪」、err6 `correct_concept` 註明「直臂常是旋轉不對稱的徵兆而非根因」）。判定：以「主動下的口令導致系統性偏差」收錄成立，但保留邊界標註，不偽裝成鐵案。

M3 第 3 輪：核心三問（A grep 證據鏈 / B drills 書目＋perception_goal / C Ward 書目＋scope）已逐項回應完畢。
