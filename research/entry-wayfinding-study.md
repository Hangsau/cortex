# 入口研究報告：Cortex / Vortex 的「自明式導路」設計

> 研究問題：同一個水感知識網站，如何讓五種不同進站目的的人（好奇者／學游中痛點者／家長／教練／選手）靠自己就能找到要的路徑，而**不是**靠分流。
>
> 範圍：IA／呈現層。內容真相源（TheVortexProject / canonical）不在本研究改動範圍。
>
> 報告產出時間：2026-06-17
>
> 本研究**不建議**：① 在公開頁放感知判讀診斷語（泳者說 X = 到位、A/B/C 型診斷、typical_speech、main_problem）；② 任何形式的「進站先選身份」分流；③ 把內容複製成教練版／家長版／選手版多份。

---

## 1. 摘要

### 核心主張

**同一站服務不同人，靠「氣味」不靠「門口」。** 不在進站口替使用者分流，而是在每一條路徑上留下足夠強的資訊氣味（information scent）讓不同人聞到自己要的味道；同時用一條**所有人共用的座標系**（L0–L6 水感發展脊椎）讓每個人隨時能在地圖上定位自己。門口分流是錯解，原因是它把「我現在是誰」的成本轉嫁給使用者，**而使用者的「自我定位」在進站那瞬間最模糊**（Pirolli & Card；NN/g 2015）。

### 三條底層原則（IA 文獻共識）

1. **任務導向 + 主題導向** 取代 受眾導向（NN/g 2015, "Audience-Based Navigation: 5 Reasons to Avoid It"）。
2. **資訊氣味**（information scent, Pirolli & Card 1990s）必須足夠強，否則使用者會在第一個判斷點離開。
3. **漸進揭露**（progressive disclosure, NN/g）——把進階內容摺起來，但摺法的「前置文字」必須能讓對的人一眼看到門。

### 五個可落地的設計手法（逐項解五道牆，細節見 §5）

| # | 手法 | 解哪道牆 | 對應文獻 |
|---|------|----------|----------|
| H1 | 「輕量鉤子區」——首屏給三種承諾（5 分鐘有感／為什麼重要／先試一個動作） | 牆 1 好奇者 | NN/g Information Scent；GOV.UK「start with user needs」 |
| H2 | 「痛點卡」區——把首頁第 2-3 屏變成 8–12 張具體痛點卡（呼吸嗆／腳沉／划手沒力……），把現有 `依需求找練習` 從頁尾拉到頁首並改命名 | 牆 2 學游痛點 | NN/g Information Scent「specific and self-explanatory」；IKEA「room-based 不自我標籤」 |
| H3 | 「家長框架卡」——ADM 首頁加「孩子在學游泳？從這裡看」一張卡，把現有 L2T→T2W 階段 + 年齡翻譯成「X 歲的泳者會怎樣 / 你在岸邊看什麼 / 進度正常嗎」 | 牆 3 家長 ★最大洞 | W3C WAI「任務為錨點 hub-and-spoke」；Mayo Clinic「Information for」前綴（NN/g 引用） |
| H4 | 「共用座標系」——L0–L6 階梯 mini 版在每個 section 開頭浮現；心理層的三帶切分是範本；所有人用同一條脊椎線定位自己 | 牆 1 + 牆 5 中間層 | MDN「Reference／Guides 平行組織」；GOV.UK「服務分類」 |
| H5 | 「瓶頸卡」——L0–L6 概覽頁加 3–4 張「不確定自己位置？」瓶頸卡（卡在划手效率／耐力／速度表達／動作自動化） | 牆 5 中間選手 | NN/g Audiences「任務導向」；Khan Academy 之反向佐證（角色分流失敗案例） |

---

## 2. 問題定義與現況診斷

### 2.1 現站結構速寫（讀檔事實）

讀 `layouts/vortex/vortex-home.html` 後，首頁呈現一個**單一閱讀順序的目次**，由上而下：

