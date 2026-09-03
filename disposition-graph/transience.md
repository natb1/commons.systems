---
question: How is transient disposition recorded?
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-03
under:
  - commons.systems/disposition-graph/model
defines:
  - persistence
  - standing
  - shim
  - liquidation
  - open question
instrument:
  kind: check
  ref: the validator and the frontier projection on the implementation ref, not yet materialized for shims
  note: every declared shim resolves to the node it stands in for and to a liquidation condition; live shims are listed; a shim whose condition is met is flagged; no node has a form or field that records a unit of work
ledger: L37
---
## Answer

Never as a disposition. A disposition is standing: it holds until it is re-answered through the interview, and nothing in it says "for now". What is meant to pass takes one of five recorded shapes or is not recorded at all, and each shape makes its own staleness visible.

A criterion, when the temporary thing is really a standing obligation. "Review every landing before exit" or "drain the legacy record" is not guidance that expires; it is a criterion on the node it serves, and the frontier derives that it is unmet. When it is met it leaves the frontier and no text is edited. Transience is never stored; it is projected. A hazard learned in use is evidence on the criterion it qualifies, not guidance.

A shim, when an artifact or a text stands in for a materialization not yet made. A shim is declared where it comes into being, never retrofitted: on the node it instruments or projects, as that node's interim instrument or projection, naming the artifact and the condition under which it is removed, recorded verbatim and never paraphrased. A shim with no liquidation condition is not a shim but an undeclared permanent; a shim whose condition is met and which still exists is a frontier item. Shims are applied by default and bypassed only when asked. The notice an artifact carries is projected from the declaration.

A proposal, when the thing is a candidate for the author's ruling: a drafted answer, the pending findings and questions on a deferred node, a review finding excluded from a landing. A proposal has no authority and dies at the ruling, into the answer, into the rationale as a rejected alternative, or into nothing. It is the content of the author's review queue, which the deferred stamp is.

An open question, when a question is known and its answer is not: an owed reading, an unruled scope. A node with a question and no answer is on the frontier by construction until it is answered or pruned.

Evidence, when the thing is an observation: a dated assessment reading, a measurement, a survey, a quoted artifact. Evidence is minted and never edited, superseded by later evidence, and cited by the node it bears on with a pin of what was read; it is neither disposition nor guidance, and a measurement no node cites is unsupported and pruned by default.

Not recorded: operational and session state. What is claimed, what is in flight, at which step it stands, and what a session holds back until the author has committed are derived when needed from the record and the implementation, or kept in the operation's own scaffolding and disposed of with it. The record holds no expectation about work in progress.

One shape is forbidden by name: a node that records a unit of work, a plan, a task, or a step list, whatever it is called. Work is the derived difference between disposition and implementation; a bite is planned when it is claimed and exists only for the claim. A node whose achievement would delete it is not a disposition and is not written.

## Rationale

Drift is a recorded text that no longer matches what it describes, with nothing flagging the mismatch; inconsistency is two texts with apparent authority that contradict. Both come from storing as fact what should be derived. Each shape above passes one test: what is stored is what re-derivation cannot reconstruct, the author's decisions, the criteria, and the declared liquidation conditions; everything else is projection.

The author, 2026-09-02, on the bootstrap node: "dispositions must resist decay. They are persistent records, they don't track operational or transient state (like the current bootstrap process)." The author, 2026-09-02, in the legacy bootstrap attempt: "An additional class(es) of transient disposition is fine, but there must not be a 'catch all prose' transient disposition. Evaluate using greenfield-evaluation criteria (nothing is sacred, interview to override doctrine, evaluate from the perspective of greenfield judgement and also reference to tradition). Use the existing corpus of transient disposition (tactics) to form the model. What falls out as 'prone to decay and therefore no longer recorded at all' vs. 'recorded as transient guidance but would be better described as persistent criteria' vs. 'shim'. Consider what kind of output an /align session might produce which doesn't fit any of those categories." The outputs of a sitting each land in one shape: answers, rulings with their rejected alternatives, and boosts are standing; the surveys and measurements a sitting cites are evidence; declared shims are shims; pending items are proposals; surfaced readings and vocabulary are open questions; the account the AI holds back during the periagogic stage is not recorded, since it is re-derived from the page at each sitting. No further shape was needed.

Rejected, with the legacy record as evidence: a transient kind of node. The legacy tactic was a completable unit removed on completion, its body the plan, and the legacy record measured its cost: durable content stranded on a node about to vanish unless moved by hand; edges to a completed node left dangling; provenance and position conflated into false defects on 62 of 780 nodes; migration step lists stale by the time they were drained; and, in its own words, "the measured pain of standing tactic nodes (drift, deduplication, constant re-evaluation) is the cost of blending the three lifecycles in one hand-authored object". Its successor doctrine of 2026-09-01 abolished standing decomposition into tactics for a derived frontier and claim-time bites. This node reaches the same conclusion from the evaluation, not from the legacy authority. Also rejected: a stored self-liquidating class, a node that expires on a date or an event, because expiry stored on a node is exactly the state that drifts, and the legacy record found none needed; and shims declared in the artifact alone, because a notice the frontier cannot read is a permanent in disguise.

Traditions, owed as readings: Aristotle on hexis and kinesis, Nicomachean Ethics X.4 1174a13 to 1174b14 and Metaphysics Θ.6 1048b18 to 35, a state complete at every moment of its holding against a process complete only at its end, which is why a disposition cannot be transient; declarative desired state with a reconciliation loop, Kubernetes controllers and owned objects that nobody edits; feature-toggle lifecycle with owners and expiry (Hodgson, 2017); expand, migrate, contract (Sato, 2014), the contract phase mandatory; the strangler fig (Fowler, 2004), whose named failure is the half-strangled system that lives forever; deprecation as a process with ratcheted prevention of new uses (Winters, Manshreck, and Wright, Software Engineering at Google, 2020, chapter 15); mission command, the record carrying intent, end state, and constraints and never the scheme of manoeuvre (Auftragstaktik; ADP 6-0, 2019).
