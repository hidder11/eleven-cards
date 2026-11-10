import {uiEscape} from '../../../shared/ui-button.js';

// HA alarm_control_panel feature bits; trigger is an action, not an armed mode.
export const CAMERA_ALARM_MODES=[
 {value:'disarmed',service:'alarm_disarm',icon:'mdi:shield-off-outline',nl:'Uit',en:'Off'},
 {value:'armed_home',feature:1,service:'alarm_arm_home',icon:'mdi:home-outline',nl:'Thuis',en:'Home'},
 {value:'armed_away',feature:2,service:'alarm_arm_away',icon:'mdi:shield-check-outline',nl:'Afwezig',en:'Away'},
 {value:'armed_night',feature:4,service:'alarm_arm_night',icon:'mdi:weather-night',nl:'Nacht',en:'Night'},
 {value:'armed_vacation',feature:32,service:'alarm_arm_vacation',icon:'mdi:airplane',nl:'Vakantie',en:'Vacation'},
 {value:'armed_custom_bypass',feature:16,service:'alarm_arm_custom_bypass',icon:'mdi:shield-outline',nl:'Aangepast',en:'Custom'}
];
export function cameraAlarmModes(state){return CAMERA_ALARM_MODES.filter(mode=>!mode.feature||((Number(state?.attributes?.supported_features)||0)&mode.feature)!==0);}
export function cameraAlarmAvailable(hass,entity){return !!hass?.states?.[entity]&&!['unknown','unavailable'].includes(hass.states[entity].state)&&hass.connected!==false&&hass.connection?.connected!==false;}
export function cameraAlarmNeedsNative(state,mode){return mode!=='disarmed'&&state?.attributes?.code_arm_required===true;}
export function cameraAlarmNeedsCode(state,mode,disarmCode=true){return mode==='disarmed'&&disarmCode&&['number','text'].includes(state?.attributes?.code_format);}
export function cameraAlarmRequest(hass,entity,mode,code='',disarmCode=true){
 if(!entity?.startsWith('alarm_control_panel.')||!cameraAlarmAvailable(hass,entity))throw Error('unavailable');
 const state=hass.states[entity],target=cameraAlarmModes(state).find(row=>row.value===mode);
 if(!target)throw Error('unsupported');
 if(mode===state.state)throw Error('unchanged');
 if(cameraAlarmNeedsNative(state,mode))throw Error('native');
 const data={entity_id:entity};
 if(cameraAlarmNeedsCode(state,mode,disarmCode)){
  if(!code||(state.attributes.code_format==='number'&&!/^\d+$/.test(code)))throw Error('code');
  data.code=code;
 }
 return {domain:'alarm_control_panel',service:target.service,data};
}

