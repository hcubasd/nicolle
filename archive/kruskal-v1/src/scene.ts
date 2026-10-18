import { ROUGHNESS } from 'virtual:lightness-rings';
// Adapted from Nicrainha docs 4666d5e. One bounded course view instead of a wrapping demo.
import { DEFAULT_LIGHTNESS, generatePalettes } from 'nicrainha';
import { createProgram, GLASS_UNIFORMS, modeFor, observeDeviceSize, setBox, setGlassLength, setPanels, uploadTables, Z_PER_SECOND, type Panel, type Uniforms } from './gl.js';
import { buildPermutation, gainFor, octaves, roughness, scaleFor } from './noise.js';
import { lightness } from './settings';
import { advanceScroll, backgroundScrollPosition } from './scroll';
import fragmentSource from './shaders/scene.frag?raw';
const canvas=document.querySelector<HTMLCanvasElement>('#background')!;
const app=document.querySelector<HTMLElement>('#app')!;
const params=new URLSearchParams(location.search);
const rotation=Math.floor(Math.random()*256);
const permutation=buildPermutation(Math.floor(Math.random()*99999));
const defaultPalette=generatePalettes(256,{lightness:DEFAULT_LIGHTNESS})[0];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const requestedSpeed=Number(params.get('speed')??1);
const speed=Number.isFinite(requestedSpeed)&&requestedSpeed>=0?requestedSpeed:1;
let palette=defaultPalette, currentLightness=lightness, gain=0, scale=1;
let dirty=true, disposed=false, raf=0, deviceWidth=0, deviceHeight=0;
let elements:HTMLElement[]=[];
const panelPool:Panel[]=Array.from({length:32},()=>({x:0,y:0,halfWidth:0,halfHeight:0,radius:0}));
const panels:Panel[]=[];
let gl:WebGL2RenderingContext|null=null, uniform:Uniforms|undefined;
let cell=1, fractal={count:1,rate:1};
const start=performance.now();
let lastFrame=start,lastDraw=-Infinity;
const onLayout=()=>{dirty=true;};
const deviceObserver=observeDeviceSize(canvas,(w,h)=>{deviceWidth=w;deviceHeight=h;dirty=true;});
const observer=new ResizeObserver(onLayout);observer.observe(app);
function discover():void {elements=[...app.querySelectorAll<HTMLElement>('[data-glass]')];dirty=true;}
const mutations=new MutationObserver(discover);mutations.observe(app,{childList:true,subtree:true});discover();
function applyLightness(next:number):void {
  currentLightness=next;
  palette=generatePalettes(256,{lightness:next})[0];
  gain=gainFor(next,roughness(palette,defaultPalette),ROUGHNESS);
  scale=scaleFor(palette,defaultPalette);
  document.documentElement.dataset.mode=modeFor(next);
  const color=palette[(128+rotation)&255];
  const css=`rgb(${color.r} ${color.g} ${color.b})`;
  document.documentElement.style.setProperty('--fallback-background',css);
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!.content=css;
  if(gl && uniform && !gl.isContextLost()) {
    uploadTables(gl,uniform,permutation,next,rotation,palette);
    gl.uniform1f(uniform.u_gain,gain);
  }
  dirty=true;
}
function change(event:Event):void {applyLightness((event as CustomEvent<number>).detail);}
window.addEventListener('lightnesschange',change);
window.addEventListener('resize',onLayout);window.visualViewport?.addEventListener('resize',onLayout);
reduced.addEventListener('change',onLayout);
document.addEventListener('visibilitychange',onLayout);document.fonts.ready.then(onLayout);
function launch():void {
  try {
    gl=canvas.getContext('webgl2',{antialias:false,alpha:false});
    if(!gl) throw Error('WebGL2 unavailable');
    uniform=createProgram(gl,fragmentSource,[...GLASS_UNIFORMS,'u_resolution','u_offset','u_cell','u_z','u_octaves','u_gain']);
    applyLightness(currentLightness);
    document.documentElement.classList.remove('no-webgl');
  } catch(error) {
    gl=null;uniform=undefined;
    document.documentElement.classList.add('no-webgl');
    console.warn('Nicrainha renderer unavailable:',error);
  }
  dirty=true;
}
function layout():void {
  const dpr=devicePixelRatio||1;
  const width=deviceWidth||Math.round(canvas.clientWidth*dpr),height=deviceHeight||Math.round(canvas.clientHeight*dpr);
  if(gl && uniform) {
    if(canvas.width!==width || canvas.height!==height) {canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
    gl.uniform2f(uniform.u_resolution,width,height);
    setBox(gl,uniform,width/dpr,height/dpr,dpr);setGlassLength(gl,uniform,dpr);
    cell=Math.max(scale*Math.max(Math.min(width,height),Math.max(width,height)/2),2)/dpr;
    fractal=octaves(gain,cell*dpr);gl.uniform1i(uniform.u_octaves,Math.min(fractal.count,16));gl.uniform1f(uniform.u_cell,cell*dpr);
  }
  const bounds=canvas.getBoundingClientRect();
  const globalRadius=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--glass-radius'));
  const radiusParam=Number(params.get('radius')??globalRadius);
  const radius=Number.isFinite(radiusParam)&&radiusParam>=0?radiusParam:globalRadius;
  panels.length=0;
  for(const element of elements) {
    const rect=element.getBoundingClientRect();
    const r=element.matches('.island,.cost-button')?Math.min(rect.width,rect.height)/2:Math.min(radius,rect.width/2,rect.height/2);
    if(element.style.getPropertyValue('--glass-render-radius')!==`${r}px`) element.style.setProperty('--glass-render-radius',`${r}px`);
    if(rect.width<=0||rect.height<=0||rect.bottom<=bounds.top||rect.top>=bounds.bottom||rect.right<=bounds.left||rect.left>=bounds.right) continue;
    if(panels.length>=32) throw Error('Too many visible glass panels');
    const panel=panelPool[panels.length];
    panel.x=rect.left-bounds.left+rect.width/2;panel.y=rect.top-bounds.top+rect.height/2;
    panel.halfWidth=rect.width/2;panel.halfHeight=rect.height/2;panel.radius=r;
    panels.push(panel);
  }
  if(panels.length>32) throw Error('Too many visible glass panels');
  if(gl && uniform) setPanels(gl,uniform,panels,dpr);
}
const wrap=(value:number,period:number)=>((value%period)+period)%period;
function frame(now:number):void {
  if(disposed) return;
  const dt=Math.min(now-lastFrame,100);lastFrame=now;
  if(advanceScroll(dt)) dirty=true;
  if(!document.hidden) {
    const interval=speed===0?Infinity:1000*(2/256)/(Z_PER_SECOND*3.09*fractal.rate*speed);
    if(dirty || (!reduced.matches && now-lastDraw>=interval-dt/2)) {
      // Apply DOM transform above, then place every glass panel and pan the floor in this frame.
      if(dirty) layout();
      if(gl && uniform && !gl.isContextLost()) {
        gl.uniform2f(uniform.u_offset,0,wrap(backgroundScrollPosition(),256*cell)*(devicePixelRatio||1));
        gl.uniform1f(uniform.u_z,reduced.matches?0:wrap((now-start)/1000*Z_PER_SECOND*speed,256));
        gl.drawArrays(gl.TRIANGLES,0,3);
      }
      dirty=false;lastDraw=now;
    }
  }
  raf=requestAnimationFrame(frame);
}
function contextLost(event:Event):void {event.preventDefault();gl=null;uniform=undefined;document.documentElement.classList.add('no-webgl');}
canvas.addEventListener('webglcontextlost',contextLost);
canvas.addEventListener('webglcontextrestored',launch);
applyLightness(currentLightness);launch();raf=requestAnimationFrame(frame);
if(import.meta.hot) import.meta.hot.dispose(()=>{
  disposed=true;cancelAnimationFrame(raf);observer.disconnect();deviceObserver.disconnect();mutations.disconnect();
  canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',launch);
  window.removeEventListener('lightnesschange',change);window.removeEventListener('resize',onLayout);window.visualViewport?.removeEventListener('resize',onLayout);
  reduced.removeEventListener('change',onLayout);document.removeEventListener('visibilitychange',onLayout);
  gl?.getExtension('WEBGL_lose_context')?.loseContext();
});
