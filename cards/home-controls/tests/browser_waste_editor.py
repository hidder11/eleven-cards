"""Isolated real Chromium regressions; HA-form is a shadow-input fixture, not HA itself.
Run with a Python environment providing playwright; no server or live HA required.
"""
import os
from pathlib import Path
import unittest
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[3]
BUNDLE = Path(os.environ.get('WASTE_BUNDLE', ROOT / 'cards/home-controls/dist/eleven-home-controls-card.js'))
HTML = '''<!doctype html><style>body{font:14px sans-serif;--primary-text-color:#222;--secondary-text-color:#666;--secondary-background-color:#eee;--divider-color:#ccc}eleven-controls-editor{display:block;max-width:520px}ha-form{display:block}input{display:block;width:90%;margin:6px;padding:8px}</style><script>
customElements.define('ha-form',class extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._data={}}
 set data(v){this._data=v;if(this.isConnected)this.updateValues()}
 get data(){return this._data}
 connectedCallback(){for(const field of this.schema){const input=document.createElement('input');input.name=field.name;input.setAttribute('aria-label',field.name);input.value=this._data[field.name]??'';input.addEventListener('input',()=>{this._data={...this._data,[field.name]:input.value};this.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{...this._data}},bubbles:true,composed:true}))});this.shadowRoot.append(input)}}
 updateValues(){for(const input of this.shadowRoot.querySelectorAll('input'))if(input.value!==String(this._data[input.name]??''))input.value=this._data[input.name]??''}
});
window.events=[];window.echo=true;
window.hass={locale:{language:'nl'},states:{'sensor.paper':{state:'2099-01-01',attributes:{friendly_name:'Papier',icon:'mdi:package-variant',entity_picture:'/paper.svg'}},'sensor.gft':{state:'2099-01-02',attributes:{friendly_name:'GFT'}}}};
</script>'''

