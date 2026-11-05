const H=3600000,now=Date.now(),start=new Date().setHours(0,0,0,0),iso=t=>new Date(t).toISOString();
const sensor=(state,unit='',extra={})=>({state:String(state),attributes:{friendly_name:extra.friendly_name||({'W':'Vermogen','°C':'Temperatuur','%':'Accu','km':'Actieradius'}[unit]||'Voorbeeld'),unit_of_measurement:unit,...extra}});
const prices=Array.from({length:192},(_,i)=>({start_time:iso(start+i*H/4),price_per_kwh:.14+Math.sin(i/8)*.12}));
const states={'scene_engine.living':sensor('scene.evening','',{engine:'Woonkamer',effective_request:{scene:'scene.evening',identifier:'Tijdschema',priority:80},requests:[{scene:'scene.evening',identifier:'Tijdschema',priority:80,requires:null},{scene:'scene.relax',identifier:'Aanwezigheid',priority:40,requires:null},{scene:'scene.movie',identifier:'Filmstand',priority:90,requires:'Mediaspeler'}],active_request_count:2,non_active_request_count:1,active_requests:[{scene:'scene.evening',identifier:'Tijdschema',priority:80},{scene:'scene.relax',identifier:'Aanwezigheid',priority:40}],non_active_requests:[{scene:'scene.movie',identifier:'Filmstand',priority:90,requires:'Mediaspeler'}],default_scene:'scene.relax',revision:12,snapshot_source:'preview'}),'button.engine_reset':sensor('unknown'),'scene.evening':sensor('scening','',{friendly_name:'Avond'}),'light.living':sensor('on','',{friendly_name:'Woonkamer',brightness:160,supported_color_modes:['brightness']}),'climate.living':sensor('heat','',{friendly_name:'Thermostaat',temperature:20,current_temperature:20.8,min_temp:10,max_temp:30,target_temp_step:.5,supported_features:1,hvac_modes:['off','heat']}),'sensor.waste':sensor(iso(now+2*24*H).slice(0,10),'',{friendly_name:'Papier'}),'select.ev_mode':sensor('pv','',{options:['off','now','pv'],friendly_name:'Laadmodus'}),'sensor.power':sensor(418,'W'), 'sensor.solar':sensor(2800,'W'), 'sensor.temperature':sensor(20.8,'°C'), 'sensor.price':sensor(.24,'EUR/kWh',{data:prices}),'sensor.soc':sensor(62,'%'), 'sensor.range':sensor(284,'km'), 'sensor.odometer':sensor(24000,'km'),'switch.heating':sensor('on'), 'calendar.family':sensor('off'), 'todo.shopping':sensor(2,'',{supported_features:15,friendly_name:'Boodschappen'}),'weather.home':sensor('partlycloudy','',{temperature:16,temperature_unit:'°C',apparent_temperature:14,wind_speed:14,wind_speed_unit:'km/h',humidity:68,pressure:1017,pressure_unit:'hPa',visibility:12,visibility_unit:'km',uv_index:4,cloud_coverage:35,supported_features:3})};
const forecasts=Array.from({length:8},(_,i)=>({datetime:iso(now+(i+1)*H),condition:['partlycloudy','sunny','rainy'][i%3],temperature:15+i,templow:8,precipitation:i*.2}));
Object.assign(states,{'sensor.waste_residual':sensor(iso(now+4*24*H).slice(0,10),'',{friendly_name:'Restafval'}),'sensor.waste_green':sensor(iso(now+5*24*H).slice(0,10),'',{friendly_name:'GFT'})});
const prefs={energy_sources:[{type:'solar',stat_energy_from:'sensor.solar_energy',stat_rate:'sensor.solar'},{type:'grid',stat_energy_from:'sensor.grid_import',stat_energy_to:'sensor.grid_export',stat_rate:'sensor.power'}]};
window.demoServices??=[];
export const hass={language:'nl',locale:{language:'nl'},themes:{darkMode:false},connected:true,services:{button:{press:{}}},config:{time_zone:'Europe/Amsterdam',currency:'EUR'},states,
 connection:{subscribeMessage:async(cb,req)=>{let active=true;queueMicrotask(()=>{if(!active)return;if(req.type==='todo/item/subscribe')cb({items:[{uid:'milk',summary:'Melk',status:'needs_action'},{uid:'apples',summary:'Appels',status:'needs_action'},{uid:'bread',summary:'Brood',status:'completed'}]});else if(req.type==='calendar/event/subscribe')cb({events:[{summary:'Projectoverleg',start:iso(start+10*H),end:iso(start+11*H)},{summary:'Boodschappen halen',start:iso(start+15*H),end:iso(start+16*H)}]});else cb({forecast:forecasts});});return()=>{active=false};}},
 callApi:async(_,url)=>{const u=new URL(url,location.origin),ids=(u.searchParams.get('filter_entity_id')||'sensor.power').split(','),a=Date.parse(u.pathname.split('/').pop())||now-24*H,b=Date.parse(u.searchParams.get('end_time'))||now;if(ids.includes('binary_sensor.review_evcc_connected'))return [[{entity_id:'binary_sensor.review_evcc_connected',state:'on',last_changed:iso(now-2*H)}]];return ids.map((id,j)=>Array.from({length:Math.max(2,Math.min(300,Math.ceil((b-a)/(H/2))))},(_,i)=>({entity_id:id,state:id==='switch.heating'?(i%4?'on':'off'):String(id==='sensor.review_evcc_power'?5000+Math.sin(i/3)*2100:id==='sensor.temperature'?20.4+Math.sin(i/3)*.8:220+Math.sin(i/3+j)*100),attributes:states[id]?.attributes||{unit_of_measurement:'W'},last_changed:iso(a+i*(b-a)/Math.max(2,Math.min(300,Math.ceil((b-a)/(H/2)))))})))},
 callWS:async req=>{if(req.type==='config/entity_registry/list')return [];if(req.type==='energy/get_prefs')return prefs;if(req.type.endsWith('metadata'))return [{statistic_id:'sensor.power',mean_type:1,has_mean:true,has_sum:false,unit_of_measurement:'W'}];if(req.type==='recorder/statistics_during_period'){const a=Date.parse(req.start_time),b=Date.parse(req.end_time),step=req.period==='5minute'?H/12:req.period==='hour'?H:24*H;return Object.fromEntries((req.statistic_ids||['sensor.power']).map(id=>[id,Array.from({length:Math.ceil((b-a)/step)},(_,i)=>({start:a+i*step,mean:id==='sensor.temperature'?20.4+Math.sin(i)*.8:220+Math.sin(i)*80,change:1+i%3}))]));}throw Error('Unexpected synthetic WS '+req.type)},callService:async(...args)=>{demoServices.push(args);return {}}};
