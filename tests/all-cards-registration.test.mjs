import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, cpSync, mkdtempSync, rmSync, statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, basename, extname} from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

const root = new URL('../', import.meta.url);
const types = ['dynamic-energy-price-card','history-graph-card','timeline-card','overview-card','bar-chart','heatmap-card','calendar-card','weather-card','car-card','energy-flow-card','camera-card','camera-viewer-card','media-player-card','shopping-card','house-card','actions-card','controls-card','waste-card','appliance-planner','room-card','scene-engine-card','material-house'].map(type => `eleven-${type}`);
const standalones = ['cards/camera-card/dist/eleven-camera-card.js','cards/media-player-card/dist/eleven-media-player-card.js','cards/home-controls/dist/eleven-home-controls-card.js','cards/appliance-planner/dist/eleven-appliance-planner.js','cards/room-card/dist/eleven-room-card.js','cards/scene-engine-card/dist/eleven-scene-engine-card.js','experiments/material-house/dist/material-house.js'];
const read = path => readFileSync(new URL(path, root), 'utf8');
function runtime() {
  const registry = new Map(), window = {customCards: []};
  const context = vm.createContext({HTMLElement: class {}, window, customElements: {
    get: name => registry.get(name),
    define: (name, constructor) => {assert.ok(!registry.has(name), `duplicate ${name}`); registry.set(name, constructor);},
  }});
  return {registry, window, context};
}

test('collection includes all 22 approved card types exactly once without pilot baseline picker entries', () => {
  const {registry, window, context} = runtime();
  const entries = window.customCards;
  vm.runInContext(read('dist/eleven-cards.js'), context);
  assert.deepEqual(Array.from(window.customCards, card => card.type).sort(), [...types].sort());
  assert.equal(window.customCards, entries);
  for (const type of types) assert.equal(typeof registry.get(type), 'function', type);
  for (const alias of ['eleven-house-styled-card','eleven-house-card-editor','eleven-house-styled-card-editor','eleven-material-house-editor']) assert.ok(registry.has(alias), alias);
  for (const excluded of ['eleven-house-baseline','eleven-house-styled-baseline','eleven-house-baseline-editor','eleven-house-styled-baseline-editor','eleven-home-controls-card','eleven-climate-card','eleven-evcc-card']) assert.ok(!registry.has(excluded), excluded);
  const constructors = new Map(registry);
  vm.runInContext(read('dist/eleven-cards.js'), context);
  assert.deepEqual([...registry], [...constructors], 'repeat load preserves constructors');
  assert.deepEqual(Array.from(window.customCards, card => card.type).sort(), [...types].sort());
});

test('new standalone resources and collection coexist in either order with stable constructors and picker identity', () => {
  for (const collectionFirst of [true, false]) {
    const {registry, window, context} = runtime();
    const entries = window.customCards;
    const paths = [...standalones];
    paths[collectionFirst ? 'unshift' : 'push']('dist/eleven-cards.js');
    for (const path of paths) vm.runInContext(read(path), context);
    const constructors = new Map(registry);
    for (const path of [...paths].reverse()) vm.runInContext(read(path), context);
    assert.deepEqual([...registry], [...constructors]);
    assert.equal(window.customCards, entries);
    assert.deepEqual(Array.from(entries, card => card.type).sort(), [...types].sort());
  }
});

test('collection repairs a pre-existing pilot picker without replacing its constructors or production House', () => {
  const {registry, window, context} = runtime();
  const card = class {}, editor = class {};
  registry.set('eleven-material-house', card);
  registry.set('eleven-material-house-editor', editor);
  window.customCards.push({type:'eleven-house-baseline', name:'Old internal pilot base'});
  vm.runInContext(read('dist/eleven-cards.js'), context);
  assert.equal(registry.get('eleven-material-house'), card);
  assert.equal(registry.get('eleven-material-house-editor'), editor);
  assert.deepEqual(Array.from(window.customCards, entry => entry.type).sort(), [...types].sort());
  assert.notEqual(registry.get('eleven-house-card'), card);
});

test('actual legacy pilot registrations require removing the old resource before the collection', () => {
  const legacy = read('tests/fixtures/legacy-material-house-registrations.js');
  for (const legacyFirst of [true, false]) {
    const {registry, window, context} = runtime();
    for (const name of ['ElevenHouseCardEditor', 'ElevenHouseCard', 'HouseStylePreview', 'HouseStylePreviewEditor', 'MaterialHouseCard', 'MaterialHouseEditor']) context[name] = class {};
    if (legacyFirst) {
      vm.runInContext(legacy, context);
      const originalPilot = registry.get('eleven-material-house');
      vm.runInContext(read('dist/eleven-cards.js'), context);
      assert.equal(registry.get('eleven-material-house'), originalPilot);
      assert.deepEqual(Array.from(window.customCards, card => card.type).sort(), [...types].sort());
    } else {
      vm.runInContext(read('dist/eleven-cards.js'), context);
      assert.throws(() => vm.runInContext(legacy, context), /duplicate eleven-material-house/);
      assert.equal(window.customCards.length, types.length + 1, 'The unguarded old resource also restores its private baseline picker');
    }
  }
  const readme = read('README.md');
  assert.match(readme, /old\/unpackaged Material House standalone must be removed or replaced before loading the collection/i);
});

test('pilot source registration is idempotent and exposes exactly its public picker entry', () => {
  const {registry, window, context} = runtime();
  context.HouseStylePreview = class {};
  context.HouseStylePreviewEditor = class {};
  const source = `(()=>{${read('experiments/material-house/src/material-house.js')}\n})();`;
  vm.runInContext(source, context);
  const constructors = new Map(registry);
  vm.runInContext(source, context);
  assert.deepEqual([...registry], [...constructors]);
  assert.deepEqual(Array.from(window.customCards, card => card.type), ['eleven-material-house']);
});

test('root source build includes the provenance-checked Material House closure and is reproducible', () => {
  const scripts = JSON.parse(read('package.json')).scripts;
  assert.match(scripts.build, /python3 experiments\/material-house\/build\.py/);
  assert.match(scripts.check, /node --check experiments\/material-house\/dist\/material-house\.js/);
  const before = read('dist/eleven-cards.js');
  // Build from sources only, outside the checkout: other tests read its bundles
  // concurrently, so a reproducibility test must never rebuild their fixtures.
  const scratch = mkdtempSync(join(tmpdir(), 'eleven-source-build-'));
  try {
    const filter = path => statSync(path).isDirectory()
      ? !['dist','node_modules','.git','tests','docs','qa-evidence'].includes(basename(path))
      : ['.js','.mjs','.json','.py','.css'].includes(extname(path));
    for (const path of ['cards','shared','experiments/material-house','scripts','package.json']) {
      cpSync(new URL(path, root), join(scratch, path), {recursive: true, filter});
    }
    execFileSync(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/d', '/s', '/c', 'npm run build'] : ['run', 'build'], {cwd: scratch, stdio: 'pipe'});
    const rebuilt = readFileSync(join(scratch, 'dist/eleven-cards.js'), 'utf8');
    assert.equal(rebuilt, before);
    execFileSync('node', ['scripts/build.mjs'], {cwd: scratch, stdio: 'pipe'});
    assert.equal(readFileSync(join(scratch, 'dist/eleven-cards.js'), 'utf8'), rebuilt, 'packaging an already packaged pilot is idempotent');
  } finally {
    rmSync(scratch, {recursive: true, force: true});
  }
});
