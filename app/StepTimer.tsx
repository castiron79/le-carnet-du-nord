"use client";
import {formatTimer,type StepTimerDefinition} from './step-timers.mjs';
import {retryTimerAction,timerAction,timerIdentity,timerRemaining,useTimers} from './timer-store';

export default function StepTimer({recipeId,timer,showLabel=false}:{recipeId:string;timer:StepTimerDefinition;showLabel?:boolean}){
  const store=useTimers(), key=timerIdentity(recipeId,timer.id,timer.seconds);
  const state=store.view?.timers.find(item=>item.key===key);
  const seconds=state?timerRemaining(state,store.now):timer.seconds;
  const status=state?.status??'ready', done=status==='done';
  const disabled=!store.online||store.busy.has(key);
  const act=(action:string)=>void timerAction(key,action,state?.revision??0);
  return <div className={`stepTimerBlock ${done?'isDone':''}`}>
    <div className="stepTimer" role="group" aria-label={`Timer: ${timer.label}`} aria-busy={store.busy.has(key)}>
      {!done&&<button type="button" onClick={()=>act('minus')} disabled={disabled||seconds<=10} aria-label={`Minska tiden: ${timer.label}`}>−</button>}
      <span className="timerDigits" role="timer" aria-label={`${timer.label}, ${done?'tiden är ute':formatTimer(seconds)}`}>{done?'Tiden är ute':formatTimer(seconds)}</span>
      {!done&&<button type="button" onClick={()=>act('plus')} disabled={disabled||seconds>=86400} aria-label={`Öka tiden: ${timer.label}`}>+</button>}
      <button type="button" className="timerPrimary" disabled={disabled} onClick={()=>act(done?'reset':status==='running'?'pause':'start')}>{done?'Återställ':status==='running'?'Pausa':status==='paused'?'Fortsätt':'Starta'}</button>
      {!done&&status!=='ready'&&<button type="button" disabled={disabled} onClick={()=>act('cancel')} aria-label={`Avbryt timer: ${timer.label}`} title="Avbryt timer">×</button>}
    </div>
    {store.unresolved.has(key)&&<button type="button" disabled={disabled} onClick={()=>retryTimerAction(key)}>Försök samma kommando igen</button>}
    {(timer.note||showLabel)&&<small className="timerNote">{showLabel&&<strong>{timer.label}: </strong>}{timer.note}</small>}
    {!store.online&&<small className="timerNote" role="status">{store.view?'Ingen kontakt med Green. Startade timers fortsätter där.':'Ansluter till timerdriften på Green…'}</small>}
    <span className="timerAnnouncement" role="status">{done?`${timer.label}: tiden är ute.`:''}</span>
  </div>;
}
