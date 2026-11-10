# Eleven Camera (beta)

Home Assistant camera feeds with a security overview, Grid and Focus layouts, detection activity, managed snapshots and alarm/door/window status. The UI follows Eleven Cards v0.3.3: the active Home Assistant theme owns surfaces, shadows and corner radii; the optional Eleven Material theme adds inset wells and raised controls. Tabs, focus indicators and selected actions use the theme accent. Functional alarm/detection colours retain their meaning. No runtime dependencies.

The compact camera footer, edge-to-edge feed and camera popup with thumbnail selection remain available. Camera tiles use the theme's inset well, drawn above the image without adding padding or blocking controls. Alarm modes act immediately; disarming can optionally require a code. If the integration requires a code to arm, the mode buttons open native Home Assistant alarm controls instead of sending an incomplete command. An explanation and an Open alarm controls button are shown in that case. New configurations have no decorative background. The visual editor and preview offer the nine shared backgrounds: Aurora sky, Silk Flow, Atmospheric flow, Ink bloom, Holographic grid, Satin waves, Isometric depth, Comet trails and Lenticular glow, with transparency, motion, coverage and custom colours through `card_background`. Older background variants remain supported for existing YAML; the editor retains a configured older variant as an extra choice.

```yaml
card_background:
  enabled: true
  variant: ink-bloom
  colorMode: dynamic # Card colour follows the alarm status
  coverage: header
  height: 220
  transparency: 65
  animated: true
```

The optional theme is provided in [eleven_material.yaml](../../themes/eleven_material.yaml). A synthetic preview at [security.html](qa/security.html) compares Home Assistant and Eleven Material, light/dark appearance, custom accents and narrow layouts. Run `node tests/browser-camera.mjs` from the repository root with Node.js 22+ and Chrome for the existing interaction checks and the rendered theme matrix; it takes no screenshots and uses no live Home Assistant data.

[security-editor-example.html](qa/security-editor-example.html) is an isolated interactive editor proposal: five collapsible sections with live summaries, camera settings beside their detectors, contact names beside their entities, and the existing shared background settings inside Appearance. It uses native demo inputs, synthetic entities and the production card for its preview; it does not replace the production Home Assistant editor or persist configuration.

When disarming requires a numeric PIN, a themed keypad appears below the masked code field, with digits 0–9, Clear and Backspace. Keyboard entry remains available and leading zeroes are preserved. The separate Disarm button submits the code; digit presses never send an alarm command. Integrations requiring a text code retain their text input. No keypad is shown when a code is not required.

Activity is grouped by day in theme-owned inset wells. Fixed time and icon columns align with the first line of each event; long custom names wrap without moving neighbouring columns or breaking the timeline. Live sensor events appear immediately. Recorder history refreshes every 30 seconds while Activity is visible, online and no camera popup is open; hidden/offscreen cards pause polling and catch up when visible again. Requests never overlap, automatic retries preserve observed events, and background updates omit loading text when events are already visible. The redundant period label and manual Refresh button are omitted. Clicking an event still opens its camera popup or native entity details directly.

Repeated events from the same sensor, camera, type and state within one clock minute share a row with a repetition count. The row uses the most recent event and keeps its direct popup action. Opening and closing remain separate, as do motion and person detections. `activity_page_size` applies after grouping; repeated detections share one row. Activity retains older events for pagination instead of discarding everything beyond the first page. Door and window events use the configured `door_sensors` and `window_sensors`; the default `session` source starts observing when the card opens. Select `activity_source: history` for earlier events, provided those sensors are included in Home Assistant Recorder.

Activity pagination uses Previous / page of pages / Next below the timeline and hides the controls for a single page. Default page size is 10 (1 to 50). While browsing older pages, incoming events do not shift the rows; New activity returns to the live first page. History pages cover the configured lookback and expire with it; session pages cover observed events since opening the card. Changing sources, history duration or page size resets to page one. Existing `activity_limit` YAML is accepted as a fallback for `activity_page_size`; the new setting wins when both are present, and the editor writes only the new key.

