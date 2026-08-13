---
id: tactic-orphaned-check-run-pins-pending-ci-guard
kind: tactic
statement: Classify a check run whose parent check suite has already concluded
  as stale rather than pending, so an orphaned job cannot pin a node in
  pending-ci-guard or stall graph-commit's landing gate forever
owner: ai
status: raw
parent: null
rationale: "Found by the 2026-08-11 rsi iteration while driving
  tactic-pause-disables-merge-lane through its fix interrupt. GitHub left one
  check run — CodeQL's 'Analyze (go)' — permanently in status queued on PR
  #3068's head 74548a2b, while that row's parent check suite had already
  concluded (status completed, conclusion failure). dispatch_ci_verdict_rest
  (.claude/skills/dispatch-propagate/scripts/lib.sh:810-813) adapts every
  check-runs row to {status, conclusion} and dispatch_classify_rollup (:692)
  reads a never-completed row as pending, so the fix lane's pending-CI guard
  (graph-select-target:824-826) held the node with 22 of 23 checks green. The
  guard has no staleness bound and the run is not retriable — `gh run rerun
  --failed` answers 'This workflow run cannot be retried' — so the node cannot
  leave the guard by any automated path. Every subsequent rsi-advance returns
  exit 10 not-selectable, which /rsi's own step 4b.1 correctly reads as
  stop-the-loop. The orphan is exactly detectable rather than merely suspected,
  so this wants a precise classification rule, not a timeout heuristic. A second
  instance appeared 20 minutes later with the same signature and worse blast
  radius: the 'Graph Fast Path' run on graph-commit's own scratch branch
  concluded (suite 85480333626 completed/success) while its preview-and-smoke
  row stayed in_progress, so graph-commit burned all five of its 180s green-wait
  attempts, exited context=busy-exhausted, and left an orphan local commit.
  While that holds, no graph write can land at all — so this defect gates the
  graph store's only sanctioned write path, not just one node's fix lane."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: dispatch-ladder-e2e-unblock
  pr: 3073
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-13T00:21:45Z
    mergeCommitSha: 3fea9f35f7aeaf5ae48623c87cbf0724c9f5f819
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Classify a check run whose parent check suite has already concluded as stale rather than pending, so an orphaned job cannot pin a node in pending-ci-guard or stall graph-commit's landing gate forever

## Context

Observed live on 2026-08-11, PR #3068, head
`74548a2b793abec41ac2d6f044de22c99040f8ff`. The REST check-runs payload for that
sha carried 22 rows in `completed` and exactly one in `queued`:

```
$ gh api repos/{owner}/{repo}/commits/74548a2b.../check-runs
completed (22): CodeQL, acceptance, lint, unit-tests, hook-tests, preview-and-smoke, ...
queued     (1): Analyze (go)
```

That row's own parent had already finished:

```
$ gh api repos/{owner}/{repo}/check-suites/85475141868
{ "status": "completed", "conclusion": "failure",
  "created_at": "2026-08-11T16:11:30Z", "updated_at": "2026-08-11T16:12:43Z" }
```

A suite cannot conclude and still be running one of its own jobs. The row is
orphaned: GitHub will never move it, and it is not recoverable by re-running —

```
$ gh run rerun 31511084097 --failed
run 31511084097 cannot be rerun; This workflow run cannot be retried
```

(CodeQL here is GitHub's managed `code-scanning/default-setup`; the repo carries
no `.github/workflows/codeql*.yml`, so there is no workflow file to re-dispatch.
The same external flake is already recorded, in its earlier
setup-failure form, as tactic-flake-analyze-go.)

### Why that pins the node

`dispatch_ci_verdict_rest`
(`.claude/skills/dispatch-propagate/scripts/lib.sh:810-813`) adapts every row to
`{status, conclusion}` and drops everything else, including the parent suite.
`dispatch_classify_rollup` (`:692`) then sees a row that is neither completed nor
carrying a failing conclusion and returns `pending`. In the fix lane,
`_gate_fix_active`'s pending arm
(`.claude/skills/dispatch-propagate/scripts/graph-select-target:824-826`) holds:

```bash
if [[ -n "$pushed_sha" && "$pushed_sha" != "null" && "$pushed_sha" == "$_CI_HEAD" ]]; then
  echo "pending-ci-guard"; return 1
fi
```

The guard's intent is sound and must be preserved — never misread a pending
pushed-sha as green. The defect is that it has no way to distinguish *work still
in progress* from *a verdict that will never arrive*. With `execution.fix.pushed_sha`
equal to the head sha, the node is held on every tick, forever, with 22 of 23
checks green. There is no automated exit: the fix lane cannot re-push because it
is never launched, and the run cannot be retried.

### Blast radius beyond the fix lane

