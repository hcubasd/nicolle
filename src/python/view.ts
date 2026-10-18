import source from './prim.py?raw';
import {musicButton} from '../rescue/sound';
import {applyCodeColors,highlight,escape} from './highlight';
import {breakpoints,explain,pending,type Pause} from './steps';
import {invalidateScene,setStage} from '../scene';

export function mountPython(root:HTMLElement):()=>void {
 root.innerHTML=`<section class="python-screen"><header class="game-head python-head"><a class="game-back glass" data-glass href="#/grafos/prim">Menu</a>${musicButton()}<button class="glass python-run" data-glass type="button">Executar</button></header><main class="python-scroll"><section class="python-code-card glass" data-glass data-glass-clip><div class="python-code-heading"><h1>Prim em Python</h1><a href="${import.meta.env.BASE_URL}grafos/python/prim.py" download>Baixar .py</a><button type="button" class="python-copy">Copiar</button><button type="button" class="python-restart" hidden>Reiniciar</button></div><p class="python-guide">Clique em Executar para começar. A faixa cinza marca a próxima linha do código. Use Próximo passo para avançar até a próxima pausa. Digite as respostas no terminal abaixo do código e pressione Enter ou toque no botão Enter. O painel no fim da página explica o que foi executado entre as pausas, com os valores usados; as etapas anteriores podem ser reabertas.</p><div class="python-code" tabindex="0" role="region" aria-label="Código Python completo"><pre><code>${source.split('\n').map((line,i)=>`<span class="python-line" data-line="${i+1}"><span class="line-number" aria-hidden="true">${i+1}</span>${highlight(line)||' '}</span>`).join('')}</code></pre></div><div class="python-terminal"><pre class="python-output" role="log" aria-label="Terminal Python"></pre><form class="python-input" hidden><label for="python-answer"></label><input id="python-answer" type="text" inputmode="numeric" enterkeyhint="send" autocomplete="off" aria-label="Resposta no terminal"><button class="terminal-enter" type="submit" aria-label="Enviar resposta">Enter ↵</button></form></div></section><section class="python-explanation glass" data-glass data-glass-clip aria-labelledby="python-step-title"><button class="python-location" type="button" disabled>Pronto para executar</button><h2 id="python-step-title">Acompanhar a execução</h2><div class="python-story"><p>Executar começa o programa. As funções no início ficam guardadas para usar depois: definir uma função não executa seu corpo.</p><p>Entre duas pausas, este painel conta o que foi executado, com os valores usados nas decisões. A faixa cinza indica a próxima linha.</p></div><p class="python-pending" role="status" aria-live="polite"></p><div class="python-history"></div></section></main></section>`;
 const code=root.querySelector<HTMLElement>('.python-code')!,output=root.querySelector<HTMLElement>('.python-output')!,run=root.querySelector<HTMLButtonElement>('.python-run')!,restart=root.querySelector<HTMLButtonElement>('.python-restart')!,form=root.querySelector<HTMLFormElement>('.python-input')!,input=root.querySelector<HTMLInputElement>('#python-answer')!,locationLabel=root.querySelector<HTMLButtonElement>('.python-location')!,title=root.querySelector<HTMLElement>('#python-step-title')!,story=root.querySelector<HTMLElement>('.python-story')!,waiting=root.querySelector<HTMLElement>('.python-pending')!,history=root.querySelector<HTMLElement>('.python-history')!,scroll=root.querySelector<HTMLElement>('.python-scroll')!;
 applyCodeColors(code);
 let worker:Worker|undefined,disposed=false,selected:HTMLElement|undefined,current:Pause|undefined,busy=false,step=0,previousStory='';
 const lines=source.split('\n');
 function append(text:string):void {output.textContent+=(output.textContent?'\n':'')+text;}
 function controls():void {
  run.disabled=busy||(!!worker&&current?.type!=='pause');
  form.hidden=busy||current?.type!=='input';
  run.innerHTML=worker?'<span class="step-wide">Próximo passo</span><span class="step-short">Passo</span>':'Executar';
  run.setAttribute('aria-label',worker?'Próximo passo':'Executar');
  restart.hidden=!worker;
 }
 function request(command:string,answer?:string):void {if(!worker||busy)return;busy=true;controls();worker.postMessage({command,answer});}
 function receive(event:MessageEvent<Pause|{type:'output';text:string}>):void {
  if(disposed)return;
  const data=event.data;
  if(data.type==='output'){append(data.text);return;}
  busy=false;current=data;selected?.classList.remove('current-line');selected?.removeAttribute('aria-current');
  if(previousStory){const details=document.createElement('details');details.innerHTML=`<summary>Etapa ${step}</summary>${previousStory}`;history.prepend(details);}
  step++;
  const entries=data.events??[];
  const paragraphs=entries.map(entry=>`<p><span class="story-line">Linha ${entry.line}${entry.scope!=='jogo'?' · '+escape(entry.scope)+'()':''}</span>${escape(explain(entry,lines[entry.line-1]))}</p>`).join('');
  story.innerHTML=paragraphs||'<p>Nenhuma outra linha foi concluída desde a última pausa: a execução está esperando sua entrada.</p>';
  previousStory=story.innerHTML;title.textContent=step===1?'Onde a execução começa':'O que aconteceu desde a última pausa';
  waiting.textContent=pending(data);
  if(entries.some(entry=>entry.count>1)){const note=document.createElement('p');note.className='story-note';note.textContent='As repetições de uma mesma linha estão reunidas; os valores mostrados são da última passagem.';story.prepend(note);previousStory=story.innerHTML;}
  if(data.line){
   selected=code.querySelector<HTMLElement>(`[data-line="${data.line}"]`)!;selected.classList.add('current-line');selected.setAttribute('aria-current','step');
   locationLabel.textContent=`Linha ${data.line} · ${data.scope==='jogo'?'programa principal':data.scope+'()'} · ver código`;locationLabel.disabled=false;
  }
  if(data.type==='input'){
   form.querySelector('label')!.textContent=data.prompt??'';input.value='';
  }else if(data.type==='done'){
   selected=undefined;locationLabel.textContent='Execução encerrada';locationLabel.disabled=true;
  }else if(data.type==='error'){
   locationLabel.textContent='Execução interrompida';locationLabel.disabled=true;title.textContent='O Python interrompeu o programa';waiting.textContent='Este exemplo espera números inteiros nas entradas. O erro original aparece no terminal; use Reiniciar para começar de novo.';append(data.text??'Erro no Python.');
  }
  controls();invalidateScene();

 }
 function start():void {
  worker?.terminate();worker=new Worker(`${import.meta.env.BASE_URL}grafos/python/runner.js`);worker.onmessage=receive;
  worker.onerror=()=>receive({data:{type:'error',text:'Falha ao carregar o ambiente Python.'}} as MessageEvent<Pause>);
  current=undefined;busy=true;step=0;previousStory='';output.textContent='';history.replaceChildren();form.hidden=true;selected?.classList.remove('current-line');selected?.removeAttribute('aria-current');selected=undefined;locationLabel.disabled=true;
  locationLabel.textContent='Carregando Python…';title.textContent='Preparando a execução';story.innerHTML='<p>O Python é carregado na primeira execução. O código acima também pode ser copiado ou baixado para o Colab.</p>';waiting.textContent='';controls();
  worker.postMessage({command:'start',source,breakpoints:breakpoints(source)});
 }
 run.addEventListener('click',()=>worker?request('step'):start());restart.addEventListener('click',start);
 locationLabel.addEventListener('click',()=>{if(selected)scroll.scrollTo({top:selected.getBoundingClientRect().top-scroll.getBoundingClientRect().top+scroll.scrollTop-48});});
 form.addEventListener('submit',event=>{event.preventDefault();if(!busy){append(`${current?.prompt??''}${input.value}`);request('step',input.value);}});
 root.querySelector<HTMLButtonElement>('.python-copy')!.addEventListener('click',async event=>{const button=event.currentTarget as HTMLButtonElement;try{await navigator.clipboard.writeText(source);button.textContent='Copiado';}catch{button.textContent='Use Baixar .py';}});
 invalidateScene();
 return()=>{disposed=true;worker?.terminate();setStage();};
}
