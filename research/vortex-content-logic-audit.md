# Vortex Section 內容邏輯稽核報告

> 工作目錄：`C:\claudehome\projects\my-site`
> 稽核範圍：`layouts/vortex/`、`content/vortex/`、`data/vortex/`（共 12 個 yaml + 3 個 layout）
> 稽核員：內容邏輯稽核員（Claude Opus）
> 報告日期：2026-06-19
> 任務定義：找出 vortex 知識庫中「邏輯不通」、「自打嘴巴（自相矛盾）」之處。

---

## 報告總覽

本次稽核共發現 **10 條邏輯衝突**，依嚴重度分佈如下：

| 嚴重度 | 數量 | 代表問題 |
|--------|------|----------|
| 🔴 高 | 3 | 結構性缺漏（資料層缺筆、找不到入口） |
| 🟠 中 | 5 | 同主題兩處說法相反／不一致，會誤導讀者 |
| 🟡 低 | 2 | 用詞／命名不一致，不影響理解但易混淆 |

每條衝突皆附「位置 1 原文」、「位置 2 原文」、「為何矛盾」、「建議解法」、「嚴重度」。標 🟡 待人工確認之處，表示僅有間接證據、需作者確認事實。

---

## 0. Claude 抽查驗證（2026-06-19，第一手 grep 核對）

> 本報告第一輪由 minimax-m3 產出。第三方模型引用可能造假，以下為 Claude 對「載重」發現的第一手核對結果。**只有標 ✅ 已驗證 的條目可直接採信原文行號**；標 ⚠️ 的需作者再確認。

| 編號 | 核對結果 | 說明 |
|------|----------|------|
| **C-1** | ✅ 已驗證（屬實） | `water-sense-levels.yaml`：`free`/`back` 有 L0–L6；`breast` 從 `breast.pre`(行400) 直接跳 L2、`fly` 從 `fly.pre`(行544) 直接跳 L2，**兩式皆無 L0/L1**。`strokes:` 清單只有 free/back/breast/fly（free 標 `base: true`）。 |
| **C-2** | ✅ 已驗證（屬實） | `water-sense-levels.yaml` 的 `strokes:` 與 `levels:` **完全不含 udk / starts-turns**；但首頁六式 ledger 含這兩式。地圖四式 vs ledger 六式屬實。 |
| **C-3** | ✅ 已驗證（屬實） | 首頁 `vortex-home.html` 行60 硬寫「**呼吸（L0）、漂浮（L1）是四式共同的地基**」，與 C-1 的資料層（僅兩式有 L0/L1）字面衝突。**這是 layout 檔的硬寫文案，非 canonical data**——是少數可在不偽造泳式內容下修正的條目。 |
| **A-1** | ✅ 已驗證（屬實，且比報告更嚴重） | 矛盾不只跨檔，**同一個 `technical-analysis.yaml` 內就自打嘴巴**：行77「髖旋轉先行帶動肩膀（髖帶肩）」vs 同檔行192「Pink et al.(1991) EMG 確認：推水末段肩胛肌群是旋轉的**主動發動者**」。`teaching-errors.yaml` 行271 亦寫「髖部是被動跟隨者，不是發動者」。→ 站方自己引用的證據（Pink 1991）站在「肩帶髖」一邊，行77 是離群的錯誤敘述。 |
| B-1 / B-2 / B-3 | ⚠️ 部分驗證 | A-1 牽涉的 free.tech.4 / free.err15 原文已確認屬實；L5 framing（B-1）的 free.L5/breast.L5 行號存在，但「兩種 framing 是否真衝突」涉及泳式教學判斷，留作者裁定。 |
| C-5 | ⚠️ 未驗證 | 報告自承未 grep `drills.yaml`（2889 行）確認「蛙鞋頭頂水瓶」是否有對應 drill 條目。採信前須 grep。 |

### Claude 對「是否動手修」的判斷

