# Eleven Appliance Planner

Find an inexpensive contiguous appliance run before a chosen deadline, without requiring a custom integration.

Part of [Eleven Cards](../../README.md). This is a local beta, installed for local testing only; it has not been published.

## Standalone advice

- Choose an appliance and program with visible buttons. Change the ready-before date/time or Today/Tomorrow; advice recalculates automatically.
- Each program specifies elapsed minutes and **total kWh**. Standalone consumption is uniform, never a generated or measured profile.
- Advice shows start/end with full local dates, estimated cost, consumption-weighted average ct/kWh, fixed price classification and savings against starting now.
- If the immediate run is not completely priced, comparison is unavailable. If future prices are incomplete, a fully priced feasible run is still required and advice is provisional. Gaps never become free energy.
- Expand the graph to see actual tariff intervals and the advised run. No immediate-start comparison band.
- No standalone Inplannen, browser storage, pinned plan, measurement or physical start.

```yaml
type: custom:eleven-appliance-planner
tariff:
  source: sensor
  entity: sensor.my_energy_prices
cheap_price: 0.15
expensive_price: 0.40
appliances:
  - id: washer
    name: Washing machine
    kind: washer
    programs:
      - id: eco
        name: Eco
        minutes: 150
        kwh: 1.0
```

The numeric program values above are **synthetic examples**, not measured appliance facts. Appliances support washer, dryer, washer_dryer and dishwasher. Supply your own duration/energy; adding an appliance does not silently invent programs.

## Settings and dashboard persistence

Administrators manage appliances, program duration/kWh, tariff source, independent cheap/expensive thresholds and optional integration only through the native Home Assistant card editor. The daily card has no settings panel, embedded editor or settings-save button. There is no browser-local program database.

Every valid standalone name, duration, kWh, tariff or threshold edit emits a `config-changed` draft automatically; there are no per-appliance/program Save buttons. Add buttons add draft records only. The normal Home Assistant Save owns persistence and Cancel discards the draft. Non-administrators do not receive editing controls. The editor never writes backend settings or dashboard storage directly.

**Linked-mode limitation:** backend program, meter, profile-mode and notification settings are explicitly read-only. The current protocol resolves stored program IDs when previewing/saving plans; it cannot apply config overlays or atomically commit editor drafts on native Save. Pretending an overlay worked would display different settings from those used for a saved plan. Enabling those edits requires a separately authorized backend/native-save contract. Unlink (optionally copying known duration/kWh) to edit simple standalone settings. No backend records are changed by linking, unlinking or cancelling.

The daily card has no dashboard-write path. Browser tests check the absence of inline settings and exercise the editor's config-changed interface; **a household native-dashboard Save was not executed**. YAML users edit through their normal YAML workflow.

Price-level semantics match Energy: negative is separately labeled Negative, cheap is average <= cheap_price, normal is above cheap through expensive_price, and expensive is above expensive_price. Defaults are 0.15 and 0.40 EUR/kWh. Editor inputs use ct/kWh; YAML stores EUR/kWh. Thresholds are independent of Energy and never relative to the observed price range.

## Independent tariff sources

The Energy card need not be installed. All values must be EUR/kWh, including the selected Tibber home. An HA EUR currency setting is a guard, not proof of the provider home's currency.

| `tariff.source` | Configuration and actual contract |
| --- | --- |
| `sensor` | `entity`; unit EUR/kWh or €/kWh, `attributes.data` with `start_time`/`price_per_kwh` (Energy format), or `attributes.prices` with explicit timezone-aware `start`/`end`/`price`. |
| `energyzero` | `energyzero_entry`; `energyzero.get_energy_prices`, `config_entry`, `incl_vat: true`, `price_type: all_in`, `interval: quarter`; today/tomorrow fetched separately. Reads response.prices start/end/price. Unpublished tomorrow retains today. |
| `tibber` | Built-in `tibber.get_prices` with start/end. Reads response.prices[home][] start_time/price. Optional `tibber_home` is the **exact home key**, not an entity or config-entry ID; a sole home auto-selects. |
| `tibber_prices` | Custom `tibber_prices.get_price`, start_time/end_time and optional `tibber_entry` mapped to entry_id. Reads response.price_info startsAt/total; success:false is rejected. |
| `zonneplan` | `entity`; forecast start_date + price_tax_included.amount, or legacy datetime + electricity_price, divided by 10000000. |

