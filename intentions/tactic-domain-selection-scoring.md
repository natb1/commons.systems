---
id: tactic-domain-selection-scoring
kind: tactic
statement: Draft the 2026-07 domain-selection scoring dossier — score every raw
  delegation record against strategy-domain-selection's four criteria, with a
  select-or-defer draft recommendation per record
owner: ai
status: codified
parent: null
rationale: "Minted 2026-07-11 by the /align-tactics round on
  strategy-domain-selection as the round's instrument tactic: the strategy's
  reading is null and its sensor is owner review at office-hours, which has
  never fired because no scorable dossier has ever been put in front of the
  owner. This tactic drafts that dossier from the raw records' recorded axes; it
  drafts, never decides — the select-or-defer decision is
  tactic-domain-selection-owner-review (born-parked, blocked_by this tactic),
  which is the round's validates-terminal."
reading: null
gap: null
serves:
  - strategy-domain-selection
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-domain-selection-scoring
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: e8bfd621082c91d5522fdde6bc85a01b86434ba41050391283992af28154c21f
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Draft the 2026-07 domain-selection scoring dossier — score every raw delegation record against strategy-domain-selection's four criteria, with a select-or-defer draft recommendation per record

## Context

`strategy-domain-selection`'s success signal requires every raw delegation
record scored against its four selection criteria each review cycle (threshold:
"no raw record sits unscored across a review cycle"). Its `reading` is null —
the sensor ("owner review at office-hours") has never fired, because nothing
has ever put a scorable dossier in front of the owner. This tactic is the
2026-07 round's instrument: it drafts the scoring dossier that makes the owner
review runnable. The owner decision itself is
`tactic-domain-selection-owner-review` (born-parked, `blocked_by` this tactic);
this tactic drafts, never decides. Scope derivation is the strategy's
clarification 1 (recorded 2026-07-11): every `kind: delegation` record at
`status: raw` at round time — not the rationale's standing-candidates snapshot.

## Units of work

### Unit 1 — author the scoring dossier into this node's body

**Scope**: Append a `## Scoring dossier — 2026-07 round` section to this node's
own body (`intentions/tactic-domain-selection-scoring.md`, below
`## Verification`). The diff is this one file — a state-only intentions write.

- Enumerate the in-scope records at implement time with
  `grep -l '^status: raw' intentions/delegation-*.md` — re-derive, do not trust
  this planning-time list. As of 2026-07-11 that is 8 records:
  `delegation-banking`, `delegation-cloud-backup`, `delegation-communications`,
  `delegation-connectivity`, `delegation-health-records`,
  `delegation-media-libraries`, `delegation-mobile-platform`,
  `delegation-web-analytics`.
- Open the dossier with a short preamble: the scope rule (status `raw` at round
  time, per strategy clarification 1) and the status-excluded records with
  their one-line reasons (`delegation-client-income` — refining, non-software
  recovery, strategy minted directly 2026-07-02; `delegation-knowledge-notes`
  — refining, selected 2026-07-02 into strategy-recover-knowledge).
- Per record, a `### <delegation-id>` subsection with exactly four criterion
  lines and one draft line:
  - The four criteria, from `intentions/strategy-domain-selection.md`'s
    rationale (quote its bold lead questions, don't paraphrase): (1) where is
    institutional dependency most painful for the author — business-model
    misalignment visible to the author; (2) where has agentic coding shifted
    the cost-benefit for problems the author faces; (3) where can autonomy
    plausibly be recovered — local-first viable, commoditized tech over
    network effects, open standards, no institutional coordination required
    at scale; (4) where is the demonstration most legible because the author
    genuinely uses it.
  - Score each criterion `strong` / `moderate` / `weak` / `absent`, with a
    one-sentence evidence cite drawn from the record's own frontmatter
    (`attributes.divergence`, `attributes.irreversibility`,
    `attributes.classification`, `rationale`) — the records carry first-pass
    axes precisely so this scoring needs no re-research.
  - A closing line: `Draft: select — <the recovery shape a minted strategy
    would own>` or `Draft: defer — <reason>; interim path: <the record's
    recorded interim path, if any>` (e.g. strategy-realign-attachments for
    delegation-communications; right-of-access exports for
    delegation-health-records). A deferral must be explicit and name its
    interim path where the record has one — never silent.
- Out of scope: any edit to the delegation records, to
  `strategy-domain-selection`, or to `tactic-domain-selection-owner-review`;
  any actual select/defer decision (drafts only — the owner decides at the
  review tactic); minting recovery strategies; re-assessing the records' own
  divergence/irreversibility axes.

**Recommended model**: opus

## Reuse

- The delegation records' recorded axes (`attributes.divergence`,
  `attributes.irreversibility`, `attributes.classification`) as the whole
  evidence base — `intentions/delegation-*.md`; no re-research.
- The criteria text: `intentions/strategy-domain-selection.md` rationale.
- Draft-then-ratify pattern reference:
  `intentions/tactic-readme-copy-approval.md` (born-parked gate) with the
  draft carried in the blocked tactic's body.

## Verification

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Prose checks: every record returned by
`grep -l '^status: raw' intentions/delegation-*.md` appears exactly once in the
dossier; each entry carries all four criterion lines and exactly one `Draft:`
line; every `Draft: defer` on a record with a recorded interim path names that
path; the diff against the merge base touches only
`intentions/tactic-domain-selection-scoring.md`.
