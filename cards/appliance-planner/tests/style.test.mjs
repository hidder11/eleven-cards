import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {plannerCSS} from '../src/styles.js';
import {uiCassetteStyles} from '../../../shared/ui-cassette.js';
const src=readFileSync(new URL('../src/appliance-planner.js',import.meta.url),'utf8');
test('daily card exposes only Today/Tomorrow with explicit end-of-day meaning',()=>{
 assert.match(src,/<legend>Klaar vóór einde van<\/legend>/);
 assert.match(src,/'data-day':this.today\(i\)/);
 assert.doesNotMatch(src,/deadline-date|deadline-time|timeDraft|timeInvalid|keepDeadlineInputs|validTime/);
});
test('one reading well groups start/end and estimated cost; header has no decorative brand',()=>{
 assert.match(src,/class="reading-well"/);assert.doesNotMatch(src,/<small>Eleven<\/small>/);
 assert.match(plannerCSS,/\.reading-well/);assert.match(plannerCSS,/\[data-ui-cassette-trigger\]::after/);assert.match(plannerCSS,/\.quick\{gap:8px/);
 assert.match(plannerCSS,/--eleven-material-well/);assert.match(plannerCSS,/prefers-reduced-motion:reduce/);assert.match(plannerCSS,/forced-colors:active/);
 assert.match(src,/select id="appliance" title=/);assert.match(src,/select id="program" title=/);
});
test('Details uses the shared attached cassette rather than a local grip or separated tray',()=>{
 const stylesSource=readFileSync(new URL('../src/styles.js',import.meta.url),'utf8');
 assert.match(stylesSource,/uiCassetteStyles\(\)/);
 assert.doesNotMatch(stylesSource,/(?:^|[},])summary(?:::after|:focus-visible|\{|\[|:not)/m);
 assert.doesNotMatch(stylesSource,/#advice-details(?:\[open\])?(?:>[^{}]+)?\{[^}]*(?:background|box-shadow|padding|border-radius)/);
 assert.ok(plannerCSS.includes(uiCassetteStyles()));
});
test('advice footer is 12px with deliberate breathing room',()=>{
 assert.match(plannerCSS,/ha-card>p\.muted\{margin:12px 0 0;font-size:12px;line-height:1\.5\}/);
});
test('all four semantic price labels use an integrated neutral word and small status dot',()=>{
 assert.match(plannerCSS,/\.price-level::before\{/);
 assert.match(plannerCSS,/\.price-level:is\(\.cheap,\.negative,\.expensive\)\{[^}]*background:none/);
 assert.match(plannerCSS,/\.price-level\.expensive::before\{background:var\(--error-color/);
 assert.match(plannerCSS,/\.price-level:is\(\.cheap,\.negative\)::before\{background:var\(--success-color/);
});
