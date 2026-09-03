---
name: reconcile
description: Reconcile materialized implementation to the disposition graph, one bite per invocation from the answered frontier in rank order, from disposition to implementation only, never writing the graph. Bootstrap shim declared on work-loop; the graph wins on conflict. The session runs on opus, its units on sonnet.
model: opus
effort: high
disable-model-invocation: true
---
# Reconcile

> **Shim notice (2026-09-03).** Hand-written from the nodes `work-loop`,
> `materialization`, `review`, `validation-order`, `delegation`,
> `session-context`, `projection`, `transience`, `evaluation`, and
> `authority` of `commons.systems/disposition-graph`, all unanswered, and
> from the author's dispositions of 2026-09-03 quoted on `work-loop`.
> This text has no authority of its own. Where it conflicts with the graph
> at `origin/disposition`, the graph wins and the conflict is reported for
> alignment (§4). Declared as a shim on `work-loop`, whose
> liquidation condition is the exit list (§5).

`/reconcile` runs one iteration of reconciliation on the implementation
ref (`greenfield` during bootstrap): derive the frontier, take the
highest-ranked answered node whose materialization diverges from its
answer, delegate the bite as a unit, verify, land, report, and stop. The
next invocation derives the frontier again. Bites run from disposition to
implementation only: an artifact no node justifies is not a bite under
this shim (§5). It never interviews the author and never records a
standing answer, and it never writes the graph: a divergence that needs
the author is reported for the alignment skill, which alone writes the
graph; un-aligned dispositions are never this skill's bites.

## Model

Run the session on `opus`: `claude --model opus`, then `/reconcile`. The
`model` field above sets the model for the turn that invokes the skill and
the bite runs inside that turn, but the flag is the sure way. Units run on
`sonnet` unless the brief names design or judgment, then `opus`; lookups
on `haiku` (`delegation`, whose draft answers on the AI's judgment what
makes a subagent, a model, and an effort appropriate; the author's words
of 2026-09-03 on `work-loop` leave that question open). Sonnet can run this skill itself once every
frontier node carries an executable check and each kind of bite has a
skill of its own, which is the last bite in the author's order; until
then choosing a bite and writing its contract from prose criteria is
judgment.

## 0. Currency

1. `git fetch origin greenfield disposition`. This checkout must be at
   `origin/greenfield` with a clean tree, and `disposition/`, the nested
   worktree of the `disposition` ref, at `origin/disposition` and clean.
   Stale or dirty stops the iteration: say so and stop.
2. `node packages/disposition/validate.mjs disposition`.
3. `node packages/disposition/project.mjs disposition --rules .claude/rules`.
   If a rule file changed, commit it before anything else
   (`rules: regenerate from <node ids>`): rules bind every session and
   must be current before a bite is taken.
4. Read this file against the nodes it projects. Where a node differs,
   follow the node and report the difference (§4). Apply every shim the
   nodes declare without being asked.

## 1. Frontier

`node packages/disposition/project.mjs disposition --frontier -` lists
every node in rank order with its stamp, instrument, shims, and stage.
Only an answered node, one with a ratified or delegated stamp, can be
bitten: an unanswered node carries a draft, not an answer, and a bite
never pre-empts the author. If no node is answered, report
`no answered node: nothing to bite` and stop. Otherwise read the answered
nodes top down and take the first where one of these holds:

- a shim whose liquidation condition is met while its artifact still
  exists: liquidate it, delete or replace the artifact, and report the
  declaration for alignment to remove (§4);
- an instrument whose ref says it is not yet materialized, or whose check
  fails when run: materialize it or fix what it checks;
- an answer that names an artifact, the browser, a rule, a skill, a page,
  whose current state does not match the answer: reconcile the artifact.

An artifact on this ref that no node justifies is not a bite: that is the
second direction of reconciliation (`work-loop`), an exit criterion (§5),
and the drain of the legacy tactic nodes goes with it. Skip an answered
node whose divergence is the subject of an open dialogue, an un-aligned
disposition under it that names the same artifact. Skip what only the
author can decide. If no answered node diverges, report the frontier as
read and stop.

