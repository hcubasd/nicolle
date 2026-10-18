import type { GameMap } from './maps';
export interface RescueState {
  current: string | null;
  start: string | null;
  rescued: string[];
  purchased: string[];
  total: number;
  moves: number;
}
export function newRescue(): RescueState { return {current:null,start:null,rescued:[],purchased:[],total:0,moves:0}; }
export function startRescue(map: GameMap, island: string): RescueState {
  if(!map.islands.some(i=>i.id===island)) throw Error('Ilha inicial inválida.');
  return {...newRescue(),current:island,start:island,rescued:[island]};
}
export function travel(map: GameMap, state: RescueState, destination: string): RescueState {
  if(!state.current) throw Error('Escolha uma ilha inicial.');
  const edge=map.edges.find(e=>(e.a===state.current&&e.b===destination)||(e.b===state.current&&e.a===destination));
  if(!edge) throw Error('Só é possível viajar para uma ilha vizinha.');
  const paid=state.purchased.includes(edge.id);
  return {...state,current:destination,rescued:state.rescued.includes(destination)?[...state.rescued]:[...state.rescued,destination],purchased:paid?[...state.purchased]:[...state.purchased,edge.id],total:state.total+(paid?0:edge.cost),moves:state.moves+1};
}
// A walking example through the oracle's tree, not another optimization algorithm.
export function exampleWalk(start:string, edges: {a:string;b:string}[], count:number): string[] {
  const route=[start],seen=new Set([start]);
  function visit(island:string):void {
    for(const edge of edges) {
      const next=edge.a===island?edge.b:edge.b===island?edge.a:null;
      if(!next||seen.has(next)||seen.size===count) continue;
      seen.add(next);route.push(next);visit(next);
      if(seen.size<count) route.push(island);
    }
  }
  visit(start);return route;
}
