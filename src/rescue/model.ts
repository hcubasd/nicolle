import Delaunator from 'delaunator';
/** Shared game data and rules. The renderer alone imposes the 128-island cap. */
export const species=['cachorro','gato','lobo','ovelha','porco','tigre','galinha','sapo','morcego','gaivota','passaro','pomba','coelho'] as const;
export const ISLAND_SPACING=220,COST_UNIT=80,TRAVEL_SPEED=340;
export type Species=typeof species[number];
export interface Island {id:number;x:number;y:number;animal:Species;}
export interface Bridge {id:number;a:number;b:number;cost:number;}
export interface Graph {seed:number;islands:Island[];bridges:Bridge[];width:number;height:number;}
export interface Rescue {at:number|null;rescued:Set<number>;bought:Set<number>;spent:number;}
export const emptyRescue=():Rescue=>({at:null,rescued:new Set(),bought:new Set(),spent:0});
export function generateGraph(count:number,seed:number):Graph {
 if(!Number.isSafeInteger(count)||count<1)throw Error('Quantidade de ilhas inválida.');
 let randomState=seed>>>0;
 const random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
 // Unbounded Bridson-style Poisson sampling: islands have a minimum
 // separation, but no rows, columns, or rectangular shoreline.
 const islands:Island[]=[{id:0,x:0,y:0,animal:species[(seed>>>0)%species.length]}];
 const active=[0],cell=ISLAND_SPACING/Math.SQRT2,buckets=new Map<string,number>();
 const bucket=(x:number,y:number)=>`${Math.floor(x/cell)},${Math.floor(y/cell)}`;
 buckets.set(bucket(0,0),0);
 while(islands.length<count){
  if(!active.length)throw Error('Não foi possível distribuir as ilhas.');
  const index=Math.floor(random()*active.length),parent=islands[active[index]];let added=false;
  for(let attempt=0;attempt<30;attempt++){
   const angle=random()*Math.PI*2,radius=ISLAND_SPACING*Math.sqrt(1+3*random());
   const x=parent.x+Math.cos(angle)*radius,y=parent.y+Math.sin(angle)*radius,gx=Math.floor(x/cell),gy=Math.floor(y/cell);let clear=true;
   for(let dx=-2;dx<=2&&clear;dx++)for(let dy=-2;dy<=2;dy++){
    const id=buckets.get(`${gx+dx},${gy+dy}`);if(id!==undefined&&Math.hypot(islands[id].x-x,islands[id].y-y)<ISLAND_SPACING){clear=false;break;}
   }
   if(!clear)continue;
   const id=islands.length;islands.push({id,x,y,animal:species[(id+(seed>>>0))%species.length]});active.push(id);buckets.set(bucket(x,y),id);added=true;break;
  }
  if(!added){active[index]=active[active.length-1];active.pop();}
 }
 const minX=Math.min(...islands.map(i=>i.x)),minY=Math.min(...islands.map(i=>i.y)),padding=160;
 for(const i of islands){i.x+=padding-minX;i.y+=padding-minY;}
 const candidates=new Map<string,{a:number;b:number;length:number}>();
 const add=(a:number,b:number)=>{if(a>b)[a,b]=[b,a];if(a!==b)candidates.set(`${a},${b}`,{a,b,length:Math.hypot(islands[a].x-islands[b].x,islands[a].y-islands[b].y)});};
 if(count===2)add(0,1);
 else if(count>2){
  const mesh=Delaunator.from(islands,p=>p.x,p=>p.y);
  for(let i=0;i<mesh.triangles.length;i+=3){add(mesh.triangles[i],mesh.triangles[i+1]);add(mesh.triangles[i+1],mesh.triangles[i+2]);add(mesh.triangles[i+2],mesh.triangles[i]);}
  if(!mesh.triangles.length)for(let i=1;i<mesh.hull.length;i++)add(mesh.hull[i-1],mesh.hull[i]);
 }
 // Keep the triangulation's local edges and its Euclidean spanning tree.
 // This removes long hull shortcuts without ever disconnecting the world.
 const groups=islands.map(i=>i.id),kept=new Set<string>();
 const ordered=[...candidates.values()].sort((a,b)=>a.length-b.length||a.a-b.a||a.b-b.b);
 for(const e of ordered)if(groups[e.a]!==groups[e.b]){const old=groups[e.b],next=groups[e.a];for(let i=0;i<groups.length;i++)if(groups[i]===old)groups[i]=next;kept.add(`${e.a},${e.b}`);}
 for(const e of ordered){
  if(e.length>ISLAND_SPACING*2.4)continue;
  const a=islands[e.a],b=islands[e.b],dx=b.x-a.x,dy=b.y-a.y;
  const clear=islands.every(p=>{if(p.id===e.a||p.id===e.b)return true;const t=((p.x-a.x)*dx+(p.y-a.y)*dy)/(e.length*e.length);return t<=0||t>=1||Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)>80;});
  if(clear)kept.add(`${e.a},${e.b}`);
 }
 const bridges:Bridge[]=[...candidates.values()].filter(e=>kept.has(`${e.a},${e.b}`)).sort((a,b)=>a.a-b.a||a.b-b.b).map((e,id)=>({id,a:e.a,b:e.b,cost:Math.max(1,Math.round(e.length/COST_UNIT))}));
 return {seed:seed>>>0,islands,bridges,width:Math.max(...islands.map(i=>i.x))+padding,height:Math.max(...islands.map(i=>i.y))+padding};
}
export function startAt(graph:Graph,id:number):Rescue {
 if(!graph.islands[id])throw Error('Ilha inválida.');
 return {at:id,rescued:new Set([id]),bought:new Set(),spent:0};
}
export function frontier(graph:Graph,region:ReadonlySet<number>):Bridge[] {return graph.bridges.filter(e=>region.has(e.a)!==region.has(e.b));}
export function cheapestFrontier(graph:Graph,region:ReadonlySet<number>):Bridge|undefined {
 let best:Bridge|undefined;
 for(const edge of graph.bridges)if(region.has(edge.a)!==region.has(edge.b))if(!best||edge.cost<best.cost||(edge.cost===best.cost&&edge.id<best.id))best=edge;
 return best;
}
/** Prim grows a region, not a nearest-neighbor walk from the player's feet. */
export function prim(graph:Graph,start=0):{bridges:Bridge[];total:number;connected:boolean} {
 if(!graph.islands[start])throw Error('Ilha inicial inválida.');
 const region=new Set([start]),bridges:Bridge[]=[];let total=0;
 while(region.size<graph.islands.length) {
  const next=cheapestFrontier(graph,region);if(!next)break;
  bridges.push(next);total+=next.cost;region.add(next.a);region.add(next.b);
 }
 return {bridges,total,connected:region.size===graph.islands.length};
}
export function remainingCoins(graph:Graph,state:Rescue):number {return prim(graph).total-state.spent;}
export function outcome(graph:Graph,state:Rescue):'playing'|'won'|'lost' {
 if(state.rescued.size===graph.islands.length)return 'won';
 if(state.at===null)return 'playing';
 const edge=cheapestFrontier(graph,state.rescued);
 return !edge||edge.cost>remainingCoins(graph,state)?'lost':'playing';
}
export function buy(graph:Graph,state:Rescue,id:number):Rescue {
 const edge=graph.bridges[id];if(!edge||state.at===null)throw Error('Ponte inválida.');
 if(state.bought.has(id))return state;
 if(edge.cost>remainingCoins(graph,state))throw Error('Saldo insuficiente.');
 if(state.rescued.has(edge.a)===state.rescued.has(edge.b))throw Error('Escolha uma ponte que alcance uma nova ilha.');
 const from=state.rescued.has(edge.a)?edge.a:edge.b;
 if(state.at!==from)throw Error('Caminhe até a origem da ponte antes de comprar.');
 const target=from===edge.a?edge.b:edge.a;
 return {at:target,rescued:new Set([...state.rescued,target]),bought:new Set([...state.bought,id]),spent:state.spent+edge.cost};
}
export function freeRoute(graph:Graph,state:Rescue,destination:number):number[] {
 if(state.at===null||!state.rescued.has(destination))throw Error('Ilha ainda não resgatada.');
 const previous=new Map<number,number|null>([[state.at,null]]),queue=[state.at];
 for(let i=0;i<queue.length&&!previous.has(destination);i++) {
  for(const e of graph.bridges)if(state.bought.has(e.id)) {
   const next=e.a===queue[i]?e.b:e.b===queue[i]?e.a:-1;
   if(next>=0&&!previous.has(next)){previous.set(next,queue[i]);queue.push(next);}
  }
 }
 if(!previous.has(destination))throw Error('Não há caminho comprado até essa ilha.');
 const route:number[]=[];let current:number|null=destination;
 while(current!==null){route.push(current);current=previous.get(current)??null;}
 return route.reverse();
}
export function purchaseRoute(graph:Graph,state:Rescue,edge:Bridge):number[] {
 if(state.rescued.has(edge.a)===state.rescued.has(edge.b))throw Error('Ponte fora da fronteira.');
 const from=state.rescued.has(edge.a)?edge.a:edge.b,to=from===edge.a?edge.b:edge.a;
 return [...freeRoute(graph,state,from),to];
}

