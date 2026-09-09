---
name: align-survey
description: The clean-context survey of the frontier. Invoked with no argument before the author rules, it reads the whole graph in one context and judges every node whose recommendation has moved since the survey last pinned it against every other node, for contradiction, supersession, redundancy, decomposition, vocabulary, cross-reference, placement, coverage and merge. It forwards nothing; the reader writes nothing, and the invoking session validates every finding against the record before any is applied. Bootstrap shim declared on review-skills; the graph wins on conflict.
---
# Align survey

> **Shim notice (declared 2026-09-04 on `review-skills`).** Reconciled on
> 2026-09-07 under the author's words "begin applying the optimizations as
> you progress", to the options the sitting recorded on `review-cost`,
> `review-model`, `clean-context-review` and `frontier-consistency`, all
> unanswered. This file is the
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
> Reconciled again on 2026-09-07 under the author's words of that day,
> "begin applying the optimizations as you progress" and the grant of
> bootstrap reconciliation for the accumulation and the option encoding, to
> the recommended text of `survey-selection`, `unconfirmed-accumulation`,
> `quotes`, `viable-options` and `dialogue`; every recommendation unanswered.
> Reconciled again on 2026-09-08 under the author's grant of that day, "you
> have bootstrap authority to reconcile anything that would optimize the
> reviews/surveys (fix defects, or apply any other recommendation)", to the
> recommended text of `survey-selection` under its options
> `the-gate-refuses-only-what-an-instrument-clears`,
> `the-hub-bound-holds-for-every-key`,
> `the-frozen-set-is-the-closure-the-survey-read` and
> `a-pin-moves-on-what-binds-the-node`, and of `dialogue` under its option
> `a-pin-covers-what-binds-the-node`; every recommendation unanswered.
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
2. Read `clean-context-review`, `frontier-consistency`, `review-skills`,
   `review-model`, and `survey-selection` at their current text. What a
   clean-context reading is, and the instruction text common to both
   readings, live there and not here; what the judged set is, what a
   candidate pair and its nominating key are, what the mechanical tier
   gates, and what a survey leaves on a node live on `survey-selection` and
   not here; where a node differs from this file, follow the node and
   record the difference as an un-aligned disposition on it.
3. Run the mechanical tier: `node packages/disposition/validate.mjs
   disposition --tier`. Its eight checks are of two kinds
   (`survey-selection`, the option
   `the-gate-refuses-only-what-an-instrument-clears`), and only one kind
   gates. The gating kind names a defect of the encoding, one an instrument
   or the session clears before the launch, and it is four checks: an
   unresolved `depends`, `bears` or `under` reference, two options of one
   name on one fact, an option whose content resolves through a cycle,
   through a name no option carries, or through a hunk that does not apply
   exactly, and a reference to the author's words that resolves to no entry
   (`TIER_GATE_CHECKS`). A node one of those fires on is repaired or kicked
   back, never read for it, and no reader is launched while one of them
   reports a finding. The reporting kind names a state of the record that no
   instrument clears and only a sitting can, and it is the other four: a
   recommendation past its pin, a term used by a node with no path to the
   node whose `defines` carries it, a passage of two hundred bytes or more
   byte-identical across nodes, and an account section the fold could have
   reached and has not (`TIER_REPORT_CHECKS`), with the unreferenced ledger
   entry beside them as a note. Those gate nothing: they are carried into the brief instead, one
   line each (§2), so the reader has what the record already knows about
   itself and is not stopped by it. Launch when the gating kind is clean.
   `--force-tier` at the brief step (§2) bypasses the gate and nothing else,
   is a diagnostic and never the normal path, is named as such in the brief
   itself, and is a deviation to report. A gate whose findings the session
   could only acknowledge was refused on every run and bypassed on every
   run, and the bypass was then the launch; that is what the division ends.

## 1. The judged set, and the selection

