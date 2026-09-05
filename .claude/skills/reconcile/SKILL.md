---
name: reconcile
description: Reconcile materialized implementation to the disposition graph, one bite per invocation from the answered frontier in rank order, from disposition to implementation, writing the graph only as viable options recorded and recommendations moved. Bootstrap shim declared on work-loop; the graph wins on conflict. The session runs on opus, its units on sonnet.
model: opus
effort: high
disable-model-invocation: true
---
# Reconcile

> **Shim notice (2026-09-03, reconciled 2026-09-04 under the author's
> bootstrap grant of that day to the viable-options model of
> `viable-options`, in which every decision on a node is a fact with
> viable options, a node's class is read off the rulings recorded on them
> rather than stamped, and this loop's main thread may record an option
> and move a recommendation on the graph, §4; and reconciled again on
> 2026-09-04, under the author's bootstrap grant of that day for the
> alignment-page sitting ("You have bootstrap reconciliation authority
> including migrating nodes to new encodings"), to
> `every-fact-every-option` on `alignment-page`,
> `prose-argues-structure-records` on `prose-and-structure`, the three
> options on `dialogue` and `denial-typed-to-maieutic` on `recording`,
> every one of them unanswered: an option this loop passes over is marked
> and stays on the list, and a ruling may carry the author's reason, §4.
> The recommendation that
> reconciliation is written from is unanswered, and the clean-context
> review of its batch is owed before the author rules on any of it.)**
> Hand-written from the nodes `work-loop`,
> `materialization`, `review`, `validation-order`, `delegation`,
> `session-context`, `projection`, `transience`, `evaluation`,
> `authority`, `viable-options`, and `prose-and-structure` of
> `commons.systems/disposition-graph`, all unanswered, and
> from the author's dispositions of 2026-09-03 and 2026-09-04 quoted on
> `work-loop` and `viable-options`.
> This text has no authority of its own. Where it conflicts with the graph
> at `origin/disposition`, the graph wins and the conflict is reported for
> alignment (§4). Declared as a shim on `work-loop`, whose
> liquidation condition is the exit list (§5). Reconciled on 2026-09-05,
> under the author's grant of 2026-09-04 for the sitting's final task, to
> `work-loop`'s recommended text on one clause its own reading found
> missing here: §4's landing procedure now says that the compare-and-swap
> it scripts is by hand and stands in for the landing instrument the
> `persistence` node prescribes and nothing has built, which the shim
> declaration on `work-loop` already said and this artifact did not. That
> recommendation is unanswered.

`/reconcile` runs one iteration of reconciliation on the implementation
ref (`greenfield` during bootstrap): derive the frontier, take the
highest-ranked answered node whose materialization diverges from its
answer, delegate the bite as a unit, verify, land, report, and stop. The
next invocation derives the frontier again. Bites run from disposition to
implementation only: an artifact no node justifies is not a bite under
this shim (§5). It never interviews the author and never records a
standing answer. It writes the graph only as decision state: its main
thread may record a viable option on a fact and move a fact's
recommendation, within the node's scope, and may never rule, edit a
ruling, edit the author's words, or recommend beyond the scope a
delegation confers (§4); the interview, the ruling, and the recording are
alignment's alone. A node no ruling reaches carries a draft and not an
answer, and nothing under it is bitten unless the author has granted that
reconciliation explicitly, in their own words, for that reconciliation —
a standing rule of this record and no shim, never assumed and never
carried over from one grant to the next (`authority`, `viable-options`).

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
every node in rank order with its class, instrument, shims, and stage,
under a heading of the alignment frontier in the ruling order, which
orders alignment and not this loop (`alignment-order`).
Only an answered node can be bitten, one whose class a ruling grants:
ratified, where the author's confirmed choice acts; delegated or deferred,
where the recommendation acts under the ruling on the authority fact or
under an ancestor's grant. A node no ruling reaches is unanswered: it
carries a draft, not an answer, and a bite
never pre-empts the author. What a bite materializes is the option that
acts — the confirmed choice on a ratified node, the recommendation on a
delegated or deferred one, whose text `## Answer` holds unless a fence
carries a newer recommendation (`viable-options`). If no node is answered, report
`no answered node: nothing to bite` and stop. Otherwise read the answered
nodes top down and take the first where one of these holds:

- a shim whose liquidation condition is met while its artifact still
  exists: liquidate it, delete or replace the artifact, and report the
  declaration for alignment to remove (§4);
- an instrument whose ref says it is not yet materialized, or whose check
  fails when run: materialize it or fix what it checks;
- an acting option that names an artifact, the browser, a rule, a skill, a
  page, whose current state does not match it: reconcile the artifact.

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
  acting option's text quoted, and the standing constraints: no
  state-changing
  git; write only the named files; never edit a node of the graph
  (`delegation`, `reconciliation-session-writes-options`); work only in
  this checkout; report the
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
  commit, every node of the graph this session wrote (§4), and what the
  projector shows, and stop: the frontier re-derives
  at the next invocation.

## 4. The graph

This session's main thread writes the `disposition` ref, and only as
decision state: a viable option recorded on a fact, and a fact's
recommendation moved onto one, within the node's scope (the author,
2026-09-04, quoted on `viable-options`; `work-loop`,
`reconciliation-writes-options`). It never rules, never edits a ruling or
the author's words, and never recommends beyond the scope a delegation
confers; a subagent never edits a node (`delegation`,
`reconciliation-session-writes-options`). An option this loop finds
dominated is not taken off the fact: it is marked passed over, with the
reason it was passed over, and stays on the list, since every candidate
that can be named is an option carrying its status and a candidate never
silently leaves the list (`prose-and-structure`). A ruling may carry the
author's own reason beside its response, its date and its pin
(`dialogue`, `ruling-carries-the-reason`), and this loop writes none of
it: rulings are the author's alone. Operational state, a bite in
flight and what this loop has already done, stays outside the graph, as
the author said. Two things come of what this session finds, one on the
record and one in the report:

- **A divergence that needs the author**, when the option that acts is
  silent or contradictory about the artifact it justifies, or the bite
  would need a decision only the author can make: take no bite on it, and
  record the conflicting answer as a viable option on the fact it
  conflicts with, with its `name`, a `source` naming this loop or the
  instrument that raised it, a `ref`, and a `####` subsection under
  `### answer` saying what it would answer and why it is viable. What
  follows is read from the class (`evaluation`, `overrule-by-class`). On a
  ratified node the confirmed choice keeps its full authority and goes on
  acting; move the recommendation onto the option only where that is the
  AI's judgment, and the node then returns to the alignment frontier at
  the review stage, which the session writes with the move and which is
  the state proposal names. On a deferred node a moved recommendation acts
  and the node is on the alignment frontier already. On a delegated node
  it acts within the delegation's scope and the node stays off the
  alignment frontier; a move that would leave the scope is not
  recommended, is recorded as an option, and returns the node to the
  author with its class intact and a stage on it. On an unanswered node
  nothing acts and the option is dialogue. Report the node, the
  divergence, and the recommendation with its boldness, which runs from
  the AI's own knowledge against the record, and its persistence class
  (`growth`, `transience`).
- **A shim whose liquidation condition this session has met**: liquidate
  the artifact on this ref and report that the declaration on the node is
  owed its removal by alignment; the declaration stands until then.

**Landing a graph write.** One node file at a time, by compare-and-swap
(`persistence`): from `disposition/`, `git fetch origin disposition`,
apply the write on top of `origin/disposition`, validate, commit that one
node file by pathspec with a message naming the node and what was
recorded, and `git push origin disposition`. On rejection, re-fetch and
reapply the write on the new head; never rebase the commit over another
session's, and never carry an unrelated change with it. The session names
in its report every node it wrote. This procedure is by hand, and it stands
in for the landing instrument the `persistence` node prescribes and nothing
has built: the compare-and-swap is a session following these steps, with no
tool that enforces the one-node pathspec, the validation, or the reapply on
rejection, so a session that skips a step breaks the protocol and nothing
catches it. That is the gap this shim covers, named here so a reader of the
artifact sees it (`work-loop`, whose shim declaration on this skill says the
same); it closes when the instrument exists and this paragraph goes with the
steps above it.

Whether reconciliation keeps state of its own outside the graph, a bite in
flight and the like, is a question the author
opened on 2026-09-03 (`work-loop`) and has not ruled on. Until then this
shim persists nothing beyond the git log and the options it records on the
graph: each invocation re-derives the frontier, and an option already
recorded is read from the node rather than raised again.

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
