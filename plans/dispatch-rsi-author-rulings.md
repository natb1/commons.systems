# Author rulings — dispatch/RSI batch window

Rulings the author made during batch execution, in two interview sittings on
2026-08-29. Recorded here because the recurring defect this batch surfaced is
exactly that **binding rulings living only in plan prose do not reach a clean
session**: a session handed the node bodies alone builds the un-ruled design.

Every ruling below is transcribed into the relevant node body as well. This
file is the index and the audit trail, not the authority — the node body is.

## Standing policy in force

A code-review or planning output labelled "author call" is **not** automatically
deferred. Each is triaged first: doctrine ambiguity, or implementation detail?
Only genuine doctrine reaches the author. Implementation details are decided by
best judgement and executed. (User instruction, 2026-08-29.)

The author's stated expectation for this batch: **no parked decisions should be
waiting on them.** Where a park's premise is verifiably dead, clearing it is
delegated (ruling 4 below).

---

## Sitting 1

### Ruling 1 — Sibling-carrier drafts become completion records

**Question.** What happens to a draft node whose substance already shipped
under a *sibling carrier* — a different PR that solved it incidentally?

**Ruled: COMPLETION RECORD.** Stamp `execution.completion` with the carrier
PR's merge facts, move `status: raw -> codified` and `phase: null -> done`.
Do **not** prune. Preserves provenance and the reason the work existed.

