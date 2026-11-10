import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const root = new URL('../', import.meta.url);
const workflow = readFileSync(new URL('.github/workflows/release.yml', root), 'utf8').replace(/\r\n/g, '\n');
function step(name) {
  const block = workflow.split(`      - name: ${name}\n`)[1]?.split('\n      - ')[0];
  assert.ok(block, `Missing workflow step: ${name}`);
  const run = block.split('        run: |\n')[1];
  assert.ok(run, `Missing run block: ${name}`);
  return run.split('\n').map(line => line.replace(/^          /, '')).join('\n');
}
function bash(script, prefix = '', cwd = root) {
  return spawnSync('bash', ['-e', '-c', `${prefix}\n${script}`], {
    cwd, encoding: 'utf8', env: {...process.env, VERSION: 'v9.8.7', RELEASE_SHA: 'selected-commit'},
  });
}

test('draft creation attaches the mandatory theme alongside bundle and provenance', () => {
  // Capture the actual shell-expanded arguments without calling GitHub.
  const result = bash(step('Create draft only (never publish)'), 'gh() { printf "%s\\n" "$@"; }');
  assert.equal(result.status, 0, result.stderr);
  const args = result.stdout.trim().split('\n');
  assert.deepEqual(args.slice(0, 7), [
    'release', 'create', 'v9.8.7', 'dist/eleven-cards.js',
    'themes/eleven_material.yaml', 'release-provenance.txt', '--target',
  ]);
  assert.ok(args.includes('--draft'));
  assert.ok(args.includes('--latest=false'));
});

test('release title is exactly VERSION without a product prefix', () => {
  const result = bash(step('Create draft only (never publish)'), 'gh() { printf "%s\\n" "$@"; }');
  assert.equal(result.status, 0, result.stderr);
  const args = result.stdout.trim().split('\n');
  assert.equal(args[args.indexOf('--title') + 1], 'v9.8.7');
});

function provenanceScript() {
  // Exercise the real shell and checksum command without creating artifacts.
  return step('Record release provenance')
    .replaceAll('>> release-provenance.txt', '>&1')
    .replaceAll('> release-provenance.txt', '>&1')
    .replace('cat release-provenance.txt >> "$GITHUB_STEP_SUMMARY"', ':');
}

test('provenance records current bundle and theme checksums, not fixed hashes', () => {
  const result = bash(provenanceScript());
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Version: v9\.8\.7\nCommit: selected-commit\n/);
  for (const path of ['dist/eleven-cards.js', 'themes/eleven_material.yaml']) {
    const hash = createHash('sha256').update(readFileSync(new URL(path, root))).digest('hex');
    assert.ok(result.stdout.split('\n').some(line => line === `${hash}  ${path}` || line === `${hash} *${path}`), `Missing checksum for ${path}`);
  }
});

test('missing mandatory theme fails clearly before recording provenance', () => {
  // This existing directory has no release inputs; no fixtures or outputs needed.
  const result = bash(provenanceScript(), '', new URL('tests/', root));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Required Eleven Material theme is missing or empty: themes\/eleven_material\.yaml/);
  assert.equal(result.stdout, '', 'Must fail before creating provenance');
});

const paths = ['dist/eleven-cards.js', 'themes/eleven_material.yaml', 'release-provenance.txt'];
const sizes = Object.fromEntries(paths.map(path => [path, path === 'release-provenance.txt'
  ? 256 : readFileSync(new URL(path, root)).byteLength]));
function releaseFixture() {
  return {
    isDraft: true, isPrerelease: false, name: 'v9.8.7', tagName: 'v9.8.7', targetCommitish: 'selected-commit',
    assets: paths.map(path => ({name: path.split('/').at(-1), size: sizes[path]})),
  };
}
function verify(release) {
  const body = step('Verify draft and asset').match(/<<'JS'\n([\s\S]*?)\nJS\s*$/)?.[1];
  assert.ok(body, 'Expected executable inline release read-back assertions');
  // Execute actual workflow assertions with in-memory API/local-file boundaries.
  const check = new Function('assert', 'readFileSync', 'statSync', 'process',
    body.replace(/^import .*;\n/gm, ''));
  check(assert, () => JSON.stringify(release), path => {
    assert.ok(Object.hasOwn(sizes, path), `Unexpected local asset: ${path}`);
    return {size: sizes[path]};
  }, {env: {RUNNER_TEMP: '/runner-temp', VERSION: 'v9.8.7', RELEASE_SHA: 'selected-commit'}});
}

test('read-back requests and accepts the complete exact draft release', () => {
  assert.match(step('Verify draft and asset'), /--json [^\n]*\bname\b/);
  verify(releaseFixture());
});
for (const name of ['eleven-cards.js', 'eleven_material.yaml', 'release-provenance.txt']) {
  test(`read-back rejects missing asset: ${name}`, () => {
    const release = releaseFixture();
    release.assets = release.assets.filter(asset => asset.name !== name);
    assert.throws(() => verify(release), /asset|attached/i);
  });
  test(`read-back rejects incorrect size: ${name}`, () => {
    const release = releaseFixture();
    release.assets.find(asset => asset.name === name).size += 1;
    assert.throws(() => verify(release));
  });
}
for (const duplicate of [false, true]) {
  test(`read-back rejects ${duplicate ? 'duplicate' : 'unexpected'} assets`, () => {
    const release = releaseFixture();
    release.assets.push(duplicate ? {...release.assets[1]} : {name: 'unexpected.zip', size: 1});
    assert.throws(() => verify(release), /asset/i);
  });
}
for (const [field, value] of [
  ['isDraft', false], ['isPrerelease', true], ['name', 'Eleven Cards v9.8.7'],
  ['tagName', 'v9.8.6'], ['targetCommitish', 'wrong-commit'],
]) {
  test(`read-back rejects incorrect ${field}`, () => {
    assert.throws(() => verify({...releaseFixture(), [field]: value}));
  });
}
