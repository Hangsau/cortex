"""驗證 data/cscs/ 的完整性，並輸出補完缺口報告。

交叉參照能不能信，取決於有沒有人去解析它。這支就是那個人：
related / terms / concepts 指到不存在的目標，一律算失敗，不是待辦。

用法：
  python tools/cscs_check.py            # 全部章節
  python tools/cscs_check.py ch01       # 只看指定章節的缺口
"""
import sys
from pathlib import Path

import yaml

DATA = Path(__file__).resolve().parent.parent / "data" / "cscs"

# Windows 主控台預設 cp950，中文報告會變亂碼而讓人以為工具壞了
sys.stdout.reconfigure(encoding="utf-8", errors="replace")


class StrictLoader(yaml.SafeLoader):
    """PyYAML 預設讓重複 key 後者覆蓋前者，Hugo 的 YAML 解析器卻硬性報錯。
    只用 safe_load 驗收會全綠但網站建不起來（2026-08-01 ch11 殘留的 `numbers: []`
    蓋掉填好的區塊，python 全過、hugo 直接 error building site）。"""


def _no_dup_mapping(loader, node, deep=False):
    seen = set()
    for k, _ in node.value:
        key = loader.construct_object(k, deep=True)
        if key in seen:
            raise yaml.YAMLError(f"第 {k.start_mark.line + 1} 行重複的 key '{key}'（Hugo 會建置失敗）")
        seen.add(key)
    return yaml.SafeLoader.construct_mapping(loader, node, deep)


StrictLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _no_dup_mapping)


