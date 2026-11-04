# Shared UI components

These small components render native HTML into the caller's existing shadow root. They do not register custom elements or require a framework. History, Bar Chart, Timeline and Heatmap use them through their shared header, period controls and information panel.

Include each available style function once in the shadow root. `cardHeaderStyles()` includes the button and popup styles; `periodControlsStyles()` includes the tab styles. The legend uses each card's existing layout and swatch styles.

The Calendar card reuses `periodControls()` and `bindPeriodControls()` in its list and column views. Month view uses a non-interactive month label and previous month / Now / next month buttons. An optional host-owned `_periodAdapter` supplies `standard`, `rolling`, `calendar`, `rollingLabel`, `range()`, `name()`, `choose()`, `custom()` and `move()`, so date-based future navigation can reuse the popup, keyboard behavior and custom-range validation without adopting graph history semantics. Without this adapter, graph behavior is unchanged. Shared segmented navigation uses the approved compact style: 36px minimum buttons, 2px vertical and 6px horizontal padding, 12px labels and 14px icons. Period-popup options retain their existing dimensions. Energy places its navigation beside the primary reading when both fit and wraps the complete group below it when space is limited.

## Button

`uiButton()` in [ui-button.js](ui-button.js) renders a native button, or an anchor when `href` is supplied. Variants are `icon`, `surface`, `text`, `close` and `tab`. `type: 'submit'` preserves native form submission. Use `disabled` for buttons; anchors retain ordinary link semantics.

```js
uiButton({
  variant: 'surface', text: 'Apply',
  attrs: {'data-action': 'apply', 'aria-pressed': selected}
});
uiButton({href: historyUrl, content: historyIcon, label: 'History'});
```

`text`, labels, titles and attribute values are escaped. `content` is deliberately trusted HTML supplied by application code: escape any user-provided strings before interpolating them. This applies to panel and popup content as well. `uiAttributes()` rejects malformed attribute names and inline event handlers. Bind events after inserting the markup.

## Primary value

[ui-primary-value.js](ui-primary-value.js) provides `uiPrimaryValue()` and `uiPrimaryValueStyles()` for a large measurement with an optional unit and subtitle. Include the styles once per shadow root. The Energy, Weather and Car cards (including EVCC mode) use this component in production; the [energy, car and weather examples](qa/metric-examples.html) demonstrate reuse with different data.

```js
uiPrimaryValue({value: '3,8', unit: 'kW', subtitle: 'Actueel woningverbruik'});
uiPrimaryValue({value: '64', unit: '%', subtitle: '320 km actieradius', compact: true});
```

All text and attributes are escaped. The caller formats numbers and translates labels. Missing values show an em dash without a unit, while zero is preserved. Values and subtitles wrap when necessary. `compact` reduces the default value/unit sizes from 60/16px to 46/14px; the subtitle stays 11px. Override `--ui-primary-size` and `--ui-primary-unit-size` in the parent for a particular header layout. By default the component has no controls, tab stop or live region. `entity` makes the main number a native details button; `subtitleEntity` does the same for its subtitle, with independently escaped text and entity attributes. Weather uses the subtitle for apparent temperature; Car and EVCC use it for remaining range.

[Primary value alternatives](qa/primary-value-alternatives.html) compare four preview compositions with live power, historical energy, car and weather data. Option 2 is the production default: a stronger value, a small raised unit and a fine accent line beside the subtitle.

The [review gallery](../review/index.html) links each card to its detail page with multiple configurations of the production component. The [Car](../review/detail.html?card=car-card), [Weather](../review/detail.html?card=weather-card), [EVCC](../review/detail.html?card=car-evcc) and [Energy Flow](../review/detail.html?card=energy-flow-card) examples share the uniform primary-value layout.

Car, Weather, EVCC and Energy Flow opt into `uiPrimaryValue({layout:'uniform', ...})`. This single composition owns the value, unit and subtitle layout: 44px values (36px compact), a non-wrapping value/unit row, 12px subtitle text, a 2px gap and a 12px decorative accent line. Subtitle lines use Home Assistant `--accent-color`, falling back to `--primary-color`, independently of card status colours. Sensor subtitle buttons retain a 44px target; the line no longer follows its full height. `unitPosition` accepts `raised` (default), `center` or `baseline`. Cards pass content and entities without overriding this geometry. Existing callers retain their layout until opting in.

