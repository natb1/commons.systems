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
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  bug_fix: true
---
# Add a reconciler that routes a stranded phase:review tactic carrying the reviewed marker back to fix when its armed auto-merge cannot complete (PR CONFLICTING or CI turns red), since the selector's reviewed-marker exclusion (tactic-graph-selector-reviewed-exclusion) removes the incidental recovery that re-selection used to provide

Finalized by a per-node `/align-tactics tactic-graph-review-exclusion-stall-recovery`
session (frozen-tactic dispatch). Originated as a deferred code-review finding
from the `/review-fix` pass on PR #2888 (`tactic-graph-selector-reviewed-exclusion`).

## Context

`packages/intentionsutil/src/router.ts:296` adds `if (t.phase === "review" &&
t.execution?.markers.includes(REVIEWED_MARKER)) continue;` to
`selectGraphTargets`, permanently excluding a review+reviewed node from
selection. A clean review arms auto-merge
(`packages/intentionsutil/src/transitions.ts:213-214`) and stays at phase
`review` with the `reviewed` marker stamped.

If the armed merge cannot complete after that point — `origin/main` moves and
the PR becomes `CONFLICTING`, or a required branch-up-to-date re-run turns CI
persistently red — auto-merge never fires and the PR neither merges nor
closes. `transition-node` (the only producer of graph phase `fix`, via
`decideTransition`'s fix interrupt, `packages/intentionsutil/src/transitions.ts:105-107`)
runs only when a node is selected. Because the selector now permanently skips
this node, `transition-node` is never invoked for it, so the fix interrupt
that would route it back to `fix` can never fire. The node is stranded at
phase `review` indefinitely.

Before PR #2888 the node was re-selected every tick — wastefully re-running
`/review-fix` and re-provisioning — which incidentally recovered these cases:
provisioning caught a merge conflict via park, and the worker's own
transition caught red CI via fix. The exclusion removes that recovery without
replacing it.

**Design** (verified against current `origin/main`, no superseding node
exists): reuse the existing fix-interrupt path verbatim rather than inventing
a new one. `decideTransition` (`packages/intentionsutil/src/transitions.ts:173-223`)
already does exactly the right thing when called with `ci: "failing"` on a
`phase: "review"` node — `fixInterrupt` (`transitions.ts:105-107`, `review` is
in `FIX_INTERRUPTIBLE`, `transitions.ts:95`) returns `true`, so the decision is
`{phase: "fix", clearMarkers: [QA_DONE_MARKER, REVIEWED_MARKER], ...}`
(`transitions.ts:198-200`) — precisely the "clearing the reviewed marker"
behavior this tactic's statement calls for. `apply-node-transition.ts` (CLI:
`node --import tsx/esm apply-node-transition.ts <id> --ci failing`) already
applies that decision through `writeNode`. So no change to the pure ladder
logic or to `apply-node-transition.ts` is needed — only:
(a) a new pure predicate that decides *when* to call it with `ci: "failing"`
(a PR can regress via CI going red, which the existing sensor already reports,
**or** via `mergeable` going `CONFLICTING`, which nothing currently reads for
this case), and (b) a new reconciler wrapper that polls the stranded PRs
directly (since selection will never do it) and calls `apply-node-transition.ts`
+ `graph-commit` when the predicate fires.

This mirrors two existing patterns exactly: `reconcile-graph-merged`
(`.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged`) is the
same "enumerate open graph-native tactics carrying a PR, poll `gh`, act,
`graph-commit`" shape for the merged/closed case; `dispatch-reconcile-ready`
(`.claude/skills/dispatch-propagate/scripts/dispatch-reconcile-ready:107-119`)
is the legacy gh-label-lane analog of the *exact* trigger condition needed
here — it demotes a ready PR back to draft on `VERDICT == "failing" ||
MERGEABLE == "CONFLICTING"`.

## Units of work

### Unit 1 — pure trigger predicate + unit tests

**Scope**: `packages/intentionsutil/src/transitions.ts` — add, in the
"Reconciler (Unit 2)" section (immediately before `reconcileMergedPhase` at
line 255), a `Mergeable` type and a new exported pure function:

