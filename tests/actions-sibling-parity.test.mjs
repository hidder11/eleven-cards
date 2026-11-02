import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Compare the combined bundle's non-target renderers to actual dirty task-entry bytes.
const entry=readFileSync(new URL('./fixtures/actions-before-material-refinement.js',import.meta.url),'utf8');
const current=readFileSync(new URL('../cards/home-controls/dist/eleven-home-controls-card.js',import.meta.url),'utf8');
function load(code){
 const elements=new Map();
 class Element{attachShadow(){return this.shadowRoot={innerHTML:'',activeElement:null,querySelectorAll:()=>[],querySelector:()=>null};}dispatchEvent(){return true;}}
 class FixedDate extends Date{constructor(...args){super(...(args.length?args:['2026-11-01T12:00:00Z']));}static now(){return Date.parse('2026-11-01T12:00:00Z');}}
 const context=vm.createContext({HTMLElement:Element,structuredClone,Date:FixedDate,CustomEvent:class{},customElements:{get:t=>elements.get(t),define:(t,c)=>elements.set(t,c)},document:{createElement:()=>new Element()},window:{},setInterval:()=>1,clearInterval:()=>{}});
 vm.runInContext(code,context);return tag=>new (elements.get(tag))();
}
for(const language of ['nl','en'])for(const unavailable of [false,true])test(`Controls/Waste task-entry HTML parity: ${language}, unavailable=${unavailable}`,()=>{
 const before=load(entry),after=load(current);
 const hass={locale:{language},config:{time_zone:'UTC',unit_system:{temperature:'°C'}},states:{
  'light.living':{state:unavailable?'unavailable':'on',attributes:{friendly_name:'Woonkamer',brightness:180,supported_color_modes:['brightness']}},
  'climate.room':{state:unavailable?'unavailable':'heat',attributes:{friendly_name:'Thermostaat',current_temperature:20.8,temperature:20,target_temp_step:.5,min_temp:10,max_temp:30,supported_features:1}},
  'sensor.waste':{state:unavailable?'unavailable':'2026-11-03',attributes:{friendly_name:'Papier'}}}};
 for(const [tag,config] of [['eleven-controls-card',{entities:['light.living','climate.room']}],['eleven-waste-card',{entities:[{entity:'sensor.waste',source:'date'}]}]]){
  const a=before(tag),b=after(tag);for(const c of [a,b]){c.setConfig(config);c.hass=hass;}
  assert.equal(b.shadowRoot.innerHTML,a.shadowRoot.innerHTML,tag);
 }
});

test('Actions keeps exact scene/script dispatch and explicit disabled semantics',async()=>{
 const create=load(current),c=create('eleven-actions-card'),calls=[];
 c.setConfig({actions:['scene.evening','script.goodnight','scene.missing']});
 c.hass={locale:{language:'nl'},states:{'scene.evening':{state:'scening',attributes:{}},'script.goodnight':{state:'off',attributes:{}}},callService:async(...args)=>calls.push(JSON.parse(JSON.stringify(args)))};
 await c.activate(0,'run');await c.activate(1,'run');await c.activate(2,'run');
 assert.deepEqual(calls,[['scene','turn_on',{entity_id:'scene.evening'}],['script','turn_on',{entity_id:'script.goodnight'}]]);
 assert.match(c.shadowRoot.innerHTML,/aria-label="scene.missing" disabled/);
 assert.match(c.shadowRoot.innerHTML,/Niet beschikbaar/);
});
