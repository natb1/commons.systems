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

# fs_write_park_node <exit-code> [sleep-seconds] [landing-mode] — install the
# fake park-node: it appends its argc, each positional argument, and the
# inherited GRAPH_COMMIT_LOCK_WAIT_SECONDS to the log, optionally sleeps (to
# exercise the `timeout` bound), then — for a zero exit code — LANDS the park
# on origin/main (default `land`; `none` exits 0 with no write, modeling the
# `graph-commit` exit-0-but-nothing-landed shape frozen_session_sweep's own
# verify-landed confirmation regression-tests), then exits <exit-code>.
#
# The landing half mirrors td_write_park_node's (this same file), added
# because frozen_session_sweep now confirms every rc-0 park against
# origin/main via verify-landed instead of trusting the exit code — a fake
# that only exits 0 would model a park-node that returned success without
# landing, which is no longer enough to be COUNTED as a park.
fs_write_park_node() {
  local rc="$1" sleep_s="${2:-0}" mode="${3:-land}"
  cat > "$FS_PARK" <<PARK
#!/usr/bin/env bash
{
  printf 'ARGC=%s\n' "\$#"
  for a in "\$@"; do printf 'ARG=%s\n' "\$a"; done
  printf 'LOCK=%s\n' "\${GRAPH_COMMIT_LOCK_WAIT_SECONDS:-unset}"
} >> "$FS_PARKLOG"
sleep $sleep_s
if [ "$rc" = 0 ] && [ "$mode" != none ]; then
  # Same leading-flags-only skip as the sweep's own park-node invocation, so
  # this fake survives a changed flag set ahead of the node id.
  while [ "\$#" -gt 0 ]; do
    case "\$1" in
      --*) shift 2 ;;
      *) break ;;
    esac
  done
  node="\$1"
  f="$FS_REPO/intentions/\$node.md"
  sed -i 's/^office_hours: null\$/office_hours:\n  reason: landed by the fake park-node\n  since: 2026-01-01\n  recommendation: null/' "\$f"
  git -C "$FS_REPO" add -A
  git -C "$FS_REPO" commit -q -m 'fake park-node: land'
  git -C "$FS_REPO" update-ref refs/remotes/origin/main HEAD
fi
exit $rc
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
  # `statement`/`owner`/`status` are the IntentionSchema's required core
  # (schema.ts validateNode) — present on every fixture below so a
  # verify-landed jq-mode confirmation (readNodeAtRef, which validates
  # strictly) can actually read these nodes rather than throwing on a missing
  # required field.
  case "$kind" in
    parked)
      cat > "$f" <<NODE
---
id: $id
kind: tactic
statement: fixture node for lib-frozen-session-park tests
owner: ai
status: working
office_hours:
  reason: parked earlier by something else
  since: 2026-01-01
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
statement: fixture node for lib-frozen-session-park tests
owner: ai
status: working
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
statement: fixture node for lib-frozen-session-park tests
owner: ai
status: working
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

fs_park_arg() {
  # fs_park_arg <n> — the nth positional argument of the FIRST park-node call.
  # Sibling of td_park_arg below.
  grep '^ARG=' "$FS_PARKLOG" | sed -n "${1}p" | sed 's/^ARG=//'
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

# fs_write_route_stub <exit-code> [sleep-seconds] — install a fake
# dispatch-invalid-state-route for the lane pre-tier. The gate resolves the
# router under the sweep's own $repo_root (NOT this library's location, so a
# suite run can never reach the real router and its graph-minting side effects),
# so the stub must live in the fixture repo's own scripts dir.
FS_ROUTELOG=""
# fs_write_route_stub <exit-code> [sleep-seconds] [repo-root] [log-dir] — the
# repo root and log dir default to the frozen-session fixture's, and the
# terminal-disposition fixture passes its own.
fs_write_route_stub() {
  local rc="$1" nap="${2:-0}" repo="${3:-$FS_REPO}" logdir="${4:-$FS_DIR}"
  local dir="$repo/.claude/skills/dispatch-propagate/scripts"
  mkdir -p "$dir"
  FS_ROUTELOG="$logdir/route.log"
  : > "$FS_ROUTELOG"
  cat > "$dir/dispatch-invalid-state-route" <<ROUTESTUB
#!/usr/bin/env bash
printf '%s\n' "\$*" >> "$FS_ROUTELOG"
[[ "$nap" != "0" ]] && sleep "$nap"
exit $rc
ROUTESTUB
  chmod +x "$dir/dispatch-invalid-state-route"
}

fs_route_calls() {
  local c=0
  [[ -n "$FS_ROUTELOG" && -f "$FS_ROUTELOG" ]] && { c=$(wc -l < "$FS_ROUTELOG"); }
  printf '%s' "${c// /}"
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
assert_eq "park: park-node received 5 positional args" "ARGC=5" "$(grep '^ARGC=' "$FS_PARKLOG")"
assert_eq "park: node id is \$3 (after --base <id>=<sha>)" "tactic-frozen-one" "$(fs_park_arg 3)"
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
  "$(fs_park_arg 3)"
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
  "$(fs_park_arg 3)"
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
# LANDS the park, exactly like fs_write_park_node's default 'land' mode, so
# the sweep's verify-landed confirmation counts it — this test is about the
# stdin-drain hazard, not about the confirmation step, so it must not
# incidentally exercise the not-landed branch.
while [ "\$#" -gt 0 ]; do
  case "\$1" in
    --*) shift 2 ;;
    *) break ;;
  esac
