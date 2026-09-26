# my-site (Cortex) — CLAUDE.md

## 專案定位

個人知識網站，Hugo 靜態網站生成器。
網址：`https://hangsau.github.io/cortex/`
Repo：`Hangsau/cortex`，branch：`hugo-source`

- **Vortex（主力）**：游泳水感研究。給使用者本人查閱，也給任何拿到連結的人（初學者、家長、選手、教練、路人）讀；**不導流**（不問身分、不分流），靠頁內由淺到深與知識點連結讓人讀下去。
- **書房（其他系列）**：兩冊肌肉骨骼讀本、CSCS、大腦喜歡這樣學、UST、氣質。主要給使用者本人，每個系列各自有入口與相關連結；介面要讓容易拖延的人願意開始、讀得下去。
- 2026-09-26 全站從零重做並正式切換。**舊版封存於 git 標籤 `legacy-site-2026-09-26`**（舊 `layouts/`、`static/`、`data/home.yaml` 已移除）。規劃書：`research/redesign-2026-09-24/PLAN.md`。

原始書檔（Markdown）在 `C:\claudehome\resources\books\`，不在此專案內。

---

## 架構速查

```
hugo.toml                    建置設定：module mounts（見下）；baseURL /cortex/
next/
  layouts/
    baseof.html              外殼：頂列、左側目錄（Vortex 或書房系列）、頁尾載入 study.js 與對照閱讀
    page.html / section.html → _partials/library/dispatch.html（書房分派）
    home.html                → _partials/library/bookshelf.html（全站首頁＝書房）
    vortex/page.html|section.html  Vortex 分派：role 參數 → _partials/vortex/<role>.html
    _partials/
      library/               series-home、reader-chapter、reader-topics、bookshelf、rail、series-of、
                             xl-templates、cscs-*、mnfl-technique、ust-*、temp-*、reader-map …
      vortex/                home、stroke、unit、next-read、list、rail、article、reading-list、
                             breathing、periodization、adm-*、psychology-read、joints、movement …
      value.html             遞迴渲染任意資料值（map 不可直接印）
    _shortcodes/             讀本解說圖（reading-*，SVG＋拉桿）
  content/                   新版專屬頁面（content adapter `_content.gotmpl` 產生 Vortex 知識點頁、CSCS 章節頁等）
  assets/css/                tokens.css（設計參數）、shell.css（外殼＋共用元件）、各頁型 CSS
  assets/js/                 study.js（閱讀陪伴＋對照閱讀插入）、filter.js（通用多軸篩選）、
                             diagrams.js、cscs-quiz.js、cscs-cards.js、temp-quiz.js、planner.js …
  data/                      產生物：vortex_links.json、library.json、starters.json、crosslinks.json；
                             手管：drill_axes.yaml（練習篩選軸標籤）、cscs_titles.yaml（CSCS 中文章名）
  static/                    舊網址轉址頁（tools/build_redirects.py 產生）
  specs/                     工作單規格、check.py（全部驗收）、run_queue.sh（M3 派工佇列）、STATUS.md
  crosslinks/                跨系列連結的候選、判斷、複審原始資料
  legacy_urls.txt            舊站 121 個網址（切換前最終版，勿覆寫）
content/                     仍掛載的 canonical Markdown：library/{kinesiology,basic-biomechanics}、
                             vortex/{instructional,bridge,technica}（sync_vortex 同步）、vortex/adm/background.md
data/                        canonical 資料：vortex、adm、periodization、breathing、movement（sync_vortex 同步，勿手改）；
                             cscs、reading、mnfl、ust、temperament（my-site 自有）
tools/                       build_vortex_links、build_library、build_starters、crosslink_candidates／judge、
                             build_crosslinks、build_redirects、sync_vortex、cscs_*、reading_check …
