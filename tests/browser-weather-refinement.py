"""Weather-only served-collection regression and screenshot evidence (synthetic HA)."""
import json, os, yaml
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-evidence/weather-refinement';OUT.mkdir(exist_ok=True)
TOKEN=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text())['token']
URL=f'http://127.0.0.1:56515/{TOKEN}/cards/review/'
THEME=yaml.safe_load((ROOT/'themes/eleven_material.yaml').read_text())['Eleven Material']
errors=[];matrix=[];stress=[];interactions=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':1400},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(URL);page.wait_for_function('window.themeFixtureReady');card=page.locator('[data-card=weather-card]');card.scroll_into_view_if_needed()
 page.evaluate("window.wr=records.find(r=>r.name==='weather-card');window.wc=wr.card;window.savedConfig={...wc._config};window.savedHass=wc.hass;window.savedForecast=[...wc._forecast]")
 assert card.locator('.primary-label').evaluate("e=>getComputedStyle(e).borderInlineStartWidth==='0px'"),'decorative feels-like accent rail remains'
 def paint(material,dark):
  tokens={'ha-card-border-radius':'12px','ha-card-border-width':'1px','ha-card-box-shadow':'none','primary-color':'#03a9f4','accent-color':'#a86ae0','ha-card-background':'var(--card-background-color)'}
  tokens.update({'primary-background-color':'#111','card-background-color':'#1c1c1c','primary-text-color':'#e1e1e1','secondary-text-color':'#aaa','secondary-background-color':'#282828','divider-color':'#424242'} if dark else {'primary-background-color':'#fafafa','card-background-color':'#fff','primary-text-color':'#212121','secondary-text-color':'#666','secondary-background-color':'#f2f2f2','divider-color':'#ddd'})
  if material:tokens.update({k:v for k,v in THEME.items() if k!='modes'});tokens.update(THEME['modes']['dark' if dark else 'light'])
  page.evaluate('''({tokens,dark})=>{for(const k of [...document.body.style])if(k.startsWith('--'))document.body.style.removeProperty(k);for(const[k,v]of Object.entries(tokens))document.body.style.setProperty('--'+k,v);document.body.style.colorScheme=dark?'dark':'light';wc.hass={...wc.hass,themes:{darkMode:dark}}}''',{'tokens':{k:str(v) for k,v in tokens.items()},'dark':dark})
 def shot(name):
  card.scroll_into_view_if_needed();page.wait_for_timeout(100);card.screenshot(path=str(OUT/(name+'.png')))
 def measure():
  return card.evaluate('''c=>{const r=c.shadowRoot,box=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}},s=e=>getComputedStyle(e),ink=e=>{const t=document.createRange();t.selectNodeContents(e);return box(t)},content=r.querySelector('.content');return {host:box(c),card:box(r.querySelector('ha-card')),hero:box(r.querySelector('.hero')),overflow:content.scrollWidth>content.clientWidth+1,values:[...r.querySelectorAll('.ui-metric-value,.primary-value')].map(e=>({text:e.textContent.trim(),condition:!!e.closest('.weather-status[data-condition=true]'),...box(e),ink:ink(e),ws:s(e).whiteSpace,ow:s(e).overflowWrap,scroll:e.scrollWidth,client:e.clientWidth})),forecast:[...r.querySelectorAll('.forecast-atomic')].map(e=>({text:e.textContent,...box(e),ink:ink(e),ws:s(e).whiteSpace})),tabs:[...r.querySelectorAll('[role=tab]')].map(e=>({...box(e),selected:e.getAttribute('aria-selected'),color:s(e).color,border:s(e).borderBottomWidth,radius:s(e).borderRadius,decoration:s(e).textDecorationLine})),targets:[...r.querySelectorAll('button:not([hidden]),[role=tab]')].filter(e=>e.getClientRects().length).map(e=>({text:e.textContent.trim(),...box(e)}))}}''')
 def valid(m):
  assert not m['overflow'],m
  assert m['card']['bottom']<=m['host']['bottom']+1,m
  for v in m['values']:
   assert (v['condition'] or v['ws']=='nowrap') and v['ow']!='anywhere',v
   assert v['scroll']<=v['client']+1,('value overflow',v)
   assert v['ink']['right']<=v['right']+1,('value ink overflow',v)
  for v in m['forecast']:assert v['ws']=='nowrap' and v['ink']['w']<=v['w']+1,v
  for t in m['tabs']:
   assert t['h']>=44 and t['border']=='0px' and t['decoration']=='none' and t['radius']!='0px',t
   if t['selected']=='true':assert t['color']=='rgb(168, 106, 224)',t
  for t in m['targets']:assert t['h']>=44,('target too short',t)
 def reset():
  page.evaluate("wc.setConfig(savedConfig);wc.hass=savedHass;wc._forecast=savedForecast;wc._forecastStatus='ready';wc._render()")
 for width in [320,390,1280]:
  page.set_viewport_size({'width':width,'height':1400})
  for material,dark in [(False,False),(False,True),(True,False),(True,True)]:
   reset();paint(material,dark);mode=('material' if material else 'ha')+('-dark' if dark else '-light');shot(f'closed-{mode}-{width}');m=measure();valid(m);matrix.append({'width':width,'mode':mode,'geometry':m})
   if width==390 and material and dark:page.screenshot(path=str(OUT/'dashboard-material-dark-390.png'))
  # Real controls: click, arrow/Home/End, focused node survives actual telemetry.
  tabs=card.locator('[role=tab]');tabs.last.click();assert tabs.last.get_attribute('aria-selected')=='true';tabs.last.press('Home');assert tabs.first.get_attribute('aria-selected')=='true';tabs.first.press('End');assert tabs.last.get_attribute('aria-selected')=='true'
  page.evaluate("window.heldTab=wc.shadowRoot.activeElement;wc.hass={...wc.hass,states:{...wc.hass.states,'weather.home':{...wc.hass.states['weather.home'],attributes:{...wc.hass.states['weather.home'].attributes,temperature:17}}}}")
  assert page.evaluate('wc.shadowRoot.activeElement===heldTab && wc._forecastType===\'daily\'')
  page.evaluate("wc.addEventListener('hass-more-info',e=>window.weatherInfo=e.detail.entityId)");card.locator('.weather-status').click();assert page.evaluate('weatherInfo')=='weather.home'
  # Forecast is an accessible keyboard-scrollable region; telemetry retains its exact live node and scroll.
  forecast=card.locator('.forecast-list');forecast.focus();forecast.press('ArrowRight');page.wait_for_timeout(350)
  scroll_before=forecast.evaluate('e=>{window.heldForecast=e;return e.scrollLeft}')
  page.evaluate("wc.hass={...wc.hass,states:{...wc.hass.states,'weather.home':{...wc.hass.states['weather.home'],attributes:{...wc.hass.states['weather.home'].attributes,temperature:18}}}}")
  assert forecast.evaluate('e=>e===heldForecast') and abs(forecast.evaluate('e=>e.scrollLeft')-scroll_before)<1
  interactions.append({'width':width,'tabsClickKeyboardFocusTelemetry':True,'sourceDetails':True,'forecastKeyboardScrollTelemetry':True})
  reset();paint(True,True)
  # Enlarge actual roles, including forecast, not just hero/header.
  card.evaluate('''c=>{const s=document.createElement('style');s.id='weather-text-zoom';s.textContent='.primary-value{font-size:96px!important}.primary-value small{font-size:32px!important}.primary-label,.ui-metric-title,.ui-metric-info,.forecast-list time,.forecast-low,.rain-chance,.forecast-extra,.forecast-label{font-size:24px!important}.ui-metric-value{font-size:48px!important}.ui-metric-unit{font-size:24px!important}.forecast-value{font-size:36px!important}[role=tab]{font-size:26px!important}';c.shadowRoot.append(s)}''')
  shot(f'text-200-material-dark-{width}');valid(measure());stress.append({'width':width,'case':'text200'})
  card.evaluate("c=>c.shadowRoot.querySelector('#weather-text-zoom').remove()")
  for name,script in [
   ('long',"wc.setConfig({...savedConfig,metric_primary:'custom',metric_primary_entity:'sensor.long_weather',metric_primary_label:'Buitentemperatuur aan de noordelijke gevel',metric_secondary_label:'Relatieve luchtvochtigheid buiten'});wc.hass={...savedHass,states:{...savedHass.states,'sensor.long_weather':{state:'-12345.67',attributes:{unit_of_measurement:'kilometer/uur'}}}}"),
   ('zero',"wc.hass={...savedHass,states:{...savedHass.states,'weather.home':{...savedHass.states['weather.home'],attributes:{...savedHass.states['weather.home'].attributes,temperature:0,humidity:0,wind_speed:0}}}}"),
   ('unavailable',"wc.hass={...savedHass,states:{...savedHass.states,'weather.home':{...savedHass.states['weather.home'],state:'unavailable'}}}"),
   ('offline',"wc.hass={...savedHass,connected:false}"),
   ('loading',"wc._forecastStatus='loading';wc._render()"),
   ('empty',"wc._forecast=[];wc._forecastStatus='ready';wc._render()"),
   ('error',"wc._forecastStatus='error';wc._render()"),
   ('compact',"wc.setConfig({...savedConfig,compact:true})"),
   ('hidden-fields',"wc.setConfig({...savedConfig,metric_status:'none',metric_primary:'none',metric_secondary:'none',tabs:[]})"),
   ('wide-forecast',"wc.setConfig({...savedConfig,forecast_hourly_fields:['temperature','precipitation','wind_speed'],forecast_hourly_temperature_decimals:2});wc._forecast=savedForecast.map(r=>({...r,temperature:-123.45,precipitation:1234.5,wind_speed:12345.6}));wc._forecastStatus='ready';wc._render()")]:
   reset();page.evaluate(script);shot(f'{name}-material-dark-{width}');m=measure();valid(m);stress.append({'width':width,'case':name,'geometry':m})
   if name=='long':
    card.locator('[data-weather-field]').first.click();assert page.evaluate('weatherInfo')=='sensor.long_weather'
   if name=='zero':assert card.locator('.primary-number').inner_text()=='0'
   if name=='unavailable':assert card.locator('.primary-number').inner_text()=='—'
   if name=='offline':assert 'Geen verbinding' in card.locator('.ui-metric-info').inner_text()
   if name=='error':
    card.locator('.retry').click();page.wait_for_timeout(60);assert page.evaluate("wc._forecastStatus==='ready'")
 # Theme CSS-only update on live selected node, hover keeps selection paint.
 reset();paint(True,False);active=card.locator('[role=tab][aria-selected=true]');before=active.evaluate('e=>({color:getComputedStyle(e).color,bg:getComputedStyle(e).background,shadow:getComputedStyle(e).boxShadow})');active.hover();assert active.evaluate('e=>({color:getComputedStyle(e).color,bg:getComputedStyle(e).background,shadow:getComputedStyle(e).boxShadow})')==before
 page.evaluate("window.accentNode=wc.shadowRoot.querySelector('[aria-selected=true]');document.body.style.setProperty('--accent-color','#006f65');document.body.style.setProperty('--eleven-material-selection-background','rgb(219, 235, 232)')")
 assert page.evaluate("accentNode.isConnected&&getComputedStyle(accentNode).color==='rgb(0, 111, 101)'&&getComputedStyle(accentNode).backgroundColor==='rgb(219, 235, 232)'")
 assert page.evaluate('wc.shadowRoot.getAnimations().length')==0
 assert not errors,errors
 result={'matrix':matrix,'stress':stress,'interactions':interactions,'errors':errors,'url':URL,'actualServedAggregate':True,'injectedStandalone':False}
 (OUT/'results.json').write_text(json.dumps(result,indent=2));print(json.dumps({'matrix':len(matrix),'stress':len(stress),'interactionWidths':len(interactions),'errors':errors,'actualServedAggregate':True}));b.close()
