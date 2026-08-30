# Author rulings — dispatch/RSI batch window

Rulings the author made during batch execution, in two interview sittings on
2026-08-29. Recorded here because the recurring defect this batch surfaced is
exactly that **binding rulings living only in plan prose do not reach a clean
session**: a session handed the node bodies alone builds the un-ruled design.

**The node body is the authority. This file is the index and the audit trail,
not the authority.** That makes transcription onto the node load-bearing: a
clean session handed the node bodies alone sees only what is on the node.

> **✅ TRANSCRIPTION STATUS, re-audited 2026-08-30 after landing — 8 of 8
> rulings are on their nodes. This file is NO LONGER operatively binding
> for any ruling. It is the index and the audit trail.**
> The earlier banner here said "1 of 7 transcribed … this file is operatively
> binding for the six untranscribed rulings, and any session executing this
> batch must read it alongside the nodes." That is now false and has been
> replaced rather than amended, because a stale *binding* claim changes how
> every executing session reads the batch.
>
> Rulings 1, 2, 3, 6 and 7 are on their nodes on `origin/main`, landed across
> `91bc7cc9` (three of Ruling 1's four completion records), `4ffbc8b3`
> (Ruling 3's clarification-131 amendment) and `60dd2b54` (the nine-node
> transcription pass — Ruling 1's fourth node plus Rulings 2, 3, 6 and 7).
> **Commit attribution corrected 2026-08-30:** this list also named `9201fdeb`
> and `1f5d0909`, neither of which lands any of these five — `9201fdeb` landed
> the 35%-band ruling in the table below (it is a node write, not a plan-side
> one: its single file is `intentions/strategy-graph-native-dispatch.md`, and it
> is that ruling's transcription commit — it simply lands none of these five),
> and `1f5d0909` landed Ruling 5 (see its paragraph). Re-measured with
> `git show origin/main:intentions/<id>.md | LC_ALL=C grep -ac '2026-08-29'`
> against each ruling's own named nodes — every one returns ≥ 1 hit
> (2, 3, 2, 2, 2, 2, 1, 2 across the eight named nodes).
>
> **Scope of that measurement, corrected 2026-08-30.** The eight named nodes are
> Ruling 1's four, plus one each for Rulings 2, 3, 6 and 7. **Ruling 4 is
> covered separately and IS node-homed** — it is a `clarifications:` entry on
> `intentions/strategy-graph-native-dispatch.md`, landed by `4ffbc8b3`. Measure
> it with a single-term grep:
> `LC_ALL=C git grep -a -l 'verifiably dead' origin/main -- intentions/` → 1 file.
> An earlier audit here reported zero because it ran a BRE alternation
> (`'verifiably dead\|clear a park itself'`) under ERE/PCRE, where `\|` matches a
> literal pipe.
>
> **Ruling 5 is node-homed too — corrected 2026-08-30 (third pass).** An earlier
> revision of this banner said Ruling 5 "has no node home, and needs none,"
> discharged by the transcriptions themselves. That is refuted by a commit this
> banner already cites: `1f5d0909` touches exactly one file and adds exactly one
> thing — an `attributes.conditions:` entry on
> `intentions/strategy-graph-native-dispatch.md` (`:7131-7142` on `origin/main`;
> the entry opens at `:7131`, and its closing provenance clause is at `:7140`)
> recording Ruling 5 verbatim and ending *"(Recorded 2026-08-29 as author Ruling 5; see
> plans/dispatch-rsi-author-rulings.md, which is the index and audit trail and
> never the authority.)"* Grep `conditions:`, not `clarifications:` — Rulings 4
> and 5 share this node but sit in different fields, and Ruling 5's entry is a
> bare string with none of the `question:`/`answer:` shape a clarification uses.
> Do **not** re-transcribe it.
>
> **Ruling 8 is node-homed too**, on
> `tactic-eval-finding-detached-code-review-dies-with-launcher` (`:683`, 1
> occurrence of *"RULED 2026-08-29"*), transcribed by `60dd2b54` — see the
> discharge note below. **Commit corrected 2026-08-30:** this cited `08870461` /
> PR #3132, which encoded the ruling **plan-side only** — that commit touches
> two `plans/` files and no `intentions/` path, as does every commit in #3132,
> so verifying the node home against it reads as "not transcribed" and invites
> exactly the re-transcription Ruling 5 forbids. So the count is **8 of 8**,
> not 6 of 6.
>
> **For everything else, the node body is the authority.** This file is now
> what its own header says it is: the index and the audit trail. A clean
> session handed the node bodies alone sees every one of Rulings 1 through 8;
> it no longer needs this file for any of them.
>
> Two corrections to the specific claims the old banner made, both measured:
>
> - Ruling 1's row asserted *"0 hits on all four. All four still carry live
>   `office_hours` parks."* Both halves are refuted. Hits are 2, 3, 2, 2. Three
>   of the four — `tactic-code-review-detached-node-lock`,
>   `tactic-review-cheap-fix-disposition`, `tactic-audit-permission-friction`
>   — are now `phase: done` with `office_hours: null`. Only
>   `tactic-dispatch-code-review-concurrent-write-attribution` is still parked.
> - Ruling 6's row called the prose follow-up landed via `cba77286`. That
>   commit is on the **open** PR #3142 branch, not on `origin/main`; the
>   original claim rested on a case-sensitivity false negative in its own grep.
>   The ruling itself is now transcribed regardless.
>
> One item remains owed. **It does not keep any part of this file binding.**
>
> 1. Four band-only nodes still need park-reason rescue text at clear time.
>
> (The PR6 interrupt-gate ruling was the other owed item. It is discharged in
> this same commit: its node transcription had already landed on
> `tactic-eval-finding-detached-code-review-dies-with-launcher`, and its
> numbered entry lands below as **Ruling 8**.)


> **Plan-only rulings owed transcription, and the ones that must NOT be
> transcribed** (audited 2026-08-30; the **TRANSCRIBE** rows re-measured against
> `origin/main` later the same day — all four have since LANDED, so no row below
> is still owed a node write). Ruling 5 requires each plan-stated ruling
> to be folded onto its node; it also warns that transcription canonizes an
> executor draft mistaken for a ruling. The audit separates the two:
>
> | Ruling | Home node | Disposition |
> |---|---|---|
> | PR11 model routing — *"set `model:` from `cost_usd`, never from `price_proxy_usd`"* (the proxy holds price constant and **inverts** the model ranking, 37827 vs 31372) plus the measured **1.91×** opus-to-sonnet per-turn premium | `tactic-rsi-lens-catalog-decomposition` | **TRANSCRIBE — ✅ LANDED.** It had reached `strategy-recursive-self-improvement` and the measuring node, but not the node PR11 closes; it now carries *"Set `model:` from `cost_usd`, NEVER from `price_proxy_usd`"* |
> | PR2 Unit 7 — the `success_signal` **threshold amendment off 0** | `tactic-ladder-terminus-owns-main-qa` | **TRANSCRIBE the amendment only — ✅ LANDED.** The first clause ("the sensor stays approximate and says so") was already on the node; `success_signal.threshold` now reads *"0 violations, EXCLUDING the one deliberately-approximate prose wait … Amended off an unqualified 0 by author ruling 2026-08-19"* |
> | PR20 — the 35% band ruled **(c) accept with remediation** | `strategy-graph-native-dispatch` | **TRANSCRIBE — ✅ LANDED.** It had lived only in `751982b0`'s commit message; the strategy now carries *"DISPOSITION (c) — ACCEPT THE BREACH WITH REMEDIATION"* beside the `40.5% (band ≤35%)` reading |
> | PR6 — the interrupt-gate proxy accepted | `tactic-eval-finding-detached-code-review-dies-with-launcher` | **TRANSCRIBE — ✅ LANDED.** Genuine — node transcription by `60dd2b54`; the ruling itself was encoded plan-side by `08870461` / PR #3132, which touches no `intentions/` path (commit corrected 2026-08-30). It owed both a node transcription and a numbered entry in this file; the node now carries *"RULED 2026-08-29 — the proxy is accepted, and this check no longer gates …"*, and the numbered entry landed 2026-08-30 as **Ruling 8** below. **Home node corrected 2026-08-30:** this row previously named `tactic-code-review-detached-node-lock`, which contains `interrupt` 0 times and `proxy` 0 times. The gate this ruling discharges is at `intentions/tactic-eval-finding-detached-code-review-dies-with-launcher.md:667-681` (18 `interrupt` hits, `phase: implement`, unparked) |
> | PR3 Unit 1 — "close the four verify-and-close nodes before any implementation" | — | ⚠ **DO NOT TRANSCRIBE.** Two of the four (`tactic-audit-cache-efficiency-lens`, `tactic-rsi-round-trips-lens-carrier`) are `phase: implement`, `status: codified`, carrying live two-unit plans. Transcribing canonizes the contradiction |
> | PR4 Unit 8 sequencing rationale | — | ⚠ **DO NOT TRANSCRIBE.** Its premise is option 2 of `tactic-graph-prose-ref-batch-wiring`, which that node refutes |
> | PR4 Unit 3 constraint — "keep the skill-body edits minimal and mechanical" | — | ⚠ **DO NOT TRANSCRIBE.** Contradicted by that node's item 5, which requires a non-mechanical edit |
> | PR5 absorptions (#3002, #3064) and the #3018 conflict-lane coordination | — | ⚠ **DO NOT TRANSCRIBE.** No node rules on either. The absorptions stay as plan-side facts; the conflict-lane coordination sentence is struck outright, since the unit it coordinates with is refuted |
> | PR14 model tags — "ruled opus" / "ruled sonnet" | — | ⚠ **UNSOURCED.** Neither node declares a model. The word "ruled" is struck; the tags survive as plan-side recommendations with their reasons |
> | PR13 atomicity — the no-alias atomic rename | `tactic-dispatch-skill-rename` | Folded into the Position 10 carrier decision below — do not transcribe separately |

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

**BOUND — quoted verbatim from the node** (`intentions/strategy-graph-native-dispatch.md`,
`clarifications:` entry landed by `4ffbc8b3`). No plan document repeated this
until 2026-08-30, and it changes downstream work:

> BOUND, and it is the whole of the delegation: a DEAD PREMISE is not a DEAD
> SCOPE. This entry authorizes clearing a park whose stated blocking premise no
> longer holds; it does NOT authorize making a node selectable whose SCOPE is
> dead or whose park is the only stop on a bad automated action. Where
> clear-park is the wrong instrument — a phase: null node whose work already
> shipped, which clear-park makes router-eligible rather than terminal — the
> correct act is the completion record (phase: done), never the clear.

Before every clear, ask which of the two is dead. If the *scope* is dead and the
node is `phase: null`, `clear-park` is the wrong instrument: it makes the node
router-eligible and the router will re-dispatch the shipped work. Write the
completion record instead.

*(Footnote on the figures above: this entry reproduces the author's "12 of the
17" verbatim. The re-census landed 2026-08-30 gives **15 nodes / 22 marks, 12
parked** — see the "Open parks" row of `plans/dispatch-rsi-sequence.md`. The
numerator is unchanged; only the denominator was wrong.)*

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

### Ruling 8 — PR6: the interrupt-gate proxy is accepted

**Question.** `tactic-eval-finding-detached-code-review-dies-with-launcher`
carried an attended check — interrupt a launching Bash tool call by hand and
confirm the detached review survives — described on the node as "the one check
that cannot be automated" and "the definitive close of this finding". Does it
gate PR6 Units 2–3?

**Ruled: the proxy is ACCEPTED and the check no longer gates anything.** The
author accepted the **background-teardown demonstration** — a detached run
survived teardown of the launching Bash tool call and wrote its marker 12s later,
exercising the same `systemd-run --user` re-parenting mechanism.

**Honest limit, stated at the sitting:** the demonstration killed a *background*
task — the same class of teardown, but not literally a human interrupting a
foreground tool call. The attended check is therefore a **confirmation, not a
discovery**, and is an optional follow-up the author may run at any attended
moment. **Units 2 and 3 ship without it.** The 2026-08-28 sitting had
established topology only (PPID 314, own `app.slice` cgroup, `flock` released on
child exit) and explicitly not survival of a launcher teardown; that is the gap
this ruling closes.

**Node transcription: LANDED.** `intentions/tactic-eval-finding-detached-code-review-dies-with-launcher.md`
carries *"RULED 2026-08-29 — the proxy is accepted, and this check no longer
gates anything"* (1 occurrence), transcribed by `60dd2b54`. The ruling was
encoded plan-side by `08870461` / PR #3132, which touches no `intentions/`
path — verify the node home against `60dd2b54`, not against #3132.

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

---

## Executor decisions taken during reconciliation (for ratification)

Ten questions the 2026-08-30 plan-reconciliation pass found registered as
"needs author input". Under the standing policy at the top of this file — a
labelled author call is triaged, and only genuine doctrine reaches the author —
each was decided on best judgement and the consequence applied to the plan
documents. **None is pending.** Listed for the author to confirm or overturn.

Each entry gives the question, the decision, the one-line reason, and what
changed as a result.

### D1 — PR4 / PR19 ordering: a PR-level cycle

**Question.** `tactic-persist-greenfield-drops` (PR19) is `blocked_by`
`tactic-finding-search-all-producers` (PR4), and that PR4 node is itself
`blocked_by` `tactic-supersession-edge-and-terminal` (PR19). PR4 and PR19 cannot
both be atomic PRs in either order. Split PR19 at the edge, or merge PR4+PR19
into one PR?

**Decided: SPLIT PR19.** `tactic-supersession-edge-and-terminal` — PR19's Unit 1,
a pure `packages/intentionsutil/src/schema.ts` addition — ships as **PR19a ahead
of Position 5**; the two consumer nodes ship as **PR19b at Position 6, behind
PR4**.

**Reason.** The split runs along an existing seam and Unit 1 has no dependency on
PR4; the merge produces a 19-node PR spanning three independently reviewable
surfaces (ledger doctrine migration, five-writer collapse, schema terminal).

**Changed.** `plans/dispatch-rsi-sequence.md` — the Position 6 entry, the
"PR19 is pinned behind PR4" passage in §"Cross-PR dependency edges", hard-ordering
constraint 2 in §"The orderings that are not preferences", and the bundle-table
row for Position 6. `plans/dispatch-rsi-serialized-pr-plan.md` — PR19's
`### Dependencies`. The node graph itself is acyclic and is not touched.

### D2 — PR4 Unit 8: `batchIds` has no honest wiring

**Question.** Open an `/align` pass on `strategy-graph-integrity` (may an
integrity guard resolve a reference on a writer-asserted, push-carried
declaration?), or adopt the node's option 3 and retire `batchIds`?

**Decided: OPTION 3 — retire `batchIds`.**

**Reason.** The node's own recommendation says ruling option 3 directly is
sufficient and the strategy question need not be opened; options 1 and 2 are both
verified unimplementable, and `batchIds` is an unwired fifth parameter with no
production caller, so deleting the affordance is more honest than building a
declaration channel that cannot be made honest.

**Changed.** PR4 Unit 8's Scope in the serialized plan is rescoped to the node's
option 3 verbatim: delete the parameter and its exemption from
`validateGraphProseRefs`, **rewrite** (never delete) the `schema.test.ts` cases
to document why the exemption is not offered, add the hand-ordering and
retryable-after-reordering notes to `/rsi` step 6, and keep the two-invocation
reproduction requirement. The park is cleared in the same change. Unit 8 no
longer depends on Unit 3.

### D3 — Position 10: the carrier ruling (four questions)

**Question.** PR13's only node is parked on four unrecorded premises, and no
`/align` pass was scheduled anywhere to settle them.

**Decided, all four:**

- **(a) Carrier — `tactic-dispatch-skill-rename`.** It is live, unparked, serves
  the same strategy, and its roster table already claims all three renames.
  `tactic-dispatch-skill-standards-extraction` keeps only the
  standards-extraction question, whose own body makes extraction conditional on a
  concrete consumer that has not emerged.
- **(b) Roster — the three renames this window names, and no more.** The
  remaining `dispatch-<phase>` namespace entries stay outstanding on the carrier.
- **(c) Transition — ATOMIC, no compatibility aliases.**
- **(d) The `blocked_by` `tactic-dispatch-skill-input-contract` is a phantom and
  is void.** *(Corrected 2026-08-30: the verdict stands, the reason does not.
  There is no `blocked_by` edge to void — all three nodes carry
  `blocked_by: []` in frontmatter, measured on `origin/main`. Every reference to
  that id is BODY PROSE, invisible to `validateGraph` and to the router, so
  nothing was ever deadlocked and there is nothing to delete.)*

**Reason.** (a) resolves a duplicate-target pair *deliberately* rather than by
omission, which is what clarification 78 exists to prevent. (b) widening a
repo-wide atomic rename inside a frozen window multiplies blast radius for no
benefit. (c) an alias has no implementable mechanism — a skill's identity is its
directory name plus the `SKILL.md` frontmatter `name:` plus the Workflow
registration `name:`, so an alias means a duplicate registration, which
`.claude/rules/vendored-skills.md` treats as a defect. (d) — as originally reasoned — a `blocked_by` naming a
node that does not exist can never clear, so honoring it deadlocks the position
permanently.

**Changed.** PR13's Scope in the serialized plan carries all four answers, and
its `### Nodes closed` list is flagged for correction to name the carrier.
`intentions/` node prose and `.claude/settings.json` are struck from the rename
surface (the node rules the first out; the second was measured to carry no
matching pattern). The index's Position 10 section carries the prerequisite
note. Nobody mints any of the three phantom node ids.

### D4 — PR16 Unit 9: the empty-store contract

**Question.** Does `reader-required-dir.test.ts`'s empty-named-store contract
stand, or does the node's Scope? Inverting the test is forbidden by
`.claude/rules/test-integrity.md`.

**Decided: THE TEST'S CONTRACT STANDS.** An existing, caller-named, empty store
is a legitimate graph. Unit 9's original scope is retired.

**Reason.** Beyond the test-integrity bar: the vacuous-pass class PR1 Unit 8 was
chasing is already closed by its own change (a *missing* directory exits 2), and
an empty-store error would break graph bootstrap in a fresh instance repo, which
is a supported case.

**Changed.** Unit 9 is rescoped to the half that ships without weakening
anything: correct the `validate-graph.ts:111` comment — which is the thing that
is actually wrong — to state the real contract, and print
`ok — 0 nodes (store is EMPTY at <resolved absolute path>)` so an empty run is
visibly distinct from a populated clean one. A case pinning the new output is
**added** alongside the existing assertion. No test is inverted, skipped or
deleted. The park is cleared in the same write.

### D5 — PR16 Unit 8: `execution.strategy_fingerprint` shape

**Question.** Does the field keep its `{hash, sha}` object form, or does `sha`
go?

**Decided: KEEP `{hash, sha}`.**

**Reason.** `sha` is the provenance half — it is what makes a stamp auditable
against a commit, and dropping it removes the ability to detect the very defect
the unit exists to fix. There is no write site on `main` yet, so keeping the
richer shape costs nothing today while dropping it is an irreversible narrowing
taken before any consumer exists.

**Changed.** PR16 Unit 8 gains the park callout it never had, plus the decision.
The unit stays carried forward behind #3023 for the write-site reason, not the
shape one; the index's Carried-forward row and Unit 8 bullet say so.

### D6 — PR8 Unit 1: three destinations for `target-workers.json`

**Question.** Ruling 2 says XDG; the plan offered tracked-with-history vs
gitignored-with-a-template; `tactic-dispatch-config-template` says it "migrates,
tracked".

**Decided: Ruling 2 governs the LIVE file; the template node governs a TEMPLATE.
Ship both.** The live, per-user `target-workers.json` relocates under XDG beside
the pause sentinel. A **tracked defaults template** (no live values) stays in the
instance repo.

**Reason.** The two are reconcilable rather than competing, and the combination
serves Ruling 2's stated rationale exactly: a fork gets a starting point without
inheriting this deployment's schedule.

**Changed.** PR8 Unit 1 stops offering a choice and directs the XDG relocation
plus the tracked template, with `target_n` explicitly untouched (zero is the
weekly pace curve). The template node's "migrates, tracked" wording is flagged
for correction to say *the template* migrates tracked, not the live file.

### D7 — PR3 Unit 3: `tactic-audit-review-effort-yield-lens`, (a) or (b)

**Question.** The node's park records "AUTHOR RULING NEEDED, (a) or (b)" because
the findings axis has no admissible input.

**Decided: OPTION (b)** — ship the lens on source-verified figures only
(`touched_files_count` as the fix-yield term plus effort, model, wall clock and
price proxy), and record that the findings half of clarification 46's comparison
is not measurable today.

**Reason.** (a) requires a coordinated write-side instrumentation change across
five surfaces **and** an explicit ruling that a structuring-subagent-parsed
findings count clears the "accounting is verified" bar — a doctrine change
inventing a provenance standard this batch has no mandate to set. (b) ships a
real lens today and records the unmeasurable half honestly.

**Changed.** PR3 Unit 3's Scope is replaced with option (b) and its consequences:
the `high` raise stays an unmeasured quality bet on the findings axis, and
`result.json`'s per-source dispositions stay non-durable — that deliberate design
choice is left undisturbed. The park is cleared in the same write. The index's
Position 5 section carries the park census and the decision.

### D8 — PR5: the predicate approach and the retention-scan call sites

**Question.** Registered as needing an author call because the plan's offered
approaches were refused by name and its three named call sites were the node's
out-of-scope list.

**Decided: NO AUTHOR CALL IS NEEDED — both nodes state their own approach
unambiguously.** Re-read on disk 2026-08-30.

- `tactic-review-stall-predicate-subprocess-spawn` rules the **documented
  superset cost pre-filter** already shipping on `graph-select-target`'s
  `_gate_maybe_interrupt`, keeping the **full** superset rather than narrowing to
  `ci == failing`, in two `sonnet` units, with an explicit "do not author a
  duplicate" of the existing exhaustive invariant test.
- `tactic-done-node-retention-scan-cost`'s real three call sites are
  `select-targets.ts`, `dispatch-graph-census` and `dispatch-graph-scope-sweep` —
  the three `tactic-review-stall-listnodes-duplicate-scan` deliberately left
  unwired "to be picked up by later tactics".

**Reason.** The questions were artifacts of the plan text, not gaps in the
graph.

**Changed.** Both PR5 Scope bullets are rewritten to the nodes' own approaches,
including the `blocked_by` prerequisite on `store-cache.ts` and the explicit
"do not reimplement the primitive" stop.

### D9 — PR14 model tags and the PR5 absorptions: unsourced "ruled" claims

**Question.** PR14's two "ruled opus" / "ruled sonnet" tags cite no source, and
no node rules on PR5's #3002 / #3064 absorptions or the #3018 conflict-lane
coordination.

**Decided: STRIKE the word "ruled" from both PR14 tags, keeping the tags as
plan-side recommendations with their reasons. KEEP the #3002 / #3064 absorptions
as plan-side facts. STRIKE the #3018 coordination sentence outright.**

**Reason.** Transcribing an unsourced "ruled" is precisely the risk Ruling 5
names — it canonizes an executor draft as an author ruling. The absorptions are
bookkeeping about which drafts a PR converges, not doctrine. The #3018 sentence
presupposes the conflict-lane unit that `tactic-review-stall-conflict-lane`'s
dead-premise park deleted, so there is nothing left to coordinate.

**Changed.** Both PR14 model lines, PR5's overhang callout, and the
DO-NOT-TRANSCRIBE table at the top of this file.

### D10 — Position 13: who mints the carrier, and one PR or staged?

**Question.** `tactic-review-dispatch-charter-split` is `phase: done` and records
the spec, not the execution, so `isOpenTactic` is false and no router loop can
select it. No `# PR` section carries the work.

**Decided: THE BATCH MINTS THE CARRIER ITSELF, as the first action of Position
13, and the ~316-child re-serve ships as ONE PR.**

**Reason.** Minting is a graph write the batch is already pre-authorized to make
(index §"Batch execution authority", grant 2) and the spec is complete, so no
author input is needed to author the node. One PR because the
`lifecycle-sensor.test.ts` coupling guard requires the node edit and the code
change in the same branch, and because each staged per-charter re-serve would pay
the `--base` CAS invalidation again for no review benefit.

**Changed.** The index's Position 13 section carries the decision and a
seven-item minimum contents list for the carrier node; its bundle-table row is
marked **⚠ NO CARRIER — must be minted first**. The serialized plan's
"sittings held, nodes still open" paragraph drops the charter-split node from its
group (five → four) and records why closing it removed the last node that could
have carried the work.
