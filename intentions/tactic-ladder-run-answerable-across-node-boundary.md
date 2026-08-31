---
id: tactic-ladder-run-answerable-across-node-boundary
kind: tactic
statement: "A /dispatch-ladder run is answerable for the work it spawns through
  a durable structural provenance edge recorded at completion, not by waiting
  that work out: the run reports complete once its source node is terminal and
  every node it directly minted carries an edge naming the source, and each
  spawned node then carries its own terminus obligation, discharged by its own
  run"
owner: ai
status: codified
parent: null
rationale: "Re-homed scope item 2 of tactic-ladder-terminus-owns-main-qa, by
  author ruling in a 2026-08-19 /office-hours sitting over the PR2 park cohort.
  That node's code half merged out-of-band as PR #3091 (merge commit de347430,
  2026-08-14) delivering scope item 1 and the measurement half of item 3, and
  was transitioned to done crediting that PR; item 2 was the one piece it did
  NOT land, and PR #3091's own 'Not in this PR' section deferred it behind
  tactic-mainqa-record-time-routing under the rule 'No cross-node machinery is
  built while no caller can exercise it'. Keeping item 2 on the original node
  would have left a merged implementation sitting under a raw node, so it moves
  here instead of being tracked there. The deferral edge that PR promised but
  never landed is now real: blocked_by tactic-mainqa-record-time-routing."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by:
  - tactic-mainqa-record-time-routing
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# A run is answerable for the work it spawns, by recording the handoff

## Context

A `/dispatch-ladder` run walks one node up the phase ladder and reports
complete when that node reaches `phase: done` on `origin/main`
(`.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:1509`,
`halt 0 complete "$NODE_ID is at phase 'done' on origin/main"`). Under
record-time main-qa routing — designed in `tactic-mainqa-record-time-routing`,
this node's blocker — the source tactic goes `review -> done` directly and the
post-merge work moves onto standalone nodes the run MINTS
(`tactic-mainqa-<source-slug>-machine` and `-author`). So at the moment the run
declares success, real work it created is outstanding on a different node, and
nothing connects the two.

`strategy-graph-native-dispatch` clarification 232 already forbids this: "a run
may not report complete until the main-qa work it spawned is itself terminal or
excused". This node is the cross-node-boundary half of that requirement. It was
re-homed here from scope item 2 of `tactic-ladder-terminus-owns-main-qa` by
author ruling in the 2026-08-19 `/office-hours` sitting; PR #3091 delivered that
node's other scope items and explicitly deferred this one.

**Two author rulings from the 2026-08-20 attended sitting govern this plan.**
They are clarifications 249 and 250 on `strategy-graph-native-dispatch`; read
both before starting, because they overturn the obvious reading of 232.

1. **DELEGATE — answerability is structural, not temporal.** The run does NOT
   chain onto the spawned node, does NOT await it, and does NOT halt. It reports
   complete once its source is terminal and every node it directly minted
   carries a durable provenance edge naming the source. The run is answerable
   for **the handoff being recorded**, not for waiting the spawned work out. The
   spawned node then carries its own terminus obligation, discharged by its own
   run. Consequence, ratified explicitly: clarification 232's sentence does not
   survive literally — at the completion instant the spawned work is neither
   terminal nor excused, merely recorded. This node's `statement` was rewritten
   to match.
2. **Universal spawn sites, bounded at depth 1.** Provenance is required of
   every node minted during a run regardless of id prefix, and a run is
   answerable only for its own DIRECT spawns. Grandchildren are covered by their
   own parent's run.

**A measured correction that shaped the design.** An earlier reading of this
node held that the spawned node classifies `violation` at the completion
instant. That is **false**. `classifyTerminus`
(`packages/intentionsutil/src/terminus.ts:57-66`) tests
`execution.completion.mergedAt == null` **first** and returns `not-merged`, and
the minted node's `execution` is
`{branch, pr, attempts, markers, strategy_fingerprint}` with no `completion` key
(`intentions/tactic-mainqa-record-time-routing.md:152`). The spawned node is
therefore **invisible** — outside the census population entirely, never counted.
That is why a provenance edge is needed at all: the existing predicate cannot
express "spawned work outstanding" in any form.

