# Design Craft Meta-Research：品味 / 互動 / 視覺衝擊 / AI 設計批評

> 研究問題：上次 `design-principles-deep-dive.md`（2026-06-18）挖了「**設計原理**」層（typography / 視覺層級 / a11y）。但我對站主列的「弱項」（互動品味 / 視覺衝擊 / 跨文化 sense / 長期演化）承認「AI 沒有原創設計主張」。**站主 push back：去找方法論。**
>
> 本研究就是「**設計 craft 的元研究**」 — 不再找「好的設計是什麼」（上次做過），而是找「**怎麼把設計 craft 做好**」 — 品味怎麼培養、互動怎麼設計、視覺衝擊怎麼拆、AI 怎麼設計批評。
>
> 範圍：
> - **A. 品味可學嗎？**（Typewolf「資料驅動判斷非品味」+ 大量看 + 拆解 + 抄）
> - **B. 設計 heuristics / checklist 體系**（NN/g 10 heuristics + Awwwards 評審 + design review 通用標準）
> - **C. 互動設計 SOP**（Material Design 3 motion patterns + Apple HIG + duration tokens）
> - **D. Usability Testing SOP**（NN/g 5-參與者法 + think-aloud + AI 時代調整）
> - **E. AI 設計批評的可執行路徑**（Playwright + Read vision + Multi-agent critique + heuristics checklist）
> - **F. 視覺衝擊的拆解法**（策展網站方法論 + Typography 趨勢）
> - **G. 與上次的 cross-link**（這次補上次的「弱項怎麼補強」）
>
> **不重複**（已被 `design-principles-deep-dive.md` 涵蓋）：
> - Typography 原理 / 視覺層級 / a11y / Core Web Vitals / GitHub 5 repo 設計邏輯
>
> 報告產出時間：2026-06-18
>
> 本研究**不建議**：把這份研究當作「品味替代品」。AI 的品味是統計上的「頂尖作品分布」，不是個人審美。**站主審查仍是閉環關鍵**。

---

## 0. Trigger — 為什麼這次研究

站主（2026-06-18 晚上）「**你說的問題應該很多人去解決 有試著去看有什麼管道 會有解決這些問題的方式嗎？你可以透過論壇 skill github 之類的去尋找 該如何把這些事情做好吧**」。

觸發拆解：
- 站主對我之前「AI 有邊界」的回答**不滿意** — 不接受「邊界」這個 framing
- 站主要的是「**去找方法**」，不是「承認做不到」
- 隱含 push：上一輪研究效果好（typography / 5 repos / WCAG），這次該用同樣方法找「**怎麼訓練 AI / 怎麼把弱項變強**」

---

## 1. 一句話結論

> **品味可學（透過資料驅動而非品味）、互動可設計（透過 motion patterns + duration tokens）、AI 可批評（透過 vision LLM 看截圖 + heuristics checklist + multi-agent critique）**。上次研究的「弱項」不是 hard limit，是「**還沒找到 SOP 的弱項**」。

---

## 2. 品味可學嗎？— Typewolf 的關鍵洞察

**權威來源**：Typewolf（Jeremiah Shoaf 創辦，2014-至今）。URL: https://www.typewolf.com/。

### 2.1 核心命題

Typewolf 的方法論**不是品味**，是「**資料驅動的判斷**」：
- 每天看「**Site of the Day**」案例 — 真實頂尖設計師用的字型
- 從實際使用頻率排序字型熱度（Apercu / GT America / Futura / Founders Grotesk / Neue Haas Grotesk 等）
- 「**Top 10 Helvetica Alternatives**」等策展文章 — 承認主流字型不總是最佳，但給出**具體替代**
- 「**Flawless Typography Checklist**」 — **把品味轉成可驗證的 checklist**

### 2.2 「Show, don't tell」

> Typewolf 的方法論是 "show, don't tell" — 用真實頂尖網站案例作為證據，讓資料說話而非編輯個人審美。

**這對 AI 是巨大解放** — AI 不需要「有品味」，需要「**看很多真實案例 + 拆解 + 統計**」。

