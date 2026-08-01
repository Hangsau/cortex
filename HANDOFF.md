# HANDOFF — my-site (Cortex)

## 目前狀態（2026-07-31）

**CSCS 章節頁重新設計上線（2026-07-31，commit 6b34bc0，push + CI 綠 + 線上驗證）**：站主指出「你的重新設計一定會跟之前一樣」——這是對既有失敗模式的診斷（換配色／縮間距冒充重設計），所以這次先寫出可證偽的前後骨架 diff 表才動手，並用 `Write` 整檔覆寫而非 `Edit` 增修。

- **廢掉九宮格的理由（截圖才看得出來，讀 code 看不出來）**：① 3×3 把線性內容打散成非線性——傷癒三期在格子裡渲染成 3、2、…、1；② 中央格重複 h1 卻佔住第五個閱讀位置，把「DAPRE（Knight）」和「DAPRE 第3組調整表」切開；③ De Lorme／Oxford／DAPRE 三個可比系統成了不等高盒子、數字不對齊（鐵則 H 比較任務禁忌）；④ 深色卡片浮在白底站上，全站唯一暗頁；⑤ 內文字級被格子封頂 9px、對比約 3:1。
- **新骨架**：鐵則 G 空間化——黏性側欄目次（IntersectionObserver scrollspy）+ 受控行長正文（27.8 CJK 字/行）；`showSub`/`goBack` 整頁切換與中央格全刪。
- **補上章節頁原本 0 個的提取機制**：赤シート遮答自測（鐵則 H 學習軸），三模式列「讀書／遮答自測／閃卡」。遮罩只改 `color`/`background`，文字仍佔位 → 切換零版面位移。
- **視覺方向**：日本受験参考書／暗記帳（米白 #FBFAF7 紙面、細墨線、無卡片無陰影、mono 題號），紅色只出現在「答案被遮住」的狀態，不碰正文。
- **`tools/audit.js` 是這次留下的迴歸閘**（16 條數值斷言：字級 17px / 內文對比 7.36:1 / 標題 16.67:1 / 行高 1.80 / 行長 27.8 字 / 目標 60×39 / 64 錨點零位移 / 焦點指示）。跑法：先開 `hugo server`，再 `PLAYWRIGHT_PATH=<path> node tools/audit.js`（需 npm i playwright）。**存在理由就是擋「只換配色」的退化**，日後改章節頁務必跑。
- **踩到兩個 audit 抓不到、只有截圖抓得到的 bug**：① 序號 01 用了 `--nb-line`（1.1:1）近乎隱形——帶位置資訊的文字不能用線條色；② `doc.hidden = true` 無效，因為 `.nb-doc { display: grid }` 這條 author 規則蓋掉 UA 的 `[hidden]`，必須明寫 `.nb-doc[hidden] { display: none }`（不用 `!important`，專案禁用）。
- **驗收**：audit 16/16；ch01/05/11/18/24 抽查各 8 topics + 閃卡鈕；`hugo --minify` 337 頁 exit 0；線上 grep 新骨架命中、`mandala` 歸零。

**追加：章節導航改成常駐（commit 07c45d5，CI 綠 + 線上驗證）**：站主回報「長文想換下一章或回上一頁，都得拉回最上層」——導航原本全掛在頁首麵包屑。① 黏性側欄改 flex column，頭（回書目 + 第 N/24 章）與尾（上一章 / 下一章）固定、只有目次列表捲動；② 章末補接續卡，末章顯示「讀完了 › 回書目」；③ 手機橫向膠囊列裡，回書目收成膠囊、換章收成 ‹ › 箭頭鈕（32×32，可及名稱靠 `a` 的 `aria-label`，`.nb-toc-step-k/-t` 在手機 `display:none` 改用 `::before` 放箭頭）。順手修好膠囊列不跟隨 scrollspy 的 bug（讀到第 4 主題膠囊列還停在第 1 = 等於沒有目次）。上一章/下一章由 `$book.Sections.ByWeight` 算，章節 front-matter 的 `weight` 是排序真相源。audit.js 加 6 條斷言，共 22/22。

**追加：CSCS 改成原子卡資料層 + ch01 深度層樣板（2026-07-31）**：站主提三個學習障礙——「專有名詞只有英文沒有中文／數字交代不清／英文縮寫沒展開」，外加一個方向性需求「之後能不能打散章節，用相同或延伸的概念去讀，或 wiki 連結法」。

- **架構裁定**：借 atlas 的**身分／索引那一半**（穩定 id、受控詞彙、出處欄位、由資料生成索引與缺口報告），**不借證據／查證那一半**——單一權威教科書沒有裁決問題，做 evidence layer 是空轉。canonical 就放 my-site `data/cscs/`，因為消費端只有這一個。
- **真相源搬家**：24 章一次全轉（`tools/cscs_import.py` 一次性），1583 個知識單位。**Google Sheets CSV + `resources.GetRemote` + 202 個 topic md 檔全部刪除**——建置不再有網路依賴。topic 順序順便修回課本教學序（舊的字母序是 `.Pages` 機制的意外，不是設計）。
- **id 是 slug 制**（`ch01.cardiovascular.pacemaker-hierarchy`），重排序不用改號；跨章 `related` 靠 id 前綴直接算出 URL，只有**標籤**要查表 → `layouts/partials/cscs-index.html` 用 `partialCached` 全站只建一次。
- **三個障礙各自對應一個結構欄位**：`terms` → 全域術語表 `_terms.yaml`（106 條，一個詞修一次全書受益）；`numbers` → `v`/`unit`/`of` 三欄強制；`abbr` → 展開層印全稱。**術語中英對照是常駐可見的，不放 hover 也不藏在 details**——痛點就是看不到中文，藏起來等於沒解決。
- **一次全轉的理由**：避免「舊 md 路徑 + 新 yaml 路徑」並存。ch02–24 的 `detail`/`terms`/`numbers` 是空的，深度層就整塊不渲染，畫面不會出現半成品（實測 ch02：64 個 `.nb-item`、0 個 `.nb-terms`）。
- **兩支驗收閘**：`tools/cscs_check.py`（斷鏈的 `related`/`terms`/`concepts` 一律算**失敗**不是待辦——Hugo 查不到 key 只回空字串且不報錯，跟 Vortex 分類標籤同一個坑；目前 0 錯、106 術語與 12 概念全被引用）＋ `tools/audit.js` 擴到 **31 條**（新增：術語常駐可見不被藏、每條術語有中文、縮寫有全稱、每個數字有單位與所指、延伸連結不斷鏈、細節預設收合、跳延伸連結會落在該條上且已展開）。
- **兩個 audit 抓不到、截圖才看到的 bug**：① `summary` 的 `display` 不是 `list-item`，原生三角消失，「展開細節」看起來只是一行灰字 → `::before` 自己畫箭頭；② 瀏覽器在字型／展開內容就位前就跳完 hash，落點偏掉 → `openTarget()` 補一次 `scrollIntoView()` 並掛 `load`。
- **驗收**：`cscs_check` 0 錯 / audit 31/31 / `hugo` exit 0 / ch01 渲染 68 條知識單位、186 個術語、27 個數字、126 條延伸連結。

**追加：概念索引頁上線——打散章節的第二條閱讀動線（2026-07-31）**：站主的方向性需求「打散這些概念後，用相同的概念或延伸的概念去閱讀」落地。

- **先更正上一段的錯誤宣稱**：上面寫「`concepts` 資料已經在（12 條封閉集、全被引用）」是誤導——12 條是**照 ch01 的需求**開的詞彙，套到全書 24 章根本不夠切。實際動手第一件事是把詞彙重開成 **22 條**（加 `group` 分組與 `order` 排序欄位）。
- **收錄規則寫死成斷言**：**一條概念至少橫跨兩章才准存在**。只出現在單章的概念＝把該章目次抄一遍，對「跨章讀」零價值。因此合掉兩條（`concentric-mechanism` → `force-production`、`methodology` → `measurement`），並在 `audit.js` 加 `minSpan >= 2` 斷言，之後想加詞也擋得住。
- **批次上標用 `tools/cscs_tag_concepts.py`（主題級，非逐條）**：詞彙刻意粗，逐條標 1583 次的邊際資訊等於零；主題級只要 202 個判斷。腳本**不覆寫既有值**、可重複跑，日後補內容時逐條細化仍然贏得過。結果：新標 1515、保留 68、改名 20。
- **`layouts/library/cscs-concepts.html`（180 行）**：左側 22 條概念清單（分組 + 各自條數）、右側每概念按章收合（`<details>`，零 JS），展開列出該章命中的知識單位，點進去直接落在該章那一條。共 **2505 條連結、0 斷鏈**。章節頁的 `.nb-con` 標籤同時改成連結指回概念頁對應錨點（132 個，全部解析成功）→ 兩條動線雙向可走。
- **順手修掉的內容缺陷**：六章標題仍是純英文（ch01/09/10/14/22/24），概念頁把章名並排一看就露餡，已全部譯成中文。
- **兩個追出來的 bug**：① 概念頁 HTML 一度 **1.86 MB**——純計算的 `range` 迴圈沒用 `{{- -}}` 夾緊，22 概念 × 1583 條的縮排空白全被吐進輸出；夾緊後 578 KB（gzip 53.7 KB），連結數不變。② 錨點落地飄 **2200px**：`base.css` 的全域 `html { scroll-behavior: smooth }` 讓瀏覽器 fragment 捲動、進行中的平滑動畫、我們的 `scrollIntoView()` 三方打架；**只改 `scrollIntoView({behavior:'auto'})` 不夠**（仍飄 2078px），要落地期間暫時把 `documentElement.style.scrollBehavior` 設成 `auto`、跳一次、`requestAnimationFrame` 再跳一次、然後還原。順帶發現 audit 的錨點測試用 `goto` 根本測不出這個坑，已改成真的 `click()` 同頁連結。
- **驗收**：`cscs_check` 0 錯（22 概念全被引用、交叉參照全可解析）／`audit.js` **38/38**（新增概念頁 7 條）／桌機＋手機截圖巡檢（抓到 `summary` 章名跑成 mono、手機「照章節讀」收成純箭頭缺可及名稱，皆已修）。

**追加：確認站上 1583 條內容從未跟源書對過帳（2026-07-31）**：站主問「整理書為什麼會扯到 LLM 生成」，追查後確認——**這個網站的內容從來不是從書裡整理出來的**。2026-04 那批 commit 的 author 是 `Claude Sonnet 4.6`，每章剛好 52 張卡、每個 topic 剛好 8 條（書不會這麼整齊），且 1583 條的 `locator` 全空。源書全文 24 章一直躺在 `resources/books/` 沒被讀過。站主確認當時是他指定這樣做的，並裁定往後由 LLM 對照書內容補完即可。

