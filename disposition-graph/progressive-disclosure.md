---
question: What does progressive disclosure say about which decisions the page asks and which it folds?
stage: review
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-04"
      - name: discloses-detail-not-decisions
        source: commons.systems/disposition-graph/alignment-page
        ref: "2026-09-04"
    recommends: discloses-detail-not-decisions
    boldness: moderate
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: moderate
form: reading
under:
  - commons.systems/disposition-graph/alignment-page
source: Nielsen, Usability Engineering (1993), chapter 5 on minimalist design, and "Progressive Disclosure" (Nielsen Norman Group, 2006); Carroll, The Nurnberg Funnel (1990), the minimalist instruction programme it descends from; Krug, Don't Make Me Think (2000).
bears:
  - fact: answer
    option: three-column-ruling-screen
    relation: adopted
  - fact: answer
    option: every-fact-every-option
    relation: adopted
---
## Answer

Supports the shape and does not supply the rule. The tradition holds three things: that an interface shows the few things its reader needs most of the time and puts the rest one step away; that the split is made by frequency and importance and not by the designer's sense of tidiness; and that what is deferred must stay discoverable and must never be lost. The alignment page adopts all three. The decisions this ruling asks are the first level, the author's words and the full text sit one step beneath each row, and nothing folded is lost, because every folded decision is present in the node the right-hand column renders.

The divergence is on the criterion for the split, and it is deliberate. The tradition splits by what most readers need most of the time, a frequency this page cannot know and would have to guess. The record splits by boldness, its own recorded measure of how much of a decision rests on the AI's own knowledge against the record. That is a property of the decision rather than of the reader, and it is the stronger criterion here for a reason particular to this page: it has one reader, so frequency across readers means nothing, and what actually varies from decision to decision is not the author's habit but the AI's warrant for having decided it.

The divergence has a consequence the tradition would warn about and the record accepts. Under frequency, what is folded is what the reader rarely wants; under boldness, what is folded is what the AI is surest of, which may be exactly what the author would have questioned. The record answers it the way the tradition asks, by never losing the folded thing: the whole node, folded decisions included, is what the right-hand column renders and what the final rejection rejects.

## Rationale

Recorded in the maieutic movement on the alignment page, 2026-09-04, as the tradition pass that node's evaluation requires. The author used the term in the disposition that opened the sitting, so the tradition entered in their words and not the AI's. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.

## Facts

### answer

The recommendation moved on 2026-09-04 with the alignment page's answer, as
this subsection said it would: the page's recommended option lists every fact
and folds nothing, so the standing text defends a divergence on a rule that no
longer exists, and the option beside it is the reading redrawn on the object
the tradition is about. The clean-context review of the alignment page found
the same on 2026-09-04 and asked that the move be made in the same landing.
Moderate boldness: the tradition's content is the AI's reading of the sources,
which the author has not read.

#### discloses-detail-not-decisions

Supports, and the recorded divergence is retracted rather than replaced. The
alignment page's disposition of 2026-09-04 lists every fact without exception
and every option under it, and folds nothing; so there is no longer a split of
decisions for this reading to supply a criterion for, and the three paragraphs
above that defend a boldness-based split defend a rule that no longer exists.
The tradition never asked for that split. Progressive disclosure defers detail
within a task to a reachable second level; it does not remove a decision from
the ask, and the fold rule it was cited for was a silent default and not
disclosure. What the tradition governs on the page after the change is what it
was always about: the two levels of each option row, the sentence and the
status at the first and the full text, the author's words, the AI's case and
the tradition's bearing one step beneath, with nothing lost. On that object the
record adopts the tradition plainly and diverges from it nowhere, and the
`bears` entry moves to the option the page's answer fact recommends once it is
named. (Raised on commons.systems/disposition-graph/alignment-page, in the
tradition pass of 2026-09-04, which found this reading's divergence falsified
by the author's words: "List each fact without exceptions.")

## Recommendation

```markdown
---
question: What does progressive disclosure say about which decisions the page asks and which it folds?
form: reading
under:
  - commons.systems/disposition-graph/alignment-page
source: Nielsen, Usability Engineering (1993), chapter 5 on minimalist design, and "Progressive Disclosure" (Nielsen Norman Group, 2006); Carroll, The Nurnberg Funnel (1990), the minimalist instruction programme it descends from; Krug, Don't Make Me Think (2000).
bears:
  - fact: answer
    option: every-fact-every-option
    relation: adopted
---
## Answer

Supports the page's shape and asks for no fold. The tradition holds three things: that an interface shows the few things its reader needs most of the time and puts the rest one step away; that the split is made by what the reader needs in order to act and not by the designer's sense of tidiness; and that what is deferred stays discoverable and is never lost. It governs the levels within a task and does not remove a decision from the ask: deferring detail is disclosure, and withholding a decision is a default.

The alignment page adopts all three on the object the tradition is about, the two levels of each option row. The first level is what the author needs to choose: the option's sentence, its status, what tradition says of it, and the case against the recommended one. The second, one step beneath the row and never lost, is what they need to check: the rest of the text, their own words the option rests on, the AI's reasons, each reading's account, and what a ruling keeps and discards. Every fact and every option is at the first level, because a decision is not detail, and the fold rule this reading was first cited for, which withheld the decisions the AI was surest of, was a silent default and not disclosure at all. On that object the record adopts the tradition plainly and diverges from it nowhere.

## Rationale

Recorded in the maieutic movement on the alignment page, 2026-09-04, as the tradition pass that node's evaluation requires, and redrawn the same day when the author's words, "List each fact without exceptions", withdrew the split of decisions the first reading defended: the three paragraphs that argued a boldness-based fold defended a rule that no longer existed, and the tradition had never asked for it. The author used the term in the disposition that opened the sitting, so the tradition entered in their words and not the AI's. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.
```

## Account

What this reading informed is the last sentence of the alignment page's fold rule, that nothing but low boldness folds and that a session folding against the rule records the override. The tradition's own failure mode is a designer folding by taste and calling it frequency; the record's answer is that the criterion is a stored field and a departure from it is written down.

Facts: authority deferred until the author reads the sources; boldness moderate; persistence standing.
