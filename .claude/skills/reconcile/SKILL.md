---
name: reconcile
description: Reconcile materialized implementation to the disposition graph, one bite at a time in rank order. Bootstrap shim declared on work-loop; the graph wins on conflict. The session runs on opus, its units on sonnet.
model: opus
effort: high
disable-model-invocation: true
---
# Reconcile

> **Shim notice (2026-09-03).** Hand-written from the nodes `work-loop`,
> `materialization`, `review`, `validation-order`, `delegation`,
> `session-context`, `projection`, `transience`, `evaluation`, and
> `authority` of `commons.systems/disposition-graph`, all stamped deferred,
> and from the author's disposition of 2026-09-03 quoted on `work-loop`.
> This text has no authority of its own. Where it conflicts with the graph
> at `origin/disposition`, the graph wins and the conflict is recorded as an
> un-aligned disposition (§4). Declared as a shim on `work-loop`;
> liquidation: the reconciliation orchestrator and the bite skills are
> materialized from ratified nodes, and every landing made under this shim
> has passed the validation it skipped.

`/reconcile` runs the reconciliation loop on the implementation ref
(`greenfield` during bootstrap): derive the frontier, take the
highest-ranked bite whose materialization diverges from its node, delegate
it as a unit, verify, land, repeat until the frontier holds nothing this
session can take. It never interviews the author and never records a
standing answer. A divergence that needs the author becomes an un-aligned
disposition for the alignment skill; un-aligned dispositions are never
this skill's bites.

## Model

Run the session on `opus`: `claude --model opus`, then `/reconcile`. The
`model` field above sets the model for the turn that invokes the skill and
the loop runs inside that turn, but the flag is the sure way. Units run on
`sonnet` unless the brief names design or judgment, then `opus`; lookups
on `haiku` (`delegation`). Sonnet can run this skill itself once every
frontier node carries an executable check and each kind of bite has a
skill of its own, which is the last bite in the author's order; until
then choosing a bite and writing its contract from prose criteria is
judgment.

## 0. Currency

1. `git fetch origin greenfield disposition`. This checkout must be at
   `origin/greenfield` with a clean tree, and `disposition/`, the nested
   worktree of the `disposition` ref, at `origin/disposition` and clean.
   Stale or dirty stops the loop: say so and stop.
2. `node packages/disposition/validate.mjs disposition`.
3. `node packages/disposition/project.mjs disposition --rules .claude/rules`.
   If a rule file changed, commit it before anything else
   (`rules: regenerate from <node ids>`): rules bind every session and
   must be current before a bite is taken.
4. Read this file against the nodes it projects. Where a node differs,
   follow the node and record the difference as an un-aligned disposition
   (§4). Apply every shim the nodes declare without being asked.

## 1. Frontier

`node packages/disposition/project.mjs disposition --frontier -` lists
every node in rank order with its stamp, instrument, shims, and stage.
Read it top down and take the first node where one of these holds:

- a shim whose liquidation condition is met while its artifact still
  exists: liquidate it, delete or replace the artifact and remove the
  declaration (§4);
- an instrument whose ref says it is not yet materialized, or whose check
  fails when run: materialize it or fix what it checks;
- an answer that names an artifact, the browser, a rule, a skill, a page,
  whose current state does not match the answer: reconcile the artifact;
- an artifact on this ref that no node justifies (`work-loop`, the second
  direction): propose pruning it as an un-aligned disposition, or delete
  it outright when it is the scaffolding of a finished operation and no
  node cites it as evidence.

Skip a node whose divergence is the subject of an open dialogue (a node
with `stage`, or an un-aligned disposition under it that names the same
artifact): a bite never pre-empts the author. Skip what only the author
can decide. If nothing remains, report the frontier as read and stop.

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
- Then §0 again: the frontier re-derives after every landing.

## 4. Writing the graph

This session writes the `disposition` ref for two things only, each in a
commit of that one file, pushed at once.

- **An un-aligned disposition**, when a node's answer is silent or
  contradictory about the artifact it justifies, or a bite would need a
  decision only the author can make. Write
  `disposition/disposition-graph/<slug>.md`: `question`, `stage: ruling`,
  `under` the node it refines, and a `## Proposal` carrying the evidence,
  the divergence, and the recommendation with its authority class,
  boldness, and persistence class (`growth`, `transience`). No `## Answer`
  and no stamp. Validate; from `disposition/`, `git commit -- disposition-graph/<slug>.md`
  and `git push origin disposition`; on rejection fetch, rebase, push. The
  alignment skill takes it from there.
- **A shim declaration whose condition this session has met**: remove the
  entry from the node's `shims` list, nothing else in the node; validate,
  commit that file alone, push.

Never write an answer, a stamp, or any other field. Never edit a node
that has `stage` (an open dialogue).

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
  and `claude --model fable` for `/align`. The legacy memory index loads
  into both as noise; its one pointer says where the record is.
- **Bash guard** in an isolated session: it refuses `git -C`, loops,
  redirections, and heredocs that mention git; use an absolute `cd` per
  call, `tee` for redirection, a script file for multi-line edits, and
  `git commit -F <file>` for messages. `echo` of a word beginning with `=`
  is refused by zsh.
- **Scratch.** `$CLAUDE_JOB_DIR/tmp` in a background job, `tmp/` here.
  Nothing essential lives in scratch, memory, or this session: the state
  is the frontier and the git log. After compaction, run §0 and §1 again.
- **Dependencies.** `packages/disposition` imports `yaml` from an ancestor
  `node_modules` (`materialization`'s shim).
- **Publishing.** The Artifact tool; republish by URL; a transient
  network error on publish is retried once.
