import {syncViewport} from './viewport';
import {createRenderer,type GlassPanel} from './engine/renderer.js';
export type {GlassPanel};
export interface StageView {pan:{x:number;y:number};panels:GlassPanel[];changed:boolean;}
export type Stage=(now:number,dt:number)=>StageView;
const canvas=document.querySelector<HTMLCanvasElement>('#background')!;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let renderer:ReturnType<typeof createRenderer>|undefined,stage:Stage|undefined,raf=0,disposed=false;
let lastFrame=performance.now(),lastDraw=-Infinity,dirty=true;
const pan={x:0,y:0};
const navigation={x:0,y:0};
let scrollElement:HTMLElement|null=null,scrollTop=0;
let lastStagePanels:GlassPanel[]=[],departingPanels:GlassPanel[]=[];
export function snapshotStagePanels():GlassPanel[] {return lastStagePanels.map(p=>({...p,clip:p.clip?{...p.clip}:undefined}));}
export function setDepartingPanels(panels:GlassPanel[]=[]):void {departingPanels=panels;dirty=true;}
let navigationFrame:((now:number)=>void)|undefined;
// Navigation runs before the stage and glass measurements, in the same frame.
export function setNavigationFrame(next?:((now:number)=>void)):void {navigationFrame=next;dirty=true;}
export function setNavigationPan(x:number):void {navigation.x=x;dirty=true;}
const panels:GlassPanel[]=[];
const pool:GlassPanel[]=Array.from({length:160},()=>({x:0,y:0,halfWidth:0,halfHeight:0,radius:28}));
export const LIGHTNESS=87;
let frozenTime=performance.now();
export const backgroundPan=()=>({...pan});
export function setStage(next?:Stage):void {stage=next;dirty=true;}
export function invalidateScene():void {dirty=true;}
function launch():void {
 try {
  renderer?.dispose();renderer=createRenderer(canvas,LIGHTNESS);
  document.documentElement.style.setProperty('--paper',renderer.themeColor);
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!.content=renderer.themeColor;
  document.documentElement.classList.remove('no-webgl');
 }catch(error){renderer=undefined;document.documentElement.classList.add('no-webgl');console.warn('WebGL fallback:',error);}
 dirty=true;
}
function lost(event:Event):void {event.preventDefault();renderer?.dispose();renderer=undefined;document.documentElement.classList.add('no-webgl');}
function motion():void {frozenTime=performance.now();dirty=true;}
function frame(now:number):void {
 if(disposed)return;
 const dt=Math.min(64,now-lastFrame);lastFrame=now;
 if(syncViewport())dirty=true;
 navigationFrame?.(now);
 const currentScroll=document.querySelector<HTMLElement>('#app .menu-screen, #app .setup-screen, #app .python-scroll');
 if(currentScroll===scrollElement){const top=currentScroll?.scrollTop??0;if(top!==scrollTop){pan.y+=top-scrollTop;dirty=true;}scrollTop=top;}
 else {scrollElement=currentScroll;scrollTop=currentScroll?.scrollTop??0;}
 const view=stage?.(now,dt);
 lastStagePanels=view?.panels??[];
 if(view){pan.x=view.pan.x;pan.y=view.pan.y;if(view.changed)dirty=true;}
 if(!document.hidden&&(dirty||(!reduced.matches&&now-lastDraw>=(renderer?.interval??16)-dt/2))) {
  panels.length=0;
  panels.push(...departingPanels);
  if(view)for(const panel of view.panels)panels.push(panel);
  const canvasRect=canvas.getBoundingClientRect();
  for(const el of document.querySelectorAll<HTMLElement>('[data-glass]')) {
   const rect=el.getBoundingClientRect();if(rect.width<=0||rect.height<=0||rect.bottom<canvasRect.top||rect.top>canvasRect.bottom||rect.right<canvasRect.left||rect.left>canvasRect.right)continue;
   const p=pool[panels.length];if(!p)throw Error('Visible glass capacity exceeded');
   p.x=rect.left+rect.width/2;p.y=rect.top+rect.height/2;p.halfWidth=rect.width/2;p.halfHeight=rect.height/2;p.radius=Math.min(28,p.halfWidth,p.halfHeight);p.clip=undefined;
   if(el.hasAttribute('data-glass-clip')){
    const bounds=el.closest('.python-scroll')?.getBoundingClientRect();
    if(bounds)p.clip={x:bounds.left,y:bounds.top,width:bounds.width,height:bounds.height};
   }
   panels.push(p);
  }
  renderer?.draw(reduced.matches?frozenTime:now,{pan:{x:pan.x+navigation.x,y:pan.y},panels,glassLength:8*parseFloat(getComputedStyle(document.documentElement).fontSize)});
  dirty=false;lastDraw=now;
 }
 raf=requestAnimationFrame(frame);
}
const resize=new ResizeObserver(invalidateScene);resize.observe(canvas);
const mutations=new MutationObserver(invalidateScene);mutations.observe(document.querySelector('#app')!,{childList:true,subtree:true});
window.addEventListener('resize',invalidateScene);window.addEventListener('orientationchange',invalidateScene);window.addEventListener('pageshow',invalidateScene);visualViewport?.addEventListener('resize',invalidateScene);visualViewport?.addEventListener('scroll',invalidateScene);document.addEventListener('visibilitychange',invalidateScene);document.addEventListener('scroll',invalidateScene,true);
canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',launch);reduced.addEventListener('change',motion);
launch();raf=requestAnimationFrame(frame);
if(import.meta.hot)import.meta.hot.dispose(()=>{disposed=true;cancelAnimationFrame(raf);setStage();renderer?.dispose();resize.disconnect();mutations.disconnect();window.removeEventListener('resize',invalidateScene);window.removeEventListener('orientationchange',invalidateScene);window.removeEventListener('pageshow',invalidateScene);visualViewport?.removeEventListener('resize',invalidateScene);visualViewport?.removeEventListener('scroll',invalidateScene);document.removeEventListener('visibilitychange',invalidateScene);document.removeEventListener('scroll',invalidateScene,true);canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',launch);reduced.removeEventListener('change',motion);canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();});
