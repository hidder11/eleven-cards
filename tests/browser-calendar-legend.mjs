// Rendered regression checks with synthetic data. No screenshots or HA calls.
// Run with Node.js 22+; CHROME_PATH optionally selects Chrome.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdtemp, mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';

const root=fileURLToPath(new URL('../',import.meta.url));
await mkdir(resolve(root,'.cache'),{recursive:true});
const profile=await mkdtemp(resolve(root,'.cache/calendar-layout-'));
const mime={'.html':'text/html','.js':'text/javascript','.png':'image/png'};
const server=createServer(async(req,res)=>{
 const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!path.startsWith(resolve(root)+sep)){res.writeHead(403).end();return;}
 try{res.setHeader('content-type',mime[extname(path)]??'text/plain');res.end(await readFile(path));}
 catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=spawn(process.env.CHROME_PATH??'C:/Program Files/Google/Chrome/Application/chrome.exe',[
 '--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,
 '--no-first-run','--no-default-browser-check','--disable-background-networking','about:blank'
],{windowsHide:true,stdio:'ignore'});
const watchdog=setTimeout(()=>{browser.kill();server.closeAllConnections();process.exit(1);},120000);
let socket;
try{
 let port;
 for(let i=0;i<100;i++){try{port=Number((await readFile(resolve(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{await delay(100);}}
 assert.ok(port,'Chrome debugging port');
 const pages=await(await fetch(`http://127.0.0.1:${port}/json`)).json();
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((done,fail)=>{socket.addEventListener('open',done,{once:true});socket.addEventListener('error',fail,{once:true});});
 let sequence=0;const pending=new Map(),errors=[];
 socket.addEventListener('message',event=>{
  const data=JSON.parse(event.data);
  if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails);
  if(data.id){const handler=pending.get(data.id);pending.delete(data.id);data.error?handler.reject(Error(data.error.message)):handler.resolve(data.result);}
 });
 const send=(method,params={})=>new Promise((done,fail)=>{
  const id=++sequence,timer=setTimeout(()=>{pending.delete(id);fail(Error('CDP timeout: '+method));},15000);
  pending.set(id,{resolve:value=>{clearTimeout(timer);done(value);},reject:error=>{clearTimeout(timer);fail(error);}});
  socket.send(JSON.stringify({id,method,params}));
 });
 const evaluate=async expression=>{
  const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  assert.ok(!result.exceptionDetails,JSON.stringify(result.exceptionDetails));return result.result.value;
 };
 const ready=async expression=>{
  for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(50);}
  assert.fail('Timed out: '+expression);
 }; const key=async key=>{
  const keyCode={Escape:27,Enter:13,ArrowRight:39,ArrowLeft:37,Home:36,End:35}[key];
  await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:keyCode,...(key==='Enter'?{text:'\r'}:{})});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:keyCode});
 };
 await send('Runtime.enable');await send('Page.enable');
 await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/review/index.html`});
 await ready('window.themeFixtureReady===true');
 await evaluate(`(()=>{
  const c=records.find(r=>r.name==='calendar-card').card;
  window.testCard=c;
  c.setConfig({...c._config,entities:['Family','Work','School','Waste'].map((name,i)=>({entity:'calendar.test'+i,name}))});
  c.style.cssText='width:489px;height:600px';
  document.body.replaceChildren(c);
 })()`);
 for(const compact of [false,true]){
  for(const width of [489,320,180]){
   await evaluate(`testCard.setConfig({...testCard._config,compact:${compact}});testCard.style.width='${width}px'`);
   const layout=await evaluate(`(()=>{const r=testCard.shadowRoot,legend=r.querySelector('.legend'),items=[...legend.children];return {rows:items.map(e=>Math.round(e.getBoundingClientRect().top)),overflow:legend.scrollWidth>legend.clientWidth+1,targets:items.every(e=>e.getBoundingClientRect().height>=44),count:items.length}})()`);
   assert.equal(layout.count,4);assert.equal(layout.overflow,false);assert.equal(layout.targets,true);
   if(width===489)assert.equal(new Set(layout.rows).size,1,'Four short labels use the available row');
   if(width===180)assert.ok(new Set(layout.rows).size>1,'Narrow cards wrap');
  }
 }
 await evaluate(`testCard.setConfig({...testCard._config,entities:[{entity:'calendar.test0',name:'A very long calendar name that must wrap on a narrow card'},{entity:'calendar.test1',name:'Work'}]});testCard.style.width='180px'`);
 assert.equal(await evaluate(`(()=>{const e=testCard.shadowRoot.querySelector('.legend');return e.scrollWidth<=e.clientWidth+1})()`),true);
 await evaluate(`testCard.shadowRoot.querySelector('[data-ui-legend]').click()`);
 assert.equal(await evaluate(`testCard.shadowRoot.querySelector('[data-ui-legend]').getAttribute('aria-pressed')`),'false');
 await evaluate(`testCard.shadowRoot.querySelector('[data-ui-legend]').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',shiftKey:true,bubbles:true}))`);
 assert.deepEqual(await evaluate(`[...testCard.shadowRoot.querySelectorAll('[data-ui-legend]')].map(e=>e.getAttribute('aria-pressed'))`),['true','false']);
 console.log('PASS: Calendar legend uses available width, wraps at 180/320px, supports long names, retains 44px targets, toggle and keyboard isolation in both densities; no screenshots.'); assert.deepEqual(errors,[],'No browser exceptions');
 await send('Browser.close').catch(()=>{});
}finally{
 clearTimeout(watchdog);socket?.close();browser.kill();server.closeAllConnections();await new Promise(done=>server.close(done));
}