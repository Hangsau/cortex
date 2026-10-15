# Vortex 第七項技能頁：開放水域與鐵人

日期：2026-10-15。工作目錄：`C:\claudehome\projects\my-site`。

已完成同步、索引、導航、建置與驗收。新頁沿用既有 `role=stroke`，全名「開放水域與鐵人」，短導航「開放水域」，排在 `starts-turns` 之後。沒有新增頁型、CSS 或 inline style；沒有 git 寫入、部署或上游檔案修改。

## 修改檔案與原因

| 檔案 | 修改與原因 |
|---|---|
| `tools/sync_vortex.py` | `DRILL_STROKES` 原本已含 `open-water`，`sync_moves()` 原本已按 canonical strokes 自動產檔。本次補上只有 `links.drills` 的動作：將 ID 清單帶入既有 `drills` 欄位，避免新動作的練習連結在同步時被剝除；既有中文名清單保持相容。所有 YAML 仍經既有 dump／原子寫入流程。 |
| `tools/build_vortex_links.py` | `MOVE_FILES`、`DRILL_STROKE_MAP`、`NO_LEVEL_STROKES` 加入第七項技能；加入全名與 `nav_zh`；practice 邊先解析精確 drill ID，再解析既有中文名。 |
| `next/layouts/_partials/vortex/home.html` | 新增第七張技能入口卡與 `open_water` 計數對照；文案改為七項游泳技能。 |
| `next/layouts/_partials/vortex/rail.html` | 左欄增加第七項，使用短導航標籤，展開本技能的動作連結。 |
| `next/layouts/_partials/vortex/list.html` | 新增技能標籤、篩選值、順序與 drill 標籤對照；修正兩次排序覆蓋技能順序的問題，並依 drill 所屬技能排序，讓開放水域實際排在起跳轉身後。 |
| `next/layouts/_partials/vortex/stroke.html` | `open_water` 對應 `open-water`，讓新頁列出全部 15 個 drill。 |
| `next/layouts/_partials/vortex/movement.html` | 補上開放水域中文標籤，避免未來有此技能需求時印出英文 key。 |
| `next/layouts/_partials/library/bookshelf.html` | 全站首頁／書房入口加入第七項，使用短導航標籤。 |
| `next/content/vortex/_content.gotmpl` | 原本已依索引生成技能頁，無需另一套頁面定義；註解更新為七頁。 |
| `next/specs/check.py` | 七項技能驗收、最新數量與 126 條 practice 邊；空誤區區塊按資料判斷；檢查開放水域全名、premise、練習與無空誤區／L 級區塊。不帶參數可跑全部 W。建置改為每次執行獨立暫存目錄，避免清除／覆寫 `public/`。 |
| `tools/test_vortex_links.py` | 更新數量、技能順序、短／長標籤與 drill 標籤對照；驗證新增動作的 ID practice 邊。 |
| `tools/test_sync_problems.py` | 真實來源的問題數量斷言由過期的 73 改為 84，涵蓋上游 A、B 共新增 11 個問題。 |
| `next/specs/W1.md`、`W4.md`、`W6.md`、`W7.md`、`W8.md`、`_context.md` | 同步七項技能、ID／中文名參照、數量與順序規格。 |
| `research/content-presentation-2026-09-05/inventory.py` | 既有盤點工具的動作總數納入第七項技能。 |
| `MAP.md`、`HANDOFF.md` | 更新七項技能資料路徑、驗收暫存行為與本次完成狀態。 |

搜尋 `tools next/layouts next/content next/data next/specs hugo.toml` 的 `starts-turns|starts_turns` 已逐一檢查。歷史 `queue.log`、既有轉址規則、來源檔對照、單篇課表連結不是技能清單，保持原意。`hugo.toml` 沒有需要新增的技能掛載。

## 同步產物

下列有內容差異的同步產物全部由 `python -X utf8 tools/sync_vortex.py` 產生，未手改：

- `data/vortex/open-water.yaml`、`data/vortex/starts-turns.yaml`：補齊新動作的 drill ID 參照。
- `data/vortex/technical-analysis.yaml`、`data/vortex/source-registry.yaml`、`data/vortex/source_usage.json`：帶入上游現況及對應來源資料。

`next/data/vortex_links.json` 由索引產生器重建。開始時此檔已有未提交修改，已先備份到本次暫存目錄的 `vortex_links.before.json`。`build_library.py` 與 `build_starters.py` 均已重跑，輸出沒有新增內容差異。Drills、問題等同步檔原本已含 A／B 資料，本次同步後同樣無內容差異。

