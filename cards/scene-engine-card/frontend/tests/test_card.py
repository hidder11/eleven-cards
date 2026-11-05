"""Loopback-only browser QA; every HA state and service result is synthetic."""
import functools
import http.server
import json
import os
from pathlib import Path
import threading
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[4]
EVIDENCE = ROOT / 'qa-evidence/scene-request-overview' / ('behavior-bundle' if os.environ.get('SCENE_CARD_BUNDLE') else 'behavior')
EVIDENCE.mkdir(parents=True, exist_ok=True)
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
results = []
def passed(name):
    results.append(name)

def run():
    with sync_playwright() as p:
        import os
        executable = os.environ.get('CARD_QA_CHROMIUM')
        if not executable:
            candidates = sorted(Path('/opt/hermes/tools').glob('chromium-*/chrome-linux*/chrome'))
            executable = str(candidates[-1]) if candidates else None
        browser = p.chromium.launch(headless=True, executable_path=executable, args=['--no-sandbox','--disable-dev-shm-usage'])
        page = browser.new_page(viewport={'width':390,'height':844}, device_scale_factor=1)
        errors, external = [], []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('console', lambda message: errors.append('console: '+message.text) if message.type == 'error' else None)
        def route(req):
            if urlparse(req.request.url).hostname != '127.0.0.1':
                external.append(req.request.url)
                req.abort()
            else:
                req.continue_()
        page.route('**/*', route)
        page.goto(f'http://127.0.0.1:{server.server_port}/cards/scene-engine-card/frontend/demo.html' + ('?bundle' if os.environ.get('SCENE_CARD_BUNDLE') else ''))
        page.wait_for_function('window.ready === true')
        card = page.locator('eleven-scene-engine-card')
        reset = card.locator('#reset')
        confirm = card.locator('#confirm')
        dialog = card.locator('dialog')
        feedback = card.locator('#feedback')
        # Approved redesign replaces the old <=180px compressed text tile:
        # visible inset scene, source/priority, two counts and 44px footer controls.
        assert not card.locator('table').is_visible(), 'Request table is ONLY visible after opening Details'
        assert card.bounding_box()['height']<=280
        expect(card.locator('#details-slot>details')).not_to_have_attribute('open', '')
        passed('approved card retained with collapsed request details')
        compact_height = card.bounding_box()['height']
        card.screenshot(path=str(EVIDENCE/'compact-390-light.png'))
        expect(card.locator('.scene')).to_have_text('Filmavond')
        expect(card.locator('tbody tr').first.locator('.cell-value').nth(1)).to_have_text('80')
        expect(card.locator('tbody tr td:last-child .cell-value')).to_have_text(['Ja','Ja','Nee'])
        assert page.evaluate('calls.length') == 0
        passed('secondary scene, request memberships, priority and no automatic call')
        page.evaluate('''() => {const old=hass.states['eleven_scene_engine.woonkamer']; hass.states['scene_engine.woonkamer']={...old,entity_id:'scene_engine.woonkamer'}; card.setConfig({entity:'scene_engine.woonkamer',reset_entity:'button.eleven_scene_engine_woonkamer_reset'}); card.hass=hass;}''')
        expect(card.locator('.scene')).to_have_text('Filmavond')
        expect(reset).to_be_enabled()
        assert page.evaluate('calls.length') == 0
        passed('existing scene_engine domain supported without backend migration')
        page.evaluate('card.setConfig({entity:"eleven_scene_engine.woonkamer",reset_entity:"button.eleven_scene_engine_woonkamer_reset"}); load()')
        for scenario in ['missing','unknown','unavailable','offline']:
            page.evaluate('(s)=>load(s)',scenario)
            expect(reset).to_be_disabled()
            expect(card.locator('.scene')).to_have_count(0)
            if scenario == 'unknown':
                expect(feedback).to_contain_text('nog onbekend')
            elif scenario == 'unavailable':
                expect(feedback).to_contain_text('niet beschikbaar')
        page.evaluate('load(); delete hass.states["button.eleven_scene_engine_woonkamer_reset"]; card.hass=hass')
        expect(reset).to_be_disabled()
        page.evaluate('load(); hass.states["button.eleven_scene_engine_woonkamer_reset"].state="unavailable"; card.hass=hass')
        expect(reset).to_be_disabled()
        page.evaluate('load(); hass.services={}; card.hass=hass')
        expect(reset).to_be_disabled()
        page.evaluate('load(); hass.connection={connected:false}; card.hass=hass')
        expect(reset).to_be_disabled()
        passed('missing/unknown/unavailable/offline engine, missing/unavailable button and service unavailable')
        page.evaluate('load("empty")')
        expect(card.locator('.scene')).to_have_text('Geen actieve scene')
        expect(card.locator('tbody tr')).to_have_count(0)
        page.screenshot(path=str(EVIDENCE/'empty-390-light.png'),full_page=True)
        page.evaluate('load("default")')
        expect(card.locator('#state')).to_have_text('Standaardscene')
        expect(card.locator('.scene')).to_contain_text('Rustig thuis')
        page.screenshot(path=str(EVIDENCE/'default-390-light.png'),full_page=True)
        passed('empty and fallback states')
        page.evaluate('load()')
        reset.click()
        expect(dialog).to_be_visible()
        expect(dialog).to_contain_text('kan de actieve scene veranderen')
        expect(dialog).to_contain_text('button.eleven_scene_engine_woonkamer_reset')
        expect(card.locator('#cancel')).to_be_focused()
        # Native focus containment across tab boundary.
        page.keyboard.press('Shift+Tab')
        expect(confirm).to_be_focused()
        page.keyboard.press('Tab')
        expect(card.locator('#cancel')).to_be_focused()
        page.evaluate('card.hass={...hass}')
        expect(dialog).to_be_visible()
        expect(card.locator('#cancel')).to_be_focused()
        page.screenshot(path=str(EVIDENCE/'confirmation-390-light.png'),full_page=True)
        card.locator('#cancel').click()
        expect(reset).to_be_focused()
        assert page.evaluate('calls.length') == 0
        reset.click(); page.keyboard.press('Escape')
        expect(dialog).not_to_be_visible()
        expect(reset).to_be_focused()
        assert page.evaluate('calls.length') == 0
        passed('confirmation target/consequence, focus trap, cancel and Escape no service')
        page.evaluate('serviceMode="pending"')
        reset.click(); confirm.click()
        expect(reset).to_be_disabled()
        expect(feedback).to_contain_text('Wacht op bevestiging')
        page.evaluate('card.shadowRoot.querySelector("#reset").click();card.shadowRoot.querySelector("#confirm").click()')
        assert page.evaluate('calls') == [['button','press',{'entity_id':'button.eleven_scene_engine_woonkamer_reset'}]]
        page.screenshot(path=str(EVIDENCE/'pending-390-light.png'),full_page=True)
        card.locator('#details-slot>details>summary').focus()
        page.evaluate('resolveService()')
        expect(card.locator('#details-slot>details>summary')).to_be_focused()
        expect(feedback).to_contain_text('Resetverzoek bevestigd.')
        expect(feedback).to_contain_text('Wacht op nieuwe status')
        expect(feedback).not_to_contain_text('Nieuwe status ontvangen')
        expect(reset).to_be_enabled()
        page.evaluate('card.hass={...hass}')
        expect(feedback).not_to_contain_text('Nieuwe status ontvangen')
        page.evaluate('hass.states["eleven_scene_engine.woonkamer"].last_updated="2026-10-29T18:01:00Z";card.hass={...hass}')
        expect(feedback).to_contain_text('Nieuwe status ontvangen')
        expect(feedback).to_contain_text('dit bevestigt niet dat de opbouw klaar is')
        page.screenshot(path=str(EVIDENCE/'refreshed-390-light.png'),full_page=True)
        passed('pending dedupe, exact button.press payload, acknowledged versus newer snapshot')
        page.evaluate('serviceMode="error"')
        reset.click();confirm.click()
        expect(feedback).to_contain_text('Reset mislukt')
        expect(feedback).to_have_class('feedback error')
        expect(reset).to_be_enabled()
        page.screenshot(path=str(EVIDENCE/'error-390-light.png'),full_page=True)
        page.evaluate('serviceMode="success"')
        reset.click();confirm.click()
        expect(feedback).to_contain_text('Resetverzoek bevestigd')
        expect(feedback).not_to_have_class('feedback error')
        passed('service failure and guarded retry')
        # Reconfiguration cannot silently retarget a confirmation, nor duplicate a pending call.
        reset.click()
        page.evaluate('configure({name:"Andere naam"})')
        expect(dialog).not_to_be_visible()
        expect(feedback).not_to_contain_text('Nieuwe status ontvangen')
        page.evaluate('serviceMode="pending"')
        reset.click();confirm.click()
        page.evaluate('configure({name:"Nieuwe configuratie"})')
        expect(reset).to_be_disabled()
        page.evaluate('resolveService()')
        expect(reset).to_be_enabled()
        expect(feedback).not_to_contain_text('Resetverzoek bevestigd')
        passed('configuration invalidates approval/feedback and retains pending lock')
        page.evaluate('configure({reset_entity:"button.explicit_renamed_reset"});load();hass.states["button.explicit_renamed_reset"]={state:"unknown",attributes:{}};card.hass=hass;serviceMode="success"')
        reset.click()
        expect(dialog).to_contain_text('button.explicit_renamed_reset')
        confirm.click()
        expect(feedback).to_contain_text('Resetverzoek bevestigd')
        assert page.evaluate('calls[calls.length-1]') == ['button','press',{'entity_id':'button.explicit_renamed_reset'}]
        reset.click()
        page.evaluate('hass.connected=false;card.hass=hass')
        expect(dialog).not_to_be_visible()
        expect(reset).to_be_disabled()
        passed('explicit non-inferred reset target and disconnect during confirmation')
        page.evaluate('configure();load();card.hass=undefined')
        expect(reset).to_be_disabled()
        expect(feedback).to_contain_text('Status laden')
        page.evaluate('load();delete hass.states["eleven_scene_engine.woonkamer"].attributes.active_request_count;card.hass=hass')
        expect(card.locator('tbody tr td:last-child .cell-value')).to_have_text(['Ja','Ja','Nee'])
        page.evaluate('delete hass.states["eleven_scene_engine.woonkamer"].attributes.active_requests;card.hass=hass')
        expect(card.locator('tbody tr td:last-child .cell-value')).to_have_text(['—','—','Nee'])
        page.evaluate('load();configure({show_details:false})')
        expect(card.locator('#details-slot>details')).to_have_count(0)
        expect(card.locator('table')).to_have_count(0)
        passed('loading, explicit memberships/unknown and optional Details only')
        page.evaluate('configure();load();hass.states["eleven_scene_engine.woonkamer"].attributes.requests[0].priority=0;card.hass=hass')
        expect(card.locator('tbody tr').first.locator('.cell-value').nth(1)).to_have_text('0')
        card.locator('#details-slot>details>summary').focus()
        page.evaluate('card.hass={...hass}')
        expect(card.locator('#details-slot>details>summary')).to_be_focused()
        passed('zero priority and disclosure focus across updates')
        page.evaluate('configure({name:"<img src=x onerror=window.pwned=1>"});load();hass.states["eleven_scene_engine.woonkamer"].attributes.effective_request.identifier="<svg onload=window.pwned=1>";card.hass=hass')
        expect(card.locator('h2')).to_have_text('<img src=x onerror=window.pwned=1>')
        assert card.locator('img,[onerror],[onload]').count() == 0
        # Legitimate ha-icon/background SVG is allowed; injected handlers are not.
        assert page.evaluate('window.pwned') is None
        passed('untrusted labels escaped as text')
        schema = page.evaluate('''() => { const C=customElements.get('eleven-scene-engine-card');const f=C.getConfigForm();f.assertConfig({});let rejects=0;for(const c of [{entity:[]},{reset_entity:4},{show_details:'yes'}])try{f.assertConfig(c)}catch{rejects++}let invalid=0;for(const c of [{},{entity:'other_engine.bad',reset_entity:'button.test'},{entity:'eleven_scene_engine.test',reset_entity:'scene.bad'}])try{card.setConfig(c)}catch{invalid++}return {schema:f.schema,rejects,invalid,label:f.computeLabel(f.schema[0])}}''')
        assert schema['rejects'] == 3 and schema['invalid'] == 3
        assert schema['schema'][0]['selector']['entity']['domain'] == ['eleven_scene_engine','scene_engine']
        assert schema['schema'][1]['required'] is True
        assert schema['label'] == 'Scene engine'
        passed('native form schema/type assertions and strict setConfig validation')
        page.evaluate('configure();load()')
        for width, height, theme, scenario, details in [
            (320,760,'light','normal',False),
            (390,844,'light','normal',False),
            (1100,900,'light','normal',True),
            (320,760,'dark','long',True),
            (390,844,'dark','normal',False),
            (1100,900,'dark','normal',True),
            (320,760,'light','offline',False),
        ]:
            page.set_viewport_size({'width':width,'height':height})
            page.evaluate('([theme,scenario])=>{document.body.classList.toggle("dark",theme==="dark");load(scenario)}',[theme,scenario])
            if card.locator('#details-slot>details').count():
                card.locator('#details-slot>details').evaluate('(e,open)=>e.open=open', details)
            overflow = page.evaluate('document.documentElement.scrollWidth>innerWidth')
            assert not overflow, (width,theme,scenario)
            assert card.evaluate('(e)=>e.shadowRoot.querySelector("ha-card").scrollWidth<=e.clientWidth')
            page.screenshot(path=str(EVIDENCE/f'{scenario}-{width}-{theme}.png'), full_page=True)
        passed('320/390/1100 layouts, light/dark, long labels and no horizontal overflow')
        page.evaluate('load("long")')
        reset.click()
        assert dialog.evaluate('(e)=>e.getBoundingClientRect().width <= innerWidth-30')
        page.screenshot(path=str(EVIDENCE/'confirmation-320-light.png'),full_page=True)
        passed('320px long-title confirmation fits viewport')
        contrasts = page.evaluate('''() => {
          const luminance = hex => { hex=hex.replace('#',''); if(hex.length===3)hex=[...hex].map(c=>c+c).join(''); const c=hex.match(/[a-f0-9]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4); return c[0]*0.2126+c[1]*0.7152+c[2]*0.0722; };
          const output={};
          for(const dark of [false,true]) {document.body.classList.toggle('dark',dark);const css=getComputedStyle(card);const bg=luminance(css.getPropertyValue('--card-background-color').trim());for(const token of ['--primary-text-color','--secondary-text-color','--error-color']){const fg=luminance(css.getPropertyValue(token).trim());output[(dark?'dark':'light')+token]=(Math.max(bg,fg)+0.05)/(Math.min(bg,fg)+0.05);}}
          return output;
        }''')
        assert all(ratio>=4.5 for ratio in contrasts.values()), contrasts
        passed('fixture primary/secondary/error text contrast >= 4.5:1 in both themes')
        assert not errors, errors
        assert not external, external
        passed('zero page/console errors and zero external browser requests')
        version = browser.version
        browser.close()
        screenshots = sorted(path.name for path in EVIDENCE.glob('*.png'))
        return {'synthetic':True,'compact_height_px':compact_height,'passed':results,'checks':len(results),'page_errors':errors,'external_requests':external,'chromium_version':version,'contrast_ratios':contrasts,'screenshots':screenshots,'screenshot_count':len(screenshots)}

try:
    report=run()
    (EVIDENCE/'results.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
finally:
    server.shutdown()
    server.server_close()
