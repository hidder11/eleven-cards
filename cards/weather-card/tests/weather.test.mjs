import {test} from 'node:test';
import assert from 'node:assert/strict';
import {weatherArt} from '../src/weather-art.js';
import {normalizeWeatherConfig,weatherNumber,weatherForecastType,weatherForecastRows,weatherCondition,weatherDate,weatherMetric,weatherField,weatherVisibleTabs,weatherForecastFields} from '../src/weather-utils.js';

test('explicit forecast tabs apply in both densities while legacy settings retain their behavior',()=>{
 for(const compact of [false,true]){
  const config=normalizeWeatherConfig({compact,tabs:['daily','invalid','daily'],forecast_type:'hourly'});
  assert.deepEqual(weatherVisibleTabs(config),['daily']);assert.equal(weatherForecastType(config,{}),'daily');
  assert.deepEqual(weatherVisibleTabs(normalizeWeatherConfig({compact,tabs:[]})),[]);
 }
 assert.deepEqual(weatherVisibleTabs(normalizeWeatherConfig({})),['hourly','daily']);
 assert.deepEqual(weatherVisibleTabs(normalizeWeatherConfig({compact:true,compact_forecast:'daily'})),['daily']);
 assert.deepEqual(weatherVisibleTabs(normalizeWeatherConfig({compact:true,compact_forecast:'none'})),[]);
});
test('forecast fields preserve defaults, selection order and explicitly hidden fields',()=>{
 assert.deepEqual(normalizeWeatherConfig({}).forecast_fields,['condition','temperature','templow','precipitation_probability']);
 assert.deepEqual(normalizeWeatherConfig({forecast_fields:[]}).forecast_fields,[]);
 assert.deepEqual(normalizeWeatherConfig({forecast_fields:['wind_speed','precipitation','wind_speed']}).forecast_fields,['wind_speed','precipitation']);
 for(const forecast_fields of ['temperature',['invalid'],{}])assert.throws(()=>normalizeWeatherConfig({forecast_fields}),/Invalid forecast fields/);
});

test('hourly and daily field overrides and precision remain independent and legacy motion is preserved',()=>{
 const config=normalizeWeatherConfig({forecast_fields:['temperature','humidity'],forecast_daily_fields:['humidity','temperature'],forecast_daily_temperature_decimals:2,forecast_hourly_temperature_decimals:0});
 assert.deepEqual(weatherForecastFields(config,'hourly'),['temperature','humidity']);
 assert.deepEqual(weatherForecastFields(config,'daily'),['humidity','temperature']);
 assert.equal(config.forecast_daily_temperature_decimals,2);assert.equal(config.forecast_hourly_temperature_decimals,0);
 assert.deepEqual(weatherForecastFields(normalizeWeatherConfig({...config,forecast_hourly_fields:[]}),'hourly'),[]);
 assert.throws(()=>normalizeWeatherConfig({forecast_daily_fields:['bad']}),/Invalid daily/);
 assert.equal(normalizeWeatherConfig({animate_icons:false}).animate_background,false);
 assert.equal(normalizeWeatherConfig({animate_icons:false,animate_background:true}).animate_background,true);
 assert.equal(normalizeWeatherConfig({animate_icons:true,animate_background:false}).animate_background,false);
});

