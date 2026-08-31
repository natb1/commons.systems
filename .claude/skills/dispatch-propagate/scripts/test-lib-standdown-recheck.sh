#!/usr/bin/env bash
# Tests for lib-standdown-recheck.sh — the stand-down ledger and the liveness
# re-check sweep that turns "the duplicate-worker stand-down winner died and the
# work is stranded" into an observable office-hours park.
#
# Everything the sweep touches is faked: `claude agents --json` via
# CLAUDE_AGENTS_CMD (a small script printing a controlled registry array), the
# ledger via DISPATCH_STANDDOWN_DIR, the transcript store via
# DISPATCH_STANDDOWN_PROJECTS_ROOT (files whose mtime `touch -d` sets), the graph
# via DISPATCH_STANDDOWN_REPO_ROOT (a scratch git repo whose
# refs/remotes/origin/main is set by hand — the sweep only ever READS
# `git show origin/main:` and its fetch is non-fatal, so no real remote is
# needed), the per-node worktrees as standalone scratch repos under
# <repo>/.claude/worktrees/<node>, `park-node` via DISPATCH_STANDDOWN_PARK_NODE
# (an argv logger with a test-controlled exit code), and the clock via
# DISPATCH_STANDDOWN_NOW_EPOCH.
#
# standdown_recheck_sweep always returns 0, but every call is still wrapped in an
# `if` to capture the code — the test shell runs under `set -e`.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib-claude-agents.sh"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib-standdown-recheck.sh"

echo "=== lib-standdown-recheck.sh ==="

# A fixed clock for every test. Transcript mtimes and marker stamps are
# expressed relative to it.
SD_NOW=1700000000

SD_DIR=""
SD_FAKE=""
SD_REPO=""
SD_PROJ=""
SD_LEDGER=""
SD_PARK=""
SD_PARKLOG=""
SD_ENTRIES=()
SD_RC=0
SD_ERR=""

sd_setup() {
  SD_DIR=$(mktemp -d)
  SD_FAKE="$SD_DIR/fake-claude"
  SD_REPO="$SD_DIR/repo"
  SD_PROJ="$SD_DIR/projects"
  SD_LEDGER="$SD_DIR/ledger"
  SD_PARK="$SD_DIR/fake-park-node"
  SD_PARKLOG="$SD_DIR/park-node.log"
  SD_ENTRIES=()
  mkdir -p "$SD_REPO/intentions" "$SD_PROJ/proj-a" "$SD_DIR/decisions" "$SD_LEDGER"
  : > "$SD_PARKLOG"

  git -C "$SD_REPO" init -q
  git -C "$SD_REPO" config user.email "test@example.com"
  git -C "$SD_REPO" config user.name "Test"

  # The sweep must never see a tick snapshot: CLAUDE_AGENTS_CMD is the fake we
  # want exercised (_claude_agents_raw prefers the snapshot when it is set).
  unset DISPATCH_AGENTS_SNAPSHOT || true

  DISPATCH_STANDDOWN_NOW_EPOCH="$SD_NOW"
  DISPATCH_STANDDOWN_DIR="$SD_LEDGER"
  DISPATCH_STANDDOWN_REPO_ROOT="$SD_REPO"
  DISPATCH_STANDDOWN_PROJECTS_ROOT="$SD_PROJ"
  DISPATCH_STANDDOWN_PARK_NODE="$SD_PARK"
  unset DISPATCH_STANDDOWN_IDLE_GRACE_S || true
  unset DISPATCH_STANDDOWN_PARK_MAX || true

  # lib-decision-log.sh resolves DECISION_LOG_FILE ONCE, at source time, inside
  # its load guard — so a per-test DISPATCH_DECISION_LOG_DIR set after sourcing
  # would not be read. Set the env var for documentation/parity and re-point the
  # already-resolved variable at the same scratch path.
  DISPATCH_DECISION_LOG_DIR="$SD_DIR/decisions"
  DECISION_LOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"

  sd_write_park_node 0
}

sd_teardown() {
  rm -rf "$SD_DIR"
  SD_DIR=""
  unset CLAUDE_AGENTS_CMD || true
  unset DISPATCH_STANDDOWN_NOW_EPOCH DISPATCH_STANDDOWN_DIR \
        DISPATCH_STANDDOWN_REPO_ROOT DISPATCH_STANDDOWN_PROJECTS_ROOT \
        DISPATCH_STANDDOWN_PARK_NODE DISPATCH_STANDDOWN_IDLE_GRACE_S \
        DISPATCH_STANDDOWN_PARK_MAX DISPATCH_DECISION_LOG_DIR || true
}

# sd_write_park_node <exit-code> [landing-mode] — install the fake park-node:
# it appends its argc and each positional argument to the log, then — for a
# zero exit code — LANDS the park on origin/main (default `land`; `none`
# exits 0 with no write, modeling the `graph-commit` exit-0-but-nothing-landed
# shape the sweep's verify-landed confirmation regression-tests), then exits
# <exit-code>. The sweep calls `park_node` with the node id as `$1` (no
# leading flags, unlike lib-frozen-session-park.sh's callers), so no
# flag-skip loop is needed here.
sd_write_park_node() {
  local rc="$1" mode="${2:-land}"
  cat > "$SD_PARK" <<PARK
#!/usr/bin/env bash
{
  printf 'ARGC=%s\n' "\$#"
  for a in "\$@"; do printf 'ARG=%s\n' "\$a"; done
} >> "$SD_PARKLOG"
if [ "$rc" = 0 ] && [ "$mode" != none ]; then
  node="\$1"
  f="$SD_REPO/intentions/\$node.md"
  sed -i 's/^office_hours: null\$/office_hours:\n  reason: landed by the fake park-node\n  since: 2026-01-01\n  recommendation: null/' "\$f"
  git -C "$SD_REPO" add -A
  git -C "$SD_REPO" commit -q -m 'fake park-node: land'
  git -C "$SD_REPO" update-ref refs/remotes/origin/main HEAD
fi
exit $rc
PARK
  chmod +x "$SD_PARK"
}

# sd_add_session <sid> <name> [status] — append one live registry entry.
# [status] defaults to "busy" (state "working"); pass the empty string for the
# shape the daemon actually reports for a HELD/blocked session — `"status":null`
# with `"state":"blocked"`, which `@tsv` renders as an EMPTY middle column.
sd_add_session() {
  local sid="$1" name="$2" status="${3-busy}"
  if [[ -z "$status" ]]; then
    SD_ENTRIES+=("{\"sessionId\":\"$sid\",\"name\":\"$name\",\"state\":\"blocked\",\"status\":null,\"cwd\":\"/tmp/$name\"}")
  else
    SD_ENTRIES+=("{\"sessionId\":\"$sid\",\"name\":\"$name\",\"state\":\"working\",\"status\":\"$status\",\"cwd\":\"/tmp/$name\"}")
  fi
}

# sd_install_claude [exit-code] — install the fake `claude` emitting the
# accumulated registry array and point CLAUDE_AGENTS_CMD at it.
sd_install_claude() {
  local exit_code="${1:-0}" payload
  payload=$( IFS=,; printf '[%s]' "${SD_ENTRIES[*]}" )
  printf '%s' "$payload" > "$SD_DIR/payload.json"
  cat > "$SD_FAKE" <<FAKE
#!/usr/bin/env bash
cat "$SD_DIR/payload.json"
exit $exit_code
FAKE
  chmod +x "$SD_FAKE"
  CLAUDE_AGENTS_CMD="$SD_FAKE"
}

