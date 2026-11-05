"""Real served Actions regression/matrix; synthetic services only, never HA."""
import json, os, yaml
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-evidence/actions-icon-grid';OUT.mkdir(exist_ok=True)
TOKEN=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text())['token']
URL=f'http://127.0.0.1:56515/{TOKEN}/cards/review/'
THEME=yaml.safe_load((ROOT/'themes/eleven_material.yaml').read_text())['Eleven Material']
errors=[];matrix=[];stress=[];interactions=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':1200},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(URL);page.wait_for_function('window.themeFixtureReady');card=page.locator('[data-card=actions-card]')
 page.evaluate("window.ar=records.find(r=>r.name==='actions-card');window.ac=ar.card;window.savedConfig=structuredClone(ac._config);window.savedHass=ac.hass")
 def paint(material,dark):
  tokens={'ha-card-border-radius':'12px','ha-card-border-width':'1px','ha-card-box-shadow':'none','primary-color':'#03a9f4','accent-color':'#a86ae0','ha-card-background':'var(--card-background-color)'}
  tokens.update({'primary-background-color':'#111','card-background-color':'#1c1c1c','primary-text-color':'#e1e1e1','secondary-text-color':'#aaa','secondary-background-color':'#282828','divider-color':'#424242'} if dark else {'primary-background-color':'#fafafa','card-background-color':'#fff','primary-text-color':'#212121','secondary-text-color':'#666','secondary-background-color':'#f2f2f2','divider-color':'#ddd'})
  if material:tokens.update({k:v for k,v in THEME.items() if k!='modes'});tokens.update(THEME['modes']['dark' if dark else 'light'])
  tokens['accent-color']='#a86ae0'
  page.evaluate('''({tokens,dark})=>{for(const k of [...document.body.style])if(k.startsWith('--'))document.body.style.removeProperty(k);for(const[k,v]of Object.entries(tokens))document.body.style.setProperty('--'+k,v);document.body.style.colorScheme=dark?'dark':'light';ac.hass={...ac.hass,themes:{darkMode:dark}}}''',{'tokens':{k:str(v) for k,v in tokens.items()},'dark':dark})
 def reset():page.evaluate("ac.setConfig({...savedConfig,actions:[{entity:'scene.evening',name:'Avond'}]});ac.hass=savedHass")
 def shot(name):
  card.scroll_into_view_if_needed();page.wait_for_timeout(80);card.screenshot(path=str(OUT/(name+'.png')))
 def measure():
  return card.evaluate('''c=>{const r=c.shadowRoot,box=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}},s=e=>getComputedStyle(e),grid=r.querySelector('.actions'),title=r.querySelector('h2');return {host:box(c),surface:box(r.querySelector('ha-card')),heading:title?{...box(title),size:s(title).fontSize,weight:s(title).fontWeight}:null,group:grid?{...box(grid),columns:s(grid).gridTemplateColumns,gap:s(grid).gap}:null,overflow:r.querySelector('.content').scrollWidth>r.querySelector('.content').clientWidth+1,actions:[...r.querySelectorAll('.action')].map(e=>{const icon=e.querySelector('ha-icon'),label=e.querySelector('.split-label'),range=document.createRange();range.selectNodeContents(label);return {...box(e),text:label.textContent,disabled:e.disabled,direction:s(e).flexDirection,decoration:s(e).textDecorationLine,icon:box(icon),label:{...box(label),ink:box(range),size:s(label).fontSize},clearance:label.getBoundingClientRect().left-icon.getBoundingClientRect().right,outline:s(e).outlineColor}})}}''')
 def valid(m):
  assert not m['overflow'],m
  assert m['surface']['bottom']<=m['host']['bottom']+1,m
  if m['heading']:assert m['heading']['size'] in ('16px','32px'),m
  for a in m['actions']:
   assert a['w']>=44 and a['h']>=44 and a['direction']=='column' and a['decoration']=='none',a
   assert a['label']['y']-a['icon']['bottom']>=7.9,a
   assert abs((a['icon']['x']+a['icon']['w']/2)-(a['x']+a['w']/2))<1,a
   assert a['icon']['w'] in (32,64) and a['label']['size'] in ('13px','26px'),a
   assert a['label']['ink']['right']<=a['right']-9 and a['label']['ink']['bottom']<=a['bottom']-9,a
 if os.getenv('BASELINE'):
  result=[]
  for width in [320,390,1280]:
   page.set_viewport_size({'width':width,'height':1200});reset();paint(True,False);shot(f'before-material-light-{width}');result.append({'width':width,'geometry':measure()})
  page.evaluate("ac.setConfig({...savedConfig,actions:[{entity:'scene.evening',name:'Avond',description:'Rustig licht in de woonkamer'},{entity:'scene.evening',name:'Samen eten'},{entity:'scene.evening',name:'Film kijken',description:'Lampen dimmen en gordijnen sluiten'},{entity:'scene.evening',name:'Iedereen naar bed'}]})");shot('before-multiple-material-light-1280')
  (OUT/'before.json').write_text(json.dumps(result,indent=2));print('Baseline captured');b.close();raise SystemExit
 if os.getenv('RED'):
  shot('red-current');m=measure();(OUT/'red-geometry.json').write_text(json.dumps(m,indent=2));valid(m)
  assert len(m['group']['columns'].split())==3,'single action must fill the group'
  raise SystemExit
 for width in [320,390,1280]:
  page.set_viewport_size({'width':width,'height':1400})
  for material,dark in [(False,False),(False,True),(True,False),(True,True)]:
   reset();paint(material,dark);mode=('material' if material else 'ha')+('-dark' if dark else '-light');shot(f'closed-{mode}-{width}');m=measure();valid(m)
   assert len(m['group']['columns'].split())==3
   assert 15<=m['group']['y']-m['heading']['bottom']<=17
   matrix.append({'width':width,'mode':mode,'geometry':m})
   page.evaluate("ac.setConfig({...savedConfig,actions:[{entity:'scene.evening',name:'Een rustige avond',description:'Lampen in de woonkamer'},{entity:'scene.evening',name:'Naar bed'}]})")
   card.evaluate("c=>{const s=document.createElement('style');s.textContent='h2{font-size:32px!important}.action{font-size:26px!important}.action small{font-size:24px!important}';c.shadowRoot.append(s)}")
   shot(f'enlarged-{mode}-{width}');enlarged=measure();valid(enlarged);assert len(enlarged['group']['columns'].split())<=3
   stress.append({'width':width,'case':'text200-'+mode,'geometry':enlarged})
  for case,script in [
   ('multiple',"ac.setConfig({...savedConfig,actions:[{entity:'scene.evening',name:'Avond',description:'Rustig licht in de woonkamer'},{entity:'scene.evening',name:'Samen eten'},{entity:'scene.evening',name:'Film kijken',description:'Lampen dimmen en gordijnen sluiten'},{entity:'scene.evening',name:'Iedereen naar bed'}]})"),
   ('long',"ac.setConfig({...savedConfig,title:'Scènes en acties voor de hele benedenverdieping',actions:[{entity:'scene.evening',name:'Een rustige avond met de hele familie',description:'Woonkamer, eetkamer en de verlichting langs het tuinpad'},{entity:'scene.evening',name:'Buitenverlichtinginschakelenzonderwoordspaties',description:'Een volledige ononderbrokennaamzonderafkorting'}]})"),
   ('many',"ac.setConfig({...savedConfig,actions:Array.from({length:12},(_,i)=>({entity:'scene.evening',name:'Scène '+(i+1),description:i%2?'Woonkamer en keuken':undefined}))})"),
   ('empty',"ac.setConfig({...savedConfig,actions:[]})"),
   ('unavailable',"ac.hass={...savedHass,states:{...savedHass.states,'scene.evening':{state:'unavailable',attributes:{friendly_name:'Avond'}}}}"),
   ('no-title',"ac.setConfig({...savedConfig,title:''})")]:
   reset();paint(True,True);page.evaluate(script);shot(f'{case}-material-dark-{width}');m=measure();valid(m);stress.append({'width':width,'case':case,'geometry':m})
   if case=='unavailable':assert card.locator('.action').first.is_disabled() and 'Niet beschikbaar' in card.locator('.action').first.inner_text()
   if case=='multiple':assert len(m['actions'])==4
  reset();paint(True,True)
  page.evaluate("ac.setConfig({...savedConfig,actions:[{entity:'scene.evening',name:'Een rustige avond',description:'Lampen in de woonkamer'},{entity:'scene.evening',name:'Naar bed'}]})")
  card.evaluate("c=>{const s=document.createElement('style');s.id='text200';s.textContent='h2{font-size:32px!important}.action{font-size:26px!important}.action small{font-size:24px!important}.feedback{font-size:24px!important}';c.shadowRoot.append(s)}")
  shot(f'text200-material-dark-{width}');enlarged=measure();valid(enlarged);assert len(enlarged['group']['columns'].split())<=3,'enlarged labels must reflow before splitting ordinary words';stress.append({'width':width,'case':'text200'})
  reset();page.evaluate("document.body.style.zoom='2'");shot(f'zoom200-material-dark-{width}');valid(measure());stress.append({'width':width,'case':'zoom200'});page.evaluate("document.body.style.zoom=''")
  # Real DOM keyboard + synthetic held service; verify deduplication and no focus theft.
  reset();paint(True,False)
  page.evaluate("window.calls=[];ac.hass={...savedHass,callService:(...args)=>{calls.push(args);return new Promise((resolve,reject)=>{window.resolveAction=resolve;window.rejectAction=reject})}}")
  button=card.locator('.action').first;button.focus();button.press('Enter');assert button.is_disabled();assert len(page.evaluate('calls'))==1
  page.evaluate("ac.activate(0,'run')");assert len(page.evaluate('calls'))==1
  shot(f'pending-material-light-{width}');page.evaluate('resolveAction()');page.wait_for_timeout(80)
  assert not button.is_disabled() and not card.locator('.feedback').inner_text() and not card.locator('.feedback').is_visible()
  assert button.evaluate('e=>e===e.getRootNode().activeElement'),'focus lost across pending rerender'
  page.evaluate("ac.hass={...ac.hass,states:{...ac.hass.states,'scene.evening':{...ac.hass.states['scene.evening'],last_updated:new Date().toISOString()}}}")
  assert button.evaluate('e=>e===e.getRootNode().activeElement'),'update lost focus'
  button.press('Space');page.evaluate("rejectAction(new Error('Verbinding verbroken'))");page.wait_for_timeout(80);shot(f'error-material-light-{width}')
  assert 'Niet uitgevoerd: Verbinding verbroken' in card.locator('.feedback').inner_text() and not button.is_disabled()
  assert button.evaluate('e=>e===e.getRootNode().activeElement')
  button.click();page.locator('#mode').focus();page.evaluate('resolveAction()');page.wait_for_timeout(80)
  assert page.locator('#mode').evaluate('e=>e===document.activeElement'),'completion stole focus'
  reset();page.evaluate("ac.setConfig({...savedConfig,confirmation:true})")
  page.once('dialog',lambda d:d.dismiss());button.click();assert not page.evaluate('ac._pending')
  page.once('dialog',lambda d:d.accept());button.click();page.wait_for_timeout(80);assert not card.locator('.feedback').inner_text() and not card.locator('.feedback').is_visible()
  interactions.append({'width':width,'keyboardHeldSuccessFailure':True,'deduplicated':True,'updateFocus':True,'noFocusTheft':True,'confirmAcceptCancel':True})
 # Exact gallery status/count; no standalone injection, no writes outside mock calls.
 groups=page.evaluate("Object.fromEntries([...document.querySelectorAll('.review-section')].map(s=>[s.id,[...s.querySelectorAll('article')].map(a=>a.id)]))")
 assert sum(map(len,groups.values()))==18 and len(groups['approved'])==8 and 'card-weather-card' in groups['approved'] and 'card-actions-card' in groups['pending'],groups
 page.set_viewport_size({'width':390,'height':1400});reset();paint(True,False);card.locator('.action').first.focus();card.locator('.action').first.press('Tab');page.keyboard.press('Shift+Tab');shot('keyboard-focus-material-light-390')
 assert card.locator('.action').first.evaluate("e=>getComputedStyle(e).outlineColor==='rgb(168, 106, 224)'")
 assert not errors,errors
 # Column maxima, actual narrow/default grid, text-only resize and editor roundtrip.
 column_cases=[]
 for width in [320,390,1280]:
  page.set_viewport_size({'width':width,'height':1400});reset();paint(True,False)
  for columns in [1,2,3,4,6]:
   page.evaluate("n=>ac.setConfig({...savedConfig,columns:n,actions:Array.from({length:12},(_,i)=>({entity:'scene.evening',name:'A '+(i+1)}))})",columns)
   page.wait_for_timeout(100);m=measure();valid(m);effective=len(m['group']['columns'].split());assert 1<=effective<=columns
   if columns<=4:assert effective==columns,(width,columns,effective)
   shot(f'columns-{columns}-material-light-{width}');column_cases.append({'width':width,'configured':columns,'effective':effective})
 reset();page.evaluate("ac.setConfig(savedConfig)");page.wait_for_timeout(100);assert 1<=len(measure()['group']['columns'].split())<=3
 shot('gallery-default-material-light-1280')
 editor=page.evaluate("""()=>{const out=[];for(const kind of ['actions','controls','waste']){const e=document.createElement('eleven-controls-editor');document.body.append(e);e.setConfig({type:'custom:eleven-'+kind+'-card',[kind==='actions'?'actions':'entities']:[]});const f=e.shadowRoot.querySelector('ha-form');const s=f.schema.find(s=>s.name==='columns');if(kind!=='actions'){if(s)throw Error('sibling columns');e.remove();continue;}if(f.data.columns!==3||s.selector.number.min!==1||s.selector.number.max!==6||s.selector.number.step!==1)throw Error('schema');for(const n of [1,2,3,4,6]){let config;e.addEventListener('config-changed',ev=>config=ev.detail.config,{once:true});f.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{...f.data,columns:n}}}));ac.setConfig(config);if(ac._config.columns!==n)throw Error('roundtrip');e.setConfig(config);out.push(n);}e.remove();}return out}""")
 invalid=page.evaluate("""()=>{const values=[0,7,-1,1.5,'3',null,true,NaN,Infinity];for(const columns of values){let rejected=false;try{ac.setConfig({...savedConfig,columns})}catch(e){rejected=e.message.includes('columns')}if(!rejected)throw Error('accepted invalid '+columns);}return values.length}""")
 reset();page.evaluate("ac.setConfig({...savedConfig,actions:[{entity:'scene.evening',name:'Buitenverlichtinginschakelenzonderwoordspaties',description:'Beschrijving blijft volledig zichtbaar'}]})");page.wait_for_timeout(100);assert len(measure()['group']['columns'].split())==1;valid(measure());shot('long-word-reflow')
 reset();page.evaluate("window.parentOfAction=ac.parentNode;ac.remove();parentOfAction.append(ac)");page.wait_for_timeout(100);assert len(measure()['group']['columns'].split())==3
 reset();shot('final-material-light-1280')
 # Wider six-column proof plus column maxima under all theme/text-size combinations.
 supplement=[]
 for width in [320,390,1280]:
  page.set_viewport_size({'width':width,'height':1400})
  for material,dark in [(False,False),(False,True),(True,False),(True,True)]:
   for columns in [1,2,3,4,6]:
    reset();paint(material,dark)
    page.evaluate("n=>ac.setConfig({...savedConfig,columns:n,actions:Array.from({length:8},(_,i)=>({entity:'scene.evening',name:i%2?'Naar bed':'Avond'}))})",columns)
    card.evaluate("c=>{const s=document.createElement('style');s.textContent='.action{font-size:26px!important}.action small{font-size:24px!important}';c.shadowRoot.append(s)}")
    page.wait_for_timeout(50);m=measure();valid(m);effective=len(m['group']['columns'].split());assert effective<=columns
    supplement.append({'width':width,'material':material,'dark':dark,'columns':columns,'text200Effective':effective})
 reset();card.evaluate("c=>c.style.width='800px'");page.evaluate("ac.setConfig({...savedConfig,columns:6,actions:Array.from({length:12},(_,i)=>({entity:'scene.evening',name:'Actie '+i}))})");page.wait_for_timeout(100);assert len(measure()['group']['columns'].split())==6;valid(measure());page.evaluate("document.querySelectorAll('article').forEach(e=>{if(!e.contains(ac))e.style.visibility='hidden'})");shot('wide-six-columns');page.evaluate("document.querySelectorAll('article').forEach(e=>e.style.visibility='')");card.evaluate("c=>c.style.width=''")
 assert not errors,errors
 result={'columns':column_cases,'editorRoundtrip':editor,'invalidRejected':invalid,'columnTextThemeSupplement':supplement,'matrix':matrix,'stress':stress,'interactions':interactions,'groups':groups,'errors':errors,'url':URL,'actualServedStandaloneBundle':True,'injectedStandalone':False}
 (OUT/'results.json').write_text(json.dumps(result,indent=2));print(json.dumps({'matrix':len(matrix),'stress':len(stress),'interactionWidths':len(interactions),'errors':errors}));b.close()
