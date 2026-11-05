"""History-only local real-renderer regression; synthetic HA, no live HA."""
import argparse,json,sys,yaml,re
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-evidence/history-refinement';OUT.mkdir(parents=True,exist_ok=True)
parser=argparse.ArgumentParser();parser.add_argument('--baseline',action='store_true');parser.add_argument('--stage',default='axes');parser.add_argument('--full',action='store_true');args=parser.parse_args()
URL='http://127.0.0.1:56515/JC5klAkxdKA9PmJO7YSGqy76RQb7-mo6C0aJPXHgbsI/cards/review/'
MEASURE="""c=>{const r=c.shadowRoot,q=s=>r.querySelector(s),box=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}},chart=q('.chart'),cb=box(chart),plot=box(q('.plot'));return {card:box(q('ha-card')),header:box(q('.card-header')),plot,chart:cb,labels:[...r.querySelectorAll('.axis-x,.axis-y,.axis-unit')].filter(e=>e.getBoundingClientRect().width&&getComputedStyle(e).display!=='none').map(e=>({kind:e.className,text:e.textContent,...box(e),font:getComputedStyle(e).fontSize})),visibleActions:[...r.querySelectorAll('.card-header [data-ui-button]')].filter(e=>e.checkVisibility()).map(e=>({text:e.getAttribute('aria-label')||e.textContent,...box(e)})),scroll:q('ha-card').scrollWidth,client:q('ha-card').clientWidth}}"""
results=[];errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':1100},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(URL);page.wait_for_function('window.themeFixtureReady===true');card=page.locator('[data-card=history-graph-card]');page.wait_for_function("records[0].card._status==='ready'")
 for width in [320,390,1280]:
  page.set_viewport_size({'width':width,'height':1100})
  for dark in [False,True]:
   if page.evaluate('window.reviewDark')!=dark:page.locator('#mode').click()
   card.scroll_into_view_if_needed();page.wait_for_timeout(120)
   row=card.evaluate(MEASURE);row.update(viewport=width,dark=dark);results.append(row)
   card.screenshot(path=str(OUT/f'{"before" if args.baseline else "after"}-material-{width}-{"dark" if dark else "light"}.png'))
 (OUT/f'{"before" if args.baseline else "after"}-geometry.json').write_text(json.dumps({'rows':results,'errors':errors},indent=2))
 if not args.baseline:
  for row in results:
   assert row['header']['h']<=100,('header should have one timeframe row, secondary tools disclosed',row)
   assert row['scroll']<=row['client']+1,row
   assert all(x['w']>=43.9 and x['h']>=43.9 for x in row['visibleActions']),row
   if args.stage=='axes':
    for label in row['labels']:
     assert label['x']>=row['chart']['x']+9.5 and label['right']<=row['chart']['right']-9.5,('label touches inset edge',label,row)
    labels=[x for x in row['labels'] if x['kind']=='axis-x']
    assert all(a['right']+7<=b['x'] for a,b in zip(labels,labels[1:])),('time label collision',row)
 if args.full and not args.baseline:
  theme=yaml.safe_load((ROOT/'themes/eleven_material.yaml').read_text())['Eleven Material']
  def paint(material,dark):
   d={'ha-card-border-radius':'12px','ha-card-border-width':'1px','ha-card-box-shadow':'none','primary-color':'#03a9f4','accent-color':'#a86ae0','error-color':'#db4437','text-primary-color':'#fff'}
   d.update({'primary-background-color':'#111111','card-background-color':'#1c1c1c','primary-text-color':'#e1e1e1','secondary-text-color':'#9b9b9b','secondary-background-color':'#282828','divider-color':'#424242'} if dark else {'primary-background-color':'#fafafa','card-background-color':'#ffffff','primary-text-color':'#212121','secondary-text-color':'#727272','secondary-background-color':'#f2f2f2','divider-color':'#e0e0e0'})
   d['ha-card-background']='var(--card-background-color)'
   if material:d.update({k:v for k,v in theme.items() if k!='modes'});d.update(theme['modes']['dark' if dark else 'light'])
   d['primary-color']='#03a9f4';d['accent-color']='#a86ae0'
   page.evaluate('''({tokens,dark})=>{const b=document.body;for(const k of [...b.style])if(k.startsWith('--'))b.style.removeProperty(k);for(const [k,v]of Object.entries(tokens))b.style.setProperty('--'+k,v);b.style.colorScheme=dark?'dark':'light';const c=records[0].card;c.hass={...c.hass,themes:{darkMode:dark}}}''',{'tokens':{k:str(v) for k,v in d.items()},'dark':dark})
   page.wait_for_timeout(100)
  def check(row):
   assert row['scroll']<=row['client']+1,('overflow',row)
   assert row['plot']['w']>30 and row['plot']['h']>30,('unusable plot',row)
   assert row['chart']['bottom']<=row['card']['bottom']-9,('chart escapes card surface',row)
   for x in row['labels']:
    assert x['x']>=row['chart']['x']+9.5 and x['right']<=row['chart']['right']-9.5,('axis inset',x,row)
    assert x['y']>=row['chart']['y']+9 and x['bottom']<=row['chart']['bottom']-9,('vertical inset',x,row)
   for left in set(round(x['x']) for x in row['labels'] if x['kind']=='axis-y'):
    ys=sorted([x for x in row['labels'] if x['kind']=='axis-y' and round(x['x'])==left],key=lambda x:x['y'])
    assert all(a['bottom']+5<=z['y'] for a,z in zip(ys,ys[1:])),('vertical tick collision',row)
   times=[x for x in row['labels'] if x['kind']=='axis-x']
   assert all(a['right']+7<=z['x'] for a,z in zip(times,times[1:])),('time overlap',row)
   assert all(x['w']>=43.9 and x['h']>=43.9 for x in row['visibleActions']),('targets',row)
  matrix=[];interactions=[];stress=[]
  expected_colors=card.locator('.series-line').evaluate_all('els=>els.map(e=>getComputedStyle(e).stroke)')
  for width in [320,390,1280]:
   page.set_viewport_size({'width':width,'height':1100})
   for material,dark in [(False,False),(False,True),(True,False),(True,True)]:
    mode=('material' if material else 'ha')+('-dark' if dark else '-light');paint(material,dark);card.scroll_into_view_if_needed()
    row=card.evaluate(MEASURE);row.update(viewport=width,mode=mode);check(row);assert row['header']['h']<=100,row
    assert row['card']['bottom']-row['chart']['bottom']<=16,('normal plot must use available height',row)
    assert all(x['h']<=14.5 for x in row['labels'] if x['kind']=='axis-x'),('ordinary endpoint labels should not acquire a legacy 48px column',row)
    axis_paint=card.evaluate('c=>{const r=c.shadowRoot,axis=getComputedStyle(r.querySelector(".axis-y")),chart=getComputedStyle(r.querySelector(".chart")),card=getComputedStyle(r.querySelector("ha-card"));return {foreground:axis.color,background:chart.backgroundColor==="rgba(0, 0, 0, 0)"?card.backgroundColor:chart.backgroundColor}}')
    def lum(color):
     rgb=[float(v)/255 for v in re.findall(r'[\d.]+',color)[:3]];linear=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb];return sum(a*b for a,b in zip(linear,[.2126,.7152,.0722]))
    la,lb=sorted([lum(axis_paint['foreground']),lum(axis_paint['background'])]);axis_paint['ratio']=(lb+.05)/(la+.05);assert axis_paint['ratio']>=4.5,axis_paint;row['axis_contrast']=axis_paint
    card.screenshot(path=str(OUT/f'after-{mode}-{width}.png'));matrix.append(row)
    assert card.locator('.legend').bounding_box()['height']<=60,('legend should group reading below its label',row)
    # Original data color stays orange/blue despite a purple selection accent.
    colors=card.locator('.series-line').evaluate_all('els=>els.map(e=>getComputedStyle(e).stroke)');assert colors==expected_colors,colors
  (OUT/'matrix.json').write_text(json.dumps(matrix,indent=2))
  # Genuine event-driven controls, including the preserved lower-priority actions.
  for width,dark in [(320,False),(390,True),(1280,False)]:
   page.set_viewport_size({'width':width,'height':1100});paint(True,dark);card.scroll_into_view_if_needed()
   card.locator('.history-tools summary').focus();page.keyboard.press('Enter');assert card.locator('.history-tools').get_attribute('open') is not None
   card.evaluate('c=>c._render()');assert card.evaluate('c=>c.shadowRoot.activeElement.matches(".history-tools summary")')
   card.locator('[data-zoom=in]').click();assert card.evaluate('c=>c._viewport[1]-c._viewport[0]')==43200000
   assert 'Ingezoomd' in card.locator('.period-trigger').get_attribute('aria-description')
   assert card.locator('.history-tools').get_attribute('open') is not None
   card.locator('[data-zoom=reset]').click();assert card.evaluate('c=>c._viewport===null')
   href=card.locator('.history-link').get_attribute('href');assert 'sensor.power%2Csensor.temperature' in href,href
   card.screenshot(path=str(OUT/f'tools-{width}-{"dark" if dark else "light"}.png'))
   card.locator('[data-insight=data]').click();assert card.locator('.insight-popup').is_visible();card.locator('.insight-popup').screenshot(path=str(OUT/f'information-{width}.png'));page.keyboard.press('Escape')
   # Dismiss disclosure via its own keyboard handler, then by outside pointer.
   card.locator('.history-tools summary').focus();page.keyboard.press('Escape');assert card.locator('.history-tools').get_attribute('open') is None
   card.locator('.history-tools summary').click();card.locator('h2').click();assert card.locator('.history-tools').get_attribute('open') is None
   card.locator('.period-trigger').click();assert card.locator('.period-menu').is_visible()
   selected=card.locator('.period-menu [data-period-option][aria-checked=true]').evaluate('e=>getComputedStyle(e).color');assert selected=='rgb(168, 106, 224)',selected
   card.locator('[data-period-option="6h"]').click();page.wait_for_function("records[0].card._status==='ready'&&records[0].card._end-records[0].card._start===21600000")
   period=card.evaluate('c=>[c._start,c._end]');assert card.evaluate('c=>c._rawSeries.every(s=>s.points.every(p=>p.t>=c._start&&p.t<=c._end))')
   card.locator('[data-period=previous]').click();page.wait_for_function('(end)=>records[0].card._status===\'ready\'&&records[0].card._end===end',arg=period[0])
   card.locator('[data-period=next]').click();page.wait_for_function("records[0].card._status==='ready'&&records[0].card._periodOffset===0");assert abs(card.evaluate('c=>c._end')-period[1])<5000
   card.locator('[data-period=now]').click();page.wait_for_function("records[0].card._status==='ready'")
   # Configured/default period, date-specific day, custom range forms.
   card.locator('.period-trigger').click();card.locator('[data-period-tab=calendar]').click();card.locator('[data-period-option=today]').click();page.wait_for_function("records[0].card._status==='ready'");assert card.evaluate("c=>new Date(c._start).toLocaleString('en-CA',{timeZone:'Europe/Amsterdam',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})==='00:00'")
   card.locator('.period-trigger').click();card.locator('[data-period-tab=custom]').click();card.locator('[data-custom-field=start]').fill('2026-10-28T08:00');card.locator('[data-custom-field=end]').fill('2026-10-29T20:00');card.locator('.period-custom [type=submit]').click();page.wait_for_function("records[0].card._status==='ready'&&records[0].card._end-records[0].card._start===129600000")
   check(card.evaluate(MEASURE));card.screenshot(path=str(OUT/f'custom-{width}.png'))
   card.locator('.period-trigger').click();card.locator('[data-period-tab=rolling]').click();card.locator('[data-period-option=configured]').click();page.wait_for_function("records[0].card._status==='ready'&&records[0].card._end-records[0].card._start===86400000")
   # Legend toggles/isolation via keyboard preserve focus and config.
   first=card.locator('.legend-item').first;first.focus();page.keyboard.press('Enter');assert first.get_attribute('aria-pressed')=='false';page.keyboard.press('Enter');page.keyboard.press('Shift+Enter');assert card.locator('.legend-item[aria-pressed=true]').count()==1;page.keyboard.press('Shift+Enter');assert card.locator('.legend-item[aria-pressed=true]').count()==2
   chart=card.locator('.chart');chart.focus();page.keyboard.press('Home');assert card.locator('.tooltip').is_visible();page.keyboard.press('End');assert card.evaluate('c=>c._cursor===c._viewEnd');page.keyboard.press('Escape');assert not card.locator('.tooltip').is_visible()
   plot=card.locator('.plot').bounding_box();page.mouse.move(plot['x']+plot['width']/2,plot['y']+plot['height']/2);assert card.locator('.tooltip').is_visible()
   geom=card.evaluate('c=>{const r=c.shadowRoot,p=r.querySelector(".plot").getBoundingClientRect(),g=r.querySelector(".guide").getBoundingClientRect();return {plot:p.toJSON(),guide:g.toJSON()}}');assert abs(geom['plot']['y']-geom['guide']['y'])<1 and abs(geom['plot']['height']-geom['guide']['height'])<1,geom
   page.mouse.move(0,0);chart.dispatch_event('pointerdown',{'pointerType':'touch','pointerId':77,'clientX':plot['x']+plot['width']/2,'clientY':plot['y']+plot['height']/2});assert card.locator('.tooltip').is_visible();chart.dispatch_event('pointerup',{'pointerType':'touch','pointerId':77});chart.focus();page.keyboard.press('Escape')
   page.mouse.move(plot['x']+plot['width']*.2,plot['y']+plot['height']/2);page.mouse.down();page.mouse.move(plot['x']+plot['width']*.8,plot['y']+plot['height']/2,steps=4);page.mouse.up();assert card.evaluate('c=>!!c._viewport');card.locator('.history-tools summary').click();card.locator('[data-zoom=reset]').click();card.locator('.history-tools summary').click()
   interactions.append({'width':width,'dark':dark,'checks':['native disclosure keyboard/Escape/outside','zoom/reset/context','History href','information','purple accent selection','6h actual requested data','previous/next/now','calendar/custom/configured period','legend keyboard toggle/isolate','keyboard tooltip endpoints','mouse hover/guide geometry','touch pointer','drag zoom']})
  # Exercise edge data in the actual renderer; requests remain synthetic.
  page.set_viewport_size({'width':320,'height':1100});paint(True,False)
  page.evaluate('''()=>{const c=records[0].card;window.hBackup={config:structuredClone(c._config),series:structuredClone(c._rawSeries),hass:c._hass};window.resetHistory=()=>{c._config=structuredClone(hBackup.config);c._hass=hBackup.hass;c._visibility=new Map();c._rawSeries=structuredClone(hBackup.series);c._processedRaw=null;c._viewport=null;c._status='ready';c._render()}}''')
  variants=['large-signed','tiny','long-units-names','single-unit','all-hidden','sparse','missing','loading','error','long-title']
  for variant in variants:
   page.evaluate('''variant=>{resetHistory();const c=records[0].card;if(variant==='large-signed'||variant==='tiny'){c._rawSeries=c._rawSeries.map((s,i)=>({...s,points:s.points.map((p,j)=>({...p,v:variant==='tiny'?(i?.00002:.000003)*(j%10-4):(i?400000:10000000)*(j%10-4)}))}));c._processedRaw=null;}if(variant==='long-units-names'){c._hass={...c._hass,states:{...c._hass.states,'sensor.power':{...c._hass.states['sensor.power'],attributes:{...c._hass.states['sensor.power'].attributes,unit_of_measurement:'kilowatt-hours per square metre'}}}};c._config.series_options[0].name='Energieverbruik woonkamer en keuken';}if(variant==='single-unit'){c._hass={...c._hass,states:{...c._hass.states,'sensor.temperature':{...c._hass.states['sensor.temperature'],attributes:{...c._hass.states['sensor.temperature'].attributes,unit_of_measurement:'W'}}}};}if(variant==='all-hidden')for(const id of c._config.entities)c._visibility.set(id,false);if(variant==='sparse'){c._rawSeries=c._rawSeries.map(s=>({...s,points:s.points.map((p,j)=>({...p,v:j%5===0?p.v:null}))}));c._processedRaw=null;}if(variant==='missing'){c._rawSeries=c._rawSeries.map(s=>({...s,points:s.points.map(p=>({...p,v:null}))}));c._processedRaw=null;}if(['loading','error'].includes(variant))c._status=variant;if(variant==='long-title')c._config.title='Historisch energieverbruik van alle verdiepingen en bijgebouwen';c._render()}''',variant)
   page.wait_for_timeout(80);card.scroll_into_view_if_needed();card.screenshot(path=str(OUT/f'edge-{variant}-320.png'))
   if variant not in ['loading','error']:
    clipped=card.locator('.legend-item').evaluate_all('els=>els.flatMap(e=>[...e.querySelectorAll("strong,span")].filter(n=>{const r=document.createRange();r.selectNodeContents(n);return r.getBoundingClientRect().right>e.getBoundingClientRect().right+1}).map(n=>n.textContent))');assert not clipped,('clipped legend text',variant,clipped)
    row=card.evaluate(MEASURE);check(row);stress.append({'variant':variant,**row})
   else:assert card.locator('.state').is_visible();stress.append({'variant':variant,'status':card.locator('.state').inner_text()})
  page.evaluate('resetHistory()')
  # Browser page zoom via CSS zoom (layout reflows), separately 200% text only.
  for test,width in [('zoom-200',780),('text-200',390)]:
   page.set_viewport_size({'width':width,'height':1300})
   if test=='zoom-200':page.evaluate("document.body.style.zoom='2'")
   else:card.evaluate('c=>{const s=document.createElement("style");s.id="textzoom";s.textContent=".card-header h2{font-size:32px}.history-timeframe .period-trigger,.header-actions [data-ui-button],.legend-item,.legend-item strong{font-size:24px}.axis-x,.axis-y{font-size:22px}.axis-unit{font-size:20px}";c.shadowRoot.append(s)}')
   page.wait_for_timeout(150);card.scroll_into_view_if_needed();row=card.evaluate(MEASURE)
   if test=='text-200':check(row)
   else:assert row['scroll']<=row['client']+1,row
   card.screenshot(path=str(OUT/f'{test}.png'));stress.append({'variant':test,**row});page.evaluate("document.body.style.zoom='1'");card.evaluate('c=>c.shadowRoot.querySelector("#textzoom")?.remove()')
  page.emulate_media(forced_colors='active');assert card.locator('ha-card').evaluate('e=>getComputedStyle(e).boxShadow')=='none';page.emulate_media(forced_colors='none')
  # Native Chromium touch synthesis, not just dispatchEvent pointer stubs.
  touch_context=b.new_context(viewport={'width':390,'height':1100},is_mobile=True,has_touch=True,reduced_motion='reduce');tp=touch_context.new_page();tp.on('pageerror',lambda e:errors.append(str(e)));tp.goto(URL);tp.wait_for_function("window.themeFixtureReady&&records[0].card._status==='ready'")
  tc=tp.locator('[data-card=history-graph-card]');tc.scroll_into_view_if_needed();tp.wait_for_timeout(150);tb=tc.locator('.plot').bounding_box();session=touch_context.new_cdp_session(tp)
  y=tb['y']+tb['height']/2
  for kind,ratio in [('touchStart',.3),('touchMove',.7)]:
   session.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[{'x':tb['x']+tb['width']*ratio,'y':y,'id':9}]});tp.wait_for_timeout(60)
  native=tc.evaluate('c=>({cursor:c._cursor,start:c._viewStart,end:c._viewEnd,pinned:c._pinned})');assert abs(native['cursor']-(native['start']+.7*(native['end']-native['start'])))<(native['end']-native['start'])/tb['width'],native
  session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});tp.wait_for_timeout(80);assert tc.evaluate('c=>c._pinned&&c._cursor')==native['cursor']
  tc.evaluate("c=>{c.hass={...c.hass,states:{...c.hass.states,'sensor.power':{...c.hass.states['sensor.power'],attributes:{...c.hass.states['sensor.power'].attributes,friendly_name:'Vermogen bijgewerkt'}}}}}");tp.wait_for_timeout(80);assert tc.evaluate('c=>c._cursor')==native['cursor'];assert tc.locator('.tooltip').is_visible();tc.screenshot(path=str(OUT/'native-touch-390.png'));touch_context.close()
  (OUT/'full-results.json').write_text(json.dumps({'matrix':matrix,'interactions':interactions,'stress':stress,'native_touch':native,'errors':errors},indent=2))
  print(json.dumps({'matrix_cases':len(matrix),'interaction_sets':len(interactions),'stress_cases':len(stress),'page_errors':errors}))
 assert not errors,errors
 print(json.dumps({'cases':len(results),'page_errors':errors,'baseline':args.baseline,'stage':args.stage}))
 b.close()
