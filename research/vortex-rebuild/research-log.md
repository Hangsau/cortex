# Vortex 整站重做 — 呈現方式從零研究（研究日誌）

> 委託要求（2026-06-17，逐字鎖死）：
> - Vortex **整個網站重做**，跟現在**完全不一樣**、連設計邏輯都不留、一點原本的影子都沒有。
> - **去外面好好研究**「一個網站到底該怎麼做」：GitHub、討論區、各種地方，看**討論度高、使用率高**的專案**人家是怎麼設計的、邏輯是什麼**，學起來。
> - **參考可以、不准抄**，整體要自己做（原創）。
> - 研究好才動手；下一次要看到的是跟現在完全不同的**實際原型**，不是報告。
>
> 不變的底線：① 游泳知識內容（canonical）不重寫，重做的是「網站的形狀與呈現」；② 感知判讀語禁區照舊（不出現「自陳/症狀 ∴ 某感知/技術不好」）；③ 設計風格預設仍從 DESIGN_SYSTEM.md 挑，但挑一個跟現在徹底不同的方向（若要突破設計規範另外確認）。
>
> **2026-07-31 修正**：DESIGN_SYSTEM.md 已改版，**風格方案清單（8 種）已刪除**，不再有「挑一種」這回事。現行做法是用該檔的「創作方向維度」六軸**現生**一個方向，再用鐵則 A–I 過閘。故上述 ③ 應讀為：用六軸生方向 + 每個決策答得出來歷。
>
> 本檔是**研究日誌**：記錄每個被研究的範式「人家怎麼設計、邏輯是什麼、為何有效、跟 Vortex 的關係、我學到什麼」。不是抄它們，是萃取原理。

---

## 0. 為什麼現在的 Vortex 要整個丟掉（先講清楚要逃離什麼）

現在的 Vortex 骨子裡是**「一份由上而下的目次清單」**：首頁是十幾條等重的 `vx-toc-row`，固定一條教練課綱順序，眼睛沒有落點、找不到自己要的。它的設計邏輯 = **線性文件站**（跟 Docusaurus / Starlight 同一個血統，見 §1.3）。

要重做就是要**換掉這個血統**，不是把列排得好看一點。下面研究的每個範式，都是在問「除了『一份清單』，知識還能怎麼被呈現」。

---

## 1. 高使用率／高討論度專案的設計邏輯（GitHub / 討論區）

### 1.1 roadmap.sh（kamranahmedse/developer-roadmap）— 範式：可走的地圖

- **使用率/討論度**：GitHub **第 6 高星**的專案，每月數十萬開發者使用。社群共建。→ 這是「把大領域當地圖呈現」這條路**經過市場驗證**的證據。
- **設計邏輯**：
  - 主視覺隱喻 = **roadmap（地圖/路線圖）**，不是目次。整個領域畫成一張**可點的節點圖**，節點之間有路徑與先後關係。
  - **雙軸入口**：role-based（「我想成為前端」→ 一條完整路線）vs skill-based（「我只想精通 React」→ 單點深入）。**同一份內容、兩種進入方式**，不分身份、不強迫選角色。
  - **不強制線性**：你可以照整條路走（新手），也可以直接跳到你缺的那個節點（老手）。節點可點開讀細節。
  - **同介面服務新手+老手**：新手靠「路線的順序與結構」被引導；老手靠「直接定位到單點」省略已會的。靠的是**使用者自選深度**，不是系統替他分流。
- **為何有效**：地圖讓人**一眼看到全貌 + 自己在哪 + 下一步**；順序資訊內建在圖的拓樸裡，不需要逐條讀。
- **與 Vortex 的關係（強）**：Vortex 有 L0–L6 發展脊椎 + 四式 + 起跳轉身 + 心理層 —— 這本來就是一張**水感發展地圖**，現在卻被壓成一條清單。roadmap.sh 證明「地圖」這條路可行且受歡迎。
- **我學到的原理（不是抄它的外觀）**：① 用**拓樸（節點+路徑）承載順序**，取代「由上而下的列」；② **雙軸自選入口**取代分流；③ 節點 = overview，點開 = detail（漸進揭露的空間化）。

### 1.2 Quartz / 數位花園（jackyzha0/quartz）— 範式：網狀互聯知識

- **使用率/討論度**：開源數位花園框架的代表，高討論。Jack Zhao 作。
- **設計邏輯**：**rhizomatic（根莖式）非線性**——知識不是樹狀目次，而是**節點互相連結的網**；強調概念之間的連結、backlink、graph view。
- **為何有效（與限制）**：適合「探索、發現概念間關係」；但對「我就是要快速找到自由式怎麼游」的目標型需求**不夠直接**（網狀容易迷航）。
- **與 Vortex 的關係（中）**：水感各概念之間確實高度互聯（呼吸↔放鬆↔節奏…），graph/backlink 可當**輔助層**，但不該當主入口（新手會迷路）。
- **我學到的原理**：知識之間的**橫向連結**值得被呈現（現在 Vortex 完全沒有），但要當第二層，不是落地主視覺。

