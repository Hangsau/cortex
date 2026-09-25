# 共用背景（每張工作單都附上本段；工作目錄＝my-site repo 根目錄）

## 專案
my-site 是 Hugo 靜態網站（本機 `hugo` v0.162，CI v0.159.1）。正式站 baseURL `https://hangsau.github.io/cortex/`。
我們正在**從零建一個新版網站**，放在 `next/` 目錄，用獨立設定檔 `hugo.next.toml` 建置到 `public/next/`，
預覽網址 `https://hangsau.github.io/cortex/next/`。

**絕對禁止**：
- 讀取、複製、參考舊版 `layouts/`、`static/css/`、`static/js/` 的任何內容（新版必須從零寫）
- 修改 `data/`、`content/`、`layouts/`、`static/` 底下任何既有檔案
- 任何 git 指令

## 新版目錄
```
hugo.next.toml                 建置設定（W3）
tools/build_vortex_links.py    產生知識點連結索引（W1）
next/data/vortex_links.json    W1 產物，Hugo 內以 hugo.Data.vortex_links 讀取
next/content/                  新版內容（W4 用 content adapter 產生頁面）
next/layouts/                  新版版型
next/assets/css/tokens.css     設計 token（已寫好，不准改）
next/assets/css/shell.css      外殼樣式（已寫好，不准改）
next/assets/css/<頁型>.css     各頁型樣式（各工作單自己建）
next/assets/js/                互動 JS
```
CSS／JS 一律放 `next/assets/`，在版型中用 `resources.Get` 取得並 `| fingerprint` 後輸出 `.RelPermalink`。
所有站內連結用 `relURL` 或頁面 `.RelPermalink`，不可寫死 `/cortex/`。

## 設計規範（違反即驗收失敗）
- 只用 tokens.css 的變數：顏色 `--paper --ink --ink-2 --rule --tint --series --link`；字級只用 `--fs-s/m/l/xl`；間距用 `--s1..--s6`
- 長段文字容器加 class `read`（襯線、行高 1.8）；正文欄寬用 `.page`（已限制約 36 字）
- 不准：`!important`、inline `style=` 屬性、陰影、圓角大於 4px、emoji 圖示、hover 位移動畫、`font-style: italic` 用在中文
- 點擊目標（連結列、按鈕、summary）最小高度 `var(--tap)`
- 手機 320px 寬不得出現水平捲動
- 每頁 `<body class="series-vortex">`（Vortex 頁）
- `<html lang="zh-Hant">`，標題層級不跳級（h1→h2→h3）

## 內容呈現鐵則（違反即驗收失敗）
1. **有標題就要有內容**：區塊標題只在該欄位實際有非空值時才輸出。判空用 `{{ with }}`，字串先 `plainify | strings.TrimSpace` 再判
2. **絕不把 map 直接印出**（會出現 `map[...]`）。欄位可能是字串、清單或 map，一律交給共用 partial `next/layouts/_partials/value.html`（W5 建立）遞迴處理
3. 不用 Hugo 的 `.Summary`
4. 文字欄位一律過 `markdownify`（資料中有 `**粗體**`）
5. `certainty`、`verification_status: unverified` 等確定性標記要顯示，不可省略；`unverified` 顯示「未查證」
6. 呼吸、安全相關內容不可預設收合（本批次不涉及呼吸頁，但原則保留）

## Vortex 資料（`data/vortex/*.yaml`，唯讀）
| 單位 type | 來源 | id | 標題欄 | 數量 |
|---|---|---|---|---|
| move | `free.yaml back.yaml breast.yaml fly.yaml udk.yaml starts-turns.yaml` 的 `moves[]`（欄位 n,name,one,l,physical,boundary,drills,lnote,cue_bad,cue_why,cue_good）；頂層 `premise` 是該式導言字串 | `{stroke}.move.{n}`，stroke＝檔名去 .yaml | name | 51 |
| drill | `drills.yaml` 的 `drills[]`（id,name_zh,name_en,strokes,category,equipment,l_target,purpose_zh,how_to,perception_goal,success_signal,failure_signal,deficiency_fixes,difficulty_tier,source_ids…）；`categories[]` 有 key,name_zh | id（如 `Fr1`） | name_zh | 179 |
| tech | `technical-analysis.yaml` 的 `points[]`（id,stroke,category,title,nav_zh,summary,mechanism,practical_implication,perception_signal,evidence,cross_ref_ids）；`categories[]` | id（如 `free.tech.4`） | nav_zh 優先，否則 title | 222 |
| error | `teaching-errors.yaml` 的 `errors[]`（id,stroke,category,title,misconception,physical_reason,correct_concept,perception_impact,evidence,cross_ref_ids）；`categories[]` | id（如 `free.err1`） | title | 104 |
| problem | `problems.yaml` 的 `problems[]`（id,stroke,category,title,observable,mechanism_summary,links{technical_analysis[],drills[],interventions[],water_interventions[]},cross_ref_ids）；`categories[]` | id | title | 73 |
| injury | `injuries.yaml` 的 `injuries[]`（id,zh,en,category,mechanism,epidemiology,risk_factors,prevention,management,links{mechanism_link_ids,technical_link_ids,perception_link_ids},…）；`categories[]` | id | zh | 47 |
| level | `water-sense-levels.yaml` 的 `levels[]`（id,stroke,level,name_zh,tagline,description,indicators,methods[{name,detail,cue}],stagnation,milestone） | id（如 `free.L0`、`breast.pre`） | name_zh | 26 |
| psy | `psychology.yaml` 的 `themes[]`（id,name_zh,nav_zh,when_zh,lead_zh,premise,concepts[]） | id（如 `psych.fear`） | name_zh | 8 |
| psyc | 上述每個 theme 的 `concepts[]`（id,name_zh,phenomenon,misconception_refs[{cue,why,better}],intervention_refs[{name,certainty,how_to}],l_levels） | id | name_zh | 62 |

泳式 key 與中文名：`free` 自由式、`back` 仰式、`breast` 蛙式、`fly` 蝶式、`udk` 水下海豚腿、`starts-turns` 出發與轉身。
drill 的 `strokes` 用另一套值：`freestyle→free`、`backstroke→back`、`breaststroke→breast`、`butterfly→fly`、`underwater_dolphin_kick→udk`、`starts_turns→starts-turns`。

## 網址規則（W1 算好寫進 JSON，其他單照用）
| type | 路徑（相對站根，不含 baseURL） |
|---|---|
| move | `vortex/moves/{stroke}-{n}/` |
| drill | `vortex/drills/{slug}/` |
| tech | `vortex/tech/{slug}/` |
| error | `vortex/errors/{slug}/` |
| problem | `vortex/problems/{slug}/` |
| injury | `vortex/injuries/{slug}/` |
| level | `vortex/levels/{slug}/` |
| psy / psyc | `vortex/mind/{slug}/` |
| 泳式樞紐頁 | `vortex/{stroke}/` |
| 集合清單頁 | `vortex/drills/`、`vortex/tech/`、`vortex/errors/`、`vortex/problems/`、`vortex/injuries/`、`vortex/levels/`、`vortex/mind/` |

slug＝id 轉小寫，`.` 與 `_` 換成 `-`。
