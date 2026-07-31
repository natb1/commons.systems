#!/usr/bin/env bash
# Tests for reconcile-graph-review-stall's CI-pending liveness bound
# (tactic-autonomous-ci-pending-liveness-bound Unit 3).
#
# The sweep is the ONLY observer of a tactic at phase:review carrying the
# `reviewed` marker (the selector excludes it entirely), so a PR whose CI never
# concludes would sit there forever with an armed auto-merge that can never
# fire. These cases pin the strike ladder this sweep runs at that second
# observation surface: below the cap it is a free sidecar write, at the cap it
# lands a tracked `ci-pending-stalled` hold — and the single hold slot is SHARED
# with the pre-existing conflict route, so one sweep never lands two holds.
#
# Harness (same idiom as test-graph-select-target.sh / test-dispatch-graph-
# execute.sh): a real git repo with an `origin` bare remote, the SUT plus lib.sh
# and every lib-*.sh PHYSICALLY copied in (the SUT derives REPO_ROOT from its own
# on-disk location, so a symlink would resolve back out of the fixture), and
# stubs on PATH / under packages/intentionsutil/scripts for the three external
# dependencies: `node` (the two `node --import tsx/esm -e` one-liners), `gh` (the
# REST PR read + the check-runs verdict), and `hold-node` / `graph-commit`.
# MAIN_ROOT is resolved for real via `git worktree list` — main is checked out at
# the fixture root, so the sidecars land at
# <root>/.claude/worktrees/<id>.ci-pending-strikes, the same file the selection
# surface would use.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# dispatch-test-fixture.sh carries assert_eq/report_results but not a substring
# assert (test-dispatch-graph-execute.sh defines its own assert_not_contains for
# the same reason).
assert_contains() {  # $1 = label, $2 = needle, $3 = haystack
  TOTAL=$((TOTAL + 1))
  if printf '%s' "$3" | grep -qF -- "$2"; then
    PASS=$((PASS + 1))
    echo "  PASS: $1"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $1"
    echo "    expected to contain: $2"
    echo "    actual: $3"
  fi
}

RGRS_CAP=8   # DISPATCH_CI_PENDING_STRIKE_CAP (lib.sh)
RGRS_SHA="deadbeefcafe0000000000000000000000000001"

# --- fixture ----------------------------------------------------------------
# rgrs_setup — a fresh sandbox per case so one case cannot leak into the next.
rgrs_setup() {
  # pwd -P: `git worktree list` reports the resolved path, and the sidecar
  # assertions compare against $RGRS_ROOT, so both must be symlink-free.
  RGRS_ROOT=$(cd "$(mktemp -d)" && pwd -P)
  RGRS_BARE=$(cd "$(mktemp -d)" && pwd -P)
  RGRS_SCRIPTS="$RGRS_ROOT/.claude/skills/dispatch-propagate/scripts"
  RGRS_PKG="$RGRS_ROOT/packages/intentionsutil/scripts"
  mkdir -p "$RGRS_SCRIPTS" "$RGRS_PKG" "$RGRS_ROOT/bin" "$RGRS_ROOT/intentions" \
           "$RGRS_ROOT/.claude/worktrees" "$RGRS_ROOT/cicache"
  cp "$SCRIPT_DIR"/reconcile-graph-review-stall "$SCRIPT_DIR"/lib.sh \
     "$SCRIPT_DIR"/lib-*.sh "$RGRS_SCRIPTS/"
  chmod +x "$RGRS_SCRIPTS/reconcile-graph-review-stall"

  RGRS_HOLD_LOG="$RGRS_ROOT/hold.log"
  RGRS_GC_LOG="$RGRS_ROOT/graph-commit.log"
  : >"$RGRS_HOLD_LOG"
  : >"$RGRS_GC_LOG"

  # `node` stub: the SUT makes exactly two `node --import tsx/esm -e <script>`
  # calls. The enumeration one-liner is answered by reading the fixture's own
  # intentions/*.md (so a case controls candidacy by writing node files, as the
  # real listNodes pass would); the reviewStallRoute one-liner reimplements that
  # pure function's three-line body over its two argv values.
  cat > "$RGRS_ROOT/bin/node" <<'RGRSNODE'
#!/usr/bin/env bash
script=""
args=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --import) shift 2 ;;
    -e) script="$2"; shift 2 ;;
    *) args+=("$1"); shift ;;
  esac
