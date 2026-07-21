---
id: tactic-graph-review-exclusion-stall-recovery
kind: tactic
statement: Add a reconciler that routes a stranded phase:review tactic carrying
  the reviewed marker back to fix when its armed auto-merge cannot complete (PR
  CONFLICTING or CI turns red), since the selector's reviewed-marker exclusion
  (tactic-graph-selector-reviewed-exclusion) removes the incidental recovery
  that re-selection used to provide
owner: ai
status: codified
parent: null
rationale: "Deferred code-review finding from the /review-fix pass on PR #2888
  (tactic-graph-selector-reviewed-exclusion). Finalized directly via a per-node
  /align-tactics tactic-graph-review-exclusion-stall-recovery invocation
  (frozen-tactic dispatch, tactic-graph-frozen-tactic-dispatch) rather than a
  strategy-graph-native-dispatch round."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-graph-review-exclusion-stall-recovery
  pr: 2920
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours:
  reason: "/qa-fix: qa-fix's gated fix-planner flagged a scope-deviation on
    opus-fixable residue for PR #2920 — the disposition classifier judged the
    test-dispatch-scripts.sh harness FAIL opus-fixable, but the fix-planner
    refused to author a fix because it is inherited main-breakage from unrelated
    commit b8a1ba75 (assert_primary_checkout_on_main invariant added without
    matching test-stub coverage), and fixing sel_tick_setup's git stub is
    shared-test-infra work outside this PR's review-stall-reconciler scope.
    Escalating to office-hours for a human scope call (fix separately vs. fold
    into this PR). The node's own acceptance criteria (units 1 and 2) are fully
    verified and passing; the production-observation item is recorded as a
    needs-main residue section on the node body, already landed on origin/main."
  since: 2026-07-21
  recommendation: >-
    # Park recommendation — PR #2920 test-harness abort (scope call)


    **Addressed to:** the human resolving this park

    **Node:** `tactic-graph-review-exclusion-stall-recovery` (PR #2920)

    **TL;DR recommendation:** Option (a) with urgency. Spin up a **separate,
    urgent main-repair tactic** to fix the shared `test-dispatch-scripts.sh` git
    stub. Do **not** fold it into #2920. Merge #2920 after that fix lands and CI
    is green. If no one can pick up the separate fix within a tick or two,
    Option (b) (2-line same-PR fix) is an acceptable fallback — but it leaves
    main red for everyone else in the meantime.


    ---


    ## What I verified (not just restated from the park note)


    1. **Commit `b8a1ba75` is on `origin/main`** (merged 2026-07-21) and added
    `assert_primary_checkout_on_main` at `lib.sh:1749`. It calls `git -C "$path"
    symbolic-ref --short HEAD` (line 1751) and, via `resolve_project_root` (line
    1733), `git rev-parse --path-format=absolute --git-common-dir`.


    2. **The `sel_tick_setup()` git stub on `origin/main` handles neither.** The
    stub (in `test-dispatch-scripts.sh`, the `cat > .../bin/git` block ~line
    21351) has exactly three cases — `rev-parse --abbrev-ref HEAD`, `fetch
    origin main`, `merge --ff-only origin/main` — plus a silent `*) exit 0`
    catch-all. So `symbolic-ref --short HEAD` falls through, returns empty,
    `branch=""` ≠ `main` → the invariant prints `INVARIANT VIOLATED` and returns
    1, aborting the whole suite under `set -e`.


    3. **`origin/main`'s harness contains zero occurrences of `symbolic-ref`.**
    That is the decisive fact for Decision #1: **main is currently red for
    `test-dispatch-scripts.sh` for every PR/tactic that runs it, not just
    #2920.** `b8a1ba75` shipped a new `dispatch-select-tick` invariant *and*
    added no stub coverage for it in the shared harness — so the first
    `sel_tick` test aborts the suite regardless of which branch runs it.


    4. **This is not #2920's bug.** #2920 only extended the same file; its own
    new `review-stall:` wiring test happens to sit downstream of the abort. The
    fix-planner's scope-deviation call is **correct**: the owed work belongs to
    `b8a1ba75`'s lineage (shared test-infra), not to the review-stall-reconciler
    scope.


    ---


    ## Decision 1 — is main red for others right now? Yes.


    Treat this as a **standalone main-breakage** independent of #2920. Any
    dispatch tactic that touches `dispatch-select-tick` and runs
    `test-dispatch-scripts.sh` in CI is hitting the same exit-2 abort today.
    This warrants its own repair whether or not #2920 ever merges. It is the
    more urgent of the two issues buried in this park.


    ## Decision 2 — where does the harness fix live? Separate tactic
    (preferred).


    **Greenfield-correct answer:** the stub gap is shared test-infra debt
    created by `b8a1ba75`. Its clean home is a small urgent tactic/PR that
    repairs the harness for the whole fleet, is verified green on its own, and
    is then inherited by #2920 (and every other in-flight branch) on the next
    `origin/main` merge. This keeps #2920's diff scoped to the review-stall
    reconciler it was planned for.


    **Recommended sequencing:**

    1. Open the harness-repair tactic; add the two missing cases to
    `sel_tick_setup()`'s git stub (see exact patch below).

    2. Run `bash
    .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` to
    confirm the suite runs to completion (no exit-2 abort).

    3. Land it, confirm CI green on main.

    4. Merge `origin/main` into #2920, re-run the same suite so #2920's own new
    `review-stall:` test now executes, and merge #2920.


    **Acceptable fallback (Option b)** — only if the separate repair won't be
    picked up promptly and you want #2920 unblocked now: authorize the 2-line
    stub fix inside #2920. It is genuinely low-risk (additive cases before the
    `*) exit 0` catch-all, matching the pattern already used at lines 6671 and
    6897 in the same file). The cost is a slightly muddied #2920 scope and, more
    importantly, **main stays red for other branches until #2920 merges** — so
    this does not discharge the Decision-1 obligation on its own.


    ## The exact fix (either option)


    Add these two cases to the `sel_tick_setup()` git stub, before `*) exit 0
    ;;` (case matches `$*`, so the `-C <path>` prefix needs a glob):


    ```sh

    "-C "*" symbolic-ref --short HEAD") echo main ;;

    "rev-parse --path-format=absolute --git-common-dir") echo
    "$TMPDIR_TEST/.bare" ;;

    ```


    `echo main` satisfies the on-main invariant for the happy-path sel_tick
    tests; the git-common-dir case just needs to return a non-empty path so
    `resolve_project_root`'s `dirname` succeeds. Confirm against the real
    invocation at `lib.sh:1751` / `:1733` and the existing stub style at
    `test-dispatch-scripts.sh:6671` and `:6897`.


    ## One thing to flag back upstream


    `b8a1ba75` shipped an invariant with **no harness coverage of its own**
    (zero `symbolic-ref` mocks anywhere in the suite) and broke a pre-existing
    suite. Whoever owns the repair tactic should also add a dedicated off-main
    test for `assert_primary_checkout_on_main` so the invariant is actually
    exercised, not merely mocked-around. That closes the real gap rather than
    just silencing the abort.


    ## Not in scope for this park (already settled — do not reopen)


    #2920's own acceptance is fully verified: 579/579 intentionsutil vitest
    incl. the 6 `needsReviewStallRecovery` cases and the router
    fix-aware-exclusion case; the `router.ts` `&& t.execution?.fix == null`
    carve-out; the executable `reconcile-graph-review-stall` script and its
    `dispatch-select-tick` `review-stall:` wiring. The end-to-end
    observe-in-production item already rides with the node as a `## needs-main
    residue` section on `origin/main`. None of that needs your attention here —
    only the harness scope call does.