## Metric surface

[ui-metric.js](ui-metric.js) provides `uiMetric()` and `uiMetricStyles()` for an informational div with an icon, title, value, unit and additional information line. Include the styles once per shadow root. These surfaces use existing Home Assistant theme variables, with the same typography and padding in every domain. The default design combines the layout of option 1 with the top-right colour wash of option 2: a borderless surface with a bare coloured icon closer to the top-right corner. A 10% corner tint softens through 3% to transparent toward the bottom-left, scaling with the surface. Standard icons shift 4px toward the corner; compact icons shift 2px. Optional information keeps its separated row. The icon is 26px with an 18px symbol (compact: 20px/16px) and spans the title/value rows, so it never pushes the value down. The title-to-value grid gap is 2px with or without the optional information row. Paired surfaces share two rows, or three when any information row is present; absent rows add no placeholder spacing. Parent grids own column widths. Add `data-ui-metric-grid` to a parent for aligned title, value and information rows across pairs (with a CSS subgrid fallback). Set `--ui-metric-columns` to change its default two columns.

```js
uiMetric({
  icon: 'mdi:solar-power', title: 'Zonne-energie', value: '4,6', unit: 'kW',
  info: 'Opwek op dit moment', compact: false,
  attrs: {style: '--ui-metric-tone:var(--solar)'}
});
```

Text and attributes are escaped. `icon` renders a Home Assistant icon; `iconContent` accepts trusted application-owned SVG/HTML instead. Never pass user or sensor content into `iconContent`. Null, undefined and empty values show an em dash without a unit; zero remains a valid measurement. Format numbers and translate strings in the caller. The icon and information line are optional. By default the div has no click behavior, tab stop or live region. Use `action: true` to render a native button and supply an entity attribute through `attrs`. Do not nest controls in that variant. `valueContent` and `infoContent` preserve existing sensor buttons inside the informational div; like `iconContent`, these accept only trusted application-owned markup. CSS overrides are `--ui-metric-tone` and `--ui-metric-radius`; set `compact: true` for 8px padding, a 20px icon badge, 20px values and a smaller information-line gap.

See [interactive examples](qa/metric-examples.html) for energy, car, weather, unavailable data and long values. The production Energy, Weather and Car cards use this component for their header measurement surfaces.

[Four alternative compositions](qa/metric-alternatives.html) compare a value-first layout, icon rail, horizontal reading and a softly tinted surface using the same renderer. The selected layout is option 1, with a small title-to-value gap, an unboxed icon near the top-right corner and a subtle tint fading toward the bottom-left. The former [colour alternatives](qa/metric-alternatives.html?colors) remain available for comparison. Paired labels, values and information align through shared grid rows, including multi-line labels.

Text statuses in Car and Weather share the `data-value-kind="text"` metric treatment: 18px, weight 600 and line-height 1.3 in both density modes. Numeric values retain their measurement typography. Native metric buttons use a background-only hover; text, icons and units keep their normal colours and no brightness filter is applied. The [EVCC configuration examples](../review/detail.html?card=car-evcc) demonstrate the shared charging bar, while the [Controls examples](../review/detail.html?card=controls-card) show native sliders.

## Bars and sliders

[ui-bar.js](ui-bar.js) supplies `uiBar()`, `uiSlider()`, `syncUISlider()` and `uiBarStyles()`. Car, EVCC, Energy details and Controls share the selected recessed 12px track, rounded fill and native slider thumb. Include the stylesheet once per shadow root; `uiDetailSurfaceStyles()` already includes it. Bar widths and target markers are clamped to finite values; unknown measurements have no progress value. Text/attributes are escaped. `decorative:true` hides bars whose values are already given in adjacent readings. `min`/`max` support other numeric domains. Slider limits, steps, disabled states and native keyboard behavior are preserved. Call `syncUISlider(input)` from existing input handlers; it only updates the filled track and never sends a service command.

