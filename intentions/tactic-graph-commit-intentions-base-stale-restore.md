---
id: tactic-graph-commit-intentions-base-stale-restore
kind: tactic
statement: graph-commit's ensure_intentions_only_base() resets to a re-fetched
  base and then unconditionally copies its pre-reset snapshot back over
  intentions/<id>.md with no freshness check, so a concurrent landing that
  advanced that id between snapshot and reset is silently overwritten with stale
  content
owner: ai
status: codified
parent: null
rationale: "Root-caused by a sibling session and surfaced 2026-07-28 at an
  office-hours drain sitting; filed as its own node because nothing else tracks
  it. ensure_intentions_only_base()
  (packages/intentionsutil/scripts/graph-commit:496-515) runs when the writer's
  HEAD is ahead of origin/main with non-intentions changes. It re-fetches
  origin/main, does 'git reset --hard $base_sha', then for every id in IDS does
  'cp -- $SNAP_DIR/$id.md $INTENTIONS_DIR/$id.md' with NO check that the
  snapshot was taken against the base it is now being replayed onto. SNAP_DIR
  was populated by snapshot() BEFORE the fetch (the function's own deployment
  note requires that ordering), so any landing by another writer that touched
  the same id between snapshot() and this fetch is silently clobbered by the
  older content — no conflict, no park, no warning. This is distinct from
  tactic-graph-commit-staleness-silent-revert (which is about a real dirty edit
  being misclassified as clean and DROPPED); here a real edit is faithfully
  replayed, but onto a base that has moved past it, so a DIFFERENT writer's
  landed content is reverted. It is also distinct from
  tactic-clear-park-repo-targeting-guard (wrong-repo targeting). Historical
  proof on origin/main: commits 15047ed7 (office_hours park to null) and
  ba5d9848 (null back to park, while carrying a clear-park commit message), both
  authored at 2026-07-25 21:42:40 -0400 on tactic-graph-commit-landing-lock — a
  same-second pair where the second commit reinstates the value the first had
  just cleared, and whose message describes clearing the park it in fact
  restored. The pair is the observable signature of a stale snapshot being
  copied back over a fresher base. Planned 2026-07-30 by the dispatch-pipeline
  bootstrap through a parallel Workflow fan-out rather than an /align-tactics
  round, so that skill's two-sided drift review and its census were bypassed
  (deliberate: ten concurrent align rounds would mean ten concurrent
  graph-commits, the exact hazard the bootstrap exists to avoid). Each plan was
  authored against the node's own cited code and then independently verified by
  a second agent; all reported citation and substance gaps were applied before
  landing. A later /align-tactics round should treat this body as unreviewed by
  the normal path."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
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
phase: qa
execution:
  branch: tactic-graph-commit-intentions-base-stale-restore
  pr: 2989
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix:
    since: 2026-07-30
    attempt: 2
    pushed_sha: 807ea8ca279197e746c449f1945be48edec353b4
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# ensure_intentions_only_base() replays a stale snapshot over a fresher base

## Context

`packages/intentionsutil/scripts/graph-commit` is the only sanctioned way to land
an `intentions/<id>.md` edit on `origin/main`. When it is invoked from a worktree
whose `HEAD` carries non-`intentions/` commits (a PR-branch checkout), a commit
made on top of that HEAD would not be `intentions/`-only, so the `graph/**`
fast-path guard would reject the scratch push and the land would time out. To
avoid that, `ensure_intentions_only_base()` (`graph-commit:496-515`) *rebuilds*
the edit on a fresh `origin/main` base:

1. `git fetch origin main`; `base_sha="$(git rev-parse FETCH_HEAD)"`
   (`graph-commit:497-499`).
2. Return early when the HEAD-side diff names no non-`intentions/` path
   (`graph-commit:502-503`).
3. Otherwise record `ORIG_HEAD`, set `RESTORE_HEAD=1`, and
   `git reset --hard "$base_sha"` (`graph-commit:505-507`).
4. Then, unconditionally, for every id (`graph-commit:508-511`):

```bash
for id in "${IDS[@]}"; do
  cp -- "$SNAP_DIR/$id.md" "$INTENTIONS_DIR/$id.md"
done
```

