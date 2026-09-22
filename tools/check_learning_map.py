"""Validate learning routes against the canonical reader index (not semantic truth)."""
from __future__ import annotations

import argparse
import copy
import json
import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
DATA = SITE / "data/reading/learning-map.json"
INDEX = SITE / "data/reading/index.json"
REPORT = SITE / "research/learning-map-2026-09-22/validation.json"
ID = re.compile(r"[a-z][a-z0-9-]{0,63}\Z")


def validate(data, index):
    errors = []

    def need(test, message):
        if not test:
            errors.append(message)
        return bool(test)

    def text(value):
        return isinstance(value, str) and bool(value.strip()) and len(value) <= 4000 and "\x00" not in value

    if not need(isinstance(data, dict), "Map must be an object"):
        return errors
    need(type(data.get("schema")) is int and data.get("schema") == 1, "Unsupported map schema")
    need(data.get("provenance") == "editorial-learning-route", "Missing editorial provenance")
    stations, routes = data.get("stations"), data.get("routes")
    if not need(isinstance(stations, list) and 0 < len(stations) <= 200, "Need 1–200 stations"):
        return errors
    if not need(isinstance(routes, list) and 0 < len(routes) <= 20, "Need 1–20 routes"):
        return errors
    if not need(all(isinstance(s, dict) for s in stations + routes), "Stations/routes must be objects"):
        return errors
    units = {u["id"]: u for u in index["units"]}
    sections = {s["id"]: u["id"] for u in index["units"] for s in u["sections"]}
    ids = [s.get("id") for s in stations]
    route_ids = [r.get("id") for r in routes]
    if not need(all(isinstance(s, str) and ID.fullmatch(s) for s in ids + route_ids), "Invalid station/route ID"):
        return errors
    need(len(set(ids)) == len(ids), "Duplicate station ID")
    need(len(set(route_ids)) == len(route_ids), "Duplicate route ID")
    ranks = {sid: i for i, sid in enumerate(ids)}
    covered = set()
    need(isinstance(data.get("start"), str) and data.get("start") in ranks, "Missing starting station")
    for i, station in enumerate(stations):
        sid = station["id"]
        for field in ("title", "question", "task", "recall", "answer", "advance"):
            need(text(station.get(field)), f"{sid}: empty/invalid {field}")
        prerequisites = station.get("prerequisites")
        if need(isinstance(prerequisites, list) and all(isinstance(p, str) for p in prerequisites), f"{sid}: invalid prerequisites"):
            need(len(prerequisites) == len(set(prerequisites)), f"{sid}: duplicate prerequisites")
            for p in prerequisites:
                need(p in ranks and ranks[p] < i, f"{sid}: missing, cyclic or out-of-order prerequisite {p}")
            if sid == data.get("start"):
                need(not prerequisites, "Starting station cannot require another station")
        readings = station.get("readings")
        refs = []
        if need(isinstance(readings, list) and 2 <= len(readings) <= 4, f"{sid}: need 2–4 readings"):
            for reading in readings:
                if not need(isinstance(reading, dict), f"{sid}: invalid reading"):
                    continue
                ref = reading.get("section")
                if need(isinstance(ref, str) and ref in sections, f"{sid}: missing section {ref}"):
                    covered.add(sections[ref])
                    refs.append(ref)
                need(text(reading.get("purpose")), f"{sid}: reading has no purpose")
        need(len(refs) == len(set(refs)), f"{sid}: duplicate reading")
        sources = station.get("answer_sources")
        if need(isinstance(sources, list) and bool(sources) and all(isinstance(s, str) for s in sources), f"{sid}: invalid answer sources"):
            need(len(sources) == len(set(sources)), f"{sid}: duplicate answer sources")
            need(all(s in refs for s in sources), f"{sid}: answer source outside assigned readings")
    need(covered == set(units), f"Chapter coverage mismatch: {sorted(set(units) - covered)}")
    assigned = []
    next_routes = {}
    for route in routes:
        rid = route["id"]
        for field in ("title", "role", "description"):
            need(text(route.get(field)), f"{rid}: empty/invalid {field}")
        stops = route.get("stations")
        if need(isinstance(stops, list) and bool(stops) and all(isinstance(s, str) for s in stops), f"{rid}: empty/invalid route"):
            need(all(s in ranks for s in stops), f"{rid}: unknown station")
            assigned.extend(stops)
            if all(s in ranks for s in stops):
                need([ranks[s] for s in stops] == sorted(ranks[s] for s in stops), f"{rid}: route reverses learning order")
        nxt = route.get("next_route")
        if need(isinstance(nxt, str) and (not nxt or nxt in route_ids), f"{rid}: invalid next route"):
            next_routes[rid] = nxt
    need(sorted(assigned) == sorted(ids), "Each station must belong to exactly one route")
    first = routes[0].get("stations")
    need(isinstance(first, list) and first[:1] == [data.get("start")], "First route must begin at start")
    for rid in next_routes:
        seen = set()
        current = rid
        while current:
            if current in seen:
                need(False, f"Cyclic route continuation at {current}")
                break
            seen.add(current)
            current = next_routes.get(current, "")
    return errors


