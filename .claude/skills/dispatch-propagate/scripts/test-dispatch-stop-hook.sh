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
# dispatch-stop is now the graph-native node-worker Stop-hook, reduced to a
# single duty: marker-gated reap delegation to dispatch-self-close.
# tactic-dispatch-legacy-rewire Unit 3 DELETED the legacy <N>-<slug>
# issue-worker disposition (the phase-completed marker read, the dispatch-phase
# CURRENT_PHASE derivation, the dispatch:office-hours label parks via
# dispatch-apply-office-hours, the phase-advance self-close, and the Stop-hook
# tick-spawn) — those paths were reachable only for a legacy issue worker
# spawned by dispatch-materialize-spawn -> dispatch-launch-worker, both deleted
# with the legacy gh-issue lane.
#
# tactic-phase-terminal-requires-disposition Unit 4 DELETED the escalation-park
# backstop that used to live here (reading office-hours-reason/-recommendation/
# -pr and calling park-node): measured 0/5 successes on 2026-07-31 versus 4/4
# for in-session park-node, wrong worktree base, no landing-lock budget in a
# teardown hook, and a swallowed failure path. The replacement is
# dispatch-tick's terminal_without_disposition_sweep (lib-frozen-session-park.sh),
# which runs from the tick's main checkout. This hook no longer touches the
# office-hours-reason/-recommendation/-pr markers at all — it leaves them for
# the sweep to read.
#
# Surviving contract:
#   - CLAUDE_JOB_DIR unset, or state.json absent  -> no-op (exit 0).
#   - The job is a graph node worker iff state.json .name is a node id AND
#     intentions/<name>.md exists at the hook root (= <hook-dir>/../..). Only
#     then, delegate to dispatch-self-close --node <name>, which applies the
#     node-terminal marker gate (reap vs hold) on its own.
#   - Any other name (a dispatch-<id> router, a stray non-node name) -> no-op
#     (exit 0).
#   - Best-effort: a dispatch-self-close failure is logged to stderr and the
#     hook still exits 0 (it must never block session teardown).
#
# Harness: the hook is copied to $ROOT/.claude/hooks/dispatch-stop.sh so its
# `$(dirname)/../..` root resolves to $ROOT; the intention nodes and a fake
# park-node (recording each invocation's argv to $ROOT/park-calls.log, kept so
# the RATCHET test below can assert it is NEVER called) sit under $ROOT. The
# job dir carries state.json and the optional office-hours markers.

stopnc_setup() {
  TMPDIR_TEST=$(mktemp -d)
  ROOT="$TMPDIR_TEST/root"
  JOB_DIR="$TMPDIR_TEST/job"
  mkdir -p "$ROOT/.claude/hooks" "$ROOT/intentions" \
    "$ROOT/packages/intentionsutil/scripts" \
    "$ROOT/.claude/skills/dispatch-propagate/scripts" "$JOB_DIR"
  cp "$HOOK_SCRIPT_DIR/dispatch-stop.sh" "$ROOT/.claude/hooks/dispatch-stop.sh"
  chmod +x "$ROOT/.claude/hooks/dispatch-stop.sh"
  # Fake park-node: append every invocation's argv (one line per call) to
  # park-calls.log at $ROOT, and honor an optional park-exit override so a test
  # can drive the best-effort failure branch. Also appends "park" to the shared
  # order.log so ordering relative to dispatch-self-close is observable.
  cat > "$ROOT/packages/intentionsutil/scripts/park-node" <<'FAKE'
#!/usr/bin/env bash
_root="$(cd "$(dirname "$0")/../../.." && pwd)"
printf '%s\n' "$*" >> "$_root/park-calls.log"
echo "park" >> "$_root/order.log"
if [[ -f "$_root/park-exit" ]]; then exit "$(cat "$_root/park-exit")"; fi
exit 0
FAKE
  chmod +x "$ROOT/packages/intentionsutil/scripts/park-node"
  : > "$ROOT/park-calls.log"
  # Fake dispatch-self-close: records each attempt's ARGV (one line per call) to
  # self-close-calls.log and appends "self-close" to the shared order.log,
  # honoring an optional self-close-exit override so a test can drive the
  # best-effort failure branch. It also emits a stderr sentinel: the real script
  # logs its one-line HOLD reason to stderr, and the hook must NOT swallow it.
  # The fake intentionally still records a call on every invocation — the hook
  # delegates unconditionally; the reap/hold GATE lives in the real script (see
  # the dispatch-self-close block's tests 9-16), not here.
  cat > "$ROOT/.claude/skills/dispatch-propagate/scripts/dispatch-self-close" <<'FAKE'
#!/usr/bin/env bash
_root="$(cd "$(dirname "$0")/../../../.." && pwd)"
echo "self-close" >> "$_root/order.log"
printf '%s\n' "$*" >> "$_root/self-close-calls.log"
echo "SELFCLOSE-STDERR-SENTINEL" >&2
if [[ -f "$_root/self-close-exit" ]]; then exit "$(cat "$_root/self-close-exit")"; fi
exit 0
FAKE
  chmod +x "$ROOT/.claude/skills/dispatch-propagate/scripts/dispatch-self-close"
  : > "$ROOT/order.log"
  : > "$ROOT/self-close-calls.log"
}

