# MAP — my-site (Cortex)

> 結構地圖，給冷啟動讀者（人/LLM）。格式與維護流程見 `C:\claudehome\CODEBASE_MAP_METHODOLOGY.md`。
> 行為規範見 `CLAUDE.md`；進度/待辦見 `HANDOFF.md`。
>
> `last_verified: 2026-07-10`

---

## 1. 一句話定位 + 技術棧

個人知識網站，**Hugo 靜態站**（無 theme，全自訂 layout）。  
deploy：push `hugo-source` branch → GitHub Actions `hugo --minify` build `./public` → GitHub Pages（`https://hangsau.github.io/cortex/`）。  
本機預覽：`hugo`（cwd = 此 repo）。push 指令見 `CLAUDE.md` 部署段（Windows credential 繞過）。

---

## 2. 「要做 X → 去讀 Y」決策索引

| 你要做的事 | 動這裡 |
|-----------|--------|
| 改全站顏色/字級 | `static/css/variables.css`（只放 CSS 變數） |
| 改排版結構（nav/main/footer） | `static/css/layout.css` |
| 加新書（一般風格） | `content/library/<slug>/_index.md` + `data/books.yaml` + 封面圖 |
| 加自訂風格書（如 mnfl/ust） | 見 `CLAUDE.md`「自訂風格書籍設計模式」 |
| 改 vortex 公開內容（泳式/誤區/drill/L 階段） | **不在此 repo！** 改 `TheVortexProject/canonical/` → 跑 `tools/sync_vortex.py` |
| 改 vortex 呈現（版面/互動/CSS） | `layouts/vortex/*.html` + `static/css/vortex.css`（可直接改） |
| 改 ADM / 週期化內容 | 同 vortex：canonical-synced，改 canonical 再 sync |
| 改氣質 section 內容 | `data/temperament/*.yaml`（my-site 自有，**可直接改**） |
| 加 CSCS 閃卡 | Google Sheets（非本地檔），見 `CLAUDE.md`；build time 抓 CSV |
| 改 vortex 互動行為 | `static/js/vortex.js`（單檔依 DOM hook 分派：`.vx-doc` 文件流 scrollspy / legacy 面板切換 / `[data-vx-db]` drills / `[data-vx-find]` database / `[data-vx-adm-std]` ADM 標準 / `.vx-read` 進度條） |

---

## 3. 檔案地圖

### 進入點 / 骨架
- `layouts/_default/baseof.html`（21 行）— 只管 HTML 骨架，**`.main-content` 有 800px 上限**（見踩雷 §4）
- `layouts/partials/nav.html` / `footer.html` — 全站 nav/footer
- `layouts/index.html`（49 行）— 首頁書架

### Section → layout 路由
| content 目錄 | layout | 說明 |
|-------------|--------|------|
| `content/library/` | `layouts/library/{list,book,chapter,single}.html` | 書庫；CSCS 章節頁在 `chapter.html`（229 行，2026-07-31 從 3×3 九宮格改成黏性目次文件版型 + 遮答自測；模式切換／scrollspy／閃卡 JS 全內聯）。改動後跑 `tools/audit.js` 迴歸 |
| 　└ 特殊書 | `library/mnfl-{book,toolkit}.html`、`library/ust-{book,handbook,strategies}.html` | 大腦喜歡這樣學 / UST，各自 CSS |
| `content/notebook/` | `layouts/notebook/{list,single}.html` | 個人筆記 |
| `content/temperament/` | `layouts/temperament/temperament-main.html`（386 行） | 氣質 section + 測驗（`temperament-quiz.js` 197 行） |
| `content/vortex/` | `layouts/vortex/*`（見下） | 游泳知識庫，最大最複雜 |

### vortex layouts（layouts/vortex/，全 section 重點）

> 2026-07 重設計（I1–I5）後：**master-detail 面板切換範式已退役**，rail 型頁全數改「連續文件 + scrollspy」（wrap 加 `vx-doc` class，rail 按鈕→錨點連結）。唯一 legacy 面板頁剩 temperament section（不在 vortex）。

