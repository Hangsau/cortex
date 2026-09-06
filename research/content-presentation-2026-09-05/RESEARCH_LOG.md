# 研究紀錄、來源與未完成項

## 1. Run manifest

```yaml
run_id: content-presentation-2026-09-05
date: 2026-09-05
timezone: Asia/Taipei
phase: website_form_and_growth_desk_research
project: my-site
base_sha: d72a82a4d0650bafd4295a6e16e3a66b6a64575d
baseline_worktree: clean
requested_artifact: 全內容呈現研究計畫，含 Claude/Codex 模型派工，保存在 my-site
method_profile: mixed_cross_domain
evidence_types:
  - repository_structure_observation
  - sampled_template_and_content_observation
  - official_documentation
  - project_design_hypothesis
artifact_status: complete
full_research_status: in_progress
human_usability_testing: not_run
multi_agent_execution: not_run
site_implementation: not_started
audience_assumption: 可公開閱讀的個人工作知識庫；用途比例未定
confirmed_user_feedback: 入口不直覺；需求不只少數任務；需深入研究網站形態，未來大部分成長以既有計畫為情境
revision: 3
```

方法：以軟體／內容結構觀察為主，保留不同內容的原生 profile；沒有在本次重新評估訓練、心理、神經或測驗的科學效力。來源全文、作者解釋、本站模型與本研究建議分開。

## 2. 本次實際做了什麼

| 步驟 | 證據與結果 | 完成深度 |
|---|---|---|
| 專案定位 | 全域 registry → `projects/my-site`；讀 C/H/M；未找到適用的 AGENTS.md | 規範與現況入口已讀；長 HANDOFF 只讀近期段落與相關索引，不宣稱 20 萬字全文已讀 |
| 既有研究查重 | entry-wayfinding、presentation-layout、vortex-rebuild、site-health、首頁 checklist | 讀摘要／相關段落／標題索引，辨識歷史假設；沒有把舊來源全部重新查證 |
| 全量來源盤點 | `content/**/*.md` 81、`data/**/*.yaml` 68 | 100% 檔案 metadata／YAML 結構，保存路徑、雜湊、集合數量 |
| 內容樣本 | CSCS ch01、MNFL techniques、movement actions、心理主題、氣質題庫等 | 代表條目與結構示例，非 PLAN 所規劃的 144／96 等完整抽樣 |
| 呈現鏈 | home、sidebar、database、joints、movement、stroke、MNFL、UST、temperament、既有 audit／sync | 來源程式的相關區段與搜尋比對；沒有實際瀏覽器互動驗證 |
| 發布環境 | deploy.yml Hugo 0.159.1／Linux；本機 hugo 0.162.1／Windows | 版本與設定已查；本次沒 build、sync、push 或部署 |
| 線上可達性 | PowerShell 取得 `https://hangsau.github.io/cortex/`，HTTP 200、Content.Length 9,920 | 只確認首頁可擷取；沒有以此代表 81 頁已測、內容已完整呈現或視覺已審 |
| 模型核對 | 本機可見模型清單＋已開啟的 OpenAI／Anthropic 官方頁 | 角色與名稱可追溯；Claude 帳號／管道、模型評估待 W0 |
| 研究方法 | 開啟 NN/g、Diátaxis、GOV.UK、W3C | 選入與本案問題直接相關的指引；沒有進行系統性文獻回顧 |
| 文件交付 | PLAN、BASELINE、MODEL_WORK_PACKAGES、RESEARCH_LOG、inventory.py/json | 已保存；正式站點未改 |

`inventory.json` 中的 `presentation_inputs` 也記錄 layout／static／workflow／config／sync 的工作檔雜湊。雜湊是本機 CRLF bytes，跨 Linux checkout 不同時，應先區分換行與語意差異。

## 3. 查詢與採用紀錄

### 修訂3：網站形態與既有計畫的成長研究（已執行）

新增 [WEBSITE_STUDY](WEBSITE_STUDY.md)、[GROWTH_MAP](GROWTH_MAP.md)、[growth_inventory.py](growth_inventory.py) 及 [growth-inventory.json](growth-inventory.json)。主案收斂為可讀的主題知識館，搜尋工作台為對照；此為案頭推論，未量測選單、視覺或真人成功率。PLAN、BASELINE、派工與C/H/M同步更新，新增W1g。

