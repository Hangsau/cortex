"""把受控概念標到全書知識單位上（topic 層映射 → item 欄位）。

為什麼是 topic 層而不是逐條標：概念詞彙刻意粗（22 條），粒度本來就落在
「這個主題在講什麼」而不是「這一條在講什麼」。1583 條逐條判斷的邊際準確度，
換不到相稱的可讀性——真正需要逐條分辨的，補完該章 detail 時順手改就好。

不覆寫既有值：已經有 concepts 的 item（ch01 的 68 條是手標的）原封不動，
所以這支可以重複跑。要改某條的概念，直接改 chNN.yaml，不要改這裡的映射。

用法：
  python tools/cscs_tag_concepts.py --dry    # 只看會改什麼
  python tools/cscs_tag_concepts.py          # 實際寫入
"""
import sys
from pathlib import Path

import yaml

DATA = Path(__file__).resolve().parent.parent / "data" / "cscs"

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# 2026-07-31 概念表從 12 條擴到 22 條時併掉的兩條（原本只出現在 ch01，
# 對「跨章節讀」零貢獻）。ch01 手標的舊值靠這張表跟著搬。
RENAME = {
    "concentric-mechanism": "force-production",
    "methodology": "measurement",
}

# chNN.topic-id → 概念。依 topic 標題判定，每個 topic 1–3 條。
TOPIC_CONCEPTS = {
    # ---- ch01 身體系統結構與功能 ----
    "ch01.skeleton": ["structure"],
    "ch01.muscle-structure": ["structure"],
    "ch01.sliding-filament": ["force-production"],
    "ch01.neuromuscular": ["motor-control", "force-production"],
    "ch01.fiber-types": ["fiber-type"],
    "ch01.proprioception": ["reflex"],
    "ch01.cardiovascular": ["circulation"],
    "ch01.respiratory": ["gas-exchange"],
    # ---- ch02 阻力運動生物力學 ----
    "ch02.joint-biomechanics": ["structure", "force-production"],
    "ch02.levers": ["force-production", "structure"],
    "ch02.musculature": ["structure", "force-production"],
    "ch02.planes": ["structure"],
    "ch02.resistance-sources": ["force-production", "technique"],
    "ch02.size-strength": ["force-production", "structure"],
    "ch02.strength-factors": ["force-production"],
    "ch02.work-power": ["force-production", "measurement"],
    # ---- ch03 生物能量學 ----
    "ch03.energy-capacity": ["energy-supply"],
    "ch03.epoc": ["energy-supply", "measurement"],
    "ch03.glycolysis": ["energy-supply"],
    "ch03.lactate": ["energy-supply", "normal-values"],
    "ch03.metabolic-specificity": ["energy-supply", "adaptation"],
    "ch03.oxidative": ["energy-supply"],
    "ch03.phosphagen": ["energy-supply"],
    "ch03.substrate": ["energy-supply", "nutrition"],
    # ---- ch04 內分泌反應 ----
    "ch04.catecholamines": ["hormone"],
    "ch04.cortisol": ["hormone"],
    "ch04.endocrinology-basics": ["hormone"],
    "ch04.growth-hormone": ["hormone"],
    "ch04.igf": ["hormone"],
    "ch04.program-design": ["hormone", "program-design"],
    "ch04.receptor-mechanisms": ["hormone", "structure"],
    "ch04.testosterone": ["hormone"],
    # ---- ch05 無氧訓練適應 ----
    "ch05.cardiovascular-adaptations": ["adaptation", "circulation"],
    "ch05.connective-tissue": ["adaptation", "structure"],
    "ch05.detraining": ["adaptation"],
    "ch05.endocrine-adaptations": ["adaptation", "hormone"],
    "ch05.fiber-type-transitions": ["adaptation", "fiber-type"],
    "ch05.hypertrophy": ["adaptation", "structure"],
    "ch05.neural-adaptations": ["adaptation", "motor-control"],
    "ch05.overtraining": ["adaptation", "periodization"],
    # ---- ch06 有氧耐力適應 ----
    "ch06.acute-cardiovascular": ["circulation", "adaptation"],
    "ch06.acute-respiratory": ["gas-exchange", "adaptation"],
    "ch06.chronic-cardiovascular": ["adaptation", "circulation"],
    "ch06.chronic-muscular": ["adaptation", "fiber-type"],
    "ch06.connective-endocrine": ["adaptation", "hormone"],
    "ch06.detraining": ["adaptation"],
    "ch06.external-factors": ["adaptation", "safety"],
    "ch06.overtraining": ["adaptation", "periodization"],
    # ---- ch07 年齡與性別差異 ----
    "ch07.aging-musculoskeletal": ["population", "structure"],
    "ch07.children-growth": ["population", "structure"],
    "ch07.children-risk-benefits": ["population", "safety"],
    "ch07.children-training-response": ["population", "adaptation"],
    "ch07.female-acl": ["population", "injury"],
    "ch07.female-physiology": ["population", "structure"],
    "ch07.older-adults-training": ["population", "adaptation"],
    "ch07.program-design-populations": ["population", "program-design"],
    # ---- ch08 運動心理學 ----
    "ch08.arousal-anxiety-stress": ["psychology"],
    "ch08.arousal-theories": ["psychology"],
    "ch08.attention-concentration": ["psychology"],
    "ch08.goal-setting": ["psychology"],
    "ch08.ideal-performance-state": ["psychology"],
    "ch08.motivation": ["psychology"],
    "ch08.motor-skill-acquisition": ["psychology", "motor-control"],
    "ch08.psychological-techniques": ["psychology"],
    # ---- ch09 基礎營養 ----
    "ch09.carbohydrate": ["nutrition", "energy-supply"],
    "ch09.dietary-reference-standards": ["nutrition", "normal-values"],
    "ch09.electrolytes": ["nutrition"],
    "ch09.fat": ["nutrition", "energy-supply"],
    "ch09.hydration": ["nutrition"],
    "ch09.protein": ["nutrition"],
    "ch09.sports-dietitian-role": ["nutrition", "professional"],
    "ch09.vitamins-minerals": ["nutrition", "ergogenic"],
    # ---- ch10 營養策略 ----
    "ch10.carb-loading": ["nutrition", "energy-supply"],
    "ch10.during-event": ["nutrition"],
    "ch10.eating-disorders": ["nutrition", "psychology"],
    "ch10.obesity-assessment": ["nutrition", "measurement"],
    "ch10.post-competition": ["nutrition"],
    "ch10.pre-competition": ["nutrition"],
    "ch10.weight-gain": ["nutrition", "ergogenic"],
    "ch10.weight-loss": ["nutrition"],
    # ---- ch11 增強表現物質 ----
    "ch11.anabolic-steroids": ["ergogenic", "hormone"],
    "ch11.anabolic-supplements": ["ergogenic", "nutrition"],
    "ch11.beta-agonists-stimulants": ["ergogenic"],
    "ch11.caffeine-energy-drinks": ["ergogenic"],
    "ch11.epo-blood-doping": ["ergogenic", "circulation"],
    "ch11.insulin-hgh": ["ergogenic", "hormone"],
    "ch11.muscle-buffering": ["ergogenic", "energy-supply"],
    "ch11.prohormones-hcg": ["ergogenic", "hormone"],
    # ---- ch12 測驗選擇與施測原則 ----
    "ch12.administration": ["measurement", "professional"],
    "ch12.reliability": ["measurement"],
    "ch12.safety": ["measurement", "safety"],
    "ch12.selection-factors": ["measurement"],
    "ch12.terminology": ["measurement"],
    "ch12.test-sequence": ["measurement"],
    "ch12.validity": ["measurement"],
    "ch12.why-test": ["measurement"],
    # ---- ch13 測試管理、計分與解讀 ----
    "ch13.aerobic-capacity": ["measurement", "energy-supply"],
    "ch13.agility-speed": ["measurement"],
    "ch13.anaerobic-endurance": ["measurement", "energy-supply"],
    "ch13.balance-flexibility-bc": ["measurement"],
    "ch13.max-strength": ["measurement", "force-production"],
    "ch13.power-tests": ["measurement", "force-production"],
    "ch13.statistics": ["measurement", "normal-values"],
    "ch13.test-administration": ["measurement"],
    # ---- ch14 熱身與柔軟度 ----
    "ch14.ballistic-stretch": ["technique"],
    "ch14.dynamic-stretch": ["technique"],
    "ch14.flexibility-factors": ["technique", "structure"],
    "ch14.pnf-techniques": ["technique", "reflex"],
    "ch14.proprioceptors": ["reflex"],
    "ch14.ramp-protocol": ["technique", "program-design"],
    "ch14.static-stretch": ["technique"],
    "ch14.warmup-physiology": ["technique", "circulation"],
    # ---- ch15 自由重量與器械技術 ----
    "ch15.body-position": ["technique"],
    "ch15.body-positioning": ["technique"],
    "ch15.breathing": ["technique", "safety"],
    "ch15.exercise-technique-fundamentals": ["technique"],
    "ch15.grips": ["technique"],
    "ch15.handgrips": ["technique"],
    "ch15.lower-body": ["technique"],
    "ch15.power-exercises-technique": ["technique"],
    "ch15.power-exercises": ["technique"],
    "ch15.spotter-communication": ["safety", "technique"],
    "ch15.spotting-how": ["safety", "technique"],
    "ch15.spotting-when": ["safety", "technique"],
    "ch15.spotting": ["safety", "technique"],
    "ch15.upper-body": ["technique"],
    "ch15.weight-belt": ["technique", "safety"],
    # ---- ch16 替代模式與非傳統器材 ----
    "ch16.bodyweight-training": ["technique"],
    "ch16.chain-training": ["technique", "force-production"],
    "ch16.chains-bands": ["technique", "force-production"],
    "ch16.core-training": ["technique"],
    "ch16.general-guidelines": ["technique", "program-design"],
    "ch16.instability-devices": ["technique", "motor-control"],
    "ch16.kettlebell-unilateral": ["technique"],
    "ch16.machine-vs-freeweight": ["technique", "force-production"],
    "ch16.resistance-bands": ["technique", "force-production"],
    "ch16.strongman-training": ["technique"],
    "ch16.variable-resistance": ["technique", "force-production"],
    # ---- ch17 阻力訓練課程設計 ----
    "ch17.exercise-order": ["program-design"],
    "ch17.exercise-selection": ["program-design"],
    "ch17.load-repetitions": ["program-design"],
    "ch17.needs-analysis": ["program-design", "measurement"],
    "ch17.principles-exam-tips": ["program-design"],
    "ch17.rest-periods": ["program-design", "energy-supply"],
    "ch17.training-frequency": ["program-design"],
    "ch17.training-volume": ["program-design"],
    # ---- ch18 增強式訓練 ----
    "ch18.equipment-facility": ["safety", "program-design"],
    "ch18.intensity-volume": ["program-design"],
    "ch18.mechanical-models": ["force-production", "reflex"],
    "ch18.program-design": ["program-design"],
    "ch18.safety": ["safety"],
    "ch18.special-populations": ["population", "safety"],
    "ch18.ssc": ["force-production", "reflex"],
    "ch18.training-modes": ["program-design", "technique"],
    # ---- ch19 速度與敏捷 ----
    "ch19.agility-cod": ["technique", "motor-control"],
    "ch19.core-concepts": ["technique", "motor-control"],
    "ch19.neuromuscular-basis": ["force-production", "reflex"],
    "ch19.program-design-monitoring": ["program-design", "periodization"],
    "ch19.rfd-impulse": ["force-production", "measurement"],
    "ch19.sprint-speed-components": ["technique", "force-production"],
    "ch19.sprint-technique": ["technique"],
    "ch19.training-methods": ["program-design", "technique"],
    # ---- ch20 有氧耐力訓練 ----
    "ch20.aerobic-performance-factors": ["energy-supply", "gas-exchange"],
    "ch20.altitude-training": ["adaptation", "gas-exchange"],
    "ch20.hr-calculations": ["measurement", "normal-values"],
    "ch20.intensity-monitoring": ["measurement", "program-design"],
    "ch20.periodization": ["periodization"],
    "ch20.program-design": ["program-design"],
    "ch20.special-issues": ["program-design", "safety"],
    "ch20.training-types": ["program-design", "energy-supply"],
    # ---- ch21 週期化 ----
    "ch21.active-rest": ["periodization"],
    "ch21.competition-period": ["periodization"],
    "ch21.fitness-fatigue": ["periodization", "adaptation"],
    "ch21.gas-theory": ["periodization", "adaptation"],
    "ch21.periodization-hierarchy": ["periodization"],
    "ch21.periodization-models": ["periodization", "program-design"],
    "ch21.preparatory-period": ["periodization"],
    "ch21.sfra-theory": ["periodization", "adaptation"],
    # ---- ch22 復健與重建 ----
    "ch22.fibroblastic-phase": ["injury"],
    "ch22.inflammatory-phase": ["injury"],
    "ch22.injury-prevention": ["injury", "safety"],
    "ch22.injury-types": ["injury"],
    "ch22.kinetic-chain": ["injury", "technique"],
    "ch22.maturation-phase": ["injury"],
    "ch22.resistance-training-systems": ["injury", "program-design"],
    "ch22.sports-medicine-team": ["injury", "professional"],
    # ---- ch23 設施設計與配置 ----
    "ch23.design-elements": ["safety", "professional"],
    "ch23.environment": ["safety"],
    "ch23.four-phases": ["professional"],
    "ch23.key-numbers": ["safety", "normal-values"],
    "ch23.layout": ["safety"],
    "ch23.maintenance": ["safety", "professional"],
    "ch23.needs-analysis": ["professional", "program-design"],
    "ch23.safety-electrical": ["safety"],
    # ---- ch24 政策、程序與法律 ----
    "ch24.administration": ["professional"],
    "ch24.emergency": ["safety", "professional"],
    "ch24.ethics-records": ["professional"],
    "ch24.facility": ["professional", "safety"],
    "ch24.legal": ["professional"],
    "ch24.personnel": ["professional"],
    "ch24.screening": ["professional", "measurement"],
    "ch24.supervision": ["professional", "safety"],
}


