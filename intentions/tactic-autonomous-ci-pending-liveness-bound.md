---
id: tactic-autonomous-ci-pending-liveness-bound
kind: tactic
statement: Bound pending CI on the autonomous dispatch path — a node whose
  checks never start or whose run is cancelled currently stalls forever with no
  counter, no hold, no park and no operator surface
owner: ai
status: codified
parent: null
rationale: "Byproduct of the 2026-07-29 /align-strategy dispatch-containment
  interview. Verified absence at recording time: graph-select-target:628 skips
  as 'ci-pending' with no counter; provision-node-worktree:138 exits 10
  'waiting' with no counter; reconcile-graph-review-stall maps pending to an
  unknown verdict and no-ops; lib.sh:697-701 classifies an EMPTY rollup (checks
  never started) as pending. A grep of every tick script for
  timeout/stale/since/age/elapsed on a pending verdict returns nothing. This is
  the only stuck state with no cap, against CONFLICT_STRIKE_CAP=5 and
  FIX_ATTEMPT_CAP=3. Explicitly NOT covered by the terminal trichotomy: a
  tick-level skip spawns no session and declares nothing. Adjacent
  tactic-dispatch-explicit-ci-wait covers the explicit-node lane and expressly
  leaves the autonomous path unchanged, so it does not close this. (Narrowed
  2026-07-31 /align-tactics tactic-mode round: the 'or whose run is cancelled'
  clause above overstates the gap — dispatch_classify_rollup already maps a
  CANCELLED check-run conclusion to 'failing', not 'pending' (lib.sh:712), so a
  cancelled run is already actionable through the existing fix-interrupt path
  and bounded by FIX_ATTEMPT_CAP=3. The genuinely unbounded case is narrower: an
  EMPTY statusCheckRollup, or a run that stays in-progress indefinitely, both
  classified 'pending' with no time dimension. See the strategy's dated
  clarifications for the full derivation.) Plan lands a SHA-keyed sidecar strike
  counter (DISPATCH_CI_PENDING_STRIKE_CAP=8 consecutive tick observations,
  mirroring CONFLICT_STRIKE_CAP/FIX_ATTEMPT_CAP) at both stall surfaces
  (graph-select-target's selection gate and reconcile-graph-review-stall's
  review-stall sweep), escalating at cap to a new tracked hold-node kind
  (ci-pending-stalled) — the operator surface the tactic's statement says is
  missing. provision-node-worktree's exit 10 is deliberately left uncounted (an
  intra-tick race already covered by the selection-gate counter's sustained
  form), and the explicit-node (--node) lane is deliberately excluded (owned by
  the separate tactic-dispatch-explicit-ci-wait)."
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
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 20
---
# Bound pending CI on the autonomous dispatch path — a node whose checks never start or whose run is cancelled currently stalls forever with no counter, no hold, no park and no operator surface

## Context

The autonomous dispatch tick (`dispatch-tick` → `dispatch-select-tick`, systemd
`OnCalendar=*:0/15`, i.e. every 15 minutes) has a cap-and-escalate convention for
every mechanical stuck state *except one*: a graph-native tactic whose draft PR's
CI never reaches a verdict.

Two independent surfaces observe that state every tick and both do nothing but skip:

1. **Selection** — `.claude/skills/dispatch-propagate/scripts/graph-select-target:639-644`.
   In `sensor_gate`'s `qa|review` arm, `dispatch-ci-ready` exits 1 and the gate does
   `echo "ci-pending"; return 1`. The outer loop (`graph-select-target:694-700` area)
   records a `skip_note` and `continue`s. No counter, no timestamp, no graph write,
   no bound. It repeats forever.
