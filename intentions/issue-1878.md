---
id: issue-1878
statement: "ds: drift-prevention lint rule + cross-app verification pass"
owner: human
status: raw
parent: issue-1864
rationale: >-
  ### Verification pass

  - **Visual parity:** screenshot each migrated app page (landing, budget,
  audio, print) against current production; diffs should be cosmetically nil.

  - **Token purity:** grep the apps for hard-coded hex colors, px font-sizes,
  and non-token spacing; drive these to ~zero outside `packages/ds`.

  - **Weight check:** confirm only 400/700 font weights are requested anywhere
  (no medium crept in).

  - **Square check:** confirm the global `border-radius:0` reset holds and only
  the four documented radii appear — only on form controls (4px) / dialogs (6px)
  / metric cards (8px).

  - **A11y:** focus-visible amber ring on buttons, links, cards, fields;
  `aria-current` on the active nav link; `aria-invalid` on errored inputs.


  ### Drift-prevention lint rule

  - Add a lint rule (or extend the existing `oxlint` config) that flags raw
  hex/px in app code and disallowed font weights, so drift can't silently
  return.
reading: >-
  ### Verification pass

  - **Visual parity:** screenshot each migrated app page (landing, budget,
  audio, print) against current production; diffs should be cosmetically nil.

  - **Token purity:** grep the apps for hard-coded hex colors, px font-sizes,
  and non-token spacing; drive these to ~zero outside `packages/ds`.

  - **Weight check:** confirm only 400/700 font weights are requested anywhere
  (no medium crept in).

  - **Square check:** confirm the global `border-radius:0` reset holds and only
  the four documented radii appear — only on form controls (4px) / dialogs (6px)
  / metric cards (8px).

  - **A11y:** focus-visible amber ring on buttons, links, cards, fields;
  `aria-current` on the active nav link; `aria-invalid` on errored inputs.


  ### Drift-prevention lint rule

  - Add a lint rule (or extend the existing `oxlint` config) that flags raw
  hex/px in app code and disallowed font weights, so drift can't silently
  return.
gap: null
clarifications: []
tooling_goals: []
success_signal: null
---
# ds: drift-prevention lint rule + cross-app verification pass
