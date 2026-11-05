import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

for (const name of ['ci.yml', 'release.yml']) {
  test(`${name} verifies committed Material House build output`, () => {
    const workflow = readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), 'utf8');
    const command = workflow.split('\n').find(line => line.includes('git diff --exit-code --'));
    assert.ok(command?.includes('experiments/material-house/dist'),
      'The now-released Material House generated bundle must be covered by build drift checks');
  });
}
