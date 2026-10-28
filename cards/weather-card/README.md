# Eleven Weather (beta)

A compact Home Assistant weather card in the same style as Eleven EVCC: large temperature, state-colored header and illustration, current condition, wind, humidity and a short forecast. Uses your existing weather entity; no external assets or weather service credentials are needed by the card.

```yaml
type: custom:eleven-weather-card
entity: weather.home
title: Het weer
background: lanes
icon_style: classic
icon_scale: 100
icon_offset_x: 0
icon_offset_y: 0
animate_icons: true
animate_background: true
compact: false
tabs: [hourly, daily]
forecast_fields: [condition, temperature, templow, precipitation_probability]
metric_primary: wind_speed
metric_secondary: humidity
metric_status: condition
forecast_type: auto
forecast_count: 6
show_forecast: true
```

The visual editor follows the Car card's expandable sections: **General**, **Weather icon**, **Appearance**, **Wide data field**, **Left data field**, **Right data field**, **Forecast**, **Hourly forecast** and **Daily forecast**. Conditional settings disappear when their field or forecast is hidden; their saved values remain available when re-enabled. Labels and helpers follow the Home Assistant language. Editing labels preserves focus, cursor position and spaces.

Each field can show wind speed, gusts, wind direction, humidity, pressure, feels-like temperature, dew point, visibility, cloud coverage or UV index, or be hidden (`none`). Values come from the selected weather entity; unsupported attributes show a dash. Select **Custom entity** (`custom`) to use a separate sensor or entity. Labels, units, visibility of units and numeric precision can be configured for each field. Source units are retained unless overridden. Attributes have no assumed unit. Missing data shows a dash; zero remains visible. Clicking a custom value opens that entity's details.

All three fields are independent: `metric_status` is the wide field, `metric_primary` is left and `metric_secondary` is right. Choose **Hide** (`none`) for any of them, including all three. Remaining fields fill the available width; hidden rows leave no extra space. The wide field defaults to `condition` (the original weather status), and supports all the same weather metrics and custom entities as the lower fields. Use the same `_entity`, `_label`, `_attribute`, `_unit`, `_show_unit` and `_decimals` options for each field. The wide field also accepts `metric_status_icon` (a Home Assistant icon, such as `mdi:thermometer`); without it, the current weather illustration is used.

```yaml
metric_primary: custom
metric_primary_entity: sensor.garden_temperature
metric_primary_label: Tuin
metric_primary_decimals: 1
metric_primary_show_unit: true
# Optional: metric_primary_attribute, metric_primary_unit
metric_secondary: humidity
metric_secondary_label: Luchtvochtigheid
```

Hourly and daily forecasts have separate tabs using the shared Eleven tab component, including arrow-key navigation. With only one forecast selected, the forecast is shown directly without a tab bar in either density. `forecast_type` chooses the initial tab; changing tabs subscribes to that forecast type and stops the previous subscription. An unavailable type shows a retry message. Use `tabs: [hourly, daily]`, `[hourly]`, `[daily]` or `[]` to select the visible tabs. This choice applies to both normal and compact layouts. An empty list removes the forecast and its subscription. A default outside the visible tabs falls back to an available tab. Sensor updates preserve manual tab selection.

Under **Hourly forecast** and **Daily forecast**, independently select the weather icon, temperature, daily low, precipitation probability, precipitation amount, wind speed, gusts, humidity and UV index. Use the **Order · Hourly/Daily** sections below to move selected fields up or down. Precision is configurable per selected numeric field, from 0–3 decimal places (empty = automatic maximum precision). YAML uses `forecast_hourly_fields` and `forecast_daily_fields` with the corresponding keys `condition`, `temperature`, `templow`, `precipitation_probability`, `precipitation`, `wind_speed`, `wind_gust_speed`, `humidity`, `uv_index`. Omitted lists inherit the legacy shared `forecast_fields`; explicit `[]` shows time/day only. Daily lows are omitted from hourly rows. Hidden fields leave no reserved rows. Values and units come from the integration; unsupported selected values show a dash.

```yaml
forecast_hourly_fields: [condition, temperature, precipitation_probability]
forecast_daily_fields: [condition, temperature, templow, wind_speed]
forecast_hourly_temperature_decimals: 1
forecast_daily_temperature_decimals: 0
forecast_daily_wind_speed_decimals: 1
```

Telemetry updates retain existing DOM nodes, illustrations, focus and forecast scroll position. Appearance and field changes keep the subscription and manually selected forecast tab; changing the source or default forecast type resets the selection. Expired hours are checked every minute even without new telemetry. Daily forecasts use the calendar day in Home Assistant's timezone, so today's midnight record remains visible throughout the day, including daylight-saving transitions. Removing the card closes the subscription and cleans up its timer and visibility observers.

All backgrounds share the same header dimensions for a given icon style and density. The background covers the header and metrics, with a shared gradual 200 px fade that ends before forecast content, including compact layouts. The [Cloud Layers comparison](qa/cloud-layers.html) shows the previous movement beside the more pronounced cloud drift and the compact version, using synthetic forecasts.

Existing configurations without `tabs` retain their previous behavior: `show_forecast` controls the normal forecast; compact mode hides tabs and uses `compact_forecast: hourly`, `daily` or `none`. The editor displays these existing choices. Once you choose an explicit `tabs` list, that list controls forecasts in both densities and the legacy values remain stored.

