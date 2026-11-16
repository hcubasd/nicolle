import {setStage,invalidateScene} from '../scene';
import {preloadSprites,animalAsset,sprites} from '../rescue/sprites';
import {spriteBounds} from '../rescue/sprite-bounds';
import type {Species} from '../rescue/model';
import {playIslandClick,prepareIslandSound} from '../rescue/sound';
import {network as graph,createResidual,nextNodes,bottleneck,sendFlow,maximumFlow} from './model';
const menu='#/grafos/fluxos',game='#/grafos/fluxos/jogo';
const ready=preloadSprites();
const species:Species[]=['gato','cachorro','coelho','sapo','pomba','galinha'];
export function mountFlow(root:HTMLElement,playing:boolean):()=>void {
 if(!playing){
  root.innerHTML=`<section class="setup-screen"><header class="game-head"><a class="glass" data-glass href="#/grafos">← Grafos</a></header><section class="setup-card glass" data-glass><h1>Fluxos máximos</h1><p class="flow-instructions">Caminhe da Origem ao Destino. Ao chegar, os bichinhos percorrem a rota: a menor capacidade do caminho determina quantos passam e quantos pontos você ganha.</p><p class="flow-instructions">Setas contínuas mostram a capacidade disponível. Setas tracejadas são virtuais: usá-las cancela parte de um fluxo anterior para reorganizar a rede. Os números sempre mostram a capacidade restante.</p><p class="flow-instructions">Desfazer apaga seu último passo sem mudar o fluxo. Depois de cada entrega, o jogador volta gratuitamente à Origem. Alcance a meta para vencer. Arraste o mapa para explorar.</p><a class="begin-button" href="${game}">Começar <span aria-hidden="true">→</span></a></section></section>`;
  return()=>{};
 }
 let disposed=false,cleanup:(()=>void)|undefined;
 root.innerHTML='<section class="setup-screen"><p role="status">Preparando o mapa…</p></section>';
 void ready.then(()=>{if(!disposed){cleanup=mountMap(root);invalidateScene();}});
 return()=>{disposed=true;cleanup?.();};
}
function mountMap(root:HTMLElement):()=>void {
 const residual=createResidual(graph),target=maximumFlow(graph),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let path=[graph.source],score=0,round=1,phase:'choose'|'walk'|'deliver'|'return'|'won'='choose';
 let pending:number|undefined,amount=0,delivered=0,deliveryTime=0,disposed=false;
 const camera={x:0,y:0},player={x:graph.nodes[0].x,y:graph.nodes[0].y};
 let returnPath:number[]=[],returnIndex=0,lastMessage='Escolha a próxima ilha.';
 interface Actor {element:HTMLElement;kind:Species|'human';x:number;y:number;}
 const actors:Actor[]=[],arrivals:Actor[]=[];
 root.innerHTML=`<section class="game-screen flow-screen"><header class="game-head flow-head"><a class="glass" data-glass href="${menu}">Menu</a><button class="glass flow-undo" data-glass type="button">Desfazer</button><div class="glass flow-score" data-glass aria-label="Fluxo total e meta"><strong id="flow-score">0 / ${target}</strong></div></header><div class="map-field flow-map" tabindex="0" role="region" aria-label="Rede de fluxo. Arraste para explorar; use as setas para mover o mapa."><div class="world flow-world" style="width:1260px;height:760px"><svg class="bridges" width="1260" height="760" viewBox="0 0 1260 760" aria-hidden="true"><defs><marker id="flow-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8z" fill="currentColor"/></marker></defs></svg>${graph.nodes.map((n,i)=>`<button type="button" class="island flow-island" data-glass data-glass-clip data-flow-node="${i}" style="left:${n.x-28}px;top:${n.y-28}px" aria-label="${n.name}"><span>${i===graph.source?'◎':i===graph.sink?'♡':n.name}</span></button><span class="flow-node-name" style="left:${n.x}px;top:${n.y+34}px">${i===graph.source||i===graph.sink?n.name:''}</span>`).join('')}<div class="flow-actors" aria-hidden="true"></div></div></div><footer class="flow-note glass" data-glass><div><p id="flow-message" role="status" aria-live="polite"></p><p class="flow-route"></p></div><button class="flow-locate" type="button">Ver jogador</button></footer><section class="flow-victory glass" data-glass hidden aria-labelledby="flow-victory-title"><h1 id="flow-victory-title">Vitória!</h1><p>Você alcançou o fluxo máximo: <strong>${target}</strong>.</p><p id="flow-rounds"></p><a class="begin-button" href="${menu}">Jogar novamente <span aria-hidden="true">→</span></a><a class="resume-button" href="#/grafos">← Grafos</a></section></section>`;
 const field=root.querySelector<HTMLElement>('.map-field')!,world=root.querySelector<HTMLElement>('.world')!,svg=root.querySelector('svg')!,layer=root.querySelector<HTMLElement>('.flow-actors')!;
 const undo=root.querySelector<HTMLButtonElement>('.flow-undo')!,message=root.querySelector<HTMLElement>('#flow-message')!,route=root.querySelector<HTMLElement>('.flow-route')!;
 const nodes=[...root.querySelectorAll<HTMLButtonElement>('[data-flow-node]')];
 const links: {a:number;b:number;reverse:boolean;line:SVGPathElement;label:HTMLElement}[]=[];
 for(const edge of graph.edges)for(const reverse of [false,true]){
  const a=reverse?edge.b:edge.a,b=reverse?edge.a:edge.b,start=graph.nodes[a],end=graph.nodes[b];
  const dx=end.x-start.x,dy=end.y-start.y,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
  // Separate the two directions on the same physical bridge.
  const ox=-uy*7,oy=ux*7;
  const line=document.createElementNS('http://www.w3.org/2000/svg','path');
  line.setAttribute('d',`M${start.x+ux*40+ox},${start.y+uy*40+oy} L${end.x-ux*40+ox},${end.y-uy*40+oy}`);line.setAttribute('marker-end','url(#flow-arrow)');svg.append(line);
  const label=document.createElement('span');label.className='flow-capacity';label.style.left=`${(start.x+end.x)/2-uy*23}px`;label.style.top=`${(start.y+end.y)/2+ux*23}px`;world.append(label);
  links.push({a,b,reverse,line,label});
 }
 function actor(kind:Species|'human'):Actor {
  const element=document.createElement('span'),size=kind==='human'?{width:40,height:60}:sprites[kind];
  element.className='traveler';element.style.width=`${size.width}px`;element.style.height=`${size.height}px`;element.style.backgroundImage=`url('${kind==='human'?`${import.meta.env.BASE_URL}grafos/gunner02.png`:animalAsset(kind)}')`;layer.append(element);
  return {element,kind,x:0,y:0};
 }
 const human=actor('human');
 function drawActor(a:Actor,x:number,y:number,now:number,moving:boolean):void {
  const size=a.kind==='human'?{width:40,height:60}:sprites[a.kind],bounds=spriteBounds[a.kind],human=a.kind==='human',scale=human?1.25:1;
  const dx=x-a.x,dy=y-a.y,row=moving?(Math.abs(dx)>Math.abs(dy)?dx>0?2:1:dy>0?0:3):0,frame=moving&&!reduced.matches?Math.floor(now/140)%4:0;
  a.element.style.transform=`translate(${x-(bounds.left+bounds.right)/2*scale}px,${y-(human?bounds.bottom*scale:(bounds.top+bounds.bottom)/2)}px)`;
  a.element.style.backgroundPosition=`${-frame*size.width}px ${-row*size.height}px`;a.element.style.zIndex=String(Math.round(y));a.x=x;a.y=y;
 }
 let box=field.getBoundingClientRect();
 function clamp():void {camera.x=Math.max(-box.width/2+80,Math.min(1260-box.width/2,camera.x));camera.y=Math.max(-box.height/2+60,Math.min(760-box.height/2,camera.y));}
 function locate():void {camera.x=player.x-box.width/2;camera.y=player.y-box.height/2;clamp();invalidateScene();}
 locate();
 if(box.width>=1150){camera.x=600-box.width/2;clamp();}
 function update():void {
  const at=path[path.length-1],options=nextNodes(residual,path),choosing=phase==='choose';
  undo.disabled=!choosing||path.length===1;
  for(let i=0;i<nodes.length;i++){
   const available=choosing&&options.includes(i);nodes[i].disabled=!available;
   nodes[i].classList.toggle('flow-available',available);nodes[i].classList.toggle('flow-current',i===at);
   nodes[i].setAttribute('aria-label',`${graph.nodes[i].name}${available?`, capacidade ${residual[at][i]}`:''}`);
  }
  for(const link of links){
   const capacity=residual[link.a][link.b],selected=path.some((n,i)=>n===link.a&&path[i+1]===link.b);
   link.line.style.display=capacity>0?'':'none';link.label.hidden=capacity<=0;
   link.line.setAttribute('class',`flow-edge ${link.reverse?'flow-reverse':''} ${selected?'flow-selected':''} ${choosing&&link.a===at&&options.includes(link.b)?'flow-available-edge':''}`);
   link.label.textContent=String(capacity);link.label.classList.toggle('flow-reverse-capacity',link.reverse);
  }
  root.querySelector('#flow-score')!.textContent=`${score} / ${target}`;
  message.textContent=lastMessage;
  route.textContent=`${phase==='won'?'Concluído':`Rodada ${round}`} · ${path.map(id=>graph.nodes[id].name).join(' → ')}`;
  invalidateScene();
 }
 function walk(to:number):void {pending=to;phase='walk';lastMessage='Selecionando a rota. As capacidades ainda não mudam.';update();}
 function beginDelivery():void {
  amount=bottleneck(residual,path);delivered=0;deliveryTime=0;phase='deliver';
  for(let i=0;i<amount;i++){const a=actor(species[(score+i)%species.length]);a.element.hidden=true;actors.push(a);}
  lastMessage=`Gargalo: ${amount}. Cada bichinho que chega acrescenta 1 ao fluxo.`;update();
 }
 function click(event:MouseEvent):void {
  if(drag?.moved||suppress){suppress=false;return;}
  const node=(event.target as Element).closest<HTMLElement>('[data-flow-node]');
  if(!node||phase!=='choose')return;
  const to=Number(node.dataset.flowNode);if(!nextNodes(residual,path).includes(to))return;
  playIslandClick();path.push(to);walk(to);
 }
 function back():void {if(phase==='choose'&&path.length>1){path.pop();walk(path[path.length-1]);}}
 function stepToward(to:{x:number;y:number},dt:number,speed:number):boolean {
  const dx=to.x-player.x,dy=to.y-player.y,d=Math.hypot(dx,dy),step=reduced.matches?d:dt*speed/1000;
  if(d<=step){player.x=to.x;player.y=to.y;return true;}
  player.x+=dx/d*step;player.y+=dy/d*step;return false;
 }
 function routePoint(distance:number):{x:number;y:number;finished:boolean}{
  for(let i=1;i<path.length;i++){const a=graph.nodes[path[i-1]],b=graph.nodes[path[i]],d=Math.hypot(b.x-a.x,b.y-a.y);if(distance<d)return{x:a.x+(b.x-a.x)*distance/d,y:a.y+(b.y-a.y)*distance/d,finished:false};distance-=d;}
  return {...graph.nodes[graph.sink],finished:true};
 }
 let drag:{id:number;x:number;y:number;sx:number;sy:number;moved:boolean}|undefined,suppress=false;
 function down(e:PointerEvent):void {if(e.pointerType==='mouse'&&e.button!==0)return;prepareIslandSound();suppress=false;drag={id:e.pointerId,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,moved:false};}
 function move(e:PointerEvent):void {if(drag?.id!==e.pointerId)return;if(Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>6)drag.moved=true;if(drag.moved){field.setPointerCapture(e.pointerId);camera.x-=e.clientX-drag.x;camera.y-=e.clientY-drag.y;clamp();}drag.x=e.clientX;drag.y=e.clientY;}
 function release(e:PointerEvent):void {if(drag?.id!==e.pointerId)return;suppress=drag.moved;drag=undefined;if(field.hasPointerCapture(e.pointerId))field.releasePointerCapture(e.pointerId);}
 function wheel(e:WheelEvent):void {if(e.ctrlKey)return;e.preventDefault();const unit=e.deltaMode===1?16:e.deltaMode===2?box.height:1;camera.x+=e.deltaX*unit;camera.y+=e.deltaY*unit;clamp();}
 function key(e:KeyboardEvent):void {let dx=0,dy=0;if(e.key==='ArrowLeft')dx=-80;else if(e.key==='ArrowRight')dx=80;else if(e.key==='ArrowUp')dy=-80;else if(e.key==='ArrowDown')dy=80;else return;e.preventDefault();camera.x+=dx;camera.y+=dy;clamp();}
 field.addEventListener('pointerdown',down);field.addEventListener('pointermove',move);field.addEventListener('pointerup',release);field.addEventListener('pointercancel',release);field.addEventListener('wheel',wheel,{passive:false});field.addEventListener('keydown',key);root.addEventListener('click',click);undo.addEventListener('click',back);root.querySelector('.flow-locate')!.addEventListener('click',locate);
 update();
 setStage((now,dt)=>{
  if(disposed)return{changed:false};
  box=field.getBoundingClientRect();clamp();
  let moving=false;
  if(phase==='walk'&&pending!==undefined){moving=true;if(stepToward(graph.nodes[pending],dt,420)){pending=undefined;if(path[path.length-1]===graph.sink)beginDelivery();else{phase='choose';lastMessage=nextNodes(residual,path).length?'Escolha a próxima ilha ou desfaça um passo.':'Sem saída por aqui. Desfaça um passo para tentar outra rota.';update();}}}
  if(phase==='deliver'){
   deliveryTime+=dt;
   for(let i=delivered;i<actors.length;i++){
    const elapsed=deliveryTime-i*180;if(elapsed<0)continue;
    const a=actors[i],p=routePoint(reduced.matches?Infinity:elapsed*.8);a.element.hidden=false;drawActor(a,p.x,p.y,now,!p.finished);
    if(p.finished){sendFlow(residual,path,1);score++;delivered++;arrivals.push(a);update();}
   }
   if(delivered===amount){
    actors.length=0;
    if(score===target){phase='won';lastMessage='Fluxo máximo alcançado!';field.hidden=true;root.querySelector<HTMLElement>('.flow-head')!.hidden=true;root.querySelector<HTMLElement>('.flow-victory')!.hidden=false;root.querySelector('#flow-rounds')!.textContent=`${round} rotas completas. Nenhuma capacidade foi gasta ao caminhar.`;field.inert=true;root.querySelector<HTMLElement>('.flow-note')!.hidden=true;root.querySelector<HTMLElement>('.flow-victory a')!.focus({preventScroll:true});update();}
    else{phase='return';returnPath=[...path].reverse();returnIndex=1;lastMessage=`+${amount} pontos. Voltando à Origem sem alterar as capacidades.`;update();}
   }
  }
  if(phase==='return'){moving=true;if(stepToward(graph.nodes[returnPath[returnIndex]],dt,850)){returnIndex++;if(returnIndex===returnPath.length){phase='choose';path=[graph.source];round++;lastMessage='Nova rota. Setas tracejadas permitem reorganizar fluxos anteriores.';update();}}}
  world.style.transform=`translate(${-camera.x}px,${-camera.y}px)`;
  drawActor(human,player.x,player.y,now,moving);
  for(let i=0;i<arrivals.length;i++)drawActor(arrivals[i],graph.nodes[graph.sink].x-56+(i%5)*28,graph.nodes[graph.sink].y+70+Math.floor(i/5)*30,now,false);
  for(let i=0;i<nodes.length;i++){const n=graph.nodes[i];nodes[i].hidden=n.x<camera.x-40||n.x>camera.x+box.width+40||n.y<camera.y-40||n.y>camera.y+box.height+40;}
  return{changed:true};
 });
 return()=>{disposed=true;setStage();root.removeEventListener('click',click);field.removeEventListener('pointerdown',down);field.removeEventListener('pointermove',move);field.removeEventListener('pointerup',release);field.removeEventListener('pointercancel',release);field.removeEventListener('wheel',wheel);field.removeEventListener('keydown',key);};
}
