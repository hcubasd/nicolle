import { kruskal, inspectNetwork, compareEdges } from './core';
import { maps, type GameMap } from './maps';
const saved = { map: 0, chosen: new Set<string>(), step: 0, mode: 'play', revealed: false, message: '' };
export function gamePage(): string {
  return `<main class="page game-page"><a class="back-link" href="#/grafos">← Roadmap de Grafos</a><div class="page-heading"><p class="eyebrow">Trabalho · entrega em 13 de outubro de 2026</p><h1 id="view-title" tabindex="-1">Vila dos Bichinhos</h1><p class="subtitle">Construa caminhos para conectar todas as ilhas gastando o mínimo possível.</p><p class="subtitle"><a href="#/grafos/kruskal/aula">Aprender Kruskal em Python →</a></p></div><div id="game-root"></div><section class="lesson-panel glass" data-glass><h2>O que apresentar</h2><p>Jogue uma rodada e use a trapaça: ela calcula uma árvore geradora mínima com Kruskal. Depois explique a ordem dos custos, a comparação dos grupos e a rejeição de um ciclo. A conexão pode passar por outras ilhas; não é preciso visitar todas em uma viagem.</p><p>Ilhas são vértices; caminhos são arestas; números são custos. Linhas que se cruzam não criam uma ilha. O objetivo é uma rede conectada, não uma rota de TSP.</p><p><a href="${import.meta.env.BASE_URL}grafos/agm.pdf" target="_blank" rel="noopener">Slides do professor ↗</a> · <a href="${import.meta.env.BASE_URL}grafos/kruskal.py" download>Algoritmo em Python ↓</a></p><p class="footnote">Prazo informado: 13/10. Formato de entrega, horário e peso da atividade ainda precisam ser confirmados com o professor.</p></section></main>`;
}
function geometry(map: GameMap, a: string, b: string): { path: string; x: number; y: number } {
  const p = map.islands.find(i => i.id === a)!, q = map.islands.find(i => i.id === b)!;
  if (map.id === 'village' && (a + b === 'AC' || a + b === 'DF')) {
    const cy = a + b === 'AC' ? -80 : 610;
    return { path: `M${p.x},${p.y} Q400,${cy} ${q.x},${q.y}`, x: 400, y: (p.y + q.y) / 4 + cy / 2 };
  }
  const t = a + b === 'AC' ? .37 : a + b === 'BD' ? .67 : a + b === 'CE' ? .68 : a + b === 'BF' ? .32 : .5;
  return { path: `M${p.x},${p.y} L${q.x},${q.y}`, x: p.x + (q.x-p.x)*t, y: p.y + (q.y-p.y)*t };
}
export function mountGame(root: HTMLElement): () => void {
  function draw(focus?: string): void {
    const map = maps[saved.map], vertices = map.islands.map(i => i.id), solution = kruskal(vertices, map.edges);
    const teaching = saved.mode === 'learn';
    const trace = teaching && saved.step ? solution.steps[saved.step-1] : undefined;
    const chosen = teaching ? new Set(trace?.selected || []) : saved.chosen;
    const network = inspectNetwork(vertices, map.edges.filter(e => chosen.has(e.id)));
    const groups = trace?.after || network.groups;
    const status = teaching ? trace ? `${trace.edge.a}–${trace.edge.b}, custo ${trace.edge.cost}: ${trace.accepted ? 'aceitar, pois os grupos eram diferentes. Unimos os dois grupos.' : 'rejeitar, pois os extremos já estavam no mesmo grupo. Esse caminho fecharia um ciclo.'}` : 'Cada ilha começa em seu próprio grupo. Examine as arestas em ordem crescente de custo.' : saved.message || 'Clique nos custos para construir ou remover caminhos. Depois confira sua rede.';
    root.innerHTML = `<div class="game-toolbar glass" data-glass><label>Mapa <select id="game-map">${maps.map((m,i)=>`<option value="${i}" ${i===saved.map?'selected':''}>${m.title}</option>`).join('')}</select></label><div class="filter-group"><button data-action="play" aria-pressed="${!teaching}">Jogar</button><button data-action="learn" aria-pressed="${teaching}">Ver Kruskal passo a passo</button></div></div>
    <div class="island-board" aria-label="Mapa de caminhos"><svg viewBox="0 0 800 560" aria-hidden="true"><defs><mask id="edge-mask"><rect width="800" height="560" fill="white"/>${map.islands.map(i=>`<circle cx="${i.x}" cy="${i.y}" r="54" fill="black"/>`).join('')}${map.edges.map(e=>{const g=geometry(map,e.a,e.b);return `<circle cx="${g.x}" cy="${g.y}" r="23" fill="black"/>`;}).join('')}</mask></defs><g mask="url(#edge-mask)">${map.edges.map(e=>`<path d="${geometry(map,e.a,e.b).path}" class="bridge ${chosen.has(e.id)?'built':''} ${trace?.edge.id===e.id&&!trace.accepted?'rejected':''}"/>`).join('')}</g></svg>
    ${map.islands.map(i=>`<div class="island-position" style="left:${i.x/8}%;top:${i.y/5.6}%"><div class="island glass" data-glass><span class="animal" data-animal="${i.animal}" style="background-image:url('${import.meta.env.BASE_URL}grafos/animals/${i.animal}.png')" aria-hidden="true"></span><strong>${i.id}</strong></div><span class="island-name">${i.name}</span><small>grupo ${groups[i.id]}</small></div>`).join('')}
    ${map.edges.map(e=>{const g=geometry(map,e.a,e.b);return `<button class="cost-button glass" data-glass data-edge="${e.id}" style="left:${g.x/8}%;top:${g.y/5.6}%" aria-label="Caminho ${e.a}–${e.b}, custo ${e.cost}" aria-pressed="${chosen.has(e.id)}" ${teaching?'disabled':''}>${e.cost}</button>`;}).join('')}</div>
    <section class="game-feedback glass" data-glass><div class="network-stats"><span><strong>${network.total}</strong> custo</span><span><strong>${network.count}</strong> ${network.count===1?'grupo':'grupos'}</span><span><strong>${chosen.size}/${vertices.length-1}</strong> caminhos da árvore</span></div><p role="status" aria-live="polite">${status}</p><div class="game-actions">${teaching?`<button data-action="previous" ${saved.step===0?'disabled':''}>← Anterior</button><span>${saved.step}/${solution.steps.length}</span><button data-action="next" ${saved.step===solution.steps.length?'disabled':''}>Próxima aresta →</button>`:`<button data-action="check">Conferir rede</button><button data-action="cheat">Trapaça: usar Kruskal</button><button data-action="reset">Recomeçar</button>`}</div></section>
    <details class="lesson-panel glass" data-glass ${teaching?'open':''}><summary>Lista de caminhos · menor custo primeiro</summary><div class="edge-list">${[...map.edges].sort(compareEdges).map(e=>{const examined=teaching?solution.steps.slice(0,saved.step).find(s=>s.edge.id===e.id):undefined;return `<button data-edge="${e.id}" aria-pressed="${chosen.has(e.id)}" ${teaching?'disabled':''}>${e.a}–${e.b} · ${e.cost}<small>${examined?(examined.accepted?'aceito':'ciclo: rejeitado'):chosen.has(e.id)?'construído':'disponível'}</small></button>`;}).join('')}</div><p class="footnote">Traços pontilhados: disponíveis. Traços contínuos: construídos. Cada caminho pode ser acionado também nesta lista.</p>${teaching&&saved.step===solution.steps.length?`<p>Terminamos: ${vertices.length-1} caminhos, todas as ilhas conectadas e custo mínimo ${solution.total}. As arestas restantes não precisam ser examinadas. Em empates, outras árvores podem ter o mesmo custo mínimo.</p>`:''}</details>`;
    if (focus) root.querySelector<HTMLElement>(focus)?.focus({preventScroll:true});
  }
  const click = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!button || button.disabled) return;
    if (button.dataset.edge && saved.mode==='play') { const id=button.dataset.edge; saved.chosen.has(id)?saved.chosen.delete(id):saved.chosen.add(id); saved.message=''; saved.revealed=false; }
    const action=button.dataset.action;
    const map=maps[saved.map], solution=kruskal(map.islands.map(i=>i.id),map.edges);
    if (action==='play'||action==='learn') saved.mode=action;
    if (action==='next') saved.step=Math.min(saved.step+1,solution.steps.length);
    if (action==='previous') saved.step=Math.max(0,saved.step-1);
    if (action==='reset') { saved.chosen.clear(); saved.message=''; saved.revealed=false; }
    if (action==='cheat') { saved.chosen=new Set(solution.edges.map(e=>e.id)); saved.revealed=true; saved.message=`Kruskal construiu a rede mínima: custo ${solution.total}. A trapaça executa o algoritmo; veja as decisões no modo passo a passo.`; }
    if (action==='check') {
      const net=inspectNetwork(map.islands.map(i=>i.id),map.edges.filter(e=>saved.chosen.has(e.id)));
      saved.message=net.count!==1?'Ainda há ilhas separadas. Conecte todos os grupos.':net.total===solution.total?(saved.revealed?'Rede mínima revelada por Kruskal!':'Você encontrou uma rede de custo mínimo!'): `Todas as ilhas estão conectadas, mas é possível gastar menos que ${net.total}. Experimente remover ciclos e trocar caminhos caros.`;
    }
    draw(button.dataset.edge?`[data-edge="${button.dataset.edge}"]`:action?`[data-action="${action}"]`:undefined);
  };
  const change=(event:Event):void=>{if((event.target as HTMLElement).id==='game-map'){saved.map=Number((event.target as HTMLSelectElement).value);saved.chosen.clear();saved.step=0;saved.message='';saved.revealed=false;draw('#game-map');}};
  root.addEventListener('click',click);root.addEventListener('change',change);draw();
  return ()=>{root.removeEventListener('click',click);root.removeEventListener('change',change);};
}
