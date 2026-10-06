import { DEFAULT_LIGHTNESS, generatePalettes } from 'nicrainha';
import { buildPermutation, fieldRange } from './noise';
import fragmentSource from './shaders/scene.frag?raw';
import vertexSource from './shaders/fullscreen.vert?raw';


// Noise, exact per-frame field range, palette and glass optics are adapted
// from nicrainha's showcase. See LICENSES/nicrainha.txt and README.md.
const canvas = document.querySelector<HTMLCanvasElement>('#background')!;
const MAX_PANELS = 32;
let glassElements: HTMLElement[] = [];
let layoutSignature = '';
const params = new URLSearchParams(location.search);
const palette = generatePalettes(256, { lightness: DEFAULT_LIGHTNESS })[Math.floor(Math.random() * 256)];
const permutation = buildPermutation(Math.floor(Math.random() * 99999));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const startedAt = performance.now();
let animationFrame = 0;
let disposed = false;
let geometryDirty = true;

function knob(name: string, fallback: number): number {
  if (!params.has(name)) return fallback;
  const value = Number(params.get(name));
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}
const speed = knob('speed', 1);
const background = palette[128];
const backgroundCss = `rgb(${background.r} ${background.g} ${background.b})`;
document.documentElement.style.setProperty('--fallback-background', backgroundCss);
document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!.content = backgroundCss;

const onLayout = () => { geometryDirty = true; };
const resizeObserver = new ResizeObserver(onLayout);
resizeObserver.observe(canvas);
function discoverGlass(): void {
  glassElements.forEach(element => resizeObserver.unobserve(element));
  glassElements = [...document.querySelectorAll<HTMLElement>('[data-glass]')];
  glassElements.forEach(element => resizeObserver.observe(element));
  geometryDirty = true;
}
const mutationObserver = new MutationObserver(discoverGlass);
mutationObserver.observe(document.querySelector('#app')!, { childList: true, subtree: true });
discoverGlass();
window.addEventListener('resize', onLayout, { passive: true });
window.addEventListener('scroll', onLayout, { passive: true });
window.visualViewport?.addEventListener('resize', onLayout, { passive: true });
document.fonts.ready.then(onLayout);

function fallback(): void {
  document.documentElement.classList.add('no-webgl');
}

