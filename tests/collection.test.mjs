import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';

const slugs=['dynamic-energy-price-card','history-graph-card','timeline-card','overview-card','bar-chart','heatmap-card','calendar-card','weather-card','car-card','energy-flow-card','shopping-card'];
test('every card offers Sections sizing and a finite masonry size before configuration',()=>{
 const registry=new Map(),context=vm.createContext({HTMLElement:class{},window:{},customElements:{get:n=>registry.get(n),define:(n,c)=>registry.set(n,c)}});
 vm.runInContext(readFileSync(new URL('../dist/eleven-cards.js',import.meta.url),'utf8'),context);
 for(const slug of slugs){
  const card=Object.create(registry.get('eleven-'+slug).prototype);card._rows=[];
  const options=card.getGridOptions();
  if(slug==='shopping-card'){
   assert.equal(options.rows,'auto');
   assert.equal(options.min_columns,6);
   assert.ok(Number.isFinite(card.getCardSize())&&card.getCardSize()>0,slug);
   continue;
  }
  assert.ok(Number.isInteger(options.rows)&&options.rows>=options.min_rows,slug);
  assert.ok(Number.isInteger(options.min_rows)&&options.min_rows>0,slug);
  assert.ok(Number.isFinite(card.getCardSize())&&card.getCardSize()>0,slug);
 }
});
test('all Eleven modules coexist in either load order and tolerate repeat loads',()=>{
 for(const order of [slugs,[...slugs].reverse()]) {
  const registry=new Map(),window={};
  const context=vm.createContext({HTMLElement:class{},window,customElements:{get:n=>registry.get(n),define:(n,c)=>{assert.ok(!registry.has(n));registry.set(n,c);}}});
  for(const slug of [...order,...order]) vm.runInContext(readFileSync(new URL(`../cards/${slug}/dist/eleven-${slug}.js`,import.meta.url),'utf8'),context);
  assert.equal(registry.size,slugs.length+1); // Shopping has a separately registered editor.
  assert.deepEqual(Array.from(window.customCards,c=>c.type).sort(),slugs.map(s=>`eleven-${s}`).sort());
 }
});
test('README relative links and images resolve and examples use Eleven types',()=>{
 for(const rel of ['README.md',...slugs.map(s=>`cards/${s}/README.md`)]) {
  const url=new URL(`../${rel}`,import.meta.url),text=readFileSync(url,'utf8');
  for(const match of text.matchAll(/\]\(([^)]+)\)|src="([^"]+)"/g)) {
   const target=match[1]??match[2];
   if(/^[a-z]+:|^#/i.test(target))continue;
   assert.ok(existsSync(new URL(target.split('#')[0],url)),`${rel}: ${target}`);
  }
  if(rel!=='README.md')assert.doesNotMatch(text,/type: custom:(?:dynamic-energy-price-card|history-graph-card)/);
 }
});

test('removed Climate and standalone EVCC cards are absent while Car keeps its EVCC engine',()=>{
 for(const path of ['cards/climate-card','cards/evcc-card','tests/browser-climate.mjs','tests/climate-browser-checks.js'])assert.equal(existsSync(new URL('../'+path,import.meta.url)),false,path);
 assert.ok(existsSync(new URL('../cards/car-card/src/evcc/evcc-card.js',import.meta.url)));
 const scripts=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).scripts;
 for(const script of Object.values(scripts))assert.doesNotMatch(script,/cards\/(climate-card|evcc-card)\//);
});