Object.assign(states,{'sensor.car_status':{state:'Geparkeerd',attributes:{friendly_name:'Status'}},'image.demo_car':{state:'available',attributes:{entity_picture:new URL('assets/demo-car.svg',import.meta.url).href}}});
Object.assign(states,{"scene.evening": {"state": "scening", "attributes": {"friendly_name": "Avond"}}, "scene.morning": {"state": "scening", "attributes": {"friendly_name": "Goedemorgen"}}, "scene.movie": {"state": "scening", "attributes": {"friendly_name": "Film kijken"}}, "scene.dinner": {"state": "scening", "attributes": {"friendly_name": "Aan tafel"}}, "scene.relax": {"state": "scening", "attributes": {"friendly_name": "Ontspannen"}}, "scene.read": {"state": "scening", "attributes": {"friendly_name": "Lezen"}}, "scene.sleep": {"state": "scening", "attributes": {"friendly_name": "Welterusten"}}, "script.lights_off": {"state": "off", "attributes": {"friendly_name": "Alle verlichting uit"}}});
Object.assign(states,{'sensor.review_evcc_power':sensor(7100,'W'),'binary_sensor.review_evcc_connected':sensor('on'),'binary_sensor.review_evcc_charging':sensor('on'),'sensor.review_evcc_remaining':sensor(5400,'s'),'sensor.review_evcc_target':sensor(80,'%'),'sensor.review_evcc_energy':sensor(12.4,'kWh'),'sensor.review_evcc_cost':sensor(3.18,'€'),'sensor.review_evcc_duration':sensor(6300,'s'),'sensor.review_evcc_solar':sensor(78,'%'),'number.review_evcc_solar':sensor(60,'%',{min:0,max:100,step:10})});
for(const [entity,icon] of [['scene.evening','mdi:weather-night'],['scene.movie','mdi:movie-open-outline'],['scene.read','mdi:book-open-page-variant-outline']])states[entity].attributes.icon=icon;
states['sensor.humidity']=sensor(46,'%',{friendly_name:'Luchtvochtigheid',device_class:'humidity'});
export const configs=[
 ['history-graph-card','Historie',{entities:['sensor.power','sensor.temperature'],series_options:[{entity:'sensor.power',color:'#e78a14'},{entity:'sensor.temperature',color:'#2196f3'}],hours_to_show:24,sync_hover:false},true],
 ['bar-chart','Staafgrafiek',{entities:['sensor.power'],series_options:[{entity:'sensor.power',color:'#e78a14'}],hours_to_show:24,sync_hover:false},true],
 ['timeline-card','Tijdlijn',{entities:['switch.heating'],hours_to_show:24,sync_hover:false},true],
 ['dynamic-energy-price-card','Energieprijzen',{entity:'sensor.price'},true],
 ['overview-card','Sensoroverzicht',{entities:[{entity:'sensor.power',color:'#e78a14'},{entity:'sensor.temperature',color:'#2196f3'}]},false],
 ['heatmap-card','Heatmap',{entity:'sensor.power',hours_to_show:168},true],
 ['calendar-card','Agenda',{entities:[{entity:'calendar.family',color:[231,175,103]}],view:'list',days_to_show:2},false],
 ['weather-card','Weer',{entity:'weather.home',background:'halo',background_strength:0,animate_icons:false,animate_background:false},false],
 ['car-card','Auto',{image_entity:'image.demo_car',field_1_label:'Status',show_field_3:false,percentage_entity:'sensor.soc',range_source:'entity',range_entity:'sensor.range',field_1_entity:'sensor.car_status',field_2_entity:'sensor.odometer',field_2_label:'Kilometerstand',background:'halo',background_strength:0,animate_background:false},false],
 ['energy-flow-card','Energiestromen',{default_view:'live',background:'halo',background_strength:0,animate_background:false},false],
 ['scene-engine-card','Scene Engine',{entity:'scene_engine.living',reset_entity:'button.engine_reset'},false],
 ['actions-card','Control Pad',{actions:[{"entity": "scene.evening", "icon": "mdi:weather-night"}, {"entity": "scene.morning", "icon": "mdi:weather-sunset-up"}, {"entity": "scene.movie", "icon": "mdi:movie-open-outline"}, {"entity": "scene.dinner", "icon": "mdi:silverware-fork-knife"}, {"entity": "scene.relax", "icon": "mdi:sofa-outline"}, {"entity": "scene.read", "icon": "mdi:book-open-page-variant-outline"}, {"entity": "scene.sleep", "icon": "mdi:bed-outline"}, {"entity": "script.lights_off", "icon": "mdi:lightbulb-off-outline"}]},false],
 ['controls-card','Bediening',{entities:['climate.living','light.living']},false],
 ['waste-card','Afvalinzameling',{entities:[{entity:'sensor.waste',name:'Papier',source:'date',color:'#2196f3'},{entity:'sensor.waste_residual',name:'Restafval',source:'date',color:'#8a8f99'},{entity:'sensor.waste_green',name:'GFT',source:'date',color:'#4c956c'}]},false],
 ['room-card','Woonkamer',{name:'Woonkamer',scenes:['scene.evening','scene.movie','scene.read'],lights:['light.living'],temperature_entity:'sensor.temperature',humidity_entity:'sensor.humidity'},false],
 ['appliance-planner','Apparatenplanner',{tariff:{source:'sensor',entity:'sensor.price'},appliances:[{id:'washer',name:'Wasmachine',kind:'washer',programs:[{id:'eco',name:'Eco 40–60',minutes:150,kwh:1}]}]},false],
 ['car-evcc','Auto met EVCC',{image_entity:'image.demo_car',evcc_enabled:true,entity:'sensor.power',entities:{soc:'sensor.soc',power:'sensor.review_evcc_power',range:'sensor.range',mode:'select.ev_mode',connected:'binary_sensor.review_evcc_connected',charging:'binary_sensor.review_evcc_charging',remaining_duration:'sensor.review_evcc_remaining',target_soc:'sensor.review_evcc_target',charged_energy:'sensor.review_evcc_energy',session_price:'sensor.review_evcc_cost',charge_duration:'sensor.review_evcc_duration',solar_percentage:'sensor.review_evcc_solar',solar_share:'number.review_evcc_solar'},background:'halo',background_strength:0,animate_background:false},false],
 ['shopping-card','Boodschappen',{entity:'todo.shopping'},false],
];

