---
id: tactic-graph-native-dispatch-fold
kind: tactic
statement: Fold strategy-graph-native-dispatch's superseded clarification chains
  into its body and move settled router mechanism down — the strategy keeps the
  standing posture
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round, replanned
  2026-07-19 and corrected 2026-07-19 (opus validation pass caught a dropped
  entry and two broken cross-references — see the Correction note in the body):
  the node has grown to 78 clarifications with 14 identified superseded-in-place
  chains (a later entry explicitly amends or replaces an earlier one) plus
  dense, settled router-mechanism detail (fuses, fingerprints, quorum floors,
  claiming semantics, serialization) recorded at dialectic grain across the
  majority of the array — a design document wearing a strategy node.
  kind-strategy's body-function rule (2026-07-09) names the strategy body as the
  fold-target. The store-side blocker that had this tactic on hold — non-tactic
  node bodies being regenerated/cosmetic on every write, so a strategy body
  could not durably hold folded content — cleared 2026-07-19 when
  tactic-nontactic-body-durability's greenfield contract shipped on PR #2890
  (store.ts now preserves every kind's body verbatim; only a brand-new file gets
  the placeholder). This tactic performs the fold: settled router mechanism
  moves into topic-organized body sections, superseded-in-place chains compress
  to short in-array pointers, and the clarifications array shrinks to its
  remainder (about 12 of the current 78 entries) plus the pointers — shrinking
  the surface where ordinal-citation bugs breed."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-graph-native-dispatch-fold
  pr: 2925
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours:
  reason: "/qa-fix: Step 0.5 origin/main merge failed with a non-fast-forward push
    rejection (exit 7), not a normal merge conflict (exit 3). Investigation
    found the tactic's 6 Unit commits exist TWICE under different SHAs with
    identical messages/author: once properly on the PR branch
    (origin/tactic-graph-native-dispatch-fold), and once directly on origin/main
    with NO associated PR (confirmed via gh api commits/<sha>/pulls). main
    already contains this tactic's full content out-of-band. This is a
    git-history integrity issue on shared main (likely a prior worktree/cd
    mishap pushing feature commits straight to main), not something qa-fix
    should attempt to repair via rebase/force-push. Escalating for human
    decision: verify the two tactic-owned files
    (strategy-graph-native-dispatch.md, tactic-graph-native-dispatch-fold.md)
    are truly equivalent between main and the PR branch, then likely close PR
    #2925 without merging and transition the node past qa manually."
  since: 2026-07-21
  recommendation: >-
    ## Recommendation: PR #2925 / `tactic-graph-native-dispatch-fold`


    **What happened.** A prior implement or qa session for this tactic pushed
    its six Unit commits straight to `main`, bypassing the PR, CI, and review.
    The tells: the same six commit messages/author appear twice under different
    SHAs — once on the PR branch, once directly on `main` with *no associated
    PR*. This matches memory pattern
    `failed-cd-worktree-drops-into-main-checkout`: a `cd` mishap landed the
    session's git ops on the `main` worktree instead of the feature worktree. A
    later local `pull --rebase` then dropped the now-duplicate commits via
    patch-equivalence, collapsing local HEAD onto `main`'s tip — which is why
    the plain `push` to the PR branch (still at `c0bb0de2`) was rejected
    non-fast-forward. This is a history-integrity issue on shared `main`,
    correctly left to a human.


    **Decision to make.** `main` already carries this tactic's real content, so
    #2925 is almost certainly closeable without loss — but **confirm first**.
    Ignore the full-branch diff (noisy; it "deletes" content actually superseded
    by unrelated later `main` commits). Instead diff only the two files this
    tactic owns:


    ```

    git diff origin/main origin/tactic-graph-native-dispatch-fold -- \
      intentions/strategy-graph-native-dispatch.md \
      intentions/tactic-graph-native-dispatch-fold.md
    ```


    **If equivalent (expected):**

    1. `gh pr close 2925 --comment "Content already on main via direct pushes
    (SHAs 568a9a22…14063cea); PR is redundant. Closing without merge — no
    content lost."` (no closing keyword.)

    2. Transition the node past `qa` — do **not** re-run a QA walkthrough
    against an empty diff. Check `PHASES`/`PHASE_LADDER` in
    `packages/intentionsutil/src` for whether the next phase is `review` or
    `done`, then transition there.


    **If the two-file diff differs:** treat as a real conflict — recreate the PR
    branch from current `main`, re-apply only the tactic's unique diff cleanly,
    and re-run qa-fix.


    **Follow-up.** File a separate tactic for the root-cause worktree/`cd` bug
    (`failed-cd-worktree-drops-into-main-checkout`) so direct-to-main pushes
    stop recurring.
