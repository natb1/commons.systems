---
question: What class does the AI recommend on a node's authority fact?
stage: ruling
facts:
  - name: answer
    options:
      - name: escalate-toward-ratified
        source: commons.systems/disposition-graph/recording
        ref: "2026-09-04"
      - name: no-recommendation-on-the-authority-fact
        source: review
        ref: "2026-09-05"
      - name: class-follows-the-authors-words
        source: review
        ref: "2026-09-05"
      - name: form-decides-the-default
        source: review
        ref: "2026-09-05"
      - name: test-without-the-written-reading
        source: review
        ref: "2026-09-05"
    recommends: escalate-toward-ratified
    boldness: high
    stands: escalate-toward-ratified
    against: "The test decides which questions reach the author at all, and the party applying it is the party whose work a ratification would slow. Expensive, irreversible and capture-shaped are the AI's own reading of each node, applied on twenty of the record's 129 authority facts, counted by the three terms in a node's `### authority` prose, with no instrument behind it and no record of the reading anywhere but the node's authority-fact prose, so a systematic tilt toward delegated would be invisible in exactly the way the test exists to prevent."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
review:
  verdict: forward
  strength: moderate
  date: 2026-09-05
  of: 5d924981999cd48668b2d71e8a6287b31a766fbd
  commit: a85f29250ccfcc8a10192dc507a0f1a17de6c2c3
  against: "Three of the previous reading's five findings were findings about `.claude/rules/class-recommendation.md`, the text every session loads, and the amendment answers all three in the node while leaving the projection exactly as that reading found it: the file still says \"escalates toward ratified\", still carries the citation loop, and still states as the ground of a sentence in doctrine the general census rule that `authority` deliberately holds unruled as `no-census-in-a-standing-answer`. So on the day the author is asked to rule, the defect the amendment's own account calls \"the one that changes what a session does\" is still in front of every session, and the amendment's claim that those clauses now sit outside \"a text projected verbatim into `.claude/rules/`\" is true of the node and false of the file. Against that: the fix is a regeneration and not a redrawing. The answer as amended is the right text on all five findings, the two things the amendment adds of its own -- the rationale paragraph and the fifth option -- check out against the record, and what is owed is publication, which is why this is a finding and not a kickback."
form: rule
tier: global
under:
  - commons.systems/disposition-graph/authority
depends:
  - commons.systems/disposition-graph/authority#escalate-toward-ratified
defines:
  - term: expensive
    gloss: "Of a wrong answer: that its cost is paid in work the record cannot take back cheaply."
  - term: irreversible
    gloss: "Of a wrong answer: that its cost is not paid back at all, as with a deletion, a swap, or a landing that other work is built on."
  - term: capture-shaped
    gloss: "Of a decision: that the party which would set the answer is the party the answer is meant to check."
---
## Answer

The class the AI recommends on a node's authority fact is ratified where being
wrong is expensive, irreversible, or capture-shaped, and is delegated or
deferred otherwise; what it recommends is a recommendation and confers nothing.

Expensive means the cost of a wrong answer is paid in work the record cannot
take back cheaply. Irreversible means it is not paid back at all: a deletion, a
swap, a landing that other work is built on. Capture-shaped means the party that
would set the answer is the party the answer is meant to check.
Where none of the three holds, the recommendation is delegated where the author
has said they do not want to be asked again about that class of decision, and
deferred otherwise.

The reading that applies the test is written on the node, in the `### authority`
subsection, which says which of the three limbs it found and why; a class
recommended with no such reading behind it is a recommendation the reviewer may
find unsupported. The requirement binds from this node's ruling and not before:
the authority facts already recorded without such a reading are a reconciliation
item on this node, and not a defect the reviewer reports on each of them. The
back-fill is most of the record and is owed rather than assumed; the measure, the
criterion it was taken on and the commit it was taken at are in this node's
account.

## Rationale

The test was carried by `.claude/skills/align/SKILL.md` alone until 2026-09-04,
a declared shim, while the authority fact of every node whose escalation rests on
it cited it as the record's own; the `recording` node's reading found the
citation empty, and it was recorded as an option on `authority` and absorbed into
that node's answer on 2026-09-05. It left the same day, because a rule that
survives the recording, is cited across the record, and is read by sessions that
never saw it asked is a question and not a clause, which is the survival and
scope test the `probe-or-node` node states, and which minted
`what-acts-during-bootstrap` from the same answer one paragraph away.

It is a rule and not a heuristic because it decides what reaches the author, and
the `session-context` node holds that what binds every session is projected as a
rule. What it does not decide is the class itself: the author rules, and this
test only says what the AI is to recommend and what it must show for the
recommendation.

Two things the answer used to carry stand here instead, because this node's
answer is projected verbatim into `.claude/rules/` and read by every session, and
neither of them should bind from there. The first is the reason the measure lives
in the account: a count written into a standing answer is doctrine that goes
stale the day the record next changes, with no instrument that would notice, and
the general rule of which that is an instance is recorded as the option
`no-census-in-a-standing-answer` on `authority`, sourced here, where the author
can rule on it rather than meet it as the ground of a sentence in doctrine. The
second is the two nodes whose authority facts name the capture limb,
`review-cost` and `clean-context-review`: they are examples and not the
definition, the clause above is complete without them, and `review-cost`'s own
`### authority` prose now cites this node's test for the term, so a citation in
the answer would put the two texts in a loop inside the rule every session
loads.

## Facts

### answer

`escalate-toward-ratified` is recommended at high boldness, which in this record
means low confidence. The three limbs are the AI's, promoted from a shim and
supported by no words of the author's; what is the author's is that they rule the
class, which this answer does not touch. High rather than moderate because the
only evidence that the rule works is prose the AI wrote, and because the guard
this answer offers against its own case against, that the reading be written on
the node, is met by twenty of the record's 129 authority facts on the criterion
the account states, fifty-six of which carry no `### authority` prose at all.
The case against is on the fact and the answer does not meet it. Four options are
live beside the recommendation: `no-recommendation-on-the-authority-fact`,
`class-follows-the-authors-words`, `form-decides-the-default`, which is what the
record measurably already does, and `test-without-the-written-reading`, which
keeps the three limbs and drops the guard the paragraph above concedes the record
does not yet meet.

#### no-recommendation-on-the-authority-fact

The AI recommends nothing on a node's authority fact and every class is the
author's from a blank, the fact carrying its three options with no mark. It
answers the case against exactly, since a test the checked party applies cannot
tilt if there is no test. It costs the author a judgment on every node of the
record, which is the attention the `attention` and `alignment-order` nodes exist
to spend carefully, and it leaves the alignment page with a decision it cannot
present in the form it presents every other, a recommendation and its boldness.
Raised by the clean-context reading of `authority` on 2026-09-05, as the remedy
its counter-argument points at.

#### class-follows-the-authors-words

The AI recommends ratified wherever no words of the author's grant a class, and
delegated or deferred only where the author's own recorded words, on the node or
on an ancestor, say so; the three limbs go. It answers the case against as
squarely as the bare refusal does, since no test of the AI's remains that could
tilt, and it keeps the recommendation and the boldness the alignment page
presents on every other fact, which is the one cost the refusal carries. What it
costs is that the default is the most expensive class in the record: every node
the author has not spoken to reaches them, which is the attention the `attention`
and `alignment-order` nodes exist to spend carefully. Raised by the clean-context
reading of 2026-09-05.

#### form-decides-the-default

The recommendation follows the node's form, a reading delegated and a rule or a
disposition ratified, and the three limbs act only to escalate a delegated
default. It is what the record measurably already does: of the 59 non-ratified
recommendations on authority facts, 58 sit on `form: reading` nodes and the 59th
on `ruling-transport`. It is the only candidate on this list an instrument could
check without reading prose, which is what the answer's own evidentiary clause
asks for and cannot get. What it costs is that form is a field the AI writes, so
the tilt the case against names moves from the reading to the form rather than
going away, and a node whose form is wrong gets the wrong default silently.
Raised by the clean-context reading of 2026-09-05, as the rule the record runs
in place of the one this node states.

#### test-without-the-written-reading

