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
const output=dialog.querySelector('output')!;
const PREVIEW_INTERVAL=100;
let previewTimer:ReturnType<typeof setTimeout>|undefined;
let saveTimer:ReturnType<typeof setTimeout>|undefined;
let lastPreview=-Infinity;
function display(syncInput=false):void {
  if(syncInput) input.value=String(lightness);
  output.textContent=lightness.toFixed(1).replace('.',',');
}
function preview():void {
  clearTimeout(previewTimer);previewTimer=undefined;lastPreview=performance.now();
  window.dispatchEvent(new CustomEvent('lightnesschange',{detail:lightness}));
}
function persist():void {
  clearTimeout(saveTimer);saveTimer=undefined;
  try {localStorage.setItem('nicolle-lightness',String(lightness));}catch{}
  // Some browsers rate-limit history writes. Preference saving must still work.
  try {
    const url=new URL(location.href);url.searchParams.set('lightness',String(lightness));
    history.replaceState(null,'',url);
  }catch{}
}
function apply(next:number,final=false):void {
  lightness=next;display();
  if(final || performance.now()-lastPreview>=PREVIEW_INTERVAL) preview();
  else if(previewTimer===undefined) previewTimer=setTimeout(preview,PREVIEW_INTERVAL-(performance.now()-lastPreview));
  clearTimeout(saveTimer);
  if(final) persist();else saveTimer=setTimeout(persist,250);
}
input.addEventListener('input',()=>apply(Number(input.value)));
input.addEventListener('change',()=>apply(Number(input.value),true));
dialog.addEventListener('close',()=>{if(previewTimer!==undefined) preview();persist();});
dialog.querySelector('#lightness-default')!.addEventListener('click',()=>{apply(DEFAULT_LIGHTNESS,true);display(true);});
function open(event:MouseEvent):void {if((event.target as Element).closest('[data-settings]')) {display(true);dialog.showModal();}}
document.addEventListener('click',open);display(true);
if(import.meta.hot) import.meta.hot.dispose(()=>{clearTimeout(previewTimer);clearTimeout(saveTimer);dialog.remove();document.removeEventListener('click',open);});
