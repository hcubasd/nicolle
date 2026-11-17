import type {Question} from './content';
export interface Complex {re:number;im:number;}
export const c=(re:number,im=0):Complex=>({re,im});
export const add=(a:Complex,b:Complex)=>c(a.re+b.re,a.im+b.im);
export const mul=(a:Complex,b:Complex)=>c(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);
export const div=(a:Complex,b:Complex)=>{const d=b.re*b.re+b.im*b.im;return c((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d);};
export const abs=(a:Complex)=>Math.hypot(a.re,a.im);
export const angle=(a:Complex)=>Math.atan2(a.im,a.re)*180/Math.PI;
export const fmt=(n:number,digits=2)=>n.toLocaleString('pt-BR',{maximumFractionDigits:digits});
export function series(f:number,R:number,L:number,C:number){const w=2*Math.PI*f,z=c(R,w*L-1/(w*C));return{w,z,current:div(c(100),z),xl:w*L,xc:1/(w*C)};}
export function threePhase(lineVoltage:number,z:number,delta:boolean,pf=.8){const phaseVoltage=delta?lineVoltage:lineVoltage/Math.sqrt(3),phaseCurrent=phaseVoltage/z,lineCurrent=phaseCurrent*(delta?Math.sqrt(3):1);return{phaseVoltage,phaseCurrent,lineCurrent,power:Math.sqrt(3)*lineVoltage*lineCurrent*pf};}
export function parseAnswer(raw:string):number|undefined {
 // Accept Portuguese or decimal-point numbers, but no ambiguous unit suffixes.
 const text=raw.trim().replace(/\s/g,'').replace(',','.');
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text))return;
 const value=Number(text);return Number.isFinite(value)?value:undefined;
}

export function isCorrect(q:Question,value:number):boolean {return Math.abs(value-q.answer)<=(q.choices?0:q.tolerance??.01);}
