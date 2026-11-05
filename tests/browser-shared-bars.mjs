// Optional rendered checks using Chrome DevTools, without screenshots,
// recordings, external services, or production Home Assistant data.
// Run with Node.js 22+; CHROME_PATH can select a Chrome executable.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdtemp, access, mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve, extname, sep} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url)).replace(/[\\/]$/, '');
const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
await access(chrome);
const profileRoot=process.env.TMPDIR??resolve(root,'.cache');
await mkdir(profileRoot,{recursive:true});
const profile = await mkdtemp(resolve(profileRoot,'shared-bar-browser-'));
const mime = {'.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.css': 'text/css'};
const server = createServer(async (request, response) => {
 const path = resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
 if (!path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
 try { response.setHeader('content-type', mime[extname(path)] ?? 'text/plain'); response.end(await readFile(path)); }
 catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = spawn(chrome, ['--headless=new', ...(process.platform==='linux'?['--no-sandbox']:[]), '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', 'about:blank'], {windowsHide: true, stdio: 'ignore'});
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

 await send('Emulation.setDeviceMetricsOverride',{width:1400,height:1200,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/review/index.html`});
 for(let i=0;i<100;i++){if(await evaluate('!!window.themeFixtureReady'))break;await delay(100);}
 await delay(200);
 const checks=[],check=(name,condition)=>{assert.ok(condition,name);checks.push(name);};
 const initial=await evaluate(`(async()=>{
  window.barQA={car:records.find(r=>r.name==='car-card'),ev:records.find(r=>r.name==='car-evcc'),controls:records.find(r=>r.name==='controls-card'),energy:records.find(r=>r.name==='energy-flow-card')};
  barQA.q=(name,s)=>barQA[name].card.shadowRoot.querySelector(s);
  barQA.update=(changes,connected=true)=>{const r=barQA.ev;r.hass={...r.hass,connected,states:{...r.hass.states}};for(const [id,state] of Object.entries(changes))r.hass.states[id]={...r.hass.states[id],state:String(state)};r.card.hass=r.hass;};
  const energy=barQA.energy.card;energy.setConfig({...energy._config,detail_view:'tabs',default_tab:'sun'});await new Promise(r=>setTimeout(r,80));
  barQA.ev.card.scrollIntoView({block:'center'});await new Promise(r=>setTimeout(r,80));
  const b=barQA.q('ev','[data-ui-bar]'),f=b.querySelector('.ui-bar-fill'),m=b.querySelector('.ui-bar-motion');
  return {car:!!barQA.q('car','[data-ui-bar]'),height:getComputedStyle(b).height,fill:f.getBoundingClientRect().width/b.getBoundingClientRect().width,animation:m&&getComputedStyle(m).animationName,duration:m&&getComputedStyle(m).animationDuration,band:m&&m.getBoundingClientRect().width/f.getBoundingClientRect().width,solar:!!barQA.q('ev','[data-solar-share][data-ui-slider]'),light:!!barQA.q('controls','[data-level][data-ui-slider]'),energy:[...energy.shadowRoot.querySelectorAll('.ui-detail-surface-track')].every(n=>n.hasAttribute('data-ui-bar'))&&energy.shadowRoot.querySelectorAll('.ui-detail-surface-track').length>0};
 })()`);
 check('Car, EVCC, energy details and controls use the shared component',initial.car&&initial.solar&&initial.light&&initial.energy);
 check('Default recessed track is 12px',initial.height==='12px');
 check('Measured battery fill remains 62%',Math.abs(initial.fill-.62)<.005);
 check('Broad soft charging animation C is live',initial.animation==='ui-bar-charge'&&initial.duration==='3.8s'&&Math.abs(initial.band-.65)<.005);
 check('Target marker remains at 80%',await evaluate(`barQA.q('ev','.ui-bar-marker').style.left==='80%'`));
 check('Read-only percentages do not animate',await evaluate(`!barQA.q('car','.ui-bar-motion')&&!barQA.q('energy','.ui-bar-motion')`));
 check('Telemetry preserves animation phase',await evaluate(`(()=>{const before=barQA.q('ev','.ui-bar-motion').getAnimations()[0].effect.getComputedTiming().progress;barQA.update({'sensor.review_evcc_energy':12.5});const after=barQA.q('ev','.ui-bar-motion').getAnimations()[0].effect.getComputedTiming().progress;return Math.min(Math.abs(before-after),1-Math.abs(before-after))<.12;})()`));
 for(const [name,changes,connected] of [['zero power',{'sensor.review_evcc_power':0},true],['paused',{'sensor.review_evcc_power':0,'binary_sensor.review_evcc_charging':'off'},true],['offline',{'sensor.review_evcc_power':7100,'binary_sensor.review_evcc_charging':'on'},false],['at target',{'sensor.soc':80},true],['battery full',{'sensor.soc':100},true]]){
  await evaluate(`barQA.update(${JSON.stringify(changes)},${connected})`);
  check('No charging animation when '+name,await evaluate(`!barQA.q('ev','.ui-bar-motion')`));
 }
 await evaluate(`barQA.update({'sensor.soc':62,'sensor.review_evcc_power':7100,'binary_sensor.review_evcc_charging':'on'})`);
 check('Charging resumes below target',await evaluate(`!!barQA.q('ev','.ui-bar-motion')`));
 check('Solar slider previews without a command, then sends one request',await evaluate(`(async()=>{const r=barQA.ev,before=demoServices.length,s=barQA.q('ev','[data-solar-share]');s.value='70';s.dispatchEvent(new Event('input',{bubbles:true}));const preview=s.style.getPropertyValue('--ui-bar-position')==='70%'&&demoServices.length===before&&barQA.q('ev','[data-solar-output]').textContent.includes('70');s.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,0));const last=demoServices.at(-1);const sent=demoServices.length===before+1&&last[0]==='number'&&last[1]==='set_value'&&last[2].value===70&&barQA.q('ev','[data-solar-share]').disabled;barQA.update({'number.review_evcc_solar':70});return preview&&sent&&!barQA.q('ev','[data-solar-share]').disabled;})()`));
 check('Brightness slider previews and retains exact device command',await evaluate(`(async()=>{const s=barQA.q('controls','[data-level]'),before=demoServices.length;s.value='37';s.dispatchEvent(new Event('input',{bubbles:true}));const preview=s.style.getPropertyValue('--ui-bar-position')==='37%'&&s.nextElementSibling.value==='37%'&&demoServices.length===before;s.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,0));const last=demoServices.at(-1);return preview&&demoServices.length===before+1&&last[0]==='light'&&last[1]==='turn_on'&&last[2].brightness_pct===37;})()`));
 for(const width of [300,440]){
  await evaluate(`(()=>{for(const r of [barQA.car,barQA.ev,barQA.controls,barQA.energy]){r.card.style.width='${width}px';r.card.parentElement.style.width='${width}px';}})()`);await delay(80);
  check('Bars and sliders fit at '+width,await evaluate(`[barQA.car,barQA.ev,barQA.controls,barQA.energy].every(r=>{const c=r.card.shadowRoot.querySelector('.content');return c.scrollWidth<=c.clientWidth+1})`));
 }
 await evaluate(`document.querySelector('#mode').click()`);await delay(50);
 check('Inset theme surface and filled colour persist in dark mode',await evaluate(`(()=>{const b=barQA.q('ev','[data-ui-bar]');return getComputedStyle(b).boxShadow!=='none'&&getComputedStyle(b.querySelector('.ui-bar-fill')).backgroundColor!=='rgba(0, 0, 0, 0)';})()`));
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await delay(50);
 check('Reduced motion hides the band without losing value',await evaluate(`(()=>{const m=barQA.q('ev','.ui-bar-motion');return getComputedStyle(m).animationName==='none'&&getComputedStyle(m).display==='none'&&barQA.q('ev','[data-ui-bar]').getAttribute('aria-valuenow')==='62';})()`));
 check('Collection duplicate-load and all 12 editors pass smoke check',await evaluate(`(async()=>{const script=document.createElement('script');script.textContent=await(await fetch('/dist/eleven-cards.js')).text();document.head.append(script);if(!customElements.get('ha-form'))customElements.define('ha-form',class extends HTMLElement{});const names=['dynamic-energy-price-card','history-graph-card','timeline-card','overview-card','bar-chart','heatmap-card','calendar-card','car-card','weather-card','energy-flow-card','shopping-card','house-card'];for(const n of names){const tag='eleven-'+n,C=customElements.get(tag);if(!C||!(document.createElement(tag) instanceof HTMLElement)||!((await C.getConfigElement()) instanceof HTMLElement)||(window.customCards||[]).filter(c=>c.type===tag).length!==1)return false;}return true;})()`));
 assert.deepEqual(exceptions,[],'No browser exceptions');
 console.log('PASS '+checks.length+' production-bar checks without screenshots.\n'+checks.join('\n'));
 await send('Browser.close').catch(()=>{});
}finally{
 clearTimeout(watchdog);socket?.close();browser.kill();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
