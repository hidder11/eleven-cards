import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeConfig,numeric,color,escapeHtml,overviewSectionLayout,PALETTE} from '../src/overview-utils.js';
test('numeric sensors keep zero and negatives but reject empty/non-numeric states',()=>{
 for(const value of ['',null,undefined,'unavailable','unknown','Infinity','12 W','0x10'])assert.equal(numeric(value),null);
 assert.equal(numeric('0'),0);assert.equal(numeric('-2.5'),-2.5);
});
test('normalize independently copies frozen sensor settings and validates ranges',()=>{
 const input=Object.freeze({entities:Object.freeze([Object.freeze({entity:'sensor.a',name:'A',color:Object.freeze([1,2,3])}),'sensor.b'])});
 const c=normalizeConfig(input);assert.equal(c.hours_to_show,24);assert.equal(c.columns,'auto');assert.equal(c.entities[1].entity,'sensor.b');
 assert.equal(c.title,'Eleven Overview');
 assert.equal(normalizeConfig({...input,title:'Eleven Overview (beta)'}).title,'Eleven Overview');
 assert.equal(normalizeConfig({...input,title:'Mijn overzicht'}).title,'Mijn overzicht');
 c.entities[0].color[0]=99;assert.equal(input.entities[0].color[0],1);
 for(const entities of [[],['light.a'],['sensor.a','sensor.a']])assert.throws(()=>normalizeConfig({entities}));
 for(const hours_to_show of [0,-1,Infinity,9000])assert.throws(()=>normalizeConfig({entities:['sensor.a'],hours_to_show}));
 assert.throws(()=>normalizeConfig({entities:['sensor.a'],columns:7}));
});

test('larger overviews cycle default colours while preserving custom colours and unique sensors',()=>{
 const entities=Array.from({length:32},(_,i)=>i===10?{entity:'sensor.a'+i,color:[1,2,3]}:'sensor.a'+i);
 const config=normalizeConfig({entities});assert.equal(config.entities.length,32);
 for(const [i,row] of config.entities.entries())assert.deepEqual(row.color,i===10?[1,2,3]:PALETTE[i%PALETTE.length]);
 assert.throws(()=>normalizeConfig({entities:[...entities,'sensor.a0']}));
 assert.throws(()=>normalizeConfig({entities:[...entities,'light.a']}));
});
test('untrusted configuration is safe for text and inline colors',()=>{
 assert.equal(escapeHtml('<a "x">&'), '&lt;a &quot;x&quot;&gt;&amp;');
 assert.equal(color('red;position:fixed'),'#2196f3');assert.equal(color([1,2,3]),'rgb(1,2,3)');assert.equal(color('#aabbcc'),'#aabbcc');
});

test('section sizes have independent graph overrides, safe bounds and backwards compatible defaults',()=>{
 const base={entities:['sensor.a']},defaultConfig=normalizeConfig(base);
 assert.equal(defaultConfig.section_size,'standard');assert.equal(defaultConfig.graph_height,undefined);
 const compact=overviewSectionLayout(normalizeConfig({...base,section_size:'compact'})),standard=overviewSectionLayout(defaultConfig),spacious=overviewSectionLayout(normalizeConfig({...base,section_size:'spacious'}));
 assert.ok(compact.padding<standard.padding&&standard.padding<spacious.padding);
 assert.ok(compact.value<standard.value&&standard.value<spacious.value);
 assert.ok(compact.graph<standard.graph&&standard.graph<spacious.graph);
 for(const section_size of ['compact','standard','spacious']){
  assert.equal(overviewSectionLayout(normalizeConfig({...base,section_size,graph_height:120})).graph,120);
  assert.equal(normalizeConfig({...base,section_size,graph_height:null}).graph_height,undefined);
 }
 for(const graph_height of [0,23,161,48.5,NaN,Infinity,'40','40;position:fixed'])assert.throws(()=>normalizeConfig({...base,graph_height}));
 for(const section_size of ['large','',null,false])if(section_size!==null)assert.throws(()=>normalizeConfig({...base,section_size}));
});