`auto` prefers hourly forecasts when the entity advertises support, otherwise daily. You can explicitly choose `hourly` or `daily`. The entity must support the selected forecast type. Forecast count accepts 3–8. Missing values appear as a dash; unavailable forecasts show a message and retry button. Clicking the current condition opens Home Assistant entity details.

The card follows Home Assistant's Dutch/English language, theme, entity units and configured timezone. Forecasts subscribe through `weather/subscribe_forecast`; changing entities or removing the card closes the previous subscription. Forecast temperatures and precipitation probabilities come from the integration. No inferred rain amounts or invented values are shown.

For a standalone test, copy [eleven-weather-card-test.js](dist/eleven-weather-card-test.js) to `/config/www/`, add `/local/eleven-weather-card-test.js?v=weather-16` as a JavaScript module and use `type: custom:eleven-weather-card-test`. Keep your existing Eleven collection loaded. Use this standalone test resource or the updated test collection, not both.

The [preview](qa/index.html) uses explicitly synthetic data and includes multiple weather states, theme and narrow-width controls.

Choose **Appearance → Icon style**: Classic (`classic`, the default), Liquid glass (`glass`) or Neon (`neon`). The chosen family applies to the header, current condition and forecasts. Both new families cover all 15 [Home Assistant weather conditions](https://contributors.home-assistant.io/core/entities/weather/#conditions), including distinct icons for rain/downpour, snow/sleet/hail, lightning/lightning with rain, and wind/wind with clouds. Exceptional weather uses a warning icon; missing or unrecognized conditions use a neutral question icon. Animation follows `animate_icons`, connection state and reduced-motion preferences.

The [icon examples](qa/icon-concepts.html) compare Liquid glass, Plasma, Neon and Weather globe. Liquid glass and Neon use the production renderer; Plasma and Weather globe remain proposals. Compare five weather states in both the header and small icons, pause motion, switch themes and select a background.

The [animated header examples](qa/header-concepts.html) compare Solar theater, Rain on glass, Aurora sky, Cloud layers and Atmospheric flow. Examples 3–5 use the production backgrounds; Solar theater and Rain on glass remain preview-only proposals. Use the controls to compare weather states, pause motion, switch themes or hide all three fields.

The [alignment preview](qa/alignment.html) compares standard and compact Weather and EVCC cards with the production styles. Header typography and offsets, outer padding, status tiles, metric labels/values, column gaps and tab spacing follow the corresponding EVCC components.

Choose the same header backgrounds as EVCC: Energy Lanes (`lanes`, default), Halo (`halo`), Silk Flow (`ribbon`), Prism Glass (`prism-glass`) or Eclipse (`eclipse`). Weather state still determines the color. Layered vector icons animate according to the condition in the header, status and forecast. Configure `animate_icons` and `animate_background` independently. For existing configurations without `animate_background`, background motion follows the old `animate_icons` setting. Reduced-motion preferences, offline state and unavailable weather also disable animations. Motion pauses while the card is outside the viewport or the browser tab is hidden, resuming from the same animation position. The forecast clock pauses in hidden browser tabs and refreshes on return. No external icon assets are loaded.

Three additional animated backgrounds are available under **Appearance → Background**: **Aurora sky** (`aurora`) adds drifting light ribbons and stars; **Cloud layers** (`clouds`) adds moving cloud banks at different depths; **Atmospheric flow** (`isobars`) adds contour lines with traveling light fronts. These use the same weather-dependent colors, header dimensions and shared fade as the original backgrounds. `animate_background: false` stops background motion independently of the icons. Existing background choices remain unchanged.

## Shared configuration consistency

The editor labels title as **Card name (accessibility)**; it does not add a visible header. All three data fields have an optional icon picker. Single visible tabs show their content without a redundant tab button, preserving the accessible section name. Multi-tab keyboard navigation is unchanged.

Use background_strength: 0-100 (default 100) to adjust the shared header backdrop. A value of 0 hides the backdrop without dimming the content. The default background is lanes. The visual editor offers the same slider in Appearance. Existing explicit background selections remain valid.

compact: true is the standard setting; density: compact is accepted as an alias. Explicit compact takes precedence. Single-source information surfaces open their entity from the whole surface; multiple-source readings retain separate controls.

The **Weather icon** section positions the large header illustration with horizontal and vertical sliders (-150 to 150 px) and a size slider (50-300%). Defaults are 0 px offsets and 100% size. A horizontal offset of 0 centers the illustration in the full card; horizontal offsets are measured from that center. Negative offsets move left/up; positive offsets move right/down. Scaling and moving keep the header height fixed and leave condition/forecast icons unchanged. Works with classic, glass and neon icons, including compact layout.

Car, Energy and Weather share all eleven backgrounds and the exact same localized editor names, including Animated/Static labels: lanes, halo, ribbon, prism-glass, eclipse, aurora, clouds, isobars, hologram, ink and terrain. Existing YAML IDs stay unchanged. New patterns use the shared header renderer, intensity, animation toggle and reduced-motion behavior.

Information surfaces use the shared matte relief from shared/ui-surface.js, matching Energy, Car (including EVCC), Weather and Camera. Cross-card computed-style and narrow-layout checks are available in shared/qa/surface-consistency.html.
