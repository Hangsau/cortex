# HANDOFF — my-site (Cortex)

## 目前狀態（2026-06-17）

網站已上線並完全正常：https://hangsau.github.io/cortex/  
CI/CD 正常運作，push hugo-source 自動部署。  
**心理層 READ 旅程已試驗並撤回（commit 7f337e5, 2026-06-17）**：原「一條讀下來」scrollytelling 單頁旅程（vortex-psychology-journey.html + vortex-journey.js + 對應 content）已整個刪除，心理層回到 master-detail lookup（`vortex-psychology.html`）。撤回原因：單頁即使概念全收合，落地仍 ~3400px，章卡展開概念列 + 章尾橋接疊起來仍天邊；使用者反覆糾正「一打開就是一整頁長到天邊、不知從哪讀」。改為左欄按處境＋程度對號入座（怕水的從恐懼讀起、已穩的直接跳心流），首頁心理入口文案去掉「一條讀下來」、改為「按處境與程度挑一個進去」。**記**：未來若要對其他共用左欄頁（感知層/泳式技術）做新手導讀，先用輕量處境卡入口而非整頁 READ 旅程。下方的 READ 迭代段落（commit 0441c22/43b6c63/0054e63/e51beb7）已隨 journey 退役，僅留迭代歷史紀錄。  
**心理層 READ 模式迭代史（已撤回，僅留紀錄）**：使用者核心糾正——問題是**網站「呈現方式」**（layout/導航/視覺動線），不是內容文字怎麼寫。現有 vortex-psychology.html 是學術期刊 master-detail＝「索引查詢」介面，三病：①進站不知第一個讀什麼 ②讀完不知往哪續 ③查得到但讀不下去。**動工前先派 minimax-m3（`claude-m3 -p`）審方案**（使用者糾正「做之前就要審，不是卡住才審」）；m3 verdict：scrollytelling 範式對，但要 ① 章層級不是 62 概念層級 ② 殺左 rail 改頂部 sticky 7-dot ③ 殺 % 進度條 ④ 加 localStorage 續讀 ⑤ concept 預設摺疊（progressive disclosure）。全數採納。**實作（純呈現層，canonical/sync/data 全未動）**：新 `layouts/vortex/vortex-psychology-journey.html`（單頁捲動：序章 hero＋5 處境卡起跑線 → 8 章[theme=章，沿 L0→L6]＋章尾 navy 橋接卡 → 尾聲）；每概念 `<details>` 預設摺疊（標題＋42字 peek），展開見現象/誤區/介入＋巢狀「想深一點」收學術邊界與來源；新 `static/js/vortex-journey.js`（scroll 偵測當前章→更新 sticky chip＋7-dot L0–L6 亮帶＋mobile FAB「下一章」＋localStorage 續讀＋章節地圖 exit ramp；無 JS 仍全可讀，內容皆 server-render、details 原生）；`.vx-jrn-*` CSS（含三帶視覺變奏 start/through/peak、scroll-margin-top 錨點、prefers-reduced-motion）。**單頁 vs 拆 8 頁的取捨**：m3 建議拆頁，但 progressive disclosure 把概念摺疊後單頁長度問題消解，且單一 layout bug 面小、能逐項截圖驗證——故採單頁＋章錨點（`#ch-1`…）。**雙模式互連**：home 心理入口改指 journey（READ 為主）＋次連 lookup；journey↔lookup 互link（lookup 概覽頂部加 navy `.vx-read-banner`、journey 頂部「☰ 查」＋尾聲連結）。舊 vortex-psychology.html 原封保留為 LOOK-UP 查詢旁路。**驗收**：hugo build 綠、headless Chrome 桌機＋手機截圖確認 hero/處境卡/章首/概念展開/誤區三欄/橋接卡/sticky chip 隨捲動更新（「第1章·恐懼」＋L0–L2 dots 亮）/FAB/lookup banner 全渲染正確；修掉 resume banner 因 `display:flex` 覆蓋 `hidden` 屬性而首訪誤顯的 bug（改 `:not([hidden])`）。⚠ m3 列的選做增強未做（非 bug）：鍵盤 J/K 導航、概念 ☆ 書籤、每章閱讀分鐘數已加但「續讀百分比」未做。
**READ 模式 — minimax-m3 成品審查跟進（2026-06-17，commit 0441c22，已 push + CI 綠 run 27659748177）**：上線後再派 m3 審「成品」（非方案）。m3 verdict 兌現度 80%，逐條對實檔複查後**已改 6 條**：①Hero 加 L0→L6 系統 1 段解釋（gold 左框 `.vx-jrn-hero-lvl`，解決「dots/階梯全是無入門符號」）②概念 peek 42→24 字 + L 階梯加「出現在」視覺說明（`.vx-jrn-ladder-cap`）③章尾橋接卡補 `premise.one_line`（這章在講什麼），`when_zh` 降為次行 `.vx-jrn-bridge-when`④Hero「從頭讀起」章名改抓 `(index $themes 0).name_zh`，與章頭一致（原 hardcode「恐懼」vs 章頭「水中恐懼」斷裂）⑤JS 修續讀守衛容忍 `#start`（原「↑回到起點」點過後 hash 永久污染、續讀失效）⑥JS 章節地圖拿掉「點背景即關」、reduced-motion 改 `.vx-jrn * { transition/animation:none }`。**刻意不改（與 m3 分歧）**：處境卡不改成章名——違反「按處境不按 topic 名」原則（feedback memory）。**deferred backlog（屬實但緩，非 bug）**：D 續讀記到概念級（需改 localStorage schema 存 concept_idx + toggle hook + scroll restore，~30 分）；E「想深一點」拆成「證據邊界+來源」與「適用範圍」兩 details；I 章節地圖每章內嵌概念清單；單頁固有缺陷緩解「每章分享此章 URL 按鈕」。m3 確認單頁 vs 拆頁取捨**站得住**（臨界：章數≤12/概念≤100/HTML≤200KB，目前 8/62/~100KB 遠低於）。
**READ 落地反牆化（2026-06-17，commit 43b6c63，已 push + CI 綠 run 27660109605）**：上一輪 m3 跟進**反而把 hero 弄重**（加了金框 L 解釋段）＋ 第 1 概念 `open` 預設展開，使用者回饋「一點進去一大篇長論、不知怎麼看起」「比原本還糟」。修：①**所有概念預設收合**（移除 first-concept auto-open）→ 落地＝可掃讀標題清單；②hero 砍重：移除金框 L 段改一行短 lead；③加輕量「怎麼讀」框（明說這是挑著讀的地圖、點開才展開、兩種開始法①處境卡②第一章）；④L0–L6 解釋降為頁尾淡灰一行小註。CSS：`.vx-jrn-hero-how`（輕框）+ `.vx-jrn-hero-lvl` 改淡灰小字（原金框樣式移除）。教訓存記憶 `feedback_vortex_read_landing_collapse_and_light.md`：progressive-disclosure 閱讀頁預設全收合、不 auto-open；採納審查建議用最輕觸碰，別加段落把入口弄成牆。
**READ 展開概念拆牆（2026-06-17，commit 0054e63，已 push + CI 綠 run 27665165592）**：使用者反覆糾正兩件事——①重點是 **web UI 不是內容**（「點開來就是一長串不知道要表達什麼」＝呈現問題，內容文字之後再調、這輪一字不動）②「我叫你外審你就自己審」＝外審要實際**驅動**，不是叫了 m3 再用自己判斷濾掉它的意見。本輪全程走 `claude-m3 -p`（MiniMax 月費、零 Claude 配額）：先派 m3 做**純 web UI 審查**（明令忽略內容寫作品質），m3 點出展開後 `phenomenon.text` 是 body 內**唯一無標籤的裸 `<p>`**、其餘塊（誤區/介入/深讀）都有 tag/底色，故被讀成「裝飾文字/迷霧」；m3 給 14 條排序改法。再派 m3 **親手實作它自己 P0+P1 的 6 條**（不由我濾改）：①核心現象包成金框 eyebrow 容器、首句 build-time `findRE` 切出當 lead（19px accent，rest 15.5px）②誤區/介入/想深一點 各加 `.vx-jrn-subhead` section 中標題（含小寫英文）③展開 body 開頭加 `.vx-jrn-toc` mini-toc pill（核心/誤區×N/做法×N/深讀，缺哪塊不列，錨點跳各 sub-block）④4 個 sub-block 各自底色/左條視覺分格（現象金、誤區 warn、介入 accent2 米底、深讀 dashed）⑤section 間距統一 24px。**只改 `layouts/vortex/vortex-psychology-journey.html` + `static/css/vortex.css`，canonical/sync/data/JS 全未動，內容文字一字未改**。驗收：本機 hugo build 綠（333 頁 0 錯）、headless Chrome 強制展開全 62 概念截圖確認落地仍是收合清單、展開後＝金框現象+標籤化分區（非文字牆）、缺資料概念 `{{ with }}` 自動跳過該塊。教訓：外審交付物要讓外審自己審＋自己實作，主模型只做 framing＋驗收＋push，省 Claude 配額。
**READ 章預設收合，殺掉「長到天邊」單頁（2026-06-17，commit e51beb7，已 push + CI 綠 run 27665521396）**：使用者第二次糾正——前兩輪（拆牆 0054e63 + m3 跟進）改的都是「點開一個概念之後」的內部排版，但他的抱怨從頭是「一打開心理那頁，全部一頁長到天邊，到底要幹嘛」。**改錯表面**：8 章 × 62 概念即使全收合，62 條概念列 + 8 章 banner + 7 橋接卡疊起來 ~8000px 單頁＝落地就是天邊；使用者沒展開任何概念，所以「展開後」的改進他看不到＝「沒變」。**真修法**：每一章包成章層級 `<details class="vx-jrn-ch-d">` 預設收合（`.vx-jrn-ch-head` 變 `<summary>`，概念列 + 章尾橋接移進 details body）。落地＝hero + 5 處境卡 + **8 張可掃讀章卡**（章名/L-band/premise/概念數/「展開這章 ▾」），從 ~8000px 壓回 ~3400px。兩層漸進揭露：點章卡→展開概念列 + 橋接卡；點概念→展開內文（前兩輪的金框現象/分區）。JS（vortex-journey.js）：任何 `a[href*="#ch-N"]`（處境卡/「從第一章開始」/章尾橋接/FAB/章節地圖）click 先 `openChapterByOrder` 再跳轉；直接帶 `#ch-N` 進站也 auto-open 該章。驗收：hugo build 綠、headless 截圖確認落地＝8 章卡無概念攤開、force-open 第 1 章確認展開後＝概念列 + 橋接卡正確。教訓存記憶 `feedback_vortex_read_landing_collapse_and_light.md`（第二次糾正段）：①先確認抱怨的是「落地」還是「展開後」畫面、截「什麼都沒點」那屏並量整頁高度；②progressive disclosure 要做在最高結構層（章也收合，不只概念）；③m3 早建議拆頁/縮短，我用「單頁已消解長度」override 是錯的——外審＋使用者反覆指同一結構問題時別硬撐架構偏好。
**心理層 IA 改處境門面 + 每頁 L0–L6 定位梯（2026-06-17，commit 3081feb，已 push + CI 綠 run 27624598896）**：承接前一輪的 rail 短標籤（nav_zh）+ active-branch-expand。使用者核心糾正：網站不分受眾（教練/選手/家長）、也不按心理構念（恐懼/動機/心流＝教科書目錄）當門面——人按**自己的處境**來找（「半年後比賽」「帶 6 歲的」）。做了外部 IA 研究（NN/G 反對 audience-based navigation、polyhierarchy、information scent；Krug trunk test；Diátaxis；Duolingo/MedlinePlus/Brilliant/Starting Strength/Mountain Project 範例），收斂結論：① 用處境/程度（L0–L6 脊椎）當門面，topic 退到內容底層；② 每頁要有「你在哪一層」常駐定位；③ 不放角色選擇器。**實作**（純呈現層，canonical/sync 未動）：vortex-psychology.html 概覽面板頂部加 `.vx-situations` 處境門面（5 張 `.vx-sit-card`，泳者口吻白話句 + L 標籤 → data-target 路由到對應主題首概念），三帶完整地圖降為「或瀏覽完整地圖」；每個概念面板把舊的 `.vx-move-meta`（感知層級文字）換成 `.vx-ladder` L0–L6 定位梯（當前 l_levels 高亮），解決 search deep-link 的 trunk test。vortex.css 加 `.vx-situations`/`.vx-sit-*`/`.vx-ladder`/`.vx-map-label`（≤560px 收 go 字）。hugo build 綠（673 頁），headless 截圖確認概覽門面與概念定位梯渲染正確。
**左欄主題加處境副標 when_zh（2026-06-17，my-site commit ed87033 + canonical de9720d，已 push + CI 綠 run 27655449660）**：使用者回饋「左欄項目分得不錯，但我不知道什麼狀況該讀哪個，讀起來困惑」——左欄仍是純構念學名（恐懼/注意力/心流），告訴你「是什麼」卻沒說「何時讀」。修法：8 個主題各加一句白話處境線（canonical 加 `when_zh` 欄位 → sync_vortex passthrough → 左欄 theme-head 渲染為第二行副標）。如 恐懼「還不敢放手、一下水就僵、怕到不敢開始時」、注意力「一上場就分心、不知道該把注意力放哪時」、心流「想進入忘我、把好表現守在壓力下時」。左欄 theme-head 由單列 flex 改成兩列 column（`.vx-rail-theme-top` 為原本的 caret+name+count 列，下方 `.vx-rail-theme-when` 副標，展開時轉 sub 色）。這樣整個導航看得懂「何時讀」，不只首頁那 5 張卡。內容欄位走 canonical→sync，未手改 my-site data。⚠ 待辦：同套 when_zh 尚未推到首頁 5 張處境卡以外的其他共用左欄頁（泳式/感知層）；處境卡目前仍只連到單一主題首概念（L3–L6 四主題只 2 張卡指過去），中繼「主題概覽頁」尚未做——使用者尚未拍板要不要做這層。
**Vortex 首頁編排校正 + 改水感優先漏斗（2026-06-15，commit c2de328 + 480c510，已 push + CI 綠）**：使用者要求全面檢查 vortex 編排。先修首頁三處（消除「什麼是水感」與新手入口雙重「從這開始」競爭、Technica/Instructional 原文降為 faint 註腳存檔列與成品資料庫分層、標題「六式」→「六大單元」因水下蝶腳/出發轉身非泳式）。再依使用者質疑「為何從泳式而非水感開始」重排為**水感優先**：核心命題是「技術是感知的輸出不是輸入」，原漏斗卻先帶人看動作分解（命題說不要先做的事）。新手入口從自由式改指向 `vortex/technica/water-sense-guide/`；masthead lead 改述「先懂水感→再挑一式」；「核心·先讀水感」整組上移到六式之前並加 step 框架說明（用 `.vx-list-desc`，零新 CSS）；六式改框成「六大單元·挑一個開始練」第二步；水感理論頁概覽加白話鉤子（神經科學仍在 `<details>` 內，降低零基礎彈走）。三頁頁內編排（database 扁平查詢 / levels / 水感理論 master-detail）已查，編排良好不需結構性改動；levels↔水感理論雙向互連在頁面層已實現感知優先。本機 hugo build 綠 + 渲染 HTML 確認順序（核心在六大單元之前）。⚠ 未做 Playwright 截圖（此 session 無 playwright MCP）。
**M3 獨立審查跟進修正（2026-06-15，commit 269e9b0 + 2c8674f，已 push + CI 綠 run 27524878330）**：MiniMax-M3 對 vortex section 做無預設議程的獨立審查，Opus 逐條對原始碼複查。實修兩處真問題：①`water-sense-guide.md` 271 行 markdown body 是死碼（`vortex-water-sense.html` 全 hardcoded、從不呼叫 `.Content`）→ 清空 body 留 front matter + 指向 template 的註解；②`vortex-database.html` 的 `starts-turns` 標籤「出發轉身」與 home 及 canonical 內容頁標題「出發與轉身」不一致 → 對齊 canonical。**M3 多條「CSS 缺口」（is-hidden 未定義 / 無 RWD @media / `.vx-cert` 未定義）經查實際存在於 vortex.css 後 257 行**——M3 自承只讀前 600 行（共 857），屬誠實 hedge 非誤判；「common 項會出現在 stroke 頁」「evidence 迴圈脆弱」兩條為誤判（stroke.html line 14 精確 key 過濾、evidence 為正確 with+range 嵌套）。**刻意不改**：換 tab 不清空搜尋框——三 tab 共用單一全域搜尋框，持續套用與全域設計一致、且字串始終可見，非隱藏狀態 bug。**M3 列的選做增強（未做，非 bug）**：a11y 標記（aria-label/role=tablist/aria-pressed）、`:focus-visible`、dark mode、Google Fonts subset、stroke 中英 dict 抽共用 partial、database/standards inline JS 部分共用化。
**ADM 已從 library 遷入 vortex section，用 vortex 設計語言重建（commit 8710ad1，已 push）。**
**週期化（Periodization）呈現層已上線：canonical/periodization → sync → data/periodization → vortex-periodization 期刊式單頁（commit 28cffd3，已 push）。**
**週期化外部文獻擴充 + plain_zh 白話層（2026-06-10，commit 31cea81）**：canonical 加 plain_zh（學員/家長/教練白話）+ 游泳外部文獻（Maglischo 六分區/各距離供能/TID/Hellard 年度結構/青少年 LTAD）。sync 加 `_index.yaml`；vortex-periodization.html §1–§6 渲染 plain_zh + §5 加 4 游泳區塊 + 新增 §7 游泳年度結構 §8 青少年 LTAD（windows of trainability 標 contested）。hugo build 綠。`.vx-pz-plain` 樣式（vortex.css）。
**週期化頁改 master-detail 互動殼（2026-06-11，commit ec746b4，已 push + CI 綠）**：原本是單頁長文（像 .md 沒互動）。重寫成 ADM 矩陣那套互動殼——左側常駐目次、右側 4 面板（概覽 + 年度結構/賽前減量/能量分區三主題）切換、20 個概念各用 `<details>` 摺疊（預設收合）、頂部「選一個主題開始」引導入口。重用 vortex.js + vortex.css 既有元件，**零新 CSS/JS**。canonical 與 sync **未動**，純呈現層；20 概念 / 30 plain_zh 全欄位原樣保留。
**週期化排版/單位/行動版修正（2026-06-11，commit e781453，已 push）**：①摺疊內表格行動版本被擠成直條 → 改「摺疊內容區（.vx-level-body）橫向捲動 + 寬表給 min-width 560px」，每欄保持可讀寬度、手指左右滑（不再用 `display:block` 擠壓儲存格）；②數字缺單位（年度週數/每週次數/負荷:恢復比）已補「週/次」+ 負荷型態說明列；③新增 ≤560px 手機斷點收斂面板/摺疊字級間距。vx-pz-table 僅用於 periodization 且全在 vx-pz-stroke 內，改動不影響其他頁。全站行動版巡檢：vortex home/adm-home（vx-toc-row 820px 收合）、standards（堆疊摺疊卡，全寬）、matrix/stroke（master-detail 820px 收合）皆 OK；CSCS 九宮格維持 3×3（刻意的 nav 設計，有自己的 480/600 斷點調字級）。

