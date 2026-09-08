---
question: Which model runs the clean-context review's readings?
stage: ruling
facts:
  - name: answer
    options:
      - name: fable-for-both-readings
        source: author
        ref: "2026-09-04"
        supports:
          - words/2026-09-04/37
      - name: conditional-by-boldness
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: "the author's words of 2026-09-04 put both readings on fable, and it read the reviewer's strength off boldness, which the drafter sets"
      - name: strongest-on-the-survey
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: "the author's words put both readings on fable, and the detection differential it prices the draft's reading on is unmeasured"
      - name: chosen-for-difference
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: "the author's words put both readings on fable, and the difference four models of one lineage can buy is of capability and not the independence the tradition demonstrates"
      - name: fable-until-the-yield-is-measured
        source: ai
        ref: "2026-09-04"
      - name: fallback-when-the-model-is-unavailable
        source: author
        ref: "2026-09-05"
      - name: wait-for-the-named-model
        source: review
        ref: "2026-09-05"
      - name: alignment-main-thread-named
        source: review
        ref: "2026-09-05"
      - name: the-smaller-model-on-a-re-reading
        source: ai
        ref: "2026-09-07"
      - name: effort-graded-by-the-readings-object
        source: review
        ref: "2026-09-07"
      - name: the-larger-model-on-a-re-reading
        source: review
        ref: "2026-09-07"
      - name: the-measurement-re-taken-at-ca64407d
        source: review
        ref: "2026-09-07"
        supports:
          - words/2026-09-07/5
          - words/2026-09-07/6
          - words/2026-09-07/7
          - words/2026-09-07/8
    recommends: the-measurement-re-taken-at-ca64407d
    boldness: moderate
    against: "The clause spends the record's scarcest guarantee to buy its smallest saving. The re-reading is the last reader between an amendment and the author's ruling, and it is also the cheapest of the three readings by this node's own measurement, so the rule downgrades the reader exactly where a miss is least recoverable and saves least. The argument that its contract determines the answer holds for the first of its two questions and not the second, whether the amendment introduces anything the last reading had no chance to see, which is a fresh judgment of a text -- the fact's own reasoning concedes this, and the clause is recommended anyway. And the reply that what the weaker eye misses falls to the survey rests on a reading that, by the parent node's own rationale, no sitting has yet generated, so the fallback the clause leans on has never once run."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
    against: "The answer holds that the rule binds the role and that the model's name is a fact about the harness, so under it the AI decides when the harness's most capable model has changed and rewrites a ratified text with no interview and no ruling; that is the kind of unit the author's words on the viable-options node handed the AI, and this node otherwise takes it back. Ratified therefore buys the author less than it looks: the name that an executor actually launches moves without them, and what a ruling pins is a sentence about roles."
review:
  verdict: forward
  strength: weak
  date: 2026-09-07
  of: bd9725ce115b77475ba8154be04201ae36c6964a
  commit: d4ab02834a08930a67d9b5885708f3f23f7a9153
  against: "The new option's own 'AI support' text asserts that `review-skills`'s drift sentence carries the same figures and that 'the two nodes must move together or disagree,' naming this option as 'the half of that movement that belongs here' -- but this delta's scope excludes `review-skills` itself, so whether its matching half has actually landed is unverifiable from here. If it has not, the record corrects this node's sentence while a sibling keeps citing the stale, falsified measurement, which is the same shape of unverifiable cross-node claim the previous reading raised about `n-version-programming` and that the session then had to confirm on the main thread before closing."
  survey:
    date: 2026-09-07
    of: bd9725ce115b77475ba8154be04201ae36c6964a
    commit: edc5af91d942319c12174309e388a244de61fa52
    text:
      question: "3dfcd8cceb86a0d69691e6cdb2331103bb5f09ae56e31ea301c3c579796bddf5"
      answer: "aa389e4c5d8a002cf11a70d1abad0ddedd54d6ffb0d89edc474b81147911d0c9"
      options: "f0c66d36aa7b957d293e50da18d23456cbc5c94c9e4aa4699162ceb8f16f3c83"
      rivals: "537cfef30cb29af992d603efd7067dc789f75091e0d12157c119039469c6c1db"
      words: "a4ac82934694af59fd2d6f230d2b98b29a9859f29851d63873d6448f33585fa4"
    findings: []
    pairs:
      - with: "commons.systems/disposition-graph/appellate-review-en-banc"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/authority"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/brooks-surgical-team"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/class-recommendation"
        keys:
          - "term:expensive (defines: commons.systems/disposition-graph/class-recommendation)"
          - "term:irreversible (defines: commons.systems/disposition-graph/class-recommendation)"
      - with: "commons.systems/disposition-graph/clean-context-review"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
          - "words:words/2026-09-07/5"
          - "words:words/2026-09-07/6"
          - "words:words/2026-09-07/7"
          - "words:words/2026-09-07/8"
          - "cites"
          - "depends"
      - with: "commons.systems/disposition-graph/decomposition"
        keys:
          - "words:words/2026-09-07/5"
          - "words:words/2026-09-07/6"
          - "words:words/2026-09-07/7"
          - "words:words/2026-09-07/8"
          - "cites"
      - with: "commons.systems/disposition-graph/delegation"
        keys:
          - "term:main thread (defines: commons.systems/disposition-graph/delegation)"
          - "term:subagent (defines: commons.systems/disposition-graph/delegation)"
          - "term:unit (defines: commons.systems/disposition-graph/delegation)"
          - "cites"
      - with: "commons.systems/disposition-graph/dialogue"
        keys:
          - "term:alternative (defines: commons.systems/disposition-graph/dialogue)"
          - "term:answer (defines: commons.systems/disposition-graph/dialogue)"
          - "term:dialogue (defines: commons.systems/disposition-graph/dialogue)"
          - "term:draft (defines: commons.systems/disposition-graph/dialogue)"
          - "term:topology (defines: commons.systems/disposition-graph/dialogue)"
          - "term:fact (defines: commons.systems/disposition-graph/dialogue)"
          - "term:keep (defines: commons.systems/disposition-graph/dialogue)"
          - "term:recommendation (defines: commons.systems/disposition-graph/dialogue)"
          - "term:ruling (defines: commons.systems/disposition-graph/dialogue)"
          - "term:standing answer (defines: commons.systems/disposition-graph/dialogue)"
          - "cites"
      - with: "commons.systems/disposition-graph/evaluation"
        keys:
          - "term:adversarial review (defines: commons.systems/disposition-graph/evaluation)"
          - "term:greenfield (defines: commons.systems/disposition-graph/evaluation)"
      - with: "commons.systems/disposition-graph/frontier-consistency"
        keys:
          - "term:frontier survey (defines: commons.systems/disposition-graph/frontier-consistency)"
          - "words:words/2026-09-07/5"
          - "words:words/2026-09-07/6"
          - "words:words/2026-09-07/7"
          - "words:words/2026-09-07/8"
          - "parent:commons.systems/disposition-graph/clean-context-review"
          - "cites"
      - with: "commons.systems/disposition-graph/growth"
        keys:
          - "term:boldness (defines: commons.systems/disposition-graph/growth)"
          - "term:maieutic (defines: commons.systems/disposition-graph/growth)"
          - "term:periagogic (defines: commons.systems/disposition-graph/growth)"
          - "cites"
      - with: "commons.systems/disposition-graph/instruments"
        keys:
          - "term:assessment (defines: commons.systems/disposition-graph/instruments)"
          - "term:check (defines: commons.systems/disposition-graph/instruments)"
          - "term:evidence (defines: commons.systems/disposition-graph/instruments)"
          - "term:instrument (defines: commons.systems/disposition-graph/instruments)"
      - with: "commons.systems/disposition-graph/materialization"
        keys:
          - "term:greenfield ref (defines: commons.systems/disposition-graph/materialization)"
          - "cites"
      - with: "commons.systems/disposition-graph/model"
        keys:
          - "term:disposition (defines: commons.systems/disposition-graph/model)"
          - "term:node (defines: commons.systems/disposition-graph/model)"
      - with: "commons.systems/disposition-graph/n-version-programming"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/node"
        keys:
          - "term:answer (defines: commons.systems/disposition-graph/node)"
          - "term:form (defines: commons.systems/disposition-graph/node)"
          - "term:question (defines: commons.systems/disposition-graph/node)"
          - "term:rationale (defines: commons.systems/disposition-graph/node)"
      - with: "commons.systems/disposition-graph/projection"
        keys:
          - "term:projection (defines: commons.systems/disposition-graph/projection)"
      - with: "commons.systems/disposition-graph/promotor-fidei"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/quotes"
        keys:
          - "term:ledger (defines: commons.systems/disposition-graph/quotes)"
      - with: "commons.systems/disposition-graph/readings"
        keys:
          - "term:adopted (defines: commons.systems/disposition-graph/readings)"
          - "term:reading (defines: commons.systems/disposition-graph/readings)"
          - "term:tradition (defines: commons.systems/disposition-graph/readings)"
      - with: "commons.systems/disposition-graph/recording"
        keys:
          - "term:steelman (defines: commons.systems/disposition-graph/recording)"
          - "cites"
      - with: "commons.systems/disposition-graph/review"
        keys:
          - "term:review (defines: commons.systems/disposition-graph/review)"
      - with: "commons.systems/disposition-graph/review-cost"
        keys:
          - "term:neighbourhood (defines: commons.systems/disposition-graph/review-cost)"
          - "words:words/2026-09-07/5"
          - "words:words/2026-09-07/6"
          - "words:words/2026-09-07/7"
          - "words:words/2026-09-07/8"
          - "parent:commons.systems/disposition-graph/clean-context-review"
          - "cites"
      - with: "commons.systems/disposition-graph/review-skills"
        keys:
          - "parent:commons.systems/disposition-graph/clean-context-review"
          - "cites"
      - with: "commons.systems/disposition-graph/scholarly-peer-review"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/scope"
        keys:
          - "term:section (defines: commons.systems/disposition-graph/scope)"
      - with: "commons.systems/disposition-graph/segregation-of-duties"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/session-context"
        keys:
          - "term:rules (defines: commons.systems/disposition-graph/session-context)"
      - with: "commons.systems/disposition-graph/transience"
        keys:
          - "term:shim (defines: commons.systems/disposition-graph/transience)"
          - "term:standing (defines: commons.systems/disposition-graph/transience)"
          - "term:un-aligned disposition (defines: commons.systems/disposition-graph/transience)"
      - with: "commons.systems/disposition-graph/unanswered"
        keys:
          - "term:answered (defines: commons.systems/disposition-graph/unanswered)"
      - with: "commons.systems/disposition-graph/under"
        keys:
          - "term:ceiling (defines: commons.systems/disposition-graph/under)"
          - "term:context (defines: commons.systems/disposition-graph/under)"
          - "term:rank (defines: commons.systems/disposition-graph/under)"
          - "term:under (defines: commons.systems/disposition-graph/under)"
      - with: "commons.systems/disposition-graph/value-of-information"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/viable-options"
        keys:
          - "term:grant (defines: commons.systems/disposition-graph/viable-options)"
          - "term:option (defines: commons.systems/disposition-graph/viable-options)"
          - "term:viable (defines: commons.systems/disposition-graph/viable-options)"
      - with: "commons.systems/disposition-graph/what-acts-during-bootstrap"
        keys:
          - "term:bootstrap (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
          - "term:bootstrap authority (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
      - with: "commons.systems/disposition-graph/work-loop"
        keys:
          - "term:frontier (defines: commons.systems/disposition-graph/work-loop)"
          - "term:reconcile (defines: commons.systems/disposition-graph/work-loop)"
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
depends:
  - commons.systems/disposition-graph/clean-context-review#per-draft-and-survey
