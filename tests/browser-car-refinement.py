"""Real Chromium, composed collection, synthetic HA, no device writes."""
import functools,http.server,threading,json,argparse
from pathlib import Path
import re
# This repository theme has only quoted scalar values and light/dark maps.
def load_theme(path):
 result={'modes':{'light':{},'dark':{}}};mode=None
 for line in path.read_text().splitlines():
  if line.strip() in ['light:','dark:']:mode=line.strip()[:-1]
  match=re.match(r'^( +)([\w-]+): "(.*)"$',line)
  if match:
   indent,key,value=match.groups();(result['modes'][mode] if len(indent)==6 else result)[key]=value
 return result
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-evidence/car-refinement';OUT.mkdir(parents=True,exist_ok=True)
parser=argparse.ArgumentParser();parser.add_argument('--baseline',action='store_true');args=parser.parse_args()
image=Image.open('/opt/data/cache/documents/native-inputs/afbe6b87262ab32d040303a174e2a7a2f10f2e4c7f760ff3e588708078c9d720/api_afbe6b87262ab32d040303a174e2a7a2.png')
image.crop(image.getbbox()).save(OUT/'test-user-car.png')
THEME=load_theme(ROOT/'themes/eleven_material.yaml')
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
results=[];stress=[];errors=[];interactions=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':390,'height':1200},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
  icons=json.loads((ROOT/'review/icon-paths.json').read_text());icon_class=(ROOT/'review/ha-stub.js').read_text().splitlines()[1]
  page.add_init_script('const iconPaths='+json.dumps(icons)+';'+icon_class)
  if args.baseline:page.route('**/dist/eleven-cards.js',lambda route:route.fulfill(path=str(OUT/'entry-collection.js'),content_type='application/javascript'))
  page.goto(f'http://127.0.0.1:{server.server_port}/tests/fixtures/theme-following.html');page.wait_for_function('window.themeFixtureReady===true')
  page.evaluate('''()=>{window.record=records.find(r=>r.name==='car-card');document.body.style.padding='14px';for(const a of document.querySelectorAll('article'))a.hidden=a!==record.card.parentElement;document.querySelector('main').style.display='block';record.card.parentElement.style.maxWidth='385.0625px';for(const h of document.querySelectorAll('body>h1,body>p,article>h2'))h.hidden=true;
  record.hass.states['sensor.car_status']={state:'Geparkeerd',attributes:{friendly_name:'Status'}};
  record.hass.states['image.review_car']={state:'available',attributes:{entity_picture:'/qa-evidence/car-refinement/test-user-car.png'}};
  window.base={...record.card._config,title:'Auto',image_entity:'image.review_car',field_1_entity:'sensor.car_status',field_1_label:'Status',field_2_entity:'sensor.odometer',field_2_label:'Kilometerstand',show_field_3:false};
  window.reset=()=>{record.card.setConfig(base);record.hass={...record.hass,connected:true};record.card.hass=record.hass;};reset();}''')
  def theme(material,dark):
   tokens={'primary-color':'#1976d2','accent-color':'#c43174','primary-background-color':'#111' if dark else '#fafafa','card-background-color':'#1c1c1c' if dark else '#fff','primary-text-color':'#e1e1e1' if dark else '#212121','secondary-text-color':'#aaa' if dark else '#666','secondary-background-color':'#282828' if dark else '#eee','divider-color':'#555' if dark else '#ddd','ha-card-border-radius':'12px'}
   if material:tokens.update({k:v for k,v in THEME.items() if k!='modes'});tokens.update(THEME['modes']['dark' if dark else 'light'])
   page.evaluate('''({tokens,dark})=>{for(const k of [...document.body.style])if(k.startsWith('--'))document.body.style.removeProperty(k);for(const [k,v]of Object.entries(tokens))document.body.style.setProperty('--'+k,v);document.body.style.colorScheme=dark?'dark':'light';record.hass={...record.hass,themes:{darkMode:dark}};record.card.hass=record.hass;}''',{'tokens':tokens,'dark':dark})
  def measure(name):
   page.wait_for_timeout(100)
   row=page.evaluate('''()=>{const r=record.card.shadowRoot,q=s=>r.querySelector(s),rect=n=>{if(!n)return null;const b=n.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height}},style=n=>{const s=getComputedStyle(n);return {font:s.fontSize,wrap:s.overflowWrap,whiteSpace:s.whiteSpace,background:s.background,filter:s.filter}};return {card:rect(q('ha-card')),host:rect(record.card),scroll:q('ha-card').scrollWidth,title:q('h2')?.textContent,titleRect:rect(q('h2')),primary:rect(q('.primary-value')),range:rect(q('.primary-label')),picture:rect(q('.picture')),image:q('img')?{...rect(q('img')),naturalWidth:q('img').naturalWidth,naturalHeight:q('img').naturalHeight,fit:getComputedStyle(q('img')).objectFit}:null,metrics:[...r.querySelectorAll('[data-ui-metric]')].map(n=>({text:n.textContent.trim(),rect:rect(n),value:rect(n.querySelector('.ui-metric-value')),title:rect(n.querySelector('.ui-metric-title')),scroll:n.scrollWidth,client:n.clientWidth,style:style(n.querySelector('.ui-metric-value'))})),gallery:style(q('.gallery-top')),stageBefore:getComputedStyle(q('.car-stage'),'::before').content,fillShadow:getComputedStyle(q('.battery-fill')).boxShadow,fillBefore:getComputedStyle(q('.battery-fill'),'::before').content,colors:{primary:getComputedStyle(q('h2')||q('.primary-value')).color,secondary:getComputedStyle(q('.primary-label')).color,metricPrimary:getComputedStyle(q('.ui-metric-value')).color,metricSecondary:getComputedStyle(q('.ui-metric-title')).color,metricBackground:getComputedStyle(q('[data-ui-metric]')).backgroundColor,cardBackground:getComputedStyle(q('ha-card')).getPropertyValue('--card-background-color').trim()},primaryFont:getComputedStyle(q('.primary-value')).fontSize,targets:[...r.querySelectorAll('button')].filter(n=>n.getClientRects().length).map(n=>({...rect(n),text:n.textContent.trim()}))}}''')
   row['name']=name
   if not args.baseline:
    assert row['title'],row
    assert row['scroll']<=row['card']['width']+1,('card overflow',row)
    assert row['host']['height']>=row['card']['height']-1,('host containment',row)
    assert row['stageBefore']=='none' and row['fillShadow']=='none' and row['fillBefore']=='none',row
    assert row['primary']['bottom']<=row['picture']['y'],row
    assert row['image'] is None or row['image']['fit']=='contain',row
    assert all(m['scroll']<=m['client']+1 for m in row['metrics']),('metric overflow',row)
   if name.startswith(('390-ha-','390-material-','1280-ha-','1280-material-')):
    assert len(row['metrics'])==2,row
    assert abs(row['metrics'][0]['rect']['y']-row['metrics'][1]['rect']['y'])<1,('status and odometer must share a row',row)
    assert all(t['height']>=43.9 for t in row['targets']),('undersize target',row)
   return row
  card=page.locator('[data-card="car-card"]')
  for width in [320,390,1280]:
   page.set_viewport_size({'width':width,'height':1400})
   for material,dark in [(False,False),(False,True),(True,False),(True,True)]:
    mode=('material' if material else 'ha')+('-dark' if dark else '-light');theme(material,dark)
    page.wait_for_function('record.card.shadowRoot.querySelector("img").naturalWidth>0')
    name=f'{width}-{mode}';row=measure(name);results.append(row);card.screenshot(path=str(OUT/f'{"before" if args.baseline else "final"}-{name}.png'))
  if args.baseline:
   (OUT/'baseline.json').write_text(json.dumps(results,indent=2));print('Baseline captured',len(results));browser.close()
  else:
   for width in [320,390,1280]:
    page.set_viewport_size({'width':width,'height':1500})
    for name,js in [
     ('compact',"record.card.setConfig({...base,compact:true})"),
     ('long',"record.hass.states['sensor.car_status']={state:'Geparkeerd bij het station aan de andere kant van de stad',attributes:{}};record.card.setConfig({...base,title:'Onze gezinsauto voor dagelijkse ritten',field_1_label:'Huidige voertuigstatus',field_2_label:'Totale kilometerstand van het voertuig'})"),
     ('large',"record.hass.states['sensor.odometer']={state:'123456789012',attributes:{unit_of_measurement:'kilometers totaal'}};record.card.setConfig({...base,show_field_3:true,field_3_entity:'sensor.range',field_3_label:'Resterende actieradius voor de volgende rit'})"),
     ('text200',"record.card.shadowRoot.querySelectorAll('*').forEach(n=>{const s=getComputedStyle(n);n.dataset.size=s.fontSize});record.card.shadowRoot.querySelectorAll('*').forEach(n=>n.style.fontSize=(parseFloat(n.dataset.size)*2)+'px')"),
     ('missing-image',"delete record.hass.states['image.review_car'];record.card.hass={...record.hass}"),
     ('error-image',"record.hass.states['image.review_car']={state:'available',attributes:{entity_picture:'/nonexistent.png'}};record.card.hass={...record.hass}"),
     ('unavailable',"record.hass.states['sensor.soc']={state:'unavailable',attributes:{}};record.hass.states['sensor.odometer']={state:'unknown',attributes:{}};record.card.hass={...record.hass}"),
     ('offline',"record.hass={...record.hass,connected:false};record.card.hass=record.hass"),
     ('image-offset',"record.card.setConfig({...base,image_scale:80,image_offset_x:10,image_offset_y:8})"),
     ('custom-tabs',"record.card.setConfig({...base,custom_tabs:[{id:'details',title:'Gegevens',entities:[{entity:'sensor.odometer',name:'Kilometerstand'}]},{id:'travel',title:'Ritten',entities:[{entity:'sensor.range',name:'Actieradius'}]}]})")]:
     page.evaluate("()=>{record.hass.states['sensor.car_status']={state:'Geparkeerd',attributes:{}};record.hass.states['sensor.odometer']={state:'98452',attributes:{unit_of_measurement:'km'}};record.hass.states['sensor.soc']={state:'62',attributes:{unit_of_measurement:'%'}};record.hass.states['image.review_car']={state:'available',attributes:{entity_picture:'/qa-evidence/car-refinement/test-user-car.png'}};reset();}")
     if name!='text200':page.evaluate(js)
     page.evaluate('record.card.hass={...record.hass}');page.wait_for_timeout(100)
     # Text enlargement must happen after the last render.
     if name=='text200':page.evaluate(js)
     row=measure(f'{width}-{name}');stress.append(row);card.screenshot(path=str(OUT/f'stress-{width}-{name}.png'))
     if name=='offline':assert card.locator('[role=status]').is_visible();page.evaluate('reset()');assert card.locator('[role=status]').count()==0
     if name=='error-image':assert card.locator('.picture small').is_visible()
     if name=='custom-tabs':
      tabs=card.locator('[role=tab]');tabs.last.press('Home');assert tabs.first.get_attribute('aria-selected')=='true';tabs.first.press('End');assert tabs.last.get_attribute('aria-selected')=='true';interactions.append(f'{width}: custom tabs Home/End')
    page.evaluate('reset();record.card.addEventListener("hass-more-info",e=>window.lastInfo=e.detail.entityId)')
    for selector,entity in [('.primary-number','sensor.soc'),('.primary-label','sensor.range'),('[data-car-field="1"]','sensor.car_status'),('[data-car-field="2"]','sensor.odometer')]:
     target=card.locator(selector);target.focus();target.press('Enter');assert page.evaluate('lastInfo')==entity
     page.evaluate("record.hass={...record.hass,states:{...record.hass.states,'sensor.soc':{state:'63',attributes:{unit_of_measurement:'%'}}}};record.card.hass=record.hass")
     assert card.locator(selector).evaluate('n=>n===n.getRootNode().activeElement')
    interactions.append(f'{width}: four more-info targets + update focus')
   assert not errors,errors
   (OUT/'results.json').write_text(json.dumps({'matrix':results,'stress':stress,'interactions':interactions,'page_errors':errors},indent=2))
   print(json.dumps({'matrix':len(results),'stress':len(stress),'interactions':interactions,'page_errors':errors}));browser.close()
finally:server.shutdown()
