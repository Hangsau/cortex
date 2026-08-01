# 任務：CSCS 第 __CHNN__ 章 對帳式補完

## 執行模式

**非互動模式（`codex exec`）。沒有人會回覆你，輸出計畫等確認等於這次派工完全失敗。**
不要先提計畫、不要問「有需要調整的地方嗎」、不要等「開始」。讀完本文件就直接動手改檔案。
遇到判斷不清的地方，依下面的規則自己決定（規則明說「書上沒有的一律刪掉」「沒把握就留空」），不要停下來問。

## 工作範圍（硬邊界）

工作根目錄：`C:\claudehome`

**唯一允許修改的檔案**：
- `projects\my-site\data\cscs\__CHID__.yaml`
- `projects\my-site\data\cscs\_terms.yaml`（只允許**新增** key，不得刪改既有 key）

**禁止**：
- 修改任何其他檔案（其他章的 yaml、layout、CSS、腳本、文件一律不動）
- 執行任何會改變 working tree 的 git 指令（`commit` / `add` / `stash` / `checkout --` / `reset` / `clean` / `pull` / `push` / `rebase` 全部禁止）。改完檔案就停，由呼叫者驗收與 commit。
- 新增檔案

## 背景：為什麼要做這件事

這個網站的 CSCS 24 章內容是 2026-04 由 LLM **憑記憶生成**的，從未跟源書對過帳。1583 個知識單位的出處欄位全是空的。已抽驗出的實質錯誤樣態：

- **範圍偷換**：原文 `The body stores 80-100 g of ATP`（全身）被寫成「**肌肉**儲量 80-100 g」
- **語氣硬化**：原文 `MES is thought to be about 1/10 of the force required to fracture bone`，摘要吃掉 *is thought to be*，變成斷言
- **憑通說補書上沒有的數字**：軸心骨「約 80 塊」、附肢骨「約 126 塊」解剖學上正確，但**這本書沒講**
- **因果張冠李戴**：「肌腱血流差所以癒合慢」——書上的原因是成熟腱細胞少、代謝活性低
- **表格只抄一半**：原文 Table 3.6 有四行，摘要只抄三行
- **英文術語書中根本沒用過**：站上寫「髂腰肌 iliopsoas」，該章全章 0 次命中，書上寫的是 iliacus

你的工作是**把每一條拉回源書原文**。你的既有知識、運動科學通說、其他教科書一律不算數。

## 源書（唯一權威）

`C:\claudehome\resources\books\Essentials_of_Strength_Training_and_Conditioning,_Fourth_Edition\__SRCFILE__`

EPUB 轉出的 Markdown 全文（英文）。**先整章讀過再動手**，不要邊搜尋邊填。

### 讀檔硬性要求：必須讀到檔案真正的最後一行

分頁讀檔前，**行數只能用會計入空行的方式取得**：

```powershell
(Get-Content -LiteralPath $source).Count      # 對：陣列長度，含空行
```

**禁止用 `Measure-Object -Line` 當分頁上界**——它不計空行，`Select-Object -Skip/-First` 的索引卻含空行。2026-08-01 ch10 就是這樣爆的：`Measure-Object -Line` 回 344，實際 526 行，agent 讀到 344 就停，**靜默漏掉最後 182 行整個「Feeding and Eating Disorders」章節**，接著依「書上沒有的一律刪掉」規則把 8 條正確 item 全改寫成「教材未列出」，還在回報裡把源書真的有的數字（19 歲、0.9%、0.6%、25 歲、兒童 BMI 第 5／85／95 百分位）列為「書中找不到，已刪除」。整章作廢重跑。

讀完後**自我驗證兩件事，沒過不准開始改檔**：

1. 印出最後 5 行，確認你讀到的尾巴就是檔案結尾（通常是 Study Questions 或參考書目）
2. 列出全章所有 `^#{2,4} ` 標題，確認**每一個標題你都讀過對應內文**。之後每個 topic 的 `locator` 都要能對到這份清單裡的真標題

**「我讀到的段落裡沒有」不等於「書上沒有」。** 判定某內容書上沒有、要刪除之前，必須先在全章做一次字串搜尋確認真的 0 命中——刪錯的代價是把正確內容換成假的否定句，比留著未查證的內容更糟。

## 資料格式

`data/cscs/__CHID__.yaml` 結構：

```yaml
id: __CHID__
weight: __CHNUM__
title: Ch.__CHNUM__ 中文章名
topics:
- id: topic-slug
  title: 中文主題名 English Topic Name
  desc: ''
  tag: Cardiovascular          # 閃卡分類標籤
  items:
  - id: __CHID__.topic-slug.iNN
    q: 標題句（這條在講什麼）
    a:                          # YAML list，不是「；」分隔的字串
    - 條列答案第一點
    - 條列答案第二點
    detail: ''                  # 深度層
    terms: []                   # 指向 _terms.yaml 的 key
    numbers: []                 # v / unit / of 三欄
    concepts: []                # 只能用 _concepts.yaml 的封閉集
    related: []                 # 指向其他 item 的完整 id，可跨章
    locator: ''                 # 書中出處
cards:                          # __NCARDS__ 張閃卡，與 items 平行的獨立區塊
- q: 問題
  a: 答案
  tag: Neural
```

已完成可當範本的章節：`data/cscs/ch05.yaml`（去看它的 `locator` / `numbers` / `detail` 寫法）。
概念封閉集：`data/cscs/_concepts.yaml`。全書術語表：`data/cscs/_terms.yaml`。

## 本章現況

__STATUS__

## 工序