stopnc_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
}

# stopnc_state <name> — write state.json naming this job.
stopnc_state() { printf '{"name":"%s"}\n' "$1" > "$JOB_DIR/state.json"; }

# stopnc_run — run the hook with CLAUDE_JOB_DIR=$JOB_DIR; capture rc. The hook's
# stderr is captured to $ROOT/hook-stderr.log rather than inherited, so a test
# can assert on what the hook let through (and the fakes' diagnostics do not
# pollute the suite's own output).
stopnc_run() {
  local rc=0
  ( export CLAUDE_JOB_DIR="$JOB_DIR"; "$ROOT/.claude/hooks/dispatch-stop.sh" \
      </dev/null 2>"$ROOT/hook-stderr.log" ) || rc=$?
  echo "$rc"
}

# --- no CLAUDE_JOB_DIR → no-op ----------------------------------------------
echo "Test: dispatch-stop no CLAUDE_JOB_DIR → no-op, park-node not called"
stopnc_setup
rc=0
( unset CLAUDE_JOB_DIR; "$ROOT/.claude/hooks/dispatch-stop.sh" </dev/null ) || rc=$?
assert_eq "stop: no CLAUDE_JOB_DIR → exit 0" "0" "$rc"
assert_eq "stop: no CLAUDE_JOB_DIR → park-node not called" "0" "$(wc -l < "$ROOT/park-calls.log")"
assert_eq "stop: no CLAUDE_JOB_DIR → self-close not called" "0" "$(wc -l < "$ROOT/self-close-calls.log")"
stopnc_teardown

# --- state.json absent → no-op ----------------------------------------------
echo "Test: dispatch-stop state.json absent → no-op, park-node not called"
stopnc_setup
rc=$(stopnc_run)   # JOB_DIR has no state.json
assert_eq "stop: no state.json → exit 0" "0" "$rc"
assert_eq "stop: no state.json → park-node not called" "0" "$(wc -l < "$ROOT/park-calls.log")"
assert_eq "stop: no state.json → self-close not called" "0" "$(wc -l < "$ROOT/self-close-calls.log")"
stopnc_teardown

# --- router name (no intention node) → no-op --------------------------------
echo "Test: dispatch-stop router name (no intentions/<name>.md) → no-op"
stopnc_setup
stopnc_state "dispatch-ab12cd34"
printf 'stalled somewhere\n' > "$JOB_DIR/office-hours-reason"
rc=$(stopnc_run)
assert_eq "stop: router name → exit 0" "0" "$rc"
assert_eq "stop: router name → park-node not called" "0" "$(wc -l < "$ROOT/park-calls.log")"
assert_eq "stop: router name → self-close not called" "0" "$(wc -l < "$ROOT/self-close-calls.log")"
stopnc_teardown

