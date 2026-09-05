---
name: align-survey
description: The clean-context survey of the frontier. Invoked with no argument before the author rules, it reads the whole graph in one context and judges every node whose recommendation has moved since the survey last pinned it against every other node, for contradiction, supersession, redundancy, decomposition, vocabulary, cross-reference, placement, coverage and merge. It forwards nothing; the reader writes nothing, and the invoking session validates every finding against the record before any is applied. Bootstrap shim declared on review-skills; the graph wins on conflict.
---
# Align survey

> **Shim notice (declared 2026-09-04 on `review-skills`).** This file is the
> hand-written projection of the survey as a skill of its own, written from
> the nodes `clean-context-review` (how the reading is run, what its reader is
> given, and how it is pinned), `frontier-consistency` (the validations it
> runs), `review-skills` (the division of the review into two skills over one
> package, and what this file carries), and `review-model` (the model and the
> effort the reading runs on) of `commons.systems/disposition-graph`, none of
> them carrying a ruling and all of them therefore unanswered, and from the
> author's words quoted on them, among them the grant of 2026-09-04 under
> which this file was written before the author ruled. It has no authority of
> its own: where it differs from the graph at `origin/disposition`, the graph
> wins and the difference is recorded as an un-aligned disposition on the node
> it differs from. Reconciled on 2026-09-05, under the author's grant of
> 2026-09-04 for this sitting's final task, to `review-model`'s recommended
> text on the one point where this file diverged from it: §3 and the section
> on model and delegation named the harness's model and its effort in the
> file, where that node holds the name to be the harness's and the day's and
> requires the launch to name it and no text that outlives the launch to
> carry it; `.claude/skills/align-review/SKILL.md` already did so, and this
> file now does the same. That recommendation is unanswered.
> Liquidation: the projector materializes this skill from
> ratified nodes and this hand-written file is deleted.

`/align-survey` takes no argument. Its object is the frontier's consistency
with itself. It runs before the author rules, when the frontier shows a survey
owed, and whenever a session or the author invokes it. It forwards nothing:
only the review of a draft gives a verdict, and this reading's findings kick
back what must change.

The review of one draft is `/align-review <node id>`, a skill of its own, and
nothing of it is here.

## 0. Currency

1. Fetch `origin/disposition`; the nested worktree `disposition/` must be at
   it with a clean tree, except a sitting's own uncommitted drafts when
   invoked from a sitting. Run
   `node packages/disposition/validate.mjs disposition`.
2. Read `clean-context-review`, `frontier-consistency`, `review-skills`, and
   `review-model` at their current text. What a clean-context reading is, and
   the instruction text common to both readings, live there and not here;
   where a node differs from this file, follow the node and record the
   difference as an un-aligned disposition on it.

## 1. The judged set, and the context

The context is the whole graph, answered and unanswered at every stage, read
in one context without its `## Account` sections, which are the dialogue's
history and not its text. The judged set is every node at the review or ruling
stage whose recommendation hash differs from its survey pin or which carries
none (`clean-context-review`); each of those is judged against every other
node in the graph, on validations 7 to 15 of `frontier-consistency`, and
the sixteenth, the independence test of `probe-or-node` —
contradiction, supersession, redundancy, decomposition, vocabulary,
cross-reference, placement and order, coverage, and merge.