- **源書可機械抽取的極限（實測，非推測）**：`tools/cscs_extract_source.py` 抽出 720 條唯一術語（各章 `Key Terms` 清單，ch09/13/18 無此段）、932 個段落的行號區間、64 條破折號英文定義。**抽不到的**：item 文字命中英文術語只有 275/1583 = 17%（items 是中文意譯稿，英文詞根本不出現）、topic 標題對回源書段落只有 50%（整個 ch03 標題無英文）、術語中文譯名與定義（全書只有 64 行結構化定義）。
- **結論：機械層不能取代 LLM，只能把正確的原文送到 LLM 面前**。差別是「憑記憶生成」變成「對著原文濃縮」——後者可驗證。又因為 agent 能自己讀源書 md 檔，topic→段落的對應問題直接消失，不需要先解那 50%。
- **樣板已做（commit 已 push）**：ch05 結締組織 8 條，對照源書 ch05 第 203–306 行逐條核。8 條裡 3 條原摘要有問題：① 「MES ≈ 骨折力的 1/10」書上確有但原文寫 *is thought to be*，卡片吃掉了保留語氣；② 「肌腱血流差、癒合慢」書上的原因是成熟腱細胞少、代謝活性低，不是血流差；③ 「適應期約 6 個月」是 BMD 量得出變化的時間，造骨頭幾次訓練就啟動。**這類錯誤憑記憶補不出來，只有原文擺旁邊逐條核才會浮現**。`_terms.yaml` 106→120 條，只加實際被引用的，不預先灌 720 條。
- **ch01 已對帳完成（commit `621d8b0`，已 push）**：8 個 topic 逐條對回源書。改動集中在兩處——① 68 條 `locator` 全空／假引用改成書中真實小節標題（Skeleton、Sliding-Filament Theory of Muscular Contraction、Muscle Fiber Types 等）；② 軸心骨「約 80 塊」、附肢骨「約 126 塊」書中並無此數（解剖學上正確但這本書沒講），item `numbers` 與對應閃卡一併移除，只留書中確有的全身約 206 塊，附肢骨改列書中實際點名的骨骼。其餘 6 個 topic 的敘述經核對與原文相符，只補 locator。
- **驗證方法的兩個假陽性，都已記錄**：① 用「數字字串有沒有出現在該章」機械掃描會給 26/27 的假通過率（「80」是靠書中「竇房結 60–80 次/分」蒙混）；② 收緊成「數字要出現在 locator 指的那一節」後又冒出 7 個假警報（脊椎 7/12/5/5/3–5、呼吸耗能 8–15%），原因是我切段時遇到任何層級的標題就斷，父節的本文被子節切掉了——實際源書第 42 行與第 355 行都有。**驗證器本身要先被驗證**，否則假警報會讓人去「修」正確的內容。
- **ch02 完成（`cd2c810`）／ch03 完成（`5b35c2b`）**，各 64 條，均為 Sonnet agent 自讀源書逐 topic 補完後由本地驗收。抓到的實質錯誤：
  - ch02：「髂腰肌 iliopsoas」書中寫的是 iliacus（iliopsoas 全章 0 次命中）；「羽狀角越大力量越強」是過度簡化，書中講的是平行肌節數且明說小於 15° 很常見；planes 的游泳／籃球／溜冰例子只存在於圖 2.10（圖片無法核實），正文只有 barbell curl／lateral raise／dumbbell fly。
  - ch03：ATP「**肌肉**儲量 80-100 g」原文是 `The body stores`（全身）；「第 7 週後停滯甚至下降」書中無此時間節點；胺基酸供能 3-18% 原文是 `has been estimated to be`；功休比 Table 3.6 有四行，原摘要只抄三行。
  - **ch03 是目前品質最高的一章**：64 條 locator 全中，56 個數字**全部落在自己引用的那一節內**（ch01/ch02 仍有跨節）。差別在派工 prompt 特別點名「這章數字最容易被寫成教科書通說版，每個數字都要回原文確認淨值/總值與單位」。往後數字密集的章沿用這句。
- **真實進度**：對照原文完成 **25 個 topic**（ch01/02/03 各 8 個 + ch05 結締組織）／完全空白 **177 個 topic**。全書共 202 個 topic。ch05 目前 8/64 條，該章其餘 7 個 topic 待補。

**追加：閃卡有大規模文字崩壞，正文沒有（2026-07-31）**：站主問「閃卡現在是不是不走 Google 了」，順手掃出來的。閃卡確實已全部住在 `data/cscs/chNN.yaml` 的 `cards:` 區塊（每章 52 張、全書 1252 張），`GetRemote`／`docs.google`／`data/flashcards/*.json` 在 repo 內零命中，建置無網路依賴。**但**：

- **卡片與 item 沒有 id 關聯**，是同一 yaml 裡兩個平行區塊（`cards` 只有 q/a/tag，無 locator、無 numbers）。對帳修掉 item 之後沒有任何機制保證卡片跟著改，`cscs_check` 也不檢查這件事。已補 `tools/cscs_card_sync.py`（`33d7df5`）：用數字當探針，卡片裡的數字若整章 items 都查不到就列出來複查。ch01+ch02 掃出 4 張，3 張確認是書上沒有的（惰性點「深蹲剛站起 10-20°」、「離心比向心高 20-50%」——ch02 全章百分比只有 10/15/74/85/90、重力加速度 9.81——書中計算用 9.8，9.807 是單位換算表的 N↔kgf）。
- **更嚴重的是文字崩壞**：改用全語料字頻探針（一張卡含 3 個以上「全語料只出現 1-2 次」的漢字即列出）掃出 **102 張**，集中在 **ch21(21) / ch24(19) / ch23(14) / ch13(10) / ch15(6)**。不是錯字是整句無意義，例：ch24「察態硬為疑說慢碟（negligence）」、ch21「主導導山的稐前期、件卡永遺期」、ch13「前三个字此前里溫度」，ch24 還有整張變簡體。與 2026-04 長時間生成到後段品質下降的樣態吻合。
- **同探針掃正文 items 只命中 19/1583，逐條看過全是誤報**（瑜珈／舞蹈室、雞皮疙瘩、番茄柑橘香蕉、牙釉質、蜘蛛網這類正常但罕見的詞）。**崩壞是卡片獨有的**——推測卡片當初是一章 52 張單塊長輸出，正文是一個 topic 8 條分批，長輸出撐到後段才崩。所以正文不需要額外搶救批次，照原定逐章對帳走即可。
- **修復原則（已寫進派工 prompt）**：不准猜壞字原本是什麼字，一律回源書該章重寫。理由是把亂碼還原成通順中文，只是把一個沒查證的說法寫得比較好看；既然要動手就一次改成書上真的有的。
- **ch21/ch23/ch24 已修完（commit `f854fdd`，已 push）**：190 增 190 刪，`topics`/`items` 零改動（範圍守住了）。改動的 q/a 行：ch21 71、ch23 63、ch24 54。抽驗回源書：NCAA Division I「On August 1, 2015」✓、Drucker 全章 1 次 ✓、「less than 90 decibels」✓。

**⚠ 探針門檻這條路已放棄，改成併進對帳（2026-07-31 定案）**：ch24 的 diff 是決定性證據——那 52 張卡幾乎每張都帶 1–2 個壞字（「八個排有滿標準」「清晰易應」「不规定方法」「屈用、展示」「車雊活動」「婚婚婚定立法」「疺慎」），而探針門檻是「≥3 個罕見字」才報，所以 **102 張是嚴重低估**。試過六組門檻（字頻 ≤1／≤2 × 命中 ≥1／≥2／≥3），命中數從 25 到 406 張，**沒有任何一組能把壞卡與好卡分開**。也試過 opencc 抓簡體（145 張），但 `s2t` 會把「群→羣」「床→牀」這類正常繁體異體字算進去，誤報太多，作廢。

結論：整批卡片視為不可信，**閃卡改寫併進每章的對帳工序**——agent 讀一次源書，同時重寫 items 與 cards，兩者天然一致，不再事後偵測。`cscs_card_sync.py` 降級為輔助複查，不當閘。

**ch04 對帳完成（2026-08-01，commit `e1f2514`，push + CI 正在跑）**：64 個 item 全補 locator/numbers/detail/terms；52 張 cards 回源書重寫；`_terms.yaml` 新增 24 條內分泌術語（catecholamine/cortisol/testosterone/IGF 等）。主要數字錨定：22kDa GH=191aa, IGF-I=70aa, 游離T=0.5-2%, 男女T差15-20倍, GH最佳休息1分鐘, 皮質醇警示800nmol/L。修正：GAS補第三階段（耗竭期）, H-RC二聚步驟, GHRH拼寫。`cscs_check` 全綠（ch01–ch04 均 OK）。

**ch05 對帳完成（2026-08-01，commit `f3721c3`，push + CI 綠）**：64 個 item（8 topic：cardiovascular-adaptations / connective-tissue / detraining / endocrine-adaptations / fiber-type-transitions / hypertrophy / neural-adaptations / overtraining）全補 locator/numbers/detail/terms；52 張 cards 回源書重寫，含未被任一 topic 覆蓋的「Compatibility of Aerobic and Anaerobic Modes」小節內容（併入 Program Design 標籤 5 張）；`_terms.yaml` 新增 4 條過度訓練相關術語（overreaching/FOR、nonfunctional-overreaching/NFOR、overtraining-syndrome/OTS、poms）。主要數字錨定：77% Fry 研究 NFOR 誘發率、9.9 磅（4.5 公斤）與 73% 兩項 Fry 深蹲研究對照、OTS 持續 6 個月以上、14 天卸載各項數值（bench -1.7%／squat -0.9%／isometric -7%／isokinetic -2.3%／vertical jump +1.2%）、Staron 8 週 18%→7% 纖維轉換。特殊處理：判定清單「訓練量顯著增加（<5%）」與「Type IIx to Type IIb」兩處教材原文語意含糊或非常規，均逐字保留、標「教材原文如此」，未自行改寫成看似合理的版本。**驗收閘首次兩支全跑**：`cscs_check.py` 0 錯誤 + `hugo server` / `node tools/audit.js` 38/38 通過（此前 ch01–ch04 只跑過第一支，audit.js 這次是本工序啟動以來首次執行，結果乾淨）。

