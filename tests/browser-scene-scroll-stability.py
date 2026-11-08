"""Offline regression: refreshing expanded Scene details must not scroll.

SCENE_SCROLL_MODE=source|standalone|collection (default collection).
Only synthetic HA data and loopback requests; no household services.
"""
import functools
import http.server
import json
import os
from pathlib import Path
import threading
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
MODE = os.environ.get('SCENE_SCROLL_MODE', 'collection')
assert MODE in ('source', 'standalone', 'collection')
OUT = Path(os.environ.get('SCENE_SCROLL_OUT', ROOT / 'qa-evidence/scene-scroll-stability' / MODE))
OUT.mkdir(parents=True, exist_ok=True)

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/cards/scene-engine-card/frontend/demo.html'
if MODE != 'source':
    url += '?bundle'
results, errors, external = [], [], []
with sync_playwright() as p:
    executable = os.environ.get('CARD_QA_CHROMIUM')
    browser = p.chromium.launch(executable_path=executable, args=['--no-sandbox', '--disable-dev-shm-usage'])
    for width in (390, 1100):
        for nested in (False, True):
            for technical in (False, True):
                page = browser.new_page(viewport={'width': width, 'height': 700})
                page.on('pageerror', lambda error: errors.append(str(error)))
                def intercept(route):
                    request = route.request
                    if urlparse(request.url).hostname != '127.0.0.1':
                        external.append(request.url)
                        route.abort()
                    elif MODE == 'collection' and urlparse(request.url).path.endswith('/dist/eleven-scene-engine-card.js'):
                        route.fulfill(path=str(ROOT/'dist/eleven-cards.js'), content_type='text/javascript')
                    else:
                        route.continue_()
                page.route('**/*', intercept)
                page.goto(url)
                page.wait_for_function('window.ready===true')
                page.evaluate('''() => {
                    const attrs=hass.states[card._config.entity].attributes;
                    attrs.requests=Array.from({length:40},(_,i)=>({identifier:'Request '+i,priority:i,scene:'scene.test',requires:'Sensor '+i}));
                    card.hass={...hass};
                }''')
                page.evaluate('''nested => {
                    const host=document.createElement('div');host.id='scroll-test-host';
                    if(nested)host.style.cssText='height:500px;overflow:auto;';
                    const before=document.createElement('div'),after=document.createElement('div');
                    before.style.height='1000px';after.style.height='2000px';
                    document.body.replaceChildren(host);host.append(before,card,after);
                    card.style.cssText='display:block;width:min(440px,100%);';
                    window.reader=nested?host:document.scrollingElement;
                }''', nested)
                card = page.locator('eleven-scene-engine-card')
                card.locator('#details-slot>details>summary').click()
                if technical:
                    card.locator('.technical>summary').click()
                selector = '.technical>summary' if technical else '#details-slot>details>summary'
                page.evaluate('''selector => {
                    const rect=card.shadowRoot.querySelector(selector).getBoundingClientRect();
                    const top=reader===document.scrollingElement?0:reader.getBoundingClientRect().top;
                    reader.scrollTop+=rect.top-top+200;
                }''', selector)
                page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
                before = page.evaluate('reader.scrollTop')
                if width == 390 and not nested and not technical:
                    page.screenshot(path=str(OUT/'before-refresh.png'))
                samples = []
                for update in range(3):
                    page.evaluate('''() => {
                        const state=hass.states[card._config.entity];
                        state.attributes={...state.attributes,revision:(state.attributes.revision||0)+1};
                        card.hass={...hass};
                    }''')
                    page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
                    samples.append(page.evaluate('''selector=>({
                        scroll:reader.scrollTop,
                        focused:card.shadowRoot.activeElement===card.shadowRoot.querySelector(selector),
                        open:card.shadowRoot.querySelector('#details-slot>details').open,
                        technicalOpen:card.shadowRoot.querySelector('.technical').open
                    })''', selector))
                if width == 390 and not nested and not technical:
                    page.screenshot(path=str(OUT/'after-refresh.png'))
                passed = all(abs(s['scroll']-before)<=1 and s['focused'] and s['open'] and (not technical or s['technicalOpen']) for s in samples)
                outside_focus = page.evaluate('''()=>{
                    const button=document.createElement('button');button.textContent='Other card';document.body.append(button);
                    button.focus({preventScroll:true});card.hass={...hass};return document.activeElement===button;
                }''')
                assert page.evaluate('calls.length') == 0, 'Scroll test must never call a service'
                results.append({'width':width,'nested':nested,'technical':technical,'before':before,'samples':samples,'outsideFocusPreserved':outside_focus,'passed':passed and outside_focus})
                page.close()
    browser.close()
server.shutdown()
(OUT/'results.json').write_text(json.dumps({'mode':MODE,'cases':results,'errors':errors,'externalRequests':external},indent=2))
print(json.dumps({'mode':MODE,'cases':len(results),'failed':[r for r in results if not r['passed']],'errors':errors,'externalRequests':external}))
assert not errors and not external and all(r['passed'] for r in results), 'Scene refresh moved scroll position or lost focus'
