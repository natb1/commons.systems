---
id: tactic-playwright-watchdog-orphan-sleep
kind: tactic
statement: Fix playwright_install_with_deps's watchdog to not leak an orphan
  sleep child when the main body cancels it on a fast success or non-stall
  failure, since kill "$watchdog_pid" only signals the subshell and its sleep
  "$timeout_s" grandchild is reparented to init and keeps running for the
  remainder of timeout_s
owner: ai
status: raw
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-main-health
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Fix playwright_install_with_deps's watchdog to not leak an orphan sleep child when the main body cancels it on a fast success or non-stall failure, since kill "$watchdog_pid" only signals the subshell and its sleep "$timeout_s" grandchild is reparented to init and keeps running for the remainder of timeout_s

Draft — provenance from `/review-fix` on PR #2958.

## Finding

**Location:** `.claude/skills/dispatch-propagate/scripts/lib.sh:1711` (watchdog subshell in `playwright_install_with_deps`).

The watchdog subshell runs `sleep "$timeout_s"` as a child process. On a fast
success or a non-stall failure the main body cancels the watchdog with
`kill "$watchdog_pid"`, which signals only the subshell — its `sleep` child is
reparented to init and keeps running for the remainder of `timeout_s` (up to
~300s by default), so each attempt leaks one long-lived orphan `sleep`.

**Failure scenario:** every successful or fast-failing `playwright_install_with_deps`
attempt leaves an orphan `sleep "$timeout_s"` process running in the background
until it naturally expires. Impact is benign — the orphan holds no lock,
consumes ~0 CPU, does not block script exit, and self-terminates within
`timeout_s` — but it is untidy process hygiene, not a functional bug.

**Adversarial verdict:** not applicable — this is a code-review `Deferred`
finding (out-of-scope for the source PR's fix), not a security `Required`
finding, so it was not routed through the adversarial-verify skeptic pass.

**Source PR:** #2958 (`tactic-playwright-install-retry-lock`).

## Recommended fix

This repo deliberately avoids process-group / `pgrep`-based kills because the
sandbox blocks that IPC (`kill_tree`'s ps-walk is used instead of
`setsid`/process-group kill — see `lib.sh:2154`). Reusing
`kill_tree "$watchdog_pid"` would kill the `sleep` but adds `kill_tree`'s real
2s SIGTERM→SIGKILL grace to every fast success — an unwanted latency
regression on the happy path. A trap-based approach avoids the latency cost
but adds concurrency subtlety, e.g.:

```bash
(
  sleep "$timeout_s" & sleep_pid=$!
  trap 'kill "$sleep_pid" 2>/dev/null' TERM
  wait "$sleep_pid"
  ...
) &
```

Add a unit test in `test-dispatch-scripts.sh` (near the playwright group) that
asserts no orphan `sleep` survives after a fast success — the group's
instant-`sleep` stub means a real-`sleep`-based assertion is needed, as in the
existing stall test (test 6).
