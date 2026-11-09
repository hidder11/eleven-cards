import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const registry=new Map(),context=vm.createContext({HTMLElement:class{},window:{},customElements:{get:n=>registry.get(n),define:(n,c)=>registry.set(n,c)}});
vm.runInContext(readFileSync(new URL('../cards/car-card/dist/eleven-car-card.js',import.meta.url),'utf8'),context);
const proto=registry.get('eleven-car-card').prototype;
function field(state,config={}){
 return proto._field.call({_config:{field_2_entity:'sensor.odometer',field_2_label:'Kilometerstand',field_2_show_unit:true,...config},_hass:{language:'nl',states:{'sensor.odometer':{state,attributes:{unit_of_measurement:'km',...config.attributes}}}}},2,true);
}
test('regular car wraps the complete localized number in one escaped atomic span',()=>{
 const html=field('98452');assert.match(html,/<span class="car-number">98\.452<\/span>/);assert.match(html,/class="ui-metric-unit">km<\/span>/);assert.match(html,/data-entity="sensor.odometer"/);
});
test('text status uses a separate safely escaped wrappable span, not numeric fitting',()=>{
 const html=field('<Geparkeerd & klaar>');assert.match(html,/class="car-text">&lt;Geparkeerd &amp; klaar&gt;<\/span>/);assert.doesNotMatch(html,/car-number/);
});
test('missing values do not gain number markup or misleading units',()=>{
 const html=field('unavailable');assert.match(html,/data-unavailable="true"/);assert.doesNotMatch(html,/car-number|ui-metric-unit/);
});
test('zero, configured precision and numeric attributes preserve formatting and units',()=>{
 assert.match(field('0'),/class="car-number">0<\/span>/);
 assert.match(field('12.45',{field_2_decimals:2}),/class="car-number">12,45<\/span>/);
 assert.match(field('Geparkeerd',{field_2_attribute:'range',field_2_unit:'mi',attributes:{range:284}}),/class="car-number">284<\/span>/);
});
test('regular-only refinement leaves EVCC styles and custom-tab methods independently inherited',()=>{
 const src=readFileSync(new URL('../cards/car-card/src/car-card.js',import.meta.url),'utf8');
 assert.ok(src.indexOf('if(this._config.evcc_enabled){this._carLayoutObserver?.disconnect();super._render()')<src.indexOf('Regular Auto only'));
 assert.match(src,/_carLayoutObserver\?\.disconnect\(\)/);assert.match(src,/new ResizeObserver\(fit\)/);
});