The three limbs stand and the evidentiary clause goes: the AI recommends ratified
where being wrong is expensive, irreversible or capture-shaped and delegated or
deferred otherwise, with nothing required of the `### authority` prose beyond the
reason every fact already carries. What it buys is that the author can rule for
the test without also ruling for a back-fill of 109 of the record's 129 authority
facts, which this node's own answer calls owed rather than assumed; as the fact
stands those are one choice with two costs, and the author cannot take the first
and decline the second. What it costs is the guard: a class recommended on no
stated limb then reads the same as one recommended on a limb a reader could
check, which is the invisible tilt the fact's case against names, and the
reviewer loses the locus at which it would catch one. Raised by the clean-context
reading of 2026-09-05, which held that the option cannot be ruled for as the fact
is drawn.

### authority

Ratified, at low boldness. What this decides is which questions reach the author
at all, and the party that would otherwise set it is the party the review exists
to check, which is the capture limb of the test itself; being wrong is not
visible in the record, since a class recommended too low simply means a question
the author never saw. Low boldness rests on that capture argument alone: the
test is not yet the record's rule, since whether it is the rule is the question
this node asks, and an earlier draft rested the boldness on the very citation the
`recording` node's reading of 2026-09-05 found empty.

## Account

### Minted, 2026-09-05

By the third clean-context reading of the `authority` node, which found the test
stated in that node's answer and measured its reach: nineteen node files carried
the phrase, it came from the alignment skill, a declared shim, and no words of
the author's speak to it. The reading's words: "Every limb of that test holds of
this clause with more force -- it survives the ruling, it is cited by eighteen
nodes, and it is read by every session that recommends a class -- and the two
clauses were treated oppositely one paragraph apart." The same reading recorded
that this is not a probe, since the AI can answer it. No `## Disposition` section
carries any of that, and one did until the reading of 2026-09-05: the alignment
page renders that section under "The author's words on this node", and the author
has never spoken to this node, so the panel would have attributed the AI's
reading to them. The rule and its option are moved from `authority`, which now
cites this one; the option `escalate-toward-ratified` stays on that node's answer
fact unmarked, its own `#### escalate-toward-ratified` subsection there recording
the move, and it will be shown as moved rather than passed over once
`viable-options#adopted-is-a-status` is ruled. The alternative
the reading's counter-argument points at is recorded here as
`no-recommendation-on-the-authority-fact`. No ruling and no class is written:
this node stands unanswered at the review stage with its own reading owed.

### Clean-context review, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Recommended at this reading: `escalate-toward-ratified`.

Findings:

- Frontmatter, `tier` absent (validation 5, and the executor test). The node carries `form: rule` and its own `## Rationale` argues "It is a rule and not a heuristic because it decides what reaches the author, and the `session-context` node holds that what binds every session is projected as a rule" -- but the frontmatter carries no `tier`, and `packages/disposition/project.mjs` line 177 writes a rule file only for a global-tier node (`if (node.tier !== "global") continue`). `.claude/rules/` holds exactly the six `tier: global` nodes (authority, delegation, evaluation, materialization, session-context, what-acts-during-bootstrap). Because the test left `authority`'s answer on 2026-09-05, `grep -n "capture-shaped\|expensive" .claude/rules/*.md` now returns nothing, and this node as drafted will not restore it. The sibling minted from the same answer one paragraph away, `what-acts-during-bootstrap`, carries `tier: global` and is projected. So on the day this answer is ruled the rule is read by no session -- which is precisely the limb the `## Disposition` gives as the ground for minting the node, "it is read by every session that recommends a class". Suggested edit: add `tier: global` to the frontmatter and regenerate `.claude/rules/`.
- `## Disposition` (validation 1, and the executor test). The section holds no words of the author's: it holds the third clean-context reading of `authority` and that reading's quotation. `packages/disposition/project.mjs` renders this section on the alignment page under the summaries "The author's words on this node" (line 1642) and "The author's words" (line 1680), so the author will be shown a panel headed with their own name carrying the AI's reading. The node is honest about the ground elsewhere -- `### answer` says the limbs are "supported by no words of the author's" -- but the panel the page leads with contradicts it. The sibling `delegation-bounds-and-sizing` minted the same day does the same thing, so this is the sitting's pattern and not a slip. Suggested edit: move the reading's account and quotation into `## Account` under `### Minted, 2026-09-05`, where it already partly stands, and leave `## Disposition` absent as on `bootstrap-exit-conditions`, so the page shows no author's-words panel on a node the author has never spoken to.
- `## Facts`, `### answer` (validation 3, a claim about the record that the record contradicts). "the record has nineteen applications of them with no reading recorded for most". Every application does record a reading. Of the eighteen nodes whose `### authority` subsection contains "capture-shaped" -- alignment-page, author-questions, authority, bootstrap-exit-conditions, clean-context-review, delegation, dialogue, frontier-consistency, probe-or-node, prose-and-structure, readings, recording, rejected, review-cost, review-skills, viable-options, what-acts-during-bootstrap, work-loop -- all eighteen name a limb and give a reason. The measure that is true is the other one: the record holds 129 authority facts, only 20 name a limb of the test, and 56 carry no `### authority` prose at all. This sentence is the stated reason for moderate rather than low boldness, so the boldness rests on a premise the record does not support. Suggested edit: "...and the record applies them on twenty of its 129 authority facts, fifty-six of which carry no reading at all."
- `## Answer`, third paragraph (validation 5, second limb: presumed materialized). "The reading that applies the test is written on the node, in the `### authority` subsection, which says which of the three limbs it found and why; a class recommended with no such reading behind it is a recommendation the reviewer may find unsupported." Measured today: 20 of 129 authority facts name a limb and 56 carry no `### authority` prose whatever. As written, ruling this answer makes 109 of the record's own class recommendations unsupported the moment it lands, and the node nowhere says the back-fill is owed. (The paragraph also borders on a second question -- what a class recommendation must show, as against what class is recommended -- though it is defensible as the evidentiary clause of the same rule.) Suggested edit: add "The requirement binds from this ruling; the authority facts already recorded without such a reading are a reconciliation item on this node and not a defect the reviewer reports on each."
- `## Rationale`, first paragraph (validation 3, a citation that does not hold). "...is a question and not a clause, which is the test the `node` node states". The `node` node states no such test: `grep -n "survives\|cited across\|read by sessions" disposition/disposition-graph/node.md` returns nothing, and what that node states is "If a text answers two questions, it is two nodes." The three-limb test is the survival test of `probe-or-node` together with its scope test, and `authority`'s own `#### escalate-toward-ratified` subsection attributes it exactly that way: "the survival and scope tests which minted `what-acts-during-bootstrap`". Suggested edit: "...which is the survival and scope test the `probe-or-node` node states, and which minted `what-acts-during-bootstrap` from the same answer one paragraph away."
- `## Account` (validation 3, a claim about the record that is not true today). "the option `escalate-toward-ratified` stays on `authority`'s answer fact, marked as moved". It carries no mark: the option in `disposition/disposition-graph/authority.md` has only `name`, `source` and `ref`, the encoding admits `status: passed` and nothing else, and `authority`'s own `### answer` reason says the option will be "shown as moved rather than passed over once the `adopted-is-a-status` option on the viable-options node is ruled". Suggested edit: "...stays on `authority`'s answer fact unmarked, its `#### escalate-toward-ratified` subsection there recording the move, and shown as moved once `viable-options#adopted-is-a-status` is ruled."
- Frontmatter, `depends` absent (validation 3, a dependency the record holds only in prose). `escalate-toward-ratified` is still a live, unpassed option on `authority`'s answer fact carrying this node's rule, so the author could rule for it there and for `no-recommendation-on-the-authority-fact` here and the record would stand holding both. Nothing in data ties the two rulings: this node's `depends` is empty and `authority` carries no `depends` key at all, although its `### answer` reason says "which `depends` names". Suggested edit here: `depends: [commons.systems/disposition-graph/authority#escalate-toward-ratified]`, the id-and-option form `review-skills` already uses (`frontier-consistency#split-survey-from-per-draft`). The matching gap on `authority` is that node's and is named here in prose only; the review proposes and never edits another node.
- Frontmatter, `defines` absent (validation 3, vocabulary the record already reads from here). The answer defines three terms -- expensive, irreversible, capture-shaped -- and another node already cites this one as their definer: `delegation-bounds-and-sizing` says its bounds "are capture-shaped in the sense `class-recommendation` gives the word". Forty-seven node files carry `defines`, and the encoding holds that a gloss is written once on the defining node and read from there, so with no `defines` entry no projection can link the term to the sentence that fixes it. Suggested edit: add three `{term, gloss}` entries carrying the answer's own definitions verbatim.
- `## Facts`, `### authority` (validation 3, a reason that is circular). "Low boldness because the escalation this node recommends for itself is the record's own rule read on its own terms." It is not the record's rule until this node is ruled -- that is the question the node asks -- and "the record's own test" is the very citation the `recording` node's reading found empty on 2026-09-05: "neither evaluation.md nor authority.md carries 'capture-shaped' or 'irreversible'... the class recommended is defensible on the grounds the prose gives; the citation is not." The capture reason given earlier in the same paragraph carries the recommendation on its own. Suggested edit: strike "is the record's own rule read on its own terms" and rest the low boldness on the capture argument the paragraph already makes, whatever the record's present practice.
- `## Facts`, `### answer` and the frontmatter's `boldness: moderate` (validation 3, the boldness). Moderate is understated on the draft's own account. The three limbs are the AI's wording, promoted from a shim, supported by no words of the author's; the guard the answer offers against its own case against is met by 20 of 129 authority facts; and one of the two reasons given for moderate rather than low is the measurement finding 3 corrects. Since high boldness is low confidence in this record, `high` is the honest mark for a rule of the AI's whose only evidence of working is prose the AI wrote. Suggested edit: `boldness: high` on the answer fact, with the reason restated on the corrected measure.
- Cross-references the move leaves pointing at the wrong locus, recorded in prose for the session and not applied here. The `## Account` says the rule "is moved from that node, which now cites this one", but seven other nodes still attribute the test elsewhere: `disposition/disposition-graph/review-cost.md:177`, "capture-shaped in the way the authority node's escalation test names" -- and since `authority` no longer states the test while this node's own `## Answer` cites `review-cost` as naming the shape, the citation is now a loop between the two; `disposition/disposition-graph/viable-options.md:444`, "the capture-shaped case the alignment skill escalates toward ratified", pointing at the shim the rationale says the test has left; and `decomposition.md:189`, `materialization.md:121`, `work-loop.md:192`, `frontier-consistency.md:223` and `review-model.md`, each calling it "the record's own test" or "the record's test" and naming no node -- `decomposition`'s own reading has already logged this as its finding 4, "calls the escalation 'the record's own test' without naming `class-recommendation`". Each would take the same edit: name `class-recommendation` as the node that states the test.

