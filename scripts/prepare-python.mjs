import {mkdir,copyFile} from 'node:fs/promises';
const target=new URL('../public/vendor/pyodide/',import.meta.url);
await mkdir(target,{recursive:true});
for(const file of ['pyodide.js','pyodide.asm.js','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json'])await copyFile(new URL(`../node_modules/pyodide/${file}`,import.meta.url),new URL(file,target));
await copyFile(new URL('../node_modules/pyodide/package.json',import.meta.url),new URL('package.json',target));
await mkdir(new URL('../public/grafos/python/',import.meta.url),{recursive:true});
await copyFile(new URL('../src/python/prim.py',import.meta.url),new URL('../public/grafos/python/prim.py',import.meta.url));
