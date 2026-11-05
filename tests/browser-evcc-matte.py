"""Real shared gallery matte-flow coverage; historical sweep evidence stays immutable."""
from pathlib import Path
import ast,json,hashlib,re
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parents[1];O=R/'qa-evidence/evcc-matte';O.mkdir(exist_ok=True)
share=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text())
local=f"http://127.0.0.1:56515/{share['token']}/cards/";public=share['url']+'cards/'
tree=ast.parse((R/'tests/browser-evcc-refinement.py').read_text());SETUP=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SETUP' for t in n.targets))
MEASURE="""()=>{const r=c.shadowRoot,f=r.querySelector('.battery-fill'),t=r.querySelector('.battery-track'),p=getComputedStyle(f,'::before'),cs=getComputedStyle(f);return {tone:r.querySelector('.content').dataset.tone,view:r.querySelector('.content').dataset.view,power:r.querySelector('.content').style.getPropertyValue('--power-motion'),duration:p.animationDuration,animation:p.animationName,play:p.animationPlayState,content:p.content,width:p.width,gradient:p.backgroundImage,position:p.backgroundPosition,transform:p.transform,opacity:p.opacity,filter:p.filter,shadow:p.boxShadow,fillShadow:cs.boxShadow,fillColor:cs.backgroundColor,accent:getComputedStyle(c).getPropertyValue('--accent-color').trim(),fillWidth:f.getBoundingClientRect().width,trackWidth:t.getBoundingClientRect().width,soc:t.getAttribute('aria-valuenow'),trackHeight:t.getBoundingClientRect().height}}"""
ANIM="c.shadowRoot.querySelector('.content').getAnimations({subtree:true}).find(a=>a.animationName==='evcc-matte-flow')"
PHASE="""phase=>{const a=ANIM;if(!a)throw Error('matte flow absent');a.pause();const t=a.effect.getTiming();let time=t.delay+t.duration*phase;while(time<0)time+=t.duration;a.currentTime=time;return {time:a.currentTime,delay:t.delay,duration:t.duration,progress:a.effect.getComputedTiming().progress}}""".replace('ANIM',ANIM)
AUTO="""()=>{const r=records.find(r=>r.name==='car-card').card.shadowRoot;return ['.content','.hero','.car-stage','.picture','.picture img','.battery-row','.battery-track','.battery-fill','.car-readings'].map(s=>{const e=r.querySelector(s);if(!e)return {s,missing:true};const cs=getComputedStyle(e),b=e.getBoundingClientRect();return {s,width:b.width,height:b.height,paint:Object.fromEntries(['background','color','boxShadow','filter','opacity','borderRadius','animation','transform'].map(k=>[k,cs[k]])),pseudo:['::before','::after'].map(p=>{const v=getComputedStyle(e,p);return Object.fromEntries(['content','background','filter','animation','opacity','transform'].map(k=>[k,v[k]]))})}})}"""
rows=[];errors=[];strips=[];auto=[]
# Reconstruct exact dirty task-entry bundle only for approved Auto parity.
current=(R/'cards/car-card/src/evcc/evcc-styles.js').read_text();old=(O/'entry-evcc-styles.js').read_text()
a=current.index('/* EVCC matte flow:');z=current.index('.content[data-evcc] .charging-status',a)
x=old.index('/* Clearer charging sweep');y=old.index('.content[data-evcc] .charging-status',x)
newblock=current[a:z];oldblock=old[x:y]
data=(R/'dist/eleven-cards.js').read_text();before=data.replace(newblock,oldblock)
assert hashlib.sha256(before.encode()).hexdigest()==json.loads((O/'entry-hashes.json').read_text())['dist/eleven-cards.js']
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':1400},reduced_motion='no-preference');page.on('pageerror',lambda e:errors.append(str(e)));page.add_init_script('Date.now=()=>1793520000000')
 def setup(base,width,material,dark):
  page.set_viewport_size({'width':width,'height':1400});page.goto(base+'review/',wait_until='networkidle');page.wait_for_function('()=>window.themeFixtureReady===true');page.evaluate(SETUP,{'material':material,'dark':dark});page.wait_for_function('()=>c.shadowRoot.querySelector("img")?.naturalWidth>0');page.wait_for_timeout(160);page.evaluate('clearInterval(c._clockTimer)')
 for material in [False,True]:
  for dark in [False,True]:
   page.route('**/dist/eleven-cards.js*',lambda route:route.fulfill(status=200,content_type='text/javascript',body=before));setup(local,390,material,dark);entry=page.evaluate(AUTO);page.unroute('**/dist/eleven-cards.js*');setup(local,390,material,dark);after=page.evaluate(AUTO);assert entry==after,(entry,after);auto.append({'material':material,'dark':dark,'identical':True,'paint':after})
 for surface,base,widths in [('local',local,[320,390,1280]),('public',public,[390])]:
  for width in widths:
   for material in [False,True]:
    for dark in [False,True]:
     setup(base,width,material,dark);name=f"{surface}-{'material' if material else 'native'}-{width}-{'dark' if dark else 'light'}";m=page.evaluate(MEASURE)
     assert m['animation']=='evcc-matte-flow' and m['power']=='running',m
     t0=page.evaluate('()=>'+ANIM+'.currentTime');page.wait_for_timeout(220);t1=page.evaluate('()=>'+ANIM+'.currentTime');assert t1-t0>150
     row={'surface':surface,'width':width,'material':material,'dark':dark,'advance_ms':t1-t0,'frames':[]}
     for phase in [.125,.5,.875]:
      timing=page.evaluate(PHASE,phase);assert abs(timing['progress']-phase)<.001,timing;page.wait_for_timeout(40);m=page.evaluate(MEASURE)
      assert m['filter']=='none' and m['shadow']=='none' and m['fillShadow']=='none' and m['transform']=='none' and m['opacity']=='0.32',m
      assert 'repeating-linear-gradient' in m['gradient'] and abs(float(m['width'][:-2])-m['fillWidth'])<.1,m
      assert abs(m['fillWidth']/m['trackWidth']-float(m['soc'])/100)<.01 and m['trackHeight']==8,m
      track=O/f'{name}-phase-{phase}-track.png';page.locator('[data-card=car-evcc]').locator('.battery-track').screenshot(path=str(track),animations='allow');row['frames'].append({'phase':phase,'timing':timing,'computed':m,'path':str(track),'sha256':hashlib.sha256(track.read_bytes()).hexdigest()})
      if phase==.5:page.locator('[data-card=car-evcc]').screenshot(path=str(O/f'{name}.png'),animations='allow')
     assert len({f['sha256'] for f in row['frames']})==3;strips.append((name,[f['path'] for f in row['frames']]))
     # Actual telemetry rerenders, no CSS-only state substitution.
     def power(value):
      page.evaluate("value=>{const id=c._entities.power;c.hass={...c.hass,states:{...c.hass.states,[id]:{...c.hass.states[id],state:value}}}}",value);page.wait_for_timeout(80)
     row['power']=[]
     for value in ['1100','11000','0','unavailable']:
      power(value);v=page.evaluate(MEASURE);row['power'].append({'state':value,'computed':v})
      assert v['power']==('paused' if value in ['0','unavailable'] else 'running'),v
      if value in ['0','unavailable']:
       t0=page.evaluate('()=>'+ANIM+'.currentTime');page.wait_for_timeout(120);t1=page.evaluate('()=>'+ANIM+'.currentTime');assert abs(t1-t0)<1
     assert float(row['power'][0]['computed']['duration'][:-1])>float(row['power'][1]['computed']['duration'][:-1])
     power('7100');page.evaluate('()=>{c.hass={...c.hass,connected:false}}');page.wait_for_timeout(80);row['offline']=page.evaluate(MEASURE);assert row['offline']['power']=='paused',row['offline']
     page.evaluate('()=>{c.hass={...c.hass,connected:true}}');page.wait_for_timeout(80);assert page.evaluate(MEASURE)['power']=='running'
     row['styles']=[]
     for style in ['soft','line','default']:
      page.evaluate("style=>{c.setConfig({...c._config,battery_style:style})}",style);page.wait_for_timeout(100);v=page.evaluate(MEASURE);assert v['filter']=='none' and v['animation']=='evcc-matte-flow' and 'repeating-linear-gradient' in v['gradient'],v;row['styles'].append({'style':style,'computed':v})
     page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(80);row['reduced']=page.evaluate(MEASURE);assert row['reduced']['content']=='none' and row['reduced']['animation']=='none',row['reduced'];page.emulate_media(reduced_motion='no-preference')
     rows.append(row)
 b.close()
assert not errors,errors
canvas=Image.new('RGB',(1100,len(strips)*84),'#eee');draw=ImageDraw.Draw(canvas)
for i,(name,paths) in enumerate(strips):
 draw.text((8,i*84+2),name,fill='#111')
 for j,path in enumerate(paths):
  im=Image.open(path).convert('RGB').resize((340,32),Image.Resampling.NEAREST);canvas.paste(im,(8+j*365,i*84+24))
canvas.save(O/'phase-contact.png')
result={'cases':rows,'auto_parity':auto,'page_errors':errors,'url':public+'review/#card-car-evcc'};(O/'browser-results.json').write_text(json.dumps(result,indent=2));print(json.dumps({'cases':len(rows),'frames':sum(len(r['frames']) for r in rows),'auto_parity':len(auto),'page_errors':errors,'url':result['url']}))
