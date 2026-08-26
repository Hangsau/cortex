# MAP — my-site (Cortex)

> 結構地圖，給冷啟動讀者（人/LLM）。格式與維護流程見 `C:\claudehome\CODEBASE_MAP_METHODOLOGY.md`。
> 行為規範見 `CLAUDE.md`；進度/待辦見 `HANDOFF.md`。
>
> `last_verified: 2026-08-26`
> 本次驗證範圍是首頁資料流／版型／CSS／audit；全域 `check_map_freshness.py` 仍回報既有 helper 與部分 Vortex 檔未列入 MAP，未冒充已完成全專案盤點。

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
| 加新書（一般風格） | `content/library/<slug>/_index.md` + 往 `data/home.yaml` 對應領域的 `entries` 加一筆 |
| 改首頁（Hero、常用任務、領域入口、規格數字） | 真相源 `data/home.yaml` → 渲染 `layouts/index.html` → 樣式 `static/css/home.css`；改完跑 `tools/home_audit.js` |
| 加自訂風格書（如 mnfl/ust） | 見 `CLAUDE.md`「自訂風格書籍設計模式」 |
| 改 vortex 公開內容（泳式/誤區/drill/L 階段） | **不在此 repo！** 改 `TheVortexProject/canonical/` → 跑 `tools/sync_vortex.py` |
| 改 vortex 呈現（版面/互動/CSS） | `layouts/vortex/*.html` + `static/css/vortex.css`（可直接改） |
| 改 ADM / 週期化內容 | 同 vortex：canonical-synced，改 canonical 再 sync |
| 改氣質 section 內容 | `data/temperament/*.yaml`（my-site 自有，**可直接改**） |
| 改 CSCS 內容 / 閃卡 | `data/cscs/chNN.yaml`（唯一真相源）→ 跑 `python tools/cscs_check.py` |
| 補 CSCS 深度層（術語/數字/延伸） | 同上 yaml 的 `detail`/`terms`/`numbers`/`related`/`concepts`；術語表 `data/cscs/_terms.yaml` |
| 改 CSCS 概念軸（跨章節閱讀） | 詞彙 `data/cscs/_concepts.yaml`（封閉集 22 條，含 `group`/`order`）；批次上標 `tools/cscs_tag_concepts.py`；頁面 `layouts/library/cscs-concepts.html` |
| 改 vortex 互動行為 | `static/js/vortex.js`（單檔依 DOM hook 分派：`.vx-doc` 文件流 scrollspy / legacy 面板切換 / `[data-vx-db]` drills / `[data-vx-find]` database / `[data-vx-adm-std]` ADM 標準 / `.vx-read` 進度條） |

---

## 3. 檔案地圖

### 進入點 / 骨架
- `layouts/_default/baseof.html`（21 行）— 只管 HTML 骨架，**`.main-content` 有 800px 上限**（見踩雷 §4）
- `layouts/partials/nav.html` / `footer.html` — 全站 nav/footer；nav 只有字標與「回目次」，`hugo.toml` 刻意無 `[menu]`（全站地圖＝首頁四領域目次，不掛第二套分區清單）
- `layouts/index.html`（約 130 行）— 首頁「任務入口＋四領域索引」，讀 `data/home.yaml`；首屏 6 個 quick actions，第二層 domain primary/secondary

### Section → layout 路由
| content 目錄 | layout | 說明 |
|-------------|--------|------|
| `content/library/` | `layouts/library/{list,book,chapter,single}.html` | 書庫；CSCS 章節頁在 `chapter.html`（351 行，2026-07-31 從 3×3 九宮格改成黏性目次文件版型 + 遮答自測 + 深度層，資料讀 `data/cscs/`；模式切換／scrollspy／錨點展開／閃卡 JS 全內聯）。改動後跑 `tools/audit.js` 迴歸 |
| 　└ CSCS 概念索引 | `library/cscs-concepts.html`（180 行） | 打散章節的第二條軸：22 概念 × 各自落點（2505 條連結），共用 `.nb` 版型；入口在 book 頁的工具列與每條知識單位的概念標籤 |
| 　└ 特殊書 | `library/mnfl-{book,toolkit}.html`、`library/ust-{book,handbook,strategies}.html` | 大腦喜歡這樣學 / UST，各自 CSS |
| `content/temperament/` | `layouts/temperament/temperament-main.html`（386 行） | 氣質 section + 測驗（`temperament-quiz.js` 197 行） |
| `content/vortex/` | `layouts/vortex/*`（見下） | 游泳知識庫，最大最複雜 |

