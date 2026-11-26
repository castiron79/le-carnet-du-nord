import http.client
import importlib.util
import json
import os
import shutil
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path


class NotesAndMetadataServerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.project = Path(__file__).resolve().parents[1]
        self.fixtures = self.project / "tests/fixtures/recipe-files"
        for env, name in (("CARNET_DATA_DIR", "data"), ("CARNET_RECIPES_DIR", "recipes"), ("CARNET_WEB_DIR", "web")):
            os.environ[env] = str(self.root / name)
        spec = importlib.util.spec_from_file_location("carnet_notes_meta_test", self.project / "home-assistant-addon/rootfs/app/server.py")
        self.app = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.app)
        self.app.ROOT.mkdir(parents=True, exist_ok=True)
        (self.app.ROOT / "index.html").write_text("ok", encoding="utf-8")

    def serve(self):
        class QuietHandler(self.app.Handler):
            def log_message(self, *args): pass
            def parse_request(self):
                self.client_address = ("172.30.32.2", self.client_address[1])
                return super().parse_request()
        server = ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        self.addCleanup(worker.join)
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        return server.server_port

    def request(self, port, method, path, headers=None, body=None):
        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
        try:
            conn.request(method, path, body=body, headers=headers or {})
            res = conn.getresponse()
            return res.status, json.loads(res.read())
        finally:
            conn.close()

    def test_parse_recipe_reads_active_minutes_allergens_storage_and_formatted_total(self):
        folder = self.app.RECIPES / "langkok"
        folder.mkdir(parents=True)
        shutil.copyfile(self.fixtures / "pixel.webp", folder / "hero.webp")
        (folder / "recipe.md").write_text("""---
schema_version: 1
id: langkok
slug: langkok
title: Långkokt gryta
restaurant_title: Daube du Nord
summary: Mustig gryta.
status: published
published_at: 2026-11-20
updated_at: 2026-11-20
servings: 4
prep_minutes: 20
cook_minutes: 180
active_minutes: 30
total_minutes: 200
protein_group: nöt- och blandfärs
carb_group: potatis
meal_type: lunch och middag
tags: [långkok, helg, Julia Child]
allergens: [selleri, senap]
hero_image: hero.webp
hero_alt: Mustig gryta
nutrition:
  basis: per portion
  kcal: 520
  protein_g: 42
  carbs_g: 30
  fat_g: 22
  fiber_g: 5
  method: Beräknat på råa vikter.
---

# Långkokt gryta

## Ingredienser
- 600 g högrev

## Gör så här
1. **Bryn.** Bryn köttet.

## Serveringstips
- Servera varmt.

## Varför det blir så gott
- Lång tid ger mört kött.

## Förvaring
Kyl snabbt och förvara i upp till 3 dagar.

## Allergener
Innehåller selleri och senap.
""", encoding="utf-8")
        parsed = self.app.parse_recipe(folder)
        self.assertEqual(parsed["active"], 30)
        self.assertEqual(parsed["totalMinutes"], 200)
        self.assertEqual(parsed["total"], "3 tim 20 min")
        self.assertEqual(parsed["protein"], "Nöt- och blandfärs")
        self.assertEqual(parsed["occasion"], "Lunch och middag")
        self.assertEqual(parsed["allergens"], ["selleri", "senap"])
        self.assertEqual(parsed["storage"], "Kyl snabbt och förvara i upp till 3 dagar.")
        self.assertEqual(parsed["nutritionMethod"], "Beräknat på råa vikter.")
        self.assertEqual(parsed["tags"], ["Långkok", "Helg", "Julia Child"])

    def test_note_create_resolve_reopen_and_logical_delete(self):
        port = self.serve()
        headers = {"Content-Type": "application/json", "X-Carnet-Request": "1"}
        status, created = self.request(
            port, "POST", "/api/notes", headers,
            json.dumps({"recipe_id": "tarte-tatin", "kind": "comment", "text": "Mindre socker nästa gång"})
        )
        self.assertEqual(status, 201)
        note_id = created["id"]
        self.assertEqual(created["status"], "open")

        _, state = self.request(port, "GET", "/api/state/tarte-tatin")
        self.assertEqual(len(state["notes"]), 1)
        self.assertEqual(state["notes"][0]["id"], note_id)
        self.assertEqual(state["notes"][0]["status"], "open")

        status, updated = self.request(
            port, "POST", "/api/notes/status", headers,
            json.dumps({"recipe_id": "tarte-tatin", "note_id": note_id, "status": "resolved"})
        )
        self.assertEqual((status, updated["status"]), (200, "resolved"))
        _, state = self.request(port, "GET", "/api/state/tarte-tatin")
        self.assertEqual(state["notes"][0]["status"], "resolved")

        status, deleted = self.request(
            port, "POST", "/api/notes/status", headers,
            json.dumps({"recipe_id": "tarte-tatin", "note_id": note_id, "status": "deleted"})
        )
        self.assertEqual((status, deleted["status"]), (200, "deleted"))
        _, state = self.request(port, "GET", "/api/state/tarte-tatin")
        self.assertEqual(state["notes"], [])

        # Logical delete keeps row in SQLite
        with self.app.connect() as db:
            row = db.execute("SELECT status FROM notes WHERE id=?", (note_id,)).fetchone()
            self.assertEqual(row["status"], "deleted")

        # Validation checks
        bad_status, _ = self.request(
            port, "POST", "/api/notes/status", headers,
            json.dumps({"recipe_id": "tarte-tatin", "note_id": note_id, "status": "invalid"})
        )
        self.assertEqual(bad_status, 400)
        missing_status, _ = self.request(
            port, "POST", "/api/notes/status", headers,
            json.dumps({"recipe_id": "tarte-tatin", "note_id": 999999, "status": "resolved"})
        )
        self.assertEqual(missing_status, 404)


if __name__ == "__main__":
    unittest.main()
