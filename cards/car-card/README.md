# Eleven Car (beta)

A single vehicle card with optional EVCC integration. The vehicle image, header, five backgrounds and soft fade are shared between both modes. The standalone module includes the EVCC engine; no other card resource is needed.

The visual editor starts with **Use EVCC integration**. When off, it offers a percentage and three custom readings. When on, it offers the loadpoint sensor, entity overrides and visible charging tabs. Settings for the other mode remain stored when you switch.

The editor uses collapsible sections consistent with the other Eleven cards: General, Vehicle image, Appearance, then Percentage and the three custom fields, or EVCC integration and Tabs. Optional EVCC overrides are grouped by vehicle/status, live data, controls, session and details. Empty overrides use automatic detection; helper text lists the detected entity when available. Only settings relevant to the selected mode are shown.

Use the collection bundle or the standalone [module](dist/eleven-car-card.js). The visual editor supports all options below.

```yaml
type: custom:eleven-car-card
evcc_enabled: false
title: Mijn auto
image_entity: image.mijn_auto
image_scale: 100
image_offset_y: 0
background: lanes
color: charging
percentage_entity: sensor.auto_brandstofniveau
field_1_entity: sensor.auto_status
field_1_label: Status
field_1_icon: mdi:car
field_2_entity: sensor.auto_actieradius
field_2_label: Actieradius
field_3_entity: sensor.auto_kilometerstand
field_3_label: Kilometerstand
```

For EVCC charging:

```yaml
type: custom:eleven-car-card
title: Mijn auto
evcc_enabled: true
entity: sensor.evcc_driveway_charge_power
image_entity: image.mijn_auto
compact: true
tabs:
  - controls
  - session
  - technical
```

`tabs` selects **Controls**, **Session** and **Details**, independently of `compact`. Omit it to show all available tabs, or use `tabs: []` for none. Panels without any source entities are omitted. Solar preference remains available in compact Controls when the EVCC mode is smart. When omitted, the legacy `show_controls`, `show_session` and `show_details` flags are respected. Without EVCC there are no charging tabs.

`default_tab: session` opens the session tab initially (other choices: `controls`, `technical`). The editor only offers visible tabs. If the configured default is hidden or has no data, the card falls back to an available tab. Sensor updates preserve the tab chosen manually.

Automatic EVCC discovery waits for the entity registry and keeps matches within the selected sensor's integration installation. Unresolved or ambiguous fields remain hidden; explicit entity overrides take precedence. Conventional entity names are used only when registry data is unavailable. The configured default tab is retained during discovery unless you choose another tab. Provisional session windows based on the live connection timestamp retry Recorder discovery until its history catches up.

The standalone EVCC card has been removed. Migrate old `custom:eleven-evcc-card` YAML to `custom:eleven-car-card`, add `evcc_enabled: true` and keep its entity mappings and other options. EVCC integration is now provided only through Car. Remove any standalone EVCC resource from the dashboard resources and load the current collection or Car module. Its internal engine, synthetic QA fixtures and regression tests live in this card's src/evcc, qa/evcc and tests/evcc directories.

Choose any Home Assistant entity for each field. Labels default to its friendly name, values retain units, numeric values use the frontend language, and clicking a value opens entity details. Missing or unavailable entities show a dash; zero remains visible.

For custom fields, replace `2` with `1`, `2` or `3` in these options:

| Option | Default | Purpose |
| --- | --- | --- |
| `show_field_2` | `true` | Show or hide the panel. A single remaining lower panel fills the width. |
| `field_2_attribute` | empty | Read an exact attribute name instead of the entity state. |
| `field_2_unit` | empty | Override the unit. Empty uses the sensor unit; attributes have no assumed unit. |
| `field_2_show_unit` | `true` | Show or hide the unit. |
| `field_2_decimals` | empty | Automatic formatting up to 2 decimals, or a fixed number from 0 to 6. |

For example, `field_2_attribute: fuel_range`, `field_2_unit: km` and `field_2_decimals: 0` display a range attribute without decimals. Missing or structured attribute values show a dash. The settings remain stored when the panel is hidden.

For a fixed percentage, omit `percentage_entity` and set `percentage: 65`. This only changes the card display; it does not write to a sensor. A configured percentage entity takes precedence, including when unavailable. Values are clamped to 0–100.

Non-EVCC range appears under the title, in the same position as EVCC range. The **Range** editor section offers hide (`range_source: none`, default), entity (`entity`) or estimate (`calculated`). With EVCC enabled, the loadpoint's own range source is used instead; the custom settings remain stored.

For a remaining-range sensor:

```yaml
range_source: entity
range_entity: sensor.auto_actieradius
```

The sensor's distance unit is retained, with km as fallback when there is no source unit. Clicking the reading opens that entity's details. An unavailable, invalid or negative reading shows a dash and does not silently fall back to a calculation.