pace_exempt: false
rounds: null
attributes:
  bug_fix: true
---
# Add a reconciler that routes a stranded phase:review tactic carrying the reviewed marker back to fix when its armed auto-merge cannot complete (PR CONFLICTING or CI turns red), since the selector's reviewed-marker exclusion (tactic-graph-selector-reviewed-exclusion) removes the incidental recovery that re-selection used to provide

Finalized by a per-node `/align-tactics tactic-graph-review-exclusion-stall-recovery`
session (frozen-tactic dispatch). Originated as a deferred code-review finding
from the `/review-fix` pass on PR #2888 (`tactic-graph-selector-reviewed-exclusion`).

**Revision note (2026-07-19)**: this body was revised after implementation to
match the shipped design (PR #2920). The originally planned Unit 2 targeted the
`phase: "fix"` / `apply-node-transition.ts --ci failing` mechanism, which
`tactic-fix-interrupt-orthogonal-state` (PR #2905, merged between planning and
implementation) replaced with the orthogonal `execution.fix` interrupt and
removed from the codebase entirely (`"fix"` is no longer a `Phase` enum value;
`apply-node-transition.ts` no longer takes a CI verdict). The implement session
adapted Unit 2 to the current primitives — same recovery behavior, current
mechanism — and Unit 1 was unaffected. The sections below describe the design
as shipped.

## Context

`packages/intentionsutil/src/router.ts` excludes a review+reviewed node from
`selectGraphTargets` candidates (`tactic-graph-selector-reviewed-exclusion`):
a clean review arms auto-merge and stays at phase `review` with the `reviewed`
marker stamped, and the exclusion keeps the tick from wastefully re-selecting
it while the armed merge completes.

If the armed merge cannot complete after that point — `origin/main` moves and
the PR becomes `CONFLICTING`, or a required branch-up-to-date re-run turns CI
persistently red — auto-merge never fires and the PR neither merges nor
closes. The normal CI-red recovery is `graph-select-target`'s
`_gate_maybe_interrupt`, which enters the CI-fix interrupt
(`apply-fix-state.ts --set-fix`, writing `execution.fix` while `phase` stays
at its ladder position — see `tactic-fix-interrupt-orthogonal-state`). But
that gate only runs on candidates the selector emits, and the exclusion means
this node is never a candidate again — so the interrupt can never be entered.
The node is stranded at phase `review` indefinitely.

Before PR #2888 the node was re-selected every tick — wastefully re-running
`/review-fix` and re-provisioning — which incidentally recovered these cases:
provisioning caught a merge conflict via park, and the worker's own
transition caught red CI via fix. The exclusion removes that recovery without
replacing it.

**Design (as shipped)**: reuse the existing fix-interrupt primitives verbatim
rather than inventing a new mechanism. Two changes:

- Make the selector exclusion **fix-aware**: the review+reviewed exclusion
  skips only nodes with `execution.fix == null`. Once the interrupt is
  entered, the node re-surfaces — as a `fix` candidate via the selector's
  existing phase-override (`phase: t.execution?.fix != null ? "fix" : t.phase`)
  — and the normal fix lane (`_gate_fix_active` → `/fix-checks` → green →
  `--clear-fix` re-review reset) takes over. Every `execution.fix` consumer
  (the selector, `check-node-selection.ts`'s fix-presence gate, `/fix-checks`'s
  entry gate, `_gate_fix_active`) keys only on the field's value, never on who
  wrote it, so a reconciler-entered interrupt is indistinguishable from a
  gate-entered one.
- Add a **reconciler** that polls the stranded PRs directly (since selection
  never will) and enters the interrupt with the same write
  `_gate_maybe_interrupt` makes: `apply-fix-state.ts --set-fix` +
  `graph-commit`. A new pure predicate decides *when*: a PR can regress via
  CI going red (which the existing sensor already reports) **or** via
  `mergeable` going `CONFLICTING` (which nothing previously read for this
  case).

This mirrors two existing patterns exactly: `reconcile-graph-merged`
(`.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged`) is the
same "enumerate open graph-native tactics carrying a PR, poll `gh`, act,
`graph-commit`" shape for the merged/closed case; `dispatch-reconcile-ready`
(`.claude/skills/dispatch-propagate/scripts/dispatch-reconcile-ready`)
is the legacy gh-label-lane analog of the *exact* trigger condition needed
here — it demotes a ready PR back to draft on `VERDICT == "failing" ||
MERGEABLE == "CONFLICTING"`.

## Units of work

### Unit 1 — pure trigger predicate + unit tests

**Scope**: `packages/intentionsutil/src/transitions.ts` — add, in the
"Reconciler (Unit 2)" section, a `Mergeable` type and a new exported pure
function:

```ts
/** GitHub's PR mergeability enum, as gh_pr_view_rest projects it. */
export type Mergeable = "MERGEABLE" | "CONFLICTING" | "UNKNOWN";

export function needsReviewStallRecovery(ci: CiVerdict, mergeable: Mergeable): boolean {
  return ci === "failing" || mergeable === "CONFLICTING";
}
```

With a doc comment explaining: it decides whether an armed `phase: review` +
`reviewed`-marker tactic has regressed and must be routed into the CI-fix
interrupt by the review-stall reconciler, because the selector's
reviewed-marker exclusion means the normal `_gate_maybe_interrupt` entry
(`graph-select-target`, which only runs on candidates the selector already
emits) never runs for this node via selection. `UNKNOWN` mergeable and
non-`failing` CI are not a regression — GitHub's async mergeability
computation self-heals on a later sweep (same no-op posture as
`dispatch-reconcile-ready`).

`CiVerdict` (`"passing" | "failing" | "unknown"`) is reused, not redefined.

Out of scope: no changes to `fixInterrupt`, `decideTransition`, or
`apply-fix-state.ts` — the interrupt entry/resolution machinery already
exists; this predicate only decides when the reconciler invokes it.

**Test scope**: `packages/intentionsutil/test/transitions.test.ts` — a
`describe("needsReviewStallRecovery", ...)` block covering:
`("failing", "MERGEABLE")` → true; `("passing", "CONFLICTING")` → true;
`("failing", "CONFLICTING")` → true; `("passing", "MERGEABLE")` → false;
`("unknown", "UNKNOWN")` → false; `("passing", "UNKNOWN")` → false (the
self-heal case).

**Recommended model**: sonnet — a small, well-specified pure function plus
table-driven unit tests, mirroring an adjacent function (`fixInterrupt`) in
the same file.

**Dependencies**: none.

### Unit 2 — fix-aware exclusion + reconciler wrapper + tick wiring

**Scope A — selector carve-out**: `packages/intentionsutil/src/router.ts` —
the review+reviewed exclusion gains an `&& t.execution?.fix == null` clause,
so the exclusion applies only while no interrupt is in flight. A node whose
`execution.fix` the reconciler has set resumes being surfaced, as a `fix`
candidate via the existing phase-override on the next line. Without this
carve-out the reconciler's write would be invisible — the node would carry an
interrupt no tick ever acts on.

**Scope B — reconciler**: new script
`.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall`,
mirroring `reconcile-graph-merged` (same header doctrine, `set -uo pipefail`,
`source lib.sh`, `REPO_ROOT`/`UTIL_SCRIPTS`/`GRAPH_COMMIT` resolution).
Behavior:

1. **Enumerate candidates** (network-free): a `node --import tsx/esm -e`
   one-liner run from `$REPO_ROOT` (imports resolved as
   `./packages/intentionsutil/src/*.js` against CWD, the same shape as
   `reconcile-graph-merged`'s enumeration) using `listNodes` and
   `REVIEWED_MARKER`. Print `<id>\t<pr>` for every tactic where
   `kind === "tactic"`, `phase === "review"`, markers include
   `REVIEWED_MARKER`, `execution.fix == null` (defensive — skip rather than
   double-enter an already-active interrupt), and `execution.pr` is non-null.
   Exit 0 immediately (no output) if empty.
2. **Per candidate**, using `gh_pr_view_rest "$pr"` and
   `dispatch_ci_verdict_rest "$HEAD_SHA"` (both from `lib.sh`):
   - Read `.state`. If not `"OPEN"`, `continue` (a merged/closed PR is
     `reconcile-graph-merged`'s job — the two reconcilers never race the same
     node).
   - Read `.mergeable` (`MERGEABLE`/`CONFLICTING`/`UNKNOWN`) and `.headRefOid`.
   - Compute `VERDICT` via `dispatch_ci_verdict_rest`, normalized to
     `passing`/`failing`/`unknown` (anything else, or a call failure, maps to
     `unknown` — never a regression signal).
   - Call the Unit-1 predicate via a `node --import tsx/esm -e` one-liner
     (same CWD-resolution shape as step 1), passing `VERDICT` and
     `MERGEABLE`. If `"false"`, `continue` (no-op; nothing printed —
     `reconcile-graph-merged`'s "NOTHING for a skip" stdout protocol).
   - Otherwise **enter the interrupt**: run
     `node --import tsx/esm "$UTIL_SCRIPTS/apply-fix-state.ts" "$id" --set-fix --dir "$REPO_ROOT/intentions"`
     — byte-identical to the write `graph-select-target`'s
     `_gate_maybe_interrupt` makes on a normal CI-red candidate. `phase`
     stays at `review`; the `reviewed` marker stays (it is stripped later by
     `--clear-fix`'s re-review reset when the fix goes green). On failure,
     log to stderr and `continue` (best-effort per-candidate handling).
   - Land it with **its own** `graph-commit` call:
     `"$GRAPH_COMMIT" -m "graph: enter fix-interrupt on stalled review $id (ci=$VERDICT merge=$MERGEABLE)" "$id"`.
     On failure, log to stderr (the write is on disk but unlanded) and
     `continue`. Candidates are independent — no batching.
   - On success, print exactly
     `recovered $id -> fix (ci=$VERDICT merge=$MERGEABLE)`.
3. Exit codes: 0 always, including a no-op sweep and any per-candidate error
   (best-effort, matching `reconcile-graph-merged`'s doctrine); 1 only for a
   hard failure that prevents the sweep from running at all (the enumeration
   one-liner erroring).

**Scope C — tick wiring**:
`.claude/skills/dispatch-propagate/scripts/dispatch-select-tick` —
immediately after the existing `RECONCILE_GRAPH_OUT` block, an analogous
block calls the new script and prefixes its output lines with
`review-stall: `. A comment above it explains why it runs unconditionally and
best-effort right after `reconcile-graph-merged`: it only acts on a
still-`OPEN` PR (never races the merged/closed case) and only routes a
regressed node into the fix lane, so it is safe during a main-broken episode.
The tick already runs sandbox-disabled, covering the new script's `gh` (TLS)
+ `node --import tsx/esm` (npm cache) needs.

**Scope D — test wiring**:
`.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` —
`reconcile-graph-review-stall:SEL_REVIEW_STALL_OUT` added to the silent-fake
loop, and `SEL_REVIEW_STALL_OUT` to `sel_tick_teardown`'s unset list. Every
existing `dispatch-select-tick` test stays byte-identical (empty fake output
by default); a future test can drive `SEL_REVIEW_STALL_OUT` — exactly how
`SEL_RECONCILE_GRAPH_OUT` was wired for `reconcile-graph-merged` (parity, not
a new requirement, is the bar).

**Recommended model**: sonnet — mirroring an existing, fully-specified
sibling script plus a one-line carve-out, tick wiring, and a mechanical
test-fake addition.

**Dependencies**: Unit 1 (the reconciler imports `needsReviewStallRecovery`).

## Reuse

- `apply-fix-state.ts --set-fix` — the interrupt-entry write, reused
  **unchanged**; the reconciler makes the same write `_gate_maybe_interrupt`
  makes. Resolution (green CI → `--clear-fix` + re-review reset stripping the
  `reviewed` marker) is likewise existing machinery, untouched.
- The selector's `fix` phase-override (`router.ts`) — already routes any
  non-null `execution.fix` node into the fix lane; Unit 2's carve-out only
  stops the exclusion from shadowing it.
- `gh_pr_view_rest` and `dispatch_ci_verdict_rest`
  (`.claude/skills/dispatch-propagate/scripts/lib.sh`) — the existing
  REST-backed PR/CI sensors, already sourced via `lib.sh` in every sibling
  reconciler.
- `reconcile-graph-merged` — structural template for the wrapper's header
  doctrine, enumeration style, and best-effort error handling.
- `dispatch-reconcile-ready` — the legacy gh-label-lane precedent for the
  exact `ci-failing OR mergeable-CONFLICTING` trigger condition.
- `graph-commit` (`packages/intentionsutil/scripts/graph-commit`) — the sole
  landing primitive, per-node.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
```

Confirms Unit 1's `needsReviewStallRecovery` cases and Unit 2's router
carve-out test pass, and that no existing `transitions.test.ts` /
`router.test.ts` case regresses. (Note: the project filter is the
workspace-relative path `packages/intentionsutil`, not the bare package
name — the bare name matches no project.)

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

Confirms the `dispatch-select-tick` wiring stays byte-identical for every
existing test (the new fake defaults to silent output) and that the new
script is syntactically sound bash.

Manual (no live `gh`/graph-native PR fixture exists to drive an end-to-end
check in CI): after landing, the next time a `phase: review` + `reviewed`
tactic's armed PR actually regresses in production, confirm
`dispatch-select-tick`'s next autonomous tick emits a
`review-stall: recovered <id> -> fix (...)` line and that the node's
`intentions/<id>.md` lands with `execution.fix` set (phase stays `review`;
the `reviewed` marker is stripped later by the green-resolution
`--clear-fix` re-review reset). This is the same observe-in-production
posture the sibling reconcilers were verified under.

## Provenance

- **Location**: `packages/intentionsutil/src/router.ts` (reviewed-marker
  exclusion in `selectGraphTargets`)
- **Adversarial verdict**: not adversarially verified — this is a `Deferred`
  code-review finding, not a `Required` security finding, so the
  adversarial-verify step was skipped for it.
- **Source PR**: #2888 (`execution.pr` on `tactic-graph-selector-reviewed-exclusion`)
- **Implementation PR**: #2920 (draft; carries the plan adaptation described
  in the revision note above)
