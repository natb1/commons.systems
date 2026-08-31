---
id: tactic-attention-per-tier-boost-migration
kind: tactic
statement: Migrate authored boosts onto the closed absolute level vocabulary,
  retire the interim 0.01 namespacing ladder and the last override value, and
  land the write-path vocabulary check
owner: ai
status: codified
parent: null
rationale: Byproduct of the 2026-08-12 /align round that unified the ranking
  model on strategy-graph-drives-dispatch. The round adopted per-tier authored
  boosts and removed both `override` and the minimum-boost-of-1 rule; the live
  graph's authored values do not fit the resulting scale and must be migrated
  deliberately rather than reinterpreted in place.
reading: null
serves:
  - strategy-graph-drives-dispatch
recovers: []
clarifications:
  - question: What is actually in scope, measured?
    answer: "(Recorded 2026-08-12, measured on the live graph during the round.) 597
      nodes; 91 carry an authored boost, of which 43 are non-integer. The
      non-integer population is almost entirely the 2026-08-11 NAMESPACING
      STOPGAP — magnitudes hand-compressed onto a 0.01-per-level ladder so a
      tactic boost could not lift a node out of its parent strategy's band, with
      the original magnitude preserved at attributes.pre_namespacing_boost. That
      stopgap exists only because namespacing was not structural; the unified
      key's band component makes it structural, so the ladder should be REVERTED
      from pre_namespacing_boost rather than carried forward or re-scaled. Also
      in scope: strategy-graph-review-curriculum at 3.5; the single remaining
      non-null attention.override (tactic-transition-node-stamp-landed-body,
      phase done) to be dropped with the field; and the storage shape for
      per-tier boosts, which must keep an unauthored tier distinguishable from
      an authored lowest value so 'not yet ranked in this tier' does not read as
      'ranked last'. Note the interaction with the office-hours session-type
      soft penalty (attention x 0.5, strategy-attention-surface): it is a
      multiplier applied by the office-hours selector outside the rank key, and
      this round did not change it — confirm it still composes once boosts are
      integers. (Amended 2026-08-12, same round.) The storage shape itself moves
      to tactic-attention-namespaced-rank, which lands it. The REQUIREMENT
      recorded here survives unchanged as a constraint this node asserts on that
      shape: an unauthored tier must stay distinguishable from an authored
      lowest value, so 'not yet ranked in this tier' does not read as 'ranked
      last'. A sparse map satisfies it, and that is consistent with
      tactic-attention-namespaced-rank's own scope item that an unauthored boost
      contributes 0."
  - question: Are authored boosts free magnitudes or a closed vocabulary, and what
      does that decide about the per-band scope stamp and rule 20?
    answer: "(Author-decided 2026-08-12.) A CLOSED VOCABULARY OF ABSOLUTE LEVELS. A
      boost names a fixed degree of claim rather than a magnitude picked against
      whatever currently shares the node's band, so a value is commensurable
      across bands and tiers and BAND COLLISION — two separate bands converging
      so nodes calibrated against different neighbour sets compare directly —
      becomes harmless instead of silently miscalibrating. This CLOSES
      kind-kind's per-band attention.scope stamp as REJECTED: that mechanism
      keys on the resolved band distributor, so it fires on distributor-identity
      change (already an explicit authoring act) and is silent on collision, and
      it was the only option needing a stored field and a write-path gate. It
      also RETIRES validateGraph rule 20 outright — both the single-scalar
      attention.tier field it reads (replaced by the per-tier map) and its
      justification ('a boost value is only meaningful within one tier's scale',
      false under an absolute vocabulary). This node owns the level values:
      background 5 / low 10 / normal 20 / high 50 / urgent 85, which snap the
      live population 10 / 14 / 32 / 28 / 7 with only ~11 of 91 nodes moving
      more than a rounding step (91 values, 17 distinct today, six values
      covering 88%). The names and values are the judgment call and are cheap to
      change; what is decided is that the vocabulary is closed and absolute.
      Declare the levels as one exported constant so validateGraph can reject an
      off-vocabulary boost on the write path — the check that replaces rule 20.
      PER-TIER BOOSTS ARE RETAINED: the vocabulary governs which values are
      authorable, the per-tier structure governs how many boosts a node carries
      and exists for coverage; orthogonal, both land. (Amended 2026-08-12,
      office-hours /align round that cleared tactic-attention-namespaced-rank's
      park.) OWNERSHIP CORRECTED: this node no longer owns the per-tier STORAGE
      SHAPE, nor validateGraph rule 20's retirement. Both move to
      tactic-attention-namespaced-rank. The reason is an entailment this entry
      missed: rule 20 (checkAttentionTierNamespace,
      packages/intentionsutil/src/schema.ts:1111-1121) requires attention.tier
      === ownTier(node), so it mechanically REJECTS the very authoring act
      per-tier boosts exist to enable -- a tier-1 strategy authoring a tier-2
      boost so its tier-lifted tactics band against something rather than
      against 0. Rule 20's retirement is therefore inseparable from the SHAPE
      change, not from this node's vocabulary; the calibration ground recorded
      here is a second, independent reason, not the load-bearing one for
      sequencing. What this node retains is unchanged in substance: the level
      values (background 5 / low 10 / normal 20 / high 50 / urgent 85), the
      single exported constant declaring them, the write-path check rejecting an
      off-vocabulary boost, the 0.01 ladder revert from
      attributes.pre_namespacing_boost, strategy-graph-review-curriculum's 3.5,
      and the last override VALUE (tactic-transition-node-stamp-landed-body).
      blocked_by: [tactic-attention-namespaced-rank] is unchanged and becomes
      genuinely load-bearing -- this node's migration now writes values INTO a
      map shape that node lands, rather than landing the shape itself. (Amended
      2026-08-14, author-directed stopgap.) THE blocked_by EDGE IS REMOVED. It
      had become a deadlock rather than a dependency:
      tactic-attention-namespaced-rank merged 2026-08-13 (PR #3075) but sits at
      phase main-qa, and blockersComplete
      (packages/intentionsutil/src/router.ts:239-244) clears a blocker only on
      phase done or absence from the store -- while that node's own main-qa
      needs-main residue awaits THIS node landing, so neither side could move.
      The loop was invisible to validateGraph because it closes across two
      mechanisms: a structural blocked_by edge here and a prose awaited-event in
      that node's needs-main residue section; no validator reads both. The
      edge's SUBSTANCE is already satisfied by merge rather than by phase -- the
      sparse per-tier boosts map, both legacy boost:/override: compat parse
      branches, and their removal-owner comments naming this node are all on
      origin/main (schema.ts:195, 435, 444 measured 2026-08-14), so the map
      shape this node writes values into exists today. The sequencing obligation
      survives as prose, not as a gate: confirm that shape is on main before
      starting. Three sibling nodes were released by the same removal being
      unnecessary for them -- tactic-attention-delegation-scoring,
      tactic-attention-unified-relation-cycle-rule and
      tactic-rsi-audit-prioritization-writer keep their edges and stay blocked
      until tactic-attention-namespaced-rank reaches done."
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-attention-per-tier-boost-migration
  pr: 3093
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by: []
office_hours:
  reason: "/implement: implementation deviated from the persisted plan — Unit 4
    (validateGraph rule 22 + legacy `boost:`/`override:` compat-branch deletion
    + kind-kind.md doctrine prose) is deferred to a follow-up PR rather than
    landing atomically with Unit 3 as the plan directed."
  since: 2026-08-14
  recommendation: >-
    # Recommendation: tactic-attention-per-tier-boost-migration


    Draft PR #3093 ships Units 1-3 of the plan (the boost-level vocabulary, the

    idempotent migration script, and the 91-node data migration itself) and is

    fully green locally: typecheck, lint, validate-graph, and the full

    packages/intentionsutil vitest suite (1040 tests, including the real-repo

    office-hours-select CLI suite) all pass.


    Unit 4 (validateGraph rule 22 rejecting an off-vocabulary boost, deletion of

    the legacy `boost:`/`override:` compat parse branches in
    `validateAttention`,

    and the kind-kind.md field-doctrine prose fix) was implemented and verified

    against a synthetic post-migration store, but was deliberately NOT included
    in

    this PR. Reason: `packages/intentionsutil/test/office-hours.test.ts`'s

    `describe.skipIf(!hasOriginMain())("office-hours-select CLI (real repo)")`

    block reads `intentions/` at the literal `origin/main` git ref (not this

    branch) via `listNodesStrict`, using THIS branch's code. Until this PR
    merges,

    `origin/main` still carries 69 node files on the legacy spelling. Landing

    Unit 4 here makes this branch's code reject `origin/main`'s live data, so
    that

    CI suite goes red — and CI runs with fetch-depth: 0, so `origin/main`
    resolves

    in GitHub Actions too, not just locally. That's a permanent, self-resolving-

    only-on-merge red check: a genuine chicken-and-egg, not a defect. An opus

    subagent investigated for ~15 minutes and confirmed no legitimate code fix

    exists that preserves both the test's real-origin/main guarantee and the

    legacy-branch deletion (full findings in the implement session transcript).


    Recommended next steps:

    1. Merge PR #3093 (Units 1-3) once reviewed — this alone fully retires the
       0.01 namespacing ladder and the override value, and gets every live node
       onto the closed level vocabulary. It leaves the legacy compat branches in
       schema.ts as dead-but-harmless code (no node file uses them anymore after
       merge) and leaves validateGraph without rule 22.
    2. After #3093 merges (so origin/main's intentions/ is canonical), open a
       small follow-up PR/tactic node carrying exactly the reverted Unit 4 diff:
       rule 22, the two legacy-branch deletions in validateAttention (+ the now-
       unused legacyTierKey), and the kind-kind.md field-doctrine rewrite. The
       full diff is saved for reuse in this job's tmp/unit4-deferred.patch (in the
       session that authored it — recover from that session's job dir if needed,
       or just re-run /implement-unit with the same Unit 4 scope text from this
       node's plan body, since the target state is well-specified and small).
    3. This node (tactic-attention-per-tier-boost-migration) itself: once #3093
       merges, either (a) reopen/continue this same node for the Unit 4 follow-up,
       or (b) close it as substantially complete and mint a small new tactic node
       for the Unit 4 residue, referencing this node's plan body for the exact
       scope. Either is reasonable; it's a judgment call for whoever picks this up.
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Migrate authored boosts onto the closed absolute level vocabulary, retire the interim 0.01 namespacing ladder and the last override value, and land the write-path vocabulary check

