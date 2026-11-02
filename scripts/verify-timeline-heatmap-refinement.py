"""Read-only entry-byte protection, collection and HTTP delivery gate."""
from pathlib import Path
import hashlib,json,re,urllib.request,time
ROOT=Path(__file__).resolve().parents[1];BASE=Path('/opt/data/cache/scratch/timeline-heatmap-baseline');OUT=ROOT/'qa-evidence/timeline-heatmap-refinement';OUT.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
entry=json.loads((BASE/'manifest.json').read_text())
allowed={'cards/timeline-card/src/timeline-view.js','cards/timeline-card/src/timeline-card.js','cards/timeline-card/dist/eleven-timeline-card.js','cards/heatmap-card/src/heatmap-card.js','cards/heatmap-card/dist/eleven-heatmap-card.js','cards/heatmap-card/tests/card.test.mjs','tests/shared-header.test.mjs','dist/eleven-cards.js','docs/THEME-FOLLOWING-DESIGN.md','docs/VISUAL-FIXES.md'}
delta=[];protected=[]
for f,old in entry.items():
 p=ROOT/f;assert p.is_file(),f
 actual=sha(p.read_bytes())
 if actual!=old:assert f in allowed,('unexpected task delta',f);delta.append({'path':f,'before':old,'after':actual})
 else:protected.append({'path':f,'sha256':actual})
assert set(x['path'] for x in delta)==allowed,('expected scoped edits differ',delta)
modules=re.findall(r"  '(cards/[^']+\.js)'",(ROOT/'scripts/build.mjs').read_text());header='// Eleven Cards — HACS collection; twelve card types, no external dependencies.\n'.encode()
expected=header+b'\n;\n'.join((ROOT/f).read_bytes()for f in modules);assert (ROOT/'dist/eleven-cards.js').read_bytes()==expected
for f in modules:
 if f not in {'cards/timeline-card/dist/eleven-timeline-card.js','cards/heatmap-card/dist/eleven-heatmap-card.js'}:assert sha((ROOT/f).read_bytes())==entry[f],('unrelated standalone changed',f)
base='http://127.0.0.1:56515/JC5klAkxdKA9PmJO7YSGqy76RQb7-mo6C0aJPXHgbsI/cards/'
public='https://kyle-modules-tions-donald.trycloudflare.com/JC5klAkxdKA9PmJO7YSGqy76RQb7-mo6C0aJPXHgbsI/cards/'
served=[];slices=[]
for origin,url in [('local',base),('public',public)]:
 for f in json.loads((ROOT/'review/public-files.json').read_text()):
  data=None;status=None
  for attempt in range(3):
   try:
    with urllib.request.urlopen(url+f,timeout=30) as response:data=response.read();status=response.status
    break
   except Exception:
    if attempt==2:raise
    time.sleep(1)
  assert isinstance(data,bytes) and status==200 and data==(ROOT/f).read_bytes(),('served mismatch',origin,f)
  served.append({'origin':origin,'path':f,'status':status,'bytes':len(data),'sha256':sha(data)})
  if f=='dist/eleven-cards.js':
   offset=len(header)
   for i,module in enumerate(modules):
    content=(ROOT/module).read_bytes();actual=data[offset:offset+len(content)];assert actual==content
    slices.append({'origin':origin,'path':module,'offset':offset,'bytes':len(actual),'sha256':sha(actual)});offset+=len(content)+(len(b'\n;\n')if i<len(modules)-1 else 0)
reports={name:json.loads((ROOT/f'qa-evidence/{name}-refinement/results.json').read_text())for name in ['timeline','heatmap']};browser={name:{'matrix':len(d['matrix']),'interactions':len(d['interactions']),'stress':len(d['stress']),'errors':d['errors']}for name,d in reports.items()}
nodeLog=(OUT/'logs/npm-test-final.log').read_text();counts=[int(x) for x in re.findall(r'^ℹ tests (\d+)$',nodeLog,re.M)];assert len(counts)==3;assert len(re.findall(r'^ℹ fail 0$',nodeLog,re.M))==3;py=re.search(r'Ran (\d+) tests',nodeLog);assert py and '\nOK\n' in nodeLog
result={'baseline':str(BASE),'entry_file_count':len(entry),'changed_existing':delta,'protected_file_count':len(protected),'protected_files':protected,'collection_exact':True,'served':served,'served_module_slices':slices,'browser':browser,'node_tests':sum(counts),'node_suites':counts,'python_tests':int(py[1]),'new_sources':[str(f.relative_to(ROOT))for f in [ROOT/'tests/browser-timeline-heatmap-refinement.py',ROOT/'tests/browser-timeline-heatmap-interactions.py',ROOT/'scripts/verify-timeline-heatmap-refinement.py']],'screenshots':{name:len(list((ROOT/f'qa-evidence/{name}-refinement').glob('*.png')))for name in ['timeline','heatmap']}}
(OUT/'delivery.json').write_text(json.dumps(result,indent=2));print(json.dumps({k:v for k,v in result.items()if k in ['entry_file_count','protected_file_count','collection_exact','browser','node_tests','python_tests','screenshots']}));print(json.dumps({'changed_existing':[x['path']for x in delta],'served_exact_files':len(served),'served_exact_module_slices':len(slices)}))
