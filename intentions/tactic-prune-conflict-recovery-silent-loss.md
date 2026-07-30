---
id: tactic-prune-conflict-recovery-silent-loss
kind: tactic
statement: "graph-commit's concurrent-edit conflict recovery must not silently
  drop a --prune: the snapshot/re-sync path preserves ordinary edit content but
  has no equivalent for a pruned id, so a deleted file can reappear after a park
  and the retry lands nothing for it"
owner: ai
status: codified
parent: null
rationale: "Deferred finding from the terminal review of PR #2790
  (tactic-graph-commit-prune-support, --prune/--base primitive) on the
  2026-07-07 emulated router tick. snapshot() deliberately skips PRUNE_IDS ('a
  prune id has no on-disk file to copy, and there is no writer-authored content
  to preserve for it'), which is correct for the ordinary success path. But
  graph-commit's conflict-recovery path re-syncs the tree to fresh origin/main
  on a concurrent-edit conflict and retries the land. For an ORDINARY id,
  SNAP_DIR holds the writer's content so the retry can re-apply it. For a PRUNE
  id there is nothing in SNAP_DIR to re-apply -- if the re-sync (a git
  reset/checkout to fresh origin/main) restores the file the writer had deleted,
  the retry's git add stages no change for that id (the file is back and
  untouched), silently dropping the prune from the write with no error.
  Concretely: writer A prunes tactic-X and tactic-Y in one graph-commit call; a
  concurrent writer B lands an edit to tactic-Y first; A's rebase conflicts; A's
  park/retry re-syncs to origin/main (tactic-X's file, still present there,
  reappears in A's tree); A's retry stages tactic-Y's edit but tactic-X's prune
  is now silently absent from what actually lands, with no error and no park
  record naming it. Fix candidates: (1) the retry re-deletes every PRUNE_IDS
  file after the re-sync, before re-staging (cheapest); or (2)
  check_base_freshness's --base CAS mechanism is required for every --prune call
  (a stale prune should refuse to land rather than silently vanish). Retained as
  a draft for /align-tactics to place -- likely a small addendum unit on
  tactic-graph-commit-prune-support itself (now phase: done) or a standalone
  tiny tactic per sole-tracker doctrine. Planned 2026-07-30 by the
  dispatch-pipeline bootstrap through a parallel Workflow fan-out rather than an
  /align-tactics round, so that skill's two-sided drift review and its census
  were bypassed (deliberate: ten concurrent align rounds would mean ten
  concurrent graph-commits, the exact hazard the bootstrap exists to avoid).
  Each plan was authored against the node's own cited code and then
  independently verified by a second agent; all reported citation and substance
  gaps were applied before landing. A later /align-tactics round should treat
  this body as unreviewed by the normal path."
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
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# graph-commit must not drop a `--prune` when conflict recovery re-syncs the tree

## Context

`packages/intentionsutil/scripts/graph-commit` is the single write primitive that lands intention-node edits on `main`. It accepts ordinary edit ids (positional) and deletion ids (`--prune <id>`, repeatable, mixable in one invocation). The owed-prune census workflow issues exactly the mixed shape — see `packages/intentionsutil/scripts/graph-census-debt.ts:179`, which instructs operators to "prune ONLY the verified ones with `graph-commit --prune` (repairing inbound `blocked_by` edges in the same commit)". So a real invocation routinely looks like:

```
graph-commit -m 'graph: census prune' --prune tactic-X --prune tactic-Y tactic-A tactic-B
```

where `tactic-A`/`tactic-B` are `blocked_by` repairs.

### What actually goes wrong (verified against this worktree, which is exactly `origin/main` b552dfa2)

`snapshot()` (`packages/intentionsutil/scripts/graph-commit:395-403`) copies each **edit** id's on-disk content into `SNAP_DIR` and deliberately skips `PRUNE_IDS` (comment at lines 400-403: "a prune id has no on-disk file to copy … the deletion is fully recorded by the commit that lands (or fails to land)"). That premise is false on one code path.

There are two places that re-sync the working tree to fresh `origin/main` and then rebuild the intended write:

1. `ensure_intentions_only_base()` (`graph-commit:496-515`) — `git reset --hard "$base_sha"` (line 507), then re-copies each edit id from `SNAP_DIR` (lines 509-511) **and re-deletes each `PRUNE_IDS` file** (lines 512-514). This path is correct.
2. `park_and_exit()` (`graph-commit:1156-1194`) — the fail-closed concurrent-edit park. It does `git fetch origin main` / `git reset --hard FETCH_HEAD` (lines 1179-1180), then `park_write` (1181), then `commit_files` (1183-1185) and `land` (1187). **It never re-deletes the `PRUNE_IDS` files.** The reset restores every pruned file from `origin/main`, so `git add -- intentions/<id>.md` in `commit_files()` (`graph-commit:544-551`) stages no deletion for them.

Consequence: **one unresolvable conflict on any single id in the invocation silently reverts every `--prune` in that invocation, including prunes that had no conflict at all.** In the census example above, if `tactic-A`'s edit conflicts with a concurrent writer, `tactic-X` and `tactic-Y` are resurrected on disk, their deletions never land, and instead they receive an `office_hours` park whose recommendation text (`graph-commit:1117-1125`) asserts:

> "A concurrent writer landed an overlapping edit to this node while this session's prune was in flight; the prune was NOT landed…"

which is factually wrong for `tactic-X`/`tactic-Y` — nobody touched them. The operator gets two spuriously parked `phase: done` nodes in the office-hours queue, no indication of which id actually conflicted, and has to redo the whole batch.

### Correction to the node's original framing (important — do not plan from the stale version)

The node's rationale (written 2026-07-07, deferred from PR #2790's review) says the dropped prune lands with "no error and no park record naming it". That is **no longer accurate** for the case where the pruned node is itself the conflicted one: `park_and_exit()` parks every id in `ALL_IDS`, and `try_layer2_resolve()` (`graph-commit:654-712`) already gives a prune-specific sentinel at lines 669-673 (`{"id": …, "note": "prune vs. concurrent edit"}`). Two harness cases pin that behavior and **must keep passing**:

- Case 17 (`packages/intentionsutil/scripts/test-graph-commit.sh:803-828`) — a `--prune` racing an edit to the same node parks with a recommendation that omits a snapshot path.
- Case 23 (`test-graph-commit.sh:952-973`) — the same race is excluded from the layer-2 merge attempt, parks with `mechanical-unresolved` and the `prune vs. concurrent edit` note.

So the live defect is narrower and more specific than the node's prose: it is the **bystander prune** — a `--prune` id that is *not* implicated in the conflict — plus a second, independent hole in `--base` handling described in Unit 2.

### Second defect: `--base` compare-and-swap is not prune-aware

`check_base_freshness()` (`graph-commit:277-327`) iterates `BASE` and, for any id whose blob moved on `origin/main`, calls `run_merge_node "$id" "$base_f" "$INTENTIONS_DIR/$id.md" "$theirs_f" "$out_f"` (line 311). It does not check whether the id is a prune. For a prune id, `$INTENTIONS_DIR/$id.md` **does not exist by contract** (`main()` refuses at `graph-commit:1368-1370` if it does). Two divergent behaviors follow:

- **Production**: `merge-node.ts` calls `readNodeFile(oursPath)` (`packages/intentionsutil/scripts/merge-node.ts:51`, reader at lines 26-33) → `readFileSync` throws `ENOENT` → the top-level catch exits 1 with no JSON (`merge-node.ts:100-108`) → `run_merge_node()` records the generic `{"id", "note": "could not attempt structural merge"}` sentinel (`graph-commit:452-455`) and parks. The write does fail closed, but the diagnosis is a lie: the operator is told the merge tool crashed, not "your prune's base moved on origin/main". It also spawns a guaranteed-doomed `npx tsx`.
- **Test harness**: the fake `npx` merge-node shim (`test-graph-commit.sh:321-407`) reads `--ours` only `if [[ -n "$ours" && -f "$ours" ]]` (lines 352-357), so a missing ours file yields an empty `OURS_V` map, every key resolves from theirs, and the shim reports `{"resolved":true}` and writes `--out`. `check_base_freshness` then does `cp -- "$out_f" "$INTENTIONS_DIR/$id.md"` (line 315), **resurrecting the pruned file**. It then **lands** the resurrection rather than taking any no-op branch, and exits 0 having deleted nothing. Get the mechanism right, because an earlier draft of this plan had it wrong and cited `graph-commit:1476` (the "no new changes to stage" branch): `id_files_dirty()` is in fact **true** — the resurrected content differs from the writer's local HEAD, which predates the concurrent edit — so `commit_files()` commits the resurrection, `land()`'s `git pull --rebase origin main` silently drops the now-duplicate commit against origin's already-identical tip ("warning: skipped previously applied commit ..."), and the run exits 0 through the ordinary success path (`land()` / `try_land()`, `graph-commit:1005-1029`) with the message `landed <id> on main (layer 2/3 auto-resolved a concurrent-edit divergence)`. This was confirmed by a live repro against the unmodified `graph-commit` + harness. It is consistent with Case 13 (`test-graph-commit.sh:714-753`), whose header documents the structurally identical "stale-base resolves via merge" flow as "exit 0, both lines land, no park" — resolved merges always land through `commit_files()`/`land()`, never through the empty-diff branch. That is a genuine silent prune loss reachable in the harness, and it proves the harness cannot currently catch this class of bug. Case 34's assertions below are written against the real failure mode (they key on the `layer 2/3 auto-resolved` message), and the Unit 2 fix changes the outcome to rc=1 with a park naming `prune base moved` — verified against a scratch copy.