```yaml
activity_source: history
activity_hours: 24
activity_page_size: 10
```

[security-activity-example.html](qa/security-activity-example.html) is an isolated comparison proposing grouped person/motion detections and contact opening durations. Those grouping changes are not part of the production card.

```yaml
type: custom:eleven-camera-card
title: Camera’s
cameras:
  - camera.voordeur
  - camera.tuin
layout: grid
columns: auto
camera_view: live
```

Load the collection module or the standalone dist/eleven-camera-card.js, then choose **Eleven Camera (beta)** in the card picker. The visual editor offers five consistent collapsible sections: Cameras, Alarm, Doors and windows, Activity, and Appearance. Per-camera image/privacy settings and door/window name editors are nested within their respective sections; the shared background editor is nested under Appearance. An empty camera list shows setup guidance. `entity: camera.voordeur` is also accepted for a single feed. Camera IDs must be unique and belong to the camera domain.

For custom camera names and one feed at a time:

```yaml
type: custom:eleven-camera-card
layout: focus
default_camera: camera.tuin
cameras:
  - entity: camera.voordeur
    name: Voordeur
  - entity: camera.tuin
    name: Achtertuin
```

| Setting | Default | Meaning |
| --- | --- | --- |
| `cameras` | `[]` | Camera IDs or objects with per-camera settings, in display order |
| `title` | Cameras, localized | Accessible card name; the visible header shows alarm status or available camera count |
| `layout` | `grid` | `grid` (all feeds) or `focus` (one feed and a camera picker); older YAML layouts remain supported |
| `default_camera` | First visible camera | Initial selection; manual selection survives sensor and cosmetic updates |
| `columns` | `auto` | Responsive automatic columns or 1, 2, 3; narrow cards use one column |
| `camera_view` | `live` | Native HA live view, or `auto` for snapshots |
| `aspect_ratio` | `16:9` | Also `4:3`, `1:1`, `21:9` or portrait `9:16` |
| `fit_mode` | `cover` | Fill/crop, or `contain` for the complete image |
| `show_names` | `true` | Show each camera's name over the top-left of the feed |
| `show_status` | `true` | Camera availability/streaming/recording and configured detection badges |
| `show_last_detection` | `true` | Last detection timestamp for cameras with detector mappings |
| `show_navigation` | `true` | Previous/next buttons and camera position in tabs/focus |
| `auto_cycle` | `false` | Automatically switch cameras in tabs/focus; unavailable, private and unknown-privacy cameras are skipped |
| `cycle_interval` | `10` | Seconds between switches, 5–3600 |
| `compact` | `false` | Reduced header and grid spacing |
| `color` | `charging` | Same gold/blue/green/purple/grey presets as Car |
| `card_background` | disabled | Shared v0.3.3 background settings; the visual editor exposes all released designs |
| `background` | Legacy only | Existing eleven-background YAML remains supported |
| `background_strength` | `100` | Decorative header intensity, 0–100 |
| `animate_background` | `true` | Header motion; respects reduced motion and off-screen pausing |

The native Home Assistant `picture-entity` card handles normal live playback, native snapshots and media controls. Live requires streaming supported/configured in Home Assistant. Managed snapshots use the authenticated HA camera image API when a refresh interval is set or Refresh is clicked. Tap a feed/name for camera details. Only explicitly applied alarm actions and confirmed privacy actions issue service calls. Choosing another alarm mode sends its command immediately when the integration allows code-free arming. A code-required alarm opens native HA controls instead. Opening a card or receiving a detection never sends control commands.

Grid loads all available visible feeds. Tabs only load the selected camera. Native players are preserved on sensor and cosmetic configuration updates, and removed on unavailable/off states, leaving a tab, hiding the card/page or removing the card. Reconnection recreates players. Initial player/helper failures offer Retry; playback errors inside the native player remain handled by Home Assistant. Offline, missing, off and unavailable cameras have distinct Dutch/English messages. Custom names entered in YAML are preserved by the visual picker.

