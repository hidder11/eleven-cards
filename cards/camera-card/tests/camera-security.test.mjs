import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCameraConfig,cameraDetections} from '../src/camera-utils.js';
import {cameraContactRows,cameraSecurityHeader,cameraSecurityMetrics,cameraContactList,cameraSecurityTabs,cameraVisibleEvents,cameraDetectionIndicators} from '../src/camera-security.js';
import {SECURITY_ART_KINDS,securityArt} from '../src/security-art.js';
import {CameraActivity} from '../src/camera-features.js';
import {cameraActivityTimeline} from '../src/camera-security.js';
const t=(nl,en)=>en;

test('timeline uses local calendar days across DST, full dates, and escaped labels',()=>{
 const events=[{id:'one',entity:'binary_sensor.a',camera:'camera.a',kind:'person',time:Date.parse('2026-10-26T00:15:00Z')},{id:'two',entity:'binary_sensor.b',kind:'door',time:Date.parse('2026-10-24T22:30:00Z')}];
 const html=cameraActivityTimeline(events,{name:()=>'<Front>',type:()=>'<Opened>',t,timeZone:'Europe/Amsterdam',now:Date.parse('2026-10-26T10:00:00Z')});
 assert.match(html,/Today/);assert.match(html,/Yesterday/);assert.match(html,/25-10-2026/);assert.match(html,/>01:15</);assert.match(html,/>00:30</);
 assert.match(html,/&lt;Front&gt;/);assert.ok(!html.includes('<Front>'));assert.match(html,/data-camera-activity="one"/);assert.match(html,/data-camera-activity="two"/);assert.ok(!html.includes('data-camera-details')&&!html.includes('mdi:information-outline'));
 assert.equal((html.match(/class="camera-activity-day"/g)||[]).length,2);
 assert.doesNotThrow(()=>cameraActivityTimeline(events,{name:()=>'',type:()=>'',t,timeZone:'Invalid/Zone'}));
});

