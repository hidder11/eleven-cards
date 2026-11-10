import {cameraDutch} from './camera-utils.js';
import {uiButton} from '../../../shared/ui-button.js';

export const cameraFeatureEditor=Base=>class extends Base{
 constructor(){super();this._featureRows={profiles:new Map(),actions:new Map()};this._contactRows=new Map();}
 _save(config){
  const next={...config};
  for(const [ui,key] of [['door_entities','door_sensors'],['window_entities','window_sensors']])if(Array.isArray(next[ui])){next[key]=next[ui].map(entity=>this._config[key].find(row=>row.entity===entity)??{entity});delete next[ui];}
  super._save(next);
 }
 _render(){
  super._render();if(!this._form||!this._hass)return;
  const nl=cameraDutch(this._hass),t=(a,b)=>nl?a:b,c=this._config;
  const select=(name,options)=>({name,selector:{select:{mode:'dropdown',options}}}),bool=name=>({name,selector:{boolean:{}}}),number=(name,min,max)=>({name,selector:{number:{min,max,step:1,mode:'box'}}});
  const entity=(name,domain,multiple=false)=>({name,selector:{entity:{...(domain?{domain}:{}),...(multiple?{multiple:true}:{})}}});
  const group=(name,title,schema)=>({name,title,type:'expandable',flatten:true,schema});
  const layoutNames={grid:t('Raster','Grid'),tabs:t('Tabbladen','Tabs'),focus:t('Focusweergave','Focus view'),sidebar:t('Groot beeld met zijbeelden','Large feed with side feeds'),filmstrip:t('Horizontale filmstrip','Horizontal filmstrip'),wall:t('Compacte camerawand','Compact camera wall')};
  // Keep old YAML layouts available when editing an existing card.
  const layouts=['grid','focus'];if(!layouts.includes(c.layout))layouts.push(c.layout);
  const layoutOptions=layouts.map(value=>({value,label:layoutNames[value]})),cameraOptions=[{value:'',label:t('Geen','None')},...c.cameras.map(row=>({value:row.entity,label:row.name||this._hass.states?.[row.entity]?.attributes?.friendly_name||row.entity}))];
  const fields=this._form.schema.flatMap(group=>group.schema??[group]);fields.find(row=>row.name==='layout').selector.select.options=layoutOptions;
  const feeds=this._form.schema.find(group=>group.name==='feeds');feeds.schema.push(number('snapshot_interval',0,3600));
  const groups=[group('camera_automation',t('Detectie en deurbel','Detection and doorbell'),[bool('auto_focus'),number('focus_duration',5,600),entity('doorbell_entity',['binary_sensor','event','input_button']),select('doorbell_camera',cameraOptions),select('doorbell_secondary_camera',cameraOptions),number('doorbell_duration',5,600)]),group('camera_security',t('Alarm, deuren en ramen','Alarm, doors and windows'),[bool('show_security'),entity('alarm_entity','alarm_control_panel'),bool('alarm_disarm_code'),entity('door_entities','binary_sensor',true),entity('window_entities','binary_sensor',true)]),group('camera_activity',t('Recente activiteit','Recent activity'),[bool('show_activity'),select('activity_source',[{value:'session',label:t('Sinds openen kaart','Since opening the card')},{value:'history',label:t('Home Assistant-geschiedenis','Home Assistant history')}]),...(c.activity_source==='history'?[number('activity_hours',1,72)]:[]),number('activity_page_size',1,50)]),group('camera_profile_default',t('Standaardprofiel','Default profile'),[select('default_profile',[{value:'',label:t('Kaartinstelling','Card default')},...c.profiles.map(row=>({value:row.id,label:row.name||row.id}))])])];
  feeds.schema=feeds.schema.filter(field=>field.name!=='show_fullscreen');
  this._form.schema=[...this._form.schema,...groups.filter(group=>['camera_security','camera_activity'].includes(group.name))];
  this._form.data={...this._form.data,door_entities:c.door_sensors.map(row=>row.entity),window_entities:c.window_sensors.map(row=>row.entity)};
  const previousLabel=this._form.computeLabel,previousHelper=this._form.computeHelper;
  const labels={alarm_disarm_code:t('Pincode vragen bij uitschakelen','Ask for a code when disarming'),snapshot_interval:t('Momentopname verversen (seconden; 0 = standaard HA)','Snapshot refresh (seconds; 0 = native HA)'),auto_focus:t('Tijdelijk focussen bij detectie','Temporarily focus on detection'),focus_duration:t('Detectiefocus (seconden)','Detection focus (seconds)'),doorbell_entity:t('Deurbelentiteit','Doorbell entity'),doorbell_camera:t('Deurbelcamera','Doorbell camera'),doorbell_secondary_camera:t('Tweede beeld bij aanbellen','Secondary feed on ringing'),doorbell_duration:t('Deurbelweergave (seconden)','Doorbell view (seconds)'),show_security:t('Beveiligingsoverzicht tonen','Show security overview'),alarm_entity:t('Alarmentiteit','Alarm entity'),door_entities:t('Deursensoren','Door sensors'),window_entities:t('Raamsensoren','Window sensors'),show_activity:t('Recente activiteit tonen','Show recent activity'),activity_source:t('Bron voor activiteit','Activity source'),activity_hours:t('Geschiedenis (uren)','History (hours)'),activity_page_size:t('Gebeurtenissen per pagina','Events per page'),default_profile:t('Profiel zonder automatische match','Profile without automatic match')};
  this._form.computeLabel=item=>labels[item.name]??previousLabel(item);
  this._form.computeHelper=item=>({activity_page_size:t('Aantal regels per pagina. Samengevoegde meldingen tellen als een gebeurtenis.','Rows per page. Grouped notifications count as one event.'),alarm_disarm_code:t('Vraagt de code die je alarmintegratie ondersteunt. Zonder code uitschakelen werkt alleen als de integratie dat toestaat.','Asks for the code supported by your alarm integration. Disarming without a code works only if the integration allows it.'),auto_focus:t('Werkt op nieuwe detecties van zichtbare camera’s. Handmatig kiezen krijgt voorrang.','Uses fresh detections from visible cameras. Manual selection takes priority.'),doorbell_entity:t('Binaire sensor (aan), event-entiteit of input_button. Bestaande toestanden bij openen veroorzaken geen melding.','Binary sensor (on), event entity or input_button. Existing states when opening do not trigger alerts.'),doorbell_camera:t('De camera moet zichtbaar zijn in het actieve profiel. Privacy blijft altijd van kracht.','The camera must be visible in the active profile. Privacy always applies.'),layout:t('Raster toont alle camera\u2019s tegelijk. Focus toont \u00e9\u00e9n groot beeld met een camerakiezer.','Grid shows all cameras together. Focus shows one large feed with a camera picker.'),snapshot_interval:t('Vanaf 5 seconden. Het tijdstip is wanneer het beeld geladen is, niet wanneer de camera het vastlegde.','Minimum 5 seconds. The timestamp is image load time, not camera capture time.'),alarm_entity:t('Toont de alarmstatus. Tik voor de normale HA-bediening, inclusief eventuele pincode.','Shows alarm status. Tap for native HA controls, including any required PIN.'),activity_source:t('Geschiedenis vereist beschikbare Recorder-data. De kaart bewaart geen beelden of videoclips.','History requires available Recorder data. The card stores no images or video clips.')})[item.name]??previousHelper(item);
  this._extraEditor?.remove();this._extraEditor=null;
  this._renderContactNames(t);
 }
 _renderContactNames(t){
  if(!this._contactEditor){this._contactEditor=document.createElement('div');this._contactEditor.className='contact-settings';this.shadowRoot.append(this._contactEditor);}
  const contacts=['door_sensors','window_sensors'].flatMap(key=>this._config[key].map(row=>({key,row}))),ids=new Set(contacts.map(({key,row})=>key+':'+row.entity));
  for(const [id,node] of this._contactRows)if(!ids.has(id)){node.remove();this._contactRows.delete(id);}
  contacts.forEach(({key,row},index)=>{
   const id=key+':'+row.entity;let node=this._contactRows.get(id);
   if(!node){
    node=document.createElement('details');node.innerHTML='<summary></summary><ha-form></ha-form>';
    node.querySelector('ha-form').addEventListener('value-changed',event=>{event.stopPropagation();this._save({...this._config,[key]:this._config[key].map(item=>item.entity===row.entity?{...item,name:event.detail.value.name??''}:item)});});
    this._contactRows.set(id,node);
   }
   if(this._contactEditor.children[index]!==node)this._contactEditor.insertBefore(node,this._contactEditor.children[index]??null);
   node.querySelector('summary').textContent=(key==='door_sensors'?t('Deur: ','Door: '):t('Raam: ','Window: '))+(row.name||this._hass.states?.[row.entity]?.attributes?.friendly_name||row.entity);
   Object.assign(node.querySelector('ha-form'),{hass:this._hass,data:{name:row.name??''},schema:[{name:'name',selector:{text:{}}}],computeLabel:()=>t('Eigen naam','Custom name'),computeHelper:()=>t('Laat leeg om de naam uit Home Assistant te gebruiken.','Leave empty to use the Home Assistant name.')});
  });
  this._contactEditor.hidden=!contacts.length;
 }
 _renderRows(t,labels,select){
  super._renderRows(t,labels,select);
  for(const row of this._config.cameras){
   const form=this._rows.get(row.entity).querySelector('ha-form'),previousLabel=form.computeLabel,previousHelper=form.computeHelper;
   form.schema=[...form.schema,{name:'privacy_entity',selector:{entity:{domain:['switch','input_boolean','binary_sensor']}}},select('privacy_state',[{value:'on',label:t('Aan = privacy','On = privacy')},{value:'off',label:t('Uit = privacy','Off = privacy')}]),{name:'snapshot_interval',selector:{number:{min:0,max:3600,step:1,mode:'box'}}}];
   form.data={...form.data,privacy_entity:row.privacy_entity??'',privacy_state:row.privacy_state??'on',snapshot_interval:row.snapshot_interval};
   form.computeLabel=item=>({privacy_entity:t('Privacymodus','Privacy mode'),privacy_state:t('Privacy actief bij','Privacy active when'),snapshot_interval:t('Verversinterval (seconden; leeg = kaartinstelling)','Refresh interval (seconds; empty = card default)')})[item.name]??previousLabel(item);
   form.computeHelper=item=>item.name==='privacy_entity'?t('Schakelaar voor bediening of binaire sensor voor alleen status. Onbekende privacy verbergt het beeld.','Switch for control or binary sensor for status only. Unknown privacy hides the feed.'):previousHelper(item);
  }
 }
 _renderFeatureLists(t,select,entity,number,layoutOptions,cameraOptions){
  if(!this._extraEditor){
   this._extraEditor=document.createElement('div');this._extraEditor.className='camera-extra-editors';
   for(const key of ['profiles','actions']){const section=document.createElement('details');section.dataset.featureList=key;section.innerHTML='<summary></summary><p style="margin-top:8px"></p><div data-feature-rows></div>'+uiButton({variant:'text',attrs:{'data-feature-add':key}});this._extraEditor.append(section);}
   this.shadowRoot.append(this._extraEditor);
   this._extraEditor.addEventListener('click',event=>{
    const add=event.target.closest?.('[data-feature-add]');if(add){const key=add.dataset.featureAdd,list=this._config[key];let n=1;while(list.some(row=>row.id===key+'-'+n))n++;const row=key==='profiles'?{id:key+'-'+n,name:t('Profiel ','Profile ')+n}:{id:key+'-'+n,name:t('Actie ','Action ')+n,confirmation:true};this._save({...this._config,[key]:[...list,row]});this._featureRows[key].get(row.id).open=true;this._featureRows[key].get(row.id).querySelector('summary').focus();}
   });
  }
  const schemas={profiles:[{name:'name',selector:{text:{}}},entity('entity'),{name:'state',selector:{text:{}}},entity('cameras','camera',true),select('layout',[{value:'',label:t('Kaartinstelling','Card default')},...layoutOptions]),select('auto_cycle',[{value:'',label:t('Kaartinstelling','Card default')},{value:'on',label:t('Aan','On')},{value:'off',label:t('Uit','Off')}]),number('cycle_interval',5,3600)],actions:[{name:'name',selector:{text:{}}},{name:'icon',selector:{icon:{}}},entity('entity'),select('camera',cameraOptions),select('action',[{value:'more-info',label:t('Entiteitdetails','Entity details')},{value:'toggle',label:t('Omschakelen','Toggle')},{value:'turn_on',label:t('Inschakelen','Turn on')},{value:'turn_off',label:t('Uitschakelen','Turn off')},{value:'press',label:t('Knop indrukken','Press button')},{value:'run',label:t('Script uitvoeren','Run script')}]),{name:'service',selector:{text:{}}},{name:'data',selector:{object:{}}},{name:'confirmation',selector:{boolean:{}}}]};
  for(const key of ['profiles','actions']){
   const section=this._extraEditor.querySelector(`[data-feature-list="${key}"]`),list=section.querySelector('[data-feature-rows]'),rows=this._config[key],map=this._featureRows[key];
   section.querySelector('summary').textContent=key==='profiles'?t('Profielen','Profiles'):t('Bedieningsknoppen','Control buttons');section.querySelector('[data-feature-add]').textContent=key==='profiles'?t('Profiel toevoegen','Add profile'):t('Knop toevoegen','Add button');
   section.querySelector('p').textContent=key==='profiles'?t('Handmatig kiezen of automatisch koppelen aan een exacte entiteitstoestand. Het eerste passende profiel wordt gebruikt. Een lege cameralijst gebruikt alle zichtbare camera’s.','Choose manually or match an exact entity state automatically. The first matching profile is used. An empty camera list uses all visible cameras.'):t('Knoppen voeren alleen bij aanklikken een ingestelde HA-actie uit. Gebruik waar nodig een eigen actie zoals light.turn_on met bijbehorende gegevens.','Buttons run a configured HA action only when clicked. Set a custom action such as light.turn_on with its data when needed.');
   for(const [id,node] of map)if(!rows.some(row=>row.id===id)){node.remove();map.delete(id);}
   rows.forEach((row,index)=>{
    let node=map.get(row.id);
    if(!node){
     node=document.createElement('details');node.innerHTML='<summary></summary><div class="row-actions">'+[-1,1,0].map(move=>uiButton({content:`<ha-icon icon="${move===-1?'mdi:arrow-up':move===1?'mdi:arrow-down':'mdi:delete'}"></ha-icon>`,attrs:{'data-feature-move':String(move)}})).join('')+'</div><ha-form></ha-form>';
     node.querySelector('ha-form').addEventListener('value-changed',event=>{event.stopPropagation();const value={...event.detail.value};if(key==='profiles'&&'auto_cycle' in value){if(value.auto_cycle==='')value.auto_cycle=undefined;else value.auto_cycle=value.auto_cycle==='on';}this._save({...this._config,[key]:this._config[key].map(item=>item.id===row.id?{...item,...value}:item)});});
     node.addEventListener('click',event=>{const button=event.target.closest?.('[data-feature-move]');if(!button)return;const move=Number(button.dataset.featureMove),next=[...this._config[key]],from=next.findIndex(item=>item.id===row.id),to=from+move;if(!move)next.splice(from,1);else if(to>=0&&to<next.length)[next[from],next[to]]=[next[to],next[from]];else return;this._save({...this._config,[key]:next});if(!move)(this._featureRows[key].get(next[Math.min(from,next.length-1)]?.id)?.querySelector('summary')??section.querySelector('[data-feature-add]')).focus();else node.querySelector('summary').focus();});
     map.set(row.id,node);
    }
    if(list.children[index]!==node)list.insertBefore(node,list.children[index]??null);
    node.querySelector('summary').textContent=row.name||row.id;
    for(const [move,label,disabled] of [['-1',t('Omhoog','Move up'),index===0],['1',t('Omlaag','Move down'),index===rows.length-1],['0',t('Verwijderen','Delete'),false]]){const button=node.querySelector(`[data-feature-move="${move}"]`);button.setAttribute('aria-label',label);button.disabled=disabled;}
    const data=key==='profiles'?{...row,layout:row.layout??'',auto_cycle:row.auto_cycle==null?'':row.auto_cycle?'on':'off',cycle_interval:row.cycle_interval}:{...row};
    Object.assign(node.querySelector('ha-form'),{hass:this._hass,data,schema:schemas[key],computeLabel:item=>({name:t('Naam','Name'),icon:t('Icoon','Icon'),entity:key==='profiles'?t('Automatisch via entiteit (optioneel)','Automatic via entity (optional)'):t('Doelentiteit','Target entity'),state:t('Exacte toestand','Exact state'),cameras:t('Camera’s','Cameras'),layout:t('Indeling','Layout'),auto_cycle:t('Automatisch wisselen','Auto cycle'),cycle_interval:t('Wisselinterval (seconden)','Cycle interval (seconds)'),camera:t('Alleen bij deze camera (optioneel)','Only for this camera (optional)'),action:t('Standaardactie','Standard action'),service:t('Eigen HA-actie, domein.actie (optioneel)','Custom HA action, domain.action (optional)'),data:t('Actiegegevens (optioneel)','Action data (optional)'),confirmation:t('Bevestiging vragen','Ask for confirmation')})[item.name]??item.name,computeHelper:item=>({service:t('Een eigen actie heeft voorrang op de standaardactie. Beschikbare acties en je rechten worden door HA bepaald.','A custom action overrides the standard action. HA determines available actions and permissions.'),state:t('Gebruik de technische toestand, bijvoorbeeld on, off, night of armed_away.','Use the raw state, for example on, off, night or armed_away.')})[item.name]});
   });
  }
 }
};
