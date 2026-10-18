import hashlib
import importlib.util
import json
import os
import shutil
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path


class RecipeFileServerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.project = Path(__file__).resolve().parents[1]
        self.fixtures = self.project / "tests/fixtures/recipe-files"
        for env, name in (("CARNET_DATA_DIR", "data"), ("CARNET_RECIPES_DIR", "recipes"), ("CARNET_WEB_DIR", "web")):
            os.environ[env] = str(self.root / name)
        spec = importlib.util.spec_from_file_location("carnet_file_test", self.project / "home-assistant-addon/rootfs/app/server.py")
        self.app = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.app)
        self.incoming = self.root / "incoming"
        self.incoming.mkdir()

    def package(self, name="scones", hero="hero.webp"):
        folder = self.incoming / name
        folder.mkdir()
        text = (self.fixtures / "recipe-template.md").read_text(encoding="utf-8")
        text = text.replace("hero.webp", hero)
        text = text.replace("status: draft", "status: published").replace("id: poulet-du-nord-med-pasta", f"id: {name}").replace("slug: poulet-du-nord-med-pasta", f"slug: {name}")
        (folder / "recipe.md").write_text(text, encoding="utf-8")
        shutil.copyfile(self.fixtures / ("pixel.avif" if hero.endswith("avif") else "pixel.webp"), folder / hero)
        # Runtime deliberately keeps legacy packages without timer/quantity files.
        return folder

    def snapshot(self):
        paths = [p for p in self.app.RECIPES.rglob("*") if p.is_file()]
        values = {str(p.relative_to(self.app.RECIPES)): hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
        values["revision"] = self.app.SYNC_STATE.read_bytes() if self.app.SYNC_STATE.exists() else None
        return values

    def test_imports_webp_and_avif_with_legacy_optional_manifests(self):
        self.package("one")
        self.package("two", "hero.avif")
        self.assertEqual(self.app.install_synced_recipes(self.incoming, "a" * 40), 2)
        self.assertTrue((self.app.RECIPES / "two/hero.avif").is_file())

    def test_rejected_import_preserves_all_existing_files_and_revision(self):
        first = self.package("first")
        self.package("second")
        self.app.install_synced_recipes(self.incoming, "a" * 40)
        baseline = self.snapshot()
        with (first / "recipe.md").open("a", encoding="utf-8") as stream:
            stream.write("\nNew candidate text\n")
        (self.incoming / "second/extra.js").write_text("// harmless test", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Otillåten"):
            self.app.install_synced_recipes(self.incoming, "b" * 40)
        self.assertEqual(self.snapshot(), baseline)

    def test_rejects_extra_files_directories_and_second_hero(self):
        folder = self.package()
        for name in ("extra.html", "extra.js", "image.svg", "draft.md", "extra.json", "image.png", "hero.avif"):
            with self.subTest(name=name):
                (folder / name).write_text("test", encoding="utf-8")
                with self.assertRaises(ValueError): self.app.validate_recipe_files(folder)
                (folder / name).unlink()
        (folder / "nested").mkdir()
        with self.assertRaises(ValueError): self.app.validate_recipe_files(folder)

    def test_rejects_missing_unreferenced_and_falsely_named_images(self):
        folder = self.package()
        image = folder / "step-01-action-01.webp"
        shutil.copyfile(self.fixtures / "pixel.webp", image)
        with self.assertRaisesRegex(ValueError, "orefererad"): self.app.validate_recipe_files(folder)
        self.illustration(folder)
        self.assertIn(image.name, self.app.validate_recipe_files(folder))
        image.unlink()
        with self.assertRaisesRegex(ValueError, "saknas"): self.app.validate_recipe_files(folder)
        image.write_bytes(b"<html>not an image</html>")
        with self.assertRaisesRegex(ValueError, "Bildformatet"): self.app.validate_recipe_files(folder)

    def test_rejects_symbolic_links(self):
        folder = self.package()
        link = folder / "link"
        if os.name == "nt":
            import subprocess
            subprocess.run(["cmd", "/c", "mklink", "/J", str(link), str(self.incoming)], check=True, capture_output=True)
        else:
            link.symlink_to(self.incoming, target_is_directory=True)
        try:
            with self.assertRaises(ValueError): self.app.validate_recipe_files(folder)
        finally:
            if os.name == "nt": link.rmdir()
            else: link.unlink()

    def test_rejects_invalid_utf8_json_and_hero_paths(self):
        folder = self.package()
        (folder / "quantities.json").write_bytes(b"\xff")
        with self.assertRaises(ValueError): self.app.validate_recipe_files(folder)
        (folder / "quantities.json").write_text("{", encoding="utf-8")
        with self.assertRaises(ValueError): self.app.validate_recipe_files(folder)
        (folder / "quantities.json").unlink()
        text = (folder / "recipe.md").read_text(encoding="utf-8")
        (folder / "recipe.md").write_text(text.replace("hero.webp", "../hero.webp"), encoding="utf-8")
        with self.assertRaises(ValueError): self.app.validate_recipe_files(folder)

    def illustration(self, folder, extension="webp"):
        name = f"step-01-action-01.{extension}"
        shutil.copyfile(self.fixtures / f"pixel.{extension}", folder / name)
        document = {"version": 1, "illustrations": [{"step": 1, "kind": "action", "file": name, "alt": "Test", "caption": ""}]}
        (folder / "illustrations.json").write_text(json.dumps(document), encoding="utf-8")
        return name

    def test_http_serves_only_declared_images_and_blocks_data_and_unsafe_paths(self):
        folder = self.package()
        image = self.illustration(folder, "avif")
        self.package("avif-hero", "hero.avif")
        self.app.install_synced_recipes(self.incoming, "a" * 40)
        class QuietHandler(self.app.Handler):
            def log_message(self, *args): pass
        server = ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        try:
            base = f"http://127.0.0.1:{server.server_port}/recipe-assets/"
            for name, kind in (("hero.webp", "image/webp"), (image, "image/avif")):
                with urllib.request.urlopen(base + "scones/" + name + "?v=abc", timeout=5) as response:
                    self.assertEqual(response.status, 200)
                    self.assertEqual(response.headers["Content-Type"], kind)
                    self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")
            with urllib.request.urlopen(base + "avif-hero/hero.avif", timeout=5) as response:
                self.assertEqual(response.headers["Content-Type"], "image/avif")
            for path in ("scones/recipe.md", "scones/illustrations.json", "scones/timers.json", "scones/extra.js", "scones/hero.avif", "../data/options.json", "scones/../scones/hero.webp", "scones/%2e%2e/hero.webp"):
                with self.subTest(path=path):
                    with self.assertRaises(urllib.error.HTTPError) as error:
                        urllib.request.urlopen(base + path, timeout=5)
                    self.assertEqual(error.exception.code, 404)
            # A local extra active file is blocked even without going through import.
            (self.app.RECIPES / "scones/extra.html").write_text("<p>test</p>", encoding="utf-8")
            with self.assertRaises(urllib.error.HTTPError) as error:
                urllib.request.urlopen(base + "scones/extra.html", timeout=5)
            self.assertEqual(error.exception.code, 404)
        finally:
            server.shutdown(); server.server_close(); worker.join()


if __name__ == "__main__": unittest.main()