## 2. Bite

- **Claim.** State the node id and the divergence in one sentence. A bite
  is planned when it is claimed and exists only for the claim
  (`transience`); nothing about it is written to the record.
- **Contract.** One deliverable: inputs, outputs, the files the unit may
  write, its error behaviour, and the test or verifiable output that shows
  it done. A unit that needs a second contract is two units. Name the
  model and the effort.
- **Delegate** with the Agent tool. The brief carries the contract, the
  node's answer quoted, and the standing constraints: no state-changing
  git; write only the named files; work only in this checkout; report the
  exact commands and outputs. Read the conclusion, never the context.
  Never write tooling, tests, surveys, or pages on this thread.
- **Verify.** `node --test packages/disposition/*.test.mjs`; the unit's
  verifiable output; the projector runs on the live graph. Under this shim
  that is all: no code review, no non-functional validation, no validation
  in use; those are batched to exit (§5). Tests and use suffice
  (`review`, `validation-order`).

## 3. Land

- Stage only the unit's files. Commit with a message that names the node:
  `reconcile <node id>: <what changed and why>`, ending with the trailers
  the harness asks for. `git push origin greenfield`; on rejection fetch,
  rebase, run the tests, push again. Never push to `main`; no pull request
  (`persistence`).
- Republish a projection the bite changed: the browser,
  `node packages/disposition/project.mjs disposition --out dist/browser/index.html`,
  published by its recorded address
  https://claude.ai/code/artifact/502111c1-a7fb-4108-a9cb-ebb7b2a44933
  (favicon kept); the alignment page,
  `node packages/disposition/project.mjs disposition --alignment dist/alignment/index.html`,
  published by https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678
  with the `db` capability. A page is read in full by a unit before it is
  published when this thread did not write it.
- Then report the bite in a few lines, the node, the divergence, the
  commit, and what the projector shows, and stop: the frontier re-derives
  at the next invocation.

## 4. The graph

This session never writes the `disposition` ref: the graph is alignment's
alone (the author, 2026-09-03, quoted on `work-loop`). Two things reach
alignment through the report instead of through a node:

- **A divergence that needs the author**, when a node's answer is silent
  or contradictory about the artifact it justifies, or the bite would need
  a decision only the author can make: take no bite on it. A conflicting
  answer found here is a proposal in the sense the `authority` node
  defines, a conflicting answer that arose outside alignment. Report the
  node, the divergence, and a recommendation with its authority class,
  boldness, and persistence class (`growth`, `transience`), in a form the
  author can paste into `/align`, which records it on the node as an
  alternative of source `proposal` naming this report or the instrument
  that raised it and opens the node's dialogue at the periagogic stage
  (`dialogue`); the standing answer keeps its authority meanwhile. The
  divergence stays on the frontier, derived and never stored, until the
  alignment dialogue records it.
- **A shim whose liquidation condition this session has met**: liquidate
  the artifact on this ref and report that the declaration on the node is
  owed its removal by alignment; the declaration stands until then.

Whether reconciliation keeps state of its own outside the graph, the
divergences it has reported, a bite in flight, is a question the author
opened on 2026-09-03 (`work-loop`) and has not ruled on. Until then this
shim persists nothing beyond the git log: each invocation re-derives the
frontier and reports a divergence again if alignment has not yet recorded
it.

## 5. Exit

