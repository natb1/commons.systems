---
name: align-review
description: The clean-context review of one draft. Invoked by node id the moment that node's recommendation is recorded or moved in substance, it reads that draft against its neighbourhood in one fresh context and either forwards it to the author's ruling or kicks it back with findings. The reader writes nothing; the invoking session validates every finding against the record before any is applied. Bootstrap shim declared on review-skills; the graph wins on conflict.
---
# Align review

> **Shim notice (declared 2026-09-04 on `review-skills`).** This file is the
> hand-written projection of the review of a draft as a skill of its own,
> written from the nodes `clean-context-review` (how the reading is run and
> what its reader is given), `recording` (what the reading judges),
> `review-skills` (the division of the review into two skills over one
> package, and what this file carries), `review-model` (the model and the
> effort the reading runs on), and `review-cost` (what a reading costs and
> how its brief bounds it) of `commons.systems/disposition-graph`, none of
> them carrying a ruling and all of them therefore unanswered, and from the
> author's words quoted on them, among them the grant of 2026-09-04 under
> which this file was written before the author ruled. Reconciled on
> 2026-09-05, under the author's grant of that day ("record and reconcile
> that disposition first before proceeding with review (you have bootstrap
> authority)"), to `neighbourhood-questions-and-delta` on `review-cost`: the
> neighbourhood in full and every other node as its question alone, each
> neighbour carried by what it answers rather than by its whole file and the
> node under review the one node given whole, the
> re-reading whose object is the amendment and not the node, the two readings
> one answer gets, the brief written to be held whole, and the model no
> longer written down here; and to the option
> `pointers-for-what-grows-with-the-record` on `clean-context-review`, under
> which the round's other drafts reach the reader as pointers too. That
> recommendation is unanswered and its own clean-context reading is owed, and
> the option is recorded and unruled, `clean-context-review`'s own
> recommendation not having moved for it. It has no authority of
> its own: where it differs from the graph at `origin/disposition`, the graph
> wins and the difference is recorded as an un-aligned disposition on the node
> it differs from. Liquidation: the projector materializes this skill from
> ratified nodes and this hand-written file is deleted.

`/align-review <node id>` is the review of one draft. Its object is that
node's recommendation, and it runs the moment the recommendation is recorded
or moved in substance, which is the node's transition to the review stage: an
alignment sitting invokes it on the node it drafted, and the author or a
session invokes it on any node at that stage. It alone forwards a node to the
ruling stage, and two of its runs never wait on each other.

The survey of the frontier is `/align-survey`, a skill of its own, and nothing
of it is here.

## 0. Currency

1. Fetch `origin/disposition`; the nested worktree `disposition/` must be at
   it with a clean tree, except a sitting's own uncommitted drafts when
   invoked from a sitting. Run
   `node packages/disposition/validate.mjs disposition`.
2. Read `clean-context-review`, `frontier-consistency`, `review-skills`,
   `review-model`, and `review-cost` at their current text. What a
   clean-context reading is, what it is given and what bounds it, and
   the instruction text common to both readings, live there and not here;
   where a node differs from this file, follow the node and record the
   difference as an un-aligned disposition on it.

## 1. The draft, and what its reader is given

The node named on the command line, at `stage: review`. It alone receives a
verdict.

