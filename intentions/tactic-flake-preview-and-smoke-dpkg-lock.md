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
phase: qa
execution:
  branch: tactic-flake-preview-and-smoke-dpkg-lock
  pr: 3020
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours:
  reason: "/qa-fix: QA needs a human — the bounded auto-fix attempt cap has been
    reached (ATTEMPT_N=3 >= CAP=3, dispatch:qa-fix-attempt-3 label). This 4th QA
    pass's triage found 6 new residue items (5 script-verifiable FAILs on the CI
    dpkg-lock mitigation's own robustness/consistency, plus 1
    needs-human-judgment item), all classified opus-fixable/needs-human by the
    disposition Workflow, but no auto-fix ran since the cap was already reached
    (plan_fix pre-gate false, result.fix_plan === null). Escalating to
    office-hours for human review/fix rather than a 4th autonomous attempt."
  since: 2026-08-03
  recommendation: >-
    # Recommendation — PR #3020 dpkg-lock mitigation (parked at attempt cap)


    ## Do these together: findings 1 + 2 + 3 are one bug


    They are three symptoms of "the step's worst case isn't actually bounded."
    Fix in one edit to `.github/workflows/pr-checks.yml:45-219`:


    1. **Bound the unbounded calls.** Wrap every `sudo systemctl` / `sudo fuser`
    call in `timeout` — `sudo timeout 20 systemctl mask --now …` (line 97), same
    on `systemctl kill` (line 104) and the `fuser -v`/`fuser -k` probes. This
    kills finding 3 outright: derived worst case becomes
    20+20+10(grace)+120(wait)+120(dpkg) = 290s, genuinely under the 300s cap,
    and the "~50s of slack" claim in the comment becomes true instead of
    aspirational.

    2. **Add `continue-on-error: true`** next to `timeout-minutes: 5` (line 64).
    Every internal path already exits 0 by design; without this, the step cap is
    the one way this best-effort step can block a PR. Once (1) makes the cap
    unreachable in normal operation, `continue-on-error` costs nothing and
    closes the new failure mode.

    3. **Rewrite the budget comment (lines 39-63) to state additivity
    explicitly.** The two budgets *are* additive in the worst case (5 + ~11 work
    + up to 12 min of `wait_for_dpkg_lock` = ~28 min > the 20-min cap), but
    near-mutually-exclusive in practice — the helper only waits after a failed
    attempt, which the pre-step exists to prevent. Say exactly that, and either
    raise `timeout-minutes` to 30 (matching `acceptance`) or record the accepted
    residual risk. Do not leave it ambiguous.


    ## Finding 4 — fix, it's small


    At line 213, capture rc and branch: `if [ "$rc" -eq 124 ]` → log `dpkg
    --configure -a: TIMED OUT (may have left dpkg interrupted)` and retry once
    with `timeout 120`. A 124 is the failure the recovery was meant to prevent;
    logging it as a benign no-op is the defect.


    ## Finding 5 — in scope; extract, don't copy


    The node's scope note excludes only the office-hours app and smoke
    build/deploy internals; the sibling `acceptance` job (line 12) is fair game,
    uses the same helper, and this PR's 30s revert leaves it undefended. Extract
    the run block to `.github/scripts/free-dpkg-lock.sh` and call it from both
    jobs — a 180-line copy-paste is the only reason to defer. If deferring, file
    it as a blocked follow-up rather than silently shipping the gap.


    ## Finding 6 — just do it


    Update the PR body: default stays 30s (not raised to 120s), and the step
    probes three lock files.
  session_type: other
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
