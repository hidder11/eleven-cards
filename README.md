# Eleven Cards

Home Assistant dashboard cards for energy, sensor history, calendars, weather, vehicles and everyday controls.

## Shared card background

Every built card has a **Card background / Kaartachtergrond** section in its visual editor, including the separate local beta cards. Choose Aurora sky, Silk Flow, Atmospheric flow, Ink bloom or Holographic grid; theme accent, up to three custom colours or the card's status colour; transparency; animation; and coverage of the whole card or the top X pixels. A top section fades at its lower edge, and decoration stays within the theme's rounded card corners. New configurations default to Atmospheric flow over the top 240 px with 65% transparency. Existing background YAML stays usable.

Add the same object to any card configuration:

```yaml
card_background:
  variant: isobars # aurora, ribbon, ink-bloom, hologram
  colorMode: accent # custom or dynamic
  colors: ['#4db6ac', '#7287ed', '#c77dbd'] # used in custom mode
  transparency: 65
  coverage: header # card for the full surface
  height: 240
  animated: true
```

Use `card_background: false` to turn it off. Dynamic colours use the calling card's status tone where available and otherwise fall back to the Home Assistant accent. Animation respects reduced motion and pauses outside the viewport. See the [shared component documentation](shared/README.md#animated-card-background) and the [interactive overview](review/index.html).


## Cards

| Card | What it shows | Configuration |
| --- | --- | --- |
| **Energy** | Import and export prices, favorable periods and an optional grid-import energy overlay. | [Energy documentation](cards/dynamic-energy-price-card/README.md) |
| **History** | Recorded values from 1–8 numeric sensors, with an independent y-axis per unit. | [History documentation](cards/history-graph-card/README.md) |
| **Timeline** | State history for entities such as doors, switches and people. | [Timeline documentation](cards/timeline-card/README.md) |
| **Overview (beta)** | Current sensor values, sparklines and change since period start. | [Overview documentation](cards/overview-card/README.md) |
| **Bar Chart** | Vertical grouped or stacked sensor-history bars, based on History. | [Bar Chart documentation](cards/bar-chart/README.md) |
| **Heatmap (beta)** | Sensor averages or consumption grouped by hour, day, week or month. | [Heatmap documentation](cards/heatmap-card/README.md) |
| **Car (beta)** | Vehicle image, percentage and custom readings, with optional EVCC charging integration and selectable tabs. | [Car documentation](cards/car-card/README.md) |
| **Weather (beta)** | Compact current weather and a short hourly or daily forecast, with state-colored artwork. | [Weather documentation](cards/weather-card/README.md) |
| **Energy Flow (beta)** | Solar, grid and home distribution using Home Assistant Energy configuration and Recorder, with live/history buttons. | [Energy Flow documentation](cards/energy-flow-card/README.md) |
| **Calendar (beta)** | Calendar events in a day list, day columns or month view, with optional weather. | [Calendar documentation](cards/calendar-card/README.md) |
| **House (beta)** | Configurable transparent house rendering, lighting, people and optional current-weather decoration. | [House documentation](cards/house-card/README.md) |
| **Shopping** | Any to-do list, with non-blocking additions, integrated saving/retry rows and provider-driven editing. | [Shopping documentation](cards/shopping-card/README.md) |

![Eleven Dynamic Energy Price Card preview](cards/dynamic-energy-price-card/docs/images/revised-default-dark-desktop.png)

All twelve cards include a visual editor and follow Home Assistant's light/dark theme. House currently retains its approved Dutch chrome; the other cards follow Dutch/English frontend language. Energy, History, Timeline and Bar Chart support synchronized hover across cards. History, Bar Chart and Timeline also share a compact period picker and a single group for previous/next, Now and zoom controls in the header, with rolling windows and local calendar days, weeks, months, quarters and years. These three cards also indicate zoom, support isolating one entity and provide an information icon beside History with compact per-sensor source and unit information. History and Bar Chart include per-sensor min/max/average for the viewed range; Delta Bar Chart adds sums in the same popup. Calendar list and column views reuse the shared period popup for day counts, calendar periods and custom ranges, while Month view offers only previous month, Now and next month. Calendar keeps its own date navigation and Home Assistant timezone; it does not join graph timeframe synchronization.

