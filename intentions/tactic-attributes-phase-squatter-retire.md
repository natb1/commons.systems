---
id: tactic-attributes-phase-squatter-retire
kind: tactic
statement: "Retire the attributes.phase squatter representation outright:
  backfill the 3 remaining phase:null + attributes.phase:main-qa nodes to
  first-class phase, delete the six squatter fallback readers in
  check-node-selection.ts, and make validate-graph reject any attributes key
  that shadows a first-class field so the misroute class cannot recur"
owner: ai
status: codified
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
  first-class phase:main-qa, which these squatters are invisible to. Finalized
  2026-08-20: the population was re-measured at three, not six — f42da977
  (2026-08-04) had already lifted the other three — and the reader surface at
  six squatter-aware functions rather than the three lines the filing cited, so
  the plan scopes both to the measured state."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: pr16-node-mutation-scripts
  pr: 3138
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-30T00:43:02Z
    mergeCommitSha: 96d22cb13f56d4240305033b9ad9af76009f9ceb
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Retire the attributes.phase squatter representation outright: backfill the remaining phase:null + attributes.phase:main-qa nodes to first-class phase, delete the squatter fallback readers, and make validate-graph reject any attributes key that shadows a first-class field

## Context

Before `schema.ts` carried a first-class `phase` field, a node's phase was
written into the free-form `attributes` bag as `attributes.phase`.
`tactic-schema-migration-backfill` (`234e52e7`, 2026-07-07) lifted 14 nodes off
that squatter onto first-class `phase`, but the keyspace split was never closed:

1. Nodes kept being written in the squatter form *after* that migration whenever
   the value they needed was missing from `PHASES`. The canonical case is
   `451e9ed8` (2026-07-10), which moved `tactic-attention-surface-graph-read`
   from `phase: review` to `phase: null` + `attributes.phase: main-qa` because
   `PHASES` had no `main-qa` member yet. PR #2859 (`4486b25d`) added `main-qa`
   to `PHASES` the next day, but no pass re-backfilled the nodes written in the
   gap.
2. Readers still tolerate the squatter, so the split stays invisible until it
   causes a misroute.

**The failure mode is data loss, not cosmetics.** `router.ts`'s `isDraft()`
(`packages/intentionsutil/src/router.ts:139-141`) is
`tactic.phase === null || tactic.phase === "draft"` — it does **not** consult
`attributes.phase`. The draft/frozen candidate loop
(`packages/intentionsutil/src/router.ts:456-471`) builds directly on it, so a
squatter node is emitted every tick as an `/align-tactics` draft candidate with
`pr: null` (line 468), despite carrying a real merged `execution.pr`.
`/align-tactics` then finalizes a draft/raw target by landing
`status: codified`, `phase: implement`, `execution: null`
(`.claude/skills/align-tactics/references/tactic-target.md:65`) — and that
`execution: null` **wipes** the node's merged PR number, its `reviewed` /
`qa-done` markers, its branch, and its strategy fingerprint. Nothing guards
this; only the nodes' low attention rank has kept the path from firing.

### Live population — measured 2026-08-20 against this worktree at `c281e300`

