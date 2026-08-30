---
id: tactic-supersession-retirement-sweep
kind: tactic
statement: Widen lint-verify-fence-paths.sh from verify fences to body prose,
  and add a park lane, so open nodes whose plans name a deleted skill or script
  are caught at the commit that deletes it
owner: ai
status: raw
parent: null
rationale: "Ruled 2026-08-14; mechanism corrected 2026-08-15 by the pre-commit
  adversarial review. A creation-time check keyed on the new node can only find
  cases where the NEW node is the superseder; it is structurally blind to
  supersessions that already happened. Live proof: tactic-node-ancestry-context
  sat at phase implement with a plan targeting
  .claude/skills/align-strategy/SKILL.md, deleted 2026-08-04, and was
  unexecutable. The 2026-08-14 draft specified a NEW deletion-event sweep and
  claimed no instrument existed for this class; that was false.
  lint-verify-fence-paths.sh already ships and already runs in CI on every
  commit, and missed the proof case only because its scan window is fence-scoped
  rather than body-scoped. This node is now that widening."
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
# Widen lint-verify-fence-paths.sh from verify fences to body prose, and add a park lane

## Draft context (2026-08-14 /align correction round, mechanism corrected 2026-08-15)

Doctrine home: `strategy-graph-native-dispatch`, the clarification "A
creation-time supersession check keyed on the new node cannot find supersessions
that already happened."

### The structural hole

The creation-time check is keyed on the **new** node, which bounds its blast
radius to one search per creation — that is what makes it affordable. The price
is that it can only find cases where the NEW node is the superseder. A node that
landed months ago and quietly obsoleted an open node is invisible to it forever.
The check measures precision, not recall.

### Build on the instrument that already ships

**Read this before designing anything.**
`.claude/skills/dispatch-propagate/scripts/lint-verify-fence-paths.sh` exists,
and `.claude/skills/dispatch-propagate/scripts/run-lint.sh` calls it
**unconditionally**, so it is already in CI on every commit. Its contract: fail
at the commit that orphans a fence-named path — for every non-`done` node it
extracts the ```verify blocks and asserts that every path-like token in them
still exists. It already has the trigger, the CI wiring, the `done`-node
exclusion, a token rule tuned against false positives, and a test suite
(`test-lint-verify-fence-paths.sh`).

**Why it missed the proof case, measured:** the dead reference in
`tactic-node-ancestry-context` is in a prose Scope bullet; that node's ```verify
fences begin hundreds of lines later. The lint's scan window is fence-scoped.

The 2026-08-14 draft recorded that the proof case was found "not by any
instrument" and specified a parallel sweep fired by deletion events. Both were
wrong: the instrument exists, and **nothing in this repository emits a deletion
event** — which the shipped guard sidesteps by running on every commit instead.
Minting a second scanner would have given the repo two notions of a stale path.

### Scope

- **Unit A — widen the scan window.** Add a second pass over **non-fence body
  prose**, restricted to backticked path tokens under `.claude/**` and
  `packages/**`. Reuse the existing token rule rather than inventing a second
  one; it was already designed against false positives, and prose is noisier
  than a fence, so the restriction to backticked tokens is load-bearing.
- **Unit B — add a park lane.** Today a match only reddens CI. A match on an
  **open** node should also park it, with a recommendation naming what was
  deleted and when. Park only — it never closes, consistent with the ruled
  record-never-close-unattended disposition.
- Reuse `packages/intentionsutil/scripts/lib-deleted-node-ids.ts`, the existing
  git-derived deleted-set helper, generalized from node ids to file paths.
- Keep the `done`-node exclusion exactly as it is. See below.

### The `done`-node exclusion is deliberate — do not remove it

`done` bodies are historical archives by design and may legitimately name paths
that no longer exist; the shipped lint's header says so. The 2026-08-14 draft
named `tactic-align-tactics-mechanical-floor` as residue this sweep would
catch — it is at `phase: done`, so it is a case this sweep is built **not** to
touch. That citation is withdrawn. If stale references inside `done` bodies are
worth solving, that is a different instrument with a different rationale, and it
is not ruled here.

