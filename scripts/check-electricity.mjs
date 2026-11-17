import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import katex from 'katex';
const load=async(name,replacements={})=>{let source=readFileSync(new URL(`../src/electricity/${name}.ts`,import.meta.url),'utf8');for(const [a,b] of Object.entries(replacements))source=source.replaceAll(a,b);const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;return import('data:text/javascript;base64,'+Buffer.from(out).toString('base64'));};
const contentSource=readFileSync(new URL('../src/electricity/content.ts',import.meta.url),'utf8');
const contentUrl='data:text/javascript;base64,'+Buffer.from(ts.transpileModule(contentSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText).toString('base64');
const {missions,allQuestions}=await import(contentUrl),math=await load('math');
assert.equal(missions.length,13);assert.equal(allQuestions.length,69);
assert.equal(new Set(missions.map(m=>m.id)).size,missions.length);assert.equal(new Set(allQuestions.map(q=>q.id)).size,allQuestions.length);
let formulaCount=0;
for(const m of missions){assert(m.source&&m.lessons.length>=3&&m.questions.length>=4);for(const q of m.questions){assert(q.hint&&q.solution.length&&Number.isFinite(q.answer));if(q.choices){assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length);assert.equal(new Set(q.choices).size,q.choices.length);}else assert(q.tolerance>=0);assert(math.isCorrect(q,q.answer));assert(!math.isCorrect(q,q.answer+100));}
 const texts=[...m.lessons.flatMap(l=>l.paragraphs),...m.questions.flatMap(q=>[q.prompt,q.hint,...q.solution,...q.choices??[]])];
 for(const text of texts)for(const match of text.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g)){katex.renderToString(match[1]??match[2],{throwOnError:true,strict:'error'});formulaCount++;}
}
const near=(a,b,e=1e-9)=>assert(Math.abs(a-b)<e,`${a} != ${b}`);
for(const [text,value] of [['70,71',70.71],['-0.2',-.2],['.14',.14],['1e3',1000]])assert.equal(math.parseAnswer(text),value);
for(const text of ['','12 V','1,2,3','NaN','Infinity','2/3'])assert.equal(math.parseAnswer(text),undefined);
// Independent checks of the worked source examples, not just question metadata.
const {c,div,mul,add,abs,angle}=math;
const node=div(c(20),c(1,1.5)),ic=div(node,c(0,-2.5));near(node.re,80/13);near(ic.re,48/13);near(ic.im,32/13);near(angle(ic),33.690067525979785);
const i2=div(c(340,-240),c(68));near(abs(i2),6.1201917784,1e-6);near(angle(c(-i2.re,-i2.im)),144.7824,.001);
const v1=div(c(20),c(1,-1/3)),v2=mul(c(-11/15),v1),ix=div(v1,c(0,-2.5));near(v1.re,18);near(v1.im,6);near(v2.re,-13.2);near(abs(ix),7.5894663844,1e-8);
const y=math.threePhase(220,10,false),d=math.threePhase(220,10,true);near(d.lineCurrent/y.lineCurrent,3);near(d.power/y.power,3);near(y.power,3*y.phaseVoltage*y.phaseCurrent*.8);
const z=math.series(50,20,.1,.0001);near(z.xl,10*Math.PI);near(z.xc,100/Math.PI);
let stored='';globalThis.localStorage={getItem:()=>stored,setItem:(_,v)=>{stored=v;}};
const {readProgress,saveProgress,markAnswer}=await load('progress',{"'./content'":JSON.stringify(contentUrl)});
let p=readProgress();markAnswer(p,'s1',false);assert(p.missed.includes('s1'));markAnswer(p,'s1',true,true);assert.equal(p.xp,10);assert(p.missed.includes('s1'));markAnswer(p,'s1',true,false);assert.equal(p.xp,10);assert(!p.missed.includes('s1'));markAnswer(p,'s2',true);assert.equal(p.xp,25);assert.equal(p.solved.length,2);assert.deepEqual(readProgress(),p);
markAnswer(p,'not-a-question',true);assert.equal(p.solved.length,2);
stored='{bad json';assert.equal(readProgress().xp,0);stored=JSON.stringify({solved:['s1','s1','bad'],seen:['sinais','bad'],missed:[],xp:15});assert.deepEqual(readProgress().solved,['s1']);assert.deepEqual(readProgress().seen,['sinais']);
console.log(`Electricity: 13 missions, 69 graded challenges, ${formulaCount} valid formulas, independent source-example calculations, Y/Δ comparisons, decimal input, persistent progress, hint/retry scoring and no XP farming passed.`);
