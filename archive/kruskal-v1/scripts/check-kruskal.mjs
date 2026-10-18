import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';
async function loadTypescript(path) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
}
const { kruskal, inspectNetwork } = await loadTypescript('../src/kruskal/core.ts');
const { maps } = await loadTypescript('../src/kruskal/maps.ts');
function brute(vertices, edges) {
  let best = Infinity;
  for (let mask = 0; mask < 2 ** edges.length; mask++) {
    const selected = edges.filter((_, i) => mask & (1 << i));
    if (selected.length !== vertices.length - 1) continue;
    if (inspectNetwork(vertices, selected).count === 1) best = Math.min(best, selected.reduce((n, e) => n + e.cost, 0));
  }
  return best;
}
const cases = maps.map(map => ({ vertices: map.islands.map(i => i.id), edges: map.edges }));
for (let seed = 1; seed <= 30; seed++) {
  const edges = [];
  for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) edges.push({ id: `${a}${b}`, a: String(a), b: String(b), cost: (a * 13 + b * 7 + seed * 11) % 9 - 2 });
  cases.push({ vertices: ['0', '1', '2', '3', '4'], edges });
}
for (const { vertices, edges } of cases) {
  const original = JSON.stringify(edges), result = kruskal(vertices, edges);
  assert.equal(result.connected, true);
  assert.equal(result.total, brute(vertices, edges));
  assert.equal(result.edges.length, vertices.length - 1);
  assert.equal(JSON.stringify(edges), original);
}
assert.equal(kruskal(['A', 'B'], []).connected, false);
assert.equal(kruskal([], []).total, 0);
assert.equal(kruskal(['A'], []).connected, true);
assert.throws(() => kruskal(['A', 'A'], []));
assert.throws(() => kruskal(['A'], [{id:'AB',a:'A',b:'B',cost:1}]));
assert.deepEqual(kruskal(cases[0].vertices,cases[0].edges).steps.map(s=>[s.edge.id,s.accepted]), [['AB',true],['BC',true],['AC',false],['CD',true]]);
const python = spawnSync('python3', ['-c', `import json,sys,contextlib,io
scope={}
with contextlib.redirect_stdout(io.StringIO()): exec(json.loads(sys.stdin.readline()),scope)
for case in json.load(sys.stdin):
 tree,total=scope['kruskal'](case['vertices'],[(e['cost'],e['a'],e['b']) for e in case['edges']])
 assert total==case['expected']
 assert len(tree)==len(case['vertices'])-1
print('Python agrees on all 32 graphs')`], { input: JSON.stringify(readFileSync(new URL('../src/lessons/kruskal.py', import.meta.url), 'utf8'))+'\n'+JSON.stringify(cases.map(c=>({...c,expected:kruskal(c.vertices,c.edges).total}))), encoding:'utf8' });
assert.equal(python.status,0,python.stderr);
console.log(python.stdout.trim());
console.log('Kruskal: exhaustive optimality, trace, input validation and disconnected graphs passed.');
