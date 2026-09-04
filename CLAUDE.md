# my-site (Cortex) — CLAUDE.md

## 專案定位

個人知識網站，Hugo 靜態網站生成器。  
網址：`https://hangsau.github.io/cortex/`  
Repo：`Hangsau/cortex`，branch：`hugo-source`  
原始書檔（Markdown）放在 `C:\claudehome\resources\books\`，不在此專案內。
CSCS 教材：`C:\claudehome\resources\books\Essentials_of_Strength_Training_and_Conditioning,_Fourth_Edition\`（EPUB 轉 MD，159 章節）

---

## 架構速查

```
content/
  library/                  # 書庫（每本書一個資料夾）
    essentials-of-strength-training/
      _index.md             # layout: book
      ch01/ ... ch24/       # 每章只有 _index.md（layout: chapter），內容在 data/cscs/
      concepts.md           # layout: cscs-concepts
layouts/
  _default/                 # baseof、list、single
  partials/                 # nav、footer
  library/                  # list（書庫列表）、book（單書頁）、chapter（暗記帳文件版型）、single
  shortcodes/               # flashcard、highlight-quote、callout
static/
  css/
    variables.css           # 只放 CSS 變數
    base.css                # reset + 基礎排版
    layout.css              # nav/main/footer 結構
    home.css                # 首頁工作台 Hero + 四領域 atlas + RWD
    library.css             # 書庫 section 樣式
    cscs-chapter.css        # 章節頁（黏性目次正文 + 遮答自測 + 閃卡）與 book.html 的 .home-grid
  js/
    flashcard.js            # 閃卡翻轉（單一功能）
  images/
    cscs-cover.jpg
layouts/library/
  cscs-concepts.html        # 概念索引頁（打散章節，照概念讀）
layouts/partials/
  cscs-index.html           # 全書 id → 標題/網址 索引（wiki 連結用，partialCached）
data/
  home.yaml                 # 首頁 Hero / 6 個任務捷徑 / 四領域 canonical 入口（舊 books.yaml 已廢除）
  vortex/
    source-registry.yaml    # canonical/_sources.yaml 的公開白名單視圖（sync 產生，勿手改；internal notes 不帶）
  cscs/
    _terms.yaml             # 全書術語表（en / zh / abbr / note），106 條
    _concepts.yaml          # 受控概念詞彙（封閉集，22 條，含 group / order）
    ch01.yaml ... ch24.yaml # 每章 topics → items（知識單位）+ cards（閃卡）
tools/
  cscs_check.py             # 交叉參照與完整性驗收閘（改 data/cscs/ 後必跑）
  cscs_tag_concepts.py      # 主題級批次上概念標（不覆寫既有值，可重複跑）
  audit.js                  # 章節頁 + 概念頁版型數值迴歸閘（Playwright）
```

---

## 授權範圍

- 此專案內所有檔案可直接修改，不需詢問確認

---

## 工作守則

### Layout 規則
- `baseof.html` 只管 HTML 骨架，不寫任何 section 邏輯
- 每個 section 有自己的 list/single layout，互不干擾
- **CSS/JS/image 路徑用 `{{ .Site.BaseURL }}css/xxx.css`**（不加前綴 `/`）
  - Hugo 的 `absURL`/`relURL` 對以 `/` 開頭的路徑在 subdirectory 部署時失效
  - `.Site.BaseURL` = `https://hangsau.github.io/cortex/`，直接拼接即可
- 頁面連結用 `{{ .RelPermalink }}` 或 `{{ .Permalink }}`（Hugo 自動帶入正確路徑）
- nav menu 連結：`{{ .URL | absURL }}`（`.URL` 對已有 content 的 menu item 會返回含 subdirectory 的完整路徑，`absURL` 只取 host 部分拼接，不會 double-prefix）

### CSS 規則
- 改全站外觀 → `variables.css`（改 CSS 變數即可）
- 改排版結構 → `layout.css`
- 加新元件 → 建新的 css 檔，不改 base
- 不寫 inline style，不用 `!important`

