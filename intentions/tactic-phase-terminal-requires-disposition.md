---
id: tactic-phase-terminal-requires-disposition
kind: tactic
statement: A phase skill that terminates on a needs-human judgment item must
  land an office_hours park before exiting — ending a phase with the node still
  at its entry phase and office_hours null is indistinguishable from work never
  started, so releasing the node re-selects it into an identical pass that
  reaches an identical dead end, a churn loop that never converges
owner: ai
status: raw
parent: null
rationale: "Observed live 2026-07-31 during the dispatch-pipeline bootstrap, on
  two Wave A nodes at once. A /qa-fix worker on
  tactic-graph-commit-intentions-base-stale-restore ran a complete and correct
  QA pass — all six script-verifiable items green (test-graph-commit.sh 50/50,
  test-park-node.sh 21/21, test-transition-node.sh 3/3, intentionsutil vitest
  717/717, lint clean, code inspection), no defects — then terminated on one
  genuine needs-human item: whether to accept the fail-closed
  park-the-whole-invocation tradeoff in ensure_intentions_only_base()'s
  three-way-merge replay. It exited done with the node still phase: qa and
  office_hours: null. The churn was directly measured, not inferred: reaping the
  holder at 00:49Z produced a fresh worker that redid the entire pass and was
  done by 01:01Z with the node unchanged. Crucially, the second session did NOT
  simply forget to park — it drafted the park reason and a full line-numbered
  recommendation, wrote both to its job directory, and ended expecting the Stop
  hook to fire park-node; the hook did not, and the session named the mechanism
  itself: the Stop hook does not reliably fire the park after a session awaits a
  background Workflow. So the defect has two distinct shapes that must both be
  closed — a skill that never writes a disposition at all, and a skill that
  delegates the write to a Stop hook that silently no-ops. This is the same
  class as tactic-qa-fix-node-terminal-declaration, whose fix-finalize path
  declares no node-terminal marker and freezes its own node, and the fix should
  be planned against both: the general rule is that a phase terminating with the
  node at its entry phase and no disposition is an ERROR, not a normal exit, and
  should be detected mechanically rather than left to each skill's good
  behavior. Note the operational trap this creates, which is the opposite of the
  tactic-stopped-session-blocks-node playbook: reaping a done session whose node
  never advanced is what RESTARTS the loop, so a terminal session on an
  unadvanced node is a symptom to diagnose, never garbage to collect. Filed
  together with tactic-denied-command-parks-node and
  tactic-standdown-winner-liveness — all three are the same root confusion, that
  'held' and 'being worked' are not the same predicate and no code distinguishes
  them, with tactic-router-spawn-window-duplicate-worker the fourth member.
  Interim attention scaffolding only — tactic-attention-tier-ranking replaces
  the numeric scheme with lexicographic (tier, rank) and max-lifting, and
  tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks.
  blocked_by is empty, so this Wave A promotion lifts no blocker and cannot
  compound."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 50
  override: null
  rationale: "Bootstrap re-scale 2026-07-31: Wave A of the three-band interim
    scale (50 / 20 / 10) that puts write-path and pipeline-integrity work above
    ordinary feature work. Belongs in this band on the band's own criterion — it
    burns a full autonomous phase pass per iteration on a node that cannot
    advance, and it held two Wave A nodes simultaneously on 2026-07-31,
    contributing directly to the measured zero-productive-worker state.
    blocked_by is empty, so this promotion lifts no blocker and cannot compound.
    status stays raw and phase stays null so the selector emits it as an
    /align-tactics candidate for planning, not as an implement candidate."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# A phase skill that terminates on a needs-human judgment item must land an office_hours park before exiting — ending a phase with the node still at its entry phase and office_hours null is indistinguishable from work never started, so releasing the node re-selects it into an identical pass that reaches an identical dead end, a churn loop that never converges

## Context

