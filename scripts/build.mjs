import {mkdir, readFile, writeFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const paths = [
  'cards/dynamic-energy-price-card/dist/eleven-dynamic-energy-price-card.js',
  'cards/history-graph-card/dist/eleven-history-graph-card.js',
  'cards/timeline-card/dist/eleven-timeline-card.js',
  'cards/overview-card/dist/eleven-overview-card.js',
  'cards/bar-chart/dist/eleven-bar-chart.js',
  'cards/heatmap-card/dist/eleven-heatmap-card.js',
  'cards/calendar-card/dist/eleven-calendar-card.js',
  'cards/weather-card/dist/eleven-weather-card.js',
  'cards/car-card/dist/eleven-car-card.js',
  'cards/energy-flow-card/dist/eleven-energy-flow-card.js',
  'cards/shopping-card/dist/eleven-shopping-card.js',
  'cards/house-card/dist/eleven-house-card.js',
  'cards/home-controls/dist/eleven-home-controls-card.js',
  'cards/appliance-planner/dist/eleven-appliance-planner.js',
  'cards/room-card/dist/eleven-room-card.js',
  'cards/scene-engine-card/dist/eleven-scene-engine-card.js',
];
// Each standalone module already has its own scope and duplicate-load guard.
const modules = await Promise.all(paths.map(path => readFile(new URL(path, root), 'utf8')));
// The approved pilot inherits its immutable upstream House implementation.
// Keep that closure, but do not expose its internal baseline tags/picker entry.
// Production House and its public aliases above remain entirely unchanged.
const pilotPath = new URL('experiments/material-house/dist/material-house.js', root);
const pilotMarker = '// Eleven packaged Material House pilot';
let pilot = await readFile(pilotPath, 'utf8');
if (!pilot.startsWith(pilotMarker)) {
  for (const tag of ['eleven-house-baseline-editor', 'eleven-house-baseline', 'eleven-house-styled-baseline', 'eleven-house-styled-baseline-editor']) {
    const registration = new RegExp(`^(?:if\\(!customElements\\.get\\('${tag}'\\)\\))?customElements\\.define\\('${tag}',[^\\n]+;\\n`, 'm');
    if (!registration.test(pilot)) throw new Error(`Missing pilot baseline registration: ${tag}`);
    pilot = pilot.replace(registration, '');
  }
  const baselinePicker = /^window\.customCards=.*type:'eleven-house-baseline'.*;\n/m;
  if (!baselinePicker.test(pilot)) throw new Error('Missing pilot baseline picker entry');
  pilot = pilot.replace(baselinePicker, '');
  const publicPicker = /^window\.customCards=window\.customCards\|\|\[\];\nif\(!window\.customCards\.some\(card=>card\.type==='eleven-material-house'\)\)window\.customCards\.push\([^\n]+\);\n/m;
  const picker = pilot.match(publicPicker)?.[0];
  if (!picker) throw new Error('Missing public Material House picker entry');
  pilot = pilot.replace(publicPicker, '');
  // Picker repair must also run when an older standalone pilot already exists.
  pilot = `${pilotMarker}\nif (!customElements.get('eleven-material-house')) {\n${pilot}\n}\nwindow.customCards=window.customCards||[];\nfor(let i=window.customCards.length-1;i>=0;i--)if(window.customCards[i].type==='eleven-house-baseline')window.customCards.splice(i,1);\n${picker}`;
  // Apply the same registration boundary to standalone migration resources.
  await writeFile(pilotPath, pilot);
}
modules.push(pilot);
await mkdir(new URL('dist/', root), {recursive: true});
await writeFile(new URL('dist/eleven-cards.js', root),
  '// Eleven Cards — HACS collection; nineteen card types, no external runtime imports.\n' + modules.join('\n;\n'));
console.log('Built dist/eleven-cards.js');
