import test from 'node:test';
import assert from 'node:assert/strict';
import {controlsPresentationStyles,controlItemState,controlItemIcon} from '../src/controls-presentation.js';
import {loadCards} from './card-harness.mjs';

test('Controls retains shared actions and a fixed setpoint between minus and plus',()=>{
 const {create}=loadCards(),card=create('eleven-controls-card');
 card.setConfig({entities:['climate.room','light.room']});
 const hass={locale:{language:'nl'},config:{unit_system:{temperature:'°C'}},states:{'climate.room':{state:'heat',attributes:{supported_features:1,temperature:19.5,current_temperature:18}},'light.room':{state:'on',attributes:{brightness:128,supported_color_modes:['brightness']}}}};
 for(const value of [19.5,11]){
  hass.states['climate.room'].attributes.temperature=value;card.hass={...hass};
  const html=card.shadowRoot.innerHTML;
  assert.match(html,/data-action="down"[\s\S]+class="target"[^>]*>[^<]+ °C<\/span>[\s\S]+data-action="up"/);
  assert.doesNotMatch(html,/<small>ingesteld/);
  assert.match(html,/data-ui-button="action-icon"[^>]+data-action="toggle"/);
  assert.match(html,/aria-label="[^"\n]+Uitschakelen"/);
  assert.match(html,/data-key="1-level"/);
 }
 assert.match(controlsPresentationStyles,/flex:0 0 64px;width:64px;min-width:64px;max-width:64px/);
 assert.match(controlsPresentationStyles,/font-variant-numeric:tabular-nums/);
 assert.doesNotMatch(controlsPresentationStyles,/\[data-ui-button[^}]+background:/);
});

test('Controls uses individual row heights and accessible native sliders',()=>{
 assert.match(controlsPresentationStyles,/grid-auto-rows:auto/);
 assert.match(controlsPresentationStyles,/min-height:54px/);
 assert.match(controlsPresentationStyles,/min-width:44px/);
 assert.match(controlsPresentationStyles,/@container\(max-width:279px\)/);
 assert.match(controlsPresentationStyles,/runnable-track\{height:8px/);
 assert.match(controlsPresentationStyles,/outline:2px solid var\(--accent-color/);
});

test('Icons distinguish confirmed state, thermostat activity and unavailable readings',()=>{
 for(const [domain,state,expected]of [
  ['light',{state:'on'},'active'],['fan',{state:'off'},'idle'],['switch',{state:'unavailable'},'unavailable'],
  ['cover',{state:'opening'},'moving'],['cover',{state:'closed'},'idle'],
  ['climate',{state:'heat',attributes:{hvac_action:'idle'}},'idle'],
  ['climate',{state:'heat',attributes:{hvac_action:'heating'}},'heating'],
  ['climate',{state:'cool',attributes:{hvac_action:'cooling'}},'cooling']
 ])assert.equal(controlItemState(domain,state),expected);
 assert.equal(controlItemState('light',undefined),'unavailable');
 for(const domain of ['light','fan','cover','input_boolean'])assert.notEqual(controlItemIcon(domain,{state:'on'},'active'),controlItemIcon(domain,{state:'closed'},'idle'));
 assert.match(controlItemIcon('light',{state:'unavailable'},'unavailable'),/M3 21 21 3/);
});

test('Custom icons remain escaped and retain their state surface',()=>{
 const html=controlItemIcon('light',{state:'on'},'active','mdi:test" onload="bad');
 assert.match(html,/class="item-state-icon"/);
 assert.match(html,/icon="mdi:test&quot; onload=&quot;bad"/);
 assert.doesNotMatch(html,/ icon="[^"]*" onload=/);
});

test('Unavailable controls keep details accessible without fabricated zero readings',()=>{
 const {create}=loadCards(),card=create('eleven-controls-card');
 card.setConfig({entities:['light.room']});card.hass={locale:{language:'en'},states:{'light.room':{state:'unavailable',attributes:{}}}};
 assert.match(card.shadowRoot.innerHTML,/data-item-state="unavailable"/);
 assert.match(card.shadowRoot.innerHTML,/data-info="light.room"/);
 assert.match(card.shadowRoot.innerHTML,/Unavailable/);
 assert.doesNotMatch(card.shadowRoot.innerHTML,/<output>0%/);
 assert.match(card.shadowRoot.innerHTML,/disabled/);
});
