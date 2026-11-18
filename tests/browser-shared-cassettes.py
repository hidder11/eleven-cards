"""Offline, red-first comparison of four ACTUAL built cassette consumers.

Dependencies: Python playwright + PyYAML; an existing Chromium. No installs/builds.
  CARD_QA_CHROMIUM=/path/to/chrome python tests/browser-shared-cassettes.py --expect-red
  CARD_QA_CHROMIUM=/path/to/chrome python tests/browser-shared-cassettes.py
BROWSER_EXECUTABLE is also honored; otherwise Playwright's installed browser is used.
Use --mode standalone|collection|both (default both). --expect-red is successful
ONLY when four populated real cards render without errors and all lack markers.
Default evidence is in ignored qa-evidence/shared-cassettes; SHARED_CASSETTES_OUT overrides it.
Synthetic native/Material Chromium QA is not HA/Safari acceptance or visual approval.
"""
import argparse
import functools
import hashlib
import http.server
import json
import os
from pathlib import Path
import struct
import threading
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT/'qa-evidence/shared-cassettes'
NAMES = ['material-house', 'scene-engine-card', 'dynamic-energy-price-card', 'appliance-planner']
FALLBACK = {'material-house': '.light-panel', 'scene-engine-card': '#details-slot>details',
            'dynamic-energy-price-card': 'details', 'appliance-planner': '#advice-details'}


def synthetic_assets():
    """Same generic silhouette/compositor contract as browser-all-cards-render.py."""
    width, height = 64, 48
    alpha = [float(12 <= x <= 52 and 18 <= y <= 40 or 8 <= y < 18 and abs(x-32) < (y-5)*2)
             for y in range(height) for x in range(width)]
    pack = lambda values: struct.pack('<'+'f'*len(values), *values)
    blobs = {'alpha.f32': pack(alpha), 'layer.f32': pack([v for a in alpha for v in [a*.15, a*.08, a*.03]])}
    phases = [('morning', .65), ('afternoon', 1), ('evening', .35), ('night', .12)]
    for phase, scale in phases:
        blobs[phase+'.f32'] = pack([v for a in alpha for v in [a*.35*scale, a*.18*scale, a*.09*scale]])
    manifest = {'schema': 1, 'dtype': 'float32-le', 'channels': 3, 'width': width, 'height': height,
                'release': 'synthetic-offline-v1', 'lights': [{'id': 'room', 'name': 'Example room', 'entity': 'light.living'}],
                'files': {name: {'sha256': hashlib.sha256(blob).hexdigest()} for name, blob in blobs.items()},
                'views': [{'id': view, 'name': view.title(), 'camera_location': view, 'alpha': 'alpha.f32',
                           'modes': {phase: {'base': phase+'.f32', 'layers': ['layer.f32']} for phase, _ in phases}}
                          for view in ['front', 'rear']]}
    blobs['manifest.json'] = json.dumps(manifest).encode()
    return blobs


def theme_tokens(theme, material, dark):
    tokens = {'ha-card-border-radius': '12px', 'ha-card-border-width': '1px', 'ha-card-box-shadow': 'none',
              'primary-color': '#03a9f4', 'accent-color': '#a668cc', 'error-color': '#db4437', 'warning-color': '#ffa600',
              'text-primary-color': '#fff', 'ha-card-background': 'var(--card-background-color)'}
    tokens.update(dict(zip(['primary-background-color', 'card-background-color', 'primary-text-color',
                           'secondary-text-color', 'secondary-background-color', 'divider-color'],
                          ['#111111', '#1c1c1c', '#e1e1e1', '#9b9b9b', '#282828', '#424242'] if dark else
                          ['#fafafa', '#ffffff', '#212121', '#727272', '#f2f2f2', '#e0e0e0'])))
    if material:
        tokens.update({key: value for key, value in theme.items() if key != 'modes'})
        tokens.update(theme['modes']['dark' if dark else 'light'])
    return {'tokens': {'--'+key: str(value) for key, value in tokens.items()}, 'dark': dark}


