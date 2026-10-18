import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validateRecipeFiles } from '../skills/create-le-carnet-recipe/scripts/recipe-files.mjs';

const fixtures = new URL('./fixtures/recipe-files/', import.meta.url);
const fixture = name => fs.readFileSync(new URL(name, fixtures));
function run(change, check) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'carnet-files-'));
  const dir = path.join(temp, 'recipe'); fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'recipe.md'), '---\nhero_image: hero.webp\n---\n');
  fs.writeFileSync(path.join(dir, 'hero.webp'), fixture('pixel.webp'));
  try { change?.(dir, temp); check(validateRecipeFiles(dir), dir, temp); }
  finally { fs.rmSync(temp, {recursive:true, force:true}); }
}
const write = (dir, name, value) => fs.writeFileSync(path.join(dir, name), value);
const illustration = dir => {
  write(dir, 'illustrations.json', JSON.stringify({version:1,illustrations:[{step:1,kind:'action',file:'step-01-action-01.avif',alt:'Test',caption:''}]}));
  write(dir, 'step-01-action-01.avif', fixture('pixel.avif'));
};

test('accepts a flat WebP package and optional legacy manifests',()=>run(null,errors=>assert.deepEqual(errors,[])));
test('accepts selected AVIF hero and referenced AVIF illustration',()=>run(dir=>{
  fs.unlinkSync(path.join(dir,'hero.webp'));
  write(dir,'recipe.md','---\nhero_image: hero.avif\n---\n');
  write(dir,'hero.avif',fixture('pixel.avif')); illustration(dir);
},errors=>assert.deepEqual(errors,[])));

test('rejects every unneeded file type and an unselected second hero',()=>{
  for(const name of ['extra.html','extra.js','extra.svg','original.png','original.jpg','package.zip','notes.pdf','extra.md','extra.json','.DS_Store','Thumbs.db','hero.avif']) {
    run(dir=>write(dir,name,'audit'),errors=>assert.match(errors.join(' '),/Otillåten/));
  }
});
test('rejects missing and unreferenced step images',()=>{
  run(dir=>{illustration(dir);fs.unlinkSync(path.join(dir,'step-01-action-01.avif'));},errors=>assert.match(errors.join(' '),/Refererad bild saknas/));
  run(dir=>write(dir,'step-01-action-01.webp',fixture('pixel.webp')),errors=>assert.match(errors.join(' '),/orefererad/));
});
test('rejects directories and symbolic directory links without following them',()=>{
  run(dir=>fs.mkdirSync(path.join(dir,'nested')),errors=>assert.match(errors.join(' '),/vanliga filer/));
  run((dir,temp)=>fs.symlinkSync(temp,path.join(dir,'link'),process.platform==='win32'?'junction':'dir'),errors=>assert.match(errors.join(' '),/vanliga filer/));
  run(null,(_,dir,temp)=>{
    const link=path.join(temp,'linked-root');fs.symlinkSync(dir,link,process.platform==='win32'?'junction':'dir');
    assert.match(validateRecipeFiles(link).join(' '),/inte en länk/);
  });
});
test('rejects path references and falsely named image content',()=>{
  for(const hero of ['../hero.webp','https://example.test/hero.webp','nested/hero.webp']) {
    run(dir=>write(dir,'recipe.md',`---\nhero_image: ${hero}\n---\n`),errors=>assert.match(errors.join(' '),/hero_image/));
  }
  run(dir=>write(dir,'hero.webp','<html>audit</html>'),errors=>assert.match(errors.join(' '),/Bildformatet/));
  run(dir=>write(dir,'hero.webp',fixture('pixel.avif')),errors=>assert.match(errors.join(' '),/Bildformatet/));
});
test('rejects invalid UTF-8 and invalid JSON',()=>{
  run(dir=>write(dir,'recipe.md',Buffer.from([0xff])),errors=>assert.ok(errors.length));
  run(dir=>write(dir,'quantities.json',Buffer.from([0xff])),errors=>assert.match(errors.join(' '),/UTF-8 JSON/));
  run(dir=>write(dir,'timers.json','{'),errors=>assert.match(errors.join(' '),/UTF-8 JSON/));
});
test('publication CLI accepts each hero format and stops an extra executable file',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'carnet-files-cli-'));
  const dir=path.join(temp,'poulet-du-nord-med-pasta');
  const validator=fileURLToPath(new URL('../skills/create-le-carnet-recipe/scripts/validate-recipe.mjs',import.meta.url));
  const validate=()=>spawnSync(process.execPath,[validator,dir],{encoding:'utf8'});
  try {
    fs.mkdirSync(dir);write(dir,'recipe.md',fixture('recipe-template.md'));
    write(dir,'hero.webp',fixture('pixel.webp'));write(dir,'timers.json','{"version":1,"timers":[]}');
    const valid=validate();assert.equal(valid.status,0,valid.stderr);
    write(dir,'recipe.md',fs.readFileSync(path.join(dir,'recipe.md'),'utf8').replace('hero.webp','hero.avif'));
    fs.unlinkSync(path.join(dir,'hero.webp'));write(dir,'hero.avif',fixture('pixel.avif'));assert.equal(validate().status,0);
    write(dir,'extra.js','// audit only');const rejected=validate();assert.equal(rejected.status,1);assert.match(rejected.stderr,/extra\.js/);
  } finally {fs.rmSync(temp,{recursive:true,force:true});}
});
