# CSCS 讀書器＋出題器：桌面看板分頁 v1 規格

本檔是跨模型交接用的完整實作規格，**自足**：不要回頭讀對話紀錄，所有數值、欄位名、
檔案路徑都寫在這裡。

## 0. 這是什麼、為什麼要做

站主正在考 NSCA CSCS。`data/cscs/` 已有 24 章、1557 條知識單位（每條都有穩定 `id`、
`detail` 深度層、書中出處 `locator`）、6 個實務題型 / 9 條判讀分支。
現有 `tools/cscs_quiz.py` 能照官方考試權重出 190 題模擬考，但**只出得了記憶題**，
而官方 DCO 全卷只有 23% 是記憶題。

現況的三個缺口，就是這個 app 要補的：

1. **讀跟考是斷開的**——網站上讀完沒有任何地方記得「我讀過、我沒把握」。
2. **出題器不看我的歷史**——每次都重新亂抽，不知道我哪裡一直錯。
3. **沒有任何提醒**——複習全靠自律，而間隔重複的價值正在於不靠自律。

所以 v1 的核心不是 UI，是**一個 SQLite 學習狀態層**，讀書器與出題器都只是它的兩個
前端；錯題聚合與到期提醒都由它算出來。

## 1. 硬限制（違反即為實作失敗）

- **不得新增任何第三方依賴**。可用：Python 3.12 標準庫（含 `sqlite3`、`tkinter`）
  與**已安裝的 `PyYAML`**。不得引入 pandas / rich / customtkinter / FSRS 套件等。
- **UI 只能用 Tkinter**（桌面看板全站規範，`C:\claudehome\tools\deskboard\CLAUDE.md`）。
- **不得修改** `data/cscs/` 底下任何既有檔案（`ch*.yaml` / `_terms.yaml` /
  `_concepts.yaml` / `_domains.yaml` / `_applied.yaml`）、`tools/cscs_check.py`、
  `layouts/`、`content/`、`static/`、`hugo.toml`。本任務只新增檔案，外加一個
  `.gitignore` 追加。
- **不得執行任何 git 破壞性指令**：`git reset` / `git pull --rebase` / `git stash` /
  `git checkout --` / `git clean` / `git rebase` / force push 一律禁止。允許
  `git status` / `git diff` / `git add <具體檔案>` / `git commit`。**不要 push。**
- 所有 `subprocess` 用參數陣列、`shell=False`。
- 檔案讀寫一律明寫 `encoding="utf-8"`（Windows 預設 cp950，中文會無聲失敗）。
- CLI 進入點開頭加 `sys.stdout.reconfigure(encoding="utf-8", errors="replace")`。

## 2. 檔案清單

| 路徑 | 性質 | 說明 |
|---|---|---|
| `tools/cscs_study.py` | 新增 | **純邏輯層，禁止 import tkinter**。DB、排程、錯題聚合、出題、CLI |
| `tools/cscs_study_gui.py` | 新增 | Tkinter 層，對外只暴露 `build_tab(parent)` 與 `main()` |
| `tools/tests/__init__.py` | 新增 | 空檔 |
| `tools/tests/test_cscs_study.py` | 新增 | unittest，只測純邏輯層 |
| `.gitignore` | 追加兩行 | `/.study/` 與 `/.study/**` |

**為什麼邏輯層禁止 import tkinter**：這樣它才能在無視窗環境被 unittest 完整覆蓋。
GUI 層可以薄到只做事件綁定，所有判斷都在有測試保護的那一側。這是本規格最重要的
結構約束，不要為了省事把 SQL 寫進 GUI callback。

## 3. 資料落點

- DB：`<repo>/.study/cscs_study.db`（gitignored）
- 設定：`<repo>/.study/config.json`（gitignored），`{"exam_date": null, "daily_new": 20, "daily_review_cap": 120}`
- 錯題軸匯出：`<repo>/data/cscs/_mistakes.yaml`（**要進 git**）

DB 放 gitignore 是因為它是每次操作都變動的事件流，進 repo 會變成每天數十次的雜訊
commit。但**聚合後的錯題軸要進 git**——那是 HANDOFF 已排定的下一步 ①「錯題軸」，
屬於 canonical 內容，不是暫存狀態。

## 4. SQLite schema（逐字照建，欄位名不要自己改）

