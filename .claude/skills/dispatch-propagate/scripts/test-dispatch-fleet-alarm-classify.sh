#!/usr/bin/env bash
#
# test-dispatch-fleet-alarm-classify.sh — regression coverage for
# dispatch-fleet-alarm's classify() PARK-AWARENESS fix
# (tactic-fleet-alarm-node-park-clobber-loop, ruling (b)).
#
# test-dispatch-fleet-alarm.sh's own suite always injects
# DISPATCH_FLEET_ALARM_CLASSIFY_CMD (a stub), so it never exercises classify()'s
# real embedded `node --import tsx/esm` logic — and that embedded logic (not
# the mint/refresh plumbing around it) is exactly what ruling (b) changed. This
# suite runs the REAL dispatch-fleet-alarm SCRIPT IN PLACE (never copied), the
# same pattern test-assert-node-selection.sh uses for its real
# check-node-selection.ts SUT: run from its own real on-disk location so its
# own SCRIPT_DIR/REPO_ROOT math resolves to the real repo root, which is what
# lets classify()'s inline `import("./packages/intentionsutil/src/store.js")`
# actually resolve. Every WRITE path (write-node, dump-node, graph-commit,
# verify-landed) is still stubbed, so no run in this suite ever mutates the
# real intentions/ tree, the real git history, or reaches a remote — the only
# real-repo touches are read-only `git rev-parse` calls inside
# origin_main_ref_ok/origin_blob, which classify() itself never invokes.
#
# Coverage: (1) a node with office_hours set and phase NOT done classifies
# open (routes to the CAS refresh path: dump-node + graph-commit --base, never
# write-node) and its on-disk office_hours block is byte-identical before and
# after the run — the park survives a re-detection instead of being wiped by a
# mint-fresh overwrite. (2) the true-positive control: phase: done (office_hours
# null) still classifies closed and routes to the mint path (write-node called,
# graph-commit with NO --base) — the fix narrows the closed predicate, it does
# not disable it. (3) office_hours set AND phase: done also classifies closed
# (phase remains the sole trigger; office_hours no longer participates either
# way).
#
# Run under bash -c, never zsh.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUT="$HARNESS_DIR/dispatch-fleet-alarm"
[[ -f "$SUT" ]] || { echo "error: dispatch-fleet-alarm not found at $SUT" >&2; exit 1; }

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
trap 'rm -rf "$WORK"' EXIT

PASS=0; FAIL=0
ok() { echo "PASS: $1"; PASS=$((PASS + 1)); }
no() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }
assert_eq() { # <label> <expected> <actual>
  if [[ "$2" == "$3" ]]; then ok "$1"; else no "$1 (expected '$2', got '$3')"; fi
}
assert_contains() { # <label> <needle> <haystack>
  if [[ "$3" == *"$2"* ]]; then ok "$1"; else no "$1 (expected to contain '$2', got '$3')"; fi
}

INTENTIONS="$WORK/intentions"
STATE="$WORK/alarm-state"
LOG="$WORK/logs"
BIN="$WORK/bin"
mkdir -p "$INTENTIONS" "$STATE" "$LOG" "$BIN"
LOCK_FILE="$WORK/graph-write.lock"

# This suite runs the REAL dispatch-fleet-alarm script in place, so anything it
# invokes that writes a routing decision would land in the PRODUCTION log.
# Redirect the log into the scratch dir. test-decision-log-isolation.sh enforces
# that every suite here either sources a fixture helper or makes this exact
# assignment; this suite defines its own tiny assert helpers rather than
# sourcing test-helpers.sh, so the assignment is the isolation.
export DISPATCH_DECISION_LOG_DIR="$WORK/decision-log"
mkdir -p "$DISPATCH_DECISION_LOG_DIR"

# --- fixture node writer -----------------------------------------------------
# Same field set as test-assert-node-selection.sh's write_node_fixture (proven
# to satisfy readNode's validateNode), reused here for the same reason: this
# is the store's real schema-validating reader, not a stub.
OFFICE_HOURS_BLOCK=$(cat <<'EOF'
office_hours:
  reason: worker session froze
  since: 2026-08-01
  recommendation: null
  session_type: other
EOF
)
write_fixture() { # <id> <phase-yaml-value> <office_hours-block>
  local id="$1" phase="$2" oh="$3"
  cat > "$INTENTIONS/$id.md" <<EOF
---
id: $id
kind: tactic
statement: Fixture fleet-alarm node for dispatch-fleet-alarm classify() tests
owner: ai
status: raw
parent: null
phase: $phase
execution: null
serves: [strategy-autonomous-execution]
recovers: []
clarifications: []
tooling_goals: []
validates: []
blocked_by: []
$oh
pace_exempt: true
rounds: null
attributes: {}
rationale: null
reading: null
gap: null
success_signal: null
attention: null
---
# Fixture fleet-alarm node
EOF
}

