---
id: tactic-read-sensors-arg-rejection-check-mode
kind: tactic
statement: Make read-sensors.ts reject unrecognized arguments and gain a
  no-write check mode -- main() parses only --report and silently drops every
  other argument, then runs an unconditional write pass against the intentions/
  of whichever checkout the script file lives in
owner: ai
status: codified
parent: null
rationale: "Filed 2026-08-13 from a defect measured three times across separate
  sessions, each time misdiagnosed as sensor behaviour rather than argument
  handling. The reading driver presents as a read-only check and is not one: a
  bare run refreshed three strategy files at once, and an operator who reached
  for containment via `--dir <scratch>` got no containment at all, because the
  flag does not exist and is discarded without a word. That silent discard is
  what makes the defect expensive -- the run appears to have been scoped, so its
  writes are attributed to something else. It also violates the repo's recorded
  code-style rule (clear errors over silent fallbacks). Serving
  strategy-graph-drives-dispatch by the tactic-first-sensor-pass precedent: that
  tactic built this driver, and this strategy's signal is readings populated by
  the loop rather than by hand -- a driver nobody can run safely outside a
  throwaway worktree is a driver that gets run by hand instead."
reading: null
serves:
  - strategy-graph-drives-dispatch
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
attributes:
  bug_fix: true
---
# Make read-sensors.ts reject unrecognized arguments and gain a no-write check mode -- main() parses only --report and silently drops every other argument, then runs an unconditional write pass against the intentions/ of whichever checkout the script file lives in

## Context

`packages/intentionsutil/scripts/read-sensors.ts` is the reading driver for the
feedback arm: for every node naming a `success_signal.sensor` it resolves the
sensor, computes a fresh `reading`, and persists it. It is invoked by hand
during graph rounds and as `npm run read-sensors --prefix packages/intentionsutil`
(`packages/intentionsutil/package.json:18`).

Filed 2026-08-13 from a defect measured three times across separate sessions,
each time misdiagnosed as sensor behaviour rather than argument handling. Every
anchor below was re-measured on `origin/main` `c281e300` (the file is 1765
lines; anchors from the original 2026-08-13 filing against `8f1dff05` were
~150 lines stale and have been recomputed here). **Prefer locating by symbol
over these line numbers** — the file is actively edited.

Three facts about the file today, and together they make it unsafe to run:

1. **It parses exactly one argument.** `main()` (`read-sensors.ts:1735-1761`)
   tests `process.argv.includes("--report")` at `:1738` and nothing else. Every
   other token in `argv` is discarded in silence — no error, no warning, no echo
   of what was understood.
2. **Its store path is fixed at module scope.** `scriptDir`/`repoRoot`/
   `intentionsDir` are derived from `import.meta.url` at `:66-68`. `main()`
   passes that constant to `readStoreSensors` unconditionally at `:1744`, and
   `--report` uses it a second time at `:1739`.
3. **The write pass is unconditional.** `readStoreSensors`'s second loop calls
   `writeNode(dir, updated)` for every node whose reading was computed
   (`:1724-1728`, the call itself at `:1726`). There is no `--dry-run`,
   `--check`, or `--no-write`.

The consequence is a false affordance, not a missing feature. An operator who
wants to check whether a sensor produces a reading without touching the store
reaches for `read-sensors.ts --dir /tmp/scratch`. That command runs, prints a
plausible summary, exits 0, and **writes into the `intentions/` of whichever
checkout the script file lives in**. The invocation looks scoped, so its writes
get attributed to whatever else the session was doing. This has been
misdiagnosed at least three times: first as "some sensors resolve their store
from the script location", later as a `--dir` containment leak. Neither is
true — the flag was never read. It is also a direct violation of
`.claude/rules/code-style.md` ("prefer clear errors over defensive fallbacks"):
an unrecognized argument is a misconfigured invocation, and swallowing it
produces silent incorrect behavior.

Intended outcome: the driver refuses any argument it does not understand, and
offers a real read-only mode so the containment people reached for actually
exists.

### Greenfield design, and why this tactic deliberately stops short of it