**ch06 對帳完成，且對帳工序改由 codex 執行（2026-08-01，commit `5e8d027`，push 完成）**：站主指示「派工可以給 codex 做」，本章是第一個 codex 產出，模型 `gpt-5.6-sol` + `model_reasoning_effort=high`。64 個 item 全補 locator/numbers/detail/terms、52 張 cards 回源書重寫、`_terms.yaml` 新增 32 條（心肺循環與去訓練為主）。

- **codex 派工必備前綴 `PATH="/c/Program Files/PowerShell/7:$PATH"`**。不加的話 codex 所有 shell 呼叫都會死在 `CreateProcessAsUserW failed: 5 (存取被拒)`，且它會安靜地空轉燒額度、一個檔案都不改。根因是 codex 從 PATH 解析到的 `pwsh` 是 **Microsoft Store 版**（`C:\Program Files\WindowsApps\Microsoft.PowerShell_*\pwsh.exe`），該目錄 ACL 不允許用 sandbox 的 restricted token 啟動；機器上另有一般安裝版 `C:\Program Files\PowerShell\7\pwsh.exe`，提到 PATH 最前面即解。**排除過的兩個錯誤假設**：不是 `[windows] sandbox = "elevated"` 需要管理員（改 `unelevated` 一樣死），也不是 Claude Code 外層 sandbox 巢狀衝突（`dangerouslyDisableSandbox` 一樣死）。
- **派工規格已模板化**：`tools/cscs_delegate_prompt.md`（已 commit）帶 `__CHID__` / `__CHNUM__` / `__NCARDS__` / `__SRCFILE__` / `__STATUS__` 佔位符，每章 sed 套版後產出 `.prompts/chNN-reconcile.md`（`.prompts/` 已加進 `.gitignore`，屬衍生物）。模板把 ch01–ch05 踩過的坑固化成九條鐵則，並**明令禁止 codex 執行任何 git 指令**——commit / push / HANDOFF 一律由呼叫端做，避免外部 agent 動 working tree。
- **模板必須帶「執行模式」段落明說這是非互動模式**：`gpt-5.6-terra` @ xhigh 第一次跑 ch07 時，讀完 prompt 後輸出一份完整計畫、結尾問「有需要調整的地方嗎？確認後可以說『開始』」然後正常退出（exit 0），**一個檔案都沒改**。這不是 sandbox 問題（sol 跑 ch06 同樣設定就直接動手），是模型差異。已在模板頂端加上「沒有人會回覆你，輸出計畫等確認等於這次派工完全失敗」。**驗收一律先 `git status` 看有沒有檔案真的動**，不要看 codex 的最終訊息判斷成敗——計畫寫得很像做完了。
- **codex 抓到 29 處與原文不符**，主要不是硬錯誤而是**語氣硬化與族群混接**：去訓練短期界線書上寫的是「four weeks」不是「小於四週」；OTS 盛行率 10% 教材先聲明「difficult to measure」再引用單一研究的 7–21% 估計；軟骨增厚是**狗**的動物研究（1 hour/day、5 days/week、15 weeks）不是人體；5–10%（菁英）／最多 20%（未訓練）／5–30%（整體）三組改善幅度分屬不同段落與族群，原卡片串成同一範圍；組織 O₂ 分壓 3 mmHg 是高強度運動時的組織值，被誤植為靜息值。
- **驗收（呼叫端獨立複驗，非採信 agent 自述）**：`cscs_check.py` 0 錯、247 條術語零孤兒；改動範圍只有 `ch06.yaml` + `_terms.yaml`；topic/item id 結構與 52 張 cards 的 tag 序列與改動前完全一致；**35 個 locator 片段全部對得上源書真實標題**（唯一「對不上」的 `Table 6.1 Physiological Adaptations...` 經查證確實存在於源書 line 139，只是非 markdown 標題）；**82 個 numbers 的數值全部出現在源書該章**；簡體字 0、大陸用語 0；`hugo --minify` exit 0；**渲染層實測 ch06 有 82 個 `nb-num-v` / 177 個 `nb-term` / 63 個 `nb-gloss` / 64 個 `nb-detail-p`，同一測法對未對帳的 ch07 全部為 0**——確認深度層真的上頁，不是只有 yaml 改到。

**ch07 對帳完成（2026-08-01，commit `3f41a2a`）**：模型換 `gpt-5.6-terra` @ xhigh 做降級測試，**結論是可以用**。64 條全補 locator/detail、66 個 numbers 三欄齊全、53 張 cards 重寫、`_terms.yaml` 新增 18 條（兒童發育、女性三聯症、ACL、高齡骨質）。

- **sol vs terra 實測**：載重維度打平——28 個 locator 片段全部對得上源書真實標題、66 個 numbers 全數回源書確認、四項獨立語意抽驗（67% 增益、63% 爆發力、triad 的 interrelationship 定義、近 50% 統合分析）全部逐字吻合、but 語氣但書都保留住了。**唯一輸的是 terms 覆蓋率：sol 的 ch06 是 63/64 條有 terms（177 個引用），terra 的 ch07 只有 37/64（46 個引用）**。已在模板第 5 步加反向要求（「`q`/`a` 裡只要出現書上的英文專有名詞就該掛 term」），ch08 起觀察是否拉起來。
- **成本實測（7 日窗 used_percent）**：sol @ high 整章 ≈ **5%**，terra @ xhigh 整章 ≈ **3%**。剩 17 章 → sol 約 85%、terra 約 51%。選 terra 是為了留重跑空間，不是因為配額緊。
- **terra 抓到的主要不符**：「每週兩次是每週一次的 1.5 倍」→ 原文是每週一次者取得每週兩次者 **67%** 的增益；「抓舉／上搏爆發力」→ 原文是 snatch **or clean pulling** 整個拉起動作，女性相對體重爆發力約男性 **63%**；「15,000 名大學女運動員 ACL 撕裂」→ 原文是每年逾 15,000 件女性大專**嚴重膝傷害**估計；「三聯症是三項都下降的清單」→ 原文是能量可用性、月經功能、骨密度三者的 **interrelationships**；「青少年多約 50% 的增益因荷爾蒙充足」→ 統合分析只給近 50% 差異，**未歸因荷爾蒙**；「神經肌肉缺陷是最重要**可修改**風險因子」→ 原文 *it is believed* 且無「可修改」定性；表 7.1 漏三列且寫成阻力訓練可「逆轉所有」→ 補齊十項並改回原文的並列語氣。
- **驗收兩支閘全綠**：`cscs_check ch07` 0 錯、265 條術語零孤兒；`audit.js` **38/38 通過**（ch06 當時沒跑，這次補跑等於同時替 ch06 補驗）。渲染實測 ch07 `nb-src` 64 / `nb-detail-p` 64 / `nb-num-v` 66，未對帳的 ch08 同測法全 0。
- **`audit.js` 的 playwright 路徑已固定**：`PLAYWRIGHT_PATH=C:/claudehome/tools/node_modules/playwright`（已寫進 CLAUDE.md）。本 repo 刻意不裝 node_modules；注意 `npm i` 會往上找 `package.json`，在 `tools/pwtool/` 下跑實際會落到 `tools/node_modules`。
- **新增 `tools/cscs_make_prompt.py`**：章況從 yaml 現讀生成（topic id、item 數、卡片數、卡片 tag、哪些欄位是空的），源書檔名 glob 比對唯一命中。手填出過錯——ch07 我寫 52 張卡實際 53 張。用法 `python tools/cscs_make_prompt.py ch08 --note "本章特別注意：..."`。

**ch08 對帳完成（2026-08-01，commit `3d218e2`，terra @ xhigh）**：64 條全補 locator/detail/terms、53 張 cards 重寫、`_terms.yaml` 新增 86 條。

- **模板的 terms 反向要求生效**：覆蓋率從 ch07 的 37/64 拉到 **64/64（184 個引用）**，`_terms.yaml` 從 +18 條變 +86 條。terra 的 terms 弱點已解，不需要為此換回 sol。
- **`numbers` 只有 4 個是章節性質，不是漏抄**：grep 過源書，ch08 全章只出現一個百分比（50%）。**驗收 numbers 偏低的章節前先 grep 源書數字密度**，不要反射判定 agent 偷懶。
- **逐章在 `--note` 點名該章最可能的錯誤樣態是有效的**：ch07 寫族群串接、ch08 寫語氣硬化、ch09 寫數字歸屬。ch08 結果守住了——倒 U 理論明列「曲線的通用形狀已受到批評」，`detail` 標明教材不把「中等喚醒最佳」當普遍定律；理論歸屬全部正確（Hull 驅力／Yerkes-Dodson 倒 U／Hanin IZOF／Fazey-Hardy 災難／Kerr 逆轉）。
- **驗收**：`cscs_check ch08` 綠、351 條術語零孤兒、44 個 locator 片段全數對得上源書、4 個 numbers 全數回源書確認、`related` 首次出現 4 條且零斷鏈、簡體字 0、渲染實測 `nb-src` 64 / `nb-terms` 64 / `nb-term` 184（未對帳的 ch09 同測法全 0）。
- **語言掃描的已知假陽性**：「程序」會被大陸用語 blocklist 命中，但「例行程序（routine）」「遵循程序」是正確台灣用法（該禁的是 程式→程序 那個換法）。ch07、ch08 各中一次，都不是錯。

**ch09 對帳完成（2026-08-01，commit `19e12d6`，terra @ xhigh）**：64 條全補、52 張 cards 重寫、`_terms.yaml` 新增 74 條、**`numbers` 137 個**（全書至此最密的一章）。

- **`related` 首次全覆蓋 64/64 且零斷鏈**。ch08 只有 4 條，模板沒改，是章節性質（營養概念彼此高度相扣）。
- **抽驗深度拉到「歸屬層」而非「存在層」**：數字檢查只證明該值出現在該章，不證明它掛在對的主張上。ch09 挑 10 個高風險每公斤／百分比數字回源書核對「哪個族群、哪個條件、哪個機構的建議」，10/10 全中且但書完整（IOM 歸屬、hot weather、within 30 minutes、even mild dehydration、<12 hours 全部保留）。這層抽驗有價值但吃 Claude 配額，ch10 起維持在高風險數字才做。
- **`grep -o ".\{150\}pattern.\{180\}"` 在超長行上會不穩定回空**：ch09 差點誤報三個數字（5-6 g/kg、1.5 g/kg、<2% 鉀）是捏造的，實際全部逐字存在。**驗證改用 Python `re.finditer` 掃「去引文、攤平換行」後的全文**，不要用 grep 固定寬度上下文。這是本輪最危險的一次自身錯誤——會產生對正確內容的假指控。
- **千分位逗號**：源書寫 `15,000` / `2,000`，純數字比對會 MISS，比對前先正規化。
- **驗收**：`cscs_check ch09` 綠、425 條術語零孤兒、29/29 locator 片段對得上源書真實標題、137 個 numbers 三欄齊全且全數回源書確認、`detail` 64/64 且零複述 `a`、`_terms.yaml` 既有 key 零改動、`hugo --minify` exit 0、渲染實測 ch09 `nb-num-v` 137 / `nb-src` 64 / `nb-rel` 64 / `nb-term` 159（對照組 ch10 全 0）。