**全站響應式總巡（2026-06-11）**：使用者要求整站行動版自主巡檢（文字密度不過高、不擠、橫向空間要夠，否則往下擠成窄長條）。發現並修 4 處（純呈現層 CSS，無 layout/JS/data 變動）：
1. **根版面 800px 上限漏洞（最關鍵）**：`baseof.html` 的 `.main-content { max-width: 800px }` 罩住每一頁；vortex 的 `body:has(.vx-*)` 規則只設 background 沒解寬度 → vortex 的 1080/1180px 容器與週期化 920px 面板修正在桌機都被默默壓到 ~752px。修法：`vortex.css` 加 `body:has(.vx-page|.vx-home|.vx-stroke|.vx-db) .main-content { max-width:none; padding:0 }` 讓 vortex 頁脫離上限。
2. **layout.css 缺手機斷點**：原檔無任何 media query。加 `@media (max-width:600px)` 收窄 `.main-content`/`.site-nav`/`.site-footer` padding（24px→16px）+ nav links gap，把橫向空間還給內容。
3. **library.css 書頁 hero 不堆疊**：`.book-hero` flex 橫排 + 120px 封面在手機把書名/簡介擠成窄條。加 `@media (max-width:600px)` 改 `flex-direction:column` + 封面縮 96px。
4. **cscs-chapter.css 子內容 3 欄爆擠**：點開九宮格後的閱讀區 `.sub-grid` 維持 3 欄 → 手機上每欄文字 8-9px 不可讀。改 ≤600px 單欄（1fr）+ 字級回到 12-13px（≤480 同步），九宮格 `.mandala` 維持 3×3 不動。
本機 hugo build 綠（673 頁）。⚠ 未做 Playwright 截圖（此 session 未載入 playwright MCP），改由 CSS + 渲染 HTML 推理驗證。