The stored body of this node claimed six nodes. **It is three.** Commit
`f42da977` (2026-08-04, "graph: bootstrap step 1a — unpark 7 nodes, migrate 3
attributes.phase squatters to phase main-qa, resolve baseline-proxy to done")
already hand-migrated three of the six: `tactic-noncodegen-session-model-defaults`,
`tactic-outcome-envelope-qa-accounting` and `tactic-token-audit-node-attribution`
are now `phase: done` with `attributes: {}` and their `execution` objects intact.
**No data was lost.** The remaining set, verified by reading every node's
frontmatter in `intentions/`:

| node | file:line of the squat | `execution.pr` | `execution.markers` | serves |
|---|---|---|---|---|
| `tactic-attention-surface-analytics-collector` | `intentions/tactic-attention-surface-analytics-collector.md:24,38-39` | 2783 | `[reviewed]` | `strategy-attention-surface` |
| `tactic-budget-txn-identity` | `intentions/tactic-budget-txn-identity.md:24,38-39` | 2832 | `[reviewed]` | `strategy-recover-finance` |
| `tactic-indieweb-audience` | `intentions/tactic-indieweb-audience.md:24,38-39` | 2802 | `[reviewed]` | `strategy-own-audience` |

All three are `phase: null`, `status: codified`, `office_hours: null`,
`attributes: {phase: main-qa}` and nothing else. A repo-wide read also confirms
**zero** nodes carry `attributes.execution`, `attributes.office_hours`,
`attributes.validates`, `attributes.blocked_by`, `attributes.rounds` or
`attributes.pace_exempt` — `attributes.phase` on those three files is the entire
live squatter population, and the `execution`-squatter branches of the readers
below are already dead code.

### The reader surface has grown, not shrunk

The stored body named `check-node-selection.ts:29-31` as a three-line fallback.
That is now only the header-comment clause at
`packages/intentionsutil/scripts/check-node-selection.ts:30-32`; the actual
fallbacks live in a dedicated `// --- Squatter-aware directive reads ---` block
at `:79-198` and are **six** functions:

| function | anchor | first-class source it shadows |
|---|---|---|
| `readPhase` | `check-node-selection.ts:84-88` | `node.phase` |
| `readParked` | `:90-94` | `node.office_hours !== null` |
| `readStrategyFingerprint` | `:96-134` | `node.execution?.strategy_fingerprint ?? null` |
| `readMarkers` | `:136-152` | `node.execution?.markers ?? []` |
| `readFixState` | `:154-173` | `node.execution?.fix ?? null` |
| `readConflictState` | `:175-198` | `node.execution?.conflict ?? null` |

The last four already say in their own doc comments that "in practice only the
first-class read fires; the squatter fallback is kept for uniformity". The
header comment at `:31` scopes itself "until tactic-schema-migration-backfill
lands" — that node landed 2026-07-07 and has since been pruned, so the condition
is not even resolvable as written.

## Target design (greenfield)

**One representation.** No node in the store carries an `attributes` key that
shadows a first-class field, no reader knows what one is, and the write path
refuses to create one. Three properties, in this order:

1. **Backfill** — the three nodes above carry `phase: main-qa` first-class and
   `attributes: {}`. Their bodies and `execution` objects are untouched.
2. **Single read path** — `check-node-selection.ts` reads `node.phase`,
   `node.office_hours`, and `node.execution.*` directly. No fallback, no
   tolerance. `.claude/rules/code-style.md` asks for a clear error over a
   defensive fallback; here the correct posture is *no branch at all*, because
   after (1) and (3) the shadowed state cannot exist.
3. **Hard gate** — `validateGraph` rejects **any** `attributes` key whose name
   collides with a first-class `IntentionNode` field, with the forbidden set
   derived from the schema's own field list under a compiler-enforced
   completeness check rather than a hand-maintained second list. This is
   deliberately broader than banning `attributes.phase` alone: `phase` is the
   only key that ever squatted, but the *class* of defect is "a first-class
   field re-spelled inside the free-form bag", and a census of every
   `attributes` key currently in use (below) shows the general ban has exactly
   the three known violations and no false positives.

### Brownfield migration path

The three properties are backwards-incompatible with each other in one
direction only, so the sequencing is forced and is exactly the unit order below:
(1) must land on `origin/main` **before** (3), because `validate-graph` runs in
CI on every PR and on the graph fast path
(`.github/workflows/graph-fast-path.yml:32`,
`.github/workflows/unit-tests.yml:162`) — landing the gate while the three
squatters are still on disk reddens main for every subsequent commit. (2) is
safe in any position relative to (1) and (3) (the squatter branches are already
dead for `execution` and inert for the three `phase` nodes, which the selector
never routes through `readPhase` anyway), but is sequenced after (1) so no
window exists in which the readers are gone and the data is not yet migrated.

### Explicitly rejected alternative

Teaching `isDraft()` to treat an `attributes.phase`-carrying node as non-draft.
That was the recommendation recorded in the `office_hours` park of
`tactic-attention-surface-graph-read`, which the office-hours drain classified
INVALID (owed mechanical labor, not a required human input) and drained on
2026-07-30; the author ratified the drain session's dissent instead. A tolerant
reader suppresses the symptom while entrenching the legacy keyspace and adds one
more defensive fallback to the pile this tactic exists to remove.

## Also in scope — the stale doctrine that produced the squatter class

`.claude/skills/align-tactics/SKILL.md:427-431` still asserts, under
`## Out of scope`, that `phase: main-qa` "is in the spec enum (strategy
clarification 22) but **not** in `schema.ts`'s `PHASES`, so `write-node.ts`
would throw on it." **That has been false since PR #2859.** Verified today:
`PHASES` at `packages/intentionsutil/src/schema.ts:65-74` includes `"main-qa"`,
and `validateNode` accepts it (`schema.ts:1013`). This passage is the doctrinal
root of the whole squatter class — it is *why* a session that needed `main-qa`
reached for `attributes.phase`. Correct the factual claim in the same change.

Whether `/align-tactics` should now be allowed to **stamp** `main-qa` is a
separate question and is **out of scope**: only the false claim about
`PHASES`/`write-node.ts` is corrected; the surrounding "this skill lands only
`phase: implement`" rule stands.

