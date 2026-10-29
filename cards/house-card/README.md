# Eleven House (beta)

A self-contained house-render card with the approved compact, warm presentation and an optional live, decorative weather canvas. This card **does not create a house model or render images**. Supply a compatible, transparent scene-linear image manifest (below). House chrome currently uses Dutch labels; theme colors follow Home Assistant.

## Install and migrate

Use the collection resource `eleven-cards.js`, **or** the standalone `cards/house-card/dist/eleven-house-card.js`, as a JavaScript module. Do not add both on purpose, although duplicate registration is guarded. The card picker offers **Eleven House (beta)** (`custom:eleven-house-card`). The installed presentation name `custom:eleven-house-styled-card` remains a supported alias with the same behavior and editor. No dashboard or resource migration is performed automatically. When replacing an older local styled module, remove its resource and reload the browser; duplicate-load guards deliberately let whichever version registered first win. The unrelated historical plain house implementation is not forcibly overwritten either.

```yaml
type: custom:eleven-house-card
title: Huis
manifest: /local/house/manifest.json
view: front
mode: auto
show_view_toggle: true
controls: false
weather_entity: weather.example
weather_overlay: true
animate_weather: true
show_presence: true
presence_entities:
  - person.example
show_thermostat: true
thermostat_entity: climate.example
```

All example entity IDs are synthetic. There are **no bundled house assets**, household configuration, or rendering service URLs. Put your own assets in an accessible location. Relative asset paths resolve against their manifest; cross-origin assets require the server's CORS permission. Never put credentials in URLs.

## Configuration

| Key | Default | Meaning |
| --- | --- | --- |
| `manifest` | required | Manifest JSON, or JSON pointer containing `manifest` |
| `title` | `Huis` | Title, empty string hides it |
| `view` | `cam-iso` | Manifest view ID; set this to your actual ID |
| `mode` | `auto` | `auto`, `light`, `dark`, `morning`, `afternoon`, `evening`, `night` |
| `show_view_toggle` | `false` | Show Voor/Achter when both house views declare front/rear camera locations |
| `view_catalog` | unset | Optional floor catalog URL; schema 1, `views` with `scope: floor`, `floor_id`, `id`, and `image` or `manifest`; sources must share the main source's origin |
| `controls` | `true` | Explicit light buttons. Set false for read-only house use |
| `names` | `{}` | Light display-name overrides, keyed by manifest light ID |
| `show_presence` / `presence_entities` | false / `[]` | People; home, away, friendly known-zone name and unavailable states are distinct |
| `show_alarm` / `alarm_entity` | false / unset | Alarm status and more-info |
| `show_thermostat` / `thermostat_entity` | false / unset | Current/target indoor temperature and more-info |
| `weather_entity` | unset | Existing HA weather entity for outdoor reading and weather layer |
| `background` | `halo` | Current shared Eleven header backgrounds; choices come from the shared UI module |
| `color` | `warm` | `warm`, `charging` (gold), `waiting` (blue), `done` (green), `planned` (purple), `off` (gray) |
| `background_strength` | `100` | 0–100 background strength, independent of weather |
| `compact` | `true` | Metric density, not a different layout |
| `animate_background` | `true` | Background animation, independent of weather |
| `image_scale` | `100` | 50–300 percent |
| `image_offset_x` / `image_offset_y` | `0` / `0` | -150–150 CSS pixels |
| `weather_overlay` | `true` | False disables weather and clears the overlay; does not hide outdoor temperature |
| `animate_weather` | `true` | False leaves a static weather image; reduced-motion also leaves a static image |
| `weather_intensity` | `65` | 0–100, rain/snow particle density and wind travel speed; zero clears all weather |
| `wind_threshold` | `10.8` | 1–100 **m/s**, threshold for strong-wind decoration |

The styled card always uses the compact welcome composition (`appearance: hero`, `welcome_layout: compact`), including a transparent header over the stage. `compact: false` adjusts density without switching back to the legacy layout. More-info opens the existing configured entity; no new entities are created.

### Live weather mapping

The existing entity's current `state` and `attributes.wind_speed` / `wind_speed_unit` are read, not forecast or external APIs. Missing entity, `unknown`, `unavailable`, unrecognized condition, missing speed/unit, negative/nonfinite/nonnumeric speed never imply wind from that speed. A known explicit `windy` condition can still show wind without a speed attribute.

| Current condition | Decoration |
| --- | --- |
| `rainy`, `pouring` | Rain; storm if converted wind meets threshold |
| `snowy`, `snowy-rainy` | Gentle snow |
| `windy`, `windy-variant` | Wind |
| `lightning-rainy` | Storm (rain + wind), no flashing lightning |
| `lightning` | Wind only, no invented rain or flashing |
| Other recognized HA conditions | No particles, unless known wind meets threshold |
| `hail`, `exceptional` | No fabricated hail or emergency visualization; known strong wind can still decorate |

Speed units: `m/s`, `km/h`, `mph`, `kn`, `ft/s`, `in/s`, `m/min`, and `Beaufort`. Beaufort uses HA's conversion `0.836 × B^1.5`. No unit is guessed from the user's locale. Wind reading is clamped to a visual speed scale ending at 25 m/s; explicit wind without a speed uses a moderate scale. **10.8 m/s, 25 m/s, 65%, condition grouping and particle density are product choices, not Home Assistant requirements or safety warnings.** Snow remains predominantly downward, with at most 2.5px sinusoidal sway and 0.4–1.2px/s constant horizontal drift per particle. It never uses elapsed-time-times-sine drift.

