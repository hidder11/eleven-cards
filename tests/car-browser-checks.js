async function carChecks(){
 const {car,evcc,hass,config,evccConfig}=window.carQA,reports=[];
 const check=(name,ok)=>{if(!ok)throw Error(name);reports.push(name);};
 const q=selector=>car.shadowRoot.querySelector(selector),rect=selector=>q(selector).getBoundingClientRect();
 check('default soft bar is 8 px',q('.content').dataset.batteryStyle==='soft'&&rect('.battery-track').height===8);
 check('three fields and no tabs',car.shadowRoot.querySelectorAll('[data-ui-metric]').length===3&&!q('[role=tab]'));
 check('custom entity values and labels',q('.car-status').textContent.includes('Geparkeerd')&&q('.car-readings').textContent.includes('540 km'));
 let event;car.addEventListener('hass-more-info',e=>event=e.detail.entityId);q('.car-readings button').click();check('entity detail event',event==='sensor.range');
 for(const compact of [false,true])for(const width of [260,280,320,480])for(const darkMode of [false,true]){
  car.style.width=width+'px';evcc.style.width=width+'px';car.hass={...hass,themes:{darkMode}};evcc.hass={...hass,themes:{darkMode}};
  car.setConfig({...config,compact});evcc.setConfig({...evccConfig,compact});
  const er=selector=>evcc.shadowRoot.querySelector(selector).getBoundingClientRect(),style=selector=>getComputedStyle(q(selector)),es=selector=>getComputedStyle(evcc.shadowRoot.querySelector(selector));
  check('no overflow '+width+compact+darkMode,q('.content').scrollWidth<=q('.content').clientWidth);
  check('EVCC scene height '+width+compact+darkMode,Math.abs(rect('.car-stage').height-er('.car-stage').height)<.1);
  check('EVCC header position '+width+compact+darkMode,!q('h2')&&!evcc.shadowRoot.querySelector('h2')&&Math.abs((rect('.battery-value').top-rect('.header-scene').top)-(er('.battery-value').top-er('.header-scene').top))<.1);
  check('EVCC background fade '+width+compact+darkMode,style('.header-background').maskImage===es('.header-background').maskImage);
  const values=car.shadowRoot.querySelectorAll('.car-readings .ui-metric-value');check('metric alignment '+width+compact+darkMode,Math.abs(values[0].getBoundingClientRect().top-values[1].getBoundingClientRect().top)<.1);
  const height=rect('.car-stage').height;car.setConfig({...config,compact,image_scale:300,image_offset_y:60});check('zoom keeps fixed height '+width+compact+darkMode,height===rect('.car-stage').height);
  const img=rect('img'),picture=rect('.picture'),cardBox=rect('ha-card');
  check('car image defaults to card center '+width+compact+darkMode,Math.abs((img.left+img.right-cardBox.left-cardBox.right)/2)<.1);check('image stays centered '+width+compact+darkMode,Math.abs((img.left+img.right)/2-(picture.left+picture.right)/2)<.1);
 }
 car.style.width='';car.hass=hass;
 for(const background of ['lanes','halo','ribbon','prism-glass','eclipse','aurora','clouds','isobars']){car.setConfig({...config,background});check('background painted '+background,getComputedStyle(q('.header-background'),'::before').backgroundImage!=='none');}
 car.setConfig({...config,percentage_entity:'',percentage:73});check('fixed percentage',q('[role=progressbar]').getAttribute('aria-valuenow')==='73');
 car.setConfig(config);car.hass={...hass,states:{...hass.states,'sensor.fuel':{state:'unavailable'},'sensor.range':{state:'0',attributes:{unit_of_measurement:'km'}}}};
 check('unavailable percentage does not become zero',!q('[role=progressbar]')&&q('.battery-value').textContent.includes('\u2014'));check('zero reading is visible',q('.car-readings').textContent.includes('0 km'));
 car.setConfig({...config,field_2_label:'Een heel lang gegevenslabel dat meerdere regels in beslag neemt',field_3_label:'Km'});car.style.width='260px';
 const values=car.shadowRoot.querySelectorAll('.car-readings .ui-metric-value');check('long labels retain aligned values',Math.abs(values[0].getBoundingClientRect().top-values[1].getBoundingClientRect().top)<.1);
 car.setConfig({...config,title:'<img src=x onerror=alert(1)>',field_2_label:'<script>bad</script>'});check('labels escaped',!q('header img')&&!q('.car-readings script'));
 car.setConfig(config);car.hass={...hass,connected:false};check('offline readings identified',q('.notice').textContent.includes('Geen verbinding'));
 car.hass=hass;q('img').dispatchEvent(new Event('error'));check('broken image has fallback',q('img').hidden&&!q('.picture small').hidden);
 const editor=await car.constructor.getConfigElement();editor.hass=hass;editor.setConfig(config);document.querySelector('#editor').append(editor);
 const form=editor.shadowRoot.querySelector('ha-form');
 const flatten=rows=>rows.flatMap(row=>[row,...flatten(row.schema??[])]),schema=()=>flatten(form._schema);
 check('editor has percentage entity',schema().some(item=>item.name==='percentage_entity'));
 let changed;editor.addEventListener('config-changed',e=>changed=e.detail.config);form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{...config,percentage_entity:'',percentage:88,field_2_label:'Bereik'}}}));
 check('editor saves custom labels and fixed value',changed.percentage===88&&changed.field_2_label==='Bereik');check('fixed slider becomes available',schema().some(item=>item.name==='percentage'));
 check('editor groups common settings consistently',form._schema.slice(0,3).map(item=>item.name).join(',')==='general,vehicle_image,appearance'&&form._schema.every(item=>item.type==='expandable'&&item.flatten));
 check('editor localizes accent names',schema().find(item=>item.name==='color').selector.select.options[0].label==='Goud');
 const fieldDetails=form.querySelector('[data-field=field_2]');fieldDetails.open=true;
 form.querySelector('[name=show_field_2]').checked=false;form.querySelector('[name=show_field_2]').dispatchEvent(new Event('change'));
 check('field visibility hides its dependent settings and preserves expanded group',!schema().some(item=>item.name==='field_2_entity')&&form.querySelector('[data-field=field_2]').open&&changed.show_field_2===false);
 editor.setConfig(config);
 for(const compact of [false,true]){
  car.setConfig({...config,compact,show_field_2:false,show_field_3:false});
  const bottom=rect('.car-status').bottom;
  check('wide field has no empty lower row '+compact,!q('.car-readings')&&Math.abs(rect('.header-scene').bottom-bottom)<.1);
  check('wide field retains only outer bottom padding '+compact,Math.abs(rect('.content').bottom-bottom-16)<.1);
 }
 car.setConfig({...config,show_field_1:false,show_field_2:false});check('custom panels can be hidden individually',!q('.car-status')&&q('.car-readings').style.getPropertyValue('--ui-metric-columns')==='1'&&q('.car-readings').textContent.includes('98.452 km'));
 car.setConfig({...config,show_field_1:false,show_field_2:false,show_field_3:false});check('all custom panels can be hidden',!q('.car-status')&&!q('.car-readings'));
 car.hass={...hass,states:{...hass.states,'sensor.range':{state:'5',attributes:{range:320.55,unit_of_measurement:'L'}}}};
 car.setConfig({...config,field_2_attribute:'range',field_2_unit:'km',field_2_decimals:1});check('custom formatting is reflected in rendered reading',q('.car-readings').textContent.includes('320,6 km'));
 car.hass=hass;car.setConfig(config);
 car.setConfig({...config,range_source:'entity',range_entity:'sensor.range'});
 check('non-EVCC range is the primary subtitle',q('.primary-label').textContent.includes('540 km')&&q('.primary-label').getBoundingClientRect().top>=q('.primary-value').getBoundingClientRect().bottom);
 q('button.primary-label').click();check('range opens source entity details',event==='sensor.range');
 car.hass={...hass,states:{...hass.states,'sensor.range':{state:'450',attributes:{unit_of_measurement:'km'}}}};
 check('range sensor changes are reflected live',q('.primary-label').textContent.includes('450 km'));
 car.hass={...hass,states:{...hass.states,'sensor.range':{state:'unavailable'}}};
 check('unavailable range source is marked missing',q('.primary-label').textContent.includes('\u2014'));
 car.hass=hass;car.setConfig({...config,range_source:'calculated',range_full:800});
 check('range estimate is explicit and follows current percentage',q('.primary-label').textContent.includes('496 km')&&q('.primary-label').textContent.includes('geschat bereik')&&!q('button.primary-label'));
 car.hass={...hass,states:{...hass.states,'sensor.fuel':{state:'50'}}};check('range estimate follows percentage updates',q('.primary-label').textContent.includes('400 km'));
 car.hass={...hass,states:{...hass.states,'sensor.fuel':{state:'unavailable'}}};check('unknown percentage has no invented estimate',q('.primary-label').textContent.includes('\u2014'));
 car.hass=hass;
 for(const compact of [false,true])for(const width of [260,320,480]){
  car.style.width=width+'px';car.setConfig({...config,compact,range_source:'calculated',range_full:800});
  check('range fits header '+compact+width,q('.content').scrollWidth<=q('.content').clientWidth&&q('.primary-label').getBoundingClientRect().right<=q('.content').getBoundingClientRect().right);
 }
 editor.setConfig({...config,range_source:'entity',range_entity:'sensor.range',range_full:800});
 check('entity range settings hide calculation settings',schema().some(item=>item.name==='range_entity')&&!schema().some(item=>item.name==='range_full'));
 form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{range_source:'calculated'}}}));
 check('range calculation settings show total range and retain sensor',schema().some(item=>item.name==='range_full')&&!schema().some(item=>item.name==='range_entity')&&changed.range_entity==='sensor.range'&&changed.range_full===800);
 editor.setConfig(config);car.setConfig(config);
 const states={...hass.states,
  'select.mode':{state:'smart',attributes:{options:['off','smart','now']}},
  'number.solar':{state:'60',attributes:{min:0,max:100,step:10,unit_of_measurement:'%'}},
  'sensor.energy':{state:'12.4',attributes:{unit_of_measurement:'kWh'}},
  'binary_sensor.connected':{state:'on',attributes:{}},
  'binary_sensor.charging':{state:'on',attributes:{}},
  'sensor.current':{state:'10',attributes:{unit_of_measurement:'A'}},
 };
 const calls=[],linkedHass={...hass,states,callService:async(domain,service,data)=>{calls.push({domain,service,data});}};
 const linked={...config,evcc_enabled:true,compact:true,tabs:['controls','session','technical'],entities:{soc:'sensor.soc',power:'sensor.power',mode:'select.mode',solar_share:'number.solar',charged_energy:'sensor.energy',connected:'binary_sensor.connected',charging:'binary_sensor.charging',current:'sensor.current'}};
 car.hass=linkedHass;
 for(const evcc_enabled of [false,true])for(const compact of [false,true]){
  const selected={...linked,evcc_enabled,compact,background:'lanes'};car.setConfig(selected);const stageHeight=rect('.car-stage').height;
  for(const background of ['aurora','clouds','isobars']){
   car.setConfig({...selected,background});
   check('shared car atmosphere '+background+evcc_enabled+compact,!!q('.header-atmosphere')&&rect('.car-stage').height===stageHeight&&car.shadowRoot.getAnimations().some(animation=>animation.animationName?.startsWith('weather-')));
   for(const width of [260,480]){car.style.width=width+'px';check('animated car header fits '+background+evcc_enabled+compact+width,q('.content').scrollWidth<=q('.content').clientWidth);}
   car.setConfig({...selected,background,animate_background:false});check('car background motion can stop '+background+evcc_enabled+compact,!car.shadowRoot.getAnimations().some(animation=>animation.animationName?.startsWith('weather-')));
   car.setConfig({...selected,background});car.hass={...linkedHass,connected:false};check('offline stops car atmosphere '+background+evcc_enabled+compact,!car.shadowRoot.getAnimations().some(animation=>animation.animationName?.startsWith('weather-')));car.hass=linkedHass;
  }
 }
 car.style.width='320px';car.hass=linkedHass;car.setConfig(linked);
 check('unified EVCC compact keeps all chosen tabs',car.shadowRoot.querySelectorAll('[role=tab]').length===3&&q('[data-ui-tab=controls]'));
 check('EVCC uses real battery source instead of custom fuel',q('[role=progressbar]').getAttribute('aria-valuenow')==='62'&&q('.battery-value button').dataset.entity==='sensor.soc');
 check('compact controls include solar preference',!!q('[data-solar-share]'));
 const title=car._config.title;car.setConfig({...linked,title:''});check('unified default name remains accessible without visible title',!q('h2')&&q('ha-card').getAttribute('aria-label')==='Mijn auto');car.setConfig({...linked,title});
 q('[data-mode=now]').click();await Promise.resolve();check('EVCC mode controls still write selected loadpoint',calls.length===1&&calls[0].data.entity_id==='select.mode'&&calls[0].data.option==='now');
 car.setConfig(linked);q('[data-ui-tab=session]').click();check('compact session tab renders session metrics',!q('[data-ui-tab-panel=session]').hidden&&q('[data-field=charged_energy]').textContent.includes('12,4 kWh'));
 q('[data-ui-tab=technical]').click();check('compact details tab works',!q('[data-ui-tab-panel=technical]').hidden);check('technical tab is named EVCC',q('[data-ui-tab=technical]').textContent.trim()==='EVCC');
 for(const tabs of [[],['session'],['controls'],['technical'],['controls','technical']])for(const compact of [true,false]){
  car.setConfig({...linked,tabs,compact});check('exact chosen tabs '+tabs+compact,JSON.stringify([...car.shadowRoot.querySelectorAll('[role=tab]')].map(tab=>tab.dataset.uiTab))===JSON.stringify(tabs.length===1?[]:['controls','session','technical'].filter(tab=>tabs.includes(tab))));
 }
 car.setConfig(linked);editor.setConfig(linked);
 check('linked editor offers EVCC sensor and tab selector',schema().some(item=>item.name==='entity')&&schema().some(item=>item.name==='tabs'));
 check('linked editor hides custom fields',!schema().some(item=>item.name==='field_1'||item.name==='percentage_entity'||item.name==='color'));
 check('EVCC editor hides custom range settings',!schema().some(item=>['range_source','range_full','range_entity'].includes(item.name)));
 check('EVCC overrides exclude obsolete fields',!schema().some(item=>['co2','remaining_energy'].includes(item.name)));
 check('EVCC overrides are grouped by purpose',['evcc_vehicle','evcc_live','evcc_controls','evcc_session','evcc_details'].every(name=>schema().some(item=>item.name===name)));
 editor.setConfig({...linked,tabs:['session','technical'],default_tab:'technical'});
 check('default tab editor only lists visible tabs',schema().find(item=>item.name==='default_tab').selector.select.options.map(item=>item.value).join(',')==='session,technical');
 car.setConfig({...linked,default_tab:'technical'});check('configured default tab opens',q('[data-ui-tab=technical]').getAttribute('aria-selected')==='true');
 q('[data-ui-tab=session]').click();car.hass={...linkedHass,states:{...states,'sensor.soc':{state:'63',attributes:{unit_of_measurement:'%'}}}};
 check('telemetry preserves manually selected tab',q('[data-ui-tab=session]').getAttribute('aria-selected')==='true');
 editor.setConfig({...linked,tabs:[]});check('no tabs hides default tab setting',!schema().some(item=>item.name==='default_tab'));
 editor.setConfig(linked);
 form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{evcc_enabled:false}}}));
 check('editor switches back to custom settings',schema().some(item=>item.name==='field_1')&&!schema().some(item=>item.name==='entity'||item.name==='tabs'));
 check('switch preserves dormant EVCC settings',changed.entities.mode==='select.mode'&&changed.tabs.length===3&&changed.field_2_label==='Actieradius');
 const requests=calls.length;car.setConfig(changed);
 check('disabled EVCC restores custom values and stops clock',q('.car-status').textContent.includes('Geparkeerd')&&!q('[role=tab]')&&!car._clockTimer);
 check('disabled EVCC does not write anything',calls.length===requests);
 car.hass=linkedHass;car.setConfig({...linked,tabs:['session']});check('single session uses a named section without tab navigation',!q('[role=tab]')&&!!q('section.evcc-panel[aria-label] .session'));
 car.setConfig({...linked,tabs:['controls']});check('hiding active tab selects a visible tab',!q('[role=tab]')&&!!q('section.evcc-panel[aria-label] .charging-controls'));
 const customTabs=[{id:'custom-vehicle',title:'Voertuig',entities:[{entity:'sensor.range',name:'Resterend bereik',decimals:0},'sensor.status']},{id:'custom-trip',title:'Ritgegevens',entities:[{entity:'sensor.odometer',name:'Kilometerstand'}]}];
 for(const evcc_enabled of [false,true])for(const compact of [false,true]){
  car.hass=linkedHass;car.setConfig({...linked,evcc_enabled,compact,tabs:[],custom_tabs:customTabs,default_tab:'custom-trip'});
  check('custom tabs work in either mode '+evcc_enabled+compact,car.shadowRoot.querySelectorAll('[role=tab]').length===2&&q('[data-ui-tab=custom-trip]').getAttribute('aria-selected')==='true');
  q('[data-ui-tab=custom-vehicle]').click();check('custom tab values retain labels and source units '+evcc_enabled+compact,q('[data-ui-tab-panel=custom-vehicle]').textContent.includes('540 km')&&q('[data-ui-tab-panel=custom-vehicle]').textContent.includes('Resterend bereik'));
  q('[data-ui-tab-panel=custom-vehicle] button').click();check('custom tab opens entity '+evcc_enabled+compact,event==='sensor.range');
  q('[data-ui-tab=custom-vehicle]').focus();q('[data-ui-tab=custom-vehicle]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
  check('custom tabs support keyboard navigation '+evcc_enabled+compact,q('[data-ui-tab=custom-trip]').getAttribute('aria-selected')==='true');
  car.hass={...linkedHass,states:{...states,'sensor.odometer':{state:'100000',attributes:{unit_of_measurement:'km'}}}};
  check('custom tab source updates rerender in either mode '+evcc_enabled+compact,q('[data-ui-tab-panel=custom-trip]').textContent.includes('100.000 km')&&car.shadowRoot.activeElement?.dataset.uiTab==='custom-trip');
  car.setConfig({...linked,evcc_enabled,compact,tabs:[],custom_tabs:[{...customTabs[0],title:'Een heel lang tabblad met heel veel woorden'},{...customTabs[1],show:false}]});
  car.style.width='260px';check('long custom tab fits without card overflow '+evcc_enabled+compact,q('.content').scrollWidth<=q('.content').clientWidth);
 }
 car.hass=linkedHass;
 car.setConfig({...linked,tabs:['controls'],custom_tabs:customTabs});check('EVCC and custom tabs share one tab bar',car.shadowRoot.querySelectorAll('[role=tablist]').length===1&&car.shadowRoot.querySelectorAll('[role=tab]').length===3);
 for(const [battery_style,height] of [['classic',12],['slim',8],['soft',8],['line',4]]){
  car.setConfig({...linked,battery_style,animation_max_kw:12,animation_speed:2});
  check('bar variant height '+battery_style,rect('.battery-track').height===height);
  check('motion responds to chosen maximum and speed '+battery_style,Math.abs(Number.parseFloat(q('.content').style.getPropertyValue('--power-duration'))-(12-10*6.4/12)/2)<.001);
 }
 car.setConfig({...linked,image_offset_x:0});const centered=rect('img'),height=rect('.car-stage').height,linkedCard=rect('ha-card');
 check('EVCC image defaults to full card center',Math.abs((centered.left+centered.right-linkedCard.left-linkedCard.right)/2)<.1);
 car.setConfig({...linked,image_offset_x:45});check('image horizontal offset preserves header size',Math.abs(rect('img').left-centered.left-45)<.1&&rect('.car-stage').height===height);
 editor.setConfig({...config,custom_tabs:[]});editor.shadowRoot.querySelector('[data-action=tab-add]').click();
 check('editor can add and expand custom tab',changed.custom_tabs.length===1&&editor.shadowRoot.querySelector('.custom-tabs details').open);
 let tabForm=editor.shadowRoot.querySelector('.tab-form');tabForm.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{title:'Onderhoud'}}}));
 editor.shadowRoot.querySelector('[data-action=row-add]').click();
 let rowForm=editor.shadowRoot.querySelector('.tab-entities ha-form');rowForm.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{entity:'sensor.range',name:'Bereik',decimals:1}}}));
 check('editor saves custom tab entity and label',changed.custom_tabs[0].title==='Onderhoud'&&changed.custom_tabs[0].entities[0].entity==='sensor.range'&&changed.custom_tabs[0].entities[0].name==='Bereik');
 // Exercise per-keystroke edits, including the config echo and hass updates from HA.
 document.querySelector('#editor').hidden=false;
 const typeInto=(targetForm,name,text)=>{
  const input=targetForm.querySelector('[name='+name+']');input.value='';input.focus();
  for(const character of text){
   input.setRangeText(character,input.selectionStart,input.selectionEnd,'end');
   const caret=input.selectionStart;
   targetForm.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{...targetForm._data,[name]:input.value}},bubbles:true,composed:true}));
   editor.setConfig(changed);editor.hass={...hass};
   check('typing retains focus and caret '+name+' '+caret,editor.shadowRoot.activeElement===input&&input.selectionStart===caret&&input.selectionEnd===caret);
  }
  check('typing preserves spaces '+name,input.value===text);
 };
 typeInto(tabForm,'title','Mijn onderhoud');
 typeInto(rowForm,'name','Resterend bereik');
 check('typed tab and entity labels saved',changed.custom_tabs[0].title==='Mijn onderhoud'&&changed.custom_tabs[0].entities[0].name==='Resterend bereik');
 tabForm.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{title:'Onderhoud'}}}));
 document.querySelector('#editor').hidden=true;
 editor.shadowRoot.querySelector('[data-action=row-add]').click();
 const rowForms=editor.shadowRoot.querySelectorAll('.tab-entities ha-form');rowForms[1].dispatchEvent(new CustomEvent('value-changed',{detail:{value:{entity:'sensor.odometer',name:'Km'}}}));
 editor.shadowRoot.querySelectorAll('[data-action=row-up]')[1].click();check('editor reorders entities',changed.custom_tabs[0].entities[0].entity==='sensor.odometer');
 editor.shadowRoot.querySelector('[data-action=tab-add]').click();const stableId=changed.custom_tabs[1].id;
 editor.shadowRoot.querySelectorAll('[data-action=tab-up]')[1].click();check('editor reorders tabs without changing IDs',changed.custom_tabs[0].id===stableId);
 editor.shadowRoot.querySelector('[data-action=tab-remove]').click();check('editor removes selected tab',changed.custom_tabs.length===1&&changed.custom_tabs[0].title==='Onderhoud');
 editor.shadowRoot.querySelector('[data-action=row-remove]').click();check('editor removes selected entity',changed.custom_tabs[0].entities.length===1&&changed.custom_tabs[0].entities[0].entity==='sensor.range');
 car.remove();check('removal clears clock and actions',!car._clockTimer&&!car._pendingMode&&!car._pendingSolar);
 for(const defaultTab of ['controls','technical'])for(const manual of [false,true]){
  const card=document.createElement('eleven-car-card');
  let complete;
  const connection={},registry=new Promise(resolve=>complete=resolve);
  const states={
   'sensor.evcc_review_charge_power':{state:'0',attributes:{unit_of_measurement:'kW'}},
   'select.renamed_review_mode':{state:'pv',attributes:{options:['off','pv']}},
   'binary_sensor.renamed_review_connected':{state:'on'},
  };
  card.setConfig({evcc_enabled:true,entity:'sensor.evcc_review_charge_power',default_tab:defaultTab,custom_tabs:[{id:'custom-review',title:'Extra',entities:[]}]});
  document.body.append(card);
  try{
   card.hass={states,connection,callWS:()=>registry};
   check('pending registry retains '+defaultTab+manual,card._activeTab===defaultTab);
   if(manual)card.shadowRoot.querySelector('[data-ui-tab=session]').click();
   complete([
    ['sensor.evcc_review_charge_power','charge_power'],
    ['select.renamed_review_mode','mode'],
    ['binary_sensor.renamed_review_connected','connected'],
   ].map(([entity_id,key])=>({entity_id,unique_id:'evcc_intg.evcc_review_'+key,platform:'evcc_intg',config_entry_id:'review'})));
   await new Promise(resolve=>setTimeout(resolve,0));
   check('registry resolves default or manual tab '+defaultTab+manual,card._activeTab===(manual?'session':defaultTab)&&card.shadowRoot.querySelector('[role=tab][aria-selected=true]').dataset.uiTab===card._activeTab);
  }finally{card.remove();}
 }
 const countdown=document.createElement('eleven-car-card'),originalNow=Date.now;
 const base=Math.floor(originalNow()/30000)*30000+1000;
 try{
  Date.now=()=>base;
  countdown.setConfig({evcc_enabled:true,entity:'sensor.review_power',entities:{connected:'binary_sensor.review_connected',charging:'binary_sensor.review_charging',mode:'select.review_mode',pv_action:'sensor.review_action',pv_remaining:'sensor.review_deadline'}});
  document.body.append(countdown);
  countdown.hass={language:'en',states:{
   'sensor.review_power':{state:'0',attributes:{unit_of_measurement:'kW'}},
   'binary_sensor.review_connected':{state:'on'},'binary_sensor.review_charging':{state:'off'},
   'select.review_mode':{state:'pv'},'sensor.review_action':{state:'enable'},
   'sensor.review_deadline':{state:new Date(base+65000).toISOString(),attributes:{device_class:'timestamp'}},
  }};
  check('countdown starts at displayed seconds',countdown.shadowRoot.textContent.includes('Starts in 1:05'));
  for(const [elapsed,text] of [[1000,'1:04'],[10000,'0:55'],[65000,null]]){
   Date.now=()=>base+elapsed;countdown._render();
   check('clock tick updates countdown '+elapsed,text?countdown.shadowRoot.textContent.includes('Starts in '+text):!countdown.shadowRoot.textContent.includes('Starts in'));
  }
 }finally{Date.now=originalNow;countdown.remove();}
 return reports;
}
