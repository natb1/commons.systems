---
id: tactic-sensor-deregistration-gate
kind: tactic
statement: "rewording a node's prose silently de-registers the sensor bound to
  it by exact string match and nothing goes red -- validate-graph has been
  non-fatal on that condition since PR #3095 and unit-tests.yml declares
  branches-ignore of the graph namespace, so a write landing through the graph
  fast path is checked by neither job; the gate's shape is an unratified risk
  decision because the literal reading re-arms the repo-wide write outage the
  non-fatal change was made to prevent"
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
  preference, which is why it is filed rather than dropped.
  AMENDED 2026-08-31: the premise in the sentence above is REFUTED.
  graph-commit's --base is a per-id opt-in, not a whole-batch mode.
  check_base_freshness returns early on an empty manifest and otherwise
  iterates only the manifest's own keys, so a positional id absent from the
  manifest is simply not CAS-checked; and the ordinary-id guard asks only
  that intentions/<id>.md exist on disk, never on origin/main. The header
  documents --prune as mixable with ordinary positional ids. One invocation
  can therefore carry creates, edits and prunes together. Only the stated
  REASON was wrong: the decision it explains -- filing PR1's residuals as
  their own nodes rather than folding them into that batch -- stands on its
  own merits and is not disturbed by this correction."
reading: null
serves:
  - strategy-recursive-self-improvement
  - strategy-graph-integrity
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: pr16-node-mutation-scripts
  pr: 3138
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-30T00:43:02Z
    mergeCommitSha: 96d22cb13f56d4240305033b9ad9af76009f9ceb
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
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
   outage. It detects after the fact. Its cost was recorded as needing a
   **new workflow**, because nothing ran on a `main` push outside path-scoped
   deploys — **no longer true as of #3108**, which took `main` out of
   `unit-tests.yml`'s `branches-ignore`. `graph-validate` now runs on every
   `main` push, so (2) needs only the check, not a workflow to host it.

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
- `.github/workflows/unit-tests.yml` declares `branches-ignore: ['graph/**']`,
  and `graph-validate` lives in that same workflow. **A write that lands
  through the graph fast path runs neither job.** *(Updated 2026-08-23: `main`
  was in that list until #3108. Its removal closes the `main`-push half of the
  blind spot — `graph-validate` now runs there — but the `graph/**` half, which
  is the fast path this node is about, is unchanged. `validate-graph` also
  remains non-fatal on de-registration, so nothing goes red yet either way.)*

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

Under **(2)**: the binding comparison against the previous commit, run on
`main` push. Since #3108 this no longer needs a new workflow — `unit-tests.yml`
already triggers on `main` and already hosts `graph-validate` — so the scope is
the check itself. No change to any job that can deny a write.

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
  creates the blind spot, now `['graph/**']` only, and the host for shape 2)
  are the two files that define the current coverage gap; read both before
  designing either shape.

## Verification

No `verify` fence: the change is not designed yet, and a fence written now
would assert against a shape that may not be chosen.

The test that matters for either shape is the same, and it is a *demonstration*
rather than an assertion: take a node with a bound sensor, reword the prose the
binding depends on, push it the way real writes are pushed — through the graph
fast path, not a feature branch — and confirm something goes red. A gate that
only fires on a branch that already runs `unit-tests` has not addressed this
node, because that branch was never the blind spot.

## What shipped — 2026-08-30, shape (2), fatal

Landed in #3138 (merge commit `96d22cb1`), Position 2 of the dispatch/RSI
serialized window, as PR16 Unit 10.

The ruling is executed as recorded: **shape (2) — a post-merge check on `main`
that cannot deny a write — and it is FATAL.** Shape (1), the node-scoped fatal
inside `guard`, is not shipped and remains deliberately declined until its new
`origin/main` read has a proven failure-open path.

The fatality is **opt-in**, via a new `--strict-sensors` flag on
`validate-graph.ts`, armed at exactly one site:

- `.github/workflows/unit-tests.yml` — the post-merge `graph-validate` job,
  **with** the flag.
- `.github/workflows/graph-fast-path.yml` — **untouched and unflagged.**

### Why opt-in, and not a flag-free fatal

This is the part the plan did not name, and it is the whole difficulty of the
unit. `graph-fast-path.yml` runs the **identical** `validate-graph.ts intentions`
command in its `guard` job, and `acceptance`, `preview-and-smoke`, `lint` and
`unit-tests` all declare `needs: guard` — those four are exactly the contexts
`graph-commit` polls. Making the sensor check fatal unconditionally inside
`validate-graph.ts` would therefore have re-armed the 2026-08-14 repo-wide write
outage (54 minutes, three blocked writes, none about sensors) that PR1 Unit 2
exists to prevent.

A flag was chosen over an environment variable specifically so the divergence
between the two call sites is visible to `grep` and `diff`, rather than hidden in
a workflow `env:` block where it could silently vanish from one of them.

The write path therefore remains unable to deny, which is what makes shape (2)
safe; the detection floor is real because the post-merge job now fails rather
than printing a warning.

### Measured before arming

The live store reports **0 unbound registered sensor names**, so turning this on
does not put `main` red. Confirmed by running `validate-graph.ts intentions
--strict-sensors` against the real store: ok at 751 nodes, exit 0.

Both directions were demonstrated with real exit codes on a store seeded with a
reworded sensor name — default: warning, exit 0; `--strict-sensors`:
`IntentionSchemaError` naming the unbound name and the node it was probably
reworded on, exit 1.

### Also corrected

Two comments asserting the dead premise `branches-ignore: [main, 'graph/**']`.
`main` was removed from that list in #3108; only `graph/**` is ignored.

### Still open, unchanged by this unit

The `graph/**` half of the blind spot stays ignored, and `validate-graph` stays
deliberately non-fatal on the write path. Both are properties of the ruling, not
oversights.

**Verification:** `intentionsutil` vitest 1252/1252 across 57 files, including
two new tests covering the default-non-fatal and strict-fatal paths;
`run-typecheck.sh` 3/3; `run-lint.sh` clean.
