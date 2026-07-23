---
id: tactic-office-hours-pr-custody
kind: tactic
statement: "Escalation parks keep custody of their PR: park-node records
  execution.pr from the escalating session's already-resolved PR number
  (gh-free, passed in), and a new resolve-park primitive lets office-hours
  resolution ratify (mark ready) or reject (close) the PR before clearing the
  park"
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-23 office-hours drain round: the dominant
  failure pattern across 3 of 10 parked nodes was an escalation park leaving its
  green PR in draft with execution.pr unrecorded, so a later session re-derived
  from scratch and re-parked — silently overriding a decision the author had
  already made."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 3
  override: null
  rationale: "Author-directed 2026-07-23 /align-strategy round: the top-3 systemic
    gaps (PR custody, scripted census, playwright retry) rank ahead of the
    low-urgency tracked gaps once finalized."
phase: qa
execution:
  branch: tactic-office-hours-pr-custody
  pr: 2963
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Escalation parks keep custody of their PR: park-node records execution.pr from the escalating session's already-resolved PR number, and a new resolve-park primitive lets office-hours resolution ratify or reject the PR before clearing the park

## Context

A qa/implement/review/fix-checks escalation "parks" a graph-native tactic node
by setting its first-class `office_hours` field (via
`packages/intentionsutil/scripts/park-node`, driven at session teardown by the
Stop hook `.claude/hooks/dispatch-stop.sh:51-79`). The park is the only
recovery artifact. Two things it fails to do today cause the observed
defect — **a PR silently orphaned across a park→resume cycle**:

1. **The park never records `execution.pr`.** `park-node`'s writer only sets
   `node.office_hours`; it never touches `execution`. A later session
   re-derives the node from scratch, sees no recorded PR, and re-parks —
   silently overriding a disposition the human already implied. Observed: PR
   #2942 (a ratified fix re-parked 82 minutes later as "close as duplicate,"
   because nothing recorded the PR and a later pass treated it as fresh
   duplicate work).
2. **Nothing ever resolves the parked PR's terminal disposition.** The park
   leaves the PR in **draft**. The graph-native office-hours reviewer
   (`.claude/skills/office-hours/SKILL.md`, graph mode) is deliberately
   read-only and "never un-parks"; un-parking is a manual `write-node` +
   `graph-commit` that does not touch the draft PR. No repo path runs `gh pr
   ready`/`gh pr close` as part of resolving a park. Observed: PR #2898
   (green, untouched in draft for 4 days while its bug kept firing in CI,
   because nobody promoted it out of draft or merged it).

Recording `execution.pr` at park time also directly improves every future
office-hours review of a parked tactic: the graph-mode reviewer only fetches
the PR diff (`gh pr diff`) and names the PR to the human **when
`execution.pr` is non-null** (`office-hours/SKILL.md`, graph-native mode,
Step 3/5). And a sibling, `tactic-census-scripted-tick`, lists this tactic as
a dependency for its scripted verify-merged-only prune — so `execution.pr`
must become *trustworthy* (accurate and race-free), not merely populated.

**Design invariant — `park-node` stays `gh`-free.** Its callers assume it
makes no network call: the Stop hook's own header asserts "park-node →
office_hours, never a gh label" (`dispatch-stop.sh:24-25`), and the node-lane
escalation notes in the four phase skills invoke the park seam without ever
flagging `dangerouslyDisableSandbox` (unlike every `gh`-calling step in those
same skills, which are flagged by name, e.g. `qa-main/SKILL.md:210-224`). So
the PR number must be **passed into** `park-node`, never resolved by it. This
is cheap because the PR number is already in scope in the escalating session
as `PR_NUM` — every phase skill binds it at Step 0 from the shared front door
`dispatch-derive-node-target` (`--pr-mode required`/`optional`), which
resolves the open PR via the reliable REST query `gh_pr_list_rest --state
open --head "$NODE_ID" --limit 1` (`lib.sh:525-607`; REST `state=open`
includes drafts, no CLI false-negative). The one PR that post-dates Step 0 —
`/implement` opens its draft PR at Step 4 and can escalate before the Step 5
completion write (`implement/SKILL.md:100-108`) — is still bound as
`PR_NUM` at that point, so it too is threadable.

