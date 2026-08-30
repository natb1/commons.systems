---
id: tactic-conflict-outranks-ci-precedence
kind: tactic
statement: Make the normal selection path check mergeable BEFORE writing
  execution.fix, so a CONFLICTING-and-red node routes straight to the conflict
  lane instead of burning a graph write and a fix attempt on stale-code CI
owner: ai
status: codified
parent: null
rationale: "Byproduct of the 2026-07-29 /align-strategy dispatch-containment
  interview. Conflict-vs-CI precedence is inconsistent across stages: the
  reviewed-node path is correct (transitions.ts:272-276, documented at :262-265
  as 'CONFLICTING takes precedence over failing when both hold'), while the
  normal path enters the fix interrupt and COMMITS execution.fix to main —
  consuming attempt 1 of 3 — before provisioning reaches exit 11 and routes to
  the conflict lane. The write is wasted and the attempt is burned against a PR
  whose CI result was about pre-merge code. Author ratified
  conflict-outranks-CI-failed as doctrine this round. This tactic is the
  targeted fix; the full one-ordered-cascade unification is recorded as the
  greenfield with a migration path and deliberately sequenced after this and its
  siblings, each of which removes a special case that would otherwise be carried
  into the unified form."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 0.04
  rationale: >-
    Bootstrap re-scale 2026-07-30: Waves B-D of a three-band interim scale (50 /
    20 / 10) - dispatch-containment and evidence-custody work that follows the
    Wave-A write-path fixes. Interim scaffolding only;
    tactic-attention-tier-ranking and tactic-attention-boost-scripts retire this
    numeric scheme.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 20 to 0.04 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
phase: main-qa
execution:
  branch: tactic-conflict-outranks-ci-precedence
  pr: 3019
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-03T10:16:05Z
    mergeCommitSha: 72683cbaaaf8d32aeb3d9b1b7e8f3f60c5e11f16
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 20
---
# Make the normal selection path check mergeable BEFORE writing execution.fix, so a CONFLICTING-and-red node routes straight to the conflict lane instead of burning a graph write and a fix attempt on stale-code CI

## Context

The graph router's selection query (`.claude/skills/dispatch-propagate/scripts/graph-select-target`) is the sole CI-routing authority: on a fix-interruptible ladder phase (`implement` / `qa` / `review`) whose PR CI has concluded RED, it *writes* `execution.fix` and lands it on `origin/main` before emitting the candidate as `fix`.

That gate is merge-blind. `_gate_maybe_interrupt` (`.claude/skills/dispatch-propagate/scripts/graph-select-target:530-544`) tests **only** `[[ "$_CI_VERDICT" == "failing" ]]`. When a PR is BOTH `CONFLICTING` and red, the gate:

1. writes `execution.fix` via `apply-fix-state --set-fix` and lands a `graph: enter fix-interrupt on <id>` commit on `main` (a wasted graph write), and
2. consumes attempt 1 of the 3-attempt fix cap (`FIX_ATTEMPT_CAP`, `graph-select-target:465`), against a CI result that is about **pre-merge** code — the red is very likely an artifact of the branch not carrying `origin/main`.

Only downstream does the conflict surface: `dispatch-graph-execute` provisions the worktree, `provision-node-worktree` exits 11 (merge-conflict), and case 11 (`dispatch-graph-execute:255-320`) kicks `/dispatch-conflict` Lane 3. The fix write and the burned attempt were pure waste.

The correct ordering already exists elsewhere in the codebase and is ratified doctrine. `reviewStallRoute` (`packages/intentionsutil/src/transitions.ts:272-276`, documented at `:246-270`) is the reviewed-node stall-recovery route and states it verbatim: *"`CONFLICTING` takes precedence over `failing` when both hold: the fix lane would have to merge origin/main to even run, so the conflict must clear first."* Its doc comment even names `_gate_maybe_interrupt` as the gate it is compensating for (`transitions.ts:242-244`). The author ratified conflict-outranks-CI-failed as doctrine in the 2026-07-29 `/align-strategy` interview.

**Intended outcome:** a `CONFLICTING` PR at an interruptible ladder phase never enters the fix interrupt. The selector declines the write, emits the node at its real ladder phase, and provisioning's exit 11 routes it to the conflict lane — zero graph writes, zero attempts burned, and the CI verdict is re-read against post-merge code once the conflict clears.