`SNAP_DIR` is filled by `snapshot()` (`graph-commit:395-403`), called from
`main()` at `graph-commit:1425` — **before** `check_base_freshness()`
(`graph-commit:1427`) and before `ensure_intentions_only_base()`
(`graph-commit:1450`). The function's own deployment note
(`graph-commit:490-495`) mandates that ordering.

### The defect

Step 4 is a whole-file overwrite with no check that the snapshot's content is
still a valid replay onto `base_sha`. Anything that advanced
`intentions/<id>.md` between the snapshot and the fetch is silently reverted.
There is no conflict, no park, and no diagnostic: the resulting commit's parent
*is* the current `origin/main` tip, so `try_land()`'s later
`git pull --rebase origin main` is a no-op and the whole-file content lands as a
clean revert of the other writer's work.

Note the contrast that makes this specific to the rebuilt path: on the in-place
path (no reset, no `cp`) the writer's commit sits on top of the branch HEAD, git
replays it as a *patch* during the rebase, and a real divergence surfaces as a
textual conflict that layers 2/3 handle. The rebuild replaces a patch with a
file copy, and loses exactly that protection.

Two concrete ways this fires, both verified by reading the current code:

**(a) The layer-3 merge result is thrown away — deterministic, no race needed.**
`check_base_freshness()` (`graph-commit:277-327`) runs when the caller passed
`--base`. On a stale base it three-way merges the writer's edit against
`origin/main`'s landed content and writes the merged result to disk at
`graph-commit:315` (`cp -- "$out_f" "$INTENTIONS_DIR/$id.md"`) — but it does
**not** update `SNAP_DIR/$id.md`. If the worktree is also far-ahead,
`ensure_intentions_only_base()` then copies the *pre-merge* snapshot back over
the merged file. The concurrent writer's landed change is reverted, and the
final log line still claims `(layer 2/3 auto-resolved a concurrent-edit
divergence)` (`graph-commit:1485-1487`) — a false claim.

**(b) No `--base` at all — the plain race.** With no `--base`,
`check_base_freshness()` returns immediately (`graph-commit:278`), so nothing
compares the snapshot against anything. Any landing by another writer between
`snapshot()` and step 1's fetch is overwritten by the snapshot's older bytes.

### Historical evidence

On `origin/main`, on `intentions/tactic-graph-commit-landing-lock.md`:

- `15047ed7` — subject `graph: clear office_hours park on
  tactic-graph-commit-landing-lock (...)`, sets `office_hours` to null.
- `ba5d9848` — near-identical subject and body, but its diff **re-adds** the
  `office_hours:` block (reason `origin/main does not merge clean into this
  tactic's branch (provision exit 11)`, since `2026-07-25`).

Verified in this worktree: author dates are `2026-07-25 21:35:02 -0400` and
`21:39:13 -0400`; **both commit dates are `21:42:40 -0400`** — the same second.
(The node's rationale calls `21:42:40` the *author* date; that citation drifted —
it is the commit date, which is what the same-second pairing rests on.) A
commit whose message narrates clearing a park while its content restores one is
the signature of stale content being replayed over a fresher base.

### Intended outcome

`graph-commit` never overwrites landed content it did not merge. Every path that
materializes the writer's snapshot onto a base three-way merges it against the
base the snapshot was derived from, using the existing `run_merge_node()`
primitive, and fails closed into the existing `park_and_exit()` path when the
merge cannot resolve — per `.claude/rules/code-style.md` (clear error over a
silent fallback).

This is the greenfield design and it fits in one PR with no backwards-incompatible
change (exit codes, CLI surface, and the non-far-ahead path are all unchanged), so
no separate migration proposal is needed.

### Explicitly out of scope

- `tactic-graph-commit-staleness-silent-revert` — the *invoking* writer's own
  dirty edit misclassified as clean and dropped. Different failure.
- `tactic-clear-park-repo-targeting-guard` — wrong-checkout targeting.
- Any change to `merge-node.ts` or `mergeIntentionNodes` (the merge primitive
  itself is correct and covered by
  `packages/intentionsutil/test/node-merge.test.ts`).
- The landing lock (`refs/graph/landing-lock`): it serializes the
  rebase-stamp-push critical section only, and `snapshot()` runs long before it,
  so it does not and cannot close this window. Do not touch it.

---

## Unit 1 — Keep `SNAP_DIR` authoritative after a layer-3 merge