```sql
CREATE TABLE IF NOT EXISTS item_state (
    item_id     TEXT PRIMARY KEY,
    chapter     TEXT NOT NULL,
    box         INTEGER NOT NULL DEFAULT 0,
    due_date    TEXT,
    last_seen   TEXT,
    n_seen      INTEGER NOT NULL DEFAULT 0,
    n_wrong     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS event (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ts          TEXT NOT NULL,
    mode        TEXT NOT NULL,
    item_id     TEXT,
    template_id TEXT,
    branch_id   TEXT,
    kind        TEXT,
    chapter     TEXT,
    domain      TEXT,
    result      TEXT NOT NULL,
    chosen      TEXT,
    correct     TEXT,
    ms          INTEGER
);

CREATE INDEX IF NOT EXISTS idx_event_ts ON event(ts);
CREATE INDEX IF NOT EXISTS idx_event_item ON event(item_id);
CREATE INDEX IF NOT EXISTS idx_state_due ON item_state(due_date);
```

- `mode` ∈ `read` / `quiz`
- `kind` ∈ `read` / `fact` / `number` / `term` / `branch`
- `result` ∈ `right` / `wrong` / `unsure` / `known`
  （`known` / `unsure` 只出現在 `read` 模式，`right` / `wrong` 只出現在 `quiz`）
- `ts` / `due_date` / `last_seen` 一律 ISO 字串（`ts` 到秒，日期欄只到日）
- `template_id` / `branch_id` 只有判讀題（`kind='branch'`）才填

## 5. 排程演算法（Leitner，6 格）

```python
INTERVALS = [0, 1, 3, 7, 16, 35]   # 天；box 索引直接對應
```

事件進來後更新 `item_state`：

| result | box 變化 |
|---|---|
| `right` / `known` | `min(box + 1, 5)` |
| `unsure` | `max(box - 1, 0)` |
| `wrong` | 直接歸零 `0` |

`due_date = 今天 + INTERVALS[新 box]` 天。`box=0` 表示當天稍後要再出現。
`n_seen += 1`；`result == 'wrong'` 時 `n_wrong += 1`。

**答錯歸零而不是退一格**：CSCS 的事實錯了通常是整組概念混淆（例如 %1RM 關係表
與目標處方表混用），退一格會讓它三天後又出現、又錯；歸零才逼它當天重來。

沒有任何紀錄的 item 視為 `box=0, due_date=今天`（不需要預先寫滿 1557 列，
查詢時 LEFT JOIN 補預設即可）。

## 6. `tools/cscs_study.py` 對外函式

載入資料時**重用既有模組，不要重寫**：

```python
sys.path.insert(0, str(Path(__file__).resolve().parent))
import cscs_quiz          # 既有出題器
```

`cscs_quiz` 已有這些經過實測調校的函式，**必須直接呼叫，不得複製或改寫**：
`load` / `collect` / `pick_distractors` / `too_close` / `q_fact` / `q_number` /
`q_term` / `allocate` / `magnitude` / `in_scale` / `perturb`。
它們的干擾項規則（同章不同主題、同單位且五倍內量級）是踩過廢題才調出來的，
自己重寫一份會把那些教訓丟掉。

必須提供的函式：

```python
def connect(db_path=None) -> sqlite3.Connection
    # 開 DB、建 schema（IF NOT EXISTS）、回傳連線。db_path=None 走預設落點。

def record(conn, *, mode, result, item_id=None, template_id=None, branch_id=None,
           kind=None, chapter=None, domain=None, chosen=None, correct=None, ms=None)
    # 寫一筆 event + 更新 item_state（§5）。回傳更新後的 (box, due_date)。

def due_items(conn, chapters=None, limit=None) -> list[str]
    # 回傳今天到期（due_date <= 今天，或無紀錄）的 item_id，
    # 排序：先 n_wrong 多的，再 due_date 早的，再 item_id。

def status(conn) -> dict
    # 給提醒橫幅與 CLI 用。至少含：
    # due_today, new_never_seen, seen_total, streak_days,
    # last_study_date, days_to_exam（無 exam_date 時為 None）,
    # week_quiz_count, week_accuracy

def weak_axes(conn, top=10) -> dict
    # 錯題軸聚合。四個維度各自回 [{key, n_wrong, n_seen, wrong_rate}, ...]：
    #   by_domain / by_chapter / by_concept / by_template
    # by_concept 需從 chNN.yaml 的 item.concepts 反查（一個 item 可掛多個概念，
    # 每個都各記一次）。只納入 n_seen >= 3 的 key，否則一次錯就 100% 會排到最前面。

def make_quiz(conn, n=20, scope='weighted', chapter=None, domain=None, seed=None) -> list[dict]
    # scope ∈ 'weighted'(官方權重) / 'weak'(弱點加權) / 'due'(只出到期條目) /
    #         'chapter' / 'domain' / 'applied'(只出判讀題)
    # 題目 dict 結構與 cscs_quiz 產出的相同，額外保證含：
    #   kind, stem, options(4), answer(index), item_id, locator, chapter, domain
    # 判讀題另含 template_id / branch_id。

def make_branch_question(applied, rng) -> dict | None
    # 見 §7

def export_mistakes(conn, path=None) -> dict
    # 把 weak_axes 寫成 data/cscs/_mistakes.yaml（§8），回傳寫出去的 dict。
```

