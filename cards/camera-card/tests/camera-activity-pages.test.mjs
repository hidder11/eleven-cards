import test from 'node:test';
import assert from 'node:assert/strict';
import {CameraActivityPages} from '../src/camera-activity-pages.js';
import {normalizeCameraConfig} from '../src/camera-utils.js';
import {CameraActivity} from '../src/camera-features.js';
import {cameraVisibleEvents} from '../src/camera-security.js';

const event=(index,count=1)=>({id:'event-'+index,entity:'binary_sensor.door',camera:'',kind:'door',state:'on',time:index*60000,count});
const rows=Array.from({length:7},(_,index)=>event(10-index));

test('page-size config migrates legacy YAML with new setting taking precedence and bounds intact',()=>{
 assert.equal(normalizeCameraConfig({}).activity_page_size,10);
 assert.equal(normalizeCameraConfig({activity_limit:3}).activity_page_size,3);
 assert.ok(!('activity_limit' in normalizeCameraConfig({activity_limit:3})));
 for(const [input,expected] of [[0,1],[500,50],[2.4,2],['bad',10]])assert.equal(normalizeCameraConfig({activity_page_size:input,activity_limit:4}).activity_page_size,expected);
 assert.equal(normalizeCameraConfig({activity_page_size:2,activity_limit:9}).activity_page_size,2);
});

test('pagination reaches all rows, clamps navigation and uses a partial last page',()=>{
 const pages=new CameraActivityPages();
 assert.deepEqual(pages.view(rows,3).events.map(row=>row.id),['event-10','event-9','event-8']);
 assert.equal(pages.move(-1,rows,3).page,1);
 assert.equal(pages.move(1,rows,3).page,2);
 const last=pages.move(1,rows,3);assert.equal(last.page,3);assert.equal(last.pages,3);assert.deepEqual(last.events.map(row=>row.id),['event-4']);
 assert.equal(pages.move(1,rows,3).page,3);
 assert.equal(pages.view([],3).page,1);assert.equal(pages.view([],3).pages,1);
});

test('incoming events and repetition counts do not shift older pages, latest returns to live rows',()=>{
 const pages=new CameraActivityPages(),old=pages.move(1,rows,2);
 const updated=[event(12),event(11),{...rows[0],count:3},...rows.slice(1)];
 const frozen=pages.view(updated,2);
 assert.deepEqual(frozen.events,old.events);assert.equal(frozen.page,2);assert.equal(frozen.hasNew,true);
 assert.equal(pages.move(1,updated,2).events[0].id,'event-6');
 pages.reset();const latest=pages.view(updated,2);
 assert.equal(latest.page,1);assert.equal(latest.hasNew,false);assert.deepEqual(latest.events.map(row=>row.id),['event-12','event-11']);
});

test('expiry, source changes and page-size changes cannot leave an empty out-of-range page',()=>{
 const pages=new CameraActivityPages();pages.move(2,rows,2);
 const retained=rows.slice(0,3),expired=pages.view(retained,2,{since:8*60000});
 assert.equal(expired.page,2);assert.deepEqual(expired.events.map(row=>row.id),['event-8']);
 const first=pages.view(rows.slice(0,1),2);assert.equal(first.page,1);assert.equal(first.events.length,1);
 pages.move(1,rows,2);assert.equal(pages.view(rows,5).page,1);
 pages.reset();assert.equal(pages.view(rows,2).page,1);
});

test('the tracker retains more events than a page and grouping precedes pagination',()=>{
 const config=normalizeCameraConfig({door_sensors:['binary_sensor.door'],activity_page_size:2}),tracker=new CameraActivity();
 tracker.merge([...rows,{...rows[0],id:'repeat',time:rows[0].time+1000}]);
 const events=cameraVisibleEvents(tracker.events,config),pages=new CameraActivityPages();
 assert.equal(events.length,7);assert.equal(events[0].count,2);
 assert.equal(pages.view(events,config.activity_page_size).pages,4);
 assert.equal(pages.move(3,events,2).events[0].id,'event-4');
});
