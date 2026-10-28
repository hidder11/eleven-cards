import test from 'node:test';
import assert from 'node:assert/strict';
import {uiDetailSurface,uiDetailSurfaceStyles} from '../shared/ui-detail-surface.js';

test('detail surface escapes every caller string and attribute',()=>{
 const html=uiDetailSurface({title:'<img onerror="x">',attrs:{'data-id':'"<x>'},metrics:[{label:'<label>',value:'<value>',unit:'<unit>',hint:'<script>bad()</script>'}]});
 assert.ok(!html.includes('<img'));
 assert.ok(!html.includes('onclick='));
 assert.ok(html.includes('&lt;label&gt;'));
 assert.ok(html.includes('&lt;value&gt; &lt;unit&gt;'));
 assert.ok(html.includes('&lt;script&gt;bad()&lt;/script&gt;'));assert.ok(!html.includes('<script>'));
 assert.ok(html.includes('&quot;&lt;x&gt;'));
 assert.throws(()=>uiDetailSurface({attrs:{onclick:'evil()'}}),/Invalid UI attribute/);
});
test('zero stays visible, missing readings omit their unit',()=>{
 const html=uiDetailSurface({metrics:[{label:'Zero',value:0,unit:'kWh'},{label:'Unknown',value:null,unit:'kWh'},{label:'Empty',value:'',unit:'%'}],percent:0});
 assert.ok(html.includes('<dd>0 kWh</dd>'));
 assert.equal((html.match(/<dd>—<\/dd>/g)||[]).length,2);
 assert.ok(html.includes('width:0%'));
});
test('visual percentages clamp to bounds; unknown values have no bar',()=>{
 assert.ok(uiDetailSurface({percent:120}).includes('width:100%'));
 assert.ok(uiDetailSurface({percent:-20}).includes('width:0%'));
 for(const percent of [null,undefined,NaN,Infinity,'50; color:red'])assert.ok(!uiDetailSurface({percent}).includes('ui-detail-surface-track'));
 assert.ok(uiDetailSurfaceStyles().includes('height:8px'));
});
test('optional entity makes only the title a safe native details button',()=>{
 const html=uiDetailSurface({title:'Washer <x>',entity:'sensor.washer"<>',actionLabel:'Details "Washer"',metrics:[{label:'Energy',value:0,unit:'kWh'}]});
 assert.ok(html.includes('<button type="button"'));assert.ok(html.includes('data-entity="sensor.washer&quot;&lt;&gt;"'));
 assert.ok(html.includes('aria-label="Details &quot;Washer&quot;"'));assert.ok(html.includes('Washer &lt;x&gt;'));
 assert.equal((html.match(/<button /g)||[]).length,1);
 assert.ok(!uiDetailSurface({title:'Read only'}).includes('<button'));
});
