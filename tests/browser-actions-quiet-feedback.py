"""Synthetic Actions only: stable geometry before/during/after commands."""
from pathlib import Path
import json, urllib.request, hashlib, yaml
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-evidence/actions-quiet-feedback'
TOKEN=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text())['token']
BASE=f'http://127.0.0.1:56515/{TOKEN}/cards/'
results=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':1200},reduced_motion='reduce')
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 for width in [320,390,1280]:
  for theme in ['material','ha']:
   for dark in [False,True]:
    page.set_viewport_size({'width':width,'height':1200})
    page.goto(BASE+'review/');page.wait_for_function('window.themeFixtureReady')
    page.evaluate("window.ac=records.find(r=>r.name==='actions-card').card")
    tokens={'ha-card-border-radius':'12px','ha-card-border-width':'1px','ha-card-box-shadow':'none','primary-color':'#03a9f4','accent-color':'#a86ae0','ha-card-background':'var(--card-background-color)'}
    tokens.update({'primary-background-color':'#111','card-background-color':'#1c1c1c','primary-text-color':'#e1e1e1','secondary-text-color':'#aaa','secondary-background-color':'#282828','divider-color':'#424242'} if dark else {'primary-background-color':'#fafafa','card-background-color':'#fff','primary-text-color':'#212121','secondary-text-color':'#666','secondary-background-color':'#f2f2f2','divider-color':'#ddd'})
    if theme=='material':
     material=yaml.safe_load((ROOT/'themes/eleven_material.yaml').read_text())['Eleven Material']
     tokens.update({k:v for k,v in material.items() if k!='modes'});tokens.update(material['modes']['dark' if dark else 'light'])
    page.evaluate('''({tokens,dark})=>{for(const k of [...document.body.style])if(k.startsWith('--'))document.body.style.removeProperty(k);for(const[k,v]of Object.entries(tokens))document.body.style.setProperty('--'+k,String(v));document.body.style.colorScheme=dark?'dark':'light';ac.hass={...ac.hass,themes:{darkMode:dark}}}''',{'tokens':tokens,'dark':dark})
    page.evaluate("window.calls=[];ac.hass={...ac.hass,callService:(...args)=>{calls.push(args);return new Promise((resolve,reject)=>{window.finish=resolve;window.fail=reject})}}")
    card=page.locator('[data-card=actions-card]');card.scroll_into_view_if_needed();page.wait_for_timeout(100)
    def height():return card.evaluate('c=>c.getBoundingClientRect().height')
    before=height();button=card.locator('.action').first;button.focus();button.press('Enter');page.wait_for_timeout(50)
    during=height();assert button.is_disabled();assert card.locator('.actions').get_attribute('aria-busy')=='true'
    assert not card.locator('.feedback').is_visible()
    page.evaluate('finish()');page.wait_for_timeout(80);after=height()
    assert max(before,during,after)-min(before,during,after)<0.1,(width,theme,dark,before,during,after)
    assert not button.is_disabled() and not card.locator('.feedback').is_visible()
    assert button.evaluate('e=>e===e.getRootNode().activeElement')
    card.screenshot(path=str(OUT/f'{theme}-{dark}-{width}-success.png'))
    button.click();page.evaluate("fail(new Error('Testfout'))");page.wait_for_timeout(50)
    assert 'Testfout' in card.locator('.feedback').inner_text() and card.locator('.feedback').is_visible()
    assert len(page.evaluate('calls'))==2
    results.append({'width':width,'theme':theme,'dark':dark,'before':before,'pending':during,'success':after,'errorPreserved':True})
 assert not errors,errors
 b.close()
local=(ROOT/'cards/home-controls/dist/eleven-home-controls-card.js').read_bytes()
for host in ['http://127.0.0.1:56515','https://kyle-modules-tions-donald.trycloudflare.com']:
 with urllib.request.urlopen(f'{host}/{TOKEN}/cards/cards/home-controls/dist/eleven-home-controls-card.js',timeout=45) as response:
  assert response.read()==local
(OUT/'results.json').write_text(json.dumps({'cases':results,'errors':errors,'servedSHA256':hashlib.sha256(local).hexdigest()},indent=2))
print(json.dumps({'stableHeightCases':len(results),'errors':errors,'localAndPublicBytesMatch':True}))
