---
id: tactic-calibration-event-registry
kind: tactic
statement: Author the calibration-event registration convention into
  strategy-external-calibration's node body — qualification test, record shape,
  disposition path, and reading-update rule
owner: ai
status: codified
parent: null
rationale: "The strategy's sensor is owner review at office-hours and its
  reading already exists (zero events), but there is no defined place or shape
  for a challenge to land when one arrives — registration is this strategy's own
  recorded function ('soliciting and registering challenges'). This tactic buys
  the round's instrument: a settled-mechanism section in the strategy's markdown
  body (the home kind-strategy's body rule assigns to settled design and
  mechanism notes) that makes owner review deterministic — an arriving challenge
  has a defined record, a defined disposition, and a defined effect on the
  strategy's reading. Round 1 of /align-tactics, 2026-07-11."
reading: null
gap: null
serves:
  - strategy-external-calibration
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-calibration-event-registry
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: 62d71ed52ab675485474ed69e3c22ced46d2c99ecece2cfec92f79236fa6b89b
  fix: null
  completion: null
validates:
  - strategy-external-calibration
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Author the calibration-event registration convention into strategy-external-calibration's node body — qualification test, record shape, disposition path, and reading-update rule

## Context

`strategy-external-calibration` owns the graph's calibration function:
soliciting and registering challenges from people with no stake in this
graph's delegations, and letting a challenge actually move a priority. Its
`success_signal.observable` is "external calibration events — a practitioner
or peer challenge that actually alters a priority or a delegation assessment";
the sensor is "owner review at office-hours"; the current reading is "zero
external calibration events to date". The sensor can count zero, but when a
challenge arrives there is today no defined place for it to land, no test for
whether it qualifies, and no rule for how it moves the strategy's reading —
so an event could occur and still fail to register, which is exactly the
failure a self-audited calibration signal cannot afford.

This tactic writes the registration convention as a settled-mechanism section
in the strategy node's markdown body. `intentions/kind-strategy.md` (the
"What does a strategy node's markdown body carry?" clarification) assigns
settled design and mechanism notes to the body, and no frontmatter substance
field changes — `statement`, `clarifications`, `attributes.conditions`,
`serves`, `success_signal`, `tooling_goals` are all untouched, so the
strategy's `strategyFingerprint`
(`packages/intentionsutil/src/router.ts:82-91`) does not move and no open
tactic freezes.

Constraint carried from the strategy's 2026-07-11 clarification: while tiers
2 and 3 of `strategy-progressive-validation` are not entered, intake is
author-mediated only — the convention must NOT add any public call-for-
challenges surface (no README, landing, or blog copy; no CTA). The author
carries challenges home from ungated community participation
(`strategy-join-existing-practice`) and registers them at office-hours.

## Unit 1 — the "Calibration events" body section

**Recommended model:** opus

**Scope:** Edit exactly one file, `intentions/strategy-external-calibration.md`
— append a `## Calibration events` section to the markdown body (everything
after the closing `---` fence; the body today is only the H1 title line).
Write it as operational doctrine the author applies at office-hours, covering
these four elements:

1. **Qualification test** — a challenge counts as external only when its
   source holds no stake in this graph's delegations (the `delegation-*.md`
   records): not the author, not the audited vendor's models
   (`delegation-anthropic-claude`), not anyone whose income or platform
   depends on a recorded delegation. Challenge surface is broad per the
   strategy's rationale: a priority (attention/rank), a node's framing, or an
   other-directed method under `virtue-respect-for-persons` (e.g. an outside
   report that an artifact locks people in).
2. **Record shape** — an arriving challenge is registered as a dated
   `clarifications` entry on the *challenged node*: `question` carries the
   challenge as near verbatim as the medium allows plus source attribution
   (person or community, and why they are zero-stake); `answer` carries the
   office-hours disposition, ending with the provenance sentence convention,
   e.g. `"...Recorded YYYY-MM-DD office-hours (external calibration event)."`
   Clarification edits are substance — they change the challenged strategy's
   fingerprint and trigger the router's re-evaluation of its open tactics —
   and that is correct behavior for a challenge that moves something, so the
   convention should state it rather than dodge it.
3. **Disposition rule** — the event counts toward the signal only when the
   challenge actually alters a priority (a `serves`/`parent`/`blocked_by`
   re-rank, a condition edit, an amendment or retirement of a strategy) or a
   delegation assessment (an edit to a `delegation-*.md` record). A declined
   challenge is still registered — as a dated clarification on
   `strategy-external-calibration` itself recording the challenge and why it
   was declined — but does not count toward the signal. Registration of
   declines is deliberate: a calibration function that only records wins is
   self-flattering.
4. **Reading-update rule** — each counted event updates
   `strategy-external-calibration`'s `reading` (running count plus a one-line
   summary of the latest event and what it altered), and `gap` re-derives
   against the threshold ("events occur at all, then recur across review
   cycles once a practitioner tier exists"). State writes go through
   `packages/intentionsutil/scripts/write-node.ts` (full node JSON on stdin
   or `--file`; it preserves the markdown body) and land via
   `packages/intentionsutil/scripts/graph-commit` — never hand-edited YAML.

Also state the intake constraint from Context: author-mediated intake only
while tiers 2/3 are un-entered; no public solicitation surface is part of
this convention.

**Out of scope:** any change to the strategy's frontmatter (including
`reading`/`gap` — state writes stay sensor-owned); any schema change
(`packages/intentionsutil/src/schema.ts`); any mechanical sensor registration
(`packages/intentionsutil/scripts/read-sensors.ts` — the declared sensor is
owner review, not a script); any edit to the top-level README, landing, blog,
or `intentions/README.md`; any GitHub issue or label.

**Dependencies:** none.

## Reuse

- The provenance-sentence convention already used across `clarifications`
  entries graph-wide (e.g. `intentions/strategy-external-calibration.md`'s
  existing clarifications).
- `intentions/kind-strategy.md` — cite its body-semantics clarification as
  the authority for the section's placement.
- `packages/intentionsutil/scripts/write-node.ts` and
  `packages/intentionsutil/scripts/graph-commit` — named by the convention as
  the write path; do not build new tooling.

## Verification

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts
```

Manual: read the new `## Calibration events` section and confirm it covers
all four elements (qualification, record shape, disposition, reading update)
plus the author-mediated-intake constraint; confirm `git diff` touches only
the markdown body of `intentions/strategy-external-calibration.md` below the
closing `---` fence (frontmatter byte-identical), so the strategy fingerprint
is unchanged.