done
node="\$1"
f="$FS_REPO/intentions/\$node.md"
sed -i 's/^office_hours: null\$/office_hours:\n  reason: landed by the fake park-node\n  since: 2026-01-01\n  recommendation: null/' "\$f"
git -C "$FS_REPO" add -A
git -C "$FS_REPO" commit -q -m 'fake park-node: land'
git -C "$FS_REPO" update-ref refs/remotes/origin/main HEAD
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

# --- Test: --base pins the exact pre-park origin/main blob -------------------
#
# Regression test for the diagnosis-time CAS (ref-diagnosis-time-cas): the pin
# threaded through park-node's --base must be the SAME blob the guard read at
# step (7b), not merely present. If a stale or wrong sha were pinned, a
# concurrent writer's park could still be silently clobbered even though a
# `--base` flag is on the command line.

echo "Test: --base pins the exact origin/main blob read at diagnosis time"
fs_setup
fs_write_node "tactic-base-pin" unparked
fs_commit_nodes
EXPECTED=$(git -C "$FS_REPO" rev-parse "origin/main:intentions/tactic-base-pin.md")
fs_write_transcript "0aaa-2020" $(( FS_NOW - 4000 ))
fs_add_session "0aaa-2020" "tactic-base-pin" "blocked"
fs_install_claude 0
fs_run
assert_eq "base-pin: sweep returns 0" "0" "$FS_RC"
assert_eq "base-pin: first arg is --base" "--base" "$(fs_park_arg 1)"
assert_eq "base-pin: second arg pins the exact blob" "tactic-base-pin=$EXPECTED" "$(fs_park_arg 2)"
fs_teardown

# --- Test: park-node exit 3 is its own outcome, not a park failure -----------
#
# `rc==3` is the stale-diagnosis compare-and-swap refusal — a park that landed
# on origin/main between this sweep's guard read and its write. It must get its
# own disposition, distinct from an ordinary park failure, and must never
# increment parked_count.

echo "Test: park-node exit 3 is logged as stale-diagnosis, not a park failure (frozen sweep)"
fs_setup
fs_write_park_node 3
fs_write_node "tactic-stale-frozen" unparked
fs_commit_nodes
fs_write_transcript "0bbb-2121" $(( FS_NOW - 4000 ))
fs_add_session "0bbb-2121" "tactic-stale-frozen" "blocked"
fs_install_claude 0
fs_run
assert_eq "stale-frozen: sweep returns 0" "0" "$FS_RC"
assert_eq "stale-frozen: stderr reports stale-diagnosis" "yes" \
  "$(fs_contains 'stale-diagnosis skip for tactic-stale-frozen')"
assert_eq "stale-frozen: stderr does NOT report a park failure" "no" \
  "$(fs_contains 'park failed for tactic-stale-frozen')"
assert_eq "stale-frozen: the decision record says stale-diagnosis" "stale-diagnosis" "$(fs_log_dispositions)"
assert_eq "stale-frozen: summary counts zero parks" "yes" \
  "$(fs_contains 'sweep complete (blocked=1 parked=0 observing=0 unmeasurable=0 deferred=0)')"
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

# td_write_park_node <exit-code> [sleep-seconds] [landing-mode] — install the fake
# park-node: it logs its argc, each positional argument and the inherited
# GRAPH_COMMIT_LOCK_WAIT_SECONDS, optionally sleeps (to exercise the `timeout`
# bound), then LANDS the park on origin/main and exits <exit-code>.
#
# The landing half exists because the sweep's step (13) confirms every rc-0 park
# by re-reading the node from origin/main: marker deletion is the PROOF the park
# landed, not a cleanup step that trusts an exit code. A fake that only exits 0
# would therefore model a park-node that returned success without landing — the
# real defect — so the DEFAULT fake lands, and each not-landed shape is an
# explicit opt-in:
#   land    (default) rewrite the node's frontmatter `office_hours: null` into a
#           park block and republish origin/main — a park that really landed.
#   none    exit 0 and change nothing — `graph-commit` exit 0 with no write on
#           origin/main, the shape this suite regression-tests.
#   delete  remove the node file and republish — the node unreadable at
#           origin/main after an rc-0 park.
#   body    append a column-0 `office_hours:` block to the markdown BODY while
#           the frontmatter stays `null` — the frontmatter-scoping trap.
#   race    faithfully emulates a concurrent writer plus real park-node's own
#           compare-and-swap (park-node:218-221): FIRST land a SPECIFIC park
#           (distinctive sentinel reason/recommendation strings) onto
#           origin/main — the concurrent writer landing inside this sweep's
#           guard-to-write window — then compare the received `--base` pin
#           against the NOW-current origin/main blob. On mismatch, log
#           `RACED=1` and exit 3 WITHOUT writing anything else; on (the
#           unexercised) match, write generic text and exit 0. <exit-code> and
#           <landing-mode> interact differently here than for the other modes:
#           `race` decides its OWN exit code from the compare-and-swap, not
#           from <exit-code>.
# Landing is skipped entirely for a non-zero <exit-code> (all modes but
# `race`): a park-node that fails does not land, and a hang killed by `timeout`
# never reaches this code at all (the sleep comes first).
td_write_park_node() {
  local rc="$1" sleep_s="${2:-0}" mode="${3:-land}"

  if [[ "$mode" == "race" ]]; then
    cat > "$TD_PARK" <<PARK
#!/usr/bin/env bash
{
  printf 'ARGC=%s\n' "\$#"
  for a in "\$@"; do printf 'ARG=%s\n' "\$a"; done
  printf 'LOCK=%s\n' "\${GRAPH_COMMIT_LOCK_WAIT_SECONDS:-unset}"
} >> "$TD_PARKLOG"

# Leading-flags-only parse, mirroring park-node and the sweep itself: walk
# flags until the first positional (the node id), capturing --base's value
# along the way. Works regardless of whether --pr precedes --base.
base_pair=""
node=""
while [ "\$#" -gt 0 ]; do
  case "\$1" in
    --base) base_pair="\$2"; shift 2 ;;
    --*) shift 2 ;;
    *) node="\$1"; break ;;
  esac
