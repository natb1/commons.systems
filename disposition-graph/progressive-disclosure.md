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
        status: passed
        reason: "it says the record diverges from the tradition nowhere, and the tradition defers rarely used options where the page, on the author's words, defers none"
      - name: adopted-on-the-levels-diverged-on-the-fold
        source: review
        ref: "2026-09-05"
    recommends: adopted-on-the-levels-diverged-on-the-fold
    boldness: moderate
    against: "The tradition's criterion is frequency and importance of use across readers, which a page with one reader cannot measure, so the divergence recorded on the fold may be a divergence in name only: the tradition applied to one reader has nothing it can say to defer, and a reading that records a divergence where the tradition is silent overstates what the author decided against."
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: moderate
review:
  verdict: kickback
  strength: moderate
  date: 2026-09-05
  of: 6f23eb23ecb4fbab662f8b973ec0141e7eeeb505
  against: "The reading was redrawn to fit the author's words rather than re-read from the sources, and the fit is bought by restating the tradition. Nielsen's progressive disclosure is precisely a technique for deferring options, the 'advanced or rarely used features', to a second screen, and its criterion is frequency and importance of use; a page that shows every fact and every option at the first level has not adopted that, it has overruled it on the author's authority, which is a legitimate divergence the record should record as the author's. Saying instead that the tradition 'never asked for a decision to be removed from the ask' and that the record 'diverges from it nowhere' lends the tradition's name to a design it would not prescribe, on a node whose class is delegated because the author has not read the sources, so the misstatement would act with nobody checking it. The honest relation is adopted on the two-level structure and the never-lost rule, diverged on the fold, and the reading is stronger, not weaker, for saying so."
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

`adopted-on-the-levels-diverged-on-the-fold` is recommended because it records what the tradition holds and what the page does without lending the tradition's name to either side: the two levels of each option row and the never-lost rule are adopted, and the fold the tradition would make by frequency and importance of use is refused on the author's words of 2026-09-04, "List each fact without exceptions", a divergence the evaluation node's rule records as the author's decision, which the tradition cannot overrule. The clean-context reading of 2026-09-05 found the option beside it saying the record diverges from the tradition nowhere, when deferring the rarely used options is the tradition's own holding and not a gloss on it. Moderate boldness: the tradition's content is the AI's reading of the sources, which the author has not read, and the divergence rests on their words. The case against is on the fact.

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
by the author's words: "List each fact without exceptions.") Passed over on 2026-09-05: its sentence that the record diverges from the tradition nowhere lends the tradition's name to a design the tradition would not prescribe, since Nielsen defers the advanced or rarely used options to a second display and the page defers none.

#### adopted-on-the-levels-diverged-on-the-fold

The tradition is adopted on the two levels of each option row and on the rule that what is one step down is never lost, and the record diverges from it on the fold: the tradition would defer the rarely used options, and the author's words put every fact and every option at the first level. The divergence is recorded as the author's, in a second `bears` entry on the alignment page's option carrying `diverged`, and the reading no longer says what each level carries, which is the alignment page's question. Raised by the clean-context reading of 2026-09-05 as the option the reading found missing and not dominated.

### authority

Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the sources and the author has not read them here. The `deferred` option beside it is what the account asks for, the reading held until the author reads the sources, and it is the author's to take. Moderate boldness: the class follows the record's practice for readings, and the divergence this reading now records is on the author's own words.

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
  - fact: answer
    option: every-fact-every-option
    relation: diverged
---
## Answer

Supports the page's two levels and is overruled on the fold, by the author. The tradition holds three things: that an interface shows first the few things its reader uses most, by frequency and importance of use, and puts the rest one step away; that the advanced or rarely used options are deferred to that second display rather than shown at once; and that what is deferred stays discoverable and is never lost.

