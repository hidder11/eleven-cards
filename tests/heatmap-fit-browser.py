"""Isolated review fixture + actual standalone bundle; never contacts HA."""
import hashlib, json, re, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-evidence/heatmap-fit'; OUT.mkdir(parents=True,exist_ok=True)
BASELINE='--baseline' in sys.argv
URL='http://127.0.0.1:56515/JC5klAkxdKA9PmJO7YSGqy76RQb7-mo6C0aJPXHgbsI/cards/review/'
MEASURE="""c=>{const r=c.shadowRoot,b=e=>{const x=e.getBoundingClientRect();return {x:x.x,y:x.y,right:x.right,bottom:x.bottom,w:x.width,h:x.height}},q=s=>r.querySelector(s),sc=q('.matrix-scroll'),matrix=q('.matrix');return {card:b(q('ha-card')),host:b(c),well:b(q('.matrix-well')),matrix:b(matrix),scroll:{w:sc.clientWidth,h:sc.clientHeight,sw:sc.scrollWidth,sh:sc.scrollHeight,overflow:getComputedStyle(sc).overflow},expected:c._rows.reduce((a,r)=>a+r.cells.length,0),actual:r.querySelectorAll('[data-cell]').length,virtual:c._virtualRows,labels:[...r.querySelectorAll('.hours span,.day')].filter(e=>e.checkVisibility()&&e.textContent.trim()).map(e=>{const range=document.createRange();range.selectNodeContents(e);return {text:e.textContent,role:e.getAttribute('role'),...b(e),ink:b(range)}}),cells:[...r.querySelectorAll('[data-cell]')].map(e=>b(e)),size:c.getCardSize()}}"""
rows=[];errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':320,'height':1200},reduced_motion='reduce')
 page.on('pageerror',lambda e:errors.append(str(e)))
 def bundle(route):
  response=route.fetch(); route.fulfill(response=response,body=(ROOT/'cards/heatmap-card/dist/eleven-heatmap-card.js').read_text()+'\n'+response.text())
 if '--served' not in sys.argv: page.route('**/dist/eleven-cards.js',bundle)
 page.goto(URL);page.wait_for_function('window.themeFixtureReady&&records[5].card._status==="ready"')
 card=page.locator('[data-card=heatmap-card]')
 page.evaluate('window.materialTokens=Object.fromEntries([...document.body.style].filter(k=>k.startsWith("--")).map(k=>[k,document.body.style.getPropertyValue(k)]))')
 def check(row):
  sc=row['scroll'];assert sc['sw']<=sc['w']+1 and sc['sh']<=sc['h']+1,('internal overflow',row)
  assert sc['overflow']=='visible',('must fit, not clip',sc)
  assert row['actual']==row['expected'] and not row['virtual'],('missing cells',row)
  assert row['well']['bottom']<=row['card']['bottom']+1 and row['card']['bottom']<=row['host']['bottom']+1,('height containment',row)
  for cell in row['cells']:assert cell['w']>0 and cell['h']>=16 and cell['x']>=row['matrix']['x']-.1 and cell['right']<=row['matrix']['right']+.1,('cell escapes',cell)
  captions=[x for x in row['labels'] if x['role']=='columnheader']
  for label in row['labels']:assert label['ink']['x']>=row['matrix']['x']-.5 and label['ink']['right']<=row['matrix']['right']+.5,('label escapes matrix',label)
  for a,z in zip(captions,captions[1:]):assert a['ink']['right']+4<=z['ink']['x'],('caption collision',a,z)
 for width in [320,390,1280]:
  page.set_viewport_size({'width':width,'height':1200})
  for material,dark in [(False,False),(False,True),(True,False),(True,True)]:
   if material:
    # Real review theme switch, not a synthesized material palette.
    page.evaluate('d=>{if(window.reviewDark!==d)document.querySelector("#mode").click();else {document.querySelector("#mode").click();document.querySelector("#mode").click()}}',dark)
   else:
    page.evaluate('''dark=>{for(const k of [...document.body.style])if(k.startsWith('--'))document.body.style.removeProperty(k);const t=dark?{'primary-background-color':'#111111','card-background-color':'#1c1c1c','primary-text-color':'#e1e1e1','secondary-text-color':'#9b9b9b','secondary-background-color':'#282828','divider-color':'#424242'}:{'primary-background-color':'#fafafa','card-background-color':'#ffffff','primary-text-color':'#212121','secondary-text-color':'#727272','secondary-background-color':'#f2f2f2','divider-color':'#e0e0e0'};Object.assign(t,{'ha-card-border-radius':'12px','ha-card-border-width':'1px','ha-card-box-shadow':'none','primary-color':'#03a9f4','accent-color':'#a86ae0','ha-card-background':'var(--card-background-color)'});for(const[k,v]of Object.entries(t))document.body.style.setProperty('--'+k,v);records[5].card.hass={...records[5].card.hass,themes:{darkMode:dark}}}''',dark)
   for variant in (['hour'] if BASELINE else ['hour','day','week','month','annual','text-200','text-200-day','text-200-week','text-200-month','no-labels','wide-config']):
    card.evaluate('''async(c,v)=>{const period=v.startsWith('text-200-')?v.slice(9):v;c.setConfig({entity:'sensor.power',title:'Heatmap',hours_to_show:v==='annual'?8760:168,aggregation_period:['day','week','month'].includes(period)?period:'hour',...(v==='no-labels'?{show_labels:false}:{}),...(v==='wide-config'?{cell_width:64,cell_gap:8,max_height:100}:{})});await c._refresh();if(v.startsWith('text-200')){const s=document.createElement('style');s.textContent='.card-header h2{font-size:32px!important}.period-trigger{font-size:24px!important}.legend,.hours span,.day{font-size:22px!important}';c.shadowRoot.append(s);c._layoutMatrixLabels()}}''',variant)
    page.wait_for_timeout(80);card.scroll_into_view_if_needed();row=card.evaluate(MEASURE);row.update(width=width,material=material,dark=dark,variant=variant)
    tag=f'{"material" if material else "ha"}-{width}-{"dark" if dark else "light"}-{variant}'
    if variant!='annual' or (width==320 and material and not dark):card.screenshot(path=str(OUT/f'{"heatmap-fit-before" if BASELINE else "heatmap-fit"}-{tag}.png'))
    rows.append(row)
    if not BASELINE:check(row)
    if not BASELINE:
     assert card.evaluate('''c=>[...c.shadowRoot.querySelectorAll('.matrix,.matrix-row,.matrix-scroll,.matrix-well,.chart,.content')].every(e=>!['hidden','clip','scroll','auto'].includes(getComputedStyle(e).overflow))'''), 'clipping/scrolling layout ancestor'
     if variant!='no-labels':
      assert card.locator('.hours span').last.inner_text(), ('last calendar caption must remain visible',tag)
      assert card.locator('.hours span').nth(1).inner_text(), 'first calendar caption must remain visible'
      assert card.evaluate('c=>[...c.shadowRoot.querySelectorAll(".hours span")].slice(1).every(e=>e.getAttribute("aria-label"))'), 'complete column accessible names'
    if BASELINE:break
   if BASELINE:break
  if BASELINE:break
 if not BASELINE:
  # Inspect a real cell tooltip, including a calendar column whose caption is sparse.
  card.evaluate('''async c=>{c.setConfig({entity:'sensor.power',aggregation_period:'week',hours_to_show:8760});await c._refresh()}''');card.scroll_into_view_if_needed()
  key=card.evaluate('c=>c._rows.flatMap(r=>r.cells).find(x=>x.value!=null).key')
  cell=card.locator(f'[data-cell="{key}"]');cell.hover();assert card.locator('.tooltip').is_visible()
  label=cell.get_attribute('aria-label');tooltip=card.locator('.tooltip').inner_text();assert 'Week' in label and 'Week' in tooltip and 'W' in tooltip
  expected=card.evaluate('(c,key)=>{const x=c._cells.get(key);return [c._cellDate(x),c._cellBounds(x),c._number(x.value)+" "+c._data.unit]}',key)
  assert all(part in tooltip for part in expected), (expected,tooltip)
  page.keyboard.press('Escape');assert not card.locator('.tooltip').is_visible()
  card.locator('.chart-tools summary').focus();page.keyboard.press('Enter');assert card.locator('.chart-tools').get_attribute('open') is not None
  card.evaluate('c=>c._render()');assert card.evaluate('c=>c.shadowRoot.activeElement.matches(".chart-tools summary")')
  page.keyboard.press('Escape');assert card.locator('.chart-tools').get_attribute('open') is None
  for width in [320,390,1280]:
   page.set_viewport_size({'width':width,'height':1200});page.wait_for_timeout(100);card.scroll_into_view_if_needed();check(card.evaluate(MEASURE))
 assert not errors,errors
 report={'cases':len(rows),'errors':errors,'standalone_sha256':hashlib.sha256((ROOT/'cards/heatmap-card/dist/eleven-heatmap-card.js').read_bytes()).hexdigest(),'delivery':'Actual standalone prepended to fetched collection by Playwright route; collection on disk unchanged.','rows':rows}
 (OUT/('heatmap-fit-before.json' if BASELINE else 'heatmap-fit-results.json')).write_text(json.dumps(report,indent=2))
 print(json.dumps({'cases':len(rows),'errors':errors,'baseline':BASELINE}))
 if BASELINE:check(rows[0])
 b.close()
