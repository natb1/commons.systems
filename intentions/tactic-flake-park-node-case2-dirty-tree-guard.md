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
  reason: "/implement: candidate fix (git update-index --assume-unchanged on the
    wrapper path in test-park-node.sh Case 2's disposable clone) was implemented
    and passed 5/5 local runs, but a subagent security-review flagged it as
    potentially defeating graph-commit's assert_clean_outside_ids guard rather
    than root-causing the still-unreproduced CI-only race; reverted rather than
    landing on uncertain judgment. Needs a human call on whether the
    harness-only suppression is safe or whether the intermittent guard trip
    signals a real race in graph-commit's own commit/status-check sequencing."
  since: 2026-07-22
  recommendation: >-
    # Recommendation: tactic-flake-park-node-case2-dirty-tree-guard


    ## Decision needed

    One judgment call: is `git update-index --assume-unchanged
    packages/intentionsutil/scripts/graph-commit` in Case 2's disposable test
    clone legitimate harness hardening, or a mask over a real race in
    graph-commit?


    The case for landing: the flag is scoped only to the throwaway clone
    (deleted post-test), touches no production code, and weakens none of Case
    2's PASS/FAIL assertions (the 'concurrent-edit conflict' /
    'mechanical-unresolved' greps are untouched). It only stops git from
    tracking dirtiness on the wrapper path the test itself installs.


    The case against: the guard trips despite the add+commit that should make
    the tracked path clean. If assert_clean_outside_ids (graph-commit:~975, git
    status --porcelain) intermittently sees the path dirty after a local commit,
    that same status-vs-commit ordering could misfire in real park_and_exit()
    runs (graph-commit:~920-957, git fetch + git reset --hard FETCH_HEAD).
    assume-unchanged would hide that signal, not fix it. That is why it wasn't
    landed autonomously.


    ## To pin the root cause first (recommended before landing)

    Don't blanket-suppress. In test-park-node.sh Case 2 (~252-292), add
    temporary diagnostics: dump git status --porcelain plus date +%s.%N
    immediately before and after each of mv, wrapper-write, git add, git commit.
    Then either loop the test under CI-like parallel load, or add a
    retry-with-diagnostics wrapper (retry the guard check, logging porcelain
    output on each miss) instead of assume-unchanged. If the porcelain snapshot
    shows the path dirty after the commit returns, the race is in graph-commit's
    status timing and deserves a real fix. If it's always clean locally and only
    CI trips, the harness fix is defensible.


    ## If you accept the harness fix

    The patch is known: add `git update-index --assume-unchanged
    packages/intentionsutil/scripts/graph-commit` in the clone after the
    existing add+commit. Reapply directly.


    ## Cleanup

    Once resolved, merge the two duplicate nodes —
    tactic-flake-park-node-case2-dirty-tree-guard and
    tactic-flake-park-node-concurrent-write-refusal (same fingerprint family,
    same signature) — into one.
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