實際數量：66 動作、214 drill、252 技術點、104 教學誤區、84 問題、47 傷害、26 級別、8 心理主題、62 心理概念；practice 邊 126。索引摘要另有 13 筆跨資料域參照尚未納入 units 圖（movement／breathing／periodization）；沒有任何 move.drills 解析失敗，P4 實際 HTML 連結驗收為零錯誤。

## 執行與建置

依序執行且 exit 0：

```powershell
python -X utf8 tools/sync_vortex.py
python tools/build_vortex_links.py
python tools/build_library.py
python tools/build_starters.py
hugo -d C:/Users/hangs/AppData/Local/Temp/my-site-open-water-20261015-4449c93f2ce945f7be30b209ba3f6a91/cortex --baseURL http://127.0.0.1:1319/cortex/
python -X utf8 next/specs/check.py
```

Hugo v0.162.1 建置成功，Pages 1712。既有 `languageCode`、`module.mounts.excludeFiles` deprecated 警告仍存在，未擴大修改設定。本次沒有執行 `hugo server`，所有驗收與預覽建置均未寫進 `public/`。

新頁網址路徑：`/cortex/vortex/open-water/`。

建置設定對應網址：`http://127.0.0.1:1319/cortex/vortex/open-water/`；建置檔：`C:\Users\hangs\AppData\Local\Temp\my-site-open-water-20261015-4449c93f2ce945f7be30b209ba3f6a91\cortex\vortex\open-water\index.html`。1319 當時已有其他 Python 服務，未動該服務；瀏覽器驗收使用同一產物的臨時靜態伺服器，自動選擇空閒埠，完成後關閉。未部署線上站。

## 驗收結果

| 驗收 | 結果 |
|---|---|
| `check.py` 無參數：W1、W3、W4、W5、W6、W7、W8 | 7／7 PASS |
| L1、L3、L4、L5 | 4／4 PASS |
| V2、V3、V4、V5、V6、V7 | 6／6 PASS |
| T1、T2、T3、T4 | 4／4 PASS |
| P4 | PASS：1,711 頁、83,430 條站內連結；零斷連結、零錯誤錨點、零孤兒頁 |
| `tools/test_vortex_links.py`（由 W1 執行） | ALL PASS |
| `python -X utf8 tools/build_redirects.py` | 121 舊網址：86 原路徑、35 轉址、0 無落點 |
| `python -X utf8 -m unittest discover -s tools -p test_sync_problems.py` | 11／11 PASS |
| `python -X utf8 tools/test_sync_movement.py` | 8／8 PASS |
| Playwright／Chrome，1440px 與 320px | PASS，無水平捲動、無 JavaScript 錯誤 |
| `git diff --check` | PASS |

瀏覽器與來源對帳實際確認：

- 從 Vortex 首頁第七張卡可點入新頁；左欄、全站首頁／書房入口也可到達，標籤及順序正確。
- 開放水域頁有全名、premise、8 張動作列、15 個練習（可展開）、19 技術點與 6 個問題。
- 上游實際沒有 `open-water` 教學誤區，也沒有 L 級，頁面不生成這兩個空區塊。
- 起跳轉身頁有 14 個動作、25 個練習（24 個 starts-turns 檔內 drill，加上跨式 Fl30）；新增 move.8–14、ST6–ST20 均出現。
- 起跳轉身及開放水域每個動作的 practice 目標，逐一對照 canonical `links.drills` 完全相等。
- drill、技術分析、問題、動作清單順序正確；按「開放水域」分別篩出 15、19、6、8 筆。

## 修改前的失敗與處理

接線前先完成 W 與 P4 基準檢查（只先調整驗收輸出到暫存目錄）：

- W3–W8 已 PASS。
- W1 已 FAIL：六項技能索引有 58 動作、214 drill、252 技術點、84 問題，但斷言仍為 51／179／222／73。本次把七項技能與上游資料對齊，最終 W1 PASS。
- P4 已 FAIL 25 項：19 個開放水域技術點與 6 個問題連向不存在的 `/cortex/vortex/open-water/`。接通新技能頁後全部消除。
- 額外執行問題同步測試時發現 `test_real_full_source` 同樣仍斷言 73，真實來源為 84；此為既有固定數量落後。本次一併更新，重跑 11／11 PASS。

本次範圍沒有剩餘 FAIL。瀏覽器腳本、截圖、基準與完成檢查 log 留在上述暫存目錄；專案內只新增本完成紀錄。
