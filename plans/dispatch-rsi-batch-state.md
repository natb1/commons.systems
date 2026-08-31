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
| 5 | 2 | 6-7 | **stopped mid-position** (2026-08-31, user-directed): #3178 merged 14:56Z; #3181 (Units 2+3) merged 17:35Z; #3180 (rsi-audit usage aggregation + session-stamp hooks) merged 20:11Z. **Nothing is left running** — the drain is complete, which is the state the STOP ruling below requires. Units 4-8 and the graph bookkeeping landing not started — tasks #127, #128 |
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
  follow-up nodes, never a round 3. **This superseded rule 4 of the index's
  "The code-review gate" section (`plans/dispatch-rsi-sequence.md:1467`), whose
  pre-2026-08-31 text read `high` for docs-only diffs and no round cap on code
  diffs. That divergence is closed** — rule 4 now states this tiering and this
  cap directly, so the two agree and neither overrides the other; the sentence
  is kept as history, not as a live "apply this, not that" instruction. The cap
  is executor-tracked: **no script enforces
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
- 2026-08-31 — **STOP. The batch is stopped, not paused mid-step.** The user
  directed a drain to a stop: finish the work already in flight, close the
  ledger/index gap this file's own protocol owes, then stop. No new units, no
  new PRs, no Position 6 work. **A fresh session must not read this file as a
  resume instruction** — resuming takes a new instruction from the user, and
  the Resume protocol below applies only once that arrives.
- 2026-08-31 (SOURCE: executor, applying the user's 2-round cap above) — The
  cap bounds **review rounds, not correctness**. A blocking finding surfaced
  *by* round 2 is fixed in-branch and merged without buying a round 3; only
  design calls and non-blocking findings become follow-up nodes. Index rule 4
  already carried this shape for docs-only diffs ("fixed in-branch and merged
  without a second round"); this generalizes it to every diff class. It is not
  a licence to merge past a blocking finding.

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
- **RESOLVED 2026-08-31 (this commit)** — the standing carry-forward "index
  rule 4 (`plans/dispatch-rsi-sequence.md:1467`) still carries the superseded
  review-effort text (`high` for docs-only, no round cap); edit it at the next
  index touch" is discharged: rule 4 now states the tiering and the 2-round cap
  directly, so the index no longer contradicts this file. The Rulings bullet
  that recorded the supersession is kept as history; it is no longer a live
  divergence, and nothing is owed at the next index touch.
- `dispatch-code-review` has a **two-phase contract, and phase 2 is not
  optional.** The launcher returns **rc 5 = detached-and-running**; the
  `setsid` child writes Claude's output to
  `$CACHE_DIR/<sha256 of the --out-dir>.output` and its rc to `.rc`, then exits.
  **The `--out-dir` is populated only when you re-invoke `dispatch-code-review`
  with the same `--out-dir` to collect.** So a normal, successful completion is
  indistinguishable from a death by the obvious signals: PID gone, out-dir
  empty, no `output.txt`. On 2026-08-31 three round-2 gates were written off as
  dead on exactly that evidence; all three had finished rc 0 with findings and
  had already posted their inline comments, and relaunching one bought a
  duplicate opus round (6782s and 1380s runs on the same PR, two comment sets)
  for nothing. Collect before concluding anything — it is cheap and idempotent.
  Two companion traps: `pgrep -f "<the --out-dir string>"` matches the polling
  script's own argv, so a liveness loop keyed on it can never exit (parse the
  launcher's `pid=` line and poll `kill -0`); and `touched_files_count=0` on a
  diff under `.claude/skills/` or `.claude/hooks/` is the sandbox write-deny
  (`denyWithinAllow`), never evidence of no findings.
- Unit 5 was **partially pulled forward** into #3181, for the `--like` bound
  only: three caller sites (`rsi/SKILL.md`, `rsi-audit/SKILL.md`,
  `dispatch-ladder/SKILL.md`) now pass a bound, and `rsi`/`rsi-audit` each gained
  an explicit terminal branch for an id-only match that names Unit 4 as where
  `--id` arrives. Still owed: the `--id` flag itself, the slug→id addressing
  rewrite, and the retired-stub prose. `rsi/SKILL.md` and `rsi-audit/SKILL.md`
  (not `dispatch-ladder/SKILL.md`, which only passes the bound) each carry a
  hard "mint nothing" branch for Unit 4 to convert, and name Unit 4 in the
  prose, so they are greppable — but **grep case-insensitively**:
  `rsi-audit/SKILL.md:191` writes it lowercase and `rsi/SKILL.md:314`
  capitalizes it (`**Mint nothing, and write nothing.**`), so `grep 'mint
  nothing'` finds only one of the two and reads as though `rsi/SKILL.md` were
  already converted. Task #128.
- Task #127 — three design calls deferred out of #3180 round 2 want a follow-up
  node. #3180 **merged** 2026-08-31 20:11Z (squashed onto main as `35fc5573`),
  so all three `path:line` anchors below now resolve on `origin/main`. Measured
  there after the merge: `stamp-dispatch-session.sh` is 233 lines and
  `aggregate-usage.sh` carries 12 `review_runs` occurrences. Before that merge
  main had a 55-line hook and no `review_runs` at all — so an anchor that finds
  nothing means the checkout predates `35fc5573`, never "already fixed". The
  three: the `$PWD` sidecar misattribution
  (`.claude/hooks/stamp-dispatch-session.sh:203`); the Stop fast-path cost
  (`:105`, raised independently by *both* round-2 runs); and the `review_runs`
  replay double-count (`.claude/skills/rsi-audit/scripts/aggregate-usage.sh:859`
  — measured runs 5 / sessions 2, one review counted twice, which inflates the
  very cost figures this ledger cites).
- Task #128 — `intentions/kind-tactic.md:264` still declares
  `attributes.ledger_entry` live, names it as the owed-prune exemption key, and
  cites the deleted `isLedgerEntry` plus a non-existent `rsi.ts` /
  `rsi-plan.md`. It is an `intentions/` node, so it wants `graph-commit` on a
  clean intentions-only branch and could not ride this docs PR.

## Resume protocol

1. Read this file, then the index's "Where this stands" table.
2. Apply the rulings above; do not re-derive measured figures whose commands
   and output were already shown (measurement-trust rule).
3. Before stopping: rewrite the Positions table rows in place (never append a
   second row for a position), append any new rulings and carry-forwards, and
   leave something running — except at a **directed stop**, where you leave
   nothing running (see the 2026-08-31 STOP ruling).
