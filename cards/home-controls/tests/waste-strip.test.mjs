import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCards} from './card-harness.mjs';

function fixture(){
 const runtime=loadCards(),card=runtime.create('eleven-waste-card');
 card.setConfig({entities:['sensor.paper','sensor.rest','sensor.organic','calendar.waste']});
 card._cache={'calendar.waste':{events:[{summary:'Glass',start:{date:'2026-10-30'}},{summary:'Glass',start:{date:'2026-10-30'}},{summary:'Textile',start:{date:'2027-01-02'}}]}};
 card.hass={locale:{language:'en-GB'},config:{time_zone:'UTC'},states:{
  'sensor.paper':{state:'2026-10-29',attributes:{friendly_name:'Paper'}},
  'sensor.rest':{state:'2026-10-29',attributes:{friendly_name:'Residual'}},
  'sensor.organic':{state:'2026-11-04',attributes:{friendly_name:'Organic'}},
  'calendar.waste':{state:'off',attributes:{}}
 }};
 return {...runtime,card};
}

test('built Waste renders every unique collection as a dated native info button in a strip',()=>{
 const {card}=fixture(),html=card.shadowRoot.innerHTML;
 assert.match(html,/<section class="waste-strip"[^>]*aria-label="Next collection/);
 const pickups=[...html.matchAll(/<button type="button" class="pickup[^\"]*"[^>]*>[\s\S]*?<\/button>/g)].map(m=>m[0]);
 assert.equal(pickups.length,5,'all dates, same-day streams and later calendar events; duplicate removed');
 for(const pickup of pickups){
  assert.match(pickup,/data-info="(?:sensor|calendar)\./);
  assert.match(pickup,/data-key="pickup-/);
  for(const part of ['weekday','day','month','name','count'])assert.match(pickup,new RegExp(`class="${part}"`));
  assert.doesNotMatch(pickup,/<button[\s\S]*<button/);
 }
 assert.match(pickups[0],/class="pickup first"/);
 assert.match(pickups[0],/Tomorrow/);
 assert.match(pickups[0],/October/);
 assert.match(pickups.at(-1),/2027/);
 assert.match(html,/Next collection/);
 card.more('calendar.waste');
 assert.equal(card.events.at(-1).type,'hass-more-info');
 assert.equal(card.events.at(-1).detail.entityId,'calendar.waste');
});

test('built strip refits from actual text geometry, and disconnect/reconnect rearms its observer',()=>{
 const {card,context}=fixture(),observers=[];
 context.ResizeObserver=class{
  constructor(callback){this.callback=callback;this.observed=[];observers.push(this);}
  observe(e){this.observed.push(e);}
  disconnect(){this.disconnected=true;this.observed=[];}
 };
 context.getComputedStyle=e=>e.computed||{paddingLeft:'8px',paddingRight:'8px',borderLeftWidth:'0px',borderRightWidth:'0px',columnGap:'0px'};
 let wordWidth=50;
 const probe={getBoundingClientRect:()=>({width:wordWidth}),setAttribute(){},style:{}};
 context.document.createElement=()=>probe;
 const label={textContent:'Residual',_wasteWords:[probe]};
 const button={querySelectorAll:()=>[label],querySelector:()=>null};
 const grid={clientWidth:280,computed:{paddingLeft:'4px',paddingRight:'4px',columnGap:'0px'},dataset:{},style:{value:'',getPropertyValue(){return this.value;},setProperty(k,v){this.value=v;}},querySelectorAll:s=>s==='.pickup'?[button,button,button]:[probe]};
 card.shadowRoot.querySelector=s=>s==='.waste-strip'?grid:null;
 assert.equal(typeof card._observeWaste,'function');
 card._observeWaste();
 assert.equal(grid.style.value,'3','short words fit without arbitrary breakpoints');
 assert.ok(observers[0].observed.includes(probe),'unwrapped text must be observed as well as host');
 wordWidth=118;observers[0].callback();
 assert.equal(grid.style.value,'2','font/content geometry changes refit without host resize');
 wordWidth=240;observers[0].callback();
 assert.equal(grid.style.value,'1');
 card.disconnectedCallback();assert.equal(observers[0].disconnected,true);
 wordWidth=50;card.connectedCallback();
 assert.equal(grid.style.value,'3');
 assert.ok(observers[0].observed.includes(card),'reconnect must rearm the observer even with unchanged data');
 card.disconnectedCallback();
});


test('pickup identity survives reordered telemetry and focused retry moves to real info after resolution',async()=>{
 const {card}=fixture();
 const key=card.shadowRoot.innerHTML.match(/data-info="sensor.paper" data-key="([^"]+)"/)[1];
 let focused=null;
 card.shadowRoot.activeElement={dataset:{key}};
 card.shadowRoot.querySelector=selector=>{
  if(selector.startsWith('[data-key=')){
   const value=selector.slice(11,-2);
   return card.shadowRoot.innerHTML.includes(`data-key="${value}"`)?{focus(){focused=value;}}:null;
  }
  if(selector==='[data-info]')return {focus(){focused='first-info';}};
  return null;
 };
 card.hass={...card.hass,states:{...card.hass.states,'sensor.organic':{state:'2026-10-28',attributes:{friendly_name:'Organic'}}}};
 assert.equal(focused,key,'stable entity/date/name key, not sorted index');
 let resolve,calls=0;
 card._config.entities=[{entity:'calendar.waste'}];
 card._cache={'calendar.waste':{error:true}};
 card._hass={...card.hass,callApi:()=>{calls++;return new Promise(r=>{resolve=r;});}};
 card._fingerprint=null;card._render();
 card.shadowRoot.activeElement={dataset:{key:'waste-retry'}};
 card.isConnected=true;
 const pending=card._refresh(true);
 assert.match(card.shadowRoot.innerHTML,/data-retry[^>]*aria-busy="true"/);
 await card._refresh(true);assert.equal(calls,1,'retry pending cannot duplicate GET');
 resolve([{summary:'Paper',start:{date:'2026-11-01'}}]);await pending;
 assert.doesNotMatch(card.shadowRoot.innerHTML,/data-retry/);
 assert.equal(focused,'first-info','disappearing retry must not strand keyboard focus');
 card.disconnectedCallback();
});

test('column fitting is stable at divider-width thresholds, independent of its previous result',()=>{
 const {card,context}=fixture();
 const style={value:'3',getPropertyValue(){return this.value;},setProperty(key,value){this.value=value;}};
 const probe={style:{},getBoundingClientRect:()=>({width:125})};
 const label={_wasteWords:[probe]};
 const button={querySelectorAll:()=>[label],querySelector:()=>null};
 const grid={clientWidth:290,style,dataset:{},querySelectorAll:()=>[button,button,button]};
 context.getComputedStyle=e=>e===grid?{paddingLeft:'4px',paddingRight:'4px',columnGap:'0px'}:e===button?{paddingLeft:'8px',paddingRight:'8px',borderLeftWidth:style.value==='1'?'0px':'1px',borderRightWidth:'0px'}:{};
 card.shadowRoot.querySelector=selector=>selector==='.waste-strip'?grid:null;
 const sequence=[];
 for(let i=0;i<8;i++){card._fitWaste();sequence.push(style.value);}
 assert.equal(new Set(sequence).size,1,`fitting must settle instead of oscillating: ${sequence}`);
 assert.equal(sequence[0],'1','reserve divider geometry even after the single-column rule removes its paint');
});