**「什麼是水感」介紹頁改設計頁（2026-06-11）**：原 `water-sense-guide` 是未設計的 .md 直接傾倒（single.html 渲染 `.Content`，使用者批「就搬 .md 放上去而已」）。重建為 `layouts/vortex/vortex-water-sense.html` master-detail 設計頁——左側 rail（概覽 + 6 部）+ 右側 7 面板，每部用 `<details class="vx-level">` ladder（共 22 則）+ 8 個 `vx-pz-table`。6 部：①水感是什麼（神經科學/四層次/四階段 + 為什麼不直接教動作）②感知剝奪訓練（拳頭游/穿襪踢水）③系統方法（五類機制/搖櫓）④觀察與測量（SWOLF/SPL/拳頭游速差/初學觀察指標）⑤錯誤水感重建（5 策略）⑥量化指標定義。**重用週期化既有 CSS class，零新 CSS**。content stub 改 `layout: vortex-water-sense` + title「什麼是水感」。`sync_vortex.py` 加 `LAYOUT_MAP`/`TITLE_OVERRIDE` + `build_frontmatter` layout 參數，避免重 sync 把 layout/title 洗掉。**公開頁邊界**：Part 2 表格的診斷型碼（C型/B型）已換成中性感知描述；built HTML A型/B型/C型/三型/typical_speech/main_problem 洩漏 = 0。hugo build 綠。

