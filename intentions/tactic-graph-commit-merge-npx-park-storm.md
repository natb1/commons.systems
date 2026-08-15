---
id: tactic-graph-commit-merge-npx-park-storm
kind: tactic
statement: graph-commit's far-ahead replay now routes every divergent node
  through run_merge_node (npx tsx merge-node.ts); when npx cannot run (sandbox
  EROFS, cold cache, registry outage) the merge crash is treated as an
  unresolvable divergence and pushed to main as an office_hours park instead of
  a clear environment error, turning a transient npx failure into a fleet-wide
  park storm
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
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# A merge tool that cannot launch must die with an environment error, never push an `office_hours` park

## Context

`graph-commit`'s three auto-merge paths all funnel through one primitive,
`run_merge_node()`, which shells out to `merge-node.ts` via **`npx tsx`**.
`run_merge_node()` deliberately never dies: on a non-zero exit **or** unparsable
stdout it appends a generic `{id, note: "could not attempt structural merge"}`
sentinel and returns 1 — the same return every caller reads as *"this node's
content genuinely diverged and cannot be auto-merged."* Every caller then fails
closed into `park_and_exit()`, which fetches, resets, writes `office_hours` onto
every id, **commits and pushes that park to protected `main`**, and exits 1.

`npx` is not a reliable primitive under this fleet's execution environment.
Per `.claude/rules/sandbox.md` it fails with `EROFS` writing `~/.npm/_cacache`,
and it reaches the npm registry whenever the package is not already resolvable
locally. `packages/intentionsutil/scripts/verify-landed:246-250` records a
second, independent failure mode measured on this host: *"the tsx CLI opens an
IPC unix socket at start-up, which a sandboxed caller cannot do (EPERM)."*
`graph-commit` is invoked from sandboxed Bash calls constantly.

So anything that denies npm-registry/cache access — sandbox policy, a cold
cache, a registry outage — converts **every** graph write that touches a
concurrently-moved node into a pushed `office_hours` park plus a hard failure:
a self-inflicted park storm across the fleet, with the parks landing on `main`
as durable state a human must then drain. This is exactly the inverse of
`.claude/rules/code-style.md`: a broken environment is a clear error, not graph
state to write.

### Provenance (carried forward — still accurate, re-validated 2026-08-14)

- Surfaced by the `review-fix` pass on PR #2989 (source tactic
  `tactic-graph-commit-intentions-base-stale-restore`), red-team finder,
  disposition `Deferred` — out of scope for that PR: a pre-existing weakness in
  a primitive the PR newly routed a common path through, not a defect the PR's
  own diff introduced.
- **Adversarial caveat, still standing:** the finding was classified `Deferred`
  (advisory), so it never went through the adversarial skeptic verify stage —
  only `Required` findings do. The mechanism below has since been read directly
  in the source and measured on this host (see Design), so it is no longer
  merely "filed for triage" — but the original finding carried no skeptic pass.
- The 2026-08-14 re-validation **widened** the blast radius the draft recorded.
  The draft named only the far-ahead replay path added by PR #2989. There are
  in fact **three** call sites of `run_merge_node()`, all three of which park:
  the layer-2 rebase-conflict path, the layer-3 stale-`--base` path, and the
  far-ahead rebuild. Fixing the shared primitive covers all three.

### Path anchors (verified against `origin/main` on 2026-08-14)

Line numbers drift; re-verify each anchor before editing at it.

- `packages/intentionsutil/scripts/graph-commit:989-1014` — `run_merge_node()`,
  **the bug site**. The `npx tsx` spawn is line **995**; the crash-folded-into-
  conflict branch is lines **1000-1003**; the doc comment stating the current
  (wrong) contract is **978-988**.
- `packages/intentionsutil/scripts/graph-commit:2298` — call site 1,
  `try_layer2_resolve()` (rebase-conflict / layer 2). Stage-numbering note at
  `:2281-2292` explains the base/ours/theirs inversion; do not disturb it.
- `packages/intentionsutil/scripts/graph-commit:793` — call site 2,
  `check_base_freshness()` (layer 3, stale `--base`); it sets
  `STALE_BASE_UNRESOLVED=1` and calls `park_and_exit()` at `:820`.
- `packages/intentionsutil/scripts/graph-commit:1203` — call site 3,
  `replay_snapshot_onto_base()` (far-ahead rebuild); its caller
  `ensure_intentions_only_base()` (`:1213-1261`) aggregates `unresolved=1` and
  calls `park_and_exit()` at `:1259`.
