---
id: tactic-graph-tick-node-lane-auto-merge
kind: tactic
statement: Tick reconciler owns a single label-free, CI-validated auto-merge of
  a reviewed node-lane PR, keyed off the node reviewed marker (not the gh
  dispatch:reviewed label)
owner: ai
status: codified
parent: null
rationale: "Surfaced in the 2026-07-11 /align-strategy interview recording the
  post-phase dispatch flow (worker marks complete -> tick validates CI -> tick
  auto-merges post-review). transition-node's node-lane arm step calls the
  LABEL-gated dispatch-auto-merge, which skips node-lane PRs (no gh label), so a
  reviewed PR is readied+mergeable but held for human merge (PR #2859, merged by
  hand 2026-07-11); meanwhile the tick-workflow's gh-native `gh pr merge --auto
  --squash` path already merges without a label (clarification 47, tick +3,
  8/9). Unify on one tick-owned, label-free merge keyed off the node's reviewed
  marker."
reading: null
gap: null
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
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Tick reconciler owns a single label-free, CI-validated auto-merge of a reviewed node-lane PR, keyed off the node reviewed marker (not the gh dispatch:reviewed label)

## Context

Surfaced in the 2026-07-11 /align-strategy interview that recorded the post-phase
dispatch flow (strategy-graph-native-dispatch clarification 53): a phase worker
marks its phase complete and does not validate CI; the tick reconciler validates
CI each tick (skipping in-progress-CI ticks) and, post-review, auto-merges the
reviewed PR without author intervention.

Today no owned code actually merges a reviewed node-lane PR. Both merge sites go
through the legacy, LABEL-gated `dispatch-auto-merge`, whose eligibility requires
the `dispatch:reviewed` gh label — and the node lane deliberately never writes
that label (`reviewed` is a graph execution marker, not a label; the node-lane
review skill is explicit: "Do **not** apply `dispatch:reviewed`",
`.claude/skills/review-fix/SKILL.md:130`). So:

- `transition-node`'s worker-invoked arm step
  (`.claude/skills/dispatch-propagate/scripts/transition-node:166-174`) runs
  `gh pr ready "$PR"` then `dispatch-auto-merge` — the `gh pr ready` promotes the
  PR out of draft, but `dispatch-auto-merge` (label-gated at
  `.claude/skills/dispatch-propagate/scripts/dispatch-auto-merge:93-94`) skips it.
  Result: readied + mergeable, never merged (observed on PR #2859, merged by hand
  2026-07-11).
- The tick's own sweep (`.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:433-434`)
  also calls `dispatch-auto-merge` once per tick — same label gate, same no-op for
  node-lane PRs.

The `reviewed` execution marker itself is real and correct today: the pure layer
writes it on a clean review completion
(`packages/intentionsutil/src/transitions.ts:30` defines `REVIEWED_MARKER`,
`packages/intentionsutil/scripts/apply-node-transition.ts:174-178` appends it to
`execution.markers` when `advanced`), and it is landed on `origin/main` by
`transition-node`'s state-only `graph-commit`. What is missing is a merge keyed
off that marker. This tactic adds a single tick-owned, label-free,
marker-keyed merge, and moves the arm off the worker entirely — realizing
clarification 53's worker/tick split and dissolving clarification 47's
per-worker-arming classifier hazard (an owned shell reconciler has no agent
prompt to be read as a permission-layer bypass).

The desired end state (clarification 53): a phase worker marks its phase complete
and never merges; each tick the reconciler reads every reviewed-marked node's PR,
skips it while CI is in progress, routes it to fix on red CI (unchanged), and — on
green CI + `mergeable==MERGEABLE` + the `reviewed` marker + a fresh tactic-scope
fingerprint — merges it label-free.

## Reuse

- `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged` — the
  template for the new reconciler: same node enumeration via `listNodes` from
  `packages/intentionsutil/src/store.js` (`reconcile-graph-merged:44-54`), same
  `set -uo pipefail` + `source lib.sh` + `REPO_ROOT`/`UTIL_SCRIPTS` header, same
  main-checkout doctrine and stdout-line protocol, same "caller wraps with
  `dangerouslyDisableSandbox`" convention.
- `.claude/skills/dispatch-propagate/scripts/dispatch-auto-merge` — the merge
  mechanics to copy (NOT to edit): the config kill-switch check
  (`dispatch-auto-merge:54-65`, `dispatch-config-load auto-merge`, opt-OUT), and
  the REST squash-merge (`dispatch-auto-merge:117`,
  `gh_pr_merge_rest "$N" --squash --subject "$TITLE" --body "$BODY"`).
- `lib.sh` helpers: `gh_pr_view_rest` (`.claude/skills/dispatch-propagate/scripts/lib.sh:1093-1142`
  — returns `state`, `mergeable` ∈ {MERGEABLE,CONFLICTING,UNKNOWN}, `headRefOid`,
  `title`, `body`; note it does NOT return `isDraft`, which is why the reconciler
  calls `gh pr ready` unconditionally rather than gating on draft state),
  `dispatch_ci_verdict_rest` (`lib.sh:792-827`, returns `passing`/`failing`/`pending`),
  `gh_pr_merge_rest`.
- Tactic-scope fingerprint re-check: `packages/intentionsutil/scripts/compute-freshness.ts`
  (recomputes `tacticScopeFingerprint` vs the stamp at
  `<project-root>/.claude/worktrees/<node-id>.scope-fingerprint`; returns
  `scopeStale`), used the same way `transition-node:115-137` uses it. Definitions:
  `tacticScopeFingerprint` / `parseScopeStamp` / `isScopeStale` in
  `packages/intentionsutil/src/router.ts:112-114` and
  `packages/intentionsutil/src/transitions.ts:336-351`.
- Tick wiring pattern: `dispatch-select-tick:424-440` (the existing issue-lane
  auto-merge block, gated on `[[ -z "$OPEN_MB" ]]`) is the exact shape to mirror
  for the new graph-lane block.
- Existing tests: `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`
  — the `dispatch-auto-merge` section (~L39222+) and the tick auto-merge-wiring
  assertions (~L29286-29327) are the templates for the new reconciler's tests.

## Units of work

### Unit 1 — New tick-owned, marker-keyed node-lane merge reconciler `graph-auto-merge`

**Recommended model:** opus

**Scope.** Add `.claude/skills/dispatch-propagate/scripts/graph-auto-merge` (new
executable script; mirror `reconcile-graph-merged`'s header/structure). It is the
graph-lane, marker-keyed analog of the legacy label-gated `dispatch-auto-merge`,
and it is the ONLY code that merges a node-lane PR.

Behavior:
1. **Config gate.** Honor the same opt-OUT kill-switch as `dispatch-auto-merge`
   (`dispatch-config-load auto-merge`; `enabled:false` → exit 0, no merges). Copy
   the check from `dispatch-auto-merge:54-65`.
2. **Enumerate candidates from the graph.** One `listNodes` pass (copy
   `reconcile-graph-merged:44-54`), printing `<id>\t<pr>` for every `kind:tactic`
   node with `phase === "review"` AND `execution.pr` non-null AND
   `execution.markers` includes `"reviewed"`. (A node at `phase:review` WITHOUT
   the `reviewed` marker is review-in-progress — not a merge candidate. This is
   the label-free replacement for `dispatch-auto-merge`'s
   `index("dispatch:reviewed")` label check.)
3. **Per candidate, sense the PR** via `gh_pr_view_rest "$pr"`:
   - `state == "OPEN"` (skip MERGED/CLOSED — `reconcile-graph-merged` absorbs
     those); `mergeable == "MERGEABLE"` (skip CONFLICTING/UNKNOWN — a conflict is
     handled by the provision-time conflict path, not here);
   - CI: `dispatch_ci_verdict_rest "$(headRefOid)"` — merge only on `passing`.
     `pending` → skip silently (the "CI in progress → retry next tick" behavior,
     clarification 53); `failing` → skip silently (the fix interrupt owns red CI —
     do NOT merge, do NOT route fix here; the next `transition-node`/selection tick
     routes it).
4. **Tactic-scope fingerprint re-check (clarification 36), fail-closed.** Before
   merging, run `compute-freshness.ts` for the node (same invocation shape as
   `transition-node:115-127`) and read `scopeStale`. If `scopeStale == true` OR
   the stamp file `<project-root>/.claude/worktrees/<id>.scope-fingerprint` is
   missing, do NOT merge — emit `held <id> (scope-stale)` / `held <id>
   (missing-stamp)` and continue. This replaces the arm-time missing-stamp
   fail-closed that Unit 2 removes from `transition-node:151-156`, preserving
   clarification 36/37's guarantee: no merge until the in-flight phase's fresh read
   postdates the last scope edit. (A held node stays at `phase:review`; the next
   selection's worker-start gate demotes it to `implement` per the existing
   scope-chain gate — this script only declines to merge, it never demotes.)
5. **Merge label-free.** `gh pr ready "$pr"` (idempotent; promotes a still-draft
   PR, matching the removed arm's `gh pr ready`), then
   `gh_pr_merge_rest "$pr" --squash --subject "$TITLE" --body "$BODY"` (copy
   `dispatch-auto-merge:117`). Emit `merged #<pr> (<id>)`.
