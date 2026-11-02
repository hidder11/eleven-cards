import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advise, canonicalPrices, localInputISO} from '../src/planner.js';
const t='2026-10-28T10:00:00Z';
const rows=[.4,.1,.2].map((price,i)=>({start:`2026-10-28T${10+i}:00:00Z`,end:`2026-10-28T${11+i}:00:00Z`,price}));
test('uniform exact contiguous minimum, full coverage and immediate savings',()=>{
 const r=advise(rows,{minutes:90,kwh:1.5},t,'2026-10-28T13:00:00Z');
 assert.equal(r.start,'2026-10-28T11:00:00.000Z');assert.ok(Math.abs(r.cost-.2)<1e-9);assert.ok(Math.abs(r.savings-.25)<1e-9);assert.equal(r.provisional,false);
});
test('partial future requires a fully priced feasible run and missing comparison stays null',()=>{
 const r=advise(rows.slice(1),{minutes:60,kwh:1},t,'2026-10-28T15:00:00Z');
 assert.equal(r.provisional,true);assert.equal(r.savings,null);assert.equal(r.average,.1);
 assert.throws(()=>advise(rows.slice(1,2),{minutes:90,kwh:1},t,'2026-10-28T15:00:00Z'));
});
test('canonical starts cannot stretch over a missing price interval',()=>{
 const result=canonicalPrices([{start_time:t,price_per_kwh:0},{start_time:'2026-10-28T10:15Z',price_per_kwh:-.1},{start_time:'2026-10-28T11:00Z',price_per_kwh:.2}]);
 assert.equal(result[1].end,'2026-10-28T10:30:00.000Z');
 assert.throws(()=>advise(result,{minutes:60,kwh:1},t,'2026-10-28T12:00Z'));
});
test('invalid numeric values and overlaps never become free energy',()=>{
 for(const price of [null,NaN,Infinity,''])assert.throws(()=>advise([{...rows[0],price}],{minutes:30,kwh:1},t,'2026-10-28T11:00Z'));
 assert.throws(()=>advise([rows[0],rows[0]],{minutes:30,kwh:1},t,'2026-10-28T11:00Z'));
});
test('timezone input rejects DST gaps and ambiguity, normal time converts',()=>{
 assert.equal(localInputISO('2026-10-28T12:00','Europe/Amsterdam'),'2026-10-28T11:00:00.000Z');
 assert.throws(()=>localInputISO('2026-03-29T02:30','Europe/Amsterdam'));
 assert.throws(()=>localInputISO('2026-10-25T02:30','Europe/Amsterdam'));
});
