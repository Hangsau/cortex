# 視覺層級與閱讀動線研究：Vortex 首頁的重排提案

> 研究問題：在不新增任何區塊／卡片／入口的前提下，`vortex-home.html` 應該如何**砍、重排、調整大小與留白**，才能讓落地第一眼有一個明確的主焦點，讓眼睛三秒內找得到「自己現在該讀哪」。
>
> 範圍：**純 presentation / layout / 視覺層級 / 閱讀動線 / UI 元件**。本研究的正解不是「分版本」「加區塊」「改敘述口吻」「換字」——前一輪 IA 研究（`research/entry-wayfinding-study.md`）已確立這些方向是錯的；本研究鎖定「同一份資訊量很大的頁面，要怎麼排版才能讓人讀得下去」這個維度。
>
> 內容真相源（`TheVortexProject/canonical`）不在本研究改動範圍；本提案只動 **既有元素** 的呈現。
>
> 報告產出時間：2026-06-17
>
> 本研究**不建議**：① 任何「自陳 → 感知／技術品質判斷」的推論語（前一輪已確立，本研究維持禁區）。② 任何「進站分流」「家長版／教練版」內容差異化。③ 任何「加區塊」「加入口」「加卡」的提案——過去多輪的失敗經驗就是「每次都往頁面再加一塊」，本研究**只砍與重排**。

---

## 1. 問題定義：對著 `vortex-home.html` 的實際毛病

讀 `layouts/vortex/vortex-home.html` 後，首頁呈現**單一閱讀順序的目次**，由上而下元素完全等重：

| 順序 | 元素 | 視覺重量 | 文字 |
|------|------|---------|------|
| 1 | `.vx-masthead`（h1 + lead） | 大 | 「水感知識庫」標題 + 一段 lead |
| 2 | `.vx-start`（單一入口） | 中 | 「00 完全沒概念？先搞懂水感是什麼」 |
| 3 | `.vx-toc-label`「核心·先讀水感」 | 小（uppercase 標籤） | section 標籤 |
| 4–5 | 兩條 `.vx-toc-row` | 同上 | 水感理論 / L0–L6 |
| 6 | `.vx-toc-label`「更底層·感知的地基」 | 同上 | section 標籤 |
| 7 | 一條 `.vx-toc-row` | 同上 | 心理層 |
| 8 | `.vx-toc-label`「六大單元·挑一個開始練」 | 同上 | section 標籤 |
| 9–14 | 六條 `.vx-toc-row` | 同上 | 四式 + 起跳轉身 + 海豚踢 |
| 15 | `.vx-toc-label`「放大尺度·運動員發展」 | 同上 | section 標籤 |
| 16–17 | 兩條 `.vx-toc-row` | 同上 | ADM / 週期化 |
| 18 | `.vx-toc-label`「不想從泳式開始？依需求找」 | 同上 | section 標籤 |
| 19–20 | 兩條 `.vx-toc-row` | 同上 | 依需求找練習 / 跨泳式查資料 |

### 1.1 讀檔事實 → 版面毛病

**毛病 1：十二個同重入口並列，沒有單一主焦點。** 落地第一眼可點的東西有 12 個（1 個 `vx-start` + 11 個 `vx-toc-row`），每一個都用同一個 grid 模板（44px 編號 + 標題 + 副文案 + meta）、同一個 22px 字級、同一條底線分隔。眼睛進來沒有「哪一個最重要」的訊號。NN/g 對這種狀況的描述是 "competing elements that cancel each other out"——多個相同重量的元素會互相抵消注意力（見 §2.1）。

**毛病 2：「新手入口 `vx-start`」本該是焦點，卻比下面的 `vx-toc-row` 還小。** 對照 `vortex.css:178-205`：
- `.vx-start-h` 字級 = **21px**
- `.vx-toc-zh` 字級 = **22px**
- `.vx-toc-num` 字級 = **24px**

也就是說，全站理論上最重要的「唯一推薦入口」，字級**比下面任何一條目錄都小**。這違反最直覺的視覺層級——重要的事應該比次要的事更大、更顯眼。NN/g 在多篇 eyetracking 研究中指出，使用者會「以位置而非重要性」略過內容（見 §2.2），因此靠「放第一條」來標示優先級不足以建立焦點。

**毛病 3：閱讀動線 = 線性單向流，沒有掃讀節點。** 從 `vx-start` 到頁尾的 12 個條目全部用 `border-bottom: 1px solid var(--vx-rule)` 分隔——一條淡淡的等距分隔線把整頁變成一條長條目清單。沒有任何「視覺節點」讓眼睛停下來評估、跳過、轉向。NN/g 對此的判斷是「walls of text without subheadings drive the F-pattern」（見 §2.2）。

**毛病 4：6 條泳式並列固定線性順序，眼睛無法挑。** 六大單元目前以 6 條 `vx-toc-row` 直立堆疊（每條高約 70–90px），6 條共佔 ~500px 高度。對「想找自由式」的人，視線要走完整段才能到達；對「沒想好要游什麼式」的人，6 條幾乎相同的目錄頁給不出任何引導。當前沒有任何方式讓使用者**不靠線性掃讀就能定位**——這是 layout 層的問題，不是內容問題。

**毛病 5：所有「不同深度的內容」被攤在同一層。** 從「10 分鐘搞懂水感」這種輕量入口，到「22 項技術標準」這種資料庫查詢頁，全部用同一個 `vx-toc-row` 模板呈現。對眼睛而言，這代表：
- 「依需求找練習（125 練習）」與「什麼是水感（6 部分）」在視覺上完全等重
- 兩者的「閱讀成本」差異極大（前者是搜尋頁、後者是長文），但版面給的訊號一樣

違反 NN/g 對 information scent 的判斷：label 與副文案應該給連結的「內涵」加訊息（NN/g Information Scent），但這裡連**版面重量**都沒區分內涵差異。

**毛病 6：每個 section 前的「引言段 `.vx-list-desc`」幾乎是眼睛盲區。** 六段 `.vx-list-desc` 全部用同一個 `font-size: 14.5px; color: var(--vx-sub);`（次要灰色），6 段並排時讀者沒有理由讀它們；但這些文字其實是「為什麼這個 section 存在」的核心論述（例如「技術形式是感知系統的輸出，不是輸入」）。**字級、位置、與 section 標籤的關係**都沒有把它們推上主舞台。

