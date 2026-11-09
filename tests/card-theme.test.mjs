import test from 'node:test';
import assert from 'node:assert/strict';
const cards=['dynamic-energy-price-card','history-graph-card','bar-chart','timeline-card','overview-card','heatmap-card','calendar-card','weather-card','car-card','energy-flow-card','shopping-card'];
test('all non-House standalone bundles adopt explicit theme roles, House excluded',()=>{
 for(const name of cards){const text=readFileSync(new URL(`../cards/${name}/dist/eleven-${name==='bar-chart'?'bar-chart':name}.js`,import.meta.url),'utf8');assert.match(text,/function cardThemeStyles\(/,name);assert.match(text,/cardThemeStyles\(\{/,name);}
 const house=readFileSync(new URL('../cards/house-card/dist/eleven-house-card.js',import.meta.url),'utf8');assert.doesNotMatch(house,/cardThemeStyles/);
});
import {readFileSync,existsSync} from 'node:fs';
test('local-only Actions/Controls/Waste, Room and Appliance snapshots also opt in',()=>{
 for(const [dir,bundle] of [['home-controls','eleven-home-controls-card.js'],['room-card','eleven-room-card.js'],['appliance-planner','eleven-appliance-planner.js']]){
  const text=readFileSync(new URL(`../cards/${dir}/dist/${bundle}`,import.meta.url),'utf8');assert.match(text,/function cardThemeStyles\(/,dir);assert.match(text,/cardThemeStyles\(\{/,dir);
 }
});
test('separate Scene Engine frontend follows the same scoped paint contract',()=>{
 const p=new URL('../cards/scene-engine-card/frontend/eleven-scene-engine-card.js',import.meta.url);
 assert.match(readFileSync(p,'utf8'),/cardThemeStyles\(\{/);
});
test('plot surfaces reuse the existing material inset when the newer plot role is absent',async()=>{
 const {cardThemeStyles}=await import('../shared/card-theme.js');
 const css=cardThemeStyles({plots:'.chart'});
 assert.match(css,/\.chart\{[^}]*background:var\(--eleven-material-plot-background,var\(--eleven-material-inset,transparent\)\)/);
});
test('explicit card-local wells follow optional theme, native defaults contain no material paint',async()=>{
 assert.ok(existsSync(new URL('../shared/card-theme.js',import.meta.url)),'missing scoped theme helper');
 const {cardThemeStyles}=await import('../shared/card-theme.js');
 const css=cardThemeStyles({wells:'.reading',controls:'.next'});
 assert.match(css,/\.reading\{[^}]*box-shadow:var\(--eleven-material-well,none\)/);
 assert.match(css,/\.next\{[^}]*background:var\(--eleven-material-control-background,/);
 assert.doesNotMatch(css.match(/\.reading\{[^}]*\}/)[0],/background:/,'reading wells must preserve functional sensor tint/gradient');
 assert.doesNotMatch(css,/#edf0f6|#2c303d|linear-gradient|radial-gradient|document|button\{/);
 assert.doesNotMatch(css,/font-size|padding:|height:|display:|stroke:|fill:/);
});
