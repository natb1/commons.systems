---
question: What does this repository cover, and in what order?
stage: periagogic
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-03
boost: 9
under:
  - commons.systems/disposition-graph/purpose
defines:
  - table of contents
  - section
shims:
  - artifact: "the boosts of the nodes this node orders, set by hand to realize the recorded order: this node 9 under purpose; projection 5, growth 4, the work loop 3, and rsi 1 under model; session-context 6 under projection"
    for: the materialization of high-level rank from this node
    liquidation: the order is read from this node and the validator refuses a graph whose ranks do not realize it, so that no boost can contradict the order and land
    declared: 2026-09-03
---
## Disposition

The author, 2026-09-02, on coverage:
> If there are other recorded functions in the incumbent code/graph then present for review to ensure full coverage of scope.

The author, 2026-09-02:
> "Who is this repository for?" to the extent this needs to be recorded right now it is handled by the purpose node already. It can be pruned. We might fold some of this in from the incumbent graph later.

The author, 2026-09-03:
> new disposition (alignment shim): I want a new disposition with the rationale for high level ranking. As onboarding documentation flow/ranking this sits just after the purpose and serves as the scope section following the purpose and also serves as a table of contents onboarding documentation. It records this disposition for high level ranking: purpose -> [scope, self documentation (via the graph browser)] (equal) -> alignment -> harness context management -> reconciliation -> rsi
>
> High level rank (but not all rank) should be materialized from this node to avoid drift. Recommend how to do that using existing primitives (materialized linting? or somthing else?).

## Answer

The purpose and six sections after it, in one order that is at once the reading order of the record, the order in which its parts are reconciled, and the order of the author's attention. This node is the table of contents of that walk: the browser presents the sections in this order and the frontier bites them in this order, because the rank of every node named here is held to this list.

1. Purpose: what this repository is for. `commons.systems/disposition-graph/purpose`.
2. Scope: this node, what the record covers and in what order. Equal with it, self-documentation: the record is its own documentation, read through the graph browser, the human projection, which renders every node in this order. `commons.systems/disposition-graph/projection`.
3. Alignment: the dialogue by which the author's dispositions enter the record, and the only way they do. `commons.systems/disposition-graph/growth`.
4. Harness context management: what a session loads and where each part of it comes from. `commons.systems/disposition-graph/session-context`.
5. Reconciliation: how the implementation is derived from the record, and the record amended from what the work finds. `commons.systems/disposition-graph/work-loop`.
6. Recursive self-improvement: the loop applied to itself. `commons.systems/disposition-graph/rsi`.

What the repository covers is what these sections cover: the record, its projections, the dialogue that writes it, the context a session loads, the loop that derives the implementation, and the loop's improvement of itself; the two hypotheses under purpose are within scope as hypotheses, with their criteria not yet validated. What it leaves out is open: the survey under Proposal names four recorded functions outside the purpose as worded, for the author to bring in or exclude.

High-level rank is materialized from this node. The order above is recorded once, here; the rank of every node it names is held to it, and a boost that contradicts it is invalid. Every other rank stays with each node's own boost, as the attention node describes.

## Rationale

The author's ruling of 2026-09-03, quoted above: a disposition that carries the rationale for high-level ranking, sits just after purpose, serves as the scope section and as the table of contents of the onboarding walk, records the order purpose, then scope and self-documentation through the browser as equals, then alignment, harness context management, reconciliation, and rsi, and materializes high-level rank so that it cannot drift. The order is the author's; the boost values, the node texts, and the choice of mechanism below are the AI's, deferred.

Why this order. Each section is what the next depends on, for a reader and for the work. Purpose gives the criterion everything else is judged by. Scope and the browser give what there is and how it is read; nothing can be found or reviewed before them. Alignment is the only way the record grows, so it precedes every harness that acts on the record. Harness context management is how a session sees the record, and nothing a session derives can be trusted before what it loads is settled. Reconciliation derives the implementation from all of the above. The loop's improvement of itself presupposes the loop. A dependency order, a reading order, and a priority order therefore coincide, which is what the attention node says rank is.

The boosts of 2026-09-03 realize the order: this node 9 under purpose, above model's 8, so that it is the first thing after purpose; projection 5, growth 4, the work loop 3, and rsi 1 under model; session-context 6 under projection, raised from 2, because at 2 its rank fell below the work loop's, harness context management ranking after reconciliation against the author's order of the same day. That is the drift this disposition guards against, present in the record within a day of the boosts being set by hand. The equality of this node and projection cannot be exact, since projection's rank is a share of model's and this node's a share of purpose's; it is realized as each being outranked by nothing but its own ancestors. A node for self-documentation under purpose, equal to this one by construction, would make it exact and is left to the author.