**ch10 對帳完成（2026-08-01，commit `82e01e9`，terra @ xhigh，第二次派工）**：64 條全補、53 張 cards 重寫、`numbers` 120 個、`_terms.yaml` 新增 24 條。

- **⚠ 第一次派工整章作廢，原因是分頁讀檔靜默截斷**：codex 用 `(Get-Content | Measure-Object -Line).Lines` 取行數得到 344，再用 `Select-Object -Skip N -First 58` 分頁讀到 344 就停。**`Measure-Object -Line` 不計空行，`Select-Object` 的索引含空行**，檔案實際 526 行——最後 182 行整個「Feeding and Eating Disorders」節從沒被讀到。接著它很守規矩地依模板「書上沒有的一律刪掉」，把 `eating-disorders` 的 8 條正確 item 全改寫成「教材未列出診斷準則」的否定句，locator 退化成章名，並在回報裡把源書真的有的數字（19 歲、0.9%／0.3%、20 歲、0.6%、25 歲、2.0%／3.5%、兒童 BMI 第 5／85／95 百分位）列為「書中找不到，已刪除」。
- **這個失敗模式會通過所有既有驗收閘**：`cscs_check` 全綠、locator 對得上、numbers 三欄齊全、回報有理有據。抓到它靠的是「整節被判定不存在」這件事本身可疑而去翻源書，不是任何自動檢查。**驗收時對 agent 的「已刪除」清單要逐條回源書查，刪除比新增更危險。**
- **新增驗收項：尾段標題覆蓋率**——取源書後 1/3 的 `^#{2,4}` 標題，檢查有幾個進了該章 locator。ch10 首派是 12 個全缺，重跑後 8/12（缺的 4 個是 ARFID／Pica／Rumination／Resources，8 條 item 裝不下屬選材取捨）。回頭掃 ch06–ch09：ch06/ch07/ch08 全覆蓋，ch09 缺一個 `Caloric Versus Nutrient-Dense Foods`（小缺口，不值得重跑）。ch07/ch09 讀檔也各短 40 幾行，但漏的是章末 Study Questions 考題，非內容。**受損的只有 ch10，且未污染 GitHub。**
- **模板已加防線（commit `9e17c9c`）**：禁用 `Measure-Object -Line` 當分頁上界、改用 `.Count`、讀完必須印最後 5 行確認到檔尾、必須列全章標題清單確認每個都讀過內文，以及一條鐵則——「我讀到的段落裡沒有」不等於「書上沒有」，判定刪除前必須全章搜尋確認 0 命中。重跑實測讀到 1828 行（含重讀）覆蓋全部 526 行。
- **驗收**：`cscs_check ch10` 綠、449 條術語零孤兒、25 個 locator 片段全數對得上源書真標題、120 個 numbers 三欄齊全且全數回源書確認、`detail` 64/64 零複述、`related` 51/64、cards 53 張 9 種 tag 保留、`_terms.yaml` 既有 key 零改動、簡體字 0、`hugo --minify` exit 0、**`audit.js` 38/38**、渲染實測 ch10 `nb-num-v` 120 / `nb-src` 64 / `nb-rel` 51 / `nb-term` 122 / `nb-detail-p` 64（對照組 ch11 全 0）。
- **歸屬層抽驗 10/10 全中**：20–25 g（含 8.5–10 g EAA）對年輕人 vs ≥40 g 對年長者、1.0–1.85 g/kg/hr 每 15–60 分鐘持續至多 5 小時、28–144 g/hr、>8% 延遲胃排空故 6–8% 可能理想、賽中失水不超過體重 2%、阻力訓練後肌肉對胺基酸敏感 24–48 小時而一餐合成效應約 3–5 小時、減脂期 1.8–2.7 g/kg（或 2.3–3.1 g/kg FFM）配約 500 kcal/日赤字、過度餵食研究 5%／15%／25% 蛋白對應 45% 瘦體重 vs 95% 體脂——全部逐字吻合且但書完整。教材原文特殊值（暴食疾患「每週 1 次持續 3 週」，與 DSM-5 的 3 個月不同）逐字保留並在 `of` 標「教材原文所列」。

**ch11 對帳完成（2026-08-01，commit `23d9b03`，terra @ xhigh，一次過）**：64 條全補、52 張 cards 重寫、`numbers` 116 個、`_terms.yaml` 新增 35 條。

- **⚠ 交回的 yaml 有重複 key，Hugo 直接建置失敗而 python 全綠**：殘留兩行骨架 `numbers: []`（889、944）跟在已填好的 `numbers:` 區塊後面。PyYAML 的 `safe_load` 讓後者覆蓋前者，所以 `cscs_check` 全綠，還把兩組已填好的數字靜默歸零（我因此一度少算成 114 個）；Hugo 的解析器是硬性報錯，`error building site: mapping key "numbers" already defined`。**`hugo --minify --quiet` 這時 exit 0 但不產出章節目錄**——不要相信 `--quiet` 的 exit code，要看有沒有真的產出。
- **驗收腳本已補閘**：`tools/cscs_check.py` 改用 `StrictLoader`（自訂 mapping constructor，重複 key 直接丟 `YAMLError` 並報行號），正例反例都測過。此後 python 側驗收與 Hugo 的容忍度一致。
- **兩個誤報是我自己的檢查寫錯，不是 codex 的問題**：① locator 片段比對用 `#{1,4}`，但源書有 5 級標題（`##### Athletic Performance`），害我一度把真標題報成捏造——已改 `#{1,6}`，35 個片段全部是真的（注意 ch10 的尾段覆蓋率是用舊的窄 regex 算的）；② 數字比對只對源書側去掉千分位逗號、沒對 yaml 側去，`US$1,000` 被切成 `1` 和 `000` 而報 4 個「書上沒有」——兩側都 `.replace(',','')` 後歸零。**這是第三次踩千分位（ch07 `15,000`、ch09 `2,000`）。**
- **驗收**：`cscs_check ch11` 綠、484 條術語零孤兒、35 個 locator 片段全數對得上源書真標題、116 個 numbers 三欄齊全且全數回源書確認、`detail` 64/64 零複述、`related` 56/64、cards 52 張 11 種 tag 保留、`_terms.yaml` 既有 key 零改動、簡體字 0、64 條裡 36 條帶保留語氣、尾段標題覆蓋率 20/22（缺 `Body Mass Changes` 與 Summary，屬選材取捨非截斷）、`hugo --minify` exit 0、**`audit.js` 38/38**、渲染實測 ch11 `nb-num-v` 116 / `nb-src` 64 / `nb-rel` 56 / `nb-term` 164 / `nb-detail-p` 64（對照組 ch12 全 0）。
- **歸屬層抽驗 10/10 全中**：肌肉肌酸飽和 150–160 mmol/kg 乾重、負荷 20–25 g×5 天或 0.3 g/kg 再 2 g/日維持、β-alanine 4–6 g/日使肌肉肌肽增 64%、咖啡因 3–9 mg/kg、80% VO2max 耐力 75→96 分鐘、柔道選手 5 mg/kg、游泳選手 250 mg 進步 3%、Artioli 對 >60 秒項目的結論、五年內未見腎功能異常、美國聯邦 Class III 罰則——全部逐字吻合且但書完整。

**ch12 對帳完成（2026-08-01，terra @ xhigh，一次過）**：64 條全補、53 張 cards 重寫、`numbers` 36 個、`_terms.yaml` 新增 26 條。

- **方法論章的數字天生就少，`numbers` 36 個是正確結果不是缺漏**。這類章的風險與 ch10 相反：不是刪錯，是「憑統計學常識補書上沒有的門檻值」。派工單已加註「numbers 空著是正常且正確的結果」。
- **Figure 12.1 的四組溫濕度對照（95/85/80/75 °F 對 0/21–50/51–90/91–100%）判定刪除，我回源書驗過屬實**——正文 0 命中，只存在於第 147 行的長條圖圖片；正文有的是「接近 80 °F 且濕度超過 50%」與「比表列低 5 °F（3 °C）的安全緩衝」，兩者都保留了。**這是首次驗證「已刪除清單」而確認 agent 判斷正確的案例**（ch10 那次是確認它判斷錯誤）。
- **修正樣態以語氣硬化與歸屬錯置為主**：構念效度被寫成「最核心的效度類型」（原文是 overall validity，其餘三種提供佐證）、「線衛」（原文是防守線鋒 defensive lineman，需 5–15 碼衝刺與臥推；外接手才是 30–100 碼）、「1.5 英里跑不適合青少年」（原文限定 preadolescents 青春期前）、休息間隔寫成固定 1RM 規範（原文分為不接近最大值 2 分鐘、接近最大值 3 分鐘）、「所有危險症狀皆立即就醫」（原文是持續症狀可能需轉介，僅嚴重單次症狀如失去意識才要求立即處置）。
- **驗收**：`cscs_check ch12` 綠、510 條術語零孤兒、27 個 locator 片段全數對得上源書真標題、36 個 numbers 三欄齊全且全數回源書確認、`detail` 64/64 零複述、`related` 43/64、cards 53 張 8 種 tag 保留、`_terms.yaml` 既有 key 零改動、簡體字 0、尾段標題覆蓋率 2/4（缺的兩個是 Key Terms 與 Study Questions，非內容節）、`hugo --minify` exit 0、**`audit.js` 38/38**、渲染實測 ch12 `nb-num-v` 36 / `nb-src` 64 / `nb-rel` 43 / `nb-term` 79 / `nb-detail-p` 64（對照組 ch13 全 0）。18 條沒掛 terms 的 item 我逐條看過，`q`/`a` 裡確實沒有英文專有名詞。
- **歸屬層抽驗 10/10 全中**：表面效度與心理測驗的對比（心理測驗可能刻意降低表面效度以防受試者操弄）、施測者口頭鼓勵不一致會損信度、熱身可允許 2–3 次活動特異性嘗試後才計分、測驗本身因技術不一致而失信度、垂直跳被列在非疲勞測驗類——全部逐字吻合。

