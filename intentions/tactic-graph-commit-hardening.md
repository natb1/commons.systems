---
id: tactic-graph-commit-hardening
kind: tactic
statement: "Harden graph-commit: surface gh api errors, stop retrying
  deterministic check failures, park_write rollback, id-validation
  over-rejection"
owner: ai
status: raw
parent: tactic-graph-native-dispatch
rationale: Deferred-finding draft per strategy-graph-native-dispatch
  clarification 19 — recorded by the 2026-07-04 independent review round of PR
  2750 (merged without review; the in-scope conflict data-loss finding shipped
  separately as PR 2751). All entries are confirmed-or-plausible robustness
  gaps, out of the primitive's stated contract; awaiting /align-tactics
  finalization.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: draft
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Harden graph-commit: surface gh api errors, stop retrying deterministic check failures, park_write rollback, id-validation over-rejection

**Draft (retain-not-refine)** — deferred findings from the 2026-07-04
independent review of PR #2750 (`packages/intentionsutil/scripts/graph-commit`,
merged without review). The one in-scope finding — silent data loss in the
conflict-recovery path — was fixed separately (PR #2751, fail-closed park).
Everything below is out-of-contract robustness, deferred per strategy
clarification 19. Line anchors are pre-#2751 and shift once it merges.

Findings:

- **`await_checks()` swallows `gh api` errors** (`graph-commit:221-226`).
  `2>/dev/null … || counts=""` collapses auth failure, rate limiting, and
  network errors into the same bucket as "checks still running"; the script
  times out ~180s later with a generic message and the root cause is lost.
  Fix: capture stderr and distinguish an API error from a pending check.
- **Deterministic check failures burn the whole retry budget**
  (`graph-commit:288-299`). Content that genuinely fails a required check
  (e.g. malformed frontmatter failing `lint`) reproduces the identical
  failure on all 5 attempts, then reports "main busy … retry later" — wrong
  advice for a content bug. Fix: when a check *concludes* non-success
  (nfail>0, vs timing out), stop retrying and report the check failure.
- **`park_write()` has no rollback on partial multi-id failure**
  (`graph-commit:355-376`). A mid-loop `writeNode` throw leaves earlier ids
  mutated on disk but uncommitted when the script dies.
- **Id validation over-rejects `..` substrings** (`graph-commit:407-411`).
  An id merely *containing* `..` (e.g. `v1..v2-migration`) is rejected
  although it poses no traversal risk. Low priority.
- **EXIT trap does not cover INT/TERM; no janitor** (`graph-commit:101-108,
  431`). A hard kill can orphan the remote `graph/**` scratch branch and the
  snapshot tempdir; nothing reaps them later.