pace_exempt: false
rounds: null
attributes: {}
---
# tactic-graph-native-dispatch-fold

## Context

**Correction (2026-07-19, opus validation pass):** the version of this plan
first landed miscounted the array at 77 entries and dropped entry 78
entirely (a real, later-authored entry that amends entry 58's
implementation-vehicle assignment — folded into Unit 4 below). The same pass
found two broken cross-references in Unit 2 (pointing at a unit/section that
does not own the content being referenced) and a stale/overclaimed premise in
the soft-freeze note below. All are fixed in this revision; see each unit for
the specific correction.

`strategy-graph-native-dispatch` (`intentions/strategy-graph-native-dispatch.md`)
has 78 `clarifications:` entries across many `/align-strategy` design
rounds. The majority of them (~66 of 78) are either (a) settled
router-mechanism detail — fingerprint/freeze gates, worktree claiming,
serialization, pace/backlog, phase transitions, recovery, review/QA
disposition, execution substrate, fuses — recorded at dialectic grain, or (b)
part of a superseded-in-place chain where a later entry explicitly amends or
replaces an earlier one, leaving the earlier entry's full text stale in
place. Per `kind-strategy`'s body-function rule (2026-07-09,
`intentions/kind-strategy.md:61`), settled design notes belong in the node
body, not the live clarification list — the strategy has become "a design
document wearing a strategy node" (this tactic's own rationale). This tactic
folds that settled content into topic-organized body sections and compresses
the array to its remainder plus short pointers, so the array reads as the
current dialectic record instead of a 78-entry history.

The ~12-entry remainder this plan leaves untouched (Unit 7's complement list)
is **not** uniformly "still-being-decided" — a spot check found several read
as settled doctrine (align-family conventions, drift-review process,
provenance conventions) that is simply outside this tactic's router-mechanism
+ superseded-chain scope, not undecided. Do not force these into
`## Router Mechanism` sections; leaving settled-but-out-of-scope doctrine as
ordinary clarification entries is correct, only genuinely undecided posture
and router-mechanism/chain content are this tactic's concern. One of the
twelve, entry 69, cites "the backlog flag" (entry 9's mechanism) as still
active alongside calculated attention (entry 11) — on its face this looks
inconsistent with entry 11 "deleting the backlog flag" (Unit 4's chain
below), but entry 69's own citations are by position (`clarification 9`,
`clarification 11`), and positions never change under this fold (only the
cited entries' `answer:` text shortens to a pointer) — so entry 69's
citations keep resolving correctly and require no edit. Unit 4 should still
sanity-check this apparent inconsistency against current mechanism (does an
authored "backlog" label still exist as a naming convention distinct from the
calculated-attention ranking formula, or is entry 69 using stale language?)
and, if entry 69 does turn out to be stale, fix it with a minimal two-line
addendum rather than treating that as this tactic's own scope creep.

This was blocked on `tactic-nontactic-body-durability` — until 2026-07-19,
`writeNode` regenerated every non-tactic body from `statement` on every
rewrite (cosmetic, non-durable), so a strategy body could not hold folded
content across a later `reconcile-graph`/`park`/transition write. That
shipped on PR #2890 (`store.ts`'s `readExistingBody` /
`assertNoBodyLoss` now cover every kind); this tactic is unblocked.

**On `tactic-clarification-citation-ids` (id-based citation):** that tactic's
own Unit 3 explicitly defers a "big-bang rewrite" of this node's 78-entry
history and says ordinal references "upgrade opportunistically as nodes are
next amended" — this fold *is* that opportunistic amendment. At authoring
time (2026-07-19, `origin/main` at `57c7452d`) `tactic-clarification-citation-
ids` has not started (`phase: implement` and an `execution.branch` stamp are
present on the node, but no matching remote branch or PR exists — a stale
selection stamp, not live work) and its Unit 1 schema (`id` on
`Clarification`) has not landed, so `<node-id>#<slug>` citations are not
available. Do **not** block on it (`blocked_by` stays `[]` on this tactic):
use the 1-indexed positional citation convention already established
elsewhere in this graph (count `- question:` entries from the top of the
array, 1-indexed) for every pointer this fold writes. If
`tactic-clarification-citation-ids` Unit 1 has landed by the time a unit below
runs, prefer `<node-id>#<slug>` citations instead and mint slugs via
`write-node.ts` for the entries being pointed at — check
`packages/intentionsutil/src/schema.ts`'s `Clarification` interface for an
`id` field before choosing which form to use.

**On soft-freeze:** editing `clarifications:` changes
`strategyFingerprint(strategy)` (`packages/intentionsutil/src/router.ts`),
which could soft-freeze any open child tactic whose
`execution.strategy_fingerprint["strategy-graph-native-dispatch"]` entry is
stamped. The open-child count is a moving target under active concurrent
work — it was 25 at this plan's first authoring and 33 (19 with a populated
`execution` object) a few hours later at the correction pass — so never trust
a number quoted here; what matters is that **zero** of them, at either
check, carried a non-null `execution.strategy_fingerprint` entry for this
strategy (bootstrap-interim: the router does not yet stamp fingerprints even
where it has populated other `execution` fields), so there is nothing to
re-stamp today. Unit 7 below re-runs this query live at execution time — its
result is the only one that matters, not this paragraph's snapshot.