The visual editor includes an expandable section per camera with custom name/icon, visibility, move up/down controls, live/snapshot override, aspect ratio, image fit and detection selectors. Select **Card default** or clear a selector to restore inheritance. Hiding a camera retains its settings and removes it from playback, navigation and automatic switching.

```yaml
type: custom:eleven-camera-card
layout: focus
auto_cycle: true
cycle_interval: 15
cameras:
  - entity: camera.voordeur
    name: Entree
    icon: mdi:door
    aspect_ratio: "4:3"
    motion_entity: binary_sensor.voordeur_beweging
    person_entity: binary_sensor.voordeur_persoon
    last_detection_entity: sensor.voordeur_laatste_detectie
  - entity: camera.tuin
    name: Achtertuin
    camera_view: auto
    fit_mode: contain
```

Per-camera fields: `entity`, `name`, `icon`, `show` (default true), `camera_view`, `aspect_ratio`, `fit_mode`, `motion_entity`, `person_entity` and `last_detection_entity`. Detection inputs are binary sensors: `on` means detected, `off` means clear; missing/unavailable values show unknown. Map person detection to a camera's binary sensor, not a HA `person` entity. The optional last-detection input is a timestamp sensor. Without it, only ON timestamps observed while the card remains loaded are remembered; an OFF transition is never used as a detection time. Unknown history shows a dash. Timestamps follow Home Assistant's configured time zone. The card does not analyze video.

Tabs and focus load one camera at a time. Automatic cycling pauses during hover, keyboard interaction, large-view use, hidden pages and off-screen cards. Grid ignores automatic cycling. Opening the large viewer pauses other feeds until it closes.

The collection test type is `custom:eleven-camera-card-test`. Run the camera build, collection build and scripts/build-test.mjs to update it. QA uses synthetic camera entities and a clearly labelled simulated native player; it does not verify real streaming, authentication, WebRTC/HLS or audio. Test these with your actual Home Assistant camera integration.

