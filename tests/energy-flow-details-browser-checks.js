export async function runEnergyFlowDetailChecks(){
 const wait=async predicate=>{for(let i=0;i<150;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,20));}throw Error('Energy details did not become ready');};
 let count=0;const check=(condition,message)=>{if(!condition)throw Error(message);count++;};
 const card=document.createElement('eleven-energy-flow-card');card.style.cssText='position:fixed;top:8px;left:8px;width:360px;height:620px;z-index:200';card.setConfig({show_prices:false});document.body.append(card);
 const prefs={energy_sources:[{type:'solar',name:'Roof',stat_energy_from:'pv',stat_rate:'sensor.pv'},{type:'grid',name:'Grid connection',stat_energy_from:'in',stat_energy_to:'out',stat_rate:'sensor.grid',entity_energy_price:'sensor.price',number_energy_price_export:.07}],device_consumption:[{name:'Heat pump',stat_consumption:'hp',stat_rate:'sensor.hp'},{name:'Dryer',stat_consumption:'dryer'}]};
 const state=(value,unit)=>({state:String(value),attributes:{unit_of_measurement:unit,...(unit==='EUR/kWh'?{data:[0,1].map(i=>({start_time:new Date(Math.floor(Date.now()/3600000)*3600000+i*3600000).toISOString(),price_per_kwh:Number(value)}))}:{})}}),calls=[];
 let fail=false,delayResolve=null;
 let hass={language:'en',locale:{language:'en'},config:{time_zone:'UTC',currency:'EUR'},themes:{darkMode:true},states:{'sensor.pv':state(4,'kW'),'sensor.grid':state(-1,'kW'),'sensor.hp':state(1000,'W'),'sensor.price':state(.28,'EUR/kWh')},callWS:async message=>{
  calls.push(message);
  if(message.type==='energy/get_prefs')return prefs;
  if(message.type==='energy/info')return {cost_sensors:{in:'cost',out:'revenue'}};
  if(message.type==='recorder/get_statistics_metadata')return message.statistic_ids.map(statistic_id=>({statistic_id,unit_of_measurement:'EUR'}));
  if(message.type==='recorder/statistics_during_period'){
   if(message.statistic_ids.includes('hp')&&fail)throw Error('fixture error');
   if(message.statistic_ids.includes('hp')&&delayResolve)return new Promise(resolve=>{delayResolve=resolve;});
   const totals={pv:12,in:5,out:3,cost:1.8,revenue:.3,hp:4,dryer:1};
   return Object.fromEntries(message.statistic_ids.map(id=>[id,[{change:totals[id]}]]));
  }
  throw Error('Unexpected detail request '+message.type);
 }};
 try{
  card.hass=hass;await wait(()=>card._prefs&&!card._loading);
  const root=card.shadowRoot,popup=kind=>root.querySelector(`[data-energy-popup=${kind}]`),open=kind=>root.querySelector(`[data-energy-detail=${kind}]`).click();
  check(root.querySelectorAll('button[data-energy-detail]').length===3,'all diagram nodes are native actions');
  open('home');check(popup('home').matches(':popover-open'),'home opens shared popover');check(popup('home').textContent.includes('Heat pump'),'devices come from Energy preferences');check(!popup('home').textContent.includes('Dryer'),'devices without live power are hidden');
  open('grid');check(!popup('home').matches(':popover-open')&&popup('grid').matches(':popover-open'),'only one detail popup stays open');check(popup('grid').textContent.includes('€ 0.28/kWh'),'live import rate from Energy sensor');check(popup('grid').textContent.includes('€ 0.07/kWh'),'fixed export rate from Energy');
  const close=popup('grid').querySelector('[data-ui-popup-close]');close.focus();
  hass={...hass,states:{...hass.states,'sensor.price':state(-.05,'EUR/kWh')}};card.hass=hass;
  await wait(()=>popup('grid').matches(':popover-open'));
  check(popup('grid').matches(':popover-open')&&popup('grid').textContent.includes('€ -0.05/kWh'),'open live rates follow telemetry');check(root.activeElement?.hasAttribute('data-ui-popup-close'),'telemetry preserves popup focus');
  popup('grid').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));check(!popup('grid').matches(':popover-open'),'Escape closes details');check(root.activeElement?.dataset.energyDetail==='grid','Escape restores grid focus');
  open('sun');check(popup('sun').textContent.includes('75 %'),'solar self-consumption is calculated from measured balance');check(!popup('sun').textContent.includes('Roof'),'single solar source has no redundant footer');check(calls.every(c=>c.type==='energy/get_prefs'||c.type==='recorder/statistics_during_period'),'live details only request source history for base estimate');
  root.querySelector('[data-view-button=history]').click();await wait(()=>card._statistics&&!card._loading&&popup('sun').matches(':popover-open'));check(card._detailNode==='sun'&&popup('sun').matches(':popover-open'),'card view switch keeps details open');
  open('grid');await wait(()=>card._detailResult&&!card._detailLoading);
  check(popup('grid').textContent.includes('€ 1.8'),'historical costs from discovered cost sensor');check(popup('grid').textContent.includes('€ 0.3'),'recorded export compensation');check(!popup('grid').querySelector('.energy-grid-balance'),'historical grid omits ratio comparison');check(!popup('grid').textContent.includes('-0.05'),'history never substitutes current price');
  open('home');check([...popup('home').querySelectorAll('.energy-device-surfaces dd')].map(value=>value.textContent).includes('4 kWh')&&[...popup('home').querySelectorAll('.energy-device-surfaces dd')].map(value=>value.textContent).includes('1 kWh'),'historical device statistics');
  const statCount=calls.filter(c=>c.type==='recorder/statistics_during_period'&&c.statistic_ids.includes('hp')).length;open('sun');check(calls.filter(c=>c.type==='recorder/statistics_during_period'&&c.statistic_ids.includes('hp')).length===statCount,'detail requests shared across popups');
  for(const light of [true,false])for(const width of [260,400]){
   card.style.width=width+'px';card.hass={...hass,themes:{darkMode:!light}};await wait(()=>popup('sun').matches(':popover-open'));
   for(const kind of ['home','grid','sun']){
    open(kind);const panel=popup(kind),bounds=panel.getBoundingClientRect();
    check(bounds.left>=0&&bounds.right<=innerWidth+1,'popup fits viewport');check(panel.scrollWidth<=panel.clientWidth,'no horizontal popup overflow');
    const title=panel.querySelector('.ui-popup-heading>strong');
    check(title.textContent.endsWith(' · History'),'mode is part of popup title');check(!panel.querySelector('.energy-detail-mode'),'no mode badge');
    check(!panel.querySelector('.energy-detail-context'),'no separate unit or mode row');
    if(kind==='grid'||kind==='sun'){
     check(panel.querySelectorAll('dt').length===(kind==='grid'?5:8),'grid includes net costs; solar has four labels');
     for(const value of panel.querySelectorAll('.energy-grid-metrics dd'))check(getComputedStyle(value).fontSize==='18px','metrics match Car detail value typography');
    }
    if(kind==='home'){
     const devices=[...panel.querySelectorAll('.energy-device-surfaces>[data-ui-detail-surface]')];
     check(devices.length===3,'home includes configured devices and untracked balance');
     for(const device of devices)check(['15px','18px'].includes(getComputedStyle(device.querySelector('dd')).fontSize),'home matches Grid detail typography');
     for(let i=1;i<devices.length;i++)check(devices[i].getBoundingClientRect().top>=devices[i-1].getBoundingClientRect().bottom-1,'devices use separate full-width rows');
     for(const device of devices)check(device.querySelector('dt').getBoundingClientRect().bottom<=device.querySelector('dd').getBoundingClientRect().top+1,'device label appears above reading');
    }
    for(const bar of panel.querySelectorAll('.energy-detail-track,.energy-detail-supply,.ui-detail-surface-track'))check(bar.getBoundingClientRect().height===8,'all single and stacked bars have the same height');
   }
  }
  open('grid');root.querySelector('[data-view-button=live]').click();await wait(()=>card._view==='live'&&card._detailNode==='grid'&&popup('grid').matches(':popover-open'));
  check(card._view==='live'&&card._detailNode==='grid'&&popup('grid').matches(':popover-open'),'card switches live without closing details');
  root.querySelector('[data-view-button=history]').click();await wait(()=>card._detailResult&&!card._detailLoading&&card._statistics&&popup('grid').matches(':popover-open'));
  root.querySelector('[data-period=menu]').click();check(popup('grid').matches(':popover-open'),'period menu leaves details open');
  root.querySelector('[data-period-option=today]').click();await wait(()=>card._detailResult&&!card._detailLoading&&card._statistics&&popup('grid').matches(':popover-open'));
  root.querySelector('[data-period=previous]').click();await wait(()=>card._detailResult&&!card._detailLoading&&card._statistics&&popup('grid').matches(':popover-open'));
  check(card._detailNode==='grid'&&popup('grid').matches(':popover-open'),'card period navigation keeps popup open');
  check(!popup('grid').querySelector('[data-detail-view-button],input'),'no duplicate controls in detail popup');
  check(popup('grid').querySelector('.energy-grid-net dd').textContent==='€ 1.5','popup shows net recorded costs');
  card._detailBindings.grid.close();fail=true;card._detailResult=null;open('home');await wait(()=>card._detailError&&!card._detailLoading);check(!!popup('home').querySelector('[data-detail-retry]'),'failed details offer retry');
  fail=false;popup('home').querySelector('[data-detail-retry]').click();await wait(()=>card._detailResult&&!card._detailLoading);check(!card._detailError,'detail retry recovers');
  card._detailResult=null;delayResolve=true;card._detailBindings.home.close();open('home');await wait(()=>typeof delayResolve==='function');const resolve=delayResolve;root.querySelector('[data-view-button=live]').click();resolve({hp:[{change:999}]});await new Promise(resolve=>setTimeout(resolve,30));check(!card._detailResult&&card._detailNode==='home','obsolete response ignored while open details switch mode');
  card.hass={...hass,connected:false};open('home');check(popup('home').textContent.includes('Disconnected'),'offline popup does not show stale device readings');
  return count;
 }finally{card.remove();}
}
