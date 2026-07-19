---
id: tactic-fix-checks-graph-native-flake-tracking
kind: tactic
statement: "Graph-native flake-tracking parity for fix-checks: replace
  /file-issue-based flake filing with a tactic-node + blocked_by design on the
  node lane"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "Retained /align-strategy byproduct (2026-07-16), finalized
  2026-07-18 /align-tactics: fix-checks's node-lane Flake sub-path
  (.claude/skills/fix-checks/SKILL.md Step 4, lines 215-346) still calls
  /file-issue to find-or-file a flake tracking issue and blocks the PR's tracked
  GitHub issue on it — dead on both counts now that GitHub Issues are disabled
  repo-wide (has_issues: false) and the node lane forbids gh issue reads/writes
  entirely (SKILL.md:80). This surfaced live blocking PR #2880
  (tactic-phase-standup-audit-lens), which had to park to office-hours instead
  of autonomously self-unblocking. The design is settled on
  strategy-graph-native-dispatch's 2026-07-16 clarification; this node body
  carries the executable clean-session plan."
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
  branch: tactic-fix-checks-graph-native-flake-tracking
  pr: 2901
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Graph-native flake-tracking parity for fix-checks: replace /file-issue-based flake filing with a tactic-node + blocked_by design on the node lane

## Context

`.claude/skills/fix-checks/SKILL.md` Step 4's Flake sub-path is GitHub-Issues
based end to end: it calls `dispatch-flake-dedup` (searches `gh issue` for a
matching fingerprint) and `/file-issue` (creates a `gh issue`) to track a
non-reproducing CI flake, then records a `blocked_by` dependency **on the PR's
tracked GitHub issue** so `/dispatch-propagate`'s queue scan skips the PR until
the flake is resolved. This surfaced as fully dead on the node lane while
resolving PR #2880 (`tactic-phase-standup-audit-lens`): GitHub Issues are
disabled repo-wide (`gh api repos/natb1/commons.systems --jq .has_issues` →
`false`), and the node lane's own rule (this skill's preamble) forbids any `gh`
issue read/write regardless. `/fix-checks` had to park the node to
office-hours instead of autonomously self-unblocking — the exact "legacy
parity" gap `strategy-graph-native-dispatch`'s coverage matrix (this node's
§4) exists to close, just not yet mapped for this indirect `/file-issue`
caller.

