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

echo ""
echo "=== terminal_without_disposition_sweep ==="

# The terminal-disposition sweep's own fixture. Same shape as fs_* above (fake
# `claude` via CLAUDE_AGENTS_CMD, scratch git repo whose refs/remotes/origin/main
# is set by hand, transcripts whose mtimes `touch -d` sets, an argv-logging fake
# `park-node`, a fixed clock) plus one thing the frozen sweep has no use for: a
# scratch JOBS root holding the session's own office-hours-* escalation files.
# It is a SEPARATE pair rather than a mutation of fs_setup, so neither sweep's
# tests can perturb the other's environment.
TD_NOW=1700000000

TD_DIR=""
TD_FAKE=""
TD_REPO=""
TD_PROJ=""
TD_JOBS=""
TD_PARK=""
TD_PARKLOG=""
TD_ENTRIES=()
TD_RC=0
TD_ERR=""

td_setup() {
  TD_DIR=$(mktemp -d)
  TD_FAKE="$TD_DIR/fake-claude"
  TD_REPO="$TD_DIR/repo"
  TD_PROJ="$TD_DIR/projects"
  TD_JOBS="$TD_DIR/jobs"
  TD_PARK="$TD_REPO/packages/intentionsutil/scripts/park-node"
  TD_PARKLOG="$TD_DIR/park-node.log"
  TD_ENTRIES=()
  mkdir -p "$TD_REPO/intentions" "$TD_REPO/packages/intentionsutil/scripts" \
           "$TD_PROJ/proj-a" "$TD_JOBS" "$TD_DIR/decisions"
  : > "$TD_PARKLOG"

  git -C "$TD_REPO" init -q
  git -C "$TD_REPO" symbolic-ref HEAD refs/heads/main
  git -C "$TD_REPO" config user.email "test@example.com"
  git -C "$TD_REPO" config user.name "Test"

  # claude_agents_list_terminal_workers queries `--all` DIRECTLY, so no snapshot
  # is consulted — unset both anyway so a leaked value cannot matter.
  unset DISPATCH_AGENTS_SNAPSHOT DISPATCH_AGENTS_SNAPSHOT_ALL || true

  DISPATCH_TERMINAL_DISPOSITION_NOW_EPOCH="$TD_NOW"
  DISPATCH_TERMINAL_DISPOSITION_REPO_ROOT="$TD_REPO"
  DISPATCH_TERMINAL_DISPOSITION_PROJECTS_ROOT="$TD_PROJ"
  DISPATCH_TERMINAL_DISPOSITION_JOBS_ROOT="$TD_JOBS"
  DISPATCH_TERMINAL_DISPOSITION_PARK_NODE="$TD_PARK"
  unset DISPATCH_TERMINAL_DISPOSITION_GRACE_S DISPATCH_TERMINAL_DISPOSITION_PARK_MAX \
        DISPATCH_TERMINAL_DISPOSITION_PARK_TIMEOUT_S DISPATCH_TERMINAL_DISPOSITION_LOCK_WAIT_S || true

  # The stand-down interlock reads this ledger. Point it at the scratch dir so a
  # marker on the developer's real project root can never reach these tests (and
  # so a marker written by a test cannot leak out of it).
  DISPATCH_STANDDOWN_DIR="$TD_DIR/standdown"
  mkdir -p "$DISPATCH_STANDDOWN_DIR"

  # Same note as fs_setup: lib-decision-log.sh resolves DECISION_LOG_FILE once at
  # source time, so re-point the resolved variable too.
  DISPATCH_DECISION_LOG_DIR="$TD_DIR/decisions"
  DECISION_LOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"

  td_write_park_node 0
}

td_teardown() {
  rm -rf "$TD_DIR"
  TD_DIR=""
  unset CLAUDE_AGENTS_CMD || true
  unset DISPATCH_TERMINAL_DISPOSITION_NOW_EPOCH DISPATCH_TERMINAL_DISPOSITION_REPO_ROOT \
        DISPATCH_TERMINAL_DISPOSITION_PROJECTS_ROOT DISPATCH_TERMINAL_DISPOSITION_JOBS_ROOT \
        DISPATCH_TERMINAL_DISPOSITION_PARK_NODE DISPATCH_TERMINAL_DISPOSITION_GRACE_S \
        DISPATCH_TERMINAL_DISPOSITION_PARK_MAX DISPATCH_TERMINAL_DISPOSITION_PARK_TIMEOUT_S \
        DISPATCH_TERMINAL_DISPOSITION_LOCK_WAIT_S DISPATCH_DECISION_LOG_DIR \
        DISPATCH_STANDDOWN_DIR || true
}

