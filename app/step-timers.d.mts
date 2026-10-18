export type StepTimerDefinition = {id:string;step:number;label:string;seconds:number;note?:string};
export type TimerState = {status:'ready'|'running'|'paused';seconds:number;deadline?:number};
export const MAX_SECONDS:number;
export function validateTimers(manifest:unknown,stepCount:number):string[];
export function timerKey(recipeId:string,timer:StepTimerDefinition):string;
export function decodeTimer(raw:string|null,now?:number):TimerState|null;
export function remainingSeconds(timer:TimerState,now:number):number;
export function changeTimer(timer:TimerState,action:'reset'|'start'|'pause'|'plus'|'minus',now:number,initialSeconds:number):TimerState;
export function formatTimer(seconds:number):string;
