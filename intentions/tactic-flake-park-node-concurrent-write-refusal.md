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
  reason: "graph-commit: mechanical-unresolved — 1 field(s) diverged across
    concurrent writes and could not be auto-merged (layers 1-3 exhausted)"
  since: 2026-07-22
  recommendation: |-
    A concurrent writer landed an overlapping edit to this node while this session's edit was in flight; this writer's content was NOT landed. This session's unlanded content is preserved at /tmp/tmp.yH8HHZjwUp/tactic-flake-park-node-concurrent-write-refusal.md (this machine only — may not survive past this session). Recommended: the losing writer re-reads the current origin/main content, manually merges in its intended edit, and re-runs graph-commit on the merged result — that same commit clears this office_hours park. A third session encountering this park while the loser is still working should wait rather than attempt its own merge (the mailbox discipline).

    Diverged field 'body' on tactic-flake-park-node-concurrent-write-refusal:
      this session's value: # Fix park-node's Case 2 test in test-park-node.sh (concurrent-write refusal) causing the hook-tests CI job to intermittently fail

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

    recurred on PR #2920 / run https://github.com/natb1/commons.systems/actions/runs/29888639506/job/88824450806

    Failure excerpt (CI, PR #2920, run 29888639506, job 88824450806):
    ```
    FAIL: concurrent-write refusal (rc=1 before_sha=23668a6f67d3183f9e55d0cc3a9c45212354f13a)
    error: graph-commit: refusing to start — unrelated dirty tracked file(s) outside this call's node set:
    park-node: graph-commit failed for t-concurrent; the office_hours write is on disk but not landed
    passed: 2  failed: 1
    ```

    Same root cause as the PR #2927 recurrence above. Confirmed via local reproduce
    on PR #2920's worktree: 3/3 runs of
    `bash packages/intentionsutil/scripts/test-park-node.sh` failed with the
    identical signature. Not caused by PR #2920's own diff
    (router.ts/transitions.ts/reconcile-graph-review-stall/dispatch-select-tick —
    none of which touch park-node or graph-commit).

      origin/main's value: # Fix park-node's Case 2 test in test-park-node.sh (concurrent-write refusal) causing the hook-tests CI job to intermittently fail

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
