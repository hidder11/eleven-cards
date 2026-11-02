"""Sample the real composed EVCC battery animation; no alternate renderer."""
from pathlib import Path
import ast,json,sys,hashlib
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parents[1];O=R/'qa-evidence/evcc-animation';O.mkdir(exist_ok=True)
before='--before' in sys.argv;label='before' if before else 'after-public' if '--public' in sys.argv else 'after'
s=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text());base=(s['url'] if '--public' in sys.argv else f"http://127.0.0.1:56515/{s['token']}/")+'cards/'
tree=ast.parse((R/'tests/browser-evcc-refinement.py').read_text());SETUP=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SETUP' for t in n.targets))
# Reproduce before bytes for normalized comparative captures after the edit.
# Reversal is accepted only if the complete served bundle matches entry SHA256.
server=None
if before and b'Clearer charging sweep' in (R/'dist/eleven-cards.js').read_bytes():
 import threading,re
 from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
 from functools import partial
 data=(R/'dist/eleven-cards.js').read_bytes()
 original=re.sub(rb'/\* Clearer charging sweep, clipped to true SOC: no glow and original timing\. \*/\n\.content\[data-evcc\]\[data-battery-style\] \.battery-fill::before\{[^}]+\}\n',b'',data)
 expected=json.loads((O/'followup-entry-hashes.json').read_text())['dist/eleven-cards.js']
 assert hashlib.sha256(original).hexdigest()==expected,'before reconstruction not byte-identical to follow-up entry'
 class BeforeHandler(SimpleHTTPRequestHandler):
  def log_message(self,format,*args):pass
  def do_GET(self):
   if self.path.split('?')[0]=='/dist/eleven-cards.js':
    self.send_response(200);self.send_header('Content-Type','text/javascript');self.end_headers();self.wfile.write(original)
   else:super().do_GET()
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(BeforeHandler,directory=str(R)));threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/'
 (O/'before-reconstructed-bundle.json').write_text(json.dumps({'sha256':expected,'byte_identical_to_followup_entry':True}))
MEASURE="""()=>{const r=c.shadowRoot,f=r.querySelector('.battery-fill'),t=r.querySelector('.battery-track'),p=getComputedStyle(f,'::before'),cs=getComputedStyle(f);return {tone:r.querySelector('.content').dataset.tone,view:r.querySelector('.content').dataset.view,power:r.querySelector('.content').style.getPropertyValue('--power-motion'),duration:p.animationDuration,animation:p.animationName,play:p.animationPlayState,content:p.content,width:p.width,gradient:p.backgroundImage,transform:p.transform,opacity:p.opacity,filter:p.filter,shadow:p.boxShadow,fillShadow:cs.boxShadow,fillWidth:f.getBoundingClientRect().width,trackWidth:t.getBoundingClientRect().width,soc:t.getAttribute('aria-valuenow'),trackHeight:t.getBoundingClientRect().height}}"""
PHASE="""phase=>{const a=c.shadowRoot.querySelector('.content').getAnimations({subtree:true}).find(a=>a.animationName==='battery-sweep');if(!a)throw Error('actual battery-sweep absent');a.pause();const timing=a.effect.getTiming();let time=timing.delay+timing.duration*phase;while(time<0)time+=timing.duration;a.currentTime=time;return {time:a.currentTime,delay:timing.delay,duration:timing.duration,activePhase:a.effect.getComputedTiming().progress}}"""
def wait_image(page):
 for _ in range(120):
  if page.evaluate('()=>c.shadowRoot.querySelector("img")?.naturalWidth>0'):return
  page.wait_for_timeout(100)
 raise AssertionError('real gallery car image did not decode')
