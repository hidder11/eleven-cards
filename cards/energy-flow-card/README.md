# Eleven Energy Flow (beta)

Energy distribution in the same style as Eleven Car and Weather. Reads the Home Assistant Energy dashboard configuration automatically; no energy-meter entities need to be copied into the card.

```yaml
type: custom:eleven-energy-flow-card
```

For the local test collection use `custom:eleven-energy-flow-card-test` and load only the collection test resource.

The card has three connected circular nodes (solar, grid and home), with moving round dots for measured live flows. The large home-consumption value uses the shared primary-value component. Solar generation, grid import and grid export use the shared metric surfaces, including compact density. In Live, a **History** button opens historical data. In History, an adjacent **Live** button returns to current power. The switch belongs to the same group as the period picker and navigation. The shared period popup stays unchanged, with no view controls inside it. No content tabs or extra consumer are shown.

## Data

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

Solar-to-home and solar-to-grid paths are only attributed when their source can be established. With a battery, those paths stay inactive while the measured grid totals remain visible. Historical diagrams are static; their grid label includes import and export separately.

## Configuration

| Setting | Default | Meaning |
| --- | --- | --- |
| `title` | Localized Home consumption | Subtitle below the main value |
| `default_view` | `live` | `live` or `history` |
| `background` | `ribbon` | Same eight backgrounds as Car and Weather |
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