class WasteEditorRegression(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.pw=sync_playwright().start()
  cls.browser=cls.pw.chromium.launch(executable_path=os.environ.get('CHROMIUM') or None,args=['--no-sandbox'])
  class Handler(BaseHTTPRequestHandler):
   def do_GET(self):
    body,content_type=(BUNDLE.read_bytes(),'text/javascript; charset=utf-8') if self.path=='/bundle.js' else (b'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M2 2H18V18H2Z" fill="green"/></svg>','image/svg+xml') if self.path.endswith('.svg') else (HTML.encode(),'text/html')
    self.send_response(200);self.send_header('Content-Type',content_type);self.end_headers();self.wfile.write(body)
   def log_message(self,format,*args):pass
  cls.server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
  cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
  cls.url=f'http://127.0.0.1:{cls.server.server_port}'
  cls.evidence=tempfile.TemporaryDirectory(prefix='waste-editor-')
 @classmethod
 def tearDownClass(cls):
  cls.browser.close();cls.pw.stop();cls.server.shutdown();cls.server.server_close();cls.thread.join();cls.evidence.cleanup()
 def setUp(self):
  self.page=self.browser.new_page(viewport={'width':390,'height':1000})
  self.errors=[];self.page.on('pageerror',lambda e:self.errors.append(str(e)))
  self.page.goto(self.url)
  self.page.add_script_tag(url=self.url+'/bundle.js')
  self.page.add_script_tag(url=self.url+'/bundle.js')
  self.page.evaluate('''()=>{window.editor=document.createElement('eleven-controls-editor');document.body.append(editor);editor.hass=hass;editor.setConfig({type:'custom:eleven-waste-card',title:'Afval',entities:[{entity:'sensor.paper',name:'Papier',source:'date',attribute:'',filter:'keep',color:'#123456'},{entity:'sensor.gft',name:'GFT',icon:'mdi:leaf'}]});editor.addEventListener('config-changed',ev=>{events.push(structuredClone(ev.detail.config));if(echo)editor.setConfig(structuredClone(ev.detail.config));editor.hass={...hass}})}''')
  self.page.evaluate("editor.shadowRoot.querySelectorAll('details.item').forEach(e=>e.open=true)")
 def tearDown(self):
  self.page.close()
 def test_continuous_typing_and_selection_survive_cloned_echo(self):
  field=self.page.locator('.item').first.locator('input[name=name]')
  field.fill('')
  field.press_sequentially('Papier en karton',delay=10)
  self.assertEqual(field.input_value(),'Papier en karton')
  field.evaluate('(e)=>{window.original=e;e.focus();e.setSelectionRange(7,9)}')
  self.page.keyboard.type('of')
  self.assertEqual(field.input_value(),'Papier of karton')
  self.assertTrue(field.evaluate('(e)=>e===original&&e.getRootNode().activeElement===e'))
  self.assertEqual(field.evaluate('(e)=>e.selectionStart'),9)
  self.assertEqual(self.page.evaluate('editor._config.entities[1].name'),'GFT')
  self.assertEqual(self.page.evaluate('editor._config.entities[0].source'),'date')
  self.assertEqual(self.page.locator('.item strong').first.inner_text(),'Papier of karton')
  self.assertEqual(self.errors,[])
 def test_typing_without_parent_echo_survives_hass(self):
  self.page.evaluate('echo=false')
  title=self.page.locator('.main input[name=title]')
  title.fill('');title.press_sequentially('Mijn afval',delay=10)
  self.assertEqual(title.input_value(),'Mijn afval')
  self.assertEqual(self.page.evaluate('editor._config.title'),'Mijn afval')
 def test_default_sensor_picture_and_explicit_override(self):
  self.page.evaluate('''()=>{window.card=document.createElement('eleven-waste-card');document.body.prepend(card);card.setConfig({type:'custom:eleven-waste-card',entities:[{entity:'sensor.paper'},{entity:'sensor.gft',icon:'mdi:leaf'}]});card.hass=hass}''')
  image=self.page.locator('eleven-waste-card .pickup img')
  self.assertEqual(image.count(),1)
  self.assertTrue(image.evaluate('(e)=>e.complete&&e.naturalWidth>0'))
  self.assertEqual(image.get_attribute('src'),'/paper.svg')
  self.assertEqual(image.get_attribute('alt'),'')
  self.assertEqual(self.page.locator('eleven-waste-card [data-info="sensor.gft"] ha-icon').get_attribute('icon'),'mdi:leaf')
  self.page.evaluate("card.setConfig({...card._config,entities:[{entity:'sensor.paper',icon:'mdi:recycle'}]})")
  self.assertEqual(self.page.locator('eleven-waste-card img').count(),0)
  self.assertEqual(self.page.locator('eleven-waste-card .pickup ha-icon').get_attribute('icon'),'mdi:recycle')
 def test_broken_picture_falls_back_to_source_icon(self):
  self.page.route('**/broken.svg',lambda route:route.abort())
  self.page.evaluate('''()=>{window.card=document.createElement('eleven-waste-card');document.body.prepend(card);card.setConfig({entities:['sensor.paper']});card.hass={...hass,states:{'sensor.paper':{...hass.states['sensor.paper'],attributes:{icon:'mdi:package-variant',entity_picture:'/broken.svg'}}}}}''')
  self.page.locator('eleven-waste-card .pickup ha-icon').wait_for()
  self.assertEqual(self.page.locator('eleven-waste-card .pickup img').count(),0)
  self.assertEqual(self.page.locator('eleven-waste-card .pickup ha-icon').get_attribute('icon'),'mdi:package-variant')
 def test_new_sensor_can_be_selected_then_renamed(self):
  self.page.locator('.add').click()
  row=self.page.locator('.item').last
  row.locator('input[name=entity]').fill('sensor.paper')
  row.locator('input[name=name]').press_sequentially('Nieuw papier',delay=10)
  self.assertEqual(self.page.evaluate('editor._config.entities[2].name'),'Nieuw papier')
  self.assertEqual(self.page.evaluate('editor._config.entities[1].icon'),'mdi:leaf')
 def test_picture_geometry_and_mobile_desktop_themes(self):
  self.page.evaluate('''()=>{editor.remove();window.card=document.createElement('eleven-waste-card');document.body.append(card);card.setConfig({entities:['sensor.paper','sensor.gft']});card.hass=hass}''')
  for width in [320,1280]:
   self.page.set_viewport_size({'width':width,'height':900})
   for dark in [False,True]:
    self.page.evaluate("dark=>{document.body.style.cssText=dark?'background:#111;color:#eee;--primary-text-color:#eee;--secondary-background-color:#333;--secondary-text-color:#ccc':''}",dark)
    image=self.page.locator('eleven-waste-card .pickup img');image.wait_for()
    box=image.bounding_box()
    self.assertEqual((box['width'],box['height']),(20,20))
    name=self.page.locator('eleven-waste-card [data-info="sensor.paper"] .name-text').bounding_box()
    self.assertGreaterEqual(name['y'],box['y']+box['height'])
    self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    evidence=Path(os.environ.get('WASTE_EVIDENCE_DIR',self.evidence.name));evidence.mkdir(parents=True,exist_ok=True)
    self.page.screenshot(path=str(evidence/f'picture-{width}-{"dark" if dark else "light"}.png'))
  self.assertEqual(self.errors,[])
 def test_title_edit_does_not_restore_stale_rows(self):
  self.page.locator('.item input[name=name]').first.fill('Kartonnen dozen')
  self.page.locator('.main input[name=title]').fill('Mijn afval')
  self.assertEqual(self.page.evaluate('editor._config.entities[0].name'),'Kartonnen dozen')
 def test_external_and_structural_changes_still_rebuild(self):
  self.page.evaluate("editor.setConfig({...editor._config,title:'Extern',entities:[{entity:'sensor.paper',name:'Nieuw'},{entity:'sensor.gft',name:'Groen'}]})")
  self.assertEqual(self.page.locator('.main input[name=title]').input_value(),'Extern')
  self.page.locator('.item').first.locator('[data-move="1"]').click()
  self.assertEqual(self.page.locator('.item input[name=entity]').first.input_value(),'sensor.gft')
  self.page.locator('.item').first.locator('[data-remove]').click()
  self.assertEqual(self.page.locator('.item').count(),1)
  self.page.locator('.add').click()
  self.assertEqual(self.page.locator('.item').count(),2)
  self.assertEqual(self.page.locator('.item input[name=entity]').last.input_value(),'')

if __name__=='__main__':unittest.main()
