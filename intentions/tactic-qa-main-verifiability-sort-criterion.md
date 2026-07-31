---
id: tactic-qa-main-verifiability-sort-criterion
kind: tactic
statement: qa-main's cannot-verify branch sorts needs-main residue on whether an
  item is reachable by Claude-in-Chrome rather than on whether it is
  machine-verifiable at all, so every git, journal, log or shell check that the
  browser tool cannot perform is parked to office_hours as cannot-verify —
  waking the author for items no author is needed for, and producing exactly the
  mis-sort the graph's own greenfield design calls a mis-sort by construction
owner: ai
status: raw
parent: null
rationale: "The bootstrap plan recorded this as an open seam with no owning
  node; this node is that owner. On 2026-07-31 four office_hours parks were
  opened by /qa-main on four different nodes, and all four gave the same reason
  — 'not browser-verifiable', typically adding that url_path is the placeholder
  'current' rather than a real route. All four were then machine-verified in a
  single session with journalctl, ls, jq, git show and grep, no browser and no
  author input. Results: tactic-frozen-session-debug-count item 10 PASS on eight
  consecutive dispatch-sweep log lines;
  tactic-router-spawn-window-duplicate-worker items 9 and 10 PASS, item 10 on
  direct live-ledger observation during a real spawn window;
  tactic-standdown-winner-liveness item 1 PASS on 21 post-merge tick sweeps.
  Only two of the seven items across those four nodes were genuinely
  author-required — a defaults ruling and a contract-surface ruling — and both
  were answered by the author in minutes once separated from the research the
  machine could do. So the sort produced roughly five false parks out of seven
  items. The graph's greenfield design is explicit that this is the wrong
  predicate: strategy-graph-native-dispatch.md:2224-2227 says only a
  VERIFIABILITY cannot-verify — the item cannot be machine-checked AT ALL —
  becomes an office_hours park; :2221 says parking a machine-checkable item
  wakes the author for something no author is needed for; :2195-2200 says a
  cannot-verify park on a machine-sorted node IS a mis-sort by construction; and
  :3182-3188 says the sort is an explicitly recorded state on the verification
  node, never inferred. The browser predicate is the INTERIM implementation,
  single-sourced in dispatch-main-qa-triage and qa-main/SKILL.md:297, and the
  greenfield clarification at :2192-2194 says the sorting predicate is
  'unchanged' while that predicate is still written in browser terms in
  qa-fix/references/needs-main-followups.md:65-72 — which is the seam. At least
  four further sibling nodes carry the same misroute:
  tactic-drain-disposition-diagnosis-cas, tactic-mechanical-park-producers,
  tactic-main-post-merge-validation and tactic-execution-pr-merge-verification.
  Direction for planning, not a plan: sort on machine-verifiable vs
  author-required, and give the lane a third outcome besides pass and park — a
  not-yet-observed WAIT that holds the node for re-selection instead of waking a
  human, since several of these items are valid checks whose event simply has
  not happened yet. That WAIT case is the resolution pattern at :2212-2229 (a
  mechanical retry hold via blocked_by against a tracked wait), not an
  office_hours park. A park reason that cites browser-reachability should be
  rejected by the lane rather than written. Interim attention scaffolding only —
  tactic-attention-tier-ranking replaces the numeric scheme with lexicographic
  (tier, rank) and max-lifting, and tactic-attention-boost-scripts converts
  these boosts to tier/bug_fix marks."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 50
  override: null
  rationale: "Bootstrap re-scale 2026-07-31: Wave A of the three-band interim
    scale (50 / 20 / 10) that puts write-path and pipeline-integrity work above
    ordinary feature work. Belongs in this band on the band's own criterion — it
    is the root cause of a park class that has already stalled at least eight
    nodes in main-qa, each park costing an author interrupt for work a machine
    can do, and the strategy tracks mis-sort rate as a measured threshold.
    blocked_by is empty, so this promotion lifts no blocker and cannot compound.
    status stays raw and phase stays null so the selector emits it as an
    /align-tactics candidate for planning, not as an implement candidate."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes: {}
---

# tactic-qa-main-verifiability-sort-criterion

## Evidence — four parks, four wrong reasons, 2026-07-31

Every park below was opened by `/qa-main` on the same stated ground, and every
one was resolved without a browser.

| node | park reason (operative claim) | what the check actually was | outcome |
|---|---|---|---|
| `tactic-frozen-session-debug-count` | "not browser-verifiable ... url_path 'current'" | grep one log file + one daemon query | **PASS** |
| `tactic-router-spawn-window-duplicate-worker` | "url_path is 'current' ... requires observing accumulated production behavior" | journal self-join + `ls` the reservation ledger | **PASS** (both items) |
| `tactic-standdown-winner-liveness` | "neither has a real url_path ... live dispatch-fleet infrastructure state" | count sweep lines in the journal | **PASS** (item 1); item 2 genuinely author-required |
| `tactic-prune-conflict-recovery-silent-loss` | "url_path is the placeholder 'current' ... asks a human to confirm a design tradeoff" | genuinely a design ruling — but its three research steps were all machine-answerable | park destination right, **reason wrong** |

Seven residue items across four nodes. Five were machine-verifiable and were
parked anyway. Two were genuine author rulings, and both were answered in minutes
once the machine-answerable research was separated out and presented with them.

The last row is the instructive one: the park landed in the right bucket **by
accident**. Its reason — placeholder `url_path`, non-prod-observable outcome —
would equally mis-sort a fully machine-checkable item. So the reason text is not
usable as precedent even where the destination happens to be correct.

## The seam

The greenfield criterion and the interim implementation disagree, and the
clarification that was supposed to reconcile them asserts they do not:

- `strategy-graph-native-dispatch.md:2224-2227` — only a VERIFIABILITY
  cannot-verify (the item cannot be machine-checked at all) becomes a park.
- `:2221` — parking a machine-checkable item wakes the author for something no
  author is needed for.
- `:2195-2200` — a cannot-verify park on a machine-sorted node **is** a mis-sort
  by construction.
- `:2192-2194` — the sorting predicate is "unchanged" by the greenfield move.

But that predicate is still written in browser terms, in
`qa-fix/references/needs-main-followups.md:65-72`, and implemented in browser
terms in `dispatch-main-qa-triage` and `qa-main/SKILL.md:297`. "Unchanged" is
therefore load-bearing in the wrong direction: it preserves the interim browser
predicate as if it were the greenfield one.

## Scope sketch — direction only, not a plan

- Sort on **machine-verifiable vs. author-required**. A check the browser tool
  cannot perform is still machine-verifiable and must not park.
- Add a third outcome. Today the lane has pass and park; several of these items
  are valid checks whose event has not occurred yet (`tactic-standdown-winner-liveness`
  item 1c, and the observe-in-production signal on
  `tactic-prune-conflict-recovery-silent-loss`). Those need a **WAIT** that holds
  the node for re-selection — the mechanical retry hold at `:2212-2229` — not an
  author interrupt.
- Reject a park reason that cites browser-reachability, at the point of writing.
- When an item genuinely is author-required, do the machine-answerable research
  first and attach it, so the author gets a yes/no rather than an assignment.

## Verification

- Replay the seven residue items above through the corrected sort: five must
  route to pass or wait, two to author-required.
- The four sibling nodes named in the rationale must re-sort the same way.
- A park reason containing "browser-verifiable" must fail the lane's own checks.
