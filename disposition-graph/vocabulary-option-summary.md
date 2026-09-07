---
question: What does an option's summary say on a fact whose options are the record's own vocabulary?
stage: review
form: rule
facts:
  - name: answer
    options:
      - name: term-at-the-first-level
        source: author
        ref: "2026-09-04"
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
    recommends: term-at-the-first-level
    boldness: low
    against: "On the most repeated decision on the page the author will now read three words, ratified, delegated and deferred, and the sentence saying what confirming each would do sits behind a fold on every one of the 134 nodes that carry the fact. The record's own reason for putting it on the row was that the bare words told the author nothing they did not already have to know, and this answer's reply is that they do already know it, which is true of this author and of no other reader the page may ever have."
    stands: term-at-the-first-level
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
under:
  - commons.systems/disposition-graph/alignment-page
depends:
  - commons.systems/disposition-graph/what-an-option-row-carries
---
## Disposition

The author, 2026-09-04, on the alignment page, queued from the sitting on author-questions:
> - Authority fact does not require verbose description of each authority level. Just rename section heading "Who may change an answer?" to "Authority" and hyperlink heading to authority node in the browser. Text summary for each authority option is just the name of the authority level.

## Answer

The option's name, as the term it is, and the gloss one step down.

On a fact whose options are the record's own vocabulary the row leads with the
term and nothing else: `ratified`, `delegated`, `deferred` on the authority fact,
`keep` and `prune` on existence. The gloss, the sentence the defining node carries
beside the term and which says what confirming that choice would mean, is the
first thing in the option's drill-down, under the label the drill-down already
gives the rest of an option's text, credited to the node that holds it. Nothing
is lost; one level is spent.

The reach is two facts and no wider. `authority` and `existence` are the two
whose options are terms; `persistence`'s options are shapes written per node and
`answer`'s are candidate answers written per option, and both keep their sentence
at the first level, where there is no name that says the decision and the sentence
is the decision. That division is `dialogue`'s own, in the sentence this answer
reads and does not amend: "An option of the two facts whose options are the
record's own vocabulary, `authority` and `existence`, has no subsection at all:
its name is a term, and its sentence is the gloss on the node that defines the
term." Where the gloss lives and who writes it are untouched: written once, on the
defining node, read from there, and never carried by the page for itself. What
changes is which level of the row it appears at.

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
(`packages/disposition/project.mjs:1490-1492`), which prints the first sentences
of whatever `optionText` returns, and for a vocabulary option `optionText`
(`packages/disposition/derive.mjs:312-323`) returns the gloss with the id of the
node that holds it. `optionText` need not change and should not: it is what keeps
the sentence in one place. What changes is the projector, which for an option of a
vocabulary fact prints the term as the row's lead and puts the gloss at the head
of the drill-down. The drill-down's present body is `restOf`
(`packages/disposition/project.mjs:1607-1613`), the remainder the lead did not
take, which for a gloss is empty, since a gloss is one sentence and the lead's cap
is 400 characters (`CHOICE_LEAD_CHARS`, `:1595`); so the gloss reaches the
drill-down only if the projector is told to put it there, and a reconciliation
that moved the lead and not the body would drop the sentence off the page
entirely.

## Rationale

The author, 2026-09-04, on the alignment page: "Authority fact does not require
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
struck the fold. And the reach to `existence`, which the author did not name:
`dialogue` states one rule for the two facts in one sentence, and a page showing a
term on one and a sentence on the other would make the reader learn which fact
they are looking at before they could read a row, so the answer is about
vocabulary facts as a class and says so.

What the answer beat is on the fact: `gloss-at-the-first-level`, the incumbent,
which the author's words strike; `authority-alone`, which is this answer for one
fact; and `term-and-a-short-gloss`, which is the gloss again at the width a row
allows.

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

#### gloss-at-the-first-level

Everything the recommended option says, reversed: the row's lead is the gloss of
the term, in the words of the node that defines the fact, which is what the page
prints today for all three authority options on every node. For it, the parent's
own reason, that the bare words told the author nothing they did not already have
to know, and the fact that a reader new to the record can rule from the row
without opening anything. Passed over: the author's words of 2026-09-04 ask for
the name of the level and nothing more, and the parent's clause already records
itself as standing only until this node rules.

#### authority-alone

Everything the recommended option says, for the authority fact alone, with
`existence` keeping the gloss at the first level. For it: the author named
authority, `existence` appears on 6 nodes against authority's 134, so the argument
from repetition is weak there, and `keep` and `prune` are terms whose glosses are
short. Viable and not adopted: `dialogue` states one rule for the two facts in one
sentence, and a row that leads with a term on one fact and with a sentence on
another asks the reader to know which fact they are in before they can read the
row, which is a rule the page would carry and no node would project.

#### term-linked-to-the-definer

