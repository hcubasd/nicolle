import { graphCourse, graphEvents, type CourseEvent } from './data/grafos';
import './styles.css';
import './scene';
import { gamePage, mountGame } from './kruskal/game';
import { lessonPage, mountLesson } from './lessons/tutorial';

const app = document.querySelector<HTMLDivElement>('#app')!;
const kinds = { aula: 'Aula', prova: 'Prova', trabalho: 'Trabalho', devolutiva: 'Devolutiva', recuperacao: 'Recuperação' };
const courses = [
  { title: 'Eletricidade Aplicada', code: 'EMB5121', hours: 72 },
  { title: 'Grafos e Redes', code: 'EMB5938', hours: 54, href: '#/grafos' },
  { title: 'Logística III', code: 'EMB5934', hours: 72 },
  { title: 'Planejamento de Transportes Públicos', code: 'EMB5916', hours: 72 },
  { title: 'Sistemas Inteligentes de Transporte', code: 'EMB5901', hours: 72 },
  { title: 'Engenharia de Tráfego II', code: 'EMB5936', hours: 54 },
];
let period: 'upcoming' | 'semester' = 'upcoming';
let category: 'all' | 'assessments' | 'classes' = 'all';
let currentHash = location.hash || '#/';
const scrollPositions = new Map<string, number>();
const esc = (text: string): string => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const materialUrl = (name: string): string => `${import.meta.env.BASE_URL}grafos/${name}`;
const eventUrl = (event: CourseEvent): string => `#/grafos/evento/${event.id}`;