# sd_write_node <id> <unparked|parked|bodymention> [node-kind] — write one node
# markdown file into the scratch repo's intentions/ dir. `node-kind` is the
# graph `kind:` field and defaults to `tactic`; pass `strategy` for the lane
# that never pre-provisions a worktree. validateNode (schema.ts) treats `kind`
# as any non-empty string and makes `success_signal` optional, so a strategy
# fixture still passes the strict verify-landed read the fake park-node
# triggers.
sd_write_node() {
  local id="$1" kind="$2" node_kind="${3:-tactic}"
  local f="$SD_REPO/intentions/$id.md"
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
kind: $node_kind
statement: fixture node for lib-standdown-recheck tests
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
kind: $node_kind
statement: fixture node for lib-standdown-recheck tests
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
kind: $node_kind
statement: fixture node for lib-standdown-recheck tests
owner: ai
status: working
office_hours: null
---

Body text.
NODE
      ;;
  esac
}

# sd_commit_nodes — commit whatever is in intentions/ and publish it as
# origin/main (no bare remote needed; the sweep only reads the ref). Only
# intentions/ is added: the per-node scratch worktrees live under
# <repo>/.claude/worktrees/ and are independent git repos that must not be
# absorbed as gitlinks.
sd_commit_nodes() {
  git -C "$SD_REPO" add intentions
  git -C "$SD_REPO" commit -q -m "nodes"
  git -C "$SD_REPO" update-ref refs/remotes/origin/main HEAD
}

# sd_write_worktree <node> <insync|unpushed> — create the node's worktree at the
# derived path (<repo>/.claude/worktrees/<node>) as a standalone scratch repo.
#   insync   — clean, HEAD == refs/remotes/origin/main (worktree_in_sync true).
#   unpushed — clean, HEAD one commit ahead of origin/main with a different tree
#              (both worktree_in_sync and worktree_merged_in_sync false).
sd_write_worktree() {
  local node="$1" kind="$2"
  local wt="$SD_REPO/.claude/worktrees/$node"
  mkdir -p "$wt"
  git -C "$wt" init -q
  git -C "$wt" config user.email "test@example.com"
  git -C "$wt" config user.name "Test"
  printf 'base\n' > "$wt/f.txt"
  git -C "$wt" add -A
  git -C "$wt" commit -q -m "base"
  git -C "$wt" update-ref refs/remotes/origin/main HEAD
  if [[ "$kind" == "unpushed" ]]; then
    printf 'the fix nobody pushed\n' > "$wt/f.txt"
    git -C "$wt" add -A
    git -C "$wt" commit -q -m "the unpushed fix"
  fi
}

# sd_write_orphan_branch <node> — leave refs/heads/<node> one commit ahead of
# origin/main with NO worktree at all. This is exactly what `git worktree
# remove` leaves behind — and what the `rm -rf` + `git worktree prune` recovery
# a torn sandboxed removal requires leaves behind too: the checkout is gone, the
# branch and its commits are not. Built with plumbing (hash-object / mktree /
# commit-tree / update-ref) so the fixture never creates a checkout, which is
# the whole point of the state under test.
sd_write_orphan_branch() {
  local node="$1" base blob tree commit
  base=$(git -C "$SD_REPO" rev-parse refs/remotes/origin/main)
  blob=$(printf 'work that outlived its checkout\n' | git -C "$SD_REPO" hash-object -w --stdin)
  tree=$(printf '100644 blob %s\tstranded.txt\n' "$blob" | git -C "$SD_REPO" mktree)
  commit=$(git -C "$SD_REPO" commit-tree "$tree" -p "$base" -m "work that outlived its checkout")
  git -C "$SD_REPO" update-ref "refs/heads/$node" "$commit"
}

# sd_write_ghost_branch <node> — leave refs/heads/<node> holding a well-formed
# sha that is NOT a reachable object, so the ref exists but cannot be walked.
# This is the third state of the no-worktree arm: `rev-parse --verify --quiet`
# accepts it (MEASURED on this host: exit 0), while `rev-list --count` fails,
# so the ahead-count is unavailable and the arm must report UNKNOWN rather than
# an all-clear. Written as a loose ref because `update-ref` refuses a missing
# object — which is precisely the state being fabricated.
sd_write_ghost_branch() {
  local node="$1" gitdir
  gitdir=$(git -C "$SD_REPO" rev-parse --absolute-git-dir)
  mkdir -p "$gitdir/refs/heads"
  printf '%s\n' 0000000000000000000000000000000000000001 > "$gitdir/refs/heads/$node"
}

# sd_write_squashed_branch <node> — refs/heads/<node> is one commit AHEAD of
# origin/main while its TREE is byte-identical to origin/main's. That is the
# signature a squash merge leaves on the feature branch, and post-merge with the
# worktree reaped is the NORMAL end state in this fleet — not an edge case.
# MEASURED on git 2.55.0: `origin/main..<branch>` counts 1 while
# `git diff --quiet origin/main <branch>` exits 0.
sd_write_squashed_branch() {
  local node="$1" base tree commit
  base=$(git -C "$SD_REPO" rev-parse refs/remotes/origin/main)
  tree=$(git -C "$SD_REPO" rev-parse "$base^{tree}")
  commit=$(git -C "$SD_REPO" commit-tree "$tree" -p "$base" -m "squash-merged upstream; tree already on main")
  git -C "$SD_REPO" update-ref "refs/heads/$node" "$commit"
}

# sd_write_pushed_branch <node> — refs/heads/<node> carries work that is ALSO
# reachable from refs/remotes/origin/<node>. Nothing is at risk: the commits are
# on a remote. `origin/main..<branch>` still counts them, because that predicate
# answers "is it unmerged", not "is it unpushed". MEASURED: `origin/main..` 1,
# `--not --remotes` 0.
sd_write_pushed_branch() {
  local node="$1" base blob tree commit
  base=$(git -C "$SD_REPO" rev-parse refs/remotes/origin/main)
  blob=$(printf 'work already pushed to its own remote branch\n' | git -C "$SD_REPO" hash-object -w --stdin)
  tree=$(printf '100644 blob %s\tpushed.txt\n' "$blob" | git -C "$SD_REPO" mktree)
  commit=$(git -C "$SD_REPO" commit-tree "$tree" -p "$base" -m "work pushed to origin/<node>")
  git -C "$SD_REPO" update-ref "refs/heads/$node" "$commit"
  git -C "$SD_REPO" update-ref "refs/remotes/origin/$node" "$commit"
}

# sd_write_broken_branch <node> — a loose ref whose CONTENT is not a sha at all,
# i.e. a torn ref write. Distinct from sd_write_ghost_branch: MEASURED on this
# host, a garbage or empty loose ref exits 1 with `warning: ignoring broken ref`
# on stderr, while an ABSENT ref exits 1 with empty stderr. Same rc, so stderr is
# the only discriminator — and the commits are still in the reflog.
sd_write_broken_branch() {
  local node="$1" gitdir
  gitdir=$(git -C "$SD_REPO" rev-parse --absolute-git-dir)
  mkdir -p "$gitdir/refs/heads"
  printf 'not-a-sha\n' > "$gitdir/refs/heads/$node"
}

