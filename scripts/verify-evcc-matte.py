"""Focused matte replacement scope and exact local/public delivery gate."""
from pathlib import Path
import json,hashlib,re,urllib.request,time
R=Path(__file__).resolve().parents[1];O=R/'qa-evidence/evcc-matte';sha=lambda b:hashlib.sha256(b).hexdigest()
entry=json.loads((O/'entry-hashes.json').read_text())
production={'cards/car-card/src/evcc/evcc-styles.js','cards/car-card/dist/eleven-car-card.js','cards/car-card/dist/eleven-car-card-test.js','dist/eleven-cards.js'}
docs={'docs/THEME-FOLLOWING-DESIGN.md','docs/THEME-FOLLOWING-VERIFICATION.md','docs/VISUAL-FIXES.md'}
allowed=production|docs|{'tests/evcc-animation.test.mjs'}
current=(R/'cards/car-card/src/evcc/evcc-styles.js').read_text();old=(O/'entry-evcc-styles.js').read_text()
a=current.index('/* EVCC matte flow:');z=current.index('.content[data-evcc] .charging-status',a)
x=old.index('/* Clearer charging sweep');y=old.index('.content[data-evcc] .charging-status',x)
newblock=current[a:z].encode();oldblock=old[x:y].encode();changed=[];protected=[]
for name,digest in entry.items():
 data=(R/name).read_bytes()
 if sha(data)!=digest:
  assert name in allowed,('out-of-scope change',name);changed.append(name)
  if name in production:
   assert data.count(newblock)==1,name
   assert sha(data.replace(newblock,oldblock))==digest,('production changed beyond exact EVCC replacement',name)
 else:protected.append(name)
assert production.issubset(changed)
paths=re.findall(r"  '(cards/[^']+\.js)',",(R/'scripts/build.mjs').read_text());assert len(paths)==12
expected=b'// Eleven Cards \xe2\x80\x94 HACS collection; twelve card types, no external dependencies.\n'+b'\n;\n'.join((R/n).read_bytes() for n in paths)
assert (R/'dist/eleven-cards.js').read_bytes()==expected
assert [n for n in paths if sha((R/n).read_bytes())!=entry[n]]==['cards/car-card/dist/eleven-car-card.js']
s=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text());files=json.loads((R/'review/public-files.json').read_text());rows=[]
for surface,base in [('local',f"http://127.0.0.1:56515/{s['token']}/cards/"),('public',s['url']+'cards/')]:
 for name in files:
  status=0;data=b'';mime=''
  for attempt in range(4):
   try:
    with urllib.request.urlopen(base+name,timeout=40) as res:data=res.read();mime=res.headers.get_content_type();status=res.status
    break
   except Exception:
    if attempt==3:raise
    time.sleep(1)
  assert status==200 and data==(R/name).read_bytes(),(surface,name)
  assert mime==('image/png' if name.endswith('.png') else 'text/html' if name.endswith('.html') else 'text/javascript'),(name,mime)
  rows.append({'surface':surface,'file':name,'sha256':sha(data),'mime':mime,'status':status})
browser=json.loads((O/'browser-results.json').read_text());cases=browser['cases']
assert len(cases)==16 and sum(r['surface']=='local' for r in cases)==12 and sum(r['surface']=='public' for r in cases)==4
assert not browser['page_errors'] and len(browser['auto_parity'])==4
assert all(len(r['frames'])==3 and r['reduced']['content']=='none' and r['offline']['power']=='paused' for r in cases)
result={'entry_files':len(entry),'protected_unchanged':len(protected),'changed_entry_files':sorted(changed),'exact_reversible_production_changes':sorted(production),'collection_slices':len(paths),'changed_collection_slices':['cards/car-card/dist/eleven-car-card.js'],'collection_sha256':sha(expected),'readbacks':rows,'browser_cases':len(cases),'phase_frames':sum(len(r['frames']) for r in cases),'auto_parity':len(browser['auto_parity']),'url':browser['url']}
(O/'delivery.json').write_text(json.dumps(result,indent=2));print(json.dumps({k:v for k,v in result.items() if k!='readbacks'},indent=2));print('readbacks',len(rows))