**Dropped as already-resolved.** An earlier candidate fix — "`/implement`
re-derivation cross-checks `gh pr list --head <branch>` before starting over
(the context-pack `--pr` probe has a known false-negative)" — is **already
closed for the graph-native node lane** by the landed
`tactic-phase-skill-node-targets` (PR #2844, phase done). Verified: all four
phase skills resolve the node's open PR at Step 0 through
`dispatch-derive-node-target`'s Step 6, which uses the REST `gh_pr_list_rest
--head` query (drafts included, no false-negative) — not the legacy
context-pack `--pr` probe. That legacy false-negative belongs to the
gh-issue lane's `dispatch-find-pr`, which is being retired
(`tactic-legacy-router-removal`) and is out of scope here. No
re-derivation-cross-check unit is planned.

**Sibling boundaries.** `tactic-clear-park-primitive` (PR #2947, phase qa,
not yet merged — `packages/intentionsutil/scripts/clear-park` does not exist
in this tree yet) adds a scripted `office_hours = null` inverse of park-node
for the self-modification drain lane's *automated* terminal disposition; it
never touches `execution.pr` or runs `gh pr ready`. `tactic-execution-pr-merge-verification`
(draft) handles the inverse data-integrity problem (a completion SHA so
merge-verification doesn't rely on `execution.pr` alone) — complementary,
out of scope. Neither is planned here.

This lands as **one PR** (leaf granularity), three sequenced units.

**Implementation note (carries forward from `tactic-phase-skill-node-targets`):**
commits touching `SKILL.md` files and `.claude/hooks/**` are denied to
auto-mode dispatch sessions (agent-behavior config), and Units 2 and 3 below
touch both. If the commit is denied, park via `office_hours` for a human
grant rather than splitting the PR.

## Units of work

### Unit 1 — `park-node` records `execution.pr` (gh-free, passed in)

**Scope.**
- `packages/intentionsutil/scripts/park-node`: add an optional `--pr <n>`
  flag to the arg parse (current signature `park-node <node-id> <reason>
  [recommendation]`, positional parse near the top of the script). Keep the
  three positionals, add `--pr` as a flag so existing callers and the two
  positional call-shapes stay valid. Validate `<n>` as a non-negative
  integer; reject otherwise with exit 2.
- Thread the PR value into the tsx writer heredoc that currently sets only
  `node.office_hours`. Add, only when `--pr` was supplied: merge into
  `execution` via **spread**, mirroring the canonical idiom at
  `apply-node-transition.ts:163-164` (`let execution = node.execution ??
  defaultExecution(id); execution = { ...execution, pr }`,
  `defaultExecution` at `apply-node-transition.ts:132`). Write it back
  through the same `writeNode` call. Must **never** clobber
  `execution.branch`, `execution.attempts`, `execution.markers`,
  `execution.strategy_fingerprint`, or `execution.fix`
  (`schema.ts:377-390`). When `--pr` is absent, `execution` is left exactly
  as read (full backward compatibility with the Stop hook's current
  two/three-arg calls and every in-session reference).
- The `--base` compare-and-swap land and the fresh-origin/main refresh guard
  are unchanged — the `execution.pr` mutation rides the same atomic write,
  which is what makes the recorded PR race-free for the downstream census
  consumer.

**Out of scope.** No `gh` call added to `park-node` (PR is passed in). No
schema change (`execution.pr` already exists, `schema.ts:379`). No change to
`office_hours`/recommendation handling.

**Tests (ship with this unit).** Extend
`packages/intentionsutil/scripts/test-park-node.sh` (scratch bare origin +
writer clones, `gh`/`npx` PATH shims, `run_pn()` helper). The existing `npx`
shim emulates the tsx writer by appending an `office_hours` line; extend it
to also emit an `execution`/`pr` line when the `--pr` value is threaded, or
(cleaner) seed the fixture nodes with a populated `execution` block and
assert the writer preserves it. Add cases:
- **park with `--pr <n>`**: `execution.pr` equals `<n>` on the landed
  origin/main content, and a pre-seeded `execution.branch`/`attempts`/`markers`
  survive unchanged (non-clobber).
- **park without `--pr`**: `execution` block is byte-identical pre/post
  (backward-compat).
- **`--pr` with a non-integer**: exit 2, no write.

**Recommended model:** opus — the execution-spread must be provably
non-clobbering, it interacts with the fresh-main CAS/auto-park guard, and
the recorded value has a downstream trust contract (census). Judgment-heavy
despite the small diff.

### Unit 2 — thread `PR_NUM` through the escalation seam

**Dependencies:** Unit 1 (`park-node` must accept `--pr` before the hook
passes it).

**Scope.**
- `.claude/hooks/dispatch-stop.sh` (park backstop, ~lines 51-79): alongside
  the existing reads of `$CLAUDE_JOB_DIR/office-hours-reason` and
  `$CLAUDE_JOB_DIR/office-hours-recommendation`, read a new optional
  `$CLAUDE_JOB_DIR/office-hours-pr` file; when present and it parses as a
  positive integer, append `--pr "$_OH_PR"` to the `park-node` invocations.
  Keep it best-effort and `gh`-free (it only reads a file the session
  already wrote — no network at teardown), consistent with the hook's
  contract. Update the header comment (~lines 24-25) to note the park now
  also records `execution.pr` from the session-supplied number (still no gh
  label, still gh-free).
- The four node-lane phase-skill escalation notes — `implement/SKILL.md`
  (~127-131), `qa-fix/SKILL.md` (~187-189), `review-fix/SKILL.md`
  (~153-155), `fix-checks/SKILL.md` (~188-189, and the self-block terminus) —
  currently instruct the agent to write `office-hours-reason` (+
  `office-hours-recommendation`) to `$CLAUDE_JOB_DIR`. Add: also write the
  already-bound `PR_NUM` to `$CLAUDE_JOB_DIR/office-hours-pr` (same atomic
  tempfile+`mv`, same directory, same guard the reason/recommendation writes
  use). Skip the write when `PR_NUM` is empty (e.g. `/implement`'s first
  pre-Step-4 run has no PR yet, and a null `execution.pr` is the correct
  record there).

**Out of scope.** No change to the *issue*-lane `dispatch-mark-deviation`
(`.claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation`) — it
targets numeric issues and the `dispatch:office-hours` label, a different
lane. No new shared script (the node lane writes these files inline by
design; mirror that exactly).

**Recommended model:** sonnet — mechanical, well-specified: read one more
file and pass one flag in the hook; add one parallel file-write sentence to
four escalation notes. Clear diff shape, no design decisions.

### Unit 3 — scripted park resolution with PR disposition (`resolve-park`) + office-hours wiring

**Dependencies:** none hard (`resolve-park` can resolve the PR itself via a
`--head` fallback query); sequence after Unit 1 to avoid `test-park-node.sh`
churn and because the common path relies on `execution.pr` being populated.

**Greenfield ideal** (per `.claude/rules/design-proposals.md`): one
primitive — `resolve-park <node-id> --ratify|--reject [note]` — that clears
`office_hours` and performs the optional PR disposition; `clear-park` would
simply be `resolve-park` with no disposition, and no separate clear script
would exist.

**Brownfield decision: implement a self-contained script, not
`blocked_by: [tactic-clear-park-primitive]`.** This tactic must stay
implement-eligible now; coupling its timeline to a sibling still in qa
(#2947) would defeat that. The small amount of `office_hours = null` logic
shared with `clear-park` is the exact inverse of `park-node`'s write and is
covered by the same fresh-main CAS pattern, so the duplication is low-risk —
and `resolve-park` does strictly *more* than `clear-park` (it performs a
`gh` disposition), so this is not pure duplication.
**Recommendation for a follow-up (not created by this tactic):** once both
`clear-park` and `resolve-park` have landed, file a tactic to reconcile them
— either have `clear-park` delegate to `resolve-park` with no disposition,
or merge them into the single greenfield primitive.

**Scope.**
- New `packages/intentionsutil/scripts/resolve-park <node-id>
  --ratify|--reject [note]`:
  - Refresh `intentions/<node-id>.md` from origin/main and read via
    `readNode`/`writeNode`, reusing `park-node`'s fresh-origin/main +
    `--base` CAS pattern verbatim so the resolution is race-safe.
  - Refuse (non-zero exit) if `office_hours` is null (not parked) — a
    resolve on an unparked node is a stale/erroneous invocation, not a
    fallback to paper over.
  - Resolve the PR: prefer `execution.pr` (populated by Units 1-2); when
    null, fall back to the reliable front-door query `gh_pr_list_rest
    --state open --head "$NODE_ID" --limit 1` (`lib.sh:525-607`) — free here
    because this script is already `gh`-dependent, and it makes resolution
    robust to nodes parked before Unit 1 shipped.
  - `--ratify`: `gh pr ready "$PR"` (promote out of draft — directly closes
    the PR #2898 "nobody promoted it out of draft" half), then clear
    `office_hours` (un-park) so the node re-enters normal selection at its
    recorded phase. **Do not** force auto-merge here — arming stays at the
    natural review-complete point (`transition-node:162-166`); ratify only
    un-parks and de-drafts.
  - `--reject`: `gh pr close "$PR"`, then clear `office_hours` (closes the
    PR #2942 "close as duplicate" disposition properly instead of leaving a
    re-park to recur).
  - Record the optional `note` (and the chosen disposition) into the commit
    message before clearing, so the disposition is auditable; land via
    `graph-commit --base`.
- `.claude/skills/office-hours/SKILL.md` graph-native mode, Step 5 (report
  where to engage): where it already names `execution.pr` for a tactic node,
  add advisory guidance naming the exact `resolve-park <node-id> --ratify` /
  `--reject` command for the human to run once they decide. Keep the skill
  **read-only** — it names the command, never runs it (matching the
  existing `assert-worktree-fresh` advisory nearby). The human runs it
  themselves (unsandboxed at a terminal); if Claude is asked to run it on
  their behalf it needs `dangerouslyDisableSandbox` (gh network), consistent
  with the `gh pr diff` flag used earlier in that same mode.

**Out of scope.** No auto-merge forcing. No phase mutation on reject (the
node's post-reject fate is a separate human call). No modification of
`park-node` or `clear-park`. No new stored schema field — the "resolution
disposition recorded at park time" is already carried by the existing
`office_hours.recommendation` free-text (populated via `park-node`'s 3rd
arg); `resolve-park` *executes* the human's chosen disposition.

**Tests (ship with this unit).** Add `resolve-park` scenarios to
`test-park-node.sh` (reuse its scratch-origin harness and `gh` shim; extend
the shim to record `gh pr ready`/`gh pr close` invocations): `--ratify` →
`gh pr ready <pr>` called and `office_hours` cleared on landed content;
`--reject` → `gh pr close <pr>` called and `office_hours` cleared; refuse
when `office_hours` already null; null-`execution.pr` fallback resolves the
PR via the `--head` query shim. (If a reviewer prefers a dedicated file,
split to `test-resolve-park.sh` and register it in
`.github/workflows/unit-tests.yml`; extending the existing harness is the
lower-surface default and needs no CI edit.)

**Recommended model:** opus — ratify/reject semantics, the deliberate choice
*not* to force merge out of phase, the `execution.pr`-then-`--head`
fallback, the gh-disposition-then-graph-clear ordering, and the
read-only-skill boundary are all judgment calls left to implementation time.

## Reuse

- **Execution-merge idiom** — `apply-node-transition.ts:163-164` (`let
  execution = node.execution ?? defaultExecution(id); execution = {
  ...execution, pr }`, `defaultExecution` at `:132`): copy this spread
  exactly in `park-node`'s tsx writer (Unit 1).
- **Fresh-origin/main + `--base` CAS land** — `park-node`'s existing refresh
  + compare-and-swap block: `resolve-park` (Unit 3) reuses this pattern
  verbatim for a race-safe office_hours-clear land.
- **Reliable node-lane PR discovery** — `gh_pr_list_rest --state open --head
  "$NODE_ID" --limit 1` (`.claude/skills/dispatch-propagate/scripts/lib.sh:525-607`),
  as consumed by `dispatch-derive-node-target` Step 6: `resolve-park`'s
  null-`execution.pr` fallback (Unit 3).
- **`gh pr ready` promotion pattern** — `transition-node:162-166` (fires at
  review-complete arming): `resolve-park --ratify` mirrors the `gh pr ready`
  call but deliberately omits the `dispatch-auto-merge` arm.
- **Escalation job-dir file seam** — the atomic tempfile+`mv` write of
  `office-hours-reason`/`office-hours-recommendation` under
  `$CLAUDE_JOB_DIR` (read at `dispatch-stop.sh:51-57`): Unit 2's
  `office-hours-pr` write mirrors it exactly.
- **Test harness** — `packages/intentionsutil/scripts/test-park-node.sh`
  scratch-origin setup, `gh`/`npx` shims, and `run_pn()`: extended by Units
  1 and 3.

## Verification

Both changed scripts are covered by the self-contained bash harness
registered in CI. Run from the repo root:

```verify
packages/intentionsutil/scripts/test-park-node.sh
```

Guard the store/schema vitest suite against regression (no schema change is
planned, so this should stay green unchanged):

```verify
npx vitest run --project packages/intentionsutil --root .
```

Lint the touched shell:

```verify
shellcheck packages/intentionsutil/scripts/park-node packages/intentionsutil/scripts/resolve-park .claude/hooks/dispatch-stop.sh
```

**Manual / observe-in-production (judgment):**
- Trigger a real node-lane escalation (e.g. a qa-fix that hits a user-input
  blocker) and confirm the parked node's landed `intentions/<id>.md` shows
  `execution.pr` set to the session's PR **and** the pre-existing
  `execution.branch`/`attempts`/`markers`/`fix` unchanged — the non-clobber
  invariant the census consumer depends on.
- Confirm the pre-Step-4 `/implement` first run still parks with
  `execution.pr: null` (no PR yet) and does not error on the empty
  `office-hours-pr` file.
- On a parked node with a green draft PR, run `resolve-park <id> --ratify`
  and confirm the PR leaves draft (`gh pr view` shows non-draft) and
  `office_hours` is cleared; on a duplicate, run `--reject` and confirm the
  PR is closed and `office_hours` cleared. Verify `/office-hours <id>`
  (graph mode) now names the `resolve-park` command in its Step 5 report
  while taking no graph action itself.

This is also migration step 1 of the census greenfield (strategy
clarification, 2026-07-23): trustworthy `execution.pr` custody is what the
scripted verify-merged-only prune reads.