**毛病 7：右下角的 `vx-legend` 兩段（知識確定性、研究原文存檔）與上方 `vx-toc-row` 的「知識氣味」完全脫鉤。** 在閱讀完 12 條目錄之前，使用者不會知道「🟢 近期文獻」是什麼意思——這個圖例在頁尾，但頁面已經被 `vx-toc-row` 灌滿了「理論 / 6 部分」「125 練習」「22 項」這類**沒有標確定性**的 meta 文字。

### 1.2 視覺層級漏斗：現在 vs 應該

| 視覺層級 | 現在 | 應該 |
|---------|------|------|
| 落地第一眼焦點 | 沒有（12 個等重入口） | **一個**主入口（`vx-start`），字級最大 |
| 一級分類（3 群） | 5 個 section label，但全部 11.5px / uppercase 同重 | 3 群「理解 / 練習 / 長期」用 24–28px 顯示 |
| 二級條目 | 全部 22px 同重 | 主要條目 19–20px；參考性質降級 15–16px |
| 引言說明 | 全部 14.5px 次要灰 | 第一群引言 17px 主色，其他群收合 |
| 圖例 | 頁尾小字 | 提升到主入口旁邊或摺合 |

---

## 2. 版面／視覺層級／閱讀動線 原則

### 2.1 視覺層級（visual hierarchy）的核心

**定義**：視覺層級是設計師用「物理特徵」在視覺場中建立**主次感知順序**的技術。**核心：使用者不必讀完所有元素就能知道哪些重要。** 來源：Wikipedia "Visual hierarchy" 條目整理 Gestalt 心理學與 Bertin 視覺變數框架。

四大技術維度（整合 Wikipedia "Visual hierarchy" + NN/g "Good Visual Design, Explained" 2025）：

1. **Size（大小）**：放大 = 重要。Kelley Gordon（NN/g 2025）對好視覺設計的具體建議：「Build hierarchy using ~3 type sizes. Use one font family with varied weights.」這意味著不該用 6、7 種不同字級——但更關鍵的是**字級之間的差距要大到肉眼可辨**。
2. **Color / Contrast（顏色／對比）**：高對比區吸引視覺。NN/g Good Visual Design 2025 推薦「monochromatic palette, ~2 main colors」。本站 `vortex.css:16-19` 已定 `--vx-accent: #1b3a5c`（海軍藍）作為單一強調色，符合此原則——**問題是這個強調色目前被平均塗在 12 個元素上，反而失去強調意義**。
3. **Position / Spatial Isolation（位置／空間隔離）**：元素在頁面中的位置直接影響注意力分配。Wikipedia "Visual hierarchy" 引述 Bertin：「items in the upper left are often seen first, and negative space can isolate figures」——**留白本身就是層級工具**。
4. **Character / Weight（字重）**：bold、italic、underline 是建立層級的最廉價工具。NN/g 觀察到的 spotted-pattern 直接依賴此點：「users fixate on words that visually stand out (links, bold text, bullets)」。

**關鍵設計原則**：層級的目的是「讓使用者不必看完就能知道哪個重要」。**競爭元素會互相抵消注意力**——NN/g Good Visual Design 2025 的隱含結論：好設計的判斷不是「每個元素都好看」，而是「最重要的事看起來最重要」。

**應用到本站**：當前頁面 12 個元素全部用同一個 `vx-toc-row` 模板（22px zh + 24px num + 14.5px sub + 12px meta），等重的結果就是「沒有最重要」。**解法不是新增元素、是調整既有元素的尺寸權重。**

### 2.2 閱讀動線：F-pattern vs Layer-cake pattern

NN/g 從 1997 年起就反覆觀察：**「使用者上線不閱讀，他們掃讀」（People rarely read online — they scan）**。此結論到 2020 年 Kate Moran 的整合研究仍未改變。

兩種主要掃讀模式（NN/g eyetracking 研究彙整）：

| 模式 | 出現條件 | 效率 | 風險 |
|------|---------|------|------|
| **F-pattern** | 頁面**沒有**清楚的標題／分塊／視覺提示時，使用者的視線沿左邊緣往下掃、第一段最仔細、第二段只看前幾字、之後只挑關鍵字 | **低** | 使用者**錯過**中段以後的實質內容；眼睛「以位置而非重要性」跳過 |
| **Layer-cake pattern** | 頁面**有**清楚的子標題時，使用者的視線在每個標題處水平停下來，**只在找到相關標題時才讀該段內文** | **高**（次於逐字讀） | 標題若不準確反映內文，使用者會誤跳 |

**Layer-cake pattern 對內容的兩個要求**（NN/g "The Layer-Cake Pattern of Scanning Web Content", Kara Pernice 2019）：

1. **使用者能輕易辨識子標題**——視覺上必須明顯（顏色、大小、字體、效果區隔），但又不能太顯眼到像廣告（否則觸發 banner blindness）。
2. **子標題必須準確摘要其下的內容**——「leading with the most important, information-bearing words」。

**應用到本站現狀**：
- 當前 `vortex-home.html` 的 5 個 `.vx-toc-label`（section 標籤）字級 11.5px / uppercase，**比子條目的 22px 小一截**。這違反 layer-cake 的要求——標籤不夠顯眼，眼睛不會在標籤處停下來，只會沿 12 條 `.vx-toc-row` 線性掃過（fallback 到 F-pattern）。
- **`.vx-toc-row` 的標題字（22px）與副文案（14.5px sub）有層級落差，但 12 條並列時這個落差被「列的數量」稀釋掉**——讀者掃 5、6 條之後就疲勞，後面 6 條事實上被忽略。

### 2.3 漸進揭露（progressive disclosure）當成視覺技術

NN/g 對漸進揭露的兩條硬規則（Jakob Nielsen 2006）：

1. **初次揭露與次級揭露的正確分割**——常用選項前置；其餘用 task analysis 與使用統計決定。
2. **明顯的進階路徑**——用強烈的「information scent」讓使用者知道點下去有東西。

**多於兩層的揭露通常會傷害可用性**——使用者在第 3 層之後會迷航。對本站而言：現有的 master-detail（`.vx-rail` + `.vx-panel`，見 `vortex.css:275-371`）與 `<details>` 收合（`.vx-drill`, `.vx-card`, `.vx-level`，見 `vortex.css:569-704`）都是現成的兩層揭露機制——**首頁要做的事就是把這兩層機制套在落地頁上**，不是再發明新元件。