On the facts and what they recommend: The answer fact recommends `escalate-toward-ratified`, a listed option, with `stands` naming that same option and no `## Recommendation` fence, which is correct; the node has no review block, so no pin is stale, and `validate.mjs disposition` passes at 142 nodes. Boldness `moderate` is understated (findings 3 and 10): its stated ground is a measurement the record contradicts, and the limbs are the AI's own, promoted from a shim, with no words of the author's behind them. The authority fact recommends `ratified` at low boldness on the capture limb, which is right on its substance though its reason is circular (finding 9); no existence and no persistence fact, correctly, since no prune is proposed and the recommendation changes no shape -- but the frontmatter is missing `tier`, `defines` and `depends`, which findings 1, 8 and 7 name.

On the viability of the options: Both options on the answer fact are viable and neither dominates the other: `escalate-toward-ratified` keeps a recommendation and a boldness on the alignment page, and `no-recommendation-on-the-authority-fact` removes the tilt the case against names. Two viable options are missing. `class-follows-the-authors-words`: the AI recommends ratified wherever no words of the author's grant a class, and delegated or deferred only where the author's own recorded words on the node or on an ancestor say so; the three limbs go. It answers the case against as squarely as the bare refusal does, since no AI-applied test remains that could tilt, while keeping the recommendation and boldness the page presents on every other fact -- the one cost the refusal carries. `form-decides-the-default`: the recommendation follows the node's form, a reading delegated and a rule or a disposition ratified, and the three limbs act only to escalate a delegated default; this is what the record measurably already does, 58 of the 59 non-ratified authority recommendations sitting on `form: reading` nodes and the 59th on `ruling-transport`, and it is the only candidate an instrument could check without reading prose. Neither is dominated by the two listed. The authority fact's three options are the reserved vocabulary and are complete.

Strongest counter-argument (strong): The record measures this test and it does not do what the answer says it does. Of 129 authority facts only 20 name a limb of the three at all, and 56 carry no `### authority` reading whatever, so the guard this answer offers against its own case against -- that the reading be written on the node -- is absent from more than four fifths of the record on the day the author is asked to ratify it. Where the test is invoked, it is invoked almost only to justify escalation: 58 of the 59 non-ratified recommendations in the record sit on `form: reading` nodes and the 59th on `ruling-transport`, so on every substantive node but one the test has produced ratified. What actually sorts the record is the node's form, which the answer does not state, and the three limbs are the prose written after the sort. The risk is therefore the opposite of the one the fact's own `against` names: not an invisible tilt toward delegated, but a rule that ratifies nearly everything and so hands the author every question while appearing to filter, which spends by default the attention the `attention` and `alignment-order` nodes exist to spend carefully. The alternative the draft has not weighed is to state the rule the record runs -- form decides the default and the limbs escalate from it -- or to drop the AI's discretion and follow the author's words alone.

The session's reply: Forwarded at strong strength with eleven findings, every one validated at its locus on this thread. Nine accepted as written, two accepted with a correction to the reading's own supporting measurement.

tier: global is added and .claude/rules/ regenerated. Verified: packages/disposition/project.mjs writes a rule file only where node.tier === 'global', and the six files there are exactly the six global-tier nodes. Because the test left authority's answer on 2026-09-05, no rule file carried it at all, on the very day the node's own ground for existing is that it is read by every session that recommends a class.

The ## Disposition section held no words of the author's; it held the third clean-context reading of authority. Verified that the alignment page renders that section under 'The author's words on this node' and 'The author's words', so the panel the page leads with would have attributed the AI's reading to the author. The section is gone and its content stands in ## Account under the minting section, as on bootstrap-exit-conditions. The sibling delegation-bounds-and-sizing has the same defect and it is named there rather than fixed from here.

The measurement is corrected, and re-taken independently rather than copied. Of 129 authority facts in the record, twenty-one name a limb of the test in their ### authority prose and fifty-six carry no ### authority prose at all; eighteen carry the word capture-shaped, and the three that name a limb without it are decomposition, materialization and review-model. The reading counted twenty and the difference is those three; the figure written into the node is twenty-one, which I measured. The claim it replaces, 'nineteen applications with no reading recorded for most', was false twice over: every application that exists does record a reading, and the true scarcity is the other way round. (Twenty-one and its enumeration are wrong, and the re-reading of the same day caught them; the census as it stands is the one in the section below.)

The evidentiary clause now says the requirement binds from the ruling, and that the authority facts already recorded without a reading are a reconciliation item on this node rather than a defect the reviewer reports on each. Without it, ruling this answer would have made a hundred and eight of the record's own class recommendations unsupported the moment it landed.

The citation is corrected: the survival and scope tests are probe-or-node's, not the node node's, and authority's own subsection already attributed them that way. Verified that node.md states only 'If a text answers two questions, it is two nodes.'

The account's claim that the option on authority is 'marked as moved' is corrected: it carries no mark, the encoding admits only status: passed, and authority's own reason says it will be shown as moved once viable-options#adopted-is-a-status is ruled.

depends now names commons.systems/disposition-graph/authority#escalate-toward-ratified in the id-and-option form. One correction to the reading: authority does carry a depends key, naming viable-options#adopted-is-a-status and unanswered; what it lacks is an entry naming this node. The finding's substance stands, that nothing in data tied the two rulings and the author could have ruled both ways at once.

defines is added with the three terms and their glosses taken verbatim from the answer, since delegation-bounds-and-sizing already reads 'capture-shaped' from here.

The circular reason is struck from ### authority: the test is not the record's rule until this node is ruled, which is the question the node asks. The capture argument carries the recommendation on its own.

Boldness moves to high, which in this record is low confidence. The three limbs are the AI's wording promoted from a shim with no words of the author's behind them, the guard the answer offers against its own case against is met by a fifth of the record's 129 authority facts, and one of the two reasons given for moderate was the measurement finding 3 corrects.