| 已執行 | 範圍／證據 | 限制 |
|---|---|---|
| 既有計畫追查 | my-site與九個相關專案；44份C/H/M／計畫／契約文件指紋，另記技術與內容樣本 | 讀規範、近期及相關段落；長HANDOFF沒有全讀，指紋不等於閱讀完成 |
| 成長狀態裁決 | 恢復、生成器、神經／心理、古籍／宗教、Hub、動力鏈撤回、K12／app邊界 | 狀態來自文件和實檔；未取得的新接入決定不補造 |
| 古籍結構盤點 | 76份meta、50份標註JSON、22,545筆標註形狀與狀態 | 原文只量檔案大小；沒有通讀76部或重判標註 |
| 宗教結構盤點 | 4,684目錄／4,683份meta，缺meta目錄heart-sutra；4,683原文檔大小，譯檔存在與status分別計數 | 不是可發布總量；working tree依序讀取，上游仍可能更新；缺欄不能推斷翻譯未完成 |
| 跨章內容用途 | CSCS24章各首末條目，共48筆，查看題目與答案前段；MNFL／UST名稱及氣質框架／批判標題，Vortex代表動作與drill | CSCS是邊界樣本，不達原定144分層深讀；小集合不是已全讀正文；取到但截斷的輸出不計全文 |
| 未來閱讀型別 | 四份心理reader spec七節標題／ID；多巴胺敘述層狀態與樣本指紋；古籍孫子meta／首段標註、法句經meta及檔案結構 | profile存在不代表思想比較已完成；譯檔存在不代表完整性通過 |
| 網站形態比較 | 部落格、課程、百科、圖書館、檢索、圖譜、任務導引與組合主案 | 案頭優缺點，無加權測試分數；具體頁面路線為設計推演 |
| 外部前例 | SEP條目＋目錄、MDN學習＋參考頁、OWID主題頁；Bilara官方資料／發布說明 | 前三者檢視可擷取頁面結構，非截圖或瀏覽器操作；Bilara只支持資料架構 |
| 搜尋與同步核對 | Pagefind官方中文分詞／語言索引／子結果；Vortex實際notify-mysite workflow | 未安裝搜尋或測效能；只讀workflow，未驗當日CI run或token權限 |
| 成長推演 | G1–G9有具體來源、失效方式與可執行驗收設計 | fixture、性能、原型及使用者測試均未跑 |

查詢：`site.plato.stanford.edu about encyclopedia table contents related entries dynamic reference work`、`site.developer.mozilla.org en-US docs Learn web development curriculum reference guides`、`site.suttacentral.net instructions parallels translation segmented texts`，之後直接開官方頁及資料repo。搜尋的Wikipedia、Reddit、鏡像及無關結果未採用。CTEXT兩頁擷取失敗；SuttaCentral instructions失敗，edition頁只回unsupported browser／需JS；OWID sleep與mental-health explorer未成功，改讀實際取得的mental-health主題頁。不把失敗網址或搜尋摘要當讀過全文。

新增來源（開啟日期均2026-09-05）：