Full design recorded in the 2026-07-16 `/align-strategy` interview (see
`strategy-graph-native-dispatch`'s clarification of the same date) and applied
immediately to PR #2880 as a worked example
(`tactic-baseline-proxy-float-tolerance`, `blocked_by` wired onto
`tactic-phase-standup-audit-lens`, its `office_hours` cleared). This tactic
generalizes that worked example into the reusable `fix-checks` mechanism.

**Design — settled on `strategy-graph-native-dispatch`'s 2026-07-16
clarification. Implement the units against it; do not re-derive it:**

- On `is_flake == true` (node lane), find-or-create a **tactic node** — not a
  GitHub issue — keyed by the same fingerprint `fix-checks` already computes
  (`<failing-check-name> — <stable-id>`,
  `.claude/skills/fix-checks/SKILL.md:231-245`, unchanged). The node body
  carries the same content the GH issue body used to: the fingerprint, the
  reproduce command, and the failure excerpt/diagnosis.
- Set `blocked_by: [<that tactic's id>]` on the **source tactic** (the one
  whose CI run hit the flake) — replacing the `gh api` dependency call onto a
  tracked GitHub issue (`.claude/skills/fix-checks/SKILL.md:320-337`).
- Do **not** escalate to office-hours for this case. This mirrors legacy's own
  flake path exactly (file + block + queue-skip, no park), and it is provably
  sufficient: `packages/intentionsutil/src/router.ts`'s `blockersComplete`
  (`router.ts:171-177`) already treats a `blocked_by` entry as complete when
  the blocker is **absent from the store** (no `intentions/<id>.md` file on
  disk — the store is `listNodes`, `store.ts:126-132`) or **present with
  `phase: done`** — so the router's existing selection-eligibility gate
  (call sites `router.ts:293,316`) re-surfaces the source tactic
  automatically once the flake-fix tactic reaches `phase: done`. No new
  auto-resume plumbing is needed anywhere in `router.ts`/`attention.ts` — only
  correct edge modeling in `fix-checks`. This is verified prior art, not an
  assumption (see Verification).
- Steelman considered and declined (2026-07-16 interview): a centralized flake
  registry (tracking fingerprints as a set, one dedicated node, rather than N
  one-off tactics scattered under whichever strategy owns the touched file)
  would make recurrence more visible at a glance, but parsimony favors reusing
  the existing tactic + `blocked_by` primitive for a problem with no
  demonstrated volume yet. If flake recurrence becomes frequent enough to
  matter, that is a future strategy re-evaluation trigger, not something to
  pre-build for now.

**Plan-time decisions resolved by this finalization** (the draft left these to
"author's call at plan time"; they are settled below and the units implement
them, not re-open them):

1. **New sibling script, not an in-place edit of `dispatch-flake-dedup`.** Unit
   1 authors a graph-native sibling (`dispatch-flake-dedup-node` is the
   recommended name; implementer may refine) and leaves
   `.claude/skills/dispatch-propagate/scripts/dispatch-flake-dedup` untouched.
   Three reasons: (a) Unit 2 deliberately leaves the legacy issue lane's flake
   sub-path calling the existing gh-backed script, so both backends coexist
   until `tactic-legacy-router-removal` drains the legacy lane; (b) the
   existing script's gh-backed unit tests
   (`test-dispatch-scripts.sh:34151-34413`) stay green untouched
   (test-integrity); (c) folding a second backend into one script is exactly
   the "duplicative branching business logic" `.claude/rules/code-style.md`
   warns against, in a script slated for deletion anyway.
2. **Fingerprint stays body-text-only, matched by grep** — no new first-class
   frontmatter field. This mirrors today's GH-issue-title matching (the
   fingerprint is the trailing token of the `Flaky CI: <fingerprint>` title,
   `dispatch-flake-dedup:22-28`): the node-native search greps
   `intentions/tactic-*.md` for the exact fingerprint string carried verbatim
   in the node body. Parsimony — the strategy's declined-registry reasoning
   applies identically to a dedicated field.

## Unit 1 — author a graph-native flake-dedup guard that searches tactic nodes

**Recommended model:** opus

The dedup guard's four-way disposition (`NONE` / `EXISTING` / `REOPENED` /
`STALE`) encodes real judgment about node lifecycle and stale-head detection
that must be faithfully re-derived over tactic-node state, not just
mechanically re-pointed at a different backend.

Scope:
- Author a new sibling script (recommended name
  `.claude/skills/dispatch-propagate/scripts/dispatch-flake-dedup-node`),
  ported from `dispatch-flake-dedup`. Same CLI shape: positional
  `<fingerprint>` plus `--body-file`, `--run-id`, and (for ancestry) the PR's
  head ref. It prints one disposition token to stdout, mirroring the original
  (`dispatch-flake-dedup:108-111,124,176-177,181`). Do **not** modify
  `dispatch-flake-dedup` itself — the legacy issue lane keeps calling it (see
  the "Plan-time decisions resolved" note above and Unit 2).
- **Search backend**: replace the `gh_issue_list_rest`/`gh_issue_view_rest`
  fingerprint search (`dispatch-flake-dedup:105,118-119`, via
  `dispatch-followup-exists`) with a grep over `intentions/tactic-*.md` for the
  exact fingerprint string carried verbatim in a node body (fingerprint is
  body-text-only per decision 2 above). Use the frontmatter-anchored `grep -rl`
  recipe the align skills already use as prior art
  (`.claude/skills/align-tactics/SKILL.md:210`) — adapt it to match the
  fingerprint line in the body rather than a `serves:` block entry. There is
  **no** existing graph-native find-or-file primitive to reuse; this is
  net-new.
