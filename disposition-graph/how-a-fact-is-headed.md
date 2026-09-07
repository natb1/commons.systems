---
question: How is a fact's section headed on the alignment page?
stage: ruling
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
        supports:
          - words/2026-09-04/29
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
  of: b81b6e224511ac07c31a06cc7d14c8e27af2e798
  commit: f146f8f44b295c64e47a13bff338748035183d87
  against: "All five findings of the previous reading are answered, each verified at its locus: the false 'nothing in the record defines the term answer' claim is replaced with an accurate account of the bare entry at node.md:65; the passed-over reason and the fact's `against` on `heading-is-the-name-and-a-link` are corrected to the same effect; the fallback-to-dialogue clause is removed entirely rather than patched, since the new recommendation needs no fallback; every stale project.mjs/derive.mjs line citation is now given by function name; and the Account no longer calls the periagogic question a probe, instead correctly routing it through the fact's own options under `probe-or-node`. Question two also turns up nothing false: the new design (glossing `answer` and `persistence` on `dialogue` and releasing the bare entries on `node` and `transience`) is a genuinely new decision beyond what the previous reading's own suggested missing option sketched (which touched only two nodes, `node` and `transience`, by glossing them directly rather than writing to `dialogue`), but it is drawn from cited evidence (`glossary`/`definerIndex` both take the first definer and ignore later ones) and its cost is stated plainly in the fact's own `against`, so it reads as a defensible design choice made in the open rather than an unexamined addition."
  survey:
    date: 2026-09-07
    of: b81b6e224511ac07c31a06cc7d14c8e27af2e798
under:
  - commons.systems/disposition-graph/alignment-page
---

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

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

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
```

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

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is a fact's section headed on the alignment page?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---
## Answer

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
```

#### question-as-the-heading

Everything the recommended option says, reversed: each fact is labelled with the
question it asks, in the words of the node or of the fact, which is `factLabel`
in `packages/disposition/project.mjs` today and the parent's own clause
before this sitting.

**AI support.** For it, the record's reasoning under `aspects-are-nodes`,
that a decision labelled with a category tells the author nothing about what is
being asked. Passed over: the author's two bullets strike both halves of it by
name, and the reply to the reasoning is the link.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is a fact's section headed on the alignment page?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---
## Answer

Everything the recommended option says, reversed: each fact is labelled with the
question it asks, in the words of the node or of the fact, which is `factLabel`
in `packages/disposition/project.mjs` today and the parent's own clause
before this sitting.
```

#### name-with-no-link

Everything the recommended option says, with no link on any heading: the fact's
name and nothing more.

**AI support.** For it: it is one rule with no conditions, it never
resolves wrongly, and the two missing definitions stop mattering. Viable and not
adopted: the author asked for the link in terms, and without it "Authority" alone
is the bare category the record's own reasoning says tells the author nothing,
with nothing to answer that reasoning at all.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is a fact's section headed on the alignment page?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---
## Answer

Everything the recommended option says, with no link on any heading: the fact's
name and nothing more.
```

#### link-to-the-definer-or-to-dialogue

Everything the recommended option says, with a heading whose term no node defines
linking to `commons.systems/disposition-graph/dialogue`, which reserves the four
names, rather than carrying no link.

**AI support.** For it: it is a real target and a true one,
`dialogue` is where a reader learns what the reserved facts are, and the author
gets the link they asked for on every heading. Viable and not adopted: it sends
the author to a page-long encoding text to learn what `answer` means, where the
`defines` entry would have given them a sentence; and it converts a missing
definition into a plausible render, so the gap stops being findable the moment the
link resolves, which is the fault `authors-words-on-the-page` names in the
projector's own whole-section fallback.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is a fact's section headed on the alignment page?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---
## Answer

Everything the recommended option says, with a heading whose term no node defines
linking to `commons.systems/disposition-graph/dialogue`, which reserves the four
names, rather than carrying no link.
```

#### name-and-question-together

Everything the recommended option says, with the question kept beside the name in
smaller text. Passed over: it is the incumbent and the author's direction printed
one after the other, so nothing is struck; and on the answer fact the question is
the column's own heading two lines above, which is the repetition the author's
second bullet names.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is a fact's section headed on the alignment page?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---
## Answer

Everything the recommended option says, with the question kept beside the name in
smaller text. Passed over: it is the incumbent and the author's direction printed
one after the other, so nothing is struck; and on the answer fact the question is
the column's own heading two lines above, which is the repetition the author's
second bullet names.
```

#### answer-keeps-the-question

Everything the recommended option says, with the answer fact alone still headed by
the node's question, on the ground that it is the one fact whose question is the
node's own. Passed over: the author's second bullet names that fact and that
heading in terms, and it is the fact for which the repetition is exact rather than
arguable, since the column prints the same sentence directly above.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is a fact's section headed on the alignment page?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---
## Answer