Its reader is given, from the record and never from a set the session names,
its neighbourhood in full and the rest of the record as questions alone
(`review-cost`, which defines the neighbourhood): the node under review whole,
the one node given whole because it is the only one being judged; and, each by
what it answers and not by its whole file, the chain of
nodes above it; the rules that bind everywhere; the nodes it names and the
nodes its `depends` names, with the options named in them; the nodes under it;
its siblings under the same
parent, which the checkpoint has landed; the author's words on each; and the
readings that bear on it. A neighbour is its question, the answer that stands
on it, the answer it now recommends where those differ, and the names of the
options on its answer fact; its rationale, its facts prose, its option
subsections and the rest of its recommendation stay in the file, one read
away, exactly as its account does and for the same reason — an account is the
dialogue's history and not its text, and a neighbour's argument for its
answer, its passed-over options and its fence are that same node's dialogue by
the same test, while what a draft is judged against is what its neighbours
answer. One exception, and it is the draft's own text and not the neighbour's
(`review-cost`): where an option on a neighbour's fact names the node under
review as its source, that option's prose is carried whole, because it is what
the draft wrote there and the validation that asks whether the draft
contradicts the node above it turns on that prose; a reader given only the
option's name has been told that the draft wrote something on its parent and
not what it wrote. The generator does this as of the reconciliation of
2026-09-05, which is later than the disclosure standing on `review-cost` that
it does not. The brief carries the rules of the reading itself
the same way, in the brief and not as a list of files for the reader to open —
what the review is and what it judges, the validations, the two readings and
what each is given, and the encoding's own vocabulary, facts, options,
rulings, the derived class, and what a node is: the global-tier rules,
which are in every neighbourhood's ancestry already whatever their number, and
`recording`,
`frontier-consistency`, `clean-context-review`, `viable-options`,
`unanswered`, `dialogue`, and `node`, which the brief used to tell its reader
to go and open. A brief that sends its reader to a node it could have carried
has that node read twice, once where the brief already quotes it and once from
disk, and pays for both. Of
every other node in the record it carries the id, the question, and the file
the node is in, on one line, and nothing else: the file because it is what
turns a pointer into a read the reader can make without first searching for
where the node lives; the questions because the merge validation asks
whether the record already asks this question and a reader cannot search for a
question it cannot phrase, and no answers, because the standing answers of the
whole graph are the survey's object and not a draft's reader's. The round's
other drafts — every node whose recommendation has moved since the survey last
pinned it, which `clean-context-review` gives this reader so that texts
written together are read together — are carried the same way and marked as
the round: the id, the question, and the recommendation each node now makes,
one line each, because what a reader needs of a sibling draft is that it moved
and what it moved to, and the text that moved is one file away. What lies
outside the neighbourhood the reader reaches by searching the graph, which the
brief tells it how to do, so the cost of reaching the rest of the record is
the cost of what is found and not of what exists.

The rule under all of it, which is the one to hold rather than the list of
particulars: a part of the brief that grows with the record rather than with
the draft is carried as a list of pointers, and a part that is the draft's own
is carried whole (`review-cost`); a neighbour is where the two meet, its
answer being the ground the draft stands on and therefore carried, and the
argument it made for that answer being its own dialogue, which grows with the
record and is not. The rule has a third case, which the measurement of this
node's own second brief forced (`review-cost`): a part constant across every
brief grows with neither the record nor the draft, so the rule as stated does
not reach it, and it is carried whole only where carrying it costs less than
the reads it saves. The rules of the reading are that case, and the argument
that carries them is the double read and not the pointer rule. What the reader
is given is
`clean-context-review`'s answer to state, and its recommendation has not moved
for this: the pointer treatment of the round's drafts is recorded there as the
option `pointers-for-what-grows-with-the-record`, which acts on nothing until
the author rules, and this file describes what the brief tool now does under
the grant of 2026-09-05.

The reading runs validations 1 to
6 and 15 of `frontier-consistency`, judges whether every option on the node's
facts is viable and whether a viable one is missing (`recording`), and returns
the strongest counter-argument with its strength.

A draft amended in answer to a reading's findings is read again, and that
second reading's object is the amendment and not the node (`review-cost`): the
node as it now stands, its difference from the text the last reading pinned,
that reading's findings, and the session's reply to each. It answers two
questions, whether the amendment answers the finding and whether it introduces
anything no reading has seen, and it is not a fresh reading of the node; the
record already knows what moved, since the reading carries the pin of the text
it read. A fresh reading is owed only where the answer itself was redrawn,
which is what a kickback is.

Two readings of one answer and no more: the reading, and the re-reading of its
amendment (`review-cost`). A finding that survives the second is recorded as
an option on the fact it bears on, or as a probe where it asks the author what
they meant, and it goes to the author with the node rather than starting a
third round; a reader asked for findings will return some, so a loop that runs
until a reading is silent ends on the reader's mood and not on the draft. The
cap bounds amendment and not redrawing: either reading may still kick the
draft back, and a kickback is a new answer, which owes a reading of its own.
What the cap forbids is a third reading of the same answer.

