# MAP — my-site (Cortex)

> 結構地圖，給冷啟動讀者（人／LLM）。格式與維護流程見 `C:\claudehome\CODEBASE_MAP_METHODOLOGY.md`。
> 行為規範見 `CLAUDE.md`；進度／待辦見 `HANDOFF.md`。
>
> `last_verified: 2026-09-26`（正式切換到新版當天全檔重寫；舊架構的 MAP 隨舊版封存於 git 標籤 `legacy-site-2026-09-26`）

---

## 1. 一句話定位 + 技術棧

個人知識網站：Vortex 游泳水感研究（主力）＋書房（肌動學、基礎生物力學、CSCS、大腦喜歡這樣學、UST、氣質）。
**Hugo 靜態站，無 theme**；所有版型、樣式、互動在 `next/`，由 `hugo.toml` 的 module mounts 組起來。
deploy：push `hugo-source` → GitHub Actions 跑資料產生器後 `hugo --minify` → GitHub Pages（`https://hangsau.github.io/cortex/`）。

---

## 2. 「要做 X → 去讀 Y」決策索引

| 你要做的事 | 動這裡 |
|---|---|
| 改全站顏色／字級／間距 | `next/assets/css/tokens.css`（只放變數；系列色 `.series-*`） |
| 改外殼（頂列、左側目錄、對照閱讀框、進度元件） | `next/layouts/baseof.html`、`_partials/site-head.html`、`_partials/{vortex,library}/rail.html`、`next/assets/css/shell.css` |
| 改全站首頁（書房） | `next/layouts/_partials/library/bookshelf.html` ＋ `next/assets/css/bookshelf.css` |
| 改 Vortex 首頁／泳式頁／知識點頁／清單 | `next/layouts/_partials/vortex/{home,stroke,unit,next-read,list}.html`；分派在 `next/layouts/vortex/page.html` |
| 改 Vortex 專頁（呼吸、週期化、ADM、心理、骨關節、動作圖譜） | `next/layouts/_partials/vortex/{breathing,periodization,adm-*,psychology-read,joints,movement}.html`；頁面檔在 `next/content/vortex/` |
| 課表與間歇計時（CSS 換算、衝刺%、HIIT 計時） | `_partials/vortex/workout.html`＋`next/assets/js/workout.js`＋`workout.css`；處方數字 `next/data/swim_rules.json`（`tools/sync_swim_rules.py` 從 swim-coach 規則表同步，勿手改） |
| 改 Vortex 內容（泳式、drill、誤區、技術分析…） | **不在此 repo**：改 `TheVortexProject/canonical/` → `tools/sync_vortex.py`（CI 自動） |
| Vortex 知識點雙向連結 | `tools/build_vortex_links.py` → `next/data/vortex_links.json`；測試 `tools/test_vortex_links.py` |
| 練習篩選軸（標籤／排序） | `next/data/drill_axes.yaml`；篩選邏輯 `next/assets/js/filter.js`（通用多軸，ADM 標準頁共用） |
| 加一本書進書房／改系列目錄 | `tools/build_library.py` → `next/data/library.json`；系列首頁版型 `_partials/library/series-home.html` 通用 |
| 改讀本章節呈現 | `_partials/library/reader-chapter.html`；解說圖 `next/layouts/_shortcodes/reading-*.html` ＋ `diagram.css` ＋ `diagrams.js` |
| 改 CSCS 章節頁／概念索引／選擇題／閃卡 | `_partials/library/cscs-{chapter,concepts,quiz,cards}.html`；頁面由 `next/content/library/essentials-of-strength-training/_content.gotmpl` 產生 |
| 改大腦喜歡這樣學／UST／氣質 | `_partials/library/{mnfl-technique,ust-chapter,ust-strategy,temp-article,temp-dimension,temp-quiz}.html` |
| 跨系列知識連結（讀本 ↔ CSCS ↔ Vortex） | `tools/crosslink_candidates.py` → `crosslink_judge.py`（MiniMax）→ `build_crosslinks.py` → `next/data/crosslinks.json`；呈現 `_partials/library/xl-templates.html` ＋ `study.js` |
| 閱讀陪伴（分鐘數、進度、接著讀、隨機短篇） | `next/assets/js/study.js`；短篇清單 `tools/build_starters.py` → `next/data/starters.json` |
| 舊網址轉址 | `tools/build_redirects.py` → `next/static/`；舊網址清單 `next/legacy_urls.txt`（勿覆寫） |
| 驗收 | `python -X utf8 next/specs/check.py <W>`（W1 W3–W8 L1 L3–L5 V2–V7 T1–T4 P4） |
| 派 M3 做結構性工作 | 規格寫 `next/specs/<W>.md`，`bash next/specs/run_queue.sh --only <W…>`（claude-m3-lite，驗收過才 commit） |

