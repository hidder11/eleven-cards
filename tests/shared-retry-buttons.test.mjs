import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const targets=['weather-card/src/weather-card.js','calendar-card/src/calendar-card.js','history-graph-card/src/history-graph-card.js','overview-card/src/overview-card.js','heatmap-card/src/heatmap-card.js','timeline-card/src/timeline-view.js'];
for(const target of targets)test(`ordinary retry uses real shared action rendering and styles: ${target}`,()=>{
 const source=readFileSync(new URL('../cards/'+target,import.meta.url),'utf8');
 assert.ok(!/<button\b[^>]*(?:class=["']retry|\bdata-retry)/.test(source),'No card-local ordinary retry template');
 assert.ok(/uiButton\(\{variant:'action',/.test(source),'Actual shared action renderer call, not only import');
 assert.ok(source.includes('uiActionButtonStyles()'),'Shared base/state stylesheet is consumed');
});
