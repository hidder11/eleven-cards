import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as periods from '../../../shared/periods.js';
import * as cassette from '../../../shared/ui-cassette.js';
import * as graph from '../../../shared/graph.js';
import {cardThemeStyles} from '../../../shared/card-theme.js';
import * as utils from '../src/price-utils.js';
import * as localization from '../src/localization.js';
const source=readFileSync(new URL('../src/dynamic-energy-price-card.js',import.meta.url),'utf8');
let Card;
vm.runInNewContext(source.replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];\s*/gm,''),{
 ...periods,...cassette,...graph,...utils,...localization,cardThemeStyles,
 HTMLElement:class{attachShadow(){this.shadowRoot={querySelector:()=>null,querySelectorAll:()=>[]};}},
 customElements:{get:()=>undefined,define:(_,c)=>{Card=c;}},window:{},Intl,Date,
});
function card(embedded=false){
 const c=new Card();c.setConfig({entity:'sensor.prices',cheapest_hours:2,show_cheapest_table:true,show_period_average:true,embedded});
 const day=new Date().toISOString().slice(0,10);
 c._hass={language:'en',config:{time_zone:'UTC'},states:{'sensor.prices':{attributes:{data:Array.from({length:24},(_,hour)=>({start_time:`${day}T${String(hour).padStart(2,'0')}:00:00Z`,price_per_kwh:.2+hour/100}))}}}};
 return c;
}
test('period table uses the real shared native cassette, preserving open/focus and tariff columns',()=>{
 const c=card();let focus;
 c.shadowRoot.activeElement={matches:s=>s==='.price-periods>summary'};
 c.shadowRoot.querySelector=s=>s==='.price-periods'?{open:true}:s==='.price-periods>summary'?{focus:options=>{focus=options;}}:null;
 c._render();const html=c.shadowRoot.innerHTML;
 assert.match(source,/uiCassette\(/);
 assert.match(html,/<details class="price-periods" data-ui-cassette="" open=""><summary data-ui-cassette-trigger="">/);
 assert.match(html,/<div data-ui-cassette-body=""><section class="price-table-wrap">/);
 assert.match(html,/<span class="table-unit">ct\/kWh<\/span>/);
 for(const column of ['day','type','start','end','duration','average'])assert.match(html,new RegExp(`class="period-${column}"`));
 assert.equal(focus.preventScroll,true);
});
test('all-hidden period columns omit the cassette entirely',()=>{
 const c=card();for(const column of ['day','type','start','end','duration','average'])c._config[`show_period_${column}`]=false;
 c._render();assert.doesNotMatch(c.shadowRoot.innerHTML,/<details class="price-periods"/);
});