`uiBar({value:62,target:80,charging:true,label:'Battery level'})` enables the selected broad, soft light band C, contained inside the measured fill: 65% width, 3.8s travel, no external glow. Motion stops at the target/full value and respects reduced motion. EVCC additionally requires actual positive charging power and a charging state, and suppresses animation while offline. Passive proportions and ordinary sliders stay still. `--ui-bar-tone`, `--ui-bar-height`, `--ui-bar-duration` and `--ui-bar-delay` are optional tokens; Car retains explicit slim/line thickness choices. Slider thumbs retain a 44px input height. Home Assistant theme colours and inset-shadow tokens remain in use.

## Detail surface

[ui-detail-surface.js](ui-detail-surface.js) provides `uiDetailSurface()` and `uiDetailSurfaceStyles()` for a titled detail block with labeled readings and an optional shared 12px proportion bar. The Energy card uses it for device consumption, self-sufficiency, self-consumed solar generation and historical grid details.

```js
uiDetailSurface({
  title: 'Warmtepomp', percent: 38.1,
  metrics: [{label: 'Aandeel', value: '38,1', unit: '%'},
    {label: 'Verbruik', value: '3,2', unit: 'kWh'},
    {label: 'Geschatte kosten', value: '€ 1,12'}],
  attrs: {style: '--ui-detail-tone:var(--house)'}
});
```

Include the styles once per shadow root. All titles, labels, values, units and attributes are escaped; there are no trusted HTML slots. Set entity and optional actionLabel to make only the title a native details button with a data-entity attribute; the caller handles the more-info event. Each metric may supply an optional escaped hint, rendered below its value in secondary text. The caller translates labels and formats readings. Missing readings display an em dash without their unit; zero stays visible. Only finite numeric percentages render the decorative bar, clamped to 0–100. Include the percentage among the labeled readings for accessible text. The component owns no data fetching, calculations or period controls. `--ui-detail-tone` controls the bar color and subtle background tint; metric columns adapt to the available width.

## Legend

[ui-legend.js](ui-legend.js) renders legend buttons with a common pressed state and binds single-click toggling, double-click or Shift+Enter isolation, focus restoration and delayed-click cleanup. Cards supply their own trusted swatch/label HTML and visibility callbacks; the graph and calendar legends share this behavior while keeping their own layout and colours. Call `cancelUILegendClicks(host)` when disconnecting or replacing the configuration.

```js
const markup = uiLegend({items:[{
  id: entity, visible: true, title: 'Hide calendar',
  attrs: {'data-calendar': entity},
  content: '<i class="dot"></i><span>Calendar</span>'
}]});
bindUILegend(host, {toggle: id => toggle(id), isolate: id => isolate(id)});
```

## Tabs

[ui-tabs.js](ui-tabs.js) owns tab/panel associations, active state, focus, arrow keys and Home/End. It skips disabled tabs and hides inactive panels without replacing their content or form drafts. Provide a unique `id` prefix within the shadow root and distinct item values.

```js
const markup = uiTabs({
  id: 'settings', label: 'Settings', selected: 'colours',
  items: [
    {value: 'colours', label: 'Colours', content: colourForm},
    {value: 'layout', label: 'Layout', content: layoutForm}
  ]
});
// After inserting markup:
const tabs = bindUITabs({
  tabs: root.querySelectorAll('[data-ui-tab]'),
  panels: root.querySelectorAll('[data-ui-tab-panel]'),
  onSelect: value => { selectedTab = value; }
});
tabs.select('layout', {focus: true});
```

`select(value, {focus, notify})` returns false for unknown or disabled values. `className`, `panelClassName`, item `className`, `tabAttrs` and `panelAttrs` allow domain-specific layout and selectors. Selection and navigation never fetch data themselves.

`periodControls(host, language, {tabVariant: 'card'})` opts its timeframe tabs into the same shared card-tab typography and sizing. Energy uses this option; existing consumers retain their default. Period keyboard behavior, selected dates and custom-range drafts are unchanged.

