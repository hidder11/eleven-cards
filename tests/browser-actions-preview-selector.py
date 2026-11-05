"""Final served fixture icons/selector and public byte readback; no HA."""
import json, hashlib, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-evidence/actions-icon-grid'
token=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text())['token']
prefix=f'/{token}/cards/'
results=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':1200},reduced_motion='reduce')
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:56515'+prefix+'review/');page.wait_for_function('window.themeFixtureReady')
 card=page.locator('[data-card=actions-card]')
 for width in [320,390,1280]:
  page.set_viewport_size({'width':width,'height':1200})
  for count in [1,2,3,4,6]:
   page.locator('#actions-columns').select_option(str(count));page.wait_for_timeout(100)
   data=card.evaluate('''c=>{const g=c.shadowRoot.querySelector('.actions');return {configured:c._config.columns,effective:getComputedStyle(g).gridTemplateColumns.split(' ').length,icons:[...c.shadowRoot.querySelectorAll('.action ha-icon')].map(e=>({name:e.getAttribute('icon'),path:e.shadowRoot.querySelector('path').getAttribute('d')}))}}''')
   assert data['configured']==count and data['effective']<=count
   assert len(data['icons'])==8 and len({i['name'] for i in data['icons']})==8
   assert all(i['path'] for i in data['icons'])
   results.append({'width':width,**data})
  page.locator('#actions-columns').select_option('3');page.wait_for_timeout(100)
  for dark in [False,True]:
   if page.locator('#mode').get_attribute('aria-pressed')!=str(dark).lower():page.locator('#mode').click()
   card.scroll_into_view_if_needed();page.wait_for_timeout(100)
   page.locator('#card-actions-card').screenshot(path=str(OUT/f'parent-final-{width}-{"dark" if dark else "light"}.png'))
 assert not errors,errors
 b.close()
checks=[]
for path in json.loads((ROOT/'review/public-files.json').read_text()):
 expected=(ROOT/path).read_bytes()
 with urllib.request.urlopen('https://kyle-modules-tions-donald.trycloudflare.com'+prefix+path+'?icons='+hashlib.sha256(expected).hexdigest()[:12],timeout=45) as r:
  actual=r.read();assert actual==expected,path
 checks.append(path)
(OUT/'parent-final.json').write_text(json.dumps({'selectorCases':results,'publicByteMatches':checks,'pageErrors':errors},indent=2))
print(json.dumps({'selectorCases':len(results),'publicByteMatches':len(checks),'pageErrors':errors}))
