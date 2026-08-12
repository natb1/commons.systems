---
id: strategy-rsi-plan-surface
kind: strategy
statement: rsi-plan.md is the author's readable surface for harness status and
  what comes next — every section derived from graph state, nothing
  hand-maintained
owner: human
status: refining
parent: strategy-recursive-self-improvement
rationale: "Recorded 2026-08-11 by the /align round that subdivided
  strategy-recursive-self-improvement into ranking-namespace children, executing
  the concrete work its child-strategy clarification records as owed. This child
  owns the author-facing status and priority VIEW of the harness —
  render-rsi-plan.ts, the rsi-plan.md format contract, and the view's eventual
  migration into the office-hours GUI. Its end is not that a document exists but
  that the author's oversight of a delegated harness is DERIVED from the record
  rather than reconstructed by hand: who sets the problem stays with the author
  only if the author can see what the delegatee is doing without asking it.
  Ranking function, the reason it is a child rather than a tactic group: tactics
  serving it resolve one band above tactics left directly on the parent, which
  is the author's only doctrine-sanctioned channel for ordering delegated work
  (a direct tactic boost sits inside the surface delegated to /rsi-evaluate)."
reading: null
serves: []
recovers: []
clarifications:
  - question: Why a child strategy rather than a boost on the .md tactics themselves?
    answer: "(Recorded 2026-08-11 interview.) Because a direct author-set boost on
      an owner: ai tactic sits inside the surface delegated to /rsi-evaluate,
      which may rewrite or remove it without author input — the parent's 'May
      the author express tactic priority by boosting a tactic directly?'
      clarification records that bound and names child strategies as the
      author's channel. The parent's child-strategy clarification independently
      authorizes subdividing purely to rank, provided the child carries its own
      success_signal. This node satisfies that: the ranking is the reason it
      exists, and the render-fidelity signal is what would validate it. The
      author declined the proposed success_signal exemption for
      ranking-namespace children in the doctrine round, so the signal here is a
      requirement, not a courtesy."
  - question: Where does this strategy end and strategy-attention-surface begin?
      Both name a surface, and both end up in the same GUI.
    answer: "(Recorded 2026-08-11 interview; author selected 'the surface, whole'.)
      Split by CONTENT, not by application. strategy-attention-surface owns the
      office-hours ritual, parked-node selection, and the signals queue — its
      tactic-attention-surface-status-page is 'one attention-ranked queue of
      typed SIGNALS with per-signal context panel', i.e. the things that trigger
      review. This strategy owns the status and PRIORITY view — what the harness
      is doing, what comes next, and when — wherever it renders, starting as
      rsi-plan.md and later as a view inside the same office-hours application.
      So the two do not compete for the GUI: they occupy different content in
      it. A fresh session planning GUI status-view work must read this boundary
      from both nodes; it is recorded on strategy-attention-surface as well for
      that reason."
  - question: Steelman — is a rendered view scaffolding rather than a goal? Reports
      belong to whatever strategy owns the work they report on, and elevating a
      document to the strategy layer is the accepted-but-real cost the parent's
      child-strategy clarification names.
    answer: "(Diverged 2026-08-11, reason recorded.) The rival is right that a
      report about work is not itself a goal, and right that this node pays the
      named cost. It fails on what the node actually claims. The claim is not 'a
      document exists' but 'the author's oversight of a delegated harness is
      derived from the record, never reconstructed by hand' —
      virtue-alignment-of-attachments turned on the harness itself. That
      property must still hold after every render tactic now open completes and
      is pruned, which is kind-tactic's authoring test for strategy-layer
      content; no tactic can own it. The rival's alternative — a boost on a
      tactic group — is also unavailable: under the namespacing bound recorded
      on the parent, a tactic boost cannot express cross-strategy order at all,
      so the rival leaves the author's requirement unsatisfiable. Recorded as a
      divergence rather than a rejection because the cost it names is real: this
      node is on the ranking-namespace path, and its own success_signal is the
      bound that keeps that path from admitting ungrounded nodes."
  - question: What is the shape of the merged priority table this strategy's tactics
      must render?
    answer: "(Recorded 2026-08-11 interview, amending the parent's 'What must
      rsi-plan.md contain?' clarification. AMENDED later the same day after
      adversarial review — see the withdrawals below.) The three sections it
      recorded separately — top author priorities, dispatch-delegated status,
      and critical office-hours parked nodes — merge into ONE table. Structure:
      tier bands as outer sections (tier 3, tier 2, tier 1), and inside each
      band, tactic rows grouped by parent strategy with the groups sorted by
      rank and each group introduced by a header row carrying the full strategy
      lineage. Two independent columns mark a row delegated (owner: ai —
      dispatch owns its ordering) and parked (office_hours set — not selectable
      until the author clears it); they are orthogonal, measured over all
      non-done tactics (388 at 2026-08-11): 143 parked, 54 of them owner: ai, so
      a single combined lane column would hide one fact for those 54 rows. The
      parked cell carries the blocking answer inline ('parked (blocks dispatch)'
      vs 'parked') rather than spending a fourth column that is empty on most
      rows, which preserves the superseded section 3's requirement that each
      parked node say what it blocks. Section 1's strategy rows become the group
      header rows. ROW SET: every non-done tactic, drafts included — the two
      tactics that implement this very table are themselves drafts, and a
      phase-set-only rule would omit them from the plan that tracks them; parked
      rows are included and marked, never dropped. TIER IS THE OUTER KEY because
      the router selects on the lifted (tier, rank) pair, so a tier-2 bug fix
      executes before every tier-1 row regardless of its strategy's rank, and
      without a tier band it would render far down the page under a low-ranked
      strategy. WITHDRAWN: the original wording also justified tier-outermost by
      claiming it keeps the ETA column counting monotonically down the page.
      That is false. Grouping by strategy at all reorders rows away from
      selection order — measured on the live graph, a single strategy's rows
      span up to 160 selection positions — so no choice of outer key restores
      monotonicity. Monotonic ETA is not a property this table has, and nothing
      may be justified by it. Grouping is kept because the author specified it;
      the reviewer's alternative of one global selection-ordered list with
      lineage as a breadcrumb column was considered and declined for that
      reason. ETA BASIS, one basis for every date on the page: a tactic row's
      ETA is today + (its 1-based position in the router's selection order /
      velocity). Parked rows have NO position — selectGraphTargets skips them at
      its office_hours guard — so their ETA cell reads 'unavailable — parked'
      and they are excluded from the position counter that feeds every other
      row's ETA, otherwise 143 unselectable rows inflate every real date. A
      group header's ETA is the position-derived ETA of the LAST unparked row in
      that group — when the group finishes — computed on that same basis, so a
      header can never date earlier than the rows beneath it. WITHDRAWN: the
      parent's original 'strategy row ETA = open-child count / velocity' basis,
      which ignored that other strategies' work interleaves and produced headers
      dating months before their own rows. Accepted cost, named: tier 2 and 3
      groups are usually small, so the table opens with several near-empty
      sections. Implementation tracked at
      tactic-rsi-plan-merged-priority-table."
  - question: Does the rsi task plan merge into the same table?
    answer: "(Recorded 2026-08-11 interview.) No — it stays its own section, and the
      merge covers only the three sections the author named. The reason it does
      not fold cleanly is a fact about the record, not a preference: the
      parent's contents clarification gives the task plan a type column whose
      values include 'pause queue', which is not a graph tactic at all. Such
      rows have no parent strategy, no phase, and no ETA, so they would be
      structurally empty inside a table whose entire shape is per-tactic; and
      the task plan's reasoning column is meaningless for dispatch rows. Folding
      it in later stays cheap if the author wants it — the merged table's group
      structure does not depend on excluding it."
  - question: Why is the success signal a proxy, and what is it a proxy for?
    answer: "(Recorded 2026-08-11 interview.) The strategy's real end is that the
      author can read status and decide from this surface, and readability has
      no sensor — every mechanically readable observable is a proxy for it.
      Render fidelity was chosen because it is the property whose failure makes
      the surface untrustworthy: if the committed rsi-plan.md differs from a
      fresh render, the document is either hand-edited or stale, and in both
      cases it has stopped being derived from the record — which is the
      strategy's actual claim. The alternative considered and declined was
      decision coverage (what fraction of author priority decisions were made
      from the .md without opening the graph): it measures the thing that
      matters, but has no sensor that is not self-reported, and a signal that
      cannot be read is the failure mode /align's step 2.6 exists to push back
      on. is_proxy is set true so no later round mistakes fidelity for
      readability."
  - question: Why is the success signal the count of underivable sections rather
      than render fidelity?
    answer: "(AMENDED 2026-08-11 after adversarial review; supersedes the signal
      this node was created with.) The original signal was 'zero divergence
      between the committed rsi-plan.md and a fresh render of it'. It failed
      twice over. First, it is invariant under every tactic this strategy owns:
      render fidelity does not move when a pause block, an ETA column, or a
      merged table is added — so under this round's OWN stay-vs-move principle
      none of the three tactics would have qualified to sit here, which is the
      signature of a ranking artifact wearing a goal's clothes. Second, it is
      unreachable by construction: render-rsi-plan.ts stamps the render date
      (defaulting to today, UTC) and live queue state into its output, so a file
      committed yesterday diverges from today's render with no hand-edit
      anywhere, and `--check` reports STALE today for exactly that reason. The
      replacement measures the property this strategy actually claims — that
      nothing in the document is hand-maintained — using the FLAG stream the
      renderer already writes to stderr and /rsi already consumes. It IS moved
      by each of the three tactics: the pause block, the merged table, and the
      section-6 typing each convert a hand-reasoned section into a derived one.
      Render fidelity is not discarded; it survives as a CI check on condition 1
      (render-rsi-plan.ts remains the sole writer of rsi-plan.md), which is what
      it was always really measuring."
  - question: Why does this child declare no serves of its own?
    answer: "(Recorded 2026-08-11 after adversarial review.) It was created serving
      virtue-alignment-of-attachments, a subset of the parent's set.
      kind-strategy's 'Does a sub-strategy re-declare its parent's serves?'
      clarification answers no: sub-strategies inherit, the parent edge already
      carries the parent's claims down (resolveAttention flows rank down parent
      and serves alike), and a child authors serves only for a virtue claim
      BEYOND its parent's. This child makes no such claim — a readable status
      surface is an alignment-of-attachments claim, which the parent already
      carries — so the edge added review surface and no rank information, and it
      is the duplicate pattern tactic-graph-self-consistency-sweep Unit 4
      already stripped once. Removed; inheritance through parent is deliberate,
      not an omission."
