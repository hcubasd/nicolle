import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/rescue/model.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
const {generateGraph,prim,frontier,cheapestFrontier,startAt,buy,freeRoute,purchaseRoute,emptyRescue,outcome,remainingCoins,islandMove,bridgeFlightRoute,ISLAND_SPACING,COST_UNIT}=await import('data:text/javascript;base64,'+Buffer.from(outputText.replace("'delaunator'",JSON.stringify(import.meta.resolve('delaunator')))).toString('base64'));
function independentMst(graph){const groups=graph.islands.map(i=>i.id);let total=0,count=0;for(const edge of [...graph.bridges].sort((a,b)=>a.cost-b.cost)){const a=groups[edge.a],b=groups[edge.b];if(a!==b){total+=edge.cost;count++;for(let i=0;i<groups.length;i++)if(groups[i]===b)groups[i]=a;}}return {total,count};}
function walkRoute(graph,state,route){assert.equal(route[0],state.at);for(const next of route.slice(1)){assert(graph.bridges.some(e=>state.bought.has(e.id)&&((e.a===state.at&&e.b===next)||(e.b===state.at&&e.a===next))));state={...state,at:next};}return state;}
function crossing(a,b,c,d){const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);return cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0;}
for(const count of [1,2,3,4,8,16,32,64,128,257])for(const seed of [0,1,42,10001,4294967295]){
 const graph=generateGraph(count,seed);assert.deepEqual(graph,generateGraph(count,seed));assert.equal(graph.islands.length,count);assert(graph.bridges.length<3*count);for(const e of graph.bridges){const a=graph.islands[e.a],b=graph.islands[e.b];assert.equal(e.cost,Math.max(1,Math.round(Math.hypot(b.x-a.x,b.y-a.y)/COST_UNIT)));}
 for(let i=0;i<count;i++)for(let j=i+1;j<count;j++)assert(Math.hypot(graph.islands[i].x-graph.islands[j].x,graph.islands[i].y-graph.islands[j].y)>=ISLAND_SPACING-1e-8);
 const reference=independentMst(graph);assert.equal(reference.count,count-1);
 for(const start of new Set([0,Math.floor(count/2),count-1])){const result=prim(graph,start);assert(result.connected);assert.equal(result.total,reference.total);assert.equal(result.bridges.length,count-1);}
 // Straight local bridges have no crossings (shared endpoints are islands).
 if(count<=128)for(let i=0;i<graph.bridges.length;i++)for(let j=i+1;j<graph.bridges.length;j++){const a=graph.bridges[i],b=graph.bridges[j];if([a.a,a.b].some(id=>id===b.a||id===b.b))continue;assert(!crossing(graph.islands[a.a],graph.islands[a.b],graph.islands[b.a],graph.islands[b.b]));}
 let state=startAt(graph,Math.floor(count/2));
 while(state.rescued.size<count){const edge=cheapestFrontier(graph,state.rescued);assert(frontier(graph,state.rescued).some(e=>e.id===edge.id));const route=purchaseRoute(graph,state,edge);state=walkRoute(graph,state,route.slice(0,-1));state=buy(graph,state,edge.id);assert.equal(state.bought.size,state.rescued.size-1);}
 assert.equal(state.spent,reference.total);const cost=state.spent;state=walkRoute(graph,state,freeRoute(graph,state,0));assert.equal(state.spent,cost);assert.equal(state.at,0);
}
const graph=generateGraph(16,777);let state=startAt(graph,0);
while(outcome(graph,state)==='playing'){
 const edges=frontier(graph,state.rescued).filter(e=>e.cost<=remainingCoins(graph,state));
 const edge=edges.sort((a,b)=>b.cost-a.cost)[0];const route=purchaseRoute(graph,state,edge);state=walkRoute(graph,state,route.slice(0,-1));state=buy(graph,state,edge.id);
}
assert.equal(outcome(graph,state),'lost');assert(state.rescued.size<16);assert(remainingCoins(graph,state)>=0);
// Prim always finishes with the exact wallet; a wrong purchase can strand it.
for(const seed of [0,1,42]){const g=generateGraph(128,seed);let s=startAt(g,0);while(outcome(g,s)==='playing'){const e=cheapestFrontier(g,s.rescued),r=purchaseRoute(g,s,e);s=walkRoute(g,s,r.slice(0,-1));s=buy(g,s,e.id);}assert.equal(outcome(g,s),'won');assert.equal(remainingCoins(g,s),0);}
const broke={...startAt(graph,0),spent:prim(graph).total};assert.throws(()=>buy(graph,broke,0));
assert.throws(()=>generateGraph(0,0));assert.throws(()=>generateGraph(2.5,0));assert.throws(()=>startAt(graph,-1));assert.throws(()=>buy(graph,emptyRescue(),0));assert.throws(()=>freeRoute(graph,startAt(graph,0),15));
const disconnected={seed:0,width:1,height:1,islands:[{id:0},{id:1}],bridges:[]};assert.equal(prim(disconnected).connected,false);
assert.equal(generateGraph(1024,2).islands.length,1024);
console.log('Prim: independent MST agreement, every generated size up to 257, all seed/start cases, no crossing bridges, complete rescue/purchases/free return, Poisson spacing and rounded-distance costs, exact Prim budget, loss/overspend rules, invalid moves and no model-level 128 cap passed.');