2. **Review-stall sweep** — `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:214-217`.
   A tactic at `phase: review` carrying the `reviewed` marker is excluded from
   selection entirely (router.ts's `REVIEWED_MARKER` exclusion), so surface 1 never
   sees it again. This sweep is its only observer, and it folds a `pending` verdict
   into `VERDICT="unknown"`, which `reviewStallRoute` (`packages/intentionsutil/src/transitions.ts:284-288`)
   maps to `null` — a silent no-op, forever. Such a node has an *armed auto-merge*
   that can never fire.

The root cause of a perpetual `pending` is `dispatch_classify_rollup`
(`.claude/skills/dispatch-propagate/scripts/lib.sh:692-701`): an **empty**
statusCheckRollup — checks that never started — classifies identically to
checks still running. There is no "never started" signal and no time dimension
anywhere in the classification layer.

Contrast the two existing bounds this codebase already uses for mechanical
stuck states:

- `CONFLICT_STRIKE_CAP=5` (`.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:145`)
  — a per-node **sidecar file** counter outside every checkout
  (`$PROJECT_ROOT/.claude/worktrees/<id>.conflict-strikes`, written at :289/:320-340),
  deliberately fail-open, escalating to `hold-node` at cap (:340-370).
- `FIX_ATTEMPT_CAP=3` (`packages/intentionsutil/src/transitions.ts:101`, mirrored at
  `graph-select-target:465`) — a graph-state counter escalating to
  `hold-node --kind fix-attempt-cap` via `_hold_node_fix_cap` (`graph-select-target:476-509`).

**Intended outcome.** Pending CI stops being the one unbounded stuck state: a
node whose checks stay pending on the *same head SHA* for `DISPATCH_CI_PENDING_STRIKE_CAP`
consecutive observations lands a tracked hold (a born-parked hold tactic + a
`blocked_by` edge on the source, via the existing `hold-node` primitive), which
is both the bound *and* the operator surface the tactic's statement says is missing.

### Design decisions this plan fixes (do not re-litigate at implementation time)

**(a) Counter storage: a sidecar file, not graph state.** Greenfield-ideal here is
the sidecar, and it is also what the closest precedent chose for exactly stated
reasons (`dispatch-graph-execute:137-145`: ticks are frequent and cheap, so the
free retry tier should spend ticks, not graph records). A per-tick graph write
per pending node would cost a `graph-commit` (which can block on the global
landing lock for up to `LOCK_WAIT_SECONDS`, 1050s) against a caller whose lock
heartbeat budget is 300s. Losing the sidecar (daemon restart, reaped worktree)
grants extra free retries and is harmless — it is never a graph write. The only
durable record is the hold, which is the correct durable record. Do **not** add
a field to `Execution`/`FixState` (`packages/intentionsutil/src/schema.ts:392-444`)
and do **not** key off `execution.attempts`.

**(b) SHA-keyed, not lifetime.** The sidecar stores `<head-sha> <count>`. When the
observed head SHA differs from the recorded one, the count resets to 1 — a fresh
push legitimately restarts CI and deserves a fresh budget. This is what makes the
bound mean "this *one* CI run never concluded" rather than "this node has been
pending a lot over its life".

**(c) A new hold kind `ci-pending-stalled` (slug `ci-stalled`), NOT the reserved
`no-progress` slug.** `hold-node-decide.ts:57-61` reserves `no-progress` for "a
different tactic's future per-node **no-progress fuse**" — a general, any-phase
fuse. This tactic is a specific, single-cause bound on one sensor's verdict.
Claiming the general slug for the specific cause would make the eventual general
fuse unnameable and would make `tactic-hold-no-progress-<source>` ambiguous
between two producers. Mint `ci-pending-stalled` → slug `ci-stalled` → hold id
`tactic-hold-ci-stalled-<source-without-tactic->`, and leave `no-progress` reserved.

**(d) `provision-node-worktree` exit 10 is deliberately NOT separately counted.**
`provision-node-worktree:372-384` exits 10 (`ci-waiting`) and `dispatch-graph-execute`
prints `waiting <id>`. That path is only reachable when the selector's own
ci-ready gate *passed* earlier in the same tick and CI went pending between
selection and provision — an inherently transient intra-tick race. On the next
tick the node is observed by surface 1 and counted there. Adding a second,
independent counter for a state whose sustained form is already counted would
double-count and could hold at half the intended budget. Unit 2 records this
reasoning as a comment at the exit-10 handler so a future reader does not "fix"
the apparent gap.

**(e) The explicit-node lane (`--node`) is excluded from counting.** The tactic's
scope is the *autonomous* path. `tactic-dispatch-explicit-ci-wait` owns the
explicit lane and chose a different mechanism (a bounded in-session wait against
`DISPATCH_RESERVATION_STANDALONE_TTL_S`). A human running `dispatch <node-id>`
repeatedly must not burn the autonomous strike budget.

**(f) A cancelled CI run is already bounded and is out of scope.** `CANCELLED`
maps to `failing` in `dispatch_classify_rollup` (`lib.sh:712-721`, the failing-conclusions
jq branch), so a cancelled run already routes through the existing fix-interrupt
ladder and `FIX_ATTEMPT_CAP`. The tactic statement's "or whose run is cancelled"
clause describes a case the code already handles. This plan bounds the genuinely
unbounded case: an empty or perpetually-in-progress rollup. This narrowing is a
deliberate, evidence-backed scope decision, not a drop.

---

## Unit 1 — Register the `ci-pending-stalled` hold kind

### Scope

Extend the central hold-kind vocabulary with a fourth kind. This is purely the
vocabulary/CLI surface; no producer is wired here (Units 2 and 3 do that).

**Files that change:**

> **Locate every anchor below by construct, not by line number.** This unit's scope was
> written before the hold-kind vocabulary was extracted out of `hold-node-decide.ts`, so
> its original line numbers are pre-extraction — one of them, `:310-315`, is past the end
> of a file that is now 290 lines. The `## Re-landing brief` below records the move in
> full. Where a number survives here it was re-measured 2026-08-30 and is given only as a
> hint.

- `packages/intentionsutil/src/holds.ts` — **the hold-kind vocabulary lives here now**,
  not in `hold-node-decide.ts`, which only imports and re-exports it. Measured
  2026-08-30: 132 lines, `HOLD_KINDS` `:36`, `KIND_SLUGS` `:44`,
  `RESERVED_KIND_SLUGS` `:60`.
  - `HOLD_KINDS` — append `"ci-pending-stalled"`.
  - `KIND_SLUGS` — add `"ci-pending-stalled": "ci-stalled"`.
  - The `HOLD_KINDS` doc comment — add a `ci-stalled` bullet in the same
    style as the existing three, stating: the autonomous tick observed the node's
    draft-PR CI verdict as `pending` on the SAME head SHA for
    `DISPATCH_CI_PENDING_STRIKE_CAP` consecutive observations (checks never started,
    or a run that never concluded). Unlike `worktree-residue` it DOES have a
    plausible self-heal (checks may still start), so it sits behind a strike ladder
    rather than escalating on first occurrence. IMPLEMENTED.
  - The reserved-slug paragraph for `no-progress` (`RESERVED_KIND_SLUGS`, also in
    `holds.ts`) — leave the reservation
    intact and add one sentence recording that `ci-stalled` was minted separately
    rather than claiming it, and why (decision (c) above).
- `packages/intentionsutil/scripts/hold-node-decide.ts` — no vocabulary here any more;
  only these two:
  - `parseArgs`'s two `--kind` failure strings — the invalid-value one already
    interpolates `HOLD_KINDS.join("|")`; the *missing*-value one hardcodes the
    three-kind list and must be updated (prefer interpolating `HOLD_KINDS.join("|")`
    there too, so it can never drift again).
  - The `Usage:` block in the file header.
- `packages/intentionsutil/scripts/hold-node`
  - The header usage line and the `USAGE` string — add the new kind. (Re-measured
    2026-08-30: `USAGE` is at `:70`, not the `:64` this plan used to cite.)
    `hold-node` does not itself validate the kind (it forwards to
    `hold-node-decide.ts`), so no validation logic changes.
- `packages/intentionsutil/scripts/resolve-hold`
  - The header usage comment and the `USAGE` string — add the new kind. (Re-measured
    2026-08-30: `USAGE` is at `:122`, not `:109`.) The `--kind` default stays
    `provision-conflict`. `resolve-hold` derives the hold id through
    `hold-node-decide.ts`, so no slug map is duplicated there. Note that
    `resolve-hold`'s own header comment still cites `KIND_SLUGS` as
    `hold-node-decide.ts:57-60` — that is the pre-extraction location, and the map is
    now in `src/holds.ts`. Correcting that comment is out of scope here.
- `packages/intentionsutil/test/hold-node-decide.test.ts` — add cases mirroring the
  existing `hold_kind` assertions at `:110`, `:153`, `:162`:
  - `holdIdFor("ci-pending-stalled", "tactic-foo")` === `"tactic-hold-ci-stalled-foo"`.
  - `decideHold` with `kind: "ci-pending-stalled"` on a fresh source yields
    `disposition: "NONE"`, `attributes.hold_kind === "ci-pending-stalled"`,
    `attributes.hold_for === <source>`, `source_edge_needed: true`, and a body
    containing `RESOLUTION_SENTENCE`.
  - `RESERVED_KIND_SLUGS` still contains `"no-progress"` and `KIND_SLUGS` does NOT
    map any kind to `"no-progress"` (pins decision (c)).

**Out of scope:** any producer wiring; `.claude/skills/dispatch-conflict/SKILL.md`
(its hold-kind mentions are about which kinds route to the conflict lane —
`ci-pending-stalled` does not, so nothing there changes); any change to
`hold-node`'s landing logic, CAS tokens, or `graph-commit` call.

### Recommended model

sonnet

---

## Unit 2 — Bound the selection surface (`graph-select-target`)

### Scope

Add the shared strike-counter helper and wire the selector's `ci-pending` arm to it.

**A. New shared helper + cap in `.claude/skills/dispatch-propagate/scripts/lib.sh`.**
Insert immediately after `dispatch_ci_verdict_rest` (which ends around `:820`), so
the CI-verdict helpers stay together. `lib.sh` is reachable from both call sites
(`graph-select-target` gets it transitively via `lib-reservation-ledger.sh:263`;
`reconcile-graph-review-stall` sources it directly at its `:81`).

```
# Consecutive-observation cap for a draft PR whose CI verdict stays `pending`
# on the SAME head SHA. A baked-in constant, deliberately NOT a dispatch.config
# tunable — parity with CONFLICT_STRIKE_CAP (dispatch-graph-execute:145) and
# FIX_ATTEMPT_CAP (packages/intentionsutil/src/transitions.ts:101). The tick
# fires every 15 minutes (OnCalendar=*:0/15, lib.sh:3082), so 8 consecutive
# observations is ~2 hours of a single CI run never concluding — far past any
# legitimate run in this repo, and cheap because every observation below the
# cap is a file write, never a graph record.
DISPATCH_CI_PENDING_STRIKE_CAP=8
```

Two functions, both fail-open and both making zero graph writes:

- `ci_pending_strike_bump <main-root> <node-id> <head-sha>` — reads
  `<main-root>/.claude/worktrees/<node-id>.ci-pending-strikes`, whose content is a
  single line `<sha> <count>`. If the file is absent, unparseable, or its recorded
  SHA differs from `<head-sha>`, the count resets to 1; otherwise it increments.
  Writes the file back and prints the new count on stdout. Returns 1 without
  writing when `<head-sha>` is empty (an unreadable PR must not be counted).
  Validate `<count>` with `[[ "$c" =~ ^[0-9]+$ ]] || c=0` before any `(( ))`
  context — same defensive shape as `dispatch-graph-execute:330` and
  `reconcile-graph-review-stall:91-95` (bash arithmetic evaluates array-index
  command substitution, so an untrusted file value must be checked as a literal
  integer first).
- `ci_pending_strike_clear <main-root> <node-id>` — `rm -f` the sidecar; always
  returns 0.

Document above both: the sidecar lives OUTSIDE every checkout, next to (not
inside) the node's worktree — the same convention as `.conflict-strikes`
(`dispatch-graph-execute:289`) and `.scope-fingerprint`
(`provision-node-worktree`, see `dispatch-graph-scope-sweep:42`) — so it never
dirties a tree and never trips `graph-commit`'s `assert_clean_outside_ids`.

**B. `.claude/skills/dispatch-propagate/scripts/graph-select-target`.**

1. Add `_hold_node_ci_pending() { id; pr; strikes; sha; }` modelled line-for-line
   on `_hold_node_fix_cap` (`:476-509`): `mktemp -d`, write a reason file and a
   recommendation file, invoke
   `( cd "$NATIVE_ROOT" && packages/intentionsutil/scripts/hold-node "$id" --kind ci-pending-stalled --reason-file … --recommendation-file … ) >/dev/null 2>&1`,
   `rm -rf` the tmpdir, return `hold-node`'s rc.
   - **The `>/dev/null 2>&1` redirect is load-bearing**: `sensor_gate` is invoked in
     a command substitution (`emit_phase=$(sensor_gate …)` at `graph-select-target:695`),
     so any stray stdout from `hold-node` would be parsed as the emitted phase.
     `_hold_node_fix_cap:507` does exactly this for the same reason.
   - No `--reset-fix-attempt` — this hold has nothing to do with the fix ladder.
   - Reason text (single paragraph): this tactic's draft PR #`<pr>` has reported a
     `pending` CI verdict on head SHA `<sha>` for `<strikes>` consecutive autonomous
     ticks (~`<strikes*15>` minutes); its checks either never started (an empty
     status-check rollup) or started and never concluded, so no phase worker can be
     launched and no verdict can ever arrive on its own.
   - Recommendation text: inspect the PR's Checks tab; if no workflow run exists,
     re-trigger it (close/reopen the PR, or push an empty commit to the node's
     branch) — a new head SHA also resets the strike counter; if a run is stuck or
     was cancelled by a queue/runner problem, re-run it. Then resolve THIS HOLD
     TACTIC to `phase: done` and prune it — clearing `office_hours` alone does not
     unblock the source.

2. Rework the `qa|review` arm (`:628-645`) to read the PR JSON **once** and derive
   both fields from it, adding no REST call:

   - Replace the `merged_at=$(gh_pr_view_rest "$pr" … | jq -r '.mergedAt // empty')`
     pipeline at `:636` with `pv=$(gh_pr_view_rest "$pr" 2>/dev/null)` and derive
     `merged_at=$(jq -r '.mergedAt // empty' <<<"$pv")` and
     `head_sha=$(jq -r '.headRefOid // empty' <<<"$pv")`. Keep the existing
     read-failure semantics exactly: a failed read falls through to the CI check
     rather than misclassifying (`:634-635`), and in that case `head_sha` is empty.
     **Use `<<<"$pv"`, never `echo "$pv" | jq`** — see `.claude/rules/shell-json.md`.
     Do NOT reuse the `_CI_HEAD` global that `_gate_maybe_interrupt`/`_read_pr_ci`
     set: `_gate_maybe_interrupt:583` returns early on a null PR *before*
     `_read_pr_ci` resets the globals, so `_CI_HEAD` can hold a stale value from a
     previous candidate.

   - In the `case "$rc"` block at `:641-645`:
     - `0)` — before `echo "$phase"; return 0`, call
       `ci_pending_strike_clear "$NATIVE_ROOT" "$id"` (CI concluded; the ladder is
       cleared so the count always means *consecutive* observations, mirroring
       `dispatch-graph-execute:230-235`).
     - `1)` — the bounded arm. Skip counting entirely when `-n "$NODE_TARGET"`
       (decision (e)) or when `head_sha` is empty (unreadable PR — fail open), and
       in those cases keep today's behaviour verbatim (`echo "ci-pending"; return 1`).
       Otherwise `strikes=$(ci_pending_strike_bump "$NATIVE_ROOT" "$id" "$head_sha")`.
       If `(( strikes < DISPATCH_CI_PENDING_STRIKE_CAP ))`, emit
       `ci-pending (strike <n>/<cap>)` as the skip reason and `return 1`. At or above
       the cap, call `_hold_node_ci_pending`; on success
       `ci_pending_strike_clear` and emit skip reason `ci-pending-cap-held`; on
       failure emit `ci-pending-hold-failed` and `return 1` **without** clearing the
       sidecar (so the next tick retries the hold — the same posture
       `graph-select-target:499-503` and `dispatch-graph-execute:363-368` take).
     - `*)` — unchanged.

   All skip reasons flow into `skip_note` (`:436-439`) and the selection log, which
   is where an operator sees the strike count accrue before the hold lands.

3. Update the script's header comment block (`:20-42`, the paragraph enumerating the
   graph writes selection makes) to name the new hold producer alongside the
   fix-attempt-cap one.

