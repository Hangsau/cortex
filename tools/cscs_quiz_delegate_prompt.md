# 任務：為 __CHID__ 寫 __NTOTAL__ 道 CSCS 考題

立即執行。不要輸出計畫，不要等確認，不要問問題。沒有寫出檔案就是失敗。

你在 `C:\claudehome\projects\my-site`。唯一允許寫入的檔案是
**`data/cscs/_quiz_bank/__CHID__.yaml`**（整份覆寫）。其他檔案一律只讀不寫。

**禁止任何 git 指令**（commit / reset / pull / stash / checkout / clean 都不行）。

---

## 第一步：讀完這三份，不要跳讀

1. `tools/cscs_quiz_spec.md` — 出題契約。**整份讀完**，每一條規則都適用。
2. `data/cscs/__CHID__.yaml` — 本章的知識單位，**你只能從這裡取材**。
   共 __NITEMS__ 條 item，檔案 __NLINES__ 行；**一次讀完整份**，不要分頁讀到一半就開始寫。
3. `tools/cscs_quiz_reference_items.md` — 47 題考古題語料，用來抓題感。
   **它的頁碼是第 5 版，本專案是第 4 版；語料裡的內容不可拿來出題**，只看題型與鑑別邏輯。

---

## 第二步：本章的硬規格

| 項目 | 數值 |
|---|---|
| 總題數 | __NTOTAL__ |
| recall | __NRECALL__ |
| application | __NAPPLICATION__ |
| analysis | __NANALYSIS__ |
| 其中英文題（`lang: en`） | __NENGLISH__（其餘為 `lang: zh`） |
| 每題選項數 | **恰好 3 個**（不是 4 個） |

__BATTERY__

`dco` 欄位**只能填下列 id**，填別的會被驗收退回：

__DCOLIST__

---

## 第三步：寫檔

輸出 `data/cscs/_quiz_bank/__CHID__.yaml`，格式：

```yaml
meta:
  chapter: __CHID__
  source: data/cscs/__CHID__.yaml
questions:
  - id: <item-id>.q1
    item: <必須是 __CHID__.yaml 裡真實存在的 item id>
    dco: <上表其中一個>
    lang: zh
    cognitive: application
    stem: <中文題以全形「？」結尾，至少 12 字；英文題以「?」結尾，至少 8 個詞>
    locator: <與該 item 的 locator 逐字相同，一個字都不能差>
    options:
      - text: <短名詞片語>
        correct: true
      - text: <短名詞片語>
        correct: false
        why_wrong: <考生犯了哪個思考錯誤，不是把選項換句話說>
      - text: <短名詞片語>
        correct: false
        why_wrong: <同上>
```

硬性要求，逐條核對後再收工：

- **正解不寫 `why_wrong`**；兩個干擾項都要寫。
- **干擾項必須是讀得不夠細的人會選的東西**。寫完每個干擾項問自己：一個讀完本章但讀得不夠細的人
  會不會選它？不會就重寫。`bones contract to move joints`（骨頭會收縮）這種一眼就假的不算干擾項。
- **application 與 analysis 題的題幹一定要有比較限定詞**（中文：最主要／最不／首先／優先；
  英文：most／least／primary／best／greatest／first）。考生要排序，不是判真假。
- **三個選項語法平行、長度相近**。最長不得超過最短的 **1.5 倍**，正解不得是最長的那個。
  長度要靠**三個一起改寫到同一長度帶**達成，**不准用縮寫、希臘字母或分號把某一個縮掉**
  （`raise firing ν of existing units`、`muscles pull only; skeleton transmits` 都會被退）。
  希臘字母只有在它本來就是術語時才可用（`α-motor unit`、`µm` 可以；`ν`、`ΔP` 不可以）。
- **數字題的三個選項必須是同一個量的三個數值**——同單位、同被測對象，只有數值不同。
  問肌節靜止長度就三個都是肌節長度，不能混進細絲厚度或肌纖維直徑；混用 `nm` 與 `µm` 會被擋。
- **不要自己拼術語**。只用本章 yaml 出現過的詞，或該領域公認的標準術語。
  `γ-fiber hypertrophy` 這種看起來很專業但不存在的東西，一律視為造假。
- **`locator` 逐字複製**來源 item 的 `locator`，不要改標點、不要補空白。
- **中文題不可出現簡體字**。
- **英文題不是中文題的翻譯**，同一個 item 的中英題要問不同角度。
- **同一個 item 最多出 2 題**，題幹不得重複。
- 否定題（`EXCEPT` / 「何者不是」）**本章至多 1 題**，可以完全不寫。
- **不要寫任何百分位、族群平均、常模門檻的數字**——本庫沒有常模表，寫了就是編造。

---

## 第四步：自驗

```
python -X utf8 tools/cscs_quiz_bank_check.py
```

只看 `__CHID__.yaml` 的那幾行錯誤（其他章尚未重寫，一定是紅的，不歸你管）。
**修到 `__CHID__` 一條錯誤都沒有為止**，再回報。

回報格式：寫了幾題、跑了幾輪驗收、`__CHID__` 目前剩幾條錯誤（應為 0）。
不要貼整份 yaml。