### Greenfield design (lead), and what this tactic delivers

**Greenfield.** There is exactly ONE ordered routing cascade over the four selection sensors — `merged`, `mergeable`, `ci`, and which interrupt (if any) is already active — and it lives in one pure, offline-testable TypeScript function in `packages/intentionsutil/src/transitions.ts`. Every stage that routes (the normal ladder gate, the review-stall sweep, and the future `execution.conflict` pending-merge gate) calls that one function; no stage re-derives any part of the order in bash. This is what strategy clarification 24 (Shape B) asks for: selection/transition mechanics live in owned tsx modules, and the shell scripts stay thin composition.

Today that cascade is fragmented into **three partial, unshared expressions**:

- `fixInterrupt(phase, ci)` (`transitions.ts:112-114`) — the interruptible-phase + failing-CI half. It has **no production caller**; only tests and the `index.ts` re-export reference it.
- `reviewStallRoute(ci, mergeable)` (`transitions.ts:272-276`) — the CONFLICTING-outranks-failing half, consumed only by `reconcile-graph-review-stall:220-229`.
- an inline bash re-implementation in `_gate_maybe_interrupt` (`graph-select-target:534`) — which is the one carrying the defect.

**What this tactic delivers (the first migration step).** Rather than adding a *fourth* copy of the ordering as a one-line bash `[[ ... == CONFLICTING ]]` guard — which would fix the symptom while deepening exactly the fragmentation the rationale complains about — this tactic collapses the two TS halves into a single `interruptRoute(phase, ci, mergeable)` and makes the bash selector its first consumer, using the `node --import tsx/esm -e` idiom `reconcile-graph-review-stall:220-229` already established in this same script family. After this lands, the precedence rule has exactly one home and two consumers.

**What is deliberately deferred** (recorded in the strategy as the full one-ordered-cascade unification, sequenced after this tactic and its siblings):

- The `merged` / active-interrupt / attempt-cap arms stay where they are (`_gate_fix_active`, `graph-select-target:550-601`) — they are not folded into `interruptRoute`.
- No `execution.conflict` state is introduced. That is `tactic-graph-router-conflict-routing`'s scope (status codified, phase implement); this tactic must not touch it.
- `_gate_fix_active` stays conflict-blind: a node that entered `fix` **before** the conflict appeared keeps retrying. Provisioning exit 11 still routes it to the conflict lane, so it is not stranded. Fixing the retry side is out of scope here.

---

## Unit 1 — One ordered cascade in `transitions.ts`

**Recommended model:** sonnet

**Dependencies:** none.

### Scope

Files that change:

- `packages/intentionsutil/src/transitions.ts`
- `packages/intentionsutil/src/index.ts`
- `packages/intentionsutil/test/transitions.test.ts`

**1a. Add `InterruptRoute` and `interruptRoute`.** Insert immediately after `reviewStallRoute` (`packages/intentionsutil/src/transitions.ts:272-276`), reusing the existing `ReviewStallRoute` union at `:232`:

```ts
export type InterruptRoute = "fix" | "conflict" | null;
```

and make the existing alias non-breaking:

```ts
export type ReviewStallRoute = InterruptRoute;   // replaces the literal union at :232
```

Then the cascade:

```ts
export function interruptRoute(
  phase: string,
  ci: CiVerdict,
  mergeable: Mergeable,
): InterruptRoute {
  if (mergeable === "CONFLICTING") return "conflict";
  if (fixInterrupt(phase, ci)) return "fix";
  return null;
}
```

Existing types to reuse verbatim, all already in this file: `CiVerdict = "passing" | "failing" | "unknown"` (`:47`), `Mergeable = "MERGEABLE" | "CONFLICTING" | "UNKNOWN"` (`:220`), `fixInterrupt` (`:112-114`), `FIX_INTERRUPTIBLE = new Set(["implement","qa","review"])` (`:98`).