**And the check is NOT a census widening.** Admitting spawned nodes into the
merged-but-not-terminal population would classify freshly-minted, healthy
backlog as `violation` — a spawned node is not-done, not-parked, and (once its
source is pruned) not-blocked, so it falls straight to the violation arm on
creation. Clarification 250 records this mechanism as rejected on inspection.
The check belongs on the EDGE, not the phase.

## Dependencies

Units run in order 1 → 2 → 3 → 4 → 5. Unit 1 defines the field every later unit
writes or reads. Units 2 and 3 both depend on 1 and are independent of each
other. Unit 4 depends on 1 and 2. Unit 5 depends on 1 and 4.

**This node is `blocked_by: [tactic-mainqa-record-time-routing]` and that edge
stands.** That blocker is at `phase: implement` with seven codified units and
`execution: null` — planned, not built — and is itself
`blocked_by: [tactic-wait-calendar-release]`. It owns the
`tactic-mainqa-*-{machine,author}` mint. Do not build that mint here. Unit 2
covers only the spawn sites that exist on `main` today; the mainqa mint gains
its `spawned_by` write as part of the blocker's own work, and Unit 4's check is
what will catch it if that is forgotten.

## Unit 1 — Add the `spawned_by` provenance edge to the node schema

**Recommended model**: `opus` — the dangling-referent rule is a deliberate
departure from how every other edge in the schema behaves, and getting it wrong
either breaks `validate-graph` across 725 nodes or silently permits typos.

**Scope.**

- `packages/intentionsutil/src/schema.ts`: add `spawned_by: string | null` to
  `IntentionNode` (the edge fields sit at `:232-250`, beside `recovers`,
  `validates`, `blocked_by`), `spawned_by?: string | null` to
  `IntentionNodeInput` (`:259-281`), and a validation arm in `validateNode`
  beside the existing `blocked_by` arm (`:1018-1019`) defaulting to `null`.
- Add a numbered graph rule for it in `validateGraph`'s rule list (`:1570-1577`)
  and its implementation beside the Rules 13-14 call site (`:1678-1679`).
- **The rule MUST permit a dangling referent.** Do not route it through
  `checkRequiredEdgeKinds` (`:1074-1095`), which pushes
  `"... does not resolve to a node"` for an absent target, nor through
  `checkExistenceEdges` (`:1097+`). Prune-on-done deletes a source node once it
  reaches `done`, and provenance must survive exactly that. The rule checks only
  that, WHEN the target is present, it is `kind: "tactic"` — the shape
  `checkResolvedEdgeKinds` (`:1055-1068`) already implements with its
  `if (targetNode === undefined) continue` arm. Prefer reusing that helper over
  writing a new one.
- `spawned_by` is tactic-only, like `blocked_by` (see the kind guard at
  `:1185-1188` and the tactic-only note at `:1161`).
- Tests in `packages/intentionsutil/test/schema.test.ts`: accepts a valid id,
  defaults to `null` when absent, rejects a non-string, **accepts a dangling
  id** (the load-bearing case), rejects the field on a non-tactic kind.

**Explicitly out of scope.** No backfill of existing nodes (Unit 3), no writes
at any mint site (Unit 2), no check beyond schema validity (Unit 4). Do not
touch `blocked_by` semantics.

## Unit 2 — Write `spawned_by` at the spawn sites that exist today

**Recommended model**: `sonnet` — rote wiring at known call sites once Unit 1
has defined the field.

**Scope.**

- `.claude/skills/qa-main/SKILL.md:310-350` — the broken-branch mint of
  `tactic-<source-id>-main-qa-regression`. It currently records provenance as
  **prose in the body** ("the source PR (`execution.pr`) and source node id"),
  deliberately, because `body` is not a `write-node.ts` input field. Add
  `spawned_by: <source-id>` to the frontmatter field list written in the
  `write-node.ts` step. Leave the body prose in place — it carries the PR number
  and the observed behavior, which the edge does not.
