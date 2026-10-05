import { mapColors } from 'nicrainha';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
hljs.registerLanguage('python', python);

// ANSI de 16 cores: excluir preto, cinza, cinza-claro e branco (0, 7, 8, 15).
// As seis cores cromáticas normais + as seis brilhantes, sem entradas cinza.
export const ansiNames = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'bright-red', 'bright-green', 'bright-yellow', 'bright-blue', 'bright-magenta', 'bright-cyan'];
export const syntaxPalette = mapColors([
  { r: 128, g: 0, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 128, g: 128, b: 0 },
  { r: 0, g: 0, b: 128 }, { r: 128, g: 0, b: 128 }, { r: 0, g: 128, b: 128 },
  { r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 255, g: 255, b: 0 },
  { r: 0, g: 0, b: 255 }, { r: 255, g: 0, b: 255 }, { r: 0, g: 255, b: 255 },
]);
syntaxPalette.forEach(({ r, g, b }, i) => document.documentElement.style.setProperty(`--ansi-${ansiNames[i]}`, `rgb(${r} ${g} ${b})`));
export function highlightPython(code: string): string { return hljs.highlight(code, { language: 'python', ignoreIllegals: true }).value; }
export async function copyCode(code: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(code); return true; } catch { /* HTTP preview fallback below. */ }
  }
  const area = document.createElement('textarea'); area.value = code;
  area.style.cssText = 'position:fixed;left:-10000px;top:0'; document.body.append(area);
  area.select(); const copied = document.execCommand('copy'); area.remove(); return copied;
}
