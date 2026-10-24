import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
// Include the EVCC engine so the unified card is self-contained in either mode.
const files=['../../shared/ui-button.js','../../shared/ui-primary-value.js','../../shared/ui-metric.js','../../shared/ui-tabs.js','../../shared/header-atmosphere.js','../../shared/header-backgrounds.js','../../shared/header-scene.js','../../shared/graph.js','src/evcc/evcc-backgrounds.js','src/evcc/evcc-utils.js','src/evcc/evcc-presentation.js','src/evcc/evcc-history.js','src/evcc/evcc-solar.js','src/evcc/evcc-gallery.js','src/evcc/evcc-styles.js','src/evcc/evcc-card.js','src/car-utils.js','src/car-editor.js','src/car-card.js'];
const sources=await Promise.all(files.map(async file=>(await readFile(new URL(file,root),'utf8')).replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'')));
const output=`// Eleven Car (beta) - self-contained standalone module\n(()=>{\n${sources.join('\n')}\nif(!customElements.get('eleven-car-card'))customElements.define('eleven-car-card',CarCard);\nwindow.customCards=window.customCards||[];\nif(!window.customCards.some(card=>card.type==='eleven-car-card'))window.customCards.push({type:'eleven-car-card',name:'Eleven Car (beta)',description:'Vehicle image, percentage and configurable readings, with optional EVCC charging integration.',preview:true});\n})();\n`;
await mkdir(new URL('dist/',root),{recursive:true});
await writeFile(new URL('dist/eleven-car-card.js',root),output);
await writeFile(new URL('dist/eleven-car-card-test.js',root),output.replaceAll('eleven-car-card','eleven-car-card-test').replaceAll('eleven-car-editor','eleven-car-editor-test').replaceAll("name:'Eleven Car (beta)'","name:'Eleven Car Test (beta)'"));
console.log('Built Eleven Car (beta)');
