import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
// Usage: BASE=http://127.0.0.1:56518/ OUT=/path/to/evidence node tests/browser-controls-style.mjs
const out=process.env.OUT||new URL('../qa-evidence/shared-actions/parent',import.meta.url).pathname;await mkdir(out,{recursive:true});
const base=process.env.BASE||'http://127.0.0.1:56519/';const phase=process.env.PHASE||'rows';
const profile=await mkdtemp(out+'/chrome-');
const chrome=spawn(process.env.CHROME||'/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',['--headless=new','--no-sandbox','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--disable-background-networking','about:blank'],{stdio:'ignore'});
let socket;const result={matrix:[],stress:[],interactions:[],errors:[]};const timer=setTimeout(()=>{chrome.kill();process.exit(2)},600000);
try{
 let port;for(let i=0;i<120;i++){try{port=Number((await readFile(profile+'/DevToolsActivePort','utf8')).split('\n')[0]);break}catch{await delay(100)}}assert.ok(port);
 let tab;for(let i=0;i<120;i++){const tabs=await(await fetch(`http://127.0.0.1:${port}/json`)).json();tab=tabs.find(x=>x.type==='page');if(tab)break;await delay(50)}assert.ok(tab,'Chromium page target ready');socket=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((ok,no)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',no,{once:true})});
 let seq=0;const pending=new Map();socket.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.method==='Runtime.exceptionThrown')result.errors.push(m.params.exceptionDetails);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.no(Error(m.error.message)):p.ok(m.result)}});
 const send=(method,params={})=>new Promise((ok,no)=>{const id=++seq;const t=setTimeout(()=>{pending.delete(id);no(Error('CDP timeout '+method))},30000);pending.set(id,{ok:r=>{clearTimeout(t);ok(r)},no:e=>{clearTimeout(t);no(e)}});socket.send(JSON.stringify({id,method,params}))});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}).catch(e=>{throw Error(e.message+' in '+expression.slice(0,300))});assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value};
 const ready=async expression=>{for(let i=0;i<160;i++){if(await ev(expression))return;await delay(50)}assert.fail('Timed out '+expression)};
 await send('Runtime.enable');await send('Page.enable');
 await send('Page.navigate',{url:base+'tests/fixtures/shared-actions.html'});await ready('window.actionReady===true');
 const shot=async label=>{const s=await send('Page.captureScreenshot',{format:'png'});await writeFile(`${out}/${label}.png`,Buffer.from(s.data,'base64'));};
 const point=async selector=>ev(`(()=>{const b=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
 const mouse=async(type,p)=>send('Input.dispatchMouseEvent',{type,...p,button:'left',clickCount:1});
 for(const width of [320,390,780,1280])for(const material of [false,true])for(const dark of [false,true]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await ev(`setActionTheme(${dark},'${material?'material':'native'}');resetActions();void 0`);await delay(30);
  const m=await ev(`(()=>{const p=e=>{const s=getComputedStyle(e),b=e.getBoundingClientRect();return {id:e.id,w:b.width,h:b.height,font:s.fontSize,color:s.color,shadow:s.boxShadow,bg:s.backgroundImage,transform:s.transform,radius:s.borderRadius}};return {overflow:document.documentElement.scrollWidth>innerWidth,buttons:[...document.querySelectorAll('#actions button')].map(p)}})()`);
  assert.equal(m.overflow,false);for(const b of m.buttons.filter(b=>b.id!=='legacy'))assert.ok(b.w>=44&&b.h>=44,JSON.stringify(b));assert.equal(m.buttons.find(b=>b.id==='legacy').h,32);assert.equal(m.buttons.find(b=>b.id==='icon').w,44);
  const normal=m.buttons.find(b=>b.id==='device-on'),choice=m.buttons.find(b=>b.id==='choice');assert.equal(normal.transform,'none','device status is not selection');assert.ok(choice.transform.includes('1)'),'true choice stays pressed');if(material){assert.ok(normal.shadow.includes('0px 2px 3px'));assert.ok(choice.shadow.includes('inset'));}else assert.equal(normal.shadow,'none');
  await ev(`document.querySelector('#device-on').focus()`);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert.equal(await ev('document.activeElement.id'),'icon');assert.equal(await ev(`getComputedStyle(document.activeElement).outlineColor`),await ev(`(()=>{const e=document.createElement('span');e.style.color='var(--eleven-material-focus-color,color-mix(in srgb,var(--accent-color,var(--primary-color)) 60%,var(--primary-text-color)))';document.body.append(e);const color=getComputedStyle(e).color;e.remove();return color})()`));
  const contrast=await ev('actionContrast()');assert.ok(contrast.choice>=4.5,JSON.stringify({material,dark,contrast}));assert.ok(contrast.danger>=4.5,JSON.stringify({material,dark,contrast}));assert.ok(contrast.focus>=3,JSON.stringify({material,dark,contrast}));
  const p=await point('#device-on');await mouse('mouseMoved',p);await mouse('mousePressed',p);const pressed=await ev(`getComputedStyle(document.querySelector('#device-on')).transform`);await mouse('mouseReleased',p);assert.notEqual(pressed,'none');
  const disabled=await point('#disabled');await mouse('mouseMoved',disabled);const count=await ev('uiCalls.length');await mouse('mousePressed',disabled);await mouse('mouseReleased',disabled);assert.equal(await ev('uiCalls.length'),count,'disabled cannot dispatch');
  result.matrix.push({width,material,dark,measure:m,contrast});if(width===390&&material)await shot(`actions-390-${dark?'dark':'light'}`);
  await ev(`for(const e of document.querySelectorAll('#actions [data-ui-button^="action"]')){e.style.fontSize='26px';if(e.id==='device-on')e.textContent='Verlichting naast de grote eettafel';}`);assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false);result.stress.push({width,material,dark,text200:true});
 }
 await ev('resetActions()');
 for(const name of ['history-graph-card','bar-chart','timeline-card','calendar-card','weather-card','overview-card','heatmap-card'])for(const material of [false,true])for(const dark of [false,true]){
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:1200,deviceScaleFactor:1,mobile:false});await ev(`setActionTheme(${dark},'${material?'material':'native'}')`);assert.equal(await ev(`showRetry(${JSON.stringify(name)})`),true,'real error retry exists: '+name);
  const b=await ev(`(()=>{const e=retryCard.shadowRoot.querySelector('.retry,[data-retry]'),b=e.getBoundingClientRect(),s=getComputedStyle(e);return {marker:e.dataset.uiButton,type:e.type,w:b.width,h:b.height,color:s.color,shadow:s.boxShadow}})()`);assert.equal(b.marker,'action');assert.equal(b.type,'button');assert.ok(b.w>=44&&b.h>=44,name+JSON.stringify(b));if(material)assert.ok(b.shadow.includes('0px 2px 3px'),name);else assert.equal(b.shadow,'none',name);
  await ev(`retryCard.shadowRoot.querySelector('.retry,[data-retry]').focus()`);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});assert.equal(await ev('retryCount'),1,'native keyboard invokes existing retry handler '+name+' '+JSON.stringify(await ev(`({active:retryCard.shadowRoot.activeElement?.outerHTML,documentActive:document.activeElement.localName,status:retryCard._status,html:retryCard.shadowRoot.querySelector('.retry,[data-retry]')?.outerHTML})`)));result.interactions.push({name,material,dark,retry:true,measure:b});
  if(material&&!dark&&name==='weather-card')await shot('weather-retry');
 }
 await ev(`document.querySelector('#retry-slot').replaceChildren();resetActions();`);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});assert.equal(await ev(`getComputedStyle(document.querySelector('#device-on')).transitionDuration`),'0s');
 await send('Emulation.setEmulatedMedia',{features:[{name:'forced-colors',value:'active'}]});assert.equal(await ev(`matchMedia('(forced-colors: active)').matches`),true);assert.equal(await ev(`getComputedStyle(document.querySelector('#device-on')).borderTopWidth`),'1px');assert.equal(await ev(`getComputedStyle(document.querySelector('#device-on')).boxShadow`),'none');
 result.media={reducedMotion:true,forcedColors:true};
 assert.deepEqual(result.errors,[]);console.log(JSON.stringify({matrix:result.matrix.length,stress:result.stress.length,retries:result.interactions.length,media:result.media,errors:result.errors}));
}catch(e){result.failure=String(e);throw e}finally{await writeFile(`${out}/${phase}-browser.json`,JSON.stringify(result,null,2));clearTimeout(timer);socket?.close();chrome.kill()}
