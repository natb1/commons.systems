---
id: strategy-domain-selection
kind: strategy
statement: Select new domains where the author's own problem is a good candidate
  for recovering autonomy
owner: human
status: codified
parent: strategy-recover-author-autonomy
rationale: >-
  When choosing a new domain, enter domains where the author has a genuine
  problem first; within a domain, prioritize depth before breadth. These
  criteria help identify where the author's problem is also a good candidate for
  recovering autonomy:


  - **Where is institutional dependency most painful for the author?** Look for
  domains where the platform's business model is visibly misaligned with the
  author's interest.

  - **Where has agentic coding shifted the cost-benefit for problems the author
  faces?** Look for domains where building your own solution was previously
  infeasible but is now tractable.

  - **Where can autonomy plausibly be recovered?** Good candidates share traits
  like: local-first data storage is viable, the platform's value comes from
  commoditized technology rather than network effects, open standards exist, or
  the problem does not inherently require institutional coordination at scale —
  not all traits need be present; the question is whether an individual can
  realistically own the solution.

  - **Where is the demonstration most legible because the author genuinely uses
  it?** The before/after of recovered autonomy should be obvious to someone who
  has never thought about institutional capture — this criterion is
  strategy-show-not-tell applied at selection time.


  Standing candidates, recorded as raw delegation records awaiting this
  selection: delegation-communications (interim path while unselected:
  strategy-realign-attachments), delegation-media-libraries,
  delegation-health-records (interim path: right-of-access exports), and — from
  the 2026-07-02 completeness sweep (strategy-complete-ledger) —
  delegation-mobile-platform, delegation-banking, delegation-connectivity, and
  delegation-cloud-backup. Selected 2026-07-02: delegation-knowledge-notes —
  recovery owned by strategy-recover-knowledge, entered through reading
  annotations in print.


  The criteria above are software-shaped, and a record whose recovery is not
  software (delegation-client-income) can never satisfy them. Such a record is
  not scored here: it stays raw until its own review_trigger fires, and then a
  strategy is minted for it directly rather than waiting on this selection —
  exercised 2026-07-02: strategy-diversify-income, minted directly on
  delegation-client-income.
reading: "2026-07 round: all raw records scored — delegation-communications and
  delegation-web-analytics selected; delegation-banking, -cloud-backup,
  -health-records, -media-libraries, -mobile-platform, -connectivity explicitly
  deferred"
gap: 2026-07 round scored every raw record (selected or deferred) — no raw
  record currently sits unscored, meeting the threshold for this cycle; the
  "across a review cycle" recurrence clause is unproven after a single round
serves:
  - virtue-progressive-detachment
recovers: []
clarifications:
  - question: What is a round's scoring scope, and who drafts the scores?
    answer: "A scoring round covers every kind-delegation record at status: raw at
      round time — the threshold's own scope — not the rationale's
      standing-candidates snapshot, which can lag intake:
      delegation-web-analytics entered the raw set 2026-07-03 and is in scope
      for the 2026-07 round though the snapshot predates it. Excluded by status,
      not judgment: delegation-client-income (refining; non-software recovery,
      strategy minted directly per this rationale) and
      delegation-knowledge-notes (refining; selected 2026-07-02). Scoring is
      drafted by the round's ai tactic from the records' recorded axes; the
      sensor is unchanged — the select-or-defer decision on each candidate
      remains the owner's at office-hours, ratifying or revising the drafted
      scores. Recorded 2026-07-11 /align-tactics round."
  - question: What was the outcome of the 2026-07 domain-selection scoring round?
    answer: "2026-07 round, completed 2026-07-23: all raw records scored against the
      criteria — delegation-communications and delegation-web-analytics selected
      (each schedules an /align-strategy interview to mint its recovery
      strategy); delegation-banking, delegation-cloud-backup,
      delegation-health-records, delegation-media-libraries,
      delegation-mobile-platform, and delegation-connectivity explicitly
      deferred (their interim paths stay named). delegation-client-income and
      delegation-knowledge-notes were out of scope — excluded by status
      (refining), not raw. Recorded by hand at office-hours per the
      round-completion write (bootstrap interim)."
tooling_goals: []
success_signal:
  observable: raw candidate records are periodically scored against these criteria
    and either selected (minting a recovery strategy) or explicitly deferred
  sensor: owner review at office-hours
  threshold: no raw record sits unscored across a review cycle
  is_proxy: true
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds:
  count: 1
  last_completed: 2026-07-23
  last_aligned: null
attributes:
  conditions:
    - domains keep appearing where the ownership cost-benefit has flipped and
      the author has a genuine problem
---
# Select new domains where the author's own problem is a good candidate for recovering autonomy