The ideal shape for this script, built from scratch, is the
required-explicit-tree contract every other graph reader/writer now satisfies
(`strategy-graph-native-dispatch` clarification 194, ADOPTED 2026-08-05):
`buildDefaultRegistry(intentionsDir, repoRoot)` fully parameterized, a
**required** `--dir`, no module-level store constant, and the whole driver
testable against a fixture store. That is the design to aim at.

It is out of scope here, for a reason that is itself a defect of the same
family this tactic closes. `readStoreSensors(dir, registry)` already takes a
directory (`:1687`), so wiring `--dir` to it *looks* like a two-line change.
But `buildDefaultRegistry()` takes **no parameters** (`:1604`) and **four**
registered sensors close over the module-level constants instead — one more
than the original filing counted:

- `rsiSensor` (`:1590-1598`) — reads `repoRoot` for the usage-audit path
  (`:1594`) and calls `readRsiReading(repoRoot, intentionsDir, ...)` (`:1596`).
- `makeDelegationRecordsSensor(() => listNodes(intentionsDir))` (`:1613`).
- `makeLadderTerminusSensor(() => listNodes(intentionsDir))` (`:1614`) — the
  fourth closure, added after this node was filed.
- `makeIntentionStoreSensor(..., () => listNodes(intentionsDir))` (`:1620-1625`).

A `--dir` threaded only through `readStoreSensors` yields a run that **reads one
store and writes another** — strictly worse than today's honest single-store
behavior, and a silent-wrong-result defect of exactly the kind this tactic
exists to close. Honoring `--dir` properly means parameterizing
`buildDefaultRegistry` and all four closures; that is a separate tactic with its
own review, and it raises the model to opus.

The brownfield path is therefore: **this tactic** makes the driver honest about
what it was asked to do and adds the no-write mode that removes the need that
drove people to `--dir` in the first place; **a follow-on tactic** (not filed by
this plan) extends clarification 194's contract to this script. Note explicitly
that read-sensors.ts is *not* in clarification 242's scope (which lists
`validate-graph.ts` / `write-node.ts` / `dump-node.ts` / `clear-park`) — that is
the recorded reason its store may stay script-relative today, and it is also the
premise a future reviewer should re-weigh.

### Concurrent editor

`tactic-realignment-coverage-sensor` (phase implement, serving a different
strategy) is registering a new sensor in this same file, in the
`buildDefaultRegistry` region (`:1604-1626`). This plan's edits are in
`ReadSummary` (`:1664-1668`), `readStoreSensors` (`:1687-1731`), `main()`
(`:1735-1761`), and the header comment (`:19-20`) — no overlap with the registry
body, but merge `origin/main` before opening the PR and re-check the anchors.
No sibling under this strategy touches `main()` or argument handling;
`tactic-dispatch-pause-config-field` cites `readPauseState` explicitly as "no
code change", and `tactic-attention-surface-velocity-pace` edits
`office-hours-snapshot/src/produce.ts`.

---

### Unit 1 — Reject unrecognized arguments in `main()`

**Scope.** `packages/intentionsutil/scripts/read-sensors.ts` only, plus one new
test file.

- Add a `USAGE` string constant next to the `// --- Main ---` divider (just
  above `main()` at `:1735`), following the `USAGE`-const convention of
  `packages/intentionsutil/scripts/dump-node.ts:45-50`. It must name every flag
  that exists (`--report`, `--dry-run` — added in Unit 2 — and `--help`/`-h`),
  state that a bare run **writes** into the store, and state in one line that
  there is deliberately no `--dir`: this driver's store is fixed to its own
  checkout because four registered sensors close over the module-level
  `intentionsDir`/`repoRoot` (`:66-68`, `:1590-1598`, `:1613`, `:1614`,
  `:1620-1625`).
- Add `export function parseArgs(args: string[]): { report: boolean; dryRun: boolean }`
  above `main()`. Exported so the happy paths are unit-testable. Copy the
  scanning idiom of `dump-node.ts:223-245` (manual `for` loop, explicit
  `process.stderr.write(...)` + `process.exit(1)` per branch) — **not** a parser
  dependency, and **not** `apply-fix-state.ts`'s `throw new Error` shape (`:148`, `:150-152`), which
  surfaces as an uncaught stack trace because its `main()` (`:366-369`) has no
  catch.
  Differences from `dump-node.ts`, deliberate: read-sensors takes **no
  positional arguments**, so the rejection is not limited to
  `arg.startsWith("-")` — *any* token outside the known set is an error. That is
  what makes `--dir intentions` fail loudly on `--dir` rather than silently
  swallowing `intentions`.
