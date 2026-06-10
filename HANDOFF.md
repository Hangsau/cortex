# HANDOFF — my-site (Cortex)

## 目前狀態（2026-06-10）

網站已上線並完全正常：https://hangsau.github.io/cortex/  
CI/CD 正常運作，push hugo-source 自動部署。  
**ADM 已從 library 遷入 vortex section，用 vortex 設計語言重建（commit 8710ad1，已 push）。**
**週期化（Periodization）呈現層已上線：canonical/periodization → sync → data/periodization → vortex-periodization 期刊式單頁（commit 28cffd3，已 push）。**
**週期化外部文獻擴充 + plain_zh 白話層（2026-06-10，commit 31cea81）**：canonical 加 plain_zh（學員/家長/教練白話）+ 游泳外部文獻（Maglischo 六分區/各距離供能/TID/Hellard 年度結構/青少年 LTAD）。sync 加 `_index.yaml`；vortex-periodization.html §1–§6 渲染 plain_zh + §5 加 4 游泳區塊 + 新增 §7 游泳年度結構 §8 青少年 LTAD（windows of trainability 標 contested）。hugo build 綠。`.vx-pz-plain` 樣式（vortex.css）。

## 已完成

- [x] Hugo 專案骨架（無 theme，完全自訂 layout）
- [x] 首頁書架設計（書本卡片，hover 浮起效果）
- [x] 書庫 section（library/list、library/book、library/chapter）
- [x] 筆記本 section（notebook/list、notebook/single）
- [x] Shortcodes：flashcard、highlight-quote、callout
- [x] CSS 分層：variables / base / layout / bookshelf / library / cscs-chapter / notebook / vortex（adm-* class 併入 vortex.css）
- [x] CSCS 24 章搬入 `library/essentials-of-strength-training/`，九宮格正常
- [x] 閃卡資料（ch01）正常，閃卡模式可用
- [x] GitHub Actions 自動部署完成
- [x] Hugo 串接 Google Sheets CSV（閃卡資料源）
- [x] **ADM 遷入 vortex + 用 vortex 設計語言重建**（2026-06-07，commit 8710ad1）
- [x] **大腦喜歡這樣學上線**（書架 + 技法工具箱，田野筆記風格）
- [x] **週期化呈現層上線**（2026-06-07，commit 28cffd3）— Bompa Periodization 進 vortex，期刊式單頁 6 節，ADM ↔ 週期化雙向互連

## ADM 架構（2026-06-07 從 library 遷入 vortex 重建）

**起因**：ADM 原本是 cortex 書庫的一本書（`content/library/athlete-development-matrix/`，獨立 adm-book/adm-matrix/adm-single layout + adm.css + adm-matrix.js）。使用者要求整合進 vortex section，且「不是搬進去，要為了 vortex 一致性及好讀性做調整」——用 vortex 的 vx- 元件重新表達，不機械搬移。swim-coach 不在範圍（是另一套自動教練系統）。

四個頁面，皆在 `content/vortex/adm/`，layout 在 `layouts/vortex/vortex-adm-*.html`：

| 頁面 | layout | 設計 |
|------|--------|------|
| `_index.md` | vortex-adm-home | masthead + 返回 vortex/ + 三入口 vx-toc |
| `matrix.md` | vortex-adm-matrix | **master-detail**：左 rail 選支柱 → 主面板讀該支柱 4 階段（L2T→T2W）vx-ladder，points 收合；重用 vortex.js + vortex.css |
| `standards.md` | vortex-adm-standards | vx-card 技術標準，泳式 chip 篩選 + 搜尋（self-contained inline JS，讀 data/adm/standards.yaml）|
| `background.md` | vortex-adm-single | vx-article 長文（LTD 模型 / 獎牌台 / 四大支柱 / 八大考量）|

