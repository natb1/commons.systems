#!/usr/bin/env bash
# Shared fixture for the dispatch-scripts test suite -- the per-script
# test-*.sh files in this directory: common harness (assert_eq,
# report_results, setup/teardown, PR/rollup builders) plus the helpers the
# split lifted out of their original per-section homes so a per-SUT file can
# source them. Most have several consumers; a few (make_pr_mergeable,
# office_hours_fake_claude, office_hours_fresh_fake_claude,
# write_fake_spawn_router_claude, write_rest_check_runs) currently have one,
# and make_pr_union / make_pr_union_mergeable were already unreferenced in the
# monolith and stay that way here. Sourced, not executed directly.
set -euo pipefail

# Block A: original test-dispatch-scripts.sh lines 7-1325 (shared harness:
# SCRIPT_DIR/HOOK_SCRIPT_DIR, assert_eq/report_results, setup/teardown,
# PR/rollup builders and constants).
# >>> MOVED FROM test-dispatch-scripts.sh >>>

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# HOOK_SCRIPT_DIR — the project hooks directory the hook-copying sections
# (dispatch-office-hours-strip, dispatch-stop) copy from. SCRIPT_DIR here is
# .claude/skills/dispatch-propagate/scripts; the hooks live at .claude/hooks.
HOOK_SCRIPT_DIR="$SCRIPT_DIR/../../../hooks"

# UTIL_SCRIPT_DIR — the intentionsutil script directory (graph-commit, park-node,
# mark-node-terminal). SCRIPT_DIR is .claude/skills/dispatch-propagate/scripts,
# four levels below the repo root.
UTIL_SCRIPT_DIR="$SCRIPT_DIR/../../../../packages/intentionsutil/scripts"

# --- test helpers -----------------------------------------------------------

PASS=0
FAIL=0
TOTAL=0

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  TOTAL=$((TOTAL + 1))
  if [[ "$expected" == "$actual" ]]; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label"
    echo "    expected: '$expected'"
    echo "    actual:   '$actual'"
  fi
}

report_results() {
  # Count the host-systemd leak guard as a real assertion of THIS suite, so a
  # leak shows up in the tally and turns report_results non-zero. The guard is
  # idempotent — the EXIT trap re-call is a no-op after this one.
  dispatch_host_systemd_guard_check || true
  echo ""
  echo "================================"
  echo "Results: $PASS/$TOTAL passed, $FAIL failed"
  echo "================================"
  [[ "$FAIL" -eq 0 ]]
}

# --- host systemd leak guard (tactic-sweep-timer-unit-dir-leak) -------------
#
# Every suite that drives a script touching lib.sh's unit installers
# (ensure_recover_unit, ensure_sweep_timer, ensure_heartbeat_units) must
# redirect the matching *_UNIT_DIR **and** *_SYSTEMCTL_CMD into its tmp
# sandbox. Miss either half and the suite mutates the developer's real user
# systemd state: a missing *_UNIT_DIR rewrites the host's unit files, and a
# missing *_SYSTEMCTL_CMD runs a real `systemctl --user daemon-reload` /
# `enable --now` / `disable --now` against the host's user manager (which
# changes no file content, so a file-hash-only guard never sees it).
#
# This guard is armed here — at fixture-source time — so EVERY suite inherits
# it, and it fires from two places: report_results (the normal terminal path,
# where it counts as an assertion) and the EXIT trap below (so an abort under
# `set -e` still reports the leak). It covers:
#
#   1. the WorkingDirectory= value of every unit lib.sh can write, in the REAL
#      unit dir resolved the way lib.sh resolves it —
#      ${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user (a hardcoded $HOME/.config
#      would watch absent files and pass vacuously on a host that sets
#      XDG_CONFIG_HOME, e.g. home-manager/NixOS). WorkingDirectory=, not the
#      file's content hash: the host's live dispatch chain legitimately rewrites
#      these .service files whenever a launcher runs with a different PATH
#      (Environment="PATH=..." is captured at write time), so a content hash
#      would fail the suite on a concurrent-but-innocent rewrite. The installed
#      WorkingDirectory= is the host's own main worktree and is stable across
#      those rewrites, while a leak from this suite necessarily points it at a
#      per-run temp sandbox — so the value change is unambiguous leak evidence;
#   2. the dispatch-* entry set of that dir plus the timers.target.wants symlink
#      set, so an enable/disable that only moves symlinks is caught;
#   3. a recording `systemctl` stub prepended to PATH, so any code path that
#      falls back to the bare `systemctl` default is recorded and fails the
#      suite instead of reaching the host's user manager. The stub exits 1,
#      matching what a real `systemctl --user` does where no user manager is
#      reachable (CI), so probe-shaped calls still read as "no".
DISPATCH_HOST_UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"

# Units lib.sh writes: ensure_recover_unit (lib.sh:2585), ensure_sweep_timer
# (lib.sh:2748), ensure_heartbeat_units (lib.sh:3023), ensure_healer_units and
# ensure_watcher_units (dispatch-heal.* / dispatch-fleet-watch.*, below
# ensure_sweep_timer in lib.sh).
DISPATCH_HOST_UNIT_FILES=(
  dispatch-tick-recover.service
  dispatch-sweep-periodic.service
  dispatch-sweep-periodic.timer
  dispatch-heartbeat.service
  dispatch-heartbeat.timer
  dispatch-heal.service
  dispatch-heal.timer
  dispatch-fleet-watch.service
  dispatch-fleet-watch.timer
)

_dispatch_host_unit_fingerprint() (
  # Runs in a subshell (the `(...)` body): the nullglob change stays local.
  shopt -s nullglob
  local f e
  for f in "${DISPATCH_HOST_UNIT_FILES[@]}"; do
    if [[ -f "$DISPATCH_HOST_UNIT_DIR/$f" ]]; then
      printf 'unit %s workdir=%s\n' "$f" \
        "$(sed -n 's/^WorkingDirectory=//p' "$DISPATCH_HOST_UNIT_DIR/$f" | head -1)"
    else
      printf 'unit %s absent\n' "$f"
    fi
  done
  for e in "$DISPATCH_HOST_UNIT_DIR"/dispatch-*; do
    printf 'entry %s\n' "${e##*/}"
  done
  for e in "$DISPATCH_HOST_UNIT_DIR"/timers.target.wants/*; do
    printf 'wants %s\n' "${e##*/}"
  done
)

DISPATCH_GUARD_BIN_DIR=$(mktemp -d)
DISPATCH_GUARD_SYSTEMCTL_LOG="$DISPATCH_GUARD_BIN_DIR/real-systemctl-calls.log"
cat > "$DISPATCH_GUARD_BIN_DIR/systemctl" <<STUB
#!/usr/bin/env bash
# Leak guard: a suite that reaches the bare \`systemctl\` default has not wired
# its *_SYSTEMCTL_CMD seam. Record the argv and refuse, exactly as a real
# \`systemctl --user\` does where no user manager is reachable.
echo "\$*" >> "$DISPATCH_GUARD_SYSTEMCTL_LOG"
echo "REFUSED: the test suite reached the real 'systemctl' (argv: \$*)" >&2
exit 1
STUB
chmod +x "$DISPATCH_GUARD_BIN_DIR/systemctl"
# Prepend BEFORE SAVED_PATH is captured, so teardown's PATH restore keeps it.
export PATH="$DISPATCH_GUARD_BIN_DIR:$PATH"

_DISPATCH_HOST_UNIT_FINGERPRINT_BEFORE="$(_dispatch_host_unit_fingerprint)"
_DISPATCH_HOST_GUARD_DONE=0

# dispatch_host_systemd_guard_check — compare the host fingerprint against the
# source-time snapshot and assert no real systemctl was reached. Counts one
# assertion; idempotent (later calls are no-ops). Returns non-zero on a leak.
dispatch_host_systemd_guard_check() {
  [[ "$_DISPATCH_HOST_GUARD_DONE" == "1" ]] && return 0
  _DISPATCH_HOST_GUARD_DONE=1
  local after calls=""
  after="$(_dispatch_host_unit_fingerprint)"
  if [[ -s "$DISPATCH_GUARD_SYSTEMCTL_LOG" ]]; then
    calls="$(cat "$DISPATCH_GUARD_SYSTEMCTL_LOG")"
  fi
  TOTAL=$((TOTAL + 1))
  if [[ "$after" == "$_DISPATCH_HOST_UNIT_FINGERPRINT_BEFORE" && -z "$calls" ]]; then
    PASS=$((PASS + 1))
    echo "  PASS: host systemd state untouched (no unit-dir write, no real systemctl)"
    return 0
  fi
  FAIL=$((FAIL + 1))
  echo "  FAIL: host systemd state untouched (no unit-dir write, no real systemctl)"
  {
    echo "FAIL: a harness in this suite leaked into the host's user systemd state."
    echo "  unit dir: $DISPATCH_HOST_UNIT_DIR"
    if [[ "$after" != "$_DISPATCH_HOST_UNIT_FINGERPRINT_BEFORE" ]]; then
      echo "  --- unit-dir fingerprint BEFORE ---"
      printf '%s\n' "$_DISPATCH_HOST_UNIT_FINGERPRINT_BEFORE"
      echo "  --- unit-dir fingerprint AFTER ----"
      printf '%s\n' "$after"
    fi
    if [[ -n "$calls" ]]; then
      echo "  --- real 'systemctl' invocations (a *_SYSTEMCTL_CMD seam is unwired) ---"
      printf '%s\n' "$calls"
    fi
    echo "  Fix: export the matching DISPATCH_*_UNIT_DIR and DISPATCH_*_SYSTEMCTL_CMD"
    echo "  into the suite's tmp sandbox before invoking the script under test."
  } >&2
  return 1
}

# --- harness ----------------------------------------------------------------

SAVED_PATH="$PATH"
TMPDIR_TEST=""
STUB_DIR=""

setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$TMPDIR_TEST/bin" "$STUB_DIR"

  # Copy the scripts under test into the tmp dir so they can call each other
  # via SCRIPT_DIR resolution without relying on the real filesystem PATH.
  cp "$SCRIPT_DIR/dispatch-ci-ready" "$TMPDIR_TEST/dispatch-ci-ready"
  cp "$SCRIPT_DIR/dispatch-find-pr" "$TMPDIR_TEST/dispatch-find-pr"
  cp "$SCRIPT_DIR/dispatch-main-qa-triage" "$TMPDIR_TEST/dispatch-main-qa-triage"
  cp "$SCRIPT_DIR/dispatch-resolve-arg" "$TMPDIR_TEST/dispatch-resolve-arg"
  # dispatch-epic-resolved-candidate is exercised directly (its own test section)
  # and resolves its epic-labels helper via SCRIPT_DIR (= TMPDIR_TEST for this
  # copy), so it and that helper must sit alongside each other here.
  cp "$SCRIPT_DIR/dispatch-epic-resolved-candidate" "$TMPDIR_TEST/dispatch-epic-resolved-candidate"
  # dispatch-epic-resolved-candidate resolves the epic-labels helper via its
  # SCRIPT_DIR (= TMPDIR_TEST for this copy), so the helper must sit alongside it.
  cp "$SCRIPT_DIR/dispatch-epic-labels" "$TMPDIR_TEST/dispatch-epic-labels"
  cp "$SCRIPT_DIR/dispatch-close-resolved" "$TMPDIR_TEST/dispatch-close-resolved"
  cp "$SCRIPT_DIR/office-hours-select-target" "$TMPDIR_TEST/office-hours-select-target"
  # office-hours-select-target's resume pass (#2240) resolves
  # dispatch-recover-session-id via its SCRIPT_DIR (= TMPDIR_TEST for this copy),
  # so the reader must sit alongside it. Pure-filesystem; selector resume tests set
  # DISPATCH_STAMP_PROJECTS_ROOT to a temp projects root carrying stamp sidecars.
  cp "$SCRIPT_DIR/dispatch-recover-session-id" "$TMPDIR_TEST/dispatch-recover-session-id"
  chmod +x "$TMPDIR_TEST/dispatch-recover-session-id"
  cp "$SCRIPT_DIR/office-hours" "$TMPDIR_TEST/office-hours"
  # office-hours' idle-provision arm resolves dispatch-provision-from-remote via
  # its SCRIPT_DIR (= TMPDIR_TEST for this copy), so the helper must sit alongside
  # it. Selector-only tests never run provisioning (the selector only checks
  # ls-remote); entry tests that exercise provisioning stub the helper directly.
  cp "$SCRIPT_DIR/dispatch-provision-from-remote" "$TMPDIR_TEST/dispatch-provision-from-remote"
  cp "$SCRIPT_DIR/dispatch-spawn-job" "$TMPDIR_TEST/dispatch-spawn-job"
  cp "$SCRIPT_DIR/dispatch-check-blockers" "$TMPDIR_TEST/dispatch-check-blockers"
  cp "$SCRIPT_DIR/dispatch-complete-phase" "$TMPDIR_TEST/dispatch-complete-phase"
  cp "$SCRIPT_DIR/dispatch-apply-office-hours" "$TMPDIR_TEST/dispatch-apply-office-hours"
  cp "$SCRIPT_DIR/dispatch-qa-apply-main-qa-labels" "$TMPDIR_TEST/dispatch-qa-apply-main-qa-labels"
  cp "$SCRIPT_DIR/dispatch-apply-planned" "$TMPDIR_TEST/dispatch-apply-planned"
  # dispatch-plan-finalize resolves its three siblings (dispatch-write-plan,
  # dispatch-mark-complete, dispatch-apply-planned) via SCRIPT_DIR, which
  # resolves to TMPDIR_TEST for this copy — so a test stubs those siblings here
  # in TMPDIR_TEST to observe the call order (#1230).
  cp "$SCRIPT_DIR/dispatch-plan-finalize" "$TMPDIR_TEST/dispatch-plan-finalize"
  chmod +x "$TMPDIR_TEST/dispatch-plan-finalize"
  cp "$SCRIPT_DIR/dispatch-resolve-worktree" "$TMPDIR_TEST/dispatch-resolve-worktree"
  # dispatch-reconcile-ready sources lib.sh (for dispatch_classify_rollup) via its
  # SCRIPT_DIR, which resolves to TMPDIR_TEST for this copy — lib.sh is copied
  # below alongside the other scripts, so the source resolves.
  cp "$SCRIPT_DIR/dispatch-reconcile-ready" "$TMPDIR_TEST/dispatch-reconcile-ready"
  # dispatch-auto-merge sources lib.sh (pr_list_open, dispatch_ci_verdict_rest,
  # gh_retry, gh_issue_list_rest) and calls dispatch-config-load via its
  # SCRIPT_DIR (= TMPDIR_TEST for this copy) — both already copied below/above,
  # so both resolve.
  cp "$SCRIPT_DIR/dispatch-auto-merge" "$TMPDIR_TEST/dispatch-auto-merge"
  # dispatch-reconcile-merged (#2512) sources lib.sh (gh_retry, gh_issue_view_rest,
  # gh_issue_close_rest, dispatch_marker_comment_id) via its SCRIPT_DIR (= TMPDIR_TEST
  # for this copy) — lib.sh is copied below, so the source resolves.
  cp "$SCRIPT_DIR/dispatch-reconcile-merged" "$TMPDIR_TEST/dispatch-reconcile-merged"
  chmod +x "$TMPDIR_TEST/dispatch-reconcile-merged"
  # dispatch-retriage-orphaned-followups (#1812) sources lib.sh (gh_issue_list_rest,
  # gh_retry) and calls dispatch-apply-office-hours via its SCRIPT_DIR (= TMPDIR_TEST
  # for this copy) — both already copied here, so both resolve.
  cp "$SCRIPT_DIR/dispatch-retriage-orphaned-followups" "$TMPDIR_TEST/dispatch-retriage-orphaned-followups"
  # dispatch-config-load and dispatch-project-status-read are resolved as
  # "$SCRIPT_DIR/<name>" by the scripts staged here that consult local config /
  # project status, so both helpers must sit directly in TMPDIR_TEST (NOT
  # TMPDIR_TEST/scripts/).
  cp "$SCRIPT_DIR/dispatch-config-load" "$TMPDIR_TEST/dispatch-config-load"
  cp "$SCRIPT_DIR/dispatch-project-status-read" \
    "$TMPDIR_TEST/dispatch-project-status-read"
  # dispatch-resolve-worktree `source`s lib.sh via its SCRIPT_DIR, which resolves
  # to TMPDIR_TEST for the copy — so lib.sh must sit alongside it. It is sourced,
  # not executed, so it needs no chmod +x.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/lib.sh"
  # Staged scripts that `source` lib-claude-agents.sh via their SCRIPT_DIR
  # (TMPDIR_TEST under test) need it here. Sourced, not executed — no chmod +x.
  cp "$SCRIPT_DIR/lib-claude-agents.sh" "$TMPDIR_TEST/lib-claude-agents.sh"
  # dispatch-resolve-worktree sources lib-reservation-ledger.sh
  # via its SCRIPT_DIR (#1046), to skip a reserved-but-not-yet-live target.
  # Sourced, not executed — no chmod +x needed.
  cp "$SCRIPT_DIR/lib-reservation-ledger.sh" "$TMPDIR_TEST/lib-reservation-ledger.sh"
  chmod +x "$TMPDIR_TEST/dispatch-ci-ready" \
           "$TMPDIR_TEST/dispatch-find-pr" \
           "$TMPDIR_TEST/dispatch-main-qa-triage" \
           "$TMPDIR_TEST/dispatch-epic-resolved-candidate" \
           "$TMPDIR_TEST/dispatch-epic-labels" \
           "$TMPDIR_TEST/dispatch-close-resolved" \
           "$TMPDIR_TEST/dispatch-resolve-arg" \
           "$TMPDIR_TEST/office-hours-select-target" \
           "$TMPDIR_TEST/office-hours" \
           "$TMPDIR_TEST/dispatch-provision-from-remote" \
           "$TMPDIR_TEST/dispatch-spawn-job" \
           "$TMPDIR_TEST/dispatch-check-blockers" \
           "$TMPDIR_TEST/dispatch-complete-phase" \
           "$TMPDIR_TEST/dispatch-apply-office-hours" \
           "$TMPDIR_TEST/dispatch-qa-apply-main-qa-labels" \
           "$TMPDIR_TEST/dispatch-apply-planned" \
           "$TMPDIR_TEST/dispatch-resolve-worktree" \
           "$TMPDIR_TEST/dispatch-reconcile-ready" \
           "$TMPDIR_TEST/dispatch-config-load" \
           "$TMPDIR_TEST/dispatch-project-status-read" \
           "$TMPDIR_TEST/dispatch-auto-merge" \
           "$TMPDIR_TEST/dispatch-retriage-orphaned-followups"

  # Default no-op stub for dispatch-provision-worktree. dispatch-route now invokes
  # it (after the worktree cross-check, before phase derivation). The real script
  # runs direnv + `git merge origin/main`, which can't run in this harness and has
  # its own unit tests below; here it is stubbed so the dispatch-route tests
  # exercise the routing seam. It logs each call to provision-calls.log and exits
  # with the code in $STUB_DIR/provision-exit (default 0), so a test drives the
  # conflict (3) and failure (non-0) branches by writing that file.
  cat > "$TMPDIR_TEST/dispatch-provision-worktree" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")" && pwd)/stub"
echo "provision $*" >> "$STUB_DIR/provision-calls.log"
if [[ -f "$STUB_DIR/provision-exit" ]]; then
  exit "$(cat "$STUB_DIR/provision-exit")"