# td_write_park_node <exit-code> [sleep-seconds] — install the fake park-node: it
# logs its argc, each positional argument and the inherited
# GRAPH_COMMIT_LOCK_WAIT_SECONDS, optionally sleeps (to exercise the `timeout`
# bound), then exits <exit-code>.
td_write_park_node() {
  local sleep_s="${2:-0}"
  cat > "$TD_PARK" <<PARK
#!/usr/bin/env bash
{
  printf 'ARGC=%s\n' "\$#"
  for a in "\$@"; do printf 'ARG=%s\n' "\$a"; done
  printf 'LOCK=%s\n' "\${GRAPH_COMMIT_LOCK_WAIT_SECONDS:-unset}"
} >> "$TD_PARKLOG"
sleep $sleep_s
exit $1
PARK
  chmod +x "$TD_PARK"
}

# td_add_session <sid> <name> <state> [job-id] — append one registry entry. A
# terminal row carries `state` only (no `status`), the shape the real daemon
# emits. `id` is the MANAGED-JOB id: a separate field from the sessionId (they
# diverge on a resumed session), and the only correct key for the job dir. It
# defaults to the sessionId's first field only because that is what an
# un-resumed session happens to look like.
td_add_session() {
  local jid="${4:-${1%%-*}}"
  TD_ENTRIES+=("{\"sessionId\":\"$1\",\"id\":\"$jid\",\"name\":\"$2\",\"state\":\"$3\",\"cwd\":\"/tmp/$2\"}")
}

# td_install_claude [exit-code]
td_install_claude() {
  local exit_code="${1:-0}" payload
  payload=$( IFS=,; printf '[%s]' "${TD_ENTRIES[*]}" )
  printf '%s' "$payload" > "$TD_DIR/payload.json"
  cat > "$TD_FAKE" <<FAKE
#!/usr/bin/env bash
cat "$TD_DIR/payload.json"
exit $exit_code
FAKE
  chmod +x "$TD_FAKE"
  CLAUDE_AGENTS_CMD="$TD_FAKE"
}

# td_write_node <id> <working|done|parked|bodymention>
td_write_node() {
  local id="$1" kind="$2"
  local f="$TD_REPO/intentions/$id.md"
  case "$kind" in
    done)
      cat > "$f" <<NODE
---
id: $id
kind: tactic
phase: done
office_hours: null
---

Body text.
NODE
      ;;
    parked)
      cat > "$f" <<NODE
---
id: $id
kind: tactic
phase: qa
office_hours:
  reason: parked earlier by something else
  recommendation: null
---

Body text.
NODE
      ;;
    bodymention)
      cat > "$f" <<NODE
---
id: $id
kind: tactic
phase: qa
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
phase: qa
office_hours: null
---

Body text.
NODE
      ;;
  esac
}

td_commit_nodes() {
  git -C "$TD_REPO" add -A
  git -C "$TD_REPO" commit -q -m "nodes"
  git -C "$TD_REPO" update-ref refs/remotes/origin/main HEAD
}

# td_write_transcript <sid> <mtime-epoch>
td_write_transcript() {
  printf '{}\n' > "$TD_PROJ/proj-a/$1.jsonl"
  touch -d "@$2" "$TD_PROJ/proj-a/$1.jsonl"
}

# td_write_job_file <job-id> <owning-node> <basename> <content> — write one
# escalation marker into the job dir named by the registry's `.id`, alongside the
# `state.json` whose `.name` records which node owns that job. The sweep reads
# `.name` before trusting (or deleting) anything in the dir.
td_write_job_file() {
  local dir="$TD_JOBS/$1"
  mkdir -p "$dir"
  printf '{"name":"%s"}' "$2" > "$dir/state.json"
  printf '%s' "$4" > "$dir/$3"
}

td_run() {
  if terminal_without_disposition_sweep 2>"$TD_DIR/err"; then TD_RC=0; else TD_RC=$?; fi
  TD_ERR=$(cat "$TD_DIR/err")
}

td_contains() {
  case "$TD_ERR" in *"$1"*) printf 'yes' ;; *) printf 'no' ;; esac
}

td_park_calls() {
  local c
  c=$(grep -c '^ARGC=' "$TD_PARKLOG" 2>/dev/null) || c=0
  [[ -n "$c" ]] || c=0
  printf '%s' "$c"
}

td_park_arg() {
  # td_park_arg <n> — the nth positional argument of the FIRST park-node call.
  grep '^ARG=' "$TD_PARKLOG" | sed -n "${1}p" | sed 's/^ARG=//'
}

td_log_dispositions() {
  [[ -f "$DECISION_LOG_FILE" ]] || return 0
  jq -r 'select(.site == "terminal-disposition-sweep") | .disposition' "$DECISION_LOG_FILE"
}

# --- Test 20: an aged terminal worker at a working phase is parked -----------

echo "Test: an aged terminal worker whose node is at a working phase is parked"
td_setup
td_write_node "tactic-terminal-one" working
td_commit_nodes
td_write_transcript "0aa1-1111" $(( TD_NOW - 2000 ))
td_add_session "0aa1-1111" "tactic-terminal-one" "done"
td_install_claude 0
td_run
assert_eq "terminal: sweep returns 0" "0" "$TD_RC"
assert_eq "terminal: park-node invoked exactly once" "1" "$(td_park_calls)"
assert_eq "terminal: node id is \$1" "tactic-terminal-one" "$(td_park_arg 1)"
assert_eq "terminal: stderr reports the park" "yes" \
  "$(td_contains 'parked tactic-terminal-one (terminal-without-disposition after 2000s')"