1. **新手入口 `vx-start`**（單一大連結）：「完全沒概念？先搞懂水感是什麼」→ 十分鐘水感理論。
2. **核心·先讀水感**（2 條目錄）：水感理論 + L0–L6。
3. **更底層·感知的地基**（1 條目錄）：心理層。
4. **六大單元·挑一個開始練**（6 條目錄）：六式，每式顯示動作數。
5. **放大尺度·運動員發展**（2 條目錄）：ADM + 週期化。
6. **不分泳式·依需求找**（2 條目錄）：依需求找練習（125）+ 跨泳式查資料。

**單一目次的閱讀順序 = 為教練型讀者寫的學習路徑：**「理論 → L0–L6 → 心理 → 挑一式 → 看長期發展 → 跨式查」。一個人要走完這條線需要數十小時。

### 2.2 五道牆 × 現站實際走法

| 牆 | 人群 | 他們的需求 | 現站實際入口 | 撞到的問題 |
|----|------|-----------|------------|-----------|
| **1** | 想接觸的人（還沒開始） | 知道游泳在幹嘛／值不值得 / 5 分鐘能拿到什麼 | 首屏 hero = `vx-start`：立刻壓一篇 6 部分的長文 | 第一屏勸退。「十分鐘搞懂」對「還沒決定要花十分鐘的人」是過度承諾。 |
| **2** | 正在學、帶著具體痛 | 「我換氣會嗆 / 腳會沉 / 划手沒推進」，要 drill | 「依需求找練習」藏在頁尾第 6 區，命名「依需求找練習」 | 抽象命名＋壓底，帶痛點的人認不出這是他的門。 |
| **3** | 家長 ★ | 孩子這階段該做到什麼 / 進度正常嗎 / 岸邊看什麼 | **無任何入口**。最接近的 ADM 在第 5 區，命名「運動員發展」、框架語言是「L2T/T2T/T2C/T2W 四大支柱」 | 整段對家長是隱形。 |
| **4** | 教練 | 完整工具集與依需求查詢 | 整站為其寫作 | 服務最好。 |
| **5** | 游泳選手（已會游但卡在瓶頸） | 我現在這條脊椎線上的哪 / 下一階是什麼 / 心理瓶頸怎解 | 素材都有（六式技術、ADM 標準、週期化、心理層心流壓力），但沒有「我的位置」線 | 心理層有 5 張「處境卡」雛型，但其他層沒有；L0–L6 雖有發展序列，但被預設為「初學者專用」。 |

### 2.3 現站的兩條隱形假設

- **假設 A：所有人都從「水感理論」開始讀。** 首屏 `vx-start` 與「核心·先讀水感」用 hero + 第二個 section 兩次壓這個入口。對「路過的人」是過度承諾；對「已有具體痛的人」是走錯路。
- **假設 B：所有人都沿 L0–L6 脊椎線向上爬。** L0–L6 的概覽副標寫「水感是一級一級長出來的感知」，預設讀者是初學者——但選手讀這個頁面會誤以為「跟我無關」。

這兩條假設讓五道牆的存在合情合理，但都是 IA 層可解的問題。

---

## 3. 為什麼「分流／角色路由」是錯的解

### 3.1 IA 文獻立場

**NN/g 2015 — "Audience-Based Navigation: 5 Reasons to Avoid It"**（Katie Sherwin）列舉五個已知缺陷：

1. **Self-identification confusion**：使用者無法快速自我標籤。多數人不會單純屬於一個族群。
2. **Ambiguous purpose**：使用者分不清分類的內容是「about」某族群還是「for」某族群。
3. **Forces users out of task mindset**：使用者是任務導向的，不是身份導向的。
4. **Anxiety about missing content**：被分到 A 群的人會焦慮 B 群有什麼他看不到的。
5. **Overlapping content**：大量內容跨群共用，使用者會懷疑不同區的資訊是不是真不同。

**NN/g 同文** 進一步說：role-based 唯一適用的條件是「內容確實只屬於該群」。當內容跨群共用時，**推薦用 topic 和 task-based 為主、audience 為輔**，且 audience 入口應放次要位置。

**Pirolli & Card — Information Foraging Theory**（1990s 起）的關鍵命題：**使用者在決定要不要點進一個連結時，self-estimate 那個頁面的「價值」與「取用成本」**。當氣味（scent）不足，使用者會離開。分流門口正好發生在「使用者最沒資訊、最沒法估價值」的瞬間（連「我想要什麼」都還在摸索），成本效益最差。

