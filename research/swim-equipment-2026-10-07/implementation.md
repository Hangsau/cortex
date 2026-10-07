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
- 正式站：`34540e6`，GitHub Actions [37594642614](https://github.com/Hangsau/cortex/actions/runs/37594642614) build／deploy 成功。
- canonical：`163eef6`，notify-mysite [37594706284](https://github.com/Hangsau/TheVortexProject/actions/runs/37594706284) 成功；同步結果為 No public content changes，與已部署資料一致。
- 線上驗收：公開指南 HTTP 200、320／390／1440px 無溢出、16 錨點、首頁／排課練習庫導覽、修正 UDKLow1 名稱與步驟、手機往返後課表保存一致，全部通過，無 pageerror。
- 初次發布升權呼叫因自動批准審核服務額度不足而未執行；使用者要求繼續後，同一審核路徑重試成功，沒有繞過審核。


## 2026-10-07 使用者回饋修訂：教學與研究留在站內

- [manual] 目標：保留自己的文章連結，器材指南使用教學不跳外站，重要研究在頁內說清楚。手動份量與時間已獲使用者接受。
- [manual] 範圍：Instructional 指南 → 原同步器 → 同網址；更新研究決策、兩專案交接與文章索引。無程式、CSS、canonical／Drills 或存檔格式變更。
- [manual] 執行：保留既有錨點與內連、移除 11 個外連、一般／特殊蛙鞋分開、補呼吸管五步驟、研究正文與 DOI 文字出處；同步後驗 records、站內連結、所有既有 specs 與手機排版，再依現有發布流程部署。
- 風險與檢查：外連刪除不能連帶刪掉必要說明（逐段對照）；特定器材用途不外推到一般器材（人工審核）；研究保留人數、摘要狀態與時間尺度（對照來源）；保留舊章節錨點與內連（P4／瀏覽器）；跨 repo 同步順序沿用既有流程，避免 bot 與人工 push 衝突。
- 回復方式：以本次內容 commit 反向修改原文，再同步發布；不刪除歷史或改指南網址。
- 驗收：22 specs PASS（同一產物重用建置，各 spec 原檢查均執行）；P4 959 頁／51,312 條內連；121 舊網址有效。原 17 個錨點與 10 個自有頁面目的地均保留，指南外站 URL 為 0。320／390／1440px 無溢出，drill／課表往返正常，無 pageerror。兩份研究的 records、manifest、來源狀態與引用檢查均 0 error／0 warning。
- 本機預覽的第一次瀏覽器請求為 404；改用相同可存取環境的 localhost 靜態服務後通過，未更動內容來迴避檢查。
- 已發布：my-site `056f7b29ba70cdfd3cd6bec52d373f73a484a49f`，部署 [37633473917](https://github.com/Hangsau/cortex/actions/runs/37633473917) 成功；來源 `7d216440f80a026b5a92ffd84861afc567c157a7`，同步 [37633551661](https://github.com/Hangsau/TheVortexProject/actions/runs/37633551661) 成功並回報 No public content changes。
- 正式站：320／390／1440px 全部 HTTP 200、無溢出、正文外連 0、既有加新增共 21 個章節錨點存在；實際點擊自己的 drill 與課表連結正常，無 pageerror。
