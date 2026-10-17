import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateIllustrations } from '../skills/create-le-carnet-recipe/scripts/validate-illustrations.mjs';

function run(illustrations, files=[]) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'carnet-illustrations-'));
  try {
    if(illustrations!==null) fs.writeFileSync(path.join(dir,'illustrations.json'),JSON.stringify({version:1,illustrations}));
    for(const file of files) {
      const image=Buffer.alloc(24);image.write('RIFF',0);image.write('WEBP',8);
      fs.writeFileSync(path.join(dir,file),image);
    }
    const errors=[],warnings=[];
    validateIllustrations({dir,stepCount:12,fail:x=>errors.push(x),warnings});
    return {errors,warnings};
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
}
test('older recipes without manifest are accepted',()=>assert.deepEqual(run(null).errors,[]));
test('two illustrations on the same step are allowed',()=>{
  const illustrations=[
    {step:2,kind:'action',file:'step-02-action-01.webp',alt:'Älgkött bryns',caption:''},
    {step:2,kind:'result',file:'step-02-result-02.webp',alt:'Köttet har fått fin färg',caption:'Ytan ska vara brynt.'},
  ];
  assert.deepEqual(run(illustrations,illustrations.map(x=>x.file)).errors,[]);
});
test('missing referenced image blocks publication',()=>{
  const item={step:2,kind:'action',file:'step-02-action-01.webp',alt:'Bryn köttet',caption:''};
  assert.match(run([item]).errors.join(' '),/saknar bildfil/);
});
test('out-of-range step blocks publication',()=>{
  const item={step:19,kind:'action',file:'step-19-action-01.webp',alt:'Bryn köttet',caption:''};
  assert.match(run([item],[item.file]).errors.join(' '),/stegnummer/);
});
test('unreferenced illustration blocks publication',()=>{
  assert.match(run([],['step-02-action-01.webp']).errors.join(' '),/saknas i illustrations.json/);
});
test('path traversal is rejected',()=>{
  const item={step:2,kind:'action',file:'../outside.webp',alt:'Fel',caption:''};
  assert.match(run([item]).errors.join(' '),/osäkert filnamn/);
});
