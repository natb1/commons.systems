---
id: tactic-attributes-phase-squatter-retire
kind: tactic
statement: "Retire the attributes.phase squatter representation outright:
  backfill the 6 remaining phase:null + attributes.phase:main-qa nodes to
  first-class phase, delete the squatter fallback readers, and make
  validate-graph reject any attributes.phase key so the misroute class cannot
  recur"
owner: ai
status: raw
parent: null
rationale: "Filed 2026-07-30 by the office-hours drain of
  tactic-attention-surface-graph-read, whose office_hours park was classified
  INVALID (owed mechanical labor, not a required human input) and drained. That
  park's own recommendation was to harden router.ts's isDraft() to treat an
  attributes.phase-carrying node as non-draft; the author ratified the drain
  session's dissent instead and chose the greenfield: retire the dual
  representation rather than teach one more reader to tolerate it. A tolerant
  reader entrenches the legacy keyspace that tactic-schema-migration-backfill
  (234e52e7, 2026-07-07) already set out to retire, and adds a defensive
  fallback where .claude/rules/code-style.md asks for a clear error. No live
  node owns this work: tactic-mainqa-first-class-phase, to which
  tactic-align-tactics-mechanical-floor explicitly deferred this second
  representation, shipped and was pruned (ce03274a) without covering it, and
  tactic-mainqa-record-time-routing's migration drains nodes already at
  first-class phase:main-qa, which these squatters are invisible to."
reading: null
gap: null
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
attributes: {}
---
# Retire the attributes.phase squatter representation outright: backfill the 6 remaining phase:null + attributes.phase:main-qa nodes to first-class phase, delete the squatter fallback readers, and make validate-graph reject any attributes.phase key so the misroute class cannot recur

## Context

Before `schema.ts` had first-class `phase`, node phase was carried in a
free-form `attributes.phase` key. `tactic-schema-migration-backfill`
(`234e52e7`, 2026-07-07) lifted 14 nodes off that squatter onto first-class
`phase`. The keyspace split was never actually closed:

1. Nodes kept being written in the squatter form *after* the migration
   whenever the value they needed was missing from `PHASES`. The canonical
   case is `451e9ed8` (2026-07-10), which moved
   `tactic-attention-surface-graph-read` `review -> phase: null` +
   `attributes.phase: main-qa` because `PHASES` had no `main-qa` member yet.
   PR #2859 (`4486b25d`) added `main-qa` to `PHASES` the next day, but no
   pass re-backfilled the nodes written in the gap.
2. Readers still tolerate the squatter, so the split is invisible until it
   causes a misroute (`check-node-selection.ts:29-31`, self-described as
   living only "until tactic-schema-migration-backfill lands" — which it did,
   2026-07-07).

The failure mode is data loss, not cosmetics. `router.ts`'s `isDraft()`
(`packages/intentionsutil/src/router.ts:116-118`) is `phase === null ||
phase === "draft"` — it does not look at `attributes.phase`. The frozen-tactic
candidate loop builds directly on it, so a squatter node is emitted every tick
as an `/align-tactics` draft/raw candidate. `/align-tactics` then finalizes a
draft/raw target by landing `status: codified, phase: implement, execution:
null` (`.claude/skills/align-tactics/references/tactic-target.md:53`) — the
`execution: null` **wipes** the node's merged PR number, `qa-done` marker, and
branch.

### Urgency — measured at `origin/main` 2026-07-30

Six nodes carry `phase: null` + `attributes.phase: main-qa` and are **all
unparked and live `/align-tactics` candidates right now**. Measured by running
`selectGraphTargets` over an `origin/main` snapshot (173 candidates total):

| node | selector phase | position | rank |
|---|---|---|---|
| `tactic-attention-surface-analytics-collector` | align-tactics | 84/173 | 4.2 |
| `tactic-indieweb-audience` | align-tactics | 92/173 | 1.8 |
| `tactic-budget-txn-identity` | align-tactics | 128/173 | 0.7 |
| `tactic-noncodegen-session-model-defaults` | align-tactics | 161/173 | 0.0 |
| `tactic-outcome-envelope-qa-accounting` | align-tactics | 162/173 | 0.0 |
| `tactic-token-audit-node-attribution` | align-tactics | 170/173 | 0.0 |

Every one reports `pr: null` to the selector despite carrying a real
`execution.pr`. **Low attention rank is the only thing preventing the
data-loss path** — there is no guard. The seventh node of the class,
`tactic-attention-surface-graph-read`, was ranked 94.2 (position 3 of 173) and
was saved only by an `office_hours` park that a 2026-07-28 `/align-tactics`
session wrote by hand; it was drained to first-class `phase: main-qa` on
2026-07-30 and is no longer part of this set.

