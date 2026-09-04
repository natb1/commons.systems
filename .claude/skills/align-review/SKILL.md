---
name: align-review
description: Clean-context adversarial review of the batch of nodes at the review stage, judged against the full graph. One fresh subagent reads the batch whole and the rest of the graph as its context, and returns a verdict per node of the batch and the findings across the graph; the invoking session validates every finding against the record before applying any as a forward, a kickback, or a proposed alternative. Invoked by the alignment sitting at its review stage or directly; the scope is the same either way. Bootstrap shim declared on clean-context-review; the graph wins on conflict.
---
# Align review

> **Shim notice (2026-09-03, revised three times the same day: for the
> batch scope, the fifteenth validation, the dialogue-state encoding, and
> the ruling order, the last under the author's bootstrap grant on
> `alignment-order`; revised again on 2026-09-04 under the author's grant
> for the alignment-page sitting, for the `facts` encoding, the class
> leaving the recommendation, and the reversed direction of boldness. The
> recommendations that reconciliation wrote are unanswered, and this
> review is what is owed on them.)**
> Hand-written from the nodes `clean-context-review`,
> `frontier-consistency`, `recording`, `dialogue`, `unanswered`,
> `checkpoint`, `alignment-order`, and `delegation` of
> `commons.systems/disposition-graph`,
> all stamped deferred and unanswered, and from the author's words quoted
> on `clean-context-review` and `frontier-consistency`, among them the
> bootstrap grant of 2026-09-03 under which this shim was materialized
> before the author's ruling. This text has no authority of its own; where
> it conflicts with the graph at `origin/disposition`, the graph wins and
> the conflict is recorded as an un-aligned disposition on the node it
> conflicts with. Declared as a shim on `clean-context-review`, with
> `brief.md`, `brief.mjs`, and `apply.mjs` beside it. Liquidation: the
> projector materializes this skill from ratified nodes and these files
> are deleted.

`/align-review` reviews one batch — the nodes at `stage: review` — against
the full graph, in one clean context, and applies the result. The alignment
sitting invokes it when its dialogue reaches the review stage; the author or
a session invokes it directly. The scope is the same either way
(`clean-context-review`): no ids are taken, and a sitting's recommendations
are reviewed among the rest. The reviewer recommends and never writes; the
session running this skill validates what the reviewer found before it
applies anything, and decides and answers for the record (`recording`; the
author, 2026-09-03, quoted on `clean-context-review`).

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

## 1. Scope: a batch, and the graph as its context

