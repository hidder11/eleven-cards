import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const builder=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
const list=builder.match(/const paths=\[([^\]]+)\]/)?.[1];
assert.ok(list,'Planner builder must expose the real dependency closure');
const files=[...list.matchAll(/'([^']+)'/g)].map(match=>match[1]);
function validate(entries){
 const cassette='../../shared/ui-cassette.js',button='../../shared/ui-button.js';
 assert.equal(entries.filter(p=>p===cassette).length,1,'Cassette must be embedded exactly once');
 assert.ok(entries.indexOf(button)>=0 && entries.indexOf(button)<entries.indexOf(cassette),'Escaping helpers must precede cassette');
 for(const consumer of ['src/styles.js','src/appliance-planner.js'])assert.ok(entries.indexOf(cassette)<entries.indexOf(consumer),'Common cassette must precede '+consumer);
}
test('Planner build embeds the shared cassette once after escaping helpers and before consumers',()=>validate(files));
test('Planner dependency regression rejects a missing, duplicated or reordered shared cassette',()=>{
 const cassette='../../shared/ui-cassette.js';
 assert.throws(()=>validate(files.filter(p=>p!==cassette)));
 assert.throws(()=>validate([...files,cassette]));
 assert.throws(()=>validate([cassette,...files.filter(p=>p!==cassette)]));
});
