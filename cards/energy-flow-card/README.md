# Eleven Energy Flow (beta)

Energy distribution in the same style as Eleven Car and Weather. Reads the Home Assistant Energy dashboard configuration automatically; no energy-meter entities need to be copied into the card.

```yaml
type: custom:eleven-energy-flow-card
```

For the local test collection use `custom:eleven-energy-flow-card-test` and load only the collection test resource.

The card has a compact horizontal distribution diagram with solar, home and a single grid endpoint, with moving round dots for measured live flows. The diagram uses a taller layout with more space between the return route and the home routes, 72 × 72 endpoint buttons, 22 px icons, 18 px route readings and stronger lines; its outside endpoints align with the left and right edges of the solar metric below, including compact mode. The large home-consumption value uses the shared primary-value component. Solar generation, grid import and grid export use the shared metric surfaces, including compact density. In Live, a **History** button opens historical data. In History, an adjacent **Live** button returns to current power. The switch belongs to the same group as the period picker and navigation. The shared period popup stays unchanged, with no view controls inside it. Details can be shown as popups or tabs, with custom entity tabs.

## Data

The selected Kleurbanen diagram uses broad tinted route beds and centred endpoint labels/icons. Two right-pointing arrows on the upper export route align vertically with the lower solar and grid arrows. The five alternative diagram/detail compositions in `qa/energy-design-examples.html` are fixture-based previews and do not change the production popup layout.

- Sources come from `energy/get_prefs`. Multiple grid connections and solar sources are combined. Both legacy `flow_from` / `flow_to` grid configuration and the unified grid format are supported.
- History requests Recorder hourly `change` statistics in **kWh**, using the same energy meters as Energy. It supports external statistics without a corresponding entity. Missing configured statistics are displayed as unavailable, rather than as zero. The current hour may not be present yet; custom ranges have hourly statistics precision.
- Live reads **W / kW / MW** sensors from Energy `stat_rate` and `power_config`. A signed grid reading is positive for import and negative for export. The card follows Home Assistant state updates; it never derives live power from energy counters.
- If a battery is configured, discharge is added and charging subtracted when calculating home consumption. The battery is not a separate node; a short note explains the calculation. Without the required battery power data, calculated live home consumption is unavailable. A measured home-power override can supply the total directly.
- Energy configuration is refreshed every five minutes in Live and every minute in History. History refreshes every minute while visible. Requests time out, obsolete responses are ignored, and disconnected/hidden cards stop refreshing.

Live power is only automatic when Energy has power sensors configured. For older installations, select optional overrides in the visual editor:

```yaml
type: custom:eleven-energy-flow-card
title: Energieverdeling
default_view: live
background: ribbon
animate_background: true
solar_power_entity: sensor.total_solar_power
grid_power_entity: sensor.grid_power
# grid_power_inverted: true
# home_power_entity: sensor.total_home_power
```

Solar and grid overrides must measure the combined total of all corresponding sources. As an alternative to a signed `grid_power_entity`, set `grid_import_power_entity` and/or `grid_export_power_entity` to nonnegative power sensors. The signed sensor takes precedence. Overrides affect Live only; History always follows Energy.

Solar-to-home and solar-to-grid paths are only attributed when their source can be established. With a battery, those paths stay inactive while the measured grid totals remain visible. Historical diagrams are static; their grid endpoint exposes import and export separately. Each route shows its own value with a smaller unit, including the upper export route. Endpoint surfaces reuse the shared metric component background, rounding and corner tint.

## Configuration

### Current Grid prices

Select optional **Current import price** and **Current export price** sensor entities under **Prices** in the visual editor. Grid Live reads their current state directly; no interval data or separate graph is required. Units must be a currency per Wh, kWh or MWh and are normalized to the displayed currency per kWh. EUR and € display with the euro sign before the value. Zero and negative prices remain valid. A selected sensor that is missing, unavailable or has an invalid unit shows a dash, without silently using a different tariff.

Leave either selector empty to use the corresponding tariff from Home Assistant Energy. Recorded historical costs and estimated historical device costs continue to use Recorder data and never use today's price.

```yaml
type: custom:eleven-energy-flow-card
detail_view: tabs
price_entity: sensor.current_import_price
export_price_entity: sensor.current_export_price
```

The former Prices tab and embedded graph have been removed. Legacy show_prices and price_card options are ignored; a former default_tab: prices falls back to a visible detail/custom tab. Explicit price_entity and export_price_entity selections remain compatible.

### Energy detail popups

Press **Home**, **Grid**, or **Solar** in the diagram to open the same shared popup used by the other Eleven cards. No additional YAML or entity selection is required; these details follow the existing Home Assistant Energy preferences.

All readings, prices and percentages use at most two decimals. Live/History appears directly in the popup title; detail tabs omit the repeated date/time sentence and use the card's existing period controls.

