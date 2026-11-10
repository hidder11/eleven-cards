import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Exercise the built card's real EVCC render/signature path. Only DOM primitives
// are stubbed; replacing innerHTML creates a new button, as in a browser.
class Button extends EventTarget {
 click(){const event=new Event('click');this.dispatchEvent(event);this.onclick?.(event);}
}
class Root {
 writes=0;
 set innerHTML(html){
  this.html=html;this.writes++;
  this.retry=html.includes('data-car-image-retry')?new Button():null;
  this.content={style:{setProperty(){}},dataset:{},scrollTop:0};
 }
 get innerHTML(){return this.html;}
 querySelector(selector){return selector==='[data-car-image-retry]'?this.retry:selector==='.content'?this.content:null;}
 querySelectorAll(){return [];}
}

test('EVCC image Retry starts one attempt after repeated unchanged renders and DOM replacement',t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:Date.parse('2026-11-10T12:00:00Z')});
 const registry=new Map(),images=[];
 const context=vm.createContext({
  HTMLElement:class{isConnected=true;attachShadow(){return this.shadowRoot=new Root();}},
  Image:class{constructor(){images.push(this);}},
  window:{},URL,URLSearchParams,Date,
  setTimeout,clearTimeout,setInterval:()=>1,clearInterval(){},
  customElements:{get:name=>registry.get(name),define:(name,element)=>registry.set(name,element)},
 });
 vm.runInContext(readFileSync(new URL('../dist/eleven-car-card.js',import.meta.url),'utf8'),context);
 const Car=registry.get('eleven-car-card').backgroundBaseCard,card=new Car();
 t.after(()=>card.disconnectedCallback());
 card.setConfig({evcc_enabled:true,entity:'sensor.evcc_charge_power',image_entity:'image.car',tabs:[]});
 const hass={connection:{},language:'en',states:{
  'sensor.evcc_charge_power':{state:'0',attributes:{unit_of_measurement:'W'}},
  'image.car':{state:'2026-11-10',attributes:{entity_picture:'/api/image_proxy/image.car?token=test'}},
 }};
 // Registry discovery is independent of this image/render regression.
 card._connection=hass.connection;card.hass=hass;
 for(let cycle=0;cycle<2;cycle++){
  const start=images.length;
  for(const delay of [1000,4000,15000]){images.at(-1).onerror();t.mock.timers.tick(delay);}
  images.at(-1).onerror();
  assert.equal(card._entityImage.status,'error');
  assert.equal(images.length,start+3,'automatic recovery is bounded to four attempts');
  const button=card.shadowRoot.querySelector('[data-car-image-retry]');
  assert.ok(button,'failed image renders a Retry button');
  const writes=card.shadowRoot.writes;
  for(let render=0;render<10;render++)card.hass={...hass};
  assert.equal(card.shadowRoot.writes,writes,'unchanged EVCC signature preserves the DOM');
  assert.equal(card.shadowRoot.querySelector('[data-car-image-retry]'),button);
  const before=images.length;button.click();
  assert.equal(images.length,before+1,'one click starts exactly one new image request');
  assert.equal(card._entityImage.status,'loading');
  assert.equal(card.shadowRoot.querySelector('[data-car-image-retry]'),null);
 }
 images.at(-1).onload();assert.equal(card._entityImage.status,'ready');
});