**Rosenfeld & Morville — Information Architecture for the World Wide Web**（1998–2015）把 IA 整理成「物件／選擇／揭露／範例／前門／多重分類／焦點導航／成長」等八原則（Wikipedia 整理版可查）。其中 **「multiple classification」原則直接反對單一觀點的組織**：同一份內容可同時被多種方式歸類時，IA 應允許使用者從不同入口進入同一節點，而**不要**逼選一個入口。

### 3.2 應用到本案的具體推論

- **不應做進站分流**（首頁放「我是家長 / 我是教練 / 我是選手」三按鈕）：
  - 使用者最自我定位模糊的瞬間就是進站那 5 秒，問不出準答案。
  - 必然誤點（家長點選手視角、選手點教練視角都是錯的，內容幾乎重疊，更糟）。
  - 即使加 fallback 也會累積 NN/g 提到 #4 「錯過內容焦慮」。
- **不應做內容分流**（教練版／家長版／選手版分開維護）：
  - 內容大量重疊（同一份「L0–L6 觀察指標」對教練、選手、家長都用）。
  - 維護成本翻倍、必然漂移。
  - **唯一正解**：同一份內容，但在入口、首步指引、「你在這裡」標記三處**針對不同處境的人換包裝**，不換內容。

---

## 4. 文獻與前例研究

### 4.1 Information Foraging Theory（Pirolli & Card, 1990s）

**核心論點**：使用者在「資訊獵場」上循氣味覓食。連結 label、副文案、所處脈絡共同構成「氣味」。氣味越接近使用者心中「那個頁面可能有我要的東西」的預估，使用者越會繼續走。

**對 IA 的具體建議**（整理自 NN/g "Information Scent"）：

- **Link labels should be clear and self-explanatory**：避免 jargon、避免品牌術語、避免太學術的字。
- **Summary text adds detail to the label**：副文案要給連結的「內涵」加訊息，不能光重複 label。
- **Specific, not context-dependent**：同一個連結放不同位置也應讓人一看就懂。
- **Beware right-rail placement**：使用者的廣告盲化讓側欄資訊失去氣味。

**本案直接應用**：
- 「依需求找練習」違反「specific, self-explanatory」原則——「依需求找」是泛稱，「練習」是工具名，不是痛點。
- 「不想從泳式開始？依需求找」這個 section 標題意圖很好（給非教練型讀者一條路），但**section 標題本身就是氣味來源**，寫成「不想從泳式開始？依需求找」對痛點型讀者完全沒氣味——他不是「不想從泳式開始」，他是「腳會沉」。

### 4.2 Progressive Disclosure（NN/g）

**核心論點**：先顯示少數關鍵選項，進階選項摺起來。次要選項必須有「強氣味」讓使用者知道點下去有東西。

**設計建議**：
- 兩層揭露（不要超過兩層）最穩。
- 揭露的「下一步」動作必須明顯，並有強資訊氣味。
- 用 task analysis 決定什麼放第一屏、什麼摺起來。

**本案直接應用**：
- 心理層已用「5 張處境卡」+ 三帶 + 主題網格三層揭露（`vortex-psychology.html` §概覽）——這是現站**最成熟的 progressive disclosure 樣本**，應被當作模式複製到其他 section。
- 首頁目次也應該有「先顯示 3-5 條主路徑，其他摺起來」的處理；現況是把 11 條目錄一次攤平，反而難以掃讀。

### 4.3 Task-Based / Topical Navigation vs Audience-Based

**NN/g 立場**：當主題或任務能覆蓋多數使用者意圖時，優先用 topic + task；audience 只在內容確實只屬於該群時才用，且放次要位置。

**對 audience labels 的修正**：NN/g 引用 Mayo Clinic 用「Information for patients」前綴區分對象（而不是「About patients」），避免 NN/g 提到的 ambiguity（§3.1 #2）。

**本案直接應用**：
- 本案硬約束 #2 已排除「教練版／家長版」內容分流，但**保留 Mayo Clinic 式 label 修辭**是可行的：把「孩子在學游泳？」當成 hero 卡，**其下指向的仍是 ADM 矩陣同一份內容**，但用「孩子在學游泳？」這個 task 角度重述入口。

