---
id: tactic-eval-finding-in-flight-guard-permanent-after-execution-completes
kind: tactic
statement: The in-flight guard gates on execution == null, but execution stays
  non-null after a fix merges — so a ledger entry fixed through the normal
  dispatch pipeline can never record another occurrence, dropping every future
  recurrence to a fire-and-forget caller
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
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
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: permanently-unrecordable-ledger-entries
      value: 1
      unit: nodes
      window: graph-wide
      sensor: git grep over intentions
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: git grep over intentions
      measured: 2026-08-14
---
Recorded 2026-08-14, surfaced by inspecting why `tactic-eval-finding-lock-wait`
reports `in_flight: true` on `--list` while sitting at `phase: done` with its fix
merged since 2026-08-13.

## The defect

Three sites gate on the same predicate — `execution == null`:

```
dispatch-eval-finding:936    --retire
dispatch-eval-finding:1004   --resolved-by --body-file
dispatch-eval-finding:1166   the recurrence-record path
```

and `list_entries:453` derives its reported `in_flight` the same way.

`execution` is non-null from the moment a node is dispatched, and it **stays**
non-null after the fix merges — the completion is recorded *inside* it
(`execution.completion.mergedAt`), not by clearing it. There is no transition
that returns it to null.

So a ledger entry that was fixed through the normal dispatch pipeline is
permanently un-recordable. Every future occurrence hits `:1166`, prints
`skipped-in-flight`, and exits 0 to a fire-and-forget caller that never
re-invokes. The occurrence is dropped, forever, silently in effect.

## Why the guard is right and the predicate is wrong

The guard's stated justification (`:1163-1165`):

> Rewriting the body of a node a PR is working changes its (statement, body)
> scope fingerprint and mis-parks that session, so the occurrence is dropped
> instead — loudly, never silently.

That is correct for a **live** PR: `tacticScopeFingerprint` hashes (statement,
body), and a working session would be mis-parked. It is vacuous once
`completion.mergedAt` is set — there is no session left to mis-park.

`execution != null` is being used to mean "a fix is in flight". It actually means
"a fix has ever been dispatched". The narrowing is small and local: refuse only
when the execution is non-null **and incomplete** (`completion` null, or phase
not `done`).

## The evidence

`tactic-eval-finding-lock-wait` is the only node in the store in this state, and
it is the whole population of both membership anomalies at once:

```
git grep -L '  ledger_entry: true' origin/main -- 'intentions/tactic-eval-finding-*.md'
  → tactic-eval-finding-ledger      (the doctrine root, excluded by design)
  → tactic-eval-finding-lock-wait

git grep -L '^execution: null' origin/main -- 'intentions/tactic-eval-finding-*.md'
  → tactic-eval-finding-lock-wait
```

Its `--list` row reads `state: retired`, `unregistered: true`,
`recurrence_count: 0`, `in_flight: true`. Three of those four are the
prefix-versus-attribute disagreement flag working exactly as `:402-412`
specifies. The fourth, `in_flight`, is this defect.

The irony is load-bearing: that node exists **because** `dispatch-eval-finding`
silently dropped occurrences when a fire-and-forget caller could not re-invoke.
Its own fix shipping is what made it permanently unable to record a recurrence of
the same class of loss.

## Population is one today, and that understates it

The two routes by which a ledger finding gets fixed diverge here:

- Fixed on a **separate** branch and closed with `--resolved-by` / `--retire`
  (the fourteen slugs of PR #3090): `execution` stays null, the entry keeps
  working, and a later recurrence resumes the count as designed
  (`:294-296`).
- Dispatched as its **own** tactic with its own PR (lock-wait, PR #3074):
  `execution` is set for good, and the entry is dead to the recorder.

Nothing steers between the two routes, so the second is available to every
future entry.

## Secondary: the naming collision

`tactic-eval-finding-lock-wait` is not a ledger entry at all — it is the *fix
tactic* for the lock-wait defect, carrying the ledger's id prefix. Renaming it
out of the `tactic-eval-finding-` prefix would clear the confusing `--list` row
at zero cost. It would **not** fix the predicate above, and should not be
mistaken for doing so.
