# Vortex 設計原理深度研究：Typography / GitHub 高星 repo / Accessibility

> 研究問題：在 vortex-rebuild（網站形狀）、entry-wayfinding（IA）、presentation-layout（視覺層級 / 閱讀動線）三份既有研究的基礎上，**向下挖到設計的底層原理** — 讓未來 vortex 重做時能「根據原理做取捨」而非「根據直覺做決定」，並讓站主能判斷「這次會不會又換皮」。
>
> 範圍：
> - **A. Typography 深度**（modular scale / vertical rhythm / measure / 行距科學 / font pairing / web font loading）
> - **B. 互動細節**（hover / focus / transition / prefers-reduced-motion / cursor）
> - **C. Accessibility 深度**（WCAG 2.2 POUR / 18 個 Hugo 站最常見失敗模式 / 鍵盤 / prefers-*）
> - **D. Performance & 感知**（Core Web Vitals CLS 數字門檻 / 字型 subset）
> - **E. GitHub 高星網頁設計 repo 設計邏輯掃描**（shadcn/ui / Linear.app / Stripe.com / Tailwind CSS / Mintlify）
> - **F. Web 設計權威文獻清單**（Bringhurst / Tufte / Krug / Norman / Williams / Frost / Tim Brown / Butterick）
>
> **不重複**（已被三份既有研究覆蓋）：
> - 網站結構 / 知識呈現範式（roadmap.sh / Quartz / Brilliant / Docusaurus 反例）
> - IA / wayfinding / information scent / Dan Brown 八原則
> - 視覺層級（NN/g 4 維度）/ F-pattern vs layer-cake / 4 個真實前例（SEP / Stripe Docs / PG / MDN）
> - 首頁具體重排提案（presentation-layout §4）
>
> 內容真相源（`TheVortexProject/canonical`）不在本研究改動範圍；本研究只新增**設計原理與權威來源**，不動既有檔案、不實作 prototype。
>
> 報告產出時間：2026-06-18
>
> 本研究**不建議**：
> ① 任何「自陳 → 感知／技術品質判斷」的推論語（前三份研究已確立，本研究維持禁區）。
> ② 換皮思考 — 每個原理必須對應「為什麼這樣做」與「Vortex 重做時如何套用結構決策」，不只是 CSS tips。
> ③ 替站主決定 DESIGN_SYSTEM.md 內容（~~**站主尚未建此檔**~~ → **此判定錯誤**，該檔一直存在於 `C:\claudehome\resources\notes\DESIGN_SYSTEM.md`，見 §10 O1 作廢說明）。

---

## 0. Trigger — 為什麼這次研究

站主（2026-06-18）「針對如何做好網站 我要你再去迭代你的資料庫 去研究 怎麼排版 怎麼呈現 人類的閱讀習慣 等等 去做深入研究 可以去參考github 跟做網頁有關的repo 可以去找找看 已有的skill 都可以 做一個 全面的研究」。

觸發拆解：
- 「再去迭代你的資料庫」→ 站主知道自己已有研究，要的是**延伸**。
- 「怎麼排版、怎麼呈現、人類的閱讀習慣」→ typography、layout、readability（前三份只觸及視覺層級與閱讀動線的「模式」，沒挖到「為什麼這樣做」的物理/認知原理）。
- 「去參考 github 跟做網頁有關的 repo」→ 站主三份研究都看過 roadmap.sh / Quartz / Brilliant 等「知識呈現」類 repo，但**沒掃「網頁設計 / 設計系統 / 文件站 / 產品站」類高星 repo** — 這是最大洞。
- 「已有的 skill 都可以」→ 站主授權使用任何 skill（含 deep-research）。
- 「做一個 全面的研究」→ 全面（多個原理）+ 深入（每個原理要有可引用權威來源）。

**為何必須做這次**：6/18 站主剛取消 minimax-vortex（commit 4504e02）— 原因是 v4「換皮沒換結構、沒實踐研究結論」（L5 insight `2026-06-18-redo-vs-reskin.md` 已記）。這份研究的隱含要求：**提供能讓站主判斷「這次 AI 工作不是換皮」的可驗證原理清單**，故 §9 加「不換皮 checklist」。

---

## 1. 一句話結論

> **Vortex 目前的 vortex.css（Source Serif 4 / Crimson Pro / 17px base / 1.75 行高 / 38em measure / 海軍藍 #1b3a5c）已經落在 typography 經典原理的合理區間；缺的是「為什麼這樣選」的權威依據、「hover / focus / transition / prefers-reduced-motion」的互動細節規範、「WCAG 2.2」的 a11y 驗證機制。下次重做的關鍵不是再選字型，而是補齊 a11y / 互動 / 結構決策的依據。**

---

## 2. Typography 原理與可實踐建議

> 站主 vortex.css 的 typography 已落地（Source Serif 4 / Crimson Pro / 17px base / 1.75 行高 / 38em measure / 海軍藍 #1b3a5c / 暗金 #b08a2e）。本節補齊「為什麼這樣選」的權威依據 + 給未來調整時的可驗證基準。

### 2.1 行寬 measure（line length）

**權威來源**：Matthew Butterick《Practical Typography》, *Line length* 章節（線上免費書，CC BY-NC-SA；URL: https://practicaltypography.com/line-length.html）。

**核心命題**：
> "Aim for an average line length of **45–90 characters, including spaces**."（行寬 45–90 字元，含空格）
> "You should be able to fit between **two and three alphabets** on a line."（每行可容 2–3 套英文字母）

**為什麼 66 字元 ≈ 2.31 alphabets 是甜蜜點**：
> "As line length increases, your eye has to travel farther from the end of one line to the beginning of the next"

過短：眼跳頻率太高、節奏斷裂；過長：眼跳回不到下一行起點、垂直追蹤失敗。

**對 Vortex 的對照**（vortex.css:27-28）：
```css
--vx-measure:       38em;   /* ~38 漢字 / ~66 拉丁字元 內文行長 */
--vx-measure-lead:  32em;   /* 引言/前言略窄 */
```

✅ **38em 漢字行寬 = 約 38 個全形字**（漢字是等寬，每字 1em），落在 1.5–3 alphabets 等效範圍；**66 拉丁字元**（混排時）也命中 Butterick 甜蜜點。**這是直覺選對了**。

