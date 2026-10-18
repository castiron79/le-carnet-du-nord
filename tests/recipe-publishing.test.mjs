import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

test('publisher rejects a linked directory before hashing, copying or calling git',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'carnet-publish-files-'));
  const source=path.join(temp,'source'),repo=path.join(temp,'repo');
  fs.mkdirSync(source);fs.mkdirSync(repo);fs.mkdirSync(path.join(repo,'.git'));
  fs.writeFileSync(path.join(source,'recipe.md'),'---\nstatus: published\nhero_image: hero.webp\n---\n');
  fs.copyFileSync(new URL('./fixtures/recipe-files/pixel.webp',import.meta.url),path.join(source,'hero.webp'));
  try {
    fs.symlinkSync(source,path.join(source,'loop'),process.platform==='win32'?'junction':'dir');
    const script=fileURLToPath(new URL('../skills/create-le-carnet-recipe/scripts/publish-recipe.mjs',import.meta.url));
    const result=spawnSync(process.execPath,[script,source,repo],{encoding:'utf8',timeout:5000});
    assert.equal(result.status,1);assert.match(result.stderr,/vanliga filer/);
    assert.equal(fs.existsSync(path.join(repo,'recipes')),false);
    assert.deepEqual(fs.readdirSync(path.join(repo,'.git')),[]);
  } finally {fs.rmSync(temp,{recursive:true,force:true});}
});