# sd_write_transcript <sid> <mtime-epoch>
sd_write_transcript() {
  printf '{}\n' > "$SD_PROJ/proj-a/$1.jsonl"
  touch -d "@$2" "$SD_PROJ/proj-a/$1.jsonl"
}

sd_run() {
  if standdown_recheck_sweep 2>"$SD_DIR/err"; then SD_RC=0; else SD_RC=$?; fi
  SD_ERR=$(cat "$SD_DIR/err")
}

sd_contains() {
  case "$SD_ERR" in *"$1"*) printf 'yes' ;; *) printf 'no' ;; esac
}

sd_park_calls() {
  local c
  c=$(grep -c '^ARGC=' "$SD_PARKLOG" 2>/dev/null) || c=0
  [[ -n "$c" ]] || c=0
  printf '%s' "$c"
}

# sd_park_reason — the reason argument ($2) of the FIRST park-node invocation.
sd_park_reason() {
  grep '^ARG=' "$SD_PARKLOG" | sed -n '2p' | sed 's/^ARG=//'
}

# sd_park_recommendation — the recommendation argument ($3) of the FIRST call.
sd_park_recommendation() {
  grep '^ARG=' "$SD_PARKLOG" | sed -n '3p' | sed 's/^ARG=//'
}

sd_err_count() {
  local c
  c=$(grep -c -- "$1" <<<"$SD_ERR") || c=0
  [[ -n "$c" ]] || c=0
  printf '%s' "$c"
}

sd_marker_field() {
  sed -n "s/^$2=//p" "$SD_LEDGER/$1" | head -n1
}

sd_log_dispositions() {
  [[ -f "$DECISION_LOG_FILE" ]] || return 0
  jq -r 'select(.site == "standdown-recheck-sweep") | .disposition' "$DECISION_LOG_FILE"
}

# The RAW `unpushed` field, `jq -c` and NOT `-r`, so the tri-state's three
# encodings stay distinguishable: true/false (measured), "unknown" (asked,
# unanswerable) and null (never asked). `-r` would print `unknown` and `null`
# as bare words and lose exactly the distinction under test.
sd_log_unpushed() {
  [[ -f "$DECISION_LOG_FILE" ]] || return 0
  jq -c 'select(.site == "standdown-recheck-sweep") | .unpushed' "$DECISION_LOG_FILE"
}

# --- Test 1: THE INVARIANT — a declared marker never times out ---------------
# The regression guard for the whole unit: however old the stand-down record is,
# a LIVE declared winner means observe, never park.

echo "Test: a 10-day-old declared marker whose winner is still live is observed, never parked"
sd_setup
sd_write_node "tactic-declared-live" unparked
sd_commit_nodes
sd_write_worktree "tactic-declared-live" unpushed
sd_add_session "0aa1-1111" "tactic-declared-live"
sd_install_claude 0
standdown_write "tactic-declared-live" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
# Back-date the record ten days: any age-based timeout would fire here.
sed -i "s/^observed=.*/observed=$(( SD_NOW - 864000 ))/" "$SD_LEDGER/tactic-declared-live"
sd_run
assert_eq "declared-live-old: sweep returns 0" "0" "$SD_RC"
assert_eq "declared-live-old: park-node NEVER invoked" "0" "$(sd_park_calls)"
assert_eq "declared-live-old: stderr reports observing" "yes" "$(sd_contains 'observing tactic-declared-live (declared winner 0aa1-1111 is still live')"
assert_eq "declared-live-old: the marker is kept" "declared" "$(sd_marker_field tactic-declared-live origin)"
sd_teardown

# --- Test 2: declared winner dead, work unpushed → park ----------------------

echo "Test: a declared winner that is gone with unpushed work parks the node"
sd_setup
sd_write_node "tactic-dead-unpushed" unparked
sd_commit_nodes
sd_write_worktree "tactic-dead-unpushed" unpushed
# Only the LOSER is live; the winner is absent from the registry.
sd_add_session "0bb2-2222" "tactic-dead-unpushed"
sd_install_claude 0
standdown_write "tactic-dead-unpushed" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "dead-unpushed: sweep returns 0" "0" "$SD_RC"
assert_eq "dead-unpushed: park-node invoked exactly once" "1" "$(sd_park_calls)"
assert_eq "dead-unpushed: park-node received 3 positional args" "ARGC=3" "$(grep '^ARGC=' "$SD_PARKLOG")"
assert_eq "dead-unpushed: node id is \$1" "tactic-dead-unpushed" \
  "$(grep '^ARG=' "$SD_PARKLOG" | head -n1 | sed 's/^ARG=//')"
case "$(sd_park_reason)" in
  standdown-winner-dead-work-unpushed*) sd_reason_tag="yes" ;;
  *) sd_reason_tag="no" ;;
esac
assert_eq "dead-unpushed: reason carries the work-unpushed tag" "yes" "$sd_reason_tag"
case "$(sd_park_reason)" in
  *"$SD_REPO/.claude/worktrees/tactic-dead-unpushed"*) sd_reason_wt="yes" ;;
  *) sd_reason_wt="no" ;;
esac
assert_eq "dead-unpushed: reason names the worktree path" "yes" "$sd_reason_wt"
case "$(sd_park_reason)" in
  *"0aa1-1111"*) sd_reason_sid="yes" ;;
  *) sd_reason_sid="no" ;;
esac
assert_eq "dead-unpushed: reason names the dead winner sid" "yes" "$sd_reason_sid"
case "$(sd_park_reason)" in
  *"the unpushed fix"*) sd_reason_head="yes" ;;
  *) sd_reason_head="no" ;;
esac
assert_eq "dead-unpushed: reason carries the unpushed head summary" "yes" "$sd_reason_head"
case "$(sd_park_recommendation)" in
  *"NEVER 'claude rm'"*) sd_rec_rm="yes" ;;
  *) sd_rec_rm="no" ;;
esac
assert_eq "dead-unpushed: recommendation forbids claude rm" "yes" "$sd_rec_rm"
case "$(sd_park_recommendation)" in
  *"all-held"*) sd_rec_held="yes" ;;
  *) sd_rec_held="no" ;;
esac
assert_eq "dead-unpushed: recommendation states the all-held residual" "yes" "$sd_rec_held"
assert_eq "dead-unpushed: one decision record, disposition=parked" "parked" "$(sd_log_dispositions)"
sd_teardown

# --- Test 3: declared winner dead, worktree in sync → node-held park ---------

echo "Test: a declared winner that is gone with a fully-pushed worktree parks node-held"
sd_setup
sd_write_node "tactic-dead-insync" unparked
sd_commit_nodes
sd_write_worktree "tactic-dead-insync" insync
sd_add_session "0bb2-2222" "tactic-dead-insync"
sd_install_claude 0
standdown_write "tactic-dead-insync" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "dead-insync: sweep returns 0" "0" "$SD_RC"
assert_eq "dead-insync: park-node invoked exactly once" "1" "$(sd_park_calls)"
# The reason string is `<tag>: <prose>`, so anchor on the colon: a bare
# `standdown-winner-dead-node-held*` prefix also matches the no-worktree tag.
case "$(sd_park_reason)" in
  standdown-winner-dead-node-held:*) sd_reason_tag="yes" ;;
  *) sd_reason_tag="no" ;;
esac
assert_eq "dead-insync: reason carries the node-held tag" "yes" "$sd_reason_tag"
sd_teardown

# --- Test 4: an unqueryable daemon parks nothing and keeps the marker --------