### 2.3 2024-2026 Typography 趨勢（從 Typewolf SOTD 推斷）

| 趨勢 | 代表字型 | 為什麼 |
|------|---------|--------|
| Swiss 風格復興 | Neue Haas Grotesk / Neue Montreal | 冷靜、中性、可讀性優先於裝飾 |
| 新世代中性字型 | Diatype / Diatype Mono | 取代 Helvetica 但更現代 |
| 當代襯線興起 | Editorial Old / Tobias / Arizona Flare | 取代 Didone（過度時尚襯線） |
| Mono 進入品牌領域 | DM Mono / IBM Plex Mono | 不只用於代碼，editorial design 也用 |
| 整體走向 | — | **冷靜、中性、可讀性 > 裝飾** |

### 2.4 對 AI / 站主的可執行 SOP

**「品味培養」不是天賦**，是這個循環：

```
看（SOTD daily / Awwwards daily / Godly / Site Inspire 訂閱）
  ↓
拆（為什麼這樣設計 — 字型 / 配色 / 排版 / 互動）
  ↓
抄（copywork — 找一個案例 1:1 還原它的某個元件）
  ↓
改（在抄的基礎上加自己的變化）
  ↓
形成 reference library（自己的 Notion / Figma board 收藏）
  ↓
（回到「看」）
```

**時間投入**：每日 15–30 分鐘「看 + 拆」就夠，比練樂器划算。

**對 vortex 站主**：vortex 是 08 學術期刊風 — Source Serif 4 / Crimson Pro 已經對應 Swiss + Editorial 趨勢（冷靜中性、可讀性優先）。**不需要追新趨勢**，但要訂閱策展網站「驗證」自己沒飄移。

---

## 3. 設計 heuristics / checklist 體系

> 站主 L5 insight `2026-06-18-redo-vs-reskin.md` 已抽出 33 項 checklist — 那次是「結構 + typography + a11y + 溯源」四維度。本節補 **NN/g 10 heuristics** 作為**通用 usability 維度**（與上次 33 項互補）。

### 3.1 NN/g 10 Usability Heuristics

**權威來源**：Jakob Nielsen, "10 Usability Heuristics for User Interface Design"（1994 + 2020 更新）。URL: https://www.nngroup.com/articles/ten-usability-heuristics/。

| # | Heuristic | 核心命題 | 靜態內容站具體應用 |
|---|-----------|---------|------------------|
| 1 | **Visibility of System Status** | 在合理時間內讓使用者知道系統在幹嘛 | 表單提交顯示成功/失敗、麵包屑標示當前位置、載入中提供視覺提示 |
| 2 | **Match Real World** | 用使用者熟悉的詞彙概念 | 不用「Inquiry Form」用「聯絡我們」、日期用在地格式、房子圖示 = 首頁 |
| 3 | **User Control and Freedom** | 提供緊急出口（取消/反悔） | 搜尋可清除、表單取消、意外離開提示 |
| 4 | **Consistency and Standards** | 同語意同詞彙 | 全站藍色 = 連結、按鈕風格一致、遵守 OS 慣例 |
| 5 | **Error Prevention** | 問題發生前消除 | 刪除前確認、表單欄位限制（電話只接數字）、破壞性按鈕低視覺權重 |
| 6 | **Recognition Rather Than Recall** | 選項可見、減少記憶負擔 | 導覽常駐、搜尋建議、篩選條件即時顯示已選 |
| 7 | **Flexibility and Efficiency** | 新手有引導、專家有快捷鍵 | 鍵盤快捷鍵（`/` 聚焦搜尋）、最近瀏覽、自訂常用連結 |
| 8 | **Aesthetic and Minimalist Design** | 不放無關資訊 | 首頁 hero 只放 CTA、移除裝飾性動效、留白區隔層級 |
| 9 | **Help Recognize/Diagnose/Recover from Errors** | 錯誤訊息白話精確 | 「Email 格式不正確」標示位置、404 頁提供回首頁/搜尋 |
| 10 | **Help and Documentation** | 必要時文件易搜尋 | FAQ + 情境式說明 + 全文搜尋 + 與功能就近連結 |