test('custom weather fields use their own source, preserve zero and distinguish missing attributes',()=>{
 const config=normalizeWeatherConfig({metric_primary:'custom',metric_primary_entity:'sensor.garden',metric_primary_label:'Tuin'});
 const hass={language:'nl',states:{'sensor.garden':{state:'0',attributes:{unit_of_measurement:'°C',friendly_name:'Tuintemperatuur',maximum:21.3}}}};
 assert.deepEqual(weatherField(config,'metric_primary',{},hass,false),{entity:'sensor.garden',label:'Tuin',value:'0°C'});
 assert.equal(weatherField({...config,metric_primary_attribute:'maximum'},'metric_primary',{},hass).value,'21,3');
 assert.equal(weatherField({...config,metric_primary_attribute:'missing'},'metric_primary',{},hass).value,'—');
 assert.equal(weatherField({...config,metric_primary_show_unit:false},'metric_primary',{},hass).value,'0');
 assert.equal(weatherField(config,'metric_primary',{}, {...hass,states:{}}).value,'—');
 assert.equal(weatherField({...config,metric_primary:'none'},'metric_primary',{},hass),null);
 assert.equal(weatherField(normalizeWeatherConfig({metric_primary:'humidity',metric_primary_label:'Buiten',metric_primary_unit:'pct'}),'metric_primary',{humidity:50},hass).value,'50 pct');
});
test('all three weather fields can be hidden or use a custom source',()=>{
 const hass={language:'nl',states:{'weather.home':{state:'rainy'},'sensor.garden':{state:'0',attributes:{unit_of_measurement:'°C'}}}};
 for(const field of ['metric_status','metric_primary','metric_secondary']){
  const hidden=normalizeWeatherConfig({[field]:'none'});assert.equal(weatherField(hidden,field,{},hass),null);
  const config=normalizeWeatherConfig({[field]:'custom',[field+'_entity']:'sensor.garden',[field+'_label']:'Tuin'});
  assert.deepEqual(weatherField(config,field,{},hass),{entity:'sensor.garden',label:'Tuin',value:'0°C'});
 }
 const config=normalizeWeatherConfig({entity:'weather.home'});
 assert.equal(config.metric_status,'condition');assert.equal(weatherField(config,'metric_status',{},hass).value,'Regen');
 assert.equal(weatherField(config,'metric_status',{},hass,false).value,'Weer niet beschikbaar');
});

