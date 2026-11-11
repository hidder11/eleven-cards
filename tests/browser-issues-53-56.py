"""Rendered issue regressions with synthetic HA data.

Set ISSUE_SCREENSHOTS=1 only with explicit screenshot authorization.
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


class IssueLayouts(unittest.TestCase):
    def test_layouts(self):
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
        Thread(target=server.serve_forever, daemon=True).start()
        try:
            with sync_playwright() as p:
                options = {'executable_path': os.environ.get('CHROME_PATH', 'C:/Program Files/Google/Chrome/Application/chrome.exe')} if os.name == 'nt' else {}
                browser = p.chromium.launch(**options)
                try:
                    page = browser.new_page(viewport={'width': 760, 'height': 1100}, reduced_motion='reduce')
                    errors = []
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    page.goto(f'http://127.0.0.1:{server.server_port}/review/issues-53-56.html')
                    page.wait_for_function('window.issueFixturesReady && issueCards.car.card._entityImage.status === "ready" && issueCards.evcc.card._entityImage.status === "ready" && issueCards.calendar.card._statuses["calendar.family"] === "ready"')
                    for width in [300, 360, 489, 640]:
                        for compact in [False, True]:
                            for paint in ['native', 'material']:
                                for dark in [False, True]:
                                    with self.subTest(width=width, compact=compact, paint=paint, dark=dark):
                                        page.evaluate('''({width,compact,paint,dark})=>{
                                            document.querySelectorAll('main>section').forEach(e=>e.style.width=width+'px');
                                            for(const {card} of Object.values(issueCards))card.setConfig({...card._config,compact});
                                            issueTheme(dark,paint);
                                        }''', {'width': width, 'compact': compact, 'paint': paint, 'dark': dark})
                                        page.wait_for_timeout(70)
                                        geometry = page.evaluate('''()=>{
                                            const hero=key=>{const r=issueCards[key].card.shadowRoot,c=r.querySelector('.content').getBoundingClientRect();return ['.car-stage','.picture','.battery-progress'].map(s=>{const b=r.querySelector(s).getBoundingClientRect();return {x:b.x-c.x,y:b.y-c.y,width:b.width,height:b.height};});};
                                            const energy=issueCards['energy-bars'].card.shadowRoot;
                                            const bars=[...energy.querySelectorAll('[data-energy-panel="sun"] [data-ui-bar]')].map(e=>({height:e.getBoundingClientRect().height,radius:getComputedStyle(e).borderRadius,fillRadius:getComputedStyle(e.firstElementChild).borderRadius,decorative:e.getAttribute('aria-hidden'),motion:!!e.querySelector('.ui-bar-motion')}));
                                            const units=[...issueCards['energy-units'].card.shadowRoot.querySelectorAll('.flow-unit')].map(e=>{const range=document.createRange();range.selectNodeContents(e.previousSibling);return e.getBoundingClientRect().left-range.getBoundingClientRect().right;});
                                            const r=issueCards.calendar.card.shadowRoot,legend=r.querySelector('.legend');
                                            return {car:hero('car'),evcc:hero('evcc'),bars,units,legend:{height:legend.getBoundingClientRect().height,bottom:getComputedStyle(legend).marginBottom,header:getComputedStyle(r.querySelector('.content>.header-actions')).marginBottom,overflow:legend.scrollWidth>legend.clientWidth+1},overflow:Object.values(issueCards).filter(({card})=>{const c=card.shadowRoot.querySelector('.content');return c.scrollWidth>c.clientWidth+1;}).map(({card})=>card.dataset.card)};
                                        }''')
                                        for ordinary, evcc in zip(geometry['car'], geometry['evcc']):
                                            for key in ['x', 'y', 'width', 'height']:
                                                self.assertAlmostEqual(ordinary[key], evcc[key], delta=1, msg=geometry)
                                        self.assertGreater(len(geometry['bars']), 0)
                                        for bar in geometry['bars']:
                                            self.assertEqual(bar, {'height': 12, 'radius': '999px', 'fillRadius': '999px', 'decorative': 'true', 'motion': False})
                                        self.assertEqual(len(geometry['units']), 3)
                                        self.assertTrue(all(gap >= 3.9 for gap in geometry['units']), geometry)
                                        self.assertEqual(geometry['legend']['bottom'], '8px')
                                        self.assertEqual(geometry['legend']['header'], '4px')
                                        self.assertFalse(geometry['legend']['overflow'])
                                        self.assertEqual(geometry['overflow'], [])
                    # Long labels wrap and legend actions retain their keyboard behavior.
                    page.evaluate('''()=>{const c=issueCards.calendar.card;c.setConfig({...c._config,entities:[{entity:'calendar.family',name:'A long calendar name that wraps on narrow cards'},{entity:'calendar.work',name:'Work'}]});document.querySelector('#issue-56').style.width='300px';}''')
                    legend = page.locator('#issue-56 [data-ui-legend]').first
                    legend.focus()
                    legend.press('Enter')
                    self.assertEqual(legend.get_attribute('aria-pressed'), 'false')
                    legend.press('Shift+Enter')
                    self.assertEqual(page.locator('#issue-56 [data-ui-legend]').evaluate_all('(els)=>els.map(e=>e.getAttribute("aria-pressed"))'), ['true', 'false'])
                    # Touch keeps the larger targets while pointer layout remains compact.
                    touch = browser.new_context(has_touch=True)
                    touch_page = touch.new_page()
                    touch_page.goto(f'http://127.0.0.1:{server.server_port}/review/issues-53-56.html')
                    touch_page.wait_for_function('window.issueFixturesReady')
                    self.assertTrue(touch_page.locator('#issue-56 [data-ui-legend]').evaluate_all('(els)=>els.every(e=>e.getBoundingClientRect().height>=44)'))
                    touch.close()
                    if os.environ.get('ISSUE_SCREENSHOTS') == '1':
                        page.reload()
                        page.wait_for_function('window.issueFixturesReady && issueCards.car.card._entityImage.status === "ready" && issueCards.evcc.card._entityImage.status === "ready"')
                        page.wait_for_timeout(300)
                        output = ROOT / 'docs' / 'issue-fixes'
                        output.mkdir(parents=True, exist_ok=True)
                        for number in [53, 54, 55, 56]:
                            page.locator(f'#issue-{number}').screenshot(path=str(output / f'issue-{number}.png'))
                    self.assertEqual(errors, [])
                finally:
                    browser.close()
        finally:
            server.shutdown()
            server.server_close()


if __name__ == '__main__':
    unittest.main()
