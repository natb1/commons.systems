---
id: tactic-graph-commit-delete-vs-edit-park-hardening
kind: tactic
statement: "Harden delete-vs-edit park in graph-commit: fix the integration-test
  shim's empty-theirs assumption, add downstream park-on-deleted-node handling,
  and add integration coverage for the concurrent-delete-vs-edit case"
owner: ai
status: codified
parent: null
rationale: "review-fix follow-up from PR #2911
  (tactic-graph-commit-auto-serialization): a red-team finding on
  merge-node.ts:61 (a concurrent writer's deletion of a node was silently
  resurrected by an empty --theirs synthesizing theirs=ours with a null base)
  was upheld by adversarial verify and fixed in that PR (merge-node.ts now
  treats empty --theirs with a non-empty --base as an unresolved delete/modify
  conflict that parks). This tactic covers the remaining hardening the review
  residue pass could not safely complete in-PR: the test-graph-commit.sh shim
  still hard-codes the old ours-wins assumption for empty --theirs, park_write's
  downstream handling of a their-delete park is unverified (readNode throws on
  the now-absent file), and there is no integration test for this direction
  (mirrors the existing prune-direction Case 17/23 coverage). Do not remove the
  merge-node.ts guard landed in PR #2911 -- this tactic only builds
  test/downstream coverage around it."
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
  branch: tactic-graph-commit-delete-vs-edit-park-hardening
  pr: 2936
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours:
  reason: origin/main does not merge clean into this tactic's branch (provision
    exit 11)
  since: 2026-07-25
  recommendation: Resolve the conflict by hand in the node worktree and re-run the
    phase, or route to /dispatch-conflict once it accepts node targets.
pace_exempt: false
rounds: null
attributes: {}
---
# Harden graph-commit against delete/modify divergence (test shim fidelity + park-on-deleted-node + integration coverage)

## Context

PR #2911 fixed `packages/intentionsutil/scripts/merge-node.ts` so that an empty `--theirs` with a **non-empty** `--base` (the other writer's already-landed change deleted a node this writer was editing) is now reported as an unresolved delete/modify conflict (`{"resolved":false,...}`, `--out` not written), instead of silently resurrecting the deleted node as "ours wins outright" (`merge-node.ts:74-78`, conflict shape at line 75). Only empty-`--theirs`-AND-empty-`--base` (genuine add/add) still passes ours through.

That guard is correct but its downstream/test surface is not yet hardened. Three gaps remain, and they are ordered (the new test depends on the first two fixes being in place):

1. **Test shim fidelity** — the fake `npx` in the harness still emulates the OLD unconditional "empty theirs → ours wins" behavior, so the suite no longer mirrors the real script.
2. **Park-on-deleted-node crash** — when the delete/modify guard fires and `graph-commit` parks, `park_and_exit()` resets the tree to fresh origin/main (where the node is now ABSENT), then `park_write()` calls `readNode()` on the missing file and dies with `ENOENT` — the park never lands. The same bug is independently duplicated in the harness shim.
3. **Integration coverage** — no end-to-end test exercises the delete-first / edit-second direction.

Intended outcome: the delete/modify divergence parks cleanly (exit 1) with a schema-valid, body-preserving `office_hours` record whose recommendation names the delete-vs-edit reconciliation, and a new integration case proves it end-to-end through both the shim fix and the park fix. **Do NOT touch the `merge-node.ts:74-78` guard PR #2911 already landed** — this work only builds test/downstream coverage around it.

Key facts verified against current repo state:
- `park_and_exit()` (`graph-commit:920-958`) does `git fetch origin main; git reset --hard FETCH_HEAD` (lines 943-944), leaving `intentions/<id>.md` absent on disk in the delete/modify case, then calls `park_write()`.
- `park_write()`'s inline tsx helper (`graph-commit:859-904`) does `const nodes = ids.map((id) => readNode(intentionsDir, id))` (line 877). `readNode` (`store.ts:101-105`) is `readFileSync(join(dir, \`${id}.md\`))` — throws uncaught `ENOENT` → `die "failed to write the office_hours parking record"` (`graph-commit:908`).
- `snapshot()` (`graph-commit:346-354`) copies every id in `IDS` (every non-prune edit id) to `SNAP_DIR/<id>.md` **before** `check_base_freshness` and before any reset — so the writer's real content survives.
- **Data-loss trap:** `writeNode` (`store.ts:39-50`) preserves an existing body via `readExistingBody(filePath, ...)` where `filePath = join(dir, id.md)` (the *target* `intentionsDir`, line 43). If the target file does not exist, `readExistingBody` returns `null` (`store.ts:86-90`) and the body falls back to the generated `# ${statement}\n` placeholder — silently discarding the writer's authored body. `assertNoBodyLoss` (`store.ts:62-76`) only guards a rewrite over an *existing* non-placeholder file; it does not catch a first-write-with-no-target-file. So the snapshot must be physically copied to `intentionsDir/<id>.md` FIRST, then read/mutated/written, so `readExistingBody` picks up the real body.
- The harness runs the whole suite against a fake `npx` (`test-graph-commit.sh:243-386`, doc comment 245-271) that emulates BOTH the `merge-node.ts` CLI (lines 274-361) and `park_write`'s tsx helper (the `*)` catch-all, 362-385). Both emulations carry the SAME two bugs and must be fixed to keep observable behavior consistent with the real fix.

