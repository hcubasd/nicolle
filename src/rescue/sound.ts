// Decode once, then schedule the short effect directly on the audio clock.
// Warming on pointer-down avoids HTMLMediaElement's per-click playback delay.
const bytes=fetch(`${import.meta.env.BASE_URL}grafos/audio/system01.wav`).then(r=>r.ok?r.arrayBuffer():undefined).catch(()=>undefined);
let context:AudioContext|undefined,gain:GainNode|undefined,buffer:AudioBuffer|undefined;
let ready:Promise<void>|undefined;
export function prepareIslandSound():void {
 try {
  if(!context){context=new AudioContext({latencyHint:'interactive'});gain=context.createGain();gain.gain.value=.4;gain.connect(context.destination);}
  if(context.state==='suspended')void context.resume().catch(()=>{});
  ready??=bytes.then(async data=>{if(data)buffer=await context!.decodeAudioData(data);}).catch(()=>{});
 }catch{/* Audio support must not affect interaction. */}
}
function start():void {
 if(!context||!gain||!buffer)return;
 try {const source=context.createBufferSource();source.buffer=buffer;source.connect(gain);source.start(context.currentTime);}catch{/* Movement stays available even when audio is blocked. */}
}
export function playIslandClick():void {
 prepareIslandSound();
 if(buffer)start();else void ready?.then(start);
}
let musicSource:AudioBufferSourceNode|undefined,musicGain:GainNode|undefined;
let musicBuffer:Promise<AudioBuffer>|undefined,musicWanted=false,musicStarting=false;
export function startPrimMusic():void {
 musicWanted=true;
 prepareIslandSound();
 if(!context||musicSource||musicStarting)return;
 musicStarting=true;
 const audio=context;
 musicBuffer??=fetch(`${import.meta.env.BASE_URL}grafos/audio/prim.m4a`).then(r=>{if(!r.ok)throw Error('Music unavailable');return r.arrayBuffer();}).then(data=>audio.decodeAudioData(data));
 void musicBuffer.then(buffer=>{
  if(!musicWanted)return;
  musicGain=audio.createGain();musicGain.gain.value=.3;musicGain.connect(audio.destination);
  musicSource=audio.createBufferSource();musicSource.buffer=buffer;musicSource.loop=true;musicSource.connect(musicGain);musicSource.start();
 }).catch(()=>{musicBuffer=undefined;}).finally(()=>{musicStarting=false;});
}
export function stopPrimMusic():void {
 musicWanted=false;
 musicSource?.stop();musicSource?.disconnect();musicGain?.disconnect();musicSource=undefined;musicGain=undefined;
}
if(import.meta.hot)import.meta.hot.dispose(()=>{void context?.close().catch(()=>{});});
