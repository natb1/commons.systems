---
id: tactic-graph-commit-snap-dir-merge-clobbers-original
kind: tactic
statement: check_base_freshness() and replay_snapshot_onto_base() now overwrite
  SNAP_DIR/<id>.md with the merge output on a resolved merge, destroying the
  writer's own original pre-merge content; on a later park for a DIFFERENT id in
  the same multi-id batch, park_write's recovery text points the human at
  SNAP_DIR/<id>.md claiming it holds the writer's unlanded content when it
  actually holds graph-commit's own already-landed merge blend, making the park
  record misattribute merged content to the writer and lose the original edit
owner: ai
status: raw
parent: null
rationale: null
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
  reason: "Cannot author a plan: the node's core premise was overtaken by a later
    author decision, and the replacement contract is unrecorded. Verified
    against fresh origin/main (HEAD 1f839db7 == origin/main). (1) The behavior
    this node calls a defect — check_base_freshness() copying the merge output
    over SNAP_DIR/<id>.md on a resolved merge (graph-commit:809-810), and the
    same pattern in replay_snapshot_onto_base() (:1203-1208) — is a deliberate
    contract landed by PR #2989 AFTER this draft was filed by that PR's own
    review-fix pass. graph-commit:794-808 rebuts this node's failure scenario
    verbatim: the refresh is done 'deliberately' so that park_and_exit()'s
    'preserved at $SNAP_DIR' message points at the RECONCILED content, 'the best
    available starting point for the manual merge — rather than at a stale
    pre-merge copy'. The same contract is asserted independently at :919-935
    (snapshot() header: 'SNAP_DIR is NOT a frozen pre-merge copy') and
    :2091-2098 (print_verdict reads SNAP_DIR as ground truth for what the run
    intended to land), and is pinned by regression tests:
    test-graph-commit.sh:2246-2287 is a self-described 'Unit 1 regression guard'
    proving the refresh stops the far-ahead rebuild from reverting a concurrent
    writer's landed edit, cases 49-51 guard Unit 2, and case 22 (:1551-1581)
    pins the unresolved half. The node's 'Recommended fix' (freeze SNAP_DIR;
    merges go to <id>.merged.md) directly reverses that decision and cannot be
    built without breaking cases 48-51 — weakening them is forbidden by
    .claude/rules/test-integrity.md. (2) The node's factual claim is also partly
    overstated and needs the author's re-validation, which the node itself asks
    for ('re-validating this provenance against what actually merged'):
    run_merge_node() is a three-way merge whose resolved output still carries
    the writer's own delta, so the writer's INTENT is not lost — only the exact
    pre-merge byte image — and the blend is not 'already-landed' content, since
    the batch fails closed and lands nothing. (3) Author ratification is needed
    on the clarification proposed by this round: which of three contracts binds
    SNAP_DIR on the park path — (a) PR #2989's reconciled intended-to-land
    content, (b) this node's frozen writer original beside a separate merged
    copy, or (c) neither, because the strategy's recorded condition that 'a park
    whose context lives only in the parking session is a defect' is violated by
    ANY machine-local pointer (park_write's own text at :2944-2952 concedes
    'this machine only — may not survive past this session'), which would
    re-scope this node toward carrying the losing writer's content in the node's
    office_hours record. The ruling also decides whether the third, unnamed
    clobber site in build_commit_plumbing() (:1650-1652, structurally identical
    and feeding the same park_write text) is in scope, and whether this node is
    plannable at all or should be dismissed as answered by #2989. Best next
    step: an author sitting rules (a)/(b)/(c); on (a) dismiss this node, on (b)
    or (c) re-plan its scope and rewrite the stale line citations in its body
    (535/811/629-635/1987-1996/1590 have all moved to
    793-811/1203-1208/919-935/1157-1211/2944-2952). Recording note: per the
    tactic-target contract this per-node round wrote nothing onto
    strategy-graph-native-dispatch — the proposed clarification above is NOT
    landed on the strategy and exists only in this round's transcript and in
    this park; a future /align interview or strategy-target /align-tactics round
    must land it."
  since: 2026-08-15
  recommendation: "Author sitting rules (a), (b) or (c) below; on (a) DISMISS this
    node, on (b) or (c) re-plan its scope and rewrite the stale line citations
    in its body (535 / 811 / 629-635 / 1987-1996 / 1590 have all moved to
    793-811 / 1203-1208 / 919-935 / 1157-1211 / 2944-2952). Then re-run
    /align-tactics on this node. PROPOSED CLARIFICATION FOR RATIFICATION:
    (Recorded 2026-08-14 /align-tactics tactic-mode drift review.) On
    graph-commit's fail-closed park path, what must SNAP_DIR/<id>.md hold for an
    id whose layer-3 merge RESOLVED earlier in the same multi-id invocation?
    Three candidate contracts are live and the strategy records none of them:
    (a) the reconciled intended-to-land blend — PR #2989's landed answer,
    defended in code at graph-commit:794-808, 919-935 and 2091-2098 and pinned
    by test-graph-commit.sh cases 48-51, and required by
    ensure_intentions_only_base()'s re-materialization from SNAP_DIR; (b) the
    writer's frozen pre-merge original beside a separate merged copy — the
    'Recommended fix' in tactic-graph-commit-snap-dir-merge-clobbers-original,
    which reverses (a); (c) neither — the writer's unlanded content belongs in
    the node's own office_hours record rather than behind a machine-local tmpdir
    pointer, per the recorded condition that 'a park whose context lives only in
    the parking session is a defect', which park_write's own text ('this machine
    only — may not survive past this session', graph-commit:2944-2952) fails.
    The author rules which contract binds; the answer also decides whether the
    third, unnamed clobber site in build_commit_plumbing()
    (graph-commit:1650-1652) is in scope and whether this node is plannable at
    all or should be dismissed. CONSEQUENCE FOR PR1: the serialized PR plan's
    PR1 carried this node as Unit 6 (freeze SNAP_DIR, merges to <id>.merged.md).
    That unit is DROPPED from PR1 and this node does NOT close with it — the
    prescribed fix cannot be built without breaking test-graph-commit.sh cases
    48-51, and .claude/rules/test-integrity.md forbids weakening a preserved
    regression guard. See plans/pr1-graph-write-path-brief.md. NOTE: per the
    tactic-target contract this per-node round wrote nothing onto
    strategy-graph-native-dispatch, so the proposed clarification above is NOT
    landed on the strategy; a future /align interview or strategy-target
    /align-tactics round must land it."
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# A resolved merge overwrites SNAP_DIR, destroying the only surviving copy of a losing writer's original intent for OTHER ids in the same park

## Provenance

- Surfaced by the `review-fix` pass on PR #2989 (source tactic
  `tactic-graph-commit-intentions-base-stale-restore`), red-team finder,
  disposition `Deferred` (out of scope for that PR — this is a pre-existing
  property of a primitive the PR extends to a new call site, not a defect
  introduced by the PR's own diff).
- Location: `packages/intentionsutil/scripts/graph-commit`, two call sites:
  `check_base_freshness()` around line 535 (`cp -- "$out_f" "$SNAP_DIR/$id.md"`)
  and `replay_snapshot_onto_base()` around line 811 (same pattern, new in
  PR #2989).

## Failure scenario

`SNAP_DIR` is documented as the only surviving copy of the writer's content on
every fail-closed park path (`graph-commit` comments around lines 629-635 and
1987-1996), and `park_write()`'s recovery text tells the human verbatim: "This
session's unlanded content is preserved at `${snapDir}/${id}.md`" (around line
1590). Both call sites above overwrite that same file with graph-commit's own
merge OUTPUT once a merge resolves, rather than keeping the writer's original
snapshot immutable.

Attack/accident path on a multi-id batch: writer W commits ids A and B.
Concurrent writer V lands a disjoint-field edit to A (this merges — so
`SNAP_DIR/A.md` gets overwritten with the merge output) and a same-field edit
to B (unresolvable). `park_and_exit()` then parks BOTH ids in the same
invocation, `git reset --hard FETCH_HEAD` wipes the worktree, and the park
recommendation for A points the human at a file that is no longer W's original
content but a machine merge already blended with V's. W's original intent for
A is unrecoverable, and — worse — is misattributed to W by the park record
(the file the recovery text names now holds someone else's landed content
mixed in). Because V chooses which field to touch, V controls which of W's ids
lose their evidence this way — not just an accidental loss, a targeted one if
V is adversarial.

## Adversarial verdict

This finding was surfaced by the red-team finder in the review-fix Workflow and
classified `Deferred` (advisory, not required for PR #2989) rather than
`Required` — it was not sent through the adversarial skeptic verify stage
(only `Required` findings are). It is filed here for triage, not pre-verified.

## Recommended fix

Keep the writer's original snapshot immutable and add the merged content
beside it rather than over it: `snapshot()` writes `$SNAP_DIR/<id>.md` (never
rewritten after), and the merge paths instead write
`$SNAP_DIR/<id>.merged.md`, which is what `ensure_intentions_only_base()`
replays. Point `park_write()`'s recommendation at both paths, labeling which is
the session's own original content and which is graph-commit's partial merge.

## Out of scope

Not addressed by PR #2989 (source: `tactic-graph-commit-intentions-base-stale-restore`).
This is a draft — a later `/align-tactics` round should finalize it into a
plannable tactic (or dismiss it) after re-validating this provenance against
what actually merged.