**水感發展 L0–L6 頁面上線（2026-06-11，commit 85546b6，已 push + CI 綠）**：先前 `data/vortex/water-sense-levels.yaml`（26 階段、四式）是孤兒資料——沒有任何 layout 渲染它（TheVortexProject HANDOFF 曾記「my-site vortex-levels.html 已建」但實際 my-site 從未有該檔，是誤記）。本 session 真正建出 `layouts/vortex/vortex-levels.html`：左側泳式 rail + 概覽面板 + 右側各級 `<details class="vx-level">` ladder，重用 vortex.js 面板切換與原生 details 摺疊（**零新 JS**）。content stub `content/vortex/levels/_index.md`（layout: vortex-levels）。首頁 `vortex-home.html` 在「六式」之後、ADM 之前插入第四塊主入口「核心 · 水感發展地圖」（vx-toc-row → vortex/levels/，標 L0–6 · 四式 26 階段），六式/ADM/週期化既有 DOM 順序未動。CSS 僅補 `.vx-lvl-h`/`.vx-lvl-meta`/`.vx-lvl-block`（block 欄位 white-space:pre-line），重用既有 `.vx-ladder`/`.vx-level`/`.vx-method` 等元件。**公開頁邊界**：只呈現發展階段／訓練方法／觀察指標／量化基準，不含感知判讀診斷語（「泳者說 X = 到位」屬教練診斷層，已在 sync 階段淨化）；built HTML 診斷欄位（三型/A型/B型/C型/typical_speech/main_problem）洩漏 = 0（「診斷」字僅出現在 description 的通用描述與概覽的「此類內容不在公開頁」說明）。

**兒童九種氣質 section 上線（2026-06-12）**：全新獨立 section（不屬 vortex/library），研究＋網站＋互動測驗一次到位。研究綜合在 `resources/notes/temperament-nine-traits/`（SYNTHESIS.md 原始文獻 Thomas-Chess NYLS + 延伸 Rothbart/Kagan/EAS/differential-susceptibility/Big-Five 連續性；QUIZ_DESIGN.md 計分規格）。網站重用 vortex 學術期刊殼（vx-stroke master-detail + vortex.js + vortex.css），強調色換深青 teal `#1b5e69`（與 Vortex 海軍藍區隔）。`content/temperament/_index.md`（layout: temperament-main）；`layouts/temperament/temperament-main.html`：左 rail 7 入口（概覽/九維度/三型/延伸研究/適配度/批判視角 + 測驗 CTA）+ 7 面板，閱讀面板由 `.Site.Data.temperament.*`（traits/types/frameworks/fit/critique/refs 六 yaml）server-side render。**互動測驗**：`data/temperament/quiz.yaml`（child/self 各 18 題 × 1–5 Likert，每維 2 題其一反向；5 維原型距離判三型傾向）→ `temperament-quiz.js` 純前端計分（讀 `#tq-config` JSON + DOM；維度均分→分帶 low<2.34/mid/high>3.66；歐氏距離判安樂/高需求/慢熱，差<0.5 標「之間」；輸出九維度剖面為主、三型傾向為輔、環境配合建議；絕不輸出好壞分數或診斷）。`static/css/temperament.css`（`.vx-tmp-stroke` teal 覆寫 + 完整測驗 UI）。hugo.toml nav 加「氣質」(weight 4)。**驗收**：hugo build 綠（exit 0，page 80072 bytes）+ config JSON 解析為 dict（safeJS 修正雙重轉義 bug）+ 7 面板 id 齊 + 18 反向題 + 計分演算法經 Python 忠實模擬驗證（EASY→easy dist 0.0 / DIFFICULT→difficult / SLOW→slow_to_warm，分帶合理）+ node --check JS 通過 + noscript fallback。⚠ 未做 Playwright 點擊（此 session 未載入 playwright MCP），僅靜態＋演算法模擬驗證。

**氣質 — 教學／教練應用（2026-06-12）**：使用者要把教學應用上站。**設計決策**：不另開面板（會與「適配度」重複「怎麼配合」、徒增導覽複雜度），而是把教學應用當「適配度的實務深層」併進現有 §4 適配度面板——教學應用＝goodness-of-fit 用在課堂/教練，本就是同一件事。結構：第一層原則（不動）→ 通用配合策略（不動）→ 跨框架綜合（不動）→ 新增「教學／教練應用」收合群（6 個 `<details>`：Keogh 三因子、九維度→教學動作對照、三型→教學基調、McClowry INSIGHTS 實證方案、兩陷阱、游泳/運動橋接）+ 頁尾連 UST。內容加進 `data/temperament/fit.yaml` 的 `teaching:` 區塊；template 用 `{{ with $fit.teaching }}` 渲染，**重用 tmp-strat / vx-level / tmp-list，零新 CSS**。驗收：hugo build 綠 + 教學 6 details + 20 tmp-strat-row（5 原策略 + 3 Keogh + 9 維度 + 3 型）+ Keogh/INSIGHTS/UST 連結齊 + **quiz 與 7 面板無回歸**（config dict、36 題、18 反向、180 radio、兩 script 全在）+ 無 ZgotmplZ/template error。

