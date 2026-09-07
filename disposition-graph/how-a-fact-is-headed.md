---
question: How is a fact's section headed on the alignment page?
stage: review
form: rule
facts:
  - name: answer
    options:
      - name: name-linked-to-the-definer
        source: ai
        ref: "2026-09-07"
      - name: heading-is-the-name-and-a-link
        source: author
        ref: "2026-09-04"
        status: passed
        reason: "the record defines no term answer, so on the most frequent heading of the page the link it directs has no target, and the entry it would resolve for persistence names a node asking another question"
      - name: question-as-the-heading
        source: commons.systems/disposition-graph/alignment-page
        ref: "2026-09-05"
        status: passed
        reason: "the author's two bullets of 2026-09-04 strike both halves of it, the answer fact's heading and the reserved fact's, by name"
      - name: name-with-no-link
        source: ai
        ref: "2026-09-07"
      - name: link-to-the-definer-or-to-dialogue
        source: ai
        ref: "2026-09-07"
      - name: name-and-question-together
        source: ai
        ref: "2026-09-07"
        status: passed
        reason: "it prints the incumbent and the author's direction one after the other, and the answer fact's question is already the column's own heading"
      - name: answer-keeps-the-question
        source: ai
        ref: "2026-09-07"
        status: passed
        reason: "the author's second bullet names that fact and that heading in terms"
    recommends: name-linked-to-the-definer
    boldness: moderate
    against: "The author asked for a linked heading and on the most frequent heading of the page this answer delivers an unlinked word. `Answer` has no target on any of the 134 nodes that carry facts, because nothing in the record defines the term, so what the author gets there is a category with no route to the question behind it, where the incumbent at least printed the question the fact asks. Until the missing glosses are written the heading is shorter and tells the author less than what it replaces, and the answer's reply is that the gap is now a finding, which is a promise about the record rather than a line on the page."
  - name: authority
    options:
      - name: ratified
        source: ai
        ref: "2026-09-07"
      - name: delegated
        source: ai
        ref: "2026-09-07"
      - name: deferred
        source: ai
        ref: "2026-09-07"
    recommends: ratified
    boldness: low
    against: "A heading is a projector change and a stylesheet rule, undone by re-projecting the page, and the author gave the direction in their own words, so a ruling here mostly transcribes them. Deferred would let the shorter heading act while the two missing definitions the answer turns on are still unwritten, which is the state in which this answer is at its weakest and the one the author would be ruling in."
under:
  - commons.systems/disposition-graph/alignment-page
---
## Disposition

The author, 2026-09-04, on the alignment page, queued from the sitting on author-questions:
> - Authority fact does not require verbose description of each authority level. Just rename section heading "Who may change an answer?" to "Authority" and hyperlink heading to authority node in the browser. Text summary for each authority option is just the name of the authority level.
>
> - The answer prose fact section doesn't need to restarte the question as its title - just give it the name of the fact: "Answer".

## Facts

### answer

Recommended because it is the author's direction with the one clause their words
assume and the record does not supply. They asked for a name and a link; the
record has a name for every fact and a link target for two of the four, and an
answer that did not say what happens to the other two would be a rule an executor
could not run.

What rests on the AI is three things, and each is named as the AI's. That the
rule reaches all four facts and not the two the author named. That the link's
target is the `defines` entry carrying a gloss, which excludes the bare term on
`transience`. And that a heading with no target is named and not linked with the
gap raised as a finding, which is the parent's metric clause read across to a
heading. Boldness moderate, and the last is why: the author asked for a link and
this answer hands them an unlinked word on the most frequent heading of the page,
which is the fact's own `against`.

#### name-linked-to-the-definer

The recommended option, set out in the fence: the fact's name as the heading, a
link to the node whose `defines` entry carries the term and its gloss, and, where
the record carries none, the name unlinked with the gap raised as a finding on
`dialogue`.

#### heading-is-the-name-and-a-link

The author's words of 2026-09-04 taken flat: every fact heading is the fact's
name and every one of them is a link. Passed over, and on nothing the author said.
Nothing in the record defines the term `answer`, so on the fact that appears on
all 134 nodes carrying facts there is no node to link to; and the one entry that
would resolve `persistence`, at `disposition/disposition-graph/transience.md:76`,
is a bare term on a node asking how transient disposition is recorded, so the link
would resolve and mislead. The recommended option is this option with the
unbuildable case written down instead of left to the implementation, and it
refuses no part of the direction.

#### question-as-the-heading