| 檔 | 行 | 職責 | 互動 JS |
|----|----|------|---------|
| `vortex-home.html` | 70 | 首頁：masthead + hero(什麼是水感) + 處境帶 4 入口 + legend（主題/搜尋都在左欄） | 載 `vortex.js` |
| `vortex-stroke.html` | 304 | 每式連續文件（vx-doc：moves→drills→errors→tech→levels） | vortex.js doc 分支（scrollspy + chip 篩選） |
| `vortex-database.html` | 270 | 查資料：全站 8 類單元級撈取，支援 `?q=` | vortex.js `[data-vx-find]` 分支 |
| `vortex-drills.html` | 187 | 找練習（139 drill 多軸篩選，label ①②③） | vortex.js `[data-vx-db]` 分支 |
| `vortex-water-sense.html` | 585 | 水感指南，**全 hardcoded**，vx-doc | vortex.js doc 分支 |
| `vortex-periodization.html` | 1103 | 週期化期刊頁（最長），vx-doc | vortex.js doc 分支 |
| `vortex-levels.html` | 137 | 水感 L0–L6，vx-doc | vortex.js doc 分支 |
| `vortex-breathing.html` | 131 | 呼吸訓練輔助軸，vx-doc | vortex.js doc 分支 |
| `vortex-injuries.html` | 288 | 運動傷害，vx-doc | vortex.js doc 分支 |
| `vortex-psychology-read.html` | 140 | 心理層連續長文（READ；lookup 頁已退役，/vortex/psychology/ alias 轉址至此） | vortex.js `.vx-read` 分支（進度條+spy） |
| `vortex-adm-{home,matrix,standards,single}.html` | 74/105/60/28 | ADM 四頁；matrix 為 vx-doc | matrix doc 分支；standards `[data-vx-adm-std]` 分支 |
| `vortex/{single,list}.html` | 29/36 | technica/instructional/bridge 散文 fallback | 無 |

### CSS（static/css/）
`variables.css`(49) `base.css`(79) `layout.css`(165) `bookshelf.css`(221) `library.css`(140) `cscs-chapter.css`(352) `notebook.css`(59) `vortex.css`(2080) `vortex-techo.css`(158，僅首頁 tx-*) `vortex-nav.css`(159，全站側欄+搜尋框) `vortex-injuries.css`(242) `mnfl.css`(391) `ust.css`(526) `temperament.css`(296)。  
隔離手法：各 section CSS 用 `body:has(.<prefix>-*)` scope，不互相污染。

### JS（static/js/）
- `vortex.js`(539) — 單檔依 DOM hook 分派（見 §2 決策索引該列）；`setupCardFilters`/`setupDrillFilters` 為 doc 與 legacy 分支共用；`?q=` 只寫入 `input.value`（XSS-safe）
- `temperament-quiz.js`(197) — 氣質測驗純前端計分

