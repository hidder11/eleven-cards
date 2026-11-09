import test from 'node:test';
import assert from 'node:assert/strict';
import {CARD_BACKGROUNDS,normalizeCardBackground,uiCardBackground,observeCardBackgroundMotion} from '../shared/ui-card-background.js';

test('background variants have unique stable identifiers and safe defaults',()=>{
 assert.equal(CARD_BACKGROUNDS.length,29);assert.equal(new Set(CARD_BACKGROUNDS.map(v=>v.value)).size,29);
 assert.deepEqual(normalizeCardBackground(null),{variant:'aurora',colorMode:'accent',colors:[],transparency:65,animated:true,coverage:'card',height:240});
 assert.equal(normalizeCardBackground({transparency:-20}).transparency,0);
 assert.equal(normalizeCardBackground({transparency:150}).transparency,100);
 assert.equal(normalizeCardBackground({transparency:'invalid'}).transparency,65);
});
test('untrusted configuration cannot inject markup or CSS',()=>{
 const html=uiCardBackground({variant:'"><script>alert(1)</script>',colorMode:'custom',colors:['red;position:fixed','url(https://example.com/image)','"><img src=x>','#abc'],transparency:'0;display:none'});
 assert.ok(html.includes('--ui-bg-1:#abc'));assert.ok(html.includes('data-ui-card-background="aurora"'));
 for(const unsafe of ['<script','<img','url(','position:fixed','display:none'])assert.ok(!html.includes(unsafe),unsafe);
});
test('custom palettes repeat safely and transparency only controls the decoration',()=>{
 const html=uiCardBackground({colorMode:'custom',colors:['#123','#456'],transparency:100,animated:false});
 assert.ok(html.includes('--ui-bg-1:#123;--ui-bg-2:#456;--ui-bg-3:#123;--ui-bg-opacity:0'));
 assert.ok(html.includes('aria-hidden="true"'));assert.ok(html.includes('data-animated="false"'));
 assert.equal(normalizeCardBackground({colors:['#123','#1234','#123456','#12345678']}).colors.length,3);
});
test('dynamic colour belongs to the calling card and falls back to its theme accent',()=>{
 const html=uiCardBackground({colorMode:'dynamic'},{statusColor:'#35885a'});assert.ok(html.includes('--ui-bg-1:#35885a'));
 const invalid=uiCardBackground({colorMode:'dynamic'},{statusColor:'red;opacity:1'});assert.ok(invalid.includes('var(--accent-color'));assert.ok(!invalid.includes('red;opacity'));
 const accent=uiCardBackground({colorMode:'accent'},{statusColor:'#35885a'});assert.ok(!accent.includes('#35885a'));
});
test('visibility pauses decoration and cleanup releases document and observer listeners',()=>{
 let callback,visibility,disconnected=false,removed=false,paused=false;
 const doc={hidden:false,defaultView:{IntersectionObserver:class{constructor(fn){callback=fn;}observe(){}disconnect(){disconnected=true;}}},addEventListener(name,fn){assert.equal(name,'visibilitychange');visibility=fn;},removeEventListener(name,fn){removed=name==='visibilitychange'&&fn===visibility;}};
 const layer={toggleAttribute(name,value){assert.equal(name,'data-motion-paused');paused=value;}};
 const cleanup=observeCardBackgroundMotion({ownerDocument:doc,querySelectorAll:()=>[layer]});
 assert.equal(paused,false);callback([{isIntersecting:false}]);assert.equal(paused,true);callback([{isIntersecting:true}]);assert.equal(paused,false);
 doc.hidden=true;visibility();assert.equal(paused,true);cleanup();assert.ok(removed&&disconnected);
});

test('selected families retain two alternatives each and every registered pattern renders',()=>{
 const families=Object.fromEntries(['aurora','ribbon','isobars','ink','hologram'].map(family=>[family,CARD_BACKGROUNDS.filter(item=>item.family===family).length]));
 assert.deepEqual(families,{aurora:2,ribbon:2,isobars:2,ink:2,hologram:2});
 for(const item of CARD_BACKGROUNDS){const html=uiCardBackground({variant:item.value});assert.ok(html.includes('data-ui-card-background="'+item.value+'"'));assert.ok(html.includes('data-ui-background-family="'+(item.family??item.value)+'"'));}
 for(const variant of ['isobars-stream','isobars-vortex','hologram','hologram-hex','caustics','constellation'])assert.ok(uiCardBackground({variant}).includes('<svg'));
});

test('motion observation discovers decoration inside an open card shadow root',()=>{
 let paused=false,observed;const layer={toggleAttribute(name,value){paused=value;}};
 const doc={hidden:true,defaultView:{IntersectionObserver:class{observe(node){observed=node;}disconnect(){}}},addEventListener(){},removeEventListener(){}};
 const card={ownerDocument:doc,shadowRoot:{querySelectorAll:()=>[layer]},querySelectorAll:()=>assert.fail('Light DOM does not contain card decoration')};
 const cleanup=observeCardBackgroundMotion(card);assert.equal(observed,card);assert.equal(paused,true);cleanup();
});

test('coverage accepts a bounded numeric height and safely defaults unknown values',()=>{
 assert.equal(normalizeCardBackground({coverage:'header',height:'180.6'}).height,181);
 assert.equal(normalizeCardBackground({height:0}).height,24);
 assert.equal(normalizeCardBackground({height:9000}).height,2000);
 const invalid=normalizeCardBackground({coverage:'header;position:fixed',height:'200px;display:none'});
 assert.equal(invalid.coverage,'card');assert.equal(invalid.height,240);
 const html=uiCardBackground({coverage:'header',height:180});
 assert.ok(html.includes('data-ui-background-coverage="header"'));assert.ok(html.includes('--ui-bg-height:180px'));
});