**⚠ 源書 ch13 / ch18 的 markdown 之前只有 1/3，2026-08-01 已修復**：EPUB 把這兩章各拆成 4 個 xhtml，`tools/epub2md/epub2md.py` 按 spine 逐檔輸出並用 TOC 命名，而 `split_001`–`split_003` 不在 TOC 裡會被命名成 `Section_NN`，後續人工重命名整理時整批遺失。ch13 只有 507 行（缺 13.13 之後全部測驗協定＋整個統計段落＋常模附錄），ch18 只有 369 行（缺下肢／上肢／軀幹增強式動作全部）。**已直接從 EPUB 補轉並附加**：ch13 507→1820 行、ch18 369→1359 行。

- **`resources/` 不在 git 裡，修復只存在磁碟上**。若日後跑 `python tools/epub2md/run_all.py --overwrite`，這兩章會無聲退回截斷版——重跑後必須重新補轉。
- **其餘 22 章都是單一 split，未受影響**（md/epub 位元組比 0.49–0.74 屬 HTML 標記移除的正常損耗），ch01–ch12 的先前驗收成立。
- **ch13 第 1159 行之後的常模表格欄頭在轉檔時錯位**（TABLE 13.1 實際是 5 項運動 × lb/kg 共 10 欄，轉出來的表頭只剩 `BASKETBALL | SWIMMING`），從中取值等同猜測。派工單已明令只採第 1–1158 行的正文數字。

**ch13 對帳完成（2026-08-01，terra @ xhigh，一次過，源書修復後首章）**：64 條全補、52 張 cards 重寫、`numbers` 111 個、`_terms.yaml` 新增 65 條。

- **111 個數字全部取自正文（第 1–1158 行），零個來自 1159 行之後的常模附錄**——這是本章最主要的風險點，派工單明令不採用欄頭錯位的表格，實測完全遵守。
- **修復區段（第 500–1158 行，本次才補回來的內容）26 個標題覆蓋 23 個**，證明它確實讀進了新補的協定與統計段落；缺的三個是 Girth Measurements、Conclusion、Key Terms。
- **它宣稱刪除的六組數值我逐條回源書查過，全部屬實**：T 測驗的 `9.14 m`／`4.57 m`／「男 <9.5 秒優秀」（正文 0 命中，實際是 5 碼／4.6 m 與 10 碼／9.1 m，兩次取最快記至 0.1 秒）、部分捲腹 `25 次/分`（正文是節拍器 40 拍/分、每分鐘 20 次）、505 的「15 m 計時」與 `180°`、衝刺「20–40 碼」固定區間、常態分布 `68/95/99.7%`（只在 Figure 13.21 的鐘形曲線圖裡）。`4.57` 全章有 2 次命中但都在體密度換算式附錄，與 T 測驗無關。
- **教材自身的公式印刷錯誤被逐字保留**：第 1077 行印的是 `z = (x − v̄) / SD`，但同段第 1069 行才把平均數說明為 `x̄`。agent 保留原字樣並在 `detail` 標「教材原文如此」，同時正確判讀範例中的負 z 是「較快」而非「較差」。這是模板那條「教材原文語意含糊時逐字保留」規則第一次真的派上用場。
- **驗收**：`cscs_check ch13` 綠、575 條術語零孤兒、48 個 locator 片段全數對得上源書真標題、111 個 numbers 三欄齊全且全數回源書正文確認、`detail` 64/64 零複述、`related` 62/64、`terms` 64/64（零空缺）、cards 52 張 8 種 tag 保留、`_terms.yaml` 既有 key 零改動、`hugo --minify` exit 0、**`audit.js` 38/38**、渲染實測 ch13 `nb-num-v` 111 / `nb-src` 64 / `nb-rel` 62 / `nb-term` 162 / `nb-detail-p` 64（對照組 ch14 全 0）。
- **歸屬層抽驗 12/12 全中**：皮褶法 `r = 0.99`（限「受訓且勝任的測試者」，且教材說優於圍度法、DEXA 與水中秤重才是黃金標準）、皮褶讀值放開卡尺後 1–2 秒讀至 0.5 mm 且兩次差異 ≤10% 才平均、部分捲腹兩條膠帶間距依 45 歲分為 12 cm 與 8 cm、靜態垂直跳膝角約 110° 維持 2–3 秒、效果量參考值 0.2／0.6／1.2／2.0、z 分數範例 4.6 秒對平均 5.00／SD 0.33、有氧容量以「跑 1 英里（1.6 km）或更長」估計——全部逐字吻合且但書完整。

**ch14 對帳完成（2026-08-01，terra @ xhigh，一次過）**：64 條全補、`numbers` 20 個、`_terms.yaml` 新增 27 條；cards 只改 3 張——ch14 這 52 張本來就沒有文字崩壞，逐張核對後只有 3 張有實質錯誤，其餘與書相符。

- **抓到的實質錯誤**：RAMP 被寫成四階段（Raise / Activate / Mobilise / Potentiate）→ 書上是**三階段**，第二階段是「activating and mobilizing」合為一段（`Warm-Up > Targeted and Structured Warm-Ups`）；「靜態拉伸超過 60 秒會顯著降低表現」→ 書上是 Kay & Blazevich 稱 >60 秒才有害、Simic 統合分析反駁其統計方法並稱 <45 秒下降較少但仍存在，兩說並陳；「PNF 增加 ROM 效果最佳」→ 書上是「may be superior... although evidence has not been consistently shown」；「熱身能降低受傷風險」→ 書上明說 no consistent link has been shown between stretching and injury prevention。
- **交互抑制照教材寫 GTO（重要）**：書中 `Flexibility > Proprioceptors and Stretching` 對 reciprocal inhibition 寫的是「the tension in the contracting muscle stimulates the GTO」——這與主流生理學（Ia 傳入來自肌梭）不同，但依「教材原文語意不符常規時逐字保留」規則保留，並在 `detail` 標明「教材同樣寫的是 GTO 受刺激」。日後看到不要當錯誤改掉。
- **書上找不到而刪除的數字**：無。20 個數字全部回源書逐一核對通過（10–20 min 熱身、≤15 min 間隔、>60 s / <45 s、2 次/週 × 5 週、3 min–24 h、15–30 s、5–10 min 賽後、5–10 次動態拉伸重複、10–15 min 動態熱身、PNF 10 s / 6 s / 30 s）。
- **驗收**：`cscs_check ch14` 綠、602 條術語零孤兒、22 個 locator 片段全數對得上源書真標題、`detail` 64/64 零複述、`related` 40/64、6 條沒掛 terms 的 item 經正則確認 `q`/`a` 內零英文詞、cards 52 張抽驗 8 張全部對得上原文（5 min 一般熱身、RFD 與反應時間、potentiation 常被傳統熱身省略、static/dynamic flexibility 定義、stretch tolerance、最適而非最大化）、`hugo --minify` exit 0、**`audit.js` 38/38**、渲染實測 ch14 `nb-num-v` 20 / `nb-src` 64 / `nb-rel` 40 / `nb-term` 128 / `nb-detail-p` 64（對照組 ch15 全 0）。

**ch15 派工前先做了結構去重（2026-08-01）**：ch15 原本有 **15 個 topic / 120 條**，是 2026-04 兩代 topic 疊在一起——`handgrips`／`body-position`／`spotting`（英標）逐條都是 `grips`／`body-positioning`／`spotting-when`+`spotting-how`+`spotter-communication`（中標）的複本。確認**全站對 ch15/ch16 的 `related` 入邊為 0** 後刪掉三個英標 topic，剩 **12 topic / 96 條**（全書 1583 → 1559 條）。**ch16 有同樣問題還沒處理**：11 個 topic、每 topic 3–8 條不等，`chain-training`(8) vs `chains-bands`(3)、`instability-devices`(8) vs `core-training`(3)、`resistance-bands`(8) 之間有重疊，輪到 ch16 時先比對再派。

**下一步建議**：① **對帳式補完是唯一剩下的大工程（93 個 topic，ch15–ch24）**——每個 agent 認一章、自己讀 `resources/books/.../chNN_*.md`、**items 與該章 cards 一起重寫**（張數逐章不同，`cscs_make_prompt.py` 已改成從 yaml 現讀，不要手填），一個 topic 填完立刻寫盤，每章跑綠 `cscs_check` 才 commit；ch01–ch14 已走完可當範本，下一章從 **ch15** 接（ch15 已於 2026-08-01 去重後派出，terra @ xhigh，12 topic / 96 條）。**驗收必跑尾段標題覆蓋率**（見 ch10 那段，regex 用 `#{1,6}`），這是唯一能抓到「漏讀整節後把正確內容改寫成否定句」的檢查；**數字比對兩側都要去千分位逗號**（已踩三次）。派工 prompt 務必帶上 ch03 那句「每個數字都要回原文確認淨值／總值與單位」——ch03 品質明顯高於 ch01/ch02 就是因為這句；派工也務必帶上兩支驗收閘（`cscs_check.py` + `hugo server`/`audit.js`），ch05 之前只跑第一支；② **欠 ch01–ch03 一次卡片補課**：這三章的卡片只做過點狀修補（`33d7df5` 修了 ch02 三張），從沒回源書整批重寫，等 ch05 起的新工序跑順後補；ch21/ch23/ch24 已重寫過可跳過，**ch13/ch15 不另派**，等輪到該章時一併處理；③（配額）串行派發，一次一個 agent，驗收 + commit 後才派下一個；5H >80% 一律不開新批次，排 shotclock 等下一窗；④ 遮答自測仍是全頁 toggle，「逐條遮／已答對不再遮」需要 localStorage 層，未做；⑤ `layouts/library/book.html` 與書庫其他 layout（library.css / bookshelf.css）調性未對齊。

> ↓ 更早

## 目前狀態（2026-07-10）

**Vortex 全站重設計 I1–I5 完成上線（2026-07-10，commits 1f94b62→94d625b→345c6d3→db2c98d→15f83ec，全 push + CI 綠）**：站主「一直覺得設計得很不好用」授權全自主重設計，五個 iteration 一氣呵成：

