import 'katex/dist/katex.min.css';
import './review.css';
import katex from 'katex';
import {mapColors} from 'nicrainha';
import {missions,allQuestions,questionMission,type Mission,type Question} from './content';
import {readProgress,saveProgress,markAnswer,type Progress} from './progress';
import {parseAnswer,isCorrect} from './math';
import {sprites} from '../rescue/sprites';
import {labMarkup,mountLab} from './labs';
import {invalidateScene,scrollPageTo,pageScrollTop} from '../scene';
const base='#/eletricidade/prova-2';
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function rich(text:string):string {
 const pattern=/\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g;let html='',last=0;
 for(const match of text.matchAll(pattern)){html+=esc(text.slice(last,match.index));html+=katex.renderToString(match[1]??match[2],{displayMode:!!match[1],throwOnError:false,strict:'ignore',output:'htmlAndMathml'});last=match.index!+match[0].length;}
 return html+esc(text.slice(last));
}
const picture=(animal:string)=>{const size=sprites[animal as keyof typeof sprites];return `<span class="review-animal" aria-hidden="true" style="width:${size.width}px;height:${size.height}px;--animal-cycle:-${size.width*4}px;background-image:url('${import.meta.env.BASE_URL}grafos/animals/${animal}.png')"></span>`;};
const completed=(p:Progress,m:Mission)=>m.questions.every(q=>p.solved.includes(q.id));
const title=(text:string)=>{document.title='Nicolle';return text;};
function shell(root:HTMLElement,back:string,label:string,p:Progress,content:string):void {
 root.innerHTML=`<section class="python-screen review-screen"><header class="game-head review-head"><a class="glass" data-glass href="${back}">← ${label}</a><span class="glass review-wallet" data-glass><strong data-review-xp>${p.xp} XP</strong></span></header><main class="python-scroll review-scroll">${content}</main></section>`;
 const colors=mapColors([{r:0,g:180,b:80},{r:255,g:180,b:0},{r:200,g:100,b:255}]);
 colors.forEach((c,i)=>root.style.setProperty(`--review-color-${i}`,`rgb(${c.r} ${c.g} ${c.b})`));
 const pane=root.querySelector<HTMLElement>('.review-scroll')!;
 pane.addEventListener('click',event=>{
  const button=(event.target as Element).closest('[data-toggle-sign]');if(!button)return;
  const input=button.closest('form')!.querySelector<HTMLInputElement>('input[name=answer]')!;
  input.value=input.value.startsWith('-')?input.value.slice(1):'-'+input.value;
  input.focus({preventScroll:true});
 });
 let drag:{id:number;x:number;y:number;startX:number;startY:number;moved:boolean}|undefined,suppress=false;
 pane.addEventListener('pointerdown',event=>{
  const target=event.target as Element;suppress=false;
  if(event.pointerType==='mouse'||target.closest('input,select,textarea')||!target.closest('a,button,label,summary'))return;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false};suppress=false;event.stopPropagation();
 });
 pane.addEventListener('pointermove',event=>{
  if(drag?.id!==event.pointerId)return;
  if(Math.abs(event.clientY-drag.startY)>7)drag.moved=true;
  if(drag.moved){try{pane.setPointerCapture(event.pointerId);}catch{/* The pointer may have been cancelled by the browser. */}scrollPageTo(pageScrollTop()-(event.clientY-drag.y));event.stopPropagation();}
  drag.x=event.clientX;drag.y=event.clientY;
 });
 const release=(event:PointerEvent)=>{if(drag?.id===event.pointerId){suppress=drag.moved;drag=undefined;if(pane.hasPointerCapture(event.pointerId))pane.releasePointerCapture(event.pointerId);}};
 pane.addEventListener('pointerup',release);pane.addEventListener('pointercancel',release);
 pane.addEventListener('click',event=>{if(suppress){event.preventDefault();event.stopPropagation();suppress=false;}},true);
 invalidateScene();
}
function card(content:string,extra=''):string{return `<section class="review-card glass ${extra}" data-glass data-glass-clip>${content}</section>`;}
function scrollToElement(el:HTMLElement):void {const viewport=el.closest<HTMLElement>('.python-scroll')!;scrollPageTo(pageScrollTop()+el.getBoundingClientRect().top-viewport.getBoundingClientRect().top-28);}
function formulaSheet():string {return `<details class="review-details"><summary>Ficha rápida de fórmulas</summary><div class="review-formulas">${[
 ['Senoide',String.raw`$\omega=2\pi f$, $T=1/f$, $V_{rms}=V_m/\sqrt2$ (senoide pura).`],
 ['Impedâncias',String.raw`$Z_R=R$, $Z_L=j\omega L$, $Z_C=-j/(\omega C)$, $Y=1/Z$.`],
 ['Corrente de ramo',String.raw`$I_{a\to b}=(V_a-V_b)/Z$. Em ramo compartilhado: $Z(I_1-I_2)$.`],
 ['Fontes especiais',String.raw`Supermalha: LKT externa + restrição da corrente. Supernó: LKC externa + $V_1-V_2=V_s$.`],
 ['Thévenin em CA',String.raw`$I=V_{Th}/(Z_{Th}+Z_{carga})$; máximo com $Z_{carga}=Z_{Th}^*$, se a carga for ajustável e $R_{Th}>0$.`],
 ['Potência RMS',String.raw`$\mathcal S=VI^*=P+jQ$, $S=VI$, $P=S\cos\varphi$, $Q=S\sin\varphi$.`],
 ['Trifásico equilibrado',String.raw`Y: $V_L=\sqrt3V_f$, $I_L=I_f$. Δ: $V_L=V_f$, $I_L=\sqrt3I_f$.`],
 ['Potência trifásica RMS',String.raw`$P=\sqrt3V_LI_Lfp$, $Q=\sqrt3V_LI_L\sin\varphi$, $S=\sqrt3V_LI_L$.`],
 ['Perdas e energia',String.raw`$P_{perda}=I^2R$, $E=P\Delta t$. kW é potência; kWh é energia.`],
 ['Medição',String.raw`$|e_r|=100|x_m-x_{ref}|/|x_{ref}|$. Limite digital: percentual da leitura + contagens × resolução.`]
 ].map(([h,p])=>`<div><strong>${h}</strong><p>${rich(p)}</p></div>`).join('')}</div></details>`;}
