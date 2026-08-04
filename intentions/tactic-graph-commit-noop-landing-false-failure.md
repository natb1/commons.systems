---
id: tactic-graph-commit-noop-landing-false-failure
kind: tactic
statement: graph-commit runs a full CI-stamped landing cycle for a write that is
  already a no-op, and its required-check gate counts check-run ROWS rather than
  distinct required contexts — so that cycle can never pass on an
  already-stamped SHA, converting a no-op write into a false 'main busy' failure
  that fails the whole dispatch tick
owner: ai
status: codified
parent: null
rationale: "(Recorded 2026-07-28 /align-strategy round.) Diagnosed live from the
  2026-07-28 manual dispatch tick that exited 1. Chain: tactic-sync-reader-skill
  provisioned exit 13 (scope-stale), so dispatch-graph-execute called
  demote-node-to-implement; the node was ALREADY at phase implement, so the
  write staged nothing; graph-commit took its 'no new changes to stage — landing
  current HEAD' branch (graph-commit:1476) and entered a real landing cycle
  against e81ae2f5, which was already origin/main HEAD and already CI-stamped.
  await_checks (graph-commit:610) then gated on `[[ \"$nsucc\" -eq 4 ]]`, where
  nsucc counts check-RUN ROWS matching the four required names — not distinct
  contexts. Verified against the GitHub API: e81ae2f5 carried exactly 3
  successful runs of each of acceptance, preview-and-smoke, lint, unit-tests (12
  rows, 0 failures) because the same SHA had been pushed to two graph/** scratch
  branches and to main, each firing the fast path. 12 != 4, so the gate could
  never return 0; five attempts x 180s were burned (attempts 2-5 pushed nothing
  — 'Everything up-to-date'), then the run died with 'main busy (landing-lock
  contention or required checks never stamped green)'. Neither cause was
  present: no competing writer, no red check. demote-node-to-implement rolled
  its write back and reported 'failed tactic-sync-reader-skill demote-failed',
  which forced dispatch-graph-execute's exit 1 (dispatch-graph-execute:320) and
  the tick's failure. Filed as a SEPARATE node from the graph-commit siblings,
  per the same distinct-defect-class discipline they already follow:
  tactic-graph-commit-landing-lock is contention serialization (done),
  tactic-graph-commit-cwd-repo-resolution was wrong-repo targeting (done),
  tactic-graph-commit-staleness-silent-revert is staleness misjudging a genuine
  dirty edit. This node is the inverse of that last one — there, a real edit is
  lost and reported as success; here, an absent edit is reported as failure —
  but both are reached through the same land-current-HEAD fallback, which is why
  they cross-reference. That fallback was hardened on 2026-07-28 by PR #2978
  (merged as 29952532) to die on a mis-pointed -C rather than emit a false
  'landed'; #2978's own comment at graph-commit:1457-1459 asserts the surviving
  benign branch is 'a trivial no-op push when HEAD == origin/main', and this
  incident is the counterexample — it is not trivial, because it still runs the
  full scratch-push + await_checks stamp cycle. Interim by construction:
  tactic-graph-ref-split deletes the CI stamp entirely (graph lands on
  origin/graph-main under a validate-only gate), which removes await_checks and
  this whole defect class; this node exists because that is a large in-flight
  change and this failure fails ticks deterministically today, at roughly 15
  wasted minutes per occurrence. Reconciled 2026-07-28 /align-tactics finalize
  round: verified still current against origin/main a1eb6c16 (graph-commit
  unchanged at 1505 lines, same line numbers); no material drift found. Body
  re-verified and updated with current line citations; three immaterial premises
  the plan surfaced are recorded in this node's own clarifications array below
  (a tactic-target session may not edit the serving strategy's frontmatter)."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: The boost 97 is meant to make this the next thing the fleet works —
      does it actually do that while the node is a draft?
    answer: "(Recorded 2026-07-28 /align-strategy round.) Not yet, and this is
      recorded so the gap is not mistaken for a ranking failure. This node is
      filed status: raw with phase: null — a draft — and the router never
      selects a draft tactic, so the 97 boost is INERT until an /align-tactics
      round finalizes this node into a planned tactic with a phase. Only then
      does it resolve to 102.33 and rank at the top of the authored
      discretionary band. The precedent that motivated recording this:
      tactic-graph-commit-staleness-silent-revert carried an authorized boost of
      173 from 2026-07-26 while sitting at status raw / phase null, and was
      never selected on that boost at all — its fix ultimately shipped through
      an office-hours drain session (PR #2978), not through the ranking the
      boost was intended to buy. What unblocks this node is therefore an
      /align-tactics round on strategy-graph-native-dispatch, which is already
      in the align-tactics rotation (it was selected for that lane in the
      2026-07-28 tick that surfaced this defect). If the fix is wanted sooner
      than that rotation delivers, the direct route is an office-hours or
      interactive session against this node rather than a higher boost — raising
      the number changes nothing while the node remains a draft."
  - question: Whether the fix must also short-circuit graph-commit's 'no new changes
      to stage — landing current HEAD' fallback (graph-commit:1476) to skip the
      scratch-push + await_checks stamp cycle for a HEAD==origin/main no-op, or
      whether patching await_checks's counting gate alone is sufficient. The
      gather evidence flags this as 'a separate scope decision worth deciding
      explicitly in the plan'; neither clarification 3's recorded invariant nor
      any condition speaks to it.
    answer: "(Recorded 2026-07-28 /align-tactics round.) Patching await_checks's
      success-side counting is sufficient on its own to clear the no-op false
      failure; short-circuiting the 'landing current HEAD' fallback is a cost
      optimization, not a correctness requirement. Traced end-to-end at HEAD:
      with a distinct-context gate the already-stamped SHA passes on its
      existing green rows, and try_land's final `git push origin <sha>:main`
      (graph-commit:980) is a benign no-op exiting 0 when that SHA already is
      origin/main's tip, so try_land returns 0 and the write reports 'landed'.
      Scope for tactic-graph-commit-noop-landing-false-failure is therefore
      bounded to the counting gate plus a regression case in the existing
      fixture/shim harness (test-graph-commit.sh:219-287, which runs
      graph-commit's REAL --jq program and is a required check via
      .github/workflows/unit-tests.yml:211). Skipping the scratch push and poll
      entirely for a HEAD==origin/main no-op — saving roughly one stamp cycle
      per no-op write — is deliberately NOT in scope, since
      tactic-graph-ref-split deletes the whole stamp cycle."
  - question: How the distinct-context gate treats rows that are NOT from the
      current run — both the pending rows of the freshly-fired scratch-push run
      and any stale concluded-failure row left by an earlier re-run.
      Clarification 3's recorded invariant ('counts DISTINCT required contexts
      green, never check-run rows') governs the success side only and is silent
      on both.
    answer: "(Recorded 2026-07-28 /align-tactics round, refining the
      distinct-context invariant recorded with the amendment to clarification
      80.) The distinct-context gate is evaluated over ALL check-run rows on the
      SHA, not the newest run's rows: on an already-stamped SHA it passes on the
      prior run's green rows while the scratch push's freshly-fired run is still
      pending. That is sound precisely because the SHA is content-identical — a
      re-run of identical content cannot yield a different verdict — and it is
      why the fix need not wait for the new run to conclude. The failure side is
      unchanged and stays unchanged: ANY row among the four required names
      carrying a concluded non-success is fatal (rc 2 / die,
      graph-commit:613-616), so a stale red row left by a re-run flake still
      kills a landing on that SHA. Preserving that semantics is the recorded
      scope; relaxing it to 'the latest row per required context wins' is flake
      tolerance the author has not ratified and must not ride along with this
      fix."
  - question: That the strategy's signal path is currently un-validated in substance
      even though one non-draft child carries a validates edge to it — i.e. that
      the edge is stale relative to the 2026-07-28 amended success_signal. The
      rationale implies it ('now HISTORY, not pending work') but no
      clarification records the consequence for eligibility.
    answer: "(Recorded 2026-07-28 /align-tactics round.)
      tactic-legacy-router-removal (phase done, PR #2960) is the ONLY node in
      the corpus carrying `validates: [strategy-graph-native-dispatch]` —
      verified by scanning every intentions/tactic-*.md validates block — but
      that edge was authored against the migration-completion threshold this
      strategy's rationale now marks as superseded HISTORY. Nothing validates
      the amended success_signal (the owned path carrying tactics through the
      full lifecycle with a bounded machinery-defect population, sensed via
      align-tactics-census.ts plus the selection log). Consequence: an
      eligibility check that reads the signal-path edge alone will see this
      strategy as already-validated and refuse to decompose — a false negative,
      since the amended signal is structurally unvalidated. Resolving it
      (re-pointing or clearing the stale edge, or minting a tactic that actually
      produces the amended signal's reading) is an author-lane record decision,
      not something an autonomous round should write."
tooling_goals: []
success_signal: null
attention:
  boost: 50
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: Wave A of a three-band interim scale
    (50 / 20 / 10) that puts write-path integrity work above ordinary feature
    work. This band holds the silent graph-write-corruption defects plus the two
    paths the bootstrap arms or depends on. Interim scaffolding only -
    tactic-attention-tier-ranking replaces the whole numeric scheme with
    lexicographic (tier, rank) and max-lifting, and
    tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks."
phase: done
execution:
  branch: tactic-graph-commit-noop-landing-false-failure
  pr: 2981
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-07-31T14:31:12Z
    mergeCommitSha: 10f9e91aee7560b9feaca9f0d2509b962720a989
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

## Context

`packages/intentionsutil/scripts/graph-commit` is the sole write primitive that lands intention-node edits on `main`. Two independent defects in its landing path compose into a deterministic dispatch-tick failure, observed live on 2026-07-28 and confirmed against the GitHub API and the script at `origin/main` (`29952532`):

1. **A no-op write still buys a full landing cycle.** When nothing is staged for any target id, `main()` prints `no new changes to stage … landing current HEAD` and falls through to `land` (`packages/intentionsutil/scripts/graph-commit:1477`). PR #2978 hardened that branch to `die` on a mis-pointed `-C` (differing blob, nothing staged), but the surviving branch its own comment calls "a trivial no-op push when HEAD == origin/main" is not trivial: `land` claims the landing lock, pushes a `graph/**` scratch branch, polls `await_checks`, then pushes to `main`. When `HEAD == origin/main` there is nothing to push, so the entire cycle is pure cost.
2. **The required-check gate counts check-run ROWS, not distinct contexts.** `await_checks` (`packages/intentionsutil/scripts/graph-commit:583-630`) counts rows whose `.name` is one of the four required contexts and gates on `[[ "$nsucc" -eq 4 ]]` (line 610). A SHA accumulates one row per context **per workflow run**, and the same SHA is re-stamped every time it is pushed to another `graph/**` scratch branch or to `main`. Observed on `e81ae2f5c58bd2634b047e86c534e1867684ede7`: 3 successful runs of each of `acceptance`, `preview-and-smoke`, `lint`, `unit-tests` — 12 green rows, 0 failed. `12 != 4`, `nfail == 0`, so neither the success path nor the deterministic exit-2 path could ever fire. The SHA became permanently unlandable.
3. **The diagnostic names a cause that was not present.** After five attempts × 180 s, `try_land` reports `main busy (landing-lock contention or required checks never stamped green)` (`packages/intentionsutil/scripts/graph-commit:986`). Neither held — no competing writer, every required check green. The message must report the per-context state actually observed.

The incident chain: `tactic-sync-reader-skill` provisioned exit 13 → `dispatch-graph-execute` called `demote-node-to-implement` → the node was **already** at `phase: implement`, so the write staged nothing → defect 1 sent a pure no-op into a landing cycle on an already-stamped SHA → defect 2 made that cycle unpassable → defect 3 reported contention → `demote-node-to-implement` rolled back and printed `failed … demote-failed` → `dispatch-graph-execute:320` (`(( FAILURES == 0 )) && exit 0 || exit 1`) failed the tick. The correct outcome for the whole chain was success: the node was already in the target state.

**Greenfield vs. this change.** The ideal design deletes the mechanism: `tactic-graph-ref-split` moves the graph to `origin/graph-main` under a validate-only gate, removing the CI stamp, `await_checks`, and this whole defect class. That is a large in-flight change. This tactic is **interim by construction** — a bounded two-unit repair of the existing landing path, scoped to keep the current `land`/`await_checks` architecture intact. It should be dropped if `tactic-graph-ref-split` lands first. Do **not** rewrite the landing/stamp mechanism here, and do **not** raise `GRAPH_COMMIT_MAX_ATTEMPTS` (every retry re-observes the same duplicate rows).

Intended outcome: a no-op write exits 0 immediately without a stamp cycle; a genuinely-landable SHA lands regardless of how many prior runs stamped it; and when checks really are not green, the error names which contexts are green, pending, absent, or failed.

---

## Unit 1 — `await_checks`: gate on distinct required contexts, and report per-context state

### Scope

Files that change:

- `packages/intentionsutil/scripts/graph-commit`
- `packages/intentionsutil/scripts/test-graph-commit.sh`

**1a. Add a module-level global for the last observed per-context state.**

Declare it alongside the other landing globals (`packages/intentionsutil/scripts/graph-commit:157-198`, e.g. next to `SCRATCH_BRANCH`/`SCRATCH_PUSHED` at lines 160-161), with a short comment: written by `await_checks` on every successful poll, read by `try_land`'s retry and terminal messages so a landing failure reports the state actually observed rather than a guessed cause.

```sh
# LAST_CHECK_DETAIL — a human-readable per-context snapshot of the most recent
# successful check-run poll (e.g. "acceptance=success(3 rows), lint=pending(1
# row), ..."). Written by await_checks(), read by try_land()'s retry and
# terminal messages so a failed landing names the state it actually observed
# instead of guessing at contention (Defect 3).
LAST_CHECK_DETAIL=""
```

**1b. Replace the row-counting `--jq` program in `await_checks`** (`packages/intentionsutil/scripts/graph-commit:598-608`). The new program emits **one line per required context**, in a fixed order, shaped `<name> <latest-conclusion> <row-count>`, where `latest-conclusion` is the conclusion of the newest run for that name (`pending` when it is still `null`) and a name with no rows at all emits `absent 0`:

```jq
["acceptance","preview-and-smoke","lint","unit-tests"] as $req
| (.check_runs // []) as $all
| $req[] as $name
| [$all[] | select(.name == $name)] as $rows
| if ($rows | length) == 0 then "\($name) absent 0"
  else ($rows | max_by([(.started_at // ""), (.id // 0)])) as $latest
    | "\($name) \($latest.conclusion // "pending") \($rows | length)"
  end
```

This program was validated during planning against the harness's existing fixtures and against new duplicate-row / partial-duplicate / stale-failure fixtures; outputs are given under Verification. Keep it as the single `--jq` argv element passed to `gh api "repos/{owner}/{repo}/commits/$sha/check-runs"` — do **not** introduce an `echo "$VAR" | jq` round-trip (`.claude/rules/shell-json.md`), and do **not** add a second query path.

Ordering key rationale, to be captured in the comment: check-run `id` is monotonic per repository and `started_at` is ISO-8601 (lexicographically sortable), so `max_by([started_at, id])` identifies the newest run for a name. Keying off `.conclusion` alone (`null` = pending) is retained deliberately — GitHub sometimes leaves `status` stuck at `in_progress` after `conclusion` is populated (the #2457 desync the current comment at lines 591-597 documents). Extra runs such as CodeQL `Analyze (*)` and the fast path's `guard` job stay excluded by the name filter.

**1c. Replace the counting/gating block** (`packages/intentionsutil/scripts/graph-commit:606-616`). Aggregate the four lines in bash:

```sh
      gh_fails=0
      ngreen=0; nbad=0; detail=""
      while read -r cname cconc crows; do
        [[ -n "$cname" ]] || continue
        detail+="${detail:+, }$cname=$cconc(${crows} row(s))"
        case "$cconc" in
          success)         ngreen=$((ngreen + 1)) ;;
          pending|absent)  ;;
          *)               nbad=$((nbad + 1)) ;;
        esac
      done <<<"$counts"
      LAST_CHECK_DETAIL="$detail"
      if [[ "$ngreen" -eq 4 ]]; then
        return 0
      fi
      if [[ "$nbad" -gt 0 ]]; then
        echo "graph-commit: a required check concluded non-success for $sha — $detail" >&2
        return 2
      fi
```

Notes the implementer must respect:

- The script runs under `set -euo pipefail` (`packages/intentionsutil/scripts/graph-commit:86`). Use `x=$((x + 1))`, never `(( x++ ))` — the latter returns 1 when the pre-increment value is 0 and would kill the script.
- Update the `local` declaration at line 585 (`local deadline counts nsucc nfail gh_stderr gh_fails=0`) to the variables actually used (`deadline counts ngreen nbad cname cconc crows detail gh_stderr gh_fails=0`), and drop the now-dead `nsucc=0` initialization at line 590.
- The `[[ -n "$counts" ]] || counts="0 0"` fallback at line 607 becomes dead and must be removed: the new program always emits four lines (`(.check_runs // [])` handles a null/absent array, and a missing name emits `absent 0`). If the jq program itself errors, `gh` exits non-zero and the existing 3-consecutive-failure `die` path handles it — that path is unchanged.
- **Preserve the 0/1/2 return-code contract exactly** as documented at `packages/intentionsutil/scripts/graph-commit:566-582`: 0 = all four green, 1 = timeout (transient, caller retries), 2 = a required check CONCLUDED non-success (deterministic, caller must not retry). No new return codes, no new signalling. Rewrite the prose of that doc block to describe distinct-context-with-latest-run-per-name counting instead of row counting, and keep the "dies after 3 consecutive gh failures" paragraph verbatim in substance.
- Preserve the substrings `concluded non-success` (line 614) and `required checks not green within` (line 626) — the existing harness greps them.

**1d. Update the timeout message** (`packages/intentionsutil/scripts/graph-commit:626`) to append `LAST_CHECK_DETAIL`, e.g.:

```sh
      echo "graph-commit: required checks not green within ${CHECK_TIMEOUT_SECONDS}s for $sha — ${LAST_CHECK_DETAIL:-<no successful poll>}" >&2
```

**1e. Update `try_land`'s two failure messages** so the false "main busy" diagnosis (Defect 3) is replaced by observed state:

- Line 967 (`checks did not go green for $sha on attempt …`) — append `— ${LAST_CHECK_DETAIL:-<no successful poll>}`.
- Line 986, the terminal message. **Keep the substrings `could not land on main after $ran/$MAX_PUSH_ATTEMPTS attempts` and `retry later`** (harness cases 5 and 7 grep them), and replace the speculative parenthetical with the observed state. Target shape:

```sh
  echo "error: graph-commit: could not land on main after $ran/$MAX_PUSH_ATTEMPTS attempts — last observed required-check state: ${LAST_CHECK_DETAIL:-<no successful poll>} (or landing-lock contention if no poll ran); retry later" >&2
```

**1f. Harness coverage** in `packages/intentionsutil/scripts/test-graph-commit.sh`. Reuse the existing fixture + gh-shim mechanism — the shim at lines 261-287 extracts graph-commit's **real** `--jq` argv and runs it with real `jq` against `$GC_FIXTURE_DIR/<mode>.json`, so any new fixture exercises the real filter end-to-end. Do not add a second shim or a second extraction path.

Add three fixtures next to the existing four (`packages/intentionsutil/scripts/test-graph-commit.sh:219-259`). Existing fixtures stay unchanged (one row per name ⇒ `max_by` is trivially that row):

- `duplicate-rows.json` — two rows per required name, both `completed`/`success`, with distinct `id` and `started_at` (the incident shape: a prior stamp plus a fresh one), plus an unrelated `CodeQL`-named failing row to prove the name filter still excludes it.
- `partial-duplicate.json` — four rows total but only three distinct names green: two `lint` successes, one `preview-and-smoke`, one `unit-tests`, and **no `acceptance` row**. This is the regression guard against naively relaxing the gate to `-ge 4`.
- `stale-fail-then-green.json` — for `acceptance`, an older row with `conclusion: "failure"` and a newer row with `conclusion: "success"` (higher `id`/`started_at`); single green rows for the other three.

Add three cases after Case 32 (`packages/intentionsutil/scripts/test-graph-commit.sh:1185-1200`) and **before** the final "No scratch branches left behind anywhere" check at the file tail. Use the existing helpers `set_mode`, `make_clone`, `edit_line`, `run_gc`, `origin_show`, `origin_sha`, `sync_clone`, `gh_calls`, `ok`, `no` (defined at lines 127-129 and 433-466); use the `GC_POLL`/`GC_TIMEOUT`/`GC_ATTEMPTS` knobs on `run_gc` to keep the failing case fast — no new timing plumbing:

- **Case 33 — duplicate green rows land.** `set_mode duplicate-rows`; a fresh clone edits a new id; `run_gc` must exit 0, the edit must be visible via `origin_show`, and the output must not contain `retry later`. This is the direct regression for the incident.
- **Case 34 — duplicated rows do not paper over a missing context.** `set_mode partial-duplicate`; run with `GC_POLL=0 GC_TIMEOUT=1 GC_ATTEMPTS=1`; must exit 1, must **not** land the edit on `main` (`origin_sha` unchanged), and the output must contain `acceptance=absent` — proving both the distinct-context gate and the Defect-3 diagnostic. Follow the existing convention of `sync_clone` afterwards to drop the never-landed local commit (see Case 5, line 555).
- **Case 35 — a stale failed row superseded by a newer success lands.** `set_mode stale-fail-then-green`; must exit 0, land the edit, and must **not** print `concluded non-success` (the latest run per name is authoritative).

Extend the header "Covers:" list (`packages/intentionsutil/scripts/test-graph-commit.sh:12-59`) with entries 33-35 in the existing style.

**Out of scope for this unit:** any change to `land()`/`try_land()`'s retry structure, lock handling, or attempt counts; centralizing the four required-context names into a shared constant/array (they currently live inline in graph-commit's jq program and are duplicated as JSON literals in `packages/intentionsutil/scripts/test-graph-commit.sh` and `packages/intentionsutil/scripts/test-park-node.sh:213-216` — verified in sync with `.github/workflows/graph-fast-path.yml:34-55` job names today, and left that way deliberately); any change to `.github/workflows/graph-fast-path.yml`; the no-op short-circuit (Unit 2).

### Recommended model

`opus` — the counting semantics are subtle (latest-run-per-name vs. any-green, pending-vs-absent classification, preserving the 0/1/2 contract and the grepped message substrings under `set -e`), and a wrong call here silently re-arms an unlandable-SHA failure mode.

---

## Unit 2 — short-circuit the landing cycle when the write is a genuine no-op

### Scope

Files that change:

- `packages/intentionsutil/scripts/graph-commit`
- `packages/intentionsutil/scripts/test-graph-commit.sh`

**2a. Add the no-op guard** in `main()`'s nothing-staged branch, **after** PR #2978's per-id blob comparison loop (`packages/intentionsutil/scripts/graph-commit:1468-1476`) and **before** the existing `no new changes to stage … landing current HEAD` echo at line 1477:

```sh
    # Nothing is staged AND every id already matches origin/main. If HEAD is
    # also exactly origin/main there is, by definition, nothing to push: the
    # whole land() cycle (landing lock, graph/** scratch push, await_checks,
    # push to main) is pure cost on a SHA that already carries its checks.
    # Exit success here rather than buying a stamp cycle that cannot change
    # main (tactic-graph-commit-noop-landing-false-failure, Defect 1).
    local head_sha main_sha
    head_sha="$(git rev-parse HEAD)"
    main_sha="$(git rev-parse FETCH_HEAD)"
    if [[ "$head_sha" == "$main_sha" ]]; then
      echo "graph-commit: no new changes to stage for ${ALL_IDS[*]} and HEAD is already origin/main (${head_sha:0:8}) — nothing to push; skipping the landing cycle" >&2
      exit 0
    fi
```

Requirements the implementer must respect:

- Use the `FETCH_HEAD` already populated by `ensure_intentions_only_base()`'s fetch (`packages/intentionsutil/scripts/graph-commit:496-499`, called at line 1450) — **do not fetch again**, exactly as the comment at lines 1465-1467 instructs for the blob comparison directly above.
- Keep the substring `no new changes to stage` in the new message: harness cases 2 and 28 grep it.
- Do **not** print `landed … on main` on this path — nothing was landed, and a false "landed" claim is the failure mode PR #2978 removed. Callers use the exit status only (`packages/intentionsutil/scripts/park-node:263` branches on `if ! …graph-commit …`; no caller greps graph-commit's output).
- `exit 0` here runs the `cleanup` EXIT trap installed at line 1401, which restores `ORIG_HEAD` when `ensure_intentions_only_base()` moved a far-ahead worktree onto origin/main and removes `SNAP_DIR`. `SCRATCH_PUSHED` is still 0 and `LOCK_HELD` still 0, so no scratch branch and no lock are involved. Do not add bespoke cleanup.
- Preserve the existing line-1477 message and fall-through for the `HEAD != FETCH_HEAD` case (a prior attempt committed locally but did not push) — that case genuinely needs `land`. Reword line 1477 so it no longer claims to cover the "nothing to commit" case that now exits above it.

**2b. Harness coverage** in `packages/intentionsutil/scripts/test-graph-commit.sh`:

- **Strengthen Case 2** (idempotent re-run on a clean tree, lines 483-491): call `set_mode green` immediately before the invocation so `gh_calls` is reset (`set_mode` truncates the call log, line 434), then additionally assert `gh_calls` is `0` and `scratch_refs` is empty — i.e. the no-op made no GitHub poll and pushed no scratch branch. Keep the existing rc-0 / unchanged-`origin_sha` / `no new changes to stage` assertions.
- **Strengthen Case 28** (fail-loud guard, benign equal-blob, lines 1065-1083): same addition — `set_mode green` before the run, then assert `gh_calls` is `0` alongside the existing rc-0 / `no new changes to stage` / no-`mis-pointed` / unchanged-`origin_sha` assertions. This is the exact incident shape (a clone synced bit-for-bit to origin/main's tip), so it is the primary regression guard.
- **Add Case 36 — a no-op invocation still exits 0 when the check-run state is unusable.** `set_mode hard-fail` (the shim exits 1 on every `gh` call, lines 268-271), a clone synced exactly to origin/main's tip, invoke `run_gc` on an existing id with nothing edited: must exit 0, must not contain `polling failed`, and `gh_calls` must be `0` — proving the no-op path never reaches the poller at all. Place it after Case 35 and before the final "No scratch branches left behind anywhere" check.
- Extend the header "Covers:" list with entry 36 and amend entries 2 and 28 to mention the zero-poll assertion.

**Out of scope for this unit:** the `HEAD` *behind* `origin/main` with nothing staged case (no local commits to push). It is deliberately left on the existing `land` path — the node body specifies preserving existing behaviour when `HEAD != FETCH_HEAD`, and after Unit 1 that path is cheap: the rebase fast-forwards, the scratch push re-stamps, and `await_checks` returns on its first poll. Also out of scope: any change to `id_files_dirty()` (lines 531-538), to `ensure_intentions_only_base()`, to the #2978 mis-pointed-`-C` `die`, or to `land()`/`try_land()`.

### Dependencies

Unit 1. Both units edit `packages/intentionsutil/scripts/graph-commit` and `packages/intentionsutil/scripts/test-graph-commit.sh`; sequencing them avoids a conflict, and Case 34's assertion on the new diagnostic string depends on Unit 1 having landed.

### Recommended model

`sonnet` — a well-specified guard with a fixed diff shape (one bounded insertion plus explicit test-assertion additions), no design decisions left open.

---

## Reuse

- `packages/intentionsutil/scripts/graph-commit:583-630` — `await_checks()`, the single source of truth for the four required-context names and the row-counting bug. Patch here; do not build a parallel query path.
- `packages/intentionsutil/scripts/graph-commit:566-582` — the existing `await_checks` 0/1/2 return-code contract comment. Keep the contract; rewrite only the counting prose.
- `packages/intentionsutil/scripts/graph-commit:1450` / `:496-499` — `ensure_intentions_only_base()` already fetched, so `FETCH_HEAD` is the fresh `origin/main` for both the existing blob comparison and Unit 2's `HEAD` comparison.
- `packages/intentionsutil/scripts/graph-commit:335-359` — `cleanup()` (EXIT trap) already handles `RESTORE_HEAD`, `SNAP_DIR`, scratch-branch delete and lock release on every exit path, including Unit 2's new `exit 0`.
- `packages/intentionsutil/scripts/test-graph-commit.sh:219-259` and `:261-287` — the fixture directory and the `gh` shim that extracts graph-commit's real `--jq` argv and runs it with real `jq`. Add fixtures and `set_mode` values; add no new shim.
- `packages/intentionsutil/scripts/test-graph-commit.sh:127-129, 433-466` — `ok`/`no`, `set_mode`, `gh_calls`, `origin_show`, `origin_sha`, `sync_clone`, `edit_line`, `scratch_refs`, `make_clone`, and `run_gc` with its `GC_POLL`/`GC_TIMEOUT`/`GC_ATTEMPTS`/`GC_LOCK_*` knobs. All new cases use these.
- `packages/intentionsutil/scripts/test-graph-commit.sh:540-556` (Case 5) and `:572-585` (Case 7) — the assertion style for the die-immediately and burn-attempts-then-fail paths; Case 34 mirrors Case 7's shape.
- `packages/intentionsutil/scripts/test-park-node.sh:207-258` — a third harness that copies and runs the **real** graph-commit, with its own inline four-name green fixture. It gains the fix automatically; no parallel change is needed there, but it must keep passing (see Verification).
- `.github/workflows/graph-fast-path.yml:34-55` — the authoritative origin of the four required-context names (`acceptance`, `preview-and-smoke`, `lint`, `unit-tests`). The jq program's inline literals must stay byte-identical to these job names.
- `.github/workflows/unit-tests.yml:205-211` — where `test-park-node.sh`, `test-transition-node.sh` and `test-graph-commit.sh` are already wired into CI. No workflow change is needed.

## Verification

Run the full graph-commit harness — it is the bare-origin + multi-clone functional suite and the home of every new case:

```verify
packages/intentionsutil/scripts/test-graph-commit.sh
```

The two sibling harnesses copy and run the real `graph-commit`, so they are the regression check that the new gate did not break the single-row-per-name path:

```verify
packages/intentionsutil/scripts/test-park-node.sh
```

```verify
packages/intentionsutil/scripts/test-transition-node.sh
```

Shell prose-rule lint (both changed files are shell scripts; `run-lint.sh` auto-detects that and runs `lint-prose-rules.sh`, which enforces `.claude/rules/shell-json.md` on net-new lines — the new `gh api … --jq` call must not become an `echo "$VAR" | jq` round-trip):

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh --prose
```

Expected `jq` outputs, validated during planning against the exact program in Unit 1b (useful for debugging a harness failure — no separate runnable check needed, the harness cases assert the resulting behaviour):

| fixture | emitted lines | `ngreen` / `nbad` | `await_checks` |
|---|---|---|---|
| `green.json` (existing) | 4 × `<name> success 1` | 4 / 0 | 0 |
| `desynced-success.json` (existing) | 4 × `<name> success 1` | 4 / 0 | 0 |
| `pending.json` (existing) | 4 × `<name> pending 1` | 0 / 0 | 1 (timeout) |
| `concluded-fail.json` (existing) | `unit-tests failure 1`, rest success | 3 / 1 | 2 |
| `duplicate-rows.json` (new) | 4 × `<name> success 2` | 4 / 0 | 0 |
| `partial-duplicate.json` (new) | `acceptance absent 0`, `lint success 2`, rest success 1 | 3 / 0 | 1 (timeout) |
| `stale-fail-then-green.json` (new) | `acceptance success 2`, rest success 1 | 4 / 0 | 0 |

Manual / observe-in-production checks (not auto-runnable):

- After the change is on `main`, watch the next dispatch tick that produces a no-op graph write — the common shape is `dispatch-graph-execute` calling `demote-node-to-implement` on a node already at the target phase. Expected: `graph-commit` prints `no new changes to stage … HEAD is already origin/main … skipping the landing cycle`, exits 0 within seconds, and the tick exits 0. Failure signature to watch for is the old one: five `attempt N/5` lines and `could not land on main`.
- Confirm a normal (non-no-op) land still waits correctly. On the first real graph write after the change, the scratch push fires a fresh fast-path run whose rows are the newest per name and start as `pending`; `await_checks` must wait for them to conclude and then land. If instead it lands instantly off older rows, the ordering key is wrong (that is the `max_by` behaviour to check).
- Sanity-check the new diagnostic once against a genuinely non-green SHA if one occurs: the terminal message should name per-context state (`acceptance=…`, `lint=…`) rather than asserting contention.


## Observed 2026-07-30: the blast radius is fleet starvation, not a false failure

The record above scopes this defect as a *false failure* — one tick exits 1 and
one node's write is rolled back. Observed live during the dispatch-pipeline
bootstrap's Stage 4 drain, that understates it by a wide margin. **The severity
this node should be planned against is fleet-wide starvation.**

What was seen:

- An orphaned `graph-commit` held `refs/graph/landing-lock` for **17 minutes**,
  renewing the claim past its TTL. `LOCK_TTL_SECONDS` is
  `CHECK_TIMEOUT_SECONDS + 60` = 240s (`graph-commit:119`, `:128`), so the
  expiry-and-steal path that is supposed to bound a dead holder never fired —
  the process was alive and renewing, just looping on a gate it could never
  pass.
- `origin/main` was frozen for **~35 minutes across the entire fleet**. Every
  graph write serializes on that lock, so this is not one node's problem: no
  phase transition, no park, no reconcile could land for any node while it was
  held.
- The scratch branch was at **exactly `origin/main`** — the write was a genuine
  **no-op**, because the reconcile it was landing had already landed 19 minutes
  earlier. So the whole fleet was frozen for over half an hour by a landing
  cycle for a change that did not exist.

That last point is what connects it to the diagnosis already recorded here: the
no-op path enters a real landing cycle (`graph-commit:1476`), and the row-counting
`await_checks` gate makes that cycle unpassable on an already-stamped SHA. The
new information is that the loop does not merely fail — it **holds the global
write lock while failing**, so the cost is paid by every other writer.

Resolved by `SIGTERM` to the orphan, with author approval.

**Termination is safe by construction** — worth recording, because the instinct
is to delete the lock ref instead, which is unsafe:

- `graph-commit:1402-1405` converts `INT`/`TERM` into `exit 130` precisely
  because an `EXIT` trap does not reliably fire on signals in all shells.
- `cleanup()` (`:335`) then restores the original HEAD, deletes the pushed
  scratch branch (`:349-351`), and releases the lock via its `LOCK_HELD`
  backstop (`:356-358` → `lock_release()`, `:885`), which pushes with
  `--force-with-lease`.

So `SIGTERM` to the holder is the correct remedy for an orphan, and deleting
`refs/graph/landing-lock` by hand never is. Note also that several live
`graph-commit` processes are legitimate fleet contention, not orphans — check
`pgrep -af 'packages/intentionsutil/scripts/graph-commit'` before concluding
anything, and discount the self-match from your own shell command.

### What this means for the planned fix

The plan in this node is scoped to making the no-op case exit early and to
correcting the row-counting gate. Both remain right. What the plan should add is
that **the fix's value is bounded by lock-hold time, not by message accuracy** —
a change that produced a correct terminal diagnostic but still burned five
180-second attempts under the lock would leave the starvation intact. Prefer the
early-exit-before-lock-acquisition ordering wherever the two are separable, and
treat "how long can a no-op hold `refs/graph/landing-lock`" as the acceptance
question.

## needs-main residue

- id: 11
  title: Interim-by-construction scope holds until tactic-graph-ref-split lands
  url_path: current
  expected_outcome: The interim fix stops the deterministic dispatch-tick failure without accruing debt the greenfield ref-split fix must pay down; live ticks confirm genuine no-ops land instantly.
  finding: Judgment item flagged planned-deferral by the qa-fix disposition Workflow — the golden-path claim (a genuine no-op lands instantly on the live dispatch tick) and the non-recurrence of the 12-row false failure are only observable against real GitHub check-run data across subsequent ticks on main, not at PR merge time.

## Verification evidence 2026-07-31 — residue item 11 PASSES, park was a misroute

Machine-verified after PR #2981 merged (2026-07-31T14:31:12Z, merge commit
`10f9e91a`). The single `needs-main` residue item (id 11) resolves entirely from
live post-merge machine data — `journalctl` for the tick behavior, `gh api
.../check-runs` for the row data, `gh pr view --json files` for the scope claim.
No author-required question remains, so the node advances `main-qa` → `done`
rather than waiting on office-hours.

**Clause A — "live ticks confirm genuine no-ops land instantly" — PASS.** The
Unit 2 short-circuit fired on a real headless tick (heartbeat #2022,
2026-07-31T15:00–15:01Z), 29 minutes after the merge:
`graph-commit: no new changes to stage for … and HEAD is already origin/main
(663d38c9) — nothing to push; skipping the landing cycle`, with the next
`graph-select-target` step 3 seconds later. No `refs/graph/landing-lock` push,
no `graph/**` scratch branch, and no check-run poll appears anywhere in the
window. Contrast the pre-fix no-op over the same node set 29 minutes earlier:
`— landing current HEAD` at 14:31:38Z → lock push → scratch push → `landed` at
14:32:54Z = **76 s of stamp cycle for a zero-diff write**.

**Clause B — "non-recurrence of the 12-row false failure" — PASS.** The
signature (`required checks not green within …` / `could not land on main …
main busy`) has **243 occurrences** in the five days before the fix, including
two full 5-attempt burn cycles in the 45 minutes before merge (`12/4 green` at
13:49–14:01Z — the literal 12-row symptom — then `16/4 green` at 14:05–14:17Z as
a fourth duplicate set landed). The last occurrence is **14:17:54Z, 14 minutes
before the merge**; there are **zero** occurrences after the new binary reached
the tick's checkout at 14:31:42Z. The stuck SHA `06c19a40` carries 16 rows
across 4 required contexts (4 each of acceptance, preview-and-smoke, lint,
unit-tests) — the exact unlandable shape — and is already an ancestor of
`origin/main`. Post-fix, the genuine land `d4f0b0d3` (14:47:52Z, first attempt,
no retry lines) and the no-op SHA `663d38c9` each carry one row per context.

  One honest limit, recorded rather than papered over: post-merge no
  *duplicate-row* SHA has yet reached `await_checks` on live main, because
  Unit 2 now short-circuits the path that produced them. Unit 1's
  distinct-context gate is therefore proven by the harness cases (33–36, green
  in the required `unit-tests` run on merge commit `10f9e91a`) rather than by a
  live duplicate-row land. That does not weaken item 11, whose claim is
  non-recurrence of the failure, not exercise of the gate.

**Clause C — "without accruing debt the greenfield ref-split fix must pay
down" — PASS.** PR #2981 touches only `packages/intentionsutil/SEPARABILITY.md`,
`scripts/graph-commit`, and the three harness scripts — confined to
`await_checks` plus the nothing-staged branch, i.e. precisely the two code paths
`tactic-graph-ref-split` deletes wholesale. That successor is alive and
progressing (`phase: implement`, unparked). Residual scope was split out as its
own node, `tactic-graph-commit-noop-shortcircuit-head-behind`, rather than left
as debt.

**Why this sat in `main-qa` at all — an instance of the verifiability-sort
defect.** The `/qa-main` pass sorted item 11 to office-hours on the ground that
it "is not browser-verifiable — its `url_path` is the literal string `current`".
That is true and irrelevant: the graph's criterion is machine-verifiable vs.
author-required, not browser vs. non-browser. Recorded here as a live instance
for `tactic-qa-main-verifiability-sort-criterion`, which owns the fix.

**The park never landed — a live instance of the Stop-hook backstop defect.**
The `/qa-main` pass built the park as local commit `db99d1ec` in
`.claude/worktrees/tactic-graph-commit-noop-landing-false-failure`, which was
never pushed to any remote; `park-node`'s exit trap then reverted the working
tree, leaving the node on `origin/main` untouched at `phase: main-qa` /
`office_hours: null` and the park text stranded in the session's job directory.
Both the misroute and the stranding are recorded on
`tactic-phase-terminal-requires-disposition`, which owns deleting that backstop
in favor of the tick sweep. The stranded commit is discarded rather than landed,
because the correct disposition is this evidence, not the park.