## Out of scope

- `tactic-mainqa-record-time-routing` (currently `phase: implement`) and its
  record-time destination split. That tactic drains nodes *already at*
  first-class `phase: main-qa`; these squatters are invisible to it precisely
  because they sit at `phase: null`. The two are complementary — this one makes
  the squatters visible to that one. `intentions/tactic-mainqa-record-time-routing.md:689-690`
  already records the same boundary from the other side.
- Running the actual main-qa verification on any backfilled node. Backfilling
  only puts them on `/qa-main`'s queue.
- The `attributes` field itself, which stays free-form for genuine use.
- `intentions/kind-kind.md`'s prose rule ledger (`:695-727`). It is already
  drifted — it documents retired rule 20 as live and omits rule 22 entirely —
  and Rule 22 landed without touching it. Reconciling that ledger is a separate
  node-body edit on a `kind-*` node; do not expand this tactic into it.
- Near-miss decoys that must **not** be touched:
  `.claude/skills/reading-review/SKILL.md:644` (`attributes.curriculum`);
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh:203,431`
  (`attributes:{}` / `attributes:{ledger_entry:true}`);
  `.claude/skills/dispatch-propagate/scripts/test-lib-claim-fixed-vite-port.sh:114-131`
  (a *port* squatter — same word, unrelated concept);
  `packages/intentionsutil/scripts/list-conflict-nodes.ts:44-52` and its test at
  `packages/intentionsutil/test/list-conflict-nodes.test.ts:85-95` — that
  function's first-class-only read is the deliberate NEGATIVE case and its
  behavior is correct; only its prose changes (Unit 2).

---

## Unit 1 — Backfill the three squatter nodes to first-class `phase: main-qa`

**Scope.** Frontmatter-only edit to exactly three files, landed as ONE
state-only, direct-to-main `graph-commit` (no PR, no qa, no review — a pure
frontmatter migration has no user surface to QA and no code to review).
Precedent for the commit shape: `234e52e7` (2026-07-07, 14 nodes) and
`f42da977` (2026-08-04, 3 nodes), both state-only direct-to-main.

For each of `tactic-attention-surface-analytics-collector`,
`tactic-budget-txn-identity`, `tactic-indieweb-audience`:

- set `phase: "main-qa"` (first-class),
- set `attributes: {}`,
- change **nothing** else — `execution` (branch / `pr` / `attempts` / `markers`
  / `strategy_fingerprint`), `status`, `serves`, `office_hours` all stay
  byte-equal.

Procedure (all commands from the worktree root; `--dir` / `-C` are required and
have no default):

1. `npx tsx packages/intentionsutil/scripts/dump-node.ts --dir intentions --out-dir <tmp> tactic-attention-surface-analytics-collector tactic-budget-txn-identity tactic-indieweb-audience`
   — writes `<tmp>/<id>.json` plus `<tmp>/base-manifest.txt` of `<id>=<blobsha>`
   compare-and-swap tokens, and prints the manifest path
   (`packages/intentionsutil/scripts/dump-node.ts:45-50,151`).
2. Edit each JSON: `"phase": "main-qa"`, `"attributes": {}`.
3. `npx tsx packages/intentionsutil/scripts/write-node.ts --dir intentions --file <tmp>/<id>.json`
   for each — `writeNodeFromJson`
   (`packages/intentionsutil/scripts/write-node.ts:33-45`) is the single
   validation gate, and `writeNode` (`packages/intentionsutil/src/store.ts:52-59`)
   preserves the on-disk body via `readExistingBody` + `assertNoBodyLoss`
   (`packages/intentionsutil/src/store.ts:104-124`).
4. `packages/intentionsutil/scripts/graph-commit -C <worktree-root> --base <tmp>/base-manifest.txt -m 'graph: backfill 3 attributes.phase squatters to first-class phase main-qa' tactic-attention-surface-analytics-collector tactic-budget-txn-identity tactic-indieweb-audience`
   — one commit, all three nodes, CAS-pinned so a concurrent write to any of
   them refuses (exit 3) instead of silently reverting. Pass `-C` explicitly;
   without it graph-commit resolves the repo from **cwd**
   (`packages/intentionsutil/scripts/graph-commit:36-40`).

**Out of scope for this unit.** Any body edit to the three nodes; any code
change; any `.claude/**` change.

**Why this is safe on the phase ladder.** `main-qa` is NOT scope-chained at
either gate — `SCOPE_CHAINED_PHASES` is `{qa, review}` at
`packages/intentionsutil/src/scope-sweep.ts:31` and `{fix, qa, review}` at
`packages/intentionsutil/scripts/check-node-selection.ts:61` — so no
scope-fingerprint re-stamp is owed and the write cannot demote these nodes. And
`scopeFingerprint` hashes `statement` + body only, never frontmatter state
(`packages/intentionsutil/src/router.ts:115-128`), so a frontmatter-only edit is
scope-inert by construction. `strategyFingerprint`
(`packages/intentionsutil/src/router.ts:103-113`) reads only the *strategy's*
substance, so this write freezes nothing.

**Recommended model:** sonnet.

---

## Unit 2 — Delete the six squatter fallback readers and reconcile every prose reference to them

**Scope — code.** `packages/intentionsutil/scripts/check-node-selection.ts`:

- Delete the whole `// --- Squatter-aware directive reads ---` block
  (`:79-198`) and replace each call site with the first-class read:
  - `:253` `const phase = readPhase(node)` → `const phase = node.phase;`
  - `:255` `readFixState(node) === null` → `node.execution?.fix == null`
  - `:271` `readConflictState(node) === null` → `node.execution?.conflict == null`
  - `:294` `readMarkers(node).includes(REVIEWED_MARKER)` →
    `(node.execution?.markers ?? []).includes(REVIEWED_MARKER)`
  - `:310` `readParked(node)` → `node.office_hours !== null`
  - `:349` `readStrategyFingerprint(node)` →
    `node.execution?.strategy_fingerprint ?? null`
  Keep small named locals where a value is used more than once; do not
  reintroduce a wrapper function whose only job is a first-class field read.
- Remove the now-unused imports this creates: `isPlainObject` at `:53` becomes
  unused (only the deleted readers used it), and of the type import at `:54`
  only `IntentionNode` survives — `ConflictState`, `FixState` and
  `StrategyStampValue` were named solely by the deleted signatures. Leaving
  either line intact fails lint/typecheck.
- Rewrite the header-comment clause at `:30-32` ("The directive (phase /
  execution / office_hours) is read first-class, falling back to the
  `attributes.*` squatter convention (until tactic-schema-migration-backfill
  lands)") to state that the directive is read first-class only. Do not cite
  `tactic-schema-migration-backfill` — it is pruned and the prose-ref check
  resolves ids.
- Reword the two inline comments that name the squatter as a live alternative:
  `:236-249` ("an advance to any non-null phase — first-class or squatter — is a
  stale selection") and `:281` ("any non-null stored phase (first-class or
  squatter) is a stale advance"). The surrounding logic is correct and
  unchanged; only the parenthetical goes.

**Scope — tests.** `.claude/rules/test-integrity.md` binds: these tests assert
behavior that is being deliberately removed, so each is **replaced by its
inverse** (the squatter key is no longer honored) or rewritten onto the
first-class field. None may be deleted-and-forgotten or `.skip`ped.

`packages/intentionsutil/test/check-node-selection.test.ts`:

- `:72-81` "exit 12 on a squatter (attributes.phase) mismatch — and reads the
  squatter phase" → replace with a test proving the squatter is **ignored**: a
  node with `phase: null, attributes: {phase: "qa"}` selected at
  `align-tactics`. Assert the outcome the new first-class-only reader produces
  (the node reads as draft/null, not as `qa`).
- `:82-87` "passes when the selected phase matches the squatter phase" → replace
  with its inverse: the same fixture selected at `qa` must now exit 12 with
  `node is now draft/null`.
- `:221-235` "exit 12 when parked via the squatter convention
  (attributes.office_hours)" → replace with a test that
  `attributes.office_hours` no longer parks (exit 0), keeping the existing
  first-class park test at `:205-219` as the positive case.
- `:438-475` "a squatter object-form {hash, sha} stamp (attributes.execution)
  survives the reader and participates in staleness" (two seeds, fresh + stale)
  → replace with one test proving a squatted `attributes.execution` stamp is
  **not** read: a node whose only stamp is squatted and stale must now pass
  (exit 0), because there is no stamp to compare.
- `:561-568` "exit 12 when the stored phase advanced to a non-null value" — its
  fixture uses `attributes: { phase: "implement" }` on a strategy purely as a
  stand-in for "any non-null stored phase" (see its inline comment at `:563`).
  Rewrite the fixture to set first-class `phase: "implement"`; the assertion
  (`phase advanced to implement`) is unchanged and still correct.

`.claude/skills/dispatch-propagate/scripts/test-assert-node-selection.sh`:

- Test 5 at `:173-191` ("attributes.office_hours squatter populated,
  top-level office_hours null -> exit 12") → invert to assert exit **0**, and
  retitle it so it reads as the retirement guarantee rather than the retired
  behavior. Keep `ATTRIBUTES_BLOCK` and the 5th positional parameter of
  `write_node_fixture` (`:35`) — the helper is the only way to build an
  `attributes` fixture at the shell layer and the inverted test still needs it.
  This suite is auto-discovered by
  `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:190`.

**Scope — prose whose subject is the deleted code.** All four sites are verified
present today and all describe the readers being removed:

- `.claude/skills/qa-fix/SKILL.md:114-117` and
  `.claude/skills/qa-fix/references/target-resolution.md:47-50` — both say the
  front door's gate covers "first-class `office_hours` and the
  `attributes.office_hours` squatter alike", both hard-citing
  `check-node-selection.ts:90-94` applied at `:268-270`. The two are verbatim
  duplicates of one authored sentence (originating at
  `intentions/tactic-phase-entry-selection-gate.md:227`), so they must be edited
  **together** or they will disagree. Drop the "squatter alike" clause and
  re-verify both line anchors against the post-deletion file — `readParked` is
  gone and everything below it shifts by roughly 120 lines.
- `packages/intentionsutil/scripts/list-conflict-nodes.ts:39-42` and
  `packages/intentionsutil/test/list-conflict-nodes.test.ts:86-88` — both say
  the function reads first-class only, "never the `attributes` squatter path
  some other readers tolerate". Post-retirement no reader tolerates it, so the
  present-tense clause describes a codebase that no longer exists. Reword to the
  past tense or drop the clause. **Keep the function and the test behavior
  exactly as they are** — they are correct and unrelated to the retirement.
- `.claude/skills/dispatch-propagate/scripts/graph-auto-merge:238-239` — same
  "never the `attributes` squatter path some other readers tolerate" clause,
  same treatment.
- `.claude/skills/dispatch-propagate/scripts/dispatch-derive-node-target:15` —
  "office_hours park (first-class AND squatter)" → first-class only.

**Out of scope for this unit.** `validateGraph` (Unit 3);
`.claude/skills/align-tactics/SKILL.md` (Unit 4); any behavior change to
`conflictPrNumbers`; the `.claude/skills/**` decoys listed under
`## Out of scope` above. Note that `.claude/skills/**` is a sandbox
`denyWithinAllow` carve-out — the edits here need the corresponding permission
grant, and a tree-updating git op over those paths needs
`dangerouslyDisableSandbox: true` (`.claude/rules/sandbox.md`).

**Dependencies.** Unit 1.

**Recommended model:** opus.

---

## Unit 3 — `validateGraph` Rule 23: no `attributes` key may shadow a first-class field name

**Scope.** `packages/intentionsutil/src/schema.ts` and
`packages/intentionsutil/test/schema.test.ts`.

Add Rule **23** — the next unused number. Rule numbers are cross-referenced from
node bodies and are never reused: `20` is burned (retired, documented as such at
`schema.ts:1608-1611`), and the highest live rule is 22
(`checkWaitNodeShape`, `schema.ts:1378,1420`). `validateGraph` currently has no
rule constraining `attributes` key names at all — this is genuinely net-new.

Design:

1. A compiler-enforced field-name probe next to the existing top-of-file
   constants (`AUTHORABLE_TIERS` at `schema.ts:41` is the house precedent for an
   exported rule vocabulary):

   ```ts
   /** Every first-class IntentionNode field name. The Record<keyof …> type makes
    *  the compiler reject this object the moment a new field is added and not
    *  listed here, so the forbidden set can never drift from the schema. */
   const FIRST_CLASS_FIELD_PROBE: Record<keyof IntentionNode, true> = { … };
   export const FIRST_CLASS_FIELD_NAMES: readonly string[] =
     Object.keys(FIRST_CLASS_FIELD_PROBE);
   ```

   This satisfies "no second list kept in sync": the list exists, but omitting an
   entry is a type error, not silent drift.
2. `function checkAttributesShadowing(node: IntentionNode, problems: string[]): void`
   following the shape of `checkTierMarkShape` (`schema.ts:1298-1313`) — read
   `node.attributes` directly, push one templated problem per violating key.
   Presence itself is the violation (unlike Rule 21's
   `if (raw === undefined) return;` inert-when-absent idiom at `schema.ts:1340`),
   so it fires whenever a forbidden key is present with **any** value, including
   `null`.
3. Message style follows the house convention — `${node.id}: attributes.<key>`
   then an em-dash rationale clause, as at `schema.ts:1310`. E.g.
   `` `${node.id}: attributes.${key} shadows the first-class ${key} field — the attributes squatter convention is retired; write ${key} first-class` ``.
4. Call it unconditionally in the per-node dispatch loop, right after the Rule 22
   call at `schema.ts:1692`, with the same `// Rule 23: …` comment style.
