import type { GameMap } from './maps';
export function geometry(map: GameMap, a: string, b: string): { path: string; x: number; y: number } {
  const p = map.islands.find(i => i.id === a)!, q = map.islands.find(i => i.id === b)!;
  if (map.id === 'village' && (a + b === 'AC' || a + b === 'DF')) {
    const cy = a + b === 'AC' ? -80 : 610;
    return { path: `M${p.x},${p.y} Q400,${cy} ${q.x},${q.y}`, x: 400, y: (p.y + q.y) / 4 + cy / 2 };
  }
  const t = a + b === 'AC' ? .37 : a + b === 'BD' ? .67 : a + b === 'CE' ? .68 : a + b === 'BF' ? .32 : .5;
  return { path: `M${p.x},${p.y} L${q.x},${q.y}`, x: p.x + (q.x-p.x)*t, y: p.y + (q.y-p.y)*t };
}
