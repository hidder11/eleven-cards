import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCards} from './card-harness.mjs';

test('modern Controls renders per-curtain names with friendly-name and entity fallbacks',()=>{
 const {create}=loadCards();const card=create('eleven-controls-card');
 card.hass={locale:{language:'nl'},states:{
  'cover.right':{state:'open',attributes:{friendly_name:'Rechts',supported_features:11}},
  'cover.left':{state:'closed',attributes:{friendly_name:'Links',supported_features:11}}
 }};
 card.setConfig({type:'custom:eleven-controls-card',entities:[{entity:'cover.right',name:'Gordijnen <woonkamer>'},'cover.left','cover.missing']});
 const html=card.shadowRoot.innerHTML;
 assert.match(html,/Gordijnen &lt;woonkamer&gt;/);
 assert.doesNotMatch(html,/Gordijnen <woonkamer>/);
 assert.match(html,/Links/);assert.match(html,/cover\.missing/);
 assert.match(html,/aria-label="Gordijnen &lt;woonkamer&gt;: Openen"/);
 assert.match(html,/Niet beschikbaar/);
});

test('modern cards retain their shared editor and independent mode-free stubs',()=>{
 const {elements}=loadCards();
 for(const kind of ['actions','controls','waste']){
  const Card=elements.get(`eleven-${kind}-card`),editor=Card.getConfigElement(),stub=Card.getStubConfig();
  assert.ok(editor instanceof elements.get('eleven-controls-editor'));
  assert.equal(editor.kind,kind);
  assert.equal(stub.type,`custom:eleven-${kind}-card`);
  assert.equal('mode' in stub,false);
  assert.equal(typeof Card.getConfigForm,'undefined','legacy mode editor is gone');
 }
});
