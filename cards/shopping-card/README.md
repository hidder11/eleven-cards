# Eleven Shopping Card

Standalone shopping/to-do list with the compact Eleven look: a single surface, 18px heading, 16px padding, flat rows, light/dark Home Assistant theme variables and 44px action targets.

```yaml
type: custom:eleven-shopping-card
entity: todo.shopping_list
title: Boodschappen
```

`entity` is required and must belong to `todo`. Any compatible provider works. `title` is optional and otherwise uses the entity's friendly name. Shopping is included in the root `dist/eleven-cards.js` collection; follow the [collection installation instructions](../../README.md#installation). Alternatively, install only this card's `dist/eleven-shopping-card.js` as a JavaScript module resource. Choose one method; do not add the standalone resource alongside the collection. Installing does not alter dashboard configuration.

## Daily use

- Add using the input and Enter or the plus button. The input clears immediately and stays focused; you can type the next product while requests run in FIFO order in the background.
- Pending products appear as normal rows with quiet saving metadata. A failed product stays visible with its error and an explicit Retry button; other queued products continue. No automatic retry is attempted because an uncertain acknowledgement could duplicate a saved product.
- Keep the page open while products are saving: this is a browser-local queue, not a durable server-side worker. Entity/connection changes clear visible jobs; already queued writes retain their original target.
- Check/uncheck with the checkbox. Provider updates are authoritative; failed requests do not pretend the list changed.
- Select an item's name to open the inline editor. Save or Enter submits; Cancel/Escape returns to the item.
- Delete from the inline editor. Delete-only providers expose a direct Delete button.
- Clear completed items using **Afgevinkt wissen / Clear completed**, followed by explicit confirmation.
- Use the header reorder button, then up/down controls. This is touch- and keyboard-accessible rather than drag-only. Items keep provider order within the active/completed groups.
- Description, due date and due datetime fields appear only when supported by the provider. Dates and datetimes may be cleared. Datetimes use the browser's local timezone and are sent in ISO UTC. Descriptions render as safe plain text, not executable HTML or markdown.

Capabilities follow HA `supported_features`: create=1, delete=2, update=4, move=8, date=16, datetime=32, description=64. Read-only lists remain readable. The visual editor uses HA's native `ha-form` todo entity selector and optional title; the card appears in custom-card discovery.

## Build and verify (isolated)

No npm dependencies or external imports. The standalone build copies a closed IIFE with a banner and runs Node syntax validation. The root build includes this artifact in the collection and the root test suite runs its build contract.

```sh
node cards/shopping-card/scripts/build.mjs
node --test cards/shopping-card/tests/build.test.mjs
BUILT=1 python3 cards/shopping-card/tests/browser_test.py
```

Or from this directory: `npm test` (build contract plus built-artifact browser suite).

Python browser QA requires `playwright` and Chromium. Set `CHROMIUM_PATH` to an installed Chromium executable, or use `AGENT_BROWSER_EXECUTABLE_PATH`; otherwise Playwright's installed browser is used.

All browser mutations use synthetic JavaScript `hass`, service and WS boundaries in an isolated page. No HA credentials or live list mutations. Screenshots and raw final test output live in `tests/evidence/`. The fixture does not load native HA frontend modules: exact production HA runtime/editor rendering is a separate deployment-time check, not a claim of these tests.

## Lifecycle and recovery

The card uses `connection.subscribeMessage` (`todo/item/subscribe`) and cleans up both resolved and still-pending subscriptions on removal or entity/connection changes. Generation checks ignore stale callbacks and mutation completions. Ordinary hass/subscription updates preserve drafts, keyboard focus and selection. Initial loading, empty, unavailable, error and retry states are explicit. Failed additions keep captured product names without clearing newer drafts. Edit/remove/reorder retain their existing request lock.

The request contract was inspected in the supplied official frontend `todo.ts` and native card source. The supplied source is a development-branch fallback, not verified byte-for-byte against HA 2026.10.4. A direct core tag/source lookup also returned 404; live compatibility still requires the parent-owned HA verification.
