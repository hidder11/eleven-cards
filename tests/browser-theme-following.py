"""Isolated real bundles + synthetic HA fixture; never accesses HA."""
import json,threading,functools,http.server,hashlib
from pathlib import Path
import yaml
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-evidence/theme-following';OUT.mkdir(parents=True,exist_ok=True)
THEME=yaml.safe_load((ROOT/'themes/eleven_material.yaml').read_text())['Eleven Material']
BASE={'ha-card-border-radius':'12px','ha-card-border-width':'1px','ha-card-box-shadow':'none','primary-color':'#03a9f4','error-color':'#db4437','warning-color':'#ffa600','text-primary-color':'#fff'}
def tokens(material,dark):
 d={**BASE,**({'primary-background-color':'#111111','card-background-color':'#1c1c1c','primary-text-color':'#e1e1e1','secondary-text-color':'#9b9b9b','secondary-background-color':'#282828','divider-color':'#424242'} if dark else {'primary-background-color':'#fafafa','card-background-color':'#ffffff','primary-text-color':'#212121','secondary-text-color':'#727272','secondary-background-color':'#f2f2f2','divider-color':'#e0e0e0'})}
 d['ha-card-background']='var(--card-background-color)'
 if material:d.update({k:v for k,v in THEME.items() if k!='modes'});d.update(THEME['modes']['dark' if dark else 'light'])
 return {f'--{k}':str(v) for k,v in d.items()}
handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(ROOT))
class Quiet(handler.func):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
results=[];errors=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',headless=True,args=['--no-sandbox']);page=browser.new_page(viewport={'width':1280,'height':1000},device_scale_factor=1,reduced_motion='reduce');page.on('pageerror',lambda e:(errors.append(str(e)),print('PAGE ERROR:',str(e))))
  page.goto(f'http://127.0.0.1:{server.server_port}/tests/fixtures/theme-following.html');page.wait_for_function('window.themeFixtureReady===true');page.wait_for_timeout(1000)
  assert not errors,errors
  names=page.evaluate('records.map(r=>r.name)');assert len(names)==18,names
  for width in [1280,390,320]:
   page.set_viewport_size({'width':width,'height':1000})
   for material,dark in [(False,False),(True,False),(True,True),(False,True)]:
    mode=('material' if material else 'ha')+('-dark' if dark else '-light')
    page.evaluate('''({tokens,dark})=>{const b=document.body;for(const k of [...b.style])if(k.startsWith('--'))b.style.removeProperty(k);for(const [k,v] of Object.entries(tokens))b.style.setProperty(k,v);b.style.colorScheme=dark?'dark':'light';for(const r of records){r.hass={...r.hass,themes:{darkMode:dark}};r.card.hass=r.hass}}''',{'tokens':tokens(material,dark),'dark':dark})
    page.wait_for_timeout(250)
    row=page.evaluate('''()=>records.map(({name,card})=>{const root=card.shadowRoot,ha=root.querySelector('ha-card'),s=getComputedStyle(ha),rect=card.getBoundingClientRect(),plot=root.querySelector('.matrix-scroll')||root.querySelector('.chart,.plot'),well=root.querySelector('[data-ui-metric],.metric,.current'),controls=root.querySelector('.period-trigger,.navigation,.info-button'),functional=[...root.querySelectorAll('path[stroke],svg rect[fill],.spark path,.battery-fill,.cell:not(.missing)')].slice(0,40).map(n=>({tag:n.tagName,stroke:getComputedStyle(n).stroke,fill:getComputedStyle(n).fill,background:getComputedStyle(n).backgroundColor}));return {name,width:rect.width,scroll:ha.scrollWidth,client:ha.clientWidth,background:s.backgroundImage,surface:s.backgroundColor,shadow:s.boxShadow,radius:s.borderRadius,well:well?getComputedStyle(well).boxShadow:null,plot:plot?getComputedStyle(plot).boxShadow:null,control:controls?getComputedStyle(controls).backgroundImage:null,text:root.textContent.slice(-400),functional}})''')
    for r in row:
     assert r['radius']==('22px' if material else '12px'),(mode,width,r)
     assert ('gradient' in r['background'])==material,(mode,width,r)
     assert (r['shadow']!='none')==material,(mode,width,r['name'],r['shadow'])
     if r['well'] is not None:assert (r['well']!='none')==material,(mode,width,r['name'],'well',r['well'])
     assert r['scroll']<=r['client']+1,(mode,width,r['name'],'horizontal overflow',r['scroll'],r['client'])
     if r['name'] in ['history-graph-card','bar-chart','timeline-card','dynamic-energy-price-card','heatmap-card']:
      assert r['plot'] is not None,(mode,r['name'],'missing plot')
      assert (r['plot']!='none')==material,(mode,r['name'],'plot',r['plot'])
     target=page.locator(f'[data-card="{r["name"]}"]');target.screenshot(path=str(OUT/f'{r["name"]}-{mode}-{width}.png'))
    results.append({'width':width,'mode':mode,'cards':row})
    if width==1280:page.screenshot(path=str(OUT/f'collection-{mode}-{width}.png'),full_page=True)
    if dark:
     scheme=page.locator('[data-card=appliance-planner]').evaluate("e=>getComputedStyle(e.shadowRoot.querySelector('input[type=date]')).colorScheme")
     assert scheme=='dark',('date input dark scheme',mode,scheme)
    if not material:
     shadows=page.evaluate("records.flatMap(r=>[...r.card.shadowRoot.querySelectorAll('.chart-controls,.zoom-controls,.chart-links')].map(n=>({name:r.name,shadow:getComputedStyle(n).boxShadow})))")
     assert all(s['shadow']=='none' for s in shadows),shadows
  # CSS-only changes must repaint existing nodes without a hass setter/render.
  page.evaluate("window.heldNodes=records.map(r=>r.card.shadowRoot.querySelector('ha-card'))")
  css_only=[]
  for material,dark in [(False,False),(True,False),(True,True),(False,True)]:
   page.evaluate("({tokens,dark})=>{for(const k of [...document.body.style])if(k.startsWith('--'))document.body.style.removeProperty(k);for(const [k,v]of Object.entries(tokens))document.body.style.setProperty(k,v);document.body.style.colorScheme=dark?'dark':'light'}",{'tokens':tokens(material,dark),'dark':dark})
   paint=page.evaluate("records.map((r,i)=>{const n=r.card.shadowRoot.querySelector('ha-card'),s=getComputedStyle(n);return {name:r.name,same:n===heldNodes[i],radius:s.borderRadius,background:s.backgroundImage}})")
   assert all(r['same'] and r['radius']==('22px' if material else '12px') and ('gradient' in r['background'])==material for r in paint),paint
   css_only.append({'material':material,'dark':dark,'paint':paint})
  # Configured data colors must survive palette/mode changes. Decorative weather
  # artwork and native unavailable hatching are intentionally theme-aware.
  for width in [1280,390,320]:
   views={r['mode']:r for r in results if r['width']==width}
   for dark in ['light','dark']:
    native={r['name']:r for r in views['ha-'+dark]['cards']};material={r['name']:r for r in views['material-'+dark]['cards']}
    for name in ['history-graph-card','bar-chart','overview-card','heatmap-card']:
     assert native[name]['functional']==material[name]['functional'],(name,width,dark,'functional paint changed')
  page.mouse.move(0,0);page.emulate_media(forced_colors='active')
  forced=page.evaluate("records.map(r=>({name:r.name,shadow:getComputedStyle(r.card.shadowRoot.querySelector('ha-card')).boxShadow}))")
  assert all(r['shadow']=='none' for r in forced),forced
  page.emulate_media(forced_colors='none')
  assert not errors,errors
  # Real synthetic UI interactions: keyboard chart tooltip, metric More Info, tabs,
  # Shopping edit + draft input. Service calls are synthetic and not needed here.
  interactions=page.evaluate('''()=>{const checks=[];for(const r of records){const root=r.card.shadowRoot;let more=0;r.card.addEventListener('hass-more-info',()=>more++);if(r.name==='overview-card'){root.querySelector('.metric').click();if(!more)throw Error('Overview More Info');checks.push('Overview More Info')}const tabs=[...root.querySelectorAll('[data-ui-tab]')].filter(n=>n.getBoundingClientRect().width>0&&!n.closest('[hidden]'));if(tabs.length>1){tabs[1].click();if(r.card.shadowRoot.querySelectorAll('[data-ui-tab][aria-selected=true]').length!==1)throw Error(r.name+' selection');checks.push(r.name+' tabs')}const chart=root.querySelector('.chart[tabindex]');if(chart){chart.scrollIntoView({block:'center'});chart.focus();chart.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));if(!r.card.shadowRoot.querySelector('.tooltip:not([hidden])'))throw Error(r.name+' keyboard did not expose tooltip');checks.push(r.name+' keyboard cursor')}}return checks}''')
  (OUT/'browser-results.json').write_text(json.dumps({'cases':len(results),'card_checks':sum(len(r['cards']) for r in results),'results':results,'page_errors':errors,'interactions':interactions,'css_only_switches':css_only,'forced_colors':forced},indent=2));print(json.dumps({'cases':len(results),'card_checks':sum(len(r['cards']) for r in results),'page_errors':errors,'interactions':interactions,'css_only_switches':css_only,'forced_colors':forced}))
  browser.close()
finally:server.shutdown()
