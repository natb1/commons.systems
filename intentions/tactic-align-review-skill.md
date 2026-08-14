---
id: tactic-align-review-skill
kind: tactic
statement: Build the /align-review skill, the assemble-review-pack script, and
  the graph-commit --review receipt floor; insert the draft-review gate into
  /align's flow
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-08-11 /align interview codifying the
  adversarial draft design review (strategy condition + clarifications of that
  date, amended by the bootstrap review's own material findings): the graph
  records the doctrine; this tactic carries the skill-text encoding, the
  pack-assembly script, and the mechanical receipt floor in graph-commit —
  judgment in the review, receipt in the script, per the scripted-path
  condition."
reading: null
serves:
  - strategy-discovered-requirements
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Author ratification owed on the proposed clarification 'How does
    graph-commit tell an /align round's write apart from every other caller's,
    now that the gate is scoped to /align's own output only?'. The 2026-08-14
    scoping ruling (recorded on strategy-discovered-requirements'
    draft-review-gate condition, and restated in this node's own body as 'the
    --review receipt floor must not make graph-commit refuse every caller's
    write') is contradicted by the mechanism this node's item 3 specifies: a
    gate predicate 'read off the commit's diff' — 'creates or modifies any
    strategy-* field other than phase/execution/office_hours/reading/attention,
    or creates any new node file'. Verified against origin/main d5770f6e, that
    predicate fires on every explicitly scoped-out caller: /align-tactics mints
    tactic node files and writes the strategy's clarifications and rounds
    (.claude/workflows/align-tactics.js:154,807;
    .claude/skills/align-tactics/SKILL.md:365-378), and qa-fix finding nodes,
    dispatch-diagnose-main's tactic-main-red-<sha> node, dispatch-eval-finding
    ledger entries and /context-chunks drafts all create new node files. And
    item 3's own third enumerated case — a draft-tactic-only /align round — is
    diff-shaped identically to an /align-tactics decomposition, so no refinement
    of a diff-derived predicate separates them. The only discriminator present
    today is the invocation site (/align calls graph-commit directly,
    align/SKILL.md:573-588; /align-tactics lands through land-align-round,
    align-tactics/SKILL.md:371-378), which makes the receipt caller-declared and
    opt-out-by-omission rather than the mechanical floor the condition
    describes. The author must choose (a) a caller-declared seam, accepting an
    opt-in floor; (b) narrowing the predicate to substance fields only /align
    writes, accepting that draft-tactic-only and mint-only /align rounds go
    ungated; or (c) re-widening the scope. Item 3 is a whole unit and items 4
    and 9 inherit the ambiguity, so no clean-session plan can be authored for
    this node until it is ratified. Note the incompleteness is in the SERVING
    STRATEGY's record (the condition scopes the gate but records no
    discrimination mechanism); a per-node session cannot write the strategy, so
    the ratified answer must land there in a subsequent /align round. Two
    non-blocking findings from this round, recorded here (a tactic-target
    session may not write the serving strategy): (i) attributes.align_round
    (item 9) needs no strategyFingerprint exemption — the fingerprint is an
    allowlist (statement, clarifications, attributes.conditions, serves,
    success_signal, tooling_goals) and every other attributes key is already
    freeze-inert by construction. (ii) graph-commit today has only
    --base/--expect manifest-argument plumbing — no --review flag and no
    commit-trailer machinery exist anywhere in the script (the -m message is a
    single flat string). Model the refuse-before-mutation, dedicated-exit-code
    contract on park-node's --base pin (park-node:75-114 header, :202-236
    resolution, :360-362 refusal — already duplicated verbatim in clear-park),
    NOT on graph-commit's own --base, which auto-merges a stale blob via
    check_base_freshness/run_merge_node rather than refusing, and never exits 3
    despite the script's own header claiming otherwise at :169/:1952 (that stale
    header line should be corrected in the same change). Recommend: the author
    ratifies option (a), (b), or (c) above via a /align round on
    strategy-discovered-requirements — the discrimination-mechanism gap is in
    the serving strategy's own record, not this tactic's — then re-run
    /align-tactics tactic-align-review-skill to author the clean-session plan."
  since: 2026-08-14
  recommendation: null
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Build the /align-review skill, the assemble-review-pack script, and the graph-commit --review receipt floor; insert the draft-review gate into /align's flow
## Draft context (2026-08-11 /align interview, v3 — two review rounds run on this round's own draft, the bootstrap precedent)

