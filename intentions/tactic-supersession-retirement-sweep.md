---
id: tactic-supersession-retirement-sweep
kind: tactic
statement: Widen lint-verify-fence-paths.sh from verify fences to body prose, and
  add a park lane, so open nodes whose plans name a deleted skill or script are
  caught at the commit that deletes it
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
