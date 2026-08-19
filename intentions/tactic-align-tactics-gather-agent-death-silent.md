---
id: tactic-align-tactics-gather-agent-death-silent
kind: tactic
statement: "Observation carrier from the 2026-08-19 /align-tactics tactic-mode
  round on tactic-reclaim-audit-spawn-handoff-expired-count: the gather phase's
  clause-coverage evidence agent died on a StructuredOutput retry cap and the
  drift review proceeded on empty Side-A evidence with no signal in the returned
  result — plus two instrument-design generalizations that round surfaced as
  immaterial drift"
owner: human
status: delegated
parent: null
rationale: null
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
office_hours:
  reason: "Observation carrier, not planned work — three observations from the
    2026-08-19 /align-tactics tactic-mode round on
    tactic-reclaim-audit-spawn-handoff-expired-count that have no legal
    autonomous destination. (1) MECHANICAL DEFECT, measured this round: the
    gather phase's clause-coverage evidence agent (align-tactics.js, the
    `clause` gather job) failed with `StructuredOutput retry cap (5) exceeded —
    5 failed calls with no valid output` against a payload of 30 conditions + 9
    clarifications. The aggregation at align-tactics.js:1096-1120 guards every
    gather result with `if (!res) return;`, so clauseEvidence stayed at its
    `{reuse_candidates: [], notes: ''}` default and the Opus drift agent ran
    Side-A with no per-clause repo evidence. The returned `result` carries NO
    field recording that degradation — `drift.proceed` was true, `parks` empty,
    `deviation` false — so the caller can only learn of it from the Workflow
    tool's `failures` line, and a caller who does not read that line lands a
    round whose two-sided drift review was half-blind. The null-guarding itself
    is deliberate and documented (tactic-align-tactics-workflow, phase done,
    body line 226); what is untracked is that the degradation is SILENT. (2) and
    (3) are the round's two immaterial Side-B drift observations, both already
    absorbed into that tactic's own plan, recorded here for their generalizable
    form only — see the body. No autonomous lane may write these to the serving
    strategy's clarifications (clarification 245 / V1, which overturned
    clarification 118), and a tactic-target session never touches the serving
    strategy's frontmatter at all, so this carrier is their destination."
  since: 2026-08-19
  recommendation: "Disposition each of the three separately at office hours; they
    are independent. For (1), the mechanical defect, the choices are: (a)
    MECHANIZE — have the Workflow record gather-agent deaths in the returned
    result (e.g. a `gather_degraded: [<kind>, ...]` field) and make the drift
    prompt state which evidence sources are empty, so the caller can park or
    re-run instead of landing blind; (b) HARDEN — shrink the clause agent's
    per-call obligation (chunk conditions, or drop the schema for a text return)
    so a 30-condition strategy stops exceeding the retry cap, treating this as a
    payload-size defect rather than an observability one; (c) DROP — decide a
    dead clause agent is an acceptable degradation because the drift agent has
    Read access and its own tools, in which case record that ruling so the next
    round does not re-file this. (a) and (b) are complementary, not exclusive.
    For (2) and (3) the choice is clarify-only versus drop: neither needs code,
    and the concrete work each describes is already done in
    tactic-reclaim-audit-spawn-handoff-expired-count's plan. Promote them into
    strategy clarifications through the attended /align surface only if the
    generalization is wanted as doctrine. This node carries NO plan and must not
    be dispatched."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
## What this node is

An **observation carrier**, born parked. It holds three observations from the
2026-08-19 `/align-tactics` tactic-mode round that finalized
`tactic-reclaim-audit-spawn-handoff-expired-count`, none of which had a legal
autonomous destination.

**It carries no plan and must not be dispatched.** Its `owner` is `human` and
its `status` is `delegated` precisely so no implement lane picks it up. A human
dispositions each observation at office hours; see `office_hours.recommendation`
for the choices.

### Why a carrier and not a strategy clarification

`strategy-graph-native-dispatch` clarification 245 (violation V1, ruled
2026-08-14, extended 2026-08-15) overturned clarification 118: an autonomous
`/align-tactics` session may no longer write dated `clarifications` onto a
serving strategy. `clarifications` is a `strategyFingerprint` allowlist member,
so such a write soft-freezes every open child of that strategy for an
observation defined as gating nothing; it is also a second requirement-entry
surface reserved to the `/align` interview, and a model-authored dated
clarification is byte-indistinguishable from an author-ruled one. Independently,
`references/tactic-target.md` forbids a per-node tactic-target session from
touching the serving strategy's frontmatter at all.

So the immaterial path mints one born-parked observation node instead. That is
what this is.

## Observation 1 — the gather phase's clause-coverage agent dies silently

**This one is a mechanical defect, measured this round, and is the reason this
carrier exists at all.** The other two are generalizations.

### What happened

The `/align-tactics` Workflow run `wf_6626f537-bc2` (2026-08-19, `mode: "tactic"`,
target `tactic-reclaim-audit-spawn-handoff-expired-count`, serving strategy
`strategy-graph-native-dispatch`) reported:

```
parallel[2] failed: agent({schema}): StructuredOutput retry cap (5) exceeded
  — 5 failed calls with no valid output
```

