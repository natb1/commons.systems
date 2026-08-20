---
id: tactic-sensor-deregistration-gate
kind: tactic
statement: "rewording a node's prose silently de-registers the sensor bound to
  it by exact string match and nothing goes red -- validate-graph has been
  non-fatal on that condition since PR #3095 and unit-tests.yml declares
  branches-ignore of main and the graph namespace, so a write landing through
  the graph fast path is checked by neither job; the gate's shape is an
  unratified risk decision because the literal reading re-arms the repo-wide
  write outage the non-fatal change was made to prevent"
owner: human
status: raw
parent: null
rationale: "Filed 2026-08-18 as a residual of PR #3095 (graph write-path
  integrity, squash-merged to main as fe0b1c4d). PR1's closing batch could not
  carry a node create -- graph-commit's --base compare-and-swap manifest pins a
  pre-image per id, and an id with no pre-image corrupts the batch -- so the
  residuals it discovered were recorded in the PR's plan document and filed
  nowhere in the graph. This node closes that gap. PR1 narrowed the validator so
  a red sensor-registration check can no longer block every graph write -- see
  the closed ledger entry
  `tactic-eval-finding-sensor-validator-red-main-blocks-all-graph-writes`. What
  it did not do is give the DE-REGISTRATION case any failing gate at all. The
  brief scoped a node-scoped failure; what shipped is a warning on stderr. That
  is an under-delivery against the unit's own scope rather than a reviewer
  preference, which is why it is filed rather than dropped."
reading: null
serves:
  - strategy-recursive-self-improvement
  - strategy-graph-integrity
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "The remedy has two candidate shapes with materially different risk, and
    choosing between them is an owner decision, not an implementation detail.
    (1) A node-scoped fatal inside the guard -- fail when a sensor name was
    bound at origin/main and is unbound after this write -- is the literal
    reading of the original scope and gates at write time, but it puts a NEW
    origin/main read inside the one job whose failure mode is repo-wide write
    denial. That failure mode is the 2026-08-14 outage (54 minutes, three
    blocked writes, none of them about sensors) that the PR #3095 non-fatal
    change exists to prevent; getting shape (1) wrong re-arms it exactly. (2) A
    post-merge check on main cannot deny any write, so it cannot re-arm the
    outage, but it detects only after the fact and needs a new workflow --
    nothing currently runs on a main push outside path-scoped deploys. Do not
    implement either without a ruling."
  since: 2026-08-18
  recommendation: "Carried from PR #3095's post-merge review: take (2) first to
    establish a detection floor that cannot deny a write, then (1) later as the
    real write-time gate once its origin/main read has a proven failure-open
    path. Ratifying that ordering is enough to unpark this node; ratifying (1)
    alone is not, because the failure-open behaviour of its origin/main read is
    the whole risk."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# A de-registered sensor must make something go red

## The decision this node is parked on

**Two candidate gate shapes. One of them can take the repository's writes
down. Ratify a direction before any code is written.** The park reason and
recommendation carry the full argument; this section states the choice.

1. **Node-scoped fatal inside the guard.** Fail the write when a sensor name
   was bound at `origin/main` and is unbound after this write. This is the
   literal reading of the original scope and it gates at write time — the only
   shape that can actually stop a de-registration from landing. The cost: it
   adds a **new `origin/main` read inside the one job whose failure mode is
   repo-wide write denial**. That failure mode is not hypothetical; it is the
   2026-08-14 outage, 54 minutes, three blocked writes, none of which were
   about sensors.
2. **Post-merge check on `main`.** Cannot deny a write, so it cannot re-arm the
   outage. It detects after the fact, and it needs a **new workflow** —
   nothing currently runs on a `main` push outside path-scoped deploys.

The recommendation carried from PR #3095's review is **(2) first, (1) later**,
but that is a recommendation and not a ruling. Note what ratifying (1) alone
would leave unsettled: the whole risk is the *failure-open behaviour* of its
`origin/main` read, so approving the shape without approving what it does when
that read fails settles nothing.

## Context

Sensor binding is by **exact string match against node prose**. Reword the
node, and the sensor silently unbinds — the node's `reading` goes `null` and
nothing else changes.

Since PR #3095 nothing catches that:

- `validate-graph` was deliberately made **non-fatal** on this exact condition,
  so it can never go red on it. Its own output says so:
  `0 unbound (reported on stderr, never fatal)`.
- `.github/workflows/unit-tests.yml:5` declares
  `branches-ignore: [main, 'graph/**']`, and `graph-validate` lives in that
  same workflow. **A write that lands through the graph fast path runs neither
  job.**

So a reword lands green while the sensor reads `null`, leaving one stderr line
in a guard log nobody reads.

The narrowing itself was right and is not in question — see the closed ledger
entry
`tactic-eval-finding-sensor-validator-red-main-blocks-all-graph-writes`. The
problem is that the brief scoped a *node-scoped failure* and what shipped is a
*warning*. This node exists because that is an under-delivery against the
unit's own scope, not a reviewer's preference, and it should be visible in the
graph rather than only in a PR comment.

## Scope, once a direction is ratified

Under **(1)**: the guard in the graph fast-path job. It must compare the
sensor-name bindings at `origin/main` against those after the write, and fail
only on names that were bound and are now unbound — never on a name that was
never bound, which is the case `validate-graph` already reports non-fatally.
The `origin/main` read must have an explicitly chosen and tested behaviour when
it fails; failing **closed** there is what caused the 2026-08-14 outage.

Under **(2)**: a new workflow triggered on `main` push, reading the same
binding comparison against the previous commit. No change to any job that can
deny a write.

Either way, out of scope: the sensor registry itself
(`packages/intentionsutil/scripts/read-sensors.ts`) and the choice of which
sensors exist. This is about detecting an *unintended* unbinding, not about
sensor coverage.

## Reuse

- The existing sensor-registration reporting in
  `packages/intentionsutil/scripts/validate-graph.ts` already computes the
  registered/unbound sets. Whatever gate is built should consume that
  computation rather than re-deriving binding from prose a second way — two
  independent notions of "bound" is how this class of defect returns.
- `.github/workflows/graph-fast-path.yml` (shape 1) and
  `.github/workflows/unit-tests.yml` (the `branches-ignore` declaration that
  creates the blind spot) are the two files that define the current coverage
  gap; read both before designing either shape.

## Verification

No `verify` fence: the change is not designed yet, and a fence written now
would assert against a shape that may not be chosen.

The test that matters for either shape is the same, and it is a *demonstration*
rather than an assertion: take a node with a bound sensor, reword the prose the
binding depends on, push it the way real writes are pushed — through the graph
fast path, not a feature branch — and confirm something goes red. A gate that
only fires on a branch that already runs `unit-tests` has not addressed this
node, because that branch was never the blind spot.