5. Append a numbered `23.` paragraph to the doc-comment rule ledger above
   `validateGraph` (`schema.ts:1595-1651`), matching the existing prose shape:
   state the invariant, then explain *why* (a first-class field re-spelled inside
   the free-form bag gives one state two spellings and silently splits every
   reader; `attributes` stays free-form for everything that is not a field name).

**Why the general shadow-ban and not an `attributes.phase`-only ban.** A census
of every `attributes` key currently in use across `intentions/` (51 distinct
keys: `adopted`, `bug_fix`, `census`, `conditions`, `curriculum`, `fields`,
`goal_layer`, `ledger_entry`, `measured_impact`, `priority`, `security`,
`status_vocabulary`, `tier`, `traditions`, `validation_tier`, `hold_for`, `hold_kind`, …)
found `phase` to be the **only** one that collides with a first-class field
name. So the general rule has exactly the three known violations, all fixed by
Unit 1, and zero false positives — while also closing `attributes.execution` and
`attributes.office_hours`, the other two keys the deleted readers honored.

**Tests** — `packages/intentionsutil/test/schema.test.ts`, appended after the
Rule 22 block (which ends near `:2390`; the file is 2629 lines). Reuse the
existing fixture factories rather than hand-building nodes: `gnode(partial)`
(`:1253`) is the base `IntentionNode` builder and `tierNodes(partial)`
(`:2023-2037`) returns a valid goal-layer kind set plus one node carrying the
fields under test — the pattern `impactNodes` (`:2097`) and `waitNodes` already
wrap. Cover:

- rejects `attributes: {phase: "main-qa"}` (the historical squatter), asserting
  the message names `attributes.phase`;
- rejects `attributes: {execution: {...}}` and
  `attributes: {office_hours: {...}}`;
- rejects a shadowing key whose value is `null` (presence, not shape, is the
  violation);
- reports **every** violating key on one node, not just the first;
- accepts `attributes: {}`;
- accepts a node carrying legitimate non-shadowing keys — at minimum
  `{bug_fix: true, tier: 2, measured_impact: [...]}` — proving the rule does not
  blanket-reject a non-empty `attributes`.

**Out of scope for this unit.** `validateAttributes` (`schema.ts:348-353`) stays
deliberately permissive — it validates only that `attributes` is a plain object,
and the new check belongs in `validateGraph`'s rule list, not there.
`intentions/kind-kind.md`'s prose ledger (see `## Out of scope`).

**Dependencies.** Unit 1 — **hard**. `validate-graph.ts` runs in CI on every PR
(`.github/workflows/unit-tests.yml:162`) and on the graph fast path
(`.github/workflows/graph-fast-path.yml:32`). Landing Rule 23 while the three
squatters are still on `origin/main` reddens main for every subsequent commit,
graph writes included.

**Recommended model:** sonnet.

---

## Unit 4 — Correct the stale `PHASES` claim in `/align-tactics`' doctrine

