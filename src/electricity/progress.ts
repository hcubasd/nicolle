import {allQuestions,missions} from './content';
export interface Progress {solved:string[];missed:string[];seen:string[];xp:number;experiments:string[];}
const key='nicolle-eletricidade-prova2-v1';
const valid=new Set(allQuestions.map(q=>q.id));
export function readProgress():Progress {
 try{const p=JSON.parse(localStorage.getItem(key)??'null');if(p){const list=(v:unknown)=>Array.isArray(v)?[...new Set(v.filter((id):id is string=>typeof id==='string'&&valid.has(id)))]:[];return{solved:list(p.solved),missed:list(p.missed),seen:Array.isArray(p.seen)?p.seen.filter((id:unknown)=>missions.some(m=>m.id===id)):[],xp:Number.isFinite(p.xp)?Math.max(0,p.xp):0,experiments:Array.isArray(p.experiments)?[...new Set<string>(p.experiments.filter((id:unknown)=>missions.some(m=>m.id===id)))]:[]};}}catch{/* Progress is optional. */}
 return{solved:[],missed:[],seen:[],xp:0,experiments:[]};
}
export function saveProgress(p:Progress):void {try{localStorage.setItem(key,JSON.stringify(p));}catch{/* Private browsing still permits playing. */}}
export function markAnswer(p:Progress,id:string,correct:boolean,hinted=false):void {
 if(!valid.has(id))return;
 if(correct){if(!p.solved.includes(id)){p.solved.push(id);p.xp+=hinted?10:15;}if(!hinted)p.missed=p.missed.filter(q=>q!==id);}
 else if(!p.missed.includes(id))p.missed.push(id);
 saveProgress(p);
}

export function markExperiment(p:Progress,id:string):void {
 if(!missions.some(m=>m.id===id)||p.experiments.includes(id))return;
 p.experiments.push(id);p.xp+=100;saveProgress(p);
}
