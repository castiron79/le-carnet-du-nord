#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve(process.argv[2] || '.');
const file = path.join(dir, 'recipe.md');
const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);

if (!fs.existsSync(file)) fail('recipe.md saknas');
let text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
if (!match) fail('Giltig YAML-frontmatter saknas');
const yaml = match?.[1] || '';

function scalar(key) {
  const m = yaml.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm'));
  return m ? m[1].replace(/^['"]|['"]$/g, '') : null;
}
function nested(section, key) {
  const m = yaml.match(new RegExp(`^${section}:\\s*\\r?\\n(?:^[ \\t]+.*\\r?\\n)*?^[ \\t]+${key}:\\s*(.+?)\\s*$`, 'm'));
  return m ? m[1].replace(/^['"]|['"]$/g, '') : null;
}

const required = ['schema_version','id','slug','title','restaurant_title','summary','status','published_at','updated_at','servings','prep_minutes','cook_minutes','total_minutes','protein_group','carb_group','meal_type','tags','allergens','hero_image','hero_alt'];
for (const key of required) if (!scalar(key)) fail(`Fält saknas: ${key}`);
for (const key of ['basis','kcal','protein_g','carbs_g','fat_g','fiber_g','method']) if (!nested('nutrition', key)) fail(`Näringsfält saknas: nutrition.${key}`);

const slug = scalar('slug');
if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail('slug måste vara kebab-case utan å/ä/ö');
if (slug && path.basename(dir) !== slug) fail('Katalognamnet måste matcha slug');
if (scalar('id') && scalar('id') !== slug) fail('id och slug måste matcha för nya recept');
if (scalar('schema_version') !== '1') fail('schema_version måste vara 1');
if (!['draft','review','published','archived'].includes(scalar('status'))) fail('Ogiltig status');
const allowedCarbs = ['pasta','ris','potatis','bröd','nudlar','gryn','baljväxter','lågkolhydrat','övrigt'];
if (scalar('carb_group') && !allowedCarbs.includes(scalar('carb_group').toLowerCase())) fail(`Ogiltig carb_group. Använd en grov grupp: ${allowedCarbs.join(', ')}`);

for (const key of ['servings','prep_minutes','cook_minutes','total_minutes']) {
  const value = Number(scalar(key));
  if (!Number.isInteger(value) || value <= 0) fail(`${key} måste vara ett positivt heltal`);
}
const prep = Number(scalar('prep_minutes')), cook = Number(scalar('cook_minutes')), total = Number(scalar('total_minutes'));
if (Number.isFinite(total) && total < prep + cook) fail('total_minutes får inte vara mindre än prep_minutes + cook_minutes');

for (const key of ['kcal','protein_g','carbs_g','fat_g','fiber_g']) {
  const value = Number(nested('nutrition', key));
  if (!Number.isFinite(value) || value < 0) fail(`nutrition.${key} måste vara ett icke-negativt tal`);
}
if (nested('nutrition','basis') !== 'per portion') fail('nutrition.basis måste vara "per portion"');
const kcal = Number(nested('nutrition','kcal'));
const macroKcal = 4 * Number(nested('nutrition','protein_g')) + 4 * Number(nested('nutrition','carbs_g')) + 9 * Number(nested('nutrition','fat_g'));
if (kcal > 0 && Math.abs(macroKcal - kcal) / kcal > 0.15) warnings.push('Makron avviker mer än 15 % från angivna kcal');

const headings = ['Ingredienser','Gör så här','Serveringstips','Varför det blir så gott','Förvaring'];
let prior = -1;
for (const heading of headings) {
  const hits = [...text.matchAll(new RegExp(`^## ${heading.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*$`, 'gm'))];
  if (hits.length !== 1) fail(`Sektionen "${heading}" måste förekomma exakt en gång`);
  else if (hits[0].index < prior) fail('Sektionerna ligger i fel ordning');
  else prior = hits[0].index;
}
if (!/^\d+\.\s+/m.test(text.slice(match?.[0].length || 0))) fail('Gör så här måste innehålla numrerade steg');

const image = scalar('hero_image');
if (image) {
  if (!/\.(webp|avif)$/i.test(image)) fail('hero_image måste vara WebP eller AVIF');
  const imagePath = path.resolve(dir, image);
  if (!imagePath.startsWith(dir + path.sep) || !fs.existsSync(imagePath)) fail('hero_image saknas eller pekar utanför receptmappen');
  else if (fs.statSync(imagePath).size > 500 * 1024) warnings.push('Hero-bilden är större än 500 KB');
}

for (const d of ['published_at','updated_at']) if (scalar(d) && !/^\d{4}-\d{2}-\d{2}$/.test(scalar(d))) fail(`${d} måste vara YYYY-MM-DD`);

for (const warning of warnings) console.warn(`VARNING: ${warning}`);
for (const error of errors) console.error(`FEL: ${error}`);
if (errors.length) process.exit(1);
console.log(`OK: ${path.basename(dir)} är giltigt (${warnings.length} varningar)`);
