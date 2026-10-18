import { kruskal } from './core';
import { maps, type GameMap } from './maps';
import { geometry } from './geometry';
import { newRescue, startRescue, travel, exampleWalk, type RescueState } from './rescue';
const saved={map:0,state:newRescue(),oracle:false};
const asset=(file:string)=>`${import.meta.env.BASE_URL}grafos/${file}`;
export function gamePage():string {
  return `<main class="page game-page"><a class="back-link" href="#/grafos">← Roadmap de Grafos</a><div class="page-heading"><p class="eyebrow">Trabalho · entrega em 13 de outubro</p><h1 id="view-title" tabindex="-1">Resgate dos Bichinhos</h1><p class="subtitle">Uma aventura de ilha em ilha. Compre caminhos, encontre os animais e leve uma pequena turma com você.</p><p class="subtitle"><a href="#/grafos/kruskal/aula">Construir o jogo em Python →</a> · <a href="#/grafos/kruskal/laboratorio">Ver Kruskal passo a passo →</a></p></div><div id="game-root"></div><section class="lesson-panel glass" data-glass><h2>O que o oráculo resolve?</h2><p>Você decide por onde andar. Um caminho custa moedas na primeira travessia; depois é gratuito nos dois sentidos. Recolha todos os animais gastando o mínimo possível. Pode começar em qualquer ilha.</p><p>Kruskal revela a <strong>rede mais barata para comprar</strong>, não a ordem de caminhada. Como podemos voltar sem pagar, uma árvore geradora mínima permite visitar todas as ilhas. O oráculo não compra caminhos nem move o personagem: você segue a dica.</p><p><a href="${asset('resgate.py')}" download>Jogo completo em Python ↓</a> · <a href="${asset('kruskal.py')}" download>Só o algoritmo ↓</a> · <a href="${asset('agm.pdf')}" target="_blank" rel="noopener">Slides da disciplina ↗</a></p></section></main>`;
}
interface TrailPoint {x:number;y:number;distance:number}
interface Actor {element:HTMLElement;id:string;previous:{x:number;y:number};joined:number;from:{x:number;y:number};width:number;height:number}
export function mountGame(root:HTMLElement):()=>void {
  let animation=0,disposed=false,moving=false;
  let trail:TrailPoint[]=[],actors:Actor[]=[];
  let motion:{start:number;duration:number;path:SVGPathElement;length:number;reverse:boolean;next:RescueState;destination:string}|undefined;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const map=()=>maps[saved.map];
  const island=(id:string)=>map().islands.find(i=>i.id===id)!;
  const won=()=>saved.state.rescued.length===map().islands.length;
  const solution=()=>kruskal(map().islands.map(i=>i.id),map().edges);
  function seedTrail():void {
    if(!saved.state.current) {trail=[];return;}
    const point=island(saved.state.current);
    trail=[{x:point.x,y:point.y+180,distance:0},{x:point.x,y:point.y,distance:180}];
  }
  function addPoint(x:number,y:number):void {
    const last=trail[trail.length-1];
    if(!last) {trail.push({x,y,distance:0});return;}
    const distance=last.distance+Math.hypot(x-last.x,y-last.y);
    if(distance>last.distance) trail.push({x,y,distance});
    // Only the recent tail is needed, even if the player travels many times.
    while(trail.length>2 && trail[1].distance<distance-500) trail.shift();
  }
  function pointAt(distance:number):{x:number;y:number} {
    for(let i=1;i<trail.length;i++) {
      const a=trail[i-1],b=trail[i];
      if(b.distance>=distance) {const t=Math.max(0,Math.min(1,(distance-a.distance)/(b.distance-a.distance||1)));return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}
    }
    return trail[trail.length-1]||{x:0,y:0};
  }
  function partyHtml():string {
    if(!saved.state.current) return '';
    return `<div class="walk-sprite human-sprite" data-party="human" style="background-image:url('${asset('gunner02.png')}')" aria-hidden="true"></div>`+saved.state.rescued.map(id=>`<div class="walk-sprite animal-sprite" data-party="${id}" style="background-image:url('${asset(`animals/${island(id).animal}.png`)}')" aria-hidden="true"></div>`).join('');
  }
  function bindActors(newAnimal?:string):void {
    const now=performance.now(),head=trail[trail.length-1]||{x:0,y:0};
    actors=[...root.querySelectorAll<HTMLElement>('[data-party]')].map(element=>{
      const css=getComputedStyle(element),id=element.dataset.party!;
      return {element,id,previous:{x:head.x,y:head.y},joined:id===newAnimal?now:0,from:{x:head.x,y:head.y},width:parseFloat(css.width),height:parseFloat(css.height)};
    });
    updateActors(now,!moving&&!newAnimal);
  }
  function updateActors(now:number,settle=false):boolean {
    if(!trail.length) return false;
    let joining=false;
    const distance=trail[trail.length-1].distance;
    actors.forEach((actor,index)=>{
      let point=pointAt(distance-index*34);
      if(actor.joined && !reduced.matches) {
        const t=Math.min(1,(now-actor.joined)/650);
        if(t<1) {joining=true;point={x:actor.from.x+(point.x-actor.from.x)*t,y:actor.from.y+(point.y-actor.from.y)*t};}
      }
      const dx=point.x-actor.previous.x,dy=point.y-actor.previous.y;
      const walking=!settle&&Math.hypot(dx,dy)>.08;
      const row=walking?(Math.abs(dx)>Math.abs(dy)?dx>0?2:1:dy>0?0:3):0;
      const frame=walking&&!reduced.matches?Math.floor(now/150)%4:0;
      actor.element.style.left=`${point.x/8}%`;actor.element.style.top=`${point.y/5.6}%`;
      actor.element.style.zIndex=String(Math.round(point.y*10)+(index===0?1:0));
      actor.element.style.backgroundPosition=`${-frame*actor.width}px ${-row*actor.height}px`;
      actor.previous=point;
    });
    return joining;
  }
  function status():string {
    const state=saved.state;
    if(!state.current) return 'Escolha uma ilha para começar. Seu primeiro bichinho já entra na turma.';
    if(moving) return `Caminhando até ${motion?.destination}. Os bichinhos vão seguindo você…`;
    if(won()) {
      const minimum=solution().total;
      return state.total===minimum?`Todos resgatados! Você gastou ${state.total} moedas: o menor custo possível. ♥`:`Todos resgatados! Você gastou ${state.total} moedas. O oráculo encontra uma rede de ${minimum}: tente uma nova aventura.`;
    }
    return `Você está em ${state.current}, com ${state.rescued.length} bichinho${state.rescued.length===1?'':'s'}. Escolha uma ilha vizinha; um caminho já comprado custa 0.`;
  }
  function draw(newAnimal?:string,focus?:string):void {
    const m=map(),state=saved.state,oracle=solution();
    const neighbors=m.edges.filter(e=>e.a===state.current||e.b===state.current);
    const available=new Set(neighbors.map(e=>e.a===state.current?e.b:e.a));
    root.innerHTML=`<div class="game-toolbar glass" data-glass><label>Mapa <select id="game-map">${maps.map((item,i)=>`<option value="${i}" ${i===saved.map?'selected':''}>${item.title}</option>`).join('')}</select></label><div class="game-actions"><button class="oracle-button" data-action="oracle" aria-expanded="${saved.oracle}" ${moving?'disabled':''}>★ ${saved.oracle?'Ocultar dica de Kruskal':'Oráculo: consultar Kruskal'}</button><button data-action="reset">Recomeçar</button></div></div>
    <section class="game-feedback glass" data-glass><div class="network-stats"><span><strong>${state.total}</strong> moedas gastas</span><span><strong>${state.rescued.length}/${m.islands.length}</strong> bichinhos</span><span><strong>${state.current||'—'}</strong> sua ilha</span></div><p role="status" aria-live="polite">${status()}</p><div class="rescued-list" aria-label="Bichinhos resgatados">${state.rescued.map(id=>`<span>${island(id).name} · ${id}</span>`).join('')||'<span>A turma começa na ilha que você escolher.</span>'}</div></section>

    <div class="island-board rescue-board" aria-label="Ilhas e caminhos"><svg viewBox="0 0 800 560" aria-hidden="true"><defs><mask id="rescue-edge-mask"><rect width="800" height="560" fill="white"/>${m.islands.map(i=>`<circle data-mask-island="${i.id}" cx="${i.x}" cy="${i.y}" r="80" fill="black"/>`).join('')}</mask></defs><g mask="url(#rescue-edge-mask)">${m.edges.map(e=>`<path id="rescue-path-${e.id}" d="${geometry(m,e.a,e.b).path}" class="bridge ${neighbors.some(n=>n.id===e.id)?'available-path':''} ${state.purchased.includes(e.id)?'built':saved.oracle&&oracle.edges.some(o=>o.id===e.id)?'oracle-path':''}"/>`).join('')}</g>${m.edges.map(e=>{const g=geometry(m,e.a,e.b);return `<text class="path-price" x="${g.x}" y="${g.y}" text-anchor="middle">${state.purchased.includes(e.id)?'✓':e.cost}</text>`;}).join('')}</svg>
    ${m.islands.map(i=>`<div class="island-position" style="left:${i.x/8}%;top:${i.y/5.6}%"><button class="island glass ${state.current===i.id?'current-island':''}" data-glass data-island="${i.id}" ${moving||won()||(!!state.current&&!available.has(i.id))?'disabled':''} aria-label="${!state.current?'Começar na ilha':available.has(i.id)?'Viajar para a ilha':'Ilha'} ${i.id}, ${i.name}">${state.rescued.includes(i.id)?'<span class="rescued-mark" aria-hidden="true">♥</span>':`<span class="animal" data-animal="${i.animal}" style="background-image:url('${asset(`animals/${i.animal}.png`)}')" aria-hidden="true"></span>`}<strong>${i.id}</strong></button><span class="island-name">${i.name}</span></div>`).join('')}<div class="party-layer">${partyHtml()}</div></div><p class="map-legend"><span>┄ não comprado</span><span>━ ✓ comprado, viagem grátis</span>${saved.oracle?'<span>● ● sugestão do oráculo</span>':''}</p>
    ${state.current&&!won()?`<section class="lesson-panel glass" data-glass><h2>Próxima parada</h2><p>Toque em uma ilha vizinha no mapa ou escolha abaixo. Linhas que se cruzam não são paradas.</p><div class="travel-options">${neighbors.map(e=>{const next=e.a===state.current?e.b:e.a;return `<button data-island="${next}" ${moving?'disabled':''}>${next} · ${island(next).name}<small>${state.purchased.includes(e.id)?'0 moedas · caminho comprado':`${e.cost} moedas · abrir caminho`}${saved.oracle&&oracle.edges.some(o=>o.id===e.id)?' · na rede mínima':''}</small></button>`;}).join('')}</div></section>`:''}
    ${saved.oracle?`<section class="lesson-panel glass oracle-panel" data-glass><h2>Rede mínima: ${oracle.total} moedas</h2><p class="oracle-purchases">${oracle.edges.map(e=>`<span>${e.a}–${e.b} · ${e.cost}${state.purchased.includes(e.id)?' · comprado':''}</span>`).join('')}</p><p>Os caminhos com círculos são sugestões de compra. Ao comprar, o caminho vira uma linha contínua e as próximas viagens são grátis. A consulta não compra nem desfaz nada.</p>${state.start?`<details><summary>Uma caminhada possível</summary><p>Partindo de ${state.start}: <strong>${exampleWalk(state.start,oracle.edges,m.islands.length).join(' → ')}</strong>. É um exemplo de passeio pela árvore; Kruskal calcula as compras, não a ordem de caminhada.</p></details>`:''}<p><a href="#/grafos/kruskal/laboratorio">Entender as decisões de Kruskal →</a></p></section>`:''}
    `;
    updateClearance();bindActors(newAnimal);
    if(focus) root.querySelector<HTMLElement>(focus)?.focus({preventScroll:true});
  }
  function updateClearance():void {
    const board=root.querySelector<HTMLElement>('.rescue-board');if(!board)return;
    const scale=board.getBoundingClientRect().width/800;
    if(!scale)return;
    for(const item of map().islands) {
      const button=root.querySelector<HTMLElement>(`.island[data-island="${item.id}"]`)!;
      const circle=root.querySelector<SVGCircleElement>(`[data-mask-island="${item.id}"]`)!;
      // Include the selected outline and a visible gap, in CSS pixels at every size.
      circle.setAttribute('r',String((button.getBoundingClientRect().width/2+10)/scale));
    }
    for(const actor of actors) {const css=getComputedStyle(actor.element);actor.width=parseFloat(css.width);actor.height=parseFloat(css.height);}
  }
  const resize=new ResizeObserver(updateClearance);resize.observe(root);
  function animate(now:number):void {
    if(disposed) return;
    if(motion) {
      const t=motion.duration===0?1:Math.min(1,(now-motion.start)/motion.duration);
      const progress=t*t*(3-2*t);
      const point=motion.path.getPointAtLength((motion.reverse?1-progress:progress)*motion.length);
      addPoint(point.x,point.y);
      if(t===1) {
        const next=motion.next,animal=saved.state.rescued.includes(next.current!)?undefined:next.current!;
        saved.state=next;motion=undefined;moving=false;draw(animal,`[data-island="${next.current}"]`);
      }
    }
    const joining=updateActors(now);
    if(motion||joining) animation=requestAnimationFrame(animate);else {updateActors(now,true);animation=0;}
  }
  function go(id:string):void {
    if(moving||won()) return;
    if(!saved.state.current) {saved.state=startRescue(map(),id);seedTrail();draw(id);animation=requestAnimationFrame(animate);return;}
    const before=saved.state,next=travel(map(),before,id);
    const edge=map().edges.find(e=>(e.a===before.current&&e.b===id)||(e.b===before.current&&e.a===id))!;
    saved.state={...before,purchased:next.purchased,total:next.total};
    moving=true;
    // Build the board once, then move the sprites along the same SVG curve.
    draw();
    const path=root.querySelector<SVGPathElement>(`#rescue-path-${edge.id}`)!;
    motion={start:performance.now(),duration:reduced.matches?0:550+path.getTotalLength()*1.5,path,length:path.getTotalLength(),reverse:edge.b===before.current,next,destination:id};
    root.querySelector('[role="status"]')!.textContent=status();
    if(animation) cancelAnimationFrame(animation);animation=requestAnimationFrame(animate);
  }
  function reset():void {cancelAnimationFrame(animation);animation=0;motion=undefined;moving=false;saved.state=newRescue();trail=[];draw();}
  function click(event:Event):void {
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button||button.disabled)return;
    if(button.dataset.island) go(button.dataset.island);
    if(button.dataset.action==='reset') reset();
    if(button.dataset.action==='oracle') {if(moving)return;saved.oracle=!saved.oracle;draw(undefined,'[data-action="oracle"]');}
  }
  function change(event:Event):void {if((event.target as HTMLElement).id==='game-map'){saved.map=Number((event.target as HTMLSelectElement).value);saved.oracle=false;reset();}}
  root.addEventListener('click',click);root.addEventListener('change',change);seedTrail();draw();
  return()=>{disposed=true;resize.disconnect();cancelAnimationFrame(animation);root.removeEventListener('click',click);root.removeEventListener('change',change);};
}
