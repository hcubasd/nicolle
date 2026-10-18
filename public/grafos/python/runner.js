/* A dedicated worker keeps Python and its paused stack off the UI thread. */
let python,loading,busy=false;
const send=message=>postMessage(message);
async function boot(){
 if(!loading)loading=(async()=>{
  importScripts(new URL('../../vendor/pyodide/pyodide.js',self.location.href).href);
  python=await loadPyodide({indexURL:new URL('../../vendor/pyodide/',self.location.href).href});
  python.setStdout({batched:text=>send({type:'output',text})});
  python.setStderr({batched:text=>send({type:'output',text})});
  const response=await fetch(new URL('instrument.py',self.location.href));
  if(!response.ok)throw Error('Nao foi possivel carregar o depurador.');
  python.runPython(await response.text());
 })();
 return loading;
}
onmessage=async({data})=>{
 if(busy)return;
 busy=true;
 try{
  await boot();
  if(data.command==='start'){
   python.globals.set('_source',data.source);
   const points=python.toPy(data.breakpoints);
   python.globals.set('_points',points);points.destroy();
   python.runPython('_execution = _prepare(_source, _points)');
  }
  if(data.answer!==undefined)python.globals.set('_answer',data.answer);
  let event=JSON.parse(python.runPython(data.answer===undefined?'_advance()':'_advance(_answer)'));
  const journal=new Map();
  function collect(event){for(const entry of event.events??[]){const key=`${entry.scope}:${entry.line}:${entry.kind}`;const previous=journal.get(key);journal.set(key,{...entry,count:entry.count+(previous?.count??0),yes:(entry.yes??0)+(previous?.yes??0),no:(entry.no??0)+(previous?.no??0)});}}
  collect(event);
  if(data.command==='continue'){
   let count=0;
   while(event.type==='pause'){
    if(++count%200===0)await new Promise(resolve=>setTimeout(resolve,0));
    event=JSON.parse(python.runPython('_advance()'));collect(event);
   }
  }
  event.events=[...journal.values()];
  send(event);
 }catch(error){send({type:'error',text:String(error)});}
 finally{busy=false;}
};
