# CSCS 題庫出題規格

`data/cscs/_quiz_bank/` 的寫作契約。驗收工具是 `tools/cscs_quiz_bank_check.py`，
本檔是那些閘門背後的理由，以及機器驗不到的部分（題目好不好）。

派工時整份送出，不要摘要。

---

## 一、官方事實（不可推翻的前提）

一手來源：`resources/raw/pdf/inbox/nsca-certification-handbook.pdf`（Appendix F，p.41–48）。
結構化副本：`data/cscs/_dco.yaml`（任務層）、`data/cscs/_domains.yaml`（domain 層）。

| 事實 | 數字 | 影響 |
|---|---|---|
| 考試分兩節 | Scientific Foundations 80 計分 + 15 預試；Practical/Applied 110 + 15 | 兩節分開及格，各需 scaled 70 |
| **每題三個選項** | 官方五道樣題全部 A/B/C | **不是四選一。這是本規格與舊題庫最大的差異** |
| 認知層級是官方指定的 | 全卷 recall 45 / application 97 / analysis 48（190） | 記憶題只佔 23.7%，不是想出幾題就出幾題 |
| 影片／圖片題 | Practical/Applied 125 題中有 30–40 題 | 約佔該節 1/4，題庫要有對應題型 |

**三選項這件事要特別講**：多數坊間 CSCS 題庫（包含 `resources/raw/notes/CSCS_Full_QuestionBank.md` 那 287 題）是四選一，那是沿用一般教科書習慣，不是 NSCA 的格式。NSCA 全線認證（CSCS / CPT / CSPS / TSAC-F / CPSS）的官方樣題一律三選項。三選項會逼出題者把干擾項做扎實——四選一可以塞一個明顯的湊數選項，三選一塞不了。

考古題語料裡有一句直接的旁證：一位熟悉考試的作答者對一道四選項題的評語是
**「This question is not one you would see on the exam. It has too many answers.」**
（`cscs_quiz_reference_items.md` #47）。他不是說內容錯，是說格式就不對。

### 版本落差（出題前必讀）

第二份證據來源 `tools/cscs_quiz_reference_items.md` 的頁碼多引 **ESC5（第 5 版）**，
本專案持有並已對帳的是 **ESC4（第 4 版）**。語料提供的是**題型與鑑別邏輯，不是內容來源**。
凡第 4 版查無的內容（例：ESC5 Ch.20 maneuverability、Ch.21 主動恢復的心理效益）**一律不得出題**——
出題的內容權威只有第 4 版與 `data/cscs/chNN.yaml` 的 1557 條已對帳知識單位。
每一題的 `item` 必須指得回本庫真實存在的條目，這條規則同時就是版本閘。

---

## 二、證據來源

規則分兩層證據，每條規則都要指得回其中之一，指不回去的就是我自己發明的，不算數。

| 來源 | 內容 | 權威性 |
|---|---|---|
| Appendix F p.48（下方全文） | 官方五道樣題 | 格式的絕對權威 |
| `tools/cscs_quiz_reference_items.md` | 站主蒐集的 47 題考古題語料，含答案與解析 | 題型分布與鑑別邏輯的主要依據；內容與頁碼不可信（ESC5） |

五道樣題涵蓋的題型太窄（沒有一題是運動員側寫），所以 R6–R8 三條規則的證據在語料側。
逐字引自 Appendix F p.48：

> **1.** Which of the following shoulder movements and planes of motion are associated with the upward movement phase of the side lateral shoulder raise exercise?
> A. flexion/transverse　B. abduction/sagittal　C. abduction/frontal　**→ C**

> **2.** An untrained college-aged athlete begins a resistance training program. After training for three weeks, her strength increases dramatically. Which of the following is the most influential factor responsible for this improvement?
> A. decreased cross-sectional area of Type I fibers　B. increased number of muscle fibers　C. improved neuromuscular efficiency　**→ C**

> **3.** What is the minimum amount of carbohydrates that a 132-lb (60-kg) competitive Olympic triathlete should consume on a daily basis?
> A. 120 g　B. 480 g　C. 960 g　**→ B**

> **4.** When running, which of the following contributes the most to minimizing the braking effect of a heel foot strike?
> A. eccentric hip flexion　B. concentric hip extension　C. eccentric knee extension　**→ B**

> **5.** Which of the following components of mechanical load is the least important for stimulating new bone formation?
> A. rest period　B. magnitude　C. rate of loading　**→ A**

---

## 三、出題邏輯

