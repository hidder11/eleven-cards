"""Focused real-review Timeline standalone spacing regression; synthetic data, no HA."""
import argparse, json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'qa-evidence/timeline-spacing'
OUT.mkdir(parents=True, exist_ok=True)
args = argparse.ArgumentParser()
args.add_argument('--before', action='store_true')
args.add_argument('--served', action='store_true')
a = args.parse_args()
phase = 'before' if a.before else 'after'
URL = 'http://127.0.0.1:56515/JC5klAkxdKA9PmJO7YSGqy76RQb7-mo6C0aJPXHgbsI/cards/review/'
MEASURE = """c=>{const r=c.shadowRoot,q=s=>r.querySelector(s),rect=e=>{if(!e)return null;const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}},ink=e=>{const range=document.createRange();range.selectNodeContents(e);return rect(range)},gap=(a,b)=>a&&b?b.y-a.bottom:null;const header=rect(q('.card-header')),well=rect(q('.timeline-well')),chart=rect(q('.chart')),axis=rect(q('.axis')),legend=rect(q('.legend'));const rows=[...r.querySelectorAll('.row')].map(e=>{const label=e.querySelector('.row-label'),track=e.querySelector('.track');return {row:rect(e),label:rect(label),ink:label&&ink(label),track:rect(track),background:label&&getComputedStyle(label).backgroundColor,backgroundImage:label&&getComputedStyle(label).backgroundImage,nameToTrack:gap(label&&ink(label),rect(track))}});return {card:rect(q('ha-card')),header,well,chart,axis,legend,headerToWell:gap(header,well),chartToAxis:gap(chart,axis),wellToLegend:gap(well,legend),rows,rowGaps:rows.slice(1).map((v,i)=>v.row.y-rows[i].row.bottom),ticks:[...r.querySelectorAll('.axis span')].filter(e=>e.checkVisibility()).map(e=>({text:e.textContent,...rect(e)})),captions:[...r.querySelectorAll('.segment span')].map(e=>({text:e.textContent,hidden:e.hidden,displayed:e.checkVisibility(),width:ink(e).w,available:e.parentElement.clientWidth})),scroll:q('ha-card').scrollWidth,client:q('ha-card').clientWidth,config:{bar_height:c._config.bar_height,row_gap:c._config.row_gap},actions:[...r.querySelectorAll('.card-header [data-ui-button],.card-header summary')].filter(e=>e.checkVisibility()).map(rect)}}"""