**Scope.** `.claude/skills/align-tactics/SKILL.md:427-431`, the `phase: main-qa`
bullet under `## Out of scope`. It currently reads:

> `phase: main-qa` — it is in the spec enum (strategy clarification 22) but
> **not** in `schema.ts`'s `PHASES`, so `write-node.ts` would throw on it.

Replace the false half. `main-qa` **is** in `PHASES`
(`packages/intentionsutil/src/schema.ts:65-74`) and `validateNode` accepts it
(`schema.ts:1013`) — it has been since PR #2859 (2026-07-11), and `f42da977`
landed three nodes at `phase: main-qa` through `write-node.ts` on 2026-08-04.
Rewrite the bullet so the *rule* survives unchanged — this skill lands only
`phase: implement` and consumes drafts; needs-main residue rides the source
tactic into `main-qa` under the router, never something this skill stamps — but
the stated *reason* becomes the true one (a scope rule about what this skill
writes), not a claim about the enum.

**Out of scope.** Whether `/align-tactics` should be permitted to stamp
`main-qa`. Only the factual claim changes; the behavioral rule is untouched.
Do not restate the phase ladder here — `forwardPhase` / `reconcileMergedPhase`
(`packages/intentionsutil/src/transitions.ts`) are its single home (strategy
clarification 111), and hand-authored ladder prose has drifted from that home
four separate times.

**Note.** This is a `.claude/skills/**` edit — a sandbox `denyWithinAllow`
carve-out needing the corresponding permission grant, and any tree-updating git
op over it needs `dangerouslyDisableSandbox: true` (`.claude/rules/sandbox.md`).

