"use client";

import {useEffect,useState,useSyncExternalStore} from 'react';
import {changeTimer,decodeTimer,formatTimer,remainingSeconds,timerKey,type StepTimerDefinition} from './step-timers.mjs';

const listeners = new Set<()=>void>();
const cache = new Map<string,string|null>();
const notify = () => listeners.forEach(listener=>listener());
function subscribe(listener:()=>void) {
  listeners.add(listener);
  const refresh = (event:StorageEvent) => {if(event.key)cache.delete(event.key);else cache.clear();notify();};
  window.addEventListener('storage',refresh);
  return () => {listeners.delete(listener);window.removeEventListener('storage',refresh);};
}
function snapshot(key:string) {
  if(!cache.has(key)) {try {cache.set(key,localStorage.getItem(key));} catch {cache.set(key,null);}}
  return cache.get(key) ?? null;
}

export default function StepTimer({recipeId,timer,showLabel=false}:{recipeId:string;timer:StepTimerDefinition;showLabel?:boolean}) {
  const key=timerKey(recipeId,timer);
  const raw=useSyncExternalStore(subscribe,()=>snapshot(key),()=>null);
  const [now,setNow]=useState(()=>Date.now());
  const [storageFailed,setStorageFailed]=useState(false);
  const state=decodeTimer(raw,now)||{status:'ready' as const,seconds:timer.seconds};
  const seconds=remainingSeconds(state,now);
  const done=state.status==='running'&&seconds===0;
  useEffect(()=>{
    const refresh=()=>setNow(Date.now());
    refresh();
    const interval=state.status==='running'&&!done?window.setInterval(refresh,500):undefined;
    document.addEventListener('visibilitychange',refresh);
    window.addEventListener('pageshow',refresh);
    return ()=>{clearInterval(interval);document.removeEventListener('visibilitychange',refresh);window.removeEventListener('pageshow',refresh);};
  },[state.status,done]);
  function act(action:'reset'|'start'|'pause'|'plus'|'minus') {
    const next=changeTimer(decodeTimer(snapshot(key))||{status:'ready',seconds:timer.seconds},action,Date.now(),timer.seconds);
    const serialized=JSON.stringify(next);
    cache.set(key,serialized);
    try {if(action==='reset')localStorage.removeItem(key);else localStorage.setItem(key,serialized);setStorageFailed(false);}
    catch {setStorageFailed(true);}
    setNow(Date.now());notify();
  }
  const label=timer.label;
  return <div className={`stepTimerBlock ${done?'isDone':''}`}>
    <div className="stepTimer" role="group" aria-label={`Timer: ${label}`}>
      {!done&&<button type="button" onClick={()=>act('minus')} disabled={seconds<=10} aria-label={`Minska tiden: ${label}`}>−</button>}
      <span className="timerDigits" role="timer" aria-label={`${label}, ${done?'tiden är ute':formatTimer(seconds)}`}>{done?'Tiden är ute':formatTimer(seconds)}</span>
      {!done&&<button type="button" onClick={()=>act('plus')} disabled={seconds>=86400} aria-label={`Öka tiden: ${label}`}>+</button>}
      <button type="button" className="timerPrimary" onClick={()=>act(done?'reset':state.status==='running'?'pause':'start')}>{done?'Återställ':state.status==='running'?'Pausa':state.status==='paused'?'Fortsätt':'Starta'}</button>
      {!done&&state.status!=='ready'&&<button type="button" onClick={()=>act('reset')} aria-label={`Avbryt timer: ${label}`} title="Avbryt timer">×</button>}
    </div>
    {(timer.note||showLabel)&&<small className="timerNote">{showLabel&&<strong>{timer.label}: </strong>}{timer.note}</small>}
    {storageFailed&&<small className="timerNote" role="status">Timern kan inte sparas och försvinner vid omladdning.</small>}
    <span className="timerAnnouncement" role="status">{done?`${label}: tiden är ute.`:''}</span>
  </div>;
}
