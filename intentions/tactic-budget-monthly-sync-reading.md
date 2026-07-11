---
id: tactic-budget-monthly-sync-reading
kind: tactic
statement: finish the 2026-06 budget sync on the fixed merge, and instrument the
  strategy reading — /budget stamps strategy-recover-finance.reading after each
  publish
owner: ai
status: codified
parent: null
rationale: "The round's instrument + validates terminal:
  strategy-recover-finance's reading is null, so the round must produce it.
  Completing the interrupted 2026-06 sync on the fixed merge is the reading; the
  skill edit makes every future monthly sync stamp it."
reading: null
gap: null
serves:
  - strategy-recover-finance
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-budget-monthly-sync-reading
  pr: 2842
  attempts: {}
  markers: []
  strategy_fingerprint: 3178ea5e04e119ed9cce5cb1e0b573e7e011aef2e70dbd39c0449a854a61a204
validates:
  - strategy-recover-finance
blocked_by:
  - tactic-budget-overlap-anchor-merge
office_hours:
  reason: 'qa 2026-07-11: Unit 1 (PR #2842, the /budget skill reading-stamp
    sub-step) verified end-to-end -- dump-node.ts -> edit reading/gap ->
    write-node.ts -> graph-commit --base round-trip exercised against
    strategy-recover-finance in the QA worktree (change reverted, not
    committed): dump-node.ts writes the exact JSON shape write-node.ts consumes
    plus base-manifest.txt; write-node.ts touches only reading/gap; graph-commit
    supports --base <manifest-file>; budget-apply echoes "new snapshot: $OUT"
    confirming the "echoed by budget-apply" claim; the existing Privacy
    invariant section is unchanged. Unit 2 (finish the interrupted 2026-06 sync)
    is explicitly operational and needs the human operator: BUDGET_ETL_PASSWORD
    (pass/GPG-sourced per strategy clarification 4), the mounted cloud statement
    archive, and the preserved categorization patch spec at
    ~/.config/commons-systems/budget-patch-2026-06.json (merchant patterns,
    never committed) -- no automated worker can supply these. Next steps: run
    /budget locally to apply the preserved patch spec via budget-apply, publish
    the fresh snapshot, confirm strategy-recover-finance reading names 2026-06
    with gap null (Unit 1 stamp sub-step fires automatically as the last step of
    that run); once confirmed this tactic transitions qa to review then done.'
  since: 2026-07-11
  recommendation: null
pace_exempt: false
rounds: null
attributes: {}
---
# finish the 2026-06 budget sync on the fixed merge, and instrument the strategy reading — /budget stamps strategy-recover-finance.reading after each publish

## Context

strategy-recover-finance's success signal (statements merged and categorized
monthly; sensor: the budget app and its encrypted snapshot history) has
`reading: null` — this tactic is the round's instrument and its validates
terminal. The 2026-06 sync was interrupted mid-run: sync/ingest completed,
categorization decisions were captured as a patch spec on the operator's
machine, and apply was blocked by the merge defect fixed in
tactic-budget-overlap-anchor-merge. This tactic finishes that sync and
codifies the reading stamp so every future `/budget` run keeps the strategy's
reading current.

## Unit 1 — `/budget` stamps the strategy reading after publish

**Recommended model:** sonnet

Scope — `.claude/skills/budget/SKILL.md`, Step 5 (Summary, line ~233): add a
final sub-step — after a successful publish, update
`intentions/strategy-recover-finance.md`'s `reading` via
`packages/intentionsutil/scripts/write-node.ts` (readNode → set `reading` to
`"<YYYY-MM> statements merged and categorized; snapshot <filename>"` from the
just-published snapshot's month and filename → writeNode), set `gap` to null
when the merged month is the most recent complete month (else name the
shortfall), and land it with `packages/intentionsutil/scripts/graph-commit`.
`reading`/`gap` are sensor-writable state fields excluded from the strategy
substance fingerprint, so the stamp never triggers a soft freeze. Snapshot
filenames carry a timestamp only — no transaction data — so they are safe for
the public graph; the skill's privacy invariant (SKILL.md:29) otherwise
applies unchanged: no transaction contents, descriptions, amounts, or account
identifiers in the stamped reading.

Out of scope: any other change to the `/budget` flow.

## Unit 2 — operational: finish the 2026-06 sync (after Unit 1 merges)

**Recommended model:** opus

Not a repo change; run `/budget` on the operator's machine. Preconditions:
the tactic-budget-overlap-anchor-merge fix available as a binary (build
locally with `go -C projects/budget-etl build` into the resolver cache path —
see `.claude/skills/budget/scripts/budget-resolve-binary`), the snapshot
password exported as `BUDGET_ETL_PASSWORD` per SKILL.md's precondition step
(env-first resolution per strategy clarification 4 — sourced from pass/GPG on
this host; macOS Keychain only as an explicit `--keychain` opt-in), and the
cloud statement archive mounted. The categorization decisions from the interrupted
run are preserved at `~/.config/commons-systems/budget-patch-2026-06.json`
(operator-machine-local; contains merchant patterns — never commit or
transmit it). Apply via the skill's Step 4 (budget-apply), publish, then
confirm Unit 1's reading stamp lands on the strategy node.

## Dependencies

- tactic-budget-overlap-anchor-merge — the merge accepts this month's
  overlapping exports only after the fix.

## Reuse

- `.claude/skills/budget/scripts/budget-apply` and `budget-sync` — the
  existing sync/apply flow; do not duplicate their logic.
- `packages/intentionsutil/scripts/write-node.ts` + `graph-commit` — the
  graph's only write path.

## Verification

```verify
go -C projects/budget-etl test ./...
```

Manual: a fresh snapshot exists in the configured snapshot directory and
`current` has a fresh mtime; the app loads it; the one account with a known
small same-month residual shows it in the app's divergence surface (expected
— adjudicate there, not in the merge); `strategy-recover-finance`'s `reading`
names 2026-06 and its `gap` is null.

## Implementation notes

Unit 1 in a subagent with `model: sonnet` (working-tree edits only). Unit 2
is an operational `/budget` run on the operator's machine — it needs the
operator-held `BUDGET_ETL_PASSWORD` (pass/GPG-sourced, per strategy
clarification 4) and the mounted archive, so it cannot run in a detached CI
context.
