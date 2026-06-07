# HANDOFF — my-site (Cortex)

## 目前狀態（2026-06-07）

網站已上線並完全正常：https://hangsau.github.io/cortex/  
CI/CD 正常運作，push hugo-source 自動部署。  
**Vortex 全頁已重建為 master-detail 連貫架構（commit 8744706，CI 綠、已部署）。**

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
