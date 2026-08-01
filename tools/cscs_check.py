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

    print(f"章節 {len(chapters)} / 知識單位 {total} / 已補 detail {filled}"
          f"（{filled * 100 // total}%）")
    print(f"術語表 {len(terms)} 條，被引用 {len(used_terms)} 條")
    print(f"概念表 {len(concepts)} 條，被引用 {len(used_concepts)} 條")

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
