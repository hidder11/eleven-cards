import {readFile} from 'node:fs/promises';

// Standalone bundles each own their helpers. A private scope prevents collisions
// with native card utilities while retaining the card's original class and editor.
export async function addSharedCardBackgrounds(bundle){
 if(bundle.includes('const withSharedCardBackground='))throw Error('Background adapter already installed');
 const files=['ui-surface.js','ui-button.js','ui-card-background.js','card-background.js'];
 const sources=await Promise.all(files.map(async name=>(await readFile(new URL('../shared/'+name,import.meta.url),'utf8')).replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'')));
 let count=0;
 const decorated=bundle.replace(/customElements\.define\((['"])(eleven-(?:dynamic-energy-price-card|history-graph-card|timeline-card|overview-card|bar-chart|heatmap-card|calendar-card|weather-card|car-card|energy-flow-card))\1,\s*([A-Za-z_$][\w$]*)\)/g,(_,quote,type,base)=>{count++;return 'customElements.define('+quote+type+quote+',withSharedCardBackground('+base+'))';});
 if(count!==1)throw Error('Expected one supported card registration; found '+count);
 const opening=/\(\(\)=>\{\r?\n(?:"use strict";\r?\n)?/;
 if(!opening.test(decorated))throw Error('Standalone bundle scope not found');
 return decorated.replace(opening,match=>match+'const withSharedCardBackground=(()=>{\n'+sources.join('\n')+'\nreturn Base=>withCardBackground(Base,{preserveNative:true});\n})();\n');
}
