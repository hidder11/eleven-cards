"""Overview-only byte protection and existing local/public preview readback."""
from pathlib import Path
import json,hashlib,re,urllib.request,difflib
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-evidence/overview-refinement'
sha=lambda b:hashlib.sha256(b).hexdigest()
entry=json.loads((OUT/'entry-hashes.json').read_text())
allowed={'cards/overview-card/src/overview-card.js','cards/overview-card/dist/eleven-overview-card.js','dist/eleven-cards.js','docs/THEME-FOLLOWING-DESIGN.md','docs/VISUAL-FIXES.md'}
changed=[];missing=[];protected=[]
for name,old in entry.items():
 p=ROOT/name
 if not p.exists():missing.append(name);continue
 current=sha(p.read_bytes())
 if old!=current:changed.append(name)
 if name not in allowed:protected.append({'path':name,'sha256':current,'unchanged':old==current})
assert not missing,missing
assert set(changed)<=allowed,changed
assert all(x['unchanged'] for x in protected)
paths=re.findall(r"'(cards/[^']+\.js)'",(ROOT/'scripts/build.mjs').read_text())
header=b'// Eleven Cards \xe2\x80\x94 HACS collection; twelve card types, no external dependencies.\n'
old=[];new=[];slices=[]
for name in paths:
 after=(ROOT/name).read_bytes();before=(OUT/'entry'/name).read_bytes() if 'overview-card' in name else after
 old.append(before);new.append(after)
 slices.append({'path':name,'entrySha256':sha(before),'sha256':sha(after),'changed':before!=after})
assert (OUT/'entry/dist/eleven-cards.js').read_bytes()==header+b'\n;\n'.join(old),'entry collection did not match entry standalones'
expected=header+b'\n;\n'.join(new)
assert (ROOT/'dist/eleven-cards.js').read_bytes()==expected
assert [x['path'] for x in slices if x['changed']]==['cards/overview-card/dist/eleven-overview-card.js']
readbacks=[]
bases=['http://127.0.0.1:56515','https://kyle-modules-tions-donald.trycloudflare.com']
prefix='/JC5klAkxdKA9PmJO7YSGqy76RQb7-mo6C0aJPXHgbsI/cards/'
for base in bases:
 for name in json.loads((ROOT/'review/public-files.json').read_text()):
  req=urllib.request.Request(base+prefix+name,headers={'Cache-Control':'no-cache'})
  with urllib.request.urlopen(req,timeout=60) as response:data=response.read();status=response.status
  local=(ROOT/name).read_bytes();assert data==local,(base,name)
  readbacks.append({'origin':base,'path':name,'status':status,'bytes':len(data),'sha256':sha(data)})
source='cards/overview-card/src/overview-card.js'
(OUT/'task-source.diff').write_text(''.join(difflib.unified_diff((OUT/'entry'/source).read_text().splitlines(True),(ROOT/source).read_text().splitlines(True),fromfile='entry/'+source,tofile='current/'+source)))
approved=re.search(r'const approved=new Set\((.+?)\);',(ROOT/'review/gallery.js').read_text());assert approved is not None
result={'changedEntryFiles':changed,'missingEntryFiles':missing,'protectedCount':len(protected),'protected':protected,'collectionSlices':slices,'httpReadbacks':readbacks,'finalHashes':{name:sha((ROOT/name).read_bytes()) for name in allowed},'reviewPending':"'overview-card'" not in approved.group(1)}
assert result['reviewPending']
(OUT/'delivery.json').write_text(json.dumps(result,indent=2))
print(json.dumps({'changedEntryFiles':changed,'protectedCount':len(protected),'collectionSlices':len(slices),'httpReadbacks':len(readbacks),'overviewSha256':result['finalHashes']['cards/overview-card/dist/eleven-overview-card.js'],'collectionSha256':sha(expected),'reviewPending':result['reviewPending']}))
