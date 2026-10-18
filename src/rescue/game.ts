import {backgroundPan,setStage,invalidateScene,type GlassPanel} from '../scene';
import {startAt,cheapestFrontier,prim,buy,islandMove,outcome,bridgeFlightRoute,TRAVEL_SPEED,type FlightPoint,type Bridge} from './model';
import {session,createSession,saveSession,type Session} from './session';
import {animalStyle,sprites,preloadSprites} from './sprites';
import {Party} from './party';
import {playIslandClick,prepareIslandSound} from './sound';
const menuRoute='#/grafos/prim',gameRoute='#/grafos/prim/jogo';
const asset=(name:string)=>`${import.meta.env.BASE_URL}grafos/${name}.png`;
const spritesReady=preloadSprites();
export function mountRescue(root:HTMLElement,playing=false):()=>void {
 if(playing&&session&&outcome(session.graph,session.state)==='playing')return mountWorld(root,session);
 const status=session?outcome(session.graph,session.state):'playing',finished=status!=='playing';
 const results=finished&&session?`<dl class="round-results"><div><dt>Bichinhos resgatados</dt><dd>${session.state.rescued.size}/${session.graph.islands.length}</dd></div><div><dt>Custo total</dt><dd>${session.state.spent}/${prim(session.graph).total}</dd></div><div><dt>Saldo restante</dt><dd>${prim(session.graph).total-session.state.spent}</dd></div></dl>`:'';
 const lossReason=status==='lost'&&session?`<p class="result-reason">${prim(session.graph).total===session.state.spent?'Seu saldo acabou antes de resgatar todos os bichinhos.':`Seu saldo é de ${prim(session.graph).total-session.state.spent} pontos, mas a ponte mais barata para resgatar outro bichinho custa ${cheapestFrontier(session.graph,session.state.rescued)?.cost??0}.`}</p>`:'';
 const heading=status==='won'?'Vitória!':status==='lost'?'Fim de jogo':'Prim';
 root.innerHTML=`<section class="setup-screen"><a class="back-link glass" data-glass href="#/grafos">← Grafos</a><form class="setup-card glass" data-glass><h1>${heading}</h1>${results}${lossReason}${!session?`<p class="prim-instructions"><span class="menu-fairy" role="img" aria-label="Prim" style="background-image:url('${asset('fairy01')}')"></span><span>Siga Prim, para resgatar todos os bichinhos com o menor custo. Cada ponte é paga uma só vez; atravessar pontes já compradas não custa nada.</span></p>`:''}<label for="island-count">Número de ilhas</label><div class="custom-count"><input id="island-count" name="islands" type="number" inputmode="numeric" step="1" value="${session?.graph.islands.length??4}" required></div><button class="begin-button" type="submit">${finished?'Nova aventura':'Começar'} <span aria-hidden="true">→</span></button>${session&&!finished?'<a class="resume-button" href="'+gameRoute+'">Retomar</a>':''}</form></section>`;
 const form=root.querySelector('form')!,input=root.querySelector<HTMLInputElement>('input')!;
 form.addEventListener('submit',event=>{event.preventDefault();if(form.reportValidity()){const count=Math.max(2,Math.min(128,input.valueAsNumber));input.value=String(count);createSession(count);location.hash=gameRoute;}});
 return()=>{setStage();};
}
function mountWorld(root:HTMLElement,round:Session):()=>void {
 let disposed=false,cleanup:(()=>void)|undefined;
 root.innerHTML='<section class="setup-screen"><p role="status">Preparando a aventura…</p></section>';
 void spritesReady.then(()=>{if(!disposed){cleanup=mountReadyWorld(root,round);invalidateScene();}});
 return()=>{disposed=true;cleanup?.();};
}
function mountReadyWorld(root:HTMLElement,round:Session):()=>void {
 const {graph}=round,reduced=matchMedia('(prefers-reduced-motion: reduce)'),budget=prim(graph).total;
 const middle=(e:Bridge)=>({x:(graph.islands[e.a].x+graph.islands[e.b].x)/2,y:(graph.islands[e.a].y+graph.islands[e.b].y)/2});
 const line=(e:Bridge)=>{const a=graph.islands[e.a],b=graph.islands[e.b],length=Math.hypot(b.x-a.x,b.y-a.y),dx=(b.x-a.x)/length,dy=(b.y-a.y)/length;return `M${a.x+dx*40},${a.y+dy*40} L${b.x-dx*40},${b.y-dy*40}`;};
 root.innerHTML=`<section class="game-screen"><header class="game-head"><a class="game-back glass" data-glass href="${menuRoute}">Menu</a><div class="wallet glass" data-glass aria-label="Saldo restante"><img src="${asset('rupee')}" alt=""><strong id="remaining"></strong></div><div class="rescue-count glass" data-glass aria-label="Bichinhos resgatados"><span aria-hidden="true">♥</span><strong id="rescued"></strong></div></header>
 <div class="map-field" tabindex="0" role="region" aria-label="Mapa de Prim. Arraste para explorar ou use as setas."><div class="world" style="width:${graph.width}px;height:${graph.height}px"><svg class="bridges" width="${graph.width}" height="${graph.height}" viewBox="0 0 ${graph.width} ${graph.height}" aria-hidden="true">${graph.bridges.map(e=>`<path data-line="${e.id}" class="bridge" d="${line(e)}"/>`).join('')}</svg>
 ${graph.bridges.map(e=>{const p=middle(e);return `<span class="bridge-price" data-bridge="${e.id}" style="left:${p.x-22}px;top:${p.y-22}px" aria-label="Ponte de ${e.cost} pontos"><span>${e.cost}</span></span>`;}).join('')}
 ${graph.islands.map(i=>`<button type="button" class="island" data-island="${i.id}" style="left:${i.x-28}px;top:${i.y-28}px" aria-label="${i.animal}"><span class="animal-picture" style="${animalStyle(i.animal)}" aria-hidden="true"></span><span class="rescue-heart" aria-hidden="true">♥</span></button>`).join('')}
 <span class="prim-fairy" role="img" aria-label="Prim: próxima ponte mais barata" style="background-image:url('${asset('fairy01')}')"></span><div class="party-layer" aria-hidden="true"></div></div></div>
<p id="game-status" class="sr-only" role="status" aria-live="polite"></p></section>`;
 const field=root.querySelector<HTMLElement>('.map-field')!,world=root.querySelector<HTMLElement>('.world')!,fairy=root.querySelector<HTMLElement>('.prim-fairy')!;
 const nodes=graph.islands.map(i=>root.querySelector<HTMLElement>(`[data-island="${i.id}"]`)!);
 const prices=graph.bridges.map(e=>root.querySelector<HTMLElement>(`[data-bridge="${e.id}"]`)!);
 const lines=graph.bridges.map(e=>root.querySelector<SVGPathElement>(`[data-line="${e.id}"]`)!);
 const party=new Party(root.querySelector<HTMLElement>('.party-layer')!,()=>reduced.matches);
 if(round.state.at===null)round.state=startAt(graph,0);
 const initial=graph.islands[round.state.at!],point={x:initial.x,y:initial.y};
 party.reset(initial,[...round.state.rescued].map(id=>graph.islands[id]),round.trail,[...round.state.bought].map(id=>{const e=graph.bridges[id];return {a:graph.islands[e.a],b:graph.islands[e.b]};}));
 const camera={x:0,y:0};let box=field.getBoundingClientRect(),needsMeasure=true;
 let pending:{route:number[];index:number;edge?:Bridge}|undefined;
 let hintEdge:Bridge|undefined,changed=true,disposed=false;
 let velocity={x:0,y:0},drag:{id:number;x:number;y:number;startX:number;startY:number;moved:boolean;samples:{x:number;y:number;t:number}[]}|undefined;
 let suppressClick=false,finishTimer:ReturnType<typeof setTimeout>|undefined;
 const panePool:GlassPanel[]=Array.from({length:128},()=>({x:0,y:0,halfWidth:28,halfHeight:28,radius:28})),panels:GlassPanel[]=[];
 const view={pan:{x:0,y:0},panels,changed:true};
 function clamp():void {camera.x=Math.max(-box.width/2,Math.min(graph.width-box.width/2,camera.x));camera.y=Math.max(-box.height/2,Math.min(graph.height-box.height/2,camera.y));}
 function center(x:number,y:number):void {camera.x=x-box.width/2;camera.y=y-box.height/2;clamp();velocity={x:0,y:0};changed=true;}
 hintEdge=cheapestFrontier(graph,round.state.rescued);
 center(point.x,point.y);
 const origin=backgroundPan(),anchor={x:origin.x-camera.x,y:origin.y-camera.y};
 const fairyPoint:FlightPoint={...(hintEdge?middle(hintEdge):point),edgeId:hintEdge?.id??-1};
 let fairyFlight:{points:FlightPoint[];index:number}|undefined;
 function update():void {
  const state=round.state,remaining=budget-state.spent,status=outcome(graph,state),finished=status!=='playing';
  const next=finished?undefined:cheapestFrontier(graph,state.rescued);
  if(next&&next.id!==hintEdge?.id){
   fairyFlight={points:bridgeFlightRoute(graph,state,fairyPoint,next),index:0};
  }
  hintEdge=next;
  root.querySelector('#remaining')!.textContent=String(remaining);root.querySelector('#rescued')!.textContent=`${state.rescued.size}/${graph.islands.length}`;
  root.querySelector('#game-status')!.textContent=pending?'A caminho.':status==='won'?'Todos os bichinhos resgatados.':status==='lost'?'Fim de jogo. As pontos não bastam para a próxima ponte.':hintEdge?`Prim indica a ponte de ${hintEdge.cost} pontos.`:'';
  for(const node of graph.islands){
   const collected=state.rescued.has(node.id),adjacent=graph.bridges.find(e=>(e.a===state.at&&e.b===node.id)||(e.b===state.at&&e.a===node.id));
   const enabled=!pending&&!finished&&node.id!==state.at&&(collected||(!!adjacent&&adjacent.cost<=remaining));
   nodes[node.id].classList.toggle('collected',collected);nodes[node.id].setAttribute('aria-disabled',String(!enabled));nodes[node.id].tabIndex=enabled?0:-1;
   nodes[node.id].setAttribute('aria-label',`${node.id===state.at?'Você está aqui':collected?'Caminhar até':'Resgatar'}: ${node.animal}, ilha ${node.id+1}`);
  }
  for(const edge of graph.bridges) {
   const paid=state.bought.has(edge.id),available=state.rescued.has(edge.a)!==state.rescued.has(edge.b),recommended=hintEdge?.id===edge.id;
   lines[edge.id].setAttribute('class',`bridge ${available&&(edge.a===state.at||edge.b===state.at)?'reachable':''} ${paid?'paid':''}`);
   prices[edge.id].classList.toggle('available',available);prices[edge.id].classList.toggle('paid',paid);prices[edge.id].classList.toggle('recommended',recommended);
   prices[edge.id].setAttribute('aria-label',`Ponte de ${edge.cost} pontos${recommended?', indicada por Prim':''}, ilhas ${edge.a+1} e ${edge.b+1}`);
  }
  fairy.hidden=!hintEdge;
  if(finished&&finishTimer===undefined){
   saveSession();
   // Let the arrival render, then slide left into the result/new-game menu.
   finishTimer=setTimeout(()=>{if(!disposed)location.hash=menuRoute;},350);
  }
  changed=true;invalidateScene();
 }
 function click(event:MouseEvent):void {
  if(suppressClick){event.preventDefault();suppressClick=false;return;}
  const target=(event.target as Element).closest<HTMLElement>('[data-island]');
  if(!target||pending||outcome(graph,round.state)!=='playing')return;
  const move=islandMove(graph,round.state,Number(target.dataset.island));if(!move)return;
  playIslandClick();
  pending={route:move.route,index:1,edge:move.edge};velocity={x:0,y:0};update();
 }
 function down(event:PointerEvent):void {
  if(event.pointerType==='mouse'&&event.button!==0)return;
  prepareIslandSound();
  suppressClick=false;velocity={x:0,y:0};drag={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false,samples:[{x:event.clientX,y:event.clientY,t:event.timeStamp}]};
 }
 function move(event:PointerEvent):void {
  if(event.pointerId!==drag?.id)return;
  if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>6)drag.moved=true;
  if(drag.moved){field.setPointerCapture(event.pointerId);camera.x-=event.clientX-drag.x;camera.y-=event.clientY-drag.y;clamp();changed=true;}
  drag.x=event.clientX;drag.y=event.clientY;drag.samples.push({x:event.clientX,y:event.clientY,t:event.timeStamp});while(drag.samples.length>2&&event.timeStamp-drag.samples[0].t>100)drag.samples.shift();
 }
 function release(event:PointerEvent):void {
  if(event.pointerId!==drag?.id)return;
  if(drag.moved){const first=drag.samples[0],last=drag.samples[drag.samples.length-1],dt=last.t-first.t;if(event.type==='pointerup'&&dt>0&&event.timeStamp-last.t<40)velocity={x:-(last.x-first.x)/dt,y:-(last.y-first.y)/dt};}
  suppressClick=drag.moved;drag=undefined;if(field.hasPointerCapture(event.pointerId))field.releasePointerCapture(event.pointerId);
 }
 function wheel(event:WheelEvent):void {
  if(event.ctrlKey)return;event.preventDefault();velocity={x:0,y:0};const unit=event.deltaMode===1?16:event.deltaMode===2?box.height:1;camera.x+=event.deltaX*unit;camera.y+=event.deltaY*unit;clamp();changed=true;
 }
 function keyboard(event:KeyboardEvent):void {
  const delta=event.shiftKey?160:60;
  if(event.key==='ArrowLeft')camera.x-=delta;else if(event.key==='ArrowRight')camera.x+=delta;else if(event.key==='ArrowUp')camera.y-=delta;else if(event.key==='ArrowDown')camera.y+=delta;else return;
  event.preventDefault();velocity={x:0,y:0};clamp();changed=true;
 }
 function advance(now:number,dt:number):void {
  let remaining=reduced.matches?1e9:dt;
  while(pending&&remaining>0) {
   const target=graph.islands[pending.route[pending.index]],distance=Math.hypot(target.x-point.x,target.y-point.y),isPurchase=!!pending.edge&&pending.index===pending.route.length-1,time=distance/TRAVEL_SPEED*1000;
   if(time<=remaining){point.x=target.x;point.y=target.y;remaining-=time;party.move(point.x,point.y);
    if(isPurchase){round.state=buy(graph,round.state,pending.edge!.id);party.rescue(target,now);}else round.state.at=target.id;
    round.trail=party.snapshot();pending.index++;
    if(pending.index>=pending.route.length){pending=undefined;saveSession();}update();
   }else {const t=remaining/time;point.x+=(target.x-point.x)*t;point.y+=(target.y-point.y)*t;party.move(point.x,point.y);remaining=0;}
  }
 }
 const resize=new ResizeObserver(()=>{needsMeasure=true;changed=true;});resize.observe(field);
 const freshPointer=()=>{suppressClick=false;};
 field.addEventListener('pointerdown',down);field.addEventListener('pointermove',move);field.addEventListener('pointerup',release);field.addEventListener('pointercancel',release);field.addEventListener('wheel',wheel,{passive:false});field.addEventListener('keydown',keyboard);root.addEventListener('pointerdown',freshPointer,true);root.addEventListener('click',click);
 setStage((now,dt)=>{
  if(disposed)return view;
  const measured=field.getBoundingClientRect();
  if(needsMeasure||measured.left!==box.left||measured.top!==box.top||measured.width!==box.width||measured.height!==box.height){box=measured;needsMeasure=false;clamp();changed=true;}
  if(pending){advance(now,dt);changed=true;}
  if(!drag&&(velocity.x||velocity.y)){const decay=Math.pow(.998,dt),travel=(decay-1)/Math.log(.998),x=camera.x,y=camera.y;camera.x+=velocity.x*travel;camera.y+=velocity.y*travel;clamp();velocity.x=camera.x===x?0:velocity.x*decay;velocity.y=camera.y===y?0:velocity.y*decay;if(Math.hypot(velocity.x,velocity.y)/-Math.log(.998)<.5/(devicePixelRatio||1))velocity={x:0,y:0};changed=true;}
  world.style.transform=`translate(${-camera.x}px,${-camera.y}px)`;
  panels.length=0;const clip={x:box.left,y:box.top,width:box.width,height:box.height};
  for(const island of graph.islands){const x=island.x-camera.x,y=island.y-camera.y,visible=x>-40&&x<box.width+40&&y>-40&&y<box.height+40;nodes[island.id].hidden=!visible;if(!visible)continue;const panel=panePool[panels.length];if(!panel)throw Error('Island visibility exceeds glass budget');panel.x=box.left+x;panel.y=box.top+y;panel.clip=clip;panels.push(panel);
   if(visible&&!round.state.rescued.has(island.id)){const sprite=nodes[island.id].querySelector<HTMLElement>('.animal-picture')!;sprite.style.backgroundPosition=`${(reduced.matches?0:Math.floor(now/150)%4)*-sprites[island.animal].width}px 0`;}
  }
  for(const edge of graph.bridges){const p=middle(edge);prices[edge.id].hidden=round.state.bought.has(edge.id)||p.x<camera.x-30||p.x>camera.x+box.width+30||p.y<camera.y-30||p.y>camera.y+box.height+30;}
  let flightRemaining=reduced.matches?Infinity:dt*TRAVEL_SPEED/1000;
  while(fairyFlight&&flightRemaining>0){
   const target=fairyFlight.points[fairyFlight.index];
   if(!target){fairyFlight=undefined;break;}
   const distance=Math.hypot(target.x-fairyPoint.x,target.y-fairyPoint.y),step=Math.min(distance,flightRemaining);
   if(distance>0){fairyPoint.x+=(target.x-fairyPoint.x)*step/distance;fairyPoint.y+=(target.y-fairyPoint.y)*step/distance;}
   fairyPoint.edgeId=target.edgeId;flightRemaining-=step;changed=true;
   if(step===distance){fairyFlight.index++;if(fairyFlight.index===fairyFlight.points.length)fairyFlight=undefined;}else break;
  }
  if(hintEdge){fairy.style.transform=`translate(${fairyPoint.x-16}px,${fairyPoint.y-57}px)`;fairy.style.backgroundPosition=`${(reduced.matches?0:Math.floor(now/150)%4)*-32}px 0`;}
  party.draw(now,camera,box.width,box.height);
  view.pan.x=anchor.x+camera.x;view.pan.y=anchor.y+camera.y;view.changed=changed;changed=false;return view;
 });
 update();
 return()=>{disposed=true;clearTimeout(finishTimer);resize.disconnect();saveSession();setStage();root.removeEventListener('click',click);root.removeEventListener('pointerdown',freshPointer,true);field.removeEventListener('pointerdown',down);field.removeEventListener('pointermove',move);field.removeEventListener('pointerup',release);field.removeEventListener('pointercancel',release);field.removeEventListener('wheel',wheel);field.removeEventListener('keydown',keyboard);};
}
