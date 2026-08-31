# dispatch/RSI batch — durable execution state

Working memory for the dispatch/RSI serialized PR batch
(`plans/dispatch-rsi-sequence.md` is the index; this file is the live state).
The Positions table is rewritten in place — one row per position, always
current; Rulings and Carry-forwards are append-only. On resume: read this file
first — it overrides state restated from an earlier session's context, but a
fresh instruction from the user always wins over anything written here. Update
it in the same commit as each position's bookkeeping landing, or the nearest
docs PR.

## Positions — measured PR counts (trust measured over plan est)

| pos | plan est | measured | status (2026-08-31) |
|-----|----------|----------|---------------------|
| 1-4 | - | done | landed |
| 5 | 2 | 6-7 | in progress: PR #3178 at review round 2; PR3 building in a subagent |
| 6 | per plan | unmeasured | not started |
| 7 | 1 (~20 units) | 6 PRs / 63 units | parks staged: 3 clear-park + 1 leave-held |
| 8 | 3 | 4-5 | not started |
| 9 | 1 | 4 | not started |
| 10-13 | unmeasured | unmeasured | anchor pre-sweep required before building (P13 = /align charter split, 328 children) |

Remaining scope: 15 plan-PRs (PR2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17,
19b, 20) plus four carried-forward PR16 units and #3023. **Prediction, not a
measurement:** roughly 45-50 real PRs, extrapolating the ~3.0x factor the four
measured positions above give (21 measured against 7 estimated). Treat it as an
order-of-magnitude figure only — the per-position ratio ranges from 1.5x (pos 8)
to 6x (pos 7), so it does not predict any single position.

## Rulings (act-then-note applies)

Every dated bullet is SOURCE: user, SCOPE: this batch. The undated bullets carry
their own source inline — do not read them as user rules.

- 2026-08-31 — Scope must not be cut. (Supersedes the executor's cut-10-13
  proposal.)
- 2026-08-31 — Review effort scales by diff class: `high` + opus for code diffs
  touching dispatch/graph write paths; one `medium` round for docs/plan/
  test-only diffs. Hard cap: 2 rounds per PR; findings after round 2 become
  follow-up nodes, never a round 3. **This supersedes rule 4 of the index's
  "The code-review gate" section (`plans/dispatch-rsi-sequence.md:1468`), which
  reads `high` for docs-only diffs and no round cap on code diffs — apply this
  bullet, not that rule.** The cap is executor-tracked: **no script enforces
  it** (nothing in `dispatch-code-review`, `dispatch-review-plan-gate` or
  `lib.sh` counts rounds), so count rounds yourself before launching one.
- 2026-08-31 — Delegation by default: units are built in background
  worktree-isolated subagents at the unit's `Model:` tag; the main thread only
  orchestrates, gates, and merges.
- 2026-08-31 — Graph bookkeeping batches to one `graph-commit` landing per
  position (precedent: 3c63fc36, 76e004f0), not one per PR.
- 2026-08-31 — Positions 10-13 get a read-only anchor pre-sweep before any
  build, so plan expansion is discovered as plan edits, not review rounds.
- 2026-08-31 — Two-strike rule hardened: no design-surface exemption. Ruled
  after #3174 merged (2026-08-31T13:55Z), so it is later than — and supersedes
  — the 2026-08-31T09:24Z #3167 reading that a design-surface fix earns a third
  round. Do not reinstate that exemption from memory; `fddd3ce7` pins the
  un-exempting direction.
- 2026-08-29 — Batch authority: auto-merge on green; resolve graph/planning
  bookkeeping without stalling; park to office_hours only for genuine
  ambiguity.
- Standing (SOURCE: user) — Ratification means act, then note for later review.
  Follow-ups are fine if resolved within the batch.
- Dropped (SOURCE: executor judgement, not a user ruling — revisitable) —
  positions 7/8/9 concurrency, on the reading that it buys wall-clock only and
  no token saving.

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
- Index rule 4 (`plans/dispatch-rsi-sequence.md:1468`) still carries the
  superseded review-effort text (`high` for docs-only, no round cap); edit it at
  the next index touch. The supersession is recorded in Rulings above either
  way.

## Resume protocol

1. Read this file, then the index's "Where this stands" table.
2. Apply the rulings above; do not re-derive measured figures whose commands
   and output were already shown (measurement-trust rule).
3. Before stopping: rewrite the Positions table rows in place (never append a
   second row for a position), append any new rulings and carry-forwards, and
   leave something running.
