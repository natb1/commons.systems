---
id: tactic-dispatch-conflict-branch-merge-lane
kind: tactic
statement: /dispatch-conflict gains Lane 3 — given a node id (or its
  provision-conflict hold id) it reproduces the live origin/main merge conflict
  on that node's branch, resolves it, verifies against the node's own `##
  Verification` block, and pushes — so provision exit-11 conflicts are resolved
  autonomously instead of striking out into a born-parked hold nothing can
  un-hold
owner: ai
status: codified
parent: null
rationale: "Recorded from the 2026-07-25 office-hours drain sweep (10 parked
  nodes reviewed, 6 drained) and finalized 2026-07-27. Provision exit 11 —
  'origin/main does not merge clean into this tactic's branch' — has fired 28
  times since 2026-07-15, 9 of them on 2026-07-25 alone. In that sweep the five
  highest-ranked non-curriculum, non-discovery parks were all exit-11
  branch-merge holds, and every one was resolved by hand in the drain session;
  four of the five needed no author judgment at all (two pure unions against an
  upstream commit touching adjacent lines, one take-origin/main's-copy of a
  superseded node file, one additive union), which makes them invalid parks
  under the no-autonomous-path doctrine — the graph already held the direction
  and only execution was owed. tactic-mechanical-park-producers (PR #2970,
  merged 2026-07-26) fixed the producer side: exit 11 no longer parks the
  source, it strikes locally up to CONFLICT_STRIKE_CAP=5 and then births a
  born-parked tactic-hold-conflict-* tactic with a blocked_by edge. That stopped
  the queue pollution but resolved no conflict — it landed without this lane and
  left the residue, so held sources now accumulate with nothing able to un-hold
  them, after up to four wasted ticks of identical blind retries. The
  consumer-side gap is real and unclaimed: /dispatch-conflict Lane 1 reproduces
  a live git conflict but accepts only issue-branch draft PRs, while Lane 2
  accepts a node id yet is driven entirely by graph-commit park text and takes a
  'wrong tool for this node' dead end when office_hours is null.
  tactic-graph-router-conflict-routing defers the shell layer to
  tactic-dispatch-conflict-greenfield, a node since pruned — this tactic is the
  successor of that dangling pointer. This round's drift review settled all
  three of the draft's open questions (a distinct Lane 3 rather than a widened
  Lane 2; sequencing after the merged producer; attempt config-carrying merges
  under the self-modification doctrine's fallback lane rather than refusing up
  front), so the draft is finalized to a full plan."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 96
  override: null
  rationale: "Author-directed 2026-07-26: boost to top rank, to unblock the
    provision exit-11 class that stalled the fleet on 2026-07-25/26 (28 exit-11
    events since 07-15, 9 on 07-25 alone; five of the drain sweep's top-ranked
    parks were this one hold, four of which needed no author judgment at all).
    Sized at 96 -- the graph's top AUTHORED band, matching the two other
    2026-07-26 top-rank directives -- so that composed with the +5 authored term
    it clears the 90/95 bands. Strict composed #1 is 387.33
    (tactic-scope-fingerprint-plan-substance), but that figure is a blocked_by
    compounding artifact of a four-node serialized chain rather than an authored
    rank, and matching it would need a raw boost of ~383, which schema rule 18
    rejects without the literal ACK string. That ACK was not sought, so the
    boost is capped at the authored band. Recorded 2026-07-27."
phase: review
execution:
  branch: tactic-dispatch-conflict-branch-merge-lane
  pr: 2977
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# /dispatch-conflict gains Lane 3 — given a node id (or its provision-conflict hold id) it reproduces the live origin/main merge conflict on that node's branch, resolves it, verifies against the node's own `## Verification` block, and pushes

## Context

A park (`office_hours` on a node) asserts that no autonomous path forward exists
and a human is required. A merge conflict between `origin/main` and a node's
branch does not meet that bar: the resolution is usually mechanical, and nothing
about it needs the author.

**What produces these conflicts.** `provision-node-worktree` gives every phase a
merged-tree guarantee: it runs `git merge --no-edit origin/main` in the node's
worktree and, on conflict, **aborts the merge, leaves the tree clean, and exits
11** (`.claude/skills/dispatch-propagate/scripts/provision-node-worktree:122-129`;
exit-code contract at `:26-46`). The caller,
`.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute` case 11
(`:215-277`), then spends up to `CONFLICT_STRIKE_CAP-1` = 4 consecutive ticks
re-running the identical blind provision (`:241-251`, cap defined at `:121-123`),
and only on the 5th strike escalates to `hold-node` (`:252-276`). Nothing in that
loop ever *resolves* the conflict — it only re-tries it.

**Historical measurement (2026-07-25 drain sweep — a dated snapshot, not live
state).** Of 112 parked nodes at that date, 37 were curriculum-reading entries
and 9 were discovery/decomposition entries; of the remaining 66, the five
highest-ranked were all provision exit-11 branch-merge holds:

| node | PR | conflict | judgment needed |
| --- | --- | --- | --- |
| `tactic-align-tactics-workflow` | 2931 | `.claude/skills/align-tactics/SKILL.md` | yes — where doctrine lives |
| `tactic-office-hours-pr-custody` | 2963 | `park-node`, `test-park-node.sh` | no — union |
| `tactic-align-tactics-mechanical-floor` | 2896 | a graph node file | no — take origin/main |
| `tactic-graph-commit-cwd-repo-resolution` | 2938 | `park-node`, `demote-node-to-implement` | no — union |
| `tactic-exercised-paths-reading` | 2857 | `read-sensors.ts` | no — additive union |

**Those five parks are not live state** — every one was resolved by hand and
cleared in that sweep. The table is retained as the dated evidence that four of
five needed no author judgment at all (two pure unions against an upstream commit
touching adjacent lines, one take-origin/main's-copy of a superseded node file,
one additive union): the graph already held the direction and only execution was
owed. `tactic-graph-commit-cwd-repo-resolution` is the sharpest evidence that the
class recurs rather than resolving itself — commit `e2c0fd81` records a
2026-07-23 drain that had already cleared that exact park once, and it was
re-parked the same day.

**The gap today.** `/dispatch-conflict`
(`.claude/skills/dispatch-conflict/SKILL.md`) has two lanes and neither covers a
live branch conflict on a node:

- **Lane 1** (`:99-328`) reproduces a live `origin/main` merge conflict in a
  worktree and resolves it — but its input contract is an issue-branch draft PR,
  reached only when the worktree branch matches `[0-9]*-*` (`:81-93`).
- **Lane 2** (`:329-571`) accepts a node id, but it services a `graph-commit`
  concurrent-edit park on an `intentions/*.md` node, with
  `office_hours.recommendation` as its only input (`:337-345`, `:384-405`). It
  does not reproduce a live git conflict.

The concrete current failure mode: a node worktree that invokes
`/dispatch-conflict` hits the preamble's node-id rule (`:72-74`), enters Lane 2,
reads the node off `origin/main` (`:347-361`), finds `office_hours == null`, and
takes the **"wrong tool for this node"** exit (`:373-382`) — a dead end. So a
node-branch code merge conflict has no lane at all.

What is missing is Lane 1's *behavior* reachable through Lane 2's *addressing*:
given a node id, merge `origin/main` into that node's branch, resolve, run the
node's own `## Verification` block, and push.

### Decisions recorded this round (2026-07-26/27 drift review) — do not re-open

**D1 — a distinct Lane 3, not a widened Lane 2.** Lane 3 is entered from the
existing lane-select preamble (`SKILL.md:66-97`) and shares Lane 2's
fresh-`origin/main` node read (`SKILL.md:355-361`, the
`git archive origin/main … | tar -xO` idiom). It shares nothing else: Lane 2's
entire procedure is park-text-driven, while Lane 3's input is a live git tree, so
folding them would yield a two-headed lane gated on a state sniff. The
discriminator is cheap and total:

1. `office_hours.reason` begins with the literal `graph-commit: mechanical-unresolved`
   → **Lane 2**, unchanged.
2. `attributes.hold_kind == "provision-conflict"` → dereference
   `attributes.hold_for` to the source id → **Lane 3** against the source.
3. Otherwise, a source node carrying an `execution.branch`/`execution.pr` whose
   `git merge origin/main` fails → **Lane 3**.
4. Otherwise → the existing "wrong tool for this node" report-and-stop.

Lane 2's current dead-end exit (`SKILL.md:373-382`) becomes the router into
Lane 3 rather than a terminal state.

**D2 — this lands after `tactic-mechanical-park-producers`, which merged
2026-07-26 (PR #2970; that node is now `status: codified`, `phase: main-qa`).**
Repo state decided the sequencing, not the author. The producer landed *without*
this lane and left the residue. Four consequences bind this plan:

- The source node's `office_hours` is **never written** for a provision conflict
  any more (`hold-node`'s absence of a source park is load-bearing —
  `packages/intentionsutil/scripts/hold-node:9-15`). There is no park text to
  consume. Lane 3's input is live git state.
- The input contract accepts **a source id OR a hold id**. The hold id is
  deterministic: `tactic-hold-<kindSlug>-<source-id minus its leading "tactic-">`,
  and `KIND_SLUGS["provision-conflict"] === "conflict"`, so the concrete shape is
  **`tactic-hold-conflict-<source-without-tactic-prefix>`**
  (`packages/intentionsutil/scripts/hold-node-decide.ts:53-60`, `:105-119`). The
  hold carries `office_hours` plus `attributes.hold_for` / `attributes.hold_kind`
  (`hold-node-decide.ts:163-172`).
- Success against a **held** source is a **two-part graph write**, and
  `hold-node-decide.ts`'s `RESOLUTION_SENTENCE` (`:74-76`) is explicit that
  clearing the park alone does **not** unblock the source: the hold must reach
  `phase: done` *and* the source's `blocked_by` edge naming it must go. These two
  writes must be **split and each verified against `origin/main` after landing**,
  because `graph-commit`'s layer-2 structural merge can silently drop a field
  **removal** under contention while reporting success
  (`packages/intentionsutil/scripts/graph-commit:993-1004`).
- The wiring must **not extend** `dispatch-graph-execute` case 11's strike logic.
  That branch carries a CONVERGENCE NOTE (`:224-234`) declaring itself interim and
  to be replaced wholesale when `tactic-graph-router-conflict-routing` lands.
  Route to the lane **before** striking, leaving the hold as the lane's own
  escalation when the resolver returns `ambiguous`. That also retires the up-to-4
  wasted ticks the cap currently spends on identical blind retries.

**D3 — a config-carrying merge is attempted, not refused up front.** This
**reverses** the draft's former "the config-commit gate is NOT in scope" boundary.
`strategy-graph-native-dispatch`'s self-modification doctrine (clarification entry
41, recorded 2026-07-07, §Other Settled Mechanism) has two lanes; its primary lane
— detect self-modifying scope at decomposition and born-park — structurally cannot
fire here, because the `.claude/**` content arrives from the **upstream** side of
the merge, not from the node's own plan. Its fallback lane governs instead, and it
is quoted verbatim from that strategy body:

> Fallback lane: a tactic that slips through is attempted by the worker, which
> completes all non-config work and parks on the commit denial with the branch
> staged, for a mostly-automated office-hours drain where the human's only
> interaction is approving the self-modification permission prompt.

Early *detection* stays in scope — for classification and park composition, not
for bailing out. Two constraints follow:

- **No `.claude/**`-touching-change predicate exists anywhere in the repo**
  (grep-confirmed across `.claude/skills/dispatch-propagate/scripts` and
  `packages/intentionsutil`; the only matches are literal script paths). The
  closest existing shape is `get-changed-apps.sh:46-58`'s
  `git diff --name-only "$BASE"...HEAD | resolve_dirty_apps`
  (`lib.sh:2064`). The lane must add one. The harness permission classifier
  enforces the gate at commit time and cannot be asked in advance.
- **A staged tree is not durable state.** So the config-grant park must record
  both the conflicted paths **and the resolution actually applied** in
  `office_hours.recommendation`, so a fresh session can reproduce it without the
  parking session. Per `packages/intentionsutil/scripts/park-node:36-41` a park
  must carry **both** `reason` and `recommendation` — the script never folds one
  into the other. This config-grant park is a genuine human state and belongs on
  the **source node's own** `office_hours`, not on a mechanical hold.

### Additional settled design rules

- **Node-file conflicts get a distinct rule.** When the conflicted path is
  `intentions/*.md`, `origin/main`'s copy is authoritative: the branch copy
  structurally cannot carry node state, because graph writes are direct-push,
  `intentions/`-only, onto `origin/main`. Clobbering main's newer `office_hours` /
  `phase` / `blocked_by` / freshness fields is the stale-worktree-revert defect.
  Default to main's side; the branch side survives only where it authored real
  plan intent.
- **Verify, do not just grep for conflict markers.**
  `.claude/skills/dispatch-propagate/scripts/dispatch-run-verification` already
  exists with exactly the needed contract: it reads the full node markdown on
  **stdin**, extracts fenced ` ```verify ` blocks that sit under an **H2**
  `## Verification` heading, and runs each via `bash` in the current working
  directory (`:1-36`, `:93-134`). Exit codes: 0 all passed, 1 first failure, 3 no
  Verification section or no verify blocks (proceed unchanged), 4 empty stdin,
  5 unclosed fence (`:17-33`). It enters the section only on an H2 heading
  (`:96`). The motivating case is live and still in the tree: upstream renamed
  `readFrontierSensors` → `readStoreSensors`
  (`packages/intentionsutil/scripts/read-sensors.ts:966`, `:1024`), so
  `tactic-exercised-paths-reading`'s test file merged textually clean and failed
  at runtime.
- **Entry-path-agnostic.** Lane 3 takes a node id and reads live git state; it is
  not coupled to the strike counter. `tactic-graph-router-conflict-routing`
  (`status: codified`, `phase: implement`, `blocked_by: []`) covers only the
  router/selector side and explicitly defers the shell layer; its future
  `execution.conflict` interrupt is a second entry path into the same lane.
- **`validate-graph` false-fails on an uncommitted merge** — `deletedNodeIds()`
  traverses HEAD, so prose refs to nodes pruned upstream dangle until the merge
  commit exists. Lane 3 commits the merge first, or recognizes the artifact
  instead of treating it as a defect.

### Relationship to the siblings (this is not a duplicate)

- `tactic-mechanical-park-producers` — **merged 2026-07-26, PR #2970**
  (`status: codified`, `phase: main-qa`). It fixed the **producer** side: provision
  exit 11 and the fix-attempt cap now emit a `blocked_by` edge against a tracked
  born-parked hold tactic instead of setting `office_hours` on the source. That
  stopped the queue pollution but resolved no conflict — something must still
  perform the merge. It landed **without** this lane, so the residue it leaves is
  a growing set of held sources nothing can un-hold autonomously. This node is
  that something.
- `tactic-graph-router-conflict-routing` (`status: codified`, `phase: implement`,
  `execution: null`, `blocked_by: []`) adds the **router seam**: a mergeable
  sensor plus an orthogonal `execution.conflict` interrupt. Its body defers the
  shell layer to `tactic-dispatch-conflict-greenfield` — **a node that has since
  been pruned**, so that pointer dangles. (The merged producer's body makes the
  same dangling reference.) Plainly: **this node is the successor of that dangling
  pointer.** Both siblings presuppose this lane; neither contains it.

