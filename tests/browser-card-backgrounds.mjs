// Optional rendered checks using Chrome DevTools, without screenshots,
// recordings, external services, or production Home Assistant data.
// Run with Node.js 22+; CHROME_PATH can select a Chrome executable.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdtemp, access} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import {resolve, extname, sep} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url)).replace(/[\\/]$/, '');
const chrome = process.env.CHROME_PATH ?? (process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':'/usr/bin/chromium');
await access(chrome);
const profile = await mkdtemp(resolve(process.env.TMPDIR ?? tmpdir(), 'eleven-background-browser-'));
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

 await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/review/index.html`});
 for(let i=0;i<100;i++){if(await evaluate('!!window.themeFixtureReady'))break;await delay(60);}
 assert.equal(await evaluate('records.length'),18);
 const mounted=()=>evaluate('records.every(r=>r.card.shadowRoot.querySelectorAll("[data-ui-card-background]").length===1&&r.card.shadowRoot.querySelectorAll("style[data-ui-background-styles]").length===1)');
 assert.ok(await mounted(),'All 18 examples use one production background');
 for(const width of [360,1440])for(const dark of [false,true]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width===360});
  if(await evaluate('reviewDark')!==dark)await evaluate('document.querySelector("#mode").click()');await delay(100);
  assert.ok(await mounted());assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'No horizontal page overflow');
  assert.ok(await evaluate('records.every(r=>{const h=r.card.shadowRoot.querySelector("ha-card"),b=h.querySelector("[data-ui-card-background]"),s=getComputedStyle(b);return s.borderRadius===getComputedStyle(h).borderRadius&&s.clipPath!=="none"&&s.maskImage.includes("100%")&&Math.abs(b.getBoundingClientRect().height-Math.min(240,h.clientHeight))<1;})'),'Theme corners and fading height match every card');
 }
 await evaluate('window.originalBackgrounds=records.map(r=>({...r.card._elevenBackgroundConfig.card_background}))');
 for(const height of [60,180,2000]){
  await evaluate(`records.forEach(r=>r.card.setCardBackground({variant:'hologram',coverage:'header',height:${height},transparency:0}))`);
  assert.ok(await evaluate(`records.every(r=>{const h=r.card.shadowRoot.querySelector('ha-card'),b=h.querySelector('[data-ui-card-background]');return Math.abs(b.getBoundingClientRect().height-Math.min(${height},h.clientHeight))<1&&getComputedStyle(b.querySelector('i:nth-child(2)')).opacity==='0.25';})`));
 }
 await evaluate('records.forEach(r=>r.card.setCardBackground({variant:"aurora",coverage:"card",colorMode:"custom",colors:["#123456","#abcdef"],transparency:100,animated:false}))');
 assert.ok(await evaluate('records.every(r=>{const h=r.card.shadowRoot.querySelector("ha-card"),b=h.querySelector("[data-ui-card-background]");return getComputedStyle(b).maskImage==="none"&&getComputedStyle(b).opacity==="0"&&b.style.getPropertyValue("--ui-bg-1")==="#123456"&&b.getAnimations({subtree:true}).length===0&&Math.abs(b.getBoundingClientRect().height-h.clientHeight)<1;})'));
 await evaluate('records.forEach(r=>r.card.setCardBackground(false))');assert.ok(await evaluate('records.every(r=>!r.card.shadowRoot.querySelector("[data-ui-card-background]"))'));
 await evaluate('records.forEach((r,i)=>r.card.setCardBackground(originalBackgrounds[i]))');assert.ok(await mounted());
 await evaluate('records.forEach(r=>r.card.hass={...r.hass,connected:false})');await delay(80);assert.ok(await evaluate('records.every(r=>r.card.shadowRoot.querySelector("[data-ui-card-background]").dataset.animated==="false")'),'Offline cards stop background movement');
 await evaluate('records.forEach(r=>r.card.hass=r.hass)');await delay(80);
 // Existing actions and focus nodes survive an isolated background change.
 assert.ok(await evaluate('records.every(r=>{const b=r.card.shadowRoot.querySelector("button");r.card.setCardBackground({...r.card._elevenBackgroundConfig.card_background,transparency:70});return !b||b===r.card.shadowRoot.querySelector("button");})'));
 await evaluate('window.qaHistory=records.find(r=>r.name==="history-graph-card").card;qaHistory.scrollIntoView()');await delay(100);await evaluate('qaHistory.shadowRoot.querySelector("[data-period=menu]").click()');await delay(80);
 assert.ok(await evaluate('(()=>{const p=qaHistory.shadowRoot.querySelector(".period-menu");return p.matches(":popover-open")||p.hasAttribute("data-fallback-open");})()'));
 await evaluate('qaHistory.setCardBackground({variant:"ribbon",coverage:"header",height:180})');
 assert.ok(await evaluate('(()=>{const p=qaHistory.shadowRoot.querySelector(".period-menu");return p.matches(":popover-open")||p.hasAttribute("data-fallback-open");})()'),'Native period popup remains open');
 // Dynamic colour belongs to Weather, including a patched state update.
 await evaluate('window.qaWeather=records.find(r=>r.name==="weather-card").card;qaWeather.setCardBackground({variant:"aurora",colorMode:"dynamic"})');
 const before=await evaluate('qaWeather.shadowRoot.querySelector("[data-ui-card-background]").style.getPropertyValue("--ui-bg-1")');
 await evaluate('qaWeather.hass={...qaWeather._hass,states:{...qaWeather._hass.states,"weather.home":{...qaWeather._hass.states["weather.home"],state:"rainy"}}}');await delay(100);
 const after=await evaluate('qaWeather.shadowRoot.querySelector("[data-ui-card-background]").style.getPropertyValue("--ui-bg-1")');assert.notEqual(before,after,'Weather owns its dynamic colour mapping');assert.match(after,/^#[0-9a-f]{6}$/i);
 // Native DOM replacement and appearance changes must retain decorative nodes and phase.
 const continuity=await evaluate(`(async()=>{const results=[];for(const r of records){const card=r.card;card.setCardBackground({variant:'isobars',coverage:'header',height:240});const layer=card.shadowRoot.querySelector('[data-ui-card-background]');for(const animation of layer.getAnimations({subtree:true}))animation.currentTime=5200;const base=card.constructor.backgroundBaseCard.prototype;card[typeof base._render==='function'?'_render':'render']();await Promise.resolve();const sameNode=card.shadowRoot.querySelector('[data-ui-card-background]')===layer;let animations=layer.getAnimations({subtree:true});const rendered=animations.length>0&&animations.every(animation=>animation.currentTime>=5199);card.hass={...(card._hass??r.hass)};await Promise.resolve();animations=layer.getAnimations({subtree:true});const sensor=layer.isConnected&&animations.length>0&&animations.every(animation=>animation.currentTime>=5199);card.setCardBackground({variant:'isobars',coverage:'header',height:180,transparency:70,colorMode:'custom',colors:['#123456']});const appearance=card.shadowRoot.querySelector('[data-ui-card-background]')===layer&&layer.getAnimations({subtree:true}).every(animation=>animation.currentTime>=5199);results.push({name:r.name,sameNode,rendered,sensor,appearance});}return results;})()`);
 assert.ok(continuity.every(result=>result.sameNode&&result.rendered&&result.sensor&&result.appearance),JSON.stringify(continuity));
 await evaluate('window.qaRoom=records.find(r=>r.name==="room-card").card;qaRoom.scrollIntoView()');await delay(100);
 assert.ok(await evaluate('(async()=>{const layer=qaRoom.shadowRoot.querySelector("[data-ui-card-background]");for(const animation of layer.getAnimations({subtree:true}))animation.currentTime=7200;qaRoom.shadowRoot.querySelector("[data-scene]").click();await new Promise(resolve=>setTimeout(resolve,70));return qaRoom.shadowRoot.querySelector("[data-ui-card-background]")===layer&&layer.getAnimations({subtree:true}).every(animation=>animation.currentTime>=7199);})()'),'Scene activation keeps background phase through pending and completed renders');
 assert.ok(await evaluate('(async()=>{const layer=qaRoom.shadowRoot.querySelector("[data-ui-card-background]");layer.setAttribute("data-motion-paused","");await new Promise(resolve=>requestAnimationFrame(resolve));for(const animation of layer.getAnimations({subtree:true}))animation.currentTime=6100;qaRoom._render();await new Promise(resolve=>setTimeout(resolve,40));const paused=layer.getAnimations({subtree:true}).every(animation=>animation.playState==="paused"&&Math.abs(animation.currentTime-6100)<1);layer.removeAttribute("data-motion-paused");return paused;})()'),'Paused backgrounds retain their phase without advancing during a native render');
 await evaluate('records.forEach((r,i)=>r.card.setCardBackground(originalBackgrounds[i]))');
 // A minimal ha-form boundary exercises editor composition without Home Assistant.
 await evaluate('if(!customElements.get("ha-form"))customElements.define("ha-form",class extends HTMLElement{})');
 const editors=await evaluate(`(async()=>{const results=[];for(const r of records){const editor=await r.card.constructor.getConfigElement();document.body.append(editor);editor.hass=r.hass;editor.setConfig(r.card._elevenBackgroundConfig);const q=s=>editor.shadowRoot.querySelector(s);let emitted;editor.addEventListener('config-changed',event=>emitted=event.detail.config);const select=q('[data-bg=variant]');select.value='ink-bloom';select.dispatchEvent(new Event('change',{bubbles:true}));const changed=emitted?.card_background?.variant==='ink-bloom'&&emitted.type===r.card._elevenBackgroundConfig.type;const source=q('[data-bg=colorMode]');source.value='custom';source.dispatchEvent(new Event('change',{bubbles:true}));const palette=JSON.stringify(emitted.card_background.colors)===JSON.stringify([...editor.shadowRoot.querySelectorAll('input[type=color]')].map(input=>input.value));const height=q('[data-bg=height]');height.value='9999';height.dispatchEvent(new Event('change',{bubbles:true}));const clamped=emitted.card_background.height===2000&&height.value==='2000';editor._nativeEditor?.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{title:'Changed title'}},bubbles:true,composed:true}));const retained=emitted?.card_background?.variant==='ink-bloom';const fields=s=>(s??[]).flatMap(f=>[f,...fields(f.schema)]);const forms=editor._nativeEditor?.shadowRoot?.querySelectorAll('ha-form')??[];const noDuplicateFields=[...forms].every(form=>!fields(form.schema).some(f=>['background','background_strength','animate_background'].includes(f.name)));editor.hass={...r.hass,language:'en',locale:{language:'en'}};const english=q('summary').textContent==='Card background';results.push({name:r.name,changed,palette,clamped,retained,noDuplicateFields,english,native:!!editor._nativeEditor});editor.remove();}return results;})()`);
 assert.ok(editors.every(r=>r.changed&&r.palette&&r.clamped&&r.retained&&r.noDuplicateFields&&r.english&&r.native),JSON.stringify(editors));
 // House is not in this overview's fixture, but both supported aliases share the component.
 assert.ok(await evaluate('(()=>{for(const tag of ["eleven-house-card","eleven-house-styled-card"]){const card=document.createElement(tag);card.setCardBackground({variant:"aurora"});if(card.shadowRoot.querySelectorAll("[data-ui-card-background]").length!==1)return false;}return true;})()'));
 await evaluate('window.qaCar=records.find(r=>r.name==="car-card").card;qaCar.remove();document.body.append(qaCar)');await delay(100);assert.ok(await evaluate('!!qaCar._elevenBackgroundMotion'),'Motion resumes after reconnect');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});assert.ok(await evaluate('records.every(r=>{const b=r.card.shadowRoot.querySelector("[data-ui-card-background]");return b.getAnimations({subtree:true}).length===0;})'));
 const mutationCount=await evaluate('(async()=>{let count=0;const o=new MutationObserver(()=>count++);for(const r of records)o.observe(r.card.shadowRoot,{childList:true,subtree:true});await new Promise(resolve=>setTimeout(resolve,350));o.disconnect();return count;})()');assert.ok(mutationCount<100,'No observer feedback loop: '+mutationCount);
 assert.deepEqual(exceptions,[]);console.log('PASS: 18 production examples plus House aliases; light/dark/mobile, clipped fading backgrounds, custom/dynamic colours, native popups and nodes, all native editors with shared settings, uninterrupted background phase through native renders/actions/colour changes, reconnect, reduced motion, no feedback loop. No screenshots.');
 await send('Browser.close').catch(()=>{});
}finally{clearTimeout(watchdog);socket?.close();browser.kill();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
