#!/usr/bin/env bash
# Tests for dispatch-stop-hook -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 17705-17916, 27777-27866.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-stop hook tests
# ============================================================================
echo ""
echo "=== dispatch-stop ==="
#
# dispatch-stop is now the graph-native node-worker Stop-hook: an escalation-park
# BACKSTOP only. tactic-dispatch-legacy-rewire Unit 3 DELETED the legacy
# <N>-<slug> issue-worker disposition (the phase-completed marker read, the
# dispatch-phase CURRENT_PHASE derivation, the dispatch:office-hours label parks
# via dispatch-apply-office-hours, the phase-advance self-close, and the
# Stop-hook tick-spawn) — those paths were reachable only for a legacy issue
# worker spawned by dispatch-materialize-spawn -> dispatch-launch-worker, both
# deleted with the legacy gh-issue lane.
#
# Surviving contract:
#   - CLAUDE_JOB_DIR unset, or state.json absent  -> no-op (exit 0).
#   - The job is a graph node worker iff state.json .name is a node id AND
#     intentions/<name>.md exists at the hook root (= <hook-dir>/../..). Only
#     then, and only when a non-empty office-hours-reason marker is present in
#     the job dir, park the node via
#     packages/intentionsutil/scripts/park-node <id> <reason> [<reco>].
#   - Any other name (a dispatch-<id> router, a stray non-node name), or a node
#     worker with no office-hours-reason marker -> no-op (exit 0).
#   - Best-effort: a park-node failure is logged to stderr and the hook still
#     exits 0 (it must never block session teardown).
#
# Harness: the hook is copied to $ROOT/.claude/hooks/dispatch-stop.sh so its
# `$(dirname)/../..` root resolves to $ROOT; the intention nodes and a fake
# park-node (recording each invocation's argv to $ROOT/park-calls.log) sit under
# $ROOT. The job dir carries state.json and the optional office-hours markers.

stopnc_setup() {
  TMPDIR_TEST=$(mktemp -d)
  ROOT="$TMPDIR_TEST/root"
  JOB_DIR="$TMPDIR_TEST/job"
  mkdir -p "$ROOT/.claude/hooks" "$ROOT/intentions" \
    "$ROOT/packages/intentionsutil/scripts" "$JOB_DIR"
  cp "$HOOK_SCRIPT_DIR/dispatch-stop.sh" "$ROOT/.claude/hooks/dispatch-stop.sh"
  chmod +x "$ROOT/.claude/hooks/dispatch-stop.sh"
  # Fake park-node: append every invocation's argv (one line per call) to
  # park-calls.log at $ROOT, and honor an optional park-exit override so a test
  # can drive the best-effort failure branch.
  cat > "$ROOT/packages/intentionsutil/scripts/park-node" <<'FAKE'
#!/usr/bin/env bash
_root="$(cd "$(dirname "$0")/../../.." && pwd)"
printf '%s\n' "$*" >> "$_root/park-calls.log"
if [[ -f "$_root/park-exit" ]]; then exit "$(cat "$_root/park-exit")"; fi
exit 0
FAKE
  chmod +x "$ROOT/packages/intentionsutil/scripts/park-node"
  : > "$ROOT/park-calls.log"
}

stopnc_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
}

# stopnc_state <name> — write state.json naming this job.
stopnc_state() { printf '{"name":"%s"}\n' "$1" > "$JOB_DIR/state.json"; }

# stopnc_run — run the hook with CLAUDE_JOB_DIR=$JOB_DIR; capture rc.
stopnc_run() {
  local rc=0
  ( export CLAUDE_JOB_DIR="$JOB_DIR"; "$ROOT/.claude/hooks/dispatch-stop.sh" </dev/null ) || rc=$?
  echo "$rc"
}

# --- no CLAUDE_JOB_DIR → no-op ----------------------------------------------
echo "Test: dispatch-stop no CLAUDE_JOB_DIR → no-op, park-node not called"
stopnc_setup
rc=0
( unset CLAUDE_JOB_DIR; "$ROOT/.claude/hooks/dispatch-stop.sh" </dev/null ) || rc=$?
assert_eq "stop: no CLAUDE_JOB_DIR → exit 0" "0" "$rc"
assert_eq "stop: no CLAUDE_JOB_DIR → park-node not called" "0" "$(wc -l < "$ROOT/park-calls.log")"
stopnc_teardown