echo "Test: an unqueryable daemon observes every marker and parks nothing"
sd_setup
sd_write_node "tactic-unknown-daemon" unparked
sd_commit_nodes
sd_write_worktree "tactic-unknown-daemon" unpushed
sd_add_session "0bb2-2222" "tactic-unknown-daemon"
standdown_write "tactic-unknown-daemon" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_install_claude 1
sd_run
assert_eq "daemon-unknown: sweep returns 0" "0" "$SD_RC"
assert_eq "daemon-unknown: park-node not invoked" "0" "$(sd_park_calls)"
assert_eq "daemon-unknown: the marker is kept" "declared" "$(sd_marker_field tactic-unknown-daemon origin)"
assert_eq "daemon-unknown: stderr reports the unknown liveness" "yes" \
  "$(sd_contains 'observing tactic-unknown-daemon (liveness unknown this pass')"
sd_teardown

# --- Test 5: an observed duplicate pair is recorded --------------------------

echo "Test: two live sessions under one node name are recorded as an observed pair"
sd_setup
sd_write_node "tactic-observed-pair" unparked
sd_commit_nodes
sd_write_worktree "tactic-observed-pair" unpushed
sd_add_session "0aa1-1111" "tactic-observed-pair"
sd_add_session "0bb2-2222" "tactic-observed-pair"
sd_install_claude 0
sd_run
assert_eq "observed-record: sweep returns 0" "0" "$SD_RC"
assert_eq "observed-record: a marker now exists" "yes" \
  "$(standdown_exists tactic-observed-pair && printf 'yes' || printf 'no')"
assert_eq "observed-record: origin is observed" "observed" "$(sd_marker_field tactic-observed-pair origin)"
assert_eq "observed-record: winner is empty" "" "$(sd_marker_field tactic-observed-pair winner)"
assert_eq "observed-record: both sids are recorded" "0aa1-1111,0bb2-2222" \
  "$(sd_marker_field tactic-observed-pair sessions)"
assert_eq "observed-record: park-node not invoked" "0" "$(sd_park_calls)"
assert_eq "observed-record: stderr reports the still-live pair" "yes" \
  "$(sd_contains 'observing-pair tactic-observed-pair (2 live sessions')"
sd_teardown

# --- Test 6: an observed pair that shrank to one idle survivor is parked -----
# The survivor is registered the way the daemon actually registers a HELD
# session — `"status":null` / `"state":"blocked"` — which is also the regression
# guard for the TSV parse: `@tsv` renders that null as an empty middle column,
# and an `IFS=$'\t' read -r sid status name` collapse would drop the row from
# the live-name index, read n_live as 0, and clear the marker instead of parking.

echo "Test: an observed pair shrunk to one idle HELD survivor with unpushed work is parked"
sd_setup
sd_write_node "tactic-shrunk-idle" unparked
sd_commit_nodes
sd_write_worktree "tactic-shrunk-idle" unpushed
sd_add_session "0bb2-2222" "tactic-shrunk-idle" ""
sd_install_claude 0
sd_write_transcript "0bb2-2222" $(( SD_NOW - 1000 ))
standdown_write "tactic-shrunk-idle" observed "" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "shrunk-idle: sweep returns 0" "0" "$SD_RC"
assert_eq "shrunk-idle: park-node invoked exactly once" "1" "$(sd_park_calls)"
case "$(sd_park_reason)" in
  standdown-winner-dead-work-unpushed*) sd_reason_tag="yes" ;;
  *) sd_reason_tag="no" ;;
esac
assert_eq "shrunk-idle: reason carries the work-unpushed tag" "yes" "$sd_reason_tag"
sd_teardown

# --- Test 7: an observed pair whose survivor is busy is left alone -----------

echo "Test: an observed pair shrunk to one BUSY survivor is observed, not parked"
sd_setup
sd_write_node "tactic-shrunk-busy" unparked
sd_commit_nodes
sd_write_worktree "tactic-shrunk-busy" unpushed
sd_add_session "0bb2-2222" "tactic-shrunk-busy"
sd_install_claude 0
sd_write_transcript "0bb2-2222" $(( SD_NOW - 10 ))
standdown_write "tactic-shrunk-busy" observed "" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "shrunk-busy: sweep returns 0" "0" "$SD_RC"
assert_eq "shrunk-busy: park-node not invoked" "0" "$(sd_park_calls)"
assert_eq "shrunk-busy: stderr reports observing" "yes" \
  "$(sd_contains 'observing tactic-shrunk-busy (survivor 0bb2-2222 idle_seconds=10 < grace_seconds=900')"
sd_teardown

# --- Test 7b: a busy survivor is never parked on transcript age alone --------
# The transcript is only appended BETWEEN tool calls, so a session sitting
# inside ONE long call (a `gh run watch` over a slow CI run, a long subagent
# fan-out) reads as arbitrarily idle while being the healthiest possible
# worker. Rule (e)'s second signal — the registry's own `status: busy` — is what
# keeps that from becoming a spurious park of an actively-working session, the
# inverse failure this node's Verification section says to fix in the predicate.

echo "Test: an observed survivor the registry still reports BUSY is not parked however stale its transcript"
sd_setup
sd_write_node "tactic-busy-stale" unparked
sd_commit_nodes
sd_write_worktree "tactic-busy-stale" unpushed
sd_add_session "0bb2-2222" "tactic-busy-stale" busy
sd_install_claude 0
# Ten times the grace: any transcript-only rule would park here.
sd_write_transcript "0bb2-2222" $(( SD_NOW - 9000 ))
standdown_write "tactic-busy-stale" observed "" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "busy-stale: sweep returns 0" "0" "$SD_RC"
assert_eq "busy-stale: park-node not invoked" "0" "$(sd_park_calls)"
assert_eq "busy-stale: stderr reports the busy survivor" "yes" \
  "$(sd_contains 'observing tactic-busy-stale (survivor 0bb2-2222 reports status=busy')"
assert_eq "busy-stale: the marker is kept" "observed" "$(sd_marker_field tactic-busy-stale origin)"
sd_teardown

# --- Test 8: no live session of that name remains → the marker is dropped ----

echo "Test: a marker with zero live sessions of its name is cleared, not parked"
sd_setup
sd_write_node "tactic-nobody-left" unparked
sd_commit_nodes
sd_write_worktree "tactic-nobody-left" unpushed
sd_add_session "0cc3-3333" "tactic-some-other-node"
sd_install_claude 0
standdown_write "tactic-nobody-left" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "no-live: sweep returns 0" "0" "$SD_RC"
assert_eq "no-live: park-node not invoked" "0" "$(sd_park_calls)"
assert_eq "no-live: the marker file is removed" "no" \
  "$(standdown_exists tactic-nobody-left && printf 'yes' || printf 'no')"
assert_eq "no-live: stderr reports the clear" "yes" "$(sd_contains 'cleared-no-live-session tactic-nobody-left')"
assert_eq "no-live: the decision record says cleared" "cleared-no-live-session" "$(sd_log_dispositions)"
sd_teardown

# --- Test 9: an already-parked node is never re-parked -----------------------

echo "Test: an already-parked node is skipped and its marker kept"
sd_setup
sd_write_node "tactic-already-parked" parked
sd_commit_nodes
sd_write_worktree "tactic-already-parked" unpushed
sd_add_session "0bb2-2222" "tactic-already-parked"
sd_install_claude 0
standdown_write "tactic-already-parked" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "already-parked: sweep returns 0" "0" "$SD_RC"
assert_eq "already-parked: park-node not invoked" "0" "$(sd_park_calls)"
assert_eq "already-parked: stderr reports the skip" "yes" "$(sd_contains 'already-parked tactic-already-parked')"
assert_eq "already-parked: the marker is kept" "declared" "$(sd_marker_field tactic-already-parked origin)"
sd_teardown

