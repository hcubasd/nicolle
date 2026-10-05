export type EventKind = 'aula' | 'prova' | 'trabalho' | 'devolutiva' | 'recuperacao';
export interface CourseEvent {
  id: string;
  title: string;
  date: string | null;
  kind: EventKind;
  time: string | null;
  topics: string[];
  notes: string[];
  materials: string[];
  source: string;
}

export const graphCourse = {
  title: 'Grafos e Redes',
  code: 'EMB5938',
  teacher: 'Luiz Gustavo Cordeiro',
  schedule: 'Terças · 13h30–16h',
  grading: 'P1 35% · P2 45% · Práticas 20%',
};

export const graphEvents: CourseEvent[] = [
  {
    "id": "grafos-0",
    "title": "Fundamentos de grafos",
    "date": "2026-08-11",
    "kind": "aula",
    "time": "13:30–16:00",
    "topics": [
      "Grafos, digrafos e redes: conceitos fundamentais.",
      "Tipos abstratos de dados e início da implementação da interface de grafos."
    ],
    "notes": [],
    "materials": [],
    "source": "Plano de ensino · cronograma, seção 7, p. 5."
  },
  {
    "id": "grafos-1",
    "title": "Representações computacionais",
    "date": "2026-08-18",
    "kind": "aula",
    "time": "13:30–16:00",
    "topics": [
      "Matrizes e listas de adjacência.",
      "Grafos ponderados, digrafos e geradores de grafos.",
      "Comparação entre representações; introdução aos problemas eulerianos e hamiltonianos."
    ],
    "notes": [],
    "materials": [],
    "source": "Plano de ensino · cronograma, seção 7, p. 5."
  },
  {
    "id": "grafos-2",
    "title": "Busca em profundidade",
    "date": "2026-08-25",
    "kind": "aula",
    "time": "13:30–16:00",
    "topics": [
      "Busca em profundidade (DFS) e florestas de busca.",
      "Componentes conexas e aplicações.",
      "Implementação da busca utilizando a interface de grafos."
    ],
    "notes": [],
    "materials": [],
    "source": "Plano de ensino · cronograma, seção 7, p. 5."
  },
  {
    "id": "grafos-3",
    "title": "Busca em largura",
    "date": "2026-09-01",
    "kind": "aula",
    "time": "13:30–16:00",
    "topics": [
      "Busca em largura (BFS), distâncias em grafos não ponderados e árvores de caminhos mínimos.",
      "Pontes, vértices de articulação e noções de biconectividade.",
      "Implementação e resolução de problemas."
    ],
    "notes": [],
    "materials": [],
    "source": "Plano de ensino · cronograma, seção 7, p. 5."
  },
  {
    "id": "grafos-4",
    "title": "Digrafos e ordenação topológica",
    "date": "2026-09-08",
    "kind": "aula",
    "time": "13:30–16:00",
    "topics": [
      "Busca em digrafos, acessibilidade e fecho transitivo.",
      "Grafos acíclicos dirigidos (DAGs) e ordenação topológica.",
      "Componentes fortemente conexas e aplicações em redes de precedência."
    ],
    "notes": [],
    "materials": [],
    "source": "Plano de ensino · cronograma, seção 7, p. 5."
  },
  {
    "id": "grafos-5",
    "title": "Revisão para a P1",
    "date": "2026-09-15",
    "kind": "aula",
    "time": "13:30–16:00",
    "topics": [
      "Representações computacionais, buscas e conectividade.",
      "Digrafos e ordenação topológica.",
      "Resolução integrada de problemas da primeira parte da disciplina."
    ],
    "notes": [],
    "materials": [],
    "source": "Plano de ensino · cronograma, seção 7, p. 5."
  },
  {
    "id": "grafos-6",
    "title": "P1 · Primeira avaliação",
    "date": "2026-09-22",
    "kind": "prova",
    "time": "13:30–16:00",
    "topics": [
      "Representações computacionais de grafos.",
      "Buscas em profundidade e largura; conectividade.",
      "Digrafos e ordenação topológica.",
      "Modelagem, análise e implementação de algoritmos em laboratório."
    ],
    "notes": [
      "P1 corresponde a 35% da nota final.",
      "Cada avaliação abrange todo o conteúdo ministrado até a aula imediatamente anterior, conforme a seção 6 do plano."
    ],
    "materials": [],
    "source": "Plano de ensino · cronograma, seção 7, p. 5."
  },
  {
    "id": "grafos-7",
    "title": "Árvores geradoras mínimas · Prim",
    "date": "2026-09-29",
    "kind": "aula",
    "time": "13:30–16:00",
    "topics": [
      "Árvores e árvores geradoras mínimas.",
      "Princípios de corte e ciclo.",
      "Prim como busca orientada por prioridade; implementação em grafos ponderados."
    ],
    "notes": [],
    "materials": [
      "agm"
    ],
    "source": "Plano de ensino · cronograma, seção 7, p. 5."
  },
  {
    "id": "grafos-8",
    "title": "Kruskal e conjuntos disjuntos",
    "date": "2026-10-06",
    "kind": "aula",
    "time": "13:30–16:00",
    "topics": [
      "Algoritmo de Kruskal.",
      "Estruturas de conjuntos disjuntos.",
      "Comparação entre algoritmos de árvores geradoras mínimas.",
      "Aplicações ao projeto de redes."
    ],
    "notes": [],
    "materials": [
      "agm"
    ],
    "source": "Plano de ensino · cronograma, seção 7, p. 5."
  },
  {
    "id": "grafos-9",
    "title": "Caminhos mínimos · Dijkstra",
    "date": "2026-10-13",
    "kind": "aula",
    "time": "13:30–16:00",
    "topics": [
      "Problema de caminhos mínimos e condições de otimalidade.",
      "Algoritmo de Dijkstra.",
      "Implementação e aplicações em redes ponderadas."
    ],
    "notes": [],
    "materials": [],
    "source": "Plano de ensino · cronograma, seção 7, p. 5."
  },
  {
    "id": "grafos-10",
    "title": "Caminhos mínimos · Outros casos",
    "date": "2026-10-20",
    "kind": "aula",
    "time": "13:30–16:00",
    "topics": [
      "Caminhos mínimos em grafos acíclicos dirigidos.",
      "Caminhos com pesos negativos.",
      "Caminhos mínimos entre todos os pares.",
      "Comparação entre algoritmos e aplicações em redes de transporte."
    ],
    "notes": [],
    "materials": [],
    "source": "Plano de ensino · cronograma, seção 7, p. 5."
  },
  {
    "id": "grafos-11",
    "title": "Fluxo máximo em redes",
    "date": "2026-10-27",
    "kind": "aula",
    "time": "13:30–16:00",
    "topics": [
      "Redes capacitadas, fluxos viáveis e redes residuais.",
      "Caminhos aumentantes e problema de fluxo máximo.",
      "Ford–Fulkerson e Edmonds–Karp; implementação computacional."
    ],
    "notes": [],
    "materials": [],
    "source": "Plano de ensino · cronograma, seção 7, p. 5."
  },
  {
    "id": "grafos-12",
    "title": "Cortes e matching bipartido",
    "date": "2026-11-03",
    "kind": "aula",
    "time": "13:30–16:00",
    "topics": [
      "Cortes em redes e teorema do fluxo máximo e corte mínimo.",
      "Reduções a problemas de fluxo.",
      "Matching bipartido como aplicação de fluxo máximo.",
      "Introdução a fluxos de custo mínimo."
    ],
    "notes": [],
    "materials": [],
    "source": "Plano de ensino · cronograma, seção 7, p. 5."
  },
  {
    "id": "grafos-13",
    "title": "Tópicos complementares",
    "date": "2026-11-10",
    "kind": "aula",
    "time": "13:30–16:00",
    "topics": [
      "Problemas eulerianos e hamiltonianos.",
      "Coloração de grafos e planaridade.",
      "Formulações algorítmicas, complexidade e aplicações.",
      "Introdução a matchings gerais e ao problema de atribuição."
    ],
    "notes": [],
    "materials": [],
    "source": "Plano de ensino · cronograma, seção 7, p. 5."
  },
  {
    "id": "grafos-14",
    "title": "Localização e revisão",
    "date": "2026-11-17",
    "kind": "aula",
    "time": "13:30–16:00",
    "topics": [
      "Cobertura e partição de conjuntos.",
      "Problemas de p-medianas e p-centros.",
      "Formulação por programação inteira e complexidade.",
      "Aplicações à localização de instalações e ao planejamento de transportes.",
      "Revisão integrada da segunda parte da disciplina."
    ],
    "notes": [],
    "materials": [],
    "source": "Plano de ensino · cronograma, seção 7, p. 5."
  },
  {
    "id": "grafos-15",
    "title": "P2 · Segunda avaliação",
    "date": "2026-11-24",
    "kind": "prova",
    "time": "13:30–16:00",
    "topics": [
      "Árvores geradoras mínimas: Prim, Kruskal e conjuntos disjuntos.",
      "Caminhos mínimos.",
      "Fluxos em redes.",
      "Tópicos complementares, cobertura, partição e localização, apresentados até a aula anterior.",
      "Modelagem, análise e implementação de algoritmos em laboratório."
    ],
    "notes": [
      "P2 corresponde a 45% da nota final.",
      "O cronograma destaca a segunda parte do curso; a seção 6 informa que cada avaliação abrange todo o conteúdo ministrado até a aula anterior."
    ],
    "materials": [],
    "source": "Plano de ensino · cronograma, seção 7, p. 5."
  },
  {
    "id": "grafos-16",
    "title": "Devolutiva e novas avaliações",
    "date": "2026-12-01",
    "kind": "devolutiva",
    "time": "13:30–16:00",
    "topics": [
      "Devolutiva da P2.",
      "Período destinado a novas avaliações, quando aplicável.",
      "Para os demais estudantes: resolução integrada e comparação de algoritmos para grafos e redes."
    ],
    "notes": [
      "Novas avaliações dependem da necessidade e de acordo com o docente; não são obrigatórias para todos."
    ],
    "materials": [],
    "source": "Plano de ensino · cronograma, seção 7, p. 5."
  },
  {
    "id": "grafos-17",
    "title": "Recuperação",
    "date": "2026-12-08",
    "kind": "recuperacao",
    "time": "13:30–16:00",
    "topics": [
      "Avaliação de recuperação conforme a regulamentação vigente.",
      "O plano não especifica um roteiro de conteúdos próprio para essa avaliação."
    ],
    "notes": [
      "Recuperação é uma avaliação condicional, conforme a regulamentação referenciada no plano."
    ],
    "materials": [],
    "source": "Plano de ensino · cronograma, seção 7, p. 5."
  },
  {
    "id": "jogo-kruskal",
    "title": "Jogo com Kruskal",
    "date": "2026-10-13",
    "kind": "trabalho",
    "time": null,
    "topics": [
      "Criar um jogo ou puzzle cujo resultado ótimo possa ser encontrado por Kruskal.",
      "Proposta: Vila dos Bichinhos. Conectar as casas dos moradores por caminhos, minimizando o custo total.",
      "Nicolle deve compreender e explicar a implementação do algoritmo. O uso de IA na interface foi permitido, conforme o relato da atividade."
    ],
    "notes": [
      "Peso específico, entregáveis, horário de entrega e enunciado oficial ainda precisam ser confirmados."
    ],
    "materials": [
      "agm"
    ],
    "source": "Relato da atividade e prazo de 13/10/2026 informados pela família de Nicolle; proposta em planejamento."
  }
];

graphEvents.sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'));
