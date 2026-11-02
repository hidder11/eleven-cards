import test from 'node:test';
import assert from 'node:assert/strict';
import {evccCardStyles} from '../cards/car-card/src/evcc/evcc-styles.js';
import {powerMotion} from '../cards/car-card/src/evcc/evcc-gallery.js';
test('EVCC uses a solid breathing accent, never stripes or a traveling sweep',()=>{
 const css=evccCardStyles();
 const rule=css.match(/\.content\[data-evcc\]\[data-battery-style\] \.battery-fill::before\{([^}]+)\}/)?.[1];
 assert.ok(rule);
 for(const value of ['width:100%','filter:none','transform:none','box-shadow:none','content:none','animation:none','background:var(--primary-text-color)'])assert.ok(rule.includes(value),value);
 assert.doesNotMatch(rule,/gradient|#fff|blur|drop-shadow/);
 assert.match(css,/@keyframes evcc-accent-breathe\{0%,100%\{opacity:0\}50%\{opacity:var\(--evcc-breathe-peak,\.26\)\}\}/);
 assert.match(css,/\.content\[data-evcc\]\[data-theme=dark\]\[data-battery-style\] \.battery-fill::before\{background:var\(--secondary-background-color\);--evcc-breathe-peak:\.42\}/);
 assert.match(css,/animation:evcc-accent-breathe 2\.4s ease-in-out infinite/);
 assert.deepEqual(powerMotion({state:'7100',attributes:{unit_of_measurement:'W'}}),{kw:7.1,seconds:12-10*7.1/11,moving:true});
 for(const state of ['0','unavailable','unknown'])assert.equal(powerMotion({state,attributes:{unit_of_measurement:'W'}}).moving,false);
});
