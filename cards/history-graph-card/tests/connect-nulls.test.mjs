import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateConfig,editorConfig,cardConfig,valueAt} from '../src/history-utils.js';
import {SharedGraph} from '../../../shared/graph.js';
globalThis.HTMLElement=class{attachShadow(){return this.shadowRoot={innerHTML:'',querySelector:()=>null};}};
globalThis.customElements={get:()=>undefined,define:()=>{}};globalThis.window={};globalThis.document={querySelector:()=>null};
const {HistoryGraphCard:C}=await import('../src/history-graph-card.js');
const config={entities:['sensor.a']};
const points=[{t:0,v:null},{t:10,v:2},{t:20,v:null},{t:30,v:null},{t:40,v:8},{t:50,v:null}];
test('connect_nulls is opt-in and survives frozen native editor feedback',()=>{
 assert.equal(validateConfig(config).connect_nulls,false);
 assert.equal(editorConfig(config).connect_nulls,false);
 const data=editorConfig({...config,connect_nulls:true});Object.freeze(data);
 assert.equal(validateConfig(cardConfig(data)).connect_nulls,true);
 assert.throws(()=>validateConfig({...config,connect_nulls:'true'}),/connect_nulls/);
 const field=C.getConfigForm().schema.find(s=>s.name==='graph_settings').schema.find(s=>s.name==='connect_nulls');
 assert.equal(field.default,false);assert.deepEqual(field.selector,{boolean:{}});
});
test('only interior gaps are connected in all line modes without changing observations or values',()=>{
 const before=structuredClone(points);
 for(const mode of ['step','linear','smooth']){
  const c=new C();c.setConfig({...config,line_interpolation:mode,connect_nulls:true});
  const expected=SharedGraph.path([points[0],points[1],points[4],points[5]].map(p=>[p.t,p.v]),mode,60);
  assert.equal(c._line(points,60,t=>t,v=>v),expected,mode);
  c._config.connect_nulls=false;
  assert.equal(c._line(points,60,t=>t,v=>v),SharedGraph.path(points.map(p=>[p.t,p.v]),mode,60));
 }
 assert.deepEqual(points,before);assert.equal(valueAt(points,25),null);
});
test('line option leaves fills and all-missing/one-point segments unchanged',()=>{
 const c=new C();c.setConfig({...config,connect_nulls:true,show_fill:true});c._end=60;
 const area=c._area(points,t=>t,v=>v);
 assert.equal((area.match(/Z/g)||[]).length,2,'fill still shows unavailable durations honestly');
 for(const sample of [[],[{t:0,v:null}],[{t:0,v:null},{t:10,v:2},{t:20,v:null}]]){
  const on=c._line(sample,60,t=>t,v=>v);c._config.connect_nulls=false;
  assert.equal(c._line(sample,60,t=>t,v=>v),on);c._config.connect_nulls=true;
 }
});
