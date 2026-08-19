---
id: tactic-mainqa-record-time-routing
kind: tactic
statement: "Post-merge verification tests are sorted to their terminal queue at
  qa record time: /qa-fix writes standalone tactic-mainqa-* nodes grouped by
  destination instead of a source-body residue section, and the source goes
  review -> done"
owner: ai
status: raw
parent: null
rationale: Byproduct of the 2026-07-28 /align-strategy interview that recorded
  the record-time main-qa routing requirement. The routing unit today is the
  source tactic, which has exactly one destination, so the record-time triage
  that needs-main-followups.md already mandates cannot actually be expressed.
  This tactic carries the implementation of the greenfield design recorded in
  that clarification.
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
attributes: {}
---
# Post-merge verification tests are sorted to their terminal queue at qa record time: /qa-fix writes standalone tactic-mainqa-* nodes grouped by destination instead of a source-body residue section, and the source goes review -> done

## Context

Recorded 2026-07-28 /align-strategy. Full doctrine is the same-day
`strategy-graph-native-dispatch` clarification "A main-qa verification test
recorded by the qa phase always entered the dispatch queue first..." plus its two
companions (deploy-lag park taxonomy; the progressive-detachment steelman) and the
two conditions added the same round. Read those first — this body carries only
the implementation shape.

Today the routing unit is the source tactic, which has exactly one destination.
`/qa-fix` appends `## needs-main residue` to the source's own body and advances it
`review -> main-qa`, so mixed residue cannot be split and an author-required item
cannot be parked at qa time without blocking the merge its observation depends on.
The record-time triage that
`.claude/skills/qa-fix/references/needs-main-followups.md` already mandates is
therefore unexpressible, and every main-qa item boots a `/qa-main` worker first.

## Target design

One node per (source, destination) group — at most two per source PR:

| | machine-verifiable group | author-required group |
|---|---|---|
| `phase` | `main-qa` | `main-qa` |
| `office_hours` | `null` | `{reason, since, recommendation}` |
| `owner` | `ai` | `human` |
| queue | dispatch (`/qa-main`) | office-hours only |

Both carry `execution.pr` (the source PR whose deploy is checked) and
`blocked_by: [<source-tactic-id>]`. The source tactic then goes `review -> done`
directly. Either group is omitted when empty.

Why this works with existing machinery, verified at origin/main this round:

- The selector's tactic eligibility requires `office_hours` null
  (`packages/intentionsutil/src/router.ts:197`), so an author-lane node is never
  selectable — it appears only on the office-hours PARKED panel.
- `blocked_by` self-clears correctly: pruning the `done` source strips inbound
  edges in the same commit and absence reads as completion
  (`inboundBlockers`, `packages/intentionsutil/src/transitions.ts:265-272`).
- The shape is already live on the migrated `tactic-mainqa-*` nodes
  (`tactic-mainqa-gcp-cost-alerts`, `tactic-mainqa-ds-storybook-visual`) — no new
  kind, no new field, no schema change.

## Units (indicative — /align-tactics owns the final decomposition)

1. `/qa-fix` node lane: replace the Step 3.6 residue append with per-destination
   node creation; source transitions `review -> done`. Sorting predicate is
   unchanged — the `autonomous | human` criteria in `needs-main-followups.md`
   section 1, `uncertain -> author`. Both conditions recorded this round bind
   here: born-parked context completeness, and the explicit verifiability mark.
2. `/qa-main` node lane: retarget from "source tactic at phase main-qa, work list
   = its residue section" to "verification node at phase main-qa, work list = its
   own statement/body".
3. Deploy-lag cannot-verify becomes a `blocked_by` mechanical retry hold, not an
   `office_hours` park (the selector gates on `mergedAt` only —
   `.claude/skills/dispatch-propagate/scripts/graph-select-target:631-642`).
   Coordinate with `tactic-mechanical-park-producers`, which is converting the
   other two park producers to the same shared hold primitive.
4. Retire the `review -> main-qa` edge in `forwardPhase` and the reconciler's
   main-qa absorption path. `main-qa` stays a valid standing phase. Per entry 111,
   the generated ladder prose must be regenerated, not hand-edited.
5. Mis-sort census: count `/qa-main` cannot-verify parks on nodes born
   `office_hours: null`, over all machine-sorted main-qa nodes.

## Migration

