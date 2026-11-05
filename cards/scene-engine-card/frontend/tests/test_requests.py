"""Focused request-table-in-Details regression, run before UI implementation."""
import functools, http.server, os, threading
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[4]
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
    with sync_playwright() as p:
        b=p.chromium.launch(executable_path=os.environ.get('CARD_QA_CHROMIUM','/opt/hermes/tools/chromium-1208/chrome-linux64/chrome'),args=['--no-sandbox','--disable-dev-shm-usage'])
        page=b.new_page()
        page.goto(f'http://127.0.0.1:{server.server_port}/cards/scene-engine-card/frontend/demo.html'+ ('?bundle' if os.environ.get('SCENE_CARD_BUNDLE') else ''))
        page.wait_for_function('window.ready')
        table=page.locator('eleven-scene-engine-card').locator('table')
        expect(table).not_to_be_visible()
        expect(page.locator('eleven-scene-engine-card').locator('.winner')).to_be_visible()
        page.locator('eleven-scene-engine-card').locator('#details-slot>details>summary').click()
        expect(table).to_be_visible(timeout=2000)
        expect(table.locator('thead th')).to_have_text(['Request','Prio','Afhankelijk van','Actief'])
        expect(table.locator('tbody tr')).to_have_count(3)
        expect(table.locator('tbody tr').nth(1).locator('.cell-value')).to_have_text(['Basis','0','—','Ja'])
        expect(table.locator('tbody tr').nth(2).locator('.cell-value')).to_have_text(['Nachtlicht','20','Nacht','Nee'])
        page.evaluate('configure({show_details:false})')
        expect(table).to_have_count(0)
        print('PASS: request table only inside Details, four values, zero, dependency, memberships, show_details isolation')
        b.close()
finally:
    server.shutdown();server.server_close()
