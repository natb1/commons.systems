---
id: tactic-eval-finding-skipped-locked-exit-zero-chained-caller-proceeds
kind: tactic
statement: skipped-locked and skipped-in-flight are documented lost writes but
  exit 0 like landed and noop, so a caller chaining on exit status proceeds as
  if the write succeeded — one --resolved-by loss let the chained --retire
  retire an entry with no resolved_by
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
    - metric: lost-writes-passed-as-success
      value: 1
      unit: writes
      window: single-run
      sensor: dispatch-eval-finding stdout
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: dispatch-eval-finding stdout
      measured: 2026-08-14
---
Recorded 2026-08-14 from a write that was actually lost during the PR #3090
retirement run, not from a hypothesis. The concrete instance was recovered by
hand; the shape that allowed it was not.

## The defect

`skipped-locked` is documented honestly. `dispatch-eval-finding:205-208` states
it is "a LOST occurrence, not a deferred one" — nothing was read, nothing was
written, and nothing will re-invoke.

But it **exits 0**, and so does `landed`, and so does `noop`. The token carries
the whole signal; the exit code carries none of it. A caller that branches on
exit status — which is every caller that uses `&&`, `set -e`, or an unchecked
sequential invocation — proceeds as though the write succeeded.

## The evidence

While recording resolutions for the fourteen slugs, the pair for each slug was
run as `--resolved-by … && --retire`. On `eval-since-bound-excludes-worker` a
concurrent writer held the graph-write mutex:

```
--resolved-by 1092a403…  → skipped-locked   (exit 0; nothing recorded)
--retire                 → landed           (ran because && saw exit 0)
```

The entry was retired to `phase: done` carrying **no `resolved_by` at all** — the
one field `--list-retirable` filters on, permanently absent on an entry that can
no longer appear in that list because it is already retired. Re-running
`--resolved-by` alone recovered it (`landed`), but only because the token was
read by eye in the transcript.

## Why the existing precedent does not cover it

PR #3090's Unit D drew exactly this distinction one level up: it split the
in-flight refusal out of `noop` into its own token, `skipped-in-flight`, so a
caller could tell "your intent was satisfied" from "nothing was recorded". That
fixed the **token**. It left the **exit code** undiscriminating, and the usage
block still reads:

```
dispatch-eval-finding:298
  exit: 0 landed / no-op / skipped-locked / skipped-in-flight, …
```

Four outcomes, two of them documented losses, one exit code.

`/rsi` — the principal caller — is fire-and-forget with its transcript
discarded. It cannot read the token by eye, which is the only way the loss is
currently detectable.

## The remedy, and its cost

Give the two lost-write tokens a distinct non-zero exit so a caller can branch
without parsing stdout. This is a contract change: `.claude/skills/rsi/SKILL.md`
documents the exit codes at `:256` and `:287`, and any caller that currently
treats non-zero as failure would begin treating a lock loss as one — which is
arguably correct, since it is one.

The cheaper alternative is to leave exit 0 and make every caller parse the token,
which is what the current contract already demands and what the fire-and-forget
caller structurally cannot do. That the loss survived Unit D's pass on the
neighbouring token is the argument for the exit code rather than more prose.
