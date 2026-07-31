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
# The scratch repo must satisfy the sweep's two provenance checks, so the fixture
# builds it the way a real primary checkout looks: HEAD on `main` (set explicitly
# — CI has no init.defaultBranch, so a bare `git init` would land on `master`),
# and the fake `park-node` installed at the ONLY path the sweep will execute,
# `<repo-root>/packages/intentionsutil/scripts/park-node`. Tests 11 and 12 cover
# the negative side of both checks.
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
  # The sweep executes ONLY <repo-root>/packages/intentionsutil/scripts/park-node
  # (provenance check 2), so the fake lives there — DISPATCH_FROZEN_SESSION_PARK_NODE
  # still selects it, it just cannot select anything outside that directory.
  FS_PARK="$FS_REPO/packages/intentionsutil/scripts/park-node"
  FS_PARKLOG="$FS_DIR/park-node.log"
  FS_ENTRIES=()
  mkdir -p "$FS_REPO/intentions" "$FS_REPO/packages/intentionsutil/scripts" \
           "$FS_PROJ/proj-a" "$FS_DIR/decisions"
  : > "$FS_PARKLOG"

  git -C "$FS_REPO" init -q
  # Provenance check 1 requires HEAD on `main`. Set it explicitly rather than
  # relying on init.defaultBranch, which is unset in CI.
  git -C "$FS_REPO" symbolic-ref HEAD refs/heads/main
  git -C "$FS_REPO" config user.email "test@example.com"
  git -C "$FS_REPO" config user.name "Test"

  # The sweep must never see a tick snapshot: CLAUDE_AGENTS_CMD is the fake we
  # want exercised (_claude_agents_raw prefers the snapshot when it is set).
  unset DISPATCH_AGENTS_SNAPSHOT || true

  # The stand-down interlock reads the stand-down ledger through
  # `standdown_exists`. Point it at a scratch dir so the tests never see (or
  # write) the real project-root ledger.
  DISPATCH_STANDDOWN_DIR="$FS_DIR/standdown"
  mkdir -p "$DISPATCH_STANDDOWN_DIR"

  DISPATCH_FROZEN_SESSION_NOW_EPOCH="$FS_NOW"
  DISPATCH_FROZEN_SESSION_REPO_ROOT="$FS_REPO"
  DISPATCH_FROZEN_SESSION_PROJECTS_ROOT="$FS_PROJ"
  DISPATCH_FROZEN_SESSION_PARK_NODE="$FS_PARK"
  unset DISPATCH_FROZEN_SESSION_GRACE_S || true
  unset DISPATCH_FROZEN_SESSION_PARK_MAX || true
  unset DISPATCH_FROZEN_SESSION_PARK_TIMEOUT_S || true
  unset DISPATCH_FROZEN_SESSION_LOCK_WAIT_S || true

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
        DISPATCH_FROZEN_SESSION_PARK_TIMEOUT_S DISPATCH_FROZEN_SESSION_LOCK_WAIT_S \
        DISPATCH_DECISION_LOG_DIR DISPATCH_STANDDOWN_DIR || true
}

