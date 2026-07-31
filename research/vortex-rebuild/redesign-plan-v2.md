# Vortex 重構計畫 v2 — 站主 review 版

> 本檔是**重構計畫**，不是報告。站主 review 通過才進入實作。
>
> 觸發：站主 2026-06-18 決定「重起一次 vortex 重構計畫」，指定流程 = AI 先看 vortex 內容 + 寫計畫 → 站主 review → 才動手。
>
> 計畫產出時間：2026-06-18 晚
>
> **不做的事**（依站主 CLAUDE.md + MAP.md + HANDOFF.md 規範）：
> ① 改 canonical 內容（`TheVortexProject/canonical/` → `sync_vortex.py` → `data/vortex/`，sync 階段會洗掉手改）
> ② 改 baseof.html / 全站 CSS / hugo.toml（除非站主明確同意）
> ③ 加新區塊 / 新頁面 / 換技術棧
> ④ 換字型授權（商業字型不在 L1 自主權限）
> ⑤ 違反公開層禁區（不出現「自陳 → 感知/技術品質判斷」）

---

## 0. 為什麼這次會跟上次不同

上次 minimax-vortex v4（commit af6f7b1, 2026-06-17）被取消（commit 4504e02, 2026-06-18），原因寫在 L5 insight `2026-06-18-redo-vs-reskin.md`：

> **換皮 ≠ 重做** — 交付物只動 CSS 不動結構 → 站主看到會判定「沒變」→ AI 工作直接歸零

**這次跟上次不同的關鍵**：

| 差異 | 上次 minimax-vortex v4 | 這次 vortex 重構 v2 |
|------|------------------------|---------------------|
| 工作模式 | AI 接到指令直接做 prototype | **站主主動要求先寫計畫** |
| 研究依據 | 有 `research-log.md` 但 AI 沒逐項對照 | 5 份研究 + 41 項 checklist + 站主 review |
| 目標 | 整站重做（換一個完全不同的設計） | **重構**（在既有 vortex 基礎上改善） |
| 範圍 | 連到獨立 repo + GitHub Pages | **cortex 站內 vortex section 重構** |
| 驗收 | 站主看到 v4 判定「沒變」取消 | **41 項 checklist 逐項打勾** |

**這次成功的條件**：
1. 站主 review 計畫 → 確認要做
2. 每個 phase commit 前站主 review
3. 41 項 checklist 逐項打勾（✗ 多於 ✓ 退回）
4. 不換皮（**techo 與 vx 統一決策**是結構決策，不是視覺決策）

---

## 1. 一句話目標

> **重構 vortex 的「整站一致性 + a11y + 互動細節 + 結構決策」 — 不重做內容，只改善骨架與呈現。讓 5 份研究的結論在 vortex 落地。**

---

## 2. 範圍

### 2.1 做（commit 可做）

| 維度 | 動作 |
|------|------|
| 全站風格統一 | **techo 推廣** 或 **vx 統一** 二選一（站主拍板 O1） |
| a11y baseline | skip link、`:focus-visible`、`prefers-reduced-motion`、SVG `<title>`、`aria-live` |
| Typography | modular scale 變數化、baseline grid 變數化、web font preload + `size-adjust` |
| 結構決策 | 首頁 3 群 + 1 摺合區重排（per presentation-layout §4.2）+ L0–L6 mini 階梯 partial（per entry-wayfinding H4） |
| 互動規範 | Material 3 motion patterns + Duration Tokens（200/400/500ms）+ easing tokens |
| 結構性 CSS | 既有 `.vx-*` / `.tx-*` class 整理、文件化（~~DESIGN_SYSTEM.md 補建~~ — 前提錯誤，該檔早已存在，見 §13 O2 作廢說明） |

### 2.2 不做（站主明確不同意才做）

| 不做 | 為什麼 |
|------|--------|
| 改 canonical 內容 | sync_vortex.py 會洗掉（per MAP.md §2） |
| 改 baseof.html / 全站 CSS | 影響 library/notebook/temperament（vortex 變更不應外溢） |
| 加新區塊 / 新頁面 | presentation-layout §4 硬約束 #1「不新增任何區塊」 |
| 換技術棧（Hugo 維持） | vortex-rebuild §8 已證 Hugo 夠用 |
| 買商業字型 | L1 自主權限不含財務 |
| 加 audience-based navigation | entry-wayfinding §3 反例 |

### 2.3 可選（站主授權才做）

| 可選 | 條件 |
|------|------|
| 5-agent usability testing（per design-craft §5.3） | 站主授權派 sub-agent |
| multi-agent design critique | 站主授權派 sub-agent |
| axe-core / pa11y CI gate | 站主同意改 `.github/workflows/deploy.yml` |
| Design craft daily digest cron | 站主同意設 systemd timer |