- Error text: `read-sensors: unknown argument '<arg>'\n` followed by `USAGE`,
  written to **stderr**, then `process.exit(1)`. Exit code 1 matches the sibling
  scripts in this package (`dump-node.ts:242`, `graph-digest.ts` ~`:63`); do not
  use validate-graph's 2.
- `--report` and `--dry-run` are **mutually exclusive** — reject the combination
  with `read-sensors: --report and --dry-run are mutually exclusive\n` + USAGE +
  exit 1, rather than letting one silently win. Silent precedence is the same
  defect family this tactic closes.
- Rewrite `main()`'s opening (`:1735-1741`) as: take
  `const args = process.argv.slice(2)`; if it includes `--help` or `-h`, write
  `USAGE` to **stdout** and return (exit 0), matching `dump-node.ts:267-272`;
  otherwise `const { report, dryRun } = parseArgs(args)` and branch on `report`
  for the existing `renderDelegationRecordsReport(intentionsDir)` path (`:1739`),
  which is unchanged and stays store-fixed. In this unit `dryRun` is parsed and
  accepted but not yet honored — Unit 2 wires it. Do not leave it unused in a
  way that fails lint; if that is a problem, land Units 1 and 2 as one commit
  rather than weakening either half.
- Out of scope: `--dir` in any form (see Context), the store constants at
  `:66-68`, the sensor registry, `renderDelegationRecordsReport`, and the
  identical silently-drops-unknown-flags defect in
  `packages/intentionsutil/scripts/validate-graph.ts:93-105` — a real second
  instance, flagged here as an observation only, **not** to be fixed in this PR.

**Tests** (new file `packages/intentionsutil/test/read-sensors-cli.test.ts`):

- Copy the `runScript(script, args)` helper and the `scriptsDir` constant from
  `packages/intentionsutil/test/reader-required-dir.test.ts` (helper at
  ~`:33-39`, `scriptsDir` at ~`:31`) — `spawnSync(process.execPath, ["--import",
  "tsx/esm", join(scriptsDir, script), ...args], { encoding: "utf8" })`. A new
  file rather than a new `describe` in that one: `reader-required-dir.test.ts`'s
  header scopes it to clarification 242's four scripts, and read-sensors.ts is
  deliberately not one of them. Say so in a header comment on the new file so
  the duplication reads as intentional.
- Use the `{ timeout: 30_000 }` third-arg form on every `it()`, matching that
  file's uniform convention.
- Spawned cases — **only ones that exit during argument parsing**:
  `["--dir", "intentions"]` → `status` 1, stderr contains
  `unknown argument '--dir'`, stdout does **not** contain `read/written`;
  a misspelling such as `["--dryrun"]` → status 1, names itself;
  `["--report", "--dry-run"]` → status 1, stderr contains `mutually exclusive`;
  `["--help"]` → status 0, stdout contains `usage: read-sensors.ts`.
- **Never spawn a bare or otherwise-valid run.** A valid run executes every
  registered real sensor against the live `intentions/` store and writes it —
  including shell-outs to `gh`/`git`. Add that warning as a comment in the test
  file.
- Direct (non-spawn) unit cases on the exported `parseArgs` for the happy paths
  only, since the failure paths call `process.exit`: `parseArgs([])` →
  `{ report: false, dryRun: false }`; `parseArgs(["--dry-run"])` → `dryRun`
  true; `parseArgs(["--report"])` → `report` true.

**Recommended model: sonnet** — single file, mechanical, with the one design
decision (no `--dir`) already settled and reasoned above, so no judgment call is
delegated.

---

### Unit 2 — Add the `--dry-run` no-write check mode

**Scope.** Same file; the guard is on the existing WRITE pass, not a
restructure.

- `ReadSummary` (`:1664-1668`): add a `written: number` field
  ("nodes whose fresh reading was persisted; 0 under `--dry-run`") and amend the
  `read` field's comment — it currently reads "nodes whose sensor was read and
  written back", which stops being true.
