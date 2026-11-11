"""Rendered regressions for #41/#42/#46/#47/#48 using synthetic HA data.

Set ISSUE_SCREENSHOTS=1 only with explicit screenshot authorization.
The editor uses a minimal ha-form stub; this is not live HA verification.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import os
import unittest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class OpenIssues(unittest.TestCase):
    def test_rendered_fixes(self):
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with sync_playwright() as p:
                options = {'executable_path': os.environ.get('CHROME_PATH', 'C:/Program Files/Google/Chrome/Application/chrome.exe')} if os.name == 'nt' else {}
                browser = p.chromium.launch(**options)
                try:
                    page = browser.new_page(viewport={'width': 560, 'height': 1000}, reduced_motion='reduce')
                    errors = []
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    page.goto(f'http://127.0.0.1:{server.server_port}/review/issue-fixes.html')
                    page.wait_for_function('window.issueFixturesReady && issueCards["car-card"].card._entityImage.status==="ready" && issueCards["calendar-card"].card._statuses["calendar.family"]==="ready"')
                    for width in [489, 320]:
                        for paint in ['native', 'material']:
                            for dark in [False, True]:
                                page.evaluate('''async ({width,paint,dark})=>{
                                    document.querySelectorAll('main>section').forEach(e=>e.style.width=width+'px');
                                    const {applyReviewTheme}=await import('/review/theme.js');applyReviewTheme(dark,paint);
                                    for(const {card,hass} of Object.values(issueCards))card.hass={...hass,themes:{darkMode:dark}};
                                    await new Promise(requestAnimationFrame);
                                }''', {'width': width, 'paint': paint, 'dark': dark})
                                for view in ['list', 'columns', 'month']:
                                    for compact in [False, True]:
                                        page.evaluate('''({view,compact})=>{const c=issueCards['calendar-card'].card;c.setConfig({...c._config,view,compact});}''', {'view': view, 'compact': compact})
                                        page.wait_for_timeout(30)
                                        dimensions = page.evaluate('''()=>{
                                            const c=issueCards['calendar-card'].card,r=c.shadowRoot,b=r.querySelector('.calendar-body'),box=e=>e.getBoundingClientRect();
                                            return {host:box(c).bottom,card:box(r.querySelector('ha-card')).bottom,body:box(b).bottom,next:box(document.querySelector('.following')).top,scroll:b.scrollHeight,client:b.clientHeight};
                                        }''')
                                        self.assertLessEqual(dimensions['card'], dimensions['host'] + 1, (width, paint, dark, view, compact, dimensions))
                                        self.assertLessEqual(dimensions['body'], dimensions['host'] + 1)
                                        self.assertGreaterEqual(dimensions['next'], dimensions['host'])
                                        if view == 'list':
                                            self.assertGreater(dimensions['scroll'], dimensions['client'])
                                # The same theme roles as graph plots; no visible CSS border.
                                style = page.locator('eleven-overview-card .metric').first.evaluate('(e)=>({border:getComputedStyle(e).borderWidth,background:getComputedStyle(e).background,shadow:getComputedStyle(e).boxShadow})')
                                self.assertEqual(style['border'], '0px')
                                if paint == 'material':
                                    self.assertNotEqual(style['shadow'], 'none')
                                # Return reading below its wire and above the home endpoint.
                                geometry = page.evaluate('''()=>{const c=issueCards['energy-flow-card'].card,r=c.shadowRoot,scene=r.querySelector('.circle-scene'),reading=r.querySelector('[data-flow-value=return]'),home=r.querySelector('[data-node=home]');return {height:scene.clientHeight,top:reading.offsetTop,bottom:reading.offsetTop+reading.offsetHeight,node:home.offsetTop,cardScroll:c.scrollWidth,cardClient:c.clientWidth};}''')
                                self.assertLessEqual(geometry['height'], 128)
                                self.assertGreater(geometry['top'], 8)
                                self.assertLessEqual(geometry['bottom'], geometry['node'])
                                self.assertLessEqual(geometry['cardScroll'], geometry['cardClient'] + 1)
                    # Native disclosure, keyboard operation, HA echoes, reorder and delete.
                    editor = page.locator('eleven-controls-editor')
                    entries = editor.locator('details.item')
                    self.assertEqual(entries.count(), 3)
                    entries.nth(0).locator('summary strong').click()
                    self.assertTrue(entries.nth(0).evaluate('(e)=>e.open'))
                    entries.nth(0).locator('summary').focus()
                    page.keyboard.press('Enter')
                    self.assertFalse(entries.nth(0).evaluate('(e)=>e.open'))
                    entries.nth(1).locator('summary strong').click()
                    page.evaluate('issueWasteEditor.setConfig(structuredClone(issueWasteEditor._config))')
                    self.assertTrue(entries.nth(1).evaluate('(e)=>e.open'))
                    entries.nth(1).locator('[data-move="-1"]').click()
                    self.assertIn('Papier', entries.nth(0).locator('summary').inner_text())
                    self.assertTrue(entries.nth(0).evaluate('(e)=>e.open'))
                    self.assertFalse(entries.nth(1).evaluate('(e)=>e.open'))
                    entries.nth(0).locator('[data-remove]').click()
                    self.assertEqual(entries.count(), 2)
                    editor.locator('.add').click()
                    self.assertEqual(entries.count(), 3)
                    self.assertTrue(entries.nth(2).evaluate('(e)=>e.open'))
                    # Already-loaded production image; no editor interaction was required.
                    image = page.locator('eleven-car-card .picture img')
                    self.assertTrue(image.evaluate('(e)=>e.complete && e.naturalWidth>0'))
                    source = page.evaluate('issueCards["car-card"].card._entityImage.source')
                    self.assertIn('token=synthetic-current-token', source)
                    # Restore the original scenarios before optional evidence capture.
                    page.reload()
                    page.wait_for_function('window.issueFixturesReady && issueCards["car-card"].card._entityImage.status==="ready"')
                    # Auto height (masonry) still grows to include its complete agenda.
                    auto = page.evaluate('''async()=>{const c=issueCards['calendar-card'].card;c.style.height='auto';await new Promise(requestAnimationFrame);const r=c.shadowRoot,b=r.querySelector('.calendar-body');return {scroll:b.scrollHeight,client:b.clientHeight};}''')
                    self.assertLessEqual(auto['scroll'], auto['client'] + 1)
                    page.evaluate('issueCards["calendar-card"].card.style.height="390px"')
                    if os.environ.get('ISSUE_SCREENSHOTS') == '1':
                        out = ROOT / 'docs/qa/issues-41-48'
                        out.mkdir(parents=True, exist_ok=True)
                        for number in [41, 42, 46, 47, 48]:
                            paint = 'material' if number == 46 else 'native'
                            page.evaluate('async paint=>(await import("/review/theme.js")).applyReviewTheme(true,paint)', paint)
                            page.locator(f'#issue-{number}').screenshot(path=str(out / f'issue-{number}.png'), animations='disabled')
                    self.assertEqual(errors, [])
                finally:
                    browser.close()
        finally:
            server.shutdown()
            server.server_close()


if __name__ == '__main__':
    unittest.main(verbosity=2)
