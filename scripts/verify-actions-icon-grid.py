"""Fresh entry protection and exact served Actions preview bytes; no HA."""
from pathlib import Path
import hashlib,json,urllib.request
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-evidence/actions-icon-grid'
def sha(data):return hashlib.sha256(data).hexdigest()
entry=json.loads((OUT/'entry-hashes.json').read_text())
allowed={'cards/home-controls/src/standalone-cards.js','cards/home-controls/dist/eleven-home-controls-card.js','cards/home-controls/README.md','docs/THEME-FOLLOWING-DESIGN.md','docs/VISUAL-FIX-PLAN.md','docs/VISUAL-FIXES.md'}
changed=[];protected=[]
for path,old in entry.items():
 current=sha((ROOT/path).read_bytes())
 if current!=old:changed.append(path);assert path in allowed,('out of scope',path)
 else:protected.append(path)
files=json.loads((ROOT/'review/public-files.json').read_text());assert len(files)==8
share=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text());prefix=f"/{share['token']}/cards/"
checks=[];public='https://kyle-modules-tions-donald.trycloudflare.com'
for host in ['http://127.0.0.1:56515',public]:
 for path in files:
  local=(ROOT/path).read_bytes();url=host+prefix+path+'?actions-icon-grid='+sha(local)[:12]
  with urllib.request.urlopen(url,timeout=45) as response:
   data=response.read();assert response.status==200 and data==local,(url,len(data),len(local))
   checks.append({'url':url,'status':response.status,'sha256':sha(data),'bytes':len(data)})
result={'entryFiles':len(entry),'protectedFiles':len(protected),'protectedPaths':protected,'changedEntryFiles':sorted(changed),'httpChecks':checks,'localURL':'http://127.0.0.1:56515'+prefix+'review/#card-actions-card','publicURL':public+prefix+'review/#card-actions-card','targetSHA256':sha((ROOT/'cards/home-controls/dist/eleven-home-controls-card.js').read_bytes()),'collectionSHA256':sha((ROOT/'dist/eleven-cards.js').read_bytes())}
(OUT/'delivery.json').write_text(json.dumps(result,indent=2))
shots=[{'path':str(p),'sha256':sha(p.read_bytes())} for p in sorted(OUT.glob('*.png'))]
(OUT/'screenshots.json').write_text(json.dumps(shots,indent=2))
print(json.dumps({k:v for k,v in result.items() if k not in ('protectedPaths','httpChecks')},indent=2));print('HTTP byte matches:',len(checks),'screenshots:',len(shots))
