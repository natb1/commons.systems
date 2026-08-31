#!/usr/bin/env bash
# Tests for reconcile-graph-review-stall's CI-PENDING LIVENESS BOUND
# (tactic-autonomous-ci-pending-liveness-bound, sub-unit 3).
#
# A tactic at phase:review carrying the `reviewed` marker is excluded from
# selector candidates entirely, so this sweep is its ONLY observer. A `pending`
# CI verdict folds to VERDICT="unknown", which reviewStallRoute maps to null —
# a silent no-op — and such a node has an armed auto-merge that can never fire.
# The sweep now counts consecutive `pending` observations of the SAME head SHA
# in a sidecar shared with graph-select-target, and at
# DISPATCH_CI_PENDING_STRIKE_CAP lands a `--kind ci-pending-stalled` hold.
#
# A NEW SUITE rather than more cases in test-graph-write-rollback.sh: that file
# is already ~2450 lines and has a concurrent appender, and both run-lint.sh and
# CI auto-glob "$SCRIPTS"/test-*.sh, so this file needs no registration
# anywhere.
#
# Harness: a real-execution seed repo (the sweep's enumeration runs the REAL
# store-cache/transitions/router through `node --import tsx/esm`, so the fixture
# carries a real packages/intentionsutil/src and a node_modules symlink), an
# `origin` bare remote (graph-commit's rollback primitive and the base pin both
# reach for it), the SUT plus every lib it sources copied in physically (it
# derives REPO_ROOT from its own on-disk location, so a symlink breaks it), and
# stubs for `gh`, `hold-node` and `graph-commit`. DISPATCH_GRAPH_MAIN_WORKTREE
# points resolve_main_worktree at the fixture, so the sidecar path is
# deterministic and no `git worktree list` runs.
#
# review_stall_gh_stub / review_stall_node are COPIED from
# test-graph-write-rollback.sh rather than imported — that file is a test
# script, not a library — and adapted here to serve a per-case CI verdict.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"

REAL_REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
INTENTIONSUTIL_SRC="$REAL_REPO_ROOT/packages/intentionsutil/src"
UTIL_SCRIPTS_SRC="$REAL_REPO_ROOT/packages/intentionsutil/scripts"

command -v jq >/dev/null || { echo "error: jq not found" >&2; exit 1; }

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
trap 'rm -rf "$WORK"' EXIT

SAVED_PATH="$PATH"

# --- Fixture -----------------------------------------------------------------

# rgs_gh_stub <bin-dir> <fixture-dir> — a `gh` standing in for the two REST
# surfaces this sweep polls. Copied from test-graph-write-rollback.sh's
# review_stall_gh_stub, with the check-runs reply read from a per-case file so a
# case can choose the CI verdict (pending vs concluded) rather than always red.
#   - `gh api repos/{owner}/{repo}/pulls/<n>` (gh_pr_view_rest) -> an OPEN,
#     MERGEABLE PR whose head sha is `deadbee<n>`.
#   - `gh api --paginate .../commits/<sha>/check-runs` (dispatch_ci_verdict_rest)
#     -> whatever checkruns.json holds.
rgs_gh_stub() {
  local bindir="$1" fixdir="$2"
  mkdir -p "$bindir" "$fixdir"
  cat >"$bindir/gh" <<'SH'
#!/usr/bin/env bash
path=""
for a in "$@"; do
  case "$a" in
    */pulls/*|*/check-runs) path="$a" ;;
  esac
done
echo "$path" >> "$GC_FIXTURE_DIR/gh-calls.log"
case "$path" in
  */check-runs)
    if [[ -f "$GC_FIXTURE_DIR/checkruns-fail" ]]; then
      echo "gh stub: simulated check-runs failure" >&2; exit 1
    fi
    # Per-SHA reply when the case wrote one, else the shared default. The
    # multi-candidate cases need DIFFERENT verdicts in one sweep (several
    # at-cap pending nodes plus one genuinely failing one); every pre-existing
    # case writes only checkruns.json and so is unaffected.
    sha="${path%/check-runs}"; sha="${sha##*/}"
    if [[ -f "$GC_FIXTURE_DIR/checkruns-$sha.json" ]]; then
      cat "$GC_FIXTURE_DIR/checkruns-$sha.json"
    else
      cat "$GC_FIXTURE_DIR/checkruns.json"
    fi ;;
  */pulls/*)
    num="${path##*/}"
    jq -n --argjson n "$num" '{
      number: $n, title: "harness pr", body: "",
      state: "open",
      merged_at: null,
      merge_commit_sha: null,
      mergeable: true, mergeable_state: "clean",
      head: {ref: "harness-branch", sha: ("deadbee" + ($n | tostring))},
      labels: []
    }' ;;
  *)
    echo "gh stub: unhandled invocation: $*" >&2; exit 1 ;;
