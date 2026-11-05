import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
test('isolated build produces valid self-contained JavaScript',()=>{
  const result=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:root,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const output=readFileSync(root+'dist/eleven-shopping-card.js','utf8');
  assert.match(output,/eleven-shopping-card-editor/);
  assert.doesNotMatch(output,/^import\s/m);
  const check=spawnSync(process.execPath,['--check',root+'dist/eleven-shopping-card.js'],{encoding:'utf8'});
  assert.equal(check.status,0,check.stderr);
});
