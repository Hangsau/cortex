# Nordin 周邊神經與骨骼肌詳解：2026-09-22

基線`42eb7aca7752a244817cb4d0dd9aff7f1e4816ef`，工作樹乾淨。沿使用者「繼續」及既有編輯／發布授權，加深Nordin第5、6章，保留原八錨點、guide／chapter-guide契約與閱讀風格。下一批預計15–16章。

來源為使用者本機提供的`src.nordin-frankel-2012`；第5章實體PDF144–165、第6章166–195。以`tools/book_sources.py`的`book_pages`重組原文，必要圖表回PNG；原文頁包留tmp，來源檔不改。採textual_interpretive profile，區分教材敘述、編者推導及當代醫療／訓練建議，由主代理完成核閱撰稿。

範圍為兩章正文、生成閱讀索引、來源與驗收紀錄及HANDOFF／MAP／REVIEW；沿用既有版型、CSS／JS與原頁唯讀服務。完成後建置、結構／HTML檢查、原頁服務18項、閱讀器97項、本批手機大字／兩色／桌面／無JS／跨章落點檢查，依完整SHA驗CI及正式正文。

## 工作狀態

- [x] 核閱來源與必要圖表，整理條件、數值及圖文差異。
- [x] 完成兩章連續繁中詳解、來源定位與編者算例。
- [x] 完成結構、建置、閱讀與目視驗收。
- [x] 更新交接、發布並比對CI與正式站。

## 來源與語意決策

主要核閱第145–162、167–189頁轉檔正文與圖說，144／166章首目錄及163、190–195部分文獻條目；章末文獻與流程圖未逐一譯寫，也未把文獻表當成已讀原研究全文。185末段抽文有截斷，已回原PNG；179、187病例依PNG補讀。目視原PNG147、148、152、169、173、179、181、185、187，共9頁。原書147–148的微細纖維／血管直徑已印成mm，不能全部歸咎OCR；正文省略這些可疑範圍，不自行賦予未核定精度。

外部查證由原書引文與局部語意問題觸發，只採原始研究摘要；未宣稱全文精讀：