The context is the whole graph, answered and unanswered at every stage, read
in one context without its `## Account` sections, which are the dialogue's
history and not its text. The judged set is every node at the review or the
ruling stage whose recommendation has moved past its survey pin or that no
survey has read, together with every node whose read text differs from the
hash the last survey wrote on it (`survey-selection`); each of those is
judged against every other node in the graph, on validations 7 to 15 of
`frontier-consistency`, and the sixteenth, the independence test of
`probe-or-node` — contradiction, supersession, redundancy, decomposition,
vocabulary, cross-reference, placement and order, coverage, and merge.

A pair both of whose members are unchanged since a survey last read them
together is not compared, and a node the judged set reaches but whose read
text has not changed since that survey is carried on one line rather than by
what it answers, since the pair has already been read once; everything so
struck is the frozen set, named in the survey's own output and in the
reader's report. What unchanged means is the pin the survey writes on every
node it read: the apply step (§4) pins the judged set and the neighbourhood
alike, the nodes it carried by what they answer, and a later run freezes a
node whose five section hashes still match the pin it carries, judged or
merely read. That closure is the whole of what the frozen set can cover
(`survey-selection`, the option
`the-frozen-set-is-the-closure-the-survey-read`): a node the survey met only
as a name on one line is not pinned, because a pin attests to the text a
reader read and a line is not that text, so a pair either of whose members is
unpinned stays live, and where the brief carries that member on one line the
reader is handed a name and not a text. The record pays for that in one line
and not in one reading, and the unpinned residue is no backfill the record
owes: it shrinks as the frontier moves, each survey pinning the closure it
read. No instrument changed for this; it is what the generator already did,
stated here as the rule the record recommends. A pin on a
node the survey only read carries no recommendation hash, so it freezes that
node's text and never satisfies the survey a ruling owes: a node at the
review or the ruling stage carrying a read pin alone is still in the next
survey's judged set.

What moves the pin the judged set turns on is what binds the node and nothing
beside it (`survey-selection`, the option
`a-pin-moves-on-what-binds-the-node`, and `dialogue`, the option
`a-pin-covers-what-binds-the-node`, which holds the same pin so that the two
nodes that read it read one thing): per fact, the fact's name, which option it
`recommends`, that option's sentence, its resolved content read through the
`From:` chain, and the ledger addresses it references in `supports` and
`diverges`, together with the name and the status of any option of the fact
that carries one; the node's hash folds the question in with every fact's
(`contentFactRecommendationHash`). A rival's body is not that. An option
recorded beside the recommendation, its sentence, its source, its ref, the
AI's case on it and its content alike, moves no pin, whoever recorded it, a
reading, a sitting, or this survey's own apply step, so a survey no longer
guarantees that every node it wrote an option on is judged again by the next
one. Boldness, `against`, the AI's accumulated support and divergence, a
fact's reason and the accounts are outside the pin for the same reason, which
is why the accumulation's fold and its absorptions move no hash and re-judge
nothing. The five section hashes are the separate thing the freeze compares:
a rival recorded on a node moves that node's rivals section, so the node is no
longer frozen and the reader is given its text again wherever a pair of its is
live, and that alone does not return it to the judged set.

The pins the record already carried were migrated once, in the same act, and
this is a fact of the record and not a step a reading repeats:
`node packages/disposition/migrate-pins.mjs <graph dir> [--sidecar <path>]
[--dry]` rewrote every `review.of`, every `review.survey.of` and every ruled
option's `ruling.of` whose recorded hash was the node's hash in the old form
to the node's hash in the new form, nothing the reader read having changed,
and left a pin already stale in the old form stale, so each node is judged
exactly as it would have been. It ran on the graph at commit `981f5367`,
rewriting 236 pins, leaving 56 stale and finding 17 already in the new form,
and it is idempotent: run again over a migrated graph it rewrites nothing.

