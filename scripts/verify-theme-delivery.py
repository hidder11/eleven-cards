"""Verify preservation and produce a local-only, House-free review artifact."""
from pathlib import Path
import hashlib,json,re,subprocess,zipfile
import yaml
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-evidence/theme-following'
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
baseline=json.loads((OUT/'local-baseline-hashes.json').read_text())
preserved=[]
for group,entries in baseline.items():
 for relative,expected in entries.items():
  path=Path(relative) if group=='house_approved' else ROOT.parent/'eleven-cards/cards'/group/relative
  assert sha(path)==expected,('original source changed',str(path))
  preserved.append(str(path))
scene_base=ROOT.parent/'eleven-scene-engine/frontend'
for relative,expected in json.loads((OUT/'scene-engine-baseline.json').read_text()).items():
 path=scene_base/relative;assert sha(path)==expected,('Scene original changed',str(path));preserved.append(str(path))
subprocess.run(['git','diff','--exit-code','HEAD','--','cards/house-card'],cwd=ROOT,check=True,capture_output=True)
old=yaml.safe_load((ROOT.parent/'eleven-material-theme/eleven_material.yaml').read_text())['Eleven Material']
new=yaml.safe_load((ROOT/'themes/eleven_material.yaml').read_text())['Eleven Material']
assert all(new[k]==v for k,v in old.items()),'Approved House theme roles changed'
assert len(new)-len(old)==5,'Only five additive CSS-ready material roles expected'
browser=json.loads((OUT/'browser-results.json').read_text());assert browser['cases']==12 and browser['card_checks']==216 and browser['page_errors']==[]
assert len(browser['css_only_switches'])==4 and len(browser['forced_colors'])==18
names=sorted(set(c['name'] for row in browser['results'] for c in row['cards']));assert len(names)==18
node=(OUT/'npm-test.log').read_text();counts=[int(n) for n in re.findall(r'ℹ tests (\d+)',node)]
assert counts==[552,74,137],counts
assert all(int(n)==0 for n in re.findall(r'ℹ fail (\d+)',node))
for filename,count in [('shopping-source.log',24),('shopping-built.log',24),('browser-smoke.log',1)]:
 log=(OUT/filename).read_text();assert f'Ran {count} test' in log and log.rstrip().endswith('OK'),filename
assert json.loads((OUT/'planner-browser.log').read_text())['checks']==28
assert json.loads((OUT/'scene-browser.log').read_text())['checks']==18
snapshot_deltas={}
for group in ['appliance-planner','home-controls','room-card']:
 snapshot_deltas[group]=[relative for relative,expected in baseline[group].items() if sha(ROOT/'cards'/group/relative)!=expected]
snapshot_deltas['scene-engine-card']=[relative for relative,expected in json.loads((OUT/'scene-engine-baseline.json').read_text()).items() if sha(ROOT/'cards/scene-engine-card/frontend'/relative)!=expected]
tracked=subprocess.check_output(['git','diff','--name-only'],cwd=ROOT,text=True).splitlines()
new_files=subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=ROOT,text=True).splitlines()
new_files=sorted(set(new_files+['docs/THEME-FOLLOWING-FILES.json','artifacts/eleven-theme-following-local.zip']))
manifest={'base':'5bdd44b origin/develop','branch':'feat/theme-following-cards','tracked_modified':tracked,'created_files':new_files,'snapshot_deltas':snapshot_deltas,'originals_preserved':preserved,'card_types_migrated':sorted(n for n in names if n!='car-evcc'),'additional_variants':['car-evcc'],'House':'excluded and byte-unchanged','tests':{'node_suites':counts,'node_total':sum(counts),'browser_matrix':216,'shopping_source':24,'shopping_bundle':24,'appliance_checks':28,'scene_checks':18,'collection_smoke':1,'css_only':4,'forced_colors':18},'all_card_screenshots':[str(p.relative_to(ROOT)) for p in sorted(OUT.glob('*.png')) if not p.name.startswith('collection-')]}
(ROOT/'docs/THEME-FOLLOWING-FILES.json').write_text(json.dumps(manifest,indent=2)+'\n')
# Standalones only: never ship/reinstall the approved House as part of this task.
bundles=sorted(p for p in ROOT.glob('cards/*/dist/*.js') if p.name not in ['eleven-house-card.js'] and not p.name.endswith('-test.js'))
assert len(bundles)==15,[str(p) for p in bundles]
assert all('function cardThemeStyles(' in p.read_text() for p in bundles)
files=bundles+[ROOT/'themes/eleven_material.yaml',ROOT/'docs/THEME-FOLLOWING-VERIFICATION.md',ROOT/'docs/THEME-FOLLOWING-FILES.json']
archive=ROOT/'artifacts/eleven-theme-following-local.zip';archive.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for path in files:z.write(path,str(path.relative_to(ROOT)))
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 assert not any('/house-card/' in n or n=='dist/eleven-cards.js' for n in z.namelist())
 for path in files:assert hashlib.sha256(z.read(str(path.relative_to(ROOT)))).hexdigest()==sha(path)
summary={'node_tests':sum(counts),'matrix_checks':browser['card_checks'],'target_card_types':len(manifest['card_types_migrated']),'additional_variants':1,'standalone_bundles':len(bundles),'preserved_original_files':len(preserved),'snapshot_deltas':snapshot_deltas,'archive':str(archive),'archive_bytes':archive.stat().st_size,'archive_sha256':sha(archive)}
(OUT/'delivery-verification.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary,indent=2))