### 3.2 對 vortex 的具體應用

**vortex 是「靜態內容站 + 大量章節」**，NN/g heuristics 最直接相關：

- **#1 Visibility**：點 master-detail 切換時的視覺反饋（vortex 已有 fade 過場）
- **#2 Match Real World**：連結 label 用「划手分解」不用「Propulsion analysis」
- **#4 Consistency**：`.vx-toc-row` 全站一致（已對）
- **#6 Recognition**：導覽常駐（vortex 已有）
- **#8 Aesthetic Minimalist**：首頁不要 12 個等重入口（**presentation-layout 已有完整提案**）
- **#10 Help**：vortex 沒有 FAQ，但有「L0–L6 概覽」+「水感是什麼」兩頁 — **就是 documentation**

### 3.3 其他 heuristics 體系

| 體系 | 來源 | 維度數 | 適用 |
|------|------|-------|------|
| **NN/g 10 Heuristics** | Nielsen 1994 | 10 | 通用 usability |
| **Awwwards Jury Criteria** | Awwwards | ~6-8 | 視覺設計 + 創意 |
| **IBM Carbon Design Review** | IBM | ~12 | 設計系統 + a11y |
| **Google HEART framework** | Google | 5（Happiness / Engagement / Adoption / Retention / Task success） | 產品指標 |
| **NN/g Attitudinal vs Behavioral** | NN/g | — | 研究方法論 |
| **WCAG POUR** | W3C | 4 原則 + 86 SC | a11y（design-principles-deep-dive 已涵蓋） |

**建議**：vortex 設計 review 採「**NN/g 10 + 上次 33 項 checklist**」 — 共 43 項。

---

## 4. 互動設計 SOP

> 上次 research 提到 vortex 有 transition 但沒完整互動規範。本節給 **motion patterns + duration tokens + reduce motion SOP**。

### 4.1 Material Design 3 Motion Patterns

**權威來源**：Material Design 3 Motion Guidelines（Google）。URL: https://m3.material.io/styles/motion/overview。

**4 種 motion patterns**（material 設計的核心抽象）：

| Pattern | 用途 | 視覺效果 |
|---------|------|---------|
| **Container Transform** | 元素 A 變成元素 B（如 FAB 變成 toolbar） | 形狀變化 + 內容淡入 |
| **Shared Axis** | 兩個 sibling 頁面之間（如 tab 切換） | X/Y/Z 軸滑動 |
| **Fade Through** | 不相關內容切換（如 dialog 進場） | 舊元素 fade out + 新元素 fade in |
| **Fade** | 同層級切換（如 carousel slide） | 純淡入淡出 |

**Duration tokens**（Material 3 標準）：
- **Short** = 200ms（小型 UI 元素）
- **Medium** = 400ms（標準過場）
- **Long** = 500ms（大範圍過場）

**Easing tokens**：
- **Standard** = `cubic-bezier(0.2, 0.0, 0, 1.0)`（對應 ease-out）
- **Decelerate** = `cubic-bezier(0, 0, 0.2, 1)`（進入用）
- **Accelerate** = `cubic-bezier(0.4, 0, 1, 1)`（離開用）

### 4.2 Apple HIG Motion

**權威來源**：Apple Human Interface Guidelines - Motion（URL: https://developer.apple.com/design/human-interface-guidelines/motion）。

**核心命題**：「**動畫應該模擬真實物理**」 — 不是線性運動。

**規範**：
- **Duration**：多數 UI 動畫 **0.2s – 0.5s**
- **Easing**：**ease-in-out** 或 **spring-based**（避免 linear）
- **iOS 預設彈簧**：response ~0.55s、dampingRatio ~0.825

**Reduce Motion 處理**：
- 移除視差（parallax）
- 移除縮放轉場（zoom），改 crossfade / push
- 保留必要的功能性回饋（按鈕點擊高亮）

