---
id: tactic-park-node-rollback-dirty-tree-blocks-tick-sync
kind: tactic
statement: park-node's failure-rollback can leave a dirty, uncommitted file in
  the main checkout's intentions/, which then breaks dispatch-tick's own git
  merge --ff-only sync step for as long as the dirty file persists -- stalling
  all dispatch with no worker ever spawning
owner: ai
status: codified
parent: null
rationale: "Root-caused 2026-08-01T15:10Z from direct journald evidence during a
  health-read investigation: park-node set office_hours on
  tactic-fleet-alarm-mint-rollback-corruption, then graph-commit refused to
  start (\"unrelated dirty tracked file(s)\"), then park-node logged \"the
  office_hours write was rolled back\" -- but the VERY NEXT LINE shows git merge
  refusing because that same file still had an uncommitted local diff: \"Your
  local changes to the following files would be overwritten by merge:
  intentions/tactic-fleet-alarm-mint-rollback-corruption.md\". The claimed
  rollback did not actually clean the working tree. dispatch-select-tick then
  read sync-failed, armed a /commit-merge-push repair job, and every subsequent
  tick for as long as the dirty file persisted read sync-repair-pending --
  nothing is spawned during this window, regardless of what else is ready to
  run. This explains a real ~7-hour (2026-08-01 07:00Z-14:15Z) stretch of
  effective_live: null readings in routing-decisions.jsonl that was initially
  misattributed to a router undercount (a separate, already-closed defect,
  tactic-graph-router-live-worker-read-robust) before the real cause was traced.
  This is the same CLASS of bug as tactic-fleet-alarm-mint-rollback-corruption
  (a rollback path that logs success but does not actually restore a clean
  state) but a DIFFERENT producer (park-node, not dispatch-fleet-alarm) and a
  different blast radius (blocks the tick's own git sync fleet-wide, not
  listNodes())."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal:
  observable: park-node's failure-rollback path always leaves the main checkout's
    intentions/ tree clean (no uncommitted diff), verified by a fault-injection
    test that forces graph-commit to fail mid-park and then asserts git status
    --porcelain is empty afterward
  sensor: a new or extended park-node test suite with a fault-injection case for
    this exact failure path
  threshold: new fault-injection test case passes; existing suite unaffected;
    additionally, a full day passes on origin/main with no sync-failed or
    sync-repair-pending disposition in routing-decisions.jsonl caused by a dirty
    intentions/ file in the main checkout
  is_proxy: false
attention: null
phase: review
execution:
  branch: tactic-park-node-rollback-dirty-tree-blocks-tick-sync
  pr: 3043
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes: {}
---
# park-node's failure-rollback can leave a dirty, uncommitted file in the main checkout's intentions/, which then breaks dispatch-tick's own git merge --ff-only sync step for as long as the dirty file persists -- stalling all dispatch with no worker ever spawning

## Context

On 2026-08-01 the whole dispatch fleet stalled for ~7 hours (07:00Z–14:15Z, `effective_live: null` throughout `routing-decisions.jsonl`). Root cause, traced from journald:

1. `park-node` was invoked to park `tactic-fleet-alarm-mint-rollback-corruption`.
2. Its `graph-commit` call refused to start ("unrelated dirty tracked file(s)").
3. `park-node` logged `the office_hours write was rolled back` and exited 1.
4. The very next line shows `git merge --ff-only` refusing: *"Your local changes to the following files would be overwritten by merge: intentions/tactic-fleet-alarm-mint-rollback-corruption.md"*.

The claimed rollback did not clean the working tree. `dispatch-select-tick` then read `sync-failed`, armed a `/commit-merge-push` repair job, and every subsequent tick read `sync-repair-pending` — no worker spawns during that window regardless of what is ready to run. So a single leaked dirty file in the main checkout's `intentions/` is a fleet-wide halt.

**Why the rollback leaks.** `packages/intentionsutil/scripts/park-node:236-250` installs an EXIT trap that restores the node file from `FRESH_BLOB` — the blob it resolved from **origin/main** (`park-node:205`). But the comparison basis for "dirty" is the **local** checkout's index/HEAD: that is what `git merge --ff-only` refuses against, and what `graph-commit`'s `assert_clean_outside_ids` (`packages/intentionsutil/scripts/graph-commit:1668-1682`) tests via `git status --porcelain`. Whenever the local checkout's HEAD lags origin/main for that path — the exact condition `park-node`'s own "Fresh-origin/main invariant" (`park-node:23-34`) exists to handle — restoring origin/main's blob writes *newer-than-HEAD* content into the tree and leaves it **modified**, while logging success.

Two secondary gaps in the same block:

- The trap is installed only at `park-node:236`, **after** the origin/main refresh redirect at `park-node:223` has already overwritten the node file. A failed or partial refresh redirect therefore leaves a clobbered file with no rollback at all.
- `park-node:304` unconditionally prints `the office_hours write was rolled back` whenever `graph-commit` fails, regardless of whether the trap's restore later succeeds. In the incident that message was affirmatively false — worse than silence for anyone reading the log.

**The correct restore target is the file's own pre-touch bytes**, captured before the refresh overwrites them. That is not new design: `packages/intentionsutil/scripts/clear-park` — added two days *after* `park-node`'s trap, and described in `graph-commit`'s own header as park-node's "scripted inverse" — already does exactly this (`clear-park:152-199`), and its header (`clear-park:37-45`) literally documents why a `FRESH_BLOB` restore is wrong: *"a FRESH_BLOB restore would leave origin/main's content behind as a modification there […] A leaked dirty node file would trip graph-commit's assert_clean_outside_ids guard for every other unrelated node in that worktree."* `graph-commit`'s own printed remediation for this failure signature is `git checkout -- <path>` — restore to **local HEAD**, not to any origin/main blob.

**Existing test coverage is blind to this.** `test-park-node.sh:552-585` (Case 4) makes clone `D` a fresh clone taken immediately before the failing `park-node` run, so `FRESH_BLOB` and `D`'s HEAD blob are identical and the buggy restore is indistinguishable from a correct one. It also asserts with `git diff`, which compares worktree-vs-index and can mask exactly the index-vs-worktree mismatch that trips `git status --porcelain`. Baseline confirmed green today: 21/21 cases pass with the bug live.

### Greenfield design (stated, not built here)

Ideally the six scripts that do a fetch-refresh → mutate → land dance share **one** sourced bash helper — say `packages/intentionsutil/scripts/lib-node-file-rollback.sh` exposing `capture_node_original <dir> <id>` / `restore_node_original` — so the restore-target invariant is stated once and cannot drift per site. Today each site hand-rolls it, and five of the six hand-rolled it *wrong* (all restoring from origin/main): `park-node:236-250`, `.claude/skills/dispatch-propagate/scripts/transition-node:161-182`, `packages/intentionsutil/scripts/demote-node-to-implement:72-101`, `.claude/skills/dispatch-propagate/scripts/dispatch-graph-census:98-124`, `.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync:168-190`, plus `reconcile-graph-merged:123-188` (bulk variant, needs its own verification before assuming identical treatment).

### Brownfield path (what this plan builds)

The greenfield extraction spans six files, four of them under `.claude/skills/` (where commits are denied in auto mode), and this is a live-outage fix. So this PR does the narrow, high-urgency slice: fix `park-node` in place by porting `clear-park`'s already-battle-tested idiom verbatim, and make the test suite actually able to see the defect. **No file under `.claude/` is touched**, deliberately.

Out of scope, to be filed as follow-up tactics (do **not** widen this PR to them):

- Porting the same fix to the five sibling sites, and then the shared-helper extraction above.
- `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh` is **not wired into `.github/workflows/unit-tests.yml`** (verified: `unit-tests.yml:208-266` lists every harness; that one is absent). Its Case 1 assertion at line 224 has the same `git diff` blindness. Both are follow-ups.

---

## Unit 1 — `park-node`: restore to the file's pre-touch bytes, and stop claiming a rollback that may not have happened

**Recommended model:** opus

**Scope.** One file: `packages/intentionsutil/scripts/park-node`. Port `clear-park:152-199`'s `TMPORIG` / `ORIG_EXISTED` / `restore_node()` idiom, replacing the `FRESH_BLOB`-based restore. Four edits:

1. **Header prose.** Insert a new paragraph after the "Fresh-origin/main invariant" paragraph (ends `park-node:34`) and before "The park-recommendation contract" (`park-node:36`). Adapt `clear-park:37-45` — say that every exit path that does not land a commit restores `intentions/<node-id>.md` to the state this script *found* it in, from a pre-refresh copy, **not** from `FRESH_BLOB`, because a `FRESH_BLOB` restore leaves origin/main's content behind as a local modification in the far-behind checkout this script routinely runs from; and that such a leak trips `graph-commit`'s `assert_clean_outside_ids` for every other unrelated node *and* blocks `dispatch-tick`'s own `git merge --ff-only` sync fleet-wide.

2. **Move the temp-file/trap setup above the refresh block, and capture the pre-touch copy.** Currently `park-node:201-226` (fetch → `FRESH_BLOB` rev-parse → pin check → refresh redirect) runs *before* the `mktemp`/`MUTATED`/`trap` block at `park-node:228-250`. Reorder to mirror `clear-park` exactly:
   - `TMPTS` mktemp (as today, `park-node:229-230`), plus a new `TMPORIG` mktemp with its own failure message — copy `clear-park:152-159` verbatim, swapping the `clear-park:` message prefix for `park-node:`.
   - `ORIG_EXISTED` capture: copy `clear-park:160-168` verbatim (`cp` the node file to `TMPORIG` if it exists; on `cp` failure `rm -f "$TMPTS" "$TMPORIG"` and exit 1).
   - `restore_node()`: copy `clear-park:170-186` verbatim (`cp` to a `.rollback` sibling then `mv` into place on success only, so a failed restore never truncates; `rm -f` the node file when `ORIG_EXISTED=0`).
   - `MUTATED=0` and the EXIT trap: copy `clear-park:188-197`'s shape — trap body is `rc=$?; if [[ "$MUTATED" == 1 && $rc -ne 0 ]]; then restore_node; fi; rm -f "$TMPTS" "$TMPORIG"`.
   - Then the existing fetch (`park-node:201-204`), `FRESH_BLOB` rev-parse (`park-node:205-213`), and pin check (`park-node:218-221`) follow, unchanged.
   - Then `MUTATED=1` **immediately before** the refresh redirect (matching `clear-park:223-227`), so a failed/partial refresh redirect is now rolled back too.
   - The later `MUTATED=1` at `park-node:269` (just before the `npx tsx` write) becomes redundant; delete it or leave it as a harmless no-op, but do not move the `npx tsx` call itself.
   - `SINCE="$(date -u +%Y-%m-%d)"` (`park-node:228`) may sit anywhere before the heredoc; keep it adjacent to the heredoc.

3. **Fix the now-false comment at `park-node:215-217`.** It claims the pin check runs "before mktemp, before MUTATED is set, before the EXIT trap is installed" — after the reorder only the first clause survives in spirit. Replace with `clear-park:215-217`'s wording: the temp files and the EXIT trap already exist at this point, but the trap's restore is a no-op while `MUTATED` is still 0 and the node file has not been touched, so a stale pin still has zero side effects.

4. **Honest failure diagnostics.** Inside `restore_node()`'s failure branch (the `else` that `rm -f`s the `.rollback` sibling), emit a loud stderr line naming the node and the path, e.g. `park-node: CRITICAL — could not restore intentions/$NODE_ID.md from its pre-refresh copy; the working tree is left dirty and will block git merge --ff-only until cleaned`. Then reword `park-node:304`'s unconditional message so it does not assert an outcome the trap has not produced yet — e.g. `graph-commit failed for $NODE_ID; rolling back the office_hours write` (present-tense intent, not a completed-fact claim). Nothing else about the message contract changes.

**Explicitly out of scope for this unit:** `FRESH_BLOB` itself stays and is still used unchanged for the `--base` compare-and-swap and the `--expect` guard at `park-node:303`. Only the *rollback target* changes, never the CAS pin. Do not touch `clear-park`, `demote-node-to-implement`, `graph-commit`, or anything under `.claude/`.

**Invariants to preserve** (all already present in `clear-park`'s version): the `MUTATED` gate, so a pre-mutation failure never restores a file this script never touched; write-to-temp-then-`mv`, so a failed restore never truncates to zero bytes; the absent-local-file case restoring as a *delete*; `rm -f` of both temp files on every exit path.

---

## Unit 2 — regression test: stale local HEAD + forced `graph-commit` failure leaves a clean tree

**Recommended model:** sonnet

**Dependencies:** Unit 1.

**Scope.** One file: `packages/intentionsutil/scripts/test-park-node.sh`. Add a new Case 22 at the end of the file, immediately **before** the trailing `echo; echo "passed: $PASS  failed: $FAIL"` block (`test-park-node.sh:1024-1028`).

This case exists because Case 4 (`test-park-node.sh:552-585`) is structurally blind: `make_clone "$D" writer-d` is taken immediately before the failing run, so `FRESH_BLOB` equals `D`'s HEAD blob and the buggy restore and the correct restore are byte-identical. The new case must **make them differ**.

Construction, assembled from two idioms already in this file:

1. **Seed a new node.** Add `t-restore-stale` to the `for id in ...` seed list at `test-park-node.sh:191-192`. `seed_node` gives it 12 numbered lines, so `edit_line` works on it.

2. **Advance origin/main for that path through a second writer** — reuse the Case 1 idiom at `test-park-node.sh:424-436` verbatim: `S="$WORK/s"; make_clone "$S" writer-s; sync_clone "$S"; edit_line "$S" t-restore-stale 1 concurrent-advance`, then land it through the **real** `graph-commit` inside the same subshell env block Case 1 uses (`cd "$S"`, `export PATH="$WORK/bin:$PATH" GC_FIXTURE_DIR="$FIXTURE_DIR"`, `export GRAPH_COMMIT_CHECK_POLL_SECONDS=0 GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5`, `bash packages/intentionsutil/scripts/graph-commit -m 'test: land concurrent advance' t-restore-stale`), output discarded.

3. **The writer under test is cloned BEFORE that advance and never synced.** `R="$WORK/r"; make_clone "$R" writer-r` must run **before** step 2's land (or before `sync_clone "$S"`), and `sync_clone "$R"` must never be called. `park-node`'s own `git fetch origin main` moves `R`'s `origin/main` ref but not its HEAD or worktree — which is precisely the production condition.

4. **Assert the precondition, or the case is vacuous.** Before invoking `park-node`, compare `git -C "$R" rev-parse HEAD:intentions/t-restore-stale.md` against `git -C "$ORIGIN" rev-parse main:intentions/t-restore-stale.md`. If they are **equal**, call `no "..."` with an explicit "fixture degenerate — local HEAD blob equals origin/main blob, this case cannot distinguish the two restore targets" message and skip the rest. This guard is the whole reason the case exists; without it a future refactor silently re-creates Case 4's blindness.

5. **Force the failure.** Reuse the Case 4 wrapper-swap idiom verbatim (`test-park-node.sh:564-571`): `mv` `$R/packages/intentionsutil/scripts/graph-commit` to `graph-commit.real`, write the unconditional `echo ... >&2; exit 1` stub, `chmod +x`. The stub is untracked in `R`'s index, so `assert_clean_outside_ids`'s `??` exemption covers it — no commit needed.

6. **Run and assert.** `out="$(run_pn "$R" t-restore-stale 'simulated post-mutation failure with stale local HEAD' 2>&1)"; rc=$?`. Then `porcelain_after="$(git -C "$R" status --porcelain -- intentions/)"`. Pass requires: `rc -ne 0`, the rollback message present in `$out`, and `porcelain_after` **empty**. Use `git status --porcelain` scoped to the `intentions/` **directory**, not `git diff` on the single path — `status` is what `assert_clean_outside_ids` and `git merge --ff-only` actually consult, it catches index-vs-worktree mismatch, and the directory scope makes a leaked untracked `.rollback` sibling show up as `??`. On failure, `printf` both `$out` and `porcelain_after` in the `no` branch, matching the surrounding cases' style.

7. **Document it.** Add a `#  22.` entry to the header `Covers:` list after entry 21 (`test-park-node.sh:110-113`), stating what makes this case different from Case 4: the local HEAD blob deliberately lags origin/main for the target path, so a restore from origin/main's blob leaves the tree dirty and a restore from the pre-touch local copy does not.

**Out of scope:** do not modify Case 4's fixture (`D` stays a fresh clone — it still guards the same-blob path); do not touch `park-node` itself in this unit.

**Reproduction proof (required, no commit).** After the case is written, prove it actually catches the bug: in the worktree, `git checkout <the commit before Unit 1's> -- packages/intentionsutil/scripts/park-node`, run the suite, confirm the new Case 22 **fails** and no other case regresses, then `git checkout HEAD -- packages/intentionsutil/scripts/park-node` and confirm the full suite is green again. Nothing about the temporary revert is committed. If Case 22 passes against the pre-fix `park-node`, the fixture is wrong — fix the fixture, never the assertion.

---

## Unit 3 — harden the existing rollback assertions from `git diff` to `git status --porcelain`

**Recommended model:** sonnet

**Dependencies:** Unit 2 (avoids editing the same file concurrently).

**Scope.** One file: `packages/intentionsutil/scripts/test-park-node.sh`. Six assertion sites currently use `git -C "$CLONE" diff -- intentions/<id>.md`, which compares worktree-vs-index and cannot see an index-vs-worktree mismatch or a leaked untracked sibling:

- `:578` (Case 4, `$D`, `t-stale`) — park-node rollback
- `:609` (Case 5, `$G`, `t-demote`) — demote-node-to-implement rollback
- `:748` (Case 13, `$H`, `t-pinned`) — stale-pin, zero side effects
- `:862` (Case 17, `$M_CLEAR`, `t-clear-happy`) — clear-park idempotent no-op
- `:896` (Case 18, `$N_CLEAR`, `t-clear-rollback`) — clear-park rollback
- `:924` (Case 19, `$P_PIN`, `t-clear-pinned`) — stale-pin, zero side effects

For **all six**, replace the command with `git -C "$CLONE" status --porcelain -- intentions/<same-id>.md` (keep the per-file path scope), rename the variable to `porcelain_after`, and update both its `[[ -z ... ]]` use and the `printf 'diff: %s\n'` label in the `no` branch.

For the **three clones that land nothing at all** — `$D` (Case 4), `$G` (Case 5), `$N_CLEAR` (Case 18) — add a *second*, directory-wide assertion `[[ -z "$(git -C "$CLONE" status --porcelain -- intentions/)" ]]` alongside the per-file one, so a stray untracked `intentions/<id>.md.rollback` left behind by a half-completed restore fails the case. Do **not** add the directory-wide form to Cases 13, 17, and 19: those clones (`$H`, `$M_CLEAR`, `$P_PIN`) have already landed a successful `graph-commit` earlier in the same case sequence, and widening their scope would assert something about `graph-commit`'s post-land tree state that is not what these cases are testing.

Finally, update the affected `ok "..."` strings and the header `Covers:` prose that currently say "(git diff empty)" / "no local diff" (entries 13, 17, 18, 19 at `test-park-node.sh:68-97`) to say `git status --porcelain` instead.

**If any of these six newly fails after the substitution, that is a real finding — report it and investigate.** Do not revert to `git diff` and do not narrow the scope to make it green (`.claude/rules/test-integrity.md`).

**Out of scope:** `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh:224` has the identical `git diff` weakness, but that harness lives under `.claude/skills/` (commits there are denied in auto mode) and is not wired into CI at all. Leave it; it is a named follow-up in Context.

---

## Reuse

- `packages/intentionsutil/scripts/clear-park:152-199` — `TMPORIG` mktemp, `ORIG_EXISTED` capture, `restore_node()`, `MUTATED=0` + EXIT trap. **This is the primary reuse target**: port it into `park-node` rather than inventing a restore mechanism. Battle-tested since 2026-07-25 and already covered by Cases 17 and 18.
- `packages/intentionsutil/scripts/clear-park:37-45` — the header rationale for why a `FRESH_BLOB` restore is wrong. Adapt this prose for `park-node`'s header rather than re-deriving the argument.
- `packages/intentionsutil/scripts/clear-park:215-217` — the corrected "stale pin has zero side effects even though the trap already exists" comment wording.
- `packages/intentionsutil/scripts/clear-park:223-227` — `MUTATED=1` set *before* the origin/main refresh redirect, closing the partial-refresh gap.
- `packages/intentionsutil/scripts/graph-commit:1668-1682` (`assert_clean_outside_ids`) — the authority for *why* `git status --porcelain` against the local index/HEAD, not origin/main, is the definition of "dirty" here.
- `packages/intentionsutil/scripts/graph-commit:1636-1721` (`_offending_path_is_marker_only_residue`) — detects this exact failure signature and prints `git checkout -- <path>` as its remediation, i.e. restore-to-local-HEAD.
- `packages/intentionsutil/scripts/test-park-node.sh:424-436` (Case 1) — the two-writer "land a concurrent advance on origin through the real graph-commit while the writer under test stays un-refreshed" scaffolding. Reuse this shape for Unit 2 rather than building a bare-remote fixture from scratch.
- `packages/intentionsutil/scripts/test-park-node.sh:564-571` (Case 4) — the `mv graph-commit graph-commit.real` + unconditional-`exit 1` stub fault-injection idiom, used identically in Cases 5 and 18.
- `packages/intentionsutil/scripts/test-park-node.sh:184-193` (`seed_node` + the seed id loop), `:223-235` (`make_clone`), `:369` (`sync_clone`), `:370-372` (`edit_line`), `:374-386` (`run_pn`), `:142-143` (`ok`/`no`) — all existing harness helpers Unit 2 composes without modification.
- `packages/intentionsutil/scripts/test-park-node.sh:983-989` (Case 20's `porcelain_a` assertion) — the in-file precedent for `git status --porcelain -- intentions/` as the tree-cleanliness assertion Unit 3 standardizes on.

## Verification

Baseline before any change: 21 cases, all passing, with the defect live — so a green suite alone proves nothing. Unit 2's reproduction proof (described in that unit) is what establishes the new case has teeth.

```verify
packages/intentionsutil/scripts/test-park-node.sh
```

```verify
packages/intentionsutil/scripts/test-transition-node.sh
```

```verify
packages/intentionsutil/scripts/test-graph-commit.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Expected after all three units: `passed: 22  failed: 0` from `test-park-node.sh`; the other two harnesses and the linter unchanged from baseline. `test-transition-node.sh` and `test-graph-commit.sh` are included as blast-radius guards — neither script is edited, so a failure there means an unintended change.

Manual / judgment steps:

- **Prove the fixture is not degenerate.** Read Case 22's precondition guard output. If the guard's `no` branch ever fires ("fixture degenerate"), the case is asserting nothing regardless of the suite exit code.
- **Prove the case reproduces.** Run Unit 2's temporary-revert procedure (`git checkout <pre-Unit-1 sha> -- packages/intentionsutil/scripts/park-node`, run the suite, expect Case 22 red and everything else green, then restore). This is the only evidence that the new coverage would have caught the 2026-08-01 outage.
- **Manual end-to-end sanity on a real checkout** (optional but cheap): in a scratch clone whose HEAD is deliberately a few commits behind `origin/main` for some `intentions/<id>.md`, run `park-node` against that id with `graph-commit` temporarily shadowed by a failing stub on `PATH`, then run `git status --porcelain -- intentions/` and confirm it is empty and `git merge --ff-only origin/main` succeeds. Under the pre-fix code the merge refuses with "Your local changes to the following files would be overwritten by merge".

Observe-in-production (main-qa territory, not autonomously verifiable in this PR — this is the second half of the node's own `threshold`): after the fix lands on `origin/main`, a full day should pass with no `sync-failed` or `sync-repair-pending` disposition in `routing-decisions.jsonl` attributable to a dirty `intentions/` file in the main checkout. Note that this signal is *necessary but not sufficient*: the five sibling scripts named in Context can independently produce the same leak, so a recurrence during the observation window does not by itself falsify this fix — check which producer's log line precedes the dirty file before attributing it.