esac
SH
  chmod +x "$bindir/gh"
}

# rgs_checks <fixture-dir> <pending|passing|failing> — the check-runs page that
# drives dispatch_classify_rollup to the named verdict. An IN-PROGRESS run with
# no conclusion is what `pending` means here, which is exactly the state this
# bound exists to terminate.
rgs_checks() { rgs_checks_file "$1/checkruns.json" "$2"; }

# rgs_checks_sha <fixture-dir> <sha> <verdict> — the same, but scoped to ONE
# head SHA, so one sweep can see several candidates with different verdicts.
rgs_checks_sha() { rgs_checks_file "$1/checkruns-$2.json" "$3"; }

# rgs_checks_file <path> <verdict> — the check-runs page itself.
rgs_checks_file() {
  case "$2" in
    pending) cat >"$1" <<'JSON'
{"check_runs": [
  {"name": "unit-tests", "status": "in_progress", "conclusion": null, "id": 1, "app": {"slug": "github-actions"}}
]}
JSON
      ;;
    passing) cat >"$1" <<'JSON'
{"check_runs": [
  {"name": "unit-tests", "status": "completed", "conclusion": "success", "id": 1, "app": {"slug": "github-actions"}}
]}
JSON
      ;;
    failing) cat >"$1" <<'JSON'
{"check_runs": [
  {"name": "unit-tests", "status": "completed", "conclusion": "failure", "id": 1, "app": {"slug": "github-actions"}}
]}
JSON
      ;;
  esac
}

# rgs_node <file> <id> <pr> — a tactic at phase:review carrying the `reviewed`
# marker, an OPEN PR, and no active fix interrupt: exactly the enumeration's
# candidate shape. Copied verbatim from test-graph-write-rollback.sh's
# review_stall_node.
rgs_node() {
  cat >"$1" <<NODE
---
id: $2
kind: tactic
statement: harness node for the review-stall recovery sweep
owner: ai
status: codified
phase: review
serves: []
execution:
  branch: $2
  pr: $3
  attempts: {}
  markers: [reviewed]
  strategy_fingerprint: null
  fix: null
  completion: null
office_hours: null
---
# harness node for the review-stall recovery sweep
NODE
}

