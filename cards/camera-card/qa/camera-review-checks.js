// Regression checks for PR review findings; synthetic entities and no screenshots.
export async function runCameraReviewChecks(card,hass,calls,check){
 const config=card._baseConfig,states=structuredClone(hass.states),details=[];
 const onDetails=event=>details.push(event.detail.entityId);
 card.addEventListener('hass-more-info',onDetails);
 try{
  const cameras=[{entity:'camera.front'},{entity:'camera.garden',privacy_entity:'switch.privacy'},{entity:'camera.inside'}];
  for(const layout of ['focus','tabs'])for(const [value,active,expected] of [['on','on','camera.inside'],['off','on','camera.garden'],['off','off','camera.inside'],['on','off','camera.garden'],['unknown','on','camera.inside'],['unavailable','on','camera.inside'],[null,'on','camera.inside']]){
   if(value===null)delete hass.states['switch.privacy'];else hass.states['switch.privacy']={state:value};
   card.shadowRoot.activeElement?.blur();card._hovered=false;card._focused=false;
   card.setConfig({...config,cameras:cameras.map(row=>({...row,...(row.privacy_entity?{privacy_state:active}:{})})),layout,auto_focus:false,auto_cycle:true,default_camera:'camera.front'});
   card.hass=hass;card.removeAttribute('data-motion-paused');card._selectCamera('camera.front',false);
   card._advanceCycle();
   check('Auto rotation respects privacy '+layout+'/'+value+'/'+active,card._activeCamera===expected);
   const blocked=card._config.cameras.find(row=>row.entity==='camera.garden');
   if(expected==='camera.inside')check('Blocked rotated feed has no live player '+layout+'/'+value+'/'+active,!!card._playbackBlocked(blocked)&&!card._tiles.get('camera.garden').player.card);
   card._cycle.stop();
  }
  card.setConfig({...config,auto_cycle:false});
  const alarm='alarm_control_panel.home';
  for(const format of ['number','text',undefined]){
   hass.states[alarm]={state:'disarmed',attributes:{supported_features:55,code_arm_required:true,...(format?{code_format:format}:{})}};
   card.hass=hass;
   const panel=card.shadowRoot.querySelector('.camera-alarm-controls'),before=calls.length,opened=details.length;
   check('Code-required arming explains native controls '+format,panel.textContent.includes('Home Assistant')&&!!panel.querySelector('[data-alarm-native]')&&panel.querySelector('[data-alarm-native]').getBoundingClientRect().height>=44);
   panel.querySelector('[data-alarm-mode="armed_away"]').click();
   check('Code-required mode opens HA without a command or changed state '+format,calls.length===before&&details.length===opened+1&&details.at(-1)===alarm&&hass.states[alarm].state==='disarmed'&&!card._alarmControls.pending&&!panel.querySelector('input')&&panel.querySelector('[data-alarm-mode="disarmed"]').getAttribute('aria-pressed')==='true');
   panel.querySelector('[data-alarm-native]').click();
   check('Explicit native alarm action opens entity details '+format,details.length===opened+2&&details.at(-1)===alarm&&calls.length===before);
   card.hass={...hass,connected:false};
   panel.querySelector('[data-alarm-native]').click();
   check('Offline native alarm controls are disabled '+format,details.length===opened+2&&panel.querySelector('[data-alarm-native]').disabled);
  }
 }finally{
  card.removeEventListener('hass-more-info',onDetails);hass.states=states;card.setConfig(config);card.hass=hass;card._cycle.stop();
 }
}