Home devices and both Solar ratios use the shared detail-surface component: title, labeled readings and an optional 8px proportion bar. Live devices show power and share of home power. Historical devices show energy, share and estimated cost. Zero and unavailable devices are hidden. Sort History devices by consumption or estimated cost; Other stays last. Nested meters retain their parent hint and are excluded from double counting. Device titles open native HA more-info when the relevant power/energy entity exists; external statistics without entities remain read-only.

Estimated device costs value each device's hourly consumption at that hour's recorded import tariff (recorded import cost divided by recorded import energy, weighted across connections). These are consumption-value estimates, without deducting solar generation, not an allocation of the utility bill. Missing hourly tariffs, including zero-import hours, use an energy-weighted average of valid recorded import costs and energy within the selected period. Known hourly tariffs remain unchanged. Device surfaces show the estimated total without a per-device fallback percentage note; the same calculation applies to Other. Missing device consumption, incompatible currencies or no usable historical tariff leave the estimate unavailable. Current prices are never substituted for missing past tariffs. Negative and zero tariffs remain valid. No fictitious costs are bundled.

Home shows estimated base consumption next to its total. It requests up to eight days of Energy source statistics ending at the selected historical endpoint (or now in Live), uses the quietest full hour between 01:00 and 05:00 in each complete local night, and takes the median of up to seven nights. At least three complete nights are required. Missing source statistics or insufficient nights show a dash. This extra request is cached per endpoint hour/preferences and occurs only when Home details are needed.

Grid History shows recorded net costs first, followed by Import and Export detail surfaces with kWh and costs/compensation. There are no Grid share percentages or ratio bars. The label remains Net costs even for a negative amount. Live retains four label/value fields: import power, export power and both current prices, without bars or unavailable-price prose. Multiple currencies/connections stay separate; no combined tariff is invented. These costs are not a full utility bill.

Solar starts with generation and solar export. Self-sufficiency shows the solar share of home consumption, directly solar-supplied energy and the home total. Self-consumed generation shows the retained share, self-consumed solar and total generation. Both reuse the same 8px detail bar, background tint and home accent colour. Battery storage, missing measurements or an inconsistent balance suppress direct-solar attribution; zero totals have no percentage bar. Multiple solar sources remain individually listed; a single source has no redundant footer.

Detail requests are shared briefly across the popups/tabs and invalidated when the period, Energy preferences or connection changes. The card issues no device commands and never changes Energy preferences.

| Setting | Default | Meaning |
| --- | --- | --- |
| `title` | Localized Home consumption | Subtitle below the main value |
| `default_view` | `live` | `live` or `history` |
| `background` | `lanes` | Same eleven backgrounds as Car and Weather |
| `animate_background` | `true` | Background and live flow animation; respects reduced motion |
| `compact` | `false` | Smaller primary value, diagram and shared metric surfaces |
| `hours_to_show` | `24` | Default rolling period, 1–8784 hours |
| `solar_power_entity` | Automatic | Combined solar power override |
| `grid_power_entity` | Automatic | Signed grid power override |
| `grid_power_inverted` | `false` | Reverse the signed override |
| `grid_import_power_entity` | Automatic | Separate import power override |
| `grid_export_power_entity` | Automatic | Separate export power override |
| `home_power_entity` | Calculated | Direct total home power override |

The initial historical period is Today in the Home Assistant timezone. The period menu also offers rolling, calendar and custom ranges. The selected range stays intact when switching between Live and History. The card supports Sections resizing and Dutch/English labels. It reads existing data and does not modify the Energy configuration or operate devices.

## Consistent appearance and history synchronization

The Appearance section includes background_strength (0-100, default 100) and independent show_field_1, show_field_2 and show_field_3 switches for solar, import and export. Hidden lower fields leave no empty grid; one remaining field fills the row. Background defaults to lanes, matching Car and Weather. Explicit older selections remain unchanged. The title setting is labelled Primary value subtitle because it is visible beneath the main number.

Enable sync_timeframe and optionally hover_sync_group to share historical periods with the other Eleven graph cards. timeframe_sync_group is accepted as an alias. Only History subscribes and publishes; Live stays independent. Entering History adopts the group's latest selection. Leaving History, disabling sync or removing the card unsubscribes. Cosmetic config edits preserve loaded Recorder results and do not force a new request.

compact: true remains canonical; density: compact is also accepted, with explicit compact taking precedence.

Popup titles include Live or History without a badge. Popups use the existing view switch, period picker and period navigation in the card. There are no duplicate popup controls. These card controls keep the selected detail popup open and reload its title and readings for the selected view or period. The detail popup leaves the card toolbar reachable; opening the period menu preserves the details. Escape, the close button or a click outside the details and card controls closes the details. Calendar days follow the Home Assistant timezone, including DST. Grid History also shows net costs (recorded import costs minus export compensation), only combining complete amounts with matching currencies. Missing or incompatible costs remain unknown. The outer card follows the Home Assistant theme radius, matching Car (12 px fallback). Endpoint buttons, popup surfaces and controls use 8 px corners; distribution bars use the same slim 8 px capsule style, and the upper return route has 8 px bends.

