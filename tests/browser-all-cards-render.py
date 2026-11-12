"""Real Chromium, offline synthetic render/migration QA. No Home Assistant access.

Run with a Playwright Python environment. BROWSER_EXECUTABLE optionally selects
an already-installed Chromium; no browser/dependency installation is performed.
ALL_CARDS_RENDER_OUT selects evidence output (default outside this checkout).
Uses versioned review fixtures/HA icon stub, never personal images or live data.
"""
from pathlib import Path
import base64
import hashlib
import json
import os
import struct
import tempfile
import unittest
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('ALL_CARDS_RENDER_OUT', str(Path(tempfile.gettempdir()) / 'eleven-all-cards-render')))
CARDS = ['dynamic-energy-price-card', 'history-graph-card', 'timeline-card',
         'overview-card', 'bar-chart', 'heatmap-card', 'calendar-card', 'car-card',
         'weather-card', 'energy-flow-card', 'shopping-card', 'house-card',
         'actions-card', 'controls-card', 'waste-card', 'appliance-planner',
         'room-card', 'scene-engine-card', 'camera-card', 'camera-viewer-card', 'media-player-card', 'material-house']
ADDITIONS = CARDS[12:]
SCREENSHOTS = os.environ.get('QA_SCREENSHOTS', '1') != '0'
STANDALONES = ['cards/home-controls/dist/eleven-home-controls-card.js',
               'cards/appliance-planner/dist/eleven-appliance-planner.js',
               'cards/room-card/dist/eleven-room-card.js',
               'cards/scene-engine-card/dist/eleven-scene-engine-card.js',
               'cards/house-card/dist/eleven-house-card.js',
               'cards/camera-card/dist/eleven-camera-card.js',
               'cards/media-player-card/dist/eleven-media-player-card.js',
               'experiments/material-house/dist/material-house.js']
COLLECTION = 'dist/eleven-cards.js'
ORIGIN = 'https://offline.invalid'
HTML = '''<!doctype html><meta charset="utf-8"><style>
:root{font:14px/1.4 system-ui;--primary-color:#2979b8;--accent-color:#8a61b4;
--primary-text-color:#222831;--secondary-text-color:#626c77;
--primary-background-color:#f1f3f5;--secondary-background-color:#e7ebef;
--card-background-color:#fff;--ha-card-background:#fff;--divider-color:#d6dde4;
--ha-card-border-color:#d6dde4;--ha-card-border-radius:16px;--ha-card-border-width:1px;
color:var(--primary-text-color);background:var(--primary-background-color)}
body{margin:0;padding:20px}#mount{width:440px}#mount>*{display:block;width:440px}
#editors{display:none}*{box-sizing:border-box}
</style><main id="mount"></main><aside id="editors"></aside>'''
CLOCK = """{const D=Date, fixed=D.parse('2026-11-05T09:00:00Z');window.Date=class extends D{constructor(...a){super(...(a.length?a:[fixed]));}static now(){return fixed;}};}"""


def assets():
    # Generic silhouette only, deliberately not a household render.
    width, height = 64, 48
    alpha = [float(12 <= x <= 52 and 18 <= y <= 40 or 8 <= y < 18 and abs(x-32) < (y-5)*2)
             for y in range(height) for x in range(width)]
    pack = lambda values: struct.pack('<' + 'f'*len(values), *values)
    data = {'alpha.f32': pack(alpha), 'layer.f32': pack([v for a in alpha for v in [a*.15, a*.08, a*.03]])}
    for phase, scale in [('morning', .65), ('afternoon', 1), ('evening', .35), ('night', .12)]:
        data[phase+'.f32'] = pack([v for a in alpha for v in [a*.35*scale, a*.18*scale, a*.09*scale]])
    manifest = {'schema': 1, 'dtype': 'float32-le', 'channels': 3, 'width': width, 'height': height,
                'release': 'synthetic-offline-v1', 'lights': [{'id': 'room', 'name': 'Example room', 'entity': 'light.living'}],
                'files': {name: {'sha256': hashlib.sha256(blob).hexdigest()} for name, blob in data.items()},
                'views': [{'id': view, 'name': view.title(), 'camera_location': view, 'alpha': 'alpha.f32',
                           'modes': {phase: {'base': phase+'.f32', 'layers': ['layer.f32']}
                                     for phase in ['morning', 'afternoon', 'evening', 'night']}}
                          for view in ['front', 'rear']]}
    data['manifest.json'] = json.dumps(manifest).encode()
    data['car.svg'] = b'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="150"><path fill="#5296bb" d="M30 95L80 85 120 35H270L320 85H370V120H30Z"/><circle cx="110" cy="120" r="23"/><circle cx="300" cy="120" r="23"/></svg>'
    return data