```

---

## 授權範圍

- 此專案內所有檔案可直接修改，不需詢問確認

---

## 工作守則

### 新版網站的根本規則（為什麼要守：舊站每次改版都退回修修補補）

2026-09 以前，不論換哪個模型都只會修補舊頁面，根因是四個錨點：CLAUDE.md 把版面決定寫成規則、驗收腳本斷言舊結構、每本書各有自己的 layout／CSS、HANDOFF 待辦全是修補項。新版已拆掉這些錨點，**不准再長回來**：

- **全站只有四種頁型**：文章（`lib-chapter`／`lc-*`）、條目（`lib-entry`／`le-*`）、清單與系列首頁（`lib-series`／`ls-*`）、工具。**任何系列都不准有專屬版型或專屬視覺風格**（舊站 mnfl／ust 的書法字、手寫字、emoji 卡片即反例）；系列識別只用系列色（`.series-vortex|strength|learning|temperament`，左緣色帶與強調色）。
- **加新內容＝加資料或 Markdown，不是加版面**：新書進書房 → `tools/build_library.py` 加一個 series（章、條目、工具）＋ content adapter 或掛載；版型沿用四種頁型。真有新互動才加工具頁。
- **視覺設計由 Claude 親自做，不外包**。M3／codex 只接資料處理與結構性工作單（規格見 `next/specs/`），產出一律由 `check.py` 驗收＋ Claude 抽查畫面（2026-09-26 抽查抓到多個驗收漏網的 M3 缺陷）。
- **設計參數只改 `next/assets/css/tokens.css`**；共用元件在 `shell.css`；各頁型一個 CSS。不寫 inline style、不用 `!important`、無陰影卡片、圓角 ≤4px、點擊目標 ≥ `--tap`（48px）、320px 無水平捲動。
- **做完頁面要有入口**：新頁必須從首頁或左側目錄點得到（2026-09-26 Vortex 七個專頁建好卻漏接導航；P4 有孤兒頁檢查）。
- 規劃書與脈絡：`research/redesign-2026-09-24/PLAN.md`（v2）。

### 資料流與建置

- CI（`.github/workflows/deploy.yml`）：`check_learning_map.py` → `build_vortex_links.py` → `build_library.py` → `build_starters.py` → `hugo --minify`。本機改了讀本、CSCS、書房系列後照同順序重跑再建置。
- `build_vortex_links.py`：Vortex 雙向知識連結（move→drill 以中文名、drill→級別、cross_ref、problem／injury links、心理概念→主題）。**`deficiency_fixes` 是外部書本缺陷編號，不是動作序號，不建連結**。
- 跨系列連結（讀本 ↔ CSCS ↔ Vortex）：`crosslink_candidates.py` → `crosslink_judge.py`（MiniMax 逐對判斷；低分段 `--verify-below 0.08` 嚴格複審）→ `build_crosslinks.py`。**只連真正講同一件事的，不硬連**（使用者 2026-09-26 定調）。內容大改後才需重跑，費用在 MiniMax。
- 閱讀陪伴（`study.js`）：每節分鐘數、讀完打勾、進度條、接著讀、書房隨機短篇（`starters.json`）、系列首頁「今天試這一個」。只存本機 localStorage；**不做連續天數與催促**。

### 驗收（改完必跑）

```bash
python -X utf8 next/specs/check.py <W>   # W1 W3–W8 L1 L3–L5 V2–V7 T1–T4 P4，全部要 PASS
python -X utf8 tools/build_redirects.py   # 舊網址 121 筆必須全數對應（新站同路徑或轉址頁）
```
- `P4`：全站站內連結與錨點零錯誤、無孤兒頁（`/library/` 為舊網址書房落點，豁免）。
- 看畫面：`hugo --baseURL http://127.0.0.1:1319/cortex/ -d <暫存>/cortex` 後用靜態伺服器＋ Playwright 截圖；**不要用 `hugo server` 寫 `public/`**（會和驗收互相清掉）。

### 命名規範
- 檔案名：kebab-case
- CSS class：kebab-case，依頁型前綴（`lc-` `ls-` `le-` `st-` `xl-` `vh-` …）
- Hugo template 變數：PascalCase 或 camelCase 皆可，同檔一致

### 內容規則（與版面無關，新版仍適用）

以下各段是資料與內容層的鐵則。段落中提到的舊版型檔名（`vortex-*.html`、`layouts/vortex/…`）已由 `next/layouts/_partials/vortex/` 的對應 partial 實作；規則本身不變。

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

### 骨關節動作章：一份內容兩個入口

