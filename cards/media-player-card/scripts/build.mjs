import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const files=['../../shared/ui-bar.js','../../shared/ui-card-title.js','../../shared/ui-surface.js','../../shared/ui-button.js','../../shared/ui-card-background.js','../../shared/card-background.js','../../shared/header-atmosphere.js','../../shared/header-backgrounds.js','../../shared/header-scene.js','src/media-utils.js','src/media-styles.js','src/media-editor.js','src/media-player-card.js'];
const sources=await Promise.all(files.map(async file=>(await readFile(new URL(file,root),'utf8')).replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'')));
const output=`// Eleven Media Player (beta) - self-contained module\n(()=>{\n${sources.join('\n')}\nif(!customElements.get('eleven-media-player-card'))customElements.define('eleven-media-player-card',MediaPlayerCard);\nwindow.customCards=window.customCards||[];\nif(!window.customCards.some(card=>card.type==='eleven-media-player-card'))window.customCards.push({type:'eleven-media-player-card',name:'Eleven Media Player (beta)',description:'Media player with five layouts and supported playback controls.',preview:true});\n})();\n`;
await mkdir(new URL('dist/',root),{recursive:true});
await writeFile(new URL('dist/eleven-media-player-card.js',root),output);
await writeFile(new URL('dist/eleven-media-player-card-test.js',root),output.replaceAll('eleven-card-background-editor','eleven-card-background-editor-test').replaceAll('eleven-media-player-card','eleven-media-player-card-test').replaceAll('eleven-media-player-editor','eleven-media-player-editor-test'));
console.log('Built Eleven Media Player (beta)');
