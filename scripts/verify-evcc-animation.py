"""Stricter follow-up-only scope check; original refinement entry stays immutable."""
from pathlib import Path
import json,hashlib,re
R=Path(__file__).resolve().parents[1];O=R/'qa-evidence/evcc-animation'
sha=lambda b:hashlib.sha256(b).hexdigest()
entry=json.loads((O/'followup-entry-hashes.json').read_text())
production={'cards/car-card/src/evcc/evcc-styles.js','cards/car-card/dist/eleven-car-card.js','cards/car-card/dist/eleven-car-card-test.js','dist/eleven-cards.js'}
docs={'docs/THEME-FOLLOWING-DESIGN.md','docs/THEME-FOLLOWING-VERIFICATION.md','docs/VISUAL-FIXES.md'}
changed=[];protected=[]
pattern=rb'/\* Clearer charging sweep, clipped to true SOC: no glow and original timing\. \*/\n\.content\[data-evcc\]\[data-battery-style\] \.battery-fill::before\{[^}]+\}\n'
for name,digest in entry.items():
 data=(R/name).read_bytes()
 if sha(data)!=digest:
  assert name in production|docs,('outside follow-up scope',name);changed.append(name)
  if name in production:
   reverted,n=re.subn(pattern,b'',data);assert n==1,(name,n)
   assert sha(reverted)==digest,('change beyond exact EVCC sweep rule',name)
 else:protected.append(name)
assert production.issubset(changed)
rows=json.loads((O/'after-results.json').read_text());public=json.loads((O/'after-public-results.json').read_text())
for d in [rows,public]:
 assert len(d['cases'])==12 and not d['page_errors']
 assert all(len(r['frames'])==3 and r['reduced_motion']['content']=='none' for r in d['cases'])
result={'entry_files':len(entry),'unchanged':len(protected),'changed':sorted(changed),'exact_reversible_production_changes':sorted(production),'collection_sha256':sha((R/'dist/eleven-cards.js').read_bytes()),'local_cases':len(rows['cases']),'public_cases':len(public['cases']),'frames_per_surface':sum(len(r['frames']) for r in rows['cases'])}
(O/'scope-verification.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
