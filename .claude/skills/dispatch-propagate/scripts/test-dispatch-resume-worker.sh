#!/usr/bin/env bash
# Tests for dispatch-resume-worker -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 27284-27423.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-resume-worker argv-forwarding tests (#2042)
# ============================================================================
#
# Exercises that the resumed `claude --bg` argv carries the per-phase compute
# overrides: a non-empty <model> as `--model <model>` and a non-empty <effort>
# as `--effort <effort>` (after --model when both are present), plus the omit-
# and bad-value contracts for <effort>.
#
# Harness: run the real script in-place (so its `source lib-claude-agents.sh`
# resolves) with all three external effects overridden —
#   DISPATCH_RESUME_WORKER_CLAUDE_CMD        → a fake `claude`
#   DISPATCH_RESUME_WORKER_TICK_CMD          → a no-op `exit 0` stub
#   DISPATCH_RESUME_WORKER_OFFICE_HOURS_CMD  → a no-op stub
# The fake `claude` branches on `$1`: `agents` → print `[]` (a well-formed empty
# array: lib-claude-agents treats `[]` as a definite "no sessions", so dedup
# proceeds to the --bg call; EMPTY stdout would instead read as UNKNOWN and abort
# before any --bg). Any other invocation (the `--bg` resume/fork calls) appends
# its argv to a capture log and exits 0. With `[]` from every `agents` query the
# verify always fails, so the script runs BOTH the primary --bg and the
# --fork-session --bg, captures both argvs, then re-ticks (stub) and exits 0 —
# every captured line carries the same --model/--effort flags, so the adjacency
# assertions hold regardless of which kick "wins".
# LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S=0 skips the verify retry sleeps.
echo ""
echo "=== dispatch-resume-worker (argv forwarding) ==="

drw_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/bin" "$TMPDIR_TEST/cwd"

  # fake claude: `agents ...` → `[]`; anything else (the --bg calls) → log argv.
  cat > "$TMPDIR_TEST/bin/fake-claude" <<STUB
#!/usr/bin/env bash
if [[ "\$1" == "agents" ]]; then
  echo '[]'
  exit 0
fi
echo "\$*" >> "$TMPDIR_TEST/bg-argv-log"
exit 0
STUB
  chmod +x "$TMPDIR_TEST/bin/fake-claude"

  # no-op tick + office-hours stubs (the degradation fallbacks). Both exit 0.
  cat > "$TMPDIR_TEST/bin/noop" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
  chmod +x "$TMPDIR_TEST/bin/noop"

  export DISPATCH_RESUME_WORKER_CLAUDE_CMD="$TMPDIR_TEST/bin/fake-claude"
  export DISPATCH_RESUME_WORKER_TICK_CMD="$TMPDIR_TEST/bin/noop"
  export DISPATCH_RESUME_WORKER_OFFICE_HOURS_CMD="$TMPDIR_TEST/bin/noop"
  export LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S=0
}

drw_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  unset DISPATCH_RESUME_WORKER_CLAUDE_CMD
  unset DISPATCH_RESUME_WORKER_TICK_CMD
  unset DISPATCH_RESUME_WORKER_OFFICE_HOURS_CMD
  unset LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S
}

# --- Test A: <model> + <effort> both present → --model M --effort E adjacency --
# Positionals: <name> <cwd> <sessionId> <model> <effort>. The resumed --bg argv
# is `--bg --name N --permission-mode auto --model M --effort E --resume sid
# continue`; --effort directly follows --model (--permission-mode sits BEFORE
# --model, so assert adjacency, not a fixed index).
echo "Test: dispatch-resume-worker forwards --effort high after --model into the --bg argv"
drw_setup
"$SCRIPT_DIR/dispatch-resume-worker" \
  1733-rl-worker "$TMPDIR_TEST/cwd" sess-abc claude-opus high >/dev/null 2>&1 || true
bg=$(cat "$TMPDIR_TEST/bg-argv-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$bg" == *"--model claude-opus --effort high"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: resume-worker --bg argv carries '--model claude-opus --effort high' (adjacent)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: resume-worker --bg argv carries '--model claude-opus --effort high' (adjacent)"
  echo "    bg-argv: $bg"
fi
drw_teardown

# --- Test B: <effort> omitted → no --effort token in the --bg argv ------------
# 4 positionals (model, no effort). The --bg argv must carry --model but contain
# no --effort token at all.
echo "Test: dispatch-resume-worker omits --effort from the --bg argv when absent"
drw_setup
"$SCRIPT_DIR/dispatch-resume-worker" \
  1733-rl-worker "$TMPDIR_TEST/cwd" sess-abc claude-opus >/dev/null 2>&1 || true
bg=$(cat "$TMPDIR_TEST/bg-argv-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$bg" == *"--model claude-opus"* && "$bg" != *"--effort"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: resume-worker --bg argv carries --model, no --effort token"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: resume-worker --bg argv carries --model, no --effort token"
  echo "    bg-argv: $bg"
fi
drw_teardown

# --- Test C: bad <effort> value → exit 2, no --bg call ------------------------
# The effort closed-set validation runs before lib is sourced and before any
# --bg kick, so a bogus 5th positional exits 2 with an empty argv log. <cwd>
# must be a real directory (line 109 checks -d) — drw_setup makes one.
echo "Test: dispatch-resume-worker exits 2 on an invalid <effort> value"
drw_setup
if "$SCRIPT_DIR/dispatch-resume-worker" \
     1733-rl-worker "$TMPDIR_TEST/cwd" sess-abc claude-opus bogus >/dev/null 2>&1; then
  drw_rc=0
else
  drw_rc=$?
fi
assert_eq "resume-worker bad <effort> → exit 2" "2" "$drw_rc"
bg=$(cat "$TMPDIR_TEST/bg-argv-log" 2>/dev/null || true)
assert_eq "resume-worker bad <effort> → no --bg call (empty argv log)" "" "$bg"
drw_teardown

# --- Test D: empty <model> + present <effort> → --effort, no --model (#2042) --
# THE HEADLINE PATH. dispatch-phase-model returns EMPTY for plan/implement (they
# inherit the Opus default), while dispatch-phase-effort returns high/medium — so
# the real plan/implement resume passes <model>="" and <effort> non-empty. With
# model empty and effort sitting AFTER it, the empty model slot must NOT swallow
# effort: the --model conditional drops out, the --effort conditional fires, so
# the argv carries `--effort high` and NO `--model`. (The two insertions are
# independent conditionals, so this is correct by construction; this pins it.)
echo "Test: dispatch-resume-worker with empty <model> + <effort> high → --effort, no --model"
drw_setup
"$SCRIPT_DIR/dispatch-resume-worker" \
  1733-rl-worker "$TMPDIR_TEST/cwd" sess-abc "" high >/dev/null 2>&1 || true
bg=$(cat "$TMPDIR_TEST/bg-argv-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$bg" == *"--effort high"* && "$bg" != *"--model"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: empty-model+effort --bg argv carries --effort high, no --model"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: empty-model+effort --bg argv carries --effort high, no --model"
  echo "    bg-argv: $bg"
fi
drw_teardown

# <<< END MOVED <<<

report_results
