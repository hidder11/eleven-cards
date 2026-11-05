from pathlib import Path
import ast,json,hashlib,urllib.request
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1];O=R/'qa-evidence/evcc-breathe';O.mkdir(exist_ok=True)
share=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text());base=share['url']+'cards/'
tree=ast.parse((R/'tests/browser-evcc-refinement.py').read_text());SETUP=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SETUP' for t in n.targets))
M="""()=>{const f=c.shadowRoot.querySelector('.battery-fill'),s=getComputedStyle(f,'::before'),t=c.shadowRoot.querySelector('.battery-track');return {animation:s.animationName,opacity:+s.opacity,background:s.backgroundImage,transform:s.transform,filter:s.filter,shadow:s.boxShadow,content:s.content,play:s.animationPlayState,ratio:f.getBoundingClientRect().width/t.getBoundingClientRect().width,soc:+t.getAttribute('aria-valuenow')}}"""
A="c.shadowRoot.getAnimations().find(a=>a.animationName==='evcc-accent-breathe')"
rows=[];errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox']);page=b.new_page(viewport={'width':390,'height':1400},reduced_motion='no-preference');page.on('pageerror',lambda e:errors.append(str(e)))
 for material in [False,True]:
  for dark in [False,True]:
   page.goto(base+'review/',wait_until='networkidle');page.wait_for_function('()=>window.themeFixtureReady===true');page.evaluate(SETUP,{'material':material,'dark':dark});page.wait_for_function('()=>c.shadowRoot.querySelector("img")?.naturalWidth>0');page.evaluate('clearInterval(c._clockTimer)');page.wait_for_timeout(150)
   assert page.evaluate(M)['animation']=='evcc-accent-breathe'
   t0=page.evaluate('()=>'+A+'.currentTime');page.wait_for_timeout(200);assert page.evaluate('()=>'+A+'.currentTime')>t0+100
   frames=[]
   for phase in [0,.5,.99]:
    page.evaluate("phase=>{const a="+A+";a.pause();const t=a.effect.getTiming();let v=t.delay+t.duration*phase;while(v<0)v+=t.duration;a.currentTime=v}",phase);page.wait_for_timeout(40);v=page.evaluate(M)
    assert v['background']=='none' and v['transform']=='none' and v['filter']=='none' and v['shadow']=='none',v
    assert abs(v['ratio']-v['soc']/100)<.01
    assert (abs(v['opacity']-(.42 if dark else .26))<.01 if phase==.5 else v['opacity']<.01),v
    assert abs(page.evaluate("()=>parseFloat(getComputedStyle(c.shadowRoot.querySelector('.battery-fill'),'::before').animationDuration)")-2.4)<.001
    frames.append(v)
    name=f"{'material' if material else 'native'}-{'dark' if dark else 'light'}"
    page.locator('[data-card=car-evcc]').screenshot(path=str(O/(name+f'-phase-{phase}.png')),animations='allow')
   name=f"{'material' if material else 'native'}-{'dark' if dark else 'light'}";page.locator('[data-card=car-evcc]').screenshot(path=str(O/(name+'.png')),animations='allow')
   page.evaluate("()=>{const id=c._entities.power;c.hass={...c.hass,states:{...c.hass.states,[id]:{...c.hass.states[id],state:'0'}}}} ");page.wait_for_timeout(100);assert page.evaluate(M)['play']=='paused'
   page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(50);v=page.evaluate(M);assert v['content']=='none' and v['animation']=='none';page.emulate_media(reduced_motion='no-preference');rows.append({'material':material,'dark':dark,'frames':frames})
 b.close()
assert not errors,errors
served=urllib.request.urlopen(base+'dist/eleven-cards.js').read();assert served==(R/'dist/eleven-cards.js').read_bytes()
result={'cases':rows,'page_errors':errors,'served_sha256':hashlib.sha256(served).hexdigest()};(O/'results.json').write_text(json.dumps(result,indent=2));print(json.dumps({'cases':len(rows),'page_errors':errors,'public_bytes_match':True}))
