---
title: "極化訓練（Polarized Training）與訓練強度分布（TID）"
description: "極化訓練不是游泳的唯一解：游泳選手多數是金字塔型分布，而且依主項距離不同。"
slug: "polarized-training-seiler"
layer: "research"
layer_name: "研究筆記"
research_status: "研究中"
weight: 43
note_kind: "literature"
note_theme: "training"
note_role: ""
draft: false
---

## Stephen Seiler 框架研究筆記

> **定位**：與 Bompa 六分區框架形成對話的平行框架。Bompa 的強度語言是「佔最大表現的百分比」（zone 1–5），Seiler 的語言是「三區分布比例」（Z1/Z2/Z3）。兩套系統問的問題不同——Bompa 問「每區強度是什麼」，Seiler 問「每區各應占多少比例」。
>
> **本筆記不取代知識點**。數字反查後如需寫進強度區知識點，另外審查。

---

## ① 三區模型定義（3-Zone TID Framework）

### 生理邊界

Seiler 使用**通氣閾值**（ventilatory thresholds，VT1/VT2）作為三區的生理分界，而非固定的乳酸 mmol/L 數值。VT1/VT2 與乳酸閾值（LT1/LT2）在概念上對應，但並非完全等同：

| 區域 | 邊界條件 | 乳酸概略範圍 | 強度感受 |
|------|----------|------------|---------|
| **Z1**（低強度）| < VT1（第一通氣閾值） | ≤ ~2 mmol/L | 輕鬆、可全程對話 |
| **Z2**（閾值區） | VT1–VT2 之間 | ~2–4 mmol/L | 中強度、閾值附近 |
| **Z3**（高強度） | > VT2（第二通氣閾值） | > 4 mmol/L | 吃力、間歇訓練強度 |

- VT1 ≈ 有氧閾值，VT2 ≈ 無氧閾值（AnTh）。🟢
- 三區劃分在 TID 文獻中已是事實標準，可見 Seiler (2010) 和 Stöggl & Sperlich (2014) 的方法論。🟢
- 此三區 Z1/Z2/Z3 對應到本站週期化章的游泳三區乳酸模型，概念相通，但乳酸界線在原始文獻裡稍有浮動，不可把邊界值當精確定論。🔵

---

## ② 極化分布比例（數字）

### Seiler (2006)——菁英越野滑雪選手觀察研究

- **研究對象**：11 名男性菁英青少年越野滑雪選手
- **觀察期**：32 天（準備期 10–11 月）
- **方法**：心率監測，以 VT1/VT2 劃分三區

**關鍵比例（以訓練 session 數計）：** 🟢

| 區域 | 比例 |
|------|------|
| Z1（< VT1） | **75%** session |
| Z2（VT1–VT2） | **8%** session |
| Z3（> VT2） | **17%** session |

> 來源：Seiler & Kjerland (2006), Scand J Med Sci Sports, 16(1):49–56. DOI: 10.1111/j.1600-0838.2004.00418.x. PMID: 16430681

### Seiler (2010)——綜述：最佳實踐

- **研究對象**：每週訓練 10–13 次的國家／國際級耐力選手（綜述多項目）
- **方法**：session 數計算（非時間加權）

**關鍵比例：** 🟢

| 描述 | 比例 |
|------|------|
| 低強度 session（Z1） | **約 80%** |
| 高強度 session（Z3，≈ 90% VO2max） | **約 20%** |
| 閾值 session（Z2） | **極少（近 0%）** |

> 來源：Seiler, S. (2010). What is best practice for training intensity and duration distribution in endurance athletes? *Int J Sports Physiol Perform*, 5(3):276–291.

### 重要說明：session 數 vs 時間

「80/20」的計量單位是**session 數**（每週幾次低強度/高強度課），不是「時間百分比」。若改用時間加權計算，由於 Z1 每次時間更長，低強度的比例會更高（可能達 85–90%）。這個差異在比較不同研究時非常關鍵。🔵

---

## ③ 「避開中間區」的論點

### 為什麼極化模型主張少練 Z2（閾值區）？

Seiler (2010) 的核心觀察是：菁英耐力選手的訓練記錄顯示，Z2（閾值強度）的使用量出乎意料地少——這是「從自然行為反推最佳分布」的邏輯，不是從機制演繹出來的處方。 🟢

#### 「避開中間區」的具體論點

**論點 1：Z2 的應激-回報比不佳**
Z2 強度夠高，產生顯著的交感系統壓力和乳酸積累，但又不夠高，難以激發 Z3 那種強烈的代謝適應信號（AMPK 通路、粒線體生合成）。結果是：回收成本（疲勞）偏高，而適應刺激不如 Z3 強。🔵（機制推論）

