# Author ratification record — dispatch/RSI serialized PR batch (consolidated)

## What this document is

A single **retrospective record** of every decision taken during the dispatch/RSI
serialized PR batch **without asking the author first**: what was decided, why,
what was actually done as a result, and where the evidence sits.

It obeys one standing rule, the author's own, quoted verbatim:

> filing for ratification means you do the thing without me providing approval,
> and then just note it for me to review later

Sourced at `plans/dispatch-rsi-batch-steering.md:226-227` (S-16), restating S-15
at `:189` — and see **§1.13**, because finding that sentence required defeating
this document's own prescribed search method, which reports it as absent.

**Nothing here is pending on the author.** There is no approval queue, no
sign-off column, and no item held back waiting on a ruling. The two conflict
rows that once read `Open.` were ruled by the executor on 2026-08-30 rather than
left as questions; where executor follow-through is still sequenced, it is
listed as such and owed by the executor, never by you. Every entry names a
decision **already made and already acted on** — a change that is in the tree, in
a merged commit, or on a PR. The correct way to use it is: read it, disagree with
anything you want to disagree with, and file a follow-up. If you find something
here sitting unbuilt waiting on your word, that is a defect in the execution, not
a question being asked of you.

**Policy that governs the triage**, recorded because it is what makes the record
possible: a code-review finding labelled **"author call" is NOT automatically
deferred**. Each one is triaged — doctrine ambiguity vs implementation detail —
acted on by best judgement, and recorded here. §5.27 is the clearest case of a
review calling something an author call and it being triaged and done anyway;
§5.16 is the counter-case, where a finding was wrongly deferred, and the cost of
that deferral is recorded.

## Sources merged

This document is the consolidation of two overlapping records, both compiled
during the batch and both now superseded by this one:

| source | size | recorded | what it was |
| --- | --- | --- | --- |
| `/tmp/claude-1000/author-ratification-list.md` | ~154 KB, 70 entries | 2026-08-30, four passes | The full tiered record, re-measured against `origin/main` at each pass |
| `/tmp/claude-1000/AUTHOR-RATIFICATION-LIST.md` | ~6 KB, 10 entries | 2026-08-29 | An earlier, shorter record: entries R-1…R-9 plus one closing "deferred-by-design" item |

**Merge rule applied.** Where both described the same decision, the entries were
merged into one and the **more specific and more complete** version kept, with
the other record's detail folded in beneath a `FOLDED IN — consolidation` banner
naming its origin entry. Where the two **disagreed on a fact**, the disagreement
is **flagged inline** at the entry rather than resolved by picking a side. Where
the earlier record had no duplicate, its entry is carried in full as a new Tier 5
entry.

**Numbering was deliberately not changed.** Roughly two hundred cross-references
inside this document address entries by section number (§1.7, §4.12, and so on);
renumbering to reorder would break all of them. The tiers are already ordered
most-consequential-first, and each tier opens with a pointer to the entries worth
reading first within it.

**Counts.** Tier 1 — 13 · Tier 2 — 11 · Tier 3 — **0, deliberately** ·
Tier 4 — 18 · Tier 5 — **30**. **Total 72.**
(72 = 70 from the larger record + 2 carried from the smaller one with no
duplicate. Eight further entries from the smaller record were merged into
existing homes rather than added.) Plus one untiered section — **"Errors in this
record"** — recording the compiler's own mistakes, so the author can judge how
far to trust the rest.

## Where the two records disagreed — flagged, not resolved

Four factual conflicts survived the merge. Each is flagged in place at the entry;
this is the index.

