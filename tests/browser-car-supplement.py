"""Supplement: composed EVCC parity, resize/reconnect, numeric glyphs, zoom."""
import functools,http.server,threading,json,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-evidence/car-refinement'
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
rows=[];errors=[]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
  hashes=[]
  for entry in [True,False]:
   page=b.new_page(viewport={'width':390,'height':1200},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script('''{const D=Date;window.Date=class extends D{constructor(...args){super(...(args.length?args:[1793520000000]));}static now(){return 1793520000000;}};}''')
   if entry:page.route('**/dist/eleven-cards.js',lambda route:route.fulfill(path=str(OUT/'entry-collection.js'),content_type='application/javascript'))
   page.goto(f'http://127.0.0.1:{server.server_port}/tests/fixtures/theme-following.html');page.wait_for_function('window.themeFixtureReady===true');page.wait_for_timeout(250)
   html=page.evaluate("records.find(r=>r.name==='car-evcc').card.shadowRoot.innerHTML")
   hashes.append(hashlib.sha256(html.encode()).hexdigest());page.close()
  assert hashes[0]==hashes[1],hashes
  rows.append({'case':'EVCC complete rendered shadow-root parity with dirty entry','sha256':hashes[0]})
  page=b.new_page(viewport={'width':320,'height':1800},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/tests/fixtures/theme-following.html');page.wait_for_function('window.themeFixtureReady===true')
  page.evaluate('''()=>{window.record=records.find(r=>r.name==='car-card');for(const a of document.querySelectorAll('article'))a.hidden=a!==record.card.parentElement;document.querySelector('main').style.display='block';record.card.parentElement.style.maxWidth='385.0625px';for(const h of document.querySelectorAll('body>h1,body>p,article>h2'))h.hidden=true;window.base={...record.card._config,title:'Auto',field_1_entity:'sensor.status',field_1_label:'Status',field_2_entity:'sensor.odometer',show_field_3:false};record.hass.states['sensor.status']={state:'Geparkeerd',attributes:{}};window.reset=()=>{record.card.setConfig(base);record.card.hass={...record.hass}};reset();}''')
  def check(name):
   page.wait_for_timeout(120)
   result=page.evaluate('''()=>{const r=record.card.shadowRoot,card=r.querySelector('ha-card'),rect=n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height}},numbers=[...r.querySelectorAll('.car-number')].map(n=>{const range=document.createRange();range.selectNodeContents(n);return {text:n.textContent,lines:[...range.getClientRects()].map(b=>({x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width})),node:rect(n),parent:rect(n.parentElement),font:getComputedStyle(n).fontSize}});return {width:card.getBoundingClientRect().width,scroll:card.scrollWidth,card:rect(card),numbers,columns:r.querySelector('.car-readings')?.style.getPropertyValue('--ui-metric-columns'),fields:r.querySelectorAll('[data-car-field]').length}}''')
   assert result['scroll']<=result['width']+1,(name,result)
   for n in result['numbers']:
    assert len(n['lines'])==1,(name,n)
    assert n['node']['right']<=n['parent']['right']+1,(name,n)
   result['case']=name;rows.append(result)
   page.locator('[data-card=car-card]').screenshot(path=str(OUT/f'supplement-{name}.png'))
  for name,code in [
   ('zero',"record.hass.states['sensor.soc']={state:'0',attributes:{unit_of_measurement:'%'}};record.hass.states['sensor.odometer']={state:'0',attributes:{unit_of_measurement:'km'}};reset()"),
   ('large-text200',"record.hass.states['sensor.odometer']={state:'123456789012',attributes:{unit_of_measurement:'kilometers in totaal'}};reset();const nodes=[...record.card.shadowRoot.querySelectorAll('*')];const sizes=nodes.map(n=>parseFloat(getComputedStyle(n).fontSize));nodes.forEach((n,i)=>n.style.fontSize=(sizes[i]*2)+'px')"),
   ('two-fields',"record.hass.states['sensor.odometer']={state:'98452',attributes:{unit_of_measurement:'km'}};record.card.setConfig({...base,show_field_3:true,field_3_entity:'sensor.range',field_3_label:'Bereik'});record.card.hass={...record.hass}"),
   ('no-fields',"record.card.setConfig({...base,show_field_1:false,show_field_2:false,show_field_3:false,range_source:'none'});record.card.hass={...record.hass}"),
   ('long-status-text200',"record.hass.states['sensor.status']={state:'Geparkeerd op de parkeerplaats naast het station',attributes:{}};reset();const nodes=[...record.card.shadowRoot.querySelectorAll('*')];const sizes=nodes.map(n=>parseFloat(getComputedStyle(n).fontSize));nodes.forEach((n,i)=>n.style.fontSize=(sizes[i]*2)+'px')"),
   ('unbroken-status',"record.hass.states['sensor.status']={state:'Voertuigstatuszondernatuurlijkescheidingspunten',attributes:{}};reset()")]:
   page.evaluate('()=>{'+code+'}');check(name)
  # Every supported progress style, explicit background, live fit after reconnect.
  for style in ['classic','soft','line','slim']:
   page.evaluate("style=>{record.card.setConfig({...base,battery_style:style,background:'lanes',background_strength:50});record.card.hass={...record.hass}}",style);check('style-'+style)
  page.evaluate('reset();window.parent=record.card.parentElement;record.card.remove();parent.append(record.card)');page.set_viewport_size({'width':390,'height':1800});check('reconnect')
  page.evaluate("document.body.style.zoom='2'");check('layout-zoom200');page.evaluate("document.body.style.zoom=''")
  # Fit must restore normal size rather than retain a prior large-value reduction.
  page.evaluate("record.hass.states['sensor.odometer']={state:'98452',attributes:{unit_of_measurement:'km'}};reset()");check('restored-normal')
  assert rows[-1]['numbers'][0]['font']=='24px',rows[-1]
  assert not errors,errors
  (OUT/'supplement.json').write_text(json.dumps({'cases':rows,'page_errors':errors},indent=2));print(json.dumps({'cases':len(rows),'page_errors':errors,'evcc_parity':hashes[0]}));b.close()
finally:server.shutdown()
