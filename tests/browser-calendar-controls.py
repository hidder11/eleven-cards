"""Actual served Calendar control consistency and update/dismissal contract."""
import json,yaml
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-evidence/calendar-controls';OUT.mkdir(exist_ok=True)
URL='http://127.0.0.1:56515/JC5klAkxdKA9PmJO7YSGqy76RQb7-mo6C0aJPXHgbsI/cards/review/'
errors=[];checks=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':1400},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)));page.goto(URL);page.wait_for_function('window.themeFixtureReady')
 card=page.locator('[data-card=calendar-card]');card.scroll_into_view_if_needed()
 assert card.locator('.calendar-tools summary').count()==1,'missing approved flat ellipsis disclosure'
 assert card.locator('.calendar-tools[open]').count()==0
 assert card.locator('[data-info]:visible').count()==0
 assert card.locator('.range').evaluate("e=>e.tagName==='SPAN'&&!e.hasAttribute('tabindex')&&!e.hasAttribute('role')"),'range gained false button affordance'
 assert card.locator('.navigation').evaluate("e=>getComputedStyle(e).gap==='0px'"),'date/navigation still separate button tiles'
 theme=yaml.safe_load((ROOT/'themes/eleven_material.yaml').read_text())['Eleven Material']
 def paint(material,dark):
  tokens={'ha-card-border-radius':'12px','ha-card-border-width':'1px','ha-card-box-shadow':'none','primary-color':'#03a9f4','accent-color':'#a86ae0','error-color':'#db4437'}
  tokens.update({'primary-background-color':'#111111','card-background-color':'#1c1c1c','primary-text-color':'#e1e1e1','secondary-text-color':'#9b9b9b','secondary-background-color':'#282828','divider-color':'#424242'} if dark else {'primary-background-color':'#fafafa','card-background-color':'#fff','primary-text-color':'#212121','secondary-text-color':'#727272','secondary-background-color':'#f2f2f2','divider-color':'#e0e0e0'})
  tokens['ha-card-background']='var(--card-background-color)'
  if material:tokens.update({k:v for k,v in theme.items() if k!='modes'});tokens.update(theme['modes']['dark' if dark else 'light'])
  page.evaluate('''({tokens,dark})=>{for(const k of [...document.body.style])if(k.startsWith('--'))document.body.style.removeProperty(k);for(const[k,v]of Object.entries(tokens))document.body.style.setProperty('--'+k,v);document.body.style.colorScheme=dark?'dark':'light'}''',{'tokens':{k:str(v) for k,v in tokens.items()},'dark':dark})
 def shot(name):
  card.scroll_into_view_if_needed();page.wait_for_timeout(70);card.screenshot(path=str(OUT/(name+'.png')))
 def focus(selector):return card.evaluate('''(c,s)=>c.shadowRoot.activeElement?.matches(s)''',selector)
 def measure():
  return card.evaluate('''c=>{const r=c.shadowRoot,nav=r.querySelector('.navigation'),s=r.querySelector('.calendar-tools summary'),box=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}},ink=e=>{const t=document.createRange();t.selectNodeContents(e);return box(t)},content=r.querySelector('.content');return {card:box(r.querySelector('ha-card')),host:box(c),nav:box(nav),range:box(r.querySelector('.range')),rangeInk:ink(r.querySelector('.range')),summary:{...box(s),shadow:getComputedStyle(s).boxShadow,bg:getComputedStyle(s).backgroundColor},navPaint:{bg:getComputedStyle(nav).backgroundColor,shadow:getComputedStyle(nav).boxShadow},buttons:[...r.querySelectorAll('[data-nav]')].map(e=>({...box(e),bg:getComputedStyle(e).backgroundColor,shadow:getComputedStyle(e).boxShadow})),overflow:content.scrollWidth>content.clientWidth+1}}''')
 def valid(m):
  assert not m['overflow'],m
  assert m['card']['bottom']<=m['host']['bottom']+1,m
  assert m['summary']['w']>=44 and m['summary']['h']>=44
  assert m['summary']['shadow']=='none' and m['summary']['bg']=='rgba(0, 0, 0, 0)',m
  assert m['rangeInk']['right']<=m['range']['right']+1,m
  assert len({round(x['y']+x['h']/2,1) for x in m['buttons']})==1,('navigation actions split across rows',m)
  for x in m['buttons']:
   assert x['w']>=44 and x['h']>=44 and x['shadow']=='none',m
   assert x['right']<=m['nav']['right']+1 and x['bottom']<=m['nav']['bottom']+1,m
 page.evaluate("window.cal=records.find(r=>r.name==='calendar-card').card")
 for width in [320,390,1280]:
  page.set_viewport_size({'width':width,'height':1400})
  for material,dark in [(False,False),(False,True),(True,False),(True,True)]:
   mode=('material' if material else 'ha')+('-dark' if dark else '-light');paint(material,dark);name=f'{mode}-{width}'
   card.locator('.calendar-tools').evaluate('e=>e.open=false');page.mouse.move(0,0);shot('closed-'+name);m=measure();valid(m)
   # Native Enter/Space activation and summary focus survive replacement.
   summary=card.locator('.calendar-tools summary');summary.focus();page.keyboard.press('Enter');assert card.locator('.calendar-tools[open]').count()==1
   page.evaluate('cal._render()');assert focus('.calendar-tools summary') and card.locator('.calendar-tools[open]').count()==1
   page.keyboard.press('Tab');assert focus('[data-info]');page.evaluate('cal._render()');assert focus('[data-info]') and card.locator('.calendar-tools[open]').count()==1
   shot('tools-'+name)
   info=card.locator('[data-info]');assert info.evaluate('e=>e.scrollWidth<=e.clientWidth+1')
   page.keyboard.press('Enter');page.wait_for_timeout(100);assert card.locator('#calendar-info:visible').count()==1;assert focus('[data-ui-popup-close]')
   # Relevant metadata update, not just a private render invocation.
   page.evaluate("cal.hass={...cal.hass,states:{...cal.hass.states,'calendar.family':{...cal.hass.states['calendar.family'],attributes:{...cal.hass.states['calendar.family'].attributes,friendly_name:cal.hass.states['calendar.family'].attributes.friendly_name==='Familie'?'Gezin':'Familie'}}}}")
   page.wait_for_timeout(100);assert card.locator('#calendar-info:visible').count()==1 and focus('[data-ui-popup-close]'),'info open/focus lost on update'
   pop=card.locator('#calendar-info');pm=pop.evaluate('e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,w:innerWidth,h:innerHeight,overflow:e.scrollWidth>e.clientWidth+1}}');assert pm['x']>=0 and pm['right']<=pm['w'] and pm['bottom']<=pm['h'] and not pm['overflow'],pm
   pop.screenshot(path=str(OUT/('info-'+name+'.png')));page.screenshot(path=str(OUT/('info-context-'+name+'.png')))
   page.keyboard.press('Escape');assert focus('[data-info]');page.keyboard.press('Escape');assert focus('.calendar-tools summary') and card.locator('.calendar-tools[open]').count()==0
   page.keyboard.press('Space');assert card.locator('.calendar-tools[open]').count()==1
   # Outside click in the same card and outside shadow boundary both dismiss.
   card.locator('h2').click();assert card.locator('.calendar-tools[open]').count()==0
   summary.click();page.locator('h1').click();assert card.locator('.calendar-tools[open]').count()==0
   summary.click();info.click();page.wait_for_timeout(60);assert info.get_attribute('aria-expanded')=='true';page.locator('h1').click();page.wait_for_timeout(60);assert card.locator('.calendar-tools[open]').count()==0 and card.locator('#calendar-info:visible').count()==0;assert info.get_attribute('aria-expanded')=='false'
   checks.append({'width':width,'mode':mode,'geometry':m,'popup':pm,'keyboardOpenFocusRerenderEscapeOutside':True})
  # Real navigation modifies the Calendar offset and displayed range.
  before=card.locator('.range').inner_text();card.locator('[data-nav=next]').click();page.wait_for_timeout(120);assert page.evaluate('cal._offset')==1;assert card.locator('.range').inner_text()!=before
  card.locator('[data-nav=now]').click();page.wait_for_timeout(120);assert page.evaluate('cal._offset')==0
  # Long range and enlarged *all* control text, including hidden info label.
  paint(True,False);page.evaluate("cal._config.days_to_show=14;cal._render()")
  card.evaluate('''c=>{const s=document.createElement('style');s.id='control-zoom';s.textContent='h2{font-size:32px!important}.range,[data-nav],.info-button,.info-button span{font-size:26px!important}';c.shadowRoot.append(s)}''')
  shot(f'text-200-{width}');m=measure();valid(m)
  card.locator('.calendar-tools summary').click();shot(f'text-200-tools-{width}');assert card.locator('[data-info]').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
  card.locator('[data-info]').click();page.wait_for_timeout(80);page.screenshot(path=str(OUT/f'text-200-info-context-{width}.png'));page.keyboard.press('Escape');page.keyboard.press('Escape');card.evaluate("c=>c.shadowRoot.querySelector('#control-zoom').remove()");page.evaluate('cal._config.days_to_show=2;cal._render()')
 # No title/navigation must still leave a reachable ellipsis/info action.
 page.evaluate('cal._config.show_title=false;cal._config.show_navigation=false;cal._render()');assert card.locator('.navigation').count()==0;assert card.locator('.calendar-tools summary').is_visible();card.locator('.calendar-tools summary').click();assert card.locator('[data-info]').is_visible();shot('no-title-navigation')
 # Disconnect cleanup removes listener and reconnect retains working disclosure.
 page.evaluate('''()=>{window.parent=cal.parentNode;cal.remove();window.parent.append(cal)}''');card.locator('.calendar-tools summary').click();page.locator('h1').click();assert card.locator('.calendar-tools[open]').count()==0
 assert page.locator('article').count()==18 and page.locator('#approved article').count()==6 and page.locator('#pending article').count()==12
 assert page.evaluate('demoServices.length')==0
 assert not errors,errors
 (OUT/'control-results.json').write_text(json.dumps({'matrix':checks,'text200Widths':[320,390,1280],'errors':errors,'review':{'approved':6,'pending':12,'examples':18},'services':0},indent=2));print(json.dumps({'matrix':len(checks),'text200':3,'errors':errors}));b.close()
