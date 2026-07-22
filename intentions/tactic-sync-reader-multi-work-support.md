---
id: tactic-sync-reader-multi-work-support
kind: tactic
statement: Support multi-work reading-chunk excerpts in /sync-reader — chunks
  citing passages from more than one work, currently reported unsupported
  (MULTI-WORK) instead of synced
owner: ai
status: raw
parent: null
rationale: "QA on PR #2798 (tactic-sync-reader-skill) found /sync-reader
  silently mismapped chunks whose passages span two works: it matched only the
  first passage's work against the share epubs, then mapped every passage
  against that one source. The landed fix reports such chunks as unsupported
  (clear error over silent wrong excerpt); this node tracks the systemic
  follow-up so the ~9 affected chunks reach the reader."
reading: null
gap: null
serves:
  - strategy-philosophical-grounding
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
# Multi-work reading-chunk excerpts in /sync-reader

## Context

QA of the sync-reader skill (PR #2798) found that `/sync-reader` cannot excerpt
a reading chunk whose passages cite more than one work. The CLI matched only
`passages[0].work` against the share epubs, then mapped every passage's range
against that single source — silently producing a wrong excerpt for the
non-primary passages. The landed fix reports such chunks under a `MULTI-WORK`
section as unsupported (clear error over silent corruption), but that leaves the
~9 affected chunks (priorities 3, 4, 7, 8, 14, 15, 16, 17, 18 — e.g. one citing
Aristotle *Nicomachean Ethics* IV.1 and X.7 plus *Politics* I.2) permanently
un-synced until real support lands. This node tracks that residual.

## Greenfield design

A reading chunk is a unit of reading; its passages may legitimately span works.
`/sync-reader` should build one excerpt epub per chunk that draws each cited
section from whichever source epub that passage belongs to — matching every
passage's work independently, then assembling a single multi-source excerpt.
This keeps the one-file-per-chunk unit and the graph's chunk model unchanged;
`packages/sync-reader/src/excerpt.ts` grows from single-source extraction to
multi-source assembly, and the CLI's `MULTI-WORK` unsupported branch is removed
once real support lands.

## Migration alternative

If multi-source assembly is too large a step, restructure the ~9 affected
reading-chunk nodes (owner: human) into per-work sub-chunks, each single-work
and directly syncable. Smaller code change, but it edits human-owned curriculum
nodes and multiplies the chunk count — an author decision, not a mechanical one.

## Scope

- `packages/sync-reader/src/excerpt.ts` — multi-source excerpt assembly.
- `.claude/skills/sync-reader/scripts/sync-reader.ts` — match each passage's
  work independently; drop the `MULTI-WORK` unsupported branch.
- Out of scope: reader sort order (that is tactic-sync-reader-chain-order).

## Verification

Extend `packages/sync-reader/test` with a multi-work chunk fixture citing two
works and assert one excerpt epub containing sections from both sources.

Draft tracking node (`status: raw`): needs an align-tactics pass and the
author's choice between the greenfield and the restructure path before it is
plan-ready.
