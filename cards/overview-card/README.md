# Eleven Overview

A compact overview of numeric Home Assistant sensors, with current values, Recorder sparklines and signed change since the start of the selected rolling period. Add one or more sensors; there is no fixed sensor-count limit. Different sensors may use different units. The card displays existing sensors; it does not create sensors or provide device controls.

## Installation

Included in the local collection build `dist/eleven-cards.js`. For an existing standalone installation, install only `cards/overview-card/dist/eleven-overview-card.js` at `/config/www/eleven-cards/eleven-overview-card.js` and register `/local/eleven-cards/eleven-overview-card.js?v=<build-hash>` as a JavaScript module. Do not install a second combined resource alongside sibling modules. Use the collection resource when installing the complete card set.

Refresh Home Assistant, Add card, search for **Eleven Overview**. A native visual editor provides title, period (1–168 hours), columns, graph and delta switches, plus independent expandable sensor settings: entity, name, color, reorder and remove.

```yaml
type: custom:eleven-overview-card
title: Eleven Overview
hours_to_show: 24
columns: auto
show_graph: true
show_delta: true
section_size: standard
# graph_height: 64
entities:
  - entity: sensor.example_power
    name: Power
    color: [33, 150, 243]
  - entity: sensor.example_temperature
    name: Temperature
    color: [231, 138, 20]
```

Entity identifiers above are examples, not installed sensors. Columns accepts `auto`, `1`, `2`, `3`; very narrow cards always reflow to one column. HA theme and Dutch/English labels are supported. Activate a sensor with click or keyboard to open Home Assistant more-info.

## Section size

Sensor sections use a quiet rounded surface, a stronger reading and a compact trend line. Hover keeps the section border unchanged; keyboard focus remains visible. The visual editor offers **Sensor section size / Grootte sensorsecties** for all sensors together:

| `section_size` | Padding | Value size | Default graph height |
| --- | --- | --- | --- |
| `compact` | 10 px | 24 px | 32 px |
| `standard` (default) | 14 px | 28 px | 40 px |
| `spacious` | 20 px | 36 px | 64 px |

Use **Graph height / Grafiekhoogte** (`graph_height`, an integer from 24 to 160 pixels) to override the graph height independently. Clear the field to follow the selected section size again. `columns` controls the maximum number of sections alongside each other; layout still reduces columns to keep values readable. Existing YAML needs no changes. Card-size estimates account for the chosen section size and graph height.

Compact sections place the current value at the upper right, with the name and colour dot aligned at the top. The change and its period caption share a baseline below the graph. Narrow sections allow text to wrap instead of clipping values. Standard and spacious keep their stacked layout. Graph height is independent of this layout choice.

The editor's **Add sensor / Sensor toevoegen** action also works beyond eight sensors. Default colours repeat after the eighth sensor; individual colour overrides remain available. All configured sensors share one history request per refresh. More sensors and longer periods increase the amount of Recorder data requested.

## Data semantics

Current values always come from live HA states. History refreshes once per minute in one batched request. Delta is current value minus the held value at the rolling period start, in that sensor's unit (percentage-point differences use `pp` for percent sensors). It is not yesterday's average, a percentage or a judgement of good/bad. Without a valid boundary value, comparison is unavailable. Unit changes and unavailable/non-numeric states break the line; gaps are never interpolated to zero. Recorder exclusion/retention limits can yield no history while the live value remains visible. History errors retain live values and offer Retry. Invalid or missing sensor states are explicit.

Miniature step lines have independent vertical scales per sensor and no cross-sensor amplitude meaning. They visualize recorded points, not reconstructed samples. Large retained histories can increase the initial request size; use short periods for high-frequency sensors.

## Development

Edit `src/`, not `dist/`. Run `node cards/overview-card/scripts/build.mjs`, `node --test cards/overview-card/tests/*.test.mjs`, then the root regression suite. Design and installation scope are recorded in `../../docs/OVERVIEW-BETA-PLAN.md`.

## Shared card background

The visual editor includes **Card background / Kaartachtergrond** with the shared styles, colour source, transparency, animation and whole-card or fading top-section coverage. The same `card_background` YAML object works across all cards. See [shared configuration](../../README.md#shared-card-background) for options and legacy compatibility.
