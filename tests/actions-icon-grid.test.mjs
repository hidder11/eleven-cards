import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const code=readFileSync(new URL('../cards/home-controls/dist/eleven-home-controls-card.js',import.meta.url),'utf8');
const elements=new Map();
class Element{attachShadow(){return this.shadowRoot={innerHTML:'',activeElement:null,querySelector:()=>null,querySelectorAll:()=>[]};}}
vm.runInNewContext(code,{HTMLElement:Element,structuredClone,customElements:{get:t=>elements.get(t),define:(t,c)=>elements.set(t,c)},window:{},document:{},clearInterval(){}});
const card=kind=>new (elements.get('eleven-'+kind+'-card'))();
test('Actions columns validates integers 1..6 without coercion',()=>{
 const c=card('actions');
 for(const columns of [1,2,3,4,5,6]){c.setConfig({columns,actions:[]});assert.equal(c._config.columns,columns);}
 for(const columns of [0,7,-1,1.5,'3',null,true,NaN,Infinity])assert.throws(()=>c.setConfig({columns,actions:[]}),/columns: expected an integer from 1 to 6/);
 c.setConfig({actions:[]});assert.equal(c._config.columns,undefined);
});
test('Columns validation is Actions only; Controls/Waste stay compatible',()=>{
 for(const kind of ['controls','waste'])assert.doesNotThrow(()=>card(kind).setConfig({columns:'existing-unrelated-value',entities:[]}));
});
test('Actions-only styles establish vertical icon hierarchy and a fixed maximum grid',()=>{
 const c=card('actions');c.setConfig({actions:[]});
 assert.match(c.shadowRoot.innerHTML,/repeat\(var\(--actions-columns,3\),minmax\(0,1fr\)\)/);
 assert.match(c.shadowRoot.innerHTML,/--mdc-icon-size:32px;width:32px;height:32px;color:var\(--secondary-text-color\)/);
 const s=card('controls');s.setConfig({entities:[]});assert.doesNotMatch(s.shadowRoot.innerHTML,/--actions-columns/);
});