done
if [[ "$script" == *listNodes* ]]; then
  for f in ./intentions/*.md; do
    [[ -e "$f" ]] || continue
    grep -q '^    - reviewed$' "$f" || continue
    grep -q '^phase: review$' "$f" || continue
    grep -q '^office_hours: null$' "$f" || continue
    grep -q '^  fix: null$' "$f" || continue
    grep -q '^blocked_by: \[\]$' "$f" || continue
    id=$(grep '^id: ' "$f" | head -1 | cut -d' ' -f2)
    pr=$(grep '^  pr: ' "$f" | head -1 | cut -d' ' -f4)
    [[ -n "$id" && -n "$pr" && "$pr" != "null" ]] || continue
    printf '%s\t%s\n' "$id" "$pr"
  done
  exit 0
fi
if [[ "$script" == *reviewStallRoute* ]]; then
  ci="${args[0]-}"
  mergeable="${args[1]-}"
  if [[ "$mergeable" == "CONFLICTING" ]]; then printf 'conflict'
  elif [[ "$ci" == "failing" ]]; then printf 'fix'
  else printf 'null'; fi
  exit 0
fi
exit 0
RGRSNODE
  chmod +x "$RGRS_ROOT/bin/node"

  # `gh` stub: `gh api repos/{owner}/{repo}/pulls/<n>` returns the RAW REST PR
  # object gh_pr_view_rest projects (mergeable driven by a per-PR file so a case
  # can make one node CONFLICTING); the check-runs endpoint is only reached when
  # no verdict is memoised, and fails on purpose — the memo cache below is how a
  # case pins a verdict, and the failure is what Case 4 exercises.
  cat > "$RGRS_ROOT/bin/gh" <<'RGRSGH'
#!/usr/bin/env bash
_root="$(cd "$(dirname "$0")/.." && pwd)"
path="$*"
case "$path" in
  *pulls/*)
    num="${path##*pulls/}"
    mergeable="true"
    [[ -f "$_root/pr-$num.conflicting" ]] && mergeable="false"
    sha=$(cat "$_root/pr-$num.sha")
    printf '{"number":%s,"title":"t","body":"","state":"open","merged_at":null,' "$num"
    printf '"merge_commit_sha":null,"mergeable":%s,"mergeable_state":"clean",' "$mergeable"
    printf '"head":{"ref":"b","sha":"%s"},"labels":[]}\n' "$sha"
    exit 0 ;;
  *check-runs*)
    echo "check-runs unavailable" >&2
    exit 1 ;;
esac
exit 1
RGRSGH
  chmod +x "$RGRS_ROOT/bin/gh"

  # hold-node stub: log the argv plus the reason/recommendation bodies, print
  # the `held <hold-id>` line the SUT parses with awk '{print $2}'.
  cat > "$RGRS_PKG/hold-node" <<'RGRSHOLD'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$HOLD_LOG"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --reason-file|--recommendation-file) cat "$2" >> "$HOLD_LOG"; shift 2 ;;
    *) shift ;;
  esac
done
echo "held tactic-hold-fixture"
exit "${HOLD_RC:-0}"
RGRSHOLD
  # graph-commit stub: nothing in these cases takes the fix route, so a call
  # here would itself be a finding.
  cat > "$RGRS_PKG/graph-commit" <<'RGRSGC'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$GC_LOG"
exit 0
RGRSGC
  chmod +x "$RGRS_PKG/hold-node" "$RGRS_PKG/graph-commit"

  git init -q -b main "$RGRS_ROOT"
  git -C "$RGRS_ROOT" config user.email t@t
  git -C "$RGRS_ROOT" config user.name t
}

rgrs_seed_git() {
  git -C "$RGRS_ROOT" add -A
  git -C "$RGRS_ROOT" commit -q -m seed
  git init -q --bare -b main "$RGRS_BARE"
  git -C "$RGRS_ROOT" remote add origin "$RGRS_BARE"
  git -C "$RGRS_ROOT" push -q origin main
  git -C "$RGRS_ROOT" fetch -q origin
}

rgrs_teardown() {
  rm -rf "$RGRS_ROOT" "$RGRS_BARE"
}

# rgrs_node <id> <pr> — write a phase:review + `reviewed` tactic fixture.
rgrs_node() {
  cat > "$RGRS_ROOT/intentions/$1.md" <<RGRSNODEFILE
---
id: $1
kind: tactic
statement: fixture
owner: ai
status: raw
parent: null
serves: []
phase: review
execution:
  branch: $1
  pr: $2
  attempts: {}
  markers:
    - planned
    - reviewed
  fix: null
blocked_by: []
office_hours: null
---
# fixture
RGRSNODEFILE
  printf '%s\n' "$RGRS_SHA" > "$RGRS_ROOT/pr-$2.sha"
}

# rgrs_sidecar_set <id> <count> / rgrs_sidecar <id>
rgrs_sidecar_set() {
  printf '%s %s\n' "$RGRS_SHA" "$2" > "$RGRS_ROOT/.claude/worktrees/$1.ci-pending-strikes"
}
rgrs_sidecar() {
  cat "$RGRS_ROOT/.claude/worktrees/$1.ci-pending-strikes" 2>/dev/null || echo "gone"
}

# rgrs_verdict <verdict> — memoise the CI verdict for the fixture SHA, so
# dispatch_ci_verdict_rest returns it without a check-runs call. Omit to leave
# the cache empty and drive the call FAILURE path instead.
rgrs_verdict() {
  printf '%s\n' "$1" > "$RGRS_ROOT/cicache/$RGRS_SHA"
}

# rgrs_run — run the sweep against the sandbox; stdout in RGRS_OUT, rc in RGRS_RC.
RGRS_OUT=""
RGRS_RC=0
rgrs_run() {
  set +e
  RGRS_OUT=$(
    export PATH="$RGRS_ROOT/bin:$SAVED_PATH"
    export DISPATCH_CI_VERDICT_CACHE="$RGRS_ROOT/cicache"
    export HOLD_LOG="$RGRS_HOLD_LOG" GC_LOG="$RGRS_GC_LOG"
    export GH_RETRY_ATTEMPTS=1
    "$RGRS_SCRIPTS/reconcile-graph-review-stall" 2>/dev/null
  )
  RGRS_RC=$?
  set -e
}

# ============================================================================
# Case 1: a `pending` verdict BELOW the cap counts and does nothing else
# ============================================================================
echo "Case 1: pending below the cap bumps the sidecar, lands no hold"
rgrs_setup
rgrs_node tactic-pend 101
rgrs_seed_git
rgrs_verdict pending
rgrs_sidecar_set tactic-pend 3
rgrs_run
assert_eq "below-cap prints nothing" "" "$RGRS_OUT"
assert_eq "below-cap exits 0" "0" "$RGRS_RC"
assert_eq "below-cap bumps the sidecar to 4" "$RGRS_SHA 4" "$(rgrs_sidecar tactic-pend)"
assert_eq "below-cap calls no hold-node" "" "$(cat "$RGRS_HOLD_LOG")"
assert_eq "below-cap calls no graph-commit" "" "$(cat "$RGRS_GC_LOG")"
rgrs_teardown

# ============================================================================
# Case 2: at the cap -> a tracked ci-pending-stalled hold, sidecar cleared
# ============================================================================
echo "Case 2: pending at the cap lands a ci-pending-stalled hold"
rgrs_setup
rgrs_node tactic-stalled 202
rgrs_seed_git
rgrs_verdict pending
rgrs_sidecar_set tactic-stalled $(( RGRS_CAP - 1 ))
rgrs_run
RGRS_HOLD=$(cat "$RGRS_HOLD_LOG")
assert_eq "at-cap prints the ci-stalled hold line" \
  "held tactic-stalled -> ci-stalled via tactic-hold-fixture (sha=$RGRS_SHA strikes=$RGRS_CAP)" \
  "$RGRS_OUT"
assert_eq "at-cap exits 0" "0" "$RGRS_RC"
assert_contains "at-cap calls hold-node with --kind ci-pending-stalled" \
  "tactic-stalled --kind ci-pending-stalled" "$RGRS_HOLD"
assert_eq "at-cap clears the sidecar" "gone" "$(rgrs_sidecar tactic-stalled)"
# The reason must name what is specific to THIS surface (the armed merge nobody
# observes), and the recommendation must forbid the CI-fix interrupt.
assert_contains "at-cap reason names the armed, unobserved merge" \
  "auto-merge is ARMED" "$RGRS_HOLD"
assert_contains "at-cap reason names the head SHA" "$RGRS_SHA" "$RGRS_HOLD"
assert_contains "at-cap recommendation forbids the CI-fix interrupt" \
  "Do NOT route this through the CI-fix interrupt" "$RGRS_HOLD"
assert_contains "at-cap recommendation demands the hold be resolved to done" \
  "phase: done" "$RGRS_HOLD"
rgrs_teardown

# ============================================================================
# Case 3: a CONCLUDED (passing) verdict clears an accumulated sidecar
# ============================================================================
echo "Case 3: a passing verdict clears the sidecar and lands no hold"
rgrs_setup
rgrs_node tactic-green 303
rgrs_seed_git
rgrs_verdict passing
rgrs_sidecar_set tactic-green 5
rgrs_run
assert_eq "passing prints nothing" "" "$RGRS_OUT"
assert_eq "passing clears the sidecar" "gone" "$(rgrs_sidecar tactic-green)"
assert_eq "passing calls no hold-node" "" "$(cat "$RGRS_HOLD_LOG")"
rgrs_teardown

# ============================================================================
# Case 4: an unreadable CI verdict neither counts nor clears (fail open)
# ============================================================================
echo "Case 4: a failed CI verdict call leaves the sidecar untouched"
rgrs_setup
rgrs_node tactic-ghfail 404
rgrs_seed_git
# No memoised verdict -> the check-runs call runs and the gh stub fails it, so
# RAW_VERDICT is empty. That must NOT burn a strike and must NOT reset one.
rgrs_sidecar_set tactic-ghfail 5
rgrs_run
assert_eq "verdict-failure prints nothing" "" "$RGRS_OUT"
assert_eq "verdict-failure leaves the sidecar at 5" "$RGRS_SHA 5" "$(rgrs_sidecar tactic-ghfail)"
assert_eq "verdict-failure calls no hold-node" "" "$(cat "$RGRS_HOLD_LOG")"
rgrs_teardown

# ============================================================================
# Case 5: the two hold routes SHARE one slot — a conflicting node and an at-cap
# pending node in the same sweep produce exactly ONE hold-node call
# ============================================================================
echo "Case 5: a conflict and an at-cap ci-stall in one sweep land exactly one hold"
rgrs_setup
rgrs_node tactic-aconflict 505
rgrs_node tactic-bstalled 506
rgrs_seed_git
touch "$RGRS_ROOT/pr-505.conflicting"
rgrs_verdict pending
rgrs_sidecar_set tactic-bstalled $(( RGRS_CAP - 1 ))
rgrs_run
assert_eq "shared slot: exactly one hold-node invocation" "1" \
  "$(grep -c -e '--kind' "$RGRS_HOLD_LOG")"
assert_eq "shared slot: exactly one held line on stdout" "1" \
  "$(printf '%s\n' "$RGRS_OUT" | grep -c '^held ')"
assert_eq "shared slot: exits 0" "0" "$RGRS_RC"
# The skipped route is not lost: its node still matches the enumeration next
# tick, and the ci-stall strike count stays at the cap so it holds immediately.
assert_eq "shared slot: the pending node's strike count is at the cap" \
  "$RGRS_SHA $RGRS_CAP" "$(rgrs_sidecar tactic-bstalled)"
rgrs_teardown

report_results
