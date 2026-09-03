---
name: align-review
description: Clean-context adversarial review of the whole unanswered frontier in one batch. One fresh subagent reads every node that carries a stage and returns a verdict per draft and the frontier's findings; the invoking session validates every finding against the record before applying any as a forward or a kickback. Invoked by the alignment sitting at its review stage or directly; the scope is always the whole frontier. Bootstrap shim declared on clean-context-review; the graph wins on conflict.
---
# Align review

> **Shim notice (2026-09-03, revised the same day).** Hand-written from
> the nodes `clean-context-review`, `frontier-consistency`, `recording`,
> `dialogue`, `unanswered`, `checkpoint`, and `delegation` of
> `commons.systems/disposition-graph`, all stamped deferred and
> unanswered, and from the author's words quoted on `clean-context-review`
> and `frontier-consistency`, among them the bootstrap exception of
> 2026-09-03 under which this shim was materialized before the author's
> ruling. This text has no authority of its own; where it conflicts with
> the graph at `origin/disposition`, the graph wins and the conflict is
> recorded as an un-aligned disposition on the node it conflicts with.
> Declared as a shim on `clean-context-review`, with `brief.md`,
> `brief.mjs`, and `apply.mjs` beside it. Liquidation: the projector
> materializes this skill from ratified nodes and these files are deleted.

`/align-review` reviews the whole unanswered frontier, every node that
carries a `stage`, in one batch and one clean context, and applies the
result. The alignment sitting invokes it when its dialogue reaches the
review stage; the author or a session invokes it directly. The scope is
the same either way (`clean-context-review`): no ids are taken, and a
sitting's drafts are reviewed among the rest. The reviewer recommends and
never writes; the session running this skill validates what the reviewer
found before it applies anything, and decides and answers for the record
(`recording`; the author, 2026-09-03, quoted on `clean-context-review`).

## 0. Currency and serialization

1. Fetch `origin/disposition`; the nested worktree `disposition/` must be
   at it with a clean tree, except the sitting's own uncommitted drafts
   when invoked from a sitting. Run
   `node packages/disposition/validate.mjs disposition`.
2. One batch at a time (`frontier-consistency`). `brief.mjs` writes
   `tmp/review/frontier.lock` naming the session and the time, and
   refuses to run while one exists; a review running in this session or
   another is waited for, never joined or doubled. A session that finds a
   lock whose writer is gone removes it and says so. This is the manual
   serialization the author set at low priority.
3. Read `clean-context-review` and `frontier-consistency` at their
   current text; where they differ from this file, follow the node and
   record the difference as an un-aligned disposition.

## 1. Scope

The frontier as the record holds it now:
`node packages/disposition/project.mjs disposition --frontier -`, every
node that carries a stage, in the frontier's order. A node at the review
or ruling stage receives a verdict on its draft; a node at the periagogic
or maieutic stage is surveyed with the rest and receives frontier
findings only. Nothing is excluded, and no ids are given.

## 2. One brief for the frontier

`node .claude/skills/align-review/brief.mjs [--date YYYY-MM-DD]` writes
`tmp/review/frontier.brief.md` from `brief.md` beside this file, filling
`{{date}}`, `{{frontier}}` (one line per node with a stage: id, stage,
rank, stamp, file path, in the frontier's order), `{{answered}}` (the
answered nodes' ids and paths, the doctrine the frontier joins, or
"none"), and `{{out}}` (`tmp/review/frontier.json`), and writes the lock.
The brief carries the validations from `frontier-consistency` and the
judging criteria from `recording`, and nothing of the session: no drafts
of the reply, no account of the sitting, no verdict hoped for. What is
isolated is the session's framing, never the record: the reviewer reads
the frontier whole because the drift it exists to catch is between nodes.
`tmp/` is gitignored scratch.

## 3. One subagent for the batch

Launch one reviewer with the Agent tool: type `general-purpose`, model
`opus`, effort high, the prompt "Read and follow
`tmp/review/frontier.brief.md` exactly; you are a clean-context reviewer
with no context but the record; never run state-changing git; write only
the output file the brief names." Never a fork: a forked context carries
the session's framing and is not clean. Read the result's conclusion,
never its transcript. A reviewer that fails is relaunched once with the
same brief; a second failure is reported, the lock removed, and every node
stays at its stage.

## 4. Apply

1. Read `tmp/review/frontier.json`: `nodes`, one entry per node with a
   draft, and `frontier`, the findings across nodes, each with the ids it
   names, the finding, the stage it recommends for each node, and the
   edit, merge, or split it proposes. Validate every finding before any
   is applied, on this thread and never delegated: open the node, check
   that the text the finding quotes is there and says what the finding
   says, that the claim about the record or the implementation is true,
   and that the stage or edit it recommends follows from the doctrine the
   finding cites. Record the validation as the session's reply in
   `tmp/review/replies.json`, `{ "<id>": "<reply>" }`, one per node entry
   and one per node a frontier finding names: which findings the session
   accepts and what it amends for them, which it rejects and why, and why
   the disposition stands against the counter-argument or what changes
   for it. A rejected verdict or a rejected stage recommendation is held
   by `tmp/review/overrides.json`, `{ "<id>": "<stage>" }`; the finding is
   still recorded on the node with the reply, as the dialogue's history,
   and the author sees both on the alignment page. Nothing is applied
   unvalidated.
2. `node .claude/skills/align-review/apply.mjs tmp/review/frontier.json --replies tmp/review/replies.json [--overrides tmp/review/overrides.json] [--date YYYY-MM-DD]`.
   For each node entry it verifies the node's stage, appends
   `### Clean-context review, <date>` to `## Proposal` with the verdict,
   the findings, the facts check, the counter-argument with its strength,
   and the reply; on `forward` sets `stage: ruling` and writes `review`
   with `verdict`, `strength`, `date`, and `of`, the node's draft hash;
   on `kickback` sets the stage the reviewer named and writes the same
   `review` with the kickback verdict. For each frontier finding it
   appends `### Frontier finding, <date>` to every node the finding
   names, with the kind, the finding, the other nodes named, and the
   proposed edit, merge, or split, and sets each node's stage to the
   stage the finding recommends for it, never forward of a stage another
   entry of the same run set: a node kicked back to the periagogic stage
   by one finding is not moved on by another. An override wins on the
   stage. Nothing else in a node is touched.
3. The session's judgment on the frontier's findings: a merge or split is
   a proposal to the author, recorded on the nodes by the apply step and
   put to the author on the alignment page; the session never merges or
   splits. Amend any node the reply says the session accepts, then, when
   the amendment changes substance, set that node back to `stage: review`
   for the next batch (`recording`); a batch is not re-run for one
   amendment, and the frontier flags a review whose draft has changed
   since. The earlier review's subsection stays in the proposal as the
   dialogue's history.
4. Remove the lock.

## 5. Land

`node packages/disposition/validate.mjs disposition`; from `disposition/`,
commit the nodes changed with the message `review: frontier <date>` and
the trailers the harness asks for, `git push origin disposition` (fetch,
rebase, and push again on rejection); then rebuild and republish the
alignment page as the alignment skill's §4 says. When invoked from a
sitting, the sitting lands with its own round instead, at its next stage
transition (`checkpoint`).

## Model and delegation

The reviewer runs on `opus` at high effort (`delegation`: judgment). The
orchestration runs on whatever model invoked the skill; the validation of
the findings, the replies, the overrides, and what is put to the author
from a merge or a split are the session's judgment and are never
delegated.
