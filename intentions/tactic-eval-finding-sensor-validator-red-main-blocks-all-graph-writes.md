---
id: tactic-eval-finding-sensor-validator-red-main-blocks-all-graph-writes
kind: tactic
statement: "validateRegisteredSensorNames throws inside the graph-fast-path
  guard, whose four required contexts all declare needs: guard — so one unbound
  registered sensor name denies every graph write repo-wide, and the validator
  never runs on the main push that introduces it"
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
    - metric: graph-write-outage-duration
      value: 3246
      unit: seconds
      window: single-run
      sensor: git commit dates 1092a403..9988d11e
      measured: 2026-08-14
    - metric: blocked-graph-write-attempts
      value: 3
      unit: attempts
      window: single-run
      sensor: graph-commit stdout + check-runs on d157b904
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: graph-commit stdout + guard job log
      measured: 2026-08-14
---
Recorded 2026-08-14 from a repo-wide outage that happened, was diagnosed, and was
repaired by hand during the session that retired the fourteen slugs of PR #3090.

## The defect

`validateRegisteredSensorNames`
(`packages/intentionsutil/src/sensors.ts:78-125`) throws
`IntentionSchemaError` when a registered sensor constant matches no node's
`success_signal.sensor`. It is called from `validate-graph.ts`, which is the
`guard` job of `.github/workflows/graph-fast-path.yml`.

That workflow's only trigger is:

```
on:
  push:
    branches: ['graph/**']
```

and every other required context in it — `acceptance`, `lint`, `unit-tests`,
`preview-and-smoke` — is a stub job carrying `needs: guard`.

So a single throw in the validator fails `guard`, skips all four dependent
stubs, and leaves the scratch branch with **four required checks in a
non-success state**. `graph-commit`'s `await_checks` then refuses to land, and
does so for *every* writer in the repository, on content that has nothing to do
with sensors.

The escalation has exactly one setting: total denial of the graph write path.
There is no path by which an unbound registered name degrades to a warning, a
non-required context, or a failure scoped to the sensor subsystem.

## The occurrence — 2026-08-14, 54 minutes of repo-wide write denial

Two PRs, each green on its own branch, red when both were on `main`:

| when | commit | what |
|---|---|---|
| 11:00:48 | `de347430` (#3091) | registers `LADDER_TERMINUS_SENSOR_NAME` and **defers** placing that string on the owning node to "a later, separate step" (`packages/intentionsutil/scripts/read-sensors.ts:1184-1215`) |
| 11:29:02 | `1092a403` (#3090) | adds `validateRegisteredSensorNames`, which makes that deferral a hard error |
| 12:23:08 | `9988d11e` | binds the sensor to `tactic-ladder-terminus-owns-main-qa`; writes resume |

Neither PR could have caught it. #3091 introduced no validator; #3090's branch
CI predates `de347430` reaching `main`. A textbook semantic merge conflict,
confirmed by `git log -S` on each symbol.

The failure surfaced on the next graph write — an unrelated ledger resolution:

```
graph-commit: a required check concluded non-success for d157b904 —
  acceptance=skipped, preview-and-smoke=skipped, lint=skipped, unit-tests=skipped
```

and the `guard` log carried the real cause:

```
IntentionSchemaError: Registered sensor name(s) not recorded by any
node's success_signal.sensor:
  - "ladder-terminus census over the intention store (merged-but-not-terminal count)"
```

Check-runs on `d157b904` record three attempts, each `guard=failure` with all
four dependents `skipped`. The commit is reachable from no remote branch.

## The blind spot that let it ship green

`1092a403` merged to `main` with `guard` **never running**. Its check-runs are
CodeQL plus `deploy-and-smoke` — the graph fast path does not trigger on `main`.
The first execution of the new validator, anywhere, was against an unrelated
writer's `graph/**` scratch branch, half an hour later.

This is the same structural blind spot already documented in
`tactic-eval-finding-sensor-registry-key-prose-drift`: the graph write path and
the code test path do not overlap, so a change to the graph validator is not
exercised by the CI of the PR that makes it.

## Why this is not a recurrence of the prose-drift entry

`tactic-eval-finding-sensor-registry-key-prose-drift` is retired against
`1092a403` — this validator **is** its recorded fix. This entry is a defect in
the remedy, not another instance of the disease:

- prose drift = a node's sensor string is reworded, silently de-registering a
  working sensor; the symptom is a `null` reading and a silent skip.
- this = the guard that closes that gap converts any registry/node mismatch,
  including one that predates it, into repo-wide write denial.

Filing it against the retired slug would credit the fix with an occurrence of the
problem it solved, and would hide that the cost moved rather than disappeared.

## What a proportionate remedy looks like

The forward check is right and should stay — an unbound registered constant is a
genuine defect. What is wrong is its blast radius and its timing:

- **Fail where the change is made.** Run `validate-graph.ts` in the PR CI of any
  branch touching `packages/intentionsutil`, so a validator change is exercised
  by the PR that makes it rather than by the next unrelated writer.
- **Scope the escalation.** An unbound *registered name* denies nothing about
  the node being written. It is a defect in the registry, not in the write, and
  a writer touching an unrelated node should not be blocked by it.
- **Make the deferral checkable.** `read-sensors.ts:1184-1215` states in prose
  that a later step must bind the constant. Nothing tracked that the step was
  owed, and nothing noticed for 29 minutes that it had not happened. A registered
  name with no binding and no `unboundNames` declaration is exactly the state the
  docstring warns about, and it was reachable by simply not finishing.

Note the `unboundNames` escape hatch is **not** the remedy here. Its docstring is
explicit: it is for genuinely node-agnostic adapters, and "a node-bound sensor
that lands there stops being guarded." Silencing this case that way would have
turned a 54-minute outage into a permanently unguarded sensor.
