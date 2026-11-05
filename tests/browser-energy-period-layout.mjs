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
 const capture=async(name,endSelector)=>{
  if(process.env.QA_SCREENSHOTS!=='1')return;
  const {writeFile}=await import('node:fs/promises');
  const out=resolve(root,'docs/qa/issue-'+process.env.QA_ISSUE);
  await mkdir(out,{recursive:true});
  await evaluate('testCard.scrollIntoView({block:"start"})');await delay(150);
  const clip=await evaluate(`(()=>{const b=testCard.getBoundingClientRect(),end=${JSON.stringify(endSelector??null)},e=end?testCard.shadowRoot.querySelector(end).getBoundingClientRect():b;return {x:b.x+scrollX,y:b.y+scrollY,width:b.width,height:Math.min(b.height,e.bottom-b.top+(end?16:0)),scale:1}})()`);
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});
  await writeFile(resolve(out,name+'.png'),Buffer.from(shot.data,'base64'));
 };
 const theme=dark=>evaluate(`import('/review/theme.js').then(m=>m.applyReviewTheme(${dark},'material'))`); await ready('window.themeFixtureReady===true');
 await evaluate(`(()=>{const c=records.find(r=>r.name==='energy-flow-card').card;window.testCard=c;c.setConfig({...c._config,default_view:'history'});c.style.cssText='width:489px;height:850px';document.body.replaceChildren(c)})()`);
 await ready('testCard._view==="history"');
 for(const width of [489,324,280])for(const lang of ['nl','en']){
  await evaluate(`testCard.style.width='${width}px';testCard.hass={...testCard._hass,language:'${lang}'}`);await delay(150);
  const layout=await evaluate(`(()=>{const r=testCard.shadowRoot,g=r.querySelector('.toolbar .chart-controls'),b=[...g.querySelectorAll('.period-trigger,button[data-period],button[data-view-button]')].filter(e=>!e.closest('[data-ui-popup]')).map(e=>e.getBoundingClientRect());return {count:b.length,rows:b.map(e=>Math.round(e.top)),heights:b.map(e=>e.height),overflow:g.scrollWidth>g.clientWidth+1}})()`);
  assert.equal(layout.count,5);assert.equal(new Set(layout.rows).size,1,'All controls stay on one row');assert.equal(layout.overflow,false);assert.ok(layout.heights.every(h=>h>=36&&h<44),'Same 36px controls as graphs');
  if(lang==='nl'&&width!==280){await theme(width===489);await capture(width===489?'wide-dark':'narrow-light','.energy-topline');}
 }
 await evaluate(`testCard.shadowRoot.querySelector('[data-period="menu"]').click()`);
 assert.equal(await evaluate(`testCard._periodMenuOpen`),true,'Period popup opens');await key('Escape');
 await evaluate(`testCard.shadowRoot.querySelector('[data-view-button]').click()`);
 await ready('testCard._view==="live"');
 console.log('PASS: Energy Flow navigation stays on one row with graph-sized controls at 489/324/280px in NL/EN; period popup and Live switch work.'); assert.deepEqual(errors,[],'No browser exceptions');
 await send('Browser.close').catch(()=>{});
}finally{
 clearTimeout(watchdog);socket?.close();browser.kill();server.closeAllConnections();await new Promise(done=>server.close(done));
}