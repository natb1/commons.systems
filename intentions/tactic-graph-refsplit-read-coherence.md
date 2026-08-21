---
id: tactic-graph-refsplit-read-coherence
kind: tactic
statement: tactic-graph-ref-split refreshes the shared GRAPH_WT only at
  worktree-provisioning time — add a post-land coherence step so a session that
  lands a node can read its own write back
owner: ai
status: raw
parent: null
rationale: "Surfaced by the 2026-08-14 /align round recording the read-coherence
  invariant (strategy clarification 237). Verified by reading all 1040 lines of
  tactic-graph-ref-split: Unit 3 refreshes GRAPH_WT with fetch + reset --hard at
  four provisioning/hook call sites, all pre-session, and no unit refreshes it
  after a land. The 2026-08-14 ledger regression
  (tactic-eval-finding-list-reads-working-tree-stale-after-plumbing-land) is
  exactly this failure on today's mechanism, so it survives the cutover unless
  ref-split gains this step. A gap in a sound plan, not grounds to reject the
  symlink design."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Is serving-strategy clarification 242's list of still-unconverted
      explicit-ref readers current?
    answer: "(Recorded 2026-08-21 /align-tactics tactic-mode drift review; verified
      at origin/main 9a9312d4.) No — it is superseded by landed work. All four
      files clarification 242 named as 'still unconverted as of this sitting'
      (2026-08-15) — validate-graph.ts, write-node.ts, dump-node.ts and
      clear-park — now take the store/repo as a REQUIRED explicit argument with
      no default; dump-node.ts's own header states '--dir <intentions-dir> is
      REQUIRED and has no default' and explains in the past tense that it used
      to resolve from import.meta.url. Landed by fe0b1c4d, 'pr1: graph
      write-path integrity (#3095)'. This is recorded on this node, not on the
      serving strategy: a tactic-target session never writes the serving
      strategy's frontmatter, so promoting it into the strategy's own record is
      a human's job at office hours."
  - question: Does serving-strategy clarification 237's code anchor for the
      write-independence guard still resolve?
    answer: (Recorded 2026-08-21 /align-tactics tactic-mode drift review; verified
      in-tree and re-verified on the caller thread.) The line citation has
      drifted; the mechanism has not. Clarification 237 cites graph-commit:3502
      for assert_clean_outside_ids being gated on the writer mode. In the
      current file (4012 lines) the function is DEFINED at
      packages/intentionsutil/scripts/graph-commit:3591 and has exactly ONE call
      site, :3794, under the `[[ "$GRAPH_COMMIT_WRITER" == "worktree" ]]` guard;
      GRAPH_COMMIT_WRITER still defaults to `worktree` at :418, and the sole
      opt-in plumbing caller is
      .claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:814. The
      MECHANISM the clarification describes is accurate and unchanged — the
      guard is already conditional on the writer mode and goes inert once the
      default flips — only the anchor is stale. Any plan re-deriving that
      argument must read the current file rather than trusting the cited line.
  - question: Has tactic-graph-ref-split made progress toward the cutover since
      clarification 237 was recorded, and what does that imply for this node's
      urgency?
    answer: "(Recorded 2026-08-21 /align-tactics tactic-mode drift review; measured
      at origin/main 9a9312d4 and re-verified on the caller thread.) No
      progress. The blocker census is unmoved since clarification 237 recorded
      it on 2026-08-14: 37 blockers, 23 still open, 14 done — resolved by
      looking up each blocker id's phase, not by grep. Combined with `execution:
      null` on that node and the absence of a `graph-main` branch on origin
      (`git ls-remote --heads origin graph-main` returns nothing), this
      establishes that no progress toward the ref-split cutover occurred in the
      intervening week, which is why the read-coherence gap this node names
      remains LATENT rather than live — it fires only post-cutover. It also
      leaves the open question tactic-graph-refsplit-blocker-audit (itself
      parked on the same maintenance-burden band) unanswered: whether those 23
      blockers encode real dependencies or a quiescence wish is still INFERENCE,
      not a settled finding."
  - question: Does serving-strategy clarification 218's structural finding about
      lib-store-at-ref.ts still hold, and does its consumer count reproduce?
    answer: "(Recorded 2026-08-21 /align-tactics tactic-mode drift review; verified
      in-tree.) The structural finding HOLDS: lib-store-at-ref.ts has no CLI
      entrypoint — it contains no `import.meta.url` main-block guard, only a
      comment explaining that repoRoot is a parameter rather than resolved from
      import.meta.url — so the doctrine that mandates reading at origin/main
      still has no scripted path, and every doctrine-compliant read is
      hand-written shell. Its consumer COUNT does not reproduce as written: the
      clarification says five script consumers; a same-tree grep finds three
      under packages/intentionsutil/scripts (office-hours-select.ts,
      read-sensors.ts, verify-landed) plus two test files, while this round's
      gather phase counted two. The count is unstable with the scope of the grep
      and should not be cited as a measurement; the load-bearing half of the
      finding is unaffected. Note the standing irony this round exercised: the
      band measurement backing this node's own park was taken through
      `listNodesAtRef` precisely because no CLI exists to do it."
  - question: Where did this round send its immaterial Side-B observations, and why
      not to the serving strategy or a carrier node?
    answer: "(Recorded 2026-08-21 /align-tactics tactic-mode drift review.) Here, on
      this target node. Doctrine and shipped skill prose currently disagree
      about the destination, and the disagreement cannot be repaired while the
      band is unruled:
      .claude/skills/align-tactics/references/write-path.md:305-308 still
      instructs the caller to 'land each result.drift.clarifications_to_add
      entry as a dated clarifications entry on the strategy' — the mechanism
      serving-strategy clarification 245 (violation V1) OVERTURNED on
      2026-08-14/15 — and its implementing carrier
      tactic-align-tactics-immaterial-drift-redirect is itself parked on this
      same maintenance-burden band, so the shipped instruction cannot be
      corrected until the band is ruled. This round therefore applied the ruling
      by hand: no strategy write was made, and these observations landed on this
      target instead. Per the 2026-08-21 escalation carve-out, no born-parked
      observation carrier was minted either — a carrier would score into the
      very backlog numerator this round's park is blocked on. Since this node is
      now itself in the office-hours queue, the observations reach the same
      sitting a carrier would have routed them to."
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: >-
    SIDE A — MAJOR SCOPE DEVIATION, with a folded material
    requirement-ambiguity. NO PLAN WAS AUTHORED. Both blockers need an author
    ruling, and a tactic-target session never writes the serving strategy, so
    both are recorded here on the target.


    (A) SIDE A — the serving strategy's ARMED maintenance-burden band condition
    measures FALSE on BOTH limbs, so this node's plan would be authored against
    a dead premise. MEASUREMENT at origin/main 9a9312d4 on 2026-08-21: backlog
    135 of 316 tactics serving this strategy = 42.72% against the
    author-declared 35% ceiling (open 84, born-parked 51, draft 84, done 97).
    Limb 2, non-increasing, also fails: the same code at this worktree's branch
    cut 787782c5 — five commits behind — measured 130/316 = 41.14%, so the ratio
    rose within a single day. The strategy's own recorded descent was 47.6% ->
    38.2% -> 31.4% -> 24.6%, and its stored `reading` still says 58/236 = 24.6%:
    stale by ~18 points and 80 tactics. Re-derive it; never reuse it.


    METHOD, and CALLER-THREAD RE-VERIFICATION. The drift agent measured by
    importing `listNodesAtRef`
    (packages/intentionsutil/scripts/lib-store-at-ref.ts:47) together with
    `strategyBacklogBand` and `classifyTactic`
    (packages/intentionsutil/src/census.ts:13-40) directly, rather than
    reimplementing their rules or shelling out to the census script. Before
    accepting the park, the caller thread re-ran that same canonical path
    independently against origin/main 9a9312d4 and reproduced every figure
    EXACTLY — 84 draft / 51 born-parked / 84 open / 97 done, band 135/316 =
    42.72% — and separately reproduced 130/316 = 41.14% at 787782c5. The park is
    therefore confirmed by the canonical census functions on two independent
    runs, not by one agent's arithmetic. No agent died in this round (5 of 5
    completed, 0 errors), so the Side-A evidence base is not degraded in the way
    the gather-agent-death failure mode produces.


    THE BREACH IS NOT AN ARTIFACT OF THE LANE'S OWN BOOKKEEPING. Removing every
    immaterial-observation carrier from BOTH numerator and denominator still
    leaves the band breached. Measured two ways, because the criterion matters:
    by the mechanical id-suffix criterion (`tactic-*-drift-observations`) there
    are 13 such carriers, and excluding them gives 122/303 = 40.26%; the drift
    agent, applying a semantic "pure observation carrier with no plan"
    criterion, counted 16 and reported 119/300 = 39.67%. The caller thread could
    not reproduce the semantic count mechanically — a reason-text regex
    over-matches, catching planned nodes that merely discuss carriers — so
    40.26% is the figure this park stands behind and 39.67% is recorded as the
    agent's. Both exceed 35% by a wide margin, so the load-bearing conclusion is
    identical under either criterion: the breach survives the complete removal
    of the bookkeeping that inflates it.


    THE COMPOUNDING LOOP. `classifyTactic` scores born-parked as backlog and
    draft as neither, so this park moves its own target — today classified
    `draft` — INTO the numerator the condition measures. Every Side-A park on
    this band does the same, and it turns fast enough to see inside a single
    session. No autonomous lane can exit it. Note the sharper form of this for
    the ruling: planning this node (phase -> implement) would raise the
    numerator by exactly the same 1 that parking it does, so the band cannot
    distinguish a park from a finalize — every disposition of a draft except
    pruning looks identical to it.


    THIS IS THE TENTH NODE PARKED ON THIS ONE CONDITION. Re-derived at 9a9312d4
    by reading each born-parked node's `office_hours.reason` rather than by
    grepping alone (a band-matching regex hits 16 nodes, but 7 of those are
    `-drift-observations` carriers that merely mention the band). The nine
    already parked, confirmed on the caller thread:
    tactic-supersession-retirement-sweep,
    tactic-graph-commit-park-content-durability,
    tactic-align-tactics-drift-dump-office-hours,
    tactic-align-tactics-immaterial-drift-redirect,
    tactic-align-tactics-migration-tightening-split,
    tactic-graph-refsplit-blocker-audit, tactic-align-tactics-premise-preflight,
    tactic-node-scope-files-overlap-gate, tactic-invalid-state-rc-f1c843b1.
    Concurrent rounds land parks minutes apart, so this count is stale before it
    lands — treat it as "as of 9a9312d4" and re-derive at the sitting.


    (B) FOLDED MATERIAL REQUIREMENT-AMBIGUITY (Side B, plan_depends: true on
    both premises). Even with (A) ruled, this node cannot be planned as written,
    for two reasons the graph does not record.


    (B1) MECHANISM. Clarification 237 records the READ COHERENCE invariant and
    reasons that "a materialized tree is a cache, and the defect is cache
    coherence, not the existence of a cache" — which reads as endorsing a
    post-land refresh of the shared tree. But the sibling that owns the SAME
    limb-2 violation on today's mechanism,
    tactic-eval-finding-list-reads-working-tree-stale-after-plumbing-land
    (verified at origin/main: status codified, phase implement, blocked_by [],
    plan already authored), was planned the OPPOSITE way — swap the working-tree
    read for `listNodesAtRef` — with `sync_main_checkout` explicitly REJECTED in
    its own clarifications because `--ff-only` refuses on any dirty tracked file
    anywhere in the checkout, precisely the outage the plumbing writer exists to
    avoid. Two sibling nodes, one invariant, opposite mechanisms, no recorded
    partition between them. This is the same defect shape clarification 242 had
    to resolve by author ruling for three co-extensive read-path nodes.


    (B2) DELIVERABLE CLASS. Verified at origin/main 9a9312d4 this round, and
    re-verified on the caller thread: `git ls-remote --heads origin graph-main`
    returns nothing — the branch does not exist; tactic-graph-ref-split is phase
    implement with `execution: null`, so not one unit has landed; and its
    blocker census is unmoved since clarification 237 was written — 37 blockers,
    23 still open, 14 done, resolved per-id rather than by grep. The gap this
    node names is therefore LATENT: it fires only post-cutover, and the cutover
    is unstarted behind 23 open blockers. Under one reading this node's
    deliverable is an amendment to ANOTHER node's plan text (ref-split's Unit 3,
    intentions/tactic-graph-ref-split.md:428 and :441-443), which is an
    align-lane body edit and not a PR-sized tactic a dispatch phase ladder can
    carry to done — and which would trip ref-split's own scope-fingerprint
    custody (clarification 115). Under the other it is a near-term fix on
    today's mechanism, which the sibling in (B1) already owns and has already
    planned, and which tactic-graph-commit-plumbing-default's Unit 2 censuses
    besides. Neither reading yields an independently shippable unit without the
    author choosing between them.


    COVERAGE BOUND, stated so this park does not imply a breadth it did not
    have: this review verified the clauses load-bearing for this target — the
    maintenance-burden band condition and clarifications 237, 242, 218, 193 and
    245 — against origin/main at 9a9312d4. No full Side-B sweep ran across the
    strategy's 30 conditions and ~250 clarifications (the strategy file is far
    too large to pass whole into the review). Treat "no further drift" as
    unestablished, not as checked-and-clear.


    Five immaterial Side-B observations from this round are landed as
    `clarifications` on this node itself, not on the serving strategy
    (clarification 245/V1 forbids the strategy write, and the tactic-target rule
    forbids touching the serving strategy's frontmatter at all). No born-parked
    observation carrier was minted: per the 2026-08-21 escalation carve-out, a
    carrier would score into the very backlog numerator this park is blocked on.
  since: 2026-08-21
  recommendation: >-
    TWO RULINGS OWED, both at the same sitting. (B) is not merely downstream of
    (A) — one of its dispositions is among the few that can actually move (A).


    (1) RULE THE BAND, ONCE FOR THE WHOLE STRATEGY. This is the blocking item
    and it must not be answered per-node: a per-node answer only re-opens the
    queue on the next selection, which is how this reached ten parked nodes.
    Three explicit dispositions: (a) RE-AFFIRM 35% and accept that the lane
    stays closed until the open population drains — the 84 open tactics are the
    only lever that shrinks the numerator, and no new decomposition can help;
    (b) RE-DECLARE the band against the grown population — the ratio was set
    when the subtree held 197 tactics and it now holds 316, so re-derive the
    ceiling against today's shape rather than inheriting a number chosen for a
    subtree 60% this size; (c) ACCEPT the breach with recorded remediation and
    disarm the condition's parks-the-strategy clause, converting it to a
    monitored reading. Whichever is chosen, SAY WHAT BECOMES OF THE TEN
    ALREADY-PARKED NODES — they will not unpark themselves, and every one is
    sitting in the office-hours queue awaiting exactly this ruling. Also refresh
    the strategy's `reading`, which still records 58/236 = 24.6% and is stale by
    ~18 points and 80 tactics.


    (2) RULE THE MECHANISM AND THE PARTITION, in clarification 242's shape. Name
    which node owns the post-land coherence mechanism for the shared
    materialized tree; state whether the ratified shape is a tree refresh (fetch
    + reset --hard after every land) or a ref-scoped read (readNodeAtRef /
    listNodesAtRef), and if both, which surface gets which; and decide this
    node's disposition among three — it ships code of its own, it is folded into
    tactic-graph-ref-split's Unit 3 as a body edit, or it is PRUNED into
    tactic-eval-finding-list-reads-working-tree-stale-after-plumbing-land.
    PRUNING IS THE ONLY ONE OF THE THREE THAT LOWERS THE BACKLOG NUMERATOR (1)
    IS BLOCKED ON.


    STATE FOR A FRESH SESSION, so nothing here is re-derived. Nothing about this
    node is defective; its premise was verified live. Once both rulings land,
    re-run `/align-tactics tactic-graph-refsplit-read-coherence`. Five
    clarifications landed on this node by this round carry the verified anchors
    — clarification 242's four-file status list is superseded by fe0b1c4d;
    clarification 237's `graph-commit:3502` anchor has moved to :3591
    (definition) and :3794 (sole call site, inside the `worktree` arm, with
    GRAPH_COMMIT_WRITER still defaulting to `worktree` at :418); ref-split's
    blocker census is unmoved at 23 of 37 open; clarification 218's no-CLI
    finding on lib-store-at-ref.ts holds but its five-consumer count does not
    reproduce; and write-path.md:305-308 still ships the strategy-clarifications
    instruction that clarification 245/V1 overturned. The one reuse anchor a
    plan will want and which is not in the body: graph-commit's single push site
    is `try_land()` at packages/intentionsutil/scripts/graph-commit:2916, and
    nothing after it advances the calling checkout's local branch,
    remote-tracking ref, or working tree — that is the hook point a post-land
    coherence step would attach to.
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# tactic-graph-ref-split refreshes the shared GRAPH_WT only at worktree-provisioning time — add a post-land coherence step so a session that lands a node can read its own write back

**Status — PARKED to `office_hours`, 2026-08-21 (no plan authored).** Draft
retained from the 2026-08-14 `/align` round. Still not a plan: the
2026-08-21 `/align-tactics` tactic-mode round escalated instead of finalizing,
on a Side-A condition failure plus a folded material requirement-ambiguity.
Two author rulings are owed before this node can be planned — see
`office_hours.recommendation` and the round record at the foot of this file.

## The gap, as measured

`tactic-graph-ref-split` Unit 3 materializes `intentions/` into every worktree as
a **symlink** to one shared long-lived worktree checked out from `graph-main`,
refreshed with `git -C "$GRAPH_WT" fetch origin graph-main && git -C "$GRAPH_WT"
reset --hard origin/graph-main`. That refresh runs at **four call sites, all
pre-session**: worktree provisioning and the hooks.

Grepping all 1040 lines of that node for a post-land refresh returns nothing. Unit
2's landing loop (`fetch` → `read-tree` → `write-tree` → `commit-tree` → push)
correctly never touches a working tree — which is the point — but nothing then
advances `GRAPH_WT` to the sha it just landed.

So a long-lived session that lands a node and then reads through the symlink reads
its own write as missing. That is not hypothetical: it is the 2026-08-14 regression
`tactic-eval-finding-list-reads-working-tree-stale-after-plumbing-land`, measured
at 7 stale rows and 28 lands without a HEAD move, with duplicate ledger slugs
minted because the similarity check could not see the entries already written.
Today it fires on the main checkout; post-cutover it fires on `GRAPH_WT`.

## The shape of the fix is open — deliberately

Two candidates, neither chosen this round:

1. **Refresh after land.** `graph-commit` advances `GRAPH_WT` to the pushed sha
   before returning success. Cheap, local, and the node already argues the reset is
   safe: *"a `git reset --hard origin/graph-main` is idempotent and never races
   against a plumbing-only writer."* Risk: `GRAPH_WT` is shared, so one session's
   refresh moves every reader — usually fine (all readers want `graph-main`'s tip),
   but it is a shared-mutable-cache write and should be reasoned about, not assumed.
2. **Read through the ref.** Resolve node blobs with `git cat-file` at
   `origin/graph-main` instead of through the symlink. Coherent by construction, but
   it rewrites every read site, gives up plain `grep`/editor access to `intentions/`,
   and makes a whole-graph pass shell out per node — the cost `graph-digest.ts`
   exists to manage.

   **Corrected 2026-08-21:** that cost objection was written against a
   hypothetical and must be re-argued against a library that now exists.
   `packages/intentionsutil/scripts/lib-store-at-ref.ts` ships
   `listNodesAtRef(repoRoot, ref)` at `:47` — whole-store enumeration via
   `git archive <ref> intentions | tar -x` into a scratch dir, then
   `listNodesStrict`, so a whole-graph pass is ONE archive extraction, not a
   shell-out per node — and `readNodeAtRef(repoRoot, ref, id)` at `:100`. Live
   consumers to copy from: `office-hours-select.ts`, `read-sensors.ts`,
   `verify-landed`. This round's own band measurement was taken through it.

**And the choice between them is not this node's to make.** It is a material
requirement-ambiguity, folded into this round's park: clarification 237's
"a materialized tree is a cache, and the defect is cache coherence" reads as
endorsing candidate 1, while the sibling owning the same violation on today's
mechanism — `tactic-eval-finding-list-reads-working-tree-stale-after-plumbing-land`
(phase `implement`, plan already authored) — was planned as candidate 2, with
`sync_main_checkout` explicitly rejected in its own clarifications because
`--ff-only` refuses on any dirty tracked file. Two siblings, one invariant,
opposite mechanisms, no recorded partition.

The invariant this serves (strategy clarification 237) is stated
mechanism-neutrally on purpose: **no reader may observe graph state older than a
write it was told succeeded.** Either candidate can satisfy it. A hybrid — refresh
after land, and read through the ref only on the paths where staleness is
correctness-critical, such as the ledger's find-before-minting check — is also
open.

## Ordering

This does not block `tactic-graph-ref-split`, and ref-split does not block this.

**The rest of this section is VOID as of 2026-08-21 and is corrected in the
round record below.** It proposed landing a current-writer fix here first. That
work is now owned elsewhere — `tactic-graph-commit-plumbing-default` Unit 2
censuses the land-then-read-locally sites, and the eval-finding sibling owns
the one live instance — so re-planning it here would duplicate two in-flight
nodes. What remains un-owned is the post-cutover half, and the cutover is
unstarted.

---

## 2026-08-21 round record — `/align-tactics` tactic-mode, PARKED (no plan authored)

Ran at branch cut `787782c5`; every measurement below re-derived against
`origin/main` `9a9312d4` and independently re-verified on the caller thread.
Workflow run `wf_5e9b09af-91e`: 5 of 5 agents completed, 0 errors, so the
Side-A evidence base is NOT degraded by the gather-agent-death failure mode.

### Why it parked

Both blockers need an author ruling, and a tactic-target session may not write
the serving strategy, so both are recorded on this node. The full statement is
in `office_hours.reason`; the dispositions owed are in
`office_hours.recommendation`. In short:

- **Side A** — the serving strategy's armed maintenance-burden band fails on
  both limbs: **135/316 = 42.72%** against a 35% ceiling, and rising (41.14% at
  `787782c5`, five commits earlier the same day). This is the **tenth** node
  parked on that one condition.
- **Side B, material** — the mechanism question above (B1), and the
  deliverable-class question (B2): whether this node ships code, is a body
  edit to ref-split's Unit 3, or is pruned into the eval-finding sibling.

### Anchors verified this round, so a re-plan need not re-derive them

- **`graph-commit`'s single push site is `try_land()` at
  `packages/intentionsutil/scripts/graph-commit:2916`**, and nothing after it
  advances the calling checkout's local branch, remote-tracking ref, or working
  tree. That is the hook point a post-land coherence step attaches to.
- `assert_clean_outside_ids` is defined at `graph-commit:3591` with exactly one
  call site, `:3794`, inside the `worktree` arm. `GRAPH_COMMIT_WRITER` still
  defaults to `worktree` at `:418`; the sole plumbing opt-in is
  `dispatch-eval-finding:814`. Clarification 237's `:3502` citation is stale —
  the mechanism it describes is not.
- `tactic-graph-ref-split` is `phase: implement` with `execution: null` — no
  unit has landed — and `git ls-remote --heads origin graph-main` returns
  nothing. Its blocker census is unmoved since 2026-08-14: 37 blockers, 23
  open, 14 done. **The gap this node names is therefore latent, not live.**
- Its Unit 3 `GRAPH_WT` material is at
  `intentions/tactic-graph-ref-split.md:428` and `:441-443`, with `:481` stating
  the resolve/refresh/symlink/guard pattern spans four call sites — all
  pre-session. Editing that body is an align-lane edit to an in-flight node and
  trips its scope-fingerprint custody (clarification 115).

### Scope boundary against clarification 242

Clarification 242 partitions the explicit-ref read path across
`tactic-explicit-ref-graph-reads` (now `phase: done`),
`tactic-demote-node-stale-local-read` and `tactic-graph-read-at-ref-cli` (still
draft), and places `graph-commit` out of scope under any shape as a writer whose
`-C`/cwd resolution is already ratified (clarification 86). A plan for this node
must state its boundary against that partition rather than silently re-claiming
those files — and note that a post-land refresh inside `graph-commit` touches
the one file clarification 242 excluded, which is itself part of what the
mechanism ruling must settle.

### Where this round's immaterial observations went

Onto this node's own `clarifications` (five entries), not the serving strategy
and not a fresh carrier node — see clarification 5 there for the reasoning.