**全站結構健康檢查 + 死碼清理（2026-06-15）**：使用者要求整站結構健康檢查、找出「好像不太對」的連結、並把維護注意事項寫進交接單。**連結稽核結果：4030 條站內連結、0 條斷鏈、0 個失效頁內錨點**（腳本掃 public/ 全 HTML，解析 href/src 對應檔案系統，含 `--minify` 去引號格式）——使用者擔心的壞連結不存在於 404 層級；真正服務的是 CI 每次 push 重新 build 的版本（見下方維護注意事項），永遠是乾淨的。**清掉的死碼**：①孤兒 CSS `cscs.css`/`flashcard.css`（無 layout 引用，CSCS 樣式早已併入 cscs-chapter.css）②孤兒 JS `flashcard.js`（翻卡邏輯已內聯進 chapter.html）③三個零使用 shortcode `flashcard`/`highlight-quote`/`callout`（layouts/shortcodes/ 現為空）④停用 taxonomy（hugo.toml 加 `disableKinds = ["taxonomy","term"]`）——原本 Hugo 自動產生 ~348 個 `/tags/<中文>` 亂碼 URL 頁（CJK 標籤被編碼成 mojibake，如 `tags/sfra…`），這些頁只被 tags/index 自己連、從不出現在 UI，純 build 垃圾。清理後頁數 677→329、static 17→14，build 綠、零殘留引用。完整維護注意事項見下方新增專節。

## 維護注意事項（給未來維護者）

> 2026-06-15 全站健康檢查整理。開工前先讀本節 + CLAUDE.md。

**1. 部署真相（最重要，常被誤解）**
- live 站 = GitHub Actions 每次 push 用 `hugo --minify` **重新 build** 的 `./public`（見 `.github/workflows/deploy.yml`）。**committed 進 git 的 `public/` 從不被服務**。
- 因此本機看到的斷鏈/亂碼若來自 committed public，與 live 無關；live 永遠是 fresh build。
- ✅ **已處理（2026-06-15）**：`public/` 原本被 git 追蹤，每次 commit 拖一大包重生成 HTML diff（且 committed 版本根本不被服務）。本次 `git rm -r --cached public` 取消追蹤 + 加進 `.gitignore`。**今後 commit 只含 source（content/layouts/data/static/css/js/config），public/ 由 CI 重 build**。本機預覽照常 `hugo` 即可，輸出只是不再進 git。

**2. `.Site.Data` 已 deprecated（時限炸彈）**
- 8 個 layout 仍用 `.Site.Data.*`（Hugo 0.156 起 deprecated），只有 4 個已遷到新 `hugo.Data`。
- 目前 build 只是 WARN，**但 CI 的 Hugo 一旦升過移除版本，全站會 build 失敗**。遷移是機械式（`.Site.Data.x` → `index hugo.Data "x"`），有空就做完。

**3. Hugo 版本漂移**
- CI 用 **0.159.1**（寫死在 deploy.yml line 20），本機曾用 0.162.x。版本差可能造成本機預覽與 live 細微不一致。改版面前先對齊版本，或至少知道有此落差。