R1–R5 的證據在官方樣題，R6–R8 的證據在考古題語料，R9–R10 兩邊都有。
每條規則後面括號裡的編號（#N）指語料的題號。

### R1　選項恰好三個，且是短名詞片語不是句子

樣題選項最長是 sample 2 的 `decreased cross-sectional area of Type I fibers`（7 字），最短是 `120 g`。全部是名詞片語，沒有一個是完整句子，沒有一個超過一行。

**做法**：選項寫成可以直接接在題幹後面的片語。中文題同理，選項控制在 20 字內。

**不准為了湊長度把選項寫成電報體**。G3／G4 在管三個選項的長度要接近，正確的做法是
**把三個選項一起改寫成同一個長度帶**，不是把某一個縮寫掉。ch01 試作踩到的具體錯誤：
`raise firing ν of existing units`（用 ν 代替 frequency）、`ΔP diffuses O₂ to blood passively`、
`muscles pull only; skeleton transmits`（分號把兩個子句塞進一格）。
希臘字母只有在它本來就是術語的一部分時才可以用（`α-motor unit` 可以，`ν` 代替 frequency 不行）；
**選項裡不得出現分號**，驗收會擋（G16）。

### R2　三個選項語法平行、同一抽象層

sample 1 三個選項都是「動作/平面」配對；sample 3 都是「數字 + g」；sample 4 都是「收縮型態 + 關節動作」。沒有一題是兩個名詞加一個句子。

**做法**：先決定選項的模板（例如「肌肉名稱」「百分比」「訓練階段」），三個都填同一個模板。**只要有一個選項在語法上長得不一樣，考生就會注意到它，那題就壞了。**

### R3　用最高級限定詞承載鑑別度，不用對錯承載

sample 2 `most influential`、sample 4 `contributes the most`、sample 5 `least important`、sample 3 `minimum amount`——五題有四題如此。

這是 CSCS 最核心的出題特徵：**干擾項不是錯的，是比較不對的**。sample 5 的 magnitude 和 rate of loading 都會刺激骨質生成，rest period 也有影響，只是最小。考生要排序而不是判真假。

**做法**：application / analysis 題一律用 most / least / primary / best / first / greatest 這類限定詞（中文：最主要、最不、首先、最應優先）。三個選項都要在教材裡站得住，差別在程度或順位。

**反例（不要這樣寫）**：「下列何者是第二類槓桿？A 蹲舉 B 提踵 C 二頭彎舉」——這是真假判斷，兩個干擾項一眼就死。

**這一條是最常被做壞的**。2026-09-14 的 ch01 試作 14 題全數通過閘門，但有三題的干擾項是
`bones contract to move joints`（骨頭會收縮）、`竇房結因長期訓練而永久退化`、
`alveolar wall collapse forces gas out`——這些不是「比較不對」，是連沒讀過書的人都知道是假的。
**寫完每個干擾項問自己一句：一個讀完本章、但讀得不夠細的人，會不會選它？不會的話它就不是干擾項，
是湊數。** application 與 analysis 題一律要有比較限定詞，驗收會擋（G15）。

### R4　application / analysis 題要有情境，且情境的每個字都有用

sample 2 給了四個條件：untrained（訓練年齡）、college-aged（生理年齡）、three weeks（時程）、her（生理性別）。三週這個數字直接決定答案是神經適應而非肥大。

**做法**：情境寫運動員側寫——項目／位置、訓練年齡、訓練階段、測驗數據、傷病史，挑**真正影響答案的那幾項**寫。寫了卻不影響答案的條件是雜訊，會讓題目變成閱讀測驗。
DCO 反覆出現的 `Individual differences among various types of athletes (biological age, training age, biological sex)` 就是在講這件事——它掛在 sf1 的七個 task 底下，代表官方期待大量題目是「同一個機制，換個運動員就換答案」。

### R5　計算題：記住準則 + 算一次，干擾項是算錯的結果

sample 3 要考生知道耐力運動員每公斤 8 g 碳水，再乘 60 kg 得 480 g。干擾項 120 g（2 g/kg）和 960 g（16 g/kg）都是把係數記錯的結果，不是亂填的數字。

**做法**：數字題的干擾項用**具名的錯誤**生成——用錯係數、用錯單位（lb 當 kg）、少算一個環節、用了相鄰訓練目標的參數（例如把肌力的 ≥85% 1RM 用在肌耐力）。每個干擾項的 `why_wrong` 要寫出是哪一個錯誤。
題幹同時給英制與公制（`132-lb (60-kg)`），照抄這個習慣。

