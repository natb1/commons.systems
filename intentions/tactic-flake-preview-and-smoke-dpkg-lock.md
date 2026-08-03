---
id: tactic-flake-preview-and-smoke-dpkg-lock
kind: tactic
statement: "CI flake: preview-and-smoke job fails when
  playwright_install_with_deps exhausts its retries because an external runner
  process holds /var/lib/dpkg/lock-frontend for the whole job, unrelated to any
  PR's own changes"
owner: ai
status: codified
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-flake-preview-and-smoke-dpkg-lock
  pr: 3020
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# CI flake: preview-and-smoke job fails when playwright_install_with_deps exhausts its retries because an external runner process holds /var/lib/dpkg/lock-frontend for the whole job, unrelated to any PR's own changes

## Context

`preview-and-smoke` failed on PR #3002 (`tactic-autonomous-ci-pending-liveness-bound`).
`playwright_install_with_deps` (`.claude/skills/dispatch-propagate/scripts/lib.sh`)
exhausted both its install attempts because `/var/lib/dpkg/lock-frontend` was
held by an external process (pid 3064) for the entire ~11-minute job — spanning
both the initial attempt-pair and the smoke-test script's own full
reset-and-rebuild retry cycle roughly 8 minutes later. The existing `#1899`/
`PR #2946` mitigations (`timeout` + `kill_tree` in `playwright_install_with_deps`,
`wait_for_dpkg_lock`'s 30s poll) target a stalled child of *this job's own*
install attempt; they are not designed to survive an external
runner-housekeeping process (e.g. `unattended-upgrades`) holding the lock for
the whole job.

Confirmed unrelated to the PR's own diff: the only files that diverge between
the PR head and `origin/main` (since their merge-base) are graph-state
`intentions/*.md` records and `packages/intentionsutil/scripts/graph-commit` —
nothing touches the office-hours app, playwright/vite config, or
`lib.sh`'s playwright/dpkg helpers. See the Fingerprint/Reproduce
command/Failure excerpt sections below for the full diagnostic record.

## Scope

Investigate whether `wait_for_dpkg_lock`/`playwright_install_with_deps`
(`.claude/skills/dispatch-propagate/scripts/lib.sh`) can be hardened against a
lock held by a process outside this job's own tree — e.g. a longer
`DPKG_LOCK_WAIT_TIMEOUT`, or disabling/waiting out `unattended-upgrades`
explicitly in the runner setup step before the install begins. Out of scope:
any change to the office-hours app itself, or to the smoke-test's
build/deploy steps, which are not implicated.

## Recommended model

sonnet

## Verification

Manual and judgment checks:

- Confirm via the GitHub Actions runner logs (or a repro on affected CI infra)
  which process holds `/var/lib/dpkg/lock-frontend` and whether it is a
  known runner-image housekeeping job (e.g. `unattended-upgrades`,
  `apt-daily.service`).
- If a mitigation lands (longer wait, explicit lock-holder wait/kill, or
  disabling the housekeeping job), watch subsequent `preview-and-smoke` runs
  for recurrence of this exact fingerprint before resolving this tactic to
  `phase: done`.

## Fingerprint

```
Fingerprint: preview-and-smoke — playwright_install_with_deps: failed after 2 attempts
```

## Reproduce command

```
.claude/skills/dispatch-propagate/scripts/run-smoke-tests.sh office-hours <preview-url>
```

Not locally reproducible in the ordinary sense: this is a GitHub Actions
runner-level `dpkg`/`apt` lock contention race, not a code defect. First
observed on PR #3002 (`tactic-autonomous-ci-pending-liveness-bound`), whose
own diff never touches the office-hours app, playwright config, or the
`playwright_install_with_deps`/`wait_for_dpkg_lock` helpers in
`.claude/skills/dispatch-propagate/scripts/lib.sh`.

## Failure excerpt

```
playwright_install_with_deps: attempt 1/2 failed or timed out after 300s
wait_for_dpkg_lock: /var/lib/dpkg/lock-frontend still held after 30s; retrying anyway
playwright_install_with_deps: attempt 2/2
E: Could not get lock /var/lib/dpkg/lock-frontend. It is held by process 3064 (apt-get)
E: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), is another process using it?
Failed to install browsers
playwright_install_with_deps: attempt 2/2 failed or timed out after 300s
playwright_install_with_deps: failed after 2 attempts
Smoke test failed — resetting channel and retrying...
[... full rebuild+redeploy retry cycle ...]
E: Could not get lock /var/lib/dpkg/lock-frontend. It is held by process 3064 (apt-get)
playwright_install_with_deps: failed after 2 attempts
FAIL: office-hours smoke tests
```

Process 3064 held the dpkg lock across both attempt-pairs (~8 minutes apart,
spanning a full smoke-test reset-and-rebuild cycle) — consistent with an
external runner-housekeeping process (e.g. `unattended-upgrades`), not a
leaked child of this job's own playwright install. The existing `#1899`/`PR
#2946` mitigations in `playwright_install_with_deps`/`wait_for_dpkg_lock`
target a stalled child of *this job's own* install attempt; they are not
designed to survive an external process holding the lock for the runner's
entire lifetime.

recurred on PR #3002 / run https://github.com/natb1/commons.systems/actions/runs/30637085583/job/91177292699

## needs-main residue

- id: recurrence-watch
  title: Confirm the dpkg-lock-frontend fingerprint does not recur on subsequent preview-and-smoke runs
  url_path: current
  expected_outcome: Subsequent `preview-and-smoke` CI runs after PR #3020 merges do not reproduce the `playwright_install_with_deps: failed after 2 attempts` / `E: Could not get lock /var/lib/dpkg/lock-frontend` fingerprint.
  finding: PR #3020 landed two mitigations in `preview-and-smoke` (a step that stops/kills apt-daily/unattended-upgrades units and self-excluding `pkill -f` patterns, plus a bounded 120s wait with a holder diagnostic on expiry) and raised `wait_for_dpkg_lock`'s default timeout from 30s to 120s. This is the node's own stated verification (watch subsequent runs for recurrence before resolving to `phase: done`) and cannot be settled within the QA session that authored the fix — it requires observing CI runs over time after merge.
  Verifiability: WAIT — awaiting N subsequent `preview-and-smoke` CI runs post-merge; check via `gh run list --workflow pr-checks.yml -e push -b main --json conclusion,createdAt` or by grepping recent run logs for the fingerprint string `E: Could not get lock /var/lib/dpkg/lock-frontend`.

- id: holder-allowlist-incomplete
  title: Confirm no dpkg/apt lock holder outside the masked-unit allowlist appears on subsequent preview-and-smoke runs
  url_path: current
  expected_outcome: Subsequent `preview-and-smoke` runs' "Disable unattended-upgrades / free dpkg lock" step logs never show a lock holder surviving past the fuser -k stage that originated from a unit outside the masked/killed allowlist (`apt-daily.service`, `apt-daily-upgrade.service`, both timers, `unattended-upgrades.service`) — e.g. `dpkg-db-backup.timer`, `apt-news.service`, `esm-cache.service`, `man-db.timer`.
  finding: The step's unit mask/kill and `fuser -k` calls are point-in-time (t=0, immediately after checkout); the original flake's window extended roughly 8 minutes into the job. A holder started after t=0 by a unit outside the masked allowlist would not be pre-emptively caught by the mask/kill stage (though it would still be visible to and killed by the per-lock `fuser -k` pass and waited on by the shared 120s deadline). Whether any such unit is a plausible mid-job lock holder on the GitHub runner image is only observable from post-merge `preview-and-smoke` run logs, so this folds into the existing recurrence-watch observation rather than being resolvable at QA time.
  Verifiability: WAIT — awaiting N subsequent `preview-and-smoke` CI runs post-merge; check the mitigation step's holder-diagnostic log lines (`<lock> holders at step start:`, `<lock> still held at the shared 120s deadline; holders:`) for a process from a unit outside the masked allowlist.

- id: cap-design-tradeoff-acceptance
  title: Confirm the mitigation step's 5-minute best-effort cap does not truncate the dpkg-configure retry in practice
  url_path: current
  expected_outcome: Subsequent `preview-and-smoke`/`acceptance` runs never show the "Disable unattended-upgrades / free dpkg lock" step killed by its own `timeout-minutes: 5` cap while the `dpkg --configure -a` rc=124 retry is in flight — i.e. the documented worst-case overrun (the retry can push the step past the derived 290s budget, up to +120s more) never actually manifests as a truncated, interrupted-dpkg exit in a real run.
  finding: A QA pass (post office-hours re-verification, PR #3020) confirmed `free-dpkg-lock.sh`'s own header comment already documents and accepts this tradeoff — the step is `continue-on-error: true`, so the 300s step cap is a safety stop rather than a correctness bound, and a truncation there would be non-fatal to the job. Whether the cap is actually exercised (i.e. whether the retry path is hit often enough in practice to matter) is only observable from post-merge run logs, not resolvable at QA time. This is a planned-deferral acceptance check, not an actionable defect: the design has already been made and documented, this residue only confirms it holds up in production.
  Verifiability: WAIT — awaiting N subsequent `preview-and-smoke`/`acceptance` CI runs post-merge; check the mitigation step's logs for `dpkg --configure -a: TIMED OUT on retry` co-occurring with the step being marked failed/cancelled by its own timeout (rather than continuing past it via `continue-on-error`).