Backwards-incompatible and larger than one PR. Drain the in-flight
residue-carrying nodes currently at `phase: main-qa` under the old path — no bulk
rewrite. Units 1-2 must land together or the two lanes disagree about what a
main-qa target is; unit 4 lands only after the last residue-carrying node drains.

## Verification

Unit tests over the new `/qa-fix` node-writing path and the selector's treatment
of a born-parked main-qa node. End-to-end: a source PR with mixed residue must
produce exactly two nodes, and no `/qa-main` worker may boot for the
author-required one.

## 2026-08-19 /align-tactics round notes (parked)

This node was targeted by a per-node `/align-tactics tactic-mainqa-record-time-routing`
round on 2026-08-19 and **parked without a plan** — see `office_hours.reason` for
the WAIT-destination ruling the author owes. Everything the round established is
recorded here so the next round re-derives none of it. Nothing below is a plan;
the sections above are still the draft they were.

A per-node tactic-target round never writes the serving strategy, so the drift
phase's three observations were **not** landed as `strategy-graph-native-dispatch`
clarifications. They are recorded here instead, and a future `/align` sitting or
strategy-target `/align-tactics` round may promote them.

### The Units section above carries two stale statements

Both are corrections against already-recorded strategy substance, not new
requirements — they need no ruling, only application when this node is re-planned.

- **Unit 1's "Sorting predicate is unchanged" is FALSE.** The 2026-07-31 amendment
  to the record-time-routing clarification retired the `autonomous | human`
  browser-reachability predicate and replaced it with the required-core `owner`
  field (`owner: ai` = machine-verifiable, `owner: human` = author-required).
  `tactic-qa-main-verifiability-sort-criterion` — the tactic that closed exactly
  this defect — is now `phase: done` / `status: codified`, and it also landed the
  interim per-item `Verifiability: MACHINE|AUTHOR|WAIT` sub-line plus an optional
  `Check:` sub-line. Machine-verifiable now means checkable by **any** tool the
  autonomous lane can run (browser **or** shell/git/journal/log/filesystem); an
  item is author-required only if it cannot be machine-checked at all.
  `.claude/skills/qa-fix/references/needs-main-followups.md:70-77` names **this**
  node as the trigger that retires the interim sub-line.
- **Unit 5's mis-sort census must be restated on `owner`, not on birth-`office_hours: null`.**
  Cannot-verify parks on `owner: ai` main-qa nodes, over all `owner: ai` main-qa
  nodes, threshold at most 1 in 20. `clear-park` erases `office_hours` when the
  author drains a node, so `office_hours` cannot carry the mark; `owner` survives
  the drain.

### Unit 3 is sibling scope; Unit 4's stated constraint cites absent machinery

- **Unit 3's coordination note is stale.** `tactic-mechanical-park-producers` is
  `phase: done` / `status: codified` — the shared `blocked_by` hold primitive is
  already built, so Unit 3 reuses it rather than coordinating with open work. The
  deploy-lag WAIT hold itself is wholly `tactic-wait-calendar-release`'s surface
  (at `phase: review`, 8 codified units), whose own sequencing note assigns the
  `/qa-main` WAIT-branch flip to a follow-up filed when it reaches `done`. Do not
  re-plan it here.
- **Unit 4's "the generated ladder prose must be regenerated, not hand-edited"
  presumes machinery that does not exist.** `tactic-phase-routing-table-generated`
  is `status: raw` / `phase: null` — an unplanned draft. There is no generator, no
  sentinels and no CI drift check at `origin/main` today, so a Unit-4 PR would
  hand-edit prose. Say so plainly or sequence Unit 4 behind that draft.
- **Unit 4 is not near-term regardless.** 40 nodes sit at `phase: main-qa` today;
  12 are the migrated `tactic-mainqa-*` shape and the other 28 are source tactics
  carrying residue under the old path. The Migration section says unit 4 lands only
  after the last residue-carrying node drains — that tail is long.

### Sibling relationships bearing on the eventual decomposition

- `tactic-transition-node-needs-main-residue-clobbered` (`status: raw`,
  `phase: null`) describes a live bug in the mechanism Unit 1 **deletes**:
  `transition-node` overwrites `intentions/<id>.md` from `origin/main` before
  reading residue, so an uncommitted Step-3.6 body append never rides into the
  same commit. It is **superseded** by this work, not a coordination dependency —
  disposition it moot when Unit 1 lands.