A finding may name a node at any stage, judged or not, and it is applied to
that node as the kickback flow says (the author, 2026-09-03: "Adversarial
review evaluates batch of nodes which are at the review dialogue phase against
the full graph").

This reading returns the probes it raises as well (`author-questions`): the
questions it needs the author to answer before a recommendation can be
grounded, each naming the node it is raised on and carrying what it `asks`,
`why` the record cannot answer it, `discharges`, what an answer would settle
and which recommendation it would move, and the `fact` it bears on where it
bears on one. Three limbs admit a probe and all must hold — the record does
not answer it and the reader has looked, the answer would move a
recommendation on the node it names, and the answer is not itself a
disposition, a question of that last kind being a node and going to the merge
finding instead. Finding none is a complete answer. The cap is three open
probes on one node, a compound probe counting as the probes it compounds, and
the reading checks it on every node it judges, as a finding naming the node
and the probes; the parser does not enforce it. A probe reaches any node in
the graph for the same reason a finding does, and it does the same thing
wherever it lands: a probe recorded on a node at the review or the ruling
stage returns that node to the `maieutic` stage, judged or not, and the survey
forwards nothing in any case.

`node packages/disposition/project.mjs disposition --frontier -` lists every
node with its stage, its class, what its facts recommend, and its review and
survey state, and shows where a survey is owed; `brief.mjs` takes the judged
set from the same reading. A node is ready for the author's ruling when it
carries a forward verdict pinned to the recommendation as it stands and a
survey pin on the same; this reading gives the second of the two.

## 2. The brief

`node packages/clean-context-review/brief.mjs --survey [--date YYYY-MM-DD]
[--dry]` writes `tmp/review/survey.brief.md` from `brief-survey.md` in that
package, names `tmp/review/survey.json` as the reader's output file, and
writes `tmp/review/survey.pins.json` beside the brief: the graph commit read
and the recommendation hash of every node of the graph, judged and context
alike. That sidecar is what the apply step compares against, and never a hash
the reader copied — which is what serializes this reading, so nothing is
locked. It computes no model and prints none (`review-model`).

The brief carries the validations this reading runs, how a tangle and a
subtree divergence are recorded (`alignment-order`), the admission test and
the cap a probe is held to, and nothing of the session. `tmp/` is gitignored
scratch.

## 3. The reader

Launch one subagent with the Agent tool: type `general-purpose`, at the model
and the effort `review-model` fixes for this reading, named in the prompt at
the launch and written down nowhere in this file; where that model is
unavailable to the launching session, the substitute is named in the prompt in
the same place, and no brief argues either — a clause `review-model`'s
recommended answer names unsupported implementation until the author rules on
`fallback-when-the-model-is-unavailable`, applied meanwhile and named here so a
reader of the skill sees it. Never a fork: a forked
context carries the session's framing and is not clean. The prompt: "Read and
follow `<the brief the previous step wrote>` exactly; you are a clean-context
reviewer with no context but the record; never run state-changing git; write
only the output file the brief names."

Read the result's conclusion, never its transcript. A reader that fails is
relaunched once with the same brief; a second failure is reported and every
node stays at its stage. This brief is the whole graph and is long: when
`brief.mjs` warns that it may exceed what one reader holds, ask the reader to
report what it could not read, and treat an unread part as a gap in the
reading rather than as a finding of nothing.

## 4. Validate, then apply

1. Read `tmp/review/survey.json`: the graph commit the reader read; `nodes`,
   one entry per judged node with its id and that node's findings;
   `subtree_divergences`, the tangles between subtrees it found; and
   `frontier`, the findings across the graph, each with the ids it names, the
   finding, the stage it recommends for each node whose text must change, the
   edit, merge, or split it proposes, and the `options` it proposes —
   `{node, name, text}` each; and `probes`, the questions it raises, each
   naming the node it is raised on. Validate every finding before any is
   applied, on
   this thread and never delegated (the author, 2026-09-03, quoted on
   `clean-context-review`): open each node, check that the text the finding
   quotes is there and says what the finding says, that the claim about the
   record or the implementation is true, and that the stage, edit, or option
   it recommends follows from the doctrine it cites. A probe is validated the
   same way and against the same three limbs: a `why` naming a locus that does
   settle the matter, a `discharges` naming no recommendation, and a probe
   whose answer would itself be a disposition are each the session's finding
   against the reading, recorded in the reply; a probe the session holds
   inadmissible on one of them is discharged with the reason that says what in
   the record answers it, and it stays on the list discharged rather than
   leaving it. Record the validation as
   the session's reply in `tmp/review/replies.json`, `{ "<id>": "<reply>" }`,
   one per judged node and one per node a finding names. A rejected stage
   recommendation is held by `tmp/review/overrides.json`,
   `{ "<id>": "<stage>" }`; the finding is still recorded on the node with the
   reply, as the dialogue's history, and the author sees both on the alignment
   page. Nothing is applied unvalidated.
2. `node packages/clean-context-review/apply.mjs tmp/review/survey.json
   --replies tmp/review/replies.json [--overrides tmp/review/overrides.json]
   [--pins tmp/review/survey.pins.json] [--date YYYY-MM-DD]`. It reads the
   reading from the file's own `scope`, and then:
   - for each judged node whose current recommendation hash equals the hash
     the pins sidecar recorded, writes `review.survey` with its `date` and its
     `of`, that same hash, and applies that node's findings; a judged node
     whose recommendation moved since receives nothing, is reported, and is
     judged again by the next survey. A finding naming a node whose
     recommendation has moved since the graph commit read is discarded with a
     note, for the same reason: a reading attests to the text it read;
   - appends `### Frontier finding, <date>` to every node a finding names, at
     whatever stage, with the kind, the finding, the other nodes named, the
     proposed edit, and where any proposed option was recorded, and sets each
     such node's stage to the earliest stage a finding of the run recommends
     for it, never forward of one another entry set, inserting a `stage:` line
     on a node that carried none, since a finding recorded on settled doctrine
     opens its dialogue — a stage-less node no entry names a stage for is
     refused, not guessed at;
   - splices each probe the session let stand into its node's `probes`, with
     the `id` the apply derives, `source: review`, and the reading's date as
     `raised`, and derives that node's stage from the probes before any
     finding's: a node that will carry an open probe after the run goes to the
     `maieutic` stage, or to `periagogic` where that is the earliest stage the
     run names for it, and never forward of where it stands
     (`author-questions`);
   - records each proposed option on the named node's **answer fact** with
     `source: review` and the reading's date as its `ref`, with a
     `#### <name>` subsection appended under `### answer` in `## Facts`
     (creating `### answer`, and `## Facts` in its section order, when
     absent), because every answer option but the one that stands says in
     prose what it would answer; a name already on that node's answer fact is
     skipped with a note, and the finding is still recorded;
   - writes each subtree divergence on the leaves and never on the ancestor
     (`alignment-order`): each node named under a side gains
     `<ancestor>#<option>` in its `depends`, and the entry's finding is
     recorded as `### Subtree divergence, <date>` on the ancestor and on every
     node named, so the author reads at the ancestor, on the alignment page,
     what a ruling for each option keeps and what it discards. A divergence
     naming an option the ancestor's answer fact does not carry, a node that
     is answered, a node that is the ancestor, or the same node under two
     options of one ancestor is refused, and a refused divergence writes
     nothing at all.

   Every node is parsed before and after its write: a node that would not
   validate after the write is reported and left unwritten, a node whose
   standing hash the edit moved is reported and left unwritten, and a run with
   any problem writes nothing at all. An override wins on the stage, except
   that no override puts a node carrying an open probe at the ruling stage.
   Nothing else in a node is touched — the `## Recommendation` fence, the
   rulings, and what each fact recommends least of all.
3. The session's judgment after the apply. A merge, split, or fold is a
   proposal to the author, recorded as an option on the answer fact of the
   node it would change and put to the author on the alignment page; the
   session never merges or splits. A lateral tangle between two unruled nodes
   is not a judgment call either: the earlier-recorded node stands and the
   later becomes an option on it, and a reader that named it the other way
   round is corrected in the reply and applied the right way round
   (`alignment-order`).

## 5. Land

`node packages/disposition/validate.mjs disposition`; from `disposition/`,
commit the nodes changed with the message `review: survey <date>` and the
trailers the harness asks for, `git push origin disposition` (fetch, rebase,
and push again on rejection); then rebuild and republish the alignment page as
the alignment skill's §4 says. When invoked from a sitting, the sitting lands
with its own round instead, at its next stage transition (`checkpoint`).

## Model and delegation

The model and the effort this reading runs on are `review-model`'s rule,
stated there and cited here, and §3 is where the launch names them; this file
writes no model's name down, because the name is the harness's and the day's,
and a reader cannot read it off a skill it never sees. Where the model that
node fixes is unavailable to the launching session, the substitute is named at
the launch and nowhere else, as it was for this sitting's readings on
2026-09-05. That clause is unsupported implementation by the `materialization`
node's test: `review-model`'s recommended answer leaves unavailability
unanswered, open on the option `fallback-when-the-model-is-unavailable`, and
names this skill's clause among the three it holds unsupported until the author
rules. Nothing in this file computes a model and no brief argues one. The orchestration runs on
whatever model invoked this skill; the validation of the findings, the
replies, the overrides, and what is put to the author from a merge or a split
are the session's judgment and are never delegated (`delegation`).