**Recommended model**: `sonnet`

Mechanical one-line fix plus one harness case with an explicit assertion — the
diff shape is fully determined by the plan.

**Scope**

`packages/intentionsutil/scripts/graph-commit`, function `check_base_freshness()`
(`graph-commit:277-327`). At the fully-resolved branch — currently:

```bash
    if run_merge_node "$id" "$base_f" "$INTENTIONS_DIR/$id.md" "$theirs_f" "$out_f"; then
      # Fully resolved: ...
      cp -- "$out_f" "$INTENTIONS_DIR/$id.md"
      continue
    fi
```

(`graph-commit:311-317`, the `cp` is at `graph-commit:315`) — also refresh the
snapshot so `SNAP_DIR/$id.md` holds the *merged* content:

```bash
      cp -- "$out_f" "$INTENTIONS_DIR/$id.md"
      # Keep SNAP_DIR authoritative: it is the content ensure_intentions_only_base()
      # replays onto the fresh base, and the content park_write() points a human at.
      # Leaving the pre-merge snapshot here would let the far-ahead rebuild copy the
      # unmerged bytes back over this merge and silently revert the other writer.
      cp -- "$out_f" "$SNAP_DIR/$id.md"
```

Invariant to state in the comment: **`SNAP_DIR/<id>.md` always holds the content
this invocation currently intends to land for `<id>`.**

Also add the new harness case described below to
`packages/intentionsutil/scripts/test-graph-commit.sh`.

Out of scope for this unit: `ensure_intentions_only_base()` itself, the
no-`--base` race (Unit 2), and the `PRUNE_IDS` loop.

**Reuse**

- `packages/intentionsutil/scripts/test-graph-commit.sh` — the bare-origin +
  multi-clone functional harness. Copy the shape of **case 21**
  (`test-graph-commit.sh:896-918`, layer-3 disjoint-field resolve) and **case 16**
  (`test-graph-commit.sh:775-801`, far-ahead worktree) and combine them.
- Harness helpers, all already defined: `make_clone`
  (`test-graph-commit.sh:204-208`), `seed_field_node`
  (`test-graph-commit.sh:179-193`), `edit_field`
  (`test-graph-commit.sh:444-446`), `origin_show` (`:438`), `set_mode` (`:436`),
  `run_gc` (`:450-466`), `ok`/`no` (`:128-129`).

**New harness case — "far-ahead + stale `--base`: the layer-3 merge survives the rebuild"**

Add a `seed_field_node` fixture next to the existing ones at
`test-graph-commit.sh:194-197`:

```bash
seed_field_node t-farahead-base "fieldA: base" "fieldB: base"
```

Add the case just before the `# --- No scratch branches left behind anywhere`
block at `test-graph-commit.sh:1202`, and add a matching one-line entry to the
numbered case list in the file header (`test-graph-commit.sh:13-109`). Shape:

1. `set_mode green`; `make_clone` a fresh clone `Wfab` and record
   `fab_sha="$(git -C "$Wfab" hash-object intentions/t-farahead-base.md)"`.
2. Make it far-ahead: write a file under `src/`, `git add` + `git commit` it in
   `Wfab`, record `fab_tip="$(git -C "$Wfab" rev-parse HEAD)"` (mirrors
   `test-graph-commit.sh:784-788`).
3. Writer's edit: `edit_field "$Wfab" t-farahead-base fieldA farahead-edit`.
4. Concurrent landing: `make_clone` an `other` clone,
   `edit_field ... fieldB concurrent-edit`, `git commit -qam` + `git push -q origin main`
   (mirrors `test-graph-commit.sh:904-908`).
5. `run_gc "$Wfab" -m 'test: far-ahead stale base' --base "t-farahead-base=$fab_sha" t-farahead-base`.
6. Assert: `rc == 0`; `origin_show t-farahead-base` contains **both**
   `fieldA: farahead-edit` **and** `fieldB: concurrent-edit`; `src/` file absent
   from `git -C "$ORIGIN" ls-tree -r --name-only main`; and
   `git -C "$Wfab" rev-parse HEAD` equals `fab_tip`.

