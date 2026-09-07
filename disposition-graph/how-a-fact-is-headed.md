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
        reason: "the record defines both `answer` and `persistence` as bare terms on nodes asking other questions -- `disposition/disposition-graph/node.md:65` and `disposition/disposition-graph/transience.md:76` -- so on two of the four facts, one of them the heading that appears on all 134 nodes carrying facts, the link the direction asks for would resolve and mislead"
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
      - name: glosses-written-with-this-ruling
        source: review
        ref: "2026-09-07"
    recommends: glosses-written-with-this-ruling
    boldness: moderate
    against: "The author's ground is repetition, and it is exact on the answer fact alone, where the column prints the node's question two lines above; on the three reserved facts the page prints no repetition at all, and this answer replaces a sentence that says something with a category word that says less, on all 134 of the nodes that carry facts, recovering it only by a click. And it buys the link on every heading by writing on three nodes this ruling does not own: a gloss on `dialogue` for two of the four names and the release of the bare entries on `node` and `transience`, so a ruling here reaches into another node's `defines` list to make its own rule buildable."
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
    against: "A heading is a projector change and a stylesheet rule, undone by re-projecting the page, and the author gave the direction in their own words, so a ruling here mostly transcribes them. Deferred would let the shorter heading act while the two glosses this answer writes are still unwritten, since a ruling here is what writes them, so the page the author would be ruling on is the page before the glosses and not the page the answer describes."
review:
  verdict: forward
  strength: moderate
  date: 2026-09-07
  of: 5306f2c9d0bd3979aa2ae7cf50cc45f3b530bab7
  commit: 8a672c17fcd4f0bf104d3c4e2a87077eb1213d7c
  against: "The author's stated ground for the change is repetition -- the answer prose fact \"doesn't need to restate the question as its title\" -- and that ground is exact on the answer fact alone, where the column prints the node's question two lines above. On the three reserved facts the page today prints no repetition at all: it prints the gloss of the term, or the definer's question, neither of which the reader has already met. So on three of the four headings this answer replaces a sentence that says something with a category word that says less, on a ground that does not reach them, and it does so on every one of the 134 nodes that carry facts. Where the link resolves the loss is recovered by a click; where it does not -- on `answer` and `persistence`, which is the most frequent heading and one other -- the author is left with a bare category and the record's own reasoning under `aspects-are-nodes`, that a decision labelled with a category tells the author nothing about what is being asked, stands whole with nothing answering it. The answer's reply is that the absence becomes a finding on another node, which is a promise about a future ruling rather than anything the author gets on the page they are looking at."
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

Recommended because it is the author's direction delivered whole rather than
routed around. They asked for a name and a link; the record has a name for every
fact and, on two of the four, a `defines` entry that carries the term with no
gloss on a node asking another question, which is a link that would resolve and
mislead. The recommendation before this one wrote that state into the rule, and
that is an incumbent fact doing the work of a design constraint, which the
`evaluation` node's lens exists to catch: the two entries are fixed with the
ruling instead, and every heading is a link.

What rests on the AI is three things, and each is named as the AI's. That the
rule reaches all four facts and not the two the author named. That the link's
target is the `defines` entry carrying the term and its gloss, so that a bare
term claimed by another question does not qualify. And that the two glosses are
written on `dialogue`, the node that reserves the four names, with the bare
entries on `node` and `transience` released to it, which is a change to three
nodes' `defines` lists made from this one. Boldness moderate, and the last is
why: the direction is the author's, and the glosses and where they go are the
AI's.

#### name-linked-to-the-definer

Everything the recommended option says, with the two missing glosses left
unwritten: the fact's name as the heading, a link to the node whose `defines`
entry carries the term and its gloss, and, where no entry carries a gloss, the
name unlinked with the gap raised as a finding on the node that carries the bare
term, `node` for `answer` and `transience` for `persistence`. It is the option
with the fallback, and the fallback is what the recommendation now refuses: on
`answer` it prints an unlinked word on all 134 of the nodes that carry facts, and
its reply to that is that the gap becomes a finding, which is a promise about a
later ruling rather than a line on the page. Viable and not adopted: it writes on
no node but this one, which is the whole of what it buys, and the author may hold
that a ruling about a heading should not reach three other nodes' `defines`
lists.