### 1.3 Docusaurus / Starlight（Astro）— 範式：線性階層文件（= 現在 Vortex 的血統，要逃離的對象）

- **使用率**：文件站主流（Docusaurus 由 Meta 出、最成熟；Starlight 基於 Astro、快）。
- **設計邏輯**：為**線性、階層式文件**而生——左側 sidebar 樹狀目次 + 右側內文 + 搜尋。優先「資訊組織與可取得性」。
- **為何「對它們」有效**：API/技術文件的讀者**已經知道自己要查什麼**，樹狀目次 + 搜尋最有效率。
- **與 Vortex 的關係（反例）**：Vortex 的核心痛點正是「新手**不知道**自己要查什麼」——線性文件站正好**不解**這個問題。這就是現在 Vortex 失敗的根因：用了文件站的邏輯去服務一個「需要被引導看見全貌」的學習場景。**→ 要重做就是要離開這個血統。**

---

## 2. 知識/技能呈現的「主動理解」範式（explorable / 視覺優先）

### 2.1 Explorable Explanations（Bret Victor / Nicky Case / Ciechanowski / 3Blue1Brown / Distill）

- **討論度**：interactive explanation 一整個流派，awesome-explanations 等清單長期被引用。
- **核心邏輯**：不是「讀」而是「玩中學」——給可操作的模擬，讓人**自己試出概念**。
- **Nicky Case 萃取的設計模式**（直接可學的原理）：
  1. **Do & Show & Tell**：依概念選媒介——抽象用文字、關係用圖、過程/系統用互動。**不是什麼都做成互動**，是策略性混用。
  2. **Interest Curve（興趣曲線）**：低門檻鉤子 → 漸進建立基礎 → 進階綜合。
  3. **Start Small, Build Big**：把複雜系統拆成單一機制分開教，再逐步合併。
  4. **See, Model, Apply**：讓學習者自己產生資料點、自己發現規律，而非直接告知。
  5. **Cognitive Gates（認知門）**：**刻意延後/隱藏**某些解釋，依先備知識 gate 內容——「不給」反而學得更好。
  6. **Procedural Rhetoric**：用目標/可採取的動作引導探索。
- **與 Vortex 的關係（強）**：「水感」是**說不清、要體會**的東西——最適合 explorable（例如用互動示意去感覺「抓水 vs 滑水」的差別，**但不可下判語**，守 §禁區）。Cognitive Gates 對應 Vortex「L0 沒穩就先別看 L3」的層級邏輯。
- **限制**：互動製作成本高、且要 playtest；不能全站都互動。

### 2.2 互動式動作/解剖（Muscle & Motion、TeachMeAnatomy）— 範式：先看動作再讀字

- **使用率**：Muscle & Motion 自稱被 300+ 大學採用；TeachMeAnatomy 在 physio/sports science 廣用。
- **設計邏輯**：**視覺優先**——3D/動畫先讓你「看到動作怎麼動、肌肉怎麼用」，文字是輔助；可旋轉/縮放/看常見錯誤。
- **與 Vortex 的關係（強）**：游泳是**動作技術**，現在 Vortex 全靠文字描述動作（最難讀的部分）。「先給動作影像、文字輔助」是直接命中的方向。
- **我學到的原理**：動作類知識，**呈現順序應該是 視覺 → 文字**，不是文字配圖。

### 2.3 Scrollytelling（捲動敘事）— 有力但有明確禁區

- **設計邏輯**：捲動驅動的漸進揭露 + 視覺,把多層/技術主題變成有節奏的故事。資料顯示可大幅提升停留時間與捲動深度。
- **致命限制（對 Vortex 很重要）**：當使用者「只想快速找到某個東西/某份說明」,scrollytelling **是障礙**;且效能/行動裝置風險高;很多只是「捲動觸發動畫」沒有真正故事線。
- **與 Vortex 的關係（局部）**：適合「水感是什麼」這種需要被一步步帶著體會的**入門敘事**;**不適合**當「我要查自由式」的查找路徑。→ 只能局部用在入門線,不可當全站骨架。

---

## 3. 跨範式萃取的設計原理（學起來的東西，非抄外觀）

1. **用「空間/拓樸」承載順序與全貌**，取代「由上而下的列」——讓人一眼看到全圖 + 自己在哪（roadmap.sh）。
2. **雙軸自選入口**取代分流：同一份內容，給「照順序走」與「直接跳點」兩種進入,使用者自選深度,系統不替他分身份（roadmap.sh）。
3. **節點=overview,點開=detail**:漸進揭露空間化,落地頁輕、深度收在節點裡（roadmap + progressive disclosure）。
4. **動作類知識:視覺先於文字**（Muscle&Motion）。
5. **概念互聯當第二層**(backlink/關聯),不當落地主視覺（Quartz）。
6. **入門線可用「主動/敘事」,查找線必須「直接/可掃」**——兩種需求用兩種呈現,別混（explorable+scrolly 的限制）。
7. **認知門**:依層級刻意收起深層,呼應 Vortex L0–L6（Nicky Case Cognitive Gates）。
8. **逃離文件站血統**:不要 sidebar 樹狀目次當主結構(那是給「已知道要查什麼」的人)（Docusaurus 反例）。