done
pinned="\${base_pair#*=}"
f="$TD_REPO/intentions/\${node}.md"

# 1. Land a concurrent writer's SPECIFIC park FIRST — the guard-to-write
# window this fix closes. Distinctive sentinels let the test assert the exact
# text survived, not just that some office_hours block exists.
sed -i 's/^office_hours: null\$/office_hours:\n  reason: RACE_SENTINEL_REASON_7f3a\n  since: 2026-01-01\n  recommendation: RACE_SENTINEL_RECOMMENDATION_9c2e/' "\$f"
git -C "$TD_REPO" add -A
git -C "$TD_REPO" commit -q -m 'fake park-node: race concurrent writer'
git -C "$TD_REPO" update-ref refs/remotes/origin/main HEAD

# 2. park-node's own compare-and-swap against the NOW-current blob.
current=\$(git -C "$TD_REPO" rev-parse "origin/main:intentions/\${node}.md" 2>/dev/null)
if [ "\$current" != "\$pinned" ]; then
  printf 'RACED=1\n' >> "$TD_PARKLOG"
  exit 3
fi
printf '\nGeneric park text (unreachable in the race regression test).\n' >> "\$f"
git -C "$TD_REPO" add -A
git -C "$TD_REPO" commit -q -m 'fake park-node: race match'
git -C "$TD_REPO" update-ref refs/remotes/origin/main HEAD
exit 0
PARK
    chmod +x "$TD_PARK"
    return 0
  fi

  cat > "$TD_PARK" <<PARK
#!/usr/bin/env bash
{
  printf 'ARGC=%s\n' "\$#"
  for a in "\$@"; do printf 'ARG=%s\n' "\$a"; done
  printf 'LOCK=%s\n' "\${GRAPH_COMMIT_LOCK_WAIT_SECONDS:-unset}"
} >> "$TD_PARKLOG"
sleep $sleep_s
if [ "$rc" = 0 ] && [ "$mode" != none ]; then
  # The sweep prefixes the positionals with leading flags ('--pr <n>',
  # '--base <id>=<sha>'). Skip any number of them, exactly as park-node's own
  # leading-flags-only parse does, so this fake survives a changed flag set.
  while [ "\$#" -gt 0 ]; do
    case "\$1" in
      --*) shift 2 ;;
      *) break ;;
    esac
  done
  node="\$1"
  f="$TD_REPO/intentions/\$node.md"
  case "$mode" in
    land)   sed -i 's/^office_hours: null\$/office_hours:\n  reason: landed by the fake park-node\n  since: 2026-01-01\n  recommendation: null/' "\$f" ;;
    body)   printf '\noffice_hours:\n  reason: a BODY line, not frontmatter\n' >> "\$f" ;;
    delete) rm -f "\$f" ;;
  esac
  git -C "$TD_REPO" add -A
  git -C "$TD_REPO" commit -q -m 'fake park-node: $mode'
  git -C "$TD_REPO" update-ref refs/remotes/origin/main HEAD
fi
exit $rc
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
  # `statement`/`owner`/`status` are the IntentionSchema's required core
  # (schema.ts validateNode) — present on every fixture below so a
  # verify-landed jq-mode confirmation (readNodeAtRef, which validates
  # strictly) can actually read these nodes rather than throwing on a missing
  # required field. `phase` is not part of the schema and is ignored by it.
  case "$kind" in
    done)
      cat > "$f" <<NODE