```ts
/** GitHub's PR mergeability enum, as gh_pr_view_rest projects it. */
export type Mergeable = "MERGEABLE" | "CONFLICTING" | "UNKNOWN";

export function needsReviewStallRecovery(ci: CiVerdict, mergeable: Mergeable): boolean {
  return ci === "failing" || mergeable === "CONFLICTING";
}
```

Write a doc comment above it explaining: it decides whether an armed
`phase: review` + `reviewed`-marker tactic has regressed and must be routed
back to `fix` by the review-stall reconciler
(`tactic-graph-review-exclusion-stall-recovery`), because the selector's
reviewed-marker exclusion (`router.ts:296`, `tactic-graph-selector-reviewed-exclusion`)
means `transition-node`'s normal `fixInterrupt` never runs for this node again
via selection. `UNKNOWN` mergeable and non-`failing` CI are not a regression —
GitHub's async mergeability computation self-heals on a later sweep (same
no-op posture as `dispatch-reconcile-ready`).

Out of scope: do NOT change `decideTransition`, `fixInterrupt`, or
`apply-node-transition.ts` — they already produce the correct transition when
handed `ci: "failing"` (see Context above); this predicate only decides when
to hand them that value.

**Test scope**: `packages/intentionsutil/test/transitions.test.ts` — add a
`describe("needsReviewStallRecovery", ...)` block (matching the file's
existing `describe`/`it` style, e.g. the `fixInterrupt` block at line 88)
covering: `("failing", "MERGEABLE")` → true; `("passing", "CONFLICTING")` →
true; `("failing", "CONFLICTING")` → true; `("passing", "MERGEABLE")` →
false; `("unknown", "UNKNOWN")` → false; `("passing", "UNKNOWN")` → false
(the self-heal case).

**Recommended model**: sonnet — a small, well-specified pure function plus
table-driven unit tests, mirroring an adjacent function (`fixInterrupt`) in
the same file.

**Dependencies**: none.

### Unit 2 — reconciler wrapper + tick wiring

**Scope**: create `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall`,
a new bash script mirroring `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged`
(read that whole file first — same header-comment doctrine, same `set -uo
pipefail`, same `source "$SCRIPT_DIR/lib.sh"`, same `REPO_ROOT`/`UTIL_SCRIPTS`/`GRAPH_COMMIT`
resolution). Behavior:

1. **Enumerate candidates** (network-free): a `node --import tsx/esm -e`
   one-liner run from `$REPO_ROOT` (same inline style as
   `reconcile-graph-merged`'s `OPEN_TACTICS` block, `reconcile-graph-merged:44-54`
   — copy that block's `(cd "$REPO_ROOT" && node --import tsx/esm -e '...')`
   shape verbatim; a dynamic `import()` inside `node -e` resolves against CWD,
   so the import specifiers must be the working `./packages/intentionsutil/src/store.js`
   / `./packages/intentionsutil/src/transitions.js` form that script already
   uses — NOT a `../src/...` relative path, which would resolve wrong from
   `$REPO_ROOT`) using `listNodes` and `REVIEWED_MARKER`. Print `<id>\t<pr>`
   for every tactic where
   `n.kind === "tactic"`, `n.phase === "review"`,
   `n.execution?.markers.includes(REVIEWED_MARKER)`, and `n.execution.pr` is
   non-null. Exit 0 immediately (no output) if the enumeration is empty.
