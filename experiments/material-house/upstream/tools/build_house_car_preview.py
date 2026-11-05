"""Build the opt-in preview without touching the live card bundle."""
from pathlib import Path
import re,hashlib,json
ROOT=Path(__file__).resolve().parents[1]
VENDOR=ROOT/'web/vendor/car-pr5'
files=['ui-button.js','ui-surface.js','ui-metric.js','header-backgrounds.js','header-atmosphere.js']
provenance=json.loads((VENDOR/'provenance.json').read_text())
assert set(files)==set(provenance['files']), 'Incomplete shared dependency closure'
shared=[]
for name in files:
    data=(VENDOR/name).read_bytes()
    assert hashlib.sha256(data).hexdigest()==provenance['files'][name]['sha256'], 'Upstream provenance drift: '+name
    text=data.decode()
    text=re.sub(r'^import .*?;\n','',text,flags=re.M).replace('export ','')
    shared.append(text)
base=(ROOT/'web/eleven-house-card.src.js').read_text()
# Both base/editor are private preview types; no production names registered.
base=base.replace("'eleven-house-card-editor'","'eleven-house-card-original-preview-editor'").replace("'eleven-house-card'","'eleven-house-card-original-preview'")
pixels=(ROOT/'web/house-light-card.js').read_text().split('class HouseLightCard')[0].replace('globalThis.HousePixels=','const HousePixels=')
result='(()=>{\n'+pixels+'\n'+'\n'.join(shared)+'\n'+base+'\n'+(ROOT/'web/house-car-style-preview.src.js').read_text()+'\n})();\n'
(ROOT/'web/house-car-style-preview.js').write_text(result)
print('Built isolated preview:',len(result.encode()),'bytes')