Everything the recommended option says, with the term on the row made a link to
the node that defines it. For it: a bare term is the one lead on the page that
tells a new reader nothing, and a link on the term is the shortest route to the
sentence it stands for. Viable and not adopted:
`commons.systems/disposition-graph/vocabulary-view` asks how a defined term is
presented and linked wherever it appears and is unanswered, so a link here would
settle its question from this page; and under `how-a-fact-is-headed` the fact's
own heading already carries that link for the whole fact, so a link per row prints
the same route three times on one fieldset.

#### term-and-a-short-gloss

Everything the recommended option says, with the term at the first level and the
gloss's opening clause beside it. For it: it keeps some of the sentence where the
author reads and still shortens the row. Passed over: it is the gloss again, cut
to the width a row allows, where the author asked for the name and nothing more;
and a gloss with its qualification removed is worse than no gloss, since on
`ratified` the clause that would be cut is the half that says the author is asked
before the answer changes, which is the whole of what distinguishes it from
`delegated`.

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

### The maieutic movement, 2026-09-07

The periagogic stage's object was read by the unit of 2026-09-05, whose report is
the sixth of its ten items. It found the author's observation standing whole: the
row's lead for an authority option is the full gloss sentence from the defining
node, printed for all three options on every node, and the bare level name appears
nowhere on those rows since `87e4b24e` struck the handle span, `data-option` on
the radio being the only place it survives. It found the parent's clause amended
on 2026-09-05 to record the author's request and to mark itself as standing only
until this node rules, with the operative sentence unchanged and the projector
implementing it. The stage is passed on the author's words of 2026-09-07 rather
than in dialogue: "before stopping for confirmation, and ensure
alignment-page-observations is progressed up to confirmation and included in the
list of reconciliation for alignment/review/survey/artifact."

One periagogic probe is owed and is stated here as a question, to be put when the
author is directed to the page: does the direction reach `existence` as well as
`authority`? The author named the authority fact, `dialogue` states one rule for
the two together, and this answer takes the class; `authority-alone` is on the
fact for the other reading, and nothing the author has said chooses between them.

What the record says. The parent's answer holds two clauses a ruling here reaches,
located by their words: the vocabulary sentence, "A reserved fact's options are
vocabulary rather than slugs, and their sentence is what confirming that choice
would mean", whose second half this answer moves one level down and whose first
half and projection rule it keeps; and the reason beside it, "The authority class
is the most repeated decision on the page, and rendered as the two bare words
`ratified` and `delegated` it told the author nothing they did not already have
to know", which the parent has already marked as standing only until this node
rules and which this answer answers rather than deletes. `dialogue`'s rule that a
vocabulary option's sentence is the gloss on the defining node is cited and not
amended, so nothing here reaches that node's answer and nothing is entered in
`depends` for it. Among the siblings, `what-an-option-row-carries` is in
`depends` and decides that a row leads with a sentence at all and what marks sit
beside it; this answer says what that lead is where the option is a term, and adds
no mark. `how-a-fact-is-headed` is what makes a bare term legible, since the
fact's heading under that answer is the name linked to the node that defines it;
the two are stated as complements and neither depends on the other, since each
holds whichever way the other rules.

The tradition surfaced, and it is one reading, recorded here in prose with the
`bears` entry on the reading node owed with the ruling.
`commons.systems/disposition-graph/progressive-disclosure`, whose answer at
`disposition/disposition-graph/progressive-disclosure.md:53` holds "that an
interface shows the few things its reader needs most of the time and puts the rest
one step away; that the split is made by frequency and importance and not by the
designer's sense of tidiness; and that what is deferred must stay discoverable and
must never be lost". All three are met exactly here, and the third is why the
gloss goes to the drill-down rather than off the page. The relation is adopted on
the recommended option, and the divergence that node records against the parent is
not repeated here: at `:55` the reading notes that the record splits by boldness
rather than by frequency, and this answer splits by frequency in the tradition's
own terms, since the ground for demoting the gloss is that it is the same sentence
on 134 nodes. That is the one place under this page where the tradition's own
criterion applies unchanged, and it is recorded as such rather than folded into
the parent's divergence.

What the implementation does today, at the loci a ruling here changes.
`optionText` (`packages/disposition/derive.mjs:312-323`) returns the gloss of the
term for an option of a vocabulary fact, with the id of the defining node;
`renderOption` (`packages/disposition/project.mjs:1490-1492`) prints
`firstSentences(said.text)` as the row's lead, capped at 400 characters
(`CHOICE_LEAD_CHARS`, `:1595`); and the drill-down's body is `restOf`
(`:1607-1613`), which returns nothing for a one-sentence gloss, so the gloss
appears on the row and nowhere else. Measured at `5da05bc4`, 134 of the 141 node
files of both graphs carry an authority fact and 6 carry an existence fact, so the
three authority glosses are the most repeated text on the page.

The clean-context reading of this recommendation is owed before the author rules.