---
id: $id
kind: tactic
statement: fixture node for lib-frozen-session-park tests
owner: ai
status: working
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
statement: fixture node for lib-frozen-session-park tests
owner: ai
status: working
phase: qa
office_hours:
  reason: parked earlier by something else
  since: 2026-01-01
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
statement: fixture node for lib-frozen-session-park tests
owner: ai
status: working
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
statement: fixture node for lib-frozen-session-park tests
owner: ai
status: working
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
assert_eq "terminal: node id is \$3 (after --base <id>=<sha>)" "tactic-terminal-one" "$(td_park_arg 3)"
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
assert_eq "already-parked: the body-mention node is the one parked" "tactic-td-body-mention" "$(td_park_arg 3)"
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
assert_eq "escalation: five positional args" "ARGC=5" "$(grep '^ARGC=' "$TD_PARKLOG")"
assert_eq "escalation: reason is the worker's own text" "the worker's own reason" "$(td_park_arg 4)"
assert_eq "escalation: recommendation is the worker's own text" "the worker's own recommendation" "$(td_park_arg 5)"
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
assert_eq "resumed: the worker's own reason was recovered" "the resumed worker's own reason" "$(td_park_arg 4)"
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
  "$(case "$(td_park_arg 4)" in *"ended without declaring a disposition"*) printf 'yes' ;; *) printf 'no' ;; esac)"
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
  "$(case "$(td_park_arg 4)" in *"ended without declaring a disposition"*) printf 'yes' ;; *) printf 'no' ;; esac)"
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
assert_eq "pr: seven positional args" "ARGC=7" "$(grep '^ARGC=' "$TD_PARKLOG")"
assert_eq "pr: --pr is first" "--pr" "$(td_park_arg 1)"
assert_eq "pr: the number is second" "2994" "$(td_park_arg 2)"
assert_eq "pr: the node id is fifth (after --pr <n> --base <id>=<sha>)" "tactic-td-pr" "$(td_park_arg 5)"
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
assert_eq "bad-pr: five positional args (no --pr)" "ARGC=5" "$(grep '^ARGC=' "$TD_PARKLOG")"
assert_eq "bad-pr: the node id is third" "tactic-td-badpr" "$(td_park_arg 3)"
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
  "$(case "$(td_park_arg 4)" in *"ended without declaring a disposition"*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "synth: the synthesized recommendation states the mandatory reap-then-clear-park order" "yes" \
  "$(case "$(td_park_arg 5)" in *"reap it before clearing the park"*"mandatory"*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "synth: the synthesized recommendation gates the destructive fallback on the reap-safety checks" "yes" \
  "$(case "$(td_park_arg 5)" in *"status --porcelain --untracked-files=no"*"diff --quiet origin/main HEAD -- . ':!intentions'"*"do NOT remove the worktree"*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "synth: the synthesized recommendation warns off a commits-ahead gate" "yes" \
  "$(case "$(td_park_arg 5)" in *"never by a commits-ahead count"*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "synth: the synthesized recommendation drops the retired 'Do NOT simply reap' sentence" "no" \
  "$(case "$(td_park_arg 5)" in *"Do NOT simply reap the terminal session and release the node"*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "synth: the synthesized recommendation no longer offers clear-park as a standalone fork" "no" \
  "$(case "$(td_park_arg 5)" in *"either answer it here and"*"or stop the session"*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "synth: the synthesized recommendation warns that clearing without a reap is a no-op" "yes" \
  "$(case "$(td_park_arg 5)" in *"is a no-op"*"re-parks the node on its next pass"*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "synth: the synthesized recommendation states clear-park alone is correct once the session is already gone" "yes" \
  "$(case "$(td_park_arg 5)" in *"shows no session for this node"*"clear-park <node-id>\` alone is the correct and sufficient action"*) printf 'yes' ;; *) printf 'no' ;; esac)"
td_teardown

# --- Test 30b: the worker's own escalation text is unaffected by the wording fix --

echo "Test: a session's own office-hours-recommendation is threaded through unchanged even in the terminal-without-disposition sweep"
td_setup
td_write_node "tactic-td-verbatim-reco" working
td_commit_nodes
td_write_transcript "0fed-4040" $(( TD_NOW - 4000 ))
td_add_session "0fed-4040" "tactic-td-verbatim-reco" "done" "fed0aaaa"
td_write_job_file "fed0aaaa" "tactic-td-verbatim-reco" office-hours-reason "the worker's own reason, again"
td_write_job_file "fed0aaaa" "tactic-td-verbatim-reco" office-hours-recommendation "the worker's own recommendation, again"
td_install_claude 0
td_run
assert_eq "verbatim-reco: sweep returns 0" "0" "$TD_RC"
assert_eq "verbatim-reco: park-node invoked once" "1" "$(td_park_calls)"
assert_eq "verbatim-reco: recommendation is the worker's own text, untouched by the synthesized-branch wording" \
  "the worker's own recommendation, again" "$(td_park_arg 5)"
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
# A non-zero exit is a park FAILURE, not an unlanded park: the two have different
# causes and different operator responses, so their lines must stay distinct.
assert_eq "park-fail: it is not reported as an unlanded park" "no" "$(td_contains 'park-not-landed')"
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

# --- Test 33: the fetch budget — one lazy pre-flight + one per confirmed park --
#
# The pre-flight fetch is lazy AND latched: two eligible candidates still produce
# exactly ONE of it. Step (13)'s confirmation fetch is a second kind and is NOT
# latched — the park itself is what makes origin/main stale, so a confirmation
# read against the pre-park ref would report every park as not-landed. Two parks
# therefore cost 1 + 2 = 3 fetches, bounded by the park cap. Counted with a `git`
# wrapper on PATH that logs a line for every invocation carrying the `fetch`
# subcommand and then delegates to the real binary.

echo "Test: two eligible candidates cost one pre-flight fetch plus one confirmation fetch each"
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
assert_eq "fetch: one pre-flight fetch plus one confirmation fetch per park" "3" \
  "$(wc -l < "$TD_DIR/fetch.log" | tr -d ' ')"
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
# A killed park is a park-timeout, never an unlanded park — the timeout branch
# does no confirmation read at all.
assert_eq "td-timeout: it is not reported as an unlanded park" "no" "$(td_contains 'park-not-landed')"
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
  "$(td_park_arg 3)"
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
assert_eq "td-nullid: the node id survived the parse" "tactic-td-nullid" "$(td_park_arg 3)"
assert_eq "td-nullid: stderr reports the unusable job id" "yes" \
  "$(td_contains 'terminal worker tactic-td-nullid has no usable job id')"
td_teardown

# --- Test 42: rc 0 with nothing landed retains the markers -------------------
#
# THE regression test. `park-node` lands through `graph-commit`, which pushes to
# a contended `refs/graph/landing-lock` and can exit 0 in situations where the
# write never reached origin/main (invariant I2: a graph-commit exit 0 is never
# evidence anything landed). The old code deleted the session's escalation
# markers on that exit code alone — destroying the ONLY copy of the session's own
# escalation text while leaving the node held-and-unparked, i.e. turning a
# recoverable failure into an unrecoverable one on the path whose job is to
# prevent exactly that. The park must now be PROVEN landed on origin/main before
# a single marker is removed.

echo "Test: park-node exits 0 but origin/main still shows office_hours: null → markers retained"
td_setup
td_write_park_node 0 0 none
td_write_node "tactic-td-notlanded" working
td_commit_nodes
td_write_transcript "0aae-3030" $(( TD_NOW - 4000 ))
td_add_session "0aae-3030" "tactic-td-notlanded" "done" "aae03030"
td_write_job_file "aae03030" "tactic-td-notlanded" office-hours-reason "reason that must survive an unlanded park"
td_write_job_file "aae03030" "tactic-td-notlanded" office-hours-recommendation "recommendation that must survive"
td_write_job_file "aae03030" "tactic-td-notlanded" office-hours-pr "3117"
td_install_claude 0
td_run
assert_eq "not-landed: sweep returns 0" "0" "$TD_RC"
assert_eq "not-landed: park-node was invoked" "1" "$(td_park_calls)"
assert_eq "not-landed: stderr carries the loud, distinctly greppable line" "yes" \
  "$(td_contains 'park-not-landed for tactic-td-notlanded — park-node exited 0 but origin/main still shows no office_hours')"
assert_eq "not-landed: the decision record says park-not-landed" "park-not-landed" "$(td_log_dispositions)"
assert_eq "not-landed: the reason marker is retained" "present" \
  "$([[ -e "$TD_JOBS/aae03030/office-hours-reason" ]] && printf 'present' || printf 'gone')"
assert_eq "not-landed: the recommendation marker is retained" "present" \
  "$([[ -e "$TD_JOBS/aae03030/office-hours-recommendation" ]] && printf 'present' || printf 'gone')"
assert_eq "not-landed: the pr marker is retained" "present" \
  "$([[ -e "$TD_JOBS/aae03030/office-hours-pr" ]] && printf 'present' || printf 'gone')"
assert_eq "not-landed: the success line is NOT logged" "no" \
  "$(td_contains 'parked tactic-td-notlanded (terminal-without-disposition')"
assert_eq "not-landed: the sweep counts no park" "yes" \
  "$(td_contains 'terminal-disposition sweep complete (terminal=1 parked=0 observing=0 unmeasurable=0 deferred=0)')"
td_teardown

# --- Test 43: a park confirmed on origin/main is counted and clears the markers -
#
# The other half of the same gate: a park that genuinely landed still behaves
# exactly as before. The final assertion reads origin/main directly, so a fixture
# that silently stopped landing could not make this test vacuous.

echo "Test: a park proven non-null on origin/main is counted and clears the markers"
td_setup
td_write_node "tactic-td-landed" working
td_commit_nodes
td_write_transcript "0bbf-3131" $(( TD_NOW - 4000 ))
td_add_session "0bbf-3131" "tactic-td-landed" "done" "bbf03131"
td_write_job_file "bbf03131" "tactic-td-landed" office-hours-reason "the worker's own reason"
td_install_claude 0
td_run
assert_eq "landed: sweep returns 0" "0" "$TD_RC"
assert_eq "landed: park-node invoked once" "1" "$(td_park_calls)"
assert_eq "landed: stderr reports the park" "yes" \
  "$(td_contains 'parked tactic-td-landed (terminal-without-disposition after 4000s')"
assert_eq "landed: the decision record says parked" "parked" "$(td_log_dispositions)"
assert_eq "landed: no unlanded-park line" "no" "$(td_contains 'park-not-landed')"
assert_eq "landed: the reason marker was removed" "gone" \
  "$([[ -e "$TD_JOBS/bbf03131/office-hours-reason" ]] && printf 'present' || printf 'gone')"
assert_eq "landed: the sweep counts the park" "yes" \
  "$(td_contains 'terminal-disposition sweep complete (terminal=1 parked=1 observing=0 unmeasurable=0 deferred=0)')"
assert_eq "landed: origin/main really carries the park (the fixture is not vacuous)" "1" \
  "$(git -C "$TD_REPO" show 'origin/main:intentions/tactic-td-landed.md' | grep -c '^office_hours:$')"
td_teardown

# --- Test 44: an unreadable node after an rc-0 park is NOT landed -------------
#
# UNKNOWN is never "landed". If the node file cannot be read from origin/main at
# all after the park returned 0, the sweep has no evidence the park landed, so
# the markers stay.

echo "Test: a node absent from origin/main after an rc-0 park is treated as not landed"
td_setup
td_write_park_node 0 0 delete
td_write_node "tactic-td-vanished" working
td_commit_nodes
td_write_transcript "0ccf-3232" $(( TD_NOW - 4000 ))
td_add_session "0ccf-3232" "tactic-td-vanished" "done" "ccf03232"
td_write_job_file "ccf03232" "tactic-td-vanished" office-hours-reason "reason that must survive an unreadable node"
td_install_claude 0
td_run
assert_eq "vanished: sweep returns 0" "0" "$TD_RC"
assert_eq "vanished: stderr reports the unlanded park" "yes" \
  "$(td_contains 'park-not-landed for tactic-td-vanished')"
assert_eq "vanished: the decision record says park-not-landed" "park-not-landed" "$(td_log_dispositions)"
assert_eq "vanished: the reason marker is retained" "present" \
  "$([[ -e "$TD_JOBS/ccf03232/office-hours-reason" ]] && printf 'present' || printf 'gone')"
assert_eq "vanished: the sweep counts no park" "yes" \
  "$(td_contains 'terminal-disposition sweep complete (terminal=1 parked=0 observing=0 unmeasurable=0 deferred=0)')"
td_teardown

# --- Test 45: the confirmation read is frontmatter-scoped ---------------------
#
# The trap step (8)'s idiom exists to prevent, read in the opposite polarity: a
# column-0 `office_hours:` line in the markdown BODY (documentation of the
# serialization) must never be mistaken for park state — here, must never certify
# a park that never landed and so authorize deleting the session's only copy of
# its escalation text.

echo "Test: a body-only office_hours line never certifies a park (frontmatter scoping)"
td_setup
td_write_park_node 0 0 body
td_write_node "tactic-td-bodyonly" working
td_commit_nodes
td_write_transcript "0ddb-3333" $(( TD_NOW - 4000 ))
td_add_session "0ddb-3333" "tactic-td-bodyonly" "done" "ddb03333"
td_write_job_file "ddb03333" "tactic-td-bodyonly" office-hours-reason "reason that must survive a body-only office_hours"
td_install_claude 0
td_run
assert_eq "body-only: sweep returns 0" "0" "$TD_RC"
assert_eq "body-only: the body line did not certify the park" "yes" \
  "$(td_contains 'park-not-landed for tactic-td-bodyonly')"
assert_eq "body-only: the decision record says park-not-landed" "park-not-landed" "$(td_log_dispositions)"
assert_eq "body-only: the reason marker is retained" "present" \
  "$([[ -e "$TD_JOBS/ddb03333/office-hours-reason" ]] && printf 'present' || printf 'gone')"
assert_eq "body-only: origin/main really carries the body line (the fixture is not vacuous)" "1" \
  "$(git -C "$TD_REPO" show 'origin/main:intentions/tactic-td-bodyonly.md' | grep -c '^office_hours:$')"
assert_eq "body-only: the sweep counts no park" "yes" \
  "$(td_contains 'terminal-disposition sweep complete (terminal=1 parked=0 observing=0 unmeasurable=0 deferred=0)')"
td_teardown

# --- Test 46: --pr/--base ordering is the leading-flags-only regression guard -
#
# park-node's parse is leading-flags-only: the first non-flag argument ends
# flag parsing and everything after it is verbatim free text. If a flag ever
# ended up after the first positional, park-node would silently swallow it as
# part of the reason/recommendation text rather than erroring — so the exact
# threaded shape ($1=--pr $2=<n> $3=--base $4=<id>=<sha> $5=<node-id> ...) is
# asserted here, not just "the flags are present somewhere".

echo "Test: --pr/--base thread in the correct leading-flags-only order"
td_setup
td_write_node "tactic-order-pr" working
td_commit_nodes
EXPECTED=$(git -C "$TD_REPO" rev-parse "origin/main:intentions/tactic-order-pr.md")
td_write_transcript "0aab-4040" $(( TD_NOW - 4000 ))
td_add_session "0aab-4040" "tactic-order-pr" "done" "aab04040"
td_write_job_file "aab04040" "tactic-order-pr" office-hours-reason "reason with a pr for ordering"
td_write_job_file "aab04040" "tactic-order-pr" office-hours-pr "3300"
td_install_claude 0
td_run
assert_eq "order: sweep returns 0" "0" "$TD_RC"
assert_eq "order: seven positional args" "ARGC=7" "$(grep '^ARGC=' "$TD_PARKLOG")"
assert_eq "order: \$1 is --pr" "--pr" "$(td_park_arg 1)"
assert_eq "order: \$2 is the pr number" "3300" "$(td_park_arg 2)"
assert_eq "order: \$3 is --base" "--base" "$(td_park_arg 3)"
assert_eq "order: \$4 pins tactic-order-pr=<sha>" "tactic-order-pr=$EXPECTED" "$(td_park_arg 4)"
assert_eq "order: \$5 is the node id" "tactic-order-pr" "$(td_park_arg 5)"
td_teardown

# --- Test 47: park-node exit 3 is its own outcome, not a park failure --------
#
# Sibling of the frozen-sweep exit-3 test: `rc==3` is the stale-diagnosis
# compare-and-swap refusal and must get its own disposition, must never be
# reported as an ordinary park failure, must not increment parked_count, and —
# unlike a real ordinary failure — the escalation markers are retained exactly
# as every other non-landed path already keeps them.

echo "Test: park-node exit 3 is logged as stale-diagnosis, not a park failure (terminal sweep)"
td_setup
td_write_park_node 3
td_write_node "tactic-stale-terminal" working
td_commit_nodes
td_write_transcript "0bbc-4141" $(( TD_NOW - 4000 ))
td_add_session "0bbc-4141" "tactic-stale-terminal" "done" "bbc04141"
td_write_job_file "bbc04141" "tactic-stale-terminal" office-hours-reason "reason that must survive a stale-diagnosis refusal"
td_install_claude 0
td_run
assert_eq "stale-terminal: sweep returns 0" "0" "$TD_RC"
assert_eq "stale-terminal: stderr reports stale-diagnosis" "yes" \
  "$(td_contains 'stale-diagnosis skip for tactic-stale-terminal')"
assert_eq "stale-terminal: stderr does NOT report a park failure" "no" \
  "$(td_contains 'park failed for tactic-stale-terminal')"
assert_eq "stale-terminal: the decision record says stale-diagnosis" "stale-diagnosis" "$(td_log_dispositions)"
assert_eq "stale-terminal: summary counts zero parks" "yes" \
  "$(td_contains 'terminal-disposition sweep complete (terminal=1 parked=0 observing=0 unmeasurable=0 deferred=0)')"
assert_eq "stale-terminal: the escalation marker is retained" "present" \
  "$([[ -e "$TD_JOBS/bbc04141/office-hours-reason" ]] && printf 'present' || printf 'gone')"
td_teardown

# --- Test 48: a concurrent writer inside the guard-to-write window is REFUSED,
#              not clobbered — THE regression test for this defect -----------
#
# The end-to-end race: a different park lands on origin/main between this
# sweep's diagnosis-time read and its own park-node write. Before the Unit 1
# fix, the sweep's write would silently overwrite that park with its own
# generic boilerplate. With the fix, park-node's compare-and-swap sees the
# pinned --base no longer matches origin/main and REFUSES (exit 3) instead —
# so the concurrent writer's specific park must survive byte-for-byte and the
# sweep's generic text must never appear.

echo "Test: a concurrent writer landing inside the guard-to-write window is REFUSED, not clobbered"
td_setup
td_write_park_node 0 0 race
td_write_node "tactic-race" working
td_commit_nodes
td_write_transcript "0ccd-4242" $(( TD_NOW - 4000 ))
td_add_session "0ccd-4242" "tactic-race" "done" "ccd04242"
td_write_job_file "ccd04242" "tactic-race" office-hours-reason "reason that must survive the race"
td_install_claude 0
td_run
assert_eq "race: sweep returns 0" "0" "$TD_RC"
RACE_BODY=$(git -C "$TD_REPO" show 'origin/main:intentions/tactic-race.md')
assert_eq "race: the concurrent writer's reason sentinel survives byte-for-byte" "yes" \
  "$(case "$RACE_BODY" in *"RACE_SENTINEL_REASON_7f3a"*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "race: the concurrent writer's recommendation sentinel survives byte-for-byte" "yes" \
  "$(case "$RACE_BODY" in *"RACE_SENTINEL_RECOMMENDATION_9c2e"*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "race: the sweep's generic disposition text is ABSENT" "no" \
  "$(case "$RACE_BODY" in *"ended without declaring a disposition"*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "race: the decision record says stale-diagnosis" "stale-diagnosis" "$(td_log_dispositions)"
assert_eq "race: the sweep counts no park" "yes" \
  "$(td_contains 'terminal-disposition sweep complete (terminal=1 parked=0 observing=0 unmeasurable=0 deferred=0)')"
assert_eq "race: the escalation marker is retained" "present" \
  "$([[ -e "$TD_JOBS/ccd04242/office-hours-reason" ]] && printf 'present' || printf 'gone')"
# Non-vacuity control: without this, the test would pass trivially if the fake
# never actually advanced origin/main, or if the sweep stopped calling
# park-node at all. Assert the race actually fired.
assert_eq "race: non-vacuity — the fake park-node's CAS actually raced" "yes" \
  "$(grep -q '^RACED=1$' "$TD_PARKLOG" && printf 'yes' || printf 'no')"
td_teardown

# ============================================================================
# Unit 5 — the invalid-state lane PRE-TIER in frozen_session_sweep
# ============================================================================
# The oracle for every fall-through case below is Test 1's own park assertion,
# reused verbatim: with the pre-tier declining, the park path must run EXACTLY
# as it does today. The failure mode this guards is the worst one in the change
# set — deleting a session's only copy of its escalation text.

echo "Test: lane pre-tier — a handled verdict defers the candidate instead of parking"
fs_setup
fs_write_route_stub 0
fs_write_node "tactic-frozen-one" unparked
fs_commit_nodes
fs_write_transcript "0aa1-1111" $(( FS_NOW - 2000 ))
fs_add_session "0aa1-1111" "tactic-frozen-one" "blocked"
fs_install_claude 0
fs_run
assert_eq "lane: the router was consulted exactly once" "1" "$(fs_route_calls)"
assert_eq "lane: a handled verdict parks NOTHING" "0" "$(fs_park_calls)"
assert_eq "lane: the decision record says routed-to-lane" "routed-to-lane" "$(fs_log_dispositions)"
assert_eq "lane: stderr says deferred, not parked" "yes" \
  "$(fs_contains 'routed tactic-frozen-one to the invalid-state lane')"
assert_eq "lane: the pre-tier line reports the routed count" "yes" \
  "$(fs_contains 'frozen-session lane pre-tier (routed=1 kept-by-lane=0)')"
# The router is called with the node id and the kind this sweep owns.
route_argv=$(head -1 "$FS_ROUTELOG")
case "$route_argv" in *"--node tactic-frozen-one"*) a=yes ;; *) a="no: $route_argv" ;; esac
assert_eq "lane: the router call names the node" "yes" "$a"
case "$route_argv" in *"--kind frozen-session"*) a=yes ;; *) a="no: $route_argv" ;; esac
assert_eq "lane: frozen_session_sweep passes --kind frozen-session" "yes" "$a"
fs_teardown

