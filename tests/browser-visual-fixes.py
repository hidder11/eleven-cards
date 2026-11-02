"""Rendered review seam: bounded visual fixes, synthetic data, no HA."""
import argparse,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-evidence/visual-fixes';OUT.mkdir(parents=True,exist_ok=True)
a=argparse.ArgumentParser();a.add_argument('--card',default='history-graph-card');args=a.parse_args()
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
rows=[];errors=[]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
  page=b.new_page(viewport={'width':390,'height':1100},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/review/');page.wait_for_function('window.themeFixtureReady===true')
  for width in [320,390,1280]:
   page.set_viewport_size({'width':width,'height':1100})
   for dark in [False,True]:
    if page.evaluate('window.reviewDark')!=dark:page.locator('#mode').click()
    page.evaluate("document.body.style.setProperty('--accent-color','#a86ae0')")
    card=page.locator('[data-card="'+args.card+'"]');card.scroll_into_view_if_needed();page.wait_for_timeout(150)
    row=card.evaluate('''c=>{const r=c.shadowRoot,q=s=>r.querySelector(s),visible=e=>!!e.getBoundingClientRect().width;return {width:q('ha-card').clientWidth,scroll:q('ha-card').scrollWidth,controls:[...r.querySelectorAll('.header-actions [data-ui-button],.legend [data-ui-legend],.legend-item')].filter(visible).map(e=>({text:e.textContent,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})),period:q('.period-trigger span')?{text:q('.period-trigger span').textContent,width:q('.period-trigger span').clientWidth,scroll:q('.period-trigger span').scrollWidth}:null,ticks:[...r.querySelectorAll('.axis-x,.axis span')].filter(visible).map(e=>e.textContent),periodLabel:q('.period')?{width:q('.period').clientWidth,scroll:q('.period').scrollWidth,whiteSpace:getComputedStyle(q('.period')).whiteSpace}:null}}''')
    row.update(viewport=width,dark=dark,card=args.card);rows.append(row)
    (OUT/(args.card+'-results.json')).write_text(json.dumps({'rows':rows,'errors':errors},indent=2))
    assert row['scroll']<=row['width']+1,('overflow',row)
    assert all(c['w']>=43.9 and c['h']>=43.9 for c in row['controls']),('small control',row)
    if row['period']:assert row['period']['scroll']<=row['period']['width']+1,('clipped period',row)
    if args.card in ['history-graph-card','timeline-card']:assert len(set(row['ticks']))==len(row['ticks']),('ambiguous dates',row)
    if args.card=='overview-card':assert row['periodLabel']['whiteSpace']=='nowrap',row
    card.screenshot(path=str(OUT/f'{args.card}-{width}-{"dark" if dark else "light"}.png'))
    if args.card=='energy-flow-card':
     values=card.locator('.flow-secondary .ui-metric-title').evaluate_all('els=>els.map(e=>({wrap:getComputedStyle(e).overflowWrap,text:e.textContent}))')
     assert all(v['wrap']=='normal' for v in values),('split metric label',values)
    if args.card=='dynamic-energy-price-card':
     dayLabels=card.locator('.day-label').evaluate_all('els=>els.map(e=>({text:e.textContent,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}))')
     assert all(a['right']+4<=b['left'] for a,b in zip(dayLabels,dayLabels[1:])),('day label collision',dayLabels)
    if args.card=='heatmap-card':
     matrix=card.locator('.matrix-scroll')
     assert card.locator('.scroll-hint').is_visible()==matrix.evaluate('e=>e.scrollWidth>e.clientWidth+1')
    if row['period']:
     card.locator('.period-trigger').click();page.wait_for_timeout(100)
     popup=card.locator('.period-menu')
     selected=popup.locator('[aria-selected=true]').first
     values=selected.evaluate('e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {color:s.color,border:s.borderBottomWidth,h:r.height}}')
     assert values['color']=='rgb(168, 106, 224)' and values['border']=='0px' and values['h']>=44,('period selection',values)
     choice=popup.locator('[data-period-option=configured]')
     val=choice.evaluate('e=>({color:getComputedStyle(e).color,h:e.getBoundingClientRect().height})')
     assert val['color']=='rgb(168, 106, 224)' and val['h']>=44,('configured selection',val)
     popup.screenshot(path=str(OUT/f'{args.card}-popup-{width}-{"dark" if dark else "light"}.png'))
     card.locator('[data-period=close]').click()
  assert not errors,errors
  b.close()
 print(json.dumps({'card':args.card,'cases':len(rows),'page_errors':errors}))
finally:server.shutdown()
