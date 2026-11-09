"""Offline browser smoke test; never connects to Home Assistant."""
from pathlib import Path
import unittest
import os

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
CARDS = [
    'eleven-dynamic-energy-price-card', 'eleven-history-graph-card',
    'eleven-timeline-card', 'eleven-overview-card', 'eleven-bar-chart',
    'eleven-heatmap-card', 'eleven-calendar-card',
    'eleven-car-card', 'eleven-weather-card', 'eleven-energy-flow-card',
    'eleven-camera-card', 'eleven-shopping-card', 'eleven-house-card',
    'eleven-actions-card', 'eleven-controls-card', 'eleven-waste-card',
    'eleven-room-card', 'eleven-appliance-planner',
    'eleven-scene-engine-card', 'eleven-material-house',
]


class CollectionSmokeTest(unittest.TestCase):
    def test_bundle_registers_cards_and_editors_without_errors(self):
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(**({'executable_path': os.environ['BROWSER_EXECUTABLE']} if os.getenv('BROWSER_EXECUTABLE') else {}))
            try:
                page = browser.new_page()
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.set_content('<!doctype html><html><body></body></html>')
                # Home Assistant supplies ha-form; this smoke test only checks
                # collection loading/registration, not the HA editor integration.
                page.add_script_tag(content="customElements.define('ha-form', class extends HTMLElement {});")
                bundle = ROOT / 'dist/eleven-cards.js'
                page.add_script_tag(path=str(bundle))
                page.add_script_tag(path=str(bundle))
                result = page.evaluate('''async (names) => {
                  const entries = window.customCards || [];
                  const cards = [];
                  for (const name of names) {
                    const Class = customElements.get(name);
                    if (!Class) throw new Error(`Missing card: ${name}`);
                    const element = document.createElement(name);
                    const editor = await Class.getConfigElement();
                    cards.push({name, element: element instanceof HTMLElement,
                      editor: editor instanceof HTMLElement,
                      entries: entries.filter(entry => entry.type === name).length});
                  }
                  return {cards, pickerCount: entries.length};
                }''', CARDS)
                self.assertEqual(result['pickerCount'], len(CARDS))
                for card in result['cards']:
                    with self.subTest(card=card['name']):
                        self.assertTrue(card['element'])
                        self.assertTrue(card['editor'])
                        self.assertEqual(card['entries'], 1)
                self.assertEqual(errors, [])
            finally:
                browser.close()


    def test_editor_cleared_bounds_stay_cleared_through_background_wrapper(self):
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(**({'executable_path': os.environ['BROWSER_EXECUTABLE']} if os.getenv('BROWSER_EXECUTABLE') else {}))
            try:
                page = browser.new_page()
                page.set_content('<!doctype html><html><body></body></html>')
                page.add_script_tag(content="customElements.define('ha-form', class extends HTMLElement {});")
                page.add_script_tag(path=str(ROOT / 'dist/eleven-cards.js'))
                for background in [False, {'variant': 'ribbon', 'enabled': True}, None]:
                    with self.subTest(background=background):
                        result = page.evaluate('''async (background) => {
                          const editor = await customElements.get('eleven-heatmap-card').getConfigElement();
                          document.body.replaceChildren(editor);
                          const config = {type:'custom:eleven-heatmap-card', entity:'sensor.example', scale_min:10, scale_max:100};
                          if (background !== null) config.card_background = background;
                          editor.setConfig(config);
                          editor.hass = {language:'en', states:{}, config:{time_zone:'UTC'}};
                          let emitted;
                          editor.addEventListener('config-changed', event => {emitted = event.detail.config;});
                          const form = editor.shadowRoot.querySelector('.native').firstElementChild.shadowRoot.querySelector('ha-form');
                          form.dispatchEvent(new CustomEvent('value-changed', {
                            detail:{value:{...form.data, title:'Changed title', scale_min:'', scale_max:undefined}}, bubbles:true, composed:true
                          }));
                          return {nativeHasMin:Object.hasOwn(form.data,'scale_min'), nativeHasMax:Object.hasOwn(form.data,'scale_max'),
                            outerHasMin:Object.hasOwn(emitted,'scale_min'), outerHasMax:Object.hasOwn(emitted,'scale_max'),
                            backgroundPresent:Object.hasOwn(emitted,'card_background'), background:emitted.card_background,
                            title:emitted.title, entity:emitted.entity};
                        }''', background)
                        self.assertFalse(result['nativeHasMin'])
                        self.assertFalse(result['nativeHasMax'])
                        self.assertFalse(result['outerHasMin'])
                        self.assertFalse(result['outerHasMax'])
                        self.assertEqual(result['backgroundPresent'], background is not None)
                        if background is not None:
                            self.assertEqual(result['background'], background)
                        self.assertEqual(result['title'], 'Changed title')
                        self.assertEqual(result['entity'], 'sensor.example')
            finally:
                browser.close()


if __name__ == '__main__':
    unittest.main(verbosity=2)
