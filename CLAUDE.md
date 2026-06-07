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
      ch01/ ... ch24/       # 每章 layout: chapter，含 8 個 .md
      highlights.md
      notes.md
  notebook/                 # 個人筆記
    coaching/
    ideas/
layouts/
  _default/                 # baseof、list、single
  partials/                 # nav、footer
  library/                  # list（書庫列表）、book（單書頁）、chapter（九宮格）、single
  notebook/                 # list、single
  shortcodes/               # flashcard、highlight-quote、callout
static/
  css/
    variables.css           # 只放 CSS 變數
    base.css                # reset + 基礎排版
    layout.css              # nav/main/footer 結構
    bookshelf.css           # 首頁書架樣式
    library.css             # 書庫 section 樣式
    cscs-chapter.css        # 九宮格 + 閃卡樣式（從 cscs-study 移植）
    notebook.css            # 筆記本樣式
  js/
    flashcard.js            # 閃卡翻轉（單一功能）
  images/
    cscs-cover.jpg
data/
  books.yaml                # 書目索引（slug 對應 content/library/ 資料夾名）
  flashcards/
    ch01.json ... chXX.json # 每章閃卡資料（q / a / tag）
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

- 矩陣與標準頁皆用 `.Site.Data.adm.matrix` / `.Site.Data.adm.standards` 讀資料。
- 階段中文名 / 年齡對照（L2T 學習訓練、T2T 訓練為訓練、T2C 訓練為競賽、T2W 訓練為勝利）寫死在 `vortex-adm-matrix.html` 的 dict。
- 內容修改不在此 repo 手改 `data/adm/`：改 canonical（TheVortexProject/canonical/development/）後重跑 `tools/sync_vortex.py`。
- ADM 專用樣式併入 `static/css/vortex.css`（`.vx-adm-*`），無獨立 adm.css / adm-matrix.js。

### 自訂風格書籍設計模式（如 大腦喜歡這樣學）

當一本書需要獨立視覺風格（不沿用 CSCS 九宮格或 ADM 矩陣），使用以下模式：

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

### 加新 CSCS 章節閃卡
- 閃卡資料來源是 **Google Sheets CSV**，Hugo build time 透過 `resources.GetRemote` 抓取
- Sheet URL 設定在 `hugo.toml` → `params.cscsFlashcardsCSV`
- Sheet 欄位：`chapter, question, answer, tag`（第一列是 header）
- 新增閃卡：往該 Sheet **append 新列**，`chapter` 填章節 ID（如 `ch01`）
- 可用 `google-docs-mcp` 的 `appendRows` 工具直接寫入
- **不再使用** `data/flashcards/` 本地 JSON 檔
- **寫閃卡注意**：answer 欄位不能以 `=` 開頭，Google Sheets 會解析為公式（導致 #ERROR!）。用 `valueInputOption: RAW` 或改寫句子避開
- **寫完 Sheets 後必須 push**：Hugo 是 build time 抓 CSV，Sheets 更新後網站不會自動反映，一定要 push 一個 commit 觸發 CI rebuild，閃卡才會出現在網站上
- **數量基準**：每章目標約 52 張（以 ch01 為標準）；寫完後主動比較同章節現有數量，若明顯偏少（<48）應補充，不等使用者提問
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