### 4.4 真實前例

#### 4.4.1 GOV.UK（英國政府服務入口）

- **怎麼做的**：主導航以「生活事件／要做的事」分類——Benefits / Births, death, marriages and care / Business and self-employed / Childcare and parenting / Crime, justice and the law / Driving and transport / Housing and local services / Money and tax / Working, jobs and pensions——而非以「內閣部門」分類。
- **為何有效**：使用者想的是「我要辦這件事」而非「我要找財政部」。同一個內容頁（如育兒津貼）自然服務「新生兒父母」、「單親」、「雇主」、「托嬰業者」等多元族群，因為 page 本身寫的就是任務（怎麼申請、怎麼領），不是寫給誰。
- **可借鑑**：把首頁主導航從「按本站結構」改為「按進站意圖」。本站的進站意圖有 5–6 條（見 §5）。

#### 4.4.2 MDN（Mozilla Developer Network）

- **怎麼做的**：主導航按技術領域分（HTML / CSS / JavaScript / Web APIs / Learn / Tools / About），**不按開發者角色分**（不區分「前端工程師 / 全端 / 瀏覽器引擎開發者」）。每個技術領域內部固定兩軌：**Reference**（字典式查詢）vs **Guides**（主題式深讀）。
- **為何有效**：Reference/Guides 雙軌讓新手從 Guides 走、老手從 Reference 跳；同一頁面兩種讀法都有意義。Learn 是另開一條路徑，給完全新手用——是輔助軌道，不是入口分流。
- **可借鑑**：本站每個 section 已用 master-detail（左 rail + 主面板），但缺乏「Reference / Guides」或「快速查 / 深讀」的雙軸過濾器。可考慮在每個 section 開頭給一個「想快查 / 想讀懂」二選一的 micro-affordance。

#### 4.4.3 W3C WAI Tutorials

- **怎麼做的**：主導航按任務階段分（Fundamentals / Planning / Design & Develop / Test & Evaluate / Teach & Advocate），且在每個次層明確說「Web developers will find... / Web designers will learn... / Web trainers will find... / Content authors will learn...」——**角色描述是出現在內容頁的引導句，不是進站分流按鈕**。
- **為何有效**：使用者先選「我要做什麼」（任務），再在內容頁內看到「對你這角色來說重點在哪」。
- **可借鑑**：本站在 ADM 矩陣頁面已用「階段 × 支柱」組織；可在每個**內容頁**開頭加一段「如果你是 X，重點看這段」的角色引導句，但不另設分流入口。

#### 4.4.4 IKEA（實體店面）

- **怎麼做的**：IKEA 的賣場動線按**房間**走（客廳→餐廳→廚房→臥室→兒童房），單向逆時鐘，路徑上每個房間都是「已經擺好情境」的場景。**不按顧客類型分區**（不分「小資族 / 大家庭 / 商用」）。
- **為何有效**：IKEA 把抽象的「家具選購」變成具體的「房間場景」，使用者不必先自我定位就能進入。同一個客廳區對單身、小家庭、大家庭、商辦採購者都適用，因為場景本身呈現了「住在這裡的人會是誰」的多義性。
- **可借鑑**：本站在心理層已用「5 張處境卡」（vortex-psychology.html §概覽）做到類似的事——使用者不必先認得主題名稱，選一張最接近他現在狀態的卡進去。其他層（L0–L6、六式、ADM）**目前沒有對應的處境卡**，這是最大缺口。
- **註**：IKEA 的單向動線不直接適用於網站（網站允許跳躍），但「場景式呈現」的概念可借用。

#### 4.4.5 Khan Academy（反向佐證——角色分流為何會失敗）

- **怎麼做的**：Khan Academy 站內有 Learner / Teacher / Parent / Kids 四條子軌道，每條軌道進去是不同的內容介面。
- **為何有效但有代價**：Learners 與 Kids 之間有重疊爭議，Parent 與 Teacher 的內容經常重複，導致使用者要在多個子站切換。**它是「內容分流」的成功案例**，但**它的內容分流成功是因為它的內容**真的**服務本質上不同的任務**（小孩看動畫、學生看題庫、老師看班級管理、家長看報告）——分流成本由內容差異性支撐。
- **反向佐證**：**本站的內容沒有這種本質差異**——同一份 L0–L6 對教練、選手、家長都成立，所以 Khan 模式不適用。**任何「教練版／家長版」的提案都違反內容事實**。