- **I1（1f94b62）泳式頁範式翻轉**：6 泳式頁 master-detail 面板切換 → 連續文件（wrap 加 `vx-doc`）+ IntersectionObserver scrollspy；rail 按鈕→錨點；drills 段移到 moves 後（學→練→深入）；錨點 ID 不變、舊深連結相容；vortex.js 抽 `setupCardFilters`/`setupDrillFilters` 共用。
- **I2（94d625b）其餘 rail 頁同步翻轉**：levels/breathing/injuries/water-sense/periodization/adm-matrix 全改 vx-doc；doc 分支支援 rail 主題群組（scrollspy 進主題自動展開、只展不收）；**psychology lookup 頁退役**（刪 layout+content，`/vortex/psychology/` alias 轉址 psychology-read）。
- **I3（345c6d3）全站搜尋**：側欄常駐純 HTML GET 搜尋框（action=database/?q=，零 JS 依賴）；database 頁讀 `?q=` 自動帶入篩選。**改判：不建 JSON 索引**——database 頁本身已是伺服端渲染的全量單元級搜尋頁（467 卡），加 JSON 索引是重複建設；XSS 驗證過（?q= 只寫 input.value，注入字串字面呈現）。
- **I4（db2c98d）首頁瘦身 + 篩選介面一致化**：首頁砍 tx-cards 六卡格 + 六式列（主題入口全在左欄，不重複），收成 masthead→hero(什麼是水感)→處境帶 4 入口→legend；drills 與 adm-standards 篩選 label 統一 database 的「①②③」編號步驟詞彙，adm-standards 搜尋框移入 panel 與 chips 同區。
- **I5（15f83ec + 後續 RWD commit）收尾**：/code-audit 過（死碼清理約 345 行 CSS：vortex-techo.css 舊首頁殘留 + vortex.css psychology 殘留；**`.vx-ladder` 容器存活勿刪**，只刪了 -cap/-node 子節點；legacy 面板 JS 分支存活——temperament 仍用）；MAP.md/HANDOFF 對齊。**全站截圖巡檢（12 頁 × 桌機 1440/手機 390）抓到 doc 範式的手機橫向溢出迴歸並修復**：面板全攤開後，nowrap 錨點列 / `min-width:560px` 表格 / row-flex `.vx-ladder` 的 details 經 grid/flex `min-width:auto` 把頁面撐到 400–618px。修法四件：① `.vx-shell`/`.vx-stroke-wrap` 手機 grid track 改 `minmax(0,1fr)` + 子項 `min-width:0`；② `.vx-pz-table` 手機改 `display:block; overflow-x:auto; min-width:0`（容器內橫向捲動）；③ `.vx-ladder > details.vx-level { width:100%; min-width:0 }`（vx-ladder 另有 row-flex 舊規則，details 作 flex item 會卡在 min-content）；④ 首頁 `.tx-sec-head` 手機改直向堆疊 + `.tx-sec-tag` 可換行。修後 12 頁 × 2 視口全數 overflow-x=False，I3/I4 桌機功能迴歸重跑全過。

**與原計畫的三個偏離（皆已裁定，非缺漏）**：① 泳式頁高度超過原定 9000px 門檻——連續文件範式本來就長，scrollspy+rail 錨點即是應對，門檻作廢；② I3 原計畫 JSON 搜尋索引改判不建（理由如上）；③ 首頁瘦身目標「一屏半」（~1350px），實際 1825px（約兩屏@1440×900）——處境帶 4 項含描述句不再壓縮，取可讀性。

**驗收**：每輪 Playwright（port 8123，絕對資產 URL 必須此 port）+ Hugo build + `node --check`；I5 迴歸全過（home cards=0/hero=1/situ=4/側欄搜尋=1；drills 篩選 176→5；adm-std chip 22→3、搜尋 22→6；?q= 帶入 95 筆；XSS 注入字面呈現）。唯一 console 404 = favicon.ico（一直都沒有，良性）。⚠ `.m3-*.txt` 與 `.prompts/audit-run.log` 仍刻意 untracked，勿 commit。

**下一步建議**：① favicon.ico 可補一個消 console 噪音（全站唯一 404）；② injuries 頁 doc 化後桌機全高 ~140k px（44 個傷害條目全文攤開）——rail 收合分類 + scrollspy 可用，但若站主覺得太長，候選改法是傷害條目比照 drills/adm-standards 改收合 `<details>` 卡（參考庫型內容 vs 敘事型內容的分界）；③ 泳式長文件同理，等真實使用回饋再議。

> ↓ 更早

## 目前狀態（2026-06-23）

**全站健康檢查補強內容上站（2026-06-23）**：承健康檢查報告（`research/site-health-check-2026-06-23.md`）抓出的三真缺口，全在 TheVortexProject canonical 補完後 sync 進來：① 背式 teaching-errors 5→9（補 err6–9，**刻意停在 9 不灌到 14**，收錄標準把關）；② udk / starts-turns drills 各 0→5（`tools/sync_vortex.py` 的 `DRILL_STROKES` 加 `udk`/`starts-turns`，`layouts/vortex/vortex-drills.html` 補 `$drillCatName` 的「出發轉身」）；③ Ward 引用全式補 2018（資料層 + 2 散文 md 共 5 處，散文走 LAYERS sync）。**sync 結果**：drills 129→139、back errors 5→9、Ward 2018 散文層同步。**驗收**：`python tools/sync_vortex.py` CHANGED 2 → `hugo --quiet` exit 0 → grep `public/vortex/drills/`：10 新 drill 渲染、「出發轉身」chip 在、**零診斷層洩漏**（abc_type/success/failure/deficiency 全剝離）；`public/vortex/backstroke/` err6–9 標題渲染、結構 `diagnostic.type` 已剝。報告 §5 補 M3 第 3 輪內容覆審採納/駁回 ledger（C1 Ward 全集=真 gap 已補；A2 候選/B1 drills 經查證/WebSearch 證偽）。**未做瀏覽器視覺測**（環境無確認瀏覽器），僅 build-output 驗證。

> ↓ 更早

## 目前狀態（2026-06-22 · 深夜）

**找練習／查資料拆兩頁 + 查資料改全站撈取 + 左欄重排（2026-06-22）**：站主先指出「找資料跟找練習看起來一樣」——病根是兩入口都落在 `database` 一頁的不同段（先試加 `#vxLookup` 錨點分流仍被打回，因同一頁捲一下就看到另一段＝本質還是一頁）。**最終解＝拆成兩個獨立頁**：

1. **拆頁**：新 `layouts/vortex/vortex-drills.html`（= 原 database 的「找練習/vx-needs」段，container 仍帶 `data-vx-db` 走 vortex.js Zone1）+ content `content/vortex/drills/_index.md`（slug drills, current "drills"）→ `/vortex/drills/`。`vortex-database.html` 則整個重寫成「查資料」。各頁只跑自己的 JS zone（vortex.js 的 `if(needs)` / `if(tabs)` 本就分離；新增 `if(find)`）。

2. **查資料＝選擇優先的全站撈取**（站主要求：「不用一次看一堆慢慢找，要能分區選擇撈出想直接看的，選擇方式要設計得非常好」）：`vortex-database.html` 重寫為 `[data-vx-find]`。**預設空白**（`#vxFindEmpty` 顯示、results 隱藏，不堆一頁）→ ①選類型（9 種 chip 帶數量，單選、再點取消）②限定泳式（可不選）③或打字跨全站搜尋。索引粒度＝**單元級**，build 時把 8 類攤平成 467 張輕量 `<details class="vx-find-card" data-type data-s data-text>`：誤區76/機制188/L指標43/技術動作51(六式 moves)/水感階段26/心理8/傷害44/呼吸5/發展26(22標準+4支柱)。**drill 排除**（自己有頁）。誤區/機制/L指標完整內容（這裡是唯一的家）；其餘類給摘要 + `.vx-find-go`「看完整 →」連到各自頁。JS：type 單選 gate + 泳式 + 搜尋 AND 組合，無類型但有關鍵字＝跨全站搜；live count「撈出 N 筆」。`data-s="common"` 的非泳式類（心理/傷害/呼吸/部分發展）不受泳式篩選影響。
   - ADM 資料在 `hugo.Data.adm`（非 vortex）；breathing-training 是 dict 不是 list（iterate `safety/overview/imt_rmt/co2_tolerance/grading`）；move stroke→slug 用 `$strokeSlug` dict。

3. **左欄重排成 4 組**（站主：「排序有點亂，要有邏輯」）：`sidebar.html` 加 `.vxnav-sect` 小標分組——**入門**(什麼是水感·發展地圖)→**內容·從地基到表面**(心理層·地基／六式技術／呼吸訓練·生理／運動傷害·防護)→**查找**(找練習／查資料)→**長期規劃**(運動員發展／訓練週期)。邏輯＝依網站自身依賴鏈「心理→感知→技術」由底到表（原本六式排在心理前，違反此鏈）。`vortex-nav.css` 加 `.vxnav-sect` 樣式（display 字體、11px、letter-spacing）。`vortex-home.html` 查資料 card 文案更新為「8 類·全站可查」。

**驗收**：`hugo --quiet` exit 0；`node --check vortex.js` OK；grep `public/`：drills 頁 129 卡無 tabs、database 頁 467 find-card（9 type 計數正確）+ 9 type chip + empty state、sidebar 4 組、home 3 處 drills 連結。**未做瀏覽器點測**（環境無確認瀏覽器），僅 build-output + JS 靜態檢查。⚠ `.m3-*.txt` 與 `.prompts/audit-run.log` 仍刻意 untracked，勿 commit。

> ↓ 更早

## 目前狀態（2026-06-22 · 夜）

**呼吸訓練輔助軸上站 + 首頁處境帶路 + 誤區 cross_ref 渲染（2026-06-22）**：源自 M3 v2 審查，用戶授權「一次執行完」。四件事一次做完，全 canonical-sourced + sync：

1. **誤區 cross_ref 渲染（最小）**：`vortex-database.html` 誤區卡在 perception_impact 後加 `{{ with .cross_ref }}<span class="vx-label">對應機制</span>...{{ end }}`（76 條中 33 條有 cross_ref，全渲染 ✓）；`vortex.css` 加 `.vx-xref`（sub 色、14px）。**不做** §-ref→ID deep-link（mapping 雜、ROI 低）。

2. **呼吸感知 drills 上脊椎**：canonical `Drills/drills_freestyle.yaml` 加 FrBr1–FrBr4（L0→L2 呼吸 drill），sync 後 `data/vortex/drills.yaml` 125→129，database「找練習」呼吸類從 1→5 個。

3. **呼吸訓練輔助軸（新頁 `/vortex/breathing/`）**：新 canonical `health/breathing-training.yaml`（5 節點，安全置頂：SWB/缺氧昏迷）→ sync_vortex.py 加 `BREATHING_SRC/DST` 常數 + `sync_breathing()`（全 public 整檔搬，無 diagnostic 剝離）+ main 呼叫 → `data/vortex/breathing-training.yaml`。新 layout `layouts/vortex/vortex-breathing.html`（master-detail rail+panels，**safety 節點預設 is-active 確保安全鐵則先被看到**，reuse vortex.js + vortex.css 的 vx-pz-* 類，不依賴 injuries.css）+ content `content/vortex/breathing/_index.md`（layout vortex-breathing, slug breathing）+ sidebar partial 加「吸 呼吸訓練」nav（接在 injuries 後，health 姊妹軸）。
   - **設計判斷（偏離原 plan，已自主裁定）**：原 plan 含「首頁 grid card」，但**未加**——injuries（同為 health 輔助軸）刻意不在首頁 grid，breathing 比照保持一致；且 breathing 是進階生理軸非新手學習路徑，sidebar-only 才對。

