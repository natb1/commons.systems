---
question: What does Fagan's inspection say about dividing a review into named roles, and what does the record take from it?
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
source: Michael E. Fagan, "Design and code inspections to reduce errors in program development", IBM Systems Journal 15(3) (1976), where an inspection is decomposed into named roles with distinct checklists and into phases, and one text is read several times by different roles hunting different classes of defect; with Tom Gilb and Dorothy Graham, Software Inspection (1993), for the later formulations. Locus to be checked, the roster of roles, which differs between Fagan and the later treatments, and the reader role, which this reading associates with Gilb and Graham.
bears:
  - fact: answer
    option: two-skills-one-package
    relation: adopted
  - node: commons.systems/disposition-graph/frontier-consistency
    fact: answer
    option: split-survey-from-per-draft
    relation: adopted
---
## Answer

Supports the split, by the construction that is the tradition's own contribution. Fagan's finding is that a review is not one operation to be parameterized: it decomposes into readings, each defined by what it looks for, each carrying its own checklist, each occupied as a role for the length of the reading, and the same text is read more than once by different roles with the classes of defect divided between them. The rigour comes from the division, not from the diligence of a single reader.

The record has already borrowed the vocabulary and owes the tradition the rest of it. Two checklists over two objects — the first six validations and the fifteenth over one draft's neighbourhood, the seventh to the fifteenth over the whole graph — are two roles by this construction, and the record calls them readings for that reason. Two roles are two things to occupy and two things to invoke, and where the reader is an agent launched by a name, one name apiece is what occupying a role looks like. That is the adoption on `two-skills-one-package`.

What the tradition does not reach is everything after the division. Fagan's roles are people in one meeting over one artifact, held together by a moderator and by the phases the inspection runs in; the two readings here never meet, run at different moments, and are held together only by the node whose answer both read at every invocation. So the tradition supports dividing the review into named readings and supplies nothing about where their mechanics live or how the text they share is kept from drifting, which are the parts of the question this reading is not evidence for.

## Rationale

Read in the tradition survey of the review sitting of 2026-09-04, and named in `review-skills`' account among the readings its pass with reference to tradition owes: "Inspection roles, Fagan, 1976, adopted: a reading is a named role with its own checklist, and the record already calls them readings." The survey also notes that the promotor fidei bears on this question glancingly, as a named office; that tradition is surfaced and not minted, as `review-model`'s account records, since it informed no resolution.

## Facts

### answer

The standing text is the only reading of the inspection the survey produced,
and no second account of what the record takes from it is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at the recording of `review-skills`' recommendation on 2026-09-04, under the author's bootstrap grant of that day to progress the adversarial-review dispositions through the maieutic movement and reconcile them immediately, from the tradition survey of the review sitting and the pass with reference to tradition that read it, which names this reading among the eight owed under that node. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.
