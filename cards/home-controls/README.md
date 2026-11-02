# Eleven standalone controls

Three independent Lovelace cards with independent visual editors, shared in one standalone JavaScript resource. No mode selector and no mandatory combination of devices. The older `eleven-home-controls-card` element, mode-based implementation and configuration form have been removed; saved legacy card definitions must be migrated before updating.

This is a locally installed beta. These cards are not yet included in the collection's main HACS release. Do not rebuild/deploy unrelated dirty collection modules to update them.

## Card types

### Scenes & actions — `custom:eleven-actions-card`

`actions` is an ordered list of scene/script entities or objects: `entity`, optional `name`, `icon`, `description`, `aria_label`, `confirmation` message. The visual editor supports adding, removing, reordering and editing each action. Only available scene/script entities can execute.

Optional `title` and `confirmation`. New cards operate directly by default; set `confirmation: true` to require confirmation. Existing dashboard confirmation choices are preserved on migration. An action's optional confirmation text customizes the prompt only when card-level confirmation is enabled.

`columns` is an optional integer from **1 to 6**, default **3**, also available as **Maximum columns / Maximum aantal kolommen** in the visual editor. Buttons place a prominent neutral icon above their centered name; descriptions remain visible. The configured count is a **maximum**: actual word widths or enlarged text may reduce effective columns for readability. Complete names wrap and the card grows; a single action keeps one grid cell rather than filling the row. Controls and Waste do not use this setting.

Example:

```yaml
type: custom:eleven-actions-card
title: Scenes
columns: 3 # maximum; 1..6, default 3
confirmation: false
actions:
  - entity: scene.reading
    name: Reading
    icon: mdi:book-open-outline
  - entity: script.goodnight
    name: Good night
    icon: mdi:weather-night
```

### Controls — `custom:eleven-controls-card`

`entities` is an ordered list of entity IDs or objects with `entity`, optional `name` and `icon`. Supported domains: `climate`, `cover`, `light`, `fan`, `switch`, `input_boolean`, `number`, `input_number`. No required thermostat or cover. Add any number of supported entities in any order. Optional title and confirmation follow the action card.

Controls derive from actual capabilities: thermostat single setpoint up/down, cover open/stop/close and position, dimmable light brightness, fan speed, on/off and bounded numeric increments. Setpoints respect source steps and limits. Range-only thermostats use native more-info rather than guessing a single target. Fan power buttons require the respective feature bits. Unsupported controls are unavailable; clicking the entity identity opens native more-info for remaining features. This is not a complete replacement for every domain's native more-info dialog (HVAC modes/presets, fan oscillation and cover tilt are not inline controls).

No optimistic device-state changes; buttons show actual HA state. Requests are guarded against duplicates while pending, errors are shown inline. Unavailable data displays explicitly and never becomes zero.

```yaml
type: custom:eleven-controls-card
title: Office
entities:
  - entity: light.desk
    name: Desk
  - entity: fan.office
  - entity: cover.sunshade
```

### Waste collection — `custom:eleven-waste-card`

`entities` is an ordered list of sensor/calendar entity IDs or objects. Each source supports `name`, `icon`, `color` (RGB array or hexadecimal), `source` (`auto`, `date`, `days`), `attribute` and `filter` (case-insensitive literal calendar summary substring). All common settings are in the visual editor; a custom integration is not required.

`auto` recognizes a sensor's `daysTo` attribute, otherwise ISO dates (`YYYY-MM-DD`) or timezone-qualified ISO timestamps in its state. `date` reads an ISO date/timestamp from state or the named attribute. `days` reads an integer number of days from state or the named attribute. Day-count values are relative to the source's HA `last_updated` local day, falling back to today only when that timestamp is absent; the countdown therefore does not shift pickup dates forward at midnight. Unrecognized localized prose is not parsed.

Calendar sources use HA's authenticated read-only calendar event API, refreshed every five minutes, and show events up to 60 days ahead. Use `filter` for a shared calendar; `name` overrides event summary if one fixed stream name is desired. Multiple calendar events can appear. Failed reads show a retry action; empty calendar ranges, unavailable sources, invalid dates and expired dates are distinguished. Existing valid sensor rows remain visible when another source fails. Disconnection/configuration changes invalidate stale asynchronous responses and clean timers.

The next pickup date leads, types sharing a date are grouped, later dates are compact rows. Uses HA timezone and locale; Today/Tomorrow and UI labels follow Dutch/English. Other languages retain locale-aware date/number formatting with English UI labels.

```yaml
type: custom:eleven-waste-card
title: Waste collection
entities:
  - entity: sensor.paper_collection
    name: Paper
    icon: mdi:package-variant
    color: [86, 142, 194]
  - entity: sensor.organic_days
    source: days
    name: Organic
    icon: mdi:leaf
  - entity: calendar.waste
    filter: plastic
```

## Build and test

From collection root:

```sh
node cards/home-controls/scripts/build.mjs
node --check cards/home-controls/dist/eleven-home-controls-card.js
node --test cards/home-controls/tests/*.test.mjs tests/*.test.mjs
```

The standalone build includes shared request helpers, presentation helpers in `src/shared-ui.js`, generic adapters, three supported card classes and their shared editor. It does not include a legacy card or mode editor and does not rebuild sibling card artifacts. The artifact keeps the filename `dist/eleven-home-controls-card.js` for resource/build compatibility; this filename does not register a legacy card. Design and acceptance: `../../docs/STANDALONE-CONTROLS-DESIGN.md`. Historical deployment/readback evidence: `../../qa-evidence/standalone-controls/`.

## Compatibility and installation

Load one standalone artifact as a Lovelace `module` resource. Do not load both old and new versions simultaneously. Use an immutable content-hashed filename and update only its existing resource ID, preserving the original artifact for rollback. Snapshot/read back the exact dashboard and resources, guard concurrent edits, preserve unrelated configs and verify served bytes equal the build.

Legacy `custom:eleven-home-controls-card` configurations no longer work. Migrate `mode: actions` to `custom:eleven-actions-card` with the same `actions`; migrate `mode: comfort` to `custom:eleven-controls-card` with ordered `entities` for the previous `climate` and `covers`, converting `cover_name`/`cover_names` to per-item `name`; migrate `mode: collections` to `custom:eleven-waste-card` with the same sensor `entities`. Remove `mode` and preserve explicit confirmation choices, targets, labels and visibility. The former legacy default required confirmation, so set `confirmation: true` explicitly when migrating an Actions/Controls config that omitted it. Modern cards retain string/object entity entries and Waste's existing `daysTo` parsing.

The module still removes obsolete legacy picker metadata in place, preserving Home Assistant's registry reference. It cannot unregister an element already loaded by an older resource in the same browser session: remove that old resource from the installation and reload the frontend. No installation, dashboard, resource or device changes are performed by the local build/tests; deployment is separate.
