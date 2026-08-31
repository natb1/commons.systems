---
id: tactic-design-sync-zero-component-guard
kind: tactic
statement: Make design-sync resync fail loudly when component extraction returns
  0 instead of silently syncing nothing
owner: ai
status: codified
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy operational-mechanics
  round: the ds-bundle converter's ts-morph extraction depends on
  packages/ds/package.json's types field pointing at src/index.ts; if that field
  is removed the sync silently produces 0 components ([TITLE_UNMAPPED] on every
  story) rather than erroring. The only current guard is a prose warning in
  .design-sync/NOTES.md. Add a hard failure (exit non-zero with the NOTES.md
  remediation inline) when exported-component extraction returns 0 — per the
  repo's clear-errors-over-defensive-fallbacks rule. Retained as a draft for
  /align-tactics."
reading: null
gap: null
serves:
  - strategy-owned-web-platform
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
# Make design-sync resync fail loudly when component extraction returns 0 instead of silently syncing nothing

## Context

The ds-bundle design-canvas sync (strategy clarification 6) extracts components
from `packages/ds` via a ts-morph pass whose types-root is keyed off
`packages/ds/package.json`'s `"types": "src/index.ts"` field. That field is
**inert for consumers** (`exports["."]` + `moduleResolution: bundler` ignores
top-level `types`) but **load-bearing for the sync**: removing it makes the
converter load no entry → "exported PascalCase symbols: 0" → every storybook
title drops to `[TITLE_UNMAPPED]` and the sync silently produces zero
components. The only current guard is a prose warning in
`.design-sync/NOTES.md` (lines 6-21). This violates the repo's
clear-errors-over-defensive-fallbacks rule (`.claude/rules/code-style.md`): a
silent degradation should be a loud failure.

**Constraint that reshapes the fix (finding, this round):** the extraction code
itself lives in the *external* DesignSync tooling — `.ds-sync/resync.mjs` and
its `lib/dts.mjs` are **gitignored** (`.gitignore:57`) and not part of this
repo, so we cannot add the "extraction returned 0 → exit non-zero" check inside
the converter here. The claude-executable, in-repo realization is to guard the
**repo-side invariant the converter depends on**: assert in CI that
`packages/ds/package.json` still carries `"types": "src/index.ts"`. This
converts the silent-sync failure mode into a loud, local test failure at the
exact source of the fragility (the removable field), without depending on
external tooling. Off the strategy's signal path (no `validates` flag).

## Unit 1 — Test-guard the load-bearing `types` field on packages/ds

**Scope.** Add a unit test in the `ds` project (e.g.
`packages/ds/test/types-field-guard.test.ts`) that reads
`packages/ds/package.json` and asserts `pkg.types === "src/index.ts"`, with a
failure message that inlines the NOTES.md remediation: "packages/ds/package.json
`types` must point at `src/index.ts` — it is load-bearing for the design-sync
ts-morph extraction (removing it silently degrades the sync to 0 components /
`[TITLE_UNMAPPED]`); see `.design-sync/NOTES.md`. It is inert for consumers, so
this test is the only thing preventing a silent removal." Keep the assertion to
the single invariant; do not attempt to invoke the external converter.

Out of scope: editing `.ds-sync/**` (external, gitignored); changing the actual
sync/extraction logic; the fonts/`[FONT_MISSING]` false alarm noted elsewhere in
NOTES.md.

**Recommended model:** sonnet (a single-assertion invariant test with a precise
message; well-scoped and mechanical).

## Reuse

- The invariant and its full rationale are already documented in
  `.design-sync/NOTES.md:6-21` — the test message cites it rather than
  restating it.
- Existing `packages/ds` vitest test setup (co-locate under `packages/ds/test`).

## Verification

```verify
npx vitest run --project packages/ds --root .
```

The new test passes on the current tree. To confirm it actually guards:
temporarily delete the `types` field from `packages/ds/package.json`, re-run the
suite, observe the test fails with the NOTES.md remediation message, then
restore the field.
