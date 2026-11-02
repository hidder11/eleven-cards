"""Build isolated standalone Eleven card, never mutate shared Eleven bundles."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
shared=(root/'web/house-light-card.js').read_text().split('class HouseLightCard')[0].replace('globalThis.HousePixels=','const HousePixels=')
(root/'web/eleven-house-card.js').write_text('(()=>{\n'+shared+(root/'web/eleven-house-card.src.js').read_text()+'\n})();\n')