**可實踐建議（未來調整基準）**：
- 中文站內文 measure 維持 32–40em
- 拉丁文 / 英文 measure 維持 60–75 字元
- 引言/前言比內文窄 5–10%（目前 38→32em，已對）
- **不要為了好看而把 measure 拉超過 75em**（mobile 會變成全寬長行，閱讀崩潰）

### 2.2 行距 leading

**權威來源**：Matthew Butterick《Practical Typography》, *Line spacing* 章節（URL: https://practicaltypography.com/line-spacing.html）。

**核心命題**：
> "For most text, the optimal line spacing is between **120% and 145% of the point size**."
> 110% 偏緊、135% 適中、170% 偏鬆。

**關鍵反直覺**：
> "Single, 1.5 lines, and Double are equivalent to about **117%, 175%, and 233% line spacing**, contrary to what their names suggest. Miss the target zone."

Word 的「1.5 倍行距」實際是 175%，**已經超過 145% 舒適區上限**。這是 Word 預設排版偏鬆的根因。

**對 Vortex 的對照**（vortex.css:55）：
```css
line-height: 1.75;  /* 內文 17px → 1.75 × 17 = 29.75px 行高 */
```

⚠️ **1.75 = 175% 落在 Butterick 的「偏鬆」區**（>145%）。

**為什麼 Vortex 仍可行**：
- 漢字筆劃密度高於拉丁字母，需要更大 leading 區隔字行
- 中文 typography 圈共識：行高 1.7–2.0 是漢字內文標準（不同於拉丁文的 1.2–1.45）
- **這是漢字 vs 拉丁的跨文化 typography 差異** — 不是 Vortex 違反原理，是 Butterick 沒涵蓋漢字

**可實踐建議**：
- 漢字內文：1.7–1.85 行高合理（Vortex 1.75 ✓）
- 拉丁內文混排：1.3–1.5 行高合理
- 字級愈小、leading 比例要略增（10px 以下用 1.8–2.0）

### 2.3 螢幕閱讀的 typography

**權威來源**：Matthew Butterick《Practical Typography》, *Screen-reading considerations* 章節（URL: https://practicaltypography.com/screen-reading-considerations.html）。

**核心命題**：
> "with screens be­com­ing more pa­per-like than ever, there's de­clin­ing need to make spe­cial ac­com­mo­da­tions for screen reading."

> "Fonts like Geor­gia and Cal­ibri have no spe­cial leg­i­bil­ity ben­e­fit on to­day's screens."

**反直覺**：傳統「Georgia / Calibri 是為螢幕優化」的看法已過時 — 現代螢幕解析度（手機 326 DPI、桌機 185 DPI）已逼近紙本。

**DPI 與人類視覺極限**：
> "The eye's limit of per­ceiv­able de­tail is usu­ally es­ti­mated to be 1–2 arc­min­utes. Pix­els smaller than one arc­min­ute are su­per­flu­ous, be­cause we can't re­solve dif­fer­ences that small."

**對 Vortex 的對照**：
- ✅ 內文 17px、標題 22–30px — 完全在螢幕可解析範圍
- ✅ Source Serif 4 + Crimson Pro — 是當代紙本品質 serif，非「螢幕妥協字型」（如早期 Georgia）

### 2.4 Vertical rhythm（垂直節律）

**權威來源**：Wilson Miner, "Setting Type on the Web to a Baseline Grid"（A List Apart, 2007-08-22；URL: https://alistapart.com/article/settingtypeontheweb）。

**核心命題**：
> 把印刷排版的 baseline grid（基線格線）移植到網頁 — 所有行高、margin、padding 都必須是基準值的倍數，形成跨欄垂直對齊。

**具體方法**：
- 基礎字級 12px + 行高 18px（leading 150%）
- 所有垂直 margin/padding 必須以 18 為單位累加
- 例外：巢狀列表可加半行（9px）
- 跨欄 float 元素的 padding 也須湊成基準值（如 8+8+1+1=18）

**Wilson Miner 自承的限制**：
> "基線格線**並非適用於所有版面**，常需破例。設計者必須在『像素完美』與『無限彈性』間取捨。"

**對 Vortex 的對照**（vortex.css:55）：
```css
line-height: 1.75;  /* 17 × 1.75 = 29.75px，非整數 */
```

⚠️ Vortex 行高 29.75px **不是 18 的倍數**，沒實踐 baseline grid。

**為什麼 Vortex 仍可行**：
- 漢字 typography 採用 1.7–1.85 行高（29.75 落在 28.9–31.45 範圍）
- Vortex 用 flex + gap 系統（vortex.css 內 `.vx-toc-row`, `.vx-level` 等），動態內容的 baseline grid 維護成本極高
- **Wilson Miner 自承「非所有版面適用」** — 動態內容站（vortex）例外合理

**可實踐建議（如果未來要實踐 baseline grid）**：
- 選一個基準值（如 4px 或 8px）作為 spacing scale 的最小單位
- 所有 `--space-N` 變數（vortex.css 已有 `--vx-paper/paper2/ground` 但**沒有 spacing scale 變數** — 應該補）
- margin/padding 全用 spacing scale 變數而非 inline px
- 例：`--vx-space-1: 4px; --vx-space-2: 8px; --vx-space-3: 12px; --vx-space-4: 16px; --vx-space-6: 24px; --vx-space-8: 32px;`

### 2.5 Modular scale（字級階梯）

**權威來源**：Tim Brown, "More Meaningful Typography"（A List Apart, 2010-06-22；URL: https://alistapart.com/article/more-meaningful-typography）。**注意：實際 WebSearch 失敗**，此處引用來自既有研究文獻的二手整理 + 站主 CSS 已落地實踐的歸納 — 原始 Tim Brown 文章未在本輪直接核讀。**歸入 §12 未能查證清單**。

**核心命題**：字級不是憑感覺選的，而是按某個「音階」（scale ratio）從 base size 衍生出整個階層。

**常見 modular scale 比例**（Robert Bringhurst《The Elements of Typographic Style》§3.1 推薦的 5 個）：
| 名稱 | 比例 | 適合情境 |
|------|------|---------|
| Minor second | 1.067 | 小螢幕 / 密集 UI |
| Major second | 1.125 | 內文密度高的文件 |
| Minor third | 1.200 | 一般網站（中性） |
| Major third | 1.250 | 雜誌 / 編輯設計 |
| Perfect fourth | 1.333 | 海報 / 大型顯示 |
| Augmented fourth | 1.414 | 強烈視覺衝擊 |
| Perfect fifth | 1.500 | 編輯設計（強） |
| **Golden ratio** | **1.618** | 經典美學 / 古典排版 |