The delta is the norm and the whole reading is a backfill
(`survey-selection`, the option
`the-whole-reading-is-a-backfill-and-the-delta-is-the-norm`, on the author's
words `words/2026-09-07/23`: no process may grow in context size with the
graph unbounded). A whole survey, in which nothing is frozen, runs on the
author's word (`--whole`) and after any amendment to the validations, to
what a reading is given, or to the tier (`--validations-changed`). It runs
on no cadence, after no count of deltas, and after no lapse of days, and
nothing in the tooling demands one. The selection is unsafe, and one thing
covers it: every delta survey carries a drift
probe, a random sample of one in twenty of the frozen pairs and never fewer
than ten, drawn by a seeded generator whose seed the run records and handed
to the reader like any other pair, marked as the probe. A finding anywhere
in the sample is a finding on the freeze: it is recorded on the nodes it
names like any other finding, and reported as the freeze's failure. It puts
a backfill in front of the author and does not launch one.

A candidate pair is two nodes the generator nominates for comparison with the
key that nominated it — a defined term (the node that defines it paired with
each node that uses it), an entry of the author's words referenced by
options on both, a citation either way in prose or in `depends`, a shared
parent, or near-duplicate resemblance (Jaccard similarity over word shingles
of a half or more). One bound holds over every key and not over one of them
(`survey-selection`, the option `the-hub-bound-holds-for-every-key`):
whatever relation a key runs on, what stands at more than a tenth of the
record's nodes nominates nothing on that key, so a term more than a tenth of
the nodes use pairs with none of them, and a node whose prose names more than
a tenth of the record names none of them here. The ceiling is
`TERM_KEY_MAX_SHARE`, defined once and shared with the tier's own check so the
two cannot drift. It is a share and not a count, so that it holds at any size
of record, and it silences a key and never an edge the record declared: a
hub's `depends` entries are written on purpose and are nominated by their own
key, which is what stands where the scraped citation falls away. Stating the
bound once rather than per key is what stops the next key the record adds from
arriving unbounded. The key is recorded with any finding it produces and
narrows attention, never the corpus: every node the brief carries stays
readable, and a finding on a pair no key nominated is a finding like any
other.

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
finding instead. Finding none is a complete answer. There is no cap on how
many probes stand open on a node, the author having struck it at
`words/2026-09-08/32`, so no reading reports a count: the list is bounded
because a probe blocks on the author rather than recursing, and the remedy for
a long list is to refine the disposition until it can be confirmed, never to
stop asking. A probe reaches any node in
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

`node packages/clean-context-review/brief.mjs --survey disposition
[--date YYYY-MM-DD] [--dry] [--whole] [--validations-changed] [--force-tier]
[--out <file>] [--sidecar-dir <dir>]` writes the brief from `brief-survey.md`
in that package and names the reader's output file. Passed neither flag it
writes a delta, which is the survey's only recurring form. `--whole` is
passed on the author's word alone, to run a backfill in which nothing is
frozen; `--validations-changed` is passed after an amendment to the
validations, to what a reading is given, or to the tier, which invalidates
every earlier reading's silence and so runs the same whole reading. Nothing
else makes a run whole: there is no cadence, no count of deltas and no lapse
of days behind either flag, and a run passed neither is a delta however long
it has been since the last whole reading. The tier gate of §0 is
`--force-tier`'s, recorded there and not repeated here; it bypasses the
gating kind alone, and the run's own line names what the tier did:
`tierFindingCount`, the gating count, which is what the launch turns on,
`tierReportCount` and `tierNoteCount`, which turn nothing, and `tierForced`,
true only where a gating finding was overridden.

