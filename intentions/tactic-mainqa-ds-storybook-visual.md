---
id: tactic-mainqa-ds-storybook-visual
kind: tactic
statement: Human visual smoke of the ds Storybook — IBM Plex fonts load, design
  tokens apply, and every component's variants are visually distinguishable
owner: human
status: delegated
parent: null
rationale: "Migrated 2026-07-06 from the legacy gh main-qa queue (target-state
  review, second sweep): issue 2524. The ds design system underpins every
  product surface and the design-canvas interview aids; visual fidelity (fonts,
  tokens, variant distinguishability) has no CI coverage — no CI runs Storybook
  — and needs a human in a browser."
reading: null
gap: null
serves:
  - strategy-show-not-tell
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours:
  reason: human visual judgment in a local Storybook browser session (~15 min) —
    no CI runs Storybook
  since: 2026-07-06
pace_exempt: false
rounds: null
attributes: {}
---
# Human visual smoke of the ds Storybook — IBM Plex fonts load, design tokens apply, and every component's variants are visually distinguishable

## Context

Migrated 2026-07-06 from the legacy gh main-qa queue during the target-state
review (second sweep). Source issue (closed, content preserved here): 2524 —
needs-main residue from the ds component work (issue 2510, PR 2517). No CI
runs Storybook, and visual fidelity cannot be judged by automated tooling.
Operational note: the dev server needs `optimizeDeps.esbuildOptions.target:
es2022` alongside `build.target` (known crash otherwise); never
`pkill -f storybook`.

## Verification checklist

1. Run `npm run storybook --prefix packages/ds` against main and open each
   component story in a browser.
2. IBM Plex fonts load (text renders in IBM Plex, not a fallback system
   font).
3. Design tokens (colors, spacing) apply and match the ds token definitions.
4. Each component's story variants are visually distinguishable (e.g. Button
   primary vs secondary vs ghost differ).
5. No unstyled or broken stories anywhere in the Storybook UI.

## Completion

Pass → `phase: done` (prune). Broken → author an implement tactic with the
finding and prune this one. Clear the park by committing the outcome to this
node.
