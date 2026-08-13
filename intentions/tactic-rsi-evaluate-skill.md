---
id: tactic-rsi-evaluate-skill
kind: tactic
statement: Build the /rsi-evaluate skill — the delegated evaluation and
  reprioritization subagent of the rsi loop
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-08-11 /align interview on rsi-plan tactical
  priorities: the author chose a new third skill over widening /rsi-plan, so the
  render/judge split survives — /rsi-plan renders, /rsi-evaluate holds the
  delegated judgment, /rsi keeps authority and execution."
reading: null
serves:
  - strategy-rsi-delegated-prioritization
recovers: []
clarifications:
  - question: Is this skill still to be built, after the collapse retired the loop
      it would have lived in?
    answer: >-
      (Recorded 2026-08-13. No — do not build this.) /rsi-evaluate was recorded
      2026-08-11 as the delegated evaluation and reprioritization subagent of
      the rsi loop, sitting between the render and the main-thread judgment. The
      2026-08-12 collapse retired both of those: there is no render and no
      judgment session, so there is no seam this skill fits into.


      Its capability was not dropped — it moved. Evaluation moved to /rsi, the
      per-phase ladder evaluator that fires at every phase boundary and lands
      findings in the merged ledger. Reprioritization moved to /rsi-audit, whose
      unblocked half (recommending strategy boosts for author ratification)
      shipped with PR 3074 and whose blocked half is recorded as
      tactic-rsi-audit-prioritization-writer.


      This node is left standing rather than pruned because pruning is its own
      graph act with its own prose-reference sweep — several nodes still cite
      it, including this strategy's scope clarification and the collapse round's
      own open-conflict record. It belongs in the same pruning round as
      strategy-rsi-plan-surface and its tactics. Until then this clarification
      is the answer to anyone who selects it: the work is done elsewhere.
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
# Build the /rsi-evaluate skill — the delegated evaluation and reprioritization subagent of the rsi loop
## Draft context (2026-08-11 /align interview)

Skill spec, from the recorded resolutions:

- A subagent invoked by /rsi after the /rsi-plan render; also standalone
  author-invocable under the same strategy-recursive-self-improvement
  worktree claim (fail-closed, worktree-as-claim).
- Scope (moved from /rsi step 2 by the 2026-08-11 amendment):
  1. Re-evaluate the graph, diff-aware over changes since the last iteration
     (what landed, what new nodes appeared, what flags changed).
  2. Reprioritize dispatch-delegated tactics — direct attention writes
     (boost or override) on owner: ai tactics only, optimizing the
     recorded fitness function: front-load high-impact tactics, bug fixes
     affecting dispatch throughput/integrity, token optimizations that
     raise throughput. Never writes attributes.tier — the only tier
     instrument is adding a recognized bug_fix/security mark (never
     removing/downgrading one). Never touches strategy/virtue attention or
     owner: human tactics. Tier takes precedence over strategy rank;
     within a tier, higher-ranked strategies' tactics order first.
  3. Every attention write appends {date, old→new, rationale} to the node's
     attributes.priority_log (append-only, capped ~10 entries); reads the
     log first and never reverses a prior reordering without citing new
     evidence (anti-thrash condition).
  4. Re-derive the rsi task plan: write attributes.rsi_task {type,
     reasoning, cost?} per task node; implementation type ⇒ cost 1 derived
     (declared cost ignored/flagged); other types default 0 unless
     rsi_task.cost set; an implementation row's reasoning must state why
     the task is on the rsi plan rather than the dispatch queue.
  5. Draft flag interpretations, defect tactics, and harness-vs-rsi routing
     recommendations with their reasoning; flag align-need candidates.
  6. Re-run render-rsi-plan.ts after its writes so rsi-plan.md reflects the
     new order; land graph writes via graph-commit. rsi-plan.md itself
     lands via the same direct-push-to-main exception the render condition
     on strategy-recursive-self-improvement grants /rsi-plan — same
     worktree claim, so the single-writer property holds.
- Stays in /rsi main thread (attended): ratifying routing that commits
  budget, pause/resume authority, /align escalation and conduct,
  office-hours conduct on throws, all execution (rsi-advance/rsi-await).
- Update /rsi SKILL.md (step 2 shrinks to ratification + authority limbs;
  new step invoking this skill) and /rsi-plan SKILL.md (cross-reference;
  its render-only contract is unchanged) in the same change.
