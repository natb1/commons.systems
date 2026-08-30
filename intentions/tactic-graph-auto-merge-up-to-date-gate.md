---
id: tactic-graph-auto-merge-up-to-date-gate
kind: tactic
statement: graph-auto-merge merges only a PR whose branch is current with
  origin/main and whose passing checks ran on that current base; when BEHIND the
  tick scripts gh api update-branch and defers the merge to a later green tick
owner: ai
status: codified
parent: null
rationale: "Surfaced in the 2026-07-19 /align-strategy interview recording the
  stale-base auto-merge gap: a merged review PR's green CI had run on a stale
  base and main went red after the merge. Author direction: merge eligibility
  requires the PR up to date with main with all checks passing on that current
  base; all scriptable steps of the done-phase merge path live in the dispatch
  router. Retained as a follow-up to tactic-graph-tick-node-lane-auto-merge (PR
  #2904 lands as-is; the author accepts the interim unguarded window until this
  ships). Planned 2026-07-30 by the dispatch-pipeline bootstrap through a
  parallel Workflow fan-out rather than an /align-tactics round, so that skill's
  two-sided drift review and its census were bypassed (deliberate: ten
  concurrent align rounds would mean ten concurrent graph-commits, the exact
  hazard the bootstrap exists to avoid). Each plan was authored against the
  node's own cited code and then independently verified by a second agent; all
  reported citation and substance gaps were applied before landing. A later
  /align-tactics round should treat this body as unreviewed by the normal path."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 0.05
  override: null
  rationale: >-
    Bootstrap re-scale 2026-07-30: Wave A of a three-band interim scale (50 / 20
    / 10) that puts write-path integrity work above ordinary feature work. This
    band holds the silent graph-write-corruption defects plus the two paths the
    bootstrap arms or depends on. Interim scaffolding only -
    tactic-attention-tier-ranking replaces the whole numeric scheme with
    lexicographic (tier, rank) and max-lifting, and
    tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 50 to 0.05 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
  tier: 1
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
blocked_by:
  - tactic-graph-tick-node-lane-auto-merge
office_hours: null
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 50
---
# graph-auto-merge merges only a PR whose branch is current with origin/main and whose passing checks ran on that current base; when BEHIND the tick scripts gh api update-branch and defers the merge to a later green tick

## Context

`graph-auto-merge` (`.claude/skills/dispatch-propagate/scripts/graph-auto-merge`) is the
only code that merges a graph-native node-lane PR. Every tick, `dispatch-select-tick`
(`.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:482-489`) invokes it; for
each `kind: tactic` node at `phase: review` carrying an `execution.pr` and the `reviewed`
marker it senses the PR and squash-merges it when four conjuncts hold: PR state `OPEN`
(`graph-auto-merge:127-128`), `mergeable == MERGEABLE` (`graph-auto-merge:130-131`), CI
verdict `passing` on the PR head oid (`graph-auto-merge:133-143`), and a fresh tactic-scope
fingerprint (`graph-auto-merge:145-173`).

**The defect:** none of those four conjuncts means the PR branch is *current* with
`origin/main`. `mergeable == MERGEABLE` means only "no textual conflict" — a PR that is
dozens of commits behind main is `MERGEABLE`. The CI verdict is computed on the PR's head
oid, so a green verdict says the code passed *against whatever base the branch was cut
from*, not against the main tip it is about to land on. The observable bad outcome already
happened: a reviewed node-lane PR whose green CI had run on a stale base was merged, and
`origin/main` went red immediately after. A red main then suppresses the whole tick's
auto-merge block (`dispatch-select-tick:464`, `:482` — both gated on `OPEN_MAIN_RED` being
empty), so one stale-base merge stalls the entire merge lane until a human or the
main-health lane clears it.

**The fix (author-directed):** add a fifth conjunct — the live `origin/main` tip must be
contained in the PR head. When it is not, the tick scripts the remediation itself
(`PUT repos/{owner}/{repo}/pulls/<n>/update-branch`, which merges main into the PR head and
re-triggers CI on the fresh base), emits `synced #<pr> (<id>)`, and skips the candidate this
tick. A later tick merges it once CI is green *on that now-current base*. This gate never
routes fix or conflict work: a red check after a sync reaches the fix worker through
`reconcile-graph-review-stall` (`.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall`,
which fires on `ci: failing` or `mergeable: CONFLICTING`), and a conflict routes to
`/fix-conflicts` at re-provisioning. This gate only updates the branch and defers.