The alignment page adopts the first and the third on the object the tradition is about, the two levels of each option row: the first level is what the alignment page puts on the row and the second is what it opens beneath the row, one step down and never lost. What each level carries is that node's question and this reading does not fix it. On the second holding the page diverges, and the divergence is the author's: the tradition would defer the rarely used options to the second level, and the author's words of 2026-09-04, "List each fact without exceptions", put every fact and every option at the first level, because a decision put to the author is not a detail whose frequency of use could be measured, the page having one reader. The fold rule this reading was first cited for, which withheld the decisions the AI was surest of, was a default and not disclosure, and the tradition did not prescribe it either: it defers by use and never by the designer's confidence.

## Rationale

Recorded in the maieutic movement on the alignment page, 2026-09-04, as the tradition pass that node's evaluation requires; redrawn the same day when the author's words, "List each fact without exceptions", withdrew the split of decisions the first reading defended, whose three paragraphs argued a boldness-based fold the tradition had not prescribed; and redrawn on 2026-09-05 when its clean-context reading found the second drawing had lent the tradition's name to a page that folds nothing, so the divergence on the fold is recorded as the author's. Nielsen's chapter and article carry the three holdings; Carroll's minimalist instruction is the lineage of the first, the training-wheels interface that shows less so that the reader does more; Krug supplies the third, that what is one step away must be findable without thought. The author used the term in the disposition that opened the sitting, so the tradition entered in their words and not the AI's. Validated by the AI from its own knowledge of the sources: delegated, as every reading on the record recommends, with deferred beside it as the option the author takes if they want the reading held until they have read the sources.
```

## Account

Recorded 2026-09-04, superseded by the section of 2026-09-05 below. What this reading informed is the last sentence of the alignment page's fold rule, that nothing but low boldness folds and that a session folding against the rule records the override. The tradition's own failure mode is a designer folding by taste and calling it frequency; the record's answer is that the criterion is a stored field and a departure from it is written down.

Facts: authority deferred until the author reads the sources; boldness moderate; persistence standing.

### Clean-context review, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: kicked back to the maieutic stage.

Findings:

- Recommendation, Answer, last sentence of paragraph 2 (validation 4, readings): 'On that object the record adopts the tradition plainly and diverges from it nowhere', with paragraph 1's 'It governs the levels within a task and does not remove a decision from the ask: deferring detail is disclosure, and withholding a decision is a default.' The second claim is the record's gloss and not the tradition's holding. Nielsen's 'Progressive Disclosure' (NN/g, 2006) defers 'advanced or rarely used features' to a secondary display and asks the designer to show 'only a few of the most important options' first; Usability Engineering (1993) frames the split by frequency and importance of use, which is what the standing text said ('The tradition splits by what most readers need most of the time'). The tradition does defer options, and a page that puts every fact and every option at the first level, on the author's words 'List each fact without exceptions', departs from it on exactly that point; the fence records no divergence, so an executor reading the `bears` chip 'adopted' would take the tradition to endorse folding nothing. Under the evaluation rule an unrecorded conflict with a cited tradition is a frontier item, and validation 4 requires a divergence to be recorded as the author's. Suggested edit: keep 'adopted' for the two-level structure and the never-lost rule, and add one sentence recording the divergence as the author's: that the tradition would defer the rarely used options and the author's words of 2026-09-04 put every fact and every option at the first level; carry it as a second `bears` entry on `every-fact-every-option` with `relation: diverged` or as a clause in the Answer, and replace 'diverges from it nowhere' accordingly. Rewrite the second holding back to the tradition's own criterion (frequency and importance) rather than 'what the reader needs in order to act', which is the page's criterion put into the tradition's mouth.
- Recommendation, Answer, paragraph 2 (validation 1, words; validation 2, cross-reference): 'The first level is what the author needs to choose: the option's sentence, its status, what tradition says of it, and the case against the recommended one.' The alignment-page fence says the same today, but the author amended that paragraph on 2026-09-04 on `commons.systems/disposition-graph/what-an-option-row-carries`: 'For each option, list only a short text summary, a simple indicator if it is the recommended choice of the ai and with what boldness, and keep the chips that indicate support or divergence by tradition. Move AI reasoning (such as "passed over") to the details area for each option - not in a chip.' Whether the case against stays on the row is that node's open question, and this reading fixes the row's contents in its own Answer, so a ruling here would ratify a first-level enumeration the author is in the act of changing on the node that owns it. Suggested edit: hold only the two-level split in this reading and cite the alignment page for what each level carries ('the first level is what the alignment page puts on the row, and the second what it opens beneath it'), so the reading does not move every time the row does.
- Facts (validation 3, facts): the `## Facts` section carries a `### answer` subsection and no `### authority` subsection, while the authority fact recommends `delegated` at moderate boldness; the dialogue node requires 'one subsection per fact ... opening with the reason for its recommendation', and every sibling reading on the record carries the paragraph 'Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the sources and the author has not read them here. The `deferred` option beside it is what the account asks for ...' (scholastic-articulus, bentham-publicity, master-detail-selection). The class is also stated three ways on the node: the fact says delegated, the fence's Rationale says 'deferred until the author reads them, and delegated if the author declines to', and the Account says 'authority deferred until the author reads the sources'. The session's meant class is not readable from the node. Suggested edit: add the `### authority` subsection with the siblings' reason, and make the Rationale and the Account say delegated with deferred as the option the author takes if they want the reading held until they read the sources.
- Account (validation 3, facts): 'What this reading informed is the last sentence of the alignment page's fold rule, that nothing but low boldness folds and that a session folding against the rule records the override. The tradition's own failure mode is a designer folding by taste and calling it frequency; the record's answer is that the criterion is a stored field and a departure from it is written down.' That describes the fold rule the recommendation retracts ('the fold rule this reading was first cited for ... was a silent default and not disclosure at all'), so the account contradicts the fence it sits under and the author reads two accounts of what the reading informed. Suggested edit: replace it with the current object, that the reading informs the two-level drill-down of each option row on the alignment page and the never-lost rule, and note that the boldness fold it first informed was withdrawn on the author's words of 2026-09-04.
- Recommendation, frontmatter `source` (validation 4): 'Carroll, The Nurnberg Funnel (1990), the minimalist instruction programme it descends from; Krug, Don't Make Me Think (2000)' are cited as sources and nothing in the Answer or Rationale draws a holding from either; a reader cannot check what the reading takes from them, and the boldness claim rests on 'the AI's reading of the sources' without saying which. Suggested edit: name what each contributes in one clause (Carroll for training-wheels minimalism as the lineage of the first holding, Krug for the never-lost discoverability of the second level), or drop them from `source`.
- Frontmatter `bears` against the fence (validation 3): the standing `bears` carries `three-column-ruling-screen: adopted` and the fence drops it, keeping only `every-fact-every-option: adopted`. The drop is consistent with the retraction, since the three-column screen is the page's shape and this reading now bears on the option row's levels; verified that `three-column-ruling-screen` is still cited by five other readings (pettit-non-domination, scholastic-articulus, master-detail-selection, bentham-publicity, montgomery-informed-consent), so nothing dangles. No edit needed; recorded so the author sees that a ruling here removes one tradition's chip from that option.
- Question against the fence (validation 1, question): the question is 'What does progressive disclosure say about which decisions the page asks and which it folds?' and the fence's answer is that it folds none; the answer still answers the question, but the question's premise, that some decisions fold, is one the author's words have withdrawn. No edit required; if the sitting rewords the question to the object the reading is now about, the option row's two levels, it should say so, since a reworded question is a new question on the node node's rule.