**C. `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute`, exit-10 arm
(`:250` area).** Comment only — no behaviour change. Record decision (d): exit 10 is
an intra-tick race (the selector's ci-ready gate passed moments earlier), the
sustained form of the same state is counted at
`graph-select-target`'s `ci-pending` arm against `DISPATCH_CI_PENDING_STRIKE_CAP`,
and a second independent counter here would double-count and hold at half the
intended budget.

**D. Tests — `.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh`.**
Extend the existing fixture pattern (a real git repo with the script and every
`lib*.sh` **physically copied** in — `graph-select-target` derives `REPO_ROOT` from
its own on-disk location, so symlinks break it; see `:33-56` of that test file, and
the `--standalone` `gsc_standalone_setup` helper for the multi-case shape). Stub
`npx` to emit one `qa`-phase candidate with a PR number; stub `dispatch-ci-ready`
(a sibling resolved via `$SCRIPT_DIR`) to exit 1; stub `gh` so `gh_pr_view_rest`
returns a JSON object with `mergedAt: null` and a fixed `headRefOid`; stub
`packages/intentionsutil/scripts/hold-node` inside the fixture repo with a script
that records its argv to a file and exits 0. Cases:

1. **Below cap** — no sidecar. Selector prints `empty`; the sidecar exists with
   `<sha> 1`; the hold stub was NOT invoked.
2. **Same SHA accumulates** — pre-seed the sidecar with `<sha> 3`; after the run it
   reads `<sha> 4`; no hold.
3. **SHA change resets** — pre-seed with `<other-sha> 7`; after the run it reads
   `<sha> 1`; no hold.
4. **At cap holds** — pre-seed with `<sha> 7` (cap 8). The hold stub was invoked with
   `--kind ci-pending-stalled` and the node id; the sidecar is gone.
5. **`--node <id>` does not count** (decision (e)) — pre-seed `<sha> 7`; run with
   `--node`; the sidecar is unchanged at `7` and the hold stub was NOT invoked.
6. **Ready clears** — stub `dispatch-ci-ready` to exit 0, pre-seed `<sha> 4`; the
   node is selected and the sidecar is gone.

**Out of scope for this unit:** `reconcile-graph-review-stall` (Unit 3);
`dispatch-ci-ready` itself, which stays a stateless predicate by design (its
header `:1-9` says so explicitly — the counter belongs one layer up, in the loop
that calls it repeatedly across ticks); `dispatch_classify_rollup` and any attempt
to distinguish "never started" from "still running" at the classification layer.

### Recommended model

opus

### Dependencies

Unit 1 (the `--kind ci-pending-stalled` value must be accepted by `hold-node`).

---

## Unit 3 — Bound the review-stall surface (`reconcile-graph-review-stall`)

### Scope

The reviewed-marker-excluded surface is invisible to Unit 2's counter, so it needs
the same bound at its own observer.

**File: `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall`.**

1. Resolve the main checkout for the sidecar path so both surfaces agree on one
   file. Source `lib-graph-worktree.sh` alongside the existing `lib.sh` source
   (`:81`) and add, next to the `REPO_ROOT` assignment (`:83`):
   `MAIN_ROOT=$(resolve_main_worktree "$REPO_ROOT"); MAIN_ROOT="${MAIN_ROOT:-$REPO_ROOT}"`
   — verbatim the shape at `graph-select-target:433-434`.

2. In the per-candidate loop, keep the `RAW_VERDICT` → `VERDICT` normalization
   fold unchanged (`reviewStallRoute` stays a pure closed-union function over
   `passing|failing|unknown` — do **not** widen its signature or return type; a
   pending verdict is not a *route*, it is a liveness observation, and widening it
   would force every caller to handle a state that has no lane). Instead, act on
   `RAW_VERDICT` directly.

   **Landing site — a construct citation, deliberately not a line number** (five
   sibling units edit this same ~340-line script in the same PR, so any number
   here would drift before it was read). Place the strike bump/clear:

   - **immediately after** the normalization fold
     `case "$RAW_VERDICT" in passing|failing) VERDICT="$RAW_VERDICT" ;; *)
     VERDICT="unknown" ;; esac` — locate it by the string `RAW_VERDICT`; and
   - **before** the superset cost guard that
     `tactic-review-stall-predicate-subprocess-spawn` Unit 1 inserts
     (`if [[ "$VERDICT" != "failing" && "$MERGEABLE" != "CONFLICTING" ]]; then
     continue; fi` — locate it by the string
     `MUST stay a superset of reviewStallRoute`), and therefore before the
     `ROUTE=` `reviewStallRoute` spawn.

   `HEAD_SHA` is assigned above the fold, so `ci_pending_strike_bump` has its
   third argument available at the new site.

   > **⛔ Do NOT land this in the `case "$ROUTE"` block's `*)` no-regression arm.**
   > An earlier revision of this plan did, and that produces dead code the moment
   > the sibling guard lands. A CI-pending candidate has `RAW_VERDICT="pending"`,
   > which the fold maps to `VERDICT="unknown"`, and a pending-CI PR is normally
   > `MERGEABLE` — so the guard's condition holds, the loop `continue`s, `ROUTE`
   > is never computed, and the `*)` arm is unreachable for exactly the population
   > this unit exists to detect. The counter and the hold would never fire.
   >
   > **And do not "fix" it by widening the guard.** That guard is a *binding
   > superset* of `reviewStallRoute`'s non-null conditions (`transitions.ts`'s
   > `interruptRoute` doc comment, pinned by the `transitions.test.ts` case named
   > *"the shell pre-filter's superset invariant"*), and its own node carries a
   > verify fence grepping for its exact text. Widening it breaks the invariant
   > and fails that fence. The correct move is the one above: sit **upstream** of
   > the guard.

   The behaviour at the new site — note that a non-pending candidate must **fall
   through**, not `continue`, because the guard and the routing still have to run:

   - If `RAW_VERDICT` is empty — the `dispatch_ci_verdict_rest` call failed — do
     **not** count and do **not** clear. Fall through untouched.
   - If `RAW_VERDICT` is neither empty nor the literal string `pending`, call
     `ci_pending_strike_clear "$MAIN_ROOT" "$id"` and **fall through** to the
     guard and the existing routing. Behaviour is otherwise unchanged.
   - If `RAW_VERDICT` is `pending`:
     `strikes=$(ci_pending_strike_bump "$MAIN_ROOT" "$id" "$HEAD_SHA")`. Below the
     cap: `continue` (a sidecar write is free, so it must NOT consume the `ACTED`
     budget — `ACTED`/`CAP` exist to bound *lock-holding* work). At or above the
     cap: record the node in a new `CI_STALL_IDS` array — **recorded, not
     landed**, for the reason stated in the loop header: `hold-node` refreshes
     from `origin/main` and lands its own `graph-commit`, whose
     `assert_clean_outside_ids` guard would trip on the still-uncommitted
     `--set-fix` writes staged by this loop. Increment `ACTED` here (a hold *is*
     lock-holding work), then `continue`.

   *(The `CONFLICT_IDS` array this item used to say to copy no longer exists — see
   "Unit 3 — the conflict-hold route it reuses no longer exists" in the Re-landing
   brief. Build `CI_STALL_IDS` fresh, on `graph-select-target`'s
   `_hold_node_fix_cap` shape.)*