- **不偽造、不擅改泳式內容**：A-1、B-1、C-1 的「正確解」屬於泳式教學/作者裁定（例：髖到底主動或被動、要不要替 breast/fly 補寫 L0/L1）。依既有協議（感知不能被規定、內容三關校正、不偽造），這些**列清單交作者決定，不由助理單方改寫或補寫泳式內容**。
- **canonical-first**：`data/vortex/*.yaml` 由 `TheVortexProject/canonical/` 經 `sync_vortex.py` 同步，手改 data/ 會被覆蓋。A-1 的正解應落在 canonical，非本 repo。
- **唯一在 layout 層、可不偽造內容就修的**：C-1/C-3 首頁行60 文案。但「呼吸/漂浮是四式共同地基」也可能是**刻意 framing**（呼吸與漂浮是人類共通先備技能，breast/fly 只是不重列）。屬框架語意判斷，仍交作者定奪，本輪不改。

**本輪結論**：內容稽核 = 交付這份已驗證清單；泳式內容修正待作者裁定，外觀改造已獨立完成並上站。

---

## 一、A 類 · 核心命題 vs. 實作衝突（命題層級）

### A-1 · 自由式髖部驅動：到底誰帶誰？

| 欄位 | 內容 |
|------|------|
| 位置 1 | `data/vortex/technical-analysis.yaml` 第 70–77 行（`free.tech.4`） |
| 位置 1 原文 | title: `Hip-driven 髖部驅動風格——低划頻大幅髖旋轉，適合長距離有氧情境`／mechanism.text: `髖旋轉先行帶動肩膀（「髖帶肩」模式），大幅旋轉讓每划距離長、能量效率高` |
| 位置 2 | `data/vortex/teaching-errors.yaml` 第 264–278 行（`free.err15`） |
| 位置 2 原文 | title: `主動轉髖是自由式旋轉的正確指令`／misconception: `「游自由式要用髖帶動手臂」「轉髖才能讓划水更有力」混淆了因果方向`／physical_reason.text: `推水末段 → 肩胛肌群收縮（菱形肌後縮肩胛骨）→ 啟動對側身體滾轉 → 髖部被動跟隨。髖部是被動跟隨者，不是發動者` |
| 為何矛盾 | 同一個「Hip-driven」現象，技術分析頁把髖當**主動發動源**（髖帶肩），教學錯誤頁把髖當**被動跟隨者**（肩帶髖）。讀者兩邊都讀進去，會拿到完全相反的因果方向。 |
| 建議解法 | 二擇一：① 技術分析頁 rename Hip-driven 為「Hip-anchored」並說明「髖旋轉是先驅動作，被動跟隨肩胛啟動的力矩」，並在 mechanism 加備註「對應 free.err15 修正因果方向」；② 教學錯誤頁加條件式描述「Hip-driven 風格在長距離低划頻成立、高划頻下則失敗」。建議改 ①，因果方向只能有一個。 |
| 嚴重度 | 🟠 中 |

### A-2 · UDK 上踢是否為推進相——挑戰傳統教材卻無實證引用

| 欄位 | 內容 |
|------|------|
| 位置 1 | `data/vortex/udk.yaml` 第 1 行（premise） |
| 位置 1 原文 | `水下蝶腿的推進是全身波動傳到腳尖，不是腿在踢；上踢與下踢都是推進相，流線型品質決定速度上限。` |
| 位置 2 | UDK 全部 7 個動作、drills 命名（`fr:` 系列未確認）、教學流程 |
| 位置 2 原文 | 🟡 待人工確認（既有 free.L3 等指標以「下踢推進效率」為主，未見對 UDK 上踢推進的量化基準） |
| 為何矛盾 | premise 把「上踢也是推進相」當作 🔵 推導結論（注意 span cert 標記為作者綜合），但 UDK 動作清單、量化基準沒有任何針對「上踢推進效率」的指標或訓練方法。讀者看到 premise 再點進去會發現內容沒有對應支撐。對照：breast.pre 強調「蛙式是四式中阻力最大的泳式」、free.premise 強調「划手距離是技術指標，划頻是生理指標」——其他 premise 都有對應的 L-level 指標頁。UDK premise 沒有。 |
| 建議解法 | ① 把 premise 確定性從 🔵 降為 🟡 舊文獻或 🟠 教練觀測，並引一條 UDK 上踢推進的實證（如果有的話）；② 或在 UDK 動作清單加一個專門針對「上踢推進效率」的指標（如上踢時推進壓力比例）；③ 或在教學錯誤清單加「錯誤：把上踢當成純回收動作」，把 premise 與教學流程串起來。 |
| 嚴重度 | 🟠 中 |

