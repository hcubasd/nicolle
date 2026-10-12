import { DEFAULT_LIGHTNESS } from 'nicrainha';
let stored: string | null = null;
try { stored = localStorage.getItem('nicolle-lightness'); } catch { /* Storage is optional. */ }
const requested = new URLSearchParams(location.search).get('lightness') ?? stored;
const value = requested?.trim() ? Number(requested) : NaN;
export let lightness = Number.isFinite(value) && value >= 0 && value <= 100 ? value : DEFAULT_LIGHTNESS;
const dialog = document.createElement('dialog');
dialog.className = 'settings-dialog';
dialog.setAttribute('aria-labelledby','settings-title');
dialog.innerHTML = `<form method="dialog"><h2 id="settings-title">Aparência</h2><p>Escolha a luminosidade do fundo. As cores e o contraste do vidro se ajustam automaticamente.</p><label for="lightness-control">Luminosidade <output id="lightness-value"></output></label><input id="lightness-control" name="lightness" type="range" min="0" max="100" step="0.1"><div class="settings-actions"><button type="button" id="lightness-default">Restaurar padrão</button><button value="close">Fechar</button></div></form>`;
document.body.append(dialog);
const input=dialog.querySelector<HTMLInputElement>('input')!;
function display(): void {input.value=String(lightness);dialog.querySelector('output')!.textContent=lightness.toFixed(1).replace('.',',');}
function apply(next:number):void {
  lightness=next;display();
  try {localStorage.setItem('nicolle-lightness',String(lightness));}catch{}
  const url=new URL(location.href);url.searchParams.set('lightness',String(lightness));history.replaceState(null,'',url);
  window.dispatchEvent(new CustomEvent('lightnesschange',{detail:lightness}));
}
input.addEventListener('input',()=>apply(Number(input.value)));
dialog.querySelector('#lightness-default')!.addEventListener('click',()=>apply(DEFAULT_LIGHTNESS));
function open(event:MouseEvent):void {if((event.target as Element).closest('[data-settings]')) {display();dialog.showModal();}}
document.addEventListener('click',open);display();
if(import.meta.hot) import.meta.hot.dispose(()=>{dialog.remove();document.removeEventListener('click',open);});