**論點 2：大量 Z2 限制後續高強度輸出的能力**
長期累積 Z2 造成慢性疲勞積累，壓縮了練習 Z3 的空間。菁英選手需要在低強度（Z1）充分恢復，才能有品質地完成 Z3 間歇。🔵

**論點 3：Z2 訓練強度難以控制，易滑入「灰色地帶」**
閾值附近的強度對細微配速變化高度敏感；在實際課表中，「Z2」常常漂移，使課表的刺激類型難以精確控制。🟠（教練觀測）

**論點 4：從高訓練量選手行為歸納**
Seiler (2010) 指出，針對已高度訓練的選手做「強度化」介入（增加 Z2/Z3 比例）的研究，並未一致顯示長期表現提升；相比之下，維持極化分布的選手更能持續進步。🟢

#### 對閾值訓練（Threshold Model）的批評摘要

| 批評點 | 說明 |
|--------|------|
| 慢性疲勞風險 | 高訓練量下，大量 Z2 導致系統性疲勞積累，壓縮恢復窗口 |
| 適應刺激不最優 | Z2 不如 Z3 能有效刺激最大有氧能力（VO2max）的底限適應 |
| 實踐上的漂移問題 | 閾值配速很難精確維持，教練和選手容易「練到不是 Z2 的 Z2」 |
| 菁英選手自然趨避 | 觀察研究（Seiler 2006）顯示菁英選手在未被強迫時，自然少練 Z2 |

> 注意：這些批評主要針對「以 Z2 為主力強度」的閾值模型，不否定 Z2 在特定場景（如 taper 前的節奏跑、特定賽事準備）的角色。🔵

---

## ④ 三型分布對照：極化型 vs 金字塔型 vs 閾值型

### 定義（基於三區模型）

| 分布類型 | Z1 | Z2 | Z3 | 主要特徵 |
|----------|----|----|----|----|
| **極化型（Polarized）** | 最高（~75–80%） | 極少（~5–10%） | 次高（~15–20%） | 「啞鈴型」，Z2 被刻意壓低 |
| **金字塔型（Pyramidal）** | 最高 | 中（Z1 > Z2 > Z3）| 最低 | 三區由低到高遞減 |
| **閾值型（Threshold）** | 中 | 高（Z2 最高或與 Z1 相當） | 低 | Z2 為主力訓練強度 |

### 各型適用情境與支持證據

**極化型**
- 最多觀察證據來自：越野滑雪、划船、自行車、長跑的菁英選手 🟢
- 干預研究支持：Stöggl & Sperlich (2014) 是唯一隨機對照試驗，四組比較下 POL 組 VO2peak 進步最多（+11.7%），TTE 進步 +17.4%，優於高量低強度、閾值、HIIT 三組 🟢
- 建議適合：已有高訓練量底子、能完成品質 Z3 的選手；週訓練量高時（>10 sessions/週）

**金字塔型**
- 在游泳文獻中更為常見（詳見 ⑥）🟢
- 可能更適合：訓練量中等、尚未建立足夠有氧基礎的選手；中距離和長距離項目 🔵
- 金字塔型的 Z3 比例更少，容許更多量的積累

**閾值型**
- 多見於部分歐洲田徑/中距離訓練傳統（如挪威中距離跑步系統） 🟠
- 有研究顯示在特定情境（短賽季、針對閾值敏感的項目）有效果，但在 Stöggl & Sperlich (2014) 中表現不如極化型 🟢
- 適用場景：🔴 目前文獻中「閾值型在哪些場景確實優於其他型」尚無充分證據，標待查

---

## ⑤ 證據基礎

### 主要支持研究

**Seiler & Kjerland (2006)**
- 設計：觀察研究，11 名越野滑雪青少年菁英選手，32 天
- 發現：75% sessions 在 Z1、8% 在 Z2、17% 在 Z3——自然形成的極化分布
- 意義：第一篇系統量化菁英選手 TID 的研究，定義了三區模型和極化的觀察依據
- 來源：Scand J Med Sci Sports 16(1):49–56, PMID: 16430681 🟢

**Seiler (2010)**
- 設計：綜述，整合多項目（跑步、划船、越野滑雪、自行車）的菁英選手 TID 研究
- 發現：菁英選手普遍趨向約 80% Z1 + 20% Z3 的極化分布；強度化介入研究無一致長期效益
- 來源：Int J Sports Physiol Perform 5(3):276–291 🟢