**三個選項必須是同一個量的三個數值**——同單位、同被測對象。sample 3 是三個「每日碳水克數」。
ch01 試作問「肌節的靜止長度」，干擾項卻是 `twenty nm thick filament`（細絲厚度）與
`around 250 µm fiber diameter`（肌纖維直徑）：換了被測對象，考生不必知道 2 µm 也能刪掉它們。
**數字題的干擾項要跟正解量同、單位同、只有數值不同。**

### R6　運動員測驗組合題（本考試最高頻的情境題型）

語料 47 題裡有 8 題是同一個模子（#1–#8），全部落在 pa1 課程設計與 pa3 課表執行。
五道官方樣題沒有這型，但它是真實考試裡出得最密的一型，必須當一級題型寫。

**固定結構**：

```
運動項目（＋位置，若位置影響答案）＋ 身高體重 ＋ 4–6 項測驗結果
→ 「哪一項最需要改善／下一個訓練區塊該加什麼／該做什麼調整？」
```

**三個選項是三個訓練標的**（動作名稱或訓練階段），不是三個測驗項目。
語料裡的選項組合：`back squat / hang power clean / loaded jump squat`、
`power clean / back squat / speed bench press`、`focus on power / focus on max strength / no change`、
`add strength-power phase / add max strength phase / add hypertrophy phase`。

**解題鏈（出題時要反著走一遍，確認只有一條路通）**：

1. **先判項目的首要能力**——這是整題的樞紐。籃球＝垂直方向的 power（#1、#6）；冰球＝**水平方向**的 power，所以立定跳遠比垂直跳更有診斷力（#4、#6 的註解）；曲棍球＝power ＋ 反覆衝刺（#2）；短距離游泳＝power 優先、strength 次之（#5）。
2. **把每項成績對回常模百分位**，不是看絕對值。#1 的 18 吋垂直跳看起來低，但 D1 後衛／前鋒平均 17.1 吋，所以它在 60 百分位以上，不是弱項。**（本輪停用——本庫沒有常模表，見 R7）**
3. **挑真正落後的那一項**，再回推該用哪個訓練標的補。#1 的真正破綻是深蹲只比上膊重 45 lb（力量不足以支撐既有爆發力），所以答案是 back squat 而不是任何爆發力動作。**（只准用運動員自身兩項成績的關係，見 R7）**
4. **測驗組合裡沒有的能力不能當答案**。#5 沒有任何爆發力測驗，所以即使短距離游泳最重要的是 power，答案仍是 max strength phase——**只能對測到的東西下判斷**。

**出題時必須做到**：

- 三個選項要各自對應「不同的能力假設」，讓選錯的人是**判斷錯項目需求**，不是算錯數字
- `why_wrong` 寫成「這個選項預設該項目最需要 X，但本項目首要能力是 Y」或「這項能力在本題的測驗組合裡沒有被測到，無法據以下判斷」
- 位置（中鋒／後衛）只有在會改變答案時才寫，寫了就要在解析裡用到（#1 明講「this is a question where position is important」）
- **不要自己生常模數字**，理由見 R7

### R7　本庫沒有常模表——這型題只能靠解題鏈第 1 步與第 4 步

語料的解析大量援引百分位門檻（#1「above 60%」、#5「under the 60th percentile」、
#1「D1 後衛／前鋒垂直跳平均 17.1 吋」），但**本專案沒有這些數字**：
第 4 版書末的換算常模表轉檔時欄位錯置，`ch13` 明確記為「未採用其中數值」
（`ch13.yaml` 的 `detail`），全庫只有「百分位名次是什麼」的定義條目，
沒有任何一張分項目／分性別的成績常模。

**這是硬限制，不是待辦**。在補進常模表之前：

- **禁止在題幹或 `why_wrong` 裡寫出任何百分位、族群平均、及格門檻的具體數值**。
  寫了就是編造——這正是外包模型最容易犯的一類幻覺，驗收時逐題抓。
- 測驗組合題的鑑別點只准落在解題鏈的**第 1 步（項目首要能力是什麼）**與
  **第 4 步（這個能力有沒有被測到）**。這兩步的依據在 `ch17` 的需求分析與
  `ch12`/`ch13` 的測驗選擇條目，本庫有，站得住。
- 需要比較成績高低時，用**同一名運動員身上兩項成績的關係**（#1 的「深蹲只比上膊重 45 lb」）
  或**題幹自己給定的參照**（「隊上其他同位置球員平均 X」），不要訴諸外部常模。
- 常模表補進 `data/cscs/` 之後，這條放寬，R6 的解題鏈第 2、3 步才能啟用。寫進 HANDOFF 待辦。

