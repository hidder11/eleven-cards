import '../dist/eleven-camera-card.js';
import './fixture-icons.js';
import {cameraActivityTimeline,cameraVisibleEvents} from '../src/camera-security.js';
import {securityDesignConfig,securityDesignHass} from './security-design-data.js';
import {setupThemePreview} from './security-theme-preview.js';
import {scene} from './security-scene.js';

// Isolated proposal. Never change the production tracker or merge real events.
class ActivityProposal extends customElements.get('eleven-camera-card'){
 _renderActivity(){
  super._renderActivity();if(!this._featureShell||this._securityView!=='activity')return;
  const events=cameraVisibleEvents(this._activity.events,this._config,{since:Date.now()-this._config.activity_hours*3600000});
  if(!events.length)return;
  const used=new Set(),titles=new Map(),descriptions=new Map(),display=[];
  const clock=time=>new Intl.DateTimeFormat('nl-NL',{timeZone:'Europe/Amsterdam',hour:'2-digit',minute:'2-digit'}).format(time);
  for(const event of events){
   if(used.has(event.id))continue;
   const name=this._activityName(event);
   if(event.kind==='person'){
    const motion=events.find(row=>row.kind==='motion'&&row.camera===event.camera&&Math.abs(row.time-event.time)<=15000&&!used.has(row.id));
    if(motion){used.add(motion.id);titles.set(event.id,'Persoon bij '+name);descriptions.set(event.id,'Ook beweging · 2 detecties');}
   }
   if(['door','window'].includes(event.kind)&&event.state==='off'){
    const opening=events.find(row=>row.entity===event.entity&&row.state==='on'&&row.time<event.time&&!used.has(row.id));
    if(opening){
     const minutes=Math.round((event.time-opening.time)/60000);used.add(opening.id);
     titles.set(event.id,name+' weer gesloten');descriptions.set(event.id,(minutes<1?'Minder dan 1 min':minutes+' min')+' open · '+clock(opening.time)+'–'+clock(event.time));
    }
   }
   display.push(event);
  }
  // In the example a motion can precede its paired person in descending time.
  const visible=display.filter(event=>!used.has(event.id));
  const markup=cameraActivityTimeline(visible,{name:event=>titles.get(event.id)??this._activityName(event),type:event=>descriptions.get(event.id)??this._activityType(event,{motion:'Beweging gedetecteerd',person:'Persoon gedetecteerd'}),t:nl=>nl,timeZone:'Europe/Amsterdam'});
  const node=this.shadowRoot.querySelector('.camera-activity-list'),focused=this.shadowRoot.activeElement?.dataset.cameraActivity;
  if(node.innerHTML!==markup){node.innerHTML=markup;if(focused)[...node.querySelectorAll('[data-camera-activity]')].find(button=>button.dataset.cameraActivity===focused)?.focus({preventScroll:true});}
 }
}
customElements.define('security-activity-proposal',ActivityProposal);
class ExampleFeed extends HTMLElement{
 set hass(value){if(!this.firstChild){this.innerHTML=scene(this.config.entity.includes('garden'));this.style.cssText='display:block;height:100%';this.firstChild.style.cssText='width:100%;height:100%;display:block';}}
}
customElements.define('activity-example-feed',ExampleFeed);
window.loadCardHelpers=async()=>({createCardElement:config=>{const feed=document.createElement('activity-example-feed');feed.config=config;return feed;}});
const current=document.createElement('eleven-camera-card'),proposal=document.createElement('security-activity-proposal'),cards=[current,proposal];
document.querySelector('#current').append(current);document.querySelector('#proposal').append(proposal);
const now=Date.now(),iso=ago=>new Date(now-ago*1000).toISOString();
const records=[
 [{entity_id:'binary_sensor.front_person',state:'off',last_changed:iso(400)},{state:'on',last_changed:iso(90)}],
 [{entity_id:'binary_sensor.front_motion',state:'off',last_changed:iso(400)},{state:'on',last_changed:iso(95)}],
 [{entity_id:'binary_sensor.front_door',state:'off',last_changed:iso(200000)},{state:'on',last_changed:iso(600)},{state:'off',last_changed:iso(480)}],
 [{entity_id:'binary_sensor.kitchen',state:'off',last_changed:iso(200000)},{state:'on',last_changed:iso(2100)},{state:'off',last_changed:iso(1800)}],
 [{entity_id:'binary_sensor.garden_motion',state:'off',last_changed:iso(90000)},{state:'on',last_changed:iso(85000)}]
];
let scenario='normal';
function update(){
 for(const card of cards){
  const config={...structuredClone(securityDesignConfig),card_background:false,activity_source:'history',activity_hours:48};
  if(scenario==='long')config.cameras[0].name='Voordeur bij de overdekte ingang naast de garage';
  const hass=securityDesignHass('quiet',document.body.classList.contains('light'));
  hass.states[config.alarm_entity].attributes={supported_features:55};
  hass.callApi=async()=>{if(scenario==='error')throw Error('Synthetic history failure');return scenario==='empty'?[]:structuredClone(records);};
  hass.callApiRaw=async()=>new Response(scene(false).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" '),{headers:{'Content-Type':'image/svg+xml'}});
  hass.callService=async(domain,service)=>{if(domain==='alarm_control_panel'){const state=service==='alarm_disarm'?'disarmed':service.replace('alarm_arm_','armed_');card.hass={...hass,states:{...hass.states,[config.alarm_entity]:{...hass.states[config.alarm_entity],state}}};}};
  card.setConfig(config);card._selectSecurityView('activity');card.hass=hass;
 }
}
document.querySelector('#width').onchange=event=>{for(const node of document.querySelectorAll('.preview'))node.style.width=event.target.value+'px';};
document.querySelector('#scenario').onchange=event=>{
 scenario=event.target.value;
 for(const card of cards){card._activity.events=[];card._historyKey=null;card._historyVersion++;card._historyLoading=false;}
 update();
};
document.querySelector('#theme').onclick=event=>{const light=document.body.classList.toggle('light');event.target.textContent=light?'Donker thema':'Licht thema';update();};
update();await setupThemePreview(document.querySelector('.controls'),update);
// Compare just the activity tab; the production card keeps its complete header.
for(const card of cards){const style=document.createElement('style');style.textContent='.header-region,.camera-security-tabs>[data-ui-tabs]{display:none!important}';card.shadowRoot.append(style);}
window.activityExampleQA={cards};
if(new URLSearchParams(location.search).has('checks')){
 const checks=[],check=(name,value)=>{if(!value)throw Error(name);checks.push(name);};
 try{
  await new Promise(resolve=>setTimeout(resolve,150));
  check('Proposal reduces duplicate and paired contact events',proposal.shadowRoot.querySelectorAll('.camera-event').length<current.shadowRoot.querySelectorAll('.camera-event').length);
  check('Proposal labels combined camera detections',proposal.shadowRoot.textContent.includes('Ook beweging · 2 detecties'));
  check('Proposal shows duration from actual opening and closing timestamps',proposal.shadowRoot.textContent.includes('2 min open')&&proposal.shadowRoot.textContent.includes('5 min open'));
  for(const card of cards)check('No obsolete activity toolbar',!card.shadowRoot.querySelector('.camera-activity-source,[data-camera-history-refresh]'));
  proposal.scrollIntoView({block:'center'});proposal.shadowRoot.querySelector('[data-camera-activity]').click();await new Promise(resolve=>setTimeout(resolve,80));
  check('Grouped camera event still opens its actual camera',proposal._viewer.open&&proposal._viewerEntity==='camera.front');proposal._closeViewer();
  document.querySelector('#width').value='260';document.querySelector('#width').dispatchEvent(new Event('change'));
  document.querySelector('#scenario').value='long';document.querySelector('#scenario').dispatchEvent(new Event('change'));await new Promise(resolve=>setTimeout(resolve,80));
  check('Long proposal names fit a narrow card',[...proposal.shadowRoot.querySelectorAll('.camera-event')].every(node=>node.scrollWidth<=node.clientWidth+1));
  document.querySelector('#checks').textContent=JSON.stringify({pass:true,checks});
 }catch(error){document.querySelector('#checks').textContent=JSON.stringify({pass:false,error:String(error),checks});}
}
