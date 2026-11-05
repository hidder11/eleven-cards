import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as legacy from '../shared/ui-button.js';
import * as actions from '../shared/ui-action-button.js';
const current={...legacy,...actions};
const before=await import('data:text/javascript;base64,'+Buffer.from(readFileSync(new URL('../tests/fixtures/ui-button-before-actions.js',import.meta.url))).toString('base64'));

test('shared action stylesheet supplies opt-in 44px actions without replacing legacy defaults',()=>{
 assert.equal(typeof current.uiActionButtonStyles,'function','shared action stylesheet exists');
 const css=current.uiActionButtonStyles();
 assert.ok(css.includes('[data-ui-button^="action"]'));
 assert.ok(css.includes('min-height:44px'));
 assert.ok(css.includes('min-width:44px'));
 assert.ok(css.includes('var(--accent-color,var(--primary-color))'));
 assert.ok(css.includes('[data-ui-button="action-choice"][aria-pressed="true"]'));
 assert.ok(css.includes('[data-ui-button="action-danger"]'));
 assert.equal(current.uiButtonStyles(),before.uiButtonStyles(),'legacy stylesheet is byte-identical');
});
test('shared action keyboard outline remains valid with minimal host theme tokens',()=>{
 // The standalone Planner QA has primary-color but no primary-text-color.
 // An unresolved var() in this shorthand erased the entire focus indicator.
 const css=current.uiActionButtonStyles();
 const focus=css.match(/\[data-ui-button\^="action"\]:focus-visible\{([^}]+)\}/)?.[1];
 assert.ok(focus);
 assert.ok(focus.includes('outline:2px solid'));
 assert.ok(focus.includes('var(--accent-color,var(--primary-color,#2196f3))'));
 assert.ok(focus.includes('var(--primary-text-color,currentColor)'));
});
test('legacy rendering remains byte-identical for ordinary, selected, link and escaped button cases',()=>{
 for(const variant of ['icon','surface','text','close','tab'])for(const disabled of [false,true])for(const attrs of [{},{'aria-pressed':true,'data-key':'lamp-1'},{'aria-checked':false,'title':'<&"'}]){
  const options={variant,disabled,attrs,text:'<test & value>',label:'Name <&"',title:'A title',className:'x',type:'submit'};
  assert.equal(current.uiButton(options),before.uiButton(options));
  assert.equal(current.uiButton({...options,href:'/test?a=1&b=2'}),before.uiButton({...options,href:'/test?a=1&b=2'}));
 }
});
test('shared actions preserve native type, values, safe attributes and distinct state semantics',()=>{
 const html=current.uiButton({variant:'action',text:'Uit',type:'button',disabled:true,attrs:{'data-key':'1-toggle','data-action':'toggle','aria-pressed':true}});
 assert.match(html,/type="button"/);assert.match(html,/data-ui-button="action"/);assert.match(html,/aria-pressed="true"/);assert.match(html,/ disabled/);
 assert.match(current.uiButton({variant:'action-choice',text:'Morgen',attrs:{'aria-pressed':true}}),/data-ui-button="action-choice"/);
 assert.match(current.uiButton({variant:'action-danger',text:'Verwijder',type:'submit'}),/type="submit"/);
 assert.throws(()=>current.uiButton({attrs:{onclick:'bad()'}}),/Invalid UI attribute/);
});
