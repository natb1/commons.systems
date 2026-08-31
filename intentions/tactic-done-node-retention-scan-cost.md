---
id: tactic-done-node-retention-scan-cost
kind: tactic
statement: Wire the three every-tick full-store enumerations the reconcile-band
  cache leaves unwired — dispatch-graph-census, dispatch-graph-scope-sweep, and
  graph-select-target's origin/main snapshot — onto the content-addressed store
  cache, so a retained done node costs a JSON deserialization rather than a YAML
  parse on every scan and enumeration cost tracks what changed rather than how
  many nodes exist
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-08-19 by an /align-tactics tactic-mode round from the
  raw draft the /review-fix cost finding on PR #2965 opened. The draft's premise
  — that done-node retention grows the store without bound and the remedy is to
  prune or archive — was measured and rejected this round. Applying
  tactic-census-scripted-tick's own verifyCompletion predicate to today's
  717-node store: 103 prunable, 57 permanently retained as integrity defects,
  and 317 phase:null drafts no census will ever prune, so a perfect drain
  removes ~23% of parse cost and retention is a minority of store growth.
  Meanwhile 96% of enumeration cost is yaml.parse (234ms of a 290-371ms scan)
  and the same node set round-trips through JSON in 6-10ms — so the lever is a
  retained node's marginal per-scan cost, not the population. Scope is therefore
  the three every-tick call sites tactic-review-stall-listnodes-duplicate-scan
  explicitly leaves unwired for a later tactic, plus the two seams its primitive
  cannot serve: a tolerant cached read for the listNodes consumers, and a
  tree-sha-keyed path for the selector's mktemp git-archive snapshot. Archiving
  was rejected: it breaks every prose path:line reference and every blocked_by
  resolution that assumes intentions/<id>.md, for a ledger cohort that is only
  8.5% of parse cost. blocked_by tactic-review-stall-listnodes-duplicate-scan
  because packages/intentionsutil/src/store-cache.ts is not yet on origin/main."
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
blocked_by:
  - tactic-review-stall-listnodes-duplicate-scan
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Make a retained done node cost ~0 per scan: finish wiring the every-tick full-store enumerations onto the content-addressed store cache

## Context

### Why this exists

