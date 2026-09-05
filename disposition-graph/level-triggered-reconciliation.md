---
question: What does level-triggered reconciliation say about a frontier derived from the difference between desired and observed state, and what does the record take from it?
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
  - commons.systems/disposition-graph/viable-options
source: The spec and status convention and the controller loop of Kubernetes. The API conventions hold that an object carries a spec, the desired state written by whoever owns it, and a status, the observed state written by the controller; the controller documentation describes a control loop that repeatedly compares the two and acts to close the difference. The contrast between level-triggered and edge-triggered is borrowed there from digital logic, a level-triggered loop acting on the state it observes rather than on the events that produced it. Locus to be checked, the api-conventions document and the wording of the controller page.
bears:
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: grant-from-a-ruling
    relation: adopted
  - node: commons.systems/disposition-graph/work-loop
    fact: answer
    option: reconciliation-writes-options
    relation: diverged
---
## Answer

Supports the two frontiers, and supplies the reason they are derived and not stored. The convention separates two things that are easy to run together: what is wanted, written by the party entitled to want it, and what is, written by the party that observes. The loop reads both and acts on the difference. Because it is level-triggered it is driven by the state it finds rather than by a notification, so a missed event costs nothing, the loop is idempotent, and interrupting it halfway leaves nothing to clean up, since the next pass simply observes the new difference.

The record adopts the shape. The reconciliation frontier is every node whose acting option's instrument fails, which is the difference between what the record says and what stands, re-derived at each invocation from the record and the tree; the alignment frontier is the same kind of fold over the rulings. Neither is stored, no queue of pending work is kept, and a session that dies mid-bite leaves the next one to derive the frontier again and find the work still there. That is why the loop can take one bite and stop.

The divergence is on who writes the spec. In the controller pattern the loop writes only status and never spec, which is the whole guarantee, and the desired state belongs to whoever declared it. Here the desired state is the author's ruling, and the loop's licence is narrower than status but wider than nothing: it may record a viable option on a fact and move a recommendation within the node's scope, which touches what a later pass will treat as desired. The record's justification is that a divergence held outside the record until an alignment session transcribes it is a decision outside the record, and its guard is that the loop may never rule, never edit a ruling, and never move a recommendation beyond a delegation's scope. The tradition's clean line is not kept, and the reading says so rather than claiming it.

## Rationale

Recorded as one of the eight traditions in `viable-options`' rationale, adopted for the two frontiers as the difference between the AI's recommendation and what stands, and moved here under `prose-and-structure`, which holds that a tradition named only in prose carries no `bears` entry and no pin. It bears on the option that stands on `viable-options`' answer fact, whose last paragraph is where the frontiers are declared projections that the record does not store.

## Facts

### answer

The standing text is the only reading of this convention the record has
produced, and no second account of what it takes from it is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, from the paragraph of `viable-options`' rationale that names eight traditions in prose, which under `prose-and-structure` becomes readings with `bears` entries: "the spec and status of level-triggered reconciliation, adopted for the two frontiers as the difference between the AI's recommendation and what stands". Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.
