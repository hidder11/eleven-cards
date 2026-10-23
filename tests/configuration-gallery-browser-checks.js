async function galleryChecks(){
 const wait=async test=>{for(let i=0;i<100&&!test();i++)await new Promise(resolve=>setTimeout(resolve,20));if(!test())throw Error('Gallery did not finish loading');};
 await wait(()=>window.configurationGallery?.length===48&&configurationGallery.every(r=>r.card.shadowRoot.querySelector('ha-card')));
 await wait(()=>configurationGallery.filter(r=>r.sample.kind==='energy').every(r=>r.card._prefs&&!r.card._loading));
 const reports=[],check=(ok,message)=>{if(!ok)throw Error(message);reports.push(message);},records=configurationGallery;
 check(new Set(records.map(r=>r.config.background||'lanes')).size===8,'all eight shared backgrounds');
 for(const light of [false,true]){
  if(document.body.classList.contains('light')!==light)document.querySelector('#theme').click();
  for(const width of [260,360,480])for(const {card,sample} of records){
   card.style.width=width+'px';const root=card.shadowRoot,content=root.querySelector('.content'),primary=root.querySelector('[data-ui-primary-value]');
   check(root.querySelectorAll('[data-ui-primary-value]').length===1,sample.name+': one shared primary value');
   check(content.scrollWidth<=card.clientWidth+1,sample.name+': no overflow at '+width);
   const header=root.querySelector('.header-region'),backdrop=root.querySelector('.header-background,.scene-background');
   check(Math.abs(header.getBoundingClientRect().height-backdrop.getBoundingClientRect().height)<1,sample.name+': backdrop follows header');
   check(getComputedStyle(backdrop).maskImage.includes('88%'),sample.name+': shared relative fade');
   for(const metric of root.querySelectorAll('[data-ui-metric]')){
    check(metric.querySelector('.ui-metric-title')&&metric.querySelector('.ui-metric-value'),sample.name+': shared reading structure');
    check(getComputedStyle(metric).padding===(metric.dataset.density==='compact'?'8px':'12px'),sample.name+': shared density');
    const icon=metric.querySelector('.ui-metric-icon');
    if(icon)check(getComputedStyle(icon).width===(metric.dataset.density==='compact'?'20px':'26px'),sample.name+': smaller shared icon');
   }
   for(const grid of root.querySelectorAll('[data-ui-metric-grid]')){
    const values=[...grid.querySelectorAll('.ui-metric-value')].map(v=>v.getBoundingClientRect());
    check(values.length<2||Math.abs(values[0].top-values[1].top)<1,sample.name+': paired values align');
   }
   if(primary.dataset.unavailable==='true')check(!primary.querySelector('small'),sample.name+': unavailable value has no unit');
   if(sample.kind==='weather')check(!root.querySelector('header'),sample.name+': no top-right weather text');
   if(sample.kind==='car'||sample.kind==='evcc')check(!root.querySelector('header .range'),sample.name+': range belongs to primary value');
   check(!root.querySelector('button button'),sample.name+': native actions are never nested');
  }
 }
 const car=records.find(r=>r.sample.name==='Brandstof & eigen sensoren');
 let id;car.card.addEventListener('hass-more-info',event=>id=event.detail.entityId);
 car.card.shadowRoot.querySelector('[data-car-field="2"]').click();check(id==='sensor.range','custom reading opens its own sensor');
 car.card.shadowRoot.querySelector('.primary-number').click();check(id==='sensor.fuel','primary measurement opens source entity');
 car.card.shadowRoot.querySelector('button.primary-label').click();check(id==='sensor.range','primary subtitle retains source action');
 const {uiMetric,uiMetricStyles}=await import('/shared/ui-metric.js');
 const fixture=document.createElement('div');document.body.append(fixture);const shadow=fixture.attachShadow({mode:'open'});
 for(const compact of [false,true])for(const icon of ['', 'mdi:car'])for(const info of ['', 'Extra informatie']){
  shadow.innerHTML='<style>'+uiMetricStyles()+'</style><div data-ui-metric-grid style="width:260px">'+uiMetric({title:'Laadvermogen',value:7.1,unit:'kW',icon,info,compact})+uiMetric({title:'Laadvermogen',value:7.1,unit:'kW',icon,compact})+'</div>';
  const metrics=[...shadow.querySelectorAll('[data-ui-metric]')],boxes=metrics.map(m=>m.querySelector('.ui-metric-value').getBoundingClientRect());
  check(Math.abs(boxes[0].top-boxes[1].top)<.1,'value alignment is independent of subtitle');
  for(const metric of metrics)check(Math.abs(metric.querySelector('.ui-metric-value').getBoundingClientRect().top-metric.querySelector('.ui-metric-title').getBoundingClientRect().bottom-2)<.1,'title-value gap stays 2px with and without icon/subtitle');
 }
 fixture.remove();
 const initialHeight=car.card.shadowRoot.querySelector('.header-region').getBoundingClientRect().height;
 car.card.setConfig({...car.config,show_field_1:false,show_field_2:false,show_field_3:false});
 check(car.card.shadowRoot.querySelector('.header-background').getBoundingClientRect().height<initialHeight,'fade shrinks when header fields disappear');
 car.card.setConfig(car.config);
 const weather=records.find(r=>r.sample.name==='Eigen neerslagmeter').card;
 weather.addEventListener('hass-more-info',event=>id=event.detail.entityId);weather.shadowRoot.querySelector('.weather-status').click();check(id==='sensor.rain','weather custom broad field opens correct source');
 const evcc=records.find(r=>r.sample.name==='Laden · slim').card;
 evcc.shadowRoot.querySelector('[data-mode="now"]').click();await wait(()=>evcc._hass.states[evcc._entities.mode].state==='now'&&!evcc._pendingMode);
 check(!evcc.shadowRoot.querySelector('[data-solar-share]'),'solar preference follows selected mode');
 const custom=records.find(r=>r.sample.name==='Eigen tabbladen').card;
 custom.shadowRoot.querySelector('[data-ui-tab="custom-tires"]').click();check(custom.shadowRoot.querySelector('[data-ui-tab="custom-tires"]').getAttribute('aria-selected')==='true','custom tabs work');
 const filter=document.querySelector('#filter');
 for(const kind of ['weather','car','evcc','energy','all']){filter.value=kind;filter.dispatchEvent(new Event('change'));check(records.filter(r=>!r.article.hidden).length===records.filter(r=>kind==='all'||r.sample.kind===kind).length,'gallery filter '+kind);}
 document.querySelector('#width').click();check(document.querySelector('#gallery').classList.contains('narrow'),'narrow gallery control works');
 document.querySelector('#motion').click();check(records.every(r=>r.card._config.animate_background===false),'gallery background motion control works');
 check(records.every(r=>JSON.parse(r.article.querySelector('pre').textContent).type===r.config.type),'every card exposes a valid configuration');
 for(const kind of ['weather','car','evcc','energy']){
  const record=records.find(r=>r.sample.kind===kind),card=record.card;
  for(const strength of [0,35,100]){
   card.setConfig({...record.config,background_strength:strength});
   check(Math.abs(Number(getComputedStyle(card.shadowRoot.querySelector('.header-background,.scene-background')).opacity)-strength/100)<.001,kind+': background strength '+strength);
  }
  card.setConfig(record.config);
 }
 const builtin=records.find(r=>r.sample.kind==='weather').card;
 let builtinId;builtin.addEventListener('hass-more-info',event=>builtinId=event.detail.entityId);
 for(const metric of builtin.shadowRoot.querySelectorAll('[data-weather-field]')){metric.click();check(metric.tagName==='BUTTON'&&builtinId===builtin._config.entity,'weather attribute opens its weather entity from the entire surface');}
 const compactEvcc=records.find(r=>r.sample.kind==='evcc'&&r.config.compact).card;
 const compactPower=compactEvcc.shadowRoot.querySelector('.charging-readings>[data-ui-metric]');
 let powerId;compactEvcc.addEventListener('hass-more-info',event=>powerId=event.detail.entityId);compactPower.click();
 check(compactPower.tagName==='BUTTON'&&powerId===compactEvcc._entities.power,'single-source EVCC metric opens from the entire surface');
 return reports;
}
