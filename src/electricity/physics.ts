import {c,add,mul,div,abs,angle,type Complex} from './math';
export const neg=(z:Complex)=>c(-z.re,-z.im);
export const sub=(a:Complex,b:Complex)=>add(a,neg(b));
export const polar=(r:number,degrees:number)=>c(r*Math.cos(degrees*Math.PI/180),r*Math.sin(degrees*Math.PI/180));
export function solve2(a:Complex,b:Complex,e:Complex,d:Complex,f:Complex,g:Complex):[Complex,Complex]{const det=sub(mul(a,f),mul(b,d));return[div(sub(mul(e,f),mul(b,g)),det),div(sub(mul(a,g),mul(e,d)),det)];}
export function rlc(R:number,L:number,C:number,w=100,V=100){const z=c(R,w*L-1/(w*C));return{z,i:div(c(V),z),phase:angle(z),power:V*V*R/(abs(z)**2)};}
export function nodal(v:Complex){const incoming=div(sub(c(20),v),c(10)),inductor=div(v,c(0,4)),capacitor=div(v,c(0,-2.5));return{incoming,inductor,capacitor,error:sub(incoming,add(inductor,capacitor))};}
export function dependent(gain:number,sensor:'C'|'R'|'L'){
 const yr=c(.1),yc=c(0,.4),yl=c(0,-.25),yl2=c(0,-.5),vs=c(20);
 const control=sensor==='C'?[yc,c(0),c(0)]:sensor==='R'?[neg(yr),c(0),mul(yr,vs)]:[yl,neg(yl),c(0)];
 const [v1,v2]=solve2(add(add(yr,yc),yl),neg(yl),mul(yr,vs),sub(neg(yl),mul(c(gain),control[0])),sub(add(yl,yl2),mul(c(gain),control[1])),mul(c(gain),control[2]));
 return{v1,v2,ix:mul(yc,v1)};
}
export function loadPower(load:Complex){const i=div(c(20),add(c(4,3),load));return{current:i,power:abs(i)**2*load.re,zTotal:add(c(4,3),load)};}
export function compensation(capacity:number){const P=800,Q=600-capacity,S=Math.hypot(P,Q);return{P,Q,S,current:S/100,pf:P/S,phase:Math.atan2(Q,P)*180/Math.PI};}
// Ideal transformers, 100 V source, 100 Ω line and 100 Ω load.
// Up ratio 1:n; down ratio m:1. All quantities are RMS.
export function transmission(n:number,m:number){const lineVoltage=100*n,lineCurrent=lineVoltage/(100+100*m*m),loadCurrent=m*lineCurrent,loadVoltage=loadCurrent*100,loadPower=loadCurrent**2*100,loss=lineCurrent**2*100,inputPower=lineVoltage*lineCurrent;return{lineVoltage,lineCurrent,loadVoltage,loadPower,loss,inputPower};}
export const phaseVoltages=[polar(220/Math.sqrt(3),0),polar(220/Math.sqrt(3),-120),polar(220/Math.sqrt(3),120),c(0)];
export function wiring(ends:(number|null)[]){
 const lineCurrents=[c(0),c(0),c(0),c(0)],branchCurrents:Complex[]=[],voltages:Complex[]=[];
 for(let i=0;i<3;i++){const to=ends[i],v=to===null?c(0):sub(phaseVoltages[i],phaseVoltages[to]),current=div(v,c(10));voltages.push(v);branchCurrents.push(current);lineCurrents[i]=add(lineCurrents[i],current);if(to!==null)lineCurrents[to]=sub(lineCurrents[to],current);}
 return{lineCurrents,branchCurrents,voltages,power:branchCurrents.reduce((sum,i)=>sum+abs(i)**2*10,0)};
}
export const isStar=(ends:(number|null)[])=>ends.every(n=>n===3);
export const isDelta=(ends:(number|null)[])=>ends.every(n=>n!==null&&n!==3)&&new Set(ends).size===3&&ends.every((n,i)=>n!==i);
export function meterReading(mode:number,leads:(number|null)[],power:boolean,closed:boolean):{value?:number;message?:string;fault:boolean}{
 const [red,black]=leads;if(red===null||black===null)return{message:'—',fault:false};
 if(mode===0){const volts=power?(closed?[12,0,0,0]:[12,12,0,12]):[0,0,0,0];return{value:volts[red]-volts[black],fault:false};}
 if(mode===1){
  if(!power)return{value:0,fault:false};
  const grounded=(n:number)=>closed?n!==0:n===2;
  if((red===0&&grounded(black))||(black===0&&grounded(red)))return{message:'CURTO',fault:true};
  if(closed)return{value:0,fault:false};
  if(red===2&&(black===1||black===3))return{value:-2,fault:false};
  if(black===2&&(red===1||red===3))return{value:2,fault:false};
  return{value:0,fault:false};
 }
 if(power)return{message:'DESLIGUE',fault:false};
 // Turning off disconnects the ideal source. Remaining passive connections:
 // R--Y is a wire; X--Y is a wire only when the return switch is closed.
 const group=(n:number)=>n===3?1:closed&&n===2?1:n;
 const a=group(red),b=group(black);
 if(a===b)return{value:0,fault:false};
 if((a===0&&b===1)||(a===1&&b===0))return{value:6,fault:false};
 return{message:'OL',fault:false};
}
