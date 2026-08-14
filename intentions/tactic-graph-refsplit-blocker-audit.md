---
id: tactic-graph-refsplit-blocker-audit
kind: tactic
statement: Determine whether tactic-graph-ref-split's 37 blockers encode real
  dependencies or a quiescence requirement that never converges — and if the
  latter, what makes its cutover incremental instead of one-sitting
owner: ai
status: raw
parent: null
rationale: "Surfaced by the 2026-08-14 /align round (strategy clarification
  237). ref-split is phase:implement with 37 blockers, 23 still open as of
  2026-08-14, and a cutover procedure that forbids phase handoff — Units 1-8
  through to merge in one sitting or do not start, because between main losing
  intentions/ and every worktree gaining the symlink the graph tooling that
  drives the handoff is itself broken. The blocker list reads as breadth-wide
  quiescence rather than mechanism dependency, and the fleet keeps minting
  tactics, so the set may never converge. Recorded explicitly as INFERENCE from
  the list's breadth: the blockers were not read individually this round. That
  verification is this tactic's first unit."
reading: null
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
# Determine whether tactic-graph-ref-split's 37 blockers encode real dependencies or a quiescence requirement that never converges — and if the latter, what makes its cutover incremental instead of one-sitting

Draft retained from the 2026-08-14 `/align` round. Not a plan.

## What was measured, and what was only inferred

**Measured 2026-08-14** against `origin/main` — every blocker's `phase:` field read
directly: 37 blockers, **14 done, 23 open, 0 missing/pruned**. The 23 open, by
phase:

- `implement` (11): `attention-surface-instrument`, `demo-saas-acceptance`,
  `legacy-office-hours-entry-removal`, `mount-schema`, `nix-clean-system-drill`,
  `node-ancestry-context`, `office-hours-graph-read-cwd-whitespace`,
  `omit-default-serialization`, `preview-deploy-on-demand`,
  `realignment-coverage-sensor`, `schema-drift-guard`
- `main-qa` (7): `align-tactics-tactic-mode-drift-gate`,
  `dependency-justification-audit`, `graph-commit-delete-vs-edit-park-hardening`,
  `graph-tick-node-lane-auto-merge`, `manual-path-reservation-sweep`,
  `office-hours-drain-claim`, `office-hours-select-fresh-main`
- `qa` (4): `census-scripted-tick`, `tactic-delegation-classification-derivation`,
  `phase-evidence-fingerprint-bound`, `scope-fingerprint-plan-substance`
- `review` (1): `clarification-citation-ids`

**Inferred, not verified.** That this set encodes *quiescence* ("nothing may be in
flight during the cutover") rather than *mechanism dependency* ("ref-split's design
needs this to exist first") is read from the breadth of the list — `demo-saas-acceptance`,
`nix-clean-system-drill` and `preview-deploy-on-demand` have no obvious relation to
the graph store's ref layout. **The blockers were not read individually.** Verifying
that classification, per blocker, is this tactic's first unit. It may be wrong.

## Why the answer matters

`tactic-graph-ref-split`'s own cutover procedure states the constraint that makes
the blocker set decisive:

> **This node does not hand off between phases.** [...] between the moment `main`
> loses `intentions/` (Unit 8) and the moment every worktree has the `intentions`
> symlink, the graph tooling that drives the handoff is itself broken. A session
> that stops halfway leaves the fleet unable to read its own queue, and the recovery
> path (`park-node`, `office-hours-graph`) is part of what is broken. So the
> implementing session runs Units 1-8 through to merge in one sitting, or it does
> not start.

If the blockers are a quiescence requirement, they are a moving target: the fleet
mints tactics continuously, so the set may never reach zero, and the ratified
greenfield would be permanently unreachable while its interim
(`tactic-graph-commit-landing-lock`, explicitly "deleted when the ref split lands")
becomes permanent. If they are real dependencies, the count is simply progress and
nothing structural is wrong.

## The second question, only if the first answers "quiescence"

What makes the cutover incremental? The one-sitting constraint comes from a window
where `main` has lost `intentions/` but worktrees lack the symlink. Candidate
framings worth testing — none evaluated this round:

- install the symlink everywhere **first**, pointing at a `GRAPH_WT` seeded from a
  `graph-main` that is still a mirror of `main`'s `intentions/`, so no window exists;
- dual-write to `main` and `graph-main` through the cutover, making Unit 8 a
  no-reader-affecting deletion;
- keep `intentions/` on `main` permanently and take only the writer/ref changes —
  which raises the question of what the split still buys once the CI stamp is gone.

Note the interaction with `tactic-graph-commit-plumbing-default`: if the plumbing
default flips first, the stamp cost that motivated the split in the first place
(clarification 80) is unchanged — the scratch-branch CI stamp is a `main` branch-
protection cost, not a writer cost — so that flip does **not** subsume this.
