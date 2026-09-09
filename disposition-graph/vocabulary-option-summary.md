---
question: What does an option's summary say on a fact whose options are the record's own vocabulary?
stage: ruling
form: rule
facts:
  - name: answer
    options:
      - name: term-at-the-first-level
        source: author
        ref: "2026-09-04"
        supports:
          - words/2026-09-04/43
      - name: gloss-at-the-first-level
        source: commons.systems/disposition-graph/alignment-page
        ref: "2026-09-05"
        status: passed
        reason: "the author's words of 2026-09-04 strike it by name, asking for the name of the level and nothing more"
      - name: authority-alone
        source: ai
        ref: "2026-09-07"
      - name: term-linked-to-the-definer
        source: ai
        ref: "2026-09-07"
      - name: term-and-a-short-gloss
        source: ai
        ref: "2026-09-07"
        status: passed
        reason: "a gloss cut to the width of a row is the record's sentence with its qualification removed, which on ratified is the half saying the author is asked before it changes"
      - name: term-with-the-gloss-on-the-first-node-only
        source: review
        ref: "2026-09-07"
    recommends: term-at-the-first-level
    boldness: low
    against: "On the most repeated decision on the page the author will now read three words, ratified, delegated and deferred, and the sentence saying what confirming each would do sits behind a fold on every one of the 134 nodes that carry the fact. The record's own reason for putting it on the row was that the bare words told the author nothing they did not already have to know, and this answer's reply is that they do already know it, which is true of this author and of no other reader the page may ever have."
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
    against: "The author asked for exactly this in their own words, so ratifying it spends their scarcest act on a transcription, and it freezes the row's text against `vocabulary-view`, which asks how a defined term is presented and linked wherever it appears and has not been held. Deferred would let the row act while that question is open, which is where the contested part of this lives."
review:
  verdict: forward
  strength: none
  date: 2026-09-07
  of: 7ac1298c20cf16687fa1f2be4a3109ed4116500d
  commit: f146f8f44b295c64e47a13bff338748035183d87
  survey:
    date: 2026-09-09
    of: 7ac1298c20cf16687fa1f2be4a3109ed4116500d
    commit: 7eb63405f8cb47eeeb97bf86f5a5a87948c0efbb
    text:
      question: "a8b1bad45ca6e50a193dbd7bf9c4dbf755dcb3cff96d5d40c7668ffc9bd711aa"
      answer: "78c4b81e46dd3eec9dc7a233029d642ac2a26f11786bf5fae0fd22023093e628"
      options: "9bf90747c262407697508835337e4ac38a4b41a2d9885eac8ce7348391092d37"
      rivals: "f87ab5bc48a47d69dfb12b8fd16b3cd49b2da7e5f590737ed8a8c0e920238eb5"
      words: "e6f2050cb05d09d22e3b822a15eff24a87b3da0dea550dc319a61e10d93eecf0"
under:
  - commons.systems/disposition-graph/alignment-page
depends:
  - commons.systems/disposition-graph/what-an-option-row-carries
---

## Facts

### answer

Recommended because it is the author's sentence applied where it falls, and
because the division it applies to is the record's own. The first clause is
theirs, verbatim in effect: the summary is the name of the level.

Boldness low, because the recommendation rests on the author's words rather than
against them, which is the measure `dialogue` gives boldness. What is the AI's is
the disposal of the gloss, which the record's rule against a fold decides, and
the reach to the second vocabulary fact, which `dialogue`'s own sentence decides
by naming the two together. Neither is a departure from anything the author has
said, and neither is the AI preferring its own reading of the page's purpose to
theirs, which is what this fact's `against` is about.

The case against is on the fact at full strength: the record wrote the gloss onto
the row for a reason, and this answer removes it on the strength of the one reader
the page has today.

#### term-at-the-first-level

The option's name, as the term it is, and the gloss one step down.

**AI support.** The author, 2026-09-04, on the alignment page: "Authority fact does not require
verbose description of each authority level. Just rename section heading 'Who may
change an answer?' to 'Authority' and hyperlink heading to authority node in the
browser. Text summary for each authority option is just the name of the authority
level."