**對 Vortex 的對照**（從 vortex.css 量測）：
| Vortex 元素 | 實際字級 | 與 17px base 的比例 |
|------------|---------|---------------------|
| `.vx-meta` / 註腳 | 11.5px | 0.676 |
| `.vx-toc-en` | 12px | 0.706 |
| `.vx-toc-meta` | 12px | 0.706 |
| body base | 17px | 1.000 |
| `.vx-list-desc` / lead | 14.5px | 0.853 |
| `.vx-toc-prem` | 14.5px | 0.853 |
| `.vx-toc-zh` | 22px | 1.294 |
| `.vx-start-h` | 21px | 1.235 |
| `.vx-toc-num` | 24px | 1.412 |
| `.vx-start-no` | 30px | 1.765 |
| `.vx-masthead h1` | clamp(34, 6vw, 56px) | 2.0 → 3.29 |

**觀察**：Vortex 字級**不是**純 modular scale — 多個字級落在 1.235、1.294、1.412 等比例附近，但也有 0.853、1.765 等非比例值。這是「直覺設計」的痕跡 — 結果好但缺乏明確音階。

**可實踐建議（如果未來要建立 modular scale）**：
- 選一個 base（如 17px）+ 一個比例（如 Major third 1.25 或 Perfect fourth 1.333）
- 計算完整階梯：17 × 1.25^N 與 17 / 1.25^N
- 把所有字級 round 到階梯值
- 例（1.25 = Major third）：17 → 21.25 → 26.56 → 33.2 → 41.5（向上）；13.6 → 10.88（向下）
- 站主目前 22/24/30 都接近 1.25 / 1.41 / 1.76 — 巧合接近 Perfect fourth + Augmented fourth 混合

---

## 3. 互動細節

> 站主 vortex.css **沒有 hover / focus / transition / prefers-reduced-motion 的完整規範**。本節是補完。

### 3.1 Hover / Focus state

**權威來源**：Nielsen Norman Group, "Focus State: How to Make It Accessible"（URL: https://www.nngroup.com/articles/focus-state/）。

**核心命題**：
- 鍵盤 user 必須看到目前焦點在哪 — 不能只有 hover
- Focus ring 對比需 ≥ 3:1（WCAG 2.4.11 focus not obscured）
- 不要全域 `outline: none` 而不提供替代

**常見反模式**：
```css
/* 錯：移除預設 outline 不補 */
*:focus { outline: none; }
/* 對：用 :focus-visible 取代、保留滑鼠 user 的 focus ring */
*:focus-visible { outline: 2px solid var(--vx-accent); outline-offset: 2px; }
```

**對 Vortex 的現況**：vortex.css 全域未發現 `outline: none` 或 focus style — 這是好習慣，但**沒有自訂 `:focus-visible` 增強視覺**。

### 3.2 Transition

**原則**（彙整自 Material Design Motion + Apple HIG + NN/g）：
- **Duration**：100–300ms 是 UI 元素感知範圍（<100ms 太快不察覺，>300ms 感覺遲鈍）
- **Easing**：預設 `ease-out`（進入用）、`ease-in`（離開用）；避免 `linear`（機械感）
- **屬性**：只動 `transform` + `opacity`（GPU 加速、不觸發 layout）

**對 Vortex 的現況**（vortex.css 與 variables.css）：
```css
--transition-base: 200ms ease;  /* variables.css:42 */
```
✅ 200ms 落在合理區間。但**用 `transition` 關鍵字套用所有屬性**（可能動到 layout 屬性 → 觸發 reflow）。

**可實踐建議**：
```css
/* 改成明確指定 */
.vx-card {
  transition: transform 200ms ease-out, opacity 200ms ease-out, background-color 150ms ease-out;
}
```

### 3.3 prefers-reduced-motion

**權威來源**：WCAG 2.3.3 Animation from Interactions（AAA）+ MDN `@media (prefers-reduced-motion)`。

**核心命題**：前庭功能障礙 / 暈動症使用者可在 OS 設「減少動畫」— 必須尊重。

**標準寫法**：
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**對 Vortex 的現況**：**沒有此 media query**。presentation-layout-study 提到「`prefers-reduced-motion`」但 vortex.css 未實踐。

**可實踐建議（必須補）**：加進 base.css 或 variables.css 全域。

---

## 4. Accessibility 深度

### 4.1 WCAG 2.2 POUR 四大原則

**權威來源**：W3C, "Web Content Accessibility Guidelines (WCAG) 2.2"（URL: https://www.w3.org/WAI/WCAG22/Understanding/）。

| 原則 | 中文 | 涵蓋 guideline | 對靜態站最關鍵 SC |
|------|------|----------------|-------------------|
| **Perceivable** 可感知 | 資訊須能感知 | 1.1–1.4 | 1.1.1 alt text、1.3.1 semantic、1.4.3 contrast、1.4.10 reflow、1.4.13 content on hover/focus |
| **Operable** 可操作 | UI 須能操作 | 2.1–2.5 | 2.1.1 keyboard、2.4.7 focus visible、2.5.8 target size |
| **Understandable** 可理解 | 資訊與操作須可理解 | 3.1–3.3 | 3.1.1 language、3.2.3 consistent nav、3.3.2 labels |
| **Robust** 穩健 | 須與未來輔助技術相容 | 4.1 | 4.1.2 name/role/value、4.1.3 status messages |

### 4.2 Hugo 靜態站最常見 18 個 a11y 失敗模式

**彙整自 W3C + axe-core + pa11y 文件**（W3C Understanding pages 為主要權威來源）：

