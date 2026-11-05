import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadCards} from './card-harness.mjs';
const source=readFileSync(new URL('../src/standalone-cards.js',import.meta.url),'utf8');
test('Controls has a local slender bounded slider and readable theme-owned control roles',()=>{
 assert.match(source,/const CONTROLS_STYLES=/);
 const css=source.split('const CONTROLS_STYLES=`')[1].split('`;')[0];
 assert.match(css,/flex:0 1 276px/);
 assert.match(css,/runnable-track\{height:8px/);
 assert.match(css,/range-track\{height:8px/);
 assert.match(css,/target small\{font-size:12px/);
 assert.match(css,/\.identity ha-icon\{color:var\(--secondary-text-color\)/);
 assert.match(css,/outline:2px solid var\(--accent-color/);
 assert.match(source,/uiActionButtonStyles\(\)/);
 assert.doesNotMatch(source,/controls:'\.device-controls button'/,'ordinary action paint is owned by the shared action profile');
 assert.match(source,/uiButton\(\{variant:'action-icon'/);
});
test('Controls trims only outer bottom padding and keeps equal-row geometry',()=>{
 const css=source.split('const CONTROLS_STYLES=`')[1].split('`;')[0];
 assert.ok(css.includes('.content{padding-bottom:8px}'),'Controls bottom padding is 8px');
 assert.match(css,/grid-auto-rows:1fr/);
 assert.match(css,/min-height:64px/);
});
test('Controls scroll group leaves room for rounded button shadows without changing rows',()=>{
 const css=source.split('const CONTROLS_STYLES=`')[1].split('`;')[0];
 const group=css.match(/\.device-controls\{([^}]+)\}/)[1];
 assert.ok(group.includes('padding:6px'),'Scroll group reserves shadow clearance');
 assert.ok(group.includes('margin:-6px'),'Shadow clearance does not enlarge rows');
 assert.ok(group.includes('width:calc(100% + 12px)'),'Keep unchanged available control width');
});
test('Controls preserves the shared slider accent and inherited tone contract',()=>{
 const css=source.split('const CONTROLS_STYLES=`')[1].split('`;')[0];
 assert.ok(!/--ui-bar-tone\s*:/.test(css),'Controls must not override the shared accent with primary');
});
test('Built Controls target retains the temperature unit and native range semantics',()=>{
 const {create}=loadCards(),c=create('eleven-controls-card');
 c.setConfig({entities:['climate.room','light.room']});
 c.hass={locale:{language:'nl'},config:{unit_system:{temperature:'°C'}},states:{'climate.room':{state:'heat',attributes:{supported_features:1,temperature:20,current_temperature:19}},'light.room':{state:'on',attributes:{brightness:128,supported_color_modes:['brightness']}}}};
 assert.match(c.shadowRoot.innerHTML,/20 °C<small>ingesteld/);
 assert.match(c.shadowRoot.innerHTML,/aria-pressed="true"/);
 assert.match(c.shadowRoot.innerHTML,/type="range"/);
 assert.match(c.shadowRoot.innerHTML,/data-key="1-level"/);
});