# --- stubs (write paths only — classify() itself is left UNSTUBBED) ---------
cat > "$BIN/stub-write-node" <<'STUB'
#!/usr/bin/env bash
echo "write-node $*" >> "$STUB_LOG/write-node.log"
exit 0
STUB
cat > "$BIN/stub-dump-node" <<'STUB'
#!/usr/bin/env bash
echo "dump-node $*" >> "$STUB_LOG/dump-node.log"
outdir=""
while [[ $# -gt 0 ]]; do case "$1" in --out-dir) outdir="$2"; shift 2 ;; *) shift ;; esac; done
mkdir -p "$outdir"
printf 'stub-manifest\n' > "$outdir/base-manifest.txt"
printf '%s\n' "$outdir/base-manifest.txt"
STUB
cat > "$BIN/stub-graph-commit" <<'STUB'
#!/usr/bin/env bash
echo "graph-commit $*" >> "$STUB_LOG/graph-commit.log"
exit 0
STUB
cat > "$BIN/stub-verify-landed" <<'STUB'
#!/usr/bin/env bash
echo "verify-landed $*" >> "$STUB_LOG/verify-landed.log"
exit 0
STUB
chmod +x "$BIN"/stub-*

run_alarm() { # <env NAME=value ...> -- <args to the SUT ...>
  local -a envs=()
  while [[ $# -gt 0 && "$1" != "--" ]]; do envs+=("$1"); shift; done
  shift # drop the --
  rm -f "$LOG"/*.log
  OUT=$(env \
    STUB_LOG="$LOG" \
    DISPATCH_FLEET_ALARM_STATE_DIR="$STATE" \
    DISPATCH_FLEET_ALARM_MIN_REFRESH_INTERVAL=0 \
    DISPATCH_FLEET_ALARM_INTENTIONS_DIR="$INTENTIONS" \
    DISPATCH_FLEET_ALARM_WRITE_NODE_CMD="$BIN/stub-write-node" \
    DISPATCH_FLEET_ALARM_DUMP_NODE_CMD="$BIN/stub-dump-node" \
    DISPATCH_FLEET_ALARM_GRAPH_COMMIT_CMD="$BIN/stub-graph-commit" \
    DISPATCH_FLEET_ALARM_VERIFY_LANDED_CMD="$BIN/stub-verify-landed" \
    DISPATCH_FLEET_ALARM_RETRY_DELAY=0 \
    DISPATCH_FLEET_ALARM_RETRIES=1 \
    DISPATCH_GRAPH_WRITE_LOCK_FILE="$LOCK_FILE" \
    "${envs[@]}" "$SUT" "$@" 2>&1)
  RC=$?
}
log_lines() { [[ -f "$LOG/$1" ]] && cat "$LOG/$1" || printf ''; }

BODY="$WORK/body.md"
printf 'The alarm condition is still active.\n' > "$BODY"

# --- (1) office_hours parked, phase NOT done -> classify open, park survives -
write_fixture "tactic-fleet-alarm-busy-stall" "null" "$OFFICE_HOURS_BLOCK"
BEFORE="$(cat "$INTENTIONS/tactic-fleet-alarm-busy-stall.md")"
run_alarm -- --kind busy-stall --statement 'busy-stall fixture' --body-file "$BODY"
assert_eq "(1) exits 0" "0" "$RC"
assert_eq "(1) classified open: NO write-node (mint) call" "" "$(log_lines write-node.log)"
assert_contains "(1) classified open: dump-node WAS called" "dump-node" "$(log_lines dump-node.log)"
assert_contains "(1) classified open: graph-commit ran with --base" "--base" "$(log_lines graph-commit.log)"
AFTER="$(cat "$INTENTIONS/tactic-fleet-alarm-busy-stall.md")"
assert_eq "(1) park survives the re-detection byte-for-byte in frontmatter" \
  "$(printf '%s' "$BEFORE" | awk '{print} /^---$/{c++; if(c==2) exit}')" \
  "$(printf '%s' "$AFTER"  | awk '{print} /^---$/{c++; if(c==2) exit}')"
assert_contains "(1) office_hours reason still present on disk" \
  "worker session froze" "$AFTER"

# --- (2) control: phase done (office_hours null) -> classify closed, mint ---
write_fixture "tactic-fleet-alarm-unclaimed-hold" "done" "office_hours: null"
run_alarm -- --kind unclaimed-hold --statement 'unclaimed-hold fixture' --body-file "$BODY"
assert_eq "(2) exits 0" "0" "$RC"
assert_contains "(2) classified closed: write-node (mint) WAS called" \
  "--file" "$(log_lines write-node.log)"
assert_eq "(2) mint passes NO --base" "" "$(log_lines dump-node.log)"

# --- (3) office_hours parked AND phase done -> still classify closed --------
# phase remains the sole closed trigger; office_hours no longer participates
# in the predicate at all, in either direction.
write_fixture "tactic-fleet-alarm-daemon-degraded" "done" "$OFFICE_HOURS_BLOCK"
run_alarm -- --kind daemon-degraded --statement 'daemon-degraded fixture' --body-file "$BODY"
assert_eq "(3) exits 0" "0" "$RC"
assert_contains "(3) classified closed: write-node (mint) WAS called" \
  "--file" "$(log_lines write-node.log)"
assert_eq "(3) mint passes NO --base" "" "$(log_lines dump-node.log)"

# --- results -----------------------------------------------------------------
echo ""
echo "================================"
echo "Results: $PASS passed, $FAIL failed"
echo "================================"
[[ "$FAIL" -eq 0 ]]