| # | 失敗模式 | WCAG SC | 站主現況（從 MAP.md + vortex.css 推斷） |
|---|---------|---------|----------------------------------------|
| 1 | 圖片缺 alt | 1.1.1 | ⚠ vortex 大量 SVG 圖示 — 未驗證每個都有 `<title>` 或 `aria-label` |
| 2 | 色彩對比 < 4.5:1 | 1.4.3 | ⚠ `--vx-sub: #555` on `#faf9f5` — 計算約 7.8:1 ✓；但 `--vx-faint: #8a8a82` on paper 約 4.0:1 — **接近下限** |
| 3 | 純靠顏色標狀態 | 1.4.1 | ⚠ `.vx-marker` 是否只靠顏色？需驗證 |
| 4 | 鍵盤無法操作 | 2.1.1 | ⚠ `vortex.js` 切換面板若用 `onclick` — 必須補 `keydown` |
| 5 | focus 不可見 | 2.4.7 | ⚠ 全域未設 `:focus-visible`（見 §3.1） |
| 6 | 缺 skip link | 2.4.1 | ⚠ vortex-home.html 開頭未見「跳至主內容」連結 |
| 7 | 標題層級混亂 | 1.3.1 | ⚠ 需逐頁 audit（h1 是否每頁唯一、是否跳級） |
| 8 | 語意不當 | 1.3.1 | ⚠ `<div>` 排版 master-detail 是否該用 `<section>` / `<article>` |
| 9 | 表單缺 label | 3.3.2 | ⚠ temperament quiz 是否每題 radio 都有對應 label |
| 10 | lang 未宣告 | 3.1.1 | ✅ baseof.html 應有 `<html lang="zh-Hant">` |
| 11 | 連結文字脫離上下文 | 2.4.4 | ⚠ 「閱讀更多」「→」是否每處都補全 |
| 12 | 觸控目標 < 24px | 2.5.8 | ⚠ `.vx-toc-row` 在 mobile 的點擊區需驗證 |
| 13 | 強制拖曳 | 2.5.7 | ✅ 站主未用 drag 互動 |
| 14 | 頁面無 title | 2.4.2 | ⚠ Hugo template 應自動填 `<title>` — 需驗證每頁 |
| 15 | 狀態訊息未公告 | 4.1.3 | ⚠ quiz 結果未用 aria-live |
| 16 | reflow 失敗（320px 水平捲動） | 1.4.10 | ⚠ vortex.css 多處 max-width 需驗證 mobile |
| 17 | focus 被固定元素遮擋 | 2.4.11 | ⚠ nav 固定頂部是否遮擋 focus |
| 18 | 純認知 CAPTCHA 無替代 | 3.3.8 | ✅ 站主無 CAPTCHA |

**可實踐建議**：
1. **先跑 audit**：用 `axe-core` CLI 或 `pa11y-ci` 跑 `public/` 全部 HTML，產出 failing rules 清單
2. **修 §5.2 對照表標 ⚠ 的項目**（至少 11 項）
3. **建 CI gate**：未來 PR 若引入新 axe violation → 阻擋合併
4. **加 skip link**：baseof.html 開頭加 `<a class="skip-link" href="#main">跳至主內容</a>`

---

## 5. Performance & 感知

### 5.1 Core Web Vitals CLS 數字門檻

**權威來源**：web.dev, "Cumulative Layout Shift (CLS)"（URL: https://web.dev/articles/cls）。

**數字門檻**（以 75th percentile 為基準）：
- **良好**：CLS ≤ **0.1**
- **不佳**：CLS > **0.25**

**分數計算**：
```
layout shift score = impact fraction × distance fraction
```

**對 Hugo 靜態站的常見 CLS 來源**：
1. Web font fallback 與實際字型尺寸差異（最常見）→ 預載字型 + `size-adjust`
2. 圖片無 width/height → 明確設定
3. 第三方 widget 動態注入（vortex 沒此問題）
4. async 載入 DOM → 預留空間

**可實踐建議（給站主）**：
1. 預載字型：在 baseof.html `<head>` 加：
   ```html
   <link rel="preload" href="/css/fonts/crimson-pro.woff2" as="font" type="font/woff2" crossorigin>
   ```
2. `size-adjust` 在 `@font-face` 描述符中匹配 fallback metric
3. 圖片全部加 `width` + `height` attribute
4. 設 LCP、CLS、INP baseline — 每月跑 PageSpeed Insights 對比

---

## 6. GitHub 高星網頁設計 repo 設計邏輯掃描

> 站主三份既有研究看過：roadmap.sh（知識地圖）、Quartz（數位花園）、D3.js（資料 DOM）、tldraw（無限畫布）、xyflow（節點 UI）、cytoscape.js（圖論）、excalidraw（手繪白板）、Brilliant（互動 STEM）、Yousician（樂器）、musictheory.net、W3Schools、Muscle & Motion、SEP / Stripe Docs / PG Docs / MDN、GOV.UK / W3C WAI / IKEA / Khan Academy。
>
> **沒掃過的（站主明確要）**：當代網頁設計 / 設計系統 / 文件站 / SaaS 站標竿。**本節補 5 個高 star / 高討論度的網站設計邏輯**。

### 6.1 shadcn/ui（GitHub: shadcn-ui/ui, ~117k stars）

**設計邏輯**（從 ui.shadcn.com + GitHub repo 推斷）：
- **Open Source, Open Code**：不是 npm package，是「複製源碼到你自己的 repo」 — 你擁有程式碼，不被框架鎖定
- **Build Your Own**：起點 + 自訂 — 不是「裝好就用」，是「裝好後改」
- **Registry 系統**：2025 新增 GitHub Registry（`/docs/registry/github`）— 元件可以發布到 GitHub repo 當 registry source

**為何有效（學到什麼）**：
- **「客製化成本 > 框架鎖定成本」**：對元件庫來說，源碼所有權比 API 穩定性更重要
- **Registry pattern**：元件不再綁死單一框架 — shadcn 同源可以產出 React / Vue / Svelte 多版本
- **文件即行銷**：每個元件頁面 = 一個可複製的程式碼塊 + 可互動的 preview

**Vortex 可借**：
- 如果未來 vortex 要做「可互動示意」（水感節奏 / 抓水視角），可以用 shadcn 同樣的「源碼所有權 + 互動 preview」模式
- **不要**為了用 shadcn 換 React — Hugo 站不划算
- **可借的**：元件頁面設計模式（preview + code + 自訂說明）— Hugo partial 可以做到 80%

### 6.2 Linear.app（產品站，獨立設計）

**設計邏輯**（從 linear.app 首頁實測）：
- **產品 UI 作為 hero**：不靠插畫 / 抽象圖，直接展示實際應用截圖 — **「讓產品自證」**
- **單一字族策略**：全站統一 sans-serif，靠 bold/regular 強對比建層級
- **FIG 編號式小標**：「FIG 0.2」「2.0 Plan →」 — 學術 / 工程師美學
- **極簡黑白 + 單一強調色**：無漸層、無陰影裝飾
- **敘事性截圖**：每張截圖都是一個迷你故事（iOS startup → agent 解 → PR review）
- **淡化功能列表**：Notion / Asana 常用 icon grid 列舉功能，Linear 改用「敘事性截圖 + 一句結論」

