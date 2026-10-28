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
 await send('Page.navigate', {url: `http://127.0.0.1:${server.address().port}/cards/car-card/qa/evcc/index.html`});
 for (let attempt = 0; attempt < 100; attempt++) { if (await evaluate('!!window.evccQA?.editor && evccQA.card._registry.length > 0')) break; await delay(100); }
 await evaluate(`evccQA.card.shadowRoot.querySelector('[data-ui-tab="controls"]').click()`);
 const slider = await evaluate(`(() => {const input=evccQA.card.shadowRoot.querySelector('[data-solar-share]');input.scrollIntoView({block:'center'});evccQA.holdSolar=true;const r=input.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,active:evccQA.card._activeTab,ancestors:(()=>{let n=input,a=[];while(n?.tagName){a.push({tag:n.tagName,hidden:n.hidden,display:getComputedStyle(n).display});n=n.parentElement;}return a})()};})()`);
 assert.ok(slider.width>0,JSON.stringify(slider));
 const sliderY = slider.y + slider.height / 2;
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:slider.x+slider.width*.6,y:sliderY});
 await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,x:slider.x+slider.width*.6,y:sliderY});
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:slider.x+slider.width*.8,y:sliderY});
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,x:slider.x+slider.width*.8,y:sliderY});
 await delay(20);
 const dragResult=await evaluate(`({calls:evccQA.calls,pending:evccQA.card._pendingSolar,value:evccQA.card.shadowRoot.querySelector('[data-solar-share]').value,rect:(()=>{const r=evccQA.card.shadowRoot.querySelector('[data-solar-share]').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()})`);
 assert.ok(dragResult.calls.length===1 && dragResult.calls[0].domain==='number' && dragResult.pending?.value===80,'trusted pointer drag sends one service request on release: '+JSON.stringify(dragResult));
 await evaluate(`evccQA.update('number.evcc_driveway_solar_share',{state:'80'});evccQA.update('number.evcc_driveway_solar_share',{state:'60'});evccQA.holdSolar=false;evccQA.calls=[];`);
 const checks = await evaluate(`(async () => {
  const qa = evccQA, card = qa.card, checks = [];
  const check = (name, condition) => { if (!condition) throw Error(name); checks.push(name); };
  const text = () => card.shadowRoot.textContent;
  const query = selector => card.shadowRoot.querySelector(selector);
  check('registry discovery resolves selected loadpoint', card._entities.soc === 'sensor.evcc_driveway_vehicle_soc');
  check('charging state and session render without planning', query('.content').dataset.state==='charging' && !query('header .status') && text().includes('Laadsessie') && !query('.planning'));
  check('units and image entity render', text().includes('7,1 kW') && query('img').src.endsWith('car.svg'));
  check('obsolete decorative car line is removed',getComputedStyle(query('.car-stage'),'::after').content==='none');
  check('power and duration units use the smaller shared type',Array.from(card.shadowRoot.querySelectorAll('.charging-readings .ui-metric-value .ui-metric-unit')).length===3 && Array.from(card.shadowRoot.querySelectorAll('.charging-readings .ui-metric-value .ui-metric-unit')).every(unit=>getComputedStyle(unit).fontSize==='11px'));
  check('technical information buttons do not inflate line height',Array.from(card.shadowRoot.querySelectorAll('.charging-readings .ui-metric-info button')).every(button=>getComputedStyle(button).minHeight==='0px') && Math.abs(query('.charging-readings .ui-metric-info').getBoundingClientRect().height-query('.charging-status .ui-metric-info').getBoundingClientRect().height)<1);
  check('accessible battery level', query('.battery-track').getAttribute('aria-valuenow') === '62');
  check('Gallery header puts range below primary value with a large vehicle stage and target marker',!query('.car-name') && !query('.target') && !!query('.target-marker') && query('.primary-label').getBoundingClientRect().top>=query('.primary-value').getBoundingClientRect().bottom && getComputedStyle(query('.picture')).position==='absolute' && !query('.gallery-top header') && !query('.vehicle-motion'));
  check('solar preference is next to mode controls and distinct from measured session share',query('.charging-controls [data-solar-share]').value==='60' && query('.solar-metric label').textContent==='Zonnevoorkeur' && query('[data-field=solar_percentage]').textContent.includes('78 %'));
  for(const [a,b] of [['.solar-metric dt','.session-summary dt'],['.solar-metric dd','.session-summary dd']]){const first=getComputedStyle(query(a)),second=getComputedStyle(query(b));check('solar typography matches session '+a,['fontSize','fontWeight','color','lineHeight','letterSpacing'].every(key=>first[key]===second[key]));}
  let solarInput=query('[data-solar-share]');const beforeSolar=qa.calls.length;
  solarInput.dispatchEvent(new PointerEvent('pointerdown'));solarInput.value='70';solarInput.dispatchEvent(new Event('input'));
  qa.update('sensor.evcc_driveway_vehicle_soc',{state:'63'});
  check('solar drag preview survives telemetry without writing or replacing the input',query('[data-solar-share]')===solarInput && query('[data-solar-output]').textContent==='70 %' && qa.calls.length===beforeSolar);
  qa.holdSolar=true;solarInput.dispatchEvent(new PointerEvent('pointerup'));solarInput.dispatchEvent(new Event('change'));await new Promise(resolve=>setTimeout(resolve,0));
  check('solar release sends one number service call and waits for confirmation',qa.calls.length===beforeSolar+1 && qa.calls.at(-1).domain==='number' && qa.calls.at(-1).service==='set_value' && qa.calls.at(-1).service_data.entity_id==='number.evcc_driveway_solar_share' && qa.calls.at(-1).service_data.value===70 && query('[data-solar-share]').disabled && qa.hass.states['number.evcc_driveway_solar_share'].state==='60');
  qa.update('number.evcc_driveway_solar_share',{state:'70'});qa.holdSolar=false;
  check('solar entity confirmation re-enables controls and deferred telemetry appears',!query('[data-solar-share]').disabled && query('[data-solar-share]').value==='70' && query('.battery-track').getAttribute('aria-valuenow')==='63');
  qa.serviceError='<denied>';solarInput=query('[data-solar-share]');solarInput.value='80';solarInput.dispatchEvent(new Event('change'));await new Promise(resolve=>setTimeout(resolve,0));
  check('solar failure is escaped and restores the confirmed value',query('.solar-setting .error').textContent.includes('<denied>') && query('[data-solar-share]').value==='70' && !query('[data-solar-share]').disabled);
  qa.serviceError=null;await card._changeSolar(60);
  qa.update('number.evcc_driveway_solar_share',{state:'unavailable'});
  check('unavailable solar setting is disabled without claiming zero',query('[data-solar-share]').disabled && query('[data-solar-output]').textContent==='—');
  qa.update('number.evcc_driveway_solar_share',{state:'0'});
  check('zero solar setting remains available with appropriate explanation',!query('[data-solar-share]').disabled && query('[data-solar-output]').textContent==='0 %' && query('.solar-hint').textContent.includes('zodra'));
  qa.update('number.evcc_driveway_solar_share',{state:'60'});
  qa.update('sensor.evcc_driveway_session_solar_percentage',{state:'unavailable'});
  check('unavailable session solar share is not drawn as zero',!query('.solar-strip') && query('[data-field=solar_percentage] dd').textContent.includes(String.fromCharCode(8212)));
  qa.update('sensor.evcc_driveway_session_solar_percentage',{state:'0'});
  check('measured zero session solar share is explicitly displayed',query('[data-field=solar_percentage] dd').textContent==='0 %');
  qa.update('sensor.evcc_driveway_session_solar_percentage',{state:'78'});qa.update('sensor.evcc_driveway_vehicle_soc',{state:'62'});
  check('friendly vehicle name remains in the accessible image description',query('img').alt==='Voorbeeldauto');
  check('charge modes preserve raw integration options with one Smart button',card.shadowRoot.querySelectorAll('[data-mode]').length===4 && !query('[data-mode=minpv]') && query('[data-mode=pv]').textContent==='Slim' && query('[data-mode=pv]').getAttribute('aria-pressed')==='true');
  qa.holdMode = true; query('[data-mode="now"]').click(); await Promise.resolve();
  check('mode waits for entity confirmation and disables duplicate actions', query('[data-mode="now"]').disabled && query('[data-mode="pv"]').getAttribute('aria-pressed') === 'true' && qa.calls.at(-1).service_data.option === 'now');
  qa.update('select.evcc_driveway_mode',{state:'now'});qa.holdMode=false;
  check('mode acknowledges source entity update', !query('[data-mode="pv"]').disabled && query('[data-mode="now"]').getAttribute('aria-pressed') === 'true');
  qa.serviceError='<permission denied>';query('[data-mode="pv"]').click();await new Promise(resolve=>setTimeout(resolve,0));
  check('mode service rejection stays visible and escaped', query('.error').textContent.includes('<permission denied>') && !query('.error permission'));
  qa.serviceError=null;query('[data-mode="pv"]').click();await new Promise(resolve=>setTimeout(resolve,0));
  query('[data-ui-tab="session"]').click();
  await new Promise(resolve=>setTimeout(resolve,0));
  check('session is borderless without a heading',!query('[data-ui-tab-panel="session"]').hidden && query('[data-ui-tab-panel="controls"]').hidden && !query('.session-details') && !query('.session [data-field=remaining_energy]') && !query('.session [data-field=co2]') && !query('.session h3') && getComputedStyle(query('.session')).borderWidth==='0px' && getComputedStyle(query('.session')).backgroundColor==='rgba(0, 0, 0, 0)');
  check('history uses a thin stepped shared graph with a fading area below session metrics',query('.history .series-line').getAttribute('d').includes(' H ') && !query('.history .series-line').getAttribute('d').includes(' C ') && query('.history .series-line').getAttribute('stroke-width')==='2' && query('.history .power-area').getAttribute('fill')==='url(#evcc-power-fade)' && !!(query('[data-field=solar_percentage]').compareDocumentPosition(query('.history')) & Node.DOCUMENT_POSITION_FOLLOWING));
  check('history is fetched lazily for the complete connection and selected power entity',qa.historyCalls.length===2 && qa.historyCalls[1].url.includes('sensor.renamed_evcc_power') && card._historyRange.end-card._historyRange.start>=10799000);
  check('tab metrics share label and value typography',card.shadowRoot.querySelectorAll('.evcc-panel dl dd').length>8 && Array.from(card.shadowRoot.querySelectorAll('.evcc-panel dl dt')).every(el=>getComputedStyle(el).fontSize==='11px') && Array.from(card.shadowRoot.querySelectorAll('.evcc-panel dl dd')).every(el=>getComputedStyle(el).fontSize==='18px'));
  check('solar percentage uses the same label/value style beneath duration',!query('.solar-session') && getComputedStyle(query('[data-field=solar_percentage]')).gridRowStart==='3' && getComputedStyle(query('[data-field=solar_percentage]')).gridColumnStart==='1');
  check('session duration stays beneath energy and average price beneath costs',getComputedStyle(query('.session [data-field="charge_duration"]')).gridColumnStart==='1' && getComputedStyle(query('.session [data-field="charge_duration"]')).gridRowStart==='2' && getComputedStyle(query('.session [data-field="session_price_per_kwh"]')).gridColumnStart==='2');
  query('.plot').focus();query('.plot').dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));
  check('power graph exposes keyboard readings',!query('.plot .tooltip').hidden && query('.chart-readout').textContent.includes('kW'));
  for(const width of [260,420,700]){
   document.querySelector('#host').style.width=width+'px';
   query('.plot').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
   const dot=query('.plot .point'),rect=dot.getBoundingClientRect(),plot=query('.plot').getBoundingClientRect(),geometry=card._historyGeometry,point=geometry.points[card._historyIndex];
   check('round hover marker aligns with stepped readings at '+width+'px',!dot.hidden && Math.abs(rect.width-rect.height)<.1 && rect.width===10 && getComputedStyle(dot).borderRadius==='50%' && Math.abs(rect.left+rect.width/2-(plot.left+geometry.x(point.time)/300*plot.width))<1 && Math.abs(rect.top+rect.height/2-(plot.top+geometry.y(point.value)/120*plot.height))<1);
  }
  qa.update('sensor.evcc_driveway_vehicle_soc',{state:'63'});
  check('power graph retains keyboard focus across telemetry updates',card.shadowRoot.activeElement.classList.contains('plot') && !query('.plot .tooltip').hidden);
  qa.historyEmpty=true;card._resetHistory();card._syncHistory();await new Promise(resolve=>setTimeout(resolve,0));
  check('missing history has an explicit fallback without a fabricated zero line',!query('.plot') && query('.history').textContent.includes('Geen vermogenshistorie'));
  qa.historyEmpty=false;qa.historyError=true;card._resetHistory();card._syncHistory();await new Promise(resolve=>setTimeout(resolve,0));
  check('recorder failure leaves session metrics usable',!query('.plot') && query('.session-summary').textContent.includes('12,4 kWh'));
  qa.historyError=false;card._resetHistory();card._syncHistory();await new Promise(resolve=>setTimeout(resolve,0));
  check('history recovers after a failed request',!!query('.plot'));
  query('[data-ui-tab="session"]').focus();
  qa.update('sensor.evcc_driveway_vehicle_soc',{state:'64'});
  check('tab selection and focus survive telemetry',!query('[data-ui-tab-panel="session"]').hidden && card.shadowRoot.activeElement.dataset.uiTab==='session');
  query('[data-ui-tab="session"]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
  check('shared tabs support arrow keys and panel associations',card.shadowRoot.activeElement.dataset.uiTab==='technical' && !query('[data-ui-tab-panel="technical"]').hidden && query('[data-ui-tab="technical"]').getAttribute('aria-controls')===query('[data-ui-tab-panel="technical"]').id);
  query('[data-ui-tab="technical"]').dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));
  check('Home returns to controls without mode border',card.shadowRoot.activeElement.dataset.uiTab==='controls' && !query('[data-ui-tab-panel="controls"]').hidden && getComputedStyle(query('.charging-controls')).borderWidth==='0px');
  query('[data-ui-tab="session"]').click();
  const reading = query('[data-entity="sensor.evcc_driveway_vehicle_soc"]'); reading.focus(); reading.click();
  check('entity details event is wired', qa.lastEntity === 'sensor.evcc_driveway_vehicle_soc');
  qa.update('sensor.evcc_driveway_vehicle_soc', {state:'63'});
  check('live updates retain selected tab and keyboard focus', !query('[data-ui-tab-panel="session"]').hidden && card.shadowRoot.activeElement.dataset.entity === 'sensor.evcc_driveway_vehicle_soc' && query('.battery-track').getAttribute('aria-valuenow') === '63');
  qa.update('sensor.evcc_driveway_vehicle_soc', {state:'unavailable'});
  check('unknown battery does not become zero', !query('.battery-track') && query('.battery-value').textContent.includes('—'));
  qa.update('sensor.evcc_driveway_vehicle_soc', {state:'62'});
  qa.update('binary_sensor.evcc_driveway_charging', {state:'off'});
  qa.update('sensor.renamed_evcc_power', {state:'0'});
  check('zero power keeps explicit connection status',query('.content').dataset.state==='connected' && text().includes('0 kW'));
  check('paused charging does not claim zero minutes remaining',query('.charging-readings>[data-ui-metric]:nth-child(2) .ui-metric-value').textContent.trim()==='—' && !query('.charging-readings').textContent.includes('Geschat klaar'));
  qa.update('sensor.evcc_driveway_vehicle_soc',{state:'80'});
  check('reached target has its own state and remaining-time presentation',query('.content').dataset.view==='done' && query('.charging-readings').textContent.includes('Bereikt'));
  qa.update('sensor.evcc_driveway_vehicle_soc',{state:'62'});
  qa.hass = {...qa.hass, connected:false}; card.hass = qa.hass;
  check('offline is visible without claiming live charging',text().includes('Geen verbinding') && query('.content').dataset.view==='unknown');
  check('offline disables mode controls',query('[data-mode="pv"]').disabled);
  check('offline disables solar share controls',query('[data-solar-share]').disabled);
  qa.hass = {...qa.hass, connected:true}; card.hass = qa.hass;
  check('offline recovery', !query('.warning'));
  qa.update('image.example_car', {attributes:{entity_picture:'/cards/car-card/qa/evcc/car.svg?updated'}});
  check('image updates follow entity changes', query('img').src.endsWith('?updated'));
  qa.update('image.example_car', {attributes:{entity_picture:'/missing-car.svg'}});
  for(let attempt=0;attempt<100 && !query('img').hidden;attempt++)await new Promise(resolve=>setTimeout(resolve,20));
  check('failed image has readable fallback', query('img').hidden && !query('img').nextElementSibling.hidden);
  qa.update('image.example_car', {attributes:{entity_picture:'/cards/car-card/qa/evcc/car.svg'}});
  for(let attempt=0;attempt<100 && query('img').naturalWidth===0;attempt++)await new Promise(resolve=>setTimeout(resolve,20));
  check('image recovers on update', !query('img').hidden && query('img').naturalWidth > 0);
  query('[data-ui-tab="session"]').focus();
  qa.editor._form.dispatchEvent(new CustomEvent('value-changed', {detail:{value:{title:'Mijn laadkaart',tabs:['controls','technical'],soc:'sensor.my_battery'}},bubbles:true}));
  check('visual editor emits configuration including manual override', qa.config.title === 'Mijn laadkaart' && qa.config.entities.soc === 'sensor.my_battery' && !text().includes('Laadsessie'));
  check('hiding the active session tab selects an available panel',!query('[data-ui-tab="session"]') && !query('[data-ui-tab-panel="controls"]').hidden && card.shadowRoot.activeElement.dataset.uiTab==='controls');
  qa.editor._form.dispatchEvent(new CustomEvent('value-changed', {detail:{value:{soc:'',tabs:['controls','session','technical']}},bubbles:true}));
  check('clearing override restores detection', !qa.config.entities.soc && card._entities.soc === 'sensor.evcc_driveway_vehicle_soc');
  qa.update('select.evcc_driveway_vehicle_name', {state:'<img src=x onerror=alert(1)>',attributes:{}});
  check('entity text is escaped',query('img').alt.includes('<img') && !query('.picture img img'));
  qa.hass = {...qa.hass, language:'en',locale:{language:'en'}}; card.hass = qa.hass; qa.editor.hass = qa.hass;
  check('language updates affect labels',query('[data-ui-tab=session]').textContent.includes('Session') && text().includes('Solar preference'));
  qa.update('select.evcc_driveway_vehicle_name',{state:'-None-',attributes:{}});
  check('empty vehicle name stays concise',!query('.car-name') && query('img').alt==='Electric vehicle');
  query('[data-ui-tab="controls"]').click();query('[data-ui-tab="controls"]').focus();
  card.setConfig({...qa.config,tabs:qa.config.tabs.filter(tab=>tab!=='controls')});
  check('hiding charging controls removes the entire controls tab including solar share',!query('[data-ui-tab="controls"]') && !query('[data-ui-tab-panel="controls"]') && !query('[data-mode]') && !query('[data-solar-share]') && !query('.solar-setting') && !!query('[data-field=solar_percentage]'));
  check('hiding the active controls tab restores focus to the session tab',query('[data-ui-tab="session"]').getAttribute('aria-selected')==='true' && card.shadowRoot.activeElement.dataset.uiTab==='session');
  for (const width of [260,340,700]) for (const dark of [false,true]) {
   document.body.classList.toggle('dark',dark);
   const host=document.querySelector('#host');host.style.width=width+'px';host.style.height='230px';
   card.setConfig({...qa.config,vehicle_name:'Een zeer lange voorbeeldautonaam die op een smalle kaart over meerdere regels past'});
   const body=query('.content');
   check('layout '+width+'px '+(dark?'dark':'light'), body.scrollWidth <= body.clientWidth+1 && body.clientHeight <= 230 && body.scrollHeight > body.clientHeight);
  }
  query('.content').scrollTop=120;
  qa.update('sensor.evcc_driveway_vehicle_soc',{state:'64'});
  check('live updates preserve internal scroll position',query('.content').scrollTop===120);
  card.setConfig({evcc_enabled:true});check('empty state explains configuration', text().includes('Select your loadpoint'));
  return checks;
 })()`);
 assert.deepEqual(exceptions, [], 'no uncaught browser exceptions');
 console.log(`PASS: ${checks.length + 1} rendered checks without screenshots.\ntrusted pointer drag sends one service request on release\n` + checks.join('\n'));
 const galleryChecks=await evaluate(`(async() => {
  const qa=evccQA,card=qa.card,root=card.shadowRoot,checks=[];
  const expectedTitleColor=tone=>{const probe=document.createElement('span');probe.style.color='color-mix(in srgb,'+tone+' 88%,#fff)';root.append(probe);const color=getComputedStyle(probe).color;probe.remove();return color;};
  const check=(name,condition)=>{if(!condition)throw Error(name);checks.push(name)};
  card.setConfig({...qa.config,tabs:['controls','session','technical']});
  qa.hass={...qa.hass,connected:true,language:'nl',locale:{language:'nl'}};card.hass=qa.hass;
  qa.update('binary_sensor.evcc_driveway_charging',{state:'on'});
  qa.update('binary_sensor.evcc_driveway_connected',{state:'on'});
  qa.update('select.evcc_driveway_mode',{state:'pv'});
  card.scrollIntoView({block:'start'});await new Promise(resolve=>setTimeout(resolve,60));
  for(const kw of [0,5.5,11]){
   qa.update('sensor.renamed_evcc_power',{state:String(kw)});
   const style=getComputedStyle(root.querySelector('.battery-fill'),'::before');
   check('battery animation at '+kw+' kW',style.animationName==='battery-sweep' && (kw===0?style.animationPlayState==='paused':style.animationPlayState==='running') && Math.abs(parseFloat(style.animationDuration)-(12-10*kw/11))<.001);
  }
  qa.update('sensor.renamed_evcc_power',{state:'unavailable'});
  check('unknown power pauses the charging animation',getComputedStyle(root.querySelector('.battery-fill'),'::before').animationPlayState==='paused');
  qa.update('sensor.renamed_evcc_power',{state:'7.1'});
  check('thin capsule and solid borderless status',getComputedStyle(root.querySelector('.battery-track')).height==='12px' && getComputedStyle(root.querySelector('.battery-track')).borderRadius===getComputedStyle(root.querySelector('.charging-readings>[data-ui-metric]')).borderRadius && getComputedStyle(root.querySelector('.target-marker')).height==='18px' && getComputedStyle(root.querySelector('.charging-status')).borderWidth==='0px' && !getComputedStyle(root.querySelector('.charging-status')).backgroundColor.includes(' / '));
  for(const soc of [0,1,62,100]){
   qa.update('sensor.evcc_driveway_vehicle_soc',{state:String(soc)});
   const track=root.querySelector('.battery-track').getBoundingClientRect(),fill=root.querySelector('.battery-fill').getBoundingClientRect();
   check('animated battery retains measured fill '+soc,Math.abs(fill.width/track.width*100-soc)<.5 && getComputedStyle(root.querySelector('.battery-fill')).overflowX==='hidden');
  }
  qa.update('sensor.evcc_driveway_vehicle_soc',{state:'62'});
  for(const state of ['waiting','done','disconnected']){
   qa.update('binary_sensor.evcc_driveway_charging',{state:'off'});
   qa.update('binary_sensor.evcc_driveway_connected',{state:state==='disconnected'?'off':'on'});
   qa.update('sensor.evcc_driveway_vehicle_soc',{state:state==='done'?'100':'62'});
   check('no battery sweep in '+state,getComputedStyle(root.querySelector('.battery-fill'),'::before').content==='none' && !root.querySelector('.vehicle-motion'));
  }
  qa.update('binary_sensor.evcc_driveway_connected',{state:'on'});
  qa.update('binary_sensor.evcc_driveway_charging',{state:'on'});
  qa.update('sensor.evcc_driveway_vehicle_soc',{state:'62'});
  qa.update('binary_sensor.evcc_driveway_plan_active',{state:'on'});
  check('scheduled charging also animates battery',root.querySelector('.content').dataset.tone==='planned' && getComputedStyle(root.querySelector('.battery-fill'),'::before').animationName==='battery-sweep');
  qa.update('binary_sensor.evcc_driveway_plan_active',{state:'off'});
  qa.update('select.evcc_driveway_mode',{state:'now'});
  check('solar preference is omitted outside Smart',!root.querySelector('.solar-setting'));
  qa.update('select.evcc_driveway_mode',{state:'pv'});
  check('solar preference returns with Smart',!!root.querySelector('[data-solar-share]'));
  qa.update('select.evcc_driveway_mode',{state:'smart',attributes:{options:['off','smart','now']}});
  check('modern EVCC modes are Off Smart and Snel',JSON.stringify([...root.querySelectorAll('[data-mode]')].map(b=>b.textContent))===JSON.stringify(['Off','Smart','Snel']) && !!root.querySelector('[data-solar-share]'));
  qa.update('select.evcc_driveway_mode',{state:'pv',attributes:{options:['off','pv','minpv','now','smart']}});

  for(const mode of ['smart','minpv','pv']){
   qa.update('select.evcc_driveway_mode',{state:mode});
   check('solar preference is available for raw mode '+mode,!!root.querySelector('[data-solar-share]') && root.querySelector('[data-solar-share]').value==='60');
  }
  const flatten=items=>items.flatMap(item=>[item,...flatten(item.schema??[])]);const schema=flatten(qa.editor._schema(true)),names=schema.map(field=>field.name);
  const designs=['lanes','halo','ribbon','prism-glass','eclipse','aurora','clouds','isobars'];
  check('background dropdown includes all eight designs',JSON.stringify(schema.find(f=>f.name==='background').selector.select.options.map(o=>o.value))===JSON.stringify(designs));
  check('existing configurations default to Energy Lanes',card._config.background==='lanes');
  for(const design of designs){
   qa.editor._form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{background:design}}}));
   check('editor persists background '+design,qa.config.background===design && root.querySelector('.content').dataset.background===design);
   for(const dark of [false,true])for(const width of [280,420]){
    document.querySelector('#host').style.width=width+'px';
    qa.hass={...qa.hass,themes:{darkMode:dark}};card.hass=qa.hass;
    const content=root.querySelector('.content'),scene=root.querySelector('.header-scene');
    check('native background layout '+design+' '+dark+' '+width,content.scrollWidth<=content.clientWidth+1 && root.querySelector('.charging-status').parentElement===scene && root.querySelector('.charging-readings').parentElement===root.querySelector('.header-region') && getComputedStyle(root.querySelector('.header-background'),'::before').backgroundImage!=='none' && getComputedStyle(root.querySelector('.header-background')).maskImage.includes('linear-gradient') && getComputedStyle(root.querySelector('.header-background'),'::after').maskImage==='none');
    check('native theme palette '+design+' '+dark,getComputedStyle(content).getPropertyValue('--tone').trim()===(dark?'#f2c451':'#896400'));
   }
  }
  qa.editor._form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{background:'lanes'}}}));

  check('editor exposes image scale and omits the old vehicle name',names.includes('image_scale') && !names.includes('vehicle_name'));
  qa.editor._form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{image_scale:125,vehicle_name:'obsolete'}}}));
  check('editor saves the image size and strips the obsolete name',qa.config.image_scale===125 && !Object.hasOwn(qa.config,'vehicle_name') && root.querySelector('.content').style.getPropertyValue('--evcc-image-scale')==='1.25');
  for(const width of [260,280,320,420,700]){
   document.querySelector('#host').style.width=width+'px';let previous=0,stageHeight,sceneHeight,pictureHeight;
   for(const scale of [50,100,150,200,300]){
    card.setConfig({...qa.config,image_scale:scale});
    const picture=root.querySelector('.picture').getBoundingClientRect(),image=root.querySelector('.picture img').getBoundingClientRect(),track=root.querySelector('.battery-track').getBoundingClientRect(),meta=root.querySelector('.battery-meta').getBoundingClientRect(),body=root.querySelector('.content');
    const stage=root.querySelector('.car-stage').getBoundingClientRect(),scene=root.querySelector('.header-scene').getBoundingClientRect();
    stageHeight??=stage.height;sceneHeight??=scene.height;pictureHeight??=picture.height;
    const percentage=root.querySelector('.battery-value').getBoundingClientRect();
    check('header omits title and keeps SOC inside the stage at '+width+'px '+scale+'%',!root.querySelector('header h2') && percentage.left>=stage.left && percentage.right<=stage.right);
    check('centered image zoom keeps a fixed header and stays above the battery track at '+width+'px '+scale+'%',image.height>previous && stage.height===stageHeight && scene.height===sceneHeight && picture.height===pictureHeight && Math.abs(image.left+image.width/2-(stage.left+stage.width/2))<1 && image.bottom<=picture.bottom+.5 && picture.bottom<=track.top-7 && getComputedStyle(root.querySelector('.picture')).overflow==='hidden' && body.scrollWidth<=body.clientWidth+1);
    if(scale>=200)check('large car can overlap in front of percentage at '+width+'px '+scale+'%',image.top<meta.bottom && picture.top<=meta.top && Number(getComputedStyle(root.querySelector('.picture')).zIndex)>Number(getComputedStyle(root.querySelector('.battery-row')).zIndex) && getComputedStyle(root.querySelector('.picture')).pointerEvents==='none');
    previous=image.height;
   }
  }
  card.setConfig({...qa.config,image_scale:100});
  check('editor exposes a vertical position slider',schema.find(f=>f.name==='image_offset_y').selector.number.mode==='slider');
  for(const width of [260,420])for(const scale of [100,300]){
   document.querySelector('#host').style.width=width+'px';
   let sceneHeight,previousTop;
   for(const offset of [-150,0,150]){
    qa.editor._form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{image_offset_y:offset,image_scale:scale}}}));
    const image=root.querySelector('.picture img').getBoundingClientRect(),viewport=root.querySelector('.picture').getBoundingClientRect(),scene=root.querySelector('.header-scene').getBoundingClientRect(),track=root.querySelector('.battery-track').getBoundingClientRect();
    sceneHeight??=scene.height;
    check('vertical position persists without resizing or horizontal shift '+width+' '+scale+' '+offset,qa.config.image_offset_y===offset && scene.height===sceneHeight && Math.abs(image.left+image.width/2-(viewport.left+viewport.width/2))<1 && (previousTop===undefined || Math.abs(image.top-previousTop-150)<1) && Math.min(image.bottom,viewport.bottom)<=track.top-7);
    previousTop=image.top;
   }
  }
  qa.editor._form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{image_offset_y:0,image_scale:100}}}));
  check('charging without explicit plan status uses neutral wording',root.querySelector('.charging-status .ui-metric-value').textContent==='Laden');
  qa.update('binary_sensor.evcc_driveway_plan_active',{state:'on'});
  check('active charging plan is detected from the selected loadpoint',card._entities.plan_active==='binary_sensor.evcc_driveway_plan_active' && root.querySelector('.charging-status .ui-metric-value').textContent==='Laden' && root.querySelector('.charging-status .ui-metric-info').textContent==='Volgens laadplanning' && root.querySelector('.content').dataset.tone==='planned' && root.querySelector('.content').dataset.view==='charging');
  qa.update('binary_sensor.evcc_driveway_plan_active',{state:'unavailable'});
  check('unavailable plan status restores neutral wording',root.querySelector('.charging-status .ui-metric-value').textContent==='Laden');
  qa.update('binary_sensor.evcc_driveway_plan_active',{state:'off'});
  for(const width of [280,360,420])for(const dark of [false,true]){
   document.body.classList.toggle('dark',dark);document.querySelector('#host').style.width=width+'px';
   const tiles=[...root.querySelectorAll('.charging-readings>[data-ui-metric]')],boxes=tiles.map(t=>t.getBoundingClientRect());
   const gaps=tiles.map(t=>t.querySelector('.ui-metric-info').getBoundingClientRect().top-t.querySelector('.ui-metric-value').getBoundingClientRect().bottom);
   check('uniform live tiles '+width+' '+dark,Math.abs((boxes[1].left-boxes[0].right)-(boxes[0].top-root.querySelector('.charging-status').getBoundingClientRect().bottom))<1 && Math.abs(boxes[0].height-boxes[1].height)<1 && Math.abs(gaps[0]-gaps[1])<1 && tiles.every(t=>getComputedStyle(t).padding==='12px') && getComputedStyle(root.querySelector('.charging-status')).backgroundColor===getComputedStyle(tiles[0]).backgroundColor);
  }
  for(const connected of ['off','on']){
   qa.update('binary_sensor.evcc_driveway_charging',{state:'off'});
   qa.update('binary_sensor.evcc_driveway_connected',{state:connected});
   const status=root.querySelector('.charging-status'),symbol=root.querySelector('.charging-status .ui-metric-icon');
   check('static status symbol '+connected,getComputedStyle(status).padding==='12px' && symbol.querySelector('svg') && symbol.getAnimations({subtree:true}).length===0);
  }
  qa.update('binary_sensor.evcc_driveway_charging',{state:'on'});
  const scenarios=[
   ['charging','on','on','smart','62','off','Laden'],
   ['planned','on','on','smart','62','on','Laden'],
   ['waiting','on','off','smart','62','off','Wachten op laden'],
   ['off','on','off','off','62','off','Laden uitgeschakeld'],
   ['done','on','off','smart','80','off','Laaddoel bereikt'],
   ['disconnected','off','off','smart','62','off','Niet aangesloten'],
   ['unknown','unavailable','unavailable','smart','62','off','Status onbekend'],
  ];
  for(const background of ['lanes','halo','ribbon','prism-glass','eclipse']){
   card.setConfig({...qa.config,background});
   for(const [tone,connected,charging,mode,soc,plan,title] of scenarios){
    for(const [id,state] of Object.entries({'binary_sensor.evcc_driveway_connected':connected,'binary_sensor.evcc_driveway_charging':charging,'select.evcc_driveway_mode':mode,'sensor.evcc_driveway_vehicle_soc':soc,'binary_sensor.evcc_driveway_plan_active':plan}))qa.update(id,{state});
    const content=root.querySelector('.content'),scene=root.querySelector('.header-scene');
    check('native status '+background+' '+tone,content.dataset.tone===tone && root.querySelector('.charging-status .ui-metric-value').textContent===title && !root.querySelector('header h2') && getComputedStyle(root.querySelector('.charging-status .ui-metric-icon')).color!=='rgba(0, 0, 0, 0)' && getComputedStyle(root.querySelector('.header-background'),'::before').backgroundImage!=='none');
   }
  }
  return checks;
 })()`);
 assert.deepEqual(exceptions,[],'no uncaught Gallery exceptions');
 console.log('PASS: '+galleryChecks.length+' dashboard Gallery checks without screenshots.\n'+galleryChecks.join('\n'));
 await evaluate(`(async () => {
  await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='../../dist/eleven-car-card-test.js';script.onload=resolve;script.onerror=reject;document.head.append(script)});
  const card=document.createElement('eleven-car-card-test');document.body.append(card);
  card.setConfig({...evccQA.config,type:'custom:eleven-car-card-test'});card.hass=evccQA.hass;
  await new Promise(resolve=>setTimeout(resolve,0));
  if(!card.shadowRoot.querySelector('.gallery-top') || !card.shadowRoot.querySelector('[data-mode=pv]'))throw Error('separate test card did not render');
  const editor=await card.constructor.getConfigElement();
  if(editor.tagName!=='ELEVEN-CAR-EDITOR-TEST' || card.constructor===evccQA.card.constructor)throw Error('test and regular card/editor names overlap');
  card.remove();
 })()`);
 assert.deepEqual(exceptions,[],'no separate-test-bundle exceptions');
 console.log('PASS: separate test card and editor coexist with the regular card');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 assert.equal(await evaluate(`evccQA.card.shadowRoot.getAnimations().length`),0,'reduced-motion preference disables all Gallery animations');
 console.log('PASS: reduced-motion preference disables all Gallery animations');
 await send('Browser.close').catch(() => {});
} finally {
 clearTimeout(watchdog); socket?.close(); browser.kill(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
}
