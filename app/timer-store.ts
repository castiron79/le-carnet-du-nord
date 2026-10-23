"use client";
import {useSyncExternalStore} from 'react';

export type CentralTimer = {key:string;recipe_id:string;timer_id:string;initial:number;title:string;label:string;step:number;run_id:string;status:'ready'|'running'|'paused'|'done';seconds:number;deadline:number|null;remaining:number;revision:number;alarm_id:string|null};
type Alarm = {id:string;status:string;stop_requested:number;until_at:number;result:Record<string,unknown>};
type TimerView = {timers:CentralTimer[];alarms:Alarm[];server_time:number;health:{ok:boolean;delivery:string|null}};
type Snapshot = {view:TimerView|null;online:boolean;busy:ReadonlySet<string>;unresolved:ReadonlySet<string>;error:string;now:number};
const empty:Snapshot={view:null,online:false,busy:new Set(),unresolved:new Set(),error:'',now:0};
let current=empty, serverBase=0, monoBase=0, references=0, generation=0;
let poll:ReturnType<typeof setTimeout>|undefined, animation:ReturnType<typeof setInterval>|undefined;
let fetching:Promise<void>|null=null;
const listeners=new Set<()=>void>();
const pending=new Map<string,Record<string,unknown>>();
function publish(next:Partial<Snapshot>){current={...current,...next};listeners.forEach(fn=>fn());}
function serverNow(){return serverBase+(performance.now()-monoBase)/1000;}
function requestId(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,'0')).join('');}
async function refresh(){
  if(fetching)return fetching;
  const activeGeneration=generation;
  fetching=(async()=>{
    try{
      const response=await fetch('api/timers',{cache:'no-store',signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw new Error('Ingen kontakt med timerdriften på Green.');
      const view:TimerView=await response.json();
      if(!Array.isArray(view.timers)||!Array.isArray(view.alarms)||!Number.isFinite(view.server_time))throw new Error('Ogiltig timerstatus.');
      if(generation!==activeGeneration)return;
      serverBase=view.server_time;monoBase=performance.now();
      publish({view,online:view.health.ok,now:serverNow()});
    }catch{if(generation===activeGeneration)publish({online:false});}
    finally{fetching=null;}
  })();
  return fetching;
}
function visible(){if(!document.hidden)void refresh();}
function schedule(){poll=setTimeout(async()=>{if(!document.hidden)await refresh();if(references)schedule();},2000);}
function subscribe(listener:()=>void){
  listeners.add(listener);
  if(references++===0){
    generation++;void refresh();schedule();
    animation=setInterval(()=>{if(!document.hidden&&current.view)publish({now:serverNow()});},500);
    window.addEventListener('focus',visible);window.addEventListener('pageshow',visible);document.addEventListener('visibilitychange',visible);
  }
  return()=>{listeners.delete(listener);if(--references===0){clearTimeout(poll);clearInterval(animation);generation++;window.removeEventListener('focus',visible);window.removeEventListener('pageshow',visible);document.removeEventListener('visibilitychange',visible);}};
}
export function useTimers(){return useSyncExternalStore(subscribe,()=>current,()=>empty);}
export function timerIdentity(recipeId:string,timerId:string,seconds:number){return `${recipeId}:${timerId}:${seconds}`;}
export function timerRemaining(timer:CentralTimer,now:number){return timer.status==='running'?Math.max(0,Math.ceil((timer.deadline??now)-now)):timer.seconds;}

export async function timerAction(key:string,action:string,revision:number,alarmId?:string){
  if(current.busy.has(key)||!current.online)return;
  const unresolved=pending.get(key);
  if(unresolved&&(unresolved.action!==action||unresolved.alarm_id!==alarmId)){publish({error:'Ett tidigare kommando saknar svar. Försök samma åtgärd igen först.'});return;}
  const data=unresolved??{request_id:requestId(),revision,action,...(alarmId?{alarm_id:alarmId}:{key})};
  pending.set(key,data);publish({busy:new Set([...current.busy,key]),error:''});
  try{
    const response=await fetch('api/timers',{method:'POST',headers:{'Content-Type':'application/json','X-Carnet-Request':'1'},body:JSON.stringify(data),signal:AbortSignal.timeout(10000)});
    const result=await response.json();
    if(response.ok)pending.delete(key);
    else{if(response.status<500)pending.delete(key);throw new Error(result.error||'Timerkommandot kunde inte bekräftas.');}
  }catch(error){publish({error:error instanceof Error?error.message:'Timerkommandot saknar svar.'});}
  finally{
    if(pending.has(key)){
      try{
        const check=await fetch(`api/timer-requests/${data.request_id}`,{cache:'no-store',signal:AbortSignal.timeout(10000)});
        if(check.ok&&(await check.json()).found)pending.delete(key);
      }catch{/* The same request ID remains available for a safe retry. */}
    }
    await refresh();const busy=new Set(current.busy);busy.delete(key);publish({busy,unresolved:new Set(pending.keys())});
  }
}
export function retryTimerAction(key:string){const data=pending.get(key);if(data)void timerAction(key,String(data.action),Number(data.revision),data.alarm_id as string|undefined);}
