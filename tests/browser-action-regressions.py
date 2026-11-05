"""Real built-card paint regressions; synthetic hass, no physical HA requests."""
import json,os,functools,http.server,threading,atexit
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-evidence/shared-actions/paint-regressions'
BASE=os.environ.get('BASE','').rstrip('/')
if not BASE:
 class Quiet(http.server.SimpleHTTPRequestHandler):
  def log_message(self,format,*args):pass
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
 threading.Thread(target=server.serve_forever,daemon=True).start()
 atexit.register(lambda:(server.shutdown(),server.server_close()))
 BASE=f'http://127.0.0.1:{server.server_port}'
PAINT="""e=>{const s=getComputedStyle(e),canvas=document.createElement('canvas');canvas.width=canvas.height=1;const c=canvas.getContext('2d');const rgb=v=>{c.clearRect(0,0,1,1);c.fillStyle=v;c.fillRect(0,0,1,1);return [...c.getImageData(0,0,1,1).data]};const lum=a=>a.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);const fg=rgb(s.color),colors=(s.backgroundImage.match(/rgba?\\([^)]*\\)|color\\(srgb[^)]*\\)/g)||[]).map(rgb);if(!colors.length)colors.push(rgb(s.backgroundColor));const overlays=[...new Map(colors.filter(a=>a[3]>0&&a[3]<255).map(a=>[a.join(','),a])).values()];let backs=colors.filter(a=>a[3]===255);if(!backs.length)backs.push(rgb(getComputedStyle(e).getPropertyValue('--card-background-color')));backs=backs.map(bg=>overlays.reduce((b,a)=>a.slice(0,3).map((v,i)=>v*a[3]/255+b[i]*(1-a[3]/255)).concat(255),bg));const contrast=Math.min(...backs.map(bg=>{let a=lum(fg),b=lum(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)}));return {color:s.color,background:s.backgroundColor,image:s.backgroundImage,radius:s.borderRadius,offset:s.outlineOffset,contrast}}"""
OUT.mkdir(parents=True,exist_ok=True)
results=[];failures=[];errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or os.environ.get('AGENT_BROWSER_EXECUTABLE_PATH') or '/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':1100},locale='nl-NL',timezone_id='Europe/Amsterdam')
 page.add_init_script("{const RealDate=Date;const fixed=Date.parse('2026-10-28T09:07:00Z');window.Date=class extends RealDate{constructor(...a){super(...(a.length?a:[fixed]));}static now(){return fixed;}};}")
 page.on('pageerror',lambda error:errors.append(str(error)))
 for name,url,tag,selector in [('waste','/tests/fixtures/shared-actions.html','eleven-waste-card','.pickup'),('room','/tests/fixtures/shared-actions-room.html','eleven-room-card','.control'),('planner','/cards/appliance-planner/qa/','eleven-appliance-planner','#save-plan')]:
  try:
   page.goto(BASE+url)
   if name=='waste':page.wait_for_function('window.actionReady');page.evaluate('showWaste()')
   else:page.wait_for_function('window.card?.shadowRoot')
   if name=='planner':page.evaluate('showCard("linked")');page.wait_for_function('card.result&&!card.loading')
   card=page.locator(tag);button=card.locator(selector).first
   page.evaluate("async()=>{window.applyTheme=(await import('/tests/fixtures/shared-action-theme.js')).applyReviewTheme}")
   for width in [320,390]:
    page.set_viewport_size({'width':width,'height':1100})
    for paint in ['native','material']:
     for dark in [False,True]:
      page.mouse.move(0,0)
      page.evaluate("([dark,paint])=>{applyTheme(dark,paint);document.body.style.setProperty('--primary-color','#157f5a');document.body.style.setProperty('--accent-color','#b043cd')}",[dark,paint]);page.wait_for_timeout(170)
      idle=button.evaluate(PAINT)
      if name=='waste':assert idle['background']=='rgba(0, 0, 0, 0)' and idle['radius']=='0px',(name,width,paint,dark,'idle',idle)
      else:assert idle['contrast']>= (3 if name=='room' else 4.5),(name,width,paint,dark,'idle',idle)
      button.hover();page.wait_for_timeout(170);hover=button.evaluate(PAINT)
      if name=='waste':
       expected=button.evaluate("e=>{const p=document.createElement('span');p.style.background='color-mix(in srgb,var(--primary-text-color) 5%,transparent)';e.getRootNode().append(p);const v=getComputedStyle(p).backgroundColor;p.remove();return v}")
       assert hover['background']==expected,(name,width,paint,dark,'hover',hover,expected)
       page.keyboard.press('Tab');button.focus();focus=button.evaluate(PAINT)
       assert focus['offset']=='-2px' and focus['radius']=='0px',(name,width,paint,dark,'focus',focus)
      else:
       assert hover['contrast']>= (3 if name=='room' else 4.5),(name,width,paint,dark,'hover',hover)
       box=button.bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);page.mouse.down();page.wait_for_timeout(170)
       press=button.evaluate(PAINT);assert press['contrast']>= (3 if name=='room' else 4.5),(name,width,paint,dark,'press',press)
       page.mouse.move(0,0);page.mouse.up()
      results.append({'card':name,'width':width,'paint':paint,'dark':dark,'idle':idle,'hover':hover})
      if width==390 and paint=='material':card.screenshot(path=str(OUT/f'{name}-{paint}-{dark}.png'))
  except AssertionError as error:
   failures.append(str(error))
 browser.close()
(OUT/'results.json').write_text(json.dumps({'cases':results,'failures':failures,'page_errors':errors},indent=2))
print(json.dumps({'cases':len(results),'failures':failures,'page_errors':errors}))
assert not failures and not errors
