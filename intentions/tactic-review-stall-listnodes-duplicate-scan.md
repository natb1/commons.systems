---
id: tactic-review-stall-listnodes-duplicate-scan
kind: tactic
statement: Collapse the dispatch tick's duplicate full intentions/ enumerations
  — five strict listNodesStrict passes across graph-auto-merge,
  reconcile-graph-merged, reconcile-graph.ts and reconcile-graph-review-stall in
  one dispatch-select-tick run — onto a single content-addressed, tick-scoped
  materialization that degrades to self-enumeration when no cache directory is
  supplied
owner: ai
status: codified
parent: null
rationale: "The /review-fix deferred cost finding on PR #2920 that opened this
  node named two duplicate scans and cited a line anchor that has since gone
  stale. Measurement on 2026-08-19 against origin/main cfd3b4f0 found five
  strict enumerations inside the tick's merge-and-reconcile band, ~0.5 s wall
  clock each at 716 nodes, and established that those sweeps write node files
  between their own reads — so a plain 'materialize once, pass a file path'
  share would hand a later consumer a stale node set. Content addressing on the
  store's bytes makes the share safe against those intervening writes without
  changing any consumer's observable contract, and an unset cache directory
  degrading to plain listNodesStrict keeps /dispatch-ladder's single-node --node
  path — which runs each reconciler as a separate process with no tick around it
  — working unchanged."
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

# Share one materialized node enumeration across the tick's duplicate `intentions/` scans

## Context

**Where this came from.** Deferred cost finding from the `/review-fix` pass on PR #2920
(`tactic-graph-review-exclusion-stall-recovery`). Original finding: the review-stall sweep
re-parses the entire `intentions/` directory via `listNodesStrict` in its own `tsx`
subprocess on every tick, even when there are zero candidates — a second full scan of the
same directory in the same tick, since `reconcile-graph-merged` performed an equivalent
pass moments earlier in the same `dispatch-select-tick` run. The directory grows
monotonically with the graph, and the call site in `dispatch-select-tick` is unconditional,
so the constant per-tick floor is paid whether or not any node is stranded.

**Adversarial verdict**: not adversarially verified — a cost/scaling advisory finding, not a
`Required` security finding, so the adversarial-verify step was skipped (cost findings are
always `Deferred`, never `Required`).

**Corrections to the original finding, measured 2026-08-19 against `origin/main` cfd3b4f0.**
The finding under-counted and mis-attributed the duplication, and its line anchor is dead.
All four corrections are load-bearing for the plan below:

1. **The original anchor is stale.** The finding cited
   `reconcile-graph-review-stall:146-150`. Those lines are now the staged-write rollback
   plumbing (`restore_staged_writes`, `HEAD_AT_ARM`, the `EXIT` trap, ~139-159). Do not
   disturb them. Locate every enumeration **by symbol** (`CANDIDATES=`, `OPEN_TACTICS=`,
   `listNodesStrict`), never by line number — the anchors in this plan were true at
   cfd3b4f0 and may drift again.

