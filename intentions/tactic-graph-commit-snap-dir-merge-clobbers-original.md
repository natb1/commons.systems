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

## Disposition — ruled 2026-08-15

Ruled **(b)** by clarification 241: keep the writer's original snapshot
immutable and put the merged content *beside* it, not over it. The
`## Recommended fix` above stands as written and is now the plannable shape.

The 2026-08-14 `/align-tactics` round parked this node claiming the fix "cannot
be built without breaking `test-graph-commit.sh` cases 48-51". **That claim was
wrong and is withdrawn.** The round under-weighted the second half of the
node's own fix — that `ensure_intentions_only_base()` replays
`<id>.merged.md`. With the replay preference in place:

- **Case 48** (the Unit 1 regression guard: *"far-ahead + stale `--base`:
  layer-3 merge survives the far-ahead rebuild, both fields land"*) passes
  unchanged — the rebuild replays `.merged.md`, which carries exactly the
  merged content `SNAP_DIR` carries today.
- **Case 22** (`:1551-1581`, `SNAP_DIR` retains the writer's original on an
  **unresolved** merge) is preserved by construction.

Only a naive freeze *without* the replay-preference half breaks them. No
preserved regression guard is weakened, so `.claude/rules/test-integrity.md`
is not engaged.

### Corrected anchors

Every line citation in the sections above predates PR #2989 and has moved:

| Cited above | Current |
|---|---|
| `535` (`check_base_freshness()` clobber) | `:809-810` |
| `811` (`replay_snapshot_onto_base()` clobber) | `:1203-1208` |
| `629-635` (`SNAP_DIR` is the sole surviving copy) | `:919-935` |
| `1987-1996` (same, second assertion) | `:1157-1211` |
| `1590` (`park_write()` recovery text) | `:2944-2952` |

### A third clobber site, named by nobody

`build_commit_plumbing()` clobbers `SNAP_DIR/<id>.md` at **`:1650-1652`** —
structurally identical to the other two and feeding the same `park_write()`
text. It is in scope. Neither this node nor
`plans/dispatch-rsi-serialized-pr-plan.md` names it.

### Readers that must change with the writers

Freezing the file is not enough; every consumer that means *"what this run
intended to land"* must prefer `.merged.md`:

- `ensure_intentions_only_base()`'s replay (the far-ahead rebuild).
- `print_verdict` (`:2091-2098`), which reads `SNAP_DIR` as ground truth for
  the run's intent.
- `park_write()` (`:2944-2952`), which must name **both** paths and label which
  is the session's own original and which is graph-commit's partial merge.

### Not adopted, still open

Candidate **(c)** — that the losing writer's content belongs in this node's own
`office_hours` record rather than behind any machine-local tmpdir pointer — was
**not** adopted, but its premise is sound: `park_write`'s own text concedes the
tmpdir is *"this machine only — may not survive past this session"*, which
fails the strategy's recorded condition that a park whose context lives only in
the parking session is a defect. (b) and (c) are complements, not substitutes.
File (c) as its own tactic; it is not part of this node's scope.

## Implementation record

Shipped in PR #3095, squash-merged to `main` as `fe0b1c4d`, under
`strategy-graph-native-dispatch` clarification **241**, ruling **(b)**:
`SNAP_DIR/<id>.md` is frozen as the writer's pre-merge original, and every merge
output is written beside it as `SNAP_DIR/<id>.merged.md`.

All **three** clobber sites were redirected — including `build_commit_plumbing()`
at `:1650-1652`, which neither this node nor
`plans/dispatch-rsi-serialized-pr-plan.md` names. The readers that mean *"what
this run intended to land"* (the far-ahead rebuild's replay, `print_verdict`,
and `park_write`) now resolve through `snap_intended_file`, and `park_write`
names both paths and labels which is the writer's own original and which is
graph-commit's partial merge.

Candidate **(c)** was not adopted, as ruled, and is filed as
`tactic-graph-commit-park-content-durability`. That node is `blocked_by` both
this one and `tactic-eval-finding-noop-verdict-hides-dropped-node-edit`, so it
becomes workable once the two of them close.
