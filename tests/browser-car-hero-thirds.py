"""Actual gallery hero contract; no renderer/config/image injection."""
import argparse,json,hashlib,urllib.request,time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-evidence/car-hero-thirds';OUT.mkdir(exist_ok=True)
parser=argparse.ArgumentParser();parser.add_argument('--baseline',action='store_true');args=parser.parse_args()
TOKEN=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text())['token']
LOCAL=f'http://127.0.0.1:56515/{TOKEN}/cards/'
PUBLIC=f'https://kyle-modules-tions-donald.trycloudflare.com/{TOKEN}/cards/'
rows=[];errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 for surface,origin in ([('local',LOCAL)] if args.baseline else [('local',LOCAL),('public',PUBLIC)]):
  page=browser.new_page(viewport={'width':390,'height':1200},reduced_motion='reduce')
  page.on('pageerror',lambda e:errors.append(str(e)))
  for attempt in range(3):
   try:
    page.goto(origin+'review/',wait_until='domcontentloaded',timeout=60000)
    for _ in range(100):
     if page.evaluate('window.themeFixtureReady===true'):break
     page.wait_for_timeout(100)
    assert page.evaluate('window.themeFixtureReady===true')
    break
   except Exception:
    if attempt==2:raise
  for width in ([390] if args.baseline else [320,390,1280]):
   page.set_viewport_size({'width':width,'height':1200})
   for dark in ([False] if args.baseline else [False,True]):
    page.evaluate('dark=>{if(window.reviewDark!==dark)document.querySelector("#mode").click();records.find(r=>r.name==="car-card").card.scrollIntoView({block:"center"})}',dark)
    for _ in range(60):
     if page.evaluate('records.find(r=>r.name==="car-card").card.shadowRoot.querySelector("img")?.naturalWidth>0'):break
     page.wait_for_timeout(100)
    page.wait_for_timeout(350)
    row=page.evaluate('''()=>{const c=records.find(r=>r.name==='car-card').card,r=c.shadowRoot,q=s=>r.querySelector(s),rect=n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height}},im=q('img'),pc=q('.primary-number'),range=document.createRange();range.selectNodeContents(pc);return {total:records.length,approved:document.querySelectorAll('[data-review-status=approved]').length,pending:document.querySelectorAll('[data-review-status=pending]').length,actionsApproved:document.querySelector('#card-actions-card').dataset.reviewStatus,autoPending:c.parentElement.dataset.reviewStatus,title:q('h2').textContent,config:{image_entity:c._config.image_entity,show_field_3:c._config.show_field_3},image:{url:im.src,width:im.naturalWidth,height:im.naturalHeight,fit:getComputedStyle(im).objectFit},card:rect(q('ha-card')),stage:rect(q('.car-stage')),battery:rect(q('.battery-row')),track:rect(q('.battery-track')),picture:rect(q('.picture')),primary:rect(q('.primary-value')),primaryNumber:rect(pc),numberInk:[...range.getClientRects()].map(rect=>({x:rect.x,right:rect.right,y:rect.y})),scroll:q('ha-card').scrollWidth,values:[...r.querySelectorAll('[data-ui-metric]')].map(n=>({text:n.textContent.trim(),rect:rect(n)})),pageOverflow:document.documentElement.scrollWidth>innerWidth}}''')
    name=f'{surface}-{width}-material-{"dark" if dark else "light"}'
    shot=OUT/f'{"before" if args.baseline else "served"}-{name}.png';page.locator('[data-card=car-card]').screenshot(path=str(shot))
    row.update(surface=surface,viewport=width,dark=dark,screenshot=str(shot),pageURL=page.url);rows.append(row)
    if args.baseline:(OUT/'baseline.json').write_text(json.dumps(rows,indent=2))
    assert abs(row['picture']['width']/row['battery']['width']-2)<.02,('hero must be 1:2',row)
    assert row['picture']['x']>=row['battery']['right']+11,('hero must be side by side',row)
    assert row['picture']['y']<row['battery']['bottom'] and row['picture']['bottom']>row['battery']['y'],row
    assert row['track']['x']>=row['battery']['x']-.5 and row['track']['right']<=row['battery']['right']+.5,row
    assert (row['total'],row['approved'],row['pending'])==(18,9,9),row
    assert row['actionsApproved']=='approved' and row['autoPending']=='pending',row
    assert row['config']=={'image_entity':'image.review_car','show_field_3':False},row
    assert (row['image']['width'],row['image']['height'],row['image']['fit'])==(945,310,'contain'),row
    assert row['scroll']<=row['card']['width']+1 and not row['pageOverflow'],row
    assert row['primary']['right']<=row['battery']['right']+1,row
    assert all(n['right']<=row['primaryNumber']['right']+1 for n in row['numberInk']),row
    assert any('Geparkeerd' in value['text'] for value in row['values']) and any('98.452' in value['text'] for value in row['values']),row
    assert not any('Gegevensveld' in value['text'] for value in row['values']),row
    if width>=390:assert abs(row['values'][0]['rect']['y']-row['values'][1]['rect']['y'])<1,row
    assert all(v['rect']['y']>=max(row['battery']['bottom'],row['picture']['bottom']) for v in row['values']),row
    if width in [390,1280]:page.screenshot(path=str(OUT/f'context-{name}.png'))
  page.close()
 browser.close()
assert not errors,errors
readbacks=[]
if not args.baseline:
 for origin in [LOCAL,PUBLIC]:
  for name in json.loads((ROOT/'review/public-files.json').read_text()):
   data=b'';mime=''
   for attempt in range(3):
    try:
     with urllib.request.urlopen(origin+name,timeout=45) as response:data=response.read();mime=response.headers.get_content_type()
     assert data==(ROOT/name).read_bytes(),name
     if name.endswith('.png'):assert mime=='image/png',mime
     break
    except Exception:
     if attempt==2:raise
     time.sleep(1)
   readbacks.append({'surface':'local' if origin==LOCAL else 'public','file':name,'sha256':hashlib.sha256(data).hexdigest(),'mime':mime,'bytes':len(data)})
result={'matrix':rows,'readbacks':readbacks,'page_errors':errors,'public_url':PUBLIC+'review/'}
(OUT/'served-results.json').write_text(json.dumps(result,indent=2))
print(json.dumps({'matrix':len(rows),'readbacks':len(readbacks),'page_errors':errors,'public_browser':True,'public_url':PUBLIC+'review/'}))
