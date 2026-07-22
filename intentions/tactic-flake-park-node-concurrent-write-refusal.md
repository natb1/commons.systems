---
id: tactic-flake-park-node-concurrent-write-refusal
kind: tactic
statement: Fix park-node's Case 2 test in test-park-node.sh (concurrent-write
  refusal) causing the hook-tests CI job to fail deterministically
owner: ai
status: codified
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours:
  reason: '/implement: no code change in scope — the concurrent-write refusal
    flake this node targets was already fixed on origin/main by commit 71a7ddd45
    (merged 2026-07-22T21:11:34, after all three CI failures this node recorded,
    ~03:09-03:23 UTC same day). Verified via 8/8 clean local reruns of
    test-park-node.sh and zero "concurrent-write" matches in post-fix CI
    hook-tests logs. Parking for a human decision rather than opening an
    empty/no-op PR.'
  since: 2026-07-22
  recommendation: >-
    ## Recommendation: very likely already fixed by 71a7ddd45


    The specific bug this node targets — Case 2's concurrent-write refusal
    failing because the wrapper swap of
    `packages/intentionsutil/scripts/graph-commit` trips
    `assert_clean_outside_ids` — was fixed on main by commit `71a7ddd45` (merged
    2026-07-22T21:11:34, after all three recorded CI failures at ~03:09-03:23
    UTC). That commit added `git add` + `git commit` of the wrapper right after
    it is installed (test-park-node.sh lines 278-284), exactly the fix this
    node's own diagnosis proposed.


    Evidence it holds:

    - Local: ran the test 8 times on current origin/main content — 8/8 passed
    3/3, including Case 2, no flakiness.

    - CI: hook-tests failures after the fix landed grep zero matches for
    "concurrent-write". The failures in that window were a different test
    (`guard-halt` / `primary-checkout-not-on-main`), outside this node's scope.


    Suggested next action: mark this node done with no PR, citing `71a7ddd45` as
    the actual fix commit (or a doc-only body update noting it). No code change
    remains in scope.


    Residual uncertainty: the original bug was intermittent. If you want higher
    confidence, trigger a few repeat hook-tests CI runs before closing.
pace_exempt: false
rounds: null
attributes: {}
---
# Fix park-node's Case 2 test in test-park-node.sh (concurrent-write refusal) causing the hook-tests CI job to fail deterministically

Fingerprint: hook-tests — packages/intentionsutil/scripts/test-park-node.sh:259

Reproduce command: `bash packages/intentionsutil/scripts/test-park-node.sh`

