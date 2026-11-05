"""Verify bounded Weather-only delta, aggregate composition, and HTTP bytes."""
import hashlib,json,re,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-evidence/weather-glow'
def sha(b):return hashlib.sha256(b).hexdigest()
entry=json.loads((OUT/'entry-hashes.json').read_text())
allowed={'cards/weather-card/src/weather-art.js','cards/weather-card/src/weather-styles.js','cards/weather-card/dist/eleven-weather-card.js','cards/weather-card/dist/eleven-weather-card-test.js','dist/eleven-cards.js'}
changed=[p for p,h in entry.items() if sha((ROOT/p).read_bytes())!=h]
assert set(changed)==allowed,changed
paths=re.findall(r"'(cards/[^']+\.js)'",(ROOT/'scripts/build.mjs').read_text())
modules=[(ROOT/p).read_bytes() for p in paths]
expected='// Eleven Cards — HACS collection; twelve card types, no external dependencies.\n'.encode()+b'\n;\n'.join(modules)
assert (ROOT/'dist/eleven-cards.js').read_bytes()==expected
slices=[{'path':p,'sha256':sha(b),'changed':entry[p]!=sha(b)} for p,b in zip(paths,modules)]
assert [s['path'] for s in slices if s['changed']]==['cards/weather-card/dist/eleven-weather-card.js']
token=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text())['token']
readbacks=[]
for origin in ['http://127.0.0.1:56515','https://kyle-modules-tions-donald.trycloudflare.com']:
 for path in json.loads((ROOT/'review/public-files.json').read_text()):
  with urllib.request.urlopen(f'{origin}/{token}/cards/{path}',timeout=40) as response:
   data=response.read();status=response.status
  expected=(ROOT/path).read_bytes();assert status==200 and data==expected,(origin,path)
  readbacks.append({'origin':origin,'path':path,'status':status,'bytes':len(data),'sha256':sha(data),'equal':True})
result={'changedEntryFiles':changed,'protectedEntryFiles':len(entry)-len(changed),'composition':slices,'httpReadbacks':readbacks,'allReadbacksEqual':True}
(OUT/'delivery.json').write_text(json.dumps(result,indent=2))
print(json.dumps({'changedEntryFiles':changed,'protectedEntryFiles':result['protectedEntryFiles'],'compositionSlices':len(slices),'changedSlices':sum(s['changed'] for s in slices),'httpReadbacks':len(readbacks),'allReadbacksEqual':True,'aggregateSha256':sha((ROOT/'dist/eleven-cards.js').read_bytes())},indent=2))