- `tactic-ladder-run-answerable-across-node-boundary` (`status: raw`,
  `phase: null`) carries `blocked_by: [tactic-mainqa-record-time-routing]`.
  Whichever child ends up owning the routing/`blocked_by` mechanics becomes its
  new `blocked_by` target, and that node should be re-planned immediately after.
- `tactic-attributes-phase-squatter-retire` explicitly scopes this node's
  record-time destination split **out** of its own remit (its squatters sit at
  `phase: null` and are invisible to a drain of first-class `phase: main-qa`
  nodes). Adjacency to note in sequencing; no scope to merge.
- `tactic-qa-main-node-terminal-declaration` is an independent `/qa-main`
  escalation-path defect with no mechanical overlap.

### Corrected anchors (measured at `origin/main` 1f7dc676, 2026-08-19)

Every `path:line` anchor in the sections above had drifted. Each underlying claim
re-verified true; only the anchors moved. Locate by **symbol**, not by line.

- Selector tactic eligibility (`office_hours` must be null): body says
  `router.ts:197` → `packages/intentionsutil/src/router.ts:403`.
- `inboundBlockers`: body says `transitions.ts:265-272` →
  `packages/intentionsutil/src/transitions.ts:407`.
- `blockersComplete`: `packages/intentionsutil/src/router.ts:237-241`.
- main-qa `mergedAt`-only gate: body says `graph-select-target:631-642` →
  `.claude/skills/dispatch-propagate/scripts/graph-select-target:1143-1153`.
- `forwardPhase` (the `review -> main-qa` edge): `transitions.ts:80-92`; `LADDER`
  at `:61`; `reconcileMergedPhase` at `:361`; `hasNeedsMainResidue` at `:378`.
  Callers: `packages/intentionsutil/scripts/reconcile-graph.ts:176-177` and
  `packages/intentionsutil/scripts/apply-node-transition.ts:161`. Tests:
  `packages/intentionsutil/test/transitions.test.ts:65-93` and `:210-211`.
- Prose restatements that must stay true: `.claude/skills/qa-fix/SKILL.md:195-196`,
  `.claude/skills/qa-fix/references/needs-main-followups.md:27-32`,
  `.claude/skills/qa-main/SKILL.md:105,114-124`.

### Corrections to the Target design section

- **`main-qa` IS now in the schema enum** (`packages/intentionsutil/src/schema.ts`,
  both the `Phase` type and `PHASES`), so `write-node.ts` accepts `phase: main-qa`.
- **The migrated nodes do not exemplify `execution.pr`.**
  `intentions/tactic-mainqa-gcp-cost-alerts.md` carries `execution: null`. The
  design's claim that the shape is already live "no new field" holds for
  `owner`/`office_hours`/`phase`, but the `execution.pr`-carrying half is new work.
- **`tactic-main-qa-phase`** — cited by `needs-main-followups.md:32` as owning
  verification — has been **pruned** from `intentions/`. Do not plan against it.

### Reuse already identified for the eventual Unit 1

`.claude/skills/qa-main/SKILL.md:318-352` (the main-qa-regression bug tactic) is a
proven precedent for a phase skill minting a node — do not reinvent it. Its recipe:
run `write-node.ts` with **frontmatter only** (`status` is required with no
default; copy `serves` from the source), then edit `intentions/<id>.md` directly to
replace the generated `# <statement>` placeholder, then `graph-commit`. The
hand-authored body survives later frontmatter-only rewrites because `writeNode`
calls `readExistingTacticBody` (`packages/intentionsutil/src/store.ts`). It is
idempotent by checking whether `intentions/<id>.md` already exists at
`origin/main`. Also reusable: `arm-wait`'s stated invariants for a multi-node land
(one `graph-commit`, `--base` CAS via `dump-node.ts --out-dir`, and a
conditional-restore rollback guard modelled on `park-node`).

### What still holds

The core premise is intact at `origin/main`: `/qa-fix` Step 3.6's node lane still
appends `## needs-main residue` to the source body and still advances `qa -> review`,
with the residue draining later via `review -> main-qa`
(`.claude/skills/qa-fix/SKILL.md:358-379`). The problem this node exists to solve
is real and unfixed.

## 2026-08-19 author rulings (park cleared)

The office-hours park the round above opened is **cleared** (`clear-park`, landed
`5f8dbc0a`). The author ruled all four open questions in an interactive sitting the
same day. These rulings are **binding on the plan** and must not be re-litigated by
a later round; a round that disagrees parks rather than overrides.