### 4.3 Material vs Apple 差異

| 面向 | Apple HIG | Material Design |
|------|-----------|----------------|
| 哲學 | 真實物理、彈簧模擬 | 線性 + easing tokens |
| 規範 | 原則性、無硬性 ms | 明確 Duration Tokens（Short/Medium/Long） |
| 轉場模式 | 隱喻為主（cover、flip、zoom） | 模式化（Container Transform 等） |
| 時長 | 依手勢速度彈性 | 固定 token |

**對 vortex 的建議**：
- vortex 是「**內容優先、互動為輔**」 — 不要為互動而互動
- 採 **Material Duration Tokens**（200/400/500ms）— 易記、易落地
- Easing 用 **ease-out**（進入用），**ease-in**（離開用）
- **不要用 spring / 彈簧** — 學術期刊風不適合 playful 動畫
- **必加 `prefers-reduced-motion`** — design-principles §3.3 已列

### 4.4 Micro-interaction 三件式

Dan Saffer「Microinteractions」書（2014）提出 micro-interaction = **Trigger → Rule → Feedback**：

```
Trigger（什麼觸發）
  ↓
Rule（規則是什麼）
  ↓
Feedback（給使用者什麼反饋）
```

**vortex 例子**：
- 點 `.vx-toc-row`（Trigger）→ 切換面板內容（Rule）→ 主面板 fade in + rail active 更新（Feedback）
- 收合 `.vx-level details`（Trigger）→ 內容區收合（Rule）→ summary 圖示 rotate（Feedback）

**當 micro-interaction 缺 Feedback** — 使用者懷疑「按了沒？」，違反 NN/g #1 Visibility。

---

## 5. Usability Testing SOP

**權威來源**：NN/g "Usability Testing 101"（Kara Pernice）。URL: https://www.nngroup.com/articles/usability-testing-101/。

### 5.1 核心 SOP

**參與者數量**：**5 位參與者**即可揭露多數常見問題（單一用戶群體）。

**任務設計**：
- 貼近真實生活情境
- 措辭極為關鍵（小錯誤會誤導或 priming）
- 常請參與者**大聲朗讀**任務確保完整閱讀
- 例：「你的印表機顯示 Error 5200，請清除此錯誤訊息」

**Think-Aloud Protocol**：
- 參與者邊操作邊敘述行動與想法
- 引導員（facilitator）需經訓練，**避免引導性提問**

**結果分析三流程**：
- **Day 1**：規劃研究
- **Day 2**：測試 5 位用戶
- **Day 3**：分析發現 → 重新設計建議

### 5.2 AI 時代的調整

**NN/g 原文未涵蓋 AI**，但 SOP 邏輯可推論：

| 原本 | AI 時代 |
|------|--------|
| 真人 facilitator 主持 | AI agent 扮演參與者（多視角模擬） |
| 5 位真人 | 5 個 sub-agent（每個用不同 persona） |
| 面對面 think-aloud | Agent 寫出「我會怎麼點 + 我期待看到什麼」 |
| 招募 + 場地 + 設備 | 直接派 sub-agent（便宜 100x） |

### 5.3 對 vortex 的應用

**派 5 個 sub-agent 模擬 5 種 vortex 使用者**（參考 entry-wayfinding 的五道牆）：
1. 好奇者 — 還沒決定要不要投入 10 分鐘
2. 學游痛點者 — 帶具體痛（換氣嗆水、腳沉）
3. 家長 — 孩子在學、想知道進度正常嗎
4. 教練 — 完整工具集查詢
5. 中間層選手 — 卡在瓶頸、想知道自己在 L 哪

**每個 sub-agent 任務**：
- 收到具體任務（例：「我想找換氣嗆水怎麼改善，從 vortex-home 開始走」）
- 描述每一步看到什麼、期待什麼、實際看到什麼
- 標出「confusion points」（不懂、卡住、找不到）

**整合**：把 5 個 agent 的 finding 整合成「**confusion points list**」，對應到現有 5 種使用者的痛點。

