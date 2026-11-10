"""Build only the isolated house experiment; never a production entry point."""
from pathlib import Path
import re,json,hashlib
ROOT=Path(__file__).resolve().parent; REPO=ROOT.parents[1]; U=ROOT/'upstream'; OUT=ROOT/'dist';OUT.mkdir(exist_ok=True)
provenance=json.loads((U/'source-hashes.json').read_text(encoding='utf-8'))
for name,digest in provenance.items():
 p=U/name
 if name=='web/house-car-style-preview.js':continue # Generated original; rebuilt from the immutable sources instead.
 assert p.is_file(), 'Missing upstream input: '+name
 assert hashlib.sha256(p.read_bytes()).hexdigest()==digest,name
pixels=(U/'web/house-light-card.js').read_text(encoding='utf-8').split('class HouseLightCard')[0].replace('globalThis.HousePixels=','const HousePixels=')
def module(path):
 s=path.read_text(encoding='utf-8');s=re.sub(r'^import .*?;\n','',s,flags=re.M);return re.sub(r'\bexport (?=(?:function|const|class))','',s)
shared='\n'.join(module(U/'web/vendor/car-pr5'/name) for name in ['ui-button.js','ui-surface.js','ui-metric.js','header-backgrounds.js','header-atmosphere.js'])
base=(U/'web/eleven-house-card.src.js').read_text(encoding='utf-8').replace("'eleven-house-card-editor'","'eleven-house-baseline-editor'").replace("'eleven-house-card'","'eleven-house-baseline'")
style=(U/'web/house-car-style-preview.src.js').read_text(encoding='utf-8').replace("'eleven-house-style-preview-editor'","'eleven-house-styled-baseline-editor'").replace("'eleven-house-style-preview'","'eleven-house-styled-baseline'")
style=style.replace('Vormgeving · Daniel (proef)','Vormgeving')
material=module(ROOT/'src/house-theme.js');accent=module(REPO/'shared/material-accent.js')
# House always supplies resolved solid HA colors. Do not ship the helper's
# legacy material palette fallbacks inside this native-by-default pilot.
accent=accent.replace("surface=dark?'#2c303d':'#edf0f6'",'surface')
accent=accent.replace("const base=parseColor(surface)||parseColor(dark?'#2c303d':'#edf0f6');",'const base=parseColor(surface);if(!base)return null;')
assert "#2c303d" not in accent and "#edf0f6" not in accent, 'Review shared accent fallback changes before rebuilding House'
result='(()=>{\n'+pixels+'\n'+shared+'\n'+base+'\n'+style+'\n'+material+'\n'+accent+'\n'+(ROOT/'src/material-house.js').read_text(encoding='utf-8')+'\n})();\n'
(OUT/'material-house.js').write_text(result,encoding='utf-8',newline='\n')
print(json.dumps({'bytes':len(result.encode()),'sha256':hashlib.sha256(result.encode()).hexdigest(),'production_files_changed':False}))