Everything the recommended option says, with the answer fact alone still headed by
the node's question, on the ground that it is the one fact whose question is the
node's own. Passed over: the author's second bullet names that fact and that
heading in terms, and it is the fact for which the repetition is exact rather than
arguable, since the column prints the same sentence directly above.
```

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

**AI support.** The author, 2026-09-04, on the alignment page, in two bullets: "Just rename
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

**AI divergence.** The author's ground is repetition, and it is exact on the answer fact alone, where the column prints the node's question two lines above; on the three reserved facts the page prints no repetition at all, and this answer replaces a sentence that says something with a category word that says less, on all 134 of the nodes that carry facts, recovering it only by a click. And it buys the link on every heading by writing on three nodes this ruling does not own: a gloss on `dialogue` for two of the four names and the release of the bare entries on `node` and `transience`, so a ruling here reaches into another node's `defines` list to make its own rule buildable.

**Content.**

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
```

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

## Account


What the sitting would amend: `commons.systems/disposition-graph/alignment-page`, its answer fact, and in the recommended text the sentence "Each is labelled with the question it asks, in the words of the node or of the fact, because under `aspects-are-nodes` every decision is a question and a decision labelled with a category tells the author nothing about what is being asked." The author's two bullets strike both halves of it: the reserved fact is headed by its own name and not by the question of the node that defines it, and the answer fact is headed "Answer" and not by the node's question, which the column has already printed above. The heading gains something the answer does not give it today, a link to the node that defines the fact, and that half of the author's words is not met by any sentence of the recommended text; it also meets a condition that answer states elsewhere, that a metric links "to that node in the browser, which addresses every node by its id where this page has no route to one, and a node the browser does not render, one with no answer yet, is named by its id and not linked", so the sitting has to say what the heading does where the defining node is itself unanswered, as `dialogue` is. In the implementation the change falls on the alignment page's projector in `packages/disposition/project.mjs`, `factLabel`, which returns the node's own question for the answer fact and the gloss or the defining node's question for a reserved one, and `renderFact`, which prints it in `<legend class="factlbl">` with no link, and on the legend's styling in `packages/disposition/alignment-template.html`.

Cascades: `commons.systems/disposition-graph/dialogue`, whose `aspects-are-nodes` is the ground the incumbent sentence rests on and whose `defines` entries and glosses are what a heading would name and link to; `commons.systems/disposition-graph/authority`, the node the authority heading would link to; `commons.systems/disposition-graph/vocabulary-view`, on a defined term being linked to the node that defines it wherever it appears; and `commons.systems/disposition-graph/projection`, which owns the browser's address and whether an unanswered node is rendered there at all, since that is what decides whether such a heading can be a link.

The periagogic object: the published alignment page at https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 at the answer and authority facts of `commons.systems/public/agency`, read against the recommended text of `alignment-page`, the `defines` entries of `dialogue` and `authority`, and `factLabel` in the projector, before anything is changed.

### Manifest

- Folded: The maieutic movement, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of 5306f2c9, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The reading of 2026-09-07 applied, and the recommendation moved, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of ffc2656d

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `glosses-written-with-this-ruling`.

Findings:


On the facts and what they recommend: The diff moves the answer fact's `recommends` from `name-linked-to-the-definer` to `glosses-written-with-this-ruling` (a new option, source review, ref 2026-09-07), keeping boldness moderate; the `against` on both the answer and authority facts is rewritten to argue against the new recommended option rather than the old one, and the authority fact keeps `recommends: ratified` at low boldness with an `against` updated to match. No `stands` on the answer fact, so the `## Recommendation` fence remains present and is fully redrawn for the new option; no existence or persistence fact is added.

On the viability of the options: Every option remains viable after the diff. `name-linked-to-the-definer` is downgraded from recommended to viable-and-not-adopted with an accurate account of what it now gives up (the fallback, refused by the new recommendation). The new option `glosses-written-with-this-ruling` is confirmed viable: I verified against `disposition/disposition-graph/dialogue.md` that the option `dialogue-glosses-the-four-fact-names` (source `how-a-fact-is-headed`, ref 2026-09-07) is in fact drafted there as a viable, not-yet-adopted option on dialogue's own answer fact, and that `dialogue` already glosses `existence` and that `authority` is glossed on the `authority` node exactly as claimed. The two bare `defines` entries the amendment cites, `disposition/disposition-graph/node.md:65` (`answer`) and `disposition/disposition-graph/transience.md:76` (`persistence`), are exact at those lines. All `packages/disposition/project.mjs` and `packages/disposition/derive.mjs` citations in the amended text now name functions (`factLabel`, `definerIndex`, `renderFact`, `glossary`) without stale line numbers, and I confirmed each function exists in the file named.