# --- state.json absent → no-op ----------------------------------------------
echo "Test: dispatch-stop state.json absent → no-op, park-node not called"
stopnc_setup
rc=$(stopnc_run)   # JOB_DIR has no state.json
assert_eq "stop: no state.json → exit 0" "0" "$rc"
assert_eq "stop: no state.json → park-node not called" "0" "$(wc -l < "$ROOT/park-calls.log")"
stopnc_teardown

# --- router name (no intention node) → no-op --------------------------------
echo "Test: dispatch-stop router name (no intentions/<name>.md) → no-op"
stopnc_setup
stopnc_state "dispatch-ab12cd34"
printf 'stalled somewhere\n' > "$JOB_DIR/office-hours-reason"
rc=$(stopnc_run)
assert_eq "stop: router name → exit 0" "0" "$rc"
assert_eq "stop: router name → park-node not called" "0" "$(wc -l < "$ROOT/park-calls.log")"
stopnc_teardown

# --- node worker + no office-hours-reason → no-op ----------------------------
echo "Test: dispatch-stop node worker with no office-hours-reason → no park"
stopnc_setup
stopnc_state "tactic-some-node"
: > "$ROOT/intentions/tactic-some-node.md"
rc=$(stopnc_run)   # no office-hours-reason marker written
assert_eq "stop: node clean exit → exit 0" "0" "$rc"
assert_eq "stop: node clean exit → park-node not called" "0" "$(wc -l < "$ROOT/park-calls.log")"
stopnc_teardown

# --- node worker + office-hours-reason (no recommendation) → park ------------
echo "Test: dispatch-stop node worker + office-hours-reason → park-node <id> <reason>"
stopnc_setup
stopnc_state "tactic-some-node"
: > "$ROOT/intentions/tactic-some-node.md"
printf 'needs a human decision' > "$JOB_DIR/office-hours-reason"
rc=$(stopnc_run)
assert_eq "stop: node park → exit 0" "0" "$rc"
assert_eq "stop: node park → park-node called once" "1" "$(wc -l < "$ROOT/park-calls.log")"
assert_eq "stop: node park → argv is <id> <reason>" \
  "tactic-some-node needs a human decision" "$(cat "$ROOT/park-calls.log")"
stopnc_teardown

# --- node worker + reason + recommendation → park with 3rd arg ---------------
echo "Test: dispatch-stop node worker + reason + recommendation → park-node <id> <reason> <reco>"
stopnc_setup
stopnc_state "tactic-some-node"
: > "$ROOT/intentions/tactic-some-node.md"
printf 'needs a human decision' > "$JOB_DIR/office-hours-reason"
printf 'try approach X' > "$JOB_DIR/office-hours-recommendation"
rc=$(stopnc_run)
assert_eq "stop: node park+reco → exit 0" "0" "$rc"
assert_eq "stop: node park+reco → argv carries the recommendation" \
  "tactic-some-node needs a human decision try approach X" "$(cat "$ROOT/park-calls.log")"
stopnc_teardown

# --- best-effort: park-node failure still exits 0 ---------------------------
echo "Test: dispatch-stop park-node failure is non-fatal (hook still exits 0)"
stopnc_setup
stopnc_state "tactic-some-node"
: > "$ROOT/intentions/tactic-some-node.md"
printf 'needs a human decision' > "$JOB_DIR/office-hours-reason"
printf '1' > "$ROOT/park-exit"   # make the fake park-node exit non-zero
rc=$(stopnc_run)
assert_eq "stop: park-node failure → hook still exits 0" "0" "$rc"
assert_eq "stop: park-node failure → park-node was still attempted once" "1" "$(wc -l < "$ROOT/park-calls.log")"
stopnc_teardown

# --- marker consumed after successful park (reason-only) --------------------
echo "Test: dispatch-stop successful park consumes the reason marker"
stopnc_setup
stopnc_state "tactic-some-node"
: > "$ROOT/intentions/tactic-some-node.md"
printf 'needs a human decision' > "$JOB_DIR/office-hours-reason"
rc=$(stopnc_run)
assert_eq "stop: park success → exit 0" "0" "$rc"
[ ! -e "$JOB_DIR/office-hours-reason" ]
assert_eq "stop: park success → reason marker deleted" "0" "$?"
stopnc_teardown

