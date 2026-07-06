---
id: strategy-recover-knowledge
kind: strategy
statement: Recover notes and personal knowledge with plain-text, local-first
  tools, entered through reading annotations
owner: human
status: refining
parent: strategy-recover-author-autonomy
rationale: >-
  The domain selected next by strategy-domain-selection's own criteria
  (2026-07-02): recoverability is ideal — plain text and open formats are the
  canonical local-first substrate; agentic tractability is high; the pain is
  real (the record: the format degrades on export and the organizing structure
  belongs to the vendor); and it composes with what is already built.

  The entry is annotation and highlighting in print: reading notes are where a
  knowledge practice starts, print is where the author's reading already lives,
  and that first artifact is simultaneously depth in the attention domain and
  the seed of this one. From there the domain grows toward notes and documents
  in owned storage, structured by the author rather than a vendor silo.
reading: null
gap: null
serves:
  - virtue-progressive-detachment
recovers:
  - delegation-knowledge-notes
clarifications:
  - question: Where do print annotations persist, given cloud items currently keep
      bookmarks and reading positions in Firestore?
    answer: Annotations get no Firestore tier. Local-folder items persist to the
      .commons-print/index.json sidecar (open JSON riding the author's own
      folder); cloud and anonymous items fall back to device-local localStorage
      — mirroring the existing store routing but deliberately skipping
      Firestore, because reading notes are this strategy's first artifact and
      must not accumulate in a vendor silo. Immaterial to the recorded substance
      (it applies the statement's local-first mandate); informs the round-1
      plans. Recorded 2026-07-06 /align-tactics round.
tooling_goals: []
success_signal:
  observable: notes and documents accumulate in plain-text/open formats in owned
    storage; vendor silos become deliberate exceptions
  sensor: owner review at office-hours
  threshold: new notes default to owned storage and existing silo content has an
    exercised export path
  is_proxy: true
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds:
  count: 0
  last_completed: null
attributes:
  conditions:
    - plain-text and open document formats remain sufficient for the author's
      actual note-taking practice
---
# Recover notes and personal knowledge with plain-text, local-first tools, entered through reading annotations
