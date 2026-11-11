import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {requestWithTimeout,stopSubscription} from '../shared/request.js';
import {colorScale,summarizeHeatmap} from '../cards/heatmap-card/src/heatmap-utils.js';

const tick=()=>new Promise(resolve=>setImmediate(resolve));
function load(path,tag,extra={}){
 const elements=new Map();
 const context=vm.createContext({HTMLElement:class{attachShadow(){this.shadowRoot={querySelector:()=>null,querySelectorAll:()=>[],innerHTML:''};}},customElements:{get:tag=>elements.get(tag),define:(tag,Card)=>elements.set(tag,Card)},window:new EventTarget(),Date,Intl,URLSearchParams,setTimeout,clearTimeout,setInterval,clearInterval,...extra});
 vm.runInContext(readFileSync(new URL(path,import.meta.url),'utf8'),context);
 return {Card:elements.get(tag),context};
}

test('read deadline releases hung callers and handles synchronous transport failures',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const pending=requestWithTimeout(()=>new Promise(()=>{}),50);
 const rejected=assert.rejects(pending,/Request timeout/);
 t.mock.timers.tick(50);await rejected;
 await assert.rejects(requestWithTimeout(()=>{throw Error('transport');}),/transport/);
 assert.equal(await requestWithTimeout(()=>42),42);
});

test('heatmap summaries and scales accept 200,000 cells without argument overflow',()=>{
 const cells=Array.from({length:200000},(_,i)=>({value:i%2?-2:4,intervals:[]}));
 cells.push({value:null,intervals:[{}]});
 const rows=[{cells}],config={low_color:[0,0,0],high_color:[255,255,255]};
 const scale=colorScale(rows,config),summary=summarizeHeatmap(rows,'consumption');
 assert.equal(scale.min,-2);assert.equal(scale.max,4);
 assert.deepEqual(summary,{minimum:-2,maximum:4,average:1,count:200000,missing:true,total:200000});
 assert.equal(colorScale(rows,{...config,scale_min:0,scale_max:10}).max,10);
 assert.equal(summarizeHeatmap([],'value').minimum,null);
});

test('Timeline processes 200,000 repeated history readings without losing unknown coverage',async()=>{
 const {Card}=load('../cards/timeline-card/dist/eleven-timeline-card.js','eleven-timeline-card'),card=new Card();
 card._render=()=>{};card._connected=true;card._config={entities:['sensor.status'],hours_to_show:24};
 card._hass={config:{time_zone:'UTC'},callApi:async(_,url)=>{
  const start=Date.parse(url.split('?')[0].replace('history/period/',''));
  return [Array.from({length:200000},()=>({entity_id:'sensor.status',state:'unknown',last_changed:new Date(start+1000).toISOString()}))];
 }};
 try{await card._refresh();assert.equal(card._status,'ready');assert.equal(card._series[0][0].missing,true);assert.equal(card._series[0][0].end-card._start,1000);assert.equal(card._series[0].at(-1).missing,undefined);}
 finally{card._connected=false;clearTimeout(card._timer);}
});

test('Room ignores 10,000 unrelated HA updates while receiving current action context',()=>{
 const {Card}=load('../cards/room-card/dist/eleven-room-card.js','eleven-room-card'),card=new Card();let renders=0;
 card._render=()=>{renders++;};card.setConfig({name:'Room',lights:['light.room'],scenes:['scene.read'],temperature_entity:'sensor.temperature'});
 const states={'light.room':{state:'on'},'scene.read':{state:'unknown'},'sensor.temperature':{state:'20'}},hass={connected:true,states,locale:{language:'en'},callService(){}};
 card.hass=hass;const initial=renders;
 for(let i=0;i<10000;i++)card.hass={...hass,states:{...states,'sensor.other':{state:String(i)}}};
 assert.equal(renders,initial);assert.equal(card.hass.states['sensor.other'].state,'9999');
 card.hass={...hass,states:{...states,'sensor.temperature':{state:'21'}}};assert.equal(renders,initial+1);
 card.hass={...card.hass,connected:false};assert.equal(renders,initial+2);
 card.hass={...card.hass,locale:{language:'nl'}};assert.equal(renders,initial+3);
 const beforeMutation=renders;card.hass.states['sensor.temperature'].state='23';card.hass={...card.hass};assert.equal(renders,beforeMutation+1);
});