Both are fixed by the same change: make `check_base_freshness()` early-out for prune ids, exactly as `try_layer2_resolve()` already does at `graph-commit:669-673`.

### Intended outcome

1. A `--prune` that is *not* implicated in a conflict lands its deletion even when the invocation parks for some other id. No resurrection, no spurious park on a node nobody touched.
2. A `--prune` that *is* implicated in the conflict keeps parking exactly as today (Cases 17/23 unchanged).
3. A stale `--base` on a prune id parks with an accurate, prune-specific reason instead of a crash sentinel, and never resurrects the file.
4. The harness gains coverage for both, and its merge-node shim stops silently tolerating a missing `--ours`.

### Design note: why bystander *prunes* are re-applied but bystander *edits* are not

The greenfield-correct unit of fail-closed atomicity is the **conflicted id set**, not the whole invocation. A deletion of an unrelated node is independent of another node's conflict, so it should land.

Bystander *edits* are deliberately left alone. Re-materializing an edit's `SNAP_DIR` content onto a re-fetched base is content-based, not diff-based, and is precisely the hazard already filed as `tactic-graph-commit-intentions-base-stale-restore` (a concurrent landing on that id between `snapshot()` and the reset gets silently clobbered). Do not extend this fix to edits — that is a different node's work.

The prune direction does not carry that hazard in a new form: the park commit's deletion is rebased onto `origin/main` by `try_land()` (`graph-commit:913-988`), so a third writer editing the bystander node *after* the reset produces a modify/delete conflict that parks loudly. A writer who edited it *before* the reset is the pre-existing blind-delete exposure that `--base` exists to mitigate — see Unit 2 and the migration proposal below.

### Greenfield proposal vs. this PR's scope (`--base` mandatory for `--prune`)

The node's fix candidate 2 proposes requiring `--base` for every `--prune`. The ideal greenfield design is indeed that every prune carries a compare-and-swap base so a prune whose node moved refuses to land rather than blind-deleting another writer's work. That is **backwards-incompatible**: it breaks every current caller, including the documented instruction in `graph-census-debt.ts:179` and `:237`, and harness Cases 10, 11, 14, 17, 18, 23. Migration path, as a separate proposal, not this PR:

1. (this PR) Make `check_base_freshness()` prune-aware so `--base` on a prune id behaves correctly when it *is* passed.
2. Teach the prune-issuing call sites to capture and pass `--base` (`graph-census-debt.ts` guidance text; any script that shells `graph-commit --prune`).
3. Only then flip to required, with the harness cases updated in the same change.

Note also that the node's fix candidate 1 as literally written ("the retry re-deletes **every** `PRUNE_IDS` file after the re-sync") is wrong: re-deleting the *conflicted* prune would land a deletion over the other writer's just-landed edit, violating the fail-closed contract documented at `graph-commit:68-77` and breaking Cases 17 and 23. The fix must discriminate.

---

## Unit 1 — Re-apply bystander prunes on the fail-closed park path

**Recommended model**: `opus`

**Scope**

All changes in `packages/intentionsutil/scripts/graph-commit`.