rows=[];errors=[];strips=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':1400},reduced_motion='no-preference');page.on('pageerror',lambda e:errors.append(str(e)))
 for width in ([390] if before else [320,390,1280]):
  for material in [False,True]:
   for dark in [False,True]:
    page.set_viewport_size({'width':width,'height':1400});page.goto(base+'review/',wait_until='networkidle');page.wait_for_timeout(1400);assert page.evaluate('window.themeFixtureReady===true');page.evaluate(SETUP,{'material':material,'dark':dark});wait_image(page);page.wait_for_timeout(200);page.evaluate('clearInterval(c._clockTimer)')
    name=f"{label}-{'material' if material else 'native'}-{width}-{'dark' if dark else 'light'}"
    # Prove the live animation advances before pinning reproducible render phases.
    running=page.evaluate("""()=>{const a=c.shadowRoot.querySelector('.content').getAnimations({subtree:true}).find(a=>a.animationName==='battery-sweep');return {time:a.currentTime,play:a.playState}}""")
    page.wait_for_timeout(240)
    advanced=page.evaluate("""()=>{const a=c.shadowRoot.querySelector('.content').getAnimations({subtree:true}).find(a=>a.animationName==='battery-sweep');return {time:a.currentTime,play:a.playState}}""")
    assert running['play']=='running' and advanced['time']>running['time']+150,(running,advanced)
    row={'width':width,'material':material,'dark':dark,'advance_ms':advanced['time']-running['time'],'frames':[]}
    for phase in [.25,.5,.75]:
     timing=page.evaluate(PHASE,phase);assert timing['activePhase'] is not None and abs(timing['activePhase']-phase)<.001,timing;page.wait_for_timeout(40);m=page.evaluate(MEASURE)
     assert m['filter']==('opacity(0.45)' if before else 'none') and m['shadow']=='none' and m['fillShadow']=='none',m
     assert abs(m['fillWidth']/m['trackWidth']-float(m['soc'])/100)<.01 and m['trackHeight']==8,m
     assert m['content']=='""' and m['animation']=='battery-sweep',m
     assert abs(float(m['width'].replace('px',''))/m['fillWidth']-(.42 if before else .56))<.01,m
     track=O/f'{name}-phase-{phase}-track.png';page.locator('[data-card=car-evcc]').locator('.battery-track').screenshot(path=str(track),animations='allow')
     row['frames'].append({'phase':phase,'timing':timing,'computed':m,'screenshot':str(track),'sha256':hashlib.sha256(track.read_bytes()).hexdigest()})
     if phase==.5:page.locator('[data-card=car-evcc]').screenshot(path=str(O/f'{name}.png'),animations='allow')
    assert len({f['sha256'] for f in row['frames']})==3,'rendered phases identical'
    strips.append((name,[f['screenshot'] for f in row['frames']]))
    if not before:
     # Zero and unavailable power pause the original animation; no new independent loop.
     for power in ['0','unavailable']:
      page.evaluate("""power=>{const id=c._entities.power;c.hass={...c.hass,states:{...c.hass.states,[id]:{...c.hass.states[id],state:power}}}}""",power);page.wait_for_timeout(100);m=page.evaluate(MEASURE);assert m['power']=='paused' and m['play']=='paused',m
      a=page.evaluate("""()=>c.shadowRoot.querySelector('.content').getAnimations({subtree:true}).find(a=>a.animationName==='battery-sweep').currentTime""");page.wait_for_timeout(150);z=page.evaluate("""()=>c.shadowRoot.querySelector('.content').getAnimations({subtree:true}).find(a=>a.animationName==='battery-sweep').currentTime""");assert abs(a-z)<1,(a,z)
     # Real media preference disables the pseudo while actively charging, not a paused shining frame.
     page.evaluate("""()=>{const id=c._entities.power;c.hass={...c.hass,states:{...c.hass.states,[id]:{...c.hass.states[id],state:'7100'}}}}""");page.wait_for_timeout(80);assert page.evaluate(MEASURE)['power']=='running'
     page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(80);m=page.evaluate(MEASURE);assert m['content']=='none' and m['animation']=='none',m
     page.locator('[data-card=car-evcc]').screenshot(path=str(O/f'{name}-reduced.png'));row['reduced_motion']=m
     page.emulate_media(reduced_motion='no-preference')
    rows.append(row)
 b.close()
assert not errors,errors
# Native pixels, magnified nearest-neighbor only to make 8px samples inspectable.
canvas=Image.new('RGB',(1100,len(strips)*95),'#eee');draw=ImageDraw.Draw(canvas)
for i,(name,paths) in enumerate(strips):
 draw.text((8,i*95+2),name,fill='#111')
 for j,path in enumerate(paths):
  im=Image.open(path).convert('RGB');im=im.resize((340,32),Image.Resampling.NEAREST);canvas.paste(im,(8+j*365,i*95+27));draw.text((8+j*365,i*95+63),f'phase {[.25,.5,.75][j]}',fill='#111')
canvas.save(O/f'{label}-animation-contact.png')
(O/f'{label}-results.json').write_text(json.dumps({'cases':rows,'page_errors':errors,'url':base+'review/#card-car-evcc'},indent=2))
print(json.dumps({'label':label,'matrix':len(rows),'rendered_samples':sum(len(r['frames']) for r in rows),'page_errors':errors,'contact':str(O/f'{label}-animation-contact.png')}))