def main():
    dry = "--dry" in sys.argv
    vocab = yaml.safe_load((DATA / "_concepts.yaml").read_text(encoding="utf-8"))

    bad = [k for v in TOPIC_CONCEPTS.values() for k in v if k not in vocab]
    if bad:
        print(f"映射用到詞彙表沒有的概念：{sorted(set(bad))}")
        return 1

    stamped = kept = renamed = 0
    missing_topics = []

    for path in sorted(DATA.glob("ch*.yaml")):
        raw = yaml.safe_load(path.read_text(encoding="utf-8"))
        changed = False

        for topic in raw["topics"]:
            key = f"{raw['id']}.{topic['id']}"
            mapped = TOPIC_CONCEPTS.get(key)
            if mapped is None:
                missing_topics.append(key)
                continue

            for item in topic["items"]:
                current = item.get("concepts") or []
                if current:
                    new = []
                    for c in current:
                        c = RENAME.get(c, c)
                        if c not in new:
                            new.append(c)
                    if new != current:
                        item["concepts"] = new
                        renamed += 1
                        changed = True
                    kept += 1
                else:
                    item["concepts"] = list(mapped)
                    stamped += 1
                    changed = True

        if changed and not dry:
            path.write_text(
                yaml.dump(raw, allow_unicode=True, sort_keys=False, width=1000),
                encoding="utf-8",
            )

    print(f"{'（試跑）' if dry else ''}新標 {stamped} 條，保留既有 {kept} 條，改名 {renamed} 條")
    if missing_topics:
        print(f"映射缺這些 topic（{len(missing_topics)}）：{', '.join(missing_topics)}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