2. **There are three bash-level scans per tick, not two, and the closest duplicate is not
   the one the finding named.** In tick order:
   - `graph-auto-merge` — invoked at `dispatch-select-tick:517`; enumeration at
     `graph-auto-merge:261-279` (`listNodesStrict` at :264, `byId` at :265). Predicate:
     `kind==="tactic"`, `phase==="review"`, `execution.pr` non-null, `execution.conflict`
     null, `blockersComplete(n, byId)`, `markers.includes("reviewed")`. Emits
     `<id>\t<pr>\t<clean|parked>`.
   - `reconcile-graph-merged` — invoked at `dispatch-select-tick:547`; enumeration at
     `reconcile-graph-merged:133-151` (`listNodesStrict` at :138). Predicate:
     `kind==="tactic"`, `phase` in {implement, fix, qa, review, main-qa}, `execution.pr`
     non-null. Emits `<id>\t<pr>`. Also validates node-id shape inline
     (`/^[A-Za-z0-9][A-Za-z0-9._-]*$/`) because its `--base <id>=<sha>` pin keys depend on it.
   - `reconcile-graph-review-stall` — invoked at `dispatch-select-tick:563`; enumeration at
     `reconcile-graph-review-stall:188-207` (`listNodesStrict` at :192, `byId` at :193).
     Predicate: `kind==="tactic"`, `phase==="review"`, `office_hours == null`,
     `markers.includes(REVIEWED_MARKER)`, `execution.fix == null`,
     `blockersComplete(n, byId)`, `execution.pr` non-null. Emits `<id>\t<pr>`.

   `graph-auto-merge`'s candidate set is a **near-twin** of the review-stall sweep's — they
   differ only in the `execution.conflict` conjunct vs the `office_hours` + `execution.fix`
   conjuncts — while `reconcile-graph-merged`'s set is broader by phase and thinner by
   field. So the original claim that `reconcile-graph-merged` "already performs an
   equivalent `listNodes` pass" is true of the **scan** but not of the **candidate set**,
   and any shared artifact serving only those two would leave the third duplicate in place.

   Two more scans hide **inside** `reconcile-graph-merged`: it invokes
   `packages/intentionsutil/scripts/reconcile-graph.ts` twice — `--no-apply` at
   `reconcile-graph-merged:275` and the applying run at :312 — and that driver runs its own
   `listNodesStrict(args.dir)` at `reconcile-graph.ts:151` each time, deliberately "over the
   same unmutated dir" (`reconcile-graph.ts:42-43`). So a busy tick pays **five** full
   parses of the same directory; a quiet tick pays three (the merged sweep short-circuits
   at `reconcile-graph-merged:153` when `OPEN_TACTICS` is empty).

3. **A filtered `<id>\t<pr>` list is not a sufficient shared artifact.**
   `reconcile-graph-merged` never builds a `byId` map, but both `graph-auto-merge` and
   `reconcile-graph-review-stall` build `new Map(nodes.map((n) => [n.id, n]))` and call
   `blockersComplete(n, byId)` (`packages/intentionsutil/src/router.ts:239`), which needs the
   **whole** node set: an id ABSENT from `byId` reads as COMPLETE
   (`router.ts:215-238` states the precondition). Any shared artifact must therefore carry
   the full strict node set, not the surviving candidates.

4. **Measured cost** (this worktree, 717 files in `intentions/`, 716 parsed nodes, 3 runs
   each):
   - cold `node --import tsx/esm` + `listNodesStrict("./intentions")`: 627 / 511 / 512 ms
   - bare `node --import tsx/esm -e 'void 0'` (no store read): 94 ms
   - in-process store parse alone: **376 ms**
   - `JSON.stringify(nodes)`: 45 ms, **2.91 MB**; `JSON.parse` + `validateNode` over all 716:
     **3-6 ms**; the round-trip is `isDeepStrictEqual`-identical to the original array
   - a content hash of every file in `intentions/` (readdir + readFileSync + sha256):
     **10-18 ms**; a stat-only fingerprint: 2-4 ms

   So each scan costs ~0.5 s wall clock (~0.38 s store parse + ~0.09 s tsx bootstrap), and a
   quiet tick pays ~1.5 s of it. This is **wall clock, not tokens**, and the tick is not
   latency-critical. Size the fix to that number; do not build a caching layer heavier than
   the ~20 ms cache-hit path the measurements above already justify.

**Intended outcome.** One materialized strict node enumeration per store state, shared by
every enumeration in the tick, with the fail-closed posture, the `--node` selection
contract, and each sweep's own predicate all unchanged. Expected effect: a quiet tick drops
from ~1.5 s of enumeration to ~0.5 s + ~2 × 0.02 s; a busy tick from ~2.5 s to ~0.5 s +
~4 × 0.02 s.

**Sibling drafts — do not absorb their scope.** Four sibling drafts from the same
`/review-fix` pass sit unplanned at `phase: null`, all serving this strategy and all
touching these same two scripts: `tactic-review-stall-predicate-subprocess-spawn` (the
PER-CANDIDATE `reviewStallRoute` subprocess — a different subprocess from the enumeration
one), `tactic-review-stall-pr-json-duplicate-fetch` (the duplicate `gh_pr_view_rest` network
fetch), `tactic-review-stall-ci-verdict-cache-miss`, `tactic-reconcile-review-stall-base-pin`
(a correctness defect, not a cost one), and `tactic-review-stall-conflict-lane`. **This
tactic owns the NODE ENUMERATION only.** Do not fold the PR-JSON fetch, the CI-verdict cache
behavior, or the per-candidate predicate subprocess into this work.

## Design

### Greenfield