Doc comment requirements (this is the load-bearing part of the unit — the function's value is that it is the single documented home):

- State that this is the ONE ordered cascade over `(mergeable, ci)` for entering an interrupt, consumed by both the normal selection gate (`graph-select-target`'s `_gate_maybe_interrupt`) and the review-stall sweep (`reconcile-graph-review-stall`).
- Carry forward the *why* already written at `transitions.ts:246-270` rather than restating it: cross-reference it, and add the normal-path reason — entering `execution.fix` on a `CONFLICTING` PR spends a graph write plus one of `FIX_ATTEMPT_CAP` attempts on a CI verdict that describes pre-merge code, while the fix lane cannot even run until the conflict clears.
- State that `UNKNOWN` mergeability is deliberately NOT a conflict: GitHub computes mergeability asynchronously and self-heals on a later tick (same posture `dispatch-ci-ready:73-76` and `reviewStallRoute` already take). Treating `UNKNOWN` as CONFLICTING would suppress every fix interrupt during GitHub's compute window.
- State that a `null` return means "no interrupt is due", and that the shell caller may cheaply pre-filter on `ci === "failing" || mergeable === "CONFLICTING"` because those are the only two conditions that can produce a non-null route — a superset invariant pinned by the test in 1c.

**1b. Delegate `reviewStallRoute`.** Rewrite its body — and ONLY its body — to:

```ts
export function reviewStallRoute(ci: CiVerdict, mergeable: Mergeable): ReviewStallRoute {
  return interruptRoute("review", ci, mergeable);
}
```

This is provably behavior-preserving: `"review"` is a member of `FIX_INTERRUPTIBLE`, so `fixInterrupt("review", ci)` reduces to `ci === "failing"`, which is the exact test the old body used. Its doc comment at `:236-271` stays; append one line noting the ordering now lives in `interruptRoute`. **Do not modify the existing `reviewStallRoute` tests** (`packages/intentionsutil/test/transitions.test.ts:200-231`) — them staying green unedited IS the no-behavior-change proof. Do not touch its call site `reconcile-graph-review-stall:220-229`.

**1c. Tests.** Add a `describe("interruptRoute", ...)` block in `packages/intentionsutil/test/transitions.test.ts` next to the existing `describe("reviewStallRoute", ...)` at `:200`, and add `interruptRoute` to the import list at `:3-20`. Required cases:

- `interruptRoute("implement", "failing", "CONFLICTING") === "conflict"` — the defect case, at each of `implement`, `qa`, `review`.
- `interruptRoute("<phase>", "failing", "MERGEABLE") === "fix"` and `... "UNKNOWN") === "fix"` for each interruptible phase.
- `interruptRoute("<phase>", "passing"|"unknown", "CONFLICTING") === "conflict"` — conflict routes regardless of CI.
- `interruptRoute("<phase>", "passing"|"unknown", "MERGEABLE"|"UNKNOWN") === null`.
- Non-interruptible phase (`"done"`, `"main-qa"`): `failing` + `MERGEABLE` → `null`, but `CONFLICTING` still → `"conflict"` (the conflict arm is phase-independent by construction; assert the actual behavior so it is documented rather than accidental).
- **Superset invariant** (guards the shell pre-filter in Unit 2): for every combination of phase in `["implement","qa","review","done"]` and `ci` in `["passing","unknown"]` and `mergeable` in `["MERGEABLE","UNKNOWN"]`, assert `interruptRoute(...) === null`. Name the test so a future reader knows the bash cost-guard depends on it, e.g. `"returns null whenever neither a failing verdict nor CONFLICTING holds (the shell pre-filter's superset invariant)"`.

**1d. Export.** Add `interruptRoute` to the `from "./transitions.js"` value export block in `packages/intentionsutil/src/index.ts:24-45` (alongside `fixInterrupt` at `:31`), and `InterruptRoute` to the `export type { CiVerdict, TransitionDecision, ScopeStamp }` line at `:46`.

### Out of scope for Unit 1

- No change to `fixInterrupt`'s signature or behavior; no change to `FIX_INTERRUPTIBLE`.
- No `execution.conflict` field, no `ConflictState`, no `apply-conflict-state.ts` — that is `tactic-graph-router-conflict-routing`.
- No change to `decideTransition`, `router.ts`, or `check-node-selection.ts`.

---

## Unit 2 — Selector consumes the cascade, plus its hermetic tests

**Recommended model:** opus

**Dependencies:** Unit 1 (the selector imports `interruptRoute`).

### Scope

Files that change:

- `.claude/skills/dispatch-propagate/scripts/graph-select-target`
- `.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh`

Behavior change, stated precisely: at ladder phases `implement` / `qa` / `review` with no active interrupt, a PR whose `mergeable` is `CONFLICTING` no longer enters the fix interrupt — no `apply-fix-state --set-fix`, no `graph-commit`, no attempt consumed. The node is emitted at its ladder phase and reaches the conflict lane through the existing `provision-node-worktree` exit-11 → `dispatch-graph-execute` case-11 path.

**2a. `_read_pr_ci` — capture `mergeable` off the existing fetch** (`.claude/skills/dispatch-propagate/scripts/graph-select-target:511-522`).

Add a `_CI_MERGEABLE` global: reset it on the same line as the other three at `:515`, and populate it from the SAME `$pv` object already in hand:

```bash
_CI_MERGEABLE=$(jq -r '.mergeable // empty' <<<"$pv" 2>/dev/null)
```

`gh_pr_view_rest` (`.claude/skills/dispatch-propagate/scripts/lib.sh:1097-1147`) already projects `.mergeable` into `MERGEABLE` / `CONFLICTING` / `UNKNOWN` at `:1131-1135`. **This is a new field read off an existing REST call — no extra `gh` round-trip.** Update the function's header comment (`:511-512`) to list the fourth global.

> **Merge-order caution — read before editing.** `tactic-graph-router-conflict-routing` (status codified, phase implement, in flight) plans the *identical* `_CI_MERGEABLE` addition to `_read_pr_ci` (see `intentions/tactic-graph-router-conflict-routing.md:401-405`). If that work has already landed on `origin/main` when this unit runs, **reuse the existing global — do not add a second one**, and skip 2a entirely. Check first with `grep -n '_CI_MERGEABLE' .claude/skills/dispatch-propagate/scripts/graph-select-target`.

**2b. `_gate_maybe_interrupt` — take the phase, route through `interruptRoute`** (`graph-select-target:526-544`).

Change the signature to `_gate_maybe_interrupt <id> <pr> <phase>` and update both call sites in `sensor_gate`: the `implement)` arm at `:611-618` and the `qa|review)` arm at `:620-627`, each becoming `_gate_maybe_interrupt "$id" "$pr" "$phase"`. Keep the existing `case $? in 0) ... 3) ... esac` handling in both arms unchanged.

Replace the single `[[ "$_CI_VERDICT" == "failing" ]] || return 1` test at `:534` with:

```bash
  # Cost guard, NOT the routing rule: interruptRoute returns null unless CI is
  # failing or the PR is CONFLICTING, so skip the node subprocess when neither
  # holds (the overwhelmingly common case — one boot per red-or-conflicted
  # candidate per tick instead of one per candidate). This condition MUST stay a
  # superset of interruptRoute's non-null conditions; the transitions.test.ts
  # case named "the shell pre-filter's superset invariant" pins that.
  if [[ "$_CI_VERDICT" != "failing" && "$_CI_MERGEABLE" != "CONFLICTING" ]]; then
    return 1
  fi

  # Validate at the shell/TypeScript edge before crossing it — interruptRoute
  # takes closed unions, so an unexpected value would silently route to `null`
  # (mirrors reconcile-graph-review-stall:200-218's posture on the same fields).
  case "$_CI_MERGEABLE" in
    MERGEABLE|CONFLICTING|UNKNOWN) ;;
    *)
      echo "graph-select-target: unexpected .mergeable '$_CI_MERGEABLE' from gh_pr_view_rest #$pr for $id (projection changed?)" >&2
      echo "mergeable-unreadable"; return 3 ;;
  esac
  # dispatch_ci_verdict_rest emits passing|failing|PENDING; CiVerdict's third
  # member is "unknown". Normalize, exactly as reconcile-graph-review-stall:214-218 does.
  local verdict
  case "$_CI_VERDICT" in
    passing|failing) verdict="$_CI_VERDICT" ;;
    *) verdict="unknown" ;;
  esac

  local route
  route=$( (cd "$REPO_ROOT" && node --import tsx/esm -e '
    const { interruptRoute } = await import("./packages/intentionsutil/src/transitions.js");
    process.stdout.write(String(interruptRoute(process.argv[1], process.argv[2], process.argv[3])));
  ' "$phase" "$verdict" "$_CI_MERGEABLE") ) || {
    echo "graph-select-target: interruptRoute eval failed for $id (pr #$pr)" >&2
    echo "route-eval-failed"; return 3
  }

  case "$route" in
    conflict)
      # Conflict outranks failing CI (transitions.ts, interruptRoute). DECLINE the
      # interrupt: no execution.fix write, no graph-commit, no attempt burned. The
      # candidate falls through to its phase's normal gate and is emitted at its
      # ladder phase; provision-node-worktree exit 11 -> dispatch-graph-execute
      # case 11 routes it to /dispatch-conflict Lane 3, which is the only lane
      # that actually resolves the conflict.
      #
      # STDERR ONLY. An rc-1 return falls through to the caller's own
      # `echo "$phase"`, and sensor_gate's stdout is captured whole as the emitted
      # phase — anything printed to stdout here corrupts the selection line.
      echo "graph-select-target: $id PR #$pr is CONFLICTING; conflict outranks failing CI — declining the fix interrupt (provisioning routes it to the conflict lane)" >&2
      return 1 ;;
    fix) ;;                 # fall through to the interrupt write below
    *) return 1 ;;          # "null" or anything else: no interrupt is due
  esac
```

The existing write block (`:536-543`) then follows unchanged: `_apply_fix "$id" --set-fix` + `_graph_commit_fix`, `return 0` on success, `echo "fix-write-failed"; return 3` otherwise.

Update the function header comment (`:526-530`) to document the new rc/route semantics and the stdout-vs-stderr rule. Also update the script's top-of-file spec comment (`graph-select-target:23-30`, "The ONE exception is the CI-fix interrupt…") to record that a `CONFLICTING` PR is now excluded from that exception.

`REPO_ROOT` is already defined at `graph-select-target:145` (derived from `SCRIPT_DIR/../../../..`) — reuse it, do not recompute.

**2c. Tests — extend `test-graph-select-target.sh`.**

`graph-select-target` is **not** among the scripts `dispatch-test-fixture.sh`'s `setup()` copies, so its tests build a throwaway git repo and copy the script in physically (`REPO_ROOT` is derived from the script's real on-disk location, so a symlink resolves back out of the fixture). Follow the existing from-scratch pattern at `.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh:33-90`, and factor it into a `gsc_interrupt_setup` / `gsc_interrupt_teardown` pair in the style of `gsc_standalone_setup` at `:103-172` so each case gets a fresh fixture. Append the new block before the `# <<< END MOVED <<<` marker at `:648`.

Fixture composition (all hermetic — no network, no real `node`, no real `gh`):

- Real git repo + bare origin with an `intentions/` tree, `main` checked out at the fixture root (copy `:52-63` verbatim).
- Physical copies of `graph-select-target`, `lib.sh`, and `lib-*.sh` into `<root>/.claude/skills/dispatch-propagate/scripts/`.
- Fake `npx` on PATH emitting one candidate **with a `pr`**, e.g.
  `{"candidates":[{"id":"tactic-fixture","kind":"tactic","phase":"implement","pr":"2999","pace_exempt":false}],"events":[]}`.
  It must ALSO handle the `apply-fix-state.ts` invocation `_apply_fix` makes (`graph-select-target:449-453` runs `npx tsx …/apply-fix-state.ts`): when argv contains `apply-fix-state`, append the full argv to `<root>/apply-fix-calls.log`, print `{}`, exit 0. The presence/absence of that log is the load-bearing assertion.
- Fake `claude` reading `<root>/claude-payload.json`, seeded `[]` (copy `:64-71`).
- Fake `gh` on PATH serving two REST shapes off files the case writes, so `gh_pr_view_rest` and `dispatch_ci_verdict_rest` both work offline:
  - `gh api repos/*/pulls/2999` → `cat <root>/pr-2999.json`, the RAW REST shape (`gh_pr_view_rest` does its own `jq` projection): `{"number":2999,"state":"open","merged_at":null,"merge_commit_sha":null,"mergeable":false,"mergeable_state":"dirty","title":"t","body":"","head":{"sha":"deadbee","ref":"tactic-fixture"},"labels":[]}`. Use `"mergeable":false` for CONFLICTING, `true` for MERGEABLE, `null` for UNKNOWN. This exact shape is mirrored from the byte-compat fixtures at `.claude/skills/dispatch-propagate/scripts/test-lib-gh-rest.sh:618-670`. **Do not** use `make_pr_mergeable` (`dispatch-test-fixture.sh:1443-1461`) — that builds the `pr list` porcelain shape, a different call.
  - `gh api --paginate repos/*/commits/deadbee/check-runs` → one page, e.g. `{"check_runs":[{"status":"completed","conclusion":"failure"}]}` for red, `"conclusion":"success"` for green, `{"status":"in_progress","conclusion":null}` for pending.
  - anything else → exit 1.
- Fake `node` on PATH: append `"$@"` to `<root>/node-calls.log`, then print the contents of `<root>/route.txt` (no trailing newline) and exit 0 — unless `<root>/node-fail` exists, in which case exit 1. The real ordering is unit-tested in TS (Unit 1); this seam pins that the selector *passes the right sensors and honors the returned route*, which is what bash owns.
- Executable stub at `<root>/packages/intentionsutil/scripts/graph-commit` exiting 0, so the control case's `_graph_commit_fix` (`graph-select-target:455-458`) succeeds and the case can assert the clean `fix` emission rather than `fix-write-failed`.

Required cases:

1. **Conflict declines the interrupt (the defect).** `mergeable:false` + failing check-runs + `route.txt` = `conflict`. Assert: stdout is exactly `node tactic-fixture tactic implement`; `<root>/apply-fix-calls.log` does **not** exist (no `--set-fix`, no attempt burned); stderr contains `declining the fix interrupt`.
2. **Control — red but mergeable still enters fix.** Identical fixture with `mergeable:true` and `route.txt` = `fix`. Assert: stdout is exactly `node tactic-fixture tactic fix`; `apply-fix-calls.log` exists and contains `--set-fix`. Without this case, case 1 could pass vacuously (e.g. if the gate broke entirely).
3. **Sensors reach the cascade correctly.** From case 1's fixture, assert `<root>/node-calls.log` ends with the three positional args `implement failing CONFLICTING`. Then a variant with pending check-runs (`"status":"in_progress"`) + `mergeable:false`: assert the args are `implement unknown CONFLICTING` — pinning the `pending`→`unknown` normalization, and pinning that the pre-filter lets a CONFLICTING-but-not-red candidate through to the cascade.
4. **Cost guard holds.** Green check-runs + `mergeable:true`: assert `<root>/node-calls.log` does not exist (no subprocess) and stdout is `node tactic-fixture tactic implement`.
5. **`qa` phase routes onward instead of stranding.** Candidate `"phase":"qa"`; `mergeable:false`; failing CI; `route.txt` = `conflict`. Copy `dispatch-ci-ready` into the fixture scripts dir and set `DISPATCH_PR_LIST_FILE` to a file holding `[{"number":2999,"headRefName":"tactic-fixture","isDraft":true,"headRefOid":"deadbee","labels":[],"mergeable":"CONFLICTING"}]`. Assert stdout is exactly `node tactic-fixture tactic qa` and no `apply-fix-calls.log`. This is the case that proves declining the interrupt does not park the node at `ci-pending` — `dispatch-ci-ready:73-76` short-circuits a CONFLICTING draft to `ready`, which is the premise the whole routing chain rests on.
6. **Eval failure fails safe.** Case 1's fixture plus `touch <root>/node-fail`. Assert stdout is `empty` (the sole candidate is skipped, not dispatched), no `apply-fix-calls.log`, and stderr contains `interruptRoute eval failed`.
7. **Unreadable `mergeable` fails safe.** `pr-2999.json` carrying `"mergeable":"weird-string"` (so `gh_pr_view_rest`'s `if/elif/else` maps it to `UNKNOWN`) is NOT the case to write — instead force the edge by making the fake `gh` emit a PR object whose projection yields an out-of-union value only if the projection changes, and skip this case if it cannot be provoked without stubbing `gh_pr_view_rest` itself. If it cannot be provoked hermetically, drop case 7 and instead assert the `mergeable-unreadable` branch is unreachable-by-construction in a comment naming `lib.sh:1131-1135`. Do **not** weaken any other case to compensate.

Fixture conventions to follow, already established in this file: per-case rewrite of fixture files (`:222-232`, `:322-330`), env vars passed as a command prefix rather than `export`ed (`:180-185`), and `DISPATCH_RESERVATION_DIR` / `DISPATCH_SELECTION_LOG_DIR` pointed inside the fixture root on every invocation.

### Out of scope for Unit 2

- `_gate_fix_active` (`graph-select-target:550-601`) — a node already carrying `execution.fix` is not touched. Do not add a mergeable check there.
- `_hold_node_fix_cap` / the attempt-cap ladder (`:476-509`), `reconcile-graph-review-stall`, `dispatch-graph-execute`, `provision-node-worktree` — all unchanged.
- No new `execution.*` field, no new phase value, no new selection-log event type. `skip_note` is not called on the conflict decline: the node is **selected**, not skipped, so the decline is a stderr diagnostic only.
- No change to `dispatch-ci-ready`.

---

## Reuse

- `interruptRoute` / `reviewStallRoute` / `fixInterrupt` / `CiVerdict` / `Mergeable` / `FIX_INTERRUPTIBLE` — `packages/intentionsutil/src/transitions.ts:47, 98, 112-114, 220, 232, 272-276`. Unit 1 unifies the first three; nothing new is invented.
- `gh_pr_view_rest` — `.claude/skills/dispatch-propagate/scripts/lib.sh:1097-1147`, already projecting `mergeable: MERGEABLE|CONFLICTING|UNKNOWN` at `:1131-1135`. `_read_pr_ci` already calls it, so the new sensor costs **no additional API call**.
- `dispatch_ci_verdict_rest` — `lib.sh:792-827`. Unchanged; only its `pending` third state needs normalizing at the TS edge.
- The `node --import tsx/esm -e` bash→TS bridge, including the shell-edge union validation and the `pending`→`unknown` verdict normalization — `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:200-229`. Copy this idiom; do not invent a new one.
- `_apply_fix` / `_graph_commit_fix` wrappers — `graph-select-target:449-458`. Reused unchanged for the surviving `fix` route.
- `dispatch-ci-ready`'s CONFLICTING short-circuit — `.claude/skills/dispatch-propagate/scripts/dispatch-ci-ready:73-76`. Not modified; it is the reason a declined interrupt at `qa`/`review` still emits its ladder phase instead of stalling at `ci-pending`.
- The conflict lane itself — `provision-node-worktree:44-51` (exit 11) and `dispatch-graph-execute:255-320` (case 11, kicks `/dispatch-conflict` Lane 3). Not modified; this tactic only stops burning state before that path is reached.
- From-scratch bash fixture pattern (throwaway git repo, physical script copies, fake `npx`/`claude` on PATH, per-case teardown) — `.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh:33-90` and `:103-172`.
- Raw-REST PR JSON fixture shape — `.claude/skills/dispatch-propagate/scripts/test-lib-gh-rest.sh:618-670`.
- Existing `reviewStallRoute` test block to sit beside — `packages/intentionsutil/test/transitions.test.ts:200-231`.

---

## Verification

All commands run from the worktree root.

```verify
bash -n .claude/skills/dispatch-propagate/scripts/graph-select-target
```

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
```

```verify
.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh --prose
```

The `reviewStallRoute` cases at `packages/intentionsutil/test/transitions.test.ts:200-231` must pass **unmodified** — that is the proof Unit 1b changed no behavior. If a reviewer sees those tests edited in the diff, the delegation is wrong.

Non-regression of the whole dispatch script suite (broader, slower — run once before opening the PR):

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts
```

If `--pr-scripts` is not the flag this script accepts, run it with no arguments from a worktree whose diff touches `.claude/skills/dispatch-propagate/scripts/**` — its auto-detect mode (`run-unit-tests.sh` change-detection block) turns the dispatch-script suite on from the changed-file list.

### Manual / observe-in-production

Autonomous verification stops at the seam: the bash tests use a fake `node`, so the end-to-end chain (real `interruptRoute` → real selector → real `provision-node-worktree` exit 11 → `/dispatch-conflict`) is only exercised on a live conflicted node. After merge, the first time a tactic's PR goes both red and `CONFLICTING`:

- `git log --oneline origin/main -- intentions/<id>.md` shows **no** `graph: enter fix-interrupt on <id>` commit for that episode.
- The tick journal / selector stderr carries the `conflict outranks failing CI — declining the fix interrupt` line naming that node and PR.
- The node's `execution.fix` stays `null` and the node reaches `/dispatch-conflict` Lane 3 rather than `/fix-checks`.
- After the conflict resolves and CI is re-read against post-merge code, a genuinely red PR still enters the interrupt normally (the case-2 control's behavior, in production).

A judgment call left to the reviewer, not to the implementer: whether the per-candidate `node --import tsx/esm` boot in the selection hot path is acceptable in practice. The pre-filter bounds it to red-or-conflicted candidates only, but if tick latency regresses noticeably, the fallback is to inline the two-branch cascade in bash and file a follow-up tactic to re-unify — do not silently drop the `CONFLICTING` check.