`technical-analysis.yaml` 裡 `category: joint` 的條目同時出現在知識點頁（`vortex/tech/…`）與 `vortex/joints/`（依 `joint_region` 分組）——**只有一份資料、一個 ID**。橫跨多式的主題（呼吸、傷害、關節、動作圖譜）都要在 Vortex 左側目錄有入口，不能只靠各式頁內的連結。左欄與分組卡一律用 `nav_zh`，沒有才 fallback 到 title。

### `sync_vortex.py` 的 YAML 輸出只走 `dump_yaml()`，不直接呼叫 `yaml.safe_dump`

canonical 的散文用摺疊純量（`>-`）在檔案裡折行以便閱讀，**YAML 規範把每個折點接成一個空白**——那條規則是為空白分詞的語言訂的。中文沒有詞間空白，所以每個折點在網站上都是句子中間一個看得見的空格。2026-09-05 實測：線上 `psychology-read` 單頁 848 處、`database` 頁 1244 處，全部 vortex 資料 1995 處。

**修在 sync 層，不改 canonical**：折行是作者為了可讀性寫的，空白是序列化副產物，不是內容。`dump_yaml()` 在 dump 之前遞迴接掉它，13 個輸出點全部走這個口；**新增 `sync_*` 函式時照走，不要另開 `yaml.safe_dump`**，否則新資料會帶著空格出站而沒有任何地方會擋。

兩條規則刻意分開，都不能放寬：

- **一般字元只認漢字／假名／中文標點兩側**。全形符號兩側的空白是作者有意的排版（`可見方向 ＋ 解剖動作`、`563 件傷害 ／ 2,171,260 次暴露`），所以 `＋＝＜＞／` 這類不進字元集——修完剩下的 2 處正是這兩筆，那是正確狀態不是漏網。
- **破折號另立一條，且只認成對的 `——`**。中文的 `——` 一律成對、兩側不留空白，緊鄰它的空白必定是折點（116 處）。但**單一 `—` 在本庫是有意的分隔符**（`頭帶平衡 — 面朝下`），一起接掉會改掉作者的排版。

### 中文頁面禁用 Hugo 的 `.Summary`，卡片摘要一律取 front matter 的 `description`

**Hugo 的自動摘要是照「詞數」切的**（預設 70 字），中文沒有詞間空白，整頁被算成一個詞——`.Summary` 回傳的不是摘要而是**整頁純文字**，連表格攤平、`&amp;mdash;` 這種二次跳脫、換行都一起倒出來。2026-09-05 線上實測：查資料頁 28 張散文卡片各吐 300–1541 字。

規則：卡片／清單的摘要取 `.Description`，沒有才 `truncate`。`.Summary` 只有在該頁明確寫了 `<!--more-->` 時才可信，本站沒有任何一頁這樣寫。搜尋索引用的 `data-text` 不受此限——它本來就該吃整頁 `.Plain`。

同一類的還有 `{{ with .Summary }}`：**內容寫死在 layout 的頁面**（如 `water-sense-guide.md`，body 只有一段 HTML 註解）`.Summary` 非空、`plainify` 後卻是空字串，`with` 擋不住，卡片就印一個空的 `<p>`。要判空一律先 `plainify` 再判。

### 「有標題沒內容」是本站最常見的渲染缺陷，標籤一律綁在內容上

`{{ with .physical_reason }}<span>物理原因</span><p>{{ .text }}</p>{{ end }}` 這種寫法，只要區塊存在就印標題——但區塊可能只有 `certainty` 與不對外輸出的 `observation_basis`，讀者拿到的是**標籤加一片空白**，會以為內容漏掉。2026-09-05 線上 20 頁全掃一次抓到四類（傷害頁 Go map 12 筆、各式頁「口訣校正」12 筆、查資料頁卡片 1 筆、週期化表格 1 格）。

- **標題／格子綁在實際會印出來的那個欄位上**，不綁在父區塊存在上。
- **巢狀 map 不可以用裸 `{{ . }}`**——Hugo 會把 Go 的 `map[k:v]` 字面印給讀者。逐子鍵給標籤（見 `vortex-injuries.html` 的 `ability.para` / `lifecycle`）。
- **資料真的沒有那個值時，補在 canonical、不要在 layout 硬編 fallback 字串**（多巔峰型的 `peaks_note_zh` 是這樣處理的）。
- 稽核作法：curl 全部頁面（**先確認 HTTP 200**），掃 `map[`、空 `<div>`／`<span>`／`<p>`／`<td>`。`vx-flow` 的撐位 span、CSS 畫的 caret、JS 填的 `vxFindCount`／`vxNeedsCount` 是正當的空元素，不要修。

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

