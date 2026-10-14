---
title: "關節主張裁決 — B 類 ROM 數值（8 條）"
slug: "joint-ruling-rom"
layer: "research"
layer_name: "審查與裁決紀錄"
research_status: "審查紀錄"
draft: false
---

建立：2026-08-17
裁決對象：
- `plans/關節主張清單_自由式仰式.md` 的 B 類 5 條（FR-02、FR-16、FR-29、BK-15、BK-28）
- `plans/關節主張清單_蛙式蝶式超流線.md` 的 B 類 3 條（BR-24、BF-15、ST-01）

裁決依據：Neumann《Kinesiology of the Musculoskeletal System》3rd ed（`resources/books/Kinesiology_of_the_Musculoskeletal_System_3rd_ed/`，主要）、Nordin & Frankel《Basic Biomechanics of the Musculoskeletal System》4th ed（`resources/books/Basic_Biomechanics_of_the_Musculoskeletal_System_4th_ed/`，次要）
協議：`plans/關節主張驗證協議.md`
前批已定案錨點：`plans/關節主張裁決_自由式.md`、`plans/關節主張裁決_仰式.md`、`plans/關節主張裁決_蛙式.md`、`plans/關節主張裁決_蝶式.md`、`plans/關節主張裁決_超流線.md`

---

## 裁決範圍聲明（讀本檔前必看）

依協議 §2，B 類主張的裁決權限比 A 類**窄很多**：

> 教科書給的是**正常族群的可用 ROM 範圍**，因此 B 類只能回答一個問題：
> **「原文寫的這個數字，落不落在正常人解剖上可用的範圍內？」**

**本檔一律不裁決**：
- 「游泳時實際用到幾度」（游泳運動學實證問題，須游泳文獻直接量測）
- 「游泳應該要達到幾度」（技術要求，C 類）
- 該角度是否有效率、是否會致傷

因此「支持」在本檔的語意是**「這個數字在解剖上可達，不構成硬體不可能」**，**不是**「游泳時確實是這個數字」，更不是「這是應該達到的標準」。

### 量測條件必記（本批的核心紀律）

同一個關節的 ROM 會因下列條件而不同，抄數字不抄條件＝製造看起來精確但無法使用的假數據。本檔每條都必須填出所引數值的四項條件：

| 條件 | 為什麼會變 |
|---|---|
| **主動 / 被動** | 被動通常明顯較大（例：肩伸展主動約 65°、被動約 80°，`017_5_Shoulder_Complex.md:1028`） |
| **相鄰關節位置** | 雙關節肌決定可用範圍（例：屈膝時髖屈約 120°、伸膝時僅 70–80°，`028_12_Hip.md:887`） |
| **承重 / 非承重** | 游泳**全部是非承重**（但有水阻負荷，教科書不涵蓋此負荷型態） |
| **單關節 / 複合體** | 「肩屈曲 180°」是盂肱＋肩胛胸廓的合計，不是盂肱單獨（`017_5_Shoulder_Complex.md:1026`、`:1222`） |

**教科書未標的條件，本檔一律寫「教科書未標」，不得推測填補。**

### 引文格式說明（雙欄還原）

Neumann 原書為雙欄排版，Markdown 轉檔後同一行常混入相鄰欄的句子片段。本檔的 blockquote 是**還原後的連續句**，行號指向該片段實際所在的行。受影響且已標註的引文：`017_5_Shoulder_Complex.md:1026`（「At least 120 degrees of flexion…」與「…causing a slight anterior tilting of the scapula.」交錯）、`:1028`、`:2027–2037`、`018_6_Elbow_and_Forearm.md:443`、`029_13_Knee.md:1966`、`:1998`。抽查時請用 `sed -n 'Np' file | fold -w 200` 印整行，`cut -c1-100` 會截斷造成假陰性。

### B/C 混合條目處理

若原文把數值寫成**技術要求**（「需要／應達到 X 度」）或寫成**游泳運動學量測值**（「幅度約 X 度」），該條同時含兩成分：

- **B 成分**：X 這個數字是否落在正常 ROM 內 → 本檔裁決
- **C 成分**：游泳需要／實際用多少 → 本檔不裁決，明確標出

本批經拆解，**8 條全部含 C 成分**（下方逐條標示），其中 **ST-01、FR-29、BK-28 三條的 C 成分是主體**，B 成分只是外框檢查，整合時必須拆成兩欄，不得整條當「已裁決」使用。

---

## 總表

| ID | 原文主張（含原文數字） | 教科書對應數值 | 裁決 | B/C 混合 |
|---|---|---|---|---|
| FR-02 | 自由式入水期：肩屈曲約 **90°–130°** | 盂肱至少 120°；肩複合體近 180° | 支持 | 是（C 成分次要） |
| FR-16 | 自由式拉水期：肘屈曲最大約 **90°–100°** | 被動 0°→145–150°；功能弧 30°–130° | 支持 | 是（C 成分次要） |
| FR-29 | 自由式 body roll 幅度約 **30°–45°** | 胸腰合計每側約 40°（胸 25–35＋腰 5–7） | 部分支持 | **是（C 為主體）** |
| BK-15 | 仰式抓水期：肘屈曲約 **90°** | 同 FR-16 | 支持 | 是（C 成分次要） |
| BK-28 | 仰式 body roll 幅度約 **30°–40°** | 同 FR-29 | 部分支持 | **是（C 為主體）** |
| BR-24 | 蛙式收腿期：膝屈曲最大可達約 **130°–140°** | 130°–150° 屈曲 | 支持 | 是（C 成分次要） |
| BF-15 | 蝶式內掃期：肘屈曲約 **90°–100°** | 同 FR-16 | 支持 | 是（C 成分次要） |
| ST-01 | 超流線：肩屈曲約 **170°–180°** | 肩複合體主動上舉近 180° | 部分支持 | **是（C 為主體）** |

**原文數字有問題的條目**：FR-29（上端 45° 超出教科書胸腰合計上限，若採「脊椎內旋轉」解讀）、ST-01（數字本身可達，但「170–180」被寫成技術要求且未標是複合體角度）。其餘 6 條的數字皆落在教科書正常範圍內。

---

## 逐條裁決