(Line numbers above were current as of this plan's authoring; re-grep for the exact anchors before editing, since earlier units in this same PR shift later line numbers.)

## Units of work

### Unit 1 — Test shim fidelity: mirror merge-node.ts's empty-`--theirs` branching

**Scope**
- File: `packages/intentionsutil/scripts/test-graph-commit.sh`, the `merge-node.ts)` case of the fake `npx` heredoc — specifically the empty-`--theirs` block at **lines 288-295**.
- Current buggy code (lines 288-295) unconditionally treats empty `--theirs` as ours-wins:
  ```bash
  if [[ -z "$theirs" ]]; then
    [[ -n "$out" && -n "$ours" ]] && cp -- "$ours" "$out"
    printf '{"resolved":true,"conflicts":[]}\n'
    exit 0
  fi
  ```
- Replace with a branch on `--base`, mirroring `merge-node.ts:74-78`:
  - empty `theirs` AND `base` is a non-empty existing file → print `{"resolved":false,"conflicts":[{"field":"<node>","ours":"<id>","theirs":null}]}` and do NOT write `--out`. Derive `<id>` from the ours path basename (`basename "$ours" .md`) to mirror the real script's `ours: ours.node.id` shape (this value is not asserted on by any test, but keep it faithful).
  - empty `theirs` AND empty/absent `base` → keep the existing ours-wins pass-through unchanged (genuine add/add).
- Update the adjacent code comment (lines 288-290) which currently claims empty `--theirs` means "ours wins outright" — correct it to describe the base-dependent branching.
- **Out of scope:** the rest of the `merge-node.ts` shim (the `key: value` three-way merge, lines 297-360) is untouched; the `*)` park helper emulation is Unit 2; the real `merge-node.ts` is untouched.

**Regression note to verify while implementing:** grep the file for existing callers that hit the empty-`--theirs` branch. Cases 13/21 (and 19/20) always pass a present `--theirs`, so they never reach this branch. The only path that reaches empty-`--theirs` is the layer-3 stale-`--base`-with-absent-origin path — which no *current* case exercises (Case 25, Unit 3, is the first). So this change cannot regress an existing green case; confirm by running the suite before Unit 3 exists and seeing the same pass count.

**Recommended model:** `sonnet` — well-specified, mechanical mirror of an existing documented branch into the shim, clear diff shape.

---

### Unit 2 — Downstream park-on-deleted-node handling (real script + shim, kept consistent)

**Scope**

*Real script* — `packages/intentionsutil/scripts/graph-commit`, `park_write()`'s inline tsx helper heredoc (`graph-commit:859-904`):
- Add `existsSync, copyFileSync` to the `node:fs` import (line 868) and `import { join } from "node:path"`.
- Replace the single-pass read at line 877 (`const nodes = ids.map((id) => readNode(intentionsDir, id))`) with a re-materializing pass that records which ids were delete/modify divergences:
  ```js
  const deletedSet = new Set();
  const nodes = ids.map((id) => {
    const filePath = join(intentionsDir, `${id}.md`);
    // Delete/modify divergence: a non-prune id whose target file is ABSENT
    // after park_and_exit's reset means the OTHER writer's already-landed
    // change deleted the node this session was editing. Re-materialize the
    // writer's snapshot at the target path FIRST so readNode succeeds AND
    // writeNode's readExistingBody preserves the writer's real authored body
    // instead of the `# ${statement}` placeholder (the data-loss trap).
    if (!pruneSet.has(id) && !existsSync(filePath)) {
      copyFileSync(join(snapDir, `${id}.md`), filePath);
      deletedSet.add(id);
    }
    return readNode(intentionsDir, id);
  });
  ```
- Extend the two-branch recommendation (`graph-commit:881-899`) to THREE branches. Keep the existing prune branch (keyed `pruneSet.has(id)`, 882-889) and ordinary branch (890-898) verbatim; add a middle branch keyed `deletedSet.has(id)`. The new text must: (a) name it a **delete/modify divergence** — the other writer's already-landed change deleted this node while this session's edit was in flight; (b) state the node was re-materialized from this session's in-flight edit and its authored body preserved; (c) point at the `${snapDir}/${id}.md` snapshot; (d) recommend the human decide whether to KEEP the re-materialized node (confirming the edit, re-run `graph-commit` on it) or CONFIRM the other writer's deletion (re-issue `graph-commit --prune ${id}`), noting whichever they land clears the park; (e) include the mailbox-discipline sentence. **Choose a stable distinguishing substring the Unit 3 test can grep — use the literal `delete/modify divergence`** (distinct from both existing branches, which use neither phrase). Because `readNode`/`writeNode` (`store.ts`) already preserve the body of an existing target file, no `assertNoBodyLoss` change is needed — the copy makes the target exist with the real body.

*Shim* — `packages/intentionsutil/scripts/test-graph-commit.sh`, the `*)` catch-all of the fake `npx` (lines 362-385), the independent duplicate of the same bug:
- In the existence-check loop (lines 365-367), for a non-prune id (`,$prune_csv,` does not contain the id) whose `$dir/$id.md` is absent but `$snap_dir/$id.md` exists, `cp` the snapshot into `$dir/$id.md` and record the id as a delete/modify divergence (e.g. append to a shell string/assoc set). Keep the existing hard error only when NEITHER the target nor the snapshot exists.
- In the write loop (lines 374-381), add the third recommendation branch (matching the same `pruneSet` / deleted / ordinary order) whose `rec` string contains the same distinguishing substring `delete/modify divergence`. The shim appends `office_hours` to `$dir/$id.md` (it does not run real `writeNode`), which is fine — the observable behavior (file exists at target, `office_hours` recorded, recommendation carries the substring) matches the real fix.
- The shim need not be byte-identical to the real helper — only its observable behavior for this case (file exists afterward; what lands in `office_hours.recommendation`) must match.

**Out of scope:** `park_and_exit()`'s fetch/reset/land structure (`graph-commit:920-958`) is unchanged — the fix is entirely inside `park_write`'s helper; `store.ts` is unchanged; the `merge-node.ts` shim branch (Unit 1) is unchanged.

**Dependencies:** Unit 1 (the real park only fires after the delete/modify guard reports unresolved; end-to-end validation of this unit through the suite needs the shim's merge-node branch fixed first).

**Recommended model:** `opus` — judgment-heavy: the body-loss trap, the requirement to keep the real heredoc and the shim behaviorally consistent, and the recommendation-text design decision are the "plan leaves decisions for implementation time" / tricky-ordering case.

---

### Unit 3 — Integration coverage: Case 25 (delete-first / edit-second)

**Scope**
- File: `packages/intentionsutil/scripts/test-graph-commit.sh`.
- Add one `seed_field_node` fixture near the existing fixtures (lines 152-155), e.g. `seed_field_node t-field-delete-edit "fieldA: base"`.
- Append a new **Case 25** after Case 24 (which ends at line 941) and before the "No scratch branches left behind" block (line 943). Mirror Case 23's structure/style (lines 900-921) but the OPPOSITE direction, using the `--base` inline form like Cases 21/22 and the `seed_field_node` real-frontmatter fixture:
  - Clone a writer, capture the base blob sha (`git -C "$W" hash-object intentions/t-field-delete-edit.md`), `edit_field` the node.
  - A second clone (`make_clone`) prunes the node (`rm -f` the file, `git commit -qam`, `git push -q origin main`) so the deletion lands first on origin/main.
  - Run `run_gc "$W" -m 'test: delete vs edit' --base "t-field-delete-edit=$sha" t-field-delete-edit`.
  - Assert: exit code `1`; the node still exists on `origin/main` afterward (`git -C "$ORIGIN" cat-file -e main:intentions/t-field-delete-edit.md`); `office_hours` recorded in `origin_show` content; the recommendation names the delete-vs-edit reconciliation (grep for the distinguishing substring `delete/modify divergence` chosen in Unit 2); and NO false resurrection / no false auto-resolve claim (`! grep -q 'layer 2/3 auto-resolved' <<<"$out"`).
  - Extract and register the snapshot dir for cleanup via the existing `SNAP_DIRS_TO_CLEAN` + `sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p'` pattern (as Cases 20/22/23 do).