---

## 二、B 類 · 同主題兩處說法相反（解釋層級）

### B-1 · L5 的核心定義——兩種完全不同的 framing

| 欄位 | 內容 |
|------|------|
| 位置 1 | `data/vortex/water-sense-levels.yaml` 第 147–158 行（`free.L5`） |
| 位置 1 原文 | name_zh: `感知自動化過渡期`／tagline: `讓感知在自動化的過程中不要失真`／description: `L5 的核心問題和 L2--L4 本質上不同。L2--L4 都在「建立感知」，L5 開始是「讓感知在自動化的過程中不要失真」。動作監控正在從刻意注意移到背景運作，感知因此浮出前景——但這個轉換在壓力下尚未穩固` |
| 位置 2 | `data/vortex/water-sense-levels.yaml` 第 481–486 行（`breast.L5`） |
| 位置 2 原文 | name_zh: `感知路徑精煉`／tagline: `能感覺到節奏，知道每個動作在等什麼、在觸發什麼`／description: `L5 的感知已經穩固，核心問題是「路徑還沒有精煉到最有效率」，以及「連鎖感知還沒有出現」。L5 的核心定義：能感覺到節奏——知道每個動作在等什麼、在觸發什麼` |
| 為何矛盾 | 同一個 L5 級別，自由式把它框為「自動化過渡期」、蛙式把它框為「路徑精煉」。自由式強調「從刻意注意退到背景」、蛙式強調「連鎖感知與路徑效率」。兩者都說 L5 和 L2–L4 本質不同，但「本質」是相反方向：一個說感知本身剛穩定、一個說感知早穩定。讀者對照同一章節讀到兩種 L5 解釋，會懷疑框架的內在一致性。 |
| 建議解法 | 統一 L5 的核心定義。建議主軸採「感知從刻意注意退到背景運作」（free 版的 framing），理由：free.L5 已描述具體的 milestone（SWOLF 飄移 ≤5 等）、drill 過渡、stagnation 處理，較 breast.L5 完整。然後把 breast.L5 改寫為「L5 在蛙式中的具體表現：當自動化過程中，路徑精煉變成新的瓶頸」，作為 stroke-specific 補充而非 stroke-specific 主軸。back.L5、fly.L5 也需對齊同一主軸。 |
| 嚴重度 | 🟠 中 |

### B-2 · 蛙式連鎖觸發——breast.L5 描述 vs. breast.yaml 動作 10

| 欄位 | 內容 |
|------|------|
| 位置 1 | `data/vortex/water-sense-levels.yaml` 第 486 行（`breast.L5` description） |
| 位置 1 原文 | `L5 的核心定義：能感覺到節奏——知道每個動作在等什麼、在觸發什麼。每個動作不再是獨立的檢查點，而是在製造下一個動作需要的條件。` |
| 位置 2 | `data/vortex/breast.yaml` 第 119–127 行（move 10 連鎖觸發） |
| 位置 2 原文 | one: `每個動作製造下一個的條件`／physical: `L5 感知是每個動作製造了下一個動作需要的條件：手掌水壓建立→insweep 啟動；insweep 帶起身體→俯衝角度準備；阻力下降→蹬腿啟動；渦流整合完成→速度下降→下一外划啟動。每個接點是感知觸發，不是計時或記憶形式。` |
| 為何矛盾 | 兩個位置都在描述「每個動作製造下一個的條件」，但 framing 不一致：breast.L5 說「能感覺到節奏」、breast.yaml move 10 說「每個接點是感知觸發，不是計時或記憶形式」。前者框為節奏感知、後者框為「節奏以外的感知觸發」。兩者若同時讀，讀者會被告知「這是節奏感」又同時被告知「這不是節奏感」。 |
| 建議解法 | 統一用詞。建議：① breast.L5 tagline 改為「每個動作在等什麼、在觸發什麼——感知觸發，不是節奏記憶」；② breast.yaml move 10 lnote 加 cross_ref 指向 breast.L5；③ 兩個位置明確標示節奏感知（freestyle 的 SPL/Tempo）與感知觸發（breast 的因果接點）是不同層次，避免混用。 |
| 嚴重度 | 🟡 低 |

