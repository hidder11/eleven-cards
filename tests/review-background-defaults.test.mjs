import test from 'node:test';
import assert from 'node:assert/strict';

test('overview and detail fixtures leave optional decorative backgrounds off', async () => {
  globalThis.window ??= {};
  const {configs} = await import('../review/fixtures.js');
  assert.equal(configs.length, 18);
  for (const [name,,config] of configs) {
    assert.equal(config.card_background, false, name);
  }
});
