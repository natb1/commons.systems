#!/usr/bin/env bash
# Tests for dispatch-select-tick -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 19704-21046.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-select-tick tests (#919)
# ============================================================================
# The orchestrator runs against the REAL dispatch-acquire-lock (so lock-file
# state is genuine and the three-guard lock invariant is asserted directly via
# DISPATCH_LOCK_FILE) and against FAKE sub-scripts for jit-engine / resolve-arg
# / select-target (so each decision line is driven deterministically). git is
# PATH-shimmed to control the branch and the main-sync result.
echo ""
echo "=== dispatch-select-tick ==="

sel_tick_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$STUB_DIR" "$TMPDIR_TEST/bin" "$TMPDIR_TEST/logs"

  cp "$SCRIPT_DIR/dispatch-select-tick" "$TMPDIR_TEST/dispatch-select-tick"
  cp "$SCRIPT_DIR/dispatch-acquire-lock" "$TMPDIR_TEST/dispatch-acquire-lock"
  # dispatch-acquire-lock sources lib.sh via its SCRIPT_DIR, which resolves to
  # TMPDIR_TEST for this copy — so lib.sh must sit alongside it. Sourced, not
  # executed — no chmod +x.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/lib.sh"
  # dispatch-select-tick's autonomous (no-arg) path sources the REAL
  # lib-reservation-ledger.sh via its SCRIPT_DIR (= TMPDIR_TEST), so the real
  # library must sit alongside it. It in turn sources lib-claude-agents.sh — the
  # FAKE copy written below — so the sweep's liveness query is driven by the
  # SEL_AGENTS_* env vars rather than a real daemon. Sourced, not executed.
  cp "$SCRIPT_DIR/lib-reservation-ledger.sh" "$TMPDIR_TEST/lib-reservation-ledger.sh"
  # dispatch-select-tick sources lib-decision-log.sh via its SCRIPT_DIR (=
  # TMPDIR_TEST) to emit a structured per-tick record (#2038). Stage the real lib
  # so decision_log_append is defined and the EXIT trap actually writes the log.
  cp "$SCRIPT_DIR/lib-decision-log.sh" "$TMPDIR_TEST/lib-decision-log.sh"
  # dispatch-select-tick Step 1d calls dispatch-reconcile-ready from its own
  # SCRIPT_DIR (= TMPDIR_TEST). Copy the real script so the wiring test can
  # assert reconcile-produced `ready:` lines appear in the tick output.
  cp "$SCRIPT_DIR/dispatch-reconcile-ready" "$TMPDIR_TEST/dispatch-reconcile-ready"
  # dispatch-select-tick's Decision A sources lib-standdown-recheck.sh via its
  # SCRIPT_DIR (= TMPDIR_TEST) for _standdown_session_idle_s, the transcript-mtime
  # idle probe that bounds the main-checkout defer. Stage the REAL lib (its idle
  # math is under test) plus the sibling it sources that is not already staged
  # (lib-worktree-in-sync.sh; lib.sh / lib-claude-agents.sh / lib-decision-log.sh
  # are). A test drives idle age by writing a transcript under
  # DISPATCH_STANDDOWN_PROJECTS_ROOT with a chosen mtime — see sel_tick_transcript.
  cp "$SCRIPT_DIR/lib-standdown-recheck.sh" "$TMPDIR_TEST/lib-standdown-recheck.sh"
  cp "$SCRIPT_DIR/lib-worktree-in-sync.sh" "$TMPDIR_TEST/lib-worktree-in-sync.sh"
  chmod +x "$TMPDIR_TEST/dispatch-select-tick" "$TMPDIR_TEST/dispatch-acquire-lock" \
           "$TMPDIR_TEST/dispatch-reconcile-ready"
  # Transcript store the idle probe reads; empty by default, so a session with no
  # staged transcript reads as UNKNOWN idle (the fail-safe defer case).
  export DISPATCH_STANDDOWN_PROJECTS_ROOT="$TMPDIR_TEST/projects"
  mkdir -p "$DISPATCH_STANDDOWN_PROJECTS_ROOT/proj"

  export DISPATCH_LOCK_FILE="$STUB_DIR/dispatch.lock"
  # #1495: sync-repair attempt-counter file override (consumed by lib.sh's
  # sync_repair_* helpers, sourced by dispatch-select-tick's main-branch Step 1).
  export DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE="$STUB_DIR/sync-repair-attempts"
  export CLAUDE_CODE_SESSION_ID="select-tick-session"
  # Fake `claude agents --json`: our own session is live → first acquisition
  # succeeds and a strict self-release works.
  cat > "$TMPDIR_TEST/fake-claude" <<'FAKE'
#!/usr/bin/env bash
echo '[{"sessionId":"select-tick-session","pid":1,"status":"busy","name":"x","cwd":""}]'
FAKE
  chmod +x "$TMPDIR_TEST/fake-claude"
  export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/fake-claude"
  # Single-shot --wait so a busy test never blocks the suite.
  export DISPATCH_LOCK_WAIT_TIMEOUT=0
  export DISPATCH_LOCK_WAIT_INTERVAL=1
  # #1495: the git stub logs each `merge --ff-only origin/main` here so the
  # sync-repair defer test can assert the merge was NOT attempted (log absent).
  export SEL_GIT_MERGE_LOG="$STUB_DIR/git-merge.log"

  # Default fake sub-scripts (overridable per test) — land in TMPDIR_TEST so the
  # orchestrator's SCRIPT_DIR resolution finds them.
  cat > "$TMPDIR_TEST/dispatch-jit-engine" <<'FAKE'
#!/usr/bin/env bash
exit 0
FAKE
  # Fake graph selector (tactic-graph-router-selector). The Step-3a graph-first
  # query and the at-cap pace-exempt probe are logged separately so a test can
  # assert which lane ran. Default `empty` keeps every legacy tick test
  # byte-identical; a test sets SEL_GRAPH_TARGET (node lines for the normal
  # query) or SEL_GRAPH_PACE_EXEMPT (node lines for the --pace-exempt-only
  # probe) to drive a graph selection.
  cat > "$TMPDIR_TEST/graph-select-target" <<FAKE
#!/usr/bin/env bash
if [[ " \$* " == *" --pace-exempt-only "* ]]; then
  echo "\$*" >> "$TMPDIR_TEST/logs/graph-select-pace-exempt.log"
  printf '%s\n' "\${SEL_GRAPH_PACE_EXEMPT:-empty}"
  exit 0
fi
echo "\$*" >> "$TMPDIR_TEST/logs/graph-select.log"
printf '%s\n' "\${SEL_GRAPH_TARGET:-empty}"
FAKE
  chmod +x "$TMPDIR_TEST/graph-select-target"
  # Fake repo-health sensor (tactic-dispatch-legacy-rewire): the graph-native
  # successor to the legacy select-target health probes. Arg-aware:
  #   --main-broken-sha        prints SEL_MAIN_BROKEN_SHA (default empty → green);
  #                            a non-empty value models a red main.
  #   --sync-broken-latched    prints `latched` iff SEL_SYNC_BROKEN_LATCHED=latched
  #                            (default: nothing → not latched).
  #   --set-sync-broken ...    logs the call (repo-health-set-sync-broken.log).
  #   --clear-sync-broken      logs the call (repo-health-clear-sync-broken.log).
  # Each mode logs to its own file so a test can assert which ran.
  cat > "$TMPDIR_TEST/repo-health" <<FAKE
#!/usr/bin/env bash
case "\$1" in
  --main-broken-sha)     printf '%s\n' "\${SEL_MAIN_BROKEN_SHA:-}" ;;
  --sync-broken-latched) printf '%s\n' "\${SEL_SYNC_BROKEN_LATCHED:-}" ;;
  --set-sync-broken)     echo "\$*" >> "$TMPDIR_TEST/logs/repo-health-set-sync-broken.log" ;;
  --clear-sync-broken)   echo called >> "$TMPDIR_TEST/logs/repo-health-clear-sync-broken.log" ;;
  *)                     : ;;
esac
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/repo-health"
  # Fake graph-native main-red-node sync (tactic-graph-main-self-heal): prints
  # SEL_MAIN_RED_NODES (default empty → no open latch node, i.e. main healthy)
  # one id per line, so a test can drive the OPEN_MAIN_RED gate. Logs its
  # invocation so a wiring test can assert it ran.
  cat > "$TMPDIR_TEST/dispatch-graph-main-red-sync" <<FAKE
#!/usr/bin/env bash
echo called >> "$TMPDIR_TEST/logs/graph-main-red-sync.log"
[[ -n "\${SEL_MAIN_RED_NODES:-}" ]] && printf '%s\n' "\${SEL_MAIN_RED_NODES}"
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/dispatch-graph-main-red-sync"
  # Fake dispatch-jit-scan (Step 3b aux trigger — the JIT-reminder lane the
  # deleted legacy selector used to emit from its default mode). Emits
  # SEL_JIT_SCAN (default empty → no reminder due) so a test can drive the
  # jit-reminder decision line.
  cat > "$TMPDIR_TEST/dispatch-jit-scan" <<FAKE
#!/usr/bin/env bash
printf '%s' "\${SEL_JIT_SCAN:-}"
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/dispatch-jit-scan"
  # Silent no-op fakes for the best-effort Step 1d/2 sub-scripts the new
  # select-tick invokes (post-merge reconciliation, graph-merge absorption, the
  # standing census duty, the Calendar JIT importer, and the statements scan).
  # Each emits SEL_<NAME>_OUT (default empty) so a wiring test can drive its
  # prefixed passthrough line; silent by default so every other tick test is
  # byte-identical.
  for _hs in dispatch-reconcile-merged:SEL_RECONCILE_MERGED_OUT \
             reconcile-graph-merged:SEL_RECONCILE_GRAPH_OUT \
             reconcile-graph-review-stall:SEL_REVIEW_STALL_OUT \
             dispatch-graph-census:SEL_CENSUS_OUT \
             dispatch-jit-calendar-import:SEL_CALENDAR_OUT \
             dispatch-statements-scan:SEL_STATEMENTS_OUT; do
    _hname="${_hs%%:*}"; _hvar="${_hs#*:}"
    cat > "$TMPDIR_TEST/$_hname" <<FAKE
#!/usr/bin/env bash
# Record the two tick-scoped cache dirs this fake INHERITED, and whether each
# existed at invocation time. That is the only vantage point from which the
# node cache's arming (DISPATCH_GRAPH_NODE_CACHE, Step 0) is observable: the
# tick's EXIT trap has removed both by the time the caller sees stdout.
_gc="\${DISPATCH_GRAPH_NODE_CACHE:-}"; _vc="\${DISPATCH_CI_VERDICT_CACHE:-}"
_gd=nodir; [[ -n "\$_gc" && -d "\$_gc" ]] && _gd=dir
_vd=nodir; [[ -n "\$_vc" && -d "\$_vc" ]] && _vd=dir
printf '%s\t%s\t%s\t%s\n' "\${_gc:-<unset>}" "\$_gd" "\${_vc:-<unset>}" "\$_vd" \
  >> "$TMPDIR_TEST/logs/cache-env.log"
[[ -n "\${$_hvar:-}" ]] && printf '%s\n' "\${$_hvar}"
exit 0
FAKE
    chmod +x "$TMPDIR_TEST/$_hname"
  done
  # Run-scoped concurrency gate fakes (overridable per test via SEL_* env vars).
  # Arg-aware: --exhausted reports the rate-limit exhaustion floor (SEL_EXHAUSTED,
  # default ok); the no-arg query returns the worker target (SEL_TARGET_N).
  cat > "$TMPDIR_TEST/dispatch-target-workers" <<'FAKE'
#!/usr/bin/env bash
if [[ "$1" == "--exhausted" ]]; then
  echo "${SEL_EXHAUSTED:-ok}"
  exit 0
fi
if [[ "$1" == "--max" ]]; then
  echo "${SEL_MAX_WORKERS:-8}"
  exit 0
fi
echo "${SEL_TARGET_N:-1}"
FAKE
  cat > "$TMPDIR_TEST/dispatch-schedule-reseed" <<FAKE
#!/usr/bin/env bash
echo called >> "$TMPDIR_TEST/logs/schedule-reseed.log"
exit 0
FAKE
  cat > "$TMPDIR_TEST/dispatch-schedule-target-reseed" <<FAKE
#!/usr/bin/env bash
echo "\$1" >> "$TMPDIR_TEST/logs/schedule-target-reseed.log"
exit 0
FAKE
  # #1495: fake dispatch-escalate-sync-broken — records its invocation and
  # captures its stdin (the merge stderr) so the at-cap escalation test can
  # assert it ran. Invoked by dispatch-select-tick via its SCRIPT_DIR (= TMPDIR_TEST).
  cat > "$TMPDIR_TEST/dispatch-escalate-sync-broken" <<FAKE
#!/usr/bin/env bash
printf '%s\n' "\$*" >> "$TMPDIR_TEST/logs/escalate-args.log"
cat >> "$TMPDIR_TEST/logs/escalate-stdin.log"
echo called >> "$TMPDIR_TEST/logs/escalate-sync-broken.log"
exit 0
FAKE
  # #1540: fake dispatch-auto-merge invoked by Step 1d (cont.) when main is not
  # broken. Logs its invocation and emits a configurable merge line so a wiring
  # test can assert the tick prefixes it with `merge: `. The real merge logic has
  # its own unit tests above; here we only verify the tick wiring.
  cat > "$TMPDIR_TEST/dispatch-auto-merge" <<'FAKE'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/stub" && pwd)"
echo called >> "$STUB_DIR/auto-merge-calls.log"
[[ -n "${SEL_AUTO_MERGE_OUT:-}" ]] && printf '%s\n' "$SEL_AUTO_MERGE_OUT"
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/dispatch-auto-merge"
  # tactic-graph-tick-node-lane-auto-merge Unit 3: fake graph-auto-merge invoked
  # by the node-lane Step 1d (cont.) block — UNCONDITIONALLY, unlike
  # dispatch-auto-merge above, since tactic-graph-auto-merge-main-health-gate
  # moved the main-health gate inside the real graph-auto-merge. This fake has
  # NO internal gate, which is what lets the wiring test distinguish "select-tick
  # suppressed the call" from "the script self-gated". Logs its invocation and
  # emits a configurable merge line so a wiring test can assert the tick prefixes
  # it with `merge: `. The real merge logic and its main-health gate have their
  # own unit tests (test-graph-auto-merge.sh); here we only verify the tick wiring.
  cat > "$TMPDIR_TEST/graph-auto-merge" <<'FAKE'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/stub" && pwd)"
echo called >> "$STUB_DIR/graph-auto-merge-calls.log"
[[ -n "${SEL_GRAPH_AUTO_MERGE_OUT:-}" ]] && printf '%s\n' "$SEL_GRAPH_AUTO_MERGE_OUT"
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/graph-auto-merge"
  # #1812: fake dispatch-retriage-orphaned-followups invoked unconditionally by
  # Step 2e. Logs its invocation and emits a configurable line so a wiring test
  # can assert the tick prefixes it with `retriage: `. SILENT by default (emits
  # nothing unless SEL_RETRIAGE_OUT is set, exit 0) so RETRIAGE_OUT stays empty
  # and every existing tick test is byte-identical to the pre-#1812 no-op. The
  # real re-triage logic has its own unit tests below; here we only verify wiring.
  cat > "$TMPDIR_TEST/dispatch-retriage-orphaned-followups" <<'FAKE'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/stub" && pwd)"