# --- consumed marker prevents re-park on a later Stop event ------------------
echo "Test: dispatch-stop does not re-park on a second Stop event after marker consumed"
stopnc_setup
stopnc_state "tactic-some-node"
: > "$ROOT/intentions/tactic-some-node.md"
printf 'needs a human decision' > "$JOB_DIR/office-hours-reason"
rc=$(stopnc_run)
rc2=$(stopnc_run)   # marker already consumed by the first run
assert_eq "stop: second run → exit 0" "0" "$rc2"
assert_eq "stop: second run → park-node still called only once total" "1" "$(wc -l < "$ROOT/park-calls.log")"
stopnc_teardown

# --- marker survives a failed park (reason-only) so a later retry can fire ---
echo "Test: dispatch-stop failed park leaves the reason marker in place"
stopnc_setup
stopnc_state "tactic-some-node"
: > "$ROOT/intentions/tactic-some-node.md"
printf 'needs a human decision' > "$JOB_DIR/office-hours-reason"
printf '1' > "$ROOT/park-exit"   # make the fake park-node exit non-zero
rc=$(stopnc_run)
assert_eq "stop: park failure → exit 0" "0" "$rc"
[ -e "$JOB_DIR/office-hours-reason" ]
assert_eq "stop: park failure → reason marker survives" "0" "$?"
stopnc_teardown

# --- marker consumed after successful park (reason + recommendation) --------
echo "Test: dispatch-stop successful park consumes both markers when a recommendation is present"
stopnc_setup
stopnc_state "tactic-some-node"
: > "$ROOT/intentions/tactic-some-node.md"
printf 'needs a human decision' > "$JOB_DIR/office-hours-reason"
printf 'try approach X' > "$JOB_DIR/office-hours-recommendation"
rc=$(stopnc_run)
assert_eq "stop: park+reco success → exit 0" "0" "$rc"
[ ! -e "$JOB_DIR/office-hours-reason" ]
assert_eq "stop: park+reco success → reason marker deleted" "0" "$?"
[ ! -e "$JOB_DIR/office-hours-recommendation" ]
assert_eq "stop: park+reco success → recommendation marker deleted" "0" "$?"
stopnc_teardown

# --- both markers survive a failed park (reason + recommendation) -----------
echo "Test: dispatch-stop failed park leaves both markers in place when a recommendation is present"
stopnc_setup
stopnc_state "tactic-some-node"
: > "$ROOT/intentions/tactic-some-node.md"
printf 'needs a human decision' > "$JOB_DIR/office-hours-reason"
printf 'try approach X' > "$JOB_DIR/office-hours-recommendation"
printf '1' > "$ROOT/park-exit"   # make the fake park-node exit non-zero
rc=$(stopnc_run)
assert_eq "stop: park+reco failure → exit 0" "0" "$rc"
[ -e "$JOB_DIR/office-hours-reason" ]
assert_eq "stop: park+reco failure → reason marker survives" "0" "$?"
[ -e "$JOB_DIR/office-hours-recommendation" ]
assert_eq "stop: park+reco failure → recommendation marker survives" "0" "$?"
stopnc_teardown

# ============================================================================
# dispatch-stop.sh rate-limit-retry counter-reset idiom (#1733)
# ============================================================================
#
# dispatch-stop.sh's clear_rate_limit_retry_labels strips every
# dispatch:rate-limit-retry-<n> label from the issue on a clean advance, so a
# recovered session starts its next death from a fresh counter. The hook has no
# test harness, so this covers the idiom at the label-pipeline level: the exact
# `gh issue view ... --jq '<filter>' | while read lbl;
# gh_issue_remove_label_rest "$ISSUE_NUM" "$lbl"` pipeline (#2255 migrated the
# per-label remove from porcelain `gh issue edit --remove-label` to the REST
# helper, which issues `gh api -X DELETE .../labels/<name>`). The gh stub runs
# the REAL jq filter against a labels fixture and records each DELETE path's
# label segment. Asserts the remove fires for the matching retry labels and NOT
# for non-matching labels.
echo ""
echo "=== dispatch-stop.sh rate-limit-retry counter-reset idiom ==="