test('weather configuration keeps a weather entity and validates forecast options',()=>{
 assert.equal(normalizeWeatherConfig({entity:'weather.home'}).forecast_count,6);
 for(const config of [{entity:'sensor.outdoor'},{forecast_count:0},{forecast_count:3.5},{forecast_type:'legacy'}])assert.throws(()=>normalizeWeatherConfig(config));
 assert.equal(normalizeWeatherConfig({show_forecast:false}).show_forecast,false);
 assert.equal(normalizeWeatherConfig({}).metric_primary,'wind_speed');
 assert.equal(normalizeWeatherConfig({}).background,'lanes');
 assert.equal(normalizeWeatherConfig({}).icon_style,'classic');
 for(const icon_style of ['glass','neon'])assert.equal(normalizeWeatherConfig({icon_style}).icon_style,icon_style);
 assert.throws(()=>normalizeWeatherConfig({icon_style:'globe'}));
 for(const background of ['aurora','clouds','isobars'])assert.equal(normalizeWeatherConfig({background}).background,background);
 assert.equal(normalizeWeatherConfig({animate_icons:false}).animate_icons,false);
 assert.throws(()=>normalizeWeatherConfig({background:'made_up'}));
 assert.equal(normalizeWeatherConfig({compact:true,metric_primary:'none'}).compact,true);
 assert.throws(()=>normalizeWeatherConfig({metric_primary:'made_up'}));
 assert.throws(()=>normalizeWeatherConfig({compact_forecast:'auto'}));
 assert.equal(normalizeWeatherConfig({compact:true,show_forecast:false}).compact_forecast,'none');
 assert.equal(weatherForecastType(normalizeWeatherConfig({compact:true,compact_forecast:'daily',forecast_type:'hourly'}),{}),'daily');
});
test('new icon families distinguish all official conditions and provide a neutral fallback',()=>{
 const kinds={sunny:'sun','clear-night':'night',partlycloudy:'partly',cloudy:'cloud',rainy:'rain',pouring:'pouring',lightning:'lightning','lightning-rainy':'storm',snowy:'snow','snowy-rainy':'sleet',hail:'hail',fog:'fog',windy:'wind','windy-variant':'wind-cloud',exceptional:'exceptional'};
 for(const style of ['glass','neon'])for(const [condition,kind] of Object.entries(kinds)){
  const view=weatherCondition(condition,true);assert.equal(view.iconKind,kind);
  const svg=weatherArt(view.kind,style,view.iconKind);assert.ok(svg.includes('data-icon-kind="'+kind+'"'));assert.ok(svg.includes('wxi-'+style));
 }
 for(const condition of ['unknown','unavailable','nonstandard']){
  const view=weatherCondition(condition,true);assert.equal(view.iconKind,'unknown');assert.ok(weatherArt(view.kind,'glass',view.iconKind).includes('class="wxi-unknown"'));
 }
 assert.ok(!weatherArt('lightning','glass','lightning').includes('class="wxi-rain'));
 assert.ok(weatherArt('storm','glass','storm').includes('class="wxi-rain'));
});
test('selectable metrics use source units and keep unavailable and zero distinct',()=>{
 const hass={language:'nl'};
 assert.deepEqual(weatherMetric('pressure',{pressure:1017,pressure_unit:'hPa'},hass),{label:'Luchtdruk',value:'1.017 hPa'});
 assert.equal(weatherMetric('uv_index',{uv_index:0},hass).value,'0');
 assert.equal(weatherMetric('humidity',{humidity:0},hass,false).value,'—');
 assert.equal(weatherMetric('wind_gust_speed',{},hass).value,'—');
 assert.equal(weatherMetric('wind_bearing',{wind_bearing:'NW'},hass).value,'NW');
 assert.equal(weatherMetric('none',{},hass),null);
});
test('weather values preserve zero, follow locale and distinguish missing data',()=>{
 const hass={language:'nl'};
 assert.equal(weatherNumber(0,hass,'%'),'0 %');
 assert.equal(weatherNumber(-2.5,hass,'°C',1),'-2,5°C');
 for(const value of [null,undefined,'','unknown',Infinity,true])assert.equal(weatherNumber(value,hass),'—');
});
test('automatic forecast type uses supported features and explicit choice wins',()=>{
 const config=normalizeWeatherConfig({});
 assert.equal(weatherForecastType(config,{attributes:{supported_features:3}}),'hourly');
 assert.equal(weatherForecastType(config,{attributes:{supported_features:1}}),'daily');
 assert.equal(weatherForecastType({...config,forecast_type:'daily'},{attributes:{supported_features:3}}),'daily');
});
test('forecast rows reject invalid and old records, sort and limit without inventing data',()=>{
 const now=Date.parse('2026-10-22T12:00:00Z');
 const rows=[{datetime:'2026-10-22T15:00:00Z',temperature:0},{datetime:'bad'},{datetime:'2026-10-21T15:00:00Z'},{datetime:'2026-10-22T13:00:00Z'}];
 assert.deepEqual(weatherForecastRows(rows,1,now),[rows[3]]);
 assert.deepEqual(weatherForecastRows(null,6,now),[]);
});
test('conditions and forecast times use source state and HA timezone',()=>{
 assert.equal(weatherCondition('rainy',true).label,'Regen');
 assert.equal(weatherCondition('unavailable',true).kind,'unknown');
 assert.equal(weatherDate('2026-10-22T12:00:00Z',{language:'nl',config:{time_zone:'Europe/Amsterdam'}},'hourly'),'14:00');
});

test('daily filtering keeps the current calendar day in the HA timezone including DST changes',()=>{
 const hass={config:{time_zone:'Europe/Amsterdam'}},today={datetime:'2026-10-24T22:00:00Z'},tomorrow={datetime:'2026-10-25T23:00:00Z'},yesterday={datetime:'2026-10-23T22:00:00Z'};
 assert.deepEqual(weatherForecastRows([yesterday,today,tomorrow],6,Date.parse('2026-10-25T15:00:00Z'),'daily',hass),[today,tomorrow]);
 assert.deepEqual(weatherForecastRows([today,tomorrow],6,Date.parse('2026-10-25T23:00:00Z'),'daily',hass),[tomorrow]);
 const la={config:{time_zone:'America/Los_Angeles'}},localToday={datetime:'2026-10-23T07:00:00Z'};
 assert.deepEqual(weatherForecastRows([localToday],6,Date.parse('2026-10-24T02:00:00Z'),'daily',la),[localToday]);
 assert.deepEqual(weatherForecastRows([today,tomorrow],6,Date.parse('2026-10-25T15:00:00Z'),'hourly',hass),[tomorrow]);
});