echo called >> "$STUB_DIR/retriage-calls.log"
[[ -n "${SEL_RETRIAGE_OUT:-}" ]] && printf '%s\n' "$SEL_RETRIAGE_OUT"
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/dispatch-retriage-orphaned-followups"
  # Sourced helper: provides claude_agents_count_busy_workers (driven by
  # SEL_LIVE_COUNT*) and claude_agents_list_all (driven by SEL_AGENTS_*, used by
  # the reservation-ledger sweep the gate runs before counting). The heredoc is
  # quoted so the env vars are read at call time, not at write time.
  cat > "$TMPDIR_TEST/lib-claude-agents.sh" <<'FAKE'
claude_agents_count_busy_workers() {
  [[ -n "${SEL_LIVE_COUNT_FAIL:-}" ]] && return 1
  echo "${SEL_LIVE_COUNT:-0}"
}
claude_agents_list_all() {
  [[ -n "${SEL_AGENTS_LIST_FAIL:-}" ]] && return 1
  [[ -n "${SEL_AGENTS_TSV:-}" ]] && printf '%s\n' "${SEL_AGENTS_TSV}"
  return 0
}
claude_sessions_under() {
  # #1495: default UNKNOWN (rc 1) preserves the pre-#1495 fall-through in
  # existing main-branch tests. A test sets SEL_SESSIONS_UNDER_RC=0 and
  # SEL_SESSIONS_UNDER_TSV (tab-separated sid<TAB>pid<TAB>status<TAB>name rows)
  # to drive a definite session list.
  local rc="${SEL_SESSIONS_UNDER_RC:-1}"
  [[ "$rc" != 0 ]] && return "$rc"
  [[ -n "${SEL_SESSIONS_UNDER_TSV:-}" ]] && printf '%s\n' "${SEL_SESSIONS_UNDER_TSV}"
  return 0
}
claude_agents_list_sessions_in_cwd_all() {
  # The REGISTERED (--all) cwd-keyed view Decision A reads. Default UNKNOWN
  # (rc 1) preserves the fall-through in every pre-existing main-branch test. A
  # test sets SEL_MAIN_SESSIONS_RC=0 and SEL_MAIN_SESSIONS_TSV (rows of
  # sessionId<TAB>id<TAB>name<TAB>state<TAB>status) to drive a definite list;
  # SEL_MAIN_SESSIONS_RC=0 with no TSV models a definite "nobody is there".
  local rc="${SEL_MAIN_SESSIONS_RC:-1}"
  [[ "$rc" != 0 ]] && return "$rc"
  [[ -n "${SEL_MAIN_SESSIONS_TSV:-}" ]] && printf '%s\n' "${SEL_MAIN_SESSIONS_TSV}"
  return 0
}
FAKE
  # Default empty reservation ledger: the sweep no-ops, reservation_count is 0,
  # and the gap is unchanged from the pre-ledger gate (behavior-preserving).
  export DISPATCH_RESERVATION_DIR="$TMPDIR_TEST/reservations"
  mkdir -p "$TMPDIR_TEST/reservations"
  # Decision-log isolation (#2038): point the log at a scratch dir so tests never
  # write to the real $HOME path. mkdir is intentionally NOT called here — the lib
  # creates the directory on its first append, so the dir's presence proves the lib
  # ran and wrote rather than silently no-oping.
  export DISPATCH_DECISION_LOG_DIR="$TMPDIR_TEST/decisionlog"
  chmod +x "$TMPDIR_TEST/dispatch-jit-engine" \
           "$TMPDIR_TEST/dispatch-target-workers" \
           "$TMPDIR_TEST/dispatch-schedule-reseed" \
           "$TMPDIR_TEST/dispatch-schedule-target-reseed" \
           "$TMPDIR_TEST/dispatch-escalate-sync-broken"

  # PATH-shimmed git: branch defaults to main; fetch/merge succeed unless a
  # FAKE_GIT_*_FAIL env var is set. The single `-C <path> symbolic-ref --short
  # HEAD` arm below backs lib.sh's assert_primary_checkout_on_main
  # (b8a1ba75), which dispatch-select-tick's Step 1 main-sync now calls before
  # the ff-only merge — precedence SEL_PRIMARY_CHECKOUT_BRANCH >
  # FAKE_GIT_PRIMARY_BRANCH > FAKE_GIT_BRANCH > "main", so every
  # pre-existing test's main-sync path is unaffected and either knob can drive
  # the drift invariant. (There were previously two case arms matching this
  # same command shape — bash `case` takes the first match, so the earlier
  # SEL_PRIMARY_CHECKOUT_BRANCH arm silently shadowed the older
  # FAKE_GIT_PRIMARY_BRANCH knob; collapsed into one arm here.)
  cat > "$TMPDIR_TEST/bin/git" <<'STUB'
#!/usr/bin/env bash
case "$*" in
  "rev-parse --abbrev-ref HEAD") echo "${FAKE_GIT_BRANCH:-main}" ;;
  "fetch origin main") [[ -n "${FAKE_GIT_FETCH_FAIL:-}" ]] && exit 1 ; exit 0 ;;
  "merge --ff-only origin/main") echo merge >> "${SEL_GIT_MERGE_LOG:-/dev/null}" ; [[ -n "${FAKE_GIT_MERGE_FAIL:-}" ]] && exit 1 ; exit 0 ;;
  # resolve_project_root (lib.sh) + assert_primary_checkout_on_main (added by
  # PR #2925) run before the main-sync: return a non-empty git-common-dir so the
  # project-root dirname succeeds, and report the primary checkout's branch via
  # `-C <path> symbolic-ref --short HEAD`. A prior origin/main merge left TWO
  # competing knobs for this target in two separate, mutually shadowing case
  # arms — the newer SEL_PRIMARY_CHECKOUT_BRANCH and the older
  # FAKE_GIT_PRIMARY_BRANCH — where bash `case` takes the first match, so one
  # arm always silently shadowed the other's knob. Unified into ONE arm
  # honoring both: SEL_PRIMARY_CHECKOUT_BRANCH, then FAKE_GIT_PRIMARY_BRANCH,
  # then FAKE_GIT_BRANCH (the tick's OWN branch check above, gating whether the
  # main-sync block runs at all), then "main". No test sets more than one of
  # these knobs at once, so this precedence order is behavior-preserving for
  # every existing test; guard-pass tests set none (-> main, guard passes),
  # each drift test sets exactly one (-> that branch, guard halts exit 2). No
  # knob is dropped and no test is weakened.
  "rev-parse --path-format=absolute --git-common-dir") echo "$TMPDIR_TEST/.bare" ;;
  "-C "*" symbolic-ref --short HEAD") echo "${SEL_PRIMARY_CHECKOUT_BRANCH:-${FAKE_GIT_PRIMARY_BRANCH:-${FAKE_GIT_BRANCH:-main}}}" ;;
  *) exit 0 ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/git"

  # PATH-shimmed gh for the Step 1c latch re-arm (#1085). The open-latch query
  # reads main-broken-open.txt (one issue number per line; absent → no open
  # latch, the re-arm short-circuits). The REST close (#2256) logs its PATCH to
  # gh-issue-close-rest-calls.log and the --comment POST to
  # gh-issue-comment-rest-calls.log so a test can assert whether the latch was closed.
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
case "$args" in
  api\ *repos/*/issues\?*dispatch:main-broken*)
    # Step-1c main-broken latch: converted to gh_issue_list_rest (REST) by #2258.
    # main-broken-open.txt holds one issue number per line; wrap them into a
    # REST-shape snake_case array so the helper remaps to camelCase and the
    # script's `jq -r '.[].number'` recovers the same numbers. Absent file → [],
    # so the open-latch query returns empty and the re-arm short-circuits.
    if [[ -f "$STUB_DIR/main-broken-open.txt" ]]; then
      jq -R -s 'split("\n") | map(select(length > 0) | {number: (. | tonumber), pull_request: null, created_at: null, closed_at: null, labels: []})' "$STUB_DIR/main-broken-open.txt"
    else
      echo "[]"
    fi
    ;;
  api\ *repos/*/issues\?*dispatch:sync-broken*)
    # #1495 + #1601: open dispatch:sync-broken latch query, now via gh_issue_list_rest
    # (REST). Serves sync-broken-open.json (REST-shape array; absent → []).
    if [[ -f "$STUB_DIR/sync-broken-open.json" ]]; then
      cat "$STUB_DIR/sync-broken-open.json"
    else
      echo "[]"
    fi
    ;;
  api\ --paginate\ repos/*/commits/*/check-runs)
    # dispatch_ci_verdict_rest (#1601): per-PR check-runs by headRefOid sha.
    sha=$(printf '%s' "$args" | sed -E 's#.*commits/([^/]+)/check-runs.*#\1#')
    if [[ -f "$STUB_DIR/check-runs-${sha}.json" ]]; then cat "$STUB_DIR/check-runs-${sha}.json"
    else echo '{"check_runs":[]}'; fi
    ;;
  "api -X POST "*/issues/*/comments*)
    # gh_issue_close_rest --comment sub-call (#2256): POST .../issues/<N>/comments.
    # The latch-reset closes now post the why-comment then PATCH the issue closed.
    echo "$args" >> "$STUB_DIR/gh-issue-comment-rest-calls.log"
    echo '{}'
    ;;
  "api -X PATCH "*/issues/[0-9]*)
    # gh_issue_close_rest sentinel (#2256): PATCH .../issues/<N> (state=closed).
    echo "$args" >> "$STUB_DIR/gh-issue-close-rest-calls.log"
    echo '{}'
    ;;
  "pr list --state open --limit 300 --json number,isDraft,labels,headRefOid,mergeable")
    # dispatch-reconcile-ready's one fetch. $STUB_DIR/reconcile-pr-list.json
    # supplies the per-test PR array; absence means no open PRs.
    echo "pr list" >> "$STUB_DIR/gh-reconcile-pr-list.log"
    if [[ -f "$STUB_DIR/reconcile-pr-list.json" ]]; then
      cat "$STUB_DIR/reconcile-pr-list.json"
    else
      echo "[]"
    fi
    ;;
  pr\ ready\ --undo\ *)
    num=$(printf '%s' "$args" | awk '{print $NF}')
    echo "$num" >> "$STUB_DIR/gh-pr-ready-undo.log"
    ;;
  pr\ ready\ *)
    num=$(printf '%s' "$args" | awk '{print $NF}')
    echo "$num" >> "$STUB_DIR/gh-pr-ready.log"
    ;;
  pr\ edit\ *--remove-label\ *)
    echo "$args" >> "$STUB_DIR/gh-pr-edit.log"
    ;;
  *)
    echo "gh stub (sel-tick): unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"

  export PATH="$TMPDIR_TEST/bin:$SAVED_PATH"
}

sel_tick_teardown() {
  export PATH="$SAVED_PATH"
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST="" ; STUB_DIR=""
  unset DISPATCH_LOCK_FILE CLAUDE_CODE_SESSION_ID CLAUDE_AGENTS_CMD \
    DISPATCH_LOCK_WAIT_TIMEOUT DISPATCH_LOCK_WAIT_INTERVAL \
    FAKE_GIT_BRANCH FAKE_GIT_PRIMARY_BRANCH FAKE_GIT_FETCH_FAIL FAKE_GIT_MERGE_FAIL \
    SEL_TARGET_N SEL_LIVE_COUNT SEL_LIVE_COUNT_FAIL \
    SEL_EXHAUSTED SEL_PRIORITY_ONLY \
    SEL_MAX_WORKERS SEL_NPRIO_AVAIL SEL_DEFAULT_TARGET \
    SEL_GRAPH_TARGET SEL_GRAPH_PACE_EXEMPT \
    DISPATCH_RESERVATION_DIR SEL_AGENTS_TSV SEL_AGENTS_LIST_FAIL \
    DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE SEL_GIT_MERGE_LOG \
    SEL_SESSIONS_UNDER_RC SEL_SESSIONS_UNDER_TSV \
    SEL_MAIN_SESSIONS_RC SEL_MAIN_SESSIONS_TSV \
    DISPATCH_STANDDOWN_PROJECTS_ROOT DISPATCH_MAIN_CHECKOUT_STUCK_GRACE_S \
    DISPATCH_LOCK_PROBE_TIMEOUT DISPATCH_LOCK_FLOCK_TIMEOUT \
    SEL_AUTO_MERGE_OUT SEL_GRAPH_AUTO_MERGE_OUT SEL_RETRIAGE_OUT \
    SEL_MAIN_BROKEN_SHA SEL_MAIN_RED_NODES SEL_SYNC_BROKEN_LATCHED SEL_JIT_SCAN \
    SEL_RECONCILE_MERGED_OUT SEL_RECONCILE_GRAPH_OUT SEL_REVIEW_STALL_OUT SEL_CENSUS_OUT \
    SEL_CALENDAR_OUT SEL_STATEMENTS_OUT \
    SEL_PRIMARY_CHECKOUT_BRANCH
  export DISPATCH_DECISION_LOG_DIR="$DISPATCH_TEST_DECISION_LOG_DIR"
}

# Run the orchestrator, capturing full stdout; the decision is the last line.
run_sel_tick() {
  "$TMPDIR_TEST/dispatch-select-tick" "$@" 2>/dev/null
}

# Same as run_sel_tick, but the tick's stderr is written to $1 instead of being
# discarded. Use this when the behavior under test is only observable on stderr
# (e.g. the reservation sweep's `reclaimed reservation ...` notes).
run_sel_tick_err() {
  local errfile="$1"; shift
  "$TMPDIR_TEST/dispatch-select-tick" "$@" 2>"$errfile"
}

# sel_tick_transcript <sid> <age-seconds> — stage a transcript for <sid> whose
# mtime is <age-seconds> in the past, which is exactly what
# _standdown_session_idle_s measures (newest mtime of
# <projects-root>/<project>/<sid>.jsonl). Omit the call entirely and the session
# reads as UNKNOWN idle.
sel_tick_transcript() {
  local sid="$1" age="$2" f
  f="$DISPATCH_STANDDOWN_PROJECTS_ROOT/proj/${sid}.jsonl"
  : > "$f"
  touch -d "@$(( $(date +%s) - age ))" "$f"
}

# --- empty queue → release + empty ------------------------------------------
echo "Test: select-tick empty queue → empty, lock released"
sel_tick_setup
if out=$(run_sel_tick); then rc=0; else rc=$?; fi
assert_eq "empty: exit 0" "0" "$rc"
assert_eq "empty: decision line" "empty" "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "empty: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
# AC5 decision-log: verify a record was appended with the correct disposition+site
DLOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "empty: decision log exists" "1" "$([ -f "$DLOG_FILE" ] && echo 1 || echo 0)"
assert_eq "empty: decision log has at least 1 line" "1" \
  "$([ -f "$DLOG_FILE" ] && [ "$(wc -l < "$DLOG_FILE")" -ge 1 ] && echo 1 || echo 0)"
assert_eq "empty: decision log last record .disposition" "empty" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.disposition')"
assert_eq "empty: decision log last record .site" "select-tick" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.site')"
sel_tick_teardown

# --- tick-scoped graph node cache: armed during the tick, removed on exit ----
# The reconcile band shares one strict `intentions/` parse per tick via
# DISPATCH_GRAPH_NODE_CACHE (packages/intentionsutil/src/store-cache.ts). Step 0
# creates the directory and the single EXIT trap removes it. The trap is the
# fragile half: `trap ... EXIT` REPLACES rather than stacks, so this also
# re-asserts that the decision-log emit and the CI-verdict cleanup registered
# alongside it still fire — a clobbered trap would show up here as a surviving
# ci-verdict dir or a missing decision-log record, not as a failure in the tick
# under test.
echo "Test: select-tick arms a tick-scoped DISPATCH_GRAPH_NODE_CACHE and removes it on exit"
sel_tick_setup
out=$(run_sel_tick) || true
CACHE_ENV_LOG="$TMPDIR_TEST/logs/cache-env.log"
assert_eq "nodecache: the reconcile band ran and recorded its environment" "1" \
  "$([ -s "$CACHE_ENV_LOG" ] && echo 1 || echo 0)"
