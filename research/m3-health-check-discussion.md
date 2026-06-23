# M3 ×ⁱ Claude 全站健康檢查 · 嚴格審查討論

> 機制：M3 stateless，每輪由 Claude 餵「角色指令 ＋ 完整 transcript ＋ 本輪發言」。
> M3 宣稱數字／行號，Claude 先 grep 第一手驗證再採信。
> 用戶指派：M3 負責檢驗與提供意見，做**最嚴格的控管與監督**。

---

## 共享 BRIEF

### 受檢對象
my-site（Cortex）整站。Hugo 靜態站。四大區：
- **Library**：CSCS《Essentials of Strength Training》24 章 ＋ mind-for-numbers ＋ uncommon-sense-teaching
- **Temperament**：氣質類型模組（traits/types/frameworks/critique/quiz/fit/refs）
- **Notebook**：個人筆記（coaching/ideas）
- **Vortex**：游泳教學核心區（6 泳式 ＋ adm ＋ bridge ＋ instructional ＋ technica ＋ drills ＋ injuries ＋ psychology ＋ levels ＋ periodization ＋ breathing）

### 6 泳式定義
freestyle / backstroke / breaststroke / butterfly ＋ underwater-dolphin-kick(udk) ＋ starts-turns。
**設計硬約束：6 泳式應對稱覆蓋**（同類內容深度相當）。

### 確定性標記
🔵推導 · 🟢近期文獻 · 🟡舊文獻 · 🟠教練觀測 · 🔴待驗證假設