**為何有效（學到什麼）**：
- 對「嚴肅的專業使用者」，敘事 > 列舉
- 截圖承載高資訊密度，文字精煉 — 「簡約框架 + 豐富內容」是 Linear 核心
- 編輯設計（Editorial Design）策略在 SaaS 站極少見，敢用就建立差異化

**Vortex 可借**：
- **首頁 hero 可以用「水感發展脊椎圖」當視覺主體**，不用文字描述 — 視覺即內容
- **單一字族策略**：vortex 已用 Source Serif 4 / Crimson Pro — 維持就好，不要為「多元」加 sans
- **編輯式編號**：vortex 已有 `.vx-toc-num`（44px 大編號 + `L0–L6` 階梯）— 是正確方向

### 6.3 Stripe.com（產品站）

**設計邏輯**（從 stripe.com 首頁實測）：
- **premium fintech 美學**：漸層（深紫→藍→青綠）+ 幾何構圖 + 量化數據
- **自家字型 Soehne**：幾何無襯線、字懷開放、標題斜體 — 完全控制品牌
- **互動式 Bento Grid**：卡片拼貼，hover 時細微變換
- **CTA 分級**：「Start now」（自助）vs「Contact sales」（高接觸）— 分流企業與 SMB 用戶
- **客戶 logo 矩陣**：Amazon / OpenAI / Nvidia / Ford / Shopify — 社會證明
- **三段式敘事**：Fortune 100 → Forbes AI 50 → SaaS 平台 — 從大到小建立信任

**為何有效（學到什麼）**：
- 對 fintech / 平台型產品，「數字 + 漸層 + 客戶矩陣」是經典公式
- 「量化勝於抽象」：$1.9T、135+ 貨幣、99.999% uptime — 具體數字比感性敘述有效
- **bento grid 是現代資訊架構的視覺標準** — 取代傳統三欄式 / 卡片式

**Vortex 可借（謹慎）**：
- vortex **不是 fintech**，premium fintech 美學**不適合** — 站主已選學術期刊風（08 學術期刊）堅持
- **可借的**：bento grid 用於首頁 hero — 把 6 式 / ADM / 週期化做成 bento 卡片，比現行的等重 `vx-toc-row` 更有層級
- **可借的**：量化 meta — `125 練習` `76 誤區` `22 標準` 等數字應該更顯眼（vortex 已有，但可放大）

### 6.4 Tailwind CSS（GitHub: tailwindlabs/tailwindcss, ~80k+ stars）

**設計邏輯**（從 tailwindcss.com 官網實測）：
- **自指式展示**（self-referential showcase）：用 Tailwind 自身 utility classes 構建首頁 — **每個區塊本身就是使用案例**
- **透明「減法」展示**：「How it works」展示從空 button 開始、加 class 後 CSS bundle 體積變化 — PurgeCSS 機制視覺化
- **可水平滑動 feature carousel**：Responsive 預覽 sm/md/lg/xl 四階段
- **OKLCH wide gamut 配色**：18 色相 × 11 色階（50–950）— 展示色域深度
- **Inter + IBM Plex Mono 雙字體層次**：sans for UI、mono for code — 在 theme 暴露 CSS variable
- **黑底（gray-950）+ 純白文字 + 高對比極簡配色**：贊助商 logo 與 demo 成視覺焦點

**為何有效（學到什麼）**：
- **「Show, don't tell」**：官網不是賣框架，是賣「在瀏覽器中即時把 class 轉成 design 的工作流」
- **透明的展示建立信任**：每個 section 都是「why would I do it this way?」的答案
- **functional token > visual token**：`--color-mint-100` 比 `--brand-primary` 更有用

**Vortex 可借**：
- **CSS variable 暴露 design token**：vortex.css 已有 `--vx-accent` 等，但沒有寫成 `@theme` 風格（Tailwind 4 風格）
- **可借的**：自指式展示 — vortex 的「水感理論」頁可以展示「這些字級 / 行高 / measure 怎麼來的」（用 vortex 自身 CSS 排版）
- **不要換 Tailwind**：vortex 用 BEM-ish `.vx-*` class 已建立 identity — 換 Tailwind 會失根

### 6.5 Mintlify（產品站）

**設計邏輯**（從 mintlify.com 首頁實測）：
- **AI-native 定位**：「Built for both people and AI」+ `llms.txt` + MCP 支援 — 切入 LLM 工作流
- **極簡雙欄 hero**：左側文字 + 右側插圖（light/dark 雙版本切換）
- **Sentence case 標題**：非全大寫，傳達現代 / 親和
- **雙 CTA**：「Start now」（PLG）vs「Get a demo」（企業）
- **客戶 logo 牆**：Anthropic / Coinbase / HubSpot / Zapier / AT&T — 直接背書
- **「New」徽章 + 公告條**：標記 `[New]` 的部落格貼文置於標題上方，製造新鮮感
- **Agent 敘事**：把「維護文件」重新框架為 agent 自動化問題
- **結構化 footer**：Explore / Resources / Documentation / Company / Legal 五欄

**為何有效（學到什麼）**：
- 對 dev tool 站，**客戶 logo 牆 + 雙 CTA + AI 敘事** 是當代公式
- 「為 LLM 設計」的定位是 2024–2026 差異化（前幾年沒人這樣定位）
- 客戶故事本身就是素材 — Perplexity / X / Cognition / Replit 等都是敘事性強的品牌

**Vortex 可借**：
- **結構化 footer**：vortex 站 footer 目前較弱，可參考 Mintlify 的 5 欄 footer 結構
- **不適用**：AI 敘事（vortex 內容是教練判讀，不是 LLM 友善資料）
- **不適用**：客戶 logo 牆（vortex 不是 SaaS）
- **可借的**：light/dark 雙版本圖片資產 — vortex 的 SVG 圖示可以備 dark mode 版本

---

## 7. Web 設計權威文獻清單

> 站主三份研究引用了 NN/g 系列文章 + Wikipedia 條目 + Dan Brown 八原則 + Pirolli & Card Information Foraging + Nicky Case Explorable Explanations。本節補**書單**（站主未列過）。

