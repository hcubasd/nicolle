export type Uniforms = Record<string, WebGLUniformLocation | null>;
export interface Panel {x:number;y:number;halfWidth:number;halfHeight:number;radius:number;}
export const GLASS_UNIFORMS: string[];
export const Z_PER_SECOND: number;
export function modeFor(lightness:number): 'dark'|'light';
export function createProgram(gl:WebGL2RenderingContext, fragmentSource:string, uniformNames:string[]): Uniforms;
export function uploadTables(gl:WebGL2RenderingContext, uniform:Uniforms, perm:Uint8Array, lightness:number, rotation?:number, palette?:{r:number;g:number;b:number}[]):void;
export function observeDeviceSize(canvas:HTMLCanvasElement, callback:(width:number,height:number)=>void):ResizeObserver;
export function setGlassLength(gl:WebGL2RenderingContext, uniform:Uniforms, dpr:number):void;
export function setBox(gl:WebGL2RenderingContext, uniform:Uniforms, width:number,height:number,dpr:number):void;
export function setPanels(gl:WebGL2RenderingContext, uniform:Uniforms, panels:Panel[], dpr:number):void;