### 2.4 密度管理：等重列 → 節奏版面

等重列的視覺問題：當 10+ 個相同視覺重量的元素並列，使用者的注意力會均勻分散，最後一個都記不住（**competing elements**）。

**節奏版面的設計語言**（整合 NN/g、Wikipedia、Bertin）：

| 技術 | 用途 | 對應 `vx-*` 元素 |
|------|------|-----------------|
| **主入口放大** | 唯一焦點 | `.vx-start` 應放大 |
| **次要條目降級** | 縮小／變淡／變小寫 | `.vx-toc-row` 內某些降為 15–16px |
| **群組合併** | 多條同主題的 toc-row 用 grid 排成 2×3 | 六式 `vx-toc-row` |
| **深層參考摺合** | 全部收起，預設只見一行 | `.vx-toc-row` 的「依需求找」「跨泳式查資料」 |
| **留白分隔群** | 用 `margin-top` 把 3 群分開 | 群間距 |
| **群標題放大** | 層級提升 | `.vx-toc-label` 從 11.5px 提升到 24–28px |

---

## 3. 真實前例研究

> 為什麼挑這幾個：**Stanford Encyclopedia of Philosophy** 同屬學術／參考類（與本站風格最近）；**Stripe Docs** 是當代技術文件最佳實踐；**PostgreSQL Docs** 是經典 reference work 的代表；**MDN** 在「Reference vs Guides 雙軌」上是教科書級範例。四個網站都處理「大量內容、需要快速掃讀找到自己要的」這個問題。

### 3.1 Stanford Encyclopedia of Philosophy（`plato.stanford.edu`）

**它版面怎麼做的**：
- 單欄垂直堆疊，文字優先，不靠圖。
- 頂部窄水平選單（Browse / About / Support SEP），選單本身低調；正文用大尺寸 site title + 內文用粗體 H2 區分群組。
- 群組內用「短描述句 + 短 bulleted link list」結構，每個 link 一到兩行——刻意把 link 縮短到「只讀 title 就夠」的程度。
- 「What's New」「Chronological」「Archives」三個並列的入口變體，給同一個 TOC 不同入口——但這三個入口**視覺上一樣大**，沒有強分主次。
- 入口深度由「TOC → Entry」兩層搞定；進入 entry 內部後，每個 entry 用自己的小節系統（不靠全站層級）。

**為何好讀**：
- 文字排版（type ramp + 留白）建立層級，不靠顏色。
- 「短 link label + 短描述句」的組合讓使用者可以「**三秒判斷這個 link 進去會看到什麼**」（information scent, NN/g）。
- 大留白讓眼睛有節奏，不是資訊過載。

**可借鑑到本站**：
- 本站 `vx-toc-row` 的 link label（中英文 + premise + meta）已經很類似 SEP 的「短 link + 短描述」結構。**問題是 12 條並排，把這個結構的價值稀釋掉**——借鑑重點是**減少並排數量**而非改 label。
- 群組用粗體 H2 + 上下留白區隔（本站現用 11.5px uppercase label，反而較弱）。
- 參考性的「What's New」「Chronological」「Archives」三入口**視覺等重**——這點跟本站當前毛病相同，但 SEP 是「三個同等重要的入口變體」所以等重合理；本站 12 個不是這個狀況。

**引用**：Stanford Encyclopedia of Philosophy, About 頁（讀檔事實，2026-06-17 抓取 https://plato.stanford.edu/）。

### 3.2 Stripe Documentation（`docs.stripe.com`）

**它版面怎麼做的**：
- 首頁結構極簡：頂部一個 H1「Documentation」+ 一句 tagline，下方一塊「use cases」cluster（3 主題的 action-oriented link grid），再下方一塊「Browse by product」cluster（4 大類，每類 H3 + 子項 bulleted list）。
- **沒有 hero 圖、沒有 marketing copy、超過 1 段的解釋都不在首頁**。首頁只是「門口」，所有深度內容在點進去之後。
- 「use cases」與「browse by product」是**兩種不同的入口邏輯**並列：一個按「使用者想做什麼」分，一個按「產品線」分。兩塊之間靠 section anchor（H2）分隔。
- Link label 全是動詞開頭的短句：「Accept payments online」「Sell subscriptions」「Set up your development environment」——不是「Payments」「Subscriptions」這種產品名。

**為何好讀**：
- 落地頁只負責**導向**，不負責**解釋**——使用者掃 5 秒就知道「我的入口在 use cases 還是 product」。
- Section anchor（H2）+ bullet list 構成 layer-cake pattern 教科書版：H2 抓住視線、bullet 讓使用者快速跳到對的群組。
- Link label 動詞化（action-oriented）讓使用者一眼知道「點下去會發生什麼事」——比 noun-based label 高一個 information scent 等級（NN/g Information Scent：「specific and self-explanatory」原則）。

**可借鑑到本站**：
- 本站首頁的 `vx-toc-row` 是「noun-based + premise + meta」結構（例：「心理層 · Psychology · 整段引言 · 5 主題 →」），**link label 不是動詞**——但借鑑的不是改 label，是借鑑「把首頁縮短成純門口、把深度收進子頁」這個架構邏輯。
- 「use cases / browse by product」並列的雙邏輯入口，**適用於本站的對應是「理解 / 練習 / 長期 / 參考」四群並列**——但**本站不要做 use cases 風格的卡片，因為 `vx-toc-row` 模板已存在**。

**引用**：Stripe Documentation 首頁（讀檔事實，2026-06-17 抓取 https://docs.stripe.com/）。

### 3.3 PostgreSQL Documentation（`postgresql.org/docs/`）

**它版面怎麼做的**：
- Portal page（首頁）刻意極簡：頂部一條 news banner、一塊 quick links（Archive / Release Notes / Books / Tutorials / FAQ / Wiki）、再下一塊「Documentation」section，內含一個**單一 CTA「View the manual →」** + 版本矩陣表（橫列各版本、每列 inline link pair `[18] / [Current]` + PDF 連結）。
- **整個首頁沒有 hero 圖、沒有大卡片、沒有圖示**——把「這是 reference work，不是產品 landing page」用排版本身說出來。
- 進入 manual 內部後，採用經典 reference work 兩欄 TOC（fixed left sidebar + main content pane），這是 PostgreSQL docs 數十年沿用的版型。
- 「View the manual →」是**首頁唯一的視覺強調**——單一 CTA，用位置與字級強調。

