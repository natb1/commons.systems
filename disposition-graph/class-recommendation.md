---
question: What class does the AI recommend on a node's authority fact?
stage: maieutic
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
  of: ef23296a96bb799b9cdd1d500652d172746aea3d
  commit: a85f29250ccfcc8a10192dc507a0f1a17de6c2c3
  against: "Three of the previous reading's five findings were findings about `.claude/rules/class-recommendation.md`, the text every session loads, and the amendment answers all three in the node while leaving the projection exactly as that reading found it: the file still says \"escalates toward ratified\", still carries the citation loop, and still states as the ground of a sentence in doctrine the general census rule that `authority` deliberately holds unruled as `no-census-in-a-standing-answer`. So on the day the author is asked to rule, the defect the amendment's own account calls \"the one that changes what a session does\" is still in front of every session, and the amendment's claim that those clauses now sit outside \"a text projected verbatim into `.claude/rules/`\" is true of the node and false of the file. Against that: the fix is a regeneration and not a redrawing. The answer as amended is the right text on all five findings, the two things the amendment adds of its own -- the rationale paragraph and the fifth option -- check out against the record, and what is owed is publication, which is why this is a finding and not a kickback."
  survey:
    date: 2026-09-05
    of: ef23296a96bb799b9cdd1d500652d172746aea3d
form: rule
tier: global
under:
  - commons.systems/disposition-graph/authority
depends:
  - commons.systems/disposition-graph/authority#escalate-toward-ratified
probes:
  - id: which-classes-of-decision-have-you-said
    asks: "Which classes of decision have you said you do not want to be asked about again?"
    why: "The answer's delegated limb turns on it: \"the recommendation is delegated where the author has said they do not want to be asked again about that class of decision, and deferred otherwise.\" The record holds no enumeration of what the author has said that about, and the answer names no locus for one; the phrase appears in the node's own text and in `authority`'s definition of delegated, neither of which points anywhere. So the limb is applied from the AI's recollection of the author's words, which is the one input the same answer's third paragraph forbids elsewhere by requiring a written reading on the node that a reviewer can check."
    discharges: "It settles which of the two default limbs applies wherever none of expensive, irreversible or capture-shaped holds, and so moves the authority-fact recommendation on every node the escalation test reaches — the back-fill this node's answer already owes. Without it the AI's recommendation on the authority fact is unfalsifiable at exactly the point the counter-argument says a systematic tilt would be invisible."
    source: review
    raised: "2026-09-05"
    fact: answer
defines:
  - term: expensive
    gloss: "Of a wrong answer: that its cost is paid in work the record cannot take back cheaply."
  - term: irreversible
    gloss: "Of a wrong answer: that its cost is not paid back at all, as with a deletion, a swap, or a landing that other work is built on."
  - term: capture-shaped
    gloss: "Of a decision: that the party which would set the answer is the party the answer is meant to check."
---

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

#### escalate-toward-ratified

The class the AI recommends on a node's authority fact is ratified where being
wrong is expensive, irreversible, or capture-shaped, and is delegated or
deferred otherwise; what it recommends is a recommendation and confers nothing.

**AI support.** The test was carried by `.claude/skills/align/SKILL.md` alone until 2026-09-04,
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

**AI divergence.** The test decides which questions reach the author at all, and the party applying it is the party whose work a ratification would slow. Expensive, irreversible and capture-shaped are the AI's own reading of each node, applied on twenty of the record's 129 authority facts, counted by the three terms in a node's `### authority` prose, with no instrument behind it and no record of the reading anywhere but the node's authority-fact prose, so a systematic tilt toward delegated would be invisible in exactly the way the test exists to prevent.

**Content.**

```markdown
---
question: What class does the AI recommend on a node's authority fact?
form: rule
tier: global
under:
  - commons.systems/disposition-graph/authority
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
```

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

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What class does the AI recommend on a node's authority fact?
form: rule
tier: global
under:
  - commons.systems/disposition-graph/authority
defines:
  - term: expensive
    gloss: "Of a wrong answer: that its cost is paid in work the record cannot take back cheaply."
  - term: irreversible
    gloss: "Of a wrong answer: that its cost is not paid back at all, as with a deletion, a swap, or a landing that other work is built on."
  - term: capture-shaped
    gloss: "Of a decision: that the party which would set the answer is the party the answer is meant to check."
---

## Answer

