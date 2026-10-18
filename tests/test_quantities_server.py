import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest


class QuantitiesServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = tempfile.TemporaryDirectory()
        root = Path(cls.root.name)
        cls.previous = {key: os.environ.get(key) for key in ("CARNET_DATA_DIR", "CARNET_RECIPES_DIR", "CARNET_WEB_DIR")}
        for key, folder in zip(cls.previous, ("data", "recipes", "web")):
            os.environ[key] = str(root / folder)
        spec = importlib.util.spec_from_file_location("quantities_server_test", Path(__file__).resolve().parents[1] / "home-assistant-addon/rootfs/app/server.py")
        cls.server = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.server)

    @classmethod
    def tearDownClass(cls):
        for key, value in cls.previous.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value
        cls.root.cleanup()

    def setUp(self):
        self.folder = Path(self.root.name) / "recipes" / "soup"
        self.folder.mkdir(exist_ok=True)
        self.text = """---
id: soup
title: Soppa
status: published
servings: 2
nutrition:
  kcal: 200
---
## Ingredienser
### Soppa
- {{q:water}}
## Gör så här
1. **Tillsätt {{q:water:amount}}.** Häll i {{q:water}}. Koka i 20 minuter.
2. Fördela i två skålar.
## Serveringstips
- Servera varm.
## Varför det blir så gott
- Långsam tillagning.
## Förvaring
Förvara svalt.
"""
        self.manifest = {"version": 1, "quantities": [{"id": "water", "amount": 6.5, "unit": "dl", "name": "vatten"}]}

    def parse(self, manifest=True, text=None):
        (self.folder / "recipe.md").write_text(text or self.text, encoding="utf8")
        path = self.folder / "quantities.json"
        if manifest:
            path.write_text(json.dumps(self.manifest), encoding="utf8")
        elif path.exists():
            path.unlink()
        return self.server.parse_recipe(self.folder)

    def test_api_model_keeps_shared_data_templates_macros_and_step_numbers(self):
        recipe = self.parse()
        self.assertEqual(recipe["quantities"], self.manifest)
        self.assertEqual(recipe["servings"], 2)
        self.assertEqual(recipe["macros"]["kcal"], 200)
        self.assertEqual(recipe["steps"][0]["title"], "Tillsätt {{q:water:amount}}")
        self.assertIn("20 minuter", recipe["steps"][0]["items"][0])
        self.assertEqual(recipe["steps"][1]["title"], "Fördela i två skålar")

    def test_legacy_recipe_is_unchanged(self):
        recipe = self.parse(False, self.text.replace("{{q:water:amount}}", "6,5 dl").replace("{{q:water}}", "6,5 dl vatten"))
        self.assertNotIn("quantities", recipe)

    def test_missing_manifest_and_unknown_or_malformed_references(self):
        with self.assertRaises(ValueError):
            self.parse(False)
        for reference in ("{{q:unknown}}", "{{q:water*0}}", "{{q:water*2}}", "{{q:water:typo}}", "{{q:water"):
            with self.subTest(reference=reference), self.assertRaises(ValueError):
                self.parse(text=self.text.replace("Häll i {{q:water}}", "Häll i " + reference))

    def test_bad_manifest_values_and_duplicate_ids_are_rejected(self):
        for amount in (0, -1, True, None, [], [2, 1], [1, 2, 3]):
            self.manifest["quantities"][0]["amount"] = amount
            with self.subTest(amount=amount), self.assertRaises(ValueError):
                self.parse()
        self.manifest["quantities"][0]["amount"] = 6.5
        self.manifest["quantities"].append(dict(self.manifest["quantities"][0]))
        with self.assertRaises(ValueError):
            self.parse()

    def test_references_outside_rendered_fields_and_mixed_ingredient_formats_are_rejected(self):
        for text in (
            self.text.replace("### Soppa", "### {{q:water}}"),
            self.text.replace("- Servera varm.", "- Servera {{q:water}}."),
            self.text.replace("title: Soppa", "title: {{q:water}}"),
            self.text.replace("- {{q:water}}", "- {{q:water}}\n- 20 g smör"),
        ):
            with self.subTest(text=text), self.assertRaises(ValueError):
                self.parse(text=text)

    def test_invalid_package_cannot_replace_synced_recipes(self):
        self.parse(False, self.text.replace("{{q:water:amount}}", "6,5 dl").replace("{{q:water}}", "6,5 dl vatten"))
        original = (self.folder / "recipe.md").read_bytes()
        incoming = Path(self.root.name) / "incoming" / "soup"
        incoming.mkdir(parents=True, exist_ok=True)
        (incoming / "recipe.md").write_text(self.text, encoding="utf8")
        with self.assertRaises(ValueError):
            self.server.install_synced_recipes(incoming.parent, "a" * 40)
        self.assertEqual((self.folder / "recipe.md").read_bytes(), original)