- **`summary.read` is currently incremented inside the WRITE loop at `:1727`.**
  Move that increment into the READ pass, at the `updates.push({ ...node, reading })`
  site (~`:1721`), and have the WRITE loop increment `summary.written` instead.
  Without this move, a dry-run that skips the write loop would also report
  `0 read` — the exact "plausible summary" failure this tactic is closing. In
  write mode the reported `read` value is unchanged, so
  `packages/intentionsutil/test/delegation-records-sensor.test.ts:463`
  (`expect(summary.read).toBe(1)`) still passes.
- Change the signature to
  `export function readStoreSensors(dir: string, registry: SensorRegistry, options: { write?: boolean } = {}): ReadSummary`
  (`:1687`). The third parameter **must be optional**: there is a live two-arg
  caller at `delegation-records-sensor.test.ts:462`. Inside, `const write = options.write ?? true;`
  and guard the WRITE loop (`:1724-1728`) with it. Do **not** collapse the two
  passes — the rationale comment at `:1690-1698` explains that the whole-store
  intention-store sensor needs an unmutated pre-run snapshot. Extend that
  comment with one sentence: under `write: false` the WRITE pass is skipped
  entirely and the READ pass is byte-for-byte the same work, so the reported
  counts are identical to a real run's.
- `main()`: pass `{ write: !dryRun }` at the `readStoreSensors(intentionsDir, registry)`
  call (`:1744`). Amend the summary line (`:1746-1750`) to report both counts —
  `read-sensors: N read, M written, X skipped (no signal), Y skipped (unregistered sensor)`
  — and, under `--dry-run`, append an explicit clause such as
  `(--dry-run: nothing written to <intentionsDir>)` so the output states plainly
  that the store was not touched. The unregistered-sensor stderr tail
  (`:1752-1760`) is unchanged and still fires under `--dry-run`.
- Update the header usage block at `:19-20`
  ("Run from anywhere (the store dir is resolved relative to this file, not
  cwd)") to enumerate the three invocations — bare (writes), `--dry-run`
  (writes nothing), `--report` — and to state the no-`--dir` decision once, in
  the same place. Follow the doc convention of
  `packages/intentionsutil/scripts/apply-fix-state.ts:44,280` for a no-write
  mode ("Pure read of ... Makes NO write.").
- Out of scope: everything listed as out of scope in Unit 1, plus any change to
  which sensors run or what they read.

**Tests** (second `describe` block in the new
`packages/intentionsutil/test/read-sensors-cli.test.ts`, at the **unit** level —
import `readStoreSensors` and `SensorRegistry` directly, do **not** spawn the
CLI, because a spawned `--dry-run` would execute every real sensor against the
live store):

- Fixture store via the plain `mkdtempSync(join(tmpdir(), "..."))` pattern —
  `tempStore()` in `delegation-records-sensor.test.ts:33-35` or `tempDir()` in
  `store.test.ts:15-17`. No git init is needed; `read-sensors.ts` does no
  git-object work, so `reader-required-dir.test.ts`'s `fixtureRepo()` is heavier
  than required.
- Write two fixture nodes with `writeNode` (`../src/store.js`), one naming a
  stub sensor registered on a hand-built `SensorRegistry`, one with
  `success_signal: null`.
- Snapshot each `<id>.md` with `readFileSync` before the call; run
  `readStoreSensors(dir, registry, { write: false })`; assert `summary.read`
  is 1, `summary.written` is 0, `summary.skippedNoSignal` is 1, and every file
  is **byte-identical** to its snapshot.
- Control case on a fresh fixture: the default two-argument call writes — the
  file changes and `readNode(dir, id).reading` is the stub sensor's value —
  proving the dry-run assertion is not vacuous.

**Dependencies:** Unit 1 (the parser must exist before `--dry-run` can reach
`main()`).

**Recommended model: sonnet** — same character as Unit 1: one file, an existing
pass boundary to guard, and the one non-obvious step (moving the `read`
counter out of the write loop) is spelled out above.

## Reuse

- `packages/intentionsutil/scripts/dump-node.ts:223-245` — **primary** reuse
  target: the unknown-token rejection idiom (manual scan loop,
  `process.stderr.write("... unknown option '<arg>'\n" + USAGE)` +
  `process.exit(1)` at `:240-242`), with its `USAGE` const convention at
  `:45-50` and `--help` handling in `main()` at `:267-278`.
