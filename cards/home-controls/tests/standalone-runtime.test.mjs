import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCards} from './card-harness.mjs';

// Exercise the rebuilt, flattened module: source-only utility tests cannot detect missing shared helpers.
test('Actions and Controls still render and send exact requests without the legacy card',async()=>{
 const {create,elements}=loadCards(),calls=[];
 assert.equal(elements.has('eleven-home-controls-card'),false);
 const hass={locale:{language:'en'},config:{unit_system:{temperature:'°C'}},states:{
  'scene.reading':{state:'scening',attributes:{}},
  'climate.room':{state:'heat',attributes:{temperature:19,current_temperature:18.5,target_temp_step:0.5,min_temp:4,max_temp:30,supported_features:1}},
  'cover.room':{state:'open',attributes:{supported_features:11,current_position:50}}
 },callService:async(domain,service,data)=>{calls.push([domain,service,JSON.parse(JSON.stringify(data))]);}};
 const actions=create('eleven-actions-card');
 actions.setConfig({actions:[{entity:'scene.reading',name:'Read & relax'}],confirmation:false});actions.hass=hass;
 assert.match(actions.shadowRoot.innerHTML,/Read &amp; relax/);
 await actions.activate(0,'run');
 const controls=create('eleven-controls-card');
 controls.setConfig({entities:['climate.room',{entity:'cover.room',name:'Curtain'}],confirmation:false});controls.hass=hass;
 assert.match(controls.shadowRoot.innerHTML,/18\.5 °C/);
 assert.match(controls.shadowRoot.innerHTML,/50%/);
 await controls.activate(0,'up');await controls.activate(1,'close');
 assert.deepEqual(calls,[
  ['scene','turn_on',{entity_id:'scene.reading'}],
  ['climate','set_temperature',{entity_id:'climate.room',temperature:19.5}],
  ['cover','close_cover',{entity_id:'cover.room'}]
 ]);
 assert.match(controls.shadowRoot.innerHTML,/Command sent/);
 controls.hass={...hass,callService:async()=>{throw Error('offline');}};
 await controls.activate(1,'open');assert.match(controls.shadowRoot.innerHTML,/Not executed: offline/);
 controls.more('cover.room');
 assert.equal(controls.events[0].type,'hass-more-info');assert.equal(controls.events[0].detail.entityId,'cover.room');
});

test('Waste still renders daysTo sources and read-only calendar events in the standalone bundle',async()=>{
 const {create}=loadCards(),requests=[];const card=create('eleven-waste-card');
 card.setConfig({entities:['sensor.paper',{entity:'calendar.waste',filter:'organic'}]});
 card.hass={locale:{language:'en'},config:{time_zone:'UTC'},states:{
  'sensor.paper':{state:'localized prose',last_updated:'2026-10-28T08:00:00Z',attributes:{daysTo:1,friendly_name:'Paper'}},
  'calendar.waste':{state:'off',attributes:{}}
 },callApi:async(method,path)=>{
  requests.push([method,path]);return [{summary:'Organic',start:{date:'2026-10-29'}}];
 },callService:()=>{throw Error('Waste must never send a device command');}};
 assert.match(card.shadowRoot.innerHTML,/Tomorrow/);assert.match(card.shadowRoot.innerHTML,/Paper/);
 card.isConnected=true;card.connectedCallback();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(requests.length,1);assert.equal(requests[0][0],'GET');assert.match(requests[0][1],/^calendars\/calendar\.waste\?start=/);
 assert.match(card.shadowRoot.innerHTML,/Organic/);assert.match(card.shadowRoot.innerHTML,/Paper/);
 assert.match(card.shadowRoot.innerHTML,/Next collection/);
 card.disconnectedCallback();
});