The liquidation condition of this shim on `work-loop` is the exit list,
derived onto the frontier and never a checklist. At exit, for every
landing made under the shim: the review instrument's assessment
(`review`; the shim there names the incumbent instrument, which is run
from this checkout with the script taken from a worktree of `main`, for
example `git worktree add ../commons.systems-main main`, then
`../commons.systems-main/.claude/skills/dispatch-propagate/scripts/dispatch-code-review --target <base-sha>..HEAD --out-dir tmp/code-review-<tag> --effort high`
with the sandbox disabled and a 600000 ms timeout; exit 5 means still
running, repeat the identical call; grade on `<out-dir>/output.txt`, and
grep it for a usage-limit notice first; never commit while a run is in
flight); functional validation against each node's criteria;
non-functional validation; then the swap of `greenfield` with `main`
(`materialization`'s shim) and validation in use.

Two more clauses of the condition are the author's words of 2026-09-03
after compaction, quoted on `work-loop`: the second direction of
reconciliation, every artifact on this ref that no node justifies
supported by a disposition or pruned, and the drain of every legacy tactic
node, transcribed to this graph or pruned, are required for exit and not
for the transition, and neither is shimmed or materialized before the
disposition that states it, `work-loop`'s draft with `materialization`'s,
is answered.

## Mechanics

- **Layout** after the transition of 2026-09-03: the repository root is
  the `greenfield` checkout; `disposition/` is the nested worktree of the
  `disposition` ref (gitignored); `.claude/rules/` is projected, never
  edited; `.claude/skills/align` and `.claude/skills/reconcile` are the
  two shims; `bootstrap/` holds evidence; `dist/` and `tmp/` are
  gitignored scratch. The legacy record is the tree of `main`, evidence
  only: read it with `git show main:<path>` or from a worktree of `main`;
  never write to it.
- **Worktrees.** A background session isolates itself with a worktree;
  `.claude/settings.json` sets `worktree.baseRef` to `head`, so it
  branches from this checkout. Such a worktree has no `disposition/`: run
  graph commands at the root, or add a detached one inside it with
  `git worktree add --detach disposition origin/disposition` (the
  `disposition` branch is checked out at the root and cannot be checked
  out twice). Its landings are pushed to `greenfield` as fast-forwards.
- **Transition** (the author, unsandboxed, in the main checkout, once
  both refs are pushed): clean `main`'s working tree (a modified
  `flake.lock` blocks checkout; untracked files are moved out or
  committed); `git worktree remove .claude/worktrees/greenfield/disposition`
  then `git worktree remove .claude/worktrees/greenfield` (`--force` if
  ignored files balk); `git checkout greenfield`; `git worktree add
  disposition disposition`; write `.claude/settings.json` (the harness
  refused the session that write; the shim is declared on
  `session-context`) as
  `{"worktree":{"baseRef":"head"},"permissions":{"allow":["Artifact","Bash(cat:*)","Bash(ls:*)","Bash(grep:*)","Bash(head:*)","Bash(tail:*)","Bash(sed:*)","Bash(wc:*)","Bash(find:*)","Bash(echo:*)","Bash(mkdir:*)","Bash(tee:*)","Bash(node:*)","Bash(git status:*)","Bash(git log:*)","Bash(git diff:*)","Bash(git show:*)","Bash(git fetch:*)","Bash(git add:*)","Bash(git commit:*)","Bash(git push:*)","Bash(git worktree list:*)"]}}`;
  then start `claude --model opus` at the root and invoke `/reconcile`,
  which reports nothing to bite until a node is answered, and
  `claude --model fable` for `/align`. The legacy memory index loads
  into both as noise; its one pointer says where the record is.
- **Bash guard** in an isolated session: it refuses `git -C`, loops,
  redirections, and heredocs that mention git; use an absolute `cd` per
  call, `tee` for redirection, a script file for multi-line edits, and
  `git commit -F <file>` for messages. `echo` of a word beginning with `=`
  is refused by zsh.
- **Scratch.** `$CLAUDE_JOB_DIR/tmp` in a background job, `tmp/` here.
  Nothing essential lives in scratch, memory, or this session: the state
  is the frontier and the git log. After compaction, run §0 and finish the
  bite in hand or report it abandoned.
- **Dependencies.** `packages/disposition` imports `yaml` from an ancestor
  `node_modules` (`materialization`'s shim).
- **Publishing.** The Artifact tool; republish by URL; a transient
  network error on publish is retried once.