cache_env_line="$(head -n1 "$CACHE_ENV_LOG" 2>/dev/null || true)"
gnc_path="$(cut -f1 <<<"$cache_env_line")"; gnc_state="$(cut -f2 <<<"$cache_env_line")"
civ_path="$(cut -f3 <<<"$cache_env_line")"; civ_state="$(cut -f4 <<<"$cache_env_line")"
assert_eq "nodecache: exported to the band with a non-empty value" "1" \
  "$([ -n "$gnc_path" ] && [ "$gnc_path" != "<unset>" ] && echo 1 || echo 0)"
assert_eq "nodecache: the exported path was a real directory during the tick" "dir" "$gnc_state"
assert_eq "nodecache: removed by the EXIT trap" "0" \
  "$([ -d "$gnc_path" ] && echo 1 || echo 0)"
assert_eq "nodecache: sibling ci-verdict cache still armed during the tick" "dir" "$civ_state"
assert_eq "nodecache: sibling ci-verdict cache still removed by the same trap" "0" \
  "$([ -d "$civ_path" ] && echo 1 || echo 0)"
assert_eq "nodecache: decision-log emit still chained into the same trap" "empty" \
  "$(tail -n1 "$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl" | jq -r '.disposition')"
sel_tick_teardown

# --- primary checkout drifted off main → internal-error, exit 2 -------------
# lib.sh's assert_primary_checkout_on_main (b8a1ba75) guards the Step 1
# main-sync: a primary checkout not on `main` (the 2026-07-21 direct-to-main
# incident, PR #2925) must fail loudly rather than let the ff-only merge run
# against the wrong branch. dispatch-select-tick surfaces this as exit 2 with
# no decision line, WITHOUT releasing the lock (the invariant violation is not
# a normal terminal disposition the lock-release contract covers).
echo "Test: select-tick primary checkout drifted off main → internal-error, exit 2"
sel_tick_setup
export SEL_PRIMARY_CHECKOUT_BRANCH="some-other-branch"
rc=0; out=$(run_sel_tick) || rc=$?
assert_eq "drift: exit 2" "2" "$rc"
assert_eq "drift: no decision line" "" "$out"
DLOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "drift: decision log last record .disposition" "internal-error" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.disposition')"
assert_eq "drift: decision log last record .skip_reason" "primary-checkout-not-on-main" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.skip_reason')"
sel_tick_teardown

# --- graph selection → reserved under the node id, lock RELEASED --------------
# tactic-graph-router-selector: the tick consults the graph selector FIRST; a
# selection writes one reservation-ledger marker per node under its NODE ID
# (the durable claim), releases the lock, and emits the `graph` decision. The
# legacy selector must NOT run (the graph lane consumed this run's budget).
echo "Test: select-tick graph selection → graph decision, node reserved, lock released, legacy skipped"
sel_tick_setup
export SEL_GRAPH_TARGET="node tactic-x tactic implement"
out=$(run_sel_tick) || true
assert_eq "graph: decision line" "graph 1 tactic-x:tactic:implement" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "graph: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "graph: reservation written under the node id" "1" \
  "$([ -f "$DISPATCH_RESERVATION_DIR/tactic-x" ] && echo 1 || echo 0)"
assert_eq "graph: reservation issue field is the node id" "issue=tactic-x" \
  "$(grep '^issue=' "$DISPATCH_RESERVATION_DIR/tactic-x")"
# Control for the explicit-lane origin test below: the AUTONOMOUS lane writes NO
# `origin=` line, so its claim keeps the ordinary (a)/(c) sweep lifecycle and is
# never TTL-reclaimed out from under the fan-out it belongs to.
assert_eq "graph: autonomous claim carries no origin= line" "0" \
  "$(grep -c '^origin=' "$DISPATCH_RESERVATION_DIR/tactic-x")"
assert_eq "graph: legacy selector not consulted" "0" \
  "$([ -f "$TMPDIR_TEST/logs/select-target.log" ] && echo 1 || echo 0)"
assert_eq "graph: decision log disposition" "graph" \
  "$(tail -n1 "$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl" | jq -r '.disposition')"
sel_tick_teardown

# --- graph selection: multi-node set within the gap ---------------------------
echo "Test: select-tick graph multi-node selection → one decision line, both reserved"
sel_tick_setup
export SEL_TARGET_N=3
export SEL_GRAPH_TARGET=$'node tactic-a tactic review\nnode strategy-s strategy align-tactics'
out=$(run_sel_tick) || true
assert_eq "graph multi: decision line" \
  "graph 2 tactic-a:tactic:review strategy-s:strategy:align-tactics" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "graph multi: strategy id reserved too" "1" \
  "$([ -f "$DISPATCH_RESERVATION_DIR/strategy-s" ] && echo 1 || echo 0)"
sel_tick_teardown

# --- graph empty → fall through to the legacy selector ------------------------
echo "Test: select-tick graph empty → falls through to aux triggers → empty"
sel_tick_setup
# SEL_GRAPH_TARGET unset → the graph selector returns empty; no JIT reminder is
# due and main is green, so the tick falls through to the `empty` decision. The
# legacy gh selector (dispatch-select-target) that used to drain here is gone.
out=$(run_sel_tick) || true
assert_eq "graph empty: graph selector consulted first" "1" \
  "$([ -f "$TMPDIR_TEST/logs/graph-select.log" ] && echo 1 || echo 0)"
assert_eq "graph empty: decision line" "empty" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "graph empty: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
sel_tick_teardown

# --- at-cap: graph pace-exempt probe admits this single candidate --------------
# strategy clarification 14: at the worker cap (not exhausted) the graph
# pace-exempt probe runs BEFORE the legacy --priority-only probe; a hit admits
# this single candidate here, and the legacy probe must not run. The lane's
# general width is the ceiling headroom PACE_GAP = max(0, MAX_WORKERS - LIVE_COUNT).
echo "Test: select-tick at-cap graph pace-exempt probe → graph decision, legacy priority probe skipped"
sel_tick_setup
export SEL_TARGET_N=1 SEL_LIVE_COUNT=1
export SEL_GRAPH_PACE_EXEMPT="node tactic-p tactic implement"
out=$(run_sel_tick) || true
assert_eq "pace-exempt: decision line" "graph 1 tactic-p:tactic:implement" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "pace-exempt: node reserved" "1" \
  "$([ -f "$DISPATCH_RESERVATION_DIR/tactic-p" ] && echo 1 || echo 0)"
assert_eq "pace-exempt: legacy priority probe not consulted" "0" \
  "$([ -f "$TMPDIR_TEST/logs/select-target-priority.log" ] && echo 1 || echo 0)"
assert_eq "pace-exempt: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
sel_tick_teardown

# --- at-cap: graph probe empty → legacy priority probe still runs --------------
echo "Test: select-tick at-cap graph probe empty + green main → concurrency-cap"
sel_tick_setup
export SEL_TARGET_N=1 SEL_LIVE_COUNT=1
# Graph pace-exempt lane empty (SEL_GRAPH_PACE_EXEMPT unset) and main green
# (SEL_MAIN_BROKEN_SHA unset) → no surviving at-cap bypass; hard cap. The legacy
# --priority-only probe (dispatch-select-target) died with the legacy selector.
out=$(run_sel_tick) || true
assert_eq "at-cap fallback: graph pace-exempt probe consulted" "1" \
  "$([ -f "$TMPDIR_TEST/logs/graph-select-pace-exempt.log" ] && echo 1 || echo 0)"
assert_eq "at-cap fallback: decision line" "concurrency-cap" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "at-cap fallback: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
DLOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "at-cap fallback: decision log .skip_reason" "at-cap-no-priority" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.skip_reason')"
sel_tick_teardown

# --- at-cap: PACE_GAP > 1 admits multiple pace-exempt nodes (tactic-pace-exempt-ceiling-fanout Unit 1) ---
# PACE_GAP = max(0, MAX_WORKERS - LIVE_COUNT) = max(0, 3 - 1) = 2. The probe is
# invoked with `--top 2` and both nodes it returns are admitted in one decision.
echo "Test: select-tick at-cap pace-exempt gap=2 → both nodes admitted, gap recorded"
sel_tick_setup
export SEL_TARGET_N=1 SEL_LIVE_COUNT=1 SEL_MAX_WORKERS=3
export SEL_GRAPH_PACE_EXEMPT=$'node tactic-p1 tactic implement\nnode tactic-p2 tactic qa'
out=$(run_sel_tick) || true
assert_eq "pace-exempt gap=2: probe invoked with --top 2" "1" \
  "$(tail -n1 "$TMPDIR_TEST/logs/graph-select-pace-exempt.log" | grep -c -- '--top 2')"
assert_eq "pace-exempt gap=2: decision line" \
  "graph 2 tactic-p1:tactic:implement tactic-p2:tactic:qa" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "pace-exempt gap=2: tactic-p1 reserved" "1" \
  "$([ -f "$DISPATCH_RESERVATION_DIR/tactic-p1" ] && echo 1 || echo 0)"
assert_eq "pace-exempt gap=2: tactic-p2 reserved" "1" \
  "$([ -f "$DISPATCH_RESERVATION_DIR/tactic-p2" ] && echo 1 || echo 0)"
assert_eq "pace-exempt gap=2: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
DLOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "pace-exempt gap=2: decision log .skip_reason" "pace-exempt-bypass-at-cap" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.skip_reason')"
assert_eq "pace-exempt gap=2: decision log .gap" "2" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.gap')"
sel_tick_teardown

# --- at-cap: PACE_GAP == 0 (ceiling full) → probe never runs -------------------
# LIVE_COUNT == MAX_WORKERS → PACE_GAP = 0. The pace-exempt lane must not be
# probed at all — a node is available but the ceiling is already full.
echo "Test: select-tick at-cap ceiling full (gap=0) → probe never runs, concurrency-cap"
sel_tick_setup
export SEL_TARGET_N=1 SEL_LIVE_COUNT=3 SEL_MAX_WORKERS=3
export SEL_GRAPH_PACE_EXEMPT="node tactic-p tactic implement"
out=$(run_sel_tick) || true
assert_eq "ceiling full: probe not consulted" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-select-pace-exempt.log" ] && echo 1 || echo 0)"
assert_eq "ceiling full: decision line" "concurrency-cap" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "ceiling full: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "ceiling full: reseed scheduled" "called" \
  "$(cat "$TMPDIR_TEST/logs/schedule-reseed.log")"
DLOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "ceiling full: decision log .skip_reason" "at-cap-ceiling-full" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.skip_reason')"
sel_tick_teardown

# --- at-cap: non-numeric ceiling closes the lane without wedging the tick ------
# dispatch-target-workers --max returns something non-numeric (a misconfigured
# environment). PACE_GAP fails closed to 0 rather than crashing the tick.
echo "Test: select-tick at-cap non-numeric ceiling → closes lane, exit 0, concurrency-cap"
sel_tick_setup
export SEL_TARGET_N=1 SEL_LIVE_COUNT=1 SEL_MAX_WORKERS="not-a-number"
export SEL_GRAPH_PACE_EXEMPT="node tactic-p tactic implement"
rc=0; out=$(run_sel_tick) || rc=$?
assert_eq "unreadable ceiling: exit 0" "0" "$rc"
assert_eq "unreadable ceiling: decision line" "concurrency-cap" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "unreadable ceiling: probe not consulted" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-select-pace-exempt.log" ] && echo 1 || echo 0)"
DLOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "unreadable ceiling: decision log .skip_reason" "at-cap-ceiling-unreadable" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.skip_reason')"
assert_eq "unreadable ceiling: decision log .max_workers is null" "null" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.max_workers')"
sel_tick_teardown

# --- at-cap: crashed dispatch-target-workers --max closes the lane (item 9) ----
# A crashed dispatch-target-workers prints nothing for --max; empty stdout also
# fails the `^[0-9]+$` regex, so this is the "tool crashed" sibling of the
# non-numeric-string case above (mirrors the TARGET_N crashed-stub test further
# below, "select-tick empty TARGET_N -> release + exit 2", but for MAX_WORKERS,
# where the correct behavior is NOT exit 2: the lane fails closed to
# concurrency-cap at exit 0, keeping the main-broken probe and reseed
# reachable).
echo "Test: select-tick crashed dispatch-target-workers --max -> closes lane, exit 0, concurrency-cap"
sel_tick_setup
cat > "$TMPDIR_TEST/dispatch-target-workers" <<'FAKE'
#!/usr/bin/env bash
if [[ "$1" == "--exhausted" ]]; then echo "${SEL_EXHAUSTED:-ok}"; exit 0; fi
# --max: emit nothing (simulate a crashed dispatch-target-workers)
if [[ "$1" == "--max" ]]; then exit 0; fi
echo "${SEL_TARGET_N:-1}"
FAKE
chmod +x "$TMPDIR_TEST/dispatch-target-workers"
export SEL_TARGET_N=1 SEL_LIVE_COUNT=1
export SEL_GRAPH_PACE_EXEMPT="node tactic-p tactic implement"
rc=0; out=$(run_sel_tick) || rc=$?
assert_eq "crashed max: exit 0" "0" "$rc"
assert_eq "crashed max: decision line" "concurrency-cap" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "crashed max: probe not consulted" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-select-pace-exempt.log" ] && echo 1 || echo 0)"
DLOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "crashed max: decision log .skip_reason" "at-cap-ceiling-unreadable" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.skip_reason')"
assert_eq "crashed max: decision log .max_workers is null" "null" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.max_workers')"
sel_tick_teardown

# --- exhausted at cap: neither probe runs (hard floor) -------------------------
echo "Test: select-tick at-cap exhausted → no graph pace-exempt probe (hard floor)"
sel_tick_setup
export SEL_TARGET_N=1 SEL_LIVE_COUNT=1 SEL_EXHAUSTED=exhausted
export SEL_GRAPH_PACE_EXEMPT="node tactic-p tactic implement"
out=$(run_sel_tick) || true
assert_eq "exhausted: decision line" "concurrency-cap" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "exhausted: graph pace-exempt probe not consulted" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-select-pace-exempt.log" ] && echo 1 || echo 0)"
sel_tick_teardown

# --- main-broken → passthrough + lock RELEASED (spawned as a bg job) ---------
echo "Test: select-tick main-broken → passthrough, lock released"
sel_tick_setup
# Graph queue empty, no JIT due, but main is red: repo-health --main-broken-sha
# reports a sha (Step 3b) → main-broken decision, spawned downstream as a
# lock-free bg job so the lock is released.
export SEL_MAIN_BROKEN_SHA=abc1234
out=$(run_sel_tick) || true
assert_eq "main-broken: decision line" "main-broken abc1234" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "main-broken: lock released" "" \
  "$(cat "$DISPATCH_LOCK_FILE")"
sel_tick_teardown