`reconcile-graph.ts`'s done-transition (Pass 3, the header comment opened by
`// Pass 3: done transitions` in `packages/intentionsutil/scripts/reconcile-graph.ts`
— `:266`, re-measured 2026-08-30) deliberately **leaves the node present** —
"LEAVE the node present. No prune, no inbound-`blocked_by` repair … Edge repair and deletion are
only needed at actual deletion time, which is now a separate future census concern." That change
(PR #2965, `tactic-execution-pr-merge-verification`) removed the `rmSync` loop and the `prune`
array, so every reconciled tactic stays on disk at `phase: done` forever. The `/review-fix` cost
finding on that PR (`deferred-filing`, cost lens, prescanned; **not** adversarially verified — cost
findings route to `Deferred` without a verify pass) observed that the intentions node set therefore
grows monotonically while several per-tick scanners full-scan it, and opened this node.

### What was measured (2026-08-19, worktree `.claude/worktrees/tactic-done-node-retention-scan-cost`, origin/main 58e643e9)

The original finding's line anchors are a year stale — locate everything **by symbol**. The
corrected map and the numbers that matter:

**Enumeration cost is YAML parsing, essentially nothing else.** For the 717-node store
(9.6 MB on disk, 8.54 MB of text, 3.05 MB of that frontmatter):

| step | measured |
| --- | --- |
| `readdirSync` | <1 ms |
| `readFileSync` of all 717 files | 10 ms |
| frontmatter fence extraction | 1 ms |
| **`yaml.parse` of all 717 frontmatters** | **234 ms** |
| `validateNode` over all 717 parsed docs | 8 ms |
| `listNodes("./intentions")` end to end, warm | 290–371 ms |
| `JSON.stringify(nodes)` → 2.92 MB; read that file back + `JSON.parse` | **6–10 ms** |
| sha1 over every file's bytes | 7 ms |
| `git archive origin/main intentions \| tar -x` (the selector's snapshot) | **74–77 ms** |

So a scan costs ~0.3 s in-process (~0.5 s including `tsx` bootstrap), 96 % of it `yaml.parse`, and
the same node set round-trips through JSON in ~30× less time. **A node that has stopped changing —
which is the definition of a done node — is re-parsed from YAML on every scan forever, and that is
what makes retention expensive.**

**Pruning is not the lever, and the tactic's original framing was wrong about this.** Of 717 files,
160 are `phase: done`. Applying the exact verification predicate the scripted census implements
(`verifyCompletion` on `origin/tactic-census-scripted-tick`: `execution.pr` non-null AND
`execution.completion` with either both `mergedAt`+`mergeCommitSha` or a `graphCommitSha`) to
today's store: **103 prunable, 57 left in place permanently as integrity defects, 0 retained by an
inbound `parent`/`serves`/`validates`/`recovers` edge.** A perfect drain therefore removes 103 of
717 files — about 23 % of parse cost — and leaves 614, of which the largest single cohort is **317
`phase: null` draft tactics that no census will ever prune**. Done-node retention is a minority of
store growth (store adds ran 45–116 new node files per week over 2026-W27…W33), so
"bound retention cost" cannot mean "delete retained nodes". It has to mean **make a retained node's
marginal per-scan cost near zero**.

**The permanently-unprunable cohort is real but small.** `graph-census-debt.ts`'s
`computeDebt` exempts ledger entries from the prune batch at its `donePresent.push`
guard (`if (n.phase === "done" && !isLedgerEntry(n) && !isLiveRearmTarget(n))
donePresent.push(n.id)` — `:179-181`, re-measured 2026-08-30; `isLedgerEntry` in
`packages/intentionsutil/src/schema.ts`, located by name — `:580`, re-measured
2026-08-30) because a retired
`tactic-eval-finding-*` keeps its summary metrics so `dispatch-eval-finding` can *resume* an
occurrence count rather than restart it at 1. The guard's third condition exempts a different
and transient cohort — a released WAIT node re-arms in place, so its exemption lasts one
released window and adds nothing to the permanently-unprunable count (measured 2026-08-30:
zero nodes in the store satisfy it today). Measured: 39 ledger nodes (21 already done),
avg 12.8 KB each, **8.5 % of total parse cost**, all 39 created in a 3-day burst (2026-08-12…14).
This cohort never drains — but at 8.5 % it does not justify an archive-directory migration, and
moving files out of `intentions/<id>.md` would break every prose `path:line` reference and every
`blocked_by` resolution that assumes that layout. **Archiving is rejected**; the cache below makes
the cohort cheap in place.

**`dispatch-graph-census`'s threshold backpressure is already inert.** Live run of
`node --import tsx/esm packages/intentionsutil/scripts/graph-census-debt.ts --threshold 10` returns
`total: 139`, `openCensus: ["tactic-graph-census-2026-07-11"]`, **`shouldBirth: false`** — one
undrained latch node suppresses every further birth. Debt has run 52 (2026-07-11) → 62 (2026-07-23)
→ 139 (today) with no further latch and no drain, and that 2026-07-11 latch is still `phase: null`
at 5+ weeks. Nothing in this plan changes that; `tactic-census-scripted-tick` retires the latch
mechanism entirely.

### The greenfield design

Enumeration cost should be a function of *what changed*, not of *how many nodes exist*. The store
gets one **content-addressed materialization** at its single choke point: a node set is
YAML-parsed once per distinct store state and thereafter deserialized from JSON. Content addressing
(rather than a "materialize once, pass a path" share) is what makes it safe across the mid-tick node
writes the reconcile band performs — a write is an automatic cache miss, never a stale read.

**That primitive is already being built.** `tactic-review-stall-listnodes-duplicate-scan`
(phase `implement`, in flight) adds `packages/intentionsutil/src/store-cache.ts` with
`storeFingerprint(dir)` and `listNodesStrictCached(dir, cacheDir)`, the env var
`DISPATCH_GRAPH_NODE_CACHE`, and a tick-scoped cache directory created and trap-removed by
`dispatch-select-tick`. It wires the five enumerations in the tick's merge-and-reconcile band
(`graph-auto-merge`, `reconcile-graph-merged`, `reconcile-graph.ts` × 2, `reconcile-graph-review-stall`)
and **explicitly leaves three every-tick call sites unwired "to be picked up by later tactics"**:
`select-targets.ts:58`, `dispatch-graph-census`, `dispatch-graph-scope-sweep`.

Those three are exactly the callers this node's own statement names. **This tactic is that later
tactic.** It does not re-plan the primitive, the cache directory, or the reconcile-band wiring.
It adds the two things the primitive as designed cannot serve:

1. a **tolerant** cached read, because census and scope-sweep use `listNodes`, not
   `listNodesStrict`, and must keep degrading rather than fail closed; and
2. a **tree-sha-keyed** path for `graph-select-target`, whose store is a `git archive` snapshot of
   `origin/main` into a fresh `mktemp -d` — a different directory every tick, so the
   resolved-dir-plus-fingerprint key can never hit, and whose 75 ms archive+tar no in-process cache
   touches at all.

Expected effect per tick: census (~0.5 s) and scope-sweep (~0.5 s) become ~0.02 s cache hits off
the entry the reconcile band just wrote; the selector's first call drops archive+tar+parse
(~0.6 s) to a JSON read whenever `origin/main:intentions` is unchanged since an earlier
materialization in the same tick, and its second call (the `--pace-exempt-only` probe at
`dispatch-select-tick`'s `graph-select-target --pace-exempt-only` call, plus its
`graph-select-target --node` and `graph-select-target --top` calls — locate each
by that literal; `:917`, `:1215` and `:1221` re-measured 2026-08-30) is a
guaranteed hit.
After this lands, a retained done node costs ~0.04 ms of JSON deserialization per scan instead of
~0.32 ms of YAML parse — retention is bounded by construction, with no pruning required and no
node ever dropped from any enumerated set.

### Brownfield / migration

There is no migration: this is additive wiring behind an env var that is unset outside a tick, and
every site degrades to today's exact behavior when the var is empty. No file moves, no schema
change, no node-set change. The only sequencing constraint is the prerequisite below.

### Prerequisite — do not reimplement the primitive

**The finalizing round already checked this, and the edge is already recorded.** On 2026-08-19,
against `origin/main` 58e643e9, `git show origin/main:packages/intentionsutil/src/store-cache.ts`
returned `fatal: path ... does not exist` — `tactic-review-stall-listnodes-duplicate-scan` had not
landed. So this node carries `blocked_by: [tactic-review-stall-listnodes-duplicate-scan]` from
finalize time, per clarification 94: a mechanical hold is a `blocked_by` edge to a tracked node,
never an `office_hours` park.

**Before writing any code, re-check that `packages/intentionsutil/src/store-cache.ts` exists on
`origin/main` and exports `storeFingerprint` and `listNodesStrictCached`.** The router only
selects this node once the blocker reaches `phase: done`, so the expected result is that it exists.
If it somehow does not, **stop and leave the `blocked_by` edge in place — do not park, and do not
reimplement `store-cache.ts` here**; a second, subtly-different cache primitive is the failure this
note exists to prevent. If the blocker's shipped API differs from the names above, reconcile against
what actually landed rather than against this paragraph, and say so in the PR.

### Sibling boundaries — do not absorb

- **`tactic-census-scripted-tick`** (phase `qa`, PR #3037, parked in office-hours) is the scripted
  verify-then-prune tick step — option (a) of the original recommended fix, the author-directed
  greenfield of clarification 95. It reduces the *population*. This tactic reduces the *per-node
  cost*. They touch disjoint files (`census-decide.ts` / `census-tick.ts` vs `store-cache.ts`,
  `select-targets.ts`, the two sweep scripts), so **no `blocked_by` edge is warranted** — coupling
  this node to a parked one would stall it for no mechanical reason. Do not re-plan it, do not
  duplicate it, do not touch its branch.
- **`tactic-review-stall-listnodes-duplicate-scan`** owns the primitive and the reconcile band.
  Reuse `store-cache.ts` by import; never edit `listNodes` / `listNodesStrict` /
  `listNodesResilient` themselves, and never edit the four call sites it wires.
- **`tactic-census-tick-repoint-anchors`** owns the stale `reconcile-graph.ts` anchors in
  `tactic-census-scripted-tick.md`. Not this node's concern.

### Finding handed off, deliberately not absorbed

While verifying the residual, this round found a defect in the **unmerged** PR #3037:
`partitionDonePresent` (`origin/tactic-census-scripted-tick:packages/intentionsutil/scripts/census-decide.ts`)
filters `nodes.filter((n) => n.phase === "done")` with **no `isLedgerEntry` exemption**, unlike
`graph-census-debt.ts`'s `donePresent.push` guard (`:179-180`, re-measured
2026-08-30). Measured against today's store, **4 done `tactic-eval-finding-*` nodes
satisfy `verifyCompletion` and would be pruned outright**, sending the recurrence metrics
`dispatch-eval-finding` resumes on a repeat finding to git history where no ranking read finds them —
the exact loss the `isLedgerEntry` exemption comment says it exists to prevent. This belongs to
`tactic-census-scripted-tick`, not here. **Record it against that node** (its office-hours
recommendation already carries four other confirmed bugs); do not fix it from this branch.

### Explicitly out of scope

Pruning or archiving any node; any change to `listNodes`/`listNodesStrict`/`listNodesResilient`;
any change to the tolerant/strict split or its header contract (`store.ts:216-231`); any predicate,
output format, exit code, or CLI contract of the wired scripts; any longer-than-a-tick cache
lifetime; the `office-hours-select` snapshot; the reconcile band; the census latch.

---

### Unit 1 — a tolerant cached read that can never hand a gate an incomplete set, wired into census and scope-sweep

**Scope.**

Add to `packages/intentionsutil/src/store-cache.ts` (the file
`tactic-review-stall-listnodes-duplicate-scan` creates; extend it, do not fork it):

```
export function listNodesCached(dir: string, cacheDir: string): IntentionNode[]
```

Semantics, in order:

1. `if (!cacheDir) return listNodes(dir);` — byte-for-byte today's behavior when the env var is
   unset or empty.
2. Compute the **same** cache key `listNodesStrictCached` computes (reuse its key helper; if that
   helper is private, export it rather than re-spelling the formula — a second spelling of the key
   is a silent cache split).
3. Try to read and `JSON.parse` that entry and map every element through `validateNode`
   (`packages/intentionsutil/src/schema.ts`, returns a typed `IntentionNode`, so no cast and no
   `any` — keeps `.claude/rules/type-safety-suppression-marker.md`'s sensor quiet). On success,
   return it.
4. On any failure — missing file, bad JSON, failed validation — fall through to
   `return listNodes(dir);`.

**The load-bearing asymmetry, which must be stated in a header comment:** the tolerant path
**reads** cache entries but **never writes one**. Entries are written only by
`listNodesStrictCached`, so an entry on disk is always the *complete* store — safe for a tolerant
consumer to accept. The converse is not true: a tolerant enumeration legitimately *omits* a corrupt
node, and publishing that shorter array under the shared key would later hand a strict gate caller a
set with a node missing, where `blockersComplete` (`packages/intentionsutil/src/router.ts`) reads an
absent `blocked_by` id as **COMPLETE** and silently unblocks its dependent. One-way sharing only.
Do not "fix" this by giving tolerant writes their own key namespace — that adds a second key space
for a hit rate of approximately zero (census and scope-sweep each run once per tick).

Wire two call sites, one line each, plus a paragraph on each script's existing header comment:

- `packages/intentionsutil/scripts/graph-census-debt.ts` — the
  `const nodes = listNodes(intentionsDir);` line inside `main()` (`:343`,
  re-measured 2026-08-30) — read `process.env.DISPATCH_GRAPH_NODE_CACHE || ""` at the CLI layer and call
  `listNodesCached(intentionsDir, cacheDir)`. `computeDebt`, `decideCensus`, the `isLedgerEntry`
  exemption at its `donePresent.push` guard (`:179-180`, re-measured 2026-08-30),
  the threshold/latch logic and the JSON output shape are untouched.
- `packages/intentionsutil/scripts/list-scope-stale-tactics.ts:78` (`const nodes = listNodes(dir);`) —
  same substitution, same env read. The `--dir` / `--stamp-dir` / `--live` argument handling and the
  emitted list are untouched.

Neither shell wrapper needs a change: `dispatch-graph-census` (`:73`) and
`dispatch-graph-scope-sweep` (`:98`) invoke these through `node --import tsx/esm` from `REPO_ROOT`
and inherit the exported var.

Tests, in `packages/intentionsutil/test/store-cache.test.ts` (the suite the sibling unit creates —
add cases to it; do not create a parallel file), following the temp-dir fixture style of
`packages/intentionsutil/test/store.test.ts`:

1. `cacheDir === ""` → deep-equals `listNodes(dir)` and writes no file.
2. **Hit is real**: warm the entry with `listNodesStrictCached`, overwrite it with a valid one-node
   sentinel array, then `listNodesCached` returns the sentinel — proving no re-parse.
3. **Never writes**: with an empty cache dir, one `listNodesCached` call returns the correct nodes
   and leaves the directory **empty**.
4. **Tolerance survives caching**: with a corrupt node file in the store and no cache entry,
   `listNodesCached` returns the surviving nodes and does not throw (contrast:
   `listNodesStrictCached` throws `IntentionSchemaError` on the same store) — and still writes
   nothing.
5. **Invalidation**: warm the entry, edit a node file, then `listNodesCached` returns the new disk
   state, not the stale entry.
6. **Corrupt entry degrades**: invalid JSON, and valid JSON failing `validateNode` — both return the
   real tolerant enumeration without throwing.

**Out of scope for this unit**: `select-targets.ts`, `graph-select-target`, any change to
`listNodesStrictCached`'s own behavior, any change to the census threshold/latch or the scope-sweep
demotion logic.

**Recommended model**: opus — the tolerant/strict cache-sharing asymmetry is a fail-closed
correctness argument, and getting it backwards silently weakens every gate that reads
`blocked_by`.

---

### Unit 2 — key the selector's `origin/main` snapshot on its git tree sha and skip `git archive` on a hit

**Scope.**

`.claude/skills/dispatch-propagate/scripts/graph-select-target` currently, at its
`--- Snapshot the store at origin/main ---` block (near :470-490): checks
`git cat-file -e origin/main:intentions`, `mktemp -d`, `git archive origin/main intentions | tar -x`,
then runs `npx tsx packages/intentionsutil/scripts/select-targets.ts --dir "$SNAPSHOT_DIR/intentions"`.
Locate that block by those symbols, not by line number.

Two changes.

**(a) `packages/intentionsutil/scripts/select-targets.ts`** — add two mutually-exclusive-with-`--dir`
CLI flags to the existing `main(argv)` parser (which today handles only `--dir`, and throws
`select-targets: unknown argument '<x>'` on anything else — preserve that throw for genuinely
unknown flags):

- `--nodes-json <path>`: read the file, `JSON.parse`, require a **non-empty array**, map every
  element through `validateNode`, and pass the result to `selectGraphTargets` in place of
  `listNodesStrict(dir)`. Any failure — unreadable, bad JSON, not an array, empty array, any element
  failing validation — **throws** (`.claude/rules/code-style.md`: clear errors, not silent
  fallbacks); the *caller* owns the fallback decision, not this script.
- `--emit-nodes <path>`: after enumerating via `--dir`, `JSON.stringify` the node array to
  `<path>.tmp.<pid>` then `renameSync` onto `<path>`, best-effort inside `try {} catch {}` — a write
  failure must never fail a selection. Ignored when `--nodes-json` was used (nothing new to emit).

Extend the header comment: the strictness note at :23-29 still governs the `--dir` path, and the
`--nodes-json` path preserves the same guarantee differently — it validates **every** element and
refuses a partial or empty array outright, so an absent `blocked_by` id can never be manufactured by
a truncated cache file.

**(b) `graph-select-target`** — wrap the snapshot block:

- `CACHE_DIR="${DISPATCH_GRAPH_NODE_CACHE:-}"`. When empty, run **exactly today's path** (mktemp,
  archive, tar, `--dir`) with no new flags — this is the `/dispatch-ladder` and manual-invocation
  path and must stay byte-identical.
- When non-empty: `TREE=$(git -C "$REPO_ROOT" rev-parse origin/main:intentions)` — one cheap git
  call, and a **stronger** key than a directory fingerprint because it is the exact tree object the
  archive would have produced. On failure, fall through to today's path.
  `ENTRY="$CACHE_DIR/nodes-tree-$TREE.json"`.
  - `ENTRY` exists → run `select-targets.ts --nodes-json "$ENTRY"`, **skipping `mktemp`, `git
    archive` and `tar` entirely**. If that invocation fails for any reason, delete `ENTRY` and fall
    back to the full path — one retry, never a loop.
  - `ENTRY` absent → today's path plus `--emit-nodes "$ENTRY"`.
- Everything after the selector call — the `jq -c '.events'` read, the base64 event echo loop, every
  environmental gate, `DISPOSITION`, the `empty` protocol and all exit codes — is untouched.
- Keep the existing `git cat-file -e origin/main:intentions` "no store → legitimate `empty`" guard
  ahead of all of this.

Extend the script's header: the cache names a **storage location only**, never a node subset; an
unset var self-enumerates; the key is the `origin/main:intentions` tree sha so the entry is a pure
function of the exact tree being selected over; a corrupt entry degrades to a fresh strict
enumeration, never to a partial set and never to the tolerant reader.

Tests in `.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh` (already
auto-globbed by `run-unit-tests.sh`'s `for test_script in "$SCRIPTS"/test-*.sh` loop, so **no
`.github/workflows/unit-tests.yml` edit is needed**):

1. **Unset var** → stdout byte-identical to the pre-change run on the same fixture, and no cache
   file created anywhere.
2. **Cold then warm** → first run creates exactly one `nodes-tree-*.json`; second run's stdout is
   identical.
3. **Hit is real, and archive is skipped** → with the entry warm, shadow `git` (or `tar`) in `PATH`
   with a stub that fails loudly if `archive` is invoked; the selection still succeeds. This is the
   proof the 75 ms is actually saved rather than merely duplicated.
4. **Invalidation** → advance `origin/main` with a node change so the tree sha differs; the next run
   selects against the new tree and writes a second entry.
5. **Corrupt entry** → truncated JSON and a valid-JSON-but-invalid-node array both fall back to the
   archive path and produce the correct selection.
6. **Empty array refused** → an entry containing `[]` is rejected, not treated as "no candidates".

Add matching cases to `packages/intentionsutil/test/router.test.ts`'s neighbours or a small addition
to the store-cache suite for the `--nodes-json` / `--emit-nodes` argument handling if a pure-unit
seam is available; otherwise the shell suite above is sufficient coverage — do not invent a new
harness.

**Out of scope for this unit**: the tick-scoped cache directory's creation/cleanup (owned by
`tactic-review-stall-listnodes-duplicate-scan` Unit 3 — this unit only *reads* the exported var);
any change to selection ordering, gates, pacing, the claimed set, or the selection log; caching
across ticks; `office-hours-select`.

**Dependencies**: Unit 1 (shares the header-comment vocabulary and the "entry is always the complete
set" invariant; also keeps both cache-consumer changes reviewable as one story).

**Recommended model**: opus — this is the fleet's selection path, the highest-blast-radius consumer
of the store, and the fallback/refusal ladder is where a mistake becomes a silently narrowed
candidate set.

---

## Reuse

- `packages/intentionsutil/src/store-cache.ts` — `storeFingerprint(dir)` and
  `listNodesStrictCached(dir, cacheDir)`, plus its key-construction helper and its header comment's
  content-addressing rationale. **Import; never fork, never re-derive the key formula.** Created by
  `tactic-review-stall-listnodes-duplicate-scan`.
- `packages/intentionsutil/src/store.ts:187` `listNodesResilient`, `:232` `listNodes`, `:249`
  `listNodesStrict` — the enumeration primitives, and at `:216-231` the tolerant-vs-strict contract
  comment that Unit 1's asymmetry argument depends on. Read it; do not modify any of them.
- `packages/intentionsutil/src/schema.ts` — `validateNode(value: unknown): IntentionNode`, the
  no-cast way to re-type a parsed cache element (measured 8 ms for all 717 nodes, so validating on
  every cache hit is affordable and is the right default).
- `packages/intentionsutil/src/schema.ts` — `isLedgerEntry(node)`, located by name
  (`:580`, re-measured 2026-08-30), the canonical
  done-but-present exemption predicate. Not called by this plan, but the reason the ledger cohort is
  permanently retained; never re-spell `attributes.ledger_entry === true`.
- `packages/intentionsutil/src/router.ts` — `blockersComplete(tactic, byId)` and its
  strict-enumeration precondition comment: an id absent from the map reads as COMPLETE. This is the
  hazard Unit 1's never-write rule exists to prevent.
- `packages/intentionsutil/scripts/graph-census-debt.ts` — `computeDebt`, the
  `donePresent.push` guard inside it, `decideCensus`, and the
  `const nodes = listNodes(intentionsDir);` call inside `main()`. Locate each by
  name; re-measured 2026-08-30 they sit at `:123`, `:179-180`, `:318` and `:343`.
  Only the last one changes.
- `packages/intentionsutil/scripts/list-scope-stale-tactics.ts:34,78` — the tolerant import and its
  single `listNodes(dir)` call; the same decision/land split shape as `graph-census-debt.ts`.
- `packages/intentionsutil/scripts/select-targets.ts:32,58` — the `listNodesStrict` import and the
  one-line `selectGraphTargets(listNodesStrict(intentionsDir))`; the `--dir` parser and its
  `unknown argument` throw are the seam the two new flags join.
- `.claude/skills/dispatch-propagate/scripts/graph-select-target` — the `git cat-file -e` store
  guard, the `mktemp -d` / `git archive | tar -x` snapshot block, the `select-targets.ts` invocation,
  and the `DISPOSITION` / `empty` output protocol that must survive unchanged.
- `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick` — the
  `DISPATCH_CI_VERDICT_CACHE` mktemp + export + combined `EXIT` trap, located by
  the `# Tick-scoped CI-verdict memoisation` comment that opens it (`:300-315`,
  re-measured 2026-08-30); the precedent
  `DISPATCH_GRAPH_NODE_CACHE` follows and the reason both vars are already in the environment by the
  time its `dispatch-graph-census`, `dispatch-graph-scope-sweep` and
  `graph-select-target` invocations run — locate each by the script name it
  invokes (`:678`, `:695`, and `:917`/`:1215`/`:1221`, re-measured 2026-08-30).
- `.claude/skills/dispatch-propagate/scripts/lib.sh:822-921` — `dispatch_ci_verdict_rest`'s
  caller-owns-the-directory rule and its bounded-staleness header; the "never `mkdir`, never fail a
  sweep on a write error" discipline comes from here.
- `packages/intentionsutil/test/store.test.ts` — temp-dir fixture and `IntentionSchemaError`
  assertion style for the store-cache cases.
- `packages/intentionsutil/test/graph-census-debt.test.ts:1-60` — `strategy()` / `doneTactic()` /
  `openTactic()` pure builders, the established template for filesystem-free decision-module tests.
- `.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh` — the existing selector
  suite to extend; `run-unit-tests.sh`'s `for test_script in "$SCRIPTS"/test-*.sh`
  loop auto-globs it (`:202`, re-measured 2026-08-30).

## Verification

Run every fence from the worktree root.

```verify
npm test --prefix packages/intentionsutil
```

```verify
.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh
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

- **Prerequisite gate, before any code.** Confirm `packages/intentionsutil/src/store-cache.ts`
  exists on `origin/main` exporting `storeFingerprint` and `listNodesStrictCached`. If absent, add
  the `blocked_by` edge to `tactic-review-stall-listnodes-duplicate-scan` and stop — do not park,
  do not reimplement.
- **Confirm the win, do not assume it.** Against this repo's real `intentions/`, time each wired
  site with `DISPATCH_GRAPH_NODE_CACHE` unset and again against a warm directory:
  `node --import tsx/esm packages/intentionsutil/scripts/graph-census-debt.ts --threshold 10`,
  the scope-sweep enumerator, and `graph-select-target --top 1`. Baselines from ## Context:
  ~0.5 s cold per site, ~0.6 s for the selector including archive+tar. **If a cached path is not at
  least 3× faster, the design did not pay for itself** — re-disposition the finding rather than
  elaborate the cache.
- **Archive really is skipped.** Beyond the stubbed test, confirm by hand: warm the selector cache,
  then run `graph-select-target` under `strace`-free observation by checking that no new
  `/tmp/tmp.*` directory appears for that invocation.
- **Fail-closed did not regress.** With a warm cache, truncate one node file to `---\n` and confirm:
  the selector still refuses loudly (it must not serve a stale complete set as if the store were
  healthy — the tree-sha key means a working-tree corruption does not affect the `origin/main`
  selection, which is correct; state that explicitly in the header so the next reader does not read
  it as a bypass), and census/scope-sweep still degrade tolerantly with a stderr warning.
- **One tick in production.** After merge, watch one autonomous `dispatch-select-tick` in journald:
  census, scope-sweep and selector output must be unchanged in shape and content, with no new
  stderr. A tick that starts emitting enumeration failures is a fail-closed regression, not a cache
  miss.
- **Ladder path unchanged.** Invoke `/dispatch-ladder` on any node with no cache var in the
  environment and confirm identical behavior.
- **Scope check before opening the PR.** `git diff --stat` should touch only
  `packages/intentionsutil/src/store-cache.ts`, `packages/intentionsutil/test/store-cache.test.ts`,
  `packages/intentionsutil/scripts/graph-census-debt.ts`,
  `packages/intentionsutil/scripts/list-scope-stale-tactics.ts`,
  `packages/intentionsutil/scripts/select-targets.ts`,
  `.claude/skills/dispatch-propagate/scripts/graph-select-target`, and
  `.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh`. Anything touching
  `reconcile-graph*`, `graph-auto-merge`, `dispatch-select-tick`, `census-decide.ts`,
  `census-tick.ts`, or any `intentions/*.md` other than this node is scope creep into a sibling and
  must come out.
- **Hand off the ledger finding.** Record the `partitionDonePresent` missing-`isLedgerEntry` defect
  (## Context, "Finding handed off") against `tactic-census-scripted-tick`. Do not fix it here.
