import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const { outputText } = ts.transpileModule(readFileSync(new URL('../src/liquid.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const { ScrollLiquid, liquidShape } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
for (const width of [28,58,200,358,1000]) for (const height of [28,58,116,400,900]) {
  const rect = { top:0, bottom:height, left:0, right:width, width, height };
  const radius = Math.min(28,width/2,height/2);
  for (const motion of [-10,-.25,0,.3,1.1,10]) {
    const shape = liquidShape(rect,radius,motion);
    assert(shape.halfWidth > 0 && shape.halfWidth <= width/2);
    assert(shape.halfHeight > 0 && shape.halfHeight <= height/2);
    assert(shape.radius >= 0 && shape.radius <= Math.min(shape.halfWidth,shape.halfHeight));
  }
  assert.deepEqual(liquidShape(rect,radius,0),{halfWidth:width/2,halfHeight:height/2,radius});
}
const card={top:0,bottom:116,left:0,right:358,width:358,height:116};
const peak=liquidShape(card,26,1);
assert(peak.halfWidth < card.width/2-15);
assert(peak.halfHeight < card.height/2-12);
assert(peak.radius > 26);
assert.equal(liquidShape(card,0,1).radius,0);
for (const dt of [8,16,33,50,100]) {
  const spring=new ScrollLiquid(0,0); let y=0,peak=0;
  for(let t=dt;t<=300;t+=dt){y+=dt*2;peak=Math.max(peak,spring.update(y,t,false));}
  assert(peak>0);
  assert.equal(spring.update(y,800,false),0);
  assert.equal(spring.update(y+100,816,true),0);
  spring.reset(y,900);assert.equal(spring.update(y+1000,916,false),0);
}
console.log('Liquid glass: inward containment at every response, exact settling, frame intervals and reduced motion passed.');
