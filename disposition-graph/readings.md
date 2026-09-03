---
question: How are references to tradition recorded?
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/model
defines:
  - reading
  - tradition
  - adopted
  - diverged
  - chosen over
---
## Answer

As readings, which are nodes. A reading answers the question what a tradition says about the answer above it: its source is the primary text and locus, its relation is adopted, diverged, or chosen over, and its answer says how the text supports or contradicts the disposition and where the disposition deliberately departs. A reading carries a stamp like any node: ratified when the author has read the primary source and judges the relation, delegated when the AI's reading stands and the author declines to review it, deferred when the author accepts it for now and queues the primary reading. Deferred reading is recursive: one source leads to another, and a reading may sit under a reading. A reading whose verdict changes on re-reading is a re-grasp trigger for the node it grounds, not an automatic failure of it.

## Rationale

The author's ruling of 2026-09-02 that tradition references carry authority classes. Making them nodes rather than field entries buys four things: one reading of a shared source is stored once and refined under each node it grounds; readings nest, which is what recursion needs; a reading has its own hash and pin, so a changed reading is distinguishable from a changed answer; and there is one write path, one queue, and one stamp vocabulary. The alternative, stamped entries in a field with a derived reading frontier, is workable and was the author's framing; the difference is parsimony of mechanism against parsimony of files.
