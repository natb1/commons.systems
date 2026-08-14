---
id: tactic-graph-commit-orphan-refusal-misattributed-content-failure
kind: tactic
statement: graph-commit collapses an ORPHANED required check row into the same
  rc 2 as a check that genuinely concluded non-success, so a GitHub reporting
  artifact reaches the operator as 'the commit content fails CI; not retrying
  (fix the content and re-run)' — the one remedy that cannot work — while the
  remedy that does work (re-push, which mints a fresh check suite) is never
  attempted and the graph write is abandoned
owner: ai
status: raw
parent: null
rationale: "Observed 2026-08-14 landing the /align round that retired the
  finding ledger. await_checks promotes an unconcluded row under an
  already-concluded parent suite from pending to a hard refusal
  (graph-commit:1666-1671) — correct as a stop-waiting decision, and exactly
  what tactic-orphaned-check-run-pins-pending-ci-guard shipped on 2026-08-13 to
  end the futile green-wait. The defect is where that refusal is ROUTED, not
  that it fires. Its documented return contract already names two causes for one
  code: rc 2 means a required check CONCLUDED non-success 'OR a required check
  is ORPHANED' (graph-commit:1585-1588). The caller cannot tell them apart, and
  its die() hardcodes only the first reading: 'a required check concluded
  non-success for $sha — the commit content fails CI; not retrying (fix the
  content and re-run)' (graph-commit:2325). Both halves are wrong for an orphan:
  the content did not fail CI, and not-retrying is the opposite of the correct
  response. The two causes need opposite handling — a genuine red check is
  deterministic and reproduces on every retry, while an orphan is a property of
  one check suite that a re-push to a new SHA dissolves. This is a distinct
  defect class from its graph-commit siblings, filed separately per the
  discipline they already follow:
  tactic-orphaned-check-run-pins-pending-ci-guard (done) is the INVERSE failure
  — an orphan read as pending, waiting forever — and this node is the overshoot
  of its fix; tactic-graph-commit-landing-signal-unreliable (main-qa) is a
  killed wrapper leaving local/remote state disagreeing, not a verdict
  misattribution; tactic-graph-commit-noop-landing-false-failure (done) is a
  row-counting gate on an already-stamped SHA. None covers a correctly-detected
  orphan routed into the content-failure exit."
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
attributes:
  first_seen: 2026-08-14
  measured_impact:
    - metric: false_content_failure_refusals
      value: 1
      unit: occurrences
      window: 2026-08-14 /align round, recurrence commit 30521c92
      sensor: align
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time (first observed occurrence)
      sensor: align
      measured: 2026-08-14
    - metric: required_checks_green_at_refusal
      value: 3
      unit: of 4 required contexts
      window: 2026-08-14 /align round, recurrence commit
      sensor: align
      measured: 2026-08-14
    - metric: manual_retries_to_land_unchanged_content
      value: 1
      unit: attempts
      window: 2026-08-14 /align round, recurrence commit
      sensor: align
      measured: 2026-08-14
---

# graph-commit reports a correctly-detected orphaned check as a content failure and refuses to retry

Recorded 2026-08-14 as an ordinary draft tactic under the merge discipline
landed the same day (`strategy-graph-native-dispatch`, "How is a finding
recorded on the graph, and does the producer change the answer?"). A
find-before-minting search over the whole open tactic set found no owner for
this root cause; the three nearest nodes are dispositioned in the rationale.

## What happened

Landing an ordinary graph write — a `measured_impact` recurrence on
`tactic-claim-containment-durable-anchor`, node YAML only — `graph-commit`
returned `verdict: not-landed`:

```
graph-commit: a required check concluded non-success for debf1757… —
  acceptance=success(1 row),
  preview-and-smoke=success(1 row),
  lint=orphaned(no conclusion, but parent check suite 86164525264 already
    concluded — GitHub will never report this row; 1 row),
  unit-tests=success(1 row)
error: … the commit content fails CI; not retrying (fix the content and re-run)
```

Three of four required contexts were green; the fourth was diagnosed, in the
same message, as a row GitHub *will never report*. The run then abandoned the
write and told the operator to fix content that no check had failed.

Re-running with byte-identical node YAML landed it as `30521c92`.

## Where the seam is

The orphan promotion itself is right, and is not what this node disputes.
`await_checks` turns a `pending` row whose parent suite has already concluded
into a hard refusal (`packages/intentionsutil/scripts/graph-commit:1666-1671`)
precisely so the caller stops waiting for a verdict that will never arrive —
the fix `tactic-orphaned-check-run-pins-pending-ci-guard` shipped on
2026-08-13 after the 2026-08-11 green-wait burned its entire budget.

The defect is that the refusal is routed into the **content-failure** exit. The
return contract already admits two causes for one code
(`graph-commit:1585-1588`):

> `2  a required check CONCLUDED non-success (deterministic — the commit
>    content itself fails CI; the caller must not retry), OR a required check
>    is ORPHANED`

The caller receives only that code, so it cannot distinguish them, and its
`die()` asserts the first cause unconditionally (`graph-commit:2325`).

The two causes want **opposite** handling:

| | genuine non-success | orphaned row |
|---|---|---|
| cause | the commit content | one check suite's reporting |
| survives a re-push? | yes — reproduces every time | no — a new SHA gets a new suite |
| correct response | stop; fix the content | re-push and re-stamp |

`graph-commit` already rebases and re-pushes for transient outcomes (rc 1), so
the machinery an orphan needs is present — the orphan is simply routed away
from it. An unattended writer strands the graph store's only sanctioned write
path on a condition that would have self-healed.

## The test pins the wrong remedy

`packages/intentionsutil/scripts/test-graph-commit.sh:1141` asserts
`grep -q 'not retrying'` on the orphan fixture, while the comment directly
above it states the intent as a diagnostic

> "so the operator sees a GitHub orphan rather than a real red check."

The detail string does distinguish the two; the headline sentence and the
remedy do not. Fixing this node therefore means **amending that assertion**,
not deleting it — the neighbouring negative case (case 8c, a still-running
suite must keep waiting) stays exactly as it is, and is the regression guard
against over-relaxing the refusal back into an unbounded wait.

## Scope of a fix

- Split rc 2 into distinct codes, or return the orphan verdict alongside it, so
  the caller can branch on cause rather than re-parsing the detail string.
- Give the orphan branch a bounded re-push-and-re-stamp, with its own attempt
  cap so a persistently orphaning repository cannot loop.
- Rewrite the operator message for the orphan case: name it a GitHub reporting
  artifact and state the remedy actually taken.
- Amend `test-graph-commit.sh:1141` to assert the new orphan behaviour; leave
  case 8c untouched.

## Honest limit on the evidence

The retry that succeeded pushed a **different** SHA onto a fresh scratch branch
and therefore a fresh check suite. That proves the second attempt passed; it
does not by itself exclude a content component in the first. A content cause is
very unlikely — the YAML was byte-identical, `validate-graph` passed locally,
and the refusal names an orphan rather than a failure — but "very unlikely" is
the accurate claim, and this node should not be read as licensing an
unconditional retry-on-orphan without the attempt cap above.