---

## 5. 建議的「自明式導路」設計手法

> 每項手法都對應一道牆，並說明「要解什麼問題」、「具體長怎樣」、「為何不違反硬約束」。

### H1 — 輕量鉤子區（解牆 1：想接觸的人）

**問題**：現站首屏直接是 `vx-start`「十分鐘搞懂水感」——對還沒決定要不要投入十分鐘的人是過度承諾。

**長怎樣**：在 masthead 後、第一條目錄前，插入一個**三張並排的鉤子卡**：

- 卡 A：「5 分鐘有感」——讀一段 200 字的水感簡介（從水感理論長文抽出）。
- 卡 B：「為什麼重要」——一句「游泳技術是感知的輸出，不是輸入」的動機句（從現有 lead 抽）。
- 卡 C：「先試一個動作」——一個 30 秒可在家做的陸上平衡練習（從 drills 庫抽「不需入水」的）。

每張卡都有「開始 →」按鈕，點下去才進深度內容。**這不是分流，是平行入口**——三條路都通到同一條脊椎線 L0–L6。

**為何不違反硬約束**：
- 沒新增身份選項。
- 沒複製內容（從既有長文抽出 200 字已有物）。
- 好奇者可挑「先試一個動作」這種零風險起步，不用自我標籤。

### H2 — 痛點卡區（解牆 2：帶痛點的學習者）

**問題**：現站把「依需求找練習」藏在頁尾第 6 區、命名抽象，帶痛點者認不出。

**長怎樣**：把現有的 `vortex/database/#vxNeeds` 從頁尾拉到**首屏下方**，改為一張「卡在這？從痛點開始」的區塊，內含 **8–12 張痛點卡**：

- 「換氣會嗆水」
- 「腳一直沉」
- 「划手沒推進感」
- 「身體轉不過去」
- 「划 25m 就沒力」
- 「出發入水沒力」
- 「轉身後速度掉太多」
- 「看影片學會，泳池做不到」

每張卡點下去都直接到依需求找練習篩選（鎖定對應環節 chips）。

**命名修辭**：將 section 標題從「不想從泳式開始？依需求找」改為「卡在這？從痛點直接挑練習」（呼應 NN/g "specific and self-explanatory" 原則）。

**為何不違反硬約束**：
- 痛點卡只是把現有 drill 資料的入口重新包裝，不複製內容。
- 不分流——任何人想用痛點入口就用。

### H3 — 家長框架卡（解牆 3：家長 ★最大洞）

**問題**：家長在現站完全沒入口；最接近的 ADM 藏在「放大尺度·運動員發展」區，命名與框架語言（L2T/T2T/T2C/T2W、四大支柱）都是選手語境。

**長怎樣**：在 ADM 首頁（`vortex-adm-home.html`）的「三個入口」上方插入一張**獨立 hero 卡**：

- 標題：「孩子在學游泳？從這裡看」
- 副標：「用年齡看孩子現在該到哪、進度怎樣算正常、你在岸邊該觀察什麼。」
- 內含三個小入口：
  1. 「X 歲的泳者會怎樣」——年齡滑桿（4–18 歲），對應 ADM 矩陣的 L2T/T2T/T2C/T2W 階段。
  2. 「進度正常嗎」——把現有 ADM 階段重述為「這個年齡的常見動作里程碑」。
  3. 「你在岸邊看什麼」——把現有 water-sense-levels 觀察指標抽出**觀察者友善版**（去掉教練診斷語，保留家長可目測的外部訊號）。

**關鍵修辭**：用 Mayo Clinic 式「Information for」前綴（NN/g 引用）——但這裡用 task 式而不是 audience 式：**「孩子在學游泳」**是一種任務／情境，不是身份分流。