# --- Step 1c main-red-node sync wiring: main healthy + node still open (tactic-graph-main-self-heal) ---
# The graph-native successor to the old gh-issue-based latch re-arm (#1085):
# the open-node read and the green-main recovery-completion write now both
# live inside dispatch-graph-main-red-sync, its own script wholesale-faked by
# sel_tick_setup (see the fake above). These sel_tick_* tests therefore
# exercise ONLY dispatch-select-tick's own gating on that script's stdout —
# never the completion write's internals (dump-node/write-node/graph-commit),
# which are out of scope here.
echo "Test: select-tick main-red-node sync wiring — main healthy, node still open → empty, no merge"
sel_tick_setup
# SEL_MAIN_BROKEN_SHA unset → repo-health reports green. SEL_MAIN_RED_NODES set
# → the fake sync script reports one open node, so OPEN_MAIN_RED is non-empty
# this tick regardless of main's own health (mirrors the pre-extraction inline
# behavior: every consumer this tick gates on the tick's initial read, not a
# post-completion re-read).
export SEL_MAIN_RED_NODES="tactic-main-red-abc1234"
out=$(run_sel_tick) || true
assert_eq "main-red-sync green+open: sync invoked" "present" \
  "$([ -f "$TMPDIR_TEST/logs/graph-main-red-sync.log" ] && echo present || echo absent)"
assert_eq "main-red-sync green+open: decision line" "empty" "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "main-red-sync green+open: no merge activity while a node is open" "0" \
  "$(grep -c '^merge:' <<<"$out")"
sel_tick_teardown

# --- Step 1c main-red-node sync wiring: main red + node open ------------------
echo "Test: select-tick main-red-node sync wiring — main red, node open → empty, no merge"
sel_tick_setup
# repo-health --main-broken-sha reports a sha (main still red) AND the sync
# fake reports an open node; OPEN_MAIN_RED is non-empty either way, so the
# Step 3b main-broken emission and Step 1d auto-merge both stay suppressed.
export SEL_MAIN_BROKEN_SHA=redsha1
export SEL_MAIN_RED_NODES="tactic-main-red-redsha1"
out=$(run_sel_tick) || true
assert_eq "main-red-sync red+open: sync invoked" "present" \
  "$([ -f "$TMPDIR_TEST/logs/graph-main-red-sync.log" ] && echo present || echo absent)"
assert_eq "main-red-sync red+open: decision line" "empty" "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "main-red-sync red+open: no merge activity" "0" \
  "$(grep -c '^merge:' <<<"$out")"
sel_tick_teardown

# --- Step 1c main-red-node sync wiring: main healthy + no open node -----------
echo "Test: select-tick main-red-node sync wiring — main healthy, no open node → empty (no bypass needed)"
sel_tick_setup
# SEL_MAIN_RED_NODES unset (default empty) → OPEN_MAIN_RED is empty this tick;
# main is also healthy (SEL_MAIN_BROKEN_SHA unset), so Step 3b finds nothing to
# emit either. The sync script still runs unconditionally every tick.
out=$(run_sel_tick) || true
assert_eq "main-red-sync green+no-node: sync invoked" "present" \
  "$([ -f "$TMPDIR_TEST/logs/graph-main-red-sync.log" ] && echo present || echo absent)"
assert_eq "main-red-sync green+no-node: decision line" "empty" "$(printf '%s\n' "$out" | tail -n 1)"
sel_tick_teardown

# --- Step 1d (cont.): auto-merge wiring, main healthy → invoked (#1540) -------
# main is healthy and no tactic-main-red-* node is open (SEL_MAIN_RED_NODES
# unset → OPEN_MAIN_RED empty), so Step 1d (cont.) runs dispatch-auto-merge and
# prefixes each of its `merged #N` lines with `merge: `. The fake emits
# SEL_AUTO_MERGE_OUT.
echo "Test: select-tick auto-merge wiring (main healthy) → merge: line, auto-merge invoked"
sel_tick_setup
export SEL_AUTO_MERGE_OUT="merged #42"
out=$(run_sel_tick) || true
TOTAL=$((TOTAL + 1))
if grep -q '^merge: merged #42$' <<<"$out"; then
  PASS=$((PASS + 1)); echo "  PASS: tick emits 'merge: merged #42'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: tick emits 'merge: merged #42'"
  echo "    actual stdout: '$out'"
fi
assert_eq "auto-merge wiring: dispatch-auto-merge invoked" "present" \
  "$([[ -f "$STUB_DIR/auto-merge-calls.log" ]] && echo present || echo absent)"
sel_tick_teardown

# --- Step 1d (cont.): auto-merge suppressed while main is broken (#1540) ------
# An open tactic-main-red-* node (OPEN_MAIN_RED non-empty, driven by
# SEL_MAIN_RED_NODES — the graph-native successor to the old
# main-broken-open.txt gh-issue fixture) suppresses Step 1d (cont.):
# dispatch-auto-merge is NOT invoked and no `merge:` line is emitted, even
# though the fake would emit one if called. OPEN_MAIN_RED is now the SOLE gate
# for auto-merge; SEL_MAIN_BROKEN_SHA is a separate, second-order probe only
# consulted once OPEN_MAIN_RED is already empty (Step 3b / the at-cap bypass),
# so it plays no role in this test.
echo "Test: select-tick auto-merge suppressed while main is broken"
sel_tick_setup
export SEL_MAIN_RED_NODES="tactic-main-red-redsha1"
export SEL_AUTO_MERGE_OUT="merged #42"
out=$(run_sel_tick) || true
TOTAL=$((TOTAL + 1))
if ! grep -q 'merge:' <<<"$out"; then
  PASS=$((PASS + 1)); echo "  PASS: no 'merge:' line while main is broken"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: no 'merge:' line while main is broken"
  echo "    actual stdout: '$out'"
fi
assert_eq "auto-merge suppressed: dispatch-auto-merge NOT invoked" "absent" \
  "$([[ -f "$STUB_DIR/auto-merge-calls.log" ]] && echo present || echo absent)"
sel_tick_teardown

# --- Step 1d (cont.): node-lane auto-merge wiring, main healthy → invoked -----
# (tactic-graph-tick-node-lane-auto-merge Unit 3). main is healthy (no
# main-broken-open.txt → OPEN_MB empty), so the node-lane block runs
# graph-auto-merge and prefixes each of its lines with `merge: `, the same
# prefix convention the issue-lane block uses. The fake emits
# SEL_GRAPH_AUTO_MERGE_OUT.
echo "Test: select-tick node-lane auto-merge wiring (main healthy) → merge: line, graph-auto-merge invoked"
sel_tick_setup
export SEL_GRAPH_AUTO_MERGE_OUT="merged #77 (tactic-y)"
out=$(run_sel_tick)
TOTAL=$((TOTAL + 1))
if grep -q '^merge: merged #77 (tactic-y)$' <<<"$out"; then
  PASS=$((PASS + 1)); echo "  PASS: tick emits 'merge: merged #77 (tactic-y)'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: tick emits 'merge: merged #77 (tactic-y)'"
  echo "    actual stdout: '$out'"
fi
assert_eq "node-lane auto-merge wiring: graph-auto-merge invoked" "present" \
  "$([[ -f "$STUB_DIR/graph-auto-merge-calls.log" ]] && echo present || echo absent)"
sel_tick_teardown

# --- Step 1d (cont.): the node-lane main-health gate moved INTO graph-auto-merge
# (tactic-graph-auto-merge-main-health-gate). This block previously asserted the
# INVERSE — that an open main-red latch suppressed select-tick's call to
# graph-auto-merge — because select-tick wrapped that call in
# `if [[ -z "$OPEN_MAIN_RED" ]]`. That caller-side wrapper is deleted: the gate
# now lives inside graph-auto-merge, which makes its own
# `dispatch-graph-main-red-sync --read-only` read and merges nothing when the
# latch is non-empty, UNKNOWN, or unreadable.
#
# The safety property is NOT dropped, only relocated to where it is now
# implemented — test-graph-auto-merge.sh cases (k1)-(k5) cover it directly
# against the real script: empty latch merges, open latch / UNKNOWN /
# unrunnable-sync each suppress, and `--node` is gated identically. What select-tick
# still owns, and what this case now pins, is that it calls graph-auto-merge
# UNCONDITIONALLY — a re-added caller-side wrapper would be a second, drifting
# copy of a load-bearing safety gate, and would silently re-break the
# /dispatch-ladder driver's reuse of the script.
#
# The fake graph-auto-merge deliberately has NO internal gate, so its merge line
# appearing here is exactly the evidence that select-tick no longer suppresses it.
echo "Test: select-tick calls graph-auto-merge unconditionally (gate is internal to it now)"
sel_tick_setup
export SEL_MAIN_RED_NODES="tactic-main-red-redsha1"
export SEL_AUTO_MERGE_OUT="merged #42"
export SEL_GRAPH_AUTO_MERGE_OUT="merged #77 (tactic-y)"
out=$(run_sel_tick)
assert_eq "node-lane auto-merge: graph-auto-merge invoked even while main is broken (it self-gates)" "present" \
  "$([[ -f "$STUB_DIR/graph-auto-merge-calls.log" ]] && echo present || echo absent)"
TOTAL=$((TOTAL + 1))
if grep -q '^merge: merged #77 (tactic-y)$' <<<"$out"; then
  PASS=$((PASS + 1)); echo "  PASS: ungated node-lane call still prefixes its output with 'merge: '"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ungated node-lane call still prefixes its output with 'merge: '"
  echo "    actual stdout: '$out'"
fi
# The ISSUE lane keeps its caller-side $OPEN_MAIN_RED wrapper — dispatch-auto-merge
# has no internal main-health gate, so removing that wrapper would be unsafe.
# Pin the asymmetry so a later cleanup does not "consistently" delete both.
assert_eq "issue-lane auto-merge: STILL suppressed while main is broken" "absent" \
  "$([[ -f "$STUB_DIR/auto-merge-calls.log" ]] && echo present || echo absent)"
TOTAL=$((TOTAL + 1))
if ! grep -q 'merge: merged #42' <<<"$out"; then
  PASS=$((PASS + 1)); echo "  PASS: no issue-lane 'merge:' line while main is broken"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: no issue-lane 'merge:' line while main is broken"
  echo "    actual stdout: '$out'"
fi
sel_tick_teardown

# --- Step 2e: re-triage orphaned follow-ups wiring (#1812) -------------------
# Step 2e runs dispatch-retriage-orphaned-followups unconditionally and prefixes
# each of its stdout lines with `retriage: `. The fake emits SEL_RETRIAGE_OUT.
echo "Test: select-tick re-triage wiring → retriage: line, retriage script invoked"
sel_tick_setup
export SEL_RETRIAGE_OUT="retriaged #101 (source PR #1704 closed unmerged)"
out=$(run_sel_tick) || true
TOTAL=$((TOTAL + 1))
if grep -q '^retriage: retriaged #101 (source PR #1704 closed unmerged)$' <<<"$out"; then
  PASS=$((PASS + 1)); echo "  PASS: tick emits 'retriage: retriaged #101 ...'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: tick emits 'retriage: retriaged #101 ...'"
  echo "    actual stdout: '$out'"
fi
assert_eq "re-triage wiring: dispatch-retriage-orphaned-followups invoked" "present" \
  "$([[ -f "$STUB_DIR/retriage-calls.log" ]] && echo present || echo absent)"
sel_tick_teardown

# --- Review-stall sweep wiring (tactic-graph-review-exclusion-stall-recovery) -
# The tick runs reconcile-graph-review-stall unconditionally right after
# reconcile-graph-merged and prefixes each of its stdout lines with
# `review-stall: `. The silent fake emits SEL_REVIEW_STALL_OUT; both stdout
# shapes the sweep can produce (a `fix` recovery and a `conflict` hold) must
# come through verbatim behind the prefix.
echo "Test: select-tick review-stall wiring → review-stall: lines"
sel_tick_setup
export SEL_REVIEW_STALL_OUT="recovered tactic-x -> fix (ci=failing merge=MERGEABLE)
held tactic-y -> conflict via tactic-hold-y (ci=passing merge=CONFLICTING)"
out=$(run_sel_tick) || true
TOTAL=$((TOTAL + 1))
if grep -q '^review-stall: recovered tactic-x -> fix (ci=failing merge=MERGEABLE)$' <<<"$out"; then
  PASS=$((PASS + 1)); echo "  PASS: tick emits 'review-stall: recovered tactic-x -> fix ...'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: tick emits 'review-stall: recovered tactic-x -> fix ...'"
  echo "    actual stdout: '$out'"
fi
TOTAL=$((TOTAL + 1))
if grep -q '^review-stall: held tactic-y -> conflict via tactic-hold-y (ci=passing merge=CONFLICTING)$' <<<"$out"; then
  PASS=$((PASS + 1)); echo "  PASS: tick emits 'review-stall: held tactic-y -> conflict ...'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: tick emits 'review-stall: held tactic-y -> conflict ...'"
  echo "    actual stdout: '$out'"
fi
sel_tick_teardown

# Silent sweep (the default): no `review-stall: ` line at all, so every other
# tick test stays byte-identical.
echo "Test: select-tick review-stall wiring → silent sweep emits no line"
sel_tick_setup
out=$(run_sel_tick) || true
TOTAL=$((TOTAL + 1))
if ! grep -q '^review-stall: ' <<<"$out"; then
  PASS=$((PASS + 1)); echo "  PASS: no 'review-stall:' line when the sweep is silent"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: no 'review-stall:' line when the sweep is silent"
  echo "    actual stdout: '$out'"
fi
sel_tick_teardown

# --- #1495: dirty main → sync-failed, reseed armed, counter bumped -----------
echo "Test: select-tick failing merge under cap → sync-failed, counter bumped"
sel_tick_setup
export FAKE_GIT_MERGE_FAIL=1   # local main cannot ff-merge origin/main
# Default sessions = UNKNOWN (fall through); no sync-broken latch; counter absent (=0).
out=$(run_sel_tick) || true
assert_eq "sync-failed: decision line" "sync-failed" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "sync-failed: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "sync-failed: reseed armed" "present" \
  "$([ -f "$TMPDIR_TEST/logs/schedule-reseed.log" ] && echo present || echo absent)"
assert_eq "sync-failed: counter bumped to 1" "1" \
  "$(cat "$DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE")"
assert_eq "sync-failed: escalate NOT called" "absent" \
  "$([ -f "$TMPDIR_TEST/logs/escalate-sync-broken.log" ] && echo present || echo absent)"
sel_tick_teardown

# --- Decision A (bounded main-checkout defer) --------------------------------
# The rows below are the REGISTERED (--all) cwd-keyed view:
# sessionId<TAB>id<TAB>name<TAB>state<TAB>status. Session ids are hex-and-dash
# shaped on purpose — _standdown_session_idle_s validates that shape before it
# globs for the transcript.

# --- #1495: live sync-repair session → defer (sync-repair-pending), merge NOT run ---
echo "Test: select-tick working session in main → sync-repair-pending, merge deferred"
sel_tick_setup
export SEL_MAIN_SESSIONS_RC=0
export SEL_MAIN_SESSIONS_TSV=$'aaa1-bbb2\tjob1\tsync-repair\tworking\tbusy'
out=$(run_sel_tick) || true
assert_eq "defer: decision line" "sync-repair-pending" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "defer: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "defer: reseed armed" "present" \
  "$([ -f "$TMPDIR_TEST/logs/schedule-reseed.log" ] && echo present || echo absent)"
assert_eq "defer: merge NOT attempted" "absent" \
  "$([ -f "$STUB_DIR/git-merge.log" ] && echo present || echo absent)"
assert_eq "defer: counter untouched" "absent" \
  "$([ -f "$DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE" ] && echo present || echo absent)"
sel_tick_teardown

# A `blocked` session INSIDE the grace still defers: it may yet come back.
echo "Test: select-tick blocked session in main, idle < grace → sync-repair-pending"
sel_tick_setup
export SEL_MAIN_SESSIONS_RC=0
export SEL_MAIN_SESSIONS_TSV=$'aaa1-bbb2\tjob1\tsync-repair\tblocked\tidle'
sel_tick_transcript aaa1-bbb2 60
export DISPATCH_MAIN_CHECKOUT_STUCK_GRACE_S=1800
out=$(run_sel_tick) || true
assert_eq "grace-defer: decision line" "sync-repair-pending" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "grace-defer: merge NOT attempted" "absent" \
  "$([ -f "$STUB_DIR/git-merge.log" ] && echo present || echo absent)"
