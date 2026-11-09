"""Energy refinement real served renderer, synthetic HA; no HA access."""
import argparse,json,re,yaml
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-evidence/energy-refinement';OUT.mkdir(parents=True,exist_ok=True)
a=argparse.ArgumentParser();a.add_argument('--baseline',action='store_true');a.add_argument('--full',action='store_true');args=a.parse_args()
URL='http://127.0.0.1:56515/JC5klAkxdKA9PmJO7YSGqy76RQb7-mo6C0aJPXHgbsI/cards/review/'
THEME=yaml.safe_load((ROOT/'themes/eleven_material.yaml').read_text())['Eleven Material']
MEASURE="""c=>{const r=c.shadowRoot,q=s=>r.querySelector(s),box=e=>{const b=e.getBoundingClientRect();return {text:e.textContent,x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}},chart=q('.chart');return {host:box(c),card:box(q('ha-card')),header:box(q('.header')||q('.compact-summary')),chart:box(chart),labels:[...r.querySelectorAll('.chart-label')].filter(e=>!e.hidden&&e.checkVisibility()).map(e=>({kind:e.className,...box(e)})),titleFont:q('h2')?getComputedStyle(q('h2')).fontSize:null,metrics:[...r.querySelectorAll('.current-metric')].map(n=>({label:box(n.querySelector('.current-label')),value:box(n.querySelector('.current strong'))})),scroll:q('ha-card').scrollWidth,client:q('ha-card').clientWidth,targets:[...r.querySelectorAll('.legend-series')].map(box),plot:c._chart?{left:c._chart.xFor(c._chart.start),right:c._chart.xFor(c._chart.start+c._chart.span),svgWidth:c._chart.svgWidth}:null}}"""
errors=[];matrix=[];stress=[];interactions=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':1100},timezone_id='Europe/Amsterdam',reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
 from datetime import datetime,timezone
 page.clock.install(time=datetime(2026,10,30,21,30,tzinfo=timezone.utc))
 page.goto(URL);page.wait_for_function('()=>window.themeFixtureReady===true');card=page.locator('[data-card=dynamic-energy-price-card]');card.scroll_into_view_if_needed()
 page.evaluate("window.energy=records.find(r=>r.name==='dynamic-energy-price-card')")
 def paint(material,dark):
  d={'ha-card-border-radius':'12px','ha-card-border-width':'1px','ha-card-box-shadow':'none','primary-color':'#03a9f4','accent-color':'#a86ae0','error-color':'#db4437','warning-color':'#ffa600','text-primary-color':'#fff'}
  d.update({'primary-background-color':'#111111','card-background-color':'#1c1c1c','primary-text-color':'#e1e1e1','secondary-text-color':'#9b9b9b','secondary-background-color':'#282828','divider-color':'#424242'} if dark else {'primary-background-color':'#fafafa','card-background-color':'#ffffff','primary-text-color':'#212121','secondary-text-color':'#727272','secondary-background-color':'#f2f2f2','divider-color':'#e0e0e0'})
  if material:d.update({k:v for k,v in THEME.items() if k!='modes'});d.update(THEME['modes']['dark' if dark else 'light'])
  d.update({'primary-color':'#03a9f4','accent-color':'#a86ae0'})
  page.evaluate("""({tokens,dark})=>{for(const k of [...document.body.style])if(k.startsWith('--'))document.body.style.removeProperty(k);for(const [k,v]of Object.entries(tokens))document.body.style.setProperty('--'+k,String(v));document.body.style.colorScheme=dark?'dark':'light';energy.card.hass={...energy.card._hass,themes:{darkMode:dark}}}""",{'tokens':d,'dark':dark});page.wait_for_timeout(150)
 def check(row,normal=False):
  assert row['scroll']<=row['client']+1,('overflow',row)
  assert row['card']['h']<=row['host']['h']+2.1,('surface must participate in dashboard layout, not overflow fixed host',row)
  assert row['chart']['bottom']<=row['card']['bottom']-9,('chart escapes card',row)
  if normal:
   assert row['titleFont']=='16px',('calm 16px title',row)
   assert all(abs(m['value']['x']-m['label']['x'])<1 for m in row['metrics']),('group reading aligns with label',row)
  labels=row['labels'];cb=row['chart']
  for n in labels:
   assert n['x']>=cb['x']+9.4 and n['right']<=cb['right']-9.4,('label edge inset',n,row)
   assert n['y']>=cb['y']+9.4 and n['bottom']<=cb['bottom']-9.4,('vertical inset',n,row)
  xs=sorted([n for n in labels if 'x-label' in n['kind']],key=lambda n:n['x'])
  assert len(xs)>=2,('time context',row)
  assert all(z['x']>=n['right']+7.5 for n,z in zip(xs,xs[1:])),('time collision',row)
  ys=sorted([n for n in labels if n['kind']=='chart-label y-label'],key=lambda n:n['y'])
  assert all(z['y']>=n['bottom']+7 for n,z in zip(ys,ys[1:])),('scale collision',row)
  if row['plot']:
   plotLeft=cb['x']+row['plot']['left']/row['plot']['svgWidth']*cb['w']
   assert all(plotLeft>=n['right']+7.4 for n in ys),('measured scale gap',row)
  refs=[n for n in labels if any(s in n['kind'] for s in ['day-label','average-label','level-label','now-label'])]
  for i,n in enumerate(refs):
   for z in refs[i+1:]:assert not(n['x']<z['right']+4 and n['right']+4>z['x'] and n['y']<z['bottom']+4 and n['bottom']+4>z['y']),('annotation collision',n,z,row)
  assert all(t['w']>=44 and t['h']>=44 for t in row['targets']),('targets',row)
 for width in [320,390,1280]:
  page.set_viewport_size({'width':width,'height':1100})
  for material,dark in [(False,False),(False,True),(True,False),(True,True)]:
   paint(material,dark);card.scroll_into_view_if_needed();row=card.evaluate(MEASURE);mode=('material' if material else 'ha')+('-dark' if dark else '-light');row.update(viewport=width,mode=mode)
   card.screenshot(path=str(OUT/f'{"before" if args.baseline else "after"}-{mode}-{width}.png'));matrix.append(row)
 (OUT/f'{"before" if args.baseline else "after"}-geometry.json').write_text(json.dumps({'matrix':matrix,'errors':errors},indent=2))
 if not args.baseline:
  for row in matrix:check(row,True)
 if args.full and not args.baseline:
  page.evaluate("window.energyBackup={config:structuredClone(energy.card._config),hass:energy.card._hass};window.resetEnergy=()=>{energy.card._hiddenSeries.clear();energy.card.setConfig(structuredClone(energyBackup.config));energy.card.hass=energyBackup.hass}")
  for variant in ['two-day','dual-tariff','consumption','export-only','large-signed','tiny','long-title','no-title','all-hidden','missing','missing-source','levels-off','no-table-columns','averages-table']:
   page.set_viewport_size({'width':320,'height':1300});paint(True,False)
   page.evaluate("""v=>{resetEnergy();const c=energy.card;if(v==='dual-tariff'||v==='averages-table'){c.setConfig({...c._config,graph_mode:'both',current_price_mode:'both',export_entity:'sensor.price',export_price_offset:-.04,cheapest_hours:3,export_best_hours:3,show_cheapest_table:true,show_export_table:true,show_period_average:true,show_average_line:true,tomorrow_after:0});}if(['large-signed','tiny'].includes(v)){const states={...c._hass.states},s=states['sensor.price'];states['sensor.price']={...s,attributes:{...s.attributes,data:s.attributes.data.map((d,i)=>({...d,price_per_kwh:v==='tiny'?.0000001*(i%7-3):100000*(i%7-3)}))}};c.hass={...c._hass,states};}if(v==='long-title')c.setConfig({...c._config,title:'Dynamische elektriciteitsprijzen voor alle aansluitingen en bijgebouwen'});if(v==='no-title')c.setConfig({...c._config,show_title:false,cheapest_hours:3});if(v==='all-hidden'){c._hiddenSeries.add('import');c._render();}if(v==='missing'){const states={...c._hass.states};states['sensor.price']={...states['sensor.price'],attributes:{...states['sensor.price'].attributes,data:[]}};c.hass={...c._hass,states};}if(v==='missing-source')c.setConfig({...c._config,entity:'sensor.missing'});if(v==='consumption'){c._hass={...c._hass,connection:new EventTarget()};c.setConfig({...c._config,show_consumption:true,consumption_entity:'sensor.energy'});c.hass={...c._hass,states:{...c._hass.states,'sensor.energy':{state:'300',attributes:{unit_of_measurement:'kWh',device_class:'energy',state_class:'total_increasing'}}},callApi:async(method,url)=>{const [path,q]=url.split('?'),start=Date.parse(decodeURIComponent(path.split('/').at(-1))),end=Date.parse(new URLSearchParams(q).get('end_time'));return [Array.from({length:Math.floor((end-start)/300000)+1},(_,i)=>({state:String(100+i*.1),last_changed:new Date(start+i*300000).toISOString(),last_updated:new Date(start+i*300000).toISOString()}))]}};}if(v==='export-only')c.setConfig({...c._config,graph_mode:'export',current_price_mode:'none',export_entity:'sensor.price'});if(v==='no-table-columns')c.setConfig({...c._config,cheapest_hours:3,show_cheapest_table:true,...Object.fromEntries(['day','type','start','end','duration','average'].map(k=>['show_period_'+k,false]))});if(v==='levels-off')c.setConfig({...c._config,show_price_levels:false});c.hass=c._hass}""",variant)
   page.wait_for_timeout(200)
   if variant=='two-day':assert card.locator('.day-label').count()==2
   if variant=='consumption':assert card.locator('.consumption-line').count()==1 and card.locator('.energy-axis-label').count()==5,card.evaluate('c=>({consumption:c._consumption,config:c._config})')
   if variant=='no-table-columns':assert card.locator('.price-periods').count()==0,'No empty secondary disclosure when every optional table column is disabled'
   if variant=='levels-off':assert card.locator('.level-label,.level-line').count()==0
   if variant=='export-only':assert card.locator('.import-line').count()==0 and card.locator('.export-line').count()==1
   if variant=='averages-table':
    details=card.locator('.price-periods');assert details.count()==1,'Optional price table must live in an accessible secondary disclosure'
    summary=details.locator('summary');summary.focus();page.keyboard.press('Enter');page.wait_for_timeout(150);assert card.locator('.favorable-table').is_visible();assert card.locator('.favorable-table tbody tr').count()>0
    tableFit=card.evaluate("c=>{const r=c.shadowRoot,box=s=>r.querySelector(s).getBoundingClientRect().toJSON();return {card:box('ha-card'),host:c.getBoundingClientRect().toJSON(),table:box('.price-table-wrap'),open:r.querySelector('.price-periods').open,required:c.style.getPropertyValue('--energy-required-height')}}");assert tableFit['open'] and tableFit['table']['bottom']<=tableFit['card']['bottom']-9 and tableFit['card']['height']<=tableFit['host']['height']+2.1,tableFit
    tableWrap=card.locator('.price-table-wrap');tableWrap.focus();page.keyboard.press('ArrowDown');page.wait_for_timeout(100);assert tableWrap.evaluate('e=>e.scrollHeight<=e.clientHeight||e.scrollTop>0'),'overflowing optional table is keyboard scrollable';tableWrap.evaluate('e=>e.scrollTop=0')
    card.screenshot(path=str(OUT/'table-open-320.png'));summary.focus();page.keyboard.press('Enter');assert not card.locator('.favorable-table').is_visible()
   card.scroll_into_view_if_needed();card.screenshot(path=str(OUT/f'edge-{variant}-320.png'))
   if card.locator('.chart').count():row=card.evaluate(MEASURE);check(row);stress.append({'variant':variant,**row})
   else:assert card.locator('ha-card').inner_text();stress.append({'variant':variant,'state':card.locator('ha-card').inner_text()})
  page.evaluate('resetEnergy()')
  for width in [320,390,1280]:
   page.set_viewport_size({'width':width,'height':1100});paint(True,width==390);card.scroll_into_view_if_needed();chart=card.locator('.chart');chart.focus();page.keyboard.press('ArrowLeft');assert card.locator('.tooltip').is_visible();page.keyboard.press('Escape');assert not card.locator('.tooltip').is_visible()
   toggle=card.locator('.legend-series').first;toggle.focus();page.keyboard.press('Enter');assert toggle.get_attribute('aria-pressed')=='false';page.keyboard.press('Enter');assert toggle.get_attribute('aria-pressed')=='true'
   cb=chart.bounding_box();page.mouse.move(cb['x']+cb['width']*.55,cb['y']+cb['height']*.5);assert card.locator('.tooltip').is_visible();page.mouse.move(0,0);page.keyboard.press('Escape')
   cdp=page.context.new_cdp_session(page);cb=chart.bounding_box();cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':cb['x']+cb['width']*.6,'y':cb['y']+cb['height']*.6}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});assert card.locator('.tooltip').is_visible();chart.focus();page.keyboard.press('Escape');cdp.detach()
   interactions.append({'width':width,'keyboard':True,'legend':True,'mouse':True,'native_cdp_touch':True})
  for variant,width in [('zoom-200',780),('text-200',390)]:
   page.set_viewport_size({'width':width,'height':1300})
   if variant=='zoom-200':page.evaluate("document.body.style.zoom='2'")
   else:card.evaluate("c=>{c._originalStyles=c._styles;c._styles=function(){return this._originalStyles()+':host{--font-size-title:32px;--font-size-value:32px;--font-size-label:24px;--font-size-meta:22px}'};c._render()}")
   page.wait_for_timeout(200);card.scroll_into_view_if_needed();row=card.evaluate(MEASURE)
   if variant=='text-200':check(row)
   else:assert row['scroll']<=row['client']+1,row
   card.screenshot(path=str(OUT/f'{variant}.png'));stress.append({'variant':variant,**row});page.evaluate("document.body.style.zoom='1'");card.evaluate("c=>c.shadowRoot.querySelector('#textzoom')?.remove()")
 (OUT/'full-results.json').write_text(json.dumps({'matrix':matrix,'stress':stress,'interactions':interactions,'errors':errors},indent=2))
 assert not errors,errors
 print(json.dumps({'matrix':len(matrix),'stress':len(stress),'interactions':len(interactions),'baseline':args.baseline,'page_errors':errors}))
 b.close()