// Optional decorative backgrounds stay off in overview and detail examples.
// The dedicated background previews explicitly opt in via setCardBackground().
configs.forEach(row=>{row[2].card_background=false;});

export const cardType=name=>'custom:eleven-'+(name==='car-evcc'?'car-card':name);
export function createFixture(name,extraStates={}){
 const local={...hass,states:{...structuredClone(hass.states),...structuredClone(extraStates)},themes:{darkMode:false}};
 if(['history-graph-card','bar-chart'].includes(name))local.callApi=(method,url)=>{const [path,...query]=url.split('?');return hass.callApi(method,decodeURIComponent(path)+(query.length?'?'+query.join('?'):''));};

 if(name==='shopping-card'){
  let callback,items=[{uid:'milk',summary:'Melk',status:'needs_action'},{uid:'apples',summary:'Appels',status:'needs_action'},{uid:'bread',summary:'Brood',status:'completed'}],sequence=0;
  const publish=()=>callback?.({items:structuredClone(items)});
  local.connection={subscribeMessage:async(cb,request)=>{if(request.type!=='todo/item/subscribe')throw Error('Unexpected shopping subscription');callback=cb;queueMicrotask(publish);return()=>{if(callback===cb)callback=null;};}};
  local.callService=async(domain,service,data,target)=>{
   if(domain!=='todo'||!local.states[target.entity_id])throw Error('Unexpected shopping target');window.demoServices.push([domain,service,data,target]);
   if(service==='add_item')items.push({uid:'preview-'+(++sequence),summary:data.item,status:'needs_action'});
   else if(service==='update_item'){const item=items.find(i=>i.uid===data.item);if(!item)throw Error('Item missing');if(data.status)item.status=data.status;if(data.rename!==undefined)item.summary=data.rename;if(data.description!==undefined)item.description=data.description;for(const key of ['due_date','due_datetime'])if(data[key]!==undefined)item.due=data[key];}
   else if(service==='remove_item')items=items.filter(i=>!data.item.includes(i.uid));else throw Error('Unexpected shopping service');publish();
  };
  local.callWS=async request=>{if(request.type!=='todo/item/move')throw Error('Unexpected shopping request');const index=items.findIndex(i=>i.uid===request.uid);if(index<0)throw Error('Item missing');const [item]=items.splice(index,1);const previous=request.previous_uid?items.findIndex(i=>i.uid===request.previous_uid):-1;items.splice(previous+1,0,item);publish();};
 }
 return local;
}

// Rich fictional appointments shared by the three calendar configurations.
export function calendarPreviewFixture(hass){
 const original=hass.connection.subscribeMessage;
 return {...hass,connection:{...hass.connection,subscribeMessage:async(callback,request)=>{
  if(request.type!=='calendar/event/subscribe')return original(callback,request);
  let active=true;const start=Date.parse(request.start),end=Date.parse(request.end),day=86400000;
  const names=['Projectoverleg','Voorbeeldafspraak','Boodschappen halen','Sporten','Voorbeeldactiviteit','Voorbeeldoverleg met een langere titel'];
  const events=[];for(let t=start+12*3600000,i=0;t<end;t+=3*day,i++)events.push({summary:names[i%names.length],start:new Date(t).toISOString(),end:new Date(t+3600000).toISOString()});
  const today=new Date().toISOString().slice(0,10);for(let i=0;i<4;i++){const t=Date.parse(today+'T09:00:00Z')+i*2*3600000;if(t>=start&&t<end)events.push({summary:names[i],start:new Date(t).toISOString(),end:new Date(t+3600000).toISOString()});}
  queueMicrotask(()=>{if(active)callback({events});});return()=>{active=false;};
 }}};
}
