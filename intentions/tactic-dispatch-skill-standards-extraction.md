---
id: tactic-dispatch-skill-standards-extraction
kind: tactic
statement: Rename the dispatch skill family for uniform /dispatch-* naming —
  /align-tactics to /dispatch-plan, /qa-fix to /dispatch-qa, /review-fix to
  /dispatch-review; extract common standards only if a concrete consumer emerges
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-08-10 /align interview as a standards
  extraction for rsi; re-scoped in the same day's review round: rsi reuses the
  dispatch skills verbatim, so no consumer requires extraction today — the
  renames (naming uniformity) are the remaining scope, low priority, landed when
  the queue is stable."
reading: null
serves:
  - strategy-graph-native-dispatch
  - strategy-recursive-self-improvement
recovers: []
clarifications:
  - question: What is the measured blast radius of the dispatch-skill renames, and
      which in-repo commits are the template for the sweep?
    answer: "(Recorded 2026-08-20 /align-tactics per-node round; measurements taken
      on that date's origin/main.) 434 files reference align-tactics, 206
      reference qa-fix, 214 reference review-fix — roughly 3-6x the nearest
      precedent, c3c229f0 (dispatch-token-audit -> rsi-audit, 134 references
      across 41 files), which is the on-point template for the sweep, together
      with 6f730dca + d66ed9c2 (the rename commit, then a separate mechanical
      reference-sweep commit) and 35494b017f (script-basename renames moved in
      lockstep). Historical intentions/*.md references stay OUT of scope:
      rewriting them churns each node's tacticScopeFingerprint and can mis-park
      live sessions — a constraint c3c229f0's own PR body records — except where
      lint-verify-fence-paths.sh's ratcheted baseline would otherwise gain a
      newly-orphaned ```verify``` fence path in a live node. Verification reuses
      run-lint.sh (which invokes lint-verify-fence-paths.sh) plus `npx tsx
      packages/intentionsutil/scripts/validate-graph.ts intentions` reporting 0
      unresolved prose refs."
  - question: Which reference surfaces does the rename touch that the rsi-audit
      precedent did not?
    answer: (Recorded 2026-08-20 /align-tactics per-node round.) Three surfaces
      beyond the skill directory name. FIRST, the three skills' test suites are
      named after the skill concept but live OUTSIDE their directories — 12
      test-align-tactics-*.sh / test-qa-fix-*.sh / test-review-fix-*.sh files
      under .claude/skills/dispatch-propagate/scripts/, with matching step names
      in .github/workflows/unit-tests.yml and changed-path globs in
      run-unit-tests.sh; the plan must decide explicitly whether those basenames
      move. SECOND, the Workflow object's own `name:` field
      (.claude/workflows/align-tactics.js:77 and its siblings) is a third
      identifier, distinct from the directory name and the SKILL.md frontmatter
      `name:`. THIRD, .claude/settings.json is NOT load-bearing here — these
      three skills carry no Skill()/Bash() permission grants, unlike rsi-audit.
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Four unrecorded premises must be ratified by the author before this
    node's plan can be authored; the first is disqualifying on its own. (1)
    DUPLICATE CARRIER. This node's 2026-08-10 re-scope moved the
    /align-tactics->/dispatch-plan, /qa-fix->/dispatch-qa,
    /review-fix->/dispatch-review renames onto it, but the serving strategy's
    own record designates a different carrier:
    intentions/strategy-graph-native-dispatch.md:7858 (body section \"Other
    Settled Mechanism\", the operative entry-67 ruling) says the rename \"is
    retained as draft tactic-dispatch-skill-rename (blocked_by
    tactic-dispatch-skill-input-contract), to land as coordinated adjacent
    PRs\", and strategy clarification 69 says the same.
    intentions/tactic-dispatch-skill-rename.md is live (status raw, phase null,
    same serving strategy) and its roster table claims all three of this node's
    renames verbatim; the 2026-08-10 re-scope did not supersede, prune, or even
    mention it. Authoring a plan here would pick a winner between two live
    drafts by omission — the same duplicate-target pair the author resolved
    explicitly in the 2026-07-19 precedent (strategy clarification 78, commit
    4a83dfc1) rather than letting a decomposing session decide. PROPOSED
    CLARIFICATION FOR RATIFICATION: ratify one carrier and dispose of the other
    — fold the rename scope back into tactic-dispatch-skill-rename and retire
    this node (its original standards-extraction scope is already retired by the
    same 2026-08-10 review round, so nothing would remain on it), or supersede
    and prune tactic-dispatch-skill-rename and amend the entry-67 ruling's
    carrier citation to point here. (2) ROSTER. Strategy clarification 67
    records a seven-entry dispatch-<phase> namespace (dispatch-plan,
    dispatch-implement, dispatch-fix, dispatch-qa, dispatch-review,
    dispatch-main-qa, dispatch-conflict) and the sibling's roster carries all
    seven; only fix-conflicts->dispatch-conflict has shipped (6f730dca), leaving
    six outstanding. This node names three and is silent on
    /implement->dispatch-implement, /fix-checks->dispatch-fix,
    /qa-main->dispatch-main-qa, so a plan authored here either strands half the
    recorded namespace or silently widens its own scope. PROPOSED CLARIFICATION:
    state whether those three belong in the same carrier and the same atomic PR,
    or are deliberately deferred, and to which node. (3) TRANSITION SHAPE. This
    node's body says the renames land \"with compatibility aliases during the
    transition\", which has no implementable mechanism — a skill's identity is
    its directory name plus the SKILL.md frontmatter name: plus the Workflow
    registration name: (.claude/workflows/align-tactics.js:77), with no alias
    layer, so an alias means a duplicate skill registration. All three in-repo
    precedents (c3c229f0, 6f730dca + d66ed9c2, 35494b017f) are an atomic git mv
    plus a full reference sweep in one PR, which is also what the sibling
    specifies. This decides the top-level unit decomposition, so the plan cannot
    be authored without it. PROPOSED CLARIFICATION: ratify the atomic single-PR
    shape, or record the aliasing mechanism intended. (4) PHANTOM BLOCKER. Both
    the strategy body (:7858) and the sibling's Sequencing section gate the
    rename on tactic-dispatch-skill-input-contract, but no such node exists in
    intentions/ — the id appears only as prose in those two files, and
    tactic-dispatch-skill-rename's own frontmatter blocked_by is empty. Either
    the input-contract restructuring was dropped (and the recorded sequencing is
    stale) or it was never filed (and the blocker is unrecordable); a plan
    authored here cannot express the dependency either way. PROPOSED
    CLARIFICATION: record whether the input-contract restructuring is still a
    prerequisite (file the node and set the blocked_by edge) or was dropped
    (strike the citation from both records). Parked 2026-08-20 by an autonomous
    /align-tactics per-node round (park category: requirement-ambiguity). This
    session made no other graph write: the node keeps phase null and status raw,
    and the round's measurements are recorded as dated clarifications on this
    node so the eventual carrier's plan does not have to re-derive them."
  since: 2026-08-20
  recommendation: "Resolve all four premises in one /align pass on
    strategy-graph-native-dispatch. Items 1, 2 and 4 are edits to the strategy's
    own entry-67 ruling (body section \"Other Settled Mechanism\",
    intentions/strategy-graph-native-dispatch.md:7858) and to
    intentions/tactic-dispatch-skill-rename.md — writes a per-node
    /align-tactics session is forbidden to make, which is why this parked rather
    than finalizing. Item 3 can be settled in the same pass by adopting the
    atomic-single-PR precedent (c3c229f0). Start with item 1, the carrier
    decision: if the ratification retires this node in favour of
    tactic-dispatch-skill-rename, items 2-4 are answered on the sibling and no
    re-plan of this node is needed at all — clear this park by pruning the node.
    If instead this node is ratified as the carrier, answer items 2-4 here, then
    re-run /align-tactics tactic-dispatch-skill-standards-extraction, which will
    finalize against the ratified record. Do NOT clear this park by finalizing a
    plan without the carrier decision: that resolves a duplicate-target pair by
    omission, the failure mode the 2026-07-19 precedent (clarification 78,
    commit 4a83dfc1) was ratified to prevent."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---

## Draft context (2026-08-10 /align interview; re-scoped same-day review round)

- Original scope (extraction of common standards from /align-tactics, /qa-fix,
  /review-fix, /dispatch-conflict, /align for rsi consumption) is retired: the
  review round resolved that rsi reuses the dispatch phase skills verbatim via
  spawned sessions, so no consumer requires an extraction today. Extraction
  returns to scope only if a concrete consumer emerges.
- Remaining scope: renames for uniform /dispatch-* naming — /align-tactics →
  /dispatch-plan, /qa-fix → /dispatch-qa, /review-fix → /dispatch-review
  (/dispatch-conflict already conforms).
- Sequencing: low priority; renames touch live dispatch surfaces and many
  node bodies/plans reference the current names — land when the queue is
  stable, with compatibility aliases during the transition.
