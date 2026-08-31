---
id: tactic-participation-log-instrument
kind: tactic
statement: "Instrument: participation-log convention and office-hours review
  report producing the strategy-join-existing-practice signal reading"
owner: ai
status: codified
parent: null
rationale: "Round-1 instrument for strategy-join-existing-practice (its reading
  is null — a strategy that cannot be measured must first buy its own
  instrument): participation happens off-repo, so nothing in the repo can be
  scraped for evidence — the sensor reads the author-maintained
  attributes.participation_log convention (strategy clarification, 2026-07-11)
  plus a report script that assembles the log and the challenge-routing state
  against strategy-external-calibration into the review the owner stamps as the
  reading. The born-parked sibling tactic-join-indieweb (blocked_by this tactic
  for its reading-production half) then logs real participation and produces the
  strategy's first reading. Recorded 2026-07-11 /align-tactics round."
reading: null
gap: null
serves:
  - strategy-join-existing-practice
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-participation-log-instrument
  pr: 2873
  attempts: {}
  markers: []
  strategy_fingerprint: ad4311f339fb4ca9e66a660b49ffa583735eb4d6c3af4bca3a1302f169a38a3b
validates:
  - strategy-join-existing-practice
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Instrument: participation-log convention and office-hours review report producing the strategy-join-existing-practice signal reading

## Context

