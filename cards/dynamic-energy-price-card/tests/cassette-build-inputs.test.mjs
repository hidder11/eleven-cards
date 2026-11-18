import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const builder=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
const list=builder.match(/const backgroundSource=[\s\S]*?Promise\.all\(\[([^\]]+)\]/)?.[1];
assert.ok(list,'Energy builder must expose the real dependency closure');
const files=[...list.matchAll(/'([^']+)'/g)].map(match=>match[1]);
function validate(entries){
 assert.equal(entries.filter(p=>p==='ui-cassette.js').length,1,'Cassette must be embedded exactly once');
 assert.ok(entries.indexOf('ui-button.js')>=0 && entries.indexOf('ui-button.js')<entries.indexOf('ui-cassette.js'),'Escaping helpers must precede cassette');
 assert.ok(entries.indexOf('ui-cassette.js')<entries.indexOf('card-background.js'),'Common renderer must precede consumers');
}
test('Energy build embeds the shared cassette once after escaping helpers and before consumers',()=>validate(files));
test('Energy dependency regression rejects a missing, duplicated or reordered shared cassette',()=>{
 assert.throws(()=>validate(files.filter(p=>p!=='ui-cassette.js')));
 assert.throws(()=>validate([...files,'ui-cassette.js']));
 assert.throws(()=>validate(['ui-cassette.js',...files.filter(p=>p!=='ui-cassette.js')]));
});
