# dispatch/RSI batch — durable execution state

Append-only working memory for the dispatch/RSI serialized PR batch
(`plans/dispatch-rsi-sequence.md` is the index; this file is the live state).
On resume: read this file first — it overrides state restated in any resume
prompt. Update it in the same commit as each position's bookkeeping landing,
or the nearest docs PR.

## Positions — measured PR counts (plan estimates expand ~3.4x; trust measured)

| pos | plan est | measured | status (2026-08-31) |
|-----|----------|----------|---------------------|
| 1-4 | - | done | landed |
| 5 | 2 | 6-7 | in progress: PR #3178 at review round 2; PR3 building in a subagent |
| 6 | per plan | unmeasured | not started |
| 7 | 1 (~20 units) | 6 PRs / 63 units | parks staged: 3 clear-park + 1 leave-held |
| 8 | 3 | 4-5 | not started |
| 9 | 1 | 4 | not started |
| 10-13 | unmeasured | unmeasured | anchor pre-sweep required before building (P13 = /align charter split, 328 children) |

Remaining scope: ~15 plan-PRs (PR2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17,
19b, 20) plus four carried-forward PR16 units and #3023 — roughly 50 real PRs
at the measured expansion factor.

## Rulings (SOURCE: user; act-then-note applies)

- 2026-08-31 — Scope must not be cut. (Supersedes the executor's cut-10-13
  proposal.)
- 2026-08-31 — Review effort scales by diff class: `high` + opus for code diffs
  touching dispatch/graph write paths; one `medium` round for docs/plan/
  test-only diffs. Hard cap: 2 rounds per PR, enforced by the gate script;
  findings after round 2 become follow-up nodes, never a round 3.
- 2026-08-31 — Delegation by default: units are built in background
  worktree-isolated subagents at the unit's `Model:` tag; the main thread only
  orchestrates, gates, and merges.
- 2026-08-31 — Graph bookkeeping batches to one `graph-commit` landing per
  position (precedent: 3c63fc36, 76e004f0), not one per PR.
- 2026-08-31 — Positions 10-13 get a read-only anchor pre-sweep before any
  build, so plan expansion is discovered as plan edits, not review rounds.
- 2026-08-30 — Two-strike rule hardened: no design-surface exemption
  (post-#3174).
- 2026-08-29 — Batch authority: auto-merge on green; resolve graph/planning
  bookkeeping without stalling; park to office_hours only for genuine
  ambiguity.
- Standing — Ratification means act, then note for later review. Follow-ups
  are fine if resolved within the batch.
- Dropped — positions 7/8/9 concurrency (wall-clock only; no token saving).

## Carry-forwards

- #3178: round-1 findings applied (fddd3ce7); round 2 is the capped final
  round.
- PR4 Unit 2 owns the stale `ledger_entry` narration
  (`dispatch-eval-finding:72,:458,:1185`, `intentions/kind-tactic.md:296`);
  the node governs over `plans/dispatch-rsi-serialized-pr-plan.md:1926`.
- PR4 Units 3-6: two node-vs-node contradictions need an executor ruling (the
  `unregistered` three-way; exit-code freeze vs `EXIT_LOST_WRITE=3`).
  Unit 4b: dead premise, do not build. Unit 8: rescoped to "retire
  `batchIds`".
- Task #93 (GC-2): repo-settings ruleset PATCH is user-only — permission
  denied to the executor.
- Task #125: `supersession_expiry` claim correction on
  `intentions/tactic-supersession-edge-and-terminal.md` (needs a clean
  intentions-only branch; `graph-commit` pushes HEAD).
- Task #120: 11 excluded `npx tsx` sites — unblocked (#3171, #3174 merged).

## Resume protocol

1. Read this file, then the index's "Where this stands" table.
2. Apply the rulings above; do not re-derive measured figures whose commands
   and output were already shown (measurement-trust rule).
3. Before stopping: append current state here, and leave something running.