**Ruling 1 — WAIT is a hold on the machine-verifiable node, not a third
destination.** The at-most-two-nodes-per-source cap stands unamended and `owner`
stays the sort mark. A WAIT-classed item lands on the `owner: ai` machine-verifiable
`tactic-mainqa-*` node, and that node carries `blocked_by: [tactic-wait-<id>]`
pointing at the hold minted by `arm-wait`. This is the shape
`tactic-wait-calendar-release` already codified — `attributes.wait_for` names the
source, `source.blocked_by` names the WAIT
(`intentions/tactic-wait-calendar-release.md:160-200`) — so the "source" under the
new routing is simply the machine-verifiable destination node. Candidate (a) from
the park reason, a genuine third destination node, is **rejected**: it would require
amending the recorded cap and inventing a sort mark `owner`'s enum cannot express.
No strategy clarification amendment is owed by this ruling.

**Ruling 2 — Unit 1 blocks on `tactic-wait-calendar-release`.** Unit 1 deletes the
interim park path, so landing it before `arm-wait` exists would leave a WAIT item
with nowhere to go. This node therefore carries
`blocked_by: [tactic-wait-calendar-release]`.

> **Write-ordering trap, load-bearing.** That edge must be written **in the same
> commit as the finalize**, never before it. `/align-tactics`' Step-0 gate
> (`assert-node-selection` → `frozenTacticSelectable`) exits **12** on incomplete
> blockers, so a node that carries the edge while `tactic-wait-calendar-release` is
> still at `phase: review` cannot be selected for planning at all. Adding the edge
> first would make this node unplannable until #3051 merges.

**Ruling 3 — the live `Verifiability: WAIT` marks migrate in Unit 1's PR.** Measured
at `origin/main` on 2026-08-19: **45 marks across 26 nodes** (up from the 44/25 the
round above recorded a day earlier — the count drifts, so re-measure rather than
citing either figure). They are rewritten into the new standalone-node shape as part
of Unit 1 rather than draining in place. Consequence to carry into the plan: the
interim `Verifiability:` sub-line then **does** retire on the schedule
`.claude/skills/qa-fix/references/needs-main-followups.md:70-77` already states, so
that retirement note needs no amendment — but Unit 1's diff is correspondingly
larger, and the Migration section's "no bulk rewrite" sentence applies only to
residue-carrying nodes' *phase drain*, not to these marks.

**Ruling 4 — scope is Units 1+2; Units 3, 4 and 5 are named follow-ups.** The
`/qa-fix` writer and the `/qa-main` reader land together (the Migration section's
existing constraint). Unit 3 reuses the already-built shared hold primitive from
`tactic-mechanical-park-producers` (`phase: done`) and is otherwise sibling scope;
Unit 4 waits on both a long drain tail and the absent generator
`tactic-phase-routing-table-generated` (`status: raw`); Unit 5 is a measurement.
Each is named in the plan as an explicit out-of-scope follow-up, not silently
dropped. This node does **not** split — a split would contradict units 1+2 landing
together.

**Checked and rejected: folding #3051 into PR2 of the RSI serialized PR plan.** The
author asked whether `tactic-wait-calendar-release` (PR #3051) could be folded into
PR2 as described in `plans/dispatch-rsi-serialized-pr-plan.md`. It cannot. PR2 is
the ladder driver (`dispatch-ladder-{advance,await,run,status,spawn}` plus the
`terminus.ts` census, 7 nodes); #3051 touches `waits.ts`, `wait-sweep.ts`,
validate-graph Rule 21, the `router.ts` draft-candidate exclusion,
`arm-wait`/`release-wait`, `lib-wait-recheck.sh` and `dispatch-tick` — no file
overlap. #3051 is already code-complete and carries `planned` / `qa-done` /
`reviewed` markers with only CI red (`dispatch:fix-checks-attempt-1`), so folding it
into an unstarted bundle would discard a finished review and **delay** the machinery
Ruling 2 depends on. PR2's remainder also sits in Bundle 3 (COLD, position 6 of 10),
whereas a `wait_until` tick sweep belongs topically to Bundle 2. The plan's single
mention of this node's sibling (line 924) is a *rejection* — `wait_until` does not
fit `tactic-pause-disables-merge-lane`'s episode wait. No edit was made to that plan
file. One line in it is now stale and is a known residual: its line 898 calls this
node "itself raw and unplanned".