3. Land at most **one** `hold-node` call per sweep run **across both hold routes
   combined**. The existing conflict route already self-limits to one
   (`:258`, `[[ "${#CONFLICT_IDS[@]}" -ge 1 ]] && continue`). Extend that guard so
   the ci-stall route is skipped when a conflict hold is already recorded, and vice
   versa. The lock-budget header comment (`:64-76`) states "AT MOST TWO
   graph-commits per tick" (one batched `--set-fix` commit + one hold) — that
   invariant must survive verbatim, so update the comment to say the single hold
   slot is now shared between the conflict and ci-stall routes rather than raising
   the budget. A skipped node still matches the enumeration next tick and its
   strike count is already at cap, so it is held on the following sweep.

4. Land the recorded ci-stall hold in a new block after the existing conflict-hold
   block (`:307-331`), reusing that block's exact structure: `refresh_lock`, the
   already-installed `TMPDIR_HOLD` scratch dir (the single `EXIT` trap at `:127`
   removes it), `printf '%s\n' … > "$REASON_FILE"` / `"$RECOMMENDATION_FILE"`, then
   `( cd "$REPO_ROOT" && "$UTIL_SCRIPTS/hold-node" "$id" --kind ci-pending-stalled … )`,
   parse the hold id with `awk '{print $2}'`, `ci_pending_strike_clear` on success,
   and `refresh_lock`.
   - Reason text must state what is specific to this surface and is NOT true of
     Unit 2's: this tactic completed review and its auto-merge is armed, so the
     selector's reviewed-marker exclusion means no worker lane observes it; its PR's
     CI has reported `pending` on head SHA `<sha>` for `<strikes>` consecutive
     sweeps, so the armed merge can never fire.
   - Recommendation: same remediation as Unit 2's (re-trigger or re-run the checks;
     a new head SHA resets the counter), plus — explicitly — do NOT route this
     through the CI-fix interrupt, which would strip the `reviewed` marker and
     re-draft the PR, discarding a completed review verdict (the rationale already
     recorded at `transitions.ts:272-283` and this script's `:294-306` comment).
     Close with the standard "resolve THIS HOLD TACTIC to `phase: done` and prune it
     — clearing `office_hours` alone does not unblock the source."

5. Update the stdout protocol comment (`:44-48`) with the new line shape, e.g.
   `held <id> -> ci-stalled via <hold-id> (sha=<sha> strikes=<n>)`, and the header's
   route summary (`:16-36`).

Note the natural termination property that makes this safe to run every tick:
once the hold lands, the source gains a `blocked_by` edge, and this sweep's own
enumeration already skips any node with an open blocker (`blockersComplete`,
`:159`) — exactly as it does for the conflict hold today. The same edge removes
the node from `graph-select-target`'s candidate set. So each stalled node is held
once, not once per tick.

**Tests.** There is no existing `test-reconcile-graph-review-stall.sh`. Add one, in
the `test-dispatch-graph-execute.sh` / `test-graph-select-target.sh` idiom: source
`dispatch-test-fixture.sh`, build a temp git repo with an `origin` bare remote,
physically copy the script under test plus `lib.sh` and `lib-*.sh`, write
`intentions/*.md` fixtures for a `phase: review` tactic carrying the `reviewed`
marker and an `execution.pr`, and stub `gh`, `hold-node`, and `graph-commit`.
Cases: (1) pending verdict below cap → no stdout, sidecar at `n+1`, hold stub not
invoked; (2) pending verdict at cap → `hold-node` invoked with
`--kind ci-pending-stalled`, sidecar cleared, one `held … -> ci-stalled` line;
(3) a `passing` verdict clears an existing sidecar and lands no hold; (4) a
gh call failure (empty `RAW_VERDICT`) neither bumps nor clears the sidecar; (5)
with both a CONFLICTING node and an at-cap pending node present, exactly one
`hold-node` invocation occurs (pins decision 3).

**Out of scope:** changing `reviewStallRoute`'s signature, return type, or the
`CiVerdict`/`Mergeable` unions in `packages/intentionsutil/src/transitions.ts`;
changing the `GRAPH_REVIEW_STALL_CAP` env-var contract or its validation
(`:88-95`); touching `reconcile-graph-merged`.

### Recommended model

opus

### Dependencies

Unit 1 (the hold kind) and Unit 2 (the `lib.sh` helper and cap constant this unit
calls).

---

## Reuse

- `packages/intentionsutil/scripts/hold-node` — the landing primitive for every
  tracked hold. Refreshes from `origin/main`, emits `--base` compare-and-swap
  tokens, and lands the born-parked hold node plus the source's `blocked_by` edge in
  ONE `graph-commit`. Never writes the source's own `office_hours`. Invoke it; add
  no landing logic.
- `packages/intentionsutil/scripts/hold-node-decide.ts` — `HOLD_KINDS` / `KIND_SLUGS`
  (`:63-75`) are the single source of truth (`isHoldKind` and the CLI validation
  derive from them); `holdIdFor` (`:117-138`) gives deterministic ids and
  find-or-create idempotency; `decideHold` (`:236-268`) gives NONE/EXISTING/REOPENED
  dispositions; `buildHoldBody` (`:198-224`) and `RESOLUTION_SENTENCE` (`:94-96`)
  give the operator-facing body for free. A new kind gets all of it with no new code.
- `.claude/skills/dispatch-propagate/scripts/graph-select-target:476-509`
  (`_hold_node_fix_cap`) — the caller-side pattern for a selector-embedded hold
  producer: `mktemp -d`, reason/recommendation files, `( cd "$NATIVE_ROOT" && hold-node … ) >/dev/null 2>&1`,
  `rm -rf`, return rc. Copy this shape for `_hold_node_ci_pending`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:289,320-370` —
  the strike-sidecar ladder: sidecar path convention, numeric validation, bump-and-print
  below cap, escalate-and-`rm -f` at cap, and the fail-open rationale.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:230-235` — reset
  the sidecar on success so the count means *consecutive* failures, not a lifetime total.
- `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:63-70,97-127,307-331` —
  `refresh_lock()`, the snapshot/`RESTORE_ON_FAILURE`/`restore_snapshot` discipline, the
  single `EXIT` trap, the `TMPDIR_HOLD` reason/recommendation-file pattern, and the
  batched-`graph-commit` + one-hold-per-sweep lock budget.
- `.claude/skills/dispatch-propagate/scripts/lib.sh` — `gh_pr_view_rest` (`:1097`) for
  the PR projection (`mergedAt`, `headRefOid`) and `dispatch_ci_verdict_rest` (`:792`,
  with its per-SHA `DISPATCH_CI_VERDICT_CACHE` memoisation) for the verdict. Add no
  second REST fetch path.
- `.claude/skills/dispatch-propagate/scripts/lib-graph-worktree.sh` — `resolve_main_worktree`,
  used the same way as `graph-select-target:433-434`.
- `.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh` and
  `test-dispatch-graph-execute.sh` — the bash fixture idiom (physical script copies,
  fake `npx`/`gh`/`claude` on `PATH`, `assert_eq` from `dispatch-test-fixture.sh`,
  sidecar-content assertions at `test-dispatch-graph-execute.sh:207-290`).
- `packages/intentionsutil/test/hold-node-decide.test.ts:100-170` — the existing
  per-kind assertion shape to mirror for the fourth kind.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts
```

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh --prose
```

Manual and judgment checks:

- **Hold-kind round trip.** From the worktree root, on a scratch copy of
  `intentions/`, confirm the vocabulary is wired end to end without landing
  anything: `node --import tsx/esm packages/intentionsutil/scripts/hold-node-decide.ts --source <any-existing-tactic-id> --kind ci-pending-stalled --reason-file /tmp/claude-r --recommendation-file /tmp/claude-c`
  prints JSON with `hold_id: "tactic-hold-ci-stalled-<source-without-tactic->"`,
  `disposition: "NONE"`, and `attributes.hold_kind: "ci-pending-stalled"`.
  `hold-node-decide.ts` is network-free and read-only, so this is safe to run
  directly. Also confirm `--kind no-progress` is still rejected.
- **No graph write below cap.** After the Unit-2 and Unit-3 test runs, `git status`
  in the fixture repos must show `intentions/` clean — the free tier must never
  dirty a tree (a leaked write would trip `graph-commit`'s `assert_clean_outside_ids`
  for every other graph writer in the checkout).
- **Observe in production.** After merge, watch the tick journal / selection log
  (`$HOME/.local/share/commons-dispatch/graph-selection.jsonl`) for skip reasons of
  the form `ci-pending (strike n/8)` on any node that is genuinely waiting on CI,
  and confirm the count resets to 1 rather than continuing to climb once that
  node's CI concludes or its branch receives a new push. A count that never resets
  after a concluded run means the SHA-keying or the `rc == 0` clear is wrong.
- **Cap sanity, judgment call.** 8 observations at the 15-minute tick cadence is
  ~2 hours. If real CI runs in this repo are ever observed exceeding that, the
  constant is the single place to raise — but raise it in `lib.sh` only; do not
  reintroduce a per-call-site literal.

## Re-landing brief — what moved under this plan (2026-08-30)

The branch `tactic-autonomous-ci-pending-liveness-bound` and its PR #3002 were abandoned
unmerged, and the node reset to `phase: null` so the router re-plans from this body. The
branch was cut before three siblings landed: `tactic-stale-hold-auto-resolve` moved the
hold-kind vocabulary into a new module and added a per-kind re-check classification;
`tactic-graph-router-conflict-routing` retired the conflict-hold route Unit 3 was written
against; and REST/verdict work renumbered `lib.sh`. The three units are still the plan, but
every `path:line` they cite predates those landings — read them against the anchors below.
Start a fresh branch off `origin/main`; nothing from #3002 is worth salvaging.

### Unit 1 — the hold-kind vocabulary now lives in `packages/intentionsutil/src/holds.ts`

`HOLD_KINDS`, `HoldKind`, `KIND_SLUGS`, `isHoldKind`, `RESERVED_KIND_SLUGS`, `NODE_ID_RE`,
`RESOLUTION_SENTENCE` and `holdIdFor` all moved out of
`packages/intentionsutil/scripts/hold-node-decide.ts` into
`packages/intentionsutil/src/holds.ts` (132 lines on main): `HOLD_KINDS` `:36` — still
exactly `["provision-conflict", "fix-attempt-cap", "worktree-residue"]`, no
`ci-pending-stalled`; kinds doc comment `:8-35` with the reserved `no-progress` paragraph
at `:30-34`; `KIND_SLUGS` `:44`; `isHoldKind` `:55`; `RESERVED_KIND_SLUGS` `:60`;
`RESOLUTION_SENTENCE` `:66`; `holdIdFor` `:76`.

So every vocabulary edit Unit 1 assigns to `hold-node-decide.ts` — appending to
`HOLD_KINDS`, the `KIND_SLUGS` entry, the doc-comment bullet, the reserved-slug sentence —
relocates to `holds.ts`. `hold-node-decide.ts` now only imports (`:34-41`) and re-exports
(`:45-52`), so its public surface is unchanged. What still changes there: the header usage
line `:21` and the missing-`--kind` failure string `:246`, both hardcoding
`<provision-conflict|fix-attempt-cap|worktree-residue>`. The invalid-value failure `:249`
already interpolates `HOLD_KINDS.join("|")`. `decideHold` `:173` and `buildHoldBody` `:134`
are still here and kind-agnostic.

Other usage strings: `packages/intentionsutil/scripts/hold-node:35` (header) and `:70`
(`USAGE=` — the plan's `:64` is now the `DECIDE_TS` assignment); it still forwards the kind
unvalidated to the decider (`:107-116`). `packages/intentionsutil/scripts/resolve-hold:78`
(header) and `:122` (`USAGE=`); main added `[--hold-id <hold-node-id>]`, documented at
`:79` and `:88-98` — preserve it. `--kind` still defaults to `provision-conflict` at `:125`.
Two stale `resolve-hold` header cross-references to fix here: `:25-26` points
`RESOLUTION_SENTENCE` and `KIND_SLUGS` at `hold-node-decide.ts:105-119`/`:57-60`, and `:83`
names `hold-node-decide.ts`'s `HOLD_KINDS`; both now mean `src/holds.ts`.

Test anchors: `packages/intentionsutil/test/hold-node-decide.test.ts` (277 lines) has the
`holdIdFor` per-kind block at `:59-88` and `hold_kind` assertions at `:42`, `:110`, `:153`,
`:162` — the shape to mirror.

### The `KIND_RECHECK` entry for `ci-pending-stalled` (settled — do not re-litigate at implementation time)

`holds.ts:103-105` defines `HoldRecheck`; `:117-132` defines
`KIND_RECHECK: Record<HoldKind, HoldRecheck>`. Because the type is a `Record` over
`HoldKind`, appending `ci-pending-stalled` to `HOLD_KINDS` without a matching entry fails
typecheck. The plan never decided a value. It is now ruled: **`policy: "manual"`**, because

1. deciding whether CI concluded needs a live PR-verdict fetch from GitHub — a network
   call that spends rate limit, whose answer can legitimately stay `pending` forever, which
   is the exact held condition; not a local predicate the sweep can run every tick on every
   hold;
2. the `auto` arm's `predicate` is a closed union with one member, `"worktree-clean"`
   (`holds.ts:104`). Classifying `auto` would mean widening that union, implementing a new
   predicate in `packages/intentionsutil/src/hold-sweep.ts` (which gates at `:131-132` on
   `KIND_RECHECK[kind].policy === "auto"`), and rewriting
   `packages/intentionsutil/test/holds.test.ts:27-29`
   (`expect(auto).toEqual(["worktree-residue"])`, confirmed verbatim) — a separate tactic's
   work, not a line in this plan;
3. the hold fires on an exhausted strike ladder, like `fix-attempt-cap`, not on an
   externally observable state that flips back on its own.

Write it beside the two existing `manual` entries at `holds.ts:119-131`, matching their
`+`-concatenated `why` style:

```ts
"ci-pending-stalled": {
  policy: "manual",
  why:
    "checking whether CI concluded requires a live PR-verdict fetch, not a " +
    "local predicate the auto-resolve sweep can run without a network call; " +
    "and the hold fires on an exhausted strike ladder, not on a condition " +
    "that flips back on its own",
},
```

Downstream, all intended: `.claude/skills/dispatch-propagate/scripts/lib-stale-hold-recheck.sh`
reports and never acts (`skip-manual-policy`, documented `:76-78`, implemented `:323-328`).
`packages/intentionsutil/src/hold-alerts.ts` surfaces the kind in unclaimed-hold alerting
beside `provision-conflict` and `fix-attempt-cap` — its doc comment `:11-14` names today's
two manual kinds inline and must be updated. `holds.test.ts:9-14` requires every kind
classified and `:17-25` a non-empty `why`; the entry satisfies both.

### Unit 2 — scope holds; only the anchors moved

- `graph-select-target` still skips with a bare, uncounted `ci-pending`. The `qa|review`
  arm is `.claude/skills/dispatch-propagate/scripts/graph-select-target:1117-1142`; it calls
  `dispatch-ci-ready` at `:1136` and maps exit 1 to `echo "ci-pending"; return 1` at `:1140`.
  `dispatch-ci-ready:11-13` still documents exit 1 as a draft PR whose verdict is pending.
- `dispatch_classify_rollup` is `.claude/skills/dispatch-propagate/scripts/lib.sh:708`; an
  empty rollup still returns `pending` at `:713-717`. `CANCELLED` is still in the
  failing-conclusions jq branch (`:719-741`, conclusion list at `:728`), so decision (f) —
  cancelled runs out of scope — still holds; the body's `lib.sh:712-721` is stale.
- `dispatch_ci_verdict_rest` is `lib.sh:840-925` (not ~`:792`/`:820`), with per-SHA
  `DISPATCH_CI_VERDICT_CACHE` memoisation at `:845-846` and `:920`; `gh_pr_view_rest` is
  `lib.sh:1195` (not `:1097`). Insert the new helper and cap after `lib.sh:925`.
- `CONFLICT_STRIKE_CAP` is `dispatch-graph-execute:165`, not `:145` — value still 5.
  `FIX_ATTEMPT_CAP` confirmed at `packages/intentionsutil/src/transitions.ts:101`, value 3.
- The `OnCalendar=*:0/15` cadence comment is `lib.sh:4019` (also `:3859`), not `:3082`.
- `lib.sh` reachability from both call sites still holds: `graph-select-target:200` sources
  `lib-reservation-ledger.sh`, which sources `lib.sh` at `lib-reservation-ledger.sh:299`
  (not `:263`); `reconcile-graph-review-stall:91` sources `lib.sh` directly (not `:81`).

### Unit 3 — the conflict-hold route it reuses no longer exists

In `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall` the conflict
route is gone **twice over**. There is no `conflict)` arm left in `case "$ROUTE"` at all —
the case carries exactly two arms, `fix)` and `*)` — and a CONFLICTING candidate is now
skipped outright *before* the CI fetch and before the route evaluation, per the header
(`tactic-graph-router-conflict-routing`: the selector surfaces it as a `pending-merge`
candidate and the orthogonal `execution.conflict` interrupt handles it, so acting here too
would double-handle the same PR). No `hold-node` invocation, no `CONFLICT_IDS`, no
`TMPDIR_HOLD`, no reason/recommendation file writes survive; the only `hold-node` mention
is prose in the header. The lock-budget header says **AT MOST ONE** `graph-commit` per
tick, not two.

> An earlier revision of this brief read the script at 340 lines and gave anchors from that
> revision. Re-measured 2026-08-31 on `origin/main` `4b8ebde3` the script is **510 lines**
> and every one of those anchors has moved by +50 to +150 lines. The corrected set is in
> "Remaining Unit 3 anchors" below; re-check them before use, because this file drifts on
> roughly every dispatch landing.

That invalidates Unit 3's steps 3 and 4: there is no conflict route to share a hold slot
with and no block to copy. Rewrite them as — the ci-stall hold is the sweep's only hold
producer, so it self-limits to one per run with no shared-slot guard, and the lock-budget
header goes from "at most one graph-commit" to "at most one graph-commit plus at most one
`hold-node`". Build the scratch reason/recommendation files from scratch, copying
`graph-select-target:684-717` (`_hold_node_fix_cap`: `mktemp -d`, two `printf` files,
`( cd "$NATIVE_ROOT" && packages/intentionsutil/scripts/hold-node … ) >/dev/null 2>&1`,
`rm -rf`, return rc) — the surviving in-repo example.

Remaining Unit 3 anchors in that script, all re-measured 2026-08-31 on `origin/main`
`4b8ebde3` (510 lines): `REPO_ROOT` `:117`; `UTIL_SCRIPTS` `:118`; the cap
(`GRAPH_REVIEW_STALL_CAP`) declared `:81`, defaulted `:86`, read `:125-127`; `refresh_lock`
defined `:131-134` and called at `:239`, `:468`, `:505`; the single `EXIT` trap `:170`;
`ACTED=0` `:232`; `HEAD_SHA` `:302`; `RAW_VERDICT` `:304` (still empty on call failure, as
the plan assumes); the `passing|failing` fold `:305-308` — **this fold, not the
`case "$ROUTE"` arm, is Unit 3's landing site; see the ⛔ box in Unit 3 step 2**; the
superset pre-filter guard `:324-326` with its rationale at `:310-323`; the
`reviewStallRoute` eval `:328-336`; the `case "$ROUTE"` at `:338` whose `*)` no-regression
arm is `:392-394`, which a pending candidate **stops reaching** once
`tactic-review-stall-predicate-subprocess-spawn` Unit 1's superset guard lands above it.
`resolve_main_worktree` is defined at
`.claude/skills/dispatch-propagate/scripts/lib-graph-worktree.sh:27` — the one anchor in
this brief that did **not** move. The two-line `NATIVE_ROOT` idiom to copy is
`graph-select-target:625-626` (not `:500-501` and not `:433-434`), and `_hold_node_fix_cap`
is `graph-select-target:809-842` behind its header comment at `:800-808` (not `:684-717`).
The script still does not source `lib-graph-worktree.sh` (grep count 0 at `4b8ebde3`), so
step 1 still applies: add the source next to `:118` and the `MAIN_ROOT` assignment next to
`:117`.

### Unit 3's early exit must widen, or the whole unit is dead code

Neither the Scope above nor any step of Unit 3 says this, and an implementer who builds
exactly what the Scope describes ships a unit that can never fire. Recording it here so the
node is executable from its own text.

Unit 3 accumulates at-cap nodes into a new `CI_STALL_IDS` array inside the per-candidate
loop (at the `passing|failing` fold, `:305-308`), and lands the hold *after* the loop. But
the statement immediately following that loop is

```
[[ "${#RECOVERED_IDS[@]}" -eq 0 ]] && exit 0
```

at `:398` on `origin/main` `4b8ebde3` (measured 2026-08-31). `RECOVERED_IDS` collects only
`fix`-routed nodes. A tick whose sole finding is a ci-pending-stalled node therefore leaves
that loop with `RECOVERED_IDS` empty and `CI_STALL_IDS` non-empty, hits this line, and
exits 0 — the array is built and then thrown away, every time. The ci-stall route is the
*only* route that can populate `CI_STALL_IDS` without also populating `RECOVERED_IDS`, so
this is not an edge case; it is the unit's main path.

Widen the exit to cover both producers:

```
[[ "${#RECOVERED_IDS[@]}" -eq 0 && "${#CI_STALL_IDS[@]}" -eq 0 ]] && exit 0
```

This is safe without any further change because the batched `--set-fix` land is already
guarded independently, by `if [[ "${#RECOVERED_IDS[@]}" -gt 0 ]]` at `:467`. Letting a
ci-stall-only tick past the early exit therefore cannot produce an empty `graph-commit`; it
falls through that guard to the hold call Unit 3 adds. Widening the exit and leaving `:467`
alone is the complete change.

Two related corrections to the doctrine that cites this line:

- The doctrine's citation of the early exit as `:311` is **87 lines stale**, not the 53
  lines an earlier note recorded — it was `:364` at `2d5faa71` and is `:398` at `4b8ebde3`.
  Re-derive it rather than trusting any number written here; this file moves constantly.
- Because CONFLICTING candidates are now short-circuited before the CI fetch (see the
  subsection above), a conflicting PR never reaches the `passing|failing` fold and so can
  never enter `CI_STALL_IDS`. That is correct — a conflicting PR is not ci-pending-stalled —
  but it means Unit 3's "shared hold slot" reasoning is doubly moot: there is no conflict
  hold to share a slot with, and no conflict candidate to reach the counter.

### Reuse-section anchors that moved

- Strike-sidecar ladder in `dispatch-graph-execute` (545 lines): `STRIKE_FILE` assigned
  `:328`, cleared at `:372` and `:433`, below-cap bump/print `:395-405`, cap
  `CONFLICT_STRIKE_CAP=5` `:165`. The plan's `:289,320-370` and `:230-235` are stale, and so
  is this brief's earlier "cleared on success `:256`" — re-measured 2026-08-31 on
  `origin/main` `4b8ebde3`, the two clear sites are `:372` and `:433`.
- Sidecar-assertion fixture idiom: `test-dispatch-graph-execute.sh:319-324` (499 lines) —
  the `assert_eq … "gone" "$([ -e … ] && echo present || echo gone)"` pair, with Case 5c at
  `:325-335` as the second worked example. Not `:283-298` and not `:207-290`.
- `packages/intentionsutil/test/holds.test.ts` (37 lines) is a new file this plan does not
  know about; the fourth kind must satisfy its assertions at `:9-14`, `:17-25`, `:27-29`.
