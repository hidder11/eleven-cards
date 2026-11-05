import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('opt-in action styles are excluded from legacy dependency closure, including House',()=>{
 const legacy=read('shared/ui-button.js');
 assert.ok(!legacy.includes('uiActionButtonStyles'),'Legacy bundles must not embed new opt-in action implementation');
 const actions=read('shared/ui-action-button.js');
 assert.match(actions,/import \{uiButtonStyles\} from '.\/ui-button.js'/);
 assert.match(actions,/export function uiActionButtonStyles/);
 assert.ok(!read('cards/house-card/scripts/build.mjs').includes('ui-action-button.js'),'House is not an action-profile consumer');
});
test('every migrated standalone explicitly bundles its real action-style dependency',()=>{
 for(const card of ['home-controls','shopping-card','scene-engine-card','appliance-planner','room-card','history-graph-card','bar-chart','timeline-card','calendar-card','weather-card','overview-card','heatmap-card'])assert.ok(read('cards/'+card+'/scripts/build.mjs').includes('ui-action-button.js'),card);
});
