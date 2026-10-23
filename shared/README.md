# Shared UI components

These small components render native HTML into the caller's existing shadow root. They do not register custom elements or require a framework. History, Bar Chart, Timeline and Heatmap use them through their shared header, period controls and information panel.

Include each available style function once in the shadow root. `cardHeaderStyles()` includes the button and popup styles; `periodControlsStyles()` includes the tab styles. The legend uses each card's existing layout and swatch styles.

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

## Popup

[ui-popup.js](ui-popup.js) supplies the accessible shell, close button, native popover support, fallback display, viewport positioning, Escape, pointer toggling, outside dismissal and resize/scroll listeners.

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

The optional `ready` promise delays positioning until layout is ready; an outside click can cancel a pending open. `bindUIPopupPosition()` can also be used alone, with configurable width and maximum height.

Adapters can supply `beforeOpen`, `onOpen(focus)`, `onShown`, `onClose`, `onToggle(open)`, `focusTarget`, `isRequested` and `isCurrent`. This keeps selection, synchronization, rerender restoration and card-specific state outside the component. `open(false)` restores a popup without stealing focus. The caller owns any saved scroll position.

Call `disconnect()` on tab and popup controllers before replacing their DOM or disconnecting a card. This removes handlers and observers and prevents a delayed layout promise from reopening detached content. Rebind controllers after rendering new markup.

Standalone build scripts include these modules before the card adapters. Their generated bundles remain self-contained and can overlap safely with the collection bundle.

## Header background and fade

[header-backgrounds.js](header-backgrounds.js) owns `HEADER_BACKGROUNDS` and `headerBackgroundStyles`. Weather and EVCC export aliases of this catalog; Car inherits EVCC and Energy inherits Weather. Each card supplies `--tone` and selects the design with `.content[data-background]`. Animated layers remain in [header-atmosphere.js](header-atmosphere.js).

Use a `.header-region` containing a decorative `.scene-background` or `.header-background` and the header content. Include [header-scene.js](header-scene.js) styles once. The absolutely positioned backdrop follows the intrinsic header size; the shared percentage mask fades to transparent at its bottom. Keep tabs and lower content outside the region. No fixed fade height, resize observer or per-card fade override is needed.

[Configuration gallery](qa/configuration-gallery.html) renders 48 real production-card configurations, with filters, light/dark themes, narrow layouts and configuration details. All data and service responses are synthetic. `uiPrimaryValue({entity})` renders the measurement as a native sensor-details button while preserving the shared typography.

Energy Flow uses `periodControls(host, language, {popupNavigation: true})` to include an optional navigation row in the same generic popup. The caller hides that row on wide cards and hides the matching toolbar buttons on narrow cards. Both sets retain the shared previous/now/next behavior; other consumers keep the original default.

Header scenes share --header-background-opacity (default 1), controlled by each card's background_strength setting from 0 to 100. Opacity applies only to the decorative backdrop. --eleven-card-padding defaults to 16px; header negative margins and padding follow it so the backdrop stays flush with the card edges. Calendar and Timeline use the same outer padding in compact and narrow layouts. Timeline responsive behavior uses its own container width.