# --- Test 10: a body-only office_hours line is NOT park state ----------------

echo "Test: a column-0 office_hours line in the node BODY does not read as park state"
sd_setup
sd_write_node "tactic-body-mention" bodymention
sd_commit_nodes
sd_write_worktree "tactic-body-mention" unpushed
sd_add_session "0bb2-2222" "tactic-body-mention"
sd_install_claude 0
standdown_write "tactic-body-mention" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "body-mention: sweep returns 0" "0" "$SD_RC"
assert_eq "body-mention: the node is parked anyway" "1" "$(sd_park_calls)"
assert_eq "body-mention: stderr does not report an already-parked skip" "no" "$(sd_contains 'already-parked')"
sd_teardown

# --- Test 11: the per-sweep park cap defers the excess -----------------------

echo "Test: the park cap bounds parks per sweep and defers the rest"
sd_setup
DISPATCH_STANDDOWN_PARK_MAX=2
for n in one two three four; do
  sd_write_node "tactic-cap-$n" unparked
done
sd_commit_nodes
i=1
for n in one two three four; do
  sd_write_worktree "tactic-cap-$n" unpushed
  sd_add_session "0cab-000$i" "tactic-cap-$n"
  standdown_write "tactic-cap-$n" declared "0dead-000$i" "0dead-000$i,0cab-000$i"
  i=$(( i + 1 ))
done
sd_install_claude 0
sd_run
assert_eq "cap: sweep returns 0" "0" "$SD_RC"
assert_eq "cap: exactly two park-node invocations" "2" "$(sd_park_calls)"
assert_eq "cap: two deferred lines" "2" "$(sd_err_count 'lib-standdown-recheck: deferred ')"
assert_eq "cap: summary counts the deferrals" "yes" \
  "$(sd_contains 'sweep complete (markers=4 recorded=0 parked=2 observing=0 cleared=0 deferred=2)')"
sd_teardown

# --- Test 12: a park-node failure is non-fatal and keeps the marker ----------

echo "Test: a park-node failure is logged, the marker kept, and the sweep still returns 0"
sd_setup
sd_write_park_node 3
sd_write_node "tactic-park-fails" unparked
sd_commit_nodes
sd_write_worktree "tactic-park-fails" unpushed
sd_add_session "0bb2-2222" "tactic-park-fails"
sd_install_claude 0
standdown_write "tactic-park-fails" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "park-fail: sweep returns 0" "0" "$SD_RC"
assert_eq "park-fail: park-node was attempted" "1" "$(sd_park_calls)"
assert_eq "park-fail: stderr reports the failure" "yes" \
  "$(sd_contains 'park failed for tactic-park-fails (park-node exit 3)')"
assert_eq "park-fail: the marker is kept for the next pass" "declared" \
  "$(sd_marker_field tactic-park-fails origin)"
assert_eq "park-fail: the decision record says park-failed" "park-failed" "$(sd_log_dispositions)"
assert_eq "park-fail: summary counts zero parks" "yes" \
  "$(sd_contains 'sweep complete (markers=1 recorded=0 parked=0 observing=0 cleared=0 deferred=0)')"
sd_teardown

# --- Test 12b: park-node exits 0 but nothing landed --------------------------
#
# THE regression test for this sweep's landing confirmation. `park-node` lands
# through `graph-commit`, which pushes to origin/main — and invariant I2 says a
# `graph-commit` exit 0 is NEVER evidence that anything reached origin/main (it
# can exit 0 after a push that never made it). Trusting the exit code here
# would delete the stand-down marker — the only record that this node's winner
# died — while the node stays unparked and invisible to office hours, so the
# stranded work is never picked up by anything again.
#
# The fake park-node's `none` mode is that shape: exit 0, no write. The sweep
# must re-read origin/main via verify-landed, KEEP the marker, refuse to count
# the park, and say so distinctly.

echo "Test: park-node exits 0 but origin/main still shows office_hours: null → marker kept, not counted"
sd_setup
sd_write_park_node 0 none
sd_write_node "tactic-sd-notlanded" unparked
sd_commit_nodes
sd_write_worktree "tactic-sd-notlanded" unpushed
sd_add_session "0bb2-2222" "tactic-sd-notlanded"
sd_install_claude 0
standdown_write "tactic-sd-notlanded" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "sd-notlanded: sweep returns 0" "0" "$SD_RC"
assert_eq "sd-notlanded: park-node was invoked" "1" "$(sd_park_calls)"
assert_eq "sd-notlanded: stderr carries the distinct park-not-landed line" "yes" \
  "$(sd_contains 'park-not-landed for tactic-sd-notlanded — park-node exited 0 but origin/main still shows no office_hours')"
assert_eq "sd-notlanded: it is NOT reported as a park" "no" \
  "$(sd_contains 'parked tactic-sd-notlanded')"
assert_eq "sd-notlanded: the marker is KEPT for the next pass" "declared" \
  "$(sd_marker_field tactic-sd-notlanded origin)"
assert_eq "sd-notlanded: the decision record says park-not-landed" "park-not-landed" \
  "$(sd_log_dispositions)"
assert_eq "sd-notlanded: summary counts zero parks" "yes" \
  "$(sd_contains 'sweep complete (markers=1 recorded=0 parked=0 observing=0 cleared=0 deferred=0)')"
sd_teardown

# --- Test 13: the sweep always returns 0, with exactly one summary line ------
# Three independent degenerate environments: an absent ledger dir, an
# unresolvable repo root, and a failing daemon.

echo "Test: an absent ledger dir still returns 0 with exactly one summary line"
sd_setup
DISPATCH_STANDDOWN_DIR="$SD_DIR/no-such-ledger"
sd_write_node "tactic-zero-a" unparked
sd_commit_nodes
sd_install_claude 0
sd_run
assert_eq "always-zero/no-ledger: sweep returns 0" "0" "$SD_RC"
assert_eq "always-zero/no-ledger: exactly one summary line" "1" "$(sd_err_count 'sweep complete')"
sd_teardown

echo "Test: an unresolvable repo root still returns 0 with exactly one summary line"
sd_setup
sd_write_node "tactic-zero-b" unparked
sd_commit_nodes
sd_add_session "0bb2-2222" "tactic-zero-b"
sd_install_claude 0
standdown_write "tactic-zero-b" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
unset DISPATCH_STANDDOWN_REPO_ROOT
# resolve_project_root walks up from the cwd, so run from a scratch dir with a
# GIT_CEILING_DIRECTORIES fence that stops the walk before any enclosing repo.
mkdir -p "$SD_DIR/nonrepo/sub"
if ( cd "$SD_DIR/nonrepo/sub" && GIT_CEILING_DIRECTORIES="$SD_DIR/nonrepo" standdown_recheck_sweep ) 2>"$SD_DIR/err"; then
  SD_RC=0
else
  SD_RC=$?
fi
SD_ERR=$(cat "$SD_DIR/err")
assert_eq "always-zero/no-root: sweep returns 0" "0" "$SD_RC"
assert_eq "always-zero/no-root: stderr reports the unresolvable root" "yes" \
  "$(sd_contains 'repo root unresolvable; parking nothing')"
