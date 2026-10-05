/** O algoritmo do jogo. A aula em Python usa a mesma união por rótulos. */
export interface Edge { id: string; a: string; b: string; cost: number; }
export interface KruskalStep {
  edge: Edge;
  accepted: boolean;
  before: Record<string, string>;
  after: Record<string, string>;
  selected: string[];
  total: number;
}
export interface KruskalResult { edges: Edge[]; total: number; steps: KruskalStep[]; connected: boolean; }

export function compareEdges(a: Edge, b: Edge): number {
  return a.cost - b.cost || a.a.localeCompare(b.a) || a.b.localeCompare(b.b) || a.id.localeCompare(b.id);
}

export function kruskal(vertices: readonly string[], edges: readonly Edge[]): KruskalResult {
  if (new Set(vertices).size !== vertices.length) throw new Error('Vértices repetidos.');
  if (new Set(edges.map(e => e.id)).size !== edges.length) throw new Error('Arestas com IDs repetidos.');
  const grupo: Record<string, string> = Object.create(null);
  for (const vertice of vertices) grupo[vertice] = vertice;
  for (const edge of edges) {
    if (!(edge.a in grupo) || !(edge.b in grupo) || !Number.isFinite(edge.cost)) throw new Error('Aresta inválida.');
  }

  const arvore: Edge[] = [];
  let custoTotal = 0;
  const steps: KruskalStep[] = [];
  const ordenadas = [...edges].sort(compareEdges);

  for (const aresta of ordenadas) {
    const before = { ...grupo };
    const grupoA = grupo[aresta.a];
    const grupoB = grupo[aresta.b];
    const accepted = grupoA !== grupoB;

    if (accepted) {
      // Todos os membros do segundo grupo passam a ter o rótulo do primeiro.
      for (const vertice of vertices) {
        if (grupo[vertice] === grupoB) grupo[vertice] = grupoA;
      }
      arvore.push(aresta);
      custoTotal += aresta.cost;
    }
    steps.push({ edge: aresta, accepted, before, after: { ...grupo }, selected: arvore.map(e => e.id), total: custoTotal });
    if (arvore.length === vertices.length - 1) break;
  }
  return { edges: arvore, total: custoTotal, steps, connected: vertices.length < 2 || arvore.length === vertices.length - 1 };
}

/** Estado da rede escolhida pelo jogador; inclui o custo dos ciclos também. */
export function inspectNetwork(vertices: readonly string[], selected: readonly Edge[]): { groups: Record<string, string>; count: number; total: number } {
  const groups: Record<string, string> = Object.create(null);
  for (const v of vertices) groups[v] = v;
  let total = 0;
  for (const e of selected) {
    total += e.cost;
    const from = groups[e.b], to = groups[e.a];
    if (from !== to) for (const v of vertices) if (groups[v] === from) groups[v] = to;
  }
  return { groups, count: new Set(Object.values(groups)).size, total };
}