**這是 AI 時代的 usability testing** — 便宜、可重複、可規模化。**真人測試仍必要**（看真實人類行為），但 AI agent 可先做 80% 的早期篩檢。

---

## 6. AI 設計批評的可執行路徑

> 這次研究的核心產出 — **把上次研究的「弱項」變可執行**。

### 6.1 三條 AI 設計批評路徑

**路徑 1：Vision LLM 看截圖（看設計）**
- Playwright 跑頁面 → 截圖 → Read（Claude vision）
- 能看「這版排起來好不好」「色彩搭配有沒有衝突」「留白夠不夠」
- **侷限**：AI 看截圖 ≠ 人類看設計 — 缺少「在 browser 滾動 + hover + focus」的體驗

**路徑 2：套用 heuristics checklist 自動批評（批評設計）**
- 把 NN/g 10 + Awwwards 6 + WCAG POUR + 上次 33 項 = **~50 項 checklist**
- AI 對每個 prototype 逐項打勾
- **優點**：可重複、客觀、有依據
- **侷限**：checklist 不能涵蓋「整體感覺」

**路徑 3：Multi-agent design critique（多人批評）**
- 派 N 個 sub-agent，各用一個 lens：
  - Agent 1：互動設計（用 Material Motion / Apple HIG 框架）
  - Agent 2：視覺衝擊（用 Awwwards / Typewolf 框架）
  - Agent 3：a11y（用 WCAG + axe-core 框架）
  - Agent 4：內容連貫性（用 NN/g heuristics + Information Scent）
  - Agent 5：受眾適配（用 entry-wayfinding 五道牆）
- 每個 agent 給出 **finding list + severity**
- 主 agent 整合、優先排序

### 6.2 對 vortex prototype 的具體批評 SOP

```
Step 1: Playwright 跑 vortex 首頁 + 3 個內頁 + 手機版
  → 12 張截圖

Step 2: 主 Claude 看截圖（path 1）
  → 整體印象 + 「第一眼哪裡怪」清單

Step 3: 派 5 個 sub-agent（path 3）
  → 互動 / 視覺 / a11y / 內容 / 受眾

Step 4: 每個 sub-agent 套對應 heuristics（path 2）
  → 各自 ~10 項 finding

Step 5: 整合 finding
  → severity 排序 + actionable list

Step 6: 站主 review
  → 真人判斷（AI 看不到的部分）

Step 7: 改 + 再跑一次
  → 迭代
```

### 6.3 與上次研究的關係

| 上次研究給 | 這次研究補 |
|----------|---------|
| Typography 原理（measure / leading / baseline） | **怎麼驗證 typography 對了**（用 vision 看截圖 + checklist） |
| 視覺層級（NN/g 4 維度） | **互動怎麼設計**（Material Motion + Apple HIG） |
| a11y 18 失敗模式 | **a11y 自動批評**（axe-core + sub-agent） |
| GitHub 5 repo 設計邏輯 | **怎麼借**（策展網站方法論 + copywork SOP） |
| 不換皮 33 項 checklist | **可擴充的 50+ 項 review**（NN/g 10 + Awwwards + WCAG） |

---

## 7. 視覺衝擊的拆解法

### 7.1 從策展網站學什麼

**策展網站 = 設計師社群在欣賞什麼的共識**。每日看 1 個，3 個月形成 reference library。

| 策展網站 | 策展邏輯 | 每日時間 |
|---------|---------|---------|
| **Awwwards** SOTD | 業界評審每日選最佳 | 5 分鐘看首屏 + 截圖 |
| **Godly** | 純視覺美學策展（無評分） | 3 分鐘 |
| **Site Inspire** | 編輯設計取向下 | 5 分鐘 |
| **Minimal Gallery** | 極簡美學 | 3 分鐘 |
| **Typewolf SOTD** | Typography 為焦點 | 5 分鐘 |
| **Httpster** | 前衛 / 實驗性 | 5 分鐘 |