- The deploy-lag `tactic-wait-*` hold mint. Find its write site by grepping for
  the `tactic-wait-` id derivation; `packages/intentionsutil/scripts/arm-wait`
  and `intentions/tactic-wait-calendar-release.md` are the entry points. Set
  `spawned_by` to the node whose run armed the wait.
- Any other site that calls `write-node.ts` to create a NEW node during a run.
  Grep `.claude/skills/` for `write-node.ts` and judge each hit: a site that
  EDITS an existing node is out of scope; only creation sites take `spawned_by`.

**Explicitly out of scope.** The `tactic-mainqa-*-{machine,author}` mint —
that is `tactic-mainqa-record-time-routing`'s unit to write, and it does not
exist on `main` yet. Do not add it speculatively.

## Unit 3 — Backfill the four orphaned regression nodes

**Recommended model**: `sonnet` — a mechanical data edit with an explicit,
enumerated list.

**Scope.** Set `spawned_by` on the four live `*-main-qa-regression` nodes, each
to the source id embedded in its own id:

- `intentions/tactic-graph-review-exclusion-stall-recovery-main-qa-regression.md`
- `intentions/tactic-review-code-review-invocation-contract-main-qa-regression.md`
- `intentions/tactic-tactic-graph-commit-rebuild-snapshot-stale-revert-main-qa-regression.md`
- `intentions/tactic-tactic-graph-native-signal-instrument-arm-main-qa-regression.md`

All four carry `blocked_by: []` and `office_hours: null` today, measured at
`origin/main` `c281e300`. Derive each source id by stripping the
`-main-qa-regression` suffix, then **confirm the source still exists** before
writing — some sources are pruned, and a dangling `spawned_by` is legal (Unit 1)
but should be recorded knowingly rather than by accident. Write through
`packages/intentionsutil/scripts/write-node.ts --dir <abs intentions path>`, not
by hand-editing frontmatter.

**Explicitly out of scope.** Any other node. Do not sweep for further
candidates — Unit 4's check is what surfaces them, and it runs against the
whole store.

## Unit 4 — The orphan check

**Recommended model**: `opus` — the shape of the "spawn-site" predicate is the
judgment call in this plan, and a check that is too broad turns main red on
legitimate nodes.

**Scope.** Add a store-wide check that fails when a node bearing a spawn-site
shape carries `spawned_by: null`. Without Unit 3 this must fail on the four
nodes named there — use that as the check's own acceptance test before Unit 3
lands, then confirm it passes after.

Two placements are viable; choose one and record why in the commit message:

- as a rule inside `validateGraph` (`packages/intentionsutil/src/schema.ts`),
  which runs everywhere `validate-graph.ts` runs; or
- as a lint beside `packages/intentionsutil/src/planlint.ts`, wired into
  `packages/intentionsutil/scripts/validate-graph.ts` after `validateGraph`,
  which is the established pattern for a check that needs more than frontmatter
  or wants a grandfather baseline.

**Prefer the `planlint.ts` pattern if a baseline is needed.** Its
`loadPlanBodyBaseline` / `PlanBodyBaselineEntry` machinery
(`packages/intentionsutil/src/planlint.ts:23-70`) is the repo's worked example
of grandfathering pre-existing violations so landing a ratchet does not break
`main`, and its doc comment states the ratchet-only-tightens rule. Since Unit 3
clears the only known violations, a baseline may be unnecessary — decide with
the measurement, not in advance.

**Explicitly out of scope.** Any change to `classifyTerminus` or to the
ladder-terminus census population. Clarification 250 records that mechanism as
rejected: it would classify healthy backlog as `violation`. Also out of scope:
the `CRITICAL, DO NOT "FIX" THIS` prohibition at
`packages/intentionsutil/src/terminus.ts:150-163` — `findUnstructuredWaits` must
never feed back into `classifyTerminus`, and nothing in this unit should bring
the two into contact.

## Unit 5 — The run-completion postcondition

