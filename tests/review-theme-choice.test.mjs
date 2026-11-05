import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
async function loadTheme(storage){
 const values=new Map([['--unrelated','keep'],['padding','7px']]);
 const style={setProperty:(k,v)=>values.set(k,v),removeProperty:k=>values.delete(k)};
 const context=vm.createContext({document:{body:{style}},localStorage:storage});
 const source=await readFile(new URL('review/theme.js',root),'utf8');
 vm.runInContext(source.replace(/export /g,'')+'\nglobalThis.api={applyReviewTheme,...(typeof readReviewPreferences==="function"?{readReviewPreferences,saveReviewPreferences}:{})};',context);
 return {api:context.api,style,values};
}

const memoryStorage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};

test('preview preferences are shared, validated and storage errors are harmless',async()=>{
 const storage=memoryStorage();let {api}=await loadTheme(storage);
 assert.equal(JSON.stringify(api.readReviewPreferences()),JSON.stringify({paint:'material',dark:false}));
 api.saveReviewPreferences({paint:'native',dark:true});
 ({api}=await loadTheme(storage));
 assert.equal(JSON.stringify(api.readReviewPreferences()),JSON.stringify({paint:'native',dark:true}));
 api.saveReviewPreferences({paint:'wrong',dark:'false'});
 assert.equal(JSON.stringify(api.readReviewPreferences()),JSON.stringify({paint:'material',dark:false}));
 const broken={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 ({api}=await loadTheme(broken));
 assert.equal(JSON.stringify(api.readReviewPreferences()),JSON.stringify({paint:'material',dark:false}));
 assert.doesNotThrow(()=>api.saveReviewPreferences({paint:'native',dark:true}));
 const corrupt={getItem:()=>'{invalid',setItem(){}};
 assert.equal(JSON.stringify((await loadTheme(corrupt)).api.readReviewPreferences()),JSON.stringify({paint:'material',dark:false}));
});

test('both templates expose the same accessible style choice without losing width',async()=>{
 for(const file of ['detail.html','index.html']){
  const html=await readFile(new URL('review/'+file,root),'utf8');
  assert.match(html,/<label(?:\s[^>]*)?>Stijl\s*<select id="paint">/);
  assert.match(html,/<option value="material"[^>]*>Eleven Material<\/option>/);
  assert.match(html,/<option value="native"[^>]*>Home Assistant standaard<\/option>/);
 }
 assert.match(await readFile(new URL('review/detail.html',root),'utf8'),/select id="width"/);
});

function element(){return {children:[],dataset:{},style:{setProperty(){}},value:'',attributes:{},listeners:{},setAttribute(k,v){this.attributes[k]=v;},append(...items){for(const item of items){item.parentElement=this;this.children.push(item);}},classList:{add(){}},addEventListener(k,fn){this.listeners[k]=fn;},setConfig(){this.configCalls=(this.configCalls||0)+1;}};}
async function loadPage(file,storage){
 const {api,values}=await loadTheme(storage),nodes=new Map();
 const document={body:{},documentElement:element(),createElement:element,querySelector(s){if(!nodes.has(s))nodes.set(s,element());return nodes.get(s);}};
 const context=vm.createContext({...api,document,window:{},location:{search:'?card=actions-card'},URLSearchParams,structuredClone,configs:[['actions-card','Control Pad',{}]],cardType:()=> 'custom:eleven-actions-card',createFixture:()=>({themes:{darkMode:false}}),calendarPreviewFixture:h=>h});
 // Browser globals exposed through window are aliases in the page realm.
 context.window=context;
 const source=await readFile(new URL('review/'+file,root),'utf8');
 vm.runInContext(source.replace(/^import .*;$/gm,''),context);
 return {context,nodes,values};
}
function change(node,value){node.value=value;const event={target:node};(node.onchange||node.listeners.change)(event);}
function click(node){(node.onclick||node.listeners.click)();}
test('gallery/detail/reload keep independent paint and mode without reconfiguring cards',async()=>{
 const storage=memoryStorage(),{api}=await loadTheme(storage);
 api.saveReviewPreferences({paint:'native',dark:true});
 for(const file of ['gallery.js','detail.js','gallery.js']){
  const {context,nodes,values}=await loadPage(file,storage);
  const paint=nodes.get('#paint'),mode=nodes.get('#mode');
  assert.equal(paint.value,'native');assert.equal(mode.attributes['aria-pressed'],'true');
  assert.ok(context.records.length>0);
  for(const r of context.records){assert.equal(r.hass.themes.darkMode,true);assert.equal(r.card.configCalls,1);}
  change(paint,'material');assert.equal(mode.attributes['aria-pressed'],'true');
  assert.equal(values.get('--card-background-color'),'#2c303d');
  click(mode);assert.equal(paint.value,'material');assert.equal(values.get('--card-background-color'),'#edf0f6');
  change(paint,'native');click(mode);
  for(const r of context.records){assert.equal(r.hass.themes.darkMode,true);assert.equal(r.card.configCalls,1);}
 }
});
test('blocked storage still permits local gallery and detail controls',async()=>{
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 for(const file of ['gallery.js','detail.js']){
  const {nodes,values}=await loadPage(file,blocked);
  change(nodes.get('#paint'),'native');click(nodes.get('#mode'));
  assert.equal(values.get('--card-background-color'),'#1c1c1c');
 }
});

test('Material/native light and dark round trips remove only owned paint',async()=>{
 const {api,style,values}=await loadTheme();
 for(const dark of [false,true]){
  api.applyReviewTheme(dark);
  const material=Object.fromEntries(values);
  assert.equal(values.get('--card-background-color'),dark?'#2c303d':'#edf0f6');
  assert.equal(values.get('--eleven-material-face1'),dark?'#363b49':'#fafbfe');
  api.applyReviewTheme(dark,'native');
  assert.equal(values.get('--card-background-color'),dark?'#1c1c1c':'#fff');
  assert.equal(values.get('--ha-card-background'),'var(--card-background-color)');
  assert.equal(values.get('--ha-card-box-shadow'),'none');
  assert.equal(values.get('--ha-card-border-radius'),'12px');
  assert.equal(values.get('--accent-color'),'#a86ae0');
  assert.equal([...values.keys()].some(k=>k.startsWith('--eleven-material-')),false);
  assert.equal(values.has('--input-fill-color'),false);
  assert.equal(values.get('--unrelated'),'keep');assert.equal(values.get('padding'),'7px');
  assert.equal(style.colorScheme,dark?'dark':'light');
  api.applyReviewTheme(dark,'material');
  assert.deepEqual(Object.fromEntries(values),material);
 }
});