# --- node worker + no office-hours-reason → delegate to the gated self-close --
#
# The hook does not decide the reap: it passes `--node <job-name>` and lets
# dispatch-self-close apply the terminal-disposition gate. The fake here always
# records the call, so this asserts the DELEGATION (argv + un-swallowed stderr),
# not the gate — the gate's own hold/reap cases are tests 9-16 of the
# dispatch-self-close block.
echo "Test: dispatch-stop node worker with no office-hours-reason → no park, self-close called with --node"
stopnc_setup
stopnc_state "tactic-some-node"
: > "$ROOT/intentions/tactic-some-node.md"
rc=$(stopnc_run)   # no office-hours-reason marker written
assert_eq "stop: node clean exit → exit 0" "0" "$rc"
assert_eq "stop: node clean exit → park-node not called" "0" "$(wc -l < "$ROOT/park-calls.log")"
assert_eq "stop: node clean exit → self-close called once" "1" "$(wc -l < "$ROOT/self-close-calls.log")"
assert_eq "stop: node clean exit → self-close argv is '--node <job-name>'" \
  "--node tactic-some-node" "$(cat "$ROOT/self-close-calls.log")"
TOTAL=$((TOTAL + 1))
if grep -q 'SELFCLOSE-STDERR-SENTINEL' "$ROOT/hook-stderr.log"; then
  PASS=$((PASS + 1)); echo "  PASS: stop: node clean exit → self-close stderr is NOT swallowed (the HOLD line must be visible)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop: node clean exit → self-close stderr is NOT swallowed (the HOLD line must be visible)"
  echo "    hook stderr: $(cat "$ROOT/hook-stderr.log")"
fi
stopnc_teardown

# --- RATCHET: node worker + all three office-hours markers → NOT consumed ---
#
# tactic-phase-terminal-requires-disposition Unit 4: the hook must no longer
# read or act on office-hours-reason/-recommendation/-pr at all. This is a
# ratchet against the backstop creeping back in -- the markers must survive
# untouched for dispatch-tick's terminal_without_disposition_sweep to consume
# on a later tick.
echo "Test: dispatch-stop node worker + all three office-hours markers → RATCHET: no park, markers untouched, self-close still delegated"
stopnc_setup
stopnc_state "tactic-some-node"
: > "$ROOT/intentions/tactic-some-node.md"
printf 'needs a human decision' > "$JOB_DIR/office-hours-reason"
printf 'try approach X' > "$JOB_DIR/office-hours-recommendation"
printf '42' > "$JOB_DIR/office-hours-pr"
rc=$(stopnc_run)
assert_eq "stop: ratchet → exit 0" "0" "$rc"
assert_eq "stop: ratchet → park-node NEVER called" "0" "$(wc -l < "$ROOT/park-calls.log")"
assert_eq "stop: ratchet → self-close called exactly once" "1" "$(wc -l < "$ROOT/self-close-calls.log")"
assert_eq "stop: ratchet → self-close argv is '--node <job-name>'" \
  "--node tactic-some-node" "$(cat "$ROOT/self-close-calls.log")"
[ -e "$JOB_DIR/office-hours-reason" ]
assert_eq "stop: ratchet → reason marker still present" "0" "$?"
[ -e "$JOB_DIR/office-hours-recommendation" ]
assert_eq "stop: ratchet → recommendation marker still present" "0" "$?"
[ -e "$JOB_DIR/office-hours-pr" ]
assert_eq "stop: ratchet → pr marker still present" "0" "$?"
stopnc_teardown

# --- best-effort: dispatch-self-close failure still exits 0 -----------------
echo "Test: dispatch-stop self-close failure is non-fatal (hook still exits 0)"
stopnc_setup
stopnc_state "tactic-some-node"
: > "$ROOT/intentions/tactic-some-node.md"
printf '1' > "$ROOT/self-close-exit"   # make the fake dispatch-self-close exit non-zero
rc=$(stopnc_run)   # no office-hours-reason marker written
assert_eq "stop: self-close failure → hook still exits 0" "0" "$rc"
assert_eq "stop: self-close failure → self-close was still attempted once" "1" "$(wc -l < "$ROOT/self-close-calls.log")"
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