### Note on this tactic's own scope

Every file this PR changes is agent-behavior config (`.claude/skills/**`) or a
`packages/intentionsutil` script invoked by it. Under the self-modification
doctrine's **primary** lane the tactic would be born-parked; this round finalizes
it to `phase: implement` instead, so it takes the **fallback** lane quoted above:
the worker completes the work and parks on the commit denial with the branch
staged, and an office-hours drain supplies the permission grant. Implementers
should expect the commit of `.claude/**` changes to be denied in auto mode and
should park with a reproducible recommendation rather than attempting to route
around the gate.

**Sizing note.** This fits one PR: four units, three of which are single-file, and
the largest (Unit 3) is skill prose with no runtime surface of its own.

---

### Unit 1 — a config-scope predicate: `dispatch-config-scope`

**Scope.** Add
`.claude/skills/dispatch-propagate/scripts/dispatch-config-scope` (new,
executable bash) plus its test
`.claude/skills/dispatch-propagate/scripts/test-dispatch-config-scope.sh` (new).

Contract:

- Reads newline-separated repo-relative paths on **stdin** (the
  `dispatch-run-verification` stdin design — no gh, no network, so it is
  unit-testable without mocks).
- Writes to stdout the subset of those paths that are agent-behavior config:
  anything under `.claude/`, plus a top-level or nested `settings.json` /
  `settings.local.json` under `.claude/`. Match on path prefix only; do not read
  file contents.
- Exit 0 when the subset is empty, **exit 1 when it is non-empty** (a predicate:
  "this change set is self-modifying"), exit 2 on any unexpected argument.
  Follow `.claude/rules/code-style.md` — a clear error, never a silent fallback.
- Empty stdin is exit 0 with no output (an empty change set is genuinely not
  config-touching); this deliberately differs from
  `dispatch-run-verification`'s exit 4, because there is no upstream producer
  whose failure would be masked.

The test asserts, at minimum: a `packages/**`-only list exits 0 with empty
stdout; a list containing `.claude/skills/foo/SKILL.md` exits 1 and echoes only
that path; a mixed list echoes only the config paths; `.claudeignore`-style
near-misses (a path merely *starting with* `.claude` but not `.claude/`) do not
match; an unexpected argument exits 2. Model the test on the existing harness
shape in
`.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh` and
source `test-helpers.sh` for `assert_eq` / `assert_contains`.

**Out of scope.** Any attempt to *ask* the permission classifier in advance
(impossible); any change to `resolve_dirty_apps` (`lib.sh:2064`) or
`get-changed-apps.sh`; wiring the predicate into any caller (Unit 3 does that).

**Recommended model.** `sonnet`

---

### Unit 2 — `resolve-hold`: the scripted inverse of `hold-node`

**Scope.** Add `packages/intentionsutil/scripts/resolve-hold` (new, executable
bash) plus its test
`.claude/skills/dispatch-propagate/scripts/test-resolve-hold.sh` (new — that
directory's `test-*.sh` loop is what CI runs; see
`.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:186-204`).

`hold-node` has no scripted inverse, exactly as `park-node` had none before
`clear-park` was added (`packages/intentionsutil/scripts/clear-park:1-45`
records that rationale). Lane 3 needs one, and hand-rolling the sequence inline
is precisely the unreliable shape `clear-park`'s header rejects.

Usage: `resolve-hold <source-node-id>`. Behavior:

1. Derive the hold id the same way `hold-node` does — **by asking
   `hold-node-decide.ts`**, never by re-deriving the slug map locally
   (`hold-node:138-149` documents why duplicating `KIND_SLUGS` would be a second
   source of truth). For a provision conflict that id is
   `tactic-hold-conflict-<source minus "tactic-">`
   (`hold-node-decide.ts:53-60`, `:105-119`).
2. `git fetch origin main`, then refresh both node files from `origin/main`
   before reading — the fresh-`origin/main` invariant `hold-node:118-136` and
   `clear-park` both implement. Capture each file's blob sha for `--base`.
3. **Write A** — resolve the hold: `office_hours = null` **and**
   `phase = "done"`. Both are required: `RESOLUTION_SENTENCE`
   (`hold-node-decide.ts:74-76`) states that clearing `office_hours` alone does
   not unblock the source. Land via `write-node.ts` + `graph-commit --base
   <hold-id>=<blob>` (`graph-commit:31-32`, `:47-50`).
4. **Verify A** — re-read the hold off `origin/main` and assert
   `office_hours == null && phase == "done"`. Non-zero exit with a clear message
   if not.
5. **Write B** — remove the hold id from the source's `blocked_by` array, via
   `dump-node.ts` → `jq` → `write-node.ts` → `graph-commit --base
   <source-id>=<blob>` (the exact shape `hold-node:281-299` uses to *add* the
   edge).
6. **Verify B** — re-read the source off `origin/main` and assert the hold id is
   **absent** from `blocked_by`.

**Writes A and B are deliberately SPLIT into two `graph-commit` invocations, and
each is verified after landing.** This diverges from `hold-node`'s
single-commit shape (`hold-node:301-323`) on purpose: `graph-commit`'s layer-2
structural field merge can silently drop a field **removal** under contention
while reporting success (`graph-commit:993-1004`), and `blocked_by` removal is
exactly that shape. Splitting keeps the removal isolated, and the post-land
re-read off `origin/main` is what actually catches a dropped removal. Do not
"simplify" this back into one commit.

