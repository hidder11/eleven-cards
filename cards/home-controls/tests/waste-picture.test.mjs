import test from 'node:test';
import assert from 'node:assert/strict';
import {wasteRows} from '../src/standalone-utils.mjs';
import {loadCards} from './card-harness.mjs';
const options={now:Date.parse('2026-10-28T12:00:00Z'),locale:'en',timeZone:'UTC'};
const source={state:'2026-10-29',attributes:{icon:'mdi:package-variant',entity_picture:'/local/afvalbeheer/papier.png'}};
test('Waste honors source entity_picture unless the row has an explicit icon',()=>{
 const row=(entry,state=source)=>wasteRows([entry],{'sensor.paper':state},{},options)[0];
 assert.equal(row('sensor.paper').picture,source.attributes.entity_picture);
 assert.equal(row({entity:'sensor.paper',icon:''}).picture,source.attributes.entity_picture);
 assert.equal(row({entity:'sensor.paper',icon:'mdi:recycle'}).picture,null);
 assert.equal(row({entity:'sensor.paper',icon:'mdi:recycle'}).icon,'mdi:recycle');
 assert.equal(row('sensor.paper',{...source,attributes:{icon:'mdi:leaf'}}).picture,null);
 assert.equal(row('sensor.paper',{...source,attributes:{icon:'mdi:leaf'}}).icon,'mdi:leaf');
 assert.equal(row('sensor.paper',{...source,attributes:{}}).icon,'mdi:trash-can-outline');
 assert.equal(row('sensor.paper',{...source,attributes:{entity_picture:{not:'a URL'}}}).picture,null);
});
test('built Waste escapes source picture URL and preserves explicit row icon',()=>{
 const {create}=loadCards(),card=create('eleven-waste-card');
 card.setConfig({entities:['sensor.paper',{entity:'sensor.override',icon:'mdi:recycle'}]});
 card.hass={states:{'sensor.paper':{...source,attributes:{...source.attributes,entity_picture:'/paper.png?a="x"&b=1'}},'sensor.override':source}};
 assert.match(card.shadowRoot.innerHTML,/<img src="\/paper.png\?a=&quot;x&quot;&amp;b=1" alt="" data-fallback="mdi:package-variant">/);
 assert.equal((card.shadowRoot.innerHTML.match(/<img /g)||[]).length,1);
 assert.match(card.shadowRoot.innerHTML,/<ha-icon icon="mdi:recycle"/);
});