| # | entry | the disagreement | status |
| --- | --- | --- | --- |
| 1 | **§5.30** (new) | Whether the executor was **permitted to clear** the `tactic-supersession-retirement-sweep` park. R-9: *"clearing a park is an office-hours act, so I have not cleared it."* §1.9: Ruling 4 grants exactly that clear, bounded to a dead **premise**. | **Resolved 2026-08-30 — `clear-park`**, on the strategy's own un-park criterion, which reaches this node by its own terms. R-9's ground was stale authority, not a competing doctrine. See §5.30. |
| 2 | **§4.3** | Sibling nodes around `tactic-review-stall-conflict-lane`: **three PR5 nodes built on the retirement** vs **two Position-4 nodes with finalized plans built on the work being live**. Count and direction both differ, and the direction decides whether clearing the park is consistent. | **Resolved 2026-08-30 — moot, by the instrument actually used.** The park was never cleared: `tactic-review-stall-conflict-lane` was closed as a **completion record** (`phase: done`, `execution.completion` = #3038 / `fa9c4338`), landed `e54b64ee`. A completion record is terminal and re-dispatches nothing, so neither sibling direction is disturbed and the count question stops deciding anything. See §4.3. |
| 3 | **§4.6 / §5.9** | The four sibling-carrier drafts: **four still parked** (earlier record) vs **three now `done` / `office_hours: null`, one remaining** (later re-measurement). | **Settled by the later measurement**, both readings kept in place. |
| 4 | **§4.13** | `mint-mainqa-nodes` on a second pass carrying a new item: **exits 0 and drops it silently** vs **hard-errors, exit 1**. | **Settled by measurement for this consolidation** — the guard runs before the skip and exits 1. The conflict is chronological: R-2 names the pre-guard shape, §4.13 the current one. Both kept. |

Two further apparent conflicts were examined and are **not** conflicts: §4.6
counts *positions* (five) while R-4 counts *parks at one position* (six), and
§5.10 and R-1/R-3 differ only in that one states the finding and the other the
triage outcome.

## Entries folded in from the earlier record

| earlier entry | label the earlier record used (retired, see below) | home in this document |
| --- | --- | --- |
| R-1 — author-lane main-qa node surfaces before its source PR merges | `PENDING TRIAGE` | §5.10 |
| R-2 — does "re-mint is a no-op" cover newly-recorded items | `PENDING TRIAGE` | §4.13 |
| R-3 — a source PR closed *unmerged* strands its destination at `main-qa` | `PENDING TRIAGE` | §5.10 |
| R-4 — the sequence index claims no position waits on the author | `NEEDS AUTHOR` (five parks) | §4.6, cross-ref §5.9 |
| R-5 — `tactic-review-stall-conflict-lane`'s park premise is dead | `NEEDS AUTHOR` | §4.3 |
| R-6 — PR9 Unit 8 part 1 is contradicted by the node it cites | `NEEDS AUTHOR` | §5.19 |
| R-7 — `tactic-select-tick-main-sync-gated-on-caller-cwd` belongs to no position | `NEEDS AUTHOR` | §5.20 |
| R-8 — PR19's binding rulings exist only in plan prose | `RULED-BY-ME (interim)` | **§5.29** (new) |
| R-9 — `tactic-supersession-retirement-sweep` park premise withdrawn | `NEEDS AUTHOR` | **§5.30** (new) |
| Rule numbering: PR19 takes 24 and 25, Position 7 takes 26 | ruled by the executor | §5.18 |

**All nine `R-` entries were rewritten from pending-shaped to completed-shaped.**
The earlier record carried a status legend — `PENDING TRIAGE` / `RULED-BY-ME
(interim)` / `NEEDS AUTHOR` — and a header saying each item *"needs the author to
ratify or overturn when the batch completes"*. Under the standing rule quoted
above, that framing was wrong: the items were acted on, and the record's job is to
say what was done. **The legend is retired and does not appear in this document.**
Where an item was genuinely left unexecuted, the entry says so plainly as a
decision taken — see §5.30, where the executor decided **not** to clear a park and
stated its reason, and §4.6's sixth park, where it decided the opposite.

## Executor follow-through still sequenced

**This is not an approval queue.** Ten entries carry work that was **decided and
is sequenced but not yet shipped**. None of it is author-owed and none of it
blocks on a ruling. It is listed so the record is honest about what is decided
versus what is landed — an earlier revision claimed blanket that *nothing here is
pending*, which was false about executor work and is withdrawn.

| entry | what is owed | owed by |
| --- | --- | --- |
| §1.6 | the rule-text amendment — decided, never landed | executor |
| §1.11 / §5.23 | fleet-alarm step 2, the no-op comparison | executor — **see the ruling below** |
| §2.7 | the `claude_job_id_for_name_all` test; coverage is still zero | executor |
| §2.8 | report the corrected fence that comes out RED | executor |
| §2.10 | one named `resolve-hold` follow-up | executor |
| §4.11 / §4.18 | 22 present-tense prose sites, not the 4 first counted | executor |
| §4.13 | the unhandled autonomous-refusal path | executor |
| §5.9 | one node's transcription (not four — the banner is right, the body stale) | executor |
| §5.12 | make `hook-tests` required, after a non-fail-fast fix that does not yet exist | executor |
| §5.25 | the second classifier bypass, live until its unit ships | executor |

An earlier revision pointed instead at "the two places where executor-owed work
is still outstanding (Tier 2 note, Tier 5 §5.16)". **That pointer was false when
written and is now exactly inverted:** both of those were subsequently DISCHARGED
(`8fe1d359`), while the ten above became outstanding. It named the two resolved
items and none of the live ones.

**The §1.11 / §5.23 ruling, taken 2026-08-30.** Those two entries previously
withheld fleet-alarm step 2 on the stated ground that shipping it *"decides the
parked question by fait accompli rather than by ruling"*. That was a defer, and
under S-16 it was not the executor's to make. **Ruled:** editing the three named
code sites does not pre-empt the park. The park asks what the comparison *should
be*; step 1 already migrated the data those sites read, so leaving the comparison
unaligned is not neutrality — it is shipping a half-migration whose two halves
disagree. The alignment completes work already begun, and the park's question
survives it intact for the author to answer differently. Step 2 is re-classified
as ordinary executor-owed work, filed as its own tactic for scope reasons only,
and it no longer waits on anything.

## Compilation history and standing cautions

**Window covered:** 2026-08-29 (the two author sittings) through 2026-08-30
(late), consolidated 2026-08-30.

The larger source was compiled from `plans/dispatch-rsi-author-rulings.md`,
`plans/dispatch-rsi-batch-steering.md`, `plans/dispatch-rsi-sequence.md`,
`plans/dispatch-rsi-serialized-pr-plan.md`, and the commit history of the batch
window (`08870461..origin/plan-reconciliation`), over four passes:

- **First pass** — 42 entries (4 / 6 / 0 / 10 / 22).
- **Second pass, 2026-08-30 (evening)** — 56 entries (8 / 9 / 0 / 14 / 25).
  Fifteen further decisions added; every pre-existing entry re-checked against
  `origin/main` at `1f5d0909` and `origin/plan-reconciliation` at `97fa10d6`.
  Corrections marked **CORRECTED 2026-08-30** in place and indexed under
  "Corrections to the first pass"; nothing silently rewritten.
- **Third pass, 2026-08-30 (late)** — 70 entries. `origin/main` moved from
  `1f5d0909` to **`45af501f`**, nine commits on: five PRs merged — **#3141**
  (`12716163`), **#3142** (`35ab0e45`), **#3143** (`d1fef042`), **#3144**
  (`8fe1d359`), **#3145** (`45af501f`) — plus four direct graph landings
  (`1c0dd63d`, `c0cecce1`, `a1e7b0e6`, `61cdca5d`). Thirteen further decisions
  added, every pre-existing entry re-measured. Corrections marked **CORRECTED
  2026-08-30 (3rd)** or **REFUTED 2026-08-30 (3rd)** in place.
- **Fourth pass / consolidation, 2026-08-30** — the 2026-08-29 record folded in;
  72 entries.

> **A citation class that broke wholesale, and it touches roughly twenty
> entries.** Both batch PRs were **squash-merged** and their branches deleted.
> So every branch commit this document cites as provenance — `245da5bc`,
> `b616fe21`, `22f438a6`, `b01341a1`, `cba77286`, `49a133b2`, `639ddb64`,
> `fc4ca3e9`, `2daae4ee`, `08944a44`, `e9000912`, `f2dd808d`, `450c9b25`,
> `97fa10d6` — is **reachable from no ref at all.** Verified: each object still
> exists in the store, and `git branch -r --contains` returns empty for all
> fourteen. The *content* landed; the *sha* did not. Read those shas as
> historical labels, not addresses — the landed forms are `12716163` (#3141) and
> `35ab0e45` (#3142). No entry's substance changes; every entry's citation does.
> This is §1.7's anchor-rot lesson one layer up: a commit sha is as perishable
> an address as a line number once the branch is squashed and deleted. See
> **§5.28**.

**Citations.** Every claim carries a `path:line` or a commit sha. Where a claim
could not be sourced in the repository it is marked **UNSOURCED** in bold rather
than dropped or asserted.

**A caution on line anchors — CORRECTED 2026-08-30.** Both plan documents open
with a measured warning that `path:line` anchors in this window are hints, not
addresses (`plans/dispatch-rsi-sequence.md:5-13` — PR5's Scope had 8 dead anchors
of 8, PR19 Unit 1 6 of 6, PR4 11 of 12). **The first pass read that as near-total
rot. A wider measurement puts it nearer ~50%, and that is the worse number, not
the better one** — see **§1.7**. Anchors below into `plans/` and `intentions/`
were read on disk 2026-08-30 and were correct then; **one anchor written that day
(§1.1's `:1486-1489`) was already four lines stale by the evening.** Locate by
content, always.

**Provisional reads — resolved on the second pass.** `intentions/` was being
actively rewritten by a concurrent session while the first pass was compiled, so
it was read only where unavoidable. Two node-state claims (§1.3, §5.9) rested on
the rulings file's own audit rather than on a fresh node read. **Both were
re-read directly on `origin/main` for the second pass, and both were wrong** —
see §4.12. The lesson is recorded, not just the correction: a document citing its
own prior audit as a source reproduces that audit's errors, and both errors here
were bad greps (§1.8).

**A note on greps.** Every `grep` reported in this document over `intentions/`
uses `LC_ALL=C grep -a` (one node carries a NUL byte that silences plain `grep`),
every prose-presence check is whitespace-normalized first (§1.8), and blockquote
markers are stripped before normalizing (§1.13).

**Measurements taken fresh for the consolidation**, and marked as such where they
appear: `packages/intentionsutil/scripts/mint-mainqa-nodes` (§4.13) and
`packages/intentionsutil/scripts/reconcile-graph.ts` (§5.10), both read in the
batch worktree checkout rather than on `origin/main`.

## Contents

Tiers are ordered most-consequential first. **Tier 1 (doctrine) deserves the
closest reading.** Tier 3 is empty and that is the intended result, not an
omission — see the note there.

Worth reading first within each tier:

- **Tier 1** — §1.5 (what a green `verify` fence licenses you to believe),
  §1.9 (the delegation's *bound*, which was missing everywhere), §1.11 (where
  delegated authority stops), §1.13 (the instrument that could not find this
  document's own charter).
- **Tier 2** — §2.7 and §2.8 (a false coverage claim and a red fence left red),
  §2.10 (the carve-out's named first application).
- **Tier 4** — §4.12 and §4.15 (claims about the world measured wrong, twice and
  seven times), §4.14 (a false-positive that caused real mis-deferrals).
- **Tier 5** — §5.26 (a graph writer dying with no park written), §5.24 (a
  concurrent-writer data-loss path), §5.30 (the one live doctrine conflict this
  consolidation could not settle).

**Tier 1 — rule or doctrine changes**
- 1.1 — The Lane 3 "never a relative helper path" rule now has a live, undocumented exception
- 1.2 — The bounds on the test-integrity carve-out were written by the executor, not stated by the author
- 1.3 — A document precedence order was declared, and one plan file was declared operatively binding
- 1.4 — Repo-wide skill renames are ruled atomic, with compatibility aliases ruled structurally impossible
- 1.5 — Verify-fence correction takes option (c), and this changes what "a green fence" means project-wide
- 1.6 — The Lane 3 absolute-path rule is wrong; the call site it contradicts is right
- 1.7 — `path:line` anchors are to be DELETED, not corrected — and the ~50% measurement STRENGTHENS that
- 1.8 — Multi-word greps over re-emitted YAML frontmatter are void as verification
- 1.9 — Ruling 4 has a node home, and its BOUND is the half that was missing everywhere
- 1.10 — A strategy carrying a `phase` is a MALFORMED STORE, not a stale selection
- 1.11 — Delegated authority covers implementation details; it does NOT settle a parked question
- 1.12 — The fleet-alarm migration is scoped by KIND, not by NAME PREFIX
- 1.13 — §1.8's replacement instrument is itself void on markdown blockquotes

**Tier 2 — test assertions deliberately inverted or rewritten**
- 2.1 — `test-review-fix-write-surface-guard.sh`, 22 → 27
- 2.2 — `test-dispatch-fleet-alarm.sh`, 111 → 116
- 2.3 — `test-dispatch-conflict-lane3-cwd-ratchet.sh`, 18/19 → 21/21
- 2.4 — `test-assert-node-selection.sh`, 12/13 → 16/16
- 2.5 — `test-mint-mainqa-nodes.sh`, 14 → 15 (addition, listed for completeness)
- 2.6 — `reader-required-dir.test.ts` — inversion deliberately REFUSED
- 2.7 — `claude_job_id_for_name_all` has ZERO test coverage and its node's fence claims otherwise: ADD THE TEST
- 2.8 — A corrected fence that comes out RED is a reportable outcome, not something to fix green
- 2.9 — The verify-fence linter patch is NOT self-contained: its test must land in the same commit
- 2.10 — The list-entry removal guard was DELETED and its assertion inverted from "parks" to "lands"
- 2.11 — Two regression tests added where the existing suite structurally could not see the defect
- Outstanding, and executor-owed — not author-owed — DISCHARGED 2026-08-30 (3rd)

**Tier 3 — items requiring an action the executor genuinely cannot perform**

**Tier 4 — claims found unsourced or wrong, and what replaced them**
- 4.1 — "ruled opus" / "ruled sonnet" on PR14's two model tags — UNSOURCED
- 4.2 — "each of the seven rulings is transcribed onto its node" — FALSE
- 4.3 — PR5's "#3018 conflict-lane coordination" — STRUCK OUTRIGHT
- 4.4 — "five writers collapsing into one" (PR4) — WRONG BY MEASUREMENT
- 4.5 — `.claude/rules/sandbox.md` on the `graph-commit` allowlist — WRONG
- 4.6 — "No position waits on the author" / "Open park: one" — BOTH FALSE
- 4.7 — PR16 Unit 4's data set "6 nodes" — WRONG, and dangerously so
- 4.8 — Four plan sentences ruled MUST-NOT-TRANSCRIBE
- 4.9 — Three script/skill headers describing rules they no longer implement
- 4.10 — The wider class, summarized rather than enumerated
- 4.11 — The three "phantom" node ids were PRUNED AFTER THEIR WORK SHIPPED — and one "`blocked_by`" is not an edge at all
- 4.12 — "1 of 7 rulings transcribed / this file is operatively binding" — FALSE, and its replacement OVERCLAIMED
- 4.13 — Two docs promised an idempotence the script stopped providing
- 4.14 — "A branch exists" is a FALSE POSITIVE for "in flight", and it caused real mis-deferrals
- 4.15 — The park adjudication had SEVEN wrong verdicts, and drift cannot be the excuse
- 4.16 — The WAIT census is settled at 22 marks / 12 parked — and the node count is 14, not 15
- 4.17 — "Eight fences run a vitest command that cannot work" is a floor, not a count — the corpus is 14
- 4.18 — "Every reference is body prose the validator never reads" — FALSE; six sit in scanned frontmatter fields

**Tier 5 — everything else material**
- 5.1 — PR19 split at its schema seam (D1)
- 5.2 — `batchIds` retired rather than made honest (D2)
- 5.3 — Position 10's carrier, roster and phantom edge (D3 a/b/d)
- 5.4 — `execution.strategy_fingerprint` keeps `{hash, sha}` (D5)
- 5.5 — `target-workers.json`: XDG for the live file, tracked for a template (D6)
- 5.6 — PR3 Unit 3 takes option (b): ship the lens on source-verified figures only (D7)
- 5.7 — PR5 needs no author call; both nodes state their own approach (D8)
- 5.8 — The batch mints Position 13's carrier itself, and the re-serve ships as ONE PR (D10)
- 5.9 — The four sibling-carrier drafts are still parked (Ruling 1 not yet executed)
- 5.10 — Reviewer's proposed fix refuted rather than applied (rulings item A)
- 5.11 — `/rsi-audit` ruled ineligible to write the config (rulings item E)
- 5.12 — Making `hook-tests` a required status check (scheduled, with a precondition)
- 5.13 — A CI check was turned on that had been running nowhere at all
- 5.14 — Prose reworded rather than suppressed with `// type-safety-ok:`
- 5.15 — Two pre-existing `main` breaks folded into a feature PR
- 5.16 — One finding deferred rather than decided — contrary to S-16, still open NOW DECIDED
- 5.17 — Measurement overrode plan text at two positions
- 5.18 — Rule-number allocation, and a live collision
- 5.19 — PR9 Unit 8 part 1 moved to Position 12 (rulings item B)
- 5.20 — `tactic-select-tick-main-sync-gated-on-caller-cwd` assigned to Position 7 (rulings item C)
- 5.21 — Seven vacuous or inverted `verify` fences corrected store-wide (rulings item F)
- 5.22 — PR16 Unit 3 shipped without `--dir`, against the plan
- 5.23 — Fleet-alarm: MIGRATE THE DATA FIRST, then align the code. The order is load-bearing.
- 5.24 — Two review findings fixed, one of them a concurrent-writer data-loss path, with a regression pin PROVEN to distinguish
- 5.25 — A SECOND live instance of the same classifier bypass, deliberately scoped out of the prose fix
- 5.26 — `merge-node` truncated its own JSON on a pipe, and `graph-commit` died with NO PARK WRITTEN
- 5.27 — Fixing a leaked job slot reached outside the PR, deliberately, because the BREADTH was the point
- 5.28 — Squash-merge makes a cited sha a perishable address; cite the landed form
- 5.29 — PR19's binding rulings were folded into the node bodies, because they existed only in plan prose
- 5.30 — `tactic-supersession-retirement-sweep`: the park premise is withdrawn, and the park was left standing anyway

**Errors in this record — the compiler's own**

**Appendix — where the batch stands, for context**
- Second-pass appendix, 2026-08-30 (evening)
- Third-pass appendix, 2026-08-30 (late)
- Corrections to the third pass — entries found stale or refuted
- Corrections to the first pass

---

## Tier 1 — rule or doctrine changes

Four items. Each rewrote a stated rule, convention, or piece of doctrine rather
than repairing a defect.

### 1.1 — The Lane 3 "never a relative helper path" rule now has a live, undocumented exception

> **CORRECTED 2026-08-30.** The doctrine gap this entry left open has since been
> closed by a verdict — see **§1.6**, which rules the *rule text* wrong and the
> *call site* right, and rewrites `:927-931` rather than the call. Two factual
> repairs to the entry below, both measured on `origin/main` at `1f5d0909`:
> the `graph-commit` call site is at `.claude/skills/dispatch-conflict/SKILL.md:1482`,
> **not** `:1486-1489`; the rule bullet begins at `:927`, not `:926`. The
> four-line drift in a one-day-old anchor written by this document is itself a
> data point for §1.7.

**Decided.** `dispatch-conflict`'s Lane 3 rule banning relative helper paths is
wrong as an absolute, so the `graph-commit` call site keeps its repo-relative
spelling and the *test* that enforced the rule was changed to assert a different
property instead — the blanket rule itself was left unamended.

**Done.**
- `.claude/skills/dispatch-conflict/SKILL.md:1486-1489` invokes
  `packages/intentionsutil/scripts/graph-commit -C "$PROJECT_ROOT"` — a relative
  path — with an inline note that the relative prefix "is deliberate". Added by
  `a4a964b8` (#3136), confirmed by `git log -S`.
- `.claude/skills/dispatch-conflict/SKILL.md:926-931` still states the blanket
  rule: *"Every helper script Lane 3 invokes must be invoked by absolute path
  under `$PROJECT_ROOT`, never by a relative `.claude/…` or `packages/…` path."*
  **Read on disk 2026-08-30 — still contradicted, still unamended.**
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-conflict-lane3-cwd-ratchet.sh:151-183`
  now carves `graph-commit` out of section 6 and re-asserts the underlying
  property as new section 6b: every fenced `graph-commit` must carry
  `-C "$PROJECT_ROOT"` on the same line, plus a non-vacuity companion at `:179`
  that fails if Lane 3 ever stops invoking `graph-commit` at all. Landed in
  `77bd7471` (#3140).
- Recorded as unwritable-from-session in `49a133b2`'s body: *"`.claude/skills/`
  is read-only to this session; recorded for the author."*

**Why.** `.claude/settings.json` carries
`"Bash(packages/intentionsutil/scripts/graph-commit:*)"` in `permissions.allow`
as a literal *prefix* match, so a `"$PROJECT_ROOT/…"` spelling falls through to
the auto-mode classifier — reintroducing exactly the classifier bypass #3136
exists to close. The alternative was absolutizing the call and reverting #3136's
fix. That lost because the real safety property is not the path spelling, it is
which repo the write targets, and `-C` is what controls that (`graph-commit`
resolves its root from `-C`/`--repo`, else cwd).

**Reversibility.** Cheap in code, but the doctrine gap is the durable part: the
skill body still tells the next editor to absolutize the call, which would
silently re-open the bypass. Amending `:926-931` to state the `-C`-compensated
exception is a one-paragraph edit.

**Confidence.** High on the mechanism (proved non-vacuous: removing `-C` from
SKILL.md turns 6b red while section 6 stays green, per `77bd7471`). Low on
whether leaving the blanket rule standing was right — this is the single item
most likely to bite someone later, and it is a doctrine call, not an
implementation detail.

### 1.2 — The bounds on the test-integrity carve-out were written by the executor, not stated by the author

**Decided.** The author's S-15 directive granted authority to bypass
`.claude/rules/test-integrity.md` "if the behavior change is the scope of the
PR", but stated no bounds. The executor wrote three preconditions and has been
operating under them.

**Done.** `plans/dispatch-rsi-batch-steering.md:206-215` records them as the
carve-out's operating rule, committed in `2cf56a50`:
1. the behavior change must be **what the PR is for**, not a side effect;
2. the replacement assertion must assert the new behavior **positively** and be
   **at least as strong**;
3. the commit must say plainly which assertion changed and why the precondition
   holds.

Every Tier 2 item below was gated on these three.

**Why.** An unbounded carve-out from a rule whose whole purpose is to stop
tests being weakened for convenience is indistinguishable from repealing it. The
alternative — treating the grant as unbounded and applying judgement per case —
lost because it leaves no auditable trail and no way for a reviewer to tell a
legitimate inversion from a suppressed signal. The three bullets are the
executor's reconstruction of the author's evident intent, not a quotation.

**Reversibility.** Free to change — it is plan prose. But four test suites have
already shipped under it (Tier 2), so relaxing or tightening it retroactively
would reopen those.

**Confidence.** High that bounds were needed. Medium that these are the right
three. Precondition 2 in particular ("at least as strong") is a judgement the
executor applied to itself with no external check.

### 1.3 — A document precedence order was declared, and one plan file was declared operatively binding

> **CORRECTED 2026-08-30 — the operative half of this entry is now obsolete, and
> its replacement was itself corrected.** See **§4.12** for the full sequence.
> Short version: the "1 of 7 transcribed" measurement is dead — the rulings
> landed on `origin/main` in `9201fdeb`, `4ffbc8b3`, `91bc7cc9`, `60dd2b54` and
> `1f5d0909`. `450c9b25` replaced the banner with "7 of 7 … NO LONGER
> operatively binding". `97fa10d6` then rescoped **that** to "**5 of 5
> node-homed** rulings", because Rulings 4 and 5 have no named node and were
> never in the measurement. **Ruling 4 still lives only in the plan file**, so
> the file is still operatively binding — for one ruling, not six.

**Decided.** Where a plan document and an `intentions/` node body disagree, the
node governs — with `plans/dispatch-rsi-author-rulings.md` overriding both. And
because only 1 of the 7 rulings from the 2026-08-29 sittings was actually
transcribed onto its node, that rulings file was declared **operatively binding**
for the other six, so it must be read alongside the nodes.

**Done.**
- Precedence stated in a warning block at the top of both plan documents:
  `plans/dispatch-rsi-sequence.md:15-24` and the matching block in
  `plans/dispatch-rsi-serialized-pr-plan.md`. Landed in `fc4ca3e9`.
- Transcription audit table: `plans/dispatch-rsi-author-rulings.md:12-32`,
  measured with `LC_ALL=C grep -ac '2026-08-29'` against each ruling's own named
  nodes. Result: Ruling 6 partial, Rulings 1/2/3/4/5/7 zero hits.
- The "each is transcribed onto its node" claim in the index was corrected in
  place: `plans/dispatch-rsi-sequence.md:80`.

**Why.** The recurring defect this batch surfaced is that binding rulings living
only in plan prose never reach a clean session — a session handed the node
bodies alone builds the un-ruled design. Declaring a plan file binding is
*itself* an instance of that defect, and was chosen deliberately as the lesser
harm: the alternative was leaving six rulings with no operative home at all
while transcription is owed. Ruling 5 (`:142-157`) is the author's own
instruction to transcribe; this is the interim state until it is discharged.

**Reversibility.** Self-cancelling by design — every transcription that lands
shrinks it. `9201fdeb` (current worktree HEAD, unmerged at time of writing)
discharges one of them onto `strategy-graph-native-dispatch`. *This claim rests
on the rulings file's own 2026-08-30 audit, not on a fresh read of the six
nodes, which a concurrent session was rewriting.*

**Confidence.** High on the measurement. Medium on the doctrine: "a plan file
can be binding" is precisely the norm this batch is trying to kill, and
asserting it — even temporarily — is a real concession.

### 1.4 — Repo-wide skill renames are ruled atomic, with compatibility aliases ruled structurally impossible

**Decided.** The three skill renames in this window transition atomically. No
compatibility aliases, not even transitional ones.

**Done.** `plans/dispatch-rsi-author-rulings.md:273` (decision D3(c)) and the
PR13 Scope section of the serialized plan
(`plans/dispatch-rsi-serialized-pr-plan.md:3276-3278` and the Position 10
callout at `plans/dispatch-rsi-sequence.md`, "the transition is **atomic, no
compatibility aliases**").

**Why.** An alias has no implementable mechanism: a skill's identity is its
directory name **plus** the `SKILL.md` frontmatter `name:` **plus** the Workflow
registration `name:`, so an alias necessarily means a duplicate registration,
which `.claude/rules/vendored-skills.md` treats as a defect. The alternative —
ship aliases for a deprecation window — lost on the ground that it cannot be
built, not on cost.

**Reversibility.** Cheap while PR13 is unbuilt (Position 10, not yet reached).
Expensive after: an atomic rename that lands and then needs aliases means a
second repo-wide pass.

**Confidence.** High on the mechanism claim. Medium on the consequence — an
atomic rename with no grace period means any caller this window missed breaks
silently, and `plans/dispatch-rsi-sequence.md` notes the repo has already been
bitten once by a rename orphaning `verify` fences.

### 1.5 — Verify-fence correction takes option (c), and this changes what "a green fence" means project-wide

**Decided.** Leave `dispatch-run-verification` alone. Correct each broken fence
**individually**, in place, on the node that owns it. Extend
`.claude/skills/dispatch-propagate/scripts/lint-verify-fence-paths.sh` to **WARN**
on the residual shapes it can detect mechanically. That is option (c) of three;
options (a) "harden the runner" and (b) "mass-rewrite the corpus" both lost.

**The measurement that decided it.** The obvious runner-side fix — add `set -e`
to the fence executor — fixes **ZERO** of the proved false PASSES. Both dominant
shapes are exempt from errexit by rule, not by accident: a command whose status
is inverted by `!`, and the left operand of `&&`/`||`. Re-measured directly for
this entry:

```
$ printf 'set -e\n! false\necho reached\nfalse && true\necho reached\n' | bash; echo rc=$?
reached
reached
rc=0
```

Every broken fence in the corpus is one of those two shapes, so `set -e` would
have shipped a fix that changed nothing while retiring the finding.

**The corpus count went UP, not down, when the sample was actually executed.**
The first sweep reported **3** confirmed false PASSES (`tactic-graph-ref-split`
x2, with 131 and 11 live violations, and
`tactic-reclaim-audit-journal-unit-filter` with 3). Four further blocks were
classified "AT-RISK" — i.e. *suspected*. When those four were run rather than
read, **all four were confirmed false PASSES**, taking the total to **7**
(`/tmp/claude-1000/fence-correction-spec-part2.md:25`, *"All four 'AT-RISK'
blocks are CONFIRMED FALSE PASSES, not at-risk"*). Reading a fence is not
measuring it.

**A new failure shape was named: Shape E, "laundered status."** A fence runs a
**deleted** file, bash prints `No such file or directory`, the fence itself
echoes `exit code: 127` into the log — and then **returns 0**, because the
status was captured into a string and never tested
(`fence-correction-spec-part2.md:57`, `:339`). The evidence of failure is
printed in full and the fence is green anyway. Shape E is *not* mechanically
detectable by the linter extension (`:892`), so it is corrected per-fence only.

**Why this is Tier 1 and not a bug fix.** It changes what a green `verify` fence
licenses a reader to believe. A `verify` block is the project's mechanism for
"this shipped and is proven"; seven of them were green over live violations, one
on a node that had reached `phase: done`. The standing instruction that follows:
**a green fence is evidence only once its polarity and its error path have been
exercised** — `rc 2` from `grep`, a missing path, and a `$?` captured into a
string all produce green.

**Reversibility.** Per-fence corrections are individually cheap and individually
reviewable — that is most of why (c) won over (b). The doctrine is the durable
part.

**Confidence.** High on the errexit measurement (re-run from scratch above).
High on 3 -> 7. Medium on option (c) over (b): (b) would finish faster, and (c)
leaves the corpus in a mixed state for as long as the conversion takes.

### 1.6 — The Lane 3 absolute-path rule is wrong; the call site it contradicts is right

> **STALE 2026-08-30 (3rd) — the verdict stands, the edit never landed.** This
> entry says *"The rule text is amended to carry the exception"* in the present
> tense. Re-measured on `origin/main` at `45af501f`: the blanket rule is
> **unchanged** at `SKILL.md:927-932` — *"Every helper script Lane 3 invokes must
> be invoked **by absolute path under `$PROJECT_ROOT`**, never by a relative
> `.claude/…` or `packages/…` path"* — with **no exception clause anywhere in
> that bullet**. The contradicting call is still at `:1482`. So §1.1's original
> reading (*"still contradicted, still unamended"*) is the one that describes
> `main` today, and §1.6 records a **decision taken, not a change shipped**. It
> is executor-owed, one paragraph, and it is the only entry in Tier 1 whose
> "Decided" outran its "Done".

**Decided.** `.claude/skills/dispatch-conflict/SKILL.md:927-931` states that
**every** helper script Lane 3 invokes must be invoked by absolute path under
`$PROJECT_ROOT`, *"never by a relative `.claude/…` or `packages/…` path."* Line
**`:1482`** invokes `packages/intentionsutil/scripts/graph-commit -C "$PROJECT_ROOT"`
— exactly the forbidden relative spelling. **Verdict: the call site is right and
the rule text is wrong.** The decided repair is to amend the rule text to carry
the exception and leave the call un-absolutized. **That amendment has not
landed** — this entry records a decision taken, not a change shipped, and the
present-tense phrasing it carried until the fourth pass overstated it. It closes
the doctrine gap §1.1 left open only once the edit is made; the edit is one
paragraph and is listed in "What is still owed".

**Measured 2026-08-30 on `origin/main` (`1f5d0909`).**
- Rule bullet: `SKILL.md:927-928` — *"Every helper script Lane 3 invokes must be
  invoked **by absolute path under `$PROJECT_ROOT`**, never by a relative …"*
- Contradicting call: `SKILL.md:1482` —
  `packages/intentionsutil/scripts/graph-commit -C "$PROJECT_ROOT" \`
- `.claude/settings.json:58` — `"Bash(packages/intentionsutil/scripts/graph-commit:*)"`

**Why the call site wins.** `permissions.allow` is a **literal prefix** matcher
over the command string as typed. Only a static `permissions.allow` hit resolves
at gate 1 and **skips the probabilistic auto-mode classifier**; a PreToolUse hook
`allow` does not. Absolutizing the call to `"$PROJECT_ROOT/packages/…"` breaks
the prefix, so the invocation falls through to the classifier — which is the
exact bypass PR #3136 (`a4a964b8`) was written to close. The rule's stated
rationale (a relative path resolves against whatever cwd the block has, possibly
the stale `$WT`) names a real hazard, but path spelling is not what controls it.

**The residual, stated rather than hidden.** `-C "$PROJECT_ROOT"` pins **which
repo is written**. It does **not** pin **which script text runs** — a relative
path still resolves against the invoking block's cwd, so under a cwd of `$WT` a
stale copy of `graph-commit` inside the worktree would execute, targeting the
right repo with the wrong code. That residual is accepted, not eliminated: the
write target is the safety property with teeth, and `graph-commit`'s own
`--base` compare-and-swap, bounded rebase-retry and landing lock are what make a
wrong-code run recoverable.

**Reversibility.** Prose-only; free to re-amend. But re-tightening the rule
without also re-spelling the call re-opens the classifier bypass, so the two must
move together.

**Confidence.** High on the mechanism (both the allow entry and the call site
read on disk; the ratchet test's section 6b proves the `-C` half non-vacuous by
mutation). Medium on the choice to amend the rule rather than pursue a settings
change that would make an absolute spelling matchable — that alternative was not
attempted.

### 1.7 — `path:line` anchors are to be DELETED, not corrected — and the ~50% measurement STRENGTHENS that

**Decided.** Stop writing bare `:NNN` anchors. Replace them with **quoted-snippet
anchors** — the symbol name, the exact quoted line, the enclosing block —
converted **per section, as each position executes**, never as a repo-wide sweep.

**The measurement, and the correction it forces.** The plan documents' standing
warning block (`plans/dispatch-rsi-sequence.md:5-13`) reports 8 dead of 8, 6 of
6, 11 of 12, 4 of 4 — 29 of 30, effectively total. A wider re-measurement puts
anchor rot at roughly **50%**, not near-total. **This document reproduced the
"near-total" framing in its own opening caution; that framing is CORRECTED
here.**

**Why 50% is the worse number.** At ~100% a reader stops trusting anchors
entirely and locates by content every time — the rot is self-announcing and costs
nothing but the search. At ~50% the anchors work often enough to *train*
spot-checking: a reader checks two, both land, and follows the third blind. A
partially-correct address is a worse instrument than a uniformly wrong one, so
the recommendation is **strengthened** by the lower number, not weakened.

**Live instance, produced by this document.** §1.1 cited
`.claude/skills/dispatch-conflict/SKILL.md:1486-1489` on 2026-08-30, verified on
disk that day. Re-measured the same day: the line is **`:1482`**. A one-day-old
anchor, in a document whose own opening paragraph warns about anchor rot.

**Why per-section and not a sweep.** `fc4ca3e9` already ruled against a mass
correction, on the ground that *"replacing stale-and-known-stale numbers with
fresh-and-trusted-wrong ones would be worse."* That reasoning holds against
*renumbering*; it does not hold against *deleting*, because a quoted snippet does
not rot when a file is edited above it. Converting at execution time means each
anchor is rewritten by someone who has just opened the file — the only moment the
replacement is both cheap and verifiable.

**Reversibility.** Free per section; the conversion is monotone.

**Confidence.** High on the mechanism and on the live instance. **Medium-low on
the ~50% figure itself, and this is a contradiction left standing rather than
smoothed:** the two measurements disagree by a factor of two and were taken over
different samples (the banner's four PR Scope sections vs. a wider sweep). An
independent spot-check for this entry could not arbitrate — sampling `path:line`
anchors out of both plan documents and testing only the mechanically decidable
cases (file absent, or line past EOF) yields a certainly-dead **lower bound** of
33% (`dispatch-rsi-sequence.md`) and 76% (`dispatch-rsi-serialized-pr-plan.md`),
with most anchors in-range and undecidable without content matching. **The
recommendation does not depend on which figure is right — it is correct at 50%
and at 97%.**

### 1.8 — Multi-word greps over re-emitted YAML frontmatter are void as verification

**Decided.** A prose-presence check against an `intentions/` node's frontmatter
must be **whitespace-normalized** before matching. Line-based `grep -c` over a
re-emitted scalar is not a valid instrument, and every verification command of
that shape is withdrawn.

**The mechanism.** `write-node.ts`'s YAML emitter **wraps long scalars** across
lines with a two-space continuation indent. A multi-word phrase that straddles
the wrap is present in the field and matches **zero** lines. Demonstrated for
this entry against `origin/main`:

```
$ F=intentions/tactic-reclaim-audit-journal-unit-filter.md
$ P='reads reclaim events with `journalctl --user -u dispatch-tick`'
$ git show "origin/main:$F" | LC_ALL=C grep -acF "$P"
0
$ git show "origin/main:$F" | tr '\n' ' ' | tr -s ' ' | LC_ALL=C grep -ocF "$P"
1
```

The text is present. The line-based count says it is absent. **This invalidated a
whole class of verification command used across several specs in this window** —
each read "0 hits" as "not transcribed" when the content was there. It is
directly implicated in the "1 of 7 rulings transcribed" measurement corrected at
§4.12, alongside its case-sensitivity sibling recorded in the same banner.

**The replacement, and its one exception.** Whitespace-normalized counting
(`tr '\n' ' ' | tr -s ' '`) replaces prose-presence checks. It must **not**
replace the line-based form for **mark censuses** — counting occurrences of a
marker such as `Verifiability: WAIT`. Normalizing there un-wraps a scalar that
merely *mentions* the marker onto the same line as a real one, inventing a
phantom mark. The rule: **normalize when asking "is this text present"; stay
line-based when asking "how many marks are there".**

**Reversibility.** Free — it is a method, not a change to the tree.

**Confidence.** High. Mechanism reproduced from scratch above, in both
directions.

### 1.9 — Ruling 4 has a node home, and its BOUND is the half that was missing everywhere

**Decided.** Ruling 4's delegated authority — the executor may clear a park whose
stated blocking premise is verifiably dead — was transcribed onto
`strategy-graph-native-dispatch` **together with the bound that limits it**, and
the bound was then applied against a live proposal, which it refused.

**The bound, quoted from the node** (`intentions/strategy-graph-native-dispatch.md`,
a `clarifications` entry in frontmatter — read on `origin/main` at `45af501f`):

> BOUND, and it is the whole of the delegation: a DEAD PREMISE is not a DEAD
> SCOPE. This entry authorizes clearing a park whose stated blocking premise no
> longer holds; it does NOT authorize making a node selectable whose SCOPE is
> dead or whose park is the only stop on a bad automated action. Where
> clear-park is the wrong instrument — a `phase: null` node whose work already
> shipped, which clear-park makes router-eligible rather than terminal — the
> correct act is the completion record (`phase: done`), never the clear.

**Why this is Tier 1 and not bookkeeping.** That second sentence appeared in **no
plan document at all** — measured, both line-based and whitespace-normalized,
across all four `plans/dispatch-rsi-*.md` files: zero hits for *"dead premise is
not a dead scope"*, *"clear-park is the wrong instrument"* and *"completion
record, never the clear"*. The plan files carried the **grant** and not the
**limit**. A session reading only the grant clears parks the ruling forbids
clearing.

**And that is not hypothetical.** The one place the ruling was cited as authority
to clear a park was **exactly the case the bound forbids** — a `phase: null` node
whose work had already shipped, where `clear-park` would have made it
router-eligible again and re-dispatched a measurement that was already done. The
correct act there is the completion record. Applying the bound prevented the
re-dispatch.

**Reversibility.** The transcription is prose on a node; free to re-word. The
prevented re-dispatch is unrecoverable in the good direction — the work was not
redone.

**Confidence.** High on the text (read on the node, on `origin/main`). High that
it was absent from `plans/` (searched two ways per the trap-2 rule). See **§4.12
correction** for the fact that the rulings file still claims Ruling 4 has no node
home; that claim is now false on `main`.

### 1.10 — A strategy carrying a `phase` is a MALFORMED STORE, not a stale selection

**Decided.** Reclassified from exit 12 ("stale selection, nothing is wrong,
re-evaluate") to a **throw**, which the CLI maps to **exit 2** (config-class
error). Routed through the schema's own `checkKindTypedFields` so rule 12 stays
single-homed rather than restated in the gate. Landed in `d1fef042` (#3143).

**This decides a finding an earlier commit deliberately DEFERRED, and the
deferral's premise was false.** `639ddb64` recorded the guard as *"unreachable in
production"*, which made deleting it an author judgement call. Measured: rule 12
(`phase` is tactic-only) is enforced **only in `validateGraph`**, and
`graph-commit` never runs `validateGraph`; `validateNode` accepts the node. So a
strategy carrying a `phase` really does land on `main`. The selector's strategy
arm never reads `phase`, so `strategyAlignSelectable` still returns `true` — with
the guard neutered the gate exits 0, emits a scope fingerprint, provisions a
worktree and launches an `/align-tactics` worker **against a corrupt node**.

**Why a throw and not a repair-in-place.** No benign path produces a strategy
with a phase. Exit 12 invites the caller to re-evaluate and carry on; that is the
wrong invitation for a store that cannot be trusted. Exit 2 stops the lane. The
alternative — keep exit 12 and let the caller re-poll — lost because it converts
a data-integrity failure into a scheduling hiccup, which is how it stayed
invisible in the first place.

**The honest limit, recorded rather than buried.** The live store measures clean
— 751 nodes, 0 kind-typed violations, all 58 strategies `phase: null` — so this
fix is **inert on real data today** and its new exit-2 path cannot be exercised
against a genuine corrupt node. Confidence **medium-high, not high**.

**Reversibility.** Cheap; a one-branch change with a rewritten test (§2.10's
sibling — see Tier 2 note under §2.10).

**Confidence.** High that the deferral's premise was false (three-step mechanism,
each step read in code). Medium-high on the classification itself.

### 1.11 — Delegated authority covers implementation details; it does NOT settle a parked question

**Decided.** The fleet-alarm work (§5.23) was executed as **step 1 only**. Step 2
— aligning `dispatch-fleet-alarm`'s no-op comparison to `splice_body`'s
conservative rule — was **deferred to its own tactic** rather than folded in,
because it edits one of the **three code sites named in a currently-parked node's
open question**.

**Measured on `origin/main` at `45af501f`.**
`intentions/tactic-autonomous-body-write-wholesale-replace.md` is `phase:
implement` with a **live** `office_hours` park. Its park reason reads: *"The
copy-paste this node exists to eliminate still sits at three sites
(`dispatch-eval-finding`, `dispatch-fleet-alarm`,
`dispatch-invalid-state-followup`)"*, and its recommendation opens *"Pick one of
three…"* — i.e. whether those three copies survive as a deliberate choice is the
**question the park exists to hold open**. Step 2 edits one of them.

**The bound this states.** S-16 grants the executor every judgement call the work
needs. It does not grant the executor the right to **pre-empt a park** by editing
the surface the park is holding — that decides the parked question by fait
accompli rather than by ruling. The distinction: implementing inside a settled
scope is delegated; narrowing the option set of an open, parked decision is not.
Deferring step 2 costs one extra tactic; taking it would have quietly removed one
of the three dispositions the parked node offers.

**Reversibility.** Free — nothing was built. The deferral is a sequencing choice,
not a refusal; step 2 remains correct and remains owed.

**Confidence.** High on the mechanism (park read on the node, three sites named
verbatim). Medium on the bound itself — it is the executor's own reading of where
S-16 stops, and a reasonable reader could call step 2 an implementation detail.
This is the entry in this pass most likely to be disagreed with.

### 1.12 — The fleet-alarm migration is scoped by KIND, not by NAME PREFIX

**Decided.** Wrap **four** node bodies in the generated marker region, not the
eight §5.23 measured. Landed in `61cdca5d`: `tactic-fleet-alarm-busy-stall`,
`-daemon-degraded`, `-unclaimed-hold`, `-watch-unknown`.

**Why the other four are excluded, measured.** `dispatch-fleet-alarm` carries its
alarm kinds as an explicit enum —
`KINDS=(tick-stale daemon-degraded busy-stall automerge-suppressed unclaimed-hold main-checkout-held watch-unknown heal-fired heal-unknown)`
— and refuses any id outside it (`exit 64`, twice: a membership test and an
anchored id regex). Of the eight `tactic-fleet-alarm-*` files on `origin/main`,
**four are not in that enum at all**: `-daemon-casualty-list`,
`-mint-rollback-corruption`, `-node-park-clobber-loop`, `-resolve-rollback-latch`.
They share a name prefix and nothing else. Each of the four says so in its own
`rationale` — `-node-park-clobber-loop`'s reads *"Not auto-created by
dispatch-fleet-alarm — a session-authored finding"*; the other three record a
`/align` ruling carrier, a live incident investigation, and a journald
observation.

**The harm avoided, stated plainly.** The marker pair means *"everything between
these lines is machine-generated and may be rewritten wholesale on the next
tick."* Wrapping those four would have **labelled human plans as machine output**
and armed the next refresh to overwrite them — which is precisely the defect
§2.2's owned-region change was built to prevent, re-introduced by a migration
performed in its name. A name-prefix census is the wrong instrument for a
question about provenance.

**Reversibility.** Four graph writes; each reversal is its own `graph-commit`, so
cheap but not free. The exclusion is the durable part.

**Confidence.** High. The enum is read from the script, the eight files
enumerated on `origin/main`, and each excluded node's own rationale read
individually.

### 1.13 — §1.8's replacement instrument is itself void on markdown blockquotes

**Decided.** §1.8 withdrew line-based `grep` for prose-presence checks and
prescribed whitespace normalization (`tr '\n' ' ' | tr -s ' '`) in its place.
That replacement has a second blind spot, found by using it, and the rule is
extended: **strip blockquote markers before normalizing.**

**The mechanism, reproduced against `origin/main`.** A markdown blockquote
repeats `> ` on every wrapped line. Normalizing whitespace leaves the `>` in the
stream, so a phrase that wraps inside a quote still matches nothing:

```
$ F=plans/dispatch-rsi-batch-steering.md
$ P='without me providing approval'
$ LC_ALL=C grep -acF "$P" "$F"                                   # line-based
0
$ tr '\n' ' ' < "$F" | tr -s ' ' | LC_ALL=C grep -acF "$P"       # §1.8's method
0
$ sed 's/^> \{0,1\}//' "$F" | tr '\n' ' ' | tr -s ' ' | LC_ALL=C grep -acF "$P"
1
```

The raw text at `:226-227` is:

```
> remember: filing for ratification means you do the thing without me providing
> approval, and then just note it for me to review later
```

**Why this is Tier 1.** The sentence §1.8's own instrument reports as absent is
**the governing rule of this entire document** — the one quoted at the top and
restated three times. An instrument that cannot find its own charter is not a
marginal defect. It also means every §1.8-style "not present in `plans/`"
finding taken during this window over blockquoted prose is **unsafe in the
absent direction** and would need re-running; the plan documents state rulings in
blockquotes as a matter of house style, so the exposure is not incidental.

**The rule, now three-clause.** Normalize when asking *"is this text present"* —
**and strip `^> ?` first when the source is markdown**. Stay line-based when
asking *"how many marks are there"* (§1.8's mark-census exception, which this
does not touch).

**Reversibility.** Free — a method, not a change to the tree.

**Confidence.** High. Reproduced in all three directions above, on a file on
`origin/main`, against a sentence known independently to be present.

---

## Tier 2 — test assertions deliberately inverted or rewritten

Five inversions, four pure additions, one deliberate refusal, one red outcome
accepted as red. **In every case the count went UP or stayed level by rewrite;
none went down, none went level-by-deletion, and no fence was edited to stop
making a true claim.**

| # | Suite | Before | After | Shape |
|---|---|---|---|---|
| 2.1 | `test-review-fix-write-surface-guard.sh` | 22 | **27** | 1 case inverted, split into 2, then 1 added (§5.24) |
| 2.2 | `test-dispatch-fleet-alarm.sh` | 111 | **116** | 5 retargeted + 1 new case |
| 2.3 | `test-dispatch-conflict-lane3-cwd-ratchet.sh` | 18/19 | **21/21** | expectation changed + new section |
| 2.4 | `test-assert-node-selection.sh` | 12/13 | **16/16** | 1 case retargeted, split into 2 |
| 2.5 | `test-mint-mainqa-nodes.sh` | 14 | **15** | pure addition, no inversion |
| 2.6 | `reader-required-dir.test.ts` | — | — | **inversion refused**; unit rescoped |
| 2.7 | `lib-claude-agents.sh` coverage | 0 | **+1 (owed)** | **test added**, fence NOT weakened |
| 2.8 | `tactic-reclaim-audit-journal-unit-filter` fence | false PASS | **RED** | corrected fence left red on purpose |
| 2.9 | `test-lint-verify-fence-paths.sh` | **12** empty-output asserts | 44 → **53** | atomicity constraint — landed `45af501f` |
| 2.10 | `test-graph-commit.sh` case 52 | 124 (**"parks"**) | 124 (**"lands"**) | inverted, rewritten not deleted, count level |
| 2.11 | `check-node-selection.test.ts` + `merge-node-cli.test.ts` | 1 case (exit 12) | **2 cases + 1 new file case** | expectation inverted; spawn-not-import |

### 2.1 — `test-review-fix-write-surface-guard.sh`, 22 → 27

> **CORRECTED 2026-08-30.** This entry recorded the suite at **25/25**. It is now
> **27/27**: `f2dd808d` added **Test 6c** and `97fa10d6` rewrote the guard's own
> contract paragraphs, both on `origin/plan-reconciliation`. See **§5.24**. The
> inversion described below is unchanged; only the count and the guard's internal
> ordering moved.

> **CORRECTED 2026-08-30 (3rd) — provenance only.** `245da5bc`, `f2dd808d` and
> `97fa10d6` are **no longer reachable from any ref**: PR #3141 squash-merged as
> `12716163` and PR #3142 as `35ab0e45`, and both branches were deleted. The
> 27/27 figure is unaffected — `8fe1d359`'s post-merge verification table
> re-reports it against `main`. See the third-pass banner at the top.

**Old assertion (test 6).** Pre-existing tracked dirt in the baseline is
**ignored** by the write-surface guard.

**New assertions.** 6a — pre-existing tracked dirt is **refused outright**,
naming the path and its status. 6b — an untracked (`??`) stray present in the
baseline is **still ignored**.

**Done.** `245da5bc` (on `origin/retro-code-review-batch`, PR #3141).
Guard file `.claude/skills/dispatch-propagate/scripts/review-fix-write-surface-guard.sh`.
Header rewritten in `22f438a6` to record the tightening and instruct against
reverting it.

**Why.** The old property was unsound and was the vulnerability: `comm -13` over
two whole `git status --porcelain` snapshots sees only new *lines*, and a path
already modified keeps a byte-identical status line when modified again, so it
was never inspected. Measured consequence: a subagent steered into flipping
`phase: done` on an already-modified `intentions/` node passed the guard and
would have been pushed to `main`. Status comparison alone cannot catch it either
(`' M'` → `' M'` is unchanged). The alternative — keep test 6 and leave the hole
— lost outright; this is the guard whose entire job is to stop unauthorized
writes.

**Precondition check (S-15).** Holds. Closing this hole *is* what the change was
for; the replacement is strictly stronger (refuses a case the old one admitted)
and the still-correct half was preserved rather than dropped.

**Reversibility.** Cheap — a self-contained bash guard plus its suite.

**Confidence.** High. The old assertion was demonstrably wrong, not merely
inconvenient.

### 2.2 — `test-dispatch-fleet-alarm.sh`, 111 → 116

**Old assertions.** Five cases read the generated alarm reading out of the
node's **whole body**, i.e. they encoded that the generated reading *is* the
whole body.

**New assertions.** The same five read through a new `body_region` helper
scoped to the owned marker region; plus new **case 4b** asserting directly that
a human's heading and text written into a node **survive** a refresh that
rewrites the reading.

**Done.** `b616fe21` (on `origin/retro-code-review-batch`, PR #3141), against
`dispatch-fleet-alarm`'s `splice_body`.

**Why.** `splice_body` replaced everything after the closing frontmatter fence.
That was safe only while re-detection could not land on a node a human had
written in — and it can: a parked alarm node (`office_hours` non-null, phase not
`done`) classifies `open`, routes through the refresh path, and the usual reason
such a node is parked is that a human is looking at it. Their diagnosis was
discarded on the next tick and the discard was pushed to `main`. Two ways to
reconcile the guard comment's claim that "nothing is lost by waiting": narrow
the claim, or make it true. **Making it true won** — same cost, better design,
and it reuses `dispatch-eval-finding`'s existing marker-pair contract rather
than inventing one.

**Precondition check (S-15).** Holds — with a caveat worth naming: this finding
was originally *deferred* for ratification in `245da5bc` ("choosing between them
is a design call rather than a defect repair. Filed for ratification"), which
S-16 identifies at `plans/dispatch-rsi-batch-steering.md:239-246` as the exact
error S-16 was issued to correct. The fix then followed.

**Reversibility.** Moderate. The marker pair is now a data contract on any alarm
node written after it; a node written before the region existed is handled by a
whole-body fallback in the identity gate, so a revert would not corrupt
existing nodes but would resume discarding human content.

**Confidence.** High on the defect (the discard was observed in the log). High
on the remedy (it is a copy of a shipped sibling contract, guards included:
unbalanced/inverted pairs refused, a reading carrying a marker line refused,
END-guard against silent truncation).

### 2.3 — `test-dispatch-conflict-lane3-cwd-ratchet.sh`, 18/19 → 21/21

**Old assertion.** No relative helper invocation may appear in a Lane 3 fenced
block — with no exceptions.

**New assertions.** Section 6 exempts `packages/intentionsutil/scripts/graph-commit`
by name; new **section 6b** requires every fenced `graph-commit` to carry
`-C "$PROJECT_ROOT"` on the same line; and a companion assertion at `:179` fails
if Lane 3 ever stops invoking `graph-commit`, so the carve-out cannot rot into a
vacuous pass.

**Done.** `77bd7471` (#3140), merged. Verified on disk 2026-08-30 at
`.claude/skills/dispatch-propagate/scripts/test-dispatch-conflict-lane3-cwd-ratchet.sh:151-183`.

**Why.** See Tier 1 §1.1 — this is that item's test half. The ratchet's own
header contemplates the case where an expectation legitimately changes. The
*property* is unchanged: what actually keeps the write off the block's cwd is
`-C`, not the path spelling.

**Precondition check (S-15).** Borderline. The behavior change was **not** the
scope of PR #3140 — this was a pre-existing red `main` break folded in. It
qualifies on the narrower ground that the assertion was pinning a rule the repo
had already deliberately departed from in #3136, and the replacement is strictly
stronger (2 net assertions plus a non-vacuity guard, and the previously *failing*
case now passes for a stated reason).

**Reversibility.** Cheap in the suite. The doctrine half (§1.1) is what carries.

**Confidence.** High on the mechanism, proved non-vacuous by mutation. **Medium
on the precondition** — this is the one Tier 2 item where the S-15 gate was met
by argument rather than plainly.

### 2.4 — `test-assert-node-selection.sh`, 12/13 → 16/16

**Old assertion (test 5).** Pinned `readParked`'s `attributes.office_hours`
squatter fallback.

**New assertions.** 5a — the retired reader's inverse: the squatter is
**invisible** to the park gate. 5b — the property at its new home: the real
`validate-graph.ts` refuses the same on-disk fixture with the rule-23 error,
naming node and field.

**Done.** `77bd7471` (#3140), merged.

**Why.** PR #3138 (`96d22cb1`) deleted all six squatter-aware readers from
`check-node-selection.ts` and retargeted the vitest sibling, but missed this
shell suite. The test was stale; the code was right. The guarded property did
not vanish — it moved up a layer and got *stronger*: rule 23 bans any
`attributes` key shadowing a first-class field, with **presence** as the
violation, so a squatter-parked node cannot land at all. Deleting test 5 was the
alternative and lost: retargeting keeps the coverage.

**Precondition check (S-15).** Holds. Both new cases mutant-tested; nothing
weakened, skipped or deleted.

**Reversibility.** Cheap.

**Confidence.** High.

### 2.5 — `test-mint-mainqa-nodes.sh`, 14 → 15 (addition, listed for completeness)

`b01341a1` added harness case 10 covering `assertSingleLine`'s rejection of
newline-bearing item fields at the mint payload edge. Mutation-tested: with the
guard commented out, the case fails and the node lands carrying an injected
`## needs-main` heading. **No existing assertion was touched** — recorded here
only so the Tier 2 census is complete.

### 2.6 — `reader-required-dir.test.ts` — inversion deliberately REFUSED

**Decided.** PR16 Unit 9 as scoped required inverting a currently-passing,
deliberately-authored assertion that an existing, caller-named, **empty** store
is a legitimate graph. The executor refused and rescoped the unit instead.

**Done.** `plans/dispatch-rsi-author-rulings.md:294-314` (decision D4);
`plans/dispatch-rsi-sequence.md:389-397`;
`plans/dispatch-rsi-serialized-pr-plan.md:4129`, `:4143`. Unit 9 now ships only
the half that weakens nothing: correct the `validate-graph.ts:111` comment —
which is the thing that is actually wrong — and print
`ok — 0 nodes (store is EMPTY at <resolved absolute path>)`. A case pinning the
new output is **added** alongside the existing assertion.

**Why.** Beyond the test-integrity bar, the substance went the same way: the
vacuous-pass class PR1 Unit 8 was chasing is already closed by its own change (a
*missing* directory exits 2), and an empty-store error would break graph
bootstrap in a fresh instance repo, which is a supported case. The S-15
carve-out did **not** apply, because the behavior change was not what the PR was
for — it was a side effect discovered while doing something else, which
precondition 1 excludes.

**Confidence.** High. This is the clearest demonstration that the carve-out is
being read narrowly rather than as a general escape hatch.

### 2.7 — `claude_job_id_for_name_all` has ZERO test coverage and its node's fence claims otherwise: ADD THE TEST

**Decided.** `claude_job_id_for_name_all` ships in production and has **never**
been covered by any test — not now, and not in the pre-split monolith. Its owning
node is `phase: done` and its `## Verification` section opens *"Both units are
covered by the repo's single monolithic shell test suite."* That sentence is
false. **The decision is to add the test, not to edit the fence to stop claiming
coverage.**

**Measured 2026-08-30 on `origin/main` (`1f5d0909`).**
- Definition: `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:765`.
- Production call site: `.claude/skills/dispatch-propagate/scripts/office-hours:164`
  — `claude_job_id_for_name_all "$1" 2>/dev/null || true`, inside
  `job_id_for_name()`, which feeds `attach_session_by_name`.
- Coverage: `git grep -ln 'claude_job_id_for_name_all' origin/main -- '*test*'`
  returns **nothing**.
- Ever covered: `git log --all -S'claude_job_id_for_name_all' -- '*test*'`
  returns **nothing**. Never, at any commit, on any branch.
- The false claim: `intentions/tactic-graph-node-session-reap.md:307`, under
  `## Verification`, on a node whose frontmatter reads `phase: done`,
  `office_hours: null`.

**Why add rather than amend.** Amending the fence to say "unit 2a is not covered"
would make the document honest and leave the production path untested — trading a
false claim for a true one about a real hole, at the cost of the only thing that
would have caught the hole. `.claude/rules/test-integrity.md` bars weakening a
test to make a signal go away; the same logic applies to weakening the *claim* a
fence makes. The function is a thin `claude agents --json` + `jq` wrapper with a
documented no-argument refusal path, so the test is cheap.

**Note on why the hole survived.** The `--all` variant was added as retained
surface when the rest of its parent unit was cut (`tactic-graph-node-session-reap`
items 2a and the retained-surface paragraph at `:385`). Coverage travelled with
the cut work; the retained function arrived uncovered and the fence's blanket
"both units are covered" sentence papered over it.

**Reversibility.** Adding a test is monotone. **Confidence.** High — the
never-covered claim is proved by `git log -S` over all history, not by a
point-in-time grep.

> **RE-CONFIRMED 2026-08-30 (3rd), and the test is still owed.**
> `git grep -ln 'claude_job_id_for_name_all' origin/main -- '*test*'` returns
> nothing on `45af501f`. The seven files that do reference it are one script
> definition, one production call site, one reference doc and four node bodies —
> no test among them. Coverage is still **zero**, and the false `## Verification`
> claim is still on a `phase: done` node.

### 2.8 — A corrected fence that comes out RED is a reportable outcome, not something to fix green

**Decided.** `intentions/tactic-reclaim-audit-journal-unit-filter.md` is
`phase: done` and shipped behind a `verify` fence that never held. When the fence
is corrected it goes **RED**. Per `.claude/rules/test-integrity.md` the fence
**stays red** and the red is reported. It is not re-weakened, not `# skip`-ed,
and the node is not quietly re-parked to hide it.

**Measured.** The node is `phase: done` / `office_hours: null` on `origin/main`.
The fence body at `:402` is:

```
! grep -rn 'journalctl.*-u dispatch-tick' .claude/
```

`grep -rn` over `.claude/` returns **rc 2** (it hits 8 unreadable/phantom
entries) while still printing 3 matches; `!` maps rc 2 to 0 and the fence passes.
The corrected form (`git grep`, explicit rc check, explicit empty-output check)
returns **rc 1** and prints the 3 hits. That is the shipped state: `phase: done`
reached behind a gate that never evaluated.

**One refinement, measured for this entry and worth stating because it changes
the severity, not the decision.** All three surviving hits are **prose, not
functional call sites**:

- `.claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh:510` — a `#`
  comment describing what an operator would see.
- `.claude/skills/qa-fix/references/needs-main-followups.md:64` — a documented
  observation recipe.
- `.claude/skills/qa-main/SKILL.md:503` — a quoted error string inside prose.

So the fence's *stated intent* — *"Confirm no functional `-u dispatch-tick` site
survives anywhere"* — appears to **hold**, while the fence as corrected is red
because its `grep` matches comments and documentation. This is the known
`consumer-count-grep-matches-prose-comments` class.

**What that does and does not license.** It does **not** license editing the
fence to pass. The correct disposition is to report the red with this diagnosis
attached, so the author sees both facts: the node shipped ungated, *and* the
property it was supposed to gate is not visibly violated in code. Narrowing the
grep to exclude prose would be a substantive judgement about what counts as a
"functional site" — a call that belongs in the open, on the node, not folded into
a fence repair.

**Reversibility.** The red is a report, not a state change. **Confidence.** High
on the false PASS (measured two ways). High on all three hits being prose (read
individually). Medium on whether the underlying property is genuinely clean — a
prose-only reading of three matches is not a proof that no functional site exists
elsewhere under a different spelling.

> **RE-CONFIRMED 2026-08-30 (3rd), unchanged.** On `origin/main` at `45af501f`
> the node is still `phase: done` / `office_hours: null` and the fence body is
> still the bare `! grep -rn 'journalctl.*-u dispatch-tick' .claude/` at `:402`.
> Nothing about this entry moved, including the report that is owed.

### 2.9 — The verify-fence linter patch is NOT self-contained: its test must land in the same commit

> **CORRECTED 2026-08-30 (3rd) — it landed, atomically, and one number here was
> wrong.** The patch is on `origin/main` as **`45af501f`** (#3145), and both
> files moved in **one commit** exactly as this entry required —
> `lint-verify-fence-paths.sh` +378 and `test-lint-verify-fence-paths.sh` +285,
> nothing else. So the closing sentence below (*"the patched linter does not
> exist in any committed tree"*) is now false.
>
> **The count is corrected from 11 to 12.** Re-measured on `45af501f^`:
> `LC_ALL=C grep -c '"" "$OUT"'` returns **12**, and #3145's own body says 12.
> The "11" here was one low.
>
> **The "6 WARN lines" figure — flagged Medium here — is CONFIRMED**, and the
> three predicted gates were reproduced rather than predicted: unmodified suite
> vs unpatched linter **44/44**; vs the patched linter **alone** **43/44**,
> failing `noisy tokens print nothing` on exactly 6 WARN lines; with the
> `run_lint`/`run_lint_warn` split, **53/53**. The self-deadlock this entry
> predicted was real and was measured, not argued.

**Decided.** The `--warn` extension to
`.claude/skills/dispatch-propagate/scripts/lint-verify-fence-paths.sh` and the
matching change to `test-lint-verify-fence-paths.sh` **land in one commit**. They
cannot be split across two, and the linter change must not be pushed alone even
transiently.

**Why — measured on `origin/main`.** The suite's `run_lint` helper captures the
linter's stdout **and stderr merged** into `$OUT`
(`test-lint-verify-fence-paths.sh:69`, `… --baseline "$baseline" 2>&1`), and then
asserts that `$OUT` is the **empty string** on every case the linter is supposed
to pass:

```
assert_eq "existing fence path prints nothing" "" "$OUT"
```

That exact assertion form appears **11 times** in the suite. The extension emits
WARN lines to stderr on shapes that are legal (exit 0) but suspicious — the
fixture corpus produces **6** such lines — so every one of those 11 assertions
sees non-empty `$OUT` and fails. A commit carrying the linter without the test
turns CI red on a change that is behaving exactly as designed.

**Why this is worth a numbered entry.** It is a general trap in this repo's shell
suites: `2>&1`-merged capture plus an empty-string assertion silently converts
"prints a warning" into "fails the suite". Any future linter that gains an
advisory channel meets the same wall. The remedy is not to send WARN somewhere
else — stderr is correct for an advisory — but to move the assertion and the
emitter together.

**Reversibility.** Free before the commit; a red `main` after it. **Confidence.**
High on the mechanism and on the 11 assertions (counted on `origin/main`).
**Medium on the "6 WARN lines" figure** — that is the batch coordinator's count
against the fixture corpus and was not independently re-run here, since the
patched linter does not exist in any committed tree.

### 2.10 — The list-entry removal guard was DELETED and its assertion inverted from "parks" to "lands"

**Decided.** Delete `graph-commit`'s interim list-entry removal guard outright
and let the base-aware three-way merge handle the case. Landed **`8fe1d359`**
(#3144); `graph-commit` 4222 → 4098 lines. This discharges the outstanding item
this tier carried (see the struck note below).

**Why the guard was wrong, not merely redundant.** It refused a far-ahead
list-entry removal and **parked** it, on the premise that the three-way list
merge could not tell *"ours dropped an entry"* from *"theirs never had it."*
`threeWayList` distinguishes exactly that — it is what the function is for — so
the guard was refusing the case its own replacement handles correctly. Both
helpers it used have no caller outside it, and `threeWayList` drops exactly the
guarded set. Verified on `origin/main`: no `list-entry` string survives anywhere
in `graph-commit`.

**The behavior change, named as `.claude/rules/test-integrity.md` requires.**
Case 52 previously asserted that a far-ahead list-entry removal **parks**. It now
asserts the same input **lands**. The assertion is **rewritten, not deleted**,
and the rewrite is positive and strictly stronger — `rc == 0`; `office_hours`
**absent** as an affirmative landed signal; the guard's own note absent; the
concurrent writer's edit preserved and HEAD restored. **Assertion count is 124
under both behaviors**, so the rewrite occupies the same single slot rather than
trading coverage for green.

**Proven red, not assumed.** The unpatched `graph-commit` was exported via
`git archive`, **only** the patched test overlaid, and the suite run:
`passed: 123  failed: 1`, the single failure being case 52 with the guard
visibly firing — `rc 1`, the landed node carrying `office_hours: {reason:
"graph-commit: mechanical-unresolved …"}`, and the guard's note `list-entry
removal vs. concurrent edit` present verbatim.

**The honest limit, recorded because the spec claimed otherwise.** The new
`main_tree52` check was presented as *only* expressible on a landing path. **It
is not** — the property holds on the parking path too, because `graph-commit`
rebuilds the edit on an `intentions/`-only base, so the parking commit carries no
code file either. **One of the four assertion legs adds coverage, not
discrimination.** The red proof rests on the other three routing legs. Also
recorded: the spec's assertion-count baseline of 116 is wrong (the suite has
124), and both figures it gives for `blob_sha_or_empty` are wrong (9 references,
not 8; 7 call sites, not 6) — immaterial, since both errors only strengthen "do
not delete it", but neither number is right.

**Precondition check (S-15).** Holds plainly, and this is the carve-out's named
first application. The behavior change *is* the scope of the PR; the replacement
asserts more; the commit says which assertion changed and why.

**Deliberately excluded, still owed.** The paired graph landing amending
`tactic-graph-commit-direct-three-way-merge`, whose plan text says *"Never
reimplement it"* about a function this deletes — landed separately as
`a1e7b0e6`. And a separate `resolve-hold` follow-up.

**Reversibility.** Restoring 126 deleted lines is mechanical; restoring the
*park* behavior would re-break the case. **Confidence.** High — mutation-proved
in both directions, with the non-discriminating leg named rather than counted.

### 2.11 — Two regression tests added where the existing suite structurally could not see the defect

**Decided.** Both fixes in `d1fef042` (#3143) ship with a test **proven to fail
against a reverted copy of its subject**, and in one case the test had to break
the file's own convention to be capable of failing at all.

**`merge-node-cli.test.ts` — spawn, do not import.** Every other test in that
file imports `mergeNodeFiles` directly, and **none of them can observe the
defect**: it lives in the CLI's exit path and only appears when stdout is a pipe
(§5.26). The new case spawns the script. That is a deliberate departure from the
file's convention, made because the convention is what hid the bug.

**Two earlier versions of that test were VACUOUS and are recorded in the commit
message so the next person does not repeat them** — this is the part worth the
author's eye:

- at **~73 KB** the test **passed against the buggy script** (barely over the
  pipe buffer, so the write completes before `process.exit()` fires);
- at **~2.2 MB** it **failed against the fixed script** for an unrelated reason
  (`spawnSync`'s `maxBuffer` defaults to 1 MB and kills the child, which
  masquerades as the bug under test).

A payload that is too small proves nothing and a payload that is too large proves
the wrong thing. Only the 1 MB middle discriminates.

**`check-node-selection.test.ts` — the exit-12 case rewritten, not removed.** It
becomes **two** cases: the throw (§1.10), plus a **new** assertion that the pure
selector still admits the same node — which is what pins *why the guard cannot
simply be deleted*. Nothing was weakened; the file gained a case.

**Precondition check (S-15).** Holds for the rewrite: the behavior change is what
#3143 is for, the replacement asserts positively, and the commit names it.

**Reversibility.** Monotone — tests added. **Confidence.** High.

### ~~Outstanding, and executor-owed — not author-owed~~ — DISCHARGED 2026-08-30 (3rd)

> **DISCHARGED.** This note recorded S-15's first application as **not done**.
> It was done: **`8fe1d359`** (#3144) deleted the guard and inverted case 52.
> See **§2.10**. Re-measured on `origin/main` at `45af501f`: `LC_ALL=C grep -c
> 'list-entry'` over `packages/intentionsutil/scripts/graph-commit` returns
> **0** — the guard, its park text at the two former sites, and both
> single-caller helpers are gone. The paragraph below is kept for the record of
> what was owed and why it was deferred; it no longer describes `main`.

`plans/dispatch-rsi-batch-steering.md:217-222` names S-15's **first
application**: deleting `graph-commit`'s interim list-entry removal guard and
rewriting the "far-ahead list-entry removal" case in `test-graph-commit.sh`.
**It has not been done.** Verified on disk 2026-08-30: the guard is still at
`packages/intentionsutil/scripts/graph-commit:1189`, labelled *"List-entry
removal guard (interim, now REDUNDANT — pending removal)"*, with its park text
still live at `:1319` and `:1842`. `49a133b2` deferred it deliberately, wanting
it as its own change against the single main-landing primitive rather than
folded into a retro-review batch. **This is work the executor owes, not a
decision waiting on the author.**

---

## Tier 3 — items requiring an action the executor genuinely cannot perform

**EMPTY.**

This tier was expected to have at least one member — making `hook-tests` a
required status check on GitHub ruleset `12884700`, on the assumption it needed
repo-admin rights the executor lacks. **Measured 2026-08-30 and the assumption
is false:** `gh api repos/natb1/commons.systems --jq .permissions` returns
`{"admin": true, "maintain": true, "push": true}`. The executor has admin. That
item is self-serve and has moved to Tier 5 §5.12, where its only real constraint
— an ordering precondition — is recorded.

Every other candidate was re-tested against the same bar: *is there concrete
evidence the executor cannot do this — a measured permission denial, a missing
credential, a physical-world action?* None produced such evidence. The
`.claude/skills/` read-only failures in `245da5bc` and `49a133b2` were
**session-local mount restrictions**, not authorization limits: three of those
findings were applied from a later session in `22f438a6`, which proves the
class is self-serve. The fourth (the Lane 3 rule) is unapplied by *choice*, and
is filed as Tier 1 §1.1 for its doctrine content, not here.

An ordering constraint, an unfamiliar surface, a high-stakes change, or a
decision that "feels like" it wants a human are none of them evidence of
incapacity. Under S-16 those are all executor calls.

**Re-tested 2026-08-30 (second pass).** All fifteen further decisions were put to
the same bar and **none reached it.** Two were close enough to name:

- **§2.8** — the red fence on a `phase: done` node. The corrections spec marks it
  *"This is an author call."* It is not, under S-16: the disposition (leave it
  red, report it) follows from `.claude/rules/test-integrity.md` with no
  discretion left over, and the executor can both correct the fence and file the
  report. What the author may want to weigh in on later — whether prose matches
  should count as violations — is a follow-up, not a precondition.
- **§1.6** — amending a rule in `.claude/skills/`, which earlier sessions could
  not write. That was a **session-local mount restriction**, disproved as an
  authorization limit by `22f438a6`, which applied three such findings from a
  later session. Filed as doctrine, not incapacity.

**Re-tested 2026-08-30 (3rd).** All thirteen further decisions were put to the
same bar and **none reached it.** Repo permissions re-read live:
`gh api repos/natb1/commons.systems --jq .permissions` →
`{"admin":true,"maintain":true,"pull":true,"push":true,"triage":true}`. The two
that came closest, and why each is still an executor call:

- **§1.11** — deferring fleet-alarm step 2 because it touches a parked node's
  open question. That is a *sequencing* decision the executor made and executed;
  the parked question was already the author's and already parked. Nothing new
  is asked of the author, and §1.11's deferral does not become author-owed
  merely because it is adjacent to a park.
- **§1.6** — the one unshipped decision in Tier 1. Its blocker was believed to be
  the read-only `.claude/skills/` mount; that was disproved as an authorization
  limit by `22f438a6`, which applied three such findings from a later session.
  It is unshipped by omission, not incapacity, and is filed as executor-owed.

Tier 3 remains empty by measurement, not by omission.

---

## Tier 4 — claims found unsourced or wrong, and what replaced them

The plan-vs-node reconciliation (`fc4ca3e9`) audited **59 contradictions across
13 positions**; a follow-up structural sweep (`2daae4ee`) found the corrections
had been applied at the unit but not carried into the section-level lists,
banners and sibling document that repeat the same claim. Listed below are the
items whose *provenance* was the defect — a claim asserted as ruled, measured or
settled when it was none of those. The broader "plan directs work the node
refuted" class is summarized at §4.10 rather than enumerated.

### 4.1 — "ruled opus" / "ruled sonnet" on PR14's two model tags — UNSOURCED

Neither node declares a model. The word **"ruled" is struck**; the tags survive
as plan-side recommendations **with their reasons**.
Cited: `plans/dispatch-rsi-author-rulings.md:49` and `:401-418` (D9);
corrections at `plans/dispatch-rsi-serialized-pr-plan.md:3416` and `:3503`.
**Why:** transcribing an unsourced "ruled" is exactly the risk Ruling 5 names —
it canonizes an executor draft as an author ruling.
**Reversibility:** free. **Confidence:** high.

### 4.2 — "each of the seven rulings is transcribed onto its node" — FALSE

> **CORRECTED 2026-08-30 — this entry's own correction has since been
> superseded twice.** "1 of 7" is dead: the rulings landed on `origin/main`. See
> **§4.12** for the full sequence and for the two measurement errors (a false
> "0 hits on all four", and a case-sensitivity false negative) that produced the
> figure recorded below.

Measured: **1 of 7**, and that one only partially. Replaced by the audit table
at `plans/dispatch-rsi-author-rulings.md:12-32` and the index correction at
`plans/dispatch-rsi-sequence.md:80`. See Tier 1 §1.3. **Confidence:** high
(mechanical grep).

### 4.3 — PR5's "#3018 conflict-lane coordination" — STRUCK OUTRIGHT

No node rules on it, and the unit it presupposed was **deleted**:
`intentions/tactic-review-stall-conflict-lane` is parked on a dead premise
(the sweep's `conflict` arm was retired to a bare `continue` in `fa9c4338`, and
three sibling PR5 nodes build on that retirement). PR8 owns the single conflict
policy.
Cited: `plans/dispatch-rsi-sequence.md:430-441`;
`plans/dispatch-rsi-serialized-pr-plan.md:2013`, `:2088` ("DELETED 2026-08-30").
The sibling `#3002` / `#3064` absorptions were **kept** as plan-side facts —
bookkeeping about which drafts a PR converges, not doctrine.
**Confidence:** high.

> **FOLDED IN — consolidation, from `AUTHOR-RATIFICATION-LIST.md` entry R-5**
> (recorded 2026-08-29, filed there as `NEEDS AUTHOR`). Restated here as the
> completed action it was; the earlier record's phrasing as an open question to
> the author is withdrawn per S-16.
>
> **What the earlier record added.** The park premise on
> `intentions/tactic-review-stall-conflict-lane` is confirmed dead by
> **`fa9c4338`** — the sweep's `conflict` arm was retired to a bare `continue`.
> The earlier record's specific worry was a **consistency trap**: sibling
> Position-4 nodes carry **finalized plans** that were built while that arm was
> still live work, so clearing the park and honouring the sibling plans are
> mutually inconsistent. The disposition taken: the plan sentence was struck
> outright (this entry, §4.3) and PR8 was left owning the single conflict
> policy, which resolves the inconsistency in the plan rather than by clearing
> the park in isolation.
>
> ⚠ **CONFLICT — flagged, not silently resolved.** The two sources disagree on
> the sibling count and on the *direction* of the dependency:
>
> | source | claim |
> | --- | --- |
> | `author-ratification-list.md` §4.3 | **three** sibling PR5 nodes **build on that retirement** |
> | `AUTHOR-RATIFICATION-LIST.md` R-5 | **two** sibling Position-4 nodes carry finalized plans **built on it being live work** |
>
> These cannot both be right: a plan built *on the retirement* is consistent
> with clearing the park, and a plan built *on the work being live* is not. The
> count differs too (three vs two), and the two records scope the siblings
> differently (PR5 vs Position 4). Neither was re-measured for this
> consolidation. Settling it needs one read of the three/two named sibling node
> bodies against `fa9c4338`.


### 4.4 — "five writers collapsing into one" (PR4) — WRONG BY MEASUREMENT

`intentions/tactic-finding-search-all-producers.md:377-380` measures **16 CREATE
sites / 47 write calls / 27 callers** and rules the five-writer census wrong.
Struck at `plans/dispatch-rsi-sequence.md:464`, in PR4's model line, and at two
further sequence-doc sites (`2daae4ee`). **Confidence:** high.

### 4.5 — `.claude/rules/sandbox.md` on the `graph-commit` allowlist — WRONG

The prose claimed `graph-commit` and `land-align-round` are allow-listed in a
canonical spelling that **includes** `-C <path>`. They are not: the entries are
bare path prefixes whose trailing `:*` matches any argument string, so the
matcher never inspects the flags. `-C` is required by `graph-commit`'s own
contract, not by the permission gate — and `land-align-round`'s documented call
sites pass none, which is the standing proof. The two claims are now separated.
Cited: `49a133b2`. **Confidence:** high.

### 4.6 — "No position waits on the author" / "Open park: one" — BOTH FALSE

False at **five** positions (4, 6, 7, 8, 9), and the park count undercounted by
more than an order of magnitude. Replaced with a per-position census.
Cited: `1eddbc20`; `plans/dispatch-rsi-sequence.md`, "Open parks" row.
A sub-claim was corrected twice: the WAIT-mark census, re-taken with
`LC_ALL=C grep -a`, is **15 nodes / 22 marks**, not 17 — "17" counted non-`done`
tactics that merely mention the string. **Confidence:** high.

> **FOLDED IN — consolidation, from `AUTHOR-RATIFICATION-LIST.md` entry R-4**
> (recorded 2026-08-29, filed there as `NEEDS AUTHOR (five parks)`; the sixth
> park filed as `RULED-BY-ME`). Restated as completed action; the
> `NEEDS AUTHOR` framing is withdrawn per S-16.
>
> **The precise false sentence, and where it lives.**
> `plans/dispatch-rsi-sequence.md:34` asserts that every `office_hours` park is
> cleared and that **"No position waits on the author."**
>
> **The per-position detail the later record summarized.** **Position 7 alone
> carries six live `office_hours` parks.** Five of them name a specific ruling
> an executor cannot make on its own, including:
>
> - **PR8 Unit 1's** entire tracked-vs-gitignored-vs-XDG decision (see §5.5,
>   which records the disposition actually taken);
> - **PR9 Unit 7's**, whose park text says one choice *"unblocks this tactic
>   completely"*.
>
> **Four of the six are the same standing question** — a draft whose substance
> shipped under a sibling carrier — and **three separate parks ask for it to be
> ruled once, in one sitting**. That is Ruling 1's subject; see §5.9.
>
> **The sixth, and what was done about it.** The sixth is a **dead premise** — a
> 2026-08-19 frozen-session liveness park, under a fleet frozen ever since. The
> executor ruled it dead and marked it for `clear-park` under the delegated
> authority §1.9 records (and within that entry's stated bound: the *premise* is
> dead, not the scope). **Recorded honestly: neither source carries a landed
> commit for that clear**, so treat the ruling as taken and the landing as
> unverified in this record.
>
> **What replaced the false sentence.** The per-position census in this entry.
> The census is the shipped correction; nothing was left standing as a question.
>
> ⚠ **CONFLICT — flagged, not silently resolved.** The earlier record says the
> four sibling-carrier drafts are one live standing question with **four** parks
> open. §5.9 in this document was **refuted on re-measurement**: three of the
> four are `phase: done` / `office_hours: null` on `origin/main`, and **one**
> node remains. The earlier record is the older reading and §5.9's refutation is
> the later measurement, but both are carried here rather than one being
> dropped — see §5.9's own banner for the measurement that decides it.
>
> **Not a conflict, recorded so it does not read as one.** This entry counts
> **positions** where the claim is false (five: 4, 6, 7, 8, 9); R-4 counts
> **parks** at one position (six at Position 7). Different denominators, both
> can hold.


### 4.7 — PR16 Unit 4's data set "6 nodes" — WRONG, and dangerously so

Verified two independent ways across all 751 nodes: the real set is **3**. A
naive `grep` for `phase: main-qa` returns **68** files, almost all with a
legitimate *first-class* phase — backfilling against that set would have
corrupted 65 healthy nodes.
Cited: `plans/dispatch-rsi-sequence.md:319-324`. **Confidence:** high.

### 4.8 — Four plan sentences ruled MUST-NOT-TRANSCRIBE

Ruling 5 requires plan-stated rulings to be folded onto their nodes. The audit
separated genuine rulings from executor drafts and blocked four from
transcription, because transcribing them would canonize a draft as an author
ruling:
- **PR3 Unit 1** — "close the four verify-and-close nodes before any
  implementation". Two of the four (`tactic-audit-cache-efficiency-lens`,
  `tactic-rsi-round-trips-lens-carrier`) are `phase: implement`,
  `status: codified`, carrying live two-unit plans.
- **PR4 Unit 8** sequencing rationale — its premise is option 2 of
  `tactic-graph-prose-ref-batch-wiring`, which that node refutes.
- **PR4 Unit 3** constraint "keep the skill-body edits minimal and mechanical" —
  contradicted by that node's item 5, which requires a non-mechanical edit.
- **PR5 absorptions and the #3018 sentence** — see §4.3.

Cited: `plans/dispatch-rsi-author-rulings.md:45-48`. Corresponding plan strikes
at `plans/dispatch-rsi-serialized-pr-plan.md:467`, `:489`, `:1664`, `:1696`.
*Node-state values quoted here are the rulings file's 2026-08-30 audit; not
re-read, per the concurrency constraint.* **Confidence:** high on the
mechanism, medium on the completeness of the four.

### 4.9 — Three script/skill headers describing rules they no longer implement

All three were review findings that could not be applied from the reviewing
session (read-only `.claude/skills/` mount) and were applied in `22f438a6`:
- `review-fix-write-surface-guard.sh` still said "CARRIER CHANGE ONLY, do not
  tighten or loosen the rule" and described the `comm -13` form — i.e. a written
  instruction to the next editor to **revert** the §2.1 fix.
- `.claude/skills/review-fix/SKILL.md` carried the same description in two
  places; a caller following it would hit a hard Step-5 failure with no
  explanation.
- `reconcile-graph-merged`'s comment contradicted itself two sentences apart,
  claiming no already-verified node costs a `gh` call *because* of a field that
  nothing stamps. The comment now states the standing cost instead of denying
  it. **The cost itself is real and untouched — this corrected the record, not
  the behavior.**

**Confidence:** high. `test-review-fix-write-surface-guard.sh` 25/25 after.
**CORRECTED 2026-08-30:** the suite is now **27/27** — `f2dd808d` added Test 6c
and `97fa10d6` rewrote the guard's contract paragraphs, which still described
the pre-fix ordering in three places. See §5.24.

### 4.10 — The wider class, summarized rather than enumerated

`fc4ca3e9` records the corrections that would have shipped wrong code, by
category: refuted designs still directed (PR17 U4's row cap sits *before* the
watcher's claimed-row filter and can emit a false all-clear that closes an open
alarm; PR3 U6's "mint at spawn"; PR20's diff-read gate predicate — the design
the author rejected; PR11's "any lens whose output changes is a bug", which
**fails a correct implementation**); incomplete scopes reading as complete
(PR2 U3, PR2 U5); work directed at things that no longer exist or already
shipped (PR12's folded comment deleted by `c06c7295`; PR6 U2/U3 rebuilding the
#3078 flock; PR7 U4 shipped in #2887); five parks the plan did not know about;
the PR4/PR19 cycle (§5.1); and Position 13 having no carrier at all (§5.8).

Three further node ids cited across the batch **do not exist** in `intentions/`
(verified 2026-08-30): `tactic-graph-digest-tooling`,
`tactic-status-kind-vocabularies`, `tactic-dispatch-skill-input-contract`.
The decision taken: **mint none of them on a plan reference alone.**
Cited: `plans/dispatch-rsi-sequence.md:36-44`.

One anchor worth carrying: `read-sensors.ts`'s `LIFECYCLE_SENSOR_NAME` is cited
as `:485` by both the plan and the spec node; measured, it is at **`:516`**
(`plans/dispatch-rsi-sequence.md`, Position 13 item 5).

**Explicit non-decision.** No mass anchor correction was attempted. Reasoning,
from `fc4ca3e9`: *"Replacing stale-and-known-stale numbers with
fresh-and-trusted-wrong ones would be worse; the warning block is the fix."*
**Confidence:** medium — this is a real judgement call and a reader may prefer
the sweep.

> **CORRECTED 2026-08-30 — the non-decision has been decided.** The "no mass
> correction" reasoning holds against *renumbering* and does not hold against
> *deleting*. Anchors are now to be **deleted in favour of quoted-snippet
> anchors**, converted per section as each position executes. See **§1.7**, which
> also corrects this document's opening "near-total rot" framing to ~50% and
> explains why the lower figure makes the recommendation stronger.

> **CORRECTED 2026-08-30 — the three non-existent ids.** They were **pruned
> after their work shipped**, not never-created. "Mint none of them" stands; the
> remedy for the surviving citations is **past-tense prose repair**. See §4.11.

### 4.11 — The three "phantom" node ids were PRUNED AFTER THEIR WORK SHIPPED — and one "`blocked_by`" is not an edge at all

> **CORRECTS §4.10 and §5.3(d), 2026-08-30.** §4.10 recorded that three cited
> node ids "do not exist" and decided to **mint none of them**. That decision
> stands and is reaffirmed. Its *premise* was incomplete: they are not
> never-existed phantoms, they are **deliberately pruned completed work**. The
> remedy therefore is not "leave the dangling citation alone", it is **past-tense
> repair of the prose** — which is a different, cheaper, and safe action.

**Measured 2026-08-30, `git log --all --diff-filter=AD` per file.** Each was
created and later deleted by a reconcile/prune commit whose own subject says the
work was finished:

| id | created by | pruned by |
|---|---|---|
| `tactic-graph-digest-tooling` | `44493733` | `afe270a7` — *"census reconcile — prune done-but-present tactics (batch 3/6)"* |
| `tactic-status-kind-vocabularies` | `6531e22b` | `a7273245` — *"reconcile merged/closed tactics"* |
| `tactic-dispatch-skill-input-contract` | `14dc9af6` | `20b0432c` — *"reconcile merged/closed tactics"* |

`tactic-graph-digest-tooling` in particular shipped as **PR #2865** and is cited
by `tactic-graph-digest-quality-followups` as the source of its own review — the
work is unmistakably landed.

**So the surviving citations are present-tense sentences about past-tense
facts.** *"blocked_by tactic-graph-digest-tooling"*
(`intentions/tactic-serves-inheritance-full-strip.md:21`, `:53`, `:112`),
*"until `tactic-status-kind-vocabularies` lands"*
(`intentions/tactic-schema-md-deprecation.md:89`). The repair is to restate them
as *landed by* / *landed in PR #2865*, keeping the provenance and dropping the
implication that something is still owed. **No mint.**

**And the `blocked_by` §5.3(d) voided is not an edge.** Measured on `origin/main`,
`intentions/tactic-dispatch-skill-rename.md`:

- Frontmatter, line 28: **`blocked_by: []`** — empty.
- Line 67, in the body: *"lands as the second of two coordinated adjacent PRs —
  `` `blocked_by: [tactic-dispatch-skill-input-contract]` ``"* — inside
  backticks, inside a prose sentence.

Every reference to that id across the whole store is body prose
(`strategy-graph-native-dispatch.md:8150`, `:8226`;
`tactic-dispatch-skill-rename.md:65`, `:67`;
`tactic-dispatch-skill-standards-extraction.md:69`, `:105`). **`validateGraph`
never sees it and the router never sees it**, so it could not have deadlocked
Position 10 in the first place. §5.3(d)'s conclusion (do not honor it) is right;
its stated hazard (a permanently unclearable edge) was never live.
`tactic-dispatch-skill-standards-extraction.md:105` already says as much in
passing — *"but no such node exists in"*.

**Reversibility.** Prose repair is free and monotone. **Confidence.** High —
frontmatter read directly, every reference enumerated with `git grep`.

> **PARTLY REFUTED 2026-08-30 (3rd) — "every reference is body prose" is false,
> and the repair scope is under-specified by a factor of five.** See **§4.18**
> for the measurement. Short version: the *conclusion* about
> `tactic-dispatch-skill-input-contract` survives (`blocked_by: []` re-confirmed
> at line 28), but two of its six references are in **frontmatter**, not body,
> and across all three pruned ids **22 references sit in 11 nodes, six of them
> in frontmatter fields `validateGraphProseRefs` actually scans.** The
> "past-tense prose repair" this entry prescribes names four sites. Also, this
> entry's own anchors have already rotted: `strategy-graph-native-dispatch.md`
> `:8150`/`:8226` re-measure as **`:8160`/`:8236`** — ten lines, one day.

### 4.12 — "1 of 7 rulings transcribed / this file is operatively binding" — FALSE, and its replacement OVERCLAIMED

> **CORRECTS §1.3 and §4.2, 2026-08-30.** Both rested on a measurement that is
> now dead. The correction ran in two steps, and the first step was itself wrong.

**Step 1 — the original claim died when the rulings landed.** `450c9b25` (on
`origin/plan-reconciliation`) **rewrote rather than amended** the banner in
`plans/dispatch-rsi-author-rulings.md`, which had read *"1 of 7 rulings is
transcribed … this file is operatively binding for the six untranscribed
rulings, and any session executing this batch must read it alongside the
nodes."* Rewritten, not amended, deliberately: **a stale *binding* claim changes
how every executing session reads the batch**, so leaving it visible with a
correction appended underneath was judged worse than replacing it.

Two of the old banner's specific rows were **refuted** while re-measuring, and
the replacement records both:

- Ruling 1's row asserted *"0 hits on all four. All four still carry live
  `office_hours` parks."* **Both halves false.** Hits are 2, 3, 2, 2. Verified
  independently for this entry on `origin/main`: `tactic-code-review-detached-node-lock`,
  `tactic-review-cheap-fix-disposition` and `tactic-audit-permission-friction`
  are all now **`phase: done`, `office_hours: null`**. Only
  `tactic-dispatch-code-review-concurrent-write-attribution` is still parked
  (`phase: null`).
- Ruling 6's row called its prose follow-up landed via `cba77286`. That commit is
  on the **open** PR #3142 branch, not on `origin/main`. The original claim
  rested on a **case-sensitivity false negative in its own grep** — the same
  instrument class §1.8 withdraws.

**Step 2 — the replacement overclaimed, and was rescoped the same day.**
`97fa10d6` found that `450c9b25`'s *"7 of 7 transcribed … NO LONGER operatively
binding"* was measured over **eight nodes belonging to Rulings 1, 2, 3, 6 and 7
only**. **Rulings 4 and 5 have no named node** and were never in the sample.
Ruling 5 needs none — it is discharged by the transcriptions themselves. **Ruling
4 does, and has none:** re-measured,
`grep -rail 'verifiably dead\|clear a park itself' intentions/` returns nothing,
so the executor's delegated authority to clear a park on a verifiably-dead
premise — the authority that lets the Unit 7 `Verifiability: WAIT` migration
drain — exists **only in that file**. Pairing the overclaim with "no longer
binding" would have dropped Ruling 4 out of every clean session: precisely the
failure the file exists to prevent.

**Current state, and it is the one to carry forward.** The banner now reads
**"5 of 5 node-homed rulings transcribed; this file is NO LONGER operatively
binding for those five; Ruling 4 still lives ONLY here."** The same commit fixed
two more drifts in the file: the owed-items list said two when the count had
moved, and an adjacent same-date table still marked four rows **TRANSCRIBE**
after all four had landed on `origin/main`.

**Why this is Tier 4 and not Tier 1.** The doctrine ("a plan file can be
binding") is unchanged and still uncomfortable — see §1.3's confidence note. What
changed is a *claim about the world* that was measured wrong twice. Recording it
here keeps the two apart.

**Reversibility.** Prose; free. **Confidence.** High — the banner was read at
`97fa10d6`, and Ruling 1's four nodes were re-read on `origin/main` for this
entry rather than taken from the file's own audit (which §1.3 and §5.9 had to do
under the concurrency constraint).

> **STALE 2026-08-30 (3rd) — step 3. Ruling 4 now HAS a node home, and the
> banner on `main` still says it does not.** The rulings file's current banner
> (landed with #3142 as `35ab0e45`) reads *"Ruling 4 still lives ONLY here"* and
> justifies it with `grep -rail 'verifiably dead\|clear a park itself'
> intentions/` **returning nothing**. Re-run verbatim against `origin/main` at
> `45af501f`, that exact command now returns
> **`intentions/strategy-graph-native-dispatch.md`**. The ruling — grant **and**
> bound — is transcribed there; see **§1.9** for the quoted text. So this entry's
> "5 of 5 node-homed" framing is now **6 of 6**, and the rulings file's claim to
> be operatively binding for Ruling 4 has expired.
>
> **Note what changed the answer.** The banner's grep was not wrong when it was
> run; it went stale. But the transcription also does **not** contain either of
> the banner's search phrases — it says *"a DEAD PREMISE is not a DEAD SCOPE"*
> and *"clear-park is the wrong instrument"*. The grep only hit because
> `-i` and one incidental phrase overlapped. **A transcription-status banner
> whose evidence is a fixed phrase list cannot survive a faithful paraphrase**,
> which is the same instrument failure §1.8 and §1.13 record twice over. The
> banner is now measuring the wrong thing in the *lucky* direction.

### 4.13 — Two docs promised an idempotence the script stopped providing

**Decided.** `.claude/skills/qa-fix/SKILL.md` and
`.claude/skills/qa-fix/references/needs-main-followups.md` both stated,
unqualified, that re-running the main-qa mint seam on a later fixing pass is
safe. `mint-mainqa-nodes`' `assert_existing_covers` **hard-errors (exit 1)** when
an existing lane's landed node does not already record every item the pass routed
to it. **The script is right; the docs moved.** Landed `450c9b25` (on
`origin/plan-reconciliation` / PR #3142 — *not* on `origin/main`).

**What the docs now say.** Idempotence holds **only while the item set is
unchanged**. A second pass that discovers a **new** item for an existing lane
**refuses** rather than converging, with a manual `write-node.ts` +
`graph-commit` append as its stated remedy — and **an autonomous fixing pass has
no handler for that refusal.** Both notes also record that the refusal can fire
**falsely**: item ids are LLM-authored, so a re-spelling of an existing item
reads as an uncovered item.

**Why the docs moved rather than the script.** The guard exists to stop a mint
pass silently dropping newly-routed items into a node that does not mention them
— a real data-loss path. Relaxing it to restore unconditional idempotence would
reinstate exactly that. The honest fix is to stop promising what is no longer
true and to name the unhandled path out loud, so the next autonomous pass that
hits it is a known gap rather than a mystery.

**The residual, named not hidden.** The unhandled autonomous-refusal path is
**still unhandled**. This change corrected the record; it did not close the hole.
That is a real follow-up and it is executor-owed.

**Reversibility.** Prose; free. **Confidence.** High on the mechanism (commit
body plus the script's own contract). High that the residual is open.

> **CORRECTED 2026-08-30 (3rd) — it is on `origin/main` now.** PR #3142 merged
> as **`35ab0e45`**; the "*not* on `origin/main`" caveat above is spent. The
> cited `450c9b25` is unreachable from any ref (squash-merge, branch deleted) —
> see the third-pass banner. **The residual is unchanged and still open:** the
> autonomous fixing pass still has no handler for `assert_existing_covers`'
> exit-1 refusal. That is the part of this entry that still describes today.

> **FOLDED IN — consolidation, from `AUTHOR-RATIFICATION-LIST.md` entry R-2**
> (recorded 2026-08-29 as `PENDING TRIAGE (expect IMPLEMENTATION)`). The triage
> was completed and is recorded here as its outcome; the pending framing is
> withdrawn.
>
> **The question as it was put.** Does *"re-mint is a no-op"* cover
> **newly-recorded** items? The earlier record's reading of
> `scripts/mint-mainqa-nodes:350`: a second `/qa-fix` pass on a lane that
> already exists reports `EXISTING`, **skips before any write, and exits 0** —
> silently dropping the new items.
>
> **The triage verdict, and it is the one that governs.** **NOT doctrine.**
> Idempotency means same input → same result; **new** input being discarded is
> data loss, and `.claude/rules/code-style.md` explicitly prefers a loud error
> over exactly this fallback. That verdict is what `assert_existing_covers`
> implements, and it is why this entry moved the *docs* rather than the script.
>
> ⚠ **CONFLICT — flagged, and settled by measurement rather than by picking a
> side.** The two records describe opposite script behavior:
>
> | source | claim about a second pass carrying a new item |
> | --- | --- |
> | `AUTHOR-RATIFICATION-LIST.md` R-2 | reports `EXISTING`, skips before any write, **exits 0**, silently dropping it |
> | `author-ratification-list.md` §4.13 | `assert_existing_covers` **hard-errors, exit 1**, nothing written |
>
> **Measured for this consolidation**, on
> `packages/intentionsutil/scripts/mint-mainqa-nodes` in the batch worktree
> checkout: the `EXISTING` arm calls `assert_existing_covers "$id" "$decision"`
> **before** its `continue`, and that function `exit 1`s with
> *"already exists on origin/main but does NOT record verification item(s)"*.
> **§4.13 describes the script as it stands; R-2 describes the behavior the
> guard was written to remove.** Both were true, in that order — R-2 named the
> defect, the guard closed it, and this entry records the documentation catching
> up. The conflict is chronological, not factual, and is recorded rather than
> erased because R-2 is the only place the pre-guard failure shape is written
> down.
>
> **Two details from the script's own comments that corroborate this entry's
> residual**, read for this consolidation: the refusal exists precisely because
> `/qa-fix` Step 6 has already excluded needs-main residue from its escalation
> set, so a silently skipped item *"would end up in no node, no queue and no
> escalation, with the run exiting 0"*; and the comment names the same
> **false-refusal** cost this entry records, because the join key is the
> LLM-authored item `id`.


### 4.14 — "A branch exists" is a FALSE POSITIVE for "in flight", and it caused real mis-deferrals

**Decided.** Branch existence, and `git diff origin/main <branch>` output, are
both **withdrawn** as evidence that work is in progress. The only reliable test
is `git rev-list --count origin/main..<branch>` **crossed with an open PR**.

**Measured 2026-08-30 across all 95 remote branches.**

- **9** are exactly **0 commits ahead** of `origin/main` — they carry nothing
  unlanded at all, yet several have same-named worktrees on disk that read as
  live work.
- Of those 9, **8** produce a **non-empty** `git diff origin/main <branch>`,
  ranging from **569 to 1676 changed files** each:
  `graph/tactic-align-strategy-skill-prune-3251902` (1676),
  `graph/tactic-align-tactics-skill-implqa-3432988` (1674),
  `graph/tactic-align-tactics-skill-prune-manual` (1652),
  `graph/tactic-grounding-gap-analysis-3891250` (1616),
  `graph/tactic-strategy-fingerprint-stamp-shape-1396011` (1257),
  `tactic-graph-node-session-reap-gate` (1125),
  `graph/tactic-align-tactics-mark-terminal-skipped-4104969` (794),
  `graph/tactic-eval-finding-eval-since-bound-excludes-worker-1110231` (569).

Every one of those diffs is **main moving forward**, not the branch doing
anything. A two-dot `git diff` is symmetric about the merge base; a branch merely
**behind** main is indistinguishable from one carrying a thousand files of work.

**The harm this actually did.** Positions and nodes in this window were deferred
on the reading that a same-named branch or worktree meant something was already
in flight. Several of those readings were wrong, and the deferral was the cost —
an ordering constraint invented out of an artifact. This is the same failure the
repo already documented for the reap path, whose safety gate checks
`rev-list --count origin/main..HEAD` **first** and only then looks at content.

**Reversibility.** It is a method; free to adopt. **Confidence.** High —
enumerated over all 95 branches, not sampled.

### 4.15 — The park adjudication had SEVEN wrong verdicts, and drift cannot be the excuse

**Decided.** A park-adjudication pass produced seven verdicts that did not match
the store. The available defence was **drift** — that the nodes moved between
adjudication and check. That defence was tested and **fails**, so all seven are
recorded as **adjudication errors**, and the pass is treated as unreliable rather
than as a stale-but-honest reading.

**The measurement that closes the drift defence.** Every node's `phase` and park
state was captured at each of the ten commits spanning the window — `1f5d0909`,
`12716163`, `35ab0e45`, `d1fef042`, `1c0dd63d`, `c0cecce1`, `8fe1d359`,
`a1e7b0e6`, `61cdca5d`, `45af501f` — and diffed pairwise:

```
1f5d0909 -> 12716163: nodes 754->754 | added 0 removed 0 | state-changed 0
12716163 -> 35ab0e45: nodes 754->754 | added 0 removed 0 | state-changed 0
… (all nine steps identical) …
NET 1f5d0909 -> 45af501f: state-changed nodes = 0
parked count: 215 -> 215 | total nodes: 754 -> 754
```

**Zero nodes changed phase or park state across all nine commits.** The claim was
made for six; it holds for nine. The store was frozen for the entire window, so
no verdict can be excused as having been true when it was taken.

**The most legible of the seven.** One verdict treated a park as discharged on
`tactic-dispatch-code-review-concurrent-write-attribution`. That node's own body,
at `:338` on `origin/main`, says in bold: ***"It does NOT discharge this park's
RULING 1."*** The node states the opposite of the verdict, in the node's own
words, on the node the verdict was about. Its frontmatter still reads
`phase: null` with a live `office_hours` — the one node of Ruling 1's four that
§5.9's correction found still parked.

**Why this is Tier 4 and not Tier 1.** No rule changed. What changed is a
*claim about the world* that was measured wrong seven times — the same
classification §4.12 makes for itself.

**Reversibility.** Nothing was executed on the seven verdicts, which is the point
of recording them: the adjudication was caught before it acted. **Confidence.**
High on the frozen-store measurement (mechanical, all 754 nodes, all ten refs).
High on the named instance (node body read directly).

### 4.16 — The WAIT census is settled at 22 marks / 12 parked — and the node count is 14, not 15

**Decided.** The `Verifiability: WAIT` census dispute is closed on the
**line-based** count over the `phase: main-qa` cohort, per §1.8's mark-census
exception. A competing figure was traced to whitespace normalization — trap 4 —
and is withdrawn.

**Measured on `origin/main` at `45af501f`, and stable across five refs**
(`45af501f`, `1f5d0909`, `77bd7471`, `12716163`, `35ab0e45` all agree):

| scope | nodes | marks | parked |
|---|---|---|---|
| whole store | 27 | 52 | 13 |
| non-`done` | 18 | 35 | 13 |
| **`phase: main-qa` cohort** | **14** | **22** | **12** |

**The marks and the parked count reproduce exactly. The node count does not.**
The figure carried into this pass was **15** nodes; measured, the cohort is
**14**. Recorded as a discrepancy rather than reconciled, because no scoping
tried reaches 15 with 22 marks: adding the one parked `phase: null` node gives
15/23/13, and adding the one `phase: qa` node gives 15/23/12. Every neighbouring
scope moves the mark count off 22. **Treat 22 and 12 as measured and 14 as the
node count; treat "15" as unsourced.**

**Trap 4 is live in this data, and it is worth seeing.** Exactly one file changes
count under normalization: `tactic-review-verify-per-file-batching.md` reads
**2** marks line-based and **3** normalized. Normalizing un-wraps a scalar that
merely *mentions* the marker onto the same line as a real one, inventing a
phantom — precisely §1.8's stated exception. Normalized, the cohort would read
14 / **23** / 12, so any figure quoting 23 marks came from the wrong instrument.

**Reversibility.** A census is a reading, not a change. **Confidence.** High on
22 / 12 (five refs, line-based, `LC_ALL=C grep -a`). High that the competing
figure came from normalization (the single differing file identified by name).
**Low on reconciling the briefed "15"** — it is left standing as a contradiction
rather than smoothed.

### 4.17 — "Eight fences run a vitest command that cannot work" is a floor, not a count — the corpus is 14

**Decided.** The eight-fence figure in #3145's write-up is the **warned subset**
of one mechanism, and it is reported here with its true scope attached rather
than repeated.

**The defect is real and worse than the number suggests.** `vitest.config.ts`
sets `test: { name: dir }` where `dir` is the workspace path, so the project is
`packages/intentionsutil`. The basename form
`npx vitest run --project intentionsutil --root .` errors *"No projects
matched"* and can never pass.

**Measured on `origin/main` at `45af501f`, by extracting every fenced
` ```verify ` block under `intentions/`:**

- **897** verify blocks store-wide; **590** on non-`done` nodes (the linter
  scans non-`done` only, and reports 585 — a close match).
- **14** blocks carry the broken basename form: **10** on non-`done` nodes,
  **4** on nodes already at `phase: done`.
- Four further files mention the string outside any verify block (prose).

**So "eight" undercounts its own scan scope by two, and the store by six.** The
two non-`done` blocks the WARN check does not flag are the ones where the vitest
call is the **final** statement — its status is *not* discarded, so those fences
are **genuinely RED**, not falsely green, and have presumably been failing
unremarked. The four on `done` nodes are outside the scan by design (`done`
bodies are historical archives) but are still false provenance: each is a node
that reached a terminal phase behind a gate that could not run.

**Why record the correction rather than restate the eight.** The eight is
correct *as a property of the WARN mechanism* and the commit says so explicitly
(*"That 7 counts THIS mechanism only"*). The risk is a reader taking a
mechanism-scoped count as a corpus count — the same error §5.21's "seven" made,
where two different counts coincided at the same number.

**One more drift, small but in the same class.** The commit body says **124**
warning lines; the merged file's own header says **126**, and explains why (a
head-word exemption was narrowed, surfacing two `printf … | grep -q …`
assertions in `tactic-dispatch-pause-config-field`). Both numbers are on
`origin/main`; the header is the later one and the file instructs that the count
may only ever move **up**.

**Reversibility.** A measurement. **Confidence.** High — blocks extracted
mechanically and split by node phase, not sampled.

### 4.18 — "Every reference is body prose the validator never reads" — FALSE; six sit in scanned frontmatter fields

**Decided.** §4.11's enumeration is corrected and its repair scope widened. The
decision it supports — **mint none of the three pruned ids** — is unchanged and
reaffirmed.

**What `validateGraphProseRefs` actually scans**, read on `origin/main` at
`packages/intentionsutil/src/schema.ts:1973`:

```
const texts: string[] = [node.statement];
if (node.rationale !== null) texts.push(node.rationale);
if (node.attention !== null) texts.push(node.attention.rationale);
for (const c of node.clarifications) texts.push(c.answer);
const body = bodies.get(node.id);
if (body !== undefined) texts.push(body);
```

So four **frontmatter** fields are scanned — `statement`, `rationale`,
`attention.rationale`, `clarifications[].answer` — alongside the body.
"Frontmatter" and "unread" are not the same set, and §4.11 treated them as one.

**Measured: 22 references to the three pruned ids, across 11 nodes.** Six are in
scanned frontmatter fields:

| site | field | scanned? |
|---|---|---|
| `tactic-graph-digest-quality-followups.md:5` | `statement` | **yes** |
| `tactic-graph-digest-quality-followups.md:15` | `rationale` | **yes** |
| `strategy-graph-integrity.md:23` | `rationale` | **yes** |
| `tactic-serves-inheritance-full-strip.md:21` | `rationale` | **yes** |
| `strategy-graph-review-curriculum.md:158` | `clarifications[].answer` | **yes** |
| `strategy-graph-self-description.md:61` | `clarifications[].answer` | **yes** |
| `strategy-graph-integrity.md:138` | `tooling_goals` | no |
| `tactic-dispatch-skill-standards-extraction.md:69`, `:105` | `office_hours.reason` | no |
| 13 further sites | body | yes (as body) |

`tactic-serves-inheritance-full-strip.md:21` is the sharpest: §4.11 cites it by
name as body prose, and it is `rationale` — frontmatter, and scanned.

**What survives, and what does not.**
- **Survives:** the `blocked_by` on `tactic-dispatch-skill-input-contract` is not
  an edge (`blocked_by: []` re-confirmed at line 28), and none of *that id's* six
  references land in a scanned field — the two frontmatter ones are
  `office_hours.reason`, which the validator does not read. §4.11's conclusion is
  right; its stated reason ("all body prose") is not.
- **Does not survive:** the generalization to all three ids. For
  `tactic-graph-digest-tooling` and `tactic-status-kind-vocabularies` the
  references *are* in scanned fields, and whatever keeps `validate-graph
  --strict-sensors` green over them is the deleted-id/baseline/`mentionsRef`
  path — **not** the fact that nobody reads the text.
- **Repair scope:** §4.11 names four sites for past-tense prose repair. There are
  **22**, in 11 files. Repairing four leaves eighteen present-tense sentences
  claiming that finished work is still owed.

**Reversibility.** Prose repair, free and monotone — just five times larger than
scoped. **Confidence.** High. Every reference enumerated mechanically with its
frontmatter/body boundary computed per file, and the scanned-field list read out
of the validator rather than assumed.

---

## Tier 5 — everything else material

### 5.1 — PR19 split at its schema seam (D1)

> **RE-CONFIRMED 2026-08-30, second pass.** The PR4/PR19 inversion was put again
> and resolved the same way: **split PR19 at the edge** —
> `tactic-supersession-edge-and-terminal` ships as **PR19a ahead of Position 5**;
> the consumers ship as **PR19b behind PR4**. Recorded again because the second
> pass reached it independently and because it is *both* the greenfield answer
> and the cheap one: the seam already exists in the node graph, Unit 1 has no
> dependency on PR4, and no third option was found that leaves the cycle broken.
> No new entry was minted for it — this is that entry.

**Decided.** `tactic-supersession-edge-and-terminal` ships as **PR19a ahead of
Position 5**; the two consumer nodes ship as **PR19b at Position 6, behind PR4**.
**Done.** `plans/dispatch-rsi-author-rulings.md:214-235`;
`plans/dispatch-rsi-sequence.md:507-523` and hard-ordering constraint 2;
`plans/dispatch-rsi-serialized-pr-plan.md:4995-4999`.
**Why.** PR4 and PR19 are `blocked_by` each other across the bundle boundary
while the node graph itself stays acyclic — neither ordering works. Alternative:
merge them into one PR. That lost — a 19-node change spanning three
independently reviewable surfaces (ledger doctrine migration, five-writer
collapse, schema terminal), where the split runs along an existing seam and
Unit 1 has no dependency on PR4.
**Reversibility.** Cheap; neither PR is built. **Confidence.** High.

### 5.2 — `batchIds` retired rather than made honest (D2)

**Decided.** Take the node's **option 3**: delete the parameter and its exemption
from `validateGraphProseRefs`; **rewrite** (never delete) the `schema.test.ts`
cases to document why the exemption is not offered.
**Done.** `plans/dispatch-rsi-author-rulings.md:237-257`;
`plans/dispatch-rsi-serialized-pr-plan.md:1781`, `:1803-1815`. Park cleared in
the same change; Unit 8 no longer depends on Unit 3.
**Why.** The node's own recommendation says ruling option 3 directly is
sufficient and the `strategy-graph-integrity` question need not be opened.
Options 1 and 2 are verified unimplementable; `batchIds` is an unwired fifth
parameter with no production caller. Deleting the affordance is more honest than
building a declaration channel that cannot be made honest. The bounding risk
recorded on the node: an id declared but never minted lands a dangling prose ref
on `main`, whose guard job then **blocks every graph writer in the repo** — the
2026-08-14 write-outage class.
**Reversibility.** Cheap now (unbuilt); a deleted public parameter is awkward to
restore later. **Confidence.** High.

### 5.3 — Position 10's carrier, roster and phantom edge (D3 a/b/d)

> **CORRECTED 2026-08-30 — part (d).** The conclusion holds; the hazard did not.
> The `blocked_by` on `tactic-dispatch-skill-input-contract` is **not an edge**:
> `intentions/tactic-dispatch-skill-rename.md` carries `blocked_by: []` in
> frontmatter (line 28) and the only "blocked_by" naming that id is **body prose
> inside backticks** at line 67. It is invisible to `validateGraph` and to the
> router, so it could never have deadlocked Position 10. See **§4.11**, which
> also corrects the premise of the "mint none of them" decision: all three ids
> were **pruned after their work shipped**, not never-created.

**(a)** Carrier is `tactic-dispatch-skill-rename` — live, unparked, serving the
same strategy, roster table already claims all three renames.
**(b)** Roster is the three renames this window names, **and no more**.
**(d)** The `blocked_by` on `tactic-dispatch-skill-input-contract` is a
**phantom and is void**.
**Done.** `plans/dispatch-rsi-author-rulings.md:259-292`;
`plans/dispatch-rsi-serialized-pr-plan.md:3260-3278`.
**Why.** (a) resolves a duplicate-target pair *deliberately* rather than by
omission, which is what clarification 78 exists to prevent. (b) widening a
repo-wide atomic rename inside a frozen window multiplies blast radius for no
benefit. (d) a `blocked_by` naming a node that does not exist can never clear,
so honoring it deadlocks the position permanently.
Also decided: `intentions/` node prose and `.claude/settings.json` are **struck
from the rename surface** (the node rules the first out; the second was measured
to carry no matching pattern), and **nobody mints any of the three phantom node
ids**.
**Reversibility.** Cheap. **Confidence.** High on (d), medium on (a) — it
resolves a duplicate-target pair by executor judgement where clarification 78
contemplates a deliberate ruling.

### 5.4 — `execution.strategy_fingerprint` keeps `{hash, sha}` (D5)

**Why.** `sha` is the provenance half — it is what makes a stamp auditable
against a commit, and dropping it removes the ability to detect the very defect
the unit exists to fix. There is **no write site on `main` yet**, so keeping the
richer shape costs nothing today while dropping it is an irreversible narrowing
taken before any consumer exists.
**Done.** `plans/dispatch-rsi-author-rulings.md:316-331`;
`plans/dispatch-rsi-sequence.md:383-388`. Unit 8 stays carried forward behind
#3023 for the **write-site** reason, not the shape one.
**Reversibility.** Trivially cheap in this direction (no consumers).
**Confidence.** High — the asymmetry is decisive.

### 5.5 — `target-workers.json`: XDG for the live file, tracked for a template (D6)

**Decided.** Ruling 2 governs the **live** file (relocates under XDG beside the
pause sentinel); `tactic-dispatch-config-template` governs a **template**
(tracked, defaults only, no live values). **Ship both.**
**Done.** `plans/dispatch-rsi-author-rulings.md:333-351`;
`plans/dispatch-rsi-serialized-pr-plan.md:2636-2646`.
**Why.** Three documents named three destinations. The two are reconcilable
rather than competing, and the combination serves Ruling 2's stated rationale
exactly: a fork gets a starting point without inheriting this deployment's
schedule. **`target_n` is explicitly untouched — zero is the weekly pace curve,
a deliberate pause, never a defect to fix.**
The template node's *"migrates, tracked"* wording is flagged for correction to
say *the template* migrates tracked, not the live file.
**Reversibility.** Cheap (unbuilt, Position 7). **Confidence.** High.

### 5.6 — PR3 Unit 3 takes option (b): ship the lens on source-verified figures only (D7)

**Why.** Option (a) requires a coordinated write-side instrumentation change
across five surfaces **and** an explicit ruling that a structuring-subagent-parsed
findings count clears the "accounting is verified" bar — a doctrine change
inventing a provenance standard this batch has no mandate to set. (b) ships a
real lens today (`touched_files_count` as the fix-yield term plus effort, model,
wall clock, price proxy) and records the unmeasurable half honestly: the
findings half of clarification 46's comparison is **not measurable today**, and
the `high` raise stays an unmeasured quality bet.
**Done.** `plans/dispatch-rsi-author-rulings.md:353-373`;
`plans/dispatch-rsi-serialized-pr-plan.md:1411-1412`. Park cleared in the same
write.
**Reversibility.** Cheap. **Confidence.** High that (a) exceeded the mandate;
medium that (b) is worth shipping in its reduced form.

### 5.7 — PR5 needs no author call; both nodes state their own approach (D8)

**Decided.** The registered questions were **artifacts of the plan text, not
gaps in the graph**. Re-read on disk 2026-08-30.
`tactic-review-stall-predicate-subprocess-spawn` rules the documented **superset
cost pre-filter** already shipping on `graph-select-target`'s
`_gate_maybe_interrupt`, keeping the **full** superset rather than narrowing to
`ci == failing`, in two `sonnet` units, with an explicit "do not author a
duplicate" of the existing exhaustive invariant test.
`tactic-done-node-retention-scan-cost`'s real three call sites are
`select-targets.ts`, `dispatch-graph-census` and `dispatch-graph-scope-sweep`.
**Done.** `plans/dispatch-rsi-author-rulings.md:375-399`; both PR5 Scope bullets
rewritten to the nodes' own approaches, with the `blocked_by` prerequisite on
`store-cache.ts` and an explicit "do not reimplement the primitive" stop.
**Confidence.** High.

### 5.8 — The batch mints Position 13's carrier itself, and the re-serve ships as ONE PR (D10)

**Why.** `tactic-review-dispatch-charter-split` is `phase: done` and records the
spec, not the execution — so `isOpenTactic` is false, no router loop can select
it, and no `# PR` section carries the work. Left as-is the position is **silently
dropped**. Minting is a graph write the batch is already pre-authorized to make
(`plans/dispatch-rsi-sequence.md`, "Batch execution authority", grant 2) and the
spec is complete, so no author input is needed to author the node. One PR rather
than three staged per-charter PRs, because `lifecycle-sensor.test.ts`'s coupling
guard requires the node edit and the code change **in the same branch**, and each
staged re-serve would pay the `--base` CAS invalidation again for no review
benefit.
**Done.** `plans/dispatch-rsi-author-rulings.md:420-441`;
`plans/dispatch-rsi-sequence.md:724-790` (a seven-item minimum contents list for
the carrier node); bundle-table row marked **⚠ NO CARRIER — must be minted
first**.
**Reversibility.** The mint is cheap; the ~316-child **exclusive** re-serve is
not — it invalidates every `--base` CAS manifest in flight, which is why it is
sequenced after Position 12.
**Confidence.** High on the diagnosis. Medium on one-PR-vs-staged.

### 5.9 — The four sibling-carrier drafts are still parked (Ruling 1 not yet executed)

> **REFUTED 2026-08-30 — this entry is wrong and the work is largely done.**
> Re-read directly on `origin/main` (`1f5d0909`), not via the rulings file's own
> audit this time. **Three of the four are now `phase: done` with
> `office_hours: null`**: `tactic-code-review-detached-node-lock`,
> `tactic-review-cheap-fix-disposition` and `tactic-audit-permission-friction`.
> Only `tactic-dispatch-code-review-concurrent-write-attribution` is still parked
> (`phase: null`). The rulings-file row this entry trusted — *"0 hits on all
> four. All four still carry live `office_hours` parks."* — is refuted in **both**
> halves; hits are 2, 3, 2, 2. The remaining owed work is **one node, not four.**
> See §4.12.

Ruling 1 rules that a draft whose substance shipped under a sibling carrier
becomes a **completion record** (stamp `execution.completion`, `raw → codified`,
`null → done`), not a prune. ~~All four named nodes still carry live
`office_hours` parks~~ — **struck 2026-08-30 (4th):** the banner above refutes
this, and leaving it in the body left the entry asserting four where its own
correction measured one. **One node is owed**, and on it
`tactic-review-cheap-fix-disposition` still carries *"(a) COMPLETION RECORD…"*
phrased as a park option rather than as the ruling it now is. Transcribing it is
the owed work; the option-phrasing is stale text, not an open question.
Cited: `plans/dispatch-rsi-author-rulings.md:20`, `:67-86`. *This is the rulings
file's own 2026-08-30 audit; the nodes were not re-read.*
**This is executor-owed transcription work**, not an author decision — recorded
so the gap is visible. The mechanism is known and stated at `:82-86`
(`dump-node.ts --dir` → jq-patch → `write-node.ts --dir` → `graph-commit -C`,
copying the shape from `tactic-review-effort-max-detached-resume-poll`).
**Confidence.** High that it is owed.

> **CROSS-REFERENCE — consolidation.** `AUTHOR-RATIFICATION-LIST.md` entry R-4
> (folded into §4.6) records this same question from the earlier, unrefuted
> vantage: **four** sibling-carrier drafts, four live parks, with *three
> separate parks asking for it to be ruled once in one sitting*. The conflict
> between "four owed" and this entry's measured "one owed" is flagged at §4.6
> and is left visible in both places rather than resolved by deletion. This
> entry's banner carries the later measurement.


### 5.10 — Reviewer's proposed fix refuted rather than applied (rulings item A)

**Decided.** All three "author call" findings on #3140 triaged as
**implementation, not doctrine**, and fixed. The reviewer's proposed fix for the
first — gating the office-hours queue on `blockersComplete` — was **refuted**:
`officeHours.ts:135` says `openBlockers` is *"Advisory only — never a gate"*,
and the office-hours SKILL says the same twice, so gating the queue is forbidden
outright.
**Done instead.** `composeAuthorRecommendation` names the merge precondition the
born-parked node was missing, and `decideMint` validates the PR at the boundary.
Cited: `plans/dispatch-rsi-author-rulings.md:194`; `cba77286` (F1).
**Why.** A born-parked node must carry at birth everything a fresh sitting
needs — but the fix must not convert an advisory signal into a gate.
**Confidence.** High; the doctrine is stated in three places.

> **FOLDED IN — consolidation, from `AUTHOR-RATIFICATION-LIST.md` entries R-1
> and R-3** (both recorded 2026-08-29 as `PENDING TRIAGE`). This entry already
> states that **all three** "author call" findings on #3140 were triaged as
> implementation and fixed, but it names the disposition of only the first. The
> earlier record carries the other two in full, and they are preserved here.
> Both are recorded as completed; the `PENDING TRIAGE` framing is withdrawn.
>
> **R-1 — Author-lane main-qa node can surface before its source PR merges.**
> Source: retroactive review of #3140, `src/mainqaRouting.ts:216`. The
> author-lane node is born parked and carries `blocked_by: [source]`, but
> `officeHoursQueue` (`src/officeHours.ts:76`) applies **no `blocked_by` gate**,
> so a human can be asked to verify against deployed `main` before the change
> lands. The **machine lane is safe** — it goes through `blockersComplete`.
>
> *Why it was initially read as possible doctrine, which is worth keeping:* the
> obvious fix — gate the office-hours queue on `blockersComplete` — **would hide
> every node parked *because* it is blocked and needs a ruling to unblock**,
> which is a common and important case. So the question was not "is this a bug"
> but "what should the queue's contract be". **Triaged as implementation**, and
> the reviewer's proposed gate was refuted for exactly that reason plus the
> stated doctrine at `officeHours.ts:135` — see this entry's body. This is R-1
> and this entry's "first" finding: one item, two records, merged here.
>
> **R-3 — A source PR closed *unmerged* strands its destination at `main-qa`.**
> Source: retroactive review of #3140, `scripts/reconcile-graph.ts:164`.
> Destinations are born at `main-qa`; `isMergeAbsorbable` excludes that phase
> **by Unit 4's design**, which exists to stop the node being destroyed before
> `/qa-main` runs. A source closed **without merging** therefore strands its
> destination forever.
>
> *The earlier record's own analysis:* possibly **not** doctrine — Unit 4
> forbids absorbing `main-qa` on a **merge**; a PR closed **unmerged** is a
> different event where the verification is moot because nothing landed. It
> **turns on whether the code can distinguish "closed unmerged" from "still
> open"**.
>
> **It can, and the fix shipped on that reasoning.** Measured for this
> consolidation on `packages/intentionsutil/scripts/reconcile-graph.ts` in the
> batch worktree checkout: a second predicate `isCloseAbsorbable(phase)` now
> sits beside `isMergeAbsorbable`, returning `isOpen(phase)` — **`main-qa`
> included, which its comment calls "the one way this differs from
> `isMergeAbsorbable`"** — and the call site dispatches on the event:
> `if (!(merged ? isMergeAbsorbable(node.phase) : isCloseAbsorbable(node.phase))) continue;`.
> The distinction the earlier record said the fix turned on is supplied by
> `--pr-states`, which carries `state: "merged"` only on a non-null `mergedAt`.
> The comment records the stranding mechanism verbatim — `graph-select-target`'s
> `main-qa` arm gates on `mergedAt` and returns `pr-not-merged` every tick,
> while `isMergeAbsorbable` keeps the sweep from ever enumerating the node
> again — and the outcome is the same rule every other closed-unmerged tactic
> gets: `phase: "done"` with `completion` left **null**, the deliberate
> census-flaggable integrity-defect signal rather than silent deletion.
>
> **No conflict between the two records on R-1 or R-3** — the earlier one states
> the findings and its preliminary reading, the later one states the triage
> outcome, and the measurements above confirm the outcome. What the earlier
> record supplies that this entry did not is the *reasoning* for two of the
> three, and the anchors.


### 5.11 — `/rsi-audit` ruled ineligible to write the config (rulings item E)

Charter bound 8 (`.claude/skills/rsi-audit/SKILL.md:204`) reads as forbidding it
— *"writes no control artifacts"*. **Treated as forbidding**; PR10 Unit 1 needs
a different writer. Cited: `plans/dispatch-rsi-author-rulings.md:198`;
`plans/dispatch-rsi-serialized-pr-plan.md:2944-2945`.
**Why.** The unit as written shipped a charter violation. Reading the bound
narrowly (a config file is not a "control artifact") was the alternative and
lost — the charter's purpose is that the auditor does not write policy.
**Reversibility.** Cheap. **Confidence.** Medium-high; it is an interpretation
of a bound, not a quotation of one.

### 5.12 — Making `hook-tests` a required status check (scheduled, with a precondition)

**Decided.** `hook-tests` should join `acceptance`, `lint` and `unit-tests` as a
required check on the default-branch ruleset — **but only after** the fix that
makes it non-fail-fast has merged to `main` and been observed green.

**Measured live 2026-08-30.** Ruleset **`12884700`** ("default branch", active)
requires exactly `acceptance`, `lint`, `unit-tests`.
`gh api repos/natb1/commons.systems --jq .permissions` →
`{"admin": true, "maintain": true, "push": true}`. **The executor can make this
change; it is not author-gated.**

**Why it matters.** `77bd7471`'s body records the consequence: `hook-tests` was
red and **non-gating since 2026-08-29**, because the ruleset does not require
it. Compounding it, `run-unit-tests.sh` is changed-files-scoped, so `main`'s
recent `plans/`-only commits made `unit-tests` pass **vacuously** — two red
breaks sat on `main` unseen until a PR touched files that selected those suites.

**The ordering constraint, and why it is load-bearing.** Requiring the check
before the fix lands blocks **every open PR, including the one carrying the
fix** — a self-deadlock. So the sequence is fixed: (1) land the non-fail-fast
fix; (2) observe `hook-tests` green on `main`; (3) then add the context to the
ruleset.

**Status of the precondition — UNSOURCED.** No "make `hook-tests` non-fail-fast"
fix exists in the repository as of 2026-08-30. Searched: `.github/workflows/unit-tests.yml`
(the `hook-tests` job at `:268` is ~25 sequential `run:` steps with no
`continue-on-error` and no matrix `fail-fast` key — the first failing step
aborts the rest), plus a full-text search of `plans/` for
`fail-fast` / `required status` (2 hits, both unrelated: a `test-park-node.sh`
precondition guard at `plans/dispatch-rsi-serialized-pr-plan.md:4067`). The
ordering requirement is recorded here as supplied by the batch coordinator; the
underlying facts about the ruleset and the vacuous `unit-tests` pass are
measured.

**Reversibility.** Trivially reversible — a ruleset context can be removed as
easily as added.
**Confidence.** High that `hook-tests` should be required. High on the ordering
constraint's reasoning. **Low on the precondition's status** — the fix it names
could not be located.

> **RE-MEASURED 2026-08-30 (3rd) — unchanged, and still not done.** Ruleset
> `12884700` ("default branch", active) requires exactly `acceptance`, `lint`,
> `unit-tests`; `hook-tests` is still not a context. Permissions re-read live:
> admin **true**. The precondition is still unlocatable — the `hook-tests` job in
> `.github/workflows/unit-tests.yml` still carries no `continue-on-error` and no
> `fail-fast` key (the single `continue-on-error: true` in that file, at `:577`,
> belongs to an unrelated job). **The "Low on the precondition's status" mark
> stands unchanged after a second search.** Note the related §5.13 change *did*
> land — `--strict-sensors` is live on `origin/main` at `unit-tests.yml:185` —
> so the CI surface moved and this specific item did not.

### 5.13 — A CI check was turned on that had been running nowhere at all

**Decided.** Make the post-merge `--strict-sensors` run actually execute.
**Done.** `08944a44`.
**Why.** The flag was gated on `github.ref == 'refs/heads/main'` *and* on
`steps.changes.outputs.graph == 'true'` — and that category is **never** true on
`main`, because `detect-changes.sh` diffs `origin/main...HEAD` and on a push to
`main` the checkout fetches `origin/main` **after** the push, so the diff is
empty. The two gates were disjoint: the strict check ran on **no ref at all**.
Measured on run `33288998641` (the push of `77bd747`): `graph-validate` reported
success while "Validate intention graph", "Install workspace dependencies" and
`setup-node` all reported `skipped` — a green job that ran nothing.
**Turning a check on can turn `main` red**, so it was confirmed passing first:
`validate-graph.ts intentions --strict-sensors` reports 751 nodes, 0 unresolved
prose refs, 0 unbound sensors.
**Reversibility.** Cheap. **Confidence.** High — verified before enabling.

### 5.14 — Prose reworded rather than suppressed with `// type-safety-ok:`

**Decided.** When `check-type-safety-escapes.sh` false-positived on the English
phrase *"rendered by `buildMainqaBody` as ONE markdown line"* (matching
`as[ \t]+[A-Z_$]`), the fix was to **reword the prose**, not to add a
suppression marker.
**Done.** `e9000912`.
**Why.** There is no hatch on that line to suppress, so a `// type-safety-ok:`
marker would be a **false claim of a deliberate escape** — it would corrupt the
signal the marker exists to carry. The alternative (marker with a reason) was
cheaper and lost on honesty.
**Reversibility.** Cheap. **Confidence.** High. Note the underlying sensor
false-positive class (the checker scans comment prose) is **not** fixed by this;
it will recur.

### 5.15 — Two pre-existing `main` breaks folded into a feature PR

**Decided.** Fix the two red-on-`main` breaks inside PR #3140 rather than cutting
a separate hotfix PR.
**Done.** `77bd7471` — §2.3 and §2.4 above are those two fixes.
**Why.** `main` was red, the PR could not merge until they were green, and the
dispatch ladder is frozen so nothing else was contending for `main`. Each was
proved pre-existing the same way: the subject file is absent from
`git diff --name-only origin/main...HEAD`, and the failure reproduces on content
byte-identical to `main`.
**Reversibility.** Baked in — the PR is merged.
**Confidence.** High on the diagnosis. Medium on the bundling: it mixes an
unrelated doctrine change (§2.3) into a feature PR's diff, which is exactly the
review-legibility cost the batch elsewhere pays to avoid (see §5.1).

### 5.16 — One finding deferred rather than decided — contrary to S-16, ~~still open~~ NOW DECIDED

> **DISCHARGED 2026-08-30 (3rd).** The deferral below was taken up and decided in
> **`d1fef042`** (#3143). The judgement call was made in the direction the
> deferral did not consider: the guard is **kept and its error class changed** —
> see **§1.10**. And the deferral's premise turned out to be **false**, not
> merely undecided: the guard is *not* unreachable in production, because rule 12
> is enforced only in `validateGraph` and `graph-commit` never runs it. So the
> S-16 violation recorded here cost more than a note — it left a live path
> mis-classified as a benign one for a further day. That is the strongest
> argument in this document for the rule S-16 states.

`639ddb64` skipped a review finding: `check-node-selection.test.ts:583` seeds
`kind: strategy` with `phase: implement`, which rule 12 rejects, and the guard it
targets is unreachable in production now that the squatter read is retired. The
commit records: *"Removing the guard or the test is a judgement call, tracked for
triage rather than decided by the fixer."*

Under S-16 (`plans/dispatch-rsi-batch-steering.md:239-246`) that is the error,
not the resolution — a judgement call is exactly what the executor is expected to
make. **Recorded here as an honest gap. It is executor-owed, not author-owed**;
the author should not need to act on it, and if it is still open when the batch
closes that is a batch defect.
**Confidence.** High — ~~that it is unresolved~~ **that it is now resolved**;
corrected 2026-08-30 (4th). The original line was written before the discharge
above and was never updated, so the entry closed by asserting the opposite of
its own banner. Decided in `d1fef042`.

### 5.17 — Measurement overrode plan text at two positions

Both are author-adjacent decisions worth confirming because they change what a
PR is allowed to claim:
- **PR7 must not credit the imported cache claim.** `cache_creation` is **4.3%**
  of all context tokens (1150179672 of 26796114528), so an append-only layout's
  arithmetic **ceiling** is 4.3% — against an imported claim of 41–80%.
  `creation_churn` is 0 churned of 401 staggered across 86 node groups.
- **PR11 must set per-lens `model:` from `cost_usd`, never `price_proxy_usd`.**
  The proxy holds price constant to isolate token count and therefore **inverts**
  the model ranking (sonnet 37827 above opus 31372). The measured opus-to-sonnet
  per-turn premium is **1.91×**.
Cited: `plans/dispatch-rsi-sequence.md`, §"Three measurement runs".
**Method note carried forward:** the freeze hides the thing being measured — a
7d window holds 2 sessions, a 14d window has `by_phase_outcome: {}`; only a 30d
window straddling the freeze (2026-07-30..2026-08-29) reads anything, and any
before/after comparison must hold window width constant across the freeze
boundary.
**Confidence.** High — measured, recorded on the nodes.

### 5.18 — Rule-number allocation, and a live collision

**Decided.** PR19 takes rules **24 and 25**; a Position 7 rule takes **26**.
Rule **20 is permanently burned** (`schema.ts:1779-1782`).
**Why.** PR16 already took **Rule 23** for the `attributes` shadow-ban, and
`tactic-supersession-edge-and-terminal` (PR19) claims 23 **and** 24. Rule numbers
are cross-referenced from node bodies and are never reused, **so PR19 must
renumber.** Recorded in `schema.ts`'s ledger paragraph and above the function.
Cited: `plans/dispatch-rsi-author-rulings.md:197`;
`plans/dispatch-rsi-sequence.md:346-350`.
**Reversibility.** Cheap before PR19 builds; expensive after (cross-references).
**Confidence.** High.

> **FOLDED IN — consolidation, from `AUTHOR-RATIFICATION-LIST.md`, closing
> section "Deferred-by-design, already recorded elsewhere".** That record states
> the same allocation — *"PR19 takes 24 and 25; if Position 7 adds a rule it
> takes 26"* — and marks it **"Ruled by me from the live catalog; low risk,
> mechanical."** The two records agree; this entry is the more complete one
> (it also records that **Rule 20 is permanently burned**, that **PR16 already
> took Rule 23**, and that **PR19 must therefore renumber**), so it governs. The
> earlier record is preserved here only as independent corroboration that the
> allocation was ruled by the executor from the live catalog rather than
> inherited from plan text.


### 5.19 — PR9 Unit 8 part 1 moved to Position 12 (rulings item B)

The plan directed work the node's own *Not in scope* section forbids. **The node
wins over the plan**; the work moves to Position 12.
Cited: `plans/dispatch-rsi-author-rulings.md:195`. Noted in `fc4ca3e9` as having
been reassigned by ruling B and left uncorrected in the documents until now.
**Confidence.** High.

> **FOLDED IN — consolidation, from `AUTHOR-RATIFICATION-LIST.md` entry R-6**
> (recorded 2026-08-29 as `NEEDS AUTHOR`). The decision was made and executed;
> the `NEEDS AUTHOR` framing is withdrawn per S-16.
>
> **The contradiction in full, which this entry states only in summary.** PR9
> Unit 8 part 1 directs a re-implementation of the lost Unit 4 *"from the scope
> preserved on the jobdir node"*. **That node's own `Not in scope` section says
> verbatim that it must not touch `schema.ts`'s `legacyTierKey` and must not add
> a `validateGraph` rule** — and assigns that work to a **Position 12** node
> instead. So the plan cited a node as its authority for work the node
> explicitly reassigns.
>
> **Resolution, unchanged:** the node wins over the plan, and the work moves to
> Position 12 — which is precisely the destination the node itself names. The
> two records agree on the outcome; the earlier one supplies the two specific
> surfaces (`legacyTierKey`, the `validateGraph` rule) that make the
> contradiction checkable.


### 5.20 — `tactic-select-tick-main-sync-gated-on-caller-cwd` assigned to Position 7 (rulings item C)

It belonged to no position. Assigned beside PR8 U2, which already edits
`dispatch-select-tick`; it is the only **hot** node on that PR.
Cited: `plans/dispatch-rsi-author-rulings.md:196`.
**Why.** An unassigned node is silently dropped — the same failure mode that
produced Position 12 and §5.8. **Confidence.** High.

> **FOLDED IN — consolidation, from `AUTHOR-RATIFICATION-LIST.md` entry R-7**
> (recorded 2026-08-29 as `NEEDS AUTHOR`). Decided and executed; the
> `NEEDS AUTHOR` framing is withdrawn per S-16.
>
> **The state that made it urgent**, which this entry omits. The node was listed
> under **PR8's closed nodes**, named by **no unit**, flagged as **the only hot
> item on that PR**, and sitting at **`phase: implement` with no plan behind
> it**. A node at `phase: implement` with no plan and no owning unit is not
> merely unassigned — it is router-eligible with nothing to execute. That is why
> the assignment beside PR8 U2 (which already edits `dispatch-select-tick`) was
> made rather than deferring the question.
>
> The two records agree on the disposition. The earlier one supplies the node's
> phase and its "only hot item" status.


### 5.21 — Seven vacuous or inverted `verify` fences corrected store-wide (rulings item F)

> **CORRECTED 2026-08-30 — the UNSOURCED mark below is discharged, and the
> number "seven" turns out to be a coincidence of two different counts.** The
> sweep's working artifacts were located
> (`/tmp/claude-1000/fence-correction-spec.md`, `…-part2.md`,
> `…/fence-corrections.md`). They record **15 fences classified** — 1 sound,
> 5 fragile, 6 vacuous, 2 inverted, 1 vacuous-guard — of which **3** were
> confirmed false PASSES, rising to **7** once the four "AT-RISK" blocks were
> actually executed. The two inverted fences described below are F12 and F13
> (`intentions/tactic-retire-assessor-contract-docs.md:139` and `:274`), both
> bare `grep -r .` with the polarity backwards *and* rc-2 poisoned, and F12 is
> not under `## Verification` at all, so it never auto-ran. **Method and
> disposition are now at §1.5**, which also names the new Shape E.
Two were **inverted** — they passed only when the property was violated.
Corrected in place.
Cited: `plans/dispatch-rsi-author-rulings.md:199` ("see the sweep report").
**The sweep report itself is not linked from the rulings file and was not
located during this compilation — marked UNSOURCED as to its contents;** the
existence and disposition of the seven is sourced.
**Confidence.** Medium — the decision is recorded, the detail is not reachable
from the citation given.

### 5.22 — PR16 Unit 3 shipped without `--dir`, against the plan

**Decided.** Ship without `--dir`, following the node rather than the plan.
**Why.** The plan's premise — that PR1 had made this script's tree explicit — is
**false** (PR1 touched it by comment only), and adding `--dir` would have shipped
the very defect the unit exists to close: four sensors close over module-level
store constants, so a **partial** `--dir` reads one store while writing another.
Cited: `plans/dispatch-rsi-sequence.md:340-345`.
**Reversibility.** Baked in — merged as `96d22cb1` (#3138).
**Confidence.** High.

### 5.23 — Fleet-alarm: MIGRATE THE DATA FIRST, then align the code. The order is load-bearing.

> **REFUTED IN SCOPE 2026-08-30 (3rd), and step 2 was DEFERRED.** The ordering
> argument below is sound and was followed. **Its data set was not.** This entry
> says *"Measured. 8 `tactic-fleet-alarm-*` nodes on `origin/main` … All 8
> predate the region"* and prescribes migrating all eight. That census was taken
> by **name prefix**, and four of the eight are not alarm-kind nodes at all —
> they are session- and author-authored findings that merely share the prefix.
> **Only four were migrated** (`61cdca5d`), and wrapping the other four would
> have labelled human plans as machine-generated output. See **§1.12** for the
> enum measurement. **Step 2 (aligning the no-op comparison) was NOT done** — it
> was deferred to its own tactic for the reason in **§1.11**. So this entry's
> "Measured" line is refuted, its ordering argument stands, and its step 2 is
> owed rather than shipped.

**Decided.** `splice_body` and the no-op comparison in `dispatch-fleet-alarm`
disagree about who owns a **pre-region** body. The fix is executed in two steps,
in this order and no other:

1. **Wrap the 8 legacy `tactic-fleet-alarm-*` node bodies in the marker pair** —
   a data migration, no code change.
2. **Then** align the no-op comparison to `splice_body`'s **conservative** rule.

**The disagreement, read on `origin/retro-code-review-batch`.** For a node with
no `<!-- generated:dispatch-fleet-alarm -->` region yet:

- **`splice_body`** treats the prior body as **authored** and keeps it, appending
  a fresh region *after* it. It discards only `write-node.ts`'s single-line
  `# <statement>` placeholder (`[[ -n "$authored" && ( "$authored" == *$'\n'* ||
  "$authored" != '# '* ) ]]`).
- **the no-op comparison** takes the opposite view: *"A node written before the
  region existed: the whole body was ours"* — `cp "$ONDISK_BODY" "$ONDISK_REGION"`.

**The consequence, traced.** On a legacy node the comparison diffs the new
reading against the **whole old body**, which never matches, so the tick always
classifies "changed" and refreshes. `splice_body` then **preserves** that old
body — which *was* the previous generated reading — as if a human had written it,
and appends the new region beneath. Result: **each of the 8 nodes permanently
strands exactly one stale reading** above its live region, and the strand is
sticky, because on the next tick the node has a region and the comparison
narrows to it.

**Measured.** 8 `tactic-fleet-alarm-*` nodes on `origin/main`:
`busy-stall`, `daemon-casualty-list`, `daemon-degraded`, `mint-rollback-corruption`,
`node-park-clobber-loop`, `resolve-rollback-latch`, `unclaimed-hold`,
`watch-unknown`. All 8 predate the region.

**Why not the other direction.** The cheaper repair is to make `splice_body`
match the comparison — treat a pre-region body as script-owned and overwrite it
wholesale. **Rejected.** That reinstates precisely the defect the marker pair was
introduced to fix (§2.2): it **discards a human diagnosis written into a
pre-region node**, which is the exact case the change exists to protect. A parked
alarm node is parked *because* a human is looking at it; a pre-region node is the
oldest such node and therefore the most likely to carry one.

**Why the order cannot be reversed.** Aligning the comparison first — teaching it
`splice_body`'s conservative rule while the 8 nodes still have no region — makes
it read their region as **empty**, compare the reading against nothing, classify
"changed" on every tick, and strand the body on the very next refresh. The
migration is what gives the conservative rule something correct to compare
against. Doing step 2 before step 1 causes the exact harm step 2 exists to
prevent.

**Reversibility.** Step 1 is a graph write across 8 nodes: reversible, but each
reversal is its own `graph-commit`, so it is not free. Step 2 is a small code
change. **Confidence.** High on the disagreement and on the stranding mechanism
(both code paths read in full). High on the ordering argument. Medium on whether
all 8 need migrating rather than only the parked ones — migrating all 8 was
chosen for uniformity, since a partial migration leaves the same two-rule split
in place, just smaller.

### 5.24 — Two review findings fixed, one of them a concurrent-writer data-loss path, with a regression pin PROVEN to distinguish

**Decided and done.** `f2dd808d` (on `origin/plan-reconciliation` / PR #3142 —
**not** on `origin/main`), refined by `97fa10d6`.

> **CORRECTED 2026-08-30 (3rd).** PR #3142 merged as **`35ab0e45`**, so both
> changes are on `origin/main` and the "not on `origin/main`" caveat is spent.
> `f2dd808d` and `97fa10d6` are themselves unreachable from any ref (squash +
> branch delete) — see the third-pass banner. The 27/27 figure is independently
> re-reported post-merge in `8fe1d359`'s verification table.

**Finding 1 — `reconcile-graph-merged` could `git reset --mixed` away a
*concurrent* writer's unpushed commit.** The `${#EDIT[@]} -eq 0` early exit
returned **without disarming `RESTORE_ON_FAILURE`**, so the EXIT trap ran
`restore_node_files()` on a sweep that had written nothing. Two harms, and the
second escapes the sweep entirely: it logged a false *"rolled the node write(s)
back to HEAD"*, and because `graph_rollback_node_writes()` reads a **moved HEAD**
as "graph-commit landed and stranded a commit", a concurrent graph writer landing
during the planning window could send it into
`_graph_discard_stranded_commits` and `git reset --mixed` **that writer's**
unpushed commit away.

**This was a routine path, not a rare one.** `unprovenMainQa` enumerates a merged
record-time mint on **every** sweep and `isMergeAbsorbable` then refuses it, so
the empty plan is the common case.

**The rationale for the disarm was corrected before it shipped**, and the
correction is worth carrying because it changes whether the fix reads as
cosmetic. The first draft said the disarm is *"safe because `BASE_BLOB` is
empty"*. Wrong: `_graph_discard_stranded_commits` runs **before** the per-id loop
and restores the **stranded commits'** paths, not the caller's pinned ids — so an
empty `BASE_BLOB` does not make the trap harmless. The correct reason is that
**every `writeNode()` in `reconcile-graph.ts` is paired with an `editSet.add()`**,
so an empty `.edit[]` means nothing was written at all.

**Finding 2 — the write-surface guard failed CORRECT runs.** In
`review-fix-write-surface-guard.sh` the `BASELINE_PATHS` skip ran **before** the
returned-id match, so a returned id whose file was already an untracked stray
never set `ID_SATISFIED`, and the guard failed a correct run with *"the return
value and the tree disagree"*. Ordinary, not hypothetical: a parked
`graph-commit` leaves `intentions/<id>.md` untracked, and the next round's
subagent writes that same path again. Testing the returned id **first** is what
makes the baseline a pre-existing-stray filter rather than a blind spot.
`ID_SATISFIED` was also hardened with `:-0` — an unset associative-array element
aborts under `set -u`.

**The pin was proven, not assumed.** **Test 6c** was verified to **distinguish
old from new behavior before being accepted**: against a reverted copy of the
guard it fails with the exact false-failure message; against the fix it passes
silently. Suite **27/27**. `97fa10d6` then rewrote the guard's own contract
paragraphs, which still described the **pre-fix** ordering in three places — a
maintainer restoring the documented order would have reintroduced exactly the
false failure 6c pins.

**Reversibility.** Both are small, self-contained and pinned by tests.
**Confidence.** High. The concurrent-writer path is the more serious of the two
and was the harder to see: nothing in the empty-plan exit looks dangerous until
you notice the trap reads a moved HEAD as evidence of its own stranded work.

### 5.25 — A SECOND live instance of the same classifier bypass, deliberately scoped out of the prose fix

**Decided.** `dispatch-mark-complete` is in the same position as `graph-commit`
(§1.6) — statically allow-listed under a **relative** path, and invoked by Lane 3
under an **absolute** one. It is **deliberately left alone** in the §1.6 prose
edit, and filed as its own unit.

**Measured 2026-08-30 on `origin/main`.**
- `.claude/settings.json:43` —
  `"Bash(.claude/skills/dispatch-propagate/scripts/dispatch-mark-complete:*)"`
- `.claude/skills/dispatch-conflict/SKILL.md:1565` —
  `"$PROJECT_ROOT/.claude/skills/dispatch-propagate/scripts/dispatch-mark-complete" --phase fix-conflicts`

The absolute spelling does not prefix-match the allow entry, so every Lane 3
`dispatch-mark-complete` falls through to the auto-mode classifier — the same
bypass, live, on a second helper. (Lanes 1 and 2 already invoke it relatively at
`:472`, `:475` and `:720`, so the repo is internally inconsistent about it.)

**Why it is scoped out rather than fixed in passing.** Re-spelling `:1565`
relative turns
`test-dispatch-conflict-lane3-cwd-ratchet.sh` **section 6 RED** — section 6 bans
relative helper paths in Lane 3 fenced blocks and carves out `graph-commit` **by
name only**. So the fix is not a one-line edit; it needs **three things in one
unit**: the call site, the test carve-out, and a **compensating positive
assertion** — the analogue of section 6b's *"every fenced `graph-commit` carries
`-C \"$PROJECT_ROOT\"`"*, which is what keeps the carve-out from being a hole.
Widening the exemption without inventing that compensating assertion first would
convert a principled carve-out into a general escape.

**Why it is recorded and not just done.** Folding it into the §1.6 prose edit
would have mixed a **test-reddening code change** into a documentation
correction, which is the review-legibility cost this batch pays elsewhere to
avoid (see §5.15, where the opposite call was made and rated Medium).

**The residual, stated plainly.** The bypass is **live today** and will stay live
until that unit ships. This is a decision to sequence, not a decision to
tolerate. It is executor-owed.

> **RE-CONFIRMED 2026-08-30 (3rd), unchanged on `origin/main` at `45af501f`.**
> `.claude/settings.json:43` still carries the **relative**
> `"Bash(.claude/skills/dispatch-propagate/scripts/dispatch-mark-complete:*)"`;
> `dispatch-conflict/SKILL.md:1565` still invokes it **absolutely** under
> `"$PROJECT_ROOT/…"`; and Lanes 1 and 2 still invoke it relatively at `:472`,
> `:475` and `:720`. Every line number in this entry still lands. The bypass is
> live, on the same three lines, one day on.

**Reversibility.** Cheap; nothing has been built. **Confidence.** High on the
mismatch (both lines read on disk). High that section 6 would go red (the
carve-out names `graph-commit` and only `graph-commit`). Medium on what the
compensating assertion should be — `dispatch-mark-complete` has no `-C`-shaped
argument, so the analogue is not obvious and may need a different property
(cwd-independence proved some other way).

### 5.26 — `merge-node` truncated its own JSON on a pipe, and `graph-commit` died with NO PARK WRITTEN

**Decided and done.** Both exit paths in
`packages/intentionsutil/scripts/merge-node.ts` now set **`process.exitCode`**
instead of calling `process.exit()`. Landed `d1fef042` (#3143); verified on
`origin/main` at `45af501f` — `process.exitCode = 0` and `= 3`, with the
reasoning recorded in a comment above them.

**The failure, and why it is the most consequential item in this pass.**
`process.exit()` terminates immediately and **discards whatever is still queued
on stdout.** `graph-commit` invokes `merge-node` through a **command
substitution**, so stdout is always a pipe. A large merge result therefore
arrived **truncated**; the caller's `jq -e .` failed on invalid JSON and reported
a broken environment. An ordinary large-node merge was misdiagnosed as a tooling
failure — and **`graph-commit` died with no park written**, which is the worst
shape a graph writer has: not a refusal, not a park a human can find, but a
silent death leaving the node in no recorded state.

**Measured in isolation, because the failure is size- and context-dependent.** A
1 MB single write with `process.exit(0)` arrives as **exactly 65536 bytes** — for
a fast reader, a slow reader, and a command substitution alike. The same write
with `process.exitCode` arrives complete. 65536 is the pipe buffer; nothing about
the payload's content matters.

**Why `process.exitCode` and not a drain-then-exit.** Setting the code and
letting the event loop finish is the language-level guarantee; a manual drain is
a second thing to get right at every call site and silently regresses when a new
exit path is added. This is the fix that cannot be re-broken by adding a branch.

**Reversibility.** Two lines; trivially reversible and pinned by a test proven to
distinguish (§2.11).
**Confidence.** High — the truncation reproduced at a fixed byte count across
three reader shapes, and the test fails against a reverted copy.

### 5.27 — Fixing a leaked job slot reached outside the PR, deliberately, because the BREADTH was the point

**Decided.** The reclassification in §1.10 exposed a second defect: the align
worker's **mechanical-error path recorded no terminal disposition**, so a node
that hit it became **permanently unselectable** — a leaked job slot with no
operator-visible cause. The fix was made in the **same PR**, in
`.claude/skills/align-tactics/SKILL.md` and its
`test-align-tactics-terminal-marker.sh`, even though that is outside the two
`packages/intentionsutil` scripts #3143 was scoped to.

**The review called this an author call. It was triaged and done.** Under S-16 a
judgement about scope breadth is exactly what the executor is expected to decide.
The reasoning for deciding it *wide*: the mechanical-error path now **reaps**, on
the reasoning **the neighbouring paths in the same skill already state** — so the
change makes the skill internally consistent rather than inventing a policy. And
the leak was **already latent via three other routes** before §1.10 added a
fourth, so scoping the fix to the route this PR created would have left the
same slot leaking through the other three and produced a fix that reads as
complete and is not.

**Why not a follow-up node.** A follow-up would have shipped #3143 knowing it
introduced a fourth entrance to a live leak, and relied on the queue to close it.
That trades a small diff for a real window.

**Reversibility.** Cheap; a skill-body change plus a shell test case. Reverting
restores the leak on all four routes.

**Confidence.** High on the leak mechanism and on the three pre-existing routes.
**Medium on the breadth call** — a reviewer preferring tight PR scopes would
split this, and the cost of that preference is the window described above.

### 5.28 — Squash-merge makes a cited sha a perishable address; cite the landed form

**Decided.** Provenance in this document is stated as **PR number + landed squash
sha**, with the branch sha demoted to a historical label. Fourteen citations were
re-labelled rather than deleted.

**Measured.** Both batch PRs squash-merged and their branches were deleted:

```
$ for c in 245da5bc b616fe21 22f438a6 b01341a1 cba77286 49a133b2 639ddb64 \
           fc4ca3e9 2daae4ee 08944a44 e9000912 f2dd808d 450c9b25 97fa10d6; do
    git cat-file -e "$c^{commit}" && echo "$c EXISTS branches:[$(git branch -r --contains "$c")]"
  done
… all fourteen: EXISTS branches:[]
```

Each object survives in the store — so `git show` still works today — and is
reachable from **no ref at all**, so it is unreferenced and eligible to be
garbage-collected. The landed forms are `12716163` (#3141) and `35ab0e45`
(#3142).

**Why this is worth an entry rather than a silent fixup.** It is the same
instrument failure as §1.7 (line anchors) and §1.13 (grep methods), one layer up,
and it is the *least* expected of the three: a sha is normally the thing you
reach for **because** it does not rot. Under squash-merge it does. The durable
rule: **cite the PR number, which is stable, and the squash sha, which is on a
ref; a branch sha is a label, not an address.**

**Reversibility.** Documentation only. **Confidence.** High — enumerated over all
fourteen, `--contains` empty for every one.

### 5.29 — PR19's binding rulings were folded into the node bodies, because they existed only in plan prose

> **NEW ENTRY — consolidation, from `AUTHOR-RATIFICATION-LIST.md` entry R-8**
> (recorded 2026-08-29 as `RULED-BY-ME (interim)`, with the closing line
> *"ratify that the rulings as transcribed are correct"*). It has **no duplicate
> anywhere in `author-ratification-list.md`** and is carried in full. Under S-16
> the transcription is a completed executor action; the "ratify that…" phrasing
> is withdrawn, and the entry is recorded as done with its reasoning intact.

**Decided and done.** Two of PR19's binding rulings — **the no-park-for-in-flight
rule** and the **mandatory expiry-event field** — existed **only in plan prose**.
They were folded into the two supersession node bodies at the bookkeeping commit,
so they survive independently of the plan file.

**The measurement that forced it.** `grep -in 'expiry'` returns **zero hits
across both supersession node bodies**. Both rulings lived in the plan text and
nowhere else.

**Why it could not be left.** Two distinct harms, and the second is the more
expensive:

1. **A clean session handed the node bodies alone builds the un-ruled design.**
   This is the recurring defect the whole batch surfaced — see §1.3, which
   records the same class as doctrine, and §4.12, which records the
   transcription-status measurement that class produced.
2. **The missing field becomes a data migration rather than an edit.** A
   mandatory field added *after* nodes exist without it is not the same change
   as one present at authorship; the cost of the delay is a migration.

**Relationship to the rest of this document.** §1.3 rules that a plan file may be
operatively binding as the *lesser harm* while transcription is owed; §5.29 is
one discharge of exactly that debt. §4.12 records how badly the transcription
*status* banner was measured (three wrong attempts before a correct one — see
"Errors in this record", class 1), which is a reason to treat this entry's own
"folded in" claim as needing a content re-read, not a phrase grep: per §1.13 a
fixed-phrase banner cannot survive a faithful paraphrase.

**Reversibility.** Prose on two nodes; free to re-word. The migration avoided is
the part that does not come back cheaply.

**Confidence.** High on the zero-hit measurement as taken. **Medium on whether
the rulings as transcribed are faithful** — the earlier record explicitly asked
for that to be checked, and no independent re-read of the transcribed text
against the plan text is recorded in either source. That is the one thing in this
entry worth the author's eye.

### 5.30 — `tactic-supersession-retirement-sweep`: park premise dead, `clear-park` is the correct instrument, R-9's stated reason superseded

> **NEW ENTRY — consolidation, from `AUTHOR-RATIFICATION-LIST.md` entry R-9**
> (recorded 2026-08-29 as `NEEDS AUTHOR`). **That framing is withdrawn**, per the
> standing rule this document opens with. R-9's stated reason was measured
> against `origin/main` for this consolidation, found superseded, and is
> corrected here rather than carried as an open question.

**Decided 2026-08-30.** The park on `intentions/tactic-supersession-retirement-sweep`
(`since: 2026-08-21`) is dead on its premise, and **`clear-park` is the correct
instrument** — not the completion record. R-9's ground for withholding the clear
— *"clearing a park is an office-hours act"* — was **already false when written**:
Ruling 4 had by then been transcribed onto `strategy-graph-native-dispatch`,
delegating exactly this act to the executor. A stale-authority error, not a
doctrinal disagreement.

**The authority is the author's own un-park criterion, not executor discretion.**
From the `maintenance-burden` condition on
`intentions/strategy-graph-native-dispatch.md`, as amended 2026-08-28 (ruling in
`751982b0`):

> THE BAND IS IN BREACH AND THE BREACH IS ACCEPTED: disposition (c), ACCEPT THE
> BREACH WITH REMEDIATION. […] A measured breach of the 35% target is NOT this
> condition failing and is NOT grounds for a Side-A park […] UN-PARK CRITERION,
> stated as a rule rather than an enumeration because any hand-list goes stale
> immediately: every node parked SOLELY on the maintenance-burden band breach is
> un-parked on the drain plan. A node carrying a second, still-open blocker is
> NOT un-parked by this.

The node qualifies on both limbs, measured at `origin/main` `8ae96615`:
`blocked_by: []`, and the park text says in terms *"NOTHING ELSE BLOCKS THIS
NODE — this park is about the strategy's band, not about this record."* It is on
the drain plan: PR19 at `plans/dispatch-rsi-serialized-pr-plan.md:4984`, shipping
as PR19b at Position 6 per `plans/dispatch-rsi-sequence.md:619-630`.

**Each premise clause, measured.** The ceiling limb still fails as a *fact* — the
author re-measured it higher, 135 of 316 = 42.72% — but it is dead as a *ground*,
because the author ruled the breach accepted and wrote that re-parking on it
"adds one to the very numerator the condition measures." The non-increasing limb
is dead outright, withdrawn in terms. The "needs an author decision on the
strategy" clause is dead: the decision was taken, and `f093e607` is on
`origin/main`. The "finalizing worsens the ratio" clause was explicitly rejected
as a reason to keep nodes parked — the author declined disposition (a) because it
"keeps 82 parked nodes parked for the window."

**Ruling 4's two exclusions were tested; neither bites.**

*Not a dead scope.* `execution: null`, no PR. `lint-verify-fence-paths.sh` on
`origin/main` is 694 lines and still fence-scoped: zero hits for `park-node` and
zero for `lib-deleted-node-ids`, so neither the body-prose pass nor the park lane
exists, and `verify-fence-path-baseline.json` is still `[]`. PR19's
`superseded_by` is absent from `packages/intentionsutil/src/schema.ts`. The defect
class is live: `.claude/skills/align-strategy/` is absent from `main`, yet five
non-`done` nodes still name `align-strategy/SKILL.md` in body prose —
`tactic-align-strategy-new-steps-revision`, `tactic-graph-ref-split`,
`tactic-reading-review-comprehension-staging` (all `phase: implement`),
`tactic-scope-fingerprint-plan-substance` and
`tactic-strategy-fingerprint-stamp-coverage` (both `phase: qa`). None is caught by
the shipped fence-scoped lint. That is the recall hole this node exists to close.

*Not the only stop on a bad automated action.* The pause sentinel gates worker
spawning and scheduling and the freeze is held
(`plans/dispatch-rsi-sequence.md:192, 205, 210`), so a clear changes router
eligibility, not scheduling. And the author ruled the action itself permitted:
*"Machinery-defect finalizes on this strategy are NOT halted"* (`f093e607`).

**Why not the completion record.** Ruling 4's carve-out is **conjunctive** — a
`phase: null` node **whose work already shipped**. This node is `phase: null` with
nothing shipped, so `clear-park` is right and `phase: done` would be a false
terminal. Router-eligible is the intended outcome: the park's own recommendation
step (2) asks for it — *"IF THE BAND IS CLEARED, re-run `/align-tactics
tactic-supersession-retirement-sweep` unchanged."*

**Precedent, applied rather than noted.** `f093e607` cleared the park on
`tactic-graph-commit-park-content-durability` under this same ruling — the node
this node's own recommendation names as carrying *"the identical blocker"*. It is
now `phase: done`, `office_hours: null`. The strategy states why it waited: *"only
once ALL of its blockers were ruled, not on the band alone"* — it had a second
blocker. This node does not. §4.6's sixth park was dispositioned the same way, so
the inconsistency an earlier draft of this entry flagged resolves in favour of
§4.6 and this clear.

**Stale facts the resumed round must re-derive** — a plan-freshness note, not a
blocker: the park's named live proof case `tactic-node-ancestry-context` is now
`phase: done` and so out of the lint's population, and the 28-hit prototype
measurement dates to `53eefa33` (2026-08-21).

**Reversibility.** A park re-set is one `park-node` call, and the park text is
preserved both here and in git history. Nothing irreversible.

**Confidence.** High on every measurement above, all taken against `origin/main`
`8ae96615`. High that `clear-park` rather than the completion record is the
instrument: the shipped-work test was run four ways — the `execution` field,
the script's content, the baseline file, and the schema surface — and all four
say unshipped. The one unmeasured input is the live `dispatch.config/` pause
sentinel, untracked and unreadable from an isolated worktree; the conclusion does
not depend on it, because the author separately ruled machinery-defect finalizes
on this strategy not halted.

---

## Errors in this record — the compiler's own

Not a tier, and nothing here needs the author to act. It is here so the author
can calibrate how far to trust the rest of the document. Five classes, all
caught, all in this window.

**1. A transcription-status banner was wrong THREE TIMES in three attempts.**
The sequence: **1 of 7** → **5 of 5** → **6 of 6** → and only then the correct
**8 of 8**. Each attempt corrected the previous one **and introduced a new error
in the same sentence** — a scope error, then an off-by-one, then a
denominator that counted the wrong population. The instructive part is not any
one figure but the shape: a sentence rewritten under time pressure, three times,
never re-derived from scratch, each pass anchoring on the previous pass's frame.
The fix that finally worked was to re-measure from the store rather than to edit
the sentence. **§4.12 records the downstream consequences; this records that the
document's own most-corrected sentence was corrected badly twice before it was
corrected well.**

**2. Two fabricated 40-character SHAs.** Both invented, neither copied from any
tool output. One was **rejected fast** by `gh`, which does not resolve unknown
objects. The other was **accepted by a tool that then ran ~10 minutes against a
commit that does not exist** — the expensive shape, because the tool's silence
read as progress. A plausible-looking sha is the single most dangerous thing to
generate rather than copy: it passes eye-checks, and roughly half the tools that
take one will not tell you it is fictional.

**3. A claim that a reference was "body prose the validator never reads."** It is
inside **frontmatter**, in a field the validator **does** scan
(`rationale` — see §4.18). Two errors compounded: "frontmatter" was treated as
synonymous with "unread", and the scanned-field list was assumed rather than read
out of `validateGraphProseRefs`. The conclusion happened to survive for the id
that mattered; the reason given for it did not.

**4. Escape advice that would have corrupted a field.** Guidance was given to
escape a character before writing it into a node — but the prescribed repair path
re-serializes through `write-node.ts`'s YAML **emitter, which escapes for you**.
Following the advice would have double-escaped and written the escape sequence
into the field as literal text. The general error: reasoning about the *file
format* while the actual write goes through a *serializer*. Whatever the emitter
owns must not also be done by hand.

**5. Three vacuous verifications caught before shipping.** Each would have
reported a pass that proved nothing:
- a payload sized **under a buffer boundary**, so the test passed against the
  *buggy* code (§2.11 records both bad sizes and why only the middle one works);
- a **revert-based red proof** whose anchor silently stopped matching, so the
  "reverted" copy was never actually reverted and the proof compared the fix to
  itself;
- a red-proof that **could not distinguish absence from mis-scoping** — a
  command that returns nothing when the property holds *and* when the search is
  pointed at the wrong tree.

Three caught is not evidence that three is the total. It is evidence that a
verification's *own* non-vacuity is a thing to prove, not assume — which is the
same standing instruction §1.5 states for `verify` fences, arrived at
independently.

**What this adds up to.** The mechanical measurements in this document — greps
re-run with `LC_ALL=C grep -a`, censuses computed over the whole store, mutation
proofs — held up on re-check. The failures cluster in **restated numbers**, in
**identifiers written from memory**, and in **claims about what a tool reads**.
Where an entry carries a figure that was carried forward rather than re-measured,
its confidence line now says so.

---

## Appendix — where the batch stands, for context

- **Merged to `main` in this window:** `478cc324` (#3134, PR18), `a4a964b8`
  (#3136, PR15), `96d22cb1` (#3138, PR16), `77bd7471` (#3140, PR5a), plus their
  graph bookkeeping commits.
- ~~**Open, carrying most of the Tier 2 and Tier 4 work:**~~ **MERGED
  2026-08-30 (3rd)** — PR **#3141** (`retro-code-review-batch` — the four
  retroactive `/code-review high --fix` passes, per steering S-10/S-11) merged as
  `12716163` at 06:30Z, and PR **#3142** (`plan-reconciliation` — the
  59-contradiction reconciliation and the executor decisions D1–D10) merged as
  `35ab0e45` at 06:53Z. Both branches were deleted; see the third-pass banner.
- **Next position:** 4. Position 3 shipped, but its Unit 7
  `Verifiability: WAIT` migration and node closeout are still owed.
- The batch's working tree HEAD moved during this compilation (a concurrent
  graph write reset it to `origin/main` + `9201fdeb`); the sixteen commits cited
  above remain reachable on `origin/plan-reconciliation` and
  `origin/retro-code-review-batch`, verified 2026-08-30.

### Second-pass appendix, 2026-08-30 (evening)

- **`origin/main` is at `1f5d0909`** ("graph: record Ruling 5"). Seven graph
  commits landed since the first pass: `1f5d0909`, `60dd2b54`, `9f48d645`,
  `91bc7cc9`, `4ffbc8b3`, `9201fdeb`, `fdcd17cf`. Between them they **transcribed
  the author rulings onto their nodes**, which is what obsoleted §1.3, §4.2 and
  §5.9 — see §4.12.
- **`origin/plan-reconciliation` is at `97fa10d6`**, three commits ahead of where
  the first pass left it: `f2dd808d` (§5.24), `450c9b25` (§4.13, §4.12 step 1),
  `97fa10d6` (§4.12 step 2, plus the guard-contract and rationale repairs in
  §5.24).
- **A citation caution that applies to §4.13 and §5.24.** Both were described to
  this compilation as "landed". Measured: `450c9b25` and `f2dd808d` are on
  `origin/plan-reconciliation` (**open PR #3142**) and are **NOT ancestors of
  `origin/main`**. They are committed and pushed; they are not merged. The
  entries say so.

### Third-pass appendix, 2026-08-30 (late)

- **`origin/main` is at `45af501f`**, nine commits past `1f5d0909`. Five PRs
  merged: **#3141** → `12716163`, **#3142** → `35ab0e45`, **#3143** →
  `d1fef042`, **#3144** → `8fe1d359`, **#3145** → `45af501f`. Four direct graph
  landings: `1c0dd63d`, `c0cecce1`, `a1e7b0e6`, `61cdca5d`.
- **The two open PRs the second-pass appendix named are both merged.** #3141 and
  #3142 closed at 06:30Z and 06:53Z. The "Open, carrying most of the Tier 2 and
  Tier 4 work" line above is spent, and the "NOT ancestors of `origin/main`"
  caution attached to §4.13 and §5.24 is discharged — replaced by a different
  caution, the squash-sha class in the third-pass banner.
- **The store was frozen for the entire window.** 754 node files, 215 parked,
  **zero** phase or park-state changes across all nine commits (§4.15). Every
  landing in this window was code, plans, or node *bodies* — no node changed
  lifecycle state.
- **Still owed at the close of this pass**, all executor-owed, none author-owed:
  §1.6 (the Lane 3 rule paragraph, decided but unshipped), §1.11 / §5.23 step 2
  (the fleet-alarm no-op comparison), §2.7 (the `claude_job_id_for_name_all`
  test — re-verified today as still zero-coverage by `git log -S` over all
  history), §2.8 (report the red fence), §4.13's residual (the unhandled
  autonomous mint refusal), §4.18 (18 further prose-repair sites), §5.12 (the
  `hook-tests` precondition, still unlocatable), §5.25 (the second classifier
  bypass).

### Corrections to the third pass — entries found stale or refuted

| Entry | Verdict | What changed |
|---|---|---|
| §1.6 | **STALE** | The decided rule amendment never landed; `SKILL.md:927-932` is unchanged on `main` |
| §2.1, §4.9, §5.24 | provenance | `245da5bc` / `f2dd808d` / `97fa10d6` unreachable; landed as `12716163` / `35ab0e45` |
| §2.9 | **CORRECTED** | Landed atomically as `45af501f`; the assertion count is **12**, not 11; the 6-WARN figure confirmed |
| Tier 2 "Outstanding" | **DISCHARGED** | `8fe1d359` deleted the guard; zero `list-entry` hits remain (§2.10) |
| §4.11 | **PARTLY REFUTED** | "Every reference is body prose" is false; anchors already rotted 10 lines (§4.18) |
| §4.12 | **STALE** | Ruling 4 now has a node home; the rulings banner on `main` still says it does not (§1.9) |
| §4.13 | **CORRECTED** | On `origin/main` via `35ab0e45`; the residual is unchanged and still open |
| §5.16 | **DISCHARGED** | Decided in `d1fef042`; the deferral's premise was false, not merely undecided (§1.10) |
| §5.23 | **REFUTED IN SCOPE** | 8-node census was by name prefix; only 4 are alarm kinds; step 2 deferred (§1.12, §1.11) |
| §5.12, §5.25 | re-confirmed | Unchanged on `main`; every line number still lands |
| §5.9, §2.7, §2.8, §4.7 | re-confirmed | Park state, zero coverage, red fence and the 68-file naive grep all reproduce |

Two figures carried into this pass did **not** reproduce and are left standing as
contradictions rather than smoothed: the WAIT census node count (briefed 15,
measured **14** — §4.16) and the broken-vitest fence count (briefed 8, measured
**10** in scan scope and **14** store-wide — §4.17).

### Corrections to the first pass

Nine first-pass items were re-checked and moved. Nothing was silently rewritten;
each carries a dated note in place.

| Entry | What changed | Where the correction lives |
|---|---|---|
| §1.1 | Anchor `:1486-1489` → **`:1482`**; rule bullet `:926` → `:927`; the open doctrine gap is now decided | §1.6, §1.7 |
| §1.3 | "1 of 7 transcribed / operatively binding" is dead; replacement overclaimed and was rescoped | §4.12 |
| §2.1 | Suite is **27/27**, not 25/25; guard's internal ordering changed | §5.24 |
| §4.2 | Same as §1.3 | §4.12 |
| §4.9 | The 25/25 figure it quotes is superseded by 27/27 | §5.24 |
| §4.10 (anchors) | The "explicit non-decision" **has been decided**: delete anchors, per section | §1.7 |
| §4.10 (three ids) | They were **pruned after shipping**, not never-created | §4.11 |
| §5.1 | Re-confirmed independently on the second pass; no change | §5.1 note |
| §5.3(d) | The `blocked_by` is **not an edge**; conclusion stands, hazard did not | §4.11 |
| §5.9 | **Refuted** — 3 of the 4 nodes are `done` / unparked; one remains | §4.12 |

Two first-pass framings were corrected in the document's own front matter: the
"near-total anchor rot" caution (§1.7) and the class of grep used to measure
transcription (§1.8).