assert_eq "grace-defer: counter untouched" "absent" \
  "$([ -f "$DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE" ] && echo present || echo absent)"
sel_tick_teardown

# THE INCIDENT REGRESSION RATCHET. A `blocked` session past the grace must NOT
# hold the tick any longer: the old name-and-status rule read its coarse status
# as `idle` (never `stopped`), deferred forever, and so never bumped the
# counter — making the 3-attempt sync-broken cap structurally unreachable.
echo "Test: select-tick blocked session in main, idle >= grace → falls through, sync-failed"
sel_tick_setup
export SEL_MAIN_SESSIONS_RC=0
export SEL_MAIN_SESSIONS_TSV=$'aaa1-bbb2\tjob1\tsync-repair\tblocked\tidle'
sel_tick_transcript aaa1-bbb2 7200
export DISPATCH_MAIN_CHECKOUT_STUCK_GRACE_S=1800
export FAKE_GIT_MERGE_FAIL=1
out=$(run_sel_tick) || true
assert_eq "stuck-fallthrough: decision line" "sync-failed" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "stuck-fallthrough: merge attempted" "present" \
  "$([ -f "$STUB_DIR/git-merge.log" ] && echo present || echo absent)"
assert_eq "stuck-fallthrough: counter bumped to 1" "1" \
  "$(cat "$DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE")"
DLOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "stuck-fallthrough: decision log attributes the declined defer" \
  "main-checkout-stuck:sync-repair:blocked" \
  "$(tail -n 1 "$DLOG_FILE" | jq -r .skip_reason)"
sel_tick_teardown

# ... and on the 3rd attempt the cap is REACHED — the escalation the unbounded
# defer could never get to.
echo "Test: select-tick blocked session past grace at the cap → sync-broken, latch set"
sel_tick_setup
export SEL_MAIN_SESSIONS_RC=0
export SEL_MAIN_SESSIONS_TSV=$'aaa1-bbb2\tjob1\tsync-repair\tblocked\tidle'
sel_tick_transcript aaa1-bbb2 7200
export DISPATCH_MAIN_CHECKOUT_STUCK_GRACE_S=1800
export FAKE_GIT_MERGE_FAIL=1
printf '3\n' > "$DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE"   # two prior ticks bumped it
out=$(run_sel_tick) || true
assert_eq "stuck-cap: decision line" "sync-broken" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "stuck-cap: repo-health --set-sync-broken invoked" "1" \
  "$(grep -cF -- '--reason merge-failed' "$TMPDIR_TEST/logs/repo-health-set-sync-broken.log")"
sel_tick_teardown

# The REGISTERED-view-only case: a `stopped`/`done` row is INVISIBLE to the
# ACTIVE view the old rule read, so the old code could not see this holder at
# all. A second, distinct regression ratchet.
echo "Test: select-tick stopped session in main past grace → falls through to merge"
sel_tick_setup
export SEL_MAIN_SESSIONS_RC=0
export SEL_MAIN_SESSIONS_TSV=$'aaa1-bbb2\tjob1\tsync-repair\tdone\t'
sel_tick_transcript aaa1-bbb2 7200
export DISPATCH_MAIN_CHECKOUT_STUCK_GRACE_S=1800
export FAKE_GIT_MERGE_FAIL=1
out=$(run_sel_tick) || true
assert_eq "stopped-defer: decision line" "sync-failed" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "stopped-defer: merge attempted" "present" \
  "$([ -f "$STUB_DIR/git-merge.log" ] && echo present || echo absent)"
sel_tick_teardown

# UNKNOWN idle (no transcript staged) is fail-SAFE: defer, never fall through.
echo "Test: select-tick session in main with no transcript → sync-repair-pending"
sel_tick_setup
export SEL_MAIN_SESSIONS_RC=0
export SEL_MAIN_SESSIONS_TSV=$'aaa1-bbb2\tjob1\tsync-repair\tblocked\tidle'
export FAKE_GIT_MERGE_FAIL=1
out=$(run_sel_tick) || true
assert_eq "idle-unknown: decision line" "sync-repair-pending" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "idle-unknown: merge NOT attempted" "absent" \
  "$([ -f "$STUB_DIR/git-merge.log" ] && echo present || echo absent)"
sel_tick_teardown

# Daemon UNKNOWN (rc 1) is fail-OPEN, unchanged: the tick proceeds to the merge.
echo "Test: select-tick registered session view UNKNOWN → falls through to merge"
sel_tick_setup
export SEL_MAIN_SESSIONS_RC=1
export FAKE_GIT_MERGE_FAIL=1
out=$(run_sel_tick) || true
assert_eq "daemon-unknown: decision line" "sync-failed" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "daemon-unknown: merge attempted" "present" \
  "$([ -f "$STUB_DIR/git-merge.log" ] && echo present || echo absent)"
sel_tick_teardown

# A definite EMPTY main-checkout session list is not a defer either.
echo "Test: select-tick no sessions in main → falls through to merge"
sel_tick_setup
export SEL_MAIN_SESSIONS_RC=0
export FAKE_GIT_MERGE_FAIL=1
out=$(run_sel_tick) || true
assert_eq "no-sessions: decision line" "sync-failed" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "no-sessions: merge attempted" "present" \
  "$([ -f "$STUB_DIR/git-merge.log" ] && echo present || echo absent)"
sel_tick_teardown

# --- #1495: failing merge at attempt cap → escalate + sync-broken, no bump ----
echo "Test: select-tick failing merge at cap → escalate, sync-broken, counter unchanged"
sel_tick_setup
printf '3\n' > "$DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE"   # already at the cap
export FAKE_GIT_MERGE_FAIL=1
# No sync-broken latch open yet → the cap branch escalates (find-or-create).
out=$(run_sel_tick) || true
assert_eq "cap-escalate: decision line" "sync-broken" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "cap-escalate: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "cap-escalate: reseed armed" "present" \
  "$([ -f "$TMPDIR_TEST/logs/schedule-reseed.log" ] && echo present || echo absent)"
assert_eq "cap-escalate: escalate called" "present" \
  "$([ -f "$TMPDIR_TEST/logs/escalate-sync-broken.log" ] && echo present || echo absent)"
assert_eq "cap-escalate: --reason merge-failed passed" "1" \
  "$(grep -cF -- '--reason merge-failed' "$TMPDIR_TEST/logs/escalate-args.log")"
assert_eq "cap-escalate: counter unchanged (no bump on terminal branch)" "3" \
  "$(cat "$DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE")"
sel_tick_teardown

# --- #1546: failing fetch at attempt cap → escalate --reason fetch-failed ------
echo "Test: select-tick failing fetch at cap → escalate, sync-broken, --reason fetch-failed"
sel_tick_setup
printf '3\n' > "$DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE"   # already at the cap
export FAKE_GIT_FETCH_FAIL=1   # cannot reach origin/main (fetch fails, no merge)
# No sync-broken latch open yet → the cap branch escalates (find-or-create).
out=$(run_sel_tick) || true
assert_eq "cap-fetch-escalate: decision line" "sync-broken" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "cap-fetch-escalate: escalate called" "present" \
  "$([ -f "$TMPDIR_TEST/logs/escalate-sync-broken.log" ] && echo present || echo absent)"
assert_eq "cap-fetch-escalate: --reason fetch-failed passed" "1" \
  "$(grep -cF -- '--reason fetch-failed' "$TMPDIR_TEST/logs/escalate-args.log")"
assert_eq "cap-fetch-escalate: counter unchanged (no bump on terminal branch)" "3" \
  "$(cat "$DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE")"
sel_tick_teardown

# --- #1495: latch already open + failing merge → sync-broken, NO escalate -----
echo "Test: select-tick failing merge with open latch → sync-broken, no escalate/bump"
sel_tick_setup
# The latch is already set: repo-health --sync-broken-latched reports `latched`,
# so the failing-merge branch returns sync-broken WITHOUT escalating or bumping.
export SEL_SYNC_BROKEN_LATCHED=latched
export FAKE_GIT_MERGE_FAIL=1
out=$(run_sel_tick) || true
assert_eq "latched: decision line" "sync-broken" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "latched: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "latched: escalate NOT called" "absent" \
  "$([ -f "$TMPDIR_TEST/logs/escalate-sync-broken.log" ] && echo present || echo absent)"
assert_eq "latched: counter NOT bumped (latched branch returns first)" "absent" \
  "$([ -f "$DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE" ] && echo present || echo absent)"
sel_tick_teardown

# --- #1495: clean merge + open latch → counter reset, latch closed -----------
echo "Test: select-tick clean merge with open latch → reset counter, close latch"
sel_tick_setup
printf '[{"number":77}]\n' > "$STUB_DIR/sync-broken-open.json"   # stale latch to close
printf '2\n' > "$DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE"   # stale counter to reset
# Merge succeeds (default, no FAKE_GIT_MERGE_FAIL) → fall through to select-target
# (default `empty`).
out=$(run_sel_tick) || true
assert_eq "recover: decision line" "empty" "$(printf '%s\n' "$out" | tail -n 1)"
# REST close (#2256): POST .../issues/77/comments (re-arm message) + PATCH
# .../issues/77 (state=closed).
assert_eq "recover: latch PATCH-closed" "present" \
  "$(grep -q 'PATCH.*issues/77' "$STUB_DIR/gh-issue-close-rest-calls.log" 2>/dev/null && echo present || echo absent)"
assert_eq "recover: latch close carries the re-arm comment" "present" \
  "$(grep -q 'issues/77/comments -f body=local main ff-merges clean again; closing the sync-broken latch' "$STUB_DIR/gh-issue-comment-rest-calls.log" 2>/dev/null && echo present || echo absent)"
assert_eq "recover: counter reset" "absent" \
  "$([ -f "$DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE" ] && echo present || echo absent)"
sel_tick_teardown

# --- jit-reminder → passthrough + lock RELEASED (spawned as a bg job) --------
echo "Test: select-tick jit-reminder → passthrough, lock released"
sel_tick_setup
# Graph queue empty; dispatch-jit-scan (Step 3b) reports a due reminder → the
# tick emits it and releases the lock (spawned downstream as a bg job).
export SEL_JIT_SCAN="jit-reminder owner/repo 42 PVT_x ITEM_y"
out=$(run_sel_tick) || true
assert_eq "jit-reminder: decision line" "jit-reminder owner/repo 42 PVT_x ITEM_y" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "jit-reminder: lock released" "" \
  "$(cat "$DISPATCH_LOCK_FILE")"
sel_tick_teardown

# --- sync failure on main → release + sync-failed ----------------------------
echo "Test: select-tick sync failure on main → sync-failed, lock released"
sel_tick_setup
export FAKE_GIT_FETCH_FAIL=1
out=$(run_sel_tick) || true
assert_eq "sync-failed: decision line" "sync-failed" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "sync-failed: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
sel_tick_teardown

# --- off-main: main-sync skipped (fetch-fail does NOT trigger sync-failed) ----
echo "Test: select-tick off main skips sync (fetch-fail ignored)"
sel_tick_setup
export FAKE_GIT_BRANCH="707-some-branch"
export FAKE_GIT_FETCH_FAIL=1
out=$(run_sel_tick) || true
assert_eq "off-main: reaches selection (empty, not sync-failed)" "empty" \
  "$(printf '%s\n' "$out" | tail -n 1)"
sel_tick_teardown

# --- on-main: a healthy tick passes the primary-checkout guard (QA finding 7) --
# The main-sync block runs assert_primary_checkout_on_main "$MAIN_WORKTREE" before
# the ff-only merge; a violation short-circuits the tick to `exit 2` with
# disposition=internal-error / skip_reason=primary-checkout-not-on-main and emits
# NO stdout decision line. This pins the guard's NO-FALSE-HALT property at the
# WIRING level (the isolated helper is already covered by
# test-primary-checkout-guard.sh): a default on-main tick (FAKE_GIT_BRANCH unset →
# BRANCH=main AND the guard target resolves to 'main', so the guard passes
# silently) must clear the guard and reach normal selection, NOT be halted. This
# case FAILS if a future change mis-wires the guard to halt healthy on-main ticks.
echo "Test: select-tick on-main tick passes the primary-checkout guard (not halted)"
sel_tick_setup
if out=$(run_sel_tick); then rc=0; else rc=$?; fi
assert_eq "guard-pass: exit 0 (not guard's exit 2)" "0" "$rc"
assert_eq "guard-pass: reaches selection (empty, guard did not halt)" "empty" \
  "$(printf '%s\n' "$out" | tail -n 1)"
# Structured decision-log: the guard-fired path would stamp disposition
# internal-error + skip_reason primary-checkout-not-on-main. A clean pass is
# disposition=empty / skip_reason empty (same jq pattern as the empty-queue test).
DLOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "guard-pass: disposition not internal-error" "empty" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.disposition')"
assert_eq "guard-pass: skip_reason not primary-checkout-not-on-main" "" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.skip_reason')"
sel_tick_teardown

# --- on-main but primary checkout off-main: the guard HALTS the tick ----------
# Inverse of the guard-PASS case above: this pins the guard's ACTUAL-HALT property
# at the wiring level. FAKE_GIT_BRANCH is left unset so BRANCH=main and the
# main-sync block IS entered, but the dedicated FAKE_GIT_PRIMARY_BRANCH knob drives
# the guard's target (MAIN_WORKTREE, checked via `-C <path> symbolic-ref --short
# HEAD`) off `main` — impossible with the old single knob, which coupled BRANCH and
# the guard target. assert_primary_checkout_on_main must fire: exit 2, NO normal
# selection decision line on stdout, and a decision-log record stamped
# disposition=internal-error / skip_reason=primary-checkout-not-on-main. This case
# FAILS if a future change mis-wires the guard to no-op on a drifted primary checkout.
echo "Test: select-tick on-main but primary checkout off-main → guard halts (exit 2)"
sel_tick_setup
export FAKE_GIT_PRIMARY_BRANCH="707-some-branch"
# The script runs under `set -e`; this is the first sel-tick case where the
# tick legitimately exits non-zero, so the substitution must be shielded or
# set -e kills the whole suite before the assertions below ever run (mirrors
# test-primary-checkout-guard.sh's set +e / set -e bracketing).
set +e
if out=$(run_sel_tick); then rc=0; else rc=$?; fi
set -e
assert_eq "guard-halt: exit 2 (the guard's exit)" "2" "$rc"
# The guard short-circuits before selection: the tail stdout line is NOT a decision
# line (in particular NOT the on-main `empty` the guard-pass case asserts) — it is
# empty, same tail pattern as that case but inverted.
assert_eq "guard-halt: no selection decision line (tail not 'empty')" "" \
  "$(printf '%s\n' "$out" | tail -n 1)"
# Structured decision-log: last record carries the guard's disposition + reason
# (same jq pattern as the guard-pass case, opposite values).
DLOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "guard-halt: disposition internal-error" "internal-error" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.disposition')"
assert_eq "guard-halt: skip_reason primary-checkout-not-on-main" "primary-checkout-not-on-main" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.skip_reason')"
sel_tick_teardown

