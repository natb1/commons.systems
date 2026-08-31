---
id: tactic-review-stall-pr-json-duplicate-fetch
kind: tactic
statement: Eliminate the duplicate gh_pr_view_rest PR-JSON fetch
  reconcile-graph-review-stall makes on every tick for PRs
  reconcile-graph-merged already fetched moments earlier, by giving
  gh_pr_view_rest an opt-in file-backed memo (DISPATCH_PR_JSON_CACHE) that
  dispatch-select-tick arms narrowly across only its two back-to-back reconciler
  invocations — never exported tick-wide, so graph-auto-merge and
  graph-select-target's load-bearing mergedAt freshness reads stay live
owner: ai
status: codified
parent: null
rationale: null
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
  branch: agent-ab40834f327b7f8e3
  pr: 3163
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-31T04:55:15Z
    mergeCommitSha: a2caf0abbc6953948044818c92121751233d1504
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Eliminate the duplicate gh_pr_view_rest PR-JSON fetch reconcile-graph-review-stall makes on every tick for PRs reconcile-graph-merged already fetched moments earlier, by giving gh_pr_view_rest an opt-in file-backed memo (DISPATCH_PR_JSON_CACHE) that dispatch-select-tick arms narrowly across only its two back-to-back reconciler invocations — never exported tick-wide, so graph-auto-merge and graph-select-target's load-bearing mergedAt freshness reads stay live

## Completion record — shipped 2026-08-31

All three units landed as PR #3163, merge `a2caf0ab`, an ancestor of
`origin/main`.

- **Unit 1** — `gh_pr_view_rest` in `lib.sh` gained an opt-in file-backed memo
  behind `DISPATCH_PR_JSON_CACHE`: when the variable names a non-empty
  directory, a hit `cat`s the stored body from a sanitised-path key.
- **Unit 2** — `dispatch-select-tick` arms the memo across the reconciler pair
  only, as a per-invocation environment prefix on `reconcile-graph-merged` and
  `reconcile-graph-review-stall`.
- **Unit 3** — `dispatch-ladder-run` carries the containment backstop,
  `unset`ting the variable beside `DISPATCH_CI_VERDICT_CACHE` at each
  reconciler call.

**The arming scope is the whole safety argument, and it shipped as the node
required.** The memo carries no state filter and no TTL, so a tick-wide
`export` would have served a cached pre-merge body to `graph-select-target`'s
`mergedAt` freshness read — reintroducing the stale-review-target bug that read
exists to prevent — and to `graph-auto-merge`, which mutates PR state and runs
before both reconcilers. Re-measured at close: `origin/main` carries **no**
`export DISPATCH_PR_JSON_CACHE` anywhere. The variable reaches only the two
processes named above, which is the posture the node's own statement demanded
and the one the original "Recommended fix" got wrong.

The budget this protects is the fleet's shared GitHub REST quota, not model
tokens.


## Context

Deferred cost finding from the `/review-fix` pass on PR #2920
(`tactic-graph-review-exclusion-stall-recovery`).

**The duplication.** `reconcile-graph-review-stall` re-fetches, per candidate
per tick, PR JSON that `reconcile-graph-merged` already fetched moments earlier
in the same tick, in the same process, under the same lock hold. The two
reconcilers are invoked back-to-back and unconditionally by
`dispatch-select-tick`, and the second sweep's candidate set is a strict subset
of the first's. Unlike `dispatch_ci_verdict_rest`, `gh_pr_view_rest` has no
memoisation, so every one of these reads is duplicated. The waste is
N+1-shaped, grows linearly with the number of `review`+`reviewed` tactics, and
repeats on every tick.

**Adversarial verdict:** not adversarially verified — a cost/scaling advisory
finding, not a `Required` security finding, so the adversarial-verify step was
skipped (cost findings are always `Deferred`, never `Required`).

**Source PR:** #2920.

### Verified facts (re-measured against origin/main at `f1b76fc9`, 2026-08-19)

The line numbers below are current as of that commit. They drift — **locate by
symbol (grep for `gh_pr_view_rest`), never by trusting a line number in this
body.** An earlier revision of this node cited
`reconcile-graph-review-stall:186`, which was already wrong.