### FR-02 自由式入水期：肩關節屈曲約 90°–130°

- **原文主張**：入水期肩屈曲約 **90°–130°**
- **裁決**：支持（數值落在正常可用範圍內）
- **衝突型**：型3（簡化 vs 精確）
- **依據**：Neumann Ch.5 Shoulder Complex，`017_5_Shoulder_Complex.md:1026`、`:946`、`:697`、`:1222`、`:1108`
  > "At least 120 degrees of flexion are available to the GH joint. Flexing the shoulder to nearly 180 degrees includes an accompanying upward rotation of the scapulothoracic joint."（`:1026`）
  > "Reporting the range of motion at the GH joint uses the anatomic position as the 0-degree or neutral reference point. In the sagittal plane, for example, flexion is described as the rotation of the humerus anterior to the 0-degree position."（`:946`）
  > "A fully upward rotated scapula is an important component of this movement, accounting for approximately one third of the near 180 degrees of shoulder abduction or flexion."（`:697`）
  > "Principle 1: Based on a generalized 2 : 1 scapulohumeral rhythm, active shoulder abduction of about 180 degrees occurs as a result of simultaneous 120 degrees of glenohumeral (GH) joint abduction and 60 degrees of scapulothoracic upward rotation."（`:1222`）
  > "All numeric values are chosen from a wide range of estimates cited across multiple literature sources (see text). Actual kinematic values vary considerably among persons and studies."（`:1108`，Fig. 5.36 圖說）

- **教科書數值的量測條件**：
  | 條件 | 本數值的實際情形 |
  |---|---|
  | 主動 / 被動 | **教科書未標**。`:1026` 只寫 "available to the GH joint"，未區分主動或被動。（對照：Neumann 對肩**伸展**有明標「主動約 65°、被動約 80°」`:1028`，可見其在有資料時會標，故此處的未標屬原書留白，不得代填） |
  | 相鄰關節位置 | 起算基準為**解剖位置 0°**（`:946`），即上臂垂於體側、軀幹直立。原文的入水期軀幹是俯臥且已 body roll，量測基準與教科書不同軸（見「說明」） |
  | 承重 / 非承重 | **非承重**（測角器量測上肢自由擺動）。與游泳同屬非承重，但游泳另有水阻負荷，教科書不涵蓋 |
  | 單關節 / 複合體 | **`:1026` 的 120° 是盂肱關節單獨值**；近 180° 是**肩複合體**合計（盂肱 120°＋肩胛胸廓上迴旋 60°，`:1222`） |

- **說明（教科書值 vs 原文值）**：
  - 原文區間 **90°–130°**，完整落在教科書給的可用範圍內（盂肱單獨至少 120°、複合體近 180°），**解剖上不構成不可能**，B 成分成立。
  - 但**上端 130° 已跨過盂肱單關節的界線**。依 `:1026`，盂肱可保證的屈曲只有「至少 120°」；要到 130°，必然已有肩胛胸廓上迴旋參與。原文只寫「肩屈曲」，沒有欄位區分「盂肱角」與「肩複合體角」，等於同一個標籤在區間下端（90°）指盂肱可獨立完成的動作、在上端（130°）指複合體動作。依協議型3 屬粒度問題，**不判錯**，但整合時應改寫為「肩複合體屈曲（上舉）90°–130°，其中超過約 120° 的部分由肩胛胸廓上迴旋貢獻」。
  - 個體差異：`:1108` 明講肩部運動學數值「在人與人之間、研究與研究之間差異相當大」。因此 90°–130° 不能當成個別泳者的判讀門檻——學生入水角度落在此區間外，**不足以推論是硬體邊界**。
- **B / C 拆分**：
  - **B（本檔裁決）**：90°–130° 落在正常肩屈曲可用範圍內 → 成立。
  - **C（本檔不裁決）**：自由式入水時肩屈曲**實際**是否為 90°–130°、該角度是否為適當入水角 → 須游泳運動學直接量測，教科書答不了。

---

### FR-16 自由式拉水期：肘關節持續屈曲，最大約 90°–100°

- **原文主張**：拉水期肘持續屈曲，最大約 **90°–100°**
- **裁決**：支持（數值落在正常可用範圍內，且位於功能弧正中）
- **衝突型**：無
- **依據**：Neumann Ch.6 Elbow and Forearm，`018_6_Elbow_and_Forearm.md:443`、`:461`；Nordin & Frankel Ch.13，`026_CHAPTER_13__Biomechanics_of_the_Elbow.md:101`、`:563`
  > "When measured by a goniometer, the maximal range of passive motion generally available to the elbow is from 5 degrees beyond neutral (0 degree) extension through 145–150 degrees of flexion."（Neumann `:443`）
  > "FIG. 6.15 Range of motion at the elbow. (A) A healthy person showing an average range of elbow motion from 5 degrees beyond neutral extension through 145 degrees of flexion. The 100-degree “functional arc” from 30 to 130 degrees of flexion (in red) is based on the data in the histogram."（Neumann `:461`）
  > "The normal range of flexion-extension is from 0° to 146° with a functional range of 30° to 130°."（Nordin `:101`）
  > "The functional range of elbow motion is 30° to 130° of flexion-extension and 50° to 50° of pronation-supination with most activities of daily living accomplished within this range."（Nordin `:563`）

- **教科書數值的量測條件**：
  | 條件 | 本數值的實際情形 |
  |---|---|
  | 主動 / 被動 | Neumann `:443` 的 145–150° 明標為 **passive**（測角器量被動最大值）；Nordin `:101` 的 0°–146° 出自 Morrey 等 1981 的**主動**功能量測。兩者相差僅數度，故 90°–100° 無論用哪個基準都遠在範圍內 |
  | 相鄰關節位置 | **教科書未標**肩關節位置。理論上肱二頭肌／肱三頭肌跨兩關節，肩位置會影響肘的**力矩**，但 90°–100° 位於中段而非極端，被動張力不構成限制 |
  | 承重 / 非承重 | **非承重**（測角器量前臂自由屈伸）。與游泳同屬非承重 |
  | 單關節 / 複合體 | **單關節**（肱尺＋肱橈的屈伸，Nordin `:101`），不涉及複合體加總 |

