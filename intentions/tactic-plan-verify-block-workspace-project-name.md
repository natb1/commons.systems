---
---
id: tactic-plan-verify-block-workspace-project-name
kind: tactic
statement: Plan authoring must emit full workspace-path vitest project names
  (e.g. packages/intentionsutil) in tactic Verification blocks, not the package
  basename, so /implement plan-verification does not spuriously park packages/*
  tactics
owner: ai
status: refining
parent: null
rationale: "Surfaced 2026-07-22 while draining tactic-clear-park-primitive's
  office-hours park. That node's persisted ## Verification block ran `npx vitest
  run --project intentionsutil --root .`, but the repo derives vitest project
  names verbatim from package.json workspaces (vitest.config.ts sets each
  project name to its full workspace dir), so the basename `intentionsutil`
  errors with 'No projects matched' while `packages/intentionsutil` passes.
  /implement read that as a verification failure and parked a complete, correct
  implementation. The same basename typo will recur for the next packages/*
  tactic whose plan is authored by align-tactics (or legacy plan-issue). Fix
  direction: teach the plan-authoring guidance to derive the vitest --project
  name as the full workspace path for nested packages/* projects. The sandbox.md
  verify-block convention already documents `--project <app> --root <repo_root>`
  and uses full paths for root-level apps like print; extend it explicitly to
  packages/* so authored verify blocks use the full workspace path."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Plan-authored verify blocks must use full workspace-path project names

## Context

The repo's root `vitest.config.ts` derives each project's `name` verbatim from
`package.json`'s `workspaces` entries, so a nested package's vitest project name
is its **full workspace path** (`packages/intentionsutil`), never the basename
(`intentionsutil`). A `--project <basename>` filter fails with "No projects
matched" — an environment/naming error, not a test failure.

Plan authoring (`/align-tactics`, legacy `/plan-issue`) writes each tactic's
`## Verification` `verify` block by hand. When it emits the basename for a
`packages/*` tactic, `/implement`'s plan-verification step runs a command that
can never match, reads the "No projects matched" error as a failed verification,
and parks an otherwise-complete implementation to office-hours.

Observed 2026-07-22: `tactic-clear-park-primitive` (its own draft primitive) was
parked on exactly this — its block read `npx vitest run --project intentionsutil
--root .`. The implementation was complete, pushed (PR #2903), and CI-green; the
only defect was the plan-text project name. Corrected to `--project
packages/intentionsutil` it passes cleanly. The park was drained and the typo
corrected in that node, but nothing prevents the next `packages/*` tactic from
repeating it.

## Fix direction (to refine)

Teach plan authoring to derive the vitest `--project` value as the full
workspace path for nested `packages/*` projects. `.claude/rules/sandbox.md`
already documents the verify-block convention `npx vitest run --project <app>
--root <repo_root>` and uses full paths for root-level apps (e.g. `print`);
extend it explicitly to `packages/*` and point the plan-authoring guidance
(align-tactics / plan-issue verify-block emission) at that rule so authored
blocks use the full workspace-path project name.

## Verification (to finalize during planning)

A mechanism-level check: given a `packages/*` tactic, the authored `verify`
block's `--project` value equals the package's full workspace path (matches a
`vitest.config.ts` project name), and the command runs without "No projects
matched". Exact automated form to be fixed when this draft is planned.
