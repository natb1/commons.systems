---
name: align-review
description: Clean-context adversarial review in two readings divided by their object. The review of one draft, invoked by node id the moment that node's recommendation is recorded, judges the draft against its neighbourhood and forwards it or kicks it back; the survey of the frontier, invoked with --survey before the author rules, judges every node whose recommendation has moved since its survey pin against the whole graph. Each reading is one fresh subagent that reads the record and writes nothing; the invoking session validates every finding against the record before applying any as a forward, a kickback, or an option proposed on a node's answer fact. Bootstrap shim declared on clean-context-review; the graph wins on conflict.
---
# Align review

> **Shim notice (2026-09-03, revised three times the same day: for the
> batch scope, the fifteenth validation, the dialogue-state encoding, and
> the ruling order, the last under the author's bootstrap grant on
> `alignment-order`; revised again on 2026-09-04 under the author's grant
> for the alignment-page sitting, for the `facts` encoding, the class
> leaving the recommendation, and the reversed direction of boldness;
> reconciled again on 2026-09-04, under the author's bootstrap grant of
> that day for the `viable-options` sitting, onto the facts-with-options
> encoding: no stamp, the class read off the rulings, an option in place of
> an alternative, and the viability judgment the `recording` node's first
> step now asks of the reviewer; reconciled once more on 2026-09-04, under
> the author's grant of that day on `decomposition` ("go, and bootrap
> authority granted"), to that node's recommended text and to the options
> `per-draft-and-survey` on `clean-context-review` and
> `split-survey-from-per-draft` on `frontier-consistency`: the review
> divided by its object, the draft's reading when its recommendation is
> recorded and the survey before the ruling, the survey's pin at apply in
> place of the lock, and the reviewer's model read from the node. Every
> recommendation these reconciliations wrote is unanswered, and the review
> is what is owed on them.)**
> Hand-written from the nodes `clean-context-review`,
> `frontier-consistency`, `recording`, `dialogue`, `unanswered`,
> `viable-options`, `decomposition`,
> `checkpoint`, `alignment-order`, and `delegation` of
> `commons.systems/disposition-graph`,
> none of them carrying a ruling and all of them therefore unanswered, and
> from the author's words quoted
> on `clean-context-review` and `frontier-consistency`, among them the
> bootstrap grant of 2026-09-03 under which this shim was materialized
> before the author's ruling. This text has no authority of its own; where
> it conflicts with the graph at `origin/disposition`, the graph wins and
> the conflict is recorded as an un-aligned disposition on the node it
> conflicts with. Declared as a shim on `clean-context-review`, with the
> reviewers' briefs `brief-draft.md` and `brief-survey.md` and the scripts
> `brief.mjs` and `apply.mjs` beside it. Liquidation: the
> projector materializes this skill from ratified nodes and these files
> are deleted.

`/align-review` runs two readings divided by their object
(`clean-context-review`, `frontier-consistency`, `decomposition`), each in
one fresh context that carries nothing of the invoking session and is never
a fork, each reading the record and writing nothing to it.

**The review of a draft**, `/align-review <node id>`. Its object is one
node's recommendation, and it runs the moment that recommendation is
recorded or moved in substance, which is the node's transition to the
review stage; the alignment sitting invokes it on the node it drafted, and
the author or a session invokes it on any node at that stage. Its scope is
that draft against its neighbourhood, and it alone forwards a node to the
ruling stage.

**The survey**, `/align-review --survey`. Its object is the frontier's
consistency with itself: the whole graph read in one context, judging every
node at the review or ruling stage whose recommendation has moved since the
survey last pinned it. It runs before the author rules, when the frontier
shows a survey owed, and whenever it is invoked.

The reviewer recommends and never writes; the session running this skill
validates what the reviewer found before it applies anything, and decides
and answers for the record (`recording`; the author, 2026-09-03, quoted on
`clean-context-review`).

## 0. Currency and serialization

1. Fetch `origin/disposition`; the nested worktree `disposition/` must be
   at it with a clean tree, except the sitting's own uncommitted drafts
   when invoked from a sitting. Run
   `node packages/disposition/validate.mjs disposition`.
