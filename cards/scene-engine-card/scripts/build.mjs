import {readFile,mkdir,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const strip=source=>source.replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
const theme=strip(await readFile(new URL('../../shared/card-theme.js',root),'utf8'));
const card=strip(await readFile(new URL('frontend/eleven-scene-engine-card.js',root),'utf8'));
await mkdir(new URL('dist/',root),{recursive:true});
await writeFile(new URL('dist/eleven-scene-engine-card.js',root),'// Local isolated Scene Engine frontend; backend unchanged.\n(()=>{\n'+theme+'\n'+card+'\n})();\n');
console.log('Built local Scene Engine frontend');