Everything the recommended option says, reversed: each fact is labelled with the
question it asks, in the words of the node or of the fact, which is `factLabel`
today (`packages/disposition/project.mjs:1346-1353`) and the parent's own clause
before this sitting. For it, the record's reasoning under `aspects-are-nodes`,
that a decision labelled with a category tells the author nothing about what is
being asked. Passed over: the author's two bullets strike both halves of it by
name, and the reply to the reasoning is the link.

#### name-with-no-link

Everything the recommended option says, with no link on any heading: the fact's
name and nothing more. For it: it is one rule with no conditions, it never
resolves wrongly, and the two missing definitions stop mattering. Viable and not
adopted: the author asked for the link in terms, and without it "Authority" alone
is the bare category the record's own reasoning says tells the author nothing,
with nothing to answer that reasoning at all.

#### link-to-the-definer-or-to-dialogue

Everything the recommended option says, with a heading whose term no node defines
linking to `commons.systems/disposition-graph/dialogue`, which reserves the four
names, rather than carrying no link. For it: it is a real target and a true one,
`dialogue` is where a reader learns what the reserved facts are, and the author
gets the link they asked for on every heading. Viable and not adopted: it sends
the author to a page-long encoding text to learn what `answer` means, where the
`defines` entry would have given them a sentence; and it converts a missing
definition into a plausible render, so the gap stops being findable the moment the
link resolves, which is the fault `authors-words-on-the-page` names in the
projector's own whole-section fallback.

#### name-and-question-together

Everything the recommended option says, with the question kept beside the name in
smaller text. Passed over: it is the incumbent and the author's direction printed
one after the other, so nothing is struck; and on the answer fact the question is
the column's own heading two lines above, which is the repetition the author's
second bullet names.

#### answer-keeps-the-question

Everything the recommended option says, with the answer fact alone still headed by
the node's question, on the ground that it is the one fact whose question is the
node's own. Passed over: the author's second bullet names that fact and that
heading in terms, and it is the fact for which the repetition is exact rather than
arguable, since the column prints the same sentence directly above.

### authority

Ratified, on the capture-shaped limb of `class-recommendation`'s test. The other
two are not met. Not expensive: the answer is `factLabel`, the legend it feeds and
a stylesheet rule, and nothing is built on it. Not irreversible: no node's data
changes and a wrong heading is undone by re-projecting the page.

The capture-shaped limb is met on what a heading is for. It is the only words the
author reads before choosing among a fact's options, and this answer decides that
those words are a category rather than the question the decision asks, with the
question moved behind a link that on two of the four facts does not yet exist. How
much the decider is told about what is being decided, decided by the party whose
recommendation the decision covers, is the shape the limb names, and the parent's
own authority reading found it in the same place, on a caption that mis-stated
what a confirmation does.

Low boldness: the limb is the parent's recorded reading narrowed to this node's
object, and the evidence is the page as built and the two missing definitions
measured at `5da05bc4`.

Against it: the author gave the direction in their own words, so a ruling here
largely transcribes them and spends their scarcest act on a label; and deferred
would let the shorter heading act while the two definitions the answer turns on
are still unwritten, which is the state the author would be ruling in and the one
in which this answer is weakest.

## Recommendation

