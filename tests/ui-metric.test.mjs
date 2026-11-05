import test from 'node:test';
import assert from 'node:assert/strict';
import {uiMetric} from '../shared/ui-metric.js';

test('action surfaces use a native button and preserve entity attributes',()=>{
 const markup=uiMetric({title:'Range',value:0,unit:'km',action:true,attrs:{'data-entity':'sensor.range'}});
 assert.ok(markup.startsWith('<button'));
 assert.ok(markup.includes('type="button"'));
 assert.ok(markup.includes('data-entity="sensor.range"'));
 assert.ok(markup.trim().endsWith('</button>'));
 assert.ok(!markup.includes('data-unavailable="true"'));
});

test('caller-owned content preserves existing sensor controls',()=>{
 const markup=uiMetric({title:'Power',valueContent:'<button data-entity="sensor.power">3</button>',infoContent:'<button data-entity="sensor.current">10 A</button>'});
 assert.ok(markup.startsWith('<div'));
 assert.ok(markup.includes('data-entity="sensor.power"'));
 assert.ok(markup.includes('data-entity="sensor.current"'));
 assert.ok(markup.includes('class="ui-metric-info"'));
});

test('metric escapes sensor labels, values, units, info and HA icon attributes',()=>{
 const markup=uiMetric({icon:'mdi:sun" onload="bad',title:'<img src=x>',value:'<script>',unit:'"kW',info:'A & B',attrs:{'data-id':'"unsafe'}});
 assert.ok(!markup.includes('<img'));
 assert.ok(!markup.includes('<script>'));
 assert.ok(markup.includes('&lt;script&gt;'));
 assert.ok(markup.includes('A &amp; B'));
 assert.ok(markup.includes('icon="mdi:sun&quot; onload=&quot;bad"'));
 assert.ok(markup.includes('data-id="&quot;unsafe"'));
 assert.throws(()=>uiMetric({attrs:{onclick:'bad'}}),/Invalid UI attribute/);
});
test('zero is an available measurement; unknown values omit the unit',()=>{
 const zero=uiMetric({title:'Power',value:0,unit:'kW'});
 assert.ok(zero.includes('data-unavailable="false"'));
 assert.match(zero,/>0\s*<span/);
 for(const value of [null,undefined,'']){
  const missing=uiMetric({value,unit:'kW'});
  assert.ok(missing.includes('data-unavailable="true"'));
  assert.ok(missing.includes('>—</div>'));
  assert.ok(!missing.includes('ui-metric-unit'));
 }
});
test('optional icon and information remain optional without adding interactive semantics',()=>{
 const plain=uiMetric({value:'Laden',info:null});
 assert.ok(!plain.includes('ui-metric-icon'));
 assert.ok(!plain.includes('ui-metric-info'));
 assert.ok(!plain.includes('tabindex'));
 assert.ok(!plain.includes('button'));
 const trusted=uiMetric({iconContent:'<svg><path/></svg>',info:'Ready',compact:true});
 assert.ok(trusted.includes('<svg><path/></svg>'));
 assert.ok(trusted.includes('data-density="compact"'));
});
