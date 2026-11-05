import test from 'node:test';
import assert from 'node:assert/strict';
import {advise,localInputISO} from '../src/planner.js';
globalThis.HTMLElement??=class {};
const {ElevenAppliancePlanner}=await import('../src/appliance-planner.js');
const make=(today='2026-10-28',day)=>{const c=Object.create(ElevenAppliancePlanner.prototype);c.form={aid:'washer',pid:'eco',day};c._hass={config:{time_zone:'Europe/Amsterdam'}};c.config={tariff:{source:'sensor'}};c.today=(n=0)=>{const d=new Date(today+'T12:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};return c;};

test('Today defaults to the following local midnight, not twelve hours or 23:59',()=>{
 const c=make();c.syncDay();assert.equal(c.form.day,'2026-10-28');assert.equal(c.form.deadline,'2026-10-29T00:00');assert.equal(c.payload().deadline,'2026-10-28T23:00:00.000Z');
});
test('Tomorrow is ready by the end of tomorrow; preview/save share existing ISO payload',()=>{
 const c=make('2026-10-28','2026-10-29');c.syncDay();assert.equal(c.form.deadline,'2026-10-30T00:00');assert.deepEqual(c.payload(),{appliance_id:'washer',program_id:'eco',deadline:'2026-10-29T23:00:00.000Z',tariff_source:{source:'sensor'}});
});
test('calendar month/year/leap boundaries have correct exclusive midnight',()=>{
 for(const [today,end] of [['2026-12-31','2027-01-01'],['2028-02-29','2028-03-01'],['2026-01-31','2026-02-01']]){const c=make(today);c.syncDay();assert.equal(c.form.deadline,end+'T00:00');}
});
test('end-of-day respects 23-hour spring and 25-hour autumn local days',()=>{
 for(const [today,hours,end] of [['2026-03-29',23,'2026-03-29T22:00:00.000Z'],['2026-10-25',25,'2026-10-25T23:00:00.000Z']]){const c=make(today);c.syncDay();assert.equal(c.payload().deadline,end);assert.equal((Date.parse(end)-Date.parse(localInputISO(today+'T00:00',c.zone)))/3600000,hours);}
});
test('calendar date selection persists across updates but rolls forward when expired',()=>{
 const c=make('2026-10-28','2026-10-29');c.syncDay();c.syncDay();assert.equal(c.form.day,'2026-10-29');c.today=make('2026-10-29').today;c.syncDay();assert.equal(c.form.day,'2026-10-29');assert.equal(c.form.deadline,'2026-10-30T00:00');c.today=make('2026-10-30').today;c.syncDay();assert.equal(c.form.day,'2026-10-30');assert.equal(c.form.deadline,'2026-10-31T00:00');
});
test('the final whole minute of the selected day remains usable, without extending past midnight',()=>{
 const c=make('2026-10-29');c.syncDay();const deadline=c.payload().deadline,rows=[{start:'2026-10-29T22:00:00Z',end:deadline,price:.1}],program={minutes:60,kwh:1};
 assert.equal(advise(rows,program,'2026-10-29T22:00:00Z',deadline).end,deadline);
 assert.throws(()=>advise(rows,program,'2026-10-29T22:30:00Z',deadline),/past niet/);
});

test('HA timezone owns the calendar day even when UTC/browser has another date',()=>{
 const c=make();delete c.today;const now=Date.now;Date.now=()=>Date.parse('2026-10-28T23:30:00Z');try{c.syncDay();assert.equal(c.form.day,'2026-10-29');assert.equal(c.payload().deadline,'2026-10-29T23:00:00.000Z');}finally{Date.now=now;}
});