**Why not GitHub-native branch protection (require-up-to-date) + a merge queue:** that
machinery does solve stale-base CI, but it moves merge behavior into GitHub configuration
the graph cannot read, deepening the delegation to GitHub that the serving strategy
(`strategy-graph-native-dispatch`) is trying to recover. The owned tick gate keeps merge
eligibility keyed on state the graph can see. This was settled in the strategy interview;
do not revisit it.

**Blocker status:** the node's `blocked_by: tactic-graph-tick-node-lane-auto-merge` is
satisfied — the script it edits is already on `origin/main` (commit `c2a7970c`, PR #2904).
Verified: `graph-auto-merge` exists at `origin/main` and the worktree copy is byte-identical
to it. All `path:line` anchors below were read at that state and were accurate at authoring
time; re-verify each before editing, since line numbers drift.

## Unit 1 - Add `gh_pr_update_branch_rest` to lib.sh

**Recommended model**: `sonnet`

**Scope**

Add one REST-backed mutation helper to
`.claude/skills/dispatch-propagate/scripts/lib.sh`, inserted immediately after
`gh_pr_merge_rest` (which spans `lib.sh:1538-1588`: doc comment `1538-1543`, body
`1544-1588`). Mirror that helper's shape exactly — flag-parsing `while`/`case` loop,
required-arg validation with a diagnostic to stderr, `--repo` cross-repo path segment,
`gh_retry` wrapping, and the clear-errors convention (error to stderr, `return 1`, never a
fallback).

Contract:

- Name: `gh_pr_update_branch_rest`
- Args: `$1` = PR number (required; missing → `error: gh_pr_update_branch_rest: PR number
  is required` to stderr, `return 1`). Flags: `--expected-head-sha <sha>` (optional),
  `--repo owner/repo` (optional). Unknown `--*` flag → error + `return 1`. A second
  positional → `error: gh_pr_update_branch_rest: unexpected argument '<arg>'` + `return 1`.
- Path: `repos/{owner}/{repo}/pulls/<N>/update-branch`, or `repos/<repo>/pulls/<N>/update-branch`
  when `--repo` is given.
- Call: `gh_retry gh api -X PUT "$path" "${flags[@]}" >/dev/null` where `flags` is a
  `local -a flags=()` that gains `-f "expected_head_sha=$expected"` only when
  `--expected-head-sha` was passed. (The empty-array-under-`set -u` expansion is already the
  established pattern here — see `commit_flags` at `lib.sh:1580-1584`.)
- On gh failure: `echo "error: gh_pr_update_branch_rest: gh api failed for $path" >&2` and
  `return 1`.

Doc comment above the function must state: the endpoint MERGES the base branch into the PR
head (creating a merge commit and re-triggering CI) rather than rebasing; and that
`expected_head_sha` is a compare-and-swap guard — GitHub rejects the update with 422 when
the head moved since it was sensed. Note `gh_retry` (`lib.sh:125-151`) does not retry
non-transient failures, so a 422 returns immediately.

Tests go in `.claude/skills/dispatch-propagate/scripts/test-lib-gh-rest.sh`, in two
places:

1. **gh stub arm.** The shared `gh` stub is a first-wins `case` over `$args`. Add an arm
   `"api -X PUT "*/pulls/*/update-branch*)` alongside the `gh_pr_merge_rest` arm and, like it,
   **before** the generic `api repos/*/pulls/*` arm. The arm appends `$args` to
   `"$STUB_DIR/gh-pr-update-branch-rest-calls.log"`, honors the existing
   `$STUB_DIR/gh-fail-rest` marker (print `stub forced gh api failure` to stderr, `exit 1`),
   and otherwise echoes `{}`.
2. **Helper tests.** Add a `# --- gh_pr_update_branch_rest ---` block immediately after the
   `gh_pr_merge_rest` block (its last sub-test is the gh-failure case; the sixth sub-case
   teardown precedes it, so inserting there would splice the new block into the middle of the
   existing tests). Follow that block's exact idiom (`setup` / `: > "$STUB_DIR/<log>"` /
   `source "$TMPDIR_TEST/lib.sh"; <call>` / `grep -q` into `assert_eq` / `teardown`). Cases:
   - PUT to `pulls/42/update-branch` with no `expected_head_sha` field sent.
   - `--expected-head-sha abc123` sends `expected_head_sha=abc123`.
   - `--repo owner/other-repo` emits `repos/owner/other-repo/pulls/42/update-branch`.
   - Missing PR number → non-zero exit and stderr naming the helper (copy the
     `gh_pr_view_rest` missing-number test).
   - `gh-fail-rest` marker → non-zero exit and the `gh api failed for` stderr line.

