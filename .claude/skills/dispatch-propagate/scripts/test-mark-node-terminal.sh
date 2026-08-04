#!/usr/bin/env bash
# Tests for mark-node-terminal -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split).
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
echo ""
echo "=== mark-node-terminal ==="
#
# mark-node-terminal writes the $CLAUDE_JOB_DIR/node-terminal marker that
# dispatch-self-close's node-worker invariant reads. Two gates matter:
#   - CLAUDE_JOB_DIR unset/absent → interactive no-op (exit 0, no write).
#   - OWNERSHIP: state.json's .name must equal <node-id>, else exit 0 with NO
#     write. This is what makes park-node's unconditional call safe — an
#     office-hours drain parking three OTHER nodes cannot authorize its own reap.
# Usage errors (bad node id, unknown disposition) are exit 2, never a fallback.

MARK_NODE_TERMINAL="$UTIL_SCRIPT_DIR/mark-node-terminal"

# mnt_job <node-id> — fresh job dir whose state.json names <node-id>.
mnt_job() {
  MNT_DIR=$(mktemp -d)
  printf '{"name":"%s"}\n' "$1" > "$MNT_DIR/state.json"
}
mnt_clean() { rm -rf "$MNT_DIR"; MNT_DIR=""; }
# mnt_has_marker — 1 when node-terminal exists, else 0.
mnt_has_marker() { [ -f "$MNT_DIR/node-terminal" ] && echo 1 || echo 0; }

# ----- owning job → exact marker bytes -----
mnt_job "tactic-x"
if CLAUDE_JOB_DIR="$MNT_DIR" "$MARK_NODE_TERMINAL" tactic-x advance 2>/dev/null; then mnt_ec=0; else mnt_ec=$?; fi
assert_eq "mark-node-terminal: exit 0 on happy path" "0" "$mnt_ec"
assert_eq "mark-node-terminal: writes exact node-terminal contents" \
  "$(printf 'node=tactic-x\ndisposition=advance\n')" "$(cat "$MNT_DIR/node-terminal")"
mnt_clean

# ----- the /dispatch-conflict Lane 3 dispositions are accepted -----
# Lane 3 is spawned by dispatch-graph-execute's provision-exit-11 branch under
# the NODE's own name, so it is a node worker to dispatch-stop.sh — but its
# terminal paths call neither transition-node nor park-node, so it declares its
# own marker. A rejected disposition would exit 2, leaving the job HELD and the
# node permanently unselectable.
for mnt_disp in conflict-resolved conflict-hold; do
  mnt_job "tactic-x"
  if CLAUDE_JOB_DIR="$MNT_DIR" "$MARK_NODE_TERMINAL" tactic-x "$mnt_disp" 2>/dev/null; then mnt_ec=0; else mnt_ec=$?; fi
  assert_eq "mark-node-terminal: '$mnt_disp' exit 0" "0" "$mnt_ec"
  assert_eq "mark-node-terminal: '$mnt_disp' writes exact node-terminal contents" \
    "$(printf 'node=tactic-x\ndisposition=%s\n' "$mnt_disp")" "$(cat "$MNT_DIR/node-terminal")"
  mnt_clean
done

# ----- job names a DIFFERENT node → exit 0, NO write -----
# The office-hours-drain / align-tactics-child-land false positive.
mnt_job "tactic-other"
if CLAUDE_JOB_DIR="$MNT_DIR" "$MARK_NODE_TERMINAL" tactic-x park 2>/dev/null; then mnt_ec=0; else mnt_ec=$?; fi
assert_eq "mark-node-terminal: foreign node exits 0" "0" "$mnt_ec"
assert_eq "mark-node-terminal: foreign node writes NO marker" "0" "$(mnt_has_marker)"
mnt_clean

# ----- state.json absent → exit 0, NO write -----
MNT_DIR=$(mktemp -d)
if CLAUDE_JOB_DIR="$MNT_DIR" "$MARK_NODE_TERMINAL" tactic-x advance 2>/dev/null; then mnt_ec=0; else mnt_ec=$?; fi
assert_eq "mark-node-terminal: absent state.json exits 0" "0" "$mnt_ec"
assert_eq "mark-node-terminal: absent state.json writes NO marker" "0" "$(mnt_has_marker)"
mnt_clean

# ----- CLAUDE_JOB_DIR unset → exit 0, diagnostic, NO write -----
# `env -u` because the suite itself may run inside a managed job.
MNT_DIR=$(mktemp -d)
mnt_err=$(env -u CLAUDE_JOB_DIR "$MARK_NODE_TERMINAL" tactic-x advance 2>&1 1>/dev/null) && mnt_ec=0 || mnt_ec=$?
assert_eq "mark-node-terminal: CLAUDE_JOB_DIR unset exits 0" "0" "$mnt_ec"
assert_eq "mark-node-terminal: CLAUDE_JOB_DIR unset writes NO marker" "0" "$(mnt_has_marker)"
TOTAL=$((TOTAL + 1))
if [[ "$mnt_err" == *"CLAUDE_JOB_DIR unset"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: mark-node-terminal: CLAUDE_JOB_DIR unset prints an interactive diagnostic"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: mark-node-terminal: CLAUDE_JOB_DIR unset prints an interactive diagnostic"
  echo "    stderr: $mnt_err"
fi
mnt_clean

# ----- unknown disposition → exit 2, NO write -----
mnt_job "tactic-x"
if CLAUDE_JOB_DIR="$MNT_DIR" "$MARK_NODE_TERMINAL" tactic-x bogus 2>/dev/null; then mnt_ec=0; else mnt_ec=$?; fi
assert_eq "mark-node-terminal: unknown disposition exit 2" "2" "$mnt_ec"
assert_eq "mark-node-terminal: unknown disposition writes NO marker" "0" "$(mnt_has_marker)"
mnt_clean

# ----- malformed node id → exit 2, NO write -----
mnt_job "824-legacy-worker"
if CLAUDE_JOB_DIR="$MNT_DIR" "$MARK_NODE_TERMINAL" 824-legacy-worker park 2>/dev/null; then mnt_ec=0; else mnt_ec=$?; fi
assert_eq "mark-node-terminal: malformed node id exit 2" "2" "$mnt_ec"
assert_eq "mark-node-terminal: malformed node id writes NO marker" "0" "$(mnt_has_marker)"
mnt_clean

# ----- wrong argument count → exit 2 -----
mnt_job "tactic-x"
if CLAUDE_JOB_DIR="$MNT_DIR" "$MARK_NODE_TERMINAL" tactic-x 2>/dev/null; then mnt_ec=0; else mnt_ec=$?; fi
assert_eq "mark-node-terminal: missing disposition exit 2" "2" "$mnt_ec"
mnt_clean

# ----- second call overwrites atomically, leaving no .tmp residue -----
mnt_job "tactic-x"
CLAUDE_JOB_DIR="$MNT_DIR" "$MARK_NODE_TERMINAL" tactic-x advance 2>/dev/null
CLAUDE_JOB_DIR="$MNT_DIR" "$MARK_NODE_TERMINAL" tactic-x park 2>/dev/null
assert_eq "mark-node-terminal: second call overwrites the marker" \
  "$(printf 'node=tactic-x\ndisposition=park\n')" "$(cat "$MNT_DIR/node-terminal")"
assert_eq "mark-node-terminal: no node-terminal.tmp residue" "0" \
  "$([ -e "$MNT_DIR/node-terminal.tmp" ] && echo 1 || echo 0)"
mnt_clean

# <<< END MOVED <<<

report_results
