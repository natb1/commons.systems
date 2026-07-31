#!/usr/bin/env bash
# Tests for lib-frozen-session-park.sh — the dispatch-tick sweep that parks the
# intention node of a worker session frozen at a permission/classifier denial.
#
# Everything the sweep touches is faked: `claude agents --json` via
# CLAUDE_AGENTS_CMD (a small script printing a controlled registry array), the
# transcript store via DISPATCH_FROZEN_SESSION_PROJECTS_ROOT (files whose mtime
# `touch -d` sets), the graph via DISPATCH_FROZEN_SESSION_REPO_ROOT (a scratch
# git repo whose refs/remotes/origin/main is set by hand — the sweep only ever
# READS `git show origin/main:` and its fetch is non-fatal, so no real remote is
# needed), `park-node` via DISPATCH_FROZEN_SESSION_PARK_NODE (an argv logger
# with a test-controlled exit code), and the clock via
# DISPATCH_FROZEN_SESSION_NOW_EPOCH.
#
# frozen_session_sweep always returns 0, but every call is still wrapped in an
# `if` to capture the code — the test shell runs under `set -e`.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib-claude-agents.sh"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib-frozen-session-park.sh"

echo "=== lib-frozen-session-park.sh ==="

# A fixed clock for every test. Transcript mtimes are expressed relative to it.
FS_NOW=1700000000

FS_DIR=""
FS_FAKE=""
FS_REPO=""
FS_PROJ=""
FS_PARK=""
FS_PARKLOG=""
FS_ENTRIES=()
FS_RC=0
FS_ERR=""

fs_setup() {
  FS_DIR=$(mktemp -d)
  FS_FAKE="$FS_DIR/fake-claude"
  FS_REPO="$FS_DIR/repo"
  FS_PROJ="$FS_DIR/projects"
  FS_PARK="$FS_DIR/fake-park-node"
  FS_PARKLOG="$FS_DIR/park-node.log"
  FS_ENTRIES=()
  mkdir -p "$FS_REPO/intentions" "$FS_PROJ/proj-a" "$FS_DIR/decisions"
  : > "$FS_PARKLOG"

  git -C "$FS_REPO" init -q
  git -C "$FS_REPO" config user.email "test@example.com"
  git -C "$FS_REPO" config user.name "Test"

  # The sweep must never see a tick snapshot: CLAUDE_AGENTS_CMD is the fake we
  # want exercised (_claude_agents_raw prefers the snapshot when it is set).
  unset DISPATCH_AGENTS_SNAPSHOT || true

  DISPATCH_FROZEN_SESSION_NOW_EPOCH="$FS_NOW"
  DISPATCH_FROZEN_SESSION_REPO_ROOT="$FS_REPO"
  DISPATCH_FROZEN_SESSION_PROJECTS_ROOT="$FS_PROJ"
  DISPATCH_FROZEN_SESSION_PARK_NODE="$FS_PARK"
  unset DISPATCH_FROZEN_SESSION_GRACE_S || true
  unset DISPATCH_FROZEN_SESSION_PARK_MAX || true

  # lib-decision-log.sh resolves DECISION_LOG_FILE ONCE, at source time, inside
  # its load guard — so a per-test DISPATCH_DECISION_LOG_DIR set after sourcing
  # would not be read. Set the env var for documentation/parity and re-point the
  # already-resolved variable at the same scratch path.
  DISPATCH_DECISION_LOG_DIR="$FS_DIR/decisions"
  DECISION_LOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"

  fs_write_park_node 0
}

fs_teardown() {
  rm -rf "$FS_DIR"
  FS_DIR=""
  unset CLAUDE_AGENTS_CMD || true
  unset DISPATCH_FROZEN_SESSION_NOW_EPOCH DISPATCH_FROZEN_SESSION_REPO_ROOT \
        DISPATCH_FROZEN_SESSION_PROJECTS_ROOT DISPATCH_FROZEN_SESSION_PARK_NODE \
        DISPATCH_FROZEN_SESSION_GRACE_S DISPATCH_FROZEN_SESSION_PARK_MAX \
        DISPATCH_DECISION_LOG_DIR || true
}

# fs_write_park_node <exit-code> — install the fake park-node: it appends its
# argc and each positional argument to the log, then exits <exit-code>.
fs_write_park_node() {
  cat > "$FS_PARK" <<PARK
#!/usr/bin/env bash
{
  printf 'ARGC=%s\n' "\$#"
  for a in "\$@"; do printf 'ARG=%s\n' "\$a"; done
} >> "$FS_PARKLOG"
exit $1
PARK
  chmod +x "$FS_PARK"
}