Car combines the vehicle and EVCC cards. Enable EVCC integration to show charging data and choose the Controls, Session and EVCC tabs; disable it to choose your own percentage and three entity readings. Compact changes density independently of visible tabs. The standalone EVCC card has been removed. Migrate existing `custom:eleven-evcc-card` dashboards to `custom:eleven-car-card` with `evcc_enabled: true`; retain the entity mappings and other settings. The Climate prototype has also been removed.

The cards use existing Home Assistant data. They do not provide tariffs or create sensors. The EVCC card can change charging settings through Home Assistant. See each card's documentation for its sensor requirements and configuration options.

Weather, Car and Energy Flow share one header fade that ends before tab content, including compact layouts.

## Standalone cards

The collection module contains the twelve cards listed above. The following local betas are built separately and are **not included** in `dist/eleven-cards.js`. Load their standalone module to use them.

| Card | What it shows | Resource and documentation |
| --- | --- | --- |
| **Control Pad** | Buttons for scenes and scripts, with optional confirmation. | [Standalone controls](cards/home-controls/README.md) - `cards/home-controls/dist/eleven-home-controls-card.js` |
| **Controls** | Thermostat and light controls. | [Standalone controls](cards/home-controls/README.md) - same module as Control Pad |
| **Waste** | Upcoming waste collection dates. | [Standalone controls](cards/home-controls/README.md) - same module as Control Pad |
| **Room** | Room scenes, lighting, temperature, humidity and dashboard navigation. | [Room documentation](cards/room-card/README.md) - `cards/room-card/dist/eleven-room-card.js` |
| **Appliance Planner** | Tariff-based advice for an appliance run before a deadline. | [Planner documentation](cards/appliance-planner/README.md) - `cards/appliance-planner/dist/eleven-appliance-planner.js` |
| **Scene Engine** | Effective scene request, active requests and optional reset. | [Scene Engine documentation](cards/scene-engine-card/frontend/README.md) - `cards/scene-engine-card/dist/eleven-scene-engine-card.js` |

## Card previews

Current card screenshots with the optional Eleven Material light theme and fictional data. They show the current branch, including local betas; they do not indicate a published release or design approval. Car with EVCC is shown separately as an additional configuration of Car. Appearance follows your Home Assistant theme.

### Energy

Follow electricity import and export prices, find inexpensive periods and compare them with an optional grid-import energy overlay. [Configuration and options](cards/dynamic-energy-price-card/README.md).

![Energy card with fictional data](docs/images/dynamic-energy-price-card.png)

### History

Compare recorded values from up to eight sensors. Different units keep their own axes; the shared period picker, zoom and legend help inspect a particular interval. [Configuration and options](cards/history-graph-card/README.md).

![History card with fictional data](docs/images/history-graph-card.png)

### Timeline

See when doors, switches, people or other entities changed state. Coloured intervals, duration summaries and period navigation make recurring patterns easier to spot. [Configuration and options](cards/timeline-card/README.md).

![Timeline card with fictional data](docs/images/timeline-card.png)

### Overview

Keep current sensor values, their recent sparklines and changes since the start of the period together in a compact overview. [Configuration and options](cards/overview-card/README.md).

![Overview card with fictional data](docs/images/overview-card.png)

### Bar Chart

Compare sensor history in grouped or stacked bars. Use periods and aggregation to inspect measurements or consumption totals. [Configuration and options](cards/bar-chart/README.md).

![Bar Chart card with fictional data](docs/images/bar-chart.png)

### Heatmap

Find daily and weekly patterns in sensor measurements or consumption. A full-width colour scale explains the intensity of the matrix. [Configuration and options](cards/heatmap-card/README.md).

![Heatmap card with fictional data](docs/images/heatmap-card.png)

### Calendar

Show appointments as a day list, day columns or a month grid. Recessed day surfaces, softly tinted appointments and subtle shadows match the shared styling. Past month dates are greyed out; today has an accent-coloured date and a short underline. [Configuration and options](cards/calendar-card/README.md).

![Calendar card with fictional data](docs/images/calendar-card.png)

### Weather

Combine current weather, temperature and supporting readings with an hourly or daily forecast. Choose the visible readings and forecast tabs, or use a compact layout. [Configuration and options](cards/weather-card/README.md).

![Weather card with fictional data](docs/images/weather-card.png)

### Car

