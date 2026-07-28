---
id: tactic-knowledge-silo-export-exercise
kind: tactic
statement: Exercise an export path out of each existing knowledge silo — one
  Google Doc and one Notion page to open formats in owned storage — recording
  what degrades
owner: human
status: codified
parent: null
rationale: "strategy-recover-knowledge's threshold has two clauses: the print
  annotation tactics cover 'new notes default to owned storage'; this covers
  'existing silo content has an exercised export path'. It also feeds
  delegation-knowledge-notes' pending assessment — its
  irreversibility.recovery_cost is unassessed, last_exercised is null, and its
  review_trigger names this assessment as the first step of recovery."
reading: null
gap: null
serves:
  - strategy-recover-knowledge
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates:
  - strategy-recover-knowledge
blocked_by: []
office_hours:
  reason: "Feature/requirement discovery, not executable work (classified
    2026-07-28 by author direction at an office-hours drain sitting): which
    document is representative and what counts as degradation are undecided
    requirements, so this node belongs in a requirement-discovery session rather
    than an execution lane. Substance of the prior park still holds: requires
    the author's Google and Notion accounts. Note the recording half is
    mechanical — once the author reports what degraded, any session can write
    the result into delegation-knowledge-notes (irreversibility.recovery_cost,
    last_exercised) via write-node.ts + graph-commit. Drive MCP could perform
    the Google-side export autonomously if the author names the document; Notion
    has no MCP path."
  since: 2026-07-28
  recommendation: "Take this up in a requirement-discovery session, not an
    execution tick. Recommendation (≤30 minutes): export one representative
    Google Doc and one Notion page to an open format (markdown/ODF) into owned
    storage, note what degraded (formatting, links, embedded assets, organizing
    structure), and record the result on delegation-knowledge-notes."
pace_exempt: false
rounds: null
attributes: {}
---
# Exercise an export path out of each existing knowledge silo

Author-only, ≤30 minutes: export one representative Google Doc and one Notion
page into an open format (markdown or ODF) in owned storage. Note what
degrades — formatting, links, embedded assets, organizing structure. Record
the result on `delegation-knowledge-notes` (its
`irreversibility.recovery_cost` is unassessed and `last_exercised` is null;
its `review_trigger` names this assessment as the first step of recovery).

This meets the second clause of strategy-recover-knowledge's threshold:
"existing silo content has an exercised export path". Born-parked — no
implement-phase plan; the work needs the author's accounts and judgment.