### R8　兩個小題型：指導語與協定記憶

這兩型語料裡各有數題，官方樣題沒有，但它們的寫法有固定形狀：

**指導語題（cueing）**——題幹給教練意圖，三個選項是三句提示語，正解是**外在焦點**的那句。
#14 要運動員「主動平踏落地」，正解是 `"attack the ground"`，不是 `"land with flat foot"`（描述結果、
內在焦點）也不是 `"dorsiflex at landing"`（解剖術語，運動員聽不懂）。
干擾項就照這兩條做：一句描述結果、一句用解剖名詞。

**協定記憶題（protocol recall）**——測驗怎麼做、順序怎麼排。#25「505 測驗在距起點幾公尺轉身」是純記憶；
#24「Star Excursion 從哪個方向開始」正解是 `randomly`；#26 測驗順序題的判準是「非疲勞性測驗先做」。
這型是 recall 題的正當寫法：**問的是可操作的協定細節，不是名詞定義**。
ch12/ch13 的 recall 額度優先給這型。

### R9　禁止的題型

- `以上皆是` / `以上皆非` / `A 和 B`
- **四個以上選項**（語料 #22、#46、#47 三題是四選項，其中 #47 被作答者當場判定不合格）
- 兩段以上的長題幹
- 考單字定義而不考應用的純名詞解釋（recall 題要問「在什麼情況下」或「協定怎麼做」，見 R8）

**`EXCEPT` 不禁止，但限額**。前一版依五道樣題把它列為禁止，語料推翻了——#38（內分泌適應）與
#39（訓練後荷爾蒙反應）都是標準的 `All of the following ... EXCEPT` 題。
但 47 題裡只有 2 題，**每章至多 1 題，全庫不超過 5%**。寫的時候 `EXCEPT` 要大寫，
中文寫「下列何者**不是**……」並把否定詞加粗——否則考生漏看否定詞是題目的錯不是他的錯。

### R10　圖片題

Practical/Applied 有 30–40 題是影片／圖片題，題庫要有對應。可用的圖在
`resources/books/Essentials_of_Strength_Training_and_Conditioning,_Fourth_Edition/`（575 張已引用）。

**做法**：`figure` 欄位填該圖在源書的路徑，題幹寫成「圖中運動員…」。只有動作技術（ch14–ch16）、測驗（ch12–ch13）、增強式與速度（ch18–ch19）這些章有意義。
本輪（Phase 1）先不做，Phase 2 專門處理——先把文字題的量鋪起來。

---

## 四、Schema

`data/cscs/_quiz_bank/chNN.yaml`：

```yaml
meta:
  chapter: ch03                      # 必須等於檔名
  source: data/cscs/ch03.yaml        # 必須是這個字串
questions:
  - id: ch03.energy-systems.atp-pc.q1   # 全庫唯一；建議 <item-id>.qN
    item: ch03.energy-systems.atp-pc    # 必須是來源章 yaml 裡真實存在的 item id
    dco: sf1.E.1                        # 必須存在於 _dco.yaml，且其 domain 涵蓋本章
    lang: zh                            # zh | en
    cognitive: application              # recall | application | analysis
    stem: 一名選手完成 6 秒全力衝刺後…？   # 中文以「？」結尾；英文以「?」結尾
    locator: 第 3 章 · Bioenergetics    # 必須與來源 item 的 locator 逐字相同
    figure: ''                          # 選填，圖片題才有
    options:                            # 恰好 3 個，恰好 1 個 correct: true
      - text: 磷酸肌酸系統
        correct: true
      - text: 快速醣解
        correct: false
        why_wrong: 把接手的系統當成當下主力；這條路徑要到磷酸原存量下降後才成為主要供應者。
      - text: 氧化系統
        correct: false
        why_wrong: 用穩態供能的路徑解釋瞬間爆發；它的供能速率不足以支撐全力衝刺的功率需求。
```

- 正解**不寫** `why_wrong`。
- `why_wrong` 要寫出考生是「犯了哪個思考錯誤」，不是把選項換句話說一遍。驗收會算它跟選項文字的字元重疊率，> 0.6 直接退。
- `dco` 是新欄位，讓覆蓋率算得出來——不然 sf1 的 48 題可能全擠在肌肉解剖，漏掉生物力學。

---

## 五、中英文

兩種語言**放在同一個 chNN.yaml**，用 `lang` 區分，不另開目錄。