**為何不違反硬約束**：
- 不公開任何「感知判讀診斷語」（家長版只用可目測的外部訊號）。
- 不複製內容——三個小入口都指回既有 ADM 矩陣與 water-sense-levels。
- 不是分流——這是 ADM 首頁內的一張卡，不另開 `/parents/`。

### H4 — 共用座標系：L0–L6 脊椎線 mini 版（解牆 1 + 牆 5：中間層）

**問題**：現站假設「所有人都沿 L0–L6 線向上爬」（§2.3），但這條線只在 `vortex-levels.html` 完整呈現，其他 section 沒有可定位的「你在這裡」標記。

**長怎樣**：在每個 section（心理層、六式、ADM、週期化、database）**開頭**浮現一條 **mini 版 L0–L6 階梯**，當前頁對應的層級打亮，並顯示「上一層 → 下一層」可點的連結。

範例：
- 心理層的「恐懼」概念頁，mini 階梯打亮 L0，附「← 上一層：無 / 下一層：身心交互 →」。
- 六式「自由式」概覽頁，mini 階梯打亮 L0–L6 全段（自由式有完整序列）。
- ADM 矩陣頁，mini 階梯打亮「選手通用」，附「對應 L2T–T2W」。

**為何不違反硬約束**：
- 不分流——所有人共用同一條座標線。
- 不複製內容——mini 階梯只引用既有資料維度。
- 不公開診斷語——「打亮哪一段」是頁面級 metadata，不是讀者自我判讀。

**心理層的三帶切分**（vortex-psychology.html：初學端／貫穿全程／進階競技端）**已是好範本**，應被當作模式複製。該處的「5 張處境卡」雛型也可被 L0–L6 概覽頁學習。

### H5 — 瓶頸卡：中間層選手的「我的位置」（解牆 5）

**問題**：心理層有處境卡（5 張），但其他層沒有。已會游但卡瓶頸的中間層選手，在 L0–L6 概覽頁看不到自己的位置（被預設為「初學者專用」）。

**長怎樣**：在 L0–L6 概覽頁加 3–4 張**瓶頸卡**：

- 「划手有效率但耐力上不去」
- 「耐力 OK 但速度表達不出來」
- 「速度有，但動作自動化不到」
- 「全都有，但一上場就崩」

每張卡點下去都連到對應的：
- 心理層概念（最後一張直接連「心理層·壓力崩潰」）。
- 六式的特定動作分解。
- ADM 矩陣的特定支柱。

**為何不違反硬約束**：
- 瓶頸卡只是導流入口，不開新內容。
- 不分流——任何人卡瓶頸都可用。
- 把現有素材（六式、ADM、心理）之間的橫向關係補上。

### 整體排序（給委託人決策用）

依「解決問題密度 × 改動成本」：

| 優先 | 手法 | 改動 | 預期效益 |
|------|------|------|---------|
| 高 | H2 痛點卡（拉上來、改命名） | 小（layout + 文案） | 高（解五道牆中最具體的一牆） |
| 高 | H1 輕量鉤子 | 小 | 高（解牆 1） |
| 中 | H4 共用座標系 mini | 中（每個 section 都加） | 中高（解牆 1+5） |
| 中 | H3 家長框架卡 | 中（ADM 首頁加一張卡） | 高（解牆 3，最大洞） |
| 中 | H5 瓶頸卡 | 小（L0–L6 概覽頁加幾張） | 中（解牆 5） |

---

## 6. 開放問題 / 需委託人拍板的取捨

> 這些是 IA 層無法獨自決定的設計選擇，需委託人明確拍板。

### O1 — 「家長可目測的外部訊號」邊界

H3 提到「把現有 water-sense-levels 觀察指標抽出觀察者友善版」。但**哪些訊號可讓家長看、哪些保留為教練診斷語**，需要委託人逐項拍板。本研究的立場是**嚴守現有邊界**——現有 `vortex-levels.html:63` 已明確標註「感知判讀語不在公開頁」，家長版只能用「可目測的外部訊號」（如「頭是否自然下沉」「划手頻率」「游完 25m 是否需休息」）。

**需委託人決定的**：哪些指標從教練層下降到公開層？或者維持現有邊界，家長版只用更白話的方式重述既有公開指標？

### O2 — 痛點卡是「情境分類」還是「症狀列表」