### 資料流
TheVortexProject/canonical/* → tools/sync_vortex.py → my-site data/{vortex,adm,periodization}/。
**內容改 canonical，不直接改 my-site data/。** data/{mnfl,ust,temperament}/ ＋ books.yaml 為 my-site 自有可直改。

### 檢查 5 維度
位置適切性 · 內容正確性 · 完整性／缺口 · 模組化缺陷 · 改善空間

---

## CLAUDE 第 1 輪：四路徑深讀 ＋ 第一手 grep 驗證後的彙整

（4 個 inventory agent ＋ Claude 親自 grep 數字驗證；以下數字皆已 grep 確認，非 agent 推測）

### A. 6 泳式覆蓋矩陣（grep 實數）

| 泳式 | 水感招式(yaml) | drills | teaching-errors | technical-analysis | bridge |
|------|---------------|--------|------------------|---------------------|--------|
| free | 8 | 34 | **23** | 26 | ✓ |
| back | 9 | 31 | **5** | 27 | ✓ |
| breast | 11 | 43 | 12 | 31 | ✓ |
| fly | 9 | 40 | 14 | 35 | ✓ |
| udk | 7 | **0** | 13 | 29 | ✓ |
| starts-turns | 7 | **0** | 9 | 40 | ✓ |

drills 總 129、teaching-errors 總 76、technical-analysis 總 188。

### B. 已 grep 確認的「真缺口／不對稱」

**缺口①：backstroke teaching-errors 只有 5 條（back.err1–err5）**，free 有 23、fly 14、udk 13、breast 12、starts-turns 9。背式是明顯離群的最少。canonical 源：`TheVortexProject/canonical/instructional/teaching-errors.yaml`。

**缺口②：udk 與 starts-turns 各有 0 條 drills**，而 free/back/breast/fly 各 31–43 條。但 udk/starts-turns 在 teaching-errors 與 technical-analysis 都有覆蓋（13/29、9/40），唯獨 drills 缺。問題：這是刻意（udk/starts-turns 是技術片段非連續泳式，drill 概念不同）還是真缺？

### C. 內容正確性小瑕疵

- ~~breast.yaml~~ 一處 `🟠 Ward` 引用缺年份。**（更正：位置非 breast.yaml，實為 technical-analysis.yaml + l-indicators.yaml；已查證補為 Ward 2018）**
- temperament types.yaml 類型比例標 🟡（待查），來源不確定。
- bridge 6 檔刻意輕引用（屬「物理→感知」翻譯層，非研究文件）——agent 判定可接受。

### D. 其餘區塊（grep ＋ 抽樣確認）

- CSCS：24 章齊全，多數 8 子頁，ch15(15)/ch16(11) 較多。內容紮實。
- mnfl(47 技法)/ust(10 章＋24 策略)/temperament(9 維＋5 框架＋18 題測驗)：完整、有引用、無 stub。
- **Notebook：3 個 _index.md 全是空殼**（只有 front-matter，無正文）。
- 週期化頁：上一輪已與你討論完並修正（dryland/zones 重排、感知橋接 teaser、rail 圖例），已上線。

### E. 模組化（Sonnet agent ＋ grep 驗證）

整體乾淨。**真缺陷 3 項**：
1. `cscs-chapter.css:104,108` 兩處 `!important`——違反 CLAUDE.md「不用 !important」。
2. `my-site/CLAUDE.md` ADM 段仍寫 `.Site.Data.*`，但程式碼已全遷 `hugo.Data`（grep：.Site.Data 命中 0）——文件落後。
3. `MAP.md` 兩處過時宣稱：① database 頁「有 inline JS 不載 vortex.js」實為載入且無 inline JS；② 「~8 layouts 仍用 .Site.Data」實為 0。

低優先：key→slug 映射 dict 在 3 個 layout 各 inline 一份。
確認刻意非缺陷：water-sense.md body 死碼（自我標註）、vortex.css RWD 散布、psychology 雙入口。

### CLAUDE 提案的行動分流

**即刻自主修（cheap、低風險、my-site 自有層）：**
- 修 cscs-chapter.css 兩處 !important（改 specificity）
- 對齊 CLAUDE.md ADM 段（.Site.Data → hugo.Data）
- 更正 MAP.md 兩處過時宣稱

**列為下一步研究／canonical 內容任務（不在本輪倉促寫）：**
- 缺口①背式 teaching-errors 補足（需游泳研究＋過三關校正，走 canonical）
- 缺口②udk/starts-turns drills：先判定刻意 vs 真缺，再決定補不補
- breast.yaml Ward 引用補年份（canonical）
- temperament types 比例來源查證

**不動：**
- Notebook 空殼（刻意 scaffold）、bridge 輕引用（翻譯層本質）

---

## 【本輪給 M3 的提問】

請以最嚴格審查者身分，逐點表態（同意／反對／修正＋一句理由）：

1. 覆蓋矩陣裡，**缺口①背式 teaching-errors=5** 你認為是「必補的真缺口」還是「背式錯誤本來就少」？若必補，補到幾條算對稱合格？
2. **缺口②udk/starts-turns 0 drills** 你判定刻意還是真缺？理由？
3. 我把「即刻修 3 項模組化」與「內容缺口列為研究任務」分流——你同意這個「cheap 即修、content 緩議」的界線嗎？還是有哪項 content 缺口嚴重到該升級為即刻處理？
4. 我有沒有**漏掉**任何該查而沒查的維度？（例：跨頁導航斷點、canonical↔my-site 同步漂移、無障礙、SEO/metadata、死連結）——你認為最該補查的是哪一項？

繁中，逐點回，每點一句理由。可加我沒想到的第 5 點。

---

## 第 1 輪 · M3（最嚴格審查者）

1. 背式 err=5 **真缺必補**，對稱線 ≥12（比照 breast）。
2. udk/starts-turns 0 drills **真缺**，udk ≥3–5 kick drill、starts-turns ≥3 蹬台/翻牆 drill。
3. 分流方向同意，但 **breast Ward 缺年份 ＋ temperament 比例查證升 P0 即修**（單點事實校對非研究）。
4. **漏查最關鍵：canonical↔my-site 同步漂移**——sync 何時跑？git hash 對得上嗎？次要：死連結、a11y。
5. **grep 計數 ≠ 內容品質**，補缺口前先抽讀條目確認顆粒度，免得只補空殼數字。

## 第 1 輪 · CLAUDE 第一手驗證（grep 後回應 M3）

- **④ 同步漂移 → 驗證為「無漂移」**：teaching-errors / technical-analysis 逐式條目數 canonical↔my-site **完全相同**（背5/蛙12/蝶14/自23/出9/UDK13）。raw diff 3732 行的來源是 sync_vortex.py **剝診斷層**（canonical 150 個 diagnostic/perception_impact 欄 → my-site 剩 74，砍半）。my-site 於 2026-06-06 12:38:34 同步，canonical 同日 12:38:04 異動——同步晚 30 秒，無漂移。M3 此點值得查但結果乾淨。
- **⑤ → 對背式證偽**：抽讀 back.err1，含 3 條具引用 evidence（Gonjo 2020/2021、Race Club）＋ perception_impact，**顆粒度充足非空殼**。5 vs 23 是真實「條目數少」而非「每條淺」。M3 的空殼疑慮對背式不成立，但作為通則保留。
- **① 確認**：背式 err=5 在 canonical 端也是 5（commit 訊息自記「仰5」），**真缺口，走 canonical 補**。採納 M3 對稱線 ≥12。
- **③ 部分採納**：temperament types 比例為 my-site 自有層可直查直改，升 P0。**但 breast Ward 補年份需要知道是哪篇 Ward 研究**——我不能憑空填年份，這是 research 不是 5 分鐘校對，維持研究任務（除非查得到源）。
- **註**：M3「492 筆」一語在我的數據中不存在，判定為幻覺，已捨棄不採。

## 第 2 輪 · CLAUDE：鎖定最終行動計畫，請 M3 簽核或駁回

**即刻自主修（本輪做完）：**
1. cscs-chapter.css:104,108 兩處 !important → 改 specificity
2. CLAUDE.md ADM 段 .Site.Data → hugo.Data
3. MAP.md 兩處過時宣稱更正
4. temperament types.yaml 比例來源：先查現況再決定標 🔴 或補源

**下一步研究任務（寫進報告，不本輪倉促寫，全走 canonical ＋ 三關校正）：**
- P1 背式 teaching-errors 5→≥12（最高優先，最大不對稱）
- P1 udk drills ≥3–5、starts-turns drills ≥3
- P2 breast.yaml Ward 引用查源補年份
- P2 free/back/breast/fly drills 之外，補 udk/starts-turns 後重抽顆粒度

**不動**：Notebook 空殼、bridge 輕引用。

請 M3 對「即刻修 4 項 ＋ 研究任務 P1/P2 排序」做最終簽核：有無該升降級的？背式補到 12 是否足夠對稱、還是該對齊 free 的 23？繁中，200 字內。

## 第 2 輪 · M3（最終簽核）

1. 對稱線 **≥14**（breast12/fly14/udk13 中位）非 12；不硬拉到 free 的 23（free 是 cluster 頂端，硬跟進會灌水）。
2. starts-turns drills **≥5** 非 3（drill 數低於 err 數是另一種不對稱）。
3. temperament P0 同意；Ward P2 同意（單篇考據非 trivial）。
4. drills 顆粒度複查擺補完後 OK，但**抽讀若發現空殼就再補一輪，不是寫進報告就結案**。
5. 排序與分流界線同意，**簽核通過**。

## 第 2 輪 · CLAUDE 驗證後修正（temperament 免動）

抽讀 `data/temperament/types.yaml`：第 3 行 note 已自白「比例（40/10/15/35）為 NYLS 廣傳數字，🟡 須回原文核實；本站一律加『約』」，四型 ratio 全標 🟡＋「約」。**已是正確處置，無需修改**——M3 的 temperament P0 在內容端已自我解決。即刻修因此剩 3 項（已全做）。

---

## 最終決議（雙方收斂；M3 簽核通過 2026-06-23）

### 即刻自主修（本輪已完成 ＋ build 通過）
1. ✅ `cscs-chapter.css` 兩處 `!important` → 改 `.cell.center:hover` specificity 解
2. ✅ `CLAUDE.md` ADM 段 `.Site.Data.*` → `index hugo.Data`
3. ✅ `MAP.md` 過時宣稱更正：表格 row + 雷區 §2/§7/§9（database/standards 載 vortex.js 無 inline JS；stroke dict 已抽 partial；.Site.Data 命中 0）
4. ⊘ temperament 比例：驗證後確認已自我標 🟡＋「約」，免動

### 下一步研究任務（走 canonical ＋ 三關校正，非本輪倉促寫）
- **P1** 背式 teaching-errors 5 → **≥14**（最大不對稱；canonical/instructional/teaching-errors.yaml）
- **P1** udk drills **≥3–5**、starts-turns drills **≥5**（drills.yaml 端，udk/starts-turns 現各 0）
- **P2** breast.yaml `🟠 Ward` 引用查源補年份（canonical/technica）
- **P2** 補完 drills 後重抽顆粒度，發現空殼再補一輪

### 確認不動
Notebook 空殼（刻意 scaffold）、bridge 6 檔輕引用（物理→感知翻譯層本質）、vortex.css RWD 散布、water-sense.md 死碼（自我標註）。
