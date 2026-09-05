---
question: Which parts of the delegation rule must be ratified, and which sizing is the AI's?
stage: review
facts:
  - name: answer
    options:
      - name: ratify-the-bounds-delegate-the-sizing
        source: review
        ref: "2026-09-05"
      - name: one-class-for-the-whole-rule
        source: commons.systems/disposition-graph/delegation
        ref: "2026-09-03"
    recommends: ratify-the-bounds-delegate-the-sizing
    boldness: moderate
    stands: ratify-the-bounds-delegate-the-sizing
    against: "The division is drawn by the party it benefits. Every clause the AI proposes to keep for itself is a clause about how much of a session's work runs on which model at which effort, which is the AI's own cost and the AI's own convenience, and the author is asked to ratify the bounds that constrain the AI while delegating the sizing that pays it. A single ruling on the parent node has the merit that the author sees the whole rule at once and can refuse the sizing along with the bounds; two rulings let the sizing drift out of the author's sight one right-sizing at a time, which is the drift the delegation is supposed to make cheap."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
form: rule
under:
  - commons.systems/disposition-graph/delegation
depends:
  - commons.systems/disposition-graph/class-recommendation
---
## Disposition

Minted on 2026-09-05 by the second clean-context reading of the `delegation`
node, which found that the fact cannot express the division the author's own
words ask for. The reading's words:

> Beside that, the one ruling on the authority fact covers both the
> capture-shaped bounds, where ratified is plainly right, and the sizing of
> units, models and effort, which the author's own quoted words hand to the AI
> twice ("appropriate" is open question; right-sized models and effort "when it
> would result in token efficiency"), so the author cannot delegate the sizing
> without denying the bounds.

The record's own rule is that a decision the author would rule on separately,
and which is not one of the four facts, is a question, and a question is a node
(`dialogue`, `aspects-are-nodes`). The authority fact carries three options and
one ruling, so the division is not an option on `delegation` and is asked here.

## Answer

The bounds must be ratified and the sizing is the AI's.

The bounds are the clauses whose violation changes the record from outside the
dialogue: a subagent never runs state-changing version control, never edits a
node or the record's scaffolding, writes only the files its brief names, and
works only in the worktree it was given; every investigation whose context is
verbose is a unit whatever its size; the subagent reports a conclusion and the
main thread never reads the context; and the reconciliation session is bound
toward the record as `work-loop` bounds it. Those are capture-shaped in the
sense `class-recommendation` gives the word, and a ruling of ratified on
`delegation` reaches them.

The sizing is what the author's words of 2026-09-03 and their grant of
2026-09-04 already hand to the AI: which model each kind of work runs on, what
effort a brief states, and where the line between a lookup and a unit falls in a
particular case. The AI moves those on its own judgment, records what it moved
and why on the node, and does not return to the author for each one.

The division is drawn by what a wrong answer costs, not by which clause is
older: a wrong bound is paid in a record written outside the dialogue and is not
paid back, and a wrong sizing is paid in tokens and is paid back the next time
the AI reads its own measurement.

## Rationale

The author gave the sizing away twice and never gave the bounds away once.
On 2026-09-03, on `work-loop`: implementation is delegated, "each bite type gets
a skill with 'appropriate' recursive subagents ('appropriate' is open
question)". On 2026-09-04, on `viable-options`: "bootstrap authority granted -
delegate to subagents with righ-sized models and effort level (opus, sonnet)
when it would result in token efficiency". Both sentences are about sizing, and
both say the AI decides. Nothing the author has said hands over the four bounds,
and their one disposition on this subject, of 2026-09-03, is a reason for
delegating verbose work and not a licence to widen what a subagent may write.

`class-recommendation` supplies the test and this node applies it clause by
clause rather than to the rule as a whole, which is what the parent's single
authority fact cannot do. The consequence for the parent is that a ruling of
ratified there is read as reaching the bounds, and this node is what says so; the
alternative is that the author must refuse the whole rule to keep the sizing, or
ratify the whole rule and be asked again about every model choice.

The cost of the division is a second ruling and a boundary that has to be read
before a clause is moved. A clause the AI cannot place on one side is placed on
the ratified side and the question is asked, which is the `class-recommendation`
escalation applied to this node's own boundary.

## Facts

### answer

`ratify-the-bounds-delegate-the-sizing` is recommended at moderate boldness.
The two author quotations are exact and they are about sizing, so the delegated
half rests on the author's words; the enumeration of which clauses are bounds is
the AI's reading of `class-recommendation`'s three limbs and rests on no words
of the author's, which is what keeps the boldness off low. Not high, because the
capture-shaped half of the answer is the half the author has never spoken to and
the reading's case against is on the fact.

#### one-class-for-the-whole-rule

One ruling on `delegation`'s authority fact governs the rule entire, as it does
today: the author ratifies all of it or delegates all of it, and the sizing
follows whichever they choose. It keeps the record simpler by one node and puts
the whole rule in front of the author at one moment, which is the merit the case
against this node's answer names. It costs the author the thing their own words
asked for, since ratifying the bounds under it means being asked again about
every model and every effort level, and delegating the sizing under it means
delegating the four bounds with them. It is the incumbent and it is kept viable
because the author may prefer one ruling to two.

### authority

Ratified, at low boldness. What this node decides is how much of a global-tier
rule reaches the author at all, and the party that would otherwise decide it is
the party whose work the ratified half constrains, which is the capture limb of
`class-recommendation`'s test read on this node itself. Low boldness because
that reading is the record's own rule applied to its own case and the answer
does not turn on a judgment of the AI's beyond it.

## Account

### Minted, 2026-09-05

By the second clean-context reading of `delegation`, whose finding is quoted
under `## Disposition` and whose counter-argument this node answers. No option
is moved off the parent: the parent's authority fact keeps its three options and
its recommendation of ratified, and its `against` now cites this node rather
than telling the author they may ask for a division the record does not carry.
No ruling and no class is written: this node stands unanswered at the review
stage with its own reading owed.