# fs_add_session <sid> <name> <state> — append one registry entry.
fs_add_session() {
  FS_ENTRIES+=("{\"sessionId\":\"$1\",\"name\":\"$2\",\"state\":\"$3\",\"status\":\"busy\",\"cwd\":\"/tmp/$2\"}")
}

# fs_install_claude [exit-code] — install the fake `claude` emitting the
# accumulated registry array (copied from write_fake_claude in
# test-lib-claude-agents.sh) and point CLAUDE_AGENTS_CMD at it.
fs_install_claude() {
  local exit_code="${1:-0}" payload
  payload=$( IFS=,; printf '[%s]' "${FS_ENTRIES[*]}" )
  printf '%s' "$payload" > "$FS_DIR/payload.json"
  cat > "$FS_FAKE" <<FAKE
#!/usr/bin/env bash
cat "$FS_DIR/payload.json"
exit $exit_code
FAKE
  chmod +x "$FS_FAKE"
  CLAUDE_AGENTS_CMD="$FS_FAKE"
}

# fs_write_node <id> <unparked|parked|bodymention> — write one node markdown
# file into the scratch repo's intentions/ dir.
fs_write_node() {
  # Split assignments: `local` expands every word before assigning any of them,
  # so `f=".../$id.md"` on the same line would read an unset $id under `set -u`.
  local id="$1" kind="$2"
  local f="$FS_REPO/intentions/$id.md"
  case "$kind" in
    parked)
      cat > "$f" <<NODE
---
id: $id
kind: tactic
office_hours:
  reason: parked earlier by something else
  recommendation: null
---

Body text.
NODE
      ;;
    bodymention)
      # Frontmatter park state is null, but the markdown BODY carries a
      # column-0 \`office_hours:\` line (documentation of the serialization).
      # The frontmatter-scoped test must NOT read this as park state.
      cat > "$f" <<NODE
---
id: $id
kind: tactic
office_hours: null
---

The park record serializes as:

office_hours:
  reason: ...
NODE
      ;;
    *)
      cat > "$f" <<NODE
---
id: $id
kind: tactic
office_hours: null
---

Body text.
NODE
      ;;
  esac
}

# fs_commit_nodes — commit whatever is in intentions/ and publish it as
# origin/main (no bare remote needed; the sweep only reads the ref).
fs_commit_nodes() {
  git -C "$FS_REPO" add -A
  git -C "$FS_REPO" commit -q -m "nodes"
  git -C "$FS_REPO" update-ref refs/remotes/origin/main HEAD
}

# fs_write_transcript <sid> <mtime-epoch>
fs_write_transcript() {
  printf '{}\n' > "$FS_PROJ/proj-a/$1.jsonl"
  touch -d "@$2" "$FS_PROJ/proj-a/$1.jsonl"
}

fs_run() {
  if frozen_session_sweep 2>"$FS_DIR/err"; then FS_RC=0; else FS_RC=$?; fi
  FS_ERR=$(cat "$FS_DIR/err")
}

fs_contains() {
  case "$FS_ERR" in *"$1"*) printf 'yes' ;; *) printf 'no' ;; esac
}

fs_park_calls() {
  local c
  c=$(grep -c '^ARGC=' "$FS_PARKLOG" 2>/dev/null) || c=0
  [[ -n "$c" ]] || c=0
  printf '%s' "$c"
}

fs_err_count() {
  local c
  c=$(grep -c -- "$1" <<<"$FS_ERR") || c=0
  [[ -n "$c" ]] || c=0
  printf '%s' "$c"
}

fs_log_dispositions() {
  [[ -f "$DECISION_LOG_FILE" ]] || return 0
  jq -r 'select(.site == "frozen-session-sweep") | .disposition' "$DECISION_LOG_FILE"
}

# --- Test 1: an aged blocked node worker is parked ---------------------------

echo "Test: an aged blocked node worker with an unparked node is parked"
fs_setup
fs_write_node "tactic-frozen-one" unparked
fs_commit_nodes
fs_write_transcript "0aa1-1111" $(( FS_NOW - 2000 ))
fs_add_session "0aa1-1111" "tactic-frozen-one" "blocked"
fs_install_claude 0
fs_run
assert_eq "park: sweep returns 0" "0" "$FS_RC"
assert_eq "park: park-node invoked exactly once" "1" "$(fs_park_calls)"
assert_eq "park: park-node received 3 positional args" "ARGC=3" "$(grep '^ARGC=' "$FS_PARKLOG")"
assert_eq "park: node id is \$1" "tactic-frozen-one" "$(grep '^ARG=' "$FS_PARKLOG" | head -n1 | sed 's/^ARG=//')"
assert_eq "park: stderr reports the park" "yes" "$(fs_contains 'parked tactic-frozen-one (denied-command-frozen')"
assert_eq "park: one decision record, disposition=parked" "parked" "$(fs_log_dispositions)"
assert_eq "park: summary counts one park" "yes" \
  "$(fs_contains 'sweep complete (blocked=1 parked=1 observing=0 unmeasurable=0 deferred=0)')"
