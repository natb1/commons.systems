---
id: tactic-graph-fastpath-guard-diff-base
kind: tactic
statement: "fix Graph Fast Path guard false-fail: empty origin/main...HEAD diff
  in push context"
owner: ai
status: codified
parent: null
rationale: "Bug retained from the 2026-07-12 red-main episode
  (graph-as-sole-tracker: every defect worth fixing is a tactic). The Graph Fast
  Path workflow's guard job intermittently false-failed a valid intentions/-only
  push with 'No changes relative to origin/main'. Root cause (diagnosed this
  round): the guard's three-dot 'git diff --name-only origin/main...HEAD' diffs
  merge-base(origin/main,HEAD)..HEAD; graph-commit pushes a scratch SHA to
  trigger the workflow and fast-forwards that SAME SHA onto main, so when
  origin/main has advanced to contain HEAD by actions/checkout fetch time the
  merge-base equals HEAD and the diff is empty. The fix anchors the check to the
  pushed-commit SHAs from the push payload (frozen at push time, immune to where
  main's tip later stands) instead of the moving origin/main ref. The legacy
  latch issue that historically carried this fix dies with the issue-flow
  deprecation, so the graph carries it. Off the strategy's signal path (an
  infrastructure defect fix), so no validates edge."
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
  branch: tactic-graph-fastpath-guard-diff-base
  pr: 2898
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# fix Graph Fast Path guard false-fail: empty origin/main...HEAD diff in push context

## Context

The Graph Fast Path workflow (`.github/workflows/graph-fast-path.yml`, triggered
by `push` to `graph/**`) has a `guard` job whose first step, "Verify the push is
intentions/-only", intermittently false-fails a valid intentions/-only push with
`No changes relative to origin/main — nothing to fast-path.` Observed on run
29215397854, commit `52bbff25` (`graph: transition
tactic-multiserve-fingerprint-stamp to review`); a sibling intentions-only push
minutes earlier (run 29215350059, commit `6c6969db`) passed the same guard — so
the failure is race-dependent, not content-dependent.

**Root cause (diagnosed).** The guard runs
`git diff --name-only origin/main...HEAD`. The three-dot form diffs
`merge-base(origin/main, HEAD)..HEAD`. `graph-commit`
(`packages/intentionsutil/scripts/graph-commit`) pushes a scratch SHA to
`graph/<id>-<pid>` to trigger this workflow (`graph-commit:480`), and — after the
required checks stamp green — fast-forwards that **same** SHA onto `main`
(`graph-commit:501`). `actions/checkout` in the guard job uses `fetch-depth: 0`,
so it re-fetches `origin/main` at job-start time. When `origin/main` has advanced
to **contain** HEAD by that fetch (the same session's own land racing a lingering
or re-fired guard run, or a concurrent sibling landing an equal/ancestor SHA),
`merge-base(origin/main, HEAD) == HEAD`, the diff is empty, and the guard hits its
`exit 1` branch. The guard's own local mirror of this diff spec lives at
`graph-commit:316` (`ensure_intentions_only_base`), but that call compares against
a freshly-fetched base with the local pre-commit HEAD and is not affected — the
bug is specific to the workflow guard's post-push checkout.

**Fix.** Anchor the check to the **pushed-commit SHAs from the push payload**
(`github.event.commits.*.id`) rather than the moving `origin/main` ref. The
payload's commit list is frozen at push time — each SHA was still a fresh child of
`main`, not yet reachable from it — so it is immune to where `main`'s tip later
stands at checkout. Examine **every** pushed commit (the guard is security-relevant:
the fast path stamps the four required checks green without real CI, so a
multi-commit push must not slip a non-intentions commit through by only inspecting
HEAD). Every ref-range alternative that re-resolves `main` at checkout time
(`origin/main...HEAD`, `rev-list HEAD --not origin/main`, `before..after` with a
payload `before`) collapses to empty under the same "main contains HEAD" condition;
`github.event.before` is additionally the zero-SHA on the common new-scratch-branch
push. The frozen payload commit list is the only ref-independent base.