The AI recommends nothing on a node's authority fact and every class is the
author's from a blank, the fact carrying its three options with no mark. It
answers the case against exactly, since a test the checked party applies cannot
tilt if there is no test. It costs the author a judgment on every node of the
record, which is the attention the `attention` and `alignment-order` nodes exist
to spend carefully, and it leaves the alignment page with a decision it cannot
present in the form it presents every other, a recommendation and its boldness.
Raised by the clean-context reading of `authority` on 2026-09-05, as the remedy
its counter-argument points at.
```

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

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What class does the AI recommend on a node's authority fact?
form: rule
tier: global
under:
  - commons.systems/disposition-graph/authority
defines:
  - term: expensive
    gloss: "Of a wrong answer: that its cost is paid in work the record cannot take back cheaply."
  - term: irreversible
    gloss: "Of a wrong answer: that its cost is not paid back at all, as with a deletion, a swap, or a landing that other work is built on."
  - term: capture-shaped
    gloss: "Of a decision: that the party which would set the answer is the party the answer is meant to check."
---

## Answer

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
```

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

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What class does the AI recommend on a node's authority fact?
form: rule
tier: global
under:
  - commons.systems/disposition-graph/authority
defines:
  - term: expensive
    gloss: "Of a wrong answer: that its cost is paid in work the record cannot take back cheaply."
  - term: irreversible
    gloss: "Of a wrong answer: that its cost is not paid back at all, as with a deletion, a swap, or a landing that other work is built on."
  - term: capture-shaped
    gloss: "Of a decision: that the party which would set the answer is the party the answer is meant to check."
---

## Answer

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
```

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

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What class does the AI recommend on a node's authority fact?
form: rule
tier: global
under:
  - commons.systems/disposition-graph/authority
defines:
  - term: expensive
    gloss: "Of a wrong answer: that its cost is paid in work the record cannot take back cheaply."
  - term: irreversible
    gloss: "Of a wrong answer: that its cost is not paid back at all, as with a deletion, a swap, or a landing that other work is built on."
  - term: capture-shaped
    gloss: "Of a decision: that the party which would set the answer is the party the answer is meant to check."
---

## Answer

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
```

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

### Manifest

- Folded: Minted, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the reading, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The delta re-reading applied, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review of the redrawn answer, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The fresh reading applied, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34

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
and `review-cost`'s cap allows no third. The reply written into the reading's
own section said this amendment would move the pin and leave the node in the
deadlock `review-cost`'s option `pin-names-the-text-the-reader-read` records;
measured afterwards at 4262d092 with `deriveRecommendationHash`, it does not.
Every edit the reading earned fell outside the pinned text: two in this account,
one in a heading, and one on `authority`. So `review.of` names the
recommendation as it stands, and what keeps the node from being ready to rule is
the survey pin alone, which no node in the record yet carries. The reader's own
gap goes to `review-cost` with the others: its first read of the brief was truncated at line 433 against
the brief's discipline of at most 300 lines a read, and it recovered by paging.

### Frontier survey, 2026-09-05

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- The answer's delegated limb reads "the recommendation is delegated where the author has said they do not want to be asked again about that class of decision". The record contains no enumeration of what the author has said that about, and the answer names no locus for it, so the limb is satisfied by the AI's recollection of the author's words rather than by anything a reading can check — which is the opposite of the requirement the same answer imposes two paragraphs later, that "a class recommended with no such reading behind it is a recommendation the reviewer may find unsupported". A probe is raised on this node for it.

Strongest counter-argument (strong): The test decides which questions reach the author at all, and the party applying it is the party a ratification would slow — the capture shape the test itself names, applied to itself, and the answer does not say so. Boldness `high` is recorded, which on this record is low confidence, on a rule that governs every authority fact in the graph. And the escape hatch is unbounded: where none of the three limbs holds, the recommendation is delegated where the author has said they do not want to be asked again, and the record holds no list of what the author has said that about, so the AI supplies both the test and the fact the test turns on.

The session's reply: Taken in full. The test decides which questions reach the author, the party applying it is the party a ratification slows, and the answer does not name that shape when applying itself to itself; that is a gap in the `### authority` reading this node's own third paragraph requires. The escape hatch is the worse half: the delegated limb turns on what the author has said they do not want to be asked about again, the record holds no such list and names no locus for one, so the AI supplies the test and the fact the test turns on. The survey raises the probe that would close it, and the session does not answer the probe.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/class-recommendation stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `escalate-toward-ratified`; the `## Rationale` its `**AI support.**`; and `stands` left the answer fact. The record wrote no text of its own for `no-recommendation-on-the-authority-fact`, `class-follows-the-authors-words`, `form-decides-the-default`, `test-without-the-written-reading`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `5d924981999cd48668b2d71e8a6287b31a766fbd` is re-computed for the encoding as `ef23296a96bb799b9cdd1d500652d172746aea3d`; nothing it read changed. The survey's pin `5d924981999cd48668b2d71e8a6287b31a766fbd` is re-computed for the encoding as `ef23296a96bb799b9cdd1d500652d172746aea3d`; nothing it read changed.