Every in-tick strict enumeration of `intentions/` goes through one **content-addressed,
tick-scoped materialization** of `listNodesStrict`. The cache key is a hash of the store's
bytes, so the artifact is a pure function of the store state and can never serve a stale
node set — which is the property that makes it safe to share it across processes that
*write* node files between reads. It is a read-only optimization: no observable contract of
any consumer changes.

Three properties make this the right shape rather than a "materialize once, pass a file
path" pipeline:

- **Self-invalidating.** `graph-auto-merge`, `reconcile-graph-merged` and the review-stall
  sweep all mutate `intentions/` mid-tick (via `graph-commit`, `apply-node-transition`,
  `apply-fix-state`). A tick-scoped artifact captured *before* those writes would be stale
  for every later consumer. Content addressing turns that hazard into an automatic cache
  miss. This is precisely why this cache does **not** need the `unset` discipline
  `DISPATCH_CI_VERDICT_CACHE` forces on `/dispatch-ladder`
  (`dispatch-ladder-run:255-268, 1128, 1161, 1195`): that cache memoizes a network verdict
  with no TTL and no invalidation, so an inherited dir pins a poll loop forever; this one
  keys on the very bytes it summarizes.
- **Degrades to self-enumeration.** With no cache directory supplied, the helper *is*
  `listNodesStrict`. That keeps the `--node <id>` single-node path — `/dispatch-ladder`
  invoking each script as a separate process with no tick around it
  (`dispatch-ladder-run:471-473`, calls near :1128-1201) — working with zero changes, and
  keeps the shared enumerator from becoming anything the ladder driver owns or gates (the
  standing condition: the driver may SEQUENCE the phase ladder, never gate it).
- **Fail-closed preserved.** Strictness is load-bearing in all four call sites, each with a
  header comment explaining why (a corrupt node file dropped by the tolerant reader silently
  satisfies `blockersComplete`, or strands a merged PR at a stale phase). A corrupt store
  still throws out of the helper and still aborts the consuming sweep with `exit 1`;
  nothing is cached on that path. A corrupt or unreadable *cache file* degrades to a fresh
  **strict** enumeration — never to `listNodes`, never to an empty set.

### Brownfield / migration

This change wires the five enumerations that live inside the tick's merge-and-reconcile
band — `graph-auto-merge`, `reconcile-graph-merged`'s pre-scan, `reconcile-graph.ts`'s two
inner scans, and `reconcile-graph-review-stall` — plus the tick-level cache directory that
makes them share. It deliberately leaves the primitive **available but unwired** at three
further in-tick call sites, to be picked up by later tactics rather than here:

- `packages/intentionsutil/scripts/select-targets.ts:58` (the selector) — highest blast
  radius on the fleet; prove the primitive on the reconcile band first.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-census` (:73) and
  `dispatch-graph-scope-sweep` (:98) — separate debt/staleness enumerations later in the
  same tick.

---

### Unit 1 — the content-addressed strict-enumeration cache primitive

**Scope.** New file `packages/intentionsutil/src/store-cache.ts`, plus a re-export and a
new vitest suite. Nothing outside `packages/intentionsutil/` changes in this unit.

Add to `packages/intentionsutil/src/store-cache.ts`:

- `export function storeFingerprint(dir: string): string` — a sha256 over
  `readdirSync(dir, { withFileTypes: true })` sorted by name, folding in each entry's name,
  a file/dir marker byte, and (for files) the file's bytes read via `readFileSync`. Hash
  **every** entry, not just `*.md` — a superset of what `listNodesResilient` reads
  (`store.ts:190-205` filters to `*.md` minus `README.md`), so the key can never miss a
  change the enumeration would see. Errors from `readdirSync`/`readFileSync` **propagate**
  (an unreadable store dir must abort, per `.claude/rules/code-style.md`'s clear-errors rule).
- `export function listNodesStrictCached(dir: string, cacheDir: string): IntentionNode[]`:
  1. `if (!cacheDir) return listNodesStrict(dir);` — the no-cache path is the existing
     function, byte-for-byte behavior.
  2. Compute `key = sha256(resolve(dir)).slice(0,12) + "-" + storeFingerprint(dir).slice(0,32)`
     and `file = join(cacheDir, "nodes-" + key + ".json")`. The resolved-dir component keeps
     two stores with coincidentally identical contents from sharing an entry.
  3. Try to read `file`, `JSON.parse` it, require an array, and map each element through
     `validateNode` (`packages/intentionsutil/src/schema.ts:956`) — which returns a properly
     typed `IntentionNode`, so **no cast and no `any` is needed** and the
     `.claude/rules/type-safety-suppression-marker.md` sensor stays quiet. On success return
     that array. Any failure (missing file, bad JSON, failed validation) falls through to
     step 4 — it never throws and never returns a partial set.
  4. `const nodes = listNodesStrict(dir);` — throws `IntentionSchemaError` on a corrupt
     store, which is the fail-closed path; nothing is written in that case.
  5. Best-effort write: `writeFileSync(file + ".tmp." + process.pid, JSON.stringify(nodes))`
     then `renameSync` onto `file` (atomic; concurrent writers race to identical content).
     Wrap in `try {} catch {}` and swallow — the caller owns the directory's lifecycle and
     the helper **never** `mkdir`s it, mirroring `dispatch_ci_verdict_rest`
     (`.claude/skills/dispatch-propagate/scripts/lib.sh:822-921`). A write failure must not
     fail a sweep.
  6. Return `nodes`.

Write a header comment covering, for the next reader: why the key is content-addressed and
what that buys (safe across mid-tick writes; explicit contrast with
`DISPATCH_CI_VERDICT_CACHE`'s no-TTL/no-invalidation contract documented at `lib.sh:822-834`
and the `unset` discipline it forces at `dispatch-ladder-run:255-268`); that strictness is
preserved and a corrupt store still throws; that a corrupt cache entry degrades to a fresh
**strict** enumeration and never to the tolerant `listNodes`; that the caller owns the
directory; and the measured numbers from ## Context item 4 so a future reader can tell
whether the trade still holds.

Export both symbols from `packages/intentionsutil/src/index.ts` beside the existing store
exports (`index.ts:57-64`).

New `packages/intentionsutil/test/store-cache.test.ts`, following the existing suite style
in `packages/intentionsutil/test/store.test.ts` (temp-dir fixtures, `IntentionSchemaError`
assertions). Cases:

1. `cacheDir === ""` returns exactly what `listNodesStrict` returns (deep-equal) and creates
   no files.
2. Cold call with a cache dir writes exactly one `nodes-*.json`; a second call returns a
   deep-equal node set.
3. **Hit is real**: after a cold call, overwrite the cache file with a valid one-node array
   sentinel; the next call returns the sentinel — proving the cache was consulted rather
   than the store re-parsed.
4. **Invalidation has teeth**: with the sentinel still in place, modify a node file in the
   store (a body edit is enough — the fingerprint hashes whole files); the next call returns
   the real store contents again, not the sentinel, and writes a second cache entry.
   Repeat for a file *added* and a file *removed*.
5. **Corrupt cache degrades, does not throw**: cache file containing invalid JSON, and cache
   file containing valid JSON that fails `validateNode` — both return the real strict
   enumeration and rewrite the entry.
6. **Fail-closed survives caching**: a corrupt node file in the store makes
   `listNodesStrictCached` throw `IntentionSchemaError` both with and without a cache dir,
   and leaves no cache entry behind.
7. **Unwritable cache dir is non-fatal**: pass a nonexistent directory; the correct nodes
   are still returned.
8. `storeFingerprint` is stable across repeated calls with no change, and differs after an
   add, a remove, and an edit.

**Out of scope**: changing `listNodes` / `listNodesStrict` / `listNodesResilient`
themselves; any caller wiring; any pruning/TTL logic (a tick's directory is created and
removed by its caller, and holds at most one entry per distinct store state).

**Recommended model**: opus — the fail-closed semantics, the degrade-vs-throw split, and the
cache-invalidation contract are exactly the "tricky ordering, judgment-heavy" case.

---

### Unit 2 — route the tick's five enumerations through the primitive

**Scope.** Four files, one call-site change each (five total), plus header-comment updates.
No predicate, no output format, no CLI flag, and no exit code changes anywhere.

The env var is `DISPATCH_GRAPH_NODE_CACHE`. Every consumer reads it as
`process.env.DISPATCH_GRAPH_NODE_CACHE || ""`, so unset and empty both mean "self-enumerate".

1. `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged:133-151` — in the
   inline `node --import tsx/esm -e` block, import `listNodesStrictCached` from
   `./packages/intentionsutil/src/store-cache.js` and replace the
   `listNodesStrict("./intentions")` at :138. Leave the `--node` argv filter, the inline
   id-shape validation and its `process.exit(1)`, and the
   `|| { echo "... node enumeration failed"; exit 1; }` guard at :151 exactly as they are.
2. `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:188-207` — same
   substitution at :192. `byId` (:193), the `REVIEWED_MARKER` / `blockersComplete` imports,
   every gate, and the hard-fail at :207 stay unchanged.
3. `.claude/skills/dispatch-propagate/scripts/graph-auto-merge:261-279` — same substitution
   at :264. `byId` (:265), the gates, and the hard-fail at :279 stay unchanged.
4. `packages/intentionsutil/scripts/reconcile-graph.ts:151` — replace
   `listNodesStrict(args.dir)` with the cached form, reading the env var at the CLI layer
   (this script already parses `--dir` at :82-83). This is the one place the two inner scans
   collapse into one: the `--no-apply` run (`reconcile-graph-merged:275`) and the applying
   run (:312) are documented as running "over the same unmutated dir"
   (`reconcile-graph.ts:42-43`), so the second is a guaranteed cache hit — and if anything
   *did* write between them, the fingerprint would catch it.

Extend each site's existing header comment with a short paragraph stating: the cache is a
read-only, content-addressed optimization that cannot change the candidate set; `--node`
still arrives via `process.argv`, so the doctrine that "an ambient env var can never
silently narrow an unflagged sweep" is intact — `DISPATCH_GRAPH_NODE_CACHE` names a storage
*location*, never a node subset; and an unset/empty var self-enumerates, which is exactly
the `/dispatch-ladder` single-node path (`dispatch-ladder-run:471-473`).

**Out of scope**: `packages/intentionsutil/scripts/select-targets.ts:58`,
`.claude/skills/dispatch-propagate/scripts/dispatch-graph-census:73`,
`.claude/skills/dispatch-propagate/scripts/dispatch-graph-scope-sweep:98` — the follow-on
call sites named in the migration section. Also out of scope: the review-stall sweep's
per-candidate `reviewStallRoute` subprocess and its `gh_pr_view_rest` fetch (sibling drafts).

**Dependencies**: Unit 1.

**Recommended model**: opus — these are the fleet's autonomous merge and reconcile paths,
and the header comments encode load-bearing doctrine that must not drift.

---

### Unit 3 — tick-scoped cache directory in `dispatch-select-tick`

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick` and
`.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh`.