How high-level rank is materialized from this node, the recommendation. The order is recorded on this node as data, an ordered list of steps, each step one node or several that are equal, and the validator refuses a graph whose derived ranks do not realize it: every member of a step outranks every member of every later step, and the members of the first step are outranked by nothing under this node's parent but their own ancestors. The boosts remain the one mechanism of rank and the frontier and browser keep showing them; the order is recorded once; and since every landing on the graph is validated first, a boost that contradicts the order cannot land, which is what avoiding drift requires. This is the way the record already keeps its other invariants that span nodes, acyclicity and resolved parents. Considered and not recommended: deriving the boosts of the named nodes from the order, which needs a solver that must lift ancestors to lift a descendant, cannot make ranks at different depths equal, and fails in exactly the cases the validation rule reports, while hiding the boosts the projections display; a check instrument on this node, since an instrument measures the implementation against the record and turns a failure into work for the reconciliation loop, whereas an order the ranks contradict is an inconsistency of the record that must not land at all; moving the ordered nodes under this one so that the order becomes sibling order, which would make the tree carry priority, the conflation the attention node rejects; and leaving the boosts as the only record, which is the drift. The field is one addition to the node model, recorded on the node node when the tooling accepts it; until then the shim declared above stands.

## Proposal

This evidence contradicts the purpose disposition as worded and requires the author's clarification. A survey of what the repository is recorded as doing (evidence: the README, the root manifest's workspaces, the top-level directories, the statements of the seven legacy root nodes and fifty-eight legacy strategy nodes, forty skill files, and the nix outputs; kept at `bootstrap/scope-survey.md` on the `greenfield` ref) finds twelve recorded functions. Against the purpose above, five fall under the primary function, one under the knowledge-store hypothesis, two under the capture hypothesis, and four outside all three as currently worded.

Under the primary function (a):

1. The intention-graph mechanism: a versioned goal graph, one file per node, with a library that reads, writes, and validates it.
2. The autonomous dispatch harness: a headless scheduler that runs one bounded agent session per unit of work through plan, implement, qa, review, and merge.
3. Interview, audit, and self-improvement tooling: the align skills, the graph audit, and the harness's measurement of its own sessions.
4. Office hours: the human half of the queue, with its own hosted app and local-first snapshot.
5. Distribution and forkability: a plugin marketplace listing, an identity-free nix configuration with a fork template, and a separability audit of the graph tooling.

Under the knowledge-store hypothesis (b):

6. The root layer of principles, several cross-checked against named philosophical and religious traditions: a recorded personal ethical framework independent of any AI use.

Under the capture hypothesis (c):

7. Personal daily-practice dispositions: sleep, food, exercise, household consent, and how the author exercises voice toward delegatees; no software deliverable.
8. A café and community-space business venture: plan, financial model, and decision log, drafted with AI help and not linked into the legacy graph.

Outside the purpose as worded, each with the question that would bring it in or leave it out:

9. Personal-autonomy recovery apps (budget, print, audio): local-first web apps that replace institutional software in the author's daily use, also offered publicly. The intention behind them is close to (c); building and indefinitely maintaining three consumer apps, their shared libraries, and a Firebase backend is a different kind of work. Does the purpose cover maintaining software the author uses personally, or only the intention behind building it?
10. The public site and blog: an About page pitching independent consulting, a project showcase, and posts. Is marketing and portfolio content part of what the repository is for, or a separate function to name or exclude?
11. A tabletop-gaming blog, recorded as a deliberately indirect way of promoting one of the principles. Is covert promotion of the author's values through unrelated content within the purpose, or a hobby that a legacy node happened to rationalize?
12. Shared engineering and host infrastructure: about twenty libraries, the Firebase backend and its rules tests, and the author's own machine configuration, backups, and monitoring. Is the author's computing environment one more institution of daily life the purpose should name, or infrastructure with no purpose of its own?

Two further findings bear on the audience node. The evidence names at least five audiences: practitioners forking the harness, the author alone, prospective consulting clients, the general public downloading a stand-alone plugin, and an unspecified future collaborator. And the third-ref shim makes this question load-bearing: whatever on `main` has no supporting disposition by bootstrap exit is pruned by the swap, so functions 9 to 12 need an answer before then.


### Sitting on purpose, 2026-09-03

**The scope question; the audience finding moves here**

The node stays an open question with its twelve-function proposal. The paragraph that addressed the audience node now addresses this question: the evidence names five audiences, purpose names its readers, and whether the others are in scope is for this node to say.

Facts: authority deferred; boldness low; persistence open question; the audience finding a proposal that dies at the scope ruling.

Depends on: `audience`

The current proposal text with its last paragraph reworded; drafted with the scope sitting.

Proposed: pending.

Rulings open: ratify as shown; ratify with edits; defer; overrule.

### Recording of 2026-09-03

The author's ruling of 2026-09-03, quoted under Disposition, is recorded as this node's answer, stamped deferred: the order is the author's, and the boost values, the section texts, the mapping of "self documentation (via the graph browser)" to the projection node, the placement of rsi under model as an un-aligned node in the author's one word, and the recommended mechanism are the AI's, each owed the author's review. The coverage question of 2026-09-02 stays this node's open movement, at the periagogic stage: the twelve functions above, four outside the purpose as worded, still need the author's ruling, and this node's stage refers to them.

Open for the author's ruling: the mechanism recommended in the rationale, against the three alternatives it names; whether self-documentation should be a node of its own under purpose, which would make its equality with this node exact; what rsi covers, asked on the rsi node. Traditions consulted for the mechanism and owed as readings under the stub-traditions ruling: the single-source principle of software engineering, and the lint tradition of checking invariants that span records.

Facts: authority deferred, the order ratified in the author's words; boldness moderate, the section rationale and the mechanism are the AI's; persistence standing.
