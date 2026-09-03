---
name: align-review
description: Clean-context adversarial review of unanswered dispositions, one isolated subagent per node, verdicts applied by the invoking session. Invoked by the alignment sitting at its review stage, scoped to the sitting's nodes, or directly, scoped to every node at the review stage or to the ids given. Bootstrap shim declared on clean-context-review; the graph wins on conflict.
---
# Align review

> **Shim notice (2026-09-03).** Hand-written from the nodes
> `clean-context-review`, `recording`, `dialogue`, `unanswered`, and
> `delegation` of `commons.systems/disposition-graph`, all stamped deferred
> and unanswered, and from the author's ruling quoted on
> `clean-context-review`. This text has no authority of its own; where it
> conflicts with the graph at `origin/disposition`, the graph wins and the
> conflict is recorded as an un-aligned disposition on the node it
> conflicts with. Declared as a shim on `clean-context-review`, with
> `brief.md` and `apply.mjs` beside it. Liquidation: the projector
> materializes this skill from ratified nodes and these files are deleted.

`/align-review [node id ...]` reviews each node named, or every node at
`stage: review` when none is named, each in a context of its own, and
applies the verdicts. The alignment sitting invokes it when its dialogue
reaches the review stage, passing the ids of the nodes the sitting drafted
or amended and no others. The author invokes it directly to drain the
queue. The reviewer recommends and never writes; the session running this
skill decides and answers for the record (`recording`).

## 0. Currency

1. Fetch `origin/disposition`; the nested worktree `disposition/` must be
   at it with a clean tree, except the sitting's own uncommitted drafts
   when invoked from a sitting. Run
   `node packages/disposition/validate.mjs disposition`.
2. Read `clean-context-review` and `recording` at their current text;
   where they differ from this file, follow the node and record the
   difference as an un-aligned disposition.

## 1. Scope

- From a sitting: the ids of every node the dialogue discussed, drafted,
  amended, or left as it stands. Ids given: each must carry
  `stage: review`, or `stage: ruling` when the invoker names an amendment
  to review (then the invoker also names the amended text). Any other
  node stops the run: say which and stop.
- No ids: `node packages/disposition/project.mjs disposition --frontier -`,
  every node whose stage is `review`, a ratified node under review
  included, in the frontier's order.

## 2. One brief per node

For each node write `tmp/review/<slug>.brief.md` from `brief.md` beside
this file, filling `{{id}}`, `{{path}}` (the node file), `{{ancestry}}`
(the file written by
`node packages/disposition/project.mjs disposition --ancestry <id> --local tmp/review/<slug>.ancestry.md`),
`{{amendment}}` (the amended text to judge, or "the whole node"),
`{{siblings}}` (the round's other drafts, derived and never chosen: every
other node at `stage: review`, and every node file the graph worktree
holds changed against `origin/disposition`; "none" when there are none),
and `{{out}}` (`tmp/review/<slug>.json`). `brief.mjs` beside this file
derives the set and writes the ancestry and the brief. The brief carries
the judging criteria from `recording` and nothing of the session: no
drafts of the reply, no account of the sitting, no verdict hoped for.
What is isolated is the session's framing, never the record: the
reviewer reads the round's other drafts as part of the record the node
joins, and the ids it was given are recorded in the node's `review`
state at the apply step. `tmp/` is gitignored scratch.

## 3. One subagent per node

Launch every reviewer in one message with the Agent tool: type
`general-purpose`, model `opus`, effort high, the prompt "Read and follow
`<brief path>` exactly; you are a clean-context reviewer with no context
but the record; never run state-changing git; write only the output file
the brief names." Never a fork: a forked context carries the session's
framing and is not clean. Read each result's conclusion, never its
transcript. A reviewer that fails is relaunched once with the same brief;
a second failure is reported and its node stays at `review`.

## 4. Apply

1. Read every `tmp/review/<slug>.json`. For each entry whose `strength`
   is `strong`, and for any other where the session has something to say,
   write the session's reply into `tmp/review/replies.json` as
   `{ "<id>": "<reply>" }`: why the disposition stands regardless, or what
   the session accepts and amends. Where the session's judgment departs
   from a verdict, write `tmp/review/overrides.json` as
   `{ "<id>": "<stage>" }`.
2. `node .claude/skills/align-review/apply.mjs tmp/review/*.json --replies tmp/review/replies.json [--overrides tmp/review/overrides.json] [--date YYYY-MM-DD]`.
   For each entry it verifies the node's stage, appends
   `### Clean-context review, <date>` to `## Proposal` with the verdict,
   the findings, the counter-argument with its strength, the facts check,
   and the reply; on `forward` sets `stage: ruling` and writes `review`
   with `verdict`, `strength`, `date`, `of`, the node's draft hash, and
   `siblings`, the ids the brief gave the reviewer; on `kickback` sets
   the stage the reviewer named and writes the same `review` with the
   kickback verdict; an override wins on the stage. An
   amendment entry (`scope: amendment`) appends
   `### Clean-context review of the amendment, <date>` and changes no
   stage. Nothing else in a node is touched.
3. Amend any node the reply says the session accepts, then, when the
   amendment changes substance, set that node back to `stage: review`
   and send it through this skill again (`recording`); the frontier
   flags a review whose draft has changed since. The earlier review's
   subsection stays in the proposal as the dialogue's history.

## 5. Land

`node packages/disposition/validate.mjs disposition`; from `disposition/`,
commit the nodes changed with the message `review: <ids>` and the trailers
the harness asks for, `git push origin disposition` (fetch, rebase, and
push again on rejection); then rebuild and republish the alignment page as
the alignment skill's §4 says. When invoked from a sitting, the sitting
lands with its own round instead.

## Model and delegation

The reviewers run on `opus` at high effort (`delegation`: judgment). The
orchestration runs on whatever model invoked the skill; the replies and
overrides are the session's judgment and are never delegated.