Before the fix this case fails on `fieldB: concurrent-edit` (main shows
`fieldB: base` — the concurrent writer's landed value reverted). Confirm that
red-then-green transition by running the harness once with the `graph-commit`
change reverted.

Do not weaken existing case 22 (`test-graph-commit.sh:920-950`), which asserts
`SNAP_DIR` still holds the writer's original value for an **unresolved** id: the
new `cp` runs only on the resolved branch, so that id's snapshot is untouched and
case 22 must keep passing unchanged.

---

## Unit 2 — Replay the snapshot onto the fresh base via a three-way merge

**Recommended model**: `opus`

Concurrency and ordering, a rewritten function on the fail-closed path, and
judgment about which base to merge against.

**Dependencies**

Unit 1 must land first. Unit 2 treats `SNAP_DIR/<id>.md` as "the content this
invocation intends to land" (`ours`); without Unit 1 that is false for any id
layer 3 already merged, and Unit 2's merge would re-derive it against a base that
no longer describes it.

**Scope**

`packages/intentionsutil/scripts/graph-commit` only (plus new harness cases).
Three changes:

**2a. One fetch, one `MAIN_SHA`.** Today `origin/main` is fetched twice with two
independently-read `FETCH_HEAD`s — `check_base_freshness()` at
`graph-commit:280` and `ensure_intentions_only_base()` at `graph-commit:497` —
and `main()` reads `FETCH_HEAD` a third time at `graph-commit:1470-1471`. Hoist
the fetch into `main()` and pin the sha:

- Declare a global `MAIN_SHA=""` near `ORIG_HEAD`/`RESTORE_HEAD`
  (`graph-commit:175-183`), with a comment: the single `origin/main` tip every
  pre-land step reconciles against.
- In `main()`, between `assert_clean_outside_ids` (`graph-commit:1413`) and
  `snapshot` (`graph-commit:1425`), add `git fetch origin main >&2` and
  `MAIN_SHA="$(git rev-parse FETCH_HEAD)"`.
- Replace `FETCH_HEAD` with `"$MAIN_SHA"` at `graph-commit:285`, `:286`, `:309`
  (inside `check_base_freshness`), at `:499` (which then becomes
  `base_sha="$MAIN_SHA"`), and at `:1470-1471`. Delete the two now-redundant
  `git fetch origin main` lines (`:280`, `:497`). Update the comment at
  `graph-commit:1465-1467`, which currently says FETCH_HEAD was "populated by
  ensure_intentions_only_base()'s fetch above (do NOT fetch again)".
- Leave `park_and_exit()`'s own `git fetch origin main` + `git reset --hard
  FETCH_HEAD` (`graph-commit:1179-1180`) alone — it deliberately re-reads the
  freshest main on the park path.

**2b. Replace the unconditional `cp` loop with a guarded replay.** In
`ensure_intentions_only_base()` (`graph-commit:496-515`):

- Compute the fork point **before** the reset (HEAD moves):
  `fork_sha="$(git merge-base HEAD "$MAIN_SHA")"`, and `die` with a descriptive
  message if that fails (no fallback). Place it after the `RESTORE_HEAD=1` line
  and before `git reset --hard`.
- For each id in `IDS`, resolve two blob shas using the idiom already in
  `check_base_freshness` (`graph-commit:285-289`): `git cat-file -e
  "<sha>:intentions/<id>.md"` to test existence, then `git rev-parse` to read it.
  - `fork_blob` = the blob at `fork_sha` — the content the writer's edit was
    derived from.
  - `main_blob` = the blob at `MAIN_SHA` — what the reset just put on disk.
- **Fast path**: `fork_blob == main_blob` (including both absent) means
  `origin/main` has not touched the node since the fork point, so the snapshot is
  still a valid replay → keep today's plain `cp -- "$SNAP_DIR/$id.md"
  "$INTENTIONS_DIR/$id.md"`. This keeps existing cases 16/18 on a merge-free path
  (no `npx` invocation).
- **Divergent path**: `fork_blob != main_blob` → three-way merge via
  `run_merge_node "<id>" "<base_f>" "$SNAP_DIR/<id>.md" "<theirs_f>" "<out_f>"`
  (`graph-commit:441-466`), where `base_f` is `fork_blob`'s content written to a
  tempfile under `SNAP_DIR` and `theirs_f` is `main_blob`'s. Pass the **empty
  string** for a side whose blob is absent — `merge-node.ts` documents and
  handles empty `--base` / `--theirs` explicitly
  (`packages/intentionsutil/scripts/merge-node.ts:53-81`), and
  `stage_file_or_empty` (`graph-commit:718-726`) is the existing precedent for
  that convention.
  - Merge resolves → `cp -- "$out_f" "$INTENTIONS_DIR/<id>.md"` **and**
    `cp -- "$out_f" "$SNAP_DIR/<id>.md"` (Unit 1's invariant).
    `run_merge_node()` already sets `RESOLVED_VIA_MERGE=1`, so the landed log
    line picks up its existing "auto-resolved" suffix
    (`graph-commit:1485-1487`) — that is now accurate rather than false.
  - Merge does not resolve → `run_merge_node()` has already recorded the
    unresolved fields in `CONFLICT_FIELDS_JSON`; set a local flag and keep
    looping so the eventual park names every id (same pattern as
    `check_base_freshness`'s `STALE_BASE_UNRESOLVED`, `graph-commit:318-326`).
- **`PRUNE_IDS` loop** (`graph-commit:512-514`): a deletion has nothing to merge,
  and blindly `rm -f`-ing a node another writer just edited destroys that edit
  the same way. Guard it: when `main_blob` is non-empty **and** differs from
  `fork_blob`, record the existing prune sentinel and mark unresolved —
  `append_conflicts "$(jq -cn --arg id "$id" '[{id: $id, note: "prune vs. concurrent edit"}]')"`,
  copied verbatim from layer 2's handling at `graph-commit:669-673`. Otherwise
  (`main_blob` equal to `fork_blob`, or absent because main already deleted it)
  keep the plain `rm -f`.
- After both loops, if the unresolved flag is set, call `park_and_exit`
  (`graph-commit:1156-1194`) — it never returns. `ORIG_HEAD`/`RESTORE_HEAD` are
  already set by this point, so `cleanup()` (`graph-commit:343-345`) still
  restores the worktree to its PR tip on this new park path. Do not reorder the
  `RESTORE_HEAD=1` assignment relative to the park call.

Prefer extracting the per-id replay into a small helper (e.g.
`replay_snapshot_onto_base <id> <fork_sha> <main_sha>` returning 0/1) so the
function body stays readable; keep all tempfiles under `SNAP_DIR` so
`cleanup()` removes them.

**2c. Update the function's header comment** (`graph-commit:468-495`) to state
the new contract: the rebuild is a three-way replay, not a copy; its base is the
merge-base of HEAD and `MAIN_SHA`; an unresolvable divergence parks instead of
overwriting. Keep the existing deployment note about `git reset --hard` needing
`dangerouslyDisableSandbox` (`graph-commit:490-495`) — it is still true.

Out of scope: `merge-node.ts`; the in-place (non-far-ahead) path, which is
already protected by `try_land()`'s rebase and layer 2; `park_and_exit()`'s
internals; the landing lock.

**Reuse**

- `run_merge_node()` — `packages/intentionsutil/scripts/graph-commit:441-466`.
  Never dies; records conflicts and returns 1.
- `park_and_exit()` — `graph-commit:1156-1194`. Self-contained: does its own
  fetch/reset/park_write/commit/land and always `exit 1`.
- `append_conflicts()` / `init_conflict_fields()` — `graph-commit:413-428`.
- `is_prune_id()` — `graph-commit:635-641`.
- `stage_file_or_empty()` — `graph-commit:718-726`, the precedent for
  "missing side ⇒ empty-string argument".
- The blob-existence idiom in `check_base_freshness` — `graph-commit:285-289`.
- `packages/intentionsutil/scripts/merge-node.ts:45-97` for the CLI contract.

**New harness cases** (append before `test-graph-commit.sh:1202`, add matching
entries to the header list at `:13-109`, add fixtures next to `:194-197`):

1. **far-ahead, no `--base`, disjoint field → both edits land.** Fixture
   `seed_field_node t-farahead-race "fieldA: base" "fieldB: base"`. Fresh clone,
   far-ahead code commit, `edit_field ... fieldA writer-edit`; a separate `other`
   clone lands `fieldB: concurrent-edit` directly on origin; then
   `run_gc <clone> -m 'test: far-ahead race' t-farahead-race` with **no
   `--base`**. Assert `rc == 0`, main holds both `fieldA: writer-edit` and
   `fieldB: concurrent-edit`, the `src/` file is absent from main, and HEAD is
   restored to the recorded far tip. Pre-fix this lands `fieldB: base` — the
   silent revert this node is about.
2. **far-ahead, no `--base`, same field → park.** Fixture
   `seed_field_node t-farahead-race-conflict "sentinel: base"`. Same setup, both
   sides set `sentinel` to different values. Assert `rc == 1`; `origin_show`
   contains `mechanical-unresolved` and both values; and HEAD is restored to the
   far tip (this is the new park-from-a-far-ahead-worktree path — assert the
   restore explicitly). Capture the `preserved at <dir>` path from the output with
   the `sed` idiom at `test-graph-commit.sh:885-886` / `:938-939` and push it onto
   `SNAP_DIRS_TO_CLEAN` (declared at `test-graph-commit.sh:121-125`) so the
   harness cleans up the kept snapshot dir.
3. **far-ahead `--prune` racing a concurrent edit → park, node survives.**
   Fixture `seed_node t-farahead-prune-race` (add the id to the loop at
   `test-graph-commit.sh:163-169`). Far-ahead clone deletes the file and passes
   `--prune`; an `other` clone lands an edit to the same node first. Assert
   `rc == 1`, the node is **still present** on main carrying the concurrent
   edit, and HEAD is restored. Case 17 (`test-graph-commit.sh:803-828`) shows the
   assertions available for a prune park.

Do not write a case for "node exists at the fork point but is absent on
`origin/main`" (a concurrent prune racing this writer's edit): the real
`merge-node.ts` treats that as a delete/modify conflict
(`merge-node.ts:66-77`), but the harness's `npx` shim
(`test-graph-commit.sh:337-341`) resolves empty-`theirs` in favor of `ours`, so
a test there would assert shim behavior, not product behavior. Note the
divergence in a comment instead.

---

## Verification

Run the full functional harness — it is the only place this code path is
exercised end-to-end, and it is what CI runs
(`.github/workflows/unit-tests.yml:211`). It needs only `bash`, `git`, and `jq`;
no network, no real `gh`/`node`.

```verify
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && packages/intentionsutil/scripts/test-graph-commit.sh
```

The harness prints `passed: N  failed: 0` and exits 0. Every pre-existing case
must keep passing — in particular cases 12/13 (`--base` fresh/stale), 16 and 18
(far-ahead edit and prune), 21 and 22 (layer 3 resolve / unresolved), and 27/28
(the fail-loud mis-pointed-`-C` guard, which reads the sha Unit 2 renames to
`MAIN_SHA`).

No-regression check on the TypeScript side (nothing in this change touches TS;
this guards against an accidental edit to `merge-node.ts` or the store):

```verify
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && npx vitest run --project packages/intentionsutil --root .
```

The prose/shell linter, because the new test code lands in a committed `.sh`
file and net-new added lines are mechanically checked (e.g. the
`echo "$JSON" | jq` ban from `.claude/rules/shell-json.md`):

```verify
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && .claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual, judgment-based checks the commands above do not cover:

- **Prove each new case is a real regression test.** For every new case, stash
  the `graph-commit` change (keeping the harness change), re-run the harness, and
  confirm that case reports `FAIL` with the expected wrong content (`fieldB: base`
  for the two disjoint-field cases; the node absent from main for the prune case).
  A new case that passes against unfixed code is testing nothing.
- **Confirm the fast path stays merge-free.** Existing far-ahead cases 16 and 18
  must not invoke the `npx` merge shim. Check by eye that `fork_blob == main_blob`
  holds for them (neither node is touched on main between clone and run), or add a
  temporary `>&2` trace during development and remove it before committing.
- **Read the final log line for honesty.** On the Unit-1 case the run must print
  the `landed ... (layer 2/3 auto-resolved a concurrent-edit divergence)` suffix
  *and* actually carry both writers' values — the pre-fix build printed that
  suffix while reverting one of them.
- **Do not weaken any assertion to make the suite green.** If an existing case
  fails after Unit 2, the `MAIN_SHA` hoist or the replay logic is wrong; fix the
  script (`.claude/rules/test-integrity.md`).