- `src.reisman-2009`：[Reisman、Allen、Proske](https://pubmed.ncbi.nlm.nih.gov/19043681/)，摘要結果及解釋。教材169頁把titin概括為幾乎不參與被動張力，與引文作者提出其參與的解釋不合。正文保留兩層證據差異，未推算分子貢獻比例。
- `src.smerdu-1994`：[Smerdu等人](https://pubmed.ncbi.nlm.nih.gov/7545970/)，摘要的人類MHC轉錄物與組織化學對照；用於IIb／IIx命名，未推廣成所有物種的型別同一性。
- `src.westerblad-1993`：[Westerblad、Duty、Allen](https://pubmed.ncbi.nlm.nih.gov/8397180/)，摘要的單一小鼠肌纖維低頻疲勞、鈣濃度及最大鈣活化張力。作為編者補充的窄機制例，不當作人類全部疲勞的理論。
- `src.thom-2007`：[Thom等人](https://pubmed.ncbi.nlm.nih.gov/17530274/)，摘要的人數、年齡、蹠屈測試、估計力矩／速度與功率。教材188頁的torque velocity／power velocity用語與百分比配對不清，依原始摘要配對48.5%力矩、38.2%速度。搜尋亦出現2005研究，與2007研究不同，未混用其45%／43%數據。

額外搜尋曾取得Horowits1986、Westerblad1991等題錄／摘要線索，未用作正文的獨立結論；1991全文PMC入口出現驗證頁，沒有聲稱讀取全文。神經應變換基準採條件式幾何示範，未聲稱回收Rydevik原始個體資料。一般機制依本機教材與既有Neumann章對讀；新增網站來源在相應正文附近有直接連結。

下表每列ID對應canonical章節錨點，教材來源均為`src.nordin-frankel-2012`，定位為實體PDF頁。六欄分別對應affirmative_conclusion、works_when、fails_when、how_to_identify、action、remaining_boundary；「辨認」列出實際核閱線索。程式通過不等同語意或醫學正確。

| 結論與穩定ID | 條件 | 不適用 | 辨認 | 正文處理 | 剩餘界線 |
| --- | --- | --- | --- | --- | --- |
| `nordin.ch05.axonal-transport`：運輸與傳導不同 | 146–147；1–400mm/day描述物質運輸 | 當電訊號速度 | 單位為每日距離，結果為物質而非動作電位 | 分開生理過程與恢復終點 | 未逐項核對所有運輸蛋白 |
| `nordin.ch05.barrier-and-pressure`：束膜屏障與血管屏障位置不同 | 147–149；封閉空間與水腫 | 所有包覆視為同一層 | 原PNG147–148、血管與束內壓敘述 | 結構→滲漏→壓力→循環連續解釋 | 不以正常平均壓力訂臨床界線 |
| `nordin.ch05.strain-reference`：同一零點可換算相對原位延長 | 151–153；圖5-7平均11.0%、38.5% | 直接減成相對原位應變或安全量 | PNG152座標與正文25–30% | 編者1.385/1.110−1≈24.8%，明示共同分母假設 | 僅幾何相容，未重建個別資料；conditional_difference／partially_resolved |
| `nordin.ch05.stretch-function`：功能改變可先於拉斷 | 152–153；兩項兔神經實驗 | 把8/15%血流與6/12%一小時傳導串為同一實驗 | 指標、研究及時間不同 | 分段保留物種與終點 | 不作人體伸展容許值 |
| `nordin.ch05.pressure-gradient`：壓力邊緣有位移集中 | 154–157；施壓幾何與纖維類型 | 只以最高值或P×t預測 | cuff邊緣、節點位移及模型 | 壓迫、軸向位移與剪切接起來 | 未把簡化均質模型當活體解算 |
| `nordin.ch05.flattening-geometry`：等面積橢圓可增加周長 | 155–157；r→1.5r、r/1.5編者模型 | 把橫向比當長軸應變 | 面積πab與方向 | 只作幾何示範 | 無損傷臨界值 |
| `nordin.ch05.root-sheaths`：根鞘、硬膜囊與神經節外囊分層 | 149–151 | 以原書不一致腦膜用語混為一談 | 原文先排除後又寫緊包 | 採解剖位置與外囊描述 | 未取得出版社勘誤；contradiction／partially_resolved |
| `nordin.ch05.root-gliding`：滑移量不同於伸長 | 157–158屍體直腿抬高 | 數毫米除以任意長度當應變 | 量測相對位移 | 保留滑動與固定點機制 | 不指定練習幅度 |
| `nordin.ch05.double-compression`：雙處效應涉及供血排列 | 158–162豬馬尾、雙氣囊與慢性模型 | 壓力相加、面積百分比當壓力 | 血流／MAP／幾何不同終點 | 區分雙處根供血與周邊軸突運輸假說 | 不把雙處影像異常當因果證明 |
| `nordin.ch06.sarcomere-bands`：H區與裸區定義不同 | 168–170；重疊範圍與頭部位置 | 原文同義化 | PNG169前後兩種定義 | 說明重疊可隨長度改變 | 不逐一重繪超微結構 |
| `nordin.ch06.titin-and-passive-force`：所引研究沒有否定titin參與 | 169；Reisman摘要 | 由整體被動力矩推定分子比例 | PNG169與摘要作者解釋相反 | 直接說明引述過廣，連原摘要 | interpretation mismatch／partially_resolved；未分離分子力 |
| `nordin.ch06.crossbridge-cycle`：ATP結合、解離與水解不同 | 172–173 Box6-1 | 原反應式照抄 | PNG173第14項水解兩側形式相同 | 依機制重述並明示排式問題 | 未重建完整化學動力模型 |
| `nordin.ch06.controlled-conditions`：等速、等張、固定質量不同 | 175–178 | dynamic=isokinetic；固定重量=固定肌力 | 控制變數、角／線速度與力臂 | 固定條件分開，恆速需力矩平衡 | 模型不重建個人動作 |
| `nordin.ch06.pcsa-conventions`：投影只能計一次 | 179–181；V/Lf及V/Lf cosθ | 已投影面積又乘餘弦 | PNG181幾何與Neumann架構章 | 定義分開，編者520N／20.8Nm例 | 代表纖維長度、定應力假設 |
| `nordin.ch06.fatigue`：低頻疲勞可涉及鈣釋放 | 182–183及Westerblad1993摘要 | 只歸因ATP用完或全稱人類疲勞 | 小鼠單纖維、無最大鈣活化張力下降 | 明示編者補充與物種 | different_measure／not_applicable；非人類臨床統整 |
| `nordin.ch06.fiber-nomenclature`：人類舊染色IIb需與IIx對照 | 184–186、Smerdu摘要 | 跨物種同名直接等同 | IIx轉錄物、原PNG185比目魚肌句與186不一致 | 保留歷史命名，說明原書內部差異 | 未給所有肌肉統一比例 |
| `nordin.ch06.disuse`：力與截面可不同幅下降 | 185–187兩研究4／7週 | 合成同一縱向曲線 | 作者年份與樣本不同 | 保留8.6/14.2與15/54成對結果 | 再訓練未顯著不同≠完全恢復 |
| `nordin.ch06.acl-case`：前後曲線需按座標比較 | PNG187兩圖縱軸不同 | 用畫面高度反算63%／43% | 圖軸及病例文字缺損說法 | 保留病例追蹤意義，不沿用未能對帳百分比 | 無原始資料；different_measure／unresolved |
| `nordin.ch06.aging`：老年組力矩、速度及功率均有不同變化 | 188、Thom2007摘要24名男性 | 百分比錯配、橫斷當縱向 | 48.5%力矩、38.2%估計速度；肌群及年齡 | 按摘要配對、保留模型與群體 | 只核摘要；measurement mismatch／resolved for cited numbers |

以上為依數字、單位、定義與引文不合挑出的19組重點，沒有宣稱窮盡全部主張或所有研究配對。其餘每節保留來源shortcode、條件與解釋；未新建通用claims資料庫，故不套用與本專案Markdown契約不同的JSON schema。既有reading_check負責章節來源範圍、錨點、連結與最低敘述檢查。

## 驗收與發布

`python -X utf8 tools/reading_check.py --write-index`、`python -X utf8 tools/book_reader.py build`、`python -X utf8 tools/reading_check.py --html C:/claudehome/tmp/musculoskeletal-reader-preview`已通過：33章1,050節／248,291中文字，1,584個HTML連結／錨點；Hugo172頁。原頁服務`python -X utf8 tools/check_book_reader_server.py`兩次啟停18/18，既有閱讀器`node tools/audit_book_readers.js`97/97。

本目錄`node check-browser.js`驗兩章完整節次、原八錨點、跨章HTTP與實際落點、22px、320／390／1360寬、紙色／夜色、無JS及與既有章的字型／色彩一致。截圖留`C:/claudehome/tmp/nerve-muscle-expansion/screenshots/`。本批只改正文與索引，五份共用版型／CSS／JS比對基線；原書、抽文與原PNG不發布。

本批瀏覽器67/67通過，六張截圖皆已目視，正文、標題及來源連結在兩色可讀；桌面目次與正文沿用既有樣式。第5章33節／7,314字，第6章43節／9,508字，共76節／16,822字。五份共用檔及來源catalog與基線一致，詳見`validation.json`；可重跑`python -X utf8 research/book-readers-2026-09-06/nerve-muscle-expansion/record-validation.py`彙整既有檢查與檔案不變條件。

實作`acffbd8103710f971cda283706bb276febe4fd9c`已部署；按完整SHA核對[CI 35665543946](https://github.com/Hangsau/cortex/actions/runs/35665543946)的build及deploy成功，見`ci-verification.json`。`python -X utf8 research/book-readers-2026-09-06/nerve-muscle-expansion/check-live.py --commit acffbd8103710f971cda283706bb276febe4fd9c --run-url https://github.com/Hangsau/cortex/actions/runs/35665543946`正式站28/28：兩章完整正文、33／43節順序、原八錨點、跨章目標、原頁來源群隱藏及CSS／JS與本機一致，證據見`public-validation.json`。