#### heading-is-the-name-and-a-link

The author's words of 2026-09-04 taken flat: every fact heading is the fact's
name and every one of them is a link, with the record left as it stands. Passed
over, and on nothing the author said. The record defines both `answer` and
`persistence` as bare terms with no gloss, at
`disposition/disposition-graph/node.md:65` on a node asking "What is a node?" and
at `disposition/disposition-graph/transience.md:76` on a node asking how
transient disposition is recorded, and `definerIndex` indexes a `defines` term
whether or not it carries a gloss, so on two of the four facts, one of them the
heading that appears on all 134 nodes carrying facts, the link this option builds
resolves and misleads. The recommended option is this option with those two
entries fixed rather than left to resolve wrongly, and it refuses no part of the
direction.

#### question-as-the-heading

Everything the recommended option says, reversed: each fact is labelled with the
question it asks, in the words of the node or of the fact, which is `factLabel`
in `packages/disposition/project.mjs` today and the parent's own clause
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

#### glosses-written-with-this-ruling

Every fact heading is the fact's name and every one of them is a link, and the
two entries that would resolve wrongly are fixed rather than routed around, so
that no heading falls back and the author gets on all four facts what they asked
for on two. What is written with the ruling: a gloss for `answer` and one for
`persistence` on `commons.systems/disposition-graph/dialogue`, the node that
reserves the four names and already glosses `existence` there, and the release of
the bare entries at `disposition/disposition-graph/node.md:65` and
`disposition/disposition-graph/transience.md:76`, which is what stops two
definers standing for one term. `authority` is not touched: it is already glossed
on `commons.systems/disposition-graph/authority`, which is the node the author's
own bullet names as the link's target. The release matters because `glossary` and
`definerIndex` (`packages/disposition/derive.mjs` and
`packages/disposition/project.mjs`) both take the first definer they meet and
ignore every later one, so two entries for one term resolve by node order, which
is a decision nobody made. The four glosses are drafted as the option
`dialogue-glosses-the-four-fact-names` on `dialogue`, with this node as its
source, so that the text a ruling here would write is on the node that owns it.
Its cost is that it writes on three nodes this ruling does not own, and the
reading holds that to be exactly the trade the author should get to make.

### authority

Ratified, on the capture-shaped limb of `class-recommendation`'s test. The other
two are not met. Not expensive: the answer is `factLabel`, the legend it feeds and
a stylesheet rule, and nothing is built on it. Not irreversible: no node's data
changes and a wrong heading is undone by re-projecting the page.

The capture-shaped limb is met on what a heading is for. It is the only words the
author reads before choosing among a fact's options, and this answer decides that
those words are a category rather than the question the decision asks, with the
question moved behind a link. How much the decider is told about what is being
decided, decided by the party whose recommendation the decision covers, is the
shape the limb names, and the parent's own authority reading found it in the same
place, on a caption that mis-stated what a confirmation does.

Low boldness: the limb is the parent's recorded reading narrowed to this node's
object, and the evidence is the page as built and the two bare entries measured
at `5da05bc4`.

Against it: the author gave the direction in their own words, so a ruling here
largely transcribes them and spends their scarcest act on a label; and deferred
would let the shorter heading act while the two glosses it turns on are still
unwritten, since a ruling here is what writes them, so the page the author would
be ruling on is the page before the glosses and not the page the answer
describes.

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
question, which is `factLabel`'s first branch in
`packages/disposition/project.mjs`, and which the column has already printed
above it with the node's id, so the widest line of the fact repeats a sentence
the author read two lines earlier. The three reserved facts are headed
"Authority", "Existence" and "Persistence".

The link is to the node that carries a `defines` entry for the fact's own name
with its gloss, addressed in the browser by the node's id, which is the address
the parent's answer already names for a metric. There is no fallback, because
this ruling leaves no name without such an entry: it writes the two the record
lacks. A gloss for `answer` and a gloss for `persistence` are written on
`commons.systems/disposition-graph/dialogue`, the node that reserves the four
names and already glosses `existence`, and the bare entries at
`disposition/disposition-graph/node.md:65` and
`disposition/disposition-graph/transience.md:76` are released to it, so that one
entry stands for each name. The release is part of the rule and not tidying:
`glossary` and `definerIndex` each take the first definer they meet and ignore
every later one, so two entries for one term resolve by the order the nodes are
read in, which is a decision nobody made.

