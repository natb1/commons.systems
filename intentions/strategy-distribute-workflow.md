---
id: strategy-distribute-workflow
kind: strategy
statement: Make the dispatch workflow forkable in practice — a practitioner
  entry point, not just an open repo
owner: human
status: refining
parent: strategy-promote-progressive-detachment
rationale: >-
  Two nodes agree the workflow is the most distinctive artifact for practitioner
  distribution (layered claim canonically on strategy-data-structure-first: the
  graph is the product, the harness its reference consumer and most distinctive
  artifact), and strategy-owned-orchestration's built-to-be-left claim is
  validated only by forks and derivatives — yet promote's children contain no
  strategy for anyone actually encountering or adopting the chain. This strategy
  owns that: a standalone practitioner-facing entry point (the chain as a thing
  forkable without adopting the whole repo), architecture writeups on the owned
  blog, and strategy-open-source-as-gift's shallow-fork documentation obligation
  applied here specifically. It is the prerequisite for the tier-3 signals half
  the graph's thresholds wait on.

  Paced by strategy-progressive-validation. The tier-1 half of dual-tier work —
  the harness as the author's daily tool, and the graph/router design itself —
  continues ungated. But the practitioner-facing invitation surface
  (plugin/marketplace/npm publication, citation-list submissions, support
  commitments, channel campaigns) is gated on an explicit tier-3 entry
  declaration recorded on strategy-progressive-validation. As of 2026-07-06 that
  declaration has not been made: the design is still in flux and the author has
  not committed practitioner-support bandwidth.
reading: null
gap: null
serves:
  - virtue-progressive-detachment
  - virtue-respect-for-persons
recovers: []
clarifications:
  - question: Does the earlier reading that this work is not premature still stand?
    answer: "Partially reversed 2026-07-06. Issue #2452's re-scope read this
      strategy as rejecting a blanket pacing block. The author has now recorded
      a finer line: artifact work stays ungated (the harness is tier-1 dual-use,
      and its design being in flux is itself a reason to keep building), while
      everything that invites practitioners in or promises them support is gated
      on the tier-3 entry declaration on strategy-progressive-validation —
      because publication of the intention graph and dispatch harness for
      external practitioner consumption is a decision the author has explicitly
      not yet made. Recorded 2026-07-06 interview."
  - question: Is tactic-workflow-entry-point gated by the tier-3 declaration?
    answer: Split. Its architecture-writeup half — publishing how the workflow is
      built, on the owned blog — is ungated voice under
      strategy-exercise-voice/strategy-recover-publishing and can ship any time.
      Its standing-practitioner-entry-point half is an invitation and waits for
      the tier-3 declaration, with the support boundary
      (tactic-practitioner-support-boundary) written first. Recorded 2026-07-06
      interview.
  - question: Where did the pre-graph practitioner issues land when they were migrated?
    answer: "gh #440 (plugin packaging) -> tactic-practitioner-plugin-distribution;
      #442 + #512 (shallow-fork docs and package extraction) ->
      tactic-shallow-fork-docs; #2068 (citation-graph inbound links) ->
      tactic-citation-graph-listing; #2452 (support boundary) ->
      tactic-practitioner-support-boundary; #538's practitioner-channel half ->
      tactic-practitioner-channels (its POSSE/webmention runbook half already
      lives ungated in tactic-indieweb-audience under strategy-own-audience);
      #475 was already migrated as tactic-blog-enshittification-response; #515
      migrated ungated to tactic-nix-clean-system-drill under
      strategy-exercise-recovery-paths. All are draft tactics (no phase):
      structurally unselectable by the router until the author declares
      readiness and runs /align-tactics. Recorded 2026-07-06 interview."
  - question: What keeps the CI node toolchain and the nix dev shell from drifting apart?
    answer: "Today, nothing — .node-version pins 22.22.3 for CI (chosen to dodge the
      undici regression that broke Firebase OAuth on 22.23.0) while the nix dev
      shell floats nodejs_22 on nixos-unstable, and the drift has already
      produced a real cost: the Playwright browser-version mismatch that blocks
      local acceptance runs and forces CI to be the only authority. The
      requirement recorded here: one source of truth for the node toolchain —
      the dev shell derives from (or asserts equality with) .node-version so CI
      and local verification cannot silently diverge; a forkable-in-practice
      workflow includes a dev environment that reproduces what CI runs. Fix
      drafted at tactic-node-toolchain-single-source. Recorded 2026-07-07
      interview."
  - question: How did the first /align-tactics round dispose of the migrated
      practitioner drafts, given tier 3 is undeclared?
    answer: "The 2026-07-11 round decomposed only the ungated minimum. Instrument
      (reading is null): tactic-fork-derivative-sensor extends the office-hours
      snapshot's GitHub signals with fork enumeration and renders a
      fork-and-derivative panel, making this strategy's sensor runnable — it is
      the round's validates-terminal. Tier-entry-test prerequisites:
      tactic-practitioner-support-boundary is planned (phase: implement) behind
      a born-parked copy-approval gate tactic-support-boundary-approval, and
      tactic-practitioner-channels is born-parked as author judgment. Ungated
      artifact work: tactic-node-toolchain-single-source is planned.
      tactic-workflow-entry-point is split per the 2026-07-06 clarification: its
      architecture-writeup half is minted born-parked as
      tactic-workflow-architecture-writeup (blog voice is the author's;
      frame/outline first), and the node itself is rewritten to the
      entry-point-only half, still a draft. The tier-3 declaration is now a
      first-class born-parked gate, tactic-tier3-entry-declaration (serving
      strategy-progressive-validation, where the declaration is recorded),
      blocked_by the two prerequisites. The four invitation-gated drafts —
      tactic-practitioner-plugin-distribution, tactic-citation-graph-listing,
      tactic-shallow-fork-docs, and the rewritten tactic-workflow-entry-point —
      deliberately remain drafts per this strategy's recorded disposition (the
      migration clarification above), now carrying explicit blocked_by edges to
      the gate, rather than being finalized against a design still in flux.
      Recorded 2026-07-11 /align-tactics round."
tooling_goals: []
success_signal:
  observable: practitioners encountering and forking the workflow — entry-point
    visits, forks, derivative projects, fork reports
  sensor: fork and derivative review at office-hours
  threshold: the workflow has a standing practitioner entry point and at least one
    external fork or derivative exists
  is_proxy: false
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds:
  count: 0
  last_completed: null
attributes:
  conditions:
    - a practitioner audience for autonomy tooling exists and is reachable
      without engagement platforms
    - tier-3 (practitioner) entry is declared on strategy-progressive-validation
      before any invitation or obligation ships — publication channels, external
      submissions, support commitments; preparation and artifact work are not
      gated
---
# Make the dispatch workflow forkable in practice — a practitioner entry point, not just an open repo