Out of scope for this unit: any change to `graph-auto-merge`, to `dispatch-auto-merge`, or
to any existing helper. The helper has no caller until Unit 2 — that is expected.

**Reuse**

- `.claude/skills/dispatch-propagate/scripts/lib.sh:1544-1588` (`gh_pr_merge_rest`) — the
  structural template for the whole helper.
- `.claude/skills/dispatch-propagate/scripts/lib.sh:125-151` (`gh_retry`) — wrap the `gh api`
  call with it; do not call `gh` bare.
- `.claude/skills/dispatch-propagate/scripts/test-lib-gh-rest.sh` — the stub-arm
  template (including the `gh-fail-rest` failure-injection idiom) and the
  helper-test template.

## Unit 2 - Gate `graph-auto-merge` on branch currency and sync when behind

**Recommended model**: `opus`

**Dependencies**

Unit 1 — this unit calls `gh_pr_update_branch_rest`, which Unit 1 adds to `lib.sh`.

**Scope**

Edit `.claude/skills/dispatch-propagate/scripts/graph-auto-merge`. The script runs under
`set -uo pipefail` (not `set -e`) and sources `lib.sh` at line 49; per-item hard errors set
`HARD_ERROR=1`, log to stderr, and `continue` — preserve that discipline exactly.

**(a) One live main-tip read per sweep.** After the `git archive origin/main intentions`
snapshot block (`graph-auto-merge:98-111`), read the live `origin/main` tip once:

```bash
MAIN_SHA=$(gh_retry gh api "repos/{owner}/{repo}/commits/main" | jq -r '.sha') || {
  echo "graph-auto-merge: could not read the live origin/main tip (cannot run the up-to-date gate)" >&2
  exit 1
}
[[ -n "$MAIN_SHA" && "$MAIN_SHA" != "null" ]] || {
  echo "graph-auto-merge: empty origin/main tip sha (cannot run the up-to-date gate)" >&2
  exit 1
}
```

This block sits after the `[[ -z "$CANDIDATES" ]] && exit 0` early exit
(`graph-auto-merge:96`), so an empty sweep spends no REST call. Use the **live** REST tip,
not `git rev-parse origin/main`: a stale local ref makes a behind PR look current, which
fails *open* and silently disables the gate. Hard-erroring on a failed read is the same
fail-closed stance the snapshot block already takes (`graph-auto-merge:103-111`). The
`repos/{owner}/{repo}/commits/main` + `jq -r '.sha'` idiom already exists at
`.claude/skills/dispatch-propagate/scripts/repo-health:227`.

**(b) Bind the head oid once.** At `graph-auto-merge:137` the head oid is computed inline
inside the CI-verdict call. Hoist it so the currency comparison uses the *same* oid the CI
verdict was computed on:

```bash
HEAD_OID=$(jq -r '.headRefOid' <<<"$PR_JSON")
rc=0
VERDICT=$(dispatch_ci_verdict_rest "$HEAD_OID") || rc=$?
```

(Never `echo "$PR_JSON" | jq` — zsh's `echo` corrupts embedded `\t`/`\n`; the file already
uses `<<<` everywhere.)

**(c) The gate itself.** Insert after the freshness gate's final `scopeStale` hold
(`graph-auto-merge:170-173`) and before the merge block that begins at
`graph-auto-merge:175`. Placing it last means only candidates that would otherwise merge
spend the compare call, and an existing `held` verdict keeps precedence over a sync.

