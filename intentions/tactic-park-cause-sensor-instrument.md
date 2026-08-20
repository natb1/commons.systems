---
id: tactic-park-cause-sensor-instrument
kind: tactic
statement: Migrate the park-cause signal clause from
  strategy-graph-native-dispatch to strategy-discovered-requirements and
  implement the sensor that reads it, in one PR that changes the node,
  read-sensors.ts's LIFECYCLE_SENSOR_NAME and its test guard together
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-08-12 /align interview that recorded the
  self-consistency condition on strategy-graph-native-dispatch. That round
  appended a park-cause sensor to this strategy's success_signal.sensor prose,
  on the author's decision to register a sensor rather than defer its design.
  MEASURED THAT ROUND: the align-strategy-census sensor counter read 19/53
  sensor-naming strategies with 45 unregistered both BEFORE and AFTER the append
  — proving the append de-registered nothing (the recorded hazard it was checked
  against), but equally proving it registered nothing: this strategy's sensor
  prose was already one of the 45 unregistered, because read-sensors matches the
  ENTIRE success_signal.sensor string against a set of registered Sensor names
  (packages/intentionsutil/scripts/read-sensors.ts:1226, exact full-string
  match), and no Sensor is registered under this strategy's long prose string.
  So the observable and threshold are recorded but no reading will ever be
  produced for them until a Sensor is implemented and registered under that
  exact name. This tactic is that work. It was filed by the recording session
  itself rather than deferred, because leaving a recorded sensor with no
  instrument would reproduce precisely the defect the same round's new condition
  forbids — a round leaving output a downstream session cannot act on. Scope
  note for the planning session: decide deliberately whether to register under
  the existing long prose string or to shorten success_signal.sensor to a stable
  short name, which is a rewording of registered-sensor prose and therefore
  carries the de-registration hazard in its own right. RE-POINTED AND WIDENED
  2026-08-14 by the round that closed out the 2026-08-13 re-homing. serves moves
  from strategy-graph-native-dispatch to strategy-discovered-requirements,
  because the signal this tactic instruments now lives there: the 2026-08-13
  /align round carried the /align recording-round charter, and with it the
  park-cause observable and threshold, onto strategy-discovered-requirements,
  whose success_signal.sensor records itself as UNINSTRUMENTED and names this
  tactic as the one that would implement it. Scope widens from 'implement a
  sensor' to 'perform the migration', because the clause is NOT merely
  uninstrumented — it is still physically embedded in
  strategy-graph-native-dispatch's success_signal.sensor and threshold, so the
  same signal is now recorded in two places and read in neither. That is the
  residue the 2026-08-13 round could not land: graph-commit is intentions/-only,
  and the sensor string is mirrored character-for-character by read-sensors.ts's
  LIFECYCLE_SENSOR_NAME (packages/intentionsutil/scripts/read-sensors.ts:475)
  under a test guard, so removing the clause from the node without the paired
  code change breaks the guard. This tactic is the PR-lane carrier for that
  pair."
reading: null
serves:
  - strategy-discovered-requirements
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
# Migrate the park-cause signal clause from strategy-graph-native-dispatch to strategy-discovered-requirements and implement the sensor that reads it, in one PR that changes the node, read-sensors.ts's LIFECYCLE_SENSOR_NAME and its test guard together

## Why this is one PR and not two

The park-cause clause is recorded in **two** places today and read in
**neither**. Splitting the work would leave one of those states standing:

- `strategy-graph-native-dispatch.success_signal.sensor` still carries the
  clause "a park-cause reading over `office_hours.reason` across parked nodes
  counts `/align-tactics` parks attributable to an upstream recording round's
  own record gap", and its `threshold` still carries the matching "parks
  attributable to an upstream recording round's own record gap trend to zero".
- `strategy-discovered-requirements.success_signal` carries the same observable
  and the same threshold, with its `sensor` field stating in prose that it is
  UNINSTRUMENTED and that migrating the clause "needs a paired code change
  outside `intentions/` and is owed".

The 2026-08-13 round that re-homed the `/align` charter deliberately left the
clause behind, because `graph-commit` lands `intentions/` only — it would have
pushed the node edit and silently dropped the code half. That is the same
mechanism recorded on
tactic-align-skill-draft-selectability-stale-prose, which cost a
false "done" and a reverted phase. This tactic is the PR-lane carrier that lets
the pair land together.

### Binding sequencing ruling (2026-08-14) — the PR carries the graph edit too

