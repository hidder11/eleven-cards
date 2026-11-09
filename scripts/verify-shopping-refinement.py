"""Verify Shopping-only delta against immutable dirty-entry content."""
import hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-evidence/shopping-refinement'
sha=lambda b:hashlib.sha256(b).hexdigest()
entry=json.loads((OUT/'entry-hashes.json').read_text())
allowed={'cards/shopping-card/src/eleven-shopping-card.js','cards/shopping-card/dist/eleven-shopping-card.js','cards/shopping-card/tests/browser_test.py','docs/THEME-FOLLOWING-DESIGN.md','docs/VISUAL-FIXES.md','dist/eleven-cards.js'}
changed=[p for p,h in entry.items() if sha((ROOT/p).read_bytes())!=h]
unexpected=sorted(set(changed)-allowed)
assert not unexpected,unexpected
assert set(changed)==allowed,{'missingExpectedDelta':sorted(allowed-set(changed))}
for p,h in entry.items():
 assert sha((OUT/'entry'/p).read_bytes())==h,('Entry snapshot mutated',p)
extra=json.loads((OUT/'additional-prewrite-hashes.json').read_text())
assert sha((ROOT/'build-review.py').read_bytes())==extra['build-review.py'],'Gallery generator changed'
canonical=Path('/opt/data/workspace/ELEVEN-CARDS-TAKEN.md').read_text()
original=(OUT/'entry-canonical-task-list.md').read_text()
start=canonical.index('### Boodschappen / Shopping — actuele opvolging (1 november 2026)')
end=canonical.index('### Actuele reviewstatus',start)
assert canonical[:start]+canonical[end:]==original,'Canonical record has unexpected edits beyond additive Shopping block'
paths=re.findall(r"  '(cards/[^']+/dist/[^']+\.js)',",(ROOT/'scripts/build.mjs').read_text())
assert len(paths)==12,paths
header='// Eleven Cards — HACS collection; twelve card types, no external dependencies.\n'
old=header+'\n;\n'.join((OUT/'entry'/p).read_text() for p in paths)
new=header+'\n;\n'.join((ROOT/p).read_text() for p in paths)
assert old==(OUT/'entry-collection.js').read_text(),'Entry collection was not the recorded slice composition'
assert new==(ROOT/'dist/eleven-cards.js').read_text(),'Current collection differs from actual build recipe'
slices=[p for p in paths if (OUT/'entry'/p).read_bytes()!=(ROOT/p).read_bytes()]
assert slices==['cards/shopping-card/dist/eleven-shopping-card.js'],slices
# Every line after style has only the two approved markup changes, not behavior edits.
src=ROOT/'cards/shopping-card/src/eleven-shopping-card.js'
before=(OUT/'entry/cards/shopping-card/src/eleven-shopping-card.js').read_text()
after=src.read_text()
def behavior(s):
 s=s[s.index('class ShoppingCard'):]
 s=s.replace('<span class="row-copy">${summary}</span><span class="edit-hint" aria-hidden="true">${svg(\'edit\')}</span>','${summary}')
 s=s.replace('<span class="title-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 7h12l2 14H4L6 7ZM9 8V6a3 3 0 0 1 6 0v2"/></svg></span>','')
 return s
assert behavior(before)==behavior(after),'Non-style/approved markup behavior changed'
matrices={}
for target in ['standalone','collection']:
 result=json.loads((OUT/target/'results.json').read_text())
 assert len(result['matrix'])==12 and result['interactionSets']==1 and result['pageErrors']==[],result
 screenshots=sorted(p.name for p in (OUT/target).glob('*.png'))
 matrices[target]={'cases':len(result['matrix']),'screenshots':len(screenshots),'files':screenshots,'pageErrors':result['pageErrors']}
result={'entryFiles':len(entry),'unchangedEntryFiles':len(entry)-len(changed),'changedEntryFiles':changed,'unexpected':unexpected,'collectionSlices':len(paths),'changedSlices':slices,'behaviorUnchanged':True,'hashes':{p:sha((ROOT/p).read_bytes()) for p in sorted(allowed)},'matrices':matrices,'publicVerification':'parent pending','shoppingApproval':'pending'}
(OUT/'scope.json').write_text(json.dumps(result,indent=2))
print(json.dumps({k:v for k,v in result.items() if k!='matrices'},indent=2))
print({t:{k:v for k,v in m.items() if k!='files'} for t,m in matrices.items()})
