import test from 'node:test';
import assert from 'node:assert/strict';
import {uiPrimaryValue} from '../shared/ui-primary-value.js';

test('a subtitle can open its own sensor without nesting measurement buttons',()=>{
 const html=uiPrimaryValue({value:62,unit:'%',entity:'sensor.fuel',subtitle:'540 km actieradius',subtitleEntity:'sensor.range"evil'});
 assert.ok(html.includes('class="primary-label" data-entity="sensor.range&quot;evil"'));
 assert.ok(html.includes('>540 km actieradius</button>'));
 assert.equal((html.match(/<button /g)||[]).length,2);
 assert.ok(!html.includes('<button type="button" class="primary-label"><button'));
});

test('an entity measurement is a labelled native control with escaped attributes',()=>{
 const html=uiPrimaryValue({value:62,unit:'%',entity:'sensor.car"evil'});
 assert.ok(html.includes('data-entity="sensor.car&quot;evil"'));
 assert.ok(html.includes('aria-label="62 %"'));
 assert.ok(html.includes('<button type="button"'));
});

test('primary measurements escape sensor text, subtitle, unit and attributes',()=>{
 const html=uiPrimaryValue({value:'<script>',unit:'<kW>',subtitle:'A & B',attrs:{title:'"sensor'}});
 assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(html.includes('&lt;kW&gt;'));
 assert.ok(html.includes('A &amp; B'));
 assert.ok(!html.includes('<script>'));
 assert.ok(html.includes('title="&quot;sensor"'));
 assert.throws(()=>uiPrimaryValue({attrs:{onclick:'bad'}}),/Invalid UI attribute/);
});
test('zero remains a measurement while missing data has no unit',()=>{
 assert.ok(uiPrimaryValue({value:0,unit:'kW'}).includes('>0</span><small>kW</small>'));
 for(const value of [null,undefined,'']){
  const html=uiPrimaryValue({value,unit:'kW'});
  assert.ok(html.includes('data-unavailable="true"'));
  assert.ok(html.includes('>—</span>'));
  assert.ok(!html.includes('<small>'));
 }
});
test('subtitle and unit are optional and compact values remain informational',()=>{
 const html=uiPrimaryValue({value:'21',compact:true});
 assert.ok(!html.includes('primary-label'));
 assert.ok(!html.includes('<small>'));
 assert.ok(!html.includes('tabindex'));
 assert.ok(html.includes('data-density="compact"'));
});