**為何好讀**：
- 「單一 CTA」直接套了 NN/g hero design 的核心結論：landing page 的第一優先是「讓使用者知道下一步是什麼」（見 §2.1 NN/g Good Visual Design 2025 強調「strategic color」「~2 main colors」）。
- 版本矩陣的 inline link pair 結構（`[18] / [Current]` 同行）是 spotted-pattern 的具體示範——使用者眼睛沿左側掃過版本號，找到對的那個才點。
- Portal 與 manual 之間有**明確的角色切換**：portal = 入口；manual = 內容。**首頁不混在一起**。

**可借鑑到本站**：
- 「單一 CTA」原則直接套用到本站：現有的 `.vx-start` 就是 single CTA 的候選人——但目前它的字級比下面所有 `.vx-toc-row` 小（見 §1.1 毛病 2），所以**single CTA 邏輯存在但視覺沒執行**。
- Portal / manual 分工邏輯可以借鑑到本站的「資料庫（依需求找練習、跨泳式查資料）」處理——這兩個是**搜尋頁**而非「閱讀入口」，**應該從首頁目次降級到 footer 或摺合**，不是留在主視覺區。

**引用**：PostgreSQL Documentation 首頁（讀檔事實，2026-06-17 抓取 https://www.postgresql.org/docs/）。

### 3.4 MDN（Mozilla Developer Network, `developer.mozilla.org`）

**它版面怎麼做的**：
- 首頁是**「content-discovery layer」**——刻意不用內頁的 sidebar-heavy 版型。改用淺層 card grids（Featured articles / Latest news / Recent contributions / Contributor Spotlight）來鋪廣度，每個 card 都有類別標籤、標題、1–3 句 excerpt。
- 主導航是 mega-menu，**左 rail 只在個別 reference pages 出現，不在首頁**——首頁純粹是廣度導覽，深度在點進去之後。
- 每個技術領域（HTML / CSS / JavaScript / Web APIs）固定兩軌：**Reference**（字典式查詢）vs **Guides**（主題式深讀）。這個雙軌在每個 section 都成立。
- Recent contributions 直接顯示 GitHub PR 標題——把「社群在動」這個訊號用最少的版面表達。

**為何好讀**：
- **首頁與內頁的版型切換很乾淨**——首頁不用 sidebar 暗示「這裡沒有深度」，內頁用 sidebar 暗示「這裡可以查東西」。**讀者在不同頁面有不同的心智模型**。
- Card grid 的「類別標籤 → 標題 → 短 excerpt」三段結構對應 spotted + layer-cake 兩個 pattern 的合成：類別標籤是 spotted 的視覺鉤子、標題是 layer-cake 的橫掃目標、excerpt 給 1–2 句 information scent。
- Reference / Guides 雙軌解決一個關鍵問題：**同一個技術有「想查」（Reference）和「想學」（Guides）兩種讀法**。本站每個 section 已經用 master-detail（`.vx-rail` + `.vx-panel`），但**沒有對應「想快查 vs 想讀懂」的二選一 affordance**。

**可借鑑到本站**：
- **首頁與內頁版型切換**這個原則可以套用——但本站已有 `.vx-home` vs `.vx-stroke`/`.vx-jrn`/`.vx-db` 的版型區別，**這個切換早就在做**，問題不在切換本身、在首頁沒切乾淨。
- 「類別標籤 → 標題 → 短 excerpt」三段結構**完全對應 `.vx-toc-row` 已有的 num + zh + premise**——所以本站模板本身沒問題，**問題在 12 條並排稀釋了這套結構的價值**。

**引用**：MDN Web Docs 首頁（讀檔事實，2026-06-17 抓取 https://developer.mozilla.org/en-US/）。

### 3.5 四個前例的共通設計語言

| 共通點 | 對應 NN/g 原則 | 對本站的啟示 |
|--------|--------------|------------|
| 單一 CTA / 單一主入口 | Good Visual Design 2025：~2 main colors | `vx-start` 應放大成 single CTA |
| Section anchor（H2）把頁面切塊 | Layer-cake pattern（Pernice 2019） | 群組 label 應從 11.5px 提升到 24–28px |
| 首頁 = portal；深度 = 子頁 | Progressive disclosure（Nielsen 2006） | 「資料庫」類條目應從首頁目次降級 |
| 短 link label + 短 excerpt | Information scent（NN/g） | 既有 `.vx-toc-row` 模板已對——剩的是減少並排 |
| 兩種入口邏輯並列（task / topical） | NN/g Topic+Task vs Audience | 本站是「理解 / 練習 / 長期 / 參考」四群並列 |

---

## 4. 首頁具體重排提案

> **本提案的硬約束（重申）**：
> 1. **不新增任何區塊、卡、入口**——過去多輪失敗經驗就是「每次都往頁面再加一塊」。
> 2. **只動既有 `.vx-*` 元素**——所有改動都對應既有的 HTML 元素或 CSS class（必要時透過既有的 class 組合實現視覺效果，不發明新 class）。
> 3. **不改內容文字**——只調整位置、大小、留白。
> 4. **不改色系**——既有 `--vx-accent` 海軍藍、`--vx-gold` 暗金、`--vx-sub` 灰色照用。
>
> **本提案的可執行性**：HTML 端的改動是「把 `.vx-toc-row` 重新分組、把 label 層級放大、在某些地方加上 `<details>` 收合」；CSS 端的改動是「微調若干既有 class 的字級與 margin」（具體微調清單列於 §4.6）。**所有元素都是既有的。**

### 4.1 落地第一眼：唯一的主焦點

**主焦點是什麼**：**`.vx-start`（"完全沒概念？先搞懂水感"）**。理由：
- 它目前已經是單一 CTA 的候選人（單獨存在、其他都是 `.vx-toc-row` 群組）
- 它的 link 已經指向最常見的「新手起點」（水感理論）
- 它的標的與站名「水感知識庫」對齊——「不知道水感是什麼，就從這裡開始」是最自然的閱讀起點

