"""Actual served Calendar: layout/interaction matrix; synthetic HA only."""
import argparse,json,yaml,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/os.environ.get('CALENDAR_QA_OUT','qa-evidence/calendar-refinement');OUT.mkdir(exist_ok=True)
args=argparse.ArgumentParser();args.add_argument('--baseline',action='store_true');a=args.parse_args()
URL='http://127.0.0.1:56515/JC5klAkxdKA9PmJO7YSGqy76RQb7-mo6C0aJPXHgbsI/cards/review/'
MEASURE='''c=>{const r=c.shadowRoot,q=s=>r.querySelector(s),box=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}},title=q('h2');return {host:box(c),card:box(q('ha-card')),title:{font:getComputedStyle(title).fontSize,weight:getComputedStyle(title).fontWeight},content:box(q('.content')),scroll:q('.content').scrollWidth,client:q('.content').clientWidth,buttons:[...r.querySelectorAll('button')].filter(e=>e.getClientRects().length&&!e.closest('[data-ui-popup]')).map(e=>({text:e.textContent,cls:e.className,...box(e)})),events:[...r.querySelectorAll('.list-event')].map(e=>({row:box(e),time:box(e.querySelector('.event-time')),timeInk:(()=>{const t=document.createRange();t.selectNodeContents(e.querySelector('.event-time'));return box(t)})(),event:box(e.querySelector('.event-button'))}))}}'''
rows=[];stress=[];interactions=[];errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':1200},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
 if a.baseline:page.route('**/dist/eleven-cards.js*',lambda route:route.fulfill(body=(OUT/'entry/dist/eleven-cards.js').read_bytes(),content_type='text/javascript'))
 page.goto(URL);page.wait_for_function("window.themeFixtureReady&&records.find(r=>r.name==='calendar-card').card._statuses['calendar.family']==='ready'")
 card=page.locator('[data-card=calendar-card]')
 def measure():
  page.wait_for_timeout(100);card.scroll_into_view_if_needed();return card.evaluate(MEASURE)
 def check(r,normal=False):
  assert r['scroll']<=r['client']+1,('overflow',r)
  assert r['card']['bottom']<=r['host']['bottom']+1,('host clipping',r)
  if normal:assert r['title']=={'font':'16px','weight':'600'},('calm title',r)
  for v in r['buttons']:assert v['h']>=43.5 and v['w']>=43.5,('target',v)
  for e in r['events']:
   assert e['timeInk']['right']<=e['time']['right']+1,('time glyph escape',e)
   if e['event']['y']<e['time']['bottom']:
    assert e['event']['x']-e['time']['right']>=7.5,('time/event clearance',e)
   else:assert e['event']['y']-e['time']['bottom']>=7.5,('stacked time/event clearance',e)
   assert e['event']['bottom']<=r['card']['bottom'],('event clipping',e)
 def shot(name):card.screenshot(path=str(OUT/(name+'.png')))
 r=measure();shot('before-390' if a.baseline else 'after-initial-390')
 if a.baseline:
  (OUT/'before-geometry.json').write_text(json.dumps(r,indent=2));check(r,True)
 else:
  theme=yaml.safe_load((ROOT/'themes/eleven_material.yaml').read_text())['Eleven Material']
  def paint(material,dark):
   tokens={'ha-card-border-radius':'12px','ha-card-border-width':'1px','ha-card-box-shadow':'none','primary-color':'#03a9f4','accent-color':'#a86ae0','error-color':'#db4437'}
   tokens.update({'primary-background-color':'#111111','card-background-color':'#1c1c1c','primary-text-color':'#e1e1e1','secondary-text-color':'#9b9b9b','secondary-background-color':'#282828','divider-color':'#424242'} if dark else {'primary-background-color':'#fafafa','card-background-color':'#fff','primary-text-color':'#212121','secondary-text-color':'#727272','secondary-background-color':'#f2f2f2','divider-color':'#e0e0e0'})
   tokens['ha-card-background']='var(--card-background-color)'
   if material:tokens.update({k:v for k,v in theme.items() if k!='modes'});tokens.update(theme['modes']['dark' if dark else 'light'])
   page.evaluate('''({tokens,dark})=>{const el=document.body;for(const k of [...el.style])if(k.startsWith('--'))el.style.removeProperty(k);for(const[k,v]of Object.entries(tokens))el.style.setProperty('--'+k,v);el.style.colorScheme=dark?'dark':'light'}''',{'tokens':{k:str(v) for k,v in tokens.items()},'dark':dark})
  page.evaluate('''()=>{window.cal=records.find(r=>r.name==='calendar-card').card;window.backup={config:structuredClone(cal._config),events:structuredClone(cal._events),statuses:structuredClone(cal._statuses)};window.resetCal=()=>{cal._config=structuredClone(backup.config);cal._view='list';cal._offset=0;cal._hiddenCalendars=new Set();cal._events=structuredClone(backup.events);cal._statuses=structuredClone(backup.statuses);cal._eventRevision++;cal._daysKey=null;cal._render()}}''')
  for width in [320,390,1280]:
   page.set_viewport_size({'width':width,'height':1200})
   for material,dark in [(False,False),(False,True),(True,False),(True,True)]:
    paint(material,dark);r=measure();check(r,True);mode=('material' if material else 'ha')+('-dark' if dark else '-light');rows.append({'width':width,'mode':mode,**r});shot(f'after-{mode}-{width}')
   paint(True,width==390)
   for variant in ['long','multiple','all-day','empty','loading','error','compact','columns','month']:
    page.evaluate('''v=>{resetCal();if(v==='long'){cal._config.title='Agenda van het gezin en alle werkzaamheden';cal._config.entities[0].name='Gezinsagenda met school en buitenschoolse activiteiten';cal._events['calendar.family'].forEach(e=>{e.summary='Bespreking van de verbouwing en gezamenlijke planning voor volgend jaar';e.location='Vergaderruimte op de bovenverdieping, hoofdgebouw bij de noordelijke ingang';});}
    if(v==='multiple')cal._events['calendar.family']=Array.from({length:8},(_,i)=>({...backup.events['calendar.family'][0],uid:'qa'+i,summary:'Afspraak '+i}));
    if(v==='all-day'){const key=cal._range().startKey;cal._events['calendar.family']=[{summary:'Hele dag samen op pad',start:key,end:cal._range().endKey,location:'Centrum'}]}
    if(v==='empty'||v==='loading')cal._events={};if(v==='loading'||v==='error')cal._statuses={'calendar.family':v};if(v==='compact')cal._config.density='compact';if(v==='columns'||v==='month')cal._view=v;cal._eventRevision++;cal._daysKey=null;cal._render()}''',variant)
    r=measure();check(r)
    if variant=='all-day':assert len(r['events'])==2 and 'Hele dag' in card.locator('.event-time').first.inner_text()
    if variant=='multiple':assert len(r['events'])==8
    if variant=='empty':assert card.locator('.event-button').count()==0
    stress.append({'width':width,'variant':variant,**r});shot(f'edge-{variant}-{width}')
   page.evaluate('resetCal()');measure()
   filt=card.locator('[data-calendar]').first;filt.focus();page.keyboard.press('Enter');page.wait_for_timeout(350);assert filt.get_attribute('aria-pressed')=='false';assert card.evaluate("c=>c.shadowRoot.activeElement?.dataset.calendar")=='calendar.family';page.keyboard.press('Space');page.wait_for_timeout(350);assert filt.get_attribute('aria-pressed')=='true'
   page.evaluate("cal._render()");assert card.evaluate("c=>c.shadowRoot.activeElement?.dataset.calendar")=='calendar.family','filter focus lost on update'
   ev=card.locator('.event-button').first;key=ev.get_attribute('data-calendar-event');ev.focus();page.evaluate("cal._render()");assert card.evaluate("c=>c.shadowRoot.activeElement?.dataset.calendarEvent")==key,'event focus lost on update';page.keyboard.press('Enter');page.wait_for_timeout(100);assert card.locator('[data-ui-popup]:visible').count()==1;shot(f'popup-{width}');page.keyboard.press('Escape');assert card.evaluate("c=>c.shadowRoot.activeElement?.dataset.calendarEvent")==key
   card.locator('[data-nav=next]').focus();page.keyboard.press('Enter');page.wait_for_timeout(150);assert card.evaluate("c=>c.shadowRoot.activeElement?.dataset.nav")=='next';card.locator('[data-nav=now]').click();page.wait_for_timeout(150);assert page.evaluate('cal._offset')==0
   interactions.append({'width':width,'filterKeyboard':True,'updateFilterFocus':True,'updateEventFocus':True,'popupEscapeFocus':True,'navigation':True})
  for variant,width in [('text-200',390),('zoom-200',780)]:
   page.set_viewport_size({'width':width,'height':1600});page.evaluate('resetCal()');paint(True,False)
   if variant=='zoom-200':page.evaluate("document.body.style.zoom='2'")
   else:card.evaluate('''c=>{const s=document.createElement('style');s.id='qa-text';s.textContent='h2{font-size:32px!important}.range,.legend-item,.day-title,.day-title time,.event-time,.event-button,.event-title,.event-meta,.empty-day,.status,[data-nav]{font-size:26px!important}';c.shadowRoot.append(s)}''')
   r=measure();check(r);stress.append({'variant':variant,**r});shot(variant);page.evaluate("document.body.style.zoom='1'");card.evaluate("c=>c.shadowRoot.querySelector('#qa-text')?.remove()")
  assert page.locator('article').count()==18;assert page.locator('#approved article').count()==6;assert page.locator('#pending [data-card=calendar-card]').count()==1;assert page.locator('#approved [data-card=overview-card]').count()==1
  page.evaluate('resetCal()');paint(True,False);page.set_viewport_size({'width':1280,'height':1200});card.scroll_into_view_if_needed();page.screenshot(path=str(OUT/'final-page-context.png'));shot('final-context-card')
  assert not errors,errors
  (OUT/'full-results.json').write_text(json.dumps({'matrix':rows,'stress':stress,'interactions':interactions,'errors':errors},indent=2));print(json.dumps({'matrix':len(rows),'stress':len(stress),'interactions':len(interactions),'errors':errors}))
 b.close()