1. **New helper: the conflicted-id set.** `CONFLICT_FIELDS_JSON` (declared `graph-commit:198`, created lazily by `init_conflict_fields()` at `graph-commit:413-418`, appended by `append_conflicts()` at `422-428`) is a JSON array whose every entry carries an `id` key — both the `{id, field, ours, theirs}` shape and the `{id, note}` sentinel shape. It is the authoritative registry of which ids this invocation could not resolve. Add a helper near `build_recommendation()` (`graph-commit:1029-1042`) that emits the distinct ids, one per line:

   ```bash
   conflicted_ids() {
     [[ -n "$CONFLICT_FIELDS_JSON" && -s "$CONFLICT_FIELDS_JSON" ]] || return 1
     jq -r '.[].id' "$CONFLICT_FIELDS_JSON" | sort -u
   }
   ```

   Per `.claude/rules/shell-json.md`, `jq` reads the file directly — never `echo "$VAR" | jq`.

2. **`park_and_exit()` (`graph-commit:1156-1194`) — partition the ids.** Immediately after the `git reset --hard FETCH_HEAD` at line 1180, and **before** `park_write` at line 1181:
   - Read `conflicted_ids()` into a variable. If it fails or is empty (reachable: `try_layer2_resolve()` returns 1 when `git rebase --continue` fails at `graph-commit:710` with nothing appended), fall back to today's behavior — every id parks, no prune is re-applied. This is the conservative direction and must be preserved; do not invent a cleverer default.
   - Otherwise build two sets: `bystander_prunes` = every id in `PRUNE_IDS` **not** listed by `conflicted_ids()`; `park_ids` = `ALL_IDS` minus `bystander_prunes`. Match ids exactly (`grep -qxF` against the newline list, or a bash associative set — do not use substring matching; an id that is a strict prefix of a sibling id — the graph has several such pairs — would collide).
   - `rm -f -- "$INTENTIONS_DIR/$id.md"` for each `bystander_prunes` entry, mirroring the loop already at `graph-commit:512-514`. Consider extracting that loop into a shared `delete_prune_files <id...>` helper used by both sites; keep `ensure_intentions_only_base()`'s behavior (it deletes *all* prunes — there is no conflict concept there) unchanged.
   - Call `park_write "${park_ids[@]}"` instead of the bare `park_write`. This ordering matters: the bystander files must be gone **before** `park_write` runs, and `park_write` must not be asked to read them.

3. **`park_write()` (`graph-commit:1065-1147`) — take ids as arguments.** Change only the final invocation line (`graph-commit:1141-1142`) from `"${ALL_IDS[@]}"` to `"$@"`. Leave `prune_csv` (line 1093) derived from the `PRUNE_IDS` global — the helper uses it as a lookup set for choosing recommendation text, not as a work list. **Do not otherwise modify the inline tsx heredoc** (see the merge hazard below).

4. **Logging.** Update the two messages so the operator can tell what landed from what parked:
   - `graph-commit:1163-1164` currently says `concurrent-edit conflict on ${ALL_IDS[*]}; parking node(s)`. Name the parked set, and add a separate line naming any bystander prunes being applied anyway.
   - `graph-commit:1189` currently says `parked ${ALL_IDS[*]} (office_hours set on the origin/main content) and pushed the parking write to main`. Name the parked set and the landed-deletion set separately.

5. **Comment corrections** (these are load-bearing — they currently state the false premise):
   - `snapshot()`'s `PRUNE_IDS` skip comment, `graph-commit:400-402` — "the deletion is fully recorded by the commit that lands (or fails to land)" is false for the park path. Rewrite to say the prune set is re-applied after each re-sync (`ensure_intentions_only_base()`, and `park_and_exit()` for non-conflicted prunes).
   - `park_and_exit()`'s header comment, `graph-commit:1149-1155`, and the fail-closed rationale at `graph-commit:1165-1173` — state that non-conflicted prunes are re-applied and land with the park commit, and why that does not violate the no-automatic-overwrite guarantee.
   - The script's exit-status block, `graph-commit:68-77` (the `mechanical-unresolved-parked` sub-case) — "this writer's content is NOT landed" needs the prune carve-out.
   - `land()`'s comment block, `graph-commit:990-1004`, same carve-out.

**Explicitly out of scope**
- Bystander *edit* ids: they keep parking, their content keeps living in `SNAP_DIR`. Do not re-materialize them (see the design note above).
- `ensure_intentions_only_base()`'s existing prune re-delete loop (`graph-commit:507-514`) — behavior unchanged; refactoring it into a shared helper is optional.
- `try_layer2_resolve()`'s prune early-out (`graph-commit:669-673`) and `is_prune_id()` (`graph-commit:635-641`) — unchanged.
- `merge-node.ts`, `store.ts`, and everything under `packages/intentionsutil/src/`.
- Any change to exit codes. A park is still exit 1.