H2 的痛點卡可走兩條路：

- **情境分類**：「換氣嗆水 / 腳沉 / 划手沒力……」——症狀視角，較直覺但易陷入「對症下藥」陷阱。
- **情境分類 + 暗示歸因**：「換氣嗆水（可能 L0 呼吸感知未穩）」——症狀 + 歸因視角，引導讀者連回 L0–L6。

第二種 IA 較強（讓讀者進入站內座標系），但有**越界引導**風險（家長看到「L0 未穩」可能誤以為孩子在 L0）。**需委託人拍板**痛點卡的敘事口吻。

### O3 — H3 家長卡 vs ADM 入口的關係

H3 是把家長卡放在 ADM 首頁上方，但這暗示「家長要走 ADM 路徑」。另一條路徑是**把家長卡放在 vortex 首頁（`vortex-home.html`）**作為獨立的「孩子在學」hero 卡。

- **選項 A**：放在 ADM 首頁上方（§5 H3）。優點：與年齡/階段框架直接掛鉤；缺點：家長要先找到 ADM，而 ADM 在現站第 5 區。
- **選項 B**：放在 vortex 首頁。優點：家長不必經 ADM；缺點：與其他進站意圖並列，可能壓縮其他入口空間。
- **選項 C**：兩處都放（ADM 是展開版，vortex 首頁是簡介 + 連結）。

**需委託人決定**家長卡應該被看見的層級。

### O4 — 心理層處境卡的擴張 vs 維持

H5 瓶頸卡的概念借用自心理層的 5 張處境卡（vortex-psychology.html:63-68）。**心理層處境卡的成功**是本研究的關鍵範本。但擴張到 L0–L6 概覽頁，等於**在 L0–L6 也開 5+ 張情境卡**。

**需委託人決定**：L0–L6 概覽頁的情境卡要維持「心理向」（如「一上場就崩」）還是包含「技術向」（如「划手沒推進」）？技術向情境卡可能與 H2 痛點卡重疊——若重疊，H2 痛點卡就足以，不必另設。

### O5 — 「誰在用」的隱私與設計假設

NN/g 提到 audience nav 的失敗部分來自「使用者自我標籤焦慮」。本研究的方案**完全不問身份**，但同時也**不收集任何使用訊號**（現有 `vortex-home.html` 末段的 localStorage 讀過標記是唯一例外）。

**需委託人決定**：是否要加一層「你最近在讀什麼」的局部回饋（不存個資、不分流），讓「上次讀到 L2 換氣」的使用者下次回到首頁看到「繼續讀 L2 換氣 →」的入口？這違反最小改動原則，但 IA 上是強訊號。

### O6 —「資料真相源」與 IA 的分工邊界

本研究的建議**全部都在 IA／呈現層**。但部分手法（H3 家長觀察者友善版、H5 瓶頸卡）實作上需要**小幅重述 canonical 內容**（從教練口吻改為家長口吻）。這觸及 IA 與內容的邊界：

- **嚴格 IA-only**：只重組入口與標籤，內容原文不動。實作簡單，但家長看到的可能還是教練語氣。
- **IA + 文案層**：可在不動技術內容的情況下，加一段「給家長」的重述段（類似 WAI 教程的做法）。實作中等。

**需委託人決定**：H3 的家長版觀察指標是只重組入口（IA-only），還是可以加「給家長」段（IA + 文案）？

---

## 附錄：引用清單（供核對）

### IA 核心文獻

1. **NN/g — "Information Scent"**
   作者：Jakob Nielsen / Kara Pernice 等（Nielsen Norman Group）
   URL：https://www.nngroup.com/articles/information-scent/
   （資訊氣味定義、使用者自我估值的兩項：頁面可能含答案的機率、取得答案的成本）

2. **NN/g — "Progressive Disclosure"**
   作者：Jakob Nielsen（Nielsen Norman Group）
   URL：https://www.nngroup.com/articles/progressive-disclosure/
   （漸進揭露、兩層揭露上限、用 task analysis 決定揭露層級）

