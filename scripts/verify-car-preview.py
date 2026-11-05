"""Check the integrated, allowlisted preview without renderer injection."""
from pathlib import Path
import hashlib,json,urllib.request
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-evidence/car-refinement'
TOKEN=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text())['token']
local=f'http://127.0.0.1:56515/{TOKEN}/cards/'
public=f'https://kyle-modules-tions-donald.trycloudflare.com/{TOKEN}/cards/'
readbacks=[]
for origin in [local,public]:
 for name in json.loads((ROOT/'review/public-files.json').read_text()):
  with urllib.request.urlopen(origin+name,timeout=45) as response:
   data=response.read();mime=response.headers.get_content_type()
  assert data==(ROOT/name).read_bytes(),name
  if name.endswith('.png'):assert mime=='image/png',mime
  readbacks.append({'origin':'local' if origin==local else 'public','file':name,'sha256':hashlib.sha256(data).hexdigest(),'mime':mime})
rows=[];errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':1100},reduced_motion='reduce')
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(local+'review/',wait_until='domcontentloaded',timeout=60000);page.wait_for_timeout(1500);assert page.evaluate('window.themeFixtureReady===true')
 for width in [320,390,1280]:
  page.set_viewport_size({'width':width,'height':1100})
  for dark in [False,True]:
   page.evaluate('dark=>{if(window.reviewDark!==dark)document.querySelector("#mode").click();records.find(r=>r.name==="car-card").card.scrollIntoView({block:"center"})}',dark)
   page.wait_for_timeout(750)
   assert page.evaluate('records.find(r=>r.name==="car-card").card.shadowRoot.querySelector("img")?.naturalWidth>0')
   page.wait_for_timeout(250)
   row=page.evaluate('''()=>{const c=records.find(r=>r.name==='car-card').card,r=c.shadowRoot,b=r.querySelector('ha-card').getBoundingClientRect(),im=r.querySelector('img');return {total:records.length,approved:document.querySelectorAll('[data-review-status=approved]').length,pending:document.querySelectorAll('[data-review-status=pending]').length,actionsApproved:document.querySelector('#card-actions-card').dataset.reviewStatus,autoPending:c.parentElement.dataset.reviewStatus,title:r.querySelector('h2').textContent,image:{url:im.src,width:im.naturalWidth,height:im.naturalHeight},cardWidth:b.width,cardHeight:b.height,scroll:r.querySelector('ha-card').scrollWidth,values:[...r.querySelectorAll('[data-ui-metric]')].map(n=>n.textContent.trim()),pageOverflow:document.documentElement.scrollWidth>innerWidth}}''')
   assert (row['total'],row['approved'],row['pending'])==(18,9,9),row
   assert row['actionsApproved']=='approved' and row['autoPending']=='pending',row
   assert row['image']['width']==945 and row['image']['height']==310,row
   assert row['scroll']<=row['cardWidth']+1 and not row['pageOverflow'],row
   assert any('Geparkeerd' in value for value in row['values']),row
   assert not any('Gegevensveld' in value for value in row['values']),row
   row.update(viewport=width,dark=dark)
   page.locator('[data-card=car-card]').screenshot(path=str(OUT/f'served-{width}-material-{"dark" if dark else "light"}.png'))
   rows.append(row)
 assert not errors,errors
 browser.close()
result={'matrix':rows,'readbacks':readbacks,'page_errors':errors}
(OUT/'served-preview-verification.json').write_text(json.dumps(result,indent=2))
print(json.dumps({'matrix':len(rows),'readbacks':len(readbacks),'approved':rows[0]['approved'],'pending':rows[0]['pending'],'page_errors':errors}))
