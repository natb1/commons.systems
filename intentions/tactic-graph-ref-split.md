---
id: tactic-graph-ref-split
kind: tactic
statement: "Greenfield: the intention graph lands on its own ref with a
  validate-only gate — retries cost milliseconds, and native CAS optimistic
  retry replaces the CI stamp, the landing lock, and busy-main exhaustion"
owner: ai
status: raw
parent: null
rationale: "Retained draft from the 2026-07-19 /align-strategy round
  (strategy-graph-native-dispatch clarification 80), recorded per
  .claude/rules/design-proposals.md as the ideal greenfield design, with
  tactic-graph-commit-landing-lock as the brownfield interim step. Root cause of
  landing exhaustion: intention nodes share main with application code, so
  graph-only commits inherit code-grade branch protection (four checks green on
  the exact SHA) and contend with every code merge. On a dedicated ref (e.g.
  refs/graph/main or a dedicated branch) whose only gate is validate-graph — or
  whose validation is enforced solely by the write path — the retry loop is
  fetch → rebase → push at millisecond cost, and native CAS optimistic retry
  suffices with no lock anywhere: the standard git-as-database design (cf.
  Gerrit NoteDb). This harmonizes the 2026-07-13 anti-serialization doctrine
  across the whole system instead of carving a landing-lock exception to it.
  Boldness note recorded at interview: the CAS-sufficiency claim is design
  reasoning grounded in Claude-internal knowledge, not yet tested in this repo."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# Greenfield: the intention graph lands on its own ref with a validate-only gate — retries cost milliseconds, and native CAS optimistic retry replaces the CI stamp, the landing lock, and busy-main exhaustion

Retained draft context (2026-07-19 /align-strategy round; strategy clarification 80
is the deciding record — read it first).

## Design sketch

- The graph store (`intentions/*.md`) lands on a dedicated ref (e.g.
  `refs/graph/main`, or a long-lived `graph-main` branch) instead of `main`.
- The only landing gate is graph validity: `validate-graph` as the single
  required check, or no server-side check at all with validation enforced by the
  write path (`write-node.ts` is already the single validation gate).
- `graph-commit`'s landing loop collapses to `fetch → rebase → push` — the CAS
  retry redo cost drops from 30-180s of CI restamp to milliseconds, so native
  optimistic retry is sufficient and `tactic-graph-commit-landing-lock` is
  deleted (the lock exists only to protect the stamp investment).
- This is the standard git-as-database shape (cf. Gerrit NoteDb). It also
  applies the 2026-07-13 anti-serialization doctrine system-wide instead of
  carving a landing-lock exception to it.

## Open design questions (resolve at finalization)

- How readers learn the graph ref: router, sensors, digest table, CI fast path,
  and every skill currently reading `origin/main:intentions/...` must point at
  the new ref.
- History migration: move `intentions/` with history, or cut over at a boundary
  commit and leave history on `main`.
- Whether `main` keeps a read-only mirror of the graph for tooling that cannot
  be repointed, and what syncs it.
- Protection rules for the new ref (who may push; force-push ban).
- Sequencing: lands after `tactic-graph-commit-landing-lock`; its completion
  deletes the lock code.

## Boldness note

The CAS-sufficiency claim is design reasoning from Claude-internal knowledge
(git semantics, Gerrit precedent), not tested in this repo — recorded as such
in clarification 80.