Start-only contracts need an observable 15/30/60-minute cadence; the smallest observed interval is used, never stretching an interval over a larger gap. Single start-only samples without a known interval are rejected. Explicit end times are preferable for sensor adapters. Null/invalid prices, duplicates and overlaps are rejected; zero and negative prices remain valid. No provider is silently substituted. Service requests deduplicate/cache for five minutes per instance; day, timezone and source selections separate caches. New configuration, disconnection and failures invalidate the relevant cache. The card refreshes advice every minute while attached and ignores stale asynchronous results.

## Explicitly optional integration

The separate `eleven-appliance-planner` integration provides background measurements, simulated/measured profiles, persistent plans and start reminders. Installing it alone never enables linked mode. Link it explicitly in the native editor to use its existing records, then use native Save. This editor does not transfer or overwrite standalone programs in the backend; that immediate-write workflow was removed to preserve native draft/cancel semantics.

The integration owns its records. The card never silently overwrites them from dormant standalone values. Existing backend per-program `profile_mode` is explicit (read-only in this editor):

- **uniform**: duration and total kWh distributed evenly;
- **simulated**: a labeled generic three-phase estimate (20/60/20% of elapsed time, 65/25/10% of energy), not an appliance-specific model or measurement;
- **measured**: the last valid attributed run, selectable only after such a profile exists.

Recording a new measurement does not automatically select measured mode or replace active uniform/simulated inputs. Legacy integration records that already used a measured profile retain that selection through migration. Protocol version 2 is required for linking. The obsolete integration-bundled card has been removed; use `custom:eleven-appliance-planner` from this collection.

Inplannen recomputes with backend-fetched prices and stores authoritative times. Confirmed plan times stay fixed. Started is tracking only; the user starts the machine. Every saved plan has a start reminder using the backend's configured notification action, defaulting to a HA persistent notification. No phone target is assumed. Reminder state survives runtime reloads.

Unlinking is a dashboard draft and optionally copies current duration/kWh into simple settings; native Save commits that card configuration, not backend changes. It never deletes integration records or cancels existing integration plans/reminders. During an integration outage, known inputs remain usable for a clearly labeled uniform fallback; saving plans and measuring are unavailable. The configured profile mode is not modified. No known inputs means no fabricated advice. Price-provider failures are not relabeled as integration outages.

## Local development

From the collection root:

```sh
npm --prefix cards/appliance-planner run build
npm --prefix cards/appliance-planner test
npm --prefix cards/appliance-planner run check
npm test
npm run check
```

The generated independent module is `dist/eleven-appliance-planner.js` in this card directory; the root collection bundle includes it. No external runtime dependency on Energy.

Browser QA (requires Playwright Python and `AGENT_BROWSER_EXECUTABLE_PATH`):

```sh
/opt/data/workspace/eleven-appliance-planner/.venv/bin/python cards/appliance-planner/tests/browser_qa.py
```

It creates/stops a loopback-only temporary server and writes screenshots/results under `qa-evidence/appliance-planner/` at the collection root. All tariffs, programs, Lovelace interfaces and integration replies in that fixture are explicitly **synthetic**. This is component/browser verification, not a live-provider or household dashboard test. Native date/time widgets follow browser/OS formatting; result times remain localized 24-hour HA-zone times. Ambiguous/nonexistent DST inputs are rejected. Linked separate-device transfer sequences and field-proven appliance recognition are not implemented.