`uiBalancedTabsStyles()` applies the approved 2A-1 appearance (the helper name is retained for compatibility). Append it after card-specific styles. Tabs use equal columns, a neutral baseline and a 2px accent underline for the selected tab, with 44px minimum height and 12px panel spacing. Labels are 13px, weight 400 in both resting and selected states. Padding is 5px above, 6px at the sides and 3px below, optically centering the text above the underline. Tabs have square corners and transparent backgrounds without inset shadows. Four or more tabs share one horizontally scrollable row; selection keeps the active tab visible without moving the page. History (including Bar), Timeline, Heatmap, Weather and Car/EVCC opt in; other cards retain their existing appearance. Labels, panel IDs, keyboard handling and configuration stay unchanged.

Selected 2A-1 tabs use `--primary-text-color`, matching information values. The accent underline is explicitly restored as a 2px solid border in resting and hover states, overriding legacy card-specific hover border resets.

## Popup

[ui-popup.js](ui-popup.js) supplies a shell with uniform 12px inner padding and no trailing margin on its final content element, the close button, native popover support, fallback display, viewport positioning, Escape, pointer toggling, outside dismissal and resize/scroll listeners.

```js
const markup = uiPopup({
  id: 'help', title: 'Information', closeLabel: 'Close', content: helpContent
});
// After inserting markup:
const popup = bindUIPopup({
  trigger: root.querySelector('[data-help]'),
  popup: root.querySelector('#help'),
  container: root.querySelector('.help-control'),
  ready: root.querySelector('ha-card')?.updateComplete
});
popup.open();
popup.close(true); // Restore focus to the trigger.
```

For a shell with `attrs: {popover: 'manual'}`, the controller handles outside pointer dismissal itself. `keepOpenOnOutside(event)` can preserve the popup for specific external controls; other outside clicks still close it. `topBoundary()` optionally reserves space above the popup for reachable card controls and constrains popup height to the remaining viewport. `align: 'center'` centres the popup on its trigger before clamping it to the viewport; the default remains end-aligned. Defaults preserve existing consumers.

The optional `ready` promise delays positioning until layout is ready; an outside click can cancel a pending open. `bindUIPopupPosition()` can also be used alone, with configurable width and maximum height.

Adapters can supply `beforeOpen`, `onOpen(focus)`, `onShown`, `onClose`, `onToggle(open)`, `focusTarget`, `isRequested` and `isCurrent`. This keeps selection, synchronization, rerender restoration and card-specific state outside the component. `open(false)` restores a popup without stealing focus. The caller owns any saved scroll position.

Call `disconnect()` on tab and popup controllers before replacing their DOM or disconnecting a card. This removes handlers and observers and prevents a delayed layout promise from reopening detached content. Rebind controllers after rendering new markup.

Standalone build scripts include these modules before the card adapters. Their generated bundles remain self-contained and can overlap safely with the collection bundle.

## Header background and fade

[header-backgrounds.js](header-backgrounds.js) owns `HEADER_BACKGROUNDS` and `headerBackgroundStyles`. Weather and EVCC export aliases of this catalog; Car inherits EVCC. Energy uses the same catalog and rendering as Car and Weather, including hologram, ink and terrain. All three editors use headerBackgroundOptions(language) for identical localized names and Animated/Static labels. Each card supplies `--tone` and selects the design with `.content[data-background]`. Animated layers remain in [header-atmosphere.js](header-atmosphere.js).

Use a `.header-region` containing a decorative `.scene-background` or `.header-background` and the header content. Include [header-scene.js](header-scene.js) styles once. The absolutely positioned backdrop follows the intrinsic header size; the shared percentage mask fades to transparent at its bottom. Keep tabs and lower content outside the region. No fixed fade height, resize observer or per-card fade override is needed.

[Configuration gallery](qa/configuration-gallery.html) renders 48 real production-card configurations, with filters, light/dark themes, narrow layouts and configuration details. All data and service responses are synthetic. `uiPrimaryValue({entity})` renders the measurement as a native sensor-details button while preserving the shared typography.

Energy Flow uses `periodControls(host, language, {popupNavigation: true})` to include an optional navigation row in the same generic popup. The caller hides that row on wide cards and hides the matching toolbar buttons on narrow cards. Both sets retain the shared previous/now/next behavior; other consumers keep the original default.

