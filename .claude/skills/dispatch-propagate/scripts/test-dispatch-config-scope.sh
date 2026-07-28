#!/usr/bin/env bash
# Tests for dispatch-config-scope — the agent-behavior config predicate.
#
# Verifies the stdin-in/stdout-out contract: a path list is classified by
# prefix match only (no gh, no network, no file reads), the config subset is
# echoed to stdout, and the exit code is the predicate result (0 = no config
# paths, 1 = at least one config path, 2 = bad usage).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"

SUT="$SCRIPT_DIR/dispatch-config-scope"

OUT=""
RC=0
run_scope() {  # $1 = newline-separated paths on stdin
  set +e
  OUT="$(printf '%s' "$1" | "$SUT")"
  RC=$?
  set -e
}

# ============================================================================
# Case 1: packages/**-only list -> exit 0, empty stdout
# ============================================================================
echo "Case 1: non-config paths only -> exit 0, empty stdout"
run_scope "packages/intentionsutil/scripts/lib.sh
packages/foo/src/index.ts"
assert_eq "non-config exit 0" "0" "$RC"
assert_eq "non-config empty stdout" "" "$OUT"

# ============================================================================
# Case 2: a single .claude/ path -> exit 1, echoes only that path
# ============================================================================
echo "Case 2: single .claude/ path -> exit 1, echoes only that path"
run_scope ".claude/skills/foo/SKILL.md"
assert_eq "single config exit 1" "1" "$RC"
assert_eq "single config stdout" ".claude/skills/foo/SKILL.md" "$OUT"

# ============================================================================
# Case 3: mixed list -> exit 1, echoes only the config paths
# ============================================================================
echo "Case 3: mixed list -> exit 1, echoes only the config subset"
run_scope "packages/foo/src/index.ts
.claude/settings.json
packages/bar/src/index.ts
.claude/skills/foo/SKILL.md"
assert_eq "mixed exit 1" "1" "$RC"
assert_eq "mixed stdout" ".claude/settings.json
.claude/skills/foo/SKILL.md" "$OUT"

# ============================================================================
# Case 4: .claudeignore-style near-miss does NOT match (must have the slash)
# ============================================================================
echo "Case 4: .claudeignore near-miss does not match"
run_scope ".claudeignore"
assert_eq "near-miss exit 0" "0" "$RC"
assert_eq "near-miss empty stdout" "" "$OUT"

echo "Case 4b: near-miss mixed with a real .claude/ path only flags the real one"
run_scope ".claudeignore
.claude/settings.local.json"
assert_eq "near-miss mixed exit 1" "1" "$RC"
assert_eq "near-miss mixed stdout" ".claude/settings.local.json" "$OUT"

# ============================================================================
# Case 5: empty stdin -> exit 0, empty stdout
# ============================================================================
echo "Case 5: empty stdin -> exit 0, empty stdout"
run_scope ""
assert_eq "empty stdin exit 0" "0" "$RC"
assert_eq "empty stdin empty stdout" "" "$OUT"

# ============================================================================
# Case 6: unexpected argument -> exit 2
# ============================================================================
echo "Case 6: unexpected argument -> exit 2"
set +e
printf '' | "$SUT" --bogus >/dev/null 2>&1
ARG_RC=$?
set -e
assert_eq "unexpected argument exit 2" "2" "$ARG_RC"

report_results
