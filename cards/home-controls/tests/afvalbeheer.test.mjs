import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCards} from './card-harness.mjs';

test('Afvalbeheer localized sensors and all-day calendar render dated pickups', () => {
 const card=loadCards().create('eleven-waste-card');
 card.setConfig({entities:['sensor.gft','sensor.invalid',{entity:'sensor.override',source:'date'},'calendar.afvalbeheer_hvc']});
 card._cache={'calendar.afvalbeheer_hvc':{events:[{summary:'Papier',start:{date:'2026-10-31'},end:{date:'2026-11-01'}}]}};
 card.hass={locale:{language:'nl'},config:{time_zone:'Europe/Amsterdam'},states:{
  'sensor.gft':{state:'Morgen, 29-10-2026',attributes:{friendly_name:'GFT',Wastecollector:'hvc',Sort_date:20261029,Days_until:1}},
  'sensor.invalid':{state:'Onjuiste datum',attributes:{Sort_date:20261131}},
  'sensor.override':{state:'2026-11-03',attributes:{Sort_date:20261030}},
  'calendar.afvalbeheer_hvc':{state:'off',attributes:{}}
 }};
 const pickups=[...card.shadowRoot.innerHTML.matchAll(/class="pickup(?: first)?" data-info="([^"]+)"[^>]*>[\s\S]*?<span class="day">(\d+)<\/span>/g)].map(m=>m.slice(1));
 assert.deepEqual(pickups,[['sensor.gft','29'],['calendar.afvalbeheer_hvc','31'],['sensor.override','03']]);
});