### 資料流
- `tools/sync_vortex.py` — 從 `TheVortexProject/canonical/` 同步到 `data/{vortex,adm,periodization}/`。**單向，勿手改 data/**
- `data/{mnfl,ust,temperament}/`、`data/books.yaml` — my-site 自有，**可直接改**

---

## 4. 踩雷點 / 非顯而易見處（讀檔表面看不出）

1. **`static/css/vortex.css` 的 RWD `@media` 集中在檔案後段**（檔案現約 2080 行）。中段讀不到任何 media query → **別下「沒有 RWD / 沒手機版」結論**。同理 `is-hidden`（搜 `is-hidden`，details.vx-card 用）、`.vx-cert`（搜 `vx-cert`）都在中後段。`:focus-visible` 確實沒有、`prefers-color-scheme`（dark mode）確實沒有。
2. **`vortex.js` 是單一檔依 DOM hook 分派**：`.vx-doc` 文件流（scrollspy）/ legacy 面板切換（**temperament-main.html 仍用 data-target 按鈕，此分支不可刪**）/ `[data-vx-db]` drills / `[data-vx-find]` database / `[data-vx-adm-std]` ADM 標準 / `.vx-read`。改多軸 filter 在 `setupCardFilters`/`setupDrillFilters` 共用函數改。**adm-standards 的 `stdPanel.querySelector('.vx-filters')` 依賴容器 class，layout 改 `.vx-filters` 名會斷 JS**（2026-07-10 audit 確認）。
3. **`vortex-water-sense.html` 全 hardcoded，從不呼叫 `.Content`**。對應 `content/vortex/technica/water-sense-guide.md` 的 body 是**死碼**（2026-06-15 已清空留註解）。改這頁文案要改 template，不是改 .md。
4. **`data/vortex|adm|periodization/` 是 canonical-synced**：手改會被下次 `sync_vortex.py` 洗掉。改內容要回 `C:\claudehome\projects\TheVortexProject\canonical/`。
5. **`baseof.html` 的 `.main-content { max-width:800px }` 罩住每一頁**；vortex 頁靠 `vortex.css` 的 `body:has(...) .main-content{max-width:none}` 脫離上限（搜 `main-content`）。改寬度問題先查這條。
6. **stroke 頁誤區/機制用精確 key 過濾**（`vortex-stroke.html` 搜 `where ... "stroke" $key`）：`stroke: common` 的通用項**不會**自動出現在各式頁——是「可能缺漏」而非「會多出來」。
7. **stroke 中英名 dict 已抽成共用 partial** `layouts/partials/vortex/stroke-dicts.html`，home/database/standards/drills 4 個 layout 都 `partial` 它（2026-06-23 稽核更正）。`vortex-stroke.html` 不用 partial——它的中英名取自每式 `_index.md` front-matter（`stroke_tag`/`stroke_en`），機制不同。**殘留低優先重複**：key→slug 映射 dict（`free→freestyle`）仍在 stroke/database/drills 各 inline 一份。adm-standards 用另一套 `start`/`turn` 分開 vocabulary，別混。
8. **`public/` 不進 git**（2026-06-15 `git rm --cached` + gitignore）。本機看到的 committed public 斷鏈與 live 無關，live 永遠是 CI fresh build。
9. **`.Site.Data.*` 已全數遷移完畢**（2026-06-23 稽核：`grep -rn '\.Site\.Data' layouts/` 命中 0）：全站 layout 都用 `index hugo.Data "x"`。舊 MAP 記「8 個 layout 仍用」已過時，不再是隱憂。
10. **taxonomy 已停用**（`hugo.toml` `disableKinds`）：frontmatter 的 `tags:` 不產頁。想做標籤導覽要先處理中文 slug URL 編碼（否則 mojibake）。
11. **`el.hidden = true` 在有 `display` class 規則的元素上無效**：author 的 `.nb-doc { display: grid }` specificity 高過 UA 的 `[hidden] { display: none }`，JS 設 hidden 畫面不會變。`cscs-chapter.css` 明寫 `.nb-doc[hidden] { display: none }` 解（**不用 `!important`**，專案禁用）。同模式的 `.vx-*` 若日後用 hidden 切換要一併注意。
12. **CSCS 章節頁 `chapter.html` 直接剖析子頁 `RawContent`**（`split "## "` 取小節、`split "；"` 拆條列），不走 `.Content`。所以改教材 md 的標點/標題層級會直接影響版面；`；` 是條列分隔符不是普通標點。

---

## 5. 邊界 / 別碰

- **canonical 源在另一個 repo**：`TheVortexProject`（游泳內容真相源）。my-site 只是消費端/呈現層。
- **swim-coach 不在範圍**：另一套自動教練系統（會反查 periodization data，但獨立）。
- **CSCS 閃卡資料在 Google Sheets**，非本地檔；改閃卡走 Sheets append + push 觸發 rebuild。
- **Hugo 版本漂移**：CI 0.159.1（寫死 deploy.yml）vs 本機可能更新版，改版面前先知道有落差。
