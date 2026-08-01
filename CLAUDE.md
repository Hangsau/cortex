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
      highlights.md
      notes.md
  notebook/                 # 個人筆記
    coaching/
    ideas/
layouts/
  _default/                 # baseof、list、single
  partials/                 # nav、footer
  library/                  # list（書庫列表）、book（單書頁）、chapter（暗記帳文件版型）、single
  notebook/                 # list、single
  shortcodes/               # flashcard、highlight-quote、callout
static/
  css/
    variables.css           # 只放 CSS 變數
    base.css                # reset + 基礎排版
    layout.css              # nav/main/footer 結構
    bookshelf.css           # 首頁書架樣式
    library.css             # 書庫 section 樣式
    cscs-chapter.css        # 章節頁（黏性目次正文 + 遮答自測 + 閃卡）與 book.html 的 .home-grid
    notebook.css            # 筆記本樣式
  js/
    flashcard.js            # 閃卡翻轉（單一功能）
  images/
    cscs-cover.jpg
layouts/library/
  cscs-concepts.html        # 概念索引頁（打散章節，照概念讀）
layouts/partials/
  cscs-index.html           # 全書 id → 標題/網址 索引（wiki 連結用，partialCached）
data/
  books.yaml                # 書目索引（slug 對應 content/library/ 資料夾名）
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
2. 在 `data/books.yaml` 加一筆（含 slug、color）
3. 封面圖放 `static/images/covers/`

### Vortex 分類標籤：一律從資料讀，禁止在 layout 硬編

`data/vortex/*.yaml` 每份都自帶 `categories` 區塊（真相源在 TheVortexProject 的 canonical / `Drills/_categories.yaml`），layout 用 merge 取標籤：

```
{{ $catName := dict }}{{ range (index hugo.Data "vortex" "drills").categories }}{{ $catName = merge $catName (dict .key .name_zh) }}{{ end }}
```

（`injuries.yaml` 的欄位名是 `.id` / `.zh`，其餘是 `.key` / `.name_zh`。）

**為什麼是鐵則**：Hugo 的 `{{ index $dict .key }}` 查不到 key 會回**空字串且不報錯**。硬編一份副本，canonical 一加新分類，頁面標籤就無聲消失——2026-07-26 一次抓到兩起（starts-turns 頁 9 張 drill 卡標籤全空、傷害資料庫三個標籤文字漂移）。canonical 側有 E009 擋「條目用了沒宣告的 category」，但擋不住 layout 自己抄一份。

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
- 補完進度：ch01 已補（68 條全滿），ch02–ch24 只有骨架（`detail`/`terms`/`numbers` 空著時深度層自動不渲染，不會有半成品畫面）
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
