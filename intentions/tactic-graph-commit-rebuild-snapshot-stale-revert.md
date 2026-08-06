---
id: tactic-graph-commit-rebuild-snapshot-stale-revert
kind: tactic
statement: graph-commit's far-ahead rebuild path re-materializes each node from
  the writer's on-disk snapshot AFTER resetting the tree to fresh origin/main,
  so a writer whose checkout holds a stale intentions/<id>.md lands that stale
  content wholesale as a conflict-free commit on top of origin/main — silently
  reverting every edit landed in between; the phase writers
  demote-node-to-implement and apply-node-transition.ts are the unprotected
  callers because, unlike park-node and clear-park, they pass no --base
  compare-and-swap
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-28 while auditing residual risk after re-planning
  tactic-node-ancestry-context. A demotion had nearly been written from a main
  checkout three commits behind origin/main, and the initial diagnosis — that
  this would silently clobber the just-landed plan update — was WRONG for the
  in-place path and was corrected by direct reproduction: committing a
  frontmatter demotion on the stale base and rebasing onto the newer origin/main
  produced a loud textual CONFLICT, not a silent revert, because graph-commit
  lands via `git pull --rebase origin main` and a rebase replays the commit
  DIFF. Content the stale writer never saw is absent from both sides of that
  diff, so it survives. That is the protection, and it holds for every caller on
  the in-place path. The genuine defect is the OTHER path:
  ensure_intentions_only_base()
  (packages/intentionsutil/scripts/graph-commit:496) fires when the worktree is
  ahead of origin/main with non-intentions changes — i.e. any PR-branch
  worktree, the normal home of a phase worker — and it is CONTENT-based, not
  diff-based: `git reset --hard $base_sha` to fresh origin/main, then `cp --
  \"$SNAP_DIR/$id.md\" \"$INTENTIONS_DIR/$id.md\"` per id. SNAP_DIR was filled
  by snapshot() (graph-commit:395) from whatever the writer's checkout held. If
  that checkout's copy of the node is stale, the stale blob is laid directly
  over origin/main's fresh one and committed. There is no rebase and therefore
  no conflict: the commit sits on fresh origin/main and its diff IS the revert.
  Reachability is not exotic — provision-node-worktree merges origin/main at
  provisioning (provision-node-worktree:126), but origin/main keeps moving
  during a session, so any node edit landed after that merge is stale in the
  worker's tree the moment the worker calls a graph write for it. On 2026-07-28
  the tactic-node-ancestry-context worktree sat 95 commits behind origin/main; a
  transition written from it would have reverted the plan update landed minutes
  earlier. Filed separately from three related nodes:
  tactic-graph-commit-staleness-silent-revert (phase done, PR #2978) fixed the
  caller-side missing -C in clear-park/resolve-park and explicitly dispositioned
  the silent-revert shape as 'the same family' with 'no race found in
  graph-commit staleness detection' — correct about the race, but it did not
  reach this content-based rebuild path, and the phase writers it never examined
  still pass no --base; tactic-graph-commit-cwd-repo-resolution is the
  wrong-repo fix inside graph-commit; tactic-graph-commit-landing-lock is
  contention serialization. Planned 2026-07-30 by the dispatch-pipeline
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
clarifications:
  - question: Is the implicit merge-base compare-and-swap the right default for
      graph-commit's rebuild path, given it trades silent-revert-if-stale for
      more frequent visible parking (and a --prune against a concurrently edited
      node always parks)?
    answer: "(Ruled 2026-08-05, author office-hours sign-off, Ruling 36.) ACCEPT as
      shipped — the implicit merge-base CAS is the right default, no code
      change, park cleared. Trading a silent stale-revert for a loud park is the
      direction .claude/rules/code-style.md already points (clear error over
      silent fallback), which is the same convention the two Sonnet skeptics
      cited when they argued this was decidable without the author; the
      fix-planner was right to leave the call standing, and the call is now
      made. The --base skip carve-out stays as-is: check_base_freshness has
      already verified and reconciled those ids, and test-graph-commit.sh case
      40 together with test-transition-node.sh Case 1 both depend on that
      carve-out remaining in place, so narrowing it is not a local edit. The
      always-park --prune branch was considered in the same sitting and accepted
      rather than narrowed — a deletion has no content to merge, so parking is
      the only honest outcome. Interlock preserved — this node's Unit 1a is the
      same one-line fix as tactic-graph-commit-intentions-base-stale-restore's
      Unit 1, and this node's CAS depends on it: the two land together or not at
      all."
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
  tier: 1
phase: main-qa
execution:
  branch: tactic-graph-commit-rebuild-snapshot-stale-revert
  pr: 2990
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-05T21:47:35Z
    mergeCommitSha: 156ce3a18929dd0c85f80db6be4f35c32ad45a7d
    graphCommitSha: null
validates: []
blocked_by:
  - tactic-graph-commit-intentions-base-stale-restore
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Stale-checkout writes silently revert origin/main through graph-commit's rebuild path

## Context

`packages/intentionsutil/scripts/graph-commit` has two ways to reach a commit on
`origin/main`, and they have opposite safety properties.

**In-place path (safe).** `try_land()` lands via `git pull --rebase origin main`.
A rebase replays the commit's *diff*. Content a stale writer never saw appears on
neither side of that diff, so it survives untouched; where the hunks overlap, git
raises a textual conflict that routes into the layer-2 field merge or a
fail-closed park. Either way the failure is loud. This was verified by direct
reproduction on 2026-07-28 (a frontmatter demotion committed on a base three
commits stale, rebased onto a newer `origin/main`, produced a textual CONFLICT —
not a silent revert).

**Rebuild path (broken).** `ensure_intentions_only_base()`
(`packages/intentionsutil/scripts/graph-commit:496`) fires when the worktree HEAD
is ahead of `origin/main` with non-`intentions/` changes — that is, any PR-branch
worktree, which is where phase workers normally run. It exists for a good reason:
the `graph/**` fast-path CI guard rejects a scratch push whose diff names any path
outside `intentions/`, so the edit must be rebuilt on an intentions-only base. But
it rebuilds by **content**, not by diff:

```
git reset --hard "$base_sha"                       # graph-commit:507 — tree := fresh origin/main
cp -- "$SNAP_DIR/$id.md" "$INTENTIONS_DIR/$id.md"  # graph-commit:510 — overwrite with the snapshot
```

`SNAP_DIR` was filled by `snapshot()` (`graph-commit:395-403`) with
`cp -- "$INTENTIONS_DIR/$id.md" "$SNAP_DIR/$id.md"` — whatever the writer's
checkout happened to hold. When that checkout's copy of the node is stale, the
stale blob is laid directly over `origin/main`'s fresh one and committed. The
commit sits on fresh `origin/main`, so there is no rebase, no conflict, and no
warning: **the resulting diff is the revert** of everything landed in between.

Reachability is ordinary, not exotic.
`.claude/skills/dispatch-propagate/scripts/provision-node-worktree:126` merges
`origin/main` into the branch at provisioning, but `origin/main` keeps moving for
as long as the session runs, so any node edit landed after that merge is stale in
the worker's tree the moment the worker calls a graph write for that node. On
2026-07-28 the `tactic-node-ancestry-context` worktree stood 95 commits behind
`origin/main`.

There is a second, related defect on the same path, found while planning this fix:
`check_base_freshness()` (`graph-commit:277-327`) reconciles a stale `--base`
through `run_merge_node()` and writes the merged result to the working file only
(`cp -- "$out_f" "$INTENTIONS_DIR/$id.md"`, `graph-commit:315`). It does **not**
update `$SNAP_DIR/$id.md`. Because `main()` runs `snapshot` (`graph-commit:1425`)
before `check_base_freshness` (`graph-commit:1427`) and
`ensure_intentions_only_base` (`graph-commit:1450`) afterwards, the rebuild path
then copies the **pre-merge** snapshot over the reset tree — silently discarding
the reconciliation and landing exactly the revert the reconciliation prevented.
This affects `--base` callers too, in the window where a concurrent land happens
between the caller's read and `graph-commit`'s fetch.

Intended outcome: the rebuild path never lands a revert silently. It either
reconciles the divergence through the existing structural three-way merge, or it
parks loudly through the existing fail-closed park — matching the project's
preference for clear errors over silent fallbacks. This protects **every** caller,
including future ones that forget `--base`. Separately, the last phase writer with
no compare-and-swap (`demote-node-to-implement`) adopts the refresh + `--base`
pattern its siblings already use.

### Citation drift found while planning (correct these assumptions)

- The node's table claiming `apply-node-transition.ts` passes no `--base` has
  **drifted and is now wrong**. `apply-node-transition.ts` is git-blind by design;
  its only wrapper, `.claude/skills/dispatch-propagate/scripts/transition-node`,
  now fetches and refreshes the local node file from `origin/main` before any read
  (lines 91-102) and passes `--base "$NODE_ID=$FRESH_BLOB"` at the land (line 209).
  That was landed by `tactic-graph-write-recipes-base-cas` (phase `done`), and
  `packages/intentionsutil/scripts/test-transition-node.sh` Case 1 covers it.
  **The only remaining unprotected phase writer is `demote-node-to-implement`**
  (`packages/intentionsutil/scripts/demote-node-to-implement:115` calls
  `graph-commit -C "$REPO_ROOT" -m "$MSG" "$NODE_ID"` with no `--base`, and the
  script never fetches or refreshes the local file — see lines 68-69
  "Unlike park-node, this script has no prior fetch step").
- All other citations were verified accurate against the current tree:
  `graph-commit:496` (`ensure_intentions_only_base`), `graph-commit:395`
  (`snapshot`), `graph-commit:277` (`check_base_freshness`),
  `provision-node-worktree:126` (the `git merge --no-edit origin/main`), and the
  fail-loud guard near `graph-commit:1473-1474` (the `if [[ "$local_blob" !=
  "$main_blob" ]]` and its `die`). The worktree copy of `graph-commit` is
  byte-identical to `origin/main`'s.
- `graph-commit` runs under `set -euo pipefail` (`graph-commit:86`), so every
  `git rev-parse` that may legitimately fail must be written
  `... 2>/dev/null || true`, as the existing code does at `graph-commit:1470-1471`.
  `demote-node-to-implement` and `transition-node` use `set -uo pipefail` (no `-e`).

## Unit 1 - Make graph-commit's rebuild path compare-and-swap instead of overwrite

**Recommended model**: `opus`

This is ordering-sensitive work in an unfamiliar concurrency-critical script, and
the plan deliberately leaves one judgment call (see "Judgment left to the
implementer") to implementation time.

### Scope

All changes in `packages/intentionsutil/scripts/graph-commit`, plus new cases in
`packages/intentionsutil/scripts/test-graph-commit.sh`.

**1a. Keep the snapshot in sync with a layer-3 reconciliation.**
At `graph-commit:315`, `check_base_freshness()` copies a fully-merged node to
`"$INTENTIONS_DIR/$id.md"`. Also copy it to `"$SNAP_DIR/$id.md"` in the same
place, so a later `ensure_intentions_only_base()` re-materializes the *merged*
content rather than the pre-merge content. Update the comment at
`graph-commit:312-314` and the `snapshot()` header comment
(`graph-commit:388-394`) to say that `SNAP_DIR` holds the content this run intends
to land, refreshed whenever a layer-3 merge resolves — not a frozen pre-merge
copy. Note in the comment that `park_and_exit()`'s "preserved at $SNAP_DIR"
message (`graph-commit:1164`) therefore points at the reconciled content, which is
what the writer intends to land and is strictly more useful for a manual merge.

**1b. Guard the content-based rebuild with an implicit compare-and-swap.**
In `ensure_intentions_only_base()` (`graph-commit:496-515`), after the
`[[ -z "$nonint" ]] && return 0` early return at `graph-commit:503` (so the
in-place path is untouched) and before the `git reset --hard "$base_sha"` at
`graph-commit:507`:

1. Move the `ORIG_HEAD="$(git rev-parse HEAD)"` / `RESTORE_HEAD=1` assignments
   (`graph-commit:505-506`) **above** the new check. Any park taken from inside
   this function reaches `park_and_exit()`, which runs its own
   `git reset --hard FETCH_HEAD` (`graph-commit:1180`); without `RESTORE_HEAD=1`
   already set, `cleanup()` (`graph-commit:343-345`) would leave the worker's
   worktree parked on `origin/main` instead of its PR tip. Setting
   `RESTORE_HEAD=1` before a reset that then never happens is harmless — the
   restore is a no-op when HEAD has not moved.
2. Compute the implicit base commit once:
   `mb="$(git merge-base "$base_sha" HEAD)"` — `die` with a clear message if it
   fails (unrelated histories are a broken environment, not a fallback case).
   This is the same three-dot merge-base semantics the existing
   `git diff --name-only "$base_sha"...HEAD` at `graph-commit:502` already uses.
   The blob at `mb` is the version of the node the writer's branch actually
   started from, and it stays correct both when the writer's edit is uncommitted
   and when a prior partial run already committed it locally.
3. For each `id` in `"${IDS[@]}"`:
   - **Skip the id entirely when `${BASE[$id]:-}` is non-empty.** For those,
     `check_base_freshness()` has already verified or reconciled the caller's
     declared base against `origin/main`, and 1a keeps the snapshot in sync. The
     caller's explicit assertion supersedes the merge-base heuristic. This skip is
     load-bearing for existing coverage: `test-transition-node.sh` Case 1 drives a
     far-ahead, never-synced worktree whose merge-base blob legitimately differs
     from `origin/main` while its snapshot is already fresh (transition-node
     refreshed it), and that harness's `npx` shim makes `merge-node.ts` always
     fail — without the skip, Case 1 would park and the test would fail.
   - Otherwise compute
     `snap_base="$(git rev-parse "$mb:intentions/$id.md" 2>/dev/null || true)"` and
     `origin_blob="$(git rev-parse "$base_sha:intentions/$id.md" 2>/dev/null || true)"`.
     If they are equal (including both empty), the `cp` is safe — continue.
   - If they differ, the snapshot is built on a base that `origin/main` has moved
     past. Reconcile through the existing `run_merge_node()` (`graph-commit:441`),
     with the same plain-file base/ours/theirs mapping `check_base_freshness()`
     uses (`graph-commit:293-311`) — there is no rebase-stage inversion here:
     - base: `git cat-file -p "$snap_base" > "$SNAP_DIR/.rebuild-base-$id"`, or the
       empty string when `snap_base` is empty (id created concurrently);
     - ours: `"$SNAP_DIR/$id.md"` — the writer's captured content, **not**
       `$INTENTIONS_DIR`, so this stays correct regardless of reset ordering;
     - theirs: `git show "$base_sha:intentions/$id.md" > "$SNAP_DIR/.rebuild-theirs-$id"`,
       or the empty string when `origin_blob` is empty (id pruned on `origin/main`);
     - out: `"$SNAP_DIR/.rebuild-out-$id"`.
     On success (`run_merge_node` returns 0) copy the merged output over
     `"$SNAP_DIR/$id.md"` so the existing `cp` loop lays down the reconciled
     content. On failure, `run_merge_node()` has already appended the unresolved
     fields to `CONFLICT_FIELDS_JSON`; record the divergence and keep checking the
     remaining ids so the eventual park names them all — exactly the loop shape at
     `graph-commit:318-322`.
   - Run all git object reads before the `git reset --hard`; they read from the
     object database, not the worktree, so they are order-independent, and keeping
     the tree untouched until the decision is made means a park starts from a
     clean tree.
4. For each `id` in `"${PRUNE_IDS[@]}"`: apply the same
   `snap_base` vs `origin_blob` comparison. A prune has no content to merge, so a
   divergence is unresolvable by construction (it is the delete-vs-edit collision
   that the in-place path surfaces as a rebase conflict — covered today by
   `test-graph-commit.sh` Case 17). Append a sentinel entry via
   `append_conflicts()` (`graph-commit:422`) naming the id and the reason, and
   record the divergence. `park_write()` already gives prune ids their own
   recommendation text ("prune, no content snapshot"), so nothing else is needed.
5. After both loops, if any divergence went unresolved, call `park_and_exit()`
   (`graph-commit:1156`) — it never returns and always exits 1. Its header comment
   already documents a "Unit 3, before any commit exists" call site and it does its
   own fetch/reset, so it is safe from here; extend that comment to name this third
   call site.

**Out of scope for Unit 1:**

- The in-place path (`try_land()` / `git pull --rebase origin main`). Its rebase
  protection is established and sufficient; do not add an implicit base check
  there. The two paths need different mechanisms precisely because only one of
  them replays a diff.
- Changing `check_base_freshness()`'s semantics beyond the one-line snapshot sync
  in 1a. Do not make `--base` mandatory, and do not synthesize a `--base` entry
  for callers that passed none — the skip in 1b step 3 depends on `BASE` meaning
  exactly "the caller declared a base".
- `merge-node.ts`, `packages/intentionsutil/src/node-merge.ts`, and the schema.
  `mergeIntentionNodes` already merges the markdown body as a synthetic scalar
  pseudo-field (`packages/intentionsutil/src/node-merge.ts:220-229`), so a stale
  writer whose body equals the base yields to `origin/main`'s landed body, and a
  genuine both-sides body edit becomes a conflict and parks. That is the desired
  behavior; do not change it.
- Any caller script (that is Unit 2).

### Reuse

- `run_merge_node()` — `packages/intentionsutil/scripts/graph-commit:441-466`.
  Handles the crash-vs-unresolved distinction and the `CONFLICT_FIELDS_JSON`
  bookkeeping; never dies.
- `append_conflicts()` / `init_conflict_fields()` —
  `packages/intentionsutil/scripts/graph-commit:413-428`.
- `park_and_exit()` — `packages/intentionsutil/scripts/graph-commit:1156-1195`.
  Self-contained: own fetch, own `reset --hard`, `park_write`, re-commit, land,
  `exit 1`.
- The base/ours/theirs mapping and its comment block —
  `packages/intentionsutil/scripts/graph-commit:292-322` — copy the shape rather
  than inventing a new one.
- `cleanup()`'s `RESTORE_HEAD` mechanism —
  `packages/intentionsutil/scripts/graph-commit:343-345`.

### Tests (part of this unit)

Add cases to `packages/intentionsutil/scripts/test-graph-commit.sh`, following its
existing house style: seed the ids in the `for id in ...` list at
`test-graph-commit.sh:163-169` (line-based `seed_node`) or via `seed_field_node`
(`test-graph-commit.sh:179-197`) for field-merge cases; use `make_clone`,
`sync_clone`, `edit_line` / `edit_field`, `origin_show`, `origin_sha`, `run_gc`,
`ok` / `no`. Case 16 (`test-graph-commit.sh:775-801`) is the template for building
a far-ahead PR-branch clone (add a `src/feature.js` commit, capture `far_tip`).
The harness's `npx` shim already emulates `merge-node.ts` with a real simplified
three-way merge (`test-graph-commit.sh:320-407`), so the new merge path is
genuinely exercised. Add the case-number entries to the header index at
`test-graph-commit.sh:50-60`.

Required new cases:

1. **Far-ahead + stale node, non-overlapping change — reconciles, does not
   revert.** Writer A (synced) lands an edit to field/line X of a node. Writer B is
   a far-ahead PR-branch clone that never synced and edits a *different*
   field/line Y of the same node, then runs `graph-commit` with **no** `--base`.
   Assert: exit 0, and `origin_show` contains **both** A's landed change and B's
   change. Before the fix this test fails because A's change is gone.
2. **Far-ahead + stale node, overlapping change — parks, does not revert.** Same
   setup but B edits the *same* field/line A landed. Assert: non-zero exit, A's
   content still on `origin/main`, `office_hours` present in the landed node, and
   B's content preserved in the kept `SNAP_DIR` (mirror the `preserved at` /
   `SNAP_DIRS_TO_CLEAN` extraction at `test-graph-commit.sh:517-518`).
3. **Far-ahead + fresh node — unchanged behavior.** A far-ahead clone whose node
   copy matches `origin/main` at the merge-base: exit 0, edit lands, no merge
   attempted, HEAD restored to the PR tip. Existing Case 16 already covers most of
   this; add an explicit assertion that no park/merge message appeared if it is not
   already implied.
4. **Far-ahead `--prune` of a concurrently-edited node parks.** Writer A lands an
   edit; far-ahead writer B prunes the same id with no `--base`. Assert non-zero
   exit and that the node still exists on `origin/main`. Case 18
   (`test-graph-commit.sh:830-847`) is the template for the far-ahead prune setup.
5. **`--base` caller on the rebuild path keeps its reconciled content (1a).** A
   far-ahead clone passes `--base <id>=<the blob it read>` while `origin/main` has
   since advanced that node non-overlappingly. Assert exit 0 and that **both** the
   concurrently-landed change and the caller's change are on `origin/main`. Before
   1a this fails: `check_base_freshness` merges, then the rebuild copies the
   pre-merge snapshot over it.

Existing cases 16, 17, 18, 27 and 28 must stay green; they were checked while
planning and the design above does not disturb them (their merge-base blobs equal
`origin/main`'s), but re-verify rather than assume.

### Judgment left to the implementer

Whether the prune divergence (step 4) should park via `park_and_exit()` or `die`
outright. Parking is recommended for consistency with the in-place path's
delete-vs-edit outcome (Case 17), but if `park_write()` proves awkward for a
pure-prune invocation with no ordinary ids, a clear `die` naming the id, the
merge-base blob and the `origin/main` blob is an acceptable fallback — it is still
loud, which is the requirement. Do not silently proceed.

## Unit 2 - Give demote-node-to-implement the refresh + `--base` its siblings have

**Recommended model**: `sonnet`

Mechanical: mirror an established in-repo pattern in one small script, plus a test
harness copied in shape from an existing one.

### Scope

`packages/intentionsutil/scripts/demote-node-to-implement`:

1. Add a `git -C "$REPO_ROOT" fetch origin main >&2` before the provenance-range
   computation at `demote-node-to-implement:45-61`, with a hard error and `exit 1`
   on failure (never fall back to a stale local `origin/main` ref). This also makes
   the `git log "$STAMPED_SHA..origin/main"` range at lines 53-55 accurate rather
   than best-effort-stale.
2. Keep the existing `FRESH_BLOB` resolution and its absent-on-`origin/main`
   refusal (`demote-node-to-implement:72-75`) — now resolved against the freshly
   fetched ref. Update the stale comment at lines 68-69 that says "Unlike
   park-node, this script has no prior fetch step".
3. Refresh the local node file from `origin/main` **before** the write, exactly as
   `park-node` does at `packages/intentionsutil/scripts/park-node:209-212` and
   `transition-node` does at
   `.claude/skills/dispatch-propagate/scripts/transition-node:99-102`:
   `git -C "$REPO_ROOT" show "origin/main:intentions/$NODE_ID.md" > "$REPO_ROOT/intentions/$NODE_ID.md"`,
   hard error on failure. Place it after the `FRESH_BLOB` capture and before
   `MUTATED=1` / the `apply-node-transition.ts` call at
   `demote-node-to-implement:104` — the existing EXIT trap already restores from
   the immutable `$FRESH_BLOB` on any non-zero exit once `MUTATED=1`, and the
   refresh writes exactly that same blob, so the rollback stays byte-correct.
   Note in a comment that `MUTATED` must be set before the refresh only if the
   refresh itself is treated as a mutation; the simplest correct arrangement is to
   set `MUTATED=1` immediately before the refresh, since the refresh is the first
   write to the node file.
4. Pass the compare-and-swap token at the land
   (`demote-node-to-implement:115`): `--base "$NODE_ID=$FRESH_BLOB"`, matching
   `park-node:263` and `transition-node:209`. Add the same short comment those two
   carry explaining what the pin buys.

`packages/intentionsutil/scripts/demote-node-to-implement` is invoked by
`.claude/skills/dispatch-propagate/scripts/transition-node:174` on the scope-stale
branch, which runs **before** transition-node sets `MUTATED=1` (line 191), so a
second refresh inside demote is safe and idempotent — transition-node has already
written the same `origin/main` content to the same path.

New file `packages/intentionsutil/scripts/test-demote-node-to-implement.sh`,
modeled on `packages/intentionsutil/scripts/test-transition-node.sh` (which
already contains every shim needed):

- Copy that harness's structure: scratch bare origin, `SEED` repo with
  `intentions/`, `packages/intentionsutil/scripts/`,
  `packages/intentionsutil/src/store.js` placeholder, the real
  `demote-node-to-implement` and the real `graph-commit` copied in
  (`test-transition-node.sh:77-123` — but note that block copies **only**
  `graph-commit` for real (at `:100`); at `:114-118` it writes a *stub*
  `demote-node-to-implement` that prints "unexpectedly invoked" and `exit 1`s.
  `demote-node-to-implement` is the script under test here, so `cp` the **real**
  one in its place and keep the rest of that block's structure), `make_clone`,
  the `gh` shim
  (`test-transition-node.sh:168-176`), the `npx` shim
  (`test-transition-node.sh:187-207`), and the `node` shim
  (`test-transition-node.sh:213-303`). The `node` shim needs two branches only:
  `*apply-node-transition.ts` with `--scope-stale` (rewrite `phase:` to
  `implement` in the node file and print the decision JSON) and the `-e` branch
  used by the PR-number re-read at `demote-node-to-implement:125-129` (print an
  empty string so the `gh pr comment` block is skipped). Stub `gh` to a no-op or
  omit it if the empty-PR path never calls it.
- Cases:
  1. **Stale far-ahead worktree demotion does not revert a concurrently-landed
     field.** Writer A lands a `blocked_by: [t-blocker]` edge; writer B is a
     far-ahead PR-branch clone that never synced (add a `src/feature.js` commit)
     and runs `demote-node-to-implement`. Assert exit 0, `phase: implement` on
     `origin/main`, and the `blocked_by` edge still present. This is the direct
     mirror of `test-transition-node.sh` Case 1
     (`test-transition-node.sh:329-373`) and is the regression the node exists for.
  2. **Node absent from `origin/main` is refused before any write** — exit 1,
     message contains `does not exist on origin/main`, `origin/main` unchanged.
     Mirrors `test-transition-node.sh` Case 3 (`test-transition-node.sh:440-453`).
- Same pass/fail accounting and exit contract as the sibling harnesses
  (`PASS`/`FAIL` counters, final `passed: N failed: M`, `exit 1` on any failure).

Wire the new harness into CI: add a step to `.github/workflows/unit-tests.yml`
immediately after the `Run transition-node CAS-guard tests` step at lines 208-209,
in the same shape:

```
      - name: Run demote-node-to-implement CAS-guard tests
        run: packages/intentionsutil/scripts/test-demote-node-to-implement.sh
```

**Out of scope for Unit 2:**

- `apply-node-transition.ts` — git-blind by design; the fetch/refresh/`--base`
  responsibility belongs to the bash wrapper, exactly as
  `tactic-graph-write-recipes-base-cas` decided for `transition-node`.
- `transition-node`, `park-node`, `clear-park`, `resolve-park`, `hold-node`,
  `resolve-hold` — already pass `--base`, or are outside this defect.
- `demote-node-to-implement`'s `REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"`
  derivation at line 36. It resolves to the checkout the *script copy* lives in;
  its only caller (`transition-node`) invokes the copy under its own
  `UTIL_SCRIPTS`, which is derived from `transition-node`'s own `SCRIPT_DIR`
  (`transition-node:48,55`), so the two agree. Do not change it here.
- Audit of the other direct `graph-commit` callers (skills, hooks,
  `dispatch-graph-census`, `reconcile-graph-*`, and so on). Unit 1 protects them
  without per-caller changes; converting them to `--base` is separate work.

## Verification

Unit 1's new test cases 1, 2, 4 and 5 must **fail** on the pre-fix `graph-commit`
and pass after. Verify that explicitly: stash the `graph-commit` change (or run the
new cases against a copy of the pre-fix script) and confirm the failures reproduce
the silent revert, before relying on the green run. A regression test that passes
before the fix is not testing the defect.

Unit 2's new harness case 1 must likewise fail against the pre-fix
`demote-node-to-implement` **when run with the pre-fix `graph-commit`**. After Unit
1 lands, Unit 1 alone already rescues that path (the implicit merge fires because
demote passes no `--base` — and after Unit 2 it is skipped because demote now does
pass one). So exercise Unit 2's case against both scripts at their final state and
confirm it is green; treat the pre-fix reproduction as a Unit-1 exercise.

```verify
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && packages/intentionsutil/scripts/test-graph-commit.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && packages/intentionsutil/scripts/test-transition-node.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && packages/intentionsutil/scripts/test-park-node.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && packages/intentionsutil/scripts/test-demote-node-to-implement.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && .claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && npx vitest run --project packages/intentionsutil --root .
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && npx tsx packages/intentionsutil/scripts/validate-graph.ts
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && .claude/skills/dispatch-propagate/scripts/run-lint.sh
```

The fourth command exists only after Unit 2 creates it; run the others before then.

Manual and judgment checks, outside the automated blocks:

- Confirm `test-transition-node.sh` Case 1 is still green **after** Unit 1. It is
  the canary for the `--base`-skip in Unit 1 step 3: that harness's `npx` shim
  makes `merge-node.ts` always fail, so if the skip is wrong, Case 1 parks instead
  of advancing and the failure message will say `mechanical-unresolved`.
- Confirm `test-graph-commit.sh` Cases 16, 17, 18, 27 and 28 are still green and
  that the far-ahead worktree HEAD is restored to the PR tip on **every** new path,
  including the park paths — assert `git rev-parse HEAD == far_tip` in the new park
  cases, not only in the success ones.
- These scripts run `git reset --hard`. When driving them through the sandboxed
  Bash tool, use `dangerouslyDisableSandbox: true` if `origin/main` advanced any
  read-only path (`.claude/skills/**`, config) — see `.claude/rules/sandbox.md`.
  The test harnesses operate entirely inside `mktemp -d` scratch repos and do not
  need it.
- Observe in production: after this merges, the next phase transition or demotion
  run from a far-behind PR-branch worktree should either land cleanly or emit
  graph-commit's `concurrent-edit conflict ... parking node(s)` message. A park
  from this new path is the fix working, not a new failure — the parked node
  carries the writer's content in the kept `SNAP_DIR` for a manual merge.

## needs-main residue

- **id 11 — PR body's regression-case citation is stale (case numbers 36-40 vs
  the actual 48-52).** The PR body's Unit 1 section cites the new
  `test-graph-commit.sh` regression cases reproducing the silent revert as
  "cases 36-40." An unrelated `origin/main` commit independently inserted its
  own new cases 36-47 into `test-graph-commit.sh` after this PR's body text was
  written, shifting this PR's own five regression cases to case numbers 48-52
  (far-ahead disjoint fields both land; far-ahead same-field edit parks;
  far-ahead prune racing a concurrent edit parks; far-ahead list-entry removal
  parks; far-ahead + stale `--base` reconciliation survives the rebuild). QA
  confirmed all five cases exist under their current numbers, correctly
  implement the scenarios the PR body describes, and pass
  (`test-graph-commit.sh` 68/68 as of the qa-fix attempt-2 pass). This looks
  like stale prose caused by unrelated `origin/main` churn, not a functional
  gap — but the PR body's own text should be corrected post-merge so a future
  reader isn't misled by the wrong case numbers.
  - Expected outcome: the merged PR body (or a follow-up doc fix) cites the
    correct case numbers, or a comment confirms the citation is deliberately
    left as historical text.
  - Verifiability: MACHINE
  - Check: `grep -n 'Case 4[89]\|Case 5[0-2]' packages/intentionsutil/scripts/test-graph-commit.sh` on `origin/main` post-merge — confirm the five cases described above are present at whatever numbers they land at, and that they cover the disjoint-lands / same-field-parks / prune-race-parks / list-entry-removal-parks / stale-base-survives-rebuild scenarios.