test('EVCC clock pauses outside the viewport and resumes once without starting in plain Car mode',()=>{
 const timers=new Map();let id=0;
 const {Card}=load('../cards/car-card/dist/eleven-car-card.js','eleven-car-card',{setInterval:callback=>{timers.set(++id,callback);return id;},clearInterval:timer=>timers.delete(timer)}),card=new Card();
 card.isConnected=true;card._config={evcc_enabled:true};let paused=false;card.hasAttribute=()=>paused;
 card._ensureClock();card._ensureClock();assert.equal(timers.size,1);
 paused=true;card._ensureClock();assert.equal(timers.size,0);
 paused=false;card._ensureClock();assert.equal(timers.size,1);
 card._config.evcc_enabled=false;card._ensureClock();assert.equal(timers.size,0);
 card._config.evcc_enabled=true;card.isConnected=false;card._ensureClock();assert.equal(timers.size,0);
});

for(const stage of ['tariffs','preview'])test(`Planner releases a hung ${stage} read and ignores its late answer`,async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const {Card}=load('../cards/appliance-planner/dist/eleven-appliance-planner.js','eleven-appliance-planner'),card=new Card();let late;
 Object.assign(card,{config:{tariff:{}},_hass:{},form:{deadline:'2026-12-01T00:00'},epoch:0,render(){},selected:()=>[{},{}],syncDay(){},payload:()=>({})});
 Object.defineProperty(card,'entityOnline',{get:()=>true});
 Object.defineProperty(card,'integrationData',{get:()=>({appliances:[]})});
 const hung=new Promise(resolve=>late=resolve);
 card.tariffs=()=>stage==='tariffs'?hung:Promise.resolve([]);card.command=()=>hung;
 const pending=card.recompute();await tick();assert.equal(card.loading,true);
 t.mock.timers.tick(15000);await pending;
 assert.equal(card.loading,false);assert.equal(card.error,true);assert.match(card.message,/timeout/);assert.equal(card.tariffRequest,null);
 card.tariffs=async()=>[];card.command=async()=>({marker:'fresh'});await card.recompute();
 assert.equal(card.result.marker,'fresh');assert.equal(card.error,false);
 late({marker:'late'});await tick();assert.equal(card.result.marker,'fresh');
});

test('Energy ignores unrelated states but observes automatic source, price and custom-tab dependencies',()=>{
 const {Card}=load('../cards/energy-flow-card/dist/eleven-energy-flow-card.js','eleven-energy-flow-card'),card=new Card();let renders=0;
 card.render=()=>renders++;card._sync=()=>{};card._reset=()=>{};
 card._config={price_entity:'sensor.price',custom_tabs:[{entities:[{entity:'sensor.custom'}]}]};
 card._prefs={energy_sources:[{type:'solar',stat_energy_from:'sensor.energy',entity_power:'sensor.power'}]};
 const states=Object.fromEntries(['sensor.price','sensor.custom','sensor.energy','sensor.power'].map(id=>[id,{state:'1'}])),hass={states,connection:{},config:{},locale:{},themes:{}};
 card.hass=hass;const initial=renders;
 for(let i=0;i<1000;i++)card.hass={...hass,states:{...states,'sensor.other':{state:String(i)}}};
 assert.equal(renders,initial);
 for(const id of Object.keys(states)){card.hass={...hass,states:{...states,[id]:{state:'2'}}};assert.ok(renders>initial,id);card.hass=hass;}
 const before=renders;card.hass={...hass,themes:{darkMode:true}};assert.equal(renders,before+1);
 card.hass=hass;const online=renders;hass.connection.connected=false;card.hass={...hass};assert.equal(renders,online+1);hass.connection.connected=true;card.hass={...hass};assert.equal(renders,online+2);
 const beforeMutation=renders;hass.states['sensor.power'].state='3';card.hass={...hass};assert.equal(renders,beforeMutation+1);
});

