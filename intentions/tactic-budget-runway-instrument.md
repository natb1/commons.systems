---
id: tactic-budget-runway-instrument
kind: tactic
statement: "budget app: projected-runway readout on the Accounts page — latest
  liquid net worth over trailing monthly spend, in months"
owner: ai
status: codified
parent: null
rationale: "The instrument tactic for strategy-financial-sustainability's null
  reading (strategy-graph-native-dispatch clarification 3: a strategy that
  cannot be measured first buys its own instrument). The sensor's repo-side
  half: the budget app already computes weekly liquid net worth and a trailing
  12-week spend average but surfaces no runway number; this readout makes the
  runway rule readable so the author can take the strategy's first reading. The
  app displays runway months only — the time-to-revenue-self-sufficiency horizon
  stays in the private natb1/office-hours-nate repo and the comparison happens
  at office-hours (strategy clarification 1, 2026-07-11). Minted 2026-07-11
  /align-tactics round."
reading: null
gap: null
serves:
  - strategy-financial-sustainability
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-budget-runway-instrument
  pr: 2851
  attempts: {}
  markers: []
  strategy_fingerprint: 15d0c769ef9971a30ad06f2af1d2c682874e0da4c5d42cbd74c1fe22a322fe85
validates:
  - strategy-financial-sustainability
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# budget app: projected-runway readout on the Accounts page — latest liquid net worth over trailing monthly spend, in months

## Context

`strategy-financial-sustainability`'s success signal reads projected runway —
available funds / trailing monthly spend — against the
time-to-revenue-self-sufficiency horizon, and the strategy has no reading.
The budget app (the sensor, per `strategy-recover-finance`) already computes
both halves of the quotient but surfaces no runway number anywhere:

- `computeNetWorth(transactions, statements, weeks)` at
  `budget/src/balance.ts:785` returns weekly liquid net worth points
  (`NetWorthPoint { weekLabel, weekMs, netWorth, isStatementAnchored }`,
  `budget/src/balance.ts:707`), already invoked on the Accounts page at
  `budget/src/pages/Accounts.tsx:490`.
- `computeAverageWeeklySpending(periods)` at `budget/src/balance.ts:540`
  returns the trailing 12-week average weekly spend (excludes the latest
  incomplete week), already used at `budget/src/pages/budgets.ts:260`.

This tactic is the round's instrument (strategy-graph-native-dispatch
clarification 3): a "Projected runway" metric on the Accounts page, in
months. Deliberately out of scope: any horizon value, threshold, target
line, or comparison coloring — the self-sufficiency horizon lives in the
private `natb1/office-hours-nate` repo, and the author compares at
office-hours (strategy clarification 1, 2026-07-11). The available-funds
numerator is whatever `computeNetWorth` covers (every statement-fed account
in the snapshot); narrowing that set, if the author wants it, is a
follow-up after `tactic-runway-first-reading`, not this PR.

## Units

### Unit 1 — `computeProjectedRunway` in balance.ts

- **Scope**: add a pure function to `budget/src/balance.ts` (near
  `computeCashFlow`, `budget/src/balance.ts:722`):
  `computeProjectedRunway(netWorthPoints: NetWorthPoint[], averageWeeklySpending: number): number | null`.
  Numerator: the latest point's `netWorth` (points arrive in week order —
  the `weeks` input at `budget/src/pages/Accounts.tsx:489` is built from
  the ascending aggregate trend). Denominator: monthly spend =
  `averageWeeklySpending * 52 / 12`. Return `null` when `netWorthPoints`
  is empty or the denominator is `<= 0` — no data yields no metric, never
  `Infinity`/`NaN`. A negative net worth returns the raw negative quotient
  (the UI shows it; do not clamp). Unit tests in
  `budget/test/balance.test.ts`: normal case, empty points, zero spending,
  negative net worth. Out of scope: any UI change.
- **Recommended model**: sonnet
- **Dependencies**: none

### Unit 2 — Accounts page readout

- **Scope**: `budget/src/pages/Accounts.tsx` only. In `useAccountsData`'s
  chart block (`Accounts.tsx:486-500`, where `netWorthPoints` is already
  computed and `periods` is already loaded at `Accounts.tsx:473-478`),
  compute `computeAverageWeeklySpending(periods)` (import from
  `../balance.js` alongside the existing `computeNetWorth` import at
  `Accounts.tsx:30`) and
  `runwayMonths = computeProjectedRunway(netWorthPoints, averageWeeklySpending)`.
  Carry `runwayMonths: number | null` on `LoadedData` (`Accounts.tsx:437-443`;
  when the chart block falls to its error fallback, it is `null`). Render in
  `HeadlineMetrics` (`Accounts.tsx:288-298`): accept `runwayMonths` as a
  prop and, when non-null, append a
  `<Metric label="Projected runway" value={runwayMonths.toFixed(1) + " months"} />`
  entry (the `Metric`/`Card` components from `@commons-systems/ds` are
  already imported at `Accounts.tsx:23`). When `null`, render no runway
  metric — no placeholder, no error state. Extend the existing page test
  `budget/test/pages/Accounts.test.tsx` following its current patterns:
  metric present with seed-shaped data, absent when statements/periods are
  empty. Out of scope: budgets page, home page, any horizon comparison.
- **Recommended model**: sonnet
- **Dependencies**: Unit 1

Implement each unit in a subagent (Agent/Task tool) launched with the unit's
recommended model, supplying this Context and the unit's Scope; the subagent
edits the working tree only.

## Reuse

- `computeNetWorth` — `budget/src/balance.ts:785` (numerator source; already
  called at `budget/src/pages/Accounts.tsx:490`).
- `computeAverageWeeklySpending` — `budget/src/balance.ts:540` (denominator
  source; call it exactly as `budget/src/pages/budgets.ts:260` does).
- `Metric` / `Card` from `@commons-systems/ds` — the `HeadlineMetrics`
  pattern at `budget/src/pages/Accounts.tsx:288-298`.
- Test fixtures/helpers already used by `budget/test/balance.test.ts` and
  `budget/test/pages/Accounts.test.tsx`.

## Verification

```verify
npx vitest run --project budget --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app budget
```

Manual: open the budget app unauthenticated (seed-data view), Accounts page —
the headline card shows "Projected runway" with a plausible months figure
next to Net income / Savings rate / Net change; with no statement data the
metric is simply absent (no `NaN`, no `Infinity`).