### 弱點加權（`scope='weak'`）怎麼算

兩層：

1. **domain 配額**：取 `cscs_quiz.allocate` 的官方權重配額，與「各 domain 錯誤率
   正規化後的配額」**各半混合**再取整。純照錯誤率配會讓已經很熟的 domain 完全
   不出現，考試不會這樣考；純照官方權重又等於沒有弱點加權。
2. **domain 內選條目**：每條 item 的抽樣權重 = `1 + 2 * n_wrong`，且
   `box <= 2` 的再 ×1.5。

`n_seen == 0` 的條目權重固定 1（沒資料不代表會，也不代表不會）。

## 7. 判讀題（`kind='branch'`）

來源是 `data/cscs/_applied.yaml` 的 `templates[].branches[]`，目前全庫共 **9 條**。
這是唯一能出「應用／分析」層的素材，雖然量少但必須接進來——官方全卷 77% 是這一層。

出題方式：

- 題幹 = `分支的 profile` + 固定句尾「依此判斷，下列何者正確？」
- 正解 = `branch.verdict` + `｜` + `branch.decision`
- 干擾項 = **其他 template 的 branch** 的 `verdict｜decision`（同 template 的
  兄弟分支不可當干擾項——同一題型的分支常只差處方細節，會出現多個選項同時成立）
- 解析區印 `branch.why`，有 `correction_note` 也一併印
- 抽不出 3 個干擾項時回 `None`（分支只有 9 條，這是正常情況，不是錯誤）

`scope='applied'` 時全部出判讀題；其他 scope 下，判讀題以 **15% 機率**插入，
且每份考卷最多 3 題（池子太小，超過就會重複）。

## 8. `data/cscs/_mistakes.yaml` 格式

```yaml
# 錯題軸：由 .study/cscs_study.db 聚合產生，勿手改。
# 重生成：python tools/cscs_study.py export-mistakes
meta:
  generated: 2026-09-11T21:30:00
  events: 412
  note: 只納入 n_seen >= 3 的 key；低於此門檻的一次錯就會是 100%，不具意義

by_domain:
  - key: pa1-program-design
    n_seen: 44
    n_wrong: 19
    wrong_rate: 0.432
by_chapter: [...]
by_concept: [...]
by_template: [...]

worst_items:
  - id: ch17.load-repetitions.i04
    n_seen: 6
    n_wrong: 4
    locator: "..."
```

`worst_items` 取前 20，門檻同樣是 `n_seen >= 3`。

## 9. CLI（`python tools/cscs_study.py <cmd>`）

| 指令 | 行為 |
|---|---|
| `status` | 印 §6 的 status dict，人類可讀 |
| `status --json` | 同上但輸出 JSON（給 shotclock / 其他消費者） |
| `due [--limit N]` | 列今日到期條目 |
| `quiz [--n N] [--scope S] [--chapter chNN] [--domain D] [--seed K]` | 印一份考卷（沿用 `cscs_quiz.py` 的排版） |
| `weak` | 印四個維度的錯題軸 |
| `export-mistakes` | 寫 `data/cscs/_mistakes.yaml` |
| `selftest` | 見 §12 |

## 10. GUI：`tools/cscs_study_gui.py`

對外只有 `build_tab(parent)`（回傳建好的 frame）與 `main()`（自己開一個 Tk 視窗，
方便單獨測試）。**配色與字型從 deskboard 的 `status_gui` 取**，import 失敗時
（例如單獨執行）fallback 到內建常數，不要讓看板以外的執行路徑直接壞掉：

```python
try:
    import status_gui
    BG, PANEL, FG, HEAD, TRACK = (status_gui.BG, status_gui.PANEL,
                                  status_gui.FG, status_gui.HEAD, status_gui.TRACK)
    FONT = status_gui.FONT
except Exception:
    BG, PANEL, FG, HEAD, TRACK = "#1b1d1e", "#26292b", "#d8d4cc", "#e8e3d8", "#33373a"
    FONT = "Microsoft JhengHei UI"
```

版面三層，由上而下：

### ① 提醒橫幅（常駐，不可收合）

一行字，內容由 `status()` 組：

> 今日到期 **42** 條 · 未讀過 **311** 條 · 連續 **5** 天 · 本週練 80 題正確率 **68%** · 距考試 **34** 天