3. **NN/g — "Audience-Based Navigation: 5 Reasons to Avoid It"**（2015）
   作者：Katie Sherwin（Nielsen Norman Group）
   URL：https://www.nngroup.com/articles/audience-based-navigation/
   （五個問題：自我標籤混淆、目的模糊、強迫脫離任務、錯過焦慮、內容重疊；推薦 topic + task 為主、audience 為輔）

4. **Wikipedia — "Information foraging"**
   URL：https://en.wikipedia.org/wiki/Information_foraging
   （Pirolli & Card 1990s PARC 提出；primary citations 含 Fu & Pirolli 2007 SNIF-ACT；Nielsen 2003、2004 Alertbox）

5. **Wikipedia — "Information architecture"**
   URL：https://en.wikipedia.org/wiki/Information_architecture
   （Rosenfeld & Morville《Information Architecture for the World Wide Web》1998–2015；八原則：objects / choices / disclosure / exemplars / front doors / multiple classification / focused navigation / growth）

### 真實前例

6. **GOV.UK Service Manual — "Design"**
   URL：https://www.gov.uk/service-manual/design
   （主導航按生活事件／要做的事分類：Benefits / Births / Business / Childcare / Crime / Driving / Housing / Money / Working；政府部門層級放次要）

7. **MDN（Mozilla Developer Network）**
   URL：https://developer.mozilla.org/
   （技術領域組織；每領域 Reference／Guides 雙軌；Learn 為新手輔助軌道，不取代主導航）

8. **W3C WAI Tutorials**
   URL：https://www.w3.org/WAI/tutorials/
   （任務階段主導航：Fundamentals / Planning / Design & Develop / Test & Evaluate / Teach & Advocate；角色引導句出現在內容頁而非入口）

9. **Wikipedia — "IKEA"**（實體店面動線）
   URL：https://en.wikipedia.org/wiki/IKEA
   （賣場按房間單向動線；場景式呈現；不按顧客類型分區）

10. **Wikipedia — "Khan Academy"**（反向佐證）
    URL：https://en.wikipedia.org/wiki/Khan_Academy
    （Learner / Teacher / Parent / Kids 四子軌道；屬「內容分流」成功案例，但僅在內容本質不同時適用——本研究的反向佐證）

### 其他輔助

11. **Wikipedia — "Wayfinding"**
    URL：https://en.wikipedia.org/wiki/Wayfinding
    （orientation / route decision / route monitoring / destination recognition 四階段；「you are here」地圖是 orientation 工具）

---

## 附錄：未能查證或無原始來源之處

> 委託人核對引用時若發現這段以外的內容，請直接退回——這些是搜尋時遇到的限制。

- **Rosenfeld & Morville 原書具體頁碼**：本研究只引用 Wikipedia 整理的八原則清單，未直接讀《Information Architecture for the World Wide Web》第四版原書確認其原始用詞。**未能查證**原書是否逐字使用 "multiple classification" / "front doors" 等詞。
- **NN/g "Audience-Based Navigation" 文章發表日期**：研究確認作者為 Katie Sherwin；摘要寫 2015 年。**未能查證**確切日期（NN/g 多數文章發表日期在頁面 metadata）。
- **Mayo Clinic 官網現況**：NN/g 引用 Mayo Clinic「Information for patients」前綴作為 audience label 修辭範例。本研究**未直接查 Mayo Clinic 官網當前 IA**——只引用 NN/g 文章的二手描述。
- **WAI Tutorials 站內 IA 的設計文件**：WebFetch 抓到 WAI Tutorials 首頁的導航結構，但**未抓 W3C WAI 自己的 IA 設計指南文件**（如有）作為 WAI 採用此模式的官方表述。
- **IKEA 動線設計的官方「多入口」論述**：Wikipedia 提供的是描述性敘述，**未抓到 IKEA 官方任何關於「不按顧客分區」的設計意圖文件**。
- **GOV.UK 服務手冊的「為何不按部門分類」原始決策文件**：研究抓到主導航事實，但**未抓到當年 GDS 為何這樣設計的原始決策備忘**——這是基於公開服務手冊的推論。

---

**研究終止。** 本報告僅為 IA 層研究論證，未動任何 layout / data / 既有檔；新增檔案路徑 `research/entry-wayfinding-study.md`，待委託人核對引用與拍板 §6 開放問題後再進入實作規劃。
