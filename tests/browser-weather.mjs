// Optional rendered checks using Chrome DevTools, without screenshots,
// recordings, external services, or production Home Assistant data.
// Run with Node.js 22+; CHROME_PATH can select a Chrome executable.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdtemp, access} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve, extname, sep} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url)).replace(/[\\/]$/, '');
const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
await access(chrome);
const profile = await mkdtemp(resolve(root, '.cache/evcc-browser-'));
const mime = {'.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.css': 'text/css'};
const server = createServer(async (request, response) => {
 const path = resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
 if (!path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
 try { response.setHeader('content-type', mime[extname(path)] ?? 'text/plain'); response.end(await readFile(path)); }
 catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = spawn(chrome, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', 'about:blank'], {windowsHide: true, stdio: 'ignore'});
const watchdog = setTimeout(() => { browser.kill(); server.closeAllConnections(); console.error('Browser verification timed out'); process.exit(1); }, 45000);
let socket;
try {
 let debuggingPort;
 for (let attempt = 0; attempt < 100; attempt++) {
  try { debuggingPort = Number((await readFile(resolve(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); break; } catch { await delay(100); }
 }
 assert.ok(debuggingPort, 'Chrome debugging endpoint is available');
 const pages = await (await fetch(`http://127.0.0.1:${debuggingPort}/json`, {signal: AbortSignal.timeout(5000)})).json();
 socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
 await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, {once: true}); socket.addEventListener('error', reject, {once: true}); });
 let id = 0; const pending = new Map(), exceptions = [];
 socket.addEventListener('message', event => {
  const data = JSON.parse(event.data);
  if (data.method === 'Runtime.exceptionThrown') exceptions.push(data.params.exceptionDetails);
  if (data.id) { const handler = pending.get(data.id); pending.delete(data.id); if (data.error) handler.reject(Error(data.error.message)); else handler.resolve(data.result); }
 });
 const send = (method, params = {}) => new Promise((resolve, reject) => {
  const key = ++id, timer = setTimeout(() => { pending.delete(key); reject(Error('CDP timed out: ' + method)); }, 15000);
  pending.set(key, {resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); }});
  socket.send(JSON.stringify({id: key, method, params}));
 });
 const evaluate = async expression => {
  const result = await send('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true});
  assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails)); return result.result.value;
 };
 await send('Runtime.enable'); await send('Page.enable');
 await send('Page.navigate', {url: `http://127.0.0.1:${server.address().port}/cards/weather-card/qa/index.html`});
 for(let attempt=0;attempt<100;attempt++){if(await evaluate('!!window.weatherQA'))break;await delay(50);}
 const checks=await evaluate(`(async()=>{
 const qa=weatherQA,card=qa.cards[0],hass=qa.hass,config={...card._config},checks=[];
 const query=s=>card.shadowRoot.querySelector(s),check=(name,value)=>{if(!value)throw Error(name);checks.push(name);};
 check('four state illustrations and live forecasts render',qa.cards.length===4&&qa.cards.every(c=>c.shadowRoot.querySelectorAll('.forecast-list li').length===6));
 for(const compact of [false,true])for(const icon_style of ['classic','glass','neon'])for(const width of [260,480]){
  card.style.width=width+'px';card.setConfig({...config,compact,icon_style,animate_icons:false});
  const hero=query('.hero').getBoundingClientRect(),art=query('.art').getBoundingClientRect(),status=query('.weather-status').getBoundingClientRect();
  const small=query('.weather-status svg').getBoundingClientRect(),cardBox=query('ha-card').getBoundingClientRect();
  check('weather icon defaults to card center '+compact+icon_style+width,Math.abs((art.left+art.right-cardBox.left-cardBox.right)/2)<.1);
  for(const [scale,x,y] of [[100,-60,30],[100,50,-25],[300,0,0],[50,0,0]]){
   card.setConfig({...config,compact,icon_style,animate_icons:false,icon_scale:scale,icon_offset_x:x,icon_offset_y:y});
   const moved=query('.art').getBoundingClientRect();
   check('weather icon offset is relative to card center '+compact+icon_style+width+scale+x+y,Math.abs((moved.left+moved.right-cardBox.left-cardBox.right)/2-x)<.1);
   check('weather icon transform '+compact+icon_style+width+scale+x+y,Math.abs((moved.left+moved.right-art.left-art.right)/2-x)<.1&&Math.abs((moved.top+moved.bottom-art.top-art.bottom)/2-y)<.1&&Math.abs(moved.width/art.width-scale/100)<.001);
   check('weather icon keeps layout fixed '+compact+icon_style+width+scale+x+y,Math.abs(query('.hero').getBoundingClientRect().height-hero.height)<.1&&Math.abs(query('.weather-status').getBoundingClientRect().top-status.top)<.1&&Math.abs(query('.weather-status svg').getBoundingClientRect().width-small.width)<.1);
  }
 }
 card.style.width='';card.setConfig(config);
 check('state background colors differ',new Set(qa.cards.map(c=>getComputedStyle(c.shadowRoot.querySelector('.content')).getPropertyValue('--tone'))).size>=3);
 const backgroundPaints=[];
 for(const background of ['lanes','halo','ribbon','prism-glass','eclipse']){
  card.setConfig({...config,background});
  backgroundPaints.push(getComputedStyle(query('.scene-background'),'::before').backgroundImage+'|'+getComputedStyle(query('.scene-background'),'::after').backgroundImage);
  check('background '+background+' preserves weather layout',query('.content').dataset.background===background&&!!query('.art .weather-icon'));
  const backdrop=query('.scene-background'),style=getComputedStyle(backdrop);
  check('background '+background+' fades on a shared layer before clipping',style.maskImage.includes('gradient')&&style.maskImage.includes('88%')&&getComputedStyle(backdrop,'::before').maskImage==='none'&&getComputedStyle(backdrop,'::after').maskImage==='none'&&Math.abs(backdrop.getBoundingClientRect().bottom-query('.header-region').getBoundingClientRect().bottom)<.1);
 }
 check('all five backgrounds have distinct visible paint',new Set(backgroundPaints).size===5);
 for(const compact of [false,true])for(const icon_style of ['classic','glass','neon']){
  const heights=[];
  for(const background of ['lanes','halo','ribbon','prism-glass','eclipse','aurora','clouds','isobars']){
   card.setConfig({...config,compact,icon_style,background});heights.push(query('.hero').getBoundingClientRect().height);
   check('full card fade '+compact+icon_style+background,Math.abs(query('.scene-background').getBoundingClientRect().bottom-query('.header-region').getBoundingClientRect().bottom)<.1);
  }
  check('backgrounds preserve equal header height '+compact+icon_style,new Set(heights).size===1);
 }
 card.setConfig(config);

 for(const background of ['aurora','clouds','isobars']){
  for(const compact of [false,true]){
   card.setConfig({...config,background,compact});
   check('animated background layer '+background+compact,!!query('.header-atmosphere')&&query('.header-atmosphere').getAttribute('aria-hidden')==='true');
   check('selected atmosphere animates '+background+compact,card.shadowRoot.getAnimations().some(animation=>animation.animationName?.startsWith('weather-')));
   for(const width of [260,480]){card.style.width=width+'px';check('animated header fits '+background+compact+width,query('.content').scrollWidth<=query('.content').clientWidth);}
   card.style.width='';
   const backdrop=query('.scene-background');check('animated header fades as one layer '+background+compact,getComputedStyle(backdrop).maskImage.includes('88%')&&Math.abs(backdrop.getBoundingClientRect().bottom-query('.header-region').getBoundingClientRect().bottom)<.1);
  }
  card.setConfig({...config,background,animate_icons:false,animate_background:false});check('animation toggle stops entire header '+background,card.shadowRoot.getAnimations().length===0);
  card.setConfig({...config,background});card.hass={...hass,connected:false};check('offline stops entire header '+background,card.shadowRoot.getAnimations().length===0);
  card.hass={...hass,states:{...hass.states,[config.entity]:{...hass.states[config.entity],state:'unavailable'}}};check('unavailable weather stops entire header '+background,card.shadowRoot.getAnimations().length===0);card.hass=hass;
 }
 const conditionKinds={sunny:'sun','clear-night':'night',partlycloudy:'partly',cloudy:'cloud',rainy:'rain',pouring:'pouring',lightning:'lightning','lightning-rainy':'storm',snowy:'snow','snowy-rainy':'sleet',hail:'hail',fog:'fog',windy:'wind','windy-variant':'wind-cloud',exceptional:'exceptional'};
 for(const icon_style of ['glass','neon'])for(const compact of [false,true])for(const darkMode of [false,true]){
  card.setConfig({...config,icon_style,compact,tabs:['hourly'],metric_status:'condition',metric_status_icon:''});
  for(const [condition,kind] of Object.entries(conditionKinds)){
   card._forecast=[{datetime:new Date(Date.now()+3600000).toISOString(),condition,temperature:12}];card._forecastStatus='ready';
   card.hass={...hass,themes:{darkMode},states:{...hass.states,[config.entity]:{...hass.states[config.entity],state:condition}}};
   check('icon family covers '+icon_style+compact+darkMode+condition,['.art','.weather-status .ui-metric-icon','.forecast-list'].every(selector=>{const icon=query(selector+' .weather-icon');return icon?.dataset.iconKind===kind&&icon.classList.contains('wxi-'+icon_style)&&getComputedStyle(icon).display!=='none'&&icon.getBoundingClientRect().height>0;}));
  }
  for(const width of [260,480]){card.style.width=width+'px';check('new icon fits '+icon_style+compact+darkMode+width,query('.content').scrollWidth<=query('.content').clientWidth&&query('.art svg').getBoundingClientRect().bottom<=query('.weather-status').getBoundingClientRect().top);}
  card.style.width='';
 }
 for(const icon_style of ['glass','neon']){
  card.hass=hass;card.setConfig({...config,icon_style,animate_icons:false,animate_background:false});check('new icons stop when disabled '+icon_style,card.shadowRoot.getAnimations().length===0);
  card.setConfig({...config,icon_style});card.hass={...hass,connected:false};check('new icons stop when offline '+icon_style,card.shadowRoot.getAnimations().length===0);
  card.hass={...hass,states:{...hass.states,[config.entity]:{...hass.states[config.entity],state:'unavailable'}}};check('missing weather uses static unknown icon '+icon_style,query('.art svg').dataset.iconKind==='unknown'&&card.shadowRoot.getAnimations().length===0);
 }
 card.hass=hass;
 card.setConfig(config);check('weather illustrations animate',card.shadowRoot.getAnimations().length>0);
 const ids=[...card.shadowRoot.querySelectorAll('svg [id]')].map(e=>e.id);check('icon paint IDs are unique',new Set(ids).size===ids.length);
 card.setConfig({...config,animate_icons:false,animate_background:false});check('animation can be disabled',card.shadowRoot.getAnimations().length===0);card.setConfig(config);
 for(const width of [260,280,320,480]){card.style.width=width+'px';const content=query('.content');check('no horizontal card overflow at '+width,content.scrollWidth<=content.clientWidth);check('weather title removed and feels-like is the primary subtitle at '+width,!query('header')&&query('.primary-label').textContent.includes('Voelt als')&&query('.primary-label').getBoundingClientRect().top>=query('.primary-value').getBoundingClientRect().bottom);}
 card.style.width='';query('.weather-status').click();check('condition opens source entity details',document.getElementById('last-event').textContent.includes(config.entity));
 query('.weather-status').focus();card.hass=hass;check('unchanged telemetry preserves focus',card.shadowRoot.activeElement===query('.weather-status'));
 const current=hass.states[config.entity];card.hass={...hass,states:{...hass.states,[config.entity]:{...current,attributes:{...current.attributes,temperature:0,humidity:0,wind_speed:0}}}};
 check('zero current readings remain visible',query('.temperature').textContent.startsWith('0')&&query('.weather-metrics').textContent.includes('0 %'));
 card.hass={...hass,states:{...hass.states,[config.entity]:{...current,state:'unavailable'}}};
 check('unavailable weather is distinct from zero',query('.temperature').textContent.startsWith('—')&&query('.content').dataset.kind==='unknown');
 card.hass=hass;card.setConfig({...config,forecast_type:'daily'});await Promise.resolve();
 check('daily forecasts replace hourly subscription',card._forecastType==='daily'&&query('[data-ui-tab=daily]').getAttribute('aria-selected')==='true'&&!!query('.forecast-low'));
 query('[data-ui-tab=hourly]').click();await Promise.resolve();
 check('hourly tab changes source and content',card._forecastType==='hourly'&&!query('.forecast-low')&&query('[data-ui-tab=hourly]').getAttribute('aria-selected')==='true');
 query('[data-ui-tab=hourly]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await Promise.resolve();
 check('shared tab keyboard navigation changes forecast and preserves focus',card._forecastType==='daily'&&card.shadowRoot.activeElement===query('[data-ui-tab=daily]'));
 check('switching tabs does not leak subscriptions',qa.subscriptions.size===qa.cards.length);
 for(const compact of [false,true]){
  card.setConfig({...config,compact,tabs:['hourly'],forecast_fields:['precipitation','wind_speed','humidity']});await Promise.resolve();
  check('single hourly forecast hides tabs '+compact,!query('[role=tab]')&&!!query('.forecast-list'));
  check('forecast amounts use source units and preserve zero '+compact,query('[data-forecast-field=precipitation]').textContent.endsWith('0 mm')&&query('[data-forecast-field=wind_speed]').textContent.endsWith('12 km/h'));
  check('forecast only contains selected fields '+compact,[...query('.forecast-list li').querySelectorAll('[data-forecast-field]')].map(el=>el.dataset.forecastField).join(',')==='precipitation,wind_speed,humidity');
  card.setConfig({...config,compact,tabs:['hourly'],forecast_fields:[]});await Promise.resolve();
  check('empty forecast fields leave time only '+compact,!!query('.forecast-list time')&&!query('[data-forecast-field]'));
 }
 card.setConfig(config);await Promise.resolve();

 card.setConfig({...config,metric_primary:'pressure',metric_secondary:'uv_index'});
 check('selected data fields replace wind and humidity',query('.weather-metrics').textContent.includes('Luchtdruk')&&query('.weather-metrics').textContent.includes('hPa')&&query('.weather-metrics').textContent.includes('UV-index'));
 card.setConfig({...config,metric_primary:'none',metric_secondary:'uv_index'});check('one data field can be hidden',card.shadowRoot.querySelectorAll('[data-weather-field]').length===1);
 card.setConfig({...config,metric_primary:'none',metric_secondary:'none'});check('both data fields can be hidden',!query('.weather-metrics'));
 card.setConfig(config);const standardHeight=card.getBoundingClientRect().height;
 card.setConfig({...config,compact:true});check('compact variant shows forecast without tabs',card.getBoundingClientRect().height<standardHeight&&!query('[role=tab]')&&!!query('.forecast-list'));
 for(const compact of [false,true])for(const forecast_type of ['hourly','daily']){
  card.setConfig({...config,compact,forecast_type,compact_forecast:forecast_type});await Promise.resolve();const list=query('.forecast-list'),first=list.querySelector('li');
  check('forecast starts at left edge '+forecast_type+' compact='+compact,Math.abs(first.getBoundingClientRect().left-list.getBoundingClientRect().left)<.1&&getComputedStyle(list).paddingInlineStart==='0px');
 }
 card.setConfig({...config,compact:true});
 card.setConfig({...config,compact:true,compact_forecast:'daily'});await Promise.resolve();
 check('compact daily choice uses daily forecast without tabs',card._forecastType==='daily'&&!!query('.forecast-low')&&!query('[role=tab]'));
 card.setConfig({...config,compact:true,compact_forecast:'none'});await Promise.resolve();
 check('compact no-forecast choice removes content and subscription',!query('.forecast')&&qa.subscriptions.size===qa.cards.length-1);
 card.setConfig({...config,compact:true,compact_forecast:'hourly'});await Promise.resolve();
 check('compact hourly choice restores hourly subscription',card._forecastType==='hourly'&&!!query('.forecast-list')&&!query('.forecast-low'));
 for(const width of [260,280,320,480]){card.style.width=width+'px';check('compact card fits '+width,query('.content').scrollWidth<=query('.content').clientWidth);}
 card.style.width='';card.setConfig(config);
 card.style.width='260px';card.setConfig({...config,metric_primary:'apparent_temperature',metric_secondary:'humidity'});
 check('long labels keep metric values aligned on narrow cards',Math.abs(card.shadowRoot.querySelectorAll('[data-weather-field] .ui-metric-value')[0].getBoundingClientRect().top-card.shadowRoot.querySelectorAll('[data-weather-field] .ui-metric-value')[1].getBoundingClientRect().top)<.1&&query('.content').scrollWidth<=query('.content').clientWidth);
 card.style.width='';card.setConfig(config);
 card.setConfig({...config,show_forecast:false});await Promise.resolve();check('forecast can be disabled',!query('.forecast'));
 card.setConfig(config);card.hass={...hass,connected:false};await Promise.resolve();check('offline state stops subscriptions and labels old readings',query('.weather-status .ui-metric-info').textContent.includes('Geen verbinding'));
 card.hass={...hass,connection:{subscribeMessage:async()=>{throw Error('Synthetic subscription failure');}}};await Promise.resolve();await Promise.resolve();
 check('subscription failure has a retry action',!!query('.retry')&&card._forecastStatus==='error');
 card.hass=hass;await Promise.resolve();check('reconnection restores forecast',query('.forecast-list li')&&card._forecastStatus==='ready');
 const editor=await card.constructor.getConfigElement();editor.setConfig(config);editor.hass=hass;document.getElementById('editor').append(editor);
 const editorSchema=()=>{const flatten=items=>items.flatMap(item=>[item,...flatten(item.schema??[])]);return flatten(editor._form._schema);};
 check('visual editor offers entity and forecast choices',editorSchema().some(f=>f.name==='entity')&&editorSchema().some(f=>f.name==='forecast_type'));
 check('visual editor offers compact layout and both metric selectors',['compact','metric_primary','metric_secondary'].every(name=>editorSchema().some(f=>f.name===name)));
 check('editor offers both approved icon styles',editorSchema().find(f=>f.name==='icon_style')?.selector.select.options.map(item=>item.value).join(',')==='classic,glass,neon');
 check('visual editor offers backgrounds and animation toggle',editorSchema().find(f=>f.name==='background')?.selector.select.options.length===8&&editorSchema().some(f=>f.name==='animate_icons'));
 editor.setConfig({...config,compact:true});
 check('compact editor offers visible tabs and hides the redundant default for a single forecast',editorSchema().find(f=>f.name==='tabs')?.selector.select.multiple&&!editorSchema().some(f=>f.name==='forecast_type')&&editorSchema().some(f=>f.name==='forecast_hourly_fields'));
 check('editor offers wide field configuration',editorSchema().some(item=>item.name==='metric_status')&&editorSchema().some(item=>item.name==='metric_status_icon'));
 check('weather icon has matching position and scale sliders',['icon_scale','icon_offset_x','icon_offset_y'].every(name=>editorSchema().find(field=>field.name===name)?.selector.number.mode==='slider'));
 editor._form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{icon_scale:160,icon_offset_x:-25,icon_offset_y:15}}}));
 check('weather editor stores icon sliders',editor._config.icon_scale===160&&editor._config.icon_offset_x===-25&&editor._config.icon_offset_y===15);
 editor.setConfig(config);
 check('editor uses expandable sections',editor._form._schema.every(item=>item.type==='expandable'&&item.flatten));
 editor.setConfig(config);
 let emitted;editor.addEventListener('config-changed',event=>{emitted=event.detail.config;});editor._form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{title:'Test title'}}}));
 check('visual editor emits validated config',emitted?.title==='Test title'&&emitted.entity===config.entity);
 for(const compact of [false,true]){
  card.setConfig({...config,compact,tabs:['daily'],forecast_type:'hourly'});await Promise.resolve();
  check('explicit daily-only tab works '+compact,card._forecastType==='daily'&&!query('[role=tab]')&&!!query('.forecast-low'));
  card.setConfig({...config,compact,tabs:[]});await Promise.resolve();check('empty tabs stop forecast '+compact,!query('.forecast')&&qa.subscriptions.size===qa.cards.length-1);
  card.setConfig({...config,compact,metric_primary:'none',metric_secondary:'none',tabs:[]});
  check('no extra bottom gap without metrics '+compact,Math.abs(query('.scene').getBoundingClientRect().bottom-query('.weather-status').getBoundingClientRect().bottom)<.1);
 }
 for(const compact of [false,true])for(let mask=0;mask<8;mask++){
  card.setConfig({...config,compact,tabs:[],metric_status:mask&1?'condition':'none',metric_primary:mask&2?'wind_speed':'none',metric_secondary:mask&4?'humidity':'none'});
  check('all field visibility combinations '+compact+' '+mask,!!query('.weather-status')===!!(mask&1)&&card.shadowRoot.querySelectorAll('[data-weather-field]').length===Number(!!(mask&2))+Number(!!(mask&4)));
  if(!(mask&6)){const last=query('.weather-status')??query('.hero');check('no trailing field space '+compact+' '+mask,Math.abs(query('.scene').getBoundingClientRect().bottom-last.getBoundingClientRect().bottom)<.1);}
 }
 card.hass={...hass,states:{...hass.states,'sensor.garden':{state:'0',attributes:{unit_of_measurement:'°C'}}}};
 card.setConfig({...config,metric_status:'custom',metric_status_entity:'sensor.garden',metric_status_label:'Tuin',metric_status_icon:'mdi:thermometer'});
 check('wide field supports custom value label and icon',query('.weather-status .ui-metric-value').textContent==='0 °C'&&query('.weather-status .ui-metric-title').textContent==='Tuin'&&query('.weather-status .ui-metric-icon ha-icon').getAttribute('icon')==='mdi:thermometer');
 let wideInfo;card.addEventListener('hass-more-info',event=>wideInfo=event.detail.entityId);query('.weather-status').click();check('wide custom field opens correct source',wideInfo==='sensor.garden');
 query('.weather-status').focus();card.hass={...card.hass,states:{...card.hass.states,'sensor.garden':{state:'7',attributes:{unit_of_measurement:'°C'}}}};
 check('wide custom field updates and keeps focus',query('.weather-status .ui-metric-value').textContent==='7 °C'&&card.shadowRoot.activeElement===query('.weather-status'));
 const customConfig={...config,metric_primary:'custom',metric_primary_entity:'sensor.garden',metric_primary_label:'Tuin',tabs:['hourly','daily']};
 card.hass={...hass,states:{...hass.states,'sensor.garden':{state:'0',attributes:{unit_of_measurement:'°C'}}}};card.setConfig(customConfig);await Promise.resolve();
 check('custom entity renders independently of weather attributes',query('button[data-weather-field] .ui-metric-value').textContent==='0 °C'&&query('[data-weather-field] .ui-metric-title').textContent==='Tuin');
 query('button[data-weather-field]').focus();card.hass={...card.hass,states:{...card.hass.states,'sensor.garden':{state:'12',attributes:{unit_of_measurement:'°C'}}}};
 check('custom entity updates without weather changes and preserves focus',query('button[data-weather-field] .ui-metric-value').textContent==='12 °C'&&card.shadowRoot.activeElement===query('button[data-weather-field]'));
 let info;card.addEventListener('hass-more-info',event=>info=event.detail.entityId);query('button[data-weather-field]').click();check('custom entity opens its own details',info==='sensor.garden');
 query('[data-ui-tab=daily]').click();await Promise.resolve();card.hass={...card.hass};check('explicit tab selection survives telemetry',card._forecastType==='daily');
 editor.setConfig(customConfig);editor.hass=hass;document.getElementById('editor').hidden=false;
 const fieldGroup=editor._form.querySelector('[data-field=metric_primary_settings]');fieldGroup.open=true;
 const input=editor._form.querySelector('[name=metric_primary_label]');input.value='';input.focus();
 for(const ch of 'Tuin temperatuur'){
  input.setRangeText(ch,input.selectionStart,input.selectionEnd,'end');const caret=input.selectionStart;
  editor._form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{metric_primary_label:input.value}}}));editor.setConfig(emitted);editor.hass={...hass};
  check('editor preserves typing focus '+caret,editor.shadowRoot.activeElement===input&&input.selectionStart===caret&&fieldGroup.open);
 }
 check('editor preserves label spaces',emitted.metric_primary_label==='Tuin temperatuur');
 editor._form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{metric_primary:'none'}}}));
 check('hidden field removes dependent editor controls',!editorSchema().some(item=>item.name==='metric_primary_entity')&&emitted.metric_primary_entity==='sensor.garden');
 editor._form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{metric_status:'custom',metric_status_entity:'sensor.garden'}}}));
 check('editor configures broad custom field',editorSchema().some(item=>item.name==='metric_status_entity')&&emitted.metric_status_entity==='sensor.garden');
 editor._form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{metric_status:'none',metric_secondary:'none'}}}));
 check('editor hides all three field settings',!editorSchema().some(item=>['metric_status_entity','metric_primary_entity','metric_secondary_label','metric_status_icon'].includes(item.name)));
 editor._form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{tabs:[]}}}));check('hidden forecasts remove dependent editor controls',!editorSchema().some(item=>item.name==='forecast_count'));
 editor.hass={...hass,language:'en',locale:{language:'en'}};check('editor labels use English',editor._form._label({name:'metric_primary'})==='Data source');
 document.getElementById('editor').hidden=true;card.hass=hass;card.setConfig(config);

 // Live nodes and subscriptions survive telemetry and cosmetic configuration edits.
 card.setConfig({...config,tabs:['hourly','daily'],background:'clouds',icon_style:'glass'});await Promise.resolve();
 card.style.width='260px';
 const liveContent=query('.content'),liveIcon=query('.art svg'),liveList=query('.forecast-list'),liveRow=query('.forecast-list li');
 liveList.scrollLeft=30;const offset=liveList.scrollLeft,generation=card._generation,forecast=card._forecast,liveAnimation=card.shadowRoot.getAnimations().find(animation=>animation.effect.target.closest('.art'));
 card.hass={...hass,states:{...hass.states,[config.entity]:{...hass.states[config.entity],attributes:{...hass.states[config.entity].attributes,temperature:23}}}};
 check('telemetry retains content icon list and forecast row nodes',query('.content')===liveContent&&query('.art svg')===liveIcon&&query('.forecast-list')===liveList&&query('.forecast-list li')===liveRow);
 check('telemetry preserves forecast scroll position',query('.forecast-list').scrollLeft===offset);
 check('telemetry retains the running icon animation',!!liveAnimation&&card.shadowRoot.getAnimations().includes(liveAnimation));
 query('[data-ui-tab=daily]').click();await Promise.resolve();
 const dailyGeneration=card._generation,dailyForecast=card._forecast;
 card.setConfig({...card._config,title:'Updated title',background:'aurora'});await Promise.resolve();
 check('appearance edits preserve selected tab subscription and received forecast',card._forecastType==='daily'&&card._generation===dailyGeneration&&card._forecast===dailyForecast);
 let liveClicks=0;const clickListener=()=>liveClicks++;card.addEventListener('hass-more-info',clickListener);
 for(let n=0;n<3;n++)card.setConfig({...card._config,title:'Title '+n});query('.weather-status').click();
 check('incremental updates do not duplicate click handlers',liveClicks===1);card.removeEventListener('hass-more-info',clickListener);
 card.setConfig({...config,tabs:['hourly','daily'],forecast_hourly_fields:['humidity','temperature'],forecast_daily_fields:['temperature','precipitation'],forecast_hourly_temperature_decimals:1,forecast_daily_temperature_decimals:2});await Promise.resolve();
 query('[data-ui-tab=hourly]').click();await Promise.resolve();card._forecast=[{...qa.makeForecast('hourly')[0],temperature:19.876,humidity:0}];card._render();
 check('hourly fields retain their own order and precision',[...query('.forecast-list li').querySelectorAll('[data-forecast-field]')].map(el=>el.dataset.forecastField).join(',')==='humidity,temperature'&&query('.forecast-value').textContent==='19,9\u00b0C');
 query('[data-ui-tab=daily]').click();await Promise.resolve();card._forecast=[{...qa.makeForecast('daily')[0],temperature:19.876}];card._render();
 check('daily fields retain independent order and precision',[...query('.forecast-list li').querySelectorAll('[data-forecast-field]')].map(el=>el.dataset.forecastField).join(',')==='temperature,precipitation'&&query('.forecast-value').textContent==='19,88\u00b0C');
 card.setConfig({...config,background:'clouds',icon_style:'glass',animate_background:true,animate_icons:false});await Promise.resolve();
 check('background can animate while icons are static',getComputedStyle(query('.header-atmosphere'),'::before').animationName==='weather-clouds'&&getComputedStyle(query('.wxi-cloud-layer')).animationName==='none');
 card.setConfig({...card._config,animate_background:false,animate_icons:true});
 check('icons can animate while background is static',getComputedStyle(query('.header-atmosphere'),'::before').animationName==='none'&&getComputedStyle(query('.wxi-cloud-layer')).animationName==='wxi-float');
 editor.setConfig({...config,tabs:['hourly','daily'],forecast_hourly_fields:['temperature','humidity'],forecast_daily_fields:['temperature','precipitation']});
 check('editor offers independent animation and forecast controls',['animate_background','animate_icons','forecast_hourly_fields','forecast_daily_fields','forecast_hourly_temperature_decimals','forecast_daily_temperature_decimals'].every(name=>editorSchema().some(item=>item.name===name)));
 document.getElementById('editor').hidden=false;const order=editor.shadowRoot.querySelector('details[data-type=hourly]');order.open=true;order.querySelector('button[data-field=humidity][data-direction="-1"]').click();
 check('editor reorders hourly fields without changing daily fields',editor._config.forecast_hourly_fields.join(',')==='humidity,temperature'&&editor._config.forecast_daily_fields.join(',')==='temperature,precipitation'&&editor.shadowRoot.querySelector('details[data-type=hourly]').open&&editor.shadowRoot.activeElement?.dataset.field==='humidity');
 editor._form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{forecast_hourly_temperature_decimals:2,forecast_daily_temperature_decimals:0}}}));
 check('editor emits independent precision and retains field order',emitted.forecast_hourly_temperature_decimals===2&&emitted.forecast_daily_temperature_decimals===0&&emitted.forecast_hourly_fields[0]==='humidity');
 document.getElementById('editor').hidden=true;card.style.width='';card.hass=hass;card.setConfig(config);await Promise.resolve();
 card.setConfig({...config,title:'<img src=x onerror=alert(1)>'});check('configured title is escaped',!query('img')&&query('ha-card').getAttribute('aria-label').includes('<img'));card.setConfig(config);
 await import('/cards/weather-card/dist/eleven-weather-card-test.js');const test=document.createElement('eleven-weather-card-test');test.setConfig({...config,type:'custom:eleven-weather-card-test'});test.hass=hass;document.body.append(test);await Promise.resolve();
 check('standalone test card coexists with normal card',test.constructor!==card.constructor&&!!test.shadowRoot.querySelector('.forecast-list'));
 const testEditor=await test.constructor.getConfigElement();check('test editor has a distinct name',testEditor.tagName==='ELEVEN-WEATHER-EDITOR-TEST');test.remove();
 card.hass={...hass,language:'en',locale:{language:'en'},themes:{darkMode:false}};check('English and light theme render',query('.weather-status .ui-metric-value').textContent==='Sunny'&&query('.content').dataset.dark==='false');card.hass=hass;
 return checks;
 })()`);
 assert.deepEqual(exceptions,[],'no uncaught browser exceptions');console.log('PASS: '+checks.length+' weather browser checks without screenshots.');console.log(checks.join('\n'));
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 assert.equal(await evaluate('weatherQA.cards.every(c=>c.shadowRoot.getAnimations().length===0)'),true,'reduced motion disables weather animations');
 console.log('PASS: reduced-motion preference disables weather animations.');
 await send('Emulation.setEmulatedMedia',{features:[]});
 await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/cards/weather-card/qa/alignment.html`});
 for(let attempt=0;attempt<100;attempt++){if(await evaluate('!!window.weatherAlignment && weatherAlignment.evccCards.every(c=>!!c.shadowRoot.querySelector(".charging-readings"))'))break;await delay(50);}
 const alignment=await evaluate(`(async()=>{
  const reports=[],qa=weatherAlignment;
  const assert=(condition,message)=>{if(!condition)throw Error(message);};
  for(const darkMode of [false,true]){
   document.body.classList.toggle('dark',darkMode);
   for(const card of [...qa.evccCards,...qa.weatherCards])card.hass={...card.hass,themes:{darkMode}};
   for(const width of [260,280,320,480])for(let i=0;i<2;i++){
    const evcc=qa.evccCards[i],weather=qa.weatherCards[i];evcc.style.width=weather.style.width=width+'px';
    const e=evcc.shadowRoot,w=weather.shadowRoot,es=s=>e.querySelector(s),ws=s=>w.querySelector(s);
    const er=s=>es(s).getBoundingClientRect(),wr=s=>ws(s).getBoundingClientRect();
    const compare=(a,b,keys)=>{const x=getComputedStyle(es(a)),y=getComputedStyle(ws(b));for(const key of keys)assert(x[key]===y[key],key+' differs: '+a+' / '+b+' at '+width+' compact='+!!i+' ('+x[key]+' / '+y[key]+')');};
    const fonts=['fontSize','fontWeight','lineHeight','letterSpacing'];
    compare('.content','.content',['padding']);assert(!ws('header'),'weather has no top-right heading');
    compare('.header-background','.scene-background',['overflow','position']);assert(getComputedStyle(ws('.scene-background')).maskImage.includes('88%'),'weather fade scales with header height');
    compare('.battery-value .primary-value','.temperature .primary-value',fonts);
    compare('.charging-status','.weather-status',['padding','gap','borderRadius','backgroundColor']);
    compare('.charging-status .ui-metric-icon','.weather-status .ui-metric-icon',['width','height','borderRadius']);
    compare('.charging-status .ui-metric-value','.weather-status .ui-metric-value',fonts);
    compare('.charging-readings>[data-ui-metric]','[data-weather-field]',['padding','borderRadius','backgroundColor']);
    compare('.charging-readings .ui-metric-title','[data-weather-field] .ui-metric-title',fonts);
    compare('.charging-readings .ui-metric-value','[data-weather-field] .ui-metric-value',fonts);
    compare('.charging-readings','.weather-metrics',['columnGap']);
    const eh=evcc.getBoundingClientRect(),wh=weather.getBoundingClientRect();
    for(const [a,b] of [['.battery-value','.temperature']])assert(Math.abs((er(a).top-eh.top)-(wr(b).top-wh.top))<.1,'header top differs '+width+' compact='+!!i);
    assert(Math.abs((er('.charging-readings').top-er('.charging-status').bottom)-(wr('.weather-metrics').top-wr('.weather-status').bottom))<.1,'status-to-metrics gap differs');
    const eGap=er('.charging-readings .ui-metric-value').top-Math.max(...[...e.querySelectorAll('.charging-readings .ui-metric-title')].map(n=>n.getBoundingClientRect().bottom)),wGap=wr('[data-weather-field] .ui-metric-value').top-Math.max(...[...w.querySelectorAll('.weather-metrics .ui-metric-title')].map(n=>n.getBoundingClientRect().bottom));
    assert(Math.abs(eGap-wGap)<.1,'label-to-value gap differs');
    assert(ws('.content').scrollWidth<=ws('.content').clientWidth,'weather card overflows');
    if(!i){compare('[role=tab]','[role=tab]',fonts.concat(['padding','minHeight']));compare('.evcc-panel','.forecast-panel',['paddingTop']);}
    reports.push({width,compact:!!i,darkMode});
   }
  }
  return reports;
 })()`);
 assert.equal(alignment.length,16);assert.deepEqual(exceptions,[],'no alignment preview exceptions');
 console.log('PASS: 16 Weather/EVCC alignment comparisons across widths, themes and densities.');
 await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/cards/weather-card/qa/header-concepts.html`});
 for(let attempt=0;attempt<100;attempt++){if(await evaluate('window.weatherHeaderStudies?.length===5'))break;await delay(50);}
 assert.equal(await evaluate(`(()=>{
  const cards=weatherHeaderStudies.map(item=>item.card),assert=(ok,message)=>{if(!ok)throw Error(message);};
  for(const card of cards){
   assert(card.hasAttribute('data-motion-paused')||card.shadowRoot.getAnimations().some(animation=>animation.playState==='running'),'header animates when visible');
   for(const width of [260,480]){card.style.width=width+'px';const content=card.shadowRoot.querySelector('.content');assert(content.scrollWidth<=content.clientWidth,'header fits '+width);}
   card.style.width='';
  }
  document.querySelector('#motion').click();assert(cards.every(card=>card.shadowRoot.getAnimations().every(animation=>animation.playState!=='running')),'pause stops all motion');
  document.querySelector('#fields').click();assert(cards.every(card=>!card.shadowRoot.querySelector('.weather-status,.metric')),'all fields can be hidden');
  document.querySelector('#theme').click();assert(cards.every(card=>card.shadowRoot.querySelector('.content').dataset.dark==='false'),'light theme applied');
  document.querySelector('#motion').click();return true;
 })()`),true);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 assert.equal(await evaluate('weatherHeaderStudies.every(({card})=>card.shadowRoot.getAnimations().length===0)'),true,'header studies honor reduced motion');
 assert.deepEqual(exceptions,[],'no header preview exceptions');
 console.log('PASS: five animated header studies, pause, field visibility, light theme, narrow layout and reduced motion.');
 await send('Emulation.setEmulatedMedia',{features:[]});
 await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/cards/weather-card/qa/icon-concepts.html`});
 for(let attempt=0;attempt<100;attempt++){if(await evaluate('window.weatherIconStudies?.length===4'))break;await delay(50);}
 assert.equal(await evaluate(`(()=>{
  const cards=weatherIconStudies.map(item=>item.card),assert=(ok,message)=>{if(!ok)throw Error(message);};
  for(const condition of ['sunny','partlycloudy','rainy','clear-night','lightning-rainy']){
   const select=document.querySelector('#condition');select.value=condition;select.dispatchEvent(new Event('change'));
   for(const card of cards){
    const icon=card.shadowRoot.querySelector('.art .idea-icon,.art .wxi-icon');assert(getComputedStyle(icon).display!=='none'&&icon.getBoundingClientRect().height>0,'main icon visible '+card._config.icon_study+condition);
    assert(card.hasAttribute('data-motion-paused')||card.shadowRoot.getAnimations().some(animation=>animation.playState==='running'),'icon animates when visible '+card._config.icon_study+condition);
    card.style.width='260px';assert(card.shadowRoot.querySelector('.content').scrollWidth<=card.clientWidth,'small card fits');card.style.width='';
   }
  }
  const samples=[...document.querySelectorAll('.sample svg')];assert(samples.length===20&&samples.every(icon=>getComputedStyle(icon).display!=='none'),'all small icons visible');
  const ids=[...document.querySelectorAll('svg [id]'),...cards.flatMap(card=>[...card.shadowRoot.querySelectorAll('svg [id]')])].map(el=>el.id);assert(new Set(ids).size===ids.length,'unique SVG paint IDs');
  document.querySelector('#motion').click();assert(cards.every(card=>card.shadowRoot.getAnimations().every(animation=>animation.playState!=='running'))&&document.getAnimations().every(animation=>animation.playState!=='running'),'pause stops all icon motion');
  document.querySelector('#motion').click();return true;
 })()`),true);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 assert.equal(await evaluate('weatherIconStudies.every(({card})=>card.shadowRoot.getAnimations().length===0)&&document.getAnimations().length===0'),true,'icon studies honor reduced motion');
 assert.deepEqual(exceptions,[],'no icon preview exceptions');
 console.log('PASS: four icon families, five conditions, 20 small icons, narrow cards, pause and reduced motion.');

 await send('Emulation.setEmulatedMedia',{features:[]});
 await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/cards/weather-card/qa/cloud-layers.html`});
 for(let attempt=0;attempt<100;attempt++){if(await evaluate('window.cloudLayerExamples?.length===3'))break;await delay(50);}
 assert.equal(await evaluate(`(()=>{
  const cards=cloudLayerExamples;
  if(cards.some(c=>!c.shadowRoot.querySelector('.forecast-list')||c.shadowRoot.querySelector('[role=tab]')))throw Error('single forecast renders without tabs');
  const speed=c=>getComputedStyle(c.shadowRoot.querySelector('.header-atmosphere'),'::before').animationDuration;
  if(speed(cards[0])!=='18s'||speed(cards[1])!=='8s')throw Error('cloud motion comparison');
  document.querySelector('#motion').click();
  if(cards.some(c=>c.shadowRoot.getAnimations().some(a=>a.playState==='running')))throw Error('cloud preview pauses');
  return true;
 })()`),true);
 assert.deepEqual(exceptions,[],'no cloud comparison exceptions');
 console.log('PASS: Cloud Layers comparison, single forecast and motion toggle.');

 // Real IntersectionObserver plus visibility lifecycle, without captures.
 await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/cards/weather-card/qa/index.html`});
 for(let attempt=0;attempt<100;attempt++){if(await evaluate('!!window.weatherQA'))break;await delay(50);}
 assert.equal(await evaluate(`(async()=>{
  const card=document.createElement('eleven-weather-card');
  card.style.cssText='position:fixed;top:0;left:0;width:300px;z-index:9999';card.setConfig({entity:'weather.example_0',tabs:['hourly'],background:'clouds',icon_style:'glass'});card.hass=weatherQA.hass;document.body.append(card);
  const wait=()=>new Promise(resolve=>setTimeout(resolve,100)),assert=(ok,message)=>{if(!ok)throw Error(message);};
  const until=async test=>{for(let i=0;i<20&&!test();i++)await wait();};
  await wait();assert(!card.hasAttribute('data-motion-paused'),'visible card is active');
  const icon=card.shadowRoot.querySelector('.art svg'),clock=card._forecastClock;
  card.style.top='200vh';await until(()=>card.hasAttribute('data-motion-paused'));assert(card.hasAttribute('data-motion-paused')&&card.shadowRoot.getAnimations().every(a=>a.playState!=='running'),'offscreen motion pauses');
  card.style.top='0';await until(()=>!card.hasAttribute('data-motion-paused'));assert(!card.hasAttribute('data-motion-paused')&&card.shadowRoot.querySelector('.art svg')===icon,'returning to viewport resumes existing nodes');
  try{
   Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
   assert(card.hasAttribute('data-motion-paused')&&card._forecastClock===null,'hidden browser tab pauses animations and clock');
  }finally{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));}
  assert(!card.hasAttribute('data-motion-paused')&&card._forecastClock!=null,'visible browser tab resumes clock');
  card.remove();assert(card._forecastClock===null&&card._motionCleanup===null,'disconnect cleans timer and motion observers');return true;
 })()`),true);
 assert.deepEqual(exceptions,[],'no lifecycle exceptions');
 console.log('PASS: offscreen pause, resume, hidden tab and observer/timer cleanup.');
 await send('Browser.close').catch(()=>{});
} finally {
 clearTimeout(watchdog); socket?.close(); browser.kill(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
}
