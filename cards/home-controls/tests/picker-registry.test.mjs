import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const bundle=readFileSync(new URL('../dist/eleven-home-controls-card.js',import.meta.url),'utf8');
for(const legacy of [false,true])test(`picker keeps its captured registry reference (legacy=${legacy})`,()=>{
 const registry=[{type:'existing-card'},...(legacy?[{type:'eleven-home-controls-card'}]:[])];
 const elements=new Map();
 const context=vm.createContext({window:{customCards:registry},HTMLElement:class {},customElements:{get:tag=>elements.get(tag),define:(tag,cls)=>elements.set(tag,cls)}});
 vm.runInContext(bundle,context);
 assert.deepEqual([...elements.keys()].sort(),['eleven-actions-card','eleven-controls-card','eleven-controls-editor','eleven-waste-card'], 'only the three supported cards and their shared editor may register');
 assert.equal(elements.has('eleven-home-controls-card'),false);
 assert.equal(elements.has('eleven-home-controls-editor'),false);
 assert.equal(context.window.customCards,registry,'Home Assistant imports this array by reference; replacing it hides later cards');
 assert.equal(registry.filter(c=>c.type==='eleven-home-controls-card').length,0);
 for(const type of ['existing-card','eleven-actions-card','eleven-controls-card','eleven-waste-card'])assert.equal(registry.filter(c=>c.type===type).length,1);
 context.window.customCards.push({type:'late-appliance-planner'});
 assert.ok(registry.some(c=>c.type==='late-appliance-planner'),'late resources must remain visible through the captured reference');
 // A second module URL must neither replace the list nor duplicate picker entries.
 vm.runInContext(`(()=>{${bundle}\n})()`,context);
 for(const type of ['eleven-actions-card','eleven-controls-card','eleven-waste-card'])assert.equal(registry.filter(c=>c.type===type).length,1);
 assert.equal(context.window.customCards,registry);
});
