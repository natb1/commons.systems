#!/usr/bin/env bash
# Tests for dispatch-recover-session-id -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 29052-29153.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-recover-session-id (#2240)
# ============================================================================
#
# Pure-filesystem reader: globs *.dispatch-stamp.json under
# DISPATCH_STAMP_PROJECTS_ROOT, filters by .issue, sorts newest-first by
# .stamped_at, and returns the first candidate whose .jsonl transcript exists.
#
# Each case runs in its own subshell over a mktemp -d fake projects root so
# nothing leaks across tests and teardown() is untouched.

echo ""
echo "=== dispatch-recover-session-id ==="

RECOVER="$SCRIPT_DIR/dispatch-recover-session-id"

# T1. recoverable: sidecar (.issue==N) + its .jsonl present → emits sid<TAB>branch, rc 0.
(
  root=$(mktemp -d)
  export DISPATCH_STAMP_PROJECTS_ROOT="$root"
  proj="$root/some-project-slug"
  mkdir -p "$proj"
  sid="abc-session-1"
  printf '%s\n' \
    '{"schema":1,"session_id":"abc-session-1","repo":"natb1/commons.systems","issue":42,"pr":null,"branch":"42-feature","base_sha":"deadbeef","stamped_at":"2026-06-01T10:00:00Z"}' \
    > "$proj/${sid}.dispatch-stamp.json"
  touch "$proj/${sid}.jsonl"
  rc=0
  out=$("$RECOVER" --issue 42 2>/dev/null) || rc=$?
  assert_eq "recover: recoverable → rc 0" "0" "$rc"
  assert_eq "recover: recoverable → sid<TAB>branch" "abc-session-1	42-feature" "$out"
  rm -rf "$root"
) || true

# T2. newest-purged, older-survives: two sidecars for issue N; newest .jsonl absent,
#     older .jsonl present → emits the OLDER recoverable session (proves
#     newest-EXISTING, not latest-then-verify).
(
  root=$(mktemp -d)
  export DISPATCH_STAMP_PROJECTS_ROOT="$root"
  proj="$root/some-project-slug"
  mkdir -p "$proj"
  # newer sidecar — stamped_at later, but no .jsonl
  sid_new="newer-session"
  printf '%s\n' \
    '{"schema":1,"session_id":"newer-session","repo":"natb1/commons.systems","issue":99,"pr":null,"branch":"99-newer","base_sha":"aaa","stamped_at":"2026-06-02T12:00:00Z"}' \
    > "$proj/${sid_new}.dispatch-stamp.json"
  # Set mtime one second later too so secondary sort agrees with stamped_at.
  touch -d "2026-06-02 12:00:01" "$proj/${sid_new}.dispatch-stamp.json" 2>/dev/null || true
  # NO .jsonl for newer session

  # older sidecar — stamped_at earlier, .jsonl present
  sid_old="older-session"
  printf '%s\n' \
    '{"schema":1,"session_id":"older-session","repo":"natb1/commons.systems","issue":99,"pr":null,"branch":"99-older","base_sha":"bbb","stamped_at":"2026-06-01T08:00:00Z"}' \
    > "$proj/${sid_old}.dispatch-stamp.json"
  touch -d "2026-06-01 08:00:00" "$proj/${sid_old}.dispatch-stamp.json" 2>/dev/null || true
  touch "$proj/${sid_old}.jsonl"

  rc=0
  out=$("$RECOVER" --issue 99 2>/dev/null) || rc=$?
  assert_eq "recover: newest-purged, older-survives → rc 0" "0" "$rc"
  assert_eq "recover: newest-purged, older-survives → emits older session" "older-session	99-older" "$out"
  rm -rf "$root"
) || true

# T3. no-transcript: sidecar present but .jsonl absent → rc 1, no stdout.
(
  root=$(mktemp -d)
  export DISPATCH_STAMP_PROJECTS_ROOT="$root"
  proj="$root/some-project-slug"
  mkdir -p "$proj"
  sid="no-transcript-session"
  printf '%s\n' \
    '{"schema":1,"session_id":"no-transcript-session","repo":"natb1/commons.systems","issue":7,"pr":null,"branch":"7-thing","base_sha":"ccc","stamped_at":"2026-05-01T00:00:00Z"}' \
    > "$proj/${sid}.dispatch-stamp.json"
  # Deliberately do NOT touch .jsonl
  rc=0
  out=$("$RECOVER" --issue 7 2>/dev/null) || rc=$?
  assert_eq "recover: no-transcript → rc 1" "1" "$rc"
  assert_eq "recover: no-transcript → no stdout" "" "$out"
  rm -rf "$root"
) || true

# T4. wrong-issue: only a DIFFERENT issue's sidecar present → rc 1 (no misattribution).
(
  root=$(mktemp -d)
  export DISPATCH_STAMP_PROJECTS_ROOT="$root"
  proj="$root/some-project-slug"
  mkdir -p "$proj"
  sid="wrong-issue-session"
  printf '%s\n' \
    '{"schema":1,"session_id":"wrong-issue-session","repo":"natb1/commons.systems","issue":100,"pr":null,"branch":"100-other","base_sha":"ddd","stamped_at":"2026-05-15T00:00:00Z"}' \
    > "$proj/${sid}.dispatch-stamp.json"
  touch "$proj/${sid}.jsonl"
  rc=0
  out=$("$RECOVER" --issue 5 2>/dev/null) || rc=$?
  assert_eq "recover: wrong-issue → rc 1" "1" "$rc"
  assert_eq "recover: wrong-issue → no stdout" "" "$out"
  rm -rf "$root"
) || true

# <<< END MOVED <<<

report_results
