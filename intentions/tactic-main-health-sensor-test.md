---
id: tactic-main-health-sensor-test
kind: tactic
statement: Add unit test coverage for the main-health sensor's read() branches
owner: ai
status: codified
parent: null
rationale: "Retained review residue from PR #2919 (tactic-graph-main-self-heal):
  the new mainHealthSensor added to read-sensors.ts has no per-sensor test,
  unlike token-economy/lifecycle/intention-store sensors which each have a
  dedicated *-sensor.test.ts. The plan's own verification section deferred this
  to manual/observed checks."
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
  branch: tactic-main-health-sensor-test
  pr: 2943
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Add unit test coverage for the main-health sensor's read() branches

## Context

Review residue from PR #2919 (`tactic-graph-main-self-heal`): the
`mainHealthSensor` added to `packages/intentionsutil/scripts/read-sensors.ts`
is the only sensor with no dedicated `*-sensor.test.ts`, unlike
`token-economy`, `lifecycle`, and `intention-store`. Its three `read()`
branches (green / red / unknown) and its verbatim coupling to
`strategy-main-health`'s `success_signal.threshold` are untested. A silent
drift in any of the three strings or branches would break the main-health
signal without any test catching it. The current `read()` hardcodes the
`repo-health` binary path inline, so it can't be exercised against a fake
binary without a small extraction — the same "extract a standalone
`export function` the `*Sensor.read()` calls" shape every other sensor in
this file already follows.

## Unit (single unit — this is one PR)

**Scope**

1. **Extraction in `packages/intentionsutil/scripts/read-sensors.ts` (lines
   162-180).** Add a standalone exported function and have the sensor
   delegate to it:
   - New `export function readMainHealth(binaryPath: string): string`
     containing the current body of `read()` verbatim — the
     `try/execFileSync(binaryPath, ["--main-broken-sha"], ghExecOpts)/catch →
     "unknown"` logic, the empty-stdout → green-string branch, and the
     `` red: ${sha} ... `` branch. `binaryPath` replaces the inline
     `join(repoRoot, ".claude", ...)` argument; `ghExecOpts` (with its
     `cwd: repoRoot`) stays internal and unchanged.
   - `mainHealthSensor.read()` becomes a one-liner:
     `read(): string { return readMainHealth(join(repoRoot, ".claude", "skills", "dispatch-propagate", "scripts", "repo-health")); }`
     — preserving the exact default path at `read-sensors.ts:168`.
   - Mirrors the established shape (`readWeeklyUtilization`,
     `readTacticVelocity`, `readTokenEconomy`, `readLifecyclePhaseHistory`,
     `readSelectionLog`, `readLifecycleReading` are all standalone
     `export function`s their sensor objects call). Keep the two doc-comment
     blocks (lines 124-161) attached; the SIDE EFFECT note stays accurate
     since the default path is unchanged.
   - Optional: hoist the green literal into a module-const (e.g.
     `const MAIN_HEALTH_GREEN = "green: every check on the current origin/main HEAD concludes success (or neutral/skipped)"`)
     so the sensor has one source for the string; not required if the test
     parses the strategy file directly (below).

2. **New test file `packages/intentionsutil/test/main-health-sensor.test.ts`.**
   Structure copied from the sibling sensor tests (describe blocks,
   `mkdtempSync(join(tmpdir(), "main-health-"))` fixture isolation). Imports
   from `../scripts/read-sensors.js` (the `.js`-extension-on-`.ts`-source
   convention this repo uses): `readMainHealth`, `buildDefaultRegistry`.

   Fixture helper: write a temporary executable `repo-health` stand-in
   script (`writeFileSync` a `#!/bin/sh` script, `chmodSync(path, 0o755)`),
   parameterized by the behavior needed:
   - green: script exits 0 with no stdout (`exit 0`)
   - red: script `echo`s a fixed fake sha then exits 0
   - unknown: script `exit 1` (non-zero → `execFileSync` throws)

   Cases:
   - **green branch** — `readMainHealth(greenBin)` equals the green literal.
     Assert this equals `strategy-main-health`'s threshold **read from the
     file, not snapshotted**: resolve repo root as
     `join(import.meta.dirname, "..", "..", "..")`, read
     `intentions/strategy-main-health.md`, slice the YAML frontmatter
     (between the first two `---` lines), parse it with the `yaml` package
     (already an `intentionsutil` dependency), and assert
     `parsed.success_signal.threshold === readMainHealth(greenBin)`. YAML
     folds the file's two-line threshold into the exact single-space
     string, so this catches drift in either the sensor or the strategy
     node.
   - **red branch** — `readMainHealth(redBin)` equals
     `` `red: ${fakeSha} has one or more failing checks` ``.
   - **unknown branch** — `readMainHealth(failBin)` equals `"unknown"`.
   - **`buildDefaultRegistry` smoke test** —
     `buildDefaultRegistry().resolve("main-health").name === "main-health"`
     (matches the `registry.resolve("<name>").name === "<name>"` block each
     sibling test file ends with).

   Clean up temp dirs with `rmSync(dir, { recursive: true, force: true })`
   per sibling convention.

**Out of scope**

- `.claude/skills/dispatch-propagate/scripts/repo-health` — not modified,
  only faked in tests.
- `intentions/strategy-main-health.md` — read-only in the test; not edited.
- No new sensors, no registry changes beyond the already-present
  `registry.register(mainHealthSensor)` call.
- No behavior change to `mainHealthSensor`'s output for the real default
  path.

**Recommended model:** `sonnet`. Per
`.claude/skills/implement-unit/SKILL.md` (lines 31-39), sonnet covers
well-specified, mechanical work — unit-test writing with explicit cases.
This is a single-file-pair extraction (a mechanical body-move with a
preserved default path) plus three explicitly-enumerated test branches
following an established sibling template, with no architectural ambiguity.

**Dependencies:** none.

## Reuse

- `packages/intentionsutil/test/token-economy-sensor.test.ts` — closest
  pattern: `.js` import of named functions, `mkdtempSync`/`tmpdir()`
  fixtures, and the closing `buildDefaultRegistry` describe block.
- `packages/intentionsutil/test/lifecycle-sensor.test.ts` and
  `packages/intentionsutil/test/intention-store-sensor.test.ts` — sibling
  `buildDefaultRegistry` resolve-by-name blocks, describe/helper shape, and
  precedent for asserting total-sensor degradation to `"unknown"`.
- Extraction shape to mirror: the existing standalone `export function`
  sensors in `packages/intentionsutil/scripts/read-sensors.ts` and their
  thin `*Sensor.read()` delegators.
- `yaml` package (already in `packages/intentionsutil/package.json`
  dependencies) for parsing the strategy frontmatter.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
npx tsc --noEmit -p packages/intentionsutil/tsconfig.json
```

(`--project packages/intentionsutil` is the workspace-dir name
`vitest.config.ts`'s `test: { name: dir }` uses — the same form
`intentions/tactic-graph-main-self-heal.md` already runs in CI; never
`--root packages/intentionsutil`, which would scope `server.fs.allow` too
narrowly. `packages/intentionsutil/tsconfig.json` includes `src`, `test`,
and `scripts`, so `tsc --noEmit` typechecks both the extraction and the new
test.)

**Source PR:** #2919 (`tactic-graph-main-self-heal`).