**Line numbers below anchor to `origin/main` at `57c7452d` (2026-07-19).**
Earlier units in this plan edit the same file, so line numbers drift as the
plan executes — locate each entry by its quoted `question:` text (or the
1-indexed array position, recomputed via `jq` — see Reuse), never by a stale
line number from a prior unit's edit.

## Units

Each unit folds one topic cluster: it (1) adds a `###` subsection under a
`## Router Mechanism` heading in the body (created by Unit 1), synthesizing
the cluster's entries into one coherent, dated, provenance-carrying
explanation of the settled mechanism (for a superseded-in-place chain, the
section records the chain's history — what each link changed — and states
the *current* rule as authoritative), and (2) compresses each folded entry in
the frontmatter `clarifications:` array to a short pointer of the form
`"<original question, verbatim> — See body §<section title>. Recorded
<original date>."` (superseded entries) or `"<original question, verbatim> —
See body §<section title> for the full mechanism. Recorded <original
date>."` (the surviving/settled entry). Never delete an entry outright and
never lose an entry's original recorded date — git history is provenance,
but the in-array pointer is what keeps the chain legible without opening
`git log`.

### Unit 1 — Body scaffold + phase transitions & fix-state fold

**Scope:**

- Add `## Router Mechanism` as a new top-level heading in
  `intentions/strategy-graph-native-dispatch.md`'s body, after the strategy's
  own `# <statement>` title line (currently the body's only content), with a
  one-paragraph intro noting this section holds settled router/graph
  mechanism moved down from the clarification history per the body-function
  rule, organized by topic.
- Add `### Phase Transitions & Fix State` under it, folding: entries 1, 3,
  15, 18, 22, 48, 52, 53, 61, 64, 66 (the "phase transitions" cluster) and
  the two chains that live entirely inside this cluster:
  - **Chain — fix as phase-value → orthogonal execution state**: entries 18
    → 22, 52, 64 → 66. Record that fix was originally modeled as a
    CI-failure interrupt overwriting `phase` (entry 18), built on by the
    main-qa ladder (22), the frozen-tactic tie-break ordinal (52), and the
    marker-clear re-review mechanism (64) — then entry 66 superseded the
    encoding for all of them: fix is now orthogonal nullable
    `execution.fix` state, `phase` is never overwritten by it, every
    ordinal list drops fix, and the marker-clear re-review is replaced by a
    direct phase→review reset plus auto-merge disarm. State entry 66's rule
    as current.
  - **Chain — fresh-reading gate anchor → `last_aligned`**: entry 3 → 61.
    Entry 3 gated `/align-tactics` re-eligibility on a reading newer than
    `rounds.last_completed` plus a 2-round cap; entry 61 supersedes the
    anchor for human-signal-validated strategies with a distinct
    `rounds.last_aligned` timestamp (stamped when a round lands tactics),
    since such rounds never prune a child. State entry 61's rule as
    current, noting it only supersedes the *anchor*, not the cap.
  - Entries 1, 15, 48, 53 are not part of a chain — fold each as its own
    dated paragraph: persisted `phase` as the state machine with PR/CI
    demoted to sensors (1); the bootstrap doctrine that sessions self-write
    phase/execution/marker transitions until the router lands (15);
    `execution.pr` must stamp at the implement→qa transition write itself
    (48); the steady-state split where the phase worker never validates CI
    and the tick reconciler does (53).
- Compress entries 1, 3, 15, 18, 22, 48, 52, 53, 61, 64, 66 in the
  `clarifications:` array to pointers per the Units-intro convention above.

**Recommended model:** opus (synthesizing two multi-link supersession chains
into a single authoritative, non-contradictory statement of current
mechanism is a judgment call, not a mechanical transcription).

### Unit 2 — Fingerprint & freeze fold

**Scope:**

- Add `### Fingerprint & Freeze` under `## Router Mechanism` (from Unit 1;
  if Unit 1 has not yet landed when this unit runs, create the parent
  heading here instead), folding entries 10, 34, 36, 39, 66, 70, 73, 75 and
  two chains:
  - **Chain — mid-flight-edit rule → scope fingerprint → chain of
    custody**: entries 34 → 36 → 39, amended by 62 (timing) and scoped by 73
    (materiality). **Correction (2026-07-19): the original text of this plan
    said 62 and 73 are "folded by Units 1 and 5 respectively" — wrong on
    both counts. Entry 62 is folded by Unit 6, §Execution Substrate (its
    own content is the tick's two-phase timing, not a phase-transition
    topic); entry 73 is folded by *this unit* (Unit 2), in the second chain
    immediately below — it is not owned by any other unit.** Record: entry
    34's mid-flight-edit rule (an author edit to a claimed tactic's scope
    lands freely mid-phase; "its transition write stands"); entry 36
    superseding that with a tactic-scope fingerprint gate (mismatch holds
    the tactic at its completed phase for a re-run); entry 39 superseding
    36's "holds and re-runs" clause with chain-of-custody (staleness
    demotes to `phase: implement`, requiring an unbroken
    implement→qa→review re-run against the merge-time scope fingerprint).
    State 39's rule as current, with a forward-pointer to §Execution
    Substrate (Unit 6) for 62's timing change, and a same-section
    backward-pointer to this section's second chain below for 73's
    materiality scoping (no cross-unit pointer needed for 73).
  - **Chain — soft-freeze → materiality-scoped freeze → scope-inert
    restamp**: entries 10 → 70 → 73. Entry 10's strategy-substance
    fingerprint (statement/clarifications/conditions/serves/signal) stamped
    per tactic, with any mismatch soft-freezing the whole subtree; entry 70
    superseding this with materiality scoping (the editing round classifies
    each open child, re-stamping orthogonal ones in the same commit; stamp
    widens to `{hash, sha}`); entry 73 extending the same materiality
    principle to the tactic-local scope-custody stamp from the chain above
    (mid-flight-edit → scope fingerprint → chain of custody). Both entries
    of this chain (70 and 73) are folded here, in this same section — state
    both rules as current.
  - Non-chain entries: 36 (both gates bracketing a worker: start-gate and
    write-gate — note this is subsumed by the chain above, fold once), 66
    (fix decoupled from fingerprint/phase machinery — cross-reference
    §Phase Transitions & Fix State, do not restate), 75 (root-cause: the
    freeze re-surface sweep wrongly pulls the whole subtree instead of just
    stale-stamped children — record as a fixed bug, not a design decision).