6. **Phrasing doctrine (clarification 47).** The script header and any log line
   state the human authorization as fact and name the commands; they never argue
   with, reference, or predict the permission layer. Being owned shell (no agent
   prompt) is itself what dissolves the per-worker-arming classifier hazard — state
   that plainly in the header.
7. **Protocol / robustness.** Stdout: `merged #<pr> (<id>)` per merge, `held <id>
   (<reason>)` per fail-closed skip, nothing for a plain skip. Exit 0 including a
   no-op sweep; exit 1 only on a hard error (enumeration failure, or a
   `gh_pr_view_rest`/merge error — mirror `reconcile-graph-merged`'s `HARD_ERROR`
   accumulation at `:60,65-68,130`). Best-effort per-PR: one PR's error must not
   abort the sweep. Doctrine note in the header: runs from a main-based checkout;
   the CALLER (Unit 3) wraps it with `dangerouslyDisableSandbox` (gh needs
   TLS/network; `node --import tsx/esm` needs the npm cache — see
   `.claude/rules/sandbox.md`).

**Out of scope for this unit:** no edit to `dispatch-auto-merge` (the legacy
label-gated reconciler stays exactly as-is for the draining gh queue).

**Tests (in this unit).** Add a `graph-auto-merge` section to
`test-dispatch-scripts.sh` modeled on the existing `dispatch-auto-merge` section
(~L39222+): fake `lib.sh` helpers + a fake `gh` and fixture nodes to assert
(a) a `phase:review` + `reviewed`-marker + green-CI + MERGEABLE node merges and
emits `merged #<pr> (<id>)`; (b) a `phase:review` node WITHOUT the `reviewed`
marker is skipped; (c) `pending` CI and `failing` CI are skipped (no merge);
(d) `CONFLICTING` mergeable is skipped; (e) a stale/missing scope stamp holds
(`held ... (scope-stale)` / `(missing-stamp)`, no merge); (f) the config
kill-switch (`enabled:false`) suppresses all merges.