## Context

The 2026-08-12 `/align` round on `strategy-graph-drives-dispatch` unified the
ranking model: one parent relation (`parent` ∪ `serves` ∪ `recovers` ∪
reverse-`blocked_by`), per-tier authored boosts, a `(tier, band, score, depth)`
rank key, and no `override`, no minimum-boost-of-1, no signal term, no separate
blocking-precedence lift. A later author decision in the same round settled that
an authored boost is a **LEVEL drawn from a closed vocabulary of ABSOLUTE
values** — a boost names a fixed degree of claim, so the same value means the
same thing in every band and every tier, and band collision is harmless.

The **shape/value seam** (recorded on `strategy-graph-drives-dispatch`, office-hours
round 2026-08-12) splits the work: a change to the ranking model's data SHAPE
lands with the algebra that consumes it; the authored VALUES that populate the
shape land separately. `tactic-attention-namespaced-rank` landed the shape
(PR #3075, merged 2026-08-13) — the sparse `boosts: {tierKey: value}` map, the
deletion of `attention.override` from the live model, and the retirement of
`validateGraph` rule 20. This node owns the **values**: the level vocabulary
constant, the write-path check on it, the 0.01 ladder revert, the last
`override` value, and the deletion of the two legacy compat parse branches that
`tactic-attention-namespaced-rank` explicitly left behind for this node.

> **Scope corrected 2026-08-12** (office-hours `/align` round that cleared
> `tactic-attention-namespaced-rank`'s park). This node does **not** own the
> per-tier storage shape or rule 20's retirement — both landed there.
> `blocked_by: [tactic-attention-namespaced-rank]` WAS load-bearing but was
> REMOVED 2026-08-14 (author-directed) because it had become a mutual deadlock:
> that node's own `needs-main` residue was waiting on this node landing. The
> edge's substance is independently confirmed on `origin/main`, so this node is
> genuinely unblocked.

### Repo state verified this session (2026-08-14, worktree at `d8c95d45`)

Confirmed present on `main`:

- `packages/intentionsutil/src/schema.ts:194-197` — `interface Attention { boosts: Record<string, number>; rationale: string }`, the canonical sparse map.
- `schema.ts:416` — canonical `value.boosts` parse branch.
- `schema.ts:433-441` — LEGACY `value.boost` branch, commented *"owned by tactic-attention-per-tier-boost-migration … Delete this branch once those node files are rewritten"*.
- `schema.ts:442-471` — LEGACY `value.override` branch, same ownership comment; `override: 0` is explicitly REJECTED (not mapped to an empty map) because a read/write round-trip would otherwise corrupt the node out of the graph.
- `schema.ts:473-477` — an attention block resolving to an empty `boosts` map is rejected.
- `schema.ts:1477-1480` — rule catalog: *"20. RETIRED … 20 is burned, so the next new rule takes 21."* Rule 21 (`measured_impact` shape) is taken, so **the next free rule number is 22**.
- `packages/intentionsutil/src/attention.ts:592` — `attention?.boosts[tierKey] ?? 0`, the single resolver consumer. No resolver change is needed by this node.

Confirmed ABSENT on `main` (this node's unbuilt work):

- No boost-level vocabulary constant anywhere in `packages/intentionsutil/src`.
- No off-vocabulary write-path check in `validateGraph`.

### Re-measured live population (this session, `intentions/*.md`, 597 node files)

Measured by parsing each file's frontmatter — these figures **supersede** the
2026-08-12 interview baseline (91/597, 43 non-integer) and the 2026-08-14
estimates previously recorded on this node (70/23/44):

| form | count | notes |
|---|---|---|
| legacy `boost:` scalar | 68 | 22 non-integer (ladder values); 22 of the 68 carry an explicit `tier: 1` tag, 46 carry no tag |
| canonical `boosts:` map | 23 | **all keyed `"1"`**; 20 of them carry ladder values |
| legacy `override:` non-null | 1 | `tactic-transition-node-stamp-landed-body`, `override: 60`, no `tier:` tag, `phase: done` |
| **total attention-carrying** | **92** | every one of them is rewritten by this migration |
| `attributes.pre_namespacing_boost` | 42 | 22 on the legacy scalar form + 20 on the canonical map form |
| `attention.tier` tag with a value other than `1` | 0 | no tier-2/3 authored boost exists to migrate |

**Correction to prior narrative on this node.** The earlier claim that the
canonical-`boosts:` nodes were "authored after the shape landed; leave
untouched" is **false**: 20 of the 23 carry 0.01-ladder values and a
`pre_namespacing_boost` attribute, and must be reverted and snapped exactly like
the legacy-form nodes. Only 3 canonical-form nodes carry integer values (8, 5, 6).

Distinct live values (after the ladder revert described below), and their snap targets:

| live/reverted value | count | snaps to |
|---|---|---|
| 1, 3, 3.5, 5, 6, 7 | 11 | `background` = 5 |
| 8, 10, 12 | 15 | `low` = 10 |
| 20 | 32 | `normal` = 20 |
| 50, 55, 56 | 28 | `high` = 50 |
| 75, 85, 90, 96 | 7 | `urgent` = 85 |

### The 0.01 ladder is REVERTED, not rescaled

The whole non-integer population is the 2026-08-11 **NAMESPACING STOPGAP**:
magnitudes hand-compressed onto a 0.01-per-level ladder so a tactic boost could
not lift a node out of its parent strategy's band, with the original magnitude
preserved at `attributes.pre_namespacing_boost`. The stopgap's own rationale
prose records that the bound *"is NOT yet enforced by the resolver"*.

It is enforced now. `attention.ts`'s `band` axis (`bandFor`,
`packages/intentionsutil/src/attention.ts:335-370`) is the max score among a
node's parents read in the child's resolved tier, and the rank key sorts
`(tier, band, score, depth)` descending — so a whole cohort under one hot
strategy sorts together **before** any member's own score is consulted. A
tactic's own boost can no longer lift it past a tactic of a higher-banded
strategy, structurally. The stopgap's reason to exist has ended, so the ladder is
reverted from `pre_namespacing_boost` rather than carried forward or rescaled.

**Accepted consequence, recorded deliberately.** Snapping collapses some
within-band distinctions (12 and 10 both become 10; 55 and 50 both become 50).
This is doctrine, not a defect — `strategy-graph-drives-dispatch` records that
"equal ranks are honest ties", and the level vocabulary exists precisely so a
magnitude names an absolute degree of claim rather than a position relative to
current band-mates.

## Unit 1 — Declare the closed boost-level vocabulary in `schema.ts`

**Scope.** `packages/intentionsutil/src/schema.ts` only.

Add, immediately after `TIER_KEYS` (`schema.ts:380`) so the two closed
vocabularies sit together — `TIER_KEYS` gates the map's **keys**, this gates the
map's **values**:

```ts
/**
 * The closed vocabulary of authorable boost LEVELS.
 *
 * A boost is a LEVEL, not a free magnitude: it names a fixed degree of claim,
 * so the same value means the same thing in every band and every tier
 * (`strategy-graph-drives-dispatch`, the level-vocabulary clarification,
 * 2026-08-12). That absoluteness is what makes band collision harmless and
 * what retires the rejected per-band `attention.scope` stamp.
 *
 * The NAMES and VALUES are the one judgment call here and are cheap to revise;
 * what is decided is that the vocabulary is CLOSED and ABSOLUTE, not that it
 * has exactly these five entries. Enforced on the write path by validateGraph
 * rule 22.
 */
export const BOOST_LEVELS = {
  background: 5,
  low: 10,
  normal: 20,
  high: 50,
  urgent: 85,
} as const;

/** The legal authored boost values, ascending. */
export const BOOST_LEVEL_VALUES: readonly number[] = Object.values(BOOST_LEVELS);
```

Add unit tests in `packages/intentionsutil/test/schema.test.ts` asserting the
constant is non-empty, strictly ascending, all-finite, all-positive, and that
`BOOST_LEVEL_VALUES` and `Object.values(BOOST_LEVELS)` agree.

**Out of scope for this unit:** the `validateGraph` rule (Unit 4), any node-file
edit, any change to `validateAttention`.

**Recommended model:** sonnet.

## Unit 2 — Build the idempotent boost-migration script

**Scope.** New file `packages/intentionsutil/scripts/migrate-boost-levels.ts`,
new test `packages/intentionsutil/test/migrate-boost-levels.test.ts`. No
production `src/` change beyond importing Unit 1's constant. No node files are
written by this unit — Unit 3 runs the script.

**Design.** Model the script wholesale on
`packages/intentionsutil/scripts/reconcile-graph.ts:144-233` (enumerate → mutate
in memory → `if (!args.noApply) writeNode(...)` → print a JSON plan) and its CLI
conventions at `reconcile-graph.ts:171-183`. Resolve the default intentions dir
from `dirname(fileURLToPath(import.meta.url))`, **never** cwd — the convention at
`packages/intentionsutil/scripts/write-node.ts:17-23`.

CLI: `--dir <intentions-dir>` (default: repo-local `intentions/`),
`--no-apply` (identical traversal, no writes, prints the plan),
`--check` (identical traversal, no writes, **exits non-zero** if any node still
needs migrating — this is the idempotence fence used in `## Verification`).

**Enumeration.** Use `listNodesStrict(dir)`
(`packages/intentionsutil/src/store.ts:249`), never the tolerant `listNodes`: a
migration that writes back must fail loudly on an unreadable file rather than
silently skip it.

**Per-node algorithm.** For each node with a non-null `attention`:

1. **Form conversion is free — do not hand-write it.** `readNode`/`listNodesStrict`
   already run `validateAttention` (`schema.ts:409-485`), which normalizes a
   legacy `boost:`/`override:` scalar plus optional `tier:` tag into the
   canonical `boosts` map via `legacyTierKey` (`schema.ts:388-397`, defaulting an
   absent tag to `"1"`). `writeNode` (`store.ts:52`) serializes
   `stringify(validateNode(node))`, so the canonical map is what lands on disk.
   The script therefore reads a parsed `boosts` map and writes a parsed `boosts`
   map; the legacy spelling disappears as a side effect of the round-trip.
   Do **not** reimplement `legacyTierKey` or `requirePositiveBoost`
   (`schema.ts:399-407`).
2. **Ladder revert.** If `node.attributes.pre_namespacing_boost` is present:
   assert it is a finite number > 0 (hard error otherwise, no coercion), replace
   `boosts["1"]` with it, and **delete the `pre_namespacing_boost` attribute**.
   Assert the node's `boosts` map has exactly the one key `"1"` before doing so —
   the reverted magnitude was chosen on the tier-1 scale and must not be written
   into another tier's namespace. Any node violating that assertion is a hard
   error, not a silent skip.
3. **Rationale prose strip.** All 42 `pre_namespacing_boost` nodes carry a
   uniform TRAILING paragraph in `attention.rationale` beginning
   `NAMESPACING STOPGAP 2026-08-11: magnitude compressed from …` and ending with
   `Original magnitude preserved at attributes.pre_namespacing_boost for
   restoration.` (verified this session: 42/42 present, 42/42 trailing, one
   opening variant). Remove that paragraph and any whitespace it leaves, restoring
   the pre-stopgap rationale exactly. The strip is **required, not cosmetic**: left
   standing it asserts a compressed value that no longer exists and points at an
   attribute this migration deletes. If any node's stopgap text is not the trailing
   paragraph, or does not match the expected opening, hard-error rather than guess.
4. **Snap to a level.** Replace each boost value with the nearest member of
   `BOOST_LEVEL_VALUES` by absolute distance; on an exact tie choose the HIGHER
   level (never silently demote a claim). No live value sits on a tie point —
   the midpoints are 7.5 / 15 / 35 / 67.5 and no measured value hits one — so the
   tie rule is a guard, not a live path. Export `snapToLevel(value: number): number`
   from the script module for unit testing.
5. **Migration note.** ONLY where the snapped value differs from the value the
   node carried entering step 4, append one dated line to
   `attention.rationale`, e.g.
   `LEVEL MIGRATION 2026-08-14: boost snapped from 12 to the closed level
   vocabulary value 10 (low) per strategy-graph-drives-dispatch's
   level-vocabulary clarification; ordering intent unchanged.`
   About 22 nodes need this; the other ~70 land on a level unchanged and get no
   note. Do not backtick-quote node ids inside generated prose unless the id
   resolves — `validateGraphProseRefs` checks backticked id-shaped refs.
6. **The one `override` node.** `tactic-transition-node-stamp-landed-body`
   (`intentions/tactic-transition-node-stamp-landed-body.md:34-36`, `boost: null`
   / `override: 60`, no `tier:` tag, `phase: done`) is special-cased by id: set
   `attention: null` outright. The override value is **dropped, not converted** —
   that is the explicit author instruction, its `boost:` sibling field is `null`
   so there is nothing to fall back to, and a `done` node contributes nothing to
   any axis under the unified algorithm (`attention.ts:428-440`), so no ordering
   depends on it. Assert the node is at `phase: "done"` before dropping; if it has
   moved off `done`, hard-error and escalate rather than silently discarding an
   authored claim.
7. **Write only when something changed.** Compare the mutated node to the node as
   read; skip `writeNode` when identical, so `--check` is a true no-op fence after
   Unit 3.

**Hard-error, never coerce.** Any `0`, negative, or non-finite value encountered
in `pre_namespacing_boost` or in a `boosts` entry is a hard error the script
surfaces by id. This preserves the precedent documented at `schema.ts:442-470`,
where `override: 0` is deliberately rejected rather than mapped to an empty map.

**Tests** (`packages/intentionsutil/test/migrate-boost-levels.test.ts`, modeled on
`packages/intentionsutil/test/reconcile-graph.test.ts`): `snapToLevel` for every
live value in the table above plus both tie-break directions; a synthetic fixture
dir exercising each of legacy-scalar-with-tag, legacy-scalar-untagged,
canonical-map-with-ladder, canonical-map-clean, and the override node; idempotence
(a second `--apply` run writes nothing and `--check` exits 0); `--check` exits
non-zero on an unmigrated fixture; a rationale whose stopgap paragraph is
non-trailing hard-errors.

**Recommended model:** opus.

**Dependencies:** Unit 1.

## Unit 3 — Run the migration over `intentions/` (data-only commit)

**Scope.** `intentions/*.md` only — the 92 attention-carrying node files. No code
change. Keep this a separate commit from Units 1/2/4 so the code diff stays
reviewable next to a 92-file data churn.

Steps:

1. `npx tsx packages/intentionsutil/scripts/migrate-boost-levels.ts --dir intentions --no-apply` and read the printed plan.
2. Reconcile the plan against the measured table in `## Context`: 92 nodes touched, 42 ladder reverts, ~22 migration notes, exactly 1 node dropping to `attention: null`. A material divergence means the graph moved under the plan — stop and re-measure rather than applying.
3. Run without `--no-apply`.
4. Read the resulting diff for at least these three worked examples:
   - `intentions/strategy-graph-review-curriculum.md:270-271` — `boost: 3.5` becomes `boosts: {"1": 5}`, with a migration note.
   - `intentions/tactic-attention-tier-ranking.md` — `boosts: {"1": 0.02}` + `pre_namespacing_boost: 50` becomes `boosts: {"1": 50}`, attribute gone, stopgap paragraph gone, no migration note (50 is a level).
   - `intentions/tactic-transition-node-stamp-landed-body.md:34-36` — the whole `attention` block becomes `attention: null`.
5. Confirm no markdown BODY changed: `writeNode` preserves bodies verbatim (`store.ts:52-63` and its `assertNoBodyLoss` guard), so any body diff is a regression to stop on.

**Out of scope:** any hand-edit of a node file. Every change goes through the
script so it is reproducible and so `--check` is a meaningful fence afterwards.

**Recommended model:** sonnet.

**Dependencies:** Units 1, 2.

## Unit 4 — Rule 22, legacy-branch deletion, and the doctrine prose

**Scope.** `packages/intentionsutil/src/schema.ts`,
`packages/intentionsutil/test/schema.test.ts`, `intentions/kind-kind.md`.

1. **Add `validateGraph` rule 22 — the off-vocabulary boost check.** Model it
   structurally on `checkStatusVocabulary` (rule 16, `schema.ts:1192-1207`): read
   the closed set (here `BOOST_LEVEL_VALUES` from Unit 1), no-op when
   `node.attention` is null (the goal-layer gate is rule 5's job, do not duplicate
   it), and push one `problems[]` line per offending entry naming the node id, the
   tier key, and the value. Wire the call into the per-node loop right after the
   rule-21 call at `schema.ts:1539-1540`. Add the rule-22 entry to the catalog
   doc-comment after the rule-21 entry (`schema.ts:1481-1495`).

   **This is a NEW check for a NEW purpose, not a transfer of retired rule 20's
   obligation.** Rule 20 (`checkAttentionTierNamespace`) required
   `attention.tier === ownTier(node)`, which mechanically rejected a tier-1
   strategy authoring a tier-2 boost — the very act per-tier boosts exist to
   enable — so it retired with the storage shape. Under the per-tier map a tier-1
   boost simply stays a tier-1 boost when a node's tier changes; that obligation
   **dissolved** rather than moving here. Do not reuse the number 20 or the name
   `checkAttentionTierNamespace`; the catalog at `schema.ts:1477-1480` records
   that 20 is burned.

2. **Delete the two legacy compat parse branches** in `validateAttention`:
   `schema.ts:433-441` (`value.boost`) and `schema.ts:442-471` (`value.override`).
   After Unit 3 no node file uses either spelling, so they are dead. Delete
   `legacyTierKey` (`schema.ts:388-397`) if it has no remaining caller. Keep
   `requirePositiveBoost` (`schema.ts:399-407`) — the canonical branch uses it —
   and keep the empty-map rejection at `schema.ts:473-477`.

3. **Fix the stale canonical field definition.** `intentions/kind-kind.md:315-317`
   still reads *"attention: authored boost XOR override, plus required
   rationale"*. `kind-strategy.md:99-100` and `kind-tactic.md:85-86` both defer to
   this line as the canonical definition, so it is the one place to fix. Rewrite it
   to describe the per-tier `boosts` map keyed by tier, the closed absolute level
   vocabulary, the required non-empty rationale, and the sparseness rule (an absent
   tier key means "no claim in that tier" and is distinct from an authored lowest
   value). Keep the line inside the existing `fields:` list format.

4. **Tests.** In `packages/intentionsutil/test/schema.test.ts`: rule 22 rejects an
   off-vocabulary value (e.g. `{"1": 7}`) naming the node and value; rule 22 accepts
   every member of `BOOST_LEVEL_VALUES`; rule 22 no-ops on `attention: null`; and
   `validateAttention` now THROWS on `{boost: 20, rationale}` and on
   `{override: 60, rationale}` — the branches are gone, and that throw is what
   `listNodesStrict` turns into a loud CI failure for any node file that regresses
   to a legacy spelling.

**Atomicity requirement — this unit MUST land in the same PR as Unit 3.**
`packages/intentionsutil/test/committed-store.test.ts` runs
`listNodesStrict(intentions)` + `validateGraph(...)` + `resolveAttention(...)`
over the LIVE `intentions/` store on ordinary PR CI. Rule 22 without the data
migration turns main red on 92 nodes; the legacy-branch deletion without the data
migration makes 69 node files unparseable. Sequence Unit 3 before Unit 4 on the
branch so no intermediate commit is red.

**Out of scope:** any change to `attention.ts` (its only boost consumer,
`attention.ts:592`, reads the map and needs nothing); rule 20 (already retired);
whole-relation cycle rejection (owned by
`tactic-attention-unified-relation-cycle-rule`); any `.claude/skills/**` prose
sweep (see the residue note below).

**Recommended model:** opus.

**Dependencies:** Units 1, 2, 3.

## What this node does NOT own (confirm, do not re-implement)

- The `boosts: {tier: value}` storage shape — landed by
  `tactic-attention-namespaced-rank` (`schema.ts:194-197`, `validateAttention`,
  `TIER_KEYS`).
- `validateGraph` rule 20's retirement — already done there.
- The sparseness constraint this node retains as a **constraint on** the shape
  rather than ownership of it: an unauthored tier must stay distinguishable from
  an authored lowest value, so "not yet ranked in this tier" never reads as
  "ranked last". The sparse `Record<string, number>` with absent-key-means-no-claim
  already satisfies it, documented at `schema.ts:180-186` (*"Never write a `0` into
  the stored map to stand for an unauthored tier"*). **Verify by reading; do not
  re-implement.**
- Per-tier boosts themselves are RETAINED (author-directed). The vocabulary governs
  WHICH VALUES are authorable; the per-tier structure governs how many boosts a
  node carries. Orthogonal.

## Known residue this PR does not clear

`.claude/skills/align/SKILL.md:413,530` and
`.claude/skills/align-tactics/references/tactic-target.md:63` still name
`attention.boost` / "boost/override" as field spellings. They are prose, not
executable authoring instructions, and skill-file commits are denied in
autonomous sessions — so they stay out of scope and should be recorded as
follow-up residue rather than attempted here.

## Reuse

- `listNodesStrict(dir)` — `packages/intentionsutil/src/store.ts:249`. Strict enumeration for the migration; a write-back migration must fail loudly on an unreadable file.
- `writeNode(dir, node)` — `packages/intentionsutil/src/store.ts:52`. The single validated write path: re-validates via `validateNode`, preserves the markdown body verbatim, writes atomically. **It also performs the legacy→canonical form conversion for free**, because it serializes the validated node. Never hand-write YAML frontmatter.
- `readNode(dir, id)` — `packages/intentionsutil/src/store.ts:153`, for a per-id re-read.
- `reconcileGraph`'s traversal/apply shape — `packages/intentionsutil/scripts/reconcile-graph.ts:144-233`, and its `--dir` / `--no-apply` / `main()`-guard conventions at `reconcile-graph.ts:171-183`. The closest existing "iterate the whole store, rewrite a field, preview-then-write" precedent.
- Script dir resolution from `import.meta.url`, never cwd — `packages/intentionsutil/scripts/write-node.ts:17-23` (also `restamp-scope-fingerprint.ts:52-57`).
- `TIERS` / `TIER_KEYS` — `packages/intentionsutil/src/schema.ts:29,380`. The existing closed-vocabulary-plus-validator pattern to model `BOOST_LEVELS` on. `TIER_KEYS` gates the map's keys; `BOOST_LEVEL_VALUES` gates its values. No new tier constant is needed.
- `legacyTierKey` — `schema.ts:388-397`. Absent `tier:` tag defaults to `"1"`. Reuse the parser's behavior via `readNode` rather than re-deriving it; delete the function in Unit 4 once it has no caller.
- `requirePositiveBoost` — `schema.ts:399-407`. Finite-and-positive check; retained by the canonical branch.
- `validateAttention` — `schema.ts:409-485`. Precedence `boosts` > `boost` > `override`; the empty-map rejection at 473-477 and the `override: 0` rejection rationale at 442-470 are the precedents the migration must not weaken.
- `checkStatusVocabulary` (rule 16) — `schema.ts:1192-1207`. Structural template for rule 22: closed-set membership, per-node problem message, no-op when the field is absent.
- `checkTierMarkShape` (rule 19) — `schema.ts:1292-1307` — and `checkMeasuredImpactShape` (rule 21) — `schema.ts:1332`. Rule-numbering, doc-comment, and wiring conventions.
- `validateGraph` per-node loop — `schema.ts:1502-1545`; add the rule-22 call after `checkMeasuredImpactShape` at line 1539-1540.
- `resolveAttention` band doctrine — `packages/intentionsutil/src/attention.ts:335-370` (`bandFor`) and `405-460` (axis definitions). Read-only: this is the evidence that the ladder's bound is now structural. No change.
- `committed-store.test.ts` — `packages/intentionsutil/test/committed-store.test.ts`. The live-store CI gate that makes Units 3 and 4 atomic.
- `reconcile-graph.test.ts` — `packages/intentionsutil/test/reconcile-graph.test.ts`. Fixture-dir test shape for a store-mutating script.

## Verification

Run from the repo root. `run-typecheck.sh` and the vitest project selector are
both cwd-sensitive — a foreign cwd makes them pass vacuously.

```verify
node --import tsx/esm packages/intentionsutil/scripts/migrate-boost-levels.ts --dir intentions --check
```

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
bash .claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
```

```verify
bash .claude/skills/dispatch-propagate/scripts/run-lint.sh
```

What each fence proves:

- `--check` is the **idempotence and residue fence**: it exits non-zero if any node still carries a `pre_namespacing_boost` attribute, a stopgap rationale paragraph, or an off-vocabulary boost value. It replaces a raw `grep` over `intentions/`, which would false-fail forever — this very node body quotes `pre_namespacing_boost` and `NAMESPACING STOPGAP` as plan prose.
- `validate-graph.ts` runs `validateGraph` (including rule 22), `validateGraphProseRefs`, and `lintTacticBodies` over the live store.
- The vitest project run covers `committed-store.test.ts` (`listNodesStrict` + `validateGraph` + `resolveAttention` over all 597 live nodes — the gate that would catch any node file left on a deleted legacy spelling), plus the new `schema.test.ts` and `migrate-boost-levels.test.ts` cases.

**Sandbox caveat, measured this session.** Under the Bash sandbox, four
`packages/intentionsutil/test/office-hours.test.ts` cases fail at
`execFileSync("npx", ["tsx", …])` (`office-hours.test.ts:49`). With the sandbox
override the whole 49-file / 1017-test suite passes. These four failures are a
sandbox artifact, not a regression from this change — if they appear, re-run the
vitest fence with the sandbox disabled before treating it as red.

Manual checks (judgment, not auto-runnable):

- **Ranking sanity.** Capture `npx tsx packages/intentionsutil/scripts/select-targets.ts --dir intentions` BEFORE Unit 3 and again after, and read the two top-20 lists side by side. Expect: cohorts still grouped by their strategy's band (band is the second axis, so the ladder revert must not move a tactic across strategy cohorts), some within-cohort reordering as restored magnitudes replace compressed ones, and some new exact ties where snapping collapsed 12→10 or 55→50. A tactic jumping ACROSS strategy cohorts is a red flag — it would mean the band axis is not doing the work the ladder revert assumes, and the revert should be halted rather than shipped.
- **Office-hours penalty composition.** Read `packages/intentionsutil/src/officeHours.ts:13` (`SESSION_TYPE_PENALTY = 0.5`) and its single call site at `officeHours.ts:111`. It is applied by the office-hours selector OUTSIDE the rank key and the 2026-08-12 round did not change it. Confirm it still composes sensibly now that every boost is an integer level — no behavior change is expected, but confirm by reading rather than assuming. `packages/intentionsutil/test/office-hours.test.ts` covers it.
- **Sparseness constraint.** Read the doc comment at `packages/intentionsutil/src/schema.ts:180-186` and confirm it still states that an absent tier key is distinct from an authored lowest value and that `0` is never written into the stored map. Verify only; this landed with `tactic-attention-namespaced-rank`.
- **Diff review of the three worked examples** listed in Unit 3, step 4, plus a spot check that no markdown body changed anywhere in the 92-file diff.