`dispatch_classify_rollup` is the shared CI verdict for the whole router — its
callers include `dispatch-ci-ready`, `dispatch-reconcile-ready`,
`graph-auto-merge`, `dispatch-context-pack`, and
`reconcile-graph-review-stall`. An orphaned row therefore also reads as
"still running" to the auto-merge lane, so this is not a fix-lane-only stall.

### Second instance, 20 minutes later — graph-commit's landing gate

The same signature recurred on `graph-commit`'s own throwaway scratch branch
`graph/tactic-flake-hook-tests-graph-commit-fixture-clone-1638377`, scratch sha
`81ae26fd`. The "Graph Fast Path" workflow run 31512893357 reported
`status: completed`, four of its five jobs concluded normally, and
`preview-and-smoke` was pinned at `in_progress` with
`completedAt: 0001-01-01T00:00:00Z`. Its parent suite had concluded too:

```
$ gh api repos/{owner}/{repo}/check-suites/85480333626
{ "status": "completed", "conclusion": "success", "updated_at": "2026-08-11T16:33:10Z" }
```

`graph-commit` polls its four required names directly (`graph-commit:1383-1393`)
rather than through `dispatch_classify_rollup`, so it saw
`preview-and-smoke=pending` on every poll, burned all five 180s green-wait
attempts, exited `context=busy-exhausted`, and left an orphan local commit for
manual recovery.

That is the more serious blast radius. `graph-commit` is the only sanctioned
write path into the graph store, so while an orphaned row sits on a scratch
branch, **no graph write can land at all** — and each retry cuts a new scratch
branch that can be orphaned again.

Note what `graph-commit` already gets right and why it is not enough. The
comment at `:1376-1382` records a *related* GitHub desync (#2457 — status stuck
at `in_progress` after `conclusion` is populated) and defends against it by
keying off `.conclusion` alone. This defect is the complement: `conclusion` is
`null` **and** the row never moves. Keying off `.conclusion` cannot see it, so
the existing guard passes it straight through as pending.

Two orphaned jobs inside 20 minutes, in unrelated workflows, indicates this
arrives in bursts rather than as a rare one-off — which is the argument for
handling it in code rather than by operator recovery each time.

## Greenfield design

Classify orphaned rows exactly, at the point where the rollup is built. A check
run whose parent check suite has `status: completed` while the run itself has
not completed is, by definition, never going to report. GitHub already has a
conclusion for that notion — `STALE` — and `dispatch_classify_rollup:712-713`
already counts `STALE` in its failing set. So the correct verdict falls out with
no change to the classifier's own logic: adapt such a row as
`{status: "COMPLETED", conclusion: "STALE"}` and the existing mixed-rollup rule
("a concluded failure is actionable even while other checks are still running",
`:703-705`) resolves the whole rollup to `failing`.

`failing` is the honest verdict, not a workaround: the parent suite concluded
`failure`. It routes the node into `_gate_fix_active`'s `*)` arm, where the fix
lane re-pushes under the normal `FIX_ATTEMPT_CAP` budget — a new head sha, fresh
checks, and the orphan is gone. That is the same recovery an operator would
perform by hand, reached automatically and with the retry budget still enforced.

Prefer this to a timeout heuristic. A staleness timer would need a threshold
tuned against the slowest legitimate check, would fire wrongly on a genuinely
slow queue, and would still be guessing. The suite-concluded signal is exact.

## Unit 1 — Adapt orphaned rows as STALE in the REST verdict path

**Recommended model: opus.** The change itself is small, but it sits on the
single shared CI verdict every dispatch lane reads, and mis-scoping it would
make the router treat live checks as failures — the strictly worse failure
direction.

### Scope

File: `.claude/skills/dispatch-propagate/scripts/lib.sh`, `dispatch_ci_verdict_rest`
at `:792-827`.

Today the adaptation at `:810-813` is a single paginated call. Change it to:

1. Keep the existing single call and the existing adaptation as the fast path.
   If every row has `status == "completed"`, nothing else runs — the common case
   costs exactly what it costs today, with no extra API call.
2. Only when at least one row is not `completed`, collect the distinct
   `.check_suite.id` values of those rows and fetch each once via
   `repos/{owner}/{repo}/check-suites/<id>`. In practice this is one or two
   extra calls, and only on a sha that is genuinely mid-flight.
3. For each non-completed row whose suite reports `status == "completed"`, emit
   `{status: "COMPLETED", conclusion: "STALE"}` instead of its raw pending
   shape. Leave every other row untouched.

Preserve the existing memoisation at `:797-803` and `:821-824` — but note the
correctness constraint below.

**Out of scope:** `dispatch_classify_rollup` itself (`:692`) — it already
handles `STALE`, and changing its logic would alter every caller's semantics.
The GraphQL/`statusCheckRollup` path is also out of scope for this unit; see
Unit 2. The `pending-ci-guard` block in `graph-select-target:824-826` does not
change — the guard is correct and keeps its meaning; it simply stops being fed a
false `pending`.