References: [Home Assistant picture entity](https://www.home-assistant.io/dashboards/picture-entity/), [official custom-card helpers](https://contributors.home-assistant.io/frontend/custom-ui/card/).

The isolated [large-camera design studies](qa/security-camera-designs.html) compare an overview with a large viewer, one main camera with thumbnails, and compact camera rows with an image/details viewer. These interactive examples use drawn fixture images, the existing security header, contact tabs and detection icons. They do not connect to Home Assistant or change the production card. Viewer navigation, Escape and focus restoration use native controls and dialogs.

## Alarm and contact overview

| Setting | Default | Meaning |
| --- | --- | --- |
| `show_security` | `true` | Show configured alarm and contact overview |
| `alarm_entity` | Empty | One `alarm_control_panel` entity |
| `alarm_disarm_code` | `true` | Ask for a code when selecting Off if the alarm advertises a code format; false sends a direct disarm request |
| `door_sensors` | `[]` | Binary sensor IDs or `{entity, name}` objects |
| `window_sensors` | `[]` | Binary sensor IDs or `{entity, name}` objects |
| `show_activity` | `true` | Compact activity timeline; disabled hides this tab |
| `activity_source` | `session` | Observed events, or `history` using HA Recorder history |
| `activity_hours` | `24` | Recorder lookback, 1–72 hours |
| `activity_page_size` | `10` | Grouped events per page, 1–50 |
| `snapshot_interval` | `0` | Managed still-image refresh in seconds: 0 uses native HA; positive intervals are at least 5 seconds, maximum 3600 |

First observations and reconnects establish a baseline for contact activity. Motion and person sensors provide indicators and activity only; they never change the selected camera automatically.

Grid, sidebar, wall and filmstrip can play multiple visible feeds; tabs/focus play one. The expand icon beside the detection icons opens a large native dialog with camera navigation and a labelled close button. The selected player is reused and other feeds pause. Escape or Close restores the original layout, selection and keyboard focus. Privacy, snapshots and detection indicators remain available. Hiding or removing the viewed camera closes the viewer. The live image sits flush with the top and sides of its surface, without status text or a fullscreen button.

Alarm and contact values come from HA entities. Binary on means open and off means closed; unavailable values remain unknown. A full-width custom alarm control sits above the Doors and Windows metrics. Its mode group includes Off and every arming mode supported by the entity: Home, Away, Night, Vacation and Custom bypass. Selecting an arming mode immediately sends its HA action without a code or a second button. Off asks for the alarm code when `alarm_disarm_code` is true and the entity advertises a code format; only this flow has an explicit Disarm button. Set the option to false for a direct disarm request. Entered codes are masked and cleared on submission, mode changes, entity changes and disconnect. The alarm integration still enforces its own code policy; for example, a Manual alarm must have `code_arm_required: false` to accept arming without a code. Commands use HA alarm services; the status only follows reported entity state. Failed commands and unacknowledged state changes offer feedback; missing or offline data disables the controls. Contact surfaces retain the same background for open, closed and unknown states.

```yaml
type: custom:eleven-camera-card-test
title: Beveiliging
layout: sidebar
alarm_entity: alarm_control_panel.woning
door_sensors:
  - entity: binary_sensor.voordeur
    name: Entree
  - binary_sensor.achterdeur
window_sensors:
  - entity: binary_sensor.slaapkamerraam
    name: Slaapkamer
activity_source: history
activity_hours: 24
cameras:
  - entity: camera.voordeur
    name: Voordeur
    motion_entity: binary_sensor.voordeur_beweging
    person_entity: binary_sensor.voordeur_persoon
    privacy_entity: switch.voordeur_privacy
  - entity: camera.tuin
    name: Tuin
    camera_view: auto
    snapshot_interval: 15
```

Replace all example IDs with your own entities. Use the normal card type instead when loading the production collection.

## Privacy and still images

Per camera, `privacy_entity` accepts `switch`, `input_boolean` or a read-only `binary_sensor`. `privacy_state` is `on` by default; set it to `off` for inverted switches. Active **or unknown** privacy removes live players and still images and cancels pending image requests. Privacy controls ask for confirmation. A helper is only a display gate unless your HA automation also connects it to the camera's actual privacy mode. No background profile or alert changes this entity.

Per-camera `snapshot_interval` overrides the card setting; clear it in the editor to inherit. A managed still image is attached only after successful image decoding. “Image loaded” is the last successful load time, not the camera capture time. Failed refreshes do not update this timestamp. Polling stops off-screen, on inactive tabs, during privacy, offline and on disconnect. Old image URLs are revoked. Refresh requires HA's `callApiRaw` frontend method (HA 2024.11+); live/native mode remains available without it.

## Security overview and detection details

The visible header has a large alarm mode and subtitle, without a visible card heading. A layered vector illustration on the right follows the Weather card's classic artwork: shield/check, home, moon, suitcase, custom mode, arming, pending, alarm, disarmed and unknown states all share the same gradients, highlights and motion treatment. Without a configured visible alarm, it shows the number of available cameras with a camera illustration. Alarm status opens the native Home Assistant details. Unknown/offline states remain unknown; a disarmed alarm is not treated as evidence that somebody is home. The editor offers the same eleven header backgrounds, colour presets and background strength as the other cards. Motion respects reduced-motion settings and pauses off-screen.

A compact alarm toggle group sits above the contact metrics, with no duplicate heading. All supported alarm modes include Off; the selected mode has a stronger border and tinted fill. Modes apply immediately, with an optional PIN only for disarming. Paired Doors and Windows metrics sit below the alarm header when contacts are configured. Clicking a metric opens its corresponding Doors or Windows tab. Each configured contact has its own detail surface in that tab, using the same shared component as Energy's Self-sufficiency surface. Open contacts sort first, unknown next, then closed. Each contact title opens native entity details. Zero open contacts with some unavailable sensors includes the unknown count; an entirely unknown group shows a dash. If no contacts are configured, a Cameras metric shows availability instead.

Each camera has compact Motion and Person icons for its configured `motion_entity` and `person_entity`. Icons turn amber on detection, remain muted when clear and fade when unknown. Tooltips and accessible labels describe the state. Clicking an icon opens that binary sensor's native details. Unconfigured detector types are omitted; camera images are never analyzed to infer detections. Existing `show_status: false` hides these indicators.

Contact surfaces show Status and Last opened, with time and date on one line as `14:22 28-10-2026` in Home Assistant's time zone. Opening timestamps come from an open sensor's `last_changed`, openings remembered while the card is loaded, or Recorder history when `activity_source: history` is enabled. Closing timestamps are never used as opening times. Unknown opening times show a dash. Remembered openings survive activity-list truncation while the card remains loaded; after a reload, older openings depend on the configured Recorder history window.

Tabs are Cameras, Doors, Windows and Activity (Camera’s / Deuren / Ramen / Activiteiten in Dutch). A contact tab appears only when its sensors are configured and `show_security` is enabled. Cameras keeps the configured feed layout and controls, without a duplicate recent-activity list. Each feed and its configured detection icons share one raised surface; the icons sit together beneath the image. Camera names, detector icons and the expand action share a quiet footer below the image; the feed has no overlay text. Activity shows a compact timeline grouped into local calendar days, with time on the left, an event icon, source name and event text. Source/type filters, the Current section and separate information buttons are omitted. The entire event row opens its details. With `show_activity: false`, the Activity tab is omitted. The tab bar hides only when Cameras is the sole remaining tab. Without mapped detectors, Activity explains how to configure them. Selecting a camera event opens that camera's **current** feed in the large-view popup; it does not replay the event. Closing the popup returns focus to the event. Contact events open native sensor details. Streams and auto-cycling stop while any other tab is selected and resume on returning to Cameras. Existing privacy gating still applies. Removing the sensors for a selected contact tab returns to Cameras.

For events from before opening the dashboard, set `activity_source: history` and choose `activity_hours` (1-72); the existing editor includes these settings. Recorder must retain the mapped binary sensors or doorbell events. The default `session` source only collects fresh events observed while the card is loaded. Configure `motion_entity` / `person_entity` per camera to populate detections. These binary sensors provide events and timestamps, not object images, saved video or clips. Unconfigured detection types cannot be inferred from a camera feed. History errors offer Refresh while keeping observed events available.

`show_alarm` and `show_contacts` independently control the alarm UI and contact overview/tabs. Both fall back to legacy `show_security` when omitted; an explicit new setting overrides that fallback. Hiding contact UI retains the sensor mappings and their activity events. The visual editor writes the independent settings without discarding legacy YAML.

The implemented card can be reviewed in qa/security.html with synthetic detection history, active detections, open windows, alarm, unknown/offline states, narrow width and theme controls. qa/camera.html runs the broader player, privacy, actions, editor and security interaction checks. Neither page uses real household data or commands.

Activity also includes opening and closing transitions from configured door_sensors and window_sensors. Initial readings, reconnect baselines and recovery from unavailable states do not create session events. Selecting a contact event opens that sensor's native details. Recorder history uses the same configured contact entities. Clear contact readings are valid closed events, not camera detections, and never trigger automatic camera focus. Historical events require Recorder retention for the contact sensors.

Four additional, independent design studies are available in [qa/security-designs.html](qa/security-designs.html): a compact status overview inspired by Weather, an image-first camera window, an interactive schematic floor plan inspired by Energy Flow, and an event journal inspired by Timeline and Calendar. They reuse the shared primary value, metric surfaces and tabs. Compare dark/light themes, narrow/standard/wide cards and quiet/person/open-window/alarm/unknown scenarios. All data and drawn camera images are fictional; these previews have no Home Assistant connection and do not change the production card.

Profiles, custom action buttons and detection/doorbell automation are omitted from the runtime UI and visual editor. Legacy YAML values are retained when editing but have no effect on camera selection or controls. Per-camera motion/person sensor mappings remain available.

Custom contact names can be set in the visual editor: expand the door/window entry and enter **Custom name**. Clear the field to use its Home Assistant friendly name again. YAML accepts `{entity, name}` for both `door_sensors` and `window_sensors`; the entity mapping stays unchanged when renaming.

Three interactive camera-grid and custom alarm-control proposals are in [qa/security-refinements.html](qa/security-refinements.html). They compare footer, overlay and taller camera tiles, and direct mode buttons, mode selection with a primary action, and a compact control opening a mode dialog. The examples simulate PIN validation and command failures; they never send HA commands and do not replace the current production alarm controls.

The chosen camera design uses an edge-to-edge image and a footer with the name, compact detection icons and expand action. Refresh and privacy controls remain in that footer when configured. Three isolated activity proposals are available in [qa/security-activity-designs.html](qa/security-activity-designs.html): a day journal, a vertical timeline and collapsible groups per source. All use fictional Recorder records and simulated commands. The production card now uses a more compact version of the vertical timeline, without source/type filters.

The alarm surface shares the Doors/Windows metric background. The editor includes **Ask for a code when disarming**. This controls the card prompt, not the alarm integration's code validation. See [Manual alarm code requirements](https://www.home-assistant.io/integrations/manual/#configuration).

The camera-grid footer uses a compact 32 px row for ordinary names, with 28 px controls; long names can wrap. Three interactive large-view proposals are in [qa/security-popup-designs.html](qa/security-popup-designs.html): image-first with one bottom toolbar, a thumbnail picker below the image, and a camera list beside the image. Each uses the real viewer/player lifecycle with synthetic drawn feeds. The production popup uses option 2: a compact title and detection toolbar, an edge-to-edge feed and a thumbnail picker below it. The picker uses authenticated still images with no polling or extra livestreams; closing, privacy and disconnection release the images and pending requests. A single camera hides the picker. Missing snapshot support shows a camera icon while camera selection remains available. Add `?checks=1` to run their optional browser checks without screenshots.

[security-color-examples.html](qa/security-color-examples.html) compares the five existing card colours with the shared dynamic background source and three quieter illustration treatments: soft layered, tonal and fine lines. Background style, alarm state, width and light/dark theme are interactive. This isolated study uses synthetic feeds and does not modify the production artwork or test bundle.

[security-state-examples.html](qa/security-state-examples.html) demonstrates five alarm status groups (off, armed, arming/disarming including pending, unknown/unavailable including offline, and triggered) using the actual cardBackgroundStatusColor hook. Each group shares one colour and a subtle classic Weather-style illustration. These status colours and illustrations are used by the production and test cards. Select Card colour in the background editor (colorMode: dynamic) to use them; accent/custom colour modes and existing transparency, coverage, height and animation settings remain available.

[security-background-examples.html](qa/security-background-examples.html) compares four isolated additional background proposals (Soft spotlight, Quiet arcs, Folded light and Signal field) on the real card with synthetic camera imagery. Status, transparency, coverage, height, animation, theme and width can be changed live. These additional designs are not included in the production or test bundles.

[security-background-alternatives.html](qa/security-background-alternatives.html) offers ten further isolated background directions: shield watermark, brushed metal, cotton paper, woven fabric, terrazzo, pixel mosaic, fluted glass, botanical, circuit traces and edge light. The default compact comparison can also show the synthetic camera feeds. Production and test bundles are unchanged.

[security-background-filled.html](qa/security-background-filled.html) retains Satin waves as option 2 and compares five distinct animation mechanisms: rotating light, expanding ripples, independently folding planes, morphing organic shapes and crossing woven flows. Animations are enabled by default and respect reduced motion and offscreen pausing. The longer header fade, whole-card coverage and 40% transparency remain available; production and test bundles are unchanged.

[security-aurora-examples.html](qa/security-aurora-examples.html) compares the actual shared Aurora sky renderer with four isolated Aurora variations (curtains, horizon, veil and ribbons) and the unchanged Satin waves option 2. All previews retain live status colours, subtle animation, the longer fade and background controls. Production and test bundles are unchanged.

The Aurora study also includes five further distinct designs (options 7-11): Paper fans, Isometric depth, Comet trails, Lenticular glow and Honeycomb satin. Each has a separate slow animation and retains the same controls; existing options 1-6 are preserved.