echo "Test: lane pre-tier — a keep verdict parks nothing and is recorded"
fs_setup
fs_write_route_stub 4
fs_write_node "tactic-frozen-one" unparked
fs_commit_nodes
fs_write_transcript "0aa1-1111" $(( FS_NOW - 2000 ))
fs_add_session "0aa1-1111" "tactic-frozen-one" "blocked"
fs_install_claude 0
fs_run
assert_eq "lane: a keep verdict parks nothing" "0" "$(fs_park_calls)"
assert_eq "lane: the decision record says kept-by-lane" "kept-by-lane" "$(fs_log_dispositions)"
fs_teardown

echo "Test: lane pre-tier — an escalate verdict falls through to the park path unchanged"
fs_setup
fs_write_route_stub 10
fs_write_node "tactic-frozen-one" unparked
fs_commit_nodes
fs_write_transcript "0aa1-1111" $(( FS_NOW - 2000 ))
fs_add_session "0aa1-1111" "tactic-frozen-one" "blocked"
fs_install_claude 0
fs_run
# Test 1's assertions, reused as the oracle: the park path must be untouched.
assert_eq "lane/escalate: park-node invoked exactly once" "1" "$(fs_park_calls)"
assert_eq "lane/escalate: node id is still \$3 (after --base <id>=<sha>)" \
  "tactic-frozen-one" "$(fs_park_arg 3)"
