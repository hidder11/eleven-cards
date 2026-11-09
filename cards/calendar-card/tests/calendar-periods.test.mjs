import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarSelectedRange,calendarPeriodAdapter} from '../src/calendar-periods.js';
import {calendarDayStart} from '../../../shared/periods.js';

function calendar(view='list'){
 const host={_view:view,_config:{days_to_show:5},_todayKey:'2026-03-28',_offset:0,_hass:{language:'nl'},_zone:()=> 'Europe/Amsterdam',loads:0,renders:0,_startCalendars(){this.loads++;},_render(){this.renders++;}};
 host._range=()=>calendarSelectedRange(host);host._rangeLabel=range=>range.startKey;return host;
}
test('configured calendar ranges retain their existing day and month layout',()=>{
 const host=calendar();assert.equal(host._range().keys.length,5);
 host._view='month';const range=host._range();assert.equal(range.monthKey,'2026-03-01');assert.equal(new Date(range.startKey).getUTCDay(),1);assert.equal(range.keys.length%7,0);
});
test('day choices navigate into the future in local dates across DST',()=>{
 const host=calendar(),adapter=calendarPeriodAdapter(host);adapter.choose('3d');
 assert.equal(host._range().startKey,'2026-03-28');assert.equal(host._range().endKey,'2026-03-31');assert.equal(host._range().end-host._range().start,71*3600000);
 adapter.move(1);assert.equal(host._range().startKey,'2026-03-31');assert.equal(host._range().endKey,'2026-04-03');
 adapter.move(-1);assert.equal(host._range().startKey,'2026-03-28');adapter.move(0);assert.equal(host._offset,0);assert.equal(host.loads,4);
});
test('week and month choices navigate real calendar boundaries',()=>{
 const host=calendar(),adapter=calendarPeriodAdapter(host);adapter.choose('week');assert.equal(host._range().startKey,'2026-03-23');assert.equal(host._range().endKey,'2026-03-30');
 adapter.move(1);assert.equal(host._range().startKey,'2026-03-30');adapter.choose('month');adapter.move(1);assert.equal(host._range().startKey,'2026-04-01');assert.equal(host._range().endKey,'2026-05-01');
});
test('custom windows retain times, exclude a midnight end date and permit future navigation',()=>{
 const host=calendar(),adapter=calendarPeriodAdapter(host),start=calendarDayStart('2026-04-01','Europe/Amsterdam')+12*3600000,end=calendarDayStart('2026-04-03','Europe/Amsterdam');
 adapter.custom(start,end);assert.equal(host._range().start,start);assert.deepEqual(host._range().keys,['2026-04-01','2026-04-02']);
 adapter.move(1);assert.equal(host._range().start,end);adapter.move(0);assert.equal(host._periodMode,'configured');assert.equal(host._range().keys.length,5);
});
test('invalid custom selections and unknown choices never reload subscriptions',()=>{
 const host=calendar(),adapter=calendarPeriodAdapter(host);adapter.custom(NaN,1);adapter.custom(5,4);adapter.custom(0,367*86400000);adapter.choose('1h');adapter.move(3);assert.equal(host.loads,0);
});
test('selected ranges in month view retain complete Monday-first week rows',()=>{
 const host=calendar('month'),adapter=calendarPeriodAdapter(host);adapter.choose('3d');const range=host._range();assert.equal(range.startKey,'2026-03-23');assert.equal(range.endKey,'2026-04-06');assert.equal(range.keys.length,14);assert.equal(range.monthKey,'2026-03-01');
});