export function islandMove(graph:Graph,state:Rescue,destination:number):{route:number[];edge?:Bridge}|undefined {
 if(state.at===null||!graph.islands[destination]||destination===state.at)return;
 if(state.rescued.has(destination))return {route:freeRoute(graph,state,destination)};
 if(outcome(graph,state)!=='playing')return;
 const edge=graph.bridges.find(e=>(e.a===state.at&&e.b===destination)||(e.b===state.at&&e.a===destination));
 if(edge&&!state.bought.has(edge.id)&&edge.cost<=remainingCoins(graph,state))return {route:[state.at,destination],edge};
}

export interface FlightPoint {x:number;y:number;edgeId:number;}
/** First/last half-bridges join the fairy's perch to the purchased network. */
export function bridgeFlightRoute(graph:Graph,state:Rescue,current:FlightPoint,target:Bridge):FlightPoint[] {
 const edge=graph.bridges[current.edgeId];if(!edge)return [];
 const destination=state.rescued.has(target.a)?target.a:target.b;
 const perch={x:(graph.islands[target.a].x+graph.islands[target.b].x)/2,y:(graph.islands[target.a].y+graph.islands[target.b].y)/2,edgeId:target.id};
 let best:FlightPoint[]=[],bestLength=Infinity;
 for(const anchor of [edge.a,edge.b]){
  if(!state.rescued.has(anchor))continue;
  const route=freeRoute(graph,{...state,at:anchor},destination);
  const points:FlightPoint[]=[{x:graph.islands[anchor].x,y:graph.islands[anchor].y,edgeId:edge.id}];
  for(let i=1;i<route.length;i++){
   const bridge=graph.bridges.find(e=>state.bought.has(e.id)&&((e.a===route[i-1]&&e.b===route[i])||(e.b===route[i-1]&&e.a===route[i])))!;
   points.push({x:graph.islands[route[i]].x,y:graph.islands[route[i]].y,edgeId:bridge.id});
  }
  points.push(perch);let length=0,previous=current;
  for(const p of points){length+=Math.hypot(p.x-previous.x,p.y-previous.y);previous=p;}
  if(length<bestLength){bestLength=length;best=points;}
 }
 return best;
}