### vortex layouts（layouts/vortex/，全 section 重點）

> 2026-07 重設計（I1–I5）後：**master-detail 面板切換範式已退役**，rail 型頁全數改「連續文件 + scrollspy」（wrap 加 `vx-doc` class，rail 按鈕→錨點連結）。唯一 legacy 面板頁剩 temperament section（不在 vortex）。

| 檔 | 行 | 職責 | 互動 JS |
|----|----|------|---------|
| `vortex-home.html` | 70 | 首頁：masthead + hero(什麼是水感) + 處境帶 4 入口 + legend（主題/搜尋都在左欄） | 載 `vortex.js` |
| `vortex-stroke.html` | 304 | 每式連續文件（vx-doc：moves→drills→errors→tech→levels） | vortex.js doc 分支（scrollspy + chip 篩選） |
| `vortex-database.html` | 275 | 查資料：全站 8 類單元級撈取，支援 `?q=` | vortex.js `[data-vx-find]` 分支 |
| `vortex-drills.html` | 187 | 找練習（139 drill 多軸篩選，label ①②③） | vortex.js `[data-vx-db]` 分支 |
| `vortex-water-sense.html` | 585 | 水感指南，**全 hardcoded**，vx-doc | vortex.js doc 分支 |
| `vortex-periodization.html` | 1103 | 週期化期刊頁（最長），vx-doc | vortex.js doc 分支 |
| `vortex-levels.html` | 137 | 水感 L0–L6，vx-doc | vortex.js doc 分支 |
| `vortex-breathing.html` | 642 | 呼吸章三條線（感知線只指路去 drills／生理線／喚醒調節線）21 節點，vx-doc；**安全面板置頂且不可收合**，概念地圖 range `data/breathing/_index.yaml` 生成 | vortex.js doc 分支 |
| `vortex-injuries.html` | 288 | 運動傷害，vx-doc | vortex.js doc 分支 |
| `vortex-psychology-read.html` | 140 | 心理層連續長文（READ；lookup 頁已退役，/vortex/psychology/ alias 轉址至此） | vortex.js `.vx-read` 分支（進度條+spy） |
| `vortex-adm-{home,matrix,standards,single}.html` | 74/105/60/28 | ADM 四頁；matrix 為 vx-doc | matrix doc 分支；standards `[data-vx-adm-std]` 分支 |
| `vortex/{single,list}.html` | 29/36 | technica/instructional/bridge 散文 fallback | 無 |

### CSS（static/css/）
`variables.css`(49) `base.css`(79) `layout.css`(165) `home.css`(約 620，首頁工作台 Hero＋atlas＋RWD，完全 scope 在 `.home-page`) `library.css`(140) `cscs-chapter.css`(719) `vortex.css`(2111) `vortex-techo.css`(158，僅首頁 tx-*) `vortex-nav.css`(159，全站側欄+搜尋框) `vortex-injuries.css`(242) `mnfl.css`(391) `ust.css`(526) `temperament.css`(296)。
隔離手法：各 section CSS 用 `body:has(.<prefix>-*)` scope，不互相污染。

### JS（static/js/）
- `vortex.js`(555) — 單檔依 DOM hook 分派（見 §2 決策索引該列）；`setupCardFilters`/`setupDrillFilters` 為 doc 與 legacy 分支共用；`?q=` 只寫入 `input.value`（XSS-safe）
- `temperament-quiz.js`(197) — 氣質測驗純前端計分

### 版型驗收（tools/）
- `home_audit.js` — 首頁 28 項資料＋Playwright 閘：home.yaml 色碼/URL、16 個 canonical 目的地、6 個 quick actions、4 個 domains、連結回應、heading、對比、focus、CLS、reduced-motion 與 768/390/320px RWD
- `audit.js` — CSCS 章節頁＋概念索引 38 項既有迴歸閘；首頁改動後仍須跑，確認 CSS 隔離沒有波及其他頁

