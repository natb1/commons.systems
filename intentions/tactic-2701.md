---
id: tactic-2701
kind: tactic
statement: Pagination product decision for the five marker-bounded Firestore reads
owner: human
status: raw
parent: tactic-2686
rationale: >-
  For each site, decide one of:

  - **(a)** accept unbounded as correct, backed by a documented data-size
  invariant;

  - **(b)** add cursor/page-based pagination in the UI + data layer;

  - **(c)** add a generous hard `limit()` where truncation is acceptable.


  Record the decision and update or remove the `query-bounds-ok` marker to
  reflect

  it. Where a site chooses real pagination (option b), file a per-site

  implementation sub-issue rather than building it here — this issue is the

  decision, kept to a single PR.
reading: null
gap: null
serves: []
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
attributes:
  source: github:natb1/commons.systems#2701
---
# Pagination product decision for the five marker-bounded Firestore reads