**拆解公式**（對每個看到的 SOTD 問 5 個問題）：
1. **字型**：用什麼字型？為什麼這個場景適合？
2. **配色**：主色 / 輔色 / 強調色分別是什麼？色相 / 飽和度 / 亮度怎麼配？
3. **排版**：grid 是幾欄？measure 是多少？leading 是多少？
4. **互動**：有什麼微互動？trigger / rule / feedback 是什麼？
5. **整體**：這個作品想給使用者什麼感覺？達成了嗎？

### 7.2 Typography 趨勢（補充 Typewolf §2.3）

| 趨勢 | 代表 | 適用場景 |
|------|------|---------|
| Swiss 風格復興 | Neue Haas Grotesk / Neue Montreal | 工具類 / 內容類 |
| 編輯襯線 | Editorial Old / Tobias / Arizona Flare | 雜誌 / 出版 / 個人部落格 |
| 當代幾何 | Apercu / GT America | SaaS / 產品站 |
| 古典回歸 | Baskerville / Lyon Display | 奢侈品 / 品牌 |

**vortex 定位**：學術期刊風 → **編輯襯線 + 古典回歸** 路線（Source Serif 4 + Crimson Pro 已對應）。**不追新趨勢**是合理決策。

### 7.3 Editorial Design 跨界靈感

**Editorial Design（編輯設計）**是平面設計對 vortex 最有參考價值的領域：
- 海報 / 雜誌 / 書封的 typography 處理
- 頁碼 / 章節編號的視覺系統（vortex 已用 `vx-toc-num` 24-30px 編號）
- 跨頁的視覺節奏
- 引用塊 / 圖說 / metadata 的版型

**推薦資源**：
- *It's Nice That*（編輯設計社群）
- *Eye Magazine*（平面設計季刊）
- *Print Magazine*
- Behance / Are.na 上的「editorial design」boards

---

## 8. 跨文化 / 跨語言設計 sense

> 上次研究列為「弱項」。本節補 **GOV.UK / GOV.SG 等政府數位服務手冊**作為無商業偏見的標竿。

### 8.1 GOV.UK 設計原則

- **Start with user needs**（從使用者需求開始，不是政府組織圖）
- **Do less**（少做 — 政府不需要行銷）
- **Design with data**（用資料設計）
- **Do the hard work to make it simple**（困難留給政府、簡單留給使用者）
- **Iterate. Then iterate again.**（持續迭代）
- **This is for everyone**（服務所有人 — 包括低視能、慢網速、不熟悉數位的人）
- **Understand context**（理解脈絡 — 使用者在什麼場景用）
- **Build digital services, not websites**（建數位服務，不是網站）
- **Be consistent, not uniform**（一致 ≠ 全部一樣）
- **Make things open: it makes things better**（開放 — 程式碼、研究、資料）

### 8.2 對 vortex 的啟示

- **Start with user needs**：vortex 五道牆研究已做（entry-wayfinding）
- **Do less**：presentation-layout 已提「只砍與重排」
- **Be consistent**：vortex 已有 `.vx-*` 系統
- **This is for everyone**：a11y 必須做（design-principles §4）

**vortex 是「個人知識庫」**，不是「政府服務」 — 但「**公開 + 服務學習者**」的精神對齊。

### 8.3 簡繁排版差異（待研究）

**本輪未直讀原始研究**，列為 §9 開放問題。

---

## 9. 開放問題 / 需站主拍板的取捨

### O1 — AI usability testing 是否要做完整版？

§5.3 提議「派 5 個 sub-agent 模擬 5 種 vortex 使用者」。**要做嗎？**

- (A) 派 5 個 sub-agent 跑一輪，產出 confusion points list（~30 分鐘）
- (B) 等真人測試時機（站主自己測 or 找朋友）
- (C) 先做 a11y audit（axe-core）就好，usability testing 之後

### O2 — multi-agent design critique 的執行頻率

§6.1 提議的 5-agent critique SOP，**每次 prototype 都跑嗎？**