### 命名規範
- 檔案名：kebab-case
- CSS class：kebab-case
- Hugo template 變數：PascalCase

### 加新書的流程
1. 在 `content/library/<book-slug>/` 建資料夾與 `_index.md`（`layout: book`）
2. 在 `data/home.yaml` 找它所屬的領域，往該領域的 `entries` 加一筆（`name` / `note` / `url`）

### 首頁：單位是「領域」不是「書」

`layouts/index.html` 讀 `data/home.yaml`，首頁分成兩層：首屏的 `quick_actions` 先回答「現在要做
什麼」，第二層 `domains` 才提供完整四領域索引。**書仍不是首頁單位，而是領域裡的一筆來源**；
只是完整目錄不再和常用任務搶同一個視覺層級。`data/books.yaml` 與 `static/css/bookshelf.css`
已廢除，不要恢復。

- `quick_actions` 維持 ≤6，名稱以動詞起手；它是常用捷徑，URL 可與 domain canonical 入口重複
- 領域數維持 ≤7；每個 domain 的 `primary` 維持 1–2 個，`secondary` 維持 ≤7。完整目的地只在
  `domains` + `footer_link` 定義，quick action 不另造 URL
- `spec` 的數字必須對得上 `data/` 實況，改資料時一併改，不要留形容詞
- `color` 只接受六位 hex；領域識別色由 `layouts/index.html` 的 `<style>` 區塊掛成
  `--domain-color`，禁止 `style` attribute
- 版面是「深綠工作台 Hero + 方角規則線 atlas」：無陰影、無圓角、無 hover 位移。首頁字型沿用
  Vortex 的 Cormorant Garamond / Noto Serif TC / Noto Sans TC，並保留 CJK system fallback
- 手機版刻意隱藏 domain 的長 `lede` 與 `spec`，保留 task、領域名、主入口與可展開完整目錄；
  這是把首頁壓在三個 viewport 內的資訊層級決策，不是內容遺漏
- 改 `data/home.yaml`、`layouts/index.html` 或 `static/css/home.css` 後，必跑
  `node tools/home_audit.js`：16 個 canonical 目的地、6 個 quick actions、4 個 domains、RWD、
  WCAG 對比、focus、CLS 與 reduced-motion 都是硬閘
- **`hugo.toml` 沒有 `[menu]` 是刻意的**：nav 只有字標與「回目次」。全站地圖就是這份四領域
  目次，右上角再掛一份「書庫／Vortex／氣質」等於第二套只涵蓋部分內容、又跟四領域對不上的
  分類。要加全域導覽前先想清楚它跟 `data/home.yaml` 誰是真相源
- `hero.title` 要說明網站能做什麼；`hero.lede` 說明 Cortex 是工作知識庫；`index.lede` 才交代
  四個領域的共同線。不要把其中任何一句拿來朗讀資料結構
- **不要建空殼頁面**。`highlights.md`（重點摘錄）／`notes.md`（讀書筆記）只有 front matter、
  正文全空，掛在首頁上就是兩條點進去什麼都沒有的連結，2026-08-08 已刪。這是 GitHub Pages
  靜態站，寫一條筆記＝本機開檔 → commit → push → 等 CI；沒有寫入管道的容器只會一直空著。
  新入口要先有內容才進 `data/home.yaml`

### Vortex 分類標籤：一律從資料讀，禁止在 layout 硬編

`data/vortex/*.yaml` 每份都自帶 `categories` 區塊（真相源在 TheVortexProject 的 canonical / `Drills/_categories.yaml`），layout 用 merge 取標籤：

```
{{ $catName := dict }}{{ range (index hugo.Data "vortex" "drills").categories }}{{ $catName = merge $catName (dict .key .name_zh) }}{{ end }}
```

（五份 `categories` 詞彙表的欄位名一律 `.key` / `.name_zh`。`injuries.yaml` 原本是 `.id` / `.zh`，
2026-09-04 已對齊——`id` 會讓 canonical 端的 `iter_entries` 把 7 個篩選分類當成知識條目，
永久掛在 W003 孤兒清單上。）

