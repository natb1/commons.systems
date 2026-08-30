---
id: tactic-phase-entry-selection-gate
kind: tactic
statement: Run the mechanical selection-validity gate (check-node-selection) at
  every phase-skill entry, not only the fresh-cut provision-node-worktree path,
  so a redundant or terminal-state selection exits cheaply before any
  session-boot work
owner: ai
status: codified
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: Waves B-D of a three-band interim
    scale (50 / 20 / 10) - dispatch-containment and evidence-custody work that
    follows the Wave-A write-path fixes. Interim scaffolding only;
    tactic-attention-tier-ranking and tactic-attention-boost-scripts retire this
    numeric scheme."
  tier: 1
phase: done
execution:
  branch: tactic-phase-entry-selection-gate
  pr: 3021
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-08-03T15:01:11Z
    mergeCommitSha: bd133fd96387dabbd82c4019c4affe6721850a1e
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Run the mechanical selection-validity gate (check-node-selection) at every phase-skill entry, not only the fresh-cut provision-node-worktree path, so a redundant or terminal-state selection exits cheaply before any session-boot work

## Context

The mechanical selection-validity gate is `packages/intentionsutil/scripts/check-node-selection.ts`. Its pure core `evaluateSelection` (`check-node-selection.ts:182-352`) runs five checks against a store the caller guarantees is at fresh `origin/main`:

1. **exists** — `intentions/<node-id>.md` present (`:189-198`) → exit 12
2. **phase** — persisted phase equals the selected phase, with special handling for `fix` (requires a non-null `execution.fix`, `:222-229`) and `align-tactics` (`:230-243`) → exit 12
3. **not parked** — `office_hours` null, first-class **or** the `attributes.office_hours` squatter (`readParked`, `:90-94`; used at `:262-264`) → exit 12
4. **align-eligibility / fingerprint** — `strategyAlignSelectable` / `frozenTacticSelectable` (`:271-289`) and serving-strategy substance-hash freshness (`:301-315`) → exit 12
5. **scope chain** — only with `--stamp` and a `fix`/`qa`/`review` phase (`SCOPE_CHAINED_PHASES`, `:61`; check at `:324-349`) → exit 13

Exit 0 prints the node's scope fingerprint on stdout. Exit codes are exported as `EXIT_STALE_SELECTION = 12` / `EXIT_SCOPE_STALE = 13` (`:58-59`). The CLI wrapper `main` (`:384-389`) maps usage/malformed-store errors to exit 2 (`:391-401`).

**The gap.** That gate is wired at exactly **one** call site in the tree: `.claude/skills/dispatch-propagate/scripts/provision-node-worktree:125-141` — the fresh-cut worktree path. Every other way a phase skill can start bypasses it:

- The tactic phase skills (`/implement`, `/qa-fix`, `/review-fix`, `/fix-checks`, `/qa-main`) enter through the shared front door `.claude/skills/dispatch-propagate/scripts/dispatch-derive-node-target`, whose Step-5 gate (`:148-163`) hand-rolls a **subset** of the real gate: bare string equality `ACTUAL_PHASE != EXPECT_PHASE` (`:159-162`), or `execution.fix != null` under `--expect-fix-active` (`:152-157`). It never checks parked, strategy-fingerprint staleness, align-eligibility, the `reviewed` marker, or scope-chain custody.
- `/align-tactics` enters via `provision-node-worktree` **or** native `EnterWorktree` / re-entry of an already-existing worktree (`.claude/skills/align-tactics/SKILL.md:103-119`). On the second path it runs only `.claude/skills/dispatch-propagate/scripts/assert-worktree-fresh`, which is **detect-only freshness** — a `git fetch origin main` plus `git rev-list --count HEAD..origin/main` (`assert-worktree-fresh:54-68`). It never reads phase, park, fingerprint, or scope.

The drift this produced is already visible in-repo: `.claude/skills/qa-fix/references/target-resolution.md:44-67` bolts a hand-rolled `jq` parked check onto the front door's output, and its own prose says it "must agree with the canonical selection gate `readParked` (`check-node-selection.ts:90-93`)" — i.e. one of the gate's five checks, reimplemented by hand, in one skill only. The other four phase skills do not have even that partial copy.

