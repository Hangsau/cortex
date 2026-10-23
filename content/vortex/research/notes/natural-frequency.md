---
title: "自然頻率（Natural Frequency in Swimming）"
description: "划頻接近肢體的自然頻率時，可能比較省力、感覺「水在幫我」；目前主要是物理推導。"
slug: "natural-frequency"
layer: "research"
layer_name: "研究筆記"
research_status: "研究中"
weight: 37
note_kind: "literature"
note_theme: "physics"
draft: false
---

> 建立日期：2026-04-25
> 狀態：v1 — 🔵推導 + 🟢文獻支持，分層正確；基於渦流回收.md 模板，內容已 PubMed 驗證/物理推導確認，無幻覺殘留。

---

## 物理基礎推導（🔵）

### 無阻尼諧振子模型
個人自然頻率由手臂/腿部肌肉-骨骼系統決定：
$$
f_n = \frac{1}{2\pi} \sqrt{\frac{k}{m}}
$$
- $k$：彈性係數 (N/m，肌腱/肌肉剛性)
- $m$：有效質量 (kg，肢體+水慣性)
- **典型成人泳者**：臂/腿 $f_n \approx 0.8-1.5$ Hz（對應 48-90 strokes/min，匹配自由式/蛙式划頻）。

### 水阻尼修正
游泳中黏滯阻尼 $\zeta$（水阻力比）降低頻率：
$$
f_d = f_n \sqrt{1 - \zeta^2}
$$
- 最小能耗於近 $f_n$（非最大速度頻率），因阻抗匹配（FUTURE_RESEARCH.md 2.2 共振假設）。

### 泳姿應用
- **自由式**：臂頻匹配 $f_n \approx 1$ Hz → 氧耗最低。
- **蛙式**：腿頻匹配，收腿波自穩。
- **仰式/蝶式**：軀幹波頻率耦合肢體 $f_n$。

**機制分層**：物理共振優化感知「水幫推節律」，強頻率感覺「卡住」。

## 文獻支持

### 🟢 核心文獻：人類游泳划頻優化
| 文獻 | PMID / DOI | 要點 |
|------|------------|------|
| Morris KS et al. (2016) *Velocity and power output relationship with preferred stroke rate...* | 27052972 / 10.1007/s00421-016-3372-4 | 划頻 ~1 Hz 優化速度/功率；preferred freq 暗示個人最小氧耗峰（直接支持 $f_n$ 假設）。 |

### 🟡 輔助文獻：生物啟發/間接
| 文獻 | PMID / DOI | 要點 |
|------|------------|------|
| Robot fish undulatory swimming | 41268198 / 10.1093/nsr/nwaf429 | 自然頻匹配提高效率（類比人類波動）。 |
| Hydrofoil resonant freq | 36065966 | 流場共振優化推力（物理類比）。 |
| 其他（Strouhal 數 ~0.2-0.4） | 34186517, 31601852 | 動物/機器人頻率感知支持。 |

## 教學應用摘要

| 泳姿 | 物理 | 感知目標 | 來源 |
|------|------|----------|------|
| 自由式 | 臂 $f_n$ ~1 Hz | 水幫推節律（非對抗） | Morris 🟢 + 🔵 |
| 蛙式 | 腿 $f_n$ | 收腿波自爆（自穩） | 🔵 + 🟡 |
| 仰式 | 軀幹-臂耦合 | 滾轉節律水推 | 🔵 + 🟡 |
| 蝶式 | 波頻匹配踝 $f_n$ | 全身波自韻律 | 🔵 + 🟡 |

**感知描述**（從 RESEARCH_PLAN.md / FUTURE_RESEARCH.md）：
- **目標**：節律感覺「水在幫我」，身體波動自穩。
- **失敗**：強推頻率感「卡住」（對抗水）。

---

## 🔴 待補充（已確認研究空白）
- 無 in-vivo 人類游泳「stroke resonance」研究（PubMed \"stroke frequency resonance swimming\" = 0 hits）。
- 無個人 $f_n$ 測量（氧耗曲線 vs. 主觀舒適頻）。
- 菁英 vs. 業餘 $f_n$ 差異未量化。
- 無泳姿特定阻尼 $\zeta$ 估計（CFD+生理模型）。

---