def check(m):
    assert m['scroll'] <= m['client'] + 1, ('overflow', m)
    assert m['header']['h'] <= 100, ('primary toolbar changed', m)
    assert abs(m['headerToWell']-12) <= 1, ('header/well rhythm', m)
    assert abs(m['chartToAxis']-10) <= 1, ('axis gap', m)
    assert abs(m['wellToLegend']-12) <= 1, ('legend gap', m)
    for row in m['rows']:
        assert row['background'] == 'rgba(0, 0, 0, 0)' and row['backgroundImage'] == 'none', ('painted label', row)
        assert row['label']['h'] >= 24 and row['label']['w'] >= 44, ('label target', row)
        assert row['nameToTrack'] <= 10, ('dead name/track whitespace', row)
        assert abs(row['track']['h'] - m['config']['bar_height']) <= 1
        assert abs(row['track']['x'] - m['axis']['x']) <= 1
    assert all(abs(g-m['config']['row_gap']) <= 1 for g in m['rowGaps']), ('row gap meaning changed', m)
    assert all(x['right']+7 <= y['x'] for x,y in zip(m['ticks'],m['ticks'][1:])), ('axis overlap', m)
    assert all(x['w'] >= 44 and x['h'] >= 44 for x in m['actions'])
    assert all(not x['displayed'] if x['hidden'] else x['width']+12 <= x['available']+1 for x in m['captions']), ('partial caption or hidden paint', m)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome', args=['--no-sandbox'])
    page = b.new_page(viewport={'width':390,'height':1200}, reduced_motion='reduce')
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    # Register the exact standalone artifact first; guarded collection definitions cannot replace it.
    if not a.served: page.add_init_script(path=str(OUT/'before-standalone.js' if a.before and (OUT/'before-standalone.js').exists() else ROOT/'cards/timeline-card/dist/eleven-timeline-card.js'))
    page.goto(URL)
    page.wait_for_function('window.themeFixtureReady&&records[2].card._status==="ready"')
    card = page.locator('[data-card=timeline-card]')
    material_tokens = {}
    for dark in [False, True]:
        if dark: page.locator('#mode').click()
        material_tokens[dark] = page.evaluate('Object.fromEntries([...document.body.style].filter(k=>k.startsWith("--")).map(k=>[k.slice(2),document.body.style.getPropertyValue(k)]))')
    def paint(material,dark):
        page.evaluate('''({material,dark})=>{for(const k of [...document.body.style])if(k.startsWith('--'))document.body.style.removeProperty(k);const tokens={'ha-card-border-radius':'12px','ha-card-border-width':'1px','ha-card-box-shadow':'none','primary-color':'#03a9f4','accent-color':'#a86ae0','ha-card-background':'var(--card-background-color)',...(dark?{'primary-background-color':'#111111','card-background-color':'#1c1c1c','primary-text-color':'#e1e1e1','secondary-text-color':'#9b9b9b','secondary-background-color':'#282828','divider-color':'#424242'}:{'primary-background-color':'#fafafa','card-background-color':'#ffffff','primary-text-color':'#212121','secondary-text-color':'#727272','secondary-background-color':'#f2f2f2','divider-color':'#e0e0e0'})};if(material)Object.assign(tokens,material);for(const[k,v]of Object.entries(tokens))document.body.style.setProperty('--'+k,v);document.body.style.colorScheme=dark?'dark':'light';const c=records[2].card;c.hass={...c.hass,themes:{darkMode:dark}}}''', {'material':material_tokens[dark] if material else None,'dark':dark})
        page.wait_for_timeout(150)
    matrix=[]
    for width in [320,390,1280]:
        page.set_viewport_size({'width':width,'height':1200})
        for material,dark in [(False,False),(False,True),(True,False),(True,True)]:
            paint(material,dark)
            card.scroll_into_view_if_needed()
            m=card.evaluate(MEASURE)
            m.update(viewport=width,material=material,dark=dark)
            card.screenshot(path=str(OUT/f'{phase}-{"material" if material else "ha"}-{width}-{"dark" if dark else "light"}.png'))
            matrix.append(m)
            if not a.before: check(m)
    (OUT/f'{phase}-geometry.json').write_text(json.dumps(matrix,indent=2))
    # Optional state labels on genuinely short and long intervals; same data both phases.
    page.set_viewport_size({'width':390,'height':1200});paint(True,False)
    card.evaluate('''c=>{window.captionConfig=structuredClone(c._config);window.captionSeries=structuredClone(c._series);c._config.show_state_labels=true;const a=c._start,d=c._end-a;c._series=[[{start:a,end:a+d*.04,state:'on'},{start:a+d*.04,end:a+d*.1,state:'off'},{start:a+d*.1,end:c._end,state:'on'}]];c._render()}''')
    caption_results=[]
    for width in [320,390,1280]:
        page.set_viewport_size({'width':width,'height':1200});page.wait_for_timeout(100)
        m=card.evaluate(MEASURE);caption_results.append(m)
        card.screenshot(path=str(OUT/f'{phase}-captions-{width}.png'))
        if not a.before:
            check(m)
            assert any(x['hidden'] for x in m['captions']) and any(not x['hidden'] for x in m['captions'])
    (OUT/f'{phase}-captions.json').write_text(json.dumps(caption_results,indent=2))
    card.evaluate('c=>{c._config=captionConfig;c._series=captionSeries;c._render()}')
    if not a.before:
        # Multiple realistic rows, kept independent of shared fixtures and test files.
        page.set_viewport_size({'width':390,'height':1200});paint(True,False)
        card.evaluate('''c=>{window.savedConfig=structuredClone(c._config);window.savedSeries=structuredClone(c._series);c._config={...c._config,entities:['switch.heating','switch.secondary'],series_options:[{entity:'switch.heating',name:'Verwarming'},{entity:'switch.secondary',name:'Slaapkamer'}]};c._series=[c._series[0],c._series[0]];c._render()}''')
        multi=card.evaluate(MEASURE);check(multi)
        card.screenshot(path=str(OUT/'after-multiple-rows.png'))
        card.locator('.row-label').first.focus();page.keyboard.press('Shift+Enter')
        assert card.locator('.row').count()==1, 'name isolate interaction'
        card.evaluate('c=>{c._visibility=new Map();c._render()}')
        # Segment hit testing stays independent from the name target.
        segment=card.locator('.segment').first
        segment.focus();assert card.locator('.tooltip').is_visible()
        page.keyboard.press('Escape');assert not card.locator('.tooltip').is_visible()
        segment.click();assert card.locator('.tooltip').is_visible()
        page.keyboard.press('Escape')
        card.locator('.row-label').first.dblclick();page.wait_for_function('()=>records[2].card.shadowRoot.querySelectorAll(".row").length===1')
        card.evaluate('c=>{c._visibility=new Map();c._render()}')
        # Preserve configurable spacing/height rather than hard-coding compact defaults.
        card.evaluate('c=>{c._config.row_gap=23;c._config.bar_height=36;c._render()}')
        check(card.evaluate(MEASURE))
        card.evaluate('''c=>{c._config.series_options[0].name='Verwarming woonkamer keuken en alle bijgebouwen met een extra lange naam';c._render()}''')
        assert card.evaluate('c=>{const r=c.shadowRoot.querySelector(".row-label");return r.scrollWidth<=r.clientWidth+1}')
        card.screenshot(path=str(OUT/'after-long-name.png'))
        # Enlarged row text remains contained and expands the actual name target.
        card.evaluate('''c=>{const style=document.createElement('style');style.id='timeline-spacing-text';style.textContent='.row-label{font-size:24px}.axis,.legend{font-size:22px}';c.shadowRoot.append(style);c._layoutTimeline()}''')
        page.wait_for_timeout(100)
        enlarged=card.evaluate(MEASURE)
        assert enlarged['scroll']<=enlarged['client']+1
        assert all(r['ink']['h']<=r['label']['h'] for r in enlarged['rows'])
        card.screenshot(path=str(OUT/'after-enlarged-text.png'))
        card.evaluate('c=>{c.shadowRoot.querySelector("#timeline-spacing-text").remove();c._render()}')
        # Resize must re-evaluate full-label fit even when axis is disabled.
        card.evaluate('''c=>{c._config.show_axis=false;c._config.show_labels=false;c._config.show_summary=true;c._config.show_state_labels=true;c._series=[[{start:c._start,end:c._start+(c._end-c._start)*.28,state:'Warming up'},{start:c._start+(c._end-c._start)*.28,end:c._end,state:'on'}],[]];c._render()}''')
        page.set_viewport_size({'width':390,'height':1200});page.wait_for_timeout(100)
        assert card.locator('.segment span').first.is_visible(), 'caption should fit wider track'
        page.set_viewport_size({'width':320,'height':1200});page.wait_for_timeout(100)
        assert not card.locator('.segment span').first.is_visible(), 'caption fit must update with no axis'
        m=card.evaluate(MEASURE)
        assert all(not x['displayed'] if x['hidden'] else x['width']+12<=x['available']+1 for x in m['captions'])
        card.evaluate('c=>{c._config=savedConfig;c._series=savedSeries;c._visibility=new Map();c._render()}')
        card.locator('.chart-tools summary').click();card.locator('[data-zoom=in]').click();assert card.evaluate('c=>!!c._viewport')
        card.locator('[data-zoom=reset]').click();assert card.evaluate('c=>!c._viewport')
        page.keyboard.press('Escape')
        # Actual touch events retain tooltip pin and deferred-render semantics.
        card.evaluate('''c=>{const chart=c.shadowRoot.querySelector('.chart'),r=chart.getBoundingClientRect();chart.dispatchEvent(new PointerEvent('pointerdown',{pointerType:'touch',pointerId:71,clientX:r.x+r.width*.3,bubbles:true}));c._render();if(!c._touchRenderPending)throw Error('touch render not deferred');chart.dispatchEvent(new PointerEvent('pointermove',{pointerType:'touch',pointerId:71,clientX:r.x+r.width*.5,bubbles:true}));chart.dispatchEvent(new PointerEvent('pointerup',{pointerType:'touch',pointerId:71,clientX:r.x+r.width*.5,bubbles:true}));if(c._touchPointer!==null)throw Error('touch did not finish')}''')
        # Native Chromium touch stream, including an update during the gesture.
        card.scroll_into_view_if_needed()
        card.evaluate('c=>c._hideTooltip()')
        chart_box=card.locator('.track').first.bounding_box()
        client=page.context.new_cdp_session(page)
        client.send('Emulation.setTouchEmulationEnabled',{'enabled':True,'maxTouchPoints':1})
        x=chart_box['x']+chart_box['width']*.25;y=chart_box['y']+chart_box['height']/2
        client.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
        page.wait_for_function('()=>records[2].card._touchPointer!=null')
        card.evaluate('c=>c._render()')
        assert card.evaluate('c=>c._touchRenderPending')
        client.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+35,'y':y}]})
        page.wait_for_timeout(100)
        client.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        page.wait_for_function('()=>records[2].card._touchPointer==null')
        assert card.locator('.tooltip').is_visible()
        assert not card.evaluate('c=>c._touchRenderPending')
        (OUT/'interaction-results.json').write_text(json.dumps({'multipleRows':multi,'nameKeyboardAndPointer':True,'segmentTooltip':True,'customSpacing':True,'longNames':True,'enlargedText':enlarged,'noAxisResize':True,'toolsZoom':True,'touch':True,'nativeCDPTouch':True},indent=2))
    assert not errors, errors
    print(json.dumps({'phase':phase,'matrix':len(matrix),'errors':errors,'standalone':True}))
    b.close()