The last sentence is this node's, and it is the whole of the recommendation's
first clause. The two before it are `how-a-fact-is-headed`'s and are cited here
only because they are what makes the term legible: the author asked for the
heading to name the fact and to link to the node that defines it, so the reader
who meets a bare term on a row has the definition one line above and one click
away, which is the reply to the record's own reason for the gloss.

Two things in the answer are not in that sentence. The gloss going one step down
rather than off the page, which the record's own rule requires, since a projection
that drops what it stops showing is a fold and the author's words of 2026-09-04
struck the fold. And the reach to `topology`, which the author did not name:
`dialogue` states one rule for the two facts in one sentence, and a page showing a
term on one and a sentence on the other would make the reader learn which fact
they are looking at before they could read a row, so the answer is about
vocabulary facts as a class and says so.

What the answer beat is on the fact: `gloss-at-the-first-level`, the incumbent,
which the author's words strike; `authority-alone`, which is this answer for one
fact; and `term-and-a-short-gloss`, which is the gloss again at the width a row
allows.

**AI divergence.** On the most repeated decision on the page the author will now read three words, ratified, delegated and deferred, and the sentence saying what confirming each would do sits behind a fold on every one of the 134 nodes that carry the fact. The record's own reason for putting it on the row was that the bare words told the author nothing they did not already have to know, and this answer's reply is that they do already know it, which is true of this author and of no other reader the page may ever have.

**Content.**

```markdown
---
question: What does an option's summary say on a fact whose options are the record's own vocabulary?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

The option's name, as the term it is, and the gloss one step down.

On a fact whose options are the record's own vocabulary the row leads with the
term and nothing else: `ratified`, `delegated`, `deferred` on the authority fact,
`keep` and `prune` on topology. The gloss, the sentence the defining node carries
beside the term and which says what confirming that choice would mean, is the
first thing in the option's drill-down, under the label the drill-down already
gives the rest of an option's text, credited to the node that holds it. Nothing
is lost; one level is spent.

The reach is two facts and no wider. `authority` and `topology` are the two
whose options are terms; `persistence`'s options are shapes written per node and
`answer`'s are candidate answers written per option, and both keep their sentence
at the first level, where there is no name that says the decision and the sentence
is the decision. That division is `dialogue`'s, in the sentence this answer reads
and does not amend: "An option of the two facts whose options are the record's own
vocabulary, `authority` and `topology`, has no subsection at all: its name is a
term, and its sentence is the gloss on the node that defines the term." That text
is `dialogue`'s recommended text, which no ruling has reached, and this answer
reads it as direction and not as doctrine; the rule stated here holds whichever
way that node rules, because a fact whose options are terms the record defines is
what the rule is about, and `dialogue`'s standing answer already names `authority`
and `topology` as the two facts whose options are the record's own vocabulary.
Nothing is entered in `depends` for that reason. Where the gloss lives and who
writes it are untouched: written once, on the defining node, read from there, and
never carried by the page for itself. What changes is which level of the row it
appears at.

What this does to the sibling's rule is said here and not left to an executor.
`what-an-option-row-carries` holds that a row "carries the option's name nowhere",
and gives the reason: "the name is how a ruling is stored and the sentence is the
decision, and the author's words of 2026-09-04 strike the id-shaped string from
the row"; it holds too that where the record holds no sentence "the row falls
back to the bare name ... so a bare name on the page is a record not yet written
and a defect to be found". Neither reaches a vocabulary fact. On the two facts
whose options are the record's own vocabulary the option's name is not an
id-shaped slug but a term the record defines, and the sentence the record holds
for that option and the name of that option are the same string, so leading with
the term is leading with what the record holds and not with the handle a ruling
is filed under; and a term is not the fallback that node calls a defect, since
the fallback is what the projector prints when the record holds nothing, where
here it holds a gloss and a defined term both. The exception is recorded on that
node as the option `a-term-is-its-own-sentence`, with this node as its source, so
that its two sentences are amended with it rather than left contradicting this
page on 402 rows.

Why the term is enough at the first level, against the record's own reason for
the gloss. The parent's answer holds that the authority class "is the most
repeated decision on the page, and rendered as the two bare words `ratified` and
`delegated` it told the author nothing they did not already have to know". The
author's words of 2026-09-04 answer that in the other direction, and the answer
takes their side with the reason stated: a sentence carried on 134 of the 141
node files of both graphs is read once and skipped thereafter, so the gloss earns
its place on the first node and costs on every node after it, while the term is
what the reader recognises at a glance and is the only thing on the row that
differs between the three choices. What a repeated decision needs at the level the
eye reads is the name; what a first reading needs is the sentence, and one step
down is where the record already keeps what explains a row.

What the author gives up is stated and not argued away. On the first node they
read, three rows saying `ratified`, `delegated` and `deferred` say nothing at all
to a reader who does not already hold the record's vocabulary. Two things answer
that and neither is nothing: the drill-down, which carries the whole gloss under
the label it already carries the rest of an option's text under; and the fact's
own heading, which under `how-a-fact-is-headed` is the fact's name linked to the
node that defines it, so the vocabulary is one click from the row on the line
above it. The row itself carries no link, because whether a defined term is linked
wherever it appears is `commons.systems/disposition-graph/vocabulary-view`'s
question and not this page's to settle.

In the implementation the row's lead is `renderOption`
(`packages/disposition/project.mjs`), which prints the first sentences
of whatever `optionText` returns, and for a vocabulary option `optionText`
(`packages/disposition/derive.mjs`) returns the gloss with the id of the
node that holds it. `optionText` need not change and should not: it is what keeps
the sentence in one place. What changes is the projector, which for an option of a
vocabulary fact prints the term as the row's lead and puts the gloss at the head
of the drill-down. The drill-down's present body is `restOf`, the remainder the
lead did not take, which for a gloss is empty, since a gloss is one sentence and
the lead's cap is `CHOICE_LEAD_CHARS`, 400 characters, in the same file; so the
gloss reaches the drill-down only if the projector is told to put it there, and a
reconciliation that moved the lead and not the body would drop the sentence off
the page entirely.
```