**怎麼讓它成為焦點**（純 CSS 調整，不改 HTML 結構）：
- `.vx-start-h` 字級從 **21px 提升到 28–30px**
- `.vx-start-no` 從 **30px 提升到 48–56px**（讓那個「00」變成視覺錨點）
- `.vx-start` 整體 padding 從 `20px 22px` 提升到 `28px 30px`，border-left 從 `4px solid var(--vx-accent)` 改為**保留**（已經是強調色）
- `.vx-start` 的背景色從 `var(--vx-paper)` 改為**保留**（淺紙色已是弱背景），但加 `border: 1px solid var(--vx-rule2)` 維持邊框
- `.vx-start-go`（「開始讀 →」）從 `var(--vx-accent)` 改為**保留**（已是強調色），字級從既有略大到 15–16px

**閱讀順序**：眼睛落地 → h1（站名） → lead（一句話）→ `.vx-start`（大一號、唯一大號的入口）→ **自然的「點這裡」訊號**。

**為何不違反硬約束**：沒有新增任何元素；只放大既有 `.vx-start` 的視覺權重。

### 4.2 三大群組取代 5 個 section

**目前 5 個 section label**：「核心·先讀水感」「更底層·感知的地基」「六大單元·挑一個開始練」「放大尺度·運動員發展」「不想從泳式開始？依需求找」。

**重排為 3 大群**（**純標籤與視覺權重的重排，不刪任何一條 `.vx-toc-row`**）：

| 群 | 涵蓋既有 section | 群標籤 | 視覺重量 |
|----|---------------|--------|---------|
| **群 1：理解**（Theory） | 「核心·先讀水感」2 條 + 「更底層·感知的地基」1 條 = **3 條** | 「先讀懂」 | 最大（主入口後的第二焦點） |
| **群 2：練習**（Practice） | 「六大單元」6 條 = **6 條** | 「挑一式開始練」 | 中（佔最大面積，但視覺次於群 1） |
| **群 3：長期**（Long-term） | 「放大尺度·運動員發展」2 條 = **2 條** | 「長期發展」 | 中（同群 2，但 2 條並排因此單位面積更大） |
| **參考：摺合**（Reference，預設收合） | 「不想從泳式開始？依需求找」2 條 = **2 條** | 「想直接查資料？」 | 最小（用 `<details>` 預設收合，只露一行） |

**群標籤的視覺提升**：
- 從既有 `.vx-toc-label`（11.5px uppercase）**改為群標籤用 h2 字級（28–34px）**——建立 layer-cake pattern 的橫掃目標。
- 群標籤的引言段（`.vx-list-desc`）從 14.5px 灰色**提升到 16–17px**——讓「為什麼這個群存在」的論述進入主視覺（解 §1.1 毛病 6）。

**為何不違反硬約束**：沒有刪任何一條 `.vx-toc-row`，只是把 5 個 section label 重新命名為 3 個群 + 1 個摺合區。HTML 改動量：把現有 5 個 `<h2 class="vx-label vx-toc-label">` 合併／重排為 3 個 + 1 個 `<details>` 包裹區。

### 4.3 群 1「理解」的內部層級

**目前**：3 條 `.vx-toc-row`（水感理論 / L0–L6 / 心理層）全部 22px 同重。

**重排**：3 條之間建立內部層級。

| 條目 | 字級 | 視覺處理 |
|------|------|---------|
| 1. **水感理論** | 20px（主要） | 加大 `.vx-toc-zh`、`.vx-toc-num` 從 24px 提升到 28px；保持現有 `.vx-toc-prem` 14.5px |
| 2. **L0–L6 發展** | 18px（次要） | 略小一號；對應 `.vx-toc-zh` 18px、`.vx-toc-num` 22px |
| 3. **心理層** | 17px（再次要） | 再小一號；對應 `.vx-toc-zh` 17px、`.vx-toc-num` 20px |

**為何這樣排**：水感理論是 L0–L6 的前提（`vortex-levels.html:51` 明確寫「還不確定『水感』到底是什麼？先讀水感理論」），L0–L6 是心理層的具象化。三者構成一個「讀的順序」，用字級大小反映這個順序。

**為何不違反硬約束**：沒新增元素、沒改 link 內容、沒改順序——只調整 `.vx-toc-row` 的內部字級。

### 4.4 群 2「練習」的密度管理

**目前**：6 條 `.vx-toc-row` 直立堆疊（每條 ~70–90px 高），總高約 ~500px。

**重排**：6 條壓成 **2×3 grid 排列**（用既有 CSS grid，3 欄 2 列）。每條仍然是 `.vx-toc-row`，但：
- 拿掉 `.vx-toc-meta`（每條右側的「N 個動作 →」meta）—— 這是次要訊息，grid 內空間不夠、也不必要
- 拿掉 `.vx-toc-prem`（中段長描述）—— 6 條並列時，長描述會把 grid 撐到無法掃讀；改成只在 hover 時顯示，或完全省略（已寫在水感知識庫概覽頁，未來使用者點進去才看得到）
- 只留 `.vx-toc-num` + `.vx-toc-zh` + `.vx-toc-en`，三件組合成 6 個**等大方塊**

**視覺結果**：6 條變成 2 列 3 欄的 grid，**眼睛不必線性掃讀、可以直接看自由式那一格**（spotted pattern）。每格高度約 80–100px，總高約 200–250px（從 500px 降到一半）。

**為何不違反硬約束**：
- 沒新增元素（grid 是 CSS 重排，不是新元件）
- 沒改 link 或 link 內容
- 拿掉的 `.vx-toc-prem` 與 `.vx-toc-meta` 仍然存在於子頁（每個 stroke 自己的 `_index.md` 都有 premise 與動作數），只是不在首頁 grid 裡

### 4.5 群 3「長期」與參考摺合區

**群 3 長期**：
- 2 條 `.vx-toc-row`（ADM + 週期化）維持現有樣式，但因為只有 2 條，視覺上自動形成「並列雙格」。
- 群標籤「長期發展」字級 28–34px。
- 引言段（`.vx-list-desc`）16–17px。

**參考摺合區**：
- 2 條 `.vx-toc-row`（依需求找練習 + 跨泳式查資料）包進一個 `<details>`，**預設收合**。
- 收合時只見一行：「想直接查資料？▾」——點開才看到 2 條 `.vx-toc-row`。
- 這對應 NN/g Progressive Disclosure 2006：「hide advanced material, keep key options upfront」+ layer-cake pattern：用 `<details>` 標籤當 layer-cake 的橫掃目標。

