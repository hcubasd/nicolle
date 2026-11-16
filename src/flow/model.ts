export interface Node {name:string;x:number;y:number;}
export interface Edge {a:number;b:number;capacity:number;}
export interface Network {nodes:Node[];edges:Edge[];source:number;sink:number;}
export type Residual=number[][];
export const network:Network={
 nodes:[{name:'Origem',x:120,y:360},{name:'A',x:360,y:140},{name:'B',x:360,y:360},{name:'C',x:360,y:580},{name:'D',x:600,y:140},{name:'E',x:600,y:360},{name:'F',x:600,y:580},{name:'G',x:840,y:220},{name:'H',x:840,y:500},{name:'Destino',x:1080,y:360}],
 edges:[{a:0,b:1,capacity:6},{a:0,b:2,capacity:5},{a:0,b:3,capacity:4},{a:1,b:4,capacity:6},{a:1,b:5,capacity:3},{a:2,b:5,capacity:4},{a:2,b:6,capacity:3},{a:3,b:6,capacity:4},{a:4,b:5,capacity:2},{a:5,b:6,capacity:2},{a:4,b:7,capacity:5},{a:5,b:7,capacity:4},{a:5,b:8,capacity:4},{a:6,b:8,capacity:6},{a:7,b:9,capacity:8},{a:8,b:9,capacity:7}],
 source:0,sink:9,
};
export function createResidual(graph:Network):Residual {
 const r=graph.nodes.map(()=>graph.nodes.map(()=>0));
 for(const edge of graph.edges)r[edge.a][edge.b]=edge.capacity;
 return r;
}
export function nextNodes(r:Residual,path:number[]):number[]{
 const at=path[path.length-1];return r[at].map((capacity,node)=>capacity>0&&!path.includes(node)?node:-1).filter(node=>node>=0);
}
export function bfs(r:Residual,source:number,sink:number):number[]|undefined {
 const queue=[source],parent=new Map<number,number>();parent.set(source,-1);
 for(let i=0;i<queue.length;i++){
  const at=queue[i];if(at===sink){const path:number[]=[];let p=sink;while(p!==-1){path.unshift(p);p=parent.get(p)!;}return path;}
  for(let node=0;node<r.length;node++)if(r[at][node]>0&&!parent.has(node)){parent.set(node,at);queue.push(node);}
 }
 return undefined;
}
export function bottleneck(r:Residual,path:number[]):number {
 let amount=Infinity;for(let i=1;i<path.length;i++)amount=Math.min(amount,r[path[i-1]][path[i]]);return amount;
}
export function sendFlow(r:Residual,path:number[],amount:number):void {
 if(path.length<2||new Set(path).size!==path.length||!Number.isInteger(amount)||amount<=0||amount>bottleneck(r,path))throw Error('Fluxo inválido');
 for(let i=1;i<path.length;i++){r[path[i-1]][path[i]]-=amount;r[path[i]][path[i-1]]+=amount;}
}
// Same flow updates as the game; only the path finder is different.
export function maximumFlow(graph:Network,findPath=bfs):number {
 const r=createResidual(graph);let total=0,path=findPath(r,graph.source,graph.sink);
 while(path){const amount=bottleneck(r,path);sendFlow(r,path,amount);total+=amount;path=findPath(r,graph.source,graph.sink);}
 return total;
}