2. **Per candidate**, using `gh_pr_view_rest "$pr"` (`lib.sh:1093`) and
   `dispatch_ci_verdict_rest "$HEAD_SHA"` (`lib.sh:792`, both already sourced
   via `lib.sh`):
   - Read `.state`. If not `"OPEN"`, `continue` (a merged/closed PR is
     `reconcile-graph-merged`'s job, not this sweep's — leave it alone so the
     two reconcilers never race the same node).
   - Read `.mergeable` (`MERGEABLE`/`CONFLICTING`/`UNKNOWN`) and `.headRefOid`.
   - Compute `VERDICT` via `dispatch_ci_verdict_rest`, normalized to
     `passing`/`failing`/`unknown` (anything else, or a call failure, maps to
     `unknown` — mirror `transition-node`'s `CI="unknown"` fallback pattern,
     `transition-node:107-117`).
   - Call the Unit-1 predicate via a `node --import tsx/esm -e` one-liner
     (same CWD-resolution caveat as step 1 — run from `$REPO_ROOT`, import
     `needsReviewStallRecovery` from `./packages/intentionsutil/src/transitions.js`),
     passing `VERDICT` and `MERGEABLE`. If it prints `"false"`, `continue`
     (no-op, nothing printed to stdout — mirrors `reconcile-graph-merged`'s
     "NOTHING for a skip" stdout protocol).
   - Otherwise: run
     `node --import tsx/esm "$UTIL_SCRIPTS/apply-node-transition.ts" "$id" --ci failing`
     (reusing the existing fix-interrupt decision — see Context). Deliberately
     pass **no** `--scope-stale`/`--strategy-stale` flag: `apply-node-transition.ts`'s
     CLI defaults both to `false` when the flag is omitted
     (`apply-node-transition.ts:67-68`), and `decideTransition` only enters its
     scope-stale (`transitions.ts:185-187`) or strategy-stale
     (`:190-192`) branches when the caller passes `true` — so with these flags
     always omitted, this call site can NEVER take those branches, regardless
     of the node's actual scope/strategy staleness; it always falls through to
     the `ci: "failing"` fix-interrupt branch (`:198-200`) once the trigger
     fires. This is intentional, not an oversight: staleness detection is
     `transition-node`'s and the worker-start gate's job, not this
     reconciler's. Once this reconciler routes the node to `fix`, it re-enters
     the normal selection ladder, and the worker-start gate re-applies the
     scope/strategy freshness checks the next time it is picked up — so a
     node that is both PR-regressed and scope/strategy-stale is still caught
     correctly, just one tick later than the PR-regression recovery. Do not
     add scope/strategy-staleness detection to this reconciler — that would
     duplicate machinery that already runs downstream of `fix`. On failure,
     log to stderr and `continue` to the next candidate (best-effort, mirrors
     `dispatch-reconcile-ready`'s per-PR error handling — NOT `set -e`, no
     `|| true`-swallowed silent skip).
   - Land it: `"$GRAPH_COMMIT" -m "graph: recover stalled review $id -> fix (ci=$VERDICT merge=$MERGEABLE)" "$id"`.
     On failure, log to stderr (the write is on disk but unlanded) and
     `continue`.
   - On success, print exactly `recovered $id -> fix (ci=$VERDICT merge=$MERGEABLE)`
     (this is the stdout protocol the tick wiring below threads through).