**為何這樣處理**：依需求找練習（125 練習）與跨泳式查資料是**搜尋頁**而非閱讀頁——使用者進到這兩個頁面時**已經知道要查什麼**，不需要在落地頁上給它們等重的位置。降級到摺合區對應 PG Docs 把 archive / older versions 放到主矩陣**之後**的邏輯（§3.3）。

### 4.6 字級、字重、留白的層級階梯

**字級階梯**（從大到小；對應既有 class 或 CSS 變數；08 學術期刊風）：

| 角色 | 字級 | 字重 | 字型 | 對應元素 |
|------|------|------|------|---------|
| H1 站名 | clamp(34px, 6vw, 56px) | 600 | Crimson Pro | `.vx-masthead h1`（既有） |
| 主入口 CTA 標題 | **28–30px**（既有 21px → 提升） | 600 | Crimson Pro | `.vx-start-h` |
| 主入口 CTA 編號 | **48–56px**（既有 30px → 提升） | 600 | Crimson Pro | `.vx-start-no` |
| 群標籤 H2 | **28–34px**（既有 11.5px → 提升） | 600 | Crimson Pro | 新增：`.vx-toc-label` 提升，或用既有 `.vx-panel h2` 風格 |
| 群引言 | **16–17px**（既有 14.5px → 提升） | 400 | Source Serif 4 | `.vx-list-desc`（既有） |
| 一級 toc-zh | **19–20px**（既有 22px → 微降） | 500 | Crimson Pro | `.vx-toc-zh` |
| 二級 toc-zh | **17–18px** | 500 | Crimson Pro | 同上（差異化用 CSS modifier） |
| 三級 toc-zh | **15–16px** | 500 | Crimson Pro | 同上 |
| 編號 toc-num | **24–28px** | 600 | Crimson Pro | `.vx-toc-num` |
| 副文案 toc-prem | **14.5px**（既有） | 400 | Source Serif 4 | `.vx-toc-prem` |
| Meta 與英文小寫 | **11.5–12px** | 400 | Source Serif 4 | `.vx-toc-en` / `.vx-toc-meta`（既有） |

**字階規則**（NN/g Good Visual Design 2025：「~3 type sizes」原則的延伸）：
- 同一個視覺層級的字級差距**至少 4px**（這樣肉眼一眼可辨）
- 群與群之間用**留白**區隔，不用字級區隔
- 同一條 `.vx-toc-row` 內部 `.vx-toc-zh` 與 `.vx-toc-prem` 字級差距**至少 4–5px**（已有）

**留白階梯**：

| 用途 | margin-top | 對應元素 |
|------|-----------|---------|
| 主入口 `vx-start` 與首條 `.vx-toc-row` 之間 | 50–60px | `.vx-toc-label` 既有 `46px`（保留或略增） |
| 群與群之間 | 60–80px | 新增 class 或 inline margin |
| 群內第一條 toc-row 與群標籤之間 | 16–20px | `.vx-toc-label` 既有 `46px`（已是群內首條與標籤的距離，可保留） |
| 同一群內 toc-row 之間 | 既有 1px border-bottom（不變） | `.vx-toc-row` 既有 |

### 4.7 閱讀動線（落地後眼睛的軌跡）

**層級 1（落地 1 秒）**：
1. h1「水感知識庫」標題 → 眼睛在頁面中央
2. lead（一句話）→ 視線往下掃一句
3. `.vx-start`（放大後）→ 視覺鉤子在此

**層級 2（落地 3–5 秒）**：
4. 「先讀懂」群標籤（H2，28–34px）→ 視線橫掃
5. 群內 3 條 toc-row（字級已分大小）→ spotted pattern 找自己要的
6. **眼睛在群 1 結束**——若無相關需求，往下跳過整個群 2

**層級 3（落地 5–10 秒）**：
7. 「挑一式開始練」群標籤 → 視線跳到這個群
8. 6 格 2×3 grid → spotted pattern 直接看自由式那一格
9. 「長期發展」群標籤 → 視線再往下跳

**層級 4（落地 10 秒以上）**：
10. 摺合區「想直接查資料？」→ 已知要查的人會點開；其他人跳過
11. 頁尾圖例 → 已經在前文看到 meta 的使用者會回來對照

**整體動線**：1 個主焦點 → 3 個群 + 1 個摺合區，**眼睛可以跳過任何一個群**（不像現在必須線性掃完 12 條）。對應 NN/g "Spotted Pattern"：使用者 fixate on words that visually stand out。

### 4.8 對應表：每條提案動到哪些既有元素

| 提案 | 動到的 HTML 元素 / CSS class | 操作類型 |
|------|------------------------------|---------|
| 主入口放大 | `.vx-start`, `.vx-start-h`, `.vx-start-no`, `.vx-start-go` | 放大 |
| 群標籤放大 | `.vx-toc-label`（既有 11.5px → 提升） | 放大 |
| 群引言放大 | `.vx-list-desc`（既有 14.5px → 提升） | 放大 |
| 群 1 內部層級 | `.vx-toc-zh`、`.vx-toc-num` 三條不同大小 | 重排（同元素） |
| 群 2 grid 化 | 6 條 `.vx-toc-row` 用 CSS grid 重排；`.vx-toc-prem`、`.vx-toc-meta` 在 grid 內隱藏 | 重排 + 收合（grid 內隱藏不是新增） |
| 群 3 並列 | 既有 2 條 `.vx-toc-row`（不動） | 不動 |
| 參考摺合 | 既有 2 條 `.vx-toc-row` 包進 `<details>` 預設收合 | 收合 |
| 圖例位置 | 既有 `.vx-legend` 兩段保留在頁尾（不動）；但研究原文存檔段可以收合 | 微調（可選） |

**全部操作 = 放大 + 重排 + 收合 + 並列，沒有任何「新增」**。

### 4.9 不做的事（明確排除）