# rgs_setup <tag> — build one case's world: a seed repo pushed to its own bare
# origin, the SUT and its libs copied in, stubs installed. Sets RGS_ROOT,
# RGS_BIN, RGS_FIX, RGS_SIDECAR.
#
# One origin per case: each case seeds an independent history, so a shared
# origin would reject the second push as a non-fast-forward.
rgs_setup() {
  local tag="$1"
  RGS_ROOT="$WORK/$tag"
  RGS_BIN="$WORK/$tag-bin"
  RGS_FIX="$WORK/$tag-fixtures"
  local origin="$WORK/$tag-origin.git"

  mkdir -p "$RGS_ROOT/intentions" \
           "$RGS_ROOT/packages/intentionsutil/scripts" \
           "$RGS_ROOT/packages/intentionsutil/src" \
           "$RGS_ROOT/.claude/skills/dispatch-propagate/scripts" \
           "$RGS_ROOT/.claude/worktrees"
  # The enumeration runs the REAL store-cache/transitions/router, so the fixture
  # needs the real src tree, the package.json that makes it ESM, and a
  # node_modules symlink (untracked — graph-commit's assert_clean_outside_ids
  # exempts '??').
  cp -r "$INTENTIONSUTIL_SRC/." "$RGS_ROOT/packages/intentionsutil/src/"
  cp "$REAL_REPO_ROOT/packages/intentionsutil/package.json" \
     "$RGS_ROOT/packages/intentionsutil/package.json"
  # apply-fix-state.ts is the real store-mutation primitive behind the `fix`
  # route, which case 3 asserts still runs.
  cp "$UTIL_SCRIPTS_SRC/apply-fix-state.ts" \
     "$RGS_ROOT/packages/intentionsutil/scripts/apply-fix-state.ts"
  # Physical copies, not symlinks: the SUT derives REPO_ROOT from its own
  # on-disk location.
  cp "$SCRIPT_DIR/reconcile-graph-review-stall" \
     "$SCRIPT_DIR/lib.sh" "$SCRIPT_DIR"/lib-*.sh \
     "$RGS_ROOT/.claude/skills/dispatch-propagate/scripts/"
  chmod +x "$RGS_ROOT/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"

  # graph-commit stub: logs its argv so a case can tell a batched fix-state
  # landing from no landing at all.
  cat >"$RGS_ROOT/packages/intentionsutil/scripts/graph-commit" <<SH
#!/usr/bin/env bash
printf '%s\n' "\$*" >> "$RGS_FIX/graph-commit-calls.log"
exit 0
SH
  chmod +x "$RGS_ROOT/packages/intentionsutil/scripts/graph-commit"
  # hold-node stub: logs its argv and prints the one stdout line the sweep
  # parses the hold id off. The real hold-node's landing behaviour is covered by
  # its own suite; what matters here is that the sweep invokes it with the right
  # kind and reads its id back.
  cat >"$RGS_ROOT/packages/intentionsutil/scripts/hold-node" <<SH
#!/usr/bin/env bash
printf '%s\n' "\$*" >> "$RGS_FIX/hold-node-calls.log"
printf 'hold\n' >> "$RGS_FIX/lock-order.log"
if [[ -f "$RGS_FIX/hold-node-fail" ]]; then
  echo "hold-node stub: simulated failure" >&2
  exit 1
fi
echo "landed tactic-hold-ci-stalled-harness"
exit 0
SH
  chmod +x "$RGS_ROOT/packages/intentionsutil/scripts/hold-node"

  rgs_gh_stub "$RGS_BIN" "$RGS_FIX"
  rgs_checks "$RGS_FIX" pending
  ln -s "$REAL_REPO_ROOT/node_modules" "$RGS_ROOT/node_modules"

  git init -q -b main "$RGS_ROOT"
  git -C "$RGS_ROOT" config user.email harness@test
  git -C "$RGS_ROOT" config user.name harness
  git init -q --bare "$origin"
  git -C "$origin" symbolic-ref HEAD refs/heads/main
  git -C "$RGS_ROOT" remote add origin "$origin"

  RGS_SIDECAR="$RGS_ROOT/.claude/worktrees/t-rs1.ci-pending-strikes"
}

# rgs_seal — commit and push the seeded intentions/ tree. Called after the
# case's nodes are written.
rgs_seal() {
  git -C "$RGS_ROOT" add -A
  git -C "$RGS_ROOT" commit -qm seed
  git -C "$RGS_ROOT" push -q origin main
}

# rgs_seed_sidecar <sha> <count>
rgs_seed_sidecar() { printf '%s %s\n' "$1" "$2" > "$RGS_SIDECAR"; }

# rgs_seed_sidecar_for <id> <sha> <count> — the same for a node other than
# t-rs1, for the multi-candidate cases.
rgs_seed_sidecar_for() {
  printf '%s %s\n' "$2" "$3" > "$RGS_ROOT/.claude/worktrees/$1.ci-pending-strikes"
}

# rgs_sidecar_for <id> — that node's sidecar content, or `gone` when absent.
rgs_sidecar_for() {
  local f="$RGS_ROOT/.claude/worktrees/$1.ci-pending-strikes"
  [ -e "$f" ] && cat "$f" || echo gone
}

# rgs_sidecar — the sidecar's content, or the literal `gone` when absent.
rgs_sidecar() { [ -e "$RGS_SIDECAR" ] && cat "$RGS_SIDECAR" || echo gone; }

rgs_holds() { [ -f "$RGS_FIX/hold-node-calls.log" ] && cat "$RGS_FIX/hold-node-calls.log" || echo none; }