Failure excerpt (CI, PR #2927, run 29887717446, job 88821643737):
```
PASS: stale far-ahead park: landed body edit survives, office_hours set, HEAD restored
FAIL: concurrent-write refusal (rc=1 before_sha=46b0fa1ddaff0fa959ad4e117549f1c96ef34014)
From /tmp/tmp.xuFdW0UzxT/origin
 * branch            main       -> FETCH_HEAD
npx shim: set office_hours on t-concurrent (since=2026-07-22)
error: graph-commit: refusing to start — unrelated dirty tracked file(s) outside this call's node set:
 M packages/intentionsutil/scripts/graph-commit
       stash or commit these first (e.g. 'git stash -u'), then re-run graph-commit — it resumes safely (a prior partial local commit is detected and just pushed forward).
park-node: graph-commit failed for t-concurrent; the office_hours write is on disk but not landed
...
PASS: absent node: park-node refuses a node not on origin/main (exit 1), main unchanged

passed: 2  failed: 1
```

Diagnosis: not caused by PR #2927's own change (a pure SKILL.md doc
restructuring for `qa-fix`/`review-fix`) — reproduces identically on plain
`origin/main`. Root cause: `test-park-node.sh`'s Case 2 (line 217) overwrites
the tracked `packages/intentionsutil/scripts/graph-commit` file in-place with a
thin wrapper (to inject a concurrent write) without hiding the modification
from git, which trips `graph-commit`'s `assert_clean_outside_ids` pre-flight
guard (added by PR #2914) before the test's intended "stale base" collision
path is reached. This exact commit passed hook-tests (3/3 park-node subcases)
in park-node's own PR #2928 CI run ~13-24h earlier (same git version), so the
failure is non-deterministic across runs of identical code, not a hard
100%-repro logic bug. A deeper mismatch also exists: current `graph-commit`'s
layered auto-merge/park logic (added by PR #2911, which postdates park-node's
own PR #2928) takes a "concurrent-edit conflict; parking" path instead of the
simple "stale base" die the test's `grep -q 'stale base'` assertion expects.
The fix needs to either hide the wrapper's tracked-file modification from
`assert_clean_outside_ids` (e.g. `git update-index --assume-unchanged`) or
update the test's expected-outcome assertion to match `graph-commit`'s current
layered conflict-resolution behavior — likely both.

recurred on PR #2927 / run https://github.com/natb1/commons.systems/actions/runs/29887717446/job/88821643737

---

recurred on PR #2917 / run https://github.com/natb1/commons.systems/actions/runs/29888298326/job/88823410246

Failure excerpt (CI, PR #2917, run 29888298326, job 88823410246):
```
PASS: stale far-ahead park: landed body edit survives, office_hours set, HEAD restored
FAIL: concurrent-write refusal (rc=1 before_sha=cf63341125d2e4c5b61feafdb80b2c715f72e3bf)
From /tmp/tmp.r6CHsmhkCg/origin
 * branch            main       -> FETCH_HEAD
npx shim: set office_hours on t-concurrent (since=2026-07-22)
error: graph-commit: refusing to start — unrelated dirty tracked file(s) outside this call's node set:
 M packages/intentionsutil/scripts/graph-commit
       stash or commit these first (e.g. 'git stash -u'), then re-run graph-commit — it resumes safely (a prior partial local commit is detected and just pushed forward).
park-node: graph-commit failed for t-concurrent; the office_hours write is on disk but not landed
...
PASS: absent node: park-node refuses a node not on origin/main (exit 1), main unchanged

passed: 2  failed: 1
```

Same root cause as the PR #2927 recurrence above — this is PR #2917's own diff (`tactic-live-session-check-path-clobber`, a `lib-claude-agents.sh` zsh path-clobber fix) and does not touch `test-park-node.sh` or `graph-commit`. Not caused by this PR's change.

---

recurred on PR #2896 / run https://github.com/natb1/commons.systems/actions/runs/29887920463/job/88822271317

Failure excerpt (CI, PR #2896, run 29887920463, job 88822271317):
```
PASS: stale far-ahead park: landed body edit survives, office_hours set, HEAD restored
FAIL: concurrent-write refusal (rc=1 before_sha=9a1209f92eab687def9c68a2ecc8dc3aeddd93c3)
From /tmp/tmp.OKfR9of9yx/origin
 * branch            main       -> FETCH_HEAD
npx shim: set office_hours on t-concurrent (since=2026-07-22)
error: graph-commit: refusing to start — unrelated dirty tracked file(s) outside this call's node set:
 M packages/intentionsutil/scripts/graph-commit
       stash or commit these first (e.g. 'git stash -u'), then re-run graph-commit — it resumes safely (a prior partial local commit is detected and just pushed forward).
park-node: graph-commit failed for t-concurrent; the office_hours write is on disk but not landed
...
PASS: absent node: park-node refuses a node not on origin/main (exit 1), main unchanged

passed: 2  failed: 1
```

Same root cause as the PR #2927 recurrence above — this is PR #2896's own diff (`tactic-align-tactics-mechanical-floor`, a planlint.ts body lint plus align-tactics-census.ts/align-strategy-census.ts) and does not touch `test-park-node.sh` or `graph-commit`. Not caused by this PR's change.