assert_eq "always-zero/no-root: exactly one summary line" "1" "$(sd_err_count 'sweep complete')"
assert_eq "always-zero/no-root: park-node not invoked" "0" "$(sd_park_calls)"
sd_teardown

echo "Test: a failing daemon still returns 0 with exactly one summary line"
sd_setup
sd_write_node "tactic-zero-c" unparked
sd_commit_nodes
sd_add_session "0bb2-2222" "tactic-zero-c"
standdown_write "tactic-zero-c" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_install_claude 1
sd_run
assert_eq "always-zero/daemon-fail: sweep returns 0" "0" "$SD_RC"
assert_eq "always-zero/daemon-fail: exactly one summary line" "1" "$(sd_err_count 'sweep complete')"
assert_eq "always-zero/daemon-fail: park-node not invoked" "0" "$(sd_park_calls)"
sd_teardown

# --- Test 14: an unsafe marker name is never used to build a path ------------

echo "Test: a marker whose name fails the node-id regex is kept and skipped"
sd_setup
sd_write_node "tactic-valid" unparked
sd_commit_nodes
sd_add_session "0bb2-2222" "tactic-Bad_Id"
sd_install_claude 0
# Written directly: standdown_write's own guard rejects separators, but an
# uppercase/underscore name is path-safe yet not a node id — the sweep's rule
# (a) is what catches it.
printf 'origin=declared\nwinner=0aa1-1111\nsessions=0aa1-1111,0bb2-2222\nobserved=%s\n' "$SD_NOW" \
  > "$SD_LEDGER/tactic-Bad_Id"
sd_run
assert_eq "unsafe-id: sweep returns 0" "0" "$SD_RC"
assert_eq "unsafe-id: park-node not invoked" "0" "$(sd_park_calls)"
assert_eq "unsafe-id: stderr reports the unsafe id" "yes" "$(sd_contains 'unsafe-id tactic-Bad_Id')"
assert_eq "unsafe-id: the marker is kept" "declared" "$(sd_marker_field tactic-Bad_Id origin)"
sd_teardown

# --- Test 15: a node with no worktree is PARKED, never cleared ---------------

# Rule (d) has already returned on n_live == 0, so a marker that reaches the
# no-worktree check is still held by a live session. Clearing it there erased
# the only durable record of the stand-down; it now selects the
# no-unpushed-work reason variant of the (h)/(i) park instead.
echo "Test: a marker whose node has no worktree parks node-held-no-worktree"
sd_setup
sd_write_node "tactic-no-worktree" unparked
sd_commit_nodes
sd_add_session "0bb2-2222" "tactic-no-worktree"
sd_install_claude 0
standdown_write "tactic-no-worktree" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "no-worktree: sweep returns 0" "0" "$SD_RC"
assert_eq "no-worktree: park-node invoked exactly once" "1" "$(sd_park_calls)"
assert_eq "no-worktree: the marker file is kept" "yes" \
  "$(standdown_exists tactic-no-worktree && printf 'yes' || printf 'no')"
case "$(sd_park_reason)" in
  standdown-winner-dead-node-held-no-worktree:*) sd_reason_tag="yes" ;;
  *) sd_reason_tag="no" ;;
esac
assert_eq "no-worktree: reason carries the no-worktree tag" "yes" "$sd_reason_tag"
assert_eq "no-worktree: the reason makes no unpushed-work claim" "no" \
  "$(case "$(sd_park_reason)" in *UNPUSHED*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "no-worktree: the recommendation omits the push-from-there instruction" "no" \
  "$(case "$(sd_park_recommendation)" in *'push them from there FIRST'*) printf 'yes' ;; *) printf 'no' ;; esac)"
# No clear of ANY kind is reported. Asserted on the `cleared-` disposition
# prefix rather than on the retired tag's literal spelling, which the plan's
# contract fence requires to be absent from this file; the summary line spells
# its counter `cleared=`, so it is not matched here.
assert_eq "no-worktree: stderr reports no clear disposition" "no" "$(sd_contains 'cleared-')"
assert_eq "no-worktree: the sweep summary counts zero clears" "yes" "$(sd_contains 'cleared=0')"
assert_eq "no-worktree: one decision record, disposition=parked" "parked" "$(sd_log_dispositions)"
sd_teardown

# --- Test 15c: no worktree, but the BRANCH survived --------------------------

# The regression lock for the no-worktree arm's safety claim. That arm used to
# assert "NO work can be unpushed", and recommend "do NOT create one", from
# `[[ -d "$wt" ]]` failing and nothing else. A missing checkout does not prove a
# missing branch: `git worktree remove` leaves refs/heads/<node> carrying its
# commits, and provision-node-worktree re-attaches that same branch rather than
# recutting it. The park record is the durable artifact an operator acts on, so
# the old text actively told them not to look at the one place the work was.
#
# Every other fixture in this file either has a worktree, or has no branch
# either — the case that decides the two apart was the one nobody wrote.
echo "Test: no worktree but a surviving branch reports the work at risk"
sd_setup
sd_write_node "tactic-orphan-branch" unparked
sd_commit_nodes
sd_write_orphan_branch "tactic-orphan-branch"
sd_add_session "0bb2-2222" "tactic-orphan-branch"
sd_install_claude 0
standdown_write "tactic-orphan-branch" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "orphan-branch: sweep returns 0" "0" "$SD_RC"
assert_eq "orphan-branch: park-node invoked exactly once" "1" "$(sd_park_calls)"
assert_eq "orphan-branch: the reason reports the surviving branch and its count" "yes" \
  "$(case "$(sd_park_reason)" in *'survived the missing checkout and still carries 1 commit(s)'*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "orphan-branch: the reason does NOT claim nothing survives" "no" \
  "$(case "$(sd_park_reason)" in *'no unpushed work survives'*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "orphan-branch: the recommendation drops 'do NOT create one'" "no" \
  "$(case "$(sd_park_recommendation)" in *'do NOT create one'*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "orphan-branch: the recommendation names the recut command" "yes" \
  "$(case "$(sd_park_recommendation)" in *'worktree add'*) printf 'yes' ;; *) printf 'no' ;; esac)"
# The torn-removal case this arm exists for leaves the registration under
# .git/worktrees/ behind, and `worktree add` refuses while it is there — so a
# recut instruction without the prune is one an operator cannot follow.
assert_eq "orphan-branch: the recut command prunes the stale registration first" "yes" \
  "$(case "$(sd_park_recommendation)" in *'worktree prune &&'*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "orphan-branch: the decision record encodes unpushed as true" "true" "$(sd_log_unpushed)"
assert_eq "orphan-branch: one decision record, disposition=parked" "parked" "$(sd_log_dispositions)"
sd_teardown

# --- Test 15d: no worktree AND no branch stays determinate -------------------

# The other half of the pair, so the fix above cannot be "call everything
# unknown". With neither checkout nor branch there really is nothing to strand,
# and the arm must still say so plainly rather than hedging.
echo "Test: no worktree and no branch reports no surviving work, not unknown"
sd_setup
sd_write_node "tactic-no-branch-either" unparked
sd_commit_nodes
sd_add_session "0bb2-2222" "tactic-no-branch-either"
sd_install_claude 0
standdown_write "tactic-no-branch-either" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "no-branch-either: park-node invoked exactly once" "1" "$(sd_park_calls)"
assert_eq "no-branch-either: the reason says no branch exists either" "yes" \
  "$(case "$(sd_park_reason)" in *'No branch refs/heads/tactic-no-branch-either exists either'*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "no-branch-either: the verdict is not hedged as UNKNOWN" "no" \
  "$(case "$(sd_park_reason)" in *UNKNOWN*) printf 'yes' ;; *) printf 'no' ;; esac)"
