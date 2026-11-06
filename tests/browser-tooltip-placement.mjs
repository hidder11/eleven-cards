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
  assert.fail('Timed out: '+expression+' '+JSON.stringify(await evaluate('({status:testCard._status,error:testCard._error,series:testCard._series?.length})')));
 }; const key=async key=>{
  const keyCode={Escape:27,Enter:13,ArrowRight:39,ArrowLeft:37,Home:36,End:35}[key];
  await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:keyCode,...(key==='Enter'?{text:'\r'}:{})});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:keyCode});
 };
 await send('Runtime.enable');await send('Page.enable');
 await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/review/index.html`});

 await ready('window.themeFixtureReady===true');
 await evaluate(`(()=>{const a=records.find(r=>r.name==='history-graph-card').card,b=document.createElement('eleven-history-graph-card');window.graphs=[a,b];b.hass=a._hass;for(const c of graphs){c.setConfig({hours_to_show:24,entities:['sensor.qa'],show_legend:false,sync_hover:true,hover_sync_group:'placement'});c.hass={...a._hass,states:{'sensor.qa':{state:'20',attributes:{unit_of_measurement:'\u00b0C'}}},callApi:async(_,url)=>{const start=Date.parse(decodeURIComponent(url.split('?')[0].split('period/')[1])),end=Date.parse(new URLSearchParams(url.split('?')[1]).get('end_time'));return [[{entity_id:'sensor.qa',state:'20',last_changed:new Date(start).toISOString()},{state:'21',last_changed:new Date(end).toISOString()}]]}};c.style.cssText='display:block;width:600px;height:260px;margin:8px';}document.body.replaceChildren(...graphs);window.testCard=a;})()`);
 await ready('graphs.every(c=>c._status==="ready"&&c._series.length===1)');
 await send('Emulation.setDeviceMetricsOverride',{width:900,height:900,deviceScaleFactor:1,mobile:false});await delay(300);
 const point=await evaluate(`(()=>{const r=graphs[0].shadowRoot.querySelector('.chart').getBoundingClientRect();return {x:r.left+r.width*.55,y:r.top+r.height*.4}})()`);
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await delay(100);
 const state=await evaluate(`graphs.map(c=>{const t=c.shadowRoot.querySelector('.tooltip'),r=t.getBoundingClientRect(),b=c.shadowRoot.querySelector('.card-content').getBoundingClientRect();return {hidden:t.hidden,left:r.left,top:r.top,right:r.right,bottom:r.bottom,cardTop:b.top,cardBottom:b.bottom,pointer:c._tooltipPointer}})`);
 assert.ok(state.every(s=>!s.hidden&&s.top>=s.cardTop&&s.bottom<=s.cardBottom+1),JSON.stringify(state));
 assert.ok(Math.abs(state[0].left-point.x)<=7||Math.abs(state[0].right-point.x)<=7,JSON.stringify({point,state}));
 assert.ok(!state[1].pointer,'Synced card never borrows originating pointer');
 for(const fraction of [.01,.99]){
 const p=await evaluate(`(()=>{const r=graphs[0].shadowRoot.querySelector('.chart').getBoundingClientRect();return {x:r.left+r.width*${fraction},y:r.top+r.height*.8}})()`);
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',...p});await delay(60);
 assert.ok(await evaluate(`graphs.every(c=>{const t=c.shadowRoot.querySelector('.tooltip').getBoundingClientRect();return t.left>=0&&t.right<=innerWidth&&t.top>=0&&t.bottom<=innerHeight})`),'Edge tooltips contained');
 }
 await evaluate(`graphs[0].shadowRoot.querySelector('.chart').focus()`);await key('Home');assert.equal(await evaluate('graphs[0]._pinned'),true);await key('Escape');assert.equal(await evaluate(`graphs[0].shadowRoot.querySelector('.tooltip').hidden`),true);
 assert.deepEqual(errors,[]);console.log('PASS: pointer proximity, synchronized own-card placement, both edges, keyboard pin/dismiss');

 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1400,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/cards/timeline-card/qa/issue-29-synced.html`});
 await ready('window.demoCards?.every(c=>c._status==="ready")');await delay(250);
 for(const source of [0,1,2]){
 const pointer=await evaluate(`(()=>{demoCards.forEach(c=>c._hideTooltip());const c=demoCards[${source}],r=c.shadowRoot.querySelector(${source===0?JSON.stringify('.timeline-group .track'):JSON.stringify('.plot')}).getBoundingClientRect();return {x:r.left+r.width*.72,y:r.top+r.height*.4}})()`);
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',...pointer});await delay(120);
 const state=await evaluate(`demoCards.map(c=>{const p=c.shadowRoot.querySelector('.tooltip'),r=p.getBoundingClientRect(),b=c.shadowRoot.querySelector('.card-content,.content').getBoundingClientRect();return {hidden:p.hidden,entries:p.querySelectorAll('.tooltip-entry').length,groups:p.querySelectorAll('.tooltip-group-title').length,cursor:c._cursor,pointer:c._tooltipPointer,fits:r.left>=0&&r.right<=innerWidth&&r.top>=b.top-1&&r.bottom<=Math.min(innerHeight,b.bottom)+1}})`);
 assert.ok(state.every(s=>!s.hidden&&s.fits),JSON.stringify({source,state}));assert.equal(state[0].entries,9);assert.equal(state[0].groups,3);
 assert.ok(Math.abs(state[0].cursor-state[2].cursor)<1000,'Timeline and History share a timestamp');
 for(let i=0;i<3;i++)if(i!==source)assert.ok(!state[i].pointer,'Synced cards use their own data anchor');
 }
 await send('Emulation.setDeviceMetricsOverride',{width:430,height:900,deviceScaleFactor:1,mobile:false});await delay(150);
 assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Narrow example has no horizontal overflow');
 console.log('PASS: production Timeline includes 9 entities/3 groups; Timeline, Bar and History synchronize from every source; narrow layout fits.');
 assert.deepEqual(errors,[]);
 await send('Browser.close').catch(()=>{});
}finally{clearTimeout(watchdog);socket?.close();browser.kill();server.closeAllConnections();await new Promise(done=>server.close(done));}
