// Eleven Appliance Planner — standalone advice; optional explicit integration
(()=>{
'use strict';
// Paint only, scoped to each caller's shadow root and explicit semantic roles.
// Material recipes/palettes belong to the optional YAML theme, never this helper.
// Do not use generic control selectors: swatches, state tracks and chart colors
// must keep their functional paint. chartUI is an explicit non-House opt-in
// for shared chart-control geometry. No behavior or public-token writes.
function cardThemeStyles({wells='',controls='',selected='',plots='',surfaces='',chartUI=false}={}) {
 const well=selector=>selector?`${selector}{box-shadow:var(--eleven-material-well,none);border-radius:var(--eleven-material-radius-well,var(--ha-card-border-radius,12px))}`:'';
 return `
ha-card{background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#212121);border-radius:var(--ha-card-border-radius,12px);box-shadow:var(--ha-card-box-shadow,none)}
${well(wells)}
${plots?`${plots}{box-shadow:var(--eleven-material-well,none);border-radius:var(--eleven-material-radius-well,0px);background:var(--eleven-material-plot-background,transparent)}`:''}
${surfaces?`${surfaces}{box-shadow:var(--eleven-material-surface-shadow,none)}`:''}
${controls?`${controls}{background:var(--eleven-material-control-background,var(--secondary-background-color,transparent));box-shadow:var(--eleven-material-control-shadow,none);border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px))}
:is(${controls}):not(:disabled):hover{background:var(--eleven-material-control-hover-background,var(--secondary-background-color,transparent))}
:is(${controls}):not(:disabled):active{box-shadow:var(--eleven-material-well,none)}`:''}
${selected?`${selected}{box-shadow:var(--eleven-material-selection-well,none);border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px))}`:''}
${chartUI?`
/* Opt-in only: House's shared primitive defaults remain unchanged. */
.card-header{margin:0 0 12px;gap:12px;align-items:center}
.card-header h2{margin:0;flex:1 1 100%}
.header-actions{width:100%;gap:8px;justify-content:space-between}
.header-actions [data-ui-button],.period-menu [data-ui-button]{min-width:44px;min-height:44px;height:auto;box-sizing:border-box}
.chart-controls{flex:1 1 100%;width:100%}
.chart-controls>.period-controls{flex:1 1 auto;margin-inline-end:0;padding-inline-end:0}
.chart-controls>.period-controls::after{display:none}
.header-actions .period-trigger{width:100%;justify-content:space-between;padding:8px;flex:1 1 auto}
.period-trigger span{white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:normal;line-height:1.35;text-align:start}
.period-menu [data-ui-tabs]{border-bottom:0;gap:6px}
.period-menu [role=tab]{border-bottom:0;border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px));white-space:normal;padding:8px 4px;background:var(--eleven-material-control-background,var(--secondary-background-color));box-shadow:var(--eleven-material-control-shadow,none)}
.period-menu [role=tab][aria-selected=true],.period-menu [data-period-option][aria-checked=true]{border:0;color:var(--accent-color,var(--primary-color));background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)));box-shadow:var(--eleven-material-selection-well,none);text-decoration:none;transform:translateY(1px)}
.period-menu [data-period-option][aria-checked=true]:hover,.period-menu [role=tab][aria-selected=true]:hover{background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)))}
.period-menu [data-period-option]{min-width:0}
.period-menu .period-options{grid-template-columns:repeat(5,minmax(0,1fr))}
.period-menu .period-calendar{grid-template-columns:repeat(3,minmax(0,1fr))}
.period-menu .ui-popup-heading [data-ui-button]{min-width:44px}
.legend [data-ui-legend]{min-height:44px;min-width:44px;box-sizing:border-box}
@container(min-width:600px){.card-header h2{flex:1 1 110px}.header-actions{width:auto;flex:0 1 auto;justify-content:flex-end}.chart-controls{flex:0 1 auto;width:auto}}
`:''}
@media(forced-colors:active){ha-card${[wells,controls,selected,plots,surfaces].filter(Boolean).map(s=>','+s).join('')}{box-shadow:none}}
`;
}

// Observed boundary deltas only: never interpolate a meter or split hourly energy.
function consumptionFromHistory(history, start, end, intervalMinutes, now = Date.now()) {
  const step = intervalMinutes * 60000;
  if (![15, 60].includes(intervalMinutes) || !Array.isArray(history)) return [];
  const samples = history.map(row => ({
    timestamp: Date.parse(row.last_updated ?? row.last_changed),
    value: row.state === null || row.state === '' ? NaN : Number(row.state),
  })).filter(row => Number.isFinite(row.timestamp)).sort((a, b) => a.timestamp - b.timestamp);
  const points = [];
  let cursor = -1;
  for (let timestamp = start; timestamp + step <= Math.min(end, now); timestamp += step) {
    while (cursor + 1 < samples.length && samples[cursor + 1].timestamp <= timestamp) cursor++;
    const first = cursor;
    while (cursor + 1 < samples.length && samples[cursor + 1].timestamp <= timestamp + step) cursor++;
    const last = cursor;
    const a = samples[first];
    const b = samples[last];
    let valid = a && b && timestamp - a.timestamp <= 300000 && timestamp + step - b.timestamp <= 300000;
    for (let i = first; valid && i <= last; i++) {
      const sample = samples[i];
      valid = Number.isFinite(sample.value) && sample.value >= 0
        && (i === first || (sample.value >= samples[i - 1].value && sample.timestamp - samples[i - 1].timestamp <= 300000));
    }
    points.push({ timestamp, endTimestamp: timestamp + step, energy: valid ? b.value - a.value : null });
  }
  return points;
}

// HA recorder change is already reset-normalized and expressed in requested kWh.
function consumptionFromStatistics(rows, start, end, now = Date.now()) {
  if (!Array.isArray(rows)) return [];
  const byStart = new Map(rows.map(row => [row.start, row]));
  const points = [];
  // Hour boundaries in absolute time; do not turn these into quarter-hour samples.
  for (let timestamp = Math.ceil(start / 3600000) * 3600000; timestamp + 3600000 <= Math.min(end, now); timestamp += 3600000) {
    const row = byStart.get(timestamp);
    const valid = row?.end === timestamp + 3600000 && typeof row.change === 'number' && Number.isFinite(row.change) && row.change >= 0;
    points.push({ timestamp, endTimestamp: timestamp + 3600000, energy: valid ? row.change : null });
  }
  return points;
}

// Overlay-only placement: preserve the established price-only tooltip geometry.
function placeEnergyTooltip(width, height, boxWidth, boxHeight, anchorX, anchorY, markers) {
  const edge = 4;
  const gap = 12;
  const clamp = (value, max) => Math.max(edge, Math.min(max - edge, value));
  const xs = [anchorX + gap, anchorX - boxWidth - gap, clamp(anchorX - boxWidth / 2, width - boxWidth), edge, width - boxWidth - edge];
  const ys = [anchorY + gap, anchorY - boxHeight - gap, ...markers.flatMap(m => [m.bottom + gap, m.top - boxHeight - gap]), edge, height - boxHeight - edge];
  for (const left of xs) {
    for (const top of ys) {
      if (left < edge || top < edge || left + boxWidth > width - edge || top + boxHeight > height - edge) continue;
      if (markers.every(m => left + boxWidth <= m.left - 4 || left >= m.right + 4 || top + boxHeight <= m.top - 4 || top >= m.bottom + 4)) return { left, top };
    }
  }
  return { left: clamp(anchorX - boxWidth / 2, width - boxWidth), top: clamp(anchorY - boxHeight / 2, height - boxHeight) };
}

function zonedParts(value, timeZone) {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
}