test('Shopping skips unrelated state updates and refreshes list capabilities and language',()=>{
 const {Card}=load('../cards/shopping-card/dist/eleven-shopping-card.js','eleven-shopping-card'),card=new Card();let renders=0;
 card._render=()=>renders++;card._subscribe=()=>{};card._config={entity:'todo.list'};
 const hass={connection:{},states:{'todo.list':{state:'1',attributes:{supported_features:1}}},locale:{language:'en'}};
 card.hass=hass;const before=renders;
 for(let i=0;i<1000;i++)card.hass={...hass,states:{...hass.states,'sensor.other':{state:String(i)}}};
 assert.equal(renders,before);
 card.hass={...hass,states:{'todo.list':{state:'1',attributes:{supported_features:3}}}};assert.equal(renders,before+1);
 card.hass={...card.hass,locale:{language:'nl'}};assert.equal(renders,before+2);
 const beforeMutation=renders;card.hass.states['todo.list'].attributes.supported_features=0;card.hass={...card.hass};assert.equal(renders,beforeMutation+1);
});

test('Scene Engine skips unrelated states and updates scene labels, reset permissions and snapshots',()=>{
 const {Card}=load('../cards/scene-engine-card/dist/eleven-scene-engine-card.js','eleven-scene-engine-card');
 const card=Object.create(Card.prototype);let renders=0;
 card._render=()=>renders++;card._config={entity:'scene_engine.room',reset_entity:'button.reset'};
 const states={'scene_engine.room':{state:'scene.movie',attributes:{effective_request:{scene:'scene.movie'},requests:[{scene:'scene.read'}]}},'scene.movie':{attributes:{friendly_name:'Movie'}},'scene.read':{attributes:{friendly_name:'Read'}},'button.reset':{state:'unknown'}},hass={states,connection:{},services:{button:{press:{}}}};
 card.hass=hass;const before=renders;
 for(let i=0;i<1000;i++)card.hass={...hass,states:{...states,'sensor.other':{state:String(i)}}};assert.equal(renders,before);
 for(const id of Object.keys(states)){const prior=renders;card.hass={...hass,states:{...states,[id]:{state:'new',attributes:{}}}};assert.equal(renders,prior+1,id);card.hass=hass;}
 const prior=renders;card.hass={...hass,services:{}};assert.equal(renders,prior+1);
 card.hass=hass;const online=renders;hass.connection.connected=false;card.hass={...hass};assert.equal(renders,online+1);hass.connection.connected=true;card.hass={...hass};assert.equal(renders,online+2);
 const beforeMutation=renders;hass.states['scene.read'].attributes.friendly_name='Changed';card.hass={...hass};assert.equal(renders,beforeMutation+1);
});

test('subscription cleanup tolerates synchronous and asynchronous disconnect failures',async()=>{
 let attempts=0;
 for(const stop of [undefined,()=>{attempts++;throw Error('closed');},()=>{attempts++;return Promise.reject(Error('closed'));},()=>{attempts++;}])stopSubscription(stop);
 await tick();assert.equal(attempts,3);
 for(const [path,tag,method,property] of [
  ['../cards/shopping-card/dist/eleven-shopping-card.js','eleven-shopping-card','_stop','_unsubscribe'],
  ['../cards/calendar-card/dist/eleven-calendar-card.js','eleven-calendar-card','_stopWeather','_weatherUnsub'],
  ['../cards/weather-card/dist/eleven-weather-card.js','eleven-weather-card','_stopForecast','_unsubscribe'],
 ]){
  const {Card}=load(path,tag),card=new Card();
  card[property]=()=>{throw Error('Connection closed during removal');};card[method]();assert.equal(card[property],null);
  card[property]=()=>Promise.reject(Error('Async connection close'));card[method]();await tick();assert.equal(card[property],null);
 }
});
