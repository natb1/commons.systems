---
id: tactic-flake-park-node-case2-dirty-tree-guard
kind: tactic
statement: Fix park-node's Case 2 test in test-park-node.sh (concurrent-write
  refusal) intermittently tripping graph-commit's assert_clean_outside_ids
  dirty-tracked-file guard in CI, unrelated to the triggering PR's own changes
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
phase: implement
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "/implement: no code fix needed — this node's recorded CI failure (PR
    #2936, 2026-07-22T16:57:21-04:00) is a stale pre-fix run of a bug already
    fixed by commit 71a7ddd45a5 (merged 2026-07-22T17:11:34-04:00, PR #2926),
    which duplicates the already-closed sibling node
    tactic-flake-park-node-concurrent-write-refusal. Verified locally: 5/5 clean
    test-park-node.sh runs on current origin/main HEAD (a18bf1c1), and zero
    hook-tests/PR-Checks failures across ~21 post-fix CI runs
    (2026-07-22T21:11:34Z through 2026-07-23T00:00Z). Parking for
    human/align-tactics review to close as duplicate rather than opening a no-op
    PR."
  since: 2026-07-23
  recommendation: >-
    Close this node with no PR, mirroring the sibling
    `tactic-flake-park-node-concurrent-write-refusal`'s closure and citing the
    same fix commit 71a7ddd45a5 ("qa-fix: skip redundant node-lane origin/main
    merge (Step 0.5) (#2926)"), which added the `git add`/`git commit` of the
    Case 2 graph-commit wrapper swap so the tracked-file modification no longer
    trips `assert_clean_outside_ids`. This node's only recorded failure (PR
    #2936, 20:57:21Z / 16:57:21 -04:00) predates the fix landing (17:11:34
    -04:00) by 14 minutes, so it is a stale pre-fix run — no code change is
    needed. Record it as a duplicate recurrence note pointing at the sibling
    rather than opening independent work.


    Confirmed post-fix: local reproduction passed 5/5 runs (3/3 subcases each)
    on current origin/main HEAD (a18bf1c1). Also checked ~21 "PR Checks" CI runs
    created after 2026-07-22T21:11:34Z (the fix's UTC landing time) through
    2026-07-23T00:00Z — all succeeded (one still in-progress at check time),
    zero recurrences of the assert_clean_outside_ids / concurrent-write
    signature. This confirms the diagnosis: safe to close.


    References:

    - #2926: https://github.com/natb1/commons.systems/pull/2926

    - #2936: https://github.com/natb1/commons.systems/pull/2936
pace_exempt: false
rounds: null
attributes: {}
---
# Fix park-node's Case 2 test in test-park-node.sh (concurrent-write refusal) intermittently tripping graph-commit's assert_clean_outside_ids dirty-tracked-file guard in CI, unrelated to the triggering PR's own changes

Note: this likely duplicates `tactic-flake-park-node-concurrent-write-refusal`
(same test, same `assert_clean_outside_ids` trip, same failure signature,
recurred on PR #2927 / #2917 / #2896). This session's own fingerprint
(`packages/intentionsutil/scripts/test-park-node.sh:307`) did not literal-match
that node's recorded fingerprint (`test-park-node.sh:259`) — the line number
has drifted from unrelated edits to the file between recurrences, so
`dispatch-flake-dedup-node`'s exact-string grep returned `NONE`. Separately,
that node was found parked (`office_hours` set, `since: 2026-07-22`) with an
unrelated concurrent-write divergence at the time of this filing — mid a
different writer's in-flight recovery — so this session did not touch it
(mailbox discipline: a third session encountering a live park should wait, not
attempt its own merge). A human or a later align-tactics pass should merge
these two tracking nodes once that park clears.

Fingerprint: hook-tests — packages/intentionsutil/scripts/test-park-node.sh:307

Reproduce command: `bash packages/intentionsutil/scripts/test-park-node.sh`

Failure excerpt (CI, PR #2936, run 29957200076, job 89049142828):
```
PASS: stale far-ahead park: landed body edit survives, office_hours set, HEAD restored
FAIL: concurrent-write refusal (rc=1 before_sha=c5d364d22300f8c40d756add9708d8964f9e20aa)
From /tmp/tmp.hSZyEpZla1/origin
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

Diagnosis: not caused by this PR's own change. This PR
(tactic-graph-commit-delete-vs-edit-park-hardening) only touches
`graph-commit`'s `park_write()` embedded delete/modify re-materialization path
(the `deletedSet` branch, reached only when a target node file is absent after
`park_and_exit()`'s reset). Case 2 of `test-park-node.sh` exercises a plain
concurrent-edit-conflict (no deletion) and never reaches that code path — the
diff is inert for this test. Locally the full harness passed 15/15 consecutive
runs (5 plain + 10 under `strace -f`, deliberately slowed to probe for a
timing race), never reproducing the CI failure — consistent with the
non-determinism already documented on `tactic-flake-park-node-concurrent-write-refusal`.

recurred on PR #2936 / run https://github.com/natb1/commons.systems/actions/runs/29957200076/job/89049142828