- Optionally add a one-line entry to the case index in the header comment (lines ~10-77) describing Case 25.
- **Out of scope:** no changes to `graph-commit`, `merge-node.ts`, `store.ts`, or the shim (those are Units 1-2); reuse existing helpers, do not add new ones.

**Dependencies:** Units 1 and 2 (the case false-passes against an unfixed shim / false-fails against a fixed shim with an unfixed real script; both must land first).

**Recommended model:** `sonnet` — unit/integration-test writing with explicit cases mirroring an existing case, clear diff shape.

## Reuse

- `readNode`, `writeNode`, `readExistingBody`, `assertNoBodyLoss` — `packages/intentionsutil/src/store.ts` (lines 39, 62, 86, 101). Unit 2 relies on `writeNode`'s existing body-preservation via `readExistingBody`; do not modify these.
- `merge-node.ts` empty-`--theirs` guard and conflict shape — `packages/intentionsutil/scripts/merge-node.ts:74-78` (source of truth the Unit 1 shim mirrors). Do not modify.
- `snapshot()` (`graph-commit:346-354`), `check_base_freshness()` / `run_merge_node` / `STALE_BASE_UNRESOLVED` (`graph-commit:235-285`, call at 269), `park_and_exit()` (`graph-commit:920-958`), `build_recommendation()` (`graph-commit:793-806`) — the existing park machinery Unit 2 plugs into; only `park_write`'s helper body changes.
- Test helpers, all already in `test-graph-commit.sh`: `seed_field_node` (137-151), `make_clone` (162-166), `sync_clone`/`edit_field`/`edit_line`/`origin_show`/`origin_sha`/`gh_calls`/`scratch_refs` (390-401), `run_gc` (403+), `ok`/`no` (95-96), `SNAP_DIRS_TO_CLEAN` (88) and its `sed` snapshot-extraction idiom.
- Existing park-recommendation assertion patterns — Case 17 (751-775, prune-branch text), Case 20 (823-842), Case 22 (868-898), Case 23 (900-921, the opposite-direction structural template for Case 25).

