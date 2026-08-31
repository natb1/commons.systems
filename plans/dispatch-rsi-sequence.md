# The dispatch/RSI window — state and serial PR sequence

> ## ⚠ READ THIS BEFORE EXECUTING ANY POSITION
>
> **1. Anchors are hints, not addresses.** Treat every `path:line` anchor in this
> document as a search hint. Locate the code by **content** — the symbol name,
> the quoted line, the surrounding block — and never by the line number. This is
> not a caution about a few stale numbers: measured 2026-08-29, PR5's Scope had
> 8 dead anchors of 8, PR19 Unit 1 had 6 of 6, PR4 had 11 of 12, PR9 Unit 1 had
> 4 of 4. Anchors labelled "verified" in this document are included in those
> counts. Several anchors were copied out of node bodies **that themselves record
> the anchor as already wrong**. If a quoted line is not at the quoted number,
> that is the expected case, not evidence the work is done.
>
> **2. The node body is the authority; this document is not.** Where this
> document and the `intentions/` node body disagree about scope, design,
> sequencing or model, **the node governs** — the sole exceptions are the
> explicit rulings in `plans/dispatch-rsi-author-rulings.md`, which override
> both. Before implementing any unit, open every node in that PR's `### Nodes
> closed` list and read its Scope, its `## Out of scope`, its
> `clarifications:` and its `office_hours` block. This document was written
> before many of those nodes were finalized and reproduces superseded drafts
> in several places.
>
> **3. Check the park before you plan the unit.** A node with a non-null
> `office_hours` is not autonomously selectable — `packages/intentionsutil/src/router.ts:482`
> and `:529` both `continue` on it. No PR section in this document lists its own
> parked nodes, and the index's "Open parks" row is incomplete. Run
> `LC_ALL=C grep -a -A1 '^office_hours:' intentions/<node>.md` on every node in
> the PR before starting.
>
> **4. Searching `intentions/` needs `LC_ALL=C grep -a`.** One node file carries
> a literal NUL byte; plain `grep -n` prints nothing for it and still exits 0, so
> a census taken with plain grep silently undercounts.

> **Node ids cited in this batch that do not exist in `intentions/`** (verified
> 2026-08-30): `tactic-graph-digest-tooling` (cited by PR17 Unit 6 and by
> `.claude/skills/align-audit/SKILL.md`), `tactic-status-kind-vocabularies`
> (cited by `tactic-schema-drift-guard` and `strategy-graph-self-description`),
> `tactic-dispatch-skill-input-contract` (a phantom `blocked_by` on
> `strategy-graph-native-dispatch`). A fourth, `tactic-align-audit-legacy-review`,
> was pruned deliberately and is already acknowledged in the plan — not a defect.
> **Corrected 2026-08-30: no author call is owed on any of the three, and none
> may be minted.** All three existed, completed, and were deleted by routine
> census-reconcile prunes *after* their PRs merged. Measured on `origin/main`
> (`git log --diff-filter=D` then `git show <sha>^:intentions/<id>.md`):
> `tactic-graph-digest-tooling` — `status: codified`, `phase: done`, `pr: 2865`,
> pruned by `afe270a7`; `tactic-status-kind-vocabularies` — `status: codified`,
> `phase: review`, `pr: 2876`, pruned by `a7273245`;
> `tactic-dispatch-skill-input-contract` — `status: codified`, `phase: review`,
> `pr: 2923`, pruned by `20b0432c`. The shipped artifacts are on `main`:
> `packages/intentionsutil/scripts/graph-digest.ts`, `checkStatusVocabulary` in
> `schema.ts`, and `dispatch-derive-node-target` with its test. **What each
> citation needs is past-tense repair, not a decision.**
>
> **The citation list above names two non-`intentions/` sites, and both already
> read past-tense — the outstanding repair scope is the 9 `intentions/` sites
> (re-measured 2026-08-30).** Of those two, PR17 Unit 6 is wrapped in the
> past-tense ⚠ callout at `plans/dispatch-rsi-serialized-pr-plan.md:4525-4537`,
> and `.claude/skills/align-audit/SKILL.md` (a skill, not a plan) was fixed in
> the E22 commit, as `:4537` there records. Do not read "two" as the whole
> non-`intentions/` grep result: `LC_ALL=C git grep -a -l
> 'tactic-graph-digest-tooling' origin/main` returns nine files, four of them
> outside `intentions/` — those two, this index file's own census, and
> `packages/intentionsutil/prose-ref-baseline.json:24`, where the pruned id
> appears as a `referencedBy` (a stale grandfather entry naming a node that no
> longer exists, not a citation of it, so it needs deletion rather than
> past-tense repair). `tactic-graph-digest-tooling` is
> cited 13 times under `intentions/`, 9 of them needing repair:
> `strategy-graph-review-curriculum.md:158`, `strategy-graph-integrity.md:23`
> and `:138`, `tactic-align-audit-skill.md:76`, `:110` and `:172`,
> `tactic-serves-inheritance-full-strip.md:21`, `:53` and `:112`, plus four
> historical provenance mentions on `tactic-graph-digest-quality-followups.md`
> (`:5`, `:15`, `:57`, `:682`), which are correct as history and need nothing.
> Two of the nine are **prose `blocked_by` references** —
> `tactic-serves-inheritance-full-strip.md:21` reads *"the digest's DUP-SERVES
> table (blocked_by tactic-graph-digest-tooling)"* and `:53` repeats it — the
> same defect class this window corrects for `tactic-dispatch-skill-input-contract`
> at PR13 (d): no frontmatter edge, so the router never traverses it, but a
> human reader takes it for a live blocker (the node's real `blocked_by` is
> `[]`, `:42`). **The two sites are in different places, corrected 2026-08-30:**
> `:53` is body prose, but `:21` is inside the frontmatter (delimiters `:1` and
> `:47`), in `rationale:` (`:11`) — today a **double-quoted multi-line scalar**,
> not a `|`/`>` block scalar.
>
> **That distinction is the whole point of this correction:** `:53` is an
> ordinary `.md` text edit, `:21` is a FRONTMATTER FIELD edit and must go
> through the full `dump-node.ts` -> edit -> `write-node.ts` -> `graph-commit`
> path. Never hand-build a partial payload — `validateNode` defaults every
> omitted field, so a minimal payload silently writes `phase: null`,
> `execution: null` and `serves: []` over this node's live `phase: implement`
> (`:33`), its `execution` block including `strategy_fingerprint` (`:34-40`)
> and its one `serves` entry (`:26-27`), exit 0 and no error.
>
> The flag semantics for that path are documented in the tools' own headers
> (`dump-node.ts`, `write-node.ts`, `graph-commit`) and in
> `.claude/rules/sandbox.md`, and are deliberately NOT restated here — with the
> single exception in the first bullet below, which is the one place the headers
> point the wrong way rather than merely leaving something out. An
> earlier revision of this passage did restate them; it was rewritten across
> eight review rounds and every single recurrence was the restatement drifting
> from the tool it described, never the tool changing.
>
> **Who owns the `:21`/`:53` repair:** `tactic-graph-digest-quality-followups`,
> Unit 6 — landed on `main` 2026-08-30 as `b4df1b61`. That node is the pruned
> predecessor's live successor carrier, so all nine stale citations are its
> scope, and the unit carries every site by path and line plus the split
> instrument `:21` (frontmatter) and `:53` (body) require. It is still not a unit
> of any position below and is not scheduled by this document — the graph owns
> it, which is the resolution rather than a gap. Three review rounds found the
> earlier wording, which could only say the repair was owed "by whoever executes
> that pass", and that is nobody.
>
> Two mechanical constraints on that path. Both are stated as instructions and NOT
> derived here, for the same reason the flag semantics above are not — and this
> passage is the second proof of that reason, not a fresh claim: the derivation
> that used to sit here was rewritten in every round that followed, each time
> refuted by a finer measurement of a tool that had not changed. It belongs beside
> the code it describes, where drift is visible, rather than in a plan document.
>
> - **Pass the payload with `--file <path>`, never `echo '<json>' | …`.** Both headers
>   document the pipe form as ordinary usage and neither warns about it —
>   `write-node.ts:6` gives it as the first usage example, and `dump-node.ts:29-30`
>   calls the dumped JSON "ready to pipe back into write-node.ts". Do not follow them
>   here: this node's value contains shell metacharacters, and the resulting corruption
>   is not reliably loud — some spellings of it produce valid JSON that writes at exit 0.
>   Omitting `--file` is not a usage error either (the header documents stdin as a
>   neutral MODE, `write-node.ts:1`, `:28`), so a non-interactive call without it blocks
>   on `/dev/stdin` until the tool times out, or dies at EOF on an uncaught `JSON.parse`.
> - **The payload is a JSON document** (`writeNodeFromJson`'s `JSON.parse`,
>   `write-node.ts:40`), so quote it by JSON's rules and by nothing else. `writeNode`
>   re-serializes through the emitter (`store.ts:61`), which owns the YAML layer; do
>   not pre-escape for it, and do not hand-correct what it writes back.
>
> Both sites are read by tooling: `validateGraphProseRefs`
> (`packages/intentionsutil/src/schema.ts:1973`) scans `statement`, `rationale`,
> `attention.rationale`, every `clarifications[].answer` and the body — so it
> reads `:21` (inside `rationale`) and `:53` (in the body) alike. Repair
> both in the same past-tense pass. And
> `tactic-graph-digest-tooling`'s deferred review follow-ups already have a live
> successor carrier: `tactic-graph-digest-quality-followups` (`status: codified`,
> `phase: implement`, `blocked_by: []`, `office_hours: null`), which is already
> in PR17's own `### Nodes closed (6)` list.

**The scope of the window:** retire the open in-flight bugs, then land the
greenfield design for the RSI, for `/align` graph management (its tooling and
its data structure), and for the dispatch ladder (including automated
scheduling) — executed serially, by hand, while all other implementation work is
frozen.

This file is the **index**: where the window stands, and what order the rest of
it runs in. The executable per-PR detail is in
`plans/dispatch-rsi-serialized-pr-plan.md` — every section there is
clean-session-executable, and this file deliberately does not restate it.

**The split is by question, not by topic.** This file answers *what to run
next, and in what order*; it owns bundle composition, execution order, the hard
ordering constraints and the cross-PR dependency edges. The plan answers *how to
run one PR*. The plan carried its own copy of the bundle table, the recommended
order and the dependency tree until 2026-08-29; the copies had drifted, so they
were consolidated here and the plan now points at this file.

> **This file carries no history.** Author rulings live on their nodes in
> `intentions/`; how the window reached its current state is in the commit
> history. What is written below is only what still governs work that has not
> happened yet. If you want to know why a decision went the way it did, read the
> node or the commit — do not expect a narrative here.

---

## Where this stands

