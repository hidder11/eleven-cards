import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const editor=readFileSync(new URL('../src/editor.js',import.meta.url),'utf8');
test('native editor has no independent settings save or backend mutation transport',()=>{
 assert.doesNotMatch(editor,/>Bewaar (apparaat|programma|meldingsactie)</);
 assert.doesNotMatch(editor,/eleven_appliance_planner\/command|lovelace\/config\/save|localStorage|sessionStorage/);
 assert.doesNotMatch(editor,/this\.command\(|transfer_programs|notification-save/);
 assert.match(editor,/config-changed/);
});
test('daily settings remain exclusively in native editor',()=>{
 const daily=readFileSync(new URL('../src/appliance-planner.js',import.meta.url),'utf8');
 assert.doesNotMatch(daily,/mountSettings|save-settings|settings-panel|lovelace\/config/);
 assert.match(editor,/alleen-lezen/);
 assert.match(editor,/form\.oninput=update/);
});
