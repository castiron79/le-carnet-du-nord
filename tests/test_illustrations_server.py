import importlib.util
import json
import os
import shutil
import tempfile
import unittest
from pathlib import Path

class IllustrationsServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = tempfile.TemporaryDirectory()
        root = Path(cls.root.name)
        os.environ["CARNET_DATA_DIR"] = str(root / "data")
        os.environ["CARNET_RECIPES_DIR"] = str(root / "recipes")
        os.environ["CARNET_WEB_DIR"] = str(root / "web")
        path = Path(__file__).resolve().parents[1] / "home-assistant-addon/rootfs/app/server.py"
        spec = importlib.util.spec_from_file_location("carnet_server_for_test", path)
        cls.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.module)

    @classmethod
    def tearDownClass(cls):
        cls.root.cleanup()

    def setUp(self):
        self.recipe = Path(self.root.name) / "recipes" / "elk"
        if self.recipe.exists(): shutil.rmtree(self.recipe)
        self.recipe.mkdir(exist_ok=True)
        (self.recipe / "recipe.md").write_text("""---
id: elk
title: Älggryta
status: published
hero_image: hero.webp
---
## Ingredienser
### Gryta
- 100 g älgkött
## Gör så här
1. Bryn köttet i en gryta.
2. Sänk värmen och låt sjuda.
## Serveringstips
- Servera varmt.
## Varför det blir så gott
- Långsam tillagning.
## Förvaring
Förvara svalt.
""", encoding="utf-8")

    def test_legacy_recipe(self):
        self.assertEqual(len(self.module.parse_recipe(self.recipe)["steps"]), 2)

    def test_optional_timers_are_attached_to_the_correct_step(self):
        data = {"version": 1, "timers": [{"id":"sjud", "step":2, "seconds":120, "label":"Sjud"}]}
        (self.recipe / "timers.json").write_text(json.dumps(data), encoding="utf-8")
        result = self.module.parse_recipe(self.recipe)
        self.assertNotIn("timers", result["steps"][0])
        self.assertEqual(result["steps"][1]["timers"][0]["seconds"],120)

    def test_timer_manifest_invalid_values_are_rejected(self):
        timer = {"id":"sjud", "step":2, "seconds":120, "label":"Sjud"}
        invalid = [None, {"version":True,"timers":[]}, {"version":1,"timers":[timer,timer]}]
        invalid += [{"version":1,"timers":[dict(timer, **change)]} for change in [{"step":9},{"seconds":True},{"seconds":0},{"id":"../x"},{"note":None}]]
        for data in invalid:
            with self.subTest(data=data):
                (self.recipe / "timers.json").write_text(json.dumps(data),encoding="utf-8")
                with self.assertRaises(ValueError): self.module.parse_recipe(self.recipe)

    def test_two_images_on_one_step(self):
        pictures = [
            {"step": 1, "kind": "action", "file": "step-01-action-01.webp", "alt": "Kött i gryta", "caption": ""},
            {"step": 1, "kind": "result", "file": "step-01-result-02.webp", "alt": "Brynt kött", "caption": "Brun yta."},
        ]
        for p in pictures: (self.recipe / p["file"]).write_bytes(b"RIFF0000WEBP")
        (self.recipe / "illustrations.json").write_text(json.dumps({"version":1,"illustrations":pictures}), encoding="utf-8")
        result=self.module.parse_recipe(self.recipe)
        self.assertEqual(len(result["steps"][0]["illustrations"]), 2)
        self.assertFalse(result["steps"][1].get("illustrations"))

    def test_invalid_step_is_rejected(self):
        data = {"version":1,"illustrations":[{"step": 99,"kind":"action","file":"step-99-action-01.webp","alt":"A","caption":""}]}
        (self.recipe / "illustrations.json").write_text(json.dumps(data), encoding="utf-8")
        with self.assertRaises(ValueError): self.module.parse_recipe(self.recipe)

    def test_unsafe_path_is_rejected(self):
        data = {"version":1,"illustrations":[{"step":1,"kind":"action","file":"../x.webp","alt":"A","caption":""}]}
        (self.recipe / "illustrations.json").write_text(json.dumps(data), encoding="utf-8")
        with self.assertRaises(ValueError): self.module.parse_recipe(self.recipe)

if __name__ == "__main__":
    unittest.main()
