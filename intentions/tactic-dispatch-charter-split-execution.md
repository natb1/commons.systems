---
id: tactic-dispatch-charter-split-execution
kind: tactic
statement: Execute the ruled three-way charter split of
  strategy-graph-native-dispatch — write the three charter strategies,
  exclusively re-serve its tactic children onto them, retire its defect-ratio
  success_signal in favour of per-charter bands, and land the paired
  read-sensors.ts change in the same branch
owner: ai
status: raw
parent: null
rationale: >-
  Minted 2026-08-30 as the carrier for Position 13 of the serialized
  dispatch/RSI PR batch. `tactic-review-dispatch-charter-split` records the SPEC
  and closed 2026-08-29 (`2c806848`) at `phase: done` with `execution: null` —
  its own clarification says "This node records the spec; it is not the
  execution." Because it is done, `isOpenTactic` is false and no router loop can
  select it, so closing it removed the last node that could carry the execution
  (`plans/dispatch-rsi-serialized-pr-plan.md:5823-5831`). The batch's Position
  13 section instructs that the carrier be minted as the first action of the
  position and names what it must contain
  (`plans/dispatch-rsi-sequence.md:942-1010`, requirements list at `:968-1010`).


  This node does NOT re-derive the spec. The four clarifications on
  `tactic-review-dispatch-charter-split` are the ruled design and are read from
  there; this node carries only the execution plan.


  It serves `strategy-graph-native-dispatch` — the strategy being split — as
  directed at `plans/dispatch-rsi-sequence.md:970-971`. The spec node serves
  `strategy-graph-integrity` instead, because the FINDING was a record-coherence
  property; the EXECUTION is a change to the dispatch machinery's own record and
  its sensor, so it lands under dispatch.
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Where is the ruled design for this split, and what does this node add
      to it?
    answer: "Recorded 2026-08-30. The ratified spec is
      `tactic-review-dispatch-charter-split` (`phase: done`, closed 2026-08-29
      by author disposition). Its four clarifications rule the shape (three
      charters, cut along the strategy body's existing sections), the re-serve
      semantics (exclusive, not additive), the retirement of the parent's
      defect-ratio `success_signal`, and the sequencing (after Position 12,
      because an exclusive re-serve invalidates every `--base` CAS manifest in
      flight). This node adds nothing to that design: it is the execution
      carrier the spec node cannot be, because a `done` node is not selectable.
      Do not transcribe the spec here — read it there."
  - question: Is the child count still the 316 the spec node recorded?
    answer: "No — re-measured 2026-08-30 on `origin/main` at `546042d4`: 326 tactics
      carry a `serves` edge to `strategy-graph-native-dispatch` (done 120,
      parked 61, draft 82, phase implement 36, phase main-qa 21, phase qa 6).
      Method: `git archive origin/main intentions` into a scratch tree, then
      `listNodes` from `packages/intentionsutil/src/store.ts` filtered on
      `n.kind === \"tactic\" &&
      n.serves.includes(\"strategy-graph-native-dispatch\")` — the archive form
      is used because `listNodes` over the worktree absorbs untracked strays.
      The spec node's own clarification measured 316 on 2026-08-28 at
      `96dc5a14`. The growth does not change the design; it changes the size of
      the re-serve, so re-measure again immediately before executing rather than
      trusting either figure."
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
# Execute the ruled three-way charter split of strategy-graph-native-dispatch — write the three charter strategies, exclusively re-serve its tactic children onto them, retire its defect-ratio success_signal in favour of per-charter bands, and land the paired read-sensors.ts change in the same branch

## Context

`strategy-graph-native-dispatch` carries 328 tactic children under a single
defect-ratio `success_signal` (re-measured 2026-08-31 on `origin/main`
`2d5faa71`; clarification 2 records the method and the earlier 316/326
readings). One ratio averaged over that much unlike
work says less than it appears to. The author ruled the fix on 2026-08-29 and
`tactic-review-dispatch-charter-split` records it. That node closed with no diff
and no PR — the sitting was its deliverable — so the execution has no carrier and
would be silently dropped. This node is that carrier.

The whole change ships as **one PR**, not three staged per-charter PRs. Two
reasons, both from `plans/dispatch-rsi-sequence.md:963-966`: the
`lifecycle-sensor.test.ts` coupling guard requires the node edit and the code
change in the same branch, and each staged re-serve would pay the `--base` CAS
invalidation again for no review benefit.

## What is ruled elsewhere and must not be re-derived here

Read `intentions/tactic-review-dispatch-charter-split.md` for the design. Its
four clarifications settle: the three-way cut and its boundaries; exclusive
re-serve; retirement of the parent's ratio; and the sequencing plus the paired
code change. Two alternatives were declined there (a two-way cut, and a four-way
cut promoting Execution Substrate) and one repair was declined (making the census
ancestry-aware) — do not reopen them.

## Unit 1 — Write the three charter strategies

**Recommended model: opus.** Authoring strategy-layer records.

Cut along the parent strategy body's existing sections, which are its own
headings in `intentions/strategy-graph-native-dispatch.md`:

- **Recording surface** — Serialization & Commit (`:7694`), Other Settled
  Mechanism (`:8039`).
- **Router and selection** — Router Mechanism (`:7147`), Phase Transitions & Fix
  State (`:7157`), Fingerprint & Freeze (`:7272`), Pace, Backlog & Attention
  (`:7575`), Review & QA Disposition (`:7872`).
- **Session lifecycle** — Worktree Claiming & Liveness (`:7428`), Recovery &
  Session Lifecycle (`:7750`), Execution Substrate (`:7938`).

Note the body nests: `Router Mechanism` is the single `##` heading at `:7147` and
the other nine are `###` beneath it. The cut is by section name, not by heading
depth — re-check the anchors before editing, they drift.

Each charter is a `kind: strategy` node with its own `success_signal` carrying a
per-charter backlog band (Unit 4). The parent stays in place as the ancestor; the
ids are chosen at implementation time and are deliberately not fixed here.

**Out of scope:** rewriting the section prose. This unit moves and re-homes it,
it does not re-author the mechanism records.

## Unit 2 — Exclusive re-serve of the children onto the three charters

**Recommended model: opus.** The classification of 328 nodes is judgment work,
and a misfiled child silently corrupts a charter's band.

Every tactic serving `strategy-graph-native-dispatch` moves to exactly one
charter and is **removed** from the parent's `serves`. Exclusive, not additive —
dual-serving preserves the denominator only by preserving the defect the split
exists to fix.

## Unit 3 — Retire the parent's defect-ratio success_signal

**Recommended model: opus.**

`strategy-graph-native-dispatch.success_signal` (`intentions/strategy-graph-native-dispatch.md:6761`)
is retired in favour of the per-charter bands written in Unit 1.

This is not bookkeeping. `strategyBacklogBand`
(`packages/intentionsutil/src/census.ts:26-32`) selects children with
`n.kind === "tactic" && n.serves.includes(strategyId)` — direct membership, with
no ancestry walk. An exclusive re-serve therefore removes the children from the
parent's denominator outright, and at `total === 0` the band returns `pct: null`
rather than erroring. Left in place, the parent's ratio reads green because it
measures almost nothing.

## Unit 4 — The paired code change, in the SAME branch and PR

**Recommended model: sonnet.** Mechanical, but the coupling is unforgiving.

`packages/intentionsutil/test/lifecycle-sensor.test.ts:330-332` reads the real
node out of `intentions/` and asserts
`node.success_signal?.sensor === LIFECYCLE_SENSOR_NAME`.
`LIFECYCLE_SENSOR_NAME` is at `packages/intentionsutil/scripts/read-sensors.ts:516`
— **locate it by name, not by line**; the plan and the spec node both cite `:485`,
which is stale, and `:516` was measured 2026-08-30 and will drift too. Editing
either side alone turns CI red, and `graph-commit` lands `intentions/` only, so it
cannot carry the code half.

Also made stale by the retirement, in the same file:

- `BACKLOG_BAND_PCT = 35` (`read-sensors.ts:520`), consumed at `:740-742`.
- `BACKLOG_STRATEGY_ID = "strategy-graph-native-dispatch"` (`read-sensors.ts:523`),
  the default argument at `:834` and the reading call at `:1642`.

A second guard in the same test file requires every registered sensor name to be
some node's verbatim `success_signal.sensor`; the same rule runs non-fatally on
the graph write path from `packages/intentionsutil/scripts/validate-graph.ts`
(`findUnboundRegisteredSensorNames`, fatal under `--strict-sensors`). So a
retired sensor must be de-registered, not merely orphaned.

## Dependencies

- **Position 12 must complete first.** Re-serving 328 children invalidates every
  `--base` CAS manifest in flight; this is the spec node's D1 ruling and the
  reason Position 13 sits last.
- No `blocked_by` edge is set, because the blocker is a batch position rather
  than a single node. Confirm Position 12 is landed before starting.

## Reuse

- `packages/intentionsutil/src/census.ts` — `strategyBacklogBand`, unchanged; the
  three charters get their bands from it as-is.
- `packages/intentionsutil/scripts/write-node.ts` — the single validation gate for
  every node write. Use the `--file` form; the inline `echo '<json>' | ...` form
  silently eats shell metacharacters out of node content.
- `packages/intentionsutil/scripts/validate-graph.ts` — positional
  `<intentionsDir>`, no `--dir` flag.
- Precedent for a mixed graph+code commit: `717742b9` landed a strategy's
  `success_signal` edit, a sensor implementation and its `read-sensors.ts`
  registration in one commit. The direct-push restriction is a rule about what an
  `/align` round may push, not a claim that a PR branch cannot edit
  `intentions/`.

## Verification

```verify
npm test --prefix packages/intentionsutil && node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

The two commands are joined with `&&` on one line deliberately: the fence runner
adds no `set -e`, so only the LAST statement's exit status decides the fence.
Split across two lines, a red test suite would be masked by a green validator.

There is no `intentionsutil` vitest project — this package runs its own
`vitest run` via its `test` script (`packages/intentionsutil/package.json`), so
`--project intentionsutil` errors with "No projects matched".

Manual, after the suite is green: confirm `strategyBacklogBand` returns a
**non-null** `pct` for each of the three new charters, and that no charter's
`total` is small enough to be noise. A `pct: null` reading is the exact failure
this split is supposed to avoid, so it is the check that matters most.

Also confirm the registered-sensor census does not lose a name it should have
kept — run `validate-graph.ts` with `--strict-sensors` once by hand and read the
output rather than only its exit code.

## Out of scope

- Re-opening any of the three declined alternatives recorded on the spec node.
- Making the census ancestry-aware. That was declined: it changes band semantics
  for every strategy in the graph to solve one strategy's problem.
- Re-authoring the mechanism prose the three charters inherit.
