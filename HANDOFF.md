# HANDOFF — my-site (Cortex)

## 目前狀態（2026-06-05）

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

**技術組件 × 感知狀態 互動探索器（2026-06-05）：**
- [x] 自由式 pilot：泳式頁從「文章連結清單」升級為可點開探索器
  - `data/vortex/bridge_freestyle.yaml`：8 組件（入水/捕水EVF/拉水/旋轉/踢水/頭部/划距/連動鏈）+ 疲勞順序 + 三型速查 + 指導語速查
  - 每組件展開：長什麼樣 / 怎麼引出來 / 該有什麼感覺 / 感覺錯了是什麼樣 /（解剖邊界）/（外部確認）/ 相關練習 deep-link
  - `layouts/vortex/vortex-stroke.html`：`{{ with explorer_data }}` 包覆，無 data 的泳式自動跳過
  - `static/js/vortex-explorer.js`：磚塊 toggle（一次開一個 + smooth scroll）
  - `vortex-drills.html`：加 URL 參數白名單讀取，支援 `?stroke=&category=` deep-link
  - vortex.css 追加 `vxe-*` 樣式區塊
- [ ] **下一步（待用戶看過 pilot 後）**：複製到其餘 5 泳式 — 從各自 Bridge .md 抽 `bridge_<stroke>.yaml` + 加 `explorer_data` front matter
  - 來源：`TheVortexProject/Bridge/<泳式>感知橋接.md`
  - 已知資料缺口：頭部→breathing 全庫僅 1 個 drill（Fr1），偏薄但有效

**待完成：**
- [ ] （選做）水下蝶腳文章也可出現在蝶式視圖之外，考慮在首頁加「水下蝶腳」入口


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