# --- JIT created lines are passed through, prefixed --------------------------
echo "Test: select-tick passes JIT output through prefixed"
sel_tick_setup
cat > "$TMPDIR_TEST/dispatch-jit-engine" <<'FAKE'
#!/usr/bin/env bash
echo "weekly-review: created #42"
echo "standup: debounced"
FAKE
chmod +x "$TMPDIR_TEST/dispatch-jit-engine"
out=$(run_sel_tick) || true
assert_eq "jit passthrough: created line prefixed" "1" \
  "$(printf '%s\n' "$out" | grep -cF 'jit: weekly-review: created #42')"
assert_eq "jit passthrough: debounced line prefixed" "1" \
  "$(printf '%s\n' "$out" | grep -cF 'jit: standup: debounced')"
assert_eq "jit passthrough: decision still last" "empty" \
  "$(printf '%s\n' "$out" | tail -n 1)"
sel_tick_teardown

# --- busy lock → busy, nothing acquired, nothing released --------------------
echo "Test: select-tick busy lock → busy, foreign holder untouched"
sel_tick_setup
# Pre-fill the lock with a DIFFERENT, live session so --wait gives up as busy.
printf '%s\n' "other-live-session" > "$DISPATCH_LOCK_FILE"
cat > "$TMPDIR_TEST/fake-claude" <<'FAKE'
#!/usr/bin/env bash
echo '[{"sessionId":"other-live-session","pid":2,"status":"busy","name":"x","cwd":""}]'
FAKE
chmod +x "$TMPDIR_TEST/fake-claude"
out=$(run_sel_tick) || true
assert_eq "busy: decision line" "busy" "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "busy: foreign holder untouched (not released)" "other-live-session" \
  "$(cat "$DISPATCH_LOCK_FILE")"
sel_tick_teardown

# --- any positional arg → usage error, exit 2 (rejected before the second) ---
# Explicit issue/PR targeting was removed with the legacy issue lane; the FIRST
# positional is rejected at arg-parse time (before the lock or any side-effect
# step), so a second trailing arg is never even inspected.
echo "Test: select-tick positional arg → exit 2"
sel_tick_setup
err=$("$TMPDIR_TEST/dispatch-select-tick" 1 2 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err" in
  *"explicit issue/PR targeting"*"EXIT=2") status="ok" ;;
  *) status="bad: $err" ;;
esac
assert_eq "positional arg → usage error, exit 2" "ok" "$status"
sel_tick_teardown

# --- TARGET_N validation: non-numeric → release + exit 2 (#1315) -------------
# dispatch-target-workers always prints a number in count mode (its own fallback
# to 1), so a non-numeric TARGET_N here means a broken environment. The guard
# must release the lock and exit 2 with a clear error rather than letting the
# arithmetic gate throw "operand expected" and silently skip the cap.
echo "Test: select-tick non-numeric TARGET_N → release + exit 2"
sel_tick_setup
export SEL_TARGET_N="not-a-number"
err=$("$TMPDIR_TEST/dispatch-select-tick" 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err" in
  *"dispatch-target-workers"*"non-numeric"*"EXIT=2") status="ok" ;;
  *) status="bad: $err" ;;
esac
assert_eq "non-numeric TARGET_N → error + exit 2" "ok" "$status"
assert_eq "non-numeric TARGET_N: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
DLOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "non-numeric TARGET_N: decision log .max_workers resolved before the guard" "8" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.max_workers')"
sel_tick_teardown

# --- TARGET_N validation: empty stdout → release + exit 2 (#1315) ------------
# A crashed dispatch-target-workers prints nothing; empty stdout also fails the
# `^[0-9]+$` regex, so no separate exit-code check is needed. Override the stub
# to emit nothing on the no-arg query (keeping --exhausted intact).
echo "Test: select-tick empty TARGET_N → release + exit 2"
sel_tick_setup
cat > "$TMPDIR_TEST/dispatch-target-workers" <<'FAKE'
#!/usr/bin/env bash
if [[ "$1" == "--exhausted" ]]; then echo "${SEL_EXHAUSTED:-ok}"; exit 0; fi
# no-arg: emit nothing (simulate a crashed dispatch-target-workers)
exit 0
FAKE
chmod +x "$TMPDIR_TEST/dispatch-target-workers"
err=$("$TMPDIR_TEST/dispatch-select-tick" 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err" in
  *"dispatch-target-workers"*"non-numeric"*"EXIT=2") status="ok" ;;
  *) status="bad: $err" ;;
esac
assert_eq "empty TARGET_N → error + exit 2" "ok" "$status"
assert_eq "empty TARGET_N: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
sel_tick_teardown

# --- TARGET_N validation: 0 is valid, must NOT trip the guard (#1315) --------
# The regex is `^[0-9]+$` (not `^[1-9]`) — TARGET_N=0 is a legitimate value (the
# gate compares LIVE_COUNT >= 0). Regression guard for that decision: a 0 target
# proceeds normally (at-cap concurrency-cap here), it does NOT exit 2.
echo "Test: select-tick TARGET_N=0 passes the guard (no exit 2)"
sel_tick_setup
export SEL_LIVE_COUNT=0 SEL_TARGET_N=0 SEL_EXHAUSTED=ok
if out=$(run_sel_tick); then rc=0; else rc=$?; fi
assert_eq "TARGET_N=0: exit 0 (guard not tripped)" "0" "$rc"
assert_eq "TARGET_N=0: decision line" "concurrency-cap" \
  "$(printf '%s\n' "$out" | tail -n 1)"
sel_tick_teardown

# --- gate at cap, not exhausted, no priority item → concurrency-cap ----------
# At cap the gate no longer hard-stops blindly: it first checks --exhausted (ok
# here) then probes the graph pace-exempt lane (empty here) and a newly-red main
# (green here). No surviving bypass → the unchanged hard cap. The normal Step-3a
# graph selection (graph-select.log) does NOT run, but the pace-exempt probe
# (graph-select-pace-exempt.log) DOES. The legacy --priority-only probe is gone.
echo "Test: select-tick at cap, not exhausted, no priority item → concurrency-cap"
sel_tick_setup
export SEL_LIVE_COUNT=2 SEL_TARGET_N=1 SEL_EXHAUSTED=ok
out=$(run_sel_tick) || true
assert_eq "cap: decision line" "concurrency-cap" "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "cap: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "cap: reseed scheduled" "called" "$(cat "$TMPDIR_TEST/logs/schedule-reseed.log" 2>/dev/null)"
assert_eq "cap: graph pace-exempt probe ran (returned empty)" "1" \
  "$([ -f "$TMPDIR_TEST/logs/graph-select-pace-exempt.log" ] && echo 1 || echo 0)"
assert_eq "cap: normal graph selection did NOT run" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-select.log" ] && echo 1 || echo 0)"
# AC5 decision-log: verify a record was appended with the correct disposition+site
DLOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "cap: decision log exists" "1" "$([ -f "$DLOG_FILE" ] && echo 1 || echo 0)"
assert_eq "cap: decision log has at least 1 line" "1" \
  "$([ -f "$DLOG_FILE" ] && [ "$(wc -l < "$DLOG_FILE")" -ge 1 ] && echo 1 || echo 0)"
assert_eq "cap: decision log last record .disposition" "concurrency-cap" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.disposition')"
assert_eq "cap: decision log last record .site" "select-tick" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.site')"
sel_tick_teardown

# --- concurrency-cap tick still runs reconcile (Step 1d before the gate) -----
# Acceptance criterion: reconcile runs even on a concurrency-cap tick.
echo "Test: select-tick concurrency-cap tick runs reconcile, emits ready: lines"
sel_tick_setup
export SEL_LIVE_COUNT=2 SEL_TARGET_N=1 SEL_EXHAUSTED=ok
# Write a promotable PR fixture: draft + dispatch:reviewed + passing CI + MERGEABLE.
# CI verdict now derives from the REST check-runs of headRefOid (#1601).
printf '%s' "{\"check_runs\": $GREEN_ROLLUP}" > "$STUB_DIR/check-runs-sha42.json"
printf '[{"number":42,"isDraft":true,"mergeable":"MERGEABLE","headRefOid":"sha42","labels":[{"name":"dispatch:reviewed"}]}]\n' \
  > "$STUB_DIR/reconcile-pr-list.json"
out=$(run_sel_tick) || true
assert_eq "cap-reconcile: decision line still concurrency-cap" "concurrency-cap" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "cap-reconcile: ready: promoted line appears before decision" "1" \
  "$(printf '%s\n' "$out" | grep -c 'ready: promoted #42')"
assert_eq "cap-reconcile: gh pr ready was called" "present" \
  "$([ -f "$STUB_DIR/gh-pr-ready.log" ] && echo present || echo absent)"
sel_tick_teardown

# --- gate under cap → gap = target − live on the decision line ---------------
echo "Test: select-tick under cap → gap = target − live on the decision line"
sel_tick_setup
export SEL_LIVE_COUNT=1 SEL_TARGET_N=4
export SEL_GRAPH_TARGET="node t1 tactic implement"
out=$(run_sel_tick) || true
assert_eq "under-cap: decision line" "graph 1 t1:tactic:implement" "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "under-cap: gap drives the graph fan-out width (4 − 1 = 3)" "--top 3" \
  "$(cat "$TMPDIR_TEST/logs/graph-select.log")"
DLOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "under-cap: decision log .target_n" "4" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.target_n')"
assert_eq "under-cap: decision log .max_workers" "8" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.max_workers')"
sel_tick_teardown

# --- throttled ceiling shape is visible in the decision log (2026-08-01) -----
# Before Unit 1, a throttled ceiling (MAX_WORKERS < the usual default) was
# invisible on the decision line — only target_n appeared, so an operator
# reading the log could not tell a deliberately-throttled ceiling apart from a
# normal low pace-curve target. This locks in that the ceiling now appears
# alongside target_n under cap.
echo "Test: select-tick throttled ceiling (2026-08-01 shape) is visible in the decision log"
sel_tick_setup
export SEL_LIVE_COUNT=0 SEL_TARGET_N=1 SEL_MAX_WORKERS=1
export SEL_GRAPH_TARGET="node t1 tactic implement"
out=$(run_sel_tick) || true
DLOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "throttled-ceiling: decision log .target_n" "1" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.target_n')"
assert_eq "throttled-ceiling: decision log .max_workers" "1" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.max_workers')"
sel_tick_teardown

# --- daemon UNKNOWN → fails CLOSED to concurrency-cap, reseed armed ----------
# (tactic-graph-router-live-worker-read-robust Unit 2 flips this from the
# prior fail-OPEN "gap stays 1" behavior.) The busy-worker read failing means
# true live occupancy cannot be determined — per lib-claude-agents.sh's
# EMPTY-READ CORROBORATION, this now includes an uncorroborated `[]` payload,
# not just a hard error. Assuming headroom here risks a duplicate worker on an
# already-occupied worktree, so the gate defers via the at-cap path: release
# the lock, schedule the reseed, and emit concurrency-cap — never a `graph`
# selection.
echo "Test: select-tick daemon UNKNOWN → fails closed to concurrency-cap, reseed armed"
sel_tick_setup
export SEL_LIVE_COUNT_FAIL=1 SEL_TARGET_N=4
export SEL_GRAPH_TARGET="node t1 tactic implement"
out=$(run_sel_tick) || true
assert_eq "fail-closed: decision line" "concurrency-cap" "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "fail-closed: normal graph selection did NOT run" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-select.log" ] && echo 1 || echo 0)"
assert_eq "fail-closed: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "fail-closed: reseed scheduled" "called" \
  "$(cat "$TMPDIR_TEST/logs/schedule-reseed.log" 2>/dev/null)"
DLOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "fail-closed: decision log records skip_reason live-read-unverified" "live-read-unverified" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.skip_reason')"
sel_tick_teardown

# --- uncorroborated empty [] registry read → same fail-closed disposition ---
# Paired with the SEL_LIVE_COUNT_FAIL case above, and the shape that actually
# matches the originating incident (#lib-claude-agents EMPTY-READ
# CORROBORATION): a blocked socket read (sandbox, network-namespace isolation)
# still exits 0 and prints `[]` — byte-identical to a genuine "no live
# sessions" — unless corroborated by a `claude daemon` process probe. This
# test's own sel_tick_setup fake for lib-claude-agents.sh is a hand-written
# stand-in (SEL_LIVE_COUNT/SEL_LIVE_COUNT_FAIL) that never exercises the real
# corroboration logic at all, so this case swaps in the REAL
# lib-claude-agents.sh and drives it end to end: a fake `claude` prints the
# exact string `[]` (exit 0) while CLAUDE_AGENTS_PGREP_CMD is stubbed to fail
# (daemon unreachable), so claude_agents_count_busy_workers genuinely returns
# 1 (UNKNOWN) via its own corroboration check — not a test-only override.
echo "Test: select-tick uncorroborated empty [] registry read → fails closed to concurrency-cap, same as a hard failure"
sel_tick_setup
cp "$SCRIPT_DIR/lib-claude-agents.sh" "$TMPDIR_TEST/lib-claude-agents.sh"
cat > "$TMPDIR_TEST/fake-claude-empty" <<'FAKE'
#!/usr/bin/env bash
echo '[]'
FAKE
chmod +x "$TMPDIR_TEST/fake-claude-empty"
export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/fake-claude-empty"
cat > "$TMPDIR_TEST/pgrep-daemon-unreachable" <<'FAKE'
#!/usr/bin/env bash
exit 1
FAKE
chmod +x "$TMPDIR_TEST/pgrep-daemon-unreachable"
export CLAUDE_AGENTS_PGREP_CMD="$TMPDIR_TEST/pgrep-daemon-unreachable"
export SEL_TARGET_N=4 SEL_GRAPH_TARGET="node t1 tactic implement"
out=$(run_sel_tick) || true
assert_eq "uncorroborated-empty: decision line" "concurrency-cap" "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "uncorroborated-empty: normal graph selection did NOT run" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-select.log" ] && echo 1 || echo 0)"
assert_eq "uncorroborated-empty: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "uncorroborated-empty: reseed scheduled" "called" \
  "$(cat "$TMPDIR_TEST/logs/schedule-reseed.log" 2>/dev/null)"
DLOG_FILE2="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "uncorroborated-empty: decision log records skip_reason live-read-unverified" "live-read-unverified" \
  "$(tail -n1 "$DLOG_FILE2" | jq -r '.skip_reason')"
sel_tick_teardown

# --- effective_live = busy + reservations drives the gap --------------------
# The gate counts reservation markers on top of busy workers. With 1 busy and 1
# surviving reservation against target 4, gap = 4 − 2 = 2. The reservation only
# survives the pre-count sweep because its session= id appears as a live session
# in SEL_AGENTS_TSV and its basename is NOT a live session name.
echo "Test: select-tick gap counts busy + reservations (effective_live)"
sel_tick_setup
export SEL_LIVE_COUNT=1 SEL_TARGET_N=4
printf 'session=resv-1\nissue=900\ntimestamp=2026-01-01T00:00:00Z\n' \
  > "$DISPATCH_RESERVATION_DIR/900-test"
export SEL_AGENTS_TSV=$'resv-1\tbusy\tworkerX'
export SEL_GRAPH_TARGET="node t1 tactic implement"
out=$(run_sel_tick) || true
assert_eq "effective-live: decision line" "graph 1 t1:tactic:implement" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "effective-live: gap = 4 − (1 busy + 1 reserved) = 2 drives graph --top" "--top 2" \
  "$(cat "$TMPDIR_TEST/logs/graph-select.log")"
sel_tick_teardown

# --- effective_live short-circuits the concurrency cap -----------------------
# 1 busy + 1 surviving reservation == target 2 → concurrency-cap, no selection
# work, lock released, reseed scheduled, and the router message surfaces the
# busy/reserved split.
echo "Test: select-tick effective_live (busy + reserved) hits the concurrency cap"
sel_tick_setup
export SEL_LIVE_COUNT=1 SEL_TARGET_N=2
printf 'session=resv-1\nissue=900\ntimestamp=2026-01-01T00:00:00Z\n' \
  > "$DISPATCH_RESERVATION_DIR/900-test"