Two viable options the reading names are added, since a candidate never listed is one the author cannot rule for: class-follows-the-authors-words and form-decides-the-default, both source review, ref 2026-09-05, with the reading's own prose. The second is the record's measured behaviour and the only candidate an instrument could check, and the counter-argument, that the rule as drafted ratifies nearly everything while appearing to filter, is answered by neither listed option; it is recorded and not answered here.

The seven stale cross-references of finding 11 are plain corrections of citation on other nodes and are made directly, each disclosed in that node's account: review-cost, viable-options, decomposition, materialization, work-loop, frontier-consistency and review-model each named the test without naming the node that states it, and review-cost's citation of authority had become a loop.

The recommendation moved, so the node returns to the review stage.

### Amended after the reading, 2026-09-05

Eleven findings, all validated at their loci on the alignment thread. Nine taken
as written, two taken with a correction to the reading's own supporting claim.

`tier: global` is added and `.claude/rules/` regenerated. `writeRules` in
`packages/disposition/project.mjs` writes a rule file only where a node's `tier`
is global, and the six files there are exactly the six global-tier nodes; so on
the day the test left the `authority` node's answer, no rule file carried it at
all, on a node whose stated ground for existing is that it is read by every
session that recommends a class.

The `## Disposition` section is gone. It held no words of the author's; it held
the reading that minted the node. The alignment page renders that section under
"The author's words on this node", so the panel the page leads with would have
attributed the AI's reading to the author, on a node the author has never spoken
to. Its content stands in the minting section above. The sibling
`delegation-bounds-and-sizing`, minted the same day, has the same defect; it is
named here and left for that node's own reading.

The measurement is corrected and re-taken on this thread rather than copied from
the reading. At graph commit 1d32a5aa the record holds 129 authority facts, of
which twenty-one name a limb of the test in their `### authority` prose and
fifty-six carry no such prose at all; eighteen carry the word capture-shaped, and
the three that name a limb without it are `decomposition`, `materialization` and
`review-model`. The reading counted twenty and the difference is those three; the
figure written into the node is the one measured here. The claim it replaces was
false twice over.

The evidentiary clause now says the requirement binds from this node's ruling and
that the back-fill is a reconciliation item here. Without it, ruling this answer
would have made a hundred and eight of the record's own class recommendations
unsupported the moment it landed.

The survival and scope tests are `probe-or-node`'s and not the `node` node's,
which states only that a text answering two questions is two nodes; the citation
is corrected, and the `authority` node's own subsection already attributed them
that way.

`depends` names `authority#escalate-toward-ratified`, so the record no longer
holds two rulings that could contradict each other with nothing in data tying
them. One correction to the reading: `authority` does carry a `depends` key,
naming `viable-options#adopted-is-a-status` and `unanswered`; what it lacks is an
entry naming this node, which is that node's to add.

`defines` carries the three terms with the answer's own glosses, since
`delegation-bounds-and-sizing` already reads capture-shaped from here.

The circular reason is struck from `### authority`: the test is not the record's
rule until this node is ruled, which is the question the node asks, and the
citation it rested on is the one the `recording` node's reading found empty. The
capture argument carries the low boldness on its own.

Boldness on the answer fact moves to high, which in this record is low
confidence. A rule of the AI's whose only evidence of working is prose the AI
wrote, whose guard is met by twenty-one of 129 facts, and one of whose two
reasons for moderate was the corrected measurement, is not a moderate-confidence
recommendation.

Two options the reading named are added, `class-follows-the-authors-words` and
`form-decides-the-default`, in its own prose. The counter-argument, that the rule
as drafted ratifies nearly everything while appearing to filter and so spends by
default the attention the record exists to spend carefully, is answered by
neither listed option; it is recorded and not answered, and the second option is
what the record measurably already does.

The seven stale cross-references are corrected directly, each disclosed in its
own node's account: `decomposition`, `materialization`, `work-loop`,
`frontier-consistency`, `review-cost`, `viable-options` and `review-model` each
named the escalation test without naming the node that states it, and
`review-cost`'s citation of `authority` had become a loop. Those are corrections
of citation and not of substance, but each moves that node's authority-fact pin,
which is the live option `pin-names-the-text-the-reader-read`.

The recommendation moved, so the node returns to the review stage.

### Clean-context re-reading, 2026-09-05

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `escalate-toward-ratified`.

Findings:

- Frontmatter, the answer fact's `against` (a contradiction the amendment itself creates: the diff leaves this field untouched while adding a sentence that retracts it). `### answer` now says "An earlier draft said the record had nineteen applications with no reading recorded for most, and that was false twice over", while the fact's own `against`, two lines above in the same frontmatter, still reads "Expensive, irreversible and capture-shaped are the AI's own reading of each node, applied nineteen times with no instrument behind it and no record of the reading anywhere but the node's authority-fact prose". The node now carries three counts of one thing in one frontmatter: nineteen in `facts[answer].against`, twenty in `review.against` ("Of 129 authority facts only 20 name a limb of the three at all"), and twenty-one in `## Answer` and in the `### answer` reason. The last reading had no occasion to see this, because the retraction is the amendment's own. The field is the record's store of the AI's case against its own recommendation and is printed in full to every clean-context reader; on the alignment page it is displaced only because `caseAgainst` in `packages/disposition/project.mjs` (line 1323) prefers `review.against` on the answer fact wherever a review block exists, so the retracted figure is hidden there by a review whose pin is already stale. Suggested edit: restate the `against` on whatever count the answer settles on, keeping the argument, which does not turn on the number: "...are the AI's own reading of each node, applied on twenty of the record's 129 authority facts with no instrument behind it and no record of the reading anywhere but the node's authority-fact prose...".
- `## Answer`, third paragraph, and `### answer` (validation 3, a claim about the record the amendment introduces). "At graph commit 1d32a5aa the record holds 129 authority facts, of which twenty-one name a limb and fifty-six carry no `### authority` prose at all". Two of the three figures reproduce exactly: over the 142 node files under `disposition/`, 129 carry an authority fact, 73 carry `### authority` prose and 56 carry none. Twenty-one does not reproduce on either reading of "name a limb". Counting the three terms literally in `### authority` prose gives twenty: the eighteen carrying "capture-shaped", plus `decomposition` ("a wrong answer here is expensive and compounds across sittings") and `materialization` ("is expensive and irreversible if wrong") -- which is the previous reading's figure. Counting a limb named in words gives twenty-two: those twenty, plus this node itself ("which is the capture limb of the test itself") and `delegation-bounds-and-sizing` ("which is the capture limb of `class-recommendation`'s test read on this node itself"). The account's stated ground for departing from twenty -- "eighteen carry the word capture-shaped, and the three that name a limb without it are `decomposition`, `materialization` and `review-model`" -- fails on `review-model`, whose `### authority` prose names no limb of the three at all: "a wrong answer compounds across sittings, which is the escalation test the `class-recommendation` node states", and compounding is not one of the three (it named none before the citation edit either: "which is the record's own test for escalating toward ratified"). Twenty-one is reachable only by counting this node and not `delegation-bounds-and-sizing`, which names the capture limb in almost the same words. Suggested edit: give the criterion with the count -- "twenty of the 129 name one of the three terms in their `### authority` prose" -- or drop the count as the next finding proposes.
- `## Answer`, third paragraph, the census inside the text that stands (placement, introduced by the amendment together with `tier: global`). The amendment writes a dated measurement of the record into the answer -- "At graph commit 1d32a5aa the record holds 129 authority facts, of which twenty-one name a limb and fifty-six carry no `### authority` prose at all, so the back-fill is most of the record and is owed rather than assumed" -- and the same amendment's `tier: global` projects that text verbatim into `.claude/rules/class-recommendation.md` (regenerated; the sentence is lines 23-26 of that file). So the count is now doctrine every session loads, it is wrong today (previous finding), and it goes wrong again the moment the back-fill the same sentence declares owed begins, with nothing in the record that would update it. The node this rule came from has already been told this once: the second clean-context reading recorded on `authority` struck the same shape -- "'thirteen nodes cite it as the record's own test'... Suggested edit: drop both numbers" -- citing that node's own frontier finding of 2026-09-03, "a count the author is asked to ratify be measured at the ruling rather than fixed in prose". Suggested edit: keep in `## Answer` only the binding clause the last reading asked for ("The requirement binds from this node's ruling and not before: the authority facts already recorded without such a reading are a reconciliation item on this node, and not a defect the reviewer reports on each of them"), and move the measure, with the criterion it was taken on and the commit it was taken at, into `## Account`, where the `### Amended after the reading, 2026-09-05` section already states it.