- (A) 每次 prototype 跑（耗 token + 時間）
- (B) 重大 prototype 才跑（commit 前）
- (C) 跑一次 SOP 範本出來，之後由其他 agent 套用

### O3 — design craft 教育的時間投入

§2.4 提議「**每日 15–30 分鐘**看策展網站」。**站主願意嗎？**

- (A) 願意，自己跑
- (B) 願意，但希望 AI 每日摘要推送（用 cron + TG bot）
- (C) 不願意 — 沒時間，AI 自己消化

### O4 — 簡繁排版 / 跨文化 typography 研究

§8.3 列為「未直讀原始研究」。**要不要再跑一輪**？

- (A) 跑 — 找「中文文案排版指南」「文字組版処理の要件」等
- (B) 不跑 — vortex 已是繁中，跨文化不急
- (C) 之後 vortex 開放簡中版再跑

### O5 — Awwwards / Material / Apple 原始文件的深讀

本次 WebFetch 拿到的 Material / Awwwards / Apple 都是目錄層級，**實際內容要讀子頁面**。**要不要再跑一輪深讀**？

- (A) 跑 — Material 4 motion patterns 細節 / Apple HIG motion 子頁 / Awwwards jury criteria
- (B) 不跑 — 已有足夠 SOP 框架
- (C) 之後做具體互動時再讀

---

## 10. 對站主的可執行 SOP（總結）

### 10.1 「做好網站」完整框架（兩份研究合體）

```
設計原理（design-principles-deep-dive）
  ├─ Typography（measure / leading / baseline / modular scale）
  ├─ 視覺層級（NN/g 4 維度 / F-pattern / layer-cake）
  ├─ a11y（WCAG POUR + 18 失敗模式）
  ├─ 互動細節（hover / focus / transition / prefers-reduced-motion）
  └─ GitHub 5 repo 設計邏輯

設計 craft（design-craft-meta-research，本檔）
  ├─ 品味可學（Typewolf 資料驅動 + 每日 15-30 分鐘策展看）
  ├─ Heuristics 體系（NN/g 10 + Awwwards + WCAG）
  ├─ 互動設計 SOP（Material Motion + Apple HIG + duration tokens）
  ├─ Usability Testing SOP（5 位參與者 + AI agent 模擬）
  ├─ AI 設計批評（vision LLM + multi-agent + checklist）
  └─ 視覺衝擊（策展網站方法論 + typography 趨勢）
```

### 10.2 站主立即可做（10 分鐘以內）

1. **訂閱 1 個策展網站**（Typewolf / Awwwards / Godly）— 每日 5 分鐘
2. **設 axe-core CLI** — 隨時可跑 a11y audit
3. **設 PageSpeed Insights** — 每月一次 baseline

### 10.3 站主每週可做（30 分鐘）

1. **看 5 個 SOTD + 拆解**（字型 / 配色 / 排版 / 互動 / 整體）
2. **跑一次 vortex a11y audit** — 紀錄 failing rules
3. **檢查 5 個 vortext 頁面的 viewport** — reflow / CLS / LCP

### 10.4 AI 立即可做（站主授權後）

1. **跑 5-agent usability testing on vortex** — confusion points list
2. **派 multi-agent design critique on vortex prototype** — 5 lens
3. **設 design-craft daily digest cron** — 每日推送 1 個 SOTD 拆解

### 10.5 不變的底線（重申）

- AI 的「品味」是**統計上的頂尖作品分布**，不是個人審美
- 站主審查是閉環關鍵 — AI 自己看不到自己排版的好壞
- 換皮 ≠ 重做 — 上次研究的 33 項 checklist 仍是 baseline

---

## 11. 引用清單（供核對）

### Primary（已 fetch 並直讀或部分直讀）

1. **NN/g — "10 Usability Heuristics for User Interface Design"**
   URL: https://www.nngroup.com/articles/ten-usability-heuristics/
   （10 條 heuristics + 對靜態站的具體應用 — 已直讀完整）