---

## 4. 還要繼續挖的（下一輪研究）

- [ ] 進 GitHub 讀 roadmap.sh 實際是**怎麼做出來的**(渲染引擎、節點圖怎麼存與畫、互動如何實作),以及社群 issue/discussion 在爭論什麼設計取捨。
- [ ] 找更多「把大領域當地圖/圖譜」的高星專案與其討論(obsidian graph、excalidraw-based、學習地圖類)。
- [ ] 找運動/技術教學類網站(遊戲技能教學、樂器、武術)怎麼呈現「動作+進程」。
- [ ] 確認哪種範式能在 **Hugo 靜態站** 內實作(或是否需要換技術棧),並對齊 DESIGN_SYSTEM.md。
- [ ] 綜合成**一個我自己的 Vortex 呈現概念**(原創,不複製任一範式),再做可看的原型。

---

## 引用（供核對）

- Explorable Explanations 設計模式 — Nicky Case, https://blog.ncase.me/explorable-explanations/
- Explorable explanations(總覽/創作者) — Andy Matuschak notes, https://notes.andymatuschak.org/Explorable_explanations ; Wikipedia "Explorable explanation"
- roadmap.sh / developer-roadmap — https://roadmap.sh/ ; repo https://github.com/kamranahmedse/developer-roadmap (GitHub 第 6 高星,引自搜尋結果,**待入 repo 二次查證星數排名**)
- Quartz 數位花園 — https://quartz.jzhao.xyz/philosophy ; 作者 Jack Zhao
- Docusaurus vs Starlight — LogRocket, https://blog.logrocket.com/starlight-vs-docusaurus-building-documentation/
- Muscle & Motion — https://www.muscleandmotion.com/ ; TeachMeAnatomy 3D — https://teachmeanatomy.info/3d-model/movement/
- Scrollytelling 強弱 — Webflow Blog https://webflow.com/blog/scrollytelling-guide ; Lovable scrolling patterns https://lovable.dev/guides/scrolling-designs-patterns-when-to-use

> 待查證標記:roadmap.sh「第 6 高星」來自搜尋結果轉述,尚未進 GitHub 核實確切排名。
---
---

## 5. roadmap.sh 內部解剖(同一個「地圖」範式做到極致的專案)

> 為何要解剖它:§1.1 已講它的產品哲學,本節專問「它**怎麼做出來**、社群**在吵什麼**」。要重做地圖型 Vortex,這些是直接經驗。

### 5.1 技術棧與資料格式(從 repo 公開檔案推論)

