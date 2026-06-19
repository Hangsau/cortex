# Vortex 視覺改造 brief（2026-06-19）

> 任務：用 web-ux-kit 研究改造 vortex 外觀。新風格，禁止沿用現在的 techō 樣式。
> 保留已驗證的資訊架構（master-detail / 處境軸 / 收合落地 / 短導航標籤）—— 那是「結構」不是「樣式」。
> 只換視覺層（vortex.css :root + 字體 + 半像素清理），不動 layout 結構、JS、canonical/data。

## 風格決策（依 DESIGN_SYSTEM.md 強制說明）

- **舊**：02 日式文具（techō）— 暖紙 #FAFAF7 / 柿橘 #D4622A / Shippori Mincho + Courier Prime。
- **新**：**06 博物館說明牌（Museum Label）× web-ux-kit CJK 字體 token**（混搭一個維度＝字體/度量）。
- **為何**：① 與 techō 的「暖文具」氣質做最大反差（冷靜畫廊感 vs 暖手帳）→ 滿足「禁止沿用」且一眼看得出換了。② 博物館風的「大標＋細內文＋大量留白＋隱形網格」正好展示 web-ux-kit 的閱讀/留白研究。③ 銅綠 #5B7B6F 與 techō 橘、舊學術海軍藍都區隔。
- **CJK 調整**：博物館原案內文 14px，但依 web-ux-kit「CJK 內文 16px 下限」決定，內文用 16px（非 14）；行高 1.8（CJK）；行長 34rem（≈34 漢字，修舊 38em 偏寬）。這是「借博物館的配色＋大標對比，內文度量走我們的 CJK kit」的合理混搭。

## Token 對照（vortex.css :root）

| token | 舊（techō） | 新（Museum × kit） | 依據 |
|-------|------------|-------------------|------|
| --vx-bg / ground | #FAFAF7 | **#F8F6F1** | 博物館展覽白牆 |
| --vx-paper | #fdfdfb | **#FFFFFF** | 浮層乾淨白 |
| --vx-paper2 | #f4f1e8(暖) | **#EFEDE6**(冷) | hover/斑馬，去暖 |
| --vx-ink | #1A1A1A | **#2C2C2C** | 博物館深炭灰；on bg ≈12:1 ✅ |
| --vx-sub | #56564e | **#6B6B63** | 次要；≈5.5:1 ✅ |
| --vx-faint | #88887e | **#8A8A80** | meta/label |
| --vx-accent | #D4622A(橘) | **#5B7B6F**(銅綠) | 博物館金屬氧化綠；≈3.3:1 → 僅 ≥24px/非文字 |
| --vx-accent2(小字) | #B5511F | **#3E574D**(深銅綠) | 小字連結/強調；≈6.5:1 ✅（web-ux-kit 05 處方）|
| --vx-gold | #a98321 | **#8C7544**(冷青銅) | 引用左框/來源 |
| --vx-rule | #E8E8E0 | **#D8D4CC** | 博物館淡暖灰線 |
| --vx-serif(內文) | Noto Serif TC… | **Noto Serif TC**（保留 CJK serif）| 04 CJK 可讀 |
| --vx-display(大標) | Shippori Mincho | **Cormorant Garamond** + Noto Serif TC | 博物館高對比展覽 serif |
| --vx-mono(標籤/數) | Courier Prime | **Quattrocento Sans** + Noto Sans TC | 博物館細無襯線說明 |
| body font-size | 17px | **16px**（--fs-base）| web-ux-kit CJK 下限 |
| body line-height | 1.75 | **1.8**（--lh-body）| 04 處方2 CJK ≥1.7 |
| --vx-measure | 38em | **34rem**（≈34 漢字）| 04 處方1 行長≤40，修偏寬 |

## 加入 web-ux-kit 結構 token（新增到 :root，供現有與未來規則用）
- 7 級字級 --fs-xs..2xl（13/14/16/18/21/27/34，無半像素）
- --lh-body/snug/tight = 1.8/1.6/1.35
- --sp-1..8 = 4/8/16/24/32/48/64/96（8px grid）

## 半像素清理（web-ux-kit 03/04，audit P0#2）
全檔 sed：11.5→13 · 12.5→13 · 13.5→14 · 14.5→14 · 15.5→16 · 16.5→16 · 17.5→18。
大型展示數字（22/24/27/30px）刻意保留 = 博物館大標對比，不在清理範圍。

## 字體載入
13 個 vortex layout 各自的 Google Fonts `<link>`（Shippori 字串）→ 換成
`Cormorant+Garamond:ital,wght@0,500;0,600;1,500 + Noto+Serif+TC + Quattrocento+Sans`。
mnfl/ust/temperament 用不同字串，不動。

## 不動
layout 結構 / vortex.js / canonical / data / 已驗證 IA（處境卡、短 nav、收合落地、定位梯）。
dead code `.vx-jrn-*`（journey 已退役、無 layout 引用）：不渲染，本輪不特別處理。