# rgs_lock_stub — install a dispatch-acquire-lock stub NEXT TO the SUT copy, so
# refresh_lock's `[[ -x "$SCRIPT_DIR/dispatch-acquire-lock" ]]` guard passes and
# each heartbeat is appended to the SAME ordered log the hold-node stub writes
# `hold` to. Ordering, not counting, is what discriminates the bracket: a
# refresh only BEFORE the hold leaves `hold` as the last line.
#
# Installed per-case rather than in rgs_setup: every pre-existing case asserts
# against a fixture where refresh_lock is a no-op, and the ordering cases are
# the only ones that need the seam.
rgs_lock_stub() {
  cat >"$RGS_ROOT/.claude/skills/dispatch-propagate/scripts/dispatch-acquire-lock" <<SH
#!/usr/bin/env bash
printf '%s\n' "heartbeat \$*" >> "$RGS_FIX/lock-order.log"
[[ "\${1:-}" == --wait ]] && echo acquired
exit 0
SH
  chmod +x "$RGS_ROOT/.claude/skills/dispatch-propagate/scripts/dispatch-acquire-lock"
}

# rgs_lock_order — the interleaved hold/heartbeat log, or `none` when absent.
rgs_lock_order() {
  [ -f "$RGS_FIX/lock-order.log" ] && cat "$RGS_FIX/lock-order.log" || echo none
}

# rgs_last_event — the LAST line's event word (`hold` or `heartbeat`).
rgs_last_event() { rgs_lock_order | tail -1 | awk '{print $1}'; }

# rgs_run — run the sweep from the fixture root with the stubs on PATH.
# DISPATCH_GRAPH_MAIN_WORKTREE pins resolve_main_worktree at the fixture, so the
# sidecar lands where the assertions look and no `git worktree list` runs.
rgs_run() {
  ( cd "$RGS_ROOT" || exit 99
    export PATH="$RGS_BIN:$SAVED_PATH"
    export GC_FIXTURE_DIR="$RGS_FIX"
    export DISPATCH_GRAPH_MAIN_WORKTREE="$RGS_ROOT"
    unset DISPATCH_CI_VERDICT_CACHE DISPATCH_GRAPH_NODE_CACHE
    bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall "$@" \
      2>"$RGS_FIX/stderr.txt" )
}

# rgs_dirty — `intentions/` must be clean after every run. A leaked write trips
# graph-commit's assert_clean_outside_ids for EVERY graph writer in the
# checkout, not just this sweep.
rgs_dirty() { git -C "$RGS_ROOT" status --porcelain -- intentions | wc -l | tr -d ' '; }

# --- Case 1: pending below the cap — count, hold nothing, say nothing --------
echo "Test: reconcile-graph-review-stall — a pending verdict below the cap only bumps the sidecar"
rgs_setup c1
rgs_node "$RGS_ROOT/intentions/t-rs1.md" t-rs1 201
rgs_seal
rgs_seed_sidecar deadbee201 2
c1_out=$(rgs_run)
assert_eq "review-stall ci-stall: a below-cap pending sweep prints nothing" "" "$c1_out"
assert_eq "review-stall ci-stall: the sidecar increments on the same head SHA" \
  "deadbee201 3" "$(rgs_sidecar)"
assert_eq "review-stall ci-stall: no hold lands below the cap" "none" "$(rgs_holds)"
assert_eq "review-stall ci-stall: intentions/ is left clean below the cap" "0" "$(rgs_dirty)"

# --- Case 2: pending AT the cap — the hold lands and the ladder is cleared ---
echo "Test: reconcile-graph-review-stall — the cap-th pending observation lands a ci-pending-stalled hold"
rgs_setup c2
rgs_node "$RGS_ROOT/intentions/t-rs1.md" t-rs1 201
rgs_seal
rgs_seed_sidecar deadbee201 7
c2_out=$(rgs_run)
assert_eq "review-stall ci-stall: hold-node is invoked with the new kind and the node id" \
  "1" "$(case "$(rgs_holds)" in *"t-rs1 --kind ci-pending-stalled"*) printf 1 ;; *) printf 0 ;; esac)"