- Re-derive each disposition against tactic-node semantics:
  - `NONE` → no `intentions/tactic-*.md` carries the fingerprint (never
    created, or created-then-pruned — prune erases the file, so a
    reopen-after-prune collapses into this branch). Print `NONE`; Unit 2
    creates a fresh flake tactic.
  - `EXISTING` → exactly one matching tactic exists and is **open** (`phase`
    set and not `done`). Append the recurrence (`--body-file` content) to its
    body; do not create a new one. Print `EXISTING <tactic-id>`. (Body-append
    is a file `Edit` + `graph-commit` in Unit 2, not a gh comment — this
    script prints the disposition, Unit 2 performs the write.)
  - `REOPENED` → a matching tactic is present on disk at `phase: done` (the
    transient pre-prune window) but the flake fired again on a run whose head
    **does** contain the closing fix (i.e. not `STALE`). Concrete graph-native
    mechanic (this replaces the draft's open question): reset the node's
    frontmatter `phase: done → implement` via `write-node.ts` and re-append the
    recurrence to its body, landed by `graph-commit` (performed in Unit 2). A
    `done` node whose file is already gone is `NONE`, not `REOPENED`. Print
    `REOPENED <tactic-id>`.
  - `STALE` → the triggering run's head does not contain the closing fix commit
    (ancestry `behind`/`diverged`) — the PR branch is stale and still emitting
    the pre-fix signature; no create, no reopen. Print `STALE <tactic-id>`.
- **Preserve the run-id/ancestry-based stale-head detection verbatim** — the
  `STALE` computation at `dispatch-flake-dedup:134-137,143-147,163-172` (run-id
  → head SHA → closing-commit resolve → `git` ancestry compare). This is the
  one piece that is genuinely backend-agnostic judgment: port it unchanged.
  Note the closing-commit resolve for a node comes from the node's merged
  PR/commit rather than `gh_issue_closing_commit_rest`
  (`dispatch-flake-dedup:165`); re-derive the "does this run's head contain the
  fix?" question against the flake tactic's completion commit.

Dependencies: none (this is the first unit; Unit 2 depends on it).

Reuse:
- `.claude/skills/dispatch-propagate/scripts/dispatch-flake-dedup` — the
  four-way disposition control flow and, verbatim, the stale-head ancestry
  block (`:134-182`); copy the structure into the sibling, swap only the
  search backend and the create/append/reopen actions.
- `.claude/skills/align-tactics/SKILL.md:210` — the `grep -rl` node-search
  recipe over `intentions/tactic-*.md`.
- `packages/intentionsutil/src/store.ts:126-132` (`listNodes`) and
  `readNode` — to read a matched node's `phase` when distinguishing
  `EXISTING`/`REOPENED`, rather than parsing frontmatter by hand.

## Unit 2 — rewrite `fix-checks`'s node-lane Flake sub-path

**Recommended model:** sonnet

Mechanical rewrite once Unit 1's primitive exists — the design is fixed above.
The node lane's flake sub-path currently has **no** defined behavior: sub-step
4 (`.claude/skills/fix-checks/SKILL.md:320-337`) parses `Closes #N` and posts a
gh dependency, which the node lane forbids (`SKILL.md:80`), so `/fix-checks`
today parks the node instead of self-unblocking. This unit gives the node lane
a real flake path.

Scope:
- `.claude/skills/fix-checks/SKILL.md` Step 4's Flake sub-path
  (`:215-346`) — add a **node-lane branch** that replaces the `/file-issue`
  call (`:289-319`) and the gh-dependency sub-step 4 (`:320-337`) with:
  1. Call Unit 1's `dispatch-flake-dedup-node` with the fingerprint
     (`:231-245`, unchanged), the recurrence body (`tmp/flake-recurrence.md`,
     `:253-255`), the `RUN_ID` (`:221-230`), and the PR head ref.
  2. On `NONE`, write a new flake **tactic node** via `write-node.ts`:
     `kind: tactic`, `phase: implement`, `owner: ai`, `status: codified`,
     `execution: null`, `validates: []`, `office_hours: null`. Body carries the
     fingerprint (verbatim, so Unit 1's grep matches), the reproduce command,
     and the failure excerpt/diagnosis — the same content shape the GH issue
     body used to carry. Land it with `graph-commit`.
  3. On `EXISTING`/`REOPENED`, perform the body-append (and, for `REOPENED`,
     the `phase: done → implement` reset) the disposition token calls for — a
     body `Edit` (plus a `write-node.ts` frontmatter write for the phase reset)
     landed by `graph-commit`. On `STALE`, do nothing (no create, no block) —
     matching `dispatch-flake-dedup`'s `STALE` suppression
     (`SKILL.md:336-337`).
  4. On `NONE`/`EXISTING`/`REOPENED`, set `blocked_by` on the **source tactic**
     (the node id `$N` this `/fix-checks` run targets) to include the flake
     tactic's id. **This must go through `write-node.ts` + `graph-commit`, not
     `transition-node`**: `transition-node`
     (`.claude/skills/dispatch-propagate/scripts/transition-node`) only mutates
     `phase` and `--set-pr` (`SKILL.md:74`) and has no `blocked_by` handling —
     so read the source node (`readNode`), append the flake tactic id to its
     `blocked_by` array (idempotent — skip if already present), and land the
     one-field frontmatter change with `graph-commit`. Do **not** escalate to
     office-hours for this outcome (the node-lane escalation seam
     `$CLAUDE_JOB_DIR/office-hours-reason`, `SKILL.md:77-79`, is not written
     here).
  - **`serves` on the new flake tactic**: inherit the **source tactic's**
    `serves` (the flake fired on the source tactic's own CI run, so it is a
    defect on the same artifact surface that tactic serves — honest
    artifact-owner placement per the align-tactics clarification 27 rule, not a
    forced default). Read the source node's `serves` and copy it; if the source
    tactic itself has multiple `serves`, carry them all.
- Leave the **legacy issue lane**'s Flake sub-path untouched — it keeps calling
  `dispatch-flake-dedup` and `/file-issue`. GitHub Issues being disabled makes
  those calls fail regardless of what this tactic does, and legacy-lane removal
  is tracked separately (`tactic-legacy-router-removal`). Do not conflate the
  two; branch on `TARGET_KIND` (`SKILL.md:37-56`).
- Update the accumulator (`tmp/fix-checks-summary.md`) template's **Flake
  issue** field (`SKILL.md:450-454`) and **Fingerprint** field (`:455-457`) so
  the node-lane branch names the flake tactic id and disposition
  (`CREATED|EXISTING|REOPENED|STALE-SUPPRESSED`) instead of a GH issue number.

Dependencies: Unit 2 depends on Unit 1.

Reuse:
- `.claude/skills/fix-checks/SKILL.md:221-245` — the existing fingerprint
  computation and run-id capture, unchanged; only the find-or-file-and-block
  mechanics below them change.
- `packages/intentionsutil/scripts/write-node.ts` and
  `packages/intentionsutil/scripts/graph-commit` — the standard node-write and
  landing primitives. Note: the node lane today reaches `graph-commit` only
  through `transition-node` (`SKILL.md:74`), which cannot write `blocked_by`;
  this unit is the first node-lane use of `write-node.ts` directly.
- `packages/intentionsutil/src/store.ts` `readNode` — to read the source
  tactic's current `blocked_by` and `serves` before rewriting.

## Verification

Unit 1's new script is bash and belongs in the existing dispatch-script unit
suite (`test-dispatch-scripts.sh`, run in CI at
`.github/workflows/unit-tests.yml:191`). Add cases for the new
`dispatch-flake-dedup-node` covering all four dispositions over synthetic
`intentions/tactic-*.md` fixtures, alongside the existing gh-backed cases
(`test-dispatch-scripts.sh:34151-34413`), then:

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

The rest is prose — a process/skill change with no further isolated automated
surface:

- Dry-run against a synthetic flake on a throwaway node-lane worktree: confirm
  a new flake tactic node is created (or appended to / phase-reset, per
  disposition), `blocked_by` lands on the source tactic via
  `write-node.ts`+`graph-commit`, and `office_hours` stays `null` throughout.
- Confirm the router genuinely re-selects the source tactic once the flake
  tactic is manually transitioned to `phase: done` — the concrete assertion the
  whole design rests on. Prior art is verified (`router.ts:171-177`
  `blockersComplete`: absence or `phase: done` completes a blocker), so this is
  a confirmation of the wiring, not a discovery.
- Confirm the ported `STALE` suppression still holds (a stale PR branch
  re-emitting the pre-fix signature does not spuriously reopen or duplicate) —
  the ancestry-based branch copied from `dispatch-flake-dedup:134-182`.
