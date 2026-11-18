import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const path=new URL('../shared/ui-cassette.js',import.meta.url);
test('shared cassette renders one native connected disclosure and escapes its label',async()=>{
 assert.ok(existsSync(path),'Missing shared cassette component; local paint adapters are not reuse');
 const {uiCassette}=await import(path);
 const markup=uiCassette({label:'<Details & "info">',content:'<p>Trusted body</p>',open:true,attrs:{id:'periods'},summaryAttrs:{id:'periods-summary'},bodyAttrs:{class:'price-table-wrap'}});
 assert.match(markup,/<details[^>]*id="periods"[^>]*data-ui-cassette/);
 assert.match(markup,/<details[^>]* open(?:="")?>/);
 assert.match(markup,/<summary[^>]*id="periods-summary"[^>]*data-ui-cassette-trigger[^>]*>&lt;Details &amp; &quot;info&quot;&gt;<\/summary><div/);
 assert.match(markup,/<div[^>]*class="price-table-wrap"[^>]*data-ui-cassette-body[^>]*><p>Trusted body<\/p><\/div><\/details>$/);
 assert.doesNotMatch(uiCassette({label:'Details'}),/\sopen(?:=|>)/);
});

test('shared cassette escapes attribute values and preserves component-owned anatomy',async()=>{
 const {uiCassette}=await import(path);
 const markup=uiCassette({label:"'&<\"",attrs:{title:'\"<&',open:true,'data-ui-cassette':'wrong'},summaryAttrs:{title:'<summary>','data-ui-cassette-trigger':'wrong'},bodyAttrs:{title:"'body'",'data-ui-cassette-body':'wrong'}});
 assert.match(markup,/title="&quot;&lt;&amp;"/);
 assert.match(markup,/title="&lt;summary&gt;"/);
 assert.match(markup,/title="&#39;body&#39;"/);
 assert.match(markup,/>&#39;&amp;&lt;&quot;<\/summary>/);
 assert.doesNotMatch(markup,/wrong|\sopen(?:=|>)/);
 assert.match(markup,/data-ui-cassette=""/);
 assert.match(markup,/data-ui-cassette-trigger=""/);
 assert.match(markup,/data-ui-cassette-body=""/);
});

test('shared cassette extracts the House grip, attached open corners and native focus without local variants',async()=>{
 const {uiCassetteStyles}=await import(path);
 assert.equal(typeof uiCassetteStyles,'function','Shared stylesheet is missing');
 const css=uiCassetteStyles();
 assert.match(css,/min-height:44px/);
 assert.match(css,/padding:10px 12px/);
 assert.match(css,/font-size:13px/);
 assert.match(css,/\[open\]>\[data-ui-cassette-trigger\][^{]*\{[^}]*border-radius:[^;}]* 0 0/);
 assert.match(css,/\[data-ui-cassette-body\][^{]*\{[^}]*margin:0/);
 assert.match(css,/\[data-ui-cassette-trigger\]::after[^}]*width:8px[^}]*height:8px/);
 assert.match(css,/\[data-ui-cassette-trigger\]:active[^}]*transform:none/);
 assert.match(css,/\[data-ui-cassette-trigger\]:focus-visible/);
 assert.match(css,/outline:2px solid var\(--ui-cassette-focus-color,/);
 assert.doesNotMatch(css,/aria-pressed|aria-selected/);
 assert.match(uiCassetteStyles({scope:'.protected-house'}),/\.protected-house \[data-ui-cassette\]/);
});

test('shared native adoption is idempotent and retains House nodes, handlers and open state',async()=>{
 const {mountUICassette}=await import(path);
 assert.equal(typeof mountUICassette,'function','Native House/Scene cassette adoption is missing');
 class Element extends EventTarget{
  constructor(tag){super();this.tagName=tag.toUpperCase();this.nodeType=1;this.childNodes=[];this.attributes=new Map();this.ownerDocument={createElement:tag=>new Element(tag)};}
  get children(){return this.childNodes.filter(n=>n.nodeType===1);}
  setAttribute(k,v){this.attributes.set(k,String(v));}
  hasAttribute(k){return this.attributes.has(k);}
  append(...nodes){for(const n of nodes){if(n.parentNode)n.parentNode.childNodes.splice(n.parentNode.childNodes.indexOf(n),1);n.parentNode=this;this.childNodes.push(n);}}
  insertBefore(node,before){if(node.parentNode)node.parentNode.childNodes.splice(node.parentNode.childNodes.indexOf(node),1);node.parentNode=this;const i=this.childNodes.indexOf(before);this.childNodes.splice(i<0?this.childNodes.length:i,0,node);}
 }
 const details=new Element('details'),summary=new Element('summary'),notice=new Element('div'),controls=new Element('div');
 details.open=true;details.append(summary,notice,controls);let clicks=0;controls.addEventListener('click',()=>clicks++);
 assert.equal(mountUICassette(details),details);
 assert.equal(details.open,true);assert.equal(details.children[0],summary);assert.ok(summary.hasAttribute('data-ui-cassette-trigger'));
 const body=details.children[1];assert.ok(body.hasAttribute('data-ui-cassette-body'));assert.deepEqual(body.children,[notice,controls]);
 assert.equal(mountUICassette(details),details);assert.equal(details.children.length,2);assert.equal(details.children[1],body);
 controls.dispatchEvent(new Event('click'));assert.equal(clicks,1);
 const scene=new Element('details'),grip=new Element('summary'),existingBody=new Element('div');scene.append(grip,existingBody);
 mountUICassette(scene);assert.equal(scene.children[1],existingBody);assert.ok(existingBody.hasAttribute('data-ui-cassette-body'));
 assert.throws(()=>mountUICassette(new Element('section')),/details/i);
});
