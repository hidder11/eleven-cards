# Eleven Media Player (beta)

A native Home Assistant media player card focused on Studio and Horizontal, with Dutch/English text and a visual editor. Uses the existing Eleven theme colours, card radius, buttons and matte surfaces. No runtime dependencies. Load the collection or standalone module; select **Eleven Media Player (beta)** in the card picker.

```yaml
type: custom:eleven-media-player-card
entity: media_player.woonkamer
layout: studio
radio_mode: true
```

| Setting | Default | Meaning |
| --- | --- | --- |
| `entity` | Empty | One `media_player` entity; empty shows setup guidance |
| `title` | Entity friendly name | Optional device/card title |
| `layout` | `studio` | `classic`, `poster`, `horizontal`, `studio`, `minimal` |
| `stations` | `[]` | Radio favourites: `name`, `media_content_id`, optional `media_content_type` (default `music`) |
| `radio_mode` | `false` | Radio channel metadata; hides seeking and track navigation, with stop when pause is unsupported |
| `show_artwork` | `true` | Album/episode image; minimal always omits artwork |
| `show_progress` | `true` | Position/duration and seek slider if supported |
| `show_volume` | `true` | Supported volume and mute controls |
| `show_source` | `true` | Source selector when supported and sources are available |
| `show_power` | `true` | Power button when the appropriate on/off action is supported |
| `card_background` | Off | Shared main background component: enabled, variant, colour source, custom colours, transparency, animation, whole-card/header coverage and height |
| `background` | `none` | Retained legacy background style; explicit legacy YAML remains supported |
| `background_strength` | `100` | Decorative backdrop opacity, 0–100% |
| `animate_background` | `true` | Shared animation; respects reduced motion, visibility and connection |
| `compact` | `false` | Reduce spacing and classic artwork size; preserve shared outer padding |

Studio is the default for new cards; explicitly configured layouts remain supported. Titles share the Calendar and Camera Viewer typography, with the common card padding and themed control surfaces. Backgrounds use the shared component from main; transport uses individual surface buttons like the EVCC mode controls, with mute and power immediately beside playback. Volume and seeking place their label above a row with the value first and the slider alongside it, like Solar preference. Both use the same `uiSlider`, `syncUISlider` and `uiBarStyles` component as EVCC on main, including its 12px track, round thumb, theme accent and material well. The volume percentage unit uses smaller secondary text. Secondary metadata uses the shared 11px text size. The layouts share the same functionality. Classic pairs square artwork with metadata. Poster gives the cover a wide stage with a readable title overlay. Horizontal puts small artwork and transport in one row. Studio centres square artwork with rounded corners (8px by default) and the same material well theme setting as graph plots; its inset shadow overlays the image. The header has no status badge. Station, programme, transport, labeled volume, favourites and source selector follow. Empty/unavailable states use a small fallback and suppress stale programme text. Sections height follows content; masonry sizing follows rendered height. Compact reduces artwork and spacing while retaining shared outer padding. Minimal prioritises text and transport, without artwork. Compare Studio (option 4) and Horizontal (option 3) in the [interactive examples](qa/index.html), with fictional metadata and a locally drawn cover. Commands in the fixture update simulated state only.

```yaml
# 1. Classic
type: custom:eleven-media-player-card
entity: media_player.woonkamer
layout: classic
```
```yaml
# 2. Poster
type: custom:eleven-media-player-card
entity: media_player.woonkamer
layout: poster
```
```yaml
# 3. Horizontal
type: custom:eleven-media-player-card
entity: media_player.keuken
layout: horizontal
compact: true
```
```yaml
# 4. Studio
type: custom:eleven-media-player-card
entity: media_player.werkkamer
layout: studio
radio_mode: true
```
```yaml
# 5. Minimal
type: custom:eleven-media-player-card
entity: media_player.slaapkamer
layout: minimal
show_source: false
```

Replace example entities with your own. Playback, seek, mute, volume, source and power use the entity's advertised `supported_features` and registered Home Assistant services. Unsupported controls are hidden. Unknown, missing, unavailable and disconnected states remain explicit and block commands. The off state offers only supported power-on. Service errors show a recoverable message; no command is retried automatically. Opening the card or changing its configuration sends no commands. Title/device details open Home Assistant's native entity dialog.

Radio favourites call `media_player.play_media` only after a click and when the entity advertises support. The selected favourite follows the reported `media_content_id`; selecting an input source does not select a station. After stopping a known favourite, Play restarts that media ID. A switched-off or unavailable player blocks station commands; power-on remains explicit. Blank editor drafts are retained but cannot start playback.

Example favourite (replace the example URL with your actual stream URL or a media ID from Home Assistant):

```yaml
type: custom:eleven-media-player-card
entity: media_player.woonkamer
layout: studio
radio_mode: true
stations:
  - name: Mijn radio
    media_content_id: https://example.invalid/radio.mp3
    media_content_type: music
```

The visual editor supports adding, editing, reordering and removing favourites. A shared Card background section supplies the same settings as main; changing other fields retains those settings. New cards have decoration off until enabled. Existing explicit legacy background settings are retained. The examples use fictional stations and media IDs and never send commands to real devices.

The card controls your existing integration: it does not stream audio/video in the browser, browse media, build playlists or group speakers. Integration support and permissions determine available actions. Idle/stopped media hides stale progress. Unknown positions remain unavailable in both visible text and screen-reader labels. Position advances locally only from a valid Home Assistant timestamp while playing; timers stop while hidden/off-screen or disconnected. The card preserves focused sliders/selectors on updates and only sends slider commands on change, not on every input event. Images use supplied HTTP(S) or relative URLs, with a fallback for missing/failed artwork. Sensor/user text is escaped.

Run `node cards/media-player-card/scripts/build.mjs`, `node scripts/build.mjs`, and `node scripts/build-test.mjs` to rebuild. The isolated test type is `custom:eleven-media-player-card-test`. Unit tests are in `tests/`; rendered checks use `node tests/browser-media-player.mjs` with Node.js 22+ and Chrome (optionally `CHROME_PATH`), without screenshots. Fixture verification does not verify live integrations, speakers or TV commands.

API references: [Home Assistant media player](https://www.home-assistant.io/integrations/media_player/), [Home Assistant feature flags](https://github.com/home-assistant/core/blob/dev/homeassistant/components/media_player/const.py).
