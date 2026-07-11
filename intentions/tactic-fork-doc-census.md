---
id: tactic-fork-doc-census
kind: tactic
statement: "Instrument: shallow-fork documentation census — enumerate the public
  artifacts (whole-repo fork surface plus each deployed app) and report
  per-artifact fork-doc coverage for the office-hours review"
owner: ai
status: codified
parent: null
rationale: "Authored 2026-07-11 by /align-tactics round 1.
  strategy-open-source-as-gift has reading null and its sensor is fork reviews
  and practitioner reports at office-hours — this instrument makes the threshold
  machine-measurable: it enumerates the public artifacts (working definition
  recorded as a strategy clarification) and reports which carry fork
  documentation, printing the sufficiency attestation checklist only the owner
  can complete. It is the round validates-terminal. Complementary to
  tactic-fork-derivative-sensor (strategy-distribute-workflow instrument): that
  one makes external forks visible; this one measures whether each artifact
  documentation lets a fork stand alone — a repo-tree property needing no
  external fork to exist. Report-only; the office-hours review stamps
  reading/gap on the strategy node."
reading: null
gap: null
serves:
  - strategy-open-source-as-gift
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-fork-doc-census
  pr: 2858
  attempts: {}
  markers:
    - qa-done
    - reviewed
  strategy_fingerprint: 892a6c625352a46037d9103be1fbe0fb2ba8a6684be63c84c2754656e2246aac
validates:
  - strategy-open-source-as-gift
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Instrument: shallow-fork documentation census — enumerate the public artifacts (whole-repo fork surface plus each deployed app) and report per-artifact fork-doc coverage for the office-hours review

## Context