sd_teardown

# --- Test 15b: the clear path was NARROWED, not removed ----------------------

# Same missing-worktree fixture, but with zero live sessions under the node
# name: rule (d) still owns the one legitimate release. The session under a
# DIFFERENT name is required — a fully empty registry is UNKNOWN to the
# uncorroborated-empty guard and would park nothing.
echo "Test: no worktree AND nobody left still clears via rule (d)"
sd_setup
sd_write_node "tactic-no-worktree-nobody-left" unparked
sd_commit_nodes
sd_add_session "0cc3-3333" "tactic-some-other-node"
sd_install_claude 0
standdown_write "tactic-no-worktree-nobody-left" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "no-worktree-nobody-left: sweep returns 0" "0" "$SD_RC"
assert_eq "no-worktree-nobody-left: park-node not invoked" "0" "$(sd_park_calls)"
assert_eq "no-worktree-nobody-left: the marker file is removed" "no" \
  "$(standdown_exists tactic-no-worktree-nobody-left && printf 'yes' || printf 'no')"
assert_eq "no-worktree-nobody-left: stderr reports the clear" "yes" \
  "$(sd_contains 'cleared-no-live-session tactic-no-worktree-nobody-left')"
sd_teardown

# --- Test 15e: the motivating strategy-lane scenario, end to end -------------

# The strategy lane spawns with --cwd "$PROJECT_ROOT" and never pre-provisions
# a worktree, so this is the worst case the fix exists for. The branch reads no
# `kind:` field at all — the same park must fire kind-agnostically.
echo "Test: a strategy node with no worktree parks node-held-no-worktree"
sd_setup
sd_write_node "strategy-no-worktree" unparked strategy
sd_commit_nodes
sd_add_session "0bb2-2222" "strategy-no-worktree"
sd_install_claude 0
standdown_write "strategy-no-worktree" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "strategy-no-worktree: sweep returns 0" "0" "$SD_RC"
assert_eq "strategy-no-worktree: park-node invoked exactly once" "1" "$(sd_park_calls)"
assert_eq "strategy-no-worktree: the marker file is kept" "yes" \
  "$(standdown_exists strategy-no-worktree && printf 'yes' || printf 'no')"
case "$(sd_park_reason)" in
  standdown-winner-dead-node-held-no-worktree:*) sd_reason_tag="yes" ;;
  *) sd_reason_tag="no" ;;
esac
assert_eq "strategy-no-worktree: reason carries the no-worktree tag" "yes" "$sd_reason_tag"
assert_eq "strategy-no-worktree: one decision record, disposition=parked" "parked" "$(sd_log_dispositions)"
sd_teardown

# --- Test 15f: the branch-absent arm scopes its claim to the node id ---------

# Round 2's finding on the round-1 fix. The arm probes refs/heads/<node> and
# nothing else, then reported an UNSCOPED all-clear and told the operator "do
# NOT create one". Native EnterWorktree lets a session claim its checkout under
# any name, and on this host every worktree in fact uses one (agent-<hash> or a
# slug), so the branch carrying the work is routinely NOT the one probed. The
# verdict stays false -- that is what was measured -- but the prose must report
# what was measured and name the gap rather than paper over it.
echo "Test: the no-branch arm scopes its all-clear to the node id"
sd_setup
sd_write_node "tactic-scoped-allclear" unparked
sd_commit_nodes
sd_add_session "0bb2-2222" "tactic-scoped-allclear"
sd_install_claude 0
standdown_write "tactic-scoped-allclear" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "scoped-allclear: park-node invoked exactly once" "1" "$(sd_park_calls)"
assert_eq "scoped-allclear: the reason scopes the all-clear to the node id" "yes" \
  "$(case "$(sd_park_reason)" in *'under the node id'*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "scoped-allclear: the reason names the other-name gap" "yes" \
  "$(case "$(sd_park_reason)" in *'claimed its checkout under a different name'*) printf 'yes' ;; *) printf 'no' ;; esac)"
# The recommendation used to assert a merge measurement in the very arm where
# no branch existed to measure -- reporting a measurement never taken.
assert_eq "scoped-allclear: the recommendation claims no merge measurement" "no" \
  "$(case "$(sd_park_recommendation)" in *'fully merged into origin/main'*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "scoped-allclear: the recommendation names the other-name branch hunt" "yes" \
  "$(case "$(sd_park_recommendation)" in *'branch --no-merged origin/main'*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "scoped-allclear: the decision record encodes unpushed as false" "false" "$(sd_log_unpushed)"
sd_teardown

# --- Test 15h: an unmeasurable branch is UNKNOWN, and says so in the log -----

# The third state. refs/heads/<node> exists and `rev-parse --verify` accepts it
# (MEASURED: a ref holding a well-formed sha that is not a reachable object
# exits 0), but `rev-list --count` cannot walk it, so no ahead-count is
# available. Reporting that as "false" would tell an operator nothing is at risk
# on the strength of a measurement that never succeeded.
#
# It also pins the decision-log encoding: `unknown` used to serialize to null,
# byte-identical to a disposition where the question never arose -- collapsing
# "we asked and could not answer" into "we never asked", in the durable record.
echo "Test: an unmeasurable branch reports UNKNOWN, distinct from null in the log"
sd_setup
sd_write_node "tactic-unmeasurable-branch" unparked
sd_commit_nodes
sd_write_ghost_branch "tactic-unmeasurable-branch"
sd_add_session "0bb2-2222" "tactic-unmeasurable-branch"
sd_install_claude 0
standdown_write "tactic-unmeasurable-branch" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "unmeasurable: park-node invoked exactly once" "1" "$(sd_park_calls)"
assert_eq "unmeasurable: the reason reports UNKNOWN" "yes" \
  "$(case "$(sd_park_reason)" in *UNKNOWN*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "unmeasurable: the reason does NOT claim nothing survives" "no" \
  "$(case "$(sd_park_reason)" in *'no unpushed work survives'*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "unmeasurable: the recommendation refuses the all-clear" "yes" \
  "$(case "$(sd_park_recommendation)" in *'do NOT assume nothing is at risk'*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "unmeasurable: the log distinguishes unknown from null" '"unknown"' "$(sd_log_unpushed)"
sd_teardown

# --- Test 15i: a squash-merged branch is NOT stranded work -------------------

# Round 3's first finding. The arm measured `rev-list --count origin/main..`,
# which counts 1 for a squash-merged branch even though its tree already landed.
# Post-merge-with-worktree-reaped is the NORMAL end state here, so the common
# case produced a park saying "That work is at risk", recording unpushed=true,
# and telling the operator to recut the checkout and "push it FIRST" —
# resurrecting an already-landed branch. Rule (h) five lines below avoids exactly
# this with worktree_merged_in_sync's tree-identity fallback
# (lib-worktree-in-sync.sh:103, added for #1845); this arm had no equivalent.
echo "Test: a squash-merged branch with no worktree is not reported as work at risk"
sd_setup
sd_write_node "tactic-squashed-branch" unparked
sd_commit_nodes
sd_write_squashed_branch "tactic-squashed-branch"
sd_add_session "0bb2-2222" "tactic-squashed-branch"
sd_install_claude 0
standdown_write "tactic-squashed-branch" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "squashed-branch: park-node invoked exactly once" "1" "$(sd_park_calls)"
assert_eq "squashed-branch: the reason does NOT claim the work is at risk" "no" \
  "$(case "$(sd_park_reason)" in *'That work is at risk'*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "squashed-branch: the reason names the tree-identity verdict" "yes" \
  "$(case "$(sd_park_reason)" in *'tree is IDENTICAL to origin/main'*) printf 'yes' ;; *) printf 'no' ;; esac)"