`strategy-join-existing-practice` ("Join the existing communities of this
practice rather than waiting to cultivate one") has `reading: null`; its
sensor is "owner review at office-hours" against the threshold "participation
recurs across review cycles and at least one community-sourced challenge
reaches strategy-external-calibration". Participation happens off-repo —
IndieWeb events and chat, local-first venues, self-hosting forums — so no
repo artifact can be scraped for evidence: the sensor reads an
author-maintained log. The convention is recorded as a 2026-07-11
clarification on the strategy: `attributes.participation_log` on
`intentions/strategy-join-existing-practice.md`, a list of
`{date, venue, activity, challenge}` entries (`challenge: null` when none
arrived). This tactic builds the module that parses and summarizes that log,
reports the challenge-routing state against `strategy-external-calibration`,
and the report script the office-hours session runs. The born-parked sibling
`tactic-join-indieweb` (blocked_by this tactic) then records real
participation and produces the strategy's first reading.

Report-only: the script never writes `reading`/`gap` onto any node — the
owner review consumes the report and stamps `reading`/`gap` on the strategy
(the same posture as `packages/intentionsutil/scripts/audit-publishing.ts`).
Local-only: it reads the committed `intentions/` store; no network, no gh.

This is exactly one PR.

## Unit 1 — participation module (`packages/intentionsutil/src/participation.ts`)

**Recommended model:** sonnet

Scope — new `packages/intentionsutil/src/participation.ts` exporting:

- `ParticipationEntry` —
  `{date: string, venue: string, activity: string, challenge: string | null}`.
- `parseParticipationLog(node: IntentionNode): {entries: ParticipationEntry[], malformed: string[]}`
  — reads `node.attributes.participation_log`. Attributes shape is data, not
  a code contract, so parse defensively at the boundary (the posture
  `packages/intentionsutil/src/attention.ts` takes on
  `attributes.irreversibility`). Absent or empty attribute →
  `{entries: [], malformed: []}` (an honest zero, not an error). A non-array
  attribute, or an entry missing or mistyping `date` (a `YYYY-MM-DD` string),
  `venue`, or `activity` (non-empty strings) → describe it in `malformed`
  (index plus defect), keep parsing the rest. A missing `challenge` → `null`.
  Entries return sorted by `date` ascending.
- `participationSummary(entries: ParticipationEntry[], today: string)` —
  evidence assembly only, no pass/fail scoring (whether participation
  "recurs across review cycles" is the owner's judgment at review):
  `{count, firstDate, lastDate, distinctVenues, last30Days, last90Days}`
  (the last two are counts of entries dated within 30/90 days of `today`;
  `firstDate`/`lastDate` null when the log is empty).
- `challengeState(entries: ParticipationEntry[], externalCalibration: IntentionNode)`
  — `{logged: ParticipationEntry[], externalReading: string | null, externalGap: string | null}`:
  the entries carrying a non-null `challenge`, alongside
  `strategy-external-calibration`'s current `reading` and `gap` verbatim. No
  boolean routed/unrouted heuristic — whether a specific logged challenge has
  been recorded on that strategy is the owner's call; the report (Unit 2)
  prints the two facts side by side with an advisory.
- Unit tests in `packages/intentionsutil/test/participation.test.ts` over
  fixture nodes (never the live store): absent attribute; empty list;
  well-formed entries out of order (returned sorted); malformed shapes
  (non-array attribute, missing `venue`, non-string `date`, missing
  `challenge` → null); `participationSummary` window counts at the 30/90-day
  boundaries and the empty-log shape; `challengeState` with and without
  logged challenges.

Out of scope: any write path; any network; registering in
`packages/intentionsutil/scripts/read-sensors.ts` (its default registry
serves a different sensor shape); scoring or thresholding the recurrence
judgment.

## Unit 2 — review script (`packages/intentionsutil/scripts/participation-review.ts`)

**Recommended model:** sonnet

Dependencies: Unit 1.

Scope — new `packages/intentionsutil/scripts/participation-review.ts`:

- Header comment documents the run form
  (`npx tsx packages/intentionsutil/scripts/participation-review.ts`), the
  report-only posture, and the log-append recipe for the author: dump via
  `packages/intentionsutil/scripts/dump-node.ts`, append the entry to
  `attributes.participation_log` in the JSON, rewrite via
  `packages/intentionsutil/scripts/write-node.ts`, land via
  `packages/intentionsutil/scripts/graph-commit`.
- Resolves the repo root from its own file location, never cwd (the exact
  pattern at `packages/intentionsutil/scripts/office-hours-select.ts:36-40`),
  and reads nodes via `readNode` from `../src/store.js`
  (`packages/intentionsutil/src/store.ts:110`).
- Reads `strategy-join-existing-practice` and `strategy-external-calibration`
  and prints: the participation entries (date, venue, activity, challenge
  marker); the `participationSummary` block (today =
  `new Date().toISOString().slice(0, 10)`); the logged challenges next to
  `strategy-external-calibration`'s current `reading`/`gap` verbatim, with an
  advisory when any challenge is logged (confirm each is recorded on
  `strategy-external-calibration` as a dated clarification — that is what
  "reaches" means, per the strategy's 2026-07-11 clarification); and the
  owner attestation instructions (stamp `reading`/`gap` on
  `intentions/strategy-join-existing-practice.md`; round completion also
  stamps `rounds` — see `tactic-join-indieweb`'s parked recommendation).
- An empty log is a valid report ("no participation recorded yet — the
  reading is honestly zero"), exit 0. Malformed log entries print in a
  `MALFORMED` section and exit 1 (clear errors over fallbacks,
  `.claude/rules/code-style.md` — a corrupted log must not silently
  under-read). A missing node file throws (store `readNode` already does).

## Reuse

- `packages/intentionsutil/src/store.ts:110` — `readNode`.
- `packages/intentionsutil/src/schema.ts` — `IntentionNode`.
- `packages/intentionsutil/scripts/audit-publishing.ts` — report-only
  instrument posture, `errMessage` helper, exit-code convention.
- `packages/intentionsutil/scripts/office-hours-select.ts:36-40` — repo-root
  resolution from `import.meta.url`.
- `packages/intentionsutil/src/attention.ts` — defensive `attributes`
  boundary-parsing posture.
- `packages/intentionsutil/test/attention.test.ts` /
  `packages/intentionsutil/test/schema.test.ts` — fixture-node test style.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
node --import tsx/esm packages/intentionsutil/scripts/participation-review.ts
```

The `--project` name is the workspace dir `packages/intentionsutil` — the
bare `intentionsutil` form matches no project (verified against
`vitest.config.ts:14-18`, which names projects by workspace dir). Against the
live store today the script reports an empty log, quotes
`strategy-external-calibration`'s zero reading, and exits 0. Typecheck:
`.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app
packages/intentionsutil`.

## needs-main residue

QA (PR #2873) disposition-classified this item `needs-main` — a documented
planned deferral, not a defect. Verified downstream, not at this PR's merge.

- id: 8
  title: Actual non-null strategy reading is out of scope for this instrument PR
  url_path: current
  expected_outcome: This PR is not expected to produce a non-null reading on
    strategy-join-existing-practice — it delivers the parser/summary module
    and report script only. Producing a real reading is deferred by design
    and must not be treated as a failing acceptance criterion here.
  finding: Producing an actual non-null reading/gap on
    strategy-join-existing-practice requires real off-repo participation,
    which the sibling tactic tactic-join-indieweb (blocked_by this tactic)
    logs. This instrument-only PR intentionally stops at the report script;
    strategy-join-existing-practice.reading remains null after this PR by
    design, per this tactic's own rationale and Context section. Verifiable
    post-merge only by confirming strategy-join-existing-practice.reading is
    still null and no code in this PR attempts to write it (the report
    script's `readNode`-only, no-write posture, confirmed structurally by QA:
    `git diff --name-only origin/main...HEAD` touches no `intentions/` path).
