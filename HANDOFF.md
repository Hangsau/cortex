# HANDOFF — my-site (Cortex)

## 目前狀態（2026-06-06）

網站已上線並完全正常：https://hangsau.github.io/cortex/  
CI/CD 正常運作，push hugo-source 自動部署。

## 已完成

- [x] Hugo 專案骨架（無 theme，完全自訂 layout）
- [x] 首頁書架設計（書本卡片，hover 浮起效果）
- [x] 書庫 section（library/list、library/book、library/chapter）
- [x] 筆記本 section（notebook/list、notebook/single）
- [x] Shortcodes：flashcard、highlight-quote、callout
- [x] CSS 分層：variables / base / layout / bookshelf / library / cscs-chapter / notebook / adm
- [x] CSCS 24 章搬入 `library/essentials-of-strength-training/`，九宮格正常
- [x] 閃卡資料（ch01）正常，閃卡模式可用
- [x] GitHub Actions 自動部署完成
- [x] Hugo 串接 Google Sheets CSV（閃卡資料源）
- [x] **ADM 完整上線**（書架 + 背景頁 + 互動矩陣 + 附錄 A）
- [x] **大腦喜歡這樣學上線**（書架 + 技法工具箱，田野筆記風格）

## ADM 架構（新增，本次對話完成）

四個頁面，皆在 `content/library/athlete-development-matrix/`：

| 頁面 | layout | 說明 |
|------|--------|------|
| `_index.md` | adm-book | 書本封面 + 導航卡（icon/description 從 front matter 讀） |
| `background.md` | adm-single | Part 1–3 全文：LTD 模型、四大支柱、八大考量 |
| `matrix.md` | adm-matrix | 互動矩陣：4 支柱 × 4 階段，篩選 + 點擊展開 |
| `appendix-a.md` | adm-single | 四泳式划水 + 起跳 + 轉身（6 種）技術基準 |

矩陣內容在 `data/adm/matrix.yaml`，要修改直接編輯這個檔案即可。

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

## Vortex section（2026-06-05 新增）

TheVortexProject 內容整合進 my-site，作為公開知識展示。

**架構決策：**
- 路徑：`content/vortex/`，nav 顯示「Vortex」
- 不搬：Observations（不公開）、Research（文獻密度高，之後再說）
- 風格：07 田野筆記（Caveat + Crimson Text，`#FDFBF3` 底）
- 定位：物理錨點 → 多角度感知描述 → 失敗辨識 → 自測方法

**已完成：**
- [x] W1 骨架：`content/vortex/` + 3 層子目錄（technica/bridge/instructional）
- [x] Layouts：vortex-home.html / list.html / single.html
- [x] CSS：vortex.css（田野筆記風格，層色編碼）
- [x] Landing page：雙入口（5 泳式卡片 + 3 主題卡片），確定性 badge 說明

**已完成：**
- [x] W2 同步腳本（`tools/sync_vortex.py`）：dry-run + 狀態檔 `vortex_sync_state.json`，下次更新直接跑即可
- [x] W3 Technica（6篇）+ Bridge（6篇）全部上線
- [x] W4 Instructional（12篇）全部上線
- [x] Nav double-cortex bug 修復（改用 `{{ .URL | absURL }}`）

**技術組件互動探索器（2026-06-05，全 6 頁完成）：**

泳式頁從「文章連結清單」升級為可點開的技術組件探索器。**公開層嚴格非規定式**：只呈現物理現實、硬體邊界（感知 vs 解剖限制）、常見錯誤口令（cue_bad/why/good）、L0–L6 序列位置、相關 drill；**不放任何「該有什麼感覺／感覺錯了是什麼樣／學生說 X＝到位／教練觸發」等感知判讀語**（那些只留在 TheVortexProject 的研究/診斷層）。

- [x] 6 個探索器 data 全部建立（`data/vortex/`）：
  - `free.yaml`（自由式 8 組件）/ `back.yaml`（仰式 9）/ `breast.yaml`（蛙式 11）/ `fly.yaml`（蝶式 9）
  - `udk.yaml`（水下蝶腳 7，從 FLY m10-16 拆出獨立頁）
  - `starts-turns.yaml`（出發與轉身 7，從 Bridge 出發轉身感知橋接.md 抽公開層）
