"""Focused synthetic visual regression. No HA access; scoped standalone builds."""
import argparse, functools, http.server, json, threading
from pathlib import Path
import yaml
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-evidence/visual-weather-car';OUT.mkdir(parents=True,exist_ok=True)
parser=argparse.ArgumentParser();parser.add_argument('card',choices=['weather-card','car-card','appliance-planner','car-evcc']);args=parser.parse_args()
THEME=yaml.safe_load((ROOT/'themes/eleven_material.yaml').read_text())['Eleven Material']
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
results=[];errors=[];interactions=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':390,'height':1200},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
  # Use the existing review's actual MDI paths, not invisible unknown elements.
  icons=json.loads((ROOT/'review/icon-paths.json').read_text())
  icon_class=(ROOT/'review/ha-stub.js').read_text().splitlines()[1]
  page.add_init_script('const iconPaths='+json.dumps(icons)+';'+icon_class)
  page.goto(f'http://127.0.0.1:{server.server_port}/tests/fixtures/theme-following.html');page.wait_for_function('window.themeFixtureReady===true')
  page.evaluate('''name=>{window.record=records.find(r=>r.name===name);for(const a of document.querySelectorAll('article'))a.hidden=a!==record.card.parentElement;document.querySelector('main').style.display='block';for(const h of document.querySelectorAll('body>h1,body>p'))h.hidden=true;
  const sensor=(state,unit,friendly_name)=>({state:String(state),attributes:{unit_of_measurement:unit,friendly_name}});
  if(name==='car-card'){record.hass.states['sensor.odometer']=sensor(98452,'km','Kilometerstand');record.hass.states['sensor.range']=sensor(284,'km','Actieradius');record.card.setConfig({...record.card._config,field_3_entity:'sensor.power',field_3_label:'Vermogen'});record.card.hass={...record.hass};}
  if(name==='car-evcc'){
   const values={power:sensor(7.1,'kW'),soc:sensor(62,'%'),target_soc:sensor(80,'%'),range:sensor(284,'km'),remaining_duration:sensor(95,'min'),charged_energy:sensor(12.4,'kWh'),connected:sensor('on'),charging:sensor('on'),mode:{state:'pv',attributes:{options:['off','pv','minpv','now']}},solar_share:{state:'60',attributes:{min:0,max:100,step:10}}};
   const entities={};for(const [key,state]of Object.entries(values)){const domain=['connected','charging'].includes(key)?'binary_sensor':key==='mode'?'select':key==='solar_share'?'number':'sensor';const id=domain+'.visual_evcc_'+key;entities[key]=id;record.hass.states[id]=state;}
   record.calls=[];record.hass.callService=async(domain,service,data)=>{record.calls.push({domain,service,data});const state=record.hass.states[data.entity_id];state.state=String(data.option??data.value);record.card.hass={...record.hass};};
   record.card.setConfig({...record.card._config,entity:entities.power,entities,show_controls:true});record.card.hass={...record.hass};
  }
  }''',args.card)
  page.wait_for_timeout(250)
  for width in [320,390,1280]:
   page.set_viewport_size({'width':width,'height':1400})
   for material,dark in [(False,False),(False,True),(True,False),(True,True)]:
    mode=('material' if material else 'ha')+('-dark' if dark else '-light')
    tokens={'primary-color':'#1976d2','accent-color':'#c43174','primary-background-color':'#111' if dark else '#fafafa','card-background-color':'#1c1c1c' if dark else '#fff','primary-text-color':'#e1e1e1' if dark else '#212121','secondary-text-color':'#aaa' if dark else '#666','secondary-background-color':'#282828' if dark else '#eee','divider-color':'#555' if dark else '#ddd','ha-card-border-radius':'12px'}
    if material:tokens.update({k:v for k,v in THEME.items() if k!='modes'});tokens.update(THEME['modes']['dark' if dark else 'light'])
    page.evaluate('''({tokens,dark})=>{for(const k of [...document.body.style])if(k.startsWith('--'))document.body.style.removeProperty(k);for(const [k,v]of Object.entries(tokens))document.body.style.setProperty('--'+k,v);document.body.style.colorScheme=dark?'dark':'light';record.hass={...record.hass,themes:{darkMode:dark}};record.card.hass=record.hass;}''',{'tokens':tokens,'dark':dark})
    page.wait_for_timeout(100)
    row=page.evaluate('''()=>{const root=record.card.shadowRoot,ha=root.querySelector('ha-card'),rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}},style=n=>{const s=getComputedStyle(n);return {color:s.color,background:s.background,decoration:s.textDecorationLine,borderBottom:s.borderBottomWidth,minHeight:s.minHeight,whiteSpace:s.whiteSpace,overflowWrap:s.overflowWrap}};return {width:ha.clientWidth,scroll:ha.scrollWidth,metrics:[...root.querySelectorAll('[data-ui-metric] .ui-metric-value')].map(n=>({text:n.textContent.trim(),...rect(n),...style(n),scroll:n.scrollWidth,client:n.clientWidth})),tabs:[...root.querySelectorAll('[role=tab]')].map(n=>({...rect(n),...style(n),selected:n.getAttribute('aria-selected')})),picture:root.querySelector('.picture')?rect(root.querySelector('.picture')):null,summary:root.querySelector('.primary-label')?rect(root.querySelector('.primary-label')):null,quick:[...root.querySelectorAll('.quick button')].map(n=>({...rect(n),...style(n),pressed:n.getAttribute('aria-pressed')}))}}''')
    row.update({'viewport':width,'mode':mode})
    assert row['scroll']<=row['width']+1,('card overflow',row)
    if args.card=='weather-card':
     for metric in row['metrics']:
      assert metric['overflowWrap']!='anywhere',('metric numeric/word splitting',row)
      assert metric['scroll']<=metric['client']+1,('metric overflow',row)
     assert all(t['height']>=44 for t in row['tabs']),('tabs under 44px',row)
     assert all(t['borderBottom']=='0px' and t['color']=='rgb(196, 49, 116)' for t in row['tabs'] if t['selected']=='true'),('selected tab not accent/no underline',row)
    if args.card in ['car-card','car-evcc']:
     a,b=row['picture'],row['summary'];assert a['y']>=b['bottom'] or a['right']<=b['x'] or a['x']>=b['right'],('hero overlap',row)
     for metric in row['metrics']:
      assert metric['overflowWrap']!='anywhere' and metric['scroll']<=metric['client']+1,('numeric split/overflow',row)
    if args.card=='appliance-planner':
     assert any(q['pressed']=='true' for q in row['quick']),row
     assert all(q['decoration']=='none' and q['color']=='rgb(196, 49, 116)' for q in row['quick'] if q['pressed']=='true'),('quick selection',row)
    if args.card=='car-evcc':
     assert all(t['height']>=44 for t in row['tabs']),('EVCC tabs under 44px',row)
     assert all(t['borderBottom']=='0px' and t['color']=='rgb(196, 49, 116)' for t in row['tabs'] if t['selected']=='true'),('EVCC selection',row)
     active=page.locator('[data-card=car-evcc] .mode-options [aria-pressed=true]')
     before=active.evaluate('e=>({color:getComputedStyle(e).color,background:getComputedStyle(e).background})')
     active.hover()
     after=active.evaluate('e=>({color:getComputedStyle(e).color,background:getComputedStyle(e).background})')
     assert before==after and after['color']=='rgb(196, 49, 116)',('selected EVCC hover paint',before,after)
     page.mouse.move(0,0)
    page.locator(f'[data-card="{args.card}"]').screenshot(path=str(OUT/f'{args.card}-{width}-{mode}.png'))
    results.append(row)
  page.set_viewport_size({'width':390,'height':1400})
  card=page.locator(f'[data-card="{args.card}"]')
  if args.card=='weather-card':
   card.locator('[role=tab]').last.click()
   assert card.locator('[role=tab]').last.get_attribute('aria-selected')=='true'
   assert card.locator('[data-ui-tab-panel]').last.is_visible()
   card.locator('[role=tab]').last.press('Home')
   assert card.locator('[role=tab]').first.get_attribute('aria-selected')=='true'
   card.locator('[role=tab]').first.press('End')
   page.evaluate('''()=>{window.savedTab=record.card.shadowRoot.querySelector('[role=tab][aria-selected=true]');for(let i=0;i<5;i++){record.hass={...record.hass,states:{...record.hass.states,'weather.home':{...record.hass.states['weather.home'],attributes:{...record.hass.states['weather.home'].attributes,temperature:17+i}}}};record.card.hass=record.hass;}}''')
   assert page.evaluate("savedTab===record.card.shadowRoot.querySelector('[role=tab][aria-selected=true]')")
   interactions.extend(['forecast click/visible panel','Home/End keyboard tabs','selected node survives five telemetry updates'])
  elif args.card=='car-card':
   page.evaluate("record.card.addEventListener('hass-more-info',e=>window.lastInfo=e.detail.entityId)")
   card.locator('[data-car-field="2"]').click()
   assert page.evaluate('lastInfo')=='sensor.odometer'
   page.evaluate("record.card.setConfig({...record.card._config,compact:true,image_entity:'image.visual_car'});record.hass.states['image.visual_car']={state:'available',attributes:{entity_picture:'/cards/car-card/qa/evcc/car.svg'}};record.card.hass={...record.hass}")
   page.set_viewport_size({'width':320,'height':1400});page.wait_for_timeout(150)
   assert card.locator('.picture img').evaluate('(img)=>img.complete&&img.naturalWidth>0')
   assert page.evaluate("(()=>{const root=record.card.shadowRoot,a=root.querySelector('.picture').getBoundingClientRect(),b=root.querySelector('.primary-label').getBoundingClientRect();return a.y>=b.bottom})()")
   card.screenshot(path=str(OUT/'car-card-320-material-dark-compact-image.png'))
   interactions.extend(['odometer metric opens correct entity','compact image loads and keeps separate summary bounds'])
  elif args.card=='appliance-planner':
   quick=card.locator('.quick button')
   quick.first.click();page.wait_for_timeout(100)
   assert quick.first.get_attribute('aria-pressed')=='true'
   assert page.evaluate("record.card.form.deadline.startsWith(record.card.today(0))")
   quick.last.click();page.wait_for_timeout(100)
   assert quick.last.get_attribute('aria-pressed')=='true'
   assert page.evaluate("record.card.form.deadline.startsWith(record.card.today(1))")
   card.locator('summary').first.click()
   assert card.locator('details').first.get_attribute('open') is not None
   interactions.extend(['Today/Tomorrow update deadline and pressed state','advice disclosure opens'])
  else:
   tabs=card.locator('[role=tab]')
   tabs.nth(1).click()
   assert tabs.nth(1).get_attribute('aria-selected')=='true'
   tabs.nth(1).press('Home')
   assert tabs.first.get_attribute('aria-selected')=='true'
   assert all(h>=44 for h in card.locator('.mode-options button').evaluate_all('(nodes)=>nodes.map(n=>n.getBoundingClientRect().height)'))
   card.locator('[data-mode="now"]').click();page.wait_for_timeout(200)
   assert page.evaluate("record.calls.some(c=>c.domain==='select'&&c.service==='select_option'&&c.data.entity_id==='select.visual_evcc_mode'&&c.data.option==='now')")
   assert card.locator('[data-mode="now"]').get_attribute('aria-pressed')=='true'
   interactions.extend(['session tab click and Home keyboard navigation','44px mode buttons','Now mode keeps exact select.select_option payload and confirmation state'])
  if args.card!='car-card':
   selector='.quick [aria-pressed=true]' if args.card=='appliance-planner' else '[role=tab][aria-selected=true]'
   page.evaluate('''selector=>{window.overrideNode=record.card.shadowRoot.querySelector(selector);document.body.style.setProperty('--accent-color','#006f65');document.body.style.setProperty('--eleven-material-selection-background','rgb(219, 235, 232)');}''',selector)
   assert page.evaluate("getComputedStyle(overrideNode).color")=='rgb(0, 111, 101)'
   assert page.evaluate("getComputedStyle(overrideNode).backgroundColor")=='rgb(219, 235, 232)'
   assert page.evaluate("overrideNode.isConnected")
   interactions.append('CSS-only accent/selection background override updates live selected node')
   card.screenshot(path=str(OUT/f'{args.card}-390-theme-override.png'))
  assert not errors,errors
  (OUT/f'{args.card}-results.json').write_text(json.dumps({'cases':results,'interactions':interactions,'page_errors':errors},indent=2))
  print(json.dumps({'card':args.card,'cases':len(results),'interactions':interactions,'page_errors':errors}))
  browser.close()
finally:server.shutdown()