---

## Facts

### answer

`the-smaller-model-on-a-re-reading` is recommended: it is `fable-for-both-readings` with one clause added, and the argument for the two readings the author named is unchanged. The author's words of 2026-09-07 ask whether the model choice is right sized for the task, and the answer that was right on 2026-09-04 is silent on a reading that did not then exist: the author named the review of a draft and the survey, and the re-reading of an amendment was made by the `review-cost` node on 2026-09-05, so this clause narrows no rule the author gave and fills a gap the rule as written leaves open.

Why it is the one reading of the three that moves. The argument that puts the other two at the top of the range is that the party whose blind spots a reading hunts is the main thread, which runs on the most capable model at full effort, so a reader below it finds what the main thread already saw; that argument is about judging an answer whole. The re-reading is not given an answer to judge. It is given the amendment, the findings the amendment answers, and two questions to ask of them, and its brief tells it in terms not to re-run the validations of the first reading -- so what it looks for and where it looks are fixed by its contract, which is the kind of work the `delegation` node's rule puts on the smaller model -- that node's fixed name for a rank, and not a comparison between whichever two models are in play. The clause also buys the measurement this node's own answer says it forecloses: the instrument declares that it cannot price a weaker reader because every reading runs at the top, and under this clause every re-reading is a weaker reader on an object the stronger one has already read, which is the sample second reading the answer said it did not declare.

Moderate boldness. What rests on the author is the model of the two readings they named, unchanged, and their question of 2026-09-07 asking whether the sizing is right; what rests on the AI is that the re-reading is not among the readings their words of 2026-09-04 reach, that its object is contract-shaped, and the reading of the harness's ranks by the `delegation` node's words rather than by their names.

#### fable-for-both-readings

Both readings of the clean-context review, the review of a draft and the
survey, run on fable, the most capable model the harness offers and the one
the delegation node gives the main thread, at high effort, whenever either
runs during the dialogue, and the model is read from nothing on the node and
chosen by no session. The rule is this node's and is stated once; the
clean-context-review node and the decomposition node cite it for the model.
The author's words of 2026-09-04, quoted above.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Which model runs the clean-context review's readings?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
instrument:
  kind: assessment
  ref: the cost and the yield of each reading, measured per reading, the yield being the findings that changed a verdict, judged by the author against this rule
  note: "not yet materialized; no telemetry records a reading's cost, the yield is unmeasured, and the evidence to date is the briefs' sizes on disk and the session's report, in the rationale. What it measures is the price and the yield of fable readings, which can show a reading whose yield is nil at that price and never what a weaker reader would have found; the re-reading is that sample: it runs one model down on an object the stronger reader has already read, so what it finds and what it misses beside the first reading of the same node is the differential, and the instrument compares the two"
---
## Answer

On fable, both of them. The review of a draft and the survey each run on fable, the most capable model the harness offers and the one the delegation node gives the main thread, at high effort, whenever either runs during the dialogue, invoked by a sitting or directly; the model is read from nothing on the node, the draft, or the drafter, and is chosen by no session. What happens when that model cannot be reached is not answered here: it is open on the option `fallback-when-the-model-is-unavailable`, raised by the author's own words of 2026-09-05, and until the author rules there the substitute clauses the two review skills and the alignment skill carry are unsupported implementation by the materialization node's test, named as such rather than read into this rule. The effort is stated in each reading's brief, as the delegation node requires, and fixed by the skill. The rule is stated here and nowhere else: the clean-context-review node says how each reading is run and cites this node for its model; the decomposition node names the review of a draft among a sitting's units and cites this node the same way; the delegation node's rule that the model follows the kind of work is the genus of this one, which names the kind, a clean-context reading of what the main thread wrote or integrated, and fixes its model at the main thread's. The rule is the role's, and the role binds: when the harness's most capable model changes, the readings move with the main thread from that day, and fable, the author's word for it on 2026-09-04 and the harness's name for it, is a fact about the harness and not part of what this rule binds. That is the recording node's test applied and not asserted: what the rule binds is the role, so an executor under the corrected text launches whatever the harness's most capable model is that day, which is what it was already bound to do, and the name's correction changes nothing an executor does. What the AI may not do under that reading is decide for itself that the harness's most capable model has changed; the correction is a reading of the harness that belongs in the record beside the name, and a correction made without one is a move the author never saw.