assert_eq "terminal: one decision record, disposition=parked" "parked" "$(td_log_dispositions)"
assert_eq "terminal: summary counts one park" "yes" \
  "$(td_contains 'terminal-disposition sweep complete (terminal=1 parked=1 observing=0 unmeasurable=0 deferred=0)')"
td_teardown

# --- Test 21: a node at phase: done is finished and never parked -------------

echo "Test: a terminal worker whose node is at phase: done is not parked"
td_setup
td_write_node "tactic-finished" done
td_commit_nodes
td_write_transcript "0bb2-2222" $(( TD_NOW - 2000 ))
td_add_session "0bb2-2222" "tactic-finished" "done"
td_install_claude 0
td_run
assert_eq "phase-done: sweep returns 0" "0" "$TD_RC"
assert_eq "phase-done: park-node not invoked" "0" "$(td_park_calls)"
assert_eq "phase-done: stderr reports the skip" "yes" \
  "$(td_contains 'skipping tactic-finished (phase: done')"
td_teardown

# --- Test 22: an already-parked node is skipped; frontmatter scoping holds ---

echo "Test: an already-parked node is skipped, and a body-only office_hours line is not park state"
td_setup
td_write_node "tactic-td-already" parked
td_write_node "tactic-td-body-mention" bodymention
td_commit_nodes
td_write_transcript "0cc3-3333" $(( TD_NOW - 3000 ))
td_write_transcript "0dd4-4444" $(( TD_NOW - 3000 ))
td_add_session "0cc3-3333" "tactic-td-already" "done"
td_add_session "0dd4-4444" "tactic-td-body-mention" "stopped"
td_install_claude 0
td_run
assert_eq "already-parked: sweep returns 0" "0" "$TD_RC"
assert_eq "already-parked: stderr reports the skip" "yes" \
  "$(td_contains 'skipping tactic-td-already (already parked to office_hours)')"
assert_eq "already-parked: exactly one park-node invocation" "1" "$(td_park_calls)"
assert_eq "already-parked: the body-mention node is the one parked" "tactic-td-body-mention" "$(td_park_arg 1)"
td_teardown

# --- Test 23: idle below the grace is observed, not parked -------------------

echo "Test: a terminal worker idle below the grace is observed (the teardown window)"
td_setup
td_write_node "tactic-td-fresh" working
td_commit_nodes
td_write_transcript "0ee5-5555" $(( TD_NOW - 60 ))
td_add_session "0ee5-5555" "tactic-td-fresh" "done"
td_install_claude 0
td_run
assert_eq "grace: sweep returns 0" "0" "$TD_RC"
assert_eq "grace: park-node not invoked" "0" "$(td_park_calls)"
assert_eq "grace: stderr reports observing" "yes" \
  "$(td_contains 'observing tactic-td-fresh (state=terminal, idle_seconds=60 < grace_seconds=300')"
td_teardown

# --- Test 24: a missing transcript is UNKNOWN, never a park ------------------

echo "Test: a terminal worker with no transcript is kept (idle unmeasurable)"
td_setup
td_write_node "tactic-td-no-transcript" working
td_commit_nodes
td_add_session "0ff6-6666" "tactic-td-no-transcript" "done"
td_install_claude 0
td_run
assert_eq "unmeasurable: sweep returns 0" "0" "$TD_RC"
assert_eq "unmeasurable: park-node not invoked" "0" "$(td_park_calls)"
assert_eq "unmeasurable: stderr reports the unreadable transcript" "yes" "$(td_contains 'transcript unreadable')"
assert_eq "unmeasurable: summary counts it" "yes" \
  "$(td_contains 'terminal-disposition sweep complete (terminal=1 parked=0 observing=0 unmeasurable=1 deferred=0)')"
td_teardown

# --- Test 25: an unqueryable daemon parks nothing ----------------------------

echo "Test: an unqueryable daemon parks nothing and still returns 0"
td_setup
td_write_node "tactic-td-unknown" working
td_commit_nodes
td_write_transcript "0ab7-7777" $(( TD_NOW - 5000 ))
td_add_session "0ab7-7777" "tactic-td-unknown" "done"
td_install_claude 1
td_run
assert_eq "daemon-fail: sweep returns 0" "0" "$TD_RC"
assert_eq "daemon-fail: park-node not invoked" "0" "$(td_park_calls)"
assert_eq "daemon-fail: stderr reports the unqueryable daemon" "yes" "$(td_contains 'daemon unqueryable; parking nothing')"
td_teardown

# --- Test 26: legacy <N>-slug workers and invalid node ids are skipped -------

