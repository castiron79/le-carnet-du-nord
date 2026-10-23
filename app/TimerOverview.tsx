"use client";
import {useState} from 'react';
import {formatTimer} from './step-timers.mjs';
import {retryTimerAction,timerAction,timerRemaining,useTimers} from './timer-store';

export default function TimerOverview(){
  const store=useTimers(), [expanded,setExpanded]=useState(false);
  const timers=store.view?.timers.filter(t=>t.status!=='ready')??[];
  const alarm=store.view?.alarms.find(a=>['pending','dispatching','active'].includes(a.status));
  if(!timers.length&&!alarm&&!store.error)return null;
  return <section className={`timerOverview ${alarm?'isRinging':''}`} aria-label="Gemensamma recepttimers">
    <div className="timerOverviewHeading">
      <button type="button" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{timers.length?`${timers.length} ${timers.length===1?'timer':'timers'}`:'Timerlarm'} · {expanded?'Dölj':'Visa'}</button>
      {alarm&&<button type="button" className="stopTimerAlarm" disabled={!store.online||Boolean(alarm.stop_requested)||store.busy.has(`alarm:${alarm.id}`)} onClick={()=>void timerAction(`alarm:${alarm.id}`,'stop_alarm',0,alarm.id)}>{alarm.stop_requested?'Stänger av larm…':'Stäng av larm'}</button>}
    </div>
    {!store.online&&<p role="status">Ingen kontakt med Green. Startade timers fortsätter där.</p>}
    {store.error&&<p role="status">{store.error}</p>}
    {store.view?.health.delivery&& !['active','stopped'].includes(store.view.health.delivery)&&<p role="status">{store.view.health.delivery==='interrupted'?'Larmets uppspelning kunde inte bekräftas. Kontrollera HA:s notis.':store.view.health.delivery}</p>}
    {[...store.unresolved].map(key=><button key={key} type="button" disabled={!store.online||store.busy.has(key)} onClick={()=>retryTimerAction(key)}>Försök samma kommando igen</button>)}
    {(expanded||alarm)&&<ul>{timers.map(timer=><li key={timer.key}>
      <div><strong>{timer.title}</strong><span>{timer.label} · {timer.status==='done'?'Tiden är ute':formatTimer(timerRemaining(timer,store.now))}{timer.status==='paused'?' · pausad':''}</span></div>
      <button type="button" disabled={!store.online||store.busy.has(timer.key)} onClick={()=>void timerAction(timer.key,timer.status==='done'?'reset':'cancel',timer.revision)}>{timer.status==='done'?'Återställ':'Avbryt'}</button>
    </li>)}</ul>}
  </section>;
}