This answer is materialized by the two review skills and the brief templates and fragments on the implementation ref, the three shims the review-skills node declares, and by the alignment skill that invokes them, the shim the growth node declares. What this answer binds is that each reading's launch names the model and the effort, that no file computes either and no brief argues either, and that the rule is cited and never restated; the sites that must satisfy it are the two review skills' launch steps and their sections on model and delegation, the bounds fragment, and the alignment skill's three statements of the rule, in place of the rule that sized a draft's reviewer to boldness, tier, and settling and put the survey on opus. Where a skill writes the model's name down rather than citing this node for it, only `.claude/skills/align-survey/SKILL.md` does today, naming fable at high effort; `.claude/skills/align-review/SKILL.md` names the model in the prompt at the launch and writes none in the file, which is the divergence the review-skills node measures. `brief.mjs` computes no model and prints none: `reviewerModel`, the `model` field of both briefs' results, and the tests that pin them are deleted, since a script that prints a constant it does not compute is the projection of nothing. The bounds fragment both briefs open with tells the reader that the model and the effort are fixed by this node and stated at the launch, and argues neither; the effort reaches the reader in the launch prompt and not in the brief, which the first paragraph's clause about the brief overstated. The alignment skill's three statements of the replaced rule, in its list of a sitting's units, its review step, and its section on model and delegation, cite this node for the model and the effort of both readings and name neither. In the graph, the sentence of the clean-context-review node's recommended text that sizes the reviewer's model, with the rationale sentence and the rejected fixed model that argued it, and the clause of the decomposition node's recommended text that restates it, with the rationale clause and the rejected fixed model there, are replaced by citations of this node.

What this costs, as a consequence and never a reason: every reading pays the top rate. Over the rule it replaces, the difference is the survey's reading and the review of a draft whose recommendation is at low boldness on a node that is not global-tier and settles nothing, each now on fable; every other draft's reading already ran there. What would lower the price of a reading is the brief it is handed and never the reader, and the `review-cost` node did that on 2026-09-05: the index that carried every standing answer whole is one line a node, and the briefs measured across the change fell by sixty to seventy percent. That is the lever this node declines to pull, and it has been pulled elsewhere.
```

#### conditional-by-boldness

The rule the record carried in the recommended texts of the
clean-context-review and decomposition nodes and in the review skill: a
draft's reviewer runs on a model never smaller than the drafter's, on fable
when the recommendation's boldness is not low, the node is global-tier, or a
ruling on it would settle other nodes, and on opus otherwise, the skill
reading that from the node; and the survey's reviewer runs on opus, which no
node stated. Its reasons were that a reader weaker than the writer finds what
the writer already saw and that the most capable model on every simple draft
is the cost the delegation node's rule exists to avoid. Passed over: the
author's words put both readings on fable; the writer whose blind spots the
reading hunts is the main thread and not the design unit, so the floor it
argued from is the main thread's model on every draft; and boldness is set
by the drafter, so the rule let the reviewed party select the strength of its
own reviewer. The scholarly-peer-review reading refuses its second half, a
formula that gives a bold draft a stronger reader and a modest one a weaker,
as a two-tier venue inside one record, and records that relation on no
option here: the reading says the entry on this option is owed only if the
author reads the tradition as the survey did, and that is the author's to
say.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Which model runs the clean-context review's readings?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
instrument:
  kind: assessment
  ref: the cost and the yield of each reading, measured per reading, the yield being the findings that changed a verdict, judged by the author against this rule
  note: "not yet materialized; no telemetry records a reading's cost, the yield is unmeasured, and the evidence to date is the briefs' sizes on disk and the session's report, in the rationale. What it measures is the price and the yield of fable readings, which can show a reading whose yield is nil at that price and never what a weaker reader would have found; the re-reading is that sample: it runs one model down on an object the stronger reader has already read, so what it finds and what it misses beside the first reading of the same node is the differential, and the instrument compares the two"
---
## Answer

The rule the record carried in the recommended texts of the
clean-context-review and decomposition nodes and in the review skill: a
draft's reviewer runs on a model never smaller than the drafter's, on fable
when the recommendation's boldness is not low, the node is global-tier, or a
ruling on it would settle other nodes, and on opus otherwise, the skill
reading that from the node; and the survey's reviewer runs on opus, which no
node stated. Its reasons were that a reader weaker than the writer finds what
the writer already saw and that the most capable model on every simple draft
is the cost the delegation node's rule exists to avoid. Passed over: the
author's words put both readings on fable; the writer whose blind spots the
reading hunts is the main thread and not the design unit, so the floor it
argued from is the main thread's model on every draft; and boldness is set
by the drafter, so the rule let the reviewed party select the strength of its
own reviewer. The scholarly-peer-review reading refuses its second half, a
formula that gives a bold draft a stronger reader and a modest one a weaker,
as a two-tier venue inside one record, and records that relation on no
option here: the reading says the entry on this option is owed only if the
author reads the tradition as the survey did, and that is the author's to
say.
```

#### strongest-on-the-survey

The steelman from the tradition survey: a model chosen per reading with its
direction fixed and no input from the drafter, the survey on the most capable
model, since a synthesis across the whole graph is where a stronger reader
finds what a weaker one cannot, and the review of a draft on the larger
model, since it re-checks a text the most capable model has just written at
full attention and a second pass by the same class of mind fails on
correlated inputs. Passed over: the author's words put both readings on
fable, and the detection differential it prices the draft's reading on is
unmeasured, which is the condition under which the strongest reader on every
reading is the allocation to make.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Which model runs the clean-context review's readings?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
instrument:
  kind: assessment
  ref: the cost and the yield of each reading, measured per reading, the yield being the findings that changed a verdict, judged by the author against this rule
  note: "not yet materialized; no telemetry records a reading's cost, the yield is unmeasured, and the evidence to date is the briefs' sizes on disk and the session's report, in the rationale. What it measures is the price and the yield of fable readings, which can show a reading whose yield is nil at that price and never what a weaker reader would have found; the re-reading is that sample: it runs one model down on an object the stronger reader has already read, so what it finds and what it misses beside the first reading of the same node is the differential, and the instrument compares the two"
---
## Answer

The steelman from the tradition survey: a model chosen per reading with its
direction fixed and no input from the drafter, the survey on the most capable
model, since a synthesis across the whole graph is where a stronger reader
finds what a weaker one cannot, and the review of a draft on the larger
model, since it re-checks a text the most capable model has just written at
full attention and a second pass by the same class of mind fails on
correlated inputs. Passed over: the author's words put both readings on
fable, and the detection differential it prices the draft's reading on is
unmeasured, which is the condition under which the strongest reader on every
reading is the allocation to make.
```

#### chosen-for-difference

A reviewer chosen for difference from the drafter rather than for rank over
it, so that the draft's reading and the survey do not fail on the same
inputs, from the tradition holding that layered defences work only where
their failure modes are uncorrelated and that independence is never assumed
from separate construction. Passed over: the author's words put both readings
on fable, and the four models the harness offers are one lineage, so the
difference a choice among them buys is of capability and is not the
independence the tradition demonstrates; the clean context already removes
the shared framing, and the brief is where any diversity a reading can have
would be bought.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Which model runs the clean-context review's readings?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
instrument:
  kind: assessment
  ref: the cost and the yield of each reading, measured per reading, the yield being the findings that changed a verdict, judged by the author against this rule
  note: "not yet materialized; no telemetry records a reading's cost, the yield is unmeasured, and the evidence to date is the briefs' sizes on disk and the session's report, in the rationale. What it measures is the price and the yield of fable readings, which can show a reading whose yield is nil at that price and never what a weaker reader would have found; the re-reading is that sample: it runs one model down on an object the stronger reader has already read, so what it finds and what it misses beside the first reading of the same node is the differential, and the instrument compares the two"
---
## Answer

A reviewer chosen for difference from the drafter rather than for rank over
it, so that the draft's reading and the survey do not fail on the same
inputs, from the tradition holding that layered defences work only where
their failure modes are uncorrelated and that independence is never assumed
from separate construction. Passed over: the author's words put both readings
on fable, and the four models the harness offers are one lineage, so the
difference a choice among them buys is of capability and is not the
independence the tradition demonstrates; the clean context already removes
the shared framing, and the brief is where any diversity a reading can have
would be bought.
```

#### fable-until-the-yield-is-measured