function localDayKey(value, timeZone) {
  const parts = zonedParts(value, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function localHour(value, timeZone) {
  return Number(zonedParts(value, timeZone).hour);
}

function addDaysToKey(dayKey, days) {
  const date = new Date(`${dayKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function calculateAveragePrice(points) {
  if (!points.length) return null;
  return points.reduce((total, point) => total + Number(point.price), 0) / points.length;
}

function offsetPriceData(data, offset) {
  const amount = Number(offset);
  if (!Array.isArray(data) || !Number.isFinite(amount)) return [];
  return data.map((entry) => ({
    ...entry,
    price_per_kwh: Number((Number(entry?.price_per_kwh) + amount).toFixed(10)),
  }));
}

function mergePriceSeries(importPoints = [], exportPoints = []) {
  const merged = new Map();
  for (const point of importPoints) {
    merged.set(point.timestamp, {
      timestamp: point.timestamp,
      startTime: point.startTime,
      dayKey: point.dayKey,
      importPrice: point.price,
    });
  }
  for (const point of exportPoints) {
    const existing = merged.get(point.timestamp) ?? {
      timestamp: point.timestamp,
      startTime: point.startTime,
      dayKey: point.dayKey,
    };
    existing.exportPrice = point.price;
    merged.set(point.timestamp, existing);
  }
  return [...merged.values()].sort((left, right) => left.timestamp - right.timestamp);
}

function classifyPrice(price, threshold = 0.25) {
  return Number(price) < Number(threshold) ? 'cheap' : 'expensive';
}

function classifyPriceLevel(price, cheapPrice = 0.15, normalPrice = 0.25, expensivePrice = 0.40) {
  const value = Number(price);
  if (value < 0) return 'negative';
  if (value <= Number(cheapPrice)) return 'cheap';
  if (value <= Number(expensivePrice)) return 'normal';
  return 'expensive';
}

function isCheapestHoursEnabled(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function normalizeLineStyle(value, fallback = 'solid') {
  const allowed = new Set(['solid', 'dashed', 'dotted']);
  return allowed.has(value) ? value : allowed.has(fallback) ? fallback : 'solid';
}

function normalizeSelectionMode(value) {
  return ['individual', 'contiguous', 'minimum_blocks'].includes(value) ? value : 'individual';
}

function normalizeLineWidth(value, fallback = 3.5) {
  const parsed = Number(value);
  const fallbackValue = Number(fallback);
  const width = Number.isFinite(parsed) ? parsed : Number.isFinite(fallbackValue) ? fallbackValue : 3.5;
  return Math.round(Math.min(8, Math.max(1, width)) * 2) / 2;
}

function rgbColorToCss(value) {
  if (!Array.isArray(value) || value.length !== 3) return null;
  const channels = value.map(Number);
  if (!channels.every((channel) => Number.isInteger(channel) && channel >= 0 && channel <= 255)) return null;
  return `rgb(${channels.join(', ')})`;
}

function countMissingIntervals(points, intervalMinutes = inferIntervalMinutes(points)) {
  const intervalMs = Number(intervalMinutes) * 60000;
  if (!Number.isFinite(intervalMs) || intervalMs <= 0 || points.length < 2) return 0;
  const timestamps = [...new Set(points.map((point) => Number(point.timestamp)).filter(Number.isFinite))]
    .sort((left, right) => left - right);
  let missing = 0;
  for (let index = 1; index < timestamps.length; index += 1) {
    const steps = Math.round((timestamps[index] - timestamps[index - 1]) / intervalMs);
    if (steps > 1) missing += steps - 1;
  }
  return missing;
}

function relativeAgeLabel(value, now = new Date()) {
  const timestamp = new Date(value).getTime();
  const nowTimestamp = new Date(now).getTime();
  if (!Number.isFinite(timestamp) || !Number.isFinite(nowTimestamp)) return 'onbekend';
  const minutes = Math.max(0, Math.floor((nowTimestamp - timestamp) / 60000));
  if (minutes < 1) return 'zojuist';
  if (minutes < 60) return `${minutes} min geleden`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} uur geleden`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'dag' : 'dagen'} geleden`;
}

function groupSelectedPeriods(points, selected, intervalMinutes) {
  const intervalMs = Number(intervalMinutes) * 60000;
  const periods = [];
  const chosen = points
    .filter((point) => selected.has(point.timestamp))
    .sort((left, right) => left.timestamp - right.timestamp);

  for (const point of chosen) {
    const last = periods.at(-1);
    const endTimestamp = point.timestamp + intervalMs;
    if (last && last.dayKey === point.dayKey && last.endTimestamp === point.timestamp) {
      last.averagePrice = (last.averagePrice * last.durationMinutes + point.price * Number(intervalMinutes))
        / (last.durationMinutes + Number(intervalMinutes));
      last.endTimestamp = endTimestamp;
      last.durationMinutes += Number(intervalMinutes);
    } else {
      periods.push({
        dayKey: point.dayKey,
        startTimestamp: point.timestamp,
        endTimestamp,
        durationMinutes: Number(intervalMinutes),
        averagePrice: point.price,
      });
    }
  }
  return periods;
}

function createPriceTicks(minimum, maximum, count = 5) {
  const size = Math.max(2, Math.trunc(count));
  const step = (Number(maximum) - Number(minimum)) / (size - 1);
  return Array.from({ length: size }, (_, index) => Number((Number(maximum) - step * index).toFixed(10)));
}

// get_price returns unscaled base-currency totals, not chartdata metadata.
function tibberPriceData(response, source = 'tibber_prices', home) {
  if(source==='tibber') {
    const prices=response?.prices;
    if(!prices || typeof prices!=='object' || Array.isArray(prices))throw Error('format');
    const homes=Object.keys(prices);
    if(!home && homes.length!==1)throw Error('home');
    const selected=home || homes[0];
    if(!Object.hasOwn(prices,selected) || !Array.isArray(prices[selected]))throw Error('home');
    return prices[selected].flatMap(row=>{
      if(typeof row?.price!=='number' || !Number.isFinite(row.price) || typeof row.start_time!=='string' || !Number.isFinite(Date.parse(row.start_time)))return [];
      return [{start_time:row.start_time,price_per_kwh:row.price}];
    });
  }
  if(response?.success===false)throw Error('unavailable');
  if(!Array.isArray(response?.price_info))throw Error('format');
  return response.price_info.flatMap(row=>{
    if(typeof row?.total!=='number' || !Number.isFinite(row.total) || typeof row.startsAt!=='string' || !Number.isFinite(Date.parse(row.startsAt)))return [];
    return [{start_time:row.startsAt,price_per_kwh:row.total}];
  });
}

function tibberPriceRange(now, timeZone) {
  const day=localDayKey(now,timeZone);
  const midnight=key=>{
    const target=Date.parse(`${key}T00:00:00Z`);
    let instant=target;
    // Resolve each midnight independently: a two-day range can span 47/49 hours.
    for(let i=0;i<4;i++) {
      const p=zonedParts(instant,timeZone);
      const local=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);
      if(local===target)return new Date(instant).toISOString();
      instant+=target-local;
    }
    throw Error('timezone');
  };
  return {start_time:midnight(day),end_time:midnight(addDaysToKey(day,2))};
}

// Zonneplan One exposes raw fixed-point amounts in forecast, not its scaled sensor state.
function zonneplanPriceData(forecast) {
  if(!Array.isArray(forecast))return [];
  return forecast.flatMap(row=>{
    const start_time=row?.start_date ?? row?.datetime;
    const amount=row?.price_tax_included?.amount ?? row?.electricity_price;
    if(typeof amount!=='number' || !Number.isFinite(amount) || !Number.isFinite(Date.parse(start_time)))return [];
    return [{start_time,price_per_kwh:amount/10000000}];
  });
}

function normalizePoints(data, timeZone) {
  if (!Array.isArray(data)) return [];
  return data
    .map((entry) => {
      const timestamp = new Date(entry?.start_time).getTime();
      const price = Number(entry?.price_per_kwh);
      if (!Number.isFinite(timestamp) || !Number.isFinite(price)) return null;
      return {
        startTime: entry.start_time,
        timestamp,
        price,
        dayKey: localDayKey(timestamp, timeZone),
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.timestamp - right.timestamp);
}

function getVisiblePoints(data, now = new Date(), timeZone = 'Europe/Amsterdam', tomorrowAfterHour = 14) {
  const today = localDayKey(now, timeZone);
  const tomorrow = addDaysToKey(today, 1);
  const showTomorrow = localHour(now, timeZone) >= Number(tomorrowAfterHour);
  return normalizePoints(data, timeZone).filter(
    (point) => point.dayKey === today || (showTomorrow && point.dayKey === tomorrow),
  );
}

function splitByLocalDay(points) {
  const groups = new Map();
  for (const point of points) {
    if (!groups.has(point.dayKey)) groups.set(point.dayKey, []);
    groups.get(point.dayKey).push(point);
  }
  return groups;
}

function inferIntervalMinutes(points) {
  const differences = [];
  for (let index = 1; index < points.length; index += 1) {
    const minutes = (points[index].timestamp - points[index - 1].timestamp) / 60000;
    if (minutes > 0 && minutes <= 180) differences.push(minutes);
  }
  if (!differences.length) return 60;
  differences.sort((a, b) => a - b);
  return differences[Math.floor(differences.length / 2)];
}

function findCurrentPoint(points, now = new Date()) {
  if (!points.length) return null;
  const timestamp = now instanceof Date ? now.getTime() : new Date(now).getTime();
  if (!Number.isFinite(timestamp)) return null;
  const intervalMs = inferIntervalMinutes(points) * 60000;
  return points.find((point) => point.timestamp <= timestamp && timestamp < point.timestamp + intervalMs) ?? null;
}

// The graph and Energy grid details must select the same active interval.
function currentPricePoint(data, now = new Date(), timeZone = 'Europe/Amsterdam', tomorrowAfter = 14, offset = 0) {
  return findCurrentPoint(getVisiblePoints(offsetPriceData(data, offset), now, timeZone, tomorrowAfter), now);
}

function selectCheapestDuration(points, totalMinutes = 240, options = {}) {
  return selectDurationByPrice(points, totalMinutes, 'lowest', options);
}

function selectHighestDuration(points, totalMinutes = 240, options = {}) {
  return selectDurationByPrice(points, totalMinutes, 'highest', options);
}

function compareScore(candidate, current, direction) {
  if (!current) return true;
  return direction === 'highest' ? candidate > current.score : candidate < current.score;
}

function selectContiguousDuration(points, count, intervalMinutes, direction) {
  let best = null;
  for (let start = 0; start + count <= points.length; start += 1) {
    const window = points.slice(start, start + count);
    const contiguous = window.every((point, index) => (
      index === 0 || point.timestamp - window[index - 1].timestamp === intervalMinutes * 60000
    ));
    if (!contiguous) continue;
    const score = window.reduce((total, point) => total + point.price, 0);
    if (compareScore(score, best, direction)) best = { score, window };
  }
  return new Set((best?.window ?? []).map((point) => point.timestamp));
}

function selectMinimumBlocks(points, count, intervalMinutes, minimumBlockMinutes, direction) {
  const requestedMinimum = Number(minimumBlockMinutes);
  const minimumCount = Math.max(1, Math.min(
    count,
    Number.isFinite(requestedMinimum) ? Math.ceil(requestedMinimum / intervalMinutes) : 2,
  ));
  let states = new Map([['0|0', { selected: 0, run: 0, score: 0, indices: [] }]]);
  for (let index = 0; index < points.length; index += 1) {
    const contiguous = index === 0 || points[index].timestamp - points[index - 1].timestamp === intervalMinutes * 60000;
    const next = new Map();
    const save = (state) => {
      const key = `${state.selected}|${state.run}`;
      if (compareScore(state.score, next.get(key), direction)) next.set(key, state);
    };
    for (const original of states.values()) {
      if (!contiguous && original.run > 0 && original.run < minimumCount) continue;
      const state = !contiguous && original.run >= minimumCount ? { ...original, run: 0 } : original;
      if (state.run === 0 || state.run >= minimumCount) save({ ...state, run: 0 });
      if (state.selected < count) {
        const run = state.run === 0 ? 1 : Math.min(minimumCount, state.run + 1);
        save({
          selected: state.selected + 1,
          run,
          score: state.score + points[index].price,
          indices: [...state.indices, index],
        });
      }
    }
    states = next;
  }
  const candidates = [...states.values()].filter((state) => (
    state.selected === count && (state.run === 0 || state.run >= minimumCount)
  ));
  const best = candidates.reduce((current, candidate) => (
    compareScore(candidate.score, current, direction) ? candidate : current
  ), null);
  return new Set((best?.indices ?? []).map((index) => points[index].timestamp));
}

function selectDurationByPrice(points, totalMinutes, direction, options = {}) {
  const selected = new Set();
  if (!points.length || totalMinutes <= 0) return selected;
  const intervalMinutes = inferIntervalMinutes(points);
  const count = Math.min(points.length, Math.ceil(totalMinutes / intervalMinutes));
  const mode = normalizeSelectionMode(options.mode);
  if (mode === 'contiguous') return selectContiguousDuration(points, count, intervalMinutes, direction);
  if (mode === 'minimum_blocks') {
    return selectMinimumBlocks(points, count, intervalMinutes, options.minimumBlockMinutes, direction);
  }
  const ordered = [...points].sort(
    direction === 'highest'
      ? (left, right) => right.price - left.price || left.timestamp - right.timestamp
      : (left, right) => left.price - right.price || left.timestamp - right.timestamp,
  );
  for (const point of ordered.slice(0, count).sort((left, right) => left.timestamp - right.timestamp)) {
    selected.add(point.timestamp);
  }
  return selected;
}

// Pure advisory calculations. All elapsed durations use instants, not wall-clock arithmetic.
function instant(value) {
 if(typeof value==='string'&&!/(Z|[+-]\d\d:\d\d)$/i.test(value))throw Error('Tijdzone ontbreekt');
 const n=+new Date(value);if(!Number.isFinite(n))throw Error('Ongeldige datum');return n;
}
function localValue(date,zone){return new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(date)).replace(' ','T');}
function localInputISO(value,zone){
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value))throw Error('Kies een geldige datum en tijd');
 const parsed=Date.parse(value+'Z');let target=parsed;
 for(let i=0;i<4;i++)target+=parsed-Date.parse(localValue(target,zone)+'Z');
 if(!Number.isFinite(target)||localValue(target,zone)!==value)throw Error('Deze lokale tijd bestaat niet');
 for(const delta of [-3600000,3600000])if(localValue(target+delta,zone)===value)throw Error('Deze lokale tijd is dubbel door wintertijd');
 return new Date(target).toISOString();
}
function canonicalPrices(data,intervalMinutes){
 if(!Array.isArray(data)||!data.length)throw Error('Geen prijsintervallen beschikbaar');
 const rows=data.map(r=>({start:instant(r.start??r.start_time),end:r.end?instant(r.end):null,price:Object.hasOwn(r,'price')?r.price:r.price_per_kwh})).sort((a,b)=>a.start-b.start);
 if(rows.some(r=>typeof r.price!=='number'||!Number.isFinite(r.price)))throw Error('Ongeldige prijs');
 // Start-only contracts need a demonstrated cadence. Never stretch a gap to the next start.
 const diffs=rows.slice(1).map((r,i)=>(r.start-rows[i].start)/60000).filter(n=>n>0&&n<=60);
 const cadence=intervalMinutes??(diffs.length?Math.min(...diffs):null);
 for(let i=0;i<rows.length;i++){
  const r=rows[i];if(r.end===null){if(![15,30,60].includes(cadence))throw Error('Prijsinterval onbekend; geef expliciete eindtijden');r.end=r.start+cadence*60000;}
  if(r.end<=r.start||i&&rows[i-1].end>r.start)throw Error('Ongeldige of overlappende prijsintervallen');
 }
 return rows.map(r=>({start:new Date(r.start).toISOString(),end:new Date(r.end).toISOString(),price:r.price}));
}
function advise(data,program,earliest,deadline){
 const start=instant(earliest),limit=instant(deadline),minutes=Number(program.minutes),kwh=Number(program.kwh),duration=minutes*60000;
 if(!(minutes>=1&&minutes<=1440&&kwh>0&&kwh<=30))throw Error('Vul duur en totaal kWh in');
 if(limit-start>7*86400000)throw Error('Kies maximaal zeven dagen vooruit');
 if(duration>limit-start)throw Error('Dit programma past niet vóór de eindtijd');
 const rows=canonicalPrices(data).map(r=>({...r,start:instant(r.start),end:instant(r.end)}));
 const costAt=(a,b)=>{
  let cursor=a,area=0;
  for(const r of rows){if(r.end<=cursor)continue;if(r.start>cursor)return null;const end=Math.min(b,r.end);area+=(end-cursor)*r.price;cursor=end;if(cursor>=b)return area/duration*kwh;}
  return null;
 };
 const candidates=new Set([start,limit-duration]);
 for(const r of rows)for(const t of [r.start,r.end,r.start-duration,r.end-duration])if(t>=start&&t<=limit-duration)candidates.add(t);
 let best=null;
 for(const t of [...candidates].sort((a,b)=>a-b)){const cost=costAt(t,t+duration);if(cost!==null&&(!best||cost<best.cost-1e-10))best={start:new Date(t).toISOString(),end:new Date(t+duration).toISOString(),cost};}
 if(!best)throw Error('Nog geen volledig geprijsd tijdvak beschikbaar');
 const immediate=costAt(start,start+duration);
 return {...best,kwh,average:best.cost/kwh,savings:immediate===null?null:Math.max(0,immediate-best.cost),immediate_cost:immediate,provisional:costAt(start,limit)===null,profile_source:'uniform'};
}



const SOURCES=['sensor','energyzero','tibber','tibber_prices','zonneplan'];
async function fetchTariffs(hass,config,now=new Date()){
 const source=config.source||'sensor',zone=hass.config?.time_zone||'Europe/Amsterdam';
 if(hass.config?.currency&&hass.config.currency!=='EUR')throw Error('Alleen EUR/kWh wordt ondersteund');
 if(source==='sensor'||source==='zonneplan'){
  const state=hass.states?.[config.entity];
  if(!state||['unavailable','unknown'].includes(state.state))throw Error('Kies een beschikbare prijsbron');
  if(source==='zonneplan'){const raw=state.attributes.forecast,parsed=zonneplanPriceData(raw);if(!Array.isArray(raw)||parsed.length!==raw.length)throw Error('Ongeldige Zonneplan-prijsgegevens');return canonicalPrices(parsed);}
  if(!['EUR/kWh','€/kWh'].includes(state.attributes.unit_of_measurement))throw Error('Prijssensor moet EUR/kWh gebruiken');
  return canonicalPrices(state.attributes.data??state.attributes.prices);
 }
 if(source==='energyzero'){
  if(!config.energyzero_entry)throw Error('Kies een EnergyZero-configuratie');
  const today=localValue(now,zone).slice(0,10),days=[today,new Date(Date.parse(today+'T12:00Z')+86400000).toISOString().slice(0,10)];let rows=[];
  for(let i=0;i<days.length;i++)try{
   const {response}=await hass.callWS({type:'call_service',domain:'energyzero',service:'get_energy_prices',service_data:{config_entry:config.energyzero_entry,incl_vat:true,price_type:'all_in',interval:'quarter',start:days[i],end:days[i]},return_response:true});
   rows.push(...response.prices.map(r=>({start:r.start??r.timestamp,end:r.end,price:r.price})));
  }catch(error){if(!i)throw error;}
  return canonicalPrices(rows,15);
 }
 if(source==='tibber'||source==='tibber_prices'){
  const range=tibberPriceRange(now,zone),service_data=source==='tibber'?{start:range.start_time,end:range.end_time}:{...range,...(config.tibber_entry?{entry_id:config.tibber_entry}:{})};
  const {response}=await hass.callWS({type:'call_service',domain:source,service:source==='tibber'?'get_prices':'get_price',service_data,return_response:true});
  const parsed=tibberPriceData(response,source,config.tibber_home);
  const raw=source==='tibber'?response.prices[config.tibber_home||Object.keys(response.prices)[0]]:response.price_info;
  if(parsed.length!==raw.length)throw Error('Ongeldige Tibber-prijsgegevens');
  return canonicalPrices(parsed);
 }
 throw Error('Onbekende prijsbron');
}


const plannerCSS=`
:host{display:block;color:var(--primary-text-color,#20252b);font-family:var(--ha-font-family-body,system-ui)}*{box-sizing:border-box}ha-card{display:block;padding:16px;background:var(--ha-card-background,var(--card-background-color,#fff));border-radius:var(--ha-card-border-radius,12px);overflow:hidden}header{display:flex;gap:8px;align-items:center;margin-bottom:16px}h2{margin:0;flex:1;font-size:18px;font-weight:650;line-height:1.3}h3{font-size:14px;margin:16px 0 8px}.muted,small{color:var(--secondary-text-color,#626873);font-size:12px;line-height:1.5}fieldset{border:0;padding:0;margin:0 0 16px;min-width:0}legend,label{font-size:13px;line-height:1.5}legend{color:var(--secondary-text-color,#626873);padding:0;margin-bottom:8px}.choices,.actions{display:flex;flex-wrap:wrap;gap:8px}.choices button{flex:1 1 110px;display:flex;align-items:center;justify-content:center;gap:8px;white-space:normal;overflow-wrap:normal;word-break:normal}.choices ha-icon{--mdc-icon-size:20px;flex:0 0 20px}.choices [aria-pressed=true]{border-color:transparent}button,input,select{font:inherit;color:inherit;font-size:14px;min-height:44px;border-radius:8px;max-width:100%}button{border:1px solid transparent;padding:10px 12px;background:var(--secondary-background-color,#f4f5f7);cursor:pointer;font-weight:550}input,select{width:100%;min-width:0;border:1px solid var(--divider-color,#ddd);padding:8px;background:var(--secondary-background-color,#f4f5f7);color-scheme:var(--planner-color-scheme,inherit)}button.primary{background:var(--primary-color,#3973ca);color:var(--text-primary-color,#fff)}button:disabled{opacity:.5;cursor:default}button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:2px solid var(--primary-color,#3973ca);outline-offset:2px}button.text{background:transparent;color:var(--secondary-text-color,#626873);font-size:12px}.date-time{display:grid;grid-template-columns:minmax(0,1fr) 145px;gap:8px}.quick{display:flex;gap:8px}.quick [aria-pressed=true]{text-decoration:none}.advice{border-top:1px solid var(--divider-color,#ddd);padding-top:16px}.time{font-size:32px;line-height:1.2;font-weight:600;letter-spacing:-.03em;font-variant-numeric:tabular-nums;margin:4px 0}.date{font-size:13px;line-height:1.5}.metrics{display:flex;gap:12px;flex-wrap:wrap;justify-content:space-between;margin:16px 0 8px}.metrics span{display:block;font-size:12px;color:var(--secondary-text-color,#626873)}.metrics strong{font-size:16px;font-weight:600;font-variant-numeric:tabular-nums}.status{font-size:13px;line-height:1.5;margin:8px 0}.warning{color:var(--primary-text-color,#20252b);border-left:3px solid var(--warning-color,#b26a00);padding-left:8px}.error{color:var(--error-color,#bb2424)}details{margin-top:12px;border-top:1px solid var(--divider-color,#ddd)}summary{min-height:44px;align-content:center;cursor:pointer;font-size:13px}.graph{width:100%;height:132px;display:block}.graph line{stroke:var(--divider-color,#ddd)}.graph .tariff{stroke:var(--primary-color,#3973ca);stroke-width:2;fill:none;vector-effect:non-scaling-stroke}.graph .highlight{fill:var(--primary-color,#3973ca);opacity:.12}.graph text{fill:var(--secondary-text-color,#626873);font-size:11px}.graph-labels{display:flex;justify-content:space-between}.plan{border-top:1px solid var(--divider-color,#ddd);padding:12px 0}.plan strong{font-size:14px}.plan .actions{margin-top:8px}.fields{display:grid;gap:12px}.program-fields{display:grid;grid-template-columns:minmax(0,1fr) 80px 80px;gap:8px}.program-fields label{font-size:12px}.editor-group{padding:12px 0;border-top:1px solid var(--divider-color,#ddd)}.check{display:flex;align-items:center;gap:8px}.check input{width:20px;min-height:44px}.feedback:empty{display:none}.empty{font-size:14px;line-height:1.5}.owned{font-size:12px;color:var(--secondary-text-color,#626873)}@media(max-width:350px){ha-card{padding:12px}.program-fields{grid-template-columns:1fr 1fr}.program-fields label:first-child{grid-column:1/-1}.choices button{flex-basis:100px}}
@media(max-width:350px){.date-time{grid-template-columns:1fr}.program-fields.thresholds{grid-template-columns:1fr 1fr}.program-fields.thresholds label:first-child{grid-column:auto}}
.program-fields.thresholds{grid-template-columns:1fr 1fr}
/* Daily layout: compact controls and one supplementary disclosure. */
:host{container-type:inline-size}header{margin-bottom:12px}.selection{display:grid;gap:8px;margin-bottom:12px}.selection label{display:grid;gap:4px;min-width:0}.selection label>span{color:var(--secondary-text-color,#626873);font-size:12px}.deadline{margin-bottom:4px}.deadline legend{font-size:12px;margin-bottom:4px}.quick{gap:0}.quick button{padding:8px 12px}.advice{padding-top:12px}.run-times{display:grid;grid-template-columns:1fr 1fr;gap:12px}.run-times>div{display:grid;gap:2px}.run-times strong{font-size:22px;line-height:1.3;font-weight:600;font-variant-numeric:tabular-nums}.cost-line{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:12px}.cost-line strong{font-size:16px;font-variant-numeric:tabular-nums}.price-level{font-size:12px;line-height:1.5;font-weight:600;padding:2px 8px;border-radius:6px;background:var(--secondary-background-color,#f4f5f7)}.price-level.cheap,.price-level.negative{color:var(--primary-text-color,#20252b);border-left:3px solid var(--success-color,#18733c);background:color-mix(in srgb,var(--success-color,#18733c) 15%,var(--ha-card-background,var(--card-background-color,#fff)))}.price-level.expensive{color:var(--primary-text-color,#20252b);border-left:3px solid var(--error-color,#bb2424);background:color-mix(in srgb,var(--error-color,#bb2424) 15%,var(--ha-card-background,var(--card-background-color,#fff)))}#advice-details{margin-top:8px}.detail-row{display:flex;justify-content:space-between;gap:8px;font-size:13px}.tariff-detail{margin-top:12px}.tariff-detail>p{margin:0 0 8px}.advice>.primary{width:100%;margin-top:8px}#advice-slot>.status:empty{display:none}ha-card>p.muted{margin:8px 0 0;font-size:11px}.graph-labels{gap:8px}.graph-labels span:last-child{text-align:right}
@container(min-width:420px){.selection{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
@container(max-width:305px){.date-time{grid-template-columns:1fr}}
.choices [aria-pressed=true],.quick [aria-pressed=true]{border-color:transparent;color:var(--accent-color,var(--primary-color));text-decoration:none;background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)));transform:translateY(1px)}
${cardThemeStyles({wells:'input:not([type=range]):not([type=checkbox]),select',controls:'.choices button:not([aria-pressed=true]),.quick button:not([aria-pressed=true])',selected:'.choices [aria-pressed=true],.quick [aria-pressed=true]'})}
`;





const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=v=>JSON.parse(JSON.stringify(v));
const active=p=>['planned','reminded','running'].includes(p.status);
const kinds={washer:'Wasmachine',dryer:'Droger',washer_dryer:'Wasdroogcombi',dishwasher:'Vaatwasser'};

const EN={'Apparatenplanner':'Appliance planner','Apparaat':'Appliance','Programma':'Program','Klaar vóór':'Ready before','Datum':'Date','Tijd':'Time','Vandaag':'Today','Morgen':'Tomorrow','Start om':'Start at','Klaar om':'Finish at','Geschatte kosten':'Estimated cost','Gemiddeld':'Average','Goedkoop':'Cheap','Normaal':'Normal','Duur':'Expensive','Negatief':'Negative','Besparing t.o.v. direct starten':'Savings vs starting now','Vergelijking niet beschikbaar':'Comparison unavailable','Tarieven en geadviseerde draaibeurt':'Tariffs and advised run','Instellingen':'Settings','Inplannen':'Save plan','Ingepland':'Planned','Gestart':'Started','Klaar':'Done','Annuleren':'Cancel','Gelijkmatig verbruik':'Uniform consumption','Gesimuleerd profiel':'Simulated profile','Gemeten profiel':'Measured profile','Lineaire schatting — integratie niet beschikbaar. Planning en meting zijn uitgeschakeld.':'Linear estimate — integration unavailable. Planning and measurement are disabled.','Berekenen…':'Calculating…','Instellen via de dashboard-editor. Wijzigingen worden pas gedeeld na Opslaan in het dashboard.':'Configure through the dashboard editor. Changes are shared only after saving the dashboard.','Duur (minuten)':'Duration (minutes)','Totaal kWh':'Total kWh','Naam':'Name','Bewaar programma':'Save program','Nieuw programma':'New program','Apparaat toevoegen':'Add appliance','Prijsbron':'Price source','Prijssensor':'Price sensor','Goedkoop tot (ct/kWh)':'Cheap up to (ct/kWh)','Duur boven (ct/kWh)':'Expensive above (ct/kWh)','Integratie koppelen':'Link integration','Integratie ontkoppelen':'Unlink integration','Programma’s overdragen':'Transfer programs','Geen programma’s. Open Instellingen in de dashboard-editor.':'No programs. Open Settings in the dashboard editor.','Voorlopig — niet alle prijzen tot de eindtijd zijn bekend. Alleen volledig geprijsde draaibeurt; geen gegarandeerd goedkoopste moment over de hele periode.':'Provisional — not all prices up to the deadline are known. Fully priced run only; no guaranteed optimum across the whole period.','Alleen advies. Je zet het apparaat zelf aan.':'Advice only. You start the appliance yourself.','Profielmodus':'Profile mode','Vermogensmeter':'Power meter','Geen meter':'No meter','Bewaar apparaat':'Save appliance','Meldingsactie':'Notification action','Bewaar meldingsactie':'Save notification action','Ook integratieprogramma’s als eenvoudige instellingen kopiëren':'Also copy integration programs to simple settings','Conflicten expliciet vervangen (bestaande metingen blijven behouden)':'Explicitly replace conflicts (existing measurements are retained)','Expliciete koppeling; installatie alleen schakelt niets in.':'Explicit link; installation alone enables nothing.','Geen overdracht geselecteerd':'No transfer selected','Instellingen niet beschikbaar voor deze gebruiker.':'Settings unavailable for this user.'};
Object.assign(EN,{'Bewaar instellingen':'Save settings','Apparaten en programma’s':'Appliances and programs','Integratie (optioneel)':'Integration (optional)','Integratie':'Integration','Type':'Type','Tibber-woning':'Tibber home','Wasmachine':'Washing machine','Droger':'Dryer','Wasdroogcombi':'Washer dryer','Vaatwasser':'Dishwasher','Integratie beheert deze programma’s. Metingen blijven behouden bij wijzigingen.':'The integration owns these programs. Changes retain measurements.','Exacte woningnaam; leeg kiest de enige woning. Alleen een EUR-woning gebruiken.':'Exact home name; leave blank for a sole home. Only use an EUR-priced home.','Starttijd bereikt':'Start time reached','Bezig':'Running'});
function localize(root,en){if(!en)return;const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=walk.nextNode()){if(n.parentElement?.closest('[data-user],style,script'))continue;const raw=n.textContent,key=raw.trim();if(EN[key])n.textContent=raw.replace(key,EN[key]);}for(const el of root.querySelectorAll('[aria-label]'))if(EN[el.getAttribute('aria-label')])el.setAttribute('aria-label',EN[el.getAttribute('aria-label')]);}

function validateConfig(config){
 const c=clone(config);c.appliances??=[];c.tariff??={source:'sensor'};c.cheap_price??=.15;c.expensive_price??=.4;
 if(!SOURCES.includes(c.tariff.source||'sensor'))throw Error('Onbekende prijsbron');
 if(!Number.isFinite(c.cheap_price)||!Number.isFinite(c.expensive_price)||c.cheap_price>c.expensive_price)throw Error('Ongeldige prijsgrenzen');
 if(!Array.isArray(c.appliances)||c.appliances.length>30)throw Error('Ongeldige apparaten');
 const aids=new Set();for(const a of c.appliances){if(!a.id||aids.has(a.id)||!a.name?.trim()||!kinds[a.kind]||!Array.isArray(a.programs)||a.programs.length>30)throw Error('Ongeldig apparaat');aids.add(a.id);const pids=new Set();for(const p of a.programs){if(!p.id||pids.has(p.id)||!p.name?.trim()||!(Number(p.minutes)>=1&&Number(p.minutes)<=1440&&Number(p.kwh)>0&&Number(p.kwh)<=30))throw Error('Ongeldig programma');pids.add(p.id);}}
 return c;
}
class ElevenAppliancePlanner extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this.form={};this.epoch=0;this.message='';this.lastKnown=[];}
 static getStubConfig(){return {type:'custom:eleven-appliance-planner',appliances:[],tariff:{source:'sensor'}};}
 static getConfigElement(){return document.createElement('eleven-appliance-planner-editor');}
 getCardSize(){return 5;}getGridOptions(){return {columns:12,rows:'auto',min_columns:6};}
 setConfig(config){this.backendOutage=false;this.tariffRequest=null;this.config=validateConfig(config);this.epoch++;this.lastKnown=clone(this.config.integration?.programs_snapshot||[]);this.render();this.recompute();}
 set hass(h){const previous=this._hass;if(previous?.connection!==h.connection||previous?.connection?.connected===false||h.connection?.connected===false)this.tariffRequest=null;this._hass=h;if(this.online)this.lastKnown=clone(this.integrationData.appliances||[]);const signature=JSON.stringify([h.states?.[this.config?.tariff?.entity],this.config?.integration?.enabled?h.states?.[this.config.integration.entity]:null,h.connection?.connected,h.config?.time_zone,h.locale?.language,h.user?.is_admin]);if(signature!==this.signature||previous?.connection!==h.connection){this.signature=signature;this.recompute();}else if(!this.shadowRoot.firstChild)this.render();}
 get hass(){return this._hass;}get zone(){return this._hass?.config?.time_zone||'Europe/Amsterdam';}get en(){return this._hass?.locale?.language?.startsWith('en');}
 get linked(){return this.config?.integration?.enabled===true;}
 get integrationState(){return this._hass?.states?.[this.config?.integration?.entity];}
 get entityOnline(){return this.linked&&this._hass?.connection?.connected!==false&&this.integrationState&&this.integrationData.protocol_version>=2&&!['unknown','unavailable'].includes(this.integrationState.state);}
 get online(){return this.entityOnline&&!this.backendOutage;}
 get integrationData(){return this.integrationState?.attributes||{};}
 get appliances(){return this.linked?(this.online?this.integrationData.appliances||[]:this.lastKnown):this.config?.appliances||[];}
 connectedCallback(){this.render();this.recompute();this.timer=setInterval(()=>this.recompute(),60000);}
 disconnectedCallback(){clearInterval(this.timer);this.tariffRequest=null;this.epoch++;}
 format(n,digits=2){return new Intl.NumberFormat(this.en?'en-GB':'nl-NL',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(n);}
 price(n){return new Intl.NumberFormat(this.en?'en-GB':'nl-NL',{style:'currency',currency:'EUR'}).format(n);}
 time(s){return new Intl.DateTimeFormat(this.en?'en-GB':'nl-NL',{timeZone:this.zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(s));}
 day(s){return new Intl.DateTimeFormat(this.en?'en-GB':'nl-NL',{timeZone:this.zone,weekday:'long',year:'numeric',day:'numeric',month:'long'}).format(new Date(s));}
 shortDay(s){return new Intl.DateTimeFormat(this.en?'en-GB':'nl-NL',{timeZone:this.zone,day:'numeric',month:'short',year:'numeric'}).format(new Date(s));}
 today(offset=0){const day=localValue(Date.now(),this.zone).slice(0,10);return new Date(Date.parse(day+'T12:00Z')+offset*86400000).toISOString().slice(0,10);}
 selected(){const a=this.appliances.find(x=>x.id===this.form.aid)||this.appliances[0];this.form.aid=a?.id;const p=a?.programs.find(x=>x.id===this.form.pid)||a?.programs[0];this.form.pid=p?.id;return [a,p];}
 payload(){return {appliance_id:this.form.aid,program_id:this.form.pid,deadline:localInputISO(this.form.deadline,this.zone),tariff_source:clone(this.config.tariff)};}
 command(operation,payload={}){return this._hass.callWS({type:'eleven_appliance_planner/command',operation,payload});}
 async tariffs(now){
  if(['sensor','zonneplan'].includes(this.config.tariff.source||'sensor'))return fetchTariffs(this._hass,this.config.tariff,now);
  const key=JSON.stringify([this.config.tariff,this.zone,this._hass.config?.currency,this.today()]);
  if(this.tariffRequest?.key===key&&Date.now()-this.tariffRequest.created<300000)return this.tariffRequest.promise;
  const request={key,created:Date.now()};request.promise=fetchTariffs(this._hass,this.config.tariff,now).catch(error=>{if(this.tariffRequest===request)this.tariffRequest=null;throw error;});this.tariffRequest=request;return request.promise;
 }
 async recompute(){
  if(!this.config||!this._hass)return;
  if(this.entityOnline)this.lastKnown=clone(this.integrationData.appliances||[]);
  const epoch=++this.epoch;const [a,p]=this.selected();if(!this.form.deadline)this.form.deadline=localValue(Date.now()+12*3600000,this.zone);
  if(!p){this.result=null;this.render();return;}
  this.loading=true;this.result=null;this.message='';this.error=false;this.render();
  try{
   const deadline=localInputISO(this.form.deadline,this.zone),now=new Date();
   const rows=await this.tariffs(now);
   if(epoch!==this.epoch)return;
   this.rows=rows;
   let result;
   if(this.entityOnline){
    try{result=await this.command('preview',this.payload());if(epoch!==this.epoch)return;this.backendOutage=false;}
    catch(error){if(!['not_loaded','connection_lost','disconnected','cannot_connect'].includes(error.code))throw error;if(epoch!==this.epoch)return;this.backendOutage=true;result=advise(rows,p,now,deadline);}
   }else result=advise(rows,p,now,deadline);
   if(epoch!==this.epoch)return;
   if(result.price_intervals)this.rows=canonicalPrices(result.price_intervals);
   this.result=result;
  }catch(err){if(epoch!==this.epoch)return;this.error=true;this.message=err.message||String(err);this.rows=[];}
  finally{if(epoch===this.epoch){this.loading=false;this.render();}}
 }
 async act(operation,id){
  if(this.pending||!this.online)return;
  const previousFocus=this.shadowRoot.activeElement?.id;let changed;
  this.pending=true;this.message='';this.error=false;this.render();
  try{
   changed=await this.command(operation,operation==='save'?this.payload():{id});
   const fresh=await this.command('status');this.lastKnown=clone(fresh.appliances);
   this._hass={...this._hass,states:{...this._hass.states,[this.config.integration.entity]:{...this.integrationState,attributes:fresh}}};
   this.message=operation==='save'?'Ingepland. Je zet het apparaat zelf aan.':operation==='start'?'Als gestart geregistreerd; niets aangezet.':'Opgeslagen';
  }catch(err){this.error=true;this.message=err.message||String(err);}
  finally{
   this.pending=false;this.render();
   const action=[...this.shadowRoot.querySelectorAll('[data-op]')].find(el=>el.dataset.id===(changed?.id||id)&&el.dataset.op!=='cancel');
   (action||this.shadowRoot.getElementById(previousFocus)||this.shadowRoot.getElementById('program'))?.focus();
  }
 }
 graph(){
  if(!this.rows?.length||!this.result)return '';
  const rows=this.rows,from=+new Date(rows[0].start),to=+new Date(rows.at(-1).end),min=Math.min(...rows.map(r=>r.price)),max=Math.max(...rows.map(r=>r.price)),range=max-min||.1;
  const x=t=>20+(+new Date(t)-from)/(to-from)*460,y=p=>100-(p-min)/range*80;
  const paths=rows.map((r,i)=>`${i&&rows[i-1].end===r.start?'L':'M'}${x(r.start)},${y(r.price)}H${x(r.end)}`).join(' ');
  const axis=s=>new Intl.DateTimeFormat(this.en?'en-GB':'nl-NL',{timeZone:this.zone,day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(s));
  return `<div class="tariff-detail"><p class="muted">Tarieven en geadviseerde draaibeurt</p><div class="graph-labels muted"><span>${this.format(max*100,1)} ct/kWh</span><span>${this.format(min*100,1)} ct/kWh</span></div><svg class="graph" viewBox="0 0 500 120" preserveAspectRatio="none" role="img" aria-label="Tarieven en geadviseerde draaibeurt"><rect class="highlight" x="${x(this.result.start)}" y="10" width="${x(this.result.end)-x(this.result.start)}" height="100"/><path class="tariff" d="${paths}"/></svg><div class="graph-labels muted"><span>${axis(rows[0].start)}</span><span>${axis(rows.at(-1).end)}</span></div></div>`;
 }
 render(){
  if(!this.config||!this._hass)return;
  // Read synchronously: native toggle events may still be queued during an update.
  const disclosure=this.shadowRoot.querySelector('#advice-details');if(disclosure)this.detailsOpen=disclosure.open;
  const [a,p]=this.selected();if(!this.form.deadline)this.form.deadline=localValue(Date.now()+12*3600000,this.zone);
  const main=`<div class="selection"><label><span>Apparaat</span><select id="appliance">${this.appliances.map(item=>`<option data-user value="${esc(item.id)}" ${item.id===this.form.aid?'selected':''}>${esc(item.name)}</option>`).join('')}</select></label><label><span>Programma</span><select id="program">${(a?.programs||[]).map(item=>`<option data-user value="${esc(item.id)}" ${item.id===this.form.pid?'selected':''}>${esc(item.name)}</option>`).join('')}</select></label></div><fieldset class="deadline"><legend>Klaar vóór</legend><div class="date-time"><input id="deadline-date" aria-label="Datum" type="date" required min="${this.today()}" value="${esc(this.form.deadline.split('T')[0])}"><input id="deadline-time" aria-label="Tijd" type="time" required value="${esc((this.form.deadline.split('T')[1]||''))}"></div><div class="quick">${['Vandaag','Morgen'].map((l,i)=>`<button class="text" data-day="${this.today(i)}" aria-pressed="${this.form.deadline.startsWith(this.today(i))}">${l}</button>`).join('')}</div></fieldset>`;
  const r=this.result;let advice='';
  if(r){const level=classifyPriceLevel(r.average,this.config.cheap_price,.25,this.config.expensive_price),label={cheap:'Goedkoop',normal:'Normaal',expensive:'Duur',negative:'Negatief'}[level];
   advice=`<section class="advice" aria-label="Startadvies"><div class="run-times">${[['Start om',r.start],['Klaar om',r.end]].map(([title,stamp])=>`<div><span class="muted">${title}</span><strong>${this.time(stamp)}</strong><span class="muted" title="${esc(this.day(stamp))}">${this.shortDay(stamp)}</span></div>`).join('')}</div><div class="cost-line"><span><span class="muted">Geschatte kosten</span> <strong>${this.price(r.cost)}</strong></span><span class="price-level ${level}">${label}</span></div>${this.linked&&!this.online?'<p class="status warning">Lineaire schatting — integratie niet beschikbaar. Planning en meting zijn uitgeschakeld.</p>':''}${r.provisional?'<p class="status warning">Voorlopig — niet alle prijzen tot de eindtijd zijn bekend. Alleen volledig geprijsde draaibeurt; geen gegarandeerd goedkoopste moment over de hele periode.</p>':''}<details id="advice-details" ${this.detailsOpen?'open':''}><summary>Details</summary><div class="detail-row"><span>Gemiddeld</span><strong>${this.format(r.average*100,1)} ct/kWh</strong></div><p class="status">${r.savings===null?'Vergelijking niet beschikbaar':`<span>Besparing t.o.v. direct starten</span>: <strong>${this.price(r.savings)}</strong>`}</p><p class="status muted">${r.profile_mode==='measured'&&this.online?'Gemeten profiel':r.profile_mode==='simulated'&&this.online?'Gesimuleerd profiel':'Gelijkmatig verbruik'}</p>${this.graph()}</details>${this.online?`<button id="save-plan" class="primary" ${this.pending||(this.integrationData.plans||[]).some(plan=>active(plan)&&plan.appliance_id===this.form.aid)?'disabled':''}>Inplannen</button>`:''}</section>`;
  }
  const plans=this.online?(this.integrationData.plans||[]).filter(active):[];
  const content=`<style>${plannerCSS}</style><ha-card><header><h2 data-user>${esc(this.config.title||(this.en?'Appliance planner':'Apparatenplanner'))}</h2><small>Eleven</small></header>${p?main:'<p class="empty">Geen programma’s. Open Instellingen in de dashboard-editor.</p>'}<div id="advice-slot" aria-live="polite">${advice}<p class="status ${this.error?'error':''}">${esc(this.loading?'Berekenen…':this.message)}</p></div>${plans.length?`<section><h3>Ingepland</h3>${plans.map(plan=>`<article class="plan"><strong data-user>${esc(this.appliances.find(a=>a.id===plan.appliance_id)?.name)} · ${esc(this.appliances.find(a=>a.id===plan.appliance_id)?.programs.find(p=>p.id===plan.program_id)?.name)}</strong><div class="date">${this.time(plan.start)} · ${this.day(plan.start)}</div><div class="muted"><span>${({planned:'Ingepland',reminded:'Starttijd bereikt',running:'Bezig'})[plan.status]}</span> · ${this.price(plan.cost)}</div><div class="actions"><button id="plan-${esc(plan.id)}-${plan.status==='running'?'done':'start'}" data-op="${plan.status==='running'?'done':'start'}" data-id="${esc(plan.id)}" ${this.pending?'disabled':''}>${plan.status==='running'?'Klaar':'Gestart'}</button><button id="plan-${esc(plan.id)}-cancel" data-op="cancel" data-id="${esc(plan.id)}" ${this.pending?'disabled':''}>Annuleren</button></div></article>`).join('')}</section>`:''}<p class="muted">Alleen advies. Je zet het apparaat zelf aan.</p></ha-card>`;
   const focus=this.shadowRoot.activeElement?.id;
  // Retain native date/time inputs while the user is typing.
  if(focus?.startsWith('deadline-')&&this.shadowRoot.querySelector('#advice-slot')){
   const template=document.createElement('template');template.innerHTML=content;this.shadowRoot.querySelector('#advice-slot').replaceWith(template.content.querySelector('#advice-slot'));this.bindResult();localize(this.shadowRoot,this.en);return;
  }
  this.shadowRoot.innerHTML=content;
  const appliance=this.shadowRoot.querySelector('#appliance'),program=this.shadowRoot.querySelector('#program');
  if(appliance)appliance.onchange=()=>{this.form.aid=appliance.value;this.form.pid=null;this.recompute();};
  if(program)program.onchange=()=>{this.form.pid=program.value;this.recompute();};
  this.shadowRoot.querySelectorAll('[data-day]').forEach(el=>el.onclick=()=>{this.form.deadline=el.dataset.day+'T'+(this.form.deadline.split('T')[1]||'');this.recompute();});
  const date=this.shadowRoot.querySelector('#deadline-date'),time=this.shadowRoot.querySelector('#deadline-time');
  const change=()=>{this.form.deadline=date.value+'T'+time.value;this.recompute();};if(date)date.onchange=change;if(time)time.onchange=change;

  this.bindResult();this.shadowRoot.querySelectorAll('[data-op]').forEach(el=>el.onclick=()=>this.act(el.dataset.op,el.dataset.id));
  localize(this.shadowRoot,this.en);if(focus)this.shadowRoot.getElementById(focus)?.focus();
 }

 bindResult(){const save=this.shadowRoot.querySelector('#save-plan');if(save)save.onclick=()=>this.act('save');const details=this.shadowRoot.querySelector('#advice-details');if(details)details.addEventListener('toggle',()=>{if(details.isConnected)this.detailsOpen=details.open;});}
}

// Native Lovelace editor: only config-changed; the native dashboard Save owns persistence.



const uid=()=>globalThis.crypto?.randomUUID?.()||`p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
class ElevenAppliancePlannerEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this.entries=[];this.message='';}
 setConfig(c){const next=validateConfig(c),same=JSON.stringify(next)===JSON.stringify(this.config);this.config=next;if(!same||!this.shadowRoot.firstChild)this.render();}
 set hass(h){const adminChanged=this.lastAdmin!==h.user?.is_admin;this.lastAdmin=h.user?.is_admin;this._hass=h;if(adminChanged||!this.shadowRoot.activeElement?.matches('input,select'))this.render();if(h.user?.is_admin&&!this.entriesAsked){this.entriesAsked=true;h.callWS({type:'config_entries/get'}).then(entries=>{this.entries=entries;if(!this.shadowRoot.activeElement?.matches('input,select'))this.render();}).catch(error=>{this.message=(this.en?'Cannot load integration configurations: ':'Integratieconfiguraties ophalen mislukt: ')+(error.message||String(error));if(!this.shadowRoot.activeElement?.matches('input,select'))this.render();});}}
 get hass(){return this._hass;}get en(){return this._hass?.locale?.language?.startsWith('en');}get linked(){return this.config.integration?.enabled===true;}
 get data(){const s=this._hass?.states?.[this.config?.integration?.entity];return s&&!['unknown','unavailable'].includes(s.state)?s.attributes:null;}
 get appliances(){return this.linked?this.data?.appliances||this.config.integration.programs_snapshot||[]:this.config.appliances;}
 emit(){if(!this._hass?.user?.is_admin)throw Error('Alleen beheerders');this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:clone(this.config)},bubbles:true,composed:true}));}
 // Backend v2 previews/plans resolve stored IDs, not dashboard overrides. Never
 // mutate its records from a draft; linked settings remain explicitly read-only.
 async run(fn){if(this.pending)return;this.pending=true;this.message='';try{await fn();}catch(e){this.message=e.message||String(e);}finally{this.pending=false;this.render();}}
 async link(){
  const entity=this.shadowRoot.querySelector('#integration-entity').value;
  if(!entity)throw Error('Kies de planner-integratie');
  const state=this._hass.states?.[entity];
  if(!state||['unknown','unavailable'].includes(state.state)||!(state.attributes?.protocol_version>=2))throw Error('Werk de optionele integratie bij voor expliciete profielen en prijsbronnen');
  this.config.integration={enabled:true,entity,programs_snapshot:clone(state.attributes.appliances||[])};this.emit();
 }
 unlink(){
  const copy=this.shadowRoot.querySelector('#copy-unlink').checked;

  if(copy)this.config.appliances=this.appliances.map(a=>({id:a.id,name:a.name,kind:a.kind,programs:a.programs.map(p=>({id:p.id,name:p.name,minutes:p.minutes,kwh:p.kwh}))}));
  this.config.integration={...this.config.integration,enabled:false};this.emit();this.render();
 }
 render(){
  if(!this.config||!this._hass)return;
  if(!this._hass.user?.is_admin){this.shadowRoot.innerHTML='<p>Instellingen niet beschikbaar voor deze gebruiker.</p>';return;}
  const disclosures=new Map([...this.shadowRoot.querySelectorAll('details[id]')].map(el=>[el.id,el.open]));
  const drafts={};this.shadowRoot.querySelectorAll('[data-draft]').forEach(el=>{if(!el.closest('.appliance-edit,.program-edit'))drafts[el.dataset.draft]=el.type==='checkbox'?el.checked:el.value;});const focus=this.shadowRoot.activeElement?.id;
  const option=(value,label,selected)=>`<option value="${esc(value)}" ${value===selected?'selected':''}>${esc(label)}</option>`;
  const states=Object.values(this._hass.states||{}),tariff=this.config.tariff;
  const priceSensors=states.filter(s=>s.entity_id?.startsWith('sensor.'));
  const plannerSensors=states.filter(s=>s.entity_id?.startsWith('sensor.eleven_appliance_planner')||(s.attributes?.protocol_version>=2&&Array.isArray(s.attributes.appliances)));
  const meters=states.filter(s=>s.attributes?.device_class==='power'&&['W','kW'].includes(s.attributes.unit_of_measurement)&&s.attributes.calculation_mode!=='fixed');
  let html=`<style>${plannerCSS}</style><div class="fields"><label>Naam<input id="title" data-config="title" value="${esc(this.config.title||'')}" maxlength="80"></label><label>Prijsbron<select id="source" data-tariff="source">${SOURCES.map(s=>option(s,s,tariff.source||'sensor')).join('')}</select></label>`;
  if(['sensor','zonneplan'].includes(tariff.source||'sensor'))html+=`<label>Prijssensor<select id="price-entity" data-tariff="entity">${option('','—',tariff.entity)}${priceSensors.map(s=>option(s.entity_id,s.attributes.friendly_name||s.entity_id,tariff.entity)).join('')}</select></label>`;
  if(['energyzero','tibber_prices'].includes(tariff.source)){
   const domain=tariff.source,key=domain==='energyzero'?'energyzero_entry':'tibber_entry';
   html+=`<label>${esc(domain)}<select id="provider-entry" data-tariff="${key}">${option('','—',tariff[key])}${this.entries.filter(e=>e.domain===domain).map(e=>option(e.entry_id,e.title,tariff[key])).join('')}</select></label>`;
  }
  if(tariff.source==='tibber')html+=`<label>Tibber-woning<input id="tibber-home" data-tariff="tibber_home" value="${esc(tariff.tibber_home||'')}"></label><small>Exacte woningnaam; leeg kiest de enige woning. Alleen een EUR-woning gebruiken.</small>`;
  html+=`<div class="program-fields thresholds"><label>Goedkoop tot (ct/kWh)<input id="cheap" type="number" step="any" data-threshold="cheap_price" value="${this.config.cheap_price*100}"></label><label>Duur boven (ct/kWh)<input id="expensive" type="number" step="any" data-threshold="expensive_price" value="${this.config.expensive_price*100}"></label></div></div><details id="programs-section" open><summary>Apparaten en programma’s</summary>${this.linked?'<p class="owned">Integratie beheert deze programma’s. Metingen blijven behouden bij wijzigingen.</p>':''}`;
  html+=this.appliances.map(a=>`<div class="editor-group"><form class="appliance-edit fields" data-aid="${esc(a.id)}"><label>Apparaat<input name="name" data-draft="${esc(a.id)}-name" required maxlength="80" value="${esc(a.name)}"></label>${this.linked?`<label>Vermogensmeter<select name="power_sensor" data-draft="${esc(a.id)}-meter">${option('','Geen meter',a.power_sensor||'')}${meters.map(s=>option(s.entity_id,s.attributes.friendly_name||s.entity_id,a.power_sensor)).join('')}</select></label>`:''}</form>${a.programs.map(p=>`<form class="program-edit fields editor-group" data-aid="${esc(a.id)}" data-pid="${esc(p.id)}"><div class="program-fields"><label>Programma<input name="name" data-draft="${esc(a.id+p.id)}-name" required maxlength="80" value="${esc(p.name)}"></label><label>Duur (minuten)<input name="minutes" data-draft="${esc(a.id+p.id)}-minutes" type="number" min="1" max="1440" step="any" required value="${p.minutes}"></label><label>Totaal kWh<input name="kwh" data-draft="${esc(a.id+p.id)}-kwh" type="number" min="0.001" max="30" step="any" required value="${p.kwh}"></label></div>${this.linked?`<label>Profielmodus<select name="profile_mode" data-draft="${esc(a.id+p.id)}-mode">${option('uniform','Gelijkmatig verbruik',p.profile_mode)}${option('simulated','Gesimuleerd profiel',p.profile_mode)}${p.has_measured_profile?option('measured','Gemeten profiel',p.profile_mode):''}</select></label>`:''}</form>`).join('')}<form class="program-add fields editor-group" data-aid="${esc(a.id)}"><div class="program-fields"><label>Nieuw programma<input name="name" data-draft="${esc(a.id)}-new-name" required maxlength="80"></label><label>Duur (minuten)<input name="minutes" data-draft="${esc(a.id)}-new-minutes" type="number" min="1" max="1440" step="any" required></label><label>Totaal kWh<input name="kwh" data-draft="${esc(a.id)}-new-kwh" type="number" min=".001" max="30" step="any" required></label></div><button type="submit">Nieuw programma</button></form></div>`).join('');
  html+=`<form id="add-appliance" class="fields editor-group"><label>Apparaat<input name="name" data-draft="new-appliance" required maxlength="80"></label><label>Type<select name="kind" data-draft="new-appliance-kind">${Object.entries(kinds).map(([k,l])=>option(k,l,'washer')).join('')}</select></label><button type="submit">Apparaat toevoegen</button></form></details><details id="integration-section"><summary>Integratie (optioneel)</summary><p class="muted">Expliciete koppeling; installatie alleen schakelt niets in.</p>`;
  if(this.linked){
   html+=`<label class="check"><input id="copy-unlink" data-draft="copy-unlink" type="checkbox">Ook integratieprogramma’s als eenvoudige instellingen kopiëren</label><button id="unlink">Integratie ontkoppelen</button>`;
   if(this.data)html+=`<label>Meldingsactie<input id="notification-action" disabled value="${esc(this.data.settings?.notification_action||'persistent_notification.create')}"></label>`;
  }else{
   html+=`<label>Integratie<select id="integration-entity" data-draft="integration-entity">${option('','—','')}${plannerSensors.map(s=>option(s.entity_id,s.attributes.friendly_name||s.entity_id,'')).join('')}</select></label><button id="link">Integratie koppelen</button>`;
  }
  const help=this.en?'Changes are drafts. Use Home Assistant Save to persist them, or Cancel to discard them. Linking does not transfer or change backend records.':'Wijzigingen zijn concepten. Gebruik Opslaan van Home Assistant om ze te bewaren, of Annuleren om ze te verwerpen. Koppelen draagt geen backendgegevens over en wijzigt ze niet.';
  html+=`</details><p class="status error" role="status">${esc(this.message)}</p><p class="muted">${esc(help)}</p>`;
  this.shadowRoot.innerHTML=html;
  this.shadowRoot.querySelectorAll('details[id]').forEach(el=>{if(disclosures.has(el.id))el.open=disclosures.get(el.id);});
  this.shadowRoot.querySelectorAll('[data-draft]').forEach(el=>{if(el.dataset.draft in drafts){if(el.type==='checkbox')el.checked=drafts[el.dataset.draft];else el.value=drafts[el.dataset.draft];}});
  const status=()=>{this.shadowRoot.querySelector('[role=status]').textContent=this.message;};
  this.shadowRoot.querySelectorAll('[data-config],[data-tariff],[data-threshold]').forEach(el=>{
   const update=()=>{if(!el.checkValidity()||el.type==='number'&&el.value==='')return;const next=clone(this.config);try{if(el.dataset.config)next[el.dataset.config]=el.value;if(el.dataset.tariff)next.tariff[el.dataset.tariff]=el.value;if(el.dataset.threshold)next[el.dataset.threshold]=Number(el.value)/100;this.config=validateConfig(next);this.emit();this.message='';}catch(e){this.message=e.message;}status();if(el.id==='source')this.render();};
   if(el.tagName==='SELECT')el.onchange=update;else el.oninput=update;
  });
  this.shadowRoot.querySelectorAll('form').forEach(form=>{
   const edit=form.matches('.appliance-edit,.program-edit');
   const update=()=>{
    if(this.linked||!this._hass?.user?.is_admin||!form.checkValidity())return;
    const values=Object.fromEntries(new FormData(form)),aid=form.dataset.aid,pid=form.dataset.pid,next=clone(this.config);
    try{
     if(form.id==='add-appliance')next.appliances.push({id:uid(),name:values.name,kind:values.kind,programs:[]});
     else{const a=next.appliances.find(a=>a.id===aid);if(form.classList.contains('appliance-edit'))a.name=values.name;else{const p=pid?a.programs.find(p=>p.id===pid):{id:uid()};Object.assign(p,{name:values.name,minutes:Number(values.minutes),kwh:Number(values.kwh)});if(!pid)a.programs.push(p);}}
     this.config=validateConfig(next);this.message='';this.emit();
     if(!edit){form.querySelectorAll('[data-draft]').forEach(el=>el.removeAttribute('data-draft'));this.render();}else status();
    }catch(e){this.message=e.message||String(e);status();}
   };
   form.onsubmit=e=>{e.preventDefault();if(!edit)update();};
   if(edit){if(this.linked)form.querySelectorAll('input,select').forEach(el=>el.disabled=true);else form.oninput=update;}
   else if(this.linked)form.remove();
  });
  const owned=this.shadowRoot.querySelector('.owned');if(owned)owned.textContent=this.en?'Integration settings are read-only: the backend cannot apply dashboard drafts on native Save. Unlink to edit simple card settings; backend programs, measurements and plans stay unchanged.':'Integratie-instellingen zijn alleen-lezen: de backend kan dashboardconcepten niet bij native Opslaan toepassen. Ontkoppel om eenvoudige kaartinstellingen te bewerken; backendprogramma’s, metingen en plannen blijven ongewijzigd.';
  const link=this.shadowRoot.querySelector('#link');if(link)link.onclick=()=>this.run(()=>this.link());
  const unlink=this.shadowRoot.querySelector('#unlink');if(unlink)unlink.onclick=()=>this.unlink();

  this.shadowRoot.querySelectorAll('button').forEach(el=>el.disabled=this.pending);
  localize(this.shadowRoot,this._hass.locale?.language?.startsWith('en'));if(focus)this.shadowRoot.getElementById(focus)?.focus();
 }
}

if(!customElements.get('eleven-appliance-planner'))customElements.define('eleven-appliance-planner',ElevenAppliancePlanner);
if(!customElements.get('eleven-appliance-planner-editor'))customElements.define('eleven-appliance-planner-editor',ElevenAppliancePlannerEditor);
window.customCards=window.customCards||[];if(!window.customCards.some(c=>c.type==='eleven-appliance-planner'))window.customCards.push({type:'eleven-appliance-planner',name:'Eleven Appliance Planner',description:'Standalone appliance start advice with optional integration',preview:true});
})();