The term `answer` is defined at `disposition/disposition-graph/node.md:65` as a
bare term with no gloss, on a node whose question is "What is a node?", so it
does not qualify under the rule above; and the term `persistence` is defined at
`disposition/disposition-graph/transience.md:76` as a bare term with no gloss, on
a node whose question is "How is transient disposition recorded?", so it does not
qualify either. `definerIndex` indexes a `defines` term whether or not the entry
carries a gloss, which is what its own comment says, so both names resolve today
and both resolve to a node asking another question: a link built on either would
send the author from a decision about a node's own shape to a question that is
not the one the fact asks, which is worse than no link. Without this ruling the
most frequent heading on the page is one of the two, on all 134 of the node files
that carry facts, measured at graph commit `5da05bc4`.

The other two already resolve. `authority` is defined with its gloss on
`commons.systems/disposition-graph/authority`, which is the node the author's own
bullet names as the target, and `existence` on `dialogue`; both of those nodes
carry an answer the browser renders. With the two glosses this ruling writes,
all four headings are links, and the author gets on every fact what they asked
for on two.

The gloss is written where the record already keeps that kind of sentence and
nowhere else. What a fact's name means is written once, on the node that defines
the term, and it is what the link goes to; this ruling writes two such sentences
where the record has none and moves no sentence that exists. What an option's
summary says on a fact whose options are that vocabulary is
`vocabulary-option-summary`'s question and is not decided here.

The record's own reasoning for the incumbent is answered rather than dropped.
That reasoning is that under `aspects-are-nodes` every decision is a question,
and a decision labelled with a category tells the author nothing about what is
being asked. It is right about a category standing alone, and the link is the
reply: the category is at the level the eye reads and the question is one click away, on the node that owns it. The reply holds only where the link
resolves, which is why this answer writes the two glosses rather than leaving a
heading the objection would stand whole against.

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

What the answer adds to their words is the rule for the link's target and the two
glosses that make it hold on every heading, and both are drawn from the record
rather than from the AI's preference: the target is the `defines` entry with its
gloss, which is where `dialogue` puts the meaning of a term; the glosses are
written on the node that reserves the four names, beside the one it already
carries. The two bare entries are the reason those clauses are in the answer at
all, and fixing them rather than writing around them is the `evaluation` node's
lens applied to this answer's own first draft.

What the answer beat is on the fact: `name-linked-to-the-definer`, this answer
with the two glosses left unwritten and the heading falling back to an unlinked
word on the most frequent heading of the page; `heading-is-the-name-and-a-link`,
the author's words taken flat, which builds a link on `answer` and on
`persistence` that resolves to a node asking another question;
`question-as-the-heading`, the incumbent, which the author's bullets strike; and
`name-with-no-link`, which drops the half of their direction the record can
honour today.
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

No probe is owed. The question the periagoge would have put — where the record
carries no gloss for a fact's name, would the author rather read the unlinked
name, the question the incumbent prints, or the gloss written with the ruling —
is a candidate answer to this node's own question, which under `probe-or-node`'s
test makes it an option and not a probe, and all three candidates are already on
the fact: `name-linked-to-the-definer`, `question-as-the-heading` and the
recommended `glosses-written-with-this-ruling`. It is put to the author as the
fact's options, where their ruling settles it in one act.

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
author's direction arrived at independently; the relation is adopted on
`glosses-written-with-this-ruling`, which is what the entry owed on that reading
node names. The tradition's limit is stated with it: MADR names sections
and never links them, so the link half of this answer is the record's own and the
tradition says nothing for it or against it. That node's own review of 2026-09-05
records that the reading has never left the AI's memory, so it is cited for the
one clause its source line quotes and no further.

What the implementation does today, at the loci a ruling here changes.
`factLabel` in `packages/disposition/project.mjs` returns the node's
question for the answer fact, the gloss of the term for a glossed reserved fact,
the defining node's question where the term is defined without a gloss, and the
bare name where nothing defines it; `definerIndex`, in the same file, is the
index it reads for the third branch, and `glossary`
(`packages/disposition/derive.mjs`) is the map it reads for the second, which
holds the glossed terms alone. Both take the first definer they meet and ignore
every later one. `renderFact` prints the label with no link. Measured over the built page, the four headings today are the node's
question on the answer fact, the gloss of `authority` on the authority fact, the
gloss of `existence` on the existence fact, and "How is transient disposition
recorded?" on the persistence fact, which is `transience`'s question reached
through the bare term at `disposition/disposition-graph/transience.md:76`. The
legend's styling is `packages/disposition/alignment-template.html` and carries no
rule for an anchor inside it.

