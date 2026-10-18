type Color = {r:number;g:number;b:number};
export function buildPermutation(seed: number): Uint8Array;
export function scaleFor(palette:Color[], defaultPalette:Color[]):number;
export function roughness(palette:Color[], defaultPalette:Color[]):number;
export function gainFor(lightness:number, rho:number, rowRoughness:readonly number[]):number;
export function octaves(gain: number, cellDevicePx: number): {count:number;rate:number};
