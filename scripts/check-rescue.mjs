import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import ts from 'typescript';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const module=async(source)=>{const {outputText}=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});return import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));};
const {maps}=await module(read('../src/kruskal/maps.ts'));
const {newRescue,startRescue,travel,exampleWalk}=await module(read('../src/kruskal/rescue.ts'));
const {kruskal}=await module(read('../src/kruskal/core.ts'));
for(const map of maps) {
  const oracle=kruskal(map.islands.map(i=>i.id),map.edges);
  for(const first of map.islands) {
    let state=startRescue(map,first.id);
    const route=exampleWalk(first.id,oracle.edges,map.islands.length);
    assert.equal(route[0],first.id);
    for(const next of route.slice(1))state=travel(map,state,next);
    assert.equal(state.rescued.length,map.islands.length);
    assert.equal(state.total,oracle.total);
    assert.equal(state.purchased.length,map.islands.length-1);
  }
}
const map=maps[0];let state=startRescue(map,'B');
for(const destination of ['A','B','C','D'])state=travel(map,state,destination);
assert.equal(state.total,7);assert.equal(new Set(state.rescued).size,4);assert.equal(state.purchased.length,3);
assert.throws(()=>travel(map,newRescue(),'A'));
assert.throws(()=>travel(map,startRescue(map,'A'),'A'));
assert.throws(()=>startRescue(map,'X'));
assert.throws(()=>travel(maps[1],startRescue(maps[1],'A'),'F'));
assert.equal(travel(map,travel(map,startRescue(map,'A'),'B'),'A').total,1);
let tutorial=read('../src/lessons/tutorial.ts').replace(/^import .*;\n/gm,'');
const {steps}=await module(`const fullCode=${JSON.stringify(read('../src/lessons/kruskal.py'))};const rescueCode=${JSON.stringify(read('../src/lessons/resgate.py'))};\n`+tutorial);
const python=spawnSync('python3',['-c',`import contextlib,io,json,sys
steps,game,vertices,edges=json.load(sys.stdin)
scope={}
for number,step in enumerate(steps,1):
    answers=iter(step.get('inputs',[]))
    def answer(prompt=''):
        value=next(answers)
        print(prompt+value)
        return value
    scope['input']=answer
    output=io.StringIO()
    with contextlib.redirect_stdout(output): exec(compile(step['code'],f'etapa_{number}','exec'),scope)
    if 'output' in step:
        assert output.getvalue().rstrip()==step['output'],(number,step['title'],output.getvalue(),step['output'])
    if step.get('network'):
        labels=step['network']['labels']
        # Every accepted illustrated edge joins equal labels.
        for edge in step['network']['paths']:
            assert labels[edge[0]]==labels[edge[1]],(number,edge,labels)
assert scope['gasto_total']==7
assert len(scope['resgatados'])==4
for responses,cost,count in [(['B','DICA','X','A','B','C','D'],7,4),(['D','C','B','A'],7,4),(['A','C','B','A','D'],14,4),(['Z','B','SAIR'],0,1)]:
    namespace={}
    answers=iter(responses)
    namespace['input']=lambda prompt='':next(answers)
    with contextlib.redirect_stdout(io.StringIO()):exec(game,namespace)
    assert namespace['gasto_total']==cost
    assert len(namespace['resgatados'])==count
    assert len(set(namespace['resgatados']))==count
    assert namespace['vertices']==vertices
    assert sorted(namespace['arestas'])==sorted(tuple(edge) for edge in edges)
print(f'{len(steps)} lesson cells execute in order, expected outputs match, rescue/oracle examples and invalid input pass.')
`],{input:JSON.stringify([steps,read('../src/lessons/resgate.py'),map.islands.map(i=>i.id),map.edges.map(e=>[e.cost,e.a,e.b])]),encoding:'utf8'});
assert.equal(python.status,0,python.stderr);
assert.equal(read('../src/lessons/resgate.py'),read('../public/grafos/resgate.py'));
console.log('Rescue rules: all starting islands, both maps, optimal walks, free returns and invalid moves passed.');
console.log(python.stdout.trim());
