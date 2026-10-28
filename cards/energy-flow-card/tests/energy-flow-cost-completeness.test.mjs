import test from 'node:test';
import assert from 'node:assert/strict';
import {energyFlowHistoricalCost} from '../src/energy-flow-details-data.js';
import {energyFlowDetailContent} from '../src/energy-flow-details.js';

const start=Date.parse('2026-10-01T00:00:00Z');
const rows=values=>values.map((change,index)=>({start:start+index*3600000,change}));
const meter={energy:'in',cost:'cost'};
const metadata={cost:{unit_of_measurement:'EUR'},revenue:{unit_of_measurement:'EUR'}};

test('incomplete hourly costs never appear as a complete import or net total',()=>{
 const statistics={in:rows([5,5]),out:rows([1,1]),cost:rows([.3,null]),revenue:rows([.1,.1])};
 const host={_view:'history',_hass:{language:'en',config:{currency:'EUR'},states:{}},_prefs:{energy_sources:[{type:'grid',stat_energy_from:'in',stat_energy_to:'out',stat_cost:'cost',stat_compensation:'revenue'}]},_detailResult:{statistics,metadata},_offline:()=>false};
 const net=()=>energyFlowDetailContent(host,'grid',{import:10,export:2}).match(/class="energy-grid-net"><dt>Net costs<\/dt><dd>(.*?)<\/dd>/)[1];
 for(const costs of [rows([.3,null]),rows([.3,'unavailable']),rows([.3]),rows([.3,.4]).map(row=>({...row,start:row.start+3600000}))]){
  statistics.cost=costs;
  assert.equal(energyFlowHistoricalCost(meter,{},statistics,metadata,host._hass),null);
  assert.equal(net(),'—');
 }
 statistics.cost=rows([.3,.4]);
 assert.deepEqual(energyFlowHistoricalCost(meter,{},statistics,metadata,host._hass),{value:.7,currency:'EUR'});
 assert.equal(net(),'€ 0.5');
 statistics.cost=rows([0,-.4]);
 assert.deepEqual(energyFlowHistoricalCost(meter,{},statistics,metadata,host._hass),{value:-.4,currency:'EUR'});
});