export SEL_AGENTS_TSV=$'resv-1\tbusy\tworkerX'
out=$(run_sel_tick) || true
assert_eq "effective-cap: decision line" "concurrency-cap" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "effective-cap: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "effective-cap: reseed scheduled" "called" \
  "$(cat "$TMPDIR_TEST/logs/schedule-reseed.log" 2>/dev/null)"
assert_eq "effective-cap: router message surfaces the busy/reserved split" "1" \
  "$(printf '%s\n' "$out" | grep -cF 'effective live (1 busy + 1 reserved)')"
assert_eq "effective-cap: normal graph selection did NOT run" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-select.log" ] && echo 1 || echo 0)"
assert_eq "effective-cap: graph pace-exempt probe ran (returned empty)" "1" \
  "$([ -f "$TMPDIR_TEST/logs/graph-select-pace-exempt.log" ] && echo 1 || echo 0)"
sel_tick_teardown

# --- empty ledger is behavior-preserving (gap == pre-ledger gate) ------------
# With no reservations and an empty live-session list, RESV=0, so the gap is
# exactly target − busy — identical to the pre-ledger gate.
echo "Test: select-tick empty ledger → gap unchanged from pre-ledger gate"
sel_tick_setup
export SEL_LIVE_COUNT=1 SEL_TARGET_N=4
export SEL_GRAPH_TARGET="node t1 tactic implement"
out=$(run_sel_tick) || true
assert_eq "empty-ledger: decision line" "graph 1 t1:tactic:implement" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "empty-ledger: gap = 4 − 1 (RESV=0) drives graph --top" "--top 3" \
  "$(cat "$TMPDIR_TEST/logs/graph-select.log")"
sel_tick_teardown

# --- --bypass-cap is gone: unknown flag → usage error, exit 2 ----------------
echo "Test: select-tick --bypass-cap removed → unknown flag, exit 2"
sel_tick_setup
err=$("$TMPDIR_TEST/dispatch-select-tick" --bypass-cap 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err" in
  *"unknown flag"*"EXIT=2") status="ok" ;;
  *) status="bad: $err" ;;
esac
assert_eq "removed flag → unknown flag error, exit 2" "ok" "$status"
sel_tick_teardown

# --- --manual context-dependent fan-out (#1458, headroom overage) -----------
# A bare human-typed /dispatch fans out enough workers to cover available graph
# work eagerly while honoring the MAX_WORKERS ceiling as its governing target
# below the ceiling. It OVERRIDES the pace-curve throttle (a budget pause to
# TARGET_N=0 still fans out) and, per human-dispatch-is-sovereign, always
# launches its one highest-ranking-available node even at the ceiling — a
# bounded, deliberate max_concurrent_workers + 1 overage. Only genuine
# rate-limit token exhaustion (--exhausted) still blocks a manual dispatch
# outright:
#   HEADROOM = max(0, MAX_WORKERS − LIVE_COUNT)
#   GAP      = max(0, TARGET_N − LIVE_COUNT)
#   SPAWN_N  = max(1, min(max(GAP, 1), HEADROOM))
# The legacy priority-LABELED bypass count (N_PRIO) died with the legacy
# selector, so N_PRIO is permanently 0 and SPAWN_N is driven by the pace-curve
# gap alone, clamped by HEADROOM, with a floor of exactly one node re-asserting
# itself past the ceiling when HEADROOM is 0. SPAWN_N becomes the `--top` the
# graph selector fans out over: with a node available (SEL_GRAPH_TARGET), the
# tick emits a `graph` decision and graph-select-target is invoked
# `--top SPAWN_N` (logged to graph-select.log). Defaults are LIVE=0, MAX=8.

# Case 1: gap0. GAP=0 → SPAWN_N=min(8,max(0,1))=1 → graph --top 1.
echo "Test: select-tick --manual gap0 → graph fan-out --top 1"
sel_tick_setup
export SEL_TARGET_N=0 SEL_GRAPH_TARGET="node t1 tactic implement"
out=$(run_sel_tick --manual)
assert_eq "manual-gap0: graph decision" "graph 1 t1:tactic:implement" "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "manual-gap0: graph selector called --top 1 (floor)" "--top 1" "$(cat "$TMPDIR_TEST/logs/graph-select.log")"
sel_tick_teardown

# Case 2: gap5. TARGET_N=5, LIVE=0 → GAP=5 → SPAWN_N=min(8,max(5,1))=5 → --top 5.
echo "Test: select-tick --manual gap5 → graph fan-out --top 5"
sel_tick_setup
export SEL_TARGET_N=5 SEL_GRAPH_TARGET="node t1 tactic implement"
out=$(run_sel_tick --manual)
assert_eq "manual-gap5: graph selector called --top 5 (gap drives)" "--top 5" "$(cat "$TMPDIR_TEST/logs/graph-select.log")"
sel_tick_teardown

# Case 3: gap-clamped-to-headroom. LIVE=6, MAX=8 → HEADROOM=2; TARGET_N=10 →
# GAP=4 → SPAWN_N=min(2,max(4,1))=2. HEADROOM is the binding constraint.
echo "Test: select-tick --manual gap-clamped-to-headroom → graph --top 2"
sel_tick_setup
export SEL_LIVE_COUNT=6 SEL_TARGET_N=10 SEL_GRAPH_TARGET="node t1 tactic implement"
out=$(run_sel_tick --manual)
assert_eq "manual-gap-clamped: graph selector called --top 2 (headroom clamps gap)" "--top 2" "$(cat "$TMPDIR_TEST/logs/graph-select.log")"
DLOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "manual-gap-clamped: decision log .max_workers" "8" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.max_workers')"
sel_tick_teardown

# Case 4: at-max-live. LIVE=8 → HEADROOM=0 → per human-dispatch-is-sovereign the
# floor-of-1 re-asserts past the ceiling → SPAWN_N=1 → graph fan-out --top 1
# (one worker deliberately over the MAX_WORKERS ceiling), NO reseed (a manual
# run is one-shot regardless of fan-out width).
echo "Test: select-tick --manual at-max-live (HEADROOM=0) → graph --top 1 (one over ceiling)"
sel_tick_setup
export SEL_LIVE_COUNT=8 SEL_TARGET_N=1 SEL_GRAPH_TARGET="node t1 tactic implement"
out=$(run_sel_tick --manual)
assert_eq "manual-at-max-live: graph decision" "graph 1 t1:tactic:implement" "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "manual-at-max-live: graph selector called --top 1 (floor over ceiling)" "--top 1" "$(cat "$TMPDIR_TEST/logs/graph-select.log")"
assert_eq "manual-at-max-live: no reseed" "0" \
  "$([ -f "$TMPDIR_TEST/logs/schedule-reseed.log" ] && echo 1 || echo 0)"
sel_tick_teardown

# Case 5: exhausted. --exhausted floor → concurrency-cap, lock released, NO reseed.
echo "Test: select-tick --manual exhausted → concurrency-cap, no reseed"
sel_tick_setup
export SEL_EXHAUSTED=exhausted SEL_TARGET_N=0 SEL_GRAPH_TARGET="node t1 tactic implement"
out=$(run_sel_tick --manual)
assert_eq "manual-exhausted: decision line" "concurrency-cap" "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "manual-exhausted: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "manual-exhausted: no reseed" "0" \
  "$([ -f "$TMPDIR_TEST/logs/schedule-reseed.log" ] && echo 1 || echo 0)"
sel_tick_teardown

# Case 6: daemon-UNKNOWN. The busy-worker read fails → the manual math block is
# skipped (gated on that read succeeding). Unit 2 flips this from the prior
# fail-OPEN "GAP stays 1" to fail CLOSED: this deliberately overrides
# human-dispatch-is-sovereign's floor-of-1 (Case 1/4 above) — sovereignty is
# meant to override a KNOWN ceiling, not license spawning while blind to true
# occupancy. No reseed (a manual run is one-shot; the autonomous chain owns
# reseeds) — only the disposition/skip_reason and the absence of a graph
# selection or spawn distinguish this from the autonomous fail-closed path.
echo "Test: select-tick --manual daemon-UNKNOWN → fails closed to concurrency-cap, no reseed"
sel_tick_setup
export SEL_LIVE_COUNT_FAIL=1 SEL_GRAPH_TARGET="node t1 tactic implement"
out=$(run_sel_tick --manual)
assert_eq "manual-daemon-unknown: decision line" "concurrency-cap" "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "manual-daemon-unknown: normal graph selection did NOT run" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-select.log" ] && echo 1 || echo 0)"
assert_eq "manual-daemon-unknown: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "manual-daemon-unknown: no reseed" "0" \
  "$([ -f "$TMPDIR_TEST/logs/schedule-reseed.log" ] && echo 1 || echo 0)"
DLOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "manual-daemon-unknown: decision log records skip_reason manual-live-read-unverified" \
  "manual-live-read-unverified" "$(tail -n1 "$DLOG_FILE" | jq -r '.skip_reason')"
sel_tick_teardown

# Case 6b: --manual paired uncorroborated-empty [] case (mirrors the
# autonomous pairing above). Real lib-claude-agents.sh, fake claude prints
# `[]`, CLAUDE_AGENTS_PGREP_CMD stubbed unreachable -> genuinely UNKNOWN via
# the real corroboration check, not a test-only override. Must fail closed
# the same as the hard-failure Case 6, and still arm NO reseed (manual is
# one-shot).
echo "Test: select-tick --manual uncorroborated empty [] registry read → fails closed to concurrency-cap, no reseed"
sel_tick_setup
cp "$SCRIPT_DIR/lib-claude-agents.sh" "$TMPDIR_TEST/lib-claude-agents.sh"
cat > "$TMPDIR_TEST/fake-claude-empty" <<'FAKE'
#!/usr/bin/env bash
echo '[]'
FAKE
chmod +x "$TMPDIR_TEST/fake-claude-empty"
export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/fake-claude-empty"
cat > "$TMPDIR_TEST/pgrep-daemon-unreachable" <<'FAKE'
#!/usr/bin/env bash
exit 1
FAKE
chmod +x "$TMPDIR_TEST/pgrep-daemon-unreachable"
export CLAUDE_AGENTS_PGREP_CMD="$TMPDIR_TEST/pgrep-daemon-unreachable"
export SEL_GRAPH_TARGET="node t1 tactic implement"
out=$(run_sel_tick --manual)
assert_eq "manual-uncorroborated-empty: decision line" "concurrency-cap" "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "manual-uncorroborated-empty: normal graph selection did NOT run" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-select.log" ] && echo 1 || echo 0)"
assert_eq "manual-uncorroborated-empty: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "manual-uncorroborated-empty: no reseed" "0" \
  "$([ -f "$TMPDIR_TEST/logs/schedule-reseed.log" ] && echo 1 || echo 0)"
DLOG_FILE3="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "manual-uncorroborated-empty: decision log records skip_reason manual-live-read-unverified" \
  "manual-live-read-unverified" "$(tail -n1 "$DLOG_FILE3" | jq -r '.skip_reason')"
sel_tick_teardown

# --- --manual sweeps a stale dead-session reservation before counting -------
# A reservation marker whose session= id is absent from SEL_AGENTS_TSV (i.e.
# no live session claims it) and whose timestamp is well past the boot grace
# is stale/dead. reservation_sweep runs immediately before reservation_count
# in the --manual fan-out block, so the stale marker is both excluded from
# RESV and physically reclaimed (the marker file is deleted) by the time the
# gap is computed: with BUSY=0 and RESV=0, gap == TARGET_N exactly as if the
# marker never existed.
echo "Test: select-tick --manual sweeps a stale dead-session reservation before counting"
sel_tick_setup
export SEL_LIVE_COUNT=0 SEL_TARGET_N=4
export SEL_GRAPH_TARGET="node t1 tactic implement"
printf 'session=resv-dead\nissue=900\ntimestamp=2026-01-01T00:00:00Z\n' \
  > "$DISPATCH_RESERVATION_DIR/900-test"
out=$(run_sel_tick --manual)
assert_eq "manual-sweep: gap = 4 − 0 (stale reservation swept, not counted)" "--top 4" \
  "$(cat "$TMPDIR_TEST/logs/graph-select.log")"
assert_eq "manual-sweep: stale reservation marker was reclaimed (deleted)" "0" \
  "$([ -e "$DISPATCH_RESERVATION_DIR/900-test" ] && echo 1 || echo 0)"
sel_tick_teardown

# --- --manual sweeps an orphan-SATURATED ledger at/over the ceiling ---------
# The adjacent manual-sweep test above plants a SINGLE stale marker well below
# the worker ceiling — it proves the sweep runs, but a weak assertion there
# would still pass even if the sweep were deleted: SPAWN_N has a floor of 1
# that re-asserts itself past the ceiling regardless of RESV, so "non-zero
# fan-out" alone proves nothing. This case is distinct: it plants SEVEN
# dead-session markers — enough to saturate the ledger AT the MAX_WORKERS
# ceiling (7 >= MAX_WORKERS − BUSY = 8 − 1) — reproducing the SHAPE of the
# 2026-07-23 phantom-worker incident (`router: manual fan-out: SPAWN_N=1 ...
# live=10` with no live worker actually running). The shape, not its cause:
# the manual sweep is not the ledger's only reaper (dispatch-tick's paused
# branch reaps too, ahead of its short-circuit), so what this test pins is the
# manual path's own cross-mode freshness guarantee — a deliberate human
# dispatch must count against a ledger reconciled AS OF THIS RUN, not one up
# to a heartbeat interval (or an unfired/stopped heartbeat) stale. Only with
# the sweep
# reclaiming all 7 markers does LIVE_COUNT stay at 1 (BUSY only, RESV=0),
# HEADROOM=7, GAP=6−1=5, SPAWN_N=5 → graph --top 5. If reservation_sweep were
# removed (the regression this test must catch), the 7 dead markers would
# count toward LIVE_COUNT (1+7=8), HEADROOM would clamp to 0, and the SPAWN_N
# floor-of-1 would re-assert past the ceiling → --top 1. So `--top 5` vs
# `--top 1` is the discriminator that makes this a real regression test
# rather than a restatement of manual-sweep.
#
# The single-line SEL_GRAPH_TARGET fake always reports exactly one selectable
# node regardless of --top's width, so the `graph <count> ...` decision line's
# count is fixed at 1 (specs array length) in both worlds — it does not carry
# the discriminator; --top does. The graph selection also
# reservation_writes a fresh marker for the selected node id (t1) via
# emit_graph_selection, so the ledger is never truly empty after a successful
# selection: with the sweep it holds exactly that one fresh marker (the 7 dead
# ones reclaimed); without it, the 7 dead markers would remain alongside it
# (8 total) — so the marker-count assertion below targets 1, not 0.
echo "Test: select-tick --manual sweeps an orphan-saturated ledger at the ceiling before counting"
sel_tick_setup
export SEL_MAX_WORKERS=8 SEL_LIVE_COUNT=1 SEL_TARGET_N=6
export SEL_GRAPH_TARGET="node t1 tactic implement"
# SEL_AGENTS_TSV is left unset: claude_agents_list_all returns rc 0 with an
# empty live-session set, so every marker planted below is dead-session (no
# live session claims it).
for n in 901 902 903 904 905 906 907; do
  printf 'session=resv-dead-%s\nissue=%s\ntimestamp=2026-01-01T00:00:00Z\n' "$n" "$n" \
    > "$DISPATCH_RESERVATION_DIR/$n-test"
