import fs from 'node:fs';
import path from 'node:path';

/** A human visual check is required; code cannot prove that a drawing has no text. */
export function validateIllustrations({dir, stepCount, fail, warnings}) {
  const manifestPath = path.join(dir, 'illustrations.json');
  const illustrationNames = fs.readdirSync(dir).filter(name =>
    /^step-\d{2,}-(?:action|result|detail)-\d{2,}\.(?:webp|avif)$/.test(name));
  if (!fs.existsSync(manifestPath)) {
    if (illustrationNames.length) fail('Stegbilder finns men illustrations.json saknas');
    return;
  }
  let document;
  try { document = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); }
  catch { return fail('illustrations.json är inte giltig UTF-8 JSON'); }
  if (!document || typeof document !== 'object' || Array.isArray(document)
      || document.version !== 1 || !Array.isArray(document.illustrations)) {
    return fail('illustrations.json kräver version: 1 och illustrations: []');
  }
  const referenced = new Set();
  document.illustrations.forEach((item, index) => {
    const prefix = 'Illustration ' + (index + 1);
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      fail(prefix + ' måste vara ett objekt'); return;
    }
    if (!Number.isInteger(item.step) || item.step < 1 || item.step > stepCount)
      fail(prefix + ' har ogiltigt stegnummer');
    if (!['action','result','detail'].includes(item.kind))
      fail(prefix + ' har ogiltig typ');
    if (typeof item.alt !== 'string' || !item.alt.trim())
      fail(prefix + ' saknar beskrivande alt-text');
    if (typeof item.caption !== 'string')
      fail(prefix + ' måste ha caption-sträng (tom sträng tillåten)');
    if (typeof item.file !== 'string') {
      fail(prefix + ' saknar filnamn'); return;
    }
    const match = /^step-(\d{2,})-(action|result|detail)-\d{2,}\.(webp|avif)$/.exec(item.file);
    if (!match || Number(match[1]) !== item.step || match[2] !== item.kind
        || path.basename(item.file) !== item.file) {
      fail(prefix + ' har ogiltigt eller osäkert filnamn'); return;
    }
    if (referenced.has(item.file)) fail(prefix + ' har duplicerat filnamn');
    referenced.add(item.file);
    const asset = path.join(dir, item.file);
    if (!fs.existsSync(asset) || !fs.statSync(asset).isFile()) {
      fail(prefix + ' saknar bildfil ' + item.file); return;
    }
    const size = fs.statSync(asset).size;
    if (size > 2_000_000) fail(prefix + ' är större än 2 MB');
    else if (size > 500 * 1024) warnings.push(prefix + ' överstiger rekommenderade 500 KB');
    const head = Buffer.alloc(24);
    const handle = fs.openSync(asset,'r');
    try { fs.readSync(handle,head,0,24,0); } finally { fs.closeSync(handle); }
    const webp = head.toString('ascii',0,4)==='RIFF' && head.toString('ascii',8,12)==='WEBP';
    const avif = head.toString('ascii',4,8)==='ftyp' && head.toString('ascii',8,24).includes('avif');
    if (match[3]==='webp' ? !webp : !avif) fail(prefix + ' har ogiltigt bildformat');
  });
  for (const filename of illustrationNames) {
    if (!referenced.has(filename)) fail('Bildfilen ' + filename + ' saknas i illustrations.json');
  }
}