### 資料流
- `tools/sync_vortex.py` — 從 `TheVortexProject/canonical/` 同步到 `data/{vortex,adm,periodization,breathing}/`。**單向，勿手改 data/**
- `data/{mnfl,ust,temperament}/`、`data/home.yaml` — my-site 自有，**可直接改**

---

## 4. 踩雷點 / 非顯而易見處（讀檔表面看不出）

1. **`static/css/vortex.css` 的 RWD `@media` 集中在檔案後段**（檔案現約 2111 行）。中段讀不到任何 media query → **別下「沒有 RWD / 沒手機版」結論**。同理 `is-hidden`（搜 `is-hidden`，details.vx-card 用）、`.vx-cert`（搜 `vx-cert`）都在中後段。`:focus-visible` 確實沒有、`prefers-color-scheme`（dark mode）確實沒有。
2. **`vortex.js` 是單一檔依 DOM hook 分派**：`.vx-doc` 文件流（scrollspy）/ legacy 面板切換（**temperament-main.html 仍用 data-target 按鈕，此分支不可刪**）/ `[data-vx-db]` drills / `[data-vx-find]` database / `[data-vx-adm-std]` ADM 標準 / `.vx-read`。改多軸 filter 在 `setupCardFilters`/`setupDrillFilters` 共用函數改。**adm-standards 的 `stdPanel.querySelector('.vx-filters')` 依賴容器 class，layout 改 `.vx-filters` 名會斷 JS**（2026-07-10 audit 確認）。
3. **`vortex-water-sense.html` 全 hardcoded，從不呼叫 `.Content`**。對應 `content/vortex/technica/water-sense-guide.md` 的 body 是**死碼**（2026-06-15 已清空留註解）。改這頁文案要改 template，不是改 .md。
4. **`data/vortex|adm|periodization|breathing/` 是 canonical-synced**：手改會被下次 `sync_vortex.py` 洗掉。改內容要回 `C:\claudehome\projects\TheVortexProject\canonical/`。`breathing/` 是**整章目錄式搬運**（全 public 無 diagnostic），不是 `data/vortex/` 那種單檔剝離。
5. **`baseof.html` 的 `.main-content { max-width:800px }` 罩住每一頁**；vortex 頁靠 `vortex.css` 的 `body:has(...) .main-content{max-width:none}` 脫離上限（搜 `main-content`）。改寬度問題先查這條。
6. **stroke 頁誤區/機制用精確 key 過濾**（`vortex-stroke.html` 搜 `where ... "stroke" $key`）：`stroke: common` 的通用項**不會**自動出現在各式頁——是「可能缺漏」而非「會多出來」。
7. **stroke 中英名 dict 已抽成共用 partial** `layouts/partials/vortex/stroke-dicts.html`，home/database/standards/drills 4 個 layout 都 `partial` 它（2026-06-23 稽核更正）。`vortex-stroke.html` 不用 partial——它的中英名取自每式 `_index.md` front-matter（`stroke_tag`/`stroke_en`），機制不同。**殘留低優先重複**：key→slug 映射 dict（`free→freestyle`）仍在 stroke/database/drills 各 inline 一份。adm-standards 用另一套 `start`/`turn` 分開 vocabulary，別混。
8. **`public/` 不進 git**（2026-06-15 `git rm --cached` + gitignore）。本機看到的 committed public 斷鏈與 live 無關，live 永遠是 CI fresh build。
9. **`.Site.Data.*` 已全數遷移完畢**（2026-06-23 稽核：`grep -rn '\.Site\.Data' layouts/` 命中 0）：全站 layout 都用 `index hugo.Data "x"`。舊 MAP 記「8 個 layout 仍用」已過時，不再是隱憂。
10. **taxonomy 已停用**（`hugo.toml` `disableKinds`）：frontmatter 的 `tags:` 不產頁。想做標籤導覽要先處理中文 slug URL 編碼（否則 mojibake）。
11. **`el.hidden = true` 在有 `display` class 規則的元素上無效**：author 的 `.nb-doc { display: grid }` specificity 高過 UA 的 `[hidden] { display: none }`，JS 設 hidden 畫面不會變。`cscs-chapter.css` 明寫 `.nb-doc[hidden] { display: none }` 解（**不用 `!important`**，專案禁用）。同模式的 `.vx-*` 若日後用 hidden 切換要一併注意。
12. **CSCS 章節頁已改讀 `data/cscs/`**（2026-07-31）：舊的「剖析子頁 `RawContent`、`；` 當條列分隔符」機制連同 202 個 topic md 檔一起刪除，`；` 恢復成普通標點。`chNN/` 現在只剩 `_index.md`。
13. **`related` / `terms` / `concepts` 指到不存在的目標，Hugo 不報錯只給空字串**（同 §踩雷 Vortex 分類標籤的坑）。所以驗收靠 `tools/cscs_check.py`，把斷鏈當失敗；**不跑它就等於沒有交叉參照**。
14. **wiki 連結索引用 `partialCached "cscs-index.html" $book $book.RelPermalink`**：1583 條，每頁重建會拖慢建置；variant key 用 RelPermalink，避免第二本書共用同一份快取。
15. **`.nb-detail summary` 的 `display` 不是 `list-item`，原生三角會消失**，靠 `::before` 自己畫；改 summary 版面時別把箭頭弄丟（`audit.js` 沒有斷言它，只有人眼看得到）。
16. **`base.css` 全站 `html { scroll-behavior: smooth }` 會讓錨點落地漂掉**：跳錨點時瀏覽器自己的平滑捲動、頁面既有的平滑捲動、`scrollIntoView()` 三者互搶，實測落點偏離目標 2200px。`chapter.html` / `cscs-concepts.html` 的 `openTarget()` 因此在定位期間暫時把 `documentElement.style.scrollBehavior` 設成 `auto`，下一幀再補一次並還原。**只用 `scrollIntoView({behavior:'auto'})` 不夠**（動畫仍會接手）。
17. **Goldmark 在全形標點與 CJK 之間不認粗體閉合符**：`**延腦背側呼吸群（DRG）**主要…` 的收尾 `**` 前是 `）`、後是 `主`，右側 flanking 判定失敗，`**` 原樣印在頁面上。修法是把括號／句號移到粗體外側，**且要修在 canonical 那一側**。⚠ 2026-08-11 全站掃描：`public/` 仍有 222 個未渲染的 `**`（database 90、freestyle 34、udk 18…），**根因不只一種**——數量大的比較像該欄位根本沒過 `markdownify`，要修先分類。掃描方式：對 `public/**/index.html` 數 `**` 出現次數。
18. **錨點跳進收合的 `<details>` 會落在空白處**：`vx-doc` 模式原本沒有 hash 處理（自動展開只存在於 legacy 面板分支的 `data-anchor`）。`vortex.js` 的 `openTargetDetails()` 在載入與 `hashchange` 時補這件事——加新的「從別頁跳進某節」入口前先確認它還在。
19. **純計算的 Hugo 迴圈一定要用 `{{- -}}` 夾緊**：不夾的話每次迭代吐出縮排空白，概念頁 22 × 1583 次迭代把 HTML 從 578KB 灌成 1.86MB。看到頁面異常肥先查迴圈空白，不是查內容量。
20. **首頁的 quick action 重複 URL 是刻意的，canonical 目的地不是兩份**：`quick_actions` 只是首屏捷徑，完整清單仍由 `domains.primary` / `domains.secondary` + `footer_link` 擁有。`home_audit.js` 允許一個目的地出現兩次，但不允許第三份或規格外 URL。手機版隱藏 domain `lede/spec` 也是刻意的密度裁決；入口與 note 仍完整保留。

---

## 5. 邊界 / 別碰

- **canonical 源在另一個 repo**：`TheVortexProject`（游泳內容真相源）。my-site 只是消費端/呈現層。
- **swim-coach 不在範圍**：另一套自動教練系統（會反查 periodization data，但獨立）。
- **CSCS 內容真相源是 `data/cscs/`**（my-site 自有，可直接改）。Google Sheets CSV / `data/flashcards/*.json` / topic md 檔皆已廢除，別再照舊文件去 Sheets 加閃卡。
- **Hugo 版本漂移**：CI 0.159.1（寫死 deploy.yml）vs 本機可能更新版，改版面前先知道有落差。
