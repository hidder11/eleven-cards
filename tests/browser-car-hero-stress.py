"""Reuse established regular-Car stress/interactions, preserving old evidence."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-evidence/car-hero-thirds'
source=(ROOT/'tests/browser-car-refinement.py').read_text()
source=source.replace("OUT=ROOT/'qa-evidence/car-refinement'", "OUT=ROOT/'qa-evidence/car-hero-thirds/isolated'")
source=source.replace("primary:rect(q('.primary-value'))", "stage:rect(q('.car-stage')),battery:rect(q('.battery-row')),track:rect(q('.battery-track')),primaryNumber:rect(q('.primary-number')),primaryNumberScroll:q('.primary-number').scrollWidth,primary:rect(q('.primary-value'))")
source=source.replace("assert row['primary']['bottom']<=row['picture']['y'],row", """assert row['primaryNumberScroll']<=row['primaryNumber']['width']+1,('percentage ink overflow',row)
    assert row['primary']['right']<=row['battery']['right']+1,('percentage overflow',row)
    assert row['track']['right']<=row['battery']['right']+1,('track must be on left',row)
    if '-text200' not in name:
     assert abs(row['picture']['width']/row['battery']['width']-2)<.02,('1:2 hero topology',row)
     assert row['picture']['x']>=row['battery']['right']+11,('same hero row',row)
    assert all(m['rect']['y']>=row['stage']['bottom'] for m in row['metrics']),('metrics below hero',row)""")
source=source.replace("('compact',", "('full-battery',\"record.hass.states['sensor.soc']={state:'100',attributes:{unit_of_measurement:'%'}};record.card.hass={...record.hass}\"),\n     ('compact',")
exec(compile(source,str(ROOT/'tests/browser-car-refinement.py'),'exec'),{'__file__':str(ROOT/'tests/browser-car-refinement.py'),'__name__':'__main__'})
