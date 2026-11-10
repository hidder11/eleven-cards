import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function setup(config={}){
 const registry=new Map();
 const context=vm.createContext({HTMLElement:class{attachShadow(){this.shadowRoot={innerHTML:'',querySelector:()=>null,querySelectorAll:()=>[]};}},window:new EventTarget(),customElements:{get:n=>registry.get(n),define:(n,c)=>registry.set(n,c)},setTimeout,clearTimeout,queueMicrotask,URLSearchParams,Date,Intl});
 vm.runInContext(readFileSync(new URL('../cards/timeline-card/dist/eleven-timeline-card.js',import.meta.url),'utf8'),context);
 const Card=registry.get('eleven-timeline-card'),card=new Card();
 card.setConfig({entities:['switch.a','switch.b','switch.c'],series_options:[{entity:'switch.a',group:'Verwarming'},{entity:'switch.b',group:'Verwarming'},{entity:'switch.c',group:'Ventilatie'}],...config});
 card._start=0;card._end=120000;card._status='ready';card._series=card._config.entities.map(()=>[{start:0,end:60000,state:'on'},{start:60000,end:120000,state:'off'}]);card._render();
 return {Card,card};
}

test('group configuration round-trips through the editor and rejects invalid groups',()=>{
 const {Card}=setup(),config={entities:['switch.a'],series_options:[{entity:'switch.a',name:'Naam',group:'Warmtepomp'},{entity:'switch.other',group:'Bewaard'}]};
 const saved=Card.cardConfig(Card.editorConfig(config));
 assert.equal(saved.series_options.find(r=>r.entity==='switch.a').group,'Warmtepomp');
 assert.equal(saved.series_options.find(r=>r.entity==='switch.other').group,'Bewaard');
 assert.ok(Card.getEntityConfigForm().schema.some(r=>r.name==='group'));
 assert.throws(()=>new Card().setConfig({...config,series_options:[{entity:'switch.a',group:3}]}),/group/);
});

test('row labels show live localized values independently of the selected historical window',()=>{
 const {card}=setup({entities:['switch.a'],series_options:[{entity:'switch.a',name:'Verwarming'}]});
 card.hass={language:'nl',states:{'switch.a':{state:'on',attributes:{}}},formatEntityState:entity=>entity.state==='on'?'Aan':'Uit'};
 card._viewport=[0,30000];card._render();
 assert.match(card.shadowRoot.innerHTML,/<span>Verwarming<\/span><strong>Aan<\/strong>/);
 const history=card._series;
 card.hass={...card.hass,states:{'switch.a':{state:'off',attributes:{}}}};
 assert.match(card.shadowRoot.innerHTML,/<span>Verwarming<\/span><strong>Uit<\/strong>/);
 assert.equal(card._series,history);assert.equal(card._viewport[1],30000);
});

test('current values preserve state-rule precedence, escape labels and handle unavailable entities',()=>{
 const {card}=setup({entities:['switch.a'],state_colors:[{state:'on',label:'Algemeen',color:'#fff'},{entity:'switch.a',state:'on',label:'<A & B>',color:'#fff'}]});
 card.hass={language:'nl',states:{'switch.a':{state:'on'}},formatEntityState:()=> 'Aan'};
 assert.match(card._timelineRow(0),/<strong>&lt;A &amp; B&gt;<\/strong>/);
 for(const [state,label] of [['unknown','Onbekend'],['unavailable','Niet beschikbaar']]){
  card.hass={...card.hass,states:{'switch.a':{state}}};assert.equal(card._timelineCurrentValue('switch.a'),label);
 }
 card.hass={...card.hass,states:{}};assert.equal(card._timelineCurrentValue('switch.a'),'\u2014');
 card._config.show_labels=false;assert.doesNotMatch(card._timelineRow(0),/row-label|<strong>/);
});

test('current readings follow unit and number-format changes even when the raw state stays equal',()=>{
 const {card}=setup({entities:['sensor.a']});
 card.hass={locale:{language:'nl',number_format:'comma_decimal'},states:{'sensor.a':{state:'0',attributes:{unit_of_measurement:'W'}}},formatEntityState:entity=>'0 '+entity.attributes.unit_of_measurement};
 assert.match(card.shadowRoot.innerHTML,/<strong>0 W<\/strong>/);
 card.hass={...card.hass,states:{'sensor.a':{state:'0',attributes:{unit_of_measurement:'kW'}}}};
 assert.match(card.shadowRoot.innerHTML,/<strong>0 kW<\/strong>/);
 card.hass={...card.hass,locale:{language:'nl',number_format:'decimal_comma'},formatEntityState:()=> '0,0 kW'};
 assert.match(card.shadowRoot.innerHTML,/<strong>0,0 kW<\/strong>/);
});

test('group headings can be hidden independently from the card title and legends',()=>{
 const {Card,card}=setup({title:'Kaarttitel',show_group_titles:false});
 assert.doesNotMatch(card.shadowRoot.innerHTML,/<h3>/);
 assert.match(card.shadowRoot.innerHTML,/Kaarttitel/);
 assert.equal((card.shadowRoot.innerHTML.match(/class="timeline-panel"/g)??[]).length,2);
 assert.match(card.shadowRoot.innerHTML,/data-ui-legend/);
 assert.equal(Card.cardConfig(Card.editorConfig(card._config)).show_group_titles,false);
 const schema=Card.getConfigForm().schema.flatMap(g=>g.schema??[]);
 assert.ok(schema.some(row=>row.name==='show_group_titles'));
 assert.throws(()=>new Card().setConfig({entities:['switch.a'],show_group_titles:'no'}),/show_group_titles/);
});

