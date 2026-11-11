# Open issue fixes: #41, #42, #46, #47, #48

Branch: `fix/open-github-issues-41-48`, based on fetched `origin/develop`
(identical to `origin/main` at `e6fe132`). Existing local beta work is preserved
in its original checkout.

| Issue | Change | Screenshot |
| --- | --- | --- |
| [#41](https://github.com/hidder11/eleven-cards/issues/41) | Remove conflicting auto-height/visible-overflow overrides. The agenda scrolls inside the allocated card height in list, columns and month; auto-height masonry still grows. | [Calendar above Weather](issue-41.png) |
| [#42](https://github.com/hidder11/eleven-cards/issues/42) | Native keyboard-accessible disclosures for waste sources. Open state survives HA config echoes and follows reordering/removal. Add opens the new item. | [Collapsed waste sources](issue-42.png) |
| [#46](https://github.com/hidder11/eleven-cards/issues/46) | Remove Overview's hard-coded inset border and use the graph plot theme role, including the existing inset fallback and theme shadow. | [Borderless Material insets](issue-46.png) |
| [#47](https://github.com/hidder11/eleven-cards/issues/47) | Resolve image entities from their current access token and state like HA's image selector, even when entity_picture is absent/stale and state is unknown. Existing URL safety, preloading, retries and connection cleanup remain. | [Loaded synthetic vehicle image](issue-47.png) |
| [#48](https://github.com/hidder11/eleven-cards/issues/48) | Move export reading below its route. Reduce diagram height by 48px in standard density and 56px in compact density. Native endpoints and SVG routes share measured geometry. | [Compact energy diagram](issue-48.png) |

These screenshots show production card bundles with fictional fixture data, not
a live Home Assistant dashboard. The waste editor uses a minimal `ha-form` stub;
its native selectors still need normal HA integration review. The vehicle is an
original SVG fixture; the image token and image proxy are simulated. The image
regression reproduces token-only initialization and stale entity_picture, but
does not establish the exact state of the reporter's installation.

The image URL follows the official frontend's
[computeImageUrl](https://github.com/home-assistant/frontend/blob/dev/src/data/image.ts).

Validation:

- `npm test` with Node 22, Python and Git Bash on PATH.
- `npm run check` and `git diff --check`.
- `python tests/browser-smoke.py`: duplicate loading and all card/editor constructors.
- `node tests/browser-calendar-compact.mjs`: compact spacing and event popup access.
- `python tests/browser-open-issues.py`: 489/320px, native/Material, dark/light;
  calendar list/columns/month in both densities; auto-height; waste pointer and
  keyboard disclosure, config echo, reorder, remove and add; Overview border and
  inset shadow; token-only image loading; compact diagram label separation.

Reproduce the fixture by serving the repository and opening
`review/issue-fixes.html`. The browser runner starts its own local HTTP server.
Screenshots are disabled unless `ISSUE_SCREENSHOTS=1` is explicitly set with user
authorization. No deployment, live device commands, release or issue closure is
part of this change.
