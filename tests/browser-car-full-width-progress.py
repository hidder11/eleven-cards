import json,hashlib,urllib.request,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]; O=R/'qa-evidence/car-full-width-progress';O.mkdir(parents=True,exist_ok=True)
token=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text())['token']
base=(f'https://kyle-modules-tions-donald.trycloudflare.com/{token}/cards/' if '--public' in sys.argv else f'http://127.0.0.1:56515/{token}/cards/')
rows=[];errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':1200},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'review/',wait_until='networkidle');page.wait_for_function('window.themeFixtureReady===true')
 for width in [320,390,1280]:
  page.set_viewport_size({'width':width,'height':1200})
  for dark in [False,True]:
   page.evaluate('dark=>{if(reviewDark!==dark)document.querySelector("#mode").click();records.find(r=>r.name==="car-card").card.scrollIntoView({block:"center"})}',dark)
   page.wait_for_timeout(500)
   row=page.evaluate('''()=>{const r=records.find(r=>r.name==='car-card').card.shadowRoot,q=s=>r.querySelector(s),rect=s=>{const b=q(s).getBoundingClientRect();return {x:b.x,right:b.right,y:b.y,bottom:b.bottom,width:b.width,height:b.height}},s=getComputedStyle(q('.battery-track'));return {track:rect('.battery-track'),stage:rect('.car-stage'),battery:rect('.battery-row'),picture:rect('.picture'),readings:rect('.car-readings'),fill:rect('.battery-fill'),shadow:s.boxShadow,trackBackground:s.backgroundColor,cardOverflow:q('ha-card').scrollWidth>q('ha-card').clientWidth,pageOverflow:document.documentElement.scrollWidth>innerWidth,percent:q('[role=progressbar]').getAttribute('aria-valuenow')}}''')
   row.update(width=width,dark=dark);rows.append(row)
   assert abs(row['track']['width']-row['stage']['width'])<1,('track must fill full hero width',row)
   assert abs(row['track']['x']-row['stage']['x'])<1,row
   assert row['track']['y']>=row['stage']['bottom']+7,row
   assert row['readings']['y']>=row['track']['bottom']+11,row
   assert abs(row['picture']['width']/row['battery']['width']-2)<.02,row
   assert abs(row['fill']['width']/row['track']['width']-float(row['percent'])/100)<.01,row
   assert not row['cardOverflow'] and not row['pageOverflow'],row
   page.locator('[data-card=car-card]').screenshot(path=str(O/f'material-{width}-{"dark" if dark else "light"}.png'))
 if '--baseline' not in sys.argv:
  # All native/material modes and enlarged text, and numerical/unavailable states.
  for material in [False,True]:
   for dark in [False,True]:
    page.set_viewport_size({'width':390,'height':1200});page.reload(wait_until='networkidle');page.wait_for_function('window.themeFixtureReady===true')
    page.evaluate('''({material,dark})=>{if(reviewDark!==dark)document.querySelector('#mode').click();if(!material){for(const k of [...document.body.style])if(k.startsWith('--eleven-'))document.body.style.removeProperty(k);for(const [k,v]of Object.entries({'ha-card-background':dark?'#1c1c1c':'#fff','card-background-color':dark?'#1c1c1c':'#fff','primary-text-color':dark?'#eee':'#212121','secondary-background-color':dark?'#282828':'#eee','accent-color':'#db4985','primary-color':'#03a9f4'}))document.body.style.setProperty('--'+k,v);}const c=records.find(r=>r.name==='car-card').card;c.scrollIntoView({block:'center'});}''',{'material':material,'dark':dark})
    for pct in [0,100,None]:
     page.evaluate('''pct=>{const c=records.find(r=>r.name==='car-card').card;c.setConfig({...c._config,percentage_entity:'',percentage:pct});}''',pct);page.wait_for_timeout(150)
     assert page.evaluate('''()=>{const r=records.find(r=>r.name==='car-card').card.shadowRoot,t=r.querySelector('.battery-track'),s=r.querySelector('.car-stage');return Math.abs(t.clientWidth-s.clientWidth)<1}''')
    page.evaluate('''()=>{const c=records.find(r=>r.name==='car-card').card;c.setConfig({...c._config,percentage:100});const st=document.createElement('style');st.textContent='.primary-value{font-size:88px!important}.primary-value small{font-size:32px!important}';c.shadowRoot.append(st);}''');page.wait_for_timeout(300)
    assert page.evaluate('''()=>{const r=records.find(r=>r.name==='car-card').card.shadowRoot,t=r.querySelector('.battery-track'),s=r.querySelector('.car-stage');return Math.abs(t.clientWidth-s.clientWidth)<1&&t.getBoundingClientRect().top>=s.getBoundingClientRect().bottom+7}''')
    page.locator('[data-card=car-card]').screenshot(path=str(O/f'stress-{material}-{dark}.png'))
 b.close()
assert not errors,errors
(O/'results.json').write_text(json.dumps({'matrix':rows,'errors':errors},indent=2))
print(json.dumps({'matrix':len(rows),'stress_theme_modes':4,'page_errors':errors}))
