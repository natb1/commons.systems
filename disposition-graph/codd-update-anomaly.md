---
question: What does Codd's relational model say about one fact stored in two places, and what does the record take from it?
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
  - commons.systems/disposition-graph/prose-and-structure
source: Codd, "A Relational Model of Data for Large Shared Data Banks", Communications of the ACM 13(6) (1970); and "Further Normalization of the Data Base Relational Model" (IBM Research Report RJ909, 1971, printed in Rustin, ed., Data Base Systems, 1972), the normal forms and the insertion, deletion and update anomalies that normalization removes.
bears:
  - node: commons.systems/disposition-graph/prose-and-structure
    fact: answer
    option: prose-argues-structure-records
    relation: adopted
  - node: commons.systems/disposition-graph/alignment-page
    fact: answer
    option: every-fact-every-option
    relation: adopted
---
## Answer

Supports, and supplies the name for a failure this record has already suffered. Codd's argument is that a fact recorded in more than one place will eventually be recorded differently in each. Normalization is the discipline that removes the second home: each fact is stored once, in the relation whose key determines it, and everything else that wants it derives it. The anomalies are the symptom rather than the rule, and the update anomaly is the sharpest of them, a change applied in one copy and not in the other, after which the store contradicts itself and no reader can tell which copy is right.

The record adopts the rule and not the tables. What has a shape is recorded in the field that has it and projected from there: a candidate the AI considered is an option on the fact it answers, a tradition is a reading node with its `bears` entries, a claim of class or boldness or persistence is the fact that holds it. Prose carries argument, which has no other home, and never a list a field also carries. That is one home per fact with the projections deriving the rest, which is Codd's rule stated for a record made of documents.

The record has the symptom on file, which is why this reading is worth its place. The enumeration of nodes carrying prose tradition lists was maintained by hand on `stub-traditions` beside the nodes themselves, and when it was checked it was short by three, omitting dialogue, recording and scope, and long by one, naming instruments, which carries no such list. Nothing had gone wrong except that one fact had two homes and only one of them was updated.

The tradition's own conditions are not fully met here and the reading should say so. Codd's argument runs on a schema, where the key that determines a fact is stated and a normal form can be checked mechanically; a record of prose and frontmatter has no such check, so the rule is enforced by a written disposition and by review, not by the shape of the store. That is the weaker form of the same guarantee, and the projector's heading match on "Rejected", which read the prose the rule liquidates, is what the weaker form costs.

## Rationale

Recorded in the tradition pass on the alignment page, 2026-09-04, which found the rule that structure must not be re-encoded in prose to be a rediscovery of the update anomaly and cited the record's own instance of it. It is filed under `prose-and-structure` because that node asks the question the tradition answers, what a node's prose may restate of what the record already carries as data, and its recommended text already names the anomaly in the rationale of its fence, where a tradition can carry no `bears` entry and no pin. This reading is where the tradition now lives, and the fence's sentence naming it is argument rather than a second record of the relation. It bears on `prose-argues-structure-records` because that option is one home per fact with the projections deriving the rest, and on the alignment page's `every-fact-every-option` because the page renders the structure and never reads prose for what the structure holds, which is the same rule seen from the reader's end.

## Facts

### answer

The standing text is the only reading of these two loci this pass produced,
and no second account of what the record takes from them is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, from the tradition pass of the alignment-page sitting, which recorded it as one of four rediscoveries: "The rule that structure must not be re-encoded in prose is Codd's update anomaly, and the record has already suffered one: the hand-maintained enumeration on `stub-traditions` was found short by three nodes and long by one." Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.