assert_eq "lane/escalate: the decision record says parked" "parked" "$(fs_log_dispositions)"
assert_eq "lane/escalate: the summary is byte-identical to today's" "yes" \
  "$(fs_contains 'sweep complete (blocked=1 parked=1 observing=0 unmeasurable=0 deferred=0)')"
assert_eq "lane/escalate: no pre-tier line is printed when nothing was routed" "no" \
  "$(fs_contains 'lane pre-tier')"
fs_teardown

echo "Test: lane pre-tier — an ABSENT router falls through to the park path (fail toward escalate)"
fs_setup
# No fs_write_route_stub at all: this is the state on landing, before the
# router's own PR merges. Today's behavior must be preserved exactly.
FS_ROUTELOG=""
fs_write_node "tactic-frozen-one" unparked
fs_commit_nodes
fs_write_transcript "0aa1-1111" $(( FS_NOW - 2000 ))
fs_add_session "0aa1-1111" "tactic-frozen-one" "blocked"
fs_install_claude 0
fs_run
assert_eq "lane/absent: park-node invoked exactly once" "1" "$(fs_park_calls)"
assert_eq "lane/absent: the summary is byte-identical to today's" "yes" \
  "$(fs_contains 'sweep complete (blocked=1 parked=1 observing=0 unmeasurable=0 deferred=0)')"
