---
id: tactic-phase-entry-selection-gate
kind: tactic
statement: Run the mechanical selection-validity gate (check-node-selection) at
  every phase-skill entry, not only the fresh-cut provision-node-worktree path,
  so a redundant or terminal-state selection exits cheaply before any
  session-boot work
owner: ai
status: raw
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: Waves B-D of a three-band interim
    scale (50 / 20 / 10) - dispatch-containment and evidence-custody work that
    follows the Wave-A write-path fixes. Interim scaffolding only;
    tactic-attention-tier-ranking and tactic-attention-boost-scripts retire this
    numeric scheme."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Run the mechanical selection-validity gate at every phase-skill entry

**Retained 2026-07-19** by the `/align-strategy` "track a fix for this class
of redundant execution" interview. Draft — `/align-tactics` owns
decomposition, plan schema, and the model tag.

## Context

The mechanical selection-validity gate — `check-node-selection.ts`
(`packages/intentionsutil/scripts/check-node-selection.ts`), which returns
exit 12 (stale-selection) / exit 13 (scope-stale) when a node no longer
warrants its selected phase — is wired into exactly one place:
`provision-node-worktree` (`.claude/skills/dispatch-propagate/scripts/provision-node-worktree:87`,
failing on non-zero at line 95). It is the router's start gate: a fresh-cut
worktree re-validates node state against `origin/main` before the worker
does any real work.

But the phase-skill Step-0 claim/isolate blocks (align-tactics
`SKILL.md:76-83`, align-strategy `SKILL.md` Step 0) allow **two other entry
paths**:

- native `EnterWorktree`, and
- re-entry of an **already-existing** worktree.

Both of those paths run only `assert-worktree-fresh` — a *freshness* check
(is the checkout at `origin/main`?) — and **never** `check-node-selection`.
So a phase skill entered by re-entry or native `EnterWorktree` detects a
redundant / stale / terminal-state selection **only** through the skill
body's prose "Idempotency" reasoning: an LLM judgment gate, not a mechanical
one.

### The 2026-07-18 evidence

`/align-tactics tactic-graph-main-self-heal` was re-invoked (manually, a
repeated human command) against an **already-finalized** node
(`phase: implement`, `execution: null`). The finalize run one turn earlier
had gone through `provision-node-worktree` and its gate fired correctly
(exit 12 on the wrong `implement` phase arg; passed with `align-tactics`).
The redundant re-invoke, however, ran **inside the already-existing
worktree** — no `provision-node-worktree` re-run — so the mechanical gate
never fired. The no-op was caught only by the skill's prose idempotency
reasoning. Cheap that time; a misread could instead re-plan done work.

## Requirement

The mechanical selection-validity gate must bind **every** phase-skill
entry, not just the fresh-cut provision path. Run `check-node-selection`
at entry regardless of how the worktree was provisioned, exiting cheaply
(reporting `skipped`) on a redundant / stale / terminal-state selection
**before** any Explore/Plan fan-out or session-boot work.

## Steelman considered and diverged from

The strongest rival: fix redundant dispatch only at the **selection
source** — the selector never emits a terminal-state candidate
(`tactic-freeze-resurface-stale-children-only`, PR #2895;
`tactic-materiality-scoped-freeze`, PR #2892). Rejected as *sufficient*
because a **manual** human invocation (`/align-tactics tactic-X` typed
directly) has no selector to gate it. The entry gate is the only possible
guard for that path. Selection-source fixes and the entry gate are
**complementary layers**, not alternatives — the 2026-07-18 case was
manual, so no selector-source fix could have caught it.

## Overlap to verify first

`tactic-align-skills-latest-graph-guard` (PR #2889, **not yet on
`origin/main`** at record time) is described as routing align sessions
through `provision-node-worktree`'s fetch-and-merge on re-entry. If its
re-entry routing actually re-runs `provision-node-worktree` (and therefore
`check-node-selection`), it may already close this gap as a side effect.
The first unit of any plan for this tactic must **verify that overlap
against #2889's merged behavior** and drop this tactic if #2889 fully
covers the entry gate; otherwise implement the explicit skill-entry gate.

## Reuse

- `check-node-selection.ts` — the gate itself; already returns the exit
  codes and takes `<node-id> <selected-phase>`.
- `provision-node-worktree:87` — the one existing call site to mirror.
- `assert-worktree-fresh` — the freshness check the alternate paths already
  run; the selection gate slots alongside it, not in place of it.
