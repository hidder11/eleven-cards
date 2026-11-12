import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMediaConfig,MEDIA_LAYOUTS,MEDIA_FEATURES,mediaCan,mediaRequest,mediaAvailability,mediaPosition,mediaTime,mediaArtwork} from '../src/media-utils.js';
const entity='media_player.room',attributes={supported_features:Object.values(MEDIA_FEATURES).reduce((a,b)=>a|b,0),source_list:['Radio','TV'],media_duration:120,media_position:20},hass={states:{[entity]:{state:'playing',attributes}},services:{media_player:Object.fromEntries(Object.keys(MEDIA_FEATURES).map(key=>[key,{}]))}};
test('configuration validates entity and offers five designs with independent visibility options',()=>{
 for(const layout of MEDIA_LAYOUTS)assert.equal(normalizeMediaConfig({entity,layout}).layout,layout);
 for(const entity of ['sensor.room','media_player.bad"',{},42])assert.throws(()=>normalizeMediaConfig({entity}));
 assert.equal(normalizeMediaConfig().entity,'');assert.equal(normalizeMediaConfig({layout:'bad'}).layout,'studio');assert.equal(normalizeMediaConfig({show_artwork:false}).show_artwork,false);assert.equal(normalizeMediaConfig({show_power:false}).show_volume,true);
});
test('feature flags and registered services both gate commands; missing and disconnected states block them',()=>{
 for(const service of Object.keys(MEDIA_FEATURES))assert.equal(mediaCan(hass,entity,service),service!=='turn_on');
 assert.equal(mediaCan({...hass,services:{}},entity,'media_play'),false);assert.equal(mediaCan({...hass,connected:false},entity,'media_play'),false);assert.equal(mediaCan({...hass,states:{}},entity,'media_play'),false);
 assert.equal(mediaCan({...hass,states:{[entity]:{state:'playing',attributes:{supported_features:1}}}},entity,'media_play'),false);
 for(const state of ['unknown','unavailable'])assert.throws(()=>mediaRequest({...hass,states:{[entity]:{state,attributes}}},entity,'volume_set',.4));
});
test('off only allows advertised power-on',()=>{const off={...hass,states:{[entity]:{state:'off',attributes}}};assert.ok(mediaCan(off,entity,'turn_on'));for(const service of ['turn_off','volume_set','media_play'])assert.equal(mediaCan(off,entity,service),false);});
test('service requests use exact entity targets and validate volume, source, mute and seek',()=>{
 assert.deepEqual(mediaRequest(hass,entity,'volume_set',0),{domain:'media_player',service:'volume_set',data:{volume_level:0},target:{entity_id:entity}});
 assert.deepEqual(mediaRequest(hass,entity,'volume_mute',true).data,{is_volume_muted:true});assert.deepEqual(mediaRequest(hass,entity,'select_source','Radio').data,{source:'Radio'});assert.deepEqual(mediaRequest(hass,entity,'media_seek',120).data,{seek_position:120});
 for(const [service,value] of [['volume_set',NaN],['volume_set',1.1],['volume_set',-.1],['volume_set','0.2'],['select_source','Other'],['volume_mute','true'],['media_seek',121],['media_seek',-1],['media_seek',null],['not_a_service',0]])assert.throws(()=>mediaRequest(hass,entity,service,value));
});
test('availability distinguishes empty configuration, missing, unknown, unavailable and offline',()=>{assert.equal(mediaAvailability(hass,''),'setup');assert.equal(mediaAvailability(hass,'media_player.missing'),'missing');assert.equal(mediaAvailability({...hass,connected:false},entity),'offline');assert.equal(mediaAvailability({...hass,connection:{connected:false}},entity),'offline');assert.equal(mediaAvailability(hass,entity),null);});
test('radio mode is explicit and keeps existing layouts compatible',()=>{assert.equal(normalizeMediaConfig().layout,'studio');assert.equal(normalizeMediaConfig().radio_mode,false);assert.equal(normalizeMediaConfig({radio_mode:true,layout:'classic'}).radio_mode,true);assert.equal(normalizeMediaConfig({radio_mode:'true'}).radio_mode,false);});
test('shared background settings reject unknown designs and clamp only finite strengths',()=>{
 assert.equal(normalizeMediaConfig({background:'aurora'}).background,'aurora');assert.equal(normalizeMediaConfig({background:'bad'}).background,'lanes');
 assert.equal(normalizeMediaConfig({background_strength:-10}).background_strength,0);assert.equal(normalizeMediaConfig({background_strength:110}).background_strength,100);assert.equal(normalizeMediaConfig({background_strength:35}).background_strength,35);
 for(const background_strength of [NaN,Infinity,'35',null])assert.equal(normalizeMediaConfig({background_strength}).background_strength,100);
 assert.equal(normalizeMediaConfig({animate_background:false}).animate_background,false);
});
test('position advances only while playing with a valid timestamp and clamps to duration',()=>{
 const now=Date.parse('2026-01-01T12:00:00Z'),attrs={media_position:20,media_duration:120,media_position_updated_at:'2026-01-01T11:59:30Z'};
 assert.deepEqual(mediaPosition({state:'playing',attributes:attrs},now),{duration:120,position:50});assert.equal(mediaPosition({state:'paused',attributes:attrs},now).position,20);assert.equal(mediaPosition({state:'playing',attributes:attrs},now+1e7).position,120);
 assert.equal(mediaPosition({state:'playing',attributes:{...attrs,media_position_updated_at:'bad'}},now).position,20);assert.equal(mediaPosition({state:'playing',attributes:{...attrs,media_position_updated_at:'2027-01-01'}},now).position,20);
 for(const value of [null,undefined,'20',Infinity])assert.equal(mediaPosition({attributes:{...attrs,media_position:value}}).position,null);
 assert.deepEqual(mediaPosition({attributes:{media_duration:0,media_position:0}}),{duration:null,position:null});
});
test('time formatting preserves zero and handles hour-long media',()=>{assert.equal(mediaTime(null),'—');assert.equal(mediaTime(0),'0:00');assert.equal(mediaTime(248),'4:08');assert.equal(mediaTime(3661),'1:01:01');});
test('artwork rejects executable and malformed URLs and prefers HA-local images',()=>{
 const image=value=>mediaArtwork({}, {attributes:{entity_picture:value}});
 for(const value of ['javascript:alert(1)','data:image/svg+xml;base64,AA','//outside/image','/bad\\path','https://bad/ x',{},null])assert.equal(image(value),'');
 assert.equal(image('/api/image'),'/api/image');assert.equal(image('https://example.com/cover.png'),'https://example.com/cover.png');assert.equal(mediaArtwork({hassUrl:path=>'https://ha.example'+path},{attributes:{entity_picture_local:'/api/local',entity_picture:'https://example.com/cover'}}),'https://ha.example/api/local');
});
test('station drafts retain typed spaces and play_media only sends validated media fields',()=>{
 const station={name:'Studio Jazz ',media_content_id:' media-source://radio_browser/test ',media_content_type:'music',unexpected:'drop'};
 const config=normalizeMediaConfig({stations:[station,{name:'Draft'}]});assert.equal(config.stations[0].name,'Studio Jazz ');assert.equal(config.stations[1].media_content_id,'');assert.equal(config.stations[1].media_content_type,'music');
 assert.deepEqual(mediaRequest(hass,entity,'play_media',config.stations[0]),{domain:'media_player',service:'play_media',data:{media_content_id:'media-source://radio_browser/test',media_content_type:'music'},target:{entity_id:entity}});
 for(const value of [null,{},config.stations[1],{media_content_id:'x',media_content_type:' '}])assert.throws(()=>mediaRequest(hass,entity,'play_media',value));
 const noFeature={...hass,states:{[entity]:{state:'playing',attributes:{supported_features:1}}}};assert.throws(()=>mediaRequest(noFeature,entity,'play_media',station));
});

test('absent or disabled legacy decoration stays off through normalized editor updates',()=>{const initial=normalizeMediaConfig({entity});assert.equal(initial.background,'none');assert.equal(normalizeMediaConfig({...initial,title:'Radio'}).background,'none');assert.equal(normalizeMediaConfig({entity,background:'none'}).background,'none');assert.equal(normalizeMediaConfig({entity,background:'aurora'}).background,'aurora');});