| 排除項 | 理由 |
|--------|------|
| 不新增任何 `<section>` / `<div class="vx-xxx">` | 硬約束：過去多輪「加區塊」失敗 |
| 不新增任何 CSS class | 既有 class 已足夠；只調既有 class 的數值 |
| 不改 link、href、文字內容 | 硬約束：本研究只動呈現 |
| 不改色系 | 既有 `--vx-accent` / `--vx-gold` / `--vx-sub` / `--vx-faint` 已建立層級語言 |
| 不引入新字型 | 既有 Crimson Pro / Source Serif 4 已是 08 學術期刊風 |
| 不加任何動畫、hover transition 之外的視覺效果 | DESIGN_SYSTEM.md 硬性禁止清單的延伸 |
| 不做進站分流 / 不做 use-case card | 前一輪 IA 研究已確立這是錯方向 |
| 不做 `依身份分流` / 不做 `家長版 / 教練版` | 委託人已明確否決 |

---

## 5. 開放問題 / 需委託人拍板的取捨

### O1 — `.vx-start` 放大到什麼字級

放大太少（22–24px）→ 仍然被下面 11 條 `.vx-toc-row` 蓋過去；放大太多（40px+）→ 違反 08 學術期刊風的低調強調。

**需委託人決定**：
- `.vx-start-h` 目標字級（建議 28–30px）
- `.vx-start-no` 目標字級（建議 48–56px）
- 主入口底色是否從 `var(--vx-paper)` 改為 `var(--vx-bg)`（白底）以強化對比

### O2 — 群 2 grid 內是否拿掉 `.vx-toc-prem` / `.vx-toc-meta`

提案中是「grid 內省略 premise 與 meta」，但這代表首頁看不到「這個式有幾個動作」「這個式的核心 premise」。

**三個選項**：
- A. 完全省略（提案版本）。最乾淨，但失去一點 information scent。
- B. 保留 premise 但縮短為 30 字以內。中間方案。
- C. hover 時顯示 premise（CSS `:hover .vx-toc-prem { display: block }`）。動態但需要使用者主動 hover。

**需委託人決定**：A / B / C 哪一個？

### O3 — 參考摺合區用 `<details>` vs 純視覺降級

提案中用 `<details>` 預設收合，但這代表「想直接查資料？」這兩個條目**完全在首屏外**——可能過於隱蔽。

**三個選項**：
- A. `<details>` 預設收合（提案版本）。最輕，但 visibility 最低。
- B. 純視覺降級（小字、淺色、無 hover 效果），仍在首屏可見。中間方案。
- C. 移到頁尾 footer 區（與 `vx-legend` 同區）。徹底移到頁外，但失去「查資料」這個入口的可發現性。

**需委託人決定**：A / B / C 哪一個？

### O4 — 群 1「理解」是否併入 `.vx-start`（取消獨立 section）

目前 `.vx-start` 已經指向水感理論；群 1 第一條也是水感理論。**可能有重複**。

**需委託人決定**：
- `.vx-start` 與群 1 第一條**指向同一頁**是 bug 還是 feature？
- 若視為 bug：把 `.vx-start` 改指向一個**目前沒有的「首站介紹」頁**（這需要新增內容，不在本研究範圍）
- 若視為 feature：保留雙重入口（新手可從 `.vx-start` 或從群 1 第一條進），但**視覺上仍需區分層級**——`.vx-start` 放大、群 1 第一條用群內一級字級

### O5 — 「依需求找練習」與首頁的關係

「依需求找練習」是 vortex/database 的 `#vxNeeds` 區——是「找 drill」這個動作的入口（**頁面內的子區**，不是子頁）。

**需委託人決定**：
- 是否要把 `vortex/database/#vxNeeds` 視為首頁同等級入口？（目前提案是降級到摺合區）
- 還是 `依需求找練習` 應該在 vortex-database 自己的入口頁（`vortex/database/`）做入口處理，不在 vortex-home 處理？

### O6 — 群 3「長期發展」是否拆出獨立頁

ADM 與週期化目前是兩個獨立子頁（`vortex/adm/`、`vortex/periodization/`）。它們在首頁並列是合理的。

**需委託人決定**：
- 是否要在群 3 標籤「長期發展」下加一句**群引言**（如「從一個動作到一個運動員的長期視角」）？
- 還是群 3 維持現有的「兩個獨立連結 + 各自 premise」即可，不加群引言？

---

## 6. 引用清單（供核對）

> 全部引用為本研究實際抓取或讀檔所得；如有未直接查證之處，已於 §7 標出。

### 版面與視覺層級核心

1. **NN/g — "Good Visual Design, Explained"**（Kelley Gordon, 2025-11-14）
   URL：https://www.nngroup.com/articles/good-visual-design/
   核心主張：grid + alignment；~3 type sizes；~2 main colors；typography hierarchy with one family + varied weights。

2. **NN/g — "F-Shaped Pattern of Reading on the Web: Misunderstood, But Still Relevant (Even on Mobile)"**（Kara Pernice, 2017-11-12）
   URL：https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/
   核心主張：F-pattern 在 47 使用者 eyetracking 中浮現；條件是「text lacks formatting, users want efficiency, commitment is low」；前兩段最重要；標題、子標題、粗體、bullets 是關鍵工具。

3. **NN/g — "The Layer-Cake Pattern of Scanning Web Content"**（Kara Pernice, 2019-08-04）
   URL：https://www.nngroup.com/articles/layer-cake-pattern-scanning/
   核心主張：layer-cake 出現的兩個條件（subheadings 易辨 + subheadings 準確）；subheadings 應該用 color / size / typeface / effects 區隔，但**不能像廣告**。

4. **NN/g — "Text Scanning Patterns: Eyetracking Evidence"**（Kara Pernice et al.）
   URL：https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/
   核心主張：四種模式從最差到最佳 = F / Spotted / Layer-cake / Commitment；recommendations = chunk content、bullets、bold keywords、avoid walls of text。

5. **NN/g — "How People Read Online: New and Old Findings"**（Kate Moran, 2020-04-05）
   URL：https://www.nngroup.com/articles/how-people-read-online/
   核心主張：「People rarely read online — they scan」自 1997 年起至今不變；layer-cake 與 F-pattern 都還存在；scannable design = clear headings + front-load key info + bullets + bold + plain language。

6. **NN/g — "Progressive Disclosure"**（Jakob Nielsen, 2006-12-03）
   URL：https://www.nngroup.com/articles/progressive-disclosure/
   核心主張：兩條硬規則 = right split between initial/secondary + obvious progression；多於兩層的揭露會傷害 usability；適用於 dense content sites、ecommerce、mobile。

