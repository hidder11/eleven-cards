"""Exact served bytes, aggregate composition, and immutable dirty entry."""
from pathlib import Path
import json,hashlib,urllib.request,time,re
R=Path(__file__).resolve().parents[1];O=R/'qa-evidence/evcc-refinement';sha=lambda b:hashlib.sha256(b).hexdigest()
entry=json.loads((O/'entry-hashes.json').read_text());allowed={'cards/car-card/src/evcc/evcc-card.js','cards/car-card/src/evcc/evcc-styles.js','cards/car-card/dist/eleven-car-card.js','cards/car-card/dist/eleven-car-card-test.js','dist/eleven-cards.js','build-review.py','review/gallery.js','review/index.html','tests/browser-car-evcc.mjs','docs/THEME-FOLLOWING-DESIGN.md','docs/THEME-FOLLOWING-VERIFICATION.md','docs/VISUAL-FIX-PLAN.md','docs/VISUAL-FIXES.md'}
changed=[];protected=[]
for name,digest in entry.items():
 assert sha((O/'entry'/name).read_bytes())==digest,('immutable entry was altered',name)
 assert (R/name).is_file(),name
 if sha((R/name).read_bytes())!=digest:
  assert name in allowed,('protected entry changed',name);changed.append(name)
 else:protected.append(name)
paths=re.findall(r"  '(cards/[^']+\.js)',",(R/'scripts/build.mjs').read_text());assert len(paths)==12
expected=b'// Eleven Cards \xe2\x80\x94 HACS collection; twelve card types, no external dependencies.\n'+b'\n;\n'.join((R/n).read_bytes() for n in paths)
assert (R/'dist/eleven-cards.js').read_bytes()==expected
old=(O/'entry/dist/eleven-cards.js').read_bytes().split(b'\n',1)[1].split(b'\n;\n');assert len(old)==12
for name,before in zip(paths,old):assert ((R/name).read_bytes()!=before)==(name=='cards/car-card/dist/eleven-car-card.js'),name
s=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text());files=json.loads((R/'review/public-files.json').read_text());rows=[]
for surface,base in [('local',f"http://127.0.0.1:56515/{s['token']}/cards/"),('public',s['url']+'cards/')]:
 for name in files:
  status=0;data=b'';mime=''
  for attempt in range(4):
   try:
    with urllib.request.urlopen(base+name,timeout=40) as res: data=res.read();mime=res.headers.get_content_type();status=res.status
    break
   except Exception:
    if attempt==3:raise
    time.sleep(2)
  assert status==200 and data==(R/name).read_bytes(),(surface,name)
  assert mime==('image/png' if name.endswith('.png') else 'text/html' if name.endswith('.html') else 'text/javascript'),(name,mime)
  rows.append({'surface':surface,'file':name,'sha256':sha(data),'mime':mime,'status':status})
result={'public_url':s['url']+'cards/review/#card-car-evcc','entry_files':len(entry),'protected_unchanged':len(protected),'changed_entry_files':sorted(changed),'collection_slices':len(paths),'changed_collection_slices':['cards/car-card/dist/eleven-car-card.js'],'collection_sha256':sha(expected),'readbacks':rows}
(O/'delivery.json').write_text(json.dumps(result,indent=2));print(json.dumps({k:v for k,v in result.items() if k!='readbacks'},indent=2));print('readbacks',len(rows))
