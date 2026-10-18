// Decode once; effects and music share the same gesture-unlocked audio clock.
const base=import.meta.env.BASE_URL;
const bytes=fetch(`${base}grafos/audio/system01.wav`).then(r=>r.ok?r.arrayBuffer():undefined).catch(()=>undefined);
let context:AudioContext|undefined,gain:GainNode|undefined,buffer:AudioBuffer|undefined;
let ready:Promise<void>|undefined;
let musicSource:AudioBufferSourceNode|undefined,musicGain:GainNode|undefined;
let musicBuffer:Promise<AudioBuffer>|undefined,musicWanted=false,musicStarting=false;
let refreshOnGesture=false,musicOffset=0,musicStartedAt=0,musicDuration=0;
let musicMuted=false;
try{musicMuted=localStorage.getItem('nicolle-music-muted')==='true';}catch{/* Storage is optional. */}
const speaker='<path d="M11 5 6 9H3v6h3l5 4z"/>';
const waves='<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>';
const crossed='<path d="m16 9 5 6m0-6-5 6"/>';
export function musicButton():string {
 return `<button class="glass music-toggle" data-glass data-music-toggle type="button" aria-pressed="${musicMuted}" aria-label="${musicMuted?'Ativar música':'Silenciar música'}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${speaker}${musicMuted?crossed:waves}</svg></button>`;
}
function syncMusicButtons():void {
 for(const button of document.querySelectorAll<HTMLButtonElement>('[data-music-toggle]')){
  button.setAttribute('aria-pressed',String(musicMuted));button.setAttribute('aria-label',musicMuted?'Ativar música':'Silenciar música');
  button.querySelector('svg')!.innerHTML=speaker+(musicMuted?crossed:waves);
 }
}
function setMusicMuted(muted:boolean):void {
 musicMuted=muted;
 try{localStorage.setItem('nicolle-music-muted',String(muted));}catch{/* Storage is optional. */}
 if(muted)disconnectMusic(true);else if(musicWanted)startPrimMusic();
 syncMusicButtons();
}
function toggleMusic(event:MouseEvent):void {
 if((event.target as Element).closest('[data-music-toggle]'))setMusicMuted(!musicMuted);
}

function disconnectMusic(preservePosition=false):void {
 if(preservePosition&&musicSource&&context&&musicDuration){
  musicOffset=(musicOffset+Math.max(0,context.currentTime-musicStartedAt))%musicDuration;
 }
 try{musicSource?.stop();}catch{/* A discarded context may already have stopped it. */}
 musicSource?.disconnect();musicGain?.disconnect();musicSource=undefined;musicGain=undefined;
}
export function prepareIslandSound():void {
 try {
  if(!context||context.state==='closed'){
   disconnectMusic(true);
   if(!buffer)ready=undefined;
   context=new AudioContext({latencyHint:'interactive'});refreshOnGesture=false;gain=context.createGain();gain.gain.value=.4;gain.connect(context.destination);
  }
  // iOS also reports "interrupted" after an app switch or device interruption.
  // Retrying inside a fresh gesture matters even if an earlier resume is pending.
  if(context.state!=='running')void context.resume().catch(()=>{});
  const audio=context;
  ready??=bytes.then(async data=>{if(data)buffer=await audio.decodeAudioData(data);}).catch(()=>{});
 }catch{/* Audio support must not affect interaction. */}
}
function start():void {
 if(!context||!gain||!buffer)return;
 try{const source=context.createBufferSource();source.buffer=buffer;source.connect(gain);source.start(context.currentTime);}catch{/* Movement remains available if audio is blocked. */}
}
export function playIslandClick():void {
 prepareIslandSound();
 if(buffer)start();else void ready?.then(start);
}
export function startPrimMusic():void {
 musicWanted=true;
 if(musicMuted)return;
 prepareIslandSound();
 if(!context||musicSource||musicStarting)return;
 musicStarting=true;
 const audio=context;
 musicBuffer??=fetch(`${base}grafos/audio/prim.m4a`).then(r=>{if(!r.ok)throw Error('Music unavailable');return r.arrayBuffer();}).then(data=>audio.decodeAudioData(data));
 void musicBuffer.then(buffer=>{
  if(!musicWanted||musicMuted||!context||musicSource)return;
  // A suspended/interrupted source keeps its position; never layer a second song.
  musicGain=context.createGain();musicGain.gain.value=.3;musicGain.connect(context.destination);
  musicSource=context.createBufferSource();musicSource.buffer=buffer;musicSource.loop=true;musicSource.connect(musicGain);
  musicDuration=buffer.duration;musicOffset%=musicDuration;musicStartedAt=context.currentTime;
  musicSource.start(context.currentTime,musicOffset);
 }).catch(()=>{musicBuffer=undefined;}).finally(()=>{musicStarting=false;});
}
export function stopPrimMusic():void {musicWanted=false;disconnectMusic();musicOffset=0;refreshOnGesture=false;}
function recoverAudio(event:Event):void {
 if(document.hidden||event.type==='pagehide'){
  if(musicWanted){refreshOnGesture=true;setMusicMuted(true);}
  return;
 }
 if(!musicWanted)return;
 if(event.type==='pageshow'&&(event as PageTransitionEvent).persisted)refreshOnGesture=true;
 const gesture=['pointerdown','touchend','keydown'].includes(event.type);
 if(gesture&&context&&(refreshOnGesture||(context.state!=='running'&&context.state!=='suspended'&&context.state!=='closed'))){
  // A foreground event can report "running" even when the native audio path
  // did not recover. Rebuild inside a user gesture, without awaiting the old one.
  const previous=context;
  disconnectMusic(true);context=undefined;gain=undefined;refreshOnGesture=false;
  void previous.close().catch(()=>{});
 }
 if(musicMuted){if(gesture&&context)prepareIslandSound();return;}
 startPrimMusic();
}
document.addEventListener('click',toggleMusic);
document.addEventListener('visibilitychange',recoverAudio);
window.addEventListener('pagehide',recoverAudio);
window.addEventListener('pageshow',recoverAudio);
window.addEventListener('focus',recoverAudio);
for(const event of ['pointerdown','touchend','keydown'])document.addEventListener(event,recoverAudio,{capture:true,passive:true});
if(import.meta.hot)import.meta.hot.dispose(()=>{
 document.removeEventListener('click',toggleMusic);document.removeEventListener('visibilitychange',recoverAudio);window.removeEventListener('pagehide',recoverAudio);window.removeEventListener('pageshow',recoverAudio);window.removeEventListener('focus',recoverAudio);
 for(const event of ['pointerdown','touchend','keydown'])document.removeEventListener(event,recoverAudio,true);
 stopPrimMusic();void context?.close().catch(()=>{});
});