The author's rule with its own return written in: both readings on fable at
high effort until the cost and the yield of each reading, the yield being the
findings that changed a verdict, are measured per reading, and a per-reading
rule sized to that measurement thereafter, the measurement being the
instrument the recommended text declares. Viable and not chosen: it is what
the worth of a test prescribes, a reader sized to what its reading changes,
and it names its successor before the measurement exists, which the author's
words do not; under the recommended
text the same measurement is owed and the rule changes by interview when the
measurement shows something, which is the ordinary way a ratified answer
changes. The measurement this option waits on is not the one the recommended
text's instrument makes: a rule that runs every reading on fable prices fable
readings and never the differential against a weaker reader, so this option
would declare a sample second reading on a weaker model as well, and the
recommended text does not, since the author's words name a model and not a
method of choosing one.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Which model runs the clean-context review's readings?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
instrument:
  kind: assessment
  ref: the cost and the yield of each reading, measured per reading, the yield being the findings that changed a verdict, judged by the author against this rule
  note: "not yet materialized; no telemetry records a reading's cost, the yield is unmeasured, and the evidence to date is the briefs' sizes on disk and the session's report, in the rationale. What it measures is the price and the yield of fable readings, which can show a reading whose yield is nil at that price and never what a weaker reader would have found; the re-reading is that sample: it runs one model down on an object the stronger reader has already read, so what it finds and what it misses beside the first reading of the same node is the differential, and the instrument compares the two"
---
## Answer

The author's rule with its own return written in: both readings on fable at
high effort until the cost and the yield of each reading, the yield being the
findings that changed a verdict, are measured per reading, and a per-reading
rule sized to that measurement thereafter, the measurement being the
instrument the recommended text declares. Viable and not chosen: it is what
the worth of a test prescribes, a reader sized to what its reading changes,
and it names its successor before the measurement exists, which the author's
words do not; under the recommended
text the same measurement is owed and the rule changes by interview when the
measurement shows something, which is the ordinary way a ratified answer
changes. The measurement this option waits on is not the one the recommended
text's instrument makes: a rule that runs every reading on fable prices fable
readings and never the differential against a weaker reader, so this option
would declare a sample second reading on a weaker model as well, and the
recommended text does not, since the author's words name a model and not a
method of choosing one.
```

#### fallback-when-the-model-is-unavailable

The recommended rule with one clause added: both readings run on the model this node names whenever the launching session can reach it, and where it cannot, the reading runs on the next model down, the substitute named in the launch prompt and recorded on the node the reading read, so that a session limit on one model delays no ruling and every reading says which model read it. It changes `fable-for-both-readings` in that one place and nowhere else. Raised by the author's words of 2026-09-05, said when three readers died on the session limit inside a minute: "Continue with opus instead of fable". This is the behaviour the two review skills and the alignment skill already carry, which under the recommended option is unsupported implementation.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Which model runs the clean-context review's readings?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
instrument:
  kind: assessment
  ref: the cost and the yield of each reading, measured per reading, the yield being the findings that changed a verdict, judged by the author against this rule
  note: "not yet materialized; no telemetry records a reading's cost, the yield is unmeasured, and the evidence to date is the briefs' sizes on disk and the session's report, in the rationale. What it measures is the price and the yield of fable readings, which can show a reading whose yield is nil at that price and never what a weaker reader would have found; the re-reading is that sample: it runs one model down on an object the stronger reader has already read, so what it finds and what it misses beside the first reading of the same node is the differential, and the instrument compares the two"
---
## Answer

The recommended rule with one clause added: both readings run on the model this node names whenever the launching session can reach it, and where it cannot, the reading runs on the next model down, the substitute named in the launch prompt and recorded on the node the reading read, so that a session limit on one model delays no ruling and every reading says which model read it. It changes `fable-for-both-readings` in that one place and nowhere else. Raised by the author's words of 2026-09-05, said when three readers died on the session limit inside a minute: "Continue with opus instead of fable". This is the behaviour the two review skills and the alignment skill already carry, which under the recommended option is unsupported implementation.
```

#### wait-for-the-named-model

The recommended rule with the other clause added: both readings run on the
model this node names and on no other, and where the launching session cannot
reach it the reading waits for the limit to reset, the sitting parking behind
it. It changes `fable-for-both-readings` in that one place and nowhere else.
What it buys is that no ruling ever rests on a reading by a weaker reader than
the rule names, which is the whole of the answer's argument about the floor and
the ceiling; what it costs is that a session limit on one model stops the
alignment frontier, and the record then has no reading at all rather than a
reading it can see the model of. It is on the fact because the author's words
of 2026-09-05 directed a substitution for that day and did not choose between
the two rules.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Which model runs the clean-context review's readings?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
instrument:
  kind: assessment
  ref: the cost and the yield of each reading, measured per reading, the yield being the findings that changed a verdict, judged by the author against this rule
  note: "not yet materialized; no telemetry records a reading's cost, the yield is unmeasured, and the evidence to date is the briefs' sizes on disk and the session's report, in the rationale. What it measures is the price and the yield of fable readings, which can show a reading whose yield is nil at that price and never what a weaker reader would have found; the re-reading is that sample: it runs one model down on an object the stronger reader has already read, so what it finds and what it misses beside the first reading of the same node is the differential, and the instrument compares the two"
---
## Answer

The recommended rule with the other clause added: both readings run on the
model this node names and on no other, and where the launching session cannot
reach it the reading waits for the limit to reset, the sitting parking behind
it. It changes `fable-for-both-readings` in that one place and nowhere else.
What it buys is that no ruling ever rests on a reading by a weaker reader than
the rule names, which is the whole of the answer's argument about the floor and
the ceiling; what it costs is that a session limit on one model stops the
alignment frontier, and the record then has no reading at all rather than a
reading it can see the model of. It is on the fact because the author's words
of 2026-09-05 directed a substitution for that day and did not choose between
the two rules.
```

#### alignment-main-thread-named

The recommended rule with its ground restated: both readings run on the model
the `delegation` node gives the *alignment* session's main thread, and a reading
invoked by any other session runs on that same model rather than on the model of
the session that invoked it. It is raised because the ground this node's answer
rests on moved beneath it. That answer names fable as the model "the delegation
node gives the main thread"; the amendment of 2026-09-05 to `delegation` gives
the most capable model at full effort to the alignment session's main thread
alone, and gives a reconciliation session's main thread the model the
reconciliation skill recommends. So a reading invoked from a reconciliation
session now has no main thread at the rank this node's argument assumes, and the
rule as written no longer says which model that reading runs on. What it buys is
that the reading's reader is pinned to one rank whoever invokes it, which is what
the answer already means; what it costs is a second place where a change to
`delegation` changes what this rule names, unless the model is named here
outright. Raised by the second clean-context reading of `delegation` on
2026-09-05, which found the cross-node consequence at its locus; that review
proposes the option and does not write this node's answer.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Which model runs the clean-context review's readings?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
instrument:
  kind: assessment
  ref: the cost and the yield of each reading, measured per reading, the yield being the findings that changed a verdict, judged by the author against this rule
  note: "not yet materialized; no telemetry records a reading's cost, the yield is unmeasured, and the evidence to date is the briefs' sizes on disk and the session's report, in the rationale. What it measures is the price and the yield of fable readings, which can show a reading whose yield is nil at that price and never what a weaker reader would have found; the re-reading is that sample: it runs one model down on an object the stronger reader has already read, so what it finds and what it misses beside the first reading of the same node is the differential, and the instrument compares the two"
---
## Answer

The recommended rule with its ground restated: both readings run on the model
the `delegation` node gives the *alignment* session's main thread, and a reading
invoked by any other session runs on that same model rather than on the model of
the session that invoked it. It is raised because the ground this node's answer
rests on moved beneath it. That answer names fable as the model "the delegation
node gives the main thread"; the amendment of 2026-09-05 to `delegation` gives
the most capable model at full effort to the alignment session's main thread
alone, and gives a reconciliation session's main thread the model the
reconciliation skill recommends. So a reading invoked from a reconciliation
session now has no main thread at the rank this node's argument assumes, and the
rule as written no longer says which model that reading runs on. What it buys is
that the reading's reader is pinned to one rank whoever invokes it, which is what
the answer already means; what it costs is a second place where a change to
`delegation` changes what this rule names, unless the model is named here
outright. Raised by the second clean-context reading of `delegation` on
2026-09-05, which found the cross-node consequence at its locus; that review
proposes the option and does not write this node's answer.
```

