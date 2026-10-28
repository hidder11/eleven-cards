import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
test('root HACS manifest selects a single self-contained collection bundle', () => {
  const manifest = JSON.parse(readFileSync(new URL('hacs.json', root), 'utf8'));
  assert.equal(manifest.name, 'Eleven Cards');
  assert.equal(manifest.filename, 'eleven-cards.js');
  assert.equal(manifest.content_in_root, false);
  assert.deepEqual(readdirSync(new URL('dist/', root)), ['eleven-cards.js']);
});

test('HACS collection download registers all cards without imports or duplicate resources', () => {
  const bundle = readFileSync(new URL('dist/eleven-cards.js', root), 'utf8');
  assert.doesNotMatch(bundle, /^\s*(?:import|export)\s/gm);
  const registry = new Map(), window = {};
  const context = vm.createContext({HTMLElement: class {}, window, customElements: {
    get: name => registry.get(name),
    define: (name, card) => { assert.ok(!registry.has(name)); registry.set(name, card); },
  }});
  vm.runInContext(bundle, context);
  vm.runInContext(bundle, context);
  assert.deepEqual([...registry.keys()].sort(), ['eleven-bar-chart', 'eleven-calendar-card', 'eleven-car-card', 'eleven-dynamic-energy-price-card', 'eleven-energy-flow-card', 'eleven-heatmap-card', 'eleven-history-graph-card', 'eleven-overview-card', 'eleven-shopping-card', 'eleven-shopping-card-editor', 'eleven-timeline-card', 'eleven-weather-card']);
  assert.equal(window.customCards.length, 11);
  assert.ok(!registry.has('eleven-evcc-card')&&!registry.has('eleven-climate-card'),'removed card types are not registered');
  for (const type of ['eleven-car-card', 'eleven-heatmap-card', 'eleven-calendar-card', 'eleven-weather-card']) {
    const pickerEntry = window.customCards.find(card => card.type === type);
    assert.match(pickerEntry?.name ?? '', /\(beta\)/i, `${type} should be marked beta in the card picker`);
    assert.equal(pickerEntry.preview, true);
  }
});

test('collection can overlap existing standalone modules safely during migration', () => {
  for (const collectionFirst of [true, false]) {
    const registry = new Map(), window = {};
    const context = vm.createContext({HTMLElement: class {}, window, customElements: {
      get: name => registry.get(name),
      define: (name, card) => { assert.ok(!registry.has(name)); registry.set(name, card); },
    }});
    const paths = ['cards/energy-flow-card/dist/eleven-energy-flow-card.js', 'cards/car-card/dist/eleven-car-card.js', 'cards/weather-card/dist/eleven-weather-card.js', 'cards/calendar-card/dist/eleven-calendar-card.js', 'cards/heatmap-card/dist/eleven-heatmap-card.js', 'cards/bar-chart/dist/eleven-bar-chart.js', 'cards/overview-card/dist/eleven-overview-card.js', 'cards/dynamic-energy-price-card/dist/eleven-dynamic-energy-price-card.js', 'cards/history-graph-card/dist/eleven-history-graph-card.js', 'cards/timeline-card/dist/eleven-timeline-card.js'];
    paths.push('cards/shopping-card/dist/eleven-shopping-card.js');
    paths[collectionFirst ? 'unshift' : 'push']('dist/eleven-cards.js');
    const capturedEntries=window.customCards=[];
    for (const path of paths) vm.runInContext(readFileSync(new URL(path, root), 'utf8'), context);
    assert.equal(window.customCards,capturedEntries,'picker registry identity is preserved');
    assert.equal(registry.size, 12);
    assert.equal(window.customCards.length, 11);
  }
});