Diagram endpoints reuse the lower metric surfaces with 8 px corners and a static glow in each icon colour. Detail popups prefer centred alignment below the clicked endpoint, clamped to the viewport and the reserved card toolbar. Euro readings place € before the amount (also for negative prices and /kWh rates); other currencies retain their currency code. Net costs have no separator above them and the last device row has no trailing rule. Four interactive glow treatments are compared in qa/icon-glow-examples.html.

Four larger, subtler variations of the broad icon glow are previewed in qa/icon-glow-refinements.html; these studies do not change the selected production icon treatment.

The selected icon glow is 4B (Diffuse glow): a wide, static radial tint in the icon colour, peaking at 13% opacity. Card and metric bases inherit HA theme backgrounds; the header uses the chosen colour preset (gold by default, adapted for light/dark mode), not a computed live-energy colour. background_strength scales the header decoration only. Five animated backdrop studies in qa/background-examples.html are previews, with pause, intensity and reduced-motion support.

Choose **Accent colour** under Appearance in the visual editor. Like Car, YAML uses `color: charging` (gold/default), `waiting` (blue), `done` (green), `planned` (purple) or `off` (grey). This sets the background colour; tabs and controls follow the Home Assistant theme, while solar/home/grid measurement colours and the HA theme base remain independent. Changing colour does not reload Recorder statistics. Unknown values fall back to gold. Six experimental backgrounds are compared in qa/background-experiments.html.

Energy also offers Holographic grid (`hologram`), Liquid ink (`ink`) and Relief map (`terrain`). All three are animated and use the chosen accent colour and background strength. Every background option is labelled Animated or Static in the editor (Dutch: Geanimeerd or Statisch). Animation can be disabled with `animate_background: false`; reduced-motion preferences and off-screen pausing apply. The experimental gallery uses the production implementation for these three options.

## Detail tabs and custom tabs

Choose **Tabs → Show details as → Tabs** in the visual editor, or set `detail_view: tabs`. The default remains `popup` for existing dashboards. Solar, Home and Grid tabs reuse the exact popup data and styling, including device bars, recorded grid costs and solar coverage. Diagram endpoints select their visible tab; hidden built-in tabs disable the corresponding endpoint action. Live/History and period navigation remain in the main card toolbar and preserve manual tab selection. Historical detail data loads for a visible built-in tab and shares the popup cache.

Like Car, `tabs` selects built-in tabs, `tabs: []` hides all built-in tabs, and `default_tab` selects the initially open visible tab. The built-in IDs are `sun`, `home` and `grid`. An unavailable default falls back to the first visible tab. One visible detail or custom tab shows its content without a redundant tab bar. The Prices tab is controlled separately with show_prices and retains its tab label. Compact mode retains the tabs, and long tab bars scroll horizontally.

The **Custom tabs** editor uses the same controls as Car: add, rename, show/hide, reorder or remove tabs and entity rows. Custom tabs also work alongside popup mode. Stable IDs survive renaming and reordering. Each entity supports an optional label, attribute, unit override, unit visibility and 0–2 decimals; values update with Home Assistant and open entity details on click. Custom entity readings always show their latest state, including when the built-in Energy view is historical. Missing values show a dash. These tabs do not send device commands.

```yaml
detail_view: tabs
tabs: [sun, home, grid]
default_tab: home
custom_tabs:
  - id: custom-climate
    title: Klimaat
    show: true
    entities:
      - entity: sensor.woonkamer_temperatuur
        name: Woonkamer
        decimals: 1
      - entity: sensor.warmtepomp
        name: Warmtepomp
```

Synthetic previews for both modes are in qa/tabs-examples.html.

Car, Energy and Weather share all eleven backgrounds and the exact same localized editor names, including Animated/Static labels: lanes, halo, ribbon, prism-glass, eclipse, aurora, clouds, isobars, hologram, ink and terrain. Existing YAML IDs stay unchanged. New patterns use the shared header renderer, intensity, animation toggle and reduced-motion behavior.

The Grid Import/Export detail surfaces use the same background tint as Home and the Solar ratio blocks. All information surfaces and diagram endpoints use the shared matte relief from shared/ui-surface.js, also used by Car, EVCC, Weather and Camera. The previous flat style and alternative depth treatments remain available in qa/surface-depth.html; option 4 is the selected production style. Cross-card checks are in shared/qa/surface-consistency.html.

Other uses the same home accent for its surface tint and proportion bar as individual devices (Overig in Dutch). Historical detail requests include battery charge/discharge statistics. Other costs stay unavailable when hourly measurements exceed the home total or the summed hourly remainder differs from the displayed period remainder by more than 0.01 kWh; this prevents inflated residual costs. Storage energy affects the home balance, while the tariff remains an estimate of consumption value rather than actual battery acquisition cost.