echo "Test: a <N>-slug worker has no graph node and an invalid node id is never used as a path"
td_setup
td_write_node "tactic-td-unused" working
td_commit_nodes
td_write_transcript "0bc8-8888" $(( TD_NOW - 4000 ))
td_write_transcript "0cd9-9999" $(( TD_NOW - 4000 ))
td_add_session "0bc8-8888" "123-some-slug" "done"
# `Bad_Id!` on its own never reaches this sweep (the keyspace filter in
# claude_agents_list_terminal_workers drops it), so the node-id regex is
# exercised with a name that IS in the keyspace but is not a valid id.
td_add_session "0cd9-9999" "tactic-Bad_Id" "done"
td_install_claude 0
td_run
assert_eq "skips: sweep returns 0" "0" "$TD_RC"
assert_eq "skips: park-node not invoked" "0" "$(td_park_calls)"
assert_eq "skips: the <N>- worker is reported as having no graph node" "yes" \
  "$(td_contains 'terminal worker 123-some-slug has no graph node (session=0bc8-8888); not parking')"
assert_eq "skips: the invalid node id is reported" "yes" \
  "$(td_contains 'terminal worker tactic-Bad_Id is not a valid node id; not parking')"
assert_eq "skips: no idle line was reached for either" "no" "$(td_contains 'idle_seconds')"
td_teardown

# --- Test 27: a name with no node file on origin/main is not parked ----------

echo "Test: a terminal worker with no intentions/<name>.md on origin/main is not parked"
td_setup
td_write_node "tactic-td-present" working
td_commit_nodes
td_write_transcript "0dea-aaaa" $(( TD_NOW - 4000 ))
td_add_session "0dea-aaaa" "tactic-td-absent" "done"
td_install_claude 0
td_run
assert_eq "no-node: sweep returns 0" "0" "$TD_RC"
assert_eq "no-node: park-node not invoked" "0" "$(td_park_calls)"
assert_eq "no-node: stderr reports the missing node file" "yes" \
  "$(td_contains 'keeping tactic-td-absent (no intentions/tactic-td-absent.md on origin/main')"
td_teardown

# --- Test 28: the session's own escalation text is used verbatim -------------

echo "Test: the job dir's office-hours-reason/-recommendation are used verbatim and cleared on success"
td_setup
td_write_node "tactic-td-escalated" working
td_commit_nodes
td_write_transcript "0efb-bbbb" $(( TD_NOW - 4000 ))
td_add_session "0efb-bbbb" "tactic-td-escalated" "done" "efb0aaaa"
td_write_job_file "efb0aaaa" "tactic-td-escalated" office-hours-reason "the worker's own reason"
td_write_job_file "efb0aaaa" "tactic-td-escalated" office-hours-recommendation "the worker's own recommendation"
td_install_claude 0
td_run
assert_eq "escalation: sweep returns 0" "0" "$TD_RC"
assert_eq "escalation: park-node invoked once" "1" "$(td_park_calls)"
assert_eq "escalation: three positional args" "ARGC=3" "$(grep '^ARGC=' "$TD_PARKLOG")"
assert_eq "escalation: reason is the worker's own text" "the worker's own reason" "$(td_park_arg 2)"
assert_eq "escalation: recommendation is the worker's own text" "the worker's own recommendation" "$(td_park_arg 3)"
assert_eq "escalation: the reason marker was removed" "gone" \
  "$([[ -e "$TD_JOBS/efb0aaaa/office-hours-reason" ]] && printf 'present' || printf 'gone')"
assert_eq "escalation: the recommendation marker was removed" "gone" \
  "$([[ -e "$TD_JOBS/efb0aaaa/office-hours-recommendation" ]] && printf 'present' || printf 'gone')"
td_teardown

# --- Test 28b: the job dir is keyed on the registry `.id`, not the sessionId --
#
# A RESUMED session keeps its original job id while its sessionId changes. Keying
# the job dir on `${sessionId%%-*}` would miss the worker's own escalation text
# entirely (and, worse, could hit an unrelated job dir — Test 28c).

echo "Test: a resumed session's job dir is found by its registry id, not its sessionId prefix"
td_setup
td_write_node "tactic-td-resumed" working
td_commit_nodes
td_write_transcript "699ca965-1111" $(( TD_NOW - 4000 ))
td_add_session "699ca965-1111" "tactic-td-resumed" "done" "c20b2f8d"
td_write_job_file "c20b2f8d" "tactic-td-resumed" office-hours-reason "the resumed worker's own reason"
td_install_claude 0
td_run
assert_eq "resumed: sweep returns 0" "0" "$TD_RC"
assert_eq "resumed: park-node invoked once" "1" "$(td_park_calls)"
assert_eq "resumed: the worker's own reason was recovered" "the resumed worker's own reason" "$(td_park_arg 2)"
td_teardown

# --- Test 28c: a job dir owned by another node is neither read nor deleted ----
#
# The job dir's `state.json` `.name` is the ownership record. When it names a
# DIFFERENT node, the sweep must fall back to the synthesized reason and must
# leave that other session's pending escalation markers in place — deleting them
# would destroy its park evidence.