This tactic is **off** `strategy-graph-native-dispatch`'s signal path — it is an
infrastructure defect fix, not a producer of the strategy's signal reading — so it
carries no `validates` edge and no special marker; calculated attention demotes it
by derivation.

## Units of work

### Unit 1 — Extract the guard check into a tested script

**Recommended model:** opus

Judgment-heavy: git plumbing semantics, a security-relevant guard, and a subtle
race whose regression test must be constructed deliberately.

**Scope.**

- Add `.github/scripts/check-graph-fast-path.sh` (mode `+x`) implementing the
  intentions/-only guard, ref-independent:
  - Read pushed commit SHAs from env `PUSHED_COMMITS` (a JSON array of SHA
    strings). Require `jq` (`command -v jq` → clear error if absent, matching the
    clear-error-over-fallback convention at `graph-commit:393-396`); parse with
    `jq -r '.[]'`.
  - **Empty list → error and exit 1** (fail-closed). Do **not** fall back to
    `head_commit.id` or to an `origin/main` range — a fail-open path would defeat
    the guard. Document in a comment that an empty `commits` array occurs only in
    the degenerate "scratch SHA already reachable from another ref at push time"
    case (a re-push of an already-landed SHA), that today's three-dot guard
    *also* false-fails there so this is not a regression, and that erroring is the
    intended fail-closed behavior.
  - For each SHA, collect changed entries with
    `git diff-tree --no-commit-id --raw -r --root "$sha"` — `--root` makes a
    parentless commit show all-adds; `-r` recurses to real paths;
    `--no-commit-id` drops the SHA header line. Output lines are
    `:<srcmode> <dstmode> <srcsha> <dstsha> <status>\t<path>`.
  - **Reject any pushed commit with more than one parent** (a merge commit):
    `diff-tree` prints nothing for a merge without `-m`/`-c`, so its changes would
    go unexamined. graph never merges, but the guard is over
    attacker-influenceable commits — reject `>1` parent explicitly
    (`git rev-list --no-walk --count --parents "$sha"` or
    `git cat-file -p "$sha" | grep -c '^parent '`) with a clear `::error::`.
  - Parse each entry: **destination mode = whitespace field 2** (the colon rides
    on field 1, `:100644`), consistent with the existing check at
    `graph-fast-path.yml:39`; **path = everything after the first TAB** (not a
    whitespace split — a path could contain a space).
  - Reject any path not matching `^intentions/` (emit the offending paths under an
    `::error::`, exit 1). Reject any entry whose dst mode is `120000` (symlink) or
    `160000` (gitlink) — this also catches a typechange (`T`) of a regular file
    into a symlink — exit 1.
  - Exit 0 only when the union of all pushed commits' changes is non-empty,
    entirely under `intentions/`, and all regular blobs.
- Rewrite the "Verify the push is intentions/-only" step in
  `.github/workflows/graph-fast-path.yml:20-44` to:
  ```yaml
      - name: Verify the push is intentions/-only
        env:
          PUSHED_COMMITS: ${{ toJSON(github.event.commits.*.id) }}
        run: .github/scripts/check-graph-fast-path.sh
  ```
  Leave the surrounding steps unchanged: `actions/checkout` (keep
  `fetch-depth: 0` — the per-commit diff-tree still needs the objects),
  `setup-node`, `npm ci`, and the separate `Validate intention graph`
  (`validate-graph.ts`) step (`graph-fast-path.yml:45-52`).

**Out of scope.** The `acceptance`/`preview-and-smoke`/`lint`/`unit-tests` stub
jobs (`graph-fast-path.yml:54-80`); `graph-commit`'s local
`ensure_intentions_only_base` three-dot diff (`graph-commit:316`) — correct in its
local context, not the workflow guard.

**Dependencies.** None.

