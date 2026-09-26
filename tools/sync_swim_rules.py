"""從 swim-coach 規則表同步課表計算用的數字（Claude 撰寫，2026-09-26）。

真相源：C:/claudehome/projects/swim-coach/rules/menu_rules.yaml（規則表由 Hang 本人撰寫，本工具只讀）。
輸出：next/data/swim_rules.json（commit 進 my-site；CI 讀不到 swim-coach，所以同步後要 commit）。
「課表與間歇計時」頁（vortex/workout/）的強度分區、休息秒數、配速加減、出發間隔進位全部讀這份，
網站端不寫死任何處方數字。

用法：python -X utf8 tools/sync_swim_rules.py
"""
import json
import subprocess
from datetime import date
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT.parent / "swim-coach" / "rules" / "menu_rules.yaml"
OUT = ROOT / "next" / "data" / "swim_rules.json"


def main():
    r = yaml.safe_load(SRC.read_text(encoding="utf-8"))

    def find(key):
        """規則表各節有巢狀層級，依鍵名遞迴找第一個。"""
        stack = [r]
        while stack:
            o = stack.pop(0)
            if isinstance(o, dict):
                if key in o:
                    return o[key]
                stack.extend(o.values())
            elif isinstance(o, list):
                stack.extend(o)
        return None

    tz = find("training_zones")
    z = tz["zones"]
    tv = find("trial_validity") or {}
    single = find("single_performance") or {}
    without = find("without_css") or {}
    commit = subprocess.run(["git", "-C", str(SRC.parent.parent), "log", "-1", "--format=%h %cs", "--", "rules/menu_rules.yaml"],
                            capture_output=True, text=True).stdout.strip()
    out = {
        "source": {
            "file": "swim-coach/rules/menu_rules.yaml",
            "commit": commit,
            "synced": date.today().isoformat(),
            "zones_citation": tz["source"]["citation"],
        },
        "pace_offset_sec_per_100": {k: v for k, v in find("pace_offset_sec_per_100").items()
                                    if k in ("main_technique", "main_endurance", "main_speed")},
        "rest_seconds": {k: find("rest_seconds")[k] for k in ("main_technique", "main_endurance", "main_speed", "drill", "cool_down")},
        "drill_rest_by_stroke": find("rest_seconds").get("drill_by_stroke", {}),
        "send_off_rounding_sec": find("send_off")["rounding_sec"],
        "zones": {
            "En-2": {
                "name_zh": z["En-2"]["name_zh"], "purpose_zh": z["En-2"]["purpose_zh"],
                "rest_max_ratio": z["En-2"]["rest_max_ratio"], "rest_ratio_over_100m": z["En-2"]["rest_ratio_over_100m"],
                "set_duration_min": z["En-2"]["set_duration_min"], "rpe_pct_of_max": z["En-2"]["rpe_pct_of_max"],
            },
            "En-3": {
                "name_zh": z["En-3"]["name_zh"], "purpose_zh": z["En-3"]["purpose_zh"],
                "repeat_distance_m": z["En-3"]["repeat_distance_m"],
                "cited_repeat_sec": z["En-3"]["cited_evidence"]["repeat_sec"],
                "cited_rest_min": z["En-3"]["cited_evidence"]["rest_min"],
            },
            "Sp": {
                "name_zh": z["Sp"]["name_zh"], "purpose_zh": z["Sp"]["purpose_zh"],
                "rest_sec_by_distance": {str(k): v for k, v in z["Sp"]["rest_sec_by_distance"].items()},
                "reps_by_distance": {str(k): v for k, v in z["Sp"]["reps_by_distance"].items()},
                "rationale_en": z["Sp"]["rationale_en"],
            },
        },
        "css": {
            "pair_bias_note_zh": tv.get("pair_bias_note_zh", ""),
            "single_forbidden_zh": (single.get("why_forbidden_zh") or "").strip(),
            "practice_shortcut": {
                "rule_en": (single.get("practice_level_shortcut") or {}).get("rule_en", ""),
                "source": (single.get("practice_level_shortcut") or {}).get("source", ""),
                "certainty": (single.get("practice_level_shortcut") or {}).get("certainty", ""),
            },
            "perceived_anchors_zh": without.get("anchors_zh", []),
        },
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"同步完成（規則表 {commit}）→ {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