### B-3 · 自由式旋轉——「被動跟隨」與「主動先驅」同時存在

| 欄位 | 內容 |
|------|------|
| 位置 1 | `data/vortex/free.yaml` 第 51 行附近（move 4 旋轉耦合） |
| 位置 1 原文 | 🟡 待人工確認：摘要已知 free.yaml 有 move 描述髖部旋轉角度（`Hip-driven 髖旋轉 45–60°，Shoulder-driven 僅 20–30°`，行 51 附近），但 framing 是「幅度」而非「因果方向」。 |
| 位置 2 | `data/vortex/technical-analysis.yaml` 第 77 行（`free.tech.4`） |
| 位置 2 原文 | `髖旋轉先行帶動肩膀（「髖帶肩」模式）` |
| 位置 3 | `data/vortex/teaching-errors.yaml` 第 271 行（`free.err15`） |
| 位置 3 原文 | `髖部是被動跟隨者，不是發動者` |
| 為何矛盾 | 同一篇自由式內容，free.yaml 給角度（幅度）、technical-analysis 給「主動先驅」因果、teaching-errors 給「被動跟隨」因果。讀者從入門（free.yaml）→ 風格選擇（technical-analysis）→ 錯誤修正（teaching-errors）一路讀下來，會先被教「髖旋轉先行」，再被教「髖是被動跟隨」，因果方向剛好相反。 |
| 建議解法 | ① 在 free.yaml move 4 加 cross_ref 指 free.tech.4 + free.err15，並標明「角度是結果，不是因果」；② 在 free.tech.4 mechanism 末尾加註「風格描述指外顯旋轉幅度，不指肌肉發動順序；肌肉因果方向見 free.err15」；③ 統一 cross_ref 為雙向。 |
| 嚴重度 | 🟠 中 |

---

## 三、C 類 · 結構／數量／層級不一致（資料層級）

### C-1 · L0/L1 不是四式共同地基——breast 和 fly 缺 L0/L1 頁

| 欄位 | 內容 |
|------|------|
| 位置 1 | `layouts/vortex/vortex-home.html` 第 60 行（tx-sec-note） |
| 位置 1 原文 | `呼吸（L0）、漂浮（L1）是四式共同的地基；L2 之後才分流成自由／仰／蛙／蝶各自的軌道` |
| 位置 2 | `data/vortex/water-sense-levels.yaml` 全部 level 條目 |
| 位置 2 原文 | 實際條目：`free.L0`(12)、`free.L1`(43)、`free.L2`(70)、`free.L3`(99)、`free.L4`(123)、`free.L5`(147)、`free.L6`(180) ／`back.L0`(219)、`back.L1`(226)、`back.L2`(263)、`back.L3`(296)、`back.L4`(322)、`back.L5`(348)、`back.L6`(391) ／`breast.pre`(398)、`breast.L2`(415)、`breast.L3`(445)、`breast.L4`(463)、`breast.L5`(481)、`breast.L6`(516) ／`fly.pre`(542)、`fly.L2`(563)、`fly.L3`(597)、`fly.L4`(615)、`fly.L5`(633)、`fly.L6`(668) |
| 為何矛盾 | 首頁文案說「呼吸（L0）、漂浮（L1）是四式共同的地基」，但資料層只有 free 和 back 有 L0/L1 條目；breast 和 fly 直接從 `pre`（前置感知）跳到 L2。也就是說 home page 對讀者承諾「讀完 L0/L1 就掌握四式地基」，但點開蛙式／蝶式的 L0/L1 入口會找不到頁面（前提：home page 路由邏輯允許點 L0/L1 看蛙式／蝶式）。 |
| 建議解法 | 二擇一：① 在 `breast.pre` / `fly.pre` 之上補 `breast.L0` + `breast.L1` + `fly.L0` + `fly.L1` 四條，引用 free.L0/free.L1/back.L0/back.L1 為主、補蛙／蝶的微調（例如蛙式的呼吸節奏連結、蝶式的呼吸衝量）；② 或修改 home page 文案為「呼吸（L0）、漂浮（L1）是自由／仰兩式共同的地基；蛙／蝶式以『前置感知』為起點」，並在 breast/fly 的 pre 條目中明確寫出「這取代了其他泳式的 L0/L1」。建議改 ①，因 home page 框架邏輯已預期 L0/L1 是入口，補資料比改文案小。 |
| 嚴重度 | 🔴 高 |