fs_teardown

echo "Test: lane pre-tier — a router that hangs past its timeout falls through to the park path"
fs_setup
# 3s nap against a 1s budget: the gate must abandon it and park, not stall the
# tick. An unbounded router call on the scheduling path is a fleet stall.
fs_write_route_stub 0 3
DISPATCH_INVALID_STATE_ROUTE_TIMEOUT_S=1
fs_write_node "tactic-frozen-one" unparked
fs_commit_nodes
fs_write_transcript "0aa1-1111" $(( FS_NOW - 2000 ))
fs_add_session "0aa1-1111" "tactic-frozen-one" "blocked"
fs_install_claude 0
fs_run
assert_eq "lane/timeout: a hung router still parks" "1" "$(fs_park_calls)"
assert_eq "lane/timeout: the park path ran unchanged" "parked" "$(fs_log_dispositions)"
unset DISPATCH_INVALID_STATE_ROUTE_TIMEOUT_S
fs_teardown

echo "Test: lane pre-tier — a router outside the checkout's scripts dir is refused"
fs_setup
fs_write_route_stub 0
# Provenance: an executable outside $repo_root's scripts dir must never be run,
# even when named explicitly. This is what makes honouring the env override safe.
ROGUE_ROUTE="$FS_DIR/rogue-route"
cat > "$ROGUE_ROUTE" <<'ROGUE'
#!/usr/bin/env bash
exit 0
ROGUE
chmod +x "$ROGUE_ROUTE"
DISPATCH_INVALID_STATE_ROUTE_CMD="$ROGUE_ROUTE"
fs_write_node "tactic-frozen-one" unparked
fs_commit_nodes
fs_write_transcript "0aa1-1111" $(( FS_NOW - 2000 ))
fs_add_session "0aa1-1111" "tactic-frozen-one" "blocked"
fs_install_claude 0
fs_run
assert_eq "lane/provenance: a rogue router path is refused" "yes" \
  "$(fs_contains 'does not resolve inside')"