On the facts and what they recommend: The answer fact recommends `discloses-detail-not-decisions` at moderate boldness with `stands: standing` and a fence present, which is right in shape: the retraction is on the author's words of 2026-09-04 and the tradition's content is the AI's from sources the author has not read, so moderate rather than low. The authority fact recommends `delegated` at moderate with no reason in `## Facts`, while the Rationale and the Account say deferred, so the class the session means to present is not the one the node states consistently. No persistence or existence fact and no shim, which follows from the node's shape; the node has no `review` field, so this is its first reading and there is no pin to be stale.

On the viability of the options: Both listed options are viable: `standing` is the retracted divergence and the author may keep it, and `discloses-detail-not-decisions` is the recommendation. One viable option is missing and is not dominated: adoption on the two levels and the never-lost rule with a recorded divergence, the author's, on folding nothing, since the tradition defers rarely used options and the page defers none; it differs from the recommendation in the `bears` relation it records and in the sentence 'diverges from it nowhere', and it is what validation 4 asks the reading to record.

Strongest counter-argument (moderate): The reading was redrawn to fit the author's words rather than re-read from the sources, and the fit is bought by restating the tradition. Nielsen's progressive disclosure is precisely a technique for deferring options, the 'advanced or rarely used features', to a second screen, and its criterion is frequency and importance of use; a page that shows every fact and every option at the first level has not adopted that, it has overruled it on the author's authority, which is a legitimate divergence the record should record as the author's. Saying instead that the tradition 'never asked for a decision to be removed from the ask' and that the record 'diverges from it nowhere' lends the tradition's name to a design it would not prescribe, on a node whose class is delegated because the author has not read the sources, so the misstatement would act with nobody checking it. The honest relation is adopted on the two-level structure and the never-lost rule, diverged on the fold, and the reading is stronger, not weaker, for saying so.