function startRenderer(): void {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
  if (!gl) { fallback(); return; }

  function compile(type: number, source: string): WebGLShader {
    const shader = gl!.createShader(type);
    if (!shader) throw new Error('Cannot create WebGL shader.');
    gl!.shaderSource(shader, source);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
      const message = gl!.getShaderInfoLog(shader);
      gl!.deleteShader(shader);
      throw new Error(message || 'Cannot compile WebGL shader.');
    }
    return shader;
  }

  const program = gl.createProgram();
  if (!program) throw new Error('Cannot create WebGL program.');
  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'Cannot link WebGL program.');
  }
  gl.useProgram(program);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const locations = {
    permutation: gl.getUniformLocation(program, 'u_perm'),
    palette: gl.getUniformLocation(program, 'u_palette'),
    resolution: gl.getUniformLocation(program, 'u_resolution'),
    z: gl.getUniformLocation(program, 'u_z'),
    min: gl.getUniformLocation(program, 'u_min'),
    range: gl.getUniformLocation(program, 'u_range'),
    panels: gl.getUniformLocation(program, 'u_panels[0]'),
    radii: gl.getUniformLocation(program, 'u_radii[0]'),
    panelCount: gl.getUniformLocation(program, 'u_panelCount'),
    ior: gl.getUniformLocation(program, 'u_ior'),
  };
  function lookupTexture(unit: number, internalFormat: number, format: number, data: Uint8Array): void {
    gl!.activeTexture(gl!.TEXTURE0 + unit);
    gl!.bindTexture(gl!.TEXTURE_2D, gl!.createTexture());
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.NEAREST);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.NEAREST);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, internalFormat, 256, 1, 0, format, gl!.UNSIGNED_BYTE, data);
  }
  lookupTexture(0, gl.R8UI, gl.RED_INTEGER, permutation);
  lookupTexture(1, gl.RGBA8, gl.RGBA, new Uint8Array(palette.flatMap(({ r, g, b }) => [r, g, b, 255])));
  gl.uniform1i(locations.permutation, 0);
  gl.uniform1i(locations.palette, 1);
  gl.uniform1i(locations.panelCount, 0);
  gl.uniform1f(locations.ior, 1.5);
  geometryDirty = true;
  document.documentElement.classList.remove('no-webgl');

  function layout(): void {
    const bounds = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(bounds.width * dpr));
    const height = Math.max(1, Math.round(bounds.height * dpr));
    if (width !== canvas.width || height !== canvas.height) {
      canvas.width = width;
      canvas.height = height;
      gl!.viewport(0, 0, width, height);
      gl!.uniform2f(locations.resolution, width, height);
      geometryDirty = true;
    }
    // Track scroll position: filtering the list may clamp scrollY
    // without a separate scroll event before the next frame.
    const signature = `${window.scrollX},${window.scrollY},${dpr},${bounds.width},${bounds.height}`;
    if (signature !== layoutSignature) geometryDirty = true;
    layoutSignature = signature;
    if (!geometryDirty) return;

    // getBoundingClientRect is viewport-relative. Scrolling moves the DOM
    // panels and their refraction, but does not move or reseed the background.
    const panels = new Float32Array(MAX_PANELS * 4);
    const radii = new Float32Array(MAX_PANELS);
    // Cull off-screen elements before uploading. The canvas stays one scene,
    // whether the DOM is the course menu, a long timeline or event details.
    const measured = glassElements.map(element => ({ element, rect: element.getBoundingClientRect() }));
    const visible = measured
      .filter(({ rect }) => rect.width > 0 && rect.height > 0 && rect.bottom > bounds.top && rect.top < bounds.bottom && rect.right > bounds.left && rect.left < bounds.right);
    if (visible.length > MAX_PANELS) throw new Error('Too many visible glass panels.');
    visible.forEach(({ element, rect }, i) => {
      const defaultRadius = parseFloat(getComputedStyle(element).getPropertyValue('--glass-radius'));
      const baseRadius = Math.min(knob('radius', defaultRadius), rect.width / 2, rect.height / 2);
      panels.set([
        (rect.left - bounds.left + rect.width / 2) * dpr,
        (rect.top - bounds.top + rect.height / 2) * dpr,
        rect.width / 2 * dpr,
        rect.height / 2 * dpr,
      ], i * 4);
      radii[i] = baseRadius * dpr;
    });
    gl!.uniform1i(locations.panelCount, visible.length);
    gl!.uniform4fv(locations.panels, panels);
    gl!.uniform1fv(locations.radii, radii);
    geometryDirty = false;
  }

  function frame(now: number): void {
    if (disposed || gl!.isContextLost()) return;
    if (!document.hidden) {
      layout();
      // The same 0.1 lattice units/second as the nicrainha showcase. Motion
      // preference freezes the field, while scrolling and resizing still work.
      const z = reducedMotion.matches ? 0 : (((now - startedAt) / 1000) * 0.1 * speed) % 256;
      const { min, range } = fieldRange(permutation, z);
      gl!.uniform1f(locations.z, z);
      gl!.uniform1f(locations.min, min);
      gl!.uniform1f(locations.range, range);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }
    animationFrame = requestAnimationFrame(frame);
  }
  animationFrame = requestAnimationFrame(frame);
}

function launch(): void {
  try { startRenderer(); }
  catch (error) { console.error('Nicrainha background:', error); fallback(); }
}
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  cancelAnimationFrame(animationFrame);
  fallback();
});
canvas.addEventListener('webglcontextrestored', launch);
launch();

// Vite hot updates must not leave animation loops or observers running.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disposed = true;
    cancelAnimationFrame(animationFrame);
    resizeObserver.disconnect();
    mutationObserver.disconnect();
    window.removeEventListener('resize', onLayout);
    window.removeEventListener('scroll', onLayout);
    window.visualViewport?.removeEventListener('resize', onLayout);
    canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
  });
}
