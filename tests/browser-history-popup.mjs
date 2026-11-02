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
const profile=await mkdtemp(resolve(root,'.cache/history-popup-'));
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
  assert.fail('Timed out: '+expression+' '+JSON.stringify(await evaluate(`(()=>{const r=testCard.shadowRoot,t=r.querySelector('[data-period="menu"]'),p=r.querySelector('.period-menu');return {pending:testCard._periodMenuPending,open:testCard._periodMenuOpen,trigger:t.outerHTML,rect:t.getBoundingClientRect().toJSON(),popup:p.outerHTML.slice(0,250),status:testCard._status};})()`)));
 };
 const key=async key=>{
  const keyCode={Escape:27,Enter:13,ArrowRight:39,ArrowLeft:37,Home:36,End:35}[key];
  await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:keyCode,...(key==='Enter'?{text:'\r'}:{})});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:keyCode});
 };
 await send('Runtime.enable');await send('Page.enable');
 await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/review/index.html`});
 await ready('window.themeFixtureReady===true && records[0].card._status==="ready"');
 await evaluate('window.testCard=records[0].card; window.originalConfig=JSON.stringify(testCard._config)');
 await evaluate(`(()=>{
  for(const name of ['car-card','car-evcc']){
   const c=records.find(r=>r.name===name).card;
   c.setConfig({...c._config,custom_tabs:Array.from({length:5},(_,i)=>({id:'custom-'+(i+1),title:i===0?'Aanvullende voertuiggegevens':'Eigen tab '+(i+1),entities:['sensor.soc']}))});
  }
 })()`);
 let count=0;
 for(const width of [320,390,1280])for(const material of [true,false])for(const dark of [false,true]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
  await evaluate(`(()=>{
   document.querySelector('#mode').click();
   if(window.reviewDark!==${dark})document.querySelector('#mode').click();
   if(!${material}){
    for(const name of [...document.body.style])if(name.startsWith('--eleven-material-'))document.body.style.removeProperty(name);
    for(const [name,value] of Object.entries(${dark}?{'card-background-color':'#1c1c1c','primary-text-color':'#e1e1e1','secondary-background-color':'#282828','secondary-text-color':'#9b9b9b'}:{'card-background-color':'#fff','primary-text-color':'#212121','secondary-background-color':'#f2f2f2','secondary-text-color':'#727272'}))document.body.style.setProperty('--'+name,value);
    document.body.style.setProperty('--ha-card-border-radius','12px');document.body.style.setProperty('--ha-card-box-shadow','none');document.body.style.setProperty('--ha-card-background','var(--card-background-color)');
   }
   testCard._hass.language='nl';testCard._render();
   testCard.scrollIntoView({block:'start'});
  })()`);
  await delay(100); // Settle scrolling before opening: scrolling dismisses popups.
  await evaluate(`testCard.shadowRoot.querySelector('[data-period="menu"]').click()`);
  await ready('testCard.shadowRoot.querySelector(".period-menu").matches(":popover-open")');
  const selected=await evaluate(`getComputedStyle(testCard.shadowRoot.querySelector('[data-period-option="configured"]')).boxShadow`);
  await evaluate(`testCard.shadowRoot.querySelector('[data-period-option="6h"]').click()`);
  await ready('testCard._periodMode==="6h" && testCard._status==="ready"');
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
  await evaluate(`testCard.shadowRoot.querySelector('[data-period="menu"]').click()`);
  await ready('testCard.shadowRoot.querySelector(".period-menu").matches(":popover-open")');
  const result=await evaluate(`(()=>{
   const r=testCard.shadowRoot,standard=r.querySelector('[data-period-option="configured"]'),other=r.querySelector('[data-period-option="1h"]');
   const paint=e=>{const s=getComputedStyle(e);return {background:s.backgroundImage,color:s.backgroundColor,shadow:s.boxShadow,radius:s.borderRadius};};
   standard.focus();const b=standard.getBoundingClientRect();return {standard:paint(standard),other:paint(other),checked:standard.getAttribute('aria-checked'),focus:r.activeElement===standard,width:b.width,height:b.height};
  })()`);
  assert.deepEqual(result.standard,result.other,`Default uses the same unselected control paint: ${JSON.stringify({width,material,dark,result})}`);
  assert.equal(result.checked,'false');assert.equal(result.focus,true);assert.ok(result.height>=44);
  if(material){assert.ok(result.standard.shadow.includes('inset'));assert.notEqual(selected,result.standard.shadow);}
  // Actual hover must retain the same control recipe for Default and presets.
  for(const option of ['configured','1h']){
   const b=await evaluate(`(()=>{const b=testCard.shadowRoot.querySelector('[data-period-option="${option}"]').getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2};})()`);
   await send('Input.dispatchMouseEvent',{type:'mouseMoved',...b});
   const paint=await evaluate(`(()=>{const s=getComputedStyle(testCard.shadowRoot.querySelector('[data-period-option="${option}"]'));return [s.backgroundImage,s.backgroundColor,s.boxShadow];})()`);
   if(option==='configured')result.hover=paint;else assert.deepEqual(paint,result.hover,'Default and presets share hover paint');
  }
  await key('Escape');
  assert.equal(await evaluate('testCard.shadowRoot.activeElement?.dataset.period'),'menu','Escape restores trigger focus');
  await evaluate(`testCard.shadowRoot.querySelector('.history-tools').open=true;testCard.shadowRoot.querySelector('[data-insight="data"]').click()`);
  await ready('testCard.shadowRoot.querySelector(".insight-popup").matches(":popover-open")');
  const info=await evaluate(`(()=>{
   const r=testCard.shadowRoot;return [...r.querySelectorAll('.insight-sensor')].map(e=>{const s=getComputedStyle(e),b=e.getBoundingClientRect();return {shadow:s.boxShadow,radius:s.borderRadius,plotShadow:getComputedStyle(r.querySelector('.chart')).boxShadow,width:b.width,readings:e.querySelectorAll('dd').length};});
  })()`);
  assert.equal(info.length,2);
  for(const item of info){assert.equal(item.shadow,item.plotShadow,'Information uses the same inset depth as the graph well');assert.equal(item.radius,material?'15px':'12px');assert.ok(item.width>0);assert.equal(item.readings,3);}
  await key('Escape');
  await evaluate(`testCard.shadowRoot.querySelector('[data-period="menu"]').click()`);
  await ready('testCard.shadowRoot.querySelector(".period-menu").matches(":popover-open")');
  await evaluate(`testCard.shadowRoot.querySelector('[data-period-option="configured"]').focus()`);
  await key('Enter');
  await ready('testCard._periodMode==="configured" && testCard._status==="ready"');
  assert.equal(await evaluate('JSON.stringify(testCard._config)'),await evaluate('originalConfig'),'Period choice preserves config');
  // Companion information surfaces must use the same role without changing
  // their data, event popups, legend controls or timeframe controls.
  for(const name of ['bar-chart','timeline-card','heatmap-card','calendar-card']){
   await evaluate(`(()=>{window.companion=records.find(r=>r.name==='${name}').card;companion.scrollIntoView({block:'start'});for(const details of companion.shadowRoot.querySelectorAll('details'))details.open=true;})()`);
   await delay(100);
   await evaluate(`companion.shadowRoot.querySelector('[data-insight="data"],[data-info]').click()`);
   await ready('!!companion.shadowRoot.querySelector(".insight-popup:popover-open")');
   const items=await evaluate(`(()=>{const r=companion.shadowRoot;return [...r.querySelectorAll('.insight-popup .insight-sensor')].map(e=>{const s=getComputedStyle(e),b=e.getBoundingClientRect();return {shadow:s.boxShadow,radius:s.borderRadius,width:b.width,height:b.height,color:s.backgroundColor,metricColor:getComputedStyle(records.find(v=>v.name==='weather-card').card.shadowRoot.querySelector('[data-ui-metric]')).backgroundColor};});})()`);
   assert.ok(items.length>0,name+' information blocks');
   for(const item of items){assert.equal(item.shadow,info[0].shadow,name+' shares inset depth');assert.equal(item.radius,info[0].radius,name+' shares well radius');assert.equal(item.color,item.metricColor,name+' information background matches weather metric');assert.ok(item.width>0&&item.height>0);}
   await evaluate(`companion.shadowRoot.querySelector('.insight-popup [data-ui-popup-close]').click()`);
  }
  await evaluate(`(()=>{window.agenda=records.find(r=>r.name==='calendar-card').card;for(const d of agenda.shadowRoot.querySelectorAll('details'))d.open=false;agenda.scrollIntoView({block:'start'});})()`);
  await delay(100);
  const agendaLegend=await evaluate(`(()=>{const r=agenda.shadowRoot,l=r.querySelector('.legend'),button=l.querySelector('[data-ui-legend]'),s=getComputedStyle(button);return {layout:getComputedStyle(l).display,shadow:s.boxShadow,fill:s.backgroundColor,pressed:button.getAttribute('aria-pressed'),color:getComputedStyle(button.querySelector('.dot')).backgroundColor};})()`);
  assert.equal(agendaLegend.layout,'grid');assert.equal(agendaLegend.shadow,'none');assert.equal(agendaLegend.fill,'rgba(0, 0, 0, 0)');assert.equal(agendaLegend.pressed,'true');
  await evaluate(`agenda.shadowRoot.querySelector('[data-ui-legend]').click()`);
  assert.equal(await evaluate(`agenda.shadowRoot.querySelector('[data-ui-legend]').getAttribute('aria-pressed')`),'false','Agenda legend still toggles calendars');
  await evaluate(`agenda.shadowRoot.querySelector('[data-ui-legend]').click()`);
  for(const action of ['previous','now','next']){
   const before=await evaluate(`(()=>{const r=agenda.shadowRoot,g=r.querySelector('.navigation'),b=r.querySelector('[data-nav="${action}"]').getBoundingClientRect();return {shadow:getComputedStyle(g).boxShadow,shadows:[...g.querySelectorAll('[data-nav]')].map(e=>getComputedStyle(e).boxShadow),x:b.x+b.width/2,y:b.y+b.height/2,overflow:g.scrollWidth>g.clientWidth+1};})()`);
   assert.equal(before.overflow,false,'Agenda bar fits');assert.notEqual(before.shadow,'none','Agenda one shared shadow');assert.deepEqual(before.shadows,['none','none','none']);
   await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:before.x,y:before.y});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,x:before.x,y:before.y});
   const pressed=await evaluate(`(()=>{const r=agenda.shadowRoot,g=r.querySelector('.navigation');return {shadow:getComputedStyle(g).boxShadow,buttons:[...g.querySelectorAll('[data-nav]')].map(e=>({action:e.dataset.nav,active:e.matches(':active'),shadow:getComputedStyle(e).boxShadow}))};})()`);
   assert.equal(pressed.shadow,before.shadow,'Agenda group shadow stays stable');for(const b of pressed.buttons){assert.equal(b.active,b.action===action);assert.equal(b.shadow==='none',b.action!==action,'Agenda only pressed segment gets inset');}
   await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:0,y:0});
  }
  for(const name of ['history-graph-card','bar-chart','timeline-card','heatmap-card','weather-card','car-card','car-evcc']){
   await evaluate(`window.tabsCard=records.find(r=>r.name==='${name}').card;for(const d of tabsCard.shadowRoot.querySelectorAll('details'))d.open=false;tabsCard.scrollIntoView({block:'start'})`);
   await delay(100);
   const period=await evaluate(`!!tabsCard.shadowRoot.querySelector('[data-period="menu"]')`);
   if(period){
    const dividers=await evaluate(`(()=>{const r=tabsCard.shadowRoot,buttons=[...r.querySelectorAll('.chart-controls>[data-period]')],standard=r.querySelector('[data-period-option=configured]'),other=r.querySelector('[data-period-option="1h"]'),paint=e=>{const s=getComputedStyle(e);return [s.backgroundImage,s.backgroundColor,s.boxShadow,s.borderRadius]};const checked=standard.getAttribute('aria-checked');standard.setAttribute('aria-checked','false');const result={lines:buttons.map(b=>({color:getComputedStyle(b,'::before').backgroundColor,opacity:getComputedStyle(b).opacity})),standard:paint(standard),option:paint(other)};standard.setAttribute('aria-checked',checked);return result;})()`);
    assert.deepEqual(dividers.standard,dividers.option,name+' unselected Default matches period options');
    for(const line of dividers.lines){assert.equal(line.color,dividers.lines[0].color,name+' all separators use one color');assert.equal(line.opacity,'1',name+' disabled segments do not dim separators');}
    if(name==='timeline-card'){
     const navigation=await evaluate(`(()=>{const r=tabsCard.shadowRoot,chart=r.querySelector('.chart');chart.focus();chart.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));chart.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));const next=tabsCard._cursor;chart.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));const previous=tabsCard._cursor;chart.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return {next,previous,start:tabsCard._viewStart,extraButtons:r.querySelectorAll('[data-timeline-step]').length,labelHeight:r.querySelector('.row-label').getBoundingClientRect().height,tooltipHidden:r.querySelector('.tooltip').hidden};})()`);
     assert.ok(navigation.next>navigation.start,'Timeline arrow key advances to a real change');assert.equal(navigation.previous,navigation.start,'Timeline left arrow returns to start');assert.equal(navigation.extraButtons,0,'Timeline has no extra Previous/Next buttons');assert.ok(navigation.labelHeight>=44,'Timeline sensor labels remain 44px');assert.equal(navigation.tooltipHidden,true,'Escape dismisses Timeline details');
    }
    const legend=await evaluate(`(()=>{const r=tabsCard.shadowRoot,l=r.querySelector('.legend'),chart=r.querySelector('.timeline-well');return {unitOutside:!!l?.querySelector(':scope>.unit'),values:[...r.querySelectorAll('.legend-item strong')].map(e=>e.textContent),above:!chart||!l||l.getBoundingClientRect().bottom<=chart.getBoundingClientRect().top+1,chartCount:r.querySelectorAll('.chart').length};})()`);
    if(name==='bar-chart'){assert.equal(legend.unitOutside,false,'Bar units belong to sensor readings');assert.ok(legend.values.every(v=>/[a-zA-Z%°]/.test(v)),'Bar values include units');}
    if(name==='timeline-card'){assert.equal(legend.above,true,'Timeline legend above chart');assert.equal(legend.chartCount,1,'Single timeline graph');}
    const buttons=await evaluate(`[...tabsCard.shadowRoot.querySelectorAll('.chart-controls>.period-controls>.period-trigger,.chart-controls>[data-period]:not(:disabled)')].map(e=>e.dataset.period)`);
    for(const action of buttons){
     const before=await evaluate(`(()=>{const r=tabsCard.shadowRoot,g=r.querySelector('.chart-controls'),buttons=[...g.querySelectorAll('button')].filter(e=>e.dataset.period),b=r.querySelector('[data-period="${action}"]').getBoundingClientRect();return {group:getComputedStyle(g).boxShadow,hit:r.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.outerHTML.slice(0,200),shadows:buttons.map(e=>getComputedStyle(e).boxShadow),x:b.x+b.width/2,y:b.y+b.height/2,overflow:g.scrollWidth>g.clientWidth+1};})()`);
     assert.equal(before.overflow,false,name+' time controls fit');
     await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:before.x,y:before.y});
     await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,x:before.x,y:before.y});
     const pressed=await evaluate(`(()=>{const r=tabsCard.shadowRoot,g=r.querySelector('.chart-controls');return {group:getComputedStyle(g).boxShadow,active:[...g.querySelectorAll('button')].filter(e=>e.dataset.period).map(e=>({action:e.dataset.period,active:e.matches(':active'),shadow:getComputedStyle(e).boxShadow}))};})()`);
     assert.notEqual(pressed.group,'none',name+' group owns shared raised shadow');assert.ok(before.shadows.every(s=>s==='none'),name+' resting segments have no separate shadows');
     assert.equal(before.group,pressed.group,name+' group stays stable');
     for(let i=0;i<pressed.active.length;i++){const b=pressed.active[i];if(b.action===action){assert.equal(b.active,true,name+' individual active button '+JSON.stringify({action,before,pressed}));assert.notEqual(b.shadow,before.shadows[i],name+' individual inset feedback');}else assert.equal(b.shadow,before.shadows[i],name+' sibling unchanged');}
     await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
     await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:0,y:0});
    }
   }
   if(period){
    await evaluate(`(()=>{const details=tabsCard.shadowRoot.querySelector('.history-tools,.chart-tools');if(details)details.open=true;})()`);
    for(const group of ['zoom-controls','chart-links']){
     if(!await evaluate(`!!tabsCard.shadowRoot.querySelector('.${group}')`))continue;
     const before=await evaluate(`(()=>{const g=tabsCard.shadowRoot.querySelector('.${group}'),b=[...g.querySelectorAll('button:not(:disabled),a')].find(e=>e.getBoundingClientRect().width>0),rect=b.getBoundingClientRect(),s=getComputedStyle(g);return {shadow:s.boxShadow,x:rect.x+rect.width/2,y:rect.y+rect.height/2,heights:[...g.querySelectorAll(':scope>button,:scope>a,:scope>.insight-control>.insight-trigger')].map(e=>e.getBoundingClientRect().height),height:g.getBoundingClientRect().height,dividers:[...g.children].slice(1).map(e=>{const p=getComputedStyle(e,'::before');return {top:p.top,bottom:p.bottom}})};})()`);
     for(const h of before.heights)assert.equal(h,before.height,name+' menu feedback fills group height');
     for(const d of before.dividers){assert.equal(d.top,'0px');assert.equal(d.bottom,'0px');}
     await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:before.x,y:before.y});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,x:before.x,y:before.y});
     const pressed=await evaluate(`(()=>{const g=tabsCard.shadowRoot.querySelector('.${group}'),b=[...g.querySelectorAll('button,a')].find(e=>e.matches(':active'));return {group:getComputedStyle(g).boxShadow,button:b?getComputedStyle(b).boxShadow:null};})()`);
     assert.equal(pressed.group,before.shadow,name+' menu group shadow remains stable');assert.ok(pressed.button&&pressed.button!=='none',name+' menu button has individual press feedback');
     await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:0,y:0});
    }
    await evaluate(`tabsCard.shadowRoot.querySelector('[data-period="menu"]').click()`);
    await ready('!!tabsCard.shadowRoot.querySelector(".period-menu:popover-open")');
   }
   await evaluate(`tabsCard.shadowRoot.querySelector('[role=tablist] [role=tab]').click()`);
   await key('ArrowRight');await delay(50);
   const tabs=await evaluate(`(()=>{
    const r=tabsCard.shadowRoot,list=r.querySelector('[role=tablist]'),items=[...list.querySelectorAll('[role=tab]')];
    return {active:items.findIndex(t=>t.getAttribute('aria-selected')==='true'),focus:r.activeElement?.dataset.uiTab,selected:items[1].dataset.uiTab,listWidth:list.clientWidth,overflow:list.scrollWidth>list.clientWidth+1,items:items.map(t=>{const s=getComputedStyle(t),b=t.getBoundingClientRect();return {selected:t.getAttribute('aria-selected')==='true',shadow:s.boxShadow,radius:s.borderRadius,bottomColor:s.borderBottomColor,fill:s.backgroundColor,transform:s.transform,width:b.width,height:b.height,border:s.borderBottomWidth,background:s.backgroundImage,panel:!!r.getElementById(t.getAttribute('aria-controls'))};})};
   })()`);
   assert.equal(tabs.active,1,name+' keyboard selection');assert.equal(tabs.focus,tabs.selected,name+' keyboard focus');assert.equal(tabs.overflow,tabs.items.length>=4&&tabs.items.length*88>tabs.listWidth+1,name+' scrolling follows available card width');
   const tabPaint=()=>evaluate(`(()=>{const t=tabsCard.shadowRoot.querySelector('[role=tab][aria-selected=true]'),s=getComputedStyle(t),b=t.getBoundingClientRect();return {line:s.borderBottomWidth,lineStyle:s.borderBottomStyle,lineColor:s.borderBottomColor,text:s.color,primary:getComputedStyle(tabsCard.shadowRoot.querySelector('ha-card')).color,x:b.x+b.width/2,y:b.y+b.height/2};})()`);
   const restingTab=await tabPaint();
   await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:restingTab.x,y:restingTab.y});
   const hoveredTab=await tabPaint();
   assert.equal(hoveredTab.line,'2px',name+' selected underline survives real hover');assert.equal(hoveredTab.lineStyle,'solid');assert.equal(hoveredTab.lineColor,restingTab.lineColor,name+' hover preserves accent line');assert.equal(hoveredTab.text,hoveredTab.primary,name+' selected tab uses information value text color');
   await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
   for(const item of tabs.items){assert.ok(item.width>=44&&item.height>=44,name+' usable targets');assert.equal(item.radius,'0px',name+' flat underline tabs');assert.equal(item.transform,'none',name+' stable label position');assert.equal(item.border,'2px',name+' fine underline');assert.equal(item.bottomColor==='rgba(0, 0, 0, 0)',!item.selected,name+' underline marks selection');assert.equal(item.shadow,'none',name+' no tab well');if(item.selected)assert.equal(item.fill,'rgba(0, 0, 0, 0)',name+' transparent selection');assert.equal(item.panel,true);if(!item.selected){assert.equal(item.shadow,'none',name+' inactive text tab');assert.equal(item.background,'none',name+' inactive text tab');}}
   const enlarged=await evaluate(`(()=>{
    const r=tabsCard.shadowRoot,style=document.createElement('style');style.textContent='[data-ui-tabs] [role=tab]{font-size:24px!important}';r.append(style);
    const list=r.querySelector('[role=tablist]'),result={overflow:list.scrollWidth>list.clientWidth+1,clipped:[...list.querySelectorAll('[role=tab]')].some(t=>{const b=t.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(t);const text=range.getBoundingClientRect();return text.left<b.left-1||text.right>b.right+1||text.top<b.top-1||text.bottom>b.bottom+1;})};style.remove();return result;
   })()`);
   assert.equal(enlarged.overflow,tabs.overflow,name+' enlarged tabs preserve scrolling');assert.equal(enlarged.clipped,false,name+' enlarged labels fit');
   await key('End');
   assert.equal(await evaluate(`tabsCard.shadowRoot.querySelector('[role=tablist] [role=tab]:last-child').getAttribute('aria-selected')`),'true',name+' End');
   const end=await evaluate(`(()=>{const r=tabsCard.shadowRoot,list=r.querySelector('[role=tablist]'),active=list.querySelector('[aria-selected=true]'),a=active.getBoundingClientRect(),b=list.getBoundingClientRect(),panel=r.getElementById(active.getAttribute('aria-controls')),p=panel.getBoundingClientRect(),ps=getComputedStyle(panel);return {visible:a.left>=b.left-1&&a.right<=b.right+1,seam:Math.abs(a.bottom-p.top),fill:ps.backgroundColor,image:ps.backgroundImage};})()`);
   assert.equal(end.visible,true,name+' End scrolls tab into view');assert.ok(end.seam<=1,name+' tab joins content');assert.equal(end.fill,'rgba(0, 0, 0, 0)',name+' content has no extra fill');assert.equal(end.image,'none',name+' content has no extra gradient');
   await key('Home');
   assert.equal(await evaluate(`tabsCard.shadowRoot.querySelector('[role=tablist] [role=tab]:first-child').getAttribute('aria-selected')`),'true',name+' Home');
   const radii=await evaluate(`(()=>{const r=tabsCard.shadowRoot,previous=tabsCard.style.getPropertyValue('--eleven-material-radius-button');tabsCard.style.setProperty('--eleven-material-radius-button','17px');const t=r.querySelector('[aria-selected=true][role=tab]'),ts=getComputedStyle(t),button=r.querySelector('[data-period-option="1h"],[data-action]'),bs=button?getComputedStyle(button):null,result={top:ts.borderTopLeftRadius,bottom:ts.borderBottomLeftRadius,button:bs?.borderTopLeftRadius};if(previous)tabsCard.style.setProperty('--eleven-material-radius-button',previous);else tabsCard.style.removeProperty('--eleven-material-radius-button');return result;})()`);
   assert.equal(radii.top,'0px',name+' underline tabs retain square corners');assert.equal(radii.bottom,'0px',name+' underline tabs retain square corners');

   if(period)await key('Escape');
  }
  count++;
 }
 assert.deepEqual(errors,[],'No browser exceptions');
 console.log(`PASS: ${count} History popup cases plus ${count*4} Bar/Timeline/Heatmap/Calendar information popups (320/390/1280, native/Material, light/dark), selection, hover, matching backgrounds and inset depth, keyboard reset and focus; no screenshots.`);
 console.log('PASS: Bar legend units, Timeline legend placement and individual mouse-press feedback for History/Bar/Timeline/Heatmap time controls.');
 console.log(`PASS: ${count*7} approved-card tab cases plus enlarged-text checks, including custom Auto/EVCC tabs, horizontal navigation, stable labels, 2A-1 underlines, keyboard navigation and panel links.`);
 await send('Browser.close').catch(()=>{});
}finally{
 clearTimeout(watchdog);socket?.close();browser.kill();server.closeAllConnections();await new Promise(done=>server.close(done));
}
