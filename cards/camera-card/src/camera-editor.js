import {normalizeCameraConfig,cameraDutch,CAMERA_RATIOS,visibleCameras} from './camera-utils.js';
import {cameraShowAlarm,cameraShowContacts} from './camera-features.js';
import {uiButton,uiButtonStyles} from '../../../shared/ui-button.js';
import {headerBackgroundOptions} from '../../../shared/header-backgrounds.js';

export class CameraEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._rows=new Map();this._contactRows=new Map();}
 get cardBackgroundSlot(){return 'card-background';}
 setConfig(config){this._config=normalizeCameraConfig(config);this._render();}
 set hass(value){this._hass=value;this._render();}get hass(){return this._hass;}
 _save(input){
  const next={...input};
  for(const [field,key] of [['camera_entities','cameras'],['door_entities','door_sensors'],['window_entities','window_sensors']]){
   if(Array.isArray(next[field]))next[key]=next[field].map(entity=>this._config[key].find(row=>row.entity===entity)??{entity});delete next[field];
  }
  this._config=normalizeCameraConfig(next);this._render();this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:structuredClone(this._config)},bubbles:true,composed:true}));
 }
 _group(parent,key,title,summary='',nested=false){
  let node=[...parent.children].find(node=>node.dataset?.group===key);
  if(!node){node=document.createElement('details');node.dataset.group=key;node.className=nested?'subsection':'section';node.innerHTML='<summary><span></span><small></small></summary><div class="group-body"></div>';parent.append(node);if(key==='cameras')node.open=true;}
  node.querySelector(':scope > summary > span').textContent=title;node.querySelector(':scope > summary > small').textContent=summary;node.querySelector(':scope > summary > small').hidden=!summary;
  return node.querySelector(':scope > .group-body');
 }
 _formAt(parent,key,schema,data,change){
  let form=[...parent.children].find(node=>node.dataset?.form===key);
  if(!form){form=document.createElement('ha-form');form.dataset.form=key;parent.append(form);form.addEventListener('value-changed',event=>{event.stopPropagation();change(event.detail.value);});}
  Object.assign(form,{hass:this._hass,schema,data,computeLabel:item=>this._labels[item.name]??item.name,computeHelper:item=>this._helpers[item.name]});return form;
 }
 _render(){
  if(!this._config||!this._hass)return;
  const c=this._config,t=(nl,en)=>cameraDutch(this._hass)?nl:en;
  const entity=(name,domain,multiple=false)=>({name,selector:{entity:{domain,...(multiple?{multiple:true}:{})}}}),bool=name=>({name,selector:{boolean:{}}}),text=name=>({name,selector:{text:{}}});
  const number=(name,min,max)=>({name,selector:{number:{min,max,step:1,mode:'box'}}}),select=(name,options)=>({name,selector:{select:{mode:'dropdown',options}}});
  const option=(value,nl,en=nl)=>({value,label:t(nl,en)}),inherit=option('','Kaartinstelling','Card default');
  const views=[option('live','Live'),option('auto','Momentopnamen','Snapshots')],fits=[option('cover','Vullen (bijsnijden)','Fill (crop)'),option('contain','Volledig beeld (met randen)','Full image (with borders)')];
  this._labels={title:t('Kaartnaam (voor schermlezers)','Card name (for screen readers)'),camera_entities:t('Camera-entiteiten','Camera entities'),name:t('Eigen naam (optioneel)','Custom name (optional)'),motion_entity:t('Sensor voor beweging','Motion sensor'),person_entity:t('Sensor voor personen','Person sensor'),last_detection_entity:t('Tijdstip laatste detectie (optioneel)','Last detection timestamp (optional)'),show:t('Camera tonen','Show camera'),icon:t('Icoon','Icon'),camera_view:t('Beeldbron','Image source'),aspect_ratio:t('Beeldverhouding','Aspect ratio'),fit_mode:t('Beeldvulling','Image fit'),snapshot_interval:t('Momentopname vernieuwen (seconden)','Snapshot refresh (seconds)'),privacy_entity:t('Entiteit voor privacymodus','Privacy entity'),privacy_state:t('Privacy actief bij','Privacy active when'),show_alarm:t('Alarm tonen','Show alarm'),alarm_entity:t('Alarm-entiteit','Alarm entity'),alarm_disarm_code:t('Code vragen bij uitschakelen','Ask for a code when disarming'),show_contacts:t('Deuren en ramen tonen','Show doors and windows'),door_entities:t('Deursensoren','Door sensors'),window_entities:t('Raamsensoren','Window sensors'),show_activity:t('Activiteiten tonen','Show activity'),activity_source:t('Gebeurtenissen ophalen uit','Get events from'),activity_hours:t('Terugkijken (uren)','Look back (hours)'),activity_page_size:t('Gebeurtenissen per pagina','Events per page'),layout:t('Indeling camerabeelden','Camera layout'),columns:t('Aantal kolommen','Number of columns'),default_camera:t('Camera bij openen','Initial camera'),compact:t('Compacte kaartweergave','Compact card layout'),show_names:t('Cameranamen tonen','Show camera names'),show_status:t('Status en detectie-iconen tonen','Show status and detection icons'),show_last_detection:t('Laatste detectie tonen','Show last detection'),show_navigation:t('Navigatieknoppen tonen','Show navigation buttons'),auto_cycle:t('Automatisch wisselen','Automatically switch cameras'),cycle_interval:t('Wisselinterval (seconden)','Switch interval (seconds)'),background:t('Bestaande achtergrond','Existing background'),background_strength:t('Achtergrondsterkte','Background intensity'),animate_background:t('Achtergrond animeren','Animate background')};
  this._helpers={name:t('Laat leeg om de naam uit Home Assistant te gebruiken.','Leave empty to use the Home Assistant name.'),camera_entities:t('Kies camera’s; pas de volgorde hieronder aan.','Choose cameras; reorder them below.'),snapshot_interval:t('Leeg = kaartinstelling; 0 = normale HA-weergave; vanaf 5 seconden automatisch vernieuwen.','Empty = card default; 0 = native HA view; automatic refresh from 5 seconds.'),privacy_entity:t('Actieve of onbekende privacy verbergt het beeld. Deze koppeling schakelt de camera zelf niet uit.','Active or unknown privacy hides the image. This mapping does not switch off the camera itself.'),alarm_disarm_code:t('Inschakelen gebeurt direct. Bij uitschakelen vraagt de kaart een code, met een numpad voor cijfercodes. De alarmintegratie controleert de code.','Arming is immediate. Disarming asks for a code, with a keypad for numeric codes. The alarm integration validates it.'),show_contacts:t('Verbergt alleen het overzicht en de tabbladen. De sensoren blijven beschikbaar voor Activiteiten.','Only hides the overview and tabs. Sensors remain available for Activity.'),activity_source:t('Eerdere gebeurtenissen vereisen Recorder-geschiedenis voor de gekoppelde sensoren. De kaart bewaart geen beelden of videoclips.','Earlier events require Recorder history for mapped sensors. The card stores no images or clips.'),activity_page_size:t('Herhalingen van dezelfde bron, gebeurtenis en status binnen één minuut delen één regel. Openen en sluiten blijven apart.','Repeats of the same source, event and state within one minute share one row. Opening and closing remain separate.'),last_detection_entity:t('Optionele tijdstipsensor voor eerdere detecties.','Optional timestamp sensor for earlier detections.')};
  if(!this._shell){
   this.shadowRoot.innerHTML=`<style>${uiButtonStyles()}
    :host{display:block;min-width:0;color:var(--primary-text-color);container-type:inline-size}*{box-sizing:border-box}ha-form{display:block;min-width:0}details{min-width:0}summary{display:grid;grid-template-columns:10px minmax(0,1fr);gap:2px 10px;align-items:center;min-height:52px;padding:12px;cursor:pointer;list-style:none;font-size:13px;font-weight:500;overflow-wrap:anywhere}summary::-webkit-details-marker{display:none}summary::before{content:'';grid-column:1;grid-row:1;width:7px;height:7px;border-right:2px solid var(--secondary-text-color);border-bottom:2px solid var(--secondary-text-color);transform:rotate(-45deg)}details[open]>summary::before{transform:rotate(45deg)}summary>span,summary>small{grid-column:2}summary>small{font-size:12px;font-weight:400;color:var(--secondary-text-color)}.section{border-bottom:1px solid var(--divider-color)}.section>summary{padding:12px 0;min-height:72px;font-size:14px;font-weight:600}.section:last-child{border-bottom:0}.group-body{display:grid;gap:12px;min-width:0;padding:0 0 16px 20px}.subsection,.camera-row,.contact-row{border-radius:var(--eleven-material-radius-well,var(--ha-card-border-radius,12px));background:var(--secondary-background-color);box-shadow:var(--eleven-material-well,none)}.subsection>.group-body,.camera-row>.group-body,.contact-row>.group-body{padding:0 12px 12px 32px}.camera-row .subsection{background:transparent;box-shadow:none;border:1px solid var(--divider-color)}.camera-settings{display:grid;gap:8px;min-width:0}.row-actions{display:flex;justify-content:flex-end;gap:8px}.row-actions button{min-width:44px;min-height:44px}.row-actions ha-icon{--mdc-icon-size:20px}summary:focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:2px}[hidden]{display:none!important}@container(max-width:340px){.section>.group-body{padding-left:0}.subsection>.group-body,.camera-row>.group-body,.contact-row>.group-body{padding-left:12px}}
   </style><div class="editor-sections"></div>`;this._shell=this.shadowRoot.querySelector('.editor-sections');
  }
  const save=value=>this._save({...this._config,...value});
  this._form=this._formAt(this._shell,'title',[text('title')],c,save);
  const cameras=this._group(this._shell,'cameras',t('Camera’s','Cameras'),c.cameras.length+' '+t('ingesteld','configured'));
  this._formAt(cameras,'camera-picker',[entity('camera_entities','camera',true)],{camera_entities:c.cameras.map(row=>row.entity)},save);
  if(!this._cameraList){this._cameraList=document.createElement('div');this._cameraList.className='camera-settings';cameras.append(this._cameraList);}
  this._renderRows(t,select,entity,bool,text,number,inherit,views,fits);
  const defaults=this._group(cameras,'defaults',t('Standaard beeldinstellingen','Default image settings'),'',true);
  this._formAt(defaults,'defaults',[select('camera_view',views),select('aspect_ratio',CAMERA_RATIOS.map(value=>option(value,value))),select('fit_mode',fits),...(c.camera_view==='auto'?[number('snapshot_interval',0,3600)]:[])],c,save);
  const alarm=this._group(this._shell,'alarm',t('Alarm','Alarm'),!cameraShowAlarm(c)?t('Verborgen','Hidden'):c.alarm_entity?t('Gekoppeld','Configured'):t('Niet ingesteld','Not configured'));
  this._formAt(alarm,'alarm',[bool('show_alarm'),entity('alarm_entity','alarm_control_panel'),...(c.alarm_entity?[bool('alarm_disarm_code')]:[])],{...c,show_alarm:cameraShowAlarm(c)},save);
  const contacts=this._group(this._shell,'contacts',t('Deuren en ramen','Doors and windows'),cameraShowContacts(c)?c.door_sensors.length+' '+t('deuren','doors')+' · '+c.window_sensors.length+' '+t('ramen','windows'):t('Verborgen','Hidden'));
  this._formAt(contacts,'contacts',[bool('show_contacts')],{show_contacts:cameraShowContacts(c)},save);
  for(const [key,field,nl,en] of [['door_sensors','door_entities','Deuren','Doors'],['window_sensors','window_entities','Ramen','Windows']]){
   const body=this._group(contacts,key,t(nl,en),c[key].length+' '+t('ingesteld','configured'),true);
   this._formAt(body,key,[entity(field,'binary_sensor',true)],{[field]:c[key].map(row=>row.entity)},save);this._renderContacts(body,key,text);
  }
  const activity=this._group(this._shell,'activity',t('Activiteiten','Activity'),c.show_activity?(c.activity_source==='history'?c.activity_hours+' '+t('uur','hours'):t('Sinds openen','Since opening'))+' · '+c.activity_page_size+' '+t('per pagina','per page'):t('Verborgen','Hidden'));
  this._formAt(activity,'activity',[bool('show_activity'),...(c.show_activity?[select('activity_source',[option('history','Home Assistant-geschiedenis','Home Assistant history'),option('session','Sinds openen van de kaart','Since opening the card')]),...(c.activity_source==='history'?[number('activity_hours',1,72)]:[]),number('activity_page_size',1,50)]:[])],c,save);
  const layoutLabels={grid:t('Raster','Grid'),focus:t('Focus (één camera tegelijk)','Focus (one camera at a time)'),tabs:t('Tabbladen','Tabs'),sidebar:t('Groot beeld met zijbeelden','Large feed with side feeds'),filmstrip:t('Filmstrip','Filmstrip'),wall:t('Camerawand','Camera wall')},layouts=['grid','focus'];if(!layouts.includes(c.layout))layouts.push(c.layout);
  const appearance=this._group(this._shell,'appearance',t('Weergave','Appearance'),layoutLabels[c.layout]);
  this._formAt(appearance,'appearance',[select('layout',layouts.map(value=>({value,label:layoutLabels[value]}))),...(c.layout==='grid'?[select('columns',[option('auto','Automatisch','Automatic'),...[1,2,3].map(value=>option(String(value),String(value)))])]:visibleCameras(c).length>1?[select('default_camera',visibleCameras(c).map(row=>({value:row.entity,label:this._name(row)})))]:[]),bool('compact')],{...c,columns:String(c.columns)},save);
  const extra=this._group(appearance,'extra',t('Extra weergave-instellingen','Additional display settings'),'',true);
  this._formAt(extra,'extra',[bool('show_names'),bool('show_status'),...(c.show_status?[bool('show_last_detection')]:[]),...(['focus','tabs'].includes(c.layout)?[bool('show_navigation'),bool('auto_cycle'),...(c.auto_cycle?[number('cycle_interval',5,3600)]:[])]:[]),...(c.card_background===undefined?[select('background',headerBackgroundOptions(cameraDutch(this._hass))),number('background_strength',0,100),bool('animate_background')]:[])],c,save);
  if(!this._backgroundSlot){this._backgroundSlot=document.createElement('slot');this._backgroundSlot.name=this.cardBackgroundSlot;appearance.append(this._backgroundSlot);}
 }
 _name(row){return row.name||this._hass.states?.[row.entity]?.attributes?.friendly_name||row.entity;}
 _renderRows(t,select,entity,bool,text,number,inherit,views,fits){
  const c=this._config,list=this._cameraList;
  for(const [id,node] of this._rows)if(!c.cameras.some(row=>row.entity===id)){node.remove();this._rows.delete(id);}
  c.cameras.forEach((row,index)=>{
   let node=this._rows.get(row.entity);
   if(!node){node=document.createElement('details');node.className='camera-row';node.innerHTML='<summary><span></span><small></small></summary><div class="group-body"></div>';this._rows.set(row.entity,node);}
   if(list.children[index]!==node)list.insertBefore(node,list.children[index]??null);
   node.querySelector('summary span').textContent=this._name(row)+(row.show===false?t(' · Verborgen',' · Hidden'):'');node.querySelector('summary small').textContent=row.entity;
   const body=node.querySelector('.group-body'),save=value=>this._save({...this._config,cameras:this._config.cameras.map(item=>item.entity===row.entity?{...item,...value}:item)});
   this._formAt(body,'main',[text('name'),entity('motion_entity','binary_sensor'),entity('person_entity','binary_sensor')],{...row,motion_entity:row.motion_entity??'',person_entity:row.person_entity??''},save);
   const extra=this._group(body,'image',t('Beeld en privacy','Image and privacy'),'',true),snapshot=(row.camera_view??c.camera_view)==='auto';
   this._formAt(extra,'image',[select('camera_view',[inherit,...views]),select('aspect_ratio',[inherit,...CAMERA_RATIOS.map(value=>({value,label:value}))]),select('fit_mode',[inherit,...fits]),...(snapshot?[number('snapshot_interval',0,3600)]:[]),entity('privacy_entity',['switch','input_boolean','binary_sensor']),...(row.privacy_entity?[select('privacy_state',[{value:'on',label:t('Aan','On')},{value:'off',label:t('Uit','Off')}])]:[]),{name:'icon',selector:{icon:{}}},bool('show'),{name:'last_detection_entity',selector:{entity:{domain:'sensor',device_class:'timestamp'}}}],{...row,show:row.show!==false,camera_view:row.camera_view??'',aspect_ratio:row.aspect_ratio??'',fit_mode:row.fit_mode??'',privacy_entity:row.privacy_entity??'',privacy_state:row.privacy_state??'on',last_detection_entity:row.last_detection_entity??''},save);
   let actions=body.querySelector('.row-actions');
   if(!actions){actions=document.createElement('div');actions.className='row-actions';actions.innerHTML=[-1,1,0].map(move=>uiButton({content:`<ha-icon icon="${move===-1?'mdi:arrow-up':move===1?'mdi:arrow-down':'mdi:delete'}"></ha-icon>`,attrs:{'data-move':String(move)}})).join('');body.append(actions);actions.addEventListener('click',event=>{const button=event.target.closest?.('[data-move]');if(!button)return;const move=Number(button.dataset.move),rows=[...this._config.cameras],from=rows.findIndex(item=>item.entity===row.entity),to=from+move;if(!move)rows.splice(from,1);else if(to>=0&&to<rows.length)[rows[from],rows[to]]=[rows[to],rows[from]];else return;this._save({...this._config,cameras:rows});if(move)button.focus();else this._form.focus();});}
   for(const [move,label,disabled] of [['-1',t('Camera omhoog','Move camera up'),index===0],['1',t('Camera omlaag','Move camera down'),index===c.cameras.length-1],['0',t('Camera verwijderen','Remove camera'),false]]){const button=actions.querySelector(`[data-move="${move}"]`);button.setAttribute('aria-label',label);button.title=label;button.disabled=disabled;}
  });
 }
 _renderContacts(parent,key,text){
  for(const [id,node] of this._contactRows)if(id.startsWith(key+':')&&!this._config[key].some(row=>id===key+':'+row.entity)){node.remove();this._contactRows.delete(id);}
  this._config[key].forEach((row,index)=>{
   const id=key+':'+row.entity;let node=this._contactRows.get(id);
   if(!node){node=document.createElement('details');node.className='contact-row';node.innerHTML='<summary><span></span><small></small></summary><div class="group-body"></div>';this._contactRows.set(id,node);}
   const existing=parent.children[index+1];if(existing!==node)parent.insertBefore(node,existing??null);
   node.querySelector('summary span').textContent=this._name(row);node.querySelector('summary small').textContent=row.entity;
   this._formAt(node.querySelector('.group-body'),id,[text('name')],{name:row.name??''},value=>this._save({...this._config,[key]:this._config[key].map(item=>item.entity===row.entity?{...item,name:value.name??''}:item)}));
  });
 }
}