assert_eq "review-stall ci-stall: exactly one held line on stdout" \
  "1" "$(grep -c '^held t-rs1 -> ci-stalled via ' <<<"$c2_out")"
assert_eq "review-stall ci-stall: the held line carries the sha and the strike count" \
  "1" "$(case "$c2_out" in *"(sha=deadbee201 strikes=8)"*) printf 1 ;; *) printf 0 ;; esac)"
assert_eq "review-stall ci-stall: the sidecar is cleared once the hold lands" \
  "gone" "$(rgs_sidecar)"
assert_eq "review-stall ci-stall: intentions/ is left clean after the hold" "0" "$(rgs_dirty)"

# --- Case 3: a concluded verdict clears AND still falls through --------------
# The load-bearing half is the FALL-THROUGH, not the clear: a `continue` written
# where a fall-through belongs would silently retire the sweep's whole reason
# for existing. `failing` is used rather than `passing` because it is the one
# verdict with an observable downstream act — the `fix` route — so the routing
# outcome can be asserted rather than merely inferred.
echo "Test: reconcile-graph-review-stall — a concluded verdict clears the ladder and still routes"
rgs_setup c3
rgs_node "$RGS_ROOT/intentions/t-rs1.md" t-rs1 201
rgs_seal
rgs_checks "$RGS_FIX" failing
rgs_seed_sidecar deadbee201 4
c3_out=$(rgs_run)
assert_eq "review-stall ci-stall: a concluded verdict clears the sidecar" \
  "gone" "$(rgs_sidecar)"
assert_eq "review-stall ci-stall: a concluded verdict lands no hold" "none" "$(rgs_holds)"
assert_eq "review-stall ci-stall: the candidate still falls through to the fix route" \
  "1" "$(grep -c '^recovered t-rs1 -> fix' <<<"$c3_out")"
assert_eq "review-stall ci-stall: the fix route still lands its batched graph-commit" \
  "1" "$([ -f "$RGS_FIX/graph-commit-calls.log" ] && echo 1 || echo 0)"

# --- Case 4: a gh failure neither bumps nor clears ---------------------------
# An empty RAW_VERDICT means dispatch_ci_verdict_rest itself failed. That is not
# evidence in either direction: counting it would let an outage walk every
# reviewed node to its cap, and clearing it would discard a real ladder. The
# sidecar is seeded first so BOTH directions are discriminated by one assertion.
echo "Test: reconcile-graph-review-stall — a CI-fetch failure neither bumps nor clears the ladder"
rgs_setup c4
rgs_node "$RGS_ROOT/intentions/t-rs1.md" t-rs1 201
rgs_seal
touch "$RGS_FIX/checkruns-fail"
rgs_seed_sidecar deadbee201 5
rgs_run >/dev/null
assert_eq "review-stall ci-stall: a failed CI fetch leaves the sidecar untouched" \
  "deadbee201 5" "$(rgs_sidecar)"
assert_eq "review-stall ci-stall: a failed CI fetch lands no hold" "none" "$(rgs_holds)"

# --- Case 5: the widened early exit (the BC4 regression) ---------------------
# A sweep whose ONLY actionable candidate is an at-cap pending node has an EMPTY
# RECOVERED_IDS. With the pre-existing `[[ ${#RECOVERED_IDS[@]} -eq 0 ]] && exit
# 0` guard the script exits before the hold block, so the hold is dead code on
# exactly the sweeps this route exists to serve. Cases 1-4 all pass under that
# bug for the below-cap paths; THIS is the case that catches it.
echo "Test: reconcile-graph-review-stall — an at-cap pending node still holds when nothing was recovered"
rgs_setup c5
rgs_node "$RGS_ROOT/intentions/t-rs1.md" t-rs1 201
rgs_seal
rgs_seed_sidecar deadbee201 7
c5_out=$(rgs_run)
assert_eq "review-stall ci-stall: no fix-state write was staged, so RECOVERED_IDS is empty" \
  "0" "$([ -f "$RGS_FIX/graph-commit-calls.log" ] && echo 1 || echo 0)"
assert_eq "review-stall ci-stall: the hold lands anyway (the widened early exit)" \
  "1" "$(grep -c '^held t-rs1 -> ci-stalled via ' <<<"$c5_out")"
