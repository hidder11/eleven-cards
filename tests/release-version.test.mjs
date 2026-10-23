import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateReleaseVersion} from '../scripts/release-version.mjs';

test('accepts explicit stable collection versions', () => {
  for (const version of ['v0.1.0', 'v1.0.0', 'v12.30.45']) {
    assert.equal(validateReleaseVersion(version), version);
  }
});

test('rejects malformed versions, prereleases and shell input without normalization', () => {
  for (const version of ['', '1.0.0', 'v01.0.0', 'v1.02.0', 'v1.0.00', 'v1.0',
    'v1.0.0-beta.1', 'v1.0.0+build', ' v1.0.0', 'v1.0.0\n', 'v1.0.0; echo nope', null]) {
    assert.throws(() => validateReleaseVersion(version), /vMAJOR.MINOR.PATCH/);
  }
});