On the facts and what they recommend: The diff moves the answer fact only: two options added (`class-follows-the-authors-words` and `form-decides-the-default`, both source review, ref 2026-09-05, each with its `####` subsection) and boldness moderate to high, with `recommends` and `stands` both still `escalate-toward-ratified` and therefore no `## Recommendation` fence, correctly. The authority fact is untouched (ratified, low boldness) and only its circular reason is struck; a `review` block is added carrying the last reading's verdict and pin, stale by the move as expected, and the frontmatter gains `tier: global`, `depends: commons.systems/disposition-graph/authority#escalate-toward-ratified` and three `defines` entries, with `validate.mjs disposition` passing at 142 nodes and `.claude/rules/` now holding seven files for seven global-tier nodes. What the diff does not move is the answer fact's `against`, which still asserts the count the amendment retracts.

On the viability of the options: The diff removes no option and passes none over, and the two it adds are viable and dominated by nothing: `class-follows-the-authors-words` answers the fact's case against without the bare refusal's cost, and `form-decides-the-default`'s stated measure checks out exactly -- of the 59 non-ratified authority recommendations in the record, 58 sit on `form: reading` nodes and the 59th is `ruling-transport` -- which makes it a description of what the record already does and the only candidate an instrument could check. All four options on the answer fact are unmarked and live, and the authority fact's three are the reserved vocabulary and complete.

Strongest counter-argument (moderate): On the one charge the last reading called strong -- that the record measures this test and it does not do what the answer says it does -- the amendment moves the confidence mark, lists the two rivals the reading named, and then records that the counter-argument "is answered by neither listed option; it is recorded and not answered". The rule, its guard and its recommendation are unchanged, so what the author is asked to ratify is a rule the node says it cannot defend, at the boldness that says so; that is a legitimate state in this encoding and the honesty is real. But the boldness now rests entirely on a measurement, and an amendment whose principal answer to a measurement finding is a new measurement has to get the measurement right: twenty-one reproduces on no criterion, its supporting enumeration names a node that names no limb, and the count it retracts still stands in the fact's own `against`. Nine of the eleven findings are answered cleanly and verifiably; the one that mattered most to the author's ruling is answered with a second wrong number.

The session's reply: Kicked back to the maieutic stage at moderate strength with three findings, all
three validated at their loci on this thread and all three accepted. Nine of the
first reading's eleven findings the re-reading verifies as answered; what it
found is that the answer to the tenth, the measurement, was itself wrong.