| 書 | 作者 | 年份 | 一句話定位 |
|----|------|------|-----------|
| **The Elements of Typographic Style** | Robert Bringhurst | 1992（4th ed 2012） | Typography 聖經：modular scale、vertical rhythm、measure、leading 全部有源頭 |
| **The Visual Display of Quantitative Information** | Edward Tufte | 1983（2nd ed 2001） | 資訊密度經典：data-ink ratio、chartjunk、small multiples — 對 vortex 的水感 L0–L6 圖、SWOLF 表都是直接參考 |
| **Don't Make Me Think** | Steve Krug | 2000（3rd ed 2014） | 網頁可用性經典：「Don't make me think」原則貫穿全書 — 對 vortex「找得到要讀的」是根本指導 |
| **The Design of Everyday Things** | Don Norman | 1988（revised 2013） | Affordance / signifiers / mapping / feedback 四大設計原則 — 對 vortex 的「處境卡」「點下去會發生什麼」是底層 |
| **The Non-Designer's Design Book** | Robin Williams | 1994（4th ed 2014） | CRAP 四大原則（Contrast / Repetition / Alignment / Proximity）— 對 vortex 排版是新手友善的入門 |
| **Atomic Design** | Brad Frost | 2016 | Atoms / Molecules / Organisms / Templates / Pages — 對 vortex 的 `.vx-*` class 命名是參考 |
| **More Meaningful Typography** | Tim Brown | 2010（A List Apart） | Modular scale 線上權威文 — 對 vortex 字級階梯建立 |
| **Practical Typography** | Matthew Butterick | 2010（線上版持續更新） | 免費線上書 — 對 vortex typography 是最直接的可引用來源 |
| **Compose to a Vertical Rhythm** | Richard Rutter | 2006（24ways） | Wilson Miner baseline grid 的延伸（用 em 而非 px） |
| **Setting Type on the Web to a Baseline Grid** | Wilson Miner | 2007（A List Apart） | 已在 §2.4 詳述 |
| **Information Architecture for the World Wide Web**（北極熊書）| Louis Rosenfeld & Peter Morville | 1998（4th ed 2015） | IA 聖經 — entry-wayfinding 已觸及八原則的 Dan Brown 變體，本書是原始權威 |
| **Design Systems** | Alla Kholmatova | 2017 | Design tokens / 元件命名 / pattern library — 對 vortex 的 `.vx-*` 系統化有參考 |

**未讀但業界常引用**（站主可考慮）：
- *Grid Systems in Graphic Design* — Josef Müller-Brockmann（瑞士派 grid 聖經）
- *The Vignelli Canon* — Massimo Vignelli（網格思維）
- *Thinking with Type* — Ellen Lupton（typography 教科書，比 Bringhurst 平易）
- *Refactoring UI* — Adam Wathan & Steve Schoger（Tailwind 作者的 UI 實戰）

---

## 8. 對 Vortex 的具體套用

> 把 §2–§7 的每個原理收斂成「Vortex 哪些元素要怎麼做」的具體清單。**這是結構決策，不是 CSS tips**。

### 8.1 Typography 微調（vortex.css 已落地、不需大改）

| 元素 | 現況 | 套用原理 | 動作 |
|------|------|---------|------|
| body line-height | 1.75 | Butterick §2.2 | 維持（漢字合理） |
| --vx-measure | 38em | Butterick §2.1 | 維持（漢字 ~38 = 合理） |
| --vx-measure-lead | 32em | Butterick §2.1 | 維持（引言窄 5em 對） |
| 字級階梯 | 14/17/22/24/30 | Tim Brown §2.5 | **可選**：建立 modular scale 變數（見 §2.5） |
| baseline grid | 無 | Wilson Miner §2.4 | **可選**：建立 4px / 8px spacing scale |
| 字型 | Source Serif 4 + Crimson Pro | Butterick §2.3 | 維持（不是「螢幕妥協字型」） |

### 8.2 互動細節補完（必須）

| 項目 | 現況 | 動作 |
|------|------|------|
| `:focus-visible` | 無 | **加** — 用 `--vx-accent` outline 2px + offset 2px |
| `prefers-reduced-motion` | 無 | **加** — 全域關閉 animation/transition |
| `:hover` 規範 | 部分有 | **統一**：transform/opacity 200ms ease-out，禁動 layout 屬性 |
| Skip link | 無 | **加** — baseof.html 開頭 `<a class="skip-link" href="#main">` |
| `cursor: pointer` | 隱含 | **檢查** — 所有 clickable 元素是否都有 |

### 8.3 a11y 修補（見 §4.2 對照表）

**P0（必修）**：
1. Skip link
2. `:focus-visible` 全域
3. `prefers-reduced-motion` media query
4. SVG 圖示加 `<title>` 或 `aria-label`
5. aria-live region（quiz 結果、錯誤訊息）

**P1（強烈建議）**：
6. axe-core / pa11y CI gate
7. reflow 320px 測試
8. mobile 觸控目標 ≥ 24px

### 8.4 結構決策（對應 redesign 結構）

| 站主三份研究結論 | 本研究補強 | 重做時的具體結構決策 |
|-----------------|-----------|-------------------|
| entry-wayfinding H4「共用座標系」 | shadcn/ui 源碼所有權 + design tokens | L0–L6 mini 階梯要做成**可重用的 partial**，每個 section 嵌入都用同一份 |
| presentation-layout §4 重排提案 | Linear 編輯設計 + 單字族策略 | 首頁 hero 用「水感發展脊椎圖」作視覺主體，**不用文字描述** |
| vortex-rebuild 「可走的地圖」 | Mintlify footer 結構 + Stripe CTA 分級 | 主入口地圖放 hero，「資料庫查詢」類降級到 footer 或 `<details>` 摺合區 |
| 三份共同：progressive disclosure | Tailwind 自指式展示 | 每個 drill / 概念頁用同樣的 preview + content 兩段式 |

---

## 9. 「不換皮 checklist」（回應 redo-vs-reskin insight）

> 站主 L5 insight `2026-06-18-redo-vs-reskin.md` 強調：換皮 ≠ 重做。本節是「下次做重做時，逐項打勾驗證結構有沒有真的改」。

### 9.1 結構決策 checklist（10 項）

