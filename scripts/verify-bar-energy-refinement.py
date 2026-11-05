"""Read-only verification of this isolated two-card review delivery."""
from pathlib import Path
import hashlib,json,re,urllib.request,argparse
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--baseline',default='/opt/data/cache/scratch/bar-energy-refinement-baseline');args=p.parse_args();BASE=Path(args.baseline)
OUT=ROOT/'qa-evidence/bar-energy-refinement';OUT.mkdir(parents=True,exist_ok=True)
sha=lambda data:hashlib.sha256(data).hexdigest()
inventory=json.loads((BASE/'inventory.json').read_text())
allowed={'cards/bar-chart/dist/eleven-bar-chart.js','cards/dynamic-energy-price-card/dist/eleven-dynamic-energy-price-card.js','dist/eleven-cards.js','cards/bar-chart/src/bar-chart.js','cards/history-graph-card/src/history-graph-card.js','cards/dynamic-energy-price-card/src/dynamic-energy-price-card.js','cards/dynamic-energy-price-card/tests/card-consumption.test.mjs','cards/dynamic-energy-price-card/tests/test_component_structure.py','tests/shared-header.test.mjs','tests/fixtures/theme-following.html','review/gallery.js','docs/THEME-FOLLOWING-DESIGN.md','docs/VISUAL-FIXES.md'}
delta=[];protected=[]
for rel,old in inventory.items():
 f=ROOT/rel;assert f.is_file(),f'missing entry file: {rel}'
 actual=sha(f.read_bytes())
 if actual!=old:assert rel in allowed,f'unexpected task change: {rel}';delta.append({'path':rel,'before':old,'after':actual})
 else:protected.append({'path':rel,'sha256':actual})
# Reconstruct the full collection from exact delivered standalone modules.
s=(ROOT/'scripts/build.mjs').read_text();paths=re.findall(r"  '(cards/[^']+\.js)'",s)
expected='// Eleven Cards — HACS collection; twelve card types, no external dependencies.\n'.encode()+b'\n;\n'.join((ROOT/f).read_bytes() for f in paths)
assert (ROOT/'dist/eleven-cards.js').read_bytes()==expected,'collection differs from delivered standalone modules'
for f in paths:
 if f not in {'cards/bar-chart/dist/eleven-bar-chart.js','cards/dynamic-energy-price-card/dist/eleven-dynamic-energy-price-card.js'}:assert sha((ROOT/f).read_bytes())==inventory[f],f'unapproved card bundle changed: {f}'
# Minimal History source extension: same default exact-constructor behavior, opt-in only for Bar.
old=(BASE/'files/cards/history-graph-card/src/history-graph-card.js').read_text()
expectedHistory=old.replace('this.constructor===HistoryGraphCard','this._calmChartLayout').replace(' _historyHeader(options){',' get _calmChartLayout(){return this.constructor===HistoryGraphCard;}\n _historyHeader(options){').replace('  // History owns only this arrangement; the shared header still supplies every\n  // existing action and its semantics. Companion cards use it unchanged.','  // The shared header still supplies every existing action and its semantics.\n  // Bar explicitly opts into this arrangement; other companions remain unchanged.')
assert (ROOT/'cards/history-graph-card/src/history-graph-card.js').read_text()==expectedHistory,'unexpected History source change'
share=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text());base='http://127.0.0.1:56515/'+share['token']+'/cards/'
served=[];served_collection=None
for rel in json.loads((ROOT/'review/public-files.json').read_text()):
 with urllib.request.urlopen(base+rel,timeout=30) as response:data=response.read();status=response.status
 local=(ROOT/rel).read_bytes();assert status==200 and data==local,f'served mismatch: {rel}'
 if rel=='dist/eleven-cards.js':served_collection=data
 served.append({'path':rel,'status':status,'bytes':len(data),'sha256':sha(data)})
assert served_collection is not None,'collection absent from public manifest'
offset=len('// Eleven Cards — HACS collection; twelve card types, no external dependencies.\n'.encode());slices=[]
for index,rel in enumerate(paths):
 data=(ROOT/rel).read_bytes();chunk=served_collection[offset:offset+len(data)]
 assert chunk==data,f'served embedded module mismatch: {rel}'
 slices.append({'path':rel,'offset':offset,'bytes':len(data),'sha256':sha(chunk),'matches_local':True});offset+=len(data)+(len(b'\n;\n') if index<len(paths)-1 else 0)
new_sources=['tests/browser-bar-refinement.py','tests/browser-energy-refinement.py','tests/bar-calm-adapter.test.mjs','scripts/verify-bar-energy-refinement.py']
result={'served_module_slices':slices,'new_sources':[{'path':rel,'sha256':sha((ROOT/rel).read_bytes())}for rel in new_sources],'baseline':str(BASE),'entry_file_count':len(inventory),'existing_file_delta':delta,'protected_file_count':len(protected),'protected_files':protected,'collection_exact':True,'history_source_adapter_only':True,'served':served,'target_bundles':[{ 'path':f,'sha256':sha((ROOT/f).read_bytes()),'bytes':(ROOT/f).stat().st_size} for f in paths if f in {'cards/bar-chart/dist/eleven-bar-chart.js','cards/dynamic-energy-price-card/dist/eleven-dynamic-energy-price-card.js'}]}
(OUT/'delivery.json').write_text(json.dumps(result,indent=2));print(json.dumps({'entry_files':len(inventory),'changed_existing':len(delta),'protected':len(protected),'served_exact':len(served),'target_bundles':result['target_bundles']}))