// New island purchases require being at the bridge's rescued endpoint.
const local=generateGraph(32,123);let current=startAt(local,0);
assert.equal(islandMove(local,current,0),undefined);
const distant=local.islands.find(i=>i.id!==0&&!local.bridges.some(e=>(e.a===0&&e.b===i.id)||(e.b===0&&e.a===i.id)));
assert.equal(islandMove(local,current,distant.id),undefined);
for(let step=0;step<12;step++){
 const e=cheapestFrontier(local,current.rescued),from=current.rescued.has(e.a)?e.a:e.b,to=from===e.a?e.b:e.a;
 if(current.at!==from){const attempt=islandMove(local,current,to);assert(!attempt||attempt.edge.id!==e.id);const move=islandMove(local,current,from);assert(!move.edge);current=walkRoute(local,current,move.route);}
 const move=islandMove(local,current,to);assert.equal(move.edge.id,e.id);assert.deepEqual(move.route,[from,to]);current=buy(local,current,e.id);
}
const before=current.spent,back=islandMove(local,current,0);assert(!back.edge);current=walkRoute(local,current,back.route);assert.equal(current.at,0);assert.equal(current.spent,before);
console.log('Island controls: remote unrescued targets blocked, manual reposition before Prim purchase, arbitrary rescued-island routing and free backtracking passed.');

// The fairy travels on bridge segments, including when retargeted mid-flight.
const flightGraph=generateGraph(32,91);let flightState=startAt(flightGraph,0),oldHint=cheapestFrontier(flightGraph,flightState.rescued);
let perch={x:(flightGraph.islands[oldHint.a].x+flightGraph.islands[oldHint.b].x)/2,y:(flightGraph.islands[oldHint.a].y+flightGraph.islands[oldHint.b].y)/2,edgeId:oldHint.id};
function onEdge(p,e){const a=flightGraph.islands[e.a],b=flightGraph.islands[e.b],dx=b.x-a.x,dy=b.y-a.y,t=((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy);return t>=-1e-8&&t<=1+1e-8&&Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)<1e-7;}
for(let i=0;i<20;i++){
 const route=purchaseRoute(flightGraph,flightState,oldHint);flightState=walkRoute(flightGraph,flightState,route.slice(0,-1));flightState=buy(flightGraph,flightState,oldHint.id);
 const next=cheapestFrontier(flightGraph,flightState.rescued),flight=bridgeFlightRoute(flightGraph,flightState,perch,next);assert(flight.length>=2);
 let previous=perch;
 for(let j=0;j<flight.length;j++){const p=flight[j],edge=flightGraph.bridges[p.edgeId];assert(onEdge(previous,edge)&&onEdge(p,edge));if(j>0&&j<flight.length-1)assert(flightState.bought.has(edge.id));previous=p;}
 // Stop halfway through one segment to exercise the next retarget.
 const midway=flight[Math.floor(flight.length/2)],before=flight[Math.max(0,Math.floor(flight.length/2)-1)];
 perch={x:(midway.x+before.x)/2,y:(midway.y+before.y)/2,edgeId:midway.edgeId};oldHint=next;
}
console.log('Fairy routes: purchased-network travel, endpoint half-bridges and continuous mid-flight retargeting passed.');