**4. 資料流：canonical-first「一源兩消費」（勿手改 data/）**
- `data/vortex/`、`data/adm/`、`data/periodization/` 全部是 `tools/sync_vortex.py` 從 `C:\claudehome\projects\TheVortexProject\canonical/` 同步來的。**改內容要改 canonical 再重跑 sync，不在 my-site 手改 data/**（手改會被下次 sync 洗掉）。
- `data/mnfl`、`data/ust`、`data/temperament`、`data/books.yaml` 是 my-site 自有，可直接改。
- 公開頁邊界：vortex 公開層**不放感知判讀診斷語**（「泳者說 X = 到位」屬教練診斷層），sync 階段已淨化；新增 vortex 內容前確認沒洩漏診斷型碼（三型/A型/B型/C型/typical_speech/main_problem）。

**5. 連結與路徑寫法（踩過的坑）**
- CSS/JS/圖片路徑用 `{{ .Site.BaseURL }}css/x.css`（**不加前綴 `/`**）；subdirectory 部署下 `absURL`/`relURL` 對 `/` 開頭路徑會失效。
- 頁面連結優先 `.RelPermalink`/`.Permalink`；vortex 內部跨頁連結用 `$base`（= `.Site.BaseURL`）+ 已知 slug，全部都解析得到。
- nav menu 連結用 `{{ .URL | absURL }}`。

**6. 已停用 taxonomy**
- `hugo.toml` 的 `disableKinds = ["taxonomy","term"]` 關掉了 tags/categories 生成。content frontmatter 裡的 `tags:` 現在不產頁、不可點。若未來想做標籤導覽，要先移除這行並設計乾淨的 slug（中文標籤要處理 URL 編碼，否則回到 mojibake）。

**7. layouts/shortcodes/ 現為空**
- 三個舊 shortcode 已刪。若要寫文章用 callout/quote，需重建 shortcode 或直接用 HTML（unsafe 已開）。

## 已完成

- [x] **跨泳式資料庫改成「需求優先」雙區**（2026-06-15，commit c070b89）— 資料庫頁重構為「想練什麼?」主角區(三軸 picker)+「已知道要查什麼?」配角區(3 tab);首頁升級兩條入口。詳見 Vortex section
- [x] **依需求找 drill：泳式內練習庫 + 資料庫多軸篩選**（2026-06-15，commit dbe2b1b）— 每式頁新增「練習庫」面板列本式全部 drill，環節×水感階段雙軸 AND 篩選；資料庫練習 tab 同款；泛化 inline applyFilters 支援多軸。詳見 Vortex section
- [x] **全站健康檢查 + 死碼清理**（2026-06-15）— 0 斷鏈確認；刪孤兒 cscs.css/flashcard.css/flashcard.js + 3 shortcode；停用 mojibake taxonomy；新增「維護注意事項」專節
- [x] **氣質教學／教練應用併入適配度面板**（2026-06-12）— Keogh 三因子 + 九維度教學對照 + 三型基調 + INSIGHTS + 陷阱 + 游泳橋接，6 details 收合，連 UST，零新 CSS
- [x] **兒童九種氣質 section 上線**（2026-06-12）— 研究綜合 + temperament-main 學術期刊頁（teal）+ child/self 互動測驗（九維度剖面 + 三型傾向 + 環境建議，無診斷無好壞分）
- [x] Hugo 專案骨架（無 theme，完全自訂 layout）
- [x] 首頁書架設計（書本卡片，hover 浮起效果）
- [x] 書庫 section（library/list、library/book、library/chapter）
- [x] 筆記本 section（notebook/list、notebook/single）
- [x] ~~Shortcodes：flashcard、highlight-quote、callout~~（2026-06-15 全數刪除：content 零使用，閃卡翻轉邏輯已內聯進 `library/chapter.html`）
- [x] CSS 分層：variables / base / layout / bookshelf / library / cscs-chapter / notebook / vortex（adm-* class 併入 vortex.css）+ mnfl / ust / temperament（各書/section 專用）
- [x] CSCS 24 章搬入 `library/essentials-of-strength-training/`，九宮格正常
- [x] 閃卡資料（ch01）正常，閃卡模式可用
- [x] GitHub Actions 自動部署完成
- [x] Hugo 串接 Google Sheets CSV（閃卡資料源）
- [x] **ADM 遷入 vortex + 用 vortex 設計語言重建**（2026-06-07，commit 8710ad1）
- [x] **大腦喜歡這樣學上線**（書架 + 技法工具箱，田野筆記風格）
- [x] **週期化呈現層上線**（2026-06-07，commit 28cffd3）— Bompa Periodization 進 vortex，期刊式單頁 6 節，ADM ↔ 週期化雙向互連
- [x] **水感發展 L0–L6 頁面上線**（2026-06-11，commit 85546b6）— vortex-levels rail+ladder，首頁第四塊主入口；公開頁不含診斷判讀語
- [x] **「什麼是水感」介紹頁改設計頁**（2026-06-11）— vortex-water-sense master-detail（rail + 7 面板 + 22 ladder + 8 表），取代未設計的 .md 傾倒；零新 CSS；公開頁淨化診斷型碼

## ADM 架構（2026-06-07 從 library 遷入 vortex 重建）

**起因**：ADM 原本是 cortex 書庫的一本書（`content/library/athlete-development-matrix/`，獨立 adm-book/adm-matrix/adm-single layout + adm.css + adm-matrix.js）。使用者要求整合進 vortex section，且「不是搬進去，要為了 vortex 一致性及好讀性做調整」——用 vortex 的 vx- 元件重新表達，不機械搬移。swim-coach 不在範圍（是另一套自動教練系統）。

四個頁面，皆在 `content/vortex/adm/`，layout 在 `layouts/vortex/vortex-adm-*.html`：

| 頁面 | layout | 設計 |
|------|--------|------|
| `_index.md` | vortex-adm-home | masthead + 返回 vortex/ + 三入口 vx-toc |
| `matrix.md` | vortex-adm-matrix | **master-detail**：左 rail 選支柱 → 主面板讀該支柱 4 階段（L2T→T2W）vx-ladder，points 收合；重用 vortex.js + vortex.css |
| `standards.md` | vortex-adm-standards | vx-card 技術標準，泳式 chip 篩選 + 搜尋（self-contained inline JS，讀 data/adm/standards.yaml）|
| `background.md` | vortex-adm-single | vx-article 長文（LTD 模型 / 獎牌台 / 四大支柱 / 八大考量）|

- 資料：`.Site.Data.adm.matrix`（4 支柱 × 4 階段）/ `.Site.Data.adm.standards`（22 筆），由 `tools/sync_vortex.py` 從 canonical 同步，**勿手改 data/adm/**。
- 階段中文名 / 年齡對照寫死在 `vortex-adm-matrix.html` 的 dict。
- ADM 專用樣式併入 `static/css/vortex.css`（`.vx-adm-*`），無獨立 adm.css / adm-matrix.js。
- 首頁 `vortex-home.html` 加了「放大尺度 · 運動員發展」ADM 入口。
- **附帶修手機 bug**：vx-rail 在 `@media (max-width: 820px)` 由 `position: sticky` 改 `static`（原本固定佔掉上半部頁面難瀏覽）。
- **已刪除舊架構**：`content/library/athlete-development-matrix/`（含 appendix-a.md）、`layouts/library/adm-book|adm-matrix|adm-single.html`、`static/css/adm.css`、`static/js/adm-matrix.js`、`static/images/covers/adm-cover.png`；`data/books.yaml` 移除 ADM 書目。appendix-a 長文改由 standards.yaml（canonical 源）重新呈現，退役 prose 頁。

**驗收**：本機 Hugo build 綠（671 頁）+ curl 驗證四頁 200 + 結構標記正確（matrix 4 支柱×4 階段 master-detail、standards 22 卡 + 泳式篩選、home 3 入口）+ 手機 rail position:static 已服務。⚠ 未做 Playwright 截圖（此 session 未載入 playwright MCP）。CI：見下方 push 紀錄。

## 週期化架構（2026-06-07 新增，commit 28cffd3）

**起因**：把 Bompa《Periodization》6th ed. 模組化——不是當書庫收，而是給 ADM 年度計畫一個可操作的理論骨幹（vortex 呈現），並為 swim-coach 自動課表能力預留唯讀資料源。架構同 ADM：「一源兩消費」。

**資料流**：`TheVortexProject/canonical/periodization/{structure,taper,zones}.yaml`（單一真相源，全 public 無 diagnostic 分層，因屬已出版教科書理論）→ `tools/sync_vortex.py` 的 `sync_periodization()`（全量 pass-through，無 diagnostic 剝離）→ `data/periodization/`。

**檔案**：
- `layouts/vortex/vortex-periodization.html` — 期刊式單頁（style 08 Academic Journal，重用 vx- 元件 + 新增 `.vx-pz-*`）。6 節：①三大階段 ②年度計畫類型（4 型 mono/bi/tri/multipeak）③中觀·微觀週期 ④賽前減量達峰 ⑤能量系統強度分區（Table 7.1/11.1/11.2）⑥停練流失安全表。每節附 🔵 游泳應用 callout + 來源溯源。
- `content/vortex/periodization/_index.md`（layout: vortex-periodization）。
- `static/css/vortex.css` 加 `.vx-pz-*` 區塊（不另建檔，沿 ADM 併入慣例）。
- 互連：`vortex-home.html`「放大尺度」群組加 PZ 入口；`vortex-adm-matrix.html` 概覽面板加 → 週期化前向連結（T2C/T2W 一年兩巔峰 = bi-cycle 整合點）；週期化頁 footer 反向連回 ADM matrix。
- 內容修改流程同 ADM：改 canonical（TheVortexProject/canonical/periodization/）後重跑 `sync_vortex.py`，不在此 repo 手改 `data/periodization/`。

**驗收**：本機 Hugo build 綠（673 頁）+ 輸出檢查（6 節 / 6 section-no / 7 表 / 5 swim callout / §2 四型 swim-app 全渲染 / 無 Scratch·nil·ZgotmplZ 殘留）+ 三向互連在 public/ 確認。⚠ 未做 Playwright 截圖。

**下游待續**：Phase 3 swim-coach 唯讀 FTS 引用（vendor/vortex submodule + build_knowledge_index.py 收 periodization）；Phase 4 swim-coach `rules/periodization.yaml` schema 提案（僅交 schema，coaching 參數由 Hang 填，A-zone 不派工）。

## 已完成（CSCS 內容）

### CSCS 筆記 + 閃卡（ch01–ch24 全部完成，2026-04-23）

| 章節 | 筆記 | 閃卡（張數，Google Sheets rows） |
|------|------|----------------------------------|
| ch02 | ✅ | ✅ 52 張，row 54–93 + 134–145 |
| ch03 | ✅ | ✅ 52 張，row 94–133 + 146–157 |
| ch04 | ✅ | ✅ 52 張，row 158–209 |
| ch05 | ✅ | ✅ 52 張，row 210–261 |
| ch06 | ✅ | ✅ 52 張，row 262–313 |
| ch07 | ✅ | ✅ 53 張，row 314–366 |
| ch08 | ✅ | ✅ 53 張，row 367–419 |
| ch09 | ✅ | ✅ 52 張，row 420–471 |
| ch10 | ✅ | ✅ 53 張，row 472–524 |
| ch11 | ✅ | ✅ 52 張，row 525–576 |
| ch12 | ✅ | ✅ 53 張，row 577–629 |
| ch13 | ✅ | ✅ 52 張，row 630–681 |
| ch14 | ✅ | ✅ 52 張，row 682–733 |
| ch15 | ✅ | ✅ 52 張，row 734–785 |
| ch16 | ✅ | ✅ 52 張，row 786–837 |
| ch17–ch24 | ✅ | ✅ 各 52 張，row 838–1253 |

### 大腦喜歡這樣學 / Uncommon Sense Teaching
- [x] 書本封面頁（mnfl-book layout）
- [x] 技法工具箱（mnfl-toolkit layout）—— 20 個技法，5 主題，可篩選可展開
- [x] **Uncommon Sense Teaching 上線**（書封 + 教師手冊 + 策略查找）
  - 田野筆記風格變體，深藍綠（#1B5E69）強調色
  - `data/ust/chapters.yaml`：10 章摘要
  - `data/ust/strategies.yaml`：18 個策略，6 個教學問題分類
  - slug: `uncommon-sense-teaching`，layout 前綴 `ust-`

## Vortex section

TheVortexProject 內容整合進 my-site，作為公開知識展示。路徑 `content/vortex/`，nav 顯示「Vortex」。  
**公開層嚴格非規定式**：只放物理現實、硬體邊界、常見錯誤口令（cue_bad/why/good）、L0–L6 序列、相關 drill；感受語/里程碑訊號收進「教練判讀訊號」診斷子層（`.vx-diag`），不前景化。不搬 Observations / Research。

**來源路徑：** `C:\claudehome\projects\TheVortexProject\`（canonical-first：先改原始 YAML，再 `tools/sync_vortex.py` 同步到 `data/vortex/`）

### 全頁重建為 master-detail 連貫架構（2026-06-07，commit 8744706）

**起因**：舊架構是 9 個各自獨立的分頁式 explorer（technica/bridge/instructional/drills/errors/levels/matrix/tech），點技術動作再跳 drill 會落到完全不同外觀的介面 → 連貫性破裂。使用者要求「整個打掉重建，不要看到原本的影子」，三大需求：① 連貫（不跳頁）② 不攏長（不強迫長捲）③ 轉跳順手。

**新架構（三個 layout 取代九個）：**

| layout | 頁面 | 設計 |
|--------|------|------|
| `vortex-home.html` | `/vortex/` | 學術期刊風：新手引導卡（→ freestyle/#overview）+ 六式編號目次 |
| `vortex-stroke.html` | 每式一頁 | **master-detail 單頁**：常駐左側動作目次（編號 ToC）+ 主面板就地切換 |
| `vortex-database.html` | `/vortex/database/` | 跨泳式資料庫：誤區/機制/練習/L指標四 tab + 泳式篩選 + 文字搜尋 |

**連貫性解法（vortex-stroke 核心）：**
- sticky 左 rail：導覽（概覽）/ 動作分解（動作 1..N）/ 深入（常見誤區 §機制 L水感進程，水感進程僅 free/back/breast/fly 有）
- 主面板只顯示選中項，JS 就地 swap（fade + hash 更新 + popstate 可回上一步，**不重載**）
- drill / 誤區 / 機制 / 水感層級全部用原生 `<details>` 收合，要看才原地展開 → 解決「不攏長」
- **全部 server-side render**（不像舊版 client JSON 注入）；`static/js/vortex.js` 只切 is-active 可見性，`<noscript>` fallback 全展開

**資料聚合（build time）：**
- stroke key 對映：free/back/breast/fly/udk/starts-turns；drill 用全名 → 需 `$drillKey` map
- 誤區/機制/水感層級用 `where ... "stroke" $key` 過濾；drill 用 `name_zh` 對照綁到 moves
- 計數：誤區 76 / 機制 188 / 練習 125 / L指標 43；六式 moves 8/9/11/9/7/7

**已刪除（舊架構）：** layout `vortex-drills/errors/levels/matrix/tech.html`；content `vortex/drills|errors|levels|matrix|technical/_index.md`；`static/css/vortex-home.css`、`static/js/vortex-explorer.js`

**驗收：** 本機 Hugo extended 0.162.1 build 綠（671 頁）+ Playwright 桌面/手機各 5 頁截圖（10 張，0 console error）驗證 hash 路由、rail active 同步、手機 rail→橫向 tab bar、filter chip wrap 全部正確 + CI 綠（run 27080320515）+ 已部署

**已知技術債（非阻斷）：**
- ⚠ layout 用 `.Site.Data.vortex`（Hugo 0.156 起 deprecated，未來版本移除）；專案其他舊 layout 也都觸發同 WARN。未來應統一改 `hugo.Data`。build 目前正常。
- canonical-first：本次只動 my-site 公開層 layout/CSS/JS，**未動 TheVortexProject 原始 YAML 內容**（資料 schema 不變，只換呈現層）；swim-coach submodule 無需 bump（診斷層未變）

### 跨泳式資料庫改成「需求優先」雙區（2026-06-15，commit c070b89）

**起因**：上一版把「依需求找 drill」加進資料庫練習 tab,但使用者反映**很不明顯**。三個病因:① 首頁入口埋在最底一行小字;② 資料庫副標寫「已經知道要找什麼時用這裡」把新手擋在門外;③ 四個 tab 地位平等,唯一可行動的「練習」藏進第三個 tab,篩選鈕還要自己發現。

**做法（不新建頁,重用既有 vx 元件,不動 canonical）：**
- `vortex-database.html` 重構為兩個有標題的區塊:**主角 `.vx-needs`「想練什麼?」** 放最上面(環節×階段×泳式三軸 picker + 即時計數 + drill 清單),**配角 `.vx-lookup`「已經知道要查什麼?」** 放下面(誤區/機制/L指標三 tab,移除練習 tab)。兩套獨立 inline JS:needs 自含多軸 AND filter、lookup 沿用 tab+泳式+搜尋的 applyFilters。
- `vortex-home.html`:底部一行小連結升級成兩條正式 vx-toc 列(依需求找練習 → `database/#vxNeeds` / 跨泳式查資料 → `database/`)。
- `$drillKey` 補上 `underwater_dolphin_kick→udk`、`starts_turns→starts-turns`,讓這兩類 drill 也帶泳式標籤(之前缺,選泳式會漏掉)。
- `vortex.css`:`.vx-needs`(paper 底 + 海軍藍左框,刻意醒目)、`.vx-needs-h/sub/filters/count`、`.vx-lookup`(上分隔線,配角定位)。

**未做（同前,刻意省）：** 第三軸「卡在哪」(手感/腳感/全身張力,abc_type)偏感知判讀,照公開/診斷分層規矩**不放公開頁**,待使用者拍板;書中具名缺陷(Common Stroke Deficiencies)要先抄進 canonical。

**驗收：** build 綠(329 頁)+ needs 區三軸 picker + 125 drillcard + tab 收斂為 3 + 首頁兩入口 + udk/starts-turns 帶 data-s 確認。**視覺未經真實瀏覽器確認**(無 Playwright),以部署站為準。

### 依需求找 drill：泳式內練習庫 + 資料庫多軸篩選（2026-06-15，commit dbe2b1b）

**起因**：master-detail 重建後，每式頁的 drill 只透過「動作分解」裡 move-curated 的 `$m.drills` 露出 → 一式只看得到綁在動作上的少數 drill，全式練習不完整。使用者要「像之前那樣依需求找 drill」，且可嵌進泳式頁。

**做法（重用既有 chip/is-hidden CSS，零新依賴）：**
- `vortex-stroke.html`：新增 `data/vortex/drills` 依 `.strokes` 含本式全名過濾 → 每式 rail 多一組「練習」群組 + `#drills` 面板，列本式全部 drill（free 30 / back 31 / breast 43 / fly 40 / udk 9 / starts-turns 1）。雙軸 AND 篩選：環節（category）× 水感階段（l_target，多值如 `L1 L2`）。
- `vortex.js`：新增 `.vx-drill-filters` 多軸 handler，每軸各自 active、AND 組合 toggle `.is-hidden`（與舊單軸 `.vx-filters` 並存，互不影響）。
- `vortex-database.html`：練習 tab 順帶加同款環節/水感階段兩條 chip bar；inline `applyFilters()` 已泛化成讀 active panel 內所有 `.vx-filters` bar 的 active chip（軸 = chip 帶的 `data-s`/`data-cat`/`data-level`），每軸皆需匹配（stroke 軸保留 `common` fallback）+ 文字搜尋。
- `vortex.css`：`.vx-drill-filters` / `.vx-filterbar` / `.vx-filterbar-label`（環節/階段標籤）。

**未做（v1 刻意省）：** drill 的 `deficiency_fixes`（值是 1/2/3 之類索引，語意不明確、易誤導），先不前景化。

**驗收：** Hugo 0.162.1 build 綠（329 頁）+ 六式 drill 面板渲染數正確 + 泛化 JS 軸陣列 `["s","cat","level"]` minify 後存活 + CI 綠（run 27517837346）+ 已部署。

---

## 待決定（選做）

- [ ] 章節頁新增「完整重點整理」區塊（九宮格下方補充完整學習內容）
- [ ] 書庫列表樣式優化（`library/list.html`）
- [ ] ADM Appendix B：帕拉游泳分類（若有需要才做；新架構下加一頁 `content/vortex/adm/` + vortex-adm-single layout，原始檔在 `resources/books/Athlete-development-matrix/appendix_b_para_swimming_classification.md`）
- [ ] 截圖驗證 ADM vortex 四頁（matrix master-detail / standards 卡片 / background / home）+ 手機 rail 修正（本次 session 無 playwright MCP，未做）

## Google Sheets 閃卡資料來源

- CSCS Sheet ID：`1-e_n_aCaR-ZCIVODJ4GZ1jPQL8aUkcwCLyxND2e7qhk`
- 欄位：`chapter | question | answer | tag`
- hugo.toml `params.cscsFlashcardsCSV` 指向已發布的 CSV URL
- 新增閃卡：用 `google-docs-mcp` 的 `appendRows` 寫入

## 內容製作流程（已確認）

```
Claude Code 讀 `resources/books/Essentials_of_Strength_Training_and_Conditioning,_Fourth_Edition/` 內的 .md
  → 整理成章節 .md 筆記（供人閱讀的教材）
  → 使用者確認內容
  → Claude Code 從 .md 製作閃卡 → 寫進 Google Sheets
```

## 待辦 — 週期化白話重寫 + 模組化（my-site 呈現端，2026-06-08 規劃） ✅ 已完成

**plan-check 已完成（Opus）**：`C:\claudehome\projects\TheVortexProject\plans\periodization_integration_plancheck.md`。本檔是「一源兩消費」全鏈整合，my-site 是消費端 1（公開呈現），swim-coach 是消費端 2（唯讀反查）。

**my-site 呈現層已存在**（commit 28cffd3，`vortex-periodization.html` 期刊式單頁），這次不是從零接，是把白話層接進現有頁面。資料流不變：canonical 改 → `tools/sync_vortex.py` pass-through → `data/periodization/` → template。

**✅ 已完成（2026-06-10 commit 31cea81 + 2026-06-11 ec746b4 + e781453）**：
1. ✅ canonical 把 `plain_zh` 欄加進 `canonical/periodization/*.yaml` + 新增 `_index.yaml` 概念目錄 → 跑 `sync_vortex.py`（其 `sync_periodization()` 為全量 pass-through，已自動帶進 `data/periodization/`，含新欄位與新檔）。
2. ✅ `layouts/vortex/vortex-periodization.html`：每節把 `plain_zh` 白話顯示出來（`grep plain_zh layouts/vortex/vortex-periodization.html` = 25 處），保留 🔵🟡🟢 確定性標記與 source 溯源；§5 加 4 游泳區塊 + §7 游泳年度結構 + §8 青少年 LTAD。
3. ✅ 用 `_index.yaml` 概念目錄做 master-detail 互動殼（commit ec746b4），左側常駐目次 + 右側 4 面板切換 + 20 個概念各用 `<details>` 摺疊（預設收合）；行動版修正（e781453）。
4. ✅ Hugo build 綠 → push → CI 綠。

**注意**：白話內容**不在 my-site 手改 `data/periodization/`**，源頭在 canonical；my-site 只做呈現層 template。

---

## 已廢棄（READ 旅程相關）

`vortex-psychology-journey.html`、`static/js/vortex-journey.js`、`content/vortex/psychology-journey/_index.md` 已於 commit 7f337e5 全部刪除；未來對其他共用左欄頁（感知層/泳式技術）的新手導讀採輕量處境卡入口而非整頁旅程模式。

## 下一步建議

1. **新手導讀改走輕量處境卡入口**：READ 整頁旅程模式已撤回，不再嘗試在每個共用左欄頁套單頁脊椎旅程。新手進站以**處境卡**（vortex-home 已加 5 張心理處境卡；可推廣到泳式／感知層的「你卡在哪」式入口）為主要引導。站主已驗證 psychology 處境卡有效，未來若需對其他頁加新手導讀，先加處境卡入口而非整頁 READ 旅程。
2. CSCS 所有 24 章閃卡已全部完成（ch01–ch24）
3. 若需要 ADM Appendix B，直接用 adm-single layout 加一頁即可
4. 大腦喜歡這樣學 × 渦流計劃連結：使用者確認 wiki 需求後再設計（可在技法卡新增「在游泳教學中的應用」欄位）
