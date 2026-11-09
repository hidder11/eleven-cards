import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {houseWeatherState,windMetersPerSecond,houseSnowPosition,HouseWeather,houseWindSpeed} from '../src/house-weather.js';
const text=name=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8');
const context=vm.createContext({HTMLElement:class{},URL,Uint8Array,Uint8ClampedArray,Float32Array,ArrayBuffer,DataView,fetch,Response,Blob,document:{baseURI:'https://example.invalid/'}});
vm.runInContext(text('house-pixels.js')+text('house-base.js')+';globalThis.subject={HousePixels,ElevenHouseCard};',context);
const {HousePixels:pixels,ElevenHouseCard:Base}=context.subject;
const entity=(state,wind_speed,wind_speed_unit='m/s')=>({state,attributes:{wind_speed,wind_speed_unit}});
test('weather mapping is safe for missing/unavailable/unknown/custom states and opt-out',()=>{
 for(const e of [undefined,entity('unknown',90),entity('unavailable',90),entity('',90),entity('custom',90)])assert.equal(houseWeatherState({},e).mode,'none');
 assert.equal(houseWeatherState({weather_overlay:false},entity('pouring',90)).mode,'none');
 for(const [state,mode] of Object.entries({rainy:'rain',pouring:'rain',snowy:'snow','snowy-rainy':'snow',windy:'wind','windy-variant':'wind',lightning:'wind','lightning-rainy':'storm',sunny:'none',hail:'none',exceptional:'none'}))assert.equal(houseWeatherState({},entity(state)).mode,mode,state);
 assert.equal(houseWeatherState({},entity('rainy',10.8)).mode,'storm');
 assert.equal(houseWeatherState({},entity('sunny',10.79)).mode,'none');
 assert.equal(houseWeatherState({wind_threshold:5},entity('sunny',5)).mode,'wind');
 assert.equal(houseWeatherState({},entity('sunny',900,'invalid')).mode,'none');
 assert.equal(houseWeatherState({weather_intensity:0},entity('snowy')).amount,0);
});
test('HA wind speed units convert before threshold comparisons; absent/invalid speeds never imply wind',()=>{
 for(const [unit,value] of [['m/s',12],['km/h',43.2],['mph',12/.44704],['kn',12/.5144444444444445],['ft/s',12/.3048],['in/s',12/.0254],['m/min',720]]){
  assert.ok(Math.abs(windMetersPerSecond(value,unit)-12)<1e-9);assert.equal(houseWeatherState({},entity('rainy',value,unit)).mode,'storm');
 }
 assert.equal(windMetersPerSecond(4,'Beaufort'),.836*8);
 for(const v of [null,undefined,'40',-1,NaN,Infinity])assert.equal(windMetersPerSecond(v,'m/s'),null);
 assert.equal(windMetersPerSecond(10,undefined),null);
 for(const unit of ['toString','constructor','__proto__'])assert.equal(windMetersPerSecond(10,unit),null);
});
test('wind speed uses an independent integrated clock, remains continuous on updates, caps delta',()=>{
 let scheduled=0;globalThis.requestAnimationFrame=()=>++scheduled;globalThis.cancelAnimationFrame=()=>{};
 const w=Object.assign(Object.create(HouseWeather.prototype),{clock:100,windClock:7,last:1000,state:{wind:.2,amount:.5},active:()=>true,paint(){}});
 w.tick(1050);assert.equal(w.clock,100.05);assert.equal(w.windClock,7+.05*houseWindSpeed(.1));
 const previous=w.windClock;w.state={wind:1,amount:1};w.tick(1100);assert.equal(w.windClock,previous+.05*houseWindSpeed(1));
 w.tick(10000);assert.ok(w.clock<100.2);assert.equal(scheduled,3);
});
test('unrelated HA updates do not reset the integrated wind clock or animation frame',()=>{
 const w=Object.assign(Object.create(HouseWeather.prototype),{host:{config:{weather_entity:'weather.example'},_hass:{states:{'weather.example':entity('windy',12)}}},frame:9,last:2000,clock:80,windClock:17,active:()=>true,paint(){},resume(){throw Error('must not reset an active frame');}});
 for(let i=0;i<100;i++)w.update();assert.equal(w.frame,9);assert.equal(w.last,2000);assert.equal(w.windClock,17);
});
test('hidden, offscreen and detached hosts do not paint on repeated HA updates',()=>{
 const previousDocument=globalThis.document;
 globalThis.document={hidden:false};
 try{
  for(const suspended of ['hidden','offscreen','detached']){
   let clears=0,frames=0;
   globalThis.requestAnimationFrame=()=>++frames;globalThis.cancelAnimationFrame=()=>{};
   globalThis.document.hidden=suspended==='hidden';
   const w=Object.assign(Object.create(HouseWeather.prototype),{host:{isConnected:suspended!=='detached',config:{weather_entity:'weather.example'},_hass:{states:{'weather.example':entity('rainy',4)}}},connected:true,visible:suspended!=='offscreen',w:440,h:300,frame:0,last:null,clock:0,windClock:0,ctx:new Proxy(recording().ctx,{get(target,key){return key==='clearRect'?()=>{clears++;}:target[key];}})});
   w.resume=function(){this.last=null;cancelAnimationFrame(this.frame);this.frame=0;this.paint();if(this.active())this.frame=requestAnimationFrame(()=>{});};
   for(let i=0;i<100;i++)w.update();
   assert.equal(clears,0,suspended+' must not repaint');assert.equal(frames,0);
  }
 }finally{globalThis.document=previousDocument;}
});
function recording(){const commands=[];const ctx=new Proxy({}, {get(o,k){if(k==='createLinearGradient')return (...a)=>{commands.push([k,...a]);return {addColorStop:(...s)=>commands.push(['stop',...s])};};return o[k]||((...a)=>commands.push([k,...a]));},set(o,k,v){commands.push(['set',k,v]);o[k]=v;return true;}});return {commands,ctx};}
test('actual painter keeps wind opacity independent of intensity, applies 80/20 mask and never writes house compositor',()=>{
 const record=amount=>{const {commands,ctx}=recording();HouseWeather.prototype.paint.call({ctx,w:440,h:300,state:{mode:'wind',amount},host:{_hass:{themes:{darkMode:true}}}},10,12);return commands;};
 assert.equal(JSON.stringify(record(.2)),JSON.stringify(record(1)));
 const c=record(.2);assert.deepEqual(c.filter(v=>v[0]==='stop').map(v=>v[1]),[0,.8,1]);
 assert.ok(c.some(v=>v[0]==='set'&&v[1]==='globalCompositeOperation'&&v[2]==='destination-in'));
 assert.ok(!c.some(v=>v[0]==='putImageData'));
});
test('snow actual paint follows bounded gentle sway even after long sessions',()=>{
 for(const t of [1,3600,86400,604800]){
  const {commands,ctx}=recording();HouseWeather.prototype.paint.call({ctx,w:440,h:300,state:{mode:'snow',amount:1},host:{}},t,0);
  const arcs=commands.filter(v=>v[0]==='arc');assert.equal(arcs.length,55);
  arcs.forEach((a,i)=>{const p=houseSnowPosition(i,t,440,300);assert.equal(a[1],p.x);assert.equal(a[2],p.y);
   const q=houseSnowPosition(i,t+.01,440,300);let dx=q.x-p.x;if(dx < -255)dx+=510;
   assert.ok(Math.abs(dx/.01)<2.08,'drift plus bounded sway velocity stays gentle');
  });
 }
});
test('linear compositor retains brightness weighting, transparent alpha and deterministic display transform',()=>{
 assert.deepEqual([...pixels.compose(new Float32Array([0,0,0]),[new Float32Array([1,1,1])],[.5],new Float32Array([.5]))],[188,188,188,128]);
 assert.deepEqual([...pixels.compose(new Float32Array([10,10,10]),[],[],new Float32Array([0]))],[0,0,0,0]);
 assert.throws(()=>pixels.compose(new Float32Array([0,0,0]),[],[],new Float32Array([2])),/alpha/);
 assert.equal(pixels.lightLevel({state:'on',attributes:{brightness:127.5}}).level,.5);
 assert.equal(pixels.lightLevel({state:'unavailable'}).known,false);
});
test('secure-context-independent SHA-256 verifies real bytes',async()=>{
 const data=new TextEncoder().encode('synthetic fixture');assert.equal(await pixels.sha256(data),createHash('sha256').update(data).digest('hex'));
});
test('solar phases select scene independently of theme and old light/dark manifests remain supported',()=>{
 const arrays={morning:null,afternoon:null,evening:null,night:null};
 for(const [elevation,rising,phase] of [[-10,false,'night'],[25,true,'afternoon'],[4,true,'morning'],[4,false,'evening']])assert.equal(pixels.resolveMode('auto',arrays,{states:{'sun.sun':{state:'above_horizon',attributes:{elevation,rising}}},themes:{darkMode:true}}),phase);
 assert.equal(pixels.resolveMode('dark',{light:null,dark:null},{}),'dark');
 assert.equal(pixels.resolveMode('auto',arrays,{}),'afternoon');
});
test('area binding is authoritative; only an explicit light button action mutates service state',async()=>{
 const host=Object.assign(Object.create(Base.prototype),{pending:new Set(),draw(){},config:{},_hass:{states:{'light.synthetic':{state:'on',attributes:{brightness:255}}},entities:{'light.synthetic':{entity_id:'light.synthetic',area_id:'room'}},devices:{}},loaded:{manifest:{lights:[{id:'room',area_id:'room',entity:'light.ignored'}]}}});
 assert.equal(host.lightState(host.loaded.manifest.lights[0]).on,true);
 host._hass.callService=async(...args)=>{host.calls=args;};await host.toggle('area:room');assert.deepEqual(host.calls.slice(0,2),['light','turn_off']);assert.equal(host.calls[2].area_id,'room');
 host.calls=null;host.loaded.manifest.lights[0].area_id='';assert.equal(host.lightState(host.loaded.manifest.lights[0]).known,false);await host.toggle('area:');assert.equal(host.calls,null);
});
test('known presence zones and escaped names survive recovery of approved source',()=>{
 const host={config:{show_presence:true,presence_entities:['person.example'],appearance:'hero'},_hass:{states:{'person.example':{state:'office',attributes:{friendly_name:'<Example>'}},'zone.office':{state:'0',attributes:{friendly_name:'Office'}}}},avatarHTML:()=>''};
 const html=Base.prototype.statusHTML.call(host);assert.match(html,/Office/);assert.match(html,/&lt;Example&gt;/);
});
