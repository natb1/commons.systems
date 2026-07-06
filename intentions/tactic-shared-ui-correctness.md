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
  aria-selected; panel-toggle never restores focus on close. Serves
  strategy-attention-surface: these packages render the graph-native
  office-hours surface."
reading: null
gap: null
serves:
  - strategy-attention-surface
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
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
OfficeHours template).

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

## Verification

- A crafted error message renders as text, not markup; keyboard Enter/Space
  activates an interactive Card; the autocomplete highlight scrolls into view
  and announces selection; closing the panel returns focus to the toggle.