Header scenes share --header-background-opacity (default 1), controlled by each card's background_strength setting from 0 to 100. Opacity applies only to the decorative backdrop. --eleven-card-padding defaults to 16px; header negative margins and padding follow it so the backdrop stays flush with the card edges. Calendar and Timeline use the same outer padding in compact and narrow layouts. Timeline responsive behavior uses its own container width.

## Information surface depth

Information popup detail blocks opted into `cardThemeStyles({wells: ...})` use `--secondary-background-color`, matching the base of Weather/Car metric surfaces, plus the shared well shadow and radius. This includes Heatmap. The decorative metric corner tint remains separate. Segmented controls dim disabled text through color rather than element opacity, keeping divider color identical across enabled and disabled segments. Interactive primary-value subtitles have minimum 44px touch targets.

[ui-surface.js](ui-surface.js) defines the shared matte relief: a subtle top highlight, inset bottom shade and soft external shadow. `uiMetricStyles()` and `uiDetailSurfaceStyles()` include it automatically. Car (including EVCC), Weather and Energy therefore share one recipe; avoid card-specific shadow overrides on these information surfaces. Header control groups, calendar navigation/info buttons and graph hover tooltips also use this recipe with 8 px corners and no separate border. All shared info, timeframe, calendar-event and Energy detail popups use the same shadow, border-free inset edge and 8 px corners. Calendar information uses the same detail surfaces, one per calendar. Graph information popups give each series its own detail surface, using the shared detail-surface styles for background, shadow, corners and numeric readings. Graph hover tooltips use the theme card background and a compact list: series names on the left, values on the right, with a small color swatch and no individual item surfaces. Existing theme tints and icon glows remain owned by their components. Forced-colors mode replaces the shadow with a visible system outline.


## Custom entity tabs

Car and Energy share `entity-tabs.js` for stable custom-tab IDs and row normalization, and `entity-tabs-editor.js` for adding, hiding, renaming and reordering tabs and entities. The `customTabsEditor(Base)` mixin requires an adapter with `_config`, `_hass`, `_setCustomTabs(tabs)` and the existing custom-tabs editor containers. It preserves existing nodes while updating forms. Each card supplies its own normalization/emission and renders tabs with `uiTabs`. Energy limits custom decimals to two; Car retains its existing six-place option. User labels, entity IDs and values are escaped in rendered readings.

Car and Energy use the shared uiTabs card variant for identical typography, straight tab corners, underline, spacing and horizontal scrolling. Card outer corners follow --ha-card-border-radius with a 12 px fallback; popup surfaces and slim bars retain their own 8 px treatment.

`segmentedControlStyles(group, buttons, {first, last, dividers})` provides one continuous raised bar with a single group shadow. Resting segments remain transparent and shadowless; only the pressed native button receives inset feedback. Segments fill the group height and have square inner corners; only the first and last outer edges follow the button radius. Full-height dividers use 55% of the theme divider color. Optional selector arguments identify wrapped first/last buttons and separators; direct child buttons are the defaults. `cardThemeStyles({chartUI:true})` uses this for timeframe, zoom and history/information groups and excludes those groups from generic parent press paint. Calendar uses the helper for date navigation. Popups, button bindings and disabled states remain native. Calendar legend items use plain labels and functional swatches, matching the chart legends.

`cardThemeStyles({periodUI:true})` shares the chart timeframe popup treatment independently of header layout. Energy uses this for consistent Default/preset surfaces, selected states and 44px popup options; its compact header remains unchanged.

## Animated card background

[ui-card-background.js](ui-card-background.js) supplies `uiCardBackground()`, `uiCardBackgroundStyles()`, `normalizeCardBackground()`, `observeCardBackgroundMotion()` and the 25 `CARD_BACKGROUNDS` choices. The [interactive examples](../review/backgrounds.html) demonstrate each variant with the same shared value, metrics and bar. The [selected backgrounds on real cards](../review/background-cards.html) show Aurora sky, Silk Flow, Atmospheric flow, Ink bloom and Holographic grid on History, Car, Calendar, Weather, Energy Flow and Car with EVCC. Calendar can switch between list and month. All built card types use the production integration in [card-background.js](card-background.js), including the separate Actions, Controls, Waste, Room, Appliance Planner and Scene Engine modules and both House aliases. The wrapper keeps each native renderer, subscriptions, actions and visual editor. The overview and detail examples use this production integration directly.

