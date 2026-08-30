---
id: tactic-census-scripted-tick
kind: tactic
statement: "Implement census as a scripted dispatch-tick step:
  verify-merged-only prune with scripted edge repair and one batched
  graph-commit; surface verification failures as an integrity-defect count;
  retire dispatch-graph-census latch birth"
owner: ai
status: codified
parent: null
rationale: "Carrier for the census greenfield recorded 2026-07-23 on
  strategy-graph-native-dispatch (clarification: scripted tick step, no AI
  session). The 2026-07-11 census latch sat 12 days undrained because birthing
  the latch was all the tooling did. Finalized 2026-07-23 /align-tactics
  per-node round: blocked_by tactic-office-hours-pr-custody and
  tactic-execution-pr-merge-verification, both still raw, since the
  mechanical-verification predicate reads a completion field neither has landed
  on Execution yet."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 0.01
  override: null
  rationale: >-
    Author-directed 2026-07-23 /align-strategy round: the top-3 systemic gaps
    (PR custody, scripted census, playwright retry) rank ahead of the
    low-urgency tracked gaps once finalized.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 3 to 0.01 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
  tier: 1
phase: qa
execution:
  branch: tactic-census-scripted-tick
  pr: 3037
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
validates: []
blocked_by:
  - tactic-office-hours-pr-custody
  - tactic-execution-pr-merge-verification