test('forecast subscriptions reject stale results and clean up delayed subscriptions',async()=>{
 globalThis.HTMLElement=class {attachShadow(){this.shadowRoot={};}};
 const {WeatherCard}=await import('../src/weather-card.js');
 const card=new WeatherCard();card._render=()=>{};
 const subscriptions=[];let unsubscriptions=0;
 const connection={subscribeMessage(callback,request){let resolve;const promise=new Promise(done=>{resolve=done;});subscriptions.push({callback,request,resolve});return promise;}};
 card.setConfig({entity:'weather.first'});
 card.hass={states:{'weather.first':{attributes:{supported_features:3}},'weather.second':{attributes:{supported_features:1}}},connection};
 card.connectedCallback();
 assert.equal(subscriptions.length,1);
 assert.equal(subscriptions[0].request.forecast_type,'hourly');
 card.setConfig({entity:'weather.second'});
 assert.equal(subscriptions[1].request.forecast_type,'daily');
 subscriptions[0].callback({forecast:[{temperature:100}]});
 assert.deepEqual(card._forecast,[]);
 subscriptions[0].resolve(()=>{unsubscriptions++;});await Promise.resolve();
 assert.equal(unsubscriptions,1);
 subscriptions[1].callback({forecast:[]});
 assert.equal(card._forecastStatus,'ready');
 subscriptions[1].resolve(()=>{unsubscriptions++;});await Promise.resolve();
 const forecast=card._forecast,clock=card._forecastClock;
 card._forecastSelection='daily';
 card.setConfig({...card._config,title:'New title',background:'clouds'});
 assert.equal(subscriptions.length,2);assert.equal(card._forecast,forecast);assert.equal(card._forecastSelection,'daily');assert.equal(card._forecastClock,clock);
 card.disconnectedCallback();assert.equal(unsubscriptions,2);
 assert.equal(card._forecastClock,null);
 subscriptions[1].callback({forecast:[{temperature:10}]});assert.deepEqual(card._forecast,[]);
});

test('forecast clock expires rows without telemetry and is cleaned up on disconnect',async()=>{
 globalThis.HTMLElement=class {attachShadow(){this.shadowRoot={};}};
 const {WeatherCard}=await import('../src/weather-card.js');
 const originalSet=globalThis.setInterval,originalClear=globalThis.clearInterval,originalNow=Date.now;
 let tick,cleared=false,current=Date.parse('2026-10-23T12:30:00Z'),visible=[];
 try{
  globalThis.setInterval=(callback,delay)=>{assert.equal(delay,60000);tick=callback;return 123;};
  globalThis.clearInterval=id=>{if(id===123)cleared=true;};Date.now=()=>current;
  const card=new WeatherCard();card._forecast=[{datetime:'2026-10-23T12:00:00Z'},{datetime:'2026-10-23T13:00:00Z'}];
  card._render=()=>{visible=weatherForecastRows(card._forecast,6,Date.now());};card.setConfig({entity:'weather.home',tabs:['hourly']});card.connectedCallback();
  assert.equal(visible.length,2);current+=3600000;tick();assert.equal(visible.length,1);
  card.disconnectedCallback();assert.equal(cleared,true);assert.equal(card._forecastClock,null);
 }finally{globalThis.setInterval=originalSet;globalThis.clearInterval=originalClear;Date.now=originalNow;}
});

test('header icon transforms preserve defaults and normalize slider values safely',()=>{
 const defaults=normalizeWeatherConfig({});
 assert.equal(defaults.icon_scale,100);assert.equal(defaults.icon_offset_x,0);assert.equal(defaults.icon_offset_y,0);
 for(const [input,expected] of [[{icon_scale:300,icon_offset_x:-150,icon_offset_y:150},[300,-150,150]],[{icon_scale:999,icon_offset_x:-999,icon_offset_y:999},[300,-150,150]],[{icon_scale:0,icon_offset_x:'25',icon_offset_y:'-30'},[50,25,-30]],[{icon_scale:'invalid',icon_offset_x:'',icon_offset_y:null},[100,0,0]]]){
  const config=normalizeWeatherConfig(input);assert.deepEqual([config.icon_scale,config.icon_offset_x,config.icon_offset_y],expected);
 }
});