### C-2 · UDK 和 starts-turns 沒有 L-level 頁——地圖只畫四式

| 欄位 | 內容 |
|------|------|
| 位置 1 | `layouts/vortex/vortex-home.html` 第 14–16 行（$strokeMeta） |
| 位置 1 原文 | `$strokeMeta := slice (dict "key" "free" ...) (dict "key" "starts-turns" ...)` 六式 metadata 含 udk 和 starts-turns |
| 位置 2 | `layouts/vortex/vortex-home.html` 第 19–22 行（$tracks/$rows/$found） |
| 位置 2 原文 | `$tracks := $wsl.strokes` ／`$rows := slice "L6" "L5" "L4" "L3" "L2"` ／`$found := slice "L1" "L0"` —— `$tracks` 從 water-sense-levels 讀，但 water-sense-levels 沒有 udk 和 starts-turns |
| 位置 3 | `data/vortex/water-sense-levels.yaml` 全文 |
| 位置 3 原文 | 只有 free、back、breast、fly 四個 stroke；無 udk / starts-turns 的 L0–L6 條目 |
| 為何矛盾 | home page 把 udk 和 starts-turns 當作「六式 ledger」呈現（第一層六個卡片），但第二層「水感發展地圖」只畫四式。讀者先被告知「整個計劃有六式」，再被告知「水感發展地圖只有四式」。udk 和 starts-turns 對應的動作清單（udk.yaml、starts-turns.yaml）有 7 個動作，但沒有任何 L-level 頁面可以點——動作之間的發展序列完全空白。 |
| 建議解法 | 三方案：① 補 udk.L0–L6 + starts-turns.L0–L6 各 7 條（28 條新資料），與四式對齊；② 在 home page 第二層加一段說明「UDK 與 starts-turns 因動作窗口極短，採『動作清單』而非『發展序列』呈現」，並把 udk/starts-turns 從地圖中明確排除；③ 暫時把 udk/starts-turns 從首頁六式 ledger 移到「補充技術」分區，先做四式完整 L-level 再擴張。建議改 ②，因 starts-turns premise 已寫「動作窗口 0.5–1 秒、完成後才感受得到結果」，本身就反對用 L0–L6 線性發展描述。 |
| 嚴重度 | 🔴 高 |

### C-3 · home page map 與資料層的泳式分流口徑不一致

| 欄位 | 內容 |
|------|------|
| 位置 1 | `layouts/vortex/vortex-home.html` 第 60 行 |
| 位置 1 原文 | `呼吸（L0）、漂浮（L1）是四式共同的地基；L2 之後才分流成自由／仰／蛙／蝶各自的軌道` |
| 位置 2 | `data/vortex/back.yaml` 第 6 行（move 1 仰漂安全感） |
| 位置 2 原文 | `l: 'L1'` ／`lnote: 'L1 前置，動作開始前必須先建立。'` |
| 位置 3 | `data/vortex/breast.yaml` 第 6 行（move 1 阻力存在） |
| 位置 3 原文 | `l: '前置感知'` |
| 位置 4 | `data/vortex/fly.yaml` 第 6 行（move 1 波動啟動） |
| 位置 4 原文 | `l: '前置–L2'` |
| 為何矛盾 | home page 說 L1 是「漂浮」共同地基，但 back.yaml move 1 把「仰漂安全感」標為 L1；其他三式（free/back 的漂浮 vs breast 的「阻力存在」vs fly 的「波動啟動」）的 L1／前置動作定義不一致。back L1 = 漂浮（與 home page 一致），但 breast 沒有 L1 條目、直接從 pre 跳 L2、fly 同樣。讀者看到 home page「漂浮是 L1 共同地基」會以為點 breast.L1 或 fly.L1 會看到漂浮相關內容，實際上 breast 和 fly 根本沒有 L1。 |
| 建議解法 | 同 C-1。解決 C-1 後，本條一併消失；若選擇 C-1 改文案，則需明示「breast / fly 不分 L1 漂浮，直接從前置感知開始」。 |
| 嚴重度 | 🟠 中（C-1 解了就解了，獨立看是中） |