| | |
|---|---|
| **Shipped** | **PR1** — graph write-path integrity, `fe0b1c4d` (#3095). Its eight nodes are closed. Every later PR builds on it. **PR18** — the durable-layer write fence, `478cc324` (#3134), Position 1. Bookkeeping landed `84cc158e`: four of its five nodes closed, one parked — see §"Position 1 — PR18". **PR15 (U0/U3/U4)** — the graph-commit simplification half of Position 2, `a4a964b8` (#3136). Bookkeeping landed `1f56e0c2`: all five of its nodes closed — see §"Position 2 — PR15". **PR16 (7 of 12 units)** — the node-mutation half, `96d22cb1` (#3138). Bookkeeping landed `c55710c4`: eight of its twelve nodes closed, four carried forward — see §"Position 2 — PR16". **PR5a (Units 1–6)** — record-time main-qa routing, `77bd7471` (#3140), Position 3. **Bookkeeping landed 2026-08-30**, in two graph landings: `74c281dc` (the Unit 7 migration — 22 marks off 15 source nodes, all 15 node bodies rewritten in a *single* `graph-commit`) and `94427773` (the host node closed). *(An earlier revision of this row also named `b76ce953` as the 15-node landing; that is a misattribution — `b76ce953` is an unrelated align landing over six strategy/tactic nodes, and `74c281dc` is the 15-file commit.)* Three follow-on landings cleared the debt this position carried: `ccb3f915` (11 stale WAIT-cohort parks, one invocation), `e54b64ee` (`tactic-review-stall-conflict-lane` closed as a completion record) and `8ae96615` (17 verification-fence corrections across 12 nodes, one invocation) — see §"Position 3 — PR5a" |
| **Retired** | **Position 0**, the in-flight overhang. Five clean draft-halves landed (#3099, #3101, #3102, #3104, #3105); seven drafts stay open by ruling, each absorbed by the bundle that owns its surface |
| **Discharged** | **Every author gate.** All ten prerequisite decisions were ruled at the 2026-08-28 sitting, the last two re-ruled 2026-08-29, and all eleven `office_hours` parks cleared. The two decisions that came due later — the PR15 ref-split revisit and where `tactic-retire-assessor-contract-docs` rides — were **ruled 2026-08-29**, as was the research lane's build-or-retire — **BUILD, folded into `/rsi-audit`** as an opt-in, token-targeted subskill with no schedule, which retired the weekly cron and dissolved two of that node's three owed rulings rather than answering them. The last open ruling — PR14's `tactic-rsi-reprioritization-outcome-audit`, what its observable (a) measures — was **ruled 2026-08-29, disposition (A) ratified as proposed** (baseline = complement cohort; interval = creation → phase-done for both cohorts).

**Seven further rulings were made 2026-08-29**, in two interview sittings called because the "no position waits on the author" claim this row used to carry was false at five positions. They are recorded in `plans/dispatch-rsi-author-rulings.md`. **Corrected 2026-08-30 (second pass): all seven are transcribed onto their nodes on `origin/main`** — landed by `9201fdeb`, `4ffbc8b3`, `91bc7cc9`, `60dd2b54` and `1f5d0909`, all confirmed ancestors of `origin/main`. An intermediate correction here claimed "only 1 of 7"; it rested on a BRE-alternation-under-ERE false negative. `plans/dispatch-rsi-author-rulings.md` is **no longer operatively binding** — it is the index and the audit trail. The node body is the authority. In summary: a sibling-carrier draft becomes a **completion record**, not a prune; `dispatch.config/target-workers.json` **relocates under XDG**; strategy clarification 131 is amended to **make its premise true** at the selection-time surface; **park-clearing on a verifiably dead premise is delegated** to the executor, as is clearing the parks that block Unit 7's migration from draining; plan-prose rulings absent from the graph are **transcribed into node bodies and flagged**; **record-time minting is correct** and the "already-merged" prose is stale; and PR20 **Units 1 and 3 are descoped** |
| **Measured** | **All three `/rsi-audit` runs, 2026-08-29**, recorded on their nodes. Two changed what their PR should do: PR7 must not carry the imported cache claim (measured ceiling **4.3%**, against 41–80%), and PR11 must set per-lens `model:` from `cost_usd`, since `price_proxy_usd` inverts the model ranking. See §"Three measurement runs" |
| **Next** | **Position 4 — still Next; every one of its 22 units is unbuilt.** What changed 2026-08-30 is that the position is now *unblocked*, not that it is done. Position 3 is fully discharged — shipped as #3140, and its Unit 7 migration plus every node closure landed 2026-08-30 (see the Shipped row for the five commits). Position 4's pre-verification found three blockers; **all three are ruled and written down** in §"Position 4 · Bundle 2" below, which is the source (two discharged, one an ordering rule: listnodes-scan first, retention-scan after it, CI-stall unit last). The **action-order hazard that row used to warn about has been executed and avoided** — one `graph-commit` landed `4d66566f` first (the ci-pending node reset to `phase: null` / `execution: null` / `blocked_by: []`, its hold carrier discharged to `phase: done`), then the node was verified out of `reconcile-graph-merged`'s absorbable set, and only then was **#3002 closed unmerged** with its branch preserved at `24bc8cee`. The same commit cleared the **two band-blocked parks** (`tactic-supersession-retirement-sweep`, `tactic-align-tactics-drift-dump-office-hours`), so Position 4 carries **no open park**. The position is now **11 nodes / 22 units** and is clear to build; see §"Position 4 · Bundle 2" for the executed order and for the per-unit model tags in the plan's PR5 section — it is **not** a uniformly-sonnet PR |
| **Carried forward** | **Four PR16 units and the #3023 absorption**, none of which gate a later position. Units 1 and 6 hold live `blocked_by` edges. Units 8 and 9 were parked on unmade author rulings; **both were decided by executor judgement on 2026-08-30** and are recorded for ratification in `plans/dispatch-rsi-author-rulings.md` §"Executor decisions taken during reconciliation" — Unit 8 keeps `{hash, sha}` (still sequenced behind #3023), Unit 9 keeps the empty-named-store contract and is rescoped to a comment correction plus an explicit empty-store message. #3023 is wholly unlanded and is a PR-sized change of its own — see §"Position 2 — PR16" |
| **Open parks** | **Far more than one.** This row read "One, from Position 1" until 2026-08-29; per-position pre-staging disproved it. Confirmed live parks: **Position 1** — `tactic-autonomous-body-write-wholesale-replace` (PR18 shipped one of its four surfaces by a local contract rather than the shared primitive the node exists to introduce, and six of its seven units are assigned nowhere; three dispositions are in `office_hours.recommendation`; it gates no position). **Position 4** — **0 as of 2026-08-30**. The count of 1 was right; the identity was not. This row's "1" was read as `tactic-review-stall-conflict-lane`, which was never parked at this point — it is `phase: done` on `origin/main` via `e54b64ee`. Position 4's one park was the hold carrier `tactic-hold-conflict-autonomous-ci-pending-liveness-bound`, and `4d66566f` discharged it to `phase: done` / `office_hours: null` per the 13 `tactic-hold-*` precedents. **Position 5** — 3 (was 4; `tactic-audit-permission-friction` closed on `origin/main` by `91bc7cc9` — `phase: done`, `office_hours: null`, a Ruling-1 completion record against PR #3074), recorded nowhere in either document until 2026-08-30: `tactic-audit-instrument-scoping`, `tactic-audit-review-effort-yield-lens` (both PR3) and `tactic-graph-prose-ref-batch-wiring` (PR4 Unit 8, which the plan text called "unparked and unblocked" — it is neither). **Position 6** — 1. **Position 7** — 6, five of them on one owed ruling. **Position 8** — 3, where the position entry claims one. **Position 9** — 6, where the plan banner claims none. **Position 10** — 1, `tactic-dispatch-skill-standards-extraction`, parked since 2026-08-20 on four unrecorded premises, the first (a duplicate carrier) disqualifying on its own. **It is NOT the position's only usable node and the position is NOT blocked outright:** the rival carrier `tactic-dispatch-skill-rename` is `status: raw`, `phase: null`, `blocked_by: []`, `office_hours: null` on `origin/main` — live and unparked. **But state both halves.** The executor decision naming it the carrier (D3) exists **only in plan prose**: `LC_ALL=C git grep -a -l 'dispatch-skill-rename' origin/main -- intentions/` returns three files (`tactic-dispatch-skill-rename.md`, `tactic-dispatch-skill-standards-extraction.md`, `strategy-graph-native-dispatch.md`) and **none records the decision** — `carrier` appears 0× on the rename node, `2026-08-30` 0× on either. So the duplicate-target pair is still live in the graph, and this park **correctly stays held**: its own recommendation forbids the workaround verbatim — *"Do NOT clear this park by finalizing a plan without the carrier decision: that resolves a duplicate-target pair by omission, the failure mode the 2026-07-19 precedent (clarification 78, commit `4a83dfc1`) was ratified to prevent."* Clearing it requires the `/align` pass on `strategy-graph-native-dispatch` the park names, not this window's prose. Separately, **12 of the 14 nodes carrying live `Verifiability: WAIT` marks are parked** (re-censused 2026-08-30 with `LC_ALL=C grep -a` over the `phase: main-qa` cohort: **14 nodes / 22 marks / 12 parked**, not the 17 this row used to claim, and not the 15 an intermediate revision carried — see §4.16 of `plans/dispatch-rsi-author-ratification.md`, which rules "15" unsourced because no scoping reaches 15 nodes with 22 marks; "17" counts non-`done` tactics that merely mention the string), and `packages/intentionsutil/src/router.ts:482` and `:529` skip any parked tactic — so those sources can never drain to `done`, deadlocking Unit 7's chain for them. Clearing is delegated to the executor by the 2026-08-29 ruling, on a verified-dead premise only, each clear reported after the fact — **and the ruling is BOUND: "a DEAD PREMISE is not a DEAD SCOPE … Where clear-park is the wrong instrument — a `phase: null` node whose work already shipped, which clear-park makes router-eligible rather than terminal — the correct act is the completion record (`phase: done`), never the clear."** Quoted from `intentions/strategy-graph-native-dispatch.md`. Check which of the two is dead before every clear |
| **Not started** | Positions 4 through 13. PR2 through PR20 |

The rulings that shape unit work are carried in the position entries below and,
in full, in the PR sections of the plan. Nothing else from the sitting needs to
be read.

---

## The premise: the freeze is held, not waited out

Four ground rules, set by the author, hold across everything below.

1. **No carrier node.** These PRs are implemented ad-hoc, in sessions that
   bypass the dispatch ladder. No node carries `execution.pr`; a PR is a plain
   branch off `main`.
2. **Node bookkeeping is an explicit post-merge step**, not a ladder
   transition. Each PR section in the plan ends with the exact write that closes
   its nodes.
3. **All three large refactors are in scope** — lens-catalog decomposition,
   intervention-core extraction, dispatch skill rename — and are sequenced last,
   because each rewrites surfaces the earlier PRs edit.
4. **The freeze does not lift until this sequence is done.** The pause sentinel
   is not an outage to work around and not a window that might close mid-flight;
   it is the enabling condition. Any step reading "before resumption" means
   before *that* point, not before some externally scheduled restart.

**What the freeze does not stop.** The sentinel gates worker *spawning* and
scheduling. It does not gate ledger bookkeeping and **it does not freeze
`main`** — a paused tick still runs five sweeps and drains the node lane. Plan
accordingly: `main` moves under you while the window is open, which is why the
plan's anchors need re-verification and why several PRs guard against a
concurrently landed write being clobbered.

---

## The sequence

Every position is a **bundle** — PRs grouped by shared code surface, because the
work is serialized and the cost of a large PR is lower than the cost of two PRs
touching the same file.

**114 tactics are assigned across the sequence**, none twice, plus 13
surveyed-but-unassigned and 13 absorbed by the overhang retirement. 36 of the
114 sit on the graph read/write path — the largest single surface in the window,
and the one every other PR's bookkeeping runs through. It read 117 / 11 / 38
until 2026-08-29; see §"Coverage" in the plan for the reconciliation.

| # | Bundle | PRs | Nodes | Why here |
|---|---|---|---|---|
| ✅ | 1 · graph read/write path | PR1 | 8 | **SHIPPED `fe0b1c4d`** (#3095) |
| ✅ | 0 · retire the in-flight overhang | *no new PRs* | +13 | **RETIRED** — cleared the drafts every later bundle would conflict with |
| ✅ | 1c · durable-layer write fence | PR18 | 5 | **SHIPPED `478cc324`** (#3134). 4 nodes closed, 1 parked |
| **2** | 1b · graph plumbing | PR15 (U0/U3/U4) + PR16 | 13 | HOT. The closure toolchain itself. PR15's hold discharged 2026-08-29 — split, U1–2 dropped |
| **3** | 2a · record-time main-qa routing | PR5a | 1 | Must precede Bundle 2 |
| **4** | 2 · tick-path reconcilers and sweeps | PR5 + PR9 U2,U6 + PR2 U6 | 10 | HOT. Runs on every tick, paused or not |
| **5** | 4 · instrument + finding surface | PR3 + PR4 | 16 | COLD, but unblocks positions 6 and 8 |
| **6** | 2b · supersession representation | **PR19b** (PR19 **splits** — see §Position 6) | 2 | Real `blocked_by` edge onto PR4's write surface. **PR19a** — the `schema.ts` `superseded_by` edge + `superseded` terminal, 1 node — ships **ahead of Position 5**, because PR4's central node is `blocked_by` it |
| **7** | 3 · dispatch runtime | PR2 rest + PR6 + PR7 + PR8 U1–2 + PR9 rest | 25 | COLD. Nothing invokes it while paused |
| **8** | 5 · RSI chain | PR10 + PR11 + PR12 + PR14 | 10 | COLD. Needs PR2 + PR3 + PR4. **PR14's 3 are not all plannable — expect a subset** |
| **9** | 5b · `/align` charter + adversarial review | PR20 + assessor-doc retirement | 9 | **Must** precede the rename |
| **10** | 6 · skill rename | PR13 | 1 | Last, alone. Renames every path PR20 writes |
| **11** | 7 · merge queue + scan cadence | PR17 | 6 | COLD. Must be in place *before* the resumption |
| **12** | 8 · the four deferred A3 drafts | #3093 → #2856 → #3040 → #3037 | 4 | Bulk node-content rewrites invalidate every `--base` CAS manifest |
| **13** | 9 · the charter split | **⚠ NO CARRIER — must be minted first** | 1 spec node (`done`) | Deferred past 12 for the same CAS reason. Node edit + paired code change in one branch. `tactic-review-dispatch-charter-split` is `phase: done` and records the **spec, not the execution** — it can never be selected. See §Position 13 for what the carrier must contain |
| — | *staged resumption* | — | — | Sentinel off at `max_concurrent_workers: 1`, one node through the full ladder |
| — | *deferred outright* | PR8 U3 | 1 | Rewrites the freeze mechanism; only during an attended un-pause |

---

## Position by position

### Position 1 · Bundle 1c — PR18, the durable-layer write fence ✅ SHIPPED

Merged as **`478cc324`** (#3134), 2026-08-29. Bookkeeping landed `84cc158e`.

5 nodes. `dispatch-eval-finding`, `dispatch-graph-census`, `/dispatch-conflict`,
`/review-fix`, `router.ts`, `graph-commit`'s park path.

**Four nodes closed, one parked.** `tactic-dispatch-conflict-substance-allowlist`,
`tactic-review-fix-porcelain-guard-script`,
`tactic-fleet-alarm-node-park-clobber-loop` and
`tactic-graph-commit-park-content-durability` carry `phase: done` and an
`execution.completion` citing the merge. Each also carries a body record of what
shipped against what is still owed.

`tactic-autonomous-body-write-wholesale-replace` is **parked, not closed**. This
plan scoped its Unit 1 to one live site and annotated the node "a draft, not a
plan … no verification block" — which was true of the 2026-08-15 draft but not of
the node, whose 2026-08-20 `/align-tactics` round finalized it to `phase:
implement` with seven units and a Verification section. Six of those seven did not
ship: the shared `node_body_write` primitive does not exist, so
`dispatch-eval-finding` was hardened in place by a **local** contract instead of
calling it, and the copy-paste the node exists to eliminate still sits at three
sites. Grepped across this plan, no PR section claims `node_body_write`,
`dispatch-diagnose-main`, or `dispatch-invalid-state-followup`'s copy, so closing
it would have dropped that work out of the graph. Three dispositions —
split, narrow-and-mint-a-successor, or close-as-superseded — are in the node's
`office_hours.recommendation`. **Nothing waits on it**; later positions do not
touch those surfaces.

Two follow-ups came out of PR18's review and are recorded on nodes rather than
built: the durable-write fence arguably belongs inside `write-node.ts` rather than
a `/dispatch-conflict` skill step (nothing forces a skill step to run), and
`/review-fix`'s Unit-1 probe — has the lane ever actually modified a pre-existing
node? — was not run, so that question is still unmeasured.

Front of the queue for two reasons. Mechanically, its one `blocked_by` edge
cleared when PR1's nodes closed, so it is ready and nothing else is. By
argument, it is the fence that decides what an **autonomous** writer may do to
durable node content — and roughly a hundred node closures still run through
that fence. It sits ahead of Bundle 1b because it carries no ref-split exposure
and PR15 does.

Two rulings shape its units:

- **Unit 4** (fleet-alarm frozen-tactic clobber) implements **both** remedies
  (a) and (b). They fix different halves of the loop; neither alone closes it.
- **Unit 5** (park content, delete/modify) takes the **ordinary branch only**,
  and records the delete/modify residue rather than handling it.

### Position 2 · Bundle 1b — PR15 ✅ SHIPPED + PR16 ✅ SHIPPED, the graph plumbing

15 nodes; the closure toolchain every later bundle's bookkeeping runs through.

**PR15 (U0/U3/U4) shipped 2026-08-29** as `a4a964b8` (#3136); its bookkeeping
landed as `1f56e0c2`. PR16 is the remaining half of this position. Details in
§"PR15 — what shipped" at the end of this section.

**PR16** (11 nodes — `transition-node`, `park-node`/`clear-park`,
`read-sensors.ts`, `validate-graph`, `verify-landed`) is the half worth landing
here. It absorbs #3023, #2975 and #2974. Two rulings shape its units:

- **Unit 10** (sensor de-registration) ships in a fixed order: **shape (2)
  first** — a post-merge check on `main` that cannot deny a write, and therefore
  cannot re-arm the repo-wide write outage — **and it must FAIL the post-merge
  `graph-validate` job, not warn on stderr.** Shape (1), the node-scoped fatal
  inside `guard`, follows only once its new `origin/main` read has a proven
  failure-open path. The premise was verified live: `main` is not in
  `unit-tests.yml`'s `branches-ignore` and `graph-validate` is a job inside that
  workflow, so (2) needs only the binding-comparison check and no new workflow.
- **Unit 5** (`readDelegationRecordsReading`): the rule **still governs** — port
  it, **retarget** its two tests, amend the threshold, then delete the dead
  function. The threshold half is sequenced **reader-then-threshold**: the
  reader must first gain a canonical, date-free met-state string, and the
  threshold is then set to *exactly* that string. `deriveGap` is trimmed
  case-insensitive string equality, so a reader that embeds its read date can
  never meet any fixed threshold — rewording the threshold alone is a silent
  no-op.

**PR15's conditional hold is discharged.** The revisit the 2026-08-14 ref-split
disposition demanded was held on **2026-08-29** and ruled a **split**: PR15
ships **Units 0, 3 and 4 only**. Units 1–2 are **not written** — ref-split's
Unit 2 rewrite subsumes them, and the ruling refuses to write code with a known
deletion date on the hot writer path. DEFER stands for ref-split itself; its
rider (incremental cutover, blocker re-cut from 23 to 8) stays on the record as
post-window work rather than being adopted into this window.

Two consequences the position must carry: PR15 now closes **2 nodes, not 4** —
`tactic-graph-commit-plumbing-default` and
`tactic-graph-commit-direct-three-way-merge` move to the ref-split deferral set,
which grows from three nodes to five. And **Unit 0 still ships**: it is the
layer-2 REMOVAL correctness fix, and it was always marked as shipping even if
PR15 split. PR16 never shared the exposure and proceeds independently.

Kept separate from Bundle 1 deliberately: both touch `graph-commit`, but Bundle
1 was correctness and this is simplification. Landing them together would mean a
regression in the writer could not be bisected against a known-good one.

#### PR15 — what shipped, 2026-08-29

Merged as `a4a964b8` (#3136). Bookkeeping landed `1f56e0c2`, closing **five**
nodes. Units 1–2 were not written, per the split ruling, so the
`GRAPH_COMMIT_WRITER` default remains `worktree`.

**The five closed nodes** — `tactic-graph-commit-invocation-classifier-bypass`
(Unit 0), `tactic-node-merge-list-removal-loss` (Unit 3),
`tactic-graph-commit-noop-shortcircuit-head-behind` (Unit 4),
`tactic-tactic-graph-commit-rebuild-snapshot-stale-revert-main-qa-regression`,
and `tactic-flake-hook-tests-graph-commit-fixture-clone`.

**Reconciling the node count.** The paragraph above says PR15 "now closes 2
nodes, not 4." That count is about the four *graph-commit tactic* nodes only,
two of which moved to the ref-split deferral set. The other three closed nodes —
list-removal, citation drift, fixture-clone flake — were never in that four and
are assigned to PR15 by the serialized plan. Five is the correct total; each was
audited unit-by-unit against the shipped diff before being closed.

**No node's closure depended on the unwritten Units 1–2.** This was checked
specifically. The one that could plausibly have depended on the default flip,
`tactic-graph-commit-noop-shortcircuit-head-behind`, was scoped from the outset
to close the *worktree*-writer gap **while** `worktree` remains the default, and
listed the default as out of scope. The two nodes Units 1–2 would have closed,
`tactic-graph-commit-plumbing-default` and
`tactic-graph-commit-direct-three-way-merge`, remain open and travel with
ref-split — they were not silently absorbed.

**One stale park cleared, not re-provisioned.**
`tactic-node-merge-list-removal-loss` carried an `office_hours` park since
2026-07-31 (`provision-node-worktree failed … exit 2`) — an environment failure,
not a substantive one. It was cleared in the same write that set `phase: done`.

**One GitHub-side action.** #2990's merged body cites its five regression cases
as "36-40"; they are at 48-52, having been shifted by an unrelated commit. The
body is deliberately left as historical text, and a correction comment was
posted on that PR instead. This mattered because no later plan section claims
that correction — closing the node with nothing posted would have dropped it
from the graph owed by nobody. The repo half re-anchors three in-file citations
to assertion text and establishes name-over-ordinal as the convention.

**Two residues carried as observe-in-production items**, not owed code: a
*contended* list removal actually landing on `main`, and a live tick showing a
behind-main worker skip the landing cycle (`pushed=none … context=noop`, no
landing-lock claim).

**Accepted behavior change** worth knowing before PR16 touches this writer: a
behind-but-clean worktree-writer run no longer fast-forwards the caller's
checkout as a side effect of `land()`'s rebase. `sync_main_checkout()` is the
sync path; do not add a compensating fast-forward.

**Verification at merge:** `test-graph-commit.sh` 124/0, `intentionsutil` vitest
1230/1230 across 56 files, `test-approve-workflow-commands.sh` 71/71,
`run-typecheck.sh` 3/3, `run-lint.sh` clean. Note for anyone citing these later:
node bodies across this set carried stale figures (711/38, 43, 84, "Case 84")
that were corrected at closing — the regression case is **Case 85**.

#### PR16 — what shipped, 2026-08-30

Merged as `96d22cb1` (#3138). Two graph writes landed alongside it: the sensor
and threshold writes as `8a823862`, and the closing batch as `c55710c4`.
**Eight of the twelve nodes are closed; four are carried forward.**

Shipped: **Units 2, 3, 4, 5, 7, 10, 11** plus the folded class-B instrument-arm
verification.

**Corrections that changed the work**, all found by auditing the units against
the nodes before implementing rather than after:

- **Unit 4's data set was 3 nodes, not the 6 the plan claimed** — verified two
  independent ways across all 751 nodes. A naive `grep` for `phase: main-qa`
  returns 68 files, almost all of them nodes with a legitimate *first-class*
  phase; backfilling against that set would have corrupted 65 healthy nodes.
- **Unit 4 was widened to match its node.** The plan scoped an
  `attributes.phase`-only rejection; the node specifies a general shadow-ban
  over every first-class field name, plus deleting all six squatter readers.
  Shipping the plan's version would have left the node half-done while looking
  complete. Census taken first: 50 distinct `attributes` keys, zero collisions.
- **Unit 11's premise was false.** The exit-1 `unknown` arm it calls untested
  was already covered; the real gaps were two jq-mode arms and the `rev-parse`
  arm. Rescoped, and all three proven non-vacuous by mutation.
- **Unit 5's verification step cannot pass and must not be treated as failure.**
  It says to confirm `deriveGap` returns `null`; 17 of 21 active records are
  unexercised, so the gap is correctly non-null. What was verified instead: the
  threshold is byte-identical to the reader's exported literal, and the gap goes
  `null` when the reading *is* that literal. The signal was **permanently
  unsatisfiable** before and is now merely unmet.
- **Unit 3 shipped without `--dir`, against the plan and per its node.** The
  plan's premise that PR1 had made this script's tree explicit is false — PR1
  touched it by comment only — but adding `--dir` would have shipped the defect
  the unit exists to close, because four sensors close over module-level store
  constants and a partial `--dir` reads one store while writing another.

**Rule-number collision, live.** PR16 took **Rule 23** for the attributes
shadow-ban. `tactic-supersession-edge-and-terminal` — Position 6's PR19 — claims
Rules **23 and 24**. Rule numbers are cross-referenced from node bodies and are
never reused, so **PR19 must renumber**. Recorded in `schema.ts`'s ledger
paragraph and above the function.

**Unit 10's fatal is opt-in by necessity.** `graph-fast-path.yml` runs the same
`validate-graph.ts intentions` command in the `guard` job that four required
contexts depend on, so an unconditional fatal would re-arm the 2026-08-14
repo-wide write outage. The `--strict-sensors` flag is armed only in the
post-merge job. Any later unit touching this validator must preserve that split.

**A regression is now on the record.** The class-B verification landed a fresh
reading on `strategy-graph-native-dispatch`, replacing a 19-day-old flattering
one: backlog moved `24.6% (non-increasing)` → **`40.5% (increasing)`**, outside
its ≤35% band. The instrument arm is confirmed working; the band breach is a
separate matter for that strategy.

##### Carried forward — four units and the #3023 absorption

None gate a later position.

- **Unit 1** (`transition-node` clobbers an uncommitted body edit) — its node
  holds a live `blocked_by` on `tactic-scope-fingerprint-plan-substance`, and
  the behavior is *documented in `transition-node` as intentional*, so "fixing"
  it would revert a recorded decision. Needs the contradiction ruled first.
- **Unit 6** (scope-stale shell coverage) — live `blocked_by` on
  `tactic-strategy-fingerprint-stamp-coverage`, i.e. on #3023.
- **Unit 8** (`strategy_fingerprint` sha provenance) — **there is no write site
  on `main`**: `transition-node` never writes a strategy-fingerprint stamp at
  all, so there is nothing to correct until #3023 lands. Its node is *also*
  parked on an unmade ruling — whether that field keeps its `{hash, sha}` form
  or drops `sha`. The plan did not mention that park until 2026-08-30, when the
  callout was added and the shape question **decided: keep `{hash, sha}`** (the
  `sha` is the provenance half, and there is no consumer yet against which to
  justify an irreversible narrowing). The unit stays carried forward behind
  #3023 for the write-site reason, not the shape one.
- **Unit 9** (`validate-graph` passes on an empty store) — its node is parked,
  and the plan's claim that "Units 9 and 11 were never blocked" is **false for
  Unit 9**. Implementing it as scoped requires inverting
  `reader-required-dir.test.ts`'s currently-passing, deliberately-authored
  assertion that an empty *named* store is a legitimate graph — landed by PR1
  itself. That is the weakening `.claude/rules/test-integrity.md` forbids.
  **Decided 2026-08-30 (executor, for ratification): the test's contract
  stands.** The vacuous-pass class PR1 Unit 8 was chasing is already closed by
  its own missing-directory exit 2, and an empty-store error would break graph
  bootstrap in a fresh instance repo. The unit is rescoped to correcting the
  `validate-graph.ts:111` comment — which is the thing that is actually wrong —
  and printing an explicit `store is EMPTY at <abs path>` message so an empty run
  cannot be misread as a populated clean one. No test is inverted, skipped or
  deleted.
- **#3023** — **none of its scope is on `main`.** Its clean-half spin-off #3100
  closed *without merging*, so this is a 20-file, roughly +1571/−90 change, not
  a conflicting remainder. Its only consumers here are Units 6 and 8, and Unit 8
  is blocked on a ruling regardless, so absorbing it now buys nothing.

**Verification at merge:** `intentionsutil` vitest 1252/1252 across 57 files
(from 1230/56), `test-graph-commit.sh` 124/0, `test-park-node.sh` 25/0,
`test-verify-landed.sh` 28/0 (from 25/0), `tsc --noEmit` exit 0,
`run-typecheck.sh` 3/3, `run-lint.sh` clean, and `validate-graph.ts intentions`
ok at 751 nodes both with and without `--strict-sensors`.

> Note for later positions: `run-lint.sh` and `run-typecheck.sh` diff
> `origin/main...HEAD`, so they are **vacuous on uncommitted work**. Running
> lint only after committing is what caught a net-new `as` cast every
> subagent's own run had reported clean.

### Position 3 · Bundle 2a — PR5a, record-time main-qa routing

1 node. Small and out of order on purpose: it was never in the original scope,
and it must precede Bundle 2's reconciler work.

### Position 4 · Bundle 2 — tick-path reconcilers and sweeps

11 nodes / 22 units: PR5 plus PR9 Units 2 and 6 and PR2 Unit 6. *(Was "10
nodes" until 2026-08-30 — the count omitted the absorbed
`tactic-autonomous-ci-pending-liveness-bound`, which `4d66566f` reset to draft
so PR5 can rebuild its scope as U18.)*

**This is the only bundle that is hot because it is running right now.** The
sentinel does not stop the tick: `reconcile-graph-merged` is in the drain on
every tick, and PR5's base-pin unit prevents a concurrently landed write being
clobbered — a live risk precisely because `main` is still moving under the
window. PR5 reads as pure efficiency work for a paused system and is not.

PR5 absorbs #3002 and the already-landed half of #3064.

**Pre-verification blockers, ruled 2026-08-30.** Recorded here because an
earlier revision of the "Next" row asserted them with no written source, which
a code review correctly flagged as unverifiable.

1. **`tactic-review-stall-conflict-lane` — DISCHARGED**, landed `e54b64ee`. It
   was closed as a **completion record** (`phase: done`, `execution.completion`
   = #3038 / `fa9c4338`), not `clear-park` and not a prune: for a `phase: null`
   node whose work already shipped, clearing would make it router-eligible and
   re-dispatch finished work. See the struck conflict-lane paragraph below.
2. **`packages/intentionsutil/src/store-cache.ts` is absent from `origin/main`
   — an ORDERING RULE, not a blocker.** No edit exists to make. PR5's
   listnodes-scan unit creates it and the retention-scan unit consumes it, so:
   **listnodes-scan first, retention-scan after it, and leave the `blocked_by`
   edge between them intact.** *(Wording tightened — this rule used to say
   "retention-scan **last**", which collides with the hazard box's step (5),
   "build the CI-stall unit last". The unit table under PR5 resolves both: the
   retention-scan pair is U16–U17 and the CI-stall unit is U18, so retention-scan
   is last **among the `store-cache.ts` consumers**, and the CI-stall unit is last
   in PR5 overall. Nothing else about the ordering changed.)*
3. **PR #3002 — ABSORBED.** It is an abandoned draft (`CONFLICTING`/`DIRTY`,
   1634 commits behind, untouched since 2026-07-31) but **its scope is alive**:
   `graph-select-target:1140` is still `1) echo "ci-pending"; return 1 ;;` with
   no counter, `reconcile-graph-review-stall:255` still folds pending to
   `VERDICT="unknown"`, `lib.sh` has zero `ci_pending` matches, and
   `holds.ts:36` `HOLD_KINDS` is still the three pre-existing kinds. So the work
   is rebuilt as **PR5's last unit** (`opus`), with #3002's Unit 1 re-homed to
   `holds.ts` and supplying the now-mandatory `KIND_RECHECK: manual`. #3002's
   own "shared hold slot" design is dead — its tail hunk anchored on
   `if [[ "${#CONFLICT_IDS[@]}" -gt 0 ]]`, a block `fa9c4338` retired along with
   `CONFLICT_IDS`/`TMPDIR_HOLD`.

> **⛔ ACTION-ORDER HAZARD — the graph write MUST precede the PR close.**
> `reconcile-graph-merged` runs on every tick and absorbs any node with
> `phase ∈ {implement, fix, qa, review}` carrying an `execution.pr`: a
> **closed-but-not-merged** PR drives its node to `phase: done` with a **null
> completion**. `tactic-autonomous-ci-pending-liveness-bound` is `phase: qa`
> with `execution.pr: 3002`, so closing #3002 first would silently retire a live
> scope. This is **reproduced, not inferred**: sibling #3064 was closed
> 2026-08-23T15:14Z and `f6781c76` set its node `phase: done` /
> `completion: null` — a node whose body still describes its fix as
> unimplemented.
>
> Order: (1) **one** `graph-commit` writing both nodes —
> `tactic-autonomous-ci-pending-liveness-bound` reset to `phase: null`,
> `execution: null`, `blocked_by: []` (a frontmatter reset, **not** a completion
> record, because the work is unshipped, and **not** `clear-park`, because no
> park exists), and `tactic-hold-conflict-autonomous-ci-pending-liveness-bound`
> given a completion record per the 13 resolved `tactic-hold-*` precedents on
> `main`; (2) `gh pr close 3002`, keeping the branch at `24bc8cee`; (3) verify
> the node has left the absorbable set; (4) bump this position's node counts
> (**7 → 8 closed**, **10 → 11 total**); (5) build the CI-stall unit last;
> (6) write the completion record only after PR5 merges.

**EXECUTED 2026-08-30 — the hazard was avoided, in this order.** Recorded so a
future session does not re-derive it.

1. **Graph write first.** One `graph-commit` landed `4d66566f` on `main`,
   writing four nodes together:
   `tactic-autonomous-ci-pending-liveness-bound` reset to `phase: null`,
   `execution: null`, `blocked_by: []` (a frontmatter reset — **not** a
   completion record, the work is unshipped, and **not** a `clear-park`, it
   carried no park), body gaining a `## Re-landing brief`;
   `tactic-hold-conflict-autonomous-ci-pending-liveness-bound` discharged to
   `phase: done` / `office_hours: null` per the 13 `tactic-hold-*` precedents,
   body gaining a `## Resolved 2026-08-30` note; and the two band-blocked parks
   below.
2. **Then verified the node had left the absorbable set** — on `origin/main`
   it reads `status: codified`, `phase: null`, `execution: null`,
   `blocked_by: []`, `office_hours: null`. With `phase` outside
   `{implement, fix, qa, review}` and no `execution.pr`,
   `reconcile-graph-merged` has nothing to absorb.
3. **Only then the PR.** #3002 is now closed unmerged, with its branch
   deliberately preserved at `24bc8cee` so U18 can read the abandoned work.

Had the order been reversed, `reconcile-graph-merged` would have driven the node
to `phase: done` with a **null completion** on the next tick and silently retired
a live scope — the failure sibling #3064 already demonstrates.

**Two band-blocked parks cleared in the same commit**, under the author's
2026-08-28 ruling on `strategy-graph-native-dispatch` (every node parked *solely*
on the maintenance-burden band breach is un-parked). A census of all 203 parked
nodes found exactly two in that bucket, and both parks stated in terms that
nothing else blocked the node:

- `tactic-supersession-retirement-sweep` — `office_hours: null`. Its body gained
  `## Measurements preserved from the office-hours park, cleared 2026-08-30`,
  because those measurements existed **only** in `office_hours.reason` and its
  `clarifications` array is empty — clearing the park without copying them out
  would have destroyed them.
- `tactic-align-tactics-drift-dump-office-hours` — `office_hours: null`. Its
  `## Status — PARKED to office_hours, 2026-08-21` section was rewritten to
  `## Status — un-parked 2026-08-30, still a draft (no plan authored)`.

**Also settled**, and recorded in the ci-pending node's `## Re-landing brief`:
`ci-pending-stalled`'s `KIND_RECHECK` entry is ruled **`policy: "manual"`**.
`packages/intentionsutil/src/holds.ts:117-132` defines
`KIND_RECHECK: Record<HoldKind, HoldRecheck>`, whose mapped type makes an entry
**mandatory** at typecheck, and `manual` is the only value that lands without
rewriting `packages/intentionsutil/test/holds.test.ts:27-29`'s "exactly one
auto-re-checkable kind" assertion. *(Paths added on review — the test file is
under `test/`, not `src/`; both anchors re-verified 2026-08-30. Re-check them
before editing, they drift.)*

One further finding, not blocking: #3064's node is `phase: done` on unshipped
work while appearing in no PR's closing list.

*(A second finding here — that `tactic-autonomous-ci-pending-liveness-bound`
"carries a **stale `blocked_by`** edge to
`tactic-flake-preview-and-smoke-dpkg-lock`, `phase: done` since 2026-08-03
(#3020)" — was **discharged by the very commit recorded above**. `4d66566f` set
that node's `blocked_by: []`, which step 2 of the EXECUTED list itself confirms
on `origin/main`. The edge no longer exists; do not go looking for it.)*

> **⛔ PR5 has NO conflict-lane unit; there is nothing to coordinate.**
> *(Struck 2026-08-30.* This paragraph used to end "Its conflict-lane unit must
> be coordinated with #3018's conflict-lane work, now in PR8 — one policy, not
> two."*)* The unit it presupposes was **deleted** — see the serialized plan,
> PR5 Scope, where it is struck outright. The premise it rested on is dead: the
> sweep's `conflict` arm was retired to a bare `continue` in `fa9c4338`, and
> three sibling PR5 nodes build on that retirement, so re-adding the lane breaks
> them. **PR8 owns the single conflict policy.**
>
> *(State corrected 2026-08-30.* This paragraph used to describe
> `intentions/tactic-review-stall-conflict-lane.md` as `status: raw`,
> `phase: null` and "**`office_hours`-parked on a dead premise**". It is none of
> those now: on `origin/main` it is `status: codified`, **`phase: done`**,
> `office_hours: null`, closed as a completion record by `e54b64ee` — the same
> discharge blocker 1 above records. It contributes **zero units**. The
> conclusion is untouched: PR5 has no conflict-lane unit.*)*

### Position 5 · Bundle 4 — PR3 + PR4, instrument and finding surface

16 nodes. COLD in itself, but it comes before Bundle 3 because positions 6 and 8
both depend on it.

> **Three of this position's 16 nodes are parked** and none of them is
> autonomously selectable: `tactic-audit-instrument-scoping`,
> `tactic-audit-review-effort-yield-lens` (PR3) and
> `tactic-graph-prose-ref-batch-wiring` (PR4 Unit 8). Two of the three
> were author calls; both are now decided by executor judgement and recorded in
> `plans/dispatch-rsi-author-rulings.md` §"Executor decisions taken during
> reconciliation" — `tactic-audit-review-effort-yield-lens` takes **option (b)**
> (ship the lens on source-verified figures only) and
> `tactic-graph-prose-ref-batch-wiring` takes its **option 3** (retire
> `batchIds`). Plan the position as PR3 with Unit 3 rescoped to option (b) and
> PR4 with Unit 8 rescoped to option 3; clear both parks in the same writes,
> citing the decisions.
>
> *(It was four of 17 until 2026-08-30, when `tactic-audit-permission-friction`
> closed on `origin/main` as `91bc7cc9` — a Ruling-1 completion record,
> `phase: done`, `execution.completion` against PR #3074. It leaves PR3's
> closing list entirely. The "16" above was already off by one before that
> closure: PR3's `### Nodes closed` list (10 ids before this closure; the
> heading now reads `(9)`) and PR4's `### Nodes closed (7)` list
> **17 disjoint ids**; after the closure the true total is exactly 16.*
> **Two items its 2026-08-18 park raised remain undischarged and now sit on a
> `phase: done` node no router can select** — the side-A failed condition and
> clarification 43's never-performed `/fewer-permission-prompts` collision
> check, both owed to an `/align` pass on `strategy-token-economy` that nothing
> in this window schedules.)*

**PR4** retires the ledger primitive: a doctrine change with a 40-node data
migration and the private finding-writers collapsing into one write surface
(**not "five"** — `intentions/tactic-finding-search-all-producers.md:377-380`
measures **16 CREATE sites / 47 write calls / 27 callers** and rules the
five-writer census wrong; struck 2026-08-30, see the plan's PR4 section).
That surface is what PR19 writes supersession edges through, which is the hard
edge into position 6. **PR3** repairs the audit instrument's residual lenses and
measurement blind spots. **Verify every "missing" claim before implementing**;
see the plan's section of that name.

> **⚠ Not a bookkeeping pass (restamped 2026-08-30).** This paragraph used to
> add "most of it may be a bookkeeping pass rather than an implementation,
> because the graph says four of its nodes are open and the code says otherwise".
> Two of those four are genuinely open with work left:
> `tactic-audit-cache-efficiency-lens` and `tactic-rsi-round-trips-lens-carrier`
> are each `office_hours: null`, `phase: implement`, `status: codified`, carrying
> **full two-unit plans**. The other two are `office_hours`-parked. Closing any
> of the four on the strength of the code check discards planned work — see the
> plan's PR3 Unit 1 and its ⛔ callout in §"Read this before planning any of it".

The baselines this position was expected to unblock were **already taken on
2026-08-29** — see §"Three measurement runs". PR3 turned out not to gate them:
every lens they used already emits correctly. PR3 stays at this position for its
own reasons, not as a measurement prerequisite.

### Position 6 · Bundle 2b — PR19, supersession representation

3 nodes: `schema.ts` (`superseded_by` + terminal), `/align-tactics` drops,
`lint-verify-fence-paths.sh`.

Pinned behind PR4 by a real `blocked_by` edge —
`tactic-persist-greenfield-drops` is blocked by
`tactic-finding-search-all-producers`, PR4's central node, because supersession
edges are written *by* that write surface.

> **⚠ THE REVERSE EDGE ALSO EXISTS, AND IT INVERTS THIS ORDER.**
> `intentions/tactic-finding-search-all-producers.md` — PR4's central node —
> carries `blocked_by: [tactic-supersession-edge-and-terminal]`, and
> `tactic-supersession-edge-and-terminal` is a **PR19** node. So PR4 is blocked
> by PR19 while PR19 is blocked by PR4: **a PR-level cycle. PR4 and PR19 cannot
> both be atomic PRs in either order.**
>
> The node graph itself is acyclic —
> `tactic-supersession-edge-and-terminal` → `tactic-finding-search-all-producers`
> → `tactic-persist-greenfield-drops` — so the fix is at the PR boundary, not in
> the graph.
>
> **RESOLUTION — EXECUTOR DECISION 2026-08-30: SPLIT PR19 AT THE EDGE.**
> Recorded for ratification in `plans/dispatch-rsi-author-rulings.md`
> §"Executor decisions taken during reconciliation". Ship
> `tactic-supersession-edge-and-terminal` (PR19's Unit 1 — the `superseded_by`
> edge and the `superseded` status terminal, a pure `schema.ts` addition with no
> dependency on PR4) as **PR19a ahead of Position 5**; keep the two consumer
> nodes as **PR19b at Position 6, behind PR4**. Resulting order:
>
> ```
> PR19a (schema: superseded_by edge + superseded terminal)
>    → PR3 + PR4 (Position 5)
>       → PR19b (align-tactics drops + lint-verify-fence-paths.sh)
> ```
>
> Why split rather than merge: merging PR4 and PR19 produces a 19-node change
> spanning the ledger doctrine migration, the finding-writer collapse (the
> "five-writer" count is struck — see above) and the schema
> terminal — three independently reviewable surfaces — and PR19's Unit 1 has no
> dependency on either. The split runs along an existing seam; the merge does
> not. The rejected alternative was a single PR4+PR19 with the internal order
> schema → PR4 Units 1–7 → PR19 consumers. **Do not run the sequence as
> originally ordered:** it either violates a live `blocked_by` edge or deadlocks
> the router.

The two sub-points this PR encodes were ruled, and **Unit 1 must encode the
ruled form, not the original wording**:

- **Sub-point one — amended.** An in-flight node (`execution` non-null) still
  gets the supersession edge and still gets **no park**, so a similarity
  judgment never halts live work. But the edge **must carry its expiry event** —
  normally that in-flight PR's own merge or closure — because the
  interim-live-risk exception is only permitted when an expiry is named.
  **Encode the field in Unit 1 alongside `superseded_by`**: adding it after
  PR19 lands is a data migration, not an edit.
- **Sub-point two — ratified**, with the per-unit drop's carrier stated
  explicitly: the node's own unit list, not the edge and not a park.

Absorbs #3041 directly. **Keep #3093, #2856 and #3040 out** — they rewrite node
content in bulk and belong at position 12, after the bookkeeping.

### Position 7 · Bundle 3 — dispatch runtime

25 nodes: PR2's remainder, PR6, PR7, PR8 Units 1–2, PR9's remainder.

Deliberately large. Nothing invokes any of it while paused, so the cost of
bundling is not a broken window — it is that the first fleet start after
resumption becomes a single pass/fail boolean. **Mitigate with the staged
resumption, not by splitting**: that converts the boolean into a diagnosable
test and is worth more than any split.

**PR6's locking design was ratified**, and the apparent contradiction that
gated it — the flock shipped, yet the detached child dies with its launcher —
was never a defect in the lock. It is a defect in the detachment beneath it:
`dispatch-code-review` already runs `setsid`, already disowns, and already
refuses to start without it, and the child died anyway. So the flock stands,
held by the child, and **Unit 1 is re-parenting via a `systemd-run --user`
transient unit** — not the falsified process-group remedy. The demonstration
that a detached review survives its launcher's exit is Unit 1's **own acceptance
test**, not a gate on starting the PR — reading it as a prior gate is circular,
since it tests the re-parenting Unit 1 builds. **De-risked 2026-08-29**: a child
launched into a `systemd-run --user` transient unit survived the teardown of its
launching Bash tool call and completed 12s later. The honest limit is that this
killed a *background* task rather than a foreground tool call, so the interrupt
test is now a confirmation rather than a discovery. **RULED 2026-08-29 (commit
`08870461`, PR #3132): the proxy is accepted** — Units 2–3 ship without an
attended interrupt test, and the "still owed before Unit 2 ships" clause this
sentence used to carry is struck. The literal foreground-interrupt confirmation
is an optional follow-up that gates nothing.

PR8 Unit 1 is more urgent than its position suggests — the pace-curve config is
untracked and unrecoverable.

### Position 8 · Bundle 5 — the RSI chain

10 nodes: PR10 (trigger chain) + PR11 (lens catalog decomposition) + PR12
(intervention core) + PR14 (prioritization and research lane).

The band derivation PR10 writes into config was ratified on the code's ground.
Its second sub-point — that the cross-strategy inversion count was structurally
zero and so unfalsifiable — is **superseded rather than answered**: the residual
no longer exists, because the sort key is now `(tier, band, score, depth)`. The
`success_signal` amendment that followed is already landed.

**PR11's measurement is done** — taken 2026-08-29, on a 30d window, because a
14d one returns no fan-out data at all under the freeze. Two results bind this
PR. First, the per-lens `model:` values must be anchored on the **measured 1.91×
opus-to-sonnet per-turn cost premium**, not on the imported ratios, which came
from configurations this repo does not run. Second, and easy to get wrong:
**`price_proxy_usd` ranks sonnet *above* opus** (37827 vs 31372) because the
proxy holds price constant to isolate token count. **Set `model:` from
`cost_usd`.** Fan-out for context: review launches 18.6 subagents per session at
6.3 per applied fix, with 31.8% of findings actionable.

`tradition-agentic-engineering` was verified on the trust half — three idioms
recorded as genuine external deference, context engineering excluded as
convergence — and PR11 may encode that. Its **lane half is re-scoped, not deferred**
(ruled 2026-08-29). There is no longer a lane to review: the research lane is
folded into `/rsi-audit` as an opt-in subskill with no schedule, so B3's lane
half now reviews **the fold** — does research-sourced input stay subordinate to
measurement in practice, and does the seed list steer anything now that it is a
source-trust filter rather than a crawl plan? That can be sat **after the first
research-mode run**, which an author-invoked pass makes available the day Unit 3
lands, instead of after two or three weekly cron firings. The circularity that
made it look unreachable inside the window is gone.

**PR14's readiness (updated 2026-08-29 evening).** Unit 3's node
(`tactic-rsi-research-skill`) had its park cleared 2026-08-29 and is now
`codified` with its plan in its body — its `blocked_by` edge onto
`tactic-rsi-lane-token-attribution` is satisfied inside this sequence, since
that node closes with PR3 at position 5. Unit 2's ruling landed the same day
(disposition (A) — see the status table) and its plan follows via the
`/align-tactics` finalize. Only Unit 1 can still fall out: its node is blocked
on `tactic-attention-namespaced-rank`, outside this plan — if that has not
landed when this position runs, ship Units 2–3 and leave Unit 1 open.

### Position 9 · Bundle 5b — PR20, the `/align` charter and adversarial review

9 nodes. **`tactic-retire-assessor-contract-docs` rides here** by the 2026-08-29
ruling — it was in no bundle, and PR20 already rewrites the `/align` skill
surface its third unit edits. Its other two units retire
`.claude/docs/delegability.md`, `.claude/docs/signal-identification.md` and
their `ref-*` skills. Land it in the same PR: the shared file is
`.claude/skills/align-audit/SKILL.md`, whose out-of-scope list still frames a
decision settled 2026-07-23 as pending and cites a node that no longer exists.

The other 8 are a new `/align-review` skill plus `assemble-review-pack`,
`graph-commit --review`, `/align` and `/align-tactics` skill text, and a
`validate-graph` lint.

The `/align-audit` disposition that gated this position is discharged: the
strategy-wide band breach was ruled **(c) accept with remediation**, keeping the
35% target and naming this sequence itself as the drain plan.

### Position 10 · Bundle 6 — PR13, the skill rename

1 node, repo-wide. **Last and alone**, and the ordering against position 9 is
not a preference: PR20 edits `.claude/skills/align-tactics/SKILL.md` and PR13
renames that skill to `/dispatch-plan`. Running them in the other order orphans
every path PR20 writes — the same failure this repo has already hit once, where
a rename left `verify` fences pointing at a deleted skill. **The violation is
silent, not a merge conflict**, which is what makes it dangerous.

Absorbs #2946's contested half: it edits eight skill bodies, every one of which
this PR renames by path. Sequence `tactic-legacy-office-hours-entry-removal`
*after* this PR — it moves anchors under PR9, PR16 and PR20 at once.

> **⚠ PREREQUISITE — the carrier question, answered 2026-08-30 by executor
> decision.** This position's only node,
> `tactic-dispatch-skill-standards-extraction`, is **parked** on four unrecorded
> premises, the first of which is a **duplicate carrier**: the serving strategy
> designates `tactic-dispatch-skill-rename` as the carrier for these renames, and
> that node is live and unparked. Nothing in either plan document scheduled the
> `/align` pass that was supposed to settle it, so the position would have
> stalled silently when reached.
>
> The four answers are written into the PR13 Scope section of
> `plans/dispatch-rsi-serialized-pr-plan.md` and recorded for ratification in
> `plans/dispatch-rsi-author-rulings.md`: **(a)** carrier is
> `tactic-dispatch-skill-rename`; **(b)** roster is the three renames this window
> names, no more; **(c)** the transition is **atomic, no compatibility aliases**
> (an alias has no implementable mechanism — a skill's identity is its directory
> name plus two `name:` fields, so an alias means a duplicate registration);
> **(d)** the `blocked_by` `tactic-dispatch-skill-input-contract` is a **phantom**
> and is void — a `blocked_by` naming a node that does not exist can never clear.
> Correct this position's node list to name the carrier before executing.

### Position 11 · Bundle 7 — PR17, merge queue and scan cadence

6 nodes: `graph-auto-merge`, `hold-alerts.ts`, `graph-digest.ts`, scratch refs.

**The only bundle whose position is set by the resumption rather than by
dependencies.** Everything in it is dormant while the sentinel holds, and it
must be in place before the staged resumption — otherwise that resumption
measures an unbounded scan cadence and a silent merge veto instead of measuring
the fleet.

### Position 12 · Bundle 8 — the four deferred A3 drafts

#3093 → #2856 → #3040 → #3037, **in that order**. All four are bulk
node-content rewrites, which is why they are last: each one invalidates every
`--base` CAS manifest, so any node bookkeeping still in flight would have to be
re-derived.

> **Three of the four are parked and one is additionally blocked**, so under
> `packages/intentionsutil/src/router.ts:482` / `:529` none of those three is
> autonomously selectable: `tactic-attention-per-tier-boost-migration` (#3093,
> `phase: implement`, parked since 2026-08-14), `tactic-delegation-classification-derivation`
> (#3040, `phase: qa`, parked since 2026-08-10), `tactic-census-scripted-tick`
> (#3037, `phase: qa`, parked since 2026-08-04 **and** `blocked_by` two nodes).
> Only `tactic-mount-schema` (#2856) is clear. Each of the four does carry units
> and a Verification section, so an *attended* executor has enough to work from —
> but the tick cannot reach three of them.

- **#3093** first (92 frontmatters, `attention.boost`+`tier` →
  `attention.boosts`). Largest blast radius, purely mechanical, and it touches
  two nodes this plan closes — so it runs after the closures, not before.
- **#2856** then **#3040** — both edit `schema.ts` and `attention.ts`, so they
  conflict with each other; land one, rebase the other.
- **#3037** last. It edits `graph-commit` and `dispatch-select-tick`, the tools
  every preceding closure runs through. Landing here also means **#3037 rebases
  over PR15**, not the reverse, so PR15's anchors stay stable.

### Position 13 · Bundle 9 — the charter split

`tactic-review-dispatch-charter-split` records the **spec**, not the edit — its
own clarification says so: *"This node records the spec; it is not the
execution."* It closed 2026-08-29 by author disposition (`phase: done`,
`execution: null`, no diff and no PR — the deliverable was the sitting itself).

> **⛔ THERE IS NO CARRIER FOR THE EXECUTION. Mint one before this position is
> reached.** Because the spec node is `done`, `isOpenTactic` is false and no
> router loop can select it; and no `# PR` section anywhere in
> `plans/dispatch-rsi-serialized-pr-plan.md` carries the work (its headings run
> PR1–PR20 only; `LIFECYCLE_SENSOR`, `BACKLOG_STRATEGY_ID` and `re-serve` all
> return zero hits there). Left as-is, this position is silently dropped — the
> specification is complete and verified, and nothing executes it.
>
> **EXECUTOR DECISION, 2026-08-30 (for ratification — see
> `plans/dispatch-rsi-author-rulings.md` §"Executor decisions taken during
> reconciliation"): the batch mints the carrier itself, as the FIRST action of
> Position 13, and the re-serve ships as ONE PR.** Minting is a graph write the
> batch is already pre-authorized to make (§"Batch execution authority", grant
> 2), and the spec is complete, so no author input is needed to author the node.
> One PR rather than three staged per-charter PRs, because the
> `lifecycle-sensor.test.ts` coupling guard requires the node edit and the code
> change in the same branch, and because each staged re-serve would pay the
> `--base` CAS invalidation again for no review benefit.
>
> **The carrier node must contain, at minimum:**
>
> 1. **Identity** — a new `tactic-*` node serving `strategy-graph-native-dispatch`,
>    `status: raw`, `phase: null`, `owner: ai`, `office_hours: null`, with a
>    `clarifications` cross-reference to `tactic-review-dispatch-charter-split`
>    naming it as the ratified spec. Do **not** re-derive the spec; the four
>    clarifications on the spec node are the ruled design and need no
>    transcription.
> 2. **Unit — write the three charter strategies**, cut along the parent strategy
>    body's existing sections: *recording surface* (Serialization & Commit, Other
>    Settled Mechanism); *router and selection* (Router Mechanism, Phase
>    Transitions & Fix State, Fingerprint & Freeze, Pace/Backlog/Attention,
>    Review & QA Disposition); *session lifecycle* (Worktree Claiming &
>    Liveness, Recovery & Session Lifecycle, Execution Substrate).
> 3. **Unit — the exclusive re-serve** of ~316 children onto the three charters,
>    removing them from the parent's `serves`. Exclusive, not additive.
> 4. **Unit — retire the parent's defect-ratio `success_signal`** in favour of
>    per-charter bands. Not bookkeeping: `strategyBacklogBand`
>    (`packages/intentionsutil/src/census.ts` — locate `n.serves.includes(strategyId)`
>    by content) selects children by **direct membership with no ancestry walk**,
>    so an exclusive re-serve removes them from the parent's denominator outright
>    and at `total === 0` the band returns `pct: null` rather than erroring — a
>    signal that reads green because it measures almost nothing.
> 5. **Unit — the paired code change, in the SAME branch and PR.**
>    `packages/intentionsutil/test/lifecycle-sensor.test.ts` asserts that
>    `LIFECYCLE_SENSOR_NAME` (in
>    `packages/intentionsutil/scripts/read-sensors.ts` — the plan and the spec
>    node both cite `:485`; measured, it is at **`:516`**, so locate it by name)
>    equals the strategy's `success_signal.sensor` **verbatim**, and a second
>    guard in the same file requires every registered sensor name to be recorded
>    by some node. **Editing either side alone turns CI red**, and `graph-commit`
>    cannot carry the code half. Also stale after the retirement:
>    `BACKLOG_STRATEGY_ID = 'strategy-graph-native-dispatch'` and
>    `BACKLOG_BAND_PCT = 35` in the same file.
> 6. **Verification** — a ```verify``` fence running the `intentionsutil` vitest
>    suite (`lifecycle-sensor.test.ts` is the coupling guard) plus
>    `validate-graph.ts intentions`; and a manual step confirming
>    `strategyBacklogBand` returns a non-null pct for each of the three new
>    charters.
> 7. **Ordering** — after Position 12, per the spec node's D1 ruling: re-serving
>    ~316 children invalidates every `--base` CAS manifest in flight.

Deferred past position 12 for the same reason Bundle 8 is: an exclusive re-serve
of 328 children (measured at commit `7ee14b13`, superseding both the original
316 and an intermediate 326) invalidates every `--base` CAS manifest still in
flight.

**The shape, as ruled.** Three charters, cut along the strategy body's existing
sections: *recording surface* (Serialization & Commit, Other Settled Mechanism);
*router and selection* (Router Mechanism, Phase Transitions & Fix State,
Fingerprint & Freeze, Pace/Backlog/Attention, Review & QA Disposition); *session
lifecycle* (Worktree Claiming & Liveness, Recovery & Session Lifecycle,
Execution Substrate). The re-serve is **exclusive**, and the parent's
defect-ratio `success_signal` is **retired** in favour of per-charter bands.

**Why the retirement is not bookkeeping.** `strategyBacklogBand`
(`packages/intentionsutil/src/census.ts:30-32`) selects children by
`n.serves.includes(strategyId)` — direct membership, **no ancestry walk**. An
exclusive re-serve therefore removes children from the parent's denominator
outright: the parent would not measure the same population re-cut, it would
measure a shrinking rump, and at `total === 0` it returns `pct: null` rather
than erroring. Leaving the ratio in place yields a signal that reads green
because it measures almost nothing.

**The node edit and the code change must land together, in one ordinary branch
and PR.** `packages/intentionsutil/test/lifecycle-sensor.test.ts:330` asserts
that `LIFECYCLE_SENSOR_NAME` (`read-sensors.ts:485`) equals this strategy's
`success_signal.sensor` **verbatim**, and a second guard in the same file
requires every registered sensor name to be recorded by some node. **Editing
either side alone turns CI red**, and `graph-commit` cannot carry the code half.
`read-sensors.ts` also hardcodes `BACKLOG_STRATEGY_ID =
"strategy-graph-native-dispatch"` and `BACKLOG_BAND_PCT = 35`, both of which the
retirement makes stale.

### Then: the staged resumption

Not a midpoint. Per ground rule 4 it happens only after the last position above
has merged and its nodes are closed, so **no bundle may be sequenced against
it**. Remove the sentinel with `max_concurrent_workers: 1`, walk one node
through the full ladder, and only then restore normal concurrency.

**PR8 Unit 3 stays deferred past even that.** It replaces the pause sentinel
with a config field — it rewrites the mechanism enforcing the freeze while the
freeze depends on it. Land it during a deliberate, attended un-pause, never
mid-window.

---

## Open items that are not positions

Nothing here waits on the author — the two decisions that did were ruled
2026-08-29 and are recorded below as discharged. The three measurement runs
that remained were all taken on 2026-08-29; the only residue is the *quality
half* of `tactic-dispatch-observation-masking`, which needs `by_phase_outcome`
data the freeze empties and so waits for the staged resumption.

### Three measurement runs — TAKEN 2026-08-29

All three were run and recorded on their nodes. **The window the plan named was
wrong in every case, for one reason worth carrying forward.**

> **The freeze hides the thing being measured.** The pause sentinel is dated
> **2026-08-10**, so a `7d` window holds 2 sessions, no worker or subagent
> sessions, and every dispatch phase at 0 turns; a `14d` window has 899 sessions
> but they are almost all `align-tactics`, and `by_phase_outcome` is `{}` with
> `sidecar_present` **0 of 122** eligible workers. The envelope-emitting phases
> are exactly the ones the freeze stops. **A 30d window straddling the freeze
> (2026-07-30..2026-08-29 — 5032 sessions, 225896 turns, `sidecar_present` 431
> of 695) is the narrowest one that reads anything**, and is what was run.
> Any later re-measurement must clear the same bar, and any before/after
> comparison must hold window width constant across the freeze boundary.

| Node | Gates | Result |
|---|---|---|
| `tactic-dispatch-cache-preserving-context` | PR7 | **Baseline recorded; the imported claim is not credited.** `hit_ratio` 0.9570, raw `cache_read:cache_creation` 22.30:1. The decisive figure is that `cache_creation` is **4.3%** of all context tokens (1150179672 of 26796114528) — an append-only layout can only convert creation into read, so **4.3% is the arithmetic ceiling**, against an imported claim of 41–80%. `creation_churn` is **0 churned of 401 staggered** across 86 node groups, so the mechanism is not firing either. This is the kill the node was built to make possible. **Threshold note:** "ratio rises 15%" is reachable on the raw ratio (22.30 → 25.65) and impossible on `hit_ratio` (0.9570 → 1.10) — keep the raw reading |
| `tactic-rsi-measure-fanout-and-model-routing` | PR11 | **Measured, and the dated reading is recorded on `strategy-recursive-self-improvement`.** Review: 68 sessions, 1266 subagents (18.6/session), 736 findings, 234 actionable (**31.8%**), 201 fixed — 6.3 launches and \$12.92 per fix. QA: 130 sessions, 440 subagents, 63 fixed — 7.0 launches and \$31.87 per fix. Routing: opus 42% of turns but **57% of spend**, a measured **1.91×** per-turn premium. **`price_proxy_usd` inverts that ranking** (sonnet 37827 above opus 31372) because the proxy holds price constant — PR11 must set per-lens `model:` from `cost_usd`, never the proxy |
| `tactic-dispatch-observation-masking` | PR7 | **Cost half taken; quality half still deferred, now confirmed by measurement.** `context_over_120k`: 1029 sessions, \$48262 proxy — align-tactics 327, `<none>` 158, qa-fix 143, review-fix 136. `payload_bytes.total` 329624854, Bash and Read together **97%**. The 2026-08-19 economics finding **hardens**: at 4.3% cache-creation share, ingest-time capping is cache-safe and retro-masking is not. The quality half needs `by_phase_outcome`, which the freeze empties — ship PR7 against the cost half, treat quality as a follow-up |

*The `context_lens` prose fix this section used to ask for was already applied on
2026-08-28. The three surviving mentions in the node all name what was corrected;
every asserting use already reads `lenses.context_over_120k`. Nothing to do.*

### The PR15 ref-split revisit — RULED 2026-08-29, no longer open

It was ruled early rather than at position 2: **PR15 splits**, shipping Units 0,
3 and 4 and not writing Units 1–2. See position 2 above, and §"Decisions already
taken" in the plan.

### `tactic-retire-assessor-contract-docs` — RULED 2026-08-29, now at position 9

`phase: implement`, `owner: ai`, three units: retire `.claude/docs/delegability.md`,
`.claude/docs/signal-identification.md` and their `ref-*` skills, plus
`.claude/skills/align-audit/SKILL.md`, whose out-of-scope list still frames a
decision settled 2026-07-23 as pending and cites a node that no longer exists.

It was in no bundle, so the sequence could have run to completion without anyone
noticing it — the same failure mode the four deferred A3 drafts had before they
became position 12. **Ruled: it rides position 9**, whose PR20 already rewrites
the `/align` skill surface it edits, so the two touch the same files and review
together. It is small, and the freeze means no worker will pick it up on its
own. This makes position 9 **9 nodes, not 8**.

---

## The orderings that are not preferences

Most of the sequence can flex — Bundles 3 and 4 can swap or overlap, since they
share no files, and PR2 and PR5–PR9 are mutually independent. Seven constraints
cannot:

1. **PR20 before PR13** (position 9 before 10). A rename orphans the paths the
   other PR writes, silently.
2. **PR19a before PR4, and PR4 before PR19b** (schema split around position 5).
   Two real `blocked_by` edges point in *opposite* directions across the PR4/PR19
   boundary: `tactic-persist-greenfield-drops` (PR19) is blocked by
   `tactic-finding-search-all-producers` (PR4), and that same PR4 node is itself
   blocked by `tactic-supersession-edge-and-terminal` (PR19). PR19 therefore
   **splits**: its Unit 1 ships as PR19a ahead of position 5, the consumers as
   PR19b at position 6. See §"Position 6" for the decision.
3. **PR5a before Bundle 2** (position 3 before 4).
4. **PR17 before the resumption** (position 11). Otherwise the resumption
   measures the wrong thing.
5. **Bundle 8 after all node bookkeeping** (position 12). Bulk content rewrites
   invalidate every CAS manifest.
6. **The charter split after Bundle 8** (position 13). Same CAS reason, larger
   blast radius — 328 children re-served (measured; supersedes 316 and 326).
7. **PR5's internal unit order** (position 4). Six unit-families edit one
   ~340-line script, `reconcile-graph-review-stall`, plus one shared test file.
   Four orderings inside that PR are load-bearing and went unrecorded until
   2026-08-30; unit numbers are the table under §PR5 in
   `plans/dispatch-rsi-serialized-pr-plan.md`.
   - **U18 sits above U11–U12's guard, never below it.** U11–U12 insert a superset
     cost guard (`[[ "$VERDICT" != "failing" && "$MERGEABLE" != "CONFLICTING" ]];
     continue`) before the `ROUTE=` spawn. U18's CI-pending strike counter must
     land **after the `case "$RAW_VERDICT"` normalization fold and before that
     guard**: a pending candidate folds to `VERDICT="unknown"` on a `MERGEABLE`
     PR, so the guard `continue`s first and anything below it is dead code for
     U18's entire target population. **Do not widen the guard to compensate** — it
     is a binding superset of `reviewStallRoute`'s non-null conditions, pinned by
     `transitions.test.ts`'s "shell pre-filter's superset invariant" case and by
     U11–U12's own verify fence. This is a *placement* rule rather than a
     sequencing one, but U18 cannot be written correctly without knowing the guard
     is coming.
   - **U9–U10 before U11–U12.** Both append cases to the same `Case 10` block of
     `test-graph-write-rollback.sh`, with disjoint but contiguous names — U10 owns
     `10d`, U12 owns `10e`/`10f`/`10g`. Landing U10 first keeps the file in
     ascending case order; reversed, `10d` ends up below `10g`. U9 also removes the
     `conflict)` arm that U11's guard comment reasons about, so that comment is
     written against the post-U9 shape.

     **This reverses the order `tactic-review-stall-predicate-subprocess-spawn.md`
     assumes.** Its "Composition with the adjacent CI-verdict tactic" section calls
     the predicate tactic landing first "the expected order" and specifies both
     directions; the ordering above deliberately takes its *second* branch ("if the
     CI tactic lands first"), so read that branch, not the first one.

     **And the substantive consequence, which the test-ordering reason above does
     not cover: U9 voids Case 10g's premise.** U9 inserts its `CONFLICTING`
     short-circuit immediately after the `.mergeable` validation `case`, i.e.
     *above* `HEAD_SHA`, `RAW_VERDICT` and the guard — so a CONFLICTING candidate
     `continue`s without ever reaching the `ROUTE=` spawn. Case 10g as specified
     ("CONFLICTING + green still reaches the predicate … the shim log has exactly 1
     line") therefore asserts a path that no longer exists, and goes red the moment
     both units are in the tree. Because both land in the **same PR**, reversing the
     order does not save it — U12 must write 10g against the post-U9 shape. Both
     nodes already record the interaction (`tactic-review-stall-ci-verdict-cache-miss.md`
     "Note the interaction: this node's Unit 1 already removes that spawn for the
     CONFLICTING subset"; the predicate node's second composition branch, "on
     whichever path still reaches that spawn"), but neither re-scopes the case.
     Re-scope it as part of U12 rather than discovering it in CI.
   - **U13–U15 before U18.** U18 appends a new `hold-node` landing block after the
     sweep's `graph-commit` landing block (`:374-391`) — the same block U14 rewrites
     to thread the `--base` pin through. Reversed, U18's new block is written against
     a landing shape U14 then replaces underneath it.

     **"After the landing block" is not sufficient on its own: U18 must also amend
     the early exit above it.** `reconcile-graph-review-stall:364` is
     `[[ "${#RECOVERED_IDS[@]}" -eq 0 ]] && exit 0`, and a CI-pending candidate never
     enters `RECOVERED_IDS` — below the strike cap it `continue`s, at cap it is
     recorded in `CI_STALL_IDS` and `continue`s. So on the sweep runs U18 exists to
     serve, `RECOVERED_IDS` is empty and the script exits at `:364` before any block
     placed after `:374`. That is the same dead-code trap as the ⛔ box in the node's
     own Unit 3 step 2, one exit earlier: widen `:364` to
     `[[ "${#RECOVERED_IDS[@]}" -eq 0 && "${#CI_STALL_IDS[@]}" -eq 0 ]] && exit 0`
     (or land the hold before it). The node's re-landing brief does not mention
     `:364` — its steps 3 and 4 still describe a conflict-hold block at `:307-331`
     that no longer exists.
   - **U2 rebases over the merged PR5a.** PR5a shipped as **#3140** and
     `tactic-mainqa-record-time-routing` is `phase: done` on `origin/main`. Its
     Unit 4 moved two of U2's four call-site anchors — U2 routes **five**
     enumerations across four files, and the other two are unchanged
     (`reconcile-graph-review-stall:188-207` / `:192` and `graph-auto-merge:261-279`
     / `:264`, both re-measured 2026-08-30; do not narrow U2's scope to the two
     below). The two that moved: in `reconcile-graph-merged` the inline enumeration
     block is now `:151-190` with `listNodesStrict("./intentions")` at `:176` (U2's
     plan says `:133-151` / `:138`), and in `reconcile-graph.ts`
     `listNodesStrict(args.dir)` is now at `:207` (U2's plan says `:151`). Merge
     `origin/main` and re-locate by symbol before editing either file.

---

## Batch execution authority — granted 2026-08-29

Four standing grants from the author, so the batch never stalls on an
approval it already has:

1. **Auto-merge on green, but never before the review gate settles.** The batch
   merges each PR to `main` once CI is green, strictly serial in position
   order, runs the closing batch, then starts the next position. No per-PR
   merge approval is needed. **Arming auto-merge before the code-review gate
   has settled defeats the gate** — that is exactly how PR #3140 merged
   unreviewed on 2026-08-30, auto-merge having fired the instant CI went green;
   the retroactive review then found a real injection defect. See
   §"The code-review gate" below for what "settled" means.
2. **Graph and planning writes are pre-authorized.** Park clears whose ruling
   is already recorded, node closures the plan names, and planning-document
   updates are the batch's to make; the author's standing instruction is that
   the batch focuses on implementation and resolves graph/planning bookkeeping
   itself. The PR16 Unit 5 threshold write on
   `strategy-exercise-recovery-paths` is explicitly included (its content is
   fully determined by the reader-then-threshold ruling).
3. **Decompose-first for thin scopes.** For PR12 (whole Scope), PR10 Units 1,
   2 and 5, and PR5a / PR20 Units 1–2 (node-body scopes), the batch's first
   action is writing the unit decomposition into the plan document and
   committing it, then implementing from it — so the decomposition survives
   any subagent death and is reviewable.
4. **PR6's interrupt demonstration is satisfied by the accepted proxy**
   (ruling recorded in the PR6 section); Units 2–3 need no attended test.

## The code-review gate — how it runs, and when it stops

Every PR in this batch gets `/code-review high --fix --comment` as a **detached**
process before it merges, via
`.claude/skills/dispatch-propagate/scripts/dispatch-code-review --target
<merge-base>..HEAD --out-dir tmp/code-review-<n> --effort high`. `--fix` and
`--comment` stay on and `--model opus` is pinned. The launch call **and every
await call** need `dangerouslyDisableSandbox: true` — a sandboxed launch gets its
own PID namespace and the child dies.

**Exit 5 is the only "not done yet"** — call again with identical args. *Every*
other non-zero exit means no review completed, and none of them clears a PR to
merge; exit 6 in particular ("another detached run holds this worktree's lock —
nothing was launched") must never be fed back into the poll loop. The full
contract is `.claude/skills/review-fix/SKILL.md:713-730`; do not re-derive it
here (rule 3). Note the lock is taken **only** when the reviewed tree sits
directly under a `.claude/worktrees` root
(`.claude/skills/dispatch-propagate/scripts/dispatch-code-review:406-414`), so
it does not serialize anything for a retroactive run made from the main
checkout — run those strictly one at a time by hand, since two concurrent
`--fix` runs in one tree cross-attribute each other's edits.

**Four rules govern when it stops.** Parts 1–3 were adopted by the executor on
2026-08-30 and part 4 was approved by the author the same day, after the gate
thrashed for sixteen rounds on PR #3146.

1. **Settle on blocking severity, not on zero findings.** A round is settled
   when it produces no finding that changes behaviour, breaks an anchor, or
   would lead an executor to a wrong action. Everything else — clarity,
   redundancy, a sharper phrasing — is recorded on the PR and **dropped**, not
   fixed in-branch. "Review before merge" is the standing rule; "iterate to zero
   findings" was never part of it, and adding it is what caused the thrash.
   Because `--fix` is on, dropping is an **action, not an omission**: the tool
   has already written those edits into the tree before you triage, so reverting
   them (`git checkout -- <path>`, or dropping the hunks) *is* the triage.
   `--comment` is what leaves them recorded on the PR.
2. **Two-strike rule on self-inflicted findings.** Track whether a finding lands
   on text the *previous round's fix* introduced. Two consecutive rounds of that
   mean the passage is the defect — **cut it, do not repair it again.** "Cut it"
   is a remedy for *explanatory prose*, which is what thrashes; on a code diff
   the same two-strike signal means the design is wrong — redesign the hunk or
   escalate, never delete a guard or a check to silence the finding
   (`.claude/rules/test-integrity.md`).
3. **Cite tool behaviour, never derive it.** A plan document carries the
   decision and a `path:line` pointer. The derivation belongs beside the code,
   where drift is visible.
4. **Tier by diff kind.** Code and scripts: `high` + `opus` until a round is
   blocking-clean. **Docs-only diffs: exactly one `high` round**, triaged per
   rule 1, then merge. The gate is never skipped — this changes its depth, not
   its existence. This rule also **completes the definition of "settled"** that
   grant 1 defers to: for code, settled means a blocking-clean round; for a
   docs-only diff, settled means that one round has been triaged, whether or not
   it was blocking-clean, with any blocking finding fixed in-branch and merged
   without a second round. Rule 4 wins where the two readings differ — a
   docs-only diff never earns a second round on the strength of rule 1 alone.

**Why, in one measurement.** PR #3146's findings per round ran
`11, 6, 5, 2, 1, 2, 4, 4, 6, 2, 3, 2, 2, 1, 3, 2` — 56 across 16 rounds, with no
downward trend. Rounds 1–3 found genuine latent defects. **Rounds 4–16 were all
one paragraph of explanatory prose**, and every recurrence was a derived claim
about tool behaviour refuted by a finer measurement of a tool that had not
changed. One sentence was wrong in seven consecutive rounds *in both
directions* — round 15 restored as load-bearing a fact round 16 measured as
false. Prose that derives semantics has no fixed point to iterate toward: each
fix is new unreviewed prose of the same kind, so the reviewed surface grows as
fast as it is cleaned. Code review converges because tests, types and behaviour
anchor it; nothing anchored that.

Rule 2's trigger fired at round 6. Honoring it would have saved ten rounds and
roughly 75 minutes of `opus`-`high` review on one paragraph, which was still
factually wrong when it was finally cut.

---

## Parallelism, for a batch executor

The window is a serialized waterfall — **merges land one at a time, in position
order**, and only one post-merge closing batch runs at a time (concurrent
`graph-commit` invocations conflict-park the loser, and every closing batch
must re-cut its worktree from the just-moved `origin/main`). Within that,
*implementation* may overlap exactly where this file already says the order can
flex: PR2 and PR5–PR9 are mutually independent and may be built in parallel
worktrees, and Bundles 3 and 4 share no files. Do not overlap two PRs inside
the same bundle — bundles are grouped *by shared code surface*, so intra-bundle
parallelism recreates the conflicts the bundling exists to avoid. Everything
else stays serial; the seven hard orderings above are load-bearing either way.

## The stopping check — parallelism first, then rate and quality

Recorded 2026-08-30 on author instruction, extending the parallelism check
above:

> whenever stopping, in addition to running a check for parallelization
> opportunities (existing guidance) also evaluate efficiency/efficacy of batch
> execution more generally and act on opportunities to self steer to improve
> rate and quality of progress.

"Act" is the operative word. A stopping check that produces observations and no
change is the failure this instruction corrects. At every stopping point, run
the parallelism check, then these three, and *land* whatever they turn up:

- **Rate.** What actually took longest, and what was the binding constraint —
  invocation count, a serialized gate, re-measuring something already measured,
  or a decision left un-ruled that standing authority already covers?
- **Quality.** What went wrong or nearly went wrong, and is the guard against a
  repeat durable, or does it live only in the conversation?
- **Steering.** Where would a written steer pay most, and in which durable home:
  this file for batch conduct, `.claude/rules/` for repo-wide practice, a memory
  file for cross-session judgment.

### Parallelism cannot beat `graph-commit` invocation count

Measured 2026-08-30 during PR5a Unit 7: **15 `mint-mainqa-nodes` invocations
took roughly 20 minutes**, about 60–90s each. Every invocation does a full
cycle — fetch `origin/main`, write, `graph-commit` (which takes the global
`refs/graph/landing-lock`, pushes, deletes the lock), re-fetch, re-read the
landed bytes and assert byte-equality.

Adding agents does not help. The landing lock is global, so concurrent
invocations serialize on it anyway, and overlapping `graph-commit` runs in one
worktree are independently known to corrupt. **The only lever is fewer
invocations**, and most node tools do not offer one: `clear-park` accepts
exactly one node id (`packages/intentionsutil/scripts/clear-park:219` bounds its
positional args to 1–2, the second being a note), so N park clears cost N
landings. `mint-mainqa-nodes` is the same shape, one `graph-commit` per source.

**But `graph-commit` itself batches, and the wrappers are what do not.** A
single invocation takes a multi-id `--base` manifest and lands all of them
together: Unit 7's migration landing (`74c281dc`) rewrote **15 nodes in one
`graph-commit`**, each
verified byte-equal against a 15-entry `--expect` manifest. So for a plain body
or frontmatter edit across many nodes, drive `graph-commit` directly with a
multi-id manifest — one landing — rather than looping a per-node wrapper. Reach
for the wrapper only when you need its own logic (`clear-park`'s park-refresh
and rollback, `mint-mainqa-nodes`' create-and-verify), and accept its
one-landing-per-node cost as the price of that logic.

Creates ride the same batch as edits. An earlier revision of this paragraph
said they cannot; that was wrong, corrected 2026-08-31. Only the premise was
true: a born-fresh node has no `origin/main` pre-image, so it contributes no
`--base` token. That is harmless, because `--base` is a **per-id opt-in**
compare-and-swap — `check_base_freshness()` iterates the manifest's own keys
(`for id in "${!BASE[@]}"`), so a positional id absent from the manifest is
simply not CAS-checked. Nothing in `graph-commit`'s id handling segregates
creates from edits: its own header documents `--prune <id>` as "(repeatable,
mixable with ordinary positional ids)", and the ordinary-id existence guard
asks only that the file be on disk — `intentions/<id>.md does not exist —
write the node via write-node.ts before graph-commit` — never that it exist on
`origin/main`. So one invocation can carry creates, edits and prunes together,
with `--base` entries for exactly the ids that have an `origin/main` pre-image.

So when estimating a graph-heavy position, **budget by invocation count, not by
node count** — and check first whether the work can collapse into one direct
`graph-commit` instead of N wrapper calls. Do not promise a speedup from
parallelism on graph landings; there is none.

### Measurement trust and constraint provenance — see the rule, not this file

Both conventions were promoted out of this document on 2026-08-30. Their single
canonical home is `.claude/rules/measurement-and-provenance.md`, which every
session in this repo loads as a project instruction; this document is read only
by a batch executor, and the two rules bind everyone. **Do not restate them
here** — a second copy drifts from the first, and the copy a reader trusts is
whichever they happened to open.

What stays here is the batch evidence that paid for them, because it is specific
to this window and belongs with the rest of its record:

- **Predictions refuted by measurement, twice.** A pre-staged Unit 7 kit
  predicted a "26 → 27 files" migration; measurement returned 28. A ruling
  premise of "41 of 124" measured 13. Every pre-stage report in
  `/tmp/claude-1000/` is a draft in exactly this sense — useful for finding the
  work, never authoritative about its size. `origin/main` is the fact.
- **A carried constraint that was scoped to the wrong actor.** Unit 7 was nearly
  blocked outright by *"never execute `mint-mainqa-nodes`"*, which had reached
  the standing constraints list in `plans/dispatch-rsi-batch-steering.md` from a
  read-only prep **subagent prompt the executor wrote itself**. That prompt's
  same block also forbade `graph-commit`, `write-node.ts`, `clear-park`,
  `park-node`, `transition-node` and `git push` — every one of which the
  executor had been running all session under the authority granted above. The
  bullet is struck in place there, with its provenance, rather than deleted.

### Scratch files are not a record

Memory files and the task list survive compaction; `/tmp` scratch does not, and
neither does the conversation that points at it. A decision made mid-session is
not recorded until it lives in a memory file, a task description, or this
repository. During a landing sequence, prefer memory first and migrate here
afterwards — an uncommitted file under `plans/` trips `graph-commit`'s
`assert_clean_outside_ids` and blocks the next landing.

### `node --import tsx/esm`, not `npx tsx` — see `.claude/rules/sandbox.md`

Promoted out of this document on 2026-08-30, for the same reason as the two
conventions above: it binds every session, not just a batch executor. The
canonical home is the `npx tsx` section of `.claude/rules/sandbox.md`, which
carries the measurement both ways. **Do not restate it here.**

The batch-specific part that stays: the tool headers were themselves teaching
the broken spelling, so every clean session walked into it. `write-node.ts`,
`dump-node.ts` and `validate-graph.ts` had their `Usage:` headers corrected in
the same PR, and `read-sensors.ts` its one in-body citation at `:1490` — all
four in that PR, not three. No corpus
sweep was done — node bodies remain mixed between the two — so when a
verification fence goes red on `listen EPERM`, that is this, and the fix is the
fence's spelling rather than the script.

---

## Cross-PR dependency edges

Moved here from the plan on 2026-08-29, so ordering has one home. The seven
constraints above are the ones that cannot flex; this is the full picture at PR
granularity. Constraint 7 is intra-PR (PR5's unit order), so it has no edge in the
PR-granularity diagram below.

```
PR1  graph read/write integrity (8)    ── ✅ SHIPPED fe0b1c4d (#3095), nodes closed
 │
 ├── PR18 durable-layer write fence    ── its blocked_by cleared WITH PR1 → ready
 ├── PR15 graph-commit simplification  ── same file as PR1; SPLIT: U0/U3/U4 only
 ├── PR16 node-mutation scripts (11)   ── needs PR1 U4 + U8
 ├── PR2  ladder driver
 ├── PR3  audit instrument ───────────┐
 ├── PR4  finding write surface ──────┤──┐
 ├── PR5  reconciler tick cost        │  │
 ├── PR6  code-review lock            │  │
 ├── PR7  review orchestration cost   │  │
 ├── PR8  config fail-closed          │  │
 └── PR9  worktree/session lifecycle  │  │
                                      │  │
        PR19 supersession repr.  ◄────┼──┘ (needs PR4's write surface)
        PR10 rsi trigger chain  ◄─────┘ (needs PR2 + PR3)
        PR11 lens catalog       ◄─────┘ (needs PR3)
        PR12 intervention core  ◄─────── (needs PR11 + PR4)
        PR14 rsi prioritization + research lane
        PR20 /align charter + adversarial review ── MUST precede PR13
        PR13 dispatch skill rename ── LAST, alone
        PR17 merge queue + scan cadence ── COLD; before the sentinel comes off
```

PR2 and PR5–PR9 are mutually independent and may run in any order or in
parallel. PR1 was the only universal prerequisite, and it has landed.

**PR18** was pinned behind PR1 by a real `blocked_by` edge — now cleared — and
sits ahead of everything else by argument: it is the fence the remaining ~100
node closures write through. **PR16** repairs the scripts every node closure in
this plan runs, so it is worth landing early despite depending on two PR1 units.
**PR19** is pinned behind PR4 by a real `blocked_by` edge:
`tactic-persist-greenfield-drops` is `blocked_by
tactic-finding-search-all-producers`, PR4's central node — the one write surface
every creation site routes through, and supersession edges are written *by* that
surface. **But the reverse edge also exists**:
`tactic-finding-search-all-producers` is itself `blocked_by
tactic-supersession-edge-and-terminal`, a PR19 node — so as bundled, PR4 and
PR19 form a **PR-level cycle** and cannot both be atomic. **PR19 splits: Unit 1
(the `schema.ts` `superseded_by` edge + `superseded` terminal) ships as PR19a
ahead of Position 5; the two consumer nodes ship as PR19b at Position 6.** See
Position 6 for the decision and the rejected single-PR alternative. **PR20** is pinned *ahead* of PR13 because PR13 renames the skill file
PR20 edits — the one hard ordering constraint whose violation is silent rather
than a merge conflict. **PR17 is cold**: nothing in it fires while the sentinel
holds, so it belongs immediately before the staged resumption.

The four `blocked_by` edges landed in `da1c3c7f` are honored:
`audit-threshold-table → trigger-threshold-gate → session-sweep-trigger →
ladder-per-phase-evaluation` is the internal unit order inside PR10;
`eval-finding-ledger → duplicate-finding-sensor` is the internal unit order
inside PR4; `audit-cache-efficiency-lens → dispatch-cache-preserving-context`
puts that experiment after PR3; `ladder-worker-unstamped-audit-blind →
align-tactics-worker-transcript-unscanned` is the internal unit order in PR3.

---

## What this sequence does not cover

- **Eight deferred nodes**, with reasons: the ref-split cluster — now five, not
  three (`tactic-graph-ref-split`, `-blocker-audit`, `-read-coherence`, plus
  `tactic-graph-commit-plumbing-default` and
  `tactic-graph-commit-direct-three-way-merge`, which joined it on 2026-08-29
  when PR15 split),
  `tactic-node-scope-files-overlap-gate` and `tactic-scope-stamp-in-graph`
  (both need a running fleet, i.e. resumption work), and
  `tactic-demote-node-stale-local-read` (blocked behind
  `tactic-phase-evidence-fingerprint-bound`).
- **Five adjacent nodes, surveyed and deliberately not claimed** —
  `tactic-qa-main-node-terminal-declaration` and the two
  `tactic-invalid-state-rc-*` nodes are `/qa-main` node-lane paths that write
  job-dir markers instead of graph state; `/qa-main` does not run while the
  sentinel holds and they overlap PR12's surface. Plus
  `tactic-session-reap-authorization-durability` and
  `tactic-park-cause-sensor-instrument`, which need a running fleet.
- **Five in-scope nodes that no PR closes — CLOSED 2026-08-29 by author
  disposition.** `tactic-review-sitting-code-review-lock-design`,
  `tactic-review-band-derivation-ratification`,
  `tactic-review-tradition-agentic-engineering`,
  `tactic-review-supersession-derived-subpoints` and
  `tactic-review-dispatch-charter-split`. Inside the 114; their sittings were
  held at the 2026-08-28 round, and on 2026-08-29 the author ruled to close
  all five on the held sittings (band-derivation ratified alongside the
  observable-(a) ruling, its (b)-half re-validation). Each closes in the
  schema's precedented no-diff shape: `phase: done`, `execution` stays null,
  and a frontmatter clarification citing its sitting and the 2026-08-29
  disposition is the completion record. Nothing in the
  sequence is undriven anymore.
- **Those two bullets are the whole surveyed-but-unassigned set — 13 nodes**,
  8 deferred plus 5 adjacent. This list used to end with a third bullet reading
  *"Eleven documented-but-unassigned tactics from the third coverage pass"*,
  which read as a third disjoint set and made the sequence look as though it
  left 24 nodes uncovered. It was the same eight-plus-five, counted again at its
  2026-08-18 value of 6+5.

---

## One caveat that applies to the whole sequence

The plan's `phase: null` re-verification **expired on 2026-08-20, in both
directions.** Inward: 45 of the 102 node ids in its `### Nodes closed` sections
are now `phase: implement` on `origin/main`, moved by `/align-tactics`
finalization rounds run after the plan was written. Nothing about the
assignments changed — but *"these nodes are not in the ladder"* is no longer
true of the phase field, **and the tick reads the phase field**. Outward: the
same filter is why the plan originally never saw the ~20 in-charter nodes at
`phase: implement` with no PR — since censused and routed by the plan's fourth
coverage pass (see §"Coverage" there); that population is settled, and this
caveat survives only as the reason the filter can go stale again.

Treat every `path:line` anchor in the plan as a hint, not an address —
including the anchors carried in node bodies, several of which had already
drifted when the plan was written.
