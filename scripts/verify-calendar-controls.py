"""Fresh-entry Calendar controls gate; prior refinement evidence stays immutable."""
from pathlib import Path
import hashlib,json,re,urllib.request,concurrent.futures
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-evidence/calendar-controls';ENTRY=OUT/'entry'
def sha(b):return hashlib.sha256(b).hexdigest()
baseline=json.loads((OUT/'entry-hashes.json').read_text())
allowed={'cards/calendar-card/src/calendar-card.js','cards/calendar-card/src/calendar-styles.js','cards/calendar-card/dist/eleven-calendar-card.js','dist/eleven-cards.js','docs/THEME-FOLLOWING-DESIGN.md','docs/VISUAL-FIXES.md','tests/browser-calendar-refinement.py','tests/browser-calendar-supplement.py'}
changed=[];protected=[]
for name,digest in baseline.items():
 actual=sha((ROOT/name).read_bytes())
 assert sha((ENTRY/name).read_bytes())==digest,('entry mutated',name)
 if actual!=digest:assert name in allowed,('unbounded mutation',name);changed.append(name)
 else:protected.append(name)
assert set(changed)==allowed,changed
paths=re.findall(r"  '(cards/[^']+\.js)'",(ROOT/'scripts/build.mjs').read_text());assert len(paths)==12
header='// Eleven Cards — HACS collection; twelve card types, no external dependencies.\n'
for folder in [ROOT,ENTRY]:assert (folder/'dist/eleven-cards.js').read_text()==header+'\n;\n'.join((folder/path).read_text() for path in paths)
slices=[]
for path in paths:
 old=(ENTRY/path).read_bytes();new=(ROOT/path).read_bytes();name=Path(path).parts[1]
 assert (old!=new)==(name=='calendar-card'),('protected slice',name)
 slices.append({'name':name,'sha256':sha(new),'changed':old!=new})
for path in ['shared/card-theme.js','shared/card-header.js','shared/ui-popup.js','themes/eleven_material.yaml','review/gallery.js','build-review.py','scripts/verify-calendar-refinement.py','cards/overview-card/dist/eleven-overview-card.js','cards/history-graph-card/src/history-graph-card.js','cards/timeline-card/src/timeline-card.js','cards/heatmap-card/src/heatmap-card.js']:
 assert path in protected,path
# No new surface button tiles or fake range picker; action triple wraps as one.
source=(ROOT/'cards/calendar-card/src/calendar-card.js').read_text();assert 'class="navigation-actions"' in source and '<span class="range">' in source and 'Agendaopties' in source
central=(ROOT.parent/'ELEVEN-CARDS-TAKEN.md').read_text();assert central.startswith((OUT/'entry-central-tasks.md').read_text());assert 'Agenda date/info controls follow-up' in central
full=json.loads((OUT/'full-results.json').read_text());supp=json.loads((OUT/'supplement-results.json').read_text());controls=json.loads((OUT/'control-results.json').read_text())
assert len(full['matrix'])==12 and len(full['stress'])==29 and len(full['interactions'])==3 and not full['errors']
assert not supp['errors'] and not controls['errors'] and len(controls['matrix'])==12 and controls['text200Widths']==[320,390,1280]
assert controls['review']=={'approved':6,'pending':12,'examples':18} and controls['services']==0
node=(OUT/'node.log').read_text();assert re.search(r'(?:ℹ|#) fail 0',node)
check=(OUT/'check.log').read_text();syntax=check.count('node --check');assert syntax==17 and 'SyntaxError' not in check
share=json.loads((ROOT.parent/'eleven-share/share.json').read_text());u=urlsplit(share['url']);public=u.scheme+'://'+u.netloc;base='/'+share['token']+'/cards/'
served=['dist/eleven-cards.js','cards/home-controls/dist/eleven-home-controls-card.js','cards/room-card/dist/eleven-room-card.js','cards/appliance-planner/dist/eleven-appliance-planner.js','cards/scene-engine-card/dist/eleven-scene-engine-card.js','review/index.html','review/gallery.js','review/ha-stub.js']
def fetch(args):
 origin,path=args;req=urllib.request.Request(origin+base+path,headers={'Cache-Control':'no-cache'});r=urllib.request.urlopen(req,timeout=90);b=r.read();assert r.status==200 and b==(ROOT/path).read_bytes(),('served mismatch',origin,path)
 return {'origin':origin,'path':path,'status':r.status,'bytes':len(b),'sha256':sha(b)}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:readbacks=list(pool.map(fetch,[(origin,path) for origin in ['http://127.0.0.1:56515',public] for path in served]))
passed=re.search(r'(?:ℹ|#) pass (\d+)',node);assert passed
summary={'changedEntryFiles':changed,'newSupportFiles':['tests/browser-calendar-controls.py','scripts/verify-calendar-controls.py'],'centralTaskFile':str(ROOT.parent/'ELEVEN-CARDS-TAKEN.md'),'protectedCount':len(protected),'protectedEntryFiles':protected,'collectionSlices':slices,'httpReadbacks':readbacks,'calendarSha256':sha((ROOT/'cards/calendar-card/dist/eleven-calendar-card.js').read_bytes()),'collectionSha256':sha((ROOT/'dist/eleven-cards.js').read_bytes()),'tests':{'nodePass':int(passed[1]),'syntax':syntax,'matrix':len(full['matrix']),'stress':len(full['stress']),'interactionWidths':len(full['interactions']),'supplementChecks':len(supp['checks']),'controlsMatrix':len(controls['matrix']),'text200Widths':controls['text200Widths']},'review':controls['review'],'nativeHA':'not accessed; visual acceptance pending','release':'no commit/push/release'}
(OUT/'delivery.json').write_text(json.dumps(summary,indent=2));print(json.dumps({k:v for k,v in summary.items() if k not in ['protectedEntryFiles','collectionSlices','httpReadbacks']},indent=2));print('Exact HTTP readbacks:',len(readbacks))
