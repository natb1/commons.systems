---
id: tactic-reconcile-park-clobber
kind: tactic
statement: The terminal-tactic reconciler must never destroy a live office_hours
  park it did not author — it stays ungated on office_hours for its phase/merge
  decisions (Ruling 31) but writes office_hours only under a compare-and-swap
  against the blob it read, so a park landed concurrently by another writer
  survives the reconcile
owner: ai
status: codified
parent: null
rationale: "Bug X in the bootstrap ledger, carried for weeks as 'unfiled, quiet,
  unfixed' with no reproduction. Reproduced with hard evidence 2026-08-04: a
  main-qa pass parked tactic-terminal-disposition-sweep-park-without-cas on a
  WAIT at 17:14:51Z (commit 09027d03); 22 seconds later commit d2c53f79 'graph:
  reconcile terminal tactics (record completion)' replaced the entire
  office_hours block with `office_hours: null` and left `phase: main-qa`
  untouched — a pure park erasure with no phase advance and no recorded human
  disposition. The node was then re-selected and the same WAIT re-derived at
  full main-qa token cost, which is how the defect was found. Ruling 31 ratified
  that the reconcilers stay UNGATED on office_hours — they must not skip a merge
  or a phase advance because a park is live — and this node does not reopen
  that: the defect is not that the reconciler read a park and acted anyway, it
  is that the reconciler WROTE office_hours from a stale in-memory node,
  clobbering a write that landed between its read and its write. That is the
  same lost-update shape tactic-terminal-disposition-sweep-park-without-cas (bug
  AI, PR #3042) fixed for the frozen-session sweep, so the remedy is already
  precedented: pin the diagnosis-time blob as graph-commit's --base and let its
  layer-3 compare-and-swap three-way-merge (not hard-refuse) a concurrent park
  through. Load-bearing because the whole bootstrap plan leans on parks as
  durable state: office-hours parks, WAIT parks, and the invalid-state lane's
  office-hours fallback are all silently reversible while this stands. Finalized
  2026-08-04 /align-tactics tactic-target round: verified the root cause against
  current main (a10be10a) — the bug site is
  .claude/skills/dispatch-propagate/scripts/reconcile-graph-merged, which builds
  its graph-commit argv with zero --base flags, so graph-commit's
  check_base_freshness() short-circuits and never runs."
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
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# The terminal-tactic reconciler must never destroy a live office_hours park it did not author

## Context

Bug X, carried for weeks as "unfiled, quiet, unfixed" with no reproduction, and reproduced with hard evidence 2026-08-04.

**Detect fingerprint:** a commit whose subject is `graph: reconcile terminal tactics (record completion)` (or a sibling reconcile subject) whose diff sets `office_hours: null` on a node whose `phase` it does **not** change, with no corresponding human disposition recorded.

**Confirmed instance:**

- `09027d03` (2026-08-04T17:14:51Z) — a main-qa pass parks `tactic-terminal-disposition-sweep-park-without-cas` on a WAIT.
- `d2c53f79` (2026-08-04T17:15:13Z, +22s) — `graph: reconcile terminal tactics (record completion)` removes the whole `office_hours:` block (28 deletions, 1 insertion), `phase: main-qa` unchanged.

The node was then re-selected and the same WAIT re-derived at full main-qa token cost, which is how the defect was found.

### Root cause (verified against current `main`, a10be10a)

`reconcile-graph.ts` reads each node from disk with `readNode` (`packages/intentionsutil/scripts/reconcile-graph.ts:177`, `:207`), mutates the in-memory object, and writes it back with `writeNode` (`:188`, `:220`). `writeNode` is a plain whole-file overwrite with no compare-and-swap, so every field the reconciler did not intend to touch — `office_hours` included — is rewritten from whatever the in-memory read saw.

The landing step is the bug site. `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged:184-185` builds its `graph-commit` argv with **zero `--base` flags**:

```
GC_ARGS=(-C "$REPO_ROOT" -m "graph: reconcile terminal tactics (record completion)")
for id in "${EDIT[@]}"; do GC_ARGS+=("$id"); done
```

`graph-commit`'s compare-and-swap layer therefore never runs at all — `check_base_freshness()` short-circuits on its first line (`packages/intentionsutil/scripts/graph-commit:465`: `[[ "${#BASE[@]}" -eq 0 ]] && return 0`). The commit lands whatever `writeNode` put on disk, silently overwriting any write that landed on `origin/main` between the reconciler's read and its commit.

### Scope boundary against Ruling 31

Ruling 31 (`tactic-graph-auto-merge-office-hours-gate`, ratified on PR #3033 item 10) is about the reconciler's **read** side: it does not gate its merge/advance decisions on `office_hours`, and done-but-parked is a valid state. This node does not reopen that. The defect is **not** that the reconciler read a park and acted anyway — it is that the reconciler *wrote* `office_hours` from a stale in-memory node. This node is about the **write** side only. Both must hold at once: the reconciler keeps advancing parked nodes, and it stops erasing parks.

An existing in-process regression test already pins the read side (`packages/intentionsutil/test/reconcile-graph.test.ts`, added by `7d02c555`, "reconciles a merged tactic that carries a live office_hours park … and preserves the park"). **Note for the implementer: `7d02c555` is NOT an ancestor of `main` as of a10be10a** — it is on an unmerged branch. Whether or not it has landed by execution time, it cannot catch this bug: it passes precisely because `readNode` *saw* the park. The defect is the park landing *after* the read, which no in-process test can reach. The fix must live at the `graph-commit` landing boundary.

### Intended outcome

`reconcile-graph-merged` pins, per edited node id, the blob its read actually saw, and passes it as `--base <id>=<blobsha>`. `graph-commit`'s existing layer-3 compare-and-swap then detects any concurrent landing and structurally three-way-merges it. Because `office_hours` is a `SCALAR_FIELD` (`packages/intentionsutil/src/node-merge.ts:64`) and `scalarMerge`'s "ours unchanged from base → take theirs" leg (`node-merge.ts:128`) applies — the reconciler never touches `office_hours`, so ours == base — a concurrently landed park is *taken*, not clobbered, with no conflict. The reconciler's own `phase`/`execution.completion` edits take the "theirs unchanged → take ours" leg (`node-merge.ts:129`). Both survive.

### Greenfield vs. brownfield

The greenfield design is already the repo's established idiom and needs no new mechanism: **every graph-write primitive pins the blob it read as `--base` on its landing `graph-commit`.** `park-node`, `clear-park`, and `lib-frozen-session-park.sh` all do this today; `reconcile-graph-merged` is simply a primitive that never adopted it. So there is no migration path to design — this tactic is a pure catch-up of one call site to the existing contract. No new CAS logic, no change to `writeNode`, no change to `reconcile-graph.ts`.

### Corrections to this node's own prior draft

Two claims in this node's earlier draft body were wrong and are corrected here:

1. The draft cited "`graph-commit`'s `--base` manifest and its exit-3 `stale-diagnosis` refusal". `graph-commit` has **no exit-3 refusal**. Exit 3 / hard-refuse-on-stale-base is `park-node`'s and `clear-park`'s *own* pre-check layer, which sits *above* `graph-commit`. `graph-commit`'s `--base` layer instead attempts a structural three-way merge (`graph-commit:495-521`) and only falls through to `park_and_exit()` when a divergence is genuinely unresolvable (`graph-commit:526-528`). This distinction is load-bearing: `reconcile-graph-merged` calls `graph-commit` directly, so the merge-then-park semantics are what it gets, and that is the *desired* strength here — a merge that absorbs the park is strictly better than a refusal that drops the whole sweep.
2. The draft cited the CAS doctrine skill at `.claude/skills/dispatch-propagate/skills/ref-diagnosis-time-cas`. That path does not exist. The correct path is `.claude/skills/ref-diagnosis-time-cas/SKILL.md`.

### Explicitly out of scope

- `reconcile-graph.ts` and `store.ts`'s `writeNode` are **not** changed. The overwrite is a correct property of the storage primitive; the CAS belongs at the landing boundary, matching `park-node` / `clear-park` / `lib-frozen-session-park.sh`.
- Ruling 31's read-side ungating is **not** reopened.
- `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:276-290` builds its `GC_ARGS` with the same zero-`--base` shape and has the same latent lost-update exposure. **It is deliberately out of scope for this node** — its writes are fix-state writes on a different sweep with different id sourcing. A sibling node should carry it; do not widen this PR to cover it.
- The broader PR-state-classification test coverage gap (`OPEN` / grace-window / closed-unmerged / unrecognized-state arms) is already tracked by the existing draft `tactic-reconcile-graph-merged-test-harness`. Unit 3 below adds only the CAS/park-survival cases. Do not absorb that sibling's scope.

---

## Unit 1 — Pin the diagnosis-time base blob and pass `--base` to `graph-commit`

### Scope

Single file: `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged`.

**Change A — capture the base blob (replaces the Step 2 loop at `:154-162`).**

Today Step 2 captures, per planned edit id, `origin/main`'s blob:

```
blob=$(git -C "$REPO_ROOT" rev-parse "origin/main:intentions/$sid.md" 2>/dev/null) || { ... exit 1; }
SNAPSHOT[$sid]="$blob"
```

Replace the captured value with the blob of the **on-disk file** — the content `reconcile-graph.ts`'s `readNode` actually reads — using `git -C "$REPO_ROOT" hash-object -w -- "intentions/$sid.md"`.

Two constraints on this, both load-bearing:

- **`-w` is mandatory, not optional.** `check_base_freshness` resolves the pinned base with `git cat-file -p "$sha"` and `die`s with "base blob … is unreadable in the local object database" when it misses (`graph-commit:504-506`). A disk blob that differs from any committed blob is not in the object database unless `-w` writes it there. Omitting `-w` turns a benign stale-base into a hard `die`.
- **Pin the disk blob, not `origin/main`'s.** `graph-commit:452` defines base as "the blob the writer read", and the writer read the disk. In the normal synced case the two are byte-identical, so this is a no-op. When they differ (a checkout behind `origin/main`), pinning `origin/main` would make `scalarMerge` compute a spurious "ours" delta on fields the reconciler never touched and could revert landed content — the exact failure class this node exists to close.

Keep the loop's existing hard-error posture: it currently exits 1 when an id cannot be resolved, because an id with no base has no safe rollback path. Keep that (a `hash-object` failure on a planned edit id is a real error, not a skip) — `.claude/rules/code-style.md`, clear errors over fallbacks. Rename the array from `SNAPSHOT` to something accurate (e.g. `BASE_BLOB`) since it no longer holds an `origin/main` snapshot; update the `restore_snapshot()` references at `:138-144` and the trap at `:147` accordingly (Unit 2 rewrites that function's body — coordinate, do not duplicate).

**Change B — thread the pins into `GC_ARGS` (at `:184-185`).**

Add one `--base "$id=${BASE_BLOB[$id]}"` per edit id. Use repeated flags rather than a manifest file: `graph-commit` accepts both (`graph-commit:48-51`), and the repeated-flag form drops straight into the existing `for id in "${EDIT[@]}"` loop. The `<id>=<sha>` pair form (not a bare sha) is required for a multi-id call and is a free correctness guard — `graph-commit` rejects a malformed pair via `die` (`graph-commit:375`).

**Change C — update the module header (`:1-49`).**

The header's Step-2 narration at `:126-134` describes the snapshot as an `origin/main` rollback source; that is no longer what it is. Document: the per-id base pin, why it is the disk blob, why `-w`, and that `graph-commit` merges rather than refuses on drift (so a concurrently landed `office_hours` park is absorbed, not clobbered). Reference Ruling 31's read-side/write-side split explicitly so a future reader does not "simplify" the pin away as redundant with the read-side ungating.

**Out of scope for this unit:** `reconcile-graph.ts`, `store.ts`, `graph-commit` itself, and `reconcile-graph-review-stall`. No behavior change to the PR-state classification loop (`:84-117`).

### Recommended model

opus — the correctness argument is subtle (which blob is the base, why `-w`, merge-vs-refuse semantics, interaction with the rollback trap), and getting the pin wrong silently reintroduces the lost update or converts it into a hard `die`.

---

## Unit 2 — Make the failure rollback park-safe (restore to `HEAD`, not to a captured blob)

### Scope

Single file: `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged`, function `restore_snapshot()` at `:138-144` and its `EXIT` trap at `:147`.

**Why this unit exists — it is a direct consequence of Unit 1.** Before Unit 1, no `--base` was passed, so `graph-commit`'s `park_and_exit()` path was unreachable from this script. Unit 1 makes it reachable. On that path `graph-commit` does `git reset --hard FETCH_HEAD`, writes an `office_hours` park, lands it, and exits non-zero (`graph-commit:95-110`, `:137-142`). The script's `if ! "$GRAPH_COMMIT"` at `:187` then fires the trap, and today's `restore_snapshot()` writes the *pre-park* captured blob back over each node file:

```
git -C "$REPO_ROOT" show "$blob" > "$REPO_ROOT/intentions/$sid.md"
```

`HEAD` has moved forward (the park landed), so this leaves the working tree **dirty with stale, park-erased content** — precisely the shared-checkout residue that bricks `graph-commit`'s `assert_clean_outside_ids` guard for every *other* node and every other writer. That is the failure the strategy's no-residue clarification forbids by name, and it would be *introduced* by Unit 1 if left unaddressed.

**Change:** restore each node file to its current `HEAD` content rather than to a captured blob — e.g. `git -C "$REPO_ROOT" checkout -- "intentions/$sid.md"` per id. This is correct on every failure path uniformly:

- `graph-commit` parked and moved `HEAD` → files already match `HEAD`; the restore is a no-op and the tree stays clean (the landed park is preserved).
- `graph-commit` failed before mutating anything → `HEAD` unmoved; the restore reverts the apply run's disk mutations exactly as today.
- The Step 3 apply run itself failed midway → same as above.

This also closes a latent pre-existing residue bug: when the local checkout is behind `origin/main`, today's restore writes `origin/main` bytes over files whose `HEAD` version differs, leaving them dirty rather than clean. Restoring to `HEAD` is clean-by-construction. This matches the pattern already established by `resolve-hold`'s `clean_node_file()` (`packages/intentionsutil/scripts/resolve-hold:271-299`), which returns a node file to `HEAD` — *not* to a pre-refresh copy — for exactly this `assert_clean_outside_ids` reason, and by `f233a604` ("park-node rollback restores pre-refresh local bytes, not origin/main").

Keep the single `EXIT` trap shape at `:147` (bash traps replace rather than stack — the existing comment says so; do not add a second trap). Keep the `RESTORE_ON_FAILURE` arm/disarm points at `:137`, `:166`, `:192` unchanged. Emit a stderr diagnostic naming the id if a restore fails, rather than swallowing it — the strategy's no-silent-failure invariant.

**Out of scope:** the `RESTORE_ON_FAILURE` arming logic itself, the `mktemp` `STATES_FILE` cleanup in the same trap, and `graph-commit`'s park behavior.

### Dependencies

Unit 1 (shares the same code block; Unit 1 renames the array this function reads).

### Recommended model

sonnet — a small, well-specified mechanical edit to one function with the correct target (`HEAD`) and the rationale both stated above.

---

## Unit 3 — Regression test: a concurrently landed park survives the reconcile

### Scope

Single file: `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh` (extend; do not create a new harness).

This harness is the right home and is already built for this exact family: its header (`:1-46`) describes it as the functional harness for write-failure rollback in graph-write primitives, it already constructs a throwaway bare origin plus a real clone with the real `packages/intentionsutil/src` copied in and a `node_modules` symlink (so the real TypeScript primitives execute for real), and it explicitly mirrors `test-park-node.sh`'s harness shape. It is auto-discovered and run by `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:190` (the `for test_script in "$SCRIPTS"/test-*.sh` loop), so no registration step is needed.

Add three cases:

**Case A — `--base` construction.** Stub `graph-commit` in the clone to record its argv and exit 0. Run `reconcile-graph-merged` over a fixture with two edit ids. Assert the recorded argv contains exactly one `--base <id>=<40-hex-sha>` per planned edit id, and that each pinned sha equals `git hash-object` of that node file as it stood *before* the apply run. This is the cheap, direct guard against the pin silently disappearing.

**Case B — the race: a park landed between read and write survives.** The end-to-end guard, and the one that actually reproduces bug X. Follow `test-park-node.sh:486-520`'s concurrent-write fixture pattern verbatim in shape: move the real `graph-commit` aside to `graph-commit.real` and install a thin wrapper that, once (guarded by a `.concurrent-landed` sentinel file), lands an `office_hours` park on the target node on `origin/main` from a scratch clone, then delegates to `graph-commit.real`. The real `check_base_freshness` re-fetches, sees the drift from the pinned base, and three-way merges.

Fixture: one tactic at `phase: main-qa` with `execution.pr` set and `office_hours: null` on disk; the concurrent write sets `office_hours` and leaves `phase` alone.

Assert on `origin/main` after the run:
- `phase` is `done` (the reconciler's edit landed), **and**
- `office_hours` is present and equals the concurrently landed park (the park survived), **and**
- `execution.completion.mergedAt` / `.mergeCommitSha` carry the merge evidence.

Revert Unit 1 and this case must go red with `office_hours: null` — state that in a comment so a future reader knows what it pins.

**Case C — park-path rollback leaves a clean tree (Unit 2's guard).** Stub `graph-commit` to simulate `park_and_exit()`: land a commit on the clone's `main` that sets `office_hours` on the node, move the clone's `HEAD` to it, then exit non-zero. Assert afterward that `git -C "$CLONE" status --porcelain intentions/` is **empty** and that the node file still carries the park. Under the old blob-restore this goes red (dirty tree, park erased locally).

**Fixture stubs required.** The script needs: a `gh` stub on `PATH` (its PR state comes from `gh_pr_view_rest` in `.claude/skills/dispatch-propagate/scripts/lib.sh:1097-1122`, which shells out to `gh api`) returning `{state, mergedAt, mergeCommitSha}`; and the grace window neutralized via the script's own env hooks `GRAPH_RECONCILE_GRACE=0` / `GRAPH_RECONCILE_NOW=<fixed epoch>` (`reconcile-graph-merged:58-59`) so no case races real time.

**Out of scope:** the PR-state classification arms (OPEN / within-grace / closed-unmerged / unrecognized-state) — those belong to `tactic-reconcile-graph-merged-test-harness`, not here.

**Style constraint:** this is a committed `.sh` file, so `.claude/rules/shell-json.md` is mechanically enforced on net-new added lines by `lint-prose-rules.sh`. Never pipe a captured JSON variable through `echo` into `jq` — use a here-string (`jq -r . <<<"$VAR"`) or `printf '%s'`.

### Dependencies

Units 1 and 2.

### Recommended model

opus — the concurrent-write fixture is the delicate part (a sentinel-guarded `graph-commit` wrapper that lands on a bare origin from a scratch clone, then delegates), and a subtly wrong fixture yields a test that passes against the unfixed code.

---

## Reuse

Everything this tactic needs already exists. Reuse, do not reimplement:

- **`packages/intentionsutil/scripts/graph-commit:445-528` — `check_base_freshness()`.** The compare-and-swap layer itself. Already parses repeated `--base <id>=<blobsha>` and manifest-file forms (`:48-51`, arg parsing at `:364-395`), fetches `origin/main`, and on drift runs the structural three-way merge via `run_merge_node()` (`:513`), overwriting the on-disk node with the merged result (`:517`) so the normal land proceeds. **No change to this file is needed** — the whole fix is passing it flags it already accepts.
- **`packages/intentionsutil/src/node-merge.ts` — `mergeIntentionNodes` / `scalarMerge`.** The pure three-way field merge `run_merge_node` calls. `office_hours` is listed in `SCALAR_FIELDS` (`:64`); `scalarMerge:128` is the "ours unchanged → take theirs" leg that makes the park survive, and `:129` is the "theirs unchanged → take ours" leg that keeps the reconciler's `phase` edit. Read it to justify or assert the behavior; do not modify it.
- **`packages/intentionsutil/scripts/park-node:75-96`, `:175-209`, `:369-396`.** The canonical `--base` pin-and-thread call site: capture a blob, pass `--base <id>=<sha>` to `graph-commit`. Note its *additional* pre-check layer hard-refuses with exit 3; that layer is park-node's own and is **not** what `reconcile-graph-merged` gets. Use it as the argument-shape model only.
- **`packages/intentionsutil/scripts/clear-park:47-53`, `:61-147`.** The same `--base` parsing block, verbatim — confirming this is the established repo idiom rather than a one-off.
- **`.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh:486-575`.** The precedented sibling fix cited by this node's rationale (bug AI, PR #3042, `tactic-terminal-disposition-sweep-park-without-cas`): capture the blob immediately before the write decision, thread it as `--base <id>=<blob>`, branch on the exit code. Same shape, different landing layer.
- **`packages/intentionsutil/scripts/resolve-hold:271-299` — `clean_node_file()`.** Unit 2's precedent: return a node file to `HEAD`, *not* to a pre-refresh copy, specifically so `graph-commit`'s `assert_clean_outside_ids` preflight does not trip for the next writer.
- **`.claude/skills/ref-diagnosis-time-cas/SKILL.md`.** The canonical doctrine for the diagnose → pin → execute loop. Cite it; do not re-derive it inline. (Corrected path — the earlier draft's `.claude/skills/dispatch-propagate/skills/…` path does not exist.)
- **`.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh:1-60`.** The harness Unit 3 extends: bare origin + real clone + real `src` + read-only `node_modules` symlink, already wired for stubbing `graph-commit`.
- **`packages/intentionsutil/scripts/test-park-node.sh:486-520`.** The sentinel-guarded concurrent-write fixture (`graph-commit` wrapper that lands a competing change on `origin/main` once, then delegates to `graph-commit.real`) that Case B copies in shape.
- **`.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged:135-166`.** The existing plan-then-apply scaffold — `--no-apply` plan run, per-id capture loop, `RESTORE_ON_FAILURE` arm, single `EXIT` trap. Units 1 and 2 modify this block in place; do not build a parallel mechanism beside it.

## Verification

Auto-runnable:

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual / judgment checks:

1. **Confirm the fix actually engages.** Revert Unit 1's `--base` threading alone (leave Units 2 and 3 in place) and re-run `test-graph-write-rollback.sh`. Cases A and B must both go red. If Case B still passes without `--base`, the fixture is not reproducing the race — the concurrent write is probably landing before the base pin is captured rather than between the pin and the commit. Fix the fixture, not the assertion.
2. **Confirm the merge resolved rather than parked.** On a passing Case B, check the captured `graph-commit` stderr for the layer-3 merge path — a resolved merge logs the `RESOLVED_VIA_MERGE` suffix on its final "landed" line (`graph-commit:319-323`). If Case B instead exercises `park_and_exit()`, the park survived only because nothing landed, which is a materially weaker guarantee than the one this node claims. Investigate: `office_hours` should never conflict, since the reconciler leaves it equal to base.
3. **Observe in production, one sweep.** After merge, watch the next real `reconcile-graph-merged` run that has a terminal PR to reconcile. Confirm the stderr line `graph-commit: checking --base freshness for N node(s) against origin/main` (`graph-commit:466`) appears with N equal to the number of reconciled ids. Its absence means the flags are not reaching `graph-commit` and the CAS is still short-circuiting — the silent failure mode this node exists to remove.
4. **Re-run the detect fingerprint against history.** After a week of sweeps, run a scan for the original fingerprint: commits subject-matching `graph: reconcile terminal tactics` whose diff sets `office_hours: null` without changing `phase`. Expected count: zero after the merge commit. A non-zero count means either another writer shares the defect (check `reconcile-graph-review-stall`, deliberately out of scope above) or the pin is being captured at the wrong moment.
5. **Confirm no residue regression.** After any sweep that fails (including a deliberately induced one), verify `git status --porcelain intentions/` is empty in the reconciler's checkout. A dirty tree here blocks every other graph writer and is the shared-checkout brick the strategy's no-residue clarification forbids.