```bash
  rc=0
  CMP=$(gh_commit_is_ancestor_rest "$MAIN_SHA" "$HEAD_OID") || rc=$?
  if [[ "$rc" -ne 0 ]]; then
    echo "graph-auto-merge: compare origin/main...#$pr head failed for $id (rc=$rc)" >&2
    HARD_ERROR=1
    continue
  fi
  case "$CMP" in
    ahead|identical) ;;          # main's tip is contained in the head → up to date
    behind|diverged)
      rc=0
      out=$(gh_pr_update_branch_rest "$pr" --expected-head-sha "$HEAD_OID" 2>&1) || rc=$?
      if [[ "$rc" -ne 0 ]]; then
        echo "graph-auto-merge: error: gh_pr_update_branch_rest #$pr failed: $out" >&2
        HARD_ERROR=1
        continue
      fi
      echo "synced #$pr ($id)"
      continue
      ;;
    *)
      echo "graph-auto-merge: unexpected compare status '$CMP' for #$pr ($id)" >&2
      HARD_ERROR=1
      continue
      ;;
  esac
```

Semantics of `gh_commit_is_ancestor_rest` (`lib.sh:1016-1058`), which returns
`.status` from `GET repos/{owner}/{repo}/compare/<base>...<head>` with base=main tip,
head=PR head:

- `ahead` — the head is ahead of the main tip, i.e. the tip is an ancestor of the head →
  **up to date**, merge.
- `identical` — head == main tip → up to date (degenerate).
- `diverged` — main has commits the head lacks → **not** up to date; the ordinary behind-PR
  case. Sync and defer.
- `behind` — the head is an ancestor of the main tip, i.e. its commits already landed out of
  band. Rare; still not up to date, so it takes the same sync-and-defer path rather than
  merging. `reconcile-graph-merged` absorbs the genuinely-already-merged case on a later
  tick. Say this in a comment.
- Anything else (including the literal `null` jq prints when the response has no `.status`)
  → hard error, no merge. Fail closed.

`continue` inside `case` continues the enclosing `while` loop (`case` is not a loop) — this
is correct and intentional.

Behavior notes to record as comments so a later reader does not "fix" them:

- The `--expected-head-sha` guard means a head that moved between sensing and syncing yields
  a 422 rather than a blind update. That is treated as a hard error (stderr + `HARD_ERROR=1`),
  matching how a failed merge is handled at `graph-auto-merge:186-190`. `dispatch-select-tick:483`
  wraps the call in `|| true`, so a non-zero exit never aborts the tick.
- Repeated syncing is self-limiting: each sync changes the head oid, so the same head is
  never synced twice. A busy main can legitimately cause a second sync on a later tick.
- A behind PR whose CI is `pending` or `failing` is skipped before this gate is reached
  (`graph-auto-merge:143`) and so is never synced — deliberate: red CI belongs to the fix
  interrupt.
- A residual race remains: main can advance between the tip read and the merge PUT. It is
  bounded and accepted; GitHub itself rejects a merge that has become impossible.

**(d) Header documentation.** Update the header comment block:

- The ordered gate list at `graph-auto-merge:18-25` gains the up-to-date conjunct, stated as
  the last gate before merging, with the sync-and-defer behavior.
- The stdout protocol at `graph-auto-merge:37-40` gains `synced #<pr> (<id>)` per PR whose
  branch was updated, alongside the existing `merged #<pr> (<id>)` and `held <id> (<reason>)`.