Do **not** read "graph-commit cannot carry the code half" as "the graph half
must therefore land separately, by graph-commit." It must not. A normal PR
branch may edit `intentions/` freely; the direct-push restriction is a rule
about what an `/align` round may push, not a claim that PRs cannot touch the
store. Precedent: `717742b9` ("Instrument dependency-justification audit as
strategy-owned-web-platform's sensor") landed the strategy's `success_signal`
edit, a new sensor implementation, and its `read-sensors.ts` registration in
**one** commit — the exact shape this work needs. Mixed graph+code commits are
ordinary here (6 in the last 400).

Both split orderings are mechanically illegal, so this is not a stylistic
preference:

- **Code first, graph after.** `test/lifecycle-sensor.test.ts:326-330` reads
  the real node out of `intentions/` and asserts
  `node.success_signal.sensor === LIFECYCLE_SENSOR_NAME`. A branch that changes
  only the constant still carries the old node string, so the guard is red on
  the PR and it cannot merge.
- **Graph first, code after.** The same guard then fails on `main` the moment
  `graph-commit` pushes the node edit — a red trunk until the follow-up lands.

The atomic unit is therefore exactly: gnd's `sensor` + `threshold`, the
`LIFECYCLE_SENSOR_NAME` constant, and the guard's expectation, in one commit.

**Preferred decomposition — split at the coupling, not at the file type.**
Scope steps 3 and 4 (implement the park-cause `Sensor`, register it under a
short name) have *no* coupling to the guard at all, because the driver iterates
NODES: a registered sensor that no node names simply never fires, so it is inert
until something declares it. Land them as a code-only PR first, reviewed on the
sensor's own merits. Then land the swap as a second, deliberately tiny mixed PR
(two node fields, one constant, one expectation) where the whole diff is the
risky part and nothing else competes for the reviewer's attention.

**Fingerprint cost, measured 2026-08-14 — negligible, do not let it drive the
design.** Editing either `success_signal` changes that strategy's
`strategyFingerprint` and freezes its stamped open children.
`strategy-discovered-requirements` has 4 open children and **0** carry a
non-null stamp; `strategy-graph-native-dispatch` has 184 open children and
exactly **1** does — `tactic-strategy-fingerprint-stamp-coverage`, itself at
`phase: qa` and itself the tactic that exists to raise stamp coverage. Re-measure
before landing rather than trusting these numbers, but at this coverage the
freeze argument cannot justify contorting the sequence.

## The coupling that forces the code change

`packages/intentionsutil/scripts/read-sensors.ts:475` defines
`LIFECYCLE_SENSOR_NAME` as a string literal mirroring
`strategy-graph-native-dispatch`'s `success_signal.sensor`
**character-for-character**, including the curly apostrophe in "round's" and the
parenthetical "(the reading that surfaced three such parks on 2026-08-12)".
`read-sensors` matches the ENTIRE `success_signal.sensor` string against
registered `Sensor` names by exact full-string equality, so any edit to the node
string de-registers the lifecycle sensor unless the constant changes in the same
commit. `packages/intentionsutil/test/lifecycle-sensor.test.ts` guards the
equality, so an unpaired edit fails CI rather than silently de-registering — the
guard is working as intended and must not be weakened to let a partial change
through.

## Scope

1. Remove the park-cause clause from
   `strategy-graph-native-dispatch.success_signal.sensor` and the matching
   trend-to-zero clause from its `threshold`, leaving the lifecycle sensor
   describing only what it actually reads (the census population and the
   selection log).
2. Update `LIFECYCLE_SENSOR_NAME` to the new exact string, and update the test
   guard's expectation to match.
3. Give `strategy-discovered-requirements.success_signal.sensor` a real
   registered sensor name in place of its UNINSTRUMENTED prose, and register a
   `Sensor` under exactly that name.
4. Implement the reading: a park-cause count over `office_hours.reason` across
   parked nodes, counting `/align-tactics` parks attributable to an upstream
   recording round's own record gap. The 2026-08-12 reading that surfaced three
   such parks is the worked example to reproduce.

**Naming decision reserved for the planning session** (carried over from this
node's original scope note, and now sharper because the target strategy is
changing anyway): register under a stable SHORT name rather than a long prose
string. The long-prose-as-name convention is what left this signal unregistered
in the first place — 45 of 53 sensor-naming strategies were unregistered for
exactly this reason. Since step 3 is writing a new `sensor` value regardless,
the usual "rewording carries a de-registration hazard" objection does not apply
to `strategy-discovered-requirements`; it applies only to step 1's edit of
`strategy-graph-native-dispatch`, which step 2 pairs.

## Out of scope

Any change to what the threshold *means*, to the backlog band, or to the other
two clauses of the lifecycle sensor. Also out of scope: re-registering the other
44 unregistered sensor strings — that is the general problem this instance is a
member of, not this tactic's job.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

The lifecycle-sensor guard must be green (there is **no** `intentionsutil`
vitest project — `--project intentionsutil` errors with "No projects matched";
this package runs its own `vitest run` via its `test` script). Then `npx tsx packages/intentionsutil/scripts/read-sensors.ts`
producing a non-null reading for the new sensor name and the lifecycle sensor
still producing its reading. Confirm with
`npx tsx packages/intentionsutil/scripts/align-strategy-census.ts intentions`
that the registered-sensor counter increases by one and nothing else
de-registers.