It returns the probes it raises on that node too (`author-questions`): the
questions it needs the author to answer before the recommendation can be
grounded, each with what it `asks`, `why` the record cannot answer it,
`discharges`, what an answer would settle and which recommendation it would
move, and the `fact` it bears on where it bears on one. Three limbs admit a
probe and all must hold — the record does not answer it and the reader has
looked, the answer would move a recommendation on this node, and the answer is
not itself a disposition, a question of that last kind being a node and going
to the merge finding instead. Finding none is a complete answer. The cap is
three open probes on one node, a compound probe counting as the probes it
compounds, and the reading checks it as a finding naming the node and the
probes; the parser does not enforce it. A probe beats the verdict: a reader
that returns one has said the draft is not ready, so a probe and a forward
cannot both stand, and §4 applies the kick-back whichever the reader wrote.

`node packages/disposition/project.mjs disposition --frontier -` lists every
node with its stage, its class, what its facts recommend, and its review and
survey state. A node is ready for the author's ruling when it carries a
forward verdict pinned to the recommendation as it stands and a survey pin on
the same; this reading gives the first of the two.

## 2. The brief

`node packages/clean-context-review/brief.mjs --node <id> [--date YYYY-MM-DD]
[--dry]` writes `tmp/review/draft-<slug>.brief.md` from `brief-draft.md` in
that package, and names `tmp/review/draft-<slug>.json` as the reader's output
file. It computes no model and prints none (`review-model`).

The brief carries the validations this reading runs, the viability judgment,
the admission test and the cap a probe is held to, the judging criteria from
`recording`, and nothing of the session: no draft of
the reply, no account of the sitting, no verdict hoped for. `tmp/` is
gitignored scratch.

Which of the two readings the brief is written for is the tool's to derive
from the record, and not the session's to name (`review-cost`): where the
node's review pin no longer matches what its facts recommend, the reading owed
is the re-reading, and the brief's object is the amendment — the node as it
stands, its difference from the pinned text, the last reading's findings, and
the session's replies to them — while after a kickback the brief is a fresh
reading's, because the answer was redrawn. The brief states its own length and
the discipline for reading it, and it is written to be held whole by the
reader it is given to.

## 3. The reader

Launch one subagent with the Agent tool: type `general-purpose`, at the model
and the effort `review-model` fixes for this reading, named in the prompt at
the launch and written down nowhere in this file; where that model is
unavailable to the launching session, the substitute is named in the prompt in
the same place. Never a fork: a forked context carries the session's framing
and is not clean. The prompt: "Read and follow `<the brief the previous step
wrote>` exactly; you are a clean-context reviewer with no context but the
record; read the brief in pieces of at most 300 lines with the Read tool's
`offset` and `limit`, never a whole file in one call, and pipe every shell
command through `head -n 40`; never run state-changing git; write only the
output file the brief names."

That last instruction is the reading discipline and not decoration
(`review-cost`): in the sitting of 2026-09-05 one reader autocompacted three
times in three turns on a 6,944-line brief and returned nothing, its whole
spend paid for a reading that then had to be launched again, bounded that way,
to finish at all.

Read the result's conclusion, never its transcript. A reader that fails is
relaunched once with the same brief; a second failure is reported and the node
stays at its stage. A brief the reader cannot hold is a defect of the brief
and not of the reader: report it as a finding against the brief and cure it by
narrowing the object, never by asking the reader to skim, since a reading that
dies of its own context returns nothing and is paid for twice.

## 4. Validate, then apply

1. Read `tmp/review/draft-<slug>.json`: the node's verdict, its findings, its
   facts check, its viability judgment, its probes, and its counter-argument
   with the strength. Validate every finding before any is applied, on this
   thread and never delegated (the author, 2026-09-03, quoted on
   `clean-context-review`), and validate it at the locus the finding names,
   without re-deriving the neighbourhood the reader was given (`review-cost`),
   which is what bounds the main thread's own spend on a reading: open the
   node, check that the text the finding
   quotes is there and says what the finding says, that the claim about the
   record or the implementation is true, and that the stage or edit it
   recommends follows from the doctrine it cites. A probe is validated the
   same way and against the same three limbs: a `why` naming a locus that does
   settle the matter, a `discharges` naming no recommendation, and a probe
   whose answer would itself be a disposition are each the session's finding
   against the reading, recorded in the reply; a probe the session holds
   inadmissible on one of them is discharged with the reason that says what in
   the record answers it, and it stays on the list discharged rather than
   leaving it. Record the validation as the
   session's reply in `tmp/review/replies.json`, `{ "<id>": "<reply>" }`:
   which findings the session accepts and what it amends for them, which it
   rejects and why, and why the disposition stands against the
   counter-argument or what changes for it. A rejected verdict or stage is
   held by `tmp/review/overrides.json`, `{ "<id>": "<stage>" }`; the finding
   is still recorded on the node with the reply, as the dialogue's history,
   and the author sees both on the alignment page. Nothing is applied
   unvalidated.
2. `node packages/clean-context-review/apply.mjs tmp/review/draft-<slug>.json
   --replies tmp/review/replies.json [--overrides tmp/review/overrides.json]
   [--date YYYY-MM-DD]`. It reads the reading from the file's own `scope`,
   verifies that the node is at the review stage, and appends
   `### Clean-context review, <date>` to `## Account` (creating the section
   when absent) with the verdict, the findings, the facts check, the viability
   judgment, the counter-argument with its strength, and the reply. On
   `forward` it sets `stage: ruling` and writes `review` with `verdict`,
   `strength`, `date`, `against`, and `of`, the pin of the recommendation
   read, which goes stale when any fact's recommendation moves; on `kickback`
   it sets the stage the reader named and writes the same. What the
   counter-argument is for: the alignment page carries it, with the strength
   this reading gave it, on the recommended option's row, in place of the case
   against the session wrote when it recorded the recommendation, and the
   reply sits one step down in that option's drill-down (`alignment-page`).
   The viability judgment marks and never removes: an option the reader no
   longer holds viable is marked passed over with its reason and stays on the
   list, and a viable option the reader named is added with the prose it gave
   (`prose-and-structure`). Each probe the session let stand is spliced into
   the node's `probes` with the `id` the apply derives, `source: review`, and
   the date as `raised`, and the stage is derived from the probes before the
   verdict is read: a node that will carry an open probe after the apply goes
   to the `maieutic` stage, or to `periagogic` where that is the stage named,
   and never to `ruling` (`author-questions`). An override wins on the stage,
   with that one exception, which no override reaches. Nothing else in the
   node is touched — the `## Recommendation` fence, the rulings, and what each
   fact recommends least of all.
