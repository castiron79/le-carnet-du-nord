import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("HA-paketet innehåller både mängdreferenser och illustrationsvyn", async () => {
  const folder = "home-assistant-addon/rootfs/app/www/assets/";
  const names = await readdir(new URL(folder, root));
  const scripts = (await Promise.all(names.filter(name => name.endsWith(".js")).map(name => read(folder + name)))).join("\n");
  assert.ok(scripts.includes("serveringskärl"), "Bygg om HA-paketet efter ändring av portionsvyn");
  assert.ok(scripts.includes("Visa alla illustrationer"), "HA-paketet saknar aktuell illustrationsvy");
});

test("startsidan har svepbara karuseller med 6/4/2-regeln och kombinerbar råvarusökning", async () => {
  const [page, css] = await Promise.all([read("app/page.tsx"), read("app/recipe-enhancements.css")]);
  assert.match(page, /recipes\.slice\(0,12\)/);
  assert.match(page, /label="De senaste recepten"/);
  assert.match(page, /label="Mina favoriter"/);
  assert.match(page, /protein==="Alla"\|\|r\.protein===protein/);
  assert.match(page, /carb==="Alla"\|\|r\.carb===carb/);
  assert.match(css, /grid-auto-columns: calc\(\(100% - 70px\) \/ 6\)/);
  assert.match(css, /max-width: 1100px[\s\S]*grid-auto-columns: calc\(\(100% - 42px\) \/ 4\)/);
  assert.match(css, /max-width: 720px[\s\S]*grid-auto-columns: calc\(\(100% - 14px\) \/ 2\)/);
});

test("receptvyn erbjuder betyg, kommentarer, portionsskalning och uppdateringsunderlag", async () => {
  const page = await read("app/page.tsx");
  assert.match(page, /\[1,2,3,4,5\]\.map/);
  assert.match(page, /Lägg till kommentar/);
  assert.doesNotMatch(page, /Anpassa mängder/);
  assert.match(page, /aria-label="Minska antal portioner"/);
  assert.match(page, /aria-label="Öka antal portioner"/);
  assert.match(page, /Kopiera för uppdatering/);
  assert.doesNotMatch(page, /Föreslå ändring/);
  assert.match(page, /X-Carnet-Request/);
});

test("Home Assistant-paketet använder Ingress-säkra relativa resurser och är litet", async () => {
  const assetsUrl = new URL("home-assistant-addon/rootfs/app/www/assets/", root);
  const [html, vite, assets] = await Promise.all([
    read("home-assistant-addon/rootfs/app/www/index.html"),
    read("static/vite.config.ts"),
    readdir(assetsUrl),
  ]);
  assert.doesNotMatch(html, /(?:src|href)="\/assets\//);
  assert.match(vite, /base:\s*"\.\/"/);
  const productionAssets = assets.filter((name) => /\.(?:js|css)$/.test(name));
  const sizes = await Promise.all(productionAssets.map((name) => stat(new URL(name, assetsUrl))));
  assert.ok(sizes.reduce((sum, file) => sum + file.size, 0) < 300_000, "JS och CSS ska tillsammans vara under 300 KB");
});

test("Home Assistant hämtar ny startsida efter varje appuppdatering", async () => {
  const server = await read("home-assistant-addon/rootfs/app/server.py");
  assert.match(server, /path in \("\/", "\/index\.html"\)/);
  assert.match(server, /Cache-Control", "no-store, max-age=0"/);
  assert.match(server, /path\.startswith\("\/assets\/"\)/);
  assert.match(server, /Cache-Control", "public, max-age=31536000, immutable"/);
});

test("synkroniserade receptbilder får revisionsmärkta URL:er", async () => {
  const server = await read("home-assistant-addon/rootfs/app/server.py");
  assert.match(server, /def synced_revision\(\):/);
  assert.match(server, /image = f"\{image\}\?v=\{revision\}"/);
  assert.match(server, /urlparse\(self\.path\)\.path/);
});

test("receptets faktarad och bildtoning följer den stabila layouten", async () => {
  const css = await read("app/recipe-enhancements.css");
  assert.match(css, /\.portionControls > button[\s\S]*width: 25px;[\s\S]*height: 25px;/);
  assert.match(css, /\.facts \.factIcon[\s\S]*width: 51px;[\s\S]*height: 51px;/);
  assert.match(css, /\.portionControls[\s\S]*justify-content: center;[\s\S]*width: 10ch;/);
  assert.match(css, /\.recipeTitle[\s\S]*linear-gradient\(90deg[\s\S]*rgba\(248,244,235,0\) 100%/);
  assert.match(css, /\.recipeTitle[\s\S]*grid-column: 1 \/ -1;[\s\S]*width: 82%;/);
  assert.match(css, /\.heroDish[\s\S]*inset: 0 0 0 28%;/);
});

test("Home Assistant tolkar varje instruktionsrad som exakt ett steg", async () => {
  const server = await read("home-assistant-addon/rootfs/app/server.py");
  assert.match(server, /block\("Gör så här", "Serveringstips"\)\.splitlines\(\)/);
  assert.match(server, /content\.partition\("\. "\)/);
});

test("startsidan visar nyast publicerade recept först", async () => {
  const [page, server] = await Promise.all([
    read("app/page.tsx"),
    read("home-assistant-addon/rootfs/app/server.py"),
  ]);
  assert.match(page, /\.sort\(newestFirst\)/);
  assert.match(server, /"publishedAt": str\(meta\.get\("published_at", ""\)\)/);
  assert.match(server, /return sorted\(result,/);
});

test("favoriter sparas centralt, kan filtreras och visas med hjärta", async () => {
  const [page, server, css] = await Promise.all([
    read("app/page.tsx"),
    read("home-assistant-addon/rootfs/app/server.py"),
    read("app/recipe-enhancements.css"),
  ]);
  assert.match(server, /CREATE TABLE IF NOT EXISTS favorites/);
  assert.match(server, /path == "\/api\/states"/);
  assert.match(server, /self\.path == "\/api\/favorites"/);
  assert.match(page, /SPARA SOM FAVORIT/);
  assert.match(page, /favoritesOnly/);
  assert.match(page, /archiveThumb/);
  assert.doesNotMatch(page, /archiveArrow/);
  assert.match(css, /\.rating > div \{ display: flex; flex-wrap: nowrap;/);
});

test("ordmärket återställer alltid vyn med de senaste recepten", async () => {
  const page = await read("app/page.tsx");
  assert.match(page, /function goHome\(\)\{selectRecipe\(null\);setShowAll\(false\)/);
  assert.match(page, /className="wordmark" onClick=\{goHome\}/);
});

