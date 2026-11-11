async function(){
 const wait=async test=>{for(let i=0;i<100;i++){if(test())return;await new Promise(resolve=>setTimeout(resolve,10));}throw Error('Timed out waiting for energy data');};
 await wait(()=>energyFlowConcepts.every(c=>c._prefs&&!c._loading));
 const {assertCardBackground}=await import('/tests/card-background-browser-checks.js');
 let count=0;const check=(ok,message)=>{if(!ok)throw Error(message);count++;},cards=energyFlowConcepts;
 check(!document.querySelector('#consumer'),'no custom entity controls');
 for(const light of [false,true]){
  if(document.body.classList.contains('light')!==light)document.querySelector('#theme').click();
  for(const width of [260,360,480,640])for(const card of cards){
   card.style.width=width+'px';card.render();const r=card.shadowRoot;
   check(r.querySelector('.content').scrollWidth<=card.clientWidth,'no horizontal overflow');
   check(r.querySelectorAll('.circle-node').length===3&&r.querySelectorAll('[data-ui-metric]').length===6,'three flow nodes');
   check(!r.querySelector('.tabs,.energy-panel,.chart,.consumer-node,.other-node,.share-track'),'no tabs, chart or extra content');
   check(r.querySelectorAll('[data-view-button]').length===1,'one opposite view button');
   check(r.querySelectorAll('[data-ui-primary-value]').length===1,'shared primary measurement');
   if(card._view==='history'){
    const mode=r.querySelector('[data-view-button]').getBoundingClientRect(),period=r.querySelector('[data-period=menu]').getBoundingClientRect();
    const heading=r.querySelector('.energy-heading').getBoundingClientRect(),toolbar=r.querySelector('.toolbar').getBoundingClientRect();
    check((toolbar.top>=heading.bottom||(Math.abs(toolbar.top-heading.top)<3&&toolbar.left>=heading.right))&&(width>360||toolbar.top>=heading.bottom),'historical controls wrap without overlapping the primary value');
    check(Math.abs(mode.top-period.top)<1&&period.right<=mode.left+1,'mode and period stay alongside');
    for(const button of r.querySelectorAll('.chart-controls>[data-period]'))check(getComputedStyle(button).display!=='none'&&Math.abs(button.getBoundingClientRect().top-mode.top)<1,'navigation stays visible on one row');
    check(getComputedStyle(r.querySelector('.period-menu-navigation')).display==='none','popup omits duplicate navigation');
   }
   check(!r.querySelector('[data-view-button][role=tab]'),'buttons have no tab semantics');
   const rect=s=>r.querySelector(s).getBoundingClientRect();
   check(r.querySelectorAll('.flow-route').length===3,'three distinct connections');
   for(const node of r.querySelectorAll('.circle-node')){const style=getComputedStyle(node),probe=document.createElement('span');probe.style.cssText='border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px));background:var(--eleven-material-control-background,var(--secondary-background-color,transparent))';r.append(probe);const control=getComputedStyle(probe);check(style.borderRadius===control.borderRadius,'nodes share themed control rounding');check(style.backgroundColor===control.backgroundColor&&style.backgroundColor!=='rgba(0, 0, 0, 0)','nodes share themed control paint');probe.remove();}
   check(r.querySelectorAll('.flow-reading').length===3,'three uniform route values');
   check(r.querySelector('[data-metric=solar] [data-energy-icon=solar]')!=null,'solar panel icon');
   check(r.querySelector('[data-metric=import] [data-energy-icon=import]')!=null,'import direction icon');
   check(r.querySelector('[data-metric=export] [data-energy-icon=export]')!=null,'export direction icon');
   await assertCardBackground(card,(name,ok)=>check(ok,name));
  }
 }
 for(const width of [260,360,480,640])for(const compact of [false,true]){
  const sizes=[];
  for(const view of ['live','history']){const probe=document.createElement('eleven-energy-flow-card');probe.style.width=width+'px';probe.setConfig({view,compact});document.body.append(probe);probe.render();sizes.push(getComputedStyle(probe.shadowRoot.querySelector('.primary-value')).fontSize);probe.remove();}
  check(sizes[0]===sizes[1],'equal primary font sizes in both views');
 }
 const card=cards[0],r=card.shadowRoot;
 r.querySelector('[data-view-button=history]').focus();r.querySelector('[data-view-button=history]').click();
 check(card._view==='history','history button switches');
 check(r.activeElement?.dataset.viewButton==='live','focus moves to the opposite mode button');
 check(r.querySelector('[data-view-button=live]').closest('.chart-controls')===r.querySelector('[data-period=menu]').closest('.chart-controls'),'mode and period share a group');
 check(!r.querySelector('.period-menu [data-view-button]'),'period popup stays generic');
 await wait(()=>card._statistics&&!card._loading);
 check(r.querySelector('.primary-value').textContent.includes('kWh'),'history unit');
 r.querySelector('[data-period=menu]').click();await new Promise(resolve=>setTimeout(resolve,60));check(r.querySelector('.period-menu').matches(':popover-open'),'period picker opens');
 r.querySelector('[data-period-tab=calendar]').click();r.querySelector('[data-period-option=week]').click();check(card._periodMode==='week','week selected');
 const start=card._start;r.querySelector('.period-menu-navigation [data-period=previous]').click();check(card._start<start,'popup previous period');r.querySelector('.period-menu-navigation [data-period=now]').click();check(card._periodOffset===0,'popup now period');
 r.querySelector('[data-period=menu]').click();await new Promise(resolve=>setTimeout(resolve,60));r.querySelector('[data-period-tab=custom]').click();
 const form=r.querySelector('[data-custom-range]');form.elements.namedItem('start').value='2026-10-01T00:00';form.elements.namedItem('end').value='2026-10-03T00:00';form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));check(card._periodMode==='custom'&&card._end-card._start===48*3600000,'custom range retained');
 r.querySelector('[data-view-button=live]').click();check(card._view==='live'&&!r.querySelector('[data-period=menu]'),'live hides picker');
 check(r.querySelector('.primary-value').textContent.includes('kW')&&!r.querySelector('.primary-value').textContent.includes('kWh'),'live unit');
 r.querySelector('[data-view-button=history]').click();check(card._periodMode==='custom','selected period preserved across mode changes');
 document.querySelector('#motion').click();check(cards.every(c=>c.shadowRoot.getAnimations().every(a=>a.playState!=='running')),'motion toggle');
 // Exercise the production component with HA messages, not the concept's fake totals.
 const probe=document.createElement('eleven-energy-flow-card');probe.style.cssText='position:fixed;top:0;left:0;width:280px;height:600px;z-index:100';
 probe.setConfig({title:'<img src=x onerror=alert(1)>'});document.body.append(probe);
 const sourcePrefs={energy_sources:[{type:'solar',stat_rate:'sensor.solar',stat_energy_from:'solar:test'},{type:'grid',stat_rate:'sensor.grid',stat_energy_from:'grid:in',stat_energy_to:'grid:out'}]};
 const sensor=value=>({state:String(value),attributes:{unit_of_measurement:'W'}}),calls=[];
 const hass={language:'en',config:{time_zone:'Europe/Amsterdam'},themes:{darkMode:true},states:{'sensor.solar':sensor(4000),'sensor.grid':sensor(-1000)},callWS:async message=>{calls.push(message);return message.type==='energy/get_prefs'?sourcePrefs:Object.fromEntries(message.statistic_ids.map(id=>[id,[{change:id==='solar:test'?12:id==='grid:in'?4:2}]]));}};
 probe.hass=hass;await wait(()=>probe._prefs&&!probe._loading);
 const root=probe.shadowRoot;
 check(root.querySelector('.primary-value').textContent.includes('3'),'live power calculated from HA states');
 check(!root.querySelector('img'),'configured title escaped');
 check(root.querySelector('[data-metric=export]').textContent.includes('Grid export'),'English labels');
 probe.hass={...hass,states:{...hass.states,'sensor.grid':sensor(1000)}};
 check(root.querySelector('.primary-value').textContent.includes('5'),'hass state updates live total');
 check(calls.length===1,'state updates do not request historical data');
 probe.hass={...hass,states:{...hass.states,'sensor.grid':sensor('unavailable')}};
 check(root.querySelector('[data-metric=import] .ui-metric-value').textContent.includes('—'),'unavailable grid is not shown as zero');
 check(root.querySelector('[role=status]').textContent.includes('Live power is missing'),'missing power guidance');
 probe.hass={...hass,connected:false};check(root.querySelector('[role=status]').textContent.includes('Disconnected'),'offline guidance');
 probe.hass=hass;await wait(()=>probe._prefs&&!probe._loading);
 root.querySelector('[data-view-button=history]').click();await wait(()=>probe._statistics&&!probe._loading);
 check(root.querySelector('.primary-value').textContent.includes('14'),'Recorder changes determine historical home usage');
 const request=calls.find(message=>message.type==='recorder/statistics_during_period');
 check(request.units.energy==='kWh'&&request.types[0]==='change','Recorder contract');
 const savedStatistics=probe._statistics;
 probe._statistics={'solar:test':[{change:1234567}],'grid:in':[{change:123456}],'grid:out':[{change:12345}]};probe.render();
 check(root.querySelector('.content').scrollWidth<=probe.clientWidth,'large historical totals do not overflow');
 probe._statistics=savedStatistics;probe.render();
 probe.setConfig({...probe._config,compact:true});
 const box=selector=>root.querySelector(selector).getBoundingClientRect();
 check([...root.querySelectorAll('[data-ui-metric]')].every(metric=>metric.dataset.density==='compact'),'all metric surfaces use compact density');
 check(root.querySelector('.content').scrollWidth<=probe.clientWidth,'compact does not overflow');
 // Configuration updates must preserve the Recorder result and avoid new requests.
 const requestCount=calls.length,statistics=probe._statistics,base={...probe._config};
 probe.setConfig({...base,background_strength:35});
 check(probe._statistics===statistics&&calls.length===requestCount,'cosmetic edits preserve history without refetch');
 check(Math.abs(Number(getComputedStyle(root.querySelector('.scene-background')).opacity)-.35)<.001,'background intensity is shared');
 for(let mask=0;mask<8;mask++){
  probe.setConfig({...base,show_field_1:!!(mask&1),show_field_2:!!(mask&2),show_field_3:!!(mask&4)});
  check(root.querySelectorAll('[data-ui-metric]:not(.circle-node)').length===Number(!!(mask&1))+Number(!!(mask&2))+Number(!!(mask&4)),'independent metric visibility '+mask);
  check(!!root.querySelector('.flow-secondary')===!!(mask&6),'no empty lower metric grid '+mask);
  check(root.querySelector('.content').scrollWidth<=probe.clientWidth,'hidden fields retain narrow layout '+mask);
 }
 probe.setConfig(base);
 // Exercise the same bus used by the graph cards, across separately loaded modules.
 const {chooseGraphPeriod}=await import('/shared/periods.js');
 const syncGroup='energy-browser-'+Date.now();
 probe.setConfig({...base,sync_timeframe:true,hover_sync_group:syncGroup});
 const peer=document.createElement('eleven-energy-flow-card'),live=document.createElement('eleven-energy-flow-card');
 for(const [item,view] of [[peer,'history'],[live,'live']]){item.style.width='280px';item.setConfig({default_view:view,sync_timeframe:true,hover_sync_group:syncGroup});document.body.append(item);}
 chooseGraphPeriod(probe,'week');
 check(peer._periodMode==='week'&&peer._start===probe._start&&peer._end===probe._end,'historical energy follows shared periods');
 check(live._periodMode==='today'&&!live._disconnectTimeframeSync,'live energy stays independent');
 live.shadowRoot.querySelector('[data-view-button=history]').click();
 check(live._periodMode==='week'&&live._start===probe._start,'entering history adopts the latest shared selection');
 live.shadowRoot.querySelector('[data-view-button=live]').click();
 const liveStart=live._start;chooseGraphPeriod(probe,'month');
 check(peer._periodMode==='month'&&live._start===liveStart&&!live._disconnectTimeframeSync,'leaving history unsubscribes');
 peer.remove();chooseGraphPeriod(probe,'year');check(peer._periodMode==='month','detached cards unsubscribe');
 document.body.append(peer);check(peer._periodMode==='year','reattaching adopts latest shared period');
 peer.setConfig({...peer._config,sync_timeframe:false});chooseGraphPeriod(probe,'day');
 check(peer._periodMode==='year'&&!peer._sharedTimeframe,'opt-out clears the shared selection');
 peer.setConfig({...peer._config,sync_timeframe:true,hover_sync_group:syncGroup+'-other'});chooseGraphPeriod(probe,'week');
 check(peer._periodMode==='year','different sync groups stay independent');
 peer.remove();live.remove();probe.setConfig(base);
 const editor=await probe.constructor.getConfigElement();editor.setConfig(probe._config);editor.hass=hass;document.body.append(editor);
 const editorForm=editor._nativeEditor.shadowRoot.querySelector('ha-form');
 check(editorForm.schema.some(group=>group.name==='power'),'visual editor includes power overrides');
 editor.setConfig({...probe._config,title:'New title'});check(editor._nativeEditor.shadowRoot.querySelector('ha-form')===editorForm,'editor retains form on config updates');
 let changed;editor.addEventListener('config-changed',event=>changed=event.detail.config);
 editorForm.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{...editorForm.data,title:'Kitchen'}}}));
 check(changed?.title==='Kitchen','editor emits config changes');editor.remove();
 probe.hass={...hass,connection:{},callWS:async()=>{throw Error('denied');}};await wait(()=>probe._error&&!probe._loading);
 check(root.querySelector('[data-retry]')!=null,'request failure offers retry');
 probe._hass=hass;root.querySelector('[data-retry]').click();await wait(()=>probe._statistics&&!probe._loading);
 check(!root.querySelector('[data-retry]'),'successful retry clears error');
 probe.remove();check(!probe._timer&&!probe._loading,'disconnection stops refresh work');
 return count;
}
