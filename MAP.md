# MAP — my-site (Cortex)

> 結構地圖，給冷啟動讀者（人/LLM）。格式與維護流程見 `C:\claudehome\CODEBASE_MAP_METHODOLOGY.md`。
> 行為規範見 `CLAUDE.md`；進度/待辦見 `HANDOFF.md`。
>
> `last_verified: 2026-06-15`

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
| 改 vortex 互動行為 | `static/js/vortex.js`（僅 stroke 頁）/ database & standards 的 inline JS |

---

## 3. 檔案地圖

### 進入點 / 骨架
- `layouts/_default/baseof.html`（21 行）— 只管 HTML 骨架，**`.main-content` 有 800px 上限**（見踩雷 §4）
- `layouts/partials/nav.html` / `footer.html` — 全站 nav/footer
- `layouts/index.html`（49 行）— 首頁書架

### Section → layout 路由
| content 目錄 | layout | 說明 |
|-------------|--------|------|
| `content/library/` | `layouts/library/{list,book,chapter,single}.html` | 書庫；CSCS 九宮格在 `chapter.html`（232 行，閃卡翻轉 JS 已內聯） |
| 　└ 特殊書 | `library/mnfl-{book,toolkit}.html`、`library/ust-{book,handbook,strategies}.html` | 大腦喜歡這樣學 / UST，各自 CSS |
| `content/notebook/` | `layouts/notebook/{list,single}.html` | 個人筆記 |
| `content/temperament/` | `layouts/temperament/temperament-main.html`（386 行） | 氣質 section + 測驗（`temperament-quiz.js` 197 行） |
| `content/vortex/` | `layouts/vortex/*`（見下） | 游泳知識庫，最大最複雜 |

### vortex layouts（layouts/vortex/，全 section 重點）
| 檔 | 行 | 職責 | 互動 JS |
|----|----|------|---------|
| `vortex-home.html` | 133 | hub 首頁，vx-toc 多入口 | 載 `vortex.js` |
| `vortex-stroke.html` | 296 | 每式 master-detail（rail + 面板） | 載 `vortex.js` |
| `vortex-database.html` | 221 | 跨泳式查詢（需求區 + 3 tab） | **自帶 inline JS，不載 vortex.js**（雷 §4） |
| `vortex-water-sense.html` | 586 | 水感指南，**全 hardcoded** | 無 |
| `vortex-periodization.html` | 851 | 週期化期刊頁（最長） | 重用 vortex.js |
| `vortex-levels.html` | 138 | 水感 L0–L6 | 重用 vortex.js |
| `vortex-adm-{home,matrix,standards,single}.html` | 60/105/82/24 | ADM 四頁 | matrix 重用 vortex.js；standards 自帶 inline JS |
| `vortex/{single,list}.html` | 29/36 | technica/instructional/bridge 散文 fallback | 無 |

### CSS（static/css/，3157 行）
`variables.css`(49) `base.css`(79) `layout.css`(165) `bookshelf.css`(221) `library.css`(140) `cscs-chapter.css`(375) `notebook.css`(59) `vortex.css`(856) `mnfl.css`(391) `ust.css`(526) `temperament.css`(296)。  
隔離手法：各 section CSS 用 `body:has(.<prefix>-*)` scope，不互相污染。

### JS（static/js/）
- `vortex.js`(122) — **只服務 stroke 頁**（開頭 `if(!.vx-stroke-wrap) return`）：面板切換 + hash 路由 + popstate + 多軸 filter
- `temperament-quiz.js`(197) — 氣質測驗純前端計分

### 資料流
- `tools/sync_vortex.py` — 從 `TheVortexProject/canonical/` 同步到 `data/{vortex,adm,periodization}/`。**單向，勿手改 data/**
- `data/{mnfl,ust,temperament}/`、`data/books.yaml` — my-site 自有，**可直接改**

---

## 4. 踩雷點 / 非顯而易見處（讀檔表面看不出）

1. **`static/css/vortex.css` 的 RWD `@media` 全在檔案最底**（約 801+ 行，2026-06-15）。中段讀不到任何 media query → **別下「沒有 RWD / 沒手機版」結論**。同理 `is-hidden`（搜 `is-hidden`，details.vx-card 用）、`.vx-cert`（搜 `vx-cert`）都在中後段。`:focus-visible` 確實沒有、`prefers-color-scheme`（dark mode）確實沒有。
2. **`vortex-database.html` 不載 `vortex.js`，自帶一份 inline JS**。因為 `vortex.js` 在非 stroke 頁 early-return，database/standards 只能自己寫。兩者「多軸 filter」邏輯看似重複但**無法直接共用**，不是單純 DRY 違規。
3. **`vortex-water-sense.html` 全 hardcoded，從不呼叫 `.Content`**。對應 `content/vortex/technica/water-sense-guide.md` 的 body 是**死碼**（2026-06-15 已清空留註解）。改這頁文案要改 template，不是改 .md。
4. **`data/vortex|adm|periodization/` 是 canonical-synced**：手改會被下次 `sync_vortex.py` 洗掉。改內容要回 `C:\claudehome\projects\TheVortexProject\canonical/`。
5. **`baseof.html` 的 `.main-content { max-width:800px }` 罩住每一頁**；vortex 頁靠 `vortex.css` 的 `body:has(...) .main-content{max-width:none}` 脫離上限（搜 `main-content`）。改寬度問題先查這條。
6. **stroke 頁誤區/機制用精確 key 過濾**（`vortex-stroke.html` 搜 `where ... "stroke" $key`）：`stroke: common` 的通用項**不會**自動出現在各式頁——是「可能缺漏」而非「會多出來」。
7. **stroke 中英名 dict 在 3 個 layout 各有一份副本**（home/database/stroke），曾因此「出發與轉身」vs「出發轉身」不一致（2026-06-15 已對齊 canonical 標題「出發與轉身」）。加第七式要同步改多處。adm-standards 用的是另一套 `start`/`turn` 分開的 vocabulary，不同概念別混。
8. **`public/` 不進 git**（2026-06-15 `git rm --cached` + gitignore）。本機看到的 committed public 斷鏈與 live 無關，live 永遠是 CI fresh build。
9. **`.Site.Data.*` 已 deprecated**（Hugo 0.156+）：8 個 layout 仍用，CI Hugo 一旦升過移除版本會全站 build 失敗。遷移是機械式 `.Site.Data.x` → `index hugo.Data "x"`。
10. **taxonomy 已停用**（`hugo.toml` `disableKinds`）：frontmatter 的 `tags:` 不產頁。想做標籤導覽要先處理中文 slug URL 編碼（否則 mojibake）。

---

## 5. 邊界 / 別碰

- **canonical 源在另一個 repo**：`TheVortexProject`（游泳內容真相源）。my-site 只是消費端/呈現層。
- **swim-coach 不在範圍**：另一套自動教練系統（會反查 periodization data，但獨立）。
- **CSCS 閃卡資料在 Google Sheets**，非本地檔；改閃卡走 Sheets append + push 觸發 rebuild。
- **Hugo 版本漂移**：CI 0.159.1（寫死 deploy.yml）vs 本機可能更新版，改版面前先知道有落差。
