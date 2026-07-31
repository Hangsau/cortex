# 不換皮 checklist — vortex 重做時逐項打勾

> 用途：下次 vortex 整站重做時，AI 提交 prototype 前逐項打勾驗證結構有沒有真的改；站主 review 時也逐項驗證。
>
> 來源：本 checklist 從 `design-principles-deep-dive.md` §9 抽出獨立成檔，並在 v2 加上 `design-craft-meta-research.md` §6 的「craft review」段 — 目的是讓下次接手者**只讀這檔就能驗證**，不必讀完整兩份研究。
>
> 觸發：站主 L5 insight `2026-06-18-redo-vs-reskin.md`（換皮 ≠ 重做）。上次 minimax-vortex v4 取消（commit 4504e02, 2026-06-18）就是沒帶這份 checklist。

---

## 0. 使用方式

每次提交 vortex redesign prototype（無論新站還是局部重做）時：

1. AI 提交 PR / prototype 時，每個項目標 `✓` / `✗` / `部分` + 對應 commit / CSS 行 / 文檔段
2. 站主 review 時逐項驗證
3. ✗ 多於 ✓ → 退回（per insight「如果 ✗ 多於 ✓，先停下」）
4. 完成後把 checklist 連同 prototype 一起 commit 進 `research/vortex-rebuild/`

---

## 1. 結構決策（10 項）

> 對應既有三份研究：vortex-rebuild（網站形狀）+ entry-wayfinding（IA）+ presentation-layout（視覺層級）

- [ ] **1.1** 有沒有一個主焦點 hero？**不是 12 個等重入口**（presentation-layout §4.1）
- [ ] **1.2** 首頁是否「落地 3 秒內找得到自己該讀哪」？**不是「按線性順序看完」**
- [ ] **1.3** 每個 section 開頭有沒有 L0–L6 mini 階梯定位？（entry-wayfinding H4）
- [ ] **1.4** 資料庫 / 查詢類頁面有沒有降級到 footer 或摺合區？（presentation-layout §4.5）
- [ ] **1.5** 有沒有用「場景式呈現」取代「教科書目錄」？（entry-wayfinding H1-H5 + IKEA 範例）
- [ ] **1.6** 有沒有「使用者自選深度」而非「系統替他分流」？（vortex-rebuild 雙軸自選入口）
- [ ] **1.7** 節點座標是否預先定義、非 force-directed？（vortex-rebuild roadmap.sh 經驗）
- [ ] **1.8** 「視覺片段 + 文字 + 可操控工具」三件式有沒有用在動作教學？（vortex-rebuild Brilliant / Muscle&Motion）
- [ ] **1.9** Cognitive Gate 有沒有刻意收起深層？（vortex-rebuild Nicky Case；L0 沒穩不給看 L3）
- [ ] **1.10** 新架構是否同時服務新手 + 老手？（不偏廢任一）

## 2. Typography 決策（8 項）

> 對應 design-principles-deep-dive.md §2

- [ ] **2.1** Measure 在 **32–40em（漢字）** / **60–75 字元（拉丁）**？（Butterick《Practical Typography》§line-length）
- [ ] **2.2** 漢字內文 **line-height 1.7–1.85**？（Butterick《Practical Typography》§line-spacing）
- [ ] **2.3** 有無使用 modular scale 或至少視覺階梯合理？（Tim Brown《More Meaningful Typography》）
- [ ] **2.4** Baseline grid 或 spacing scale 變數有沒有建立？（Wilson Miner A List Apart 2007）
- [ ] **2.5** 字型選擇不是「螢幕妥協」字型（Georgia / Calibri 之類）？（Butterick §screen-reading）
- [ ] **2.6** Web font 有 preload？（改善 CLS）
- [ ] **2.7** **CLS ≤ 0.1**？（web.dev CLS 75th percentile 良好門檻）
- [ ] **2.8** 沒有把 measure 拉超過 75em 在 mobile 上？（避免 mobile 全寬長行崩潰）

## 3. 互動 / a11y / performance（10 項）

> 對應 design-principles-deep-dive.md §3 + §4 + §5

- [ ] **3.1** **`:focus-visible` 全域設定**？（WCAG 2.4.7 + NN/g Focus State）
- [ ] **3.2** **`prefers-reduced-motion` media query**？（WCAG 2.3.3 + 前庭功能障礙支援）
- [ ] **3.3** **Skip link** 在 baseof.html 開頭？（WCAG 2.4.1）
- [ ] **3.4** **axe-core / pa11y CI gate**？（自動 a11y 驗證）
- [ ] **3.5** SVG 圖示都有 `<title>` 或 `aria-label`？（WCAG 1.1.1）
- [ ] **3.6** `aria-live` region 用於 quiz / 錯誤訊息？（WCAG 4.1.3）
- [ ] **3.7** Mobile 觸控目標 **≥ 24px**？（WCAG 2.5.8）
- [ ] **3.8** Reflow 在 **320px 寬無水平捲動**？（WCAG 1.4.10）
- [ ] **3.9** Web font 有 `size-adjust` 處理 fallback？（避免 CLS 字型位移）
- [ ] **3.10** PageSpeed Insights **CLS ≤ 0.1** + **LCP ≤ 2.5s**？（Core Web Vitals 良好門檻）

