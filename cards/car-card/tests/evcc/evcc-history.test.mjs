import test from 'node:test';
import assert from 'node:assert/strict';
import {evccHistoryPoints,evccHistoryMethods,evccSessionWindow,evccHistoryArea} from '../../src/evcc/evcc-history.js';
const start=Date.parse('2026-10-21T10:00:00Z'), end=start+3600000;
const row=(offset,state,id='sensor.power')=>({entity_id:id,state,last_changed:new Date(start+offset).toISOString()});

test('stepped area follows readings and closes each segment without bridging missing history',()=>{
 assert.equal(evccHistoryArea([[0,80],[10,40],[20,NaN],[30,60],[40,20]],100),'M 0 80 H 10 V 40 L 10 100 H 0 Z M 30 60 H 40 V 20 L 40 100 H 30 Z');
 assert.equal(evccHistoryArea([[0,NaN],[10,40],[20,NaN]],100),'');
 assert.equal(evccHistoryArea([[0,100],[10,100]],100),'M 0 100 H 10 V 100 L 10 100 H 0 Z');
});
test('power history converts watts, anchors the window and preserves unavailable gaps',()=>{
 const points=evccHistoryPoints([[row(-1000,'1000'),row(1000,'unavailable'),row(2000,'2000'),row(3000,'9000','sensor.other'),row(3600001,'3000')]],'sensor.power','W',start,end);
 assert.deepEqual(points,[{time:start,value:1},{time:start+1000,value:null},{time:start+2000,value:2},{time:end,value:2}]);
 assert.deepEqual(evccHistoryPoints([],'sensor.power','W',start,end),[]);
 assert.deepEqual(evccHistoryPoints([[row(0,'1')]],'sensor.power','MW',start,end),[]);
 assert.equal(evccHistoryPoints([[row(0,'0')]],'sensor.power','kW',start,end)[0].value,0);
});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('delayed Recorder reconnect uses the live session and retries until history catches up',async()=>{
 const now=Date.now(),changed=now-120000,old=now-7200000,id='binary_sensor.connected';
 const row=(time,state)=>({entity_id:id,state,last_changed:new Date(time).toISOString()});
 let rows=[row(old,'on')],discoveries=0;const starts=[];
 const card=host(()=>Promise.resolve([]));card._activeTab='session';
 card._hass.states[id]={state:'on',last_changed:new Date(changed).toISOString()};
 card._hass.callApi=async(method,url)=>{
  if(url.includes(id)){discoveries++;return [rows];}
  starts.push(Date.parse(decodeURIComponent(url.split('history/period/')[1].split('?')[0])));return [];
 };
 card._syncHistory();await flush();
 assert.equal(starts[0],changed);assert.equal(card._historySession,null);
 rows=[row(old,'on'),row(changed-1000,'off'),row(changed,'on')];
 card._historyRequestedAt=0;card._syncHistory();await flush();
 assert.equal(discoveries,2);assert.equal(starts[1],changed);assert.equal(card._historySession.start,changed);
 card._historyRequestedAt=0;card._syncHistory();await flush();assert.equal(discoveries,2,'confirmed session may be cached');
});

test('a provisional session from empty Recorder data is rediscovered',async()=>{
 const changed=Date.now()-120000,id='binary_sensor.connected';let discoveries=0;
 const card=host(()=>Promise.resolve([]));card._activeTab='session';
 card._hass.states[id]={state:'on',last_changed:new Date(changed).toISOString()};
 card._hass.callApi=async(method,url)=>{if(url.includes(id))discoveries++;return [];};
 card._syncHistory();await flush();assert.equal(card._historyRange.start,changed);assert.equal(card._historySession,null);
 card._historyRequestedAt=0;card._syncHistory();await flush();assert.equal(discoveries,2);
});
const host=callApi=>Object.assign({isConnected:true,_offline:()=>false,_config:{show_session:true},_activeTab:'controls',_entities:{power:'sensor.power',connected:'binary_sensor.connected'},_hass:{states:{'sensor.power':{attributes:{unit_of_measurement:'kW'}}},callApi:(method,url)=>url.includes('binary_sensor.connected')?Promise.resolve([[{entity_id:'binary_sensor.connected',state:'on',last_changed:new Date(Date.now()-7200000).toISOString()}]]):callApi(method,url)},_render(){}},evccHistoryMethods);
test('history is lazy, deduplicates pending requests and throttles settled requests',async()=>{
 let calls=0,complete;const card=host(()=>{calls++;return new Promise(resolve=>complete=resolve);});
 card._syncHistory();assert.equal(calls,0);
 card._activeTab='session';card._syncHistory();await flush();card._syncHistory();assert.equal(calls,1);
 complete([]);await flush();card._syncHistory();assert.equal(calls,1);assert.equal(card._historyLoading,false);
});
test('late history from a previous loadpoint is ignored and failures clear old values',async()=>{
 let complete;const card=host(()=>new Promise(resolve=>complete=resolve));card._activeTab='session';card._syncHistory();await flush();
 card._resetHistory();complete([[row(0,'7')]]);await flush();assert.deepEqual(card._historyData,[]);
 card._hass.callApi=()=>Promise.reject(Error('recorder unavailable'));card._syncHistory();await flush();assert.equal(card._historyError,true);assert.deepEqual(card._historyData,[]);assert.equal(card._historyLoading,false);
});

test('session windows include pauses, preserve disconnected end and select the latest connection',()=>{
 const id='binary_sensor.connected',at=(offset,state)=>row(offset,state,id);
 assert.deepEqual(evccSessionWindow([[at(-7200000,'on'),at(-3600000,'on')]],id,end),{start:start-7200000,end,active:true});
 assert.deepEqual(evccSessionWindow([[at(-7200000,'on'),at(-1000,'off')]],id,end),{start:start-7200000,end:start-1000,active:false});
 assert.deepEqual(evccSessionWindow([[at(-7200000,'on'),at(-1000,'off'),at(1000,'on')]],id,end),{start:start+1000,end,active:true});
 assert.equal(evccSessionWindow([[at(0,'off')]],id,end),null);
 assert.equal(evccSessionWindow([[at(0,'on'),at(1000,'unavailable')]],id,end),null);
});
test('power request spans the entire connection, not the latest hour',async()=>{
 let url;const card=host((method,path)=>{url=path;return Promise.resolve([])});card._activeTab='session';
 const before=Date.now();card._syncHistory();await flush();
 const requested=Date.parse(decodeURIComponent(url.split('history/period/')[1].split('?')[0]));
 assert.ok(Math.abs(requested-(before-7200000))<1000);
});

test('a new connection discards pending power history from the previous session',async()=>{
 const pending=[],card=host(()=>new Promise(resolve=>pending.push(resolve)));card._activeTab='session';
 card._syncHistory();await flush();
 card._hass.states['binary_sensor.connected']={state:'on',last_changed:new Date(Date.now()-2000).toISOString()};
 card._syncHistory();await flush();
 assert.equal(pending.length,2);
 const point=value=>[[{entity_id:'sensor.power',state:String(value),last_changed:new Date(Date.now()-1000).toISOString()}]];
 pending[0](point(7));await flush();assert.deepEqual(card._historyData,[]);
 pending[1](point(5));await flush();assert.equal(card._historyData.at(-1).value,5);
});