### Unit 2 — Hermetic test suite + CI wiring

**Recommended model:** opus

Test writing, but the pivotal case (simulate the race so the guard still PASSES)
requires deliberately manipulating refs and reasoning about the payload-vs-ref
distinction — not rote.

**Scope.**

- Add `.github/scripts/test-check-graph-fast-path.sh` following the hermetic
  temp-git-repo pattern of `.github/scripts/test-check-test-integrity.sh:38-114`
  (temp repos, `assert_exit`-style helpers, `trap cleanup EXIT`). Unlike that
  template, the harness invokes the script by setting `PUSHED_COMMITS` to a JSON
  array of the temp repo's commit SHAs (not by a CWD + git range), so do **not**
  copy its `run_check` verbatim. Cover at least:
  1. **Race regression (the core case):** commit an intentions/-only change; then
     advance a local `main`/`origin/main` ref to **contain** that commit (so a
     three-dot `origin/main...HEAD` would be empty); invoke with
     `PUSHED_COMMITS` = that commit's SHA → assert **exit 0** (passes, because the
     script reads the payload, not a ref range).
  2. Multi-commit push, all intentions/-only → exit 0 (asserts every commit is
     examined).
  3. A pushed commit touching a non-`intentions/` path → exit 1, stderr names the
     path.
  4. A symlink (mode 120000) or gitlink at `intentions/x.md` → exit 1.
  5. Empty `PUSHED_COMMITS` (`[]`) → exit 1 (fail-closed).
  6. A merge commit among the pushed SHAs → exit 1.
  7. Missing `jq` is not practical to test hermetically; a path with a space under
     `intentions/` → exit 0 (asserts TAB-based path parsing).
- Wire the suite into `.github/workflows/unit-tests.yml` in the `hook-tests` job
  alongside the existing `test-check-*.sh` invocations
  (`unit-tests.yml:211-215`), e.g.:
  ```yaml
      - name: Run graph fast-path guard script tests
        run: .github/scripts/test-check-graph-fast-path.sh
  ```
  That job has no `if:`/`paths:` gate, so the test runs on every push (confirmed
  against the gated `nix`/`rules`/`ds` steps elsewhere in the file).

**Out of scope.** No change to how the fast-path workflow itself is triggered;
`unit-tests.yml` ignores `graph/**` (`unit-tests.yml:3-7`) by design — this is a
hermetic self-test of the script, run on ordinary pushes.

**Dependencies.** Unit 1 (the script under test must exist).

## Reuse

- Hermetic-git-repo test harness pattern (temp repos, exit-code asserts,
  `trap cleanup EXIT`): `.github/scripts/test-check-test-integrity.sh:38-114`.
- Destination-mode field-2 symlink/gitlink check idiom: existing guard at
  `.github/workflows/graph-fast-path.yml:39`
  (`awk '$2 == "120000" || $2 == "160000"'`).
- Clear-error-over-fallback convention for a missing tool: `graph-commit:393-396`.
- CI wiring slot for `.github/scripts/test-check-*.sh`: the `hook-tests` job at
  `.github/workflows/unit-tests.yml:211-215`.

## Verification

The change is a CI workflow guard plus its extracted script; the script is
verified hermetically and the workflow behavior is observed on the next graph
push.

```verify
.github/scripts/test-check-graph-fast-path.sh
```

Additionally (manual / observe-in-production):

- After merge, the first intentions/-only `graph/**` push must pass the `guard`
  job. Because the fix removes the race, the specific false-fail
  (`No changes relative to origin/main`) should not recur; no re-run of the
  historical failed SHA is needed — the CI latch clears on the next green
  `main` HEAD.
- Sanity-check that a push touching a non-`intentions/` path (should one ever
  reach `graph/**`) still fails the guard — covered by the hermetic suite; no
  live negative test is warranted since `graph-commit` never produces such a push.
- Confirm `npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions`
  still runs as a distinct guard-job step (unchanged by this fix).