def negative_checks(data, index):
    cases = []

    def reject(name, change):
        invalid = copy.deepcopy(data)
        change(invalid)
        cases.append({"name": name, "passed": bool(validate(invalid, index))})

    reject("empty stations", lambda d: d.update(stations=[]))
    reject("empty routes", lambda d: d.update(routes=[]))
    reject("partial station", lambda d: d["stations"][0].pop("task"))
    reject("missing anchor", lambda d: d["stations"][0]["readings"][0].update(section="neumann.ch01.missing"))
    reject("wrong field type", lambda d: d["stations"][0].update(readings="invalid"))
    reject("malformed route member", lambda d: d["routes"][0].update(stations=[{}]))
    reject("null route members", lambda d: d["routes"][0].update(stations=None))
    reject("unknown route station", lambda d: d["routes"][0]["stations"].append("unknown"))
    reject("duplicate station", lambda d: d["stations"].append(copy.deepcopy(d["stations"][0])))
    reject("self prerequisite", lambda d: d["stations"][0].update(prerequisites=[d["stations"][0]["id"]]))
    reject("missing prerequisite", lambda d: d["stations"][1].update(prerequisites=["absent"]))
    reject("route continuation cycle", lambda d: d["routes"][1].update(next_route=d["routes"][0]["id"]))
    reject("unsafe ID", lambda d: d["stations"][0].update(id='../<script>'))
    reject("answer outside reading", lambda d: d["stations"][0].update(answer_sources=["nordin.ch16.wear"]))
    reject("oversized station list", lambda d: d.update(stations=d["stations"] * 20))
    reject("too many readings", lambda d: d["stations"][0]["readings"].extend(d["stations"][0]["readings"]))
    reject("new unsupported schema", lambda d: d.update(schema=2))
    return cases


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=DATA)
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    try:
        data = json.loads(args.data.read_text(encoding="utf-8"))
        index = json.loads(INDEX.read_text(encoding="utf-8"))
    except (OSError, ValueError, UnicodeError) as error:
        print(json.dumps({"errors": [f"Cannot read learning data: {error}"]}, ensure_ascii=False))
        return 1
    errors = validate(data, index)
    result = {"errors": errors, "semantic_limit": "Structure and traceability only; editorial prompts require human source review."}
    if not errors:
        refs = {r["section"] for s in data["stations"] for r in s["readings"]}
        result.update(routes=len(data["routes"]), stations=len(data["stations"]), chapters=len({r.rsplit('.', 1)[0] for r in refs}), reading_links=sum(len(s["readings"]) for s in data["stations"]))
        if args.self_test:
            result["negative_cases"] = negative_checks(data, index)
            errors.extend(c["name"] for c in result["negative_cases"] if not c["passed"])
    output = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(output, encoding="utf-8")
    print(output)
    return bool(errors)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    raise SystemExit(main())
