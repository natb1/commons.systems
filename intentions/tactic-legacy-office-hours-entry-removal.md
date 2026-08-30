---
id: tactic-legacy-office-hours-entry-removal
kind: tactic
statement: Delete the legacy label-lane office-hours entry surface and the legacy
  <issue-num>-<slug> worktree lane, repointing the two live wirings (the
  settings.json UserPromptSubmit hook and the nix office-hours command) in the
  same commits as their deletions
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "Split out of tactic-legacy-router-removal on 2026-07-23 by explicit
  author decision. That node's Unit 1 claimed completion for BOTH halves of the
  legacy-router deletion; only the live-wired half actually landed (via
  tactic-dispatch-legacy-rewire, PR #2869). The non-live-wired half — the
  legacy office-hours entry surface and the legacy <issue-num>-<slug> worktree
  lane — was written only onto branch `tactic-legacy-router-removal`, which was
  never merged and never had a PR; every file it claimed to delete is still on
  origin/main. This node owns that residual half so the false-completion claim
  cannot swallow it again. Landing caveat: this node edits .claude/settings.json,
  .claude/hooks/**, and .claude/skills/** — agent-behavior config; dispatch auto
  mode denies the commit. Park for interactive landing if hit."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by:
  - tactic-graph-node-session-reap
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Delete the legacy label-lane office-hours entry surface and the legacy <issue-num>-<slug> worktree lane, repointing the two live wirings in the same commits as their deletions

## Context

The graph-native dispatch migration replaced the gh-issue-and-label router with
intention-graph nodes. The **live-wired** half of the legacy router deletion
landed via `tactic-dispatch-legacy-rewire` (PR #2869, merged 2026-07-18):
`dispatch-select-target`, `dispatch-phase`, `dispatch-materialize-spawn`,
`dispatch-launch-worker`, `dispatch-trace-leaf`, and `dispatch-route` are all
absent from `.claude/skills/dispatch-propagate/scripts/` on `origin/main`.

The **non-live-wired** half never landed. It was written only onto the branch
`tactic-legacy-router-removal`; commit `ee12fc1b` on that branch is a merge of
`origin/main` **into** the branch, not a merge to main. No PR was ever opened,
and `git merge-base --is-ancestor ee12fc1b origin/main` returns non-zero. Every
file that half claimed to delete is still present on `origin/main` today. Do not
attempt to reuse `origin/tactic-legacy-router-removal`: it is ~851 commits behind
(merge-base `444bf41a`) and its sides of `worktree-create.sh` and the (now-split)
dispatch-scripts test suite are stale enough to revert landed work. The remote ref
is retained as a record of the intended shape (its `office-hours.nix` header
rewrite is a useful draft) — read it if useful, but write fresh from `origin/main`.

**Why the deletion is correct now.** `gh api repos/natb1/commons.systems --jq
.has_issues` returns `false` — GitHub Issues are disabled repo-wide. So:

- `office-hours-select-target`'s "open issues carrying `dispatch:office-hours`"
  query can never return a row.
- The `office-hours` shell entry always prints queue-empty.
- `dispatch-office-hours-strip.sh` can never fire — no `<issue-num>-*` branch can
  be created for an issue that cannot exist.

The graph-native replacement is already live on `origin/main`:
`packages/intentionsutil/scripts/office-hours-graph` (the entry script) and
`packages/intentionsutil/scripts/office-hours-select.ts` (the offline selector).
`office-hours-graph`'s own header states it "sources NOTHING from
`.claude/skills/dispatch-propagate/` — that lib is scheduled for deletion", so
the repoint below is the wiring it was written for.

**The hazard this plan exists to prevent.** Two references are *live wiring*, not
dead prose. Deleting their targets without moving them in the **same commit**
breaks `main`:

1. `.claude/settings.json:93-102` registers `dispatch-office-hours-strip.sh` as
   the sole `UserPromptSubmit` hook. Deleting the hook file alone leaves the
   harness invoking a missing path on every prompt.
2. `nix/packages/office-hours.nix:19` sets
   `SCRIPT="$TOPLEVEL/.claude/skills/dispatch-propagate/scripts/office-hours"`.
   That is the author's daily terminal `office-hours` command (exposed via
   `flake.nix:70` and `flake.nix:80`). Deleting the script alone breaks it.

## Unit 1 — delete the legacy office-hours entry surface (one commit)

**Recommended model:** opus

Everything in this unit lands in **one commit**. The test suite copies the
deleted scripts during setup, and the nix package and settings hook point at
them, so a split leaves `main` red or broken between commits.

**Delete outright:**

- `.claude/skills/dispatch-propagate/scripts/office-hours-select-target`
  (595 lines) — the `dispatch:office-hours` label-queue selector.
- `.claude/skills/dispatch-propagate/scripts/office-hours` (333 lines) — the
  thin dispatcher over that selector.
- `.claude/hooks/dispatch-office-hours-strip.sh` (50 lines) — the
  `UserPromptSubmit` label-strip hook.

**Move the live wiring in this same commit:**

- `.claude/settings.json:93-102` — remove the entire `"UserPromptSubmit"` key.
  It has exactly one entry (the strip hook), so the key becomes empty and is
  deleted, not emptied. Verify the file still parses: `jq . .claude/settings.json`.
- `nix/packages/office-hours.nix:19` — repoint to
  `SCRIPT="$TOPLEVEL/packages/intentionsutil/scripts/office-hours-graph"`.
  Rewrite the header comment at `nix/packages/office-hours.nix:3-10`, which
  currently describes the deleted script's `office-hours-select-target` verbs
  (`resume` / `parked-router` / `fresh-with-args` / `empty`); replace with the
  graph-native dispositions `office-hours-graph` actually emits (`launch
  <node-id> <cwd>` / `empty` / `empty not-parked <node-id>` — see
  `packages/intentionsutil/scripts/office-hours-graph:18-25`).
  **Do not touch** `nix/packages/office-hours.nix:26-32`: the
  `lib-sanitize-launch-env.sh` source stays, because that library is still live
  and is also sourced by `nix/packages/dispatch.nix:24-30`.

**Reduce the skill doc to the surviving lane:**

- `.claude/skills/office-hours/SKILL.md` (386 lines, currently dual-lane) —
  remove the legacy numeric-`<N>` label lane and keep the graph-native lane.
  Concretely: rewrite the frontmatter `description` (line 3) to drop "two lanes
  by target … A numeric issue `<N>` runs the legacy `dispatch:office-hours`
  label lane"; delete the "Label clearing is automatic" section (lines 51-63,
  plus the `[Label clearing is automatic]:` link definition at line 386) —
  the graph lane has no strip hook, as the doc itself already states at lines
  381-383; delete the Step-0 lane discrimination and the legacy branch of
  "Steps" (lines 65-307), which is entirely `office-hours-select-target`-driven
  (invocations at lines 92, 184, 197, 210); promote the "Graph-native mode"
  section (lines 308-385) to be the skill's only mode.

**Fix the stale doc pointer:**

- `.claude/skills/dispatch-propagate/reference.md:585` — the sentence "The
  `office-hours-select-target` script surfaces the parked router via a
  `parked-router` line, so a human can resume it." Its subject is being deleted.
  Remove the sentence (the surrounding `dispatch-self-close` continuation
  narrative at lines 578-588 stands on its own); do not invent a graph-lane
  equivalent — `office-hours-graph` has no `parked-router` disposition.

**Delete the orphaned test blocks.** The former monolithic dispatch-scripts
test file has since been split into per-SUT files
(`tactic-dispatch-test-monolith-split`); the sections below now live in
`.claude/skills/dispatch-propagate/scripts/test-office-hours-select-target.sh`,
`.claude/skills/dispatch-propagate/scripts/test-office-hours.sh`, and
`.claude/skills/dispatch-propagate/scripts/test-dispatch-office-hours-strip-hook.sh`.
Re-locate each item below by grepping for its name/comment text — do not trust
the old monolith line numbers, which no longer apply post-split:

- The `office-hours-select-target` section (now the whole of
  `test-office-hours-select-target.sh`) and the `office-hours (entry point)`
  section (now the whole of `test-office-hours.sh`) — since Unit 1 deletes
  both scripts outright, these two files themselves become dead and should be
  deleted, along with their `unit-tests.yml` steps.
- The three test-local `claude` fakes that exist only for those sections:
  `office_hours_fake_claude`, `office_hours_fresh_fake_claude`,
  `office_hours_state_fake_claude`. Confirm by grep that no surviving test
  calls them before deleting (moot if the whole files above are deleted).
- The `dispatch-office-hours-strip hook` section — now the whole of
  `test-dispatch-office-hours-strip-hook.sh` — becomes dead once
  `.claude/hooks/dispatch-office-hours-strip.sh` is deleted; delete the file
  and its `unit-tests.yml` step too.
- Shared-setup lines in any still-surviving shared fixture file that copy the
  deleted scripts (`office-hours-select-target`, `office-hours`, and — **only
  if** no surviving test uses it — `dispatch-recover-session-id`): the `cp`
  lines and their matching `chmod +x` entries. Grep first.
- Fixture/stub branches whose only consumer is a deleted section: the
  `oh-issue-list.json` arm inside the `dispatch:office-hours` REST-label stub,
  and the `ls-remote --exit-code --heads origin` git-stub arm whose comment
  names `office-hours-select-target`. Grep each for other consumers before
  removing; the `trace-parked.json` arm belongs to `dispatch-trace-leaf` and is
  a separate concern — leave whatever a grep shows is still consumed.

**Mandatory check before deleting the test blocks** (test-integrity, see
`.claude/rules/test-integrity.md`): deleting tests whose subject is gone is
correct; deleting tests that uniquely cover a *surviving* helper is not.
Specifically, `office-hours-select-target:202-221` defines its **own local**
`resolve_main_worktree` — it does *not* source the shared one. The shared
`resolve_main_worktree` lives in
`.claude/skills/dispatch-propagate/scripts/lib-graph-worktree.sh:27` and is used
by surviving callers `.claude/hooks/worktree-create.sh:111`,
`graph-select-target:215`, `dispatch-graph-execute:89`, and
`provision-node-worktree:62`. Line 4082 of the test file is the only line in the
deleted span that mentions `resolve_main_worktree`, and it exercises the local
copy via `DISPATCH_OFFICE_HOURS_MAIN_WORKTREE`. Re-run this check at
implementation time (`grep -n resolve_main_worktree` across
`.claude/ packages/ nix/`): if the shared helper's only remaining coverage turns
out to be inside a block you are deleting, **port that coverage to a surviving
section rather than dropping it**, and say so in the PR.

**Out of scope for this unit** (belongs to `tactic-legacy-router-removal`'s Unit
2 or a wider sweep): `/file-issue` and `/plan-issue` skill retirement; the other
`dispatch:*` label conventions; and the many surviving legacy-lane scripts that
still parse `<issue-num>-*` (`dispatch-sweep`, `dispatch-find-pr`,
`dispatch-apply-office-hours`, `dispatch-provision-from-remote`,
`dispatch-resolve-worktree`, `lib.sh`, and others). Delete only the three files
named above.

## Unit 2 — remove the legacy `<issue-num>-<slug>` lane from the worktree hook

**Recommended model:** sonnet

**Scope:** `.claude/hooks/worktree-create.sh` (183 lines total on `origin/main`).
Reduce it to the graph `<node-id>` lane only:

- Header comment `:2-31` — drop the `<issue-num>-<slug> LEGACY lane` paragraph
  (`:6-16`); keep the `<node-id> GRAPH lane` paragraph and the shared
  direnv/stdin notes.
- Lane classification `:86-96` — remove the numeric-prefix `LANE=legacy` branch
  (`:89-90`) and collapse to a single node-id regex validation. Update the
  error message at `:94` so it no longer offers `<issue-num>-<slug>` as a valid
  shape.
- `:98-115` — remove the `if [ "$LANE" = legacy ]` arm (`:98-105`, the
  `--git-common-dir` anchoring) and unconditionally use the graph arm
  (`:106-114`, `resolve_main_worktree`). Keep the sourcing of
  `lib-graph-worktree.sh` at `:45` — the graph arm needs it.
- `:117-122` — collapse the two-message existence branch to the graph message.
- `:139-183` — delete the whole legacy tail: the `LANE = node` early-exit guard
  (`:143-146`) becomes the unconditional `echo "$NEW_PATH"; exit 0`, and the
  `CLAUDE.local.md` identity stub (`:150-178`) plus the
  `tmp/dispatch-worktree` marker (`:180-181`) go with it. This removes the
  hook's only `gh` call (`gh issue view` at `:157`).

**Out of scope:** the `LANE`-variable removal must not change the graph lane's
behavior in any way. Do not touch `lib-graph-worktree.sh`.

**No test coverage to remove:** `worktree-create.sh` has no dedicated test
section in any of the split per-SUT test files (the only mention is an
incidental comment about the marker shape, which Unit 2 makes stale — update
that comment or leave it, but do not delete the surrounding test).

## Dependencies

- **Unit 1 before Unit 2** is preferred but not required — the two units touch
  disjoint files. Either order works; each must be independently green.
- **`tactic-graph-node-session-reap` (frontmatter `blocked_by`)** — that node is
  at `phase: qa` with PR #2922 open, and its Unit-3 scope is a dedup refactor of
  `.claude/skills/dispatch-propagate/scripts/office-hours:160-169` (see
  `intentions/tactic-graph-node-session-reap.md:141-144` and `:319-325`) — the
  exact file Unit 1 deletes. Landing this node first would strand that PR in
  conflict. Let #2922 land first; if it has landed by the time this node is
  picked up, the `blocked_by` edge is already discharged and Unit 1's deletion
  simply removes the just-refactored file (its shared
  `claude_job_id_for_name_all` in `lib-claude-agents.sh` survives, so nothing is
  lost).
- **No edge to `tactic-legacy-router-removal`** — see that node's "Split
  history" section. Its remaining Units 2-3 touch disjoint files (skill docs and
  graph nodes); neither node gates the other.

## Reuse

- `packages/intentionsutil/scripts/office-hours-graph` — the graph-native entry
  script the nix wrapper is repointed at. Already executable, already on `main`.
- `packages/intentionsutil/scripts/office-hours-select.ts` — the offline parked
  selector the surviving SKILL.md lane invokes (`SKILL.md:360`).
- `.claude/skills/dispatch-propagate/scripts/lib-sanitize-launch-env.sh` —
  unchanged; still sourced by both `nix/packages/office-hours.nix` and
  `nix/packages/dispatch.nix:24-30`.
- `.claude/skills/dispatch-propagate/scripts/lib-graph-worktree.sh:27` — the
  shared `resolve_main_worktree` the surviving graph lane of
  `worktree-create.sh` already uses.
- `nix/packages/dispatch.nix` — the sibling nix wrapper; its structure is the
  model for the repointed `office-hours.nix`.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-office-hours-select-target.sh || exit 1
.claude/skills/dispatch-propagate/scripts/test-office-hours.sh
```

```verify
jq . .claude/settings.json > /dev/null
```

```verify
bash -n .claude/hooks/worktree-create.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh --nix
```

Manual / judgment:

- **No dangling references.** Grep for `office-hours-select-target` and
  `dispatch-office-hours-strip` across the repo (excluding `.git/`,
  `node_modules/`, and `intentions/`) — zero hits. Grep for the path fragment
  `scripts/office-hours` (word-bounded, so `office-hours-graph` and
  `office-hours-select.ts` do not match) — zero hits outside `intentions/`.
- **The author's terminal command still works.** After the nix repoint, run
  `office-hours` from a shell in the flake devShell. Expected: it execs
  `packages/intentionsutil/scripts/office-hours-graph` and prints either a
  `launch`/attach for a parked node or a queue-empty message — not
  `office-hours: script not found or not executable`. This is the one check that
  cannot be automated from inside a session; ask the author to run it if the
  session cannot.
- **The harness starts clean.** After removing the `UserPromptSubmit` key,
  start a fresh Claude Code session in a worktree and submit one prompt. No
  hook-not-found error appears. (A session already running when the change lands
  may hold the old settings in memory — verify in a *new* session.)
- **Test-integrity check** described in Unit 1 is documented in the PR body:
  state explicitly which deleted assertions covered a deleted subject, and
  confirm the shared `resolve_main_worktree` retains coverage elsewhere or that
  coverage was ported.

## Landing caveat

This node edits `.claude/settings.json`, `.claude/hooks/**`, and
`.claude/skills/**` — agent-behavior config. Dispatch auto mode denies the
**commit** of such changes (Write/Edit succeed; the commit is what is refused).
If the commit is denied, park this tactic to `office_hours` for interactive
landing, with a reason naming the denied path. Do not retry the commit
autonomously.

## Implementation notes

One subagent per unit, launched with the unit's `Recommended model`; supply the
unit's context and scope in the subagent prompt and constrain it to working-tree
edits only.

## Record — pre-landing verification, 2026-07-23

Checks run at the 2026-07-23 office-hours sitting, before any of this node's
units were implemented. Recorded as findings, not instructions.

**The nix repoint was verified end-to-end.** `nix/packages/office-hours.nix`
was edited to point `SCRIPT` at
`packages/intentionsutil/scripts/office-hours-graph`, built with
`nix build '.#office-hours'`, and the built wrapper was run from an active
devShell. It resolved `$TOPLEVEL`, passed the `-x` guard, sourced the sanitize
lib, and exec'd `office-hours-graph`, which selected the queue head and
attempted a launch — behavior identical to invoking `office-hours-graph`
directly. The probe edit was reverted; the change itself is unlanded. The
launch was driven by a stubbed `claude` via `OFFICE_HOURS_CLAUDE_CMD`, so the
run ended at the registration-verify step, which is the expected stub outcome.

**`office-hours-graph` works as an entry point.** Run directly against the
current graph with the same stub, `office-hours-select.ts` emitted
`launch tactic-main-post-merge-validation <cwd>` and the script consumed that
disposition correctly.

**The wrapper keeps one reference into the legacy directory after the repoint.**
`nix/packages/office-hours.nix:26` sources
`$TOPLEVEL/.claude/skills/dispatch-propagate/scripts/lib-sanitize-launch-env.sh`.
That file is not among this node's deletions (which cover
`office-hours-select-target`, `office-hours`, and
`dispatch-office-hours-strip.sh`), so the reference still resolves after the
removal. This is a divergence from `office-hours-graph`'s header claim that it
sources nothing from `.claude/skills/dispatch-propagate/` — the claim holds for
the script, not for the nix wrapper that execs it.

**The `blocked_by` edge on `tactic-graph-node-session-reap` is live.** PR #2922
is open (draft, phase `qa`) and its changed-file list includes
`.claude/skills/dispatch-propagate/scripts/office-hours` — the 333-line file
this node deletes. The two therefore conflict directly.

**No config-commit denial was observed at this sitting.** A separate
`.claude/skills/**` commit landed here without one (`2bb01021`, PR #2955), so
the denial anticipated in this node's plan is not currently reproducing. That
is an observation from one session, not a general clearance.
