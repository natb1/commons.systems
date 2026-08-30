---
id: tactic-attention-surface-firestore-retire
kind: tactic
statement: retire the hosted Firestore owner tier — office-hours owner data goes
  fully local-first
owner: ai
status: codified
parent: null
rationale: "The threshold terminal: the strategy's threshold is met when the
  ritual runs on the redesigned surface and the hosted Firestore owner tier is
  retired. Consumes the parallel legacy-lane migration output rather than
  duplicating it (strategy rationale) — the plan's step 0 is a
  consume-don't-duplicate check."
reading: null
gap: null
serves:
  - strategy-attention-surface
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates:
  - strategy-attention-surface
blocked_by:
  - tactic-attention-surface-status-page
  - tactic-attention-surface-goals-page
  - tactic-attention-surface-velocity-pace
  - tactic-attention-surface-instrument
  - tactic-attention-surface-analytics-collector
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# retire the hosted Firestore owner tier — office-hours owner data goes fully local-first

## Context

The threshold terminal: the strategy's threshold is met when the
office-hours ritual runs on the redesigned surface and the hosted
Firestore owner tier is retired — all owner data local-first. The legacy
gh lane has been migrating office-hours off hosted Firestore in parallel
(strategy rationale: this strategy consumes its output rather than
duplicating it), so the first step is a consume-don't-duplicate check.
This also discharges the strategy's `recovers: delegation-firebase` edge
for the office-hours surface.

## Unit 1 — retire owner Firestore reads

**Recommended model:** opus

Scope:
- Step 0 (consume, don't duplicate): survey what the legacy lane already
  merged — `git log --oneline -- office-hours/src/local-snapshot-source.ts
  office-hours/src/firebase.ts` plus open PRs touching office-hours
  local-first — and rescope this unit to the residual only.
- Remove the Firestore owner read tier: `office-hours/src/firebase.ts`
  and the Firestore paths in `office-hours/src/data.ts` and the panel
  data modules; the owner tier reads exclusively through FSA sources
  (`graph-source.ts` + the share adapters). The demo tier (build-time
  seed plugins) stays.
- Producer: retire `office-hours-snapshot/src/capture-firestore.ts` in
  favor of locally computed inputs, if the legacy lane has not already.
- Functions: delete the `collectProjectSignals` scheduled function
  (`functions/src/project-signals.ts` + its `project-signals-core.ts`
  copy) — superseded by the local collector
  (`tactic-attention-surface-analytics-collector`, strategy
  clarification 8) — and its Firestore collections' owner-read wiring.
- Out of scope: Firestore rules/functions used by other apps; deleting
  the Firebase project or billing config.

## Dependencies

- `tactic-attention-surface-status-page`,
  `tactic-attention-surface-goals-page`,
  `tactic-attention-surface-velocity-pace`,
  `tactic-attention-surface-instrument`,
  `tactic-attention-surface-analytics-collector` — every owner data path
  must be local-first (including analytics collection), and the audit
  sensor must exist to observe the flip.

## Reuse

- `office-hours/src/local-snapshot-source.ts` and the flag-gated
  local-tier wiring the legacy lane already landed.

## Verification

```verify
npx vitest run --project office-hours --root . || exit 1
npx vitest run --project office-hours-snapshot --root .
```

Manual: run the owner ritual end-to-end with network access blocked
except localhost — no Firestore traffic; re-run the audit sensor — the
Firestore term drops out of the strategy's `gap`.

## Implementation notes

Single unit; subagent with `model: opus`; supply this Context and Scope;
constrain to working-tree edits.
