import '../dist/eleven-camera-card.js';
import './fixture-icons.js';
import {scene} from './security-scene.js';
import {alarmFixture} from './alarm-fixture.js';
import {CARD_BACKGROUNDS} from '../../../shared/ui-card-background.js';
import {setupThemePreview} from './security-theme-preview.js';
import {SECURITY_ART_KINDS} from '../src/security-art.js';
class SecurityFeed extends HTMLElement{
 set hass(value){if(this.childNodes.length)return;const name=this.config.entity==='camera.front'?'Voordeur':'Tuin';this.innerHTML='<div style="height:100%;display:grid;place-items:center;background:linear-gradient(145deg,#35536a,#1b2b37);color:#adc8d7;font:12px system-ui;text-align:center"><div><svg width="88" height="64" viewBox="0 0 88 64" aria-hidden="true"><path d="M10 56V27L38 7l28 20v29M4 58h80M32 56V37h15v19M69 58V38h12v20" fill="none" stroke="currentColor" stroke-width="2"/></svg><div>Voorbeeldbeeld · '+name+'</div></div></div>';}
}
customElements.define('security-feed-preview',SecurityFeed);
window.loadCardHelpers=async()=>({createCardElement:config=>{if(config.type==='alarm-panel')return alarmFixture(config);const player=document.createElement('security-feed-preview');player.config=config;return player;}});
const card=document.querySelector('eleven-camera-card'),now=Date.now(),iso=seconds=>new Date(now-seconds*1000).toISOString();let scenario='quiet',historyError=false,detectionTime=now,alarmMode='armed_away';
const cameras=[{entity:'camera.front',name:'Voordeur',motion_entity:'binary_sensor.front_motion',person_entity:'binary_sensor.front_person'},{entity:'camera.garden',name:'Tuin',motion_entity:'binary_sensor.garden_motion',person_entity:'binary_sensor.garden_person'}];
const initial={'camera.front':{state:'streaming'},'camera.garden':{state:'idle'},'alarm_control_panel.home':{state:'armed_away',attributes:{supported_features:55,code_format:'number',code_arm_required:true}},'binary_sensor.front_motion':{state:'off'},'binary_sensor.front_person':{state:'off'},'binary_sensor.garden_motion':{state:'off'},'binary_sensor.garden_person':{state:'off'},'binary_sensor.front_door':{state:'off',attributes:{friendly_name:'Voordeur'}},'binary_sensor.back_door':{state:'off',attributes:{friendly_name:'Achterdeur'}},'binary_sensor.bedroom':{state:'off',attributes:{friendly_name:'Slaapkamer'}},'binary_sensor.kitchen':{state:'off',attributes:{friendly_name:'Keuken'}}};
const history=Object.entries({'binary_sensor.front_motion':[600,1800,3600],'binary_sensor.front_person':[610,1810],'binary_sensor.garden_motion':[1200]}).map(([id,times])=>times.map(seconds=>({entity_id:id,state:'on',last_changed:iso(seconds)})));
history.push([{entity_id:'binary_sensor.front_door',state:'on',last_changed:iso(900)},{state:'off',last_changed:iso(880)}],[{entity_id:'binary_sensor.kitchen',state:'on',last_changed:iso(720)},{state:'off',last_changed:iso(700)}]);
function update(){
 const states=structuredClone(initial),unknown=scenario==='unknown';states['alarm_control_panel.home'].state=alarmMode;if(unknown)for(const row of Object.values(states))row.state='unavailable';
 if(scenario==='person'){states['binary_sensor.front_person'].state='on';states['binary_sensor.front_person'].last_changed=new Date(detectionTime).toISOString();}
 if(scenario==='motion'){states['binary_sensor.garden_motion'].state='on';states['binary_sensor.garden_motion'].last_changed=new Date(detectionTime).toISOString();}
 if(scenario==='open'){states['binary_sensor.kitchen'].state='on';states['binary_sensor.kitchen'].last_changed=new Date(detectionTime).toISOString();}
 if(scenario==='alarm')states['alarm_control_panel.home'].state='triggered';
 card.hass={connected:scenario!=='offline',language:'nl',locale:{language:'nl'},config:{time_zone:'Europe/Amsterdam'},themes:{darkMode:!document.body.classList.contains('light')},states,callService:async(domain,service,data)=>{if(domain!=='alarm_control_panel')throw Error('Unsupported fixture action');if(service==='alarm_disarm'&&data.code!=='1234')throw Error('Synthetic incorrect PIN');alarmMode=service==='alarm_disarm'?'disarmed':service.replace('alarm_arm_','armed_');update();},callApiRaw:async(method,path)=>new Response(scene(path.includes('garden')).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" '),{status:200,headers:{'Content-Type':'image/svg+xml'}}),callApi:async()=>{if(historyError)throw Error('Fictieve geschiedenisfout');return history;}};
}
const cardConfig={cameras,layout:'grid',columns:2,card_background:false,color:'waiting',alarm_entity:'alarm_control_panel.home',door_sensors:['binary_sensor.front_door','binary_sensor.back_door'],window_sensors:['binary_sensor.bedroom','binary_sensor.kitchen'],activity_source:'history',activity_limit:20};
card.setConfig(cardConfig);update();
const controls=document.querySelector('.controls');
const layoutLabel=document.createElement('label');layoutLabel.textContent='Indeling';const layout=document.createElement('select');layout.id='layout';layout.innerHTML='<option value="grid">Raster</option><option value="focus">Focus</option>';layoutLabel.append(layout);controls.append(layoutLabel);layout.onchange=()=>{cardConfig.layout=layout.value;card.setConfig(cardConfig);};
card.addEventListener('qa-alarm-change',event=>{alarmMode=event.detail.state;update();});
const largeView=document.createElement('button');largeView.textContent='Camera openen · Voordeur';largeView.onclick=()=>card._openViewer('camera.front',largeView);controls.append(largeView);
const backgroundLabel=document.createElement('label');backgroundLabel.textContent='Achtergrond';
const backgroundChoices=['aurora','ribbon','isobars','ink-bloom','hologram','satin-waves','isometric-depth','comet-trails','lenticular-glow'].map(value=>CARD_BACKGROUNDS.find(row=>row.value===value));
const background=document.createElement('select');background.id='background';background.innerHTML=[{value:'none',label:'Geen'},...backgroundChoices].map(item=>`<option value="${item.value}">${item.label}</option>`).join('');backgroundLabel.append(background);controls.append(backgroundLabel);
background.onchange=()=>{cardConfig.card_background=background.value==='none'?false:{variant:background.value,coverage:'header',transparency:65,animated:true};card.setConfig(cardConfig);};
const modeLabel=document.createElement('label');modeLabel.textContent='Alarmstand / icoon';const mode=document.createElement('select');mode.id='alarm-mode';
const modeNames={disarmed:'Uitgeschakeld',armed_home:'Thuis',armed_away:'Afwezig',armed_night:'Nacht',armed_vacation:'Vakantie',armed_custom_bypass:'Aangepast',arming:'Inschakelen',pending:'Vertraging',triggered:'Alarm actief',unknown:'Onbekend',camera:'Alleen camera’s'};
mode.innerHTML=SECURITY_ART_KINDS.map(value=>`<option value="${value}">${modeNames[value]}</option>`).join('');mode.value=alarmMode;modeLabel.append(mode);controls.append(modeLabel);
mode.onchange=()=>{alarmMode=mode.value;scenario='quiet';document.querySelector('#scenario').value='quiet';cardConfig.alarm_entity=alarmMode==='camera'?'':'alarm_control_panel.home';card.setConfig(cardConfig);update();};
const motionOption=document.createElement('option');motionOption.value='motion';motionOption.textContent='Beweging in tuin';document.querySelector('#scenario').append(motionOption);
for(const [value,label] of [['doors','Deuren'],['windows','Ramen']]){const option=document.createElement('option');option.value=value;option.textContent=label;document.querySelector('#view').insertBefore(option,document.querySelector('#view option[value="activity"]'));}
document.querySelector('#scenario').onchange=event=>{scenario=event.target.value;detectionTime=Date.now();update();};
document.querySelector('#view').onchange=event=>card.shadowRoot.querySelector('.camera-security-tabs [data-ui-tab="'+event.target.value+'"]').click();
document.querySelector('#width').onclick=event=>{const narrow=document.querySelector('.preview').classList.toggle('narrow');event.target.textContent=narrow?'Brede kaart':'Smalle kaart';};
document.querySelector('#theme').onclick=event=>{const light=document.body.classList.toggle('light');event.target.textContent=light?'Donker thema':'Licht thema';update();};
document.querySelector('#history').onclick=event=>{historyError=!historyError;event.target.textContent=historyError?'Geschiedenis herstellen':'Geschiedenisfout';card._loadHistory(true);};
window.securityQA={card,checks(){const root=card.shadowRoot,box=root.querySelector('ha-card');return {overflow:box.scrollWidth>box.clientWidth+1,width:box.clientWidth,view:card._securityView,events:root.querySelectorAll('[data-camera-activity]').length,streams:[...card._tiles.values()].filter(tile=>!!tile.player.card).length,status:root.querySelector('.camera-primary').textContent.trim(),contacts:root.querySelector('.camera-security').textContent.trim(),historyError:!!card._historyError};}};

await setupThemePreview(controls,update);

if(new URLSearchParams(location.search).has('theme-checks'))await import('./security-theme-checks.js');
