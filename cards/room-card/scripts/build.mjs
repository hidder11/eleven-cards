import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const base=new URL('../',import.meta.url);
const theme=readFileSync(new URL('../../shared/card-theme.js',base),'utf8').replace(/^export /gm,'');
const background=['ui-button.js','ui-action-button.js','ui-card-background.js','card-background.js'].map(file=>readFileSync(new URL('../../shared/'+file,base),'utf8').replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'')).join('\n');
const utils=readFileSync(new URL('src/room-utils.js',base),'utf8').replaceAll('export function','function');
const card=readFileSync(new URL('src/room-card.js',base),'utf8').replace(/^import .*;\n/gm,'').replace('export class','class');
mkdirSync(new URL('dist/',base),{recursive:true});
writeFileSync(new URL('dist/eleven-room-card.js',base),`// Eleven Room Card - local beta\n(()=>{\n${theme}\n${background}\n${utils}\n${card}\nif(!customElements.get('eleven-room-card'))customElements.define('eleven-room-card',withCardBackground(RoomCard));\nwindow.customCards=window.customCards||[];if(!window.customCards.some(c=>c.type==='eleven-room-card'))window.customCards.push({type:'eleven-room-card',name:'Eleven Room (beta)',description:'Ruimtestatus en navigatie, met bestaande apparaten',preview:true});\n})();\n`);
