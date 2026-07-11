---
id: strategy-owned-orchestration
kind: strategy
statement: Owned orchestration, not a platform runtime
owner: human
status: codified
parent: null
rationale: >-
  The orchestration layer — the agentic workflow itself — is owned and
  self-managed, run locally rather than rented. The coding agent is a
  construction tool, not a runtime dependency; owning the workflow extends that
  property to the layer above it: the workflow code is forkable and locally run,
  not rented from a platform vendor.


  This is the pivotal swap of the present conditions: replace delegations to
  entities with misaligned virtues (platform software services) with a single
  delegation whose alignment I can actually manage — see
  delegation-anthropic-claude. It inverts the platform's success metric: a
  platform measures success by retention on it; here success is the
  practitioner's eventual independence from the workflow. The orchestration
  layer is built to be left. That claim is validated only by tier signals —
  forks, derivative projects — never by revenue and never by assertion.


  Dual-tier: the workflow is both the author's daily development tool (recover)
  and the most distinctive artifact for practitioner distribution (promote) —
  the layered claim's canonical home is strategy-data-structure-first: the graph
  is the product, the harness its reference consumer. Deprioritizing its
  usability as "polish" misses that it also serves distribution.
reading: null
gap: null
serves:
  - virtue-progressive-detachment
  - virtue-alignment-of-attachments
recovers: []
clarifications:
  - question: How are the project's own working conventions enforced?
    answer: "Three deliberate tiers, each rule declaring its tier: advisory
      (session-loaded rules text, e.g. .claude/rules/planning.md, explicitly not
      hook-enforced), hook-enforced (the approval boundary, park/strip
      lifecycle), and CI-lint ratchet on net-new lines only (shell-json via
      lint-prose-rules.sh with inline lint-allow escapes, no retroactive
      rewrites). Encoding agent-behavior rules as CI sensors — test-deletion,
      unbounded-query, prose lint, type-safety escapes, each with its own test
      suite — is the preferred enforcement layer for an autonomously-dispatched
      repo. Recorded 2026-07-07 interview."
  - question: Where does the per-unit model-selection heuristic live?
    answer: "One canonical home: .claude/skills/implement-unit/SKILL.md; every other
      skill and the interactive-planning rule reference it rather than restate
      it. Its when-unsure-pick-opus bias sits in acknowledged tension with
      strategy-token-economy's throughput-per-allowance framing — that tension
      is adjudicated through the token-economy per-phase routing policy, not by
      editing the heuristic ad hoc. Recorded 2026-07-07 interview."
  - question: Where does private operator config live?
    answer: The intended home is a dedicated version-controlled instance-config repo
      following the nix instance-flake conventions (natb1/office-hours-nate;
      examples/office-hours-nate is the in-repo template). The git-untracked
      dispatch.config/ directory — pace curve, auto-merge gate, machine-written
      phase-model policy, with committed *.example.json templates — is
      transitional operator state pending that migration, drafted at
      tactic-dispatch-config-instance-repo. Recorded 2026-07-07 interview.
  - question: Why do wrapper scripts exist where a plain command would do?
    answer: "Part of the script API is shaped by the harness's allowedTools prefix
      matcher, not domain logic: env vars are set inside wrappers instead of
      inline VAR=x prefixes, directory context uses --prefix/--root/git -C
      instead of cd &&, and CI polling uses gh run watch instead of sleep loops.
      Recorded so the wrappers are not mistaken for domain logic if the
      harness's matcher improves. Recorded 2026-07-07 code review."
  - question: Where do dispatch.config/'s files land in the instance-repo migration?
    answer: "Decided at decomposition: human-edited fleet-behavior config
      (target-workers.json, auto-merge.json, epic.json, and any
      operator-authored optional configs from the dispatch-config-load set)
      migrates into natb1/office-hours-nate's dispatch.config/ under version
      control, so pace-curve pins and auto-merge gating get reviewable history;
      machine-written control artifacts (phase-model-policy.json from the token
      audit, *.bak.* backups) stay in the same directory but gitignored there —
      regenerable, delete-to-revert, no auto-commit machinery; the monorepo
      locates the copies via a host symlink of <project-root>/dispatch.config to
      the instance checkout, so dispatch-config-load and its DISPATCH_CONFIG_DIR
      test seam are unchanged. Recorded 2026-07-11 /align-tactics round."
tooling_goals: []
success_signal:
  observable: forks, derivative projects, practitioners adapting the workflow
    independently — never revenue, never assertion
  sensor: fork and derivative review at office-hours
  threshold: the built-to-be-left claim is asserted only while such signals exist
    at the pursued tier
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
    - frontier coding agents remain accessible and economical at individual scale
    - open-weight models and local inference remain a viable recovery substrate
      (the base case of the recovery recursion)
    - agentic construction remains the highest-impact path to recovering
      software autonomy
---
# Owned orchestration, not a platform runtime
