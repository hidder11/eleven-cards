import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CARD_BACKGROUNDS,CARD_BACKGROUND_CHOICES,normalizeCardBackground,uiCardBackground} from '../shared/ui-card-background.js';
globalThis.HTMLElement??=class{};
const {cardBackgroundSettings}=await import('../shared/card-background.js');

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
