# 中文讀本：來源判讀與驗收

2026-09-07 更新：首頁入口已修復並部署。肌動學第 1–4 章已加深；本批續完成第 5 章肩帶 34 節／10,980 字與 Nordin 第 12 章 17 節／6,093 字，加入肩胛角度與手持重量兩張中文圖解。全讀本現為 230 節／67,412 中文字，仍為逐章導讀／詳解。分批來源核對及驗收見 `ch01-expansion/RUN.md`、`ch02-04-expansion/RUN.md`、`shoulder-expansion/RUN.md`；下方 133 節／約 2.4 萬字及初次部署紀錄保留為 2026-09-06 初版快照。

## 交付與閱讀界線

Neumann 第 3 版 16 章、Nordin／Frankel 第 4 版 17 章，共 33 篇繁體中文導讀、133 個正文小節，正文約 2.4 萬中文字。另有 60 個中英術語、7 個主題、18 組跨書對照、互動力矩示意與黏彈性示意。這是主要概念的逐章講解，不是 1,262 頁的逐句全譯；附錄、前後言沒有另寫導讀。

正文使用連續段落，先建立問題，再展開機制與適用條件，最後銜接下一節。來源資訊收在段末，術語中英並列常駐顯示。圖解只解釋概念，編者算例明示假設，不將簡化數字當作人體實測。

## 原始資料為何破碎

| 觀察位置 | 實際問題 | 本次處理 |
| --- | --- | --- |
| Nordin 第 1 章，PDF 第 18–39 頁 | 一章被拆在封面、Introduction、Overview、單位與文獻等數個檔案；單讀章名檔幾乎沒有正文 | 以實體 PDF 頁次重組讀取順序；中文導讀保留完整的力學推理流程 |
| Nordin 第 4 章，PDF 第 129 頁、圖 4-13 | 抽文把另一張圖的 `load held constant` 標籤插進應力鬆弛正文，易讀成錯誤固定條件 | 已目視原頁；應力鬆弛固定長度，蠕變固定負荷。正文說明錯接問題，並依正確條件重畫中文概念圖 |
| 多章雙欄、圖說、表格 | 標籤或章內標題進入「圖上標籤」，句子順序被欄位切開 | 不把原抽文直接換皮成讀本；導讀用原書脈絡重新敘述，原頁對照以掃描頁為準 |

原 PDF 和 `resources/books` 沒有改寫。`source-audit.json` 保留 PDF／章檔雜湊、PDF 書籤、頁面清冊及每章涵蓋的轉檔檔名；兩本 1,262 頁均有 Markdown 頁段與 PNG，未發現缺頁或重複頁。這證明取得完整，不代表轉檔品質良好。

## 語意抽查

| 位置 | 核對重點與寫作決定 |
| --- | --- |
| Neumann 第 3 章，PDF 第 74 頁 | 目視肌小節／橫橋圖，區分肌絲滑動與肌絲本身縮短 |
| Neumann 第 4 章，PDF 第 117–120 頁 | 沿自由體圖、肌肉力、關節反作用力的順序講解；另設無重量槓桿例子，4 牛頓米、100 牛頓、80 牛頓皆交代假設與方向 |
| Neumann 第 5 章，PDF 第 165 頁 | 肩肱節律的約 2:1 為整段抬舉的概括，沒有寫成每個角度的固定比例 |
| Neumann 第 9 章，PDF 第 366 頁附近 | 保留脊柱耦合運動隨區域／姿勢而異的條件，避免單一方向法則 |
| Nordin 第 4 章，PDF 第 129 頁 | 目視原圖確認應力鬆弛／蠕變的實驗條件，修正上述抽文誤接 |
| 神經、植入物與步態章 | 不將破壞試驗門檻變成個人伸展目標，不提供當代植入物產品推薦，不將淨關節功率等同單一肌肉功率 |

各章曾按目錄與主要議題檢視原抽文；本表記錄額外核對與重要寫作邊界。尚未逐句比對全部原頁，讀本沒有宣稱全書精校或完整涵蓋所有圖表。`reading_check.py` 驗證來源定位、資料結構與連結，不驗證每句醫學敘述的真偽。

## 可重跑的驗收

在 my-site 根目錄執行：

```powershell
python tools/book_sources.py audit
python tools/reading_check.py --write-index
python tools/book_reader.py build
python tools/reading_check.py --html C:/claudehome/tmp/musculoskeletal-reader-preview
python tools/check_book_reader_server.py
node tools/audit_book_readers.js
```

最後一項需要先有 `book_reader.py serve` 於 8768 執行。Playwright 使用既有的 `C:/claudehome/tools/node_modules/playwright`，不新增網站依賴。

本次結果：33 章／133 節／60 術語全部解析，500 條生成 HTML 連結及錨點可解析；新讀本瀏覽器驗收 97/97，既有 CSCS 結構檢查通過，既有 `audit.js` 38/38。既有 audit 的兩個測試網址於執行時改指 8768，原檔及斷言未改。Hugo 建置 170 頁，僅現存 locale 棄用提示。

來源服務實際啟停 2 次，18/18 檢查通過，涵蓋路徑穿越、錯誤書 ID／頁數與重啟後原頁可讀。公開實作 commit `d51c1084f0388b7b862a9513382dc09585255ec1` 的[部署 CI 已成功](https://github.com/Hangsau/cortex/actions/runs/34039982688)；`public-validation.json` 記錄線上 42/42 檢查：33 章、兩冊入口、主題頁及 CSS／JS 全為 HTTP 200，正式站搜尋與中文圖解正常，沒有顯示不可用的本機原頁連結。部署前已整合遠端 17 筆 Vortex 同步，沒有修改其內容或強制推送。

瀏覽器檢查涵蓋 320／390 px、小螢幕大字、桌面、雙主題文字對比、鍵盤、搜尋空結果與特殊字元、損壞／拒絕 localStorage、無 JavaScript 正文、原頁並行請求及不存在的來源。原始截圖與瀏覽器報告留在 `C:/claudehome/tmp/book-reader-review/`，人工看過桌面、手機正文及手機夜讀圖解。

## 操作與恢復

公開站的書庫可進入兩冊導讀，書頁提供章序、搜尋與共同主題索引。公開產物不含原頁圖片或全文。

需要對照原書時，執行 `tools/start-book-reader.cmd`，再開啟 <http://127.0.0.1:8768/cortex/library/kinesiology/>。本機來源服務只綁定 127.0.0.1，固定允許兩本書，以頁數選取原頁；沒有任意路徑讀取或寫入 API。關機後重新執行啟動檔即可。沒有排程、佇列或補跑作業；同時只啟動一個 8768 服務。

正文改 `content/library/{kinesiology,basic-biomechanics}/chNN/index.md`；詞表／主題／同義詞／對照改 `data/reading/` 相應檔案；章序及 PDF 範圍改 `tools/book_sources.py` 的 BOOKS 後重跑 audit。`books.json` 和 `index.json` 是生成檔，不手改。
