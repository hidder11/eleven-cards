import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Controls' same-row layout and Waste's calendar strip intentionally change
// anatomy; preserve each native control's functional semantics, not old nesting.
const entry=readFileSync(new URL('./fixtures/actions-before-material-refinement.js',import.meta.url),'utf8');
const current=readFileSync(new URL('../cards/home-controls/dist/eleven-home-controls-card.js',import.meta.url),'utf8');
function load(code){
 const elements=new Map();
 class Element{constructor(){this.events=[];}attachShadow(){return this.shadowRoot={innerHTML:'',activeElement:null,querySelectorAll:()=>[],querySelector:()=>null};}dispatchEvent(event){this.events.push(event);return true;}}
 class FixedDate extends Date{constructor(...args){super(...(args.length?args:['2026-11-01T12:00:00Z']));}static now(){return Date.parse('2026-11-01T12:00:00Z');}}
 const context=vm.createContext({HTMLElement:Element,structuredClone,Date:FixedDate,CustomEvent:class{constructor(type,options){this.type=type;Object.assign(this,options);}},customElements:{get:t=>elements.get(t),define:(t,c)=>elements.set(t,c)},document:{createElement:()=>new Element()},window:{},setInterval:()=>1,clearInterval:()=>{}});
 vm.runInContext(code,context);return tag=>new (elements.get(tag))();
}
for(const language of ['nl','en'])for(const unavailable of [false,true])test(`Controls preserves native control semantics through same-row layout: ${language}, unavailable=${unavailable}`,()=>{
 const before=load(entry),after=load(current);
 const hass={locale:{language},config:{time_zone:'UTC',unit_system:{temperature:'°C'}},states:{
  'light.living':{state:unavailable?'unavailable':'on',attributes:{friendly_name:'Woonkamer',brightness:180,supported_color_modes:['brightness']}},
  'climate.room':{state:unavailable?'unavailable':'heat',attributes:{friendly_name:'Thermostaat',current_temperature:20.8,temperature:20,target_temp_step:.5,min_temp:10,max_temp:30,supported_features:1}},
  'sensor.waste':{state:unavailable?'unavailable':'2026-11-03',attributes:{friendly_name:'Papier'}}}};
 for(const [tag,config] of [['eleven-controls-card',{entities:['light.living','climate.room']}]]){
  const a=before(tag),b=after(tag);for(const c of [a,b]){c.setConfig(config);c.hass=hass;}
  // Preserve every functional attribute; the concurrent Controls task added
  // the target unit explicitly. Assert it before normalizing that text delta.
  if(!unavailable)assert.match(b.shadowRoot.innerHTML,/<span class="target"[^>]*>20 °C<\/span>/);
  const semanticControls=html=>[...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g),...html.matchAll(/<input\b([^>]*)>/g)].map(m=>{
   let attrs=m[1].replace(/\sdata-ui-button="action(?:-icon)?"/g,'').replace(/\sdata-ui-slider=""/g,'').replace(/\sstyle="--ui-bar-position:[^"]*"/g,'');
   const visualChange=/class="identity"|data-action="toggle"/.test(attrs);
   if(visualChange)attrs=attrs.replace(/\s(?:title|aria-label)="[^"]*"/g,'');
   if(/data-action="toggle"/.test(attrs))attrs=attrs.replace(/\sclass="[^"]*"/g,'');
   return (attrs.match(/[^\s=]+(?:="[^"]*")?/g)||[]).sort().join(' ')+'|'+(visualChange?'':m[2]||'');
  }).sort();
  assert.deepEqual(semanticControls(b.shadowRoot.innerHTML),semanticControls(a.shadowRoot.innerHTML),tag);
 }
});

for(const language of ['nl','en'])for(const unavailable of [false,true])test(`Waste preserves source/info/state semantics through approved strip redesign: ${language}, unavailable=${unavailable}`,()=>{
 const before=load(entry),after=load(current),config={entities:[{entity:'sensor.waste',source:'date'}]};
 const hass={locale:{language},config:{time_zone:'UTC'},states:{'sensor.waste':{state:unavailable?'unavailable':'2026-11-03',attributes:{friendly_name:'Papier'}}}};
 const cards=[before('eleven-waste-card'),after('eleven-waste-card')];
 for(const card of cards){card.setConfig(config);card.hass=hass;}
 const targets=card=>[...card.shadowRoot.innerHTML.matchAll(/data-info="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(targets(cards[1]),targets(cards[0]));
 assert.deepEqual(targets(cards[1]),['sensor.waste']);
 const expected=unavailable?(language==='nl'?'Niet beschikbaar':'Unavailable'):(language==='nl'?'Over 2 dagen':'In 2 days');
 for(const card of cards){
  assert.ok(card.shadowRoot.innerHTML.includes(expected));
  assert.match(card.shadowRoot.innerHTML,/Papier/);
  card.more('sensor.waste');
  assert.equal(card.events.at(-1).type,'hass-more-info');
  assert.equal(card.events.at(-1).detail.entityId,'sensor.waste');
  assert.equal(card.events.at(-1).bubbles,true);
  assert.equal(card.events.at(-1).composed,true);
 }
 if(unavailable){
  assert.doesNotMatch(cards[1].shadowRoot.innerHTML,/<section class="waste-strip"/);
  assert.match(cards[1].shadowRoot.innerHTML,/class="unresolved"/);
 }else{
  assert.match(cards[1].shadowRoot.innerHTML,/<section class="waste-strip"/);
  assert.match(cards[1].shadowRoot.innerHTML,/<span class="day">03<\/span>/);
  assert.match(cards[1].shadowRoot.innerHTML,language==='nl'?/november/:/November/);
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
