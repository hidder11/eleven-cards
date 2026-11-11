"""Compact header metrics across cards; synthetic HA, optional authorized screenshot."""
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


class CompactMetrics(unittest.TestCase):
    def test_compact_metrics(self):
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
        Thread(target=server.serve_forever, daemon=True).start()
        try:
            with sync_playwright() as p:
                options = {'executable_path': os.environ.get('CHROME_PATH', 'C:/Program Files/Google/Chrome/Application/chrome.exe')} if os.name == 'nt' else {}
                browser = p.chromium.launch(**options)
                try:
                    page = browser.new_page(viewport={'width': 780, 'height': 1200}, reduced_motion='reduce')
                    errors = []
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    page.goto(f'http://127.0.0.1:{server.server_port}/review/issues-53-56.html')
                    page.wait_for_function('window.issueFixturesReady && issueCards["compact-evcc"]')
                    for font in ['system-ui', 'monospace']:
                        page.evaluate('(font)=>document.body.style.fontFamily=font', font)
                        for width in [300, 360, 489, 640]:
                            for paint in ['native', 'material']:
                                for dark in [False, True]:
                                    page.evaluate('''({width,paint,dark})=>{
                                        document.querySelector('#issue-57').style.width=width+'px';issueTheme(dark,paint);
                                    }''', {'width': width, 'paint': paint, 'dark': dark})
                                    page.wait_for_timeout(100)
                                    rows = page.evaluate('''()=>['compact-weather','compact-energy','compact-car','compact-evcc'].map(key=>{
                                        const card=issueCards[key].card,r=card.shadowRoot;
                                        const metric=r.querySelector(key==='compact-weather'?'.weather-metrics [data-ui-metric]':key==='compact-energy'?'.flow-secondary [data-ui-metric]':key==='compact-car'?'.car-readings [data-ui-metric]':'.charging-readings [data-ui-metric]');
                                        const s=getComputedStyle(metric),v=getComputedStyle(metric.querySelector('.ui-metric-value')),t=getComputedStyle(metric.querySelector('.ui-metric-title')),i=getComputedStyle(metric.querySelector('.ui-metric-icon'));
                                        const peers=[...metric.parentElement.children].filter(e=>e.matches('[data-ui-metric]')&&Math.abs(e.getBoundingClientRect().top-metric.getBoundingClientRect().top)<1);
                                        const titleHeight=Math.max(...peers.map(e=>e.querySelector('.ui-metric-title').getBoundingClientRect().height));
                                        return {key,height:metric.getBoundingClientRect().height,labelHeight:titleHeight,valueHeight:metric.querySelector('.ui-metric-value').getBoundingClientRect().height,padding:s.padding,gap:s.rowGap,label:t.fontSize,labelLine:t.lineHeight,value:v.fontSize,valueLine:v.lineHeight,icon:i.width,iconRows:i.gridRow,overflow:r.querySelector('.content').scrollWidth>r.querySelector('.content').clientWidth+1};
                                    })''')
                                    with self.subTest(font=font, width=width, paint=paint, dark=dark):
                                        for row in rows:
                                            self.assertEqual(row['padding'], '8px', row)
                                            self.assertEqual(row['gap'], '2px', row)
                                            self.assertEqual(row['label'], '11px', row)
                                            self.assertEqual(row['value'], '20px', row)
                                            self.assertEqual(row['valueLine'], '25px', row)
                                            self.assertAlmostEqual(row['valueHeight'], 25, delta=1, msg=row)
                                            self.assertEqual(row['icon'], '20px', row)
                                            self.assertFalse(row['overflow'], row)
                                            # Subgrid shares the tallest title row within each card.
                                            # Font-dependent wrapping may add lines without changing density.
                                            self.assertAlmostEqual(row['height'] - row['labelHeight'],
                                                                   8 + 2 + 25 + 8,
                                                                   delta=1, msg=rows)
                    # Metric buttons retain their native entity action and keyboard target.
                    weather = page.locator('#issue-57 eleven-weather-card .weather-metrics button').first
                    page.evaluate('issueCards["compact-weather"].card.addEventListener("hass-more-info",e=>window.issue57Entity=e.detail.entityId)')
                    weather.focus()
                    weather.press('Enter')
                    self.assertEqual(page.evaluate('window.issue57Entity'), 'weather.home')
                    self.assertGreaterEqual(weather.bounding_box()['height'], 44)
                    # Long labels grow naturally; zero and missing values retain their semantics.
                    page.evaluate("document.querySelector('#issue-57').style.width='300px'")
                    page.wait_for_timeout(100)
                    car_metric = page.locator('#issue-57 eleven-car-card .car-readings [data-ui-metric]').first
                    short_height = car_metric.bounding_box()['height']
                    page.evaluate('''()=>{const {card}=issueCards['compact-car'];card.setConfig({...card._config,field_2_label:'A long label that wraps within a narrow information surface'});const r=issueCards['compact-car'];r.hass={...r.hass,states:{...r.hass.states,'sensor.soc':{state:'0',attributes:{unit_of_measurement:'%'}}}};card.hass=r.hass;}''')
                    self.assertEqual(car_metric.get_attribute('data-unavailable'), 'false')
                    self.assertGreater(car_metric.bounding_box()['height'], short_height)
                    self.assertTrue(car_metric.evaluate('(metric)=>metric.scrollWidth <= metric.clientWidth + 1'))
                    page.evaluate('''()=>{const r=issueCards['compact-car'];r.hass={...r.hass,states:{...r.hass.states,'sensor.soc':{state:'unavailable',attributes:{unit_of_measurement:'%'}}}};r.card.hass=r.hass;}''')
                    self.assertEqual(page.locator('#issue-57 eleven-car-card .car-readings [data-ui-metric]').first.get_attribute('data-unavailable'), 'true')
                    if os.environ.get('ISSUE_SCREENSHOTS') == '1':
                        page.reload()
                        page.wait_for_function('window.issueFixturesReady && issueCards["compact-car"].card._entityImage.status === "ready" && issueCards["compact-evcc"].card._entityImage.status === "ready"')
                        page.wait_for_timeout(200)
                        # Capture the actual compact metric rows together, omitting unrelated hero areas.
                        page.evaluate('''()=>{for(const key of ['compact-weather','compact-energy','compact-car','compact-evcc']){const r=issueCards[key].card.shadowRoot;const style=document.createElement('style');style.textContent='.scene,.circle-flow,.energy-topline,.hero,.gallery-top,.charging-status,.header-background,.scene-background,.header-region>[data-ui-metric],.evcc-tabs{display:none!important}.header-region,.header-scene{display:block!important;padding:0!important;margin:0!important}.content{height:auto!important}.header-region>.flow-secondary,.weather-metrics,.car-readings{margin:0!important}';r.append(style);}}''')
                        page.locator('#issue-57').screenshot(path=str(ROOT / 'docs/issue-fixes/issue-57.png'))
                    self.assertEqual(errors, [])
                finally:
                    browser.close()
        finally:
            server.shutdown()
            server.server_close()


if __name__ == '__main__':
    unittest.main()