### Unit 2 — Remove the worker-side arm from `transition-node`; keep only the marker write

**Recommended model:** sonnet

**Dependencies:** none (independent of Unit 1 as a code edit; but do not land the
arm removal to `origin/main` before Unit 1 + Unit 3 are on the same branch, so no
window exists where nothing merges node-lane PRs — they ship in one PR).

**Scope.** Edit `.claude/skills/dispatch-propagate/scripts/transition-node`:
- Delete the arm block `transition-node:166-174` (the
  `if [[ "$ARM_MERGE" == "true" ]]` block that runs `gh pr ready` +
  `dispatch-auto-merge` and prints `armed-merge`).
- Delete the arm-time missing-stamp fail-closed at `transition-node:151-156` (the
  `ARM_MERGE==true && STAMP_MISSING==true` → `held ... (missing-stamp)` block) —
  this scope/stamp re-check now rides to the tick (Unit 1, step 4).
- On a clean review completion (`ARM_MERGE == "true"` from
  `apply-node-transition`), the writer now simply lands the state-only
  `graph-commit` (the `reviewed` marker + `phase` staying `review`), calls
  `refresh_stamp` (KEEP `transition-node:164` — it stamps the exact scope the
  review ran against, which is precisely what Unit 1's tick re-check compares
  against), and prints a new terminal line, e.g. `review-complete $NODE_ID (merge
  deferred to tick)`, then `exit 0`. Do NOT fall through to the `transitioned`
  line (NEW_PHASE == review == PHASE, so there is no forward phase transition).
