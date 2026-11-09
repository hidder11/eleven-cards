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
 const capture=async(name,endSelector)=>{
  if(process.env.QA_SCREENSHOTS!=='1')return;
  const {writeFile}=await import('node:fs/promises');
  const out=resolve(root,'docs/qa/issue-'+process.env.QA_ISSUE);
  await mkdir(out,{recursive:true});
  await evaluate('testCard.scrollIntoView({block:"start"})');await delay(150);
  await evaluate('testCard._showTooltip((testCard._start+testCard._end)/2)');
  const clip=await evaluate(`(()=>{const b=testCard.getBoundingClientRect(),end=${JSON.stringify(endSelector??null)},e=end?testCard.shadowRoot.querySelector(end).getBoundingClientRect():b;return {x:b.x+scrollX,y:b.y+scrollY,width:b.width,height:Math.min(b.height,e.bottom-b.top+(end?16:0)),scale:1}})()`);
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip});
  await writeFile(resolve(out,name+'.png'),Buffer.from(shot.data,'base64'));
 };
 const theme=async dark=>{await evaluate(`import('/review/theme.js').then(m=>m.applyReviewTheme(${dark},'material'))`);await evaluate(`testCard.hass={...testCard._hass,themes:{...testCard._hass.themes,darkMode:${dark}}}`);await delay(400);}; await ready('window.themeFixtureReady===true');
 await evaluate(`(()=>{const c=records.find(r=>r.name===${JSON.stringify(process.env.QA_CARD??'history-graph-card')}).card;window.testCard=c;c.hass={...c._hass,states:{...c._hass.states,...Object.fromEntries([0,1,2,3].map(i=>['sensor.test_'+i,{state:'20',attributes:{unit_of_measurement:'W',friendly_name:'Synthetic reading '+i}}]))}};c.setConfig({...c._config,entities:[0,1,2,3].map(i=>'sensor.test_'+i),series_options:['Target temperature','Supply temperature','Return temperature','Room temperature'].map((name,i)=>({entity:'sensor.test_'+i,name})),show_legend:false});c.style.cssText='width:489px;height:260px';document.body.replaceChildren(c)})()`);
 await ready('testCard._status==="ready" && testCard._series.length===4');
 for(const width of [489,375]){
  await evaluate(`testCard.style.width='${width}px'`);await delay(150);
  await evaluate(`testCard._showTooltip((testCard._start+testCard._end)/2)`);
  const bounds=await evaluate(`(()=>{const r=testCard.shadowRoot,t=r.querySelector('.tooltip'),b=t.getBoundingClientRect(),c=r.querySelector('.card-content').getBoundingClientRect(),plot=r.querySelector('.chart').getBoundingClientRect();return {hidden:t.hidden,rows:t.querySelectorAll('span').length,scroll:t.scrollHeight>t.clientHeight+1,height:b.height,plotHeight:plot.height,top:b.top,bottom:b.bottom,cardTop:c.top,cardBottom:c.bottom}})()`);
  assert.equal(bounds.hidden,false);assert.equal(bounds.rows,4);assert.ok(bounds.height>bounds.plotHeight,'Tooltip can grow beyond the short plot');assert.equal(bounds.scroll,false,JSON.stringify(bounds));assert.ok(bounds.top>=bounds.cardTop&&bounds.bottom<=bounds.cardBottom,'Tooltip remains within visible card');
  await theme(width===489);await capture(width===489?'wide-dark':'narrow-light');
 }
 await evaluate(`testCard.shadowRoot.querySelector('.chart').focus()`);await key('Home');
 assert.equal(await evaluate('testCard._pinned'),true);await key('Escape');
 assert.equal(await evaluate(`testCard.shadowRoot.querySelector('.tooltip').hidden`),true);
 console.log('PASS: Four-series tooltip grows beyond a short plot without scrolling at 489/375px, stays within the card and retains keyboard pin/dismiss.'); assert.deepEqual(errors,[],'No browser exceptions');
 await send('Browser.close').catch(()=>{});
}finally{
 clearTimeout(watchdog);socket?.close();browser.kill();server.closeAllConnections();await new Promise(done=>server.close(done));
}