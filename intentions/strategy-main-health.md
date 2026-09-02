---
id: strategy-main-health
kind: strategy
statement: "origin/main stays green: a continuously releasable trunk, red
  episodes self-healing through the sensor flow"
owner: human
status: refining
parent: strategy-autonomous-execution
rationale: "Red main halts the autonomous dispatch chain — no new work is safe
  to start — and breaks the trunk's releasability, so main health outranks all
  other work while failing. Created 2026-07-13 as the persistent owner of the
  main-health signal per strategy-graph-native-dispatch's self-heal encoding:
  standing structure lives on strategy nodes, never transient tactics (same-date
  persistent-layer doctrine). Auto-created red-main fix tactics serve and
  validate this node and inherit its standing boost through the normal downward
  attention flow; the boost's dominance is maintained by a write-path guard
  (author override required to out-boost or reduce it), never by recompute.
  2026-07-31: the standing boost 100 is migrated to attributes.tier: 3 under the
  tier model — red-main fix tactics now inherit tier 3 through the same downward
  parent/serves flow, and dominance is structural (this node is simply in the
  top tier) rather than numeric (highest boost). The write-path guard
  (validate-graph rule 18) is retargeted accordingly: no other node may author
  an explicit attributes.tier: 3 — an author may override that half by placing
  the ACK token in the authoring node's rationale or its attention.rationale —
  and this node must keep tier 3, an override that requires the ACK token in
  THIS node's own attention.rationale (its rationale, the field you are reading,
  narrates the guard, so prose here must not exempt the node from it). Earlier
  clarifications on this node narrate 'boost 100'; they are dated historical
  records, superseded in effect by this note, not rewritten."
reading: "green: every check on the current origin/main HEAD concludes success
  (or neutral/skipped)"