export class CameraAlarmControls{
 constructor(node){this.node=node;this.selected=null;this.version=0;this.error='';this.pending=null;}
 disconnect(){this.version++;clearTimeout(this.timer);this.pending=null;const input=this.node.querySelector('input');if(input)input.value='';this.markup=null;}
 update(hass,entity,t,disarmCode=true){
  if(this.entity!==entity){this.disconnect();this.entity=entity;this.selected=null;this.error='';this.state=null;}
  if(this.disarmCode!==disarmCode){this.disconnect();this.disarmCode=disarmCode;}
  this.hass=hass;this.t=t;
  const state=hass?.states?.[entity],available=cameraAlarmAvailable(hass,entity),requested=this.pending?.mode;
  if(!available){if(this.pending)this.disconnect();this.error='';}
  if(this.pending&&(state?.state!==this.pending.from||!cameraAlarmModes(state).some(mode=>mode.value===this.pending.mode))){this.pending=null;clearTimeout(this.timer);this.version++;}
  if(this.state!==state?.state){this.selected=cameraAlarmModes(state).some(mode=>mode.value===state?.state)?state.state:requested??this.selected??'disarmed';this.error='';}
  this.state=state?.state;
  if(!cameraAlarmModes(state).some(mode=>mode.value===this.selected))this.selected='disarmed';
  this.render();
 }
 openNative(){const input=this.node.querySelector('input');if(input)input.value='';if(cameraAlarmAvailable(this.hass,this.entity)&&!this.pending)this.node.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:this.entity},bubbles:true,composed:true}));}
 pressKey(key){
  const input=this.node.querySelector('input'),state=this.hass?.states?.[this.entity];
  if(!input||input.disabled||this.pending||!cameraAlarmAvailable(this.hass,this.entity)||state?.attributes?.code_format!=='number'||!cameraAlarmNeedsCode(state,this.selected,this.disarmCode))return;
  const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;
  if(key==='clear'){input.value='';input.setSelectionRange(0,0);}
  else if(key==='backspace'){input.setRangeText('',start===end?Math.max(0,start-1):start,end,'end');}
  else if(/^\d$/.test(key))input.setRangeText(key,start,end,'end');
 }
 render(){
  const node=this.node,t=this.t,state=this.hass?.states?.[this.entity],available=cameraAlarmAvailable(this.hass,this.entity),modes=cameraAlarmModes(state),busy=!!this.pending;
  node.hidden=!this.entity;node.inert=!available;node.dataset.available=String(available);node.setAttribute('aria-label',t('Alarmbediening','Alarm controls'));node.setAttribute('aria-disabled',String(!available));
  if(!this.entity)return;
  const current=CAMERA_ALARM_MODES.find(mode=>mode.value===state?.state),other={arming:t('Inschakelen…','Arming…'),disarming:t('Uitschakelen…','Disarming…'),pending:t('Vertraging actief','Delay active'),triggered:t('Alarm geactiveerd','Alarm triggered')};
  const status=!available?t('Alarm niet beschikbaar','Alarm unavailable'):current?t(current.nl,current.en):other[state?.state]??t('Alarmstatus onbekend','Alarm status unknown');
  const same=state?.state===this.selected,needsCode=cameraAlarmNeedsCode(state,this.selected,this.disarmCode),canSubmit=available&&!busy&&!same&&typeof this.hass?.callService==='function';
  const nativeArming=cameraAlarmNeedsNative(state,'armed_away')&&modes.some(mode=>mode.feature);
  const nativeHint=nativeArming?`<div class="camera-alarm-native"><p>${t('Dit alarm vereist een code bij inschakelen. Kies de stand in Home Assistant.','This alarm requires a code to arm. Choose the mode in Home Assistant.')}</p><button type="button" data-ui-button="action" data-alarm-native ${!available||busy?'disabled':''}>${t('Alarmbediening openen','Open alarm controls')}</button></div>`:'';
  const numeric=state?.attributes?.code_format==='number';
  const keypad=needsCode&&!same&&numeric?'<div class="camera-alarm-keypad" role="group" aria-label="'+t('Pincode invoeren','Enter PIN')+'">'+['1','2','3','4','5','6','7','8','9','clear','0','backspace'].map(key=>'<button type="button" data-ui-button="action" data-alarm-key="'+key+'" '+(!canSubmit?'disabled':'')+' aria-label="'+(key==='clear'?t('Code wissen','Clear code'):key==='backspace'?t('Laatste cijfer verwijderen','Delete last digit'):key)+'">'+(key==='clear'?'<span>'+t('Wissen','Clear')+'</span>':key==='backspace'?'<ha-icon icon="mdi:backspace-outline" aria-hidden="true"></ha-icon>':key)+'</button>').join('')+'</div>':'';
  const markup=`<form class="camera-alarm-form"><div class="camera-alarm-status"><span>${t('Alarm','Alarm')}</span><strong role="status">${uiEscape(status)}</strong></div><div class="camera-alarm-modes" role="group" aria-label="${t('Alarmstand kiezen','Choose alarm mode')}" style="--alarm-columns:${Math.min(modes.length,3)}">${modes.map(mode=>`<button type="button" data-ui-button="action-choice" data-alarm-mode="${mode.value}" aria-pressed="${this.selected===mode.value}" ${!available||busy?'disabled':''}><ha-icon icon="${mode.icon}" aria-hidden="true"></ha-icon><span>${t(mode.nl,mode.en)}</span></button>`).join('')}</div>${nativeHint}${needsCode&&!same?`<label class="camera-alarm-code">${t('Pincode','Code')}<input type="password" name="alarm_code" autocomplete="off" ${state.attributes.code_format==='number'?'inputmode="none" pattern="[0-9]+"':'inputmode="text"'} required ${!canSubmit?'disabled':''}></label>`:''}${keypad}${needsCode&&!same?`<button type="submit" data-ui-button="action" class="camera-alarm-submit" ${!canSubmit?'disabled':''}><ha-icon icon="mdi:shield-off-outline" aria-hidden="true"></ha-icon><span>${busy?t('Opdracht verstuurd\u2026','Command sent\u2026'):t('Uitschakelen','Disarm')}</span></button>`:''}${busy?`<p class="camera-alarm-pending" role="status">${t('Wachten op alarmstatus\u2026','Waiting for alarm state\u2026')}</p>`:''}<p class="camera-alarm-feedback" role="status">${uiEscape(this.error)}</p></form>`;
  if(this.markup===markup)return;
  const focused=node.getRootNode().activeElement,focus=focused&&node.contains(focused)?focused.dataset.alarmMode??(focused.name==='alarm_code'?'code':focused.dataset.alarmKey?'key:'+focused.dataset.alarmKey:focused.type==='submit'?'submit':null):null;
  const previousInput=node.querySelector('input');if(previousInput)previousInput.value='';
  this.markup=markup;node.innerHTML=markup;
  node.querySelectorAll('[data-alarm-mode]').forEach(button=>button.onclick=()=>{if(!cameraAlarmAvailable(this.hass,this.entity)||this.pending)return;const mode=button.dataset.alarmMode;if(mode!==this.state&&cameraAlarmNeedsNative(this.hass.states[this.entity],mode)){this.openNative();return;}this.selected=mode;this.error='';this.render();if(this.selected===this.state)return;if(cameraAlarmNeedsCode(this.hass.states[this.entity],this.selected,this.disarmCode))this.node.querySelector('input')?.focus();else this.submit();});
  const nativeButton=node.querySelector('[data-alarm-native]');if(nativeButton)nativeButton.onclick=()=>this.openNative();
  node.querySelector('form').onsubmit=event=>{event.preventDefault();this.submit();};
  node.querySelectorAll('[data-alarm-key]').forEach(button=>button.onclick=()=>this.pressKey(button.dataset.alarmKey));
  if(focus){const next=focus==='code'?node.querySelector('input'):focus==='submit'?node.querySelector('[type="submit"]'):focus.startsWith('key:')?node.querySelector('[data-alarm-key="'+focus.slice(4)+'"]'):node.querySelector(`[data-alarm-mode="${focus}"]`);next?.focus({preventScroll:true});}
 }
 async submit(){
  if(this.pending||typeof this.hass?.callService!=='function')return;
  if(cameraAlarmNeedsNative(this.hass?.states?.[this.entity],this.selected)){this.openNative();return;}
  const input=this.node.querySelector('input');let request;
  try{request=cameraAlarmRequest(this.hass,this.entity,this.selected,input?.value??'',this.disarmCode);}
  catch(error){this.error=error.message==='code'?this.t('Vul een geldige pincode in.','Enter a valid code.'):this.t('Deze alarmstand is niet beschikbaar.','This alarm mode is unavailable.');this.render();return;}
  if(input)input.value='';
  const version=++this.version;this.pending={from:this.state,mode:this.selected};this.error='';this.render();
  // A resolved service call is not proof of a changed alarm state. Wait for HA.
  this.timer=setTimeout(()=>{if(this.version!==version||!this.pending)return;this.pending=null;this.error=this.t('Nog geen statuswijziging ontvangen. Controleer het alarm of probeer opnieuw.','No state change received yet. Check the alarm or try again.');this.render();},15000);
  try{await this.hass.callService(request.domain,request.service,request.data);}
  catch{if(this.version!==version)return;clearTimeout(this.timer);this.pending=null;this.error=this.t('Alarmopdracht mislukt. Controleer de code en je rechten en probeer opnieuw.','Alarm command failed. Check the code and your permissions and try again.');this.render();}
 }
}

