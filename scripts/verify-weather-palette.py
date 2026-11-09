"""Fresh task-scoped Weather palette hashes, composition and served-byte proof."""
import hashlib,json,re,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-evidence/weather-palette'
def sha(b):return hashlib.sha256(b).hexdigest()
entry=json.loads((OUT/'entry-hashes.json').read_text())
allowed={'cards/weather-card/src/weather-card.js','cards/weather-card/src/weather-styles.js','cards/weather-card/dist/eleven-weather-card.js','cards/weather-card/dist/eleven-weather-card-test.js','dist/eleven-cards.js','tests/browser-weather-glow.py','docs/THEME-FOLLOWING-DESIGN.md','docs/VISUAL-FIX-PLAN.md','docs/VISUAL-FIXES.md'}
changed=[p for p,h in entry.items() if sha((ROOT/p).read_bytes())!=h]
assert set(changed)==allowed,changed
new=[str(p.relative_to(ROOT)) for p in ROOT.rglob('*') if p.is_file() and not set(p.relative_to(ROOT).parts)&{'.git','node_modules','qa-evidence','__pycache__'} and str(p.relative_to(ROOT)) not in entry]
assert set(new)=={'cards/weather-card/tests/palette.test.mjs','tests/browser-weather-palette.py','scripts/verify-weather-palette.py'},new
paths=re.findall(r"'(cards/[^']+\.js)'",(ROOT/'scripts/build.mjs').read_text())
modules=[(ROOT/p).read_bytes() for p in paths]
expected='// Eleven Cards — HACS collection; twelve card types, no external dependencies.\n'.encode()+b'\n;\n'.join(modules)
assert (ROOT/'dist/eleven-cards.js').read_bytes()==expected
slices=[{'path':p,'sha256':sha(b),'changed':entry[p]!=sha(b)} for p,b in zip(paths,modules)]
assert [s['path'] for s in slices if s['changed']]==['cards/weather-card/dist/eleven-weather-card.js']
normal=(ROOT/'cards/weather-card/dist/eleven-weather-card.js').read_text();test=(ROOT/'cards/weather-card/dist/eleven-weather-card-test.js').read_text()
assert test==normal.replace('eleven-weather-card','eleven-weather-card-test').replace('eleven-weather-editor','eleven-weather-editor-test')
share=json.loads(Path('/opt/data/workspace/eleven-share/share.json').read_text());token=share['token']
from urllib.parse import urlsplit
public=urlsplit(share['url']);origins=[f"http://127.0.0.1:{share['port']}",f'{public.scheme}://{public.netloc}']
readbacks=[]
for origin in origins:
 for path in json.loads((ROOT/'review/public-files.json').read_text()):
  with urllib.request.urlopen(f'{origin}/{token}/cards/{path}',timeout=60) as response:data=response.read();status=response.status
  expected=(ROOT/path).read_bytes();assert status==200 and data==expected,(origin,path)
  readbacks.append({'origin':origin,'path':path,'status':status,'bytes':len(data),'sha256':sha(data),'equal':True})
result={'changedEntryFiles':changed,'newFiles':new,'protectedEntryFiles':len(entry)-len(changed),'composition':slices,'httpReadbacks':readbacks,'allReadbacksEqual':True,'aggregateSha256':sha((ROOT/'dist/eleven-cards.js').read_bytes()),'unchangedIllustrationFiles':['cards/weather-card/src/weather-art.js','cards/weather-card/src/weather-icon-styles.js']}
(OUT/'delivery.json').write_text(json.dumps(result,indent=2))
print(json.dumps({**{k:result[k] for k in ['changedEntryFiles','newFiles','protectedEntryFiles','allReadbacksEqual','aggregateSha256']},'compositionSlices':len(slices),'changedSlices':sum(s['changed'] for s in slices),'httpReadbacks':len(readbacks)},indent=2))
