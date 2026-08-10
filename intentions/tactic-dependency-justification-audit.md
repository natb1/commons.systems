---
id: tactic-dependency-justification-audit
kind: tactic
statement: Instrument the dependency-justification audit over the workspace
  manifests (strategy-owned-web-platform's sensor)
owner: ai
status: codified
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy interview as the
  strategy's sensor: the success signal (every third-party runtime dependency
  justified, count flat or falling) needs a repeatable audit rather than a hand
  sweep. Retained as a draft for /align-tactics."
reading: null
gap: null
serves:
  - strategy-owned-web-platform
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-dependency-justification-audit
  pr: 2875
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
validates:
  - strategy-owned-web-platform
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Instrument the dependency-justification audit over the workspace manifests (strategy-owned-web-platform's sensor)

## Context

`strategy-owned-web-platform`'s success signal is "every third-party runtime
dependency of the apps and shared packages carries a recorded justification, and
the dependency count stays flat or falling", measured by a "dependency audit
script over the workspace manifests (extending the knip ratchet), reviewed at
office-hours", against the threshold "zero unjustified runtime dependencies and
no unreviewed dependency growth between office-hours reviews".

No such audit exists today. The strategy's current `reading` was produced by a
one-off manual code review ("no dependency-justification audit exists; ... knip
enforces one-reason-per-suppression but runtime dependencies carry no recorded
justification, and upstream-liveness exposure (Critters archived, epubjs stale)
is tracked only in review notes"), so the strategy cannot produce a fresh
machine reading and dead-ends at the round cap without an instrument. This
tactic builds that instrument: a runnable audit that enumerates every runtime
dependency across the workspace manifests, cross-checks each against a recorded
justification (with upstream liveness reported alongside), and registers as the
strategy's sensor so `read-sensors.ts` produces the strategy's `reading`
automatically. It is the round's signal-validating terminal
(`validates: [strategy-owned-web-platform]`).

## Unit 1 — Dependency-justification audit script

**Scope.** Add `packages/intentionsutil/scripts/dependency-audit.ts` (repo-root
resolved from `import.meta.url`, not cwd — mirror the pattern in
`packages/intentionsutil/scripts/read-sensors.ts:44-47`). It:

1. Reads the workspace list from the root `package.json` `workspaces` array
   (`package.json` — the 30-entry mixed apps + `packages/*` list), loads each
   member's `package.json`, and collects the union of `dependencies` keys
   (runtime only — **exclude** `devDependencies`, which clarification 2 on the
   strategy explicitly leaves out of the recorded conditions; the build-time
   toolchain and Firebase client SDK are out of scope).
2. Cross-checks each runtime dependency against a justifications data file
   (Unit 2), reporting per dependency: `justified | UNJUSTIFIED`, and the
   recorded `upstream` liveness note where present.
3. Emits a stable, parseable one-line summary plus a detail block, e.g.
   `dependency-audit: <N> runtime deps, <M> unjustified, <K> dead-upstream`
   followed by the unjustified/dead-upstream names. Exit non-zero only on a
   genuine read error (a missing manifest) — a nonzero count of unjustified deps
   is a *reading*, not a script failure (the sensor in Unit 3 needs it to return
   a string, not throw).

Out of scope: mutating any `package.json`; dedup/removal of the baselined
knip residuals; devDependencies; the Firebase client SDK lifecycle
(rides `strategy-firebase-demo-saas`).

**Recommended model:** opus (new cross-workspace tooling with an output-format
and data-model decision).

## Unit 2 — Seed the justifications data file

**Scope.** Add the justifications data file the audit reads — a `.jsonc` (comment
support, matching `knip.jsonc`'s house style) or a typed `.ts` module beside the
script, keyed by dependency name, each entry `{ justification: string, upstream:
"live" | "archived" | "stale" | <note> }`. Seed it with one honest entry per
current runtime dependency across the workspace (the initial audit content that
supersedes the scattered review notes). This is the content that drives the
`reading` toward the threshold "zero unjustified": known dead upstreams
**Critters** (critical-CSS inliner, archived — see `packages/criticalcssutil`)
and **epubjs** (print's EPUB renderer, patched around in-app) must carry an
`archived`/`stale` upstream note so they surface at office-hours instead of at
breakage (strategy clarification 3). Follow the knip one-reason-per-entry
ratchet: every entry carries exactly one substantive justification; a brand-new
undeclared dependency has no entry and so reports `UNJUSTIFIED`.

Out of scope: justifying devDependencies; re-litigating the knip
`ignoreDependencies` baseline.

**Recommended model:** opus (per-dependency justification + upstream-liveness is
judgment-heavy content, not a mechanical transform).

**Dependencies:** Unit 1 (the audit defines the file's consumed shape).

## Unit 3 — Register the audit as the strategy's sensor

**Scope.** Register a `Sensor` in `packages/intentionsutil/scripts/read-sensors.ts`
whose `name` is the **verbatim** `success_signal.sensor` string on
`strategy-owned-web-platform` ("dependency audit script over the workspace
manifests (extending the knip ratchet), reviewed at office-hours") — the driver
resolves a sensor by that exact name, exactly as the `token-economy` and
lifecycle sensors do (`read-sensors.ts:304`, `:319` show the
match-the-declared-name contract). Its `read()` runs the Unit 1 audit and
returns the parseable summary string; it must be **total** (never throw — a
read error degrades to a status string), per the total-sensor contract
documented at `read-sensors.ts:49-51`. Add it to the default registry alongside
the existing sensors.

Out of scope: editing the strategy's `success_signal.sensor` text (that is
`/align-strategy` territory); wiring any external/mining sensor.

**Recommended model:** sonnet (mechanical wiring following two in-file
precedents).

**Dependencies:** Unit 1, Unit 2.

## Reuse

- Repo-root-from-`import.meta.url` resolution and the total-sensor contract:
  `packages/intentionsutil/scripts/read-sensors.ts:44-51`.
- `Sensor` interface + `SensorRegistry`: `packages/intentionsutil/src/sensors.ts:13-24`;
  match-the-declared-name precedent at `read-sensors.ts:304` (`token-economy`)
  and `:319` (lifecycle `LIFECYCLE_SENSOR_NAME`).
- Workspace member list: root `package.json` `workspaces`.
- One-reason-per-entry ratchet convention and comment-in-JSON style: `knip.jsonc`.

## Verification

```verify
npx tsx packages/intentionsutil/scripts/dependency-audit.ts
```

The audit prints the `dependency-audit: N runtime deps, M unjustified, K
dead-upstream` summary; confirm Critters and epubjs appear in the dead-upstream
list.

```verify
npx tsx packages/intentionsutil/scripts/read-sensors.ts
```

Confirm the driver resolves the new sensor for `strategy-owned-web-platform`
(no "No sensor registered under name ..." error) and writes a non-null
`reading` for it.

```verify
npx vitest run --project packages/intentionsutil --root .
```

Add unit tests covering: manifest parsing collects runtime deps and excludes
devDependencies; a dependency with no justification entry reports `UNJUSTIFIED`;
an entry with an `archived`/`stale` upstream is reported as dead-upstream; the
sensor `read()` returns a string (does not throw) on a simulated read error.

Manual: at the next office-hours review, confirm the audit output is a usable
review artifact (the reading names every unjustified dep and every dead
upstream) — this is the "reviewed at office-hours" half of the sensor.