2. **NN/g — "Usability Testing 101"**
   URL: https://www.nngroup.com/articles/usability-testing-101/
   （5 位參與者法 + think-aloud + 3 天流程 — 已直讀完整）

3. **Typewolf — Web Typography**
   URL: https://www.typewolf.com/
   （資料驅動判斷非品味 + 2024-2026 trends + Flawless Typography Checklist — 已直讀方法論部分）

4. **Material Design 3 — Motion**
   URL: https://m3.material.io/styles/motion/overview
   （**僅拿到標題**，4 motion patterns + duration tokens 來自通用知識 + 二手整理）

5. **Apple HIG — Motion**
   URL: https://developer.apple.com/design/human-interface-guidelines/motion
   （**WebFetch 沒拿到內文**，duration / spring / reduce motion 來自通用知識，明確標「不是引用」）

6. **Awwwards**
   URL: https://www.awwwards.com/
   （**僅拿到首頁結構**，jury criteria 未直讀，列為 §9 O5 開放問題）

### 二手整理（未直讀原文，標於 §12）

7. **Dan Saffer — "Microinteractions"**（2014）
   Trigger → Rule → Feedback 三件式 — 通用知識，未直讀

### 站主既有研究 / 上次研究（不重複）

- `~/projects/cortex/research/vortex-rebuild/research-log.md`（網站形狀）
- `~/projects/cortex/research/entry-wayfinding-study.md`（IA）
- `~/projects/cortex/research/presentation-layout-study.md`（視覺層級）
- `~/projects/cortex/research/vortex-rebuild/design-principles-deep-dive.md`（原理層）
- `~/projects/cortex/research/vortex-rebuild/non-reskin-checklist.md`（33 項 checklist）

---

## 12. 未能查證清單（自我批判）

> 本研究的誠實清單。

1. **Material Design 3 motion 內文**：WebFetch 只拿到標題，4 motion patterns + duration tokens 來自通用知識 + Material 2 時代的記憶。歸類：未直視原始文獻。
2. **Apple HIG Motion 內文**：WebFetch 完全沒拿到內文。Spring 參數 0.55s / 0.825 來自通用 iOS HIG 知識，明確標「**不是引用**」。歸類：未直視原始文獻。
3. **Awwwards jury criteria**：WebFetch 沒拿到評審維度說明。SOTD 評分（如 Indigo Laboratory 7.33/10）來自首頁實測，**評審如何給分未直讀**。歸類：未直視原始文獻。
4. **WebSearch API 400**：「design taste how to develop web designer education practice」查詢失敗（API error），未補 query retry。
5. **簡繁排版差異**：§8.3 列為「未直讀原始研究」。中文文案排版指南（日文 / 簡中 / 繁中）未本輪 fetch。
6. **Dan Saffer Microinteractions**：Trigger → Rule → Feedback 三件式是書的標準框架，**未直讀原書確認細節**。
7. **IBM Carbon Design Review 細節**：列為參考體系但未 fetch 任何子頁。
8. **Google HEART framework**：列為參考但未 fetch。
9. **AI 時代 usability testing 細節**：NN/g 原文未涵蓋 AI agent 模擬，§5.2 的「sub-agent 模擬 5 種使用者」是基於 SOP 邏輯的推論，**未經過任何研究證實**。
10. **Typewolf「Flawless Typography Checklist」內容**：WebFetch 拿到 Typewolf 提到此 checklist 存在，**但未抓到 checklist 實際內容**。

---

## 終止

> 本研究補完上次 design-principles-deep-dive 的「**怎麼做**」 — 上次給原理、這次給 SOP。兩份合起來 = vortex 重做時的完整設計決策框架（原理 + 實作）。
>
> 待站主拍板 §9 開放問題後，可進入：
> 1. AI usability testing on vortex（5 sub-agent）
> 2. multi-agent design critique on vortex prototype
> 3. design-craft daily digest cron（每日推送 SOTD 拆解）
> 4. Material / Apple / Awwwards 子頁深讀（如站主覺得有需要）
> 5. 簡繁 / 跨文化 typography 深讀（如未來要開簡中版）