The **batch** is every node carrying `stage: review`, as the record holds it
now. Those nodes, and only those, receive a verdict. The **context** is the
full graph: every other node, answered or unanswered, at every stage. The
context receives no verdict, but a finding may name a node in it, and a
finding that does is applied to that node as the kickback flow says
(`clean-context-review`, the author's words of 2026-09-03: "Adversarial
review evaluates batch of nodes which are at the review dialogue phase
against the full graph"). Nothing is excluded from the reading, and no ids
are given.

`node packages/disposition/project.mjs disposition --frontier -` shows the
whole graph with each node's stage, settling count, recommendation, and
review, headed by the alignment frontier in the ruling order
(`alignment-order`); `brief.mjs` takes the batch from the same reading.

## 2. One brief for the batch

`node .claude/skills/align-review/brief.mjs [--date YYYY-MM-DD] [--dry]`
writes `tmp/review/frontier.brief.md` from `brief.md` beside this file, and
writes the lock. It fills `{{date}}`, `{{repo}}`, `{{batch_count}}` and
`{{context_count}}`, `{{batch_index}}` and `{{context_index}}` (one line per
node: id, stage, rank, settling count, stamp, file; the batch in the
ruling order, the context by rank), `{{batch}}`
(each batch node whole: question, `## Disposition`, `## Answer`,
`## Rationale`, every pending alternative with its prose, the
`recommendation` with its `adopts`, class, boldness and whether it is stale,
the `## Recommendation` fence when there is one, and the `## Account`),
`{{context}}` (every other node with its stamp, stage, question, answer, and
pending alternatives, so the reviewer can find a question the record already
asks), `{{nav}}` (the brief's own line count and where its parts begin), and
`{{out}}` (`tmp/review/frontier.json`).

The brief carries the validations from `frontier-consistency` and the judging
criteria from `recording`, and nothing of the session: no drafts of the
reply, no account of the sitting, no verdict hoped for. What is isolated is
the session's framing, never the record: the graph is read whole because the
drift the review exists to catch is between its nodes. `tmp/` is gitignored
scratch.

## 3. One subagent for the batch

Launch one reviewer with the Agent tool: type `general-purpose`, model
`opus`, effort high, the prompt "Read and follow
`tmp/review/frontier.brief.md` exactly; you are a clean-context reviewer
with no context but the record; never run state-changing git; write only
the output file the brief names." Never a fork: a forked context carries
the session's framing and is not clean. Read the result's conclusion,
never its transcript. A reviewer that fails is relaunched once with the
same brief; a second failure is reported, the lock removed, and every node
stays at its stage. The brief is long: when `brief.mjs` says so, ask the
reviewer to report what it could not read, and treat an unread part as a
gap in the reading rather than as a finding of nothing.

## 4. Apply

1. Read `tmp/review/frontier.json`: `nodes`, one entry per node of the
   batch, `subtree_divergences`, the tangles between subtrees the reviewer
   found, and `frontier`, the findings across the graph, each with the ids
   it names (in the batch or outside it), the finding, the stage it
   recommends for each node whose text must change, the edit, merge, or
   split it proposes, and the `alternatives` it proposes — `{node, name,
   text}` each. Validate every finding before any is applied, on this
   thread and never delegated: open the node, check that the text the
   finding quotes is there and says what the finding says, that the claim
   about the record or the implementation is true, and that the stage,
   edit, or alternative it recommends follows from the doctrine the finding
   cites. Record the validation as the session's reply in
   `tmp/review/replies.json`, `{ "<id>": "<reply>" }`, one per node entry
   and one per node a finding names: which findings the session accepts and
   what it amends for them, which it rejects and why, and why the
   disposition stands against the counter-argument or what changes for it.
   A rejected verdict or a rejected stage recommendation is held by
   `tmp/review/overrides.json`, `{ "<id>": "<stage>" }`; the finding is
   still recorded on the node with the reply, as the dialogue's history,
   and the author sees both on the alignment page. Nothing is applied
   unvalidated.
2. `node .claude/skills/align-review/apply.mjs tmp/review/frontier.json --replies tmp/review/replies.json [--overrides tmp/review/overrides.json] [--date YYYY-MM-DD]`.
   For each node entry it verifies that the node is in the batch, appends
   `### Clean-context review, <date>` to `## Account` (creating the section
   when absent) with the verdict, the findings, the facts check, the
   counter-argument with its strength, and the reply; on `forward` sets
   `stage: ruling` and writes `review` with `verdict`, `strength`, `date`,
   and `of`, the reader's `draftHash` for the recommended text that was
   read; on `kickback` sets the stage the reviewer named and writes the same
   `review` with the kickback verdict. For each finding it appends
   `### Frontier finding, <date>` to every node the finding names, in the
   batch or outside it, with the kind, the finding, the other nodes named,
   the proposed edit, and where any proposed alternative was recorded; it
   sets each node's stage to the stage the finding recommends for it, never
   forward of a stage another entry of the same run set (a node kicked back
   to the periagogic stage by one finding is not moved on by another), and
   it inserts a `stage:` line on a node that carried none, since a finding
   recorded on settled doctrine opens its dialogue — a stage-less node that
   no entry names a stage for is refused, not guessed at. Each proposed
   alternative is added to the named node's `alternatives` with `source:
   review` and the review's date as its `ref`, with a `### <name>`
   subsection appended to `## Alternatives` (creating the section, before
   `## Recommendation`/`## Account`, when absent); a name already listed on
   that node is skipped with a note, and the finding is still recorded.
   For each entry of `subtree_divergences` it writes the divergence on the
   leaves and never on the ancestor (`alignment-order`): each node named
   under a side gains `<ancestor>#<alternative>` in its `depends`, and the
   entry's finding is recorded as `### Subtree divergence, <date>` on the
   ancestor and on every node named, so the author reads at the ancestor, on the
   alignment page, what a ruling for each alternative keeps and what it
   discards. A divergence naming an alternative the ancestor does not
   carry, a node that is answered, a node that is the ancestor, or the
   same node under two sides of one ancestor is refused, and a refused
   divergence writes nothing at all.
   Every node is parsed before and after its write: a node that would not
   validate after the write is reported and left unwritten, and a run with
   any problem writes nothing at all. An override wins on the stage.
   Nothing else in a node is touched — the `## Recommendation` fence and the
   node's hashes least of all.
3. The session's judgment on the findings: a merge, split, or fold is a
   proposal to the author, recorded by the apply step as a pending
   alternative on the node it would change and put to the author on the
   alignment page; the session never merges or splits. A lateral tangle
   between two unanswered nodes is not a judgment call either: the
   earlier-recorded node stands and the later becomes an alternative on
   it, and a reviewer that named the other way round is corrected in the
   reply and applied the right way round (`alignment-order`). Amend any node the
   reply says the session accepts, then, when the amendment changes
   substance, set that node back to `stage: review` for the next batch
   (`recording`); a batch is not re-run for one amendment, and the frontier
   flags a review whose recommended text has changed since, as it flags a
   recommendation whose standing text has changed since it was drafted.
   The earlier review's subsection stays in the account as the dialogue's
   history.
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

## Tests

`node --test .claude/skills/align-review/*.test.mjs`, against the fixture
graph in `fixtures/frontier/` and `packages/disposition/fixtures/valid-dialogue/`;
never against `disposition/`.
