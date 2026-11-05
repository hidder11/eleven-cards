import test from 'node:test';
import assert from 'node:assert/strict';
const load=()=>import('../src/standalone-utils.mjs');
const state=(value,attributes={})=>({state:value,attributes});
test('generic controls preserve exact targets, capabilities, bounds and step',async()=>{
 const {controlRequest}=await load();
 assert.deepEqual(controlRequest(state('on',{supported_color_modes:['brightness']}),'light.desk','level',37),{domain:'light',service:'turn_on',data:{entity_id:'light.desk',brightness_pct:37}});
 assert.equal(controlRequest(state('on',{supported_color_modes:['onoff']}),'light.desk','level',37),null);
 assert.deepEqual(controlRequest(state('on',{supported_features:1}),'fan.desk','level',50),{domain:'fan',service:'set_percentage',data:{entity_id:'fan.desk',percentage:50}});
 assert.equal(controlRequest(state('on',{supported_features:0}),'fan.desk','level',50),null);
 assert.equal(controlRequest(state('unavailable'),'switch.desk','toggle'),null);
 assert.equal(controlRequest(state('on'),'lock.desk','toggle'),null);
 assert.deepEqual(controlRequest(state('12',{min:0,max:20,step:2}),'number.test','up'),{domain:'number',service:'set_value',data:{entity_id:'number.test',value:14}});
 assert.equal(controlRequest(state('20',{min:0,max:20,step:2}),'number.test','up'),null);
 assert.equal(controlRequest(state('on',{supported_features:1}),'fan.test','toggle'),null);
 assert.equal(controlRequest(state('heat',{supported_features:2,target_temp_low:18,target_temp_high:21}),'climate.test','up'),null);
});
test('waste dates use home timezone, validate ISO dates and respect calendar all-day semantics',async()=>{
 const {wasteRows}=await load();const opts={now:Date.parse('2026-10-27T23:30:00Z'),timeZone:'Europe/Amsterdam',locale:'nl-NL'};
 const rows=wasteRows([{entity:'sensor.iso'},{entity:'sensor.invalid'},{entity:'sensor.count',source:'days'},{entity:'sensor.timestamp'}],{
 'sensor.iso':state('2026-10-29'),'sensor.invalid':state('2026-02-30'),'sensor.count':{...state('2'),last_updated:'2026-10-27T08:00:00Z'},'sensor.timestamp':state('2026-10-28T23:30:00Z')}, {},opts);
 assert.equal(rows.find(r=>r.entity==='sensor.iso').days,1);assert.equal(rows.find(r=>r.entity==='sensor.iso').label,'Morgen');
 assert.equal(rows.find(r=>r.entity==='sensor.invalid').status,'invalid');assert.equal(rows.find(r=>r.entity==='sensor.count').days,1);
 assert.equal(rows.find(r=>r.entity==='sensor.timestamp').date,'2026-10-29');
});
test('waste groups matching dates, derives daysTo from update day and handles DST',async()=>{
 const {wasteRows,groupWaste}=await load();const opts={now:Date.parse('2026-10-25T12:00:00Z'),timeZone:'Europe/Amsterdam',locale:'en'};
 const rows=wasteRows([{entity:'sensor.a',name:'Paper'},{entity:'sensor.b',name:'Organic'},{entity:'sensor.missing'}],{'sensor.a':{...state('tomorrow',{daysTo:1}),last_updated:'2026-10-24T22:30:00Z'},'sensor.b':state('2026-10-26')},{},opts);
 assert.equal(rows[0].days,1);assert.equal(groupWaste(rows)[0].items.length,2);assert.equal(rows.at(-1).status,'unavailable');
});
test('calendar supports multiple events, literal summary filtering and explicit failure/empty states',async()=>{
 const {wasteRows}=await load();const opts={now:Date.parse('2026-10-27T12:00:00Z'),timeZone:'Europe/Amsterdam',locale:'en'};
 const entries=[{entity:'calendar.waste',filter:'paper'}];const states={'calendar.waste':state('off')};
 const cache={'calendar.waste':{events:[{summary:'Organic',start:{date:'2026-10-28'}},{summary:'Paper',start:{date:'2026-10-29'}},{summary:'Paper',start:{date:'2026-11-03'}}]}};
 const rows=wasteRows(entries,states,cache,opts);assert.equal(rows.length,2);assert.equal(rows[0].name,'Paper');assert.equal(rows[0].days,2);
 assert.equal(wasteRows(entries,states,{'calendar.waste':{events:[]}},opts)[0].status,'empty');
 assert.equal(wasteRows(entries,states,{'calendar.waste':{error:true}},opts)[0].status,'error');
 assert.equal(wasteRows(entries,states,{},opts)[0].status,'loading');
});
test('missing, past and invalid count sources never become a fabricated pickup',async()=>{
 const {wasteRows,safeColor}=await load();const opts={now:Date.parse('2026-10-27T12:00:00Z'),timeZone:'UTC',locale:'en'};
 for(const value of ['unknown','unavailable','12 days','',null])assert.equal(wasteRows([{entity:'sensor.a'}],{'sensor.a':state(value)},{},opts)[0].date,null);
 assert.equal(wasteRows([{entity:'sensor.a',source:'days'}],{'sensor.a':state(-1)},{},opts)[0].status,'past');
 assert.equal(safeColor('red;background:url(x)'),null);assert.equal(safeColor('#97ac32'),'#97ac32');
});