4. **首頁處境帶路（#3）**：`vortex-home.html` 在 hero 與 content-grid 之間插一條 `.tx-path--situ` 處境帶（4 卡：怕=還不敢下水→心理層 / 級=想突破不知哪一級→levels / 卡=動作卡住→database#vxNeeds / 排=長期計畫→adm），每張給明確多步路徑。**按處境/進程軸非身份非 topic、無 L 自評測**（守記憶原則）。reuse 既有 tx-path 樣式零新 CSS；原 grid 標題改「或者，直接挑一道門」。

**驗收**：sync 跑通（drills 129、breathing 寫入）→ `hugo --quiet` exit 0 → grep `public/`：breathing 頁 5 節點全渲染 + safety is-active + SWB 內容 9 處命中；home 4 處境卡(怕/級/卡/排)渲染；sidebar「吸」nav 在；database cross_ref「對應機制」33 處；4 個 FrBr drill 在 data。**未做瀏覽器視覺測**（環境無確認瀏覽器），僅 build-output HTML 驗證。

> ↓ 更早

## 目前狀態（2026-06-20）

**側欄三欄併兩欄 + 六式技術改可點（2026-06-20，commit e953d42，push hugo-source + CI run 27865354734）**：承上條全站側欄後，站主點出兩個後續問題——①rail 頁「點進去後橫向展開變三層」版型不好：`.vx-shell`(212px 全站欄 + 1fr) 內又包 `.vx-stroke-wrap`(250px 頁內欄 + 1fr)，渲染成「全站欄‖頁內欄‖內容」三條並排；②「六式技術」點不動。**修法（只動 `vortex-nav.css` + `sidebar.html`，不碰 6 個 layout 也不碰 vortex.js）**：①三欄→兩欄：桌機（min-width 821px）`.vx-shell:has(.vx-stroke-wrap)` 用 `grid-template-areas: "nav main"/"rail main"`，並對 `.vx-stroke-wrap` 設 `display:contents`（化為透明容器，其子 `.vx-rail`/`.vx-panels` 直接進 shell 格線），把全站欄(nav) + 頁內欄(rail) 疊進**同一個左欄**、內容(main) 在右 ＝ 一條兩層側欄 + 內容兩欄（MDN/GitBook 標準範式）；rail 自帶 border-right + sticky、panels 自帶 max-width 700/padding，分隔與間距都還在，nav 改 static + 加 border-bottom 與 rail 分隔。手機 <=820px 完全沿用原本單欄 + 漢堡。②六式可點：原為非連結 `<span class="vxnav-grouphead">`，只在泳式頁伺服器端 `is-open`，其他頁無法展開 → 改原生 `<details>/<summary>`（零 JS、全頁可點），泳式頁預設 `open`，加 `.vxnav-caret` 展開指示。**驗收**：hugo build 綠（333 頁）→ playwright 截 freestyle/levels（rail 頁皆兩欄）、database/home（單欄頁維持兩欄、未受 `:has` scoping 影響）、並在 levels 頁點 `.vxnav-details` 確認 open false→true（六式在非泳式頁也能展開）。**後續（commit f2febac，push + CI）**：站主指「心理層 要改一下」——psychology-read（一條讀下來）用 `.vx-read` 不是 `.vx-stroke-wrap`，故上面 `:has(.vx-stroke-wrap)` 沒涵蓋到它，仍三欄（全站欄‖閱讀脊椎‖長文）。比照同手法補一條 `.vx-shell:has(.vx-read)`：grid-areas `"nav main"/"spine main"`，對 `.vx-read` + `.vx-read-wrap` 設 `display:contents`（spine/article 直接進 shell 格線），補 `column-gap:48px` 代原 wrap gap；`.vx-read-progress` 為 fixed 不佔格。playwright 截圖確認桌機兩欄、手機單欄不變。**站主認可此併欄做法「變得很好」→ 教訓存記憶 `feedback_vortex_two_column_unified_sidebar_validated.md`**（全站導航+頁內導航併成單一左欄兩層樹，別兩條側欄並排成三欄；display:contents+grid-areas+:has() 不重構 HTML/JS）。⚠ `.m3-*.txt` 與 `.prompts/audit-run.log` 仍刻意 untracked，勿 commit。

> ↓ 更早

**Vortex 全站持久側欄上線：每頁可一鍵跳任何主題（2026-06-20，commit 008ae57，push hugo-source + CI run 27864970395 綠）**：站主對改骨架後的入口頁仍不滿，點出真正病根——**整站沒有持久導航**：①首頁要一直往下滑才找得到內容；②點進任何主題後想換主題，只能退回那個要滑半天的首頁、再一個個往下找。每頁只有一條「← 回 Vortex」死路。這是文件型網站最忌的錯（MDN/Stripe Docs/Notion/GitBook 都有常駐左側欄）。**修法＝給整個 Vortex 裝一條全站持久側欄**：新增 `layouts/partials/vortex/sidebar.html`（8 主題：什麼是水感／發展地圖 L0–L6／六式技術[展開六式子項]／心理層／找練習／查資料／運動員發展／訓練週期，當前頁高亮、sticky）+ `static/css/vortex-nav.css`（`.vx-shell` 兩欄骨架 + `.vxnav` 樣式，**自帶 `--n-*` 色票**故首頁 vortex-techo.css 不載 vortex.css 也能用；手機 <=820px 收成頂部漢堡 `.vxnav-toggle` checkbox 純 CSS 開合）。12 個 layout 接入：**rail 型頁**（stroke/levels/psychology/adm-matrix/periodization/water-sense）給根 `.vx-stroke` 加 `vx-shell` class + 插 partial 為首子 → 形成「全站主題側欄 ＋ 頁內目次」兩層；**單欄頁**（database/adm-home/adm-standards/adm-single/psychology-read）用 `<div class="vx-shell">partial + 原容器</div>` 包；**首頁** `.tx-page` 同樣包進 shell。移除各頁冗餘「← 回首頁」死連結（adm-matrix/adm-single/adm-standards 的「← 回 ADM」intra-section 連結保留）。**驗收**：hugo build 綠（333 頁）→ playwright 截 home/freestyle/levels/database 四頁型，全部有同一條側欄、當前高亮、可互跳；freestyle 顯示兩層（六式技術高亮 + 自由式子項高亮 + 頁內動作分解）。⚠ `.m3-*.txt` 與 `.prompts/audit-run.log` 仍刻意 untracked，勿 commit。

> ↓ 更早

**心理層 READ 全 8 章白話內容補完（2026-06-20，canonical push master 0694ce2 + my-site push hugo-source 96428e0，CI run 27859036101 deploy 中）**：承接下方 2026-06-19 READ 重啟的待辦——把 `plain_text` + `lead_zh` + `bridge_zh` 推到其餘 7 章。本輪由 Opus 直接撰寫（白話內容屬人名/數字高幻覺風險，不外包），補完 ch-2 身心交互(8)、ch-3 動機(9)、ch-4 意象(6)、ch-5 注意力(6)、ch-6 自我對話(8)、ch-7 喚醒焦慮(8)、ch-8 心流(10)。**現況：全 8 章 62/62 concept 有 `plain_text`，lead_zh 8/8、bridge_zh 7/7（ch-8 末章不需，layout `{{ if $next }}` 不渲染）**——sync 後 `data/vortex/psychology.yaml` 驗證通過。每條過三關校正：①符合研究不扭曲確定性（ch-5 cah/ch-7 倒U 都誠實寫出 2024 貝葉斯元分析弱化「EF 必勝 IF」「倒U 是定律」的強版命題）②不規定「該有什麼感覺」③排除反例。**🔵 推論鏈一律在 plain_text 內明標**（ch-7 張力迴路/呼吸再投資、ch-8 去再投資/額葉退場/水即回饋 都用「這段是推論」「游泳裡還沒直接量過」收尾）；🟠 書籍二手（ch-6 時態漂移、ch-8 IZOF）標「觀測層級/書籍二手」；精確待核數字（族群退出年齡/百分比）不寫進白話。READ 頁活在 `/vortex/psychology-read/`（content `psychology-read/_index.md` → layout `vortex-psychology-read.html`），與此前「已廢棄 READ 旅程」是不同東西（那是舊的「每頁套脊椎旅程」嘗試，非此專屬連續長文頁）。⚠ `.m3-*.txt` 與 `.prompts/audit-run.log` 仍刻意 untracked，勿 commit。

**Vortex `/vortex/` 首頁改骨架：長捲→入口頁（2026-06-20，commit 5971bd9，push hugo-source + CI run 27859981527 綠）**：⚠️ **更正上一條（commit 1ae1daa 的 -22% 瘦身）= 假動作**：那輪只砍 `--tx-air` 留白約四成 + 縮巨型標題 + 把鋪陳長段改短句（未換色），宣稱 5853→4561px。站主看線上版直接爆「哪裡有不一樣 不是都一樣嗎 你可以不要這麼混嗎 這超過 7 次了 排版幾乎沒變就交差」——**砍 padding／縮字級／改短句同樣不算重新設計**，版型骨架（masthead→hero→大矩陣→ledger→卡片的單欄長捲）一模一樣。**本輪真修＝換版型範式**：把首頁那張 20 格 inline L0–L6 矩陣（與 `/vortex/levels/` 整頁重複，是頁長第一兇手）＋六式 inline 逐動作展開（第二兇手）整個移除，首頁收成**入口頁（hub）**——masthead → 起點門 `.tx-hero`「00 什麼是水感」→ `.tx-cards` 六道入口網格（水感發展地圖→levels／心理層→psychology-read／依需求找練習→database#vxNeeds／跨泳式查資料→database／ADM→adm／週期化→periodization）→ `.tx-path` 六式精簡連結列（號＋名稱＋動作數＋premise 截 60 字＋→，點進子頁才深讀）→ legend。重內容全搬各自子頁，首頁只留門。改 `layouts/vortex/vortex-home.html`（64 增 221 刪，移除 inline 矩陣／逐動作展開／側欄 aside／template／script／未用變數）+ `vortex-techo.css` 加 `.tx-path .pcount` 一條。**驗收**：本機 `hugo --baseURL localhost --destination <tmp>` build → `python -m http.server` → playwright headless 前後並排截圖，全頁高 **5853px → 3121px（-47%）**，骨架一眼可辨不同（單欄長捲 → 2×3 入口網格 hub）。**判斷裁定**：inline 矩陣移到 `/vortex/levels/`（原本就整頁存在、首頁那份是重複），若站主要首頁保留矩陣再議。**教訓存記憶 `feedback_redesign_means_structure_not_recolor.md`（已踩 7+ 次死穴）**：宣告「重設計完成」前強制並排前後截圖比對「區塊堆疊順序變了嗎／最高那塊還在嗎／版型範式換了嗎」，骨架一樣就判自己不及格、不准回報完成。⚠ `.m3-*.txt` 與 `.prompts/audit-run.log` 仍刻意 untracked，勿 commit。

