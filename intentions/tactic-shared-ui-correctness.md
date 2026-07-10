---
id: tactic-shared-ui-correctness
kind: tactic
statement: "shared UI packages: escape router error output (innerHTML XSS), add
  keyboard handler to interactive ds Card, and fix autocomplete
  scrollIntoView/aria-selected and panel-toggle focus restore"
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-05 review. A cluster of shared UI-package
  correctness/a11y defects: router/src/index.ts:89 injects app-supplied
  formatError output via innerHTML unescaped (XSS sink); ds Card sets
  role=button+tabIndex on a div with no onKeyDown (Enter/Space dead - and it is
  the reference pattern consumers copy, live in the OfficeHours template);
  components autocomplete never scrolls the highlighted option into view or sets
  aria-selected; panel-toggle never restores focus on close. Serves the
  consuming local-first app strategies (multi-serves per the placement doctrine,
  re-pointed 2026-07-06): router/ds/components are load-bearing for office-hours
  (strategy-attention-surface), budget (strategy-recover-finance), and
  print/audio (strategy-recover-attention); office-hours remains the most
  exposed consumer."
reading: null
gap: null
serves:
  - strategy-attention-surface
  - strategy-recover-finance
  - strategy-recover-attention
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-shared-ui-correctness
  pr: 2810
  attempts: {}
  markers:
    - qa-done
    - reviewed
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# shared UI packages: router escape + Card keyboard + a11y fixes

## Context

A cluster of shared UI-package correctness/a11y defects, verified 2026-07-05.
The Card defect is the reference pattern consumers copy (live in the
OfficeHours template). Units 4-5 fold in two adjacent ds-package findings
(footer badge styling, chart fallback freeze) previously misfiled in
`tactic-review-low-severity-sweep` at higher severity than a "low" sweep
warrants.

## Unit 1 — router error output escaping (XSS)

**Recommended model:** sonnet

Scope:
- `packages/router/src/index.ts:89-94`: the render-error path assigns
  app-supplied `formatError(error)` output via `innerHTML` with no escaping;
  an error message carrying attacker-influenced text executes as markup.
  Assign via `textContent` (or escape).

## Unit 2 — interactive Card keyboard handler

**Recommended model:** sonnet

Scope:
- `packages/ds/src/core/Card.tsx:35-42`: an interactive Card sets
  `role="button"` + `tabIndex=0` on a div with no `onKeyDown`, so Enter/Space
  do nothing. Add an `onKeyDown` that fires `onClick` for Enter/Space.

## Unit 3 — autocomplete + panel-toggle a11y

**Recommended model:** sonnet

Scope:
- `packages/components/src/autocomplete.ts:74-83`: `updateSelection` never
  calls `scrollIntoView` (list is scrollable) and `role="option"` items never
  get `aria-selected`; with >~7 options the highlight moves below the fold
  invisibly. Add both.
- `packages/components/src/panel-toggle.ts:27-35`: Escape/outside-click
  `close()` never restores focus to the toggle. Restore it.

## Unit 4 — ds footer badge has no styling

**Recommended model:** sonnet

Scope:
- `packages/ds/src/templates/footer.ts:2`: ds ships
  `<img … class="cc-badge">` but no `.cc-badge` CSS; five consumers each
  carry their own copy of the styling, and office-hours (which renders
  `PageShell` at `office-hours/src/App.tsx:17`) has none — its production
  footer badge renders unstyled at intrinsic 88×31. Add the `.cc-badge`
  CSS to ds itself as the single source, and remove the per-consumer
  copies where they duplicate it.

## Unit 5 — BudgetPaceChart fallback can freeze near-invisible

**Recommended model:** sonnet

Scope:
- `packages/ds/src/charts/BudgetPaceChart.tsx:78` +
  `packages/ds/src/charts/chart-util.ts:20,31,48`: first render runs on a
  detached node (width falls back to 640, theme fg falls back to `#ddd`),
  and the corrective re-render is gated on
  `Math.abs(next - last) >= 1`; a real slot width within 1px of 640
  freezes near-invisible `#ddd` text on the light theme forever. Remeasure
  after mount regardless of the magnitude threshold (e.g. always
  re-measure once on the next microtask/animation frame after attach),
  rather than gating the correction on a delta that can coincidentally
  match the fallback value. No current production consumer, so this is
  hardening ahead of use, not a live-prod fix.

## Verification

- A crafted error message renders as text, not markup; keyboard Enter/Space
  activates an interactive Card; the autocomplete highlight scrolls into view
  and announces selection; closing the panel returns focus to the toggle;
  the footer badge renders styled at its intended size wherever `PageShell`
  is used; a chart rendered at a slot width within 1px of 640 does not
  freeze on the fallback theme color.