def load(name):
    path = DATA / f"{name}.yaml"
    try:
        return yaml.load(path.read_text(encoding="utf-8"), StrictLoader)
    except yaml.YAMLError as exc:
        sys.exit(f"{path.name}: {exc}")


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    terms = load("_terms")
    concepts = load("_concepts")
    domains = load("_domains")
    applied = load("_applied")
    chapters = {p.stem: load(p.stem) for p in sorted(DATA.glob("ch*.yaml"))}

    all_ids = set()
    dup = []
    for ch in chapters.values():
        for topic in ch["topics"]:
            for item in topic["items"]:
                if item["id"] in all_ids:
                    dup.append(item["id"])
                all_ids.add(item["id"])

    errors = []
    used_terms, used_concepts = set(), set()
    filled = 0
    total = 0

    for ch_id, ch in chapters.items():
        for topic in ch["topics"]:
            for item in topic["items"]:
                total += 1
                iid = item["id"]
                if not iid.startswith(f"{ch_id}."):
                    errors.append(f"{iid}: id 前綴與所在章節 {ch_id} 不符")
                if item.get("detail"):
                    filled += 1
                for key in item.get("terms") or []:
                    used_terms.add(key)
                    if key not in terms:
                        errors.append(f"{iid}: terms 指向未定義的術語 '{key}'")
                for key in item.get("concepts") or []:
                    used_concepts.add(key)
                    if key not in concepts:
                        errors.append(f"{iid}: concepts 指向未定義的概念 '{key}'")
                for ref in item.get("related") or []:
                    if ref not in all_ids:
                        errors.append(f"{iid}: related 指向不存在的知識單位 '{ref}'")
                    if ref == iid:
                        errors.append(f"{iid}: related 指向自己")
                for num in item.get("numbers") or []:
                    missing = [k for k in ("v", "unit", "of") if not num.get(k)]
                    if missing:
                        errors.append(f"{iid}: numbers 缺 {'/'.join(missing)}：{num}")

    for iid in sorted(set(dup)):
        errors.append(f"重複的 id：{iid}")

    for key, t in terms.items():
        if not t.get("zh"):
            errors.append(f"術語 '{key}' 缺中文")
        if not t.get("en"):
            errors.append(f"術語 '{key}' 缺英文全稱")

    # 考點軸：章節必須不重不漏地分進 domain，否則按權重配題會靜默少算一章
    section_ids = {s["id"] for s in domains["sections"]}
    domain_ids = set()
    primary_of = {}
    for d in domains["domains"]:
        domain_ids.add(d["id"])
        if d["section"] not in section_ids:
            errors.append(f"domain '{d['id']}': section '{d['section']}' 未定義")
        for ch in d["chapters"]:
            if ch not in chapters:
                errors.append(f"domain '{d['id']}': chapters 指向不存在的章節 '{ch}'")
            elif ch in primary_of:
                errors.append(f"章節 {ch} 同時是 '{primary_of[ch]}' 與 '{d['id']}' 的主 domain")
            else:
                primary_of[ch] = d["id"]
        for ch in d.get("also") or []:
            if ch not in chapters:
                errors.append(f"domain '{d['id']}': also 指向不存在的章節 '{ch}'")

    for ch in chapters:
        if ch not in primary_of:
            errors.append(f"章節 {ch} 沒有被分進任何 domain（按權重配題會漏掉它）")

    for sec in domains["sections"]:
        total_w = sum(d["weight_pct"] for d in domains["domains"] if d["section"] == sec["id"])
        if total_w != 100:
            errors.append(f"section '{sec['id']}' 的 weight_pct 合計 {total_w}，不是 100")
        total_q = sum(d["scored"] for d in domains["domains"] if d["section"] == sec["id"])
        if total_q != sec["scored"]:
            errors.append(f"section '{sec['id']}' 的 scored 合計 {total_q}，與宣告的 {sec['scored']} 不符")

    # cognitive 是官方 DCO 逐 domain 給的認知層級配題，三項合計必須等於該 domain 的
    # scored。抄錯一格不會讓任何東西壞掉，只會讓「這個 domain 背得起來嗎」的判斷歪掉。
    for d in domains["domains"]:
        cog = d.get("cognitive")
        if not cog:
            errors.append(f"domain '{d['id']}' 缺 cognitive")
            continue
        if set(cog) != {"recall", "application", "analysis"}:
            errors.append(f"domain '{d['id']}' 的 cognitive 欄位不是 recall/application/analysis")
            continue
        if sum(cog.values()) != d["scored"]:
            errors.append(
                f"domain '{d['id']}' 的 cognitive 合計 {sum(cog.values())}，"
                f"與 scored {d['scored']} 不符"
            )

    # 實務判斷層：chapters / domain 參照要能解析，否則缺口清單會指向空氣
    def check_refs(where, node):
        for ch in node.get("chapters") or []:
            if ch not in chapters:
                errors.append(f"{where}: chapters 指向不存在的章節 '{ch}'")
        for dom in node.get("domain") or []:
            if dom not in domain_ids:
                errors.append(f"{where}: domain 指向未定義的 '{dom}'")

    for tpl in applied["templates"]:
        check_refs(f"題型 '{tpl['id']}'", tpl)
        if not tpl.get("branches"):
            errors.append(f"題型 '{tpl['id']}' 沒有任何分支")
    for gap in applied["gaps"]:
        check_refs(f"缺口 '{gap['id']}'", gap)
        if len(gap.get("chapters") or []) < 2:
            errors.append(f"缺口 '{gap['id']}' 只掛一章：跨章缺口才是缺口，單章的是待補內容")

    print(f"章節 {len(chapters)} / 知識單位 {total} / 已補 detail {filled}"
          f"（{filled * 100 // total}%）")
    print(f"術語表 {len(terms)} 條，被引用 {len(used_terms)} 條")
    print(f"概念表 {len(concepts)} 條，被引用 {len(used_concepts)} 條")
    print(f"題型 {len(applied['templates'])} 個 / 分支 "
          f"{sum(len(t['branches']) for t in applied['templates'])} 條 / "
          f"缺口 {len(applied['gaps'])} 條")

    # 內容佔比 vs 考試佔比：落差就是讀書時間該挪的方向
    n_items = {ch: sum(len(t["items"]) for t in c["topics"]) for ch, c in chapters.items()}
    exam_total = sum(d["scored"] for d in domains["domains"])
    print("\n--- 考點軸：內容佔比 vs 考試佔比 ---")
    for d in domains["domains"]:
        items = sum(n_items[ch] for ch in d["chapters"])
        content_share = items * 100 / total
        exam_share = d["scored"] * 100 / exam_total
        drift = exam_share - content_share
        flag = "  <<< 考得多讀得少" if drift >= 5 else ("  (內容多考得少)" if drift <= -5 else "")
        print(f"  {d['id']:<24} 內容 {items:>4} 條 {content_share:>5.1f}%  "
              f"考題 {d['scored']:>3} 題 {exam_share:>5.1f}%{flag}")

    # 認知層級決定「這個 domain 背得起來嗎」。recall 佔比高的背了就拿得到分；
    # 低的把事實背熟也只值那幾題，要靠 _applied.yaml 的判讀規則。
    cog_total = {k: sum(d["cognitive"][k] for d in domains["domains"])
                 for k in ("recall", "application", "analysis")}
    print("\n--- 認知層級（官方 DCO）---")
    for d in domains["domains"]:
        c = d["cognitive"]
        print(f"  {d['id']:<24} 記憶 {c['recall']:>2}  應用 {c['application']:>2}  "
              f"分析 {c['analysis']:>2}   背得到 {c['recall'] * 100 // d['scored']:>2}%")
    print(f"  {'全卷':<24} 記憶 {cog_total['recall']:>2}  應用 {cog_total['application']:>2}  "
          f"分析 {cog_total['analysis']:>2}   背得到 "
          f"{cog_total['recall'] * 100 // exam_total:>2}%")

    if errors:
        print(f"\n--- 錯誤 {len(errors)} ---")
        for e in errors:
            print(f"  {e}")
    else:
        print("\n交叉參照全數可解析。")

    unused_t = sorted(set(terms) - used_terms)
    unused_c = sorted(set(concepts) - used_concepts)
    if unused_t:
        print(f"\n定義了但沒人用的術語（{len(unused_t)}）：{', '.join(unused_t)}")
    if unused_c:
        print(f"定義了但沒人用的概念（{len(unused_c)}）：{', '.join(unused_c)}")

    print("\n--- 補完缺口 ---")
    for ch_id, ch in chapters.items():
        if only and ch_id != only:
            continue
        blanks = [i for t in ch["topics"] for i in t["items"] if not i.get("detail")]
        mark = "OK" if not blanks else f"{len(blanks)} 條待補"
        print(f"  {ch_id}: {mark}")
        if only:
            for i in blanks:
                print(f"      {i['id']}  {i['q']}")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