3. The session's judgment after the apply. Amend the node where the reply says
   the session accepts a finding; a finding about another node — a duplicate
   question, an option that belongs elsewhere, a merge or a split — is written
   in prose by the reader and recorded by the session, and this reading
   changes no other node's stage. When the amendment changes substance, set
   the node back to `stage: review` and run this reading once more
   (`recording`); the frontier flags a review whose pin no longer matches what
   the node recommends, which is also how the brief knows the reading owed is
   the re-reading. That second run is the last of this answer
   (`review-cost`): a finding it returns that the session does not accept in
   the text is recorded as an option on the fact it bears on, or as a probe,
   and goes to the author with the node, and no third reading of the same
   answer is run. A kickback from either reading is a new answer and begins
   the count again, at a fresh reading. The earlier reading's subsection stays
   in the account as the dialogue's history.

## 5. Land

`node packages/disposition/validate.mjs disposition`; from `disposition/`,
commit the node with the message `review: <node slug> <date>` and the trailers
the harness asks for, `git push origin disposition` (fetch, rebase, and push
again on rejection); then rebuild and republish the alignment page as the
alignment skill's §4 says. When invoked from a sitting, the sitting lands with
its own round instead, at its next stage transition (`checkpoint`).

## Model and delegation

The model and the effort this reading runs on are `review-model`'s rule,
stated there and cited here, and §3 is where the launch names them; this file
writes no model's name down, because the name is the harness's and the day's,
and a reader cannot read it off a skill it never sees. Where the model that
node fixes is unavailable to the launching session, the substitute is named at
the launch and nowhere else — as it was on 2026-09-05, when three readers died
on the model's session limit within a minute of each other and the author
directed the sitting's readings to continue on another model, which their
words on `review-model` name; that node's recommendation has not moved for
them, and this file does not say which model it was, for the same reason it
names none of the others.
Nothing in this file computes a model and no brief argues one. The
orchestration runs on
whatever model invoked this skill; the validation of the findings, the
replies, the overrides, and what is put to the author from a finding are the
session's judgment and are never delegated (`delegation`), and they are
bounded to the loci the findings name (`review-cost`).
