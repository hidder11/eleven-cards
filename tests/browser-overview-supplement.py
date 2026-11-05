"""Supplemental theme text contrast, wide 3-column and held retry checks."""
import json,re,yaml
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-evidence/overview-refinement'
URL='http://127.0.0.1:56515/JC5klAkxdKA9PmJO7YSGqy76RQb7-mo6C0aJPXHgbsI/cards/review/'
theme=yaml.safe_load((ROOT/'themes/eleven_material.yaml').read_text())['Eleven Material']
def lum(rgb):
 vals=[v/255 for v in rgb];return sum((v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4)*w for v,w in zip(vals,[.2126,.7152,.0722]))
def ratio(a,b):
 lo,hi=sorted([lum(a),lum(b)]);return (hi+.05)/(lo+.05)
def rgb(s):return [float(x) for x in re.findall(r'[\d.]+',s)[:3]]
errors=[];contrasts=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1280,'height':1100},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(URL);page.wait_for_function("window.themeFixtureReady&&records.find(r=>r.name==='overview-card').card._status==='ready'")
 card=page.locator('[data-card=overview-card]');card.scroll_into_view_if_needed()
 for material,dark in [(False,False),(False,True),(True,False),(True,True)]:
  tokens={'ha-card-border-radius':'12px','ha-card-border-width':'1px','ha-card-box-shadow':'none','primary-color':'#03a9f4','accent-color':'#a86ae0','ha-card-background':'var(--card-background-color)'}
  tokens.update({'primary-background-color':'#111111','card-background-color':'#1c1c1c','primary-text-color':'#e1e1e1','secondary-text-color':'#9b9b9b','secondary-background-color':'#282828','divider-color':'#424242'} if dark else {'primary-background-color':'#fafafa','card-background-color':'#fff','primary-text-color':'#212121','secondary-text-color':'#727272','secondary-background-color':'#f2f2f2','divider-color':'#e0e0e0'})
  if material:tokens.update({k:v for k,v in theme.items() if k!='modes'});tokens.update(theme['modes']['dark' if dark else 'light'])
  page.evaluate('''tokens=>{for(const k of [...document.body.style])if(k.startsWith('--'))document.body.style.removeProperty(k);for(const[k,v]of Object.entries(tokens))document.body.style.setProperty('--'+k,v)}''',{k:str(v) for k,v in tokens.items()})
  colors=card.evaluate('''c=>{const root=c.shadowRoot,probe=document.createElement('span');probe.style.color='var(--card-background-color)';root.append(probe);const base=getComputedStyle(probe).color;probe.remove();return {base,well:getComputedStyle(root.querySelector('.metric')).backgroundColor,roles:Object.fromEntries(['h2','.period','.label','.value','.unit','.delta','.caption','.spark'].map(s=>[s,getComputedStyle(root.querySelector(s)).color]))}}''')
  mode=('material' if material else 'ha')+('-dark' if dark else '-light')
  for role,color in colors['roles'].items():
   bg=rgb(colors['base'] if role in ['h2','.period'] or not material else colors['well']);fg=rgb(color)
   # The optional card gradient ends at a 2% black mix; test both endpoints.
   samples=[bg,[v*.98 for v in bg]] if material and role in ['h2','.period'] else [bg]
   result={'mode':mode,'role':role,'foreground':color,'backgrounds':samples,'minimumRatio':min(ratio(fg,x) for x in samples)}
   assert result['minimumRatio']>=4.5,result;contrasts.append(result)
 # Wide host proves the configured third column is not removed.
 page.evaluate('''()=>{window.ov=records.find(r=>r.name==='overview-card').card;ov.parentElement.parentElement.style.gridTemplateColumns='1fr';ov.style.width='760px';ov._config.columns='3';ov._config.entities=Array.from({length:8},(_,i)=>({...ov._config.entities[i%2],entity:i%2?'sensor.temperature':'sensor.power',name:'Sensor '+(i+1)}));ov._render()}''')
 page.wait_for_timeout(200)
 wide=card.evaluate('''c=>({columns:getComputedStyle(c.shadowRoot.querySelector('.grid')).gridTemplateColumns.split(' ').length,count:c.shadowRoot.querySelectorAll('.metric').length,host:c.clientWidth,overflow:c.shadowRoot.querySelector('.content').scrollWidth>c.shadowRoot.querySelector('.content').clientWidth})''')
 assert wide=={'columns':3,'count':8,'host':760,'overflow':False},wide
 card.screenshot(path=str(OUT/'wide-760-three-columns.png'))
 # Pending retry retains keyboard focus through unrelated and relevant updates.
 page.evaluate('''()=>{ov._status='error';ov._hass={...ov.hass,callApi:()=>new Promise(resolve=>window.resolveRetry=resolve)};clearTimeout(ov._timer);ov._promise=null;ov._render()}''')
 card.locator('.retry').focus();page.keyboard.press('Enter');assert page.evaluate('!!ov._promise')
 page.evaluate("ov.hass={...ov.hass,states:{...ov.hass.states,'sensor.power':{...ov.hass.states['sensor.power'],state:'613'}}}")
 assert card.evaluate("c=>c.shadowRoot.activeElement?.classList.contains('retry')")
 page.evaluate('resolveRetry([])');page.wait_for_function("ov._status==='ready'")
 assert card.evaluate("c=>c.shadowRoot.activeElement?.dataset.entity")=='sensor.power'
 for i in range(10):
  page.evaluate("value=>ov.hass={...ov.hass,states:{...ov.hass.states,'sensor.power':{...ov.hass.states['sensor.power'],state:String(value)}}}",700+i)
  assert card.evaluate("c=>c.shadowRoot.activeElement?.dataset.entity")=='sensor.power'
 page.emulate_media(forced_colors='active');assert card.locator('ha-card').evaluate('e=>getComputedStyle(e).boxShadow')=='none';page.emulate_media(forced_colors='none')
 page.emulate_media(reduced_motion='no-preference')
 page.evaluate("ov.hass={...ov.hass,states:{...ov.hass.states,'sensor.power':{...ov.hass.states['sensor.power'],state:'999999999999.23'}}}")
 page.wait_for_timeout(450)
 animation=card.evaluate('''c=>{const n=c.shadowRoot.querySelector('.value'),r=document.createRange();r.selectNodeContents(n);return {value:n.textContent,expected:c._format(999999999999.23),pending:c._animationFrame,contained:r.getBoundingClientRect().right<=n.closest('.metric').getBoundingClientRect().right-9}}''')
 assert animation['value']==animation['expected'] and animation['pending'] is None and animation['contained'],animation
 assert not errors,errors
 result={'contrasts':contrasts,'wide':wide,'heldRetryFocus':True,'relevantUpdatesWithFocus':10,'animation':animation,'forcedColorsShadow':False,'errors':errors}
 (OUT/'supplement-results.json').write_text(json.dumps(result,indent=2));print(json.dumps({'contrastRoles':len(contrasts),'minimumTextContrast':min(x['minimumRatio'] for x in contrasts),'wide':wide,'heldRetryFocus':True,'errors':errors}));b.close()
