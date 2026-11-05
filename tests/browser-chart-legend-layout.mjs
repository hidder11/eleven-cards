// Rendered regression checks with synthetic data. No live HA calls. Optional screenshots require QA_SCREENSHOTS=1 and QA_ISSUE=14.
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
 const configure=async config=>{await evaluate(`testCard.setConfig({...testCard._config,...${JSON.stringify(config)}})`);await ready('testCard._status==="ready"');await delay(120);};
 const bounds=()=>evaluate(`(()=>{const r=testCard.shadowRoot,l=r.querySelector('.legend'),b=l.getBoundingClientRect();return {overflow:l.scrollWidth>l.clientWidth+1,items:[...l.querySelectorAll('.legend-item')].map(e=>{const q=e.getBoundingClientRect();return {x:q.left,y:q.top,w:q.width,right:q.right,bottom:q.bottom,value:e.querySelector('strong').textContent,inside:q.left>=b.left-1&&q.right<=b.right+1}}),unit:l.querySelector('.unit')?.textContent}})()`);
 for(const name of ['history-graph-card','bar-chart']){
  await evaluate(`(()=>{const c=records.find(r=>r.name===${JSON.stringify(name)}).card;window.testCard=c;window.largeLegend=false;const names=['Woonkamer','Keuken','Hal','Tuin'];const ids=names.map((_,i)=>'sensor.legend_'+i);c.hass={...c._hass,callApi:async(_,url)=>{const u=new URL(url,location.origin),a=Date.parse(decodeURIComponent(u.pathname.split('/').pop())),b=Date.parse(u.searchParams.get('end_time'));return ids.map((id,j)=>Array.from({length:49},(_,i)=>({entity_id:id,state:String(window.largeLegend&&j===1?1234567890123:20+j/3+Math.sin(i/5)*2),last_changed:new Date(a+(b-a)*i/48).toISOString()})))},states:{...c._hass.states,...Object.fromEntries(ids.map((id,i)=>[id,{state:'20',attributes:{friendly_name:names[i],unit_of_measurement:'\u00b0C'}}]))}};c.setConfig({entities:ids,title:'Temperatuur',hours_to_show:24,show_navigation:false,sync_hover:false});document.body.replaceChildren(c);c.style.cssText='width:489px;height:420px'})()`);
  await ready('testCard._status==="ready" && testCard.shadowRoot.querySelectorAll(".legend-item").length===4');
  for(const width of [489,320,180]){
   await evaluate(`testCard.style.width='${width}px'`);await delay(150);
   const layout=await bounds();assert.equal(layout.overflow,false);assert.ok(layout.items.every(i=>i.inside&&i.value.length>0));
   if(width===489)assert.equal(new Set(layout.items.map(i=>i.y)).size,1,'Four short names fit on one row');
   if(width===180)assert.ok(new Set(layout.items.map(i=>i.y)).size>1,'Narrow cards wrap');
   if(width!==180){await theme(width===489);await evaluate(`testCard.hass={...testCard._hass,themes:{darkMode:${width===489}}}`);await delay(400);await capture(name+'-'+(width===489?'wide-dark':'narrow-light'));}
  }
  await configure({series_options:[{entity:'sensor.legend_0',name:'A long sensor name with an unbroken part abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz'}]});
  const long=await bounds();assert.equal(long.overflow,false);assert.ok(long.items.every(i=>i.inside));
  await evaluate(`testCard.shadowRoot.querySelector('[data-ui-legend]').click()`);
  assert.equal(await evaluate(`testCard.shadowRoot.querySelector('[data-ui-legend]').getAttribute('aria-pressed')`),'false');
  await evaluate(`testCard.shadowRoot.querySelector('[data-ui-legend]').focus()`);
  const shiftEnter=async()=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,modifiers:8});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,modifiers:8});};
  await shiftEnter();assert.deepEqual(await evaluate(`[...testCard.shadowRoot.querySelectorAll('[data-ui-legend]')].map(e=>e.getAttribute('aria-pressed'))`),['true','false','false','false']);
  await shiftEnter();assert.deepEqual(await evaluate(`[...testCard.shadowRoot.querySelectorAll('[data-ui-legend]')].map(e=>e.getAttribute('aria-pressed'))`),['true','true','true','true']);
  await evaluate(`window.largeLegend=true;testCard.hass={...testCard._hass,states:{...testCard._hass.states,'sensor.legend_1':{state:'2500',attributes:{friendly_name:'Long value and unit',unit_of_measurement:'W'}}}}`);
  await configure({series_options:[]});const mixed=await bounds();assert.ok(mixed.items[1].value.includes('W'));assert.ok(mixed.items[0].value.includes('\u00b0C'));assert.equal(mixed.overflow,false);assert.ok(mixed.items.every(i=>i.inside));
  console.log('PASS: '+name+' wraps at 489/320/180px, fits four short names on a wide row, contains long names and mixed units, and preserves toggle/keyboard isolation.');
 } assert.deepEqual(errors,[],'No browser exceptions');
 await send('Browser.close').catch(()=>{});
}finally{
 clearTimeout(watchdog);socket?.close();browser.kill();server.closeAllConnections();await new Promise(done=>server.close(done));
}