The clean-context reading of this recommendation is owed before the author rules.

### Clean-context review, 2026-09-07, of 5306f2c9

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Recommended at this reading: `name-linked-to-the-definer`.

Findings:

- ## Answer, validation 3 (every claim about the record is verified). The sentence "Nothing in the record defines the term `answer`." is false. `commons.systems/disposition-graph/node` carries a `defines` entry for the bare term `answer` at `disposition/disposition-graph/node.md:65`, and again inside its own recommendation fence at `:153`. `definerIndex` indexes every `defines` term whether or not it carries a gloss -- its own comment says so, "Which node defines a term, whether or not the definition carries a gloss" -- so under this answer's rule the name `answer` resolves, and it resolves to a node whose question is "What is a node?". The state of the record is therefore not that `answer` has no definer but that it has the same defect `persistence` has: a bare term with no gloss, claimed by a node asking another question. The recommendation is unchanged by this, because the answer's own qualifier already disqualifies such an entry -- "the target is a `defines` entry carrying the term and its gloss, and a bare term claimed by another question is not one" -- but the ground the author would be ruling on is misstated and must be redrawn. Suggested edit: replace the sentence with "The term `answer` is defined at `disposition/disposition-graph/node.md:65` as a bare term with no gloss, on a node whose question is 'What is a node?', so it does not qualify under the rule above, exactly as `persistence` does not; the most frequent heading on the page therefore carries no link, on all 134 of the node files that carry facts, measured at graph commit `5da05bc4`."
- ## Facts, answer fact, the passed-over reason on `heading-is-the-name-and-a-link`, and the same fact's `against`. Both rest on the claim just falsified. The passed-over reason reads "the record defines no term answer, so on the most frequent heading of the page the link it directs has no target, and the entry it would resolve for persistence names a node asking another question", and the `against` reads "`Answer` has no target on any of the 134 nodes that carry facts, because nothing in the record defines the term". Under `definerIndex` the flat reading of the author's words produces a link on `answer` that resolves to `node` and misleads, which is the same fault the reason already names for `persistence`, not the absence of a target. The `against` matters most, because `alignment-page` puts it on the recommended option's row at the first level, so it is one of the few lines the author reads before choosing, and as written it tells them something about the record that is not so. Suggested edit to the reason: "the record defines both `answer` and `persistence` as bare terms on nodes asking other questions -- `disposition/disposition-graph/node.md:65` and `disposition/disposition-graph/transience.md:76` -- so on two of the four facts, one of them the heading that appears on all 134 nodes carrying facts, the link the direction asks for would resolve and mislead." Suggested edit to the `against`: strike "because nothing in the record defines the term" and say instead that the only entry for it is a bare term on a node asking another question, which this answer refuses to link to.
- ## Answer, the fallback clause. "Where the record carries no such entry the heading is the name and it is not a link, and the missing definition is a finding on `commons.systems/disposition-graph/dialogue`, which reserves the four names." Two things are wrong with the routing. First, the record does carry an entry for both names, so what is missing is a gloss on an entry that already exists elsewhere and not a definition on `dialogue`. Second, `dialogue` owes no gloss for a fact's *name* today: its recommended text has a gloss written "once, on the defining node, and read from there, ratified, delegated and deferred on the authority node and keep and prune here", which is a rule about the *options* of the two vocabulary facts and says nothing about the four fact names. So the obligation this answer places on `dialogue` is one this node is inventing, and it should say so, or send the finding to the node that already carries the bare term -- `node` for `answer`, `transience` for `persistence`. Suggested edit: name the two nodes that carry the bare entries, say that what is owed is a gloss on each, and say whether this answer asks `dialogue` to take the four names over or asks the two definers to gloss what they already claim.
- ## Answer and ## Facts, validation 3 (a file named exists, a line cited names what is claimed). Every line citation in this draft is off. `factLabel` is at `packages/disposition/project.mjs:1350-1357`, not `:1346-1353`; the answer-fact branch, cited as `packages/disposition/project.mjs:1347` for "Today it is headed with the node's own question", is at `:1351`; `definerIndex`, cited as `packages/disposition/project.mjs:1326-1337` in "the definer index (`packages/disposition/project.mjs:1326-1337`) resolves the fact's name to a node asking a different question", is at `:1330-1341`; and `renderFact` prints the label at `:1648`, where the passed-over reason on `question-as-the-heading` cites `packages/disposition/project.mjs:1346-1353` for `factLabel` again. The substance of each claim holds at the corrected line; only the numbers are wrong. Every one of them was exact at implementation commit `87e4b24e` and staled when `cb0e02c6` landed on 2026-09-07, and the same staleness runs through all four drafts of this wave, so it is one reconciliation and not a defect of this draft's care. `disposition/disposition-graph/transience.md:76` and `disposition/disposition-graph/madr-decision-records.md:45` are exact, as are the counts of 134 answer facts and 141 node files at graph commit `5da05bc4`, which I re-took.
- ## Account, the probe stated as owed. "One periagogic probe is owed and is stated here as a question, to be put when the author is directed to the page: where the record defines no term for a fact, so that the heading cannot be the link they asked for, would the author rather read the unlinked name or the question the incumbent prints?" Under `probe-or-node`'s test that question is not a probe: it is a candidate answer to this node's own question, and all three candidates are already listed as options -- `name-linked-to-the-definer`, `name-with-no-link`, and `question-as-the-heading`. "An open question has three homes and this rule sends it to one of them: it is an **option** where you hold a candidate answer to this node's question viable, whether or not you would recommend it." The record is already in the right shape; what is wrong is the Account calling it a probe owed, which would send a later session to record one and return the node to the maieutic stage for a question the fact already asks. Suggested edit: say that the question is put to the author as the fact's options and not as a probe, and drop the word probe.

