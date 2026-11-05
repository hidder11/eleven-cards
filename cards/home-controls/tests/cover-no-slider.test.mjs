import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('covers keep open/stop/close without a slider; light/fan retain sliders',()=>{
 const source=readFileSync(new URL('../dist/eleven-home-controls-card.js',import.meta.url),'utf8');
 const registry=new Map();
 const context={HTMLElement:class{},customElements:{get:n=>registry.get(n),define:(n,c)=>registry.set(n,c)},window:{},console};
 vm.runInNewContext(source,context);
 const Card=registry.get('eleven-controls-card');
 const card=Object.create(Card.prototype);
 card._hass={locale:{language:'nl'},states:{
  'cover.test':{state:'open',attributes:{supported_features:15,current_position:50}},
  'light.test':{state:'on',attributes:{supported_color_modes:['brightness'],brightness:128}},
  'fan.test':{state:'on',attributes:{supported_features:1,percentage:50}}
 }};
 const cover=card._controls([{entity:'cover.test'}]);
 assert.doesNotMatch(cover,/type="range"/);
 for(const action of ['open','stop','close'])assert.match(cover,new RegExp(`data-action="${action}"`));
 for(const domain of ['light','fan'])assert.match(card._controls([{entity:domain+'.test'}]),/type="range"/);
});
