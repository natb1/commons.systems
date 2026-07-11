---
id: tactic-citation-graph-listing
kind: tactic
statement: Get the workflow listed in the harness-engineering citation graph —
  canonical elevator line in-repo, then inbound-link submissions to the lists
  practitioners traverse
owner: ai
status: raw
parent: null
rationale: "Retained from gh #2068 during the 2026-07-06 tier-gate interview.
  External submissions are a pure invitation: they ship only after the tier-3
  entry declaration on strategy-progressive-validation, after the practitioner
  entry point exists, and after tactic-practitioner-support-boundary is written
  — an inbound link that lands on an unsupported surface burns the practitioner
  it attracted."
reading: null
gap: null
serves:
  - strategy-distribute-workflow
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-tier3-entry-declaration
  - tactic-workflow-entry-point
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Get the workflow listed in the harness-engineering citation graph — canonical elevator line in-repo, then inbound-link submissions to the lists practitioners traverse

## Retained concepts (from gh #2068, migrated 2026-07-06)

In-repo half (a single PR):

- A canonical one-line description + canonical URL external lists can quote
  verbatim, using the graph-native framing — "a harness for long-horizon
  autonomous workflows built around the intention graph" — anchored in a
  `CITATION`/references section of the README.
- Confirm the `harness-engineering` / `long-horizon` GitHub topic tags
  (#2051 set them; confirm, do not duplicate).
- Reciprocal link to the winning awesome-list once listed, so the edge is
  bidirectional.

External half:

- Identify the canonical `awesome-harness-engineering` list (several forks
  exist; pick the one the Lexicon / DeepWiki converge on) and open a PR
  adding the workflow.
- Submit to the Haverin Lexicon and/or DeepWiki harness-engineering entries
  where they accept additions.
- Record each submission (target + PR/entry URL + status) on this node as it
  opens, so partial completion is visible.
- Quality gate: external wording matches the README exactly — no drift.

Sequencing: after the practitioner entry point exists, and only after the
tier-3 declaration and tactic-practitioner-support-boundary — an inbound link
landing on an unsupported surface burns the practitioner it attracted. Full
original text: gh #2068.
