---
id: tactic-graph-execute-fresh-main-read
kind: tactic
statement: The node-selection gate must perform its own origin/main freshness
  read so every caller inherits it -- today check-node-selection.ts reads the
  main checkout's working-tree intentions/ store whose freshness is maintained
  only by dispatch-select-tick, so any other caller (the sanctioned manual
  `dispatch <node-id>` lane included) evaluates the gate against a stale
  snapshot and can launch a worker onto a node that is parked on origin/main
owner: ai
status: codified
parent: null
rationale: "Found 2026-08-05 by the iteration-N+4 invariant audit, which asks of
  each operating invariant whether the greenfield design addresses it and which
  node owns it. Invariant I17 -- `sync the main checkout before every
  dispatch-graph-execute` -- had NO carrier. THE PRECONDITION IS REAL AND IT IS
  DOCUMENTED AS A COMMENT: provision-node-worktree's header (lines 122-125) says
  the gate is re-checked against `the just-fetched origin/main`, and that the
  main checkout is `kept fast-forwarded to origin/main by dispatch-select-tick,
  so its intentions/ store is the fresh-origin/main snapshot the gate requires`.
  That is a correctness precondition of the primitive satisfied by exactly ONE
  caller, named in prose, enforced nowhere. Mechanism: check-node-selection.ts
  resolves node state with `readNode(dir, nodeId)` against a filesystem
  directory, not against origin/main; dispatch-select-tick performs the `git
  fetch origin main && git merge --ff-only origin/main` (dispatch-select-tick
  ~L359-361) that makes that directory equal origin/main; dispatch-graph-execute
  contains no fetch and no ff-only merge of its own, so when it is invoked
  directly the gate silently reads whatever the checkout happens to hold. WHY IT
  MATTERS RATHER THAN BEING TIDINESS: N+3 established that parked nodes are
  invisible to every launch path precisely BECAUSE check-node-selection check 3
  exit-12s a parked node. That guarantee is only as fresh as the snapshot the
  check reads. A node parked on origin/main but not yet present in a stale local
  checkout reads unparked, the gate passes, and a worker launches onto a held
  node -- the same class of double-booking the 2026-08-05 concurrency ruling
  calls an invalid state, arrived at through staleness instead of through a
  missing claim check. MEASURED, NOT HYPOTHESISED: in the N+4 monitor session
  the operator ran the I17 sync by hand before a manual dispatch and the ff-only
  merge pulled roughly twenty added/changed intention files in one step, so the
  checkout was materially stale at the moment a dispatch was about to be issued;
  without the hand-run sync the gate would have evaluated that dispatch against
  a twenty-node-stale snapshot. The manual lane is not an edge case -- it is
  sanctioned doctrine: Lane 2 of the 2026-07-31 exception-lanes clarification
  makes `dispatch <node-id>` a deliberate human dispatch that bypasses the pace
  curve and the ceiling, and the N+4 plan mandates it for the promoted step-1
  node. So the one lane the design blesses for human use is the one lane the
  freshness invariant does not cover. THE GREENFIELD SHAPE IS ALREADY RECORDED
  ELSEWHERE IN THE GRAPH: the live node tactic-office-hours-select-fresh-main
  states it for the sibling selector -- `office-hours-select.ts performs its own
  local origin/main freshness read so every consumer inherits it, retiring the
  wrapper-only park_live_on_main duplication`. That is verbatim the same defect
  (freshness owned by a wrapper rather than by the primitive) and the same
  remedy (push the read down so every consumer inherits it), applied to a
  different script. This node is the unclaimed half. Dedup: a find-or-create
  pass found no node covering check-node-selection / dispatch-graph-execute
  freshness -- tactic-office-hours-select-fresh-main is scoped to
  office-hours-select.ts by its own statement, and tactic-graph-ref-split
  concerns which ref a worktree merges, not which snapshot the selection gate
  reads. Fix directions to weigh at planning time: (a) push the fetch into
  check-node-selection.ts and resolve node state from origin/main directly
  rather than from a working-tree directory, mirroring the office-hours-select
  remedy; (b) have dispatch-graph-execute perform the ff-only sync itself, which
  keeps the gate unchanged but re-creates the same wrapper-owned-precondition
  shape one level down; (c) make the gate refuse rather than proceed when it can
  detect the checkout is behind origin/main -- the unknown-never-clear posture
  of tactic-probe-unknown-never-clear, applied to staleness."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Has the stale-store read actually been observed launching a real
      session, and what makes it fire more often than the record implies?
    answer: "(Recorded 2026-08-11 rsi iteration.) Yes — reproduced live, and the
      pause makes it routine rather than rare. rsi-advance launched
      tactic-pause-disables-merge-lane seconds after that node landed on
      origin/main, and dispatch-graph-execute refused it with `stale-selection:
      exists: ... is no longer in the store (pruned or removed)`, mapped to exit
      10 `idle`. The node was on origin/main throughout; the main checkout was 4
      commits behind (65d8952d against origin/main 790aaab2), so the gate read a
      tree that predated the node. Fast-forwarding the main checkout by hand and
      re-running launched it immediately. Two things this adds to the record
      above. First, the failure is not only 'launch a worker onto a node parked
      on origin/main' (a false positive); it is equally a false NEGATIVE — a
      node that exists and is eligible reports as pruned, and the caller cannot
      distinguish that from a genuine prune, so the correct-looking response is
      to stop. Second, the freshness precondition is maintained only by
      dispatch-select-tick, and dispatch-select-tick does not run while the
      pause sentinel is present (dispatch-tick exits at :415, before every
      dispatch-select-tick invocation at :638-642). So during a pause nothing
      fast-forwards the main checkout, its store drifts further from origin/main
      the longer the pause lasts, and every non-tick launch path — the
      sanctioned manual `dispatch <node-id>` lane and rsi-advance alike — reads
      a store that is stale by construction. The pause is exactly when
      hand-dispatch is the prescribed mode, so the gate is least reliable
      precisely when it is most used. Same root as
      tactic-pause-disables-merge-lane: work that only dispatch-select-tick
      performs stops silently while paused."