Beside the brief it writes three sidecars, by default under `tmp/review/`:
`survey.pins.json`, the graph commit read and the recommendation hash of
every node of the graph, judged and context alike — what the apply step
compares against, and never a hash the reader copied, which is what
serializes this reading so nothing is locked — and beside those, under
`read`, every node this reading carried by what it answers with the five
section hashes of its text, which is what the apply step pins on each of
them and what the next delta freezes on; `survey.selection.json`, the
selection this run made — the frozen set, the neighbourhood, the live
candidate pairs with their nominating keys, and the drift probe drawn from
the frozen set with its seed — which the apply step reads to record `pairs`
on each judged node and over exactly whose entries the next survey's cut is
taken (`survey-selection`); and `survey.history.json`, a log of the runs:
the date, the graph commit, whether the run was whole or a delta, how many
nodes it judged and how big the brief was. Nothing reads the history to
demand a run, and no run is certified against it — the two flags above are
the whole of what makes a reading whole — so it is kept for the measurement
and for nothing else. The first two must be read at the graph commit the
survey was launched at: a stale pair of sidecars compares against text the
tree no longer holds. Writing the brief appends to the history sidecar at
once (a `--dry` run appends nothing), so a diagnostic or measurement run of
this step passes its own `--sidecar-dir` — a `tmp/review/` run against the
live sidecars would overwrite the pins and the selection the next real apply
reads against.

The brief carries the validations this reading runs, how a tangle and a
subtree divergence are recorded (`alignment-order`), the admission test and
the cap a probe is held to, the tier's own stamp (how many findings each kind
returned, and whether the launch was forced, the reason for which is the session's report's to carry, since the flag takes none),
a summary of the selection (how many nodes judged, how many pairs live, how
many frozen, whether this run is whole and why), the judged index, the live
candidate pairs each with the key that nominated it, the drift probe, and the
reached-unchanged list — the nodes the judged set reaches but carries on one
line rather than by what they answer — and nothing of the session. Under
"What the record already knows about itself" it carries the tier's reporting
kind and the notes beside it, one line each, grouped by check with a count
per check, said there to be states of the record no instrument clears, so
that a finding of the reader's that repeats one tells the record nothing it
has not already measured. `tmp/` is gitignored scratch.

The brief is the whole of what the reader reads, and it carries each node
compacted so that it can be. A judged node is carried once: its question, the
author's words its options reference, quoted at most once and otherwise by
address, the one answer that binds it, and every other option by name, status
and sentence with its content given as its sectionwise difference from that
answer, given whole only where a difference would not be shorter. A node the
judged set reaches is carried by what it answers, and by the answer its
recommended option resolves to where that differs from what stands. Each node
so carried holds a `#### Probes` block, every probe on it, open and
discharged alike, one line each. There is no cap to check against them; they
are shown for the reason that outlived it, that a reader shown no probe
re-asks what the record has asked already.

## 3. The reader

Launch one subagent with the Agent tool: type `general-purpose`, at the model
and the effort `review-model` fixes for this reading, named in the prompt at
the launch and written down nowhere in this file by a harness name — named
instead by its relation to the other reader: the survey runs on the larger
model, the most capable the harness offers, at high effort, the same as the
first reading of a draft and never the smaller model the re-reading of an
amendment runs on. Where the model the survey is due is unavailable to the
launching session, the substitute is named in the prompt in
the same place, and no brief argues either — a clause `review-model`'s
recommended answer names unsupported implementation until the author rules on
`fallback-when-the-model-is-unavailable`, applied meanwhile and named here so a
reader of the skill sees it. Never a fork: a forked
context carries the session's framing and is not clean. The prompt: "Read and
follow `<the brief the previous step wrote>` exactly; you are a clean-context
reviewer with no context but the record; read the brief and nothing else —
it carries everything you judge, and it says so — in the fewest pieces your
Read tool allows, up to 2,000 lines per call, from its first line to its
last, and never skim past what does not fit; every finding you write quotes the locus it
bears on verbatim, the sentence or clause exactly as it stands in the file, so
it can be verified by search; never run state-changing git; write
only the output file the brief names."

