"""Real composed shared gallery, no injected replacement renderer."""
from pathlib import Path
import json,hashlib,sys,re
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1];O=R/'qa-evidence/evcc-refinement';O.mkdir(exist_ok=True)
share=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text());base=(share['url'] if '--public' in sys.argv else f"http://127.0.0.1:56515/{share['token']}/")+'cards/'
errors=[];rows=[];stress=[]
SETUP='''({material,dark})=>{if(reviewDark!==dark)document.querySelector('#mode').click();if(!material){for(const k of [...document.body.style])if(k.startsWith('--eleven-'))document.body.style.removeProperty(k);for(const[k,v]of Object.entries({'ha-card-background':dark?'#1c1c1c':'#fff','card-background-color':dark?'#1c1c1c':'#fff','primary-text-color':dark?'#eee':'#212121','secondary-text-color':dark?'#aaa':'#666','secondary-background-color':dark?'#282828':'#eee','ha-card-border-radius':'12px','ha-card-box-shadow':'none','accent-color':'#b43a83','primary-color':'#03a9f4'}))document.body.style.setProperty('--'+k,v)}const c=records.find(r=>r.name==='car-evcc').card;window.c=c;window.originalConfig={...c._config};c.scrollIntoView({block:'center'});}'''
GEOMETRY='''()=>{const r=c.shadowRoot,q=s=>r.querySelector(s),rect=s=>{const b=q(s).getBoundingClientRect();return {x:b.x,right:b.right,y:b.y,bottom:b.bottom,width:b.width,height:b.height}},track=q('.battery-track'),card=q('ha-card'),img=q('img');return {stage:rect('.car-stage'),battery:rect('.battery-row'),picture:rect('.picture'),track:track?rect('.battery-track'):null,fill:track?rect('.battery-fill'):null,readings:rect('.charging-readings'),stacked:q('.car-stage').hasAttribute('data-hero-stacked'),percent:track?.getAttribute('aria-valuenow'),cardOverflow:card.scrollWidth>card.clientWidth+1,pageOverflow:document.documentElement.scrollWidth>innerWidth,hostWidth:c.getBoundingClientRect().width,hostHeight:c.getBoundingClientRect().height,cardHeight:card.getBoundingClientRect().height,img:img?{width:img.naturalWidth,height:img.naturalHeight,src:img.src,filter:getComputedStyle(img).filter}:null,trackShadow:track?getComputedStyle(track).boxShadow:null,fillShadow:track?getComputedStyle(q('.battery-fill')).boxShadow:null,controls:[...r.querySelectorAll('[role=tab],[data-mode],[data-solar-share]')].filter(x=>x.getBoundingClientRect().width>0).map(x=>({text:x.textContent,h:x.getBoundingClientRect().height,w:x.getBoundingClientRect().width,underline:getComputedStyle(x).borderBottomWidth})),state:q('.content').dataset.view,overflow:[...r.querySelectorAll('.primary-value,.ui-metric-value,dd,dt')].filter(x=>x.getBoundingClientRect().width>0&&x.scrollWidth>x.clientWidth+1).map(x=>({text:x.textContent,width:x.clientWidth,scroll:x.scrollWidth}))}}'''
def geometry():
 row=None
 for _ in range(100):
  row=page.evaluate(GEOMETRY)
  if row['img'] and row['img']['width']>0:return row
  page.wait_for_timeout(100)
 raise AssertionError(('image did not decode',row))
