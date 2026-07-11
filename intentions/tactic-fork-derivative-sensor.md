---
id: tactic-fork-derivative-sensor
kind: tactic
statement: Fork-and-derivative sensor — enumerate repo forks with activity data
  into the office-hours snapshot and render them for the fork-and-derivative
  review
owner: ai
status: codified
parent: null
rationale: "Instrument tactic for strategy-distribute-workflow's null reading:
  the sensor is 'fork and derivative review at office-hours', but the
  office-hours dashboard carries only a fork COUNT
  (office-hours-snapshot/src/project-signals-core.ts GithubSignals.forks) — a
  count cannot discriminate a drive-by fork from an active derivative, and the
  review has no fork identity/activity to look at. This tactic enumerates forks
  (owner, url, created/pushed dates) into the snapshot's GitHub signals and
  renders them on the dashboard's project-signals surface, making the review
  runnable. Derivatives that are not GitHub forks arrive as reports and are
  recorded by the author directly on the strategy node at review time — no new
  mechanism needed. Serves attention-surface too because the artifact extended
  (the local snapshot producer and dashboard) is that strategy's."
reading: null
gap: null
serves:
  - strategy-distribute-workflow
  - strategy-attention-surface
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-fork-derivative-sensor
  pr: 2861
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
validates:
  - strategy-distribute-workflow
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Fork-and-derivative sensor — enumerate repo forks with activity data into the office-hours snapshot and render them for the fork-and-derivative review

## Context

strategy-distribute-workflow's `reading` is null and its sensor is "fork and
derivative review at office-hours". Today that review cannot run: the
office-hours snapshot carries only a fork **count**
(`office-hours-snapshot/src/project-signals-core.ts:33`,
`GithubSignals.forks`), and a count cannot discriminate a drive-by fork from
an active derivative. The review needs fork identity and activity in front of
it. This tactic enumerates the repo's forks (owner, url, created/pushed
dates, stars) into the snapshot's GitHub signals and renders them on the
office-hours dashboard's project-signals surface.

Derivatives that are not GitHub forks arrive as reports; the author records
them (and the resulting reading) directly on strategy-distribute-workflow at
review time — that recording is out of scope here, this PR only makes the
evidence visible.

The artifact extended is strategy-attention-surface's local snapshot
producer + dashboard, hence the multi-entry `serves`. Do **not** extend
`functions/src/project-signals-core.ts` — that copy is scheduled for
deletion by tactic-attention-surface-firestore-retire; the producer's copy
at `office-hours-snapshot/src/project-signals-core.ts` is the one to change.

Implement each unit in a subagent launched with the unit's recommended model
(Agent/Task tool, `model: sonnet` or `model: opus`), passing the unit's
context and scope; constrain it to working-tree edits.

## Units of work

### Unit 1 — producer: fork enumeration into GithubSignals

Recommended model: opus

Scope:
- `office-hours-snapshot/src/project-signals-core.ts:30-46` — extend
  `GithubSignals` with an optional `forksDetail?: Array<{ owner: string;
  repoUrl: string; createdAt: string; pushedAt: string; stars: number }>`,
  optional in the same style as `traffic` (`:35-45`): omitted on fetch
  failure, public stats still emitted.
- `office-hours-snapshot/src/gh-fetchers.ts:337` (`fetchGithub`, the gh
  adapter for `collectProjectSignalsCore`) — add a forks fetch via
  `ghRest` (`gh-fetchers.ts:122`):
  `repos/${repo}/forks?sort=newest&per_page=100`, mapped to `forksDetail`
  (fields `owner.login`, `html_url`, `created_at`, `pushed_at`,
  `stargazers_count`). On any error, omit the key — mirror the traffic
  error-tolerance at `gh-fetchers.ts:351-356`. One page (100) is enough;
  the total count already rides `forks`.
- `office-hours-snapshot/src/parity.ts` — check how `--parity` compares the
  local snapshot to live Firestore: if the comparison is field-exact, exclude
  `forksDetail` (a local-only field the hosted producer never emits) from
  the parity diff rather than mirroring it into the doomed functions copy.
- Tests: `office-hours-snapshot/src/gh-fetchers.test.ts` (mapping + error
  omission), `office-hours-snapshot/src/produce.test.ts` (snapshot carries
  `forksDetail` through `produceSnapshot`), and `parity.test.ts` if the
  parity exclusion is touched.

Out of scope: `functions/src/**` (surface scheduled for deletion), the
dashboard (Unit 2), recording readings on the strategy node.

### Unit 2 — dashboard: render the forks list for the review

Recommended model: sonnet

Dependencies: Unit 1.

Scope:
- `office-hours/src/project-signals.ts:21-33` — mirror the optional
  `forksDetail` field on the wire-shape interface, and parse it in
  `parseGithubSignals` (`:82-115`) with the same defensive guards (invalid
  entries dropped, key omitted when malformed).
- `office-hours/src/Dashboard.tsx` (project-signals panel) — render a
  "Forks & derivatives" list under the existing GitHub stats: each fork's
  owner linked to `repoUrl`, created/pushed dates, and an "active" marker
  when `pushedAt > createdAt` (the drive-by discriminator the review needs).
- `office-hours/src/project-signal-seeds.ts` — extend the seed data so the
  panel renders in seed mode.
- Tests: follow the existing panel test pattern
  (`office-hours/src/panel-equality.ts` and neighbors).

## Reuse

- `ghRest` — `office-hours-snapshot/src/gh-fetchers.ts:122`.
- `fetchGithub` adapter — `office-hours-snapshot/src/gh-fetchers.ts:337`.
- Traffic-optionality pattern —
  `office-hours-snapshot/src/project-signals-core.ts:35-45` and
  `gh-fetchers.ts:351-356`.
- Parse-guard style — `office-hours/src/project-signals.ts:82-115`.

## Verification

```verify
npx vitest run --project office-hours-snapshot --root .
npx vitest run --project office-hours --root .
```

Prose: run the producer dry-run (`npx tsx office-hours-snapshot/src/main.ts
--dry-run`, needs an authenticated `gh`) and confirm
`projectSignals.github.forksDetail` appears; load the dashboard in seed mode
and confirm the forks panel renders. The sensor is runnable when the
office-hours review can see fork identity + activity on the dashboard; the
author's recorded reading on strategy-distribute-workflow is the sensor's
output, not part of this PR.