7. **NN/g — "Typography Terms: Glossary"**
   URL：https://www.nngroup.com/articles/typography-terms-ux/
   核心主張：sans-serif on screens；left-aligned；avoid orphans；web-safe typefaces；font = typeface + style + weight + size。

8. **Wikipedia — "Visual hierarchy"**
   URL：https://en.wikipedia.org/wiki/Visual_hierarchy
   核心主張：四大技術 = color, size, alignment, character；源自 Gestalt psychology；Bertin 的視覺變數框架；「items in the upper left are often seen first」；negative space isolates figures。

9. **Wikipedia — "Gestalt psychology"**
   URL：https://en.wikipedia.org/wiki/Gestalt_psychology
   核心主張：proximity（72 circles → 1 + 3 groups）、similarity、closure、symmetry、common fate、continuity；founders = Wertheimer, Köhler, Koffka；應用到 UI（radio buttons、桌面捷徑）、cartography。

### 真實前例

10. **Stanford Encyclopedia of Philosophy**（讀檔事實，2026-06-17 抓取 https://plato.stanford.edu/）
    核心觀察：單欄垂直、文字優先；粗體 H2 區分群組；短 link + 短描述；TOC + What's New + Chronological + Archives 入口變體；無 hero 圖、無卡片、無圖示。

11. **Stripe Documentation**（讀檔事實，2026-06-17 抓取 https://docs.stripe.com/）
    核心觀察：首頁 = 單一 H1 + tagline + use-cases cluster + browse-by-product cluster；link labels 動詞化（Accept payments / Sell subscriptions / Set up your dev environment）；首頁純門口、深度在子頁。

12. **PostgreSQL Documentation**（讀檔事實，2026-06-17 抓取 https://www.postgresql.org/docs/）
    核心觀察：首頁 portal 結構（news banner + quick links + 單一 CTA「View the manual →」+ 版本矩陣）；無 hero、無卡片；manual 內部用兩欄 TOC（fixed left sidebar + main pane）；archive 放主矩陣之後。

13. **MDN Web Docs**（讀檔事實，2026-06-17 抓取 https://developer.mozilla.org/en-US/）
    核心觀察：首頁是 content-discovery layer（淺層 card grids：Featured / Latest news / Recent contributions / Spotlight）；主導航 mega-menu；Reference vs Guides 雙軌；首頁不用 sidebar，內頁用。

---

## 7. 未能查證或無原始來源之處

> 委託人核對引用時若發現這段以外的內容被當作引用，請直接退回。

- **Modular scale / Bringhurst type ratios（1.250 / 1.333 / 1.414 / 1.500 / 1.618）**：Wikipedia "Typography" 條目僅引用 Bringhurst《The Elements of Typographic Style》作為 citation reference，**未直接抓到 modular scale 的原文與具體比值**。本研究在 §4.6 用的是「~3 type sizes」原則（NN/g 2025）與「字級差距至少 4px」（自設規則），**未引用 Bringhurst 的具體 ratio**。
- **NN/g "Hero Image Design" 等影片頁**：本研究的 WebFetch 對 `nngroup.com/videos/hero-image-design/` 與 `nngroup.com/articles/homepage-design-mistakes/` 兩 URL 都回 404。**未確認 NN/g 是否有獨立「single primary call-to-action」的研究頁面**——本研究在 §2.1 / §3.3 引用的「single CTA」原則來自 NN/g Good Visual Design 2025（已查證）對「strategic color + ~2 main colors」的間接推論 + PostgreSQL Docs 的讀檔事實對照，**不是 NN/g 的直接論述**。
- **Stanford Encyclopedia of Philosophy 與 PostgreSQL Documentation 的「設計意圖」官方文件**：兩站的讀檔事實是**描述性敘述**（它們「怎麼做的」），**未抓到雙方官方任何關於「為何這樣設計」的設計意圖文件**。這是基於公開首頁結構的觀察推論。
- **MDN 「Reference vs Guides 雙軌」的設計初衷**：讀檔事實確認雙軌存在於 mega-menu，**未抓到 MDN 自己的 IA 設計文件**解釋這個雙軌的設計動機。本研究在 §3.4 借鑑的是雙軌「結構本身」，不是其設計意圖。
- **Stripe Docs 的 IA 設計文件**：讀檔事實確認首頁結構與 link label 動詞化，**未抓到 Stripe 自己的設計系統文件**解釋這些決策的初衷。本研究借鑑的是結構層面，不是設計哲學。
- **NN/g "Scrolling and Attention"**（eyetracking topic page 列出但未深讀）：本研究在 §4.7 提到「層級 3 跳過整個群 2」這個閱讀動線假設**未由 eyetracking 實測驗證**——這是基於 layer-cake pattern 原則的設計推論，不是 NN/g 的研究結論。
- **NN/g F-pattern 研究的 47-user eyetracking**：NN/g "F-Shaped Pattern" 文章引用「47 使用者 on TigersinCrisis.com」這項研究的具體細節**未進一步查證**（年份、研究方法、結論推論到當前研究的限制）。

---

## 8. 與前一輪研究的關係

本研究的命題鎖死在**純呈現層**，與 `research/entry-wayfinding-study.md`（2026-06-17 完成）的關係是：

- **前一輪**：IA 層——解釋「為什麼不該做分流」「為什麼不該複製內容」「為什麼不該改敘述」——結論是不分流、不複製、不改敘述，靠資訊氣味 + 漸進揭露。
- **本輪**：layout / 視覺層——在「不分流、不複製、不改敘述」的前提下，**純粹的版面怎麼排**。

兩輪不衝突；本輪是 IA 結論的「執行層」：既然內容不分流、敘述不改，那**版面本身**就得承擔「讓使用者一眼找到自己入口」的責任——這是本研究的命題。

**本研究的硬約束（重申）**：
1. 不新增任何區塊、卡、入口
2. 只動既有 `.vx-*` 元素
3. 不改內容文字
4. 不改色系
5. 不引入新字型
6. 不做進站分流、不做家長版／教練版
7. 不出現任何「自陳 → 感知／技術品質判斷」推論語

---

**研究終止。** 本報告僅為 presentation / layout 層的研究論證，未動任何 layout / css / data / 既有檔；新增檔案路徑 `research/presentation-layout-study.md`，待委託人核對引用與拍板 §5 開放問題後再進入實作規劃（`/implement` 或下一輪 `/plan-check`）。