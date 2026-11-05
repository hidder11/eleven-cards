"""Controls slider theme regression on the actual built artifact; synthetic hass only."""
import json,os,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'qa-evidence/controls-slider-theme'
OUT.mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as p:
 executable=os.environ.get('CHROMIUM_PATH') or os.environ.get('AGENT_BROWSER_EXECUTABLE_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
 if executable:
  browser=p.chromium.launch(executable_path=executable,args=['--no-sandbox'])
 else:
  browser=p.chromium.launch(args=['--no-sandbox'])
 for paint in ['native','material']:
  for dark in [False,True]:
   page=browser.new_page(viewport={'width':390,'height':400});errors=[]
   page.on('pageerror',lambda error:errors.append(str(error)))
   page.set_content('<style>body{margin:0;padding:16px;font:14px/1.4 system-ui;background:var(--primary-background-color)}ha-card{display:block}eleven-controls-card{display:block}</style><eleven-controls-card></eleven-controls-card>')

   page.add_script_tag(content=(ROOT/'tests/fixtures/shared-action-theme.js').read_text().replace('export ',''))
   page.add_script_tag(content=(ROOT/'cards/home-controls/dist/eleven-home-controls-card.js').read_text())
   page.evaluate("""()=>{window.calls=[];window.card=document.querySelector('eleven-controls-card');card.setConfig({entities:['light.test','fan.test'],card_background:false});card.hass={connected:true,locale:{language:'nl'},config:{},states:{'light.test':{state:'on',attributes:{friendly_name:'Lamp',brightness:128,supported_color_modes:['brightness']}},'fan.test':{state:'on',attributes:{friendly_name:'Ventilator',percentage:40,percentage_step:20,supported_features:49}}},callService:async(...args)=>{calls.push(args)}};window.slider=card.shadowRoot.querySelector('input');}""")
   page.evaluate("([dark,paint])=>{applyReviewTheme(dark,paint);document.body.style.setProperty('--primary-color','#15803d');document.body.style.setProperty('--accent-color','#b043cd')}",[dark,paint])
   def tones():return page.locator('eleven-controls-card').locator('input').evaluate_all("es=>es.map(e=>getComputedStyle(e).getPropertyValue('--_bar-tone').trim())")
   assert tones()==['#b043cd','#b043cd'],(paint,dark,'accent',tones())
   page.evaluate("document.body.style.setProperty('--primary-color','#006b96')")
   assert tones()==['#b043cd','#b043cd'],(paint,dark,'not primary',tones())
   page.locator('eleven-controls-card').screenshot(path=str(OUT/f'{paint}-{dark}.png'))
   page.evaluate("document.body.style.setProperty('--accent-color','#be185d')")
   assert tones()==['#be185d','#be185d'],(paint,dark,'live accent',tones())
   assert page.evaluate("slider===card.shadowRoot.querySelector('input')"),'CSS theme switch must not rebuild native input'
   page.evaluate("card.style.setProperty('--ui-bar-tone','#d97706')")
   assert tones()==['#d97706','#d97706'],(paint,dark,'explicit inherited role',tones())
   page.evaluate("card.style.removeProperty('--ui-bar-tone');document.body.style.removeProperty('--accent-color')")
   assert tones()==['#006b96','#006b96'],(paint,dark,'primary fallback only without accent',tones())
   page.locator('eleven-controls-card').locator('input').first.press('ArrowRight')
   page.wait_for_function('calls.length===1&&!card._pending')
   request=page.evaluate('calls[0]');assert request[:2]==['light','turn_on'] and request[2]['entity_id']=='light.test',request
   assert not errors,errors
   results.append({'paint':paint,'dark':dark,'light_and_fan':True,'dynamic_accent':True,'primary_fallback':True,'explicit_role':True,'native_input_identity':True,'keyboard_request':request,'errors':errors})
   page.close()
 browser.close()
(OUT/'results.json').write_text(json.dumps(results,indent=2))
print(json.dumps({'theme_cases':len(results),'page_errors':0}))