# The operative half: a recut instruction here sends the operator to push
# commits that are already on main.
assert_eq "squashed-branch: the recommendation does NOT tell the operator to recut" "no" \
  "$(case "$(sd_park_recommendation)" in *'worktree add'*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "squashed-branch: the recommendation does NOT tell the operator to push" "no" \
  "$(case "$(sd_park_recommendation)" in *'push it FIRST'*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "squashed-branch: the decision record encodes unpushed as false" "false" "$(sd_log_unpushed)"
sd_teardown

# --- Test 15j: a branch already on its own remote is not unpushed ------------

# Round 3's third finding. `origin/main..` answers "is it unmerged", not "is it
# unpushed". worktree_in_sync (lib-worktree-in-sync.sh:62) calls this exact state
# in sync via `rev-list --count HEAD --not --remotes`, so the two arms produced
# contradictory park records depending only on whether the checkout survived.
echo "Test: a branch already pushed to its own remote ref is not unpushed"
sd_setup
sd_write_node "tactic-pushed-branch" unparked
sd_commit_nodes
sd_write_pushed_branch "tactic-pushed-branch"
sd_add_session "0bb2-2222" "tactic-pushed-branch"
sd_install_claude 0
standdown_write "tactic-pushed-branch" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "pushed-branch: park-node invoked exactly once" "1" "$(sd_park_calls)"
assert_eq "pushed-branch: the reason does NOT claim the work is at risk" "no" \
  "$(case "$(sd_park_reason)" in *'That work is at risk'*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "pushed-branch: the reason names the remote-reachability verdict" "yes" \
  "$(case "$(sd_park_reason)" in *'fully reachable from a remote ref'*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "pushed-branch: the decision record encodes unpushed as false" "false" "$(sd_log_unpushed)"
sd_teardown

# --- Test 15k: a BROKEN ref is UNKNOWN, not "no branch exists" ---------------

# Round 3's second finding. `2>&1` discarded the only discriminator between an
# absent ref and a torn one — both exit 1. A torn ref write (which this repo
# already expects from torn sandboxed worktree removals) therefore produced
# unpushed=false and "there is nothing to recut ... do NOT create one", while the
# commits were still recoverable from .git/logs/refs/heads/<node>.
echo "Test: a broken ref reports UNKNOWN and points at the reflog, not an all-clear"
sd_setup
sd_write_node "tactic-broken-ref" unparked
sd_commit_nodes
sd_write_broken_branch "tactic-broken-ref"
sd_add_session "0bb2-2222" "tactic-broken-ref"
sd_install_claude 0
standdown_write "tactic-broken-ref" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "broken-ref: park-node invoked exactly once" "1" "$(sd_park_calls)"
assert_eq "broken-ref: the reason reports UNKNOWN" "yes" \
  "$(case "$(sd_park_reason)" in *UNKNOWN*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "broken-ref: the reason does NOT claim no branch exists" "no" \
  "$(case "$(sd_park_reason)" in *'No branch refs/heads/tactic-broken-ref exists'*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "broken-ref: the recommendation refuses the all-clear" "no" \
  "$(case "$(sd_park_recommendation)" in *'do NOT create one'*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "broken-ref: the recommendation points at the reflog" "yes" \
  "$(case "$(sd_park_recommendation)" in *'logs/refs/heads/tactic-broken-ref'*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "broken-ref: the log distinguishes unknown from null" '"unknown"' "$(sd_log_unpushed)"
sd_teardown

# --- Test 16: a name with no node file on origin/main is kept, not parked ----

echo "Test: a marker naming something that is not a graph node is kept"
sd_setup
sd_write_node "tactic-real" unparked
sd_commit_nodes
sd_write_worktree "tactic-not-a-node" unpushed
sd_add_session "0bb2-2222" "tactic-not-a-node"
sd_install_claude 0
standdown_write "tactic-not-a-node" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
sd_run
assert_eq "not-a-node: sweep returns 0" "0" "$SD_RC"
assert_eq "not-a-node: park-node not invoked" "0" "$(sd_park_calls)"
assert_eq "not-a-node: stderr reports it" "yes" "$(sd_contains 'not-a-node tactic-not-a-node')"
assert_eq "not-a-node: the marker is kept" "declared" "$(sd_marker_field tactic-not-a-node origin)"
sd_teardown

# --- Test 17: an uncorroborated empty registry read is the SAME unknown branch
# as Test 4's outright-failing daemon (tactic-graph-router-live-worker-live-
# worker-read-robust). `claude agents --json --all` can exit 0 and print
# exactly `[]` on a blocked read (sandbox / network-namespace isolation) —
# byte-identical to a genuine empty registry. `claude_session_id_is_live`
# (lib-claude-agents.sh) only trusts that `[]` when a `claude daemon` process
# corroborates it; here the probe reports unreachable, so the winner's
# liveness must fold to "unknown" (winner treated as live) — the sweep must
# observe and park nothing, exactly like Test 4, never read the empty array as
# "winner absent" and hand the worktree to a peer.

echo "Test: an uncorroborated empty registry read observes every marker and parks nothing"
sd_setup
sd_write_node "tactic-uncorroborated-empty" unparked
sd_commit_nodes
sd_write_worktree "tactic-uncorroborated-empty" unpushed
# No sd_add_session calls: SD_ENTRIES stays empty, so sd_install_claude emits
# exactly `[]` — the ambiguous payload — at exit 0.
sd_install_claude 0
standdown_write "tactic-uncorroborated-empty" declared "0aa1-1111" "0aa1-1111,0bb2-2222"
# This file's own sd_setup/sd_teardown do not stub CLAUDE_AGENTS_PGREP_CMD (it
# is unset by default here) — set an unreachable probe explicitly so this
# ambiguous-`[]` case is deterministic rather than depending on whether the
# HOST happens to be running a `claude daemon` process.
CLAUDE_AGENTS_PGREP_CMD="$SD_DIR/pgrep-unreachable"
cat > "$CLAUDE_AGENTS_PGREP_CMD" <<'STUB'
#!/usr/bin/env bash
exit 1
STUB
chmod +x "$CLAUDE_AGENTS_PGREP_CMD"
sd_run
unset CLAUDE_AGENTS_PGREP_CMD
assert_eq "uncorroborated-empty: sweep returns 0" "0" "$SD_RC"
assert_eq "uncorroborated-empty: park-node not invoked" "0" "$(sd_park_calls)"
assert_eq "uncorroborated-empty: the marker is kept" "declared" \
  "$(sd_marker_field tactic-uncorroborated-empty origin)"
assert_eq "uncorroborated-empty: stderr reports the unknown liveness" "yes" \
  "$(sd_contains 'observing tactic-uncorroborated-empty (liveness unknown this pass')"
sd_teardown

report_results
