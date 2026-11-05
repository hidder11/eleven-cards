import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('legacy native exceptions retain original CSS specificity under shared-action opt-in',()=>{
 const css=read('cards/home-controls/src/shared-ui.js');
 assert.ok(css.includes('button:where(:not([data-ui-button]))'),'Exclusion must not increase legacy button specificity');
 assert.ok(!css.includes('button:not([data-ui-button])'),'No higher-specificity duplicate legacy state selectors');
});
test('ordinary neutral action consumers do not retain conflicting colored faces or white hover text',()=>{
 const planner=read('cards/appliance-planner/src/styles.js');
 const room=read('cards/room-card/src/room-card.js');
 assert.ok(!/button\.primary\{[^}]*background:/.test(planner),'Planner primary uses shared neutral action paint');
 assert.ok(!/\.room-button\.on\{[^}]*background:/.test(room),'Room device-state icon must not introduce a conflicting custom action face');
});
