---
question: What does information hiding say about where the boundary between two instruments falls, and what does the record take from it?
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
source: David L. Parnas, "On the Criteria To Be Used in Decomposing Systems into Modules", Communications of the ACM 15(12) (1972), where a system is divided by the design decisions each module hides rather than by the steps of its flowchart, and the test of a boundary is whether a likely change lands inside one module; Dijkstra's separation of concerns, "On the role of scientific thought" (EWD 447, 1974, printed in Selected Writings on Computing, 1982); and Robert C. Martin's single responsibility principle, one reason to change, in Agile Software Development (2002), restated in Clean Architecture (2017) as responsibility to one and only one actor. Locus to be checked, the Clean Architecture restatement, which is paraphrased here.
bears:
  - fact: answer
    option: two-skills-one-package
    relation: adopted
---
## Answer

Supports the split, and supplies the criterion by which it is a split and not a preference. Parnas's argument is that a system is divided by the decisions each part hides, never by the order of the steps it performs, and that a boundary is in the right place when a likely change falls inside one part and is invisible outside it. Dijkstra's separation of concerns is the same discipline stated as a way of thinking, and Martin's later form gives the test a second face: a part changes for one reason, and answers to one actor.

The two readings pass the test on both faces. They hide different decisions — what a draft's neighbourhood is, its ancestry, its siblings, the nodes it names and the index of every question the record asks, against what the frontier's pins and staleness are and which nodes have moved since a survey last read them. They change for different reasons: the first six validations and the fifteenth against the seventh to the fifteenth, one node's verdict against a graph commit and a set of recommendation hashes. And they answer to different actors, the sitting that has just recorded a recommendation and the gate that stands before the author rules. A likely change to either lands inside one of them, which is the criterion satisfied.

The transfer is not clean and the reading names where it strains. Parnas is writing about a compilation unit, whose boundary is enforced by what a caller can see; a skill directory hides nothing from anyone and enforces nothing, since any reader may open either file. The argument carries only because an agent loads `SKILL.md` whole, so the file is the whole of what a reading is told and the directory is where that telling is kept. That is the criterion applied to an invocation surface rather than to a module, and it is guarded by review rather than by the shape of the thing.

What the criterion does not decide is where the mechanics live. The same argument that separates the two surfaces keeps one body of code in one place, since the decisions the brief generator and the apply script hide are shared by both readings and a change to either lands inside that one body. Information hiding therefore supports the two names and the one package together, and would be violated as much by copying the code as by merging the surfaces.

## Rationale

Read in the tradition survey of the review sitting of 2026-09-04 as its first reading on whether each reading of the clean-context review is its own skill, and named in `review-skills`' account among the readings its pass with reference to tradition owes: "Information hiding, Parnas, 1972, with the single responsibility principle, adopted for `two-skills-one-package`: the readings hide different decisions and change for different reasons." The survey's own caution, that Parnas's criterion is about a compilation unit and a skill directory is an invocation surface, is carried in the answer rather than left in the survey.

## Facts

### answer

The standing text is the only reading of these sources the survey produced,
and no second account of what the record takes from them is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at the recording of `review-skills`' recommendation on 2026-09-04, under the author's bootstrap grant of that day to progress the adversarial-review dispositions through the maieutic movement and reconcile them immediately, from the tradition survey of the review sitting and the pass with reference to tradition that read it, which names this reading among the eight owed under that node. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.