- **說明（教科書值 vs 原文值）**：
  - 原文的 90°–100° 落在教科書可用範圍（0°→145–150°）的**中段**，距離兩端極值都還有大量餘裕，**不是任何硬體邊界**。
  - 更精確的對照是「功能弧」：Neumann `:461` 與 Nordin `:563` 一致給出 **30°–130° 的 100° 功能弧**（日常活動絕大多數在此弧內完成）。原文的 90°–100° 完全落在此功能弧中央，屬「日常人人天天在用」的角度區段。
  - 因此本條在 B 層的結論很強但也很弱：**強**在數字絕無爭議；**弱**在它幾乎沒有鑑別力——這個角度對正常肘關節毫無挑戰性，不能拿來當「拉水做不到＝柔軟度不足」的依據。若學生做不出 90°–100° 的拉水肘角，原因幾乎一定不在肘的 ROM。
- **B / C 拆分**：
  - **B（本檔裁決）**：90°–100° 落在正常肘屈曲範圍內，且在功能弧中央 → 成立。
  - **C（本檔不裁決）**：自由式拉水期肘角**實際**是否為 90°–100°、此角度與「高肘」推進效益的關係 → 教科書答不了（與前批 FR-17 高肘條目同屬 C 類）。

---

### FR-29 自由式軀幹：body roll 幅度約 30°–45°

- **原文主張**：body roll 幅度約 **30°–45°**（原文 FR-28 已把 body roll 定義為「脊椎縱軸旋轉」）
- **裁決**：部分支持（下段成立；上端 45° 在「脊椎內旋轉」解讀下超出教科書上限；且量測基準未定義）
- **衝突型**：型1（座標系衝突：全身滾轉角 vs 脊椎節間旋轉角）
- **依據**：Neumann Ch.9 Axial Skeleton，`023_9_Axial_Skeleton.md:1718`、`:2176`、`:1786`、`:996`
  > "Approximately 25 to 35 degrees of horizontal plane (axial) rotation occur to each side throughout the thoracic region."（`:1718`）
  > "Only about 5 to 7 degrees of horizontal plane rotation occur to each side throughout the lumbar region. Clinical measurements often exceed this amount, likely because of extraneous motion at the hip joint (pelvis rotating on the femur) and the lower thoracic region."（`:2176`）
  > "FIG. 9.54 The kinematics of thoracolumbar axial rotation is depicted as the subject rotates her face 120 degrees to the right. The thoracolumbar axial rotation is shown through an approximate 40-degree arc: the sum of about 35 degrees of thoracic rotation and 5 degrees of lumbar rotation."（`:1786`）
  > "The plane of the facet surfaces explains, in part, why axial rotation is far greater in the cervical region than in the lumbar region."（`:996`）

- **教科書數值的量測條件**：
  | 條件 | 本數值的實際情形 |
  |---|---|
  | 主動 / 被動 | **教科書未標**。`:1718`／`:2176` 只寫「每側可發生的旋轉量」，未區分主動或被動 |
  | 相鄰關節位置 | Fig. 9.54（`:1786`）的示範是**直立、骨盆相對固定**、由頭部帶動的整體轉身；40° 是胸腰段合計的**節間旋轉**。頸椎旋轉（該圖另計約 80°）**不含**在 40° 內 |
  | 承重 / 非承重 | **承重**（直立姿勢下量測，體重壓在脊椎上）。游泳為**非承重、水平懸浮、骨盆不被地面固定**，量測情境與教科書完全不同——這是本條最大的落差 |
  | 單關節 / 複合體 | **複合體**（多節脊椎的累加，非單一椎間關節）。單一腰椎節間旋轉僅約 1°（`:2178`），甚至 3° 就有損傷風險 |

- **說明（教科書值 vs 原文值）**：
  - 若採原文自己的定義（FR-28：body roll ＝ 脊椎縱軸旋轉），教科書給的**胸腰合計每側上限約 40°**（Fig. 9.54，`:1786`），取各段極大值相加也只到 **35＋7 ＝ 42°**（`:1718`＋`:2176`）。
    - 原文區間下段 **30°–40° 成立**；
    - **上端 45° 超出教科書給的胸腰合計上限**（40°，極端相加 42°）。
  - 但更關鍵的是**量測基準未定義**：游泳文獻講的 body roll 通常是「肩線相對水平面的滾轉角」，那是**全身繞縱軸的剛體滾轉**，不是脊椎節間旋轉——水中骨盆沒有被固定，肩與髖可以同步滾轉而**幾乎不消耗任何脊椎 ROM**。在此解讀下，45°、甚至 60° 都不受脊椎 ROM 限制，教科書**無法裁決**。
  - Neumann `:2176` 正好預先警告了同型誤差：臨床量到的腰椎旋轉常「灌水」，因為髖／骨盆相對股骨的旋轉被算了進去。游泳的 body roll 是這個現象的極端版本。
  - 因此本條的正確處理是**先補「量測基準」欄位**（滾轉角相對水平面 ／ 肩線相對髖線），再談數字；在基準未定義前，30°–45° 這個數字無法與任何教科書值對照。與前批 FR-28 的裁決（型3，須拆頸／胸／腰／髖骨盆四欄）同源，本條是同一結構缺陷在數值層的重演。
- **B / C 拆分（本條 C 為主體）**：
  - **B（本檔裁決）**：若解讀為脊椎節間旋轉，30°–40° 落在正常範圍內；**45° 超出**（40–42° 上限）。
  - **C（本檔不裁決）**：自由式 body roll **實際**幅度多少、多少度算適當、body roll 與划距／力量傳導的關係（原文 FR-30、FR-31）→ 須游泳運動學文獻。教科書連「這個角度該怎麼量」都不涵蓋。

---

### BK-15 仰式抓水期：肘關節屈曲約 90°