```markdown
---
question: How is a fact's section headed on the alignment page?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---
## Answer

A fact is headed by the name of what it decides, and the name is a link to the
node that defines the fact.

The answer fact is headed "Answer". Today it is headed with the node's own
question (`packages/disposition/project.mjs:1347`), which the column has already
printed above it with the node's id, so the widest line of the fact repeats a
sentence the author read two lines earlier. The three reserved facts are headed
"Authority", "Existence" and "Persistence".

The link is to the node that carries a `defines` entry for the fact's own name,
addressed in the browser by the node's id, which is the address the parent's
answer already names for a metric. Where the record carries no such entry the
heading is the name and it is not a link, and the missing definition is a finding
on `commons.systems/disposition-graph/dialogue`, which reserves the four names.
That fallback is the parent's own standard for a metric applied to a heading, "a
node the browser does not render, one with no answer yet, is named by its id and
not linked, the metric saying so", and it is in the answer rather than left to
the implementation because two of the four names are in that state today.

Nothing in the record defines the term `answer`. So the most frequent heading on
the page has no target: all 134 of the node files that carry facts carry that
fact, measured at graph commit `5da05bc4`. And the term `persistence` is defined
at `disposition/disposition-graph/transience.md:76` as a bare term with no gloss,
on a node whose question is "How is transient disposition recorded?", so the
definer index (`packages/disposition/project.mjs:1326-1337`) resolves the fact's
name to a node asking a different question, which is the heading the page prints
for that fact today. A link built on that entry would send the author from a
decision about a node's own shape to the question of how transient disposition is
recorded, which is worse than no link, so the entry does not qualify: the target
is a `defines` entry carrying the term and its gloss, and a bare term claimed by
another question is not one.

The other two resolve. `authority` is defined with its gloss on
`commons.systems/disposition-graph/authority`, and `existence` on `dialogue`, and
both of those nodes carry an answer the browser renders, so the two headings the
author named are links exactly as they asked.

The gloss does not move. What a fact's name means stays where `dialogue` keeps
it, written once on the defining node, and it is what the link goes to; this
answer changes what the heading says and not where the record's vocabulary lives.
What an option's summary says on a fact whose options are that vocabulary is
`vocabulary-option-summary`'s question and is not decided here.

The record's own reasoning for the incumbent is answered rather than dropped.
That reasoning is that under `aspects-are-nodes` every decision is a question,
and a decision labelled with a category tells the author nothing about what is
being asked. It is right about a category standing alone, and the link is the
reply: the category is at the level the eye reads and the question is one click
away, on the node that owns it. Where the link is absent the objection stands
whole, which is why the absence is a finding on the node that owes the definition
and not a state this page settles into.

## Rationale

The author, 2026-09-04, on the alignment page, in two bullets: "Just rename
section heading 'Who may change an answer?' to 'Authority' and hyperlink heading
to authority node in the browser", and "The answer prose fact section doesn't need
to restarte the question as its title - just give it the name of the fact:
'Answer'."

Both halves of the naming are theirs and are taken whole. One detail of what they
read has moved since: the string they quoted, "Who may change an answer?", is
`authority`'s own node question and was the heading the page printed until
`29d285d5` on 2026-09-04 introduced the gloss branch in `factLabel`; the page now
prints the gloss of the term instead, which is a longer sentence and not the
string they named. The direction is untouched by that, since both are the
question and neither is the name.

What the answer adds to their words is the rule for the link's target and the
fallback where there is none, and both are drawn from the record rather than from
the AI's preference: the target is the `defines` entry, which is where `dialogue`
puts the meaning of a term; the fallback is the parent's own metric clause, which
already decides what a projection does when the node it would link to cannot be
linked to. The two missing definitions are the reason those clauses are in the
answer at all.

What the answer beat is on the fact: `heading-is-the-name-and-a-link`, the
author's words taken flat, which cannot be built for `answer` and would build a
wrong link for `persistence`; `question-as-the-heading`, the incumbent, which the
author's bullets strike; and `name-with-no-link`, which drops the half of their
direction the record can honour today.
```

## Account

What the sitting would amend: `commons.systems/disposition-graph/alignment-page`, its answer fact, and in the recommended text the sentence "Each is labelled with the question it asks, in the words of the node or of the fact, because under `aspects-are-nodes` every decision is a question and a decision labelled with a category tells the author nothing about what is being asked." The author's two bullets strike both halves of it: the reserved fact is headed by its own name and not by the question of the node that defines it, and the answer fact is headed "Answer" and not by the node's question, which the column has already printed above. The heading gains something the answer does not give it today, a link to the node that defines the fact, and that half of the author's words is not met by any sentence of the recommended text; it also meets a condition that answer states elsewhere, that a metric links "to that node in the browser, which addresses every node by its id where this page has no route to one, and a node the browser does not render, one with no answer yet, is named by its id and not linked", so the sitting has to say what the heading does where the defining node is itself unanswered, as `dialogue` is. In the implementation the change falls on the alignment page's projector in `packages/disposition/project.mjs`, `factLabel`, which returns the node's own question for the answer fact and the gloss or the defining node's question for a reserved one, and `renderFact`, which prints it in `<legend class="factlbl">` with no link, and on the legend's styling in `packages/disposition/alignment-template.html`.

Cascades: `commons.systems/disposition-graph/dialogue`, whose `aspects-are-nodes` is the ground the incumbent sentence rests on and whose `defines` entries and glosses are what a heading would name and link to; `commons.systems/disposition-graph/authority`, the node the authority heading would link to; `commons.systems/disposition-graph/vocabulary-view`, on a defined term being linked to the node that defines it wherever it appears; and `commons.systems/disposition-graph/projection`, which owns the browser's address and whether an unanswered node is rendered there at all, since that is what decides whether such a heading can be a link.

