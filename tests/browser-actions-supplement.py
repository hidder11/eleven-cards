"""Supplement real touch, text refitting, parity and theme-role contrast checks."""
from pathlib import Path
# Reuse the matrix's actual-served fixture/paint/measurement helpers, not its test loop.
source=Path(__file__).with_name('browser-actions-refinement.py').read_text()
prefix=source.split(" if os.getenv('BASELINE'):")[0]
exec(compile(prefix+'''
 supplement=[];contrasts=[]
 page.set_viewport_size({'width':390,'height':1400});reset();paint(True,False)
 # Reconnect must re-arm text fitting even when configuration/fingerprint is unchanged.
 page.evaluate("ac.setConfig({...savedConfig,actions:[{entity:'scene.evening',name:'Een rustige avond',description:'Lampen in de woonkamer'},{entity:'scene.evening',name:'Naar bed'}]});window.actionParent=ac.parentElement;ac.remove();actionParent.append(ac)")
 card.evaluate("c=>{const s=document.createElement('style');s.textContent='.action{font-size:28px!important}.action small{font-size:24px!important}';c.shadowRoot.append(s)}")
 shot('reconnected-text200-material-light-390');m=measure();valid(m);assert len(m['group']['columns'].split())==1,'reconnect left text fitting observer disconnected'
 supplement.append({'case':'reconnectTextRefit','passed':True})
 for material,dark in [(False,False),(False,True),(True,False),(True,True)]:
  reset();paint(material,dark);page.evaluate("ac.setConfig({...savedConfig,actions:[{entity:'scene.evening',name:'Avond',description:'Rustig licht'},{entity:'scene.evening',name:'Samen eten'},{entity:'scene.evening',name:'Film kijken'},{entity:'scene.evening',name:'Naar bed'}]})")
  card.scroll_into_view_if_needed();page.mouse.move(0,0);page.wait_for_timeout(80)
  mode=('material' if material else 'ha')+('-dark' if dark else '-light')
  assert card.locator('.action').evaluate_all('es=>es.every(e=>getComputedStyle(e).background===getComputedStyle(es[0]).background)'), 'fourth action face differs'
  roleContrast=card.evaluate(r"""c=>{const s=e=>getComputedStyle(e),r=c.shadowRoot,canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=canvas.height=1;const colors=e=>{const style=s(e),list=style.backgroundImage.match(/(?:rgba?\\([^)]*\\)|color\\([^)]*\\))/g)||[style.backgroundColor];return list.map(v=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=v;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3)})},rgb=e=>s(e).color.match(/[\\d.]+/g).slice(0,3).map(Number),lum=v=>v.map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((a,n,i)=>a+n*[.2126,.7152,.0722][i],0),ratio=(a,b)=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};return [...r.querySelectorAll('h2,.split-label,.split-label small')].map(e=>{const backgrounds=colors(e.closest('button')||r.querySelector('ha-card'));return {role:e.className||e.tagName,text:e.textContent,color:s(e).color,backgrounds,contrast:Math.min(...backgrounds.map(bg=>ratio(rgb(e),bg)))}})}""")
  for role in roleContrast:assert role['contrast']>=4.5,role
  contrasts.append({'mode':mode,'roles':roleContrast})
  shot('multiple-'+mode+'-390')
  # Live accent/focus and theme-owned faces must respond via CSS, without replacing the node.
  card.locator('.action').first.focus();card.locator('.action').first.press('Tab');page.keyboard.press('Shift+Tab')
  page.evaluate("window.actionNode=ac.shadowRoot.activeElement;document.body.style.setProperty('--accent-color','#006f65')")
  assert page.evaluate("actionNode.isConnected&&getComputedStyle(actionNode).outlineColor==='rgb(0, 111, 101)'")
  supplement.append({'case':'sameFacesContrastLiveFocus','mode':mode,'passed':True})
 # Real Chromium touchscreen input with a synthetic request, never HA.
 context=b.new_context(viewport={'width':390,'height':1200},has_touch=True,is_mobile=True)
 touch=context.new_page();touch.on('pageerror',lambda e:errors.append(str(e)));touch.goto(URL);touch.wait_for_function('window.themeFixtureReady')
 touch.evaluate("window.ta=records.find(r=>r.name==='actions-card').card;window.touchCalls=[];ta.hass={...ta.hass,callService:async(...args)=>touchCalls.push(args)}")
 touch.locator('[data-card=actions-card]').locator('.action').tap();touch.wait_for_timeout(80)
 assert touch.evaluate("touchCalls.length===1&&touchCalls[0][0]==='scene'&&touchCalls[0][1]==='turn_on'&&touchCalls[0][2].entity_id==='scene.evening'")
 touch.locator('[data-card=actions-card]').screenshot(path=str(OUT/'touch-success-390.png'));context.close();supplement.append({'case':'realChromiumTouchSyntheticService','passed':True})
 # A compact page-context capture shows true dashboard column, not a stretched desktop card.
 page.set_viewport_size({'width':1280,'height':1100});reset();paint(True,False);card.scroll_into_view_if_needed();page.screenshot(path=str(OUT/'dashboard-material-light-1280.png'))
 assert not errors,errors
 result={'checks':supplement,'contrast':contrasts,'minimumTextContrast':min(role['contrast'] for m in contrasts for role in m['roles']),'errors':errors}
 (OUT/'supplement.json').write_text(json.dumps(result,indent=2));print(json.dumps({'checks':len(supplement),'minimumTextContrast':result['minimumTextContrast'],'errors':errors}));b.close()
''',str(Path(__file__)), 'exec'))