**Merge hazard — read before editing.** `intentions/tactic-graph-commit-delete-vs-edit-park-hardening.md` is at `phase: qa` with PR #2936 open, and it rewrites the body of `park_write()`'s inline tsx heredoc (the `ids.map((id) => readNode(...))` line and the recommendation branches) plus the `*)` catch-all of the harness `npx` shim (`test-graph-commit.sh:408-430`). Merge `origin/main` before starting and again before landing. This unit deliberately touches only `park_write`'s argv line, not the heredoc body, to keep the overlap to one line.

**Reuse**
- `is_prune_id()` — `packages/intentionsutil/scripts/graph-commit:635-641`.
- The prune-delete loop shape — `graph-commit:512-514`.
- `CONFLICT_FIELDS_JSON` / `init_conflict_fields()` / `append_conflicts()` — `graph-commit:198, 413-428`.
- `commit_files()` (`graph-commit:544-551`) and `id_files_dirty()` (`graph-commit:531-537`) already iterate `ALL_IDS`, so the bystander deletion is staged and detected with **no change** to either. `EXPECTED` (populated in `main()` at `graph-commit:1358` and `1374`) already contains every prune path, so `assert_staged_safe()` (`graph-commit:374-386`) passes unchanged.

---

## Unit 2 — Make `--base` freshness checking prune-aware

**Recommended model**: `sonnet`

**Scope**

1. `packages/intentionsutil/scripts/graph-commit`, `check_base_freshness()` (`graph-commit:277-327`). Inside the `for id in "${!BASE[@]}"` loop (line 282), after the `[[ "$origin_sha" == "$sha" ]] && continue` fast path at line 290 and **before** the `git cat-file -p "$sha" >"$base_f"` read at line 302, add a prune early-out mirroring `try_layer2_resolve()`'s at `graph-commit:669-673`:

   ```bash
   if is_prune_id "$id"; then
     append_conflicts "$(jq -cn --arg id "$id" '[{id: $id, note: "prune base moved — the node changed on origin/main since this writer read it"}]')"
     STALE_BASE_UNRESOLVED=1
     continue
   fi
   ```

   Rationale to put in the comment: a deletion has no on-disk content to three-way merge, and `$INTENTIONS_DIR/$id.md` is absent by contract (`main()` refuses otherwise at `graph-commit:1368-1370`). Without this, `run_merge_node` at line 311 hands `merge-node.ts` a nonexistent `--ours`, which throws `ENOENT` and is reported as the generic "could not attempt structural merge" crash sentinel (`graph-commit:452-455`) — a wrong diagnosis and a doomed `npx tsx` spawn.

   Note on ordering: `is_prune_id()` is defined at `graph-commit:635`, *after* `check_base_freshness()` at 277. That is fine — bash resolves functions at call time and `check_base_freshness` is first called from `main()` at `graph-commit:1427`, by which point every function is defined. Do not reorder the file.

2. `packages/intentionsutil/scripts/test-graph-commit.sh`, the fake `npx` merge-node branch. Its `--ours` read is guarded by `if [[ -n "$ours" && -f "$ours" ]]` (lines 352-357), so a missing ours file silently yields an empty map and the shim reports `{"resolved":true}` — diverging from the real `merge-node.ts`, which throws. Add a guard right after the argument-parsing `while` loop (which ends at line 332) and before the empty-`--theirs` block at lines 336-341:

   ```bash
   if [[ -n "$ours" && ! -f "$ours" ]]; then
     echo "merge-node shim: --ours file does not exist: $ours" >&2
     exit 1
   fi
   ```

   This mirrors the real CLI's crash contract documented at `merge-node.ts:14-16` ("A tool crash … exits non-zero with an error on stderr and NO JSON on stdout"). Update the shim's doc comment (`test-graph-commit.sh:293-307`) to record the guard.

**Explicitly out of scope**
- Making `--base` mandatory for `--prune` — that is the follow-up migration described in Context, not this PR.
- The empty-`--theirs` branch of the shim (`test-graph-commit.sh:336-341`) — PR #2936 is rewriting exactly that block. Leave it alone; touching it guarantees a conflict.
- The `*)` park-helper branch of the shim (`test-graph-commit.sh:408-430`) — also #2936's.
- `merge-node.ts` itself.

