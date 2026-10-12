// Bounded adaptation of Nicrainha's pan/fling. DOM and WebGL move in one frame.
const app = document.querySelector<HTMLElement>('#app')!;
let backgroundPosition = 0;
let position = 0, velocity = 0, limit = 0, dirty = true;
let drag: {id:number;lastY:number;samples:{t:number;y:number}[];moved:boolean} | undefined;
const decayLog = Math.log(.998);
export const scrollPosition = () => position;
export const backgroundScrollPosition = () => backgroundPosition;
export function scrollToPosition(y: number, panBackground = false): void {
  const previous = position;
  limit = Math.max(0, app.offsetHeight - innerHeight);
  position = Math.max(0, Math.min(limit, y));
  if(panBackground) backgroundPosition += position - previous;
  velocity = 0; dirty = true;
}
export function scrollToElement(element: Element): void {
  scrollToPosition(position + element.getBoundingClientRect().top - 24);
}
function measure(): void { limit = Math.max(0, app.offsetHeight - innerHeight); position = Math.min(position, limit); dirty = true; }
const observer = new ResizeObserver(measure); observer.observe(app);
function canScrollInside(target: EventTarget | null, delta: number): boolean {
  for(let el = target instanceof Element ? target : null; el && el !== app; el = el.parentElement) {
    if (el.scrollHeight > el.clientHeight && /auto|scroll/.test(getComputedStyle(el).overflowY)) {
      if(delta < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight) return true;
    }
  }
  return false;
}
function wheel(event: WheelEvent): void {
  if(event.ctrlKey || document.querySelector('dialog[open]') || Math.abs(event.deltaX) > Math.abs(event.deltaY) || canScrollInside(event.target,event.deltaY)) return;
  event.preventDefault();
  const unit = event.deltaMode === 1 ? parseFloat(getComputedStyle(app).fontSize) : event.deltaMode === 2 ? innerHeight : 1;
  scrollToPosition(position + event.deltaY * unit, true);
}
function down(event: PointerEvent): void {
  suppressClick = false;
  if(event.pointerType === 'mouse' || document.querySelector('dialog[open]') || (event.target as Element).closest('input,select,textarea,pre')) return;
  velocity = 0;
  drag = {id:event.pointerId,lastY:event.clientY,samples:[{t:event.timeStamp,y:event.clientY}],moved:false};
}
function move(event: PointerEvent): void {
  if(event.pointerId !== drag?.id) return;
  const delta = drag.lastY-event.clientY;
  if(canScrollInside(event.target,delta)) { drag=undefined; return; }
  if(Math.abs(event.clientY-drag.samples[0].y)>6) drag.moved=true;
  if(drag.moved) {
    app.setPointerCapture(event.pointerId);
    const previous=position;
    position=Math.max(0,Math.min(limit,position+delta));backgroundPosition+=position-previous;dirty=true;
  }
  drag.lastY=event.clientY;
  drag.samples.push({t:event.timeStamp,y:event.clientY});
  while(drag.samples.length>2 && event.timeStamp-drag.samples[0].t>100) drag.samples.shift();
}
let suppressClick = false;
function release(event: PointerEvent): void {
  if(event.pointerId !== drag?.id) return;
  const first=drag.samples[0],last=drag.samples[drag.samples.length-1],dt=last.t-first.t;
  if(drag.moved && event.type==='pointerup' && dt>0 && event.timeStamp-last.t<40) velocity=-(last.y-first.y)/dt;
  suppressClick=drag.moved; drag=undefined;
  if(app.hasPointerCapture(event.pointerId)) app.releasePointerCapture(event.pointerId);
}
function click(event: MouseEvent): void { if(suppressClick) {event.preventDefault();event.stopImmediatePropagation();suppressClick=false;} }
function key(event: KeyboardEvent): void {
  if(document.querySelector('dialog[open]') || (event.target as Element).closest('input,textarea,select,[contenteditable="true"]')) return;
  let next: number | undefined;
  if(event.key==='ArrowDown') next=position+40;
  if(event.key==='ArrowUp') next=position-40;
  if(event.key==='PageDown'||(event.key===' ' && !(event.target as Element).closest('button,a,summary'))) next=position+innerHeight*.85*(event.shiftKey?-1:1);
  if(event.key==='PageUp') next=position-innerHeight*.85;
  if(event.key==='Home') next=0;
  if(event.key==='End') next=limit;
  if(next!==undefined) {event.preventDefault();scrollToPosition(next,true);}
}
function focus(event: FocusEvent): void {
  const element=event.target as HTMLElement;
  if(!app.contains(element) || element.id==='view-title') return;
  const rect=element.getBoundingClientRect();
  if(rect.top<24) scrollToPosition(position+rect.top-24);
  else if(rect.bottom>innerHeight-24) scrollToPosition(position+rect.bottom-innerHeight+24);
}
export function advanceScroll(dt: number): boolean {
  if(!drag && velocity) {
    const decay=Math.exp(decayLog*dt);
    const next=position+velocity*(decay-1)/decayLog;
    const previous=position;
    position=Math.max(0,Math.min(limit,next));backgroundPosition+=position-previous;velocity*=decay;dirty=true;
    if(next!==position || Math.abs(velocity)/-decayLog < .5/(devicePixelRatio||1)) velocity=0;
  }
  if(!dirty) return false;
  app.style.transform=`translateY(${-position}px)`;
  dirty=false;return true;
}
app.addEventListener('wheel',wheel,{passive:false});
app.addEventListener('pointerdown',down);app.addEventListener('pointermove',move);
app.addEventListener('pointerup',release);app.addEventListener('pointercancel',release);
app.addEventListener('click',click,true);app.addEventListener('focusin',focus);
window.addEventListener('keydown',key);window.addEventListener('resize',measure);
if(import.meta.hot) import.meta.hot.dispose(()=>{observer.disconnect();app.removeEventListener('wheel',wheel);app.removeEventListener('pointerdown',down);app.removeEventListener('pointermove',move);app.removeEventListener('pointerup',release);app.removeEventListener('pointercancel',release);app.removeEventListener('click',click,true);app.removeEventListener('focusin',focus);window.removeEventListener('keydown',key);window.removeEventListener('resize',measure);});
