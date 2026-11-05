"""Dirty-entry preservation and exact collection/delivery contract."""
from pathlib import Path
import hashlib,json,re
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-evidence/car-hero-thirds'
sha=lambda data:hashlib.sha256(data).hexdigest()
entry=json.loads((OUT/'entry-hashes.json').read_text())
allowed={'cards/car-card/src/car-card.js','cards/car-card/dist/eleven-car-card.js','cards/car-card/dist/eleven-car-card-test.js','dist/eleven-cards.js','docs/THEME-FOLLOWING-DESIGN.md','docs/VISUAL-FIXES.md','docs/VISUAL-FIX-PLAN.md'}
changed=[];protected=[]
for name,digest in entry.items():
 assert (ROOT/name).is_file(),('entry file missing',name)
 current=sha((ROOT/name).read_bytes())
 if current!=digest:
  assert name in allowed,('protected dirty sibling changed',name)
  changed.append(name)
 elif name not in allowed:protected.append(name)
paths=re.findall(r"  '(cards/[^']+\.js)',",(ROOT/'scripts/build.mjs').read_text())
assert len(paths)==12,paths
expected=b'// Eleven Cards \xe2\x80\x94 HACS collection; twelve card types, no external dependencies.\n'+b'\n;\n'.join((ROOT/name).read_bytes() for name in paths)
assert (ROOT/'dist/eleven-cards.js').read_bytes()==expected
old=(OUT/'entry-collection.js').read_bytes().split(b'\n',1)[1].split(b'\n;\n')
assert len(old)==12
slices=[]
for name,before in zip(paths,old):
 after=(ROOT/name).read_bytes();different=before!=after
 assert different==(name=='cards/car-card/dist/eleven-car-card.js'),name
 slices.append({'file':name,'changed':different,'sha256':sha(after)})
served=json.loads((OUT/'served-results.json').read_text())
assert len(served['matrix'])==12 and len(served['readbacks'])==18 and not served['page_errors']
assert len([r for r in served['matrix'] if r['surface']=='public'])==6
for row in served['readbacks']:assert sha((ROOT/row['file']).read_bytes())==row['sha256'],row
assert len({row['file'] for row in served['readbacks']})==9
supplement=json.loads((OUT/'supplement.json').read_text())
assert not supplement['page_errors'] and len(supplement['cases'])==14
standalone=json.loads((OUT/'standalone-results.json').read_text())
assert len(standalone['matrix'])==12 and not standalone['page_errors'] and standalone['test_module_independent']
isolated=json.loads((OUT/'isolated/results.json').read_text())
assert len(isolated['matrix'])==12 and len(isolated['stress'])==33 and not isolated['page_errors']
result={'entry_files':len(entry),'protected_unchanged':len(protected),'changed_entry_files':sorted(changed),'composition':slices,'http_readbacks':len(served['readbacks']),'public_browser_cases':6,'local_integrated_browser_cases':6,'standalone_browser_cases':len(standalone['matrix']),'isolated_collection_matrix':len(isolated['matrix']),'isolated_stress_cases':len(isolated['stress']),'supplement_cases':len(supplement['cases']),'evcc_shadow_root_sha256':supplement['cases'][0]['sha256'],'aggregate_sha256':sha(expected),'public_url':served['public_url'],'screenshots':sorted(str(p.relative_to(ROOT)) for p in OUT.rglob('*.png'))}
(OUT/'delivery.json').write_text(json.dumps(result,indent=2))
print(json.dumps({k:v for k,v in result.items() if k not in ['screenshots','composition']},indent=2))