Immediately after the existing `DISPATCH_CI_VERDICT_CACHE` block
(`dispatch-select-tick:288-304`), and following its shape exactly: `mktemp -d
"$CLAUDE_JOB_DIR/tmp/graph-nodes.XXXXXX"` when `CLAUDE_JOB_DIR` is set, else a bare
`mktemp -d`; `export DISPATCH_GRAPH_NODE_CACHE`. Extend the **single** combined `EXIT` trap
at :304 to remove the new directory too — `trap ... EXIT` REPLACES, so it must remain one
trap chaining `_dlog_select_emit`, the CI-verdict cleanup, and the new cleanup. Place it
before the `BRANCH == main` block, like its sibling, since the reconcile band runs on every
tick.

Note in a comment that each entry is ~3 MB at the current graph size and a tick creates at
most a handful, all removed by the trap.

Test additions in `test-dispatch-select-tick.sh`:
- Extend the stub-install loop at :141 (which already fakes `reconcile-graph-merged`,
  `reconcile-graph-review-stall`, and friends) so a fake can record the inherited
  `DISPATCH_GRAPH_NODE_CACHE` value and whether that directory exists at invocation time.
- Assert the var is exported, non-empty, and names an existing directory during the tick.
- Assert the directory is gone after the tick returns (trap fired), and that the existing
  CI-verdict cache cleanup still fires — proving the combined trap was chained, not
  replaced.
- Keep the silent-fake defaults so every other tick test stays byte-identical.

**Out of scope**: `dispatch-tick`, `dispatch-ladder-run` (Unit 5), and any other tick step.

**Dependencies**: Unit 2.

**Recommended model**: sonnet — rote wiring against an in-file precedent, with explicit test
cases.

---

### Unit 4 — real-store integration coverage