echo "Test: clear idiom removes only dispatch:rate-limit-retry-<n> labels"
TMPDIR_TEST=$(mktemp -d)
mkdir -p "$TMPDIR_TEST/bin"

# Labels fixture: two matching retry labels (incl. multi-digit) plus three
# non-matching labels that must survive (office-hours, a bug topic, and the
# similarly-prefixed ci-wait-attempt counter).
cat > "$TMPDIR_TEST/labels.json" <<'JSON'
{"labels":[
  {"name":"dispatch:rate-limit-retry-3"},
  {"name":"dispatch:office-hours"},
  {"name":"dispatch:rate-limit-retry-10"},
  {"name":"bug"},
  {"name":"dispatch:ci-wait-attempt-2"}
]}
JSON

# fake gh: `issue view --json labels --jq <filter>` runs the REAL jq filter
# against the labels fixture (so the test exercises the actual select(test(...))
# regex, not a hand-rolled list). `api -X DELETE .../labels/<name>` (the REST
# remove the migrated helper issues) records <name> to remove-log.
cat > "$TMPDIR_TEST/bin/gh" <<STUB
#!/usr/bin/env bash
if [[ "\$1" == "issue" && "\$2" == "view" ]]; then
  # Locate the --jq filter argument and run it against the fixture.
  filter=""
  prev=""
  for a in "\$@"; do
    [[ "\$prev" == "--jq" ]] && filter="\$a"
    prev="\$a"
  done
  jq -r "\$filter" "$TMPDIR_TEST/labels.json"
  exit 0
fi
if [[ "\$1" == "api" && "\$2" == "-X" && "\$3" == "DELETE" ]]; then
  # path is the last arg: repos/{owner}/{repo}/issues/<N>/labels/<name>.
  path="\${@: -1}"
  echo "\${path##*/labels/}" >> "$TMPDIR_TEST/remove-log"
  exit 0
fi
exit 0
STUB
chmod +x "$TMPDIR_TEST/bin/gh"

# Reproduce the exact dispatch-stop.sh clear_rate_limit_retry_labels pipeline,
# calling the REAL gh_issue_remove_label_rest (sourced from lib.sh) so the test
# exercises the migrated mechanism (REST DELETE), not a hand-rolled porcelain.
ISSUE_NUM=1733
(
  PATH="$TMPDIR_TEST/bin:$PATH"
  source "$SCRIPT_DIR/lib.sh"
  gh issue view "$ISSUE_NUM" --json labels --jq \
    '.labels[].name | select(test("^dispatch:rate-limit-retry-[0-9]+$"))' 2>/dev/null \
    | while IFS= read -r lbl; do
        [ -n "$lbl" ] && gh_issue_remove_label_rest "$ISSUE_NUM" "$lbl" >/dev/null 2>&1 \
          || true
      done || true
)
removed=$(cat "$TMPDIR_TEST/remove-log" 2>/dev/null || true)
assert_eq "idiom removes retry-3" "present" \
  "$(printf '%s\n' "$removed" | grep -qx 'dispatch:rate-limit-retry-3' && echo present || echo absent)"
assert_eq "idiom removes retry-10 (multi-digit)" "present" \
  "$(printf '%s\n' "$removed" | grep -qx 'dispatch:rate-limit-retry-10' && echo present || echo absent)"
assert_eq "idiom leaves dispatch:office-hours" "absent" \
  "$(printf '%s\n' "$removed" | grep -qx 'dispatch:office-hours' && echo present || echo absent)"
assert_eq "idiom leaves the bug topic label" "absent" \
  "$(printf '%s\n' "$removed" | grep -qx 'bug' && echo present || echo absent)"
assert_eq "idiom leaves the similarly-prefixed ci-wait-attempt-2" "absent" \
  "$(printf '%s\n' "$removed" | grep -qx 'dispatch:ci-wait-attempt-2' && echo present || echo absent)"
rm -rf "$TMPDIR_TEST"
TMPDIR_TEST=""

# <<< END MOVED <<<

report_results