On the facts and what they recommend: Two facts, both well formed. The answer fact recommends `name-linked-to-the-definer` at moderate boldness among seven options, four passed over with reasons and two viable-and-not-adopted; nothing stands, so there is no `stands` and the `## Recommendation` fence is correctly present, and it carries frontmatter without the dialogue's keys, `## Answer` and `## Rationale`, which is the shape `dialogue`'s recommended text asks for. The authority fact recommends `ratified` at low boldness with the three reserved terms and no prose on the options, correctly, and its `### authority` subsection applies `class-recommendation`'s three limbs by name and says which it found, which is what that node requires. Moderate boldness on the answer fact reads slightly low to me now: the two clauses the AI added to the author's words turn on a description of the record that the first finding falsifies, so more of the recommendation rests on the AI's own reading than the fact's prose claims. No existence or persistence fact, correctly: no prune is proposed and the recommendation changes no shim or evidence.

On the viability of the options: Every listed option is viable on its facts, and the four passed over carry reasons that hold: `question-as-the-heading` is struck by both of the author's bullets by name, `name-and-question-together` prints the incumbent and the direction one after the other, `answer-keeps-the-question` is named by the second bullet in terms, and `heading-is-the-name-and-a-link` is dominated once the bare entries are seen for what they are -- though its stated reason needs the correction above. One viable option is missing, and it is the one that would deliver the author's direction whole: `glosses-written-with-this-ruling` -- every fact heading is the fact's name and every one of them is a link, and the two entries that would resolve wrongly are fixed rather than routed around, a gloss being written on `disposition/disposition-graph/node.md:65` for `answer` and on `disposition/disposition-graph/transience.md:76` for `persistence`, or both terms moved to the node that reserves the four names, so that no heading falls back and the author gets on all four facts what they asked for on two. It is not dominated: the answer's own `against` states that the weakness of the recommendation is precisely the unlinked word on the most frequent heading of the page, and the recommendation's reply to that is 'the gap is now a finding', which defers to another ruling what one ruling here could close. Its cost is that it writes on two nodes this ruling does not own, and that is exactly the trade the author should get to make.

