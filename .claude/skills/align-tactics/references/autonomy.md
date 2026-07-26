# Autonomy contract — park conditions and framing

`/align-tactics` runs to completion without user interaction. It parks to
`office_hours` — never `AskUserQuestion` — under `/plan-issue`'s three
conditions:

- **Requirement ambiguity** — a strategy term or clarification has multiple
  plausible readings that would change the decomposition.
- **Major scope deviation** — the minimum round to validate the signal
  deviates substantially from what the strategy's recorded substance
  implies.
- **Unverifiable blocker** — a `blocked_by` precondition or drift signal
  that cannot be resolved from the graph alone.

These three are the general categories; concrete instances elsewhere in
this skill park under them rather than introducing separate triggers — the
round-cap park (the eligibility sanity check inside the Workflow's drift
phase: no fresh reading exists to resolve whether another round is
warranted — an unverifiable blocker) and both sides of drift review (a
failed or newly material condition — scope deviation or an unresolvable
blocker depending on which side fired). Treat every park in this skill as
an instance of one of the three; do not read the list as
exhaustive-by-enumeration and treat a same-category park elsewhere as
out-of-contract.

## Mechanism

To park, set `office_hours: {reason, since}` on the affected node (the
strategy for a strategy-wide block; the specific tactic for a tactic-local
one) via `write-node.ts` and land it with `graph-commit` — see
`references/write-path.md` for the write mechanics. `since` is `date -u
+%Y-%m-%d` (never hand-guessed). The `reason` carries the specific question
or deviation so the office-hours queue tells the author exactly what
decision is needed — the graph analog of `/plan-issue`'s
`dispatch-mark-deviation` reason string. An interactive session's later
commit touching the node clears the park
(`intentions/tactic-graph-native-dispatch.md` §1.3). Do **not** call
`AskUserQuestion` as the escalation mechanism — parking is the whole
autonomy contract.

## Park-time recommendation (strategy clarification 30 / condition 6)

Every park writes recoverable context **at park time** — `reason` plus a
best-next-steps recommendation for the human — because session
attach/resume is not a supported recovery path; a park whose full context
lives only in this session's transcript is itself a defect. This binds
every park in this skill, escalation and born-parked (tactics and
copy-approval gates the Workflow emits with `office_hours` set) alike.

Transitional note: a first-class `office_hours.recommendation` field is
planned (`tactic-office-hours-graph-entry` Unit 1 /
`tactic-phase-skill-node-targets` Unit 2 — shared, skip whichever lands
second) but is not yet in `schema.ts`, so `write-node.ts` rejects that key
today. Until it validates, carry the recommendation **inside** the `reason`
string as a labelled trailing sentence (e.g. `"...Recommend: <next
step>."`) — never drop it — and switch to the dedicated field once it
lands.

## Unrecorded-context park framing (strategy clarification 31 / condition 7)

When a decomposition or re-evaluation cannot proceed because needed context
simply is not in the graph, name the gap in the park reason as a
**record-completeness defect** of the `/align-strategy` round that produced
the strategy — not something this session should guess at. The fix is an
author `/align-strategy` pass to complete the record, and the park reason
should say so explicitly.
