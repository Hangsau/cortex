# 器材指南上線檢查

## 1. 目標

my-site 提供可由首頁、目錄、排課練習庫抵達的詳細器材指南；canonical 與公開 UDKLow1 均不再宣稱一般呼吸管可支援水下呼吸。

## 2. 範圍與服務

- TheVortexProject：新增 `Instructional/游泳器材使用指南.md`；修改 `Drills/drills_udk.yaml`、`canonical/_sources.yaml`、`_INDEX.md`、`HANDOFF.md`；`.github/workflows/notify-mysite.yml` 補 Instructional 觸發路徑；重生 `KNOWLEDGE_MAP.md`、`indices/*.json`、驗證報告。
- my-site：`tools/sync_vortex.py` 加明確 slug；同步 `content/vortex/instructional/equipment-guide.md`、`data/vortex/drills.yaml`、`source-registry.yaml`、`tools/vortex_sync_state.json`；首頁／rail／workout partial 加入口；重生 links/library/starters 所需產物；保存研究及交接。
- 不改推薦演算法、PB/CSS 計算、計時器狀態、localStorage、AI 串接或 CSS 版型。
- 使用者：公開站讀者、手機池邊查閱者及後續排課維護者。純靜態閱讀，不需本機開著，不受本機休眠影響；首次載入需要網路，不承諾離線快取。
- 入口與來源掃描：SLUG_MAP → sync state/content → Hugo 掛載及 article/reading-list；Vortex home/rail；workout `wk-mine` 會被 studio 移到 library。UDKLow1 的 source_id、名稱、how_to、感知訊號、body_position 和索引一併同步。舊 HANDOFF 的歷史記錄保留。

## 3. 執行路徑

1. 已確認兩 repo 與遠端一致，並讀研究、模板、同步器、驗證規則。
2. 使用現有文章版型及穩定章節錨點，撰寫九類器材（繩分四型）的操作；先完成來源與 UDKLow1 修正。
3. canonical validate → build_knowledge_map → build_indices；若新增錯誤即修正，不以警告冒充完成。
4. 更新 SLUG_MAP 及三處入口；執行 sync_vortex，檢查 diff，僅納入相關內容。同步若帶入無關變更，先定位來源／產生條件，不覆蓋使用者修改。
5. 依 CI 執行 check_learning_map/build_vortex_links/build_library/build_starters；22 specs 順序執行（共用 public，不並行），舊網址檢查；另以暫存建置檢查手機、章節與入口。
6. 驗收後 canonical 先本機 commit；my-site commit/push 先部署，確保新同步器與頁面一起出站；再 push canonical master，確認 notify-mysite，等待／整合自動同步後檢查最終線上頁面。任何 push 分歧先 fetch 檢查，不強推。

## 4–5. 風險與處理

| 證據／機制 | 執行前檢查 | 發生後處理 |
|---|---|---|
| sync 只收 SLUG_MAP，漏登會跳過新文章 | dry-run 確認 NEW，實際產生 content | 補 slug 重跑；不上線缺頁導覽 |
| canonical 推送自動寫 my-site，可能與人工推送競爭 | fetch、記錄 HEAD；兩次 push 序列化 | 等 bot 完成，fetch/rebase 檢查；禁止 force push |
| 錨點與 /cortex/ 前綴可能造成 404 | P4 全站連結＋新文各 anchor 與三入口檢查 | 修正連結後重建；保留既有 UDKLow1 ID/URL |
| 錯誤供氣假設散布於同一 drill 多欄 | 搜尋 id、來源與舊語句 | 同時修目的、步驟、成功／失敗、body_position；重新同步與驗證 |
| 示範劑量或來源被誤當效果保證 | 原文對照、來源種類、研究／實務區分 | 縮回原文支持的條件；範例明標需調整 |
| 長文章／表格造成手機橫向溢出 | 320/390/1440px 和真實渲染抽查 | 使用現有文字／清單結構調整內容；不引入新視覺系統 |

結構檢查：共享狀態僅 public 建置與跨 repo bot，均採順序操作；無使用者輸入處理或新 LLM/API 資料；無持久化 schema 變更，舊課表無須遷移；空／大量／中斷輸入測試不適用於靜態文章，改驗檔案完整、錨點、build 失敗不部署；無新增 SQL/SSH/shell 插值或 HTML 注入入口；撤下來源後搜尋所有引用以保持生產者／消費者一致。需回滾時以功能 commit 的 revert 生成新 commit，canonical 亦同步回滾／修正，不刪遠端歷史。

## 6. 整體檢查

最小路徑是現有 Markdown 同步與文章版型，無新頁型、後端或通用資料引擎。指南、入口及已發現的器材錯誤都在本次範圍；排課整合延期。完成證據：canonical 無新 ERROR、產生物一致、22 specs、121 舊網址、行動尺寸與線上入口／修正文案、部署及同步工作流成功。使用者已要求先加入網站，本計畫作執行紀錄，不另設重複批准步驟。

## 驗收紀錄

- canonical：0 ERROR／133 WARN（未增加）；KNOWLEDGE_MAP 與四份索引重生。傷害地圖原有 0 計數未在本輪修改，diff 僅日期／UDK 名稱。
- my-site CI 前置四步完成；22 specs 全 PASS，P4 959 頁、51,310 條站內連結；121 舊網址（111 原路徑、10 轉址）全部對應。
- 320／390／1440px 無橫向溢出；16 個器材／教學錨點存在；首頁與排課練習庫入口、修正 drill 頁通過；390px 往返指南後保存課表完全一致，無 pageerror。
- 已實際看過 390px 頁首與呼吸管操作段截圖。瀏覽器首次驗收需先開啟「重新命名」才可編輯原本收起的欄位；修正驗收操作後通過，非產品缺陷。
- 本機 Hugo 啟動受沙箱限制，經自動批准改用較高權限執行建置／無介面 Chrome。未要求使用者再次批准。
- sync dry-run 的五筆舊文章 CHANGED 是同步狀態 hash 落後；實際公開文章沒有新增 diff，僅更新 state。重新產生 vortex_links 帶入原先已在 canonical／公開資料存在的索引更新；未額外修改這些技術內容。
- 待補正式部署 commit／workflow、canonical notify-mysite 與線上確認。