fs_teardown

# --- Test 2: idle below the grace is observed, not parked --------------------

echo "Test: a blocked worker idle below the grace is observed, not parked"
fs_setup
fs_write_node "tactic-fresh" unparked
fs_commit_nodes
fs_write_transcript "0bb2-2222" $(( FS_NOW - 60 ))
fs_add_session "0bb2-2222" "tactic-fresh" "blocked"
fs_install_claude 0
fs_run
assert_eq "grace: sweep returns 0" "0" "$FS_RC"
assert_eq "grace: park-node not invoked" "0" "$(fs_park_calls)"
assert_eq "grace: stderr reports observing" "yes" "$(fs_contains 'observing tactic-fresh (state=blocked, idle_seconds=60 < grace_seconds=900')"
fs_teardown

# --- Test 3: a missing transcript is UNKNOWN, never a park -------------------

echo "Test: a blocked worker with no transcript is kept (idle unmeasurable)"
fs_setup
fs_write_node "tactic-no-transcript" unparked
fs_commit_nodes
fs_add_session "0cc3-3333" "tactic-no-transcript" "blocked"
fs_install_claude 0
fs_run
assert_eq "unmeasurable: sweep returns 0" "0" "$FS_RC"
assert_eq "unmeasurable: park-node not invoked" "0" "$(fs_park_calls)"
assert_eq "unmeasurable: stderr reports the unreadable transcript" "yes" "$(fs_contains 'transcript unreadable')"
assert_eq "unmeasurable: summary counts it" "yes" \
  "$(fs_contains 'sweep complete (blocked=1 parked=0 observing=0 unmeasurable=1 deferred=0)')"
fs_teardown

# --- Test 4: an already-parked node is skipped; frontmatter scoping holds ----

echo "Test: an already-parked node is skipped, and a body-only office_hours line is not park state"
fs_setup
fs_write_node "tactic-already" parked
fs_write_node "tactic-body-mention" bodymention
fs_commit_nodes
fs_write_transcript "0dd4-4444" $(( FS_NOW - 3000 ))
fs_write_transcript "0ee5-5555" $(( FS_NOW - 3000 ))
fs_add_session "0dd4-4444" "tactic-already" "blocked"
fs_add_session "0ee5-5555" "tactic-body-mention" "blocked"
fs_install_claude 0
fs_run
assert_eq "already-parked: sweep returns 0" "0" "$FS_RC"
assert_eq "already-parked: stderr reports the skip" "yes" "$(fs_contains 'skipping tactic-already (already parked to office_hours)')"
assert_eq "already-parked: exactly one park-node invocation" "1" "$(fs_park_calls)"
assert_eq "already-parked: the body-mention node is the one parked" "tactic-body-mention" \
  "$(grep '^ARG=' "$FS_PARKLOG" | head -n1 | sed 's/^ARG=//')"
fs_teardown

# --- Test 5: no blocked sessions at all --------------------------------------

echo "Test: busy/working sessions produce no candidates"
fs_setup
fs_write_node "tactic-busy" unparked
fs_commit_nodes
fs_add_session "0ff6-6666" "tactic-busy" "working"
fs_add_session "0ab7-7777" "tactic-other" "busy"
fs_install_claude 0
fs_run
assert_eq "no-candidates: sweep returns 0" "0" "$FS_RC"
assert_eq "no-candidates: park-node not invoked" "0" "$(fs_park_calls)"
assert_eq "no-candidates: summary reports blocked=0" "yes" \
  "$(fs_contains 'sweep complete (blocked=0 parked=0 observing=0 unmeasurable=0 deferred=0)')"
fs_teardown

# --- Test 6: an unqueryable daemon parks nothing -----------------------------

echo "Test: an unqueryable daemon parks nothing and still returns 0"
fs_setup
fs_write_node "tactic-unknown" unparked
fs_commit_nodes
fs_write_transcript "0bc8-8888" $(( FS_NOW - 5000 ))
fs_add_session "0bc8-8888" "tactic-unknown" "blocked"
fs_install_claude 1
fs_run
assert_eq "daemon-fail: sweep returns 0" "0" "$FS_RC"
assert_eq "daemon-fail: park-node not invoked" "0" "$(fs_park_calls)"
assert_eq "daemon-fail: stderr reports the unqueryable daemon" "yes" "$(fs_contains 'daemon unqueryable; parking nothing')"
fs_teardown

# --- Test 7: a park-node failure is isolated to its candidate ----------------