tooling_goals: []
success_signal:
  observable: sections of rsi-plan.md that are not derived from graph state —
    hand-maintained content, plus the renderer's own staleness FLAGs naming a
    section it cannot derive
  sensor: the FLAG stream render-rsi-plan.ts already writes to stderr (one `FLAG
    <kind> <subject> — <detail>` line per finding), counted per render
  threshold: zero underivable sections across consecutive rsi iterations — a
    nonzero count names exactly which section still depends on a human keeping
    it current, which is the claim this strategy makes and the only thing its
    tactics can move
  is_proxy: true
attention:
  boost: 2
  override: null
  rationale: "Author-directed 2026-08-11: the author's channel for ordering
    delegated work is a child strategy's boost, not a tactic boost (see the
    parent's direct-boost clarification). +2 over the parent's AUTHORED 6 gives
    this child an authored 8, and the authored term is what distributes to its
    tactics — first within the strategy-recursive-self-improvement subtree,
    ahead of the delegated-prioritization child's authored 7 and of tactics left
    directly on the parent at 6. Chosen relative to the parent, not on an
    absolute scale: the value means 'two bands above the parent', and re-reading
    it after any parent rerank is the point of keeping it relative. CORRECTED
    2026-08-11 after adversarial review: this node's own RESOLVED rank is 9, not
    8 — the signal term adds 1 on top of the authored 8 — and kind-kind defines
    a tactic's band as the resolved rank of its distributing strategy, so under
    that definition this strategy's tactics sit in band 9 carrying a residual of
    MINUS 1, because the signal and capture terms are computed per node and are
    not distributed downward. The durable claim recorded here is the authored
    value and its relation to the parent; every resolved figure is derived and
    must not be restated as if it were authored. The negative-residual case is
    recorded as an open decision on tactic-attention-namespaced-rank."
  tier: 1
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  conditions:
    - render-rsi-plan.ts remains the sole writer of rsi-plan.md, under the
      single-writer worktree claim and the direct-push-to-main exception the
      parent's render condition grants — a second writer would break the
      fidelity signal by construction
    - every section stays derivable from graph state; a section that cannot be
      derived is a defect against this strategy, never a hand-maintained
      exception
    - the content boundary with strategy-attention-surface holds as recorded —
      that node keeps the office-hours ritual, parked-node selection, and the
      signals queue; this one keeps the status and priority view
    - the parent's ownership boundary holds — the author owns strategy-level
      attention, so what this surface renders as priority order is the author's
      order, not the renderer's
---
# rsi-plan.md is the author's readable surface for harness status and what comes next — every section derived from graph state, nothing hand-maintained