**為什麼是鐵則**：Hugo 的 `{{ index $dict .key }}` 查不到 key 會回**空字串且不報錯**。硬編一份副本，canonical 一加新分類，頁面標籤就無聲消失——2026-07-26 一次抓到兩起（starts-turns 頁 9 張 drill 卡標籤全空、傷害資料庫三個標籤文字漂移）。canonical 側有 E009 擋「條目用了沒宣告的 category」，但擋不住 layout 自己抄一份。

**同一條鐵則也適用「節點清單」**：章節有 `_index.yaml`（目前是 `data/breathing/` 與 `data/periodization/`）時，導覽、概念地圖、查資料頁的卡片一律 range 它生成，不要在 layout 打一份節點名單。`vortex-breathing.html` 的全章地圖與 `vortex-database.html` 的 21 張呼吸卡都是這樣長出來的——canonical 加一節，兩處自動跟上；抄一份就會漏。

### 骨關節動作章（`vortex/joints/`）：一份內容兩個入口

`technical-analysis.yaml` 裡 `category: joint` 的 13 條同時出現在兩個地方，**但只有一份資料、一個 ID**：

- **各式頁**（`vortex-stroke.html`）的「深入機制」面板——就地讀，卡片收合。`$techs` 不能用單一 `where`：卡片除了自己的 `stroke`，還可能用 `also_strokes` 宣告它在別式同樣成立（Hugo 的 `where` 表達不了 OR），所以是手動 range 累積，並在 summary 標「跨式通則」。
- **`vortex/joints/`**（`vortex-joints.html`）——按 `joint_region` 分四組的全展開文件頁，是側欄裡的頂層入口。

**為什麼要有頂層入口**：只掛在各式頁時，讀者得先知道「有這章」才會點進某一式去翻，實測結果是完全找不到。凡是**橫跨多式的主題**（呼吸、傷害、關節）都要在 `layouts/partials/vortex/sidebar.html` 有一條，不能只靠各式頁內的分類 chip。

**左欄與分組卡一律用 `nav_zh` 不用 `title`**：這章的 title 是完整論斷句（40+ 字），拿去做導航會變文字牆。canonical 沒給 `nav_zh` 的條目才 fallback 到 title。

樣式在 `static/css/vortex-joints.css`（`vx-jt-*` 前綴，自足）。**不要 import `vortex-injuries.css`** 去借 `.vx-cat-grid` / `.vx-tag`——那份檔名綁傷害頁，跨頁引用會讓「這條規則歸誰維護」變模糊。

### 來源註冊表（`data/vortex/source-registry.yaml`）：白名單視圖，不是整份搬運

canonical 的條目用 `source_ids: [src.xxx]` 這種機器鍵指來源；`sync_vortex.py` 的 `sync_source_registry()` 把 `canonical/_sources.yaml`（532 筆）轉成**以 id 為 key 的 map**，讓 layout 能 `index $reg $sid` 直接查。三條不可改的規則：

- **白名單不是黑名單**。只有 `PUBLIC_SOURCE_FIELDS` 列出的 12 欄會出站。canonical 的 `notes`（503 筆，內含「適用範圍」「**不是泳者來源**」這類**維護者裁決註記**）永不輸出。用白名單是因為 canonical 之後還會加內部欄位，黑名單擋不住還沒被想到的那個。
- **`link` 在 Python 這層算好**（頂層 url → identifier.url → doi → pmcid → pmid 五路優先序），Hugo template 不做分支。**只有 ISBN 的書就沒有 link，這是正確狀態**——不要為了讓每筆都可點去拼書店或 Google Books 網址，那是編造。
- **查不到 id 時 layout 必須印出 id 本身**。Hugo 的 `index` 查不到 key 回空字串且不報錯，沒有 fallback 的話來源行會**無聲消失**、讀者以為這條本來就沒來源。同 §「Vortex 分類標籤」那條鐵則的理由。`verification_status: unverified` 也必須標「未查證」（359/532 筆屬此類），專案規範明訂無法查證者不得以肯定句包裝。