assert_eq "lane/provenance: the refusal falls through to the park path" "1" "$(fs_park_calls)"
unset DISPATCH_INVALID_STATE_ROUTE_CMD
fs_teardown

# ============================================================================
# Unit 5 — the invalid-state lane PRE-TIER in terminal_without_disposition_sweep
# ============================================================================
# This is the sweep whose park block deletes the job dir's office-hours-*
# markers on landing proof. A routed candidate must keep them: the pass has
# proven nothing and the intervention may still need them.

echo "Test: lane pre-tier (terminal) — a handled verdict defers and leaves markers intact"
td_setup
fs_write_route_stub 0 0 "$TD_REPO" "$TD_DIR"
td_write_node "tactic-terminal-one" unparked
td_commit_nodes
td_write_transcript "0cc3-3333" $(( TD_NOW - 2000 ))
td_add_session "0cc3-3333" "tactic-terminal-one" "done" "job-td-1"
td_install_claude 0
td_run
assert_eq "lane/td: the router was consulted" "1" "$(fs_route_calls)"
assert_eq "lane/td: a handled verdict parks NOTHING" "0" "$(td_park_calls)"
assert_eq "lane/td: stderr says deferred and markers intact" "yes" \
  "$(td_contains 'routed tactic-terminal-one to the invalid-state lane')"
route_argv=$(head -1 "$FS_ROUTELOG")
case "$route_argv" in *"--kind terminal-session"*) a=yes ;; *) a="no: $route_argv" ;; esac
assert_eq "lane/td: this sweep passes --kind terminal-session" "yes" "$a"
td_teardown

echo "Test: lane pre-tier (terminal) — an escalate verdict falls through to the park path unchanged"
td_setup
fs_write_route_stub 10 0 "$TD_REPO" "$TD_DIR"
td_write_node "tactic-terminal-one" unparked
td_commit_nodes
td_write_transcript "0cc3-3333" $(( TD_NOW - 2000 ))
td_add_session "0cc3-3333" "tactic-terminal-one" "done" "job-td-1"
td_install_claude 0
td_run
assert_eq "lane/td-escalate: park-node invoked exactly once" "1" "$(td_park_calls)"
td_teardown

report_results