- **原文主張**：抓水期肘屈曲約 **90°**
- **裁決**：支持（數值落在正常可用範圍內，且位於功能弧正中）
- **衝突型**：無
- **依據**：Neumann Ch.6 Elbow and Forearm，`018_6_Elbow_and_Forearm.md:443`、`:461`；Nordin & Frankel Ch.13，`026_CHAPTER_13__Biomechanics_of_the_Elbow.md:101`
  > "When measured by a goniometer, the maximal range of passive motion generally available to the elbow is from 5 degrees beyond neutral (0 degree) extension through 145–150 degrees of flexion."（Neumann `:443`）
  > "FIG. 6.15 Range of motion at the elbow. (A) A healthy person showing an average range of elbow motion from 5 degrees beyond neutral extension through 145 degrees of flexion. The 100-degree “functional arc” from 30 to 130 degrees of flexion (in red) is based on the data in the histogram."（Neumann `:461`）
  > "The normal range of flexion-extension is from 0° to 146° with a functional range of 30° to 130°."（Nordin `:101`）

- **教科書數值的量測條件**：同 FR-16（被動 145–150°／主動 0–146°；肩位置教科書未標；非承重；單關節）。**條件完全共用，因為 Neumann 與 Nordin 對肘屈伸只給一組全域值，未按仰臥／俯臥或肩上舉位置分列。**
- **說明（教科書值 vs 原文值）**：
  - 90° 落在可用範圍（0°→145–150°）的中段，也落在 30°–130° 功能弧的中央，**解剖上毫無障礙**。
  - 需注意仰式與自由式的差別**不在肘**：仰式抓水時肩處於高度上舉＋外旋位，這改變的是**肩**的力學環境，不改變肘的可用 ROM——教科書對肘屈伸只給一組全域值，沒有按肩位置分列的資料（**教科書未給此細分數值**，不得推測）。
  - 與 FR-16（自由式 90°–100°）、BF-15（蝶式 90°–100°）構成同一組：三式的拉／內掃期肘角原文都落在 90°–100°，**在 B 層全部無爭議**。三者的差別只可能出現在 C 層（時序、推進、高肘維持），教科書不裁決。
- **B / C 拆分**：
  - **B（本檔裁決）**：90° 落在正常肘屈曲範圍內，且在功能弧中央 → 成立。
  - **C（本檔不裁決）**：仰式抓水期肘角**實際**是否為 90°、以及原文 BK-19「第一上掃維持高肘」的推進宣稱 → 須游泳文獻。

---

### BK-28 仰式軀幹：body roll 幅度約 30°–40°

- **原文主張**：body roll 幅度約 **30°–40°**（原文 BK-27 已把 body roll 定義為「仰躺姿態下脊椎縱軸旋轉左右交替」）
- **裁決**：部分支持（數值全區間落在教科書上限內；但量測基準未定義，數字無法真正對照）
- **衝突型**：型1（座標系衝突：全身滾轉角 vs 脊椎節間旋轉角）
- **依據**：Neumann Ch.9 Axial Skeleton，`023_9_Axial_Skeleton.md:1718`、`:2176`、`:1786`、`:2178`
  > "Approximately 25 to 35 degrees of horizontal plane (axial) rotation occur to each side throughout the thoracic region."（`:1718`）
  > "Only about 5 to 7 degrees of horizontal plane rotation occur to each side throughout the lumbar region. Clinical measurements often exceed this amount, likely because of extraneous motion at the hip joint (pelvis rotating on the femur) and the lower thoracic region."（`:2176`）
  > "FIG. 9.54 The kinematics of thoracolumbar axial rotation is depicted as the subject rotates her face 120 degrees to the right. The thoracolumbar axial rotation is shown through an approximate 40-degree arc: the sum of about 35 degrees of thoracic rotation and 5 degrees of lumbar rotation."（`:1786`）
  > "Just more than 1 degree of unilateral axial rotation has been measured at the L3–L4 intervertebral junction."（`:2178`）

- **教科書數值的量測條件**：與 FR-29 完全共用（教科書未標主動／被動；Fig. 9.54 為**直立承重**、骨盆相對固定、不含頸椎的胸腰段合計；屬多節累加的複合體值）。**Neumann 未提供仰臥姿勢下的脊椎旋轉 ROM——教科書未給此數值**，故不能因為仰式是仰臥就假定數值不同。
- **說明（教科書值 vs 原文值）**：
  - 若採原文自己的定義（BK-27：脊椎縱軸旋轉），**30°–40° 全區間落在教科書胸腰合計上限（約 40°，極端相加 42°）之內**，數字本身沒有問題——這一點比 FR-29（上端 45° 超出）乾淨。
  - 但**降級為「部分支持」的理由與 FR-29 相同且更重要**：量測基準未定義。游泳的 body roll 若指「肩線相對水平面的滾轉角」，那是全身剛體滾轉，水中骨盆不被固定，肩與髖可同步滾轉而幾乎不消耗脊椎 ROM——此解讀下教科書**無從裁決**，30°–40° 落在範圍內只是巧合，不是驗證。
  - **一個具體的判讀陷阱**：原文給仰式 30°–40°、自由式 30°–45°（FR-29），兩者相差 5°。在脊椎節間旋轉的量測解析度下，5° 幾乎等於單一腰椎節間旋轉量的 5 倍、也在個體差異與量測方法誤差之內（`:2176` 明講臨床量測常被髖／骨盆灌水）。因此**「仰式比自由式滾得少一點」這個差值在教科書層完全沒有支撐**，不得當成兩式的區別性事實使用。
  - 依協議型1，本條**不選邊、不判錯**，處理方式是補欄位：`滾轉量測基準`（肩線 vs 水平面 ／ 肩線 vs 髖線）＋ `貢獻分解`（全身滾轉 ／ 胸椎 ／ 腰椎 ／ 髖骨盆）。
- **B / C 拆分（本條 C 為主體）**：
  - **B（本檔裁決）**：若解讀為脊椎節間旋轉，30°–40° 落在正常範圍內 → 成立（不超限）。
  - **C（本檔不裁決）**：仰式 body roll **實際**幅度、與自由式的差值是否真實、原文 BK-29「延遲旋轉、推水末段快速轉向」的時序宣稱 → 須游泳運動學文獻。

---

### BR-24 蛙式收腿期：膝關節屈曲（最大可達約 130°～140°）