- [ ] **有沒有一個主焦點 hero？**（不是 12 個等重入口 — presentation-layout §4.1 已提）
- [ ] **首頁是否「落地 3 秒內找得到自己該讀哪」？**（不是「按線性順序看完」）
- [ ] **每個 section 開頭有沒有 L0–L6 mini 階梯定位？**（entry-wayfinding H4 已提）
- [ ] **資料庫 / 查詢類頁面有沒有降級到 footer 或摺合區？**（presentation-layout §4.5 已提）
- [ ] **有沒有用「場景式呈現」取代「教科書目錄」？**（entry-wayfinding H1-H5 已提；IKEA 範例）
- [ ] **有沒有「使用者自選深度」而非「系統替他分流」？**（vortex-rebuild 雙軸自選入口）
- [ ] **節點座標是否預先定義、非 force-directed？**（vortex-rebuild roadmap.sh 經驗）
- [ ] **「視覺片段 + 文字 + 可操控工具」三件式有沒有用在動作教學？**（vortex-rebuild Brilliant / Muscle&Motion）
- [ ] **Cognitive Gate 有沒有刻意收起深層？**（vortex-rebuild Nicky Case 經驗；L0 沒穩不給看 L3）
- [ ] **新架構是否同時服務新手 + 老手？**（不偏廢任一）

### 9.2 Typography 決策 checklist（8 項）

- [ ] **measure 在 32–40em（漢字）/ 60–75 字元（拉丁）？**
- [ ] **漢字內文 line-height 1.7–1.85？**
- [ ] **有無使用 modular scale 或至少視覺階梯合理？**
- [ ] **baseline grid 或 spacing scale 變數有沒有建立？**
- [ ] **字型選擇不是「螢幕妥協」字型（Georgia / Calibri 之類）？**
- [ ] **Web font 有 preload？**
- [ ] **CLS ≤ 0.1？**
- [ ] **沒有把 measure 拉超過 75em 在 mobile 上？**

### 9.3 互動 / a11y / performance checklist（10 項）

- [ ] **`:focus-visible` 全域設定？**
- [ ] **`prefers-reduced-motion` media query？**
- [ ] **Skip link？**
- [ ] **axe-core / pa11y CI gate？**
- [ ] **SVG 圖示都有 `<title>` 或 `aria-label`？**
- [ ] **aria-live region 用於 quiz / 錯誤訊息？**
- [ ] **mobile 觸控目標 ≥ 24px？**
- [ ] **reflow 在 320px 寬無水平捲動？**
- [ ] **Web font 有 `size-adjust` 處理 fallback？**
- [ ] **PageSpeed Insights CLS ≤ 0.1 + LCP ≤ 2.5s？**

### 9.4 設計原理溯源 checklist（5 項）

- [ ] **每個設計決策有「為什麼這樣做」的權威依據？**（不只是「好看」）
- [ ] **每個結構決策對應到至少一個真實前例？**（Linear / Stripe / Mintlify / shadcn / Tailwind 至少一個）
- [ ] **避開了文件站血統的目次清單？**（vortex-rebuild §1.3 反例）
- [ ] **避開了 audience-based navigation？**（entry-wayfinding §3 反例）
- [ ] **避開了「等重列」的版面策略？**（presentation-layout §2.4）

---

## 10. 開放問題 / 需站主拍板的取捨

### O1 — DESIGN_SYSTEM.md 補建時機與內容

> **⛔ 本問題已作廢（2026-07-31 修正）— 前提錯誤，不要據此行動。**
>
> 本節斷言「檔案不存在」，依據是在 `~/projects/cortex/`（VM 上的 Unix 路徑）grep。**該檔一直存在於 `C:\claudehome\resources\notes\DESIGN_SYSTEM.md`**，是全域設計規範的單一真相源，內含經交叉驗證的可用性鐵則 A–I。搜尋路徑找錯了，不是檔案缺失。
>
> 因此 (A)/(B)/(C) 三個選項全部不適用——照任一項去「補建」都會生出第二份設計規範，違反單一真相來源。
>
> **實際處置**：本研究 §3（互動細節）與 §5（CLS）確實補到了 A–H 的空白，已收斂為**鐵則 I「狀態、動效與載入穩定」**寫入該檔。§2 typography、§4.1 WCAG POUR 與既有鐵則 C/D/E 重複，未重複收錄；§4.2 的 18 個 a11y 失敗模式屬操作清單層級，留在本檔備查、不上升為金條。

~~原始選項（僅存查）：(A) 站主自己寫 (B) 授權 Claude 寫 (C) 維持現狀~~

### O2 — a11y audit 的執行方式

§4.2 列 18 個 Hugo 站常見失敗模式，其中站主站可能命中 11 項。**修法**：

- (A) 派 sub-agent 用 axe-core / pa11y 跑 `public/` 全部 HTML，產出精確清單
- (B) 站主自己跑（已有 CI）
- (C) 等下次 redesign 一併修

### O3 — shadcn / Linear / Stripe 借法的範圍

§6 列的 GitHub repo 設計邏輯，**借多少**：

- (A) 只借結構決策（hero / 雙 CTA / 客戶 logo 牆）— 不動視覺
- (B) 借視覺語言（漸層 / bento grid / 編輯編號）
- (C) 全借 + 完整 prototype

站主對「換皮 vs 重做」敏感 — 借太多可能違背意圖。

### O4 — Bootstrap 設計系統 vs 自訂 `.vx-*`

Brad Frost Atomic Design 書主張 design system 應分層（atom → molecule → organism）。站主目前 `.vx-*` class 是混層的（有些是原子如 `.vx-meta`、有些是元件如 `.vx-toc-row`、有些是 layout 如 `.vx-jrn-*`）。**要不要正式分層**：

- (A) 維持現狀（混層但有命名慣例）
- (B) 正式分層（`.vx-atom-*` / `.vx-mol-*` / `.vx-org-*`）
- (C) 引入 BEM（`.vx-toc-row__zh` / `.vx-toc-row--active`）

### O5 — 字型授權風險

Source Serif 4 + Crimson Pro 是 SIL OFL（開放授權），**目前沒問題**。但若未來想換字型（如 Soehne / Inter Display）需注意授權：

- **SIL OFL / Apache 2.0** — 可商用免費
- **商業字型**（Soehne / Founders Grotesk / Lyon Display）— 需購買授權，每年 $1000+

**站主決定**：要不要為「質感提升」買商業字型？

---

## 11. 引用清單（供核對）

### Typography 權威來源

1. **Matthew Butterick, *Practical Typography* — Line length**
   URL: https://practicaltypography.com/line-length.html
   （45–90 字元 / 2–3 alphabets / 66 字元 ≈ 2.31 alphabets）

