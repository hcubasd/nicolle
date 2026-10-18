import {generateGraph,startAt,prim,type Graph,type Rescue} from './model';
export interface Session {graph:Graph;state:Rescue;trail?:{x:number;y:number;d:number}[];}
const key='nicolle-rescue-prim-v3';
export let session:Session|undefined;
export function createSession(count:number):Session {
 if(!Number.isInteger(count))throw Error('Informe um número inteiro.');
 count=Math.max(2,Math.min(128,count));
 const seed=crypto.getRandomValues(new Uint32Array(1))[0];
 const graph=generateGraph(count,seed);
 session={graph,state:startAt(graph,seed%graph.islands.length)};saveSession();return session;
}
export function clearSession():void {
 session=undefined;
 try {localStorage.removeItem(key);}catch{/* Storage is optional. */}
}
export function saveSession():void {
 if(!session)return;
 try {const {graph,state}=session;localStorage.setItem(key,JSON.stringify({count:graph.islands.length,seed:graph.seed,at:state.at,rescued:[...state.rescued],bought:[...state.bought],spent:state.spent,trail:session.trail}));}catch{/* Saving is optional. */}
}
try {
 const value=JSON.parse(localStorage.getItem(key)||'null');
 if(value&&Number.isInteger(value.count)&&value.count>=2&&value.count<=128&&Number.isInteger(value.seed)) {
  const graph=generateGraph(value.count,value.seed);
  if(Array.isArray(value.rescued)&&Array.isArray(value.bought)) {
   const rescued=new Set<number>(value.rescued),bought=new Set<number>(value.bought);
   let valid=rescued.size===value.rescued.length&&bought.size===value.bought.length;
   for(const id of rescued)valid&&=Number.isInteger(id)&&!!graph.islands[id];
   let spent=0;
   for(const id of bought){const e=graph.bridges[id];if(!Number.isInteger(id)||!e||!rescued.has(e.a)||!rescued.has(e.b))valid=false;else spent+=e.cost;}
   valid&&=spent===value.spent&&spent<=prim(graph).total&&bought.size===Math.max(0,rescued.size-1)&&(value.at===null?rescued.size===0:rescued.has(value.at));
   if(valid&&rescued.size){const reached=new Set([value.at]);for(let i=0;i<rescued.size;i++)for(const id of bought){const e=graph.bridges[id];if(reached.has(e.a)||reached.has(e.b)){reached.add(e.a);reached.add(e.b);}}valid&&=reached.size===rescued.size;}
   if(valid)session={graph,state:{at:value.at,rescued,bought,spent},trail:Array.isArray(value.trail)?value.trail.slice(-20000):undefined};
  }
 }
}catch{/* Ignore malformed or unavailable storage. */}