tooling_goals: []
success_signal: null
attention:
  boost: 0.04
  override: null
  rationale: >-
    Bootstrap band 2 (50/20/10 interim scale): a launch-path correctness defect
    that can double-book a held node -- same band as the other
    dispatch-containment fixes, and the sibling tactic-probe-unknown-never-clear
    carries the same boost.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 20 to 0.04 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
  tier: 1
phase: qa
execution:
  branch: tactic-graph-execute-fresh-main-read
  pr: 3056
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix:
    since: 2026-08-10
    attempt: 2
    pushed_sha: e921987afd69d9204186088d253a87ed43f4d4d5
  conflict: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 20
---
# The node-selection gate must take snapshot provenance as an explicit input

Carrier for invariant **I17** ("sync the main checkout before every `dispatch-graph-execute`").
The design below satisfies I17 by making the sync's *absence* detectable and refused-by-default at
the read site, rather than by relying on every caller to remember to sync first.

## Context

### The defect

`packages/intentionsutil/scripts/check-node-selection.ts` is the mechanical selection-validity gate.
Its check 3 (`office_hours` non-null → exit 12) is what makes a parked node invisible to every launch
path — but that guarantee is only as fresh as the store snapshot the check reads.

`evaluateSelection` resolves node state with `readNode(dir, nodeId)` against a filesystem directory.
Its first production caller, `.claude/skills/dispatch-propagate/scripts/provision-node-worktree`,
runs `git fetch origin main` (line 115) and then hands the gate **the main checkout's working-tree
store** — `--dir "$PROJECT_ROOT/intentions"` (line 129-130). That directory equals `origin/main` only
because a *different* script fast-forwards it:
`.claude/skills/dispatch-propagate/scripts/dispatch-select-tick` Step 1, lines 359-361
(`git fetch origin main` then `git merge --ff-only origin/main`).