test('security artwork keeps isolated paint IDs and rejects untrusted state and colour markup',()=>{
 const all=SECURITY_ART_KINDS.map(kind=>securityArt(kind));
 assert.equal(new Set(all.map(html=>html.match(/id="([^"]+)-shell"/)[1])).size,SECURITY_ART_KINDS.length);
 for(const [index,kind] of SECURITY_ART_KINDS.entries())assert.ok(all[index].includes('data-security-art="'+kind+'"'));
 assert.ok(!securityArt('triggered','" onload="alert(1)').includes('onload'));
 const invalid=securityArt('<script>');assert.match(invalid,/data-security-art="unknown"/);assert.ok(!invalid.includes('<script>'));
});

test('contact details belong to their own tabs, use native entity details and retain unknown states',()=>{
 const config=normalizeCameraConfig({door_sensors:[{entity:'binary_sensor.front',name:'<Front>'}],window_sensors:['binary_sensor.kitchen']});
 const hass={states:{'binary_sensor.front':{state:'off'},'binary_sensor.kitchen':{state:'unavailable'}}};
 const html=cameraContactList(config,hass,t,'doors')+cameraContactList(config,hass,t,'windows');
 assert.equal((html.match(/data-ui-detail-surface/g)||[]).length,2);
 assert.match(html,/data-entity="binary_sensor.front"/);assert.match(html,/&lt;Front&gt;/);
 assert.match(html,/data-contact-state="unknown"/);assert.ok(!html.includes(' hidden'));
 assert.ok(!html.includes('--ui-detail-tone'));
 assert.ok(!cameraSecurityMetrics(config,hass,t).includes('data-ui-detail-surface'));
 assert.deepEqual(cameraSecurityTabs(config,t).map(tab=>tab.value),['cameras','doors','windows','activity']);
 assert.deepEqual(cameraSecurityTabs({...config,show_security:false},t).map(tab=>tab.value),['cameras','activity']);
 assert.deepEqual(cameraSecurityTabs(normalizeCameraConfig({show_activity:false,door_sensors:['binary_sensor.front']}),t).map(tab=>tab.value),['cameras','doors']);
});

test('camera indicators reflect only configured detectors, including clear and offline unknown readings',()=>{
 const row={motion_entity:'binary_sensor.motion',person_entity:'binary_sensor.person'};
 const hass={states:{'binary_sensor.motion':{state:'off'},'binary_sensor.person':{state:'on'}}};
 const html=cameraDetectionIndicators(cameraDetections(hass,row).entries,t);
 assert.match(html,/data-detection-kind="motion" data-detection-state="clear"/);
 assert.match(html,/data-detection-kind="person" data-detection-state="active"/);
 assert.match(html,/aria-label="Person: Detected"/);assert.match(html,/data-camera-details="binary_sensor.person"/);
 assert.ok(!html.includes('<strong>')&&!html.includes('<small>'));assert.match(html,/title="Motion: No detection"/);
 const offline=cameraDetectionIndicators(cameraDetections({...hass,connected:false},row).entries,t);
 assert.equal((offline.match(/data-detection-state="unknown"/g)||[]).length,2);assert.ok(!offline.includes('No detection'));
 assert.equal(cameraDetectionIndicators(cameraDetections(hass,{}).entries,t),'');
});

test('last opening survives closing and activity limits, without using a closing timestamp',()=>{
 const config=normalizeCameraConfig({door_sensors:['binary_sensor.front'],activity_limit:1});
 const activity=new CameraActivity(),now=Date.now(),opened=now-60000;
 const hass=state=>({language:'en',config:{time_zone:'UTC'},states:{'binary_sensor.front':state}});
 const on={state:'on',last_changed:new Date(opened).toISOString()},off={state:'off',last_changed:new Date(now-1000).toISOString()};
 activity.ingest(config,hass(on),now);activity.ingest(config,hass(off),now);
 assert.equal(activity.lastOpened.get('binary_sensor.front'),opened);
 activity.merge([{entity:'binary_sensor.front',kind:'door',state:'on',time:opened-1000},{entity:'binary_sensor.front',kind:'door',state:'on',time:now+100000}]);
 assert.equal(activity.lastOpened.get('binary_sensor.front'),opened);
 const known=cameraContactList(config,hass(off),t,'doors',activity.lastOpened);
 assert.match(known,/Last opened/);assert.ok(known.includes(new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',hour:'2-digit',minute:'2-digit'}).format(opened)));
 const unknown=cameraContactList(config,hass(off),t,'doors');assert.ok(!unknown.includes('ui-detail-surface-hint'));assert.ok(!unknown.includes(new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',hour:'2-digit',minute:'2-digit'}).format(opened)));
 assert.ok(cameraContactList(config,{...hass(off),connected:false},t,'doors',activity.lastOpened).includes(new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',hour:'2-digit',minute:'2-digit'}).format(opened)));
 const dateHass={language:'en-US',config:{time_zone:'Europe/Amsterdam'},states:{'binary_sensor.front':{state:'on',last_changed:'2026-01-02T23:05:00Z'}}};
 const dated=cameraContactList(config,dateHass,t,'doors');assert.match(dated,/>00:05 03-01-2026</);assert.ok(!dated.includes('ui-detail-surface-hint'));
 activity.ingest(normalizeCameraConfig({}),hass(off),now);assert.equal(activity.lastOpened.size,0);
});

test('history retains last openings even when newer closing events fill the activity list',()=>{
 const activity=new CameraActivity(),time=Date.now()-60000;
 activity.merge([{entity:'binary_sensor.door',kind:'door',state:'on',time},{entity:'binary_sensor.door',kind:'door',state:'off',time:time+1000}],1);
 assert.equal(activity.events.length,1);assert.equal(activity.events[0].state,'off');assert.equal(activity.lastOpened.get('binary_sensor.door'),time);
});
test('contacts place open and unknown before closed, preserving order and never treating offline as closed',()=>{
 const rows=['closed','missing','open','also_open'].map(id=>({entity:'binary_sensor.'+id})),hass={states:{'binary_sensor.closed':{state:'off'},'binary_sensor.open':{state:'on'},'binary_sensor.also_open':{state:'on'}}};
 assert.deepEqual(cameraContactRows(rows,hass).map(row=>row.entity.split('.')[1]),['open','also_open','missing','closed']);
 assert.ok(cameraContactRows(rows,{...hass,connected:false}).every(row=>row.state==='unknown'));
});
test('security header preserves alarm unknown, localization and escaped HA text',()=>{
 const config=normalizeCameraConfig({cameras:['camera.front'],alarm_entity:'alarm_control_panel.home'});
 const hass={states:{'alarm_control_panel.home':{state:'armed_away'}}};
 assert.match(cameraSecurityHeader(config,hass,t),/>On</);assert.match(cameraSecurityHeader(config,hass,t),/Alarm armed/);
 assert.match(cameraSecurityHeader(config,{...hass,connected:false},t),/>Unknown</);
 const contacts=cameraContactList({...config,door_sensors:[{entity:'binary_sensor.door',name:'<script>alert(1)</script>'}]},{states:{}},t,'doors');
 assert.ok(!contacts.includes('<script>'));assert.match(contacts,/Unknown/);
});
test('metrics distinguish a partial unknown count from all unknown, and respect security visibility',()=>{
 const config=normalizeCameraConfig({cameras:['camera.front'],door_sensors:['binary_sensor.open','binary_sensor.unknown'],window_sensors:['binary_sensor.missing']});
 const html=cameraSecurityMetrics(config,{states:{'camera.front':{state:'idle'},'binary_sensor.open':{state:'on'}}},t,'doors');
 assert.match(html,/1 unknown/);assert.match(html,/data-security-contacts="doors"/);assert.match(html,/data-unavailable="true"/);
 assert.ok(!cameraSecurityMetrics({...config,show_security:false},{states:{}},t).includes('data-security-contacts'));
});
test('activity filtering respects visible profile cameras, time window and type without discarding later pages',()=>{
 const config=normalizeCameraConfig({cameras:['camera.front',{entity:'camera.hidden',show:false}],activity_limit:2});
 const events=[{camera:'camera.front',kind:'motion',time:10},{camera:'camera.front',kind:'person',time:30},{camera:'camera.hidden',kind:'person',time:40},{camera:'',kind:'doorbell',time:20}];
 assert.deepEqual(cameraVisibleEvents(events,config).map(row=>row.time),[30,20,10]);
 assert.deepEqual(cameraVisibleEvents(events,config,{camera:'camera.front',kind:'person',since:15}).map(row=>row.time),[30]);
 assert.deepEqual(cameraVisibleEvents(events,config,{since:50}),[]);
 const contacts=[...events,{camera:'',kind:'door',time:45},{camera:'',kind:'window',time:46}];
 assert.deepEqual(cameraVisibleEvents(contacts,config,{camera:'doors'}).map(event=>event.kind),['door']);
 assert.deepEqual(cameraVisibleEvents(contacts,config,{camera:'windows'}).map(event=>event.kind),['window']);
});

test('minute grouping deduplicates history IDs, preserves source/type/state and uses the newest real event',()=>{
 const config=normalizeCameraConfig({cameras:['camera.front','camera.garden'],activity_limit:20});
 const minute=Date.parse('2026-11-09T10:12:00Z');
 const event=(id,seconds,extra={})=>({id,entity:'binary_sensor.motion',camera:'camera.front',kind:'motion',time:minute+seconds*1000,...extra});
 const first=event('first',2),last=event('last',58);
 const rows=cameraVisibleEvents([first,last,last,event('next-minute',61),event('person',5,{kind:'person'}),event('garden',6,{camera:'camera.garden'}),event('other-sensor',7,{entity:'binary_sensor.other'}),event('open',8,{camera:'',entity:'binary_sensor.door',kind:'door',state:'on'}),event('closed',9,{camera:'',entity:'binary_sensor.door',kind:'door',state:'off'})],config);
 assert.equal(rows.length,7);
 assert.equal(rows.find(row=>row.id==='last').count,2);
 assert.equal(rows.find(row=>row.id==='last').time,last.time);
 assert.ok(rows.some(row=>row.id==='open')&&rows.some(row=>row.id==='closed'));
 assert.equal(rows[0].id,'next-minute');assert.equal(rows[0].count,1);
 assert.equal(first.count,undefined);
 const html=cameraActivityTimeline(rows,{name:()=>'<Front>',type:()=>'<Motion>',t,timeZone:'UTC'});
 assert.match(html,/&lt;Motion&gt; · 2×/);assert.match(html,/data-camera-activity="last"/);
 assert.equal(cameraVisibleEvents([first,last],config,{since:minute+30000})[0].count,1);
});

test('camera bursts do not consume the row budget before door/window events are grouped',()=>{
 const config=normalizeCameraConfig({cameras:['camera.front'],activity_limit:3});
 const minute=Math.floor((Date.now()-120000)/60000)*60000;
 const door={id:'door',entity:'binary_sensor.door',camera:'',kind:'door',state:'on',time:minute-2000};
 const window={id:'window',entity:'binary_sensor.window',camera:'',kind:'window',state:'off',time:minute-1000};
 const burst=Array.from({length:12},(_,index)=>({id:'motion-'+index,entity:'binary_sensor.motion',camera:'camera.front',kind:'motion',time:minute+index*1000}));
 const tracker=new CameraActivity();tracker.merge([door,window,...burst],config.activity_limit);tracker.merge(burst,config.activity_limit);
 const rows=cameraVisibleEvents(tracker.events,config);
 assert.deepEqual(rows.map(row=>[row.kind,row.count]),[['motion',12],['window',1],['door',1]]);
 assert.equal(tracker.lastOpened.get(door.entity),door.time);
});

test('live minute groups retain contacts and count new transitions only',()=>{
 const config=normalizeCameraConfig({cameras:[{entity:'camera.front',motion_entity:'binary_sensor.motion'}],door_sensors:['binary_sensor.door'],window_sensors:['binary_sensor.window'],activity_limit:3});
 const minute=Math.floor((Date.now()-120000)/60000)*60000,now=minute+60000,tracker=new CameraActivity();
 const state=(value,time)=>({state:value,last_changed:new Date(time).toISOString()});
 const hass={states:{'binary_sensor.motion':state('off',minute-4000),'binary_sensor.door':state('off',minute-4000),'binary_sensor.window':state('on',minute-4000)}};
 tracker.ingest(config,hass,now);
 hass.states['binary_sensor.door']=state('on',minute-2000);hass.states['binary_sensor.window']=state('off',minute-1000);tracker.ingest(config,hass,now);
 for(let index=0;index<12;index++){
  hass.states['binary_sensor.motion']=state('on',minute+index*2000);tracker.ingest(config,hass,now);tracker.ingest(config,hass,now);
  hass.states['binary_sensor.motion']=state('off',minute+index*2000+1000);tracker.ingest(config,hass,now);
 }
 for(const events of [tracker.observed,tracker.events])assert.deepEqual(cameraVisibleEvents(events,config).map(row=>[row.kind,row.count]),[['motion',12],['window',1],['door',1]]);
});