echo "Test: a job dir belonging to another node is not read and its markers survive"
td_setup
td_write_node "tactic-td-victim" working
td_commit_nodes
td_write_transcript "0acd-2222" $(( TD_NOW - 4000 ))
td_add_session "0acd-2222" "tactic-td-victim" "done" "aabbccdd"
# The job dir under the SAME id belongs to a different node's session.
td_write_job_file "aabbccdd" "tactic-someone-else" office-hours-reason "the OTHER session's reason"
td_install_claude 0
td_run
assert_eq "foreign-job: sweep returns 0" "0" "$TD_RC"
assert_eq "foreign-job: park-node invoked once" "1" "$(td_park_calls)"
assert_eq "foreign-job: the other session's reason was NOT used" "yes" \
  "$(case "$(td_park_arg 2)" in *"ended without declaring a disposition"*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "foreign-job: stderr reports the ownership mismatch" "yes" \
  "$(td_contains 'does not belong to tactic-td-victim (state.json name=tactic-someone-else)')"
assert_eq "foreign-job: the other session's marker survives" "present" \
  "$([[ -e "$TD_JOBS/aabbccdd/office-hours-reason" ]] && printf 'present' || printf 'gone')"
td_teardown

# --- Test 28d: a malformed job id is never used as a path component ----------

echo "Test: a registry row whose id is not a job-id shape falls back to the synthesized reason"
td_setup
td_write_node "tactic-td-badjob" working
td_commit_nodes
td_write_transcript "0bde-3333" $(( TD_NOW - 4000 ))
td_add_session "0bde-3333" "tactic-td-badjob" "done" "../escape"
td_install_claude 0
td_run
assert_eq "bad-jobid: sweep returns 0" "0" "$TD_RC"
assert_eq "bad-jobid: park-node invoked once" "1" "$(td_park_calls)"
assert_eq "bad-jobid: stderr reports the unusable job id" "yes" \
  "$(td_contains 'terminal worker tactic-td-badjob has no usable job id (id=../escape)')"
assert_eq "bad-jobid: the synthesized reason is used" "yes" \
  "$(case "$(td_park_arg 2)" in *"ended without declaring a disposition"*) printf 'yes' ;; *) printf 'no' ;; esac)"
td_teardown

# --- Test 29: office-hours-pr is threaded as --pr; a non-numeric one is not --

echo "Test: a numeric office-hours-pr becomes --pr <n> and a non-numeric one is ignored"
td_setup
td_write_node "tactic-td-pr" working
td_commit_nodes
td_write_transcript "0fac-cccc" $(( TD_NOW - 4000 ))
td_add_session "0fac-cccc" "tactic-td-pr" "done" "fac0aaaa"
td_write_job_file "fac0aaaa" "tactic-td-pr" office-hours-reason "reason with a pr"
td_write_job_file "fac0aaaa" "tactic-td-pr" office-hours-recommendation "reco with a pr"
td_write_job_file "fac0aaaa" "tactic-td-pr" office-hours-pr "2994"
td_install_claude 0
td_run
assert_eq "pr: sweep returns 0" "0" "$TD_RC"
assert_eq "pr: five positional args" "ARGC=5" "$(grep '^ARGC=' "$TD_PARKLOG")"
assert_eq "pr: --pr is first" "--pr" "$(td_park_arg 1)"
assert_eq "pr: the number is second" "2994" "$(td_park_arg 2)"
assert_eq "pr: the node id is third" "tactic-td-pr" "$(td_park_arg 3)"
assert_eq "pr: the pr marker was removed on success" "gone" \
  "$([[ -e "$TD_JOBS/fac0aaaa/office-hours-pr" ]] && printf 'present' || printf 'gone')"
td_teardown

echo "Test: a non-numeric office-hours-pr adds no --pr flag"
td_setup
td_write_node "tactic-td-badpr" working
td_commit_nodes
td_write_transcript "0abd-dddd" $(( TD_NOW - 4000 ))
td_add_session "0abd-dddd" "tactic-td-badpr" "done" "abd0aaaa"
td_write_job_file "abd0aaaa" "tactic-td-badpr" office-hours-reason "reason with a bad pr"
td_write_job_file "abd0aaaa" "tactic-td-badpr" office-hours-pr "not-a-number"
td_install_claude 0
td_run
assert_eq "bad-pr: sweep returns 0" "0" "$TD_RC"
assert_eq "bad-pr: three positional args (no --pr)" "ARGC=3" "$(grep '^ARGC=' "$TD_PARKLOG")"
assert_eq "bad-pr: the node id is first" "tactic-td-badpr" "$(td_park_arg 1)"
td_teardown

# --- Test 30: with no job dir the reason is synthesized ----------------------

echo "Test: with no job dir at all the sweep synthesizes the reason and still parks"
td_setup
td_write_node "tactic-td-nojob" working
td_commit_nodes
td_write_transcript "0bca-1010" $(( TD_NOW - 4000 ))
td_add_session "0bca-1010" "tactic-td-nojob" "done"
td_install_claude 0
td_run
assert_eq "synth: sweep returns 0" "0" "$TD_RC"
assert_eq "synth: park-node invoked once" "1" "$(td_park_calls)"
assert_eq "synth: the synthesized reason names the missing disposition" "yes" \
  "$(case "$(td_park_arg 2)" in *"ended without declaring a disposition"*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "synth: the synthesized recommendation warns against a bare reap" "yes" \
  "$(case "$(td_park_arg 3)" in *"restarts the churn loop"*) printf 'yes' ;; *) printf 'no' ;; esac)"
