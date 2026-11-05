# Bounded visual repair plan

## Auto hero 1:2 — completed for review, 1 November 2026
Requested layout only: percentage/range/battery in left third, exact current user car image in right two thirds of the same hero row. Existing status/Kilometerstand grid below is untouched. Written pre-code contract: `qa-evidence/car-hero-thirds/PLAN.md` and THEME-FOLLOWING-DESIGN.md. Ordinary 320/390/dashboard retains 1:2; 100% is measured to fit the left third, and 200% enlarged text uses a readable full-row fallback (never stacked at ordinary fixture sizes). No EVCC/shared/theme/sibling/gallery-status changes or HA deployment.

Executed: Car standalone/test build + collection composition only; unchanged generator regenerated the review. 65/65 Node tests; 12 isolated standalone cases + independent test-module/keyboard smoke; 12 composed-collection matrix +33 stress +6 grouped interaction checks; 14 supplemental cases including exact frozen EVCC DOM parity; 12 integrated served cases (6 local, 6 real public) and 18 exact local/public byte/MIME readbacks. Zero page errors. `npm run check`, `git diff --check`, exact 12-slice composition and 535 protected entry-file hashes pass. Screenshots and exact results: `qa-evidence/car-hero-thirds/delivery.json` and VISUAL-FIXES.md. Auto remains pending; no user approval claimed.

## Actions quiet feedback — completed
Actions now leaves pending/success feedback empty and marks its grid aria-busy during dispatch; disabled-state deduplication, focus restoration and visible failure messages remain. Controls/Waste retain their messages. Home Controls-only build and 15 Node tests pass. Served browser suite: 12 theme/width matrix, 36 stress cases and three interaction widths pass; focused height regression: 12 native/Material light/dark × 320/390/1280 cases have identical idle/pending/success height, no page errors. Final representative light/dark screenshots personally inspected. Local/public standalone bytes match. Evidence: qa-evidence/actions-quiet-feedback/results.json. Preview only, no HA calls/install.

## Actions quiet feedback — bounded follow-up
User approves compact icon-led layout but rejects success text and height shifts. Actions only: omit pending/success messages, expose pending through aria-busy and disabled buttons; preserve visible errors and focus. Controls/Waste remain unchanged. Build only Home Controls standalone; synthetic browser test checks idle/pending/success height equality, error feedback and served bytes. No Home Assistant calls/install.

User authorizes per-card improvements from VISUAL-AUDIT.md, not live installation or a new visual design. Central STYLING-GUIDE.md and THEME-FOLLOWING-DESIGN.md remain the specification. This supplement records the delegated decisions before implementation.

## Scope and decisions
Keep anatomy, functions, configuration and semantic colors. Repair documented defects only. Shared selection/control roles use the existing optional theme tokens with native HA fallbacks, no material recipes in card source. Use accent rather than primary for selection. Preserve keyboard focus separately. Important numeric values and duration labels must not break or truncate. Touch controls target 44px. Responsive widths 320/390/1280, light/dark. No new backgrounds, plugins, HA calls, deployment, push or releases. House and its dependencies are protected: do not edit old shared primitive defaults embedded by House; add opt-in rules through card-theme or caller-specific styles.

## Existing verification seams
Reuse the existing rendered synthetic review-card boundary, existing public config/render fixtures and existing behavior suites. Browser checks observe visible controls, duration/date labels, text/graphic bounds, selected state, accent changes and interaction results. Synthetic data is explicitly not native HA proof.

## Vertical slices
1. History: shared opt-in control/selection rules, unclipped duration, compact header, unambiguous dates. Build, focused regression and real screenshots.
2. Bar then Timeline then Heatmap: reuse verified rules, repair fixture statistics range and Timeline-only forced height, provide Heatmap horizontal-navigation hint. Verify separately.
3. Energy prices: collision-free now/reference labels and responsive tick density, retain semantic colors/data.
4. Overview then Calendar: stable period text and adequate filter targets.
5. Weather then Auto then Planner then EVCC: accent selections, target size, grouped metrics, non-overlapping image, no numeric splitting, correct fixture identity.
6. Energy Flow, Scene Engine, Actions, Controls, Waste, Room, Shopping: recheck all sizes/themes; leave unchanged without demonstrated defect.
7. Full tests/check/build, screenshot matrix with per-card visible captures, review and delivery verification. Update audit with exact fixed/open IDs, evidence and limitations. Preserve pre-task uncommitted work; do not lump it into a commit.

Expected files: shared/card-theme.js; affected card src files and generated bundles; review fixture/layout; browser regression scripts; repair evidence/report. Agents use isolated copies and return scoped diffs for parent integration, never a shared working directory.

## Weather semantic icon colors — 1 November 2026
Bounded pre-code contract and palette are recorded in THEME-FOLLOWING-DESIGN.md. Actual served baseline showed muddy ochre `#946800` small icons; replace with sunshine yellow-orange and balanced condition-family sky-blue/violet/icy-cyan. Keep neutral theme-owned wells, no-glow, classic/glass/neon illustration bodies and all geometry/behavior unchanged. Separate icon paint from theme-readable title/forecast text rather than darkening yellow to satisfy body-text contrast. Scope: two Weather sources, built Weather pair and aggregate; focused tests/evidence/docs. No shared/theme/other-card/HA edits. Fresh entry hashes: `qa-evidence/weather-palette/entry-hashes.json`.