For an estimate from the current percentage:

```yaml
range_source: calculated
range_full: 800
range_unit: km
```

`range_full` is the total range at 100%, in `km` (default) or `mi`. Estimated range is `range_full × percentage / 100`; 800 km at 100% with 50% remaining gives 400 km. The card labels it **estimated range**, rounds to whole distance units and updates when the percentage changes. Missing percentage or total range shows a dash. Zero percent correctly gives zero range. Estimation uses the same percentage entity or fixed value as the large header percentage.

`background`: `lanes` (default), `halo`, `ribbon`, `prism-glass`, `eclipse`, `aurora`, `clouds`, `isobars`. The three animated designs match the Weather card: Aurora sky, Cloud layers and Atmospheric flow. They preserve the fixed image/header height in both densities and work with or without EVCC. Colors follow the charging state with EVCC and your selected accent otherwise. Set `animate_background: false` to stop background motion; offline state and reduced-motion preferences also stop it. Disconnected or unknown EVCC states show a static, muted atmosphere.

Without EVCC, `color` selects `charging` (gold, default), `waiting` (blue), `done` (green), `planned` (purple) or `off` (gray). These are visual presets, not inferred states. With EVCC the colors and battery animation follow the actual charging state.

`image_scale`: 50–300%; `image_offset_y`: −150 to 150 px (negative moves up). Scaling does not change the header height. `compact: true` reduces the image area and spacing. Sections height is resizable.

`image_offset_x`: −150 to 150 px (negative moves left, positive moves right, zero is centered). Horizontal and vertical offsets work in either mode and do not resize the header.

## Custom tabs

Use **Custom tabs** in the visual editor to add, name, hide, order and remove your own tabs. Each tab has an ordered list of entities with optional labels, attributes, units and decimal precision. These tabs work with and without EVCC and remain visible in compact mode. With EVCC, they share one tab bar with the selected charging tabs. The `tabs` setting controls the built-in charging tabs; each custom tab has its own `show` switch. The default-tab selector includes visible custom tabs.

```yaml
custom_tabs:
  - id: custom-trip
    title: Ritgegevens
    show: true
    entities:
      - entity: sensor.auto_kilometerstand
        name: Kilometerstand
        decimals: 0
      - entity: sensor.auto_verbruik
        name: Gemiddeld verbruik
        decimals: 1
default_tab: custom-trip
```

Tab IDs are assigned automatically in the editor and remain stable when tabs are renamed or reordered. Clicking a reading opens entity details. Missing values show a dash; live sensor updates preserve tab selection and keyboard focus. Custom tabs use the same label/value typography as the EVCC session tab. Long tab bars scroll horizontally on narrow cards.

## Percentage bar and charging animation

The Appearance section offers four bar styles:

| `battery_style` | Appearance |
| --- | --- |
| `classic` | Classic 12 px capsule. |
| `slim` | 8 px capsule with the same charging sweep. |
| `soft` | Default: 8 px, softened color and a dimmer sweep. |
| `line` | Fine 4 px line with a small light accent. |

Compare the actual cards in [bar-variants.html](qa/bar-variants.html), with working synthetic power, speed and maximum-power controls.

With EVCC, `animation_speed` is a speed multiplier from 0.25 to 3 (default 1). `animation_max_kw` selects the power at which motion reaches its maximum speed (default 11 kW). At the default speed, one sweep ranges from 12 seconds near zero power to 2 seconds at maximum power. Higher speed multipliers shorten that duration. Power above the selected maximum is capped for animation only. Zero or unknown power pauses the sweep. These settings do not change EVCC charge limits. Reduced-motion preferences continue to disable the animation. Non-EVCC percentage bars remain static.

The shared local test collection includes `custom:eleven-car-card-test`. Do not load the standalone test module alongside that collection.

Animations pause while the card is outside the viewport or its browser tab is hidden. Visibility observers are cleaned up when the card is removed.

## Shared configuration consistency

The editor labels title as **Card name (accessibility)**; it does not add a visible header. All three data fields have an optional icon picker. Single visible tabs show their content without a redundant tab button, preserving the accessible section name. Multi-tab keyboard navigation is unchanged.

Use background_strength: 0-100 (default 100) to adjust the shared header backdrop. A value of 0 hides the backdrop without dimming the content. The default background is lanes. The visual editor offers the same slider in Appearance. Existing explicit background selections remain valid.

compact: true is the standard setting; density: compact is accepted as an alias. Explicit compact takes precedence. Single-source information surfaces open their entity from the whole surface; multiple-source readings retain separate controls.

A horizontal image offset of 0 centers the vehicle in the full card, in both custom and EVCC mode and both densities. Horizontal offsets are measured from this center, independently of image scaling.
