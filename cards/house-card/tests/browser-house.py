"""Offline component QA, never native/authenticated Home Assistant QA.
Run with a Playwright Python environment; optional BROWSER_EXECUTABLE overrides Chromium.
All image assets are synthetic, generated in memory, and served on loopback only.
"""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import hashlib
import json
import os
import struct
import threading
import unittest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[3]
ASSETS = {}
for phase, scale in [('morning', .65), ('afternoon', 1), ('evening', .35), ('night', .12)]:
    values=[]
    for y in range(48):
        for x in range(64):
            # Deliberately generic house silhouette, not a household rendering.
            inside=12 <= x <= 52 and 18 <= y <= 40 or 8 <= y < 18 and abs(x-32)<(y-5)*2
            values.extend([.35*scale,.18*scale,.09*scale] if inside else [0,0,0])
    ASSETS[phase+'.f32']=struct.pack('<'+'f'*len(values), *values)
alpha=[float(12 <= x <= 52 and 18 <= y <= 40 or 8 <= y < 18 and abs(x-32)<(y-5)*2) for y in range(48) for x in range(64)]
ASSETS['alpha.f32']=struct.pack('<'+'f'*len(alpha), *alpha)
layer=[v*.25 for a in alpha for v in [a,a*.7,a*.3]]
ASSETS['layer.f32']=struct.pack('<'+'f'*len(layer), *layer)
manifest={'schema':1,'dtype':'float32-le','channels':3,'width':64,'height':48,'release':'synthetic-v1','lights':[{'id':'room','name':'Example room','entity':'light.example'}], 'files':{name:{'sha256':hashlib.sha256(data).hexdigest()} for name,data in ASSETS.items()},'views':[{'id':view,'name':view.title(),'camera_location':view,'alpha':'alpha.f32','modes':{phase:{'base':phase+'.f32','layers':['layer.f32']} for phase in ['morning','afternoon','evening','night']}} for view in ['front','rear']]}
class Handler(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
    def do_GET(self):
        path=self.path.split('?')[0]
        if path.startswith('/fixture/'):
            name=path.removeprefix('/fixture/')
            data=json.dumps(manifest).encode() if name=='manifest.json' else ASSETS.get(name)
            if data is None:self.send_error(404);return
            self.send_response(200);self.send_header('Content-Type','application/json' if name.endswith('.json') else 'application/octet-stream');self.end_headers();self.wfile.write(data)
        else:super().do_GET()

class HouseBrowserQA(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)))
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
        cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch(**({'executable_path':os.environ['BROWSER_EXECUTABLE']} if os.getenv('BROWSER_EXECUTABLE') else {}))
    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.p.stop();cls.server.shutdown();cls.server.server_close()
    def setUp(self):
        self.context=self.browser.new_context(viewport={'width':460,'height':950},device_scale_factor=3)
        self.page=self.context.new_page();self.errors=[];self.page.on('pageerror',lambda error:self.errors.append(str(error)))
        self.page.goto(f'http://127.0.0.1:{self.server.server_port}/cards/house-card/tests/fixture.html')
        self.page.wait_for_function('window.card?.loaded && !card.modeLoad && card.weather.h>0')
        self.page.wait_for_timeout(700)
    def tearDown(self):
        self.assertEqual(self.errors,[]);self.context.close()
    def test_approved_defaults_bounds_and_real_weather_mapping(self):
        page=self.page
        result=page.evaluate('''() => {const s=card.shadowRoot,stage=s.querySelector('.stage').getBoundingClientRect(),head=s.querySelector('.hero-header').getBoundingClientRect(),cap=s.querySelector('.stage-caption').getBoundingClientRect(),layer=card.weather.layer.getBoundingClientRect();return {background:card.config.background,color:card.config.color,compact:card.config.compact,strength:card.config.background_strength,scale:card.config.image_scale,x:card.config.image_offset_x,y:card.config.image_offset_y,animated:card.config.animate_background,top:layer.top-stage.top,header:head.top-stage.top,bottom:layer.bottom-cap.top,pointer:getComputedStyle(card.weather.layer).pointerEvents,dpr:card.weather.canvas.width/layer.width,people:s.querySelector('[data-summary=presence]').textContent,mode:card.weather.state.mode};}''')
        self.assertEqual({k:result[k] for k in ['background','color','compact','strength','scale','x','y','animated']},{'background':'halo','color':'warm','compact':True,'strength':100,'scale':100,'x':0,'y':0,'animated':True})
        self.assertLess(abs(result['top']),1);self.assertLess(abs(result['header']),1);self.assertLess(abs(result['bottom']),1);self.assertEqual(result['pointer'],'none');self.assertLessEqual(result['dpr'],2.01);self.assertIn('Office',result['people']);self.assertEqual(result['mode'],'rain')
        for state,speed,unit,mode in [('snowy',20,'m/s','snow'),('rainy',40,'km/h','storm'),('sunny',30,'mph','wind'),('unavailable',100,'m/s','none'),('unknown',100,'m/s','none'),('sunny',100,'invalid','none')]:
            page.evaluate('(a)=>setWeather(...a)',[state,speed,unit]);self.assertEqual(page.evaluate('card.weather.state.mode'),mode)
        page.evaluate('card.setConfig({...config,weather_overlay:false})');self.assertEqual(page.evaluate('card.weather.state.mode'),'none')
        self.assertEqual(page.evaluate('calls'),[])
    def test_front_rear_phases_themes_compositor_and_more_info(self):
        page=self.page
        for view in ['front','rear']:
            page.evaluate('(view)=>card.selectView(view)',view);page.wait_for_function('(v)=>card.loaded?.view.id===v&&!card.modeLoad',arg=view)
            for phase in ['morning','afternoon','evening','night']:
                page.evaluate('(phase)=>setPhase(phase)',phase);page.wait_for_function('!card.modeLoad')
                before=page.evaluate('housePixels()')
                for dark in [True,False]:
                    page.evaluate('(dark)=>setTheme(dark)',dark)
                    for weather in ['rainy','snowy','windy','lightning-rainy','sunny']:
                        page.evaluate('(weather)=>setWeather(weather)',weather);self.assertEqual(page.evaluate('housePixels()'),before)
        page.locator('eleven-house-card').locator('[data-summary=weather]').click();self.assertEqual(page.evaluate('info'),['weather.example']);self.assertEqual(page.evaluate('calls'),[])
        # Intentional pre-existing light interaction; weather never produces calls.
        page.locator('eleven-house-card').locator('.light-heading').click();page.locator('eleven-house-card').locator('[data-entity="light.example"]').click();self.assertEqual(page.evaluate('calls'),[['light','turn_off',{'entity_id':'light.example'}]])
    def test_lifecycle_offscreen_reduced_motion_and_resize(self):
        page=self.page
        page.wait_for_timeout(120);self.assertGreater(page.evaluate('card.weather.clock'),0)
        page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(100);clock=page.evaluate('card.weather.clock');page.wait_for_timeout(120);self.assertEqual(page.evaluate('card.weather.clock'),clock);self.assertEqual(page.evaluate('card.weather.frame'),0)
        page.emulate_media(reduced_motion='no-preference');page.wait_for_timeout(120);self.assertGreater(page.evaluate('card.weather.clock'),clock)
        page.evaluate("card.style.marginTop='2000px'");page.wait_for_timeout(100);clock=page.evaluate('card.weather.clock');page.wait_for_timeout(120);self.assertEqual(page.evaluate('card.weather.clock'),clock)
        page.evaluate("card.style.marginTop='0px'");page.wait_for_timeout(120);self.assertGreater(page.evaluate('card.weather.clock'),clock)
        page.evaluate('card.remove()');self.assertEqual(page.evaluate('card.weather.frame'),0);clock=page.evaluate('card.weather.clock');page.wait_for_timeout(100);self.assertEqual(page.evaluate('card.weather.clock'),clock)
        page.evaluate("document.querySelector('#mount').append(card)");page.wait_for_timeout(150);self.assertGreater(page.evaluate('card.weather.clock'),clock)
        page.set_viewport_size({'width':320,'height':900});page.wait_for_timeout(100);self.assertTrue(page.evaluate('document.documentElement.scrollWidth<=innerWidth'));self.assertLessEqual(page.evaluate('card.weather.w'),320)
        page.evaluate('card.config={...card.config,animate_weather:false};card.draw()');clock=page.evaluate('card.weather.clock');page.wait_for_timeout(100);self.assertEqual(page.evaluate('card.weather.clock'),clock)
    def test_visibility_and_disconnected_host_connection_pause(self):
        page=self.page
        # Controlled Page Visibility seam, not a native HA/background-tab claim.
        page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))")
        clock=page.evaluate('card.weather.clock');page.wait_for_timeout(150);self.assertEqual(page.evaluate('card.weather.clock'),clock);self.assertEqual(page.evaluate('card.weather.frame'),0)
        page.evaluate("delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))");page.wait_for_timeout(150);self.assertGreater(page.evaluate('card.weather.clock'),clock)
        page.evaluate('card.hass={...hass,connected:false}');clock=page.evaluate('card.weather.clock');page.wait_for_timeout(100);self.assertEqual(page.evaluate('card.weather.clock'),clock)
        page.evaluate('card.hass=hass');page.wait_for_timeout(150);self.assertGreater(page.evaluate('card.weather.clock'),clock)
    def test_wind_real_canvas_pixels_are_equal_at_same_phase(self):
        page=self.page
        result=page.evaluate('''() => {setWeather('windy');card.config={...card.config,animate_weather:false};card.draw();const w=card.weather;const pixels=()=>Array.from(w.ctx.getImageData(0,0,w.canvas.width,w.canvas.height).data);w.state={mode:'wind',amount:.2,wind:.1};w.paint(10,12);const low=pixels();w.state={mode:'wind',amount:1,wind:1};w.paint(10,12);const high=pixels();return {same:low.every((v,i)=>v===high[i]),painted:low.some(v=>v>0)};}''')
        self.assertEqual(result,{'same':True,'painted':True})
    def test_double_load_aliases_editors_and_keyboard(self):
        page=self.page
        page.add_script_tag(path=str(ROOT/'cards/house-card/dist/eleven-house-card.js'))
        self.assertEqual(page.evaluate("customCards.filter(c=>c.type==='eleven-house-card').length"),1)
        self.assertTrue(page.evaluate("customElements.get('eleven-house-styled-card').prototype instanceof customElements.get('eleven-house-card') || customElements.get('eleven-house-card').prototype instanceof customElements.get('eleven-house-styled-card')"))
        page.evaluate("window.editor=customElements.get('eleven-house-card').getConfigElement();document.body.append(editor);editor.setConfig(config);editor.hass=hass")
        self.assertTrue(page.evaluate("editor.form.schema.some(s=>s.name==='weather_overlay')&&editor.form.schema.some(s=>s.name==='presentation')"))
        page.keyboard.press('Tab');self.assertTrue(page.evaluate("!!card.shadowRoot.activeElement"))
        self.assertTrue(page.evaluate("card.shadowRoot.activeElement.matches(':focus-visible')"))

if __name__=='__main__':unittest.main(verbosity=2)