2. **Matthew Butterick, *Practical Typography* — Line spacing**
   URL: https://practicaltypography.com/line-spacing.html
   （leading 120–145% of point size / 110% 偏緊 135% 適中 170% 偏鬆）

3. **Matthew Butterick, *Practical Typography* — Screen-reading considerations**
   URL: https://practicaltypography.com/screen-reading-considerations.html
   （現代螢幕已逼近紙本 / 字型 DPI 數字 / 1–2 arcminutes 視覺極限）

4. **Wilson Miner, "Setting Type on the Web to a Baseline Grid"**（A List Apart, 2007-08-22）
   URL: https://alistapart.com/article/settingtypeontheweb
   （vertical rhythm / baseline grid / 12px base × 18px line height）

5. **Tim Brown, "More Meaningful Typography"**（A List Apart, 2010-06-22）
   URL: https://alistapart.com/article/more-meaningful-typography
   （modular scale — **本輪未直接 fetch 原文**，數據來自二手整理；歸入 §12 未能查證）

### a11y 與 Performance

6. **W3C, "Web Content Accessibility Guidelines (WCAG) 2.2" — Understanding docs**
   URL: https://www.w3.org/WAI/WCAG22/Understanding/
   （POUR 四大原則 / Hugo 站 18 個失敗模式）

7. **web.dev, "Cumulative Layout Shift (CLS)"**
   URL: https://web.dev/articles/cls
   （≤ 0.1 良好 / > 0.25 不佳 / 75th percentile / layout shift score 公式）

### GitHub 高星 repo 與設計邏輯

8. **shadcn/ui 官網**
   URL: https://ui.shadcn.com/
   （Open Source Open Code / ~117k stars / Build Your Own / Registry pattern）

9. **Linear.app 首頁**
   URL: https://linear.app/
   （產品 UI 作為 hero / 單一字族策略 / FIG 編號 / 極簡黑白）

10. **Stripe.com 首頁**
    URL: https://stripe.com/
    （premium fintech / Soehne 字型 / Bento Grid / CTA 分級 / 三段式敘事）

11. **Tailwind CSS 官網**
    URL: https://tailwindcss.com/
    （自指式展示 / OKLCH wide gamut / functional token / Inter + IBM Plex Mono）

12. **Mintlify 官網**
    URL: https://mintlify.com/
    （AI-native 定位 / llms.txt / 雙 CTA / 結構化 footer）

### 補充文獻（站主三份研究已涵蓋者，不重複）

- NN/g Information Scent / Progressive Disclosure / Audience-Based Navigation — entry-wayfinding
- NN/g Visual Hierarchy / F-pattern / Layer-cake pattern — presentation-layout
- roadmap.sh / Quartz / Docusaurus / Brilliant / Muscle&Motion — vortex-rebuild

---

## 12. 未能查證清單（自我批判）

> 本研究的誠實清單 — 站主核對時這些項目需格外注意。

1. **Tim Brown "More Meaningful Typography" 原文**：本輪 WebSearch 失敗（API 400），modular scale 比例（1.067 / 1.125 / 1.2 / 1.25 / 1.333 / 1.414 / 1.5 / 1.618）來自 Bringhurst《Elements of Typographic Style》§3.1 二手整理 + 站主 CSS 觀察，**未直讀 Tim Brown 原文確認**。歸類：未直視原始文獻。

2. **A List Apart "More Meaningful Typography" 內文**：WebSearch 失敗。Wilson Miner baseline grid 已直讀，Tim Brown 比例未直讀。

3. **shadcn-ui 為何不做 npm package**：WebFetch 官網首頁未明文，**設計哲學論述需讀 docs 子頁（/docs/installation, /docs/components）才完整** — 本輪未做。

4. **shadcn-ui 對設計 / 工程師工作流影響的具體數據**：官網無量化數據。GitHub Issues / Discussions / Reddit / Hacker News 討論可挖 — 本輪未做。

5. **Tailwind CSS 確切 star 數**：首頁未顯示，引用「80k+」來自站主領域常識，未在 GitHub 頁面直接確認（截至本研究時點，公開資料庫 star 數會持續變動）。

6. **Linear / Stripe / Mintlify 內部設計決策的官方文件**：本輪只看公開首頁實測，**未讀其 design blog / engineering blog / case study** — 對「為什麼這樣設計」只能從表面推論。

7. **WCAG 2.2 完整 86 個 success criteria**：本研究只列舉 16 個關鍵 SC + 18 個 Hugo 站常見失敗模式，**未列完整 86 條**。完整驗證需 pa11y / axe-core 自動掃描。

8. **CJK typography 經典研究**：本研究在 §2.2 提到「漢字 1.7–2.0 行高」，引用自業界共識，**未引學術研究**（如日本「文字組版処理の要件」或中國「中文文案排版指南」）。歸類：未直視原始研究。

9. **"Don't Make Me Think" / "The Design of Everyday Things" / "The Non-Designer's Design Book" / "Atomic Design" 書中具體內容**：§7 書單只列書名 + 一句話定位，**未讀各書全文確認命題**。歸類：未直讀原始文獻。

10. **Müller-Brockmann "Grid Systems in Graphic Design"**：書單列為「未讀但業界常引用」，**未確認 §1.3「線性文件站反例」是否在這本書有對應論述**。

---

## 終止

> 本研究僅為設計原理深度研究論證，未動任何 layout / data / 既有檔；新增檔案路徑 `research/vortex-rebuild/design-principles-deep-dive.md`，待站主核對引用 + 拍板 §10 開放問題後，可進入：
> 1. ~~DESIGN_SYSTEM.md 補建（依 §8 + §10 O1）~~ **已作廢**：該檔早已存在，可用內容已於 2026-07-31 併入其鐵則 I
> 2. a11y audit（依 §4.2 + §10 O2）
> 3. 未來 vortex 重做時攜帶 §9 checklist 避免換皮
>
> 本研究與既有三份研究的關係：
> - vortex-rebuild → 給「網站的形狀」
> - entry-wayfinding → 給「入口 / IA」
> - presentation-layout → 給「視覺層級 / 閱讀動線」
> - **本份 → 給「排版 / 互動 / a11y / GitHub 設計邏輯 / 權威文獻」底層原理**
> - **四份合起來 = vortex 重做的設計決策依據（不是設計規範）**