# fs_write_park_node <exit-code> [sleep-seconds] — install the fake park-node: it
# appends its argc, each positional argument, and the inherited
# GRAPH_COMMIT_LOCK_WAIT_SECONDS to the log, optionally sleeps (to exercise the
# `timeout` bound), then exits <exit-code>.
fs_write_park_node() {
  local sleep_s="${2:-0}"
  cat > "$FS_PARK" <<PARK
#!/usr/bin/env bash
{
  printf 'ARGC=%s\n' "\$#"
  for a in "\$@"; do printf 'ARG=%s\n' "\$a"; done
  printf 'LOCK=%s\n' "\${GRAPH_COMMIT_LOCK_WAIT_SECONDS:-unset}"
} >> "$FS_PARKLOG"
sleep $sleep_s
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
assert_eq "park: the call carries the short landing-lock wait" "LOCK=60" "$(grep '^LOCK=' "$FS_PARKLOG")"
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

# --- Test 11: the default park cap is 1 (the sweep is on the tick path) ------

echo "Test: with no override the sweep parks at most one node per invocation"
fs_setup
fs_write_node "tactic-default-cap-one" unparked
fs_write_node "tactic-default-cap-two" unparked
fs_commit_nodes
fs_write_transcript "0bac-1010" $(( FS_NOW - 4000 ))
fs_write_transcript "0cbd-1011" $(( FS_NOW - 4000 ))
fs_add_session "0bac-1010" "tactic-default-cap-one" "blocked"
fs_add_session "0cbd-1011" "tactic-default-cap-two" "blocked"
fs_install_claude 0
fs_run
assert_eq "default-cap: sweep returns 0" "0" "$FS_RC"
assert_eq "default-cap: exactly one park-node invocation" "1" "$(fs_park_calls)"
assert_eq "default-cap: summary defers the second" "yes" \
  "$(fs_contains 'sweep complete (blocked=2 parked=1 observing=0 unmeasurable=0 deferred=1)')"
fs_teardown

# --- Test 12: a park-node call that hangs is killed, not waited on -----------

echo "Test: a hanging park-node is killed by the timeout and reported as a park failure"
fs_setup
DISPATCH_FROZEN_SESSION_PARK_TIMEOUT_S=1
fs_write_park_node 0 5
fs_write_node "tactic-hang" unparked
fs_commit_nodes
fs_write_transcript "0dce-1212" $(( FS_NOW - 4000 ))
fs_add_session "0dce-1212" "tactic-hang" "blocked"
fs_install_claude 0
fs_run
assert_eq "timeout: sweep returns 0" "0" "$FS_RC"
assert_eq "timeout: stderr reports the timeout" "yes" \
  "$(fs_contains 'park failed for tactic-hang (park-node timed out after 1s); will retry next tick')"
assert_eq "timeout: the decision record names the timeout" "park-timeout" "$(fs_log_dispositions)"
assert_eq "timeout: summary counts zero parks" "yes" \
  "$(fs_contains 'sweep complete (blocked=1 parked=0 observing=0 unmeasurable=0 deferred=0)')"
fs_teardown

# --- Test 13: a repo root drifted off `main` aborts the sweep ----------------

echo "Test: a repo root that is not a primary checkout on main parks nothing"
fs_setup
fs_write_node "tactic-drifted" unparked
fs_commit_nodes
git -C "$FS_REPO" checkout -q -b some-feature-branch
fs_write_transcript "0eaf-1313" $(( FS_NOW - 4000 ))
fs_add_session "0eaf-1313" "tactic-drifted" "blocked"
fs_install_claude 0
fs_run
assert_eq "drift: sweep returns 0" "0" "$FS_RC"
assert_eq "drift: park-node not invoked" "0" "$(fs_park_calls)"
assert_eq "drift: stderr reports the refusal" "yes" \
  "$(fs_contains 'is not a primary checkout on main; refusing to run its park-node; parking nothing')"
fs_teardown

# --- Test 14: a park-node override outside the scripts dir is rejected -------

echo "Test: a park-node path outside <repo-root>/packages/intentionsutil/scripts is rejected"
fs_setup
fs_write_node "tactic-rogue" unparked
fs_commit_nodes
ROGUE="$FS_DIR/rogue-park-node"
cat > "$ROGUE" <<'ROGUEEOF'
#!/usr/bin/env bash
exit 0
ROGUEEOF
chmod +x "$ROGUE"
DISPATCH_FROZEN_SESSION_PARK_NODE="$ROGUE"
fs_write_transcript "0fba-1414" $(( FS_NOW - 4000 ))
fs_add_session "0fba-1414" "tactic-rogue" "blocked"
fs_install_claude 0
fs_run
assert_eq "rogue: sweep returns 0" "0" "$FS_RC"
assert_eq "rogue: the in-tree park-node was not invoked either" "0" "$(fs_park_calls)"
assert_eq "rogue: stderr reports the rejected path" "yes" "$(fs_contains 'does not resolve inside')"
fs_teardown

# --- Test 15: a non-executable park-node aborts the sweep -------------------

echo "Test: a park-node that is not an executable regular file parks nothing"
fs_setup
fs_write_node "tactic-noexec" unparked
fs_commit_nodes
chmod -x "$FS_PARK"
fs_write_transcript "0acb-1515" $(( FS_NOW - 4000 ))
fs_add_session "0acb-1515" "tactic-noexec" "blocked"
fs_install_claude 0
fs_run
assert_eq "noexec: sweep returns 0" "0" "$FS_RC"
assert_eq "noexec: stderr reports the unusable park-node" "yes" \
  "$(fs_contains 'is not an executable regular file; parking nothing')"
fs_teardown

# --- Test 16: a stand-down marker keeps the node ------------------------------
#
# A stood-down LOSER has exactly a frozen worker's shape (state=blocked, stale
# transcript) but its session name is the node id the WINNER is actively
# working. Parking it is the interruption the stand-down protocol exists to
# avoid, and the stand-down re-check sweep owns the node.

echo "Test: a node with a stand-down marker is kept, never parked"
fs_setup
fs_write_node "tactic-standdown" unparked
fs_commit_nodes
fs_write_transcript "0abc-1616" $(( FS_NOW - 4000 ))
fs_add_session "0abc-1616" "tactic-standdown" "blocked"
fs_install_claude 0
standdown_write "tactic-standdown" declared "0def-1617" "0def-1617,0abc-1616"
fs_run
assert_eq "standdown: sweep returns 0" "0" "$FS_RC"
assert_eq "standdown: park-node not invoked" "0" "$(fs_park_calls)"
assert_eq "standdown: stderr reports the interlock" "yes" \
  "$(fs_contains 'keeping tactic-standdown (stand-down marker present')"
assert_eq "standdown: summary counts it as observing" "yes" \
  "$(fs_contains 'sweep complete (blocked=1 parked=0 observing=1 unmeasurable=0 deferred=0)')"
fs_teardown

# --- Test 17: two live sessions under one node name keep the node -------------
#
# The marker-free half of the same interlock: a duplicate that no stand-down
# marker records (a failed ledger write, or a pair that appeared after the
# stand-down sweep ran earlier in this tick) is still two sessions holding one
# node, and the blocked one is not a lone frozen worker.

echo "Test: a node with two live sessions is kept even with no stand-down marker"
fs_setup
fs_write_node "tactic-dup-pair" unparked
fs_write_node "tactic-lone" unparked
fs_commit_nodes
fs_write_transcript "0bcd-1717" $(( FS_NOW - 4000 ))
fs_write_transcript "0cde-1718" $(( FS_NOW - 4000 ))
# Two sessions registered under ONE node name: the blocked loser and a live
# winner still working it.
fs_add_session "0bcd-1717" "tactic-dup-pair" "blocked"
fs_add_session "0def-1719" "tactic-dup-pair" "working"
# A genuinely lone frozen worker in the same sweep still gets parked.
fs_add_session "0cde-1718" "tactic-lone" "blocked"
fs_install_claude 0
fs_run
assert_eq "dup-pair: sweep returns 0" "0" "$FS_RC"
assert_eq "dup-pair: stderr reports the duplicate hold" "yes" \
  "$(fs_contains 'keeping tactic-dup-pair (2 live sessions registered under this node name')"
assert_eq "dup-pair: exactly one park-node invocation" "1" "$(fs_park_calls)"
assert_eq "dup-pair: the lone frozen worker is the one parked" "tactic-lone" \
  "$(grep '^ARG=' "$FS_PARKLOG" | head -n1 | sed 's/^ARG=//')"
fs_teardown

# --- Test 18: the grace boundary is inclusive (idle == grace parks) -----------

echo "Test: idle exactly equal to the grace is parked (the test is idle >= grace)"
fs_setup
fs_write_node "tactic-boundary" unparked
fs_commit_nodes
fs_write_transcript "0eab-1818" $(( FS_NOW - 900 ))
fs_add_session "0eab-1818" "tactic-boundary" "blocked"
fs_install_claude 0
fs_run
assert_eq "boundary: sweep returns 0" "0" "$FS_RC"
assert_eq "boundary: park-node invoked once" "1" "$(fs_park_calls)"
assert_eq "boundary: stderr reports the park" "yes" \
  "$(fs_contains 'parked tactic-boundary (denied-command-frozen after 900s')"
fs_teardown

# --- Test 19: a park-node that reads stdin cannot eat the candidate list ------
#
# park-node shells out to graph-commit, a long chain of git/node subprocesses.
# If the candidate loop left the remaining candidates on the loop body's stdin,
# one of them draining stdin would silently drop the rest of the sweep.

echo "Test: a park-node that drains stdin does not drop the remaining candidates"
fs_setup
DISPATCH_FROZEN_SESSION_PARK_MAX=2
cat > "$FS_PARK" <<PARK
#!/usr/bin/env bash
cat >/dev/null
{
  printf 'ARGC=%s\n' "\$#"
  for a in "\$@"; do printf 'ARG=%s\n' "\$a"; done
} >> "$FS_PARKLOG"
exit 0
PARK
chmod +x "$FS_PARK"
fs_write_node "tactic-stdin-one" unparked
fs_write_node "tactic-stdin-two" unparked
fs_commit_nodes
fs_write_transcript "0fbc-1919" $(( FS_NOW - 4000 ))
fs_write_transcript "0acd-1920" $(( FS_NOW - 4000 ))
fs_add_session "0fbc-1919" "tactic-stdin-one" "blocked"
fs_add_session "0acd-1920" "tactic-stdin-two" "blocked"
fs_install_claude 0
fs_run
assert_eq "stdin-drain: sweep returns 0" "0" "$FS_RC"
assert_eq "stdin-drain: both candidates parked" "2" "$(fs_park_calls)"
assert_eq "stdin-drain: summary counts both" "yes" \
  "$(fs_contains 'sweep complete (blocked=2 parked=2 observing=0 unmeasurable=0 deferred=0)')"
fs_teardown

report_results