Completed: 21/21 Weather unit tests; existing served refinement 12 matrix/33 stress/3 interaction widths; glow 36 cases; fresh palette 84 condition/theme/width cases +24 glass/neon checks. Small text >=5.0873:1 in these tested theme tokens, including bounded Material gradient endpoints. Supplemental yellow icons are not claimed to meet 3:1; complete text labels/values carry meaning independently. Native/Material light/dark mobile/desktop screenshots captured and inspected. Fresh scoped verifier enforces exact protected bytes and public/local composition. Parent/user approval remains pending; no install or deployment.

## Review status
Agenda is explicitly approved by the user after the aligned date controls and information menu correction. The review generator places Calendar under Goedgekeurd. Weather remains Nog te beoordelen until explicit user approval. This approval changes grouping only, not Calendar source or bundle.

## Weather-only refinement — 1 November 2026
Bounded contract recorded in THEME-FOLLOWING-DESIGN.md before edits. Preserve feature/configuration and centered art semantics, calm the existing hero/forecast vocabulary, atomic readings/forecast values and measured column reflow. Verify actual served collection at 320/390/desktop native/Material light/dark plus enlarged text/states/interactions. Weather standalone/test and aggregate build only; no shared or unrelated sources, HA or review grouping edits. Entry hashes and before screenshot: qa-evidence/weather-refinement/.

Weather implementation/verification complete for parent review: Weather-only source/style + normal/test bundles, collection composition,16/16 Node tests,12 served theme-width cases +33 stress cases +3 interaction widths passed. Results, exact evidence and known outdated legacy-harness blocker documented in VISUAL-FIXES.md. No shared/other-card source changes, grouping changes or HA deployment. Parent/user visual decision remains open.

### Weather yellow-glow follow-up — 1 November 2026
Bounded contract extended before each production correction: remove classic broad tone shadow/corona and inherited decorative metric wash; keep actual sun/rays/status icon colors and theme-owned neutral surfaces. Build only Weather pair + compose collection. Final gates:18/18 Weather Node tests,36 no-glow/preserved-color served cases, existing12 matrix/33 stress/3 interaction widths, syntax and diff checks;972 protected entry JS/package files exact,12 composition slices exact with only Weather changed,16 local/public HTTP readbacks byte-identical. Evidence:qa-evidence/weather-glow/. No review-grouping changes, HA install or other-card changes; parent/user visual acceptance separate.

## Actions icon grid — before-edit plan (1 November 2026)
Current user correction overrides the older horizontal proposal: vertical 32px neutral icon over centered 13px name/12px description, 10px padding/8px gap; three columns normally. Actions-only integer `columns` 1..6 (default3), visual HA selector and YAML docs. Configured count is maximum: actual longest-word metrics/text enlargement may reduce it, single action retains one cell. Fresh immutable inventory: qa-evidence/actions-icon-grid/entry-hashes.json. Implement only ACTION_STYLES/_fitActions plus conditional Actions validation/editor; shared CSS, Controls/Waste, all other outputs, gallery/status and HA protected. Build Home Controls standalone only. Verify new actual-browser geometry matrix/text200/columns/long/state/editor validation and keyboard held pending/success/error/confirmation/focus; inspect images; Node/syntax/diff, fresh protected hashes, exact local/public reads. Update canonical records with Actions still pending. Do not run root build or update skills.

## Scènes en acties — prior completion (superseded layout, 1 November 2026)
All bounded implementation/verification steps below completed. Red browser regressions retained for initial layout, disabled/pending focus, enlarged-word fit and reconnect; final 12 matrix/36 stress/three interaction-width and six supplemental checks pass with zero page errors, 24 focused Node tests pass, 386 protected files exact and 16 HTTP readbacks byte-identical. Root collection smoke retains its one known Heatmap missing-shadowRoot sizing failure (3/4 pass); no unrelated repair or full-green-suite claim. Weather approval updated in generator/gallery/canonical records, Actions pending; review HTML/allowlist and all approved source/bundle bytes unchanged. Final evidence and exact file/screenshot manifests in qa-evidence/actions-refinement/. No HA deployment.

## Scènes en acties — delegated before-code plan (1 November 2026)
User chooses Actions instead of Auto; Weather explicitly approved. Follow bounded contract in THEME-FOLLOWING-DESIGN.md: inspect actual Actions element, record red browser regression, Actions-only responsive horizontal controls/title/label spacing, pending-focus repair only if demonstrated, Home Controls-only build, Weather-only approval-group change, real served native/Material light/dark + narrow/dashboard/enlarged/state/interaction checks, sibling parity/protected hashes/public byte verification. Shared CSS, Controls/Waste, Scene Engine, approved sources/bundles and collection are excluded. Actions stays pending review; no HA deployment.


## EVCC refinement — delegated before-code plan
Only cards/car-card/src/evcc/{evcc-card,evcc-styles}.js plus new EVCC fitting module if needed, generated Car bundles/aggregate; build-review.py/gallery approval+image fixture, focused tests/evidence and existing docs. Preserve ordinary Auto source and rendered output, all protected siblings/shared/themes. Execute the contract recorded in THEME-FOLLOWING-DESIGN.md; tests do not approve EVCC. Entry snapshot: qa-evidence/evcc-refinement/entry/.
Executed and verified: focused Car-only build/collection assembly, 65 Node tests, 71+241 existing Chromium checks plus coexistence/reduced-motion, local/public each12 theme-width cases+60 SOC/200%-text/focus sets,12 regular computed parity pairs,18 byte/MIME readbacks. Final native/Material imagery inspected; EVCC pending, ordinary Auto approved, no HA deployment. Evidence qa-evidence/evcc-refinement/REPORT.md and delivery.json.