## Target design

No node in the store carries an `attributes.phase` key, and no reader knows
what one is. Concretely:

1. **Backfill** the 6 nodes above to first-class `phase: main-qa` with
   `attributes: {}`, in one state-only `graph-commit`. Direct precedent:
   `234e52e7`, which did exactly this for 14 nodes and is described in its own
   commit message as state-only, direct-to-main, no qa/review — a pure
   frontmatter migration has no user surface to QA and no code to review.
   Each node's body (including any `## needs-main residue` section) must
   survive byte-identically; `writeNode` preserves bodies via
   `readExistingBody`, and `assertNoBodyLoss`
   (`packages/intentionsutil/src/store.ts:61-75`) asserts it.
2. **Delete** the squatter fallback readers, starting with
   `check-node-selection.ts:29-31`. Sweep for others —
   `grep -rn 'attributes\.\(phase\|execution\|office_hours\)' packages/ .claude/`
   — and delete rather than harden each one.
3. **Reject** the key: `validate-graph` fails on any node whose `attributes`
   contains `phase`, so the representation cannot be reintroduced. A hard gate,
   not a tolerant reader, per `.claude/rules/code-style.md` ("prefer clear
   errors over defensive fallbacks"). Unit 1 must land before this or the
   gate reddens main.

Explicitly **rejected** alternative: teaching `isDraft()` to treat an
`attributes.phase`-carrying node as non-draft. That was the original
recommendation recorded in the drained park, and the author declined it on
2026-07-30. It suppresses the symptom while entrenching the dual
representation and adds one more tolerant reader to the pile this tactic
exists to remove.

## Also in scope — stale doctrine the same gap left behind

`.claude/skills/align-tactics/SKILL.md:352-356` still asserts that `phase:
main-qa` is "**not** in `schema.ts`'s `PHASES`, so `write-node.ts` would throw
on it." That has been false since PR #2859 (2026-07-11); the drain session
verified `writeNode` accepts `phase: "main-qa"` and landed it. The passage is
the doctrinal root of the whole squatter class — it is *why* a session that
needed `main-qa` reached for `attributes.phase` instead. Correct it in the
same change. Whether `/align-tactics` should now be allowed to *stamp*
`main-qa` is a separate question and is **out of scope**: only the factual
claim about `PHASES`/`write-node.ts` is corrected here. This is a
`.claude/skills/**` edit and needs the corresponding permission grant.

## Out of scope

- `tactic-mainqa-record-time-routing`'s record-time destination split. That
  tactic drains nodes *already at* first-class `phase: main-qa`; these
  squatters are invisible to it precisely because they are at `phase: null`.
  The two are complementary — this one makes the squatters visible to that
  one.
- Running the actual main-qa verification on any backfilled node. Backfilling
  only puts them on `/qa-main`'s queue.
- The `attributes` field itself, which stays in the schema for genuine
  free-form use.

## Reuse

- `packages/intentionsutil/src/store.ts` — `readNode` / `readNodeBody` /
  `writeNode`; `assertNoBodyLoss` is the body-preservation guard.
- `packages/intentionsutil/scripts/write-node.ts` — the single validation gate
  for frontmatter writes.
- `packages/intentionsutil/scripts/graph-commit` — `--base <id>=<blobsha>`
  compare-and-swap pinning, one commit for all 6 nodes.
- `packages/intentionsutil/scripts/validate-graph.ts` +
  `packages/intentionsutil/src/schema.ts` `validateGraph` — where the new
  rejection rule belongs.
- `packages/intentionsutil/scripts/select-targets.ts --dir <snapshot>` — runs
  the pure selector over an extracted `origin/main` snapshot, which is how the
  table above was produced and how the fix should be verified before landing.

## Verification

```verify
npm test --prefix packages/intentionsutil
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

Unit-test the new `validate-graph` rejection rule against a fixture node
carrying `attributes: {phase: "main-qa"}` (must fail) and one carrying
`attributes: {}` (must pass).

Before/after selector check, the decisive one — extract `origin/main`'s
`intentions/` to a snapshot dir, apply the backfill to a copy, and run
`select-targets.ts --dir` against both. Every one of the 6 nodes must move
from `phase: align-tactics, pr: null` to `phase: main-qa` carrying its real
`execution.pr`. Confirm each node's body is byte-identical across the
migration (`diff` the post-`---` region against the pre-migration blob), and
that `validate-graph` reports the same node count and no new unresolved prose
refs.