Place the returned decorative markup before card content, add `data-ui-background-host` to that container, and include the stylesheet once. The layer follows `--ha-card-border-radius` (12 px fallback), with `--ui-background-radius` available for a custom host radius. It clips its own animated content, does not capture pointer events and is hidden from assistive technology. The host keeps its theme surface and content colours.

`uiCardBackground({variant:'aurora',colorMode:'custom',colors:['#4db6ac','#7287ed','#c77dbd'],transparency:55,animated:true})` renders one shared background. The original variant values are aurora, lanes, halo, ribbon, eclipse, clouds, isobars, hologram, ink and terrain. Additional variants reuse a family through registry metadata: aurora-curtains / aurora-horizon, ribbon-pleats / ribbon-sweep, isobars-stream / isobars-vortex, ink-marble / ink-bloom and hologram-dots / hologram-hex. Five additional patterns are caustics, stardrift, dunes, moire and constellation. The gallery keeps the original numbers and groups each selected base with its A/B alternatives. The default is aurora with the theme accent. `colorMode` accepts accent, custom or dynamic. Custom palettes accept up to three validated hex colours (3/4/6/8 digits), repeated across layers as needed; invalid colours are discarded. Dynamic mode receives `{statusColor:'#35885a'}` as its second argument. The calling card owns status mapping; missing or invalid colours fall back to the theme accent. No sensor strings are inserted into CSS.

`transparency` is clamped to 0–100: 0 is fully visible and 100 is invisible. It affects only the decoration. `animated:false` and reduced-motion preferences disable movement. Call `observeCardBackgroundMotion(container)` after rendering to pause when offscreen or the document is hidden, and run the returned cleanup before replacing its content or disconnecting. This component sends no service calls and fetches no data. Motion observation also supports open card shadow roots. The selected Atmospheric flow keeps its radial glow stationary; only the line accents move. Holographic grid uses a full-height SVG perspective grid so lines reach the top on both short and tall cards.

Use `coverage:"card"` (default) for the whole card or `coverage:"header",height:240` for the top 240 pixels. Height is rounded and clamped to 24-2000 px; invalid heights default to 240. The header layer never exceeds the card height and fades smoothly through its lower 45%, leaving text and controls fully opaque. Only the decorative layer clips to the host corners; card popups remain unaffected. Both review galleries expose these settings.

### Card integration and configuration

`withCardBackground(Base)` wraps each custom-element registration. Include `ui-button.js`, `ui-card-background.js` and `card-background.js` in standalone builds. It keeps one decorative layer and stylesheet through native DOM updates, reads each card's computed `--tone` for dynamic colours (or its optional `cardBackgroundStatusColor()` hook), pauses motion when hidden/offscreen, offline or unavailable, and releases observers on disconnect. `setCardBackground(settings)` updates only decoration for interactive previews, without changing native navigation or controls.

All card editors expose a shared **Card background / Kaartachtergrond** section. It offers the five selected styles (Aurora sky, Silk Flow, Atmospheric flow, Ink bloom and Holographic grid), on/off, accent/custom/dynamic colours, transparency, animation, whole-card or top-section coverage and pixel height. Existing additional variant choices remain selectable when already configured. Native fields and helper labels remain available; superseded legacy background fields are hidden while the shared component is active. Editor changes preserve the stored background when another native field changes.

The optional YAML object is `card_background`, containing the renderer options above plus `enabled` (default true). Without it, new cards use Atmospheric flow (`isobars`), theme accent, 65% transparency and a 240 px top section. Legacy `background`, `background_strength` and `animate_background` still apply when the new object is absent; unsupported legacy styles such as Prism Glass retain their original renderer. An explicit `card_background` overrides legacy fields; `card_background: false` disables decoration. The new object does not change sensor readings, actions or entity configuration.

Run `node tests/browser-card-backgrounds.mjs` with Node.js 22+ and Chrome/Chromium (`CHROME_PATH` if needed) for production overview, editor, lifecycle, native-popup and layout verification. It uses synthetic fixtures and captures no screenshots.