fi
exit 0
STUB
  chmod +x "$TMPDIR_TEST/dispatch-provision-worktree"

  # JIT scan config dir. With no jit.json written into it, dispatch-config-load
  # jit returns "no-config", so jit_scan returns immediately — every existing
  # dispatch-select-target test stays green.
  mkdir -p "$TMPDIR_TEST/config"
  export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"
  export DISPATCH_FIND_PR_RETRY_DELAY=0
  # gh_retry's backoff must not actually sleep under test.
  export GH_RETRY_BASE_DELAY=0

  # Default the worktree-liveness daemon to UNKNOWN: point CLAUDE_AGENTS_CMD at a
  # path with no executable so `claude agents --json` exits non-zero. The
  # worktree_has_live_session predicate folds UNKNOWN into "occupied", so a
  # worktree-bearing row fails safe to skip/conflict — preserving the pre-#905
  # stat-only behavior for every test that does not opt into a richer fake — and
  # no test reaches the real `claude` daemon. Per-test calls to
  # select_target_fake_claude override this to model live or orphan worktrees.
  export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/no-such-claude"

  # Default the empty-read corroboration probe to "daemon visible". The library
  # only trusts an exactly-`[]` registry payload when a `claude daemon` process
  # corroborates it; without this stub the probe would shell out to the HOST's
  # real pgrep, making every `[]`-payload case depend on whether the developer's
  # machine happens to be running a daemon. Exiting 0 preserves the pre-existing
  # meaning of every `[]` fake: a definite "no sessions".
  cat > "$TMPDIR_TEST/pgrep-daemon-visible" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
  chmod +x "$TMPDIR_TEST/pgrep-daemon-visible"
  export CLAUDE_AGENTS_PGREP_CMD="$TMPDIR_TEST/pgrep-daemon-visible"

  # Point the reservation ledger (#1046) at a scratch dir that is absent by
  # default — no marker files, so reservation_exists is false for every row and
  # the reserved-skip is inert. Every existing select-target / trace-leaf test
  # stays green; a reserved-skip test creates a marker file here to opt in.
  export DISPATCH_RESERVATION_DIR="$TMPDIR_TEST/reservations"

  # Attention-rank map seam. Default to the all-zero baseline: an empty map
  # means every candidate sits at rank 0, so the rank axis degenerates to a
  # single level and the existing enh → topic-category → phase tie-break
  # ladder decides everything. This matches production, where the map is
  # always empty (graph-rank interleaving retired with the node↔issue
  # mapping); rank tests override per-test to keep exercising the inert
  # bucket machinery until it is deleted with the legacy router.
  export DISPATCH_RANK_MAP_JSON='{}'

  # dispatch-select-target calls dispatch-phase as "$SCRIPT_DIR/dispatch-phase".
  # Since we copied them all to TMPDIR_TEST, SCRIPT_DIR inside each copy will
  # resolve to TMPDIR_TEST correctly.

  # stub gh
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
# Reconstruct full args string for matching.
args="$*"
case "$args" in
  "pr list --state open --limit 300 --json number,headRefName,isDraft,headRefOid,labels,mergeable")
    echo "pr list" >> "$STUB_DIR/gh-pr-list-calls.log"
    if [[ -f "$STUB_DIR/pr-list-full.json" ]]; then
      cat "$STUB_DIR/pr-list-full.json"
    else
      echo "[]"
    fi
    ;;
  "pr list --state open --limit 300 --json number,headRefName")
    # dispatch-find-pr self-fetch: only the two correlation fields.
    echo "pr list" >> "$STUB_DIR/gh-pr-list-calls.log"
    echo "pr list" >> "$STUB_DIR/gh-find-pr-calls.log"
    call_count=$(wc -l < "$STUB_DIR/gh-find-pr-calls.log")
    if [[ "$call_count" -ge 2 && -f "$STUB_DIR/pr-list-retry.json" ]]; then
      cat "$STUB_DIR/pr-list-retry.json"
    elif [[ -f "$STUB_DIR/pr-list-full.json" ]]; then
      cat "$STUB_DIR/pr-list-full.json"
    else
      echo "[]"
    fi
    ;;
  "pr list --state open --limit 5 --json number,headRefName")
    # #1312 truncation-guard test: exactly 5 PRs at the DISPATCH_PR_LIST_LIMIT=5
    # boundary so pr_list_open fires the loud guard and returns non-zero.
    printf '[{"number":1,"headRefName":"1-a"},{"number":2,"headRefName":"2-b"},{"number":3,"headRefName":"3-c"},{"number":4,"headRefName":"4-d"},{"number":5,"headRefName":"5-e"}]\n'
    ;;
  "pr list --state open --limit 300 --json number,createdAt,headRefName,isDraft,headRefOid,labels,closingIssuesReferences,mergeable")
    # dispatch-select-target's union fetch now carries `mergeable` (#1241). The
    # field is forward-compatible (consumed by #1243); the current selection path
    # does not read it, and make_pr_union fixtures omit it (jq yields null).
    echo "pr list" >> "$STUB_DIR/gh-pr-list-calls.log"
    if [[ -f "$STUB_DIR/pr-list-union.json" ]]; then
      cat "$STUB_DIR/pr-list-union.json"
    else
      echo "[]"
    fi
    ;;
  api\ *repos/*/issues\?*labels=dispatch-test-*)
    # gh_issue_list_rest edge-case tests (#1652): sentinel label prefix
    # `dispatch-test-` routes to in-test fixtures without polluting the shared
    # issue-list fixture paths. MUST precede the generic api *repos/*/issues?*
    # branch (case is first-wins). Log the full $args so tests can assert whether
    # --paginate was passed and what per_page= value was used.
    echo "$args" >> "$STUB_DIR/gh-issue-list-rest-calls.log"
    if [[ -f "$STUB_DIR/gh-fail-rest" ]]; then
      echo "stub forced gh api failure" >&2
      exit 1
    fi
    rest_path_dt=$(printf '%s' "$args" | grep -oE 'repos/[^ ]+')
    rest_query_dt="${rest_path_dt#*\?}"
    rest_label_dt=""
    for kv in ${rest_query_dt//&/ }; do
      case "$kv" in
        labels=*) rest_label_dt="${kv#labels=}" ;;
      esac
    done
    rest_label_dt="${rest_label_dt//%20/ }"
    case "$rest_label_dt" in
      dispatch-test-empty)
        echo '[]'
        ;;
      dispatch-test-paginate)
        cat "$STUB_DIR/rest-page-1.json"
        cat "$STUB_DIR/rest-page-2.json"
        ;;
      dispatch-test-limit)
        cat "$STUB_DIR/rest-limit.json"
        ;;
      dispatch-test-title)
        cat "$STUB_DIR/rest-title.json"
        ;;
      dispatch-test-limit-paginate)
        # >100-limit paginate fixture: two pages concatenated (>= limit items).
        cat "$STUB_DIR/rest-bigpage-1.json"
        cat "$STUB_DIR/rest-bigpage-2.json"
        ;;
      dispatch-test-limit-force-paginate)
        # --paginate-at-limit-<=100 fixture: two pages of MIXED issues+PRs so a
        # single page would under-deliver real issues after PR-filtering.
        cat "$STUB_DIR/rest-forcepage-1.json"
        cat "$STUB_DIR/rest-forcepage-2.json"
        ;;
      dispatch-test-limit-exact)
        # Exactly-<limit> fixture: serve a single array of exactly limit items so
        # a caller's `len == limit ⇒ truncated` guard fires.
        cat "$STUB_DIR/rest-exact.json"
        ;;
      dispatch-test-includebody)
        cat "$STUB_DIR/rest-includebody.json"
        ;;
      *)
        echo '[]'
        ;;
    esac
    ;;
  api\ *repos/*/pulls\?*)
    # gh_pr_list_rest LIST endpoint (#2258): repos/{owner}/{repo}/pulls?state=...
    # The leading `*` glob absorbs an optional `--paginate` before the path. This
    # MUST precede the single-PR `api repos/*/pulls/*` arm (case is first-wins) —
    # though that arm needs a literal `/` after `pulls` and would not match `?`
    # anyway. Log the full $args so tests can assert --paginate / per_page= / the
    # head= query param. Routes by fixture-file presence (no shared consumer to
    # collide with, so no sentinel label needed): serve page-1 then page-2 if it
    # exists, else `[]`. A gh-fail-pulls marker forces a gh failure.
    echo "$args" >> "$STUB_DIR/gh-pr-list-rest-calls.log"
    if [[ -f "$STUB_DIR/gh-fail-pulls" ]]; then
      echo "stub forced gh api failure (pulls list)" >&2
      exit 1
    fi
    if [[ -f "$STUB_DIR/rest-pulls-page-1.json" ]]; then
      cat "$STUB_DIR/rest-pulls-page-1.json"
      if [[ -f "$STUB_DIR/rest-pulls-page-2.json" ]]; then
        cat "$STUB_DIR/rest-pulls-page-2.json"
      fi
    else
      echo '[]'
    fi
    ;;
  api\ *repos/*/issues\?*)
    # gh_issue_list_rest (#1601): the four converted dispatch issue scans now hit
    # the REST issues endpoint instead of `gh issue list`. The fake-gh receives
    # the literal {owner}/{repo} placeholder for current-repo scans and an explicit
    # owner/repo for cross-repo (jit) scans. Parse state= / labels= / the repo
    # segment from the query and serve the SAME fixtures the old `gh issue list`
    # cases served — in REST shape (snake_case, no pull_request key), which
    # gh_issue_list_rest remaps to the camelCase {number,createdAt,closedAt,labels}.
    rest_path=$(printf '%s' "$args" | grep -oE 'repos/[^ ]+')
    rest_repo=$(printf '%s' "$rest_path" | sed -E 's#repos/(.+)/issues\?.*#\1#')
    rest_query="${rest_path#*\?}"
    rest_state=""; rest_label=""
    for kv in ${rest_query//&/ }; do
      case "$kv" in
        state=*)  rest_state="${kv#state=}" ;;
        labels=*) rest_label="${kv#labels=}" ;;
      esac
    done
    # The helper encodes a space as %20; decode for fixture-key comparison.
    rest_label="${rest_label//%20/ }"
    if [[ "$rest_repo" == "{owner}/{repo}" ]]; then
      # Current-repo scans: the no-label open-issue list (dispatch-select-target),
      # the dispatch:review-followup retriage scan (#2032), and the main-broken latch.
      if [[ -z "$rest_label" || "$rest_label" == "dispatch:review-followup" ]]; then
        # #1812: persistent-failure injection for the open-issue scan
        # (gh_issue_list_rest --state open). A marker makes gh fail on every
        # attempt so gh_retry exhausts and forwards the failure — driving
        # dispatch-retriage-orphaned-followups' early-exit-on-scan-failure branch.
        # The retriage scan now passes --label dispatch:review-followup (#2032);
        # both the no-label and that-label fetches serve issue-list.json here
        # (the stub bypasses the server-side label filter).
        if [[ -f "$STUB_DIR/gh-fail-issue-list-open" ]]; then
          echo "stub forced gh api failure (open issue-list)" >&2
          exit 1
        fi
        if [[ -f "$STUB_DIR/issue-list.json" ]]; then cat "$STUB_DIR/issue-list.json"; else echo "[]"; fi
      elif [[ "$rest_label" == "dispatch:main-broken" ]]; then
        # #1085 per-episode latch read. Default [] (gate fires); a fixture models
        # an already-open latch issue (gate falls through).
        if [[ -f "$STUB_DIR/main-broken-issue-list.json" ]]; then cat "$STUB_DIR/main-broken-issue-list.json"; else echo "[]"; fi
      elif [[ "$rest_label" == "dispatch:office-hours" ]]; then
        # dispatch-trace-leaf parked set (#1011) and office-hours-select-target queue
        # (#2258): both migrated from `gh issue list` to gh_issue_list_rest, so the
        # office-hours scan now lands on the REST issues endpoint. Serve whichever
        # fixture the active test seeds; absence → [] (nothing parked / empty queue).
        if [[ -f "$STUB_DIR/trace-parked.json" ]]; then
          cat "$STUB_DIR/trace-parked.json"
        elif [[ -f "$STUB_DIR/oh-issue-list.json" ]]; then
          cat "$STUB_DIR/oh-issue-list.json"
        else
          echo "[]"
        fi
      else
        echo "[]"
      fi
    else
      # Cross-repo JIT scan. Fixtures keyed by sanitized label + state (same key the
      # old `issue list --repo` case used); absent fixture → empty list.
      jit_key=$(printf '%s' "$rest_label" | tr '/:' '__')
      jit_fixture="$STUB_DIR/jit-issues-${rest_state}-${jit_key}.json"
      if [[ -f "$jit_fixture" ]]; then cat "$jit_fixture"; else echo "[]"; fi
    fi
    ;;
  issue\ view\ *\ --json\ state)
    # dispatch-select-target worktree detection: gh issue view <num> --json state
    num=$(echo "$args" | awk '{print $3}')
    if [[ -f "$STUB_DIR/issue-state-${num}.json" ]]; then
      cat "$STUB_DIR/issue-state-${num}.json"
    else
      exit 1
    fi
    ;;
  issue\ view\ *\ --json\ title,body,comments,number,state)
    # issue-blocking call: gh issue view <num> --json ...
    num=$(echo "$args" | awk '{print $3}')
    if [[ -f "$STUB_DIR/issue-${num}.json" ]]; then
      cat "$STUB_DIR/issue-${num}.json"
    else
      echo "{\"title\":\"Issue $num\",\"body\":\"\",\"comments\":[],\"number\":$num,\"state\":\"OPEN\"}"
    fi
    ;;
  issue\ view\ *\ --json\ closedByPullRequestsReferences)
    # dispatch-find-pr cross-check fallback: gh issue view <num> --json closedByPullRequestsReferences
    num=$(echo "$args" | awk '{print $3}')
    if [[ -f "$STUB_DIR/issue-closing-prs-${num}.json" ]]; then
      cat "$STUB_DIR/issue-closing-prs-${num}.json"
    else
      echo '{"closedByPullRequestsReferences":[]}'
    fi
    ;;
  api\ graphql\ *)
    # Batched blockedBy lookup for dispatch-select-target (#794). The query text
    # arrives in $args as the -f query= value; extract each issue number and
    # project the existing blockers-<num>.json fixture (default []) into the
    # GraphQL alias shape _<num>: { number, blockedBy { nodes { state } }, parent }.
    # This reuses the same fixtures the REST blocked_by case serves, so the
    # select-target blocked-skip tests pass via either delivery mechanism.
    #
    # parent fixture: parent-<num>.json holds a single parent number (e.g. "100"),
    # or is absent. When absent, parent is null. When present, the parent chain is
    # built recursively (following parent-<k>.json for each ancestor) up to 7
    # levels deep, producing {number, parent:{number, parent:...null}}.
    build_parent_json() {
      local n="$1" depth="${2:-0}"
      # Cap at 7 levels to prevent infinite loops on cyclic fixtures.
      if [[ "$depth" -ge 7 ]] || [[ ! -f "$STUB_DIR/parent-${n}.json" ]]; then
        echo "null"
        return
      fi
      local p
      p=$(cat "$STUB_DIR/parent-${n}.json")
      [[ -z "$p" ]] && { echo "null"; return; }
      local grandparent_json
      grandparent_json=$(build_parent_json "$p" $(( depth + 1 )))
      printf '{"number":%s,"parent":%s}' "$p" "$grandparent_json"
    }
    echo "api graphql" >> "$STUB_DIR/gh-graphql-calls.log"
    nums=$(printf '%s' "$args" | grep -oE 'issue\(number: [0-9]+' | grep -oE '[0-9]+')
    aliases="{}"
    while IFS= read -r n; do
      [[ -z "$n" ]] && continue
      if [[ -f "$STUB_DIR/blockers-${n}.json" ]]; then
        fixture=$(cat "$STUB_DIR/blockers-${n}.json")
      else
        fixture="[]"
      fi
      node=$(printf '%s' "$fixture" | jq -c '{nodes: [.[] | {state: .state}]}')
      parent_json=$(build_parent_json "$n" 0)
      aliases=$(printf '%s' "$aliases" | jq -c --arg k "_${n}" --argjson num "$n" --argjson bb "$node" --argjson par "$parent_json" \
        '.[$k] = {number: $num, blockedBy: $bb, parent: $par}')
    done <<< "$nums"
    printf '{"data":{"repository":%s}}\n' "$aliases"
    ;;
  "repo view --json nameWithOwner -q .nameWithOwner")
    # Transient injection: gh-transient-repo-view holds N = how many initial hits
    # should fail with a retryable HTTP 504, after which the normal response is
    # served. A .count sidecar records every hit so a test can assert how many
    # attempts gh_retry made.
    if [[ -f "$STUB_DIR/gh-transient-repo-view" ]]; then
      fail_n=$(cat "$STUB_DIR/gh-transient-repo-view")
      count_file="$STUB_DIR/gh-transient-repo-view.count"
      count=0
      [[ -f "$count_file" ]] && count=$(cat "$count_file")
      count=$((count + 1))
      echo "$count" > "$count_file"
      if [[ "$count" -le "$fail_n" ]]; then
        echo "gh: HTTP 504: Gateway Timeout (https://api.github.com/)" >&2
        exit 1
      fi
    fi
    echo "natb1/commons.systems"
    ;;
  "repo view --json owner -q .owner.login")
    # gh_pr_list_rest --head owner resolution (#2258): when --head is set and
    # --repo is absent, the helper resolves the current repo's owner login.
    echo "natb1"
    ;;
  api\ */dependencies/blocked_by)
    path=$(echo "$args" | awk '{print $2}')
    num=$(echo "$path" | grep -oE '[0-9]+' | tail -1)
    # Failure injection: a marker file models a transient gh API failure on this
    # issue's blocked_by lookup (mirrors the issue-blocking fake's contract), so
    # count_open_blockers callers (e.g. dispatch-check-blockers) can exercise the
    # gh_api_array failure path.
    if [[ -f "$STUB_DIR/gh-fail-blocked_by-${num}" ]]; then
      echo "gh: API error on issues/${num}/dependencies/blocked_by" >&2
      exit 1
    fi
    # Transient injection: gh-transient-blocked_by-<num> holds N = how many
    # initial hits should fail with a retryable HTTP 504, after which the normal
    # fixture is served. A .count sidecar records every hit so a test can assert
    # how many attempts gh_api_array (via gh_retry) made.
    if [[ -f "$STUB_DIR/gh-transient-blocked_by-${num}" ]]; then
      fail_n=$(cat "$STUB_DIR/gh-transient-blocked_by-${num}")
      count_file="$STUB_DIR/gh-transient-blocked_by-${num}.count"
      count=0
      [[ -f "$count_file" ]] && count=$(cat "$count_file")
      count=$((count + 1))
      echo "$count" > "$count_file"
      if [[ "$count" -le "$fail_n" ]]; then
        echo "gh: HTTP 504: Gateway Timeout (https://api.github.com/repos/owner/repo/issues/${num}/dependencies/blocked_by)" >&2
        exit 1
      fi
    fi
    if [[ -f "$STUB_DIR/blockers-${num}.json" ]]; then
      cat "$STUB_DIR/blockers-${num}.json"
    else
      echo "[]"
    fi
    ;;
  api\ */sub_issues)
    path=$(echo "$args" | awk '{print $2}')
    num=$(echo "$path" | grep -oE '[0-9]+' | tail -1)
    if [[ -f "$STUB_DIR/subissues-${num}.json" ]]; then
      cat "$STUB_DIR/subissues-${num}.json"
    else
      echo "[]"
    fi
    ;;
  run\ view\ *)
    # gh_run_view_rest sentinel (#2480): `gh run view <id> --json createdAt,headSha`.
    # Uses the `run view` prefix (not `api`), so it cannot collide with any api arm.
    # Log args; honor gh-fail-rest; serve run-view-<id>.json or default '{}'.
    echo "$args" >> "$STUB_DIR/gh-run-view-rest-calls.log"
    if [[ -f "$STUB_DIR/gh-fail-rest" ]]; then
      echo "stub forced gh run view failure" >&2
      exit 1
    fi
    id="${args#run view }"; id="${id%% *}"
    if [[ -f "$STUB_DIR/run-view-${id}.json" ]]; then
      cat "$STUB_DIR/run-view-${id}.json"
    else
      echo '{}'
    fi
    ;;
  api\ *repos/*/issues/*/timeline*)
    # gh_issue_closing_commit_rest sentinel (#2480): `gh api --paginate repos/.../issues/<N>/timeline`.
    # MUST PRECEDE api\ --paginate\ repos/*/issues/9xxx/comments (line below) AND
    # api\ repos/*/issues/9xxx (case is first-wins). The `api\ *` absorbs the
    # optional --paginate token so both paginated and bare calls are caught here.
    echo "$args" >> "$STUB_DIR/gh-issue-closing-commit-rest-calls.log"
    if [[ -f "$STUB_DIR/gh-fail-rest" ]]; then
      echo "stub forced gh api failure" >&2
      exit 1
    fi
    num=$(printf '%s' "$args" | sed -E 's#.*issues/([0-9]+)/timeline.*#\1#')
    if [[ -f "$STUB_DIR/timeline-${num}.json" ]]; then
      cat "$STUB_DIR/timeline-${num}.json"
    else
      echo '[]'
    fi
    ;;
  api\ repos/*/compare/*)
    # gh_commit_is_ancestor_rest sentinel (#2480): `gh api repos/.../compare/<base>...<head>`.
    # No collision with issues/pulls arms; placed here near other paginate arms for clarity.
    echo "$args" >> "$STUB_DIR/gh-commit-is-ancestor-rest-calls.log"
    if [[ -f "$STUB_DIR/gh-fail-rest" ]]; then
      echo "stub forced gh api failure" >&2
      exit 1
    fi
    if [[ -f "$STUB_DIR/compare-status.json" ]]; then
      cat "$STUB_DIR/compare-status.json"
    else
      echo '{"status":"identical"}'
    fi
    ;;
  api\ --paginate\ repos/*/issues/9[0-9][0-9][0-9]/comments)
    # gh_issue_view_rest --comments sentinel branch (#2257): the helper's second
    # REST call. The pattern REQUIRES the literal `--paginate` token, so a
    # regression that drops --paginate no longer matches here — it falls through
    # to the generic `*)` default (the issues/9xxx sentinel ends at the digits, so
    # /comments does not match it), serving the wrong/empty body and turning the
    # count assertion RED. The fixtures are MULTI-PAGE (cat'd in sequence, one
    # array doc per page, like the check-runs --paginate stub), spanning >30
    # comments total so the count assertion catches a non-paginating fetch.
    num=$(printf '%s' "$args" | sed -E 's#.*issues/([0-9]+)/comments.*#\1#')
    if [[ -f "$STUB_DIR/view-issue-comments-${num}-page1.json" ]]; then
      cat "$STUB_DIR/view-issue-comments-${num}-page1.json"
      [[ -f "$STUB_DIR/view-issue-comments-${num}-page2.json" ]] && \
        cat "$STUB_DIR/view-issue-comments-${num}-page2.json"
    else
      echo '[]'
    fi
    ;;
  api\ repos/*/issues/9[0-9][0-9][0-9])
    # gh_issue_view_rest sentinel branch (#2255): single-issue GET has no label to
    # carry a sentinel, so reserve the 9xxx number range. MUST precede the generic
    # `api repos/*/issues/*` branch (case is first-wins). A $STUB_DIR/gh-fail-rest
    # marker forces a non-zero gh failure (drives the clear-errors path); otherwise
    # $STUB_DIR/view-issue-<N>.json supplies the raw REST issue object.
    echo "$args" >> "$STUB_DIR/gh-issue-view-rest-calls.log"
    if [[ -f "$STUB_DIR/gh-fail-rest" ]]; then
      echo "stub forced gh api failure" >&2
      exit 1
    fi
    num="${args##*/}"
    if [[ -f "$STUB_DIR/view-issue-${num}.json" ]]; then
      cat "$STUB_DIR/view-issue-${num}.json"
    else
      echo '{}'
    fi
    ;;
  api\ repos/*/pulls/9[0-9][0-9][0-9])
    # gh_pr_view_rest sentinel branch (#2255): reserve the 9xxx PR number range.
    # MUST precede the generic `api repos/*/pulls/*` branch (case is first-wins).
    # A $STUB_DIR/gh-fail-rest marker forces a non-zero gh failure; otherwise
    # $STUB_DIR/view-pr-<N>.json supplies the raw REST pull object.
    echo "$args" >> "$STUB_DIR/gh-pr-view-rest-calls.log"
    if [[ -f "$STUB_DIR/gh-fail-rest" ]]; then
      echo "stub forced gh api failure" >&2
      exit 1
    fi
    num="${args##*/}"
    if [[ -f "$STUB_DIR/view-pr-${num}.json" ]]; then
      cat "$STUB_DIR/view-pr-${num}.json"
    else
      echo '{}'
    fi
    ;;
  "api -X POST "*/issues/*/labels*)
    # gh_issue_set_labels_rest sentinel (#2255): POST .../issues/<N>/labels.
    # MUST precede the generic `api repos/*/issues/*` branch (case is first-wins).
    # $args form: "api -X POST repos/.../issues/<N>/labels -f labels[]=<label>..."
    echo "$args" >> "$STUB_DIR/gh-issue-set-labels-rest-calls.log"
    if [[ -f "$STUB_DIR/gh-fail-rest" ]]; then
      echo "stub forced gh api failure" >&2
      exit 1
    fi
    echo '[]'
    ;;
  "api -X DELETE "*/issues/*/labels/*)
    # gh_issue_remove_label_rest sentinel (#2255): DELETE .../issues/<N>/labels/<name>.
    # MUST precede the generic `api repos/*/issues/*` branch.
    # $args form: "api -X DELETE repos/.../issues/<N>/labels/<url-encoded-name>"
    echo "$args" >> "$STUB_DIR/gh-issue-remove-label-rest-calls.log"
    if [[ -f "$STUB_DIR/gh-404-remove-label" ]]; then
      echo "gh: Not Found (HTTP 404)" >&2
      exit 1
    fi
    if [[ -f "$STUB_DIR/gh-fail-rest" ]]; then
      echo "stub forced gh api failure" >&2
      exit 1
    fi
    echo '[]'
    ;;
  "api -X PATCH "*/issues/[0-9]*)
    # gh_issue_close_rest AND gh_issue_edit_rest sentinel (#2255, #2256): both are
    # PATCH .../issues/<N> calls, so they share this branch and log to the same file.
    # MUST precede the generic `api repos/*/issues/*` branch.
    # $args forms: "api -X PATCH repos/.../issues/<N> -f state=closed [...]" (close)
    #              "api -X PATCH repos/.../issues/<N> -f title=... [...]"   (edit)
    echo "$args" >> "$STUB_DIR/gh-issue-close-rest-calls.log"
    if [[ -f "$STUB_DIR/gh-fail-rest" ]]; then
      echo "stub forced gh api failure" >&2
      exit 1
    fi
    # Optional per-issue close-failure injection (#2512): if issue-close-fail-on
    # holds an issue number matching the <N> in this PATCH's path, emit a
    # non-transient error and exit non-zero so gh_retry returns immediately and
    # the caller (dispatch-reconcile-merged) takes its gh_issue_close_rest
    # HARD_ERROR path for that issue. Default-absent, so existing tests sharing
    # this PATCH branch are unaffected.
    if [[ -f "$STUB_DIR/issue-close-fail-on" ]]; then
      close_num=$(printf '%s' "$args" | sed -E 's#.*issues/([0-9]+).*#\1#')
      if [[ "$close_num" == "$(cat "$STUB_DIR/issue-close-fail-on")" ]]; then
        echo "issue close PATCH for #$close_num was rejected" >&2
        exit 1
      fi
    fi
    echo '{}'
    ;;
  "api -X POST "*/issues/*/comments*)
    # gh_issue_comment_rest sentinel (#2255): POST .../issues/<N>/comments.
    # MUST precede the generic `api repos/*/issues/*` branch.
    # $args form: "api -X POST repos/.../issues/<N>/comments -f body=..."
    echo "$args" >> "$STUB_DIR/gh-issue-comment-rest-calls.log"
    if [[ -f "$STUB_DIR/gh-fail-rest" ]]; then
      echo "stub forced gh api failure" >&2
      exit 1
    fi
    echo '{}'
    ;;
  "api -X POST "*/issues\ *)
    # gh_issue_create_rest sentinel (#2255): POST .../issues (new issue creation).
    # MUST precede the generic `api repos/*/issues/*` branch. The backslash-space
    # anchors to the create endpoint (.../issues<SPACE>) rather than subpaths like
    # .../issues/<N>/labels which the labels/comments branches above already handle.
    # The labels/comments branches come first in the case so they take priority for
    # those paths; this branch then catches only the bare create path.
    # $args form: "api -X POST repos/.../issues -f title=... -f body=..."
    echo "$args" >> "$STUB_DIR/gh-issue-create-rest-calls.log"
    if [[ -f "$STUB_DIR/gh-fail-rest" ]]; then
      echo "stub forced gh api failure" >&2
      exit 1
    fi
    echo '{"number":9999,"html_url":"https://github.com/test/repo/issues/9999"}'
    ;;
  "api -X PUT "*/pulls/*/merge*)
    # gh_pr_merge_rest sentinel (#2255, #2256): PUT .../pulls/<N>/merge.
    # MUST precede the generic `api repos/*/pulls/*` branch.
    # $args form: "api -X PUT repos/.../pulls/<N>/merge -f merge_method=..."
    echo "$args" >> "$STUB_DIR/gh-pr-merge-rest-calls.log"
    if [[ -f "$STUB_DIR/gh-fail-rest" ]]; then
      echo "stub forced gh api failure" >&2
      exit 1
    fi
    # Optional per-PR failure injection (#2256): if $STUB_DIR/pr-merge-fail-on
    # holds a PR number matching the <N> in this merge's path, emit a
    # non-transient error and exit non-zero so gh_retry returns immediately and
    # dispatch-auto-merge takes its HARD_ERROR path for that PR.
    if [[ -f "$STUB_DIR/pr-merge-fail-on" ]]; then
      merge_num=$(printf '%s' "$args" | sed -E 's#.*pulls/([0-9]+)/merge.*#\1#')
      if [[ "$merge_num" == "$(cat "$STUB_DIR/pr-merge-fail-on")" ]]; then
        echo "merge of the base branch into #$merge_num was rejected" >&2
        exit 1
      fi
    fi
    echo '{}'
    ;;
  api\ repos/*/issues/*)
    # Generic single-issue GET: gh api repos/{owner}/{repo}/issues/<N>. Two
    # consumers route here (case is first-wins; the 9xxx sentinel arm precedes it):
    #   - dispatch-resolve-arg discriminator (issue-vs-PR; a PR's JSON carries a
    #     "pull_request" key — the fixture decides).
    #   - gh_issue_view_rest (#2257), after the Category-A read swaps off the
    #     `gh issue view --json` porcelain. The helper consumes the RAW REST object
    #     and projects/upcases internally, so arg-issue-<N>.json must be in RAW REST
    #     shape (lowercase "state":"open", state_reason, created_at, labels:[{name}]).
    # Failure injection (default-absent, so existing tests are unaffected):
    #   - gh-fail-issue-labels-<N>: HARD (non-transient) failure, exit 1
    #     UNCONDITIONALLY — gh_retry forwards it (does not retry).
    #   - issue-view-fail-<N>: TRANSIENT (HTTP 503) failure with a decrementing
    #     count — gh_retry retries until the count is exhausted, then serves the
    #     fixture.
    #   - arg-issue-<N>.err: a non-404 gh failure (used by dispatch-resolve-arg).
    #   - absence of any fixture models a 404 (number is neither issue nor PR).
    num="${args##*/}"
    if [[ -f "$STUB_DIR/gh-fail-issue-labels-${num}" ]]; then
      echo "gh: API error on issues/${num}" >&2
      exit 1
    fi
    if [[ -f "$STUB_DIR/issue-view-fail-${num}" ]]; then
      remaining=$(cat "$STUB_DIR/issue-view-fail-${num}")
      if [[ "$remaining" -gt 0 ]]; then
        echo $((remaining - 1)) > "$STUB_DIR/issue-view-fail-${num}"
        echo "HTTP 503: Service Unavailable" >&2
        exit 1
      fi
    fi
    if [[ -f "$STUB_DIR/arg-issue-${num}.notfound" ]]; then
      # Positive 404 carve-out: dispatch-resolve-arg's existence probe asks "is
      # this number an issue?" and must see a real 404 (it maps 404→exit 2,
      # distinct from the arg-issue-<N>.err other-error→exit 1 path). Absent by
      # default so the empty-labels default below serves the common case.
      echo "gh: Not Found (HTTP 404)" >&2
      exit 1
    elif [[ -f "$STUB_DIR/arg-issue-${num}.json" ]]; then
      cat "$STUB_DIR/arg-issue-${num}.json"
    elif [[ -f "$STUB_DIR/arg-issue-${num}.err" ]]; then
      cat "$STUB_DIR/arg-issue-${num}.err" >&2
      exit 1
    else
      # Default: an existing OPEN issue with no labels — the production-faithful
      # state for a dispatch target whose specific labels a test does not assert
      # (mirrors the retired `--json labels` arm's `{"labels":[]}` default).
      # Raw REST shape; the helper projects/upcases it.
      printf '{"number":%s,"title":"","body":"","state":"open","state_reason":null,"created_at":null,"labels":[],"assignees":[]}\n' "$num"
    fi
    ;;
  api\ repos/*/pulls/*)
    # Two consumers route here, both issuing the byte-identical
    # `gh api repos/{owner}/{repo}/pulls/<N>` GET (no flag to discriminate on):
    #   - dispatch-resolve-worktree reconciliation (#2257): resolve_pr_head now
    #     reads the PR head via gh_pr_view_rest (was `gh pr view --json
    #     headRefName`). $STUB_DIR/pr-headref-<N>.json supplies the raw REST pull
    #     object (carries head.ref); the gh-pr-view-headref.log write below keeps
    #     the existing call-made assertions valid. Default-absent → empty head.ref
    #     so the resolve_pr_head guard still fires its "unusable head" abort.
    #   - dispatch-retriage-orphaned-followups (#1812, #2007):
    #     $STUB_DIR/retriage-pr-<N>.json; absence defaults to an OPEN PR.
    # pr-headref takes priority: resolve-worktree tests use PR numbers (100, 922)
    # that retriage's tests never use, so the two fixture namespaces don't collide.
    num="${args##*/}"
    if [[ -f "$STUB_DIR/pr-headref-${num}.json" ]]; then
      echo "pr view" >> "$STUB_DIR/gh-pr-view-headref.log"
      cat "$STUB_DIR/pr-headref-${num}.json"
    elif [[ -f "$STUB_DIR/retriage-pr-${num}.json" ]]; then
      cat "$STUB_DIR/retriage-pr-${num}.json"
    else
      echo '{"state":"open","merged_at":null,"labels":[]}'
    fi
    ;;
  pr\ view\ *\ --json\ closingIssuesReferences)
    # dispatch-resolve-arg PR branch: gh pr view <N> --json closingIssuesReferences.
    num=$(echo "$args" | awk '{print $3}')
    if [[ -f "$STUB_DIR/arg-closing-${num}.json" ]]; then
      cat "$STUB_DIR/arg-closing-${num}.json"
    else
      echo '{"closingIssuesReferences":[]}'
    fi
    ;;
  label\ create\ *)
    # #2256: the label-op scripts now ensure-the-label-exists-first (a `gh label
    # create` runs on EVERY add path, before the REST POST .../issues/<N>/labels).
    # Default: log the argv + exit 0 (create succeeds). A $STUB_DIR/gh-label-exists
    # marker models the already-exists case — emit gh's "already exists" message and
    # exit 1 — so the ensure-first tolerance (proceed to the REST add) is testable.
    echo "$args" >> "$STUB_DIR/gh-label-create.log"
    if [[ -f "$STUB_DIR/gh-label-exists" ]]; then
      echo "gh: Validation Failed (HTTP 422): already_exists" >&2
      exit 1
    fi
    if [[ -f "$STUB_DIR/gh-fail-label-create" ]]; then
      echo "gh: could not create label (HTTP 500): Internal Server Error" >&2
      exit 1
    fi
    ;;
  issue\ edit\ *)
    # Multiple scripts (dispatch-apply-office-hours, dispatch-qa-apply-main-qa-labels, ...)
    # route their `gh issue edit` calls through this block.
    # $STUB_DIR/issue-edit-mode selects behavior (default: succeed and log args).
    mode="ok"
    [[ -f "$STUB_DIR/issue-edit-mode" ]] && mode=$(cat "$STUB_DIR/issue-edit-mode")
    case "$mode" in
      label-missing)
        # The label does not exist until gh label create runs: model gh's
        # missing-label error until then, then succeed on the retry.
        if [[ -f "$STUB_DIR/gh-label-create.log" ]]; then
          echo "$args" >> "$STUB_DIR/gh-issue-edit.log"
        else
          label="${args##* }"
          echo "failed to update: '$label' not found" >&2
          exit 1
        fi
        ;;
      remove-label-missing)
        # Model step 1's tolerated "not found" on the help-wanted removal ONLY.
        # The main-qa add and office-hours add must still succeed.
        if [[ "$args" == *"--remove-label"* ]]; then
          echo "failed to update: 'help wanted' not found" >&2
          exit 1
        fi
        echo "$args" >> "$STUB_DIR/gh-issue-edit.log"
        ;;
      main-qa-missing)
        # Model step 2's add-then-create-on-not-found for main-qa ONLY: the first
        # --add-label main-qa fails "not found" until gh label create main-qa runs;
        # the retry then succeeds. remove-label and the office-hours
        # --add-label dispatch:office-hours fall through to log+succeed.
        if [[ "$args" == *"--add-label main-qa"* && ! -f "$STUB_DIR/gh-label-create.log" ]]; then
          echo "failed to update: 'main-qa' not found" >&2
          exit 1
        fi
        echo "$args" >> "$STUB_DIR/gh-issue-edit.log"
        ;;
      *)
        echo "$args" >> "$STUB_DIR/gh-issue-edit.log"
        ;;
    esac
    ;;
  issue\ comment\ *)
    # dispatch-apply-office-hours posts the why-comment to the ISSUE.
    echo "$args" >> "$STUB_DIR/gh-issue-comment.log"
    ;;
  pr\ edit\ *)
    # dispatch-complete-phase applies the label to the PR. $STUB_DIR/pr-edit-mode
    # selects behavior (default: succeed and log the args).
    mode="ok"
    [[ -f "$STUB_DIR/pr-edit-mode" ]] && mode=$(cat "$STUB_DIR/pr-edit-mode")
    case "$mode" in
      label-missing)
        # The label does not exist until gh label create runs: model gh's
        # missing-label error until then, then succeed on the retry.
        if [[ -f "$STUB_DIR/gh-label-create.log" ]]; then
          echo "$args" >> "$STUB_DIR/gh-pr-edit.log"
        else
          label="${args##* }"
          echo "failed to update: '$label' not found" >&2
          exit 1
        fi
        ;;
      other-failure)
        # An apply failure unrelated to a missing label.
        echo "GraphQL: Could not resolve to a PullRequest" >&2
        exit 1
        ;;
      *)
        echo "$args" >> "$STUB_DIR/gh-pr-edit.log"
        ;;
    esac
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
  "pr list --state open --limit "*" --json number,title,body,isDraft,labels,headRefOid,mergeable,closingIssuesReferences")
    # dispatch-auto-merge's one fetch. auto-merge-pr-list.json supplies the
    # per-test PR array; absence means no open PRs.
    echo "pr list" >> "$STUB_DIR/gh-auto-merge-pr-list.log"
    if [[ -f "$STUB_DIR/auto-merge-pr-list.json" ]]; then
      cat "$STUB_DIR/auto-merge-pr-list.json"
    else
      echo "[]"
    fi
    ;;
  "pr list --state merged --json number,title,mergedAt,closingIssuesReferences --limit "*)
    # dispatch-reconcile-merged's one fetch (#2512). reconcile-merged-pr-list.json
    # supplies the per-test merged-PR array; absence means no merged PRs.
    echo "pr list" >> "$STUB_DIR/gh-reconcile-merged-pr-list.log"
    if [[ -f "$STUB_DIR/reconcile-merged-pr-list.json" ]]; then
      cat "$STUB_DIR/reconcile-merged-pr-list.json"
    else
      echo "[]"
    fi
    ;;
  pr\ ready\ --undo\ *)
    # dispatch-reconcile-ready demote. Match --undo BEFORE the bare `pr ready`
    # case below so a demote does not fall through to the promote log.
    num=$(printf '%s' "$args" | awk '{print $NF}')
    echo "$num" >> "$STUB_DIR/gh-pr-ready-undo.log"
    ;;
  pr\ ready\ *)
    # dispatch-reconcile-ready promote (bare `gh pr ready <N>`).
    num=$(printf '%s' "$args" | awk '{print $NF}')
    echo "$num" >> "$STUB_DIR/gh-pr-ready.log"
    ;;
  pr\ merge\ *)
    # dispatch-auto-merge: gh pr merge <N> --squash --subject ... --body ...
    echo "$args" >> "$STUB_DIR/gh-pr-merge.log"
    # Optional failure injection: if $STUB_DIR/pr-merge-fail-on holds a PR
    # number matching this merge's <N>, emit a non-transient error to stderr
    # and exit non-zero so gh_retry returns immediately (no retry backoff) and
    # dispatch-auto-merge takes its HARD_ERROR path for that PR.
    if [[ -f "$STUB_DIR/pr-merge-fail-on" ]]; then
      merge_num=$(printf '%s' "$args" | awk '{print $3}')
      if [[ "$merge_num" == "$(cat "$STUB_DIR/pr-merge-fail-on")" ]]; then
        echo "merge of the base branch into #$merge_num was rejected" >&2
        exit 1
      fi
    fi
    ;;
  "api repos/{owner}/{repo}/commits/main")
    # main_broken_sha: resolve origin/main's HEAD SHA. Default: healthy main.
    if [[ -f "$STUB_DIR/main-commit.json" ]]; then cat "$STUB_DIR/main-commit.json"
    else echo '{"sha":"mainhead0"}'; fi
    ;;
  api\ --paginate\ repos/*/commits/*/check-runs)
    # dispatch_ci_verdict_rest (#1601): per-PR check-runs by headRefOid sha. The
    # make_pr* builders write $STUB_DIR/check-runs-<sha>.json; serve it if present,
    # else an empty set. (The non-paginate case below keeps serving main-check-runs.)
    sha=$(printf '%s' "$args" | sed -E 's#.*commits/([^/]+)/check-runs.*#\1#')
    if [[ -f "$STUB_DIR/check-runs-${sha}.json" ]]; then cat "$STUB_DIR/check-runs-${sha}.json"
    else echo '{"check_runs":[]}'; fi
    ;;
  api\ repos/*/commits/*/check-runs)
    # main_broken_sha: CodeQL check-runs for main's HEAD. Default: none.
    if [[ -f "$STUB_DIR/main-check-runs.json" ]]; then cat "$STUB_DIR/main-check-runs.json"
    else echo '{"check_runs":[]}'; fi
    ;;
  run\ list\ --branch\ main\ *)
    # main_broken_sha: Actions workflow runs on main. Default: none.
    if [[ -f "$STUB_DIR/main-run-list.json" ]]; then cat "$STUB_DIR/main-run-list.json"
    else echo '[]'; fi
    ;;
  api\ repos/*/check-suites/*)
    # main_broken_sha: branch-attribution lookup for a check-run's parent
    # check-suite. Fixtures are keyed by suite id: main-check-suite-<id>.json.
    # Default: unattributable (null head_branch), so an un-fixtured suite is
    # conservatively dropped rather than misread as main's own.
    suite_id=$(printf '%s' "$args" | sed -E 's#.*check-suites/([^/]+)$#\1#')
    if [[ -f "$STUB_DIR/main-check-suite-${suite_id}.json" ]]; then cat "$STUB_DIR/main-check-suite-${suite_id}.json"
    else echo '{"head_branch":null}'; fi
    ;;
  issue\ list\ --repo\ *)
    # JIT scan: gh issue list --repo <repo> --label <label> --state <open|closed> --json ...
    # Fixtures are keyed by sanitized label + state; absent fixture → empty list.
    jit_label=""
    jit_state=""
    set -- $args
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --label) jit_label="$2"; shift 2 ;;
        --state) jit_state="$2"; shift 2 ;;
        *) shift ;;
      esac
    done
    jit_key=$(printf '%s' "$jit_label" | tr '/:' '__')
    jit_fixture="$STUB_DIR/jit-issues-${jit_state}-${jit_key}.json"
    if [[ -f "$jit_fixture" ]]; then
      cat "$jit_fixture"
    else
      echo "[]"
    fi
    ;;
  "project item-list "*)
    # JIT scan via dispatch-project-status-read.
    if [[ -f "$STUB_DIR/project-item-list.json" ]]; then
      cat "$STUB_DIR/project-item-list.json"
    else
      echo '{"items":[],"totalCount":0}'
    fi
    ;;
  issue\ close\ *)
    # dispatch-close-resolved (#1456): gh issue close <num> --reason completed --comment ...
    echo "$args" >> "$STUB_DIR/gh-issue-close.log"
    ;;
  issue\ view\ *\ --json\ *)
    # Generic catch-all for `gh issue view <num> --json <FIELDS>` calls from
    # call sites that still use the GraphQL porcelain (GraphQL exemptions kept in
    # #2257, e.g. dispatch-find-pr --json closedByPullRequestsReferences).
    # Logs the FIELDS token so tests can assert which fields were requested,
    # then serves issue-<num>.json if present, else a minimal default carrying
    # only number/state/stateReason.
    num=$(printf '%s' "$args" | awk '{print $3}')
    fields="${args##* --json }"
    echo "$fields" >> "$STUB_DIR/gh-issue-view-fields.log"
    if [[ -f "$STUB_DIR/issue-${num}.json" ]]; then
      cat "$STUB_DIR/issue-${num}.json"
    else
      printf '{"number":%s,"state":"OPEN","stateReason":null}\n' "$num"
    fi
    ;;
  *)
    echo "gh stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"

  # stub git
  cat > "$TMPDIR_TEST/bin/git" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
case "$args" in
  "worktree list --porcelain")
    if [[ -f "$STUB_DIR/worktree-list.txt" ]]; then
      cat "$STUB_DIR/worktree-list.txt"
    else
      # Default: one worktree entry for the main worktree (no branch for bare)
      printf 'worktree /repo\nHEAD abc123\n\n'
    fi
    ;;
  "rev-parse --abbrev-ref HEAD")
    if [[ -f "$STUB_DIR/current-branch.txt" ]]; then
      cat "$STUB_DIR/current-branch.txt"
    else
      echo "main"
    fi
    ;;
  "rev-parse --show-toplevel")
    if [[ -f "$STUB_DIR/worktree-toplevel.txt" ]]; then
      cat "$STUB_DIR/worktree-toplevel.txt"
    else
      echo "/repo"
    fi
    ;;
  -C\ *\ fetch\ *)
    # dispatch-resolve-worktree reconciliation: fetch the PR head branch.
    : ;;
  -C\ *\ rev-list\ --count\ *)
    # dispatch-resolve-worktree reconciliation: commits unique to the worktree
    # branch. Default 0 (lossless re-point); rev-list-count.txt overrides to N.
    if [[ -f "$STUB_DIR/rev-list-count.txt" ]]; then
      cat "$STUB_DIR/rev-list-count.txt"
    else
      echo "0"
    fi
    ;;
  -C\ *\ checkout\ *)
    # dispatch-resolve-worktree reconciliation: re-point to the PR head branch.
    echo "$args" >> "$STUB_DIR/git-checkout.log"
    ;;
  fetch\ *)
    # dispatch-route done-case: fetch the current branch from origin. No-op stub.
    : ;;
  rev-list\ --count\ *)
    # dispatch-route done-case: commits the worktree is ahead of origin/<branch>.
    # Default 0 (remote up to date → STOP done); route-ahead-count.txt overrides to N.
    if [[ -f "$STUB_DIR/route-ahead-count.txt" ]]; then
      cat "$STUB_DIR/route-ahead-count.txt"
    else
      echo "0"
    fi
    ;;
  *ls-remote\ --exit-code\ --heads\ origin\ *)
    # office-hours-select-target's swept-worktree arm probes whether the branch
    # still exists on origin via `git -C <main> ls-remote --exit-code --heads
    # origin <branch>`. The -C <main> args precede ls-remote in "$@", so match on
    # the substring. Consult $STUB_DIR/remote-branches.txt (one branch per line):
    # exit 0 if listed, else exit 2 — mirroring real ls-remote --exit-code's exit
    # 2 for no match. A missing fixture means "branch not listed" → exit 2.
    branch="${args##* }"
    if [[ -f "$STUB_DIR/remote-branches.txt" ]] && \
       grep -Fxq "$branch" "$STUB_DIR/remote-branches.txt"; then
      exit 0
    fi
    exit 2
    ;;
  *)
    echo "git stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/git"

  # dispatch-trace-leaf calls issue-blocking and issue-sub-issues as sibling
  # scripts ("$SCRIPT_DIR/issue-blocking"). Since the copied dispatch-trace-leaf
  # has SCRIPT_DIR = TMPDIR_TEST, place fake versions of those scripts directly
  # in TMPDIR_TEST so they are found alongside it. The fakes read stub files
  # instead of calling gh.
  cat > "$TMPDIR_TEST/issue-blocking" <<'FAKE'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/stub" && pwd)"
num="${1:-}"
# Strip leading # if present.
num="${num#\#}"
# Log every lookup by number (#1452), BEFORE the failure-injection check so a
# failing call is still recorded. The trace-cache memo test asserts a given
# number is looked up once despite being reachable from multiple roots.
echo "$num" >> "$STUB_DIR/issue-blocking-calls.log"
# Failure injection: a marker file models a transient gh API failure on this
# issue's blocked_by lookup. The real issue-blocking exits non-zero (with a
# gh_api_array stderr diagnostic) on a genuine gh failure — the fake mirrors
# that contract so dispatch-trace-leaf's failure handling can be exercised.
if [[ -f "$STUB_DIR/gh-fail-blocked_by-${num}" ]]; then
  echo "error: gh api call failed for issues/${num}/dependencies/blocked_by" >&2
  exit 1
fi
# Transient injection: when a gh-transient-blocked_by-<num> marker exists, take
# the REAL gh_api_array path (which routes through gh_retry against the stub gh)
# so an integration test can verify the lookup is retried within trace-leaf's
# path. The gh stub's blocked_by case fails N times then serves the fixture.
if [[ -f "$STUB_DIR/gh-transient-blocked_by-${num}" ]]; then
  source "$(cd "$(dirname "$0")" && pwd)/lib.sh"
  blocker_nums=$(gh_api_array "/repos/{owner}/{repo}/issues/${num}/dependencies/blocked_by" '.[].number') || exit 1
  for dep in $blocker_nums; do
    if [[ -f "$STUB_DIR/issue-${dep}.json" ]]; then
      cat "$STUB_DIR/issue-${dep}.json"
    else
      echo "{\"title\":\"Issue $dep\",\"body\":\"\",\"comments\":[],\"number\":$dep,\"state\":\"OPEN\"}"
    fi
  done
  exit 0
fi
# issue-blocking calls lib.sh resolve_issue_number then gh api + gh issue view.
# Our fake: just read a stub file.
blocker_nums=""
if [[ -f "$STUB_DIR/blockers-${num}.json" ]]; then
  blocker_nums=$(cat "$STUB_DIR/blockers-${num}.json" | jq -r '.[].number' 2>/dev/null || true)
fi
for dep in $blocker_nums; do
  if [[ -f "$STUB_DIR/issue-${dep}.json" ]]; then
    cat "$STUB_DIR/issue-${dep}.json"
  else
    echo "{\"title\":\"Issue $dep\",\"body\":\"\",\"comments\":[],\"number\":$dep,\"state\":\"OPEN\"}"
  fi
done
FAKE
  chmod +x "$TMPDIR_TEST/issue-blocking"

  cat > "$TMPDIR_TEST/issue-sub-issues" <<'FAKE'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/stub" && pwd)"
num="${1:-}"
num="${num#\#}"
# Log every lookup by number (#1452), BEFORE the failure-injection check (same
# rationale as issue-blocking's log above).
echo "$num" >> "$STUB_DIR/issue-sub-issues-calls.log"
# Failure injection — same contract as issue-blocking's, for the sub_issues
# lookup.
if [[ -f "$STUB_DIR/gh-fail-sub_issues-${num}" ]]; then
  echo "error: gh api call failed for issues/${num}/sub_issues" >&2
  exit 1
fi
sub_nums=""
if [[ -f "$STUB_DIR/subissues-${num}.json" ]]; then
  sub_nums=$(cat "$STUB_DIR/subissues-${num}.json" | jq -r '.[].number' 2>/dev/null || true)
fi
for sub in $sub_nums; do
  if [[ -f "$STUB_DIR/issue-${sub}.json" ]]; then
    cat "$STUB_DIR/issue-${sub}.json"
  else
    echo "{\"title\":\"Issue $sub\",\"body\":\"\",\"comments\":[],\"number\":$sub,\"state\":\"OPEN\"}"
  fi
done
FAKE
  chmod +x "$TMPDIR_TEST/issue-sub-issues"

  export PATH="$TMPDIR_TEST/bin:$PATH"
}

teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  STUB_DIR=""
  export PATH="$SAVED_PATH"
  unset DISPATCH_CONFIG_DIR
  unset DISPATCH_FIND_PR_RETRY_DELAY
  unset GH_RETRY_BASE_DELAY
  # Per-test exports for the liveness gate must not leak across tests.
  unset CLAUDE_AGENTS_CMD
  # The empty-read corroboration probe override must not leak either — its stub
  # lives under the just-removed TMPDIR_TEST, so a leaked value would point at a
  # deleted path and silently classify every `[]` as uncorroborated.
  unset CLAUDE_AGENTS_PGREP_CMD
  unset CLAUDE_CODE_SESSION_ID
  # The #1452 tick-snapshot / trace-cache exports must not leak across tests
  # either — both default OFF so existing tests keep the live/uncached path.
  # DISPATCH_AGENTS_SNAPSHOT_ALL is the REGISTERED-view (`--json --all`) snapshot
  # counterpart; it must not leak either, or a later test would silently read a
  # previous test's registered snapshot instead of its own fake daemon.
  unset DISPATCH_AGENTS_SNAPSHOT DISPATCH_TRACE_CACHE_DIR DISPATCH_AGENTS_SNAPSHOT_ALL
  # The reservation-ledger override (#1046) must not leak across tests either.
  unset DISPATCH_RESERVATION_DIR
  # The attention-rank seam (Attention v2) must not leak either — a per-test rank
  # override would otherwise poison the next test's baseline.
  unset DISPATCH_RANK_MAP_JSON
}
# EXIT trap: tmp cleanup PLUS the host-systemd leak guard. The guard runs here
# too (not only in report_results) so a suite that aborts early under `set -e`
# still reports a leak instead of skipping the check; the guard is idempotent,
# so the normal path (report_results ran) does not double-count. A leak forces a
# non-zero exit even when the suite otherwise ended clean.
_dispatch_test_exit_trap() {
  local rc=$?
  if [ -n "${TMPDIR_TEST:-}" ]; then
    rm -rf "$TMPDIR_TEST"
  fi
  if ! dispatch_host_systemd_guard_check; then
    rc=1
  fi
  rm -rf "$DISPATCH_GUARD_BIN_DIR"
  exit "$rc"
}
trap _dispatch_test_exit_trap EXIT

# Write the REST check-runs fixture for <sha> from an uppercase GraphQL-shape
# rollup. The real `commits/<sha>/check-runs` endpoint returns status/conclusion
# in LOWERCASE (`completed`, `success`, `in_progress`), whereas the *_ROLLUP test
# constants carry the UPPERCASE statusCheckRollup enum shape. Downcase here so the
# fixture matches the real REST shape — this is what genuinely exercises
# dispatch_ci_verdict_rest's `ascii_upcase` conversion. Feeding it already-
# uppercase data would let the conversion be deleted with the suite still green
# (the exact verdict-fidelity gap #1601's migration introduced). A null
# conclusion (pending check run) is preserved as null, matching REST.
write_rest_check_runs() {
  local sha="$1" rollup_json="$2"
  local rest
  rest=$(jq -c 'map({status: (.status | ascii_downcase),
                     conclusion: (.conclusion | if . == null then null else ascii_downcase end)})' \
    <<<"$rollup_json")
  printf '%s' "{\"check_runs\": $rest}" > "$STUB_DIR/check-runs-${sha}.json"
}

# Helper to build a PR JSON entry for the full PR list (dispatch-phase).
# Emits headRefOid (a per-PR synthetic sha) instead of statusCheckRollup, and
# writes the matching REST check-runs fixture so dispatch_ci_verdict_rest's
# `commits/<sha>/check-runs` fetch resolves to the same rollup (#1601).
make_pr() {
  local num="$1" branch="$2" is_draft="$3" labels_json="$4" rollup_json="$5"
  local sha="sha${num}"
  write_rest_check_runs "$sha" "$rollup_json"
  printf '{"number":%s,"headRefName":"%s","isDraft":%s,"labels":%s,"headRefOid":"%s"}' \
    "$num" "$branch" "$is_draft" "$labels_json" "$sha"
}

# Helper to build a PR JSON entry for the single union PR list that
# dispatch-select-target fetches and exports to dispatch-phase. Carries the
# union of fields both scripts need. The 7th arg, closing_json, is the
# closingIssuesReferences array; it defaults to [] (PR closes no issue), so
# existing 6-arg call sites keep working unchanged.
make_pr_union() {
  local num="$1" branch="$2" created="$3" is_draft="$4" labels_json="$5" rollup_json="$6" closing_json="${7:-[]}"
  local sha="sha${num}"
  write_rest_check_runs "$sha" "$rollup_json"
  printf '{"number":%s,"createdAt":"%s","headRefName":"%s","isDraft":%s,"labels":%s,"headRefOid":"%s","closingIssuesReferences":%s}' \
    "$num" "$created" "$branch" "$is_draft" "$labels_json" "$sha" "$closing_json"
}

# Like make_pr_union, but carries an explicit `mergeable` field (8th arg). The
# select-target phase bucketing reuses dispatch-phase, which reads `.mergeable`
# to derive fix-conflicts; make_pr_union omits the key (defaults UNKNOWN, a
# no-op). Use this when a select-target test needs a CONFLICTING PR.
make_pr_union_mergeable() {
  local num="$1" branch="$2" created="$3" is_draft="$4" labels_json="$5" rollup_json="$6" mergeable="$7" closing_json="${8:-[]}"
  local sha="sha${num}"
  write_rest_check_runs "$sha" "$rollup_json"
  printf '{"number":%s,"createdAt":"%s","headRefName":"%s","isDraft":%s,"labels":%s,"headRefOid":"%s","mergeable":"%s","closingIssuesReferences":%s}' \
    "$num" "$created" "$branch" "$is_draft" "$labels_json" "$sha" "$mergeable" "$closing_json"
}

# Like make_pr, but carries an explicit `mergeable` field (the 6th arg). The
# fix-conflicts derivation in dispatch-phase / dispatch-ci-ready reads
# `.mergeable // "UNKNOWN"`; make_pr omits the key entirely (so its PRs default
# to UNKNOWN, a no-op for the derivation). Use this helper when a test needs to
# set mergeable to CONFLICTING / MERGEABLE / UNKNOWN explicitly.
make_pr_mergeable() {
  local num="$1" branch="$2" is_draft="$3" labels_json="$4" rollup_json="$5" mergeable="$6"
  local sha="sha${num}"
  write_rest_check_runs "$sha" "$rollup_json"
  printf '{"number":%s,"headRefName":"%s","isDraft":%s,"labels":%s,"headRefOid":"%s","mergeable":"%s"}' \
    "$num" "$branch" "$is_draft" "$labels_json" "$sha" "$mergeable"
}

# Write JSON to a temp file and echo its path, for passing the open-PR list to a
# child script via DISPATCH_PR_LIST_FILE (replaces the old inline
# DISPATCH_PR_LIST=<json> env channel, #1646).
pr_list_tmpfile() {
  local f
  f=$(mktemp "${TMPDIR:-/tmp}/test-pr-list.XXXXXX")
  printf '%s' "$1" > "$f"
  printf '%s' "$f"
}

# Green rollup (two passing check runs).
GREEN_ROLLUP='[{"status":"COMPLETED","conclusion":"SUCCESS"},{"status":"COMPLETED","conclusion":"NEUTRAL"}]'
# Failing rollup.
FAILING_ROLLUP='[{"status":"COMPLETED","conclusion":"FAILURE"}]'
# Pending rollup (one check not yet complete).
PENDING_ROLLUP='[{"status":"IN_PROGRESS","conclusion":null}]'
# Mixed rollup: one check concluded failing, one still pending.
MIXED_ROLLUP='[{"status":"COMPLETED","conclusion":"FAILURE"},{"status":"IN_PROGRESS","conclusion":null}]'
# Empty rollup.
EMPTY_ROLLUP='[]'
# No labels.
NO_LABELS='[]'

# <<< END MOVED <<<

# Promoted from the dispatch-resolve-arg / office-hours-select-target section
# (original lines 3675-3858): select_target_fake_claude, office_hours_fake_claude,
# office_hours_fresh_fake_claude, office_hours_state_fake_claude.
# >>> MOVED FROM test-dispatch-scripts.sh >>>

# Install a fake `claude` for the worktree-liveness checks in
# dispatch-resolve-worktree and the office-hours selector. Each argument is a
# worktree basename that should report a *live* session; the fake's
# `agents --json` returns one entry per name (client-side jq in
# claude_sessions_with_name applies the name filter, exactly as in production).
# Call with zero arguments to model an orphan-worktree world — `[]`, no live
# sessions — which the predicate reports as free, so the row is NOT skipped and
# a queue-mode resolve emits `enter`. Overrides the UNKNOWN default from setup.
select_target_fake_claude() {
  local payload="[" name first=1
  for name in "$@"; do
    if (( first )); then first=0; else payload+=","; fi
    payload+="{\"sessionId\":\"s-$name\",\"pid\":1,\"status\":\"busy\",\"name\":\"$name\",\"cwd\":\"\"}"
  done
  payload+="]"
  printf '%s' "$payload" > "$TMPDIR_TEST/claude-payload.json"
  cat > "$TMPDIR_TEST/bin/claude" <<'FAKE'
#!/usr/bin/env bash
# Ignore all args (including --cwd); return the full payload. The caller's jq
# name filter selects the matching session, as the real daemon path does.
# Log every live `agents` invocation (#1452): a test that sets
# DISPATCH_AGENTS_SNAPSHOT asserts this log stays empty (the machine-wide
# liveness functions read the snapshot file instead of shelling out here).
_root="$(cd "$(dirname "$0")/.." && pwd)"
echo "agents $*" >> "$_root/stub/claude-agents-calls.log"
cat "$_root/claude-payload.json"
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/bin/claude"
  export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/bin/claude"
}

# office_hours_fake_claude <live-worktree-basename>... — the `office-hours`
# entry-point fake. Reuses select_target_fake_claude's payload generation so the
# liveness parsing matches production exactly: each named worktree basename gets
# a live session row whose sessionId is `s-<name>` and whose job id is `j-<name>`
# (deliberately DISTINCT, mirroring production where `id` is the sessionId's
# first UUID group — so the entry test proves attach uses the job `id`, not the
# sessionId). The fake branches on its first arg: `agents` returns the JSON
# payload (the selector's liveness query AND the entry's sessionId→job-id
# resolution); any other invocation — `attach <id>` or `/office-hours` — prints
# `LAUNCH: $*` so a test can assert which launch fired. Wires both
# OFFICE_HOURS_CLAUDE_CMD (the entry script's launch + resolution target) and
# CLAUDE_AGENTS_CMD (the selector subprocess's liveness query) at the same fake,
# so a single binary serves both the query and the launch.
office_hours_fake_claude() {
  local payload="[" name first=1
  for name in "$@"; do
    if (( first )); then first=0; else payload+=","; fi
    payload+="{\"sessionId\":\"s-$name\",\"id\":\"j-$name\",\"pid\":1,\"status\":\"busy\",\"name\":\"$name\",\"cwd\":\"\"}"
  done
  payload+="]"
  printf '%s' "$payload" > "$TMPDIR_TEST/claude-payload.json"
  cat > "$TMPDIR_TEST/bin/claude" <<'FAKE'
#!/usr/bin/env bash
if [[ "${1:-}" == "agents" ]]; then
  # Liveness query: return the full payload. The caller's jq name filter selects
  # the matching session, as the real daemon path does.
  cat "$(cd "$(dirname "$0")/.." && pwd)/claude-payload.json"
  exit 0
fi
# A launch (`attach <id>` or `/office-hours`): record which one fired.
echo "LAUNCH: $*"
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/bin/claude"
  export OFFICE_HOURS_CLAUDE_CMD="$TMPDIR_TEST/bin/claude"
  # The entry script no longer queries liveness itself; the selector subprocess
  # it invokes does. Point CLAUDE_AGENTS_CMD at the same fake so a single binary
  # serves the selector's `agents` query and the entry script's launch.
  export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/bin/claude"
}

# office_hours_fresh_fake_claude — fake `claude` for the fresh (spawn-worker-
# style) entry path. Serves `agents` from an oh-registry.json (starts empty); on
# `--bg` records argv + $PWD and registers
# {"sessionId":"sess-<name>","id":"job-<name>",...} under --name (so
# the entry's name-based registration check finds it, and the entry's
# sessionId→job-id resolution finds the `id`; sessionId and
# `id` are DISTINCT so the test proves attach uses the job `id`); prints
# `LAUNCH: $*` on anything else (the entry's attach).
office_hours_fresh_fake_claude() {
  printf '[]' > "$TMPDIR_TEST/oh-registry.json"
  cat > "$TMPDIR_TEST/bin/claude" <<'FAKE'
#!/usr/bin/env bash
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REG="$ROOT/oh-registry.json"
case "${1:-}" in
  agents)
    cat "$REG"
    ;;
  --bg)
    pwd >> "$ROOT/oh-pwd-log"
    printf '%s\n' "$@" > "$ROOT/oh-bg-argv"
    name=""
    while [[ $# -gt 0 ]]; do
      if [[ "$1" == "--name" ]]; then name="${2:-}"; shift 2; continue; fi
      shift
    done
    tmp=$(mktemp)
    jq --arg name "$name" '. + [{"sessionId":("sess-"+$name),"id":("job-"+$name),"pid":9999,"status":"busy","name":$name,"cwd":"/worker"}]' "$REG" > "$tmp" && mv "$tmp" "$REG"
    ;;
  *)
    echo "LAUNCH: $*"
    ;;
esac
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/bin/claude"
  export OFFICE_HOURS_CLAUDE_CMD="$TMPDIR_TEST/bin/claude"
  export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/bin/claude"
}

# office_hours_state_fake_claude — fake `claude` for the state-gated office-hours
# selector + entry path (#2011). Each argument is a `name:state` pair; each pair
# `<name>:<state>` produces one session row:
#   sessionId = "s-<name>", id = "j-<name>"  (DISTINCT, so an entry test proves
#                                              attach uses the job `id`, not the
#                                              sessionId),
#   state     = <state>,
#   status    = "busy" when state == "working", else JSON null (the derived
#               coarse status — status:"busy" ⟺ state:"working"),
#   name      = <name>, pid = 1, cwd = "".
#
# --all FAITHFULNESS — the load-bearing property. Production hides `done`
# sessions from the default `claude agents --json` and surfaces them ONLY under
# `--all`. This fake mirrors that exactly: on `agents`, it scans argv for
# `--all`; if present it returns the FULL payload (including any `done` rows),
# and if absent it returns the payload with `done` rows stripped. That faithful
# behaviour is why a green suite cannot lie: if a future regression drops `--all`
# from the selector's `claude_sessions_with_name_all` or the entry's
# attach_session, the `done` row vanishes from that path and the done-attach
# cases (OHST3f / OH5b) turn red — exactly the regression this unit guards
# against. (A naive fake that returned `done` regardless of `--all` would let a
# `--all`-forgetting path still pass.)
#
# The fake branches on its first arg: `agents` returns the (possibly
# done-filtered) JSON payload; any other invocation — `attach <id>` or
# `/office-hours` — prints `LAUNCH: $*`. Wires both OFFICE_HOURS_CLAUDE_CMD (the
# entry script's launch + sessionId→job-id resolution) and CLAUDE_AGENTS_CMD
# (the selector subprocess's state query), mirroring office_hours_fake_claude.
office_hours_state_fake_claude() {
  local payload="[" pair name rest state cwd status_json first=1
  for pair in "$@"; do
    # Pair syntax: name:state[:cwd]. The optional third field carries a cwd path
    # (paths contain no ':'), so split into at most 3 fields. A 2-field input
    # leaves cwd empty — preserving the legacy name:state call sites.
    name="${pair%%:*}"; rest="${pair#*:}"
    if [[ "$rest" == *:* ]]; then
      state="${rest%%:*}"; cwd="${rest#*:}"
    else
      state="$rest"; cwd=""
    fi
    if [[ "$state" == "working" ]]; then status_json='"busy"'; else status_json='null'; fi
    if (( first )); then first=0; else payload+=","; fi
    payload+="{\"sessionId\":\"s-$name\",\"id\":\"j-$name\",\"pid\":1,\"state\":\"$state\",\"status\":$status_json,\"name\":\"$name\",\"cwd\":\"$cwd\"}"
  done
  payload+="]"
  printf '%s' "$payload" > "$TMPDIR_TEST/claude-payload.json"
  cat > "$TMPDIR_TEST/bin/claude" <<'FAKE'
#!/usr/bin/env bash
if [[ "${1:-}" == "agents" ]]; then
  PAYLOAD="$(cd "$(dirname "$0")/.." && pwd)/claude-payload.json"
  # --all faithfulness: a `done` row is visible ONLY when --all is in argv.
  # Production calls `agents --json --all`, so scan ALL args (not a fixed
  # position) for --all.
  for arg in "$@"; do
    [[ "$arg" == "--all" ]] && { cat "$PAYLOAD"; exit 0; }
  done
  # No --all → hide `done` rows, exactly as the real daemon's default query does.
  jq -c 'map(select(.state != "done"))' "$PAYLOAD"
  exit 0
fi
# A launch (`attach <id>` or `/office-hours`): record which one fired.
echo "LAUNCH: $*"
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/bin/claude"
  export OFFICE_HOURS_CLAUDE_CMD="$TMPDIR_TEST/bin/claude"
  export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/bin/claude"
}

# <<< END MOVED <<<

# Promoted from the dispatch-apply-office-hours section (original lines
# 5791-5794): log_state.
# >>> MOVED FROM test-dispatch-scripts.sh >>>
# Reports whether the gh stub recorded a given call log (present/absent).
log_state() {
  [[ -f "$STUB_DIR/$1" ]] && echo "present" || echo "absent"
}
# <<< END MOVED <<<

# Promoted from the dispatch-acquire-lock section (original lines 8460-8482):
# lock_setup, lock_teardown.
# >>> MOVED FROM test-dispatch-scripts.sh >>>
lock_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$STUB_DIR" "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/fake"

  cp "$SCRIPT_DIR/dispatch-acquire-lock" "$TMPDIR_TEST/scripts/dispatch-acquire-lock"
  # dispatch-acquire-lock sources lib.sh via its SCRIPT_DIR — so lib.sh must
  # sit alongside it. Sourced, not executed — no chmod +x.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-acquire-lock"

  export DISPATCH_LOCK_FILE="$STUB_DIR/dispatch.lock"
}

lock_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  STUB_DIR=""
  unset DISPATCH_LOCK_FILE CLAUDE_CODE_SESSION_ID CLAUDE_AGENTS_CMD \
    DISPATCH_LOCK_WAIT_INTERVAL DISPATCH_LOCK_WAIT_TIMEOUT \
    DISPATCH_LOCK_PROBE_TIMEOUT DISPATCH_LOCK_FLOCK_TIMEOUT \
    DISPATCH_LOCK_MAX_HOLD_SECONDS DISPATCH_CONFIG_DIR
}
# <<< END MOVED <<<

# Promoted from the dispatch-target-workers section (original lines
# 11944-11956): TW_NOW, tw_resets_for_x.
# >>> MOVED FROM test-dispatch-scripts.sh >>>
# Helper: epoch math for placing x. WEEK_SECONDS=604800.
TW_NOW=1000000
# remaining for a target x: (1 - x) * WEEK_SECONDS.
tw_resets_for_x() {
  # $1 = x as a decimal; print resets_at = NOW + max(1, round((1-x)*604800)).
  # The max(1,...) keeps remaining strictly positive at x=1.0 so Stage 1 does
  # NOT take the "window already reset" (remaining<=0) early-exit; the curve
  # then evaluates at x≈1.0 where W≈target_weekly. (At remaining=1 second,
  # x = (604800-1)/604800 ≈ 0.9999983, so W is within ~0.0002% of W(1)=90.)
  awk -v now="$TW_NOW" -v x="$1" '
    BEGIN { rem = int((1 - x) * 604800 + 0.5); if (rem < 1) rem = 1; printf "%d\n", now + rem }'
}

# <<< END MOVED <<<

# Promoted from the dispatch-project-status-read / dispatch-spawn-tick
# section (original lines 15172-15271): write_fake_spawn_router_claude and its
# SPAWN_ROUTER_* variable conventions. Reused by the dispatch-self-close tests.
# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# write_fake_spawn_router_claude — retained fake-`claude` writer
# ============================================================================
# dispatch-spawn-router has been deleted (the autonomous tick is now the headless
# dispatch-tick launched by dispatch-spawn-tick — see the dispatch-spawn-tick
# tests below). Its dedicated setup/teardown and test cases are gone with it, but
# the multi-subcommand fake-`claude` writer below is REUSED by the
# dispatch-self-close tests (which need the fake's `rm` dispatch and the
# SPAWN_ROUTER_RM_LOG convention). The writer and its SPAWN_ROUTER_* variable
# conventions are kept intact here, defined before the self-close section runs.
#
# write_fake_spawn_router_claude writes a multi-subcommand fake `claude` that a
# caller points DISPATCH_*_CLAUDE_CMD / CLAUDE_AGENTS_CMD at by absolute path, so
# no real daemon is needed. It interpolates these caller-set paths:
#   $SPAWN_ROUTER_REGISTRY   the `claude agents --json` fixture
#   $SPAWN_ROUTER_BG_ARGV    recorded argv of each `claude --bg` call
#   $SPAWN_ROUTER_PWD_LOG    records the spawn subshell's $PWD
#   $SPAWN_ROUTER_RM_LOG     recorded job-ids of each `claude rm` call
#   $SPAWN_ROUTER_STOP_LOG   recorded job-ids of each `claude stop` call
#   $SPAWN_ROUTER_PENDING    async-registration sidecar (delayed-register mode)

SPAWN_ROUTER_REGISTRY=""
SPAWN_ROUTER_BG_ARGV=""
SPAWN_ROUTER_PWD_LOG=""
SPAWN_ROUTER_RM_LOG=""
SPAWN_ROUTER_STOP_LOG=""
SPAWN_ROUTER_PENDING=""

# write_fake_spawn_router_claude — install the multi-subcommand fake `claude`.
# Dispatches on $1:
#   agents   — print the registry fixture verbatim. The fake ignores --cwd:
#              claude_sessions_under does no client-side path filtering — it
#              trusts server-side `--cwd` filtering — so every fixture session
#              is returned. Fine here: each fixture holds only sessions a test
#              means dispatch-spawn-router to see. If SPAWN_BG_REGISTER_AFTER_N
#              mode left a pending sidecar, decrement its countdown; when it
#              reaches zero, merge the pending agent into the registry and
#              delete the sidecar.
#   --bg     — record full argv to bg-argv. Then:
#                - SPAWN_BG_REGISTER_AFTER_N=<n> set → write pending sidecar
#                  (name + countdown=n) so the agent first appears on the
#                  n-th subsequent `agents` call. Models the daemon's async-
#                  registration race that verify_agent_registered_under closes.
#                - else SPAWN_BG_REGISTERS=1 (default) → parse --name and
#                  jq-append the new agent to the fixture so the verify step
#                  finds it on the first attempt.
#                - else (SPAWN_BG_REGISTERS=0) → never register.
#   rm       — append $2 (the job-id) to rm-log.
#   stop     — append $2 (the job-id) to stop-log.
write_fake_spawn_router_claude() {
  cat > "$TMPDIR_TEST/fake-claude" <<FAKE
#!/usr/bin/env bash
set -uo pipefail
case "\${1:-}" in
  agents)
    if [[ -f "$SPAWN_ROUTER_PENDING" ]]; then
      pending_name=\$(sed -n '1p' "$SPAWN_ROUTER_PENDING")
      pending_count=\$(sed -n '2p' "$SPAWN_ROUTER_PENDING")
      pending_count=\$((pending_count - 1))
      if [[ "\$pending_count" -le 0 ]]; then
        tmp=\$(mktemp)
        jq --arg name "\$pending_name" \
          '. + [{"sessionId":("sess-"+\$name),"pid":9999,"cwd":"/main","kind":"background","status":"busy","name":\$name}]' \
          "$SPAWN_ROUTER_REGISTRY" > "\$tmp" && mv "\$tmp" "$SPAWN_ROUTER_REGISTRY"
        rm -f "$SPAWN_ROUTER_PENDING"
      else
        printf '%s\n%s\n' "\$pending_name" "\$pending_count" > "$SPAWN_ROUTER_PENDING"
      fi
    fi
    cat "$SPAWN_ROUTER_REGISTRY"
    ;;
  --bg)
    pwd >> "$SPAWN_ROUTER_PWD_LOG"
    printf '%s\n' "\$@" > "$SPAWN_ROUTER_BG_ARGV"
    name=""
    while [[ \$# -gt 0 ]]; do
      if [[ "\$1" == "--name" ]]; then name="\${2:-}"; shift 2; continue; fi
      shift
    done
    if [[ -n "\${SPAWN_BG_REGISTER_AFTER_N:-}" ]]; then
      printf '%s\n%s\n' "\$name" "\$SPAWN_BG_REGISTER_AFTER_N" > "$SPAWN_ROUTER_PENDING"
    elif [[ "\${SPAWN_BG_REGISTERS:-1}" == "1" ]]; then
      tmp=\$(mktemp)
      jq --arg name "\$name" \
        '. + [{"sessionId":("sess-"+\$name),"pid":9999,"cwd":"/main","kind":"background","status":"busy","name":\$name}]' \
        "$SPAWN_ROUTER_REGISTRY" > "\$tmp" && mv "\$tmp" "$SPAWN_ROUTER_REGISTRY"
    fi
    ;;
  rm)
    shift
    printf '%s\n' "\${1:-}" >> "$SPAWN_ROUTER_RM_LOG"
    ;;
  stop)
    printf '%s\n' "\${2:-}" >> "$SPAWN_ROUTER_STOP_LOG"
    ;;
esac
FAKE
  chmod +x "$TMPDIR_TEST/fake-claude"
}

# <<< END MOVED <<<

# Promoted from the dispatch-merge-main section (original lines 21130-21155):
# merge_main_setup, merge_main_teardown.
# >>> MOVED FROM test-dispatch-scripts.sh >>>
# Helper: create an isolated git test environment.
# Sets MERGE_MAIN_TMPDIR, ORIGIN_REPO, WORKTREE_REPO.
merge_main_setup() {
  MERGE_MAIN_TMPDIR=$(mktemp -d)
  ORIGIN_REPO="$MERGE_MAIN_TMPDIR/origin"
  WORKTREE_REPO="$MERGE_MAIN_TMPDIR/worktree"

  # Create a bare-like origin with an initial commit on main.
  git init -q "$ORIGIN_REPO"
  git -C "$ORIGIN_REPO" config user.email "test@test"
  git -C "$ORIGIN_REPO" config user.name "Test"
  git -C "$ORIGIN_REPO" checkout -q -b main 2>/dev/null || true
  touch "$ORIGIN_REPO/seed.txt"
  git -C "$ORIGIN_REPO" add seed.txt
  git -C "$ORIGIN_REPO" commit -q -m "initial"

  # Clone the origin to create the local worktree repo.
  git clone -q "$ORIGIN_REPO" "$WORKTREE_REPO"
  git -C "$WORKTREE_REPO" config user.email "test@test"
  git -C "$WORKTREE_REPO" config user.name "Test"
}

merge_main_teardown() {
  rm -rf "$MERGE_MAIN_TMPDIR"
  unset MERGE_MAIN_TMPDIR ORIGIN_REPO WORKTREE_REPO
}
# <<< END MOVED <<<

# Promoted from the drift-scan section (original lines 24840-24864):
# assert_contains_local, assert_not_contains_local.
# >>> MOVED FROM test-dispatch-scripts.sh >>>
# Local contains / not-contains helpers for the drift-scan section. (The suite
# has only assert_eq; these mirror the inline contains-pattern used elsewhere.)
assert_contains_local() {
  local label="$1" needle="$2" hay="$3"
  TOTAL=$((TOTAL + 1))
  if [[ "$hay" == *"$needle"* ]]; then
    PASS=$((PASS + 1)); echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: $label"
    echo "    needle: '$needle'"
    echo "    actual: '$hay'"
  fi
}

assert_not_contains_local() {
  local label="$1" needle="$2" hay="$3"
  TOTAL=$((TOTAL + 1))
  if [[ "$hay" != *"$needle"* ]]; then
    PASS=$((PASS + 1)); echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: $label"
    echo "    unexpected needle present: '$needle'"
    echo "    actual: '$hay'"
  fi
}
# <<< END MOVED <<<

# --- Unit 2 addition (tactic-dispatch-test-monolith-split) -------------------
# REPO_ROOT is not a "moved" line — it is a new shared definition added when
# splitting the monolith into per-SUT files. In the monolith it was computed
# once (originally by the dispatch-complete-phase section) and then relied on
# implicitly by far-later sections in the same process (e.g. qa-fix-partition's
# call-site grep against "$REPO_ROOT/.claude/workflows/qa-fix.js"). Once split
# into separate files/processes, that implicit carry-over breaks. The
# derivation is pure and deterministic (SCRIPT_DIR is always
# .claude/skills/dispatch-propagate/scripts, four levels below the repo root),
# so centralizing it here is safe and equivalent for every consumer, including
# the few files that also recompute it locally (harmless redundant
# reassignment to the same value).
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
