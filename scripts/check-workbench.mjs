import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
function url(source){return'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText).toString('base64');}
const mathUrl=url(fs.readFileSync('src/electricity/math.ts','utf8'));const math=await import(mathUrl);
const p=await import(url(fs.readFileSync('src/electricity/physics.ts','utf8').replace("'./math'",JSON.stringify(mathUrl))));
const {c,abs}=math,near=(a,b,e=1e-8)=>assert(Math.abs(a-b)<e,`${a} != ${b}`);
const rlc=p.rlc(6,.08,.002);near(rlc.z.re,6);near(rlc.z.im,3);near(abs(rlc.i),100/Math.sqrt(45));
const node=p.nodal(c(80/13,-120/13));near(abs(node.error),0);assert(abs(p.nodal(c(0)).error)>1);
const dep=p.dependent(2,'C');near(dep.v1.re,18);near(dep.v1.im,6);near(dep.ix.re,-2.4);near(dep.ix.im,7.2);for(const sensor of ['C','R','L'])for(const k of [0,.5,1,2,3])assert(Number.isFinite(abs(p.dependent(k,sensor).ix)));
near(p.loadPower(c(4,-3)).power,25);for(let R=0;R<=12;R+=.5)for(let X=-10;X<=10;X+=.5)assert(p.loadPower(c(R,X)).power<=25+1e-9);
near(p.compensation(600).current,8);assert(p.compensation(800).current>8);near(p.compensation(800).Q,-200);
for(const n of [1,2,5,10])for(const m of [1,2,5,10]){const d=p.transmission(n,m);near(d.inputPower,d.loadPower+d.loss);}
const tx=p.transmission(10,10);near(tx.loadVoltage,10000/101);assert(tx.loss<1);assert(p.transmission(1,1).loadPower<tx.loadPower);
for(const a of [null,0,1,2,3])for(const b of [null,0,1,2,3])for(const d of [null,0,1,2,3]){
 const w=p.wiring([a,b,d]);near(w.lineCurrents.reduce((sum,i)=>sum+i.re,0),0);near(w.lineCurrents.reduce((sum,i)=>sum+i.im,0),0);
 const power=w.lineCurrents.reduce((sum,i,j)=>sum+p.phaseVoltages[j].re*i.re+p.phaseVoltages[j].im*i.im,0);near(power,w.power);
}
const star=p.wiring([3,3,3]),delta=p.wiring([1,2,0]);near(abs(star.lineCurrents[3]),0);near(delta.power/star.power,3);near(abs(delta.lineCurrents[0])/abs(delta.branchCurrents[0]),Math.sqrt(3));assert(p.isDelta([1,2,0])&&p.isDelta([2,0,1]));assert(!p.isDelta([0,1,2]));
near(p.meterReading(0,[0,1],true,true).value,12);near(p.meterReading(0,[1,0],true,true).value,-12);near(p.meterReading(0,[3,2],true,false).value,12);
assert(p.meterReading(1,[0,1],true,true).fault);assert(!p.meterReading(1,[0,1],true,false).fault);near(p.meterReading(1,[3,2],true,false).value,2);near(p.meterReading(1,[2,3],true,false).value,-2);
assert(p.meterReading(2,[0,1],true,false).message==='DESLIGUE');near(p.meterReading(2,[0,1],false,false).value,6);near(p.meterReading(2,[1,3],false,false).value,0);assert.equal(p.meterReading(2,[2,3],false,false).message,'OL');
console.log('Workbench: complex nodal/source solves, real RLC response, maximum-power optimum, capacitor overcompensation, transformer energy conservation, all 125 three-phase wirings and meter polarity/short/open behavior passed.');