#### the-smaller-model-on-a-re-reading

`fable-for-both-readings` with one clause: the review of a draft and the survey run where the author's words of 2026-09-04 put them, and the re-reading of an amendment runs on the smaller model, the `delegation` node's own name for the rank it gives mechanical work and anything whose contract determines the answer, at the same effort and chosen by no session; the amendment of 2026-09-07 corrected the fence to that rank and left this prose naming the larger, which the survey of the same day found. It changes the recommended rule in that one place. The instrument's note changes with it, since the differential the note says the rule cannot measure is what the re-reading now supplies.

**AI support.** For it: the re-reading's object is the amendment and not the answer, its brief forbids it to re-run the first reading's validations, and its two questions are put to a stated diff and a stated list of findings, so its contract determines what it looks for; that is the delegation node's own test for the smaller model. It also unlocks the measurement this node declares and cannot take under a flat rule.

**AI divergence.** Against it, and the case is on the fact: the re-reading is the last reader before the author rules, and the second of its two questions -- whether the amendment introduces anything the last reading had no chance to see -- is a fresh judgment of a text and not a lookup, so the clause reasons from the easier half of the contract. What it saves is unmeasured; this record has no telemetry of a reading's cost, and what the briefs on disk price is the object of a re-reading and not the reading: seven delta briefs at implementation commit `87e4b24e` ran from 92,276 to 232,347 bytes and totalled 1,038,349, and five at implementation commit `cb0e02c6`, taken on 2026-09-07, run from 110,087 to 214,846 and total 775,868. Both sets are in `tmp/review/`, which is gitignored, so neither can be re-taken from the record: they price a scratch directory the record does not keep, and the figures stand with the commit that produced them or not at all.

Raised from the author's words of 2026-09-07 asking whether the model choice is right sized, and recorded here rather than on `review-cost` because the model of a reading is this node's question and is stated once.

**Content.**

```markdown
---
question: Which model runs the clean-context review's readings?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
instrument:
  kind: assessment
  ref: the cost and the yield of each reading, measured per reading, the yield being the findings that changed a verdict, judged by the author against this rule
  note: "not yet materialized; no telemetry records a reading's cost, the yield is unmeasured, and the evidence to date is the briefs' sizes on disk and the session's report, in the rationale. What it measures is the price and the yield of fable readings, which can show a reading whose yield is nil at that price and never what a weaker reader would have found; the re-reading is that sample: it runs one model down on an object the stronger reader has already read, so what it finds and what it misses beside the first reading of the same node is the differential, and the instrument compares the two"
---
## Answer

On fable, the two readings whose object is an answer. The review of a draft and the survey each run on fable, the most capable model the harness offers and the one the delegation node gives the main thread, at high effort, whenever either runs during the dialogue, invoked by a sitting or directly; the model is read from nothing on the node, the draft, or the drafter, and is chosen by no session. The re-reading of an amendment runs on the smaller model, the delegation node's own name for that rank, at the same effort, and is chosen by no session either. It is the one reading of the three whose object is not an answer: the review-cost node gives it the amendment, the findings the amendment answers, and two questions to ask of them, whether each finding is answered and whether the amendment introduces anything the last reading had no chance to see. Its contract fixes what it looks for and where, which is the kind of work the delegation node's rule puts on the smaller model -- that node's fixed name for a rank, not a comparison between whichever two models are in play -- and the argument that puts the first reading at the top of the range does not reach it: that argument is that a reader below the main thread's model finds what the main thread already saw, and it is an argument about judging an answer whole, not about checking a stated finding against a stated diff. It stops at that rank and goes no lower because the second of the re-reading's two questions, whether the amendment introduces anything the last reading had no chance to see, is a fresh judgment of a text and not a lookup; what lets a smaller reader make it is that the judgment is bounded by a stated diff and a stated list of findings, and the bound is the contract's and not the reader's. This clause diverges from the scholarly-peer-review reading, which supports one standard of reader across the readings and refuses a formula that grades the reader by anything the reviewed party writes; the divergence is the author's decision and is recorded as one, on the ground that the grading here is by the reading's object, which the record fixes, and not by a drafter's boldness or a session's choice. Brooks's surgical team, which puts the strongest reader on the draft and a lesser one on the check, and N-version programming, which is against reading a text twice with the same kind of mind, each support the clause as far as one rank inside one lineage of model goes and no further: the first two readings stay flat, so the tradition's own arrangement is only partly made here. The author's words of 2026-09-04 name the two readings that then existed; the re-reading was made by the review-cost node on 2026-09-05 and is not among them, so this clause narrows no rule the author gave. What happens when that model cannot be reached is not answered here: it is open on the option `fallback-when-the-model-is-unavailable`, raised by the author's own words of 2026-09-05, and until the author rules there the substitute clauses the two review skills and the alignment skill carry are unsupported implementation by the materialization node's test, named as such rather than read into this rule. The clause has fired twice: on 2026-09-05, when three readers died on the session limit inside a minute and the author's words directed the substitution, and on 2026-09-07, when this node's own draft reading was launched on the substitute and told so at the launch, so the author rules on the fallback with two instances in front of them and with one of them the reading behind this text. The effort is stated in each reading's brief, as the delegation node requires, and fixed by the skill. The rule is stated here and nowhere else: the clean-context-review node says how each reading is run and cites this node for its model; the decomposition node names the review of a draft among a sitting's units and cites this node the same way; the delegation node's rule that the model follows the kind of work is the genus of this one, which names the kind, a clean-context reading of what the main thread wrote or integrated, and fixes its model at the main thread's. The rule is the role's, and the role binds: when the harness's most capable model changes, the readings move with the main thread from that day, and fable, the author's word for it on 2026-09-04 and the harness's name for it, is a fact about the harness and not part of what this rule binds. That is the recording node's test applied and not asserted: what the rule binds is the role, so an executor under the corrected text launches whatever the harness's most capable model is that day, which is what it was already bound to do, and the name's correction changes nothing an executor does. What the AI may not do under that reading is decide for itself that the harness's most capable model has changed; the correction is a reading of the harness that belongs in the record beside the name, and a correction made without one is a move the author never saw.

This answer is materialized by the two review skills and the brief templates and fragments on the implementation ref, the three shims the review-skills node declares, and by the alignment skill that invokes them, the shim the growth node declares. What this answer binds is that each reading's launch names the model and the effort, that no file computes either and no brief argues either, and that the rule is cited and never restated; the sites that must satisfy it are the two review skills' launch steps and their sections on model and delegation -- among them the launch step of `.claude/skills/align-review/SKILL.md`, which names the rank of each of the two readings it launches, the draft reading and the re-reading of an amendment, and is the site of this clause -- the bounds fragment, and the alignment skill's three statements of the rule, in place of the rule that sized a draft's reviewer to boldness, tier, and settling and put the survey on opus. Where a skill writes the model's name down rather than citing this node for it, only `.claude/skills/align-survey/SKILL.md` does today, naming fable at high effort; `.claude/skills/align-review/SKILL.md` names the model in the prompt at the launch and writes none in the file, which is the divergence the review-skills node measures. `brief.mjs` computes no model and prints none: `reviewerModel`, the `model` field of both briefs' results, and the tests that pin them are deleted, since a script that prints a constant it does not compute is the projection of nothing. The bounds fragment both briefs open with tells the reader that the model and the effort are fixed by this node and stated at the launch, and argues neither; the effort reaches the reader in the launch prompt and not in the brief, which the first paragraph's clause about the brief overstated. The alignment skill's three statements of the replaced rule, in its list of a sitting's units, its review step, and its section on model and delegation, cite this node for the model and the effort of both readings and name neither. In the graph, the sentence of the clean-context-review node's recommended text that sizes the reviewer's model, with the rationale sentence and the rejected fixed model that argued it, and the clause of the decomposition node's recommended text that restates it, with the rationale clause and the rejected fixed model there, are replaced by citations of this node.

What this costs, as a consequence and never a reason: every reading pays the top rate. Over the rule it replaces, the difference is the survey's reading and the review of a draft whose recommendation is at low boldness on a node that is not global-tier and settles nothing, each now on fable; every other draft's reading already ran there. What would lower the price of a reading is the brief it is handed and never the reader, and the `review-cost` node did that on 2026-09-05: the index that carried every standing answer whole is one line a node, and the briefs measured across the change fell by sixty to seventy percent. That is the lever this node declines to pull, and it has been pulled elsewhere. What the re-reading's clause costs is that the second reading of an answer is made by a reader below the one that made the first, so a defect the first reading missed and the amendment did not touch is now looked for by a weaker eye. The reply is that the re-reading is not asked to look for it, its object being the amendment and not the node, and that what it misses falls to the survey exactly as the two-reading cap already leaves it; the reply is a reply and not a disproof, and the instrument this answer declares is what would show it wrong. What the clause is measured to save, against the question the author asked of it on 2026-09-07, is the smallest of the three readings: the five delta briefs of that day run from 110,087 to 214,846 bytes and total 775,868, against 263,766 to 323,650 and 1,186,935 for the four draft briefs of the same sitting, so the reading whose model moves is the one with the smallest object, and the two readings the author called very expensive stay at the top rate. They stay there for the reason the first paragraph gives and not for want of a lever: their object is an answer judged whole, and what a reader must hold to judge an answer whole is exactly what the model is the lever for. The lever that lowers their price is the brief, which the review-cost node pulls.
```