function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function dateObject(date: string): Date { return new Date(`${date}T12:00:00`); }
function fullDate(date: string): string {
  return dateObject(date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function dateDistance(date: string): string {
  // Compare calendar days without DST affecting the day count.
  const days = Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today()}T12:00:00Z`)) / 86400000);
  if (days < 0) return 'Data passada';
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  return `Em ${days} dias`;
}
function topbar(onGraphs: boolean): string {
  return `<header class="topbar glass" data-glass>
    <a class="brand" href="#/" aria-label="Nicolle — início">Nicolle<span class="brand-dot" aria-hidden="true">.</span></a>
    <nav class="topnav" aria-label="Menu principal"><a href="#/" ${!onGraphs ? 'aria-current="page"' : ''}>Disciplinas</a>${onGraphs ? '<a href="#/grafos" aria-current="page">Grafos</a>' : ''}</nav>
    <time class="today" datetime="${today()}" title="${fullDate(today())}">${dateObject(today()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</time>
  </header>`;
}
function home(): string {
  document.title = 'Nicolle · Disciplinas';
  return `${topbar(false)}<main class="page home-page" aria-labelledby="view-title">
    <div class="page-heading"><p class="eyebrow">UFSC Joinville · 2026/2</p><h1 id="view-title" tabindex="-1">Disciplinas</h1><p class="subtitle">Engenharia de Transportes e Logística</p></div>
    <ul class="courses">${courses.map(course => {
      const body = `<div class="course-copy"><span class="course-name">${esc(course.title)}</span><span class="course-meta">${course.code} · ${course.hours} h/a${!course.href ? ' · Em breve' : ''}</span></div><span class="menu-arrow" aria-hidden="true">${course.href ? '↗' : '·'}</span>`;
      return `<li>${course.href ? `<a class="course glass" data-glass href="${course.href}">${body}</a>` : `<button class="course glass" data-glass type="button" aria-disabled="true">${body}</button>`}</li>`;
    }).join('')}</ul>
    <p class="footnote">Grafos e Redes já tem roadmap. As outras disciplinas chegam depois.</p>
  </main>`;
}
function isAssessment(event: CourseEvent): boolean { return event.kind !== 'aula'; }
function dateBadge(event: CourseEvent): string {
  if (!event.date) return '<span class="date-badge undated"><span>—</span><small>A definir</small></span>';
  const date = dateObject(event.date);
  return `<time class="date-badge" datetime="${event.date}"><span>${String(date.getDate()).padStart(2, '0')}</span><small>${date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</small></time>`;
}
function eventCard(event: CourseEvent): string {
  const nextClass = graphEvents.find(e => e.kind === 'aula' && e.date && e.date >= today());
  const descriptor = event.id === nextClass?.id ? 'Próxima aula' : event.date ? dateDistance(event.date) : 'Prazo a confirmar';
  return `<li><a class="event-card glass" data-glass href="${eventUrl(event)}" data-event="${event.id}">
    ${dateBadge(event)}<div class="event-copy"><span class="event-kind">${kinds[event.kind]}${event.kind === 'prova' ? event.id === 'grafos-6' ? ' · 35%' : ' · 45%' : ''}</span><span class="event-title">${esc(event.title)}</span><span class="event-meta">${descriptor}${event.time ? ` · ${event.time}` : ''}${event.kind === 'recuperacao' || event.kind === 'devolutiva' ? ' · Se aplicável' : ''}</span></div><span class="menu-arrow" aria-hidden="true">↗</span>
  </a></li>`;
}
function filters(): string {
  const buttons = (options: { value: string; title: string }[], selected: string, attribute: string): string => options.map(option => `<button type="button" class="filter-button" ${attribute}="${option.value}" aria-pressed="${option.value === selected}">${option.title}</button>`).join('');
  return `<div class="roadmap-menu glass" data-glass aria-label="Opções do roadmap"><div class="filter-group" role="group" aria-label="Período">${buttons([{ value: 'upcoming', title: 'Daqui em diante' }, { value: 'semester', title: 'Semestre inteiro' }], period, 'data-period')}</div><div class="filter-group" role="group" aria-label="Tipo de evento">${buttons([{ value: 'all', title: 'Tudo' }, { value: 'assessments', title: 'Avaliações' }, { value: 'classes', title: 'Aulas' }], category, 'data-category')}</div></div>`;
}
function roadmap(): string {
  document.title = 'Grafos e Redes · Nicolle';
  const selected = graphEvents.filter(event => (!event.date || period === 'semester' || event.date >= today()) && (category === 'all' || (category === 'assessments' ? isAssessment(event) : event.kind === 'aula')));
  const groups = new Map<string, CourseEvent[]>();
  // Keep any undated assignments separate from scheduled events.
  [...selected.filter(e => !e.date), ...selected.filter(e => e.date)].forEach(event => {
    const group = event.date ? event.date.slice(0, 7) : 'undated';
    const members = groups.get(group) || []; members.push(event); groups.set(group, members);
  });
  const timeline = [...groups.entries()].map(([month, events]) => {
    const label = month === 'undated' ? 'Sem data definida' : dateObject(`${month}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return `<section class="timeline-group" aria-label="${label}"><h2 class="month-label">${label}</h2><ol class="events">${events.map(eventCard).join('')}</ol></section>`;
  }).join('');
  return `${topbar(true)}<main class="page roadmap-page" aria-labelledby="view-title"><div class="page-heading"><p class="eyebrow">${graphCourse.code} · 2026/2</p><h1 id="view-title" tabindex="-1">Grafos e Redes</h1><p class="subtitle">${graphCourse.schedule}<span class="desktop-separator"> · </span><span class="teacher">${graphCourse.teacher}</span></p><p class="grading">${graphCourse.grading}</p></div>
    ${filters()}<div class="timeline">${timeline || '<div class="empty glass" data-glass>Nenhum evento neste período. Escolha “Semestre inteiro” para consultar o curso.</div>'}</div>
    <footer class="course-footer"><span>Datas previstas no plano, sujeitas a alterações.</span><a href="${materialUrl('plano-de-ensino.pdf')}" target="_blank" rel="noopener">Plano de ensino ↗</a></footer>
  </main>`;
}
function detail(event: CourseEvent): string {
  document.title = `${event.title} · Grafos · Nicolle`;
  const date = event.date ? fullDate(event.date) : 'Prazo a confirmar';
  const isProject = event.kind === 'trabalho';
  const materialLinks = event.materials.includes('agm') ? `<li><a href="${materialUrl('agm.pdf')}" target="_blank" rel="noopener">Árvores geradoras mínimas · slides do professor ↗</a><small>Prim, conjuntos disjuntos e Kruskal · 8 páginas</small></li>` : '';
  const development = isProject ? `<section class="detail-section"><h2>Desenvolvimento do trabalho</h2><p>A proposta é a <strong>Vila dos Bichinhos</strong>: casas são vértices, caminhos possíveis são arestas e o custo de construção é o peso. O jogador escolhe caminhos; Kruskal revela a rede de menor custo.</p><ol class="development-steps"><li><strong>Definir o puzzle.</strong> Um mapa pequeno, custos fixos e todas as casas conectáveis.</li><li><strong>Construir o jogo.</strong> Interface em HTML e TypeScript, com uma demonstração passo a passo.</li><li><strong>Entender o algoritmo.</strong> Ordenar arestas, identificar grupos, unir grupos diferentes e evitar ciclos. Relacionar a versão simples com os conjuntos disjuntos da aula.</li><li><strong>Preparar a apresentação.</strong> Resolver um exemplo pequeno e explicar as decisões do código.</li></ol><p class="detail-note">O jogo e a aula em Python estão disponíveis na página do trabalho.</p></section>` : '';
  return `${topbar(true)}<main class="page detail-page" aria-labelledby="view-title"><a class="back-link" href="#/grafos">← Voltar ao roadmap</a><article class="detail-panel glass" data-glass><header class="detail-heading"><p class="eyebrow">Grafos e Redes · ${kinds[event.kind]}</p><h1 id="view-title" tabindex="-1">${esc(event.title)}</h1><p class="detail-date">${isProject ? 'Entrega · ' : ''}${event.date ? `<time datetime="${event.date}">${date}</time>` : date}${event.time ? ` · ${event.time}` : ''}</p></header>
    <section class="detail-section"><h2>${isProject ? 'A atividade' : 'Conteúdo previsto'}</h2><ul class="topic-list">${event.topics.map(topic => `<li>${esc(topic)}</li>`).join('')}</ul></section>
    ${development}
    ${event.notes.length ? `<section class="detail-section"><h2>${isProject ? 'A confirmar' : 'Sobre a avaliação'}</h2><ul class="topic-list">${event.notes.map(note => `<li>${esc(note)}</li>`).join('')}</ul></section>` : ''}
    <section class="detail-section"><h2>Materiais</h2><ul class="material-list">${materialLinks}<li><a href="${materialUrl('plano-de-ensino.pdf')}" target="_blank" rel="noopener">Plano de ensino · Grafos e Redes ↗</a></li></ul>${event.id === 'grafos-8' ? `<a class="related-link" href="#/grafos/evento/jogo-kruskal">Ver trabalho: Jogo com Kruskal →</a>` : ''}</section>
    <footer class="detail-source">${esc(event.source)}${event.date ? ' Datas sujeitas a alterações.' : ''}</footer>
  </article></main>`;
}
let cleanupPage: (() => void) | undefined;
function render(): void {
  cleanupPage?.(); cleanupPage = undefined;
  const route = (location.hash || '#/').slice(1).replace(/\/$/, '') || '/';
  if (route === '/') app.innerHTML = home();
  else if (route === '/grafos') app.innerHTML = roadmap();
  else if (route === '/grafos/kruskal/aula') {
    document.title = 'Aprender Kruskal · Nicolle';
    app.innerHTML = topbar(true) + lessonPage();
    cleanupPage = mountLesson(app);
  } else if (route === '/grafos/evento/jogo-kruskal' || route === '/grafos/kruskal/jogo') {
    document.title = 'Vila dos Bichinhos · Nicolle';
    app.innerHTML = topbar(true) + gamePage();
    cleanupPage = mountGame(app.querySelector<HTMLElement>('#game-root')!);
  } else if (route.startsWith('/grafos/evento/')) {
    const event = graphEvents.find(item => item.id === route.slice('/grafos/evento/'.length));
    app.innerHTML = event ? detail(event) : `${topbar(true)}<main class="page"><div class="detail-panel glass" data-glass><h1 id="view-title" tabindex="-1">Evento não encontrado</h1><a href="#/grafos">Voltar ao roadmap →</a></div></main>`;
  } else {
    app.innerHTML = `${topbar(false)}<main class="page"><div class="detail-panel glass" data-glass><h1 id="view-title" tabindex="-1">Página não encontrada</h1><a href="#/">Voltar às disciplinas →</a></div></main>`;
  }
}
window.addEventListener('hashchange', () => {
  scrollPositions.set(currentHash, window.scrollY);
  currentHash = location.hash || '#/';
  render();
  document.querySelector<HTMLElement>('#view-title')?.focus({ preventScroll: true });
  window.scrollTo(0, scrollPositions.get(currentHash) || 0);
});
app.addEventListener('click', event => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-period], button[data-category]');
  if (!target) return;
  if (target.dataset.period) period = target.dataset.period as typeof period;
  if (target.dataset.category) category = target.dataset.category as typeof category;
  const selector = target.dataset.period ? `[data-period="${period}"]` : `[data-category="${category}"]`;
  render();
  document.querySelector<HTMLButtonElement>(selector)?.focus({ preventScroll: true });
});
render();
let lastDate = today();
setInterval(() => {
  if (today() !== lastDate) {
    lastDate = today();
    if (location.hash.includes('kruskal')) {
      const dateLabel = app.querySelector<HTMLTimeElement>('.today');
      if (dateLabel) { dateLabel.dateTime = today(); dateLabel.title = fullDate(today()); dateLabel.textContent = dateObject(today()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
    } else render();
  }
}, 30000);