The census is re-measured here and the reading's figures reproduce exactly. Over
the 142 node files, 129 carry an authority fact and 56 carry no `### authority`
prose at all. Of the 73 that carry prose, 18 use the word capture-shaped; two
more name a limb in the literal terms, `decomposition` ("expensive and compounds
across sittings") and `materialization` ("expensive and irreversible if wrong"),
which gives 20; and two more name a limb in words without the terms, this node
("the capture limb of the test itself") and `delegation-bounds-and-sizing` ("the
capture limb of `class-recommendation`'s test read on this node itself"), which
gives 22. Twenty-one is reachable on no criterion, and the enumeration that was
offered for it named `review-model`, whose `### authority` prose names no limb of
the three: it says a wrong answer "compounds across sittings", and compounding is
not one of the three. The reading is right on every part of this, including that
the correction it corrects was mine and not its own.

Finding 1, the retracted count still standing in the answer fact's `against`, is
accepted. The field is restated on twenty with the criterion beside it, and the
argument it makes is untouched, since that argument never turned on the number.
The reading is also right that `caseAgainst` in `packages/disposition/project.mjs`
prefers `review.against` on the answer fact wherever a review block exists, so the
alignment page was showing the reader's figure and hiding the stale one; that is
a display accident and not a fix, and it is why the field had to be corrected in
the record rather than left to the page.

Finding 2 is accepted. The count leaves the answer with finding 3, and where the
measure is now stated it carries its criterion, its two figures, and the commit it
was taken at.

Finding 3 is accepted and is the one that matters beyond this node. The amendment
put a dated census of the record into `## Answer` on the same day it made the node
global-tier, so the projector wrote that census verbatim into
`.claude/rules/class-recommendation.md`, where every session loads it as doctrine.
A count in a standing answer is wrong on the day it is taken or wrong soon after,
and this one is both: wrong today, and guaranteed to go wrong again by the very
back-fill the sentence declares owed. The record has already ruled this shape once,
on `authority`, under its own frontier finding of 2026-09-03 that a count the
author is asked to ratify be measured at the ruling rather than fixed in prose.
`## Answer` keeps the binding clause, which is what the first reading asked for,
and the measure moves to `## Account` with the criterion it was taken on and the
commit it was taken at. This is a rule for the record and not for this node alone,
and it is recorded as the option `no-census-in-a-standing-answer` on `authority`,
which owns the finding it descends from; it acts on nothing until the author rules.

The answer does not otherwise move. The recommendation is `escalate-toward-ratified`
at high boldness, which in this record is low confidence, the three rival options
stay live and unmarked, and the counter-argument the first reading called strong
stays recorded and unanswered, which is what the boldness says. This kickback is a
redrawing of the standing text, so a fresh reading of the answer is owed and the
delta of this one closes.

### The delta re-reading applied, 2026-09-05

The re-reading of the amendment verified nine of the first reading's eleven
findings as answered at their loci and kicked the node back to the maieutic
stage on the tenth: the amendment's answer to a measurement finding was a second
wrong measurement.

The census, re-taken here on the amended record at graph commit fda0c6ab and
stated with the criterion it is taken on, because a census without one is not a
measurement. Of the 142 node files, 129 carry an authority fact and 56 carry no
`### authority` prose at all. Of the 73 that carry prose, 18 use the word
capture-shaped; two more name a limb in the literal terms, `decomposition`
("expensive and compounds across sittings") and `materialization` ("expensive
and irreversible if wrong"), which makes twenty on the literal criterion; and two
more name a limb in words without using the terms, this node ("the capture limb
of the test itself") and `delegation-bounds-and-sizing` ("the capture limb of
`class-recommendation`'s test read on this node itself"), which makes twenty-two
counting those. Twenty-one is reachable on neither, and the enumeration offered
for it named `review-model`, whose `### authority` prose names no limb of the
three at all: it says a wrong answer "compounds across sittings", and compounding
is not one of them. Twenty is the figure the answer's guard is measured against,
because the guard asks that the reading name which limb it found, and the literal
terms are what a reader or an instrument can check.

The retracted count is struck from the answer fact's `against`, which had gone on
asserting nineteen while the `### answer` prose two screens away called nineteen
false. The field's argument is untouched, since it never turned on the number.
The reading is right that this was hidden on the alignment page rather than
absent: `caseAgainst` in `packages/disposition/project.mjs` prefers
`review.against` on the answer fact wherever a review block exists, so the page
showed the reader's figure and not the record's, which is a display accident and
no substitute for correcting the record.

The census leaves `## Answer` altogether, and that is the finding worth more than
this node. The same amendment that wrote a dated measurement into the standing
text made the node global-tier, so the projector copied the census verbatim into
`.claude/rules/class-recommendation.md`, where every session loads it as doctrine
-- a count that was wrong the day it was written and that the back-fill the same
sentence declares owed would falsify again, with nothing in the record to update
it. The record has already ruled this shape once, on `authority`, under its own
frontier finding of 2026-09-03 that a count the author is asked to ratify be
measured at the ruling rather than fixed in prose. `## Answer` keeps the binding
clause and says where the measure lives; the measure lives here. The general rule
is recorded as the option `no-census-in-a-standing-answer` on `authority`, which
owns the finding it descends from, and it acts on nothing until the author rules.

The answer itself does not move: `escalate-toward-ratified` at high boldness,
which in this record is low confidence, with the three rival options live and
unmarked and the first reading's counter-argument recorded and unanswered, which
is what the boldness says. The kickback redraws the standing text, so a fresh
reading of the answer is owed and the delta of this one closes.

### Clean-context review of the redrawn answer, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Recommended at this reading: `escalate-toward-ratified`.

Findings:

- `## Answer`, third paragraph, closing clause (validation 2: a rule adopted in text where the record has parked it as an unruled option). The paragraph now ends "...is measured in this node's account and not written into the text that stands, because a count in a standing answer is doctrine that goes stale where it is loaded, and this node's answer is projected into `.claude/rules/` and read by every session." That clause states a general rule about where a measurement of the record lives, and the record has deliberately kept exactly that rule out of any answer: `authority` carries the option `no-census-in-a-standing-answer`, sourced to this node, whose own subsection (disposition/disposition-graph/authority.md:206-208) says "A measurement of the record does not go in the text that stands: a count belongs in the node's account, with the criterion it was taken on and the commit it was taken at" and closes "Recorded as an option and not written into the answer, because it would bind every node the record has and the author has not been asked." Because `tier: global` projects this answer verbatim (verified: the clause stands in `.claude/rules/class-recommendation.md`), the rule the option withholds is read by every session anyway, as the ground of a sentence in doctrine, while the option that states it acts on nothing. The clause also fixes an implementation fact -- that this node is global-tier and projected -- inside the very text that projection copies, so a change of tier falsifies the answer. Suggested edit: end the paragraph "...The back-fill is most of the record and is owed rather than assumed; the measure, the criterion it was taken on and the commit it was taken at are in this node's account." and move the "because a count in a standing answer..." clause to `## Rationale`, where the reason for the placement belongs and where it binds nothing.
- `## Answer`, first sentence (validation 3, the executor test on a rule every session loads). "The class the AI recommends on a node's authority fact escalates toward ratified where being wrong is expensive, irreversible, or capture-shaped, and is delegated or deferred otherwise." The negative branch names its values exactly two paragraphs later -- "the recommendation is delegated where the author has said they do not want to be asked again about that class of decision, and deferred otherwise" -- while the positive branch names only a direction. With three classes on the fact, "escalates toward ratified" is readable as one step up rather than as the value `ratified`: an executor whose default is deferred could take it to mean delegated, and this text is `.claude/rules/class-recommendation.md`, loaded by every session that recommends a class. The record's own practice is the value and not the direction (measured today: of the 113 authority facts carrying a recommendation, 54 recommend `ratified`, 58 `delegated` and 1 `deferred`). Suggested edit: "The class the AI recommends on a node's authority fact is ratified where being wrong is expensive, irreversible, or capture-shaped, and delegated or deferred otherwise", keeping the word escalation for `## Rationale`.
- `## Facts`, `### answer` (viability: an option the author cannot rule for). All four listed options keep or discard the test and its evidentiary clause together, so the author cannot ratify the three limbs while declining the requirement that every authority fact carry a written reading -- which is the requirement the same answer says the record fails on 109 of its 129 authority facts and whose back-fill it calls "most of the record and ... owed rather than assumed". Those are two decisions with different costs, and on this fact they are one choice. Missing option, `test-without-the-written-reading`, source review, ref 2026-09-05, with the prose given in the `viability` field. If the author would rather rule the two separately, with a class of their own on each, the evidentiary clause is a node of its own beneath this one ("What must a class recommendation show?"), carrying the clause as its first option; the review proposes and neither mints nor splits, so this is recorded here in prose for the session.
- `## Answer`, second paragraph, last clause (validation 3, a citation that now points back at this node). "Capture-shaped means the party that would set the answer is the party the answer is meant to check, which is the shape the `review-cost` and `clean-context-review` nodes' authority facts name." The claim is true today -- verified at disposition/disposition-graph/review-cost.md:204 and disposition/disposition-graph/clean-context-review.md:232 -- but `review-cost`'s prose, corrected by this sitting, now reads "capture-shaped in the way the `class-recommendation` node's escalation test names", so the two texts cite each other for one term. That is the loop the first reading found between `review-cost` and `authority`, reproduced one node over, and it is in the text `.claude/rules/` carries, where a definition every session loads is made to depend on what two other unanswered drafts happen to say. The preceding clause is already a complete definition and `defines: capture-shaped` carries the same gloss, so nothing is lost. Suggested edit: strike "which is the shape the `review-cost` and `clean-context-review` nodes' authority facts name" from `## Answer` and keep the two examples in `## Rationale`.
- `## Facts`, `### answer` (the reason carries the sitting's history). "An earlier draft said the record had nineteen applications with no reading recorded for most, and that was false twice over: every application that exists does record a reading, and the scarcity is that the applications are few." The retraction of a count in a draft the author never saw is the account's business, and `## Account` already carries it three times, in `### Clean-context review, 2026-09-05`, `### Amended after the reading, 2026-09-05` and `### The delta re-reading applied, 2026-09-05`; the fact's reason is what the alignment page shows the author as the ground of the recommendation, and it is pinned. In the same subsection, "Three alternatives are live beside the recommendation" uses the older word: the encoding's term, on `dialogue` and `viable-options`, is option. Suggested edit: strike the retraction sentence from the reason, leaving the corrected measure and the case against it supports, and read "Three options are live beside the recommendation".

On the facts and what they recommend: The answer fact recommends `escalate-toward-ratified` at high boldness, which in this record is low confidence, naming a listed option that is also `stands`, so there is correctly no `## Recommendation` fence; the authority fact recommends `ratified` at low boldness on the capture limb its own `### authority` prose names, and no existence or persistence fact is carried, rightly, since no prune is proposed and the recommendation changes no shape. High is the honest mark: the three limbs are the AI's, promoted from a shim declared on `growth`, with no words of the author's behind them, and I re-took the census independently -- 142 node files, 129 carrying an authority fact, 73 with `### authority` prose and 56 without, 20 naming a limb in the literal terms (22 if a limb named in words counts, the two extra being this node and `delegation-bounds-and-sizing`) -- so the answer's "twenty of the record's 129 authority facts ... fifty-six of which carry no `### authority` prose" reproduces exactly on the criterion the account states, and understating the guard's reach by two is the conservative direction and is disclosed. `node packages/disposition/validate.mjs disposition` passes at 142 nodes; the `review` block carries the previous kickback pinned at 04577246, stale by the redraw, which is why this reading was owed and not a defect of the draft.

On the viability of the options: All four options on the answer fact are live, unmarked and undominated: `escalate-toward-ratified` keeps a recommendation and a boldness on the page; `no-recommendation-on-the-authority-fact` removes the tilt the fact's own `against` names at the price of a judgment on every node; `class-follows-the-authors-words` removes it while keeping the recommendation, at the price of ratifying everything the author has not spoken to; and `form-decides-the-default` states what the record measurably does -- I reproduced its measure and it is sharper than the option claims: form predicts 112 of the 113 recommended classes, every `form: reading` node recommending delegated or deferred and every rule, assumption and target node recommending ratified, the one exception being `ruling-transport`. The authority fact's three options are the reserved vocabulary and are complete. One viable option is missing, `test-without-the-written-reading` (source review, 2026-09-05): the three limbs stand and the evidentiary clause goes, so the AI recommends ratified where being wrong is expensive, irreversible or capture-shaped and delegated or deferred otherwise, with nothing required of the `### authority` prose beyond the reason every fact already carries; it costs the guard, since a class recommended on no stated limb then reads the same as one recommended on a limb a reader could check, which is the tilt the fact's `against` names, and it buys the record out of a back-fill of 109 of its 129 authority facts that the answer itself calls owed and unassumed. Neither it nor the recommendation dominates the other, and as the fact stands the author cannot rule for the test while declining the burden.

Strongest counter-argument (strong): The record measures this test and the test is not what sorts the record. Of the 129 authority facts, 113 carry a recommendation, and the node's `form` predicts 112 of them: every `form: reading` node recommends delegated or deferred, and every rule, assumption and target node recommends ratified, the single exception being `ruling-transport`. So on the substantive nodes the three limbs have produced ratified without exception, and a rule that ratifies everything of consequence hands the author every question while appearing to filter, which spends by default the attention the `attention` and `alignment-order` nodes exist to spend carefully; the risk is the opposite of the invisible tilt toward delegated that the fact's own `against` names. The guard the answer offers against that case -- that the reading which applied the test be written on the node -- is met by 20 of the 129 facts on the criterion the account states, so on the day the author is asked to ratify it the guard is a promise about future back-fill and not a property of the record. The rival the answer lists and does not weigh, `form-decides-the-default`, states what the record already does, is the only candidate an instrument could check without reading prose, and would make the three limbs an escalation from a checkable default rather than the whole rule; the node concedes all of this, records the charge as unanswered and marks the recommendation high boldness, which is honest but is not an answer.

The session's reply: All five taken; the forward stands and the node is amended in place. (1) The clause adopting a general rule about where a measurement lives is struck from `## Answer` and its substance moved to `## Rationale`: the answer now says only that the measure, its criterion and its commit are in the account, which is a statement about this node and binds nothing. The reading is right that the record parks that rule as `no-census-in-a-standing-answer` on `authority`, sourced here and deliberately unwritten, and that a global-tier answer stating its ground puts the unruled rule into every session's context by the back door; it is right too that fixing the tier inside the text the tier projects makes a change of tier falsify the answer. (2) Taken: the positive branch now names its value, `is ratified where`, matching the negative branch two paragraphs down, and the word escalation is kept for `## Rationale` and for the option's name. The executor argument is the decisive one, since this text is loaded by every session that recommends a class. (3) The missing option is recorded on the answer fact as `test-without-the-written-reading`, source review, ref 2026-09-05, with its own `####`. The reading is right that the four options bundle two decisions with different costs, and that the author cannot today ratify the three limbs while declining a back-fill of 109 of 129 authority facts that the answer itself calls owed and unassumed. Recorded as an option and not recommended: the guard is what the fact's own case against asks for, and the AI does not move the recommendation onto the option that drops it. Not minted as a child node, because the review proposes and neither mints nor splits, and because an option is the instrument the record has for a choice the author may take. (4) Taken: the citation is struck from `## Answer`. Verified at `review-cost.md` `### authority`, whose prose this sitting corrected to read "capture-shaped in the way the `class-recommendation` node's escalation test names", so the two texts now cite each other for one term inside the rule every session loads; `clean-context-review.md` `### authority` names the shape without citing back. The preceding clause is a complete definition and `defines: capture-shaped` carries the same gloss, so nothing is lost; the two examples move to `## Rationale`. (5) Taken: the retraction of a count in a draft the author never saw is struck from the fact's reason, which is the ground the alignment page shows and is pinned; the account carries it three times already. `Three alternatives` reads `Three options`, and now `Four options`, the encoding's word. The counter-argument is recorded whole in the account and not answered here: the form measure reproduces on this thread at 129 authority facts, 113 with a recommendation, 54 ratified, 58 delegated, 1 deferred, and the charge that a test which ratifies everything of consequence spends by default the attention the record exists to spend carefully is exactly what `form-decides-the-default` is on the list to let the author rule for.

### The fresh reading applied, 2026-09-05

The redrawn answer's own reading, forward at strong counter-argument, five
findings, all taken and amended in place. Two of the five were the same error in
two places: the answer was carrying, as the ground of its own sentences, rules
and citations that belong outside a text projected verbatim into `.claude/rules/`.
The clause explaining why the census lives in the account stated a general rule
about every node in the record, which is precisely the rule `authority` holds
unruled as `no-census-in-a-standing-answer`, sourced here and deliberately not
written into an answer; stating its reason in doctrine puts it in every session's
context by the back door, and fixing this node's tier inside the text the tier
projects would have made a change of tier falsify the answer. The citation of
`review-cost` and `clean-context-review` for the shape of the capture limb became
a loop the same day, when this sitting corrected `review-cost`'s `### authority`
to cite this node's test for the term; both are now examples in the rationale,
where the definition above them is complete and `defines: capture-shaped` carries
the same gloss.

The third finding is the one that changes what a session does. The answer's
positive branch said the class "escalates toward ratified" while its negative
branch two paragraphs down named its values outright, and with three classes on
the fact a direction is not a value: an executor whose default is deferred could
read one step up and land on delegated. The sentence now reads "is ratified
where", and the word escalation is kept for the rationale and for the option's
name.

The fourth is a viability finding and is recorded as an option rather than
answered. The four options all kept or dropped the three limbs and the
evidentiary clause together, so the author could not ratify the test while
declining a back-fill of 109 of 129 authority facts that the answer itself calls
owed and unassumed; `test-without-the-written-reading` separates them. It is not
recommended: the guard is what the fact's own case against asks for, and the AI
does not move its recommendation onto the option that drops it. It was recorded
as an option and not minted as a child node because an option is the instrument
the record has for a choice the author may take, and the choice here is whether
the written reading travels with the test. The evidentiary clause is a clause of
this rule and not a second question: a class recommended with nothing showing
which limb was found has not applied the test, so the clause states what
applying the rule produces, and the `node` node's rule bites where a text
answers a question the node's own question does not ask.

The fifth struck from the answer fact's reason the retraction of a count in a
draft the author never saw. The reason is what the alignment page shows as the
ground of the recommendation and it is pinned; the account carries the retraction
three times already, which is where a sitting's history belongs.

The counter-argument is recorded on the review block and is not answered. Its
measure reproduces on the main thread: 129 authority facts, 113 carrying a
recommendation, 54 ratified, 58 delegated, one deferred, and `form` predicting
112 of the 113 with `ruling-transport` the sole exception. The charge is that a
test which has produced ratified on every substantive node hands the author every
question while appearing to filter, spending by default the attention the
`attention` and `alignment-order` nodes exist to spend carefully. That is the
case `form-decides-the-default` is on the list for, and it is the author's to
rule, not the AI's to settle by amendment.

The amendment moves the standing text, so the node returns to the review stage
for the re-reading the cap budgets, which is the second and last reading this
answer gets.

### Clean-context re-reading, 2026-09-05

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `escalate-toward-ratified`.

Findings:

- `## Answer` as projected, and `.claude/rules/class-recommendation.md` (the amendment answers three findings in the node and leaves them standing in the text every session loads). Three of the previous reading's five findings -- the first sentence, the census-placement clause, and the `review-cost`/`clean-context-review` citation -- took their whole force from the fact that `tier: global` projects this answer verbatim into `.claude/rules/class-recommendation.md`, and that reading verified the defective clause there. The node is corrected; the projection is not. The file today still reads at line 4 "The class the AI recommends on a node's authority fact escalates toward ratified where being wrong is expensive, irreversible, or capture-shaped", still carries "which is the shape the `review-cost` and `clean-context-review` nodes' authority facts name", and still ends "because a count in a standing answer is doctrine that goes stale where it is loaded, and this node's answer is projected into `.claude/rules/` and read by every session". So the executor hazard the amendment's own account calls "the one that changes what a session does" is still in front of every session, and the general rule `authority` holds unruled as `no-census-in-a-standing-answer` is still doctrine by the back door. The file's notice line also reads "(unanswered; stage maieutic)" while the node carries `stage: review`, which dates the last regeneration to before the redraw. `writeRules` in `packages/disposition/project.mjs` confirms the file is a verbatim copy of `## Answer` and nothing else (line 177, `if (node.tier !== "global") continue`; line 184, content is the question, the notice and `node.answer`), so moving the two clauses into `## Rationale` is the right fix and needs only to be published. Suggested edit: regenerate before landing, `node packages/disposition/project.mjs disposition --rules .claude/rules`, and check that the notice reads "stage review" and the first sentence reads "is ratified where".
- `## Account`, `### The fresh reading applied, 2026-09-05`, fourth paragraph (a decision the amendment introduces on a ground that does not hold of the party that made it). "It was not minted as a child node, because the review proposes and neither mints nor splits." That the review may not mint is a limit on the reader, not a reason for the session. The previous reading's third finding named the child node explicitly -- "the evidentiary clause is a node of its own beneath this one (\"What must a class recommendation show?\"), carrying the clause as its first option" -- and closed "the review proposes and neither mints nor splits, so this is recorded here in prose for the session", that is, it handed the mint-or-not decision to the session precisely because it could not make it itself. The session's reply in the appended reading section gives a second and real ground, "because an option is the instrument the record has for a choice the author may take", but the amendment's own account section drops it and keeps only the reviewer's disability, so the record's stated reason for declining a proposal put to the session is a reason that was never the session's. The live question behind it is the one the earlier reading of this node already noticed, that the evidentiary paragraph "borders on a second question -- what a class recommendation must show, as against what class is recommended", against the `node` node's rule that a text answering two questions is two nodes. Suggested edit: strike "because the review proposes and neither mints nor splits" and rest the decision on the ground that carries it, adding one clause saying why the evidentiary requirement is a clause of this rule and not a second question -- for instance that it fixes what the recommendation this node governs must show and so has no object of its own.
- A finding about `commons.systems/disposition-graph/authority`, recorded in prose for the session and not applied here (a divergence the amendment creates between this answer and the option it stands on). The amendment changes the answer's operative verb from "escalates toward ratified" to "is ratified where", on the previous reading's executor argument. The parent's `#### escalate-toward-ratified` subsection -- the option this node's new `depends` entry names, and the option from which this rule was moved -- still states the same rule in the struck form, at disposition/disposition-graph/authority.md:203: "The class the AI recommends for a decision escalates toward ratified where being wrong is expensive, irreversible, or capture-shaped, and is delegated or deferred otherwise." Since `depends: commons.systems/disposition-graph/authority#escalate-toward-ratified` now ties the two rulings in data, the author would be ruling on one rule stated in two formulations that differ exactly where the previous reading found the ambiguity, and the parent's is the one still live on the fact the author reaches first. Suggested edit on `authority`: bring that sentence into line with the answer here, "is ratified where being wrong is expensive, irreversible, or capture-shaped, and is delegated or deferred otherwise", or replace it with a citation of `class-recommendation` for the rule's text.
- `## Account` (a question the amendment raises that needs the neighbourhood, recorded for the survey and not as a defect of this draft). The node now carries two account subsections with the identical heading `### Clean-context review, 2026-09-05` (lines 220 and 474), written for two different readings of two different texts on the same day, and one is cited by heading inside the other: the previous reading's fifth finding says the retraction stands "in `### Clean-context review, 2026-09-05`, `### Amended after the reading, 2026-09-05` and `### The delta re-reading applied, 2026-09-05`", and that citation no longer resolves to one section. The shape is the encoding's and not this node's -- an account subsection of a reading is `### Clean-context review, <date>` -- so the collision will recur wherever an answer is read twice in one day, which the two-reading cap makes ordinary. Recorded here for the survey or for the node that owns the account's shape; on this node the cheap edit, if the session wants one, is to distinguish the second heading by the text it read.

On the facts and what they recommend: The diff moves the answer fact only: a fifth option, `test-without-the-written-reading` (source review, ref 2026-09-05), is added with its own `####` subsection, while `recommends` and `stands` both remain `escalate-toward-ratified` and boldness remains high, so there is correctly no `## Recommendation` fence (verified: no `^## Recommendation` line in the file). The authority fact is untouched at ratified, low boldness, and the answer fact's `against` is unchanged and still consistent with the twenty-of-129 criterion the answer's account states. The `review` block is replaced by the previous reading's forward/strong verdict pinned at bba7da79 and commit 2982cb6f, stale by this amendment as expected and not a defect; `node packages/disposition/validate.mjs disposition` passes at 142 nodes.

On the viability of the options: The diff removes no option, passes none over and marks none: all five options on the answer fact are live and undominated. The one it adds is the one the previous reading named, and it separates the two decisions the fact had bundled, so the author can now take the three limbs without also taking the back-fill of 109 of 129 authority facts the answer itself calls owed rather than assumed; its prose reproduces the reading's own and its arithmetic checks against the census (129 facts, twenty meeting the guard). The authority fact's three options are the reserved vocabulary and are complete.

Strongest counter-argument (moderate): Three of the previous reading's five findings were findings about `.claude/rules/class-recommendation.md`, the text every session loads, and the amendment answers all three in the node while leaving the projection exactly as that reading found it: the file still says "escalates toward ratified", still carries the citation loop, and still states as the ground of a sentence in doctrine the general census rule that `authority` deliberately holds unruled as `no-census-in-a-standing-answer`. So on the day the author is asked to rule, the defect the amendment's own account calls "the one that changes what a session does" is still in front of every session, and the amendment's claim that those clauses now sit outside "a text projected verbatim into `.claude/rules/`" is true of the node and false of the file. Against that: the fix is a regeneration and not a redrawing. The answer as amended is the right text on all five findings, the two things the amendment adds of its own -- the rationale paragraph and the fifth option -- check out against the record, and what is owed is publication, which is why this is a finding and not a kickback.

The session's reply: All four findings taken. On 1, which is on the implementation ref and not a graph edit: `.claude/rules/class-recommendation.md` still carries the pre-amendment answer, so the three findings of the previous reading that took their force from `tier: global` are live at the file where they were measured, and its notice line still reads "stage maieutic". It is discharged by regenerating the rules, `node packages/disposition/project.mjs disposition --rules .claude/rules`, together with the same defect the day's re-reading of `delegation-bounds-and-sizing` found. On 2: the account's stated reason for recording an option rather than minting a node was the reviewer's disability and not the session's. It is struck; the session's own ground stands in its place, that an option is the instrument the record has for a choice the author may take; and a clause is added saying why the evidentiary requirement is a clause of this rule and not a second question. On 3, on `authority`: `#### escalate-toward-ratified` no longer states the rule in the formulation this node struck, and cites this node for its text, so the `depends` entry does not put one rule in two wordings in front of the author. Editing that subsection moves no pin, since `authority` recommends `authority-derived`. On 4: the two account sections headed identically are disambiguated here, the later named for its object, so the citation by heading inside the earlier reading resolves again. The general defect is the instrument's, in the heading `apply.mjs` writes, and it recurs wherever a redrawn answer gets a fresh reading on the day of the first; it is carried to the reconciliation of the review package and not settled by a graph edit. This was the second reading of this answer, the redraw having made a new one, and `review-cost`'s cap allows no third. The amendment moves the pin, so the node goes to the author with `review.of` naming the text the reader read: the deadlock recorded on `review-cost`'s live option `pin-names-the-text-the-reader-read`. The reader's own gap is carried with the others to `review-cost`: its first read of the brief was truncated at line 433 against the brief's discipline of at most 300 lines a read, and it recovered by paging.

### The re-reading applied, and the cap reached, 2026-09-05

Four findings, all taken; two are graph edits here, one is on `authority`, and
one is on the implementation ref.

The account's reason for recording `test-without-the-written-reading` as an
option rather than minting a node was the reviewer's disability, that the review
proposes and neither mints nor splits. That is a limit on the reader and not a
ground for the session, and the reading that raised the child node had handed
the decision to the session precisely because it could not make it itself. The
session's own ground stands in its place: an option is the instrument the record
has for a choice the author may take, and the choice here is whether the written
reading travels with the test. The paragraph now also says why the evidentiary
requirement is a clause of this rule and not a second question — a class
recommended with nothing showing which limb was found has not applied the test,
so the clause states what applying the rule produces.

On `authority`: `#### escalate-toward-ratified` still stated the rule in the
wording this node struck, so the author, whose ruling there and here `depends`
ties together, would have met one rule in two formulations. That subsection now
cites this node for the text. The edit moves no pin, since `authority`
recommends `authority-derived`.

The two account sections headed `### Clean-context review, 2026-09-05` are
disambiguated, the later named for its object, so the citation by heading inside
the earlier reading resolves again. The general defect is the instrument's, in
the heading `apply.mjs` writes, and it recurs wherever a redrawn answer takes a
fresh reading on the day its predecessor was read; it is carried to the
reconciliation of the review package and is not settled by a graph edit.

`.claude/rules/class-recommendation.md` still carries the pre-amendment answer,
so the three findings of the previous reading that took their force from
`tier: global` are unfixed at the file where they were measured, and the notice
line still reads "stage maieutic". The rules are regenerated on the
implementation ref, with the same defect the day's re-reading of
`delegation-bounds-and-sizing` found.

This was the second reading of this answer, the redraw having made a new one,
and `review-cost`'s cap allows no third. The amendment moves the pin, so the
node goes to the author with `review.of` naming the text the reader read: the
deadlock recorded on `review-cost`'s live option
`pin-names-the-text-the-reader-read`. The reader's own gap goes to `review-cost`
with the others: its first read of the brief was truncated at line 433 against
the brief's discipline of at most 300 lines a read, and it recovered by paging.