The session's reply: Kickback taken and the maieutic work done on this thread. The reading is redrawn on the relation the counter-argument names: adopted on the two levels and the never-lost rule, diverged on the fold, the divergence recorded as the author's from their words of 2026-09-04, with a second bears entry on every-fact-every-option carrying diverged; the option that said the record diverges nowhere is marked passed with that reason, and the missing option the reading named is recorded and recommended. The reading no longer fixes what each level carries and cites the alignment page for it; the authority subsection is added with the reason every reading on the record gives, and the rationale and account say delegated with deferred beside it; the account's paragraph on the fold rule is dated and superseded; Carroll and Krug are given their holdings. The question is kept, since a reworded question is a new question on the node node's rule, and the account says so. One consequence is owed elsewhere: the alignment page's recommended text says this tradition never asked for a decision to be removed from the ask, and that sentence is recorded here as owed a correction when that node is next amended, its re-read being in flight.

### Redrawn after the kickback, 2026-09-05

The clean-context reading kicked the draft back to the maieutic stage with seven findings, all verified on this thread; the maieutic work was done here and the node returns to the review stage. The reading found the second drawing had lent the tradition's name to a page that folds nothing, since Nielsen's progressive disclosure defers the advanced or rarely used options to a second display by frequency and importance of use, and the page, on the author's words, defers none. The option the reading found missing is recorded and recommended: adopted on the two levels and the never-lost rule, diverged on the fold, the divergence the author's, carried as a second `bears` entry on the alignment page's option `every-fact-every-option` with `diverged`; the option that said the record diverges nowhere is marked passed. What this reading informs now is the two-level drill-down of each option row on the alignment page and the never-lost rule; the boldness fold it first informed was withdrawn on the author's words of 2026-09-04, and the paragraph above that describes it is history. The reading no longer says what each level carries, which is the alignment page's question and is in the author's hands on the node `what-an-option-row-carries`; the `### authority` subsection is added with the reason every reading on the record gives, and the rationale and this account say delegated with deferred beside it. Carroll and Krug are given their holdings in the rationale. The question is kept as it stands, since a reworded question is a new question on the node node's rule; its premise, that some decisions fold, is answered by the answer, that none do, on the author's words. The drop of the `bears` entry on `three-column-ruling-screen`, which the reading verified leaves nothing dangling, stands.

Owed elsewhere: the alignment page's recommended text says of this tradition that it "never asked for a decision to be removed from the ask", which this drawing corrects to a divergence the author made; that sentence is owed an amendment on the alignment page when that node is next amended, its re-read being in flight at this landing, and until then the two texts disagree on this reading's relation and this node's is the later.
