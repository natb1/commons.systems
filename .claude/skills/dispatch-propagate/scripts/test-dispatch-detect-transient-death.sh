#!/usr/bin/env bash
# Tests for dispatch-detect-transient-death -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 26957-27105.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-detect-transient-death tests (#1733)
# ============================================================================
#
# Exercises the transient-death detector: exit 0 iff the transcript's LAST
# assistant turn is an isApiErrorMessage:true turn whose joined text contains any
# of the allowlisted transient-death signatures — the original rate-limit
# substring `(not your usage limit)`, `529 Overloaded`, or `Stream idle timeout`;
# exit 1 otherwise (fail-safe). Fixtures are one compact JSON object per line,
# written with printf '%s\n' (NOT echo) so the JSONL is byte-exact.
echo ""
echo "=== dispatch-detect-transient-death ==="

DRD="$SCRIPT_DIR/dispatch-detect-transient-death"

drd_setup() {
  TMPDIR_TEST=$(mktemp -d)
}
drd_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
}

# A transient-death turn (rate-limit signature): isApiErrorMessage:true + the `(not your usage limit)`
# server-overload substring. A normal assistant final turn has no isApiErrorMessage.
RL_TURN='{"type":"assistant","isApiErrorMessage":true,"message":{"role":"assistant","content":[{"type":"text","text":"API Error: Server is temporarily limiting requests (not your usage limit) · Rate limited"}]}}'
NORMAL_TURN='{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"work in progress"}]}}'
# The user's OWN usage-limit exhaustion error — apiError, but WITHOUT the
# `(not your usage limit)` substring, so the detector must NOT match it.
USAGE_TURN='{"type":"assistant","isApiErrorMessage":true,"message":{"role":"assistant","content":[{"type":"text","text":"API Error: You have exceeded your usage limit. Resets at 5pm."}]}}'
# Transient 529 server-overload death (full real sentence; the matcher keys on
# the short substring `529 Overloaded`, surviving the drifting em-dash + URL).
OVERLOADED_TURN='{"type":"assistant","isApiErrorMessage":true,"message":{"role":"assistant","content":[{"type":"text","text":"API Error: 529 Overloaded. This is a server-side issue, usually temporary — try again in a moment. If it persists, check https://status.claude.com."}]}}'
# Streaming transport stall death.
IDLE_TURN='{"type":"assistant","isApiErrorMessage":true,"message":{"role":"assistant","content":[{"type":"text","text":"API Error: Stream idle timeout - partial response received"}]}}'

# --- Test 1: MATCH — last assistant turn IS the rate-limit apiError → exit 0 --
echo "Test: last turn is the rate-limit apiError → exit 0 (match)"
drd_setup
printf '%s\n' "$NORMAL_TURN" "$RL_TURN" > "$TMPDIR_TEST/match.jsonl"
if "$DRD" "$TMPDIR_TEST/match.jsonl"; then rc=0; else rc=$?; fi
assert_eq "transient-death (rate-limit) match exits 0" "0" "$rc"
drd_teardown

# --- Test 2: NO-MATCH — a normal assistant final turn → exit 1 ---------------
echo "Test: normal assistant final turn (no apiError) → exit 1 (no match)"
drd_setup
printf '%s\n' "$RL_TURN" "$NORMAL_TURN" > "$TMPDIR_TEST/nomatch.jsonl"
if "$DRD" "$TMPDIR_TEST/nomatch.jsonl"; then rc=0; else rc=$?; fi
assert_eq "normal final turn exits 1" "1" "$rc"
drd_teardown

# --- Test 3: USAGE-LIMIT EXCLUSION — final apiError lacks the substring → 1 ---
# A final apiError turn whose text is the user's OWN usage-limit message must NOT
# match: auto-retry on quota exhaustion would loop forever.
echo "Test: final apiError is the user's usage-limit (no substring) → exit 1"
drd_setup
printf '%s\n' "$NORMAL_TURN" "$USAGE_TURN" > "$TMPDIR_TEST/usage.jsonl"
if "$DRD" "$TMPDIR_TEST/usage.jsonl"; then rc=0; else rc=$?; fi
assert_eq "usage-limit apiError exits 1 (no false self-heal)" "1" "$rc"
drd_teardown

# --- Test 4: NOT-LAST — rate-limit turn present but a later normal turn follows
# A session that recovered after the rate-limit and died later for a different
# reason has a DIFFERENT last turn; must NOT self-heal.
echo "Test: rate-limit apiError present but NOT the last turn (recovered) → exit 1"
drd_setup
printf '%s\n' "$RL_TURN" "$NORMAL_TURN" "$NORMAL_TURN" > "$TMPDIR_TEST/notlast.jsonl"
if "$DRD" "$TMPDIR_TEST/notlast.jsonl"; then rc=0; else rc=$?; fi
assert_eq "rate-limit not the last turn exits 1" "1" "$rc"
drd_teardown

