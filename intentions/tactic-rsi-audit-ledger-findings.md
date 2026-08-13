---
id: tactic-rsi-audit-ledger-findings
kind: tactic
statement: Have /rsi-audit land its top-ranked opportunities through
  dispatch-eval-finding instead of leaving them in a markdown report
owner: ai
status: raw
parent: null
rationale: Recorded 2026-08-12 /align round. strategy-recursive-self-improvement
  names a session that leaves findings in prose only as a defect, and the
  audit's ranked opportunities exist only in its report — so a recurring
  fleet-scale opportunity is re-discovered from scratch every audit and
  accumulates no recurrence count.
reading: null
serves:
  - strategy-recursive-self-improvement
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Have /rsi-audit land its top-ranked opportunities through dispatch-eval-finding instead of leaving them in a markdown report

Recorded by the 2026-08-12 `/align` collapse round.

## Scope

Add a closing step to `.claude/skills/rsi-audit/SKILL.md` that lands the
audit's top-ranked opportunities as ledger entries through
`.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding`, using the
same merge-on-similarity discipline the per-phase evaluator uses: read
`--list` first, reuse an existing or retired entry's slug when the finding IS
that finding, and mint only when genuinely new.

Use `--sensor aggregate-usage.sh` for figures the instrument produced, and
`--impact-file` for the measured magnitudes, so a fleet finding carries its own
metrics rather than only prose.

## The contract this must NOT loosen

`/rsi-audit` is report-only with respect to **routing policy, graph nodes that
are not ledger entries, and product files**. Writing a ledger entry is not an
exception smuggled in — it is the same write surface the per-phase evaluator
already has, and the ledger is the graph's tracker of findings, not a routing
act. State the narrowing explicitly in `SKILL.md`. Note the report-only clause
is restated in **three** places — the frontmatter `description`, the body
opener, and step 7 — and editing one leaves the others contradicting it; this
was already learned once by `tactic-audit-permission-friction`.

The no-auto-apply bound on routing policy is unchanged and must not be loosened.

## Decide explicitly

How many findings land. All of them turns a twelve-lens report into a dozen
nodes per audit and defeats the merge discipline. A ranked top-N, with the
cut-off recorded and `log`ged rather than silent, is the shape to prefer.

## Verification

Manual: run `/rsi-audit` end-to-end twice and confirm the second run
INCREMENTS an existing entry's `recurrence_count` rather than minting a
near-duplicate slug. That is the whole point of the ledger and the first thing
that will break.
