"""Shared-action integration against served isolated standalone builds; no HA writes."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'qa-evidence/shared-actions/home-shopping/shared-browser'
OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('BASE','http://127.0.0.1:56519/')
results={'matrix':[],'interactions':[],'errors':[],'screenshots':[]}
fixture="""() => {
window.calls=[];window.h={locale:{language:'en'},states:{
 'todo.test':{state:'2',attributes:{supported_features:127}},
 'light.test':{state:'on',attributes:{friendly_name:'Living room',brightness:128,supported_color_modes:['brightness']}},
 'climate.test':{state:'heat',attributes:{friendly_name:'Thermostat',temperature:20,current_temperature:19,supported_features:1,min_temp:5,max_temp:30}},
 'scene.test':{state:'scening',attributes:{friendly_name:'Evening'}},
 'script.test':{state:'off',attributes:{friendly_name:'Good night'}},
 'calendar.test':{state:'on',attributes:{friendly_name:'Paper'}}},callService:async(...a)=>calls.push(a)};
window.cards={};for(const [kind,config] of Object.entries({controls:{entities:['light.test','climate.test']},actions:{actions:['scene.test','script.test']},waste:{entities:['calendar.test']},shopping:{entity:'todo.test'}})){
 const c=document.createElement('eleven-'+kind+'-card');c.setConfig(config);c.hass=h;if(kind==='shopping')c._items=[{uid:'a',summary:'Milk',status:'needs_action'},{uid:'b',summary:'Bread',status:'completed'}];if(kind==='waste')c._cache={'calendar.test':{error:true}};document.querySelector('main').append(c);cards[kind]=c;c._render();}
} """
measure="""() => {
const out={};for(const [kind,c] of Object.entries(cards)){
 const r=c.shadowRoot;out[kind]={overflow:r.querySelector('ha-card').scrollWidth>r.querySelector('ha-card').clientWidth+1,buttons:[...r.querySelectorAll('button')].map(b=>{const s=getComputedStyle(b),x=b.getBoundingClientRect();return {shared:b.dataset.uiButton||null,text:b.textContent,label:b.getAttribute('aria-label'),w:x.width,h:x.height,font:s.fontSize,weight:s.fontWeight,shadow:s.boxShadow,background:s.backgroundImage,transform:s.transform,disabled:b.disabled,flat:b.matches('.identity,.pickup,.summary,[data-info]')};})};}
return out;}"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':1100})
 page.on('pageerror',lambda e:results['errors'].append(str(e)))
 page.goto(BASE)
 page.set_content('<style>body{margin:0;padding:14px;font-family:Arial;background:var(--primary-background-color)}main{display:grid;gap:16px;max-width:440px;margin:auto;align-items:start}ha-card{display:block}ha-icon{display:inline-block}main>*{display:block;min-width:0}</style><main></main>')
 page.add_script_tag(url=BASE+'review/ha-stub.js')
 for path in ['cards/home-controls/dist/eleven-home-controls-card.js','cards/shopping-card/dist/eleven-shopping-card.js']:
  page.add_script_tag(url=BASE+path)
 page.evaluate(fixture)
 for width in [320,390,1280]:
  page.set_viewport_size({'width':width,'height':1600})
  for paint in ['native','material']:
   for dark in [False,True]:
    page.evaluate("async ({base,dark,paint})=>{(await import(base+'tests/fixtures/shared-action-theme.js')).applyReviewTheme(dark,paint);document.body.style.setProperty('--primary-color','#007db4');document.body.style.setProperty('--accent-color','#76509e')}",{'base':BASE,'dark':dark,'paint':paint})
    page.wait_for_timeout(180)
    m=page.evaluate(measure)
    for kind,v in m.items():
     assert not v['overflow'],(kind,width,paint,dark)
     for b in v['buttons']:
      assert b['w']>=43.9 and b['h']>=43.9,(kind,b)
      if b['shared']:
       assert b['font']=='13px' and b['weight']=='500',(kind,b)
       assert ('0px 2px 3px' in b['shadow'])==(paint=='material'),(kind,b)
       assert b['transform']=='none',(kind,b)
      else:
       assert b['flat'],(kind,b)
    results['matrix'].append({'width':width,'paint':paint,'dark':dark,'cards':m})
    if width in [320,390,1280]:
     file=OUT/f'{width}-{paint}-{dark}.png';page.screenshot(path=str(file),full_page=True);results['screenshots'].append(str(file))
 # Keyboard focus must use accent, distinct from primary; no selected paint for on toggle.
 page.keyboard.press('Tab')
 page.locator('eleven-controls-card .toggle').focus()
 page.keyboard.press('Tab');page.keyboard.press('Shift+Tab')
 focus=page.evaluate("() => {const b=cards.controls.shadowRoot.activeElement,s=getComputedStyle(b);const p=document.createElement('span');p.style.color='var(--eleven-material-focus-color,color-mix(in srgb,var(--accent-color,var(--primary-color)) 60%,var(--primary-text-color)))';document.body.append(p);const expected=getComputedStyle(p).color;p.remove();return {key:b.dataset.key,outline:s.outlineColor,expected,width:s.outlineWidth,focus:b.matches(':focus-visible'),transform:s.transform}}")
 assert focus['focus'] and focus['outline']==focus['expected'] and focus['width']=='2px',focus
 results['interactions'].append({'keyboardFocus':focus})
 page.screenshot(path=str(OUT/'keyboard-focus.png'),full_page=True);results['screenshots'].append(str(OUT/'keyboard-focus.png'))
 # Actual held and rejected command, preserved device state, disabled sibling commands.
 page.evaluate("() => {h.callService=()=>new Promise((ok,no)=>window.rejectControl=no);cards.controls.hass={...h};void 0}")
 page.locator('eleven-controls-card .toggle').click()
 assert page.locator('eleven-controls-card [data-action]:not(:disabled)').count()==0
 assert page.locator('eleven-controls-card .toggle').get_attribute('aria-pressed')=='true'
 page.screenshot(path=str(OUT/'controls-pending.png'),full_page=True);results['screenshots'].append(str(OUT/'controls-pending.png'))
 page.evaluate("rejectControl(Error('Command rejected'))")
 page.wait_for_function("!cards.controls._pending")
 assert 'Command rejected' in page.locator('eleven-controls-card .feedback').inner_text()
 results['interactions'].append({'controlsPendingFailure':True})
 # Control Pad service and no extra pending/success sentences.
 page.evaluate("() => {h.callService=()=>new Promise((ok,no)=>window.rejectAction=no);cards.actions.hass={...h};void 0}")
 page.locator('eleven-actions-card [data-action]').first.click()
 assert page.locator('eleven-actions-card [data-action]:not(:disabled)').count()==0
 page.evaluate("rejectAction(Error('Scene rejected'))")
 page.wait_for_function("!cards.actions._pending")
 assert 'Scene rejected' in page.locator('eleven-actions-card .feedback').inner_text()
 results['interactions'].append({'controlPadPendingFailure':True})
 page.screenshot(path=str(OUT/'commands-failure.png'),full_page=True);results['screenshots'].append(str(OUT/'commands-failure.png'))
 # Waste retry is a shared command, GET remains genuine domain request.
 page.evaluate("() => {window.gets=[];cards.waste.hass={...h,callApi:async(...a)=>{gets.push(a);return []}};void 0}")
 page.wait_for_function("!cards.waste._fetching")
 page.evaluate("() => {cards.waste._cache={'calendar.test':{error:true}};cards.waste._render();void 0}")
 page.locator('eleven-waste-card [data-retry]').click()
 page.wait_for_function("!cards.waste._fetching")
 assert page.evaluate("gets.length>=1&&gets.every(a=>a[0]==='GET')")
 results['interactions'].append({'wasteRetryGET':True})
 # Editor's ordinary actions also use the shared renderer; native HA form stays untouched.
 page.evaluate("() => {window.editor=document.createElement('eleven-controls-editor');editor.setConfig({type:'custom:eleven-actions-card',actions:['scene.test','script.test']});editor.hass=h;document.querySelector('main').append(editor)}")
 assert page.locator('eleven-controls-editor button:not([data-ui-button])').count()==0
 assert page.locator('eleven-controls-editor [data-move="-1"]').first.is_disabled()
 assert page.locator('eleven-controls-editor [data-move="1"]').last.is_disabled()
 results['interactions'].append({'editorSharedAndBounds':True})
 page.locator('eleven-controls-editor').evaluate('(e)=>e.remove()')
 # Long/200% button rendering remains reachable without page overflow.
 for width in [320,390,1280]:
  page.set_viewport_size({'width':width,'height':1600})
  page.evaluate("() => {cards.actions.setConfig({actions:[{entity:'scene.test',name:'A very long evening scene for the whole family'},{entity:'script.test',name:'Good night'}]});cards.shopping._confirmClear=true;cards.shopping._render();for(const c of Object.values(cards)){const style=document.createElement('style');style.textContent='[data-ui-button^=action]{font-size:26px}';c.shadowRoot.append(style)}}")
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),width
  assert not page.evaluate("() => Object.values(cards).some(c=>c.shadowRoot.querySelector('ha-card').scrollWidth>c.shadowRoot.querySelector('ha-card').clientWidth+1)"),width
  results['interactions'].append({'long200':width})
 assert results['errors']==[],results['errors']
 browser.close()
(OUT/'results.json').write_text(json.dumps(results,indent=2))
print(json.dumps({'matrix':len(results['matrix']),'interactions':len(results['interactions']),'errors':results['errors'],'screenshots':results['screenshots']}))