That precondition is written down **as prose in a comment** at
`provision-node-worktree:120-127` ("The main checkout is kept fast-forwarded to origin/main by
dispatch-select-tick, so its intentions/ store is the fresh-origin/main snapshot the gate requires")
and is enforced nowhere. `dispatch-graph-execute` — provision's caller — has no fetch and no ff-only
merge of its own (re-verified this planning round: the single `git fetch` string in that file, at
line 474, is human-facing prose inside an error message, not an invocation). A node parked on
`origin/main` but not yet present in a stale local checkout reads unparked, the gate passes, and a
worker launches onto a held node.

**Measured, not hypothesised:** in the N+4 monitor session the operator ran the I17 sync by hand
before a manual dispatch and the ff-only merge pulled roughly twenty added/changed intention files in
one step — the checkout was materially stale at the moment a dispatch was about to be issued.

The manual lane is not an edge case: Lane 2 of the 2026-07-31 exception-lanes clarification on
`strategy-graph-native-dispatch` makes `dispatch <node-id>` (and bare `dispatch`) a deliberate human
dispatch that bypasses the pace curve and the concurrency ceiling. It routes through
`nix/packages/dispatch.nix` → `dispatch-tick` → `dispatch-select-tick` + `dispatch-graph-execute`.

### Doctrinal basis — ratified at the 2026-08-09 office-hours sitting (commit `7c3e2a99`). Do not re-litigate.

The sitting reviewed two options and ratified a **third** design for both limbs.

**Limb i — where the freshness read belongs.** Neither option originally framed:

- Putting the read *inside* `check-node-selection.ts` hides a network fetch in a predicate documented
  as pure (its own doc comment, re-verified this round at line 202: *"Pure: reads files, returns a
  result — no process exit, no direct stdio."* — re-grep the literal string `no process exit`, the
  line number has already drifted once), and pays that fetch per node per selection pass — untenable
  at the store's scale (553 nodes measured at the sitting).
- Putting it into `dispatch-graph-execute` discharges the obligation for exactly one caller and
  leaves the next caller to rediscover the bug — it merely relocates the wrapper-owned-precondition
  shape from `dispatch-select-tick` to its sibling, rather than retiring it.

**Instead: make the snapshot provenance an EXPLICIT INPUT to the predicate.** `evaluateSelection`
receives a `snapshot` parameter carrying `ref`, `sha` and `fetchedAt` alongside `dir`, and returns a
distinct result variant (`unknown-freshness`) when freshness cannot be proven. It never fetches, so
purity holds. Acquisition moves to the caller, which pays one fetch per launch rather than one per
node. Because the requirement is encoded in the *result shape* and in a *required* input field, no
caller — including a future third one — can silently skip it. That generalization is the property
both original options fail.

**Limb ii — behavior when freshness cannot be established.** Refuse by default, with an explicit and
**recorded** operator override. Pure refuse is right on fail-safety and consistent with
`worktree_has_live_session` folding daemon-UNKNOWN into occupied — but pure refuse alone fails every
manual dispatch closed when the network is unavailable, on the one lane whose entire purpose is
deliberate human override. So the manual lane gets `--allow-stale`, which records in the dispatch
record that the operator knowingly proceeded on an unverified snapshot. Operator cost becomes one
flag instead of a wall, and a stale dispatch becomes **attributable** after the fact rather than
silent — silence is the actual I17 failure, not staleness itself.

**Ratified sequencing** (mapped onto the units below): 1 → Unit 1, 2 → Unit 2, 3 → Unit 3,
"flip the default to refuse" → Unit 5. Unit 4 is the addition this planning round found necessary to
make the ratified escape hatch reachable at all; see its scope for why.

### Where this plan extends the ratification (and why)

Two findings from re-verifying state this round change the shape of steps 2-3 as the sitting sketched
them. Both are recorded here so a fresh session does not read them as drift:

1. **`dispatch-select-tick` is not a caller of the gate.** It performs the sync; the gate is called
   only by `provision-node-worktree` and `assert-node-selection` (and, transitively, by
   `dispatch-derive-node-target` → `assert-node-selection`). "Step 2: select-tick passes real
   provenance" therefore becomes: *each of the three snapshot-acquisition sites, all of which already
   fetch, captures and passes its own provenance* — and `provision-node-worktree` stops reading the
   shared working tree entirely, materializing its own snapshot from the ref it just fetched
   (exactly what `assert-node-selection:101-112` and `dispatch-derive-node-target:163-169` already
   do). That retires the prose precondition rather than merely detecting its violation.

2. **The offline manual lane currently dies upstream of the gate.** With the network down,
   `dispatch-select-tick`'s Step 1 fetch fails, it emits `sync-failed`, and `dispatch-tick` exits at
   line 645 — `dispatch-graph-execute` is never reached. A `--allow-stale` flag that only reaches the
   gate would be unreachable in its own motivating scenario. Unit 4 wires the override through the
   sync probe so the escape hatch actually works end-to-end.

### Intended outcome

- No caller of the selection gate can read an unattested store without saying so.
- The default posture on unprovable freshness is **refusal**, not a silent pass.
- The one sanctioned human-override lane can proceed offline, at the cost of one flag, and every such
  dispatch leaves an attributable record in the decision log.
- A transient `git fetch` failure stops parking nodes to `office_hours` (today
  `provision-node-worktree` exits 2 on fetch failure, which `dispatch-graph-execute`'s `*)` arm turns
  into a `park-node` graph write — an environment condition written into the graph as a node defect).

### Facts a fresh session should re-verify before editing (this store has a documented history of citation drift)

- `grep -n "no process exit" packages/intentionsutil/scripts/check-node-selection.ts` — the purity
  contract. Was L177 at park time, L202 now.
- `provision-node-worktree` lines 113-146 — fetch, gate invocation, `ORIGIN_SHA` capture, stamp write.
- `dispatch-select-tick` lines 287-380 — the `BRANCH == main` sync block, including the
  `sync-repair-pending` / `sync-failed` / `sync-broken` dispositions.
- `dispatch-graph-execute` lines 228-470 — the `prov_rc` case arms (0/10/11/12/13/14/`*`).
- Exit-code space: `provision-node-worktree` uses 2, 10, 11, 12, 13, 14. **15 is free** and is the
  code this plan claims for `unknown-freshness`.

### Related nodes — read before implementing, do not absorb

- **`tactic-office-hours-select-fresh-main`** (phase `main-qa`, **still `office_hours`-parked** as of
  this planning round): same defect class (freshness owned by a wrapper, not the primitive), same
  remedy shape, applied to `office-hours-select.ts`. Its landed helper
  `packages/intentionsutil/scripts/lib-store-at-ref.ts` (`listNodesAtRef(repoRoot, ref)`) is the
  model for *how* to materialize a store at a ref, **not** a drop-in for this node: it returns
  `IntentionNode[]` for a selector to filter, whereas `evaluateSelection` takes a `dir` and reasons
  about one node against the whole enumerated store. This plan keeps the `--dir`-based
  archive-snapshot convention (what `assert-node-selection` and `dispatch-derive-node-target`
  already use) rather than routing through `listNodesAtRef`. Do reuse its two hard-won lessons: the
  fetch-remedy error message (lines 56-63) and the `git archive | tar -x` pipeline hazard (lines
  44-48 — without `pipefail`, a failing `git archive` still exits 0 through `tar`, yielding a
  silently empty store).
- **`tactic-explicit-ref-graph-reads`** (raw, no phase) states the broader principle ("every graph
  read resolves its tree from an explicit ref"). This node is the narrow, ratified slice of it for
  one primitive. Do **not** widen this plan to cover `validate-graph.ts`, `transition-node`,
  `write-node.ts` or `clear-park` — that is the broader node's scope.
- **`tactic-graph-execute-claimless-manual-launch`** (raw, no phase) also edits
  `dispatch-graph-execute`, for claim-safety rather than freshness. Both land in the same per-spec
  loop. Whichever lands second must rebase onto the other; neither supersedes the other.
- **`tactic-probe-unknown-never-clear`** (raw, no phase) is the design precedent for the
  refuse-on-unknown posture in Unit 5. It is not itself codified.

---

## Unit 1 — Snapshot provenance as a required input to `evaluateSelection`, with an `unknown-freshness` result variant (warn-only)

### Scope

**Changes — `packages/intentionsutil/scripts/check-node-selection.ts`:**

- Add next to the existing exit constants (currently lines 58-59,
  `EXIT_STALE_SELECTION = 12` / `EXIT_SCOPE_STALE = 13`):
  ```ts
  export const EXIT_UNKNOWN_FRESHNESS = 15; // the snapshot's provenance could not be proven
  ```
- Add the provenance type and its policy constants:
  ```ts
  export interface SnapshotProvenance {
    /** The git ref the snapshot dir was materialized from, e.g. "origin/main". */
    ref: string;
    /** The 40-hex commit that ref resolved to at materialization time. */
    sha: string;
    /** ISO-8601 instant the caller's `git fetch` of that ref SUCCEEDED. */
    fetchedAt: string;
  }
  export const MAX_SNAPSHOT_AGE_MS = 10 * 60 * 1000;
  export const MAX_SNAPSHOT_CLOCK_SKEW_MS = 60 * 1000;
  export type FreshnessVerdict = { kind: "proven" } | { kind: "unknown"; detail: string };
  export function classifySnapshot(s: SnapshotProvenance | null, now: Date): FreshnessVerdict;
  ```
  `classifySnapshot` returns `unknown` with a specific `detail` for each of: no provenance supplied;
  empty `ref`; `sha` not matching `/^[0-9a-f]{40}$/`; `fetchedAt` not parseable as a date;
  `now - fetchedAt > MAX_SNAPSHOT_AGE_MS` (detail names both the observed age and the limit, in
  seconds); `fetchedAt - now > MAX_SNAPSHOT_CLOCK_SKEW_MS` (future-dated attestation). Otherwise
  `proven`. It is pure — `now` is a parameter, never `new Date()` inside.
  Do **not** constrain the *value* of `ref` to `origin/main`: `tactic-graph-ref-split` may move the
  canonical ref, and this predicate records provenance rather than dictating policy on which ref is
  canonical.
- Extend `SelectionOpts` (currently lines 63-68). `snapshot` is **required, non-optional** — that
  type-level requirement is half the point of the design; `allowStale` and `now` are optional:
  ```ts
  snapshot: SnapshotProvenance | null;
  allowStale?: boolean;   // becomes load-bearing in Unit 5
  now?: Date;             // injectable clock, defaults to new Date() in `main`
  ```
- Widen `SelectionResult.exitCode` (line 70-77) from `0 | 12 | 13` to `0 | 12 | 13 | 15`.
- In `evaluateSelection` (declared at line 214), call `classifySnapshot` **first, before check 1** —
  no other verdict may be computed from an unproven store. In THIS unit the `unknown` branch is
  **warn-only**: push exactly one line onto `stderr` and fall through to the existing five checks:
  ```
  unknown-freshness: <detail> (WARNING — not yet enforced; enforcement lands in this tactic's Unit 5)
  ```
  When `allowStale` is set, the warning instead reads
  `unknown-freshness: <detail> (--allow-stale: the operator accepted an unverified snapshot)` — the
  two texts must differ so tests and log greps can tell an un-attested read from an attested one.
- CLI: `parseArgs` (around lines 405-435) gains `--snapshot-ref <ref>`, `--snapshot-sha <sha>`,
  `--snapshot-fetched-at <iso8601>` and `--allow-stale`. **Partial provenance (one or two of the
  three) is `snapshot: null`, not a usage error** — a caller that half-plumbs the flags must be
  refused through the freshness path, not crashed into exit 2 (which `dispatch-graph-execute` routes
  to `park-node`). All three absent is likewise `null`.
- `main` (lines 437-443) passes `now: new Date()` and maps exit 15 through unchanged (it already
  writes `result.stderr` then `process.exit(result.exitCode)`).
- Update the header doc block (lines 1-40): add the new flags to the usage line; add a "check 0 —
  snapshot freshness" entry above the numbered five; and add one sentence stating that provenance is
  an **input**, never acquired here. **Keep the purity sentence verbatim.** State explicitly that
  `node:child_process` must never be imported into this file.

**Tests — `packages/intentionsutil/test/check-node-selection.test.ts`:**

- All 45 existing `evaluateSelection({...})` call sites gain a `snapshot` field. Add one local helper
  near `anode` (line 14) so this is mechanical:
  ```ts
  const fresh = (): SnapshotProvenance =>
    ({ ref: "origin/main", sha: "a".repeat(40), fetchedAt: new Date().toISOString() });
  ```
  Existing cases pass `snapshot: fresh()` so their asserted exit codes and `stderr: []` stay valid.
- New `describe("classifySnapshot")` covering each `unknown` detail branch and the `proven` case,
  driving the age boundary deterministically through the `now` parameter (assert both sides of
  `MAX_SNAPSHOT_AGE_MS` and of `MAX_SNAPSHOT_CLOCK_SKEW_MS`).
- New `evaluateSelection` cases: (a) fresh snapshot + matching directive → exit 0 with `stderr: []`
  (proves no warning noise on the happy path); (b) `snapshot: null` + matching directive → exit 0
  with exactly one `stderr` line matching `/^unknown-freshness:/` and containing `not yet enforced`;
  (c) `snapshot: null` + `allowStale: true` → exit 0 with a warning containing `--allow-stale`;
  (d) `snapshot: null` + a **parked** node → still exit 12 in this unit (records the pre-flip
  ordering that Unit 5 deliberately changes).

**Out of scope:** any bash caller (Unit 2); any behavior change on an unproven snapshot (Unit 5);
`listNodesAtRef` refactors; `compute-freshness.ts`, `validate-graph.ts`, `transition-node`,
`write-node.ts`, `clear-park`.

**Recommended model:** opus — a purity contract, a widened public result type, and a policy the
whole plan rests on.

---

## Unit 2 — Every acquisition site captures and passes its own provenance; `provision-node-worktree` stops reading the shared working tree

### Scope

**New file — `.claude/skills/dispatch-propagate/scripts/lib-main-snapshot.sh`** (sourceable, mirrors
the style of `lib-decision-log.sh` / `lib-worktree-in-sync.sh` in the same directory):

- `main_snapshot_capture <repo_root> [<ref>]` — `ref` defaults to `origin/main`. Runs
  `git -C <repo_root> rev-parse <ref>`; on success sets `MAIN_SNAPSHOT_REF`, `MAIN_SNAPSHOT_SHA`,
  `MAIN_SNAPSHOT_FETCHED_AT` (`date -u +%FT%TZ`) and the array
  `MAIN_SNAPSHOT_FLAGS=(--snapshot-ref "$ref" --snapshot-sha "$sha" --snapshot-fetched-at "$ts")`;
  returns 1 and leaves `MAIN_SNAPSHOT_FLAGS=()` on failure. **Contract, documented in the header:
  call this only immediately after a `git fetch` of that ref SUCCEEDED** — `fetchedAt` attests the
  fetch, not the `rev-parse`.
- `main_snapshot_materialize <repo_root> <ref> <dest_dir>` — `git archive <ref> intentions` into a
  temp tar file, then `tar -x -C <dest_dir>`, as **two separately status-checked commands, never a
  pipeline**. Cite `packages/intentionsutil/scripts/lib-store-at-ref.ts:44-48`: without `pipefail` a
  failing `git archive` still exits 0 through `tar`, extracting an empty stream — a silently empty
  store, which for a fail-closed gate reads as "nothing is parked".
- `main_snapshot_write_sidecar <project_root> <node_id>` — writes the captured triple as one JSON
  object to `<project_root>/.claude/worktrees/<node_id>.snapshot-provenance`. Same sidecar convention
  as `provision-node-worktree`'s `<node_id>.scope-fingerprint` (line 127-128) and
  `dispatch-graph-execute`'s `<id>.conflict-strikes` (line 444): deliberately outside every checkout
  so it never dirties a tree, and removed with the worktree. Writes `{"ref":…,"sha":…,
  "fetchedAt":…}` when provenance was captured and `{"ref":…,"sha":…,"fetchedAt":null}` when it was
  not.

**`.claude/skills/dispatch-propagate/scripts/provision-node-worktree` (lines 113-146):**

- After the existing `git fetch origin main` (line 115) succeeds, `main_snapshot_capture "$PROJECT_ROOT"`.
- **Replace `--dir "$PROJECT_ROOT/intentions"` with a snapshot this script materializes itself.**
  `SNAP_DIR=$(mktemp -d)`, `trap 'rm -rf "$SNAP_DIR"' EXIT`,
  `main_snapshot_materialize "$PROJECT_ROOT" origin/main "$SNAP_DIR"`, then pass
  `--dir "$SNAP_DIR/intentions"` plus `"${MAIN_SNAPSHOT_FLAGS[@]}"`. This is the change that retires
  the I17 precondition rather than only detecting its breach.
- **Delete the prose precondition** at lines 120-127 ("The main checkout is kept fast-forwarded to
  origin/main by dispatch-select-tick, so its intentions/ store is the fresh-origin/main snapshot the
  gate requires") and replace it with a comment stating that the gate now reads a snapshot this
  script materialized from the ref it just fetched, and that the provenance of that snapshot is
  passed explicitly.
- **Reuse `$MAIN_SNAPSHOT_SHA` for the stamp write** at line 144-145 instead of re-running
  `git -C "$PROJECT_ROOT" rev-parse origin/main` after the gate. Today those are two separate reads
  and can differ, so the stamp's "routing-back provenance anchor" can name a sha the gate never read.
  One capture, both consumers.
- Call `main_snapshot_write_sidecar` on the pass path so `dispatch-graph-execute` (Unit 3) can read
  what was actually used without re-deriving it.
- Header: note the new snapshot behavior in the exit-code/behavior block near lines 15-40.

**`.claude/skills/dispatch-propagate/scripts/assert-node-selection` (lines 88-120):**

- After the fetch at line 97, `main_snapshot_capture "$PROJECT_ROOT"`; pass
  `"${MAIN_SNAPSHOT_FLAGS[@]}"` on the gate invocation at line 118.
- Add optional passthrough flags `--snapshot-ref/--snapshot-sha/--snapshot-fetched-at` to this
  script's own arg loop (lines 40-69) so a caller supplying `--dir` can also supply the provenance of
  the dir it built. When `--dir` is given with no provenance flags, forward none — the gate then
  reports `unknown-freshness` (warn-only until Unit 5).
- Rewrite the comment at lines 92-95 ("The caller asserts this is already a fresh-origin/main
  snapshot — use it verbatim, no fetch"): the assertion is now a typed, checkable input, and an
  unaccompanied `--dir` is an unattested read.

**`.claude/skills/dispatch-propagate/scripts/dispatch-derive-node-target`:**

- After the fetch at line 158 succeeds, `main_snapshot_capture "$REPO_ROOT"`; pass
  `"${MAIN_SNAPSHOT_FLAGS[@]}"` alongside the existing `--dir "$SNAP_DIR/intentions"` at line 209.
- Its existing exit mapping (`12 → 3`, `13 → 5`, `* → 1`) is unchanged in this unit; Unit 3 adds 15.

**Tests:**

- `.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh` — a case asserting that
  after a successful provision, `<fixture-root>/.claude/worktrees/<id>.snapshot-provenance` exists and
  its `.sha` equals `git -C <fixture-root> rev-parse origin/main`, and its `.fetchedAt` is non-null.
  Parse with `jq -r … <<<"$JSON"` (never `echo "$JSON" | jq` — `.claude/rules/shell-json.md`).
- `.claude/skills/dispatch-propagate/scripts/test-assert-node-selection.sh` — extend Test 6
  (`--dir` override) with a sibling case supplying the three provenance flags, asserting exit 0 and
  no `unknown-freshness` line on stderr; keep the bare-`--dir` case asserting exit 0 *with* the
  warning line.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-derive-node-target.sh` — assert the
  derive path still exits 0 on a valid selection and emits no `unknown-freshness` warning.
- `.github/workflows/unit-tests.yml` — add a step running
  `.claude/skills/dispatch-propagate/scripts/test-assert-node-selection.sh` next to the existing
  `test-provision-node-worktree.sh` step (line 246) and `test-dispatch-derive-node-target.sh` step
  (line 248). That harness is hermetic and currently green but is **not** wired into CI — a real gap
  this unit closes. Do **not** add `test-dispatch-select-tick.sh`; wiring it is out of scope.

**Out of scope:** any behavior change when provenance is missing (still warn-only); `--allow-stale`
plumbing (Unit 3); the `sync-failed` path (Unit 4).

**Dependencies:** Unit 1.

**Recommended model:** sonnet — mechanical plumbing against fully specified anchors, no new design.

---

## Unit 3 — `--allow-stale` reaches the gate, exit 15 is routed, and the override is recorded

At the end of this unit exit 15 still cannot occur (Unit 1 left `unknown-freshness` warn-only). That
is deliberate: the routing and the record land before the refusal does, so Unit 5 is a one-branch
flip and not a behavior cliff.

### Scope

**`nix/packages/dispatch.nix`:** the shim currently does `[ "$#" -eq 0 ] && exec "$TICK" --manual`,
else `exec "$TICK" "$@"`. So `dispatch --allow-stale` (no node id) would drop into the **autonomous**
tick. Change the test from "no arguments" to "no *positional* argument": loop `"$@"`, and if every
argument begins with `-`, `exec "$TICK" --manual "$@"`. Update the header comment block (lines 3-5).

**`.claude/skills/dispatch-propagate/scripts/dispatch-tick`:**

- Arg loop (lines 263-287): accept `--allow-stale`, setting `ALLOW_STALE=1`.
- Reject it on the autonomous path — alongside the existing `--manual` + node-id conflict check at
  lines 295-298: if `ALLOW_STALE` is set and neither `MANUAL` nor `NODE_ARG` is, exit 2 with
  `dispatch-tick: --allow-stale requires --manual or an explicit <node-id> (the autonomous tick has
  no operator to attest an unverified snapshot)`. Update the usage strings at lines 6, 270 and 282.
- In the `graph)` arm (line 745), pass the flag through:
  `"$SCRIPT_DIR/dispatch-graph-execute" ${ALLOW_STALE:+--allow-stale} "$@"`.

**`.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute`:**

- Parse a leading `--allow-stale` before the `<id:kind:phase>` specs (the `$# -lt 1` guard and usage
  string are at lines 110-114; the header usage line is at 56). Forward it to
  `provision-node-worktree`.
- New case arm between 14 and `*)` (the case block runs from line 230 to line 477):
  ```
  15)
    # unknown-freshness: the selection gate could not prove the store snapshot
    # is at a freshly-fetched ref. An ENVIRONMENT condition, not a node defect —
    # no graph write, no park. Clear the reservation (mirrors case 12: no spawn
    # happened) so the next tick re-selects the node once the fetch works.
    reservation_clear "$id" || true
    echo "refused $id unknown-freshness"
    ;;
  ```
  Add `refused <id> unknown-freshness` to the stdout vocabulary block in the header (lines 58-100).
- Source `lib-decision-log.sh` and, when `--allow-stale` was supplied **and** the node launched,
  append one attestation line — this is "the dispatch record" limb ii requires. Build it with
  `jq -c -n` and call `decision_log_append` behind a `command -v decision_log_append >/dev/null 2>&1
  && … || true` guard, exactly as `dispatch-standdown:208-216` and `lib-frozen-session-park.sh:339`
  do (the helper is best-effort and must never wedge a launch). Fields: `ts`, `site:"graph-execute"`,
  `target:<id>`, `phase`, `disposition:"allow-stale"`, and a `snapshot` object read from the
  `<id>.snapshot-provenance` sidecar Unit 2 writes.

**`.claude/skills/dispatch-propagate/scripts/provision-node-worktree`:**

- Accept `--allow-stale` in its own arg handling and forward it to `check-node-selection.ts`.
- Map gate `GATE_RC == 15` to `exit 15` alongside the existing 12/13 passthrough (lines 131-135).
- Document exit 15 in the header exit-code list (lines 15-40).

**`.claude/skills/dispatch-propagate/scripts/dispatch-derive-node-target`:** add `15) exit 1 ;;` to
its gate `case` (lines 211-215) so the new code is explicitly a mechanical error on that path rather
than falling into the catch-all by accident. Leave its exit contract otherwise unchanged.

**`.claude/skills/align-tactics/SKILL.md`:** the Step 0 exit-code routing (lines 124-150) enumerates
`0`, `12`, `13`, "any other non-zero". Add a `15` bullet: unknown-freshness — the gate could not
prove the snapshot is fresh. **STOP**, make no graph write, and record the terminal disposition with
`mark-node-terminal "<target-node-id>" no-claim`, exactly as the `12` bullet already prescribes (this
session did nothing and lost nothing, so reaping it is correct). Do not tell that session to retry
with `--allow-stale`: the override is an operator act on the dispatch lane, not a self-serve escape
for an autonomous worker.

**Tests:** `.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh` — a case
driving a stubbed `provision-node-worktree` that exits 15, asserting stdout is
`refused <id> unknown-freshness`, that no `park-node` / `hold-node` / `demote-node-to-implement` ran,
and that the reservation marker for the node is gone. (The harness already stubs provisioning; the
standalone invocation at line 433 is test-only and is **not** evidence of a production caller that
skips `dispatch-select-tick`.)

**Out of scope:** making `unknown-freshness` refuse (Unit 5); the `sync-failed` bypass (Unit 4).

**Dependencies:** Units 1, 2.

**Recommended model:** sonnet.

---

## Unit 4 — Make the manual lane reachable when the network is down

Without this unit `--allow-stale` cannot fire in the scenario limb ii cites: with the network down,
`dispatch-select-tick`'s Step 1 fetch fails, it emits `sync-failed`, and `dispatch-tick` exits at
line 645 before `dispatch-graph-execute` runs.

### Scope

**`.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`:**

- Arg loop (lines 149-172): accept `--allow-stale` → `ALLOW_STALE=1`. Reject it unless `MANUAL` or
  `NODE_ARG` is set, using the same `DLOG_DISPOSITION="usage-error"` shape as the unknown-flag arm at
  line 154.
- In the Step 1 sync block, at the point where `merge_ok != 1` today routes to the repair /
  `sync-failed` / `sync-broken` ladder (the fetch/merge probe is at lines 349-370; the dispositions
  follow it): when `ALLOW_STALE=1`, **do not** emit `sync-failed` and **do not** return. Instead:
  - still arm the repair reseed exactly as today (best-effort; the environment must still self-heal),
  - do **not** reset the attempt counter and do **not** close the `sync-broken` latch — the tree was
    never proven clean, so nothing has recovered,
  - set `DLOG_SKIP_REASON="allow-stale-sync-bypass"` so the tick's own decision-log record (built at
    lines 115-130) carries it,
  - write one loud stderr line naming the node and that selection is proceeding against an unverified
    local checkout,
  - fall through to selection.
- Add a `snapshot`/`allow_stale` field to the select-tick decision-log object (lines 115-130) so the
  bypass is visible in the same record the routing disposition lives in.

**`.claude/skills/dispatch-propagate/scripts/dispatch-tick`:** pass `--allow-stale` through to
`dispatch-select-tick` in all three Step 1 branches (lines 637-643).

**Tests — `.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh`:** two cases
against a fixture whose `origin` remote is unreachable (so `git fetch origin main` fails):
(a) `dispatch-select-tick <node-id>` → last stdout line is still `sync-failed` (the control — proves
the bypass is opt-in); (b) `dispatch-select-tick --allow-stale <node-id>` → last stdout line is a
`graph …` decision, stderr carries the bypass warning, and the decision-log line carries
`allow-stale-sync-bypass`. Read the log with `jq … <<<"$LINE"`, never `echo | jq`.
This harness is not in CI (see Unit 2) and is not being wired in here; run it locally.

**Out of scope:** the `sync-repair-pending` branch (a live repair session is mutating the tree — that
is a concurrency hazard, not a freshness one, and `--allow-stale` must not bypass it); the
`sync-broken` latch semantics; any change to the autonomous tick's behavior.

**Dependencies:** Unit 3.

**Recommended model:** opus — this edits the router's most consequential branch, where a wrong
fall-through silently disarms the sync ladder for every tick.

---

## Unit 5 — Flip the default: unprovable freshness refuses

### Scope

**`packages/intentionsutil/scripts/check-node-selection.ts`:** in `evaluateSelection`, the
`classifySnapshot` → `unknown` branch (added warn-only in Unit 1) becomes:

```ts
if (verdict.kind === "unknown") {
  if (!allowStale) {
    return { exitCode: EXIT_UNKNOWN_FRESHNESS, stdout: null,
             stderr: [`unknown-freshness: ${verdict.detail}`] };
  }
  stderr.push(`unknown-freshness: ${verdict.detail} (--allow-stale: the operator accepted an unverified snapshot)`);
}
```

It already runs before check 1, so **no** verdict is computed from an unproven store. Consequence to
document in the header: a node parked on `origin/main` but read through a stale snapshot now exits
**15, not 12**. Both refuse the launch; 15 is the honest reason, because the gate cannot see the park
at all. Remove the "not yet enforced" wording from the header and the warning text.

**`.claude/skills/dispatch-propagate/scripts/provision-node-worktree`:** a failed
`git fetch origin main` (line 115) currently exits 2, which `dispatch-graph-execute`'s `*)` arm turns
into a `park-node` graph write. Change it to:

- if `origin/main` still resolves locally (`git rev-parse origin/main` succeeds), materialize the
  snapshot from that local ref and pass `--snapshot-ref origin/main --snapshot-sha <sha>` with **no**
  `--snapshot-fetched-at` — an unattested snapshot. The gate then returns 15 (refuse) or, with
  `--allow-stale`, passes with the attestation warning. Write the sidecar with `"fetchedAt": null`;
- if `origin/main` does not resolve at all, keep today's `exit 2` (a genuinely broken checkout).

**Tests:**

- `packages/intentionsutil/test/check-node-selection.test.ts` — flip the Unit-1 warn-only cases:
  `snapshot: null` → exit 15 with a single `unknown-freshness:` line and `stdout: null`;
  `snapshot: null` + `allowStale: true` → the pre-flip exit code with the `--allow-stale` warning;
  `snapshot: null` + a **parked** node → exit 15 (not 12), asserting the ordering change explicitly;
  a snapshot older than `MAX_SNAPSHOT_AGE_MS` → exit 15; a fresh snapshot → unchanged exit 0 with
  `stderr: []`.
- `.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh` — point the fixture's
  `origin` at a nonexistent path so the fetch fails, then assert: exit 15 without `--allow-stale`,
  and exit 0 with it (plus a `<id>.snapshot-provenance` sidecar whose `.fetchedAt` is `null`).
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh` — end-to-end with the
  fetch broken: without the flag the line is `refused <id> unknown-freshness` and no `park-node` ran;
  with `--allow-stale` the node launches and a decision-log line with `disposition:"allow-stale"` is
  appended (point `DISPATCH_DECISION_LOG_DIR` at a scratch dir — see `lib-decision-log.sh:47-54` and
  `lib-test-decision-log-guard.sh`).

**Out of scope:** widening the gate to any other primitive; changing `MAX_SNAPSHOT_AGE_MS` into a
`dispatch.config` tunable (a baked-in constant, matching the `CONFLICT_STRIKE_CAP` precedent at
`dispatch-graph-execute:141-148`).

**Dependencies:** Units 1, 2, 3, 4.

**Recommended model:** opus — this is the unit that can wedge the fleet if the policy is wrong; it
owns both the refusal and the fetch-failure fallback.

---

## Reuse

- `packages/intentionsutil/scripts/check-node-selection.ts:58-77, 202, 214, 437-455` — the exit
  constants, `SelectionOpts` / `SelectionResult`, the documented-pure `evaluateSelection`, and the
  thin `main`. Extend this pure-core/thin-main split; do not replace it.
- `packages/intentionsutil/scripts/compute-freshness.ts:22-24, 40-72, 74-108` — the closest existing
  precedent for the whole design: a pure freshness computation whose caller acquires the snapshot and
  passes it as an explicit `--snapshot` path. Mirror its argument and doc-comment shape.
- `.claude/skills/dispatch-propagate/scripts/transition-node:161, 182, 186` — the production
  wrapper-acquires / pure-function-consumes split (`mktemp` → `git archive origin/main intentions` →
  `compute-freshness.ts --snapshot`). This is the pattern Unit 2 applies to `provision-node-worktree`.
- `.claude/skills/dispatch-propagate/scripts/assert-node-selection:97-118` — a ready template for
  fetch + `mktemp` + `git archive origin/main intentions/` + `--dir`.
- `packages/intentionsutil/scripts/lib-store-at-ref.ts:44-48, 56-63` — the `git archive | tar`
  pipefail hazard and the fetch-remedy error message. Copy the *lessons*; the function itself returns
  `IntentionNode[]` and is not a drop-in for a `--dir`-based gate.
- `.claude/skills/dispatch-propagate/scripts/lib-decision-log.sh` — `decision_log_append`, the single
  shared writer of the dispatch record. Call sites to imitate: `dispatch-standdown:208-216`,
  `lib-frozen-session-park.sh:315-339`. Test isolation via `DISPATCH_DECISION_LOG_DIR`
  (`lib-decision-log.sh:47-54`, `lib-test-decision-log-guard.sh`).
- `.claude/skills/dispatch-propagate/scripts/provision-node-worktree:127-145` — the
  `.scope-fingerprint` sidecar convention (path shape, "outside every checkout", lifecycle) the new
  `.snapshot-provenance` sidecar copies. `dispatch-invalid-state-route:516` documents that these
  sidecars are worktree-lifetime state.
- `.claude/skills/dispatch-propagate/scripts/dispatch-terminal-gap-audit:119-124` — a second existing
  bash-side `--ref` caller-fetches/primitive-reads-at-ref instance; confirms this is an established
  repo convention, not a new one.
- `packages/intentionsutil/src/schema.ts:430` — `StrategyStampValue = string | { hash; sha }`, the
  existing "value plus the sha it was computed against" precedent for `SnapshotProvenance`.
- `packages/intentionsutil/test/store-at-ref.test.ts` — the model for testing ref/sha validation.
- `packages/intentionsutil/test/check-node-selection.test.ts:14-44` — the `anode` / `seed` fixtures;
  reuse them for every new case.

## Verification

Run all of the following with `dangerouslyDisableSandbox: true`. `npx tsx` and `npx vitest` need the
npm cache, and the bash harnesses run `git`/`npx`; sandboxed they false-fail with `node:net:1919`
(verified this planning round: `test-assert-node-selection.sh` scores 3/10 sandboxed and 10/10
sandbox-off).

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-assert-node-selection.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-derive-node-target.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Not auto-runnable in a `verify` block, and required before the PR is considered done:

- **`test-dispatch-select-tick.sh`** (1741 lines, not wired into CI) — run it locally after Unit 4:
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh`. It is the only coverage
  of the sync ladder this plan modifies. If it is red *before* Unit 4's edits, record the pre-existing
  failures and compare, rather than assuming the unit caused them.
- **Purity re-assertion.** `grep -n "child_process\|execFile\|spawnSync\|execSync"
  packages/intentionsutil/scripts/check-node-selection.ts` must return nothing, and
  `grep -n "no process exit" …` must still find the doc comment. The whole design rests on this file
  never acquiring its own provenance.
- **Offline manual dispatch, by hand (the motivating scenario).** With the network disabled, run
  `dispatch <some-node-id>` and confirm it refuses with `refused <id> unknown-freshness` and writes no
  `office_hours` park; then run `dispatch --allow-stale <some-node-id>` and confirm the node launches
  and one `disposition:"allow-stale"` line lands in
  `$HOME/.local/share/commons-dispatch/routing-decisions.jsonl` carrying the node id and the snapshot
  object. Read it with `jq -c 'select(.disposition=="allow-stale")' <<<"$(tail -5 …)"` — never
  `echo "$JSON" | jq` (`.claude/rules/shell-json.md`).
- **The original defect, reproduced and closed.** In a scratch clone: park a node on `origin/main`,
  leave the primary checkout one commit behind (do **not** ff-merge), and invoke
  `provision-node-worktree <id> <phase>` directly. Before this change it passes the gate (the working
  tree does not show the park). After Unit 2 it must exit 12 (the park is visible in the
  self-materialized snapshot), and after Unit 5 a broken fetch on the same fixture must exit 15
  rather than 2.
- **Observe in production, first week.** Watch the decision log for `refused … unknown-freshness`
  lines. A steady trickle on the autonomous path would mean `MAX_SNAPSHOT_AGE_MS` (10 minutes) is
  tighter than real selection→provision latency; the fix is to widen the constant, never to weaken
  the refusal.
- **No new `office_hours` parks from provisioning.** Compare the count of nodes parked with reason
  text matching `provision-node-worktree failed for this tactic (exit 2)` before and after. The
  fetch-failure class should stop producing parks entirely once Unit 5 lands.

