#!/usr/bin/env node
import { createHash } from "node:crypto";
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { basename, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const [sourceArg, repoArg = process.env.LE_CARNET_RECIPES_REPO, mode] = process.argv.slice(2);
if (!sourceArg || !repoArg) {
  console.error("Användning: publish-recipe.mjs <receptmapp> <lokal-repoklon> [--push]");
  process.exit(2);
}
const source = resolve(sourceArg);
const repo = resolve(repoArg);
const id = basename(source);
if (!existsSync(resolve(repo, ".git"))) throw new Error("Målet är inte en Git-klon");
const markdown = readFileSync(resolve(source, "recipe.md"), "utf8");
if (!/^status:\s*published\s*$/m.test(markdown)) throw new Error("Receptet måste vara manuellt godkänt och ha status published");
const run = (command, args, cwd = process.cwd()) => {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || `${command} misslyckades`).trim());
  return result.stdout.trim();
};
const git = (args) => run("git", ["-c", `safe.directory=${repo}`, ...args], repo);
const packageDigest = (root) => {
  const hash = createHash("sha256");
  const visit = (folder) => {
    for (const name of readdirSync(folder).sort()) {
      const item = resolve(folder, name);
      if (statSync(item).isDirectory()) visit(item);
      else {
        hash.update(relative(root, item).replaceAll("\\", "/"));
        hash.update("\0");
        hash.update(readFileSync(item));
      }
    }
  };
  visit(root);
  return hash.digest("hex");
};
const beforeValidation = packageDigest(source);
run("node", [resolve(import.meta.dirname, "validate-recipe.mjs"), source]);
const validatedDigest = packageDigest(source);
if (validatedDigest !== beforeValidation) throw new Error("Receptpaketet ändrades under valideringen");
const target = resolve(repo, "recipes", id);
rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
if (packageDigest(source) !== validatedDigest || packageDigest(target) !== validatedDigest) throw new Error("Receptpaketet ändrades efter valideringen; publicering avbruten");
git(["add", "--", `recipes/${id}`]);
const changed = git(["diff", "--cached", "--name-only", "--", `recipes/${id}`]);
if (!changed) {
  console.log("Inga ändringar att publicera.");
  process.exit(0);
}
git(["commit", "-m", `Publicera recept: ${id}`, "--", `recipes/${id}`]);
const revision = git(["rev-parse", "--short", "HEAD"]);
if (mode === "--push") git(["push"]);
console.log(`${mode === "--push" ? "Publicerat" : "Commit skapad"}: ${id} (${revision})`);

