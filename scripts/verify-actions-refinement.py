"""Check the exact served Actions bundle and all protected task-entry files."""
from pathlib import Path
import hashlib,json,urllib.request
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-evidence/actions-refinement'
def sha(data):return hashlib.sha256(data).hexdigest()
entry=json.loads((OUT/'entry-hashes.json').read_text())
allowed={'cards/home-controls/src/standalone-cards.js','cards/home-controls/dist/eleven-home-controls-card.js','build-review.py','review/gallery.js','docs/THEME-FOLLOWING-DESIGN.md','docs/THEME-FOLLOWING-VERIFICATION.md','docs/VISUAL-AUDIT.md','docs/VISUAL-FIX-PLAN.md','docs/VISUAL-FIXES.md'}
changed=[];protected=[]
for path,old in entry.items():
 data=(ROOT/path).read_bytes();current=sha(data)
 if current!=old:changed.append(path);assert path in allowed,('out of scope entry change',path)
 if path.startswith(('cards/','shared/','themes/')) or path=='dist/eleven-cards.js':
  if path not in allowed:assert current==old,path;protected.append(path)
assert 'cards/home-controls/dist/eleven-home-controls-card.js' in changed
assert sha((ROOT/'review/index.html').read_bytes())==entry['review/index.html']
assert sha((ROOT/'review/public-files.json').read_bytes())==entry['review/public-files.json']
files=json.loads((ROOT/'review/public-files.json').read_text());assert len(files)==8
share=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text())
public='https://kyle-modules-tions-donald.trycloudflare.com'
prefix=f"/{share['token']}/cards/"
checks=[]
for host in ['http://127.0.0.1:56515',public]:
 for path in files:
  local=(ROOT/path).read_bytes();url=host+prefix+path+'?actions-refinement='+sha(local)[:12]
  with urllib.request.urlopen(url,timeout=45) as response:
   data=response.read();assert response.status==200 and data==local,(url,len(data),len(local));checks.append({'url':url,'status':response.status,'sha256':sha(data),'bytes':len(data),'cacheControl':response.headers.get('Cache-Control'),'contentType':response.headers.get('Content-Type')})
result={'protectedFiles':len(protected),'protectedFilePaths':protected,'changedEntryFiles':sorted(changed),'httpChecks':checks,'galleryURL':public+prefix+'review/#card-actions-card','targetSHA256':sha((ROOT/'cards/home-controls/dist/eleven-home-controls-card.js').read_bytes()),'collectionSHA256':sha((ROOT/'dist/eleven-cards.js').read_bytes()),'entryFiles':len(entry),'publicFiles':len(files)}
(OUT/'delivery.json').write_text(json.dumps(result,indent=2))
shots=[{'path':str(p.relative_to(ROOT)),'absolutePath':str(p),'sha256':sha(p.read_bytes())} for p in sorted(OUT.glob('*.png'))]
(OUT/'screenshots.json').write_text(json.dumps(shots,indent=2))
created=['tests/actions-sibling-parity.test.mjs','tests/browser-actions-refinement.py','tests/browser-actions-supplement.py','scripts/verify-actions-refinement.py']
assert all((ROOT/p).is_file() for p in created)
external=['/opt/data/workspace/ELEVEN-CARDS-TAKEN.md','/opt/data/skills/smart-home/eleven-card-design/SKILL.md']
evidence=sorted({str(p.relative_to(ROOT)) for p in OUT.rglob('*') if p.is_file()}|{str((OUT/'changed-files.json').relative_to(ROOT))})
manifest={'modifiedExisting':sorted(changed),'createdCode':created,'canonicalRecord':external[0],'proceduralMemoryUpdated':external[1],'fileHashes':{p:sha((ROOT/p).read_bytes()) for p in sorted(changed)+created},'externalHashes':{p:sha(Path(p).read_bytes()) for p in external},'evidenceFiles':evidence,'screenshotCount':len(shots)}
(OUT/'changed-files.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({k:v for k,v in result.items() if k not in ('protectedFilePaths','httpChecks')},indent=2));print('HTTP byte matches:',len(checks),'screenshots:',len(shots),'modified entry files:',len(changed),'created code:',len(created),'evidence files:',len(evidence))