MEASURE = r'''() => records.map(({name,card})=>{
 const root=card.shadowRoot,d=root.querySelector('details[data-ui-cassette]');
 if(!d)return {name,missing:true};
 const s=d.querySelector(':scope>summary[data-ui-cassette-trigger]'),b=d.querySelector(':scope>[data-ui-cassette-body]');
 if(!s||!b)return {name,anatomy:false};
 const cs=getComputedStyle(s),bs=getComputedStyle(b),ds=getComputedStyle(d),sr=s.getBoundingClientRect(),br=b.getBoundingClientRect();
 const pseudo=['::after','::before'].map(p=>{const c=getComputedStyle(s,p);return {pseudo:p,content:c.content,width:c.width,height:c.height,transform:c.transform,borderRight:c.borderRightWidth,borderBottom:c.borderBottomWidth}}).find(p=>p.content!=='none'&&p.width==='8px'&&p.height==='8px');
 const reset=root.querySelector('#reset');let common=reset?.parentElement;
 while(common&&!common.contains(d))common=common.parentElement;
 const commonStyle=common?getComputedStyle(common):null;
 return {name,anatomy:s===d.firstElementChild&&b.parentElement===d,open:d.open,
  height:sr.height,width:sr.width,font:cs.fontSize,weight:cs.fontWeight,lineHeight:cs.lineHeight,padding:cs.padding,
  radii:[cs.borderTopLeftRadius,cs.borderTopRightRadius,cs.borderBottomRightRadius,cs.borderBottomLeftRadius],
  chevron:pseudo||null,transform:cs.transform,outline:cs.outlineStyle,outlineWidth:cs.outlineWidth,
  focusVisible:s.matches(':focus-visible'),background:cs.backgroundImage,color:cs.color,shadow:cs.boxShadow,
  bodyShadow:bs.boxShadow,bodyBackground:bs.backgroundColor,bodyImage:bs.backgroundImage,bodyRadii:[bs.borderTopLeftRadius,bs.borderTopRightRadius,bs.borderBottomRightRadius,bs.borderBottomLeftRadius],gap:br.top-sr.bottom,
  labelContained:(()=>{const range=document.createRange();range.selectNodeContents(s);return [...range.getClientRects()].every(r=>r.left>=sr.left-1&&r.right<=sr.right+1&&r.top>=sr.top-1&&r.bottom<=sr.bottom+1)})(),
  rootBackground:ds.backgroundColor,rootShadow:ds.boxShadow,
  overflow:card.getBoundingClientRect().width+1<root.querySelector('ha-card').scrollWidth,
  reset:reset?{outsideBody:!b.contains(reset),commonBackground:commonStyle?.backgroundColor,commonImage:commonStyle?.backgroundImage,commonShadow:commonStyle?.boxShadow,stacked:common?.classList.contains('stacked'),afterCassette:reset.getBoundingClientRect().top>=d.getBoundingClientRect().bottom-1}:null};
})'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--expect-red', action='store_true')
    parser.add_argument('--mode', choices=['standalone', 'collection', 'both'], default='both')
    args = parser.parse_args()
    from playwright.sync_api import sync_playwright
    import yaml
    out = Path(os.environ.get('SHARED_CASSETTES_OUT', str(DEFAULT_OUT)))
    out.mkdir(parents=True, exist_ok=True)
    theme = yaml.safe_load((ROOT/'themes/eleven_material.yaml').read_text())['Eleven Material']
    blobs = synthetic_assets()

    class Handler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass
        def do_GET(self):
            path = urlsplit(self.path).path
            if path.startswith('/fixture/') and path[9:] in blobs:
                data = blobs[path[9:]]
                self.send_response(200)
                self.send_header('Content-Type', 'application/json' if path.endswith('.json') else 'application/octet-stream')
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            else:
                super().do_GET()

    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    report = {'checks': [], 'cases': [], 'baseline': [], 'errors': [], 'consoleErrors': [], 'externalRequests': [], 'screenshots': [],
              'expectedRed': args.expect_red, 'limitations': ['Synthetic Chromium, not installed HA, Safari or aesthetic acceptance.', 'No services are allowed, including synthetic service dispatch.'],
              'artifacts': {str(path.relative_to(ROOT)): hashlib.sha256(path.read_bytes()).hexdigest() for path in [ROOT/'dist/eleven-cards.js', ROOT/'experiments/material-house/dist/material-house.js', ROOT/'cards/scene-engine-card/dist/eleven-scene-engine-card.js', ROOT/'cards/appliance-planner/dist/eleven-appliance-planner.js', ROOT/'cards/dynamic-energy-price-card/dist/eleven-dynamic-energy-price-card.js']}}

    def check(name, passed, data=None):
        report['checks'].append({'name': name, 'passed': bool(passed), 'data': data})

    def settle(page):
        page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')

    def crops(page, prefix):
        prefix=('red-' if args.expect_red else 'results-')+prefix
        for name in NAMES:
            path = out/f'{prefix}-{name}.png'
            page.locator('[data-card="'+name+'"]').screenshot(path=str(path))
            report['screenshots'].append(path.name)

    try:
        with sync_playwright() as pw:
            executable = os.environ.get('CARD_QA_CHROMIUM') or os.environ.get('BROWSER_EXECUTABLE')
            browser = pw.chromium.launch(executable_path=executable, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
            report['browser'] = browser.version
            for mode in (['standalone', 'collection'] if args.mode == 'both' else [args.mode]):
                context = browser.new_context(viewport={'width': 390, 'height': 900}, locale='nl-NL', timezone_id='Europe/Amsterdam', reduced_motion='reduce', service_workers='block')
                page = context.new_page()
                page.on('pageerror', lambda e: report['errors'].append(str(e)))
                page.on('console', lambda msg: report['consoleErrors'].append(msg.text) if msg.type == 'error' else None)

                def route(request_route):
                    url = urlsplit(request_route.request.url)
                    if url.hostname != '127.0.0.1' or url.port != server.server_port:
                        report['externalRequests'].append(request_route.request.url)
                        request_route.abort('blockedbyclient')
                    else:
                        request_route.continue_()

                context.route('**/*', route)
                page.goto(f'http://127.0.0.1:{server.server_port}/tests/fixtures/shared-cassettes.html?mode={mode}')
                page.wait_for_function('window.sharedCassetteFixtureReady===true', timeout=15000)
                page.wait_for_function("records.every(r=>r.card.shadowRoot?.querySelector('ha-card'))&&!!records[0].card.loaded&&!records[0].card.modeLoad&&!!records[3].card.result&&!records[3].card.loading", timeout=15000)
                page.evaluate('applyTheme', theme_tokens(theme, False, False))
                settle(page)
                baseline = page.evaluate('''()=>records.map(({name,card})=>({name,constructor:card.constructor.name,text:card.shadowRoot.querySelector('ha-card').innerText,markers:card.shadowRoot.querySelectorAll('details[data-ui-cassette]').length,details:card.shadowRoot.querySelectorAll('details').length,canvasPainted:[...card.shadowRoot.querySelectorAll('canvas')].some(c=>c.width&&c.height&&c.getContext('2d')?.getImageData(0,0,c.width,c.height).data.some(v=>v>0))}))''')
                report['baseline'].append({'mode': mode, 'cards': baseline})
                check(mode+' four real cards', [r['name'] for r in baseline] == NAMES and all(r['details'] for r in baseline), baseline)
                check(mode+' representative data populated', all(text in row['text'] for row,text in zip(baseline,['Synthetic home','Avond','Energieprijzen','Wasmachine'])), baseline)
                check(mode+' actual house compositor', baseline[0]['canvasPainted'])
                crops(page, mode+'-baseline')
                # Open the real pre-migration disclosures too: no fake cassette DOM.
                for name in NAMES:
                    details=page.locator('[data-card="'+name+'"] '+FALLBACK[name]).first
                    if not details.evaluate('d=>d.open'):
                        details.locator(':scope>summary').click()
                settle(page)
                house_controls=page.locator('[data-card="material-house"] .controls button').evaluate_all('''buttons=>buttons.map(b=>({name:b.getAttribute('aria-label'),entity:b.dataset.entity,pressed:b.getAttribute('aria-pressed'),disabled:b.disabled,visible:b.getBoundingClientRect().height>0}))''')
                check(mode+' actual loaded manifest light controls', len(house_controls)==1 and house_controls[0]['entity']=='light.living' and house_controls[0]['pressed']=='true' and not house_controls[0]['disabled'] and house_controls[0]['visible'], house_controls)
                crops(page, mode+'-baseline-expanded')
                check(mode+' baseline zero services', page.evaluate('demoServices.length')==0)
                if args.expect_red:
                    check(mode+' expected RED: all four shared markers absent', all(r['markers'] == 0 for r in baseline), baseline)
                    context.close()
                    continue
                check(mode+' all four adopt shared anatomy', all(r['markers'] >= 1 for r in baseline), baseline)
                if not all(r['markers'] >= 1 for r in baseline):
                    context.close()
                    continue
                for width in [320, 390, 500]:
                    page.set_viewport_size({'width': width, 'height': 900})
                    for material, dark in [(False, False), (False, True), (True, False), (True, True)]:
                        label=f'{mode}-{width}-'+('material' if material else 'native')+('-dark' if dark else '-light')
                        page.evaluate('applyTheme', theme_tokens(theme, material, dark))
                        for opened in [False, True]:
                            page.evaluate('opened=>records.forEach(r=>r.card.shadowRoot.querySelectorAll("details[data-ui-cassette]").forEach(d=>d.open=opened))', opened)
                            settle(page)
                            rows = page.evaluate(MEASURE)
                            report['cases'].append({'label': label, 'open': opened, 'cards': rows})
                            for row in rows:
                                ident=label+('-open-' if opened else '-closed-')+row['name']
                                check(ident+' anatomy', row.get('anatomy'), row)
                                if not row.get('anatomy'):
                                    continue
                                check(ident+' grip geometry', abs(row['height']-44)<=1 and row['padding']=='10px 12px' and row['font']=='13px' and row['weight']=='500' and abs(float(row['lineHeight'].removesuffix('px'))-18.2)<.1, row)
                                check(ident+' chevron CSS 8px', row['chevron'] is not None, row['chevron'])
                                check(ident+' no overflow', not row['overflow'], row)
                                check(ident+' wrapper unpainted', row['rootBackground']=='rgba(0, 0, 0, 0)' and row['rootShadow']=='none', row)
                                check(ident+' radii', all(float(v.removesuffix('px'))>0 for v in row['radii'][:2]) and (row['radii'][2:]==['0px','0px'] if opened else row['radii'][2:]==row['radii'][:2][::-1]), row['radii'])
                                if opened:
                                    check(ident+' attached body', abs(row['gap'])<=1, row)
                                    check(ident+' theme body depth', (row['bodyShadow']!='none')==material, row)
                                    check(ident+' tray has only lower rounded corners', row['bodyRadii'][:2]==['0px','0px'] and all(float(v.removesuffix('px'))>0 for v in row['bodyRadii'][2:]), row['bodyRadii'])
                                if row['reset']:
                                    reset=row['reset']
                                    check(ident+' Reset outside painted tray', reset['outsideBody'] and reset['commonBackground']=='rgba(0, 0, 0, 0)' and reset['commonImage']=='none' and reset['commonShadow']=='none', reset)
                            if all(r.get('anatomy') for r in rows):
                                keys=['font','weight','padding','radii','lineHeight','background','shadow','bodyShadow']
                                check(label+str(opened)+' four grips share computed recipe', all(all(r[k]==rows[0][k] for k in keys) for r in rows), rows)
                            if width == 390 and material:
                                crops(page, label+('-open' if opened else '-closed'))
                        # Native keyboard, not dispatchEvent or direct open mutation.
                        for name in NAMES:
                            details=page.locator('[data-card="'+name+'"] details[data-ui-cassette]').first
                            summary=details.locator(':scope>summary')
                            details.evaluate('d=>d.open=false')
                            summary.focus()
                            summary.press('Enter')
                            check(label+name+' Enter opens', details.evaluate('d=>d.open'))
                            check(label+name+' keyboard focus outline', summary.evaluate('s=>s.matches(":focus-visible")&&getComputedStyle(s).outlineStyle!=="none"&&parseFloat(getComputedStyle(s).outlineWidth)>0'))
                            summary.press('Space')
                            check(label+name+' Space closes', not details.evaluate('d=>d.open'))
                            # Clicking an ALREADY keyboard-focused summary may keep
                            # Chromium's native :focus-visible heuristic. Establish
                            # genuine pointer modality on a separate non-control first.
                            page.locator('h1').click()
                            summary.click()
                            check(label+name+' pointer has no keyboard outline', summary.evaluate('s=>!s.matches(":focus-visible")||getComputedStyle(s).outlineStyle==="none"'))
                            before=summary.bounding_box()
                            summary.hover()
                            box=summary.bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2)
                            page.mouse.down();settle(page)
                            pressed=summary.bounding_box()
                            page.mouse.up()
                            check(label+name+' press keeps grip in place', abs(before['y']-pressed['y'])<1 and abs(before['x']-pressed['x'])<1, {'before':before,'pressed':pressed})
                # Nested Scene disclosure + focused refresh, document and nested scroller.
                scene=page.locator('[data-card="scene-engine-card"]')
                for nested in [False, True]:
                    page.evaluate('''nested=>{const r=records[1],article=r.card.parentElement;article.style.cssText=nested?'height:420px;overflow:auto':'';window.reader=nested?article:document.scrollingElement;r.card.shadowRoot.querySelectorAll('details[data-ui-cassette]').forEach(d=>d.open=true)}''', nested)
                    technical=scene.locator('.technical>summary')
                    check(mode+' nested Scene adopts shared anatomy', technical.evaluate('s=>s.matches("[data-ui-cassette-trigger]")&&s.parentElement.matches("[data-ui-cassette]")'))
                    technical.focus()
                    technical.press('Space')
                    check(mode+' nested keyboard closes', technical.evaluate('s=>!s.parentElement.open'))
                    technical.press('Enter')
                    check(mode+' nested keyboard opens', technical.evaluate('s=>s.parentElement.open'))
                    page.evaluate('''()=>{const s=records[1].card.shadowRoot.querySelector('.technical>summary');reader.scrollTop+=120;s.focus({preventScroll:true})}''')
                    settle(page)
                    before=page.evaluate('reader.scrollTop')
                    for i in range(3):
                        page.evaluate('telemetry()');settle(page)
                        state=page.evaluate('''()=>({scroll:reader.scrollTop,focused:records[1].card.shadowRoot.activeElement===records[1].card.shadowRoot.querySelector('.technical>summary'),opens:records.map(r=>[...r.card.shadowRoot.querySelectorAll('details[data-ui-cassette]')].map(d=>d.open))})''')
                        check(f'{mode} refresh nested={nested} update={i} focus/open/scroll', abs(state['scroll']-before)<=1 and state['focused'] and all(state['opens'][1]), state)
                    page.evaluate("records[1].card.parentElement.style.cssText=''")
                # All consumer summaries retain focus + open state on normal telemetry.
                for name in NAMES:
                    summary=page.locator('[data-card="'+name+'"] details[data-ui-cassette]>summary').first
                    summary.click();summary.evaluate('s=>s.parentElement.open=true');summary.focus()
                    settle(page)
                    before=page.evaluate('document.scrollingElement.scrollTop')
                    page.evaluate('telemetry()');settle(page)
                    result=page.locator('[data-card="'+name+'"] details[data-ui-cassette]>summary').first.evaluate('s=>({open:s.parentElement.open,focused:s.getRootNode().activeElement===s,scroll:document.scrollingElement.scrollTop})')
                    check(mode+name+' telemetry retains focus/open/scroll', result['open'] and result['focused'] and abs(result['scroll']-before)<=1, result)
                # Worst-case labels and exactly 200% text. No recursive font growth.
                page.set_viewport_size({'width':320,'height':1000})
                page.evaluate('longLabels()')
                scaling=page.evaluate('enlargeText()');settle(page)
                check(mode+' 200% snapshot scaling', bool(scaling) and all(abs(s['after']-s['before']*2)<.1 for s in scaling), scaling)
                for opened in [False, True]:
                    page.evaluate('o=>records.forEach(r=>r.card.shadowRoot.querySelectorAll("details[data-ui-cassette]").forEach(d=>d.open=o))', opened)
                    settle(page)
                    stress=page.evaluate(MEASURE)
                    check(mode+f' long labels 200% open={opened} no overflow', all(not r['overflow'] for r in stress), stress)
                    check(mode+f' long labels 200% open={opened} contained', all(r['labelContained'] and r['height']>=44 for r in stress), stress)
                    if opened:
                        check(mode+' long labels 200% all bodies remain attached', all(abs(r['gap'])<=1 for r in stress), stress)
                    reset=next(r['reset'] for r in stress if r['name']=='scene-engine-card')
                    check(mode+f' long labels 200% open={opened} Reset stacks below complete cassette', reset['stacked'] and reset['afterCassette'] and reset['outsideBody'], reset)
                    crops(page, mode+f'-320-long-200pct-open-{opened}')
                # Preserve House's existing accent_color-derived accessible focus.
                page.evaluate("()=>{const r=records[0];r.card.setConfig({...r.card.config,accent_color:'#c04090'});r.card.hass=r.hass}")
                page.wait_for_function("!!records[0].card.loaded&&!records[0].card.modeLoad&&!records[0].card.shadowRoot.querySelector('.light-panel').hidden", timeout=15000)
                page.keyboard.press('Tab')
                house_summary=page.locator('[data-card="material-house"] [data-ui-cassette-trigger]').first
                house_summary.focus();house_summary.press('Enter');settle(page)
                focus=house_summary.evaluate('''s=>{const cs=getComputedStyle(s),probe=document.createElement('span');probe.style.color=cs.getPropertyValue('--house-focus').trim();s.getRootNode().append(probe);const expected=getComputedStyle(probe).color;probe.remove();return {visible:s.matches(':focus-visible'),outline:cs.outlineColor,expected}}''')
                check(mode+' House retains configured accessible focus color', focus['visible'] and focus['outline']==focus['expected'], focus)
                check(mode+' zero services', page.evaluate('demoServices.length')==0)
                context.close()
            browser.close()
    except Exception as error:
        report['errors'].append(type(error).__name__+': '+str(error))
    finally:
        server.shutdown()
        check('zero page/runtime errors', not report['errors'], report['errors'])
        check('zero console errors', not report['consoleErrors'], report['consoleErrors'])
        check('zero external requests', not report['externalRequests'], report['externalRequests'])
        report['counts']={key:len(report[key]) for key in ['checks','cases','baseline','errors','consoleErrors','externalRequests','screenshots']}
        report['failed']=[r for r in report['checks'] if not r['passed']]
        report['passed']=not report['failed']
        suffix='red' if args.expect_red else 'results'
        (out/f'{suffix}.json').write_text(json.dumps(report, indent=2))
        # Four readable native-card crops per case, no composited imitation UI.
        figures=''.join(f'<figure><figcaption>{name}</figcaption><img loading="lazy" src="{name}"></figure>' for name in report['screenshots'])
        (out/f'{suffix}-contact-sheet.html').write_text('<!doctype html><meta charset="utf-8"><title>Real cassette evidence</title><style>body{font:14px system-ui;background:#eee}main{display:grid;grid-template-columns:repeat(4,minmax(260px,1fr));gap:16px}figure{margin:0;background:white;padding:8px}img{width:100%;height:auto}figcaption{overflow-wrap:anywhere;margin-bottom:8px}</style><main>'+figures+'</main>')
        print(json.dumps({'passed':report['passed'],'expectedRed':args.expect_red,'counts':report['counts'],'failedNames':[r['name'] for r in report['failed']],'errors':report['errors'],'report':str(out/f'{suffix}.json')}))
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
