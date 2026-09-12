"""Public boundary and file-level failure tests for the problem index."""
import copy
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import yaml
import sync_vortex as sync


def fixture():
    return {
        "domain": "instructional", "sub": "problems", "schema_version": 1,
        "categories": [{"key": "head", "name_zh": "頭部"}],
        "problems": [{
            "id": "prob.breast.test", "stroke": "breast", "category": "head",
            "title": "測試問題", "public": {"observable": "- 可見現象", "mechanism_summary": ""},
            "links": {k: [] for k in sync.PROBLEM_LINK_FIELDS},
            "cross_ref": "", "cross_ref_ids": [],
            "coverage_gap": ["no_mechanism", "no_intervention", "no_drill"],
        }],
    }


class PublicProjection(unittest.TestCase):
    def test_whitelist_and_public_collision(self):
        doc = fixture()
        doc["diagnostic"] = "SECRET"
        doc["categories"][0]["internal"] = "SECRET"
        doc["problems"][0].update(diagnostic={"decision": "SECRET"}, future_internal="SECRET")
        self.assertNotIn("SECRET", str(sync.problem_public_data(doc)))
        for field in ("id", "links", "diagnostic", "future_internal"):
            poisoned = copy.deepcopy(doc)
            poisoned["problems"][0]["public"][field] = "SECRET"
            with self.subTest(field=field), self.assertRaises(ValueError):
                sync.problem_public_data(poisoned)

    def test_malformed_duplicate_missing_and_gaps(self):
        documents = [None, {}, {**fixture(), "schema_version": True}]
        doc = fixture(); doc["problems"] *= 2; documents.append(doc)
        doc = fixture(); del doc["problems"][0]["title"]; documents.append(doc)
        doc = fixture(); doc["problems"][0]["links"]["internal"] = []; documents.append(doc)
        doc = fixture(); doc["problems"][0]["coverage_gap"] = []; documents.append(doc)
        doc = fixture(); doc["problems"][0]["public"]["observable"] = {}; documents.append(doc)
        for doc in documents:
            with self.subTest(doc=doc), self.assertRaises(ValueError):
                sync.problem_public_data(doc)

    def test_water_does_not_fill_land_gap(self):
        doc = fixture()
        doc["problems"][0]["links"]["water_interventions"] = ["movement.intervention.water.test"]
        result = sync.problem_public_data(doc)
        self.assertIn("no_intervention", result["problems"][0]["coverage_gap"])

    def test_real_full_source(self):
        doc = yaml.safe_load(sync.PROBLEMS_SRC.read_text(encoding="utf-8"))
        result = sync.problem_public_data(doc)
        self.assertEqual(len(result["problems"]), 73)
        self.assertEqual({r["id"] for r in doc["problems"]}, {r["id"] for r in result["problems"]})
        targets = sync.problem_source_targets()
        for entry in result["problems"]:
            for relation in sync.PROBLEM_LINK_FIELDS:
                self.assertLessEqual(set(entry["links"][relation]), targets[relation])
            self.assertLessEqual(set(entry["cross_ref_ids"]), targets["cross_ref_ids"])


class AtomicSync(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        root = Path(self.directory.name)
        self.src, self.dst = root / "source.yaml", root / "public.yaml"
        self.src.write_text(sync.dump_yaml(fixture()), encoding="utf-8")
        self.old = "previous: valid\n"
        self.dst.write_text(self.old, encoding="utf-8")
        patches = {"PROBLEMS_SRC": self.src, "PROBLEMS_DST": self.dst}
        patcher = patch.multiple(sync, **patches)
        patcher.start(); self.addCleanup(patcher.stop)

    def assert_preserved(self):
        self.assertEqual(self.dst.read_text(encoding="utf-8"), self.old)
        self.assertFalse(list(self.dst.parent.glob(".problems-*.tmp")))

    def test_truncated_input_keeps_previous(self):
        self.src.write_text("problems: [\n", encoding="utf-8")
        with self.assertRaises(yaml.YAMLError):
            sync.sync_problems(False)
        self.assert_preserved()

    def test_missing_source_compatibility(self):
        self.src.unlink()
        with self.assertRaises(ValueError):
            sync.sync_problems(False)
        self.assert_preserved()
        self.dst.unlink()
        sync.sync_problems(False)
        self.assertFalse(self.dst.exists())

    def test_interrupted_replace_keeps_previous_and_cleans_temp(self):
        with patch.object(Path, "replace", side_effect=OSError("interrupted")), self.assertRaises(OSError):
            sync.sync_problems(False)
        self.assert_preserved()

    def test_missing_exported_target_keeps_previous(self):
        doc = fixture()
        doc["problems"][0]["cross_ref_ids"] = ["breast.err7"]
        self.src.write_text(sync.dump_yaml(doc), encoding="utf-8")
        target = self.dst.parent / "errors.yaml"
        target.write_text("errors: []\n", encoding="utf-8")
        with patch.object(sync, "TEACHING_ERRORS_DST", target), self.assertRaises(ValueError):
            sync.sync_problems(False)
        self.assert_preserved()

    def test_first_dry_run_uses_source_without_outputs(self):
        doc = fixture()
        doc["problems"][0]["cross_ref_ids"] = ["breast.err7"]
        self.src.write_text(sync.dump_yaml(doc), encoding="utf-8")
        with patch.object(sync, "TEACHING_ERRORS_DST", self.dst.parent / "not-yet-written.yaml"):
            sync.sync_problems(True)
        self.assert_preserved()

    def test_invalid_source_target_rejected_in_dry_run(self):
        doc = fixture()
        doc["problems"][0]["cross_ref_ids"] = ["unknown"]
        self.src.write_text(sync.dump_yaml(doc), encoding="utf-8")
        with self.assertRaises(ValueError):
            sync.sync_problems(True)
        self.assert_preserved()

    def test_empty_and_partial_valid_replacement(self):
        sync.sync_problems(False)
        self.assertEqual(len(yaml.safe_load(self.dst.read_text(encoding="utf-8"))["problems"]), 1)
        doc = fixture(); doc["problems"] = []; doc["categories"] = []
        self.src.write_text(sync.dump_yaml(doc), encoding="utf-8")
        sync.sync_problems(False)
        self.assertEqual(yaml.safe_load(self.dst.read_text(encoding="utf-8"))["problems"], [])


if __name__ == "__main__":
    unittest.main()
