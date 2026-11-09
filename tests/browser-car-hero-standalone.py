"""Build-output standalone and separate test-module browser smoke/matrix."""
import functools,http.server,threading,json,re
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-evidence/car-hero-thirds'
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,format,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
theme={};modes={'light':{},'dark':{}};mode=None
for line in (ROOT/'themes/eleven_material.yaml').read_text().splitlines():
 if line.strip() in ['light:','dark:']:mode=line.strip()[:-1]
 match=re.match(r'^( +)([\w-]+): "(.*)"$',line)
 if match:
  indent,key,value=match.groups();(modes[mode] if len(indent)==6 else theme)[key]=value
rows=[];errors=[]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
  page=b.new_page(viewport={'width':390,'height':1000},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/qa-evidence/car-hero-thirds/standalone.html');page.wait_for_function('window.ready===true')
  for width in [320,390,1280]:
   page.set_viewport_size({'width':width,'height':1100})
   for material,dark in [(False,False),(False,True),(True,False),(True,True)]:
    tokens={'primary-color':'#1976d2','accent-color':'#c43174','primary-background-color':'#111' if dark else '#fafafa','card-background-color':'#1c1c1c' if dark else '#fff','primary-text-color':'#e1e1e1' if dark else '#212121','secondary-text-color':'#aaa' if dark else '#666','secondary-background-color':'#282828' if dark else '#eee','divider-color':'#555' if dark else '#ddd','ha-card-border-radius':'12px'}
    if material:tokens.update(theme);tokens.update(modes['dark' if dark else 'light'])
    page.evaluate('''({tokens,dark})=>{document.body.style.cssText='';for(const[k,v]of Object.entries(tokens))document.body.style.setProperty('--'+k,v);document.body.style.background='var(--primary-background-color)';document.body.style.colorScheme=dark?'dark':'light';hass={...hass,themes:{darkMode:dark}};card.hass=hass;}''',{'tokens':tokens,'dark':dark})
    page.wait_for_timeout(150)
    row=page.evaluate('''()=>{const r=card.shadowRoot,q=s=>r.querySelector(s),rect=n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height}};return {card:rect(q('ha-card')),scroll:q('ha-card').scrollWidth,battery:rect(q('.battery-row')),picture:rect(q('.picture')),track:rect(q('.battery-track')),image:{width:q('img').naturalWidth,height:q('img').naturalHeight},fields:[...r.querySelectorAll('[data-ui-metric]')].map(n=>({text:n.textContent,rect:rect(n)})),testIndependent:card.constructor!==document.querySelector('eleven-car-card-test').constructor,testHero:document.querySelector('eleven-car-card-test').shadowRoot.querySelector('.car-stage')!==null}}''')
    assert row['testIndependent'] and row['testHero'],row
    assert abs(row['picture']['width']/row['battery']['width']-2)<.02,row
    assert row['picture']['x']>row['battery']['right']+11,row
    assert row['track']['right']<=row['battery']['right']+1,row
    assert row['scroll']<=row['card']['width']+1,row
    assert row['image']=={'width':945,'height':310},row
    if width>=390:assert abs(row['fields'][0]['rect']['y']-row['fields'][1]['rect']['y'])<1,row
    name=f'{width}-{"material" if material else "ha"}-{"dark" if dark else "light"}';row['name']=name;rows.append(row)
    page.locator('eleven-car-card').screenshot(path=str(OUT/f'standalone-{name}.png'))
  page.evaluate("card.addEventListener('hass-more-info',e=>window.lastEntity=e.detail.entityId)")
  page.locator('eleven-car-card').locator('.primary-number').press('Enter');assert page.evaluate('lastEntity')=='sensor.soc'
  assert not errors,errors
  (OUT/'standalone-results.json').write_text(json.dumps({'matrix':rows,'page_errors':errors,'test_module_independent':True,'keyboard_more_info':True},indent=2))
  print(json.dumps({'matrix':len(rows),'page_errors':errors,'test_module_independent':True,'keyboard_more_info':True}));b.close()
finally:server.shutdown()