| ID | 原始頁／定位 | 使用方式與限制 |
|---|---|---|
| S11 | [SEP Plato](https://plato.stanford.edu/entries/plato/)，導讀／Contents／Bibliography／Related Entries／修訂日期 | 連貫文章、定位及引用機制；不借用哲學主張 |
| S12 | [SEP總目錄](https://plato.stanford.edu/contents.html) | 完整條目瀏覽的實例；未做找路測試 |
| S13 | [MDN Learn](https://developer.mozilla.org/en-US/docs/Learn_web_development) | 學習路線與練習的組織 |
| S14 | [MDN Array.map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map) | 參考頁與說明／例子；不比較本站學習效果 |
| S15 | [OWID Mental Health](https://ourworldindata.org/mental-health)，Introduction／Research & Writing／Charts | 同主題不同材料的集合；本案未重驗其醫療或統計主張 |
| S16 | [SuttaCentral bilara-data](https://github.com/suttacentral/bilara-data)，How it works／Publication | segment身分、原譯註分離與發布狀態；非前台UI觀察 |
| S17 | [Pagefind入門](https://pagefind.app/docs/)，Indexing your site | Hugo產物後建靜態索引的候選可行性；未實作 |
| S18 | [Pagefind多語言](https://pagefind.app/docs/multilingual/)，語言分索引／Specialized languages | 中文extended分詞與跨語言限制；不宣稱自動語意跨語搜尋 |
| S19 | [Pagefind頁內子結果](https://pagefind.app/docs/sub-results/)，headings／HTML id | 查章節可先保留長文；不宣稱所有現有任意錨點自動有正確子結果 |

上游新發現：`TheVortexProject/.github/workflows/notify-mysite.yml`會在指定master路徑push或手動時，checkout Cortex hugo-source、執行sync、提交data/content並push。本站`sync-from-vortex.yml`仍有dispatch／manual路徑，不能只研究本站兩支workflow就宣稱已掌握主要同步。此處按程式描述候選執行路徑，不把註解中的GitHub規則當本次已獨立驗證的外部事實。

修訂3補記的探索錯誤：先猜`my-site/plans/menu_generator_plan.md`不存在，沿HANDOFF定位到swim-coach；古籍也依SCHEMA確認根在`translations/`；movement資料在`data/movement/`，不是`data/vortex/movement/`。研究樣本／計數使用最後確認路徑，未修上游資料湊假設。

### 修訂 2：依使用者回饋重設研究前提

初稿以「少改動」為由先保留現有架構，卻沒有需求或可用性證據；此推論已撤回。使用者明確指出入口不直覺、需求不只那幾個。本次將首頁、全域分類與入口名稱重開研究，新增 W1b 的需求／用語／開放分組與入口理解，原十二題降為回歸種子，改比較三種組織假設。全文同步更新 BASELINE、派工依賴、時間估計與 C/H/M，避免舊規範再次鎖定答案。

修訂只改研究與行為文件，保留原 inventory 作內容基線；沒有執行新使用者測試。新增方法查詢 `site.nngroup.com card sorting mental models tree testing navigation labels`，實際開啟 S09／S10；card sorting 原 URL 首次 timeout，改開搜尋結果頁成功。未把搜尋摘要冒充全文。

日期皆為 2026-09-05。搜尋回傳結果數會變動，且工具沒有提供完整搜尋母體，本紀錄只記實際開啟／採用來源，不虛構總命中數。

| 查詢／發現路徑 | 開啟與採用 | 排除／限制 |
|---|---|---|
| 本機 `models_cache.json`；`Codex models model selection`，限定 OpenAI 官方域 | S01、S02 | 快取 visibility=hide 模型不派工；API 所有型號不等於 Codex session 可用型號 |
| `Claude models overview Opus Sonnet Haiku`，限定 Claude 官方域 | S03 | 搜尋有不同時間的舊版片段，採目前打開頁面；帳號權限未驗 |
| `site.nngroup.com articles content inventory audit` | S04 | Reddit、二手重述未採；借用 inventory／audit 方法，不借用本站不存在的流量資料 |
| `site.diataxis.fr explanation reference tutorials how to guides` | S05、S06 | 不把文件四分法當本站四領域 taxonomy，不建空殼分類 |
| `site.gov.uk service manual user research moderated usability testing` | S07 | 沒有開始招募／對外傳訊；真人資料未收集 |
| 既有 DESIGN_SYSTEM 的 WCAG 線索 → W3C quickref | S08 | 尚未完整 AA 稽核；地方設計數值與規範條文分開 |
| C/H/M → 既有研究與實際模板 | L01–L05 | 舊版數字與完成狀態先對 git／資料，不直接當 current fact |

### 已開啟的外部來源

| ID | 來源與定位 | 本研究採用 | 證據邊界 |
|---|---|---|---|
| S01 | [OpenAI：Codex／ChatGPT Models](https://learn.chatgpt.com/docs/models)，Recommended models | Astra／Sol／Terra／Luna 的官方用途定位及 Codex 模型名稱 | 非本案實測勝率；由原 developers Codex URL 轉址 |
| S02 | [OpenAI API Models](https://developers.openai.com/api/docs/models)，Choosing a model／Flagship models | 核對 GPT-6 Astra、5.6 型號存在與分級 | API 價格沒有拿來估算訂閱配額 |
| S03 | [Anthropic：Models overview](https://platform.claude.com/docs/en/models/overview)，Compare models | Fable 5.1／Opus 5／Sonnet 5／Haiku 4.5 及 API ID | 官方可用性敘述不等於使用者帳號可用性 |
| S04 | [NN/g：Content Inventory and Auditing 101](https://www.nngroup.com/articles/content-audits/)，Anna Kaley，2020-09-27，Definitions／Scope／Maintaining | 內容清冊與品質審查分工，逐單位記 owner／用途／處置 | 方法性專業指引，不是本站因果效果實驗 |
| S05 | [Diátaxis：Start here](https://www.diataxis.fr/start-here/)，The four kinds／compass | 依學習／工作與行動／理解區分內容用途 | 五種本站版型是本研究轉用，不是官方直接推薦 |
| S06 | [Diátaxis：How to use](https://www.diataxis.fr/how-to-use-diataxis/)，Don't worry about structure | 從具體問題逐步改，不先建空的分類架構 | 不據此直接發布未核准的變動 |
| S07 | [GOV.UK：Using moderated usability testing](https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing)，Design tasks／Run a session | 觀察真實／潛在使用者完成具體、不暗示答案的任務 | 本案樣本數與成功門檻是研究設計，非該文通用標準 |
| S08 | [W3C：How to Meet WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/) | 後續對比、鍵盤、焦點、重排與目標尺寸等適用準則 | 自動測試不能單獨證明完整符合；需逐準則核對 |
| S09 | [NN/g：Card Sorting](https://www.nngroup.com/articles/card-sorting-definition/)，Definition／Prepare Materials／Limitations | 用代表內容作開放分組與命名，探索讀者的組織方式 | 分組產生假設，不能直接當最佳選單；無真人資料不能稱做過 card sort |
| S10 | [NN/g：Tree Testing](https://www.nngroup.com/articles/tree-testing/)，Tasks／Different Purposes／Limitations | 分別驗證類別名稱、位置與找路；題目避免暗示答案 | 文字樹不驗完整頁面視覺；小型質性結果不宣稱族群統計 |

### 本機證據入口

| ID | 檔案 | 本研究使用 |
|---|---|---|
| L01 | [首頁資料](../../data/home.yaml)、[首頁模板](../../layouts/index.html) | 現有任務＋領域、207 技術數、36 題題庫文案 |
| L02 | [Vortex 側欄](../../layouts/partials/vortex/sidebar.html)、[資料查詢](../../layouts/vortex/vortex-database.html) | 搜尋標籤、固定收集集合、分站／全站範圍 |
| L03 | [movement 模板](../../layouts/vortex/vortex-movement.html)、[joints 模板](../../layouts/vortex/vortex-joints.html)、[來源表](../../data/vortex/source-registry.yaml) | 公開狀態、來源讀取與未查證標記；registry schema v2 |
| L04 | [MNFL 工具箱](../../layouts/library/mnfl-toolkit.html)、[氣質模板](../../layouts/temperament/temperament-main.html)、[題庫](../../data/temperament/quiz.yaml) | 技法單位錨點候選缺口、legacy 面板、兩種18題模式 |
| L05 | [sync](../../tools/sync_vortex.py)、[deploy workflow](../../.github/workflows/deploy.yml)、[sync workflow](../../.github/workflows/sync-from-vortex.yml) | 真相來源邊界、白名單、路徑和觸發條件 |

## 4. 失敗與修正紀錄

1. 初版 front matter 掃描直接 `split('---')`，碰到描述文字內的 `---` 失敗。改為只認整行分隔符，81 檔全部解析；未改內容。此經驗寫入 `inventory.py`。
2. 初次探索把 cards 暫查在 topic 層而得到 0，已讀 schema 確認在 chapter 根層，重算為 1,252。來源表也是根層 metadata＋`sources` 子 map，最終採 582；探索錯值未列為有效結果。
3. Python stdout 曾受 Windows 編碼影響顯示亂碼，改 `python -X utf8` 並將 JSON 明確存成 UTF-8；檔案本身能以 UTF-8 正常讀取，不據 console 亂碼判定來源損毀。
4. Web open 無法開 Cortex 公開網址；PowerShell 沙箱第一次回通訊端權限不足，按工具規範升權重試後 HTTP 200。沒有繞過封鎖，也沒有因一次首頁成功宣稱全站驗證。
5. 尚未遇到真正需要修改站點才可繼續的阻擋；可在本次授權內交付研究計畫。

## 5. 已知盲點與下一 checkpoint

初稿交付檢查已通過：六份研究產物存在；研究 Markdown 的相對連結皆可解析；212 個已記錄的內容、資料、呈現與建置輸入雜湊保持不變；清冊 81／68、CSCS 1,557／1,252、movement 128 的計數一致；`git diff --check` 通過。Git 變更限於本研究目錄與 HANDOFF／MAP 的入口，沒有執行 UI 測試，因本次沒有修改網站輸入。

尚未取得流量／站內搜尋紀錄，沒有熱門內容排名；優先序來自內容、既有計畫與使用者回饋。尚無真人訪談／分組、手機視覺巡檢、無障礙完整審查、新版搜尋／探索測試或模型對比結果。修訂3已做外部前例的頁面結構／官方資料比較；截圖與操作證據仍待W6。

下一checkpoint：W0核管道、W1補unit／route、W1b補自然用語、W1g補成長契約；已有架構主張見WEBSITE_STUDY，不重做泛用計畫。原型優先用現有完整路線及G1／G2，條件候選只用小型fixture。開始前比較輸入SHA／雜湊；來源變更時保留歷史基線並記新run，不把新數字冒充舊觀察。

修訂3交付檢查：兩次成長腳本重生所得上述計數一致；44份文件及另列樣本指紋可回取；48個CSCS樣本和四份七節profile對帳；72個研究Markdown相對檔案連結可解析；14個W ID唯一；兩支Python腳本語法可解析；212個原站點輸入雜湊未變。`git diff --check`通過。網站UI與性能沒有變更，本輪未跑相應測試。
