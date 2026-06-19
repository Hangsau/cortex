# Vortex — 骨架總覽

> 這份只描述**骨架、設計概念、整體樣貌**，不含任何內容文字。
> 內容真相源在 `TheVortexProject/canonical/`，本站只是公開呈現層。

---

## 1. 它是什麼

`my-site`（Cortex）底下的一個 Hugo section，路徑 `content/vortex/`，nav 顯示「Vortex」。
渦流計劃（游泳水感教學研究）的**公開知識展示面**。

- 線上：`https://hangsau.github.io/cortex/vortex/`
- 資料流：`canonical/*.yaml` → `tools/sync_vortex.py` → `data/vortex/` → layout（**勿手改 `data/`**）

---

## 2. 核心設計概念

### 2.1 內容哲學：感知優先（perception-first）
- 命題：**技術是感知的「輸出」，不是輸入**——感知對了，動作自己會收斂。
- 漏斗順序：先懂「水感是什麼」→ 再挑一式 → 把感知練成動作。
- 不做 prescriptive（不規定「該有什麼感覺」）；軸是「游者說了什麼 → 判斷」。

### 2.2 公開／診斷分層（硬邊界）
- **公開頁只放**：物理現實、硬體邊界、常見錯誤口令、L0–L6 序列、相關 drill。
- **不放公開頁**：感知判讀診斷語（「泳者說 X = 到位」、三型／A型／B型／C型／typical_speech／main_problem）。
- 淨化在 `sync_vortex.py` 階段完成。

### 2.3 視覺語言：日式文具（techō / Hobonichi 手帳）
- 定義在 `static/css/vortex-techo.css`（首頁 `tx-*`）+ `static/css/vortex.css` 的 `:root` token（子頁 `vx-*`）。
- 底色 `#FAFAF7`／柿橘強調 `#D4622A`／橫罫格線當骨架／細邊框取代卡片／**無圓角**／留白即設計。
- 字體：Shippori Mincho + Noto Serif TC（標題）、Courier Prime + Noto Sans TC（內文/mono）。
- 全繁中，無裝飾性英文（eyebrow/印章/欄位 key 都改回中文）。

### 2.4 知識確定性標記
每條內容標注來源可信度：🔵 推導 · 🟢 近期文獻 · 🟡 舊文獻 · 🟠 教練觀測 · 🔴 待查。

---

## 3. 頁面骨架（content tree）

```
content/vortex/
  _index.md                    layout: vortex-home      → 全站門面（見 §4）
  freestyle/_index.md          layout: vortex-stroke    ┐
  backstroke/_index.md         layout: vortex-stroke    │ 六大單元
  breaststroke/_index.md       layout: vortex-stroke    │ 每式一頁
  butterfly/_index.md          layout: vortex-stroke    │ master-detail
  starts-turns/_index.md       layout: vortex-stroke    │
  underwater-dolphin-kick/...  layout: vortex-stroke    ┘
  levels/_index.md             layout: vortex-levels        → 水感發展 L0–L6
  technica/water-sense-guide   layout: vortex-water-sense   → 「什麼是水感」設計頁
  psychology/_index.md         layout: vortex-psychology    → 心理層（恐懼/動機/心流）
  periodization/_index.md      layout: vortex-periodization → 訓練週期化
  database/_index.md           layout: vortex-database      → 跨泳式資料庫
  adm/
    _index.md                  layout: vortex-adm-home      → 運動員發展矩陣 首頁
    matrix.md                  layout: vortex-adm-matrix    → 4 支柱 × 4 階段
    standards.md               layout: vortex-adm-standards → 技術標準（篩選+搜尋）
    background.md              layout: vortex-adm-single    → 長文
  technica/_index.md           （研究原文存檔 · 未編排）
  instructional/_index.md      （技術原文存檔 · 未編排）
  bridge/_index.md             （感知橋接 · 存檔）
```

---

## 4. 首頁編排（vortex-home / techō）

由上而下五段，是整個站的引導漏斗：

```
[ masthead ]      渦流計劃印章 + 大標「水感」 + lead（感知優先命題）
   │
[ 序 · 00 ]       新手入口 tx-hero「什麼是水感？」→ water-sense-guide
   └ tx-path       理（水感理論） / 級（L0–L6）兩條岔路
   │
[ 圖 · 水感地圖 ]  L0–L6 × 四式矩陣，點格→側面板讀該級細節
   └ 共同地基       L0 呼吸 / L1 漂浮（四式共用）→ L2 起分流
   └ L0− 心理層     恐懼/動機/注意力 chips → psychology
   │
[ 六 · 六大單元 ]  六式 ledger（details 展開看動作分解）→ 進入各式頁
   │
[ ＋ · 放大尺度 ]  四張卡：ADM / 週期化 / 依需求找練習 / 跨泳式查資料
   │
[ legend ]        研究原文存檔連結 + 確定性標記圖例
```

導航模式：地圖格與心理 chips 觸發**右側滑出側面板**（`tx-detail`，純 JS，無 JS 時地圖仍可看）。

---

## 5. layout ↔ 頁面對照

| layout | 服務頁 | 互動模式 |
|--------|--------|----------|
| `vortex-home` | `/vortex/` | techō 單頁 + 側面板（tx-*） |
| `vortex-stroke` | 每式一頁 | sticky 左 rail + 主面板就地切換（hash 路由，不重載） |
| `vortex-levels` | 水感 L0–L6 | rail + ladder（原生 `<details>`） |
| `vortex-water-sense` | 什麼是水感 | master-detail 7 面板 + 22 ladder |
| `vortex-psychology` | 心理層 | 處境門面 + master-detail（每頁 L0–L6 定位梯） |
| `vortex-periodization` | 週期化 | 左目次 + 4 面板，概念 `<details>` 收合 |
| `vortex-database` | 資料庫 | 主角「想練什麼?」三軸 picker + 配角三 tab 查找 |
| `vortex-adm-*` | ADM 四頁 | home/matrix(master-detail)/standards(篩選)/single(長文) |

---

## 6. 結構特性（整體樣貌）

- **三層導覽深度**：首頁漏斗 → section 頁（rail/面板）→ 概念 `<details>` 展開。
- **不跳頁、不攏長**：master-detail 就地 swap + 原生折疊，避免落地長到天邊。
- **token-driven 換皮**：改 `vortex.css :root` 一處，全 `vx-*` 子頁同步換設計語言，結構/JS 不動。
- **server-side render 為主**：JS 只切可見性；`<noscript>` 下全展開仍可讀。
- **入站引導靠處境卡**，不靠角色選擇器（不分教練/選手/家長）、不按教科書 topic 目錄。

---

## 7. 維護紅線

1. 內容改 `canonical/` 再跑 `sync_vortex.py`，**不手改 `data/vortex|adm|periodization/`**。
2. 新增公開內容前確認**沒洩漏診斷型碼**（三型/A型/B型/C型/typical_speech/main_problem）。
3. CSS/JS 路徑用 `{{ .Site.BaseURL }}css/x.css`（不加前綴 `/`）。
4. layout 仍用 `.Site.Data.*`（已 deprecated）——未來 Hugo 升版需遷 `hugo.Data`。
5. live = CI 每次 push `hugo --minify` 重 build，`public/` 不進 git。
```