assert_eq "review-stall ci-stall: hold-node really ran on the empty-RECOVERED_IDS sweep" \
  "1" "$(case "$(rgs_holds)" in *"--kind ci-pending-stalled"*) printf 1 ;; *) printf 0 ;; esac)"

# --- Case 6: an explicit --node run must NOT burn the shared strike ladder ----
# graph-select-target exempts its own NODE_TARGET lane ("a human re-running
# `dispatch <id>` must not burn the autonomous budget"), and BOTH surfaces write
# the SAME sidecar file per node — so an exemption on only one of them is no
# exemption at all.
#
# The cadence is what makes this bite. dispatch-ladder-run's reconcile_pass
# calls this script with `--node <id>` once per ci-wait poll (`sleep $POLL_S`,
# 60s by default, for up to --ci-wait-s 3600s), while the strike cap of 8 was
# sized for the 15-minute OnCalendar tick. A healthy tactic whose CI takes an
# ordinary 12 minutes would reach the cap in ~8 minutes and be held — and the
# driver only greps `^recovered <id> `, so it never sees the `held` line, polls
# out its whole budget and halts idle, leaving a node needing manual
# office-hours resolution.
#
# Seeded at 7 (one below the cap of 8) so a single un-exempted bump would land
# the hold: the assertions discriminate the exemption directly rather than
# inferring it from a count.
echo "Test: reconcile-graph-review-stall — an explicit --node run neither bumps the ladder nor holds"
rgs_setup c6
rgs_node "$RGS_ROOT/intentions/t-rs1.md" t-rs1 201
rgs_seal
rgs_seed_sidecar deadbee201 7
c6_out=$(rgs_run --node t-rs1)
assert_eq "review-stall ci-stall: an explicit --node run leaves the sidecar untouched" \
  "deadbee201 7" "$(rgs_sidecar)"
assert_eq "review-stall ci-stall: an explicit --node run lands no hold" "none" "$(rgs_holds)"
assert_eq "review-stall ci-stall: an explicit --node run prints no held line" \
  "0" "$(grep -c '^held t-rs1 -> ci-stalled via ' <<<"$c6_out")"
# The exemption must be a bump guard, not a lane that skips the sweep: the
# candidate still has to be enumerated, polled and routed under --node.
assert_eq "review-stall ci-stall: the --node candidate was still polled (the sweep ran)" \
  "1" "$(grep -c 'check-runs' "$RGS_FIX/gh-calls.log")"

# --- Case 7: at-cap recordings must not spend the budget they never land -----
# Only CI_STALL_IDS[0] is landed (the tail block: "ONE hold per run"), but every
# at-cap candidate used to charge ACTED. ACTED/CAP exist to bound LOCK-HOLDING
# work — the comment on the below-cap path says exactly that — and a recording
# holds no lock.
#
# With CAP=2: t-rs1 and t-rs2 are both at-cap pending, t-rs3 is genuinely
# failing and is the `fix` route this sweep exists for. Enumeration is sorted by
# id (store.ts's readdirSync(...).sort()), so t-rs3 is reached LAST — the
# position that starves. Before the fix both pending nodes charge ACTED, the
# loop breaks at 2, and t-rs3 is never recovered.
echo "Test: reconcile-graph-review-stall — at-cap recordings do not starve the fix route"
rgs_setup c7
rgs_node "$RGS_ROOT/intentions/t-rs1.md" t-rs1 201
rgs_node "$RGS_ROOT/intentions/t-rs2.md" t-rs2 202
rgs_node "$RGS_ROOT/intentions/t-rs3.md" t-rs3 203
rgs_seal
rgs_checks_sha "$RGS_FIX" deadbee201 pending
rgs_checks_sha "$RGS_FIX" deadbee202 pending
rgs_checks_sha "$RGS_FIX" deadbee203 failing
rgs_seed_sidecar_for t-rs1 deadbee201 7
rgs_seed_sidecar_for t-rs2 deadbee202 7
export GRAPH_REVIEW_STALL_CAP=2
c7_out=$(rgs_run)
unset GRAPH_REVIEW_STALL_CAP
assert_eq "review-stall ci-stall: the red-CI node later in the enumeration is still recovered" \
  "1" "$(grep -c '^recovered t-rs3 -> fix' <<<"$c7_out")"