目前只有 `vortex-joints.html` 的 `mechanism.source_ids` 接了這份註冊表。`vortex-stroke.html` 的「深入機制」面板對**全部**技術卡通用（`technical-analysis.yaml` 有 251 處 `source_ids`），要接的話是一次點亮六個泳式頁，需獨立的視覺驗收，別順手加。

### 呼吸章（`data/breathing/`）：三條線 + 安全置頂

真相源 `TheVortexProject/canonical/breathing/`，六份 yaml 由 `sync_vortex.py` 的 `sync_breathing()` **整檔搬運**（全 public、無 diagnostic 子樹，不剝離）。版型 `layouts/vortex/vortex-breathing.html` 有兩條不可改的順序：

- **`#safety` 面板必須第一、且不可收合**。缺氧昏迷是讀其他每一節的前提，收起來或往下移都會讓 CO2 耐受、Wim Hof 那幾節被誤用。
- **`n-wim_hof` 的 `safety_zh` 排在 `what_zh` 之前**，同理。

各節散文欄位名逐節不同，template 逐欄列出、不用 range（Hugo 對 map 按 key 字母序，range 會打亂敘事順序）——同 `vortex-periodization.html`。

**CJK 粗體陷阱**：Goldmark 對 `**…**` 的右側閉合，若前一字是全形標點、後一字是 CJK，判定失敗，`**` 會原樣印在頁面上（例：`**延腦背側呼吸群（DRG）**主要`）。修在 canonical 側把括號／句號移到粗體外面，不要在 layout 補救。

### ADM（Athlete Development Matrix）架構

ADM 已從 library（cortex 書庫）遷入 **vortex** section，並改用 vortex 設計語言（一致性 + 好讀性），不再是書庫的獨立風格頁。資料源是 canonical（TheVortexProject）→ `sync_vortex.py` → `data/adm/`。

```
content/vortex/adm/
  _index.md          layout: vortex-adm-home      → masthead + 三入口導覽
  matrix.md          layout: vortex-adm-matrix    → master-detail：選一支柱讀其 L2T→T2W
  standards.md       layout: vortex-adm-standards → 各式技術標準，按泳式篩選 + 搜尋
  background.md      layout: vortex-adm-single    → 長文（LTD 模型 / 獎牌台 / 八大考量）

layouts/vortex/
  vortex-adm-home.html       首頁（masthead + vx-toc 三入口）
  vortex-adm-matrix.html     矩陣（vx-stroke-wrap master-detail，重用 vortex.js + vortex.css）
  vortex-adm-standards.html  技術標準（vx-db 風格，inline JS 篩選/搜尋，讀 data/adm/standards.yaml）
  vortex-adm-single.html     長文（vx-article，返回連結指向 ADM home）

data/adm/                    （由 sync_vortex.py 從 canonical 同步，勿手改）
  matrix.yaml      4 支柱 × 4 階段（含 summary + points，points 支援 **粗體**）
  standards.yaml   22 筆技術標準（四式 + 起跳轉身，phases/criteria 結構）
```

- 矩陣與標準頁皆用 `index hugo.Data "adm" "matrix"` / `index hugo.Data "adm" "standards"` 讀資料（`.Site.Data.*` 在 Hugo 0.156+ 已棄用，全站 layout 已遷 `hugo.Data`）。
- 階段中文名 / 年齡對照（L2T 學習訓練、T2T 訓練為訓練、T2C 訓練為競賽、T2W 訓練為勝利）寫死在 `vortex-adm-matrix.html` 的 dict。
- 內容修改不在此 repo 手改 `data/adm/`：改 canonical（TheVortexProject/canonical/development/）後重跑 `tools/sync_vortex.py`。
- ADM 專用樣式併入 `static/css/vortex.css`（`.vx-adm-*`），無獨立 adm.css / adm-matrix.js。

### 自訂風格書籍設計模式（如 大腦喜歡這樣學）

