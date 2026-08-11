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
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Build the /align-review skill, the assemble-review-pack script, and the graph-commit --review receipt floor; insert the draft-review gate into /align's flow
## Draft context (2026-08-11 /align interview, v3 — two review rounds run on this round's own draft, the bootstrap precedent)

Authoritative doctrine: the draft-review gate clarification and condition
on strategy-graph-native-dispatch (2026-08-11). This body carries the
implementation decomposition only — cite the strategy record, do not
restate its rationale.

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