- Update the script header comment (`transition-node:13`, which lists "arming gh
  auto-merge") to state that arming/merge is now owned by the tick reconciler
  (`graph-auto-merge`); the writer records the `reviewed` marker only.

**Keep unchanged:** the CI-verdict sensor (`:102-113`), the freshness/scope-stale
demote gate (`:115-137` — a general forward-transition gate, unrelated to the
arm), the `apply-node-transition` call and its `reviewed`-marker write, and the
`graph-commit`.

**Out of scope:** the pure layer's `armMerge` decision flag
(`packages/intentionsutil/src/transitions.ts:201-204`) stays — it still means
"review completed clean" and still drives the `advanced`→`reviewed`-marker write
in `apply-node-transition.ts:174-178`. Renaming it (`armMerge`→`reviewComplete`)
would be marginally cleaner greenfield but touches the pure layer and its tests
for no behavioral gain; keep the name and only relocate the *action*.

**Tests (in this unit).** Update any `test-dispatch-scripts.sh` assertion that
expects `transition-node` to emit `armed-merge` or to invoke `dispatch-auto-merge`
on a clean review, to expect the new `review-complete ... (merge deferred to
tick)` line and NO merge call.

### Unit 3 — Wire `graph-auto-merge` into the tick

**Recommended model:** sonnet

**Dependencies:** Unit 1 (the script must exist).

**Scope.** Edit `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`:
insert a new Step 1d (cont.) block AFTER the issue-lane auto-merge block
(`dispatch-select-tick:433-440`) and BEFORE the `reconcile-graph-merged` block
(`:454-469`), gated on the SAME `[[ -z "$OPEN_MB" ]]` main-known-good condition
(a node-lane merge must be suppressed while main is broken or main-health is
UNKNOWN, exactly like the issue-lane merge). Mirror the block's structure:
`GRAPH_MERGE_OUT=$("$SCRIPT_DIR/graph-auto-merge") || true`, then echo each
non-empty line prefixed `merge: `. Ordering rationale to encode in a comment:
`graph-auto-merge` merges this tick; `reconcile-graph-merged` (which runs next,
unconditionally, and already honors a grace window at
`reconcile-graph-merged:74-77`) absorbs the merge to `done`/`main-qa` on a
subsequent tick without racing a still-settling merge.

**Tests (in this unit).** Add a tick-wiring assertion modeled on the existing
issue-lane auto-merge-wiring test (`test-dispatch-scripts.sh:~29286-29327`):
`graph-auto-merge` IS invoked when main is known-good (`OPEN_MB` empty) and its
`merged #N (id)` lines are prefixed `merge:`; and it is NOT invoked (no `merge:`
line) when main is broken/unknown.

### Unit 4 — Reconcile the node-lane review-completion doctrine in skill text

**Recommended model:** sonnet

**Dependencies:** none.

**Scope.** Update `.claude/skills/review-fix/SKILL.md` node-lane "Completion"
section (`:129-141`): it currently says `transition-node` "on a clean review —
arms gh auto-merge (same config gate as today) ... the reconciler sweep absorbs
the out-of-band merge to `done`". Rewrite to the clarification-53 split:
`transition-node` records the `reviewed` marker in `execution.markers` and defers
the merge; the TICK's `graph-auto-merge` reconciler performs the label-free merge
post-review (green CI + MERGEABLE + `reviewed` marker + fresh scope fingerprint),
and `reconcile-graph-merged` then absorbs the merge to `done`/`main-qa`. Keep the
"Do **not** apply `dispatch:reviewed`" instruction and the `transition-node "$N"
--set-pr "$PR_NUM"` invocation unchanged.

## Verification

Auto-runnable — the dispatch script test suite covers the reconciler gating, the
`transition-node` arm removal, and the tick wiring:

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual / observe-in-production (node lane, post-merge):

- On the first node-lane tactic that reaches clean review after this lands,
  confirm the tick emits `merge: merged #<pr> (<id>)` for it and the PR merges
  with no human action and no `dispatch:reviewed` label ever applied — the
  end-to-end behavior PR #2859 lacked.
- Confirm `transition-node` on that node's review completion emits
  `review-complete <id> (merge deferred to tick)` and does NOT itself merge.
- Confirm a node whose scope was edited after its review transition is NOT merged
  (a `held <id> (scope-stale)` line), and is demoted to `implement` by the next
  selection tick — the clarification-36 chain-of-custody guarantee.

## Out of scope

- The legacy issue lane's label-gated `dispatch-auto-merge` reconciler and its
  tick call (`dispatch-select-tick:433-434`) stay exactly as-is for the draining
  gh queue.
- The worker/tick CI-validation split *doctrine* itself (recorded as
  strategy-graph-native-dispatch clarification 53); this tactic implements only
  the post-review merge seam that split implies.
- Renaming the pure-layer `armMerge` flag (see Unit 2 out-of-scope).

## Dependency / linkage

Revises the "transition writer arms gh auto-merge at clean review completion"
behavior that `tactic-graph-router-transitions` (now `done`) landed in
`transition-node`; that arm scope moves to the tick here. No `blocked_by`:
`tactic-graph-router-transitions` is already merged, so this tactic edits the
landed script directly. Sibling `tactic-tick-scriptable-then-spawn` (phase `qa`)
restructures the tick's scriptable dispositions before the worker spawn — the new
`graph-auto-merge` sweep is one such scriptable, non-worker disposition and is
complementary, not blocking; plan against current `origin/main`
`dispatch-select-tick` and resolve any textual overlap at merge time.