Authoritative doctrine: the draft-review gate **condition on
`strategy-discovered-requirements`** — re-homed there from
`strategy-graph-native-dispatch` on 2026-08-14 by the author's ratifying
round, and scoped to `/align` at the same time. Its supporting rationale
stayed behind as the clarification "Is the interview still the audit once
the draft review gate exists?" on `strategy-graph-native-dispatch`
(2026-08-11), which is still worth reading. This body carries the
implementation decomposition only — cite the strategy record, do not
restate its rationale.

**Binding scope ruling (2026-08-14), which changes what this tactic must
build.** The gate covers an `/align` round's own output ONLY: the
`strategy-*` substance the round writes, and any new node file it mints
(draft tactics, born-parked review items). A `/align-tactics`
decomposition, a `qa-fix` finding node, and a router transition are OUT of
scope. So the `--review` receipt floor must **not** make `graph-commit`
refuse every caller's write — refusing unconditionally would impose an
adversarial review round on every autonomous decomposition and every
finding-node write, which the author explicitly ruled out. The reason the
scope is asymmetric: `/align` output is the case with no downstream reader
("the interview IS the audit"), whereas an `/align-tactics` subtree is read
again at plan, implement, PR review and QA. This ruling was made while this
tactic was still unplanned, precisely so the receipt design starts from it
rather than being reworked into it.