- Compress entries 10, 34, 36, 39, 70, 73, 75 in `clarifications:` to
  pointers (66 is compressed by Unit 1, which owns that chain).

**Recommended model:** opus (two interleaved multi-link chains sharing
entries; getting the current-vs-superseded state right requires reading all
of §2's source entries together, not per-entry).

### Unit 3 — Worktree claiming & liveness fold

**Scope:**

- Add `### Worktree Claiming & Liveness` under `## Router Mechanism`,
  folding entries 12, 13, 23, 29, 72, 77 and the chain:
  - **Chain — legacy worktree layout → native worktrees**: entry 12 →
    23. Entry 12 committed to one dedicated worktree per tactic via the
    legacy `worktree-create.sh` hook and node-id naming under the
    `.bare` + sibling `worktrees/` layout; entry 23 supersedes the
    mechanism half with Claude Code native worktrees
    (`.claude/worktrees/<node-id>`, `EnterWorktree`) as the substrate,
    retiring the legacy hook/layout as legacy-lane-only. State 23's rule as
    current.
  - Non-chain entries, each its own dated paragraph: the uniform node-id
    claiming/reservation ledger, liveness ⇔ worktree for both tactic and
    strategy sessions (13); human/interactive sessions join the same
    ledger, base-version write check makes read-freshness mechanical (29);
    dedup keys on live-session liveness only, never worktree existence,
    reaping is decoupled post-merge hygiene (72); subagent cwd pinned to
    the primary checkout by the Agent tool, fixed by passing the absolute
    worktree root plus a contamination guard (77).
- Compress entries 12, 13, 23, 29, 72, 77 in `clarifications:` to pointers.

**Recommended model:** sonnet (single two-link chain plus four independent,
already-well-specified mechanism paragraphs — low ambiguity).

### Unit 4 — Pace/backlog & serialization/commit fold

**Scope:**

- Add `### Pace, Backlog & Attention` and `### Serialization & Commit` (two
  sibling subsections) under `## Router Mechanism`.
- `### Pace, Backlog & Attention` folds entries 9, 11, 14, 33, 49, 56, 76 and
  two chains:
  - **Chain — backlog band → calculated attention**: entry 9 → 11. Entry 9
    recorded deferred work as a manually-stamped "backlog" flag/band,
    demoting off-path tactics one rank tier; entry 11 supersedes the
    *mechanism* (keeping the principle) with calculated attention — an
    extensible weighted sum of read-time-derived terms (authored
    override/boost, structural on-path signal membership, capture
    resolution) — and deletes the backlog flag. State 11's rule as
    current. **Before folding, check entry 69** (a live, untouched entry —
    see Context's note above): it describes a tactic "marked with the
    backlog flag ... at decomposition" alongside calculated-attention
    ranking, which reads as if the backlog flag still exists post-11. Entry
    69's own positional citations (`clarification 9`, `clarification 11`)
    remain valid after this fold regardless (positions don't change, only
    `answer:` text shortens), so no edit to entry 69 is *required* — but
    resolve the apparent inconsistency in this section's prose: either the
    "backlog flag" persists today as an authored naming/tracking label
    distinct from the ranking formula (in which case say so, and entry 69
    is not stale), or entry 69 is using retired terminology (in which case
    add a two-line addendum to entry 69 noting the terminology is
    historical, without expanding entry 69 back to full prose).
  - **Chain — pace override / concurrency ceiling → single-node ceiling
    bypass**: entries 33, 49 → 76. Entry 33 fixed `max_concurrent_workers`
    as the one true global ceiling; entry 49 established that explicit
    human dispatch overrides only the pace curve, never the ceiling; entry
    76 amends both — a deliberate human dispatch now also bypasses the
    absolute ceiling for exactly one node, and entry 33's own text is
    amended in place to scope the ceiling to autonomous selection only.
    State 76's rule as current, noting it amends rather than fully
    supersedes 33.
  - Non-chain entries: legacy pace curve/ramp carried over unchanged,
    priority label becomes `pace_exempt` (14); a signal's resolution
    ranking IS the owning node's authored boost, no new per-signal rank
    field (56).
- `### Serialization & Commit` folds entries 2, 16, 58, 78 and one
  three-link chain:
  - **Chain — manual-merge-park → automatic serialization → ladder-vehicle
    split**: entry 2 → 58 → 78. Entry 2 fixed the single-node rebase-retry
    write path with same-node races failing closed to a manual-merge park;
    entry 58 supersedes the fail-closed clause with an automatic five-rung
    resolution ladder (rebase auto-merge → field-level merge → stale-base
    re-read/re-apply → model reconciliation → true-conflict park only), and
    node-id claiming narrows to scheduling dedup that never blocks an edit.
    **Entry 78 (2026-07-19, added by the correction pass — the original
    plan dropped this entry) amends 58's *implementation-vehicle*
    assignment only, not its ladder doctrine**: layers 1–3 (the
    deterministic, unit-testable rebase/merge/re-read steps) are owned by
    the `graph-commit` script; layers 4–5 (model reconciliation and the
    true-conflict park) are owned by the `dispatch-conflict` skill as an
    opus subagent, since no script in the repo runs a scoped model
    evaluation. `tactic-dispatch-conflict-greenfield` is `blocked_by
    tactic-graph-commit-auto-serialization` to encode this ordering. State
    58's ladder doctrine as current and unamended, with 78's
    vehicle-ownership split stated as the current implementation
    assignment on top of it — do not present 78 as superseding 58's
    doctrine, only its vehicle assignment.
  - Non-chain entry: direct push accepted once a SHA carries the four
    required contexts, via a `graph/**` scratch-branch CI fast path (16).
- Compress entries 2, 9, 11, 14, 16, 33, 49, 56, 58, 76, 78 in
  `clarifications:` to pointers.

**Recommended model:** opus (calculated attention and the five-rung
serialization ladder are load-bearing, subtle mechanisms, and entry 78's
doctrine-vs-vehicle distinction is an easy one to get wrong — get the
"current rule" synthesis wrong here and a future reader mis-implements
scheduling or commit-conflict handling).

### Unit 5 — Recovery, review disposition & fuses fold

**Scope:**

- Add `### Recovery & Session Lifecycle`, `### Review & QA Disposition`, and
  fold the single fuses entry into whichever of the two reads more
  naturally (recommend `### Recovery & Session Lifecycle`, since the fuse
  bounds re-selection recovery) under `## Router Mechanism`.
- `### Recovery & Session Lifecycle` folds entries 30, 31, 37, 40, 60, 65
  and two chains:
  - **Chain — re-selection recovery → fuse-bounded**: entries 24, 30, 34 →
    40. Entries 24/30/34 established unconditional re-selection-from-
    origin/main (never session resume) as the recovery path for dead
    ticks, parked work, and scope changes; entry 40 amends this to a
    bounded reading — re-selection remains the only recovery path, but is
    now fuse-bounded: a durable per-node no-progress counter parks a node
    after 2 silent-failure cycles, and a correlated-death detector (≥3
    simultaneous dead claims) trips one systemic breaker tactic halting
    all selection. State 40's rule as current; cross-reference entry 24 to
    §Execution Substrate (Unit 6 owns its full content — the first-tick
    Workflow-script retirement is a substrate decision, not a recovery
    one; only its re-selection-recovery role is restated here).
  - **Chain — office-hours park clearing → mandatory drain-lane
    disposition**: entry 4 → 65. Entry 4 established that any interactive-
    session commit touching a parked node incidentally clears
    `office_hours`; entry 65 refines (does not replace) this — a self-
    modification drain session's fix commit lands on the PR branch and
    never touches the node's frontmatter, so the drain lane must terminate
    with a mandatory explicit clear-park/re-park primitive. State both:
    entry 4's general rule still holds; entry 65 is the drain-lane-specific
    refinement.
  - Non-chain entries: same-session `/align-tactics` during bootstrap is a
    safety net, never a carrier (31); dead worker recovered only by
    re-selection, checkpoint-discipline condition for flushing findings
    (37); node-worker sessions reaped from the agents list on every
    terminal exit via foreground-safe self-close (60).
- `### Review & QA Disposition` folds entries 19, 20, 21, 51, 59 and one
  chain:
  - **Chain — review disposition → cost trigger**: entries 19, 51 → 59.
    Entry 19 fixed a three-way review disposition (resolve-in-scope /
    defer / ignore) keyed on verification × contract-breakage; entry 51
    applied it to `/code-review`'s and `/security-review`'s own unfixed
    residue; entry 59 refines both — cost becomes a second resolve-in-scope
    trigger (a confirmed out-of-contract finding cheaper to fix than defer
    is now fixed in scope), leaving the ignore category untouched. State
    59's rule as current alongside 19's original three-way frame (59 adds
    a trigger, it does not replace the frame).
  - Non-chain entries: QA is full independent user-acceptance validation
    against real data, not a checklist re-run (20); review is the full
    `/review-fix` fan-out, deferred findings land as graph draft tactics,
    never gh follow-ups (21).
- Compress entries 4, 19, 20, 21, 30, 31, 37, 40, 51, 59, 60, 65 in
  `clarifications:` to pointers (entry 24 is compressed by Unit 6, which
  owns its chain membership; entry 34 is compressed by Unit 2).

**Recommended model:** opus (three chains in one unit, two of them
cross-referencing sections owned by other units — getting the pointers
consistent across units without contradiction is the hard part).

### Unit 6 — Execution substrate & misc mechanism fold

**Scope:**

- Add `### Execution Substrate` and `### Other Settled Mechanism` under
  `## Router Mechanism`.
- `### Execution Substrate` folds entries 24, 25, 35, 50, 62 (no chains):
  first tick ran as a Workflow script, original `agent()`-per-node fan-out
  retired in place because workflow subagents cannot hold the Workflow tool
  (24); thin-script condition keeps selection/transition/provisioning in
  owned code, Workflow executor never the router's sole home (25); the
  graph (not a workflow/session) is the long-horizon substrate, no
  kept-alive supervisor session (35); Shape B — an owned launch-per-phase
  primitive spawns each phase as its own top-level session holding the
  Workflow tool (50); the tick runs two ordered phases — all scriptable
  dispositions to completion, then one worker-group spawn (62; this is also
  the timing change referenced from §Fingerprint & Freeze's first chain —
  cross-reference it there, do not duplicate the fingerprint-specific
  framing here).
- `### Other Settled Mechanism` folds entries 5, 17, 26, 41, 42, 43, 46, 47,
  54, 63, 68, 71 and two chains:
  - **Chain — auto-merge arming responsibility**: entry 47 → 53 (53 is
    folded by Unit 1 — cross-reference it, state only 47's surviving
    phrasing-doctrine half here). Entry 47 fixed the arming-instruction
    phrasing doctrine (state authorization as fact, never argue with the
    permission layer) after self-justifying language got a Workflow launch
    denied; entry 53 moved *who* arms the merge from the transition
    writer/review worker to the tick reconciler, dissolving 47's
    per-worker hazard while keeping its phrasing doctrine intact. State
    47's phrasing doctrine as still-current, with a forward pointer to
    §Phase Transitions & Fix State for the arming-responsibility change.
  - **Chain — align family boundary redraw**: entry 45 → 67. Entry 45
    grouped `/align-tactics` inside the consolidated `/align` recording
    family; entry 67 redraws the boundary — `/align` stays records-only
    (virtues/strategies/traditions/delegations), a new uniform `dispatch-*`
    execution chain is created, and `/align-tactics` becomes
    `dispatch-plan`, moving out of the align family. State 67's rule as
    current. **Before folding this entry, grep the current repo for
    `dispatch-plan` and for whether `/align-tactics` has actually been
    renamed** — if the rename in entry 67 never shipped (this skill file is
    still named `align-tactics` as of this plan's authoring), note that
    explicitly in the folded section as an open discrepancy rather than
    stating the rename as settled fact; do not silently paper over a
    stale clarification.
  - Non-chain entries, each its own dated paragraph: tactic node bodies
    (not frontmatter) are the authoritative clean-session plan (5);
    per-phase model/effort routing and transcript attribution stamping
    carry over from the legacy token economy (17); the greenfield-relevance
    gate checks each tactic's subject against superseding non-draft nodes
    at finalization (26); self-modifying tactics detected at decomposition
    and born-parked, fallback lane parks on commit denial (41); interactive
    sessions' worktrees must be cut from freshly-fetched origin/main before
    analysis (42); bounded ancestry projection (parent+serves to virtue
    roots) injected read-only at session start (43); legitimate
    test-integrity firing resolved by an author-approved, node-recorded,
    scope-bounded waiver (46); main-health as a registered sensor, fix
    tactic wired to a persistent signal-owner strategy with inherited boost
    (54); CI flakes tracked by a fingerprint-keyed tactic node with
    `blocked_by`, not a GitHub issue (63); dispatch-phase skills split
    derivation (node→params) from execution (params→work) (68);
    backwards-incompatible migrations use a carrier tactic plus
    `blocked_by` edges from affected children, no new schema (71).
- Compress entries 5, 17, 24, 25, 26, 35, 41, 42, 43, 45, 46, 47, 50, 54, 62,
  63, 67, 68, 71 in `clarifications:` to pointers.

**Recommended model:** opus. **Correction (2026-07-19):** the original plan
recommended sonnet with only the entry-67 discrepancy check bumped to opus.
That under-models this unit: it is the largest single fold (19 entries, two
chains) and carries the heaviest inter-unit cross-reference load of any unit
in this plan (47→53 to Unit 1, 24's recovery role shared with Unit 5, 62
referenced from Unit 2) — exactly the "cross-cutting" case the
model-selection heuristic (`.claude/skills/implement-unit/SKILL.md`, lines
31–39) reserves for opus. Run the whole unit at opus, not just the
entry-67 check.

### Unit 7 — Consistency pass, fingerprint re-stamp check, and final compression

**Dependencies:** Units 1–6.

**Scope:**

- Read the full amended `intentions/strategy-graph-native-dispatch.md` body
  and frontmatter. Confirm every one of the 66 entries folded by Units 1–6
  (listed above, including entry 78 added to Unit 4 by the correction pass;
  the complement — currently entries 6, 7, 8, 27, 28, 32, 38, 44, 55, 57, 69,
  74 by 1-indexed position at this plan's authoring time, recompute at
  execution time since positions shift as entries compress — see Reuse) is
  either still a full live entry (untouched) or a pointer of the Units-intro
  form. No entry should be left as full original text where a later entry in
  its chain superseded it — that is exactly the defect this tactic exists to
  remove. **Do not trust the "77" or "65" figures anywhere in this plan's
  prose if you find them** — the array has 78 entries as of the correction
  pass and may have grown further by execution time; the authoritative count
  is always `jq '.clarifications | length'` on a fresh dump, never a number
  quoted in this plan.
- Confirm no `### ` section under `## Router Mechanism` states a rule that
  contradicts another section's cross-reference to it (the cross-references
  authored in Units 2, 5, and 6 above are the ones to check first).
- **Fingerprint re-stamp check**: re-run the open-children query from this
  plan's Context section (see Reuse) against the current graph — do not
  trust the open-child counts quoted in the Context section's soft-freeze
  note (25 at first authoring, 33 a few hours later); only a fresh query
  matters. If any child tactic serving `strategy-graph-native-dispatch` now
  has a non-null `execution.strategy_fingerprint["strategy-graph-native-
  dispatch"]` entry (none did at either check so far — check both the
  `{hash, sha}` object form and the deprecated-legacy bare-string form, per
  Reuse below), classify it: this fold changes no strategy posture
  (conditions, signal, scope, priority) and no rule's substance, only where
  the substance is recorded — so every such child classifies as orthogonal
  per the materiality-scoped freeze principle (§Fingerprint & Freeze, Unit
  2). Re-stamp `execution.strategy_fingerprint["strategy-graph-native-
  dispatch"] = {hash: strategyFingerprint(strategy), sha: <this PR's merge
  commit sha>}` on each such child in the same PR/commit as this fold — do
  not leave a materially-unaffected child to spuriously soft-freeze.
- Run the `validate-graph` and body-consistency checks in Verification.

**Recommended model:** sonnet for the mechanical re-check and validate-graph
run; opus if the fingerprint re-stamp check finds any non-null entries (a
live classification judgment at that point, not just a query).

## Reuse

- `packages/intentionsutil/src/router.ts`'s `strategyFingerprint` — the only
  correct way to compute the hash for a re-stamp; never hand-compute it.
- `packages/intentionsutil/scripts/write-node.ts` / `dump-node.ts` /
  `graph-commit --base` — the standard node read/write/land path (see this
  skill's own Step 5 for the exact invocation shape); frontmatter changes
  (the `clarifications:` compression, and a re-stamped
  `execution.strategy_fingerprint`) go through `write-node.ts`, never
  hand-authored YAML. Body-section edits go through a plain `Edit` on the
  markdown after the closing `---` fence — `write-node.ts` preserves body
  verbatim on a frontmatter-only rewrite (per the durability fix this
  tactic's rationale cites), so the two edits (frontmatter, then body) can
  land in either order within one commit.
- Recompute 1-indexed clarification positions with:
  `jq '.clarifications | to_entries[] | "\(.key+1) \(.value.question)"' <dumped-node>.json`
  (per this graph's established convention for citing "clarification N" by
  computed index rather than a hand-counted, drift-prone number).
- The open-children fingerprint query (Context section, Unit 7): a small
  `tsx` script importing `listNodes` from
  `packages/intentionsutil/src/store.ts`, filtering
  `n.kind === "tactic" && (n.serves||[]).includes("strategy-graph-native-
  dispatch") && n.phase && n.phase !== "done"`, and reading each
  `n.execution?.strategy_fingerprint`. That field's type
  (`packages/intentionsutil/src/schema.ts`'s `StrategyFingerprint`-adjacent
  types) is `string | Record<string, StrategyStampValue> | null` — a legacy
  bare-string stamp is a different (older, single-strategy) shape than the
  current per-strategy map, so index with
  `typeof fp === "string" ? fp : fp?.["strategy-graph-native-dispatch"]`,
  never a bare `fp["strategy-graph-native-dispatch"]` (that silently returns
  `undefined` — a false "not stamped" — against a legacy bare-string
  stamp). Run any such one-off script from outside a sandboxed shell (write
  it to a scratch path, not inline `-e`, since `tsx`'s IPC pipe needs
  `dangerouslyDisableSandbox: true` in this repo's sandbox).
- This skill's (`align-tactics`) own Idempotency section's
  `grep -rl '^  - <strategy-id>$' intentions/tactic-*.md` recipe, for a
  cheap sanity check that no *other* tactic references clarification
  content by stale ordinal (not required, just a useful cross-check if time
  allows).

## Verification

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```
```verify
npx vitest run --project packages/intentionsutil --root .
```

Prose:
- No clarification chain remains where a later entry silently contradicts
  an earlier one without a pointer; every folded topic has exactly one
  `###` section under `## Router Mechanism` stating the current rule.
- Every compressed (pointer-form) `clarifications:` entry still carries its
  original `question:` text verbatim and its original recorded date —
  diff the before/after array and confirm no date or question was altered
  or dropped, only the `answer:` text shortened to a pointer.
- The ~12 entries this plan leaves untouched still read as either genuinely
  undecided posture (conditions, scope, priority) or settled doctrine that
  is legitimately out of this tactic's router-mechanism + superseded-chain
  scope (see Context's note on this) — not settled *router mechanism* that
  should have been folded. If Unit 7 finds one that should have been
  folded, fold it there rather than leaving the gap for a future round.
- The strategy's `statement`, `rationale`, `success_signal`, `reading`,
  `gap`, `attributes.conditions`, and `serves` are byte-for-byte unchanged
  by this tactic — only `clarifications:` (compression) and the body
  (new sections) change in frontmatter/content terms.
- No child tactic of `strategy-graph-native-dispatch` is left with a
  stale, un-re-stamped `execution.strategy_fingerprint` entry after this
  lands (Unit 7's check).