The layer starts at the stage/card top, including the transparent header area, and stops at the **top** of the caption/view buttons. It remains full-strength for 80% of that height and fades over the final 20%. It cannot intercept pointer or keyboard interaction. A distinct overlay canvas never writes to the house compositor. Wind intensity changes integrated wind-clock speed, not stroke opacity; changing readings does not jump the wind phase. ResizeObserver tracks stage/caption geometry; DPR is capped at 2. Animation stops when detached, hidden, offscreen, HA disconnected, disabled, or reduced-motion is requested; observers/listeners are cleaned up and recreated on reconnect. Decorative weather never calls a service. Holidays are deferred.

## Asset contract

The renderer loader and linear-light compositor are recovered from the approved installed card. A manifest uses `schema: 1`, `dtype: float32-le`, `channels: 3`, `width`, `height`, `release`, `lights`, `views`, and optional `files` metadata:

```json
{
  "schema": 1, "dtype": "float32-le", "channels": 3,
  "width": 64, "height": 48, "release": "example-v1",
  "lights": [{"id": "room", "name": "Example room", "entity": "light.example"}],
  "views": [{
    "id": "front", "camera_location": "front", "name": "Front",
    "alpha": "alpha.f32",
    "modes": {
      "light": {"base": "day.f32", "layers": ["room-day.f32"]},
      "dark": {"base": "night.f32", "layers": ["room-night.f32"]}
    }
  }]
}
```

Base and additive layers are scene-linear, premultiplied float32 little-endian RGB (width × height × 3 × 4 bytes); `alpha` is width × height floats in [0,1], and is required for this card. Each mode's layer order matches `lights`. Alpha is unpremultiplied once before the recovered display transform. `files` optionally maps each file path to `sha256`; optional `gzip: {file, sha256, bytes}` metadata is verified both before and after decompression. Only manifest-owned compression is used, not app-specific compression indexes. Assets share a bounded, checksum-keyed 96MiB cache; active card arrays are separate from this cache budget. Phases are lazy-loaded. A failed new camera load retains the previous exterior image and displays an error.

For a front/rear toggle add another view with `camera_location: rear`. Four-phase manifests use `morning`, `afternoon`, `evening`, `night`; `auto` follows read-only `sun.sun` elevation/rising information, not theme. With missing solar information four-phase sets use afternoon; older light/dark sets retain the original theme fallback. Explicit phase selection remains available. No render API is called.

Lighting bindings may use `entity` (`light`, `switch`, `input_boolean`) or authoritative `area_id`. Area membership uses HA frontend entity/device registries with read-only registry WS fallback. Empty/invalid area never falls back silently to another entity. Brightness affects composition; explicit light buttons retain existing turn_on/turn_off functionality. This means **the card is not wholly read-only unless `controls: false`**. Weather is always read-only.

## Provenance and verification

Recovered inputs (not committed as household evidence): `eleven-house-card.src.js` (base/editor), `house-car-style-preview.src.js` (presentation), the exact approved served module SHA-256 **f8162e371cf266c5d4a9b7e4fc24958f5a84a4d84fa5808fbc8e2364aa911e83** (pixel engine + installed presentation), and approved weather preview `build_weather_preview.py` / `weather-preview.html` (paint formulas and snow corrections). The imported pixel code omits the renderer-app-only compression-index hook. Default background is explicitly halo, matching the installed approved configuration rather than the preview helper's lanes fallback. The package uses **current repository shared UI modules**, never embedded historical vendor copies. No globals expose the renderer or preview helpers.

Authoritative API references, consulted during implementation:
- [HA weather entity properties and conditions](https://developers.home-assistant.io/docs/core/entity/weather/)
- [HA speed units](https://github.com/home-assistant/core/blob/dev/homeassistant/const.py), `UnitOfSpeed`
- [HA speed conversions](https://github.com/home-assistant/core/blob/dev/homeassistant/util/unit_conversion.py), `SpeedConverter`
- Repository `shared/ui-metric.js`, `shared/header-backgrounds.js`, `shared/header-atmosphere.js`; standalone isolation/collection pattern from `cards/car-card/scripts/build.mjs`.

Run the full repository checks:

```sh
npm test
npm run check
python tests/browser-smoke.py
python cards/house-card/tests/browser-house.py
```

Use your Playwright Python environment and installed Chromium. If needed, set `BROWSER_EXECUTABLE=/path/to/chrome`; no browser binary is committed. Browser-house generates synthetic float buffers/manifests in memory and serves this repository on an ephemeral loopback port. It checks both cameras, four phases, light/dark, real state mapping, compositor invariance, editor construction, aliases, duplicate loads, 320px layout, DPR cap, reduced motion, offscreen/disconnect/reconnect and explicit-only service actions. Node tests cover checksums/compression/cache/lazy loading, solar selection, binding semantics, status escaping, actual paint commands, long-session snow and integrated wind clocks. This is **offline component QA, not authenticated native Lovelace or live HA validation**. Actual household assets and native HA editor/integration still require separate authorized verification.
