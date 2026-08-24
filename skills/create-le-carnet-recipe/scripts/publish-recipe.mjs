#!/usr/bin/env node
import { cpSync, existsSync, readFileSync, rmSync } from "node:fs";
import { basename, resolve } from "node:path";
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
run("node", [resolve(import.meta.dirname, "validate-recipe.mjs"), source]);
const target = resolve(repo, "recipes", id);
rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
run("git", ["add", "--", `recipes/${id}`], repo);
const changed = run("git", ["diff", "--cached", "--name-only", "--", `recipes/${id}`], repo);
if (!changed) {
  console.log("Inga ändringar att publicera.");
  process.exit(0);
}
run("git", ["commit", "-m", `Publicera recept: ${id}`, "--", `recipes/${id}`], repo);
const revision = run("git", ["rev-parse", "--short", "HEAD"], repo);
if (mode === "--push") run("git", ["push"], repo);
console.log(`${mode === "--push" ? "Publicerat" : "Commit skapad"}: ${id} (${revision})`);
