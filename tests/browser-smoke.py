"""Offline browser smoke test; never connects to Home Assistant."""
from pathlib import Path
import unittest

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
CARDS = [
    'eleven-dynamic-energy-price-card', 'eleven-history-graph-card',
    'eleven-timeline-card', 'eleven-overview-card', 'eleven-bar-chart',
    'eleven-heatmap-card', 'eleven-calendar-card',
    'eleven-car-card', 'eleven-weather-card', 'eleven-energy-flow-card',
]


class CollectionSmokeTest(unittest.TestCase):
    def test_bundle_registers_cards_and_editors_without_errors(self):
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
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


if __name__ == '__main__':
    unittest.main(verbosity=2)