**Reuse**
- `is_prune_id()` — `graph-commit:635-641`.
- `append_conflicts()` — `graph-commit:422-428`; the `jq -cn --arg id …` sentinel idiom is copied verbatim from `graph-commit:670`.
- `STALE_BASE_UNRESOLVED` and the existing park trigger — `graph-commit:281, 321, 324-326`.

---

## Unit 3 — Harness coverage

**Recommended model**: `sonnet`

**Dependencies**: Units 1 and 2. Case 33 fails against an unfixed Unit 1; Case 34 fails against an unfixed Unit 2.

**Scope**

All changes in `packages/intentionsutil/scripts/test-graph-commit.sh`. This bash harness is the only test coverage for `graph-commit` — there is no vitest coverage of the script. It runs fully offline against a throwaway bare origin plus PATH shims for `gh` and `npx`.

1. **Fixtures.** Add three ids to the `seed_node` loop at lines 163-167: `t-bystander-prune`, `t-bystander-conflict`, `t-prune-base-stale`. `seed_node` (lines 156-162) writes a bare `id:` + `line1..line12: base` file, which is what the merge-node shim's simplified `key: value` merge expects — use it, not `seed_field_node`.

2. **Case 33 — bystander prune lands despite a park on another id.** Insert after Case 32 (which ends at `test-graph-commit.sh:1200`) and before the "No scratch branches left behind" block at line 1202. Model it on Case 4 (`test-graph-commit.sh:507-525`), which is the same conflict setup:

   ```
   set_mode green
   sync_clone "$A"; sync_clone "$B"
   edit_line "$A" t-bystander-conflict 1 A-wins
   run_gc "$A" t-bystander-conflict >/dev/null 2>&1
   edit_line "$B" t-bystander-conflict 1 B-loses
   rm -f "$B/intentions/t-bystander-prune.md"
   out="$(run_gc "$B" -m 'test: bystander prune' t-bystander-conflict --prune t-bystander-prune 2>&1)"; rc=$?
   ```

   Assert all of:
   - `rc -eq 1` (the invocation still parks).
   - `origin_show t-bystander-conflict` contains `line1: A-wins`, does **not** contain `^line1: B-loses`, and contains `office_hours` — the conflicted id is parked exactly as before.
   - `! git -C "$ORIGIN" cat-file -e main:intentions/t-bystander-prune.md 2>/dev/null` — the bystander deletion **landed**. This is the assertion that fails before Unit 1.
   - The bystander node never acquired an `office_hours` line — assert its absence via the tree, i.e. it is simply gone from `main`.

   Register the kept snapshot dir for cleanup with the existing idiom used by Cases 4/20/22/23: `snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"; [[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")`.

3. **Case 34 — stale `--base` on a prune id parks with a prune-specific reason, no resurrection.** Model the setup on Case 13 (`test-graph-commit.sh:714-753`) for the stale-base mechanics and Case 12 (`696-712`) for the `hash-object` idiom:

   ```
   set_mode green
   W13="$WORK/w13"
   make_clone "$W13" writer-13
   stale="$(git -C "$W13" hash-object intentions/t-prune-base-stale.md)"
   # a concurrent writer advances the same node on origin/main
   OTHER2="$WORK/other2"
   make_clone "$OTHER2" other2
   echo "line13: concurrent edit" >>"$OTHER2/intentions/t-prune-base-stale.md"
   git -C "$OTHER2" commit -qam 'concurrent edit'
   git -C "$OTHER2" push -q origin main
   rm -f "$W13/intentions/t-prune-base-stale.md"
   out="$(run_gc "$W13" -m 'test: prune stale base' --base "t-prune-base-stale=$stale" --prune t-prune-base-stale 2>&1)"; rc=$?
   content="$(origin_show t-prune-base-stale 2>/dev/null)"
   ```

   Assert all of:
   - `rc -eq 1` — refuses. Before Unit 2 the shim resolves, `check_base_freshness` cp's the file back, `id_files_dirty()` is false, and the run exits **0** with the "no new changes to stage" message having deleted nothing — so `rc -eq 1` is the assertion that fails pre-fix.
   - The node still exists on `main` and carries `office_hours` (fail-closed, not blind-deleted).
   - The park text names the prune-base divergence: grep `content` for the stable substring `prune base moved` chosen in Unit 2.
   - `! grep -q 'could not attempt structural merge' <<<"$content"` — the crash sentinel must not appear.
   - `! grep -q 'layer 2/3 auto-resolved' <<<"$out"` — no false auto-resolve claim.

   Register the snapshot dir for cleanup as above.