2. Read `clean-context-review`, `frontier-consistency`, and
   `decomposition` at their
   current text; where they differ from this file, follow the node and
   record the difference as an un-aligned disposition.

Nothing is locked. Reviews of drafts never wait on each other, and the
survey is serialized by the pin its findings carry: a finding is applied
only where the recommendation still matches what the survey read, and is
discarded where it is stale (§4, `clean-context-review`).

## 1. Scope: one draft, or the frontier

**The review of a draft**, `/align-review <node id>`: the node at
`stage: review`, and it alone receives a verdict. Its reader is given the
node whole; the chain of nodes above it; its siblings under the same
parent, which the checkpoint has landed; the nodes it names; the rules that
bind everywhere; the author's words on each; and the index of every
question the record asks, with its class, its stage, its standing answer,
and the options on its answer fact, so that a draft answering a question
the record already asks is caught at the draft. It runs validations 1 to 6
and 15 of `frontier-consistency`, judges whether every option on the node's
facts is viable and whether a viable one is missing, and returns the
strongest counter-argument with its strength.

**The survey**, `/align-review --survey`: the context is the whole graph,
answered and unanswered at every stage, without its `## Account` sections,
which are the dialogue's history and not its text. The judged set is every
node at the review or ruling stage whose recommendation hash differs from
its survey pin or which carries none. It runs validations 7 to 15 of
`frontier-consistency`, each node against every other, and its findings
name the graph commit read. A finding may name a node at any stage, and it
is applied to that node as the kickback flow says (the author, 2026-09-03:
"Adversarial review evaluates batch of nodes which are at the review
dialogue phase against the full graph").

`node packages/disposition/project.mjs disposition --frontier -` shows the
whole graph with each node's stage, settling count, class, what its facts
recommend, its review and survey state, and whether it is ready to rule,
headed by the alignment frontier in the ruling order (`alignment-order`);
`brief.mjs` takes the judged set from the same reading. A node is ready for
the author's ruling when it carries a forward verdict pinned to the
recommendation as it stands and a survey pin on the same; the frontier and
the alignment page show which of the two is owed, and no ruling is recorded
while either is (`clean-context-review`).

## 2. One brief for the reading

**A draft.** `node .claude/skills/align-review/brief.mjs --node <id>
[--date YYYY-MM-DD] [--dry]` writes `tmp/review/draft-<slug>.brief.md` from
`brief-draft.md` beside this file, names `tmp/review/draft-<slug>.json` as
the reviewer's output file, and prints the reviewer's model it computed
from the node, `fable` or `opus`, by the rule in §3. It fills `{{date}}`,
`{{repo}}`, `{{node}}`
(the node whole: question, `## Disposition`, the `## Answer` that
stands, `## Rationale`, every fact with every option it holds viable — its
source and `ref`, its prose, the readings that bear on it, and whether it is
the recommended one, the one that stands, or the ruled one — the
`## Recommendation` fence when there is one, the review state with its
staleness, `depends` as `<id>#<option>`, `bears` on a reading, and the
`## Account`), `{{ancestry}}` (the chain of nodes above it and the rules
that bind everywhere, in the same shape without their `## Account`
sections, which are the dialogue's history and not its text),
`{{siblings}}` (the nodes under the same parent, in that shape, taken from
the record and never from a set the session names), `{{cited}}` (the nodes
it names, in that shape), `{{index}}` (every question the
record asks, one line each: id, class, stage, standing answer, and the
other options on its answer fact, so the reviewer can find a question the
record already asks), `{{nav}}` (the brief's own line count and where its
parts begin), and `{{out}}`.

**The survey.** `node .claude/skills/align-review/brief.mjs --survey
[--date YYYY-MM-DD] [--dry]` writes `tmp/review/survey.brief.md` from
`brief-survey.md` beside this file and names `tmp/review/survey.json`. It
fills `{{date}}`, `{{repo}}`, `{{commit}}` (the graph commit it read, which
the survey's findings carry), `{{batch_count}}` and `{{context_count}}`,
`{{batch_index}}` and `{{context_index}}` (one line per node: id, stage,
rank, settling count, class and where it comes from, file; the judged set
in the ruling order, the context by rank), `{{batch}}` (each judged node
whole, in the shape above), `{{context}}` (every other node with its class,
stage, question, standing answer, and the other options on its answer
fact), `{{nav}}`, and `{{out}}`. No `## Account` section goes into the
survey's brief. Beside the brief it writes `tmp/review/survey.pins.json`,
the hash of every node's recommendation as the survey read it, judged and
context alike, with the graph commit: the pins the apply step compares
against, never a hash the reviewer copied.

Each brief carries the validations its reading runs — 1 to 6 and 15 for a
draft, 7 to 15 for the survey (`frontier-consistency`) — the viability
judgment the `recording` node's first step asks of a draft's reviewer as
the author amended it on 2026-09-04, whether every option on the node's
facts is viable and whether a viable one is missing, and the judging
criteria from `recording`, and nothing of the session: no drafts of the
reply, no account of the sitting, no verdict hoped for. What is isolated is
the session's framing, never the record: the survey reads the graph whole
because the drift it exists to catch is between its nodes, and a draft's
reader is given its neighbourhood from the record. `tmp/` is gitignored
scratch.

## 3. One subagent for the reading

Launch one reviewer per invocation with the Agent tool: type
`general-purpose`, effort high, model the one `brief.mjs` printed for a
draft and `opus` for the survey, the prompt "Read and follow
`<the brief the previous step wrote>` exactly; you are a clean-context
reviewer with no context but the record; never run state-changing git;
write only the output file the brief names." A draft's reviewer runs on a
model never smaller than the drafter's, and on `fable` when the
recommendation's boldness is not low, the node is global-tier, or a ruling
on it would settle other nodes; the skill reads that from the node and no
brief argues it (`clean-context-review`, `decomposition`). Never a fork: a
forked context carries the session's framing and is not clean. Read the
result's conclusion, never its transcript. A reviewer that fails is
relaunched once with the same brief; a second failure is reported and every
node stays at its stage. The brief may be long: when `brief.mjs` says so,
ask the reviewer to report what it could not read, and treat an unread part
as a gap in the reading rather than as a finding of nothing.

## 4. Apply

1. Read the output file the brief named. For a draft,
   `tmp/review/draft-<slug>.json`: one entry for the node, its verdict,
   findings, facts check, viability judgment, and counter-argument. For the
   survey, `tmp/review/survey.json`: the graph commit it read, `nodes`, one
   entry per judged node with its id and that node's findings, the hash the
   survey read being in `tmp/review/survey.pins.json`, `subtree_divergences`, the tangles
   between subtrees the reviewer found, and `frontier`, the findings across
   the graph, each
   with the ids it names, the finding, the
   stage it recommends for each node whose text must change, the edit,
   merge, or split it proposes, and the `options` it proposes — `{node,
   name, text}` each. Validate every finding before any is applied, on this
   thread and never delegated: open the node, check that the text the
   finding quotes is there and says what the finding says, that the claim
   about the record or the implementation is true, and that the stage,
   edit, or option it recommends follows from the doctrine the finding
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
2. `node .claude/skills/align-review/apply.mjs <json> --replies tmp/review/replies.json [--overrides tmp/review/overrides.json] [--date YYYY-MM-DD]`.
   **For a draft review**, on the one node: it verifies that the node is at
   the review stage, appends
   `### Clean-context review, <date>` to `## Account` (creating the section
   when absent) with the verdict, the findings, the facts check, the
   viability judgment, the counter-argument with its strength, and the
   reply; on `forward` sets `stage: ruling` and writes `review` with
   `verdict`, `strength`, `date`, and `of`, the reader's
   `deriveRecommendationHash` for the node as edited — the pin that goes
   stale when any fact's recommendation moves; on `kickback` sets the stage
   the reviewer named and writes the same `review` with the kickback
   verdict.
   **For the survey**: for each judged node whose current recommendation
   hash equals the hash the survey read, it writes `review.survey` with its
   `date` and its `of`, that same hash, and applies that node's findings; a
   judged node whose recommendation moved since the survey read it receives
   nothing, is reported, and is judged again by the next survey. A finding
   naming a node whose recommendation has moved since the survey's graph
   commit is discarded with a note, for the same reason: a review attests
   to the text it read. For each finding it appends
   `### Frontier finding, <date>` to every node the finding names, at
   whatever stage, with the kind, the finding, the other nodes named,
   the proposed edit, and where any proposed option was recorded; it
   sets each node's stage to the stage the finding recommends for it, never
   forward of a stage another entry of the same run set (a node kicked back
   to the periagogic stage by one finding is not moved on by another), and
   it inserts a `stage:` line on a node that carried none, since a finding
   recorded on settled doctrine opens its dialogue — a stage-less node that
   no entry names a stage for is refused, not guessed at. Each proposed
   option is appended to the named node's **answer fact** with `source:
   review` and the review's date as its `ref`, with a `#### <name>`
   subsection appended under `### answer` in `## Facts` (creating
   `### answer`, and `## Facts` in its section order before
   `## Recommendation`/`## Account`, when absent), because every answer
   option but the one that stands says in prose what it would answer; a
   name already on that node's answer fact is skipped with a note, and the
   finding is still recorded.
   For each entry of `subtree_divergences` it writes the divergence on the
   leaves and never on the ancestor (`alignment-order`): each node named
   under a side gains `<ancestor>#<option>` in its `depends`, and the
   entry's finding is recorded as `### Subtree divergence, <date>` on the
   ancestor and on every node named, so the author reads at the ancestor, on the
   alignment page, what a ruling for each option keeps and what it
   discards. A divergence naming an option the ancestor's answer fact does
   not carry, a node that is answered, a node that is the ancestor, or the
   same node under two options of one ancestor is refused, and a refused
   divergence writes nothing at all.
   Every node is parsed before and after its write: a node that would not
   validate after the write is reported and left unwritten, a node whose
   standing hash the edit moved is reported and left unwritten (this script
   writes dialogue state and the account only), and a run with any problem
   writes nothing at all. An override wins on the stage. Nothing else in a
   node is touched — the `## Recommendation` fence, the rulings, and what
   each fact recommends least of all.
3. The session's judgment on the findings: a merge, split, or fold is a
   proposal to the author, recorded by the apply step as an option on the
   answer fact of the node it would change and put to the author on the
   alignment page; the session never merges or splits. A lateral tangle
   between two unruled nodes is not a judgment call either: the
   earlier-recorded node stands and the later becomes an option on
   it, and a reviewer that named the other way round is corrected in the
   reply and applied the right way round (`alignment-order`). Amend any node the
   reply says the session accepts, then, when the amendment changes
   substance, set that node back to `stage: review` and run the review of
   that draft again
   (`recording`); the frontier
   flags a review whose pin no longer matches what the node recommends
   (`reviewStale`), as it flags a ruled node whose recommendation has moved
   since the ruling (`moved`, a proposal). The earlier review's subsection
   stays in the account as the dialogue's history.

## 5. Land

`node packages/disposition/validate.mjs disposition`; from `disposition/`,
commit the nodes changed with the message `review: <node slug> <date>` for
a draft or `review: survey <date>` for the survey, and
the trailers the harness asks for, `git push origin disposition` (fetch,
rebase, and push again on rejection); then rebuild and republish the
alignment page as the alignment skill's §4 says. When invoked from a
sitting, the sitting lands with its own round instead, at its next stage
transition (`checkpoint`).

## Model and delegation

The survey's reviewer runs on `opus` at high effort (`delegation`:
judgment). A draft's reviewer runs at high effort on the model this skill
reads from the node, never smaller than the drafter's, `fable` when the
recommendation's boldness is not low, the node is global-tier, or a ruling
on it would settle other nodes, and `opus` otherwise
(`clean-context-review`, `decomposition`): a reader weaker than the writer
finds what the writer already saw, and the most capable model on every
simple draft is the cost `delegation`'s rule exists to avoid. The
orchestration runs on whatever model invoked the skill; the validation of
the findings, the replies, the overrides, and what is put to the author
from a merge or a split are the session's judgment and are never
delegated.

## Tests

`node --test .claude/skills/align-review/*.test.mjs`, against the fixture
graph in `fixtures/frontier/` and `packages/disposition/fixtures/valid-dialogue/`;
never against `disposition/`.
