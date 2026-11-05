"""Shopping-only real Chromium fixtures. No HA/network/service access."""
import importlib.util,json,os
from pathlib import Path
import yaml
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-evidence/shopping-refinement'
spec=importlib.util.spec_from_file_location('shopping',ROOT/'cards/shopping-card/tests/browser_test.py')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
THEME=yaml.safe_load((ROOT/'themes/eleven_material.yaml').read_text())['Eleven Material']
BASELINE=bool(os.environ.get('BASELINE'));TARGET=os.environ.get('TARGET','standalone')
folder=OUT/('baseline' if BASELINE else TARGET);folder.mkdir(parents=True,exist_ok=True)
results=[];errors=[]
def tokens(material,dark):
 t={'ha-card-border-radius':'12px','ha-card-box-shadow':'none','primary-color':'#007db4','accent-color':'#76509e','error-color':'#b71c1c'}
 t.update({'primary-background-color':'#111111','card-background-color':'#1c1c1c','primary-text-color':'#e1e1e1','secondary-text-color':'#aeb4bf','secondary-background-color':'#282828','divider-color':'#424242','error-color':'#ff9494','primary-color':'#91c6ff'} if dark else {'primary-background-color':'#fafafa','card-background-color':'#fff','primary-text-color':'#212121','secondary-text-color':'#666666','secondary-background-color':'#f2f2f2','divider-color':'#e0e0e0'})
 t['ha-card-background']='var(--card-background-color)'
 if material:t.update({k:v for k,v in THEME.items() if k!='modes'});t.update(THEME['modes']['dark' if dark else 'light'])
 return {k:str(v) for k,v in t.items()}
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':1000},has_touch=True,reduced_motion='reduce',timezone_id='UTC')
 page.set_default_timeout(5000)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(mod.FIXTURE+'<style>body{padding:16px}eleven-shopping-card{max-width:380px} @media(min-width:900px){body{display:grid;align-items:start;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}eleven-shopping-card{width:100%;max-width:none;margin:0}}</style>')
 path=ROOT/('dist/eleven-cards.js' if TARGET=='collection' else 'cards/shopping-card/dist/eleven-shopping-card.js')
 if BASELINE:path=OUT/'entry/cards/shopping-card/dist/eleven-shopping-card.js'
 page.add_script_tag(content=path.read_text())
 page.evaluate("""window.card=document.createElement('eleven-shopping-card');card.setConfig({entity:'todo.test'});card.hass=h;document.body.append(card);items[0].summary='Volkoren brood · 2 stuks';items[1].summary='Tomaten · 500 g';items[0].description='Gesneden, voor in de vriezer'""")
 card=page.locator('eleven-shopping-card')
 def paint(material,dark):
  page.evaluate('''({tokens,dark})=>{document.documentElement.style.cssText='';for(const[k,v]of Object.entries(tokens))document.documentElement.style.setProperty('--'+k,v);document.documentElement.style.colorScheme=dark?'dark':'light'}''',{'tokens':tokens(material,dark),'dark':dark})
 def shot(name):
  page.mouse.move(0,0);card.screenshot(path=str(folder/(name+'.png')))
 def measure():
  return card.evaluate('''c=>{const r=c.shadowRoot,box=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}},style=e=>{const s=getComputedStyle(e);return {size:s.fontSize,weight:s.fontWeight,color:s.color,bg:s.backgroundColor,image:s.backgroundImage,shadow:s.boxShadow}},ha=r.querySelector('ha-card');return {host:box(c),ha:box(ha),overflow:ha.scrollWidth>ha.clientWidth+1,heading:style(r.querySelector('h2')),icon:r.querySelector('.title-icon')?{...box(r.querySelector('.title-icon')),...style(r.querySelector('.title-icon'))}:null,rows:[...r.querySelectorAll('[data-row]')].map(e=>({...box(e),summary:box(e.querySelector('.summary')),check:box(e.querySelector('.check')),ink:[...e.querySelectorAll('.summary-text,.metadata')].map(t=>{const range=document.createRange();range.selectNodeContents(t);return {...box(range),owner:box(t),text:t.textContent}})})),targets:[...r.querySelectorAll('button,input,textarea,select')].filter(e=>e.type!=='checkbox').map(e=>({...box(e),key:e.dataset.key||e.ariaLabel,overflow:e.scrollWidth>e.clientWidth+1})),roles:[...r.querySelectorAll('h2,.summary-text,.metadata,.section-heading h3,.section-heading button')].map(e=>({...box(e),...style(e),role:e.className||e.tagName})),paint:style(ha)}}''')
 def valid(m,enlarged=False):
  assert not m['overflow'],m
  assert m['ha']['bottom']<=m['host']['bottom']+1,m
  for t in m['targets']:
   assert t['w']>=43.9 and t['h']>=43.9,t
   assert t['right']<=m['ha']['right']+1,t
  for r in m['rows']:
   assert r['check']['w']>=44 and r['check']['h']>=44,r
   for ink in r['ink']:
    assert ink['right']<=r['summary']['right']+1 and ink['bottom']<=r['summary']['bottom']+1,ink
  if not BASELINE:
   assert m['heading']['size']==('32px' if enlarged else '16px'),m['heading']
   assert m['heading']['weight']=='600'
   assert m['icon']['w']==20 and m['icon']['h']==20 and m['icon']['shadow']=='none',m['icon']
 for width in [320,390,1280]:
  page.set_viewport_size({'width':width,'height':1000})
  for material,dark in [(False,False),(False,True),(True,False),(True,True)]:
   mode=('material' if material else 'native')+('-dark' if dark else '-light')
   paint(material,dark);card.evaluate('c=>c.shadowRoot.activeElement?.blur()');shot(f'default-{width}-{mode}');m=measure()
   if BASELINE:
    results.append({'width':width,'mode':mode,'geometry':m});continue
   valid(m)
   assert ('gradient' in m['paint']['image'])==material,m
   assert (m['paint']['shadow']!='none')==material,m
   assert card.locator('.edit-hint').count()==3
   # Real subscription/empty/error states at every target width and palette.
   page.evaluate('window.savedItems=structuredClone(items);items=[];push()');expect(card).to_contain_text('Alles afgevinkt.');shot(f'empty-{width}-{mode}');valid(measure())
   page.evaluate('hold=true;card.remove();document.body.append(card)');expect(card).to_contain_text('Laden…');shot(f'loading-{width}-{mode}');valid(measure())
   page.evaluate('subFail=true;card.remove();document.body.append(card)');expect(card.get_by_role('status')).to_contain_text('Offline');expect(card).not_to_contain_text('Laden…');shot(f'error-{width}-{mode}');valid(measure())
   page.evaluate('subFail=false;hold=false;items=structuredClone(savedItems)');card.get_by_role('button',name='Opnieuw proberen',exact=True).click();expect(card).to_contain_text('Volkoren brood · 2 stuks')
   page.evaluate("h.states['todo.test'].state='unavailable';card.hass={...h}");expect(card.get_by_role('textbox',name='Nieuw product')).to_be_disabled();shot(f'unavailable-{width}-{mode}');valid(measure())
   page.evaluate("h.states['todo.test'].state='2';card.hass={...h}")
   # Long names and unbroken strings: all ink stays inside its name target.
   page.evaluate("items[0].summary='Volkoren crackers met zaden, zonder toegevoegd zout · 3 verpakkingen van 250 gram';items[1].summary='LangOnonderbrokenProductnummer'.repeat(6)+' · 12 stuks';push()")
   shot(f'long-{width}-{mode}');valid(measure())
   card.get_by_role('button',name='Volgorde wijzigen').click();shot(f'reorder-{width}-{mode}');valid(measure())
   card.get_by_role('button',name='Klaar met volgorde').click()
   # Explicit 200% text-only enlargement for every actual text role/control.
   # Keep text zoom inside the renderer-owned stylesheet across DOM patches.
   card.evaluate('''c=>{const original=c._updateDOM;c._updateDOM=function(markup){return original.call(this,this._text200?markup.replace('</style>',this._text200+'</style>'):markup)}}''') if not page.evaluate('card._zoomWrapped') else None
   page.evaluate('card._zoomWrapped=true')
   zoom_css='h2{font-size:32px!important}.row,.add input,p{font-size:28px!important}.metadata,.section-heading h3,.section-heading button,.retry-add{font-size:24px!important}.edit-form label,.edit-actions button,.confirm button,.feedback{font-size:26px!important}.edit-form input,.edit-form textarea,.edit-form select{font-size:32px!important}'
   page.evaluate('(css)=>{card._text200=css;card._render()}',zoom_css)
   shot(f'text200-{width}-{mode}');valid(measure(),True)
   card.locator('[data-edit]').first.focus();page.keyboard.press('Enter');expect(card.get_by_role('textbox',name='Product',exact=True)).to_be_focused()
   shot(f'edit200-{width}-{mode}');valid(measure(),True)
   page.keyboard.press('Escape');expect(card.locator('[data-edit]').first).to_be_focused()
   page.evaluate("card._text200='';card._render()")
   page.evaluate("items[0].summary='Volkoren brood · 2 stuks';items[1].summary='Tomaten · 500 g';push()")
   results.append({'width':width,'mode':mode,'geometry':m,'longReorderText200Edit200':True})
 if not BASELINE:
  # True keyboard interaction, focus ring, async errors and retained edit.
  page.set_viewport_size({'width':320,'height':1000});paint(True,False)
  first=card.locator('[data-edit]').first;first.focus();page.keyboard.press('Enter')
  name=card.get_by_role('textbox',name='Product',exact=True);name.fill('Zuurdesem brood · 2 stuks')
  page.evaluate('fail=true');card.get_by_role('button',name='Opslaan',exact=True).click()
  expect(card.get_by_role('status')).to_contain_text('Test geweigerd');expect(name).to_have_value('Zuurdesem brood · 2 stuks');shot('edit-error-320')
  page.evaluate('fail=false');card.get_by_role('button',name='Opslaan',exact=True).click();expect(first).to_be_focused()
  assert page.evaluate('calls.at(-1)[2]')=={'item':'a','rename':'Zuurdesem brood · 2 stuks'}
  page.keyboard.press('Tab');page.keyboard.press('Shift+Tab')
  assert first.evaluate('e=>e.matches(":focus-visible") && getComputedStyle(e).outlineStyle!=="none"')
  shot('keyboard-focus-320')
  # Pending check is not optimistic; provider confirmation changes displayed state.
  page.evaluate('h.callService=(...args)=>{calls.push(args);return new Promise(resolve=>window.finish=resolve)};card.hass={...h};void 0')
  check=card.get_by_role('checkbox',name='Volkoren brood · 2 stuks');check.click();expect(check).not_to_be_checked();expect(check).to_be_disabled();shot('check-pending-320')
  page.evaluate("items[0].status='completed';push();finish()")
  expect(check).to_be_checked();expect(check).to_be_enabled();shot('check-confirmed-320')
  # Async add queue retains new draft; failure stays inline and retry restores focus.
  page.evaluate('window.jobs=[];h.callService=(...args)=>{calls.push(args);return new Promise((resolve,reject)=>jobs.push({resolve,reject}))};card.hass={...h};void 0')
  draft=card.get_by_role('textbox',name='Nieuw product');draft.fill('Melk · 2 liter');draft.press('Enter');draft.fill('Volgende boodschap')
  expect(draft).to_be_focused();expect(card.locator('.add-job')).to_contain_text('Opslaan…');shot('add-pending-320')
  page.evaluate("jobs[0].reject(Error('Offline. Probeer opnieuw.'))");expect(card.locator('.add-job')).to_contain_text('Niet opgeslagen');shot('add-error-320')
  retry=card.get_by_role('button',name='Opnieuw proberen: Melk · 2 liter');retry.focus();retry.press('Enter');expect(draft).to_be_focused();expect(draft).to_have_value('Volgende boodschap')
  page.evaluate('jobs[1].resolve()');expect(card.locator('.add-job')).to_have_count(0)
  # Existing deletion and clear-confirmation payloads, real native keyboard submission.
  card.get_by_role('button',name='Bewerk Tomaten · 500 g').click();card.get_by_role('button',name='Verwijderen',exact=True).click()
  assert page.evaluate('calls.at(-1)[2]')=={'item':['b']};page.evaluate('items=items.filter(i=>i.uid!=="b");push();jobs.at(-1).resolve()')
  expect(card.get_by_role('button',name='Bewerk Tomaten · 500 g')).to_have_count(0);shot('deleted-320')
  card.get_by_role('button',name='Afgevinkt wissen').click();shot('clear-confirm-320');card.get_by_role('button',name='Annuleren',exact=True).click();expect(card.get_by_role('button',name='Afgevinkt wissen')).to_be_focused()
  # Full metadata form at phone size and keyboard cancel.
  page.evaluate("h.states['todo.test'].attributes.supported_features=127;card.hass={...h}")
  card.locator('[data-edit]').first.click();shot('metadata-edit-320');valid(measure());page.keyboard.press('Escape')
  # Empty/loading/subscription failure and recovery, not fabricated screenshots.
  page.evaluate('items=[];push()');expect(card).to_contain_text('Alles afgevinkt.');shot('empty-320')
  page.evaluate('hold=true;card.remove();document.body.append(card)');expect(card).to_contain_text('Laden…');shot('loading-320')
  page.evaluate('subFail=true;card.remove();document.body.append(card)');expect(card).not_to_contain_text('Laden…');expect(card.get_by_role('status')).to_contain_text('Offline');shot('subscription-error-320')
  page.evaluate('subFail=false;hold=false');card.get_by_role('button',name='Opnieuw proberen',exact=True).click();expect(card.locator('.feedback')).to_have_text('')
  page.evaluate("h.states['todo.test'].state='unavailable';card.hass={...h}");expect(draft).to_be_disabled();shot('unavailable-320')
 assert not errors,errors
 contrasts=[]
 if not BASELINE:
  import re
  from PIL import Image
  def luminance(rgb):
   c=[v/255 for v in rgb[:3]];c=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c]
   return .2126*c[0]+.7152*c[1]+.0722*c[2]
  for row in results:
   m=row['geometry'];im=Image.open(folder/f"default-{row['width']}-{row['mode']}.png").convert('RGB')
   for role in m['roles']:
    fg=[float(v) for v in re.findall(r'[\d.]+',role['color'])][:3]
    # Sample the rendered gradient at the same vertical position just before text.
    x=max(0,round(role['x']-m['host']['x']-2));y=round(role['y']-m['host']['y']+role['h']/2)
    bg=im.getpixel((min(im.width-1,x),min(im.height-1,y)))
    a,b=sorted([luminance(fg),luminance(bg)]);ratio=(b+.05)/(a+.05)
    contrasts.append({'width':row['width'],'mode':row['mode'],'role':role['role'],'foreground':fg,'sampledBackground':bg,'ratio':round(ratio,3)})
    assert ratio>=4.5,contrasts[-1]
  (folder/'contrast.json').write_text(json.dumps(contrasts,indent=2))
 (folder/'results.json').write_text(json.dumps({'target':TARGET,'matrix':results,'pageErrors':errors,'interactionSets':0 if BASELINE else 1},indent=2))
 print(json.dumps({'target':TARGET,'baseline':BASELINE,'matrix':len(results),'pageErrors':errors,'interactionSets':0 if BASELINE else 1}))
 browser.close()