Show your vehicle image, battery percentage, range and custom readings such as status or odometer. Values come from the Home Assistant entities selected in the editor. [Configuration and options](cards/car-card/README.md).

![Car card with fictional data](docs/images/car-card.png)

### Car with EVCC

Enable EVCC in the same Car card to add charging mode, power, target percentage and session details. This is a configuration of Car, not a separate card type. Charging controls operate through Home Assistant. [Configuration and options](cards/car-card/README.md).

![Car with EVCC card with fictional data](docs/images/car-evcc.png)

### Energy Flow

See solar generation, grid import/export and home consumption using the Home Assistant Energy configuration. Switch between current power and historical energy, and inspect solar, home or grid details. [Configuration and options](cards/energy-flow-card/README.md).

![Energy Flow card with fictional data](docs/images/energy-flow-card.png)

### House

Display your own transparent house render with lighting, presence and optional weather decoration. Supply a compatible image manifest; the card does not generate house models. This screenshot uses a generic synthetic scene. [Configuration and options](cards/house-card/README.md).

![House card with fictional data](docs/images/house-card.png)

### Shopping

Use an existing Home Assistant to-do list for shopping or other tasks. Add items, mark them complete and edit supported fields, with saving and retry states kept inside the list. [Configuration and options](cards/shopping-card/README.md).

![Shopping card with fictional data](docs/images/shopping-card.png)

### Control Pad

Run selected scenes and scripts from a responsive button grid. Choose the column limit, labels and icons, and enable confirmation when appropriate. [Configuration and options](cards/home-controls/README.md).

![Control Pad card with fictional data](docs/images/actions-card.png)

### Controls

Bring thermostat and light controls together in a small card. The available controls follow each entity's supported Home Assistant features. [Configuration and options](cards/home-controls/README.md).

![Controls card with fictional data](docs/images/controls-card.png)

### Waste

Show the next collection dates from configured waste sensors, with separate names and colours for each waste type. [Configuration and options](cards/home-controls/README.md).

![Waste card with fictional data](docs/images/waste-card.png)

### Room

Summarise a room with compact scene controls, light state, temperature and optional humidity. Open the room dashboard from its name or the primary light's more-info dialog from the light button. [Configuration and options](cards/room-card/README.md).

![Room card with fictional data](docs/images/room-card.png)

### Appliance Planner

Compare available appliance programs and find an inexpensive uninterrupted run before a chosen deadline. Advice uses configured durations, energy use and tariffs; standalone advice does not start an appliance. [Configuration and options](cards/appliance-planner/README.md).

![Appliance Planner card with fictional data](docs/images/appliance-planner.png)

### Scene Engine

Inspect the effective scene request, its priority and the number of active requests from a Scene Engine entity. An optional reset button exposes the configured Home Assistant reset action. [Configuration and options](cards/scene-engine-card/frontend/README.md).

![Scene Engine card with fictional data](docs/images/scene-engine-card.png)

## Synchronize timeframes (local version)

All six visual editors expose **Synchronize timeframe** (off by default) and **Synchronization group**. Enable it on each card to link, using the same group key:

```yaml
sync_timeframe: true
hover_sync_group: energy
```

Hover and timeframe synchronization use the same `hover_sync_group` setting, labeled Synchronization group. Each synchronization can be enabled separately. Legacy `timeframe_sync_group` is accepted when `hover_sync_group` is absent.

The compact timeframe popup has **Last**, **Calendar** and **Custom range** tabs, with **Default** always available above them. It opens the category of the selected range and keeps drafts when switching tabs or refreshing.

Open the **Custom range** tab to enter start and end dates and times in the Home Assistant timezone (up to 366 days). The chosen range stays fixed and can be shared with the group. Previous/next move by the range duration; Now shows that duration ending at the current time. Default restores each card's own configured range.

History, Bar Chart, Timeline and Heatmap share timeframe menu selections and previous/next/Now. Explicit periods share the actual range, even when cards have different default hours. Selecting **Default** resets every linked card to its own configured hours; Overview returns to live values and Energy to its native price window. Zoom, aggregation and saved configuration remain local. Hiding navigation does not stop a card from following. Empty keys use the default group; different keys stay independent.

Overview follows the range and shows the last recorded value at its end, with change from its start. Energy follows using price intervals available in its source; missing periods show an availability message. Energy's current-price summaries still refer to now. Overview and Energy do not have their own timeframe picker.

