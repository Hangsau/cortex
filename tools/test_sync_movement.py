#!/usr/bin/env python3
"""同步端洩漏測試 — movement 圖譜的 public/diagnostic 剝離。

用法：python tools/test_sync_movement.py

為什麼要獨立一支：sync_vortex.py 對 movement 是「記錄層白名單 + public 攤平 +
diagnostic 整塊不取」。白名單漏一欄不會報錯，只會安靜地把教練決策語推上公開站。
本測試用帶診斷內容的 fixture 遞迴掃輸出，任何一個診斷標記出現即失敗。
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from sync_vortex import (  # noqa: E402
    MOVEMENT_FILES,
    MOVEMENT_HIDDEN_STATUS,
    movement_public_record,
    movement_public_records,
)

MARKER = "SHOULD-NOT-LEAK"

FIELDS = {name: fields for name, _, fields in MOVEMENT_FILES}


def walk(node):
    """遞迴產出輸出裡的每一個 key 與每一個字串值。"""
    if isinstance(node, dict):
        for k, v in node.items():
            yield ("key", k)
            yield from walk(v)
    elif isinstance(node, (list, tuple)):
        for v in node:
            yield from walk(v)
    elif isinstance(node, str):
        yield ("value", node)


def assert_no_leak(out, label):
    hits = [x for x in walk(out) if MARKER in x[1] or x[1] == "diagnostic"]
    assert not hits, f"{label}：診斷內容外洩 {hits}"


def make_record(extra_record_fields):
    rec = {
        "id": "movement.action.test",
        "publication_status": "published",
        "claim_status": "supported",
        "action_status": "ready",
        "evidence_profile": "anatomy",
        "source_ids": ["src.test"],
        "public": {"name_zh": "測試", "description": "公開描述"},
        "diagnostic": {
            "assessment_note": f"{MARKER} 被動 ROM 量測判讀",
            "decision_tree_note": f"{MARKER} 教練決策樹",
        },
    }
    rec.update(extra_record_fields)
    return rec


def test_diagnostic_subtree_never_output():
    for name, fields in FIELDS.items():
        out = movement_public_record(make_record({}), fields)
        assert_no_leak(out, f"{name} diagnostic 子樹")
        assert out.get("name_zh") == "測試", f"{name}：public 子樹未攤平"


def test_record_level_fields_are_whitelisted():
    """記錄層未列入白名單的欄位不得出站——即使 canonical 之後新增欄位。"""
    for name, fields in FIELDS.items():
        rec = make_record({
            "how_to_identify": f"{MARKER} 如何分類限制",
            "works_when": f"{MARKER} 教練決策條件",
            "affirmative_conclusion": f"{MARKER} 記錄層裁決句",
            "some_future_internal_field": f"{MARKER} 還沒被想到的內部欄位",
        })
        out = movement_public_record(rec, fields)
        assert_no_leak(out, f"{name} 記錄層白名單")
        for k in out:
            assert k in fields or k in rec["public"], \
                f"{name}：輸出出現非白名單且非 public 的欄位 {k}"


def test_interventions_coach_layer_not_public():
    """interventions 的記錄層決策語走 public 子樹的 *_summary，不直接出站。"""
    fields = FIELDS["interventions"]
    for banned in ("works_when", "fails_when", "how_to_identify", "action",
                   "affirmative_conclusion"):
        assert banned not in fields, f"interventions 白名單不該含記錄層決策欄 {banned}"


def test_unpublished_records_filtered():
    fields = FIELDS["actions"]
    recs = [
        make_record({"id": "a.published"}),
        {**make_record({"id": "a.draft"}), "publication_status": "draft"},
        {**make_record({"id": "a.withheld"}), "publication_status": "withheld"},
    ]
    out = movement_public_records(recs, fields)
    assert [r["id"] for r in out] == ["a.published"], f"未發布記錄未被過濾：{out}"
    assert MOVEMENT_HIDDEN_STATUS == frozenset({"draft", "withheld"})


def test_missing_publication_status_is_withheld():
    """缺 publication_status 視為未發布——保守側，不讓漏標欄位的新記錄直接上站。"""
    rec = make_record({})
    rec.pop("publication_status")
    assert movement_public_records([rec], FIELDS["actions"]) == []


def test_empty_and_malformed_input():
    fields = FIELDS["actions"]
    assert movement_public_records(None, fields) == []
    assert movement_public_records([], fields) == []
    assert movement_public_records(["not a dict", 42], fields) == []


def test_atomic_write_leaves_no_tmp_and_replaces_whole_file():
    import tempfile

    from sync_vortex import _atomic_write_yaml

    with tempfile.TemporaryDirectory() as d:
        dst = Path(d) / "actions.yaml"
        _atomic_write_yaml(dst, {"actions": [{"id": "a.1"}]})
        _atomic_write_yaml(dst, {"actions": [{"id": "a.2"}]})
        assert "a.2" in dst.read_text(encoding="utf-8")
        assert "a.1" not in dst.read_text(encoding="utf-8"), "舊內容殘留＝不是整檔取代"
        assert list(Path(d).iterdir()) == [dst], "暫存檔未清乾淨"


def test_real_canonical_produces_zero_diagnostic():
    """對真實 canonical 跑一次：有內容時逐檔掃，沒有 movement 目錄時跳過。"""
    import yaml
    from sync_vortex import MOVEMENT_SRC_DIR

    if not MOVEMENT_SRC_DIR.exists():
        print("  [跳過] 找不到 canonical/movement，略過真實資料掃描")
        return

    total_in = total_out = 0
    for name, list_key, fields in MOVEMENT_FILES:
        src = MOVEMENT_SRC_DIR / f"{name}.yaml"
        if not src.exists():
            continue
        data = yaml.safe_load(src.read_text(encoding="utf-8")) or {}
        recs_in = data.get(list_key) or []
        out = movement_public_records(recs_in, fields)
        assert_no_leak(out, f"真實 {name}")
        total_in += len(recs_in)
        total_out += len(out)
    print(f"  真實 canonical：{total_out}/{total_in} 出站，diagnostic 命中 0")


def main():
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    failed = 0
    for t in tests:
        try:
            t()
            print(f"[PASS] {t.__name__}")
        except AssertionError as e:
            failed += 1
            print(f"[FAIL] {t.__name__}: {e}")
    print()
    print(f"{len(tests) - failed}/{len(tests)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
