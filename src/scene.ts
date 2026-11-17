import 'nicrainha';
import {generatePalettes} from 'nicrainha';
import {syncViewport} from './viewport';

// The public components own WebGL, palettes, panel measurement and drawing.
// This adapter only places our views and glass on their shared UI plane.
export const LIGHTNESS=87;
export interface StageView {changed:boolean;}
export type Stage=(now:number,dt:number)=>StageView;
const background=document.querySelector('nicrainha-background')!;
const app=document.querySelector<HTMLElement>('#app')!;
const surface=document.createElement('div');surface.className='ui-surface';
background.append(surface);surface.append(app);
const glassLayer=document.createElement('div');glassLayer.className='glass-layer';surface.prepend(glassLayer);
const panels=new Map<HTMLElement,HTMLElement>();
let stage:Stage|undefined,navigationFrame:((now:number)=>void)|undefined;
let lastFrame=performance.now(),raf=0,disposed=false,top=0,dirty=true;
let scroller:HTMLElement|null=null,content:HTMLElement|null=null;
const color=generatePalettes(1,{lightness:LIGHTNESS})[0][0];
const paper=`rgb(${color.r} ${color.g} ${color.b})`;
document.documentElement.style.setProperty('--paper',paper);
document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!.content=paper;
background.lightness=LIGHTNESS;
export function setStage(next?:Stage):void {stage=next;dirty=true;}
export function invalidateScene():void {dirty=true;}
export function setNavigationFrame(next?:((now:number)=>void)):void {navigationFrame=next;dirty=true;}
// Navigation moves view DOM in script. Nicrainha's background deliberately stays
// in place, as documented, rather than restarting its random field per route.
export function resetPageScroll():void {if(content)resize.unobserve(content);top=0;scroller=null;content=null;background.scrollTo(0,0);}
export function pageScrollTop():number {return top;}
export function scrollPageTo(value:number):void {background.scrollTo(0,value);}
function prepareScroll():void {
 const next=app.querySelector<HTMLElement>('.python-scroll,.setup-screen');
 if(next===scroller)return;
 if(content)resize.unobserve(content);
 scroller=next;content=null;top=0;
 if(next?.classList.contains('python-scroll')){content=document.createElement('div');content.className='python-document';content.append(...Array.from(next.childNodes));next.append(content);}
 else if(next)content=next.querySelector<HTMLElement>('.setup-card');
 if(content)resize.observe(content);
}
function updateGlass():void {
 const origin=surface.getBoundingClientRect();
 const live=new Set<HTMLElement>();
 for(const target of surface.querySelectorAll<HTMLElement>('[data-glass]')){
  const rect=target.getBoundingClientRect();
  let left=Math.max(rect.left,origin.left),right=Math.min(rect.right,origin.right),upper=Math.max(rect.top,origin.top),bottom=Math.min(rect.bottom,origin.bottom);
  if(target.hasAttribute('data-glass-clip')){
   const clip=target.closest('.python-scroll,.map-field')?.getBoundingClientRect();
   if(clip){left=Math.max(left,clip.left);right=Math.min(right,clip.right);upper=Math.max(upper,clip.top);bottom=Math.min(bottom,clip.bottom);}
  }
  if(target.classList.contains('setup-card')){
   const setup=target.closest<HTMLElement>('.setup-screen')!,bounds=setup.getBoundingClientRect();
   upper=Math.max(upper,bounds.top+parseFloat(getComputedStyle(setup).paddingTop));
  }
  if(right<=left||bottom<=upper||target.hidden)continue;
  live.add(target);
  let glass=panels.get(target);
  if(!glass){glass=document.createElement('nicrainha-glass');glass.setAttribute('aria-hidden','true');glassLayer.append(glass);panels.set(target,glass);}
  // Panels clipped by the game/document viewport never bleed behind controls.
  // The public component reads this ordinary CSS box and corner radius itself.
  const radius=getComputedStyle(target).borderTopLeftRadius;
  glass.style.cssText=`position:absolute;left:${left-origin.left}px;top:${upper-origin.top}px;width:${right-left}px;height:${bottom-upper}px;border-radius:${radius};`;
 }
 for(const [target,glass] of panels)if(!live.has(target)){glass.remove();panels.delete(target);}
}
function drawFrame():void {
 const appliedPan={x:background.scrollLeft,y:background.scrollTop};
 const now=performance.now(),dt=Math.min(64,now-lastFrame);lastFrame=now;
 syncViewport();navigationFrame?.(now);prepareScroll();
 // The component dispatches scroll before measuring/drawing glass. Move all
 // application DOM here so both are committed in that same frame.
 if(scroller&&content){
  const max=Math.max(0,content.offsetHeight+parseFloat(getComputedStyle(scroller).paddingTop)+parseFloat(getComputedStyle(scroller).paddingBottom)-scroller.clientHeight);
  top=Math.max(0,Math.min(max,background.scrollTop));
  if(background.scrollLeft!==0||background.scrollTop!==top)background.scrollTo(0,top);
  content.style.transform=`translateY(${-top}px)`;
 }
 surface.style.transform=`translate(${appliedPan.x}px,${appliedPan.y}px)`;
 stage?.(now,dt);updateGlass();
}
background.addEventListener('scroll',drawFrame);
// Ask for a frame through the public pan API, including while sprites move or a
// menu transition runs. No separate renderer or private engine APIs are used.
function heartbeat():void {
 if(disposed)return;
 if(syncViewport())dirty=true;
 if(dirty||stage||navigationFrame){dirty=false;background.scrollTo(background.scrollLeft,background.scrollTop);}
 raf=requestAnimationFrame(heartbeat);
}
const mutations=new MutationObserver(invalidateScene);mutations.observe(app,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['open','hidden','class','aria-expanded']});
const resize=new ResizeObserver(invalidateScene);resize.observe(app);
raf=requestAnimationFrame(heartbeat);
let codeDrag:{id:number;x:number;y:number}|undefined;
function localInteraction(event:Event):void {
 const target=event.target as Element;
 // The game camera is local. Documents and short setup screens use the
 // official pan; the code block additionally supports horizontal movement.
 const code=target.closest<HTMLElement>('.python-code');
 if(code&&event instanceof PointerEvent&&event.pointerType!=='mouse'){codeDrag={id:event.pointerId,x:event.clientX,y:event.clientY};code.setPointerCapture(event.pointerId);}
 if(code&&event instanceof WheelEvent&&!event.ctrlKey&&Math.abs(event.deltaY)>Math.abs(event.deltaX)&&!event.shiftKey){event.preventDefault();background.scrollBy(0,event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?scroller?.clientHeight??1:1));}
 if(!target.closest('#app .python-scroll,#app .setup-screen')||code)event.stopPropagation();
}
surface.addEventListener('pointerdown',localInteraction);
surface.addEventListener('wheel',localInteraction,{passive:false});
function codeMove(event:PointerEvent):void {
 if(codeDrag?.id!==event.pointerId)return;
 const code=(event.target as Element).closest<HTMLElement>('.python-code');if(!code)return;
 const dx=event.clientX-codeDrag.x,dy=event.clientY-codeDrag.y;
 if(Math.abs(dy)>Math.abs(dx))background.scrollBy(0,-dy);else code.scrollLeft-=dx;
 codeDrag.x=event.clientX;codeDrag.y=event.clientY;
}
function codeRelease():void {codeDrag=undefined;}
surface.addEventListener('pointermove',codeMove);surface.addEventListener('pointerup',codeRelease);surface.addEventListener('pointercancel',codeRelease);
// Browser focus may scroll an overflow:hidden box to reveal the terminal.
// Fold that movement into the public pan rather than leaving a second scroll.
function focusScroll(event:Event):void {
 if(scroller&&event.target===scroller&&scroller.scrollTop){const delta=scroller.scrollTop;scroller.scrollTop=0;scrollPageTo(top+delta);}
}
surface.addEventListener('scroll',focusScroll,true);
function keyboardScroll(event:KeyboardEvent):void {
 if(!scroller||(event.target as Element).closest('input,textarea,select,button,a,.python-code,[contenteditable]'))return;
 const amount=scroller.clientHeight*.85;
 const next=event.key==='PageDown'?top+amount:event.key==='PageUp'?top-amount:event.key==='ArrowDown'?top+48:event.key==='ArrowUp'?top-48:event.key==='Home'?0:event.key==='End'?Number.MAX_SAFE_INTEGER:undefined;
 if(next!==undefined){event.preventDefault();scrollPageTo(next);}
}
window.addEventListener('keydown',keyboardScroll);
if(import.meta.hot)import.meta.hot.dispose(()=>{disposed=true;cancelAnimationFrame(raf);mutations.disconnect();resize.disconnect();background.removeEventListener('scroll',drawFrame);surface.removeEventListener('pointerdown',localInteraction);surface.removeEventListener('wheel',localInteraction);surface.removeEventListener('scroll',focusScroll,true);surface.removeEventListener('pointermove',codeMove);surface.removeEventListener('pointerup',codeRelease);surface.removeEventListener('pointercancel',codeRelease);window.removeEventListener('keydown',keyboardScroll);surface.replaceWith(app);});