### Reuse

- `gh_retry` (`lib.sh`, used at `:810`) for the added suite fetches — do not
  call `gh api` bare.
- The `jq -s 'map(.check_runs) | add // []'` pagination idiom already at
  `:811` for slurping paginated output.
- `.claude/rules/shell-json.md`: never `echo` captured JSON into `jq`. Use a
  direct pipe or a here-string. This function handles PR-adjacent payloads,
  exactly the case that rule exists for.

### Correctness constraint — the verdict cache

`DISPATCH_CI_VERDICT_CACHE` memoises per sha. A sha whose verdict was computed
as `pending` **before** the suite concluded would keep returning `pending` from
cache even after the orphan becomes detectable. Do not cache a `pending`
verdict that was computed while any row was non-completed with a still-running
suite; cache only terminal verdicts (`passing`, `failing`), or key the cache
entry so a later call recomputes. Landing the classification without this is the
obvious way for the fix to appear to work and then not work in the fleet.

## Unit 2 — Cover the GraphQL rollup path or record that it is unreachable

**Recommended model: sonnet.** Mechanical once Unit 1 fixes the shape.

**Dependencies:** Unit 1.

### Scope

`dispatch_classify_rollup` is also fed from GitHub's GraphQL
`statusCheckRollup` shape, whose `CheckRun` nodes expose `checkSuite`
directly, so no extra call is needed there. Determine whether any live caller
still feeds that shape. If one does, apply the same orphan rule at that
adaptation point. If none does — the REST-default migration recorded in
`.claude/rules/sandbox.md` and the GraphQL/REST rate-limit split may have
already retired it — record that finding in this node's clarifications and
close the unit without a code change rather than adding speculative handling.

**Out of scope:** migrating any remaining GraphQL caller to REST. That is a
separate concern with its own rate-limit reasoning.

## Unit 3 — Apply the same rule to graph-commit's required-check poll

**Recommended model: opus.** This gate is fail-closed by design and guards the
only write path into the graph store; a wrong relaxation here lets an unverified
graph write land.

**Dependencies:** none on Units 1–2 — `graph-commit` polls independently and can
be fixed in parallel — but land it with the same semantics so the two paths do
not disagree about what "pending" means.

### Scope

File: `packages/intentionsutil/scripts/graph-commit`, the `--jq` required-check
filter at `:1383-1393` and the counting loop that follows.

For each selected row with a `null` conclusion, resolve its `.check_suite.id`
and, when that suite reports `status: completed`, treat the row as a **hard
refusal** rather than as pending — the same treatment any non-success selected
row already gets (`:1372-1374`), returning 2 with no retry. Do not treat it as
success and do not treat it as retryable: a verdict that will never arrive is
not evidence a check passed, and retrying only cuts another scratch branch.

The failure message must name the cause specifically — the required check name,
its suite id, and that the suite concluded while the row did not — so the
operator immediately knows this is a GitHub orphan and not a real red check. The
existing `LAST_CHECK_DETAIL` string (`:1462`) is where that belongs.

Keep the `.conclusion`-keyed handling of the #2457 desync exactly as it is
(`:1376-1382`). That is a different condition and the two must coexist: #2457 is
a populated conclusion behind a stale status, this is no conclusion at all.

**Out of scope:** the retry-count and 180s window constants. Widening them is a
separate judgment (see the note below) and does not fix this — an orphaned row
never resolves no matter how long the wait.

### Reuse

`gh_retry` and the existing `errfile`/`gh_fails` error plumbing in the same
polling block.

### Do not widen the green-wait budget — the budget was never the problem

While the incident was in progress it looked as though `preview-and-smoke` was
simply slow: the row sat unresolved for 14+ minutes against a per-attempt window
of 180s and a five-attempt ceiling (~15 minutes total), which reads like a check
that a graph write can only just outlast.

That reading was wrong, and the immediately following `graph-commit` invocation
disproved it. On the next scratch branch
(`...-1660135`) every required check, `preview-and-smoke` included, concluded
green well inside the first attempt's window, and the write landed as
`2f9fdb94`. The 14 minutes were not a slow check; they were **this defect** —
the orphaned row never moving.

