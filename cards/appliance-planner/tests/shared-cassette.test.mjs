import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
globalThis.HTMLElement??=class {};
const {ElevenAppliancePlanner}=await import('../src/appliance-planner.js');
const source=readFileSync(new URL('../src/appliance-planner.js',import.meta.url),'utf8');
function fixture(){
 const c=Object.create(ElevenAppliancePlanner.prototype);
 const details={open:true,isConnected:true,addEventListener(type,fn){this[type]=fn;}};
 c.shadowRoot={activeElement:null,innerHTML:'',querySelector:s=>s==='#advice-details'?details:null,querySelectorAll:()=>[],getElementById:()=>null};
 c._hass={config:{time_zone:'Europe/Amsterdam'},locale:{language:'nl'}};
 c.config={title:'<Was & Droog>',tariff:{source:'sensor'},cheap_price:.15,expensive_price:.4,appliances:[{id:'washer',name:'Was & <droog>',kind:'washer',programs:[{id:'eco',name:'Eco',minutes:60,kwh:1}]}]};
 c.form={aid:'washer',pid:'eco'};c.syncDay();
 c.rows=[{start:'2026-11-08T11:00Z',end:'2026-11-08T12:00Z',price:.1}];
 c.result={start:c.rows[0].start,end:c.rows[0].end,cost:.1,average:.1,savings:.2};
 return {c,details};
}
test('restorative summary and day-button focus never scrolls the page',()=>{
 for(const id of ['advice-summary','day-0']){
  const {c}=fixture();let options;
  c.shadowRoot.activeElement={id,tagName:id==='advice-summary'?'SUMMARY':'BUTTON'};
  c.shadowRoot.getElementById=target=>target===id?{focus:value=>{options=value;}}:null;
  c.render();assert.equal(options?.preventScroll,true,id);
 }
});
test('advice details is rendered by the shared cassette with existing IDs, domain body and native state',()=>{
 const {c,details}=fixture();c.render();const html=c.shadowRoot.innerHTML;
 assert.match(source,/uiCassette\(/);
 assert.match(html,/<details id="advice-details" data-ui-cassette="" open=""><summary id="advice-summary" data-ui-cassette-trigger="">Details<\/summary><div class="detail-body" data-ui-cassette-body="">/);
 assert.match(html,/class="detail-row"/);assert.match(html,/class="graph"/);assert.match(html,/class="highlight"/);
 assert.match(html,/&lt;Was &amp; Droog&gt;/);assert.match(html,/Was &amp; &lt;droog&gt;/);
 assert.equal(c.detailsOpen,true);
 details.open=false;details.toggle();assert.equal(c.detailsOpen,false);
 c.render();assert.match(c.shadowRoot.innerHTML,/<details id="advice-details" data-ui-cassette=""><summary/);
});