td_teardown

# --- Test 31: a park-node failure retains the markers for the next tick ------

echo "Test: a park-node failure is non-fatal, retains the markers, and says it will retry"
td_setup
td_write_park_node 1
td_write_node "tactic-td-parkfail" working
td_commit_nodes
td_write_transcript "0cdb-1111" $(( TD_NOW - 4000 ))
td_add_session "0cdb-1111" "tactic-td-parkfail" "done" "cdb0aaaa"
td_write_job_file "cdb0aaaa" "tactic-td-parkfail" office-hours-reason "reason that must survive"
td_install_claude 0
td_run
assert_eq "park-fail: sweep returns 0" "0" "$TD_RC"
assert_eq "park-fail: stderr reports the failure" "yes" \
  "$(td_contains 'park failed for tactic-td-parkfail (park-node exit 1); will retry next tick')"
assert_eq "park-fail: the decision record says park-failed" "park-failed" "$(td_log_dispositions)"
assert_eq "park-fail: the reason marker is retained" "present" \
  "$([[ -e "$TD_JOBS/cdb0aaaa/office-hours-reason" ]] && printf 'present' || printf 'gone')"
assert_eq "park-fail: summary counts zero parks" "yes" \
  "$(td_contains 'terminal-disposition sweep complete (terminal=1 parked=0 observing=0 unmeasurable=0 deferred=0)')"
td_teardown

# --- Test 32: the per-sweep park cap defers the excess -----------------------

echo "Test: the park cap bounds parks per sweep and defers the rest"
td_setup
DISPATCH_TERMINAL_DISPOSITION_PARK_MAX=2
for n in one two three four; do
  td_write_node "tactic-td-cap-$n" working
done
td_commit_nodes
i=1
for n in one two three four; do
  td_write_transcript "0dcb-200$i" $(( TD_NOW - 4000 ))
  td_add_session "0dcb-200$i" "tactic-td-cap-$n" "done"
  i=$(( i + 1 ))
done
td_install_claude 0
td_run
assert_eq "cap: sweep returns 0" "0" "$TD_RC"
assert_eq "cap: exactly two park-node invocations" "2" "$(td_park_calls)"
assert_eq "cap: summary counts the deferrals" "yes" \
  "$(td_contains 'terminal-disposition sweep complete (terminal=4 parked=2 observing=0 unmeasurable=0 deferred=2)')"
td_teardown

# --- Test 33: at most one `git fetch` per sweep ------------------------------
#
# The fetch is lazy AND latched: two eligible candidates must still produce
# exactly one fetch. Counted with a `git` wrapper on PATH that logs a line for
# every invocation carrying the `fetch` subcommand and then delegates to the
# real binary.

echo "Test: two eligible candidates trigger exactly one git fetch"
td_setup
TD_REAL_GIT=$(command -v git)
mkdir -p "$TD_DIR/bin"
cat > "$TD_DIR/bin/git" <<GITW
#!/usr/bin/env bash
for a in "\$@"; do
  if [ "\$a" = "fetch" ]; then printf 'fetch\n' >> "$TD_DIR/fetch.log"; break; fi
done
exec "$TD_REAL_GIT" "\$@"
GITW
chmod +x "$TD_DIR/bin/git"
: > "$TD_DIR/fetch.log"
td_write_node "tactic-td-fetch-one" working
td_write_node "tactic-td-fetch-two" working
td_commit_nodes
td_write_transcript "0eac-1313" $(( TD_NOW - 4000 ))
td_write_transcript "0fbd-1314" $(( TD_NOW - 4000 ))
td_add_session "0eac-1313" "tactic-td-fetch-one" "done"
td_add_session "0fbd-1314" "tactic-td-fetch-two" "done"
td_install_claude 0
TD_OLD_PATH="$PATH"
PATH="$TD_DIR/bin:$PATH"
td_run
PATH="$TD_OLD_PATH"
assert_eq "fetch: sweep returns 0" "0" "$TD_RC"
assert_eq "fetch: both candidates parked" "2" "$(td_park_calls)"
assert_eq "fetch: exactly one fetch for the whole sweep" "1" "$(wc -l < "$TD_DIR/fetch.log" | tr -d ' ')"
td_teardown

# --- Test 34: each park is bounded — short lock wait, and a hang is killed ----
#
# The sweep runs inline on the tick's scheduling path, so an unbounded park is a
# fleet stall (the same bound frozen_session_sweep carries).