**Stöggl & Sperlich (2014)**
- 設計：隨機對照試驗（RCT），48 名訓練有素耐力選手，9 週，四組（HVT、THR、HIIT、POL）
- 發現：POL 組 VO2peak +11.7%（最高）；TTE +17.4%（最高）；POL 優於 HVT、THR、HIIT 🟢
- 限制：9 週相對短；「訓練有素」而非頂級菁英；樣本混合多項目
- 來源：Front Physiol 5:33, PMC: PMC3912323 🟢

**Plews et al. 2014 / Laursen 2010（系列回顧）**
- 觀察研究顯示：跨越多個耐力項目的菁英選手，自然採用的 TID 均趨近極化，而非閾值主導 🟢
- 🔴 具體論文細節需進一步確認，此處依 Seiler (2010) 綜述的引用標 🟢；若需個別論文直接引用，升級查證

### 限制與反駁觀點

1. **Stöggl & Sperlich (2014) 是目前最強干預證據，但只有一個 RCT**——沒有多個獨立 RCT 的複製。
2. **觀察研究的歸因問題**：菁英選手自然趨向極化，可能反映的是「能承受高訓練量後才能這樣練」，而非「這樣練才能成為菁英」——因果方向有爭議。🔵
3. **「80/20」的描述性強度**：不同研究對 80/20 的測量方式（session vs 時間、不同強度邊界定義）使跨研究比較困難。🟢

---

## ⑥ 與游泳實證的對話（極化非教條）

### 游泳 TID：金字塔型更為常見

游泳的系統評估（González-Ravé et al. 2021，IJSPP 16(7)，PMID: 33952709）匯整了 9 個入選研究中的 162 個 TID 資料：

- **金字塔型**：89 例（Z1 > Z2 > Z3）— 佔多數 🟢
- **極化型**：65 例（Z1 > Z3 > Z2）— 相當常見
- **閾值型**：8 例（Z2 最高）— 少數

這直接挑戰了「極化型是耐力運動最佳解」的教條。

### TID 依主項距離分流（González-Ravé 2021 核心結論）

González-Ravé et al. (2021) 這篇系統性回顧（3487 篩至 17，最終 9 篇入選）的核心貢獻不只是「游泳偏金字塔」，更指出**高水準選手的 TID 型態依其主項距離分流**： 🟢

| 主項距離 | 主流 TID 型態 |
|----------|--------------|
| 短距離（50–100m） | 極化型 + 閾值型 |
| 中距離（200–400m） | 閾值型 + 金字塔型 |
| 長距離（800–1500m） | 以金字塔型為主 |

> 來源：González-Ravé JM, Hermosilla F, González-Mohíno F, Casado A, Pyne DB (2021). Training intensity distribution, training volume, and periodization models in elite swimmers: A systematic review. *Int J Sports Physiol Perform*, 16(7):913–926. PMID: 33952709 🟢

**證據等級限制**：此分流結論為「觀察歸納」而非「實驗驗證」——SR 9 篇入選研究中僅 3 篇為 1b 介入研究、6 篇為 2b 觀察研究。依距離分流的型態描述可信（🟢），但「某距離就該用某型態」的處方性推論仍缺 RCT 支撐。🔵

### 游泳與其他耐力項目的結構差異

| 面向 | 越野滑雪/自行車 | 游泳 |
|------|----------------|------|
| 運動連續性 | 可長時間連續低強度（2–4 小時） | 池長限制使 Z1 組長度受限，技術組本身就有強度 |
| 能量系統 | 50m 短距選手也靠大量有氧底 | 50m 選手有氧貢獻 ~20%，100m ~40–50%（能量系統多樣性更大） |
| 阻力特性 | 空氣/地面阻力較線性 | 水阻與速度平方成正比，配速略快能耗急速增加 |
| Z3 的定義困難 | 可依心率精確設置 | 游泳心率即時監測難度高，多用配速代替 |

### 衝刺選手的 TID 反直覺數據

Barbosa et al. (2019) 和 Papadimitriou et al. (2025/DOI 10.1007/s00421-025-06064-x) 顯示，即使是游泳衝刺項目（50–100m）選手，**仍有約 87–90% 的訓練量落在 Z1（低強度有氧）**，但他們的 TID 型態更接近「極化型」或「閾值型」，而非純金字塔型——這與長距離選手的「金字塔型」不同。 🟢

> **關鍵解讀**：衝刺選手的高 Z1 占比，不代表他們不需要高強度訓練——而是 Z3 的*比例*更高、Z2 被壓縮（極化特徵），只是總量仍以 Z1 為主。

### 「極化適合誰」的游泳語境詮釋

結合上述 González-Ravé (2021) 的依距離分流結論，可作出以下判讀（型態描述為觀察證據層級 🟢，但「最佳處方」仍非 RCT 驗證 🔵）：

