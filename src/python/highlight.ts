import {mapColors} from 'nicrainha';
import {LIGHTNESS} from '../scene';
// ANSI's six chromatic colors and their six bright counterparts; no grays.
const ansi=[{r:170,g:0,b:0},{r:0,g:170,b:0},{r:170,g:85,b:0},{r:0,g:0,b:170},{r:170,g:0,b:170},{r:0,g:170,b:170},{r:255,g:85,b:85},{r:85,g:255,b:85},{r:255,g:255,b:85},{r:85,g:85,b:255},{r:255,g:85,b:255},{r:85,g:255,b:255}];
const colors=mapColors(ansi,{lightness:LIGHTNESS});
export function applyCodeColors(element:HTMLElement):void {colors.forEach((c,i)=>element.style.setProperty(`--ansi-${i}`,`rgb(${c.r} ${c.g} ${c.b})`));}
export const escape=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function highlight(line:string):string {
 const tokens=/#.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+\b|\b[A-Za-z_][A-Za-z_0-9]*\b|[^\w\s]/g;
 const keywords=new Set(['import','def','return','for','in','if','else','while','and','or','not','is','break','continue']);
 const functions=new Set(['prim','ponte_mais_barata','caminho']);
 const builtins=new Set(['input','print','range','len','int','str']);
 const variables=new Set(['grupo','total','resgatadas','saldo','compradas']);
 let result='',end=0;
 for(const match of line.matchAll(tokens)){
  result+=escape(line.slice(end,match.index));const token=match[0];
  const color=token.startsWith('#')?9:/^["']/.test(token)?1:/^\d/.test(token)?8:keywords.has(token)?4:functions.has(token)?5:builtins.has(token)?11:['None','True','False'].includes(token)?6:variables.has(token)?7:token==='random'?10:['append','pop','randrange','randint'].includes(token)?3:/^[^\w]/.test(token)?2:0;
  result+=`<span style="color:var(--ansi-${color})">${escape(token)}</span>`;end=match.index!+token.length;
 }
 return result+escape(line.slice(end));
}