Strongest counter-argument (moderate): All five findings of the previous reading are answered, each verified at its locus: the false 'nothing in the record defines the term answer' claim is replaced with an accurate account of the bare entry at node.md:65; the passed-over reason and the fact's `against` on `heading-is-the-name-and-a-link` are corrected to the same effect; the fallback-to-dialogue clause is removed entirely rather than patched, since the new recommendation needs no fallback; every stale project.mjs/derive.mjs line citation is now given by function name; and the Account no longer calls the periagogic question a probe, instead correctly routing it through the fact's own options under `probe-or-node`. Question two also turns up nothing false: the new design (glossing `answer` and `persistence` on `dialogue` and releasing the bare entries on `node` and `transience`) is a genuinely new decision beyond what the previous reading's own suggested missing option sketched (which touched only two nodes, `node` and `transience`, by glossing them directly rather than writing to `dialogue`), but it is drawn from cited evidence (`glossary`/`definerIndex` both take the first definer and ignore later ones) and its cost is stated plainly in the fact's own `against`, so it reads as a defensible design choice made in the open rather than an unexamined addition.

The session's reply: Forwarded with no finding; the counter-argument, that the recommendation now writes on dialogue as well as node and transience, is the cost the fact's own case against states, and it stands on the row at moderate strength. Nothing on the node changes.

### Frontier survey, 2026-09-07, of ffc2656d

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict. It read the graph at graph commit `e4c87ed083180d8ddd57045a20a5df80704787a5`, which the record carries in no key until `dialogue`'s option `survey-pin-carries-its-commit` is ruled.

Findings:


Strongest counter-argument (moderate): The recommendation buys its rule by writing on three nodes it does not own, and only one of the three carries the writing where the author would meet it. The gloss half is drafted on dialogue as `dialogue-glosses-the-four-fact-names`; "the release of the bare entries on `node` and `transience`" is on neither of those nodes, on no fact, and in no depends. So the answer's claim that "There is no fallback, because this ruling leaves no name without such an entry" rests on two edits the record has not proposed where they would be made, and the heading that appears on all 134 nodes carrying facts is the one whose link they secure.

### Frontier finding, 2026-09-07

Kind: cross-reference.

how-a-fact-is-headed's recommendation edits two other nodes' `defines` lists and neither node carries the edit. Its fact's case against says it "buys the link on every heading by writing on three nodes this ruling does not own: a gloss on `dialogue` for two of the four names and the release of the bare entries on `node` and `transience`", and its answer requires that "the bare entries at `disposition/disposition-graph/node.md:65` and `disposition/disposition-graph/transience.md:76` are released to it, so that one entry stands for each name." The gloss half is recorded where the author will meet it, as `dialogue-glosses-the-four-fact-names` on dialogue. The release half is recorded nowhere: node.md and transience.md name how-a-fact-is-headed at no locus, carry no option for the release, and are in no depends of that node. So the answer's claim that "There is no fallback, because this ruling leaves no name without such an entry" rests on two edits the record has not proposed on the nodes that would make them.

Also named: commons.systems/disposition-graph/node, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/dialogue.

Proposed: node and transience are where the release is missing. The release of each bare `defines` entry is recorded as an option on that node's answer fact, sourced to how-a-fact-is-headed, so each node's own ruler meets the edit their node would take, as dialogue's ruler already meets the gloss. how-a-fact-is-headed's answer stands; what it lacks is the two rows on the nodes it writes on.

Recorded as an option on commons.systems/disposition-graph/node's answer fact: `answer-gloss-released-to-dialogue` (source review, 2026-09-07).

Recorded as an option on commons.systems/disposition-graph/transience's answer fact: `persistence-gloss-released-to-dialogue` (source review, 2026-09-07).

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/how-a-fact-is-headed stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Recommendation` fence became the content of `glosses-written-with-this-ruling`; 1 `## Disposition` entry became the ledger entry words/2026-09-04/29, referenced by 1 option the entry's own date names. The content of `name-linked-to-the-definer (at 0f4c594d)` was recovered from the commit at which the answer fact recommended it. The record wrote no text of its own for `heading-is-the-name-and-a-link`, `question-as-the-heading`, `name-with-no-link`, `link-to-the-definer-or-to-dialogue`, `name-and-question-together`, `answer-keeps-the-question`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `ffc2656dd3a15f8511154e684286ae01dfdb8027` is re-computed for the encoding as `b81b6e224511ac07c31a06cc7d14c8e27af2e798`; nothing it read changed. The survey's pin `ffc2656dd3a15f8511154e684286ae01dfdb8027` is re-computed for the encoding as `b81b6e224511ac07c31a06cc7d14c8e27af2e798`; nothing it read changed.
