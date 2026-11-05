// Rendered regression checks with synthetic data. No live HA calls. Screenshots require QA_SCREENSHOTS=1 and QA_ISSUE=21.
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
 await evaluate(`(()=>{const c=records.find(r=>r.name==='timeline-card').card;window.testCard=c;const names=['Vloerverwarming','Vloerkoeling','Warmwaterverwarming','Ontdooien','Bijverwarming','Thermostaat'];const ids=names.map((_,i)=>'switch.synthetic_'+i);c.hass={...c._hass,states:Object.fromEntries(ids.map((id,i)=>[id,{state:'on',attributes:{friendly_name:names[i]}}])),callApi:async(_,url)=>{const u=new URL(url,location.origin),a=Date.parse(u.pathname.split('/').pop()),b=Date.parse(u.searchParams.get('end_time'));return ids.map((id,j)=>Array.from({length:12},(_,i)=>({entity_id:id,state:(i+j)%3?'on':'off',last_changed:new Date(a+(b-a)*i/12).toISOString()})))}};c.setConfig({entities:ids,title:'Warmtepomp',hours_to_show:24,bar_height:12,show_legend:false,show_navigation:false,sync_hover:false});document.body.replaceChildren(c);c.style.cssText='width:489px;height:auto'})()`);
 const geometry=()=>evaluate(`(()=>{const r=testCard.shadowRoot,rows=[...r.querySelectorAll('.row')];return {overflow:testCard.scrollWidth>testCard.clientWidth+1,rows:rows.map((row,i)=>{const l=row.querySelector('.row-label'),b=row.querySelector('.track').getBoundingClientRect(),p=rows[i-1]?.getBoundingClientRect();return {labelHeight:l?.getBoundingClientRect().height,gap:l?b.top-l.getBoundingClientRect().bottom:null,rowGap:p?row.getBoundingClientRect().top-p.bottom:null}})}})()`);
 const configure=async config=>{await evaluate(`testCard.setConfig({...testCard._config,...${JSON.stringify(config)}})`);await ready('testCard._status==="ready" && testCard.shadowRoot.querySelectorAll(".track").length===6');await delay(100);};
 await ready('testCard._status==="ready" && testCard._series.length===6');
 for(const width of [489,320]){
  await evaluate(`testCard.style.width='${width}px'`);await delay(150);
  const boxes=await geometry();assert.equal(boxes.overflow,false);assert.equal(boxes.rows.length,6);
  for(const row of boxes.rows){assert.equal(row.gap,2);assert.ok(row.labelHeight>=24);if(row.rowGap!==null)assert.equal(row.rowGap,16);}
  await theme(width===489);await evaluate(`testCard.hass={...testCard._hass,themes:{darkMode:${width===489}}}`);await delay(400);
  await capture(width===489?'wide-dark':'narrow-light');
 }
 for(const gap of [0,32]){
  await configure({label_gap:gap});const boxes=await geometry();for(const row of boxes.rows){assert.equal(row.gap,gap);if(row.rowGap!==null)assert.equal(row.rowGap,16);}
 }
 await configure({label_gap:2,series_options:[{entity:'switch.synthetic_0',name:'Een lange naam voor de verwarming met een heel lang ononderbroken onderdeel abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz'}]});
 const wrapped=await geometry();assert.equal(wrapped.overflow,false);assert.ok(wrapped.rows[0].labelHeight>24);assert.equal(wrapped.rows[0].gap,2);
 await configure({show_labels:false,label_gap:32});assert.equal(await evaluate('testCard.shadowRoot.querySelectorAll(".row-label").length'),0);const hidden=await geometry();for(const row of hidden.rows)if(row.rowGap!==null)assert.equal(row.rowGap,16);
 await configure({show_labels:true,label_gap:2,series_options:[]});
 await evaluate(`testCard.shadowRoot.querySelector('.row-label').focus()`);
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,modifiers:8});
 await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,modifiers:8});
 assert.equal(await evaluate('testCard.shadowRoot.querySelectorAll(".row").length'),1,'Shift+Enter isolates a timeline');
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,modifiers:8});
 await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,modifiers:8});
 assert.equal(await evaluate('testCard.shadowRoot.querySelectorAll(".row").length'),6,'Shift+Enter restores all timelines');
 console.log('PASS: Default/configured label gaps, independent row spacing, wrapped and hidden names, keyboard isolation and 489/320px layouts.'); assert.deepEqual(errors,[],'No browser exceptions');
 await send('Browser.close').catch(()=>{});
}finally{
 clearTimeout(watchdog);socket?.close();browser.kill();server.closeAllConnections();await new Promise(done=>server.close(done));
}