office_hours:
  reason: "/qa-fix: 4 confirmed opus-fixable bugs (CRITICAL: minted census-defect
    bodies fail the CI lint graph-commit's land depends on, blocking every
    census batch from landing once any node is done-but-unverifiable, which is
    already true for 19 live nodes; HIGH: retention refusal not transitive,
    reintroduces a dangling-edge class already fixed once; MEDIUM: defectIdFor
    id collision, 2 live pairs; LOW/MEDIUM: stale PR body test counts, 4th
    recurrence) but the qa-fix auto-fix attempt cap (3) was already reached
    coming into this pass, so none could be auto-fixed; escalating to
    office-hours for human fix or attempt-counter reset"
  since: 2026-08-04
  recommendation: >-
    # Recommendation: `tactic-census-scripted-tick` (#3037)


    ## Finding #1 is the only thing that matters first


    Minted `tactic-census-defect-*` bodies fail `lintTacticBodies`
    (`packages/intentionsutil/src/planlint.ts`) — no `## Context`, no
    `Recommended model`, no `## Verification`. That lint is exactly what
    `graph-fast-path.yml`'s `guard` job runs via `validate-graph.ts`, and
    `graph-commit`'s `try_land()` treats a CONCLUDED failed check as a
    non-retryable `die()`.


    Because `dispatch-census-tick` batches every prune, edge-repair, and mint
    into ONE `graph-commit`, the first production tick that encounters a
    done-but-unverifiable node poisons the whole batch — including the 43
    legitimate prunes — inside a silent `|| true` retry loop. The live store has
    19 such nodes today. This is first-tick behavior, not a corner case, and it
    defeats the PR's entire purpose. Reproduced this session: 19 minted defects
    → `IntentionSchemaError`, 3 violations each, exit 1.


    Two fix shapes, pick one:

    - **(a) Give minted bodies the three markers** — `## Context` (what to
    investigate), `Recommended model: sonnet`, `## Verification` (how to confirm
    the target's completion evidence). Local to `census-tick.ts`; preferred.

    - **(b) Exempt `tactic-census-defect-*` in `lintTacticBodies`** — mirrors
    `isMainqaModelExempt`, but that carve-out only waives the model line, so
    this needs its own. Touches shared cross-cutting validation. Higher blast
    radius.


    ## Ordering


    1. **#1** — nothing lands without it.

    2. **#2** (retention not transitive) — same landing-blocking class, rarer
    trigger. The refusal pass computes `retained` in one linear scan against the
    *original* `candidateSet`. Iterate to a fixpoint, or do a real reachability
    closure. Note this re-opens the exact dangling-inbound-edge class attempt 2
    was supposed to eliminate, via a 2-level chain.

    3. **#3** (`defectIdFor` collides `tactic-X`/`strategy-X`) — latent; two
    colliding pairs already exist in the store, neither done yet. Keep the kind
    in the derived id, or dedup off `attributes.census_defect.target`.

    4. **#4** — PR body numbers: 44 files / 854 tests, 18 tests in
    `census-decide.test.ts`, 16 in `census-tick.test.ts`.


    ## Tests


    The 854 vitest tests and both bash harnesses should stay green. But add NEW
    coverage — neither gap is currently tested despite ~500-line files:

    - **#1**: run `lintTacticBodies` against a minted defect body.

    - **#2**: the 2-level scratch scenario (A referenced only by B's `parent`; B
    referenced by surviving C; assert B's retention forces A's retention).


    ## Before another autonomous pass


    The attempt cap is exhausted at 3/3. Drop the `dispatch:qa-fix-attempt-3`
    label (or whatever this repo's counter reset is) once you've either applied
    these fixes or judged this parked context stale — otherwise the qa-fix lane
    won't re-enter.
  session_type: other
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 3
---
# Implement census as a scripted dispatch-tick step: verify-merged-only prune with scripted edge repair and one batched graph-commit; surface verification failures as an integrity-defect count; retire dispatch-graph-census latch birth

## Context

Recorded design 2026-07-23 on `strategy-graph-native-dispatch` (migration step 2 of 4): "Greenfield: census is a scripted dispatch-tick step — not a node, not an AI session. Every tick: enumerate done-but-present nodes; prune only those whose completion verifies mechanically (recorded `execution.pr` with the merge-verification field set, or a recorded graph-commit sha); edge repair (strip pruned ids from live `blocked_by`) is scripted; one batched graph-commit. Nodes failing verification are left in place and surfaced as an integrity-defect count — they become ordinary selectable defect tactics, never parks, never mid-tick AI. The census latch node disappears and `dispatch-graph-census`'s threshold-birth mechanism retires once the tick step is live."

Motivating incident: the 2026-07-11 census node (`tactic-graph-census-2026-07-11`) sat parked **12 days** while reconciliation debt grew **52→62**, because birthing the latch was all the tooling did — the drain itself required a human/AI session that never came. A cheap, unconditional, always-on scripted drain never accumulates debt, so no latch is needed.

This tactic is `blocked_by` two still-`raw` tactics that land the completion-verification schema field: **tactic-office-hours-pr-custody** (tightens park-time `execution.pr` recording) and **tactic-execution-pr-merge-verification** (adds a completion record at the done-transition, since `execution.pr` under-determines completion — a closed-unmerged PR can sit on a legitimately-complete node). By the time this tactic is worked, those will have landed the field. Its **exact name/shape is not yet decided** — every unit that reads it MUST re-verify against `schema.ts` at implementation time (see Unit 1's Scope). No `prune-batch.mts` prototype exists anywhere in git history or the working tree despite a prior interactive session's retained-draft reference to one — treat that as unlanded design intent, not a file to locate; build the equivalent from scratch as described below.

## Design decisions (resolved here, not left to the implementer)

1. **No config.** The design wants an *unconditional, always-on* step once live — not a threshold-gated birth. The new step reads no `dispatch.config/census.json`, has no on/off toggle. `dispatch-config-load`'s `census` case and `census.example.json` become dead once `dispatch-graph-census` is deleted (Unit 3); leave the `census` case in `dispatch-config-load` in place (harmless, generic absent→inert) unless trivially removable — removing it is optional cleanup, not required.

2. **Enumeration reuse.** The new decision module computes done-but-present with the **identical one-line filter** `nodes.filter(n => n.phase === "done")` — the same logic as `computeDebt`'s `donePresent` (`packages/intentionsutil/scripts/graph-census-debt.ts:126`). Do **not** import `computeDebt`: it bundles `orphans` and `mergedUnabsorbed` (both out of scope here) and requires constructing a `mergedIds` Set (needs network state this step must not gather). The enumeration is one line and identical; reimplementing that one line in the new pure module is correct, not divergent.

3. **Round stamping is OUT OF SCOPE.** Round-stamping is `reconcile-graph.ts`'s completion-transition concern (it stamps because it owns the merged→done transition; `reconcile-graph.ts:146-167`). Census-pruned nodes are **already** `phase: done` — their round was closed at their own done-transition, not at census-prune time. Census therefore does edge repair only, never `stampRound`. State this in a code comment (deliberate divergence from reconcile-graph.ts Pass 3, to avoid double-counting rounds).

4. **Retire `dispatch-graph-census` in the SAME PR** as this tactic, folding the design's migration step 4 ("retire the latch birth") into this tactic's scope, per its own statement and retained-design phrase "once the tick step is live." Running both simultaneously would double-drain / conflict (both prune the same done-present nodes, racing on the same `graph-commit`). No separate tactic is named for step 4. Once the new step is proven by tests + a scratch-dir manual check, delete `dispatch-graph-census` and swap the call site — atomically, in this PR.

## Ordered units of work

### Unit 1 — pure verification-decision module + test

**Recommended model:** sonnet

**Scope.** New file `packages/intentionsutil/scripts/census-decide.ts`. Pure, in-memory, no filesystem, no network. Exports:

- `verifyCompletion(node: IntentionNode): boolean` — the mechanical predicate. **FIRST STEP before writing code:** open `packages/intentionsutil/src/schema.ts` and read the current `Execution` interface (today at `schema.ts:377-390` it is `{ branch; pr; attempts; markers; strategy_fingerprint; fix? }` — no merge-verification field exists yet). The two blocker tactics will have added one by the time this unit runs (this tactic is `blocked_by` them). Find its actual name/shape by grepping `Execution` in `schema.ts` and by reading those two tactics' landed diffs/node bodies. The predicate is: `node.execution !== null && node.execution.pr !== null && <that field indicates a verified merge>`. Do **not** invent a field name — if it is genuinely still absent when this unit runs, STOP and report that the blockers have not actually landed the field (this tactic's `blocked_by` should have prevented selection before that; treat it as a park-worthy inconsistency, not something to route around).
- `partitionDonePresent(nodes: IntentionNode[]): { prunable: string[]; defects: { id: string; reason: DefectReason }[] }` — filter to `phase === "done"` (design decision 2), then split each by `verifyCompletion`. `DefectReason` is a string union classifying *why* verification failed: `"no-execution"` (`execution === null`), `"no-pr"` (`execution` set, `execution.pr === null`), `"unverified-merge"` (`pr` set but the merge-verification field unset). `prunable` = verified ids; `defects` = the rest with their reason.

Out of scope: orphans, mergedUnabsorbed, any file I/O, any graph-commit.

**Test.** New `packages/intentionsutil/test/census-decide.test.ts`, mirroring the pure in-memory builder pattern of `packages/intentionsutil/test/graph-census-debt.test.ts` (`strategy()`, `doneTactic(id)`, `openTactic(id, extra)` wrapping `validateNode`; no filesystem). Cover: a done node with a verified merge → `prunable`; done + `execution===null` → defect `no-execution`; done + `pr===null` → `no-pr`; done + pr but unset merge field → `unverified-merge`; an open (non-done) node → in neither list.

**Dependencies:** none.

### Unit 2 — apply module (prune batch + edge repair + defect mint) + test

**Recommended model:** opus

**Scope.** New file `packages/intentionsutil/scripts/census-tick.ts`, the direct analog of `packages/intentionsutil/scripts/reconcile-graph.ts` (a decision-and-mutation TS module that performs its own file writes/deletes and prints a JSON plan to stdout, leaving only the final `graph-commit` to its bash wrapper). Exports `censusTick(args: { dir: string; date: string }): Plan` where `Plan = { prune: string[]; edit: string[]; defectsMinted: string[]; defectsExisting: string[]; defectCount: number }`.

Behavior:
1. `const nodes = listNodes(args.dir)`; call `partitionDonePresent(nodes)` from Unit 1. Let `prunableSet = new Set(prunable)`.
2. **Edge repair** for the prune batch — mirror `reconcile-graph.ts:136-144`: for each `id` in `prunable`, for each `inbound` in `inboundBlockers(id, nodes)` (`transitions.ts:271-273`), **skip if `prunableSet.has(inbound)`** (a co-pruned blocker is itself deleted — this batch-aware skip is why we cannot call `strategiesToStamp` or another naive per-id helper; see `reconcile-graph.ts:128-176`'s own comment on this exact hazard), else `readNode` → filter `id` out of `blocked_by` → `writeNode` → add to `editSet`.
3. **No round stamping** (design decision 3) — add a code comment citing the reasoning.
4. **Delete the pruned files last** (after all reads), mirror `reconcile-graph.ts:172-176`: `rmSync(join(args.dir, \`${id}.md\`))` for each prunable id; push to `plan.prune`. (`graph-commit --prune` requires the file already gone from disk — `graph-commit` usage lines 32-39, `snapshot()` at 346-354 skips prune ids since there is no on-disk content to snapshot.)
5. **Defect mint with dedup** — for each `{ id: targetId, reason }` in `defects`:
   - Deterministic stable id: `defectId = "tactic-census-defect-" + targetId.replace(/^(tactic|strategy)-/, "")`. Deterministic → the same failing node yields the same defect id every tick (idempotency key).
   - **Dedup check:** if `existsSync(join(args.dir, \`${defectId}.md\`))` → the defect is already surfaced; push `defectId` to `plan.defectsExisting`, do NOT re-mint. This on-disk existence check IS the latch (replaces the born-parked latch this tactic retires).
   - Else mint an **ordinary selectable** (never parked) defect tactic. Frontmatter (build the object, validate via `writeNode`):
     - `id: defectId`, `kind: "tactic"`, `owner: "ai"`, `status: "codified"`, `parent: null`, `serves: ["strategy-graph-native-dispatch"]`, `execution: null`, `office_hours: null` (NOT a park), `blocked_by: []`.
     - `phase: "implement"` — REQUIRED for selectability. The router only selects tactics with an open phase (`isOpenTactic`, `router.ts:122-124`; `OPEN_PHASES` = implement/fix/qa/review/main-qa per `graph-census-debt.ts:50`). `phase: null`/draft is NOT selectable and would need a further `/align-tactics` pass — the design forbids mid-tick AI, so a defect must be born selectable. Use `"implement"`.
     - `statement`: `"census integrity defect: ${targetId} is phase:done with execution.pr:${pr} but completion is not mechanically verifiable (${reason})"`.
     - `attributes: { census_defect: { target: targetId, reason, detected: args.date } }` — structured so reporting/future dedup keys on `attributes`, never body parsing.
   - Write the node file, then splice the real body over the placeholder `writeNode` generates for a brand-new id: keep everything through the closing `---` fence, overwrite the body after it (mirror the fence-preserving body-replace used by `dispatch-graph-census:110-118` and `reconcile-graph.test.ts`'s `node()` helper). Body content: state which node failed and why, plus the fix pointer: *"Investigate why `${targetId}`'s completion is not mechanically verifiable and record the missing completion evidence (re-derive from git history / `gh`, or if the node is legitimately complete, backfill the merge-verification field on its `execution`). If `${targetId}` already verifies and was pruned, close this node (phase → done)."* This body IS the whole plan — the fix is investigate-and-record.
   - Push `defectId` to `plan.defectsMinted`.
6. `plan.edit = [...editSet].filter(id => !prunableSet.has(id)).sort()` (mirror `reconcile-graph.ts:180`'s defensive guard); `plan.prune.sort()`; `plan.defectCount = defects.length`. Return.

**Dedup self-correction note (state in a comment):** a minted defect that is later "resolved" (its own PR merges → it becomes done-but-present with a verified merge) is pruned by census on a later tick, removing `intentions/${defectId}.md`; if the underlying target still fails verification then, a fresh defect re-mints next tick — a legitimately-fixed target verifies and is pruned instead, so no re-mint. A defect left open while its target gets independently fixed becomes a stale selectable tactic the router will eventually select and a session closes as already-resolved — acceptable known residue, out of scope to auto-close here.

Out of scope: `graph-commit` (the wrapper's job), orphans, mergedUnabsorbed, network.

**Test.** New `packages/intentionsutil/test/census-tick.test.ts`, mirroring `reconcile-graph.test.ts`'s real-tempdir pattern (`mkdtempSync` + `writeNode`/`readNode` + its `node()` builder + body helper). Cover: (a) a verified done-present tactic with an inbound `blocked_by` survivor → file deleted, survivor's `blocked_by` repaired, `plan.prune` = [that id]; (b) an unverified done-present tactic → file **left in place**, exactly one defect minted with the deterministic id + `phase: "implement"` + correct `reason`, `defectCount === 1`; (c) run `censusTick` twice against the same unverified node → second run mints **zero** (`defectsExisting: ["tactic-census-defect-..."]`, `defectsMinted: []`); (d) two co-pruned nodes where one blocks the other → the co-pruned blocker is skipped in edge repair (no attempt to edit a deleted file), both pruned.

**Dependencies:** Unit 1.

### Unit 3 — bash wrapper + tick wiring + retire the latch

**Recommended model:** sonnet

**Scope.**
- New file `.claude/skills/dispatch-propagate/scripts/dispatch-census-tick`, mirroring the wrapper shape of `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged` **minus all network/gh** (this step is graph-only). Steps: resolve `REPO_ROOT`/`UTIL_SCRIPTS`; run `OUT=$( (cd "$REPO_ROOT" && node --import tsx/esm "$UTIL_SCRIPTS/census-tick.ts") )` capturing the JSON plan (add a thin `main()` to `census-tick.ts` that prints `JSON.stringify(censusTick({ dir: "intentions", date: <now> }))`, mirroring `reconcile-graph.ts:185-186` — accept `--intentions`/`--now` CLI flags like `graph-census-debt.ts`'s CLI for testability). Then build **exactly one** `graph-commit`: `GC_ARGS=(-m "graph: census — pruned N, defects M")`; append `--prune "$id"` per `jq -r '.prune[]?'`; append bare ids from `.edit[]?` and `.defectsMinted[]?` (mirror `reconcile-graph-merged`'s `GC_ARGS` construction). Skip the `graph-commit` call entirely on an empty plan (no prune, no edit, no mint) — a no-op tick commits nothing. Stdout protocol (the wrapper's own lines; the tick caller prefixes `census: `): `pruned <n>, integrity-defects <m> (minted <j>, existing <k>)`. Exit 0 on no-op or success; exit 1 on any hard error or `graph-commit` failure. Best-effort by the caller's `|| true`.
- **Replace** the call-site block at `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:484-497`: swap `CENSUS_OUT=$("$SCRIPT_DIR/dispatch-graph-census") || true` for `CENSUS_OUT=$("$SCRIPT_DIR/dispatch-census-tick") || true`, keep the `census: ` line-prefix loop and the `|| true` best-effort wrap verbatim, and rewrite the preceding comment to describe the unconditional scripted drain (no threshold, no birth, no latch).
- **Delete** `.claude/skills/dispatch-propagate/scripts/dispatch-graph-census` (design decision 4). Grep the repo for any other references to it (`grep -rn dispatch-graph-census`) and remove/repoint them. Leave `graph-census-debt.ts` in place (still used elsewhere for orphans/mergedUnabsorbed debt reporting) — only the latch-birth wrapper is retired.

Out of scope: any change to `reconcile-graph-merged` or `graph-census-debt.ts`'s own logic; `dispatch.config` schema (design decision 1).

**Dependencies:** Units 1, 2.

## Reuse

- `computeDebt`'s `donePresent` one-line filter — `packages/intentionsutil/scripts/graph-census-debt.ts:126` (`if (n.phase === "done") donePresent.push(n.id)`). Replicated as one line in `census-decide.ts` (design decision 2); do NOT import `computeDebt`.
- `inboundBlockers(prunedId, nodes)` — `packages/intentionsutil/src/transitions.ts:271-273`. Exact reuse for edge repair (import it).
- Batch-aware prune/edge-repair pattern (skip co-pruned inbound, delete files last, defensive edit-vs-prune guard) — mirror `packages/intentionsutil/scripts/reconcile-graph.ts:128-183`. Do NOT call `strategiesToStamp` (`transitions.ts:286-302`) — not batch-safe for a multi-id prune (its "still serving" check does not exclude ids co-pruned in the same batch).
- Decision-module + bash-wrapper split, and `GC_ARGS` construction with one `graph-commit ... --prune <id> ... <edit-id>` — `packages/intentionsutil/scripts/reconcile-graph.ts` + `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged`.
- `graph-commit --prune <id>` contract (file must be deleted first) — `packages/intentionsutil/scripts/graph-commit` usage lines 32-39, `snapshot()` 346-354, `is_prune_id()` 586-592.
- Defect-node mint sequence template (write-node → body-splice past the `---` fence → graph-commit) — `.claude/skills/dispatch-propagate/scripts/dispatch-graph-census:89-125`; but mint frontmatter+body **in `census-tick.ts`** via `writeNode` + the fence-preserving body-overwrite, not in bash.
- Selectability predicate for the defect `phase` — `packages/intentionsutil/src/router.ts:122-124` (`isOpenTactic`) + `OPEN_PHASES` (`graph-census-debt.ts:50`). Forces `phase: "implement"`.
- Pure-builder test pattern — `packages/intentionsutil/test/graph-census-debt.test.ts` (Unit 1). Tempdir store test pattern — `packages/intentionsutil/test/reconcile-graph.test.ts` (Unit 2).

## Verification

```verify
npx vitest run --project packages/intentionsutil packages/intentionsutil/test/census-decide.test.ts || exit 1
npx vitest run --project packages/intentionsutil packages/intentionsutil/test/census-tick.test.ts || exit 1
npx vitest run --project packages/intentionsutil
```

```verify
if grep -rn "dispatch-graph-census" .claude/skills/dispatch-propagate/scripts/dispatch-select-tick; then echo "FAIL: the forbidden pattern is still present in .claude/skills/dispatch-propagate/scripts/dispatch-select-tick"; exit 1; fi
test ! -e .claude/skills/dispatch-propagate/scripts/dispatch-graph-census || exit 1
grep -q "dispatch-census-tick" .claude/skills/dispatch-propagate/scripts/dispatch-select-tick
```

**Manual / observational (run against a scratch intentions dir, never the live `intentions/`):**
1. Copy a handful of nodes into a scratch dir including (a) one done-present node whose `execution` HAS the merge-verification field set, (b) one done-present node WITHOUT it, and (c) a survivor node listing (a) in its `blocked_by`. Run `node --import tsx/esm packages/intentionsutil/scripts/census-tick.ts --intentions <scratch>`. Confirm the JSON plan prunes exactly (a), repairs the survivor's `blocked_by`, leaves (b) on disk, and mints **exactly one** defect (`tactic-census-defect-<b-stripped>`, `phase: implement`, `census_defect.reason` correct) — not zero, not two.
2. Re-run the same command against the same scratch dir. Confirm zero new mints (`defectsMinted: []`, `defectsExisting: ["tactic-census-defect-<b-stripped>"]`) — the on-disk dedup latch holds across ticks.
3. Dry-run `dispatch-census-tick` in the scratch checkout and confirm its stdout line matches `pruned <n>, integrity-defects <m> (minted <j>, existing <k>)` and that it issues exactly one `graph-commit` invocation (inspect via `set -x` or a stubbed `graph-commit`), skipping the commit entirely when the plan is empty.
