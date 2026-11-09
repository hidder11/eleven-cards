"""Weather semantic paint roles against actual served aggregate, no bundle injection."""
import json, re, yaml
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-evidence/weather-palette';OUT.mkdir(exist_ok=True)
TOKEN=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text())['token']
URL=f'http://127.0.0.1:56515/{TOKEN}/cards/review/'
THEME=yaml.safe_load((ROOT/'themes/eleven_material.yaml').read_text())['Eleven Material']
PALETTE={'partlycloudy':('#f3b51b','#ffd45c'),'sunny':('#f3b51b','#ffd45c'),'rainy':('#269ad5','#76cafa'),'clear-night':('#8873dc','#b8a7ff'),'lightning-rainy':('#8873dc','#b8a7ff'),'snowy':('#32a9bb','#8bdeec'),'cloudy':('#6599bb','#add6ef')}
def rgb(hex):return 'rgb('+', '.join(str(int(hex[i:i+2],16)) for i in (1,3,5))+')'
def luminance(color):
 if color.startswith('#'):color=rgb(color)
 values=[float(x)/255 for x in re.findall(r'[\d.]+',color)[:3]]
 assert len(values)==3,color
 return sum((v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4)*w for v,w in zip(values,[.2126,.7152,.0722]))
def contrast(a,b):
 x,y=sorted([luminance(a),luminance(b)]);return (y+.05)/(x+.05)