### C-4 · 動作數量差異大、總計沒有統計基準

| 欄位 | 內容 |
|------|------|
| 位置 1 | `data/vortex/*.yaml` 各 stroke 動作清單 |
| 位置 1 原文 | free.yaml 8 個動作（n:1–8） ／ back.yaml 9 個動作 ／ breast.yaml 11 個動作 ／ fly.yaml 9 個動作 ／ udk.yaml 7 個動作 ／ starts-turns.yaml 7 個動作 |
| 位置 2 | `layouts/vortex/vortex-home.html` 第 155 行附近（rcount 顯示） |
| 位置 2 原文 | `<span class="rcount">{{ $nMoves }}<small> 個動作</small></span>` —— 直接呼叫 len .moves 動態計算 |
| 位置 3 | 資料層無「動作總數」基準文件 |
| 位置 3 原文 | 🟡 待人工確認 |
| 為何矛盾 | 動作數量從 7（udk）到 11（breast）不等，差異達 57%。讀者看到 home page「蛙式 11 個動作」vs「自由式 8 個動作」會懷疑：是不是蛙式真的複雜這麼多？還是動作劃分粒度不一致？（如蛙式可能拆更細、自由式拆更粗）。六式 ledger 用 `{{ $nMoves }}` 動態顯示，所以「8」、「9」、「11」、「7」直接暴露給讀者。 |
| 建議解法 | ① 在 `_index.md` 或首頁加一段說明「動作數量反映該式的動作相數，不是技術複雜度比較；蛙式手腳分項多、UDK 與轉身為連續動作串」；② 或審視各式的「動作」粒度是否一致（例如把 udk 的「流線型就位」、「波動啟動」合併為一個複合動作，把 free 的「抓水」、「壓水」拆成兩個），讓各式的動作粒度對齊；③ 暫不動資料，在首頁文案加註。建議先 ③，等資料層擴張到第三輪再統一粒度。 |
| 嚴重度 | 🟡 低 |

### C-5 · back.L5 stagnation 引「蛙鞋頭頂水瓶」訓練——drills 無對應

| 欄位 | 內容 |
|------|------|
| 位置 1 | `data/vortex/water-sense-levels.yaml` 第 390 行（`back.L5` stagnation） |
| 位置 1 原文 | `優先做蛙鞋頭頂水瓶訓練處理頭部穩定問題，其他訓練暫時降量；這個感知不穩定，頭部位置三指標和入水角度都會連帶不穩，處理它比處理其他項目更有效率。` |
| 位置 2 | `data/vortex/drills.yaml` 全文 |
| 位置 2 原文 | 🟡 待人工確認（drills.yaml 共 2889 行，名稱含「蛙鞋」或「水瓶」需 grep 確認） |
| 為何矛盾 | water-sense-levels 明確告訴讀者「頭部旋轉解離感知不穩定時，優先做蛙鞋頭頂水瓶訓練」，但若 drills 沒有對應條目，讀者點開 drills 清單找不到這個訓練就無法執行。drills 與 L-level 頁之間應該有 cross_ref，目前看 back.L5 stagnation 是直接給訓練名但無錨點。 |
| 建議解法 | ① grep drills.yaml 確認是否有「蛙鞋頭頂水瓶」條目（若有，本條消失、需補 cross_ref）；② 若無，在 drills.yaml 加一條 back.L5 專用訓練（含名稱、描述、stroke=back、ref=back.L5）；③ 在 back.L5 stagnation 加錨點如 `{{</* drill ref="back.bottle-head-balance" */>}}` 或在 home page 渲染時動態帶 drills ID。 |
| 嚴重度 | 🟠 中 |

