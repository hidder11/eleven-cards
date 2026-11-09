import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

for (const card of ['home-controls', 'room-card', 'appliance-planner', 'scene-engine-card/frontend']) {
  test(`${card} documents collection installation without obsolete exclusions`, () => {
    const readme = readFileSync(new URL(`../cards/${card}/README.md`, import.meta.url), 'utf8');
    assert.match(readme, /eleven-cards\.js/);
    assert.doesNotMatch(readme, /not (?:yet )?included in the collection|twelve-card root collection bundle does not include/i);
  });
}