#### gloss-at-the-first-level

Everything the recommended option says, reversed: the row's lead is the gloss of
the term, in the words of the node that defines the fact, which is what the page
prints today for all three authority options on every node.

**AI support.** For it, the parent's
own reason, that the bare words told the author nothing they did not already have
to know, and the fact that a reader new to the record can rule from the row
without opening anything. Passed over: the author's words of 2026-09-04 ask for
the name of the level and nothing more, and the parent's clause already records
itself as standing only until this node rules.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an option's summary say on a fact whose options are the record's own vocabulary?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, reversed: the row's lead is the gloss of
the term, in the words of the node that defines the fact, which is what the page
prints today for all three authority options on every node.
```

#### authority-alone

Everything the recommended option says, for the authority fact alone, with
`topology` keeping the gloss at the first level.

**AI support.** For it: the author named
authority, `topology` appears on 6 nodes against authority's 134, so the argument
from repetition is weak there, and `keep` and `prune` are terms whose glosses are
short. Viable and not adopted: `dialogue` states one rule for the two facts in one
sentence, and a row that leads with a term on one fact and with a sentence on
another asks the reader to know which fact they are in before they can read the
row, which is a rule the page would carry and no node would project.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an option's summary say on a fact whose options are the record's own vocabulary?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, for the authority fact alone, with
`topology` keeping the gloss at the first level.
```

#### term-linked-to-the-definer

Everything the recommended option says, with the term on the row made a link to
the node that defines it.