- **規模**:GitHub 約 **358k stars**、44.2k forks。Roadmap.sh 主站另外跑(https://roadmap.sh/)。
- **前端框架**:**Astro + React islands**;語言 TypeScript 84.5%;樣式 **Tailwind CSS**;套件管理 **pnpm workspace**;測試 **Playwright**。
- **roadmap 資料**:放在 `src/data/roadmaps/`,**每個 topic 一份 markdown 檔**(非單一 JSON 資料檔);附屬資料夾 `question-groups/`、`best-practices/`、`projects/`、`videos/`、`authors/`。
- **節點座標**:從目錄命名(+ `renderer.ts` 存在於 `src/components/FrameRenderer/`)推斷,**節點位置是預先在資料/元件層定義**,非執行時動態佈局——才能保持「可走、可掃、可截圖分享」的印刷式地圖感。
- **渲染核心**:`src/components/FrameRenderer/` 底下有 `FrameRenderer.astro`、`renderer.ts`、`FrameRenderer.css`、`ProgressNudge.tsx`(進度提示)、`RoadmapFloatingChat.tsx`(AI 助教泡泡)。`renderer.ts` 為實際節點畫圖的主邏輯。
- **editor**:`draw.roadmap.sh` 是 roadmap.sh 自己做給貢獻者用的獨立編輯器;曾以 `@roadmapsh/editor` monorepo package 形式存在,但**目前未在公開 repo 找到獨立 source**(https://github.com/orgs/roadmapsh/repositories 顯示 0 public repos;roadmap-editor repo URL 404)— 可能私有或搬家, **未能查證** 確切開源狀態。
- **來源**:https://github.com/kamranahmedse/developer-roadmap (頁面文字、語言統計、目錄列表);https://github.com/kamranahmedse/developer-roadmap/blob/main/contributing.md (貢獻流程)。

### 5.2 互動實作與社群爭論

- **互動形態**(從 UI 文字 + 元件名推斷):節點**可點**展開 topic detail;有「topic 標記完成」的個人進度(localStorage 推測);有「AI 助教」浮動視窗;**有題組測驗**(`question-groups/` 資料夾 + issues 提到測驗題長度上限 500 字 bug)。
- **設計層 issue 數量很少**:前 10 個 open issues 大多是**內容勘誤**(特定 roadmap 錯字、404 連結)與**新 roadmap 建議**(Network Engineer、LeetCode、Competitive Programming 等);**只有少數是 UI/互動 bug**——例如 #10059 leaderboard 顯示 8 人非 10 人、#10019 題目超過 500 字無法作答、#9911 AI 頁 404。
- **設計/重構議題稀少的意涵**:roadmap.sh 視覺與互動**早被驗證為穩定**,社群注意力已轉到**內容擴張**——這是「設計已收斂」的訊號,值得學。
- **contributing 規則**值得抄的:① 修節點要開 issue、不要直接 PR(避免節點無序變動);② 每 topic 最多 8 個連結(避免資訊過載);③ 連結依類型前綴排序(`@official@ > @opensource@ > @article@ > @course@ > @video@ > @book@`)— 這是**資訊層次先於外觀**的原則。
- **來源**:https://github.com/kamranahmedse/developer-roadmap/issues ; https://github.com/kamranahmedse/developer-roadmap/blob/main/contributing.md

### 5.3 對 Vortex 的啟示(萃取原理,非抄實作)

1. **節點座標預先定義,非動態佈局**——水感發展脊椎(L0–L6 + 四式 + 起跳轉身 + 心理層)本就有「順序」,預先排好比 force-directed 更可讀、更印刷式。
2. **「內容/結構分離」比 roadmap.sh 走得更遠**:roadmap.sh topic 是 markdown,我可以用 YAML(已在 vortex 專案風格裡)+ Hugo data file 達成同等效果。
3. **「修節點要開 issue」對 Vortex 不適用**(內容是封閉的,不是開源共建)— 但**「每節點上限 N 個資源/連結」可以抄**,避免卡片肥胖。
4. **AI 助教 / floating chat** 是 roadmap.sh 2024–2026 的新增層(roadmap.sh 也加了)— Vortex 不做 AI,但可以做「教練觀點 hover 提示」這種**輕量輔助層**。

---

## 6. 8 個高星「領域地圖 / 技能呈現 / 視覺優先」專案(roadmap.sh 之外)

> 篩選標準:GitHub 星數 ≥10k,或設計邏輯可被 Vortex 借用。每個只列 ① 規模 ② 一句話設計邏輯 ③ 為何有效 ④ Vortex 可借的原理。**只看設計邏輯,絕不抄外觀**。

### 6.1 build-your-own-x — 517k stars

- **規模**:GitHub 517k stars、48.9k forks,CodeCrafters 維護,CC0 授權。
- **設計邏輯**:**「awesome list」雙層分類策展** — 頂層 28 個類別(3D Renderer、Database、Git、OS、Web Browser…),每類下依「程式語言 + 教學連結」排列。
- **為何有效**:用「語言 × 概念」二維矩陣讓讀者**自己選起點**(新手從 C 學資料庫、老手從 Rust 學 OS),**完全不分身份**;底層就是 Markdown bullet,**極簡到零成本**。
- **Vortex 可借**:Vortex 內容結構已是「L0–L6 × 四式」二維矩陣,本質是 build-your-own-x 的概念圖譜——只是**還沒用 markdown 連結把它打散成可橫跳的條目**。

### 6.2 excalidraw — 126k stars

- **規模**:126k stars;React + TypeScript;**自製手繪風渲染**;Firebase 多人協作;MIT。
- **設計邏輯**:**「虛擬白板」當萬用容器**——任何圖(架構圖、流程圖、wireframe)都能畫,且「手繪風」**降低精緻感造成的心理門檻**(人們不害怕修改一張「手繪」圖)。
- **為何有效**:把「畫知識圖」的工具成本降到零(開瀏覽器就畫),**作者即讀者、讀者即作者**。
- **Vortex 可借**:**「手繪風降低修改門檻」是個普世原理**——Vortex 視覺如果太精緻,教練想貢獻觀點會猶豫;風格略鬆、留白多,可降低編輯焦慮(對應 DESIGN_SYSTEM 選「偏鬆手繪」類型)。

### 6.3 tldraw — 47.9k stars

- **規模**:47.9k stars;React + TypeScript SDK;無限畫布 + AI canvas primitives;Google/Shopify/Autodesk 採用;生產環境需授權金鑰。
- **設計邏輯**:**無限畫布當產品本體**——可嵌入 YouTube/Figma/GitHub 卡片,「在畫布上擺東西」是唯一操作。
- **為何有效**:把所有內容「空間化」(座標有意義)而不是「時間化」(滾動有意義),**一眼看到全圖**。
- **Vortex 可借**:與 roadmap.sh 同源原理——**空間承載順序**,而非時間(滾動)承載。差異是 tldraw 是「無限自由」、roadmap.sh 是「結構化路徑」;Vortex 應取中間:**結構化路徑 + 局部可拖曳視角**。

### 6.4 xyflow / React Flow — 37.1k stars

- **規模**:37.1k stars;TypeScript + Svelte(雙版本);MIT;**專門做 node-based UI 的函式庫**。
- **設計邏輯**:**把「節點 + 連線 + 互動」做成可重用的引擎**——`useNodesState`/`useEdgesState` hooks、`MiniMap`、`Controls`、`Background` 元件都現成。
- **為何有效**:把 node UI 抽象成可插拔元件(節點內容、樣式、行為都可自訂),**做節點圖不再是研發工作,是組裝工作**。
- **Vortex 可借**:**如果 Vortex 真的要做互動節點圖,xyflow 是最低成本 React 選項**——但它要 React,Hugo 預設不用,需評估(見 §8)。

### 6.5 cytoscape.js — 11.1k stars(學術級 graph 函式庫)

- **規模**:11.1k stars;純 JavaScript 97%;發表於 Oxford Bioinformatics(2016、2023);**70+ 官方 extensions**;MIT。
- **設計邏輯**:**圖論模型與繪製器分離**——核心只處理「節點 + 邊 + 圖論演算法」(最短路徑、遍歷、layout),繪製可選。
- **為何有效**:給嚴肅圖論工作(生物網路、社群分析)用,Vortex 用不到圖論演算法層級,**但它的「layout 演算法庫」是教材級的**。
- **Vortex 可借**:**不需要整套 cytoscape**,但如果未來要「依 L 階段分層、或依泳式分群」的自動佈局,cytoscape 的 layout algorithms 是公開寶庫。

### 6.6 D3.js — 113k stars(資料驅動 DOM 的瑞士刀)

- **規模**:113k stars;JavaScript;ISC;`d3-force` 子模組是 force-directed graph 的標準解。
- **設計邏輯**:**「資料 → DOM/SVG 的綁定」**——不是「圖表庫」,是「資料到視覺的轉譯層」,任何自訂視覺都做得出來。
- **為何有效**:**完全可自訂**,從節點外觀到物理模擬(charge / link / center force)到拖曳、縮放、刷選都內建。
- **Vortex 可借**:D3 是**最務實的中量節點方案**(數十到數百節點,見 §8.2)。比 React Flow 輕、不需 React、生態成熟。

### 6.7 JavaScript30 — 29.2k stars(每日小專案教學)

- **規模**:29.2k stars;42k forks;Wes Bos 30 天純 JS 影片課;純 GitHub + 影片。
- **設計邏輯**:**「每日一個小專案」的線性序列,但 30 個專案之間互不耦合**——可從任一天插入,可跳著做。
- **為何有效**:**「線性包裝 + 模組化解構」的混合**;讀者看到「30 天」覺得可完成、不被嚇跑;實際每個專案獨立。
- **Vortex 可借**:Vortex「4 階段 + 6 個 L」的數字本身就帶有「進度感」——可以用 **「30 天水感計畫」這類具體時程包裝**,把發展地圖的抽象結構**轉譯成使用者可量化的承諾**。

### 6.8 Obsidian / Logseq / Notion 的 graph view(設計哲學對照)

- **共通技術**:**d3-force** 為主;節點 >2000 改 Canvas。
- **設計哲學差異**(影響 Vortex 選型):
  - **Obsidian** = 純網、Zettelkasten,graph 是主要心智模型 → 適合探索型讀者
  - **Logseq** = 樹為根、網為輔,先線性後抽連結 → 適合「想清楚再連結」的讀者
  - **Notion** = 關聯式,網狀靠 query 組裝,不靠視覺化 → 適合結構化思維者
- **Vortex 可借**:**三種哲學對應三種讀者**,Vortex 不該強迫某一種;**「圖譜當輔助層、不當主視覺」是 Quartz(§1.2)之後再次驗證的結論**。
- **來源**:Obsidian / Logseq / Notion 官方文件 + graph view 教學文(綜合);d3-force 用法 https://d3js.org/d3-force

---

## 7. 動作/技術教學專門:一個「身體動作 + 它在進程裡的位置」怎麼呈現

> Vortex 是「身體動作(游泳) + 進程(L0–L6)」。**這是 Vortex 與 roadmap.sh 最大的差異**——roadmap.sh 沒有「動作怎麼動」這層。本節找的全是「動作類」教學網站,看視覺優先怎麼做。

### 7.1 Brilliant.org — 互動視覺化 + 技能節點 + 蘇格拉底引導

- **規模**:STEM 教學龍頭;強調 "Every session is visual and interactive"。
- **設計邏輯**:
  1. **概念變可操控(manipulable)**:每個 STEM 概念都有一個可拖/可調的視覺,讓使用者**玩出規律**,不是被告知。
  2. **技能節點 + 弱點雷達**:`Koji tracks what you've mastered and where you're stuck` — 自動偵測卡關處。
  3. **蘇格拉底引導**:`Koji asks the right questions` — 問對問題 > 給對答案。
  4. **螺旋式 + 模組化課程**:Math = Arithmetic → Algebra → Equations → Quadratics → Calculus;每層回到前面的概念深化。
- **Vortex 可借**(直接命中):
  - **「水感是什麼」可以做成可操控的可視化**(例如「節奏 vs 速度」滑桿、感覺水域阻力變化),但**不可下判語**(守 §禁區)。
  - **技能節點 + 弱點自評**對應 Vortex L0–L6:使用者**自評**目前在哪個 L(開放式,不替他下判斷),站點給「這個 L 的代表性練習」連結。
  - **螺旋式課程**對應 Vortex「四式 + 心理層」會在不同 L 重訪同一概念。
- **來源**:https://brilliant.org/ (首頁「How Brilliant works」段落)

### 7.2 Yousician — 遊戲化 + 即時反饋(樂器教學代表)

- **設計邏輯**:`app listens to you play, gives instant feedback`;`beat high scores, level up`。
- **Vortex 可借**:**即時反饋**(但游泳教學網站不可能要使用者對著麥克風游)對應 Vortex 的「video 自我錄影對照標準動作」流程;**level up 遊戲化**對應 Vortex 的 L 階段晉升儀式感(可設計為「解鎖下一個 L 的入口動畫」,不需真的 L5 才能看 L6)。
- **限制**:純 app 模式,網頁能學的部分有限;**不直接借鑑其技術,借的是「進度視覺化」原理**。
- **來源**:https://yousician.com/

### 7.3 musictheory.net — 互動工具型教學

- **設計邏輯**:**Lessons(圖文講解) + Exercises(互動題) + Tools(可操作的視覺化工具)**三層;Tools 層可點選鋼琴鍵、聆聽聲音,讓抽象的音樂理論變可摸。
- **Vortex 可借**:**Lessons + Exercises + Tools 三層切分**值得抄——Vortex 可設:
  - **概念頁**(現有的文字章節,變成 lessons)
  - **Drill 卡頁**(現有的 L0–L6 drill,變成 exercises)
  - **互動示意工具**(新的一層:把抽象的「抓水 vs 滑水」「節奏 vs 速度」做成可操控示意,**不下判斷,只給「試試看」**)

### 7.4 W3Schools — 路徑 + 等級 + 「Try it」互動

- **設計邏輯**:**Tutorials / References / Exercises / Certificates** 四分;**每段程式碼旁邊有 "Try it Yourself" 鈕**(開 in-browser editor);有 League 機制「Earn XP and climb the ranks」;有 pathfinder.w3schools.com 個人化路徑。
- **Vortex 可借**:**「每段內容旁邊可操作」是普世原理**——Vortex 的 drill 卡片可加「試這個」的微互動(例如「試用 30 秒節奏器,感覺 4 次划手節奏」);**等第/level up** 見 7.2;**個人化路徑**(依使用者自選的目的/等級產生路徑)直接對應 §1.1 的雙軸入口。

### 7.5 Muscle & Motion — 3D 解剖 + 動作(運動教學的視覺優先代表)

- **規模**:自稱被 300+ 大學採用;站名自稱 "3D Muscles Anatomy and Kinesiology"。
- **設計邏輯**(從首頁可見推斷):**解剖 × 動作**的雙維結構 — 一個動作頁同時呈現「目標肌群 + 關節活動 + 常見錯誤」,**3D 模型可旋轉縮放**。
- **Vortex 可借**:**動作教學的核心三件** — 「目標肌群(用得到哪些)+ 關節活動(怎麼動)+ 常見錯誤(誤區)」 — **完全對應 Vortex 現有的 canonical 結構**(drill + 物理現實 + 誤區)。差異只在「3D 動畫」——Vortex 沒有 3D 角色,但**可以用 SVG / Lottie / 影片標註**達到「視覺先於文字」(§3.4 原理)。
- **限制**:**Muscle & Motion 商業授權**,3D 動畫成本高;**Vortex 應先試「靜態 SVG 分解圖 + 影片標註」**,確認有效再升級。
- **來源**:https://www.muscleandmotion.com/ (首頁導覽結構)

### 7.6 動作教學的共通設計原理(從 §7.1–7.5 萃取)

1. **動作 = 「視覺片段 + 文字說明 + 可操控工具」三件式**(Brilliant + musictheory + Muscle&Motion 三家共通)。
2. **進度 = 「節點 + 等級 + 弱點」三軸呈現**(Brilliant 強弱雷達、Yousician 分數、W3Schools XP 共通)。
3. **「Try it Yourself」是普世 CTA**——不只是按鈕文字,是「每段內容旁邊都能做一個小動作」的版面原則。
4. **蘇格拉底 > 灌輸**:Brilliant 與 W3Schools 都設計成「先讓你做錯、問你為什麼錯、再給提示」,而不是直接給正解。**對應 Vortex 禁區:不可用「自陳/症狀 ∴ 某感知/技術不好」推論,正是要靠「讓使用者自己試出來」取代系統替他下判斷。**

---

## 8. 重要可行性分析:Hugo 靜態站能重現哪些、要花什麼代價

> **這是 Vortex 重做的技術紅線**。委託人的硬規則之一是「不能離開 Hugo 靜態站」嗎?目前未明說,但全站架構都已在 Hugo + 既有 CSS 上。本節回答:**哪些範式不需離開、哪些需要評估代價、哪些要明確標出**。

### 8.1 Hugo + 原生 JS + JSON/YAML 資料檔:可重現的範式(零代價)

**已驗證可行** —— Hugo 官網文件顯示:

- Hugo template 可直接 inline 寫 SVG(`<svg>...</svg>` + `range` 跑資料)。
- 無內建 SVG shortcode,但可 5 行自寫(`layouts/_shortcodes/nodesvg.html`)。
- 資料來源用 `data/*.json` 或 `data/*.yaml`,template 用 `jsonify` 序列化餵給 JS。
- 原生 JS 透過 `document.createElementNS('http://www.w3.org/2000/svg', ...)` 建節點、線、文字,**數十節點效能完全足夠**。

**可重現的範式(零額外依賴)**:
- ✅ roadmap.sh 風格可點 SVG 節點圖(靜態座標版)
- ✅ Brilliant 風格「可操控示意」(滑桿 / 按鈕 / 切換狀態,純 HTML + JS)
- ✅ 技能節點 + 等第 + 弱點自評(用 localStorage 存進度,純前端)
- ✅ 雙軸入口(role-based vs skill-based)— Hugo 多 page + 一個 home 入口 selector
- ✅ W3Schools 風格「每段旁邊可操作」 — 同一 layout 內嵌微互動

### 8.2 數十到數百節點:加 D3.js 即可(輕度成本)

- 預估節點數:水感 L0–L6 × 四式 + 起跳轉身 + 心理層 ≈ **30–80 節點**,搭配 drill 卡片可能 100–200。
- **D3.js 是最務實升級**:113k stars、生態成熟、ISC license、CDN 可用、不需 React。
- 額外成本:**+D3.js 70KB(CDN gzip)**,互動邏輯 100–300 行 JS。
- 替代:xyflow/reactflow(需 React,需重新評估 Hugo + React island 整合)。

### 8.3 數千節點:不適用 Vortex(明確標出)

- Vortex 規模**到不了**數千節點(內容是封閉的游泳水感知識,不是開放 web)。
- 若未來誤踩:**Cytoscape.js + Canvas** 是務實升級(§6.5)。
- **目前不需要此層**。

### 8.4 3D 動作 / WebGL:不適用 Vortex(明確標出)

- 3D 解剖(WebGL/Three.js 路線)成本極高:資產、模型、優化,**與 Vortex 規模不匹配**。
- Vortex 動作呈現的務實解:**SVG 靜態分解圖 + 影片標註 + 互動示意(§7.3)**,**不**做 3D。
- 來源:three.js https://threejs.org/(確認存在但**未採用**)

### 8.5 Hugo「離開」邊界:什麼情境需要重新評估

| 情境 | Hugo 內可做? | 動作 |
|------|------------|------|
| 靜態 SVG 節點圖 | ✅ | 直接做 |
| 互動示意(滑桿、按鈕) | ✅ | 原生 JS + Hugo partial |
| 技能節點 + localStorage 進度 | ✅ | 原生 JS |
| 動態 force-directed graph | ✅ | 加 D3.js |
| 即時協作 / 多人狀態 | ❌ | 需後端,**Vortex 不需要** |
| AI 助教(floating chat) | ⚠️ | Hugo 靜態裝 chat widget 可,但需外部 API;Vortex 不做 |
| 3D 動作模型 | ❌ | 改用影片 + SVG 分解 |
| 使用者登入 / 個人化帳號 | ❌ | 需後端;**Vortex 不需要** |

### 8.6 結論

**Hugo 靜態站 + 原生 JS + 必要時加 D3.js**,可重現**所有 §1–§7 萃取出的設計原理**,**完全不需要離開 Hugo**。瓶頸不在技術,在**設計決策的取捨**(要哪幾個原理、要放棄哪些次要特性)。

---

## 9. 跨組設計原理(從 §5–§8 萃取,補完 §3)

> 與 §3 不重複,本節專注**新挖出來的**原理。

1. **節點座標預先定義,非動態 force-directed**(roadmap.sh 實證)——發展有順序的知識用預設座標;純網狀知識才用 force。**Vortex 是前者**。
2. **「修節點開 issue」、「每節點上限 N 個資源」是內容層次原則**(roadmap.sh contributing)——Vortex 抄後者(每 drill 上限 3–4 個關鍵字、每概念上限 5–8 條 bullet)。
3. **「手繪風降低修改門檻」是普世原理**(excalidraw)——視覺太精緻反而阻礙教練群貢獻。
4. **「空間承載順序」三種層次:無限定位(tldraw)→ 結構路徑(roadmap.sh)→ 完全自動(force-directed)**——Vortex 取中間,視覺路徑 + 局部可調整。
5. **動作教學的「視覺片段 + 文字 + 可操控工具」三件式**對應 Vortex:每個泳姿概念頁 = 1 段影片標註 + 既有文字 + 1 個微互動(節奏器、視角切換)。
6. **「Try it Yourself」是版面原則,不只是按鈕**——Vortex 應在每段內容旁都有可做的微動作。
7. **蘇格拉底 > 灌輸**(Brilliant / W3Schools)——直接對應 Vortex 禁區:讓使用者**自評**目前 L、提供「試這個 drill」,**不替他下判斷**。
8. **「封閉內容 / 開源協作」的設計取捨不同**(roadmap.sh 是後者,Vortex 是前者)——Vortex 應**更敢**在「內容層次」上做編輯決策,不必遷就「可協作」。

---

## 引用(本輪新增)

- roadmap.sh repo — https://github.com/kamranahmedse/developer-roadmap (358k stars;§5)
- roadmap.sh contributing — https://github.com/kamranahmedse/developer-roadmap/blob/main/contributing.md
- roadmap.sh issues — https://github.com/kamranahmedse/developer-roadmap/issues
- build-your-own-x — https://github.com/codecrafters-io/build-your-own-x (517k stars;§6.1)
- excalidraw — https://github.com/excalidraw/excalidraw (126k stars;§6.2)
- tldraw — https://github.com/tldraw/tldraw (47.9k stars;§6.3)
- xyflow / React Flow — https://github.com/xyflow/xyflow (37.1k stars;§6.4)
- cytoscape.js — https://github.com/cytoscape/cytoscape.js (11.1k stars;§6.5)
- D3.js — https://github.com/d3/d3 / https://d3js.org/(113k stars;§6.6, §8.2)
- JavaScript30 — https://github.com/wesbos/JavaScript30 (29.2k stars;§6.7)
- Brilliant.org — https://brilliant.org/(§7.1)
- Yousician — https://yousician.com/(§7.2)
- musictheory.net — https://www.musictheory.net/(§7.3)
- W3Schools pathfinder — https://www.w3schools.com/ (§7.4)
- Muscle & Motion — https://www.muscleandmotion.com/(§7.5)
- three.js — https://threejs.org/(§8.4,**確認存在但未採用**)
- Hugo 模板 / data file / shortcode 官方文件 — https://gohugo.io/templates/introduction/ (§8.1)
- d3-force — https://d3js.org/d3-force(§6.8)

> **未能查證清單**:
> - roadmap.sh 「GitHub 第 6 高星」說法(原 §1.1 引述)— 已確認 358k stars 是事實,但「第 6 高星」的**排名榜**未在本輪查到具體排名表。
> - draw.roadmap.sh / `@roadmapsh/editor` 的**確切開源狀態** — 公開 repo 列表為 0,可能私有,實作細節**未直視原始碼**。
> - renderer.ts 內部具體邏輯(SVG vs foreignObject vs 第三方 library)— **未直視原始碼**,從目錄結構與元件名推論為「自繪 SVG,座標預先定義」。
> - Duolingo skill tree 的學術依據 — 官方 design post 與論文未在本輪查到,引述自通用知識,標 [未查證]。

---

## 11. 下一步(更新後的待挖)

- [ ] 綜合 §3 + §9 設計原理,**草擬 Vortex 原創呈現概念**(空間化的發展地圖 + 三件式動作教學 + 雙軸入口 + 蘇格拉底自評)。**不准複製任一範式**。
- [ ] 對齊 DESIGN_SYSTEM.md,用「創作方向維度」六軸現生一個跟現在徹底不同的方向(2026-07-31：風格清單已刪，不再是「挑」而是「生」)，再用鐵則 A–I 過閘。
- [ ] 做出**可看的原型**(HTML + CSS + JS),不是報告。
- [ ] 與委託人確認原型方向,再進入實作。
- [ ] 持續待挖(此輪未處理):① 游泳教學專門網站(effortlessswimming / MySwimPro / SwimSmooth)細節研究(前次查詢失敗);② 攀岩/武術/鋼琴的「技能樹」具體案例;③ Nicky Case 與 Bret Victor 原始文章深度讀(本輪僅用「設計模式清單」層次)。
