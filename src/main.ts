import './styles.css';
import {setStage,invalidateScene,setNavigationFrame,setNavigationPan,snapshotStagePanels,setDepartingPanels} from './scene';
import {mountRescue} from './rescue/game';
import {startPrimMusic,stopPrimMusic} from './rescue/sound';
import {session,clearSession} from './rescue/session';
import {outcome} from './rescue/model';
const app=document.querySelector<HTMLElement>('#app')!;
let cleanup:(()=>void)|undefined;
let previousDepth:number|undefined,navigationX=0,finishTransition:(()=>void)|undefined;
const depth=(route:string)=>route==='/'?0:route==='/grafos'?1:route==='/grafos/prim/jogo'?3:2;
// CSS `ease`: cubic-bezier(.25, .1, .25, 1). Solve x(u)=time,
// then evaluate y(u); evaluating y(time) alone is not the CSS curve.
function ease(time:number):number {
 if(time<=0)return 0;if(time>=1)return 1;
 let lo=0,hi=1;
 for(let i=0;i<20;i++){
  const u=(lo+hi)/2,v=1-u,x=3*v*v*u*.25+3*v*u*u*.25+u*u*u;
  if(x<time)lo=u;else hi=u;
 }
 const u=(lo+hi)/2,v=1-u;
 return 3*v*v*u*.1+3*v*u*u+u*u*u;
}

function render():void {
 finishTransition?.();
 let route=(location.hash||'#/').slice(1).replace(/\/$/,'')||'/';
 if(route==='/grafos/prim/jogo'&&(!session||outcome(session.graph,session.state)!=='playing')){route='/grafos/prim';history.replaceState(null,'','#/grafos/prim');}
 const nextDepth=depth(route),direction=previousDepth===undefined?0:Math.sign(nextDepth-previousDepth);
 const animate=direction!==0&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
 const oldPanels=animate?snapshotStagePanels():[];
 const outgoing=animate?document.createElement('div'):undefined;
 if(outgoing){
  outgoing.className='departing-view';outgoing.inert=true;outgoing.setAttribute('aria-hidden','true');
  // Move the existing DOM rather than duplicating IDs or running a second game.
  outgoing.append(...Array.from(app.childNodes));app.parentElement!.append(outgoing);
 }

 cleanup?.();cleanup=undefined;setStage();
 if(!route.startsWith('/grafos/prim')){clearSession();stopPrimMusic();}else startPrimMusic();
 app.className='';
 if(route==='/') {
  document.title='Nicolle · Disciplinas';
  app.innerHTML=`<main class="menu-screen"><span class="wordmark">Nicolle.</span><div class="menu-content"><h1>Disciplinas</h1><a class="picker-card glass" data-glass href="#/grafos"><span>Grafos</span><span class="picker-arrow" aria-hidden="true">→</span></a></div></main>`;
 } else if(route==='/grafos') {
  document.title='Grafos · Nicolle';
  app.innerHTML=`<main class="menu-screen"><a class="back-link glass" data-glass href="#/">← Disciplinas</a><div class="menu-content"><h1>Grafos</h1><a class="picker-card activity-card glass" data-glass href="#/grafos/prim"><span><strong>Prim</strong></span><span class="picker-arrow" aria-hidden="true">→</span></a></div></main>`;
 } else if(route==='/grafos/prim'||route==='/grafos/prim/jogo'||route==='/grafos/resgate'||route.startsWith('/grafos/kruskal/')||route==='/grafos/evento/jogo-kruskal') {
  document.title='Prim · Nicolle';app.className='playing';cleanup=mountRescue(app,route==='/grafos/prim/jogo');
 } else {
  document.title='Nicolle';app.innerHTML=`<main class="menu-screen"><a class="back-link glass" data-glass href="#/">← Disciplinas</a><div class="menu-content"><h1>Vamos voltar?</h1><a class="picker-card glass" data-glass href="#/grafos"><span>Grafos</span><span aria-hidden="true">→</span></a></div></main>`;
 }
 previousDepth=nextDepth;
 if(outgoing){
  const movingPanels=oldPanels.map(p=>({...p,clip:p.clip?{...p.clip}:undefined}));
  setDepartingPanels(movingPanels);
  const width=app.clientWidth,from=navigationX,to=from+direction*width,start=performance.now();
  let elapsed=0,lastTick=start;
  app.inert=true;app.style.transform=`translateX(${direction*width}px)`;
  const finish=()=>{
   navigationX=to;setNavigationPan(to);setNavigationFrame();setDepartingPanels();outgoing.remove();
   app.style.transform='';app.inert=false;finishTransition=undefined;invalidateScene();
  };
  finishTransition=finish;
  setNavigationFrame(now=>{
   // A slow WebGL frame must not skip half the slide in wall-clock time.
   if(!document.hidden)elapsed+=Math.min(32,Math.max(0,now-lastTick));
   lastTick=now;
   const t=matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.min(1,elapsed/650),e=ease(t);
   navigationX=from+(to-from)*e;setNavigationPan(navigationX);
   const shift=-direction*width*e;
   for(let i=0;i<movingPanels.length;i++){
    movingPanels[i].x=oldPanels[i].x+shift;
    if(movingPanels[i].clip)movingPanels[i].clip!.x=oldPanels[i].clip!.x+shift;
   }
   outgoing.style.transform=`translateX(${shift}px)`;
   app.style.transform=`translateX(${direction*width*(1-e)}px)`;
   if(t===1)finish();
  });
 }
 invalidateScene();
}
// Start/resume the audio context in the trusted click, before hash navigation.
function primeMusic(event:MouseEvent):void {
 const link=(event.target as Element).closest<HTMLAnchorElement>('a[href]');
 if(link?.hash.startsWith('#/grafos/prim')||location.hash.startsWith('#/grafos/prim'))startPrimMusic();
}
app.addEventListener('click',primeMusic);
window.addEventListener('hashchange',render);render();
if(import.meta.hot)import.meta.hot.dispose(()=>{finishTransition?.();cleanup?.();stopPrimMusic();app.removeEventListener('click',primeMusic);window.removeEventListener('hashchange',render);});