本章逐 topic 做。**每做完一個 topic 立刻把 yaml 寫回磁碟**——中途中斷時已完成的部分必須保留。

對每一條 item：

1. **`locator`**：在源書找到對應段落，填書中**真實的**小節標題階層，用 ` > ` 串接。
   例：`Cardiovascular and Respiratory Responses to Anaerobic Exercise > Acute Cardiovascular Responses to Anaerobic Exercise`
   找不到對應段落 → 這條很可能是憑空生成的，改寫成該主題底下書上真的有講的內容。

2. **逐句核對 `q` / `a`**，與原文不符就改。優先抓上面「背景」列的六類錯誤。另外三條鐵則：
   - **書上沒有的一律刪掉，不要「補正確版」**。生理學上正確但這本書沒講的內容，不屬於這裡。
   - **只有正文能當依據**。圖片與圖說的內容無法核實，不可採用。
   - **英文術語要確認書中真的用那個詞**（在源書全章搜一次），不要套同義的常見譯名。

3. **每個數字都要回原文確認淨值／總值與單位。**
   （這一句是 ch03 品質明顯高於其他章的唯一原因，不要略過。）
   確認後填進 `numbers`：
   ```yaml
   numbers:
   - v: 320/250
     unit: mmHg
     of: 95% 1RM 腿推測得的血壓峰值
   ```
   `v`/`unit`/`of` 三欄缺一即驗收失敗。`of` 要寫「這是**什麼**的數字」，不是重複單位。
   書上找不到的數字 → 從 `a` 和 `numbers` 一起刪掉，不要保留。

4. **`detail`**：寫「為什麼／這代表什麼／書中的但書與適用邊界」。**不得複述 `a`**。沒有可寫的深度就留空字串 `''`，不要硬湊——空的深度層在網頁上整塊不渲染，不會出現半成品畫面。

5. **`terms`**：填 `_terms.yaml` 的 key（kebab-case）。該詞還沒有 → 在 `_terms.yaml` 新增：
   ```yaml
   stroke-volume:
     en: "Stroke volume"
     zh: "每搏量"
     abbr: "SV"        # 只有縮寫才填，網頁會展開全稱
     note: "一次心搏由左心室打出的血量"
   ```
   **只加實際被引用的**，不要預先把整章 Key Terms 清單灌進去（會被驗收腳本列為「定義了沒人用」）。
   反過來也要顧覆蓋率：**`q` / `a` 裡只要出現書上的英文專有名詞，那條就該掛 term**，不要只挑最生僻的幾個。ch06 是 64 條裡 63 條有 terms，ch07 只有 37 條——後者偏低。使用者最初的痛點就是「只有英文沒有中文」，漏掛等於那個詞在頁面上沒有中文。

6. **`concepts`**：只能從 `_concepts.yaml` 的 22 條封閉集挑，**不得發明新的**。既有值多半已由批次腳本標好，判斷明顯不對才改。

7. **`related`**：指向其他 item 的完整 id，可跨章（跨章會自動變 wiki 連結）。指向不存在的 id 會驗收失敗，沒把握就留空。

8. **`id` 不要改**，`topics` 的順序與 `id` 也不要動。

## 閃卡（`cards:` 區塊，__NCARDS__ 張）

2026-04 那批卡片有**大規模文字崩壞**——不是錯字，是整句無意義，例：

- ch24「察態硬為疑說慢碟（negligence）」
- ch21「主導導山的稐前期、件卡永遺期」
- ch13「前三个字此前里溫度」

也混有書上根本不存在的數字（例：「離心比向心高 20-50%」——該章全部百分比只有 10/15/74/85/90）。

**規則：不准猜壞字原本是什麼字。一律回源書該章重寫。**
理由：把亂碼還原成通順中文，只是把一個沒查證的說法寫得比較好看；既然要動手就一次改成書上真的有的。

- __NCARDS__ 張**全部**逐張回源書重寫 `q` / `a`
- `tag` 沿用既有分類值
- 卡片內容必須與你剛改好的 items 一致（同一次作業一起改，天然一致）
- 若某個 topic 完全沒有卡片覆蓋，可把重複性高的卡片改成覆蓋它

## 語言規範

- **繁體中文，台灣用語**。禁止簡體字。禁止中國大陸用語：用「品質」不用「質量」、「資訊」不用「信息」、「程式」不用「程序」、「影片」不用「視頻」、「伺服器」不用「服務器」、「最佳化」不用「優化」。
- 英文專有名詞第一次出現時中英並列，例：「每搏量（stroke volume, SV）」。
- **教材原文本身語意含糊或不符常規時，逐字保留，並在 `detail` 標「教材原文如此」**，不要自行改寫成看起來合理的版本。

## 驗收（你自己要跑到綠才算完成）

```
cd C:\claudehome\projects\my-site
python tools/cscs_check.py __CHID__
```

輸出的「錯誤」一條都不准留。斷鏈的 `related` / `terms` / `concepts`、`numbers` 缺欄、重複 id **一律算失敗，不是待辦**——Hugo 查不到 key 只會回空字串且不報錯，斷鏈在網頁上是無聲消失。

YAML 必須能 `yaml.safe_load` 通過。

## 完成後回報（最後訊息，四項都要）

1. 改了幾條 item、幾張卡、`_terms.yaml` 新增哪些 key
2. **你抓到的實質錯誤清單**——逐條寫「原本寫什麼 → 書上實際是什麼 → 出處小節」。**這是本次工作最重要的產出，不要省略、不要只寫「已修正若干處」**
3. 你判定「書上找不到、已刪除」的數字有哪些
4. `python tools/cscs_check.py __CHID__` 的最後輸出原文