Rollback discipline: mirror `hold-node:196-215` / `clear-park` — every exit path
that does not land restores `intentions/<id>.md` to the state the script found
it in, so a failed run never leaves a dirty node file that would trip
`graph-commit`'s `assert_clean_outside_ids` guard for unrelated nodes.

Exit codes, following `hold-node:48-51`: 0 resolved and landed; 1 a write,
compare-and-swap, or post-land verification failed; 2 usage error. Stdout on
success: one line, `resolved <hold-id> (unblocked <source-id>)`. If the hold does
not exist on `origin/main`, or already has `office_hours == null` and
`phase == "done"` and the source carries no edge, exit 0 as an idempotent no-op
with an informative note (the `clear-park` idempotent-no-op convention).

Pruning the hold node is **out of scope** for this script — a prune while an
inbound `blocked_by` still names the hold is rejected by `validate-graph`, and
prune ordering belongs to the census lane, not to a per-conflict resolution.

The test drives the script against a temporary intentions store with stubbed
`graph-commit` / `git`, and must cover: the happy path (two commits, in order,
with the right `--base` tokens); a Write-B land that reports success but leaves
the edge present on re-read → exit 1 (the layer-2 dropped-removal case); a
missing hold → idempotent exit 0; a usage error → exit 2. Extend
`packages/intentionsutil/test/hold-node-decide.test.ts` only if the id-derivation
path needs a new assertion; do not restructure that suite.

**Out of scope.** Any change to `hold-node`, `park-node`, `clear-park`, or
`graph-commit` themselves.

**Recommended model.** `opus`

---

### Unit 3 — Lane 3 in `.claude/skills/dispatch-conflict/SKILL.md`

**Dependencies.** Units 1 and 2 (Lane 3 calls both).

**Scope.** Edit `.claude/skills/dispatch-conflict/SKILL.md` only:

1. **Header and description** (`:1-42`): the skill now has **three** lanes.
   Update the frontmatter `description`, the two-lane sentence at `:28-34`, and
   the lane list at `:45-55`.
2. **Preamble** (`:66-97`): after a non-numeric `ARGUMENTS` or a non-issue branch
   sets `NODE_ID`, apply the D1 four-way discriminator above. Rules 2 and 3 in the
   bash block at `:81-93` stay as they are — the discriminator runs *after* the
   node id is known, since it needs the node read.
3. **Lane 2's node read** (`:347-371`) is factored into a shared "read the node
   off fresh `origin/main`" step both Lane 2 and Lane 3 enter through. Keep the
   `git archive origin/main … | tar -xO` idiom, the
   `dangerouslyDisableSandbox: true` requirement, and the loud `exit 1` when the
   file is absent on `origin/main`, verbatim.
4. **Lane 2's dead-end exit** (`:373-382`) becomes the **router**: when the
   `graph-commit: mechanical-unresolved` marker does not match, fall through to
   the discriminator's cases 2/3 rather than reporting "wrong tool". Only case 4
   (no hold, no branch conflict) keeps the report-and-stop text.
