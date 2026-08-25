import json
import mimetypes
import os
import re
import sqlite3
import shutil
import tempfile
import threading
import time
import urllib.error
import urllib.request
import zipfile
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(os.environ.get("CARNET_WEB_DIR", "/app/www"))
DATA = Path(os.environ.get("CARNET_DATA_DIR", "/data"))
DATA.mkdir(parents=True, exist_ok=True)
DB = DATA / "le-carnet.db"
RECIPE_ID = re.compile(r"[a-z0-9][a-z0-9-]{0,119}")
RECIPES = Path(os.environ.get("CARNET_RECIPES_DIR", "/config/recipes"))
RECIPES.mkdir(parents=True, exist_ok=True)
OPTIONS = DATA / "options.json"
SYNC_STATE = DATA / "github-sync.json"
SYNC_LOCK = threading.Lock()
sync_status = {"state": "idle", "message": "Inte synkroniserad ännu", "last_sync": None, "revision": None}


def read_options():
    try:
        return json.loads(OPTIONS.read_text(encoding="utf-8"))
    except (OSError, ValueError, json.JSONDecodeError):
        return {}


def github_request(url, token, accept="application/vnd.github+json"):
    headers = {"Accept": accept, "User-Agent": "le-carnet-du-nord/1.2", "X-GitHub-Api-Version": "2022-11-28"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return urllib.request.Request(url, headers=headers)


def scalar(value):
    value = value.strip()
    if value.startswith("[") and value.endswith("]"):
        return [x.strip() for x in value[1:-1].split(",") if x.strip()]
    if re.fullmatch(r"\d+(?:\.\d+)?", value):
        return float(value) if "." in value else int(value)
    return value.strip("\"'")


def parse_recipe(folder):
    source = (folder / "recipe.md").read_text(encoding="utf-8")
    parts = source.split("---", 2)
    if len(parts) < 3:
        return None
    meta, nested = {}, None
    for line in parts[1].splitlines():
        if not line.strip():
            continue
        if line.startswith("  ") and nested and ":" in line:
            key, value = line.strip().split(":", 1)
            meta[nested][key] = scalar(value)
        elif ":" in line:
            key, value = line.split(":", 1)
            key = key.strip()
            if value.strip():
                meta[key], nested = scalar(value), None
            else:
                meta[key], nested = {}, key
    if meta.get("status") not in ("published", "review"):
        return None
    body = parts[2]
    def block(name, following=None):
        end = rf"(?=\n## {re.escape(following)}|\Z)" if following else r"(?=\n## |\Z)"
        match = re.search(rf"## {re.escape(name)}\s*(.*?){end}", body, re.S | re.I)
        return match.group(1).strip() if match else ""
    ingredient_text = block("Ingredienser", "Gör så här")
    ingredients = []
    for heading, items in re.findall(r"###\s+([^\n]+)\n(.*?)(?=\n###|\Z)", ingredient_text, re.S):
        group_items = [x.strip() for x in re.findall(r"^-\s+(.+)$", items, re.M)]
        if group_items:
            ingredients.append({"heading": heading.strip(), "items": group_items})
    if not ingredients:
        flat_items = [x.strip() for x in re.findall(r"^-\s+(.+)$", ingredient_text, re.M)]
        if flat_items:
            ingredients.append({"heading": "Ingredienser", "items": flat_items})
    steps = []
    for line in block("Gör så här", "Serveringstips").splitlines():
        numbered = re.match(r"^\s*\d+\.\s+(.+?)\s*$", line)
        if not numbered:
            continue
        content = numbered.group(1)
        bold = re.match(r"^\*\*(.+?)\*\*\s*(.*)$", content)
        if bold:
            title, detail = bold.group(1).rstrip(". "), bold.group(2).strip()
        else:
            title, separator, detail = content.partition(". ")
            title, detail = title.rstrip(". "), detail.strip() if separator else ""
        detail = re.sub(r"^\d+\.\s+", "", detail)
        steps.append({"title": title, "items": [detail] if detail else []})
    def list_or_paragraphs(value):
        items = [x.strip() for x in re.findall(r"^-\s+(.+)$", value, re.M)]
        return items or [x.strip() for x in re.split(r"\n\s*\n", value) if x.strip()]
    tips = list_or_paragraphs(block("Serveringstips", "Varför det blir så gott"))
    why = list_or_paragraphs(block("Varför det blir så gott", "Förvaring"))
    nutrition = meta.get("nutrition", {})
    carb_group = str(meta.get("carb_group", "Övrigt"))
    if carb_group.lower() == "vetemjöl":
        carb_group = "bröd"
    return {"id": meta.get("id", folder.name), "title": str(meta.get("restaurant_title", meta.get("title", folder.name))).upper(), "subtitle": str(meta.get("subtitle", "RECETTE DE LA MAISON")).upper(), "swedishTitle": meta.get("title", folder.name), "description": meta.get("summary", ""), "publishedAt": str(meta.get("published_at", "")), "updatedAt": str(meta.get("updated_at", "")), "protein": str(meta.get("protein_group", "Övrigt")).title(), "carb": carb_group.title(), "category": meta.get("meal_type", "Middag"), "image": f"recipe-assets/{folder.name}/{meta.get('hero_image', 'hero.webp')}", "prep": meta.get("prep_minutes", 0), "active": meta.get("cook_minutes", 0), "total": f"{meta.get('total_minutes', 0)} min", "servings": meta.get("servings", 1), "occasion": meta.get("meal_type", "Middag"), "macros": {"kcal": nutrition.get("kcal", 0), "protein": nutrition.get("protein_g", 0), "carbs": nutrition.get("carbs_g", 0), "fat": nutrition.get("fat_g", 0), "fiber": nutrition.get("fiber_g", 0)}, "ingredients": ingredients, "steps": steps, "tips": tips, "why": why}


def load_recipes():
    result = []
    for folder in sorted((x for x in RECIPES.iterdir() if x.is_dir()), key=lambda x: x.name):
        try:
            parsed = parse_recipe(folder)
            if parsed:
                result.append(parsed)
        except (OSError, UnicodeError, ValueError):
            continue
    return sorted(result, key=lambda recipe: (recipe.get("publishedAt") or recipe.get("updatedAt") or "", recipe.get("swedishTitle", "")), reverse=True)


def recipe_folders(root):
    return sorted({p.parent for p in root.rglob("recipe.md") if ".git" not in p.parts}, key=lambda p: p.name)


def install_synced_recipes(source_root, revision):
    incoming = recipe_folders(source_root)
    if not incoming:
        raise ValueError("GitHub-arkivet innehåller inga recept")
    names = []
    for folder in incoming:
        if not RECIPE_ID.fullmatch(folder.name) or parse_recipe(folder) is None:
            raise ValueError(f"Ogiltigt receptpaket: {folder.name}")
        hero = folder / "hero.webp"
        if not hero.is_file() or hero.stat().st_size > 12_000_000:
            raise ValueError(f"Saknad eller för stor hero.webp: {folder.name}")
        names.append(folder.name)
    old = {}
    try:
        old = json.loads(SYNC_STATE.read_text(encoding="utf-8"))
    except (OSError, ValueError, json.JSONDecodeError):
        pass
    with tempfile.TemporaryDirectory(dir=RECIPES, prefix=".sync-") as stage_name:
        stage = Path(stage_name)
        for folder in incoming:
            shutil.copytree(folder, stage / folder.name)
        for name in names:
            target, backup = RECIPES / name, RECIPES / f".{name}.previous"
            if backup.exists():
                shutil.rmtree(backup)
            if target.exists():
                target.rename(backup)
            try:
                (stage / name).rename(target)
                if backup.exists():
                    shutil.rmtree(backup)
            except Exception:
                if target.exists():
                    shutil.rmtree(target)
                if backup.exists():
                    backup.rename(target)
                raise
        for stale in set(old.get("managed", [])) - set(names):
            target = RECIPES / stale
            if target.exists() and RECIPE_ID.fullmatch(stale):
                shutil.rmtree(target)
    SYNC_STATE.write_text(json.dumps({"revision": revision, "managed": names}, ensure_ascii=False), encoding="utf-8")
    return len(names)


def sync_from_github(force=False):
    global sync_status
    if not SYNC_LOCK.acquire(blocking=False):
        return sync_status
    try:
        opts = read_options()
        owner = str(opts.get("github_owner", "")).strip()
        repo = str(opts.get("github_repository", "")).strip()
        branch = str(opts.get("github_branch", "main")).strip() or "main"
        token = str(opts.get("github_token", "")).strip()
        if not owner or not repo or not token:
            sync_status = {**sync_status, "state": "unconfigured", "message": "GitHub-anslutningen är inte färdigkonfigurerad"}
            return sync_status
        commit_url = f"https://api.github.com/repos/{owner}/{repo}/commits/{branch}"
        with urllib.request.urlopen(github_request(commit_url, token), timeout=20) as response:
            revision = json.loads(response.read(2_000_000))["sha"]
        previous = None
        try:
            previous = json.loads(SYNC_STATE.read_text(encoding="utf-8")).get("revision")
        except (OSError, ValueError, json.JSONDecodeError):
            pass
        if previous == revision and not force:
            sync_status = {"state": "current", "message": "Alla recept är aktuella", "last_sync": datetime.now(timezone.utc).isoformat(timespec="seconds"), "revision": revision[:7]}
            return sync_status
        archive_url = f"https://api.github.com/repos/{owner}/{repo}/zipball/{revision}"
        with urllib.request.urlopen(github_request(archive_url, token), timeout=60) as response:
            payload = response.read(100_000_001)
        if len(payload) > 100_000_000:
            raise ValueError("Receptarkivet är större än 100 MB")
        with tempfile.TemporaryDirectory(dir=DATA, prefix="github-") as temp_name:
            temp = Path(temp_name)
            archive = temp / "recipes.zip"
            archive.write_bytes(payload)
            extract = temp / "extract"
            extract.mkdir()
            with zipfile.ZipFile(archive) as bundle:
                total = 0
                for member in bundle.infolist():
                    relative = Path(member.filename)
                    if relative.is_absolute() or ".." in relative.parts:
                        raise ValueError("GitHub-arkivet innehåller en osäker sökväg")
                    total += member.file_size
                    if total > 200_000_000:
                        raise ValueError("Uppackat receptarkiv är för stort")
                    bundle.extract(member, extract)
            count = install_synced_recipes(extract, revision)
        sync_status = {"state": "current", "message": f"{count} recept synkroniserade", "last_sync": datetime.now(timezone.utc).isoformat(timespec="seconds"), "revision": revision[:7]}
    except (OSError, ValueError, KeyError, urllib.error.URLError, zipfile.BadZipFile) as exc:
        sync_status = {**sync_status, "state": "error", "message": f"Synkronisering misslyckades: {exc}"}
    finally:
        SYNC_LOCK.release()
    return sync_status


def sync_loop():
    time.sleep(8)
    while True:
        sync_from_github()
        minutes = max(5, min(1440, int(read_options().get("sync_minutes", 15))))
        time.sleep(minutes * 60)


def connect():
    db = sqlite3.connect(DB, timeout=10)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("PRAGMA synchronous=NORMAL")
    db.execute("CREATE TABLE IF NOT EXISTS ratings (recipe_id TEXT PRIMARY KEY, rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), updated_at TEXT NOT NULL)")
    db.execute("CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('comment','change')), text TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL)")
    db.execute("CREATE INDEX IF NOT EXISTS idx_notes_recipe_id ON notes(recipe_id, created_at)")
    db.commit()
    return db


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        print("carnet:", fmt % args)

    def end_headers(self):
        path = urlparse(self.path).path
        if path in ("/", "/index.html"):
            self.send_header("Cache-Control", "no-store, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        elif path.startswith("/assets/"):
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        self.send_header("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'self'")
        super().end_headers()

    def send_json(self, value, status=200):
        body = json.dumps(value, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/recipes":
            return self.send_json(load_recipes())
        if path == "/api/sync":
            return self.send_json(sync_status)
        if path.startswith("/recipe-assets/"):
            relative = Path(path.removeprefix("/recipe-assets/"))
            target = (RECIPES / relative).resolve()
            if RECIPES.resolve() not in target.parents or not target.is_file():
                return self.send_error(404)
            data = target.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", mimetypes.guess_type(target.name)[0] or "application/octet-stream")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "public, max-age=86400")
            self.end_headers()
            return self.wfile.write(data)
        if path.startswith("/api/state/"):
            recipe_id = path.removeprefix("/api/state/")
            if not RECIPE_ID.fullmatch(recipe_id):
                return self.send_json({"error": "Ogiltigt recept-id"}, 400)
            with connect() as db:
                row = db.execute("SELECT rating FROM ratings WHERE recipe_id=?", (recipe_id,)).fetchone()
                rows = db.execute("SELECT kind,text,created_at FROM notes WHERE recipe_id=? ORDER BY id", (recipe_id,)).fetchall()
            notes = [{"text": (("Ändringsförslag: " if x["kind"] == "change" else "") + x["text"]), "date": x["created_at"][:10]} for x in rows]
            return self.send_json({"rating": row["rating"] if row else 0, "notes": notes})
        if path == "/health":
            return self.send_json({"status": "ok"})
        if path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        if self.headers.get("X-Carnet-Request") != "1":
            return self.send_json({"error": "Ogiltig begäran"}, 403)
        try:
            if self.path == "/api/sync":
                result = sync_from_github(force=True)
                return self.send_json(result, 200 if result.get("state") != "error" else 502)
            if self.headers.get_content_type() != "application/json":
                return self.send_json({"error": "Endast JSON accepteras"}, 415)
            length = int(self.headers.get("Content-Length", "0"))
            if length < 2 or length > 20000:
                return self.send_json({"error": "Ogiltig storlek"}, 413)
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError("JSON-objekt krävs")
            recipe_id = str(data.get("recipe_id", ""))
            if not RECIPE_ID.fullmatch(recipe_id):
                raise ValueError("Ogiltigt recept-id")
            now = datetime.now(timezone.utc).isoformat(timespec="seconds")
            with connect() as db:
                if self.path == "/api/ratings":
                    rating = int(data.get("rating", 0))
                    if rating not in range(1, 6):
                        raise ValueError("Betyg måste vara 1–5")
                    db.execute("INSERT INTO ratings(recipe_id,rating,updated_at) VALUES(?,?,?) ON CONFLICT(recipe_id) DO UPDATE SET rating=excluded.rating,updated_at=excluded.updated_at", (recipe_id, rating, now))
                elif self.path == "/api/notes":
                    kind = str(data.get("kind", ""))
                    text = str(data.get("text", "")).strip()
                    if kind not in ("comment", "change") or not text or len(text) > 8000:
                        raise ValueError("Ogiltig anteckning")
                    count = db.execute("SELECT COUNT(*) FROM notes WHERE recipe_id=?", (recipe_id,)).fetchone()[0]
                    if count >= 1000:
                        return self.send_json({"error": "För många anteckningar för receptet"}, 409)
                    db.execute("INSERT INTO notes(recipe_id,kind,text,created_at) VALUES(?,?,?,?)", (recipe_id, kind, text, now))
                else:
                    return self.send_json({"error": "Saknas"}, 404)
                db.commit()
            return self.send_json({"ok": True}, 201)
        except (ValueError, TypeError, json.JSONDecodeError) as exc:
            return self.send_json({"error": str(exc)}, 400)


if __name__ == "__main__":
    connect().close()
    threading.Thread(target=sync_loop, daemon=True).start()
    ThreadingHTTPServer(("0.0.0.0", 8099), Handler).serve_forever()