Observed live **2026-07-31**, holding **two Wave A nodes simultaneously**.

A `/qa-fix` worker on `tactic-graph-commit-intentions-base-stale-restore` ran a
complete and correct QA pass — all six script-verifiable items green
(`test-graph-commit.sh` 50/50, `test-park-node.sh` 21/21,
`test-transition-node.sh` 3/3, `intentionsutil` vitest 717/717, lint clean, code
inspection), **no defects found** — then terminated on one genuine needs-human
item:

> "**One item needs a human**: whether to accept the fail-closed 'park the whole
> invocation' tradeoff in `ensure_intentions_only_base()`'s new three-way-merge
> replay…"

It exited `done` **without an `office_hours` park landing**, leaving the node at
`phase: qa` with `office_hours: null` — a state **indistinguishable from work
never started**.

## The churn loop was measured, not inferred

Reaping the holder at **00:49Z** produced a fresh worker that redid the **entire**
pass and was `done` by **01:01Z**, with the node unchanged at `qa`. Twelve
minutes of autonomous work to arrive at the identical dead end.

Two Wave A nodes were in this loop at once —
`tactic-graph-commit-intentions-base-stale-restore` and
`tactic-scope-fingerprint-plan-substance`, both `phase: qa`, both
`office_hours: null`.

## There are TWO distinct shapes, and a fix must close both

This is the part that a plan written from the symptom alone will miss.

**Shape 1 — the skill never writes a disposition at all.** The straightforward
case, and the one `tactic-qa-fix-node-terminal-declaration` describes for the
fix-finalize path.

**Shape 2 — the skill writes the disposition and delegates the landing to a Stop
hook that silently no-ops.** The second session on
`tactic-graph-commit-intentions-base-stale-restore` did **not** forget. It drafted
the park reason and a full line-numbered recommendation, wrote both to its job
directory (`office-hours-reason`, `office-hours-recommendation`, both still on
disk afterwards), and ended expecting the Stop hook to fire `park-node`. It named
the mechanism itself:

> "The prior pass's escalation never actually parked the node — a known infra bug
> (Stop hook doesn't reliably fire the park after a session awaits a background
> Workflow)"

So the escalation was performed correctly and still produced `office_hours: null`
on `origin/main`. A fix that only audits skill exit paths leaves shape 2 live.

## The operational trap — the opposite of the usual playbook

`tactic-stopped-session-blocks-node`'s playbook is "reap the terminal session to
free the node." Here that is exactly what **causes** the churn.

**Do not reap a `done` session whose node is still at its pre-session phase.**
Check the node's `phase` on `origin/main` and its `office_hours` *first*.
Unadvanced + unparked ⇒ diagnose, do not reap. A terminal session on an
unadvanced node is a **symptom**, not garbage to collect — and while the loop is
live, the stranded session is acting as accidental containment.

## Direction for planning (not a plan)

A phase skill that terminates on a needs-human judgment item **must** land an
`office_hours` park before exiting. More generally: **ending a phase with the
node at its entry phase and no disposition should be an error, not a normal
exit**, and it should be detected mechanically rather than left to each skill's
good behavior — every skill getting this right independently is what has already
failed twice.

Plan this against `tactic-qa-fix-node-terminal-declaration`, which is the same
class at a different call site (its fix-finalize path declares no node-terminal
marker and freezes its own node). A mechanical guard that every phase skill's
node-lane terminal path declares a disposition would close both, and shape 2
additionally requires that the landing not depend on a Stop hook that can be
skipped.

## Read this with its three siblings — do not plan it alone

`tactic-denied-command-parks-node`, `tactic-phase-terminal-requires-disposition`,
`tactic-standdown-winner-liveness` and
`tactic-router-spawn-window-duplicate-worker` are **one family**: the fleet cannot
reliably tell whether a node is being worked on. Same root confusion — **"held"
and "being worked" are not the same predicate, and no code distinguishes them.**