Read the result's conclusion, never its transcript. A reader that fails is
relaunched once with the same brief; a second failure is reported and every
node stays at its stage. A brief the reader cannot hold is a defect of the
brief and not of the reader (`review-cost`): the cure is narrowing what the
brief carries or points to, never a reader that holds more. What the brief
points to counts toward what the reader holds — on 2026-09-07 a brief of
680 KB told its reader to open thirteen node files whole, 1.28 MB the brief
already carried by what each answers, and the reader's context overflowed
before it wrote a finding; the template now carries every node by its answer
and tells the reader to open no file whole. When `brief.mjs` warns that the
brief may exceed what one reader holds, ask the reader to report what it
could not read, and treat an unread part as a gap in the reading rather than
as a finding of nothing.

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
   one per judged node and one per node a kept finding is written on, which
   is what the apply's own validation asks for and never the nodes a finding
   named but was not applied to. A rejected stage
   recommendation is held by `tmp/review/overrides.json`,
   `{ "<id>": "<stage>" }`; the finding is still recorded on the node with the
   reply, as the dialogue's history, and the author sees both on the alignment
   page. Nothing is applied unvalidated.
2. `node packages/clean-context-review/apply.mjs tmp/review/survey.json
   --replies tmp/review/replies.json [--overrides tmp/review/overrides.json]
   --pins tmp/review/survey.pins.json --selection tmp/review/survey.selection.json
   [--date YYYY-MM-DD]`. It reads the
   reading from the file's own `scope`, and then:
   - for each judged node whose current recommendation hash equals the hash
     the pins sidecar recorded, writes `review.survey` with `date`, `of` (that
     same hash), `commit` (the graph commit the survey read), `text` (the
     hashes of the five sections its validations read), `findings` (the
     register of what the survey left open on the node, each with the
     support it rests on and the condition that discharges it), and `pairs`
     (the pairs the selection sidecar shows touching this node, each with
     the nominating key it was drawn on) — the six keys `survey-selection`
     names on a judged node — and applies that node's findings; a judged node
     whose recommendation moved since receives nothing, is reported, and is
     judged again by the next survey. A finding naming a node whose
     recommendation has moved since the graph commit read is discarded on that
     node for the same reason — a reading attests to the text it read — and on
     that node alone: the discard is per support and not per finding
     (`survey-selection`, "a finding one of whose supports moved is
     re-derived"), so the finding is still written on every node it names that
     did not move, and the moved ones are named as dropped both in the run's
     report and in the subsection written on the survivors, along with any
     option it proposed on them. Two cases discard it whole: a finding every
     one of whose nodes moved, and a `merge` or a `decomposition`, whose object
     is the set of nodes it spans, so that half of one proposes nothing. A
     reply in `--replies` is owed for the nodes a finding is written on, and
     not for the ones dropped. Giving `--selection` is what lets `pairs` be
     recorded at all; omitting it
     records the other five keys and notes that this survey's cut therefore
     falls back to the survey date rather than to the pairs actually read,
     which freezes more than it should on the next run;
   - writes a **read pin** on every node the pins sidecar lists under `read` —
     the neighbourhood this reading carried by what it answers — `date`,
     `commit` and `text` (the same five section hashes) and no `of`, merged
     under whatever the node's `review` block already holds and never
     displacing a judged pin's `of`: the reading read that node, and the pin
     is what the next delta freezes it on. A read pin satisfies nothing: a
     node at the review or the ruling stage carrying one alone is still owed a
     survey and is judged again by the next one;
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
   any problem writes nothing at all. Recording an option no longer moves the
   pin the survey wrote (§1), so the guard that checks the recommendation hash
   against that pin fires only where an option this run wrote carries a status
   or where what the fact recommends moved; there it is a note naming the
   option, saying the node stands as moved past its survey pin and is judged
   again by the next survey, and any other movement of that hash is still
   refused with the node left unwritten. An override wins on the stage, except
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