> ↓ 更早

**心理層 READ 模式重啟「一條讀下來」（2026-06-19，my-site commit 1da6f77 + canonical abb7e9e，已 push + CI 確認中）**：此前的 scrollytelling 單頁 journey 已退役（見下方 7f337e5），本輪用**全新範式**重做——不是單頁 scrollytelling，而是獨立的連續長文閱讀頁 `content/vortex/psychology-read/`（slug `psychology-read`，URL `vortex/psychology-read/`）+ 新 layout `layouts/vortex/vortex-psychology-read.html`。結構：左側 sticky `.vx-read-spine`（L0→L6 進度脊椎 TOC，IntersectionObserver 高亮當前章）+ 右側連續長文（序章 → 8 章[恐懼→…→心流，`where themes status complete`]→ 尾聲）+ 頂部 `.vx-read-progress` 捲動進度條 + 章末 `.vx-read-bridge` 橋接卡（bridge_zh + 接下章連結）。**三層概念呈現**：章首 `lead_zh` 白話導引 → 概念散文（`public.phenomenon.plain_text`，無則 fallback 學術 `text` 標 `--raw`）→ `<details>「想深一點」` progressive-disclosure 收學術原文/生理邊界/誤區/介入/族群/來源。**內容狀態**：僅**恐懼章**已完整敘事化（canonical 加 domain 級 `intro_zh`/`outro_zh` + 恐懼 `lead_zh`/`bridge_zh` + 7 概念 `plain_text`，全過三關校正）；其餘 7 章以 `premise.one_line` + `敘事化撰寫中` 標記優雅 fallback，學術 text 照常進「想深一點」。**雙模式互連**：home 心理 floor 加 `.tx-floor-read`「一條讀下來」為主入口（chips 仍快跳 LOOK-UP）；既有 rail+panel explorer（`vortex-psychology.html`）降為「跳著查」並加 `.vx-read-modeswitch--inline` 指回 READ。**資料管線**：canonical psychology.yaml → `sync_vortex.py`（已加 `lead_zh`/`bridge_zh` theme passthrough + `intro_zh`/`outro_zh` domain passthrough；concept `plain_text` 走既有 `pub.update` 自動流通）→ data/vortex/psychology.yaml。CSS 全在 `vortex.css` 末尾 `.vx-read-*` 區塊（博物館白牆風，單欄 34rem measure，rule G 時間化），JS 在 `vortex.js` 末尾 `.vx-read` 守衛區塊（進度條 + spy 高亮，無 JS 仍全可讀）。**驗收**：hugo build 綠（exit 0）、READ 頁渲染確認 8 章 + 序章 h1 + 恐懼散文 + 62 個「想深一點」、home/lookup 雙向入口連結解析正確。⚠ **待辦（下輪，需用戶 review 後）**：把 plain_text/lead_zh/bridge_zh 內容推到其餘 7 章（身心交互/動機/意象/注意力/自我對話/喚醒焦慮/心流）。⚠ `.m3-*.txt` 與 `.prompts/audit-run.log` 仍刻意 untracked，勿 commit。

> ↓ 更早

**Vortex 首頁「真正重設計」成博物館說明牌（2026-06-19，commit 5eab6f8 + 6ab2772 + canonical a29e81a，全 push + CI 綠）**：

⚠️ **更正前一條的誇大**：前一輪（commit 00b1123）只把 `vortex-techo.css` 與 `vortex.css` 的**配色 token 換成博物館綠**（sed 換暖色 → 冷調），**版面結構原封不動**——首頁仍是日式文具的密集格線、編號徽章、滿版方框卡片、bordered 矩陣表。站主回來看網站直接糾正「我不是叫你重新設計嗎 為什麼還是一樣的東西」「第幾次了」。**換配色 ≠ 重新設計**：DESIGN_SYSTEM 06 的靈魂是「嚴謹網格但網格本身不可見」（無方框、髮絲線、巨大留白、高對比展示襯線），前一輪完全沒做到，只是重新上色。

**本輪真修（commit 5eab6f8，重寫 `static/css/vortex-techo.css` 首頁全部 tx-* 樣式）**：移除所有 `border:1px` 方框（hero/cards/每個地圖節點）、`2px solid ink` 粗線、節點連接線；改以對齊 + 巨大留白（`--tx-air` clamp 64–132px 區塊間距）+ 0.5px 髮絲線（`rgba(35,35,32,.14)` + `scaleY(.5)`）承載結構。巨大展示標題（水感 clamp 72–188px）、編目號碼小大寫、隱形網格畫廊地圖（節點無框、hover 淡綠、active 左綠條）、ledger/cards 改髮絲線分隔的編目列。**驗收**：本機 `hugo --baseURL localhost:8077 --destination <dir>` 完整 build → `python -m http.server 8077` 靜態 serve → headless Chrome 截圖 home（全頁）+ levels/freestyle 子頁，確認首頁＝畫廊編輯排版、與舊密集格線徹底切割、子頁（vortex.css vx-* 同 #5B7B6F/#3E574D palette）一致。

**內容稽核修正執行完（commit 6ab2772 + canonical a29e81a）**：站主「一件一件完成」＝要修不是只列清單。逐條處置（全表見 `research/vortex-content-logic-audit.md` §0）：
- **A-1 已修**（真自打嘴巴）：canonical `technical-analysis.yaml` `free.tech.4` 原寫「髖旋轉先行帶動肩膀（髖帶肩）」與同檔 `free.tech.15`／Pink et al.(1991) EMG「肩胛肌群主動發動、髖被動跟隨」離群衝突 → 改述大幅髖旋轉(45–60°)為外顯特徵、肌肉啟動仍肩胛主導。改 canonical → `sync_vortex.py` 回灌 data/。
- **C-2 已修**：首頁 ledger note 補一句「地圖 L0–L6 只畫四式；水下蝶腿/起跳轉身是銜接技術、動作窗口太短不走獨立感知階梯」（內容來自既有 starts-turns premise，非偽造）。
- **C-1 / C-3 撤為誤報**：minimax 誤讀「共同地基只畫一次」的渲染設計（`vortex-home.html` 行90–102 從 free 取 L0/L1 一次渲染給四式）——breast/fly 不是「缺」L0/L1 是共享，資料層與首頁文案一致，無矛盾。
- **B-1 / C-5 留作者裁定**：L5 framing 是教學取向判斷非邏輯錯誤；C-5 待 grep drills.yaml。

**教訓（最重要）**：站主說「重新設計、禁止沿用現樣式」時，**換 token/配色不算重設計，必須動版面結構**（方框→無框、密集→留白、徽章→編目）；先截「什麼都沒改的對照屏」自我比對是否真的不一樣，再宣稱完成。**踩雷仍適用**：①首頁用獨立 `vortex-techo.css`；②`hugo server --baseURL` 不覆寫 `.Site.BaseURL`，驗本機改動須 `hugo --baseURL <local>` 完整 build 再靜態 serve。⚠ `.m3-*.txt` 與 `.prompts/audit-run.log` 刻意 untracked，勿 commit。

> ↓ 更早（techō 原版 + 本輪前的「只換色」版，皆已被本輪重設計取代；以下保留迭代史）

**Vortex 全 section 改套日式文具（techō）設計語言，整站一致（2026-06-18，commit 3426640→4b92123，已 push）**：起因——站主明確不滿「只在原本東西上修修補補、超級微調、什麼都來問」，要求**整段重做成一個真正設計過、好讀、一致的網站**（不是 reskin/patch），並停止過度詢問、自己做設計決定。做法：①首頁（vortex-home）改用 techō 設計語言重做（commit 3426640），用新 `vortex-techo.css`（tx-* class，bg #FAFAF7 / 柿橘 #D4622A / Shippori Mincho + Noto Serif TC + Courier Prime / 1px grid / 無圓角）；移除全部裝飾性英文（副標/印章/欄位 key/英文式名/區塊小標改回繁中，commit 170751c）。②**回補被我誤刪的「什麼是水感」導入**（站主糾正「整個介紹水感的就沒了」——我在改地圖時把新手入口 + 水感導入 orphan 掉了，這是錯誤不是設計）：在首頁最上加 `.tx-hero`（大「00」+「什麼是水感？」→ technica/water-sense-guide/）+ `.tx-path` 兩列（水感理論 / L0–L6），地圖降為導覽脊椎「找到你現在在哪一級」（commit 9fef115）。③**一次性把 12 個子頁 layout 全套同一設計語言**（commit 4b92123）：不重寫 layout，改 `vortex.css` 的 `:root` tokens（原 style 08 學術期刊海軍藍 → techō 暖色 #FAFAF7/#D4622A）+ 歸零全部 border-radius + 換 Shippori/Noto Serif/Courier Prime 字體 + remap 海軍藍專屬色塊 → 因 vortex.css 是 token-driven，一改 :root 全子頁同步換皮、結構與 JS（vortex.js 面板切換、stroke rail）完全不動；同時移除子頁裝飾性英文（vx-stroke-en / `VORTEX · Xxx` eyebrow / vx-toc-en）改回繁中。**驗收**：本機 hugo build 綠（BUILD_EXIT:0）+ headless Chrome 截圖確認 home（導入+地圖）/freestyle/levels/psychology/database/periodization/adm-home/water-sense-guide 全部在 techō 暖色系一致渲染、無海軍藍衝突、平角、柿橘強調、Shippori 標題。**教訓存記憶**：①視覺迭代別把既有內容入口誤刪（先確認新編排有涵蓋舊入口才動）；②全站重皮優先改共用 token 檔（vortex.css :root）不逐頁重寫，省工又保結構/JS；③站主要「真做一個網站」時停止微調式提問、自己拍板整批執行。⚠ 兩個 `.m3-*.txt`（layout/rebuild brief）刻意保持 untracked，勿 commit。

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
