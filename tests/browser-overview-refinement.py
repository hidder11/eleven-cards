"""Overview-only served collection checks; synthetic HA, no backend writes."""
import argparse,json,re,yaml
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-evidence/overview-refinement';OUT.mkdir(parents=True,exist_ok=True)
args=argparse.ArgumentParser();args.add_argument('--baseline',action='store_true');args.add_argument('--full',action='store_true');a=args.parse_args()
URL='http://127.0.0.1:56515/JC5klAkxdKA9PmJO7YSGqy76RQb7-mo6C0aJPXHgbsI/cards/review/'
MEASURE='''c=>{const r=c.shadowRoot,box=e=>{if(!e)return null;const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}},glyph=e=>{const t=document.createRange();t.selectNodeContents(e);return box(t)},q=s=>r.querySelector(s);return {host:box(c),card:box(q('ha-card')),content:box(q('.content')),header:box(q('header')),title:{...box(q('h2')),font:getComputedStyle(q('h2')).fontSize,weight:getComputedStyle(q('h2')).fontWeight},period:box(q('.period')),grid:box(q('.grid')),titleBrokenWords:(()=>{const t=q('h2').firstChild;if(t?.nodeType!==3)return [];return [...t.textContent.matchAll(/\\S+/g)].filter(m=>{const range=document.createRange();range.setStart(t,m.index);range.setEnd(t,m.index+m[0].length);return range.getClientRects().length>1}).map(m=>m[0])})(),columns:getComputedStyle(q('.grid')).gridTemplateColumns,scroll:q('.content').scrollWidth,client:q('.content').clientWidth,cells:[...r.querySelectorAll('.metric')].map(e=>({box:box(e),label:box(e.querySelector('.label')),reading:box(e.querySelector('.reading')),value:box(e.querySelector('.value')),valueInk:glyph(e.querySelector('.value')),valueWhiteSpace:getComputedStyle(e.querySelector('.value')).whiteSpace,unit:box(e.querySelector('.unit')),spark:box(e.querySelector('.spark')),delta:box(e.querySelector('.delta')),caption:box(e.querySelector('.caption')),text:e.innerText}))}}'''
rows=[];errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':1200},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(URL);page.wait_for_function("window.themeFixtureReady&&records.find(r=>r.name==='overview-card').card._status==='ready'")
 card=page.locator('[data-card=overview-card]')
 def measure():
  page.wait_for_timeout(120);card.scroll_into_view_if_needed();return card.evaluate(MEASURE)
 def check(row,normal=False):
  assert not row['titleBrokenWords'], ('split title word',row)
  assert row['scroll']<=row['client']+1,('overflow',row)
  assert row['card']['bottom']<=row['host']['bottom']+1,('host clipping',row)
  assert row['grid']['y']-row['header']['bottom']>=15.5,('header gap',row)
  for cell in row['cells']:
   cb=cell['box'];v=cell['valueInk']
   assert v['h']<=cell['value']['h']+1,('split value',cell)
   assert cell['valueWhiteSpace']=='nowrap',('atomic value contract',cell)
   for key in ['label','reading','valueInk','unit','spark','delta','caption']:
    x=cell[key]
    if x:assert x['x']>=cb['x']+8 and x['right']<=cb['right']-8,('well clearance',key,cell)
   if cell['spark']:assert cell['spark']['y']-cell['reading']['bottom']>=7.5,('reading/plot gap',cell)
   if cell['spark'] and cell['delta']:assert cell['delta']['y']-cell['spark']['bottom']>=7.5,('plot/delta gap',cell)
  for cell in row['cells']:
   peers=[x for x in row['cells'] if abs(x['box']['y']-cell['box']['y'])<1]
   for key in ['reading','spark','delta']:
    ys=[x[key]['y'] for x in peers if x[key]]
    assert not ys or max(ys)-min(ys)<1,('unaligned tracks',key,row)
  if normal:assert row['title']['font']=='16px' and row['title']['weight']=='600',('calm title',row)
 for width in [320,390,1280]:
  page.set_viewport_size({'width':width,'height':1200})
  for dark in [False,True]:
   if page.evaluate('window.reviewDark')!=dark:page.locator('#mode').click()
   row=measure();row.update(viewport=width,dark=dark);rows.append(row)
   card.screenshot(path=str(OUT/f'{"before" if a.baseline else "after"}-material-{width}-{"dark" if dark else "light"}.png'))
 (OUT/f'{"before" if a.baseline else "after"}-geometry.json').write_text(json.dumps({'rows':rows,'errors':errors},indent=2))
 if not a.baseline:
  for row in rows:check(row,True)
 if a.full and not a.baseline:
  theme=yaml.safe_load((ROOT/'themes/eleven_material.yaml').read_text())['Eleven Material']
  def paint(material,dark):
   tokens={'ha-card-border-radius':'12px','ha-card-border-width':'1px','ha-card-box-shadow':'none','primary-color':'#03a9f4','accent-color':'#a86ae0','error-color':'#db4437'}
   tokens.update({'primary-background-color':'#111111','card-background-color':'#1c1c1c','primary-text-color':'#e1e1e1','secondary-text-color':'#9b9b9b','secondary-background-color':'#282828','divider-color':'#424242'} if dark else {'primary-background-color':'#fafafa','card-background-color':'#fff','primary-text-color':'#212121','secondary-text-color':'#727272','secondary-background-color':'#f2f2f2','divider-color':'#e0e0e0'})
   tokens['ha-card-background']='var(--card-background-color)'
   if material:tokens.update({k:v for k,v in theme.items() if k!='modes'});tokens.update(theme['modes']['dark' if dark else 'light'])
   page.evaluate('''({tokens,dark})=>{const el=document.body;for(const k of [...el.style])if(k.startsWith('--'))el.style.removeProperty(k);for(const[k,v]of Object.entries(tokens))el.style.setProperty('--'+k,v);el.style.colorScheme=dark?'dark':'light'}''',{'tokens':{k:str(v) for k,v in tokens.items()},'dark':dark})
  matrix=[];stress=[];interactions=[]
  for width in [320,390,1280]:
   page.set_viewport_size({'width':width,'height':1200})
   for material,dark in [(False,False),(False,True),(True,False),(True,True)]:
    mode=('material' if material else 'ha')+('-dark' if dark else '-light');paint(material,dark);row=measure();check(row,True)
    row.update(viewport=width,mode=mode);matrix.append(row);card.screenshot(path=str(OUT/f'after-{mode}-{width}.png'))
  page.evaluate('''()=>{const c=records.find(r=>r.name==='overview-card').card;window.ov=c;window.ovBackup={config:structuredClone(c._config),hass:c.hass,history:structuredClone(c._history),units:structuredClone(c._units),start:c._start,end:c._end};window.resetOverview=()=>{clearTimeout(c._timer);c._sharedTimeframe=null;c._config=structuredClone(ovBackup.config);c._hass=ovBackup.hass;c._hassSignature=null;c._history=structuredClone(ovBackup.history);c._units=structuredClone(ovBackup.units);c._start=ovBackup.start;c._end=ovBackup.end;c._status='ready';c._render()}}''')
  for width in [320,390,1280]:
   page.set_viewport_size({'width':width,'height':1200});paint(True,width==390)
   for variant in ['long-title','synced-period','long-label-unit','large-signed','tiny','loading','empty','error','unavailable','no-graph-delta']:
    page.evaluate('''variant=>{resetOverview();const c=ov;const id=c._config.entities[0].entity;
     if(variant==='long-title'||variant==='synced-period')c._config.title='Sensoroverzicht van alle verdiepingen en de bijgebouwen';
     if(variant==='synced-period')c._sharedTimeframe={start:c._start,end:c._end};
     if(variant==='long-label-unit'){c._config.entities[0].name='Energieverbruik woonkamer en de aangrenzende keuken';c._hass={...c.hass,states:{...c.hass.states,[id]:{...c.hass.states[id],attributes:{...c.hass.states[id].attributes,unit_of_measurement:'kilowatt-hours per square metre'}}}}}
     if(['large-signed','tiny','unavailable'].includes(variant)){c._hass={...c.hass,states:{...c.hass.states,[id]:{...c.hass.states[id],state:variant==='large-signed'?'-123456789012.34':variant==='tiny'?'0.000000123':'unavailable'}}};}
     if(variant==='loading'||variant==='error')c._status=variant;
     if(variant==='empty')c._history={};
     if(variant==='no-graph-delta'){c._config.show_graph=false;c._config.show_delta=false}
     c._render()}''',variant)
    row=measure();check(row);stress.append({'width':width,'variant':variant,**row});card.screenshot(path=str(OUT/f'edge-{variant}-{width}.png'))
   # All supported count and column upper bounds, actual DOM containment.
   for count in range(1,9):
    for columns in ['auto','1','2','3']:
     page.evaluate('''({count,columns})=>{resetOverview();ov._config.columns=columns;ov._config.entities=Array.from({length:count},(_,i)=>({...ovBackup.config.entities[i%2],entity:'sensor.qa'+i,name:i===0?'Temperatuur woonkamer en aangrenzende keuken':'Sensor '+(i+1)}));ov._hass={...ov.hass,states:{...ov.hass.states,...Object.fromEntries(ov._config.entities.map((r,i)=>[r.entity,{state:String(20+i/10),attributes:{unit_of_measurement:i%2?'°C':'W'}}]))}};ov._render()}''',{'count':count,'columns':columns})
     row=measure();check(row);stress.append({'width':width,'variant':'count-columns','count':count,'configuredColumns':columns,**row})
   page.evaluate('resetOverview()');measure();card.locator('.metric').first.focus();page.evaluate("window.ovEvents=[];if(!ov._qaListener){ov.addEventListener('hass-more-info',e=>ovEvents.push(e.detail.entityId));ov._qaListener=true}");page.keyboard.press('Enter');assert page.evaluate('ovEvents.at(-1)')=='sensor.power'
   page.evaluate("ov.hass={...ov.hass,states:{...ov.hass.states,'sensor.power':{...ov.hass.states['sensor.power'],state:'512'}}}")
   assert card.evaluate("c=>c.shadowRoot.activeElement?.dataset.entity")== 'sensor.power';assert card.locator('.value').first.inner_text()=='512', (width,card.locator('.value').first.inner_text(),card.evaluate('c=>({signature:c._hassSignature,state:c.hass.states["sensor.power"].state})'))
   page.keyboard.press('Space');assert page.evaluate('ovEvents.length')==2
   page.evaluate("ov._status='error';ov._render();window.retryCalls=0;ov._hass={...ov.hass,callApi:async()=>{retryCalls++;return []}}")
   card.locator('.retry').focus();page.keyboard.press('Enter');page.wait_for_function("ov._status==='ready'");assert page.evaluate('retryCalls')==1
   assert card.evaluate("c=>c.shadowRoot.activeElement?.dataset.entity")== 'sensor.power', 'retry should return focus to first reading'
   interactions.append({'width':width,'keyboard':['Enter more-info','Space more-info','focus through synthetic hass update','retry request + return focus']})
  for variant,width in [('text-200',390),('zoom-200',780)]:
   page.set_viewport_size({'width':width,'height':1600});page.evaluate('resetOverview()');paint(True,False)
   if variant=='zoom-200':page.evaluate("document.body.style.zoom='2'")
   else:card.evaluate('''c=>{const s=document.createElement('style');s.id='qa-text';s.textContent='h2{font-size:32px}.period,.label,.delta,.status,.error{font-size:24px}.value{font-size:56px}.unit{font-size:26px}.caption,.spark{font-size:22px}';c.shadowRoot.append(s)}''')
   row=measure();check(row);stress.append({'variant':variant,**row});card.screenshot(path=str(OUT/f'{variant}.png'));page.evaluate("document.body.style.zoom='1'");card.evaluate("c=>c.shadowRoot.querySelector('#qa-text')?.remove()")
  # CSS-only theme ownership must preserve DOM/data colors.
  page.evaluate('resetOverview()');first=card.locator('.metric').first.element_handle();paint(False,False);native=card.locator('ha-card').evaluate('e=>({background:getComputedStyle(e).backgroundColor,shadow:getComputedStyle(e).boxShadow})');paint(True,True);assert first.evaluate('e=>e.isConnected');assert card.locator('.metric').first.evaluate("e=>getComputedStyle(e).getPropertyValue('--series-color').trim()")=='#e78a14'
  card.screenshot(path=str(OUT/'final-context-card.png'));page.screenshot(path=str(OUT/'final-page-context.png'))
  (OUT/'full-results.json').write_text(json.dumps({'matrix':matrix,'stress':stress,'interactions':interactions,'nativePaint':native,'errors':errors},indent=2))
  print(json.dumps({'matrix':len(matrix),'stress':len(stress),'interactions':len(interactions),'errors':errors}))
 assert not errors,errors
 b.close()
 print(json.dumps({'baseline':a.baseline,'initialCases':len(rows)}))
