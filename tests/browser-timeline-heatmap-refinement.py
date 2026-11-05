"""Real served renderer; synthetic data only, no HA connection."""
import argparse,json,yaml
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
a=argparse.ArgumentParser();a.add_argument('--card',choices=['timeline','heatmap'],required=True);a.add_argument('--baseline',action='store_true');a.add_argument('--full',action='store_true');args=a.parse_args()
OUT=ROOT/'qa-evidence'/f'{args.card}-refinement';OUT.mkdir(parents=True,exist_ok=True)
URL='http://127.0.0.1:56515/JC5klAkxdKA9PmJO7YSGqy76RQb7-mo6C0aJPXHgbsI/cards/review/'
index=2 if args.card=='timeline' else 5
MEASURE="""c=>{const r=c.shadowRoot,box=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}},q=s=>r.querySelector(s),surface=q('ha-card'),well=q('.timeline-well,.matrix-well,.matrix-scroll');return {innerScroll:q('.matrix-scroll')&&box(q('.matrix-scroll')),card:box(surface),header:box(q('.card-header')),well:well&&box(well),scroll:surface.scrollWidth,client:surface.clientWidth,labels:[...r.querySelectorAll('.axis span,.row-label,.hours span,.day')].filter(e=>e.checkVisibility()).map(e=>({text:e.textContent,kind:e.className,...box(e),ink:(()=>{const x=document.createRange();x.selectNodeContents(e);return box(x)})()})),actions:[...r.querySelectorAll('.card-header [data-ui-button],.card-header summary')].filter(e=>e.checkVisibility()).map(box)}}"""
errors=[];matrix=[];interactions=[];stress=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':1200},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(URL);page.wait_for_function(f'window.themeFixtureReady&&records[{index}].card._status==="ready"')
 card=page.locator(f'[data-card={args.card}-card]')
 theme=yaml.safe_load((ROOT/'themes/eleven_material.yaml').read_text())['Eleven Material']
 def paint(material,dark):
  tokens={'ha-card-border-radius':'12px','ha-card-border-width':'1px','ha-card-box-shadow':'none','primary-color':'#03a9f4','accent-color':'#a86ae0','error-color':'#db4437','text-primary-color':'#fff','ha-card-background':'var(--card-background-color)'}
  tokens.update({'primary-background-color':'#111111','card-background-color':'#1c1c1c','primary-text-color':'#e1e1e1','secondary-text-color':'#9b9b9b','secondary-background-color':'#282828','divider-color':'#424242'} if dark else {'primary-background-color':'#fafafa','card-background-color':'#ffffff','primary-text-color':'#212121','secondary-text-color':'#727272','secondary-background-color':'#f2f2f2','divider-color':'#e0e0e0'})
  if material:tokens.update({k:v for k,v in theme.items() if k!='modes'});tokens.update(theme['modes']['dark' if dark else 'light'])
  tokens['primary-color']='#03a9f4';tokens['accent-color']='#a86ae0'
  page.evaluate('''({tokens,dark,index})=>{for(const k of [...document.body.style])if(k.startsWith('--'))document.body.style.removeProperty(k);for(const[k,v]of Object.entries(tokens))document.body.style.setProperty('--'+k,v);document.body.style.colorScheme=dark?'dark':'light';const c=records[index].card;c.hass={...c.hass,themes:{darkMode:dark}}}''',{'tokens':tokens,'dark':dark,'index':index});page.wait_for_timeout(130)
 def check(row,ordinary=False):
  assert row['scroll']<=row['client']+1,('surface overflow',row)
  if ordinary:assert row['header']['h']<=100,('one calm primary period row required',row)
  assert all(x['w']>=43.9 and x['h']>=43.9 for x in row['actions']),('control targets',row)
  if row['well']:
   well=row['well'];assert well['bottom']<=row['card']['bottom']+1,('well escapes surface',row)
   if args.card=='timeline':
    for x in row['labels']:assert x['x']>=well['x']+9.5 and x['right']<=well['right']-9.5,('label inset clearance',x,row)
    times=[x for x in row['labels'] if not x['kind']];assert all(x['right']+7<=y['x'] for x,y in zip(times,times[1:])),('axis collision',row)
   else:
    scale=row['card']['w']/row['client'];assert row['innerScroll']['y']>=well['y']+9*scale,('sticky viewport needs genuine outside inset',row)
    for x in row['labels']:assert x['ink']['right']<=x['right']+1 and x['ink']['x']>=x['x']-1,('matrix label glyphs escape cell',x,row)
 for width in [320,390,1280]:
  page.set_viewport_size({'width':width,'height':1200})
  for material,dark in ([(True,False),(True,True)] if args.baseline or not args.full else [(False,False),(False,True),(True,False),(True,True)]):
   paint(material,dark);card.scroll_into_view_if_needed();row=card.evaluate(MEASURE);row.update(width=width,material=material,dark=dark)
   card.screenshot(path=str(OUT/f'{"before" if args.baseline else "after"}-{"material" if material else "ha"}-{width}-{"dark" if dark else "light"}.png'));matrix.append(row)
   if not args.baseline:check(row,True)
 (OUT/f'{"before" if args.baseline else "after"}-geometry.json').write_text(json.dumps(matrix,indent=2))
 if args.full and not args.baseline:
  for width in [320,390,1280]:
   page.set_viewport_size({'width':width,'height':1200});paint(True,width==390);card.scroll_into_view_if_needed()
   summary=card.locator('.chart-tools summary');summary.focus();page.keyboard.press('Enter');assert card.locator('.chart-tools').get_attribute('open') is not None
   card.evaluate('c=>c._render()');assert card.evaluate('c=>c.shadowRoot.activeElement.matches(".chart-tools summary")');assert card.locator('.chart-tools').get_attribute('open') is not None
   if args.card=='timeline':
    card.locator('[data-zoom=in]').click();assert card.evaluate('c=>!!c._viewport');card.locator('[data-zoom=reset]').click();assert card.evaluate('c=>c._viewport===null')
   assert 'sensor.power' in card.locator('.history-link').get_attribute('href') if args.card=='heatmap' else 'switch.heating' in card.locator('.history-link').get_attribute('href')
   card.locator('[data-insight=data]').click();assert card.locator('.insight-popup').is_visible();page.keyboard.press('Escape')
   summary=card.locator('.chart-tools summary');summary.focus();page.keyboard.press('Escape');assert card.locator('.chart-tools').get_attribute('open') is None
   summary.click();page.locator('body>header h1').click();assert card.locator('.chart-tools').get_attribute('open') is None
   card.scroll_into_view_if_needed();summary.click();card.locator('h2').click();assert card.locator('.chart-tools').get_attribute('open') is None
   card.locator('.period-trigger').click();card.locator('[data-period-option="6h"]').click();page.wait_for_function(f'records[{index}].card._status==="ready"&&records[{index}].card._end-records[{index}].card._start===21600000')
   end=card.evaluate('c=>c._start');card.locator('[data-period=previous]').click();page.wait_for_function(f'end=>records[{index}].card._status==="ready"&&records[{index}].card._end===end',arg=end)
   card.locator('[data-period=now]').click();page.wait_for_function(f'records[{index}].card._status==="ready"')
   card.locator('.period-trigger').click();card.locator('[data-period-option=configured]').click();page.wait_for_function(f'records[{index}].card._status==="ready"')
   if args.card=='timeline':
    chart=card.locator('.chart');chart.focus();page.keyboard.press('Home');assert card.locator('.tooltip').is_visible();page.keyboard.press('End');assert card.evaluate('c=>c._cursor===c._viewEnd');page.keyboard.press('Escape');assert not card.locator('.tooltip').is_visible()
    label=card.locator('.row-label').first;label.focus();page.keyboard.press('Shift+Enter');assert card.locator('.row').count()==1
    card.evaluate('c=>{c._visibility=new Map();c._render()}')
   else:
    sc=card.locator('.matrix-scroll');sc.evaluate('e=>e.scrollLeft=300');x=sc.evaluate('e=>e.scrollLeft');assert x>0
    card.evaluate('c=>c._render()');assert card.locator('.matrix-scroll').evaluate('e=>e.scrollLeft')==x
    sc=card.locator('.matrix-scroll');sc.evaluate('e=>e.scrollLeft=0');cell=card.locator('[data-cell]').filter(has_not=page.locator('.impossible')).first
    visible=card.locator('[data-cell]').evaluate_all('els=>{const p=els[0].closest(".matrix-scroll").getBoundingClientRect();return els.find(e=>{const r=e.getBoundingClientRect();return r.left>p.left+100&&r.right<p.right})?.dataset.cell}')
    card.locator(f'[data-cell="{visible}"]').hover();assert card.locator('.tooltip').is_visible()
   card.screenshot(path=str(OUT/f'interaction-{width}.png'));interactions.append({'width':width,'passed':True})
  page.set_viewport_size({'width':320,'height':1200});paint(True,False)
  card.evaluate('c=>{window.originalConfig=structuredClone(c._config);window.originalSeries=structuredClone(c._series);window.originalRows=structuredClone(c._rows);window.originalData=structuredClone(c._data);window.originalHass=c.hass;}')
  variants=['long-title','long-labels','loading','error','empty','text-200','zoom-200']
  if args.card=='heatmap':variants+=['day','week','month','no-labels','large-values','negative-values']
  for variant in variants:
   card.evaluate('''(c,v)=>{c._config=structuredClone(originalConfig);c._hass=originalHass;c._series=structuredClone(originalSeries);c._rows=structuredClone(originalRows);c._data=structuredClone(originalData);c._status='ready';if(v==='long-title')c._config.title='Energiegebruik en statussen van woonkamer keuken en alle verdiepingen';if(v==='long-labels'){if(c._config.entities){c._config.series_options=[{entity:c._config.entities[0],name:'Verwarming woonkamer keuken en alle bijgebouwen met extra lange naam'}]}else{c._data={...c._data,unit:'kilowatt-hours per square metre'};}}if(['loading','error'].includes(v))c._status=v;if(v==='empty'){if(c._config.entities)c._series=c._series.map(()=>[]);else c._rows=[];}if(['day','week','month'].includes(v)){c._config.aggregation_period=v;c._rows=[];c._data=null;}if(v==='no-labels')c._config.show_labels=false;if(v==='large-values'){c._config.scale_min=1000000000000;c._config.scale_max=9000000000000;}if(v==='negative-values'){c._config.scale_min=-1000000000;c._config.scale_max=-100000000;}c._render()}''',variant)
   if variant in ['day','week','month']:
    card.evaluate('c=>{c._invalidate();return c._refresh()}');page.wait_for_function(f'records[{index}].card._status==="ready"')
   if variant=='text-200':card.evaluate('c=>{const s=document.createElement("style");s.id="textzoom";s.textContent=".card-header h2{font-size:32px!important}.period-trigger,.header-actions [data-ui-button]{font-size:24px!important}.axis,.row-label,.summary,.legend{font-size:24px!important}.hours span,.day{font-size:22px!important}";c.shadowRoot.append(s);c._layoutTimeline?.();c._layoutMatrixLabels?.()}')
   if variant=='zoom-200':page.set_viewport_size({'width':780,'height':1500});page.evaluate("document.body.style.zoom='2'")
   if variant in ['large-values','negative-values']:
    rects=card.locator('.legend-value').evaluate_all('els=>els.map(e=>{const t=(e.querySelector(".scale-number")??e).firstChild,r=document.createRange();r.setStart(t,0);r.setEnd(t,t.textContent.split(" ")[0].length);return r.getClientRects().length})');assert all(n==1 for n in rects),('number split across lines',variant,rects)
   page.wait_for_timeout(180);card.scroll_into_view_if_needed();row=card.evaluate(MEASURE);check(row);card.screenshot(path=str(OUT/f'edge-{variant}.png'));stress.append({'variant':variant,**row});card.evaluate('c=>c.shadowRoot.querySelector("#textzoom")?.remove()');page.evaluate("document.body.style.zoom='1'");page.set_viewport_size({'width':320,'height':1200})
  page.emulate_media(forced_colors='active');assert card.locator('ha-card').evaluate('e=>getComputedStyle(e).boxShadow')=='none'
 assert not errors,errors
 report={'matrix':matrix,'interactions':interactions,'stress':stress,'errors':errors};(OUT/f'{"baseline" if args.baseline else "results"}.json').write_text(json.dumps(report,indent=2));print(json.dumps({'card':args.card,'matrix':len(matrix),'interactions':len(interactions),'stress':len(stress),'errors':errors}))
 b.close()