done
out=$(run_sel_tick --manual)
assert_eq "manual-orphan-saturated: graph decision" "graph 1 t1:tactic:implement" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "manual-orphan-saturated: gap = 6 − 1 (7 dead markers swept, not counted)" "--top 5" \
  "$(cat "$TMPDIR_TEST/logs/graph-select.log")"
assert_eq "manual-orphan-saturated: only the fresh t1 marker remains (7 dead markers reclaimed)" "1" \
  "$(find "$DISPATCH_RESERVATION_DIR" -type f | wc -l | tr -d ' ')"
assert_eq "manual-orphan-saturated: router line reports live=1, not live=8 (incident signature inverse)" "1" \
  "$(printf '%s\n' "$out" | grep -c 'router: manual fan-out:.*live=1,')"
sel_tick_teardown

# --- autonomous no-arg at cap, not exhausted, no priority item → concurrency-cap ---
# The exemption is --manual only. An autonomous no-arg tick at the budget with no
# priority/main-broken item waiting still emits concurrency-cap — unchanged hard
# cap — but the priority-only probe now runs (and returns empty) before it.
echo "Test: select-tick autonomous no-arg at cap, no priority item → concurrency-cap"
sel_tick_setup
export SEL_LIVE_COUNT=3 SEL_TARGET_N=0 SEL_EXHAUSTED=ok
out=$(run_sel_tick) || true
assert_eq "autonomous-cap: decision line is concurrency-cap" "concurrency-cap" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "autonomous-cap: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "autonomous-cap: reseed scheduled" "called" \
  "$(cat "$TMPDIR_TEST/logs/schedule-reseed.log" 2>/dev/null)"
assert_eq "autonomous-cap: graph pace-exempt probe ran (returned empty)" "1" \
  "$([ -f "$TMPDIR_TEST/logs/graph-select-pace-exempt.log" ] && echo 1 || echo 0)"
sel_tick_teardown

# --- at cap, not exhausted, main-broken waiting → main-broken line, lock RELEASED ---
# A main that breaks WHILE at cap is now surfaced (the old early-exit fired before
# any selection ran). The diagnose bg job spawns lock-free downstream, so the lock
# is released here. No reseed.
echo "Test: select-tick at cap, main-broken → main-broken line, lock released, no reseed"
sel_tick_setup
export SEL_LIVE_COUNT=3 SEL_TARGET_N=1 SEL_EXHAUSTED=ok
# Graph pace-exempt lane empty; repo-health --main-broken-sha reports a red main
# (the at-cap main-broken bypass, Step 1b) → main-broken decision, spawned
# lock-free downstream.
export SEL_MAIN_BROKEN_SHA=deadbeef
out=$(run_sel_tick) || true
assert_eq "cap-mainbroken: decision line" "main-broken deadbeef" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "cap-mainbroken: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "cap-mainbroken: no reseed scheduled" "0" \
  "$([ -f "$TMPDIR_TEST/logs/schedule-reseed.log" ] && echo 1 || echo 0)"
sel_tick_teardown

# --- at cap, EXHAUSTED → hard stop: concurrency-cap, no priority probe -------
# Genuine token exhaustion is the one hard floor: even with a priority item
# waiting, nothing spawns. The --priority-only probe is NOT consulted, the lock is
# released, the reseed is armed at the window reset, and the decision is
# concurrency-cap.
echo "Test: select-tick at cap, exhausted → concurrency-cap, no bypass probe consulted"
sel_tick_setup
export SEL_LIVE_COUNT=3 SEL_TARGET_N=1 SEL_EXHAUSTED=exhausted
# Even with a graph pace-exempt node available, genuine token exhaustion is the
# one hard floor: the tick short-circuits BEFORE the pace-exempt probe.
export SEL_GRAPH_PACE_EXEMPT="node tactic-p tactic implement"
out=$(run_sel_tick) || true
assert_eq "cap-exhausted: decision line" "concurrency-cap" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "cap-exhausted: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "cap-exhausted: reseed scheduled" "called" \
  "$(cat "$TMPDIR_TEST/logs/schedule-reseed.log" 2>/dev/null)"
assert_eq "cap-exhausted: graph pace-exempt probe NOT consulted" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-select-pace-exempt.log" ] && echo 1 || echo 0)"
sel_tick_teardown

# --- --manual + an explicit <number> → exit 2 (positional rejected outright) -
echo "Test: select-tick --manual + explicit number → exit 2"
sel_tick_setup
err=$("$TMPDIR_TEST/dispatch-select-tick" --manual 707 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err" in
  *"explicit issue/PR targeting"*"EXIT=2") status="ok" ;;
  *) status="bad: $err" ;;
esac
assert_eq "--manual + number → usage error, exit 2" "ok" "$status"
sel_tick_teardown

# --- --manual + a node-id-shaped arg → exit 2 (usage error, before the lock) -
# tactic-graph-explicit-node-dispatch Unit 2: a node-id-shaped positional is now
# recognized (NODE_ARG), but --manual is the "no specific target" fan-out mode —
# semantically incompatible with an explicit single-node target. Mirrors the
# --manual + explicit-number usage-error test above.
echo "Test: select-tick --manual + node-id-shaped arg → exit 2"
sel_tick_setup
err=$("$TMPDIR_TEST/dispatch-select-tick" --manual foo-bar 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err" in
  *"cannot be combined with --manual"*"EXIT=2") status="ok" ;;
  *) status="bad: $err" ;;
esac
assert_eq "--manual + node-id → usage error, exit 2" "ok" "$status"
assert_eq "--manual + node-id: lock not left held" "" "$(cat "$DISPATCH_LOCK_FILE")"
sel_tick_teardown

# --- explicit node-id, not selectable → node-not-selectable, aux triggers skipped
# tactic-graph-explicit-node-dispatch Unit 2: an explicit node-id arg calls
# `graph-select-target --node <id>` instead of the ranked `--top` query. When
# selection fails (the fake graph selector's default is `empty`, simulating a
# node absent from candidates or gated out), the tick must emit
# `node-not-selectable <id>` — NOT fall through to Step 3b's aux triggers
# (JIT-reminder scan, main-broken check), which would silently substitute an
# unrelated job for the node the human explicitly asked for.
echo "Test: select-tick explicit node-id, not selectable → node-not-selectable, no aux triggers"
sel_tick_setup
cat > "$TMPDIR_TEST/dispatch-jit-scan" <<'FAKE'
#!/usr/bin/env bash
echo called >> "$TMPDIR_TEST/logs/jit-scan-invoked.log"
FAKE
chmod +x "$TMPDIR_TEST/dispatch-jit-scan"
out=$(run_sel_tick zzz-nonexistent-node)
assert_eq "node-not-selectable: decision line" "node-not-selectable zzz-nonexistent-node" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "node-not-selectable: graph selector called --node <id>" "--node zzz-nonexistent-node" \
  "$(cat "$TMPDIR_TEST/logs/graph-select.log")"
assert_eq "node-not-selectable: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "node-not-selectable: JIT-reminder scan NOT invoked" "0" \
  "$([ -f "$TMPDIR_TEST/logs/jit-scan-invoked.log" ] && echo 1 || echo 0)"
sel_tick_teardown

# --- explicit node-id, exhausted → concurrency-cap, no headroom/pace-curve check
# The one hard floor the explicit-node path still respects is genuine token
# exhaustion (mirrors the --manual branch's own EXHAUSTED check). No headroom or
# MAX_WORKERS ceiling check applies — those are exactly what this path bypasses.
echo "Test: select-tick explicit node-id + exhausted → concurrency-cap"
sel_tick_setup
export SEL_EXHAUSTED=exhausted
out=$(run_sel_tick foo-bar)
assert_eq "node-explicit exhausted: decision line" "concurrency-cap" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "node-explicit exhausted: graph selector NOT consulted" "0" \
  "$([ -f "$TMPDIR_TEST/logs/graph-select.log" ] && echo 1 || echo 0)"
assert_eq "node-explicit exhausted: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
sel_tick_teardown

# --- explicit node-id, selectable → graph decision, pace/cap gate bypassed ---
# Even with LIVE_COUNT at/over TARGET_N, an explicit node-id dispatch is NOT
# throttled — the whole point of tactic-graph-explicit-node-dispatch is that a
# human's explicit dispatch overrides the pace curve.
echo "Test: select-tick explicit node-id + at-cap live count → still selects (gate bypassed)"
sel_tick_setup
export SEL_TARGET_N=1 SEL_LIVE_COUNT=5
export SEL_GRAPH_TARGET="node foo-bar tactic implement"
out=$(run_sel_tick foo-bar)
assert_eq "node-explicit at-cap: decision line" "graph 1 foo-bar:tactic:implement" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "node-explicit at-cap: graph selector called --node <id> (not --top)" \
  "--node foo-bar" "$(cat "$TMPDIR_TEST/logs/graph-select.log")"
DLOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"
assert_eq "node-explicit at-cap: decision log .max_workers is null (no ceiling consulted)" "null" \
  "$(tail -n1 "$DLOG_FILE" | jq -r '.max_workers')"
sel_tick_teardown

# --- explicit node-id, stale reservation reclaimed by sweep → still selects ---
# tactic-explicit-node-reservation-sweep-policy Unit 2: Unit 1 added a
# reservation_sweep call to the explicit-node branch, mirroring the autonomous
# path's sweep-before-count pattern. Plant a stale marker for the target node
# under a session absent from the fake claude-agents registry, then confirm
# the tick's own sweep (run at real wall-clock time, no DISPATCH_RESERVATION_NOW
# override for the tick itself) reclaims it before graph-select-target --node is
# consulted — so the explicit dispatch is NOT wrongly refused as
# node-not-selectable due to a stranded marker.
echo "Test: select-tick explicit node-id, stale reservation reclaimed by sweep → still selects"
sel_tick_setup
# Plant the stale marker with a far-past timestamp (real reservation_write,
# sourced locally here — DISPATCH_RESERVATION_DIR is already exported by
# sel_tick_setup). The reserving session ("dead-sess") is absent from
# SEL_AGENTS_TSV below, so the sweep's liveness check treats it as stranded.
source "$SCRIPT_DIR/lib-reservation-ledger.sh"
DISPATCH_RESERVATION_NOW="2026-01-01T00:00:00Z" reservation_write "foo-bar" "999" "dead-sess"
# A SECOND stale marker under an id the tick never selects. Nothing on the
# explicit-node path re-creates it (emit_graph_selection only writes markers for
# the ids it selected), so its absence after the tick is evidence ONLY the sweep
# can produce — delete the sweep call and this marker survives.
DISPATCH_RESERVATION_NOW="2026-01-01T00:00:00Z" reservation_write "stale-other" "998" "dead-sess"
# A different, unrelated LIVE session — feeds the FAKE claude_agents_list_all
# sel_tick_setup already wires up, so the sweep sees a live registry that does
# NOT include "dead-sess".
export SEL_AGENTS_TSV=$'other-sess\tbusy\tworkerX'
export SEL_GRAPH_TARGET="node foo-bar tactic implement"
SEL_TICK_ERR="$TMPDIR_TEST/logs/sel-tick.err"
out=$(run_sel_tick_err "$SEL_TICK_ERR" foo-bar)
assert_eq "node-explicit stale-reservation: decision line" "graph 1 foo-bar:tactic:implement" \
  "$(printf '%s\n' "$out" | tail -n 1)"
# The sweep's own stderr note is the direct observable: emit_graph_selection's
# unconditional re-claim of the selected id cannot forge it, and the fake
# graph-select-target ignores the ledger entirely, so this line appears only if
# the explicit-node branch actually ran reservation_sweep.
assert_eq "node-explicit stale-reservation: sweep reclaimed the target's stale marker" "1" \
  "$(grep -qF 'reclaimed reservation foo-bar (dead-session-stranded)' "$SEL_TICK_ERR" && echo 1 || echo 0)"
# And the never-selected marker is gone — the same evidence, checked on the
# filesystem rather than on stderr.
assert_eq "node-explicit stale-reservation: unrelated stale marker cleared" "0" \
  "$([ -f "$DISPATCH_RESERVATION_DIR/stale-other" ] && echo 1 || echo 0)"
sel_tick_teardown
unset SEL_TICK_ERR

# --- explicit node-id → a reservation marker IS written, stamped origin=explicit
# Regression for the red-team finding on tactic-explicit-node-reservation-sweep-
# policy. Two defects in one:
#   1. Before this tactic the explicit-node lane never sourced
#      lib-reservation-ledger.sh, so emit_graph_selection's reservation_write was
#      an undefined command (exit 127) swallowed by its `||` warning — explicit
#      dispatch claimed NOTHING and its slot was invisible to the budget.
#   2. Once sourced, an un-stamped marker keyed to a long-lived INTERACTIVE
#      session id is immortal: rule (a) needs a live worker named <id> (never
#      appears if dispatch-graph-execute's spawn fails, a path that deliberately
#      leaves the reservation for the sweep), rule (c) needs the reserving
#      session dead (it is not), and rule (c-ttl) only reclaims stamped origins.
#      Each failed explicit dispatch would permanently add 1 to LIVE_COUNT.
# So assert BOTH: the marker exists, and it carries `origin=explicit` (the token
# rule (c-ttl) keys on — see the lib's Test 5d).
echo "Test: select-tick explicit node-id writes a reservation marker stamped origin=explicit"
sel_tick_setup
export SEL_GRAPH_TARGET="node foo-bar tactic implement"
out=$(run_sel_tick foo-bar)
assert_eq "node-explicit origin: decision line" "graph 1 foo-bar:tactic:implement" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "node-explicit origin: reservation marker written under the node id" "1" \
  "$([ -f "$DISPATCH_RESERVATION_DIR/foo-bar" ] && echo 1 || echo 0)"
assert_eq "node-explicit origin: marker session is the dispatching session" \
  "session=select-tick-session" "$(grep '^session=' "$DISPATCH_RESERVATION_DIR/foo-bar")"
assert_eq "node-explicit origin: marker stamped origin=explicit (TTL-reclaimable)" \
  "origin=explicit" "$(grep '^origin=' "$DISPATCH_RESERVATION_DIR/foo-bar")"
sel_tick_teardown

# --- AC3 non-fatal guarantee: unwritable log dir does NOT kill the tick -------
# Point DISPATCH_DECISION_LOG_DIR at a path that cannot be created (a sub-path of
# an existing regular file). The lib's mkdir -p will fail with ENOTDIR. The
# entire write body is wrapped in `{ ... } 2>/dev/null || true` so the failure is
# silently swallowed. Assert the tick still emits its normal terminal token and
# exits 0 — proving the non-fatal contract under set -uo pipefail.
echo "Test: select-tick decision-log write to unwritable dir is non-fatal (AC3)"
sel_tick_setup
# Use a blocker-file trick: touch a regular file, then point the log dir at a
# sub-path of it. mkdir -p /blocker/sub fails with ENOTDIR → write silently
# swallowed by the lib. The lib is STAGED (present in TMPDIR_TEST) so the only
# failure is the directory creation, not a missing decision_log_append function.
touch "$TMPDIR_TEST/decisionlog-blocker"
export DISPATCH_DECISION_LOG_DIR="$TMPDIR_TEST/decisionlog-blocker/sub"
if out=$(run_sel_tick); then rc=0; else rc=$?; fi
assert_eq "AC3 nonfatal: tick exit 0 despite unwritable log dir" "0" "$rc"
assert_eq "AC3 nonfatal: terminal token is still empty" "empty" \
  "$(printf '%s\n' "$out" | tail -n 1)"
sel_tick_teardown

# <<< END MOVED <<<

report_results
