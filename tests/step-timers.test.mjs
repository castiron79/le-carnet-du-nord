import test from 'node:test';
import assert from 'node:assert/strict';
import {changeTimer,decodeTimer,remainingSeconds,timerKey,validateTimers} from '../app/step-timers.mjs';
const initial={status:'ready',seconds:120};
test('deadline survives background sleep and reopening; expired timers never silently restart',()=>{
 const running=changeTimer(initial,'start',1000,120);
 assert.equal(remainingSeconds(decodeTimer(JSON.stringify(running),60000),60000),61);
 assert.equal(remainingSeconds(running,130000),0);
 assert.deepEqual(changeTimer(running,'plus',130000,120),running);
 assert.deepEqual(changeTimer(running,'reset',130000,120),initial);
});
test('pause freezes remaining time and resume creates a new deadline',()=>{
 const running=changeTimer(initial,'start',1000,120);
 const paused=changeTimer(running,'pause',11000,120);
 assert.equal(remainingSeconds(paused,999000),110);
 assert.equal(changeTimer(paused,'start',999000,120).deadline,1109000);
});
test('adjustments use live remaining time and respect bounds',()=>{
 let running=changeTimer(initial,'start',1000,120);
 running=changeTimer(running,'plus',31000,120);
 assert.equal(remainingSeconds(running,31000),150);
 assert.equal(changeTimer({status:'ready',seconds:30},'plus',0,30).seconds,40);
 assert.equal(changeTimer({status:'paused',seconds:10},'minus',0,30).seconds,10);
 assert.equal(changeTimer({status:'ready',seconds:86400},'plus',0,120).seconds,86400);
});
test('corrupt storage and far future deadlines are rejected; recipes and definitions are isolated',()=>{
 for(const raw of ['oops','{}','{"status":"running","seconds":60,"deadline":"bad"}','{"status":"paused","seconds":-1}'])assert.equal(decodeTimer(raw),null);
 assert.equal(decodeTimer(JSON.stringify({status:'running',seconds:60,deadline:86400002}),0),null);
 const timer={id:'boil',seconds:60};
 assert.notEqual(timerKey('a',timer),timerKey('b',timer));
 assert.notEqual(timerKey('a',timer),timerKey('a',{...timer,seconds:120}));
});
test('editorial metadata rejects bad steps, duplicate IDs, ambiguous values and boolean version',()=>{
 const timer={id:'boil',step:2,seconds:120,label:'Koka'};
 assert.deepEqual(validateTimers({version:1,timers:[timer]},3),[]);
 assert.ok(validateTimers({version:1,timers:[timer,timer]},3).length);
 for(const changed of [{step:4},{seconds:0},{seconds:2.5},{label:''},{note:null}])assert.ok(validateTimers({version:1,timers:[{...timer,...changed}]},3).length);
 assert.ok(validateTimers({version:true,timers:[]},3).length);
});