**AI support.** For it: a bare term is the one lead on the page that
tells a new reader nothing, and a link on the term is the shortest route to the
sentence it stands for. Viable and not adopted:
`commons.systems/disposition-graph/vocabulary-view` asks how a defined term is
presented and linked wherever it appears and is unanswered, so a link here would
settle its question from this page; and under `how-a-fact-is-headed` the fact's
own heading already carries that link for the whole fact, so a link per row prints
the same route three times on one fieldset.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an option's summary say on a fact whose options are the record's own vocabulary?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with the term on the row made a link to
the node that defines it.
```

#### term-and-a-short-gloss

Everything the recommended option says, with the term at the first level and the
gloss's opening clause beside it.

**AI support.** For it: it keeps some of the sentence where the
author reads and still shortens the row. Passed over: it is the gloss again, cut
to the width a row allows, where the author asked for the name and nothing more;
and a gloss with its qualification removed is worse than no gloss, since on
`ratified` the clause that would be cut is the half that says the author is asked
before the answer changes, which is the whole of what distinguishes it from
`delegated`.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an option's summary say on a fact whose options are the record's own vocabulary?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with the term at the first level and the
gloss's opening clause beside it.
```

#### term-with-the-gloss-on-the-first-node-only

Everything the recommended option says, with one exception: the row leads with
the term everywhere except on the first node of a sitting, or on the first fact
of the page's session, where the gloss is printed once so that a reader who does
not hold the vocabulary meets it before they meet 402 bare terms.

