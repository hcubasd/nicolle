import type {Species} from './model';
// Frame dimensions are native pixels: no scaling or smoothing of animal sheets.
export const sprites:Record<Species,{width:number;height:number;flying:boolean}>={
 cachorro:{width:40,height:40,flying:false},
 gato:{width:32,height:32,flying:false},
 lobo:{width:48,height:48,flying:false},
 ovelha:{width:48,height:48,flying:false},
 porco:{width:48,height:48,flying:false},
 tigre:{width:56,height:56,flying:false},
 galinha:{width:32,height:32,flying:false},
 sapo:{width:24,height:24,flying:false},
 morcego:{width:40,height:40,flying:true},
 gaivota:{width:56,height:40,flying:true},
 passaro:{width:32,height:32,flying:true},
 pomba:{width:32,height:32,flying:false},
 coelho:{width:32,height:32,flying:false},
};
export const animalAsset=(name:Species)=>`${import.meta.env.BASE_URL}grafos/animals/${name}.png`;
export function animalStyle(name:Species):string {const s=sprites[name];return `background-image:url('${animalAsset(name)}');width:${s.width}px;height:${s.height}px`;}