**Applies to** four nodes, each parked awaiting exactly this convention:
`tactic-code-review-detached-node-lock` (carrier #3078),
`tactic-dispatch-code-review-concurrent-write-attribution`,
`tactic-review-cheap-fix-disposition` (carrier #2887), and
`tactic-audit-permission-friction`.

**Mechanism note.** The phase ladder has no `null -> done` transition, so
`transition-node` cannot do this. It requires `dump-node.ts --dir <abs>` ->
jq-patch the frontmatter -> `write-node.ts --dir <abs>` -> `graph-commit -C
<repo root>`. Copy the `execution.completion` shape from
`tactic-review-effort-max-detached-resume-poll`, already closed this way.

### Ruling 2 — `dispatch.config/target-workers.json` relocates under XDG

**Question.** The file is currently a stray: untracked *and* un-gitignored
(verified — `git ls-files` returns nothing, `git check-ignore` matches nothing).
Tracked, gitignored, or XDG?

**Ruled: RELOCATE UNDER XDG**, beside the pause sentinel, following
clarification 107's direction. This is per-user, so a fork inherits no
scheduling knob from upstream — which is why the park called it an author call.

**Also settles** condition 16, which still names a `dispatch.config` pause field
that does not exist while the live mechanism is the sentinel file.

**Do NOT** change the `target_n` value as part of this work. Zero is the weekly
pace curve — a deliberate pause, never a defect to fix.

Unblocks `tactic-dispatch-config-untracked-pace-curve` (PR8 Unit 1).

### Ruling 3 — Strategy clarification 131 is amended to make its premise true

**Question.** 131 asserts "selection writes the reservation marker before the
wait, so the wait holds a concurrency slot for its whole duration". Verified
true at the provision-time surface, **false** at the selection-time surface:
`graph-select-target`'s ci-pending skip returns before any `reservation_write`,
and the explicit lane invokes it without `--standalone`, so no marker is held.

**Ruled: OPTION (a) — make the premise true.** The selection-time surface takes
a reservation before it waits, so both surfaces genuinely hold a slot. Accepts
the cost of a new provisional ledger write needing rollback-on-timeout.

Rejected: narrowing 131 to the provision-time surface only. That was cheaper and
needed no new concurrency semantics, but left the `qa|review` phase pair — the
very pair the tactic was raised for — still dead-ending.

Unblocks `tactic-dispatch-explicit-ci-wait` (PR9 Unit 7).

### Ruling 4 — Park-clearing on a verifiably dead premise is delegated

**Ruled.** The executor may clear a park itself when the premise is verifiably
dead, and separately may clear the office-hours parks that block the Unit 7
`Verifiability: WAIT` migration from draining. Every clear is reported after the
fact, with the evidence that killed the premise.

**Why the second half was needed.** `packages/intentionsutil/src/router.ts:482`
and `:529` skip any tactic with a non-null `office_hours`, so a parked source
node can never drain to `done`. 12 of the 17 WAIT-mark sources are parked, which
deadlocks the migration chain for them: source never `done` -> `blockersComplete`
never passes -> the minted machine node is never selectable either. Unit 7's
spec never mentions `office_hours`.

---

## Sitting 2

### Ruling 5 — Plan-prose rulings are transcribed into node bodies, and each is flagged

**Question.** `plans/dispatch-rsi-serialized-pr-plan.md` states binding rulings
that appear nowhere in `intentions/`. Confirmed by grep returning zero hits, at
three positions independently: PR19's no-park-for-in-flight rule and its
mandatory expiry-event field; PR11's `cost_usd` / `price_proxy` model-routing
ruling; PR20's "35% band ruled (c) accept with remediation", which four nodes
are parked on.

**Ruled: TRANSCRIBE AND FLAG.** Fold each plan-stated ruling into the relevant
node body so it survives independently of the plan file, and list every one —
with its exact transcribed wording — for the author to confirm or overturn.

The acknowledged risk: if a plan sentence was an executor draft rather than an
author ruling, transcription canonizes it. The flag list is the mitigation, so
it must be complete.

### Ruling 6 — Record-time minting is correct; the "already-merged" prose is stale

**Question.** The plan says the destination node is "born at `main-qa` carrying
the source's **already-merged** PR". The shipped code mints at `/qa-fix` Step
3.6, inside phase `qa`, **before** Step 4 advances `qa -> review` — so the PR is
still open at mint time.

**Ruled: RECORD-TIME IS CORRECT.** Ratify what ships. Record-time triage is the
tactic's own thesis — the thing it exists to make possible — so the prose is the
error, not the code.

**Follow-up work:** correct the stale prose at `tactic-mainqa-record-time-routing`
`:207` and `:220`, and at `mint-mainqa-nodes:41` and `:59`.

### Ruling 7 — Position 9 Units 1 and 3 are descoped

**Question.** PR20 Units 1 and 3 are parked on `strategy-discovered-requirements`'
"authored-boost-of-8 relation" condition. That strategy has not been written
since before the park, and the node records the gate's discrimination mechanism
as "still owed by the SERVING STRATEGY" (`tactic-align-review-skill.md:415-419`).
The plan never mentions this gate at all.

**Ruled: DESCOPE UNITS 1 AND 3**, ship the rest of Position 9. The two units
stay parked pending the strategy and need a follow-up position later. PR20 ships
partial rather than fabricating a strategy the author has not written.

---

## Open for ratification when the batch completes

Items decided by executor judgement that the author should still confirm.
Distinct from the rulings above, which the author made directly.

| # | Item | Interim decision |
|---|---|---|
| A | The three #3140 "author call" review findings | All three triaged as **implementation**, not doctrine, and fixed. The reviewer's proposed fix for the first was **refuted**: `officeHours.ts:135` says `openBlockers` is "Advisory only — never a gate", and the office-hours SKILL says the same twice, so gating the queue is forbidden outright. |
| B | PR9 Unit 8 part 1 contradicts the node it cites | The node's own *Not in scope* section wins over the plan; that work moves to Position 12. |
| C | `tactic-select-tick-main-sync-gated-on-caller-cwd` belongs to no position | Assigned to Position 7 beside PR8 U2, which already edits `dispatch-select-tick`. It is the only *hot* node on that PR. |
| D | Rule-number allocation | PR19 takes 24 and 25; a Position 7 rule takes 26. Rule 20 is permanently burned (`schema.ts:1779-1782`). |
| E | `/rsi-audit` writing a config file (PR10 Unit 1) | Charter bound 8 (`rsi-audit/SKILL.md:204`) reads as forbidding it — "writes no control artifacts". Treated as forbidding; the unit needs a different writer. |
| F | Seven vacuous or inverted `verify` fences found store-wide | Corrected in place; see the sweep report. Two are **inverted** — they pass only when the property is violated. |