**AI support.** For it: it
takes the author's words where the argument for them is strongest, the same
sentence repeated on 134 nodes, and refuses them only where the argument is
weakest, the first reading, which the recommended option's own `against` concedes
it loses; and it costs one condition in the projector, which is less than the
condition `how-a-fact-is-headed` already asks for on the heading. Viable and not
adopted: which node is first in a sitting is no fact of the record — the order
is derived from the frontier and changes with every ruling, and the page has no
session of its own to be first in — so the condition would key the row's text to
something no node projects; and the record already has a device for the first
reading, the fact's own heading linked to the node that defines the term, which
is one click from the row on the line above it and is there on every node rather
than on one.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an option's summary say on a fact whose options are the record's own vocabulary?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with one exception: the row leads with
the term everywhere except on the first node of a sitting, or on the first fact
of the page's session, where the gloss is printed once so that a reader who does
not hold the vocabulary meets it before they meet 402 bare terms.
```

### authority

Ratified, on the capture-shaped limb of `class-recommendation`'s test. The other
two are not met and the reading says so. Not expensive: it is the row's lead and
the head of its drill-down, one projector change, with nothing built on it. Not
irreversible: no node's data moves, the gloss stays where `dialogue` keeps it, and
a wrong answer is undone by re-projecting the page.

The capture-shaped limb is met on the most repeated decision the page carries.
This answer decides how much the author is told, at the level they read, about a
choice they make on 134 nodes, and what it decides is that they are told a word
where the record holds a sentence. The party proposing the reduction is the party
whose class the decision confers, since a ruling of `delegated` on any of those
facts is what lets the AI's recommendation act without being asked again; a page
that renders those three choices as three words it expects the reader to already
know is the recommending party setting how legible its own delegation is. That is
the limb, and it is the same one `what-an-option-row-carries` found on the row's
other contents.

Low boldness: the limb is that sibling's recorded reading narrowed to the row's
lead, and the evidence is the page as built and the count of the fact at
`5da05bc4`.

Against it: the author asked for exactly this in their own words, so ratifying it
spends their scarcest act on a transcription; and it freezes the row's text
against `vocabulary-view`, whose question is how a defined term is presented and
linked wherever it appears and which has not been held, so deferred would let the
row act while the part of this that is still open stays open.

## Account


What the sitting would amend: `commons.systems/disposition-graph/alignment-page`, its answer fact, and in the recommended text the sentence "A reserved fact's options are vocabulary rather than slugs, and their sentence is what confirming that choice would mean, in the words of the node that defines the fact where the choices are the fact's own vocabulary, and of the node's own prose on the fact where they are written per node, as persistence's are; it is projected from there and never carried by the page for itself", together with the reason given for it in the next sentence, "The authority class is the most repeated decision on the page, and rendered as the two bare words `ratified` and `delegated` it told the author nothing they did not already have to know." The author's last sentence reverses that reason for the authority fact, and the same rule governs `existence`, whose `keep` and `prune` are the other vocabulary fact, so the sitting has to say whether the answer is about `authority` alone or about vocabulary facts as a class. This question rests on `what-an-option-row-carries`, which decides that a row leads with a short text summary at all; this one says what that summary is where the option is a term. In the implementation the change falls on the alignment page's projector in `packages/disposition/project.mjs`, `optionText` and the glossary lookup it uses for a vocabulary fact's options, and on `renderOption`, which prints the returned sentence as the row's lead.

Cascades: `commons.systems/disposition-graph/dialogue`, whose recommended text says that "An option of the two facts whose options are the record's own vocabulary, `authority` and `existence`, has no subsection at all: its name is a term, and its sentence is the gloss on the defining node", and whose rule that no projection carries a sentence of its own for an option is what makes the gloss the only text available; `commons.systems/disposition-graph/authority`, which carries the glosses on ratified, delegated and deferred and whose own answer is what the verbose descriptions quote; `commons.systems/disposition-graph/vocabulary-view`, on how a defined term is presented and linked; and `commons.systems/disposition-graph/progressive-disclosure`, since the gloss the row drops has to be reachable one step down or not at all.

The periagogic object: the published alignment page at https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 at the authority fact of `commons.systems/public/agency` and at a node carrying an existence fact, read against the recommended texts of `alignment-page` and `dialogue`, the glosses on `authority`, and `optionText` in the projector, before anything is changed.

### Manifest

- Folded: The maieutic movement, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of 2535cb58, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The reading of 2026-09-07 applied, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of 01059350

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `term-at-the-first-level`.

Findings:


On the facts and what they recommend: The diff adds one new viable option to the answer fact, `term-with-the-gloss-on-the-first-node-only` (source review, ref 2026-09-07), without changing `recommends` (still `term-at-the-first-level`), boldness (still low), or `stands`; the answer fact's `against` text is unchanged in substance. The authority fact is untouched: still `recommends: ratified`, boldness low, with a `review` block newly recorded in frontmatter carrying the previous reading's verdict, strength, pin and its own `against`. No existence or persistence fact, unchanged.

On the viability of the options: Every option remains viable. The new option `term-with-the-gloss-on-the-first-node-only` is recorded viable-and-not-adopted with the reasoning the previous reading itself supplied (it is not a fact of the record which node is first in a sitting, and the linked heading already serves the first reading), which I hold sound.

The review found no strong counter-argument.

The session's reply: Forwarded with no finding. Nothing on the node changes.

### Frontier survey, 2026-09-07, of 01059350

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict. It read the graph at graph commit `e4c87ed083180d8ddd57045a20a5df80704787a5`, which the record carries in no key until `dialogue`'s option `survey-pin-carries-its-commit` is ruled.

Findings:


Strongest counter-argument (weak): The answer's reply to the record's own reason for the gloss is the fact's heading, "which under `how-a-fact-is-headed` is the fact's name linked to the node that defines it", and that sibling's recommendation itself turns on two glosses not yet written on dialogue and two bare `defines` entries not yet released on node and transience. This node names the sibling in prose and not in depends, so the row can be ruled bare before the heading it leans on can resolve; in that interval a reader who does not hold the vocabulary meets three words and no route, which is exactly the state the fact's own case against describes.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/vocabulary-option-summary stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `term-at-the-first-level`; the `## Rationale` its `**AI support.**`; 1 `## Disposition` entry became the ledger entry words/2026-09-04/43, referenced by 1 option the entry's own date names; and `stands` left the answer fact. The record wrote no text of its own for `gloss-at-the-first-level`, `authority-alone`, `term-linked-to-the-definer`, `term-and-a-short-gloss`, `term-with-the-gloss-on-the-first-node-only`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `01059350d1d2da037d38b5ada9e1e5e49463203f` is re-computed for the encoding as `cac03b089a525288b22d5aab8c049cb57bac3ec3`; nothing it read changed. The survey's pin `01059350d1d2da037d38b5ada9e1e5e49463203f` is re-computed for the encoding as `cac03b089a525288b22d5aab8c049cb57bac3ec3`; nothing it read changed.