5. **New `## Lane 3 — node-branch git conflict` section**, placed after Lane 2.
   It is Lane 1's body re-addressed to the node's branch:
   - **Resolve the target.** A hold id (`attributes.hold_kind ==
     "provision-conflict"`) dereferences via `attributes.hold_for` to the source
     id; a source id is used directly. Enter
     `<project-root>/.claude/worktrees/<source-id>` — provision exit 11 leaves the
     worktree and branch in place with the merge already **aborted** and the tree
     clean (`provision-node-worktree:122-129`), so the lane must **re-run**
     `git merge --no-edit origin/main` to reproduce the markers.
   - **Resolve the PR, if any.** Exit 11 fires *before* the CI-ready gate
     (`provision-node-worktree:125` vs `:131-143`), so there may be **no PR** —
     the `implement`-phase case. Resolve it with `dispatch-ci-ready`, which
     matches a PR by exact `headRefName` (`dispatch-ci-ready:55`; node branches
     are named after the node id), and read `.mergeable` via
     `gh_pr_view_rest` in `.claude/skills/dispatch-propagate/scripts/lib.sh:1097`,
     whose `MERGEABLE`/`CONFLICTING`/`UNKNOWN` remap is at `:1135-1141`. Carry
     `PR_NUM` forward and guard every PR-scoped step on it, exactly as Lane 1
     does (`SKILL.md:116-121`).
   - **Reproduce** with `git merge --no-edit origin/main`, then capture the
     conflicted set with `git diff --name-only --diff-filter=U` **before**
     resolving (Lane 1's `:123-149`). Carry the list; staging later is scoped to
     exactly these paths. Keep Lane 1's *already-up-to-date* sub-case (`:134-140`)
     — a stale `mergeable` with nothing to resolve.
   - **Classify the conflicted set** by piping it through Unit 1's
     `dispatch-config-scope`. A non-empty config subset does **not** abort:
     record it and continue (D3).
   - **Resolve.** Take the contamination-guard baseline
     (`subagent-contamination-guard baseline dispatch-conflict`), launch an
     `opus` subagent with the same untrusted-data fence and the same
     `resolved` / `ambiguous <reason>` verdict contract Lane 1 specifies
     (`SKILL.md:202-241`), then run the guard check. Reuse that text; do not
     invent a second contract. Add two Lane-3-specific resolution rules to the
     subagent's brief: the **`intentions/*.md` rule** (origin/main's copy is
     authoritative; the branch copy structurally cannot carry node state, so
     default to main's side and keep the branch side only where it authored real
     plan intent), and **treat "upstream already did this" as a first-class
     outcome** that reports supersession rather than forcing a merge. For each
     conflicted file the subagent may read both sides' history via
     `git log --oneline origin/main..HEAD -- <file>` and
     `git log --oneline HEAD..origin/main -- <file>`.
   - **`resolved` — stage, verify, commit, push.** Stage only the captured
     conflicted paths, run `git diff --cached --check`, and grep the staged files
     for surviving `<<<<<<<` / `=======` / `>>>>>>>` markers; any marker
     downgrades the verdict to `ambiguous` (Lane 1's `:242-263`). Then
     `git commit --no-edit` — **commit before running verification**, so
     `validate-graph`'s `deletedNodeIds()` HEAD traversal does not false-fail on
     prose refs to upstream-pruned nodes.
   - **Verify against the node's own plan.** Pipe the node's markdown (the fresh
     `origin/main` copy already read) into `dispatch-run-verification` from the
     worktree root. Branch on its exit codes (`dispatch-run-verification:17-33`):
     **0** proceed; **3** proceed unchanged (no `## Verification` H2, or no
     `verify` blocks); **1** treat as `ambiguous` — a textually clean merge that
     fails the node's own tests is exactly the `readFrontierSensors` →
     `readStoreSensors` semantic conflict
     (`packages/intentionsutil/scripts/read-sensors.ts:966`, `:1024`); **4** and
     **5** are loud errors (empty input / malformed plan), not proceed signals.
     State explicitly that the section must be an **H2** `## Verification` for the
     script to enter it (`dispatch-run-verification:96`).
   - **Push** `git push origin HEAD` only when `PR_NUM` is non-empty, so GitHub
     recomputes `mergeable`; with no PR the merge commit stays local for the
     `implement` phase to push (Lane 1's `:270-282`).
   - **Un-hold.** When the entry was a hold (or the source carries a
     `blocked_by` edge naming its `tactic-hold-conflict-*` node), call Unit 2's
     `packages/intentionsutil/scripts/resolve-hold <source-id>` and treat a
     non-zero exit as a hard stop — do not write a phase marker on top of a
     failed un-hold.
   - **Mark.** `dispatch-mark-complete --phase fix-conflicts` (no `--pr` on the
     node lane), matching Lane 2's node-lane marker discipline
     (`SKILL.md:504-514`).
   - **Config-grant park** (D3). When `dispatch-config-scope` reported a
     non-empty subset and the commit is denied by the permission classifier: do
     **not** discard the resolution. Park the **source node** — not the hold — via
     `packages/intentionsutil/scripts/park-node`, passing **both** a `reason` and
     a `recommendation` (`park-node:36-41`; the script never folds one into the
     other). The `recommendation` must be reproducible from cold: the conflicted
     paths, the config subset, and **the resolution actually applied per file**,
     because the staged tree is not durable state. Run
     `.claude/skills/dispatch-propagate/escalation-recommend.md` first, as Lane 1
     Step 7 does. State plainly that this is the self-modification doctrine's
     fallback lane, and that the human's only interaction is approving the
     permission prompt.
   - **`ambiguous <reason>`** — `git merge --abort`, run
     `escalation-recommend.md` (retained: Lane 1 Step 7 calls it; Lane 2 skips it
     only because `graph-commit` had already composed a recommendation), and leave
     the **hold** as the escalation surface. If no hold exists yet, create one via
     `packages/intentionsutil/scripts/hold-node <source-id> --kind
     provision-conflict --reason-file … --recommendation-file …`
     (`hold-node:33-51`). Write **no** phase-completed marker.

**Out of scope.** Any change to Lane 1's steps; any change to Lane 2's
recommendation parsing, reconciliation subagent, or write-back; the
`fix-conflicts-attempt-<n>` PR label (Lane 1 keeps it — the node lane has no PR
label and its attempt state lives on the hold/graph state instead); any script
edit (Units 1, 2, 4 own those).

**Recommended model.** `opus`

---

### Unit 4 — route case 11 to the lane before striking, and correct the false comment

**Dependencies.** Unit 3 (the lane must exist before the router points at it).

**Scope.** Edit
`.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute` case 11
(`:215-277`) and extend
`.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh`.

1. **Correct the CONVERGENCE NOTE's false assertion.** Lines `:231-234` claim
   "/dispatch-conflict does NOT accept node targets (dispatch-conflict/SKILL.md
   exits on any non-`[0-9]*-*` branch), so a graph node's conflict cannot route
   there yet either way". That is **already false in shipped code** — the
   preamble at `SKILL.md:66-97` routes node ids into Lane 2 today. Replace those
   lines with an accurate statement of the new routing. Keep the rest of the
   CONVERGENCE NOTE (`:224-230`) intact: this branch is still interim and still
   expected to be replaced wholesale by `tactic-graph-router-conflict-routing`.
2. **Route before striking.** On exit 11, spawn a `/dispatch-conflict <id>` job
   in the node's worktree (`$PROJECT_ROOT/.claude/worktrees/$id` — deterministic
   even though `provision-node-worktree` prints its path only on exit 0) using the
   same `dispatch-spawn-job --no-verify --name "$id" --cwd … --model "$ORCH_MODEL"`
   shape the exit-0 path uses (`:197-207`), and report a new disposition
   (`conflict-lane $id`). Clear the reservation on a successful spawn, exactly as
   the exit-0 path does; on spawn failure leave the reservation for the sweep and
   count a failure, as `:203-207` does.