Strongest counter-argument (moderate): The author's stated ground for the change is repetition -- the answer prose fact "doesn't need to restate the question as its title" -- and that ground is exact on the answer fact alone, where the column prints the node's question two lines above. On the three reserved facts the page today prints no repetition at all: it prints the gloss of the term, or the definer's question, neither of which the reader has already met. So on three of the four headings this answer replaces a sentence that says something with a category word that says less, on a ground that does not reach them, and it does so on every one of the 134 nodes that carry facts. Where the link resolves the loss is recovered by a click; where it does not -- on `answer` and `persistence`, which is the most frequent heading and one other -- the author is left with a bare category and the record's own reasoning under `aspects-are-nodes`, that a decision labelled with a category tells the author nothing about what is being asked, stands whole with nothing answering it. The answer's reply is that the absence becomes a finding on another node, which is a promise about a future ruling rather than anything the author gets on the page they are looking at.

The session's reply: Accepted on all five, each verified at its locus on the main thread: node defines answer as a bare term at line 65, so the answer's ground, the passed reason and the fact's against all misstate the record; the fallback routes a missing gloss to dialogue, which owes none for a fact's name; every project.mjs line is stale since cb0e02c6, which is one reconciliation across the wave and is answered by naming functions and not lines; and the probe the account calls owed is the choice the fact's options already put. The recommendation moves to glosses-written-with-this-ruling, recorded from the reading's viability, since the fallback the recommended text carried was an incumbent defect doing the work of a design constraint, which the evaluation node's lens exists to catch: every heading is the fact's name and every one is a link, and the two entries that would resolve wrongly are fixed rather than routed around, the four names glossed on the node that reserves them, recorded as an option on dialogue, source this node, and the bare entries on node and transience released with it. The amendments owed: the answer's ground restated as the reading suggests; the reason and the against corrected; the fallback clause replaced by the amendment's own rule; the citations by function; and the account's probe restated as the fact's options. The counter-argument goes on the row at the strength the reading gave it. The amended answer owes its re-reading.

### The reading of 2026-09-07 applied, and the recommendation moved, 2026-09-07

The reading forwarded to the author's ruling at moderate strength, with five
findings and no probes. Its verdict, its strength and the pin of the
recommendation it read are in `review` above, written by the instrument. All five
were validated on the main thread at the loci they name and all five are
accepted.

Three were checks of the record against itself. The term `answer` is defined at
`disposition/disposition-graph/node.md:65`, and again inside that node's own
recommendation fence at `:153`, as a bare term with no gloss on a node whose
question is "What is a node?", so the draft's "Nothing in the record defines the
term `answer`" was false and the passed reason and the fact's `against` were
false with it; `definerIndex` indexes a term whether or not its entry carries a
gloss, which its own comment says, so the flat reading of the author's words
builds a link there that resolves and misleads. The fallback the draft carried
routed the missing definition to `dialogue`, which owes no gloss for a fact's
name today, when what is missing is a gloss on an entry that already stands
elsewhere. And every citation into `packages/disposition/project.mjs` was exact
at implementation commit `87e4b24e` and staled when `cb0e02c6` landed on
2026-09-07; the same staleness ran through all four drafts of this wave, so it is
one reconciliation, answered by naming the function and not the line, which is
the form `where-the-unconfirmed-indication-goes` already takes.

The recommendation moves to `glosses-written-with-this-ruling`, recorded from the
reading's viability with `review` as its source. What moved it is the record's
own lens: the fallback the recommended text carried was an incumbent defect —
two bare `defines` entries — doing the work of a design constraint, which is the
failure `evaluation` says a recommendation is redrawn for. So every heading is
the fact's name and every one is a link, the two entries that would resolve
wrongly are fixed rather than routed around, the glosses for `answer` and
`persistence` are written on `dialogue`, the node that reserves the four names,
and the bare entries on `node` and `transience` are released to it.
`name-linked-to-the-definer` stays viable and unadopted as the option that leaves
the record as it stands, which is the side the counter-argument's second half
argues for.

The text a ruling here would write on `dialogue` is drafted there, as the option
`dialogue-glosses-the-four-fact-names` with this node as its source, so that no
sentence this ruling would add to another node's `defines` list lives only in
this node's prose.

The account's owed probe is struck, since the question it stated is the choice the
fact's own options put, and the `### answer` subsection, the fence and the
Rationale are redrawn for the option that now stands. The amended answer owes its
re-reading, and the recommendation having moved, the node returns to the review
stage.