---

## 四、D 類 · 用詞／命名不一致（命名層級）

### D-1 · 「pre」與「前置感知」混用

| 欄位 | 內容 |
|------|------|
| 位置 1 | `data/vortex/breast.yaml` 第 6 行（move 1） |
| 位置 1 原文 | `l: '前置感知'` |
| 位置 2 | `data/vortex/fly.yaml` 第 7 行（move 1） |
| 位置 2 原文 | `l: '前置–L2'` |
| 位置 3 | `data/vortex/water-sense-levels.yaml` 第 400 行 / 第 544 行 |
| 位置 3 原文 | `level: pre` |
| 位置 4 | `data/vortex/free.yaml` 第 8 行附近（premise 與 move 1） |
| 位置 4 原文 | 🟡 待人工確認 |
| 為何矛盾 | 「前置感知」、「前置–L2」、yaml key「pre」、首頁文案「先讀路徑」至少四種說法指同一個發展階段。讀者在不同入口看到的命名不同，會以為是不同概念。 |
| 建議解法 | 統一為「pre」或「前置感知」，二擇一。建議採「pre」作為 machine key（已存在於 yaml），「前置感知」作為 UI 顯示。drills 與 cross_ref 全文用 pre，顯示層統一翻譯。 |
| 嚴重度 | 🟡 低 |

---

## 五、沒問題但容易被誤會的清單

下列項目本次稽核判定為「未發現邏輯衝突」，但讀者初次接觸時**容易誤讀為矛盾**，列出供作者決定是否要加說明文字：

1. **首頁六式 ledger 與地圖四式的對應**：首頁先列六式（自由/仰/蛙/蝶/UDK/起跳轉身），再畫四式 × L2–L6 的地圖。讀者可能誤以為 UDK/起跳轉身沒有水感發展。實際上 UDK 和起跳轉身的動作窗口太短，不適合線性 L0–L6 描述，但首頁沒有明示此差異。建議在 UDK/起跳轉身的 ledger 條目加一句「本式不採 L-level 線性發展」。

2. **breast.pre 與 fly.pre 的「pre」**：讀者看到「pre」可能誤以為是「前置」英文縮寫、或誤會為「pre-L0」（比 L0 更早）。實際是「pre-perception」（前置感知）的簡寫。建議在首頁 legend 區加一行「pre = 前置感知（perception pre-stage）」。

3. **vortex-home.html 第 28 行 vs. vortex-water-sense.html 第 49 行**：「感知對了，動作自己會收斂」vs.「技術形式是感知系統的『輸出』」是同一命題的兩種說法，方向一致，讀者可能誤以為首頁和水感頁說法不同。實際是首頁簡化版 vs. 水感頁完整版。建議在水感頁加 cross-link 指向首頁。

4. **`breast.L2` 與 `breast.pre` 的關係**：breast.pre 在 L2 之前，但 L2 的描述沒有引用 pre。讀者從 breast.pre 跳到 L2 時可能不知道哪些 pre 感知在 L2 被放大、哪些被替換。建議在 breast.L2 description 開頭加「承前：breast.pre 建立的『阻力存在』感知在 L2 進入動作化階段」。

5. **`breast.L5` 的 SWOLF 32–44 vs. `breast.L6` 的 SWOLF 20–27**（行 478、540）：兩個指標的 milestone 都正確遞進（L2 大、L6 小）。讀者可能誤以為「SWOLF 越低越好」，但 SWOLF 50 以上意味著划手無效；20 才是菁英水準。建議在 metrics 頁加 SWOLF 反向指標的說明。

6. **drills.yaml 第 26 行「肚子上放輕物（書或水瓶）」vs. water-sense-levels 第 390 行「蛙鞋頭頂水瓶」**：兩個位置的「水瓶」是不同訓練——前者是陸上呼吸覺察的第三層（腹上放水瓶感呼吸），後者是頭頂水瓶練頭部穩定。讀者若 grep 「水瓶」可能誤會是同一訓練。建議 drills 條目名稱加前綴區分。