**Overlap question — already answered, do not re-derive it.** The tactic's own body asks whether `tactic-align-skills-latest-graph-guard` (PR #2889) closes this gap. It does not. PR #2889 merged 2026-07-18 and its diff only adds `assert-worktree-fresh` and routes the align skills' Step 0 through it; it never touches `provision-node-worktree` or `check-node-selection.ts`. The current `align-tactics/SKILL.md:103-119` text confirms it — freshness only, no selection call. Proceed with the explicit entry gate.

**Intended outcome.** One mechanical selection-validity gate, one implementation, bound to **every** phase-skill entry — so a redundant, stale, parked, or terminal-state selection exits cheaply before any Explore/Plan fan-out, `gh` call, or session-boot work, instead of relying on each skill's prose "Idempotency" reasoning (an LLM judgment gate).

**Greenfield design.** A single shared bash primitive, `assert-node-selection`, owns *how the gate is spoken*: resolve the sidecar stamp path, obtain a fresh-`origin/main` intentions store, invoke `check-node-selection.ts`, and pass through its exit vocabulary (12/13) unchanged. Both entry front doors call it — `dispatch-derive-node-target` for the branch-is-node-id tactic phase skills, and `align-tactics/SKILL.md` Step 0 for the align lane. No caller re-derives any of the five checks. `provision-node-worktree` keeps its existing inline call (it is the stamp *writer*, not just a reader, and it must gate before it does any worktree/branch work) — its behavior is unchanged by this tactic.

This is a small enough change that no brownfield migration path is needed: every call site is converted in the same PR, and the retired hand-rolled checks are removed in the same PR.

**Scope boundary — align skills that are deliberately NOT gated.** The gate requires a `<selected-phase>` and a single node target. These four have neither, and wiring them would be wrong, not merely unnecessary:

- `/office-hours` (`.claude/skills/office-hours/SKILL.md:397-398`) operates on an **office_hours-parked** node by definition. Check 3 (`:262-264`) would exit 12 on every legitimate run.
- `/align-strategy` (`.claude/skills/align-strategy/SKILL.md:96`) may target a strategy that does not exist yet (a new-strategy interview), and strategies carry no phase.
- `/align-init` (`.claude/skills/align-init/SKILL.md:71`) has no node target at all.
- `/grounding-research` (`.claude/skills/grounding-research/SKILL.md:41`) walks many nodes; there is no single selected target.

All four keep `assert-worktree-fresh` exactly as-is.

---

## Unit 1 — `assert-node-selection`: the shared selection-gate primitive

**Recommended model:** sonnet

### Scope

**Create** `.claude/skills/dispatch-propagate/scripts/assert-node-selection` (executable, `#!/usr/bin/env bash`).

Contract, to be written verbatim into the script's header comment block:

```
# Usage: assert-node-selection <node-id> <selected-phase> [--dir <intentions-dir>]
#
# Stdout: the node's scope fingerprint (exit 0 only). All diagnostics to stderr.
#
# Exit codes (check-node-selection.ts's vocabulary, passed through unchanged):
#   0   the selection is still valid.
#   12  stale-selection — pruned, phase advanced, parked, no longer
#       align-eligible, already carries the `reviewed` marker, or a serving
#       strategy's substance changed since the stamp. NOT a defect.
#   13  scope-stale — the tactic's scope changed after the previous phase ran.
#       NOT a defect; the node wants demoting to `implement`.
#   1   could not obtain a fresh origin/main intentions store (fetch or
#       `git archive` failed).
#   2   usage error, unresolvable project root, or the gate itself failed
#       mechanically (any check-node-selection exit other than 0/12/13).
```

Implementation requirements:

1. `set -uo pipefail` — **not** `-e`. The gate's non-zero exit must be captured, not kill the script. Mirrors `provision-node-worktree:83`.
2. `SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"`; `REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"`. Mirrors `dispatch-derive-node-target:52-53`. `REPO_ROOT` is the *worktree* root and is used only as the cwd for `npx tsx` (it is where `node_modules` and `packages/intentionsutil/` live).
3. Source `"$SCRIPT_DIR/lib.sh"` (for `resolve_project_root`, `lib.sh:1837-1841`) and `"$SCRIPT_DIR/lib-graph-worktree.sh"` (for `resolve_main_worktree`, `lib-graph-worktree.sh:27-42`).
4. Validate `<node-id>` against `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`, rejecting a numeric-leading id — copy the regex and the message shape from `dispatch-derive-node-target:67-70` (exit 2). Reject a missing/empty `<selected-phase>` (exit 2). Reject any unknown `--flag` (exit 2).
5. **Stamp path.** `PROJECT_ROOT=$(resolve_main_worktree 2>/dev/null)`; if empty or not a directory, fall back to `PROJECT_ROOT=$(resolve_project_root)`; if that also fails, exit 2 with a clear message. Then `STAMP_PATH="$PROJECT_ROOT/.claude/worktrees/$NODE_ID.scope-fingerprint"`. This is the same sidecar convention `provision-node-worktree:124` writes — deliberately outside every checkout so it never dirties a tree. Do not create the file; a missing stamp is handled inside the gate (fails open with a warning, `check-node-selection.ts:329-338`).
6. **Fresh store.** If `--dir <intentions-dir>` was given, use it verbatim — the caller asserts it is a fresh-`origin/main` snapshot. Otherwise:
   - `git fetch origin main --quiet` (exit 1 with a message on failure — a failed fetch is never license to proceed on unverified state).
   - `SNAP_DIR="$(mktemp -d)"` with `trap 'rm -rf "$SNAP_DIR"' EXIT`.
   - `git archive origin/main intentions/ | tar -x -C "$SNAP_DIR"` (exit 1 on failure).
   - `DIR="$SNAP_DIR/intentions"`.
   The **whole** `intentions/` tree is required, not just the target node file: `evaluateSelection` calls `listNodes(dir)` for the align-eligibility and fingerprint checks (`check-node-selection.ts:273`, `:281`, `:303`). Given a single-file snapshot, the serving strategy lookup silently `continue`s (`:306`) and check 4 becomes a no-op — a silent hole, not an error.
7. **Invoke the gate**, capturing stdout and status separately (the `GATE_FP=$(...)` / `GATE_RC=$?` shape at `provision-node-worktree:125-127`):
   ```bash
   GATE_FP=$(cd "$REPO_ROOT" && npx tsx packages/intentionsutil/scripts/check-node-selection.ts \
     "$NODE_ID" "$SELECTED_PHASE" --dir "$DIR" --stamp "$STAMP_PATH")
   GATE_RC=$?
   ```
8. **Exit map.** `0` → `printf '%s\n' "$GATE_FP"`, exit 0. `12` → exit 12. `13` → exit 13. Anything else → one stderr line naming the raw code, exit 2. On 12/13 emit **nothing extra** — `check-node-selection` already wrote the single-line reason to stderr (`check-node-selection.ts:184-187`), and re-wrapping it buries the detail.

**Create** `.claude/skills/dispatch-propagate/scripts/test-assert-node-selection.sh` (executable). Model the harness on `test-dispatch-derive-node-target.sh:1-120`: an ephemeral bare-origin + working-checkout git fixture built by a local `make_repo()`, a `write_node_fixture()` helper emitting a schema-valid `intentions/<id>.md`, assertions from `test-helpers.sh` (`assert_eq`, `assert_contains`, `report_results`). Run the **real** `check-node-selection.ts` from the real `REPO_ROOT` against the fixture snapshot — do not stub it; the point of the suite is the plumbing plus the verdict. Cases:

- valid selection at `--expect`-style phase `implement` → exit 0, stdout is a 64-hex fingerprint
- phase advanced (`qa` on disk, `implement` requested) → exit 12
- node absent from `origin/main` → exit 12 (check 1)
- `office_hours` populated → exit 12 (this is the case today's front door misses entirely)
- `attributes.office_hours` squatter populated with top-level `office_hours: null` → exit 12 (the squatter case `qa-fix/references/target-resolution.md:53-58` warns about)
- `--dir <fixture-intentions>` supplied → no `git fetch` occurs (assert by pointing `origin` at an unreachable path and still getting exit 0)
- invalid node id → exit 2; unknown flag → exit 2

Registration: the suite is auto-discovered — `run-unit-tests.sh:190` globs `"$SCRIPTS"/test-*.sh` whenever a changed path matches `.claude/skills/dispatch-propagate/scripts/*` (`run-unit-tests.sh:88`). No `.github/workflows/unit-tests.yml` edit is required; the explicit list there (`:198-206` comment) is only for SUTs living **outside** that scripts dir.

**Out of scope for this unit:** any edit to `check-node-selection.ts`, `provision-node-worktree`, `assert-worktree-fresh`, or any `SKILL.md`.

---

## Unit 2 — Route `dispatch-derive-node-target`'s gate through the real primitive

**Recommended model:** opus

**Dependencies:** Unit 1.

### Scope

Edit **only** `.claude/skills/dispatch-propagate/scripts/dispatch-derive-node-target`.

1. **Widen the snapshot** (`:132-135`). Replace `git archive origin/main "intentions/$NODE_ID.md"` with `git archive origin/main intentions/`, keeping the `| tar -x -C "$SNAP_DIR"` pipe. Then preserve the exit-1 "node absent from origin/main" contract explicitly:
   ```bash
   if [[ ! -f "$SNAP_DIR/intentions/$NODE_ID.md" ]]; then
     echo "dispatch-derive-node-target: node '$NODE_ID' not found at origin/main (intentions/$NODE_ID.md)" >&2
     exit 1
   fi
   ```
   A failing `git archive` (no `intentions/` tree at `origin/main` at all) also stays exit 1, with its own message. Rationale for the widening is Unit 1 point 6 — the gate's checks 3b/4 need the full store or they silently no-op.
2. **Step 4 is unchanged** (`:138-146`). `COMBINED_JSON` still reads `readNode`/`readNodeBody` from `"$SNAP_DIR/intentions"`; the widened snapshot is a superset.
3. **Replace Step 5** (`:148-163`) with the shared gate. Keep `ACTUAL_PHASE="$(jq -r '.node.phase' <<<"$COMBINED_JSON")"` (`:151`) — it is still emitted informationally on the `PHASE:` line at `:181`. Delete the two hand-rolled branches (`:152-163`) and substitute:
   ```bash
   if [[ "$EXPECT_FIX_ACTIVE" -eq 1 ]]; then GATE_PHASE="fix"; else GATE_PHASE="$EXPECT_PHASE"; fi
   "$SCRIPT_DIR/assert-node-selection" "$NODE_ID" "$GATE_PHASE" --dir "$SNAP_DIR/intentions" >/dev/null
   GATE_RC=$?
   case "$GATE_RC" in
     0)  ;;
     12) exit 3 ;;
     13) exit 5 ;;
     *)  exit 1 ;;
   esac
   ```
   The `--expect-fix-active` → `fix` mapping is exact: `check-node-selection.ts:222-229` replaces phase equality with an `execution.fix != null` interrupt-presence gate for the literal phase string `fix`, which is precisely what `:152-157` hand-rolled. Discard the gate's stdout (`>/dev/null`) — this script's stdout is a structured payload and must not gain a stray fingerprint line.
4. **Ordering matters and is already correct:** the gate sits before Step 6's `gh` PR resolution (`:165-177`), so a stale selection exits before any network call to GitHub. Do not move it.
5. **Update the header contract** (`:42-49`) to the new exit table:
   - `3` — **selection no longer valid.** The full mechanical gate rejected it: phase/interrupt mismatch, office_hours park, stale serving-strategy fingerprint, no longer align-eligible, or an already-`reviewed` node re-selected for review. Not a defect; the caller stops cleanly and the next tick re-selects from current state.
   - `5` — **scope-stale.** The tactic's scope changed after the previous phase ran (`check-node-selection.ts:324-349`). Not a defect; the node wants demoting to `implement`.
   Also update the Step-5 header comment and the `--expect-phase` / `--expect-fix-active` flag docs (`:16-26`) to say the gate is `check-node-selection.ts`, not a local phase comparison.

**Two intentional behavior changes to call out in the header comment**, because they are the point of the tactic and will surface in review:

- **`review` gains the `reviewed`-marker guard** (`check-node-selection.ts:246-259`). A node at `phase: review` that already carries the `reviewed` marker now exits 3 instead of proceeding. That is the execute-side mirror of the selector's own reviewed-exclusion, and it catches exactly the hand-run/re-entry case this tactic exists to close.
- **Every phase now gets the park and fingerprint checks.** A node parked to `office_hours` between selection and skill entry now exits 3 at the front door for all five skills, not just qa-fix.

**Extend** `.claude/skills/dispatch-propagate/scripts/test-dispatch-derive-node-target.sh` with cases proving the new routing: a parked node → exit 3; a phase mismatch → exit 3 (regression-guarding the existing contract); `--expect-fix-active` with `execution.fix: null` → exit 3; a `phase: review` node carrying `markers: [reviewed]` → exit 3. Reuse the existing `write_node_fixture()` (`:26-60`) — extend its optional `execution` block argument rather than adding a second fixture writer. A scope-stale (exit 5) case needs a stamp file at `$PROJECT_ROOT/.claude/worktrees/<id>.scope-fingerprint`; if wiring `DISPATCH_GRAPH_MAIN_WORKTREE` (honored by `resolve_main_worktree`, `lib-graph-worktree.sh:29-32`) into this fixture proves awkward, cover exit 5 in `test-assert-node-selection.sh` instead and leave a comment here naming where it lives.

**Out of scope:** any `SKILL.md` edit (Unit 3), `provision-node-worktree`, `check-node-selection.ts`.

---

## Unit 3 — Update the five phase skills' exit routing; retire qa-fix's duplicate parked guard

**Recommended model:** sonnet

**Dependencies:** Unit 2.

### Scope

Five `SKILL.md` files plus one reference file. Two changes each.

**(a) Route exit 3 and exit 5 to a clean stop, not an error stop.** A stale selection is not a defect — it is the documented `skipped` disposition (`provision-node-worktree:52-57`). Today every skill's exit-3 arm does `exit 1`, while qa-fix's separate parked guard does `exit 0`. Now that exit 3 subsumes the parked case, that inconsistency has to resolve; resolve it toward the clean stop. In each skill, the exit-3 and exit-5 arms print the gate's reason to stderr and `exit 0`, followed by prose: *"This is a stale selection, not a defect. End the session; make no graph write and open no PR."*

Exact edits:

- `.claude/skills/implement/SKILL.md:69-75` — the `case "$rc" in` arms. Change `3)` to the clean-stop form and add a `5)` arm ("scope changed since the previous phase; the node wants demoting to implement"). The trailing `exit 1` at `:76` must become conditional on the arm, not unconditional — restructure so `1)`/`2)`/`*)` keep `exit 1` while `3)`/`5)` `exit 0`.
- `.claude/skills/qa-fix/SKILL.md:76-82` — same restructure of its `case "$rc" in`.
- `.claude/skills/fix-checks/SKILL.md:68-86` — its `case "$DERIVE_RC" in` has a `4)` arm and a catch-all `*)`. Add explicit `3)` and `5)` arms ahead of `*)` doing the clean stop; leave the `4)` `ESCALATE-NO-PR` sentinel and the `*)` error arm untouched.
- `.claude/skills/review-fix/SKILL.md:69-82` — **this one carries a latent fall-through bug.** Its `case $?` has arms `0)`, `1|2)`, `3)`, `4)` and **no default**. An exit 5 would match nothing, the case would fall through, and the skill would continue with an empty `DERIVE_OUT` and unbound `PR_NUM`/`NODE_JSON`. Add a `5)` arm **and** a `*)` default arm that hard-stops with `exit 1` on any unrecognized code.
- `.claude/skills/qa-main/SKILL.md:66-73` — same restructure of its `case "$rc" in`.

**(b) Retire the hand-rolled parked guard.** Delete the duplicate `readParked` reimplementation now that the front door owns it:

- `.claude/skills/qa-fix/SKILL.md` — the parked-guard comment block and its `jq`/`PARKED` conditional that immediately follow the `NODE_BODY=` assignment in the Idempotency preamble (the block beginning "Parked-node re-entry guard." around `:88`). Replace it with one sentence: *"The front door's selection gate owns the parked check — first-class `office_hours` and the `attributes.office_hours` squatter alike (`packages/intentionsutil/scripts/check-node-selection.ts:90-94`, applied at `:262-264`). A parked node exits 3 above; there is nothing to re-check here."*
- `.claude/skills/qa-fix/references/target-resolution.md:44-67` — delete the whole "Parked re-entry guard" section including its `jq` snippet, replacing it with the same one-sentence pointer. Also update the exit-code table at `:29-36`: row `3` becomes "the mechanical selection gate rejected the selection (phase, park, fingerprint, align-eligibility, reviewed marker) → clean stop, `exit 0`", and add a row `5` for scope-stale.

**Explicitly out of scope:** wiring `mark-node-terminal` into these skills' stale-selection paths. The phase skills' node-terminal marker coverage is a separate known gap owned elsewhere; do not touch `packages/intentionsutil/scripts/mark-node-terminal` or `dispatch-self-close` in this PR.

---

## Unit 4 — Bind the gate to `/align-tactics` Step 0

**Recommended model:** sonnet

**Dependencies:** Unit 1.

### Scope

Edit **only** `.claude/skills/align-tactics/SKILL.md`, Step 0 item 3 (`:103-119`).

Append to that item, after the existing `assert-worktree-fresh` paragraph, a new mandatory action — run **unconditionally, on both entry paths** (including the `provision-node-worktree` path, where it is a ~0.7s idempotent re-run; uniform doctrine is the point of this tactic, and a run that provisions once but re-enters later would otherwise slip through):

```bash
.claude/skills/dispatch-propagate/scripts/assert-node-selection "<target-node-id>" align-tactics
```

Prose to write alongside it:

- Run it **in the worktree**, after `assert-worktree-fresh`, and **before any graph read** — before any `readNode` or drift grep.
- `align-tactics` is the correct `<selected-phase>` for **both** target kinds this skill handles. For a `strategy-<slug>` target, `check-node-selection.ts:230-236` requires `kind: strategy` still at its native null phase and defers wholesale to `strategyAlignSelectable` (`:271-280`). For a `tactic-<slug>` target — draft/raw finalize **or** soft-frozen re-plan — `:237-243` skips the phase literal and defers wholesale to `frozenTacticSelectable` (`:281-288`), which is membership in the selector's own candidate list (`router.ts:517-521`). The selector emits an uncapped, fully-sorted candidate list, so a low-ranked draft is still admitted; ranking never causes a false exit 12.
- **Exit routing:**
  - `0` — proceed.
  - `12` — the selection is no longer valid: the node advanced past draft and is not soft-frozen, was parked to `office_hours`, was resolved or pruned, or has incomplete blockers. **STOP.** Report `skipped`, make **no** graph write, open no PR, and record the terminal disposition so the Stop hook can reap the job — the same call and safety note this step already uses for the held-claim case at `:96-98`:
    ```bash
    packages/intentionsutil/scripts/mark-node-terminal "<target-node-id>" no-claim
    ```
    `no-claim` is the right existing disposition (`mark-node-terminal:28` — "the session held no claim and did nothing (safe to reap)"); the vocabulary is enumerated and validated at `mark-node-terminal:74`, so do not invent a new value.
  - `13` — not reachable at this phase (`SCOPE_CHAINED_PHASES` is `fix`/`qa`/`review` only, `check-node-selection.ts:89`). Treat it as a mechanical error: **STOP**, make no graph write, report it, AND record the terminal disposition with `mark-node-terminal "<target-node-id>" no-claim` — exactly as the `12` and `15` bullets do. Being "not reachable" is not a reason to skip the marker: an unreachable path that leaks a job slot when reached is worse than one that reports and reaps.
  - any other non-zero — mechanical error. **STOP**, report it plainly, AND record the terminal disposition with `mark-node-terminal "<target-node-id>" no-claim`. The gate runs at Step 0, BEFORE any graph write, so a session that fails it did nothing and lost nothing — the same reasoning the `12` and `15` bullets already carry. Reaping does not suppress the error (still on stderr and in the journal); WITHOUT the marker `dispatch-self-close` holds the node worker alive and `graph-select-target` then skips the node as `live-session` forever — permanently unselectable, permanently consuming a job slot. Written as "any other non-zero" and NOT as literal `2`, because these do not share an exit code: a malformed store exits `2` from `check-node-selection` itself; an unresolvable project root exits `2` from the WRAPPER (`assert-node-selection:113-116`, the `exit 2` at `:115`); a failed `git fetch` exits `1` (`:139-142`, the `exit 1` at `:141`) — the common transient case, and the reason narrowing this to `2` would silently leave it unrouted. A stale selection is **not** an `office_hours` park and **not** a defect; a mechanical error is neither either — it is a broken environment to report, per `.claude/rules/code-style.md`.
- **Deliberately not gated:** `/office-hours`, `/align-strategy`, `/align-init`, `/grounding-research`. Record the one-line reason for each (they are given in this plan's Context, "Scope boundary"), so a later reader does not "complete" the rollout by wiring a gate that would break `/office-hours` outright.

**Out of scope:** `align-strategy/SKILL.md`, `align-init/SKILL.md`, `grounding-research/SKILL.md`, `office-hours/SKILL.md`, and `assert-worktree-fresh` itself (it stays a freshness-only primitive; the gate slots *alongside* it, never inside it — its other four callers have no phase to pass).

---

## Reuse

- `packages/intentionsutil/scripts/check-node-selection.ts` — **the** gate. `evaluateSelection` (`:182-352`) is a pure, importable, fully unit-tested function; `main` (`:384-389`) is the thin CLI. Never re-derive any of its five checks.
- `packages/intentionsutil/scripts/check-node-selection.ts:58-59` — `EXIT_STALE_SELECTION` (12) / `EXIT_SCOPE_STALE` (13), the exit vocabulary to pass through.
- `.claude/skills/dispatch-propagate/scripts/provision-node-worktree:116-141` — the reference call site: `GATE_FP=$(...)` / `GATE_RC=$?` capture shape, the `--dir`/`--stamp` invocation, the 12/13 passthrough, and the `$PROJECT_ROOT/.claude/worktrees/<node-id>.scope-fingerprint` sidecar convention.
- `.claude/skills/dispatch-propagate/scripts/lib-graph-worktree.sh:27-42` — `resolve_main_worktree`, honoring the `DISPATCH_GRAPH_MAIN_WORKTREE` test override.
- `.claude/skills/dispatch-propagate/scripts/lib.sh:1837-1841` — `resolve_project_root` (fallback root resolution).
- `.claude/skills/dispatch-propagate/scripts/dispatch-derive-node-target:52-53, :67-70` — `SCRIPT_DIR`/`REPO_ROOT` derivation and the node-id validation regex + message shape.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-derive-node-target.sh:1-120` — the bare-origin + working-checkout git fixture pattern (`make_repo`, `write_node_fixture`) to model the new suite on.
- `.claude/skills/dispatch-propagate/scripts/test-helpers.sh` — `assert_eq`, `assert_contains`, `report_results`.
- `.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh:37-39, :89` — the `npx` PATH-shim pattern, and its explicit note that the gate's arg-forwarding/exit-12/13 plumbing is *not* covered there. The new suite is where that coverage lands.
- `packages/intentionsutil/src/router.ts:496-521` — `strategyAlignSelectable` / `frozenTacticSelectable`, the selector-backed predicates the gate defers to.
- `packages/intentionsutil/scripts/mark-node-terminal:74` — the validated disposition vocabulary (`no-claim`).
- `packages/intentionsutil/test/check-node-selection.test.ts` — existing coverage of the gate's own verdicts; the new suites cover *plumbing*, so do not duplicate verdict cases already asserted there.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-assert-node-selection.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-derive-node-target.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh
```

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
bash -n .claude/skills/dispatch-propagate/scripts/assert-node-selection && bash -n .claude/skills/dispatch-propagate/scripts/dispatch-derive-node-target
```

**Sandbox note for local runs.** These suites shell out to `npx tsx` / `node --import tsx/esm`. Under Claude's default sandbox, tsx fails to open its IPC pipe with `Error: listen EPERM: operation not permitted /tmp/claude-*/tsx-*/N.pipe` — a sandbox artifact, not a test failure. Re-run any failing suite with `dangerouslyDisableSandbox: true` before diagnosing a real defect. CI is unaffected.

**Manual end-to-end — the gate actually fires (do this; it is the acceptance evidence).** From the node's worktree, with `origin/main` fetched:

1. `assert-node-selection tactic-phase-entry-selection-gate align-tactics` — expect exit 0 and a 64-hex fingerprint on stdout. (Confirmed working at plan time via `check-node-selection.ts` directly against the full `intentions/` tree: exit 0, ~0.7s over 445 node files.)
2. `assert-node-selection tactic-phase-entry-selection-gate implement` — expect exit 12 and a `stale-selection: phase:` line on stderr.
3. `assert-node-selection tactic-does-not-exist-at-all implement` — expect exit 12, check 1 ("no longer in the store").
4. `assert-node-selection tactic-phase-entry-selection-gate align-tactics --dir ./intentions` — expect the same verdict as (1) with **no** `git fetch` (confirms the `--dir` passthrough that `dispatch-derive-node-target` relies on).

**Manual — the front door's new verdicts.** From a phase worktree whose branch equals a node id at a known phase, run `dispatch-derive-node-target <node-id> --expect-phase <its-phase> --pr-mode none` and confirm exit 0 with the unchanged `=== NODE …` / `PHASE:` / `PR:` / `=== NODE-JSON ===` / `=== NODE-BODY ===` payload shape — the five consuming skills parse those section markers with `sed`, so any drift in them silently unbinds `PR_NUM`/`NODE_JSON`/`NODE_BODY` downstream. Then temporarily park that node locally (edit only the `origin/main` snapshot is not possible; instead point the gate at a fixture store via the Unit 1 suite) — the parked→exit-3 path is asserted mechanically in the test suites rather than against live `origin/main`.

**Judgment call to confirm at review time.** Unit 3 changes exit 3's routing in five skills from `exit 1` to `exit 0`. Read each skill's surrounding prose after the edit and confirm nothing downstream treats "the preamble bash exited 0" as "the target was successfully derived" — every one of them must have the model stop on the printed reason rather than continue into Step 1 with unbound `NODE_JSON`. This is prose-level, not mechanically checkable.

## needs-main residue

### 1. Watch post-merge dispatch ticks for a burst of exit-3 stops from `/review-fix` caused by the new reviewed-marker guard
- URL path: current
- Expected outcome: A small trickle of exit-3 stops from `/review-fix` is expected after merge (the gate legitimately catching a hand-run/re-entry). A burst would instead signal nodes being re-selected for review after the `reviewed` marker landed — a selector-side issue worth its own tactic, not a reason to weaken this gate.
- Finding: Not assertable at merge time by any mechanical check available now — this PR's own "Observe in production" section names it as requiring live post-merge dispatch tick traffic that does not exist yet. QA's Opus disposition pass (this PR's qa-fix run) classified it `needs-main` given `Flag: planned-deferral` in the triage plan.
- Verifiability: WAIT — awaiting several dispatch ticks after this PR merges, so `/review-fix` front-door exits can accumulate.
- Check: grep dispatch session transcripts / journal for `/review-fix` sessions whose front door emitted `selection no longer valid at origin/main (front door exit 3)` (the exact stderr line `review-fix/SKILL.md`'s exit-3 arm prints); count occurrences over the ticks following this PR's merge and judge trickle vs. burst.

**Observe in production.** After merge, the first `/align-tactics` re-invocation against an already-finalized node should stop at Step 0 with a `stale-selection` line instead of reasoning its way to a no-op through the skill body's Idempotency prose — the 2026-07-18 incident class this tactic exists to close. Watch the next few dispatch ticks for an unexpected rise in exit-3 stops from `/review-fix`: that is the new `reviewed`-marker guard firing, and a burst of it means nodes are being re-selected for review after the marker landed, which is a selector-side signal worth a separate tactic rather than a reason to weaken this gate.
