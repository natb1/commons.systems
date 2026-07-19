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
office_hours:
  reason: >-
    /implement: implementation deviated from the persisted plan on

    tactic-graph-review-exclusion-stall-recovery. Between planning and this

    session, tactic-fix-interrupt-orthogonal-state (PR #2905, merged

    2026-07-18/19) refactored the CI-fix interrupt from a `phase: "fix"` value

    into the orthogonal `execution.fix` field, and removed `"fix"` from the

    `Phase` enum entirely. The node's persisted plan body's Unit 2 (calling

    `apply-node-transition.ts --ci failing` to write `phase: "fix"`) is no
    longer

    implementable as written — that flag and phase value no longer exist.


    I adapted Unit 2 to the current architecture rather than blocking: the

    selector's review+reviewed exclusion (router.ts) is now fix-aware

    (`&& t.execution?.fix == null`), and the new reconciler

    (reconcile-graph-review-stall) enters the interrupt via the existing

    `apply-fix-state.ts --set-fix` primitive (the same write

    `graph-select-target`'s CI-red gate would make) instead of writing a phase

    value. Unit 1 (the `needsReviewStallRecovery` predicate) was unaffected by

    the drift and landed as originally planned. Both units are implemented,

    tested (568/568 vitest, 2973/2973 dispatch-script tests), and pushed as

    PR #2920 (draft).


    This is a genuine architecture-level adaptation, not a mechanical

    translation the frozen plan anticipated — flagging for human review before

    this proceeds to fix-checks/qa/review.
  since: 2026-07-19
  recommendation: >-
    # Office-hours review: `tactic-graph-review-exclusion-stall-recovery` (PR
    #2920)


    ## What you're picking up


    An autonomous `/implement` session built the 2-unit plan for this tactic and
    opened draft PR #2920. Mid-implementation it caught that the plan's Unit 2
    design was written against a `phase: "fix"` / `apply-node-transition.ts --ci
    failing` mechanism that PR #2905 (`tactic-fix-interrupt-orthogonal-state`,
    merged 07-18/19) had already deleted in favor of an orthogonal
    `execution.fix` field. Rather than follow the stale plan text blindly, it
    adapted Unit 2 to the current primitives and parked the whole PR for you.
    Unit 1 landed exactly as planned and is not in question.


    The underlying goal is unchanged: a `phase: review` + `reviewed`-marker
    tactic is permanently excluded from the selector
    (`packages/intentionsutil/src/router.ts`), so if its armed auto-merge later
    goes CONFLICTING or its CI turns red, nothing picks it back up. The fix
    makes the exclusion fix-aware and adds a reconciler that re-enters such
    stranded nodes into the fix lane.


    ## The two things worth your judgment


    The adapted design hinges on one behavioral assumption that the reviewer —
    not the implementer — should ratify:


    - **Is `execution.fix` set by `apply-fix-state.ts --set-fix`, with no
    `graph-select-target` involvement, a state the rest of the pipeline safely
    consumes?** The new reconciler
    `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall`
    writes `execution.fix` directly (mirroring the write the normal CI-red gate
    makes) and lands it via its own `graph-commit`. The selector then stops
    excluding the node (`t.execution?.fix == null` clause in `router.ts`) and
    re-surfaces it as a `fix` candidate. The open question: does `/fix-checks` —
    or any other `execution.fix` consumer — assume that field was *always*
    written by `graph-select-target` specifically, or is it agnostic to the
    writer? If any consumer keys off provenance, this reconciler produces a
    state they weren't built to handle. This is the load-bearing check.


    - **Should the stale plan body be corrected?**
    `intentions/tactic-graph-review-exclusion-stall-recovery.md`'s body still
    literally describes the defunct `phase: "fix"` mechanism from PR #2905's
    pre-refactor world. It was left untouched — body edits are an
    align-tactics/align-strategy job, out of scope for an implement session.
    Decide whether to correct/annotate it to match the shipped design or leave
    it as historical record with a note pointing at the adaptation.


    ## Coverage caveat (not a defect)


    There is no end-to-end test of the reconciler's `gh`-polling path, because
    no production case has ever hit this stall — it's a defensive recovery path
    for a rare regression. This matches the sibling `reconcile-graph-merged`,
    which also has no such test, and matches what the plan's own Verification
    section already acknowledged. Unit-level coverage is solid:
    `needsReviewStallRecovery` in `transitions.ts` is tested across all six
    ci×mergeable combinations (vitest 568/568), and the reconciler has
    silent-fake parity in `test-dispatch-scripts.sh` (2973/2973). Don't hold the
    missing e2e against it unless you disagree with the sibling precedent.


    ## Post-park resolution (2026-07-19, same session)


    Both judgment items above were resolved interactively with the user after
    the park:


    - **Provenance question: resolved — writer-agnostic, safe as shipped.**
    `FixState` (`schema.ts:370`) is `{since, attempt, pushed_sha}` — provenance
    is not even representable. Every consumer keys only on the field's value:
    the selector (`router.ts:305`), `check-node-selection.ts`'s fix-presence
    gate (:219-228), `/fix-checks`'s entry gate (SKILL.md:63), and
    `_gate_fix_active` (which on green runs `--clear-fix`, whose re-review reset
    is exactly right for a recovered node). `/fix-checks`'s "disarm auto-merge
    on every push" section explicitly anticipates past-review nodes with stale
    merge-arms.

    - **Plan body: revised and landed** (graph-commit 7a597ae7 on main,
    CAS-guarded, frontmatter untouched). The body now describes the shipped
    `execution.fix` design with a revision note explaining the PR #2905
    adaptation.

    - **Re-validated after the body edit**: vitest 568/568,
    test-dispatch-scripts 2973/2973.


    Remaining for office-hours: only next-action 1 (read the PR #2920 diff) and
    4 (route to review or merge).


    ## Concrete next actions


    1. **Read the diff on PR #2920** — focus on the `router.ts` exclusion clause
    and the new `reconcile-graph-review-stall` script; Unit 1 (`transitions.ts`)
    needs only a skim.

    2. **Resolve the `execution.fix` provenance question**: check whether
    `/fix-checks` (and any other `execution.fix` reader) cares who wrote the
    field, or treats a non-null `execution.fix` uniformly regardless of writer.
    This decides whether the reconciler is safe as-shipped.

    3. **Decide the plan-body disposition**: correct/annotate
    `intentions/tactic-graph-review-exclusion-stall-recovery.md` to the adapted
    design, or leave it with a historical note — likely a follow-up
    align-tactics pass, not a change on this PR.

    4. **If satisfied on (2):** re-route the tactic back to `review` for the
    normal review phase (the adapted design deviated from the plan and deserves
    a review pass), or merge if you're confident the shipped diff is
    review-clean. **If not satisfied on (2):** file the consumer-compatibility
    concern and hold the PR pending that fix.


    References:

    - #2920: https://github.com/natb1/commons.systems/pull/2920

    - #2905: https://github.com/natb1/commons.systems/pull/2905
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
