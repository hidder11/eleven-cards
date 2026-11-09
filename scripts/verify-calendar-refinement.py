"""Read-only Calendar delivery gate; immutable dirty entry baseline."""
from pathlib import Path
import hashlib,json,re,urllib.request,concurrent.futures
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-evidence/calendar-refinement';ENTRY=OUT/'entry'
def sha(b):return hashlib.sha256(b).hexdigest()
baseline=json.loads((OUT/'entry-hashes.json').read_text())
allowed={'cards/calendar-card/src/calendar-card.js','cards/calendar-card/src/calendar-styles.js','cards/calendar-card/dist/eleven-calendar-card.js','dist/eleven-cards.js','build-review.py','review/gallery.js','docs/THEME-FOLLOWING-DESIGN.md','docs/VISUAL-FIXES.md'}
changed=[];protected=[]
for n,h in baseline.items():
 actual=sha((ROOT/n).read_bytes())
 if actual!=h:assert n in allowed,('unexpected entry mutation',n);changed.append(n)
 elif n not in allowed:protected.append(n)
assert {'cards/calendar-card/src/calendar-card.js','cards/calendar-card/src/calendar-styles.js','build-review.py','review/gallery.js'}<=set(changed)
# Preserve all five approved graphs plus Overview and all other composition slices exactly.
aggregate=(ROOT/'dist/eleven-cards.js').read_text();entry=(ENTRY/'dist/eleven-cards.js').read_text()
paths=re.findall(r"  '(cards/[^']+\.js)'",(ROOT/'scripts/build.mjs').read_text());assert len(paths)==12
header='// Eleven Cards — HACS collection; twelve card types, no external dependencies.\n'
assert aggregate==header+'\n;\n'.join((ROOT/p).read_text() for p in paths),'current composition mismatch'
assert entry==header+'\n;\n'.join((ENTRY/p).read_text() for p in paths),'entry composition mismatch'
modules=[]
for path in paths:
 name=Path(path).parts[1];body=(ROOT/path).read_bytes();old=(ENTRY/path).read_bytes()
 if name!='calendar-card':assert body==old,('protected embedded slice',name)
 modules.append({'name':name,'sha256':sha(body),'changed':body!=old})
# Generator/output may only change approval set and the approved-count sentence.
for name in ['build-review.py','review/gallery.js']:
 old=(ENTRY/name).read_text();expected=old.replace("'timeline-card','heatmap-card']);","'timeline-card','heatmap-card','overview-card']);").replace('Deze vijf kaarten zijn afzonderlijk','Deze zes kaarten zijn afzonderlijk')
 assert (ROOT/name).read_text()==expected,('unbounded review edit',name)
base='/JC5klAkxdKA9PmJO7YSGqy76RQb7-mo6C0aJPXHgbsI/cards/'
# Use server's actual share manifest, not remembered tunnel metadata.
from urllib.parse import urlsplit
share=json.loads((ROOT.parent/'eleven-share/share.json').read_text());url=urlsplit(share['url']);public=url.scheme+'://'+url.netloc
assert base=='/'+share['token']+'/cards/'
paths=['dist/eleven-cards.js','cards/home-controls/dist/eleven-home-controls-card.js','cards/room-card/dist/eleven-room-card.js','cards/appliance-planner/dist/eleven-appliance-planner.js','cards/scene-engine-card/dist/eleven-scene-engine-card.js','review/index.html','review/gallery.js','review/ha-stub.js']
def fetch(target):
 origin,n=target;req=urllib.request.Request(origin+base+n,headers={'Cache-Control':'no-cache'});r=urllib.request.urlopen(req,timeout=90);b=r.read();assert r.status==200 and b==(ROOT/n).read_bytes(),('served mismatch',origin,n)
 return {'origin':origin,'path':n,'status':r.status,'bytes':len(b),'sha256':sha(b)}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:readbacks=list(pool.map(fetch,[(o,n) for o in ['http://127.0.0.1:56515',public] for n in paths]))
browser=json.loads((OUT/'full-results.json').read_text());supplement=json.loads((OUT/'supplement-results.json').read_text())
assert len(browser['matrix'])==12 and len(browser['stress'])==29 and len(browser['interactions'])==3 and not browser['errors'] and not supplement['errors']
tests={}
for name in ['final-root-node.log','calendar-node.log','energy-node.log','history-node.log']:
 s=(OUT/name).read_text();tests[name]={k:[int(v) for v in re.findall('ℹ '+k+r' (\d+)',s)] for k in ['tests','pass','fail']}
assert tests['final-root-node.log']['fail']==[1];assert 'HeatmapCard.getCardSize' in (OUT/'final-root-node.log').read_text() and 'HeatmapCard.getCardSize' in (OUT/'baseline-collection.log').read_text()
assert all(tests[n]['fail']==[0] for n in ['calendar-node.log','energy-node.log','history-node.log'])
assert all(p in protected for p in ['cards/overview-card/src/overview-card.js','cards/overview-card/dist/eleven-overview-card.js','themes/eleven_material.yaml','shared/card-theme.js'])
summary={'changedEntryFiles':changed,'protectedCount':len(protected),'protectedEntryFiles':protected,'collectionSlices':modules,'httpReadbacks':readbacks,'calendarSha256':sha((ROOT/'cards/calendar-card/dist/eleven-calendar-card.js').read_bytes()),'collectionSha256':sha((ROOT/'dist/eleven-cards.js').read_bytes()),'tests':tests,'matrix':len(browser['matrix']),'stress':len(browser['stress']),'interactionWidths':len(browser['interactions']),'supplementChecks':len(supplement['checks']),'review':{'examples':18,'approved':6,'pending':12,'calendar':'pending','overview':'approved'},'nativeHA':'not accessed; acceptance pending','release':'no commit/push/deployment'}
(OUT/'delivery.json').write_text(json.dumps(summary,indent=2));print(json.dumps({k:v for k,v in summary.items() if k not in ['protectedEntryFiles','collectionSlices','httpReadbacks']}));print('Verified readbacks:',len(readbacks))
