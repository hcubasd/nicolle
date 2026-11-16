import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/flow/model.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
const {network,createResidual,bfs,nextNodes,bottleneck,sendFlow,maximumFlow}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
// Independent certificate: enumerate all source/sink cuts of this fixed map.
let minCut=Infinity;
for(let mask=0;mask<2**network.nodes.length;mask++){
 if(!(mask&(1<<network.source))||(mask&(1<<network.sink)))continue;
 let capacity=0;for(const e of network.edges)if((mask&(1<<e.a))&&!(mask&(1<<e.b)))capacity+=e.capacity;
 minCut=Math.min(minCut,capacity);
}
assert.equal(minCut,15);assert.equal(maximumFlow(network),minCut);
function invariant(r,score,g=network){
 const net=g.nodes.map(()=>0);
 for(const e of g.edges){const f=e.capacity-r[e.a][e.b];assert(f>=0&&f<=e.capacity);assert.equal(r[e.b][e.a],f);net[e.a]+=f;net[e.b]-=f;}
 for(let i=0;i<net.length;i++)assert.equal(net[i],i===g.source?score:i===g.sink?-score:0);
}
const original=JSON.stringify(network);let sawReverse=false;
for(let seed=1;seed<=100;seed++){
 let random=seed;const rng=()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random/2**32;};
 const r=createResidual(network);let total=0;const routes=[];
 function choose(path){if(path.at(-1)===network.sink)return path;const options=nextNodes(r,path).map(id=>({id,key:rng()})).sort((a,b)=>a.key-b.key);for(const {id} of options){const result=choose([...path,id]);if(result)return result;}return undefined;}
 while(total<minCut){
  const path=choose([network.source]);assert(path);routes.push(path);
  for(let i=1;i<path.length;i++)if(!network.edges.some(e=>e.a===path[i-1]&&e.b===path[i]))sawReverse=true;
  const qty=bottleneck(r,path);assert(qty>0&&Number.isInteger(qty));
  // UI sends one animal at a time; conservation must hold after every arrival.
  for(let unit=0;unit<qty;unit++){sendFlow(r,path,1);total++;invariant(r,total);}
  assert(routes.length<=15);
 }
 assert.equal(bfs(r,network.source,network.sink),undefined);
 if(seed===1)writeFileSync('/tmp/nicolle-flow-test-routes.json',JSON.stringify({network,routes,target:minCut}));
}
assert(sawReverse);assert.equal(JSON.stringify(network),original);
const r=createResidual(network),saved=JSON.stringify(r);let path=[0,1];path.pop();assert.deepEqual(path,[0]);assert.equal(JSON.stringify(r),saved);
assert(!nextNodes(r,[0,1]).includes(0));assert.throws(()=>sendFlow(r,[0,1,0],1));assert.throws(()=>sendFlow(r,[0,1],7));
// Force the canonical cancellation case: S-A-C-T then S-B-C-A-D-E-T.
const example={nodes:Array.from({length:7},()=>({name:'',x:0,y:0})),source:0,sink:6,edges:[{a:0,b:1,capacity:1},{a:0,b:2,capacity:1},{a:1,b:3,capacity:1},{a:1,b:4,capacity:1},{a:2,b:3,capacity:1},{a:3,b:6,capacity:1},{a:4,b:5,capacity:1},{a:5,b:6,capacity:1}]};
const er=createResidual(example);sendFlow(er,[0,1,3,6],1);sendFlow(er,[0,2,3,1,4,5,6],1);invariant(er,2,example);assert.equal(er[1][3],1);assert.equal(maximumFlow(example),2);
console.log('Flow: min-cut certificate 15; 100 player-route sequences reach maximum; per-animal conservation, cancellation, undo, cycle exclusion and independent solver state passed.');
