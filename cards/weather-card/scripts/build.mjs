import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const files=['../../shared/ui-button.js','../../shared/ui-primary-value.js','../../shared/ui-metric.js','../../shared/ui-tabs.js','../../shared/header-atmosphere.js','../../shared/header-backgrounds.js','../../shared/header-scene.js','src/weather-backgrounds.js','src/weather-utils.js','src/weather-icon-styles.js','src/weather-art.js','src/weather-atmosphere.js','src/weather-styles.js','src/weather-dom.js','src/weather-editor.js','src/weather-card.js'];
const sources=await Promise.all(files.map(async file=>(await readFile(new URL(file,root),'utf8')).replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'')));
const output=`// Eleven Weather (beta) — self-contained module\n(()=>{\n${sources.join('\n')}\nif(!customElements.get('eleven-weather-card'))customElements.define('eleven-weather-card',WeatherCard);\nwindow.customCards=window.customCards||[];\nif(!window.customCards.some(card=>card.type==='eleven-weather-card'))window.customCards.push({type:'eleven-weather-card',name:'Eleven Weather (beta)',description:'Compact current weather and forecast with state-aware illustrations.',preview:true});\n})();\n`;
await mkdir(new URL('dist/',root),{recursive:true});
await writeFile(new URL('dist/eleven-weather-card.js',root),output);
await writeFile(new URL('dist/eleven-weather-card-test.js',root),output.replaceAll('eleven-weather-card','eleven-weather-card-test').replaceAll('eleven-weather-editor','eleven-weather-editor-test'));
console.log('Built Eleven Weather (beta)');