Synchronization lasts within the open page. Later cards adopt the last group selection; reloading the page restores configured defaults. No Home Assistant server changes are required.

For a separate Home Assistant test collection, run `npm run build` and `node scripts/build-test.mjs`. The generated test module and Dutch instructions are in `.cache/home-assistant-test/` (`LEESMIJ-TIJDVAK.md`). Use this collection instead of also loading the separate Heatmap test resource. It includes Calendar as `custom:eleven-calendar-card-test`.

## Installation

### HACS

1. Open **HACS → Custom repositories**.
2. Add `https://github.com/hidder11/eleven-cards` with type **Dashboard**.
3. Download **Eleven Cards**.
4. Under dashboard resources, check that `/hacsfiles/eleven-cards/eleven-cards.js` is registered as a **JavaScript module**. Add it if it is missing.
5. Refresh your browser.

The published cards are included in one module. Local beta cards below are not yet published. Use the custom repository to install the released collection; Eleven Cards is not included in the default HACS list.

### Manual installation

1. Download [`dist/eleven-cards.js`](dist/eleven-cards.js).
2. Copy it to `/config/www/eleven-cards/eleven-cards.js`.
3. Add `/local/eleven-cards/eleven-cards.js` to your dashboard resources as a **JavaScript module**.
4. Refresh your browser.

Do not load the collection module alongside standalone versions of the same twelve cards. Choose one installation method for those cards to avoid registering them twice. The additional standalone cards listed above may be loaded alongside the collection.

## Add a card

Edit your dashboard, choose **Add card**, and search for **Eleven**. Select a card, choose its entities, and configure it in the visual editor.

For YAML configuration, use these types:

| Card | YAML type |
| --- | --- |
| Energy | `custom:eleven-dynamic-energy-price-card` |
| History | `custom:eleven-history-graph-card` |
| Timeline | `custom:eleven-timeline-card` |
| Overview (beta) | `custom:eleven-overview-card` |
| Bar Chart | `custom:eleven-bar-chart` |
| Heatmap (beta) | `custom:eleven-heatmap-card` |
| Calendar (beta) | `custom:eleven-calendar-card` |
| Car (beta) | `custom:eleven-car-card` |
| Weather (beta) | `custom:eleven-weather-card` |
| Energy Flow (beta) | `custom:eleven-energy-flow-card` |
| House (beta) | `custom:eleven-house-card` |
| Shopping | `custom:eleven-shopping-card` |

Overview, Heatmap, Calendar, Car, Weather and Energy Flow are local betas in this working tree; they have not been published as a HACS release.

The card documentation linked above includes YAML examples and option details.

## Migrating from the standalone cards

If your dashboard uses `custom:dynamic-energy-price-card` or `custom:history-graph-card`:

1. Back up your dashboard configuration and resource list.
2. Install Eleven Cards, keeping the old resources during migration.
3. Change the card types to `custom:eleven-dynamic-energy-price-card` and `custom:eleven-history-graph-card` respectively. Leave the other configuration options unchanged.
4. Refresh your browser and check the migrated cards.
5. Remove an old resource only when no dashboard uses its old card type.

Installing Eleven Cards does not automatically update saved dashboard configurations.

## Card height

The ten chart/status cards support vertical sizing in the Home Assistant Sections view. Shopping uses automatic content height. Open the card editor's Layout tab and choose its number of rows. Each card supplies a default and a minimum height. History, Bar Chart and Energy resize their graphs; Calendar, Timeline, Overview and Car scroll their contents when needed. Heatmap scrolls its matrix inside the allocated height, still respecting its configured maximum matrix height. Masonry dashboards continue to use each card's `getCardSize()` estimate.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for branches, pull requests, testing and releases. `develop` is the integration branch; `main` is the stable release base. AI assistants must also read [AGENTS.md](AGENTS.md).

Requires Node.js 20+, npm and Python 3. No npm dependencies need to be installed.

Run from the repository root:

```sh
npm run build
npm test
npm run check
```

Edit the source files, not the generated bundles. The build produces `dist/eleven-cards.js` for the collection and a standalone module in each card's `dist/` directory.

Reusable buttons, tabs and popups live in `shared/ui-*.js`. See [Shared UI components](shared/README.md) for their rendering, styling and lifecycle APIs.