**驗收閘（改完必跑）**：

```bash
python tools/cscs_check.py            # 交叉參照 / 重複 id / numbers 完整性；有錯 = 失敗，不是待辦
python -X utf8 next/specs/check.py L3 # 網站：章節頁、錨點、術語常駐、相關連結、概念索引
```

- **術語一律常駐可見**，不准塞進 hover 或 details——使用者的原始痛點就是「只有英文沒有中文」，藏起來等於沒解決；定義本身才進展開層
- **概念軸是第二條閱讀動線**：`concepts` 只能挑 `_concepts.yaml` 的 22 條，且**一條概念至少橫跨兩章**才准存在（只在單章的概念＝把該章抄一遍）。批次上標用 `tools/cscs_tag_concepts.py`（主題級、不覆寫既有值）
- **補完進度（2026-08-08 實測）**：24 章全數對帳完成——`detail` / `concepts` / `locator` 各 **1557/1557**、cards 1252 張、`related` 1908 條（跨章 95.6%）。`terms` 1437/1557、`numbers` 514（這兩欄不是覆蓋率目標：沒有英文專有名詞就不掛 terms，沒有數字就不掛 numbers）。欄位空著時深度層自動不渲染，不會有半成品畫面
- **`related` 已定稿，不要再開補連結的輪次**：ch08 有 34 條孤立條目（心理技巧、理想表現狀態、喚醒理論那幾組），2026-08-08 的缺口方向輪已證實那是內容自足、全書沒有依賴它們的條目，不是刪過頭。加連結用 `tools/cscs_gap_apply.py`（吃 `來源 id -> 目標 id` 清單），減連結用 `tools/cscs_related_apply.py`
- **完成後立即更新 HANDOFF**：push + CI 確認後，下一步必須更新 HANDOFF.md（勾選已完成項目、更新下一步建議），不等使用者提醒

#### 考點軸與實務判斷層（第三、四條動線，2026-09-11）

`_domains.yaml` 是考點軸：7 個 domain × 章節對映 + 官方考試權重。**它不放章節標題**——標題的真相源是
`chNN.yaml`，抄一份副本，章節改名這裡就無聲漂移（同「分類標籤一律從資料讀」那條鐵則）。權重已於
2026-09-11 用 `resources/raw/pdf/inbox/` 的兩份官方 PDF 一手核對（`verification: verified`，來源檔名與
頁碼在 `meta.source_files`）。`cscs_check.py` 會斷言每章不重不漏地分進恰好一個 domain——漏一章，按
權重配題就靜默少算一章。

- **domain id 用 section 前綴（`sf1`–`sf3` / `pa1`–`pa4`）不用連號 `d1`–`d7`**。官方 DCO 的 domain
  編號在兩個 section 各自從 1 起算，拉平成連號是本檔前一版自己發明的，對照官方文件時會錯位。
- **`cognitive`（recall / application / analysis）是官方逐 domain 給的認知層級配題，不是估計值**，
  `cscs_check.py` 斷言三項合計等於該 domain 的 `scored`。它比 `scored` 更能決定怎麼讀：全卷只有
  23% 是純記憶題，`pa1-program-design` 是 2/44、`pa4-organization` 是 11/16。把 `chNN.yaml` 的事實
  背熟只覆蓋得到記憶題那一段，其餘四分之三要靠 `_applied.yaml` 的判讀規則。
- **一手核對推翻了前一版七個 domain 裡的六個**，其中 `pa2-exercise-technique` 從二手的 40 題改成
  官方的 28 題，把「考得多讀得少」那面旗整個抹掉（真實 drift 只有 +1.0）。舊的二手數字不要再用。

`_applied.yaml` 是實務判斷層，抽取單位是**題型 + 判讀規則 + 課本缺口，不是題目**。外部來源（讀書會
情境討論）的原文與作者一律不落盤，只留去識別化的參數輪廓；這既是「內容要吸收後再寫」那條規則，
也是結構限制——貼文沒有 `locator`，本來就進不了 `data/cscs/`。