Residue that IS in scope and still open: `tactic-align-strategy-new-steps-revision`
(`phase: null`), scoped entirely to editing the deleted skill.

### No dependency on the schema change

The 2026-08-14 draft set `blocked_by: [tactic-supersession-edge-and-terminal]`
"for the edge it records alongside the park". **Removed 2026-08-15.** This node's
scope is park-only, and a park writes `office_hours` — no schema change is
required, so sequencing the one remediation with a proven live victim behind a
schema-plus-router change was unjustified. If a `superseded_by` write is wanted
alongside the park later, that is a follow-on unit and the dependency belongs on
the unit, not on the node.

## Measurements preserved from the office-hours park, cleared 2026-08-30

This node was parked 2026-08-21 **solely** on `strategy-graph-native-dispatch`'s
armed maintenance-burden band condition — the park's own text says "NOTHING ELSE
BLOCKS THIS NODE — this park is about the strategy's band, not about this
record." The author ruled that band on 2026-08-28, and the ruling un-parks every
node held solely on the band breach, so the park was cleared.

Clearing a park nulls `office_hours`, and the park carried measurements that are
inputs to this plan and are not cheap to re-derive. They are restated here so the
clear does not destroy them. Everything below is dated to when it was measured —
re-measure before relying on a count, but do not redo the design work.

### The widening was prototyped, and it is precise

Measured 2026-08-21 at origin/main `53eefa33`: a prototype prose pass —
backticked tokens matching `^(\.claude|packages)/`, then the **same** `-e` and
`EVER` gates the shipped lint already applies — was run over all **586** non-`done`
nodes. It produced **28 hits across 24 distinct nodes**, every one hand-verified a
genuine orphan: **zero false positives**. It also catches the live proof case.

The corpus has since moved (573 non-`done` nodes at 2026-08-30), so the 28 is a
figure for that run, not a current count. The zero-false-positive result is the
load-bearing finding — it is what says the backticked-token restriction is tight
enough to ship.

The four commits that deleted the referenced paths:

| commit | date | hits | what it deleted |
| --- | --- | --- | --- |
| `c845d50f` | 2026-08-04 | 9 | align consolidation |
| `c3c229f0` | 2026-08-12 | 8 | token-audit retirement |
| `edc11dc4` | 2026-08-04 | 5 | `packages/intentionsutil/SCHEMA.md` |
| `0eb87735` | 2026-07-14 | 1 | — |

### Two consequences the plan must carry, not re-derive

1. **The pre-existing violations must be swept or grandfathered in the same
   change.** The shipped baseline is `[]` and its header says it must not grow, so
   widening the scan without disposing of the existing hits lands a red CI on the
   change that widens it. Decide sweep-or-grandfather as part of this plan, not
   after.
2. **The park lane must be fenced to `kind: tactic`.** One of the 28 hits sits on
   `strategy-graph-native-dispatch` **itself**. The park lane must never park a
   strategy.

### Authorability, verified rather than assumed

The park recorded these as checked live rather than presumed. Re-verified
2026-08-30 at origin/main, with anchors re-derived:

- The doctrine home (clarification 248) is ruled and internally consistent.
- The instrument this node widens ships and is wired **unconditionally** into CI:
  `.claude/skills/dispatch-propagate/scripts/lint-verify-fence-paths.sh`, called
  at `.claude/skills/dispatch-propagate/scripts/run-lint.sh:155`.
- The reuse target still exists:
  `packages/intentionsutil/scripts/lib-deleted-node-ids.ts`.
- The live proof case still holds: `tactic-node-ancestry-context` names
  `.claude/skills/align-strategy/SKILL.md` in three places, and that skill is
  confirmed absent from disk.

### Where this sits in the batch

Un-parked 2026-08-30 as part of the dispatch/RSI serialized PR batch. It returns
to the router as a `phase: null` draft with a complete plan body — the next step
is `/align-tactics tactic-supersession-retirement-sweep` to finalize it, not a
fresh planning round. The three immaterial Side-B observations from the
2026-08-21 round remain on
`tactic-supersession-retirement-sweep-drift-observations`.
