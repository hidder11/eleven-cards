"""Weather glow regression against the actual composed review, no injection."""
import json, yaml
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-evidence/weather-glow';OUT.mkdir(exist_ok=True)
TOKEN=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text())['token']
URL=f'http://127.0.0.1:56515/{TOKEN}/cards/review/'
THEME=yaml.safe_load((ROOT/'themes/eleven_material.yaml').read_text())['Eleven Material']
results=[];errors=[]
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
   for compact,condition in [(False,'partlycloudy'),(True,'partlycloudy'),(False,'sunny')]:
    page.evaluate('''({compact,condition})=>{wc.setConfig({...baseConfig,compact});wc.hass={...wc.hass,states:{...wc.hass.states,'weather.home':{...wc.hass.states['weather.home'],state:condition}}}}''',{'compact':compact,'condition':condition})
    card.scroll_into_view_if_needed();page.wait_for_timeout(80)
    m=card.evaluate('''c=>{const r=c.shadowRoot,s=r.querySelector('.art svg'),b=c.getBoundingClientRect();return {metricBackgrounds:[...r.querySelectorAll('[data-ui-metric]')].map(e=>({image:getComputedStyle(e).backgroundImage,color:getComputedStyle(e).backgroundColor,icon:getComputedStyle(e.querySelector('.ui-metric-icon')).color})),secondary:getComputedStyle(c).getPropertyValue('--secondary-background-color').trim(),filter:getComputedStyle(s).filter,corona:r.querySelectorAll('.wx-corona').length,rays:getComputedStyle(s.querySelector('.wx-rays')).stroke,sunStops:[...s.querySelectorAll('linearGradient[id$="-sun"] stop')].map(e=>e.getAttribute('stop-color')),backgroundOpacity:getComputedStyle(r.querySelector('.scene-background')).opacity,cardWidth:b.width,cardHeight:b.height,overflow:r.querySelector('.content').scrollWidth>r.querySelector('.content').clientWidth+1,surface:getComputedStyle(r.querySelector('ha-card')).background}}''')
    assert m['filter']=='none' and m['corona']==0 and m['backgroundOpacity']=='0' and not m['overflow'],m
    assert all(v['image']=='none' for v in m['metricBackgrounds']),m
    expected_icon='rgb(255, 212, 92)' if dark else 'rgb(243, 181, 27)'
    assert all(v['icon']==expected_icon for v in m['metricBackgrounds']),m
    assert m['rays']=='rgb(248, 205, 112)' and m['sunStops']==['#fff0b4','#f6ce6d','#eda743'],m
    name=f'{condition}-{"compact" if compact else "normal"}-{mode}-{width}'
    card.screenshot(path=str(OUT/(name+'.png')))
    if not compact and condition=='partlycloudy':page.screenshot(path=str(OUT/(f'dashboard-{mode}-{width}.png')))
    results.append({'width':width,'mode':mode,'compact':compact,'condition':condition,**m})
 assert not errors,errors
 (OUT/'glow-results.json').write_text(json.dumps({'cases':results,'errors':errors,'actualServedAggregate':True,'injectedStandalone':False},indent=2))
 print(json.dumps({'cases':len(results),'errors':errors,'allFiltersNone':all(r['filter']=='none' for r in results),'sunColorsPreserved':True,'actualServedAggregate':True}));b.close()
