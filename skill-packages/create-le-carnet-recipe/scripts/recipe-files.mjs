import fs from 'node:fs';
import path from 'node:path';
import { TextDecoder } from 'node:util';

const fixedFiles = ['recipe.md', 'quantities.json', 'timers.json', 'illustrations.json'];
const stepImage = /^step-\d{2,}-(?:action|result|detail)-\d{2,}\.(?:webp|avif)$/;
const utf8 = new TextDecoder('utf-8', { fatal: true });

function imageMatches(bytes, name) {
  if (name.endsWith('.webp')) {
    return bytes.length >= 20 && bytes.toString('ascii', 0, 4) === 'RIFF'
      && bytes.toString('ascii', 8, 12) === 'WEBP'
      && bytes.readUInt32LE(4) + 8 === bytes.length
      && ['VP8 ', 'VP8L', 'VP8X'].includes(bytes.toString('ascii', 12, 16));
  }
  if (bytes.length < 16 || bytes.toString('ascii', 4, 8) !== 'ftyp') return false;
  const end = bytes.readUInt32BE(0);
  if (end < 16 || end > bytes.length || end % 4 !== 0) return false;
  if (bytes.toString('ascii', 8, 12) === 'avif') return true;
  for (let offset = 16; offset < end; offset += 4) {
    if (bytes.toString('ascii', offset, offset + 4) === 'avif') return true;
  }
  return false;
}

/** Package boundary only; existing validators retain schema, limits and references. */
export function validateRecipeFiles(dir) {
  const errors = [];
  try {
    const root = fs.lstatSync(dir);
    if (!root.isDirectory() || root.isSymbolicLink()) return ['Receptmappen måste vara en vanlig katalog, inte en länk'];
    const names = fs.readdirSync(dir);
    for (const name of names) {
      const stat = fs.lstatSync(path.join(dir, name));
      if (!stat.isFile() || stat.isSymbolicLink()) errors.push(`Endast vanliga filer direkt i receptmappen tillåts: ${name}`);
    }
    // Never follow links or inspect files in nested directories.
    if (errors.length) return errors;
    if (!names.includes('recipe.md')) return ['recipe.md saknas'];
    const text = utf8.decode(fs.readFileSync(path.join(dir, 'recipe.md')));
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] || '';
    const hero = frontmatter.match(/^hero_image:\s*(.+?)\s*$/m)?.[1].replace(/^['"]|['"]$/g, '');
    const allowed = new Set(fixedFiles);
    if (hero === 'hero.webp' || hero === 'hero.avif') allowed.add(hero);
    else errors.push('hero_image måste vara exakt hero.webp eller hero.avif');
    const manifests = {};
    for (const name of fixedFiles.filter(name => name.endsWith('.json') && names.includes(name))) {
      if (['quantities.json', 'timers.json'].includes(name) && fs.statSync(path.join(dir, name)).size > 100_000) {
        errors.push(`För stor ${name}`); continue;
      }
      try { manifests[name] = JSON.parse(utf8.decode(fs.readFileSync(path.join(dir, name)))); }
      catch { errors.push(`${name} måste vara giltig UTF-8 JSON`); }
    }
    const manifest = manifests['illustrations.json'];
    if (manifest && Array.isArray(manifest.illustrations)) {
      for (const item of manifest.illustrations) {
        if (item && typeof item.file === 'string' && stepImage.test(item.file)) allowed.add(item.file);
      }
    }
    for (const name of names) {
      if (!allowed.has(name)) errors.push(`Otillåten eller orefererad fil i receptpaketet: ${name}`);
    }
    for (const name of allowed) {
      if ((name === hero || stepImage.test(name)) && !names.includes(name)) errors.push(`Refererad bild saknas: ${name}`);
    }
    if (errors.length) return errors;
    for (const name of names.filter(name => name === hero || stepImage.test(name))) {
      if (!imageMatches(fs.readFileSync(path.join(dir, name)), name)) errors.push(`Bildformatet stämmer inte med filnamnet: ${name}`);
    }
  } catch (error) {
    errors.push(`Receptpaketet kan inte läsas säkert: ${error.code || error.message}`);
  }
  return errors;
}
