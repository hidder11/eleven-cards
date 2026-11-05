import test from 'node:test';
import assert from 'node:assert/strict';
import {energyFlowIcon} from '../src/energy-flow-icons.js';
const names={sun:'weather-sunny',home:'home',grid:'transmission-tower',solar:'solar-power-variant',import:'home-import-outline',export:'home-export-outline'};
test('six energy meanings use native Home Assistant icons rather than custom strokes',()=>{
 for(const [kind,name]of Object.entries(names)){
  const html=energyFlowIcon(kind);
  assert.ok(html.startsWith('<ha-icon '),kind);
  assert.ok(html.includes(`icon="mdi:${name}"`),kind);
  assert.ok(html.includes(`data-energy-icon="${kind}"`));
  assert.ok(html.includes('aria-hidden="true"'));
  assert.ok(!html.includes('<path'));
 }
});
test('unknown icon kinds fall back to the house without interpolating user markup',()=>{
 const html=energyFlowIcon('" onload="alert(1)');
 assert.ok(html.includes('icon="mdi:home"'));
 assert.ok(!html.includes('onload'));
});