- 資料：`.Site.Data.adm.matrix`（4 支柱 × 4 階段）/ `.Site.Data.adm.standards`（22 筆），由 `tools/sync_vortex.py` 從 canonical 同步，**勿手改 data/adm/**。
- 階段中文名 / 年齡對照寫死在 `vortex-adm-matrix.html` 的 dict。
- ADM 專用樣式併入 `static/css/vortex.css`（`.vx-adm-*`），無獨立 adm.css / adm-matrix.js。
- 首頁 `vortex-home.html` 加了「放大尺度 · 運動員發展」ADM 入口。
- **附帶修手機 bug**：vx-rail 在 `@media (max-width: 820px)` 由 `position: sticky` 改 `static`（原本固定佔掉上半部頁面難瀏覽）。
- **已刪除舊架構**：`content/library/athlete-development-matrix/`（含 appendix-a.md）、`layouts/library/adm-book|adm-matrix|adm-single.html`、`static/css/adm.css`、`static/js/adm-matrix.js`、`static/images/covers/adm-cover.png`；`data/books.yaml` 移除 ADM 書目。appendix-a 長文改由 standards.yaml（canonical 源）重新呈現，退役 prose 頁。

**驗收**：本機 Hugo build 綠（671 頁）+ curl 驗證四頁 200 + 結構標記正確（matrix 4 支柱×4 階段 master-detail、standards 22 卡 + 泳式篩選、home 3 入口）+ 手機 rail position:static 已服務。⚠ 未做 Playwright 截圖（此 session 未載入 playwright MCP）。CI：見下方 push 紀錄。

## 週期化架構（2026-06-07 新增，commit 28cffd3）

**起因**：把 Bompa《Periodization》6th ed. 模組化——不是當書庫收，而是給 ADM 年度計畫一個可操作的理論骨幹（vortex 呈現），並為 swim-coach 自動課表能力預留唯讀資料源。架構同 ADM：「一源兩消費」。

**資料流**：`TheVortexProject/canonical/periodization/{structure,taper,zones}.yaml`（單一真相源，全 public 無 diagnostic 分層，因屬已出版教科書理論）→ `tools/sync_vortex.py` 的 `sync_periodization()`（全量 pass-through，無 diagnostic 剝離）→ `data/periodization/`。

**檔案**：
- `layouts/vortex/vortex-periodization.html` — 期刊式單頁（style 08 Academic Journal，重用 vx- 元件 + 新增 `.vx-pz-*`）。6 節：①三大階段 ②年度計畫類型（4 型 mono/bi/tri/multipeak）③中觀·微觀週期 ④賽前減量達峰 ⑤能量系統強度分區（Table 7.1/11.1/11.2）⑥停練流失安全表。每節附 🔵 游泳應用 callout + 來源溯源。
- `content/vortex/periodization/_index.md`（layout: vortex-periodization）。
- `static/css/vortex.css` 加 `.vx-pz-*` 區塊（不另建檔，沿 ADM 併入慣例）。
- 互連：`vortex-home.html`「放大尺度」群組加 PZ 入口；`vortex-adm-matrix.html` 概覽面板加 → 週期化前向連結（T2C/T2W 一年兩巔峰 = bi-cycle 整合點）；週期化頁 footer 反向連回 ADM matrix。
- 內容修改流程同 ADM：改 canonical（TheVortexProject/canonical/periodization/）後重跑 `sync_vortex.py`，不在此 repo 手改 `data/periodization/`。

**驗收**：本機 Hugo build 綠（673 頁）+ 輸出檢查（6 節 / 6 section-no / 7 表 / 5 swim callout / §2 四型 swim-app 全渲染 / 無 Scratch·nil·ZgotmplZ 殘留）+ 三向互連在 public/ 確認。⚠ 未做 Playwright 截圖。

**下游待續**：Phase 3 swim-coach 唯讀 FTS 引用（vendor/vortex submodule + build_knowledge_index.py 收 periodization）；Phase 4 swim-coach `rules/periodization.yaml` schema 提案（僅交 schema，coaching 參數由 Hang 填，A-zone 不派工）。

## 已完成（CSCS 內容）

### CSCS 筆記 + 閃卡（ch01–ch24 全部完成，2026-04-23）

| 章節 | 筆記 | 閃卡（張數，Google Sheets rows） |
|------|------|----------------------------------|
| ch02 | ✅ | ✅ 52 張，row 54–93 + 134–145 |
| ch03 | ✅ | ✅ 52 張，row 94–133 + 146–157 |
| ch04 | ✅ | ✅ 52 張，row 158–209 |
| ch05 | ✅ | ✅ 52 張，row 210–261 |
| ch06 | ✅ | ✅ 52 張，row 262–313 |
| ch07 | ✅ | ✅ 53 張，row 314–366 |
| ch08 | ✅ | ✅ 53 張，row 367–419 |
| ch09 | ✅ | ✅ 52 張，row 420–471 |
| ch10 | ✅ | ✅ 53 張，row 472–524 |
| ch11 | ✅ | ✅ 52 張，row 525–576 |
| ch12 | ✅ | ✅ 53 張，row 577–629 |
| ch13 | ✅ | ✅ 52 張，row 630–681 |
| ch14 | ✅ | ✅ 52 張，row 682–733 |
| ch15 | ✅ | ✅ 52 張，row 734–785 |
| ch16 | ✅ | ✅ 52 張，row 786–837 |
| ch17–ch24 | ✅ | ✅ 各 52 張，row 838–1253 |

### 大腦喜歡這樣學 / Uncommon Sense Teaching
- [x] 書本封面頁（mnfl-book layout）
- [x] 技法工具箱（mnfl-toolkit layout）—— 20 個技法，5 主題，可篩選可展開
- [x] **Uncommon Sense Teaching 上線**（書封 + 教師手冊 + 策略查找）
  - 田野筆記風格變體，深藍綠（#1B5E69）強調色
  - `data/ust/chapters.yaml`：10 章摘要
  - `data/ust/strategies.yaml`：18 個策略，6 個教學問題分類
  - slug: `uncommon-sense-teaching`，layout 前綴 `ust-`

## Vortex section

TheVortexProject 內容整合進 my-site，作為公開知識展示。路徑 `content/vortex/`，nav 顯示「Vortex」。  
**公開層嚴格非規定式**：只放物理現實、硬體邊界、常見錯誤口令（cue_bad/why/good）、L0–L6 序列、相關 drill；感受語/里程碑訊號收進「教練判讀訊號」診斷子層（`.vx-diag`），不前景化。不搬 Observations / Research。

**來源路徑：** `C:\claudehome\projects\TheVortexProject\`（canonical-first：先改原始 YAML，再 `tools/sync_vortex.py` 同步到 `data/vortex/`）

### 全頁重建為 master-detail 連貫架構（2026-06-07，commit 8744706）

**起因**：舊架構是 9 個各自獨立的分頁式 explorer（technica/bridge/instructional/drills/errors/levels/matrix/tech），點技術動作再跳 drill 會落到完全不同外觀的介面 → 連貫性破裂。使用者要求「整個打掉重建，不要看到原本的影子」，三大需求：① 連貫（不跳頁）② 不攏長（不強迫長捲）③ 轉跳順手。

**新架構（三個 layout 取代九個）：**

| layout | 頁面 | 設計 |
|--------|------|------|
| `vortex-home.html` | `/vortex/` | 學術期刊風：新手引導卡（→ freestyle/#overview）+ 六式編號目次 |
| `vortex-stroke.html` | 每式一頁 | **master-detail 單頁**：常駐左側動作目次（編號 ToC）+ 主面板就地切換 |
| `vortex-database.html` | `/vortex/database/` | 跨泳式資料庫：誤區/機制/練習/L指標四 tab + 泳式篩選 + 文字搜尋 |

**連貫性解法（vortex-stroke 核心）：**
- sticky 左 rail：導覽（概覽）/ 動作分解（動作 1..N）/ 深入（常見誤區 §機制 L水感進程，水感進程僅 free/back/breast/fly 有）
- 主面板只顯示選中項，JS 就地 swap（fade + hash 更新 + popstate 可回上一步，**不重載**）
- drill / 誤區 / 機制 / 水感層級全部用原生 `<details>` 收合，要看才原地展開 → 解決「不攏長」
- **全部 server-side render**（不像舊版 client JSON 注入）；`static/js/vortex.js` 只切 is-active 可見性，`<noscript>` fallback 全展開

**資料聚合（build time）：**
- stroke key 對映：free/back/breast/fly/udk/starts-turns；drill 用全名 → 需 `$drillKey` map
- 誤區/機制/水感層級用 `where ... "stroke" $key` 過濾；drill 用 `name_zh` 對照綁到 moves
- 計數：誤區 76 / 機制 188 / 練習 125 / L指標 43；六式 moves 8/9/11/9/7/7

**已刪除（舊架構）：** layout `vortex-drills/errors/levels/matrix/tech.html`；content `vortex/drills|errors|levels|matrix|technical/_index.md`；`static/css/vortex-home.css`、`static/js/vortex-explorer.js`

**驗收：** 本機 Hugo extended 0.162.1 build 綠（671 頁）+ Playwright 桌面/手機各 5 頁截圖（10 張，0 console error）驗證 hash 路由、rail active 同步、手機 rail→橫向 tab bar、filter chip wrap 全部正確 + CI 綠（run 27080320515）+ 已部署

**已知技術債（非阻斷）：**
- ⚠ layout 用 `.Site.Data.vortex`（Hugo 0.156 起 deprecated，未來版本移除）；專案其他舊 layout 也都觸發同 WARN。未來應統一改 `hugo.Data`。build 目前正常。
- canonical-first：本次只動 my-site 公開層 layout/CSS/JS，**未動 TheVortexProject 原始 YAML 內容**（資料 schema 不變，只換呈現層）；swim-coach submodule 無需 bump（診斷層未變）

---

## 待決定（選做）

- [ ] 章節頁新增「完整重點整理」區塊（九宮格下方補充完整學習內容）
- [ ] 書庫列表樣式優化（`library/list.html`）
- [ ] ADM Appendix B：帕拉游泳分類（若有需要才做；新架構下加一頁 `content/vortex/adm/` + vortex-adm-single layout，原始檔在 `resources/books/Athlete-development-matrix/appendix_b_para_swimming_classification.md`）
- [ ] 截圖驗證 ADM vortex 四頁（matrix master-detail / standards 卡片 / background / home）+ 手機 rail 修正（本次 session 無 playwright MCP，未做）

## Google Sheets 閃卡資料來源

- CSCS Sheet ID：`1-e_n_aCaR-ZCIVODJ4GZ1jPQL8aUkcwCLyxND2e7qhk`
- 欄位：`chapter | question | answer | tag`
- hugo.toml `params.cscsFlashcardsCSV` 指向已發布的 CSV URL
- 新增閃卡：用 `google-docs-mcp` 的 `appendRows` 寫入

## 內容製作流程（已確認）

```
Claude Code 讀 `resources/books/Essentials_of_Strength_Training_and_Conditioning,_Fourth_Edition/` 內的 .md
  → 整理成章節 .md 筆記（供人閱讀的教材）
  → 使用者確認內容
  → Claude Code 從 .md 製作閃卡 → 寫進 Google Sheets
```

## 待辦 — 週期化白話重寫 + 模組化（my-site 呈現端，2026-06-08 規劃）

**plan-check 已完成（Opus）**：`C:\claudehome\projects\TheVortexProject\plans\periodization_integration_plancheck.md`。本檔是「一源兩消費」全鏈整合，my-site 是消費端 1（公開呈現），swim-coach 是消費端 2（唯讀反查）。

**my-site 呈現層已存在**（commit 28cffd3，`vortex-periodization.html` 期刊式單頁），這次不是從零接，是把白話層接進現有頁面。資料流不變：canonical 改 → `tools/sync_vortex.py` pass-through → `data/periodization/` → template。

**接手後 my-site 這端要做的（在 canonical 的 plain_zh / _index.yaml 落地後）**：
1. 等 TheVortexProject 把 `plain_zh` 欄加進 `canonical/periodization/*.yaml` + 新增 `_index.yaml` 概念目錄 → 跑 `sync_vortex.py`（其 `sync_periodization()` 為全量 pass-through，會自動帶進 `data/periodization/`，含新欄位與新檔，**不需改 sync 邏輯**，但要確認 _index.yaml 也被 sync 函式納入）。
2. 改 `layouts/vortex/vortex-periodization.html`：每節把 `plain_zh` 白話顯示出來（與原 Bompa 物理敘述並列或取代，依 plan-check 定案），保留 🔵🟡🟢 確定性標記與 source 溯源。
3. （選做）用 `_index.yaml` 概念目錄做一個「快速查詢 / 概念索引」入口頁或頁內導覽,讓人/AI 一眼掃到所有週期化概念 + 一行白話摘要。
4. 本機 Hugo build 綠 → push（指令見 CLAUDE.md 部署段）→ `gh run list` 確認 CI。

**注意**：白話內容**不在 my-site 手改 `data/periodization/`**,源頭在 canonical;my-site 只做呈現層 template。

## 下一步建議

1. CSCS 所有 24 章閃卡已全部完成（ch01–ch24）
2. 若需要 ADM Appendix B，直接用 adm-single layout 加一頁即可
3. 大腦喜歡這樣學 × 渦流計劃連結：使用者確認 wiki 需求後再設計（可在技法卡新增「在游泳教學中的應用」欄位）
4. **週期化白話重寫**：見上方「待辦 — 週期化白話重寫 + 模組化」,plan-check 已備,等 canonical 端 plain_zh 落地後接 template