1. **Duplicate call sites.**
   - `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged:161` —
     `PR_JSON=$(gh_pr_view_rest "$pr" 2>/dev/null) || rc=$?`, inside the
     `while IFS=$'\t' read -r id pr` loop opened at `:157`.
     `gh_pr_view_rest` is this script's **only** gh call — it never mutates PR
     state (verified: no `gh pr merge` / `gh pr ready` / `gh api -X` anywhere in
     the file).
   - `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:224`
     — `PR_JSON=$(gh_pr_view_rest "$pr" 2>/dev/null) || { … }`, inside the
     per-candidate loop opened at `:216`. This is the redundant read.

2. **The strict-superset claim holds.** `reconcile-graph-merged:134-151`
   enumerates tactics with `phase ∈ {implement,fix,qa,review,main-qa}` and
   non-null `execution.pr`. `reconcile-graph-review-stall:188-207` enumerates a
   strict subset: `phase === "review"` AND `office_hours == null` AND
   `execution.markers` includes `REVIEWED_MARKER` AND `execution.fix == null`
   AND `blockersComplete(n, byId)` AND non-null `execution.pr`. Every
   review-stall candidate is therefore also a merged-sweep candidate whose PR
   JSON was already fetched this tick. Review-stall then `continue`s on
   `STATE != OPEN` (`:234-236`, comment: *"merged/closed — reconcile-graph-merged's
   job"*), i.e. it only ever acts on PRs the merged sweep just classified `OPEN`
   and skipped.

3. **Tick ordering** (`.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`,
   all in one process, one lock hold):
   `graph-auto-merge` at `:518` → `dispatch-reconcile-merged` at `:530` →
   `reconcile-graph-merged` at `:547` → `reconcile-graph-review-stall` at `:563`
   → later, in Step 3, `graph-select-target` at `:1115` (`--node`) / `:1121`
   (`--top`).

4. **The original "Recommended fix" was UNSAFE as written — this is the single
   most important thing to get right.** It proposed a tick-scoped PR-JSON memo
   "keyed on PR number, owned and torn down by `dispatch-select-tick`" — i.e.
   `export`ed for the whole tick, the way `DISPATCH_CI_VERDICT_CACHE` is
   (created at `dispatch-select-tick:294-300`, EXIT-trap teardown at `:304`).
   That posture would break at least three live freshness-dependent reads:
   - `graph-select-target:1133` re-reads
     `gh_pr_view_rest "$pr" | jq -r '.mergedAt // empty'` with an explicit
     in-code rationale: *"a merge that lands between the tick's
     reconcile-graph-merged sweep and this selection within the same tick must
     NOT be re-selected as a stale review target"*. Serving that read a cached
     pre-merge body reintroduces exactly the bug the check exists to prevent.
   - `graph-select-target:1150` (the `main-qa` arm) gates on the same `mergedAt`
     freshness and returns `pr-not-merged` when it is absent.
   - `graph-auto-merge:334` fetches PR JSON and then **mutates** PR state — it
     squash-merges, and calls `gh pr ready` (`:506`). It runs **before** both
     reconcilers, so anything it populated would be stale for every later reader
     in the same tick.

   **Conclusion: the memo must be narrowly armed** — live only across the
   reconciler pair (`:547` and `:563`), invisible to `graph-auto-merge` and
   `graph-select-target` — never exported tick-wide.

   The state-filter trick that makes the CI-verdict memo safe does **not**
   transfer. `dispatch_ci_verdict_rest` caches only terminal verdicts
   (`lib.sh:918-921`, `verdict != "pending"`). For PR JSON, the safe-to-cache
   half (merged/closed) is exactly the half review-stall skips, and the half
   review-stall needs (`OPEN`) is exactly the mutable one. **Safety comes from
   arming scope, not from a state filter.**

5. **Cache-key correctness.** `gh_pr_view_rest` (`lib.sh:1195-1244`) accepts an
   optional `--repo owner/repo` flag and builds either `repos/$repo/pulls/$num`
   or `repos/{owner}/{repo}/pulls/$num`. A bare PR-number key collides across
   repos. Key on the **resolved API path**, not on the number.

6. **Ladder-driver precedent and obligation.**
   `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run` `unset`s
   `DISPATCH_CI_VERDICT_CACHE` before **every** reconciler call (`:1128`,
   `:1161`, `:1195`), with the rationale at `:1124-1127` and `:261-268`: the
   memo has no TTL and no invalidation, so an inherited cache dir *"would pin
   this poll loop to the first `pending` it ever read and it would never see CI
   go green."* That driver polls `reconcile-graph-merged --node` /
   `reconcile-graph-review-stall --node` in a loop at different wall-clock
   times. Any new PR-JSON cache variable inherits the identical hazard and must
   get the same treatment there. **In scope for this tactic, not a follow-up.**

7. **Sibling nodes on the same file — do NOT absorb their scope.** All are
   currently draft/raw (`phase: null`, `office_hours: null`), so no live branch
   conflicts, but the boundaries are binding:
   - `tactic-review-stall-listnodes-duplicate-scan` — owns the second full
     `intentions/` scan (the `listNodesStrict` enumeration at `:188-207`). The
     original body's second option ("fold the review-stall check into
     reconcile-graph-merged's per-PR loop … eliminating the second sweep and its
     second full node enumeration") would swallow this sibling whole. **That
     option is rejected here** (see below); do not take it.
   - `tactic-review-stall-ci-verdict-cache-miss` — owns the per-candidate
     `dispatch_ci_verdict_rest` call at `:252`.
   - `tactic-review-stall-predicate-subprocess-spawn` — owns the per-candidate
     `node --import tsx/esm` `reviewStallRoute` eval at `:258-263`.
   - `tactic-reconcile-review-stall-base-pin` — owns the missing `--base`
     compare-and-swap on the batched `graph-commit` at `:321-332`.

   This tactic is **the PR-JSON fetch only**.

8. **Why the "fold into reconcile-graph-merged" option is rejected.** Beyond the
   sibling overlap in §7, it is larger than one PR. The two sweeps have
   different gate sets (§2), different write paths (merged uses a plan/apply
   through `reconcile-graph.ts` with diagnosis-time `--base` blob pins;
   review-stall uses `apply-fix-state --set-fix` with its own rollback arm at
   `:270-292`), different rollback regimes, a per-sweep cap
   (`GRAPH_REVIEW_STALL_CAP`, default 3) and per-candidate `refresh_lock` that
   merged does not have, and separate `--node` entry points that
   `dispatch-ladder-run` calls independently. It would also silently extend
   review-stall's reach to `dispatch-tick:649`, the paused-branch drain, which
   calls `reconcile-graph-merged` alone today. **The memo option is the
   PR-sized one.**

9. **Repo constraints that bite this change specifically.**
   - `lib.sh` must stay sourceable standalone — several CI fixtures copy it
     alone, so a new unguarded `source` line in it turns ~17 fixtures red in CI
     while staying green locally. It currently has exactly one `source`, and it
     is guarded and optional (`lib.sh:3082`). Put any new helper **inside**
     `lib.sh`; add no new `source` line.
   - `.claude/rules/shell-json.md` is mechanically enforced on net-new added
     lines in committed `.sh` files by `lint-prose-rules.sh` (run from
     `run-lint.sh` in CI): never `echo "$JSON_VAR" | jq` — use
     `jq … <<<"$VAR"` or `printf '%s'`. `lib.sh` **is** a `.sh` file and is in
     scope; `reconcile-graph-review-stall` and `reconcile-graph-merged` have no
     extension and are not.
   - None of the shell suites named below are auto-run in CI (verified: no
     references in `.github/` or `run-*.sh`). Extend **existing** suites rather
     than adding a new `test-*.sh`, and run them explicitly via the verification
     fences.

### The design

**Greenfield.** `gh_pr_view_rest` gains an opt-in, caller-armed, file-backed
memo — the same directory-of-files shape as `dispatch_ci_verdict_rest`, keyed on
the resolved API path, gated on a new env var `DISPATCH_PR_JSON_CACHE`, with the
caller owning the directory's lifecycle. Unlike the CI memo, it is **armed
narrowly**: `dispatch-select-tick` sets it as a per-command environment prefix on
exactly the two reconciler invocations, and tears the directory down immediately
after the pair. It is never `export`ed tick-wide, so `graph-auto-merge` (which
runs earlier and mutates PR state) and `graph-select-target` (whose `mergedAt`
freshness checks are load-bearing) never observe it. `dispatch-ladder-run`
additionally `unset`s it beside `DISPATCH_CI_VERDICT_CACHE` at all three sites,
as a containment backstop for the poll-loop hazard.

A file-backed cache directory (not a bash associative array) is required: the two
reconcilers are separate child processes, so nothing in-process survives between
them.

No brownfield migration path is needed — the change is additive and behind an
unset-by-default env var, so every existing caller is unaffected until armed.

**Accepted residual.** Within the armed window, review-stall reads the snapshot
the merged sweep took, so its maximum staleness equals the merged sweep's own
runtime. If a human merges a PR inside that window, review-stall could enter a
`fix` interrupt on an already-merged PR. This is accepted: the write is
reversible (`apply-fix-state --clear-fix`), the next tick's
`reconcile-graph-merged` absorbs the merge to `done` regardless, and every
same-tick reader whose correctness genuinely depends on `mergedAt` freshness sits
outside the armed window by construction (§4). This trade must be stated in the
lib.sh doc comment so a future reader does not widen the arming scope without
re-deciding it.

---

## Unit 1 — Memoise `gh_pr_view_rest` behind `DISPATCH_PR_JSON_CACHE`

**Recommended model:** opus

### Scope

Changes `.claude/skills/dispatch-propagate/scripts/lib.sh` and
`.claude/skills/dispatch-propagate/scripts/test-lib-gh-rest.sh`. Nothing else.

**`lib.sh:1195-1244` (`gh_pr_view_rest`)** — add the memo:

- After the existing argument parse and the `path` construction
  (`lib.sh:1214-1219`), derive a cache key from the **resolved path**, not the
  PR number, so a `--repo owner/repo` call cannot collide with a
  `{owner}/{repo}` call:
  `key=$(printf '%s' "$path" | tr -c 'A-Za-z0-9._-' '_')`.
- Cache hit: when `DISPATCH_PR_JSON_CACHE` is set and non-empty and
  `$DISPATCH_PR_JSON_CACHE/$key` exists, `cat` it and `return 0` — no gh call,
  no jq. Mirror the hit block at `lib.sh:843-850`.
- Cache miss: fetch and project exactly as today, then write the **projected**
  JSON (not the raw REST body) to the cache file before printing it. Cache only
  a non-empty projection; on `gh_retry` failure, keep the existing
  error-to-stderr + `return 1` and write nothing.
- The helper must never `mkdir` or `rm -rf` the directory — the caller owns the
  lifecycle. Copy that doctrine verbatim in shape from `lib.sh:822-824`.
- Emit the projection through a single variable so the write and the print use
  the same bytes; use `printf '%s'` / `<<<`, never `echo "$VAR" | jq`
  (`.claude/rules/shell-json.md`, linted on `.sh` files).

**Doc comment** — extend the block above `gh_pr_view_rest` (currently ending at
`lib.sh:1194`) with a `Memoisation:` section modelled on `lib.sh:822-839`, and
state explicitly:

- The var is unset by default; unset means every call fetches.
- The caller owns the directory's lifecycle.
- **No state filter and no TTL. Safety comes from ARMING SCOPE, not from what is
  cached.** For PR JSON the mutable half (`OPEN`) is exactly the half the armed
  consumer needs, so a terminal-only rule like the CI verdict cache's would cache
  nothing useful.
- The only sanctioned arming is `dispatch-select-tick`'s reconciler pair. Name
  the readers that must never see it — `graph-auto-merge` (mutates PR state,
  runs earlier) and `graph-select-target`'s `mergedAt` freshness checks — and the
  accepted residual staleness window described in §The design above.

**Tests, appended to `test-lib-gh-rest.sh`** in the `gh_pr_view_rest` byte-compat
region (currently `:739-852`), reusing that file's existing
`setup`/`teardown`/`assert_eq` harness and the `9xxx` sentinel PR range served by
`dispatch-test-fixture.sh:800-816`:

1. **Hit serves the stored body without re-fetch.** Exactly the
   overwritten-fixture shape at `test-lib-gh-rest.sh:73-88`: export
   `DISPATCH_PR_JSON_CACHE`, `mkdir -p` it, write `view-pr-9101.json`, call
   `gh_pr_view_rest 9101` and assert the projection; overwrite
   `view-pr-9101.json` with a conflicting body; call again and assert the
   **first** value is still returned.
2. **Call-count proof.** Truncate `$STUB_DIR/gh-pr-view-rest-calls.log`
   (`: > …`) before the pair of calls, then assert its line count is `1`, using
   the `suite_call_count()` template at `test-lib-gh-rest.sh:126-130`
   (`wc -l < "$f" | tr -d ' '`, guarded by `[[ -f … ]] || echo 0`).
3. **Unarmed → always fetch.** With `DISPATCH_PR_JSON_CACHE` unset, the same
   two-call sequence returns the *changed* body and logs `2` calls.
4. **Repo keying.** `gh_pr_view_rest 9102` and
   `gh_pr_view_rest --repo other/repo 9102` must not share a cache entry —
   assert two distinct files exist under the cache dir (or that the second call
   still hits gh).
5. **Failures are not cached.** With `$STUB_DIR/gh-fail-rest` present, the call
   returns non-zero and writes no cache file; removing the marker and calling
   again succeeds.

`unset DISPATCH_PR_JSON_CACHE` at the end of each armed test, matching the
existing convention at `:88` and `:209`.

### Out of scope

`dispatch_ci_verdict_rest` and its cache. The `graph-select-target`,
`graph-auto-merge`, `dispatch-context-pack`, and `dispatch-resolve-worktree`
call sites of `gh_pr_view_rest` — they stay unarmed and therefore unchanged. Any
new `source` line in `lib.sh`.

---

## Unit 2 — Arm the memo narrowly across the reconciler pair in `dispatch-select-tick`

**Recommended model:** opus

**Dependencies:** Unit 1.

### Scope

Changes `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick` and
`.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh`.

**`dispatch-select-tick`** — immediately before the `reconcile-graph-merged`
invocation at `:547`, create the cache directory using the same skeleton as
`:294-300`:

```
if [[ -n "${CLAUDE_JOB_DIR:-}" ]]; then
  mkdir -p "$CLAUDE_JOB_DIR/tmp"
  PR_JSON_CACHE=$(mktemp -d "$CLAUDE_JOB_DIR/tmp/pr-json.XXXXXX")
else
  PR_JSON_CACHE=$(mktemp -d)
fi
```

Then:

- **Do NOT `export` it.** Pass it as a per-command environment prefix on exactly
  the two reconciler command substitutions:
  `RECONCILE_GRAPH_OUT=$(DISPATCH_PR_JSON_CACHE="$PR_JSON_CACHE" "$SCRIPT_DIR/reconcile-graph-merged")`
  (`:547`) and
  `REVIEW_STALL_OUT=$(DISPATCH_PR_JSON_CACHE="$PR_JSON_CACHE" "$SCRIPT_DIR/reconcile-graph-review-stall")`
  (`:563`). This is what keeps `graph-auto-merge` (`:518`) and
  `graph-select-target` (`:1115`/`:1121`) outside the armed window. (The
  "avoid inline env var prefixes" guidance in `.claude/rules/sandbox.md` is
  about `allowedTools` prefix matching on **Bash-tool** invocations; it does not
  apply to a prefix written inside a committed script.)
- **Tear down immediately after `:563`'s consumer loop**, with an explicit
  `rm -rf "$PR_JSON_CACHE"` — the directory must not outlive the pair even
  though the tick continues for hundreds more lines.
- **Also chain it into the EXIT trap** so a crash between arming and teardown
  cannot leak it. The trap at `:304` is
  `trap '_dlog_select_emit; rm -rf "$DISPATCH_CI_VERDICT_CACHE"' EXIT`.
  `trap … EXIT` **replaces**, so re-register the combined handler once
  (`… ; rm -rf "$DISPATCH_CI_VERDICT_CACHE" "${PR_JSON_CACHE:-}"`) rather than
  adding a second `trap … EXIT` — a naive second registration silently drops
  `_dlog_select_emit`, which is what emits the tick's decision-log record. Guard
  the expansion (`${PR_JSON_CACHE:-}`) because the trap is registered at `:304`,
  long before the variable is set, and `rm -rf ""` must not be issued.
- Add a comment above the arming block stating the containment rule in one
  sentence: *the cache is armed for these two commands only; `graph-auto-merge`
  mutates PR state and `graph-select-target`'s `mergedAt` reads must stay live,
  so it is never exported.*

**Cross-script e2e test, appended to `test-graph-write-rollback.sh`** — the only
harness that already drives both reconcilers as real separate processes
(`reconcile_gh_stub()` at `:641-700`, `review_stall_gh_stub()` at `:1237-1284`,
`reconcile_node()` and `review_stall_node()` node factories). Add one case that
proves the shared fetch:

- Extend the `*/pulls/*` arm of **both** stubs to log each invocation
  (`echo "$num" >> "$GC_FIXTURE_DIR/pulls-calls.log"`), mirroring
  `dispatch-test-fixture.sh:805`'s convention. Neither stub logs today; without
  this there is nothing to count.
- Seed one node that satisfies **both** enumerations — the `review_stall_node()`
  shape at `:1289-1313` already does: `phase: review`, `markers: [reviewed]`,
  `fix: null`, non-null `execution.pr`. Serve it as an **OPEN, MERGEABLE** PR
  from a single `gh` stub that handles both `*/pulls/*` and `*/check-runs`
  (compose from `review_stall_gh_stub`, whose PR default is already
  `state: open`).
- Run `reconcile-graph-merged` then `reconcile-graph-review-stall` as two
  separate `bash` invocations against the same clone, both with
  `DISPATCH_PR_JSON_CACHE` exported to one shared temp dir (this is the tick's
  arming, reproduced).
- Assert `wc -l < pulls-calls.log` is **1**, not 2 — the second script served
  its read from the first's cache across a process boundary.
- Assert the review-stall sweep's observable behaviour is unchanged: it still
  prints its `recovered <id> -> fix` line and still writes `execution.fix`, i.e.
  the cached body drove the identical route. Reuse the existing case-10
  assertions as the template.
- Add the mirror case with the cache **unarmed**: the same sequence logs `2`
  calls and produces the identical route — proving the memo is a pure cost
  optimisation, not a behaviour change.

### Out of scope

`dispatch-tick:649` (the paused-branch drain) — it calls
`reconcile-graph-merged` alone, so there is no pair to memoise and no duplication
to remove; leave it unarmed. `graph-auto-merge`, `graph-select-target`,
`dispatch-reconcile-merged`. The review-stall sweep's enumeration, CI-verdict
call, `reviewStallRoute` subprocess, and `--base` pin — all owned by the sibling
nodes in §7.

---

## Unit 3 — Containment backstop in `dispatch-ladder-run`

**Recommended model:** sonnet

**Dependencies:** Unit 1.

### Scope

Changes `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run` and
`.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh`.

**`dispatch-ladder-run`** — the driver polls `graph-auto-merge --node`,
`reconcile-graph-merged --node`, and `reconcile-graph-review-stall --node` in a
loop at different wall-clock times, so any inherited no-TTL PR-JSON cache would
pin it to a pre-merge snapshot and it would never observe the merge — the exact
hazard the existing comment at `:1124-1127` and `:261-268` describes for the CI
cache.

- Add `unset DISPATCH_PR_JSON_CACHE` beside each existing
  `unset DISPATCH_CI_VERDICT_CACHE`: `:1128` (before `graph-auto-merge`),
  `:1161` (before `reconcile-graph-merged`), `:1195` (before
  `reconcile-graph-review-stall`). Prefer one `unset` naming both variables per
  site over a second line.
- Extend the header note at `:261-268` (*"THE CI VERDICT CACHE MUST STAY UNSET,
  load-bearing"*) to cover both caches, keeping the existing rationale and
  adding that the PR-JSON cache is armed only inside
  `dispatch-select-tick`'s reconciler pair and must never reach a poll loop.

**Test** — `test-dispatch-ladder-run.sh` currently records only argv from its
sequence fakes (`make_seq_fake` at `:126-140`). Extend `make_seq_fake` to also
append the two cache variables to `$SEQ_DIR/$name.env`, using the
`${VAR:-<unset>}` recording pattern already used at `:93-97`:

```
printf 'CI=%s PRJSON=%s\n' "\${DISPATCH_CI_VERDICT_CACHE:-<unset>}" \
  "\${DISPATCH_PR_JSON_CACHE:-<unset>}" >>"$SEQ_DIR/$name.env"
```

Then, in the existing merge/absorb/review-stall happy-path case (the one
asserting node scoping at `:565-567`), export both variables to bogus paths
before invoking the driver and assert every line of `merge.env`,
`reconcile.env`, and `stall.env` reads `CI=<unset> PRJSON=<unset>`. This also
closes the pre-existing gap that the CI cache's `unset` was never asserted.

### Out of scope

Every other `dispatch-ladder-run` behaviour: exit codes, lock handling, the
advance/await primitives, `log_event` shapes.

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/lib.sh:822-839` — the memoisation
  **doc-comment** shape (unset var = always fetch, caller owns the directory,
  what is and is not cached and why). Reuse the shape; the *content* differs
  (no state filter — see Unit 1).
- `.claude/skills/dispatch-propagate/scripts/lib.sh:843-850` and `:918-921` —
  the cache-hit short-circuit and cache-write blocks of
  `dispatch_ci_verdict_rest`. The exact code shape to mirror.
- `.claude/skills/dispatch-propagate/scripts/lib.sh:1195-1244` —
  `gh_pr_view_rest` itself: the arg parse, the `path` construction that supplies
  the cache key, and the named jq projection (`state` upcase, `mergedAt` /
  `mergeCommitSha` passthrough, `mergeable` bool→enum, `mergeStateStatus` remap,
  `headRefName` / `headRefOid`, labels narrowed to `{name}`). The projection is
  what gets cached; do not re-derive it.
- `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:294-304` — the
  `mkdir -p "$CLAUDE_JOB_DIR/tmp"` → `mktemp -d` → chained-EXIT-trap skeleton.
  Reuse the creation half verbatim; deliberately **drop** the `export` (Unit 2).
- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:1128,1161,1195`
  and the rationale at `:261-268` / `:1124-1127` — the `unset`-before-each-call
  precedent and its written justification.
- `.claude/skills/dispatch-propagate/scripts/test-lib-gh-rest.sh:73-88` — the
  overwritten-fixture cache-hit assertion. The canonical proof-of-no-refetch
  shape.
- `.claude/skills/dispatch-propagate/scripts/test-lib-gh-rest.sh:126-130` —
  `suite_call_count()`, the `wc -l`-with-missing-file-guard template for a
  `pr_view_call_count()` helper.
- `.claude/skills/dispatch-propagate/scripts/test-lib-gh-rest.sh:1566-1600` —
  `assert_rest_only()`, if the new tests also want to confirm the surviving
  fetch stayed on the REST bucket.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:800-816` —
  the `gh` stub's `api repos/*/pulls/9[0-9][0-9][0-9]` sentinel branch. It
  already logs to `$STUB_DIR/gh-pr-view-rest-calls.log` and serves
  `$STUB_DIR/view-pr-<N>.json`, so Unit 1's tests need **no stub changes**;
  reserve a fresh `9xxx` number.
- `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh` — the
  `reconcile_gh_stub()` helper (defined in the Case 6 region, above the
  `# Case 6b:` banner), the `review_stall_gh_stub()` and `review_stall_node()`
  helpers (both defined under the `# Case 10:` banner), and the Case 10a/10b/10c
  assertions — the only harness that runs both reconcilers as real separate
  processes. Unit 2's e2e case is built on these. *(Construct citations, not line
  numbers: five sibling PR5 units edit this file in the same PR.)*
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh:126-140`
  (`make_seq_fake`) and `:88-97` (the `${VAR:-<unset>}` env-recording pattern) —
  Unit 3's assertion mechanism.
- `.claude/skills/dispatch-propagate/scripts/graph-select-target:719-732`
  (`_read_pr_ci`) — naming/shape reference for bundling one `gh_pr_view_rest`
  call into decoded fields. **Reference only** — this reader must stay live and
  must never be armed.

## Verification

Run every suite from the repo root. None of these are auto-run in CI (verified:
no references in `.github/` or any `run-*.sh`), so the fences are the coverage.

```verify
bash .claude/skills/dispatch-propagate/scripts/test-lib-gh-rest.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh
```

```verify
bash .claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh
```

Regression suites for the readers that must stay unarmed and for the tick's trap
chaining:

```verify
bash .claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-graph-auto-merge.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh
```

Lint (this is what enforces `.claude/rules/shell-json.md` on the net-new `lib.sh`
lines, and the type-safety escape-hatch sensor):

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Containment assertion — the cache variable must be armed at exactly two sites
and exported at none. This fence must **fail today** and pass only after Unit 2:

```verify
test "$(grep -c 'DISPATCH_PR_JSON_CACHE=' .claude/skills/dispatch-propagate/scripts/dispatch-select-tick)" = "2" && ! grep -q 'export DISPATCH_PR_JSON_CACHE' .claude/skills/dispatch-propagate/scripts/dispatch-select-tick
```

`lib.sh` standalone-sourceability — no new top-level `source` line may be added.
~17 test fixtures copy `lib.sh` alone into a temp scripts dir by name, so a new
sibling dependency breaks every one of them at source time while staying green
locally; the constraint is written out at `lib.sh:2023-2030`.

The expected count is **`0`**, not 1. `lib.sh` has exactly one `source` today
(`:3082`, pulling in `lib-unit-disable-state.sh`) but it sits **inside**
`unit_manually_disabled()`'s body as `    if ! source "…" 2>/dev/null; then` —
the line begins with `if`, so it does not match a leading-`source` anchor, and
it is a guarded, lazy, failure-tolerant load rather than a load-time dependency.
That guarded-inside-a-function shape is the permitted one; a new **top-level**
`source` is what breaks the fixtures. Verified against `origin/main` at
`f1b76fc9`: the count below is `0` today.

```verify
test "$(grep -cE '^[[:space:]]*(source|\.) ' .claude/skills/dispatch-propagate/scripts/lib.sh)" = "0"
```

### Manual / judgment checks

- **Read the diff against §4.** Confirm by inspection that no code path exports
  `DISPATCH_PR_JSON_CACHE` into `graph-auto-merge` (`dispatch-select-tick:518`),
  into `graph-select-target` (`:1115`/`:1121`), or into any child of theirs. This
  is the whole safety argument and no test can fully substitute for reading it.
- **Confirm the EXIT trap still emits the decision log.** After the Unit 2 edit,
  re-read the single `trap … EXIT` registration and verify `_dlog_select_emit`
  is still the first member. A dropped emit is silent — the tick simply records
  nothing.
- **Observe one real tick.** After merge, watch a `dispatch-select-tick` run with
  at least one `review`+`reviewed` node in journald and confirm the review-stall
  sweep still reports the same routes it did before, and that the tick's gh REST
  call volume for `pulls/` drops by the number of review-stall candidates.
- **Scope boundary re-read.** Before opening the PR, confirm the diff touches
  none of the four sibling nodes' territory listed in §7 — in particular that
  `reconcile-graph-review-stall`'s `listNodesStrict` enumeration, its
  `dispatch_ci_verdict_rest` call, its `reviewStallRoute` subprocess, and its
  `graph-commit` invocation are byte-identical.