`strategy-open-source-as-gift` has `reading: null`, its
`success_signal.sensor` is `fork reviews and practitioner reports at
office-hours`, and its threshold is "each public artifact carries
documentation sufficient for a shallow fork to stand alone" (`is_proxy:
true`). The signal cannot currently be read: nothing enumerates the public
artifacts or their documentation state. Today the repo carries a root
`README.md` plus only four sub-READMEs (`intentions/`,
`office-hours-snapshot/`, `packages/ds/`, `packages/firestoreutil/`), and
none of the six deployed app directories has one — so the office-hours
review has no evidence in front of it.

This instrument makes the review runnable. It is a report-only audit script
mirroring `packages/intentionsutil/scripts/audit-publishing.ts` (the
`strategy-recover-publishing` instrument, tactic
`tactic-recover-publishing-reading`): it enumerates the public artifacts,
machine-checks the presence half of the threshold (fork documentation
exists per artifact), and prints the sufficiency attestation checklist only
the owner can complete. The owner review at office-hours consumes the
report and stamps `reading`/`gap` on
`intentions/strategy-open-source-as-gift.md` via `write-node.ts` +
`graph-commit` (that completion also increments the strategy's `rounds` per
`.claude/skills/align-tactics/SKILL.md`'s round-accounting convention).

**Public artifact enumeration** (working definition recorded as a strategy
clarification, amendable by the owner at the first reading): the artifact
`repo` — the whole-repo fork surface, documented by the root `README.md` —
plus one artifact per Firebase hosting target read from `.firebaserc`
(currently `landing`, `budget`, `fellspiral`, `print`, `audio`,
`office-hours`), each mapping to its same-named top-level source directory
and checked for `<dir>/README.md`. Deriving from `.firebaserc` keeps the
census fresh: a newly deployed app enters it automatically.

Deliberately **not** registered in the `read-sensors.ts` default sensor
registry: although this census is local-first/no-network, that registry
auto-writes `reading`/`gap`
(`packages/intentionsutil/scripts/read-sensors.ts:1-28`), and this sensor's
sufficiency half is owner judgment — report-only mirrors the
`audit-publishing.ts` precedent.

Complementary to `tactic-fork-derivative-sensor`
(strategy-distribute-workflow's in-flight instrument, which extends the
office-hours snapshot with fork enumeration): that one makes external forks
visible; this one measures whether each artifact's documentation lets a
fork stand alone — a repo-tree property needing no external fork to exist.
It deliberately touches none of that tactic's files
(`office-hours-snapshot/src/**`, `office-hours/src/**`).

Implement each unit in a subagent launched with the unit's Recommended
model (Agent/Task tool, `model: sonnet` or `model: opus`), passing the
unit's Context/Scope inline; constrain it to working-tree edits.

## Unit 1 — `audit-fork-docs.ts` script + tests

**Recommended model:** sonnet

**Scope.** New script
`packages/intentionsutil/scripts/audit-fork-docs.ts` (tsx, no new
dependencies) plus a new test file
`packages/intentionsutil/test/audit-fork-docs.test.ts`. No other file
changes.

- Resolve paths script-relative, never from cwd (repo root is three
  directories up), and guard `main` with the
  `import.meta.url === pathToFileURL(process.argv[1]).href` pattern — both
  per `packages/intentionsutil/scripts/read-sensors.ts:40-45,176-178` and
  `audit-publishing.ts`.
- Separate the pure core from IO so tests inject fixtures: export a core
  (e.g. `auditForkDocs(fs)`) taking a tiny injected fs facade such as
  `{ readText(path: string): string | null; isDir(path: string): boolean }`
  (`readText` returns `null` for a missing file). The `main` entry wires it
  to `node:fs` and prints the report.
- Enumerate artifacts: always include
  `{ name: "repo", readme: "README.md" }`; then parse `.firebaserc` (JSON)
  and take the hosting-target names under `targets.<project>.hosting` —
  require exactly one project entry under `targets` (fork-friendly: a fork
  changes the Firebase project id, so do not hardcode `commons-systems`).
  Each target maps to `{ name: <target>, readme: "<target>/README.md" }`.
- Fatal errors (clear errors over fallbacks,
  `.claude/rules/code-style.md`): unreadable or unparseable `.firebaserc`;
  zero or multiple project entries under `targets`; an empty hosting map; a
  hosting target whose same-named source directory does not exist (name the
  target). A broken enumeration means the instrument cannot produce an
  honest reading.
- Per-artifact machine check: the artifact's README file exists and is
  non-empty → present yes/no. A missing README is a per-artifact
  **finding** (reported, does not abort the run).
- Report (stdout, markdown): a table of artifacts — name, README path,
  `present` yes/no — then an attestation checklist section with one line
  per artifact:
  `- [ ] <artifact>: documentation sufficient for a shallow fork to stand alone? (scope incl. @commons-systems/* deps / architecture & data flow / build & run from a fresh clone / deployment & required services / dependency inlining-or-replacement guidance / CC-BY-SA share-alike terms)`
  — the dimensions are the gh #442 checklist retained in
  `intentions/tactic-shallow-fork-docs.md:40-55` — and a trailing line
  telling the owner where the result lands: stamp `reading`/`gap` on
  `intentions/strategy-open-source-as-gift.md`.
- Exit `0` when every artifact's README is present, `1` when any is
  missing (the missing list is the gap evidence). Expose the exit decision
  via a returned summary object so tests assert it without spawning.
- Tests (inject the fs facade, no real tree): enumeration from a
  `.firebaserc` fixture including the always-present `repo` artifact;
  present/missing classification (missing file, empty file); fatal on
  unparseable `.firebaserc`, on multiple project entries, and on a target
  without a source directory; exit semantics via the summary object.

Out of scope: writing any README (documentation gap closure is next-round
work; the budget fork docs are author-gated at
`intentions/tactic-shallow-fork-docs.md` behind
`tactic-tier3-entry-declaration`); registering a sensor in
`read-sensors.ts`; writing `reading`/`gap` (owner's office-hours step); any
change to the apps, `.firebaserc`, or `office-hours-snapshot/**`.

## Reuse

- Report-only instrument shape, fatal-error conventions, `errMessage`
  helper, exit semantics:
  `packages/intentionsutil/scripts/audit-publishing.ts`.
- Script-relative repo-root resolution and main-guard:
  `packages/intentionsutil/scripts/read-sensors.ts:40-45,176-178`.
- Test conventions (injected-IO fixtures):
  `packages/intentionsutil/test/audit-publishing.test.ts`.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
npx tsc -p packages/intentionsutil --noEmit
```

The vitest project name is the full workspace dir `packages/intentionsutil`
(`vitest.config.ts` names projects by dir; `--project intentionsutil`
matches nothing).

Manual: run `npx tsx packages/intentionsutil/scripts/audit-fork-docs.ts`
from the repo root — it must enumerate the `repo` artifact plus the six
hosting targets, report the root README present and the six app READMEs
missing (today's expected gap evidence, exit `1`), and print the
attestation checklist. The owner review at office-hours consumes the report
and stamps the strategy's `reading`/`gap`; that office-hours completion —
not this tactic's merge — is what produces the signal reading.
