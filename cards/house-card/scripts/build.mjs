import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const files=['../../shared/ui-surface.js','../../shared/ui-button.js','../../shared/ui-primary-value.js','../../shared/ui-metric.js','../../shared/header-atmosphere.js','../../shared/header-backgrounds.js','src/house-pixels.js','src/house-weather.js','src/house-base.js','src/house-card.js'];
const sources=await Promise.all(files.map(async file=>(await readFile(new URL(file,root),'utf8')).replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'')));
await mkdir(new URL('dist/',root),{recursive:true});
await writeFile(new URL('dist/eleven-house-card.js',root),'// Eleven House — self-contained standalone module\n(()=>{\n'+sources.join('\n')+'\n})();\n');
console.log('Built Eleven House');