- **原文主張**：收腿期膝屈曲**最大可達約 130°～140°**
- **裁決**：支持（數值落在正常可用範圍內；且原文取值偏保守）
- **衝突型**：型3（簡化 vs 精確——原文把「膝的可用上限」寫成單一數字，未帶髖位置條件）
- **依據**：Neumann Ch.13 Knee，`029_13_Knee.md:561`、`:1966`、`:1998`；Ch.12 Hip，`028_12_Hip.md:887`、`:897`
  > "Flexion and extension at the knee occur about a medial-lateral axis of rotation for both tibial-on-femoral and femoral-on-tibial situations (Fig. 13.13). Range of motion varies with age and gender, but in general the healthy knee moves from 130 to 150 degrees of flexion to about 5 to 10 degrees beyond the 0-degree (straight) position."（`029_13_Knee.md:561`）
  > "ATYPICAL MOVEMENT COMBINATIONS: HIP FLEXION AND KNEE EXTENSION, OR HIP EXTENSION AND KNEE FLEXION ... Hip flexion can occur with knee extension (Fig. 13.44A), or hip extension can occur with knee flexion (Fig. 13.44B)."（`029_13_Knee.md:1966`）
  > "the biarticular rectus femoris is overstretched across both the hip and the knee, thereby passively resisting knee flexion. For both reasons, knee flexion force and range of motion are usually limited by the out-of-phase movement."（`029_13_Knee.md:1998`）
  > "The biarticular hamstrings must contract to a very short length—a movement that is often accompanied by cramping."（`029_13_Knee.md:1998`，同段）
  > "With the knee fully extended, hip flexion is typically limited to 70 to 80 degrees by increased tension in the hamstring muscles. The amount of this movement varies considerably because people have different degrees of hamstring muscle flexibility."（`028_12_Hip.md:887`）
  > "When the knee is fully flexed during hip extension, passive tension in the stretched rectus femoris, which crosses both the hip and the knee, reduces hip extension to about the neutral position."（`028_12_Hip.md:897`）

- **教科書數值的量測條件**：
  | 條件 | 本數值的實際情形 |
  |---|---|
  | 主動 / 被動 | **教科書未標**。`:561` 只寫 "the healthy knee moves from 130 to 150 degrees of flexion"，未區分主動或被動測角 |
  | 相鄰關節位置 | **`:561` 也未標髖位置**——但同章 `:1966`／`:1998` 明確指出：**髖伸展＋膝屈曲**（out-of-phase）時，跨兩關節的股直肌被兩端同時拉長，**被動阻抗膝屈曲，使膝屈曲的力量與 ROM 雙雙受限**。因此 130–150° 應理解為「髖不處於伸展位」時的值 |
  | 承重 / 非承重 | `:561` 明指此軸適用於 **tibial-on-femoral（非承重，如坐姿勾腳跟）與 femoral-on-tibial（承重，如深蹲）兩種情境**，未分列數值。游泳屬**非承重**的 tibial-on-femoral 型態 |
  | 單關節 / 複合體 | **單關節**（脛股關節屈伸）。但受股直肌／腿後肌群這兩條雙關節肌牽制，實務上必須連同髖位置一起讀 |
  | 個體差異 | `:561` 明講 "Range of motion varies with age and gender"；`028_12_Hip.md:887` 另指出跨髖膝的雙關節肌柔軟度「因人差異相當大」 |

- **說明（教科書值 vs 原文值）**：
  - 教科書給的正常膝屈曲上限是 **130°–150°**。原文寫「最大可達約 130°–140°」，**完整落在教科書區間內**，且原文的上端（140°）比教科書上端（150°）**保守 10°**——原文沒有誇大，B 成分成立。
  - 但原文把它寫成一個**無條件的上限**，這是本條真正的問題。依 `:1966`／`:1998`，膝屈曲的可用 ROM **取決於髖的位置**：
    - **髖屈曲＋膝屈曲**（原文 BR-21 標的收腿姿勢）：股直肌在髖端縮短、在膝端拉長，長度大致抵銷，**膝屈曲不受股直肌限制**，130°–140° 完全可達。
    - **髖接近伸直＋膝屈曲**（Fig. 13.44B 的 out-of-phase 組合，也就是「盡量不把膝蓋收到身體下方以降低阻力」的蛙式收腿）：股直肌**兩端同時被拉長**，被動張力直接壓縮膝屈曲的可用範圍——教科書明講此時「knee flexion force and range of motion are usually limited」。
  - **這是一個真實的技術取捨，而且教科書能講到它的解剖端**：蛙式收腿要降低迎水面積就得少屈髖，而少屈髖正好落進股直肌被動張力最大的組合，腳跟拉向臀部的可用角度因此縮小。原文只給「130–140」一個數字，把這個取捨整個藏起來了。
  - **附帶且有教學價值的一筆**：同一段（`:1998`）指出髖伸展＋膝屈曲的組合會迫使腿後肌群收縮到極短長度，「often accompanied by cramping」。蛙式腿抽筋好發於收腿相，在解剖層有現成的解釋來源——但**教科書並未針對游泳做此陳述，此為本檔的推論方向，不得寫成教科書結論**。
  - **判讀含義（硬體邊界 vs 技術問題）**：學生收腿收不深，在判定「膝關節活動度不足」之前，必須先看髖的位置。同一位學生在屈髖位測到的膝屈曲角，會明顯大於在伸髖位游泳時的實際角度——**用仰躺屈髖的柔軟度測驗去判定蛙式收腿能力，方法本身就是錯的**。
- **B / C 拆分**：
  - **B（本檔裁決）**：130°–140° 落在正常膝屈曲範圍（130°–150°）內 → 成立；且此上限**條件相依於髖位置**（教科書明文）。
  - **C（本檔不裁決）**：蛙式收腿時膝**實際**屈到幾度、收多深才有利推進、抽筋與收腿相的實證關聯 → 須游泳文獻／運動醫學文獻。

---

### BF-15 蝶式內掃期：肘關節屈曲角度加大（約 90°～100°），維持高肘