So the retry budget is adequate and must not be touched under this tactic.
Raising those constants would be the natural wrong fix: it costs every future
graph write more wall-clock, and it still never lands, because an orphaned row
does not resolve at any timeout. The mistaken reading is recorded here because
it is the reading an implementer is most likely to arrive at from the logs
alone.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts
```

That loop globs `test-*.sh` in the dispatch scripts directory
(`run-unit-tests.sh:197`), so it runs both suites that matter here:
`test-lib-gh-rest.sh` (covers `dispatch_ci_verdict_rest`) and
`test-graph-select-target.sh` (covers the gate). Add cases to
`test-lib-gh-rest.sh`, whose existing `gh` PATH-shim fixtures are the model:

1. **The orphan case.** A check-runs fixture with one `queued` row plus a
   check-suites fixture reporting `status: completed` for that row's suite must
   classify as `failing`. Assert the verdict directly — a test that only asserts
   "not pending" would pass on a wrong answer.
2. **The live case (the important negative).** The same `queued` row with its
   suite reporting `status: in_progress` must still classify as `pending`. This
   is the regression that would break every genuinely-running check in the
   fleet, so it must be pinned explicitly.
3. **The fast path.** An all-`completed` fixture must make **zero** extra
   check-suites calls. Assert against the shim's call log, the way
   `test-graph-commit.sh`'s `gh-calls` log is asserted — a count, not a
   grep-for-absence.
4. **The cache case.** A sha classified `pending` while its suite was still
   running must not return a stale `pending` from `DISPATCH_CI_VERDICT_CACHE`
   once the suite concludes.

**Unit 3** is covered by its own suite, which the `hook-tests` CI job runs
directly:

```verify
packages/intentionsutil/scripts/test-graph-commit.sh
```

Add a case to it using the existing `gh` PATH-shim fixture mechanism: a required
check row with `conclusion: null` whose suite fixture reports
`status: completed` must make `graph-commit` refuse immediately — exit 2, zero
retries, nothing landed on the scratch origin — with the diagnostic naming the
check and its suite. Pair it with the negative: the same null-conclusion row
whose suite is still `in_progress` must keep the existing wait-and-retry
behavior. Assert the poll count, not just the exit code, so a refusal that
happens only after five retries cannot pass as a refusal that happens at once.

Manual (judgment, not auto-runnable): this defect's live instance is PR #3068
head `74548a2b`, which still carries the orphaned row. Run
`dispatch_ci_verdict_rest 74548a2b793abec41ac2d6f044de22c99040f8ff` against the
real API with the fix in place and confirm it returns `failing` rather than
`pending`. If GitHub has since garbage-collected the row, say so rather than
reporting a pass — the fixture cases above are the durable check, and a
disappeared row verifies nothing.

## What this does not fix

GitHub orphaning a job in the first place is external and not addressable here.
This node's claim is narrower: when it happens, the router reaches an accurate
verdict and recovers through the fix lane's existing budgeted retry, instead of
holding the node forever with no automated exit.

## Shipped 2026-08-13 — PR #3073, merge `3fea9f35`

Landed as Unit 4 (branch commit `b0657c98`), plus Unit 8 from the PR's
`/code-review high` round.

The orphan rule now lives in exactly one place: `dispatch_ci_verdict_rest`
(`.claude/skills/dispatch-propagate/scripts/lib.sh:803-894`), applied once at
adaptation time so every downstream classifier inherits it rather than each
re-deriving it. A check run that is not `completed` **and carries no
conclusion** is looked up against its parent `check_suite`; if that suite
reports `status: completed`, the row is adapted as stale rather than pending —
a suite cannot conclude and still be running one of its own jobs.

Cost discipline as designed: the suite lookups are lazy. When every row is
`completed`, or no pending row carries a `check_suite.id`, zero extra REST
calls are made; otherwise one call per **distinct** parent suite
(`lib.sh:820-821`, `:863-891`).

**The narrowing is deliberate and worth a reader's attention.** The rule fires
only on NULL-conclusion rows, not on every non-`completed` row whose suite has
finished. That is narrower than the node body above argues for, and it is the
conservative reading: a row that carries a conclusion has reported a real
result, whatever its status field says.

**Cache shadowing closed too** (`lib.sh:829-831`): a sha classified pending
while its suite was still running is recomputed once the suite concludes,
otherwise the orphan rule would be shadowed by the very cache entry the orphan
produced for as long as the cache directory lived.

**Unit 8** hardened the consumer side — `run-pr-checks-wait.sh` now delegates
its verdict to the same classifier rather than carrying a second copy of the
rule, and its watch is bounded (`edd11a54` put that bound under the 600s
ceiling that motivates it).

**Confirmed against the live incident.** Re-run against sha `74548a2b`
(PR #3068): 21 `success` + 1 `neutral` + 1 null-conclusion row now returns
`failing` where it previously returned `pending` — the classification that
would have released the node from `pending-ci-guard`.

**Why this one blocked the e2e run.** A node pinned this way keeps the
reconcile pass quiet, so the ladder driver burns its entire `--ci-wait-s`
budget and halts naming CI — a false halt on a PR that is in fact green, the
worst possible outcome for a first end-to-end run.

Suites green at merge: `test-lib-gh-rest.sh` 334/334,
`test-run-pr-checks-wait.sh` (new, 321 lines), `test-graph-commit.sh` 87.
