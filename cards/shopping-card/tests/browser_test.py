"""Synthetic browser contract tests. Never connects to HA."""
import json
import os
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = '''<style>body{margin:0;padding:16px;background:var(--primary-background-color,#f4f5f7);font-family:Arial;color:#202124}eleven-shopping-card{display:block;max-width:440px;margin:auto}ha-card{display:block;background:var(--card-background-color,white);border-radius:12px}</style><script>
window.calls=[];window.subs=[];window.unsubs=0;window.fail=false;
window.items=[{uid:'a',summary:'Volkoren brood',status:'needs_action'},{uid:'b',summary:'Tomaten',status:'needs_action'},{uid:'c',summary:'Koffie',status:'completed'}];
window.h={locale:{language:'nl'},states:{'todo.test':{state:'2',attributes:{friendly_name:'Boodschappen',supported_features:15}}},connection:{subscribeMessage:async(cb,msg)=>{subs.push({cb,msg});if(window.subFail)throw Error('Offline');if(!window.hold)cb({items:structuredClone(items)});return ()=>unsubs++}},callService:async(...args)=>{calls.push(args);if(fail)throw Error('Test geweigerd');},callWS:async(msg)=>{calls.push(msg);if(fail)throw Error('Test geweigerd')}};
window.push=()=>subs.at(-1).cb({items:structuredClone(items)});
</script>'''

class BrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or os.environ.get('AGENT_BROWSER_EXECUTABLE_PATH'), headless=True, args=['--no-sandbox'])
    @classmethod
    def tearDownClass(cls):
        cls.browser.close(); cls.pw.stop()
    def setUp(self):
        self.page = self.browser.new_page(viewport={'width':1280,'height':900}, timezone_id='UTC', has_touch=True, locale='nl-NL')
        self.page.set_default_timeout(3000)
        self.errors=[]
        self.page.on('pageerror', lambda e:self.errors.append(str(e)))
        self.page.set_content(FIXTURE)
        source = ROOT / 'dist/eleven-shopping-card.js' if __import__('os').environ.get('BUILT') else ROOT / 'src/eleven-shopping-card.js'
        if source.exists(): self.page.add_script_tag(content=source.read_text())
    def tearDown(self):
        self.page.close()
    def mount(self, before=''):
        self.page.evaluate(before or 'void 0')
        self.page.evaluate("window.card=document.createElement('eleven-shopping-card'); if(card.setConfig)card.setConfig({type:'custom:eleven-shopping-card',entity:'todo.test'});card.hass=h;document.body.append(card)")
        self.card=self.page.locator('eleven-shopping-card')
    def test_subscription(self):
        self.mount()
        expect(self.card).to_contain_text('Volkoren brood')
        self.assertEqual(self.page.evaluate('subs[0].msg'),{'type':'todo/item/subscribe','entity_id':'todo.test'})
        self.page.evaluate("items[0].summary='Ander brood';push()")
        expect(self.card).to_contain_text('Ander brood')
        self.page.evaluate('card.remove()')
        self.assertEqual(self.page.evaluate('unsubs'),1)
        self.assertEqual(self.errors,[])

    def test_mobile_inputs_stay_attached_during_live_updates(self):
        self.mount()
        self.page.set_viewport_size({'width':390,'height':740})
        draft=self.card.get_by_role('textbox',name='Nieuw product')
        draft.tap();draft.fill('Halfvolle melk')
        self.page.evaluate('''() => {
            window.originalInput=card.shadowRoot.querySelector('[data-key="add"]');
            window.focusLosses=0;
            originalInput.addEventListener('blur',()=>focusLosses++);
            originalInput.setSelectionRange(4,9);
            window.removals=[];
            window.inputObserver=new MutationObserver(records=>{
                for(const record of records)for(const node of record.removedNodes)
                    if(node===originalInput||node.contains?.(originalInput))removals.push(true);
            });
            inputObserver.observe(card.shadowRoot,{subtree:true,childList:true});
            for(let i=0;i<20;i++){card.hass={...h};items[0].summary='Brood '+i;push();}
        }''')
        result=self.page.evaluate('''() => ({same:card.shadowRoot.querySelector('[data-key="add"]')===originalInput,
            focused:card.shadowRoot.activeElement===originalInput,blur:focusLosses,removed:removals.length,
            value:originalInput.value,start:originalInput.selectionStart,end:originalInput.selectionEnd})''')
        self.assertEqual(result,{'same':True,'focused':True,'blur':0,'removed':0,'value':'Halfvolle melk','start':4,'end':9})
        expect(self.card).to_contain_text('Brood 19')
        self.card.get_by_role('button',name='Bewerk Tomaten').tap()
        name=self.card.get_by_role('textbox',name='Product',exact=True)
        name.fill('Paprika')
        self.page.evaluate('''() => {window.originalEdit=card.shadowRoot.querySelector('[data-key="name"]');
            window.editBlurs=0;originalEdit.addEventListener('blur',()=>editBlurs++);
            for(let i=0;i<20;i++){card.hass={...h};push();}
            items.unshift({uid:'new',summary:'Nieuw',status:'needs_action'});push();
            items=[];push();}''')
        self.assertEqual(self.page.evaluate('editBlurs'),0)
        self.assertTrue(self.page.evaluate('card.shadowRoot.querySelector(\'[data-key="name"]\')===originalEdit'))
        expect(name).to_be_focused();expect(name).to_have_value('Paprika')
        self.assertEqual(self.page.evaluate('calls.length'),0)
        self.assertEqual(self.errors,[])

    def test_add_toggle_failure_focus(self):
        self.mount()
        draft=self.card.get_by_role('textbox', name='Nieuw product')
        draft.fill('Melk')
        self.page.evaluate('card.hass={...h};push()')
        expect(draft).to_be_focused()
        expect(draft).to_have_value('Melk')
        draft.press('Enter')
        expect(draft).to_have_value('')
        self.assertEqual(self.page.evaluate('calls[0]'),['todo','add_item',{'item':'Melk'},{'entity_id':'todo.test'}])
        self.card.get_by_role('checkbox',name='Volkoren brood').click()
        self.assertEqual(self.page.evaluate('calls[1]'),['todo','update_item',{'item':'a','status':'completed'},{'entity_id':'todo.test'}])
        expect(self.card.get_by_role('checkbox',name='Volkoren brood')).not_to_be_checked()
        self.page.evaluate('fail=true')
        draft.fill('Niet kwijt')
        draft.press('Enter')
        expect(self.card.locator('.add-jobs')).to_contain_text('Niet opgeslagen · Test geweigerd')
        expect(draft).to_have_value('')
        expect(self.card.get_by_role('button',name='Opnieuw proberen: Niet kwijt')).to_have_count(1)
        self.assertEqual(self.errors,[])

    def test_edit_delete_clear_capabilities(self):
        self.mount()
        expect(self.card.get_by_role('button',name='Bewerk Volkoren brood')).to_have_count(1)
        self.card.get_by_role('button',name='Bewerk Volkoren brood').click()
        name=self.card.get_by_role('textbox',name='Product',exact=True)
        name.fill('Zuurdesem brood')
        self.page.evaluate('card.hass={...h};push()')
        expect(name).to_be_focused()
        expect(name).to_have_value('Zuurdesem brood')
        expect(self.card.get_by_label('Beschrijving')).to_have_count(0)
        self.page.evaluate('fail=true')
        self.card.get_by_role('button',name='Opslaan',exact=True).click()
        expect(name).to_have_value('Zuurdesem brood')
        expect(self.card.get_by_role('status')).to_contain_text('Test geweigerd')
        self.page.evaluate('fail=false')
        self.card.get_by_role('button',name='Opslaan',exact=True).click()
        expect(name).to_have_count(0)
        self.assertEqual(self.page.evaluate('calls.at(-1)'),['todo','update_item',{'item':'a','rename':'Zuurdesem brood'},{'entity_id':'todo.test'}])
        self.card.get_by_role('button',name='Bewerk Tomaten').click()
        self.card.get_by_role('button',name='Verwijderen',exact=True).click()
        self.assertEqual(self.page.evaluate('calls.at(-1)'),['todo','remove_item',{'item':['b']},{'entity_id':'todo.test'}])
        self.card.get_by_role('button',name='Afgevinkt wissen',exact=True).click()
        n=self.page.evaluate('calls.length')
        self.card.get_by_role('button',name='Annuleren',exact=True).click()
        self.assertEqual(self.page.evaluate('calls.length'),n)
        self.card.get_by_role('button',name='Afgevinkt wissen',exact=True).click()
        self.card.get_by_role('button',name='Definitief wissen',exact=True).click()
        self.assertEqual(self.page.evaluate('calls.at(-1)'),['todo','remove_item',{'item':['c']},{'entity_id':'todo.test'}])
        self.page.evaluate("h.states['todo.test'].attributes.supported_features=0;card.hass={...h}")
        expect(self.card.get_by_role('textbox',name='Nieuw product')).to_have_count(0)
        expect(self.card.get_by_role('button',name='Bewerk Tomaten')).to_have_count(0)
        expect(self.card.get_by_role('checkbox').first).to_be_disabled()
        self.assertEqual(self.errors,[])

    def test_metadata(self):
        self.mount("h.states['todo.test'].attributes.supported_features=127")
        self.card.get_by_role('button',name='Bewerk Volkoren brood').click()
        self.card.get_by_label('Beschrijving').fill('Twee stuks')
        self.card.get_by_label('Datum',exact=True).fill('2026-11-01')
        self.card.get_by_role('button',name='Opslaan',exact=True).click()
        self.assertEqual(self.page.evaluate('calls.at(-1)[2]'),{'item':'a','rename':'Volkoren brood','description':'Twee stuks','due_date':'2026-11-01'})
        self.card.get_by_role('button',name='Bewerk Tomaten').click()
        self.card.get_by_label('Soort deadline').select_option('datetime')
        self.card.get_by_label('Datum en tijd',exact=True).fill('2026-11-02T14:30')
        self.card.get_by_role('button',name='Opslaan',exact=True).click()
        self.assertEqual(self.page.evaluate('calls.at(-1)[2].due_datetime'),'2026-11-02T14:30:00.000Z')
        self.page.evaluate("items[0].due='2026-11-03';items[0].description='oud';push()")
        self.card.get_by_role('button',name='Bewerk Volkoren brood').click()
        self.card.get_by_label('Beschrijving').fill('')
        self.card.get_by_label('Datum',exact=True).fill('')
        self.card.get_by_role('button',name='Opslaan',exact=True).click()
        self.assertIsNone(self.page.evaluate('calls.at(-1)[2].due_date'))
        self.assertEqual(self.page.evaluate('calls.at(-1)[2].description'),'')
        self.assertEqual(self.errors,[])

    def test_reorder(self):
        self.mount()
        expect(self.card.get_by_role('button',name='Volgorde wijzigen')).to_have_count(1)
        self.card.get_by_role('button',name='Volgorde wijzigen').click()
        self.card.get_by_role('button',name='Omhoog: Tomaten').click()
        self.assertEqual(self.page.evaluate('calls.at(-1)'),{'type':'todo/item/move','entity_id':'todo.test','uid':'b'})
        self.assertEqual(self.card.locator('[data-edit]').all_text_contents(),['Volkoren brood','Tomaten','Koffie'])
        self.page.evaluate("items=[items[1],items[0],items[2]];push()")
        self.assertEqual(self.card.locator('[data-edit]').all_text_contents(),['Tomaten','Volkoren brood','Koffie'])
        self.card.get_by_role('button',name='Omlaag: Tomaten').click()
        self.assertEqual(self.page.evaluate('calls.at(-1)'),{'type':'todo/item/move','entity_id':'todo.test','uid':'b','previous_uid':'a'})
        self.page.evaluate('fail=true')
        self.card.get_by_role('button',name='Omlaag: Tomaten').click()
        expect(self.card.get_by_role('status')).to_contain_text('Test geweigerd')
        self.assertEqual(self.errors,[])

    def test_subscription_error_retry_unavailable(self):
        self.mount('subFail=true')
        expect(self.card.get_by_role('status')).to_contain_text('Offline')
        expect(self.card.get_by_role('button',name='Opnieuw proberen')).to_have_count(1)
        self.page.evaluate('subFail=false')
        self.card.get_by_role('button',name='Opnieuw proberen').click()
        expect(self.card).to_contain_text('Volkoren brood')
        expect(self.card.locator('.feedback')).to_have_text('')
        self.page.evaluate("h.states['todo.test'].state='unavailable';card.hass={...h}")
        expect(self.card).to_contain_text('Lijst niet beschikbaar')
        expect(self.card.get_by_role('checkbox').first).to_be_disabled()
        self.assertEqual(self.errors,[])

    def test_stale_subscription_and_mutation(self):
        self.mount("hold=true;h.connection.subscribeMessage=(cb,msg)=>{subs.push({cb,msg});return new Promise(resolve=>window.resolveSubscription=()=>resolve(()=>unsubs++))};void 0")
        self.page.evaluate("h.states['todo.other']={state:'0',attributes:{supported_features:15}};card.setConfig({entity:'todo.other'})")
        self.page.evaluate("subs[0].cb({items:[{uid:'old',summary:'STALE'}]})")
        expect(self.card).not_to_contain_text('STALE')
        self.page.evaluate('resolveSubscription();card.remove()')
        self.page.wait_for_timeout(20)
        self.assertEqual(self.page.evaluate('unsubs'),1)
        self.page.evaluate("h.connection={subscribeMessage:async(cb,msg)=>{subs.push({cb,msg});cb({items:structuredClone(items)});return ()=>unsubs++}};document.body.append(card);card.hass={...h}")
        expect(self.card).to_contain_text('Volkoren brood')
        self.page.evaluate('h.callService=()=>new Promise(r=>window.resolveMutation=r);card.hass={...h};void 0')
        self.card.get_by_role('textbox',name='Nieuw product').fill('oude opdracht')
        self.card.get_by_role('textbox',name='Nieuw product').press('Enter')
        self.page.evaluate("card.setConfig({entity:'todo.test'});resolveMutation()")
        expect(self.card.get_by_role('textbox',name='Nieuw product')).to_be_enabled()
        expect(self.card.get_by_role('textbox',name='Nieuw product')).to_have_value('')
        self.assertEqual(self.errors,[])

    def test_editor_discovery_configuration(self):
        self.mount()
        self.assertTrue(self.page.evaluate("window.customCards?.some(c=>c.type==='eleven-shopping-card')") is True)
        self.assertEqual(self.page.evaluate("card.constructor.getStubConfig(h).entity"),'todo.test')
        self.assertGreater(self.page.evaluate('card.getCardSize()'),0)
        self.page.evaluate("window.editor=card.constructor.getConfigElement();editor.setConfig({type:'custom:eleven-shopping-card',entity:'todo.test',title:'Mijn lijst'});editor.hass=h;document.body.append(editor);editor.addEventListener('config-changed',e=>window.changed=e.detail.config)")
        form=self.page.locator('eleven-shopping-card-editor ha-form')
        self.assertEqual(form.evaluate('(f)=>f.schema[0].selector.entity.domain'),'todo')
        self.page.evaluate("editor.shadowRoot.querySelector('ha-form').dispatchEvent(new CustomEvent('value-changed',{detail:{value:{entity:'todo.other',title:'Andere lijst'}}}))")
        self.assertEqual(self.page.evaluate('changed'),{'type':'custom:eleven-shopping-card','entity':'todo.other','title':'Andere lijst'})
        self.assertTrue(self.page.evaluate("(()=>{try{card.setConfig({entity:'sensor.invalid'});return false}catch{return true}})()"))
        self.assertEqual(self.errors,[])

    def test_visual_responsive_keyboard_states(self):
        self.mount()
        out=ROOT/'tests/evidence';out.mkdir(exist_ok=True)
        for width in [1280,390,320]:
            self.page.set_viewport_size({'width':width,'height':900})
            for dark in [False,True]:
                self.page.evaluate('''d=>{document.documentElement.style.cssText=d?'--primary-text-color:#e5e7eb;--secondary-text-color:#aeb4bf;--card-background-color:#20242c;--secondary-background-color:#303641;--primary-background-color:#13171d;--divider-color:#454c59;--primary-color:#91c6ff;--error-color:#ff9494':''}''',dark)
                self.card.screenshot(path=str(out/f'{width}-{"dark" if dark else "light"}.png'))
                fit=self.card.evaluate('(c)=>({width:c.clientWidth,scroll:c.shadowRoot.querySelector("ha-card").scrollWidth,heading:getComputedStyle(c.shadowRoot.querySelector("h2")).fontSize,padding:getComputedStyle(c.shadowRoot.querySelector(".content")).padding})')
                self.assertLessEqual(fit['scroll'],fit['width'])
                self.assertEqual(fit['heading'],'18px')
                self.assertEqual(fit['padding'],'16px')
        self.page.evaluate("items[0].summary='Heel erg lange productnaam met aanvullende instructies voor de boodschappenlijst en ongebrokenwoord'.repeat(3);push()")
        self.card.get_by_role('button',name='Volgorde wijzigen').click()
        self.card.screenshot(path=str(out/'320-long-reorder.png'))
        self.assertLessEqual(self.card.evaluate('(c)=>c.shadowRoot.querySelector("ha-card").scrollWidth'),self.card.evaluate('(c)=>c.clientWidth'))
        for b in self.card.get_by_role('button').all():
            box=b.bounding_box();self.assertGreaterEqual(box['width'],44);self.assertGreaterEqual(box['height'],44)
        self.card.locator('[data-edit]').first.focus();self.page.keyboard.press('Enter')
        expect(self.card.get_by_role('textbox',name='Product',exact=True)).to_be_focused()
        self.page.keyboard.press('Escape')
        expect(self.card.locator('[data-edit]').first).to_be_focused()
        self.page.evaluate('items=[];push()')
        expect(self.card).to_contain_text('Alles afgevinkt.')
        self.card.screenshot(path=str(out/'320-empty.png'))
        self.page.evaluate("h.states['todo.test'].state='unavailable';card.hass={...h}")
        self.card.screenshot(path=str(out/'320-unavailable.png'))
        self.assertEqual(self.errors,[])

    def test_surface_and_mobile_reorder_readability(self):
        self.mount()
        self.assertEqual(self.card.locator('ha-card').evaluate('(c)=>getComputedStyle(c).backgroundColor'),'rgb(255, 255, 255)')
        self.page.set_viewport_size({'width':320,'height':900})
        self.card.get_by_role('button',name='Volgorde wijzigen').click()
        self.assertGreaterEqual(self.card.locator('[data-edit]').first.bounding_box()['width'],180)
        self.assertEqual(self.errors,[])

    def test_metadata_display_escaping_and_reopen(self):
        self.mount("items[0].description='<img src=x onerror=alert(1)> Twee stuks';items[0].due='2026-11-01'")
        expect(self.card).to_contain_text('<img src=x onerror=alert(1)> Twee stuks')
        expect(self.card.locator('time')).to_have_attribute('datetime','2026-11-01')
        expect(self.card.locator('img')).to_have_count(0)
        self.card.get_by_role('checkbox',name='Koffie').click()
        self.assertEqual(self.page.evaluate('calls.at(-1)[2]'),{'item':'c','status':'needs_action'})
        self.page.evaluate("items[2].status='needs_action';push()")
        expect(self.card.get_by_role('checkbox',name='Koffie')).not_to_be_checked()
        self.assertEqual(self.errors,[])

    def test_focus_after_slow_mutation(self):
        self.mount("h.callService=()=>new Promise(resolve=>window.finish=resolve);void 0")
        draft=self.card.get_by_role('textbox',name='Nieuw product')
        draft.fill('Melk');draft.press('Enter')
        expect(draft).to_be_enabled()
        expect(draft).to_have_value('')
        expect(draft).to_be_focused()
        draft.fill('Eieren')
        self.page.evaluate('finish()')
        expect(draft).to_have_value('Eieren')
        expect(draft).to_be_focused()
        self.assertEqual(self.errors,[])

    def test_add_button_returns_focus_immediately(self):
        self.mount("h.callService=()=>new Promise(()=>{});void 0")
        draft=self.card.get_by_role('textbox',name='Nieuw product')
        draft.fill('Melk')
        self.card.get_by_role('button',name='Toevoegen',exact=True).tap()
        expect(draft).to_be_enabled();expect(draft).to_be_focused()
        expect(draft).to_have_value('')

    def test_background_add_queue_failure_retry_and_focus(self):
        self.mount("window.writes=[];h.callService=(...args)=>{calls.push(args);return new Promise((resolve,reject)=>writes.push({resolve,reject}))};void 0")
        draft=self.card.get_by_role('textbox',name='Nieuw product')
        draft.fill('Melk')
        self.page.evaluate('''() => {window.inputNode=card.shadowRoot.querySelector('[data-key="add"]');window.blurs=0;
          inputNode.addEventListener('blur',()=>blurs++);window.removals=[];
          new MutationObserver(rs=>{for(const r of rs)for(const n of r.removedNodes)if(n===inputNode||n.contains?.(inputNode))removals.push(1)}).observe(card.shadowRoot,{subtree:true,childList:true});}''')
        draft.press('Enter');draft.fill('Eieren');draft.press('Enter');draft.fill('Volgende')
        self.assertEqual(self.page.evaluate('calls.length'),1)
        expect(self.card.locator('.add-job .summary-text')).to_have_text(['Melk','Eieren'])
        expect(self.card.locator('.add-job .metadata')).to_have_text(['Opslaan…','Opslaan…'])
        self.page.evaluate("writes[0].reject(Error('Offline'))")
        self.page.wait_for_function('calls.length===2')
        expect(self.card.locator('.add-job').first).to_contain_text('Niet opgeslagen · Offline')
        self.assertEqual(self.page.evaluate('calls[1][2]'),{'item':'Eieren'})
        self.page.evaluate('writes[1].resolve();card.hass={...h};push()')
        expect(draft).to_have_value('Volgende');expect(draft).to_be_focused()
        self.assertEqual(self.page.evaluate('blurs'),0)
        self.assertEqual(self.page.evaluate('removals.length'),0)
        self.assertTrue(self.page.evaluate('inputNode===card.shadowRoot.querySelector(\'[data-key="add"]\')'))
        self.card.get_by_role('button',name='Opnieuw proberen: Melk').click()
        self.page.wait_for_function('calls.length===3')
        self.page.evaluate('writes[2].resolve()')
        expect(self.card.get_by_role('button',name='Opnieuw proberen: Melk')).to_have_count(0)
        expect(draft).to_have_value('Volgende')
        self.assertEqual(self.page.evaluate('calls[2]'),['todo','add_item',{'item':'Melk'},{'entity_id':'todo.test'}])
        self.assertEqual(self.errors,[])

    def test_async_feedback_is_part_of_product_list(self):
        self.mount("window.writes=[];h.callService=(...args)=>{calls.push(args);return new Promise((resolve,reject)=>writes.push({resolve,reject}))};void 0")
        draft=self.card.get_by_role('textbox',name='Nieuw product')
        draft.fill('Melk');draft.press('Enter')
        job=self.card.locator('.add-job').first
        expect(job.locator('.summary-text')).to_have_text('Melk')
        expect(job.locator('.metadata')).to_have_text('Opslaan…')
        expect(job.get_by_role('checkbox')).to_have_count(0)
        self.assertTrue(job.evaluate('(r)=>r.parentElement.previousElementSibling.matches(".add")'))
        self.assertEqual(job.locator('.summary-text').evaluate('(e)=>getComputedStyle(e).color'),self.card.locator('[data-row="a"] .summary-text').evaluate('(e)=>getComputedStyle(e).color'))
        self.assertAlmostEqual(job.locator('.summary-text').bounding_box()['x'],self.card.locator('[data-row="a"] .summary-text').bounding_box()['x'])
        expect(self.card.locator('.feedback')).to_have_text('')
        self.page.evaluate("writes[0].reject(Error('<img src=x onerror=alert(1)> Offline'))")
        expect(job.locator('.metadata')).to_have_text('Niet opgeslagen · <img src=x onerror=alert(1)> Offline')
        expect(job.locator('img')).to_have_count(0)
        retry=job.get_by_role('button',name='Opnieuw proberen: Melk')
        expect(retry).to_have_text('Opnieuw')
        retry.focus();retry.press('Enter')
        expect(draft).to_be_focused()
        expect(job.locator('.metadata')).to_have_text('Opslaan…')
        self.page.evaluate('writes[1].resolve()')
        expect(job).to_have_count(0)
        self.page.evaluate('items=[];push()')
        draft.fill('<svg onload=alert(1)> Eieren');draft.press('Enter')
        expect(self.card.locator('.add-job .summary-text')).to_have_text('<svg onload=alert(1)> Eieren')
        expect(self.card).not_to_contain_text('Alles afgevinkt.')
        expect(self.card.locator('.add-job .summary-text svg')).to_have_count(0)
        self.page.evaluate('writes[2].resolve()')
        expect(self.card).to_contain_text('Alles afgevinkt.')
        self.assertEqual(self.errors,[])

    def test_async_rows_responsive_theme_and_english(self):
        self.mount("window.writes=[];h.callService=(...args)=>{calls.push(args);return new Promise((resolve,reject)=>writes.push({resolve,reject}))};void 0")
        draft=self.card.get_by_role('textbox',name='Nieuw product')
        draft.fill('Halfvolle melk');draft.press('Enter')
        draft.fill('Volkoren crackers met zaden en extra lange productomschrijving');draft.press('Enter')
        draft.fill('Volgend product')
        out=ROOT/'tests/evidence'
        for width in [1280,390,320]:
            self.page.set_viewport_size({'width':width,'height':900})
            for dark in [False,True]:
                self.page.evaluate("d=>document.documentElement.style.cssText=d?'--primary-text-color:#e5e7eb;--secondary-text-color:#aeb4bf;--card-background-color:#20242c;--secondary-background-color:#303641;--primary-background-color:#13171d;--divider-color:#454c59;--primary-color:#91c6ff;--error-color:#ff9494':''",dark)
                self.card.screenshot(path=str(out/f'async-integrated-{width}-{"dark" if dark else "light"}.png'))
                self.assertLessEqual(self.card.locator('ha-card').evaluate('(c)=>c.scrollWidth'),self.card.evaluate('(c)=>c.clientWidth'))
                expect(draft).to_have_value('Volgend product');expect(draft).to_be_focused()
                self.assertEqual(self.card.locator('.add-jobs').get_attribute('aria-live'),'polite')
        self.page.evaluate("writes[0].reject(Error('Verbinding verbroken. Probeer het opnieuw zodra de lijst bereikbaar is.'))")
        self.page.wait_for_function('calls.length===2')
        for dark in [False,True]:
            self.page.evaluate("d=>document.documentElement.style.cssText=d?'--primary-text-color:#e5e7eb;--secondary-text-color:#aeb4bf;--card-background-color:#20242c;--secondary-background-color:#303641;--primary-background-color:#13171d;--divider-color:#454c59;--primary-color:#91c6ff;--error-color:#ff9494':''",dark)
            self.card.screenshot(path=str(out/f'async-integrated-failed-320-{"dark" if dark else "light"}.png'))
            self.assertLessEqual(self.card.locator('ha-card').evaluate('(c)=>c.scrollWidth'),self.card.evaluate('(c)=>c.clientWidth'))
            retry=self.card.get_by_role('button',name='Opnieuw proberen: Halfvolle melk')
            box=retry.bounding_box();self.assertGreaterEqual(box['height'],44);self.assertGreaterEqual(box['width'],44)
            self.assertEqual(self.card.locator('.add-job .summary-text').first.evaluate('(e)=>getComputedStyle(e).color'),self.card.locator('[data-row="a"] .summary-text').evaluate('(e)=>getComputedStyle(e).color'))
        self.page.evaluate("h.locale.language='en';card.hass={...h}")
        expect(self.card.locator('.add-job .metadata').first).to_contain_text('Not saved · ')
        expect(self.card.locator('.add-job .metadata').nth(1)).to_have_text('Saving…')
        expect(self.card.get_by_role('button',name='Retry: Halfvolle melk')).to_have_text('Retry')
        self.assertEqual(self.errors,[])

    def test_background_add_does_not_leak_into_new_entity(self):
        self.mount("h.callService=(...args)=>{calls.push(args);return new Promise((resolve,reject)=>window.rejectOld=reject)};void 0")
        draft=self.card.get_by_role('textbox',name='Nieuw product')
        draft.fill('Oude lijst');draft.press('Enter')
        self.page.evaluate("h.states['todo.other']={state:'0',attributes:{supported_features:15}};card.setConfig({entity:'todo.other'});rejectOld(Error('Oude fout'))")
        expect(self.card.locator('.feedback')).to_have_text('')
        expect(self.card.locator('.add-job')).to_have_count(0)
        self.assertEqual(self.errors,[])

    def test_edit_focus_after_save(self):
        self.mount()
        self.card.get_by_role('button',name='Bewerk Tomaten').click()
        self.card.get_by_role('textbox',name='Product',exact=True).fill('Paprika')
        self.card.get_by_role('button',name='Opslaan',exact=True).click()
        expect(self.card.get_by_role('button',name='Bewerk Tomaten')).to_be_focused()
        self.assertEqual(self.errors,[])

    def test_metadata_form_mobile_theme(self):
        self.mount("h.states['todo.test'].attributes.supported_features=127")
        self.page.set_viewport_size({'width':320,'height':900})
        self.page.evaluate("document.documentElement.style.cssText='--primary-text-color:#e5e7eb;--secondary-text-color:#aeb4bf;--card-background-color:#20242c;--secondary-background-color:#303641;--divider-color:#454c59'")
        self.assertEqual(self.card.get_by_role('textbox',name='Nieuw product').evaluate('(e)=>getComputedStyle(e,"::placeholder").color'),'rgb(174, 180, 191)')
        self.card.get_by_role('button',name='Bewerk Tomaten').click()
        select=self.card.get_by_label('Soort deadline')
        self.assertGreaterEqual(select.bounding_box()['height'],44)
        self.assertEqual(select.evaluate('(e)=>getComputedStyle(e).color'),'rgb(229, 231, 235)')
        self.card.screenshot(path=str(ROOT/'tests/evidence/320-edit-dark.png'))
        self.assertLessEqual(self.card.evaluate('(c)=>c.shadowRoot.querySelector("ha-card").scrollWidth'),self.card.evaluate('(c)=>c.clientWidth'))
        self.assertEqual(self.errors,[])

    def test_delete_only_provider(self):
        self.mount("h.states['todo.test'].attributes.supported_features=2")
        expect(self.card.get_by_role('button',name='Bewerk Tomaten')).to_have_count(0)
        expect(self.card.get_by_role('textbox')).to_have_count(0)
        expect(self.card.get_by_role('checkbox').first).to_be_disabled()
        self.card.get_by_role('button',name='Verwijderen',exact=True).first.click()
        self.assertEqual(self.page.evaluate('calls.at(-1)'),['todo','remove_item',{'item':['a']},{'entity_id':'todo.test'}])
        self.assertEqual(self.errors,[])

    def test_late_resolved_old_subscription_is_unsubscribed(self):
        self.mount("window.resolvers=[];h.connection.subscribeMessage=(cb,msg)=>{subs.push({cb,msg});return new Promise(resolve=>resolvers.push(()=>resolve(()=>unsubs++)))};void 0")
        self.page.evaluate("h.states['todo.other']={state:'0',attributes:{supported_features:15}};card.setConfig({entity:'todo.other'})")
        self.page.evaluate('resolvers[0]()')
        self.page.wait_for_timeout(10)
        self.assertEqual(self.page.evaluate('unsubs'),1)
        self.page.evaluate("subs[1].cb({items:[{uid:'new',summary:'Nieuwe lijst',status:'needs_action'}]});resolvers[1]()")
        expect(self.card).to_contain_text('Nieuwe lijst')
        self.page.evaluate('card.remove()')
        self.assertEqual(self.page.evaluate('unsubs'),2)
        self.assertEqual(self.errors,[])

    def test_loading_and_failure_are_distinct(self):
        self.mount('hold=true')
        expect(self.card).to_contain_text('Laden…')
        self.page.set_viewport_size({'width':320,'height':900})
        self.card.screenshot(path=str(ROOT/'tests/evidence/320-loading.png'))
        self.page.evaluate('subFail=true;card.remove();document.body.append(card)')
        expect(self.card.get_by_role('status')).to_contain_text('Offline')
        expect(self.card).not_to_contain_text('Laden…')
        self.card.screenshot(path=str(ROOT/'tests/evidence/320-error.png'))
        self.assertEqual(self.errors,[])

    def test_touch_phone(self):
        self.mount()
        self.page.set_viewport_size({'width':320,'height':740})
        self.card.get_by_role('button',name='Bewerk Tomaten').tap()
        self.card.get_by_role('textbox',name='Product',exact=True).fill('Paprika')
        self.card.get_by_role('button',name='Opslaan',exact=True).tap()
        self.assertEqual(self.page.evaluate('calls.at(-1)[2]'),{'item':'b','rename':'Paprika'})
        self.card.get_by_role('button',name='Volgorde wijzigen').tap()
        self.card.get_by_role('button',name='Omhoog: Tomaten').tap()
        self.assertEqual(self.page.evaluate('calls.at(-1).type'),'todo/item/move')
        self.card.screenshot(path=str(ROOT/'tests/evidence/320-touch.png'))
        self.assertEqual(self.errors,[])

if __name__=='__main__': unittest.main(verbosity=2)
