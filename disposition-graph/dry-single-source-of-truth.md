---
question: What does the rule against duplicating knowledge say about one instruction written in two files, and what does the record take from it?
stage: maieutic
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-04"
    recommends: standing
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
  - commons.systems/disposition-graph/review-skills
source: Andrew Hunt and David Thomas, The Pragmatic Programmer (1999), "The Evils of Duplication", whose rule is that every piece of knowledge must have a single, unambiguous, authoritative representation within a system, and whose remedy where a fact must appear in several places is to generate the copies; with the materialized view over a normalized store, in Ashish Gupta and Inderpal Singh Mumick, Materialized Views (1999), and the convention of Go's generated code, whose files must carry the line saying they are generated and must not be edited. The relational statement of the same argument is read separately at commons.systems/disposition-graph/codd-update-anomaly, which bears on the same option. Locus to be checked, the page of the rule and of the code-generator remedy in The Pragmatic Programmer.
bears:
  - fact: answer
    option: two-skills-one-package
    relation: adopted
---
## Answer

Supports the split conditionally, and the condition is the whole of what the record takes. The rule forbids duplicating knowledge and not text: a fact recorded in two places will be updated in one of them, which is the anomaly, and a copy derived mechanically is not that failure, provided the derivation is the only way the copy is made, the copy is never edited by hand, and it says on its face that it is derived. The remedy the same source gives is a generator, and the convention that goes with a generator is a header telling a reader not to edit what it produced.

Applied here, two `SKILL.md` files written by the projector from one node are a materialized view over a normalized store: the knowledge lives once, in the node, and the two files cannot disagree because neither is written by hand. Two `SKILL.md` files written by hand are the anomaly itself, and no discipline short of not doing it makes them safe. The recommended option's drift answer is this rule read honestly rather than optimistically — resolved by construction at the shims' liquidation and not before — and that is what the adoption is for.

What holds in the interim is not this tradition, and the reading should not be read as saying it is. The three guards the answer names work by keeping the duplicated set empty rather than by deriving it — nothing is written in both files that both must keep true, the shared text is fetched from its one home each time a reading runs, and a stale citation is caught when the frontier is read as artifacts. Those are review and disposition, which is the weaker form of the same guarantee, and the shims are the record admitting that the strong form is not built yet.

One departure is worth recording. The tradition's third condition, that a derived artifact says on its face that it is derived, the record already meets for `.claude/rules/`, and the shim notice the transience node projects onto each skill file is the same device used for a file that is not yet derived at all — a notice saying the node wins over the file, standing in for a notice saying the file was written from the node. That is honest as far as it goes, and it is not what the convention asks for.

## Rationale

Read in the tradition survey of the review sitting of 2026-09-04, and named in `review-skills`' account among the readings its pass with reference to tradition owes: "Duplication of knowledge against duplication of text, Hunt and Thomas, 1999, with Codd's update anomaly already minted as `codd-update-anomaly` under `prose-and-structure`, adopted for the drift answer's condition, that a derived copy is no anomaly while it is never edited by hand and says so on its face, and that two hand-written copies are one; a `bears` entry on this node's recommended option is owed on that reading." That entry is recorded on `codd-update-anomaly` rather than restated here, so the relational half of the argument keeps its one home. The survey's condition that the split not be landed ahead of the projector is what the option `split-at-liquidation` carries; this reading records no relation there, since the node's account names only the drift answer's condition.

## Facts

### answer

The standing text is the only reading of these sources the survey produced,
and no second account of what the record takes from them is on the table. A
further relation, adopted on `split-at-liquidation`, is named in the
rationale as arguable and is not written, since the account gives one.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at the recording of `review-skills`' recommendation on 2026-09-04, under the author's bootstrap grant of that day to progress the adversarial-review dispositions through the maieutic movement and reconcile them immediately, from the tradition survey of the review sitting and the pass with reference to tradition that read it, which names this reading among the eight owed under that node. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.