serves: []
recovers: []
clarifications:
  - question: How does resolution work attach to this strategy when the signal fails?
    answer: "The graph tick's main-health sensor read failing find-or-creates one
      fix tactic per red episode (tactic-main-red-<shortsha> shape, redacted
      diagnosis in the body) with serves and validates edges to
      strategy-main-health — inheriting this node's boost 100 undecayed — its
      own success_signal {sensor: main-health, threshold: green} so
      threshold-met completes it, and pace_exempt: true. Full encoding:
      strategy-graph-native-dispatch's 2026-07-13 clarifications; mechanics
      retained in draft tactic-graph-main-self-heal. Recorded 2026-07-13
      interview."
  - question: Does the standing boost 100 make the router's strategy lane repeatedly
      select this strategy for /align-tactics decomposition?
    answer: "Known edge, accepted at creation: this strategy needs no interactive
      decomposition — its tactics are auto-created by the sensor flow — so the
      strategy lane must not treat its rank as a decomposition request. The
      guard detail lands with the self-heal implementation (draft
      tactic-graph-main-self-heal); until then any align skip the selector emits
      for it is expected and benign. Recorded 2026-07-13 interview."
  - question: What does the main-health signal actually observe — does a green
      reading mean main's own merge-gating suite passed?
    answer: >-
      (Recorded 2026-07-23 interview, surfaced by the wezterm-pin round.) No —
      and is_proxy is corrected from false to true on this date. Verified
      against origin/main: .github/workflows/unit-tests.yml carries fifteen jobs
      (unit-tests, rules-test, lint, dead-code, storybook-smoke, typecheck,
      hook-tests, test-integrity, playwright-version-sync, type-safety-sensor,
      firestore-query-bounds-sensor, go-tests, darwin-build, nixos-build,
      firebase-audit) under `on: push: branches-ignore: [main, 'graph/**']`.
      NONE of them ever runs on main. The only workflows that can fire on a push
      to main are the four paths-gated deploys (prod-deploy, firestore-deploy,
      functions-deploy, storage-deploy), and prod-deploy additionally
      paths-ignores nix/**, *.nix, flake.lock, .claude/** and intentions/** — so
      a nix-only or graph-only commit to main triggers no workflow at all.


      The trunk's merge-gating suite is validated PRE-merge on the branch push,
      never post-merge on main. That is a coherent design (trunk = the merge of
      validated branches), but it has a specific consequence this node must
      state: the observable reads a strict — sometimes empty — subset of the
      checks that actually gate a merge, and it is blind by construction to any
      breakage whose cause lies OUTSIDE the repo, because such breakage arrives
      with no commit to trigger a branch build.


      The wezterm pin is the worked example: upstream repackaged a pinned asset,
      nixos-build went red on every nix-touching branch, and main's reading
      stayed green throughout — the breakage stayed invisible until an unrelated
      nix-touching PR happened to absorb it. Whether main should get its own
      post-merge or time-triggered validation is retained at
      tactic-main-post-merge-validation; it is a real cost question (a nix build
      runs roughly 22 minutes) and is not decided by this clarification.
  - question: Can this signal distinguish "every check passed" from "no check ran",
      and whose checks is it actually reading?
    answer: >-
      (Recorded 2026-07-23 interview.) Not today — two defects, both verified
      live, pulling in opposite directions.


      First, it fails OPEN on an empty set. repo-health's main_broken_sha()
      counts check-runs and workflow-runs whose conclusion falls in the failure
      set and prints the sha only when that count exceeds zero, so zero checks
      yields zero failures, and readMainHealth() returns the threshold string
      verbatim (packages/intentionsutil/scripts/read-sensors.ts;
      .claude/skills/dispatch-propagate/scripts/repo-health). A vacuous green is
      mechanically indistinguishable from a real one.


      Second, the check-runs it does read are COINCIDENTAL rather than main's
      own. graph-commit pushes a scratch sha to a graph/** branch and
      fast-forwards that SAME sha onto main, so Graph Fast Path's check-runs
      attach to a sha main shares and are then read as main's health. Verified
      2026-07-23 14:30Z: origin/main HEAD 1edf47ee carried eighteen check-runs,
      ALL from three Graph Fast Path runs on unrelated graph/** branches, two of
      them `guard: failure` — so the sensor would have reported main RED for the
      benign "No changes relative to origin/main" race already diagnosed at
      tactic-graph-fastpath-guard-diff-base (PR 2898, phase qa), a defect in
      another branch's workflow rather than in main's content. Main advanced to
      e2136ff9 minutes later and read green again on eight inherited check-runs,
      none from the merge-gating suite.


      So the signal is simultaneously fail-open (blind to fifteen jobs) and
      falsely fail-closed (inherits unrelated branches' failures), which is why
      is_proxy is corrected to true. Fix drafted at
      tactic-main-health-signal-attribution. Note the coupling this creates:
      tactic-graph-fastpath-guard-diff-base is not only a graph-lane fix, it
      removes a live source of false main-red.
  - question: Why was the threshold string left byte-identical when is_proxy was
      corrected?
    answer: >-
      (Recorded 2026-07-23 interview.) Deliberate, and a constraint every future
      fix must respect. deriveGap
      (packages/intentionsutil/src/sensors.ts:98-112) treats a signal as met
      ONLY when the trimmed, case-insensitive reading equals the threshold
      exactly — there is no numeric or fuzzy parsing — and readMainHealth()
      returns the literal string "green: every check on the current origin/main
      HEAD concludes success (or neutral/skipped)", which is this node's
      threshold verbatim.


      Editing the threshold text alone would therefore make the sensor's green
      output stop matching it, leaving gap permanently non-null on a node
      carrying attention boost 100 — a standing false red pinned to the top of
      the attention order, which the write-path guard would then protect. So
      this round amended is_proxy (not compared) and observable (prose, not
      compared) and left threshold byte-identical.


      The threshold string and readMainHealth()'s return value are one coupled
      pair: they must change in the same commit, by the tactic that fixes the
      sensor. Recorded here because the coupling is invisible from either side
      alone — the strategy node looks like free prose, and the sensor looks like
      a private implementation detail.
tooling_goals: []
success_signal:
  observable: "origin/main HEAD check-run and workflow-run conclusions — a PROXY
    for trunk health, not a direct read of it: the sensor reads whichever checks
    happen to be attached to main's HEAD sha, which excludes the entire
    merge-gating suite in unit-tests.yml and may include check-runs produced by
    graph/** branch workflows that merely share the sha (see the 2026-07-23
    clarifications)"
  sensor: main-health
  threshold: "green: every check on the current origin/main HEAD concludes success
    (or neutral/skipped)"
  is_proxy: true
attention: null
phase: null
execution: null
validates: []
blocked_by: []
superseded_by: []
supersession_expiry: null
office_hours: null
pace_exempt: false
rounds:
  count: 0
  last_completed: null
  last_aligned: null
attributes:
  tier: 3
  criteria:
    - id: fn-firestore-query-bounds
      statement: Every Firestore getDocs() call site in the repo is bounded by a
        limit() clause -- on the query itself or the nearest backward-resolved
        query assignment -- or carries a same-line/same-query-span
        query-bounds-ok marker with a non-empty reason
      class: functional
      authority: deferred
      recorded: 2026-09-01
    - id: fn-playwright-version-sync
      statement: When PLAYWRIGHT_BROWSERS_PATH is set and
        node_modules/playwright-core/browsers.json exists, the chromium revision
        the nix-provided playwright-driver ships matches the revision
        @playwright/test expects -- no silent drift between the two
      class: functional
      authority: deferred
      recorded: 2026-09-01
---
# origin/main stays green: a continuously releasable trunk, red episodes self-healing through the sensor flow

The persistent owner of the `main-health` signal. Full self-heal encoding:
`strategy-graph-native-dispatch`'s 2026-07-13 clarifications; mechanics in
draft `tactic-graph-main-self-heal`; boost-dominance guard recorded as a
condition on `strategy-graph-native-dispatch`; blocking-orthogonality
model on `strategy-graph-drives-dispatch`.