**Scope.** `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh` (a new
numbered case) and `.claude/skills/dispatch-propagate/scripts/test-graph-auto-merge.sh` (one
added assertion). Both suites are auto-globbed by
`.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh` (its `for test_script in
"$SCRIPTS"/test-*.sh` loop at :190), so **no `.github/workflows/unit-tests.yml` edit is
needed** for changes confined to this directory.

Add a new case to `test-graph-write-rollback.sh` built on the existing fixture trio —
`new_origin` (:114), `build_seed_repo` (:122), `init_and_push` (:158),
`clone_with_node_modules` (:172) — following the Case 6b (:796-845) and Case 10 (:1226)
shape. `build_seed_repo` already does `cp -r "$INTENTIONSUTIL_SRC/."`, so the new
`store-cache.ts` is copied in with no harness change. Reuse `review_stall_gh_stub` (defined
just under the Case 10 header) for the `gh` REST surfaces. Sub-cases:

- **(a) hit**: run `reconcile-graph-review-stall --node <id>` twice with
  `DISPATCH_GRAPH_NODE_CACHE` pointed at a temp dir. Assert identical stdout both runs, and
  exactly one `nodes-*.json` present in the cache dir after the first.
- **(b) invalidation**: with the cache warm, edit a second seeded node so it no longer
  qualifies (flip its `phase` off `review`), re-run the *unfiltered* sweep, and assert the
  candidate set follows the new disk state — the stale entry was not served.
- **(c) fail-closed**: with the cache warm, truncate a node file to `---\n`; assert the
  sweep exits 1 with `node enumeration failed` on stderr, and that the tree is left clean by
  the existing rollback path.
- **(d) ladder path**: with `DISPATCH_GRAPH_NODE_CACHE` unset, the same sweep produces the
  same stdout and writes no cache file anywhere.

In `test-graph-auto-merge.sh`, add one assertion to an existing enumeration-covering case:
with `DISPATCH_GRAPH_NODE_CACHE` set to a temp dir, the candidate set and stdout are
identical to the unset run.

**Out of scope**: new standalone test scripts (extend these suites), and any change to
`test-dispatch-ladder-run.sh` beyond confirming it still passes.

**Dependencies**: Units 1-3.

**Recommended model**: sonnet — test writing with fully enumerated cases against an existing
harness.

---

### Unit 5 — record why `/dispatch-ladder` treats this cache differently

**Scope.** Comment-only changes to `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run`.
No behavior change, no new test file — so no
`.github/workflows/unit-tests.yml` line is needed (that suite is already wired explicitly at
`unit-tests.yml:305-313`).

The driver's header block at :255-268 states "THE CI VERDICT CACHE MUST STAY UNSET,
load-bearing", and it `unset`s `DISPATCH_CI_VERDICT_CACHE` before each reconciler call
(:1128, :1161, :1195). Add a short adjacent paragraph explaining that
`DISPATCH_GRAPH_NODE_CACHE` is deliberately **not** given the same treatment: it is keyed on
the store's bytes, so an inherited directory cannot pin this driver's poll loop to stale
node state the way a TTL-less verdict memo can. The driver neither exports nor unsets it;
with nothing in the environment the reconcilers self-enumerate, which is the ladder's
existing behavior unchanged.

Confirm `test-dispatch-ladder-run.sh` still passes untouched — it fakes
`reconcile-graph-merged` and `reconcile-graph-review-stall` (:145-146) and asserts their
`--node` argv (:566-567); those assertions must remain green with no edits, which is the
proof the `--node` contract survived.

**Dependencies**: Unit 2.

**Recommended model**: sonnet — documentation of a decision this plan already made.

## Reuse

- `packages/intentionsutil/src/store.ts:249` — `listNodesStrict(dir)`, the enumeration
  primitive all four sites already call. The new helper wraps it; it is never replaced, and
  the tolerant `listNodes` is never substituted for it.
- `packages/intentionsutil/src/store.ts:190-205` — `listNodesResilient`, which defines what
  the enumeration actually reads (`*.md` minus `README.md`). The fingerprint hashes a
  superset of this.
- `packages/intentionsutil/src/store.ts:211-239` — the `listNodes` vs `listNodesStrict`
  contract comment: every gate/selection/reconciliation caller MUST use the strict form.
- `packages/intentionsutil/src/schema.ts:956` — `validateNode(value: unknown): IntentionNode`,
  used to re-type a parsed cache entry without a cast (keeps the type-safety sensor quiet
  and adds defense in depth; measured at 3-6 ms for 716 nodes).