echo "Test: park-node inherits the short GRAPH_COMMIT_LOCK_WAIT_SECONDS"
td_setup
td_write_node "tactic-td-lock" working
td_commit_nodes
td_write_transcript "0eba-1414" $(( TD_NOW - 4000 ))
td_add_session "0eba-1414" "tactic-td-lock" "done"
td_install_claude 0
td_run
assert_eq "lock-wait: sweep returns 0" "0" "$TD_RC"
assert_eq "lock-wait: the default 60s lock wait reached park-node" "LOCK=60" "$(grep '^LOCK=' "$TD_PARKLOG")"
td_teardown

echo "Test: a hanging park-node is killed by the timeout and reported as a park-timeout"
td_setup
DISPATCH_TERMINAL_DISPOSITION_PARK_TIMEOUT_S=1
td_write_park_node 0 5
td_write_node "tactic-td-hang" working
td_commit_nodes
td_write_transcript "0fcb-1515" $(( TD_NOW - 4000 ))
td_add_session "0fcb-1515" "tactic-td-hang" "done" "fcb0aaaa"
td_write_job_file "fcb0aaaa" "tactic-td-hang" office-hours-reason "reason that must survive the timeout"
td_install_claude 0
td_run
assert_eq "td-timeout: sweep returns 0" "0" "$TD_RC"
assert_eq "td-timeout: stderr reports the timeout" "yes" \
  "$(td_contains 'park failed for tactic-td-hang (park-node timed out after 1s); will retry next tick')"
assert_eq "td-timeout: the decision record names the timeout" "park-timeout" "$(td_log_dispositions)"
assert_eq "td-timeout: the marker survives for the retry" "present" \
  "$([[ -e "$TD_JOBS/fcb0aaaa/office-hours-reason" ]] && printf 'present' || printf 'gone')"
assert_eq "td-timeout: summary counts zero parks" "yes" \
  "$(td_contains 'terminal-disposition sweep complete (terminal=1 parked=0 observing=0 unmeasurable=0 deferred=0)')"
td_teardown

# --- Test 35: provenance — a repo root drifted off `main` aborts the sweep ----

echo "Test: a terminal-sweep repo root that is not a primary checkout on main parks nothing"
td_setup
td_write_node "tactic-td-drifted" working
td_commit_nodes
git -C "$TD_REPO" checkout -q -b some-feature-branch
td_write_transcript "0acb-1616" $(( TD_NOW - 4000 ))
td_add_session "0acb-1616" "tactic-td-drifted" "done"
td_install_claude 0
td_run
assert_eq "td-drift: sweep returns 0" "0" "$TD_RC"
assert_eq "td-drift: park-node not invoked" "0" "$(td_park_calls)"
assert_eq "td-drift: stderr reports the refusal" "yes" \
  "$(td_contains 'is not a primary checkout on main; refusing to run its park-node; parking nothing')"
td_teardown

# --- Test 36: provenance — a park-node outside the scripts dir is rejected ----

echo "Test: a terminal-sweep park-node path outside <repo-root>/packages/intentionsutil/scripts is rejected"
td_setup
td_write_node "tactic-td-rogue" working
td_commit_nodes
TD_ROGUE="$TD_DIR/rogue-park-node"
cat > "$TD_ROGUE" <<'ROGUEEOF'
#!/usr/bin/env bash
exit 0
ROGUEEOF
chmod +x "$TD_ROGUE"
DISPATCH_TERMINAL_DISPOSITION_PARK_NODE="$TD_ROGUE"
td_write_transcript "0bdc-1717" $(( TD_NOW - 4000 ))
td_add_session "0bdc-1717" "tactic-td-rogue" "done"
td_install_claude 0
td_run
assert_eq "td-rogue: sweep returns 0" "0" "$TD_RC"
assert_eq "td-rogue: the in-tree park-node was not invoked either" "0" "$(td_park_calls)"
assert_eq "td-rogue: stderr reports the rejected path" "yes" "$(td_contains 'does not resolve inside')"
td_teardown

# --- Test 37: provenance — a non-executable park-node aborts the sweep -------

echo "Test: a terminal-sweep park-node that is not an executable regular file parks nothing"
td_setup
td_write_node "tactic-td-noexec" working
td_commit_nodes
chmod -x "$TD_PARK"
td_write_transcript "0ced-1818" $(( TD_NOW - 4000 ))
td_add_session "0ced-1818" "tactic-td-noexec" "done"
td_install_claude 0
td_run
assert_eq "td-noexec: sweep returns 0" "0" "$TD_RC"
assert_eq "td-noexec: stderr reports the unusable park-node" "yes" \
  "$(td_contains 'is not an executable regular file; parking nothing')"
td_teardown

# --- Test 38: stand-down interlock — a marked node is kept, never parked ------
#
# A stood-down LOSER is told to yield the turn WITHOUT a node-terminal marker
# (dispatch-standdown), so the Stop hook holds its job and it lands in THIS
# sweep's candidate set — while the winner works the node. Parking it is the
# interruption the stand-down protocol exists to avoid.

