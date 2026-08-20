---
id: tactic-read-sensors-arg-rejection-check-mode
kind: tactic
statement: Make read-sensors.ts reject unrecognized arguments and gain a
  no-write check mode -- main() parses only --report and silently drops every
  other argument, then runs an unconditional write pass against the intentions/
  of whichever checkout the script file lives in
owner: ai
status: raw
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
phase: null
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

Filed 2026-08-13. The defect is measured, not inferred — every line reference
below was read off `origin/main` at `8f1dff05`.

## Context

`packages/intentionsutil/scripts/read-sensors.ts` is the reading driver: it
resolves each strategy's declared sensor, computes a fresh `reading`, and
persists it. It is invoked by hand during graph rounds and as
`npm run read-sensors --prefix packages/intentionsutil`
(`packages/intentionsutil/package.json:18`).

Three things are true of it today, and together they make it unsafe to run:

1. **It parses exactly one argument.** `main()` (`read-sensors.ts:1586-1592`)
   tests `process.argv.includes("--report")` and nothing else. Every other
   argument is discarded in silence — no error, no warning, no echo of what was
   understood.
2. **Its store path is fixed at module scope.** `intentionsDir` is
   `join(repoRoot, "intentions")` where `repoRoot` is three directories up from
   `import.meta.url` (`:65-67`). `main()` passes that constant to
   `readStoreSensors` unconditionally (`:1595`).
3. **The write pass is unconditional.** `readStoreSensors`'s second loop calls
   `writeNode(dir, updated)` for every node whose reading was computed
   (`:1575-1579`). There is no `--dry-run`, `--check`, or `--no-write`.

The consequence is a false affordance rather than a missing feature. An
operator wanting to check whether a sensor produces a reading — without
touching the store — reaches for `read-sensors.ts --dir /tmp/scratch`. That
command runs, prints a plausible summary, exits 0, and **writes into the
repository the script file lives in**. The invocation looks scoped, so its
writes get attributed to whatever else the session was doing. This has been
misdiagnosed at least three times: first as "some sensors resolve their store
from the script location", later as a `--dir` containment leak. Neither is
true. The flag was never read.

It is also a direct violation of `.claude/rules/code-style.md` ("prefer clear
errors over defensive fallbacks"): an unrecognized argument is a misconfigured
invocation, and swallowing it produces silent incorrect behavior.

## Scope

Two changes to `packages/intentionsutil/scripts/read-sensors.ts`, both inside
`main()` and `readStoreSensors`:

- **Reject unrecognized arguments.** Replace the `argv.includes("--report")`
  test with real parsing over `process.argv.slice(2)`. Any token not in the
  known set exits non-zero with a usage line naming the flags that exist.
  Follow the arg-parsing idiom already used by the sibling script
  `packages/intentionsutil/scripts/write-node.ts:43-58` (`indexOf` + explicit
  missing-value error) rather than adding a parser dependency.
- **Add a no-write check mode** (`--dry-run`). `readStoreSensors` already
  separates its READ pass from its WRITE pass precisely — the deferral is
  deliberate and documented at `:1541-1549` — so the containment is a guard on
  the second loop (`:1576`), not a restructure. Under `--dry-run`, compute
  every reading, report the same summary counts, write nothing, and say
  plainly in the output that nothing was written. Keep the existing
  `--report` path exactly as-is; it is already read-only (`:1587-1592`).

Explicitly **out of scope**, and this is the important part:

- **Do not add `--dir`.** It is the obvious-looking addition and it is a trap.
  `readStoreSensors(dir, registry)` takes a directory (`:1538`), so wiring
  `--dir` to it looks like a two-line change — but three registered sensors
  close over the module-level constants instead:
  `makeDelegationRecordsSensor(() => listNodes(intentionsDir))` (`:1482`),
  `makeIntentionStoreSensor(..., () => listNodes(intentionsDir))` (`:1491`),
  and `rsiSensor`, which reads `repoRoot` for both the usage-audit path and
  its own store argument (`:1461-1465`). `buildDefaultRegistry()` takes no
  parameters (`:1473`). A `--dir` threaded only through `readStoreSensors`
  yields a run that **reads one store and writes another** — strictly worse
  than today's honest single-store behavior, and a defect of exactly the same
  silent-wrong-result family this tactic exists to close.

  Honoring `--dir` properly means parameterizing `buildDefaultRegistry(dir,
  repoRoot)` and every closure above. That is a defensible greenfield shape —
  it would make the driver testable against a fixture store — but it is a
  larger change with its own review, and `--dry-run` removes the need that
  drove people to `--dir` in the first place. If the author elects the full
  `--dir`, it is a separate tactic and raises the model to opus.

## Recommended model: sonnet

Mechanical, single file, with the one design decision (no `--dir`) already
settled above and its reasoning recorded, so no judgment call is delegated.

## Reuse

- `packages/intentionsutil/scripts/write-node.ts:43-58` — the argument-parsing
  idiom to follow.
- `readStoreSensors`'s existing two-pass split (`read-sensors.ts:1541-1579`) —
  the guard point for `--dry-run`. Do not collapse the passes; the comment at
  `:1541-1549` explains why the whole-store sensor needs an unmutated snapshot.
- `packages/intentionsutil/test/` — the existing sensor tests carry the
  fixture-store pattern for new cases.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Add coverage for both halves: an unknown argument exits non-zero and names
itself, and a `--dry-run` run leaves the fixture store byte-identical while
still reporting a non-zero read count.

Manual, and this is the check that actually proves the fix — from a clean
tree, run `npx tsx packages/intentionsutil/scripts/read-sensors.ts --dry-run`
and confirm `git status --porcelain -- intentions/` is **empty**. Today the
same run dirties several `intentions/strategy-*.md` files. Then run
`... read-sensors.ts --dir intentions` and confirm it now exits non-zero
instead of appearing to succeed.