#### effort-graded-by-the-readings-object

The recommended rule with the lever moved from the model to the effort: every reading keeps one standard of reader, the model the author named on 2026-09-04, and the re-reading of an amendment, whose contract fixes what it looks for and where, runs at a lower effort on that same model. It changes the recommended rule in that one place.

**AI support.** For it: it is the one option on this fact that answers the author's question of 2026-09-07 without making a second standard of reader inside one venue, which `scholarly-peer-review` refuses. This node's own rationale names effort as the depth lever -- "the model is the lever for what a reader can hold at once and the effort the lever for depth at each step" -- and no other option here varies it, so a reader of the fact is shown every rank and no effort.

Viable and not adopted: the model is the lever for what a reader holds at once, and what the re-reading must hold is its object, the amendment with the findings it answers; that is what the rank is chosen for and it is what the clause moves. Effort is the depth lever, and the delta's contract already bounds the re-reading's depth, two questions put to a stated diff and a stated list of findings, so lowering the effort spends a lever the contract has spent and leaves untouched the one the object sets. If the author rules for this option instead, the divergence from `scholarly-peer-review` recorded on the recommended one is lifted with it.

Raised at the clean-context reading of 2026-09-07, in its viability paragraph.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Which model runs the clean-context review's readings?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
instrument:
  kind: assessment
  ref: the cost and the yield of each reading, measured per reading, the yield being the findings that changed a verdict, judged by the author against this rule
  note: "not yet materialized; no telemetry records a reading's cost, the yield is unmeasured, and the evidence to date is the briefs' sizes on disk and the session's report, in the rationale. What it measures is the price and the yield of fable readings, which can show a reading whose yield is nil at that price and never what a weaker reader would have found; the re-reading is that sample: it runs one model down on an object the stronger reader has already read, so what it finds and what it misses beside the first reading of the same node is the differential, and the instrument compares the two"
---
## Answer

The recommended rule with the lever moved from the model to the effort: every reading keeps one standard of reader, the model the author named on 2026-09-04, and the re-reading of an amendment, whose contract fixes what it looks for and where, runs at a lower effort on that same model. It changes the recommended rule in that one place.
```

#### the-larger-model-on-a-re-reading

Everything `the-smaller-model-on-a-re-reading` says, with the fence corrected to the rank that option and the two readings on it already name: the re-reading runs one model down, on the larger model the delegation node gives a reconciliation session's main thread, and not on the smaller. It is on the table because the fence and the option it is the text of name two ranks that delegation's answer keeps apart, so a ruling for the option as recorded and a ruling for the fence as written are two different rulings, and the record has to say which one the author is being asked for. The repair of 2026-09-07 corrected the option's prose to the fence's rank, the smaller model, since the fence was the text the amendment of that day corrected on purpose and the re-readings of the sitting ran there; this option stands as the ruling for the larger model, viable and not adopted.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Which model runs the clean-context review's readings?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
instrument:
  kind: assessment
  ref: the cost and the yield of each reading, measured per reading, the yield being the findings that changed a verdict, judged by the author against this rule
  note: "not yet materialized; no telemetry records a reading's cost, the yield is unmeasured, and the evidence to date is the briefs' sizes on disk and the session's report, in the rationale. What it measures is the price and the yield of fable readings, which can show a reading whose yield is nil at that price and never what a weaker reader would have found; the re-reading is that sample: it runs one model down on an object the stronger reader has already read, so what it finds and what it misses beside the first reading of the same node is the differential, and the instrument compares the two"
---
## Answer

Everything `the-smaller-model-on-a-re-reading` says, with the fence corrected to the rank that option and the two readings on it already name: the re-reading runs one model down, on the larger model the delegation node gives a reconciliation session's main thread, and not on the smaller. It is on the table because the fence and the option it is the text of name two ranks that delegation's answer keeps apart, so a ruling for the option as recorded and a ruling for the fence as written are two different rulings, and the record has to say which one the author is being asked for. The repair of 2026-09-07 corrected the option's prose to the fence's rank, the smaller model, since the fence was the text the amendment of that day corrected on purpose and the re-readings of the sitting ran there; this option stands as the ruling for the larger model, viable and not adopted.
```

#### the-measurement-re-taken-at-ca64407d

Everything the answer says, with the sentence that measures where a skill writes the
model's name down re-taken at implementation commit `ca64407d`, where neither skill
writes one.

**AI support.** The sentence as it stands is false on both its limbs and was true
when written: `.claude/skills/align-survey/SKILL.md` no longer names `fable` or any
other harness name, the reconciliation of 2026-09-07 having brought it onto the same
relation-to-the-other-reader form `.claude/skills/align-review/SKILL.md` already used,
and a case-insensitive search for `fable` over both files returns nothing. The
sentence also attributes the measurement to `review-skills`, whose own drift sentence
carries the same figures, so the two nodes must move together or disagree; this option
is the half of that movement that belongs here.

The author, 2026-09-04, in the sitting on the alignment page: "adversarial review during dialogue - both survey and narrow review - use the fable model"; and earlier that day, directing the two reviews then running: "launch align-review using the fable model". Judged as if written from scratch, the rule is what the reading is for. A clean-context reading hunts what the party that wrote the text stopped seeing, and that party is the main thread: it runs on the most capable model at full effort, integrates what the design unit drafted, and reads the result adversarially before the review, so a reader below the main thread's model finds what the main thread already saw, and the floor is the ceiling, since nothing above it is offered. The reviewer's strength is a function of nothing the reviewed party sets: the rule this one replaces read it off boldness, which the drafter writes, so the drafter selected the strength of its own reviewer, and that separation, kept wherever a second signature is required, is the one argument for the author's rule the record did not carry. And the price of a reading is bounded and measured while the yield of a weaker one is not: under an unmeasured detection differential, a bounded price, and an irreversible step after the reading, the author's ruling, the strongest reader on every reading is the allocation to make, and the measurement that would let a rule size the reader to the reading is the instrument this answer declares and does not yet have. The effort is high and not the main thread's full effort because the model is the lever for what a reader can hold at once and the effort the lever for depth at each step, and a reading is a checklist run over a neighbourhood or the whole graph, bound by breadth; the effort is fixed with the model so that the session which launches the reading chooses neither. The rule lives here because the author ruled on the model separately from how the review is run, and a decision the author rules on separately is a question and a node, as the dialogue node says; it is stated once, and the two nodes that stated it cite it, as the frontier-consistency node already refuses to restate the review's model. Fable is bound to the delegation node's word for it, the most capable model, so that the rule is in the record's vocabulary and the harness's name for the model is the day's. Measured on 2026-09-04, at implementation commit ed725297 on the greenfield ref: the briefs the two fable readings of that day were handed are 535,197 bytes over 4,651 lines and 428,790 bytes over 3,181 lines; the survey's brief is 519,400 bytes over 4,034 lines with a pins sidecar of 9,676 bytes; the batch brief of 2026-09-03 was 838,923 bytes; and the session that ran the two draft readings reported each at about 480,000 tokens in about fourteen minutes, a figure the repository does not verify, which if right puts a reading at three to five times the brief it was handed.

