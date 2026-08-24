import { readFileSync } from "node:fs";

const config = readFileSync("home-assistant-addon/config.yaml", "utf8");
const changelog = readFileSync("home-assistant-addon/CHANGELOG.md", "utf8");
const icon = readFileSync("home-assistant-addon/icon.png");
const match = config.match(/^version:\s*["']?([^"'\s]+)["']?\s*$/m);

if (!match) {
  console.error("Kunde inte läsa appversionen i home-assistant-addon/config.yaml.");
  process.exit(1);
}

const version = match[1];
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`Appversionen ${version} följer inte formatet X.Y.Z.`);
  process.exit(1);
}

const escaped = version.replaceAll(".", "\\.");
const heading = new RegExp(`^##\\s+${escaped}(?:\\s+[–-]\\s+\\d{4}-\\d{2}-\\d{2})?\\s*$`, "m");
if (!heading.test(changelog)) {
  console.error(`home-assistant-addon/CHANGELOG.md saknar en rubrik för appversion ${version}.`);
  process.exit(1);
}

const pngSignature = "89504e470d0a1a0a";
const width = icon.readUInt32BE(16);
const height = icon.readUInt32BE(20);
if (icon.subarray(0, 8).toString("hex") !== pngSignature || width !== 128 || height !== 128) {
  console.error("home-assistant-addon/icon.png måste vara en giltig PNG på 128×128 pixlar.");
  process.exit(1);
}

console.log(`Releasekontroll godkänd för Le Carnet du Nord ${version}.`);
