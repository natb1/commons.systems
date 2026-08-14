---
id: tactic-demote-node-stale-local-read
kind: tactic
statement: Make graph-script repo-root resolution uniform and explicit — today
  demote-node-to-implement and dump-node.ts root from the script's own on-disk
  location, validate-graph.ts from a cwd-relative default, and graph-commit from
  -C/cwd, so a read or verify invoked from the wrong directory silently targets
  the wrong tree and can report a vacuous pass; additionally give
  demote-node-to-implement an origin/main refresh and a --base CAS, without
  which a scope-stale demotion invoked from a node worktree silently reverts
  body sections and markers that landed on origin/main after the worktree was
  provisioned
owner: ai
status: raw
parent: null
rationale: >-
  Surfaced 2026-07-26 during /qa-fix on tactic-mechanical-park-producers (PR
  #2970). A qa->review transition-node call demoted the node to implement on a
  false scope-drift reading (that false positive is a separate, already-tracked
  defect owned by tactic-scope-fingerprint-plan-substance), and the demotion
  primitive it delegated to then destroyed landed state: commit 41e90a51 dropped
  the entire `## needs-main residue` section and the `planned` marker from the
  node body, because demote-node-to-implement computed the new node from a
  worktree copy that predated both. Recovery cost a hand-rebuild via
  dump-node/write-node plus a --base graph-commit (d95f7f46). The defect is
  independent of what triggers the demotion: any correct demotion invoked from a
  node worktree that is even slightly behind origin/main clobbers the interval.
  Three concrete sites on origin/main, all in
  packages/intentionsutil/scripts/demote-node-to-implement: (1) line 36 sets
  REPO_ROOT from $SCRIPT_DIR/../../.. rather than the caller's cwd, so from a
  node worktree the root is the worktree, not the main checkout -- its own
  caller transition-node:51 gets this right via resolve_project_root, and
  graph-commit was fixed for exactly this class by
  tactic-graph-commit-cwd-repo-resolution; (2) line 46 therefore looks for the
  scope-fingerprint stamp under the wrong root, so the provenance range a
  demotion reports is computed against a stamp that is usually absent; (3) lines
  126-127 call readNode("./intentions", ...) with no prior fetch (the script's
  own comment at line 69 notes it has no fetch step, unlike park-node) and line
  115 lands via graph-commit with no --base token, so the read is stale and the
  write is a lost update rather than a detected conflict. Ownership is currently
  a gap, not an oversight: tactic-transition-node-stamp-landed-body explicitly
  scopes demote-node-to-implement out ("it only reads the stamp; it writes none"
  -- true of the stamp, but it does not address the stale body read), and
  tactic-graph-write-recipes-base-cas:165 names demote-node-to-implement:77 as
  the same class and "strongly recommended as the immediate follow-up" while
  declaring it outside its own forward-field-write scope. Author-directed
  2026-07-26: filed as a new tracked bug tactic and boosted to the top of the
  selectable queue.


  Widened 2026-08-05 by the bootstrap monitor pass, under Ruling 27
  (root-resolution defects widen this node rather than minting siblings), to add
  the TEST-HARNESS case of the same root-resolution class. Contract to add: a
  library-invoked executable with durable side effects must resolve its root
  from a FIXTURE-CONTROLLABLE root, never from its own ${BASH_SOURCE[0]}. When
  it roots from its own location, a test that merely SOURCES the library reaches
  the real production executable and mutates production state -- the fixture has
  no way to redirect it, because the path is baked in at the callee rather than
  passed by the caller. Measured instance: one suite run reached the real router
  and drove a fleet-latch counter to 156 observations before the run's node mint
  incidentally failed and stopped it; had the mint succeeded the counter would
  have kept climbing against production. This is the same failure shape as the
  cwd-vs-script-location confusion already in scope here, but with a strictly
  worse blast radius -- the other variants report against the wrong tree,
  whereas this one WRITES to it. The one known site is already fixed in PR #3048
  (tactic-invalid-state-lane, merged 2026-08-05); what remains in scope for this
  node is the AUDIT of every other library-invoked executable with durable
  effects for the same shape, plus the contract statement itself so the pattern
  is refused at review rather than rediscovered.
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Should this node stay scoped to demote-node-to-implement, or widen to
      own root-resolution consistency across all the graph scripts?
    answer: "(Recorded 2026-08-04, author-directed.) Widen. The hazard is not any
      single script but that scripts used together in one graph-write recipe
      resolve their target tree three different ways: dump-node.ts and
      demote-node-to-implement from the script's own on-disk location,
      validate-graph.ts from a cwd-relative default argument (`process.argv[2]
      ?? \"intentions\"`), and graph-commit from -C/cwd via `git rev-parse
      --show-toplevel` (explicitly never from script location, per
      tactic-graph-commit-cwd-repo-resolution). Passing the same absolute script
      path to all three therefore silently targets different trees. Concrete new
      instance found 2026-08-04 during bootstrap step 1a: validate-graph.ts
      invoked by absolute worktree path while cwd was the main checkout
      validated the MAIN checkout's intentions/, not the edited worktree, and
      printed 'ok — 500 nodes' at exit 0 — a vacuous pass indistinguishable from
      a real one, and exactly the sensor failure mode the standing instruments
      rule warns about (ask what a check prints when it cannot see). This node
      now owns making root resolution uniform and explicit across the graph
      scripts. Fixing them one site at a time is what let the class recur after
      tactic-graph-commit-cwd-repo-resolution and
      tactic-clear-park-repo-targeting-guard already closed the write-path half;
      the read/verify path was never swept."
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 50
  rationale: "Bootstrap re-scale 2026-07-30: the SOLE attention anchor for the
    fingerprint-custody chain. The 2026-07-30 re-serialization (d2b161a3) turned
    the cluster from a tree into a linear chain -
    tactic-demote-node-stale-local-read ->
    tactic-phase-evidence-fingerprint-bound ->
    tactic-scope-fingerprint-plan-substance ->
    tactic-transition-node-stamp-landed-body - so a single anchor on this, the
    most-downstream node, lifts every blocker upstream of it and the whole chain
    resolves to a flat 55.33. Attention flows backward along blocked_by and SUMS
    over distinct sources, so a second anchor anywhere in the chain
    double-counts: the interim 50 briefly also sat on
    tactic-scope-fingerprint-plan-substance and that node resolved to 105.33 -
    back above strategy-main-health 101, the exact failure this re-scale exists
    to remove. That second anchor was removed; do not reintroduce one while the
    chain is linear. Note validate-graph rule 18 does NOT catch this - it checks
    the authored boost (50), not the resolved rank. Interim scaffolding only;
    tactic-attention-tier-ranking and tactic-attention-boost-scripts retire this
    numeric scheme."
phase: null
execution: null
validates: []
blocked_by:
  - tactic-phase-evidence-fingerprint-bound
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# demote-node-to-implement writes from a stale local read and lands without a CAS, so a demotion silently discards content that landed on origin/main

## Context

`packages/intentionsutil/scripts/demote-node-to-implement` is the backward
half of the node-lane phase ladder. `transition-node` delegates to it whenever
`isScopeStale` fires: the node's `phase` is reset to `implement` and
`execution.markers` is wiped, then the result is landed on `main` via
`graph-commit`.

Every other primitive that writes a node to `main` has, by now, been taught to
read from `origin/main` rather than from whatever the invoking worktree happens
to hold — `park-node` fetches before it reads; `resolve-park` and `clear-park`
take a `--base` compare-and-swap token; `graph-commit` itself was fixed for the
wrong-repo case by `tactic-graph-commit-cwd-repo-resolution`; and
`tactic-graph-write-recipes-base-cas` is currently pushing `--base` through the
remaining forward-write recipes. `demote-node-to-implement` was left out of all
of them, and it is the one primitive whose whole job is to overwrite fields.

## The defect

Three sites, all in `demote-node-to-implement` as of `origin/main`:

1. **Wrong repo root** (`:36`). `REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"`
   derives the root from the script's own on-disk location. Invoked from a node
   worktree — the normal case, since `transition-node` runs inside the worker's
   worktree — that resolves to the *worktree*, not the main checkout. Its own
   caller gets this right: `transition-node:51` uses `resolve_project_root`.

2. **Stamp read at the wrong path** (`:46`).
   `STAMP_FILE="$REPO_ROOT/.claude/worktrees/$NODE_ID.scope-fingerprint"`
   inherits the wrong root, so the stamp is looked for under the worktree. It is
   normally absent there, which silently empties the
   `$STAMPED_SHA..origin/main` provenance range the demotion reports (`:52-56`).
   The demotion still proceeds — it just explains itself with nothing.

3. **Stale read, un-guarded write** (`:115`, `:126-127`). The new node is
   computed from `readNode("./intentions", …)` — the *local* file. The script's
   own comment at `:69` notes it, apparently as a deliberate simplification:
   "Unlike park-node, this script has no prior fetch step — best-effort capture
   against whatever origin/main ref is already known locally is fine." It is not
   fine: the local file is the read source, not just the rollback source. And
   `:115` lands via `graph-commit -C "$REPO_ROOT" -m "$MSG" "$NODE_ID"` with **no
   `--base` token**, so the write is a lost update rather than a detected
   conflict.

Together: anything that landed on `origin/main` between the worktree's
provisioning and the demotion is silently reverted. Exit 0, no conflict, no
park.

## Observed instance

2026-07-26, during `/qa-fix` on `tactic-mechanical-park-producers` (PR #2970).
The qa→review `transition-node` call read scope drift and delegated here.
Commit `41e90a51` ("graph: demote tactic-mechanical-park-producers to
implement (scope drift)") dropped:

- the entire `## needs-main residue` section, appended and landed minutes
  earlier by the same QA pass (`bc90fa7c`), and
- the `planned` marker, alongside the expected `qa-done` wipe.

Neither loss was reported. Recovery was a hand-rebuild — `dump-node.ts` → edit
→ `write-node.ts` → re-append the residue section → `validate-graph` →
`graph-commit --base` — landed as `d95f7f46`.

**The trigger and the defect are separate bugs.** That particular demotion was
itself a false positive, owned by
`tactic-scope-fingerprint-plan-substance` (the qa phase's own machinery append
trips the scope-custody gate). Fixing that removes *one* caller of this path. It
does not fix this one: a *correct* demotion from a worktree that is behind
`origin/main` clobbers the interval just the same.

## Ownership gap

Two nodes name this code and both explicitly decline it:

- `tactic-transition-node-stamp-landed-body` lists
  `demote-node-to-implement:46` under "explicitly out of scope", reasoning "it
  only *reads* the stamp; it writes none". True of the stamp — but that tactic
  is about the stamp producer, and says nothing about the stale *body* read.
- `tactic-graph-write-recipes-base-cas:165` names
  `demote-node-to-implement:77` as "same class; strongly recommended as the
  immediate follow-up since it is reached from the very script this tactic
  fixes, but it is a distinct backward-transition primitive outside this
  tactic's explicit forward-field-write scope."

This node is that follow-up.

## Greenfield shape

The demotion is a read-modify-write against `main`, so it should use the same
custody mechanics every sibling primitive now uses, with no special case for
being a *backward* transition:

1. Resolve the repo root from the **caller's cwd**, not the script's location —
   the shape `tactic-graph-commit-cwd-repo-resolution` established for
   `graph-commit`, and which `transition-node` already implements via
   `resolve_project_root`. This also puts the stamp lookup back on the main
   checkout, so the provenance range becomes real.
2. **Fetch, then read the node from `origin/main`**, not from the local
   worktree — `park-node`'s fresh-main read.
3. Capture the `origin/main` blob at read time and land with
   `graph-commit --base <id>=<blob>`, so a concurrent write is a *detected*
   conflict instead of a silent revert — the diagnosis-time CAS contract in
   `.claude/skills/ref-diagnosis-time-cas/SKILL.md`.

With (2) and (3) in place the existing `FRESH_BLOB` rollback trap (`:64-72`,
`:82-91`) keeps working unchanged; it becomes the failure path for a rejected
CAS rather than the only safety net.

No brownfield migration path is needed: one script, no callers to change
(`transition-node` invokes it positionally and reads only its exit code).

## Out of scope

- `tacticScopeFingerprint` / `isScopeStale` / the false-positive demotion
  trigger — owned by `tactic-scope-fingerprint-plan-substance`.
- `transition-node`'s `refresh_stamp` producer bug — owned by
  `tactic-transition-node-stamp-landed-body`.
- Whether a demotion should clear or refresh the stamp. It currently does
  neither; `tactic-transition-node-stamp-landed-body` already parks that
  question, and it stays parked.
- Test coverage for `transition-node`'s `main-qa` scope-stale guard and
  `MAIN_ROOT` resolution — owned by
  `tactic-transition-node-scope-stale-test-coverage`. Shell-level coverage for
  *this* script's fresh-read and CAS behaviour is in scope here and should
  follow `test-park-node.sh`'s harness.
