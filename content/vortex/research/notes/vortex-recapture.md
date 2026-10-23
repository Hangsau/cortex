---
title: "游泳渦流回收（Vortex Recovery in Swimming）"
description: "泳者自己產生的渦流可以被下一個動作再利用，水下波形踢腿已有直接研究。"
slug: "vortex-recapture"
layer: "research"
layer_name: "研究筆記"
research_status: "研究中"
weight: 35
note_kind: "literature"
note_theme: "physics"
draft: false
---

> 建立日期：2026-04-18
> 狀態：v1 — 全文獻已查證（PubMed 確認）

---

## 定義

**渦流回收（Vortex Recovery / Wake Capture）**：泳者的動作產生渦流，後續動作（同一泳者的另一肢體、或下一個划水階段）主動截取並再利用該渦流，以增加推力或降低阻力、降低能耗。

區別於單純的「渦流生成推進」：渦流回收要求有*再利用*過程，即渦流從一個動作轉移到另一個動作。

---

## 文獻

### 1. 人類水下波形游泳的渦流再捕獲

**文獻：** Hochstein S & Blickhan R (2011). *Vortex re-capturing and kinematics in human underwater undulatory swimming.* Human Movement Science, 30(5), 998–1007.
**PMID：** 21684028 **DOI：** 10.1016/j.humov.2010.07.002
**確定性：** 🟢

人類在水下波形游泳（UUS）中，關節強烈屈曲處（膝、踝）產生的渦流，在時序對準時可被後續足部動作再捕獲，增強推進力。以兩名全國級女泳者為受試者，TR-2D-PIV 量測。

- 人類 UUS 的 Strouhal 數高於魚類，但 Froude 效率相近
- 關節屈曲的位置與時序決定渦流能否被再捕獲
- **目前人類游泳渦流回收最直接的文獻**

**教學意義：** 膝關節屈曲幅度與踝關節放鬆程度直接影響渦流再捕獲效率，不只是踢腿幅度。

---

### 2. 划水換向的前緣渦流與尾流捕獲

**文獻：** Takagi H, Shimada S, Miwa T, Kudo S, Sanders R & Matsuuchi K (2014). *Unsteady hydrodynamic forces acting on a hand and its flow field during sculling motion.* Human Movement Science, 38, 133–142.
**PMID：** 25310026 **DOI：** 10.1016/j.humov.2014.09.003
**確定性：** 🟢

熟練泳者在定點划水（sculling）換向時，手背側產生**前緣渦流（LEV）**，手掌側發生**尾流捕獲（Wake Capture）**，兩者共同產生大型非穩態流體力（類似昆蟲飛行機制）。PIV + 手部壓力量測同步進行。

- 換向時機介於兩階段之間（非立即換向），是 wake capture 發生的關鍵
- 渦流主動生成與再利用是划水技術核心，而非穩態阻力或升力

**教學意義：** 划水末段換向時機決定 wake capture 效益，越快越好的觀念是錯的。

---

### 3. 跨物種渦流回收的 PIV 量化（螳螂蝦）

**文獻：** Garayev K & Murphy DW (2021). *Metachronal Swimming of Mantis Shrimp: Kinematics and Interpleopod Vortex Interactions.* Integrative and Comparative Biology, 61(5), 1631–1643.
**PMID：** 33997904 **DOI：** 10.1093/icb/icab052
**確定性：** 🟢（跨物種）

螳螂蝦的後部附肢產生的尖端渦流，被後方附肢的動力划程截取並增強。提出**附肢間渦流相位匹配 Strouhal 數（StIVPM）**預測建設性交互作用的發生條件。時間解析平面 PIV 量測。

- 多肢體異步動作的渦流回收機制：前肢產生 → 後肢截取
- 可類比人類手腳協調、雙手交替划水的渦流傳遞

**教學意義：** 自由式雙手交替的渦流相位匹配，支持高頻高協調性划水風格的生物力學基礎。

---

### 4. 水下波形游泳的準 3D 渦流可視化

**文獻：** Shimojo H, Gonjo T, Sakakibara J, Sengoku Y, Sanders R & Takagi H (2019). *A quasi three-dimensional visualization of unsteady wake flow in human undulatory swimming.* Journal of Biomechanics, 93, 60–69.
**PMID：** 31303331 **DOI：** 10.1016/j.jbiomech.2019.06.013
**確定性：** 🟡（渦流生成機制，非直接回收）

Stereo-PIV 量測人類 UUS 的準三維尾流。下踢末段足部外旋產生強烈噴流與成對渦流，是渦流生成機制的視覺化基礎。渦流再捕獲需結合 Hochstein & Blickhan (2011) 框架解讀。

**教學意義：** 下踢末段足部內旋/外旋動作對渦流成形至關重要，是後續能否再捕獲的前提。

---

### 5. 渦環推力的理論方程式

**文獻：** Blake RW (1983). *Canadian Journal of Zoology*, 61(11), 2491–2494.
**DOI：** 10.1139/z83-326
**確定性：** 🔵

推力 T 正比於渦流循環量 Γ 與渦環面積的乘積。渦流被再利用時，Γ 疊加，推力非線性增加。為渦流回收效益提供定量上限估計的理論框架。

---

### 6. 爆發－滑行能量理論

**文獻：** Videler JJ (1974). *Journal of Theoretical Biology*, 48(1), 215–229.
**DOI：** 10.1016/0022-5193(74)90168-3
**確定性：** 🔵

爆發踢腿後的滑行階段，流場中殘留的渦流結構仍對身體施力（非純慣性）。蛙式 glide phase 的適當時間可視為「讓渦流做功」的窗口。

---

## 教學應用摘要

| 應用情境 | 機制 | 來源 |
|---------|------|------|
| 水下波形踢腿 | 關節屈曲時序控制渦流再捕獲 | Hochstein & Blickhan 2011 🟢 |
| 划水換向時機 | LEV + Wake Capture 組合 | Takagi et al. 2014 🟢 |
| 自由式划頻協調 | 左右手渦流相位匹配 | Garayev & Murphy 2021 🟢（類比） |
| 蛙式滑行窗口 | 殘留渦流仍做功 | Videler 1974 🔵 |

---

## 🔴 待補充

- 自由式划水渦流回收的直接 PIV 研究（目前僅 UUS 與 sculling）
- 渦流回收的量化效益（能耗降低 %）—— 現有文獻多為定性
- 優秀泳者 vs 普通泳者的渦流回收程度比較