當一本書需要獨立視覺風格（不沿用 CSCS 章節頁或 ADM 矩陣），使用以下模式：

```
content/library/<slug>/
  _index.md          layout: <abbrev>-book   → 封面 + 導航卡
  toolkit.md         layout: <abbrev>-toolkit → 主要內容頁

layouts/library/
  <abbrev>-book.html
  <abbrev>-toolkit.html

data/<abbrev>/
  <file>.yaml        所有內容資料

static/css/
  <abbrev>.css       書籍專用樣式（不改 variables.css）
```

**CSS 隔離規則**：
- 所有 class 名稱加書籍縮寫前綴（如 `mnfl-*`）
- 頁面級背景色用 `body:has(.<abbrev>-page) {}` 選擇器，不改全域 variables.css，不用 `!important`
- Google Fonts 在 layout 的 `head-extra` block 載入，不影響其他頁面

**可展開內容**：優先用原生 `<details>/<summary>`（零 JS），只有需要跨元素聯動（如主題篩選）才加 JavaScript。

**Hugo data 讀取**（與 ADM 相同）：
```
{{ $data := index hugo.Data "<abbrev>" }}
{{ range $data.<file>.themes }}
```

**姊妹書設計模式**（同一作者的相關書籍）：
- 使用相同字型家族（如同樣是 Caveat + Crimson Text）建立視覺家族感
- 主強調色換一個，讓兩本書在書架上一眼能區分（例：學習者版用磚紅、教師版用深藍綠）
- 現有範例：`mnfl`（大腦喜歡這樣學，`#B5290B`）× `ust`（Uncommon Sense Teaching，`#1B5E69`）

**書籍架構選擇決策流程**（設計前必做）：

| 問題 | 卡片格（如 mnfl toolkit） | 長文章節（如 ust handbook） |
|------|--------------------------|--------------------------|
| 內容單位 | 原子技法（可獨立閱讀） | 章節概念（有知識層次） |
| 每則長度 | 3-5 條 bullet | 6-12 條 bullet，每條 2-3 句 |
| 使用情境 | 「我要試這個技法」→快速查 | 「我要理解這個概念」→深讀 |
| 分類維度 | 主題/情境篩選（20+項目） | 章節導覽（10以下） |

**兩層內容書籍**（同時有「為什麼」和「怎麼做」）→ 用 2 個子頁：
- 一頁長文（深讀概念層）+ 一頁卡片（查找策略層）
- 範例：UST 的 `handbook.md` + `strategies.md`

---

### CSCS 內容：真相源是 `data/cscs/`，不是 markdown、不是 Google Sheets

2026-07-31 起，章節內容與閃卡全部住在 `data/cscs/chNN.yaml`。**Google Sheets CSV / `resources.GetRemote` / `data/flashcards/*.json` / 每章 8 個 topic md 檔全部已廢除**——建置不再有網路依賴，改資料就是改 yaml。

每個知識單位（item）的欄位：

| 欄位 | 必填 | 說明 |
|------|------|------|
| `id` | ✓ | `chNN.topic-slug.item-slug`；**slug 制，重排序不改號** |
| `q` / `a` | ✓ | 標題句 / 條列答案（`a` 是 YAML list，不是 `；` 分隔字串） |
| `detail` | | 深度層：寫「為什麼／代表什麼」，**不得複述 `a`** |
| `terms` | | 指向 `_terms.yaml` 的 key |
| `numbers` | | `v` / `unit` / `of` 三欄缺一即驗收失敗 |
| `concepts` | | 只能用 `_concepts.yaml` 的封閉集，不得自由發明 |
| `related` | | 指向其他 item 的 `id`，跨章自動變 wiki 連結 |
| `locator` | | 書中出處 |

**驗收閘（改完必跑，兩支都要綠）**：

```bash
python tools/cscs_check.py            # 交叉參照 / 重複 id / numbers 完整性；有錯 = 失敗，不是待辦
hugo server                            # 另開一個視窗
node tools/audit.js                    # 38 條版型／深度層／概念索引數值斷言
```