---

## 3. 既有研究對應（5 份研究 × 對 vortex 的套用）

### 3.1 vortex-rebuild（網站結構 / 知識呈現）

**已落地**：roadmap.sh / Quartz / Brilliant 等研究結果在 vortex-master-detail 結構中（rail + panel）已體現
**未落地**：
- ✓1.7 節點座標預先定義（master-detail 是）
- ✓1.8 視覺片段 + 文字 + 可操控工具三件式（drill card 已是）
- ✗1.9 Cognitive Gate（L0 沒穩先別看 L3 — 需 mini 階梯 partial 落實）
- ✓1.10 同時服務新手 + 老手（雙軸自選入口已對）

### 3.2 entry-wayfinding（IA / wayfinding / 信息氣味）

**已落地**：
- ✓ H1 輕量鉤子（hero 「從這裡翻起」2 條 — techo 版本）
- ✓ H2 痛點卡（vortex-home 已有「依需求找練習」卡）
- ✓ H4 共用座標系（psychology 已有三帶切分 + L0–L6 階梯）
- ✓ H5 瓶頸卡（psychology 5 張處境卡是範本）

**未落地**：
- ✗ H3 家長框架卡（**站主尚未決定要不要做** — per entry-wayfinding §6 O3）
- ✗ 痛點卡推廣到首頁 hero（目前痛點卡在 section 3「心理」）
- ✗ L0–L6 mini 階梯在每個 section 開頭（只 psychology 有）

### 3.3 presentation-layout（視覺層級 / 閱讀動線）

**已落地**（vortex-home techo 版）：
- ✓ 落地第一眼焦點（tx-mast hero）
- ✓ 主入口放大（`00` / `L0` 編號 + tx-path）
- ✓ `<details>` 摺合（六式 ledger）
- ✓ 群標籤（tx-sec-h + tx-sec-tag）
- ✓ tx-legend 確定性圖例
- ✓ 量化 meta（125 練習 / 22 標準 等）

**未落地**：
- ✗ 3 群 + 1 摺合區重排（目前 4 section 等重）
- ✗ 群標籤放大到 h2 字級（目前 21px — 應對照 §4.6 字級階梯）
- ✗ 主入口 28-30px（目前 tx-path 看起來中等）

### 3.4 design-principles-deep-dive（原理層）

**已落地**：
- ✓ Source Serif 4 / Crimson Pro（vx）+ Shippori Mincho / Courier Prime（techo）
- ✓ 海軍藍 #1b3a5c（vx）/ 柿橘 #D4622A（techo）
- ✓ measure 38em（vx）/ 880px max-width（techo）
- ✓ line-height 1.75（vx）/ var(--tx-unit) = 30px（techo = 1.875 at 16px）
- ✓ baseline grid（techo 用 repeating-linear-gradient 30px 橫罫線，實際是物理 baseline grid！）

**未落地**：
- ✗ `:focus-visible` 全域
- ✗ `prefers-reduced-motion` media query
- ✗ Skip link
- ✗ SVG `<title>` / `aria-label`
- ✗ Web font preload + `size-adjust`
- ✗ modular scale 變數（目前字級都是 hardcoded）
- ~~✗ DESIGN_SYSTEM.md（站主尚未建）~~ → **判定錯誤**：該檔早已存在於 `C:\claudehome\resources\notes\DESIGN_SYSTEM.md`（見 §13 O2 作廢說明）

### 3.5 design-craft-meta-research（craft 層）

**已落地**：
- ✓ NN/g #4 Consistency（`.vx-*` / `.tx-*` 系統化 class）
- ✓ NN/g #8 Aesthetic Minimalist（techo 用留白 + 橫罫線）
- ✓ micro-interaction 三件式（Trigger-Rule-Feedback 在 `<details>` 收合是）

**未落地**：
- ✗ 5-agent usability testing（沒跑過）
- ✗ multi-agent design critique（沒跑過）
- ✗ NN/g 10 heuristics 套用 review（缺文件化）

---

## 4. 結構決策（核心 — 5 個）

### 4.1 ⭐ 全站風格統一決策（**站主必拍板 — O1**）

**現況**：techo 風格只在 `vortex-home.html` + `vortex-techo.css`（195 行）；其他 12 個 vortex layout 全部用 vx 風格（`vortex.css` 1568 行）。**不一致是當前最大結構問題**。

**3 個選項**：

#### 選項 A：techo 推廣（推薦 — 跟設計語言方向一致）