class AllCardsRender(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        OUT.mkdir(parents=True, exist_ok=True)
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch(**({'executable_path': os.environ['BROWSER_EXECUTABLE']} if os.getenv('BROWSER_EXECUTABLE') else {}))
        cls.report = {'checks': [], 'renders': [], 'editors': [], 'migrations': [], 'page_errors': [],
                      'console_errors': [], 'blocked_requests': [], 'mock_requests': [], 'ha_calls': [],
                      'browser': cls.browser.version, 'bundle_sha256': hashlib.sha256((ROOT/COLLECTION).read_bytes()).hexdigest(),
                      'dependencies': ['Python playwright.sync_api', 'installed Chromium', 'review/ha-stub.js (HA custom elements/icons)',
                                       'review/fixtures.js (fictional data/configs)', 'dist and standalone bundles'],
                      'fixture_lifecycle': 'setConfig before hass: cold configuration must not depend on HA already being assigned',
                      'limitations': ['Synthetic Chromium component QA, not native Lovelace/HA integration.',
                                      'HA frontend elements (including ha-form) are stubs; native editor selector integration not validated.',
                                      'Generic mocked float32 house assets only; no live manifests, household render assets, devices or backend integrations tested.',
                                      'No Safari/Firefox/accessibility certification; this is representative smoke, not full card feature coverage.']}

    @classmethod
    def tearDownClass(cls):
        cls.report['counts'] = {key: len(cls.report[key]) for key in ['checks', 'renders', 'editors', 'migrations', 'page_errors', 'console_errors', 'blocked_requests', 'mock_requests', 'ha_calls']}
        (OUT/'report.json').write_text(json.dumps(cls.report, indent=2))
        cls.browser.close()
        cls.pw.stop()

    def check(self, name, condition):
        self.report['checks'].append({'name': name, 'passed': bool(condition)})
        self.assertTrue(condition, name)

    def new_page(self):
        context = self.browser.new_context(viewport={'width': 480, 'height': 1100}, locale='nl-NL', timezone_id='Europe/Amsterdam', service_workers='block', reduced_motion='reduce')
        context.add_init_script(CLOCK)
        page = context.new_page()
        page.on('pageerror', lambda error: self.report['page_errors'].append(str(error)))
        page.on('console', lambda msg: self.report['console_errors'].append(msg.text) if msg.type == 'error' else None)
        fixture_assets = assets()
        def route(request_route):
            url = urlsplit(request_route.request.url)
            if request_route.request.url == ORIGIN+'/':
                request_route.fulfill(body=HTML, content_type='text/html')
            elif url.scheme == 'https' and url.netloc == 'offline.invalid' and url.path.startswith('/fixture/') and url.path[9:] in fixture_assets:
                name = url.path[9:]
                self.report['mock_requests'].append(request_route.request.url)
                request_route.fulfill(body=fixture_assets[name], content_type='application/json' if name.endswith('.json') else 'image/svg+xml' if name.endswith('.svg') else 'application/octet-stream')
            else:
                self.report['blocked_requests'].append(request_route.request.url)
                request_route.abort('blockedbyclient')
        context.route('**/*', route)
        page.goto(ORIGIN+'/')
        page.add_script_tag(path=str(ROOT/'review/ha-stub.js'))
        page.add_script_tag(content="customElements.define('ha-form',class extends HTMLElement{});window.customCards=[];window.capturedPicker=window.customCards;")
        source = (ROOT/'review/fixtures.js').read_text().split('// Rich fictional appointments')[0]
        source = source.replace('export ', '').replace('import.meta.url', json.dumps(ORIGIN+'/review/fixtures.js'))
        page.evaluate('() => {'+source+'''
          window.qaConfigs=Object.fromEntries(configs.map(([name,title,c])=>[name,{...c,type:'custom:eleven-'+name}]));
          window.qaConfigs['camera-card']={type:'custom:eleven-camera-card',title:'Security',cameras:[]};
          window.qaConfigs['camera-viewer-card']={type:'custom:eleven-camera-viewer-card',viewer_id:'audit-viewer'};
          window.qaConfigs['media-player-card']={type:'custom:eleven-media-player-card',entity:'media_player.audit_radio',layout:'studio',title:'Audit radio'};
          window.qaCalls=[];
          window.qaHass=(name)=>{
            const h=createFixture(name);
            h.states['media_player.audit_radio']={state:'playing',attributes:{friendly_name:'Audit radio',media_title:'Synthetic Radio',media_content_type:'music',volume_level:0.4,is_volume_muted:false,supported_features:65535}};
            h.states['image.review_car'].attributes.entity_picture='/fixture/car.svg';
            h.localize=()=>'';h.formatEntityState=s=>String(s.state);h.formatEntityAttributeValue=(s,k)=>String(s.attributes[k]);
            for(const method of ['callService','callApi','callWS']){
              const original=h[method];h[method]=async(...args)=>{qaCalls.push({method,args});return original(...args);};
            }
            const subscribe=h.connection.subscribeMessage;
            h.connection={...h.connection,subscribeMessage:async(cb,req)=>{qaCalls.push({method:'subscribeMessage',args:[req]});return subscribe(cb,req);}};
            return h;
          };
          for(const name of ['house-card','material-house'])qaConfigs[name]={type:'custom:eleven-'+name,manifest:'/fixture/manifest.json',view:'front',mode:'afternoon',title:'Synthetic home',show_view_toggle:true,show_presence:false,show_thermostat:true,thermostat_entity:'climate.living',weather_entity:'weather.home',animate_weather:false,animate_background:false};
          window.qaMount=async(name,dark=false)=>{
            document.querySelector('#mount').replaceChildren();document.querySelector('#editors').replaceChildren();
            document.documentElement.style.cssText=dark?'--primary-text-color:#edf0f4;--secondary-text-color:#abb2bd;--primary-background-color:#121416;--secondary-background-color:#282b30;--card-background-color:#1c1e20;--ha-card-background:#1c1e20;--divider-color:#363b41;--ha-card-border-color:#363b41':'';
            const h=qaHass(name);h.themes={darkMode:dark};
            const card=document.createElement('eleven-'+name);card.setConfig(structuredClone(qaConfigs[name]));card.hass=h;document.querySelector('#mount').append(card);window.qaCard=card;
            const editor=await customElements.get('eleven-'+name).getConfigElement();
            editor.setConfig(structuredClone(qaConfigs[name]));editor.hass=h;document.querySelector('#editors').append(editor);window.qaEditor=editor;
          };
        }''')
        return context, page

    def load(self, page, path):
        page.add_script_tag(path=str(ROOT/path))

    def picker(self, page, label):
        result = page.evaluate('''()=>({identity:window.customCards===window.capturedPicker,types:customCards.map(c=>c.type).sort(),houseDistinct:customElements.get('eleven-house-card')!==customElements.get('eleven-material-house')})''')
        self.check(label+' picker identity', result['identity'])
        self.check(label+f' exact {len(CARDS)} unique picker types', result['types'] == sorted('eleven-'+name for name in CARDS))
        self.check(label+' production House distinct from Material', result['houseDistinct'])

    def render(self, page, name, dark=False, screenshot=False):
        page.evaluate('async ([name,dark])=>await qaMount(name,dark)', [name, dark])
        page.wait_for_function("!!window.qaCard?.shadowRoot?.querySelector('ha-card')")
        if name in ['house-card', 'material-house']:
            page.wait_for_function('!!qaCard.loaded && !qaCard.modeLoad', timeout=15000)
        elif name == 'appliance-planner':
            page.wait_for_function('!!qaCard.result && !qaCard.loading', timeout=15000)
        page.wait_for_timeout(350)
        page.locator('eleven-'+name).scroll_into_view_if_needed()
        result = page.evaluate('''()=>{const panel=qaCard.shadowRoot.querySelector('ha-card'),r=panel.getBoundingClientRect();return {text:panel.innerText,width:r.width,height:r.height,editor:qaEditor instanceof HTMLElement,editorConfigured:typeof qaEditor.setConfig==='function',loaded:!!qaCard.loaded,canvasPainted:[...qaCard.shadowRoot.querySelectorAll('canvas')].some(c=>c.width&&c.height&&c.getContext('2d')?.getImageData(0,0,c.width,c.height).data.some(v=>v>0))};}''')
        self.check(name+(' dark' if dark else ' light')+' visible nonempty card', result['width'] > 100 and result['height'] > 40 and len(result['text'].strip()) > 2)
        self.check(name+(' dark' if dark else ' light')+' editor instantiated/configured', result['editor'] and result['editorConfigured'])
        expected = {'actions-card': 'Avond', 'controls-card': 'Thermostaat', 'waste-card': 'Papier', 'room-card': 'Woonkamer', 'scene-engine-card': 'Avond', 'appliance-planner': 'Wasmachine', 'camera-viewer-card': 'camera', 'media-player-card': 'Synthetic Radio'}
        if name in expected:
            self.check(name+' representative populated content', expected[name] in result['text'])
        if name in ['house-card', 'material-house']:
            self.check(name+' actual mocked compositor loaded and painted', result['loaded'] and result['canvasPainted'])
        self.report['renders'].append({'name':name,'dark':dark,**result})
        self.report['editors'].append({'name':name,'dark':dark,'tag':page.evaluate('qaEditor.localName')})
        if screenshot and SCREENSHOTS:
            page.locator('eleven-'+name).screenshot(path=str(OUT/(name+('-dark' if dark else '-light')+'.png')))

    def test_01_all_cards_render_light_dark_and_confirmed_scene_reset(self):
        context, page = self.new_page()
        try:
            self.load(page, COLLECTION)
            page.evaluate('window.qaConstructors=Object.fromEntries(customCards.map(c=>[c.type,customElements.get(c.type)]))')
            self.load(page, COLLECTION)
            self.picker(page, 'duplicate collection')
            self.check('duplicate collection preserves all constructors', page.evaluate('Object.entries(qaConstructors).every(([n,c])=>customElements.get(n)===c)'))
            for dark in [False, True]:
                for name in CARDS:
                    with self.subTest(card=name, dark=dark):
                        self.render(page, name, dark, name in ADDITIONS)
            self.check('no initial service dispatch across all renders/editors', page.evaluate("qaCalls.filter(c=>c.method==='callService').length===0"))
            page.evaluate("async()=>await qaMount('scene-engine-card')")
            scene=page.locator('eleven-scene-engine-card')
            scene.locator('#reset').click()
            self.check('opening reset confirmation does not dispatch', page.evaluate("qaCalls.filter(c=>c.method==='callService').length===0"))
            self.check('reset confirmation is visible', scene.locator('dialog').evaluate('(d)=>d.open'))
            scene.locator('#cancel').click()
            self.check('cancel reset does not dispatch', page.evaluate("qaCalls.filter(c=>c.method==='callService').length===0"))
            scene.locator('#reset').click()
            scene.locator('#confirm').click()
            page.wait_for_function("qaCalls.filter(c=>c.method==='callService').length===1")
            calls=page.evaluate("qaCalls.filter(c=>c.method==='callService')")
            self.check('confirmed reset dispatches exactly one fake targeted button.press', calls == [{'method':'callService','args':['button','press',{'entity_id':'button.engine_reset'}]}])
            self.report['ha_calls'].extend(page.evaluate('qaCalls'))
        finally:
            context.close()

    def test_02_standalone_collection_load_orders_and_legacy_picker_repair(self):
        for mode in ['standalones-first', 'collection-first', 'legacy-picker-repair']:
            with self.subTest(mode=mode):
                context,page=self.new_page()
                try:
                    paths=([COLLECTION]+STANDALONES) if mode=='collection-first' else (STANDALONES+[COLLECTION])
                    if mode=='legacy-picker-repair':
                        self.load(page,STANDALONES[-1])
                        page.evaluate("window.oldPilot=customElements.get('eleven-material-house');window.oldPilotEditor=customElements.get('eleven-material-house-editor');customCards.splice(0,customCards.length,{type:'eleven-house-baseline'});")
                    for path in paths:self.load(page,path)
                    page.evaluate('window.qaConstructors=Object.fromEntries(customCards.map(c=>[c.type,customElements.get(c.type)]))')
                    for path in reversed(paths):self.load(page,path)
                    self.picker(page,mode)
                    self.check(mode+' repeat overlap preserves constructors',page.evaluate('Object.entries(qaConstructors).every(([n,c])=>customElements.get(n)===c)'))
                    if mode=='legacy-picker-repair':
                        self.check('legacy pilot card/editor constructors retained',page.evaluate("oldPilot===customElements.get('eleven-material-house')&&oldPilotEditor===customElements.get('eleven-material-house-editor')"))
                    self.render(page,'camera-viewer-card')
                    self.render(page,'media-player-card')
                    self.render(page,'house-card')
                    page.evaluate('window.qaProductionHouse=qaCard')
                    self.render(page,'material-house')
                    page.evaluate("document.querySelector('#mount').append(qaProductionHouse)")
                    page.wait_for_function('qaProductionHouse.isConnected&&qaCard.isConnected&&qaProductionHouse.loaded&&qaCard.loaded&&!qaProductionHouse.modeLoad&&!qaCard.modeLoad')
                    self.check(mode+' both House implementations coexist and paint simultaneously',page.evaluate("qaProductionHouse.constructor!==qaCard.constructor&&[qaProductionHouse,qaCard].every(c=>c.shadowRoot.querySelector('.stage canvas').getContext('2d').getImageData(0,0,64,48).data.some(v=>v>0))"))
                    if SCREENSHOTS: page.locator('#mount').screenshot(path=str(OUT/(mode+'-house-coexist.png')))
                    self.check(mode+' no service dispatch',page.evaluate("qaCalls.every(c=>c.method!=='callService')"))
                    self.report['migrations'].append(mode)
                    self.report['ha_calls'].extend(page.evaluate('qaCalls'))
                finally:context.close()

    def test_03_contact_sheet_and_clean_runtime(self):
        page=self.browser.new_page(viewport={'width':940,'height':1000})
        try:
            if SCREENSHOTS:
                rows=[]
                for name in ADDITIONS:
                    images=[]
                    for mode in ['light','dark']:
                        blob=(OUT/f'{name}-{mode}.png').read_bytes()
                        images.append('<figure><figcaption>'+name+' · '+mode+'</figcaption><img src="data:image/png;base64,'+base64.b64encode(blob).decode()+'"></figure>')
                    rows.append('<section>'+''.join(images)+'</section>')
                style='<style>body{font:14px system-ui;margin:12px;background:#ddd}section{display:flex;align-items:flex-start;gap:12px;margin-bottom:18px}figure{margin:0;width:440px}img{display:block;width:440px}figcaption{padding:8px 0;font-weight:600}</style>'
                page.set_content(style+''.join(rows))
                page.screenshot(path=str(OUT/'additions-light-dark-contact-sheet.png'),full_page=True)
                for index,html in enumerate([rows[:4],rows[4:]],1):
                    page.set_content(style+''.join(html))
                    page.screenshot(path=str(OUT/f'additions-light-dark-part-{index}.png'),full_page=True)
            expected=2*len(CARDS)+4*len(self.report['migrations'])
            self.check(f'exact {expected} render cases completed',len(self.report['renders'])==expected)
            self.check(f'exact {expected} editor instances configured',len(self.report['editors'])==expected)
            self.check('all three migration cases completed',len(self.report['migrations'])==3)
            self.check('no JavaScript page errors',self.report['page_errors']==[])
            self.check('no browser console errors',self.report['console_errors']==[])
            self.check('no unmocked/external request attempted',self.report['blocked_requests']==[])
        finally:page.close()


if __name__=='__main__':
    unittest.main(verbosity=2)