- `packages/intentionsutil/scripts/graph-commit:995` and `:2968` — the two
  `npx tsx` spawns in the whole file (`run_merge_node()` and `park_write()`'s
  throwaway store helper). Both are runtime registry dependencies on the write
  path.
- `packages/intentionsutil/scripts/graph-commit:334-336` — `STORE_MODULE` and
  `MERGE_NODE_SCRIPT`, both resolved from `SCRIPT_DIR`, deliberately **not**
  from `REPO_ROOT`. Any replacement invocation form must preserve that.
- `packages/intentionsutil/scripts/merge-node.ts:10-16` — the documented
  stdout/exit contract; `:100-108` — the main-guard and the catch that currently
  `process.exit(1)`s on the tool's own failure.
- `packages/intentionsutil/scripts/test-graph-commit.sh:674-882` — the `npx`
  PATH shim; `:885` `set_mode()`; `:900-965` `run_gc()`.

### Intended outcome

A `graph-commit` invocation whose merge tool cannot execute exits 1 with a
descriptive environment error naming the captured stderr, writes **no**
`office_hours` block, and pushes **nothing** to `main` — while a genuine content
divergence still parks exactly as it does today. And the write path stops
depending on the npm registry at run time at all, so the failure mode is mostly
designed out rather than only handled.

## Design

**Greenfield (what this plan builds):** the graph write path spawns TypeScript
through the ESM loader form, `node --import tsx/esm <script>`, which needs no
npm resolution at run time and opens no IPC socket — and the merge primitive
reports *"I ran and failed on these inputs"* with a **reserved exit code**,
distinct from every way a process can fail to start, so its caller can route the
two outcomes to different destinations (park vs. die).

Two measured facts forced this shape and rule out the obvious alternatives:

1. **`node_modules/.bin/tsx` does not fix it.** It resolves (tsx@4.22.4, root
   `package.json` `"tsx": "^4.19.0"`) and avoids npm's resolution step, but it
   runs the same tsx **CLI** that opens the IPC unix socket `verify-landed:248`
   identifies as the EPERM cause under sandboxing. Only the loader form
   (`--import tsx/esm`) avoids it. Confirmed working:
   `node --import tsx/esm packages/intentionsutil/scripts/merge-node.ts …`
   runs `merge-node.ts` unchanged — its `process.argv.slice(2)` parsing
   (`merge-node.ts:45`) and `pathToFileURL` main-guard (`:100`) are already
   compatible, and `packages/intentionsutil/package.json:5` is `"type":
   "module"`. Every `.claude/worktrees/*` checkout carries `node_modules`, so
   the loader resolves from a worktree too.
2. **Exit code 1 is ambiguous and cannot be the discriminator.** Measured on
   this host on 2026-08-14: running the loader form from a directory where
   `tsx` is unresolvable exits **1** with `ERR_MODULE_NOT_FOUND` on stderr and
   zero bytes on stdout — byte-for-byte the same rc as `merge-node.ts`'s own
   caught failure (`merge-node.ts:106` `process.exit(1)`). So "rc != 0" cannot
   separate the two, and neither can "rc == 127" (a loader failure is not 127).
   The tool must therefore **claim** its own failures with a code nothing else
   emits. Reserved code: **3**.

Rule, after the fix: `rc == 0` + parsable JSON → normal resolved/unresolved
handling. `rc == 3` → the tool ran and failed on **its inputs** → content-shaped
→ keep today's `append_conflicts` + `return 1` (so a stale `--base` on a node
absent from the checkout still parks, as `test-graph-commit.sh` Case 47
requires). **Any other outcome** — a different non-zero rc, or rc 0 with
unparsable stdout — → the tool could not run, or broke its contract → `die()`
with the captured stderr. Misclassification errs toward `die`, never toward a
spurious park; that direction is deliberate and must be preserved.

**Brownfield:** none needed. There is no data migration and no compatibility
surface — `merge-node.ts` has exactly one caller in the repo (`run_merge_node`),
and the change is a single PR. The units below are ordered only so the test
harness never goes red between commits.

**Two verified premises the implementer may rely on:**

