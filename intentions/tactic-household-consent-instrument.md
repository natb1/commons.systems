---
id: tactic-household-consent-instrument
kind: tactic
statement: "Instrument: household-shared marking and consent log on delegation
  records, plus a consent report the office-hours review runs"
owner: ai
status: codified
parent: null
rationale: Round-1 instrument for strategy-household-shared-attachments (reading
  null — a strategy that cannot be measured must first buy its own instrument,
  align-tactics clarification 3). The recorded sensor is owner review at
  office-hours over the delegation records, but today no record says which
  delegations the household jointly holds, no record has a home for consent or
  objection state, and nothing enumerates the recovery/re-alignment moves
  (strategies' recovers edges) touching shared attachments — so the review
  cannot produce a reading at threshold granularity. This tactic gives the
  records a household block (marking proposals seeded from record evidence;
  consent entries household-voiced only) and a report the review works from.
  Marking ratification and the consent conversation stay human
  (tactic-household-consent-offering). Recorded 2026-07-11 /align-tactics round.
reading: null
gap: null
serves:
  - strategy-household-shared-attachments
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-household-consent-instrument
  pr: 2864
  attempts: {}
  markers:
    - qa-done
    - reviewed
  strategy_fingerprint: d1dccff612b79832f9a7a1ef5dad00207ffc8ff8dab1e7275a2c9e4a64b639f0
validates:
  - strategy-household-shared-attachments
blocked_by: []
office_hours:
  reason: "Graph-tick review worker cannot run /review-fix: the skill Step 2
    requires the Workflow tool (fans out finder/verify/Opus-fix agents over
    .claude/workflows/review-fix.js) and that tool is absent from the graph-tick
    execution context (not in base toolset, deferred list, or ToolSearch). The
    skill DOES accept node targets, so this is not
    skill-node-target-unsupported; it is a mechanical tooling-environment gap.
    Inline scans already ran clean: CodeQL 0 open alerts, erosion 0 findings,
    deps=false (no dep audit), surface=code app_or_rules=true. PR #2864, CI
    passing; diff = delegation-record frontmatter household markings + new
    packages/intentionsutil/scripts/household-consent-report.ts + tests. Next
    steps: run /review-fix tactic-household-consent-instrument in a full
    interactive session (which has the Workflow tool), then run
    dispatch-propagate/scripts/transition-node
    tactic-household-consent-instrument --set-pr 2864, then MANUALLY clear this
    office_hours block (no unpark primitive exists)."
  since: 2026-07-12
  recommendation: "Complete the review in a full interactive session that provides
    the Workflow tool: invoke /review-fix tactic-household-consent-instrument,
    let it run its finder/classify/verify/fix fan-out and post its PR comment,
    then it (or you) runs transition-node --set-pr 2864 to record the reviewed
    marker. Finally clear office_hours by hand (edit via graph-commit) since
    there is no unpark primitive."
pace_exempt: false
rounds: null
attributes: {}
---
# Instrument: household-shared marking and consent log on delegation records, plus a consent report the office-hours review runs

## Context

`strategy-household-shared-attachments`' success signal is: observable
"recovery or re-alignment moves touching shared attachments carry recorded
household consent"; sensor "owner review at office-hours over the delegation
records"; threshold "no shared attachment is migrated or re-aligned without
recorded consent, and no household objection is routed around". The reading
is null and the sensor has no runnable surface: none of the 21
`kind: delegation` records says whether the household jointly holds it, no
record has a home for consent or objection state, and nothing enumerates the
moves (strategies' `recovers` edges into delegation records) that touch
shared attachments. This tactic buys the instrument. The 2026-07-11 strategy
clarification fixes the design frame: household state lives on the delegation
record itself (`attributes.household`); consent and preference entries are
recorded only from the household's own voice — this tactic seeds marking
*proposals* with evidence, never consent; ratification is
`tactic-household-consent-offering` (born-parked, blocked on this tactic).

Boundary with in-flight siblings (both `phase: implement`, unmerged — do not
depend on their code, they may land before or after this):
`tactic-exercised-paths-reading` registers a sensor named "the delegation
records themselves" with a `--report` mode over exercise state (serves
`strategy-exercise-recovery-paths`); `tactic-ledger-census` builds an
entry-date census (serves `strategy-complete-ledger`). All three enumerate
delegation records but report different functions; none supersedes another.
No registry `Sensor` is needed here: the recorded sensor is the owner review
itself, so the instrument is a report the review works from (the
`tactic-durability-audit-instrument` precedent), not a `readFrontierSensors`
registration.

## Unit 1 — household field doctrine + proposed markings

**Recommended model:** opus

Implement in a subagent (`model: opus`), working-tree edits only, passing
this unit's context and scope in the prompt.

Scope:

- Append one entry to `intentions/kind-delegation.md`'s `attributes.fields`
  list documenting the optional field: `household: {shared: boolean, basis:
  <evidence for the marking>, consent: [{date, move, decision}], preferences:
  [<household-voiced platform preferences or objections>]}` — an absent block
  means not yet assessed; consent/preference entries carry only the
  household's own voice, never session inference. Edit via
  `packages/intentionsutil/scripts/write-node.ts` (full node JSON —
  `readNode` the current node, append to `attributes.fields` in memory,
  re-write; the markdown body is preserved), run as `node --import tsx/esm
  packages/intentionsutil/scripts/write-node.ts --file <json>`. Never
  hand-edit the YAML.
- Assess **every** `kind: delegation` record (21 today — enumerate with
  `listNodes`, `packages/intentionsutil/src/store.ts:137`, or
  `grep -l '^kind: delegation$' intentions/*.md`) and seed
  `attributes.household` on each: `shared: true|false` plus a one-sentence
  `basis` citing the record's own rationale/body evidence, `consent: []`,
  `preferences: []`. Explicit `shared: false` (with basis) on non-shared
  records, so an absent block stays meaningful (= unassessed) for later
  ledger additions. Same write path as above (write-node.ts per record;
  bodies are preserved).
- Marking discriminator: does the household jointly hold the delegation —
  would a migration or re-alignment change family members' access or daily
  workflow? Evidence-based starting points (the implementing session judges
  each record's full rationale and body, and may conclude differently):
  `delegation-app-signin-identity` (its rationale says sign-in is the only
  path to household-shared media and every member needs a GitHub account —
  shared), `delegation-media-libraries` (family photos/streaming),
  `delegation-communications` (family messaging), `delegation-cloud-backup`
  (Drive shared drives hold the household budget archive),
  `delegation-banking`, `delegation-finance-saas` (household budget,
  memberEmails), `delegation-connectivity` (home ISP),
  `delegation-mobile-platform`, `delegation-health-records` (family health)
  — plausibly shared; developer/project-side records (`delegation-github`,
  `delegation-firebase`, `delegation-anthropic-claude`,
  `delegation-client-income`, `delegation-philosophical-articulation`,
  `delegation-web-analytics`, `delegation-hosted-publishing`,
  `delegation-social-publishing`) — plausibly author-only. These are
  proposals: final ratification is the born-parked offering gate's, so a
  wrong guess costs an author amendment, not a consent violation.
- Out of scope: writing any `consent` or `preferences` entry (household
  voice only, recorded at office-hours); editing any record's markdown body;
  changing `packages/intentionsutil/src/schema.ts` (`attributes` is already
  free-form).

## Unit 2 — household consent report + tests

**Recommended model:** sonnet

Dependencies: Unit 1.

Implement in a subagent (`model: sonnet`), working-tree edits only.

Scope:

- New `packages/intentionsutil/scripts/household-consent-report.ts`, run as
  `node --import tsx/esm
  packages/intentionsutil/scripts/household-consent-report.ts` (no build
  integration; resolve the intentions dir from `import.meta.url` like the
  sibling scripts in `packages/intentionsutil/scripts/`, never from cwd). No
  Firestore, no network: local store reads only.
- Reads all nodes via `listNodes`
  (`packages/intentionsutil/src/store.ts:137`). For each delegation record
  with `household.shared: true`, print a markdown section: id, basis, the
  moves touching it — every `kind: strategy` node whose `recovers` includes
  the record id — each move's consent entry (matched from
  `household.consent`) or a `NO RECORDED CONSENT` line, and the recorded
  `preferences`. Then one line each for `shared: false` records, and an
  unassessed prompt list for records with no `household` block.
- Summary footer against the strategy threshold: count of moves touching
  shared records without a recorded consent entry (the review's attention
  list), plus a note that re-alignment moves not carried as `recovers` edges
  are enumerated by the reviewing owner.
- Validate the `attributes.household` shape at the read boundary and fail
  with a clear error naming the malformed record
  (`.claude/rules/code-style.md` — clear errors over fallbacks). An absent
  block = unassessed, never an error.
- Tests: vitest coverage in `packages/intentionsutil` over fixture nodes in
  a temp-dir store (the pattern existing store tests use): a shared record
  with a consent entry covering a `recovers` move, a shared record with an
  uncovered move (asserts the `NO RECORDED CONSENT` count), an explicit
  `shared: false` record, an unassessed record, and a malformed `household`
  block (asserts the clear-error path).

## Reuse

- `listNodes`, `readNode`, `writeNode`
  (`packages/intentionsutil/src/store.ts:137`, `:110`, `:40`).
- `packages/intentionsutil/scripts/write-node.ts` — the single validation
  gate for every record edit in Unit 1.
- `packages/intentionsutil/scripts/dump-node.ts` and sibling scripts as the
  `import.meta.url` path-resolution exemplar.

## Verification

```verify
npx vitest run --project intentionsutil --root .
```

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts
```

Manual: run `node --import tsx/esm
packages/intentionsutil/scripts/household-consent-report.ts` from the
worktree root — confirm every delegation record appears exactly once (shared
section, not-shared line, or unassessed prompt), that
`delegation-finance-saas` and `delegation-knowledge-notes` (if marked shared)
show their in-flight recovery strategies (`strategy-recover-finance`,
`strategy-recover-knowledge`) as moves with `NO RECORDED CONSENT`, and that
the summary counts match. Confirm `intentions/kind-delegation.md` lists the
new `household` field and that no record body changed (`git diff --stat`
shows frontmatter-only edits on delegation records).
