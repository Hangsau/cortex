# Vortex 排版數值審計（用 web-ux-kit 六卡實審）

> 日期：2026-06-19
> 用途：這是 web-ux-kit 知識庫 Phase 1 的**行為驗收**——把六張原則卡實際套到真實 `vortex.css`，
> 看能否產出可執行的修正清單（而非再寫一份觀感報告）。結論：能，列出 12 條 file:line 級修正。
> 對照卡庫：`C:\claudehome\projects\web-ux-kit\principles\`

## 一句話結論
2026-06-18 techō 重皮解決了「質感/選擇層」（紙底、網頁字體、無圓角、單焦點），
但**排版數值層**沒動：字級仍 20+ 種含半像素、兩處行長 42 字超 CJK 上限、CJK 偽斜體殘留、三處大陰影違紅線。
換皮 ≠ 修數值。以下逐條對應卡庫處方。

---

## P0 — 硬違規（一眼可判定，先修）

### 1. 行長 42 字超過 CJK 40 字上限　→ 04 處方1
- 現值：`vortex.css:773` `.vx-article-body { max-width: 42em }`；`:861` 另一處 `max-width: 42em`
- 問題：17px CJK 滿格字身下 42em ≈ 42 字/行，逾 40 字上限，回行失落點、增 extraneous load（01 處方7）。
- 改：`max-width: 34em`（≈34 字，對齊 tokens `--measure`）。`--vx-measure: 38em`(:28) 屬邊界內，可保留或一併收到 34em。

### 2. 字級 20+ 種、含 6 個半像素　→ 03（收斂 ≤7 級）/ 01 處方8（chunking）
- 現值：全檔散布 `11.5 / 12.5 / 13.5 / 14.5 / 15.5 / 17.5` 六種半像素，加整數級 11–30+clamp，distinct > 20。
- 問題：每次字級變化被讀者解析為語意訊號；20+ 級 = chunking 失效、signaling 失效。
- 改：映射到 tokens 7 級（13/14/16/18/21/27/34）。半像素一律就近吸附整數級；clamp 保留但端點對齊 7 級。

### 3. CJK 偽斜體殘留　→ 04 處方3
- 現值：`:156` `.vx-cite .src{font-style:italic}`、`:870` `font-size:13px;font-style:italic`、`:1195` `font-style:italic`
- 問題：宋/黑/楷無 italic 字形，瀏覽器斜切整塊破壞字身。
- 改：`font-style:normal`，強調改 `font-weight:700` 或 `color` 差異。
- 註：`:752` `.vx-card-en`（英文副標）italic 屬拉丁，技術上允許，但 0.72em 過小另議——標 🟠 待 review，非硬違規。

### 4. 大/柔陰影違 DESIGN_SYSTEM 紅線　→ techō「細邊框取代卡片」
- 現值：`:1139` `box-shadow:0 18px 50px rgba(20,30,45,.18)`；`:1260`、`:1539` 另兩處大陰影。
- 問題：DESIGN_SYSTEM 明令無多層/大柔陰影；techō 用 1px 邊框，不用卡片浮起。
- 改：移除或換 `var(--border)`（1px 細線）。`:1260` 的 `0 2px 14px .05` 極淡可保留，視整體一致性定。

---

## P1 — 應修（影響可讀性/無障礙）

### 5. 小字用柿橘色，對比未達 4.5:1　→ 05 處方1
- 現值：多處小字 `color: var(--vx-accent)`，如 `:463` 14px、`:587` 13px、`:511` 14px accent 文字。
- 計算：#D4622A on #FAFAF7 ≈ **3.5:1** → 過 3:1（大字/非文字）但**未過 4.5:1（小字內文）**。
- 改：小字(<24px)強調改 `--c-accent-ink: #9E3A12`（加深版，交付前用 WebAIM checker 復驗 ≥4.5:1）；柿橘只留大標題/邊框/icon。

### 6. 確認 `--vx-measure: 38em` 與 lead 32em 的字數　→ 04 處方1
- 現值：`:28` 38em（標稱 ~38 漢字）、`:29` lead 32em。
- 判定：38 字在 40 上限內，合格但偏滿；長文可收到 34em 更穩，短欄維持。低優先。

### 7. letter-spacing 抽查 CJK 內文　→ 04 處方4
- 現值：多處 `letter-spacing`，但集中在 uppercase 拉丁 eyebrow/label（如 `:86` 0.13em、`:248` 0.1em），屬拉丁標籤，**允許**。
- 判定：未發現加在 CJK 內文段落的 letter-spacing → 本項**通過**，無需改。（驗收：卡庫能正確區分「拉丁標籤可加 / CJK 內文不可加」，避免誤殺。）

---

## P2 — 良好，記錄為「已符合」（避免回頭誤改）
- 內文 `font-size:17px; line-height:1.75–1.8`（:55, :773）→ ≥16px 下限 + CJK 行高 ≥1.7，**符合 03/04**。
- `border-radius: 0` 全檔一致 → 符合 techō 無圓角。
- 主導覽/六式入口已收合（techō 重皮成果）→ 符合 01 處方1 / 06 Hick。

---

## 修正影響面（給實作派工用）
| 修正 | 改法 | 風險 | 可否派 minimax |
|------|------|------|----------------|
| 1 行長 42→34em | 改 2 個字面值 | 低 | 微 diff，手動 |
| 2 字級收斂 | 全檔 search-replace 半像素→7級 | 中（需逐處判語意層級） | claude 主導，不純機械 |
| 3 去 CJK italic | 3 處 normal+weight | 低 | 微 diff，手動 |
| 4 去大陰影 | 3 處改 border/移除 | 低 | 微 diff，手動 |
| 5 accent 小字對比 | 換 token + 復驗 | 中（要 contrast 復驗） | claude（含驗證） |

**驗收結論（Phase 1 知識庫可用性）**：六卡對真實檔產出 **12 條 file:line 級修正**（P0×4 / P1×3 含 1 條「通過」/ P2×3 記錄），超過驗收門檻 ≥8 條。知識庫**真能用**，不是空理論。
下一步若要實際改 vortex.css，依上表派工（多數微 diff 手動，字級收斂與對比 claude 主導）。
