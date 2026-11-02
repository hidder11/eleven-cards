import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function load(name){const registry=new Map();const context=vm.createContext({HTMLElement:class{attachShadow(){this.shadowRoot={innerHTML:'',querySelector:()=>null,querySelectorAll:()=>[]};}},window:new EventTarget(),document:{querySelector:()=>null},customElements:{get:n=>registry.get(n),define:(n,c)=>registry.set(n,c)},setTimeout,clearTimeout,structuredClone,URLSearchParams,Date,Intl,console:{info(){},log(){}}});vm.runInContext(readFileSync(new URL(`../cards/${name}/dist/eleven-${name}.js`,import.meta.url),'utf8'),context);return registry.get(`eleven-${name}`);}
for(const config of [{},{show_title:false},{show_legend:false}])test(`Bar private History base retains exact approved History markup: ${JSON.stringify(config)}`,()=>{
 const Original=load('history-graph-card'),Bar=load('bar-chart'),PrivateHistory=Object.getPrototypeOf(Bar);
 const render=C=>{const c=new C();c.setConfig({entities:['sensor.a'],title:'Example',...config});c._status='ready';c._start=0;c._end=86400000;c._hass={language:'en',states:{'sensor.a':{attributes:{unit_of_measurement:'W'}}}};c._series=[{id:'sensor.a',points:[{t:0,v:1},{t:86400000,v:2}]}];c._render();return c.shadowRoot.innerHTML;};
 assert.equal(render(PrivateHistory),render(Original));assert.equal(new Bar()._calmChartLayout,true);
});
