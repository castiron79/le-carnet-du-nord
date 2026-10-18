import test from 'node:test';
import assert from 'node:assert/strict';
import {stepDurations,validateTimerCoverage} from '../skills/create-le-carnet-recipe/scripts/timer-coverage.mjs';
test('publishing requires a reviewed manifest, even for recipes without numeric durations',()=>{
 assert.ok(validateTimerCoverage(['1. Servera.'],undefined).length);
 assert.deepEqual(validateTimerCoverage(['1. Servera.'],{version:1,timers:[]}),[]);
});
test('seconds, minutes, ranges and fractional hours use lower bounds and ignore temperatures',()=>{
 assert.deepEqual(stepDurations('Stek 30 sekunder, sedan 1 minut. Sjud 3–3½ timmar och baka 10–12 min i 225 °C.').map(t=>t.seconds),[30,60,10800,600]);
 assert.deepEqual(stepDurations('Vila 1½ timme.').map(t=>t.seconds),[5400]);
 assert.equal(stepDurations('Tillsätt vitlöken under den sista minuten.')[0].seconds,60);
 assert.equal(stepDurations('Vila några minuter. Följ förpackningen. 50–52 °C, 10 % grädde.').length,0);
});
test('each distinct phase and both sides must be covered without reusing a timer',()=>{
 const steps=['1. Stek 4–5 minuter. Tillsätt vitlöken i 30 sekunder.','2. Stek 2–3 minuter per sida.'];
 const manifest={version:1,timers:[{step:1,seconds:240},{step:2,seconds:120}]};
 assert.equal(validateTimerCoverage(steps,manifest).length,2);
 manifest.timers.push({step:1,seconds:30},{step:2,seconds:120});
 assert.deepEqual(validateTimerCoverage(steps,manifest),[]);
 manifest.timers[0].seconds=300;
 assert.ok(validateTimerCoverage(steps,manifest).length);
});
