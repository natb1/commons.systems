---
id: tactic-fingerprint-recipe-single-callsite
kind: tactic
statement: Route every strategy_fingerprint producer through the canonical
  strategyFingerprint export — retire prose-recipe hand-computation in
  /align-tactics and orchestrator prompts
owner: ai
status: codified
parent: null
rationale: "Finding from the 2026-07-06/07 emulated router ticks
  (graph-tick-emulation-workflow-gotchas). Three independent writers
  hand-computed the prose recipe and produced three different hashes for the
  same substance; the tick orchestrator's own comparator was wrong twice
  (dropped attributes.conditions, unsorted serves) and overwrote correct stamps
  at ba3ac84c, corrected at 0c793d1f. The canonical implementation is
  strategyFingerprint (packages/intentionsutil/src/router.ts, PR #2785, now
  merged). This tactic gives shell/bootstrap callers a single runnable callsite
  so no producer re-derives the recipe inline."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 3
  override: null
  rationale: "Author-directed 2026-07-08 (refined): tactics that directly edit
    .claude/skills/align-strategy/SKILL.md or
    .claude/skills/align-tactics/SKILL.md content rank above the rest of
    strategy-graph-native-dispatch's subtree (boost 3, added on top of the
    strategy's own boost 5, authored 8) — above curriculum-execution tooling
    (boost 7) and above every other tactic in this strategy's subtree (inherited
    5, unboosted)."
phase: review
execution:
  branch: tactic-fingerprint-recipe-single-callsite
  pr: 2885
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Route every strategy_fingerprint producer through the canonical strategyFingerprint export

## Context

The soft-freeze machinery compares each open tactic's stamped
`execution.strategy_fingerprint` against the current substance of every serving
strategy. The canonical computation is the exported helper
`strategyFingerprint(strategy)`
(`packages/intentionsutil/src/router.ts:83`), which hashes
`{statement, clarifications, conditions (= attributes.conditions ?? null),
serves (sorted), success_signal, tooling_goals}` as sha256 hex.

The problem this tactic fixes is that **fingerprint *producers* have no runnable
single callsite**. The reader/gate side already imports the helper
(`check-node-selection.ts:194-206`, out of scope — see the driving finding).
But the writer side — the sessions that *stamp* a fingerprint into a node — has
only a prose recipe and an abstract "invoke `strategyFingerprint(strategy)`"
instruction to work from:

- `.claude/skills/align-tactics/SKILL.md` "Fingerprint honesty" (~line 461) and
  re-evaluation-mode step 3 (~line 505) both say to stamp
  `strategyFingerprint(strategy)` but give **no** runnable invocation, so a
  bootstrap-interim session (there is no live router yet; stamps are made "by
  hand at completion", SKILL.md ~lines 474, 514) must hand-write inline `tsx`
  that re-loads the graph and re-imports the helper.
- Historically, sessions instead hand-computed the *prose* recipe. In the
  2026-07-06 emulated tick this produced three different hashes for the same
  substance and two wrong comparator stamps (dropped `attributes.conditions`,
  unsorted `serves`), restored to canonical values only at `0c793d1f`.

Intended outcome: a single intentionsutil CLI —
`strategy-fingerprint.ts <strategy-id>` — that loads the strategy node and
prints `strategyFingerprint(strategy)`, plus SKILL.md text that tells producers
to run that command. No producer re-derives the recipe (prose *or* inline tsx)
ever again.

Scope note: there are **no** committed orchestrator/worker-prompt files that
compute a strategy fingerprint — the "tick orchestrator" of the finding was
emulated (transcript-only) sessions, not a repo file. The only live writer
surface is align-tactics/SKILL.md. The prose-recipe copies inside other
`intentions/tactic-*.md` bodies (`tactic-main-qa-triage-before-provision.md`,
`tactic-outcome-envelope-qa-accounting.md`, `tactic-token-economy-sensor.md`,
`tactic-token-hygiene-sweep.md`, `tactic-noncodegen-session-model-defaults.md`,
`tactic-token-audit-node-attribution.md`) are historical plan text and are
**out of scope** — do not edit them.

## Units of work

### Unit 1 — Add the `strategy-fingerprint.ts` CLI (the single callsite)

- **Scope.** New file
  `packages/intentionsutil/scripts/strategy-fingerprint.ts`. It:
  - Takes a positional `<strategy-id>` argument and an optional `--dir <path>`
    flag (default: the `intentions/` dir resolved from `import.meta.url`, not
    cwd — mirror `dump-node.ts:33-35` / `compute-freshness.ts`).
  - Loads the node via `readNode(dir, id)` (`packages/intentionsutil/src/store.ts:99`).
  - **Guards** that the node exists and `kind === "strategy"`; on a missing node
    or a non-strategy id, write a clear error to `stderr` and
    `process.exit(1)` (per `.claude/rules/code-style.md` — a clear error at the
    edge, not a silent fallback).
  - Prints `strategyFingerprint(strategy)` followed by a newline to `stdout`
    via `process.stdout.write`.
  - Exports a pure core function `strategyFingerprintFor(dir: string, id:
    string): string` and guards the `main`/argv side behind the
    `import.meta.url === pathToFileURL(process.argv[1]).href` idiom
    (`compute-freshness.ts:114-116`) so the test can import the core without
    running the CLI.
  - No shebang (run via `npx tsx …`, matching every sibling script).
  - Imports: `import { readNode } from "../src/store.js";` and
    `import { strategyFingerprint } from "../src/router.js";` (note the `.js`
    extensions the ESM/tsx setup requires).
- **Out of scope.** The reader/gate side (`check-node-selection.ts`),
  tactic-scope fingerprints (`tacticScopeFingerprint`), and any change to
  `strategyFingerprint` itself — reuse it verbatim.
- **Recommended model.** `sonnet` (well-specified, mirrors an existing script
  shape).

### Unit 2 — Test the CLI core

- **Scope.** New file
  `packages/intentionsutil/test/strategy-fingerprint.test.ts`, modelled on
  `packages/intentionsutil/test/check-node-selection.test.ts:1-55`:
  - `mkdtempSync` a temp store, seed a strategy node with `writeNode(dir,
    node)` using an `anode(partial)` full-`IntentionNode` fixture builder (copy
    the builder from `check-node-selection.test.ts` / `router.test.ts`).
  - Assert the exported `strategyFingerprintFor(dir, id)` returns a 64-hex
    string (`/^[0-9a-f]{64}$/`) **and** equals `strategyFingerprint(strategy)`
    imported from `../src/router.js` for the same seeded node (locks the CLI to
    the canonical helper).
  - Assert a state-only edit that `strategyFingerprint` ignores (e.g. setting
    `reading` or `office_hours`) does **not** change the output, and a
    substance edit (e.g. `statement`) **does** — guards the "single callsite"
    contract against a future drift in what the CLI hashes.
  - Assert a non-strategy id and a missing id each throw / exit non-zero (import
    the core and expect it to throw, matching the CLI guard).
- **Out of scope.** No new fixtures beyond the seeded strategy; do not test
  `strategyFingerprint` internals (already covered in `router.test.ts`).
- **Dependencies.** Unit 1 (imports its exported core).
- **Recommended model.** `sonnet` (unit-test writing with explicit cases).

### Unit 3 — Point the align-tactics producers at the CLI

- **Scope.** Edit `.claude/skills/align-tactics/SKILL.md` at its two
  fingerprint-producing callsites:
  - **"Fingerprint honesty"** (~lines 461-476): where it currently says the
    stamp is `strategyFingerprint(strategy)` "always that helper, never a
    hand-computed hash", add the runnable invocation — stamp the value produced
    by `npx tsx packages/intentionsutil/scripts/strategy-fingerprint.ts
    <strategy-id>` (run against fresh `origin/main` at stamp time). Keep the
    per-strategy-map semantics and the bootstrap-interim "by hand at
    completion" framing intact — only replace the *how you compute it* from
    "the helper, abstractly" to "run this command".
  - **Re-evaluation mode step 3** (~lines 505-514): where it sets
    `map[<re-evaluated-strategy-id>] = strategyFingerprint(strategy)`, likewise
    reference the CLI command as the way to obtain that value.
  - Preserve the surrounding meaning exactly (per-strategy map, "never emit the
    bare-string legacy form", inline-in-same-session bootstrap note); this is a
    *how-to-compute* substitution, not a semantics change.
- **Out of scope.** `.claude/skills/align-strategy/SKILL.md` (does not stamp),
  the historical tactic-body recipe copies (listed in Context), and any
  dispatch/orchestrator script (none compute the fingerprint).
- **Dependencies.** Unit 1 (the command must exist before the skill cites it).
- **Recommended model.** `sonnet` (bounded prose edit with exact anchors;
  preserve semantics).

## Reuse

- `strategyFingerprint(strategy)` — `packages/intentionsutil/src/router.ts:83`
  (the canonical hash; the CLI must call it, never re-derive it).
- `readNode(dir, id)` — `packages/intentionsutil/src/store.ts:99` (frontmatter
  load; body dropped, which is fine — fingerprint uses only frontmatter).
- CLI shape: repo-root-from-`import.meta.url` and the exported-core +
  `import.meta.url` guard — `packages/intentionsutil/scripts/compute-freshness.ts`
  (esp. lines 33-35, 114-116) and `dump-node.ts:33-35`.
- Closest consumer reference: `check-node-selection.ts:44-50,194-206` (imports
  and calls the helper).
- Test harness: `anode(partial)` fixture builder + `writeNode` seeding +
  64-hex assertion — `packages/intentionsutil/test/check-node-selection.test.ts:1-55`.

## Verification

Auto-runnable — the new test plus the existing intentionsutil suite (the
CI-equivalent form roots at the repo root and selects the project, so
root-hoisted asset imports resolve):

```verify
npx vitest run --project packages/intentionsutil --root .
```

Manual / observe:

- From the worktree root, run the CLI against a real strategy and confirm it
  prints a 64-hex line and exits 0:
  `npx tsx packages/intentionsutil/scripts/strategy-fingerprint.ts strategy-graph-native-dispatch`
- Confirm the printed value equals what `check-node-selection.ts` computes for
  the same strategy (run `check-node-selection.ts` against a tactic serving it
  and compare) — proves the writer and reader sides now agree by construction.
- Run it against a non-strategy id (e.g. this tactic's own id) and confirm a
  clear stderr error and non-zero exit, not a silent hash.
- Read the two edited align-tactics/SKILL.md callsites and confirm a
  clean-session producer could stamp a fingerprint from the skill text alone
  (the runnable command is present; no prose recipe or inline tsx remains).