function sources():string{return `<details class="review-details"><summary>Escopo da prova e fontes</summary><p>Recorte pelo cronograma de 04608_EMB5121_20262.pdf: depois da Avaliação 01 (23/09) e antes da Avaliação 02 (18/11/2026). A data é prevista e o plano permite alterações.</p><ul><li>25/09–23/10: análise em CA, incluindo regime senoidal e potência (itens 3.1–3.3).</li><li>30/10: geração, transmissão e distribuição.</li><li>04–06/11: circuitos trifásicos.</li><li>11–13/11: instrumentos e medidas.</li></ul><p>Material correspondente encontrado: Aula 08 — Análise de circuitos de CA, 23 páginas, lidas também nas imagens dos circuitos. As Aulas 01–04, os exercícios da Lista 1 e os blocos autônomos de transitórios RC/RL/RLC não foram usados como conteúdo da prova 2. Capacitores e indutores aparecem somente como pré-requisitos da análise senoidal.</p><p>Não foram fornecidos slides específicos de potência, geração/transmissão/distribuição, trifásicos e medidas. Esses blocos são complementos autorais para cobrir os itens do plano; não são uma transcrição das aulas ausentes nem uma garantia sobre questões da prova.</p><p>As explicações e os desenhos desta página são autorais. Referências de apoio:</p><ul><li><a target="_blank" rel="noopener" href="https://eng.libretexts.org/Bookshelves/Electrical_Engineering/Electronics/AC_Electrical_Circuit_Analysis%3A_A_Practical_Approach_(Fiore)">James Fiore — AC Electrical Circuit Analysis (fasores, potência e sistemas polifásicos)</a></li><li><a target="_blank" rel="noopener" href="https://www.ons.org.br/paginas/sobre-o-sin/o-que-e-o-sin">ONS — O que é o SIN</a></li><li><a target="_blank" rel="noopener" href="https://www.eia.gov/energyexplained/electricity/delivery-to-consumers.php">EIA — entrega de eletricidade e transformadores</a></li><li><a target="_blank" rel="noopener" href="https://www.fluke.com/en-au/support/digital-multimeter-frequently-asked-questions">Fluke — contagens e exatidão de multímetros</a></li><li><a target="_blank" rel="noopener" href="https://media.fluke.com/ade6b718-4577-4b57-903b-b10600664c67_original%20file.pdf">Fluke — funções e ligações de multímetros</a></li></ul><p>Nota conferida: na Aula 08, p. 23, a amplitude temporal impressa 7,50 A não coincide com o fasor 7,59 A. A missão de fontes dependentes mostra o recálculo.</p></details>`;}
function campus(p:Progress):string {
 return `<div class="review-campus" aria-label="${missions.filter(m=>completed(p,m)).length} de ${missions.length} setores energizados">${missions.map((m,i)=>`<span class="campus-light ${completed(p,m)?'lit':''}" title="${esc(m.title)}">${i+1}</span>`).join('')}</div>`;
}
function hub(root:HTMLElement,p:Progress):()=>void {
 const total=p.solved.length,done=missions.filter(m=>completed(p,m)).length;
 const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate()),exam=new Date(2026,10,18),days=Math.round((exam.getTime()-today.getTime())/86400000);
 const date=days===1?'Amanhã, 18/11':days===0?'Hoje, 18/11':days>1?`18/11 · faltam ${days} dias`:'18/11/2026';
 shell(root,'#/eletricidade','Eletricidade',p,
  card(`<div class="review-hero-heading">${picture('gato')}<div><p class="review-eyebrow">Eletricidade Aplicada · ${date} · prevista no plano</p><h1>${title('Prova 2')}</h1></div></div><p class="review-intro">Reacenda os ${missions.length} setores do campus. Em cada missão, entenda o circuito, experimente e resolva os desafios. Errar não tira vidas: a resolução mostra como corrigir o raciocínio.</p>${campus(p)}<div class="review-progress-label"><strong>${total} / ${allQuestions.length} desafios</strong><span>${done} / ${missions.length} setores</span></div><progress value="${total}" max="${allQuestions.length}" aria-label="Desafios concluídos"></progress>${done===missions.length?'<p class="review-celebration">Campus energizado! Agora tente o simulado sem consultar as dicas.</p>':''}<div class="review-actions"><a class="review-action" href="${base}/simulado">Simulado · ${missions.length} questões →</a><a class="review-action" href="${base}/treino">Rever pontos frágeis${p.missed.length?` · ${p.missed.length}`:''} →</a></div><p class="review-caption">Progresso salvo neste navegador. Todas as missões estão disponíveis: siga a ordem ou escolha o assunto de que mais precisa.</p>`),
 );
 const document=root.querySelector('.python-scroll')!;
 document.insertAdjacentHTML('beforeend',`<nav class="review-missions" aria-label="Missões da prova 2">${missions.map((m,i)=>{const count=m.questions.filter(q=>p.solved.includes(q.id)).length,done=count===m.questions.length;return `<a class="review-mission glass ${done?'is-complete':''}" data-glass data-glass-clip href="${base}/missao/${m.id}"><span class="review-mission-number">${done?'✓':String(i+1).padStart(2,'0')}</span>${picture(m.animal)}<strong>${esc(m.title)}</strong><span>${esc(m.subtitle)}</span><small>${count}/${m.questions.length} desafios · ~${m.minutes} min</small><progress value="${count}" max="${m.questions.length}" aria-label="Progresso de ${esc(m.title)}"></progress></a>`;}).join('')}</nav>${card(`${formulaSheet()}${sources()}<details class="review-details"><summary>Recomeçar o progresso</summary><p>Isso apaga apenas o progresso desta revisão neste navegador.</p><button class="review-text-button" type="button" id="review-reset">Apagar progresso da prova 2</button></details>`)}`);
 root.querySelector('#review-reset')!.addEventListener('click',()=>{if(confirm('Apagar o progresso desta revisão da prova 2?')){saveProgress({solved:[],missed:[],seen:[],xp:0});hub(root,readProgress());}});
 invalidateScene();return()=>{};
}
function shuffle<T>(list:T[]):T[]{const copy=[...list];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
function questionForm(q:Question,order:number[],selected:string,disabled=false):string {
 return `<form class="review-answer-form" data-question-id="${q.id}"><fieldset ${disabled?'disabled':''}><legend>${rich(q.prompt)}</legend>${q.choices?`<div class="review-choices">${order.map((index,i)=>`<label class="review-choice"><input type="radio" name="answer" value="${index}" ${selected===String(index)?'checked':''} required><span class="review-choice-key">${String.fromCharCode(65+i)}</span><span>${rich(q.choices![index])}</span></label>`).join('')}</div>`:`<label class="review-number-label">Sua resposta${q.unit?` (${esc(q.unit)})`:''}<div class="review-number-row"><button type="button" class="review-sign" data-toggle-sign aria-label="Trocar sinal da resposta">±</button><input name="answer" type="text" inputmode="decimal" enterkeyhint="send" autocomplete="off" value="${esc(selected)}" placeholder="Use vírgula ou ponto" required ${disabled?'disabled':''}><span>${esc(q.unit??'')}</span></div><span class="review-caption">Se necessário, arredonde para 3 casas decimais.</span></label>`}<button class="review-primary" type="submit" ${disabled?'disabled':''}>${disabled?'Resposta conferida':'Conferir resposta'}</button></fieldset></form>`;
}
function answerValue(form:HTMLFormElement,q:Question):number|undefined {
 const raw=new FormData(form).get('answer');if(typeof raw!=='string')return;
 return q.choices?Number(raw):parseAnswer(raw);
}
function solution(q:Question):string {return `<h3>Como chegar à resposta</h3>${q.solution.map(p=>`<p>${rich(p)}</p>`).join('')}`;}
function installChallenges(root:HTMLElement,host:HTMLElement,p:Progress,questions:Question[],start=0,nextMission?:Mission):()=>void {
 let index=start,selected='',hinted=false,correct=false,attempted=false,revealed=false;
 const orders=new Map(questions.map(q=>[q.id,shuffle(q.choices?.map((_,i)=>i)??[])]));
 function render():void {
  const q=questions[index];
  if(!q){host.innerHTML=`<div class="review-finished">${picture(nextMission?.animal??'gato')}<h2>Setor concluído!</h2><p>Você passou pelos desafios desta missão. Volte aos pontos frágeis para tentar sem ajuda.</p><div class="review-actions">${nextMission?`<a class="review-action" href="${base}/missao/${nextMission.id}">Próxima missão →</a>`:''}<a class="review-action" href="${base}">Ver campus →</a><button class="review-text-button" type="button" data-practice-again>Praticar de novo</button></div></div>`;host.querySelector('[data-practice-again]')!.addEventListener('click',()=>{index=0;reset();render();});invalidateScene();return;}
  host.innerHTML=`<div class="review-question-top"><span>Desafio ${index+1} / ${questions.length}</span><span>${p.solved.includes(q.id)?'✓ Já concluído':'+15 XP · +10 com ajuda'}</span></div>${questionForm(q,orders.get(q.id)!,selected,correct)}<p class="review-validation" role="alert"></p><div class="review-help"><button type="button" class="review-text-button" data-hint ${correct?'hidden':''}>${hinted?'Dica aberta':'Preciso de uma dica'}</button>${hinted&&!correct?'<button type="button" class="review-text-button" data-reveal>Ver a resolução</button>':''}</div>${hinted&&!correct?`<p class="review-hint">${rich(q.hint)}</p>`:''}<div class="review-feedback ${correct?'correct':attempted?'retry':''}" ${correct||attempted||revealed?'':'hidden'} tabindex="-1" role="status"><p><strong>${correct?'✓ Circuito ajustado!':attempted?'Ainda não. Vamos conferir o raciocínio.':'Acompanhe a resolução e tente responder.'}</strong></p>${solution(q)}${!correct?'<p>Você pode corrigir sua resposta acima. Não há perda de pontos.</p>':''}</div>${correct?'<button class="review-primary" type="button" data-next>Próximo desafio →</button>':''}`;
  const form=host.querySelector<HTMLFormElement>('form')!;
  form.addEventListener('submit',event=>{
   event.preventDefault();const value=answerValue(form,q);
   if(value===undefined){host.querySelector('.review-validation')!.textContent='Digite apenas um número, sem a unidade. Vírgula e ponto são aceitos.';return;}
   selected=String(new FormData(form).get('answer'));correct=isCorrect(q,value);attempted=true;
   if(!correct)hinted=true;
   markAnswer(p,q.id,correct,hinted||revealed);
   root.querySelector('[data-review-xp]')!.textContent=`${p.xp} XP`;
   render();host.querySelector<HTMLElement>('.review-feedback')?.focus({preventScroll:true});
  });
  host.querySelector('[data-hint]')?.addEventListener('click',()=>{selected=String(new FormData(form).get('answer')??'');hinted=true;render();});
  host.querySelector('[data-reveal]')?.addEventListener('click',()=>{selected=String(new FormData(form).get('answer')??'');hinted=true;revealed=true;render();});
  host.querySelector('[data-next]')?.addEventListener('click',()=>{index++;reset();render();scrollToElement(host);});
  invalidateScene();
 }
 function reset():void {selected='';hinted=false;correct=false;attempted=false;revealed=false;}
 render();return()=>{};
}
function missionView(root:HTMLElement,p:Progress,m:Mission):()=>void {
 if(!p.seen.includes(m.id)){p.seen.push(m.id);saveProgress(p);}
 const index=missions.indexOf(m);
 shell(root,base,'Missões',p,
  card(`<div class="review-hero-heading">${picture(m.animal)}<div><p class="review-eyebrow">Missão ${index+1} / ${missions.length} · ~${m.minutes} min</p><h1>${title(esc(m.title))}</h1><p>${esc(m.subtitle)}</p></div></div><p class="review-caption">${esc(m.source)}</p><button type="button" class="review-text-button" data-go-challenge>Ir aos desafios ↓</button>`)+
  card(m.lessons.map((l,i)=>`<article class="review-lesson"><p class="review-eyebrow">Passo ${i+1}</p><h2>${esc(l.title)}</h2>${l.paragraphs.map(p=>`<p>${rich(p)}</p>`).join('')}</article>`).join('')+labMarkup(m),'review-reading')+
  card('<h2>Coloque em prática</h2><div class="review-challenges"></div>','review-challenge-card')
 );
 const host=root.querySelector<HTMLElement>('.review-challenges')!;
 const first=m.questions.findIndex(q=>!p.solved.includes(q.id));
 const cleanupQuiz=installChallenges(root,host,p,m.questions,Math.max(0,first),missions[index+1]);
 root.querySelector('[data-go-challenge]')!.addEventListener('click',()=>scrollToElement(host));
 const cleanupLab=mountLab(root,m);return()=>{cleanupQuiz();cleanupLab();};
}
function practice(root:HTMLElement,p:Progress):()=>void {
 const questions=p.missed.length?allQuestions.filter(q=>p.missed.includes(q.id)):shuffle(missions.map(m=>m.questions[0]));
 shell(root,base,'Missões',p,card(`<h1>Pontos frágeis</h1><p>${p.missed.length?'Retome as questões em que precisou de ajuda. Acertar sem abrir a dica retira a questão desta lista.':'Ainda não há dificuldades registradas. Aqui vai um desafio de cada missão para aquecer.'}</p>`)+card('<div class="review-challenges"></div>'));
 return installChallenges(root,root.querySelector('.review-challenges')!,p,questions);
}
function mockExam(root:HTMLElement,p:Progress):()=>void {
 const questions=shuffle(missions.map(m=>shuffle(m.questions)[0])),orders=questions.map(q=>shuffle(q.choices?.map((_,i)=>i)??[])),answers:string[]=questions.map(()=>''),started=Date.now();
 let index=0,done=false;
 shell(root,base,'Missões',p,card(`<div class="review-question-top"><span>Simulado · ${questions.length} questões</span><span data-exam-time>00:00</span></div><h1>Teste sem dicas</h1><p>Simulado autoral: uma questão de cada missão, em ordem sorteada. Sem limite de tempo. Não reproduz uma prova do professor. Você pode voltar e revisar respostas; as resoluções aparecem ao entregar.</p>`)+card('<div class="review-exam"></div>'));
 const host=root.querySelector<HTMLElement>('.review-exam')!;
 function render():void {
  const q=questions[index];
  host.innerHTML=`<p class="review-eyebrow">Questão ${index+1} / ${questions.length} · ${esc(questionMission(q.id).title)}</p>${questionForm(q,orders[index],answers[index])}<p class="review-validation" role="alert"></p><div class="review-actions"><button class="review-text-button" type="button" data-exam-back ${index===0?'disabled':''}>← Anterior</button><button class="review-text-button" type="button" data-exam-skip>Pular por enquanto →</button></div>`;
  const form=host.querySelector<HTMLFormElement>('form')!;
  form.querySelector('button[type=submit]')!.textContent=index===questions.length-1?'Entregar simulado':'Próxima questão →';
  function capture():boolean {const raw=String(new FormData(form).get('answer')??'');if(raw!==''&&!q.choices&&parseAnswer(raw)===undefined){host.querySelector('.review-validation')!.textContent='Use um número, sem a unidade.';return false;}answers[index]=raw;return true;}
  form.addEventListener('submit',e=>{e.preventDefault();if(capture()){if(index===questions.length-1)finish();else{index++;render();scrollToElement(host);}}});
  host.querySelector('[data-exam-back]')!.addEventListener('click',()=>{if(capture()){index--;render();}});
  host.querySelector('[data-exam-skip]')!.addEventListener('click',()=>{if(capture()){if(index===questions.length-1)finish();else{index++;render();}}});
  invalidateScene();
 }
 function finish():void {
  done=true;let count=0;
  const results=questions.map((q,i)=>{const value=answers[i]===''?undefined:q.choices?Number(answers[i]):parseAnswer(answers[i]),right=value!==undefined&&isCorrect(q,value);if(right)count++;markAnswer(p,q.id,right);return{q,right,i};});
  root.querySelector('[data-review-xp]')!.textContent=`${p.xp} XP`;
  host.innerHTML=`${picture(count===questions.length?'gato':'coelho')}<h2>${count} / ${questions.length} respostas corretas</h2><p>${count===questions.length?'Todos os setores responderam!':'As questões a retomar estão em Pontos frágeis. Abra cada resolução e confira seu raciocínio.'}</p><div class="review-actions"><a class="review-action" href="${base}/treino">Rever pontos frágeis →</a><a class="review-action" href="${base}">Voltar ao campus →</a></div>${results.map(({q,right,i})=>`<details class="review-details" ${right?'':'open'}><summary>${right?'✓':'↻'} Questão ${i+1} · ${esc(questionMission(q.id).title)}</summary><p>${rich(q.prompt)}</p><p>Sua resposta: ${answers[i]===''?'não respondida':rich(q.choices?q.choices[Number(answers[i])]:`${answers[i]} ${q.unit??''}`)}</p>${solution(q)}</details>`).join('')}`;
  scrollToElement(host);invalidateScene();
 }
 const timer=setInterval(()=>{if(!done){const secs=Math.floor((Date.now()-started)/1000);root.querySelector('[data-exam-time]')!.textContent=`${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;}},1000);
 render();return()=>clearInterval(timer);
}
export function mountElectricity(root:HTMLElement,route:string):()=>void {
 const p=readProgress();
 if(route==='/eletricidade'){
  shell(root,'#/','Disciplinas',p,card(`<p class="review-eyebrow">EMB5121 · 2026/2</p><h1>Eletricidade Aplicada</h1><a class="review-course-link" href="${base}"><span>Prova 2<small>Revisão em missões · CA, rede elétrica, trifásicos e medidas</small></span><span aria-hidden="true">→</span></a>`));return()=>{};
 }
 if(route.endsWith('/simulado'))return mockExam(root,p);
 if(route.endsWith('/treino'))return practice(root,p);
 const m=missions.find(m=>route===`/eletricidade/prova-2/missao/${m.id}`);
 if(m)return missionView(root,p,m);
 return hub(root,p);
}