- **原文主張**：內掃期肘屈曲**約 90°～100°**，維持高肘
- **裁決**：支持（數值部分）；「維持高肘」超出教科書可裁決範圍
- **衝突型**：無（數值部分）／型4（跨層對撞，「高肘」成分）
- **依據**：Neumann Ch.6 Elbow and Forearm，`018_6_Elbow_and_Forearm.md:443`、`:461`；Nordin & Frankel Ch.13，`026_CHAPTER_13__Biomechanics_of_the_Elbow.md:101`、`:563`
  > "When measured by a goniometer, the maximal range of passive motion generally available to the elbow is from 5 degrees beyond neutral (0 degree) extension through 145–150 degrees of flexion."（Neumann `:443`）
  > "FIG. 6.15 Range of motion at the elbow. (A) A healthy person showing an average range of elbow motion from 5 degrees beyond neutral extension through 145 degrees of flexion. The 100-degree “functional arc” from 30 to 130 degrees of flexion (in red) is based on the data in the histogram."（Neumann `:461`）
  > "The normal range of flexion-extension is from 0° to 146° with a functional range of 30° to 130°."（Nordin `:101`）
  > "The functional range of elbow motion is 30° to 130° of flexion-extension and 50° to 50° of pronation-supination with most activities of daily living accomplished within this range."（Nordin `:563`）

- **教科書數值的量測條件**：同 FR-16／BK-15（Neumann 145–150° 明標 **passive**、測角器量測；Nordin 0°–146° 為主動功能量測；**肩位置教科書未標**；**非承重**；**單關節**）。蝶式內掃時雙臂在胸腹下方，肩處內收＋內旋位，教科書**未提供按肩位置分列的肘 ROM**——教科書未給此數值。
- **說明（教科書值 vs 原文值）**：
  - 90°–100° 落在可用範圍（0°→145–150°）中段，也落在 30°–130° 功能弧的中央，**解剖上毫無障礙**，B 成分成立。
  - **三式同值的意義**：FR-16（自由式 90°–100°）、BK-15（仰式 90°）、BF-15（蝶式 90°–100°）在 B 層是同一個結論——三個角度都在肘的功能弧中央，教科書對三者**沒有任何鑑別力**。若整合時想用「肘角」區分三式技術，B 層提供不了依據，必須改用游泳運動學資料（C 層）。
  - **「維持高肘」不屬本檔範圍**：高肘是手掌／前臂相對肘部的空間位置宣稱（與前批 BR-09、BR-15、FR-17 同型，已定案為型4／C 類），教科書只能否證「解剖上不可能」，不能否證或支持「游泳時是否該這樣做」。原文把數值與技術宣稱寫在同一條，整合時應拆為兩欄。
- **B / C 拆分**：
  - **B（本檔裁決）**：90°–100° 落在正常肘屈曲範圍內，且在功能弧中央 → 成立。
  - **C（本檔不裁決）**：蝶式內掃期肘角**實際**是否為 90°–100°、「維持高肘」的推進效益與可行性 → 須游泳文獻。

---

### ST-01 靜態超流線：肩關節接近最大屈曲（約 170°～180°，雙臂夾耳伸直過頭）

- **原文主張**：靜態超流線時肩關節接近最大屈曲，**約 170°～180°**，雙臂夾耳伸直過頭
- **裁決**：部分支持（B 成分成立但無餘裕；標籤缺「複合體」限定；C 成分教科書不裁決）
- **衝突型**：型3（簡化 vs 精確：單關節 vs 複合體）＋ 型4（跨層對撞：「超流線需要多少」不屬教科書）
- **依據**：Neumann Ch.5 Shoulder Complex，`017_5_Shoulder_Complex.md:697`、`:1026`、`:1222`、`:683`、`:569`、`:1108`、`:2027–2037`
  > "Raising the arm overhead is often informally called flexion (when it is near the sagittal plane) or abduction (when it is near either the frontal or the scapular plane). Regardless of the specific plane of movement, the ability to raise the arm fully overhead is a prerequisite for many functional activities. A fully upward rotated scapula is an important component of this movement, accounting for approximately one third of the near 180 degrees of shoulder abduction or flexion."（`:697`）
  > "At least 120 degrees of flexion are available to the GH joint. Flexing the shoulder to nearly 180 degrees includes an accompanying upward rotation of the scapulothoracic joint."（`:1026`）
  > "Principle 1: Based on a generalized 2 : 1 scapulohumeral rhythm, active shoulder abduction of about 180 degrees occurs as a result of simultaneous 120 degrees of glenohumeral (GH) joint abduction and 60 degrees of scapulothoracic upward rotation."（`:1222`）
  > "Upward rotation of the scapulothoracic joint is an integral part of raising the arm overhead. ... These coupled rotations are essential to the full 60 degrees of upward rotation at the scapulothoracic joint."（`:683`）
  > "Reports vary widely, but up to 30 degrees of upward rotation at the AC joint occur as the arm is raised fully over the head."（`:569`）
  > "All numeric values are chosen from a wide range of estimates cited across multiple literature sources (see text). Actual kinematic values vary considerably among persons and studies."（`:1108`）
  > "“Poor” or slouched posture in otherwise neurologically intact persons often is associated with a scapulothoracic joint that is abnormally downwardly rotated and excessively protracted—positions typically associated with excessive anterior tilting and internal rotation of the scapula. Such a posture has indeed been correlated with a tight or overshortened pectoralis minor muscle."（`:2027`、`:2029`、`:2033`、`:2037` 四行；此處原書為雙欄排版，Markdown 轉檔後與側欄項目符號交錯，上引為**還原後**的連續句，各片段分別落在這四行）

- **教科書數值的量測條件**：
  | 條件 | 本數值的實際情形 |
  |---|---|
  | 主動 / 被動 | `:1222` 的近 180° 明標為 **active**（主動上舉）。`:1026` 的「盂肱至少 120°」**未標主動或被動**。被動（例如趴牆／臥姿由外力推到底）通常可再多出數度，但**教科書未給肩屈曲的被動數值**——不得推測填補 |
  | 相鄰關節位置 | 起算基準為**解剖位置 0°**（上臂垂於體側、軀幹直立）。教科書的近 180° 是**單臂**上舉；超流線是**雙臂併攏夾耳**，兩臂互相限制的效應**教科書未涵蓋** |
  | 承重 / 非承重 | **非承重**（測角器量上肢自由上舉，站姿或坐姿）。超流線同屬非承重，但軀幹為水平懸浮姿勢，脊椎與肩胛的姿勢基礎不同——教科書未給水平姿勢下的肩上舉值 |
  | 單關節 / 複合體 | **這是本條的關鍵**：近 180° 是**肩複合體**的合計值，由盂肱約 120°＋肩胛胸廓上迴旋約 60° 組成（`:1222`、`:683`），肩胛胸廓那 60° 又由胸鎖關節鎖骨上提與肩鎖關節上迴旋（最多約 30°，`:569`）加總。**盂肱關節本身到不了 170°–180°** |
  | 個體差異 | `:1108` 明講各項數值「在人與人之間、研究與研究之間差異相當大」；`:2027` 另指出姿勢不良／胸小肌緊縮會使肩胛異常下迴旋與前伸，直接吃掉可用的上舉範圍 |