- `audit.js` 需要 playwright，本 repo 不裝（不進 node_modules）：
  `PLAYWRIGHT_PATH=C:/claudehome/tools/node_modules/playwright node tools/audit.js`
  該路徑已裝好；重裝是 `cd C:/claudehome/tools && npm i playwright`（注意 npm 會往上找 `package.json`，實際落點是 `tools/node_modules` 不是當下目錄）。瀏覽器本體已在 `~/AppData/Local/ms-playwright/`。
- **術語一律常駐可見**，不准塞進 hover 或 details——使用者的原始痛點就是「只有英文沒有中文」，藏起來等於沒解決；定義本身才進展開層
- **概念軸是第二條閱讀動線**：`concepts` 只能挑 `_concepts.yaml` 的 22 條，且**一條概念至少橫跨兩章**才准存在（只在單章的概念＝把該章抄一遍，`audit.js` 有斷言）。批次上標用 `tools/cscs_tag_concepts.py`（主題級、不覆寫既有值）
- **補完進度（2026-08-08 實測）**：24 章全數對帳完成——`detail` / `concepts` / `locator` 各 **1557/1557**、cards 1252 張、`related` 1908 條（跨章 95.6%）。`terms` 1437/1557、`numbers` 514（這兩欄不是覆蓋率目標：沒有英文專有名詞就不掛 terms，沒有數字就不掛 numbers）。欄位空著時深度層自動不渲染，不會有半成品畫面
- **`related` 已定稿，不要再開補連結的輪次**：ch08 有 34 條孤立條目（心理技巧、理想表現狀態、喚醒理論那幾組），2026-08-08 的缺口方向輪已證實那是內容自足、全書沒有依賴它們的條目，不是刪過頭。加連結用 `tools/cscs_gap_apply.py`（吃 `來源 id -> 目標 id` 清單），減連結用 `tools/cscs_related_apply.py`
- **完成後立即更新 HANDOFF**：push + CI 確認後，下一步必須更新 HANDOFF.md（勾選已完成項目、更新下一步建議），不等使用者提醒

---

## 部署

```bash
# push 後 GitHub Actions 自動建置部署
git add . && git commit -m "..." && [push 指令見下]
```

Push 指令（Windows credential manager 問題，需繞過）：
```bash
TOKEN=$(gh auth token) && git remote set-url origin "https://$TOKEN@github.com/Hangsau/cortex.git" && GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=credential.helper GIT_CONFIG_VALUE_0= git push origin hugo-source && git remote set-url origin "https://github.com/Hangsau/cortex.git"
```

push 後執行 `gh run list --repo Hangsau/cortex --limit 1` 確認 CI 成功。

**驗線上頁面時：CI 產出的 HTML 是 minify 過的，屬性值沒有引號**（`class=vx-read-concept`，不是 `class="vx-read-concept"`）。拿本機 `hugo` 建置的字串去 grep 線上頁面會**全部回 0，看起來像沒部署**——2026-09-04 心理層那次就是這樣誤判了一次。驗證正則要寫成 `class=vx-xxx\b`，或直接數 class 名的裸出現次數；另外用 Python 讀 curl 存下來的檔要明寫 `encoding='utf-8'`，Windows 預設 cp950 會讓中文字串比對無聲失敗。

**`curl` 一定要同時取 HTTP 狀態碼**（`-w "%{http_code}"`）。對一份 404 頁面 grep 回 0，和對一份正常頁面 grep 回 0，長得完全一樣——2026-09-04 查各式頁時用了 `/vortex/stroke/back/`（正確路徑是 `/vortex/backstroke/`），拿到 404 卻判成「這頁沒問題」，漏掉 12 筆空白列。**內容路徑以 `content/vortex/` 底下的實際資料夾名為準**（`backstroke` / `freestyle` / `breaststroke` / `butterfly`，不是 `stroke/<key>`）。連同上一段，通則是：**grep 回 0 不等於沒問題，先證明你抓到的是那份頁面。**