3. **Do not extend the strike logic.** Leave `CONFLICT_STRIKE_CAP` (`:121-123`),
   the `.conflict-strikes` sidecar (`:241-251`), and the `hold-node` escalation
   (`:252-276`) in place as the backstop for the case where the lane itself cannot
   be launched — but the lane, not the counter, is now the first responder, which
   is what retires the up-to-4 blind retries. The exit-0 path's
   `rm -f …conflict-strikes` reset (`:192-196`) is unchanged.
4. **Tests.** Extend `test-dispatch-graph-execute.sh` (its case-11 coverage is at
   `:184-228`): a first exit-11 now spawns the conflict lane and writes **no**
   strike file and **no** `hold-node` call; a spawn failure still yields
   `failed … spawn-failed` and exit 1; the existing accumulate-to-cap and
   hold-failure cases are re-expressed against whatever backstop path survives.
   Do not weaken or delete an existing assertion to make the suite green — per
   `.claude/rules/test-integrity.md`, re-express it or escalate.

**Out of scope.** `provision-node-worktree` (its exit-11 contract is unchanged);
cases 0, 10, 12, 13; the selector; `tactic-graph-router-conflict-routing`'s
`execution.conflict` interrupt.

**Recommended model.** `opus`

## Reuse

- `.claude/skills/dispatch-conflict/SKILL.md:123-149` — Lane 1's reproduce +
  `git diff --name-only --diff-filter=U` capture, and its
  already-up-to-date sub-case at `:134-140`.
- `.claude/skills/dispatch-conflict/SKILL.md:202-241` — Lane 1's opus resolver:
  the contamination-guard baseline/check bracket, the untrusted-data fence, and
  the `resolved` / `ambiguous <reason>` verdict contract.
- `.claude/skills/dispatch-conflict/SKILL.md:242-302` — Lane 1's stage-only-
  conflicted-paths, `git diff --cached --check`, marker grep, commit, and
  PR-guarded push.
- `.claude/skills/dispatch-conflict/SKILL.md:355-361` — Lane 2's fresh-
  `origin/main` node read (`git archive origin/main … | tar -xO`).
- `.claude/skills/dispatch-propagate/escalation-recommend.md` — the in-session
  recommend step before any fresh park.
- `.claude/skills/dispatch-propagate/scripts/dispatch-run-verification` — runs
  the node's own ` ```verify ` blocks from stdin; exit contract at `:17-33`, H2
  gate at `:96`.
- `.claude/skills/dispatch-propagate/scripts/provision-node-worktree:122-129` —
  the exit-11 producer; merge already aborted, tree clean, worktree retained.
- `.claude/skills/dispatch-propagate/scripts/dispatch-ci-ready:55` — resolves a
  PR by exact `headRefName` match.
- `.claude/skills/dispatch-propagate/scripts/lib.sh:1097` (`gh_pr_view_rest`),
  mergeable remap at `:1135-1141`.
- `.claude/skills/dispatch-propagate/scripts/lib.sh:2064` (`resolve_dirty_apps`)
  and `get-changed-apps.sh:46-58` — the closest existing path-classification
  shape for Unit 1 to model.
- `.claude/skills/dispatch-propagate/scripts/subagent-contamination-guard`,
  `dispatch-mark-complete`, `dispatch-mark-deviation`, `dispatch-spawn-job`.
- `packages/intentionsutil/scripts/hold-node` and `hold-node-decide.ts` — the
  landed escalation primitive; id scheme at `hold-node-decide.ts:105-119`,
  `RESOLUTION_SENTENCE` at `:74-76`, hold `attributes` at `:163-172`, the
  add-the-edge write shape at `hold-node:281-299`, the one-commit land at
  `hold-node:301-323`, rollback trap at `:196-215`.
- `packages/intentionsutil/scripts/park-node` (`:36-41`, the reason +
  recommendation contract) and `clear-park` (`:1-45`, the fresh-main + idempotent
  no-op + rollback conventions Unit 2 mirrors).
- `packages/intentionsutil/scripts/graph-commit` — the sole landing path for
  `intentions/*.md`; `--base` compare-and-swap at `:47-50`, the layer-2 caveat at
  `:993-1004`.
- `packages/intentionsutil/scripts/dump-node.ts` / `write-node.ts` — the
  read/mutate/write pair for node JSON.
- `.claude/skills/dispatch-propagate/scripts/test-helpers.sh` and
  `test-dispatch-graph-execute.sh` — the shell-test harness shape; CI's runner
  loop is `run-unit-tests.sh:186-204`.
