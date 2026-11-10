// Rendered checks: synthetic entities only, using the released YAML theme.
const {card}=window.securityQA,root=card.shadowRoot,checks=[];
const tick=()=>new Promise(resolve=>setTimeout(resolve,80));
const check=(name,value)=>{if(!value)throw Error(name);checks.push(name);};
const change=(selector,value)=>{const node=document.querySelector(selector);node.value=value;node.dispatchEvent(new Event('change'));};
const style=selector=>getComputedStyle(root.querySelector(selector));
const color=value=>{const probe=document.createElement('span');probe.style.color=value;root.append(probe);const result=getComputedStyle(probe).color;probe.remove();return result;};
try{
 check('Activity has no manual refresh button or redundant period label',!root.querySelector('[data-camera-history-refresh],.camera-activity-source,.camera-activity-meta'));
 check('Preview offers only the nine shared backgrounds plus off',JSON.stringify([...document.querySelector('#background').options].map(option=>option.value))===JSON.stringify(['none','aurora','ribbon','isobars','ink-bloom','hologram','satin-waves','isometric-depth','comet-trails','lenticular-glow']));
 for(const theme of ['ha','material'])for(const light of [false,true])for(const narrow of [false,true]){
  change('#theme-style',theme);
  const accent=document.querySelector('#theme-accent');accent.value=light?'#a43579':'#e583b8';accent.dispatchEvent(new Event('input'));
  if(document.body.classList.contains('light')!==light)document.querySelector('#theme').click();
  if(document.querySelector('.preview').classList.contains('narrow')!==narrow)document.querySelector('#width').click();
  card.scrollIntoView({block:'start'});await tick();
  const label=`${theme}/${light?'light':'dark'}/${narrow?260:420}`;
  check(label+': card padding and theme-owned radius',style('.content').padding==='16px'&&style('ha-card').borderRadius===(theme==='material'?'22px':'12px'));
  check(label+': depth follows theme',theme==='material'?style('.camera-alarm-controls').boxShadow.includes('inset'):style('.camera-alarm-controls').boxShadow==='none');
  check(label+': selected alarm is pressed without outline border',style('[data-alarm-mode][aria-pressed=true]').borderWidth==='0px'&&style('[data-alarm-mode][aria-pressed=true]').transform==='matrix(1, 0, 0, 1, 0, 1)');
  check(label+': all six alarm choices remain accessible',[...root.querySelectorAll('[data-alarm-mode]')].every(node=>node.getBoundingClientRect().height>=44)&&root.querySelectorAll('[data-alarm-mode]').length===6);
  check(label+': camera footer remains compact and feed corners join it square',root.querySelector('.camera-tile-footer').getBoundingClientRect().height<=34&&style('.camera-frame').borderRadius==='0px'&&[...card._tiles.values()].filter(tile=>tile.player.card).every(tile=>getComputedStyle(tile.player.card).getPropertyValue('--ha-card-border-radius').trim()==='0px'));
  const inset=getComputedStyle(root.querySelector('.camera-tile'),'::after');
  check(label+': camera inset sits above the image without blocking controls',inset.pointerEvents==='none'&&inset.position==='absolute'&&style('.camera-tile').boxShadow==='none'&&(theme==='material'?inset.boxShadow===style('.camera-alarm-controls').boxShadow:inset.boxShadow==='none'));
  for(const mode of ['disarmed','armed_away','armed_vacation','armed_custom_bypass','arming','pending','triggered']){
   change('#alarm-mode',mode);await tick();
   const primary=root.querySelector('.primary-number'),art=root.querySelector('.camera-security-art');
   check(label+'/'+mode+': heading fits without obscuring artwork',primary.scrollWidth<=primary.clientWidth+1&&primary.getBoundingClientRect().right<=art.getBoundingClientRect().left+1&&!window.securityQA.checks().overflow);
  }
  const originalConfig=structuredClone(card._baseConfig),originalHass=card.hass;
  card.setConfig({...originalConfig,card_background:{enabled:true,variant:'ink-bloom',colorMode:'dynamic',transparency:73,coverage:'header',height:96,animated:false}});
  for(const [state,group] of [['disarmed','disarmed'],['armed_home','armed'],['armed_away','armed'],['armed_night','armed'],['armed_vacation','armed'],['armed_custom_bypass','armed'],['arming','transition'],['disarming','transition'],['pending','transition'],['unknown','unknown'],['unavailable','unknown'],['triggered','triggered']]){
   const entity=card._config.alarm_entity;
   card.hass={...originalHass,states:{...originalHass.states,[entity]:{...originalHass.states[entity],state}}};
   const layer=root.querySelector('[data-ui-card-background]');
   check(label+'/'+state+': production art and dynamic background agree',root.querySelector('[data-security-group]').dataset.securityGroup===group&&layer.style.getPropertyValue('--ui-bg-1')===card.cardBackgroundStatusColor());
   check(label+'/'+state+': generic background settings survive state changes',layer.style.getPropertyValue('--ui-bg-opacity')==='0.27'&&layer.style.getPropertyValue('--ui-bg-height')==='96px');
  }
  card.setConfig(originalConfig);card.hass=originalHass;
  change('#alarm-mode','armed_away');change('#view','windows');await tick();
  const strip=root.querySelector('[role=tablist]'),selected=strip.querySelector('[aria-selected=true]'),bounds=strip.getBoundingClientRect(),tab=selected.getBoundingClientRect();
  check(label+': selected tab is visible with accent underline',tab.left>=bounds.left-1&&tab.right<=bounds.right+1&&getComputedStyle(selected).borderBottomWidth==='2px'&&getComputedStyle(selected).marginBottom==='0px');
  check(label+': navigation follows a custom accent',getComputedStyle(selected).borderBottomColor===color('var(--accent-color)'));
  check(label+': selected alarm follows accent rather than header status',style('[data-alarm-mode][aria-pressed=true]').color===color('var(--eleven-material-selection-color,color-mix(in srgb,var(--accent-color,var(--primary-color)) 40%,var(--primary-text-color)))'));
  check(label+': contact wells use theme base',style('[data-ui-detail-surface]').backgroundColor===style('[data-ui-metric]').backgroundColor&&style('[data-ui-detail-surface]').backgroundImage==='none');
  change('#view','activity');await tick();
  check(label+': visible history schedules automatic refresh',card._historyRefreshTimer!=null);
  check(label+': activity fits its compact columns',[...root.querySelectorAll('.camera-event')].every(node=>node.scrollWidth<=node.clientWidth+1));
  const activityRows=[...root.querySelectorAll('.camera-event')],firstTitle=activityRows[0]?.querySelector('strong').getBoundingClientRect();
  check(label+': timeline columns and first-line centres align',activityRows.length>0&&activityRows.every(node=>{
   const title=node.querySelector('strong').getBoundingClientRect(),time=node.querySelector('time span').getBoundingClientRect(),icon=node.querySelector('.camera-event-symbol ha-icon').getBoundingClientRect();
   const rail=getComputedStyle(node,'::before'),symbol=node.querySelector('.camera-event-symbol').getBoundingClientRect(),row=node.getBoundingClientRect();
   return Math.abs(title.left-firstTitle.left)<1&&Math.abs(title.top-time.top)<1&&Math.abs(icon.top+icon.height/2-title.top-9)<1&&Math.abs(row.left+parseFloat(rail.left)-symbol.left-symbol.width/2)<1;
  }));
  check(label+': day groups follow inset theme',theme==='material'?style('.camera-activity-day>div').boxShadow===style('.camera-alarm-controls').boxShadow:style('.camera-activity-day>div').boxShadow==='none');
  change('#view','cameras');
  check(label+': leaving activity pauses history polling',card._historyRefreshTimer==null);
  card._openViewer('camera.front',document.querySelector('#width'));await tick();
  check(label+': viewer keeps one stream and themed controls',card._viewer.open&&[...card._tiles.values()].filter(tile=>!!tile.player.card).length===1&&style('.camera-viewer-close').width==='30px'&&style('.camera-viewer-close').backgroundColor==='rgba(0, 0, 0, 0)'&&style('.camera-viewer-close').boxShadow==='none'&&style('.camera-viewer-close svg').width==='16px'&&style('.camera-viewer-picker button[aria-pressed=true]').borderWidth==='0px');
  card._closeViewer();await tick();
  const alarm=card.hass.states[card._config.alarm_entity];
  card.hass={...card.hass,states:{...card.hass.states,[card._config.alarm_entity]:{...alarm,attributes:{...alarm.attributes,code_format:'number'}}}};
  root.querySelector('[data-alarm-mode="disarmed"]').click();await tick();
  const keypad=root.querySelector('.camera-alarm-keypad'),key=root.querySelector('[data-alarm-key="1"]');
  check(label+': numeric keypad fits and uses shared action styling',!!keypad&&keypad.scrollWidth<=keypad.clientWidth+1&&key.getBoundingClientRect().height>=44&&getComputedStyle(key).backgroundColor===style('[data-alarm-mode="armed_home"]').backgroundColor&&getComputedStyle(key).boxShadow===style('[data-alarm-mode="armed_home"]').boxShadow);
  root.querySelector('[data-alarm-key="0"]').click();const pin=root.querySelector('.camera-alarm-code input');
  check(label+': keypad has masked input and remains keyboard accessible',pin.value==='0'&&pin.type==='password'&&[...keypad.querySelectorAll('button')].every(button=>button.type==='button'&&!!button.getAttribute('aria-label')));
  root.querySelector('[data-alarm-mode="armed_away"]').click();
 }
 change('#background','ink-bloom');await tick();
 check('Shared background catalog renders new designs',!!root.querySelector('[data-ui-card-background="ink-bloom"]'));
 change('#background','none');await tick();
 check('Disabled background removes all decoration',!root.querySelector('[data-ui-card-background]')&&style('.scene-background').display==='none');
 const original={...card._elevenBackgroundConfig};
 card.setConfig({cameras:original.cameras});await tick();
 check('New configurations start without a decorative background',!root.querySelector('[data-ui-card-background]')&&style('.scene-background').display==='none');
 card.setConfig({...original,background:'prism-glass',card_background:undefined});await tick();
 check('Existing unsupported legacy backgrounds retain their original renderer',!root.querySelector('[data-ui-background-host]')&&style('.scene-background').display!=='none'&&root.querySelector('.content').dataset.background==='prism-glass');
 card.setConfig(original);await tick();
 for(const mode of ['armed_vacation','armed_custom_bypass','arming','pending']){
  card.hass={...card.hass,language:'en',locale:{language:'en'},states:{...card.hass.states,'alarm_control_panel.home':{...card.hass.states['alarm_control_panel.home'],state:mode}}};await tick();
  const primary=root.querySelector('.primary-number');
  check('English narrow heading fits: '+mode,primary.scrollWidth<=primary.clientWidth+1&&primary.getBoundingClientRect().right<=root.querySelector('.camera-security-art').getBoundingClientRect().left+1);
 }
 change('#alarm-mode','armed_away');
 const namedConfig={...card._elevenBackgroundConfig,cameras:card._elevenBackgroundConfig.cameras.map((row,index)=>index?row:{...row,name:'Voordeur bij de overdekte ingang aan de achterzijde'})};
 card.setConfig(namedConfig);card._selectSecurityView('activity');await tick();
 const longRow=[...root.querySelectorAll('.camera-event')].find(node=>node.textContent.includes('overdekte ingang'));
 check('Long activity names wrap without losing column alignment',!!longRow&&longRow.scrollWidth<=longRow.clientWidth+1&&longRow.querySelector('strong').getBoundingClientRect().height>18&&Math.abs(longRow.querySelector('strong').getBoundingClientRect().top-longRow.querySelector('time span').getBoundingClientRect().top)<1);
 card.setConfig(original);
 card._selectSecurityView('activity');
 const minute=Math.floor((Date.now()-120000)/60000)*60000,door=card._config.door_sensors[0],windowSensor=card._config.window_sensors[0],camera=card._config.cameras[0];
 card._activity.events=[
  ...[1,2,3].map(second=>({id:'group-motion-'+second,entity:camera.motion_entity,camera:camera.entity,kind:'motion',time:minute+second*1000})),
  {id:'group-door',entity:door.entity,camera:'',kind:'door',state:'on',time:minute-1000},
  {id:'group-window',entity:windowSensor.entity,camera:'',kind:'window',state:'off',time:minute-2000}
 ];card._renderActivity();await tick();
 check('Repeated camera events share a counted row alongside doors and windows',root.querySelectorAll('.camera-event').length===3&&root.querySelector('[data-camera-activity="group-motion-3"]').textContent.includes('3×')&&!!root.querySelector('[data-camera-activity="group-door"]')&&!!root.querySelector('[data-camera-activity="group-window"]'));
 let details;card.addEventListener('hass-more-info',event=>{details=event.detail.entityId;},{once:true});
 root.querySelector('[data-camera-activity="group-door"]').click();
 check('Door activity opens native details directly',details===door.entity&&!card._viewer?.open);
 card.setConfig(original);
 if(!customElements.get('ha-form'))customElements.define('ha-form',class extends HTMLElement{});
 const editor=await card.constructor.getConfigElement();document.body.append(editor);editor.hass=card.hass;editor.setConfig({...card._baseConfig,card_background:{variant:'ink-bloom',enabled:true}});await tick();
 check('Visual editor wraps existing fields with shared background settings',!!editor.shadowRoot.querySelector('details')&&!!editor._nativeEditor);
 check('Visual editor offers the same nine shared backgrounds',JSON.stringify([...editor.shadowRoot.querySelector('[data-bg=variant]').options].map(option=>option.value))===JSON.stringify(['aurora','ribbon','isobars','ink-bloom','hologram','satin-waves','isometric-depth','comet-trails','lenticular-glow']));
 check('Superseded background controls are hidden without losing camera fields',editor._nativeEditor.shadowRoot.querySelectorAll('ha-form').length>0&&[...editor._nativeEditor.shadowRoot.querySelectorAll('ha-form')].every(form=>!JSON.stringify(form.schema).includes('"name":"background"')));
 editor.remove();
 const pagedConfig={...original,activity_page_size:2};
 card.setConfig(pagedConfig);card._selectSecurityView('activity');
 const pageTime=Math.floor((Date.now()-120000)/60000)*60000;
 const records=Array.from({length:13},(_,index)=>({id:'page-'+index,entity:camera.motion_entity,camera:camera.entity,kind:'motion',time:pageTime-index*60000}));
 records[2]={...records[2],entity:door.entity,camera:'',kind:'door',state:'on'};
 card._activity.events=records;card._renderActivity();await tick();
 const visibleIds=()=>[...root.querySelectorAll('[data-camera-activity]')].map(node=>node.dataset.cameraActivity);
 check('Pagination starts at newest events and keeps more than the old maximum',visibleIds().join(',')==='page-0,page-1'&&root.querySelector('[data-activity-page-status]').textContent==='1 van 7'&&root.querySelector('[data-camera-activity-page="previous"]').disabled);
 root.querySelector('[data-camera-activity-page="next"]').click();await tick();
 check('Next page includes older contact events',visibleIds().join(',')==='page-2,page-3'&&root.querySelector('[data-activity-page-status]').textContent==='2 van 7');
 let pagedDetails;card.addEventListener('hass-more-info',event=>{pagedDetails=event.detail.entityId;},{once:true});
 root.querySelector('[data-camera-activity="page-2"]').click();
 check('Older paginated contact events retain native details',pagedDetails===door.entity);
 const fresh={...records[0],id:'fresh-page',time:pageTime+60000};card._activity.events=[fresh,...records];card._renderActivity();await tick();
 check('Incoming events leave older pages stable and offer a latest button',visibleIds().join(',')==='page-2,page-3'&&!!root.querySelector('[data-camera-activity-page="latest"]'));
 const pager=root.querySelector('.camera-activity-pagination');
 check('Pagination fits a narrow card with accessible action targets',pager.scrollWidth<=pager.clientWidth+1&&[...pager.querySelectorAll('button')].every(button=>button.getBoundingClientRect().height>=44));
 root.querySelector('[data-camera-activity-page="latest"]').click();await tick();
 check('New activity button returns to live first page',visibleIds().join(',')==='fresh-page,page-0'&&!root.querySelector('[data-camera-activity-page="latest"]'));
 card.setConfig({...pagedConfig,activity_page_size:50});await tick();
 check('Single-page activity hides unnecessary navigation',root.querySelector('.camera-activity-pagination').hidden&&visibleIds().length===14);
 const pageEditor=await card.constructor.getConfigElement();document.body.append(pageEditor);pageEditor.hass=card.hass;pageEditor.setConfig({...original,activity_limit:3,activity_page_size:undefined});await tick();
 const native=pageEditor._nativeEditor,form=native._form,fields=[...native.shadowRoot.querySelectorAll('ha-form')].flatMap(form=>form.schema??[]);
 check('Editor migrates old row limits and labels the page size',native._config.activity_page_size===3&&fields.some(field=>field.name==='activity_page_size')&&!fields.some(field=>field.name==='activity_limit')&&form.computeLabel({name:'activity_page_size'})==='Gebeurtenissen per pagina');
 let savedPage;pageEditor.addEventListener('config-changed',event=>{savedPage=event.detail.config;});native._save({...native._config,activity_page_size:4});
 check('Editor emits the new page-size key without the old limit',savedPage?.activity_page_size===4&&!('activity_limit' in savedPage));
 const sections=[...native.shadowRoot.querySelectorAll('.editor-sections > details')];
 check('Editor uses five consistent collapsible sections',sections.map(node=>node.dataset.group).join(',')==='cameras,alarm,contacts,activity,appearance');
 const contactsGroup=native.shadowRoot.querySelector('[data-group=contacts]'),doorGroup=native.shadowRoot.querySelector('[data-group=door_sensors]');
 contactsGroup.open=true;doorGroup.open=true;native._rows.get('camera.front').open=true;
 const appearanceGroup=native.shadowRoot.querySelector('[data-group=appearance]');appearanceGroup.open=true;
 const background=pageEditor.shadowRoot.querySelector('details[slot]');
 check('Shared background controls occupy the Appearance slot',background?.parentElement===native&&native.shadowRoot.querySelector('slot[name=card-background]')?.assignedElements()[0]===background);
 background.open=true;
 const backgroundInput=background.querySelector('[data-bg=transparency]');
 backgroundInput.value='42';backgroundInput.dispatchEvent(new Event('change',{bubbles:true}));
 check('Slotted shared background settings emit through the outer editor',savedPage.card_background.transparency===42&&background.open);
 const alarmForm=native.shadowRoot.querySelector('[data-form=alarm]');
 alarmForm.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{show_alarm:false}}}));
 check('Alarm visibility saves independently and preserves nested open states',savedPage.show_alarm===false&&savedPage.show_contacts!==false&&doorGroup.open&&contactsGroup.open&&native._rows.get('camera.front').open);
 const contactSettings=native.shadowRoot.querySelector('[data-form=contacts]');
 contactSettings.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{show_contacts:false,show_alarm:true}}}));
 check('Contact visibility saves independently without removing mapped sensors',savedPage.show_contacts===false&&savedPage.show_alarm===true&&savedPage.door_sensors.length===original.door_sensors.length);
 native.hass={...card.hass,language:'en',locale:{language:'en'}};
 check('Editor labels update with the frontend language',alarmForm.computeLabel({name:'show_alarm'})==='Show alarm');
 native.hass=card.hass;
 card._selectSecurityView('doors');card.setConfig({...original,show_contacts:false,show_alarm:true});
 check('Hiding the selected contact tab restores Cameras while keeping the alarm',card._securityView==='cameras'&&root.querySelector('.camera-security').hidden&&!root.querySelector('.camera-body').hidden&&!!root.querySelector('[data-alarm-mode]'));
 card.setConfig({...original,show_contacts:true,show_alarm:false});
 check('Hiding the alarm keeps contact tabs and activity mappings',root.querySelector('.camera-alarm-controls').hidden&&!!root.querySelector('[data-ui-tab=doors]')&&card._config.door_sensors.length===original.door_sensors.length);
 card.setConfig(original);pageEditor.remove();
 await import('../dist/eleven-camera-card-test.js');
 const testClass=customElements.get('eleven-camera-card-test'),testEditor=await testClass.getConfigElement();
 document.body.append(testEditor);testEditor.hass=card.hass;testEditor.setConfig(original);
 check('Standalone test editor is isolated from installed background editors',testEditor.localName==='eleven-camera-background-editor-test'&&testEditor.shadowRoot.querySelector('details[slot]')?.parentElement===testEditor._nativeEditor);
 testEditor.remove();
 document.querySelector('#checks').textContent=JSON.stringify({pass:true,checks},null,2);
}catch(error){document.querySelector('#checks').textContent=JSON.stringify({pass:false,error:String(error),stack:error.stack,checks},null,2);}