- **長距離游泳選手**（400m+）：金字塔型更常見，因有氧能力優先、可累積更多 Z2 🟢
- **衝刺/短距離選手**（50–100m）：趨向極化型 + 閾值型，Z3 比重較高、Z2 壓縮 🟢
- **個體差異**：目前游泳 TID 文獻中，沒有一種分布型態能被宣稱為「所有游泳選手的最佳解」🟢

### 對 Bompa「每週 50% 賽配速」主張的張力

Bompa 的建議是：每週至少 50% 訓練時間落在比賽配速強度（Bompa zone 2，即 ~80–90% 最大表現）。
Seiler 的觀察是：菁英選手自然趨向 80% 低強度 + 20% 高強度，中間閾值區極少。

這兩種說法的張力在於：

- **Bompa zone 2**（賽配速，80–90% 最大表現）可能對應到 Seiler 的 **Z3 或 Z2 邊界**，不是同一個「中間區」。兩個系統的邊界定義不同，直接數字對比需要謹慎。🔵
- 若 Bompa 的「賽配速」實際上對應 Seiler 的 Z3（高強度），則「50% 時間在賽配速」反而比「80/20 極化」要求更多高強度——兩者方向完全相反。
- 若 Bompa 的「賽配速」對應 Seiler 的 Z2，則 Bompa 主張大量閾值訓練，與 Seiler 的「避開中間區」直接衝突。
- **目前本站週期化章使用 Bompa 框架**；這個張力是本研究模組要呈現給讀者的核心辯論，不應強行統一，而是並陳兩套邏輯讓使用者理解適用場景的差異。🔵

---

## ⑦ 來源清單（可反查）

| 序號 | 文獻 | 識別碼 | 確定性 |
|------|------|--------|--------|
| 1 | Seiler, K.S. & Kjerland, G.Ø. (2006). Quantifying training intensity distribution in elite endurance athletes: Is there evidence for an "optimal" distribution? *Scand J Med Sci Sports*, 16(1):49–56 | PMID: 16430681 / DOI: 10.1111/j.1600-0838.2004.00418.x | 🟢 |
| 2 | Seiler, S. (2010). What is best practice for training intensity and duration distribution in endurance athletes? *Int J Sports Physiol Perform*, 5(3):276–291 | Human Kinetics 期刊（無獨立 PMID；全文見 Semantic Scholar） | 🟢 |
| 3 | Stöggl, T. & Sperlich, B. (2014). Polarized training has greater impact on key endurance variables than threshold, high intensity, or high volume training. *Front Physiol*, 5:33 | PMC: PMC3912323 / DOI: 10.3389/fphys.2014.00033 | 🟢 |
| 4 | González-Ravé, J.M., Hermosilla, F., González-Mohíno, F., Casado, A. & Pyne, D.B. (2021). Training intensity distribution, training volume, and periodization models in elite swimmers: A systematic review. *Int J Sports Physiol Perform*, 16(7):913–926. | PMID: 33952709 | 🟢 |
| 5 | Papadimitriou, K. et al. (2025). Training intensity distribution for sprinter swimmers: suggestions for swimming coaches and scientists. *Eur J Appl Physiol* | DOI: 10.1007/s00421-025-06064-x | 🟢 |
| 6 | Barbosa, T.M. et al. (2019). The road to 21 seconds: a case report of a 2016 Olympic swimming sprinter. | 🔴 具體期刊卷期需確認（Papadimitriou 2025 的前驅個案研究） | 🔴 |

---

## 本筆記的 🔴 清單

| 編號 | 待查項目 | 位置 |
|------|----------|------|
| 🔴1 | Barbosa et al. (2019) 的精確期刊卷期（目前只有年份和題目） | ⑤ 來源表、⑥ 游泳段 |
| 🔴2 | 「閾值型在哪些情境確實優於其他型」的直接支持文獻 | ④ 三型對照 |
| 🔴3 | Seiler (2010) 的 PubMed PMID（Human Kinetics 期刊未出現在 PubMed 索引） | ⑦ 來源清單 |

---

*查證工具：WebSearch × 6 輪並行搜尋*
*撰寫：Claude Code（研究助手）*

*2026-06-22 修正：⑥ 與來源表序號 4 原將 PMID 33952709 歸給「Crowley et al. 2021」，經 WebSearch 查證實為 González-Ravé JM et al. (2021)，已修正作者歸因；並補入該 SR「TID 依主項距離分流」核心結論（短=極化+閾值／中=閾值+金字塔／長=金字塔）。素材來源：Hestia deep-research 報告 swimming-water-training-breakthroughs-2026-06-20。*