- 全部 vortex 頁面改用 `tx-*` class
- 統一字型（Shippori Mincho + Courier Prime + Noto Serif/Sans TC）
- 統一色系（柿橘 #D4622A + 紙色 #FAFAF7）
- 統一 baseline grid（30px repeating-linear-gradient）
- 統一 max-width（880px）
- 統一 line-height（var(--tx-unit) = 30px / 16px = 1.875）

**優點**：
- 站主已選 techo 風格（vortex-home 改 techo = 站主品味決定）
- 風格更統一、有差異化（學術期刊站很多，日式手帳站少見）
- baseline grid 物理化（橫罫線本身就是排版輔助）
- 柿橘 + Shippori Mincho 在「vortex 公開」這個 niche 是少見組合

**成本**：
- vortex.css 1568 行要大量重寫（估算 ~50-70% 可保留當 vx-fallback）
- 12 個 layout 要逐個 class rename + 測試
- psychology / stroke / database / water-sense / periodization / levels / adm 全部要改
- 預估工作量：~40-60 小時 + 風險測試

**風險**：
- 改到一半發現某頁不適合 techo（最可能是 periodization / adm 的表格）
- typography 從 17px / 1.75 換到 16px / 1.875 — 視覺密度變化大
- 既有 content 排版可能被破壞（drill card / 表格 / 引用塊）

#### 選項 B：vx 統一（保守）

- 撤掉 techo，把 `vortex-home.html` 改回 vx 風格
- 統一 vx-* class / Source Serif 4 / 海軍藍 / 1080px / 1.75 行高
- vortex-techo.css 刪除（或保留作實驗性 prototype）

**優點**：
- 既有 12 頁不動，只改 1 頁（home）
- 工作量小（~3-5 小時）
- 風險低
- Source Serif 4 / Crimson Pro 在 typography 經典原理（design-principles §2.3）已經驗證

**成本**：
- 退回 techo 已做的差異化（站主改 techo 是品味決定）
- vortex 站變「普通學術期刊風」，跟其他技術站同質化

**風險**：
- 站主會覺得「我又換皮」（presentation-layout 的核心重排提案沒實踐）

#### 選項 C：兩者混搭但有意義（折衷）

- **techo = 入口區**（home / section hero / 概覽頁）
- **vx = 深度區**（master-detail / 表格 / 引用塊）
- 兩者之間有過渡動畫（fade-through 200ms）

**優點**：
- 保留兩種設計語言的優點
- 入口用 techo 的「個人筆記」感、深度用 vx 的「期刊論文」感

**成本**：
- 兩套 CSS 都要維護（vortex.css 1568 + vortex-techo.css 195 = 1763 行）
- 過渡動畫要設計 + 測試

**風險**：
- 「兩者混搭」很容易變成「不一致」的偽裝
- 站主審查成本高（每次都要決定哪個用 techo / 哪個用 vx）

**我的推薦**：**A（techo 推廣）** — 理由：
- 站主主動改 home 為 techo 是品味決定（不是 L1 自作主張）
- 站主 L5 insight 強調「換皮 ≠ 重做」 — 選 A 才是結構決策
- 站主 TIME 投入最多 vs 視覺回報最大
- 統一後 vortex.css 可以大量刪除（vortex.css 1568 行估可砍 60%）

**但選 A 風險大**，所以 **v2 計畫分階段**（見 §10）— 先驗證首頁改完沒問題，再逐頁推廣。

### 4.2 首頁重排為「3 群 + 1 摺合區」（per presentation-layout §4.2）

**現況**：vortex-home.html 4 個 section（入門路徑 / 六式 / 心理 / 長期）

**目標**：

| 群 | 對應現況 section | 視覺處理 |
|----|----------------|---------|
| **群 1：先懂**（Theory） | 入門路徑 2 條 + 心理 chips | 主焦點放大 |
| **群 2：開始練**（Practice） | 六式 ledger | 2×3 grid 收合 |
| **群 3：長期**（Long-term） | ADM + PZ 卡片 | 並排雙格 |
| **參考摺合區**（Reference，預設收合） | 依需求找 + 跨泳式查 | `<details>` |

**修改點**：
- 群標籤從 21px（tx-sec-h）→ 28-34px（建立 layer-cake 橫掃目標）
- 心理 chips 從 section 3 → 群 1 內（痛點引導）
- ADM / PZ / DRILLS / REFERENCE 4 張卡改為 2 大群 + 1 摺合區

**狀態**：選 A 或 C 時實踐；選 B 時不動（首頁仍是 4 section）

### 4.3 L0–L6 mini 階梯抽 partial（per entry-wayfinding H4）

**現況**：psychology 頁有完整 vx-ladder，但只在那頁出現

**目標**：抽 `layouts/partials/vortex/mini-ladder.html`，所有 vortex 頁（特別是 section 開頭）嵌入。

**範本**：
```html
<div class="vx-ladder" aria-label="這個頁面落在水感的哪一層">
  <span class="vx-ladder-cap">水感層級</span>
  <span class="vx-ladder-node">L0</span>
  ...
  <span class="vx-ladder-node is-on">L3</span>
  ...
</div>
```

**接受 page parameter**（哪幾層打亮由呼叫頁指定）

**對所有 vortex 內頁都加**（home 不加 — home 是入口不定位）

### 4.4 痛點卡推廣（per entry-wayfinding H2）

**現況**：psychology 頁有 5 張處境卡（vx-sit-card）— 站主驗證有效

**目標**：把「依需求找練習」卡從 section 4 → 首頁群 1 內，跟心理 chips 並列

**痛點卡白話命名**（站主 O2 拍板的命名）：
- 「換氣嗆水」
- 「腳一直沉」
- 「划手沒推進感」
- 「划 25m 就沒力」
- 「出發入水沒力」
- 「轉身後速度掉太多」

**嚴守禁區**：**不下判斷**（不寫「代表你 L0 沒穩」這類反推語）

### 4.5 對每個內頁的設計決策

| Layout | 現況 | v2 決策（選 A） |
|--------|------|---------------|
| `vortex-home.html` | techo 已落地 | **重排為 3 群 + 1 摺合區**（per §4.2）+ 加痛點卡 |
| `vortex-stroke.html` | vx master-detail | 改 tx-* + 加 mini-ladder + 保留 master-detail 互動 |
| `vortex-database.html` | vx 雙區（needs + lookup） | 改 tx-* + 加 mini-ladder |
| `vortex-psychology.html` | vx master-detail + 三帶 + 處境卡 | 改 tx-* + 加 mini-ladder + 處境卡維持 |
| `vortex-water-sense.html` | vx 全 hardcoded 586 行 | 改 tx-* + 加 mini-ladder（風險：hardcoded 改 class 易破） |
| `vortex-levels.html` | vx rail + 面板 | 改 tx-* + 加 mini-ladder |
| `vortex-periodization.html` | vx 期刊式單頁 851 行 | 改 tx-* + 加 mini-ladder（最大頁面） |
| `vortex-adm-home.html` | vx masthead | 改 tx-* + 加 mini-ladder |
| `vortex-adm-matrix.html` | vx master-detail | 改 tx-* + 加 mini-ladder |
| `vortex-adm-standards.html` | vx cards | 改 tx-* + 加 mini-ladder |
| `vortex-adm-single.html` | vx-article | 改 tx-* |

---

## 5. Typography 決策（基於 vortex.css / vortex-techo.css 現況）

### 5.1 兩個 design token 系統對照

| 維度 | vx (現有) | techo (現有) | v2 統一（選 A） |
|------|-----------|--------------|-----------------|
| 主體字 | Source Serif 4 | Shippori Mincho + Courier Prime | **techo 字型** |
| 字級 base | 17px | 15-16px | **15-16px**（techo） |
| Measure | 38em | max-width 880px | **max-width 880px**（techo） |
| Line-height | 1.75 | 30px / 16px = 1.875 | **1.875**（techo = baseline grid 物理化） |
| Baseline grid | 無 | 30px repeating-linear-gradient | **30px**（techo） |
| Modular scale | 無 | 無 | **建立**（新增） |

### 5.2 Modular scale 變數化（新增）

**理由**：現有字級都是 hardcoded，沒有 system — 改一個要追多處。

**提議**（基於 Tim Brown「More Meaningful Typography」Major third 1.25 比例，base 16px）：
```css
:root {
  --type-tiny:  10px;  /* 0.625 */
  --type-xs:    12px;  /* 0.75 */
  --type-sm:    14px;  /* 0.875 */
  --type-base:  16px;  /* 1.0 */
  --type-md:    20px;  /* 1.25 */
  --type-lg:    25px;  /* 1.5625 */
  --type-xl:    32px;  /* 2.0 */
  --type-2xl:   40px;  /* 2.5 */
  --type-3xl:   51px;  /* 3.1875 */
  --type-4xl:   64px;  /* 4.0 */
}
```

**驗證**：techo 現有 tx-title clamp(46px, 11vw, 88px) → 對 64px + vw 響應式
**驗證**：techo 現有 tx-sec-h 21px → 對 type-md 20px（接近）
**驗證**：techo 現有 tx-eyebrow 12px → 對 type-xs 12px

**實作**：每個元素改用 `font-size: var(--type-X)` 而非 `font-size: NNpx`

### 5.3 Web font load 策略

**現況**：techo + vx 都用 `<link rel="stylesheet">` Google Fonts
**問題**：會 FOUT / 影響 CLS

**v2 改法**（per design-principles §5）：
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?...">
```

加上 `@font-face` 加 `size-adjust` 處理 fallback metric。

---

## 6. 互動決策（Material 3 + Apple HIG + NN/g）

### 6.1 Motion patterns 套用

**現況**：techo 用 fade-through details 收合（CSS-only），無 JS 動畫

**v2 加強**（per design-craft §4）：
- **Fade Through**：section / panel 切換（techo 已有，需驗證 easing）
- **Container Transform**：痛點卡 → drill 列表（**新增**）
- **Shared Axis**：master-detail rail ↔ panel（**新增**）
- **Reduce Motion**：`prefers-reduced-motion: reduce` 時全部改 crossfade 或直接切換

### 6.2 Duration tokens（新增）

```css
:root {
  --duration-short:  200ms;  /* 元素 enter / exit */
  --duration-medium: 400ms;  /* 標準過場 */
  --duration-long:   500ms;  /* 大範圍過場 */
  --ease-standard:   cubic-bezier(0.2, 0.0, 0, 1.0);
  --ease-decelerate: cubic-bezier(0, 0, 0.2, 1);
  --ease-accelerate: cubic-bezier(0.4, 0, 1, 1);
}
```

**套用**：所有 transition 改用 token，不用 `transition: all 200ms ease`

### 6.3 :focus-visible 全域（必加）

```css
:focus-visible {
  outline: 2px solid var(--tx-accent);
  outline-offset: 2px;
  border-radius: 2px;
}
```

**目前 vortex-techo.css / vortex.css 都沒設** — 鍵盤 user 看不到焦點。

---

## 7. a11y / performance

### 7.1 Skip link（必加）

在 baseof.html 開頭加（不過會影響其他頁 — 需評估）：

```html
<a class="skip-link" href="#main">跳至主內容</a>
```

**評估**：baseof.html 影響全站 — 改成只 vortex section 加？需站主拍板。

**替代**：在 vortex 自己的 layout 加（接受 `class="tx-page"` / `class="vx-page"` 開頭）

### 7.2 ARIA 修補（per design-principles §4.2）

**vortex 內頁可能命中 11 項**，逐項評估：

| # | 失敗模式 | vortex 現況 |
|---|---------|-----------|
| 1 | 圖片缺 alt | ⚠ SVG 圖示未驗證每個都有 title |
| 4 | 鍵盤不可操作 | ⚠ vortex.js 切換面板若用 onclick |
| 5 | focus 不可見 | ✗ 全域未設 :focus-visible |
| 6 | 缺 skip link | ✗ 未實作 |
| 7 | 標題層級混亂 | ⚠ 需逐頁 audit |
| 8 | 語意不當 | ⚠ `<div>` 排版 master-detail 應用 section/article |
| 11 | 連結文字脫離上下文 | ⚠ 「閱讀更多」要驗證 |
| 12 | 觸控目標 < 24px | ⚠ mobile 點擊區需驗證 |
| 14 | 頁面無 title | ⚠ Hugo template 應自動填 |
| 15 | 狀態訊息未公告 | ⚠ quiz / 錯誤訊息 |
| 17 | focus 被固定元素遮擋 | ⚠ nav 固定頂部 |

### 7.3 axe-core / pa11y（必跑一次）

**沒跑就不知道有什麼問題**。執行：
1. `npm install -g @axe-core/cli`（或 pa11y）
2. 跑 `axe https://hangsau.github.io/cortex/vortex/`
3. 對 8 個 vortex URL 跑（home / 4 式 / database / psychology / levels / periodization）
4. 產出 failing rules → 修

**預估工作量**：~2 小時（執行 + 修高 priority）

### 7.4 PageSpeed Insights baseline

跑一次 Lab + Field 數據，建 baseline：
- LCP / INP / CLS / FCP / TTFB
- Mobile vs Desktop
- 跟設計目標（CLS ≤ 0.1, LCP ≤ 2.5s）對照

---

## 8. Design craft 補強（5 個）

### 8.1 5-agent usability testing（可選 — O3）

**per design-craft §5.3**：派 5 個 sub-agent 模擬 5 種 vortex 使用者：
1. 好奇者 — 還沒決定要不要投入 10 分鐘
2. 學游痛點者 — 帶具體痛
3. 家長 — 孩子在學、想知道進度正常嗎
4. 教練 — 完整工具集查詢
5. 中間層選手 — 卡在瓶頸

**每個 sub-agent 任務**：
- 收到具體任務（例：「我想找換氣嗆水怎麼改善，從 vortex-home 開始走」）
- 描述每一步看到什麼、期待什麼、實際看到什麼
- 標出 confusion points

**產出**：confusion points list → actionable improvements

### 8.2 multi-agent design critique（可選 — O4）

**per design-craft §6.1**：派 5 個 sub-agent 各用一個 lens：
1. 互動設計（Material Motion / Apple HIG）
2. 視覺衝擊（Awwwards / Typewolf）
3. a11y（WCAG + axe-core）
4. 內容連貫性（NN/g heuristics + Information Scent）
5. 受眾適配（entry-wayfinding 五道牆）

**每個 agent 給 finding list + severity**，主 agent 整合。

### 8.3 Playwright 截圖 + Read vision（可選）

**per design-craft §6.1 path 1**：Playwright 跑 vortex 8 頁 → 截圖 → Read 看
- 看整體感覺 / 留白 / 色彩 / typography
- 看不一致的地方

### 8.4 訂閱策展網站（站主可做 — O3）

**per design-craft §2.4**：訂閱 Typewolf / Awwwards / Godly，每日 5-15 分鐘
- 站主自己跑 — AI 不能代勞（但可以每日 digest 摘要推送）

### 8.5 41 項 non-reskin-checklist 打勾（必做）

每次 commit 前逐項打勾（per non-reskin-checklist.md v2）。

---

## 9. 41 項 checklist 預評（哪些 ✓ / ✗ / 部分）

> 對應 non-reskin-checklist.md v2（41 項 = 10 + 8 + 10 + 5 + 8）。

### 9.1 結構決策（10 項）

| # | 項目 | 預評 | 原因 |
|---|------|------|------|
| 1.1 | 主焦點 hero | ✓ | vortex-home 已有 tx-mast |
| 1.2 | 落地 3 秒找得到 | 部分 | 4 section 等重，未重排為 3 群 |
| 1.3 | L0–L6 mini 階梯 | ✗ | 只 psychology 有，未抽 partial |
| 1.4 | 資料庫降級 | ✓ | 已在「依需求找」卡 |
| 1.5 | 場景式呈現 | 部分 | psychology 處境卡是，其他 section 沒 |
| 1.6 | 使用者自選深度 | ✓ | master-detail + rail 已是 |
| 1.7 | 節點預先定義 | ✓ | rail 結構是 |
| 1.8 | 視覺片段+文字+可操控 | ✓ | drill card 已是 |
| 1.9 | Cognitive Gate | 部分 | L0 沒穩不給看 L3 未系統化 |
| 1.10 | 同時服務新手+老手 | ✓ | rail 提供兩種讀法 |

**小計**：✓ 5 / ✗ 1 / 部分 4

### 9.2 Typography（8 項）

| # | 項目 | 預評 |
|---|------|------|
| 2.1 | Measure 對 | ✓（techo 880px ≈ 38em） |
| 2.2 | 行高 1.7-1.85 | ✓（techo 1.875） |
| 2.3 | Modular scale | ✗（hardcoded） |
| 2.4 | Baseline grid | ✓（techo 30px 物理化） |
| 2.5 | 字型非螢幕妥協 | ✓（Shippori Mincho） |
| 2.6 | Web font preload | ✗ |
| 2.7 | CLS ≤ 0.1 | 部分（待測） |
| 2.8 | mobile measure ≤ 75em | ✓ |

**小計**：✓ 5 / ✗ 2 / 部分 1

### 9.3 互動 / a11y / performance（10 項）

| # | 項目 | 預評 |
|---|------|------|
| 3.1 | :focus-visible | ✗ |
| 3.2 | prefers-reduced-motion | ✗ |
| 3.3 | Skip link | ✗ |
| 3.4 | axe-core / pa11y CI | ✗ |
| 3.5 | SVG title / aria-label | 部分 |
| 3.6 | aria-live | 部分（quiz 有） |
| 3.7 | 觸控目標 ≥ 24px | 部分（待驗證） |
| 3.8 | 320px reflow | 部分（待驗證） |
| 3.9 | font size-adjust | ✗ |
| 3.10 | PageSpeed CLS / LCP | 部分（待測） |

**小計**：✓ 0 / ✗ 5 / 部分 5

### 9.4 設計原理溯源（5 項）

| # | 項目 | 預評 |
|---|------|------|
| 4.1 | 每個決策有權威依據 | 部分 |
| 4.2 | 每個結構對應真實前例 | 部分 |
| 4.3 | 避開文件站血統 | ✓（master-detail 不是目次） |
| 4.4 | 避開 audience-based | ✓（沒有 role 入口） |
| 4.5 | 避開等重列 | ✗（4 section 等重） |

**小計**：✓ 2 / ✗ 1 / 部分 2

### 9.5 Design craft review（8 項）

| # | 項目 | 預評 |
|---|------|------|
| 5.1.1 | Visibility | 部分 |
| 5.1.2 | Match Real World | ✓（連結 label 白話） |
| 5.1.3 | Consistency | ✗（techo + vx 兩套） |
| 5.1.4 | Recognition | ✓（rail 常駐） |
| 5.1.5 | Minimalist | 部分（hero 多元素） |
| 5.2.1 | Duration tokens | ✗ |
| 5.2.2 | Motion patterns | 部分（details 收合是 fade-through，其他未驗證） |
| 5.2.3 | Reduce Motion | ✗ |

**小計**：✓ 2 / ✗ 3 / 部分 3

### 9.6 總計

**✓ 14 / ✗ 12 / 部分 15**

**解讀**：
- ✓ 14 項是站主之前的累積決策（techo 改 typography + master-detail 等）
- ✗ 12 項是 a11y / 互動細節 + 結構決策 — **這是 v2 要補的**
- 部分 15 項要逐個驗證 + 修

**目標**：v2 完成後 ✓ 30+ / ✗ < 5 / 部分 < 5

---

## 10. 階段計畫

### Phase 0 — 站主拍板（**不做任何 commit**）

站主 review 本計畫，決定：
- O1：techo 推廣（A）vs vx 統一（B）vs 混搭（C）
- ~~O2：DESIGN_SYSTEM.md 補建~~ **已作廢**（該檔早已存在，見 §13 O2）
- O3：5-agent usability testing 是否跑
- O4：multi-agent design critique 是否跑
- O5：是否買商業字型

**預估**：站主 review + 拍板 — 30 分鐘

### Phase 1 — Typography + a11y baseline（**最安全、可逆**）

**目標**：在不動 layout 結構下，加 typography + a11y 改進

**動作**：
1. 加 modular scale 變數到 vortex-techo.css
2. 把 hardcoded 字級改用變數（techo 12-15 處）
3. 加 `:focus-visible` 全域
4. 加 `prefers-reduced-motion` media query
5. 加 duration / easing tokens
6. 加 skip link（只 vortex 內）
7. Web font preload + `size-adjust`
8. 跑 axe-core / pa11y audit 一次（產出清單）

**Commit**：`vortex: typography + a11y baseline (Phase 1)`
**預估工作量**：~6-10 小時
**風險**：低（不動結構）

### Phase 2 — 結構重排（**核心結構決策**）

**目標**：依 O1 決策執行

**動作**（如果選 A）：
1. vortex-home.html 重排為 3 群 + 1 摺合區
2. 加痛點卡到群 1
3. 群標籤放大（21px → 28-34px）
4. 抽 `layouts/partials/vortex/mini-ladder.html`
5. 在每個 vortex 內頁加 mini-ladder

**動作**（如果選 B）：
1. 撤掉 techo，home 改回 vx
2. 刪除 vortex-techo.css
3. 重新設計 home 結構（vx 風格）

**動作**（如果選 C）：
1. 維持兩套 CSS
2. 設計過渡動畫
3. 決定每頁用哪個的規則文件化

**Commit**：`vortex: 結構重排 3 群 + 1 摺合區 (Phase 2)`
**預估工作量**：~10-20 小時（選 A）/ ~3-5 小時（選 B）
**風險**：中（動 layout 結構）

### Phase 3 — 內頁統一（**最大工作量**）

**目標**：把 Phase 2 的風格決策推廣到所有內頁

**動作**（如果選 A）：
- 12 個 vortex layout 改 tx-* class
- vortex.css 1568 行砍到 ~600 行（保留 fallback）
- 每頁跑 Playwright 截圖驗證
- 每頁 41 項 checklist 打勾

**動作**（如果選 B）：
- 不動

**Commit**：`vortex: 內頁統一 techo 風格 (Phase 3)`
**預估工作量**：~20-40 小時
**風險**：高（最易破壞既有內容）

### Phase 4 — Design craft（**驗證**）

**目標**：跑 AI 設計批評，驗證重構結果

**動作**：
1. 跑 axe-core / pa11y（如果 Phase 1 沒跑）
2. 跑 PageSpeed Insights baseline
3. 跑 5-agent usability testing（如果 O3 同意）
4. 跑 multi-agent design critique（如果 O4 同意）
5. Playwright 截圖 + Read vision 看
6. 41 項 checklist 全部打勾
7. 寫 redesign-completion-report.md（給未來 AI 看的）

**Commit**：`vortex: design craft verification (Phase 4)`
**預估工作量**：~4-8 小時（如果跑 sub-agent）
**風險**：低（驗證階段，不動結構）

---

## 11. 站主審查點

每個 Phase 結束前必須站主 review：

| 階段 | 站主審查什麼 |
|------|------------|
| Phase 0 | 計畫 review + 5 個 O 拍板 |
| Phase 1 commit 前 | 跑 hugo build + 截圖確認 typography + a11y 改動 |
| Phase 2 commit 前 | 跑 hugo build + Playwright 桌面+手機截圖 |
| Phase 3 commit 前 | 每頁 41 項 checklist 打勾 + 截圖 |
| Phase 4 完成 | redesign-completion-report.md review |

**review tool**：HANDOFF.md 加每個 Phase 的 commit + 站主 review 紀錄

---

## 12. 風險與退路

| 風險 | 退路 |
|------|------|
| Phase 3 改到一半發現某頁不適合 techo | 退回 Phase 2 決定 → 改選 B（vx 統一） |
| 5-agent usability testing 跑不動 | 改人工測（站主自己或找朋友） |
| multi-agent critique 跑太久 | 跳過（用 vision LLM 看截圖代替） |
| Phase 1-3 token 超支 | 暫停，產出 report 給站主 review |
| Skip link 加 baseof.html 影響其他頁 | 改只 vortex section 加 |
| Web font 換字型授權風險 | 維持 Google Fonts（OFL） |
| Playwright 截圖看不到問題 | 改 PageSpeed Insights + axe-core |

---

## 13. 開放問題（站主必拍板 — 5 個）

### ⭐ O1 — 全站風格統一決策（核心）

- (A) **techo 推廣**（推薦 — 站主主動改 home 是品味決定）
- (B) **vx 統一**（保守 — 撤掉 techo）
- (C) **混搭**（折衷 — 但要設計邏輯）

**影響整個計畫的策略選擇**。

### O2 — DESIGN_SYSTEM.md 補建

> ⛔ **本問題已作廢（2026-07-31 修正）— 前提錯誤，不要據此行動。**
>
> `DESIGN_SYSTEM.md` **一直都存在**，路徑是 `C:\claudehome\resources\notes\DESIGN_SYSTEM.md`，且已被 `claudehome/CLAUDE.md` 列為所有視覺設計任務的必讀前置。本研究是在 VM 內以 `~/projects/cortex/` 這個不存在的 Unix 路徑 grep，才誤判為「不存在」。
>
> (A)/(B)/(C) 三個選項全部無效。**照 (B) 補寫會造出第二份設計規範，直接違反單一真相來源。**
>
> 實際處置：本研究 §3 互動細節與 §5 CLS 的可用內容已於 2026-07-31 併入 DESIGN_SYSTEM.md 的**鐵則 I（狀態、動效與載入穩定）**；§2 / §4.1 與既有鐵則 C/D/E 重複，未重複收錄。

### O3 — 5-agent usability testing

- (A) 跑完整版（5 sub-agent）
- (B) 跑部分（先跑 1-2 個最關鍵 persona）
- (C) 不跑（等真人測試時機）

### O4 — multi-agent design critique

- (A) Phase 4 跑完整版（5 lens）
- (B) 跑部分（只 a11y + 視覺）
- (C) 不跑（用站主自己 review 取代）

### O5 — 商業字型

- (A) 不買（維持 Google Fonts OFL）
- (B) 買 Soehne 或 Inter Display（需站主拍板財務）

**目前 Shippori Mincho + Courier Prime + Source Serif 4 都是 OFL，沒迫切需要**。

---

## 14. 開始工作前的檢核

站主 review 本計畫 + 拍板 O1-O5 後，我才開始。

**檢核表**：

- [ ] 站主讀完 §0-§13
- [ ] 站主拍板 O1（核心 — techo / vx / 混搭）
- [x] ~~站主拍板 O2（DESIGN_SYSTEM.md）~~ — 已作廢，前提錯誤
- [ ] 站主拍板 O3（5-agent usability）
- [ ] 站主拍板 O4（multi-agent critique）
- [ ] 站主拍板 O5（商業字型）
- [ ] 站主對 41 項 checklist 預評有修正意見
- [ ] 站主對階段計畫有調整（Phase 1-4 順序 / 工作量 / 風險）
- [ ] 站主確認 commit 前站主 review 機制

**全部打勾才開始 Phase 1**。

---

## 15. 終止

> 本計畫**不是報告** — 是工作合約。站主 review + 拍板 → 我執行 → 41 項 checklist 打勾驗證 → 不換皮。
>
> 上次 minimax-vortex v4 的失敗教訓（per L5 insight）：
> - 換皮 ≠ 重做
> - 入口卡數量、視覺風格、敘事語氣都不是「重做」的本質
> - 結構 / 互動 / 導覽邏輯才是
> - 大量換皮 commit 因為「看起來一樣」反而比小範圍結構改動更難審
>
> 這次 v2 計畫的核心：**O1 風格統一是結構決策（不只是視覺）**。Phase 1-3 都基於這個決策推進。
>
> 等站主 review。
