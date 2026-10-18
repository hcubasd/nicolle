import type { Edge } from './core';
export interface Island { id: string; name: string; animal: string; x: number; y: number; }
export interface GameMap { id: string; title: string; islands: Island[]; edges: Edge[]; }
const edge = (a: string, b: string, cost: number): Edge => ({ id: `${a}${b}`, a, b, cost });
export const maps: GameMap[] = [
  {
    id: 'tutorial', title: '4 ilhas · exemplo da aula',
    islands: [
      { id: 'A', name: 'Amora', animal: 'coelho', x: 140, y: 120 },
      { id: 'B', name: 'Bento', animal: 'gato', x: 660, y: 120 },
      { id: 'C', name: 'Cacau', animal: 'cachorro', x: 660, y: 400 },
      { id: 'D', name: 'Dori', animal: 'sapo', x: 140, y: 400 },
    ],
    // (custo, a, b) em Python. Aqui a ordem inicial também está misturada.
    edges: [edge('A', 'D', 8), edge('B', 'C', 2), edge('B', 'D', 9), edge('A', 'B', 1), edge('C', 'D', 4), edge('A', 'C', 3)],
  },
  {
    id: 'village', title: '6 ilhas · uma vila maior',
    islands: [
      { id: 'A', name: 'Amora', animal: 'coelho', x: 110, y: 120 },
      { id: 'B', name: 'Bento', animal: 'gato', x: 400, y: 90 },
      { id: 'C', name: 'Cacau', animal: 'cachorro', x: 690, y: 120 },
      { id: 'D', name: 'Dori', animal: 'sapo', x: 110, y: 400 },
      { id: 'E', name: 'Estela', animal: 'ovelha', x: 400, y: 430 },
      { id: 'F', name: 'Flora', animal: 'galinha', x: 690, y: 400 },
    ],
    edges: [edge('A', 'B', 2), edge('B', 'C', 3), edge('A', 'C', 4), edge('A', 'D', 4), edge('B', 'E', 5), edge('C', 'F', 4), edge('D', 'E', 3), edge('E', 'F', 2), edge('D', 'F', 7), edge('A', 'E', 6), edge('B', 'F', 8), edge('C', 'E', 7)],
  },
];
