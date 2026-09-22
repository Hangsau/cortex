# 兩冊肌肉骨骼學習地圖

使用者於 2026-09-22 回覆「好 去做~」，核准前一輪 plan-check 的新導航方案。沿用既有專案發布授權，完成後部署 Hangsau/cortex 的 hugo-source。

- 基線：eb166ba15a506ed1f57d248a8969442d590f9018。獨立 worktree，主工作目錄的 CSCS checker 修改不納入。
- profile：practice_observation_model；phase：integration / reader-publication。路線、任務與先後次序為編者教學設計，不宣稱經學習成效試驗驗證。
- 來源：既有 33 章已核閱中文詳解與 data/reading/index.json 的 source_id、PDF locator。核對提示只整合指定小節，不把本輪內容核閱冒稱重新精校原書或全文讀過所有原研究。
- 章文、章 ID、來源頁次、原 PDF、原 PNG、共用閱讀 CSS/JS 與既有偏好格式保留。
- 網站使用靜態地圖與原生 details；沒有新增進度紀錄、帳號、排程或外部輸入端點。

## 執行清單

- [x] 路線與學習任務草案：5 路線、25 站，2–4 個指定小節／站。
- [x] 逐站閱讀指定小節，核對提示與先備關係。
- [x] 地圖版型、手機樣式與雙向導航。
- [x] 結構、錯誤資料、HTML、瀏覽器與既有閱讀器驗收。
- [ ] 交接、發布與正式站確認。

## 設計判斷

- affirmative_conclusion：既有章節可透過小節連結組成有起點、任務與回讀位置的學習路線。
- works_when：讀者已能閱讀繁中正文，按每站指定小節及先備概念練習。
- fails_when：把點開連結當成理解，或跳過前提直接用簡化模型決定個人處方。
- how_to_identify：能否自行畫圖、交代條件，並回答改變條件後的問題。
- action：讀 2–4 節、合上正文回想、展開提示核對；未能說清楚就依先備連結回補。
- remaining_boundary：路線是選讀入口；涵蓋全部主章不代表涵蓋 1,106 小節、全部圖表或完整原書。

## 語意核閱結果

核閱原先 79 個指定小節，補讀並加入應變定義、肩胛上旋肌力偶、椎間盤終板三節；軀幹站將頸部重力例子換成 Nordin 腰椎前彎段落。最終 82 個指定小節、25 站、33 章。呼吸提示刪除不在指定小節內展開的氣體交換延伸句。每站來源 ID／原 PDF 頁次、六欄判讀見 source-review.json。

校核重點包括力臂的垂直定義、靜態／動態條件、肌肉長度而非動作方向、剛性／模數、固定負荷／固定形變、滑移／應變、關節淨功率／單肌作用、接觸力／應力及模型／個人處方的邊界。未加入療法或訓練劑量。

## 實作與驗收範圍

路線 canonical 為 data/reading/learning-map.json；版型共用 reading/map-index.html 解析既有章節與小節標題，章內返回入口也使用同份解析結果。新站樣式獨立 reading-map.css，既有 reading.css／reading.js 不變。原生 details 的內部片段目標可直接展開；未新增 JS、儲存或遷移。

為讓完整的資料檢查在發布時必定執行，部署 Build 步驟先跑只依賴 Python 標準庫的 check_learning_map.py，再執行 hugo --minify。Hugo partial 也阻擋缺節點與空任務。fixtures 證實錯誤連結／空任務會使 Hugo 建置失敗，標籤內容經 HTML 跳脫。

本輪 Windows 沙箱對 inline Python 啟動 Hugo 回傳 WinError 5；同一組 fixtures 經權限提升後完成，finally 已還原資料。截圖最初拍在原生平滑捲動完成前，驗收已改為等待目標到達視窗內；無 JS 情境改由 Node 輪詢位置，避免依賴被停用的 requestAnimationFrame。

最終驗收：`check_learning_map.py --self-test` 的 17 個負面資料案例全通過；Hugo 173 頁；`reading_check.py --html` 33 章／1,106 節、2,021 個站內連結與錨點，0 錯；原頁服務 18/18；既有閱讀器瀏覽器 97/97；學習地圖瀏覽器 90/90（含 320／390 px、22px、紙色／夜色、鍵盤、無 JavaScript、拒絕／損壞 localStorage、33 章返回連結）。截圖存於 `C:/claudehome/tmp/learning-map-review/screenshots/`。
