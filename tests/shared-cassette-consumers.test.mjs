import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('House adopts the actual shared cassette and removes its duplicate grip recipe',()=>{
 const source=read('experiments/material-house/src/material-house.js'),builder=read('experiments/material-house/build.py');
 assert.match(source,/mountUICassette\(/,'House must run shared native adoption, not just import paint');
 assert.match(source,/uiCassetteStyles\(/,'House must use the shared cassette states');
 assert.doesNotMatch(source,/\.light-heading(?:::after|:active|:hover)|\.light-panel\[open\]>.light-heading/);
 assert.match(builder,/shared\/ui-cassette\.js/);
 assert.match(source,/--ui-cassette-focus-color:var\(--house-focus/,'House keeps its existing per-card accessible focus color through the shared component');
});

test('Scene uses the same cassette for both native detail levels and retains preventScroll',()=>{
 const source=read('cards/scene-engine-card/frontend/eleven-scene-engine-card.js'),builder=read('cards/scene-engine-card/scripts/build.mjs');
 assert.match(source,/uiCassetteStyles\(/);
 assert.match(source,/mountUICassette\(technical\)/);
 assert.match(source,/mountUICassette\(details\)/);
 assert.match(source,/focus\(\{preventScroll:true\}\)/);
 assert.doesNotMatch(source,/summary::after\{|summary:not\(:disabled\):active|details\[open\]>summary::after/);
 assert.match(builder,/ui-cassette\.js/);
});
