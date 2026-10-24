// Optional rendered checks using Chrome DevTools, without screenshots,
// recordings, external services, or production Home Assistant data.
// Run with Node.js 22+; CHROME_PATH can select a Chrome executable.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdtemp, access} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve, extname, sep} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url)).replace(/[\\/]$/, '');
const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
await access(chrome);
const profile = await mkdtemp(resolve(root, '.cache/evcc-browser-'));
const mime = {'.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.css': 'text/css'};
const server = createServer(async (request, response) => {
 const path = resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
 if (!path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
 try { response.setHeader('content-type', mime[extname(path)] ?? 'text/plain'); response.end(await readFile(path)); }
 catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = spawn(chrome, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', 'about:blank'], {windowsHide: true, stdio: 'ignore'});
const watchdog = setTimeout(() => { browser.kill(); server.closeAllConnections(); console.error('Browser verification timed out'); process.exit(1); }, 45000);
let socket;
try {
 let debuggingPort;
 for (let attempt = 0; attempt < 100; attempt++) {
  try { debuggingPort = Number((await readFile(resolve(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); break; } catch { await delay(100); }
 }
 assert.ok(debuggingPort, 'Chrome debugging endpoint is available');
 const pages = await (await fetch(`http://127.0.0.1:${debuggingPort}/json`, {signal: AbortSignal.timeout(5000)})).json();
 socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
 await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, {once: true}); socket.addEventListener('error', reject, {once: true}); });
 let id = 0; const pending = new Map(), exceptions = [];
 socket.addEventListener('message', event => {
  const data = JSON.parse(event.data);
  if (data.method === 'Runtime.exceptionThrown') exceptions.push(data.params.exceptionDetails);
  if (data.id) { const handler = pending.get(data.id); pending.delete(data.id); if (data.error) handler.reject(Error(data.error.message)); else handler.resolve(data.result); }
 });
 const send = (method, params = {}) => new Promise((resolve, reject) => {
  const key = ++id, timer = setTimeout(() => { pending.delete(key); reject(Error('CDP timed out: ' + method)); }, 15000);
  pending.set(key, {resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); }});
  socket.send(JSON.stringify({id: key, method, params}));
 });
 const evaluate = async expression => {
  const result = await send('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true});
  assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails)); return result.result.value;
 };
 await send('Runtime.enable'); await send('Page.enable');
 await send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/cards/calendar-card/qa/index.html'});
 for(let i=0;i<100;i++){if(await evaluate('!!window.card?._config'))break;await delay(50);}
 assert.equal(await evaluate(`(async()=>{
  document.querySelector('#audit').click();
  for(let i=0;i<100&&!window.qaAuditResults&&!window.qaAuditError;i++)await new Promise(r=>setTimeout(r,20));
  if(window.qaAuditError)throw Error(window.qaAuditError);
  if(!window.qaAuditResults?.length)throw Error('Calendar audit did not run');
  for(const compact of [true,false])for(const width of [260,380,640]){
   card.style.width=width+'px';card.setConfig({...card._config,compact});
   if(getComputedStyle(card.shadowRoot.querySelector('.content')).padding!=='16px')throw Error('Calendar padding '+width+compact);
   if(card._config.density!==(compact?'compact':'expanded'))throw Error('Calendar compact alias');
  }
  document.querySelector('#editor-audit').click();
  for(let i=0;i<100&&!window.qaEditorResults&&!window.qaEditorError;i++)await new Promise(r=>setTimeout(r,20));
  if(window.qaEditorError)throw Error(window.qaEditorError);
  if(!window.qaEditorResults?.length)throw Error('Calendar editor audit did not run');
  return true;
 })()`),true);
 console.log('PASS: Calendar existing card/editor audits, compact compatibility and consistent padding.');
 await send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/tests/fixtures/timeline-popups.html'});
 for(let i=0;i<100;i++){if(await evaluate('!!window.timelineReady'))break;await delay(50);}
 assert.equal(await evaluate(`(()=>{
  const card=window.qaTimeline;
  for(const width of [260,380,640]){
   card.style.width=width+'px';
   if(getComputedStyle(card).containerType!=='inline-size')throw Error('Timeline needs container sizing');
   if(getComputedStyle(card.shadowRoot.querySelector('.content')).padding!=='16px')throw Error('Timeline padding '+width);
  }
  return true;
 })()`),true);
 assert.deepEqual(exceptions,[],'no runtime exceptions');
 console.log('PASS: Timeline container sizing and equal outer padding on narrow and wide cards.');
 await send('Browser.close').catch(()=>{});
}finally{clearTimeout(watchdog);socket?.close();browser.kill();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
