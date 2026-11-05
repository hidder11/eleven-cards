import test from 'node:test';
import assert from 'node:assert/strict';

test('waste preview includes Papier, Restafval and GFT with distinct future sensor dates', async () => {
  globalThis.window ??= {};
  const {configs, createFixture} = await import('../review/fixtures.js');
  const entry = configs.find(([name]) => name === 'waste-card');
  const entities = entry[2].entities;
  assert.deepEqual(entities.map(e => e.name), ['Papier', 'Restafval', 'GFT']);
  assert.equal(new Set(entities.map(e => e.entity)).size, 3);
  const hass = createFixture('waste-card');
  const dates = entities.map(e => {
    assert.equal(e.source, 'date');
    const state = hass.states[e.entity];
    assert.equal(state.attributes.friendly_name, e.name);
    assert.match(state.state, /^\d{4}-\d{2}-\d{2}$/);
    const date = Date.parse(state.state);
    assert.ok(date > Date.now(), e.name);
    return date;
  });
  assert.ok(dates[0] < dates[1] && dates[1] < dates[2]);
  assert.equal(entry[2].card_background, false);
});
