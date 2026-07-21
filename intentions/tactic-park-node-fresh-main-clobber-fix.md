---
id: tactic-park-node-fresh-main-clobber-fix
kind: tactic
statement: park-node writes office_hours against fresh origin/main (never the
  local stale worktree) and the Stop-hook backstop consumes its marker files
  after a successful park, so a deviation park can neither re-fire every turn
  nor silently clobber newer landed graph state
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-19 while a human picked up the parked node-worker
  job for tactic-graph-review-exclusion-stall-recovery in-session (PR #2920):
  the node's body revision was silently reverted TWICE (park commits a905956a,
  e130a665) before the cause was found. Two orthogonal defects compound. Second
  occurrence of the same class — tactic-align-doc-completeness-over-commit-noise
  hit it too (unpark commit e92d05bb noted the Stop-hook backstop re-parked from
  stale uncleared marker files). Finalized 2026-07-19 by an /align-tactics
  per-node pass into a full clean-session implementation plan; verified against
  the live files (dispatch-stop.sh, park-node) and cross-checked against
  tactic-graph-commit-auto-serialization (graph-commit's own conflict-resolution
  ladder, complementary — it only engages when a caller passes --base or a
  rebase CONFLICT occurs, neither of which park-node triggers today) and
  tactic-graph-node-session-reap (an adjacent, non-overlapping edit to the same
  dispatch-stop.sh function, currently unmerged as PR #2922) to confirm no scope
  overlap."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 70
  override: null
  rationale: "Author-directed 2026-07-19: boost to top ranking. Sized above the
    live dispatch composed max (69.33, tactic-graph-commit-auto-serialization)
    so a childless tactic serving strategy-graph-native-dispatch (base 5.33)
    composes to 75.33 once finalized/selected. Silent reversion of landed graph
    state is a data-loss class defect worth fixing before lower-severity queue
    work."
phase: review
execution:
  branch: tactic-park-node-fresh-main-clobber-fix
  pr: 2928
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# park-node fresh-origin/main write + one-shot deviation marker

## Context

A deviation park writes `office_hours` onto a node so the router stops
selecting it. Two orthogonal defects in that write path combine into a
silent, repeated clobber of newer landed graph state. Both were observed live
on 2026-07-19 while a human picked up the parked node-worker job for
`tactic-graph-review-exclusion-stall-recovery` (PR #2920): a body revision
that had already landed on `origin/main` was silently reverted twice (park
commits `a905956a`, `e130a665`) before the cause was found. The same class
recurred earlier on `tactic-align-doc-completeness-over-commit-noise` (unpark
commit `e92d05bb`). Recurrence across unrelated nodes makes this systemic,
not node-specific.

The two defects (line anchors below verified against the live files as of
this finalize — `.claude/hooks/dispatch-stop.sh` 77 lines,
`packages/intentionsutil/scripts/park-node` 70 lines):

1. **The Stop hook never consumes its marker files.**
   `.claude/hooks/dispatch-stop.sh:50-73` parks whenever
   `$CLAUDE_JOB_DIR/office-hours-reason` is non-empty (`[ -s ]`, line 52),
   calling `park-node "$JOB_NAME" "$_OH_REASON" ["$_OH_RECO"]` (lines 64-70),
   but never removes the marker files afterward. In the pure autonomous flow
   the job ends right after the park, so this is invisible; but when a
   session keeps producing Stop events after its deviation park — exactly the
   office-hours workflow where a human picks up a parked job in-session — it
   re-parks on *every* turn boundary.

2. **`park-node` writes from the local (possibly stale) worktree, not
   origin/main.** `packages/intentionsutil/scripts/park-node:30-70` sets
   `INTENTIONS_DIR="$REPO_ROOT/intentions"` (line 32) and does
   `readNode(intentionsDir, id)` → `node.office_hours = {…}` →
   `writeNode(intentionsDir, node)` (lines 52-56) → `graph-commit "$NODE_ID"`
   with no `--base` (line 65). It reads the *local* node file. Run from a
   stale PR-branch worktree (which the Stop-hook backstop does — its own
   header comment notes it skips the reset-dance), `writeNode` preserves the
   stale on-disk body and `graph-commit` lands it over `origin/main`. There is
   no `--base` CAS guard, so nothing catches the stale write — the local
   commit's diff (typically just the `office_hours` addition, since the rest
   of the file is unchanged from the stale local read) can apply cleanly onto
   `origin/main`'s tip even when the file's *other* content (body, another
   frontmatter field) has moved on, silently reverting whatever the stale
   local copy was missing.

Defect 1 controls how often a re-park fires; defect 2 is why a re-park
corrupts state. Either alone is a bug; together they produce an every-turn
silent clobber.

**Scope check against neighboring in-flight tactics** (greenfield-relevance
gate, run against live `origin/main` state during this finalize):

- `tactic-graph-commit-auto-serialization` (`phase: implement`, live) adds an
  automatic field-level merge ladder *inside* `graph-commit`'s own
  `try_land()`/`check_base_freshness()`, but that ladder only engages when a
  rebase hits a real git textual `CONFLICT` or a caller passed `--base` and
  it went stale. `park-node` today does neither (no `--base` at all, and its
  stale-based diff is usually too small to textually conflict) — so that
  ladder never gets a chance to run for this defect. This tactic's Unit 2
  (making `park-node` pass `--base`) is a *prerequisite* for that ladder to
  even see park-node's writes, not a duplicate of it. Complementary, not
  overlapping.
- `tactic-graph-node-session-reap` (`phase: qa`, PR #2922, not yet merged to
  `main`) inserts a self-close call immediately *after* the same
  `office-hours-reason`/park-backstop block in `dispatch-stop.sh` closes (its
  own plan cites inserting after that block's closing `fi`). This tactic's
  Unit 1 edits *inside* that block (right after each `park-node` call, lines
  65/68 below) — a different insertion point in the same function, not an
  overlapping one. If PR #2922 lands first, the block's line numbers shift
  but its structure (the `if [ -n "$_OH_RECO" ]; then ... else ... fi` split
  around the two `park-node` call sites) is unaffected; locate the call
  sites by the `"$_PARK" "$JOB_NAME"` text, not by line number, if this unit
  is implemented after PR #2922 merges.
- `tactic-graph-commit-park-context` (`phase: qa`) changes `park_write()`'s
  *content* (recommendation text, snapshot pointer) inside `graph-commit`
  itself — a different function in a different script from both units here.
  No overlap.

## Scope

**Unit 1 — one-shot deviation markers (Stop hook).**
`.claude/hooks/dispatch-stop.sh`, inside the existing
`if [[ -n "$JOB_NAME" && ... ]]; then ... fi` block (lines 50-73). The two
`park-node` invocations sit at lines 65 and 68:

```bash
      if [ -n "$_OH_RECO" ]; then
        "$_PARK" "$JOB_NAME" "$_OH_REASON" "$_OH_RECO" >/dev/null 2>&1 \
          || echo "[dispatch-stop] WARNING: park-node for '$JOB_NAME' failed (non-fatal)" >&2
      else
        "$_PARK" "$JOB_NAME" "$_OH_REASON" >/dev/null 2>&1 \
          || echo "[dispatch-stop] WARNING: park-node for '$JOB_NAME' failed (non-fatal)" >&2
      fi
```

Restructure each branch so the exit status gates a delete instead of just an
`||` echo — e.g.:

```bash
      if [ -n "$_OH_RECO" ]; then
        if "$_PARK" "$JOB_NAME" "$_OH_REASON" "$_OH_RECO" >/dev/null 2>&1; then
          rm -f "$_OH_REASON_FILE" "$CLAUDE_JOB_DIR/office-hours-recommendation"
        else
          echo "[dispatch-stop] WARNING: park-node for '$JOB_NAME' failed (non-fatal)" >&2
        fi
      else
        if "$_PARK" "$JOB_NAME" "$_OH_REASON" >/dev/null 2>&1; then
          rm -f "$_OH_REASON_FILE"
        else
          echo "[dispatch-stop] WARNING: park-node for '$JOB_NAME' failed (non-fatal)" >&2
        fi
      fi
```

(`$_OH_REASON_FILE` is already bound at line 51 to
`$CLAUDE_JOB_DIR/office-hours-reason`.) A genuinely new deviation rewrites the
markers on the next in-session write, so consuming them on success loses
nothing; leaving them on failure preserves the signal for the next Stop event
to retry (this also matters once Unit 2 lands — a `--base` CAS rejection is a
legitimate `park-node` failure this same guard must not delete markers for).
Out of scope: the marker *authoring* sites in the phase skills (`/implement`
etc.) — they already write the markers correctly; only the hook's
consume-after-use is missing.

**Unit 2 — fresh-origin/main park write (park-node).**
`packages/intentionsutil/scripts/park-node`. The `office_hours` write must be
computed against fresh `origin/main`, never the invoking worktree's stale
copy. Concretely, before the existing `readNode`/mutate/`writeNode` block
(lines 50-63):

1. `git -C "$REPO_ROOT" fetch origin main` — die with a clear message on
   failure (an unreachable `origin/main` is genuine environment breakage,
   not a content divergence; matches `.claude/rules/code-style.md`'s
   clear-error-over-fallback rule).
2. Resolve the fresh blob sha directly:
   `FRESH_BLOB="$(git -C "$REPO_ROOT" rev-parse "origin/main:intentions/$NODE_ID.md")"`
   — exits non-zero (and this script should too) if the node doesn't exist on
   `origin/main`, which is itself a signal something is wrong (parking a node
   that was pruned/never landed).
3. Overwrite the local file with `origin/main`'s content *before* the
   existing read: `git -C "$REPO_ROOT" show "origin/main:intentions/$NODE_ID.md" > "$INTENTIONS_DIR/$NODE_ID.md"`.
   The existing `readNode`/`node.office_hours = {…}`/`writeNode` block then
   operates on fresh content unchanged.
4. Change the `graph-commit` call (line 65) to pass the CAS token:
   `"$SCRIPT_DIR/graph-commit" --base "$NODE_ID=$FRESH_BLOB" -m "graph: park $NODE_ID ($REASON)" "$NODE_ID"`
   — so a write that lands on `origin/main` between steps 1-3 and the
   eventual push is refused mechanically (`graph-commit` today hard-`die()`s
   on a stale `--base`; that die is still a `park-node` failure, correctly
   left non-fatal by the Stop-hook backstop, and correctly *not* deleting the
   deviation markers once Unit 1 lands).

The invariant: **a park can never overwrite newer landed state, regardless of
which worktree invokes it.** Out of scope: changing `graph-commit`'s own
`--base`/conflict handling (`tactic-graph-commit-auto-serialization`'s
territory) — `--base` already exists; this unit only makes `park-node` pass
it.

## Dependencies

None between the units — they touch different files and either can land
first. Unit 2 is the higher-severity fix (it is the one that actually
corrupts state); Unit 1 reduces the trigger frequency, and also makes a
Unit-2-triggered CAS rejection safely retryable instead of silently dropped.

## Reuse

- `graph-commit --base <id>=<blobsha>` CAS — already implemented
  (`packages/intentionsutil/scripts/graph-commit:32-41,164`).
- `git rev-parse origin/main:intentions/<id>.md` / `git show
  origin/main:intentions/<id>.md` — the direct fetch-then-read primitives;
  `.claude/skills/dispatch-propagate/scripts/assert-worktree-fresh` and
  `dispatch-merge-main` are the existing precedents for `git fetch origin
  main` + comparing/syncing against it from a bash script in this same
  scripts directory. (`git archive origin/main <path> | tar -xO` — used by
  `.claude/skills/implement/SKILL.md:48` — is an equivalent alternative read
  primitive if preferred; `git show`/`rev-parse` avoid the extra `tar`
  dependency and directly yield the blob sha needed for `--base`.)
- `packages/intentionsutil/scripts/apply-fix-state.ts` is the sibling
  precedent for a minimal, single-field state-only writer script that reads
  via `readNode`, mutates one field, writes via `writeNode`, and leaves
  committing to its caller — the shape `park-node` already follows and Unit 2
  keeps unchanged, only swapping the local read for a fresh one.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`'s
  existing `stopnc_setup`/`stopnc_run` harness (lines ~19203-19314) already
  fakes `park-node` with a controllable exit code (`park-exit` file) and logs
  every invocation to `park-calls.log` — Unit 1's tests extend this harness
  directly, no new fixture needed.

## Verification

- Unit 1: extend
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`'s
  `stopnc_*` block, inserting new cases after the existing "best-effort:
  park-node failure still exits 0" case (currently ending at line 19313,
  immediately before the `dispatch-finalize-phase tests` section header):
  - A case reusing `stopnc_setup`/`stopnc_state`/an `office-hours-reason`
    marker, running `stopnc_run` once (fake `park-node` exits 0 by default),
    then asserting `[ ! -e "$JOB_DIR/office-hours-reason" ]` — the marker is
    gone after a successful park.
  - The same setup but running `stopnc_run` a **second** time (marker
    already consumed) and asserting `park-calls.log` still has exactly 1
    line — a follow-up Stop event does not re-park.
  - A case with `1 > "$ROOT/park-exit"` (fake `park-node` fails, mirroring
    the existing failure case) asserting the marker file **still exists**
    after `stopnc_run` — a failed park preserves the signal for a retry.
  - Repeat the "marker gone after success" and "marker survives failure"
    cases for the reason+recommendation variant (both marker files).
- Unit 2: from a deliberately-behind worktree/clone (following
  `test-graph-commit.sh`'s `make_clone`/`sync_clone` pattern for setting up
  two divergent clones of the same origin), land a body/frontmatter change on
  `origin/main` for a scratch node, then invoke `park-node` for that node
  from the stale clone; assert the landed change survives (`office_hours`
  set, body/frontmatter intact) rather than being reverted. Separately,
  invoke `park-node` after a genuinely concurrent `origin/main` write lands
  between steps 1-3 and the `graph-commit` call (simulate by editing
  `origin/main` mid-script) and assert the park is refused (non-zero exit,
  no landed commit) rather than clobbering.
- `npx tsx packages/intentionsutil/scripts/validate-graph.ts` passes (no
  frontmatter shape changes in this tactic, but this is the standing
  graph-write gate).

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

## Recommended model

**Unit 1** — `sonnet` (mechanical: restructure two known `||`-echo call
sites into exit-status-gated deletes, plus harness-reusing test cases).
**Unit 2** — `opus` (judgment: fresh-origin/main read sequencing, CAS token
wiring, and getting the failure/retry posture right against a live landing
primitive that a sibling tactic is concurrently changing).

## Out of scope

- `graph-commit`'s own conflict-resolution ladder (`try_land()`,
  `check_base_freshness()`'s auto-merge behavior) —
  `tactic-graph-commit-auto-serialization`.
- `park_write()`'s park-record content (recommendation text, snapshot
  pointer, mailbox instructions) — `tactic-graph-commit-park-context`.
- The Stop-hook's self-close insertion after the park-backstop block —
  `tactic-graph-node-session-reap` (PR #2922).

## needs-main residue

- **id**: 8 — No further silent-clobber incidents in production over subsequent dispatch runs
  - url_path: current
  - expected_outcome: No production incidents of repeated re-park or silent clobber are observed after this fix ships.
  - finding: Only confirmable by monitoring live autonomous dispatch/graph state over time, not assertable at this PR's merge; the merge-time behavioral invariants (marker consumption, fresh-origin/main read-before-write, CAS refusal on concurrent advance, absent-node refusal) are already covered by qa-fix items 1-7, which all ran and PASSed: `bash .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` (2985/2985 passed), `bash packages/intentionsutil/scripts/test-park-node.sh` (3/3 passed), and `npx tsx packages/intentionsutil/scripts/validate-graph.ts` (ok, 400 nodes).
