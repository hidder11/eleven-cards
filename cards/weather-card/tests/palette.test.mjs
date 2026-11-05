import test from 'node:test';
import assert from 'node:assert/strict';
import {weatherStyles,weatherCalmStyles} from '../src/weather-styles.js';
import {weatherArt} from '../src/weather-art.js';

test('fresh semantic icon palette has distinct sunshine, rain, violet and icy roles',()=>{
 for(const [selector,color] of [
  ['.content[data-kind=sun],.content[data-kind=partly]','#f3b51b'],
  ['.content[data-dark=true]:is([data-kind=sun],[data-kind=partly])','#ffd45c'],
  ['.content[data-kind=rain]','#269ad5'],['.content[data-dark=true][data-kind=rain]','#76cafa'],
  ['.content[data-kind=night],.content[data-kind=storm]','#8873dc'],
  ['.content[data-dark=true]:is([data-kind=night],[data-kind=storm])','#b8a7ff'],
  ['.content[data-kind=snow]','#32a9bb'],['.content[data-dark=true][data-kind=snow]','#8bdeec'],
 ])assert.ok(weatherStyles.includes(selector+'{--weather-icon-tone:'+color+'}'),selector);
 assert.doesNotMatch(weatherStyles,/#946800|#f2c451/);
});

test('small forecast text and title use text roles, not bright semantic icon paint',()=>{
 assert.match(weatherStyles,/--weather-text-tone:var\(--secondary-text-color,#666\)/);
 assert.match(weatherStyles,/\.rain-chance\{color:var\(--weather-text-tone\)\}/);
 assert.match(weatherStyles,/h2\{[^}]*color:var\(--primary-text-color,#20252b\)/);
 assert.doesNotMatch(weatherStyles,/h2\{[^}]*weather-icon-tone|\.rain-chance\{[^}]*weather-icon-tone/);
 assert.match(weatherCalmStyles,/\[data-ui-metric\]\{background:var\(--secondary-background-color,transparent\)\}/);
});

test('palette leaves classic illustration and alternative icon-family paint intact',()=>{
 for(const kind of ['sun','partly','rain','night','snow']){
  const classic=weatherArt(kind);assert.doesNotMatch(classic,/wx-corona|radialGradient/);
  for(const color of ['#fff0b4','#f6ce6d','#eda743'])assert.ok(classic.includes(color));
  for(const style of ['glass','neon'])assert.match(weatherArt(kind,style),new RegExp('data-style="'+style+'"|wxi-'));
 }
});
