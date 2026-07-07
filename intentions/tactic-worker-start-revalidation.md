---
id: tactic-worker-start-revalidation
kind: tactic
statement: "Worker-start re-validation gate: provision-node-worktree re-checks
  node state against fresh origin/main before a phase worker executes"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "Finalized 2026-07-06 /align-tactics round from the same day's
  /align-strategy concurrency interview: the selection-to-execution staleness
  window has a write-side gate (transitions Unit 1) but no execute-side gate.
  Off the minimum signal path (no validates edge) - calculated attention demotes
  it by derivation; recorded fully per clarifications 9/11, never deferred by
  omission. Gated on tactic-graph-router-selector because its two touch-points
  (provision-node-worktree, dispatch-graph-tick.js) are that tactic's unit 3/4
  deliverables in PR 2785."
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
  branch: tactic-worker-start-revalidation
  pr: 2792
  attempts: {}
  markers: []
  strategy_fingerprint: null
validates: []
blocked_by:
  - tactic-graph-router-selector
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Worker-start re-validation gate: provision-node-worktree re-checks node state against fresh origin/main before a phase worker executes

## Context

From the 2026-07-06 `/align-strategy` concurrency interview
(`strategy-graph-native-dispatch` clarifications: two-gate staleness
bracket, global worker cap; spec home
`intentions/tactic-graph-native-dispatch.md` §3.2 "Worker-start
re-validation"). Selection freezes a node's directive at tick start; its
worker may start minutes later (runner spawn latency, daemon queue).
Nothing re-checks between selection and execution today: an author park
landing mid-tick still gets its worker; a strategy substance edit is
supposed to make a selected-but-unstarted worker yield (soft-freeze
precision), but nothing enforces it; an out-of-band phase advance leaves
the worker executing a stale phase. The transition-time fingerprint gate
(`tactic-graph-router-transitions` Unit 1) closes only the write side.
This tactic adds the execute-side gate in the provisioning prelude — and
the **stamp side** of the tactic-scope fingerprint (strategy
scope-fingerprint and chain-of-custody clarifications, 2026-07-06): the
gate records the scope hash its fresh read saw and, before overwriting,
compares the previous phase's stamp against the current scope — so a
scope edit landing anywhere between implement's read and the merge arm
demotes the tactic to `implement`, and a merge requires an unbroken
implement → qa → review chain all executed against the merge-time scope.
The verify/demote side is `tactic-graph-router-transitions` Unit 1.

Thin-script condition (strategy condition 5): the gate logic lives in an
owned, offline-testable tsx script; the bash prelude invokes it as one
command and maps its exit code.

Anchors below are as of `tactic-graph-router-selector` PR #2785 branch
head (`ca4e0257`) — its unit 3/4 deliverables are this tactic's two
touch-points, which is why this tactic is `blocked_by` it. Re-anchor at
implement time if the merge shifted lines.

## Unit 1 — `check-node-selection.ts`: the gate logic

**Scope:** new `packages/intentionsutil/scripts/check-node-selection.ts`,
usage `check-node-selection.ts <node-id> <selected-phase> --dir
<intentions-dir>` where `--dir` points at a checkout the caller
guarantees is at fresh `origin/main` (provision-node-worktree fetches
before calling — Unit 2). Checks, in order, each failing with one
`stale-selection: <check>: <detail>` line on stderr and exit **12**
(0 = pass, silent):

1. **exists** — `intentions/<node-id>.md` present in the store (a pruned
   node is a completed/removed selection).
2. **phase** — persisted phase equals `<selected-phase>`. Read
   first-class `phase`, falling back to `attributes.phase` (squatter
   convention until `tactic-schema-migration-backfill` lands). The
   directive is never re-derived.
3. **not parked** — `office_hours` null (same two-convention read).
4. **fingerprint** — only when the node's
   `execution.strategy_fingerprint` (either convention) is non-null:
   recompute each serving strategy's substance hash with
   `strategyFingerprint` (`packages/intentionsutil/src/router.ts:82`) over
   the serving set from `servingStrategyIds`
   (`packages/intentionsutil/src/router.ts:112` — export it if still
   module-private) and fail on any mismatch, mirroring the selector's
   soft-freeze staleness rule (`router.ts:220-232`). A null stamp skips
   this check (stamping has not started; null is never stale).

On pass, the script prints the tactic's **scope fingerprint** to stdout —
`tacticScopeFingerprint(node)`, a new export beside `strategyFingerprint`
in `packages/intentionsutil/src/router.ts`: sha256 over the node's
`statement` plus its markdown body, never frontmatter state fields (so
attempts/markers/park writes cannot change it; residue sections ARE body
and do change it — the transition writer's stamp refresh is what keeps
machinery appends from tripping the chain, see
`tactic-graph-router-transitions` Unit 1). This is the phase-start stamp
the transition-time scope gate verifies (strategy scope-fingerprint and
chain-of-custody clarifications, 2026-07-06).

5. **scope chain** (chain-of-custody clarification, 2026-07-06) — when
   `--stamp <path>` is given and `<selected-phase>` is `fix`, `qa`, or
   `review` (never `implement`, which always takes the latest scope and
   re-establishes custody; never `main-qa`, post-merge by definition):
   read the existing stamp file — one line, `<fingerprint> <origin-main-sha>`
   — and compare its fingerprint field against the freshly computed
   `tacticScopeFingerprint`. Mismatch → one
   `scope-stale: <stamped-sha>..<current-sha>` line on stderr and exit
   **13**: the scope changed after the previous phase ran, so the node
   must demote to `implement` (the demotion write is
   `tactic-graph-router-transitions` Unit 1's `demote-node-to-implement`;
   this script only detects). A missing stamp file fails open with a
   logged warning during bootstrap (legacy launch, hand-run phase,
   recreated worktree) and flips to exit 13 once
   `tactic-graph-router-transitions` Unit 1 lands — from then on the
   stamp is refreshed at every transition write, so absence means broken
   custody.

Out of scope: no graph writes, no git commands, no gh — pure read + exit
code + fingerprint on stdout. **Tests:** new
`packages/intentionsutil/test/check-node-selection.test.ts`
(fixture store dirs, per the existing `router.test.ts` pattern): pass
(and stdout is the scope fingerprint); pruned; phase mismatch
first-class; phase mismatch squatter; parked first-class; parked
squatter; stale fingerprint; null fingerprint passes despite strategy
edit; scope fingerprint stable across state-field edits and changed by a
body edit; scope chain — stamp match passes at qa/review, stamp mismatch
exits 13 with the SHA range on stderr, `implement` skips the comparison,
missing stamp warns and passes (bootstrap policy).

**Recommended model:** sonnet

## Unit 2 — plumb the gate through the launch chain

**Scope:**

- `.claude/skills/dispatch-propagate/scripts/provision-node-worktree`:
  usage gains `<selected-phase>` as `$2` (arg check near line 40, usage
  comment lines 14-23); after its `git fetch origin main` on the main
  checkout and before any worktree/branch work, run
  `npx tsx packages/intentionsutil/scripts/check-node-selection.ts
  "$NODE_ID" "$SELECTED_PHASE" --dir "$PROJECT_ROOT/intentions"
  --stamp "$PROJECT_ROOT/.claude/worktrees/$NODE_ID.scope-fingerprint"`
  (PROJECT_ROOT resolution already at lines 50-61); on exit 12 or 13,
  forward the stderr line and exit with the same code (10=ci-waiting and
  11=merge-conflict are taken; 2 stays usage/config). On exit 0, save
  `<stdout-fingerprint> <origin-main-sha>` (the SHA from
  `git rev-parse origin/main` after the prelude's fetch) to that same
  `.scope-fingerprint` path — adjacent to the worktree, outside every
  checkout, so it never dirties a tree; overwritten on each provision and
  refreshed by every transition write
  (`tactic-graph-router-transitions` Unit 1), removed with the worktree.
  The SHA is the routing-back provenance anchor: on a later demotion,
  `git log <stamped-sha>..origin/main -- intentions/<node-id>.md` is
  exactly the set of scope edits being absorbed.
- `.claude/workflows/dispatch-graph-tick.js`: `nodePrompt` (line ~88)
  passes `${sel.phase}` as the provision command's second argument; the
  exit-code routing list gains `12 (stale-selection): report disposition
  \`skipped\` and stop — the claim clears and the next tick re-selects
  from current state` and `13 (scope-stale): run
  \`demote-node-to-implement <node-id>\`
  (`tactic-graph-router-transitions` Unit 1's owned primitive — until it
  lands, the bootstrap-transition doctrine covers the demotion write),
  then report disposition \`scope-stale\` and stop — the next tick
  re-selects the node at \`implement\` against the updated scope`;
  `RESULT_SCHEMA.disposition` enum (line ~64) gains `'skipped'` and
  `'scope-stale'`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute`:
  no arg change needed — `selections[]` already carries `phase`; confirm
  the runner prompt's embedded provision command (built from
  dispatch-graph-tick.js) renders both args.
- **Tests:** extend the provision section of
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`:
  exit-12 cases (phase mismatch, parked, pruned — fixture intentions dir),
  exit-13 case (stamp fingerprint mismatch at a qa selection), exit-0
  pass-through writing `<fingerprint> <sha>` to the stamp path, and 10/11
  behavior unchanged.

**Dependencies:** Unit 1.

**Recommended model:** sonnet

## Reuse

- `strategyFingerprint`, `servingStrategyIds`, soft-freeze staleness rule —
  `packages/intentionsutil/src/router.ts`
- `readNode` / `listNodes` — `packages/intentionsutil/src/store.ts`
- Exit-code routing pattern and RESULT_SCHEMA —
  `.claude/workflows/dispatch-graph-tick.js`
- PROJECT_ROOT resolution and fetch prelude —
  `.claude/skills/dispatch-propagate/scripts/provision-node-worktree`

## Verification

```verify
npx vitest run --root packages/intentionsutil
npx tsc -p packages/intentionsutil/tsconfig.json --noEmit
```

`test-dispatch-scripts.sh` runs in CI (hook-tests) — authoritative there;
it exceeds local sandbox timeouts. Manual, post-merge: select an eligible
node, park it before its worker starts (or hand-run
`provision-node-worktree <id> <wrong-phase>`), and confirm exit 12, a
`skipped` worker disposition, and the next tick re-selecting from current
state.