**Dependencies.** None.

**Recommended model:** sonnet.

---

## Reuse

- `packages/intentionsutil/scripts/dump-node.ts` — `dumpNodes` (`:151`) pulls the
  three nodes to `<id>.json` plus a `base-manifest.txt` of `<id>=<blobsha>` CAS
  tokens, printing the manifest path for `graph-commit --base`. `--dir` and
  `--out-dir` are required.
- `packages/intentionsutil/scripts/write-node.ts` — `writeNodeFromJson`
  (`:33-45`), the single validation gate: `JSON.parse` → `validateNode` →
  `writeNode` → `readNode`. `--dir` is required and has no default.
- `packages/intentionsutil/src/store.ts` — `writeNode` (`:52-59`) preserves the
  on-disk body via `readExistingBody`; `assertNoBodyLoss` (`:104-124`) throws if
  a rewrite would drop an existing hand-authored body. Body preservation is a
  checked invariant, not an intention — no extra code needed.
- `packages/intentionsutil/scripts/graph-commit` — `-C <repo>` (repo resolved
  from the flag, else **cwd**, never the script's location — `:36-40`) and
  `--base <manifest-file>` compare-and-swap (`:48-52`). One commit for all three
  nodes.
- `packages/intentionsutil/src/schema.ts` — `checkTierMarkShape` (`:1298-1313`)
  is the structural template for Rule 23 (read `node.attributes[key]`, push a
  templated problem); `checkMeasuredImpactShape` (`:1338`) shows the
  inert-when-absent idiom Rule 23 deliberately inverts; `AUTHORABLE_TIERS`
  (`:41`) is where an exported rule vocabulary lives; the dispatch loop
  (`:1660-1693`) is where the new call goes; the doc ledger (`:1595-1651`) is
  where the numbered paragraph goes, with `:1608-1611` showing the
  burned-number convention.
- `packages/intentionsutil/test/schema.test.ts` — `gnode` (`:1253`),
  `tierNodes` (`:2023`), and the `impactNodes` / `waitNodes` wrappers (`:2097`,
  `:2177`) are the fixture factories to reuse rather than hand-building nodes.
- `.claude/skills/dispatch-propagate/scripts/test-assert-node-selection.sh` —
  `write_node_fixture` (`:35`); its 5th positional parameter is the `attributes`
  YAML block (default `attributes: {}`), the only shell-layer way to build an
  `attributes` fixture.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:190` —
  auto-discovers `test-*.sh` under `dispatch-propagate/scripts`, so the shell
  test needs no new wiring.
- Worked commit precedents for Unit 1's shape: `git show 234e52e7` (2026-07-07,
  14 nodes) and `git show f42da977` (2026-08-04, 3 nodes) — both state-only,
  direct-to-main, no PR/qa/review.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

**Unit 1 — the decisive before/after selector check (manual).** This is the
check that proves the data-loss path is closed, and it must be run before the
backfill lands, not after. Extract `origin/main`'s `intentions/` to a snapshot
directory, apply the backfill to a copy, and run
`npx tsx packages/intentionsutil/scripts/select-targets.ts --dir <snapshot>`
against both. Each of the three nodes must move from
`phase: align-tactics, pr: null` (the draft candidate the router emits today via
`router.ts:456-471`) to `phase: main-qa` carrying its real `execution.pr` —
2783, 2832, 2802 respectively. **Sandbox note:** `npx tsx` fails under this
worktree's sandbox with `EPERM: listen … tsx-1000/N.pipe` (tsx opens a unix
socket for its IPC), independently of `TMPDIR`. Retry the selector runs with
`dangerouslyDisableSandbox: true`, per `.claude/rules/sandbox.md`'s
retry-on-loud-failure rule.

**Unit 1 — body preservation (manual).** After the write and before the commit,
`diff` each node's post-`---` region against its pre-migration blob
(`git show HEAD:intentions/<id>.md`); all three must be byte-identical. Then
confirm `validate-graph` reports the same node count and no new unresolved prose
refs. `assertNoBodyLoss` already guards this, but the diff is the observable
proof the migration was frontmatter-only.

**Unit 1 — CAS refusal (judgment).** If `graph-commit --base` exits 3, a
concurrent writer touched one of the three nodes between the dump and the
commit. Re-run `dump-node.ts` into a **fresh** `--out-dir` and redo the edit
from the new JSON — never re-use a stale manifest, and never drop `--base` to
force the land.

**Unit 2 — dead-branch proof (manual).** After deleting the readers, grep the
repo for `attributes.phase`, `attributes.office_hours`, `attributes.execution`:
the only surviving hits should be the new Rule 23 in `schema.ts`, its tests, the
inverted regression tests named in Unit 2, and the legitimate decoys listed
under `## Out of scope`. A hit in any other production file means a reader was
missed.

**Unit 2 — prose anchors (manual).** `check-node-selection.ts` shrinks by
roughly 120 lines, so every hard-coded line citation into it moves. Re-read the
post-edit file and re-verify the `:90-94` / `:268-270` anchors quoted in
`.claude/skills/qa-fix/SKILL.md:116-117` and
`.claude/skills/qa-fix/references/target-resolution.md:49-50` before committing;
a stale anchor here is exactly the class of drift this tactic exists to remove.

**Unit 3 — negative control (manual).** Temporarily re-add
`attributes: {phase: main-qa}` to one node on disk and confirm
`validate-graph.ts intentions` fails naming that node and key; revert. This
proves the gate is wired into the real store path, not only into the unit
fixtures — the `validateGraph` unit tests alone cannot distinguish a rule that
is defined from one that is also called.

**Unit 4 — judgment.** Read the rewritten bullet back and confirm it still
forbids `/align-tactics` from stamping `main-qa`. The correction must change the
stated reason without loosening the rule.

## What shipped — 2026-08-30, all three units

Landed in #3138 (merge commit `96d22cb1`), Position 2 of the dispatch/RSI
serialized window, as PR16 Unit 4. The data half landed separately and first, as
`5062f90e`.

**Unit 1 — the data backfill. Three nodes, not six.** The serialized plan said
"the 6 remaining"; the true set was **3**, verified two independent ways (the
repo's own `listNodes`/`readNode`, and a raw frontmatter scan over all 751
nodes): `tactic-attention-surface-analytics-collector`,
`tactic-budget-txn-identity`, `tactic-indieweb-audience`. Each moved from
`phase: null` + `attributes.phase: main-qa` to first-class `phase: main-qa` with
`attributes: {}`. The migration refused to guess — it dies if the squatter is
absent, if the top-level phase is already set, or if the promotion loses the
value or leaves the key behind.

This had to land **before** the schema tightening, or `graph-validate` would go
red on the surviving keys.

**Unit 3 — Rule 23, as the general shadow-ban this node specifies.** The
serialized plan scoped only an `attributes.phase` rejection. That was narrower
than this node, so it was widened to match: a compiler-enforced
`FIRST_CLASS_FIELD_PROBE: Record<keyof IntentionNode, true>` derives
`FIRST_CLASS_FIELD_NAMES`, and `validateGraph` rejects **any** `attributes` key
colliding with a first-class field name — closing `attributes.execution` and
`attributes.office_hours` as well. Adding a field to `IntentionNode` without
updating the probe now fails `tsc`; that was proven three ways (missing field,
new field, non-field name), not asserted.

Presence is the violation, not shape: it fires on `null` too. Every violating
key on a node is reported, not just the first.

**Independent census: 50 distinct `attributes` keys across 751 nodes, zero
collisions** with first-class field names. (This node's own census said 51
including `phase`; 50 is the consistent successor now that `phase` is migrated.)
So the wide rule has no false positives on the live store.

**Why `validateGraph` and not `validateAttributes`:** the latter receives only
`(value, field)`, so it could never name the offending node; and it runs on the
**read** path, where a rejection makes the file unreadable to every tool that
merely enumerates the store. `validateGraph` aggregates all problems into one
error.

**Unit 2 — all six squatter-aware readers deleted** from
`check-node-selection.ts`: `readPhase`, `readParked`, `readStrategyFingerprint`,
`readMarkers`, `readFixState` and `readConflictState`. Every one was dead code —
`attributes.execution` and `attributes.office_hours` are on zero nodes. Tests
that drove them were **retargeted to their inverse** (a stray
`attributes.office_hours` no longer parks; a squatted stamp is not read), never
deleted, and one test that used the squatter as an incidental vehicle for an
unrelated "phase advanced" assertion was re-vehicled with that assertion
byte-identical.

### Rule-number collision — read this before landing a new rule

`tactic-supersession-edge-and-terminal` also claims Rules **23 and 24**, for the
supersession edge and its cycle check. Neither was landed when this shipped, so
there is no conflict on disk today — but rule numbers are cross-referenced from
node bodies and are never reused, so **whichever lands second must renumber**.
Recorded in the schema's ledger paragraph and above the function itself.

**Verification:** `intentionsutil` vitest 1252/1252 across 57 files; `tsc
--noEmit` exit 0; `validate-graph.ts intentions` ok at 751 nodes with Rule 23
live; a CLI-level negative control on a copied store confirmed the rule fires on
the real `validate-graph` path, not merely in unit tests.
