# 排課工作台與 AI 擴充邊界（2026-10-05）

## 1. 目標

使用者已同意先做可操作的獨立新版，保留原版入口作比較；完成後新版可編排、排序、保存、分享與計時，並提供真實可用的 AI 提問匯出。

## 2. 範圍與資料流

- `/vortex/workout-studio/`：content、專屬工具 partial、CSS、JS；baseof 僅對 `workout_studio` 參數切換獨立外殼。
- `workout.js`：共用計算／編輯／計時；新增呈現層 API、render/change/saved 事件、課表目標和版本化的 brief 輸出。原版 `workout.html` 僅加參數與新版入口；rail 加新頁入口。
- `tokens.css`：新工具顏色作用域只限 `.workout-studio`。不改全站閱讀版型、canonical 訓練規則或處方。
- 原版 localStorage `cortex-swim-v2` → 首次開新版時複製 → `cortex-swim-studio-v1`。之後各自保存，不雙向同步，PB 一律不持久化。分享與常用組沿用 engine 的完整 row 資料，包含 rowRest。
- 下游使用者：手機／桌機瀏覽器、GitHub Pages；開頁載入資料與編排。計時是開頁期間的互動工具，不新增排程、離線安裝或背景鬧鐘承諾。
- 不提供自動 AI 分析、付費 API 呼叫、帳號、雲端同步，也不在前端存 API 金鑰。

## 3. 執行路徑

1. 保留 shared engine，增加窄的工作台 API；失敗可回原版，原版儲存不受影響。
2. 新工具頁分排課／成績與建議／練習庫／課表與說明；modal 編輯保留既有事件容器，新增拖曳與鍵盤上下移操作。
3. 匯出 `vortex.workout.brief` v1：原始課表、逐項目標與計算說明、已知來源、使用者目標、缺少資訊。複製失敗提供可選取的文字，不假裝已連接 AI。
4. Hugo 編譯；原版 regression＋新版 browser tests；320/390/1440 畫面；全站 specs／連結／轉址驗收。通過後沿用 GitHub Actions 發布，線上再確認；失敗停止發布。

## 4–5. 風險、偵測、復原

- 狀態／併發：兩頁同源，若共用 key 會互相覆蓋。採獨立 key；用兩個同時開啟的分頁驗證原版與新版修改互不覆蓋。新版多分頁仍為單機最後寫入者優先，未提供合併。
- 舊格式：首開複製、每 row 正規化，不能覆寫原本 key。比較原版存檔字串；新版重開檢查 rowRest、常用組、intent 保留。刪除新版 key 可重新從原版匯入；不得自動刪原版。
- 空／大量／中斷：空課表停用開始／匯出，示範另建課表；20×99 趟測試、modal 取消重開、計時中止重開。修改已存的 row 採原版既有即時保存；未加入的新增草稿仍屬暫存。
- 拖曳／順序：只接受這次页面內產生的拖曳狀態，API 檢查索引；驗證同段與跨段、空段、鍵盤操作。外部 drag payload 不作課表輸入。
- 輸入／注入：沿用 esc 和 textContent；brief 由 JSON 序列化；課表目標限 2000 字。含 HTML 的名称／目標驗證不會執行。沒有 SQL、SSH、LLM 回傳執行或 shell 字串資料輸入。
- 持久化失敗：engine 回報 saved 狀態，工作台不得顯示假成功；模擬 quota error 並確認可下載 JSON。
- modal 與分頁：搬 DOM 必須仍在原事件委派容器中，render 後重建 UI；以實際點擊測試新增、修改、選單切換與計時，而非只測 snapshot。
- 外部服務：目前沒有 AI 呼叫或新增後端；部署錯誤可退回上一個功能 commit，新頁保留原版入口，發布前／後皆驗 HTTP 與實際頁面。

## 6. 驗收與簡化

用現有 engine，不分叉第二份配速或計時實作；新 JS 僅負責介面和匯出。既有 `tools/test_workout_timer.cjs` 必須繼續 PASS；新工作台用瀏覽器測試資料隔離、編輯、排序、分享、計時、AI 提問與下載、儲存失敗與手機版。另跑 repository 要求的 specs 與 redirects。改動僅限使用者同意的新版試用與未來 AI 擴充准备。

## 日後 AI 接法

GitHub Pages 繼續放前端；另以受控後端接模型。前端送 brief + request ID；後端驗證大小／schema、限制存取和成本、讀 API key、附上允許引用的 canonical 規則，再回傳結構化分析。API key 不放在 repo、localStorage 或瀏覽器 bundle。

建議回傳契約：`schemaVersion`, `inputRevision`, `purpose`, `blocks[{blockIndex, rationale, expectedBenefits, conditions, sourceRefs}]`, `tradeoffs`, `adjustmentConditions`, `missingInputs`。推論與來源分開，沒有資料不得編造研究或推定個人狀況。顯示前驗 schema 且以文字輸出；課表若已被修改，舊分析標示過期，不覆蓋新課表。分析失敗／離線保留全部手動排課與計時功能。模型廠商、帳號驗證、後端平台與預算待真正串接時選定。