The periagogic object: the published alignment page at https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 at the answer and authority facts of `commons.systems/public/agency`, read against the recommended text of `alignment-page`, the `defines` entries of `dialogue` and `authority`, and `factLabel` in the projector, before anything is changed.

### The maieutic movement, 2026-09-07

The periagogic stage's object was read by the unit of 2026-09-05, whose report is
the seventh of its ten items. It found both halves of the author's observation
standing: the answer fact is not headed "Answer", the authority heading is
neither "Authority" nor a link, and there is no `<a>` inside any
`legend.factlbl` in the built page. It found one detail of what the author read
already changed, and not by the reconciliation of 2026-09-05: the authority
legend is no longer the string they quoted, "Who may change an answer?", but the
gloss of the term `authority`, which `29d285d5` introduced on 2026-09-04. The
stage is passed on the author's words of 2026-09-07 rather than in dialogue:
"before stopping for confirmation, and ensure alignment-page-observations is
progressed up to confirmation and included in the list of reconciliation for
alignment/review/survey/artifact."

One periagogic probe is owed and is stated here as a question, to be put when the
author is directed to the page: where the record defines no term for a fact, so
that the heading cannot be the link they asked for, would the author rather read
the unlinked name or the question the incumbent prints? The answer takes the
first and raises the gap as a finding; the option `name-with-no-link` takes the
first for every fact and the option `question-as-the-heading` takes the second,
and their own words settle neither, because their direction assumed a target that
exists for two of the four names.

What the record says. The parent's answer holds two clauses a ruling here
reaches, located by their words: the heading sentence, "How a fact is headed is
the `how-a-fact-is-headed` node's question ... the record's own reasoning headed
each fact with the question it asks", which the parent already marks as standing
only until this node rules, and which this answer replaces; and the metric
clause, "a node the browser does not render, one with no answer yet, is named by
its id and not linked, the metric saying so", which this answer cites and does not
move, since it is the parent's own and about metrics. `dialogue`'s `defines`
entries are what the link resolves against, and `dialogue` is where the two
missing definitions are owed. Among the siblings, `vocabulary-option-summary`
decides what an option's summary says on the same fact whose heading this decides,
and the two meet only in that a reader who reads a bare term on a row can reach
its meaning by the heading's link, which is stated in that node's answer and not
here. `authors-words-on-the-page` supplies the rule this answer follows on a
fallback, that a projection filling a gap with a plausible render makes the gap
unfindable, which is why `link-to-the-definer-or-to-dialogue` is not the
recommendation.

The tradition surfaced, and it is one reading, recorded here in prose with the
`bears` entry on the reading node owed with the ruling.
`commons.systems/disposition-graph/madr-decision-records`, whose source line at
`disposition/disposition-graph/madr-decision-records.md:45` names the template's
own section headings, "Context and Problem Statement, Decision Drivers,
Considered Options, Decision Outcome with its chosen option, consequences, and
confirmation, Pros and Cons of the Options, More Information", descending from
Nygard's "Context, Decision, Status, Consequences". A decision record in the
tradition the record's own encoding is drawn from names its sections for what
they hold and never restates them as the questions they answer, which is the
author's direction arrived at independently; the relation is adopted on the
recommended option. The tradition's limit is stated with it: MADR names sections
and never links them, so the link half of this answer is the record's own and the
tradition says nothing for it or against it. That node's own review of 2026-09-05
records that the reading has never left the AI's memory, so it is cited for the
one clause its source line quotes and no further.

What the implementation does today, at the loci a ruling here changes.
`factLabel` (`packages/disposition/project.mjs:1346-1353`) returns the node's
question for the answer fact, the gloss of the term for a glossed reserved fact,
the defining node's question where the term is defined without a gloss, and the
bare name where nothing defines it; `definerIndex` (`:1326-1337`) is the index it
reads for the third branch. `renderFact` prints the label with no link
(`:1636`). Measured over the built page, the four headings today are the node's
question on the answer fact, the gloss of `authority` on the authority fact, the
gloss of `existence` on the existence fact, and "How is transient disposition
recorded?" on the persistence fact, which is `transience`'s question reached
through the bare term at `disposition/disposition-graph/transience.md:76`. The
legend's styling is `packages/disposition/alignment-template.html` and carries no
rule for an anchor inside it.

The clean-context reading of this recommendation is owed before the author rules.
