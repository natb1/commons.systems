---
id: tactic-explicit-ref-graph-reads
kind: tactic
statement: graph reads resolve their tree from cwd or from script location
  rather than from an explicit ref, so a stale checkout or the wrong script copy
  silently produces a wrong answer -- make the tree/ref a required argument on
  every read
owner: ai
status: raw
parent: null
rationale: "Surfaced and ruled ADOPTED in the 2026-08-05 /align interview (R3).
  Greenfield: check-node-selection.ts reads origin/main rather than the main
  checkout's working tree; validate-graph.ts requires its intentions dir rather
  than defaulting cwd-relative; transition-node, write-node.ts and clear-park
  stop resolving their repo root from script location. Evidence: a correct
  selection rejected as 'stale-selection: not-parked' because the checkout was
  one commit behind; validate-graph printing 'ok -- N nodes' against the wrong
  tree unless the dir is passed explicitly; and a measured case that drove a
  fleet-latch counter to 156. The recording session itself then tripped it while
  landing the very clarification adopting this fix -- it ran write-node.ts from
  the primary checkout, so the script resolved its root from that copy and wrote
  the amended strategy into the shared main checkout, producing the dirty
  tracked file this strategy calls a fleet-stalling defect (caught and reverted
  immediately). Retires the freshly-fetched-state and fast-forward-the-checkout
  invariants and the whole script-location-traps class. Scope is broad and was
  NOT enumerated at interview time."
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
office_hours:
  reason: "Scope partition unrecorded across three co-extensive raw siblings. The
    2026-08-14 /align-tactics tactic-mode drift review could not author this
    plan because three open nodes serving strategy-graph-native-dispatch claim
    overlapping files with no recorded partition between them: this node (R3 /
    strategy clarification 194 — validate-graph.ts, write-node.ts, dump-node.ts,
    clear-park), tactic-demote-node-stale-local-read (whose own statement claims
    the same general contract — make graph-script repo-root resolution uniform
    and explicit — over demote-node-to-implement, dump-node.ts,
    validate-graph.ts and graph-commit), and tactic-graph-read-at-ref-cli (the
    storeAtRef-CLI half of the same read path). Clarification 213 rules the
    adjacency for tactic-graph-execute-fresh-main-read (an instance with a
    cross-reference) and clarification 237 for tactic-graph-ref-split, but rules
    on neither of these two — and R3 itself records that its scope was NOT
    enumerated at interview time. Planning this node independently mints
    duplicate work on the same files and lets two dispatched nodes edit them
    concurrently. Verified in the tree 2026-08-14: validate-graph.ts:73,
    write-node.ts:18-22, dump-node.ts:35-40 and clear-park:99-100 are all still
    unconverted, so no sibling has already discharged the work."
  since: 2026-08-15
  recommendation: "Rule which node owns which files, then re-run /align-tactics
    tactic-explicit-ref-graph-reads. Candidate shapes: (a) this node owns the
    required-explicit-argument contract plus validate-graph.ts / write-node.ts /
    dump-node.ts / clear-park, and tactic-demote-node-stale-local-read narrows
    to demote-node-to-implement own three defects (script-location REPO_ROOT,
    missing origin/main fetch, missing --base CAS) plus the
    library-invoked-executable test-harness contract, with a cross-reference
    each way; (b) tactic-demote-node-stale-local-read absorbs the whole
    root-resolution class under its own Ruling 27 (root-resolution defects widen
    this node rather than minting siblings) and this node is pruned as a
    duplicate; (c) the reverse. tactic-graph-read-at-ref-cli adds a NEW CLI
    rather than editing these readers, so it is separable under any shape, but
    should be recorded as such rather than left implicit. Fixed regardless of
    the choice: transition-node stays out of scope (claimed by
    tactic-graph-ref-split, phase implement) and graph-commit stays out of scope
    (its -C/cwd resolution is already the ratified correct shape, clarification
    86). NOTE: the authored plan in plans/pr1-graph-write-path-brief.md (PR1
    Unit 8) proceeds under shape (a) as a hand-authored unit; that brief is the
    de-facto ruling and this park exists to have it recorded as a clarification
    rather than living only in a plans/ file. Clear this park before closing the
    node. Verified this round: Two executable call sites of validate-graph.ts
    exist: .github/workflows/graph-fast-path.yml:32 already passes intentions
    explicitly and would NOT break if the argument became required;
    .claude/skills/align/scripts/validate-deployment.sh:53 invokes it bare and
    MUST be updated in the same PR. Roughly ninety further hits are
    documentation prose. Already CONVERTED to explicit-ref:
    check-node-selection.ts:14-15 (required --dir) and compute-freshness.ts
    (explicit --snapshot/--stamp, with transition-node:161,182,186 as the
    acquiring wrapper)."
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# graph reads resolve their tree from cwd or from script location rather than from an explicit ref, so a stale checkout or the wrong script copy silently produces a wrong answer -- make the tree/ref a required argument on every read
