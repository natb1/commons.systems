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
gap: null
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
office_hours: null
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