- 到期數 > 0 時橫幅底色用 `TRACK`，= 0 時轉暗。
- `days_to_exam` 為 None 時整段不顯示，並在橫幅右側放一個「設定考試日期」小按鈕
  （寫進 `.study/config.json`）。
- **分頁標題也要掛數字**：`build_tab` 回傳的 frame 上掛屬性 `tab_title`，值為
  `f"CSCS 讀書（{due}）"`，並提供 `refresh_title()` 供 hub 呼叫。

### ② 模式切換（讀書 / 出題 / 弱點）

三個按鈕，切換下方主區。

### ③ 主區

**讀書模式**
- 左窄欄：章 → topic 樹（從 `ch*.yaml` 讀 `title`；**不要在程式裡寫死章節標題**，
  真相源是 yaml）。樹頂固定一項「今日到期（跨章）」。
- 右主區：一次一條 item。
  - 標題句 `q` 常駐大字
  - `a` 條列**預設遮住**，按「顯示答案」或空白鍵揭示
  - 揭示後同時顯示 `detail`、`terms`（中英對照常駐可見，不可收進 hover）、
    `numbers`（`v` / `unit` / `of` 三欄）、`locator`
  - 底部三鍵：**會了**（`known`）／**沒把握**（`unsure`）／**不會**（`wrong`），
    按下即 `record(mode='read', ...)` 並前進下一條
  - 鍵盤：空白＝揭示，`1`/`2`/`3` 對應三鍵，`←` 回上一條（回上一條不寫事件）

**出題模式**
- 頂列：範圍下拉（全卷權重／弱點加權／今日到期／某章／某 domain／只出判讀題）
  ＋ 題數 spinbox（預設 20）＋「開始」
- 一題一畫面：題幹、四選項（按鈕）、作答後立刻顯示對錯 ＋ 正解 ＋ `locator`
  ＋ 判讀題的 `why`，並給一個「去讀這條」按鈕（切回讀書模式並跳到該 item）
- 收尾報表：總正確率、逐 domain 正確率、錯題清單（點擊跳讀）
- 每題作答即 `record(mode='quiz', ...)`，**不要等整份做完才寫**（中途關窗不該掉紀錄）

**弱點模式**
- 四個維度（domain / chapter / concept / template）各一個表格，欄位
  「項目 / 出現 / 錯 / 錯誤率」，錯誤率降序
- 底部「匯出 `_mistakes.yaml`」按鈕，呼叫 `export_mistakes`
- 每列可點，點了直接用該範圍開一份 10 題的考卷

## 11. 掛上桌面看板

`C:\claudehome\tools\deskboard\hub.py` **不在任何 git repo**，且只有三行改動，
**不在本任務範圍內，不要動它**。（由呼叫方另外處理。）

## 12. 驗收（全部要綠，逐條貼出實際輸出）

```bash
cd C:/claudehome/projects/my-site
python -m unittest discover -s tools/tests -v
python tools/cscs_check.py                 # 既有閘不得因本次改動變紅
python tools/cscs_study.py selftest
python tools/cscs_study.py status
python tools/cscs_study.py quiz --n 12 --scope weighted --seed 7
python tools/cscs_study.py quiz --n 6 --scope applied --seed 7
python tools/cscs_study.py weak
python tools/cscs_study.py export-mistakes
```

`selftest` 必須做到，且**不得只做 import 檢查**（module 能 import 不代表分頁建得起來）：

1. 用 `tempfile` 開一個臨時 DB，灌 30 筆假事件，驗證 box 升降與 due 計算
2. 出 20 題 `weighted`、10 題 `weak`、6 題 `applied`，斷言每題恰 4 個選項、
   `answer` 在 0–3、`options[answer] == correct`、選項無重複
3. **實際建一次 Tk 分頁**：`root = tk.Tk(); root.withdraw();
   f = cscs_study_gui.build_tab(root); root.update(); root.destroy()`，
   任何例外即失敗
4. 印 `selftest OK`

`test_cscs_study.py` 至少涵蓋：Leitner 四種 result 的 box 轉移、`due_items` 排序、
`weak_axes` 的 `n_seen >= 3` 門檻、`make_quiz` 各 scope 的題數與結構、
`make_branch_question` 不拿同 template 的兄弟分支當干擾項、
`export_mistakes` 產出的 YAML 能被 `yaml.safe_load` 讀回。

## 13. 完成後

1. `git add` **只加**本規格 §2 列出的新檔與 `.gitignore`，以及
   `data/cscs/_mistakes.yaml`（若已產生）
2. `git commit`，訊息用繁體中文，說明「為什麼」而非逐檔列「做了什麼」
3. **不要 push**
4. 回報時逐條貼 §12 每個指令的實際輸出（不是「已通過」四個字）