`parallel[2]` is the **clause-coverage evidence agent** — the `clause` job in
the gather fan-out (`.claude/workflows/align-tactics.js`, prompt builder around
`:674-690`, launched from the gather `parallel()` at `:1096`). Its job is to
gather, per recorded `attributes.conditions` entry and per strategy
clarification, the current-repo evidence the Side-A drift reviewer judges from.
It assigns no verdict; it only collects.

Its payload this round was 30 conditions plus 9 clarifications. It failed
schema validation five consecutive times and returned nothing.

### Why the caller could not see it

The gather aggregation guards every result:

```js
gatherResults.forEach((res, i) => {
  const job = gatherJobs[i];
  if (!res) return;          // <-- a dead agent is silently skipped
  ...
});
```

(`.claude/workflows/align-tactics.js:1102-1119`.) So `clauseEvidence` kept its
initializer, `{ reuse_candidates: [], notes: '' }`, and the Opus drift agent ran
the two-sided review with **no per-clause repo evidence at all** — only the
conditions text, the corpus scan, and its own tool access.

The null-guarding itself is deliberate and already recorded: see
`tactic-align-tactics-workflow` (phase `done`), whose body notes "every result
guarded (`.filter(Boolean)`, `res && res.field`, `|| []`)" as an intended
property. **That is not the defect.** The defect is that the degradation is
*silent to the caller*: the returned `result` object carries no field saying a
gather source came back empty. This round's result read

- `drift.proceed`: `true`
- `drift.side_a_failed_conditions`: `[]`
- `parks`: `[]`
- `deviation`: `false`

— indistinguishable from a round whose Side-A review had full evidence. The
only trace is the Workflow tool's own `failures` line, outside the structured
result. A caller who does not read that line lands a round whose two-sided
drift review was half-blind, and records it as a clean pass.

### Why it matters here specifically

Side-A drift is the mechanism by which a failed recorded condition parks the
work for author ratification. An evidence-starved Side-A cannot fail closed —
it can only decline to find a failure. On this round the target was a
single-file operator-instrument fix where a Side-A failure was implausible, so
the practical risk was low and the round was landed rather than re-run
(re-running the pipeline replays through the same deterministic prompt and would
likely hit the same cap). On a round whose target touches doctrine, the same
silence is not low-risk.

### What is NOT claimed

- Not claimed that the drift verdict was wrong. It was reached, with tools and
  the full conditions text, and reads as sound for this target.
- Not claimed that this has happened before. Only this one occurrence was
  measured; no transcript history was searched.
- Not claimed that the retry cap is the root cause rather than a symptom of an
  oversized per-call obligation. Distinguishing those is part of the
  disposition.

## Observation 2 — reclaim-reason fixes should be reason-complete

Surfaced by this round's Side-B drift review as an unrecorded premise, judged
**immaterial** (`material: false`, `plan_depends: false`).

> `dispatch-reclaim-audit`'s RATE section is blind to four reservation_sweep
> reclaim reasons, not one: beyond `spawn-handoff-expired`, the
> `<origin>-ttl-expired` family (`standalone` / `explicit` / `office-hours`,
> `lib-reservation-ledger.sh:710`) is equally uncounted. Fixes to
> reclaim-reason visibility on this tool should be reason-complete — a single
> reason→count table keyed off the ledger's own printf taxonomy — rather than
> adding one literal per newly-noticed reason, which is the pattern that
> produced this gap.

**The concrete work is already done**: `tactic-reclaim-audit-spawn-handoff-expired-count`'s
plan delivers exactly that reason-generic table, and widens its own scope beyond
the filed finding on those grounds. What is recorded here is only the
*generalization* — whether "reason-complete, not one-literal-per-noticed-reason"
is worth carrying as doctrine for this instrument family.

## Observation 3 — a reason grep that matches nothing reads as a healthy zero

Same round, same Side-B path, also **immaterial**.

> On `dispatch-reclaim-audit`, a reclaim-reason grep that matches nothing reads
> as a healthy zero rather than as an unknown — the same fail-open shape
> `tactic-reclaim-audit-journal-unit-filter` closed for the journal read. New
> reason counters on this tool should surface an explicit uncounted/unknown
> bucket (total reclaims from `ALL_RECLAIM_RE` minus the sum of the per-reason
> buckets) so a future reason added to `reservation_sweep` is visible as
> uncounted instead of silently absent.

**Also already absorbed**: that plan adds the explicit unparsed bucket. Again
only the generalization is open — and note it rhymes with Observation 1, which
is the same fail-open-to-a-plausible-zero shape one layer up, in the alignment
machinery rather than in the instrument it was planning.

## Provenance

- Round: `/align-tactics tactic-reclaim-audit-spawn-handoff-expired-count`,
  2026-08-19, against `origin/main` `04095404`.
- Workflow run: `wf_6626f537-bc2` (5 subagents launched, 4 completed, 1 errored).
- Observations 2 and 3 are `drift.unrecorded_premises[0..1]` from that run,
  quoted from their `proposed_clarification` text.
- Observation 1 was measured on the caller thread from the run's `failures`
  line and its `journal.jsonl` (agent `acca4be0f5cf7d76c` has a `started`
  record and no `result` record).
