---
question: Where does the record live, and how does a write land?
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/model
defines:
  - land
  - disposition ref
---
## Answer

On a ref of its own, named `disposition`, in the repository whose disposition it records. The ref's tree holds the graphs and only the graphs: the manifest and the node files. Tooling, the alignment skill, and every other materialized implementation live on the implementation ref, `main` (during bootstrap, the `greenfield` shim ref), and neither ref conflict-checks the other. A write lands by compare-and-swap: fetch, rebase onto the ref's tip, validate, push with a lease, and retry on a lost race. One file per node means concurrent writers almost always touch disjoint files. A collision on one node is an authority question, not a merge problem: the standing answer changed underneath, so the write is re-derived or lands as a proposal. No pull request: the review is the interview, the gate is the validator, the trail is the commit log.

## Rationale

The author's rejection of pull-request landing for the graph, 2026-09-02, on the grounds that review was redundant with the interview and a shared ref queued graph writes behind implementation checks. Traditions to record as readings: optimistic concurrency control (Kung and Robinson, 1981); resource versions in Kubernetes.