test('group names are escaped; all rows retain their aligned time intervals',()=>{
 const {card}=setup({series_options:[{entity:'switch.a',group:'<img onerror=x>'},{entity:'switch.b',group:'<img onerror=x>'}]});
 assert.match(card.shadowRoot.innerHTML,/&lt;img onerror=x&gt;/);
 assert.doesNotMatch(card.shadowRoot.innerHTML,/<img/);
 assert.equal((card.shadowRoot.innerHTML.match(/class="timeline-panel"/g)??[]).length,2);
 assert.equal((card.shadowRoot.innerHTML.match(/class="track"/g)??[]).length,3);
});

test('state filters are scoped to the group, preserve history and restore after isolation',()=>{
 const {card}=setup(),history=card._series,config=card._config,key=card._stateLegendKey('switch.a',history[0][0]);
 card._toggleTimelineState(key);
 assert.equal(card._stateVisible('switch.a',history[0][0]),false);
 assert.equal(card._stateVisible('switch.b',history[1][0]),false);
 assert.equal(card._stateVisible('switch.c',history[2][0]),true);
 assert.equal(card._series,history);assert.equal(card._config,config);
 assert.equal((card.shadowRoot.innerHTML.match(/class="segment  filtered"/g)??[]).length,2);
 card._toggleTimelineState(key,true);
 assert.equal(card._stateVisible('switch.a',history[0][0]),true);
 assert.equal(card._stateVisible('switch.a',history[0][1]),false);
 card._toggleTimelineState(key,true);
 assert.equal(card._stateVisible('switch.a',history[0][1]),true);
 card._render();assert.equal(card._hiddenStates.size,0);
});

test('missing history, unknown and identically named raw states toggle independently',()=>{
 const {card}=setup({entities:['switch.a'],state_colors:[{state:'on',label:'Zelfde',color:'#fff'},{state:'off',label:'Zelfde',color:'#fff'}]});
 const a=card._stateLegendKey('switch.a',{state:'on'}),b=card._stateLegendKey('switch.a',{state:'off'});
 assert.notEqual(a,b);
 assert.notEqual(card._stateLegendKey('switch.a',{state:'unknown',missing:true}),card._stateLegendKey('switch.a',{state:'unknown'}));
 card._toggleTimelineState(a);assert.equal(card._stateVisible('switch.a',{state:'off'}),true);
});

test('combined tooltip includes every group, respects filters and keeps original boundaries while zooming',()=>{
 const {card}=setup();card._tooltipGroup='Verwarming';card._viewStart=10000;card._viewEnd=50000;
 const content=card._timelineTooltipRows(20000);
 assert.match(content,/switch.a/);assert.match(content,/switch.b/);assert.match(content,/switch.c/);assert.match(content,/<h4 class="tooltip-group-title">Verwarming<\/h4>/);assert.match(content,/<h4 class="tooltip-group-title">Ventilatie<\/h4>/);
 assert.match(content,/1970-01-01T00:00:00.000Z/);assert.match(content,/1970-01-01T00:01:00.000Z/);
 assert.match(content,/aria-hidden="true">–/);assert.doesNotMatch(content,/ min| sec|<dt>|border/);
 card._hiddenStates.add(card._stateLegendKey('switch.a',card._series[0][0]));
 const filtered=card._timelineTooltipRows(20000);assert.doesNotMatch(filtered,/switch.a|switch.b|>Verwarming</);assert.match(filtered,/switch.c|>Ventilatie</);
 card.setConfig({entities:['switch.a']});assert.equal(card._hiddenStates.size,0);
});

test('legend contains only status labels and keeps toggles available while zooming',()=>{
 const {card}=setup();card._viewport=[30000,90000];card._render();
 const entries=card._timelineStateEntries([0,1]);
 assert.equal(entries.length,2);assert.doesNotMatch(card._timelineLegend([0,1]),/ min| · /);
 card._toggleTimelineState(entries[0].key);
 assert.equal(card._timelineStateEntries([0,1]).length,2);
 card._visibility.set('switch.b',false);
 assert.equal(card._timelineStateEntries([0,1]).length,2);
 assert.match(card._timelineLegend([0,1]),/aria-pressed="false"/);
 card._stateLimits=[true];assert.equal(card._timelineStateEntries([0,1]).length,0);
});

test('combined hover escapes popup headings and supports unnamed groups without empty headings',()=>{
 const {card}=setup({series_options:[{entity:'switch.a',group:'<unsafe>'}]});card._tooltipGroup='<unsafe>';
 const html=card._timelineTooltipRows(20000);assert.match(html,/&lt;unsafe&gt;/);assert.doesNotMatch(html,/<unsafe>/);
 assert.equal((html.match(/class="tooltip-entry"/g)??[]).length,3);assert.equal((html.match(/class="tooltip-group-title"/g)??[]).length,1);
});
