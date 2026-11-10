import test from 'node:test';
import assert from 'node:assert/strict';
import {CARD_BACKGROUNDS,CARD_BACKGROUND_CHOICES,normalizeCardBackground,uiCardBackground} from '../shared/ui-card-background.js';
globalThis.HTMLElement??=class{};
const {cardBackgroundSettings,cardBackgroundEditorSchema,withCardBackground}=await import('../shared/card-background.js');

test('new cards keep decorative backgrounds off with shared opt-in defaults',()=>{
 assert.equal(cardBackgroundSettings({card_background:{height:180}}).variant,'isobars');
 const s=cardBackgroundSettings();assert.equal(s.variant,'isobars');assert.equal(s.coverage,'header');assert.equal(s.height,240);assert.equal(s.transparency,65);assert.equal(s.colorMode,'accent');assert.equal(s.enabled,false);assert.equal(s.legacy,false);
 for(const config of [{},{title:'No decoration'},{background_strength:40},{animate_background:true}])assert.equal(cardBackgroundSettings(config).enabled,false);
});
test('explicit shared and legacy backgrounds remain opt-in without mutation',()=>{
 for(const card_background of [true,{}, {height:180},{enabled:true},{variant:'aurora'}])assert.equal(cardBackgroundSettings(Object.freeze({card_background})).enabled,true);
 for(const background of ['ribbon','isobars','prism-glass'])assert.equal(cardBackgroundSettings(Object.freeze({background})).enabled,true);
 assert.equal(cardBackgroundSettings({card_background:true,background:'none'}).enabled,false);
});
test('legacy background configuration remains usable without mutation',()=>{
 const config=Object.freeze({background:'ribbon',background_strength:40,animate_background:false});
 const s=cardBackgroundSettings(config);assert.equal(s.variant,'ribbon');assert.equal(s.transparency,60);assert.equal(s.animated,false);assert.equal(s.legacy,false);
 assert.equal(cardBackgroundSettings({background:'prism-glass'}).legacy,true);
 assert.equal(cardBackgroundSettings({background:'none'}).enabled,false);
});
test('shared settings override legacy fields safely and can be disabled',()=>{
 const s=cardBackgroundSettings({background:'halo',background_strength:0,animate_background:false,card_background:{variant:'hologram',colorMode:'custom',colors:['#abc','red;position:fixed'],transparency:55,coverage:'card',height:180,animated:true}});
 assert.equal(s.variant,'hologram');assert.equal(s.transparency,55);assert.equal(s.animated,true);assert.equal(s.coverage,'card');assert.deepEqual(s.colors,['#abc']);
 for(const card_background of [false,{enabled:false}])assert.equal(cardBackgroundSettings({card_background}).enabled,false);
});
test('native editor schema filtering is immutable and preserves unrelated settings',()=>{
 const schema=Object.freeze([Object.freeze({name:'appearance',schema:Object.freeze([Object.freeze({name:'background'}),Object.freeze({name:'compact',selector:{boolean:{}}})])}),Object.freeze({name:'animate_background'}),Object.freeze({name:'title',selector:{text:{}}})]);
 const result=cardBackgroundEditorSchema(schema);assert.deepEqual(result.map(row=>row.name),['appearance','title']);assert.deepEqual(result[0].schema.map(row=>row.name),['compact']);assert.equal(schema.length,3);assert.equal(schema[0].schema.length,2);assert.equal(result[1],schema[2]);assert.equal(cardBackgroundEditorSchema(result),result);
});
test('card registration wrapper delegates validation, lifecycle and existing APIs',()=>{
 const events=[];class Base{setConfig(config){if(!config.valid)throw Error('invalid');this.config=config;}connectedCallback(){events.push('connect');}disconnectedCallback(){events.push('disconnect');}getCardSize(){return 4;}set hass(hass){this._hass=hass;}get hass(){return this._hass;}}
 const Wrapped=withCardBackground(Base),card=new Wrapped();assert.equal(Wrapped.backgroundBaseCard,Base);assert.throws(()=>card.setConfig({}),/invalid/);card.setConfig({valid:true});assert.equal(card.config.valid,true);card.hass={connected:true};assert.equal(card.hass.connected,true);assert.equal(card.getCardSize(),4);card.connectedCallback();card.setCardBackground({variant:'ribbon'});assert.equal(card._elevenBackgroundConfig.card_background.variant,'ribbon');card.disconnectedCallback();assert.deepEqual(events,['connect','disconnect']);
});

test('selected designs are available in the common catalog without dropping legacy designs',()=>{
 for(const variant of ['satin-waves','isometric-depth','comet-trails','lenticular-glow']){
  assert.ok(CARD_BACKGROUND_CHOICES.some(row=>row.value===variant));
  assert.equal(normalizeCardBackground({variant}).variant,variant);
 }
 assert.ok(CARD_BACKGROUNDS.some(row=>row.value==='aurora-curtains'));
 assert.equal(CARD_BACKGROUND_CHOICES.length,9);
});
test('legacy cards keep their renderer until shared backgrounds are explicitly selected',()=>{
 const options={preserveNative:true};
 for(const config of [{},{background:'aurora'},{background:'ribbon'},{background:'prism-glass'},{background:'none'}])assert.equal(cardBackgroundSettings(config,options).legacy,true);
 const settings=cardBackgroundSettings({background:'prism-glass',card_background:{variant:'satin-waves',transparency:40}},options);
 assert.equal(settings.legacy,false);assert.equal(settings.enabled,true);assert.equal(settings.variant,'satin-waves');assert.equal(settings.transparency,40);
 assert.equal(cardBackgroundSettings({card_background:false},options).enabled,false);
});
test('new background markup rejects untrusted CSS colours and keeps accessibility attributes',()=>{
 for(const variant of ['satin-waves','isometric-depth','comet-trails','lenticular-glow']){
  const html=uiCardBackground({variant,colorMode:'custom',colors:['red;position:fixed','<img src=x onerror=alert(1)>','#123456'],transparency:25});
  assert.doesNotMatch(html,/position:fixed|onerror|<img/);
  assert.match(html,/aria-hidden="true"/);assert.match(html,/--ui-bg-1:#123456/);assert.match(html,/--ui-bg-opacity:0.75/);
 }
});