**AI divergence.** It re-pins a measurement of two hand-written files that the record
expects to keep moving, so the sentence will fall out of date again, and a node whose
text must be re-measured on every reconciliation of a skill is carrying an
implementation report inside a rule. The alternative the record has not taken is to
say only what the rule requires — that no file outlives the launch carrying a model's
name — and to let the survey's artifact validations catch a file that does; that would
make this option unnecessary and is the case against pinning a number here at all.

The clause spends the record's scarcest guarantee to buy its smallest saving. The re-reading is the last reader between an amendment and the author's ruling, and it is also the cheapest of the three readings by this node's own measurement, so the rule downgrades the reader exactly where a miss is least recoverable and saves least. The argument that its contract determines the answer holds for the first of its two questions and not the second, whether the amendment introduces anything the last reading had no chance to see, which is a fresh judgment of a text -- the fact's own reasoning concedes this, and the clause is recommended anyway. And the reply that what the weaker eye misses falls to the survey rests on a reading that, by the parent node's own rationale, no sitting has yet generated, so the fallback the clause leans on has never once run.

**Content.**

```markdown
---
question: Which model runs the clean-context review's readings?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
instrument:
  kind: assessment
  ref: the cost and the yield of each reading, measured per reading, the yield being the findings that changed a verdict, judged by the author against this rule
  note: "not yet materialized; no telemetry records a reading's cost, the yield is unmeasured, and the evidence to date is the briefs' sizes on disk and the session's report, in the rationale. What it measures is the price and the yield of fable readings, which can show a reading whose yield is nil at that price and never what a weaker reader would have found; the re-reading is that sample: it runs one model down on an object the stronger reader has already read, so what it finds and what it misses beside the first reading of the same node is the differential, and the instrument compares the two"
---
## Answer

On fable, the two readings whose object is an answer. The review of a draft and the survey each run on fable, the most capable model the harness offers and the one the delegation node gives the main thread, at high effort, whenever either runs during the dialogue, invoked by a sitting or directly; the model is read from nothing on the node, the draft, or the drafter, and is chosen by no session. The re-reading of an amendment runs on the smaller model, the delegation node's own name for that rank, at the same effort, and is chosen by no session either. It is the one reading of the three whose object is not an answer: the review-cost node gives it the amendment, the findings the amendment answers, and two questions to ask of them, whether each finding is answered and whether the amendment introduces anything the last reading had no chance to see. Its contract fixes what it looks for and where, which is the kind of work the delegation node's rule puts on the smaller model -- that node's fixed name for a rank, not a comparison between whichever two models are in play -- and the argument that puts the first reading at the top of the range does not reach it: that argument is that a reader below the main thread's model finds what the main thread already saw, and it is an argument about judging an answer whole, not about checking a stated finding against a stated diff. It stops at that rank and goes no lower because the second of the re-reading's two questions, whether the amendment introduces anything the last reading had no chance to see, is a fresh judgment of a text and not a lookup; what lets a smaller reader make it is that the judgment is bounded by a stated diff and a stated list of findings, and the bound is the contract's and not the reader's. This clause diverges from the scholarly-peer-review reading, which supports one standard of reader across the readings and refuses a formula that grades the reader by anything the reviewed party writes; the divergence is the author's decision and is recorded as one, on the ground that the grading here is by the reading's object, which the record fixes, and not by a drafter's boldness or a session's choice. Brooks's surgical team, which puts the strongest reader on the draft and a lesser one on the check, and N-version programming, which is against reading a text twice with the same kind of mind, each support the clause as far as one rank inside one lineage of model goes and no further: the first two readings stay flat, so the tradition's own arrangement is only partly made here. The author's words of 2026-09-04 name the two readings that then existed; the re-reading was made by the review-cost node on 2026-09-05 and is not among them, so this clause narrows no rule the author gave. What happens when that model cannot be reached is not answered here: it is open on the option `fallback-when-the-model-is-unavailable`, raised by the author's own words of 2026-09-05, and until the author rules there the substitute clauses the two review skills and the alignment skill carry are unsupported implementation by the materialization node's test, named as such rather than read into this rule. The clause has fired twice: on 2026-09-05, when three readers died on the session limit inside a minute and the author's words directed the substitution, and on 2026-09-07, when this node's own draft reading was launched on the substitute and told so at the launch, so the author rules on the fallback with two instances in front of them and with one of them the reading behind this text. The effort is stated in each reading's brief, as the delegation node requires, and fixed by the skill. The rule is stated here and nowhere else: the clean-context-review node says how each reading is run and cites this node for its model; the decomposition node names the review of a draft among a sitting's units and cites this node the same way; the delegation node's rule that the model follows the kind of work is the genus of this one, which names the kind, a clean-context reading of what the main thread wrote or integrated, and fixes its model at the main thread's. The rule is the role's, and the role binds: when the harness's most capable model changes, the readings move with the main thread from that day, and fable, the author's word for it on 2026-09-04 and the harness's name for it, is a fact about the harness and not part of what this rule binds. That is the recording node's test applied and not asserted: what the rule binds is the role, so an executor under the corrected text launches whatever the harness's most capable model is that day, which is what it was already bound to do, and the name's correction changes nothing an executor does. What the AI may not do under that reading is decide for itself that the harness's most capable model has changed; the correction is a reading of the harness that belongs in the record beside the name, and a correction made without one is a move the author never saw.

This answer is materialized by the two review skills and the brief templates and fragments on the implementation ref, the three shims the review-skills node declares, and by the alignment skill that invokes them, the shim the growth node declares. What this answer binds is that each reading's launch names the model and the effort, that no file computes either and no brief argues either, and that the rule is cited and never restated; the sites that must satisfy it are the two review skills' launch steps and their sections on model and delegation -- among them the launch step of `.claude/skills/align-review/SKILL.md`, which names the rank of each of the two readings it launches, the draft reading and the re-reading of an amendment, and is the site of this clause -- the bounds fragment, and the alignment skill's three statements of the rule, in place of the rule that sized a draft's reviewer to boldness, tier, and settling and put the survey on opus. No skill writes the model's name down: measured at implementation commit `ca64407d`, `.claude/skills/align-review/SKILL.md` and `.claude/skills/align-survey/SKILL.md` both name the model at the launch by its relation to the other reader — the draft reading and the survey on the larger model, the most capable the harness offers, the re-reading of an amendment on the smaller, each at high effort — and both name the unavailability clause this node holds unsupported, so the divergence the review-skills node measured on 2026-09-05 was repaired by hand on 2026-09-07 and no longer stands. `brief.mjs` computes no model and prints none: `reviewerModel`, the `model` field of both briefs' results, and the tests that pin them are deleted, since a script that prints a constant it does not compute is the projection of nothing. The bounds fragment both briefs open with tells the reader that the model and the effort are fixed by this node and stated at the launch, and argues neither; the effort reaches the reader in the launch prompt and not in the brief, which the first paragraph's clause about the brief overstated. The alignment skill's three statements of the replaced rule, in its list of a sitting's units, its review step, and its section on model and delegation, cite this node for the model and the effort of both readings and name neither. In the graph, the sentence of the clean-context-review node's recommended text that sizes the reviewer's model, with the rationale sentence and the rejected fixed model that argued it, and the clause of the decomposition node's recommended text that restates it, with the rationale clause and the rejected fixed model there, are replaced by citations of this node.

What this costs, as a consequence and never a reason: every reading pays the top rate. Over the rule it replaces, the difference is the survey's reading and the review of a draft whose recommendation is at low boldness on a node that is not global-tier and settles nothing, each now on fable; every other draft's reading already ran there. What would lower the price of a reading is the brief it is handed and never the reader, and the `review-cost` node did that on 2026-09-05: the index that carried every standing answer whole is one line a node, and the briefs measured across the change fell by sixty to seventy percent. That is the lever this node declines to pull, and it has been pulled elsewhere. What the re-reading's clause costs is that the second reading of an answer is made by a reader below the one that made the first, so a defect the first reading missed and the amendment did not touch is now looked for by a weaker eye. The reply is that the re-reading is not asked to look for it, its object being the amendment and not the node, and that what it misses falls to the survey exactly as the two-reading cap already leaves it; the reply is a reply and not a disproof, and the instrument this answer declares is what would show it wrong. What the clause is measured to save, against the question the author asked of it on 2026-09-07, is the smallest of the three readings: the five delta briefs of that day run from 110,087 to 214,846 bytes and total 775,868, against 263,766 to 323,650 and 1,186,935 for the four draft briefs of the same sitting, so the reading whose model moves is the one with the smallest object, and the two readings the author called very expensive stay at the top rate. They stay there for the reason the first paragraph gives and not for want of a lever: their object is an answer judged whole, and what a reader must hold to judge an answer whole is exactly what the model is the lever for. The lever that lowers their price is the brief, which the review-cost node pulls.
```

