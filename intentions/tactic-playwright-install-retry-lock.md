---
id: tactic-playwright-install-retry-lock
kind: tactic
statement: "Fix playwright_install_with_deps retry: kill a timed-out attempt via
  its process tree before retrying, so attempt 2 does not die on the dpkg lock
  and the retry count is real"
owner: ai
status: raw
parent: null
rationale: "Observed 2026-07-23 on PR #2946 CI: attempt 1 timed out at 300s mid
  apt-get but the process kept running, so attempt 2 immediately failed on E:
  Could not get lock /var/lib/dpkg/lock-frontend — the advertised 2 attempts are
  effectively 1. Resolved that day only by gh run rerun --failed."
reading: null
gap: null
serves:
  - strategy-main-health
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 3
  override: null
  rationale: "Author-directed 2026-07-23 /align-strategy round: the top-3 systemic
    gaps (PR custody, scripted census, playwright retry) rank ahead of the
    low-urgency tracked gaps once finalized."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Fix playwright_install_with_deps retry: kill a timed-out attempt via its process tree before retrying, so attempt 2 does not die on the dpkg lock and the retry count is real

## Interview context (2026-07-23, /align-strategy byproduct — raw, for /align-tactics)

Observed on PR #2946 CI, 2026-07-23: `playwright_install_with_deps` attempt 1 timed out at 300s mid-`apt-get`, but the apt process kept running; attempt 2 immediately died on `E: Could not get lock /var/lib/dpkg/lock-frontend`. The advertised retry is therefore effectively one attempt. Recovered that day only via `gh run rerun --failed` (both passed — pure flake amplified by the wrapper).

Fix shape: on timeout, kill the attempt's process group and wait for the dpkg lock to release (or run apt under a `timeout` that kills the tree) before retrying.