**Recommended model**: `opus` — this is the unit that actually discharges the
requirement, it edits a 1544-line shell driver, and it must not turn a
successful run into a spurious failure.

**Scope.**

- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run`: before the
  completion halt at `:1509`, assert that every node in the store carrying
  `spawned_by: "$NODE_ID"` validates. This is a **graph query, not run
  bookkeeping** — the run does not need to track what it minted; it asks the
  store what names it. Depth 1 only: do not follow the spawned nodes' own
  `spawned_by` edges.
- On failure the run must NOT report complete. Follow the existing `halt`
  convention (`:708`) and the classification helpers already in the file
  (`terminus_probe()` `:884`, `classify_absent_node()` `:917`,
  `classify_terminus()` `:933`) rather than inventing a new exit path.
- The assertion reads `origin/main`, consistent with the completion condition it
  guards ("at phase 'done' on origin/main"), not the local worktree.

**Explicitly out of scope.** CHAIN and AWAIT are ruled out — do not add any wait
loop, poll, or second claim on a spawned node. Do not make a live spawned node a
failure: an existing, valid, `spawned_by`-carrying node is the SUCCESS case.

## Reuse

- `packages/intentionsutil/src/schema.ts` — `checkResolvedEdgeKinds`
  (`:1055-1068`) is the dangling-tolerant edge helper Unit 1 wants;
  `checkRequiredEdgeKinds` (`:1074-1095`) is its dangling-INTOLERANT sibling and
  is the wrong one. `validateIdArray` is used by the `blocked_by` arm at
  `:1018-1019`; `spawned_by` is a single id, not an array, so it needs the
  scalar equivalent.
- `packages/intentionsutil/src/router.ts` — `blockersComplete` (`:239-245`)
  explains why `blocked_by` cannot carry provenance: an absent blocker counts as
  COMPLETE, so the relation dissolves at prune time.
- `packages/intentionsutil/src/planlint.ts` — the lint-beside-the-validator
  pattern and the grandfather-baseline machinery for Unit 4.
- `packages/intentionsutil/scripts/write-node.ts` and `dump-node.ts` — the only
  sanctioned node write path; both require `--dir <intentions-dir>` explicitly
  and have no default.
- `packages/intentionsutil/src/terminus.ts` — read `classifyTerminus`
  (`:57-66`) and the census doc comment to understand why spawned nodes are
  invisible today. Do not modify it.

## Verification

Unit tests for Units 1 and 4, plus the full package suite and a graph
validation, all of which run today:

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

Manual and judgment checks, not auto-runnable:

- **Unit 1's load-bearing case** is the dangling referent. Confirm by hand that
  a node with `spawned_by` naming a non-existent id passes `validate-graph`,
  and that the same id in `blocked_by` still FAILS. If both pass or both fail,
  the rule was wired to the wrong helper.
- **Unit 4 must fail before Unit 3 and pass after.** Run the check against the
  store with the four regression nodes un-backfilled and confirm it names all
  four; then backfill and confirm it is silent. A check that is green in both
  states is vacuous.
- **Unit 5 cannot be exercised end-to-end until the blocker lands.** There is no
  `tactic-mainqa-*` mint on `main` yet, so no run produces a spawned node
  through the record-time path. Verify against a hand-constructed fixture node
  carrying `spawned_by`, and record in the PR that live exercise waits on
  `tactic-mainqa-record-time-routing`.
- **Confirm the sensor registry is untouched.** Renaming or re-registering a
  sensor de-registers it and turns `main` red; this plan adds no sensor, so
  `packages/intentionsutil/test/lifecycle-sensor.test.ts` and
  `packages/intentionsutil/test/terminus-sensor.test.ts` must pass unchanged.

## Implementation instructions

Implement each unit in a **separate subagent** launched via the Agent tool with
`model` set to that unit's **Recommended model** (`model: sonnet` or
`model: opus`). Supply the unit's Context and Scope in the subagent prompt, and
constrain it to **working-tree edits only** — no commits, no pushes, no merges.
Run the units in the dependency order given above, verifying between units
rather than only at the end.