### authority

Ratified, at low boldness: the author stated the rule in their own words, it
binds how every reading spends their tokens and their attention on every
sitting, and a wrong answer compounds across sittings, which is the escalation
test the `class-recommendation` node states. The case against it is on the fact, and it is on
the limb this answer chose, not the other: if the rule binds the role and the
model's name is a fact about the harness, the AI corrects the name without an
interview, so what ratification pins is a sentence about roles while the name
an executor launches moves without the author. That is the cost of the reading
taken here, and it is why the answer says the correction belongs in the record
beside the name rather than in a session's judgment.

## Account


An un-aligned disposition, recorded from the author's words the turn they
were said. It is a question of its own because the model a reading runs on is
a decision the author rules on separately from how the review is run, which
is `clean-context-review`'s question, and from how work is divided, which is
`delegation`'s.

What the sitting would amend: the rule carried in `clean-context-review`'s
recommended text and in `decomposition`'s, that a draft's reviewer runs on a
model never smaller than the drafter's, on fable when the recommendation's
boldness is not low, the node is global-tier, or a ruling on it would settle
other nodes, and on opus otherwise, and that the survey's reviewer runs on
opus; `delegation`, whose answer has the model follow the kind of work and
names the larger model for judgment; and the review skill's section on model
and delegation with `brief.mjs`, which computes a draft's reviewer from the
node. The periagogic object is those texts, the author's earlier words on
`decomposition` that the more complex recommendations pass to a fable
subagent to review, and the cost evidence this session holds: the two draft
readings of 2026-09-04 on fable, one over a brief of 4,652 lines and one over
3,182, each ran to about 480,000 tokens in about fourteen minutes.

The grant. In the words above the author granted bootstrap authority to
reconcile this disposition immediately after its maieutic movement, before
the clean-context review, which is owed on what is drafted and runs after.

### Manifest

- Folded: State at compaction, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The maieutic movement, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Recorded, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Reconciled, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the reading, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended by the review-cost node, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The escalation test's citation corrected, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier survey, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The three unsupported clauses named where they are carried, and the fourth struck, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The re-reading's model, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of bc4d3457, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the reading, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of e27a2e73, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier survey, 2026-09-07, of e27a2e73, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the frontier survey, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of f647e854, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Recommendation moved after the reading of review-skills, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of c36c5941

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `the-measurement-re-taken-at-ca64407d`.

Findings:

- Facts > answer > `the-measurement-re-taken-at-ca64407d` ("AI support"): the option states, "The sentence also attributes the measurement to `review-skills`, whose own drift sentence carries the same figures, so the two nodes must move together or disagree; this option is the half of that movement that belongs here." This asserts a dependency on a sibling node's own edit that this delta's scope (this node only, no siblings) cannot verify. Suggest: before the ruling, have the survey or a full reading confirm `review-skills`'s own drift sentence has in fact been corrected to match (or is being corrected in step), so the two nodes do not end up disagreeing on the very measurement each cites as its warrant.

On the facts and what they recommend: The diff moves the answer fact's `recommends` from `the-smaller-model-on-a-re-reading` to the newly added option `the-measurement-re-taken-at-ca64407d`; `boldness` stays `moderate` and `stands` stays absent (nothing stands on this node yet). The `## Recommendation` fence's second paragraph has its sentence on where a skill writes the model's name down replaced with one saying no skill names it and both skills use the relation-to-the-other-reader form as of implementation commit `ca64407d`, matching the new option's own 'Content' description. The fact-level `against` text is unchanged and still applies to the new recommendation, since the new option keeps the same re-reading-model-downgrade design the `against` critiques and only repairs one factual sentence unrelated to that critique.

On the viability of the options: Every option already on the answer fact remains viable and undisturbed; the diff adds one new viable option, `the-measurement-re-taken-at-ca64407d` (source review, 2026-09-07), without passing over, displacing, or re-ranking any existing option -- including `the-smaller-model-on-a-re-reading`, the option it supersedes as recommendation, which stays viable and carries no `status`. Authority and existence facts are untouched.

Strongest counter-argument (weak): The new option's own 'AI support' text asserts that `review-skills`'s drift sentence carries the same figures and that 'the two nodes must move together or disagree,' naming this option as 'the half of that movement that belongs here' -- but this delta's scope excludes `review-skills` itself, so whether its matching half has actually landed is unverifiable from here. If it has not, the record corrects this node's sentence while a sibling keeps citing the stale, falsified measurement, which is the same shape of unverifiable cross-node claim the previous reading raised about `n-version-programming` and that the session then had to confirm on the main thread before closing.

The session's reply: Validated on the main thread: review-skills' drift sentence was re-measured in its own repair of 2026-09-07 and carries the same figures at implementation commit ca64407d, so the two nodes moved together; its delta re-reading of the same date forwarded with no finding.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/review-model stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Recommendation` fence became the content of `the-measurement-re-taken-at-ca64407d`; 5 `## Disposition` entries became the ledger entries words/2026-09-04/37, words/2026-09-07/5, words/2026-09-07/6, words/2026-09-07/7, words/2026-09-07/8, referenced by 1 option the entry's own date names and by the recommended option for 4 the date named none. The content of `fable-for-both-readings (at 6a84b48e)`, `the-smaller-model-on-a-re-reading (at 1c0b5372)` was recovered from the commit at which the answer fact recommended it. The record wrote no text of its own for `conditional-by-boldness`, `strongest-on-the-survey`, `chosen-for-difference`, `fable-until-the-yield-is-measured`, `fallback-when-the-model-is-unavailable`, `wait-for-the-named-model`, `alignment-main-thread-named`, `effort-graded-by-the-readings-object`, `the-larger-model-on-a-re-reading`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `c36c59413397a8835ebb87d117e438bc2b4595bb` is re-computed for the encoding as `6c026933881c7d4137fb31e4a7fcfc6bfd030164`; nothing it read changed. The survey's pin `e27a2e7326a338bd4f519b1e55dfccc2394da68c` was already past the recommendation and is left as it stood.

### Frontier survey, 2026-09-07, of 6c026933

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- Placement and order (13). The answer fixes the model for readings whose object is an answer — "On fable, the two readings whose object is an answer" and "The re-reading of an amendment runs on the smaller model" — while `delegation-bounds-and-sizing`, projected at .claude/rules/delegation-bounds-and-sizing.md, holds that "a model another node's answer fixes is that node's and moves by that node's class, which is where `review-model`'s answer on the readings and `decomposition`'s answer on a sitting's units live". This node's class is unanswered, so the model it fixes moves by nothing, and the rule that points at it is at the ruling stage above ground that grants no class.

Strongest counter-argument (moderate): The recommendation rests on a measurement re-taken at ca64407d, and the measurement's object has moved since: the brief generated at this commit reports a mechanical tier and a whole-graph selection that the same family of nodes states do not exist. A model choice sized on a reading whose brief has since grown to 1,111,970 bytes is sized on the wrong workload, and the author's words of 2026-09-07 asked precisely whether "the model choice (fable/opus/sonnet)" is right for the cost. The node answers that question with a measurement taken before the cost was questioned.