results=[];errors=[];alternatives=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':1400},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(URL);page.wait_for_function('window.themeFixtureReady');card=page.locator('[data-card=weather-card]')
 page.evaluate("window.wc=records.find(r=>r.name==='weather-card').card;window.baseConfig={...wc._config};window.baseHass=wc.hass")
 for width in [320,390,1280]:
  page.set_viewport_size({'width':width,'height':1400})
  for material,dark in [(False,False),(False,True),(True,False),(True,True)]:
   tokens={'ha-card-border-radius':'12px','ha-card-border-width':'1px','ha-card-box-shadow':'none','primary-color':'#03a9f4','accent-color':'#a86ae0','ha-card-background':'var(--card-background-color)'}
   tokens.update({'primary-background-color':'#111','card-background-color':'#1c1c1c','primary-text-color':'#e1e1e1','secondary-text-color':'#aaa','secondary-background-color':'#282828','divider-color':'#424242'} if dark else {'primary-background-color':'#fafafa','card-background-color':'#fff','primary-text-color':'#212121','secondary-text-color':'#666','secondary-background-color':'#f2f2f2','divider-color':'#ddd'})
   if material:tokens.update({k:v for k,v in THEME.items() if k!='modes'});tokens.update(THEME['modes']['dark' if dark else 'light'])
   page.evaluate('''({tokens,dark})=>{for(const k of [...document.body.style])if(k.startsWith('--'))document.body.style.removeProperty(k);for(const[k,v]of Object.entries(tokens))document.body.style.setProperty('--'+k,v);document.body.style.colorScheme=dark?'dark':'light';wc.hass={...baseHass,themes:{darkMode:dark}}}''',{'tokens':{k:str(v) for k,v in tokens.items()},'dark':dark})
   mode=('material' if material else 'ha')+('-dark' if dark else '-light')
   for condition,pair in PALETTE.items():
    page.evaluate('''condition=>{wc.setConfig(baseConfig);wc.hass={...wc.hass,states:{...wc.hass.states,'weather.home':{...wc.hass.states['weather.home'],state:condition}}}}''',condition)
    card.scroll_into_view_if_needed();page.wait_for_timeout(50)
    m=card.evaluate('''c=>{const r=c.shadowRoot,s=e=>getComputedStyle(e),base=s(r.querySelector('ha-card')),bg=base.backgroundColor==='rgba(0, 0, 0, 0)'?s(c).getPropertyValue('--card-background-color').trim():base.backgroundColor,secondary=s(c).getPropertyValue('--secondary-text-color').trim(),content=r.querySelector('.content');return {kind:content.dataset.kind,iconTone:s(content).getPropertyValue('--weather-icon-tone').trim(),icons:[...r.querySelectorAll('.ui-metric-icon')].map(e=>({color:s(e).color,hidden:e.getAttribute('aria-hidden')})),metrics:[...r.querySelectorAll('[data-ui-metric]')].map(e=>({image:s(e).backgroundImage,bg:s(e).backgroundColor,label:e.querySelector('.ui-metric-title').textContent.trim(),value:e.querySelector('.ui-metric-value').textContent.trim()})),text:[...r.querySelectorAll('.rain-chance,.ui-metric-title,.ui-metric-unit,.primary-label,.forecast-list time')].filter(e=>e.getClientRects().length).map(e=>({role:e.className||e.tagName,color:s(e).color,bg:e.closest('[data-ui-metric]')?s(e.closest('[data-ui-metric]')).backgroundColor:bg,text:e.textContent.trim()})),filter:s(r.querySelector('.art svg')).filter,corona:r.querySelectorAll('.wx-corona').length,backgroundOpacity:s(r.querySelector('.scene-background')).opacity,overflow:content.scrollWidth>content.clientWidth+1,cardWidth:c.getBoundingClientRect().width,cardHeight:c.getBoundingClientRect().height}}''')
    expected=rgb(pair[dark]);assert m['iconTone']==pair[dark],m
    assert all(i['color']==expected and i['hidden']=='true' for i in m['icons']),m
    assert all(t['color']!=expected for t in m['text']),m
    assert all(i['label'] and i['value'] and i['image']=='none' for i in m['metrics']),m
    for t in m['text']:
     backgrounds=[t['bg']]
     # Optional Material card gradient ends at base mixed with black 2%.
     # Bound foreground contrast at both endpoints instead of treating its
     # transparent backgroundColor as an opaque black surface.
     if material and t['bg'].startswith('#'):
      backgrounds.append('rgb('+', '.join(str(int(t['bg'][i:i+2],16)*.98) for i in (1,3,5))+')')
     t['contrastBackgrounds']=backgrounds
     t['contrast']=min(contrast(t['color'],bg) for bg in backgrounds);assert t['contrast']>=4.5,t
    assert m['filter']=='none' and m['corona']==0 and m['backgroundOpacity']=='0' and not m['overflow'],m
    # CSS accent change must affect selection, not weather semantic glyphs or text.
    page.evaluate("document.body.style.setProperty('--accent-color','#006f65')")
    assert card.locator('.ui-metric-icon').first.evaluate('e=>getComputedStyle(e).color')==expected
    page.evaluate("document.body.style.setProperty('--accent-color','#a86ae0')")
    if condition=='partlycloudy' or width==390:
     card.screenshot(path=str(OUT/f'{condition}-{mode}-{width}.png'))
    if condition=='partlycloudy':page.screenshot(path=str(OUT/f'dashboard-{mode}-{width}.png'))
    results.append({'width':width,'mode':mode,'condition':condition,**m})
   # Alternative icon families still render their own paint and no new overall shadow.
   for style in ['glass','neon']:
    page.evaluate('''style=>wc.setConfig({...baseConfig,icon_style:style})''',style)
    assert card.locator('.art svg').count()==1
    assert card.locator('.art svg').evaluate('e=>getComputedStyle(e).filter')=='none'
    alternatives.append({'width':width,'mode':mode,'style':style,'rendered':True})
 assert not errors,errors
 summary={'cases':len(results),'alternativeCases':len(alternatives),'errors':errors,'minimumTextContrast':min(t['contrast'] for m in results for t in m['text']),'actualServedAggregate':True,'injectedStandalone':False}
 (OUT/'palette-results.json').write_text(json.dumps({'summary':summary,'cases':results,'alternatives':alternatives,'url':URL},indent=2));print(json.dumps(summary));b.close()
