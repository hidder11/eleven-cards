import {test} from 'node:test';import assert from 'node:assert/strict';
globalThis.HTMLElement=class{attachShadow(){this.shadowRoot={innerHTML:'',querySelector:()=>null,querySelectorAll:()=>[]};}dispatchEvent(e){this.event=e;}};
globalThis.window={customCards:[]};globalThis.customElements={get:()=>true};
const {OverviewCard,OverviewEditor}=await import('../src/overview-card.js');
const states={'sensor.a':{state:'12',attributes:{friendly_name:'Power',unit_of_measurement:'W'}}};
test('unrelated Home Assistant updates leave the rendered overview in place',()=>{
 const c=new OverviewCard();c.setConfig({entities:['sensor.a']});let renders=0;c._render=()=>renders++;
 c.hass={states,language:'en'};assert.equal(renders,1);
 c.hass={states:{...states,'sensor.unrelated':{state:'changed'}} ,language:'en'};assert.equal(renders,1);
 c.hass={states:{...states,'sensor.a':{...states['sensor.a'],state:'13'}},language:'en'};assert.equal(renders,2);
});
test('live current values remain visible when history fails; retry requests again',async()=>{
 const c=new OverviewCard();c.setConfig({entities:['sensor.a']});let calls=0;c.hass={states,callApi:async()=>{calls++;throw Error('offline');}};c.connectedCallback();await c._refresh();
 assert.match(c.shadowRoot.innerHTML,/>12</);assert.match(c.shadowRoot.innerHTML,/retry/);assert.equal(c._status,'error');await c._refresh();assert.equal(calls,2);c.disconnectedCallback();assert.equal(c._timer,null);
});
test('batched history, no requests on ordinary hass updates, and detached responses ignored',async()=>{
 let resolve,calls=0;const c=new OverviewCard();c.setConfig({entities:['sensor.a']});c.hass={states,callApi:()=>{calls++;return new Promise(r=>resolve=r);}};c.connectedCallback();assert.equal(calls,1);
 c.hass={...c.hass,states:{...states,'sensor.a':{...states['sensor.a'],state:'0'}}};assert.equal(calls,1);assert.match(c.shadowRoot.innerHTML,/>0</);c.disconnectedCallback();resolve([]);await Promise.resolve();assert.notEqual(c._status,'ready');
});
test('absolute percentage deltas are labeled percentage points, not relative percent',()=>{
 const c=new OverviewCard();c.setConfig({entities:['sensor.a']});c.hass={states:{'sensor.a':{state:'54',attributes:{unit_of_measurement:'%'}}}};c._status='ready';c._units={'sensor.a':'%'};c._history={'sensor.a':{points:[],baseline:50}};c._render();assert.match(c.shadowRoot.innerHTML,/\+4 pp</);
});
test('numeric formatting never rounds a finite nonzero reading to zero',()=>{
 const c=new OverviewCard();c.hass={language:'en',states:{}};assert.notEqual(c._format(0.00004),'0');assert.notEqual(c._format(-0.00004),'-0');
});
test('a hung history request times out and remains retryable',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const c=new OverviewCard();c.setConfig({entities:['sensor.a']});c.hass={states,callApi:()=>new Promise(()=>{})};c.connectedCallback();const pending=c._refresh();t.mock.timers.tick(15001);await pending;assert.equal(c._status,'error');assert.equal(c._promise,null);c.disconnectedCallback();
});
test('picker, stub and editor global/per-sensor ownership contract',()=>{
 assert.equal(OverviewCard.getGridOptions?.(),undefined);assert.ok(new OverviewCard().getGridOptions().rows>=2);
 const cfg=OverviewCard.getStubConfig({states});assert.equal(cfg.entities[0],'sensor.a');assert.equal(cfg.title,'Eleven Overview');
 const editor=new OverviewEditor();editor.setConfig(Object.freeze({entities:Object.freeze(['sensor.a'])}));assert.equal(editor._config.entities[0].entity,'sensor.a');
 assert.equal(OverviewCard.getConfigForm().schema.filter(s=>s.name==='entities').length,0);
 assert.deepEqual(OverviewCard.getSensorForm().schema.map(s=>s.name),['entity','name','color']);
});

test('global section controls affect layout estimates without creating sensor overrides',()=>{
 const schema=OverviewCard.getConfigForm().schema;
 assert.deepEqual(schema.find(s=>s.name==='section_size').selector.select.options.map(o=>o.value),['compact','standard','spacious']);
 assert.deepEqual(schema.find(s=>s.name==='graph_height').selector.number,{min:24,max:160,step:1,mode:'box'});
 const c=new OverviewCard();c.setConfig({entities:['sensor.a','sensor.b'],section_size:'compact'});const compact=c.getCardSize();
 c.setConfig({entities:['sensor.a','sensor.b'],section_size:'spacious'});assert.ok(c.getCardSize()>compact);
 c.setConfig({entities:['sensor.a','sensor.b'],section_size:'compact',graph_height:160});assert.ok(c.getCardSize()>compact);
 assert.match(c.shadowRoot.innerHTML,/height:160px/);
});

test('compact headings and change rows preserve optional content without changing standard structure',()=>{
 const c=new OverviewCard();
 c.setConfig({entities:['sensor.a'],section_size:'compact',graph_height:80});c.hass={states,language:'en'};
 assert.match(c.shadowRoot.innerHTML,/<span class="compact-heading"><span class="label">/);
 assert.match(c.shadowRoot.innerHTML,/<span class="compact-change"><span class="delta">/);
 assert.match(c.shadowRoot.innerHTML,/height:80px/);
 c.setConfig({entities:['sensor.a'],section_size:'compact',show_graph:false,show_delta:false});
 assert.ok(!c.shadowRoot.innerHTML.includes('class="spark"'));assert.ok(!c.shadowRoot.innerHTML.includes('class="compact-change"'));
 c.setConfig({entities:['sensor.a'],section_size:'standard'});
 assert.ok(!c.shadowRoot.innerHTML.includes('class="compact-heading"'));assert.ok(!c.shadowRoot.innerHTML.includes('class="compact-change"'));
});

test('32 sensors render safely and share one history request with per-sensor comparisons',async()=>{
 const entities=Array.from({length:32},(_,i)=>'sensor.many_'+i),now=Date.now(),start=new Date(now-25*3600000).toISOString();
 const manyStates=Object.fromEntries(entities.map((id,i)=>[id,{state:String(i+10),attributes:{friendly_name:'Sensor '+i,unit_of_measurement:'W'}}]));
 const c=new OverviewCard();let calls=0;
 c.setConfig({entities,section_size:'compact'});c.hass={states:manyStates,language:'en',callApi:async(_,url)=>{
  calls++;assert.deepEqual(new URL(url,'http://fixture').searchParams.get('filter_entity_id').split(','),entities);
  return entities.map((id,i)=>[{entity_id:id,state:String(i),last_changed:start,attributes:{unit_of_measurement:'W'}}]);
 }};
 try{c.connectedCallback();await c._refresh();assert.equal(calls,1);assert.equal(c._status,'ready');assert.equal(Object.keys(c._history).length,32);
  assert.equal((c.shadowRoot.innerHTML.match(/class="metric"/g)||[]).length,32);
  assert.equal((c.shadowRoot.innerHTML.match(/class="delta">\+10 W</g)||[]).length,32);
  assert.ok(!c.shadowRoot.innerHTML.includes('--series-color:undefined'));
 }finally{c.disconnectedCallback();}
});