assert_eq "review-stall ci-stall: still exactly ONE hold lands per sweep" \
  "1" "$(grep -c '^held t-rs. -> ci-stalled via ' <<<"$c7_out")"
assert_eq "review-stall ci-stall: the hold that landed is the first at-cap candidate" \
  "1" "$(grep -c '^held t-rs1 -> ci-stalled via ' <<<"$c7_out")"
# The unlanded at-cap candidate keeps its ladder for the next sweep — it was
# never acted on, so nothing about it should have changed.
assert_eq "review-stall ci-stall: the unlanded at-cap node keeps its ladder" \
  "deadbee202 8" "$(rgs_sidecar_for t-rs2)"

# --- Case 8: the landed hold refreshes the caller's heartbeat AFTERWARDS -----
# The block refreshed only on the way IN, which covers nothing: hold-node lands
# its own graph-commit, which waits up to LOCK_WAIT_SECONDS (1050s) for the
# GLOBAL landing lock — far past the MAX_HOLD_SECONDS (300s) after which
# dispatch-acquire-lock reclaims a holder. dispatch-select-tick runs this sweep
# while holding its dispatch lock and then continues for hundreds more lines, so
# one contended landing leaves the tick's lock reclaimable and a second tick
# double-books the same candidate set.
#
# ORDERING is the assertion, not a count: a before-only refresh still logs a
# heartbeat, so `grep -c heartbeat` would pass under the bug. What only the
# bracket produces is a heartbeat as the LAST event after the hold.
echo "Test: reconcile-graph-review-stall — a landed ci-stall hold refreshes the lock heartbeat afterwards"
rgs_setup c8
rgs_lock_stub
rgs_node "$RGS_ROOT/intentions/t-rs1.md" t-rs1 201
rgs_seal
rgs_seed_sidecar deadbee201 7
c8_out=$(rgs_run)
assert_eq "review-stall ci-stall: the hold really landed in this case too" \
  "1" "$(grep -c '^held t-rs1 -> ci-stalled via ' <<<"$c8_out")"
assert_eq "review-stall ci-stall: a --heartbeat follows the landed hold" \
  "heartbeat" "$(rgs_last_event)"
# Every refresh on this path must be the strict-owner --heartbeat form; an
# --acquire/--wait here would BLOCK on the very lock the caller already holds.
assert_eq "review-stall ci-stall: every refresh is a --heartbeat, never an acquire" \
  "0" "$(grep '^heartbeat ' "$RGS_FIX/lock-order.log" | grep -cv -- '^heartbeat --heartbeat$')"

# --- Case 9: a FAILED hold refreshes the heartbeat too -----------------------
# hold-node can block on the global landing lock for its full wait and THEN
# fail; the caller's heartbeat has aged exactly as much either way. Bracketing
# only the success arm would leave the lock reclaimable on precisely the path
# that already went wrong.
echo "Test: reconcile-graph-review-stall — a FAILED ci-stall hold still refreshes the heartbeat"
rgs_setup c9
rgs_lock_stub
rgs_node "$RGS_ROOT/intentions/t-rs1.md" t-rs1 201
rgs_seal
touch "$RGS_FIX/hold-node-fail"
rgs_seed_sidecar deadbee201 7
c9_out=$(rgs_run)
assert_eq "review-stall ci-stall: a failed hold prints no held line" \
  "0" "$(grep -c '^held t-rs1 -> ci-stalled via ' <<<"$c9_out")"
# hold-node's own stderr is swallowed by the sweep's `2>/dev/null`, so the
# evidence the failure ARM ran is the sweep's own diagnostic.
assert_eq "review-stall ci-stall: hold-node really ran and the failure arm was taken" \
  "1" "$(grep -c 'hold-node --kind ci-pending-stalled failed for t-rs1' "$RGS_FIX/stderr.txt")"
assert_eq "review-stall ci-stall: a --heartbeat follows the FAILED hold too" \
  "heartbeat" "$(rgs_last_event)"
assert_eq "review-stall ci-stall: a failed hold leaves the sidecar for the next sweep" \
  "deadbee201 8" "$(rgs_sidecar)"

report_results