echo "Test: a park-node failure is logged and the next candidate is still processed"
fs_setup
fs_write_park_node 1
fs_write_node "tactic-fail-one" unparked
fs_write_node "tactic-fail-two" unparked
fs_commit_nodes
fs_write_transcript "0cd9-9999" $(( FS_NOW - 4000 ))
fs_write_transcript "0dea-aaaa" $(( FS_NOW - 4000 ))
fs_add_session "0cd9-9999" "tactic-fail-one" "blocked"
fs_add_session "0dea-aaaa" "tactic-fail-two" "blocked"
fs_install_claude 0
fs_run
assert_eq "park-fail: sweep returns 0" "0" "$FS_RC"
assert_eq "park-fail: both candidates attempted" "2" "$(fs_park_calls)"
assert_eq "park-fail: stderr reports the first failure" "yes" "$(fs_contains 'park failed for tactic-fail-one (park-node exit 1); will retry next tick')"
assert_eq "park-fail: stderr reports the second failure" "yes" "$(fs_contains 'park failed for tactic-fail-two (park-node exit 1)')"
assert_eq "park-fail: both decision records say park-failed" "$(printf 'park-failed\npark-failed')" "$(fs_log_dispositions)"
assert_eq "park-fail: summary counts zero parks" "yes" \
  "$(fs_contains 'sweep complete (blocked=2 parked=0 observing=0 unmeasurable=0 deferred=0)')"
fs_teardown

# --- Test 8: the per-sweep park cap defers the excess ------------------------

echo "Test: the park cap bounds parks per sweep and defers the rest"
fs_setup
DISPATCH_FROZEN_SESSION_PARK_MAX=2
for n in one two three four; do
  fs_write_node "tactic-cap-$n" unparked
done
fs_commit_nodes
i=1
for n in one two three four; do
  fs_write_transcript "0cab-000$i" $(( FS_NOW - 4000 ))
  fs_add_session "0cab-000$i" "tactic-cap-$n" "blocked"
  i=$(( i + 1 ))
done
fs_install_claude 0
fs_run
assert_eq "cap: sweep returns 0" "0" "$FS_RC"
assert_eq "cap: exactly two park-node invocations" "2" "$(fs_park_calls)"
assert_eq "cap: two deferring lines" "2" "$(fs_err_count 'lib-frozen-session-park: deferring ')"
assert_eq "cap: summary counts the deferrals" "yes" \
  "$(fs_contains 'sweep complete (blocked=4 parked=2 observing=0 unmeasurable=0 deferred=2)')"
fs_teardown

# --- Test 9: routers are filtered out; legacy <N>- workers have no node ------

echo "Test: a blocked router is not a candidate and a blocked <N>-slug worker has no graph node"
fs_setup
fs_write_node "tactic-unused" unparked
fs_commit_nodes
fs_write_transcript "0efb-bbbb" $(( FS_NOW - 4000 ))
fs_write_transcript "0fac-cccc" $(( FS_NOW - 4000 ))
fs_add_session "0efb-bbbb" "dispatch-abc123" "blocked"
fs_add_session "0fac-cccc" "123-slug" "blocked"
fs_install_claude 0
fs_run
assert_eq "router: sweep returns 0" "0" "$FS_RC"
assert_eq "router: park-node not invoked" "0" "$(fs_park_calls)"
assert_eq "router: the router is absent from the candidate set (blocked=1)" "yes" \
  "$(fs_contains 'sweep complete (blocked=1 parked=0 observing=0 unmeasurable=0 deferred=0)')"
assert_eq "router: the router is never mentioned on stderr" "no" "$(fs_contains 'dispatch-abc123')"
assert_eq "router: the <N>- worker is reported as having no graph node" "yes" \
  "$(fs_contains 'frozen worker 123-slug has no graph node (session=0fac-cccc); not parking')"
fs_teardown

# --- Test 10: an invalid node-id name is never used to build a path ----------

echo "Test: a blocked worker whose name fails the node-id regex is skipped"
fs_setup
fs_write_node "tactic-valid" unparked
fs_commit_nodes
fs_write_transcript "0abd-dddd" $(( FS_NOW - 4000 ))
fs_add_session "0abd-dddd" "tactic-Bad_Id" "blocked"
fs_install_claude 0
fs_run
assert_eq "bad-id: sweep returns 0" "0" "$FS_RC"
assert_eq "bad-id: park-node not invoked" "0" "$(fs_park_calls)"
assert_eq "bad-id: stderr reports the invalid node id" "yes" \
  "$(fs_contains 'frozen worker tactic-Bad_Id is not a valid node id; not parking')"
assert_eq "bad-id: no transcript/idle line was reached for it" "no" "$(fs_contains 'idle_seconds')"
fs_teardown

report_results
