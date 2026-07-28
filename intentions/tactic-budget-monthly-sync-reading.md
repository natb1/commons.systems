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
phase: done
execution:
  branch: tactic-budget-monthly-sync-reading
  pr: 2842
  attempts: {}
  markers: []
  strategy_fingerprint: 3178ea5e04e119ed9cce5cb1e0b573e7e011aef2e70dbd39c0449a854a61a204
  fix: null
  completion:
    mergedAt: 2026-07-25T18:19:39Z
    mergeCommitSha: a046867bee1d1f9c02fc95d98543b5211d751e47
    graphCommitSha: null
validates:
  - strategy-recover-finance
blocked_by: []
office_hours:
  reason: "strategy-review sitting (park class: STRATEGY REVIEW — the third
    office_hours.session_type class, author-directed 2026-07-28; the structured
    enum member does not exist yet, so this prose label is the class marker and
    tactic-office-hours-session-type-strategy-review backfills it). Classified
    STRATEGY REVIEW because the sync exists to produce the metrics that
    tactic-budget-strategy-review-reading (which is blocked_by this node) reads
    to direct strategy; the two are one sitting split across a prerequisite.
    Filtering strategy-review entries hides both together, which is intended —
    running an office-hours tick WITHOUT that filter surfaces this node
    normally, so nothing is permanently hidden and no external reminder is
    needed. The operational substance of the prior park, unchanged, follows.
    Author-only operational run (park re-confirmed and corrected 2026-07-25 at
    an office-hours drain sitting). Unit 1 is DONE: PR #2842 merged 2026-07-25,
    so the /budget skill's reading-stamp sub-step is now on main and will fire
    automatically as the last step of the next run. What remains is Unit 2,
    which needs the author: BUDGET_ETL_PASSWORD is a pass/GPG secret with no
    non-interactive pinentry, plus the mounted statement archive and real
    financial data. Four corrections to the prior reason, which would otherwise
    mislead the next session: (1) the preserved categorization spec was NOT lost
    — it is at '/mnt/g/My Drive/budget-patch-2026-06.json' (author-confirmed
    2026-07-25) and has been staged to
    ~/.config/commons-systems/budget-patch-2026-06.json where the plan expects
    it; it is valid JSON with 'remove' and 'add' keys. (2) The backlog is larger
    than 2026-06: the last published snapshot is
    budget-2026-06-05T16-57-15.enc.json (current mtime Jun 5) and statements
    downloaded through 2026-07-05 are staged in '/mnt/g/Shared drives/budget'.
    Author decision 2026-07-25: catch all the way up through 2026-07 rather than
    2026-06 only, and let the stamp name the later month. (3) The prior ordering
    caveat is resolved — #2842 is merged, so no config grant is pending and the
    stamp needs no manual write. (4) Author decision 2026-07-25: pair this
    sitting with tactic-mainqa-budget-pipeline, parked since 2026-07-05 on the
    identical credentials/mount blocker, since the environment will already be
    warm. The blocking defect from the prior round is fixed and then some:
    tactic-budget-overlap-anchor-merge is done and pruned, and f5238deb
    (overlapping same-month anchors), 6254afac (date-keyed anchors) and fb572eed
    (statement-independent txn identity) are all on main. Backlog re-verified
    2026-07-28 (so the classification is not parking a stale claim): the newest
    published snapshot in '/mnt/g/Shared drives/budget' is still
    budget-2026-06-05T16-57-15.enc.json (mtime Jun 5), and unmerged downloads
    postdating it are staged under '/mnt/g/Shared drives/budget/statements' —
    american_express/51005 (activity.qfx; folder mtime Jul 5 11:14),
    capital_one/4549 (2026-06-05 and 2026-06-30 transaction_download.qfx) and
    pnc/5111 (2026-06-05 export plus
    accountActivityExport.2026-07-05T11-14-16.qfx). The 2026-06 patch spec is
    still staged and valid at
    ~/.config/commons-systems/budget-patch-2026-06.json."
  since: 2026-07-28
  recommendation: "Routing — this is the prerequisite half of the STRATEGY REVIEW
    sitting: run this sync first, then pair straight into
    tactic-budget-strategy-review-reading (the strategy-review node this one
    blocks) while the mount and GPG cache are warm. Running the sync does NOT
    discharge that node; they are separate sittings with separate outputs. One
    author sitting, environment already prepared. Preconditions verified
    2026-07-25: statement archive mounted at '/mnt/g/Shared drives/budget';
    patch spec staged at ~/.config/commons-systems/budget-patch-2026-06.json; PR
    #2842 merged so the stamp sub-step is present. Remaining: warm the GPG agent
    in an interactive host shell first (pass show the BUDGET_ETL_PASSWORD entry,
    entering the passphrase at the pinentry prompt), since Claude's
    non-interactive shell cannot prompt and the run fails with 'gpg: decryption
    failed: No pinentry' on a cold cache. Then run /budget, applying the
    preserved 2026-06 patch spec via budget-apply and continuing through the
    2026-07 statements in the same pass; publish the fresh snapshot. Verify by
    hand afterwards, per the node's Verification block: a new snapshot exists in
    the configured directory and 'current' has a fresh mtime; the hosted budget
    app loads it; and the one account with a known small same-month residual
    appears in the app's divergence surface rather than failing the merge —
    adjudicate it there, not in the merge. Confirm strategy-recover-finance's
    reading names the month reached with gap null; the stamp writes this
    automatically now, so its absence is a defect worth reporting rather than a
    manual step. Then pair straight into tactic-mainqa-budget-pipeline's live
    checklist while the mount and password cache are warm. On a clean pass this
    node transitions qa to review to done. If /mnt/g reads 'No such device'
    mid-sitting, recover with 'sudo systemctl restart mount-gdrive'."
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