- **說明（教科書值 vs 原文值）**：
  - **B 成分成立，但幾乎沒有餘裕**。教科書給正常人上舉的上限是「**近** 180°」（`:697`、`:1026`、`:1222` 三處一致用 "near／nearly／about 180"），原文的 170°–180° 正好貼著這條上限。換言之：
    - 170° 側：一般正常人可達；
    - 180° 側：是教科書所描述的**上限本身**，不是留有空間的常態值。教科書並未宣稱「一般人都能做到整整 180°」。
  - **標籤必須加限定詞**。原文寫「肩關節接近最大屈曲」，但 170°–180° 是**肩複合體**的角度，其中盂肱只出約 120°，其餘約 60° 來自肩胛胸廓上迴旋（`:1222`）。原文自己在 ST-05／ST-06／ST-07 已把肩胛層填出來（上迴旋、後傾、上提），卻在 ST-01 把整個 170°–180° 掛在「肩關節」上——**同一份文件內兩處對同一動作的歸屬不一致**。整合時應改寫為「肩複合體上舉 170°–180°（盂肱約 120°＋肩胛胸廓上迴旋約 60°）」，並與 ST-05／06／07 連結。
  - **B/C 必須拆開，這是本批最典型的混合條目**。原文的句式是**技術要求**（超流線「要」雙臂夾耳、肩屈到 170°–180°）：
    - 「170–180 這個數字是否落在正常人可達範圍內」→ **B，教科書可裁決 → 落在上限帶內，成立**；
    - 「超流線需要多少度才算到位」→ **C，教科書完全不裁決**。教科書講的是「正常族群的可用上限」，不是「游泳應達到的標準」。把 `:697` 的 "near 180 degrees" 拿去背書「超流線標準是 180°」，屬型4 跨層誤用。
  - **判讀含義（硬體邊界 vs 技術問題）**：本條是全批中**唯一真正貼近硬體邊界**的數值。學生做不出夾耳超流線時，「肩上舉 ROM 不足」是解剖上**真實可能**的原因（不像肘 90°–100° 那樣毫無挑戰性）。但要斷定是硬體邊界，必須先排除 `:2027` 指出的可逆因素：胸小肌緊縮、肩胛異常下迴旋與過度前伸、胸椎姿勢——這些會壓縮可用上舉角度，但屬**可改變**的成分，不是骨性上限。診斷順序應是：先看肩胛能否上迴旋到位（ST-05）、胸椎姿勢是否容許（ST-08），最後才歸因盂肱本身。
  - **教科書未給的部分（明確標出，不編造）**：雙臂併攏夾耳時的肩上舉 ROM、水平懸浮姿勢下的肩上舉 ROM、肩屈曲的被動最大值——**Neumann 與 Nordin 皆未給此三項數值**。
- **B / C 拆分（本條 C 為主體）**：
  - **B（本檔裁決）**：170°–180° 落在正常肩複合體上舉的上限帶內（教科書一致給「近 180°」）→ 成立，但無餘裕，且必須標明是複合體而非盂肱。
  - **C（本檔不裁決）**：超流線**需要**多少度、170° 與 180° 的阻力差異、夾耳與否對流線的影響 → 須游泳文獻／流體力學，教科書答不了。

---

## 引用行號總表（供抽查）

所有引用皆已逐行以 `sed -n 'Np' file | fold -w 200` 印整行驗證，確認該行實際含所引數值／文句。

### Neumann《Kinesiology of the Musculoskeletal System》3rd ed

| 檔案 | 行號 | 內容（本檔用途） | 用於 |
|---|---|---|---|
| `017_5_Shoulder_Complex.md` | 569 | 肩鎖關節上迴旋「up to 30 degrees」 | ST-01 |
| | 683 | 肩胛胸廓上迴旋「full 60 degrees」，為手臂舉過頭之必要組成 | ST-01 |
| | 697 | 「near 180 degrees of shoulder abduction or flexion」，肩胛約佔三分之一 | FR-02、ST-01 |
| | 946 | GH ROM 以解剖位置為 0° 基準；屈曲＝肱骨向前旋轉 | FR-02 |
| | 1026 | 「At least 120 degrees of flexion are available to the GH joint」＋近 180° 需肩胛胸廓上迴旋（**雙欄交錯行**） | FR-02、ST-01 |
| | 1028 | 肩伸展「about 65 degrees actively (and 80 degrees passively)」（**雙欄交錯行**；用於示範主被動差異） | 條件表 |
| | 1108 | Fig. 5.36 圖說：180°＝60° 肩胛胸廓＋120° GH；「values vary considerably among persons and studies」 | FR-02、ST-01 |
| | 1222 | Principle 1：**active** 肩外展約 180°＝120° GH＋60° 肩胛胸廓上迴旋 | FR-02、ST-01 |
| | 2027 / 2029 / 2033 / 2037 | 姿勢不良／胸小肌緊縮 → 肩胛異常下迴旋與過度前伸（**雙欄交錯，四行還原**） | ST-01 |
| `018_6_Elbow_and_Forearm.md` | 443 | 肘**被動**最大 ROM：伸展 −5° → 屈曲 145–150°（測角器）（**雙欄交錯行**） | FR-16、BK-15、BF-15 |
| | 461 | Fig. 6.15 圖說：平均 −5°→145° 屈曲；**功能弧 30°–130°** | FR-16、BK-15、BF-15 |
| `023_9_Axial_Skeleton.md` | 996 | 小面關節平面解釋為何頸椎旋轉遠大於腰椎 | FR-29 |
| | 1718 | 胸椎每側軸向旋轉「25 to 35 degrees」 | FR-29、BK-28 |
| | 1786 | Fig. 9.54 圖說：胸腰合計約 **40° 弧**（胸 35°＋腰 5°） | FR-29、BK-28 |
| | 2176 | 腰椎每側「5 to 7 degrees」；臨床量測常因髖／骨盆旋轉而超標 | FR-29、BK-28 |
| | 2178 | 單一腰椎節間旋轉僅「just more than 1 degree」（L3–L4）；3° 即有損傷風險 | FR-29、BK-28 |
| `028_12_Hip.md` | 887 | 屈膝時髖屈約 120°；**伸膝時僅 70–80°**（腿後肌群張力），個體差異大 | 條件表、BR-24 |
| | 897 | 髖伸展約 20°；**膝完全屈曲時髖伸展被股直肌拉回約中立位** | BR-24 |
| `029_13_Knee.md` | 561 | 膝屈曲 **130–150°**、伸展超過 0° 約 5–10°；隨年齡與性別而異；tibial-on-femoral 與 femoral-on-tibial 兩情境共用 | BR-24 |
| | 1966 | 「ATYPICAL MOVEMENT COMBINATIONS」段標＋Fig. 13.44 定義（**雙欄交錯行**） | BR-24 |
| | 1998 | 髖伸展＋膝屈曲時股直肌兩端過度伸長「passively resisting knee flexion … knee flexion force and range of motion are usually limited」；腿後肌群過短「often accompanied by cramping」（**雙欄交錯行**） | BR-24 |