1. New `.claude/skills/align-review/SKILL.md` — executed by an independent
   subagent launched with an explicit `model: opus` launch parameter (not
   skill frontmatter — unconfirmed honored outside context: fork). No
   drafting-session context. Also author-invocable standalone against any
   staged draft. Instructions (the requirement's words bind): consider
   alternate designs versus both the author's original requirements and the
   draft; focus on greenfield design that reconsiders assumptions in the
   existing graph; a challenge to recorded doctrine is always MATERIAL.
   Output rubric: verdict (greenfield / mostly-greenfield /
   brownfield-shaped) + requirement-clause coverage table + findings ranked
   MATERIAL/MINOR, each MATERIAL finding carrying its concrete alternate
   design. MINOR bright line (from the strategy condition): format-only —
   anything changing what the record says is MATERIAL by construction; a
   wrong-citation fix is MINOR only when the intended referent is
   unambiguous and exists, else MATERIAL (a wrong citation can conceal a
   missing doctrine home — the F4 precedent).
2. New owned script `assemble-review-pack` (home:
   `.claude/skills/align-review/scripts/`): builds the handoff pack from
   on-disk artifacts, never session narrative — requirement text captured
   verbatim at /align step 1; dump-node base JSON + exact write-node input
   JSON per edited node; each draft tactic's JSON and body; the
   design-proposals rule; origin/main renders of every touched node and
   every file the round's carrier tactics will amend; the round's freeze
   classification and delegation-sweep outcome. Interview resolutions enter
   as the drafted clarification entries themselves. The script FAILS CLOSED
   when any producer file is missing — that is what makes the pack spec
   enforceable rather than aspirational.
3. `graph-commit --review <report-file>` receipt floor, content-bound like
   `--base`: the report carries the node ids it reviewed plus a digest of
   the exact write-node input JSON it was given; graph-commit recomputes
   that digest from the staged node files and refuses on mismatch — so a
   shape-changing disposition breaks the stale round-1 receipt mechanically
   (dedicated exit code, verdict line `refused`). Gate predicate, read off
   the commit's diff: the commit creates or modifies any `strategy-*` node
   field other than the router-owned ones (`phase`, `execution`,
   `office_hours`, `reading`, `attention` stamps), or creates any new node
   file — covers new-strategy rounds, statement/rationale/signal-only
   amendments, and draft-tactic-only rounds; still excludes every
   mechanical phase-transition writer (transition-node, park-node,
   apply-node-transition touch only router-owned fields). ACK opt-out via
   an `--ack <reason>` flag graph-commit records as a commit trailer
   (graph-commit authors its own commit messages, so a message-substring
   escape hatch would have no author surface). This flag seam is also what
   a later /align-tactics extension reuses — one flag, not a redesign.
4. Amend `.claude/skills/align/SKILL.md`:
   - Producer writes for the pack (fail-closed inputs to point 2's script):
     Step 1 writes the author's requirement text verbatim to the round's
     pack dir before framing; Step 3 writes the delegation-sweep outcome;
     Step 5's materiality classification writes its verdict, including an
     explicit "no stamped open children — no freeze fires" no-op.
   - Insert the gate between draft construction and the graph-commit call
     in Step 5: assemble the pack (script), launch /align-review, hold the
     commit on its return, run the disposition rule (MATERIAL → author
     question mechanics incl. accept-as-deferral → Mode-A enrollment on
     deferral; MINOR → fold + report), re-review iff design shape changed
     (cap two rounds per bundle, then surface residue and proceed on the
     author's call), pass the report via graph-commit --review.
   - Rewrite the "interview is the audit" paragraph (currently
     SKILL.md:46-50) to the amended doctrine now recorded on the strategy
     ("the draft review is the audit's second reader, not a substitute")
     and fix its citation — the cited "clarification 2" does not carry that
     doctrine; cite the 2026-08-11 clarification instead.
   - Restate Step 6: the reviewer's coverage table is the authoritative
     condition-7 discharge (fresh-session proxy); Step 6 reconciles its own
     walk against the reviewer's table and escalates any clause the
     reviewer could not place. Instruct the reviewer to flag every fact it
     needed that is NOT in the material that will land on origin/main (the
     write-node input JSON and the draft-tactic bodies) — that list is the
     round's condition-7 defect list. (Facts appearing only in pack-context
     items — origin/main renders, the rules file, the verbatim requirement —
     are exactly the fresh-session gaps.)
   - Fix the adjacent dangling prose reference at SKILL.md:733
     (tactic-align-interview-type-doctrine — pruned node).
5. Subagent failure handling: one retry, then surface to the author —
   never a silent skip (strategy condition).
6. Implementation lane: SKILL.md/scripts paths are outside intentions/, so
   this lands via the normal tactic worktree + PR lane — never an /align
   round's direct-push (restricted to intentions/ paths by the strategy's
   own condition). graph-commit changes ship with tests (it is owned,
   offline-testable code per the scripted-path condition).
7. Arming: the strategy condition's gate reads not-yet-armed until this
   tactic lands the skill, the pack script, and the receipt flag together;
   the interim discharge is the inline-pack bootstrap subagent (two live
   runs 2026-08-11: the rsi-plan priorities round and the gate-codifying
   round itself, both producing material findings that changed the landed
   design). The interim's expiry event is this tactic's PR merging — after
   that, an inline-pack discharge is drift, not a sanctioned path.
8. Candidate, explicitly out of scope (author kept scope /align-only
   2026-08-11): extending the gate to /align-tactics' drafted plans via the
   same --review flag.
9. **Round provenance has no home in the graph — a structural gap this
   tactic must close** (added 2026-08-11, third round, from the review of
   the namespaced-rank round: six of its ten completeness defects were all
   this one gap). `/align`'s Step 5 orders the session to "record the
   classification in this round's own record/summary — the scope-inert
   verdict and the tactic ids re-stamped — as the audit trail the doctrine
   requires", but names **no field** to record it in, and none exists.
   `rounds` is not it: schema.ts declares it `/align-tactics` round
   accounting (`{count, last_completed, last_aligned}`, strategies only,
   `validateGraph` rule 12). `/align` writes only `attributes.conditions`,
   `delegated`, `divergence`, and `irreversibility`. So every round's
   freeze classification, delegation-sweep disposition, and gate-compliance
   status survive only in session narrative and die with the session — and
   the record-completeness contract (strategy clarification 31 / condition
   7) says the graph is the **sole** carrier. The observed cost is
   concrete: because the namespaced-rank round's freeze classification was
   never recorded, nothing showed that its blast-radius scan covered only
   children of `strategy-recursive-self-improvement`, and a contradiction
   left standing on `strategy-graph-drives-dispatch` went unnoticed until
   an adversarial reviewer found it.
   Scope: add an `attributes.align_round` record on the aligned strategy —
   date, requirement digest, freeze classification with its evidence set,
   delegation-sweep disposition, and the review receipt from item 3 — and
   make Step 5 write it. It is deliberately the same field the `--review`
   receipt lands in, so a round that skipped review is visible as a missing
   receipt rather than as an absence of any record at all. Note the
   fingerprint interaction: like `priority_log` and `queue_summary`, this
   field must be **exempt** from `strategyFingerprint`, or writing a
   round's own provenance would freeze that strategy's open children.
   Two provenance items are NOT in scope, having been judged
   cheap-and-ad-hoc rather than structural: quoting the author's
   requirement verbatim and naming a declined alternative both land as
   ordinary clarification prose (done for that round at d7f306a7 and its
   follow-up). And curriculum-enrollment status is deliberately **not**
   recorded: Step 5 makes Mode B enrollment implicit and forbids a
   per-node review schedule or side list, so an audit trail for it would
   contradict the doctrine it audits.