echo "Test: a terminal candidate whose node carries a stand-down marker is kept"
td_setup
td_write_node "tactic-td-standdown" working
td_commit_nodes
td_write_transcript "0dfe-1919" $(( TD_NOW - 4000 ))
td_add_session "0dfe-1919" "tactic-td-standdown" "done"
td_install_claude 0
standdown_write "tactic-td-standdown" declared "0eff-1920" "0eff-1920,0dfe-1919"
td_run
assert_eq "td-standdown: sweep returns 0" "0" "$TD_RC"
assert_eq "td-standdown: park-node not invoked" "0" "$(td_park_calls)"
assert_eq "td-standdown: stderr reports the interlock" "yes" \
  "$(td_contains 'keeping tactic-td-standdown (stand-down marker present')"
assert_eq "td-standdown: summary counts it as observing" "yes" \
  "$(td_contains 'terminal-disposition sweep complete (terminal=1 parked=0 observing=1 unmeasurable=0 deferred=0)')"
standdown_clear "tactic-td-standdown"
td_teardown

# --- Test 39: a live session under the same node name keeps the node ----------
#
# The marker-free half of the same interlock. The live winner is subtracted from
# nothing (it is not a candidate); the terminal loser IS a candidate and is
# subtracted from the live set, so it cannot mask itself as its own evidence — a
# genuinely lone terminal worker in the same sweep is still parked.

echo "Test: a terminal candidate with another LIVE session under its node name is kept"
td_setup
td_write_node "tactic-td-held" working
td_write_node "tactic-td-alone" working
td_commit_nodes
td_write_transcript "0aab-2020" $(( TD_NOW - 4000 ))
td_write_transcript "0bbc-2021" $(( TD_NOW - 4000 ))
td_add_session "0aab-2020" "tactic-td-held" "done"
td_add_session "0ccd-2022" "tactic-td-held" "working"
td_add_session "0bbc-2021" "tactic-td-alone" "done"
td_install_claude 0
td_run
assert_eq "td-live-dup: sweep returns 0" "0" "$TD_RC"
assert_eq "td-live-dup: stderr reports the live hold" "yes" \
  "$(td_contains 'keeping tactic-td-held (live sessions still registered under this node name')"
assert_eq "td-live-dup: exactly one park-node invocation" "1" "$(td_park_calls)"
assert_eq "td-live-dup: the lone terminal worker is the one parked" "tactic-td-alone" \
  "$(td_park_arg 1)"
td_teardown

# --- Test 40: an unqueryable ACTIVE view aborts the sweep --------------------
#
# UNKNOWN on the interlock's own query is not "nobody else holds this node": a
# definite-looking answer derived from a failed query is the false park the
# interlock exists to prevent.

echo "Test: an unqueryable live-session registry parks nothing"
td_setup
td_write_node "tactic-td-unknown" working
td_commit_nodes
td_write_transcript "0dde-2121" $(( TD_NOW - 4000 ))
td_add_session "0dde-2121" "tactic-td-unknown" "done"
# The `--all` candidate query must succeed while the ACTIVE view fails, so the
# fake keys on the flag: `--all` prints the payload, anything else exits 1.
td_install_claude 0
cat > "$TD_FAKE" <<FAKE
#!/usr/bin/env bash
for a in "\$@"; do
  if [[ "\$a" == "--all" ]]; then
    cat "$TD_DIR/payload.json"
    exit 0
  fi
done
exit 1
FAKE
chmod +x "$TD_FAKE"
td_run
assert_eq "td-unknown-active: sweep returns 0" "0" "$TD_RC"
assert_eq "td-unknown-active: park-node not invoked" "0" "$(td_park_calls)"
assert_eq "td-unknown-active: stderr reports the unqueryable registry" "yes" \
  "$(td_contains 'live-session registry unqueryable; cannot rule out a stand-down; parking nothing')"
td_teardown

# --- Test 41: a row with a NULL `.id` does not shift the name column ----------
#
# `@tsv` renders a null `.id` as an empty column, and TAB is IFS whitespace — so
# `IFS=$'\t' read -r sid jid name cwd` would collapse the empty column and slide
# `name` onto the cwd. The sweep would then reject its own candidate as "not a
# valid node id" and silently never park it. The row must instead reach the
# documented "no usable job id" fallback and be parked with the synthesized
# reason.

echo "Test: a registry row with a null id keeps its node-name column"
td_setup
td_write_node "tactic-td-nullid" working
td_commit_nodes
td_write_transcript "0eef-2222" $(( TD_NOW - 4000 ))
TD_ENTRIES+=('{"sessionId":"0eef-2222","id":null,"name":"tactic-td-nullid","state":"done","cwd":"/tmp/tactic-td-nullid"}')
td_install_claude 0
td_run
assert_eq "td-nullid: sweep returns 0" "0" "$TD_RC"
assert_eq "td-nullid: park-node invoked once" "1" "$(td_park_calls)"
assert_eq "td-nullid: the node id survived the parse" "tactic-td-nullid" "$(td_park_arg 1)"
assert_eq "td-nullid: stderr reports the unusable job id" "yes" \
  "$(td_contains 'terminal worker tactic-td-nullid has no usable job id')"
td_teardown

report_results
