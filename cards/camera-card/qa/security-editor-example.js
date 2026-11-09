import '../dist/eleven-camera-card.js';
import './fixture-icons.js';
import {uiEscape} from '../../../shared/ui-button.js';
import {uiActionButtonStyles} from '../../../shared/ui-action-button.js';
import {securityDesignConfig,securityDesignHass} from './security-design-data.js';
import {setupThemePreview} from './security-theme-preview.js';
import {scene} from './security-scene.js';

// Isolated design study: native demo fields, synthetic entities, no persistence.
const style=document.createElement('style');style.textContent=uiActionButtonStyles();document.head.append(style);
if(!customElements.get('ha-form'))customElements.define('ha-form',class extends HTMLElement{});
class EditorExampleFeed extends HTMLElement{
 set hass(value){if(!this.firstChild){this.innerHTML=scene(this.config.entity.includes('garden'));this.style.cssText='display:block;height:100%';this.firstChild.style.cssText='width:100%;height:100%;display:block';}}
}
customElements.define('editor-example-feed',EditorExampleFeed);
window.loadCardHelpers=async()=>({createCardElement:config=>{const feed=document.createElement('editor-example-feed');feed.config=config;return feed;}});
const config={...structuredClone(securityDesignConfig),title:'Beveiliging',card_background:false,activity_source:'history',activity_hours:24,activity_page_size:10,show_activity:true,show_security:true,show_alarm:true,show_contacts:true,alarm_disarm_code:true,columns:'auto',window_sensors:structuredClone(securityDesignConfig.window_sensors.slice(0,2))};
const card=document.createElement('eleven-camera-card');document.querySelector('#preview').append(card);
const hass=securityDesignHass();
hass.states[config.alarm_entity].attributes={supported_features:55,code_format:'number'};
hass.states['camera.side']={state:'streaming',attributes:{friendly_name:'Zijkant'}};
const cameraEntities=[['camera.front','Voordeur'],['camera.garden','Tuin'],['camera.side','Zijkant']];
const contacts={door_sensors:[['binary_sensor.front_door','Voordeur'],['binary_sensor.back_door','Achterdeur']],window_sensors:[['binary_sensor.living','Woonkamer'],['binary_sensor.kitchen','Keuken'],['binary_sensor.bedroom','Slaapkamer']]};
const detectors=Object.keys(hass.states).filter(entity=>/_(motion|person)$/.test(entity)).map(entity=>[entity,(entity.includes('front')?'Voordeur':'Tuin')+' · '+(entity.endsWith('motion')?'beweging':'persoon')]);
const now=Date.now(),stamp=ago=>new Date(now-ago*1000).toISOString();
hass.callApi=async()=>[
 [{entity_id:'binary_sensor.front_person',state:'on',last_changed:stamp(180)}],
 [{entity_id:'binary_sensor.garden_motion',state:'on',last_changed:stamp(360)}],
 [{entity_id:'binary_sensor.front_door',state:'on',last_changed:stamp(600)},{state:'off',last_changed:stamp(540)}]
];
hass.callService=async(domain,service,data)=>{
 if(domain!=='alarm_control_panel')return;
 hass.states[data.entity_id]={...hass.states[data.entity_id],state:service==='alarm_disarm'?'disarmed':service.replace('alarm_arm_','armed_')};card.hass={...hass};
};
let backgroundEditor;
const option=(value,label,current)=>`<option value="${uiEscape(value)}"${String(value)===String(current)?' selected':''}>${uiEscape(label)}</option>`;
const select=(label,field,current,choices,attrs='')=>`<label>${label}<select data-field="${field}" ${attrs}>${choices.map(([value,label])=>option(value,label,current)).join('')}</select></label>`;
const input=(label,field,value,attrs='')=>`<label>${label}<input data-field="${field}" value="${uiEscape(value??'')}" ${attrs}></label>`;
const close='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
function renderCameras(){
 document.querySelector('#cameras').innerHTML=config.cameras.map((row,index)=>{
  const attrs=`data-camera-index="${index}"`,available=cameraEntities.filter(([entity])=>entity===row.entity||!config.cameras.some(row=>row.entity===entity));
  return `<details class="camera-row" data-camera-row="${index}"><summary><span><strong data-camera-title="${index}">${uiEscape(row.name||row.entity)}</strong><small>${uiEscape(row.entity)}</small></span></summary><div class="camera-fields">${select('Camera-entiteit','entity',row.entity,available,attrs)}${input('Eigen naam (optioneel)','name',row.name,attrs)}<p class="help">Laat de naam leeg om de Home Assistant-naam te gebruiken.</p>${select('Sensor voor beweging','motion_entity',row.motion_entity??'',[['','Niet gekoppeld'],...detectors.filter(([entity])=>entity.endsWith('_motion'))],attrs)}${select('Sensor voor personen','person_entity',row.person_entity??'',[['','Niet gekoppeld'],...detectors.filter(([entity])=>entity.endsWith('_person'))],attrs)}<details class="subsection"><summary><span>Beeld en privacy</span></summary><div class="group-body extra-fields">${select('Beeldverhouding','aspect_ratio',row.aspect_ratio??'16:9',[['16:9','16:9 (breed)'],['4:3','4:3'],['1:1','1:1 (vierkant)'],['21:9','21:9 (ultrabreed)'],['9:16','9:16 (staand)']],attrs)}${select('Beeldvulling','fit_mode',row.fit_mode??'cover',[['cover','Vullen (bijsnijden)'],['contain','Volledig beeld (met randen)']],attrs)}${select('Beeldbron','camera_view',row.camera_view??'live',[['live','Live'],['auto','Momentopnamen']],attrs)}<label data-snapshot-row="${index}"${row.camera_view!=='auto'?' hidden':''}>Momentopname vernieuwen (seconden)<input type="number" min="5" max="3600" data-field="snapshot_interval" ${attrs} value="${row.snapshot_interval||15}"></label>${select('Entiteit voor privacymodus','privacy_entity',row.privacy_entity??'',[['','Niet gekoppeld'],['binary_sensor.bedroom','Slaapkamer · fictieve privacysensor']],attrs)}<p class="help">Bij privacy aan of een onbekende privacystatus wordt het beeld verborgen. Deze koppeling schakelt de camera zelf niet uit.</p></div></details><button type="button" data-remove-camera="${index}" data-ui-button="action">Camera verwijderen</button></div></details>`;
 }).join('');
 document.querySelector('#add-camera').disabled=config.cameras.length===cameraEntities.length;
}
function renderContacts(){
 for(const [group,target] of [['door_sensors','doors'],['window_sensors','windows']]){
  document.querySelector('#'+target).innerHTML=config[group].map((row,index)=>{
   const attrs=`data-contact-group="${group}" data-contact-index="${index}"`,available=contacts[group].filter(([entity])=>entity===row.entity||!config[group].some(row=>row.entity===entity));
   return `<div class="contact-row">${select(group==='door_sensors'?'Deursensor':'Raamsensor','entity',row.entity,available,attrs)}${input('Eigen naam (optioneel)','name',row.name,attrs)}<button type="button" class="remove" data-remove-contact="${group}" data-index="${index}" aria-label="${uiEscape((group==='door_sensors'?'Deur':'Raam')+' verwijderen: '+row.name)}">${close}</button></div>`;
  }).join('');
  document.querySelector(`[data-add-contact="${group}"]`).disabled=config[group].length===contacts[group].length;
 }
}
function sync(updateBackground=true){
 document.querySelector('[data-summary=doors]').textContent=config.door_sensors.length+' ingesteld';
 document.querySelector('[data-summary=windows]').textContent=config.window_sensors.length+' ingesteld';
 const background=config.card_background;
 document.querySelector('[data-summary=background]').textContent=background&&background.enabled!==false?'Aan · '+({aurora:'Aurora sky',ribbon:'Silk Flow',isobars:'Atmospheric flow','ink-bloom':'Ink bloom',hologram:'Holographic grid'}[background.variant]??'Atmospheric flow'):'Uit';
 document.querySelector('[data-summary=cameras]').textContent=config.cameras.length+' ingesteld';
 document.querySelector('[data-summary=alarm]').textContent=config.alarm_entity?(config.show_alarm?'Gekoppeld':'Verborgen')+(config.alarm_disarm_code?' · code bij uitschakelen':' · geen codevraag'):'Niet ingesteld';
 document.querySelector('[data-summary=contacts]').textContent=config.show_contacts?config.door_sensors.length+' deuren · '+config.window_sensors.length+' ramen':'Verborgen';
 document.querySelector('[data-summary=activity]').textContent=config.show_activity?(config.activity_source==='history'?'Geschiedenis · '+config.activity_hours+' uur':'Sinds openen')+' · '+config.activity_page_size+' per pagina':'Verborgen';
 document.querySelector('[data-summary=appearance]').textContent=(config.layout==='grid'?'Raster':'Focusweergave')+' · achtergrond '+(config.card_background&&config.card_background.enabled!==false?'aan':'uit');
 document.querySelector('#history-hours').hidden=config.activity_source!=='history';
 document.querySelector('#activity-settings').hidden=!config.show_activity;
 document.querySelector('#alarm-settings').hidden=!config.alarm_entity;
 const initial=document.querySelector('[data-setting=default_camera]');
 const selected=config.cameras.some(row=>row.entity===config.default_camera)?config.default_camera:(config.cameras[0]?.entity??'');
 initial.innerHTML=config.cameras.map(row=>option(row.entity,row.name||cameraEntities.find(([id])=>id===row.entity)?.[1]||row.entity,selected)).join('');
 document.querySelector('#default-camera').hidden=config.layout!=='focus'||config.cameras.length<2;
 document.querySelector('#columns').hidden=config.layout!=='grid';
 document.querySelector('[data-setting=alarm_disarm_code]').disabled=!config.alarm_entity;
 if(updateBackground)backgroundEditor?.setConfig(config);
 card.setConfig(config);card.hass={...hass,themes:{darkMode:!document.body.classList.contains('light')}};
}
document.querySelector('.editor').addEventListener('input',event=>{
 const field=event.target.dataset.field;if(!field)return;
 if(event.target.matches('input[type=number]')&&!event.target.validity.valid)return;
 const value=event.target.type==='number'?Number(event.target.value):event.target.value;
 if(event.target.dataset.cameraIndex!=null){
  const index=Number(event.target.dataset.cameraIndex);config.cameras[index][field]=value;
  if(field==='name')document.querySelector(`[data-camera-title="${index}"]`).textContent=value||config.cameras[index].entity;
  if(field==='camera_view')document.querySelector(`[data-snapshot-row="${index}"]`).hidden=value!=='auto';
  if(field==='entity'){renderCameras();document.querySelector(`[data-camera-row="${index}"]`).open=true;}
 }else if(event.target.dataset.contactGroup){config[event.target.dataset.contactGroup][Number(event.target.dataset.contactIndex)][field]=value;if(field==='entity')renderContacts();}
 sync();
});
document.querySelector('.editor').addEventListener('change',event=>{
 const key=event.target.dataset.setting;if(!key)return;
 if(event.target.type==='number'&&!event.target.validity.valid)return;
 config[key]=event.target.type==='checkbox'?event.target.checked:event.target.type==='number'?Number(event.target.value):event.target.value;sync();
});
document.querySelector('#title').oninput=event=>{config.title=event.target.value;sync();};
document.querySelector('.editor').addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.id==='add-camera'){
  const available=cameraEntities.find(([entity])=>!config.cameras.some(row=>row.entity===entity));if(!available)return;
  config.cameras.push({entity:available[0],name:available[1]});renderCameras();const row=document.querySelector('#cameras details:last-child');row.open=true;row.querySelector('input').focus();
 }else if(button.dataset.removeCamera!=null){config.cameras.splice(Number(button.dataset.removeCamera),1);renderCameras();document.querySelector('#add-camera').focus();}
 else if(button.dataset.addContact){const group=button.dataset.addContact,available=contacts[group].find(([entity])=>!config[group].some(row=>row.entity===entity));if(!available)return;config[group].push({entity:available[0],name:available[1]});renderContacts();}
 else if(button.dataset.removeContact){config[button.dataset.removeContact].splice(Number(button.dataset.index),1);renderContacts();document.querySelector(`[data-add-contact="${button.dataset.removeContact}"]`).focus();}
 else return;
 sync();
});
document.querySelector('#theme').onclick=event=>{const light=document.body.classList.toggle('light');event.target.textContent=light?'Donker thema':'Licht thema';};
document.querySelector('#width').onchange=event=>{document.querySelector('.editor').style.setProperty('--editor-width',event.target.value+'px');};
renderCameras();renderContacts();sync();
backgroundEditor=await card.constructor.getConfigElement();backgroundEditor.hass=hass;backgroundEditor.setConfig(config);
// This comparison renders only the shared background controls beside demo inputs.
const sharedBackground=backgroundEditor.shadowRoot.querySelector('details');sharedBackground.removeAttribute('slot');backgroundEditor.shadowRoot.prepend(sharedBackground);
document.querySelector('#background-editor').append(backgroundEditor);
const backgroundStyle=document.createElement('style');backgroundStyle.textContent='.native{display:none}details{border:0;padding:0;margin:0}summary{display:none}.settings{padding:0}';backgroundEditor.shadowRoot.append(backgroundStyle);backgroundEditor.shadowRoot.querySelector('details').open=true;
backgroundEditor.addEventListener('config-changed',event=>{Object.assign(config,event.detail.config);sync(false);});
await setupThemePreview(document.querySelector('.controls'),()=>sync(false));
window.editorExampleQA={card,config,backgroundEditor};
