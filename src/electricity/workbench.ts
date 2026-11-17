import {scrollPageTo,pageScrollTop} from '../scene';
import type {Mission} from './content';
import {c,abs,angle,fmt,type Complex} from './math';
import {polar,rlc,nodal,dependent,loadPower,compensation,transmission,wiring,isStar,isDelta,meterReading} from './physics';
import {circuitDiagram} from './labs';
export const workbenchMarkup=()=>'<section class="hands-on" aria-label="Missão interativa"></section>';
const point=(x:number,y:number)=>`${x},${y}`;
const vectorText=(z:Complex)=>`${fmt(z.re)} ${z.im<0?'−':'+'} j${fmt(Math.abs(z.im))}`;
const phasorText=(z:Complex)=>`${fmt(abs(z))} ∠ ${fmt(angle(z))}°`;
const line=(a:{x:number;y:number},b:{x:number;y:number},cls='')=>`<path class="${cls}" d="M${point(a.x,a.y)}L${point(b.x,b.y)}"/>`;
const svg=(body:string,label:string)=>`<svg data-board viewBox="0 0 640 420" role="group" aria-label="${label}">${body}</svg>`;
const text=(x:number,y:number,label:string,cls='')=>`<text x="${x}" y="${y}" class="${cls}">${label}</text>`;
const button=(action:string,label:string,extra='')=>`<button type="button" data-action="${action}" ${extra}>${label}</button>`;
interface Model {v:Complex;stage:number;slot:'R'|'L'|'C';R:number;L:number;C:number;path:number[];gain:number;sensor:'C'|'R'|'L';caps:boolean[];up:number;down:number;coil:number;ends:(number|null)[];mode:number;leads:(number|null)[];lead:number;closed:boolean;power:boolean;}
const initial=():Model=>({v:c(0,0),stage:0,slot:'R',R:3,L:.04,C:.001,path:[0],gain:1,sensor:'R',caps:[false,false,false,false],up:1,down:1,coil:0,ends:[null,null,null],mode:0,leads:[null,null],lead:0,closed:true,power:true});
interface Frame {goal:string;board:string;readout:string;explain:string;met:boolean;controls?:string;side?:string;steps?:number;}
export function mountWorkbench(host:HTMLElement,m:Mission,onComplete:()=>void):()=>void {
 let vectorLimit=12;
 let s=initial(),hint=false,checked=false,finished=false,notice='',disposed=false;
 let plane={xmin:-12,xmax:12,ymin:-12,ymax:12};
 let drag:{kind:string;part?:'R'|'L'|'C';value?:number;lead?:number;startX:number;startY:number;moved:boolean}|undefined,suppress=false;
 const P=(z:Complex)=>({x:72+(z.re-plane.xmin)/(plane.xmax-plane.xmin)*500,y:350-(z.im-plane.ymin)/(plane.ymax-plane.ymin)*300});
 function plot(extra:string,label:string,xLabel='Real',yLabel='Imaginário'):string {
  const zero=P(c(0)),v=P(s.v);let grid='';
  const sx=(plane.xmax-plane.xmin)>30?Math.ceil((plane.xmax-plane.xmin)/20):(plane.xmax-plane.xmin)>12?1:.5,sy=(plane.ymax-plane.ymin)>30?Math.ceil((plane.ymax-plane.ymin)/20):(plane.ymax-plane.ymin)>12?1:.5;
  for(let n=Math.ceil(plane.xmin/sx)*sx;n<=plane.xmax;n+=sx){const x=P(c(n,0)).x;grid+=`<path d="M${x} 50V350" class="wb-grid"/>`;if(Math.round(n/sx)%2===0)grid+=text(x-9,370,fmt(n),'wb-tick');}
  for(let n=Math.ceil(plane.ymin/sy)*sy;n<=plane.ymax;n+=sy){const y=P(c(0,n)).y;grid+=`<path d="M72 ${y}H572" class="wb-grid"/>`;if(Math.round(n/sy)%2===0)grid+=text(25,y+6,fmt(n),'wb-tick');}

  return svg(`<defs><clipPath id="wb-clip-${m.id}"><rect x="72" y="50" width="500" height="300"/></clipPath></defs>${grid}<g class="wb-wire">${line({x:72,y:zero.y},{x:572,y:zero.y})}${line({x:zero.x,y:50},{x:zero.x,y:350})}</g>${text(470,395,xLabel)}${text(80,30,yLabel)}${extra}<g class="wb-vector">${line(zero,v)}<circle data-drag="vector" data-real="${s.v.re}" data-imag="${s.v.im}" cx="${v.x}" cy="${v.y}" r="12" tabindex="0" role="button" aria-label="Ponto ajustável. Use as setas do teclado."/></g>${text(80,410,`${fmt(s.v.re)}; ${fmt(s.v.im)}`)}`,label);
 }
 function ghost(z:Complex):string {const p=P(z);return hint?`<circle cx="${p.x}" cy="${p.y}" r="16" class="wb-ghost"/>`:'';}
 function metric(label:string,value:string,good=false):string {return `<span class="wb-metric ${good?'good':''}"><small>${label}</small><strong>${value}</strong></span>`;}
 function frame():Frame {
  if(m.id==='sinais'){
   plane={xmin:-vectorLimit,xmax:vectorLimit,ymin:-vectorLimit,ymax:vectorLimit};
   const target=s.stage===0?c(3,4):s.stage===1?c(-4,3):polar(5,30),met=abs(c(s.v.re-target.re,s.v.im-target.im))<.25;
   const zero=P(c(0)),p=P(s.v);
   return{steps:3,goal:s.stage===0?'Construa 3 + j4: leve a ponta azul 3 unidades à direita e 4 para cima.':s.stage===1?'Agora multiplique 3 + j4 por j. Faça a seta girar um quarto de volta sem mudar o tamanho.':'Divida 10 ∠ 40° por 2 ∠ 10°. Ajuste a seta do resultado: o módulo divide e os ângulos subtraem.',
    board:plot(`<g class="wb-components">${line(zero,{x:p.x,y:zero.y})}${line({x:p.x,y:zero.y},p)}</g>${ghost(target)}${text(410,35,`|z| = ${fmt(abs(s.v))}`)}`,'Plano complexo manipulável. Arraste a ponta da seta.'),
    controls:button('j','× j')+button('minus-j','÷ j')+button('double','× 2')+button('half','÷ 2'),
    readout:metric('Retangular',vectorText(s.v))+metric('Polar',phasorText(s.v),met),met,
    explain:s.stage===0?'O segmento horizontal é a parte real; o vertical é a imaginária. A seta é a soma dos dois. Seu comprimento vem de Pitágoras, não de somar 3 e 4.':s.stage===1?'Multiplicar por j transforma (a, b) em (−b, a): o comprimento fica igual e o ângulo aumenta 90°. Duas multiplicações dão −z, pois j² = −1.':'Na divisão, 10/2 = 5 e 40° − 10° = 30°. Você deve obter uma seta de comprimento 5 apontando para 30°.'};
  }
  if(m.id==='impedancias'){
   const d=rlc(s.R,s.L,s.C),target=rlc(6,.08,.002),met=abs(c(d.i.re-target.i.re,d.i.im-target.i.im))<.08;
   const slots=[{id:'R',x:180,label:`${s.R} Ω`},{id:'L',x:330,label:`${fmt(s.L*1000,0)} mH`},{id:'C',x:480,label:`${fmt(s.C*1e6,0)} µF`}];
   const parts=s.slot==='R'?[3,6,12]:s.slot==='L'?[.04,.08,.12]:[.001,.002,.005];
   return{goal:'Monte a série RLC para fazer a corrente coincidir com a seta tracejada: 14,91 A RMS, atrasada de 26,57°. Fonte 100 V RMS, ω = 100 rad/s.',
    board:svg(`<g class="wb-wire"><path d="M60 145V80H140m80 0h70m80 0h70m80 0h60V200H60v-15"/><circle cx="60" cy="165" r="20"/>${slots.map(p=>`<rect data-slot="${p.id}" data-action="slot" data-value="${p.id}" x="${p.x-40}" y="50" width="80" height="60" rx="8" class="${s.slot===p.id?'wb-selected':''}"/>`).join('')}</g><g class="wb-wire"><path d="M140 80h10l6 -10 10 20 10 -20 10 20 10 -20 6 10H220M290 80h10c0 -18 18 -18 18 0c0 -18 18 -18 18 0c0 -18 18 -18 18 0H370M440 80h34m0 -16v32m12 -32v32m0 -16h34"/></g>${slots.map(p=>text(p.x-35,40,p.id)+text(p.x-40,145,p.label)).join('')}${text(45,172,'~')}${text(80,235,'Corrente: comprimento e fase, na mesma escala')}<g class="wb-grid">${line({x:200,y:300},{x:460,y:300})}${line({x:320,y:250},{x:320,y:390})}</g><path class="wb-ghost" d="M320 300L${320+target.i.re*5} ${300-target.i.im*5}"/><path class="wb-vector" d="M320 300L${320+d.i.re*5} ${300-d.i.im*5}"/>`,'Circuito série com três encaixes de componentes. Escolha um encaixe e instale uma peça.'),
    controls:`<span class="wb-inventory-label">Peças para ${s.slot}: arraste ou toque para instalar.</span>`+parts.map(value=>button('part',`${s.slot==='R'?value+' Ω':s.slot==='L'?fmt(value*1000,0)+' mH':fmt(value*1e6,0)+' µF'}`,`data-part="${s.slot}" data-value="${value}"`)).join(''),
    readout:metric('Impedância',vectorText(d.z)+' Ω')+metric('Corrente',phasorText(d.i)+' A',met),met,
    explain:`R define a parte horizontal de Z; o indutor soma +jωL e o capacitor soma −j/(ωC). Hoje XL = ${fmt(100*s.L)} Ω e |XC| = ${fmt(1/(100*s.C))} Ω. Trocar uma peça muda a soma e, por I = V/Z, muda a corrente inteira. A seta tracejada é a corrente que queremos, não a impedância.`};
  }
  if(m.id==='malhas'){
   const coords=[{x:90,y:330},{x:90,y:90},{x:320,y:90},{x:320,y:330},{x:550,y:90},{x:550,y:330}],edges=[[0,1],[1,2],[2,3],[3,0],[2,4],[4,5],[5,3]],goal=s.stage===0?[0,1,2,3,0]:[3,2,4,5,3];
   const at=s.path[s.path.length-1],next=goal[s.path.length],met=s.path.length===goal.length&&s.path.every((v,i)=>v===goal[i]);
   const terms=s.stage===0?['+10','−4I₁','−j2(I₁ − I₂)','+0']:['−j2(I₂ − I₁)','−6I₂','+0','+0'];
   return{steps:2,goal:s.stage===0?'Percorra a malha da esquerda no sentido horário. Comece na ponta azul e toque no próximo ponto do fio. Cada trecho acrescenta uma tensão à LKT.':'Percorra a malha da direita no sentido horário. Observe como muda o sinal da corrente no ramo comum.',
    board:svg(`<g class="wb-wire"><path d="M90 330V235M90 185V90H160m60 0H320V180m0 60v90H90M320 90H390m60 0H550V330H320M160 90l8 -12 10 24 10 -24 10 24 10 -24 12 12M390 90l8 -12 10 24 10 -24 10 24 10 -24 12 12M320 180c-20 0 -20 20 0 20c-20 0 -20 20 0 20c-20 0 -20 20 0 20"/><circle cx="90" cy="210" r="25"/></g>${text(165,60,'4 Ω')}${text(80,205,'+')}${text(82,227,'−')}${text(180,240,'I₁ ↻')}${text(420,240,'I₂ ↻')}${text(425,60,'6 Ω')}${text(335,210,'j2 Ω')}${text(30,210,'10 V')}${s.path.slice(1).map((id,i)=>line(coords[s.path[i]],coords[id],'wb-trace')).join('')}${coords.map((p,i)=>`<circle data-action="trace" data-value="${i}" cx="${p.x}" cy="${p.y}" r="18" class="wb-port ${i===at?'wb-port-active':''} ${i===next?'wb-next':''}" tabindex="0" role="button" aria-label="Ponto ${i+1} do circuito"/>`).join('')}`,'Duas malhas com pontos selecionáveis para percorrer os fios.'),
    controls:button('undo-trace','Desfazer trecho'),
    readout:`<span class="wb-equation">${terms.slice(0,Math.max(0,s.path.length-1)).join(' ')||'Toque no próximo ponto'}${met?' = 0':''}</span>`,met,
    explain:s.stage===0?'Subir pela fonte é uma elevação de +10 V. O resistor perde 4I₁. No ramo comum as correntes horárias se opõem: a queda é j2(I₁ − I₂). Fechar o laço dá 10 − 4I₁ − j2(I₁ − I₂) = 0.':'Agora você percorre o ramo comum de baixo para cima, na direção de I₂. A corrente de referência desse trecho é I₂ − I₁. Por isso a equação não pode repetir I₁ − I₂ sem trocar o sinal.'};
  }
  if(m.id==='supermalha'||m.id==='superno'){
   const mesh=m.id==='supermalha';plane=mesh?{xmin:-2,xmax:3,ymin:-1,ymax:4}:{xmin:0,xmax:20,ymin:0,ymax:20};
   const target=mesh?c(-.2,1.8):c(12.8,10.8),first=mesh?4*s.v.re+6*s.v.im:s.v.re/4+s.v.im/6,second=s.v.im-s.v.re;
   const e1=mesh?first-10:first-5,e2=mesh?second-2:s.v.re-s.v.im-2,met=Math.abs(e1)<(mesh?.15:.03)&&Math.abs(e2)<.06;
   const onLine=(x:number,which:number)=>mesh?(which===0?(10-4*x)/6:x+2):(which===0?(5-x/4)*6:x-2);
   return{goal:mesh?'Ajuste as duas correntes ao mesmo tempo. O contorno precisa somar 10 V; a fonte no meio exige I₂ − I₁ = 2 A. Arraste o ponto até as duas regras fecharem.':'Ajuste V₁ e V₂. A fonte entre os nós exige V₁ − V₂ = 2 V; os resistores precisam devolver os 5 A que entram no conjunto.',
    board:plot(`<g class="wb-rule-one" clip-path="url(#wb-clip-${m.id})">${line(P(c(plane.xmin,onLine(plane.xmin,0))),P(c(plane.xmax,onLine(plane.xmax,0))))}</g><g class="wb-rule-two" clip-path="url(#wb-clip-${m.id})">${line(P(c(plane.xmin,onLine(plane.xmin,1))),P(c(plane.xmax,onLine(plane.xmax,1))))}</g>${ghost(target)}`,mesh?'Plano de correntes I1 e I2; duas retas representam duas restrições.':'Plano de tensões V1 e V2; duas retas representam duas restrições.',mesh?'I₁ (A)':'V₁ (V)',mesh?'I₂ (A)':'V₂ (V)'),side:circuitDiagram(m.id),
    readout:metric(mesh?'4I₁ + 6I₂':'V₁/4 + V₂/6',`${fmt(first)} ${mesh?'V':'A'} / ${mesh?'10 V':'5 A'}`,Math.abs(e1)<.1)+metric(mesh?'I₂ − I₁':'V₁ − V₂',`${fmt(mesh?second:-second)} ${mesh?'A':'V'} / 2 ${mesh?'A':'V'}`,Math.abs(e2)<.06),met,
    explain:mesh?'Cada reta mostra os pares de correntes que satisfazem uma regra. Só a interseção satisfaz as duas. O ponto correto é (−0,2 A; 1,8 A): I₁ negativo significa corrente real contrária à seta escolhida. Aqui os fasores têm parte imaginária zero para enxergar primeiro a lógica da supermalha.':'Uma reta é a LKC externa; a outra é a diferença imposta pela fonte. O ponto (12,8 V; 10,8 V) satisfaz ambas. A fonte interna não aparece na soma de correntes que atravessam a fronteira do supernó.'};
  }
  if(m.id==='nos'){
   plane={xmin:-5,xmax:20,ymin:-20,ymax:5};const d=nodal(s.v),target=c(80/13,-120/13),met=abs(d.error)<.025;
   return{goal:'Encontre a tensão complexa do nó. Arraste V até a corrente que chega pelo resistor igualar a soma das correntes que saem pelo capacitor e pelo indutor.',board:plot(ghost(target),'Palpite da tensão de nó, parte real e imaginária em volts.','Re(V), em V','Im(V), em V'),side:circuitDiagram('nos'),
    readout:metric('V do nó (palpite)',vectorText(s.v)+' V')+metric('Chega: (20 − V)/10',vectorText(d.incoming)+' A')+metric('Sai: V/j4 + V/(−j2,5)',vectorText(c(d.inductor.re+d.capacitor.re,d.inductor.im+d.capacitor.im))+' A')+metric('Diferença',fmt(abs(d.error),3)+' A',met),met,
    explain:`Seu palpite é V = ${vectorText(s.v)} V. Cada ramo responde pela lei I = V/Z. Não basta acertar os módulos: partes reais E imaginárias precisam se equilibrar. Quando a diferença zera, não sobra corrente no nó. O circuito é resolvido por essa igualdade; não estamos armazenando corrente nele enquanto o palpite está errado.`};
  }
  if(m.id==='dependentes'){
   const d=dependent(s.gain,s.sensor),met=s.sensor==='C'&&Math.abs(s.gain-2)<.01;
   const circuit=circuitDiagram('dependentes').replace('class="review-diagram"','data-board class="review-diagram"').replace('>2Ix ↑<',`>${fmt(s.gain)}I${s.sensor==='C'?'x':s.sensor} ↑<`).replace('</svg>',`<path class="wb-control-link" d="M${s.sensor==='C'?'240 125':s.sensor==='R'?'178 50':'330 50'}Q380 185 450 130"/><g>${[{id:'R',x:178,y:50},{id:'C',x:240,y:125},{id:'L',x:330,y:50}].map(p=>`<circle data-action="sensor" data-value="${p.id}" cx="${p.x}" cy="${p.y}" r="24" class="wb-sensor ${s.sensor===p.id?'wb-sensor-active':''}" role="button" tabindex="0" aria-label="Instalar sensor no ${p.id==='C'?'capacitor':p.id==='R'?'resistor':'indutor'}"/>`).join('')}</g></svg>`);
   return{goal:'Instale o sensor de Ix no capacitor e ajuste o ganho para que a fonte controlada injete 2Ix. Observe como a rede toda responde ao controle.',board:circuit,
    controls:button('gain-down','Ganho −')+`<strong class="wb-knob-value">${fmt(s.gain)} × I${s.sensor==='C'?'x':s.sensor}</strong>`+button('gain-up','Ganho +'),
    readout:metric('Sensor conectado',s.sensor==='C'?'Capacitor':s.sensor==='R'?'Resistor':'Indutor',s.sensor==='C')+metric('V₁',phasorText(d.v1)+' V')+metric('Ix no capacitor',phasorText(d.ix)+' A',met),met,
    explain:`A fonte agora segue a corrente do ${s.sensor==='C'?'capacitor':s.sensor==='R'?'resistor':'indutor'}, com ganho ${fmt(s.gain)}. Mudar o sensor muda a equação, não só o desenho. Na montagem pedida, a solução é V₁ = 18 + j6 V e Ix = −2,4 + j7,2 A: a fonte controlada faz parte do sistema e não pode ser apagada.`};
  }
  if(m.id==='equivalentes'){
   plane={xmin:0,xmax:12,ymin:-10,ymax:10};const d=loadPower(s.v),met=d.power>24.9&&Math.abs(s.v.im+3)<.2;
   return{goal:'A fonte equivalente tem 20 V RMS e impedância interna 4 + j3 Ω. Escolha a impedância da carga arrastando o ponto e faça a carga receber quase 25 W.',
    board:plot(ghost(c(4,-3)),'Escolha da impedância da carga, resistência no eixo horizontal e reatância no vertical.','R da carga (Ω)','X da carga (Ω)'),
    readout:metric('Carga',vectorText(s.v)+' Ω')+metric('Z total',vectorText(d.zTotal)+' Ω')+metric('Potência útil',fmt(d.power)+' / 25 W',met),met,
    explain:`A corrente é 20/(Zinterno + Zcarga). A potência na carga é |I|²R. Sua carga recebe ${fmt(d.power)} W. Para o máximo, a resistência precisa ser 4 Ω e a reatância −3 Ω cancela o +j3 da fonte: esse é o casamento conjugado. Aumentar só a corrente não garante máxima potência na carga.`};
  }
  if(m.id==='potencia'){
   const values=[200,200,400,800],bank=values.reduce((sum,q,i)=>sum+(s.caps[i]?q:0),0),d=compensation(bank),met=Math.abs(d.Q)<1;
   return{goal:'A carga precisa continuar recebendo 800 W. Instale capacitores em paralelo até a fonte fornecer só 8 A RMS, sem potência reativa líquida. Toque nos capacitores para ligar ou retirar.',
    board:svg(`<g class="wb-wire"><path d="M70 170V70H570V320H70V210"/><circle cx="70" cy="190" r="20"/><rect x="510" y="130" width="60" height="100"/>${values.map((q,i)=>`<path d="M${160+i*95} 70V145m0 37v138"/><path d="${s.caps[i]?`M${160+i*95} 145V170`:`M${160+i*95} 145l15 15`}"/><path d="M${145+i*95} 170h30m-30 12h30"/>`).join('')}</g>${values.map((q,i)=>`<g data-action="cap" data-value="${i}" role="button" tabindex="0" aria-label="${s.caps[i]?'Retirar':'Ligar'} capacitor ${i+1} de ${q} var"><rect x="${125+i*95}" y="125" width="70" height="105" rx="12" class="wb-cap ${s.caps[i]?'on':''}"/>${text(135+i*95,255,q+' var')}${text(143+i*95,155,s.caps[i]?'●':'○')}</g>`).join('')}${text(35,370,'100 V RMS')}${text(515,115,'Carga')}${text(515,275,'800 W')}${text(515,305,'600 var')}${text(110,405,'Capacitores ligados: '+bank+' var')}`,'Banco de capacitores em paralelo com uma carga indutiva.'),
    side:svg(`<g class="wb-wire"><path d="M90 210H410V${210-d.Q*.16}Z"/></g>${text(125,245,'P = 800 W, constante')}${text(430,150,'Q = '+d.Q+' var')}${text(70,40,'Potência complexa vista pela fonte')}${text(75,380,'S = '+fmt(d.S)+' VA; I = '+fmt(d.current)+' A')}`,'Triângulo de potência que muda com os capacitores instalados.'),
    readout:metric('P da carga','800 W')+metric('Q visto pela fonte',fmt(d.Q)+' var',met)+metric('Corrente da fonte',fmt(d.current)+' A',met)+metric('Fator de potência',fmt(d.pf,3)),met,
    explain:`A carga não mudou. Os capacitores fornecem −${bank} var, então Qlíquido = 600 − ${bank} = ${d.Q} var. A fonte fornece √(800² + Q²)/100 amperes. ${d.Q<0?'Você passou do ponto: a corrente agora adianta a tensão, mas voltou a crescer.':d.Q>0?'Ainda há troca reativa indutiva, por isso a corrente está acima de 8 A.':'As parcelas reativas se cancelaram; a fonte entrega só a corrente necessária à potência ativa.'}`};
  }
  if(m.id==='rede'){
   const d=transmission(s.up,s.down),met=d.loadVoltage>=98&&d.loadVoltage<=102&&d.loss<2;
   return{goal:'Entregue entre 98 e 102 V à carga, perdendo menos de 2 W na linha. Encaixe um elevador e um redutor. A fonte é 100 V RMS, a linha tem 100 Ω e a carga 100 Ω.',
    board:svg(`<g class="wb-wire"><path d="M50 240V100H170m100 0h80m100 0h140V240H50"/><circle cx="50" cy="170" r="28"/><rect x="170" y="60" width="100" height="80" rx="8"/><path d="M285 100l8 -12 12 24 12 -24 12 24 12 -24 8 12"/><rect x="350" y="60" width="100" height="80" rx="8"/><rect x="530" y="140" width="60" height="70" style="fill:var(--review-color-1);fill-opacity:${Math.min(1,d.loadPower/100)}"/></g>${text(30,177,'~')}${text(177,108,'1 : '+s.up)}${text(357,108,s.down+' : 1')}${text(165,35,'Elevar')}${text(350,35,'Reduzir')}${text(270,180,'Linha 100 Ω')}${text(480,290,fmt(d.loadVoltage)+' V')}${text(75,350,'Entrada: '+fmt(d.inputPower)+' W')}${text(75,390,'Carga: '+fmt(d.loadPower)+' W; perdas: '+fmt(d.loss)+' W')}`,'Dois transformadores ideais separados por uma linha resistiva e conectados à carga.'),
    controls:`<div class="wb-part-group"><strong>Elevador</strong>${[1,2,5,10].map(n=>button('up',`1:${n}`,`data-value="${n}" aria-pressed="${s.up===n}"`)).join('')}</div><div class="wb-part-group"><strong>Redutor</strong>${[1,2,5,10].map(n=>button('down',`${n}:1`,`data-value="${n}" aria-pressed="${s.down===n}"`)).join('')}</div>`,
    readout:metric('Corrente na linha',fmt(d.lineCurrent,3)+' A')+metric('Tensão na carga',fmt(d.loadVoltage)+' V',d.loadVoltage>=98&&d.loadVoltage<=102)+metric('Perda Joule',fmt(d.loss)+' W',d.loss<2),met,
    explain:`Este modelo conserva energia: entrada = carga + perda. A resistência da carga vista na linha é 100 × (${s.down})² Ω; a corrente na linha é (100 × ${s.up})/(100 + 100 × ${s.down}²). Elevar a tensão e reduzir depois permite transportar a potência com menos corrente e menos perda I²R. Trocar só um dos transformadores altera a tensão entregue à carga.`};
  }
  if(m.id==='estrela'||m.id==='delta'){
   const star=m.id==='estrela',d=wiring(s.ends),met=star?isStar(s.ends):isDelta(s.ends),names=['A','B','C','N'];
   const angles=[0,-120,120],from=polar(220/Math.sqrt(3),angles[s.coil]),end=s.ends[s.coil],to=end===null||end===3?c(0):polar(220/Math.sqrt(3),angles[end]),origin={x:320,y:200},a={x:320+from.re,y:200-from.im},b={x:320+to.re,y:200-to.im};
   const ports=[{x:90,y:345},{x:245,y:345},{x:400,y:345},{x:555,y:345}],coils=[{x:140,y:235},{x:320,y:235},{x:500,y:235}];
   return{goal:star?'Monte uma carga equilibrada em estrela: cada ramo já começa em A, B ou C. Conecte as três pontas livres ao neutro N. Toque numa ponta e depois no terminal de destino.':'Monte uma carga equilibrada em triângulo. Cada ramo já começa em A, B ou C; conecte sua ponta livre a outra fase para fechar um ciclo, sem usar N.',
    board:svg(`<g class="wb-wire">${coils.map((p,i)=>`<path d="M${p.x} 65V115l-12 8 24 12 -24 12 24 12 -24 12 12 12v52"/>`).join('')}</g>${coils.map((p,i)=>text(p.x-8,40,names[i])+text(p.x-40,105,'10 Ω')+`<circle data-action="coil" data-value="${i}" cx="${p.x}" cy="${p.y}" r="18" class="wb-port ${s.coil===i?'wb-port-active':''}" role="button" tabindex="0" aria-label="Ponta livre do ramo ${names[i]}"/>`).join('')}${s.ends.map((to,i)=>to===null?'':`<path d="M${coils[i].x} 235C${coils[i].x} 290 ${ports[to].x} 290 ${ports[to].x} 345" class="wb-lead phase-${i}"/>`).join('')}${ports.map((p,i)=>`<circle data-action="terminal" data-value="${i}" cx="${p.x}" cy="${p.y}" r="19" class="wb-port" role="button" tabindex="0" aria-label="Terminal ${names[i]}"/>`+text(p.x-8,395,names[i])).join('')}`, 'Três ramos resistivos com pontas livres. Ligue cada ponta a um dos terminais A, B, C ou neutro N.'),
    side:svg(`<g class="wb-components">${line(origin,a)}${end===null?'':line(origin,b)}</g>${end===null?'':line(b,a,'wb-vector')}${text(a.x,a.y-15,names[s.coil])}${end===null?'':text(b.x,b.y+25,names[end])}${text(35,45,'Tensão no ramo: diferença de fasores')}${text(35,355,end===null?'Conecte a ponta para definir a diferença.':names[s.coil]+' − '+names[end]+' = '+phasorText(d.voltages[s.coil])+' V')}`,'O vetor que liga as pontas dos fasores é a tensão entre os terminais escolhidos.'),
    controls:button('disconnect','Soltar o fio do ramo '+names[s.coil]),
    readout:metric('Ramo selecionado',names[s.coil])+metric('Tensões nos ramos',d.voltages.map(v=>fmt(abs(v),1)).join(' / ')+' V')+metric('Correntes de linha',d.lineCurrents.slice(0,3).map(i=>fmt(abs(i),1)).join(' / ')+' A',met)+metric('Corrente no neutro',fmt(abs(d.lineCurrents[3]),2)+' A'),met,
    explain:`A alimentação tem 220 V entre linhas e 127,02 V entre cada linha e N. Cada ramo responde à diferença fasorial entre seus terminais. ${star?'Em Y, você deve obter 127,02 V e 12,70 A em cada ramo; a corrente do neutro zera quando os três ficam equilibrados.':'Em Δ, cada ramo deve receber 220 V e conduzir 22 A; a corrente de linha é a diferença fasorial de duas correntes de ramo e fica em 38,11 A.'} Um fio de A para A deixa zero volt nesse ramo; uma montagem mista pode ser desequilibrada. As leituras acima são calculadas para os fios que você realmente conectou.`};
  }
  // Three concrete meter tasks; all connections belong to a low-voltage model.
  const ports=[{x:200,y:90},{x:440,y:90},{x:235,y:300},{x:405,y:300}],names=['L','R','X','Y'],modes=['V','A','Ω'];
  const [red,black]=s.leads,across=red!==null&&black!==null&&((red===0&&black===1)||(red===1&&black===0)),seriesPair=red!==null&&black!==null&&((red===3&&black===2)||(red===2&&black===3));
  const met=s.stage===0?s.mode===0&&red===0&&black===1&&s.closed&&s.power:s.stage===1?s.mode===1&&red===3&&black===2&&!s.closed&&s.power:s.mode===2&&across&&!s.power;
  const measured=meterReading(s.mode,s.leads,s.power,s.closed),fault=measured.fault;
  const reading=measured.message??fmt(measured.value!,2);
  return{steps:3,goal:s.stage===0?'Meça +12 V sobre o resistor de 6 Ω. Coloque o seletor em V e conecte as duas pontas nos terminais do resistor, com a polaridade correta.':s.stage===1?'Meça +2 A no ramo. Abra o fio X–Y, selecione A e encaixe o aparelho nesse intervalo para que a corrente passe por ele.':'Meça 6 Ω. Desconecte a fonte e conecte o ohmímetro aos terminais do resistor.',
   board:svg(`<g class="wb-wire"><path d="M80 155V90H200m0 0h45m150 0h45m0 0h120V300H405M235 300H80V205"/>${s.power?'<circle cx="80" cy="180" r="25"/>':'<path d="M80 155l-16 20m16 15v15"/>'}<path d="M245 90l15 -12 24 24 24 -24 24 24 24 -24 24 24 15 -12"/>${s.closed?'<path d="M235 300H405"/>':''}</g>${text(45,185,s.power?'12 V':'OFF')}${text(287,58,'6 Ω')}${ports.map((p,i)=>`<circle data-action="probe-port" data-value="${i}" cx="${p.x}" cy="${p.y}" r="17" class="wb-port" role="button" tabindex="0" aria-label="Conectar ponta no terminal ${names[i]}"/>`+text(p.x-8,p.y+(i<2?42:43),names[i])).join('')}${s.leads.map((port,i)=>port===null?'':`<path d="M${i===0?280:360} 225Q${i===0?150:490} 230 ${ports[port].x} ${ports[port].y}" class="wb-lead ${i===0?'red':'black'}"/>`).join('')}<rect x="225" y="145" width="190" height="90" rx="14" class="wb-meter ${fault?'fault':''}"/>${text(240,180,reading,'wb-lcd')}${text(295,215,modes[s.mode])}<circle data-action="lead" data-value="0" cx="280" cy="242" r="15" class="wb-probe-red"/><circle data-action="lead" data-value="1" cx="360" cy="242" r="15" class="wb-probe-black"/>`, 'Circuito de 12 volts, resistor de 6 ohms, abertura X–Y e multímetro com duas pontas selecionáveis.'),
   controls:button('mode','Girar seletor: '+modes[s.mode])+button('power',s.power?'Desligar fonte':'Ligar fonte')+button('wire',s.closed?'Abrir fio X–Y':'Fechar fio X–Y')+`<div class="wb-part-group">${button('lead','Ponta vermelha',`data-value="0" aria-pressed="${s.lead===0}"`)}${button('lead','Ponta preta',`data-value="1" aria-pressed="${s.lead===1}"`)}</div>`,
   readout:metric('Seletor',modes[s.mode])+metric('Visor',reading+' '+modes[s.mode],met)+metric('Próxima ponta',s.lead===0?'Vermelha':'Preta'),met,
   explain:fault?'Na escala A, o aparelho tem resistência muito baixa. Você o colocou em paralelo com a alimentação: isso cria um curto no modelo. Abra o fio e coloque as pontas no intervalo, em série.':s.stage===0?'O voltímetro compara dois potenciais sem interromper o ramo. Vermelha em L e preta em R dão +12 V; inverter as pontas dá −12 V.':s.stage===1?'A corrente sai do lado positivo da fonte, atravessa R e volta de Y para X. O amperímetro deve substituir o fio X–Y: vermelha em Y e preta em X dão +2 A. Se deixar o fio fechado, ele desvia a corrente do aparelho; a leitura não mede o ramo como você queria.':'O ohmímetro aplica seu próprio sinal. Neste modelo, desligar desconecta a fonte: não há outro caminho entre os terminais do resistor, que mede 6 Ω. Entre dois pontos unidos só por fio a leitura é 0 Ω; entre partes desconectadas é OL. As leituras dependem de onde você colocou as pontas.'};
 }
 let current:Frame;
 function render():void {
  if(disposed)return;current=frame();
  host.innerHTML=`<div class="wb-heading"><p class="review-eyebrow">Missão prática${current.steps?` · etapa ${s.stage+1}/${current.steps}`:''}</p><h2>${finished?'✓ Montagem concluída':'Faça acontecer'}</h2></div><p class="wb-goal">${current.goal}</p><div class="wb-board ${current.side?'with-side':''}"><div>${current.board}</div>${current.side?`<div class="wb-side">${current.side}</div>`:''}</div><div class="wb-controls">${current.controls??''}${isPlane()?`<div class="wb-nudge"><span>Ajuste fino · 0,1</span>${button('move-left','←','aria-label="Mover ponto para esquerda"')}${button('move-right','→','aria-label="Mover ponto para direita"')}${button('move-up','↑','aria-label="Mover ponto para cima"')}${button('move-down','↓','aria-label="Mover ponto para baixo"')}</div>`:''}</div><div class="wb-readings" aria-label="Leituras da montagem">${current.readout}</div><p class="wb-explain">${current.explain}</p>${notice?`<p class="wb-notice" role="status">${notice}</p>`:''}<div class="wb-actions">${button('verify',finished?'✓ Missão concluída':current.met?(current.steps&&s.stage<current.steps-1?'Próxima etapa →':'Confirmar montagem →'):'Testar montagem',finished?'disabled':'')}${button('hint',hint?'Pista visível':'Mostrar uma pista')}${button('reset','Recomeçar experiência')}</div><p class="wb-result ${current.met?'ready':''}" role="status">${finished?'Você pode continuar explorando ou seguir para a próxima missão.':checked&&!current.met?'A montagem ainda não satisfaz a meta. Compare as leituras e o objetivo acima.':current.met?'A meta foi atingida. Confira o efeito e confirme sua montagem.':'As leituras respondem à sua montagem. Não há perda de vidas ou pontos.'}</p>${hint?`<p class="review-hint">${hintText()}</p>`:''}`;
  // Keep small electrical symbols at their visual size, with finger-sized hit
  // areas. Move button semantics to one group, avoiding duplicate controls.
  for(const control of host.querySelectorAll<SVGCircleElement>('svg circle[data-action]')){
   const group=document.createElementNS('http://www.w3.org/2000/svg','g');
   for(const name of ['data-action','data-value','role','tabindex','aria-label']){const value=control.getAttribute(name);if(value!==null){group.setAttribute(name,value);control.removeAttribute(name);}}
   const hit=document.createElementNS('http://www.w3.org/2000/svg','circle');hit.setAttribute('cx',control.getAttribute('cx')!);hit.setAttribute('cy',control.getAttribute('cy')!);hit.setAttribute('r','48');hit.setAttribute('class','wb-hit');
   control.replaceWith(group);group.append(hit,control);
  }
 }
 function hintText():string {
  if(m.id==='sinais')return s.stage===0?'Direita aumenta a parte real; para cima aumenta a imaginária. Procure (3, 4).':s.stage===1?'Uma multiplicação por j gira 90° para a esquerda: (3,4) vira (−4,3).':'O resultado deve ter módulo 5 e ângulo 30°: aproximadamente 4,33 + j2,50.';
  if(m.id==='impedancias')return 'Experimente R = 6 Ω, L = 80 mH e C = 2000 µF: XL = 8 Ω e |XC| = 5 Ω. A parte imaginária que sobra é +3 Ω.';
  if(m.id==='malhas')return 'A ponta azul é onde você está. Percorra o menor contorno da malha indicada e feche no ponto inicial. O ramo do meio é compartilhado.';
  if(m.id==='supermalha')return 'Procure o cruzamento das duas retas: I₁ = −0,2 A e I₂ = 1,8 A. 4I₁ + 6I₂ = 10; I₂ − I₁ = 2.';
  if(m.id==='superno')return 'Procure V₁ = 12,8 V e V₂ = 10,8 V. A diferença é 2 V; 12,8/4 + 10,8/6 = 5 A.';
  if(m.id==='nos')return 'O ponto é V ≈ 6,154 − j9,231 V. Compare os complexos das correntes; a diferença deve cair abaixo de 0,025 A.';
  if(m.id==='equivalentes')return 'A carga ideal é o conjugado: 4 − j3 Ω. A reatância total zera e as resistências ficam iguais.';
  if(m.id==='dependentes')return 'O sensor deve estar no capacitor (C). Ajuste o ganho com + e − até 2 × Ix.';
  if(m.id==='potencia')return 'Instale um total de 600 var capacitivos: 200 + 400, por exemplo. Passar de 600 var faz Q ficar negativo e aumenta a corrente novamente.';
  if(m.id==='rede')return 'Use 1:10 na subida e 10:1 na descida. A carga recebe cerca de 99,01 V e a linha perde cerca de 0,98 W.';
  if(m.id==='estrela')return 'Toque em cada ponta livre e depois em N. As três correntes de linha equilibradas somam zero no neutro.';
  if(m.id==='delta')return 'Uma montagem possível: ramo A termina em B, ramo B em C e ramo C em A. Nenhum ramo usa N.';
  return s.stage===0?'Seletor V, fonte ligada, fio fechado, vermelha em L e preta em R.':s.stage===1?'Seletor A, fonte ligada, fio X–Y aberto, vermelha em Y e preta em X.':'Seletor Ω, fonte desconectada e as pontas em L e R.';
 }
 function act(action:string,value?:string,target?:Element):void {
  notice='';checked=false;let nextStage=false;
  if(action==='verify'){
   checked=true;
   if(current.met&&!finished){if(current.steps&&s.stage<current.steps-1){nextStage=true;s.stage++;s.path=s.stage===1?[3]:[0];if(m.id==='sinais')s.v=s.stage===1?c(3,4):c(2,1);if(m.id==='medidas'){s.leads=[null,null];s.lead=0;}hint=false;notice='Etapa concluída. Agora observe a próxima situação.';}else{finished=true;onComplete();}}
  }else if(action==='hint')hint=!hint;
  else if(action==='reset'){s=initial();vectorLimit=12;hint=false;finished=false;}
  else if(action==='j')s.v=c(-s.v.im,s.v.re);
  else if(action==='minus-j')s.v=c(s.v.im,-s.v.re);
  else if(action==='double'){s.v=c(s.v.re*2,s.v.im*2);vectorLimit=Math.max(vectorLimit,Math.abs(s.v.re)*1.2,Math.abs(s.v.im)*1.2);}
  else if(action==='half')s.v=c(s.v.re/2,s.v.im/2);
  else if(action==='move-left')s.v.re=Math.max(plane.xmin,s.v.re-.1);
  else if(action==='move-right')s.v.re=Math.min(plane.xmax,s.v.re+.1);
  else if(action==='move-up')s.v.im=Math.min(plane.ymax,s.v.im+.1);
  else if(action==='move-down')s.v.im=Math.max(plane.ymin,s.v.im-.1);
  else if(action==='slot')s.slot=value as 'R'|'L'|'C';
  else if(action==='part'){const part=(target as HTMLElement)?.dataset.part as 'R'|'L'|'C';if(part)s[part]=Number(value);}
  else if(action==='trace'){
   const goal=s.stage===0?[0,1,2,3,0]:[3,2,4,5,3];
   if(Number(value)===goal[s.path.length])s.path.push(Number(value));else notice='Esse trecho não é o próximo do contorno horário pedido. Siga o fio a partir da ponta azul; o ramo comum deve ser percorrido na direção dessa malha.';
  }else if(action==='undo-trace'){if(s.path.length>1)s.path.pop();}
  else if(action==='sensor')s.sensor=value as 'C'|'R'|'L';
  else if(action==='gain-up')s.gain=Math.min(3,s.gain+.25);
  else if(action==='gain-down')s.gain=Math.max(0,s.gain-.25);
  else if(action==='cap')s.caps[Number(value)]=!s.caps[Number(value)];
  else if(action==='up')s.up=Number(value);
  else if(action==='down')s.down=Number(value);
  else if(action==='coil')s.coil=Number(value);
  else if(action==='terminal'){s.ends[s.coil]=Number(value);s.coil=(s.coil+1)%3;}
  else if(action==='disconnect')s.ends[s.coil]=null;
  else if(action==='mode')s.mode=(s.mode+1)%3;
  else if(action==='power')s.power=!s.power;
  else if(action==='wire')s.closed=!s.closed;
  else if(action==='lead')s.lead=Number(value);
  else if(action==='probe-port'){s.leads[s.lead]=Number(value);s.lead=1-s.lead;}
  render();
  if(nextStage){const pane=host.closest<HTMLElement>('.python-scroll')!;scrollPageTo(pageScrollTop()+host.getBoundingClientRect().top-pane.getBoundingClientRect().top-24);}
 }
 function position(event:PointerEvent):{x:number;y:number}|undefined {
  const board=host.querySelector<SVGSVGElement>('[data-board]');if(!board)return;
  const point=board.createSVGPoint();point.x=event.clientX;point.y=event.clientY;
  const matrix=board.getScreenCTM();if(!matrix)return;
  const transformed=point.matrixTransform(matrix.inverse());return{x:transformed.x,y:transformed.y};
 }
 function vectorMove(event:PointerEvent):void {
  const p=position(event);if(!p)return;
  s.v=c(Math.round(Math.max(plane.xmin,Math.min(plane.xmax,plane.xmin+(p.x-72)/500*(plane.xmax-plane.xmin)))*10)/10,Math.round(Math.max(plane.ymin,Math.min(plane.ymax,plane.ymin+(350-p.y)/300*(plane.ymax-plane.ymin)))*10)/10);checked=false;render();
 }
 const isPlane=()=>['sinais','nos','superno','supermalha','equivalentes'].includes(m.id);
 function down(event:PointerEvent):void {
  if(event.pointerType==='mouse'&&event.button!==0)return;
  suppress=false;
  const el=event.target as Element,part=el.closest<HTMLElement>('[data-part]'),board=el.closest('[data-board]');
  if(!part&&!board)return;
  // Dedicated boards own their gestures; scrolling starts outside the board.
  event.stopPropagation();suppress=false;
  if(part)drag={kind:'part',part:part.dataset.part as 'R'|'L'|'C',value:Number(part.dataset.value),startX:event.clientX,startY:event.clientY,moved:false};
  else if(isPlane())drag={kind:'vector',startX:event.clientX,startY:event.clientY,moved:false};
  if(drag?.kind==='vector'){host.setPointerCapture(event.pointerId);vectorMove(event);}
 }
 function move(event:PointerEvent):void {
  if(!drag)return;event.stopPropagation();if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>5)drag.moved=true;
  if(drag.kind==='part'&&drag.moved&&!host.hasPointerCapture(event.pointerId))host.setPointerCapture(event.pointerId);
  if(drag.kind==='vector')vectorMove(event);
 }
 function up(event:PointerEvent):void {
  if(!drag)return;
  const ended=drag;drag=undefined;suppress=ended.moved;
  if(ended.kind==='part'&&ended.moved){const p=position(event);if(p){const slots=[{id:'R',x:180},{id:'L',x:330},{id:'C',x:480}];const hit=slots.find(slot=>Math.abs(p.x-slot.x)<50&&Math.abs(p.y-80)<55);if(hit?.id===ended.part){s[ended.part!]=ended.value!;s.slot=ended.part!;notice='Peça instalada: confira a nova corrente.';}else notice='Essa peça precisa do encaixe com o mesmo símbolo (R, L ou C).';render();}}
  if(host.hasPointerCapture(event.pointerId))host.releasePointerCapture(event.pointerId);
 }
 function cancel(event:PointerEvent):void {drag=undefined;suppress=true;if(host.hasPointerCapture(event.pointerId))host.releasePointerCapture(event.pointerId);}
 function click(event:MouseEvent):void {
  if(suppress){event.preventDefault();event.stopPropagation();suppress=false;return;}
  const el=(event.target as Element).closest<HTMLElement>('[data-action]');if(!el)return;event.preventDefault();act(el.dataset.action!,el.dataset.value,el);
 }
 function key(event:KeyboardEvent):void {
  suppress=false;
  const el=event.target as Element;
  if(isPlane()&&el.matches('[data-drag=vector]')){const step=event.shiftKey?1:.1;if(event.key==='ArrowLeft')s.v.re-=step;else if(event.key==='ArrowRight')s.v.re+=step;else if(event.key==='ArrowUp')s.v.im+=step;else if(event.key==='ArrowDown')s.v.im-=step;else return;s.v.re=Math.max(plane.xmin,Math.min(plane.xmax,s.v.re));s.v.im=Math.max(plane.ymin,Math.min(plane.ymax,s.v.im));event.preventDefault();render();host.querySelector<SVGElement>('[data-drag=vector]')?.focus({preventScroll:true});}
  else if((event.key==='Enter'||event.key===' ')&&el.closest('svg [data-action]')){const target=el.closest<HTMLElement>('[data-action]')!;event.preventDefault();act(target.dataset.action!,target.dataset.value,target);}
 }
 host.addEventListener('pointerdown',down);host.addEventListener('pointermove',move);host.addEventListener('pointerup',up);host.addEventListener('pointercancel',cancel);host.addEventListener('click',click);host.addEventListener('keydown',key);render();
 return()=>{disposed=true;host.removeEventListener('pointerdown',down);host.removeEventListener('pointermove',move);host.removeEventListener('pointerup',up);host.removeEventListener('pointercancel',cancel);host.removeEventListener('click',click);host.removeEventListener('keydown',key);};
}