- **Dying from inside `run_merge_node()` is safe from all three call sites.**
  `cleanup()` (the EXIT trap) aborts a rebase this run stranded *before* any
  reset, restores `ORIG_HEAD` when `RESTORE_HEAD=1`, and releases the landing
  lock. `ensure_intentions_only_base()` sets `ORIG_HEAD`/`RESTORE_HEAD` at
  `:1223-1224` **before** its `git reset --hard` at `:1234`, exactly so a
  non-return from inside still restores the worktree to its PR tip.
- **The die path must preserve the writer's content.** `KEEP_SNAP` defaults to
  `0` (`graph-commit:443`) and only `park_and_exit()` sets it to `1`
  (`:3038`), so a plain `die()` deletes `SNAP_DIR`. On the far-ahead path
  `SNAP_DIR` is the **only** surviving copy of an uncommitted writer edit once
  `git reset --hard "$MAIN_SHA"` has run. Clarification 237 records `snapshot()`
  as "still the sole surviving copy of a writer's content on the fail-closed
  park path"; this plan extends the same guarantee to the fail-closed **die**
  path. `SNAP_DIR` is a `mktemp -d` outside the checkout, so keeping it does not
  violate clarification 91's "a failed graph write leaves no residue in the
  shared checkout."

---

## Unit 1 — Remove the run-time npm-registry dependency from both `graph-commit` tsx spawns

**Scope**

Production change, `packages/intentionsutil/scripts/graph-commit`:

- Line **995**, in `run_merge_node()`, replace the spawn with the loader form,
  run from `SCRIPT_DIR` so the bare `tsx/esm` specifier resolves (this is
  `verify-landed:250`'s form verbatim):

  ```bash
  captured="$( (cd "$SCRIPT_DIR" && node --import tsx/esm "$MERGE_NODE_SCRIPT" \
      --base "$base" --ours "$ours" --theirs "$theirs" --out "$out") )" || rc=$?
  ```

  Safe because every path `run_merge_node()` is handed is already absolute:
  `SNAP_DIR` is a `mktemp -d` (`:3479`) and `INTENTIONS_DIR` is
  `"$REPO_ROOT/intentions"` (`:3389`) with `REPO_ROOT` from
  `git rev-parse --show-toplevel` (`:3386`). Verify this before relying on it.
- Line **2968**, in `park_write()`, the same swap for the throwaway store
  helper. **Syntax trap:** `VAR=x ( … )` is not valid bash — an env prefix
  cannot be applied to a subshell. Move the assignments inside:

  ```bash
  if ! ( cd "$SCRIPT_DIR" \
         && GRAPH_COMMIT_RECOMMENDATION_FILE="$rec_file" \
            GRAPH_COMMIT_RESURRECTED_FILE="$resurrected_file" \
            node --import tsx/esm "$tmpts" "$STORE_MODULE" "$INTENTIONS_DIR" \
              "$since" "$reason" "$SNAP_DIR" "$prune_csv" "$@" ) >&2; then
  ```

  `$tmpts` and `$STORE_MODULE` are already absolute; `STORE_MODULE`
  (`:334`) must keep resolving from `SCRIPT_DIR`, unchanged.
- Update the comment at `:764` that calls a doomed merge attempt "a doomed
  `npx tsx` spawn" so it no longer names a mechanism the file no longer uses.

Harness change, `packages/intentionsutil/scripts/test-graph-commit.sh`:

- Rename the shim `$WORK/bin/npx` (heredoc at `:674-881`) to `$WORK/bin/node`,
  keeping its whole body. Write the real node's absolute path into the shim
  **before** the quoted heredoc, so the passthrough cannot recurse through the
  shimmed PATH:

  ```bash
  printf '#!/usr/bin/env bash\nREAL_NODE=%q\n' "$(command -v node)" >"$WORK/bin/node"
  cat >>"$WORK/bin/node" <<'SH'
  ```

  (drop the `#!/usr/bin/env bash` line from the heredoc body, since the
  `printf` now supplies it).
- Replace the guard at `:706`
  (`[[ "$1" == "tsx" ]] || { echo "npx shim: …" >&2; exit 1; }`) with:

  ```bash
  if [[ "$1" == "--import" && "$2" == "tsx/esm" ]]; then
    shift 2
    set -- tsx "$@"          # re-shape argv to what the body below already parses
  else
    exec "$REAL_NODE" "$@"   # any other node invocation runs for real
  fi
  ```

  The `set -- tsx "$@"` re-shaping is deliberate: it leaves **the entire
  existing shim body — both the `merge-node.ts` branch and the `*`
  `park_write` branch, including their `shift 2` / `shift 3` offsets —
  byte-identical**, so this unit cannot change any existing case's semantics.
- Add a **hard-failing `$WORK/bin/npx`** in its place — `echo 'npx shim: npx
  must not be invoked by graph-commit (see
  tactic-graph-commit-merge-npx-park-storm)' >&2; exit 127` — so any future
  regression to `npx` fails the suite loudly instead of silently reaching the
  host's real npx.
- Update `chmod +x "$WORK/bin/gh" "$WORK/bin/npx"` (`:882`) to also chmod
  `$WORK/bin/node`.

**Out of scope:** the discrimination logic itself (Unit 2); any change to
`merge-node.ts`; any change to `node-merge.ts`'s merge semantics; any change to
what the shim's two branches compute; any other `npx`/`tsx` call site elsewhere
in the repo.

**Recommended model:** sonnet

---

## Unit 2 — Distinguish "the merge tool could not run" from "content diverged", and die on the former

**Scope**

`packages/intentionsutil/scripts/merge-node.ts`:

- `:106` — change the catch's `process.exit(1)` to `process.exit(3)`. The
  stderr line (`merge-node: <message>`) stays as-is.
- `:10-16` — rewrite the output contract to state the reserved code: exit 0 with
  one line of JSON for both resolved and unresolved; **exit 3** for a failure of
  this tool on its inputs (unparseable frontmatter, missing required arg,
  unreadable path); and that **any other exit status means this program never
  ran**, which is a caller-visible environment failure and not a content
  outcome. Say why 3 rather than 1: a module-resolution failure of the loader
  itself also exits 1, so 1 cannot be claimed.

`packages/intentionsutil/scripts/graph-commit`, `run_merge_node()`
(`:989-1014`):

- Capture stderr separately into a file under `SNAP_DIR` (it already holds this
  primitive's tempfiles, and `cleanup()` removes it) so the die message can
  surface it. Keep letting it reach the terminal too, or `cat` it into the die
  message — do not swallow it.
- Replace the branch at `:1000-1003` with three-way routing:
  - `rc == 3` → today's behavior, unchanged: `append_conflicts` with the
    generic `"could not attempt structural merge"` sentinel and `return 1`.
    Reword that sentinel to say the merge tool **ran and rejected these
    inputs**, so a parked human is not told a tool crash was a divergence.
  - `rc == 0` **and** stdout parses as JSON → fall through to the existing
    resolved/unresolved handling, unchanged.
  - anything else → set `KEEP_SNAP=1` (so a far-ahead die does not delete the
    writer's only surviving copy — see Design) and `die` with a message that
    names the node id, states that the field-level merge tool could not be
    executed, quotes the captured stderr, and says explicitly that **no
    `office_hours` park was written and nothing was pushed**.
- Rewrite the doc comment at `:978-988`. Today it asserts "NEVER dies"; that is
  now false and must not be left standing. State the new contract: never dies
  for a **content** outcome; **always** dies when the tool could not be
  executed. Keep the existing `shell-json.md` note about capturing stdout into a
  variable and parsing via a here-string.

Use the existing `die()` at `graph-commit:592-605` — it prints
`error: graph-commit: …` to stderr, emits `print_verdict die`, and exits 1 with
no `office_hours` write. Do **not** use `plumb_die()` (`:1448`); it exists only
to clear `TMP_INDEX_DIR` for `build_commit_plumbing()`'s command-substitution
subshell, which is unrelated to this path.

`packages/intentionsutil/scripts/test-graph-commit.sh` — keep the suite green
under the new contract:

- In the shim's `merge-node.ts` branch, change the missing-`--ours` guard
  (`:727-730`) from `exit 1` to **`exit 3`**, and update its comment, which
  currently cites `merge-node.ts:14-16` as the crash contract it mirrors. This
  is load-bearing: **Case 47** (`:2203-2244`) depends on a nonexistent `--ours`
  producing a *park*, and under the new rule only exit 3 still does.

**Out of scope:** changing which fields `mergeIntentionNodes` can resolve;
`FieldConflict`'s shape (`packages/intentionsutil/src/node-merge.ts:14-19`) —
`tactic-node-merge-list-removal-loss` owns that and is at phase `implement`;
the shape or content of `park_and_exit()`'s park record; any new test case
(Unit 3).

**Recommended model:** opus

**Dependencies:** Unit 1.

---

## Unit 3 — Regression coverage: no park on an unrunnable merge tool, park preserved on a real divergence

**Scope** — `packages/intentionsutil/scripts/test-graph-commit.sh` only.

Add a launch-failure knob to the `$WORK/bin/node` shim: when
`GC_MERGE_NODE_UNRUNNABLE` is set in the environment, the shim — **before**
dispatching on the script path, so it models a process that never started —
writes a distinctive line to stderr (e.g.
`node: ERR_MODULE_NOT_FOUND: Cannot find package 'tsx'`), writes nothing to
stdout, and exits **1**. Exit 1 deliberately, not 127: it proves the
discriminator does not rely on a special code and would have been invisible to
a naive `rc != 0` / `rc == 127` test. Export it from `run_gc()` (`:900-965`)
alongside the existing `GC_*` knobs.

Then add these cases, following the harness's existing shapes:

1. **Layer 3 (stale `--base`), merge tool unrunnable → die, nothing parked.**
   Model on **Case 47** (`:2203-2244`) for setup — `set_mode green`,
   `make_clone`, a second clone landing a concurrent edit, a stale `--base`
   manifest, `run_gc` — but invert every assertion: `rc == 1`; stderr matches
   the new environment-failure text; and, positively,
   `! grep -q office_hours <<<"$(origin_show <id>)"` for **every** touched id
   plus `origin_sha` unchanged from before the run. Assert both — a suite that
   only checks stderr would not have caught the storm. **Case 6**
   (`:1111-1123`) is the pattern for asserting a clean die with surfaced stderr.
2. **Far-ahead rebuild, merge tool unrunnable → die, HEAD restored, snapshot
   kept.** Reuse Case 48's far-ahead setup (a worktree HEAD ahead of
   origin/main with a non-`intentions/` change, so
   `ensure_intentions_only_base()` runs). Assert `rc == 1`, no `office_hours`
   on origin `main`, that the clone's HEAD is back at its pre-run SHA
   (`ORIG_HEAD` restored by `cleanup()`), and that the snapshot path named in
   stderr still exists on disk. Append that path to `SNAP_DIRS_TO_CLEAN` as the
   other cases do.
3. **Real divergence still parks (no regression).** With the knob unset, drive
   a genuine field-level conflict through the layer-3 path and assert the park
   lands on origin `main` exactly as today — the guard against "fixed the storm
   by never parking."
4. **`npx` is not on the write path.** Assert the hard-failing `npx` shim from
   Unit 1 was never invoked during a full happy-path `run_gc` (have that shim
   append to a call-log file and assert the log is empty), so a silent revert to
   `npx` fails a test rather than only a grep.

Follow `.claude/rules/shell-json.md` in every added line — this is a committed
`.sh` file and net-new added lines are mechanically linted: never
`echo "$VAR" | jq`; use `jq … <<<"$VAR"`.

**Out of scope:** restructuring existing cases beyond the Unit 2 shim change;
new coverage for `node-merge.ts`'s merge semantics (`test/node-merge.test.ts`
owns that).

**Recommended model:** sonnet

**Dependencies:** Units 1 and 2.

---

## Reuse

- `packages/intentionsutil/scripts/verify-landed:246-250` — **the prior-art fix
  for this exact failure class**, with the reason recorded inline: *"`node
  --import tsx/esm` (resolve-hold's form), not `npx tsx`: the tsx CLI opens an
  IPC unix socket at start-up, which a sandboxed caller cannot do (EPERM)…
  The loader form needs no socket."* Its `(cd "$SCRIPT_DIR" && node --import
  tsx/esm …)` shape is what Unit 1 copies. Unlike `verify-landed`'s own case,
  `merge-node.ts` needs no heredoc wrapper module.
- `packages/intentionsutil/scripts/hold-node:108,230,243,286,295` and
  `resolve-hold:315,343,412,459` — eight further `(cd "$REPO_ROOT" && node
  --import tsx/esm …)` call sites; the form is already this package's norm.
- `packages/intentionsutil/scripts/graph-commit:592-605` — `die()`. Reuse
  directly; it is precisely the "clear error, no park, no fallback" exit the
  fix needs, and its deliberate verdict asymmetry is already documented there.
- `packages/intentionsutil/scripts/graph-commit:759-772` — the prune early-out
  in `check_base_freshness()`. Existing in-file precedent for special-casing a
  doomed spawn with its own **accurate** sentinel rather than letting it reach
  `run_merge_node()`'s generic crash message. Mirror its comment style.
- `packages/intentionsutil/scripts/graph-commit:395-397` —
  `MAX_PUSH_ATTEMPTS="${GRAPH_COMMIT_MAX_ATTEMPTS:-5}"`, "Overridable for
  tests." The precedent if any env-var seam turns out to be needed; the design
  above avoids needing one.
- `packages/intentionsutil/scripts/graph-commit:3038` / `:443` — `KEEP_SNAP`,
  the existing mechanism for preserving a writer's unlanded content past a
  fail-closed exit. Unit 2 reuses it rather than inventing a second one.
- `packages/intentionsutil/scripts/test-graph-commit.sh:2203-2244` (Case 47,
  crash-to-park setup), `:1111-1123` (Case 6, die-with-surfaced-stderr
  assertions), `:1097-1108` (Case 5, single-attempt die), `:885` `set_mode()`,
  `:900-965` `run_gc()`, `:889` `origin_show()`/`origin_sha()` — the harness
  shapes Unit 3 composes.
- `packages/intentionsutil/scripts/merge-node.ts:45,100` — argv parsing and
  main-guard; both already compatible with the loader form, no TS-side change
  needed beyond the exit code.

## Verification

Auto-runnable:

```verify
packages/intentionsutil/scripts/test-graph-commit.sh
```

```verify
npm test --prefix packages/intentionsutil
```

```verify
bash -c '! grep -qE "^[^#]*npx " packages/intentionsutil/scripts/graph-commit'
```

(`test-graph-commit.sh` is wired into CI at
`.github/workflows/unit-tests.yml:266`. The `--project` vitest flag is
apps-only; this is a package, hence `npm test --prefix`.)

Manual / judgment:

- **Reproduce the storm before fixing it.** On a scratch clone, stub `npx` on
  `PATH` with `exit 1`, drive a concurrently-moved node through the layer-3
  `--base` path, and confirm the pre-fix behavior: a pushed `office_hours` park
  plus exit 1. Re-run after Units 1-2 and confirm a die with no park. Without
  this, the units are only verified against the harness's own shims.
- **Confirm the loader form works from a worktree.** Run `graph-commit -C
  <a .claude/worktrees/* checkout>` on a trivial node edit and confirm it still
  lands. Worktrees carry their own `node_modules`, so `tsx/esm` should resolve
  from `SCRIPT_DIR`, but this is the one resolution path the harness's shim
  cannot exercise.
- **Confirm the die leaves no residue.** After a forced environment failure on
  the far-ahead path, check `git status` in the caller's checkout is as clean as
  it was before the run and `git rev-parse HEAD` is back at the PR tip
  (`cleanup()`'s `RESTORE_HEAD` restore), and that the snapshot dir named in
  stderr exists and holds the writer's content.
- **Run the repo lint** (`.claude/skills/dispatch-propagate/scripts/run-lint.sh`)
  before pushing — `shell-json.md` is mechanically enforced on net-new added
  lines in committed `.sh` files, which Unit 3 adds many of.

### Coordination hazards for the implementing session

- **`tactic-graph-ref-split` (phase `implement`) may delete
  `ensure_intentions_only_base()`.** Strategy clarification 237 records that its
  Unit 2 removes the far-ahead rebuild entirely, because the hazard it exists
  for becomes structurally impossible once landing never touches a worktree's
  checkout. This plan is deliberately sited at **`run_merge_node()`**, the
  shared choke point, which survives that removal — the other two call sites
  (layer-2 rebase, layer-3 `--base`) are untouched by ref-split. If ref-split
  has landed by the time this runs, drop Unit 3's far-ahead case (case 2) and
  the `ensure_intentions_only_base` references, and change nothing else.
- **`tactic-node-merge-list-removal-loss` (phase `implement`) edits
  `merge-node.ts` and `node-merge.ts`** for conflict *semantics*
  (`FieldConflict` shape, list-field removal). It does not touch the crash/exit
  path or the spawn form. Whichever lands second rebases onto the other; neither
  supersedes the other.
- `packages/intentionsutil/scripts/test-graph-write-rollback.sh` does **not**
  exist on `origin/main`; it is a ref-split-branch file. Any guidance citing it
  was gathered from another worktree — do not plan against it.
