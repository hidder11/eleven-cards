"""Accepted card plus Details-only request semantic, responsive, paint and lifecycle contract in Chromium."""
import functools, http.server, json, os, threading
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[4]
E=ROOT/'qa-evidence/scene-request-overview'/('bundle' if os.environ.get('SCENE_CARD_BUNDLE') else 'source')
E.mkdir(parents=True,exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,format,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
results=[]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('CARD_QA_CHROMIUM','/opt/hermes/tools/chromium-1208/chrome-linux64/chrome'),args=['--no-sandbox','--disable-dev-shm-usage'])
  page=b.new_page(viewport={'width':390,'height':1000});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/cards/scene-engine-card/frontend/demo.html'+('?bundle' if os.environ.get('SCENE_CARD_BUNDLE') else ''))
  page.wait_for_function('window.ready')
  card=page.locator('eleven-scene-engine-card');table=card.locator('table');grip=card.locator('#details-slot>details>summary')
  def rows(): return table.locator('tbody tr').evaluate_all('rs=>rs.map(r=>[...r.cells].map(c=>c.textContent))')
  expect(table).not_to_be_visible();grip.click();expect(table).to_be_visible();expect(table.locator('thead th')).to_have_text(['Request','Prio','Afhankelijk van','Actief'])
  assert rows()==[['Filmavond','80','—','Ja'],['Basis','0','—','Ja'],['Nachtlicht','20','Nacht','Nee']]
  assert card.locator('.winner,.counts,ha-icon').count()==3 and card.locator('.request-group,.request-scene').count()==0
  assert card.locator('.scene').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')==24
  page.evaluate("window.attrs=hass.states['eleven_scene_engine.woonkamer'].attributes")
  for name,js,expected in [
   ('snapshot order',"attrs.requests=[attrs.requests[2],attrs.requests[0],attrs.requests[1]]",['Nachtlicht','Filmavond','Basis']),
   ('legacy merge',"delete attrs.requests",['Filmavond','Basis','Nachtlicht']),
   ('unknown membership',"attrs.requests=[{identifier:'Only',priority:0,requires:'Support'}];delete attrs.active_requests;delete attrs.non_active_requests",['Only']),
   ('malformed records',"attrs.requests=[null,{},17,{identifier:'Same',priority:0},{identifier:'Same',priority:99}]",['—','—','—','Same'])]:
   page.evaluate(js+';card.hass=hass');assert [r[0] for r in rows()]==expected,(name,rows());results.append({'semantics':name})
  assert rows()[-1]==['Same','0','—','—']
  page.evaluate("load();attrs=hass.states['eleven_scene_engine.woonkamer'].attributes;attrs.requests=[{identifier:'Film',priority:0,requires:'Support',scene:'scene.movie'},{identifier:'Support'}];attrs.active_requests=[attrs.requests[0]];attrs.non_active_requests=[attrs.requests[1]];card.hass=hass")
  assert rows()==[['Film','0','Support','Ja'],['Support','—','—','Nee']]
  page.evaluate('configure({show_details:false})');expect(table).to_have_count(0);expect(grip).to_have_count(0)
  results.append({'semantics':'support request remains Nee; zero, dependency and table inside optional Details'})
  page.evaluate("async()=>{configure();load();window.applyTheme=(await import('/tests/fixtures/shared-action-theme.js')).applyReviewTheme;document.body.style.padding='0'}")
  for paint in ['native','material']:
   for dark in [False,True]:
    for width in [320,390,440]:
     page.set_viewport_size({'width':width,'height':1200})
     for stress in ['normal','long','text200','long200']:
      page.evaluate('''([paint,dark,stress])=>{load(stress.startsWith('long')?'long':'normal');applyTheme(dark,paint);if(stress.endsWith('200')){let sizes=[...card.shadowRoot.querySelectorAll('*')].filter(e=>e.tagName!=='STYLE').map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);for(let[e,size]of sizes)e.style.fontSize=(size*2)+'px';}card._fitLayout()}''',[paint,dark,stress])
      page.wait_for_timeout(180)  # Measure settled shared 120ms button states, not a mid-transition frame.
      if card.locator('#details-slot>details').get_attribute('open') is None:grip.click()
      page.wait_for_timeout(80)
      assert abs(card.bounding_box()['width']-width)<1
      m=card.evaluate('''e=>{let r=e.shadowRoot,c=r.querySelector('ha-card'),w=r.querySelector('.detail-body');return{overflow:c.scrollWidth>c.clientWidth,pageOverflow:document.documentElement.scrollWidth>innerWidth,height:c.getBoundingClientRect().height,host:e.getBoundingClientRect().height,reflow:w.classList.contains('reflow'),well:getComputedStyle(w).boxShadow,reset:getComputedStyle(r.querySelector('#reset')).boxShadow,title:getComputedStyle(r.querySelector('h2')).fontSize,body:getComputedStyle(r.querySelector('td')).fontSize,targets:[...r.querySelectorAll('summary,#reset')].filter(n=>n.getClientRects().length).map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height}))}}''')
      assert not m['overflow'] and not m['pageOverflow'] and m['host']>=m['height']-1,(paint,dark,width,stress,m)
      assert all(t['w']>=44 and t['h']>=44 for t in m['targets']),m
      wordfit=card.evaluate(r"""e=>{let r=e.shadowRoot,c=document.createElement('canvas').getContext('2d'),full=r.querySelector('.request-overview').clientWidth-20;return [...r.querySelectorAll('.cell-value')].map(n=>{c.font=getComputedStyle(n).font;return{word:Math.max(...n.textContent.split(/\s+/).map(w=>c.measureText(w).width)),available:n.getBoundingClientRect().width}}).filter(m=>m.word>m.available+1&&m.word<=full)}""")
      assert not wordfit,('avoidable word breaks',paint,dark,width,stress,wordfit)
      assert (m['well']!='none')==(paint=='material'),m
      assert (m['reset']!='none')==(paint=='material'),m
      if stress=='normal':assert m['title']=='16px' and m['body']=='13px',m
      case=f'{paint}-{dark}-{width}-{stress}'
      if stress=='normal' or width==320:card.screenshot(path=str(E/(case+'.png')))
      geometry=card.evaluate('''e=>{let s=e.shadowRoot,g=s.querySelector('#details-slot>details>summary'),r=s.querySelector('#reset'),d=s.querySelector('.detail-body');return{gap:d.getBoundingClientRect().top-Math.max(g.getBoundingClientRect().bottom,r.getBoundingClientRect().bottom),radius:parseFloat(getComputedStyle(g).borderBottomLeftRadius),wrapper:getComputedStyle(g.parentElement).boxShadow}}''')
      assert 7.9<=geometry['gap']<=9.1 and geometry['radius']>0 and geometry['wrapper']=='none',geometry
      tech=card.locator('.technical>summary');tech.click();expect(card.locator('.diagnostics')).to_contain_text('Revisie 12')
      expect(card.locator('.technical-body')).to_contain_text('Tot:')
      tech.focus();page.evaluate('card.hass={...hass}');expect(tech).to_be_focused();expect(card.locator('.technical')).to_have_attribute('open','')
      grip.focus();page.evaluate('card.hass={...hass}');expect(grip).to_be_focused();expect(card.locator('#details-slot>details')).to_have_attribute('open','')
      if stress=='normal' and width==390:card.screenshot(path=str(E/(case+'-details.png')))
      tech.click();grip.click();page.evaluate("for(const e of card.shadowRoot.querySelectorAll('[style]'))e.removeAttribute('style');load()")
      results.append({'paint':paint,'dark':dark,'width':width,'stress':stress,**m,'geometry':geometry})
  # CSS-only theme changes, forced colors, keyboard and observer lifecycle.
  page.evaluate("load();applyTheme(false,'material')");well=card.locator('.detail-body').evaluate('e=>getComputedStyle(e).boxShadow')
  page.evaluate("applyTheme(false,'native')");assert well!='none' and card.locator('.detail-body').evaluate('e=>getComputedStyle(e).boxShadow')=='none'
  page.emulate_media(forced_colors='active');assert card.locator('.detail-body').evaluate('e=>getComputedStyle(e).boxShadow')=='none';page.emulate_media(forced_colors='none')
  reconnect=page.evaluate('''()=>{let n=0,o=card._layoutObserver,d=o.disconnect.bind(o);o.disconnect=()=>{n++;d()};card.remove();let stopped=n;document.querySelector('main').append(card);load();return{stopped,same:o===card._layoutObserver}}''');assert reconnect['stopped'] and reconnect['same']
  grip.focus();page.keyboard.press('Enter');expect(card.locator('#details-slot>details')).to_have_attribute('open','')
  # Repeated fit calls on each boundary must not toggle the layout.
  stable=page.evaluate('''()=>{let r=[];for(let w=280;w<=520;w++){card.style.width=w+'px';let states=[];for(let n=0;n<5;n++){card._fitLayout();states.push(card.shadowRoot.querySelector('.request-overview').className)}if(new Set(states).size>1)r.push(w)}card.style.width='';return r}''');assert not stable,stable
  results.append({'lifecycle':'disconnect/reconnect; native keyboard; CSS-only theme; forced colors; 241 widths stable'})
  assert not errors,errors
  (E/'results.json').write_text(json.dumps({'count':len(results),'results':results,'errors':errors},indent=2))
  print(json.dumps({'passed':len(results),'matrix':48,'errors':errors}));b.close()
finally:
 server.shutdown();server.server_close()