- `packages/intentionsutil/test/hold-node-decide.test.ts` — the existing vitest
  coverage for the decision half.

## Verification

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-config-scope.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-resolve-hold.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh
```

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
# The corrected CONVERGENCE NOTE must no longer assert the false claim.
if grep -q "does NOT accept node targets" .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute; then
  echo "dispatch-graph-execute still carries the false 'does NOT accept node targets' claim" >&2
  exit 1
fi
```

Manual and judgment checks:

- **End-to-end rehearsal against a real held node.** Pick a source with an open
  `tactic-hold-conflict-*` hold (or manufacture one on a scratch branch by
  committing a change that conflicts with `origin/main`). Run
  `/dispatch-conflict <source-id>` from that node's worktree and confirm: the
  discriminator selects Lane 3; the merge is reproduced; the resolution commits;
  `dispatch-run-verification` runs the node's own blocks; `resolve-hold` lands
  **two** commits; and a fresh `git show origin/main:intentions/<source-id>.md`
  shows the hold id gone from `blocked_by`. The post-land re-read is the check
  that matters — a `graph-commit` success message is not evidence the removal
  landed.
- **Hold-id entry path.** Repeat the rehearsal invoking
  `/dispatch-conflict tactic-hold-conflict-<source-without-tactic-prefix>` and
  confirm it dereferences `attributes.hold_for` to the same source and behaves
  identically.
- **Node-file conflict rule.** Construct a conflict on an `intentions/*.md` file
  where `origin/main` carries a newer `office_hours` / `phase` and the branch
  carries a stale copy. Confirm the resolution keeps main's side and does not
  revert those fields — this is the stale-worktree-revert defect the rule exists
  to prevent.
- **Semantic-conflict catch.** Construct a textually clean merge that breaks a
  node's own named test (the `readFrontierSensors` → `readStoreSensors` shape).
  Confirm `dispatch-run-verification` exits 1 and the lane downgrades to
  `ambiguous` rather than pushing.
- **Config-carrying merge (observe in production).** On a branch whose
  `origin/main` merge pulls in `.claude/skills/**`, confirm the lane completes the
  resolution, `dispatch-config-scope` flags the config subset, the commit denial
  is caught, and the **source** node is parked with a `recommendation` that names
  the conflicted paths *and* the resolution applied per file — reproducible by a
  fresh session with no access to the parking session's staged tree. Verify by
  reading the parked node from `origin/main` and asking whether the recommendation
  alone is sufficient.
- **No blind-retry regression.** After Unit 4, watch a live exit-11 tick and
  confirm the conflict lane launches on the **first** occurrence — no
  `.conflict-strikes` sidecar is created on the routed path.
- **`validate-graph` ordering.** Confirm the merge is committed before any
  `validate-graph` run, so `deletedNodeIds()`'s HEAD traversal does not false-fail
  on prose refs to nodes pruned upstream.

## needs-main residue

Recorded by `/qa-fix` (PR #2977, attempt 0) — machine/browser-verifiable items
this PR's own Verification section documented as a planned deferral to a
follow-up drain/observation pass against a live conflicted/held node. Drained
after `review → main-qa` fires post-merge.

- **item-8 — End-to-end Lane 3 rehearsal against a real held node.** URL path:
  n/a. Expected outcome: Lane 3 resolves a genuine `origin/main` merge conflict
  on a real held node's branch end-to-end: reproduce, resolve, verify against
  the node's own plan, push, un-hold, mark `fix-conflicts` complete. Finding: no
  live conflicted/held node existed in the QA session to rehearse against.
- **item-9 — Hold-id entry path resolves to the source node.** URL path: n/a.
  Expected outcome: entering Lane 3 via a provision-conflict hold id
  dereferences to the correct source node and behaves identically to entering
  via the source id directly. Finding: no real hold/source pair existed in the
  QA session to exercise.
- **item-10 — `intentions/*.md` node-file conflict rule and semantic-conflict/supersession catch.**
  URL path: n/a. Expected outcome: the opus resolver defaults to `origin/main`'s
  copy on `intentions/*.md` conflicts, treats upstream supersession as a
  first-class outcome, and `dispatch-run-verification` catches a
  textually-clean-but-semantically-broken merge as ambiguous. Finding: these are
  opus-subagent judgment behaviors requiring a real conflicted merge to
  exercise; none existed in the QA session.
- **item-11 — Config-carrying-merge park path and `validate-graph` ordering.**
  URL path: n/a. Expected outcome: a config-carrying merge is attempted rather
  than refused, parks the source node with a reproducible reason+recommendation
  on commit denial, and the two-write `resolve-hold` sequence never leaves a
  `validate-graph`-rejecting intermediate state. Finding: requires a live
  auto-mode commit-denial path and a genuine two-write graph sequence to
  observe; neither was reproducible in the QA session.
- **item-12 — No-blind-retry regression on a live fleet tick.** URL path: n/a.
  Expected outcome: a live provision exit-11 tick spawns the conflict lane on
  the first occurrence with zero strikes consumed, and the strike-then-hold
  ladder still engages when the lane itself cannot be launched. Finding: only
  observable against the running dispatch fleet's own ticks; not reproducible
  in the QA session.
