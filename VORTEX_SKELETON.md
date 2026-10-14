# Vortex — 骨架總覽

> 這份只描述**骨架、設計概念、整體樣貌**，不含任何內容文字。
> 內容真相源在 `TheVortexProject/canonical/`，本站只是公開呈現層。
> 2026-10-14 三層重構後重寫；2026-09-26 以前的舊骨架（techō 首頁、`vortex-*` layout）隨舊站封存於 git 標籤 `legacy-site-2026-09-26`。

---

## 1. 它是什麼

`my-site`（Cortex）底下的 Vortex 系列，網址 `/vortex/`。渦流計劃（游泳水感教學研究）的**公開呈現層**。

- 線上：`https://hangsau.github.io/cortex/vortex/`
- 資料流：Vortex `canonical/*.yaml`、`Drills/`、`indices/`、審查紀錄 → `tools/sync_vortex.py`（CI，由 Vortex 的 notify-mysite 觸發）→ `data/vortex|adm|periodization|breathing|movement/`、`content/vortex/research/` → `next/` 版型。**勿手改同步產物。**

---

## 2. 三層：知識／應用／研究庫

首頁、左欄第一層都分成三個入口，不問讀者身分、不分流。

| 層 | 回答什麼 | 頁面 |
|---|---|---|
| **知識** | 這件事是什麼、為什麼 | 6 泳式頁、水感發展地圖 L0–L6、呼吸、心理、骨關節、動作圖譜、練習、技術分析、運動傷害；全部由 canonical 生成的知識點頁 |
| **應用** | 我現在該怎麼做 | 找問題（problems）、課表與間歇計時、器材使用指南、ADM 運動員發展、訓練週期化 |
| **研究庫** | 這個結論怎麼來的、可信到什麼程度 | 來源條目頁（反向列出引用它的知識點）、審查與裁決紀錄、研究筆記（研究中）、研究底稿（凍結的散文長文） |

**層間連結**：知識點頁底部「證據與來源」統一列出本頁引用的來源（可點進來源條目頁），並有「這條結論怎麼來的」連到裁決紀錄的段落錨點（資料來自 Vortex `indices/decision_trail.json`）；交叉引用印成標題連結，不印 ID。

---

## 3. 核心設計概念

### 3.1 內容哲學：感知優先
- 命題：**技術是感知的輸出，不是輸入**。首頁先給「什麼是水感」，再進泳式與 L 級。

### 3.2 公開／診斷分層（硬邊界）
- 公開頁只放物理、硬體邊界、常見錯誤口令、L0–L6 序列、相關 drill。
- 不放診斷判讀語（A/B/C 型、「泳者說」、typical_speech…）。剝除在 `sync_vortex.py`：canonical `public` 白名單輸出；散文進研究庫前由 `strip_diagnostic()` 剝除；`maintenance_note` 任何檔、任何層級都不出站（`dump_yaml()`）。

### 3.3 散文不在知識區
- Instructional／Technica 長文只以研究底稿出現（`content/vortex/research/drafts/`，頁首印凍結說明、剝除診斷語與外連）。Bridge 已退役。舊網址由 `tools/build_redirects.py` 轉址（121 個）。
- 例外：「什麼是水感」（`next/content/vortex/water-sense.md`）原樣同步 Vortex `Technica/水感是什麼.md`；器材指南是應用層文章。

### 3.4 視覺語言：「野外圖鑑」
- token 在 `next/assets/css/tokens.css`：紙色 `#FAFAF7`、墨 `#14171A`、Vortex 系列色 `#0B6E8A`、左緣拇指索引色帶、四級字級、正文欄 36em、最小點擊 48px（池邊濕手）。
- 字體 Noto Serif TC（標題）＋ Noto Sans TC（內文）。全繁中。

### 3.5 知識確定性標記
🔵 推導／作者綜合 · 🟢 近期文獻 · 🟡 舊文獻 · 🟠 教練實務觀察 · 🔴 待查。研究庫首頁說明怎麼讀；確定性不等於來源查驗狀態，來源條目頁另標 verified／unverified。

---

## 4. 頁面來源與版型

```
next/content/vortex/
  _index.md                 首頁 → _partials/vortex/home.html（三入口＋從一種泳式開始）
  _content.gotmpl           約千個知識點頁、6 泳式頁、清單頁、研究庫來源條目頁
  water-sense.md            什麼是水感（原樣同步）
  breathing.md / psychology.md / joints.md / movement.md / periodization.md
  workout.md / workout-studio.md   課表與間歇計時
  adm/                      ADM 首頁、矩陣、標準
content/vortex/（同步產物，hugo.toml 掛載）
  instructional/            只剩器材使用指南
  research/                 研究庫：_index、sources/、rulings/、notes/、drafts/
```

| partial（`next/layouts/_partials/vortex/`） | 服務頁 |
|---|---|
| `home.html` | `/vortex/` 首頁 |
| `rail.html` | 左欄兩層樹：上層三入口、下層本頁目次 |
| `stroke.html` | 泳式頁（動作來自 canonical `moves.yaml`） |
| `unit.html` | 知識點頁（證據與來源、這條結論怎麼來的、交叉引用） |
| `list.html`、`reading-list.html`、`next-read.html` | 清單頁、section 清單、接著讀 |
| `research-home.html`、`source.html`、`article.html` | 研究庫首頁、來源條目頁、文章（研究筆記／底稿／裁決紀錄，依 front matter 印狀態） |
| `breathing.html`、`psychology-read.html`、`joints.html`、`movement.html`、`periodization.html`、`adm-*.html` | 各專頁 |
| `workout*.html` | 課表、團體水道、工作台 |

分派：`next/layouts/vortex/page.html`／`section.html`，`role` 缺省時有 `unit_id`→unit、section→reading-list、其他→article。

---

## 5. 維護紅線

1. 內容改 Vortex `canonical/`，不改 `data/` 或 `content/vortex/`。
2. 新增公開內容前確認沒有診斷用語外洩（Vortex validate W028、sync 端剝除兩道）。
3. 研究庫的審查／裁決紀錄由 `sync_vortex.py` 的白名單（`RULING_FILES`）決定哪些 plans 檔公開；新增要公開的紀錄要登錄白名單。
4. 驗收：`python -X utf8 next/specs/check.py <W>`（22 項）＋ `python -X utf8 tools/build_redirects.py`；呼吸安全段必須置頂且不可收合（V3）。
