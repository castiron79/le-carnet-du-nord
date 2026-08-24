#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const baseline = path.resolve(process.argv[2] || "");
const candidate = path.resolve(process.argv[3] || "");
if (!process.argv[2] || !process.argv[3]) {
  console.error("Användning: verify-recipe-update.mjs <basmapp> <kandidatmapp>");
  process.exit(2);
}

function files(root, relative = "") {
  return readdirSync(path.join(root, relative), { withFileTypes: true })
    .flatMap((entry) => {
      const next = path.join(relative, entry.name);
      return entry.isDirectory() ? files(root, next) : [next.replaceAll("\\", "/")];
    })
    .sort();
}

function digest(root, file) {
  return createHash("sha256").update(readFileSync(path.join(root, file))).digest("hex");
}

function frontmatter(root) {
  const text = readFileSync(path.join(root, "recipe.md"), "utf8");
  const yaml = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] || "";
  return Object.fromEntries([...yaml.matchAll(/^([a-z_]+):\s*([^\n]+)$/gm)].map((match) => [match[1], match[2].trim().replace(/^['"]|['"]$/g, "")]));
}

for (const root of [baseline, candidate]) {
  if (!statSync(root).isDirectory()) throw new Error(`Inte en katalog: ${root}`);
}

if (path.basename(baseline) !== path.basename(candidate)) throw new Error("Katalognamnet får inte ändras");
const before = frontmatter(baseline);
const after = frontmatter(candidate);
for (const field of ["id", "slug", "schema_version", "published_at"]) {
  if (before[field] !== after[field]) throw new Error(`Låst fält ändrat: ${field}`);
}
if (before.status === "published" && after.status !== "published") throw new Error("Ett publicerat recept måste behålla status published");

const beforeFiles = files(baseline);
const afterFiles = files(candidate);
const removed = beforeFiles.filter((file) => !afterFiles.includes(file));
if (removed.length) throw new Error(`Filer saknas i kandidaten: ${removed.join(", ")}`);
const all = [...new Set([...beforeFiles, ...afterFiles])].sort();
const changed = all.filter((file) => !beforeFiles.includes(file) || digest(baseline, file) !== digest(candidate, file));
const manifest = {
  recipe_id: after.id,
  baseline_digest: createHash("sha256").update(beforeFiles.map((file) => `${file}:${digest(baseline, file)}`).join("\n")).digest("hex"),
  candidate_digest: createHash("sha256").update(afterFiles.map((file) => `${file}:${digest(candidate, file)}`).join("\n")).digest("hex"),
  changed_files: changed,
  files: Object.fromEntries(afterFiles.map((file) => [file, digest(candidate, file)])),
};
console.log(JSON.stringify(manifest, null, 2));