3. Land each candidate with **its own** `graph-commit` call (do not batch —
   candidates are independent tactics/PRs and volume is expected to be rare;
   this matches `transition-node`'s per-node landing model, not
   `reconcile-graph-merged`'s batched one).
4. Exit codes: 0 always, including a no-op sweep and any per-node error
   (best-effort, matching `reconcile-graph-merged`'s doctrine) — exit 1 only
   for a hard failure that prevents the sweep from running at all (e.g. the
   enumeration one-liner itself erroring).

**Wire it into the tick**: `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick` —
immediately after the existing `RECONCILE_GRAPH_OUT` block (currently ends at
line 475, right before the "Standing per-tick reconciliation-debt duty"
comment at line 477), insert an analogous block calling the new script and
prefixing its output lines with `review-stall: `, e.g.:

```bash
REVIEW_STALL_OUT=$("$SCRIPT_DIR/reconcile-graph-review-stall") || true
if [[ -n "$REVIEW_STALL_OUT" ]]; then
  while IFS= read -r stall_line; do
    [[ -n "$stall_line" ]] && echo "review-stall: $stall_line"
  done <<< "$REVIEW_STALL_OUT"
fi
```

Add a one-paragraph comment above it (matching the style of the comment above
`RECONCILE_GRAPH_OUT` at `dispatch-select-tick:460-469`) explaining why this
runs unconditionally and best-effort right after `reconcile-graph-merged`: it
only acts on a still-`OPEN` PR (never races the merged/closed case
`reconcile-graph-merged` owns) and only routes a regressed node backward, so
it is safe during a main-broken episode. This whole script already runs with
the sandbox disabled (per the file's existing header note), covering the new
script's `gh` (TLS) + `node --import tsx/esm` (npm cache) needs — no new
sandbox wiring required.

**Test wiring**: `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` —
add `reconcile-graph-review-stall:SEL_REVIEW_STALL_OUT` to the silent-fake
loop at line 21170 (the `for _hs in dispatch-reconcile-merged:... \` block),
and add `SEL_REVIEW_STALL_OUT` to the `unset` list in `sel_tick_teardown` at
line 21393 (alongside `SEL_RECONCILE_GRAPH_OUT`). This keeps every existing
`dispatch-select-tick` test byte-identical (empty fake output by default) and
gives a future test a driveable `SEL_REVIEW_STALL_OUT` env var — matching
exactly how `SEL_RECONCILE_GRAPH_OUT` was wired for `reconcile-graph-merged`
(neither has a dedicated positive-output assertion today; parity, not a new
requirement, is the bar here).

**Recommended model**: sonnet — rote mirroring of an existing, fully-specified
sibling script (`reconcile-graph-merged`) plus a one-line tick wiring and a
mechanical test-fake addition; no new architectural decisions.

**Dependencies**: Unit 1 (the reconciler imports `needsReviewStallRecovery`).

## Reuse

- `decideTransition` / `fixInterrupt` / `apply-node-transition.ts` — the
  fix-interrupt transition and its `clearMarkers` behavior already exist and
  are reused **unchanged** (`transitions.ts:173-223`, `:105-107`). This is the
  central reuse point: Unit 1 adds only a *trigger* predicate, never a new
  transition.
- `gh_pr_view_rest` and `dispatch_ci_verdict_rest`
  (`.claude/skills/dispatch-propagate/scripts/lib.sh:1093`, `:792`) — the
  existing REST-backed PR/CI sensors, already sourced via `lib.sh` in every
  sibling reconciler.
- `reconcile-graph-merged` — structural template for the new wrapper's
  header doctrine, enumeration style, and best-effort error handling.
- `dispatch-reconcile-ready:107-119` — the legacy gh-label-lane precedent for
  the exact `ci-failing OR mergeable-CONFLICTING` trigger condition.
- `graph-commit`
  (`packages/intentionsutil/scripts/graph-commit`) — the sole landing
  primitive, used per-node exactly as `transition-node` and
  `demote-node-to-implement` already do.

## Verification

```verify
npx vitest run --project intentionsutil --root .
```

Confirms Unit 1's new `needsReviewStallRecovery` cases pass and that no
existing `transitions.test.ts` / `apply-node-transition.test.ts` /
`reconcile-graph.test.ts` case regresses (this change touches none of their
existing exports' behavior).

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

Confirms the `dispatch-select-tick` wiring stays byte-identical for every
existing test (the new fake defaults to silent output) and that the new
script is syntactically sound bash (the harness sources/execs it via `$PATH`
stubs).

Manual (no live `gh`/graph-native PR fixture exists to drive an end-to-end
check in CI): after landing, the next time a `phase: review` + `reviewed`
tactic's armed PR actually regresses in production (origin/main moves under
it, or a required check re-runs red), confirm `dispatch-select-tick`'s next
autonomous tick emits a `review-stall: recovered <id> -> fix (...)` line and
that the node's `intentions/<id>.md` lands with `phase: fix` and
`reviewed`/`qa-done` cleared from `execution.markers`. This is the same
observe-in-production posture the sibling reconcilers (`reconcile-graph-merged`,
`dispatch-graph-scope-sweep`) were verified under — there is no synthetic
graph-native-PR test harness to exercise the full gh-polling path today.

## Provenance

- **Location**: `packages/intentionsutil/src/router.ts:296`
- **Adversarial verdict**: not adversarially verified — this is a `Deferred`
  code-review finding, not a `Required` security finding, so the
  adversarial-verify step was skipped for it.
- **Source PR**: #2888 (`execution.pr` on `tactic-graph-selector-reviewed-exclusion`)