- `packages/intentionsutil/src/router.ts:239` — `blockersComplete(tactic, byId)`, with its
  strict-enumeration precondition documented at :215-238. Consumers keep building their own
  `byId` from the (now shared) node array; the helper's contract is the array.
- `packages/intentionsutil/src/transitions.ts:30` — `REVIEWED_MARKER`, already a single
  source of truth; the review-stall filter keeps importing it rather than re-literalling.
- `packages/intentionsutil/src/index.ts:57-64` — the store re-export block the two new
  symbols join.
- `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:288-304` — the
  `DISPATCH_CI_VERDICT_CACHE` setup + combined-trap block Unit 3 mirrors exactly.
- `.claude/skills/dispatch-propagate/scripts/lib.sh:822-921` —
  `dispatch_ci_verdict_rest`'s cache pattern and its bounded-staleness header; the
  caller-owns-the-directory rule comes from here, and its no-invalidation contract is the
  thing this design deliberately does not repeat.
- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:255-268, 471-473, 1128, 1161,
  1195` — the ladder's cache-unset discipline and single-node reconciler calls.
- `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh` — the four
  real-store fixture builders defined near the top of the file (`new_origin`,
  `build_seed_repo`, `init_and_push`, `clone_with_node_modules`) plus the `ok()` /
  `no()` reporters beside them, and the **Case 6b** and **Case 10** blocks (locate by
  the banners `# Case 6b: reconcile-graph-merged --node <id> narrows the sweep` and
  `# Case 10: reconcile-graph-review-stall --node <id> narrows the sweep`) — the case
  shape Unit 4 follows. *(Construct citations: five sibling PR5 units edit this file.)*
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh:141, ~860` — the
  stub-install loop for both reconcilers and the existing review-stall wiring assertions.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:190` — the auto-glob that
  picks up any `test-*.sh` in the dispatch-propagate scripts directory.
- `packages/intentionsutil/test/store.test.ts` — the fixture/assertion style for the new
  `store-cache.test.ts`.

## Verification

Run from the worktree root.

```verify
npm test --prefix packages/intentionsutil
```

```verify
.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-graph-auto-merge.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh
```

```verify
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual and judgment checks:

- **Confirm the win, don't assume it.** Before and after, time a real invocation against
  this repo's `intentions/`: run `reconcile-graph-review-stall --node <some-id>` with
  `DISPATCH_GRAPH_NODE_CACHE` unset (expect ~0.5 s) and again with it pointed at a warm temp
  dir (expect ~0.12 s). The baseline numbers to compare against are in ## Context item 4.
  If the cached path is not at least 3× faster, the design did not pay for itself and the
  finding should be re-dispositioned rather than the cache elaborated.
- **Correctness under mid-tick writes.** With a warm cache dir, land a node edit (any
  `intentions/*.md` write) and re-run a consumer; verify it sees the new state. This is the
  single property the whole design rests on, and (b) in Unit 4 automates it — but confirm it
  once by hand against the real store too, since the automated case runs on a seeded
  fixture.
- **Quiet-tick observation in production.** After merge, watch one autonomous
  `dispatch-select-tick` run in journald and confirm: `reconcile-graph:` and `review-stall:`
  output is unchanged in shape and content from before, and no new stderr appears. A tick
  that starts emitting `node enumeration failed` is a fail-closed regression, not a cache
  miss.
- **Ladder path unchanged.** Invoke `/dispatch-ladder` on any node (or run its suite) and
  confirm the reconciler steps still behave identically with no cache var in the
  environment.
- **Scope check before opening the PR.** `git diff --stat` should touch only:
  `packages/intentionsutil/src/store-cache.ts` (new),
  `packages/intentionsutil/src/index.ts`, `packages/intentionsutil/test/store-cache.test.ts`
  (new), `packages/intentionsutil/scripts/reconcile-graph.ts`, the three
  `dispatch-propagate/scripts` reconcilers, `dispatch-select-tick`, the three test suites,
  and `dispatch-ladder-run` (comments only). Anything touching `select-targets.ts`,
  `dispatch-graph-census`, `dispatch-graph-scope-sweep`, the per-candidate
  `reviewStallRoute` subprocess, or `gh_pr_view_rest` is scope creep into a sibling draft
  and must come out.