export const cameraAlarmStyles=`
.camera-alarm-native{display:grid;gap:8px;margin-top:10px}.camera-alarm-native p{margin:0;color:var(--secondary-text-color);font-size:12px;line-height:1.5}.camera-alarm-native button{justify-self:start}.camera-alarm-form{padding:8px}.camera-alarm-status{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.camera-alarm-controls[data-available=false] .camera-alarm-status{position:static;width:auto;height:auto;margin:0 0 8px;clip-path:none;white-space:normal}.camera-alarm-status>span{font-size:11px;color:var(--secondary-text-color)}.camera-alarm-status strong{font-size:12px;font-weight:500;text-align:end;overflow-wrap:anywhere}.camera-alarm-modes{display:grid;grid-template-columns:repeat(var(--alarm-columns,3),minmax(0,1fr));gap:6px;padding:0;margin-bottom:0;border-radius:7px}.camera-alarm-modes button{display:flex;align-items:center;justify-content:center;gap:5px;min-width:0;min-height:44px;padding:6px 3px;border:1px solid var(--divider-color);border-radius:6px;background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color);font:inherit;font-size:11px;cursor:pointer}.camera-alarm-modes button[aria-pressed=true]{background:color-mix(in srgb,var(--primary-color) 24%,var(--ha-card-background,var(--card-background-color,#fff)));border-color:var(--primary-color);box-shadow:inset 0 0 0 1px var(--primary-color);color:var(--primary-text-color);font-weight:700}.camera-alarm-modes button:not(:disabled):hover{border-color:var(--primary-color)}.camera-alarm-modes ha-icon{--mdc-icon-size:17px;flex:none}.camera-alarm-submit{display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;width:100%;padding:8px;border:1px solid var(--primary-color);border-radius:7px;background:color-mix(in srgb,var(--primary-color) 16%,var(--ha-card-background,var(--card-background-color,#fff)));color:var(--primary-color);font:inherit;font-size:12px;font-weight:600;cursor:pointer}.camera-alarm-submit ha-icon{--mdc-icon-size:19px}.camera-alarm-form button:disabled{opacity:.45;cursor:default}.camera-alarm-form button:focus-visible,.camera-alarm-code input:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.camera-alarm-code{display:grid;gap:6px;font-size:11px;margin:0 0 10px;color:var(--secondary-text-color)}.camera-alarm-code input{width:100%;min-width:0;min-height:44px;box-sizing:border-box;padding:8px 10px;border:1px solid var(--divider-color);border-radius:6px;background:var(--secondary-background-color);color:var(--primary-text-color);font:inherit}.camera-alarm-feedback{font-size:11px;line-height:1.5;color:var(--error-color,#b34545);margin:10px 0 0}.camera-alarm-feedback:empty{display:none}.camera-alarm-pending{font-size:11px;line-height:1.5;color:var(--secondary-text-color);margin:8px 0 0}.camera-alarm-modes{margin-bottom:0}.camera-alarm-code{margin-top:10px}
@container(max-width:340px){.camera-alarm-modes button{flex-direction:column;gap:4px}.camera-alarm-status{gap:6px}.camera-alarm-status strong{font-size:11px}}
@media(forced-colors:active){.camera-alarm-modes button[aria-pressed=true]{border-color:Highlight}.camera-alarm-submit{border-color:ButtonText}}
`;