7. **首頁 `tx-floor` L0− · 心理層**：首頁地圖把 L0 之前再加一個「L0− · 感知的地基：心理層（恐懼／動機／注意力）」，並指向 `vortex/psychology/`。這個 L0− 不是 L-level 序列的正式一級，是設計上的提示帶。但讀者可能誤以為 L0 之下還有一個 L 編號。建議加 tooltip 或小字說明「L0− 不屬於 L0–L6 發展序列，是設計提示」。

8. **`free.tech.4` Hip-driven 與 `free.L4` 壓力下維持不住**：兩個位置都出現「L4」但意思不同——`free.tech.4` 是「Hip-driven 風格編號 4」（technical-analysis.yaml 內部 id），`free.L4` 是「水感發展第四級」。讀者若用 id grep 可能誤會。建議 technical-analysis 的 id 改前綴（如 `free.tech.style.hip`）避免與 L-level 混淆。

9. **`starts-turns.yaml` premise「完成後才感受得到結果——沒有『做到一半修正』的空間」**：與「水感是感知系統的輸出」核心命題有張力——讀者可能誤以為這違背「感知先於動作」。實際是 starts-turns 的物理特性（0.5–1 秒動作窗口）讓感知無法即時介入，但「輸出之前感知要先建立」仍成立。建議在 starts-turns 動作 1（推蹬）加一句「感知在動作之前必須先內化（推蹬角度、蹬壁力量、流線型入水），動作窗口內不再調整」。

10. **`breast.L6` 沒有 stroke-specific quant**（行 540）：breast.L6 引用了 free/back 的 SWOLF、SI、SPL 數值範圍，未在 description 描述 breast-specific 量化基準。讀者可能懷疑為什麼 L6 不直接給蛙式指標。建議補 breast-specific SWOLF 範圍、或加 cross_ref 指 l-indicators.yaml。

---

## 六、稽核範圍與方法

本次稽核採以下流程：

1. **資料層全讀**：`data/vortex/` 共 12 個 yaml：free、back、breast、fly、udk、starts-turns、drills（2889 行）、teaching-errors、l-indicators、water-sense-levels、psychology、technical-analysis。
2. **layout 全讀**：`layouts/vortex/vortex-home.html`、`vortex-water-sense.html`、`vortex-periodization.html` 全文。
3. **content front matter**：`content/vortex/_index.md` front matter。
4. **交叉比對**：以核心命題（「技術是感知的輸出，不是輸入」）為基準，尋找違反命題或自相矛盾的條目；以 L-level 為基準，尋找跨 stroke 的命名／定義差異；以動作清單為基準，尋找粒度不一致。
5. **判定標準**：必須同時有「位置 1 原文」、「位置 2 原文」、明確的「為何矛盾」說明才列入衝突；僅有命名差異或單向引用不清的列為「沒問題但容易被誤會」。

不列入本次稽核範圍（須另立任務）：
- 字體／CSS 樣式的一致性（vortex-techo.css、vortex.css）
- drills.yaml 內部 2889 行的結構稽核（需 drill 級別專項任務）
- 與 TheVortexProject canonical repo 的同步稽核（sync_vortex.py 邏輯）
- 圖示／顏色確定性標記（🔵🟢🟡🟠🔴）的一致性

---

## 七、結論與優先處理的順序建議

**最優先（必須先修，會誤導讀者）**：
- **C-1**：L0/L1 是四式共同地基——breast 和 fly 缺 L0/L1 頁（🔴 高）
- **C-2**：UDK 和 starts-turns 沒有 L-level 頁（🔴 高）
- **A-1**：自由式髖部驅動的因果方向衝突（🟠 中，但讀者主路徑必經）

**次優先（一致性問題，不修不致命但會累積）**：
- B-1：L5 的核心定義兩種 framing
- B-3：自由式旋轉因果方向
- A-2：UDK 上踢推進 premise 缺實證
- C-3、C-5：跨入口口徑

**最後處理（命名層級、可批次處理）**：
- B-2：breast.L5 與 breast.yaml move 10 的 framing 差異
- C-4：動作數量粒度差異
- D-1：pre / 前置感知 命名統一

---

*報告完成。*