**(e) Consumer doc.** Update `.claude/skills/review-fix/references/node-lane.md:24-29`, whose
prose enumerates the merge conditions ("only when it is `mergeable == MERGEABLE`, green on
CI, and the node's tactic-scope fingerprint is fresh against `origin/main`"), to include the
up-to-date conjunct and the sync-and-defer behavior. No code change is needed in
`dispatch-select-tick`: its loop at `:484-488` prefixes every stdout line with `merge: `, so
the new line surfaces as `merge: synced #<pr> (<id>)` automatically.

**(f) Tests** — extend the existing `graph-auto-merge` fixture in
`.claude/skills/dispatch-propagate/scripts/test-graph-auto-merge.sh`. That fixture
builds a real temp repo with a real `origin/main` (so the `git archive` runs for real), stubs
`node` and `gh` on `PATH`, injects CI verdicts through `DISPATCH_CI_VERDICT_CACHE`, and pins
`GRAPH_AUTO_MERGE_MAIN_ROOT`.

Extend the fake `gh` in `test-graph-auto-merge.sh`. Its `api` branch extracts the
first `repos/*` argument into `path`, special-cases `*/merge`, and otherwise falls back to
`N="${path##*/}"` + `stub/pr-$N.json`. Add three arms **before** that fallback (order matters
— `*/commits/main` would otherwise fall through and look for `stub/pr-main.json`):

- `*/update-branch` → append `$*` to `$STUB/update-branch-calls.log`; if
  `$STUB/update-branch-fail` exists, print an error to stderr and `exit 1`; else echo `{}`.
- `*/compare/*` → `cat "$STUB/compare.json"`.
- `*/commits/main` → if `$STUB/main-sha-fail` exists, stderr + `exit 1`; else
  `cat "$STUB/main-sha.json"`.

Add a helper next to `gam_fresh`:

```bash
gam_uptodate() {  # live main tip + a compare status that reads "up to date"
  printf '%s\n' '{"sha":"mainsha"}'    > "$GAM_ROOT/stub/main-sha.json"
  printf '%s\n' '{"status":"ahead"}'   > "$GAM_ROOT/stub/compare.json"
}
```

`gam_reset` wipes `stub/*`, so call `gam_uptodate` after `gam_reset` in
**every** existing case — (a), (c), (d), (e), (f). Case (b) exits before Step 3 (empty
candidate set), but call it there too for uniformity. Those cases must keep their current
expected output unchanged.

New cases to append before the `rm -rf "$GAM_ROOT" "$GAM_BARE"` cleanup:

- **(g) behind → sync, no merge.** Reviewed + green + MERGEABLE + fresh stamp, with
  `stub/compare.json` = `{"status":"diverged"}`. Assert stdout is exactly
  `synced #<pr> (<id>)`, exit 0, `update-branch-calls.log` contains
  `pulls/<pr>/update-branch` **and** `expected_head_sha=<head sha>`, and `merge-calls.log`
  is absent.
- **(h) compare `behind` → same sync-and-defer treatment** (assert the `synced` line and no
  merge PUT).
- **(i) compare `identical` → merges** (assert `merged #<pr> (<id>)`, a merge PUT, and no
  update-branch call).
- **(j) update-branch failure** (`touch "$GAM_ROOT/stub/update-branch-fail"`, compare
  `diverged`) → empty stdout, exit 1, no merge PUT.
- **(k) unexpected compare status** (`{"status":"weird"}`) → empty stdout, exit 1, no merge
  PUT, no update-branch call.
- **(l) main-tip read failure** (`touch "$GAM_ROOT/stub/main-sha-fail"`) → exit 1, no merge
  PUT, no update-branch call — the whole sweep aborts before the candidate loop.

`run_gam` (`:33225-33232`) already sets `GH_RETRY_ATTEMPTS=1 GH_RETRY_BASE_DELAY=0`, so
failure cases do not sleep. Follow the existing assertion idiom exactly:
`gam_x_out=$(run_gam 2>/dev/null); gam_x_rc=$?` then `assert_eq` on output, rc, and
`grep -q`/`[[ -f ]]` log probes.

**Explicitly out of scope**

- `.claude/skills/dispatch-propagate/scripts/dispatch-auto-merge` (the legacy label-gated
  issue-lane merger). No up-to-date gate is added there.
- `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall` and all fix /
  conflict routing. This gate updates the branch and defers; it never demotes a node, never
  clears a marker, and never routes a worker.
- Any change to `dispatch-select-tick` (the `merge: ` prefixing already covers the new line).
- Any GitHub branch-protection or merge-queue configuration.
- Any edit to `intentions/*.md` (the strategy prose at
  `intentions/strategy-graph-native-dispatch.md:938-940` already describes this composition
  correctly).

**Reuse**

- `.claude/skills/dispatch-propagate/scripts/lib.sh:1021-1058` (`gh_commit_is_ancestor_rest`)
  — the compare primitive; do not write a new one.
- `gh_pr_update_branch_rest` from Unit 1 (`lib.sh`, immediately after `gh_pr_merge_rest`).
- `.claude/skills/dispatch-propagate/scripts/lib.sh:125-151` (`gh_retry`) — for the
  `commits/main` read.
- `.claude/skills/dispatch-propagate/scripts/repo-health:227` — the exact live-main-tip read
  idiom.
- `.claude/skills/dispatch-propagate/scripts/graph-auto-merge:184-190` — the
  `rc=0 / out=$(... 2>&1) || rc=$? / stderr + HARD_ERROR=1 + continue` error template.
- `.claude/skills/dispatch-propagate/scripts/test-graph-auto-merge.sh` — the whole
  `graph-auto-merge` fixture; extend it rather than building a new harness.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-graph-auto-merge.sh || exit 1
.claude/skills/dispatch-propagate/scripts/test-lib-gh-rest.sh || exit 1
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && .claude/skills/dispatch-propagate/scripts/run-lint.sh --prose
```

`test-graph-auto-merge.sh` and `test-lib-gh-rest.sh` are the harnesses CI runs for these scripts
(`.github/workflows/unit-tests.yml:199`); it covers both units. It is large — expect several
minutes. If it fails with read-only-filesystem or `mktemp` errors rather than assertion
failures, re-run the Bash call with `dangerouslyDisableSandbox: true` (it creates temp git
repos; see `.claude/rules/sandbox.md`). It must be green with **zero** failed assertions,
including all pre-existing `graph-auto-merge` cases (a)-(f) — a regression there means
`gam_uptodate` was not wired into an existing case.

`run-lint.sh --prose` runs `lint-prose-rules.sh`, which mechanically rejects net-new
`echo "$JSON" | jq` lines in committed `.sh` files. New JSON reads must use `<<<"$VAR"` or
`--jq`.

Manual checks, not auto-runnable:

- Re-read the edited `graph-auto-merge` top-to-bottom and confirm the gate ordering is:
  OPEN → MERGEABLE → CI passing → fingerprint fresh → **up to date**. A currency check placed
  before the CI gate would sync red PRs, which contradicts the design (red CI belongs to the
  fix interrupt).
- Confirm the new code path can never both `echo "synced ..."` and reach the merge PUT for the
  same candidate in the same iteration (each non-up-to-date branch ends in `continue`).
- These edits land under `.claude/skills/**`. In auto mode the permission classifier may deny
  the *commit* of configuration/skill files even though the Write/Edit succeeded; if the
  commit is denied, ask the user for a grant and retry the commit rather than reverting.

Observe in production, after merge: on the next few ticks that have a reviewed node-lane PR,
check the tick log for `merge: synced #<pr> (<id>)` lines and confirm each names a PR GitHub
shows as behind, that the PR's branch gained an "Merge branch 'main' into ..." commit, that
CI re-ran on the new head, and that the PR merged on a later tick only after that re-run went
green.

## Shipped 2026-08-13 — PR #3073, merge `3fea9f35`

Both units landed (branch commit `5cf5d32d`), plus two follow-on hardening
units from the same PR's `/code-review high` rounds.

- **Unit 1** added `gh_pr_update_branch_rest` to
  `.claude/skills/dispatch-propagate/scripts/lib.sh`, modelled on
  `gh_pr_merge_rest`, with the `--expected-head-sha` compare-and-swap guard.
- **Unit 2** added the fifth conjunct to `graph-auto-merge`: one live
  `origin/main` tip read per sweep, the head oid bound once so the currency
  compare uses the same oid the CI verdict ran on, and the
  `ahead|identical` → merge / `behind|diverged` → sync-and-defer arm placed
  last, after the freshness gate. Gate ordering as specified: OPEN →
  MERGEABLE → CI passing → fingerprint fresh → up to date.
- **Units 10 + 12** (review residue) added the sync cap that keeps the sync
  arm from thrashing a PR indefinitely. That work is recorded on its own node,
  `tactic-graph-auto-merge-sync-cap`, which the shipped code cites by id at
  `graph-auto-merge:95` and `:427`.

**Why this one blocked the e2e run.** `MERGEABLE` means only "no textual
conflict", so a green PR far behind `main` could merge and turn `main` red —
which trips the main-health gate and suppresses the whole merge lane. A
multi-hour ladder run is exactly the window in which `main` moves.

Suites green at merge: `test-graph-auto-merge.sh` 84/84 (was 49),
`test-lib-gh-rest.sh` 334/334 (was 321).

**On the `blocked_by` edge.** This node was implemented over an open blocker,
knowingly. `tactic-graph-tick-node-lane-auto-merge` sits at `phase: main-qa`,
office-hours parked because needs-main item 9b never fired in production — but
its *code* landed in merged PR #2904, which is the only thing this node
depended on. The edge is a bookkeeping park, not a missing dependency, and it
is left in place: the blocker's own disposition is still owed.

**Known residue, deliberately not fixed here.** The `behind` arm — a PR whose
commits already landed out of band — syncs rather than merging, and that sync
can produce an empty diff. It is recorded as
`tactic-graph-auto-merge-behind-arm-out-of-band` rather than patched; see that
node for the corrected failure model.