- `packages/intentionsutil/scripts/graph-digest.ts` `main()` (~`:54-68`) — the
  closest structural match for a script whose flag set is a small number of
  **boolean** flags: `const unknown = args.filter(...)` → stderr + `exit(1)`
  (~`:56-64`). Either shape is acceptable; the scanning loop is preferred
  because it reports the first offending token by name.
- `packages/intentionsutil/scripts/write-node.ts:48-66` (`parseIntentionsDir`)
  — the older, *incomplete* version of the idiom: it validates a required
  value-flag but never rejects unknown tokens. Cite as precedent for the
  stderr+exit shape, not as the model for rejection behavior.
- `packages/intentionsutil/scripts/apply-fix-state.ts:96-155` — precedent for
  distinguishing "unknown flag" from "unexpected extra argument", and at
  `:44,280` the "Pure read of ... Makes NO write." doc convention for a no-write
  mode. Do **not** copy its `throw new Error` error path (the throws at `:148` and
  `:150-152`): `main()` (`:366-369`) has no catch, so it surfaces as a raw
  stack trace.
- `packages/intentionsutil/scripts/read-sensors.ts:1687-1731` — the existing
  READ/WRITE pass separation is the guard point for `--dry-run`; reuse it rather
  than writing a parallel check-only driver.
- `packages/intentionsutil/test/reader-required-dir.test.ts` — the only
  spawnSync-based CLI harness in the test dir: `runScript` (~`:33-39`),
  `scriptsDir` (~`:31`), the `{ timeout: 30_000 }` convention, and the
  `expect(run.status).toBe(n)` + `expect(run.stderr).toContain(...)` +
  negative-stdout assertion shape. Copy the helper; do not invent a new one.
- `packages/intentionsutil/test/delegation-records-sensor.test.ts:445-470` — the
  existing `readStoreSensors` end-to-end pattern (fixture store +
  hand-registered `SensorRegistry` + `readNode` assertion) to model the dry-run
  cases on; `tempStore()` at `:33-35`.
- `packages/intentionsutil/test/store.test.ts:15-17` (`tempDir()`) and
  `packages/intentionsutil/test/write-node.test.ts:1-27` — the plain
  non-git scratch-dir fixture and the "import the exported core function
  directly" test shape.
- `packages/intentionsutil/src/sensors.ts:26-58` (`SensorRegistry`) — `register`
  / `names` / `resolve`; `resolve` throws `IntentionSchemaError` on an
  unregistered name, which `readStoreSensors` already catches at `:1711-1719`.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

(`packages/intentionsutil/package.json` `scripts.test` is `vitest run`; this
package is not a vitest `--project`, so the `--project <app> --root <repo_root>`
form does not apply here.)

Manual — this is the check that actually proves the fix. Run each from the
repo/worktree root:

1. `npx tsx packages/intentionsutil/scripts/read-sensors.ts --dry-run`, then
   `git status --porcelain -- intentions/`. The status output must be **empty**,
   and the run's own summary must say plainly that nothing was written. Before
   this change the equivalent bare run dirties several
   `intentions/strategy-*.md` files.
2. `npx tsx packages/intentionsutil/scripts/read-sensors.ts --dir intentions` —
   must exit non-zero and name `--dir` in a usage message, instead of appearing
   to succeed while writing.
3. `npx tsx packages/intentionsutil/scripts/read-sensors.ts --report` — must
   still print the delegation-records portfolio table unchanged and write
   nothing.
4. `npx tsx packages/intentionsutil/scripts/read-sensors.ts --help` — prints the
   usage on stdout, exits 0.

**Do not run a bare, no-flag invocation as part of verification.** It writes
fresh readings into `intentions/` and those writes will land in the PR diff as
unrelated churn. If it happens by accident, restore with
`git checkout -- intentions/`.

Judgment call left to the reviewer, recorded here so it is not lost: this
tactic deliberately leaves the reading driver outside the required-explicit-tree
contract (`strategy-graph-native-dispatch` clarification 194, scoped by
clarification 242) that every other graph reader/writer now satisfies. Whether
that residual gap is material — and whether the follow-on
`buildDefaultRegistry(dir, repoRoot)` parameterization tactic should be filed —
is a question for the next round, not for this PR.