| | 中文題 | 英文題 |
|---|---|---|
| 用途 | 確認觀念真的懂了 | 真實考試的題感與術語 |
| 比例 | 2/3 | 1/3 |
| 術語 | 中文為主，首次出現加英文（`肌束膜 perimysium`） | 全英文，用源書的用字 |
| 語體 | 正體中文。**不可出現簡體字**，驗收會拿已審的 1557 條語料當白名單掃 | 照樣題的語體：題幹完整問句，選項小寫片語 |

英文題不是中文題的翻譯。同一個 item 可以同時有中文題和英文題，但要問不同的角度——否則練習時等於同一題做兩次。

---

## 六、Phase 1 配題表

依官方 domain 權重分配，全 24 章共 **385 題**（約兩份完整考卷的量）。
每章的認知層級配比直接複製該 domain 的官方配題（`_dco.yaml` 的 `cognitive`）。

| 章 | domain | 題數 | recall | application | analysis | 其中英文題 |
|---|---|---|---|---|---|---|
| ch01–ch07（各） | sf1 運動科學 | 14 | 4 | 8 | 2 | 5 |
| ch08 | sf2 運動心理 | 40 | 12 | 24 | 4 | 13 |
| ch09–ch11（各） | sf3 營養 | 8 | 2 | 4 | 2 | 3 |
| ch12–ch13（各） | pa3 課表執行 | 22 | 3 | 12 | 7 | 7 |
| ch14–ch16（各） | pa2 動作技術 | 19 | 3 | 10 | 6 | 6 |
| ch17–ch22（各） | pa1 課程設計 | 15 | 1 | 7 | 7 | 5 |
| ch23–ch24（各） | pa4 組織行政 | 16 | 11 | 5 | 0 | 5 |

**測驗組合題（R6）的下限**：ch12–ch13 每章至少 6 題、ch17–ch22 每章至少 4 題必須是運動員側寫題。
這是語料裡佔比最高的題型（47 題裡 8 題，且全部集中在這兩組章節），配題表沒有硬性欄位，
但派工時要寫進該章的 prompt，驗收時人工數。其餘章節不強制。

注意 pa1（課程設計）幾乎沒有記憶題——44 題裡只有 2 題。把 ch17–ch22 的事實背熟只值那 2 分，所以這六章的題目要寫成「給你這個運動員和這個階段，課表該怎麼調」。反過來 pa4（組織行政）16 題裡 11 題是記憶題，ch23/ch24 照規章條文出題就對了。

**已存在的 ch01/ch02/ch08/ch13/ch18 各 10 題是四選項的舊格式**，本輪連同新題一起重寫成三選項，不保留。

---

## 七、驗收閘

`python -X utf8 tools/cscs_quiz_bank_check.py`，非零退出就是沒過。

| 閘 | 內容 |
|---|---|
| G1 | YAML 結構；恰好 3 個選項；恰好 1 個 `correct: true`；無重複 key |
| G2 | 正解長度 ≤ 最長干擾項 × 1.15（防「最長的就是答案」） |
| G3 | 三個選項長度變異係數 ≤ 0.4 |
| G4 | 最長選項 ≤ 最短選項 × 2.0 |
| G5 | 每個干擾項有 `why_wrong`，與選項本文字元重疊率 ≤ 0.6 |
| G6 | 題幹是完整問句（中文 ≥ 12 字收「？」；英文 ≥ 8 詞收「?」），且扣掉來源 `q` 之後仍自帶內容 |
| G7 | `item` 存在於來源章；`locator` 與來源逐字相同；`meta` 對應檔名 |
| G8 | 同章同 item 的題幹不得重複 |
| G9 | 三個選項兩兩字元重疊率 ≤ 0.6 |
| G10 | 章內認知層級配比符合第六節的配題表（±1 題） |
| G11 | 中文題用字不得超出 1557 條已審語料的字集（抓簡體與錯字），逐案回報 |
| G12 | `dco` 存在於 `_dco.yaml`，且該 domain 涵蓋本章 |
| G13 | `lang` 是 zh/en；英文題比例符合配題表（±1 題） |
| G14 | `EXCEPT` / 「不是」否定題每章 ≤ 1 題（R9） |
| G15 | application / analysis 題幹必須含比較限定詞（最／首先／優先／most／least／primary…）（R3） |
| G16 | 選項本文不得含分號（R1） |

閘門擋得住格式，擋不住「答案其實是錯的」。派工回來我會逐題抽驗事實，以源書為準。
R6 的測驗組合題下限、R7 的常模對齊、R8 的外在焦點判準都是機器驗不到的，逐章人工抽驗。