# --- Test 5: EMPTY file → exit 1 (no assistant turns) ------------------------
echo "Test: empty transcript → exit 1"
drd_setup
: > "$TMPDIR_TEST/empty.jsonl"
if "$DRD" "$TMPDIR_TEST/empty.jsonl"; then rc=0; else rc=$?; fi
assert_eq "empty transcript exits 1" "1" "$rc"
drd_teardown

# --- Test 6: MISSING path → exit 1 -------------------------------------------
echo "Test: missing transcript path → exit 1"
drd_setup
if "$DRD" "$TMPDIR_TEST/does-not-exist.jsonl"; then rc=0; else rc=$?; fi
assert_eq "missing transcript exits 1" "1" "$rc"
drd_teardown

# --- Test 7: UNREADABLE file (chmod 000) → exit 1 ----------------------------
echo "Test: unreadable transcript (no read perm) → exit 1"
drd_setup
printf '%s\n' "$RL_TURN" > "$TMPDIR_TEST/noread.jsonl"
chmod 000 "$TMPDIR_TEST/noread.jsonl"
if "$DRD" "$TMPDIR_TEST/noread.jsonl"; then rc=0; else rc=$?; fi
assert_eq "unreadable transcript exits 1" "1" "$rc"
chmod 644 "$TMPDIR_TEST/noread.jsonl"
drd_teardown

# --- Test 8: no-arg invocation → exit 1 --------------------------------------
echo "Test: no transcript argument → exit 1"
if "$DRD"; then rc=0; else rc=$?; fi
assert_eq "no-arg detector exits 1" "1" "$rc"

# --- Test 9: MATCH — last turn is 529 Overloaded apiError → exit 0 -----------
echo "Test: last turn is 529 Overloaded apiError → exit 0 (match)"
drd_setup
printf '%s\n' "$NORMAL_TURN" "$OVERLOADED_TURN" > "$TMPDIR_TEST/overloaded.jsonl"
if "$DRD" "$TMPDIR_TEST/overloaded.jsonl"; then rc=0; else rc=$?; fi
assert_eq "529 Overloaded match exits 0" "0" "$rc"
drd_teardown

# --- Test 10: MATCH — last turn is Stream idle timeout apiError → exit 0 -----
echo "Test: last turn is Stream idle timeout apiError → exit 0 (match)"
drd_setup
printf '%s\n' "$NORMAL_TURN" "$IDLE_TURN" > "$TMPDIR_TEST/idle.jsonl"
if "$DRD" "$TMPDIR_TEST/idle.jsonl"; then rc=0; else rc=$?; fi
assert_eq "Stream idle timeout match exits 0" "0" "$rc"
drd_teardown

# --- Test 11: NOT-LAST — 529 Overloaded present but a later normal turn follows
# A session that recovered after a 529 and died later for a different reason has
# a DIFFERENT last turn; must NOT self-heal.
echo "Test: 529 Overloaded apiError present but NOT the last turn (recovered) → exit 1"
drd_setup
printf '%s\n' "$OVERLOADED_TURN" "$NORMAL_TURN" > "$TMPDIR_TEST/overloaded-notlast.jsonl"
if "$DRD" "$TMPDIR_TEST/overloaded-notlast.jsonl"; then rc=0; else rc=$?; fi
assert_eq "529 Overloaded not the last turn exits 1" "1" "$rc"
drd_teardown

# --- Test 12: SYSTEM-LINE ONLY — `529 Overloaded` appears on a non-assistant
# line; the last ASSISTANT turn is normal → exit 1. Proves the matcher reads
# only assistant turns, not system/tool lines that happen to contain the text.
echo "Test: 529 Overloaded only in a system line, last assistant turn normal → exit 1"
drd_setup
SYSTEM_TURN='{"type":"system","content":"529 Overloaded noise"}'
printf '%s\n' "$SYSTEM_TURN" "$NORMAL_TURN" > "$TMPDIR_TEST/system-only.jsonl"
if "$DRD" "$TMPDIR_TEST/system-only.jsonl"; then rc=0; else rc=$?; fi
assert_eq "529 in system line only exits 1" "1" "$rc"
drd_teardown

# --- Test 13: NOT-LAST — Stream idle timeout present but a later normal turn
# A session that recovered after a stream-idle-timeout and died later for a
# different reason has a DIFFERENT last turn; must NOT self-heal.
echo "Test: Stream idle timeout apiError present but NOT the last turn (recovered) → exit 1"
drd_setup
printf '%s\n' "$IDLE_TURN" "$NORMAL_TURN" > "$TMPDIR_TEST/idle-notlast.jsonl"
if "$DRD" "$TMPDIR_TEST/idle-notlast.jsonl"; then rc=0; else rc=$?; fi
assert_eq "Stream idle timeout not the last turn exits 1" "1" "$rc"
drd_teardown

# <<< END MOVED <<<

report_results