## Verification

```verify
bash packages/intentionsutil/scripts/test-graph-commit.sh
```
Expect the final line `failed: 0` with every case green, including the new Case 25 (`PASS: delete-vs-edit ...`) and the pre-existing 24 cases and the scratch-branch check. Run it once after Unit 1 alone (same pass count as before — Unit 1 regresses nothing) and again after all three units.

Also run the real (non-shim) merge primitive's unit suite to confirm the untouched #2911 guard still holds:
```verify
cd packages/intentionsutil && npx vitest run test/node-merge.test.ts
```

**Manual guard-reversion sanity check (prose, not part of the automated suite).**
The bash suite drives the fake `npx`, so Case 25 is protected end-to-end by the shim's mirror of the guard (Unit 1), not by real `merge-node.ts` at runtime. To confirm Case 25 genuinely depends on the guard:
1. Temporarily revert Unit 1's shim branch — restore the old unconditional empty-`--theirs` "ours wins" block at `test-graph-commit.sh:288-295` (`cp -- "$ours" "$out"; printf '{"resolved":true,...}'`).
2. Re-run the suite (or isolate Case 25). Case 25 must now FAIL: with the guard gone the shim reports `resolved:true`, `check_base_freshness` cp's the merged content and continues, the edit LANDS (resurrecting the deleted node) with no park — so the exit code is 0, no `office_hours` / no `delete/modify divergence` substring appears, and a false auto-resolve occurs.
3. Restore the Unit 1 fix and re-run — Case 25 green again.
4. (Optional, covers the REAL guard directly.) Because the shim is a faithful mirror of `merge-node.ts:74-78`, additionally spot-check the real script: temporarily revert the #2911 guard in `merge-node.ts`, then manually run `npx tsx packages/intentionsutil/scripts/merge-node.ts --base <non-empty-node-file> --ours <node-file> --theirs "" --out /tmp/out` and confirm it now (wrongly) prints `{"resolved":true,...}` and writes `--out`; with the guard present it prints `{"resolved":false,...}` and writes nothing. Restore the guard. (`test/node-merge.test.ts` is the standing automated coverage of the real primitive.)
