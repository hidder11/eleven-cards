"""Contact sheets of captured real Timeline cards (not reconstructed UI)."""
import base64,json
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path(__file__).resolve().parents[1]/'qa-evidence/timeline-spacing'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1650,'height':1100})
    for phase in ['before','after']:
        content='<style>body{margin:16px;background:#888;font:14px system-ui}main{display:grid;grid-template-columns:repeat(4,390px);gap:16px}figure{margin:0}figcaption{color:white;padding:6px}img{display:block;max-width:390px}</style><main>'
        for width in [320,390,1280]:
            for material,dark in [(False,False),(False,True),(True,False),(True,True)]:
                name=f'{phase}-{"material" if material else "ha"}-{width}-{"dark" if dark else "light"}.png'
                data=base64.b64encode((OUT/name).read_bytes()).decode()
                content+=f'<figure><figcaption>{name}</figcaption><img src="data:image/png;base64,{data}"></figure>'
        page.set_content(content+'</main>')
        page.locator('img').last.wait_for()
        page.screenshot(path=str(OUT/f'{phase}-contact-sheet.png'),full_page=True)
    before=json.loads((OUT/'before-geometry.json').read_text());after=json.loads((OUT/'after-geometry.json').read_text())
    result={'matrixCases':len(after),'screenshots':sorted(x.name for x in OUT.glob('*.png')),'spacing':{'headerToWell':[before[0]['headerToWell'],after[0]['headerToWell']],'nameTargetHeight':[before[0]['rows'][0]['label']['h'],after[0]['rows'][0]['label']['h']],'rowHeight':[before[0]['rows'][0]['row']['h'],after[0]['rows'][0]['row']['h']],'nameInkToTrack':[before[0]['rows'][0]['nameToTrack'],after[0]['rows'][0]['nameToTrack']],'wellToLegend':[before[0]['wellToLegend'],after[0]['wellToLegend']],'chartToAxis':[before[0]['chartToAxis'],after[0]['chartToAxis']]},'desktopColumnWidth':after[-1]['card']['w']}
    (OUT/'summary.json').write_text(json.dumps(result,indent=2))
    print(json.dumps(result))
    b.close()
