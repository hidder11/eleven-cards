import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraViewerChannel,updateCameraViewer,releaseCameraViewer,subscribeCameraViewer} from '../src/camera-viewer-link.js';
import {normalizeCameraConfig} from '../src/camera-utils.js';

test('viewer links isolate IDs, refresh only their selected source and release on removal',()=>{
 const first={},second={},channel=cameraViewerChannel('room');let count=0;const listener=()=>count++;channel.listeners.add(listener);
 updateCameraViewer('room',first,'camera.front');assert.equal(channel.source,first);assert.equal(channel.entity,'camera.front');assert.equal(count,1);
 updateCameraViewer('other',second,'camera.garden');updateCameraViewer('room',second);assert.equal(count,1);
 updateCameraViewer('room',first);assert.equal(count,2);
 updateCameraViewer('room',second,'camera.garden');releaseCameraViewer('room',first);assert.equal(channel.source,second);
 releaseCameraViewer('room',second);assert.equal(channel.source,null);assert.equal(channel.entity,'');assert.equal(count,4);
 channel.listeners.delete(listener);releaseCameraViewer('room',second);releaseCameraViewer('other',second);
});
test('viewer IDs normalize and opt-in is empty by default',()=>{
 assert.equal(normalizeCameraConfig().viewer_target,'');
 assert.equal(normalizeCameraConfig({viewer_target:' room ',viewer_id:' viewer '}).viewer_target,'room');
 assert.equal(normalizeCameraConfig({viewer_id:' viewer '}).viewer_id,'viewer');
 assert.equal(normalizeCameraConfig({viewer_target:42}).viewer_target,'');
});

test('viewer defaults to the first visible camera and preserves manual selection until hidden',()=>{
 const id='default-camera-unit',source={_config:normalizeCameraConfig({cameras:[{entity:'camera.hidden',show:false},{entity:'camera.front'},{entity:'camera.garden'}]})};
 updateCameraViewer(id,source);
 const channel=cameraViewerChannel(id);
 assert.equal(channel.source,source);assert.equal(channel.entity,'camera.front');
 updateCameraViewer(id,source,'camera.garden');updateCameraViewer(id,source);
 assert.equal(channel.entity,'camera.garden');
 source._config.cameras[2].show=false;updateCameraViewer(id,source);
 assert.equal(channel.entity,'camera.front');
 source._config.cameras[1].show=false;updateCameraViewer(id,source);
 assert.equal(channel.entity,'');releaseCameraViewer(id,source);
});

test('all mounted sources observe viewer attachment before selection and unregister on cleanup',()=>{
 const id='late-unit-viewer',channel=cameraViewerChannel(id);let renders=0;
 const first={_render(){renders++;}},second={_render(){renders++;}};
 updateCameraViewer(id,first);updateCameraViewer(id,second);
 assert.equal(channel.source,first);assert.equal(channel.sources.size,2);
 const detach=subscribeCameraViewer(id,()=>{});assert.equal(renders,2);
 releaseCameraViewer(id,first);detach();assert.equal(renders,3);
 releaseCameraViewer(id,second);assert.notEqual(cameraViewerChannel(id),channel);
 releaseCameraViewer(id,second);
});

test('camera viewer normalization retains display flags and shared background settings',()=>{const config=normalizeCameraConfig({viewer_id:'review',show_names:false,show_status:false,show_last_detection:false,show_fullscreen:false,card_background:{variant:'isobars',enabled:true}});assert.equal(config.background,undefined);for(const key of ['show_names','show_status','show_last_detection','show_fullscreen'])assert.equal(config[key],false);assert.deepEqual(config.card_background,{variant:'isobars',enabled:true});assert.equal(normalizeCameraConfig({...config,title:'Viewer'}).background,undefined);});