- **`answering_protocol` 是這份檔案最重要的部分，答題前先讀它**。第 0 步是 grep `data/cscs/` 找對應
  條目，先於任何推理。2026-09-11 一天內三次錯答的共同根因就是憑外部一般框架推理而沒查本庫，其中
  一次還主動論證「正解是錯的」，而正解就寫在 `ch13.balance-flexibility-bc.i02` 的 `detail` 裡。
- **判斷錯了就寫進 `meta.revisions` 與 `correction_note`，不要靜默改掉**。修正紀錄本身是判讀規則的
  來源：`reasoning_chain` 裡的「常模族群對齊」「發力向量對應」兩步、以及取代「缺口數量與分布」的
  「缺口嚴重度排序」，全部是踩過之後補的。被撤除的規則要留 `supersedes` 說明它為什麼會導致反向。
- **缺口至少橫跨兩章**（`cscs_check.py` 有斷言）：單章的是待補內容，跨章的接縫才是缺口。

出題用 `python tools/cscs_quiz.py`（預設 190 題，照 `_domains.yaml` 的 `scored` 配比，每題帶 `locator`）。
兩條刻意的設計，改之前先讀工具 docstring：**干擾項取自同章但不同主題**（同主題的兄弟條目常在講同一
概念的不同面向，會出現三個選項同時成立的廢題）；**數字干擾項要過同單位 + 五倍內的量級閘**（否則
「年度訓練計畫的持續時間」會配到「2004 年」這種送分選項）。生成的答案區會印每個干擾項的來源 id，
看到可疑的回去讀那兩條，不要靠工具猜。

#### 網站版選擇題練習與閃卡（`next/layouts/_partials/library/cscs-quiz.html`、`cscs-cards.html`）

題庫 `data/cscs/_quiz_bank/` 的網站消費端，全庫 1033 題可在手機作答。兩條設計不要改回去：

- **題目按章發成 24 支 `quiz/chNN.json`**（`resources.FromString`），前端選哪章才 fetch 哪章；全庫嵌進 HTML 的話手機每次開頁都得先吞完整題庫。跨章組卷是 cscs-quest 桌面端的事。
- **選項重排在前端出題當下做，JSON 維持原檔順序**。原檔 1033 題有 1015 題把正解寫在第一個，照原序出等於答案永遠是 A。
- 網址參數 `?ch=chNN|random&n=5`：直接選章、打亂取前 n 題開始（書房首頁「CSCS 隨機五題」用）。

作答紀錄在 `localStorage('cscs-quiz-next-v1')`，**與 cscs-quest 的 SQLite 學習進度互不相通**。回課本的連結靠章節頁每個 item 的 `id="<item-id>"`，改章節頁錨點會無聲打斷它（也會打斷跨系列對照閱讀）。

---

## 部署

### 肌肉骨骼中文讀本（2026-09-06）

- 中文正文 canonical 在 `content/library/kinesiology/chNN/index.md` 與 `content/library/basic-biomechanics/chNN/index.md`（由 `hugo.toml` 掛載）；類型 `chapter-guide`，不是全譯。小節 ASCII 錨點與章 ID 不隨重排改名——**跨系列對照閱讀與閱讀進度都以這些錨點為鍵**。
- 章序、書目、PDF 頁範圍 canonical 在 `tools/book_sources.py` 的 BOOKS；`python tools/book_sources.py audit` 生成 `data/reading/books.json` 和來源清冊。不得改 `resources/books` 或原 PDF。
- 主題、術語、同義詞、跨書對照分別在 `data/reading/{topics,terms,search,pairings}.json`；`python tools/reading_check.py --write-index` 由章文生成 `index.json`（小節來源與反向索引），不手改生成檔。
- 每節用 `reading-source` shortcode 標示實體 PDF 頁次；解說圖 shortcode 在 `next/layouts/_shortcodes/reading-*.html`，樣式 `next/assets/css/diagram.css`，拉桿互動 `next/assets/js/diagrams.js`（讀本章節容器帶 `rd-page` class 才會啟用）。
- 必跑 `python tools/reading_check.py`、`python -X utf8 next/specs/check.py P4`。`tools/book_reader.py` 在 127.0.0.1 提供固定兩書原頁（本機工具，與公開站無關）。

### 發佈流程

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
