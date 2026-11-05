import test from 'node:test';
import assert from 'node:assert/strict';
import {weatherArt} from '../src/weather-art.js';
import {weatherStyles,weatherCalmStyles} from '../src/weather-styles.js';

test('classic weather art keeps sun/rays semantic paint without decorative corona',()=>{
 for(const kind of ['sun','partly']){
  const art=weatherArt(kind);
  assert.doesNotMatch(art,/wx-corona|radialGradient/);
  assert.match(art,/class="wx-sun"/);
  assert.match(art,/class="wx-rays" stroke="#f8cd70"/);
  for(const color of ['#fff0b4','#f6ce6d','#eda743'])assert.ok(art.includes(color));
 }
 assert.match(weatherArt('rain'),/stroke="#8dcfff"/);
 assert.match(weatherArt('night'),/stop-color="#9aadee"/);
});

test('normal and compact illustration do not cast broad condition-colored shadows',()=>{
 assert.match(weatherStyles,/\.art svg\{[^}]*filter:none/);
 assert.doesNotMatch(weatherStyles,/drop-shadow\([^}]*var\(--tone\)/);
 assert.doesNotMatch(weatherStyles,/wx-corona|wx-glow/);
 assert.match(weatherCalmStyles,/\[data-ui-metric\]\{background:var\(--secondary-background-color,transparent\)\}/);
});