---

## 3. 檔案地圖

### 建置與分派
- `hugo.toml` — mounts：`next/{content,layouts,assets,data,static}`、`data/`、`content/library/{kinesiology,basic-biomechanics}`（排除 learning-map.md）、`content/vortex/{instructional,bridge,technica}`、`content/vortex/adm`（只剩 background.md）
- `next/layouts/page.html`／`section.html` → `_partials/library/dispatch.html`：系列首頁（路徑＝系列 path）→ series-home；`layout: reading-chapter` → reader-chapter；`reading-topics` → reader-topics；其餘依 `params.role` 找 `_partials/library/<role>.html`
- `next/layouts/vortex/page.html`／`section.html`：`role` 缺省時 有 `unit_id`→unit、section→reading-list、其他→article；否則 `_partials/vortex/<role>.html`
- `next/layouts/_partials/library/series-of.html`：依網址前綴找出所屬書房系列（決定系列色與左側目錄）

### 頁面來源（content adapters）
- `next/content/vortex/_content.gotmpl`：約 770 個 Vortex 知識點頁、6 泳式頁、8 清單頁
- `next/content/library/essentials-of-strength-training/_content.gotmpl`：24 章＋概念索引
- `next/content/library/{mind-for-numbers,uncommon-sense-teaching}/_content.gotmpl`、`next/content/temperament/_content.gotmpl`

### 資料產生器（CI 會跑前三支＋ check_learning_map）
- `tools/build_vortex_links.py`、`tools/build_library.py`、`tools/build_starters.py`
- `tools/build_crosslinks.py`（讀 `next/crosslinks/{units.json,judgments.jsonl,verify.jsonl}`；不在 CI，判斷要花 MiniMax）

### 前端
- `study.js`（對照閱讀插入、閱讀進度、接著讀、隨機短篇、今天試這一個）、`filter.js`、`diagrams.js`、`cscs.js`（遮答自測）、`cscs-quiz.js`、`cscs-cards.js`、`temp-quiz.js`、`planner.js`、`workout.js`（課表換算＋間歇計時器，Web Audio 提示音、Wake Lock）

---

## 4. 踩雷點 / 非顯而易見處

1. **`hugo server` 會把頁面寫進 `public/`，和 `check.py` 的建置互相清掉**：看畫面請 `hugo -d <暫存>/cortex --baseURL http://127.0.0.1:1319/cortex/` ＋ 靜態伺服器。
2. **`next/data/` 下只能放 Hugo 認得的資料格式**：放 `.txt` 會讓整站建置失敗（2026-09-26 `legacy_urls.txt` 事故）。
3. **自訂屬性的連結色**：`--link` 在 `:root` 算定後不隨系列色變；連結一律用 `var(--series)`。
4. **Hugo `index` 查不到 key 回空字串不報錯**：分類標籤、節點清單、來源 id 都要從資料讀並有 fallback（見 CLAUDE.md 內容規則）。
5. **printf 印數字要用 `%v`**：`%s` 會輸出 `%!s(uint64=170)`；`check.py` 全站檢查 `%!`。
6. **CSCS 中文章名不在 `data/cscs/chNN.yaml`**（有幾章是英文）而在 `next/data/cscs_titles.yaml`。
7. **`drills.yaml` 的 `deficiency_fixes` 是外部書本缺陷編號，不是動作序號**，不可拿來連 drill 與動作。
8. **對照閱讀與閱讀進度都以錨點為鍵**：讀本小節 `{#anchor}`、CSCS item id 改名會無聲打斷兩者。
9. **Vortex 的呼吸安全段落必須置頂且不可收合**；`check.py V3` 會擋。
10. **Windows Git Bash heredoc 寫 Python 時 `\n` 常被吃掉**：長片段改用檔案寫入工具寫成 .py 再執行。

---

## 5. 邊界 / 別碰

- **Vortex 內容真相源在 `TheVortexProject`**；`data/{vortex,adm,periodization,breathing,movement}/` 與 `content/vortex/{instructional,bridge,technica}/` 是同步產物，勿手改。
- **CSCS 內容真相源是 `data/cscs/`**（my-site 自有）；選擇題進度與 cscs-quest 桌面端互不相通。
- **舊站已移除**，需要時從 git 標籤 `legacy-site-2026-09-26` 檢出；不要把舊版型或舊 CSS 搬回 `next/`。
- Hugo 版本：CI 0.159.1（寫死在 deploy.yml），本機可能較新。
