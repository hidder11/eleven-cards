import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const current=readFileSync(new URL('../cards/home-controls/dist/eleven-home-controls-card.js',import.meta.url),'utf8');
// Captured dirty entry, versionable so clean-checkout tests are reproducible.
const entry=readFileSync(new URL('./fixtures/control-pad-before-name.js',import.meta.url),'utf8');
function load(code=current){
 const elements=new Map();
 class Element{
  attachShadow(){return this.shadowRoot={innerHTML:'',activeElement:null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}};}
  dispatchEvent(event){(this.events??=[]).push(event);return true;}
 }
 class FixedDate extends Date{constructor(...args){super(...(args.length?args:['2026-11-04T12:00:00Z']));}static now(){return Date.parse('2026-11-04T12:00:00Z');}}
 const context=vm.createContext({HTMLElement:Element,structuredClone,Date:FixedDate,
  CustomEvent:class{constructor(type,options){this.type=type;Object.assign(this,options);}},
  customElements:{get:tag=>elements.get(tag),define:(tag,cls)=>elements.set(tag,cls)},
  document:{createElement:tag=>new (elements.get(tag)||Element)()},window:{},setInterval:()=>1,clearInterval(){}});
 vm.runInContext(code,context);
 return {elements,context,create:tag=>new (elements.get(tag))()};
}
for(const language of ['nl','en'])test(`Control Pad default heading in ${language}`,()=>{
 const c=load().create('eleven-actions-card');c.setConfig({type:'custom:eleven-actions-card',actions:[]});c.hass={locale:{language},states:{}};
 assert.match(c.shadowRoot.innerHTML,/<h2>Control Pad<\/h2>/);
});
test('Control Pad stub keeps existing type and actions configuration',()=>{
 const {elements}=load();const stub=elements.get('eleven-actions-card').getStubConfig();
 assert.deepEqual(JSON.parse(JSON.stringify(stub)),{type:'custom:eleven-actions-card',title:'Control Pad',confirmation:false,actions:[]});
});
test('picker displays Eleven Control Pad without any new registration or alias',()=>{
 const {elements,context}=load();const registry=context.window.customCards;
 assert.deepEqual([...elements.keys()].sort(),['eleven-actions-card','eleven-controls-card','eleven-controls-editor','eleven-waste-card']);
 assert.deepEqual(Array.from(registry,c=>c.type).sort(),['eleven-actions-card','eleven-controls-card','eleven-waste-card']);
 const meta=registry.find(c=>c.type==='eleven-actions-card');
 assert.equal(meta.name,'Eleven Control Pad');assert.equal(meta.description,'Scenes and scripts at your fingertips');assert.equal(meta.preview,true);
});
test('all explicit titles, including legacy labels and empty title, remain unchanged in NL/EN',()=>{
 for(const language of ['nl','en'])for(const title of ['Scenes & actions','Scènes en acties','My own pad','']){
  const c=load().create('eleven-actions-card');c.setConfig({type:'custom:eleven-actions-card',title,actions:[]});c.hass={locale:{language},states:{}};
  assert.equal(c._config.title,title);
  const expected=title.replaceAll('&','&amp;');
  if(title)assert.ok(c.shadowRoot.innerHTML.includes(`<h2>${expected}</h2>`));else assert.doesNotMatch(c.shadowRoot.innerHTML,/<h2>/);
 }
});
test('Actions editor still selects and emits the original type/actions keys',()=>{
 const {create}=load();const editor=create('eleven-controls-editor');
 // Exercise config routing/emission independently of native HA form rendering.
 editor.render=()=>{};
 const config={type:'custom:eleven-actions-card',title:'Scenes & actions',actions:[{entity:'scene.reading'}],columns:3,confirmation:true};
 editor.setConfig(config);assert.equal(editor.kind,'actions');editor.emit(editor._config);
 assert.deepEqual(JSON.parse(JSON.stringify(editor.events[0].detail.config)),config);
});
// The rename snapshot predates the separately approved shared-action, Controls
// and Waste layouts. Compare routing/native-control invariants, not their paint
// or nesting. The dedicated style/sibling suites cover the new card anatomy.
function functionalControls(html){
 return [...html.matchAll(/<(button|input)\b([^>]*)>/g)].map(([,tag,attrs])=>{
  const semantic=(attrs.match(/[^\s=]+(?:="[^"]*")?/g)||[])
   .filter(a=>/^(?:type=|id=|data-(?:index|action|key|info|level)=|disabled$|min=|max=|step=|value=)/.test(a))
   // Waste gained stable focus keys with its approved calendar-strip layout.
   // Its unchanged More Info entity is the routing invariant compared here.
   .filter(a=>!(/\bdata-info=/.test(attrs)&&a.startsWith('data-key='))).sort();
  return `${tag}|${semantic.join(' ')}`;
 }).sort();
}
for(const language of ['nl','en'])for(const unavailable of [false,true])test(`Controls/Waste preserve headings and native command semantics: ${language}, unavailable=${unavailable}`,()=>{
 const before=load(entry),after=load();
 const hass={locale:{language},config:{time_zone:'UTC',unit_system:{temperature:'°C'}},states:{
  'light.room':{state:unavailable?'unavailable':'on',attributes:{friendly_name:'Room',brightness:180,supported_color_modes:['brightness']}},
  'climate.room':{state:unavailable?'unavailable':'heat',attributes:{current_temperature:20.8,temperature:20,supported_features:1,min_temp:10,max_temp:30,target_temp_step:.5}},
  'sensor.waste':{state:unavailable?'unavailable':'2026-11-06',attributes:{friendly_name:'Paper'}}}};
 for(const [tag,config] of [['eleven-controls-card',{entities:['light.room','climate.room']}],['eleven-waste-card',{entities:[{entity:'sensor.waste',source:'date'}]}]]){
  const a=before.create(tag),b=after.create(tag);for(const card of [a,b]){card.setConfig(config);card.hass=hass;}
  assert.deepEqual(functionalControls(b.shadowRoot.innerHTML),functionalControls(a.shadowRoot.innerHTML),tag);
  assert.equal(b.shadowRoot.innerHTML.match(/<h2>[^<]*<\/h2>/)?.[0],a.shadowRoot.innerHTML.match(/<h2>[^<]*<\/h2>/)?.[0],tag);
  assert.match(b.shadowRoot.innerHTML,/role="status" aria-live="polite"/);
  if(tag==='eleven-waste-card')assert.match(b.shadowRoot.innerHTML,unavailable?/data-key="unresolved-/:/data-key="pickup-/);
 }
});
test('Actions preserves configured labels and command semantics except default heading',()=>{
 for(const language of ['nl','en']){
  const before=load(entry).create('eleven-actions-card'),after=load().create('eleven-actions-card');
  for(const c of [before,after]){c.setConfig({actions:[{entity:'scene.reading',name:'Read',description:'Relax'}]});c.hass={locale:{language},states:{'scene.reading':{state:'scening',attributes:{}}}};}
  assert.deepEqual(functionalControls(after.shadowRoot.innerHTML),functionalControls(before.shadowRoot.innerHTML));
  for(const card of [before,after]){
   assert.match(card.shadowRoot.innerHTML,/aria-label="Read"/);
   assert.match(card.shadowRoot.innerHTML,/>Read<small>Relax<\/small>/);
   assert.match(card.shadowRoot.innerHTML,/role="status" aria-live="polite"/);
  }
 }
});