4. **Header index.** Append one-line entries for Cases 33 and 34 to the case index in the file header (the list currently ends with case 32 at `test-graph-commit.sh:107-109`).

**Explicitly out of scope**
- Cases 17 and 23 (`test-graph-commit.sh:803-828` and `952-973`) — do not modify or weaken them. They are the regression guard proving a *conflicted* prune still parks, and they must stay green unchanged.
- Any new helper functions. Use `make_clone`, `sync_clone`, `edit_line`, `origin_show`, `origin_sha`, `scratch_refs`, `run_gc`, `set_mode`, `ok`, `no`, `SNAP_DIRS_TO_CLEAN` as-is (defined at `test-graph-commit.sh:128-129, 156-167, 204-208, 436-467`).
- The `npx` shim (Unit 2 owns its one change).

**Reuse**
- `seed_node` — `test-graph-commit.sh:156-162`; id list at `163-167`.
- `run_gc` — `test-graph-commit.sh:450-467` (cds into the clone, exports the shim PATH and the `GRAPH_COMMIT_*` window overrides, passes no `-C`).
- Case 4 (`507-525`) — structural template for Case 33.
- Cases 12 and 13 (`696-753`) — `hash-object` + concurrent-landing template for Case 34.
- Cases 20/22/23 — the `SNAP_DIRS_TO_CLEAN` + `sed` snapshot-extraction idiom.

---

## Verification

The primary gate is the bash harness. It needs only `bash`, `git`, and `jq` — no network, no real `gh`, no real `node`.

```verify
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && packages/intentionsutil/scripts/test-graph-commit.sh
```

Expect the final line `failed: 0`, with every pre-existing case still green — in particular Case 4, Case 10 (mixed edit+prune lands together), Case 14 (pure prune), Case 17, Case 18 (far-ahead + prune), and Case 23 — plus the two new cases and the "no graph/** scratch branches remain" check.

Regression net for the untouched TypeScript side (no TS files change in this plan; this confirms nothing adjacent broke):

```verify
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && npx vitest run --project packages/intentionsutil --root .
```

```verify
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && .claude/skills/dispatch-propagate/scripts/run-lint.sh
```

```verify
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

### Manual checks (judgment, not automated)

**Guard-reversion check — prove each new case actually depends on its fix.** Run this before declaring the units done; a case that passes against the unfixed script is testing nothing.

1. Temporarily revert Unit 1 only (drop the bystander-prune `rm -f` from `park_and_exit()`). Re-run the harness: Case 33 must FAIL — `intentions/t-bystander-prune.md` is still present on `main` and carries an `office_hours` line. Restore the fix; Case 33 green again.
2. Temporarily revert Unit 2's `check_base_freshness()` early-out only (leave the shim guard in place). Re-run: Case 34 must FAIL — the shim guard now makes `merge-node` exit 1, so the run parks with the generic `could not attempt structural merge` sentinel instead of `prune base moved`. Then also revert the shim guard: Case 34 must fail differently — `rc` becomes 0 with the "no new changes to stage" message and the node still present on `main`, which is the silent-loss shape this whole plan exists to close. Restore both.

**Ordering against PR #2936.** `intentions/tactic-graph-commit-delete-vs-edit-park-hardening.md` (`phase: qa`, PR #2936) edits `park_write()`'s tsx heredoc and the harness `npx` shim's `*)` branch and empty-`--theirs` branch. Merge `origin/main` at the start of the work and again immediately before landing, and re-run the harness after each merge. If #2936 landed first, re-derive the `park_write` line anchors — its heredoc grows by roughly a dozen lines and shifts everything after `graph-commit:1065`.

**Line-number drift.** Every `path:line` anchor above was read against this worktree at `origin/main` b552dfa2. Re-grep for the named function or comment text before editing rather than trusting a line number; earlier units in the same PR shift later ones.

**Observe in production (post-merge, no automated check possible).** The next owed-prune census batch that hits a concurrent-edit park is the real signal: its bystander prunes should be gone from `origin/main` and should NOT appear in the office-hours queue, while the one genuinely conflicted node should. Check `git log --diff-filter=D --name-only origin/main -- intentions/` against the park commit for that batch.