### Nordin & Frankel《Basic Biomechanics》4th ed

| 檔案 | 行號 | 內容 | 用於 |
|---|---|---|---|
| `026_CHAPTER_13__Biomechanics_of_the_Elbow.md` | 101 | 肘屈伸正常範圍 **0°–146°**，功能範圍 30°–130°（Morrey et al., 1981） | FR-16、BK-15、BF-15 |
| | 563 | 章末重點：功能範圍 30°–130° 屈伸、50°–50° 旋前旋後 | FR-16、BF-15 |

**教科書未給、本檔明標「未給」而未填補的數值**：
- 肩屈曲的**被動**最大值（Neumann 只對肩伸展標主被動）
- **雙臂併攏夾耳**時的肩上舉 ROM
- **水平懸浮姿勢**下的肩上舉與脊椎旋轉 ROM（Neumann 的脊椎旋轉值為直立承重量測）
- 按**肩位置分列**的肘屈伸 ROM
- 膝屈曲 130–150° 的**主動／被動**區分與**髖位置**條件（僅在另段 `:1966`／`:1998` 以機轉方式帶到，非數值）
- **仰臥姿勢**下的脊椎軸向旋轉 ROM

---

## 本批發現摘要

1. **8 條全部含 C 成分，其中 3 條 C 為主體**（FR-29、BK-28、ST-01）。B 類的裁決權限比想像中窄：教科書只能回答「這個數字解剖上可不可能」，回答不了「游泳實際／應該是多少」。整合時若把本檔的「支持」讀成「游泳確實如此」，就是型4 跨層誤用。

2. **原文的 8 個數字有 6 個毫無爭議、但也毫無鑑別力**。三個肘角（90°、90°–100°、90°–100°）都落在功能弧 30°–130° 的正中央，是日常人人天天在用的角度；膝 130°–140° 比教科書上限保守 10°；肩 90°–130° 在複合體範圍內綽綽有餘。**這些數字無法用來判定「學生做不到是硬體邊界」**——把它們寫成教學門檻會製造假的能力判定。

3. **唯一真正貼近硬體邊界的是 ST-01（肩 170°–180°）**。教科書三處一致給「**近** 180°」為正常上限，170°–180° 正好貼著上限、沒有餘裕。這是全批唯一「ROM 不足」在解剖上真實可能的條目，但排除順序必須是：肩胛上迴旋 → 胸椎姿勢／胸小肌（`:2027–2037` 明列的可逆因素）→ 才輪到盂肱本身。

4. **body roll 兩條（FR-29、BK-28）的問題不在數字大小，在量測基準未定義**。教科書給的是**直立承重**下胸腰段的**節間**旋轉（合計每側約 40°）；游泳的 body roll 通常指**水平非承重、骨盆不被固定**時的**全身滾轉角**，兩者不是同一個量。在補上 `滾轉量測基準` 欄位之前，30°–45° 與 30°–40° 都無法與任何教科書值對照。附帶結論：**「仰式比自由式滾得少 5°」在教科書層完全沒有支撐**，不得當作兩式的區別性事實。

5. **BR-24 揭出一個原文藏起來的真實取捨**。教科書明講膝屈曲的可用 ROM 取決於髖位置：髖接近伸直＋膝屈曲時，股直肌兩端同時被拉長，**膝屈曲的力量與 ROM 雙雙受限**（`029_13_Knee.md:1998`）。蛙式收腿要降低迎水面積就得少屈髖，正好落進這個組合。原文只寫「最大可達 130°–140°」一個無條件數字，把取捨整個掩蓋。**判讀含義**：用仰躺屈髖的膝柔軟度測驗去判定蛙式收腿能力，方法本身就是錯的。

6. **量測條件缺欄是結構性缺陷，與前批同源**。原文的 ROM 欄位只有「數值」一格，沒有 `主動/被動`、`相鄰關節位置`、`承重/非承重`、`單關節/複合體` 四欄。缺 `單關節/複合體` 造成 FR-02（130° 已跨過盂肱上限）與 ST-01（170°–180° 掛在「肩關節」上，但原文自己在 ST-05/06/07 已寫出肩胛層，**同文件內歸屬不一致**）兩處問題；缺 `相鄰關節位置` 造成 BR-24 的取捨被掩蓋。**治本是補這四欄，不是修個別數字。**

---

## 交接：本檔未處理與後續

- 本檔只處理 B 類 8 條，**不觸碰** A 類（已於前五份裁決檔完成）與 C 類。
- C 類須另立批次，依協議 §1 改用 `resources/books/swimming-kinetic-chain/` 游泳文獻集，**不得用本兩本教科書裁決**。
- 上述「發現摘要」第 6 點的四欄補充，屬原始筆記的結構性修補，應在整合階段一次做完，不逐條打補丁。