## 4. 設計原理溯源（5 項）

> 對應 design-principles-deep-dive.md §6 + §7

- [ ] **4.1** 每個設計決策有「為什麼這樣做」的權威依據？（不是「好看」）
- [ ] **4.2** 每個結構決策對應到至少一個真實前例？（shadcn/ui / Linear / Stripe / Tailwind / Mintlify 至少一個）
- [ ] **4.3** 避開了文件站血統的目次清單？（vortex-rebuild §1.3 反例 — Docusaurus / Starlight）
- [ ] **4.4** 避開了 audience-based navigation？（entry-wayfinding §3 反例 — Khan Academy）
- [ ] **4.5** 避開了「等重列」的版面策略？（presentation-layout §2.4 反例 — 12 條目同重）

## 5. Design Craft Review（8 項，v2 新增）

> 對應 `design-craft-meta-research.md` §3 + §6 + §7 — 補上次缺的「互動品味 / 視覺衝擊」檢核

### 5.1 NN/g 10 Usability Heuristics（核心 5 條）

> 完整 10 條見 `design-craft-meta-research.md` §3.1 + `https://www.nngroup.com/articles/ten-usability-heuristics/`。vortex 是「靜態內容站 + 大量章節」，以下 5 條最相關。

- [ ] **5.1.1** **Visibility of System Status**：master-detail 切換時的視覺反饋（fade + rail active 同步）？（NN/g #1）
- [ ] **5.1.2** **Match Real World**：連結 label 用「划手分解」不用「Propulsion analysis」？（NN/g #2）
- [ ] **5.1.3** **Consistency and Standards**：`.vx-toc-row` / `.vx-level` / `.vx-card` 等元件全站視覺一致？（NN/g #4）
- [ ] **5.1.4** **Recognition Rather Than Recall**：導覽常駐、已選篩選條件即時顯示？（NN/g #6）
- [ ] **5.1.5** **Aesthetic and Minimalist**：首頁 hero 不超過 3 個元素（標題 + lead + CTA）？（NN/g #8）

### 5.2 互動品味（3 條）

> 對應 `design-craft-meta-research.md` §4 — Material Motion + Apple HIG

- [ ] **5.2.1** **Duration tokens**：互動過場用 Material 3 標準（Short 200ms / Medium 400ms / Long 500ms）？（material.io/styles/motion）
- [ ] **5.2.2** **Motion patterns**：狀態切換用「Fade Through」、元素變形用「Container Transform」、不濫用彈簧動畫？（material.io 4 patterns）
- [ ] **5.2.3** **Reduce Motion**：`prefers-reduced-motion: reduce` 時自動降級為 crossfade / 直接切換？（Apple HIG + WCAG 2.3.3）

---

## 6. 提交格式範本

提交 checklist 時，建議這樣寫：

```markdown
## 非換皮驗證（2026-XX-XX vortex redesign prototype）

### 1. 結構決策
- [✓] 1.1 有主焦點 hero — `layouts/vortex/vortex-home.html:14` `.vx-start` 放大到 30px
- [✓] 1.2 落地 3 秒找得到 — Layer-cake pattern（presentation-layout §2.2）
- [✗] 1.3 L0–L6 mini 階梯 — **未做**（deferred，下個 sprint）
- ...

### 2. Typography 決策
...

### 3. 互動 / a11y / performance
...

### 4. 設計原理溯源
...

### 5. Design Craft Review
- [✓] 5.1.1 Visibility — fade 過場已實作
- [✓] 5.1.2 Match Real World — 連結 label 用白話
- [✗] 5.1.3 Consistency — `.vx-card` 在 stroke 頁 vs psychology 頁樣式有差
- ...

### 6. 自評

✓ 33 / ✗ 8 / 部分 0

✗ 8 項中：
- 1.3 L0–L6 mini 階梯：未做，原因 X
- 2.4 baseline grid：未做，原因 Y
- 5.1.3 Consistency：.vx-card 跨頁差異待修，原因 Z
...

依 insight `2026-06-18-redo-vs-reskin.md` §How to apply 第 5 條：「做不到就說做不到。如果研究結論 X 條，只能實踐 30%，不要交 100% 換皮。明確說『研究結論 X 沒做，因為 Y』比『交一個看起來完整但核心沒做的版本』好。」
```

---

## 7. 來源

- `research/vortex-rebuild/design-principles-deep-dive.md` §9（§1–§4 完整版）
- `research/vortex-rebuild/design-craft-meta-research.md` §6 + §3（v2 craft review 段）
- `~/.claude/memory/insights/2026-06-18-redo-vs-reskin.md`（換皮 ≠ 重做）
- `~/projects/cortex/HANDOFF.md` §「minimax-vortex 計畫取消」（實戰案例）
- `https://www.nngroup.com/articles/ten-usability-heuristics/`（NN/g 10 heuristics）

---

**記**：每次重做前先讀本檔。✗ 多於 ✓ 退回。