- [x] 6 個 `_index.md` 全部接上 `explorer_data` front matter
- [x] `layouts/vortex/vortex-stroke.html`：重寫為非規定式 layout，schema = `premise` + `moves[]`（n/name/one/l/physical/boundary/cue_bad/cue_why/cue_good/drills/lnote），可選欄位以 `{{ with }}`/`{{ if }}` 守衛
- [x] **舊檔已刪**：`data/vortex/bridge_freestyle.yaml`（舊規定式 schema）、`static/vortex-preview.html`（額外站外預覽頁）
- [x] **內容三關校正**：8 條沒過清單全部處理（A1/A2/B1/B3/C1/C2 已修；B2/D1 查證為真保留）；修正同步回 TheVortexProject 原始資料（v⁴→v³、9.5% 加 hip-driven 註記、PMID 24290609 歸因 Arellano→Atkison et al. 2014、蛙式 29% 出水改待查 🔴）

**設計原型 SPA 移植上站（2026-06-05）：**

泳式頁從平鋪的 `vxe-tile` 磚牆改為設計原型的「感知地圖」SPA（左側欄 + 總覽/welcome/動作細節三視圖），即原本在 `vortex-preview.html` 設計的格式。

- [x] `layouts/vortex/vortex-stroke.html`：重寫為 SPA，把 6 式 data 透過 `jsonify` 內嵌成 `STROKES`，`INIT_STROKE` = 當前頁 `explorer_data`，進站落在當前泳式；丟掉「深入閱讀 · 完整文章」連結區（文章仍可由 Vortex 首頁「依主題瀏覽」進入）
- [x] `static/js/vortex-explorer.js`：重寫為 showOverview/selectStroke/openMove/renderRailMoves，讀內嵌 STROKES（移除 done/ready 門檻，全部已上線）
- [x] `static/css/vortex.css`：舊 `vxe-*` 區塊（765–994 行）整段替換為 `vxs-*` scoped 樣式（便利貼便條、Caveat 標題 + SVG 波浪底線、full-bleed 突破 800px main-content、側欄 sticky `top:56px`）
- [x] 本機 Hugo extended build 通過（671 頁無錯）、CI 綠、已部署

**待完成：**
- [ ] （選做）水下蝶腳/出發轉身入口已有獨立頁，可考慮首頁加直達卡片
- [ ] ⚠ `layouts/vortex/vortex-home.html` 仍有規定式文案（「你游泳時應該感覺到什麼」「找到屬於你自己的感覺」、bridge 層描述「每個技術點你應該感覺到什麼——失敗和成功的感覺各是什麼」），違反「感知不可規定」原則，待改成非規定式措辭

**Drill how_to 操作步驟 + chip 可點連結（2026-06-06，commit ff69013）：**

全六式一次做完（不分 pilot）。Canonical-first：先寫進 TheVortexProject 原始 YAML，再同步到 my-site 公開層、swim-coach 診斷層（submodule）。

- [x] 125 個 drill 全部補入 `how_to` 操作步驟（從來源書 *There's a Drill for That* 抽，每條過三關校正）；canonical commit `a4ddee1`（5 個 `Drills/drills_*.yaml`）
- [x] 感知欄位改框成「要去感覺什麼」（`perception_goal`）；移除 `failure_signal`（什麼是錯的），`success_signal` 併入或省略——公開層不放成功 vs 失敗對照
- [x] `tools/sync_vortex.py` 新增 `sync_drills`：合併 5 式 canonical 為單一 `data/vortex/drills.yaml`（125 筆，block-style）
- [x] `layouts/vortex/vortex-drills.html`：渲染 how_to + 要去感覺什麼；每張卡加 `#drill-<id>` 錨點 + hash-jump JS（白名單 regex 防注入）
- [x] drill chip 從純文字改為可點連結：`vortex-stroke.html` build 時做 `name_zh→id` 對照塞進 `DRILL_IDS`，`vortex-explorer.js` 的 `drillChip()` 對得上就連到 drill DB 卡片、對不上退回純文字 chip；`free.yaml` 修破折號變體讓名稱 100% 對得上（103 chip refs，0 unmatched）
- [x] swim-coach `vendor/vortex` submodule bump 到 `a4ddee1`（commit 9a1fed3）
- [x] 本機 Hugo extended 0.159.1 build 通過、CI 綠、已部署

**Vortex 來源路徑：** `C:\claudehome\projects\TheVortexProject\`

---

## 待決定（選做）

- [ ] 章節頁新增「完整重點整理」區塊（九宮格下方補充完整學習內容）
- [ ] 書庫列表樣式優化（`library/list.html`）
- [ ] ADM Appendix B：帕拉游泳分類（若有需要才做，原始檔在 `resources/books/Athlete-development-matrix/appendix_b_para_swimming_classification.md`）

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

## 下一步建議

1. CSCS 所有 24 章閃卡已全部完成（ch01–ch24）
2. 若需要 ADM Appendix B，直接用 adm-single layout 加一頁即可
3. 大腦喜歡這樣學 × 渦流計劃連結：使用者確認 wiki 需求後再設計（可在技法卡新增「在游泳教學中的應用」欄位）