def check(row,ordinary=True):
 assert not row['cardOverflow'] and not row['pageOverflow'],row
 assert not row['overflow'],row
 assert row['hostHeight']+1>=row['cardHeight'],row
 if row['track']:
  assert abs(row['track']['width']-row['stage']['width'])<1,row
  assert row['track']['y']>=row['stage']['bottom']+7,row
  assert row['readings']['y']>=row['track']['bottom']+11,row
  assert abs(row['fill']['width']/row['track']['width']-float(row['percent'])/100)<.01,row
  assert row['fillShadow']=='none',row
 if ordinary:
  assert not row['stacked'] and abs(row['picture']['width']/row['battery']['width']-2)<.03,row
  assert row['img']['width']>0 and row['img']['filter']=='none',row
 assert all(v['h']>=44 and v['w']>=44 for v in row['controls']),row
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':1400},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)));page.add_init_script('Date.now=()=>1793520000000')
 for width in [320,390,1280]:
  for material in [False,True]:
   for dark in [False,True]:
    page.set_viewport_size({'width':width,'height':1400});page.goto(base+'review/',wait_until='networkidle');page.wait_for_timeout(1400)
    assert page.evaluate('window.themeFixtureReady===true')
    page.evaluate(SETUP,{'material':material,'dark':dark});page.wait_for_timeout(350)
    group=page.evaluate("()=>({total:records.length,approved:document.querySelectorAll('article[data-review-status=approved]').length,pending:document.querySelectorAll('article[data-review-status=pending]').length,car:document.querySelector('#card-car-card').dataset.reviewStatus,evcc:document.querySelector('#card-car-evcc').dataset.reviewStatus})")
    assert group=={'total':18,'approved':10,'pending':8,'car':'approved','evcc':'pending'},group
    row=geometry();row.update(width=width,material=material,dark=dark);check(row);rows.append(row)
    name=f"{'material' if material else 'native'}-{width}-{'dark' if dark else 'light'}"
    page.locator('[data-card=car-evcc]').screenshot(path=str(O/(name+'.png')))
    if width==1280: assert 360<=row['hostWidth']<=410,row
    # 0/100/unavailable preserve true battery meaning, no fabricated zero.
    for soc in ['0','100','unavailable']:
     page.evaluate("soc=>{const h={...c.hass,states:{...c.hass.states,'sensor.soc':{...c.hass.states['sensor.soc'],state:soc}}};c.hass=h}",soc);page.wait_for_timeout(60)
     r=geometry();check(r);assert (r['track'] is None)==(soc=='unavailable');stress.append({'case':'soc','soc':soc,'width':width,'material':material,'dark':dark})
    # Enlarge actual rendered text once, retain original hierarchy and all labels.
    page.evaluate('''()=>{c.hass={...c.hass,states:{...c.hass.states,'sensor.soc':{...c.hass.states['sensor.soc'],state:'100'}}};const r=c.shadowRoot;for(const el of r.querySelectorAll('.primary-value,.primary-value small,.primary-label,.ui-metric-title,.ui-metric-value,.ui-metric-unit,.ui-metric-info,[role=tab],[data-mode],dt,dd,.solar-scale,.solar-hint')){el.style.fontSize=(parseFloat(getComputedStyle(el).fontSize)*2)+'px'} }''');page.wait_for_timeout(450)
    r=geometry();check(r,False);stress.append({'case':'text200','width':width,'material':material,'dark':dark,'geometry':r});page.locator('[data-card=car-evcc]').screenshot(path=str(O/(name+'-text200.png')))
    # Regain normal layout after actual telemetry replacement, preserve tabs.
    page.evaluate("()=>{c._signature=null;c.hass={...c.hass};}");page.wait_for_timeout(200);check(geometry())
    for tab in ['session','technical','controls']:
     button=page.locator('[data-card=car-evcc]').locator('[data-ui-tab='+tab+']')
     if button.count():
      button.focus();page.keyboard.press('Enter');page.wait_for_timeout(100)
      assert page.evaluate('(tab)=>c.shadowRoot.querySelector(`[data-ui-tab-panel="${tab}"]`).hidden===false',tab)
      if tab=='session':assert page.evaluate("()=>!!c.shadowRoot.querySelector('.plot .series-line')"),'synthetic session history did not render'
      page.evaluate('()=>{c.hass={...c.hass,states:{...c.hass.states}}}');page.wait_for_timeout(60)
      assert page.evaluate('(tab)=>c.shadowRoot.activeElement?.dataset.uiTab===tab',tab)
      assert page.evaluate("()=>getComputedStyle(c.shadowRoot.querySelector('[data-ui-tabs][data-ui-card-tabs]')).overflow==='visible'"),'tab focus outline must not clip'
      if width==390 and material:page.locator('[data-card=car-evcc]').screenshot(path=str(O/(name+'-'+tab+'.png')))
    selected=page.locator('[data-card=car-evcc]').locator('[aria-pressed=true][data-mode]');selected.hover()
    paint=selected.evaluate('(el)=>({color:getComputedStyle(el).color,border:getComputedStyle(el).borderBottomWidth,background:getComputedStyle(el).backgroundImage})');assert paint['border']=='0px',paint
    stress.append({'case':'tab-focus-hover','width':width,'material':material,'dark':dark,'paint':paint})
    slider=page.locator('[data-card=car-evcc]').locator('[data-solar-share]');slider.focus()
    slider_paint=slider.evaluate("""el=>{const root=el.getRootNode(),rule=[...root.styleSheets[0].cssRules].find(r=>r.selectorText==='.content[data-evcc] input[data-solar-share]::-webkit-slider-runnable-track'),probe=document.createElement('span');probe.style.cssText=rule.style.cssText;probe.style.setProperty('--solar-position',el.style.getPropertyValue('--solar-position'));probe.style.position='absolute';probe.style.visibility='hidden';el.parentElement.append(probe);const cs=getComputedStyle(probe),result={background:cs.backgroundImage,height:cs.height,outline:getComputedStyle(el).outlineWidth,accent:getComputedStyle(el).accentColor,fill:getComputedStyle(root.querySelector('.battery-fill')).backgroundColor};probe.remove();return result}""")
    assert slider_paint['background']!='none' and slider_paint['height']=='8px' and slider_paint['outline']=='2px' and slider_paint['accent']==slider_paint['fill'],slider_paint
 # Actual regular source markup identical ignoring appended scoped style (regular paint is separately asserted).
 page.set_viewport_size({'width':390,'height':1200});page.goto(base+'review/',wait_until='networkidle');page.wait_for_timeout(1400)
 html=page.evaluate("records.find(r=>r.name==='car-card').card.shadowRoot.innerHTML")
 before=(O/'entry-car-card.html').read_text();html=html.replace(share['url'],f"http://127.0.0.1:56515/{share['token']}/");strip=lambda s:re.sub(r'<style>.*?</style>','',s,flags=re.S)
 assert strip(before)==strip(html),'approved Auto DOM changed'
 (O/'regular-parity.json').write_text(json.dumps({'markup_without_style_identical':True,'sha256':hashlib.sha256(strip(html).encode()).hexdigest()}))
 page.locator('[data-card=car-evcc]').scroll_into_view_if_needed();page.screenshot(path=str(O/'page-context.png'))
 b.close()
assert not errors,errors
result={'url':base+'review/#card-car-evcc','surface':'public' if '--public' in sys.argv else 'local','matrix':rows,'stress':stress,'page_errors':errors,'groups':group}
(O/('public-results.json' if '--public' in sys.argv else 'browser-results.json')).write_text(json.dumps(result,indent=2));print(json.dumps({'matrix':len(rows),'stress':len(stress),'page_errors':errors,'groups':group,'url':result['url']}))
