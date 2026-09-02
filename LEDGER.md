# Bootstrap ledger

Transient. Every entry names the disposition, a node on this ref, that will
dispose of it. The ledger is disposed of before bootstrap exit: emptying it is
the critical path to a `/align` skill materialized from the greenfield graph
(author, 2026-09-02). The last entry deletes this file.

Authority. Entries marked **author** record the author's words from the
bootstrap interview of 2026-09-02 (session "interview deferral options (2) ⑂
shim review", job 3dcce675). Entries marked **stub** were recorded by the AI
under the bootstrap grant (L10) and are deferred until ratified. Entries marked
**proposal** are AI recommendations with no authority. Nothing here is doctrine
until it is a ratified node.

Status: `open` no node yet · `stubbed` a deferred node or implementation
exists · `ratified` the node is ratified and the entry closes · `rejected`.

| id | title | status | source |
|---|---|---|---|
| L01 | archē is the root answer form | open | author |
| L02 | the root is agency, not philosophical mobility | open | proposal |
| L03 | two graphs, import-path namespaces, self-liquidating mount shim | open | author + proposal |
| L04 | persistence: own ref, compare-and-swap landing, no PR | stubbed | author + proposal |
| L05 | implementation sessions read projections, never the graph | open | author |
| L06 | traditions on instrumenting first principles | open | author |
| L07 | cadence review of archai rejected; expiry stays on delegated authority | open | author + proposal |
| L08 | re-grasp triggers are events | open | author + proposal |
| L09 | tradition readings carry authority; deferred reading recurses | open | author + proposal |
| L10 | the bootstrap grant: AI may stub; every stub is deferred and ledgered | ratified in interview, no node | author |
| L11 | reconciliation runs in both directions | open | author + proposal |
| L12 | bootstrap is onboarding by progressive disclosure | open | author |
| L13 | rank serves onboarding | open | author + proposal |
| L14 | the schema nodes | open | proposal |
| L15 | `/align` is materialized from the ratified schema; the ledger's disposal is its critical path | open | author |
| L16 | exit criteria | open | proposal |
| L17 | legacy nodes are evidence, never imported | open | proposal |
| L18 | the README is a projection of the purpose node | open | author |
| L19 | the revision-2 model page is input, not doctrine | informational | stub |
| L20 | delete this ledger | open | author |

## L01 archē is the root answer form

**Source.** Author: "I prefer the greek word archē over 'care' - confirm that
this word fits the usage." AI confirmed it fits better than "care".

**Content.** The four answer forms are target, rule, assumption, archē. An
archē is held, not derived: Aristotle gives the word its three senses at once
in Metaphysics Delta 1 (starting point of derivation, origin of motion or
action, rule as in monarchy); Posterior Analytics I.3 makes first principles
indemonstrable; Nicomachean Ethics I.4 starts ethics from the "that", held by
habituation. Consequences that follow from the word rather than needing
statement: only the author can hold one, the AI can never derive one, and
nothing ranks above one. Spell `arche` in machine fields, archē in prose.

**Disposition home.** The schema node for answer forms (L14).

## L02 the root is agency, not philosophical mobility

**Source.** Author: "Is 'agency' a better word for 'philosophical-mobility',
or is there a better reference to tradition? IMPORTANT: we must not be bound
by legacy graph structures such as ID's or node decomposition. Consider
alternate id and wording for the question - it is vague. Consider the
relationship between agency and archē."

**Proposal.** Agency and archē are one thing in Aristotle: Eudemian Ethics
II.6 says a person is an archē of actions the way the archai of mathematics
are starting points of proofs (also Nicomachean Ethics III.3 and III.5, "a
person is the origin and begetter of actions"). Politics I.4, 1253b33 to
1254a1, contains the delegation case: instruments that do their own work when
told, the shuttle weaving by itself. The modal content of the legacy virtue,
capacity rather than exercise, comes from Pettit's freedom as non-domination
(Republicanism, 1997): unfreedom is another's capacity to interfere
arbitrarily, exercised or not. Sen's capability approach says the same of
freedom. Hirschman (Exit, Voice, and Loyalty, 1970) supplies the two recovery
moves.

Draft node:

```
id:        <personal>/agency
question:  Who is the origin of what is done in my name?
answer:    arche. I am. Delegation and atrophy are expected and buy attention.
           What must not atrophy is the capacity to notice capture and recover,
           because an origin that cannot recover has been replaced.
```

The legacy virtue's second half, what must never be delegated, is a separate
question and becomes the first rule under it. Alternative id `authorship`,
matching the role name the model uses for the author; Korsgaard's
Self-Constitution (2009) is the tradition for when an action is one's own.

**Disposition home.** `<personal>/agency`, ratified by the author.

## L03 two graphs, import-path namespaces, self-liquidating mount shim

**Source.** Author: the target state has the author's personal disposition in
a repo that does not exist yet, distinct from this project's disposition
recorded in this repo; the project has no agency and no archē of its own; the
target involves mounting "in some shape"; a shim is needed now; "before
bootstrap exits a self-liquidating shim must exist for this"; "At some point it
makes sense to namespace by full git reference like a go package ... with an
assumed ref convention, such as naming convention to call it 'disposition' or
similar."

**Proposal.** Node ids are Go-style import paths: `commons.systems/purpose`.
One graph per repo, on the ref named `disposition` by convention. The tree on
the ref is relative; a manifest declares the graph's own path (as `go.mod`
declares `module`). The personal graph is named by its future import path from
the start and mapped to a local directory during bootstrap by a `replace`-style
mount entry, exactly Go's `replace` directive. The shim is that one entry. Its
liquidation condition: a repo answers at the personal path, at which point the
directory moves and the entry is deleted, and no id changes. Rank and `under`
cross the mount as paths. Tradition: Go modules (`module`, `replace`,
workspaces); Unix mount namespaces and Plan 9 for prefix-to-tree mapping.

**Open.** The personal import path is unchosen. Recommendation: `natb1.com`.
Naming it now is what makes the shim self-liquidating without an id rewrite.

**Disposition home.** A namespaces schema node (L14) plus one shim node
carrying the liquidation condition.

## L04 persistence: own ref, compare-and-swap landing, no PR

**Source.** Author: skeptical of landing graph updates via PR; the PR's
function is review of the materialized implementation; in the legacy
greenfield PRs were declined because the review was redundant with the
interview and commits to the implementation's ref caused unnecessary conflict
checks; "Think ahead to multiple agents making concurrent graph updates while
also pushing reconciled implementation." AI evaluated; the PR did not survive.

**Content.** The graph lives on its own ref, `disposition`, in this repo. Its
tree holds the graph, its small tooling, and its own `.claude` carrying the new
`/align`. Implementation stays on `main`; neither ref conflict-checks the
other and main's CI never runs for a graph write. Landing is compare-and-swap:
fetch, rebase onto the ref tip, validate, push with `--force-with-lease`, retry
on a lost race. One file per node means concurrent writers almost always touch
disjoint files. A collision on one node is an authority question, not a merge
problem: the standing answer changed underneath, so the lander re-runs the
authority algebra and the write lands as a proposal or is re-derived.
Alignment sessions work in a worktree of the ref. Ratified stamps are written
only by the author, through a one-line command; the AI's tooling has no code
path that writes `ratified`. Commit signing can harden this later. Traditions:
optimistic concurrency control (Kung and Robinson, 1981); Kubernetes
`resourceVersion`; git's own ref update.

**Stub.** This ref and the worktree
`.claude/worktrees/disposition` were created 2026-09-02 under L10. Until the
lander exists, bootstrap landings are plain `git commit` and `git push` to
`disposition`, no PR.

**Disposition home.** `<personal>/persistence` (schema, L14).

## L05 implementation sessions read projections, never the graph

**Source.** Author: "an implementation session (frontier bite) does not read
the worktree directly. instead graph context is a materialized projection via
rules and CLAUDE.local.md".

**Content.** A bite session never opens the graph. Global-tier rules are
materialized into committed `.claude/rules` on `main` by the reconciler. The
bite's own context, the ancestry of the node it serves, is materialized into
`CLAUDE.local.md` in its worktree at provisioning, pinned at a graph commit.
Writes from a bite go through narrow lander verbs (propose, answer as deferred,
record evidence), never node edits. Alignment sessions are the only sessions
that open the graph. This is the context function of `under` made concrete,
and it is what keeps legacy vocabulary out of bite context.

**Disposition home.** A projection or context schema node (L14).

## L06 traditions on instrumenting first principles

**Source.** Author, on the assessment traditions: "These tradition references
are good. They must be recorded before bootstrap exit."

**Content, to record as readings (L09).**
- Posterior Analytics I.3 and II.19: first principles are indemonstrable and
  grasped by induction from experience; they are re-grasped, not re-derived.
- Nicomachean Ethics I.4: ethics begins from the "that".
- Peirce, The Fixation of Belief (1877): inquiry begins with the irritation of
  genuine doubt, which comes from surprise; manufactured doubt is "paper
  doubt". Supports rejecting cadence review (L07).
- Rawls, A Theory of Justice (1971) and Goodman, Fact, Fiction, and Forecast
  (1955): reflective equilibrium, principles tested against considered
  judgments about cases; Daniels (1979), wide reflective equilibrium admits
  alternative principles, so an adversarial proposal is tradition-endorsed.
- Kuhn, The Structure of Scientific Revolutions (1962): anomalies accumulate
  to crisis; a threshold trigger, not a calendar.
- Planned Parenthood v. Casey (1992), factors for overruling precedent:
  workability, reliance, doctrinal development, changed facts.
- IEC 61508 proof-test interval: a safety function that cannot be monitored
  continuously is tested at an interval after which its claim lapses. Applies
  to instruments and delegated authority, not to archai (L07).
- OSHA process safety management, management of change: a change triggers
  hazard re-analysis; incident investigation triggers principle review.
- Seneca, De Ira III.36; the Ignatian examen: periodic review of conduct
  against principle. The cadence is on evidence review, not on the principle.
- Jefferson to Madison, 6 September 1789, constitutions expiring every
  nineteen years; New York Constitution Article XIX section 2, a convention
  question every twenty years. The periodic-convention strand, diverged from
  (L07).
- Sunset clauses: delegated and emergency powers expire unless renewed.

**Disposition home.** Reading nodes under `<personal>/agency` and under the
instruments schema node.

## L07 cadence review of archai rejected; expiry stays on delegated authority

**Source.** Author: "I am sceptical of cadence review - not that conventions
aren't called to re-evaluate constitutions in practice ... on a cadence (which
is rejected and must be recorded as a divergence from tradition before
bootstrap exits)".

**Content.** An archē is not re-grasped on a calendar. Record this as
diverged from the periodic-convention strand (Jefferson, New York Article XIX,
the examen's cadence) and adopted from Peirce, whose rejection of paper doubt
is the same position. Proposal: expiry is retained where the tradition places
it, on delegated authority and on assessments of lower answers (sunset
clauses, proof-test intervals). Open sub-question: does a delegated stamp
itself sunset, decaying to deferred unless renewed? The agency archē argues
yes (unrevisited delegations are how capture accrues); the author's
skepticism of cadence argues for an event trigger instead.

**Disposition home.** The instruments schema node and the agency node's
instrument.

## L08 re-grasp triggers are events

**Source.** Author: a proposal rejected for conflict with the archē is one
valid mechanical trigger; asks what else the references say; notes that
deferred reading is recursive and each primary source is an opportunity for
re-grasping.

**Content.** Five event triggers, all mechanical:
1. A proposal under the archē rejected for conflict with it (author; wide
   reflective equilibrium).
2. Surprise: an assumption-form answer in the subtree fails its instrument
   (Peirce; Popper; Casey's changed facts; incident investigation).
3. An action taken under the archē that the author rejects at review (narrow
   reflective equilibrium; management of change).
4. Anomalies past a ratified threshold: open proposals and variances under the
   archē (Kuhn).
5. A reading under it re-ratified with a changed verdict, including the
   recursive readings a deferred reading opens (author; Casey's doctrinal
   development).

**Disposition home.** The instruments schema node; the agency node's
instrument.

## L09 tradition readings carry authority; deferred reading recurses

**Source.** Author: "tradition references have the same authority as other
dispositions: I can accept a tradition reference as ratified (my reading of the
tradition from the primary source is that it supports or contradicts my
disposition), delegated (AI said it supports or contradicts and I don't care
enough to review the primary reference) or deferred (I will accept that the
tradition reference supports or diverges from my disposition, but will queue
the primary reading for review). This doctrine must be recorded before
bootstrap exit. Deferred reading is almost always a recursive act - one
primary source leads to another, each provides the opportunity for
re-grasping."

**Proposal (encoding).** A reading is a node, not a field entry: answer form
`reading`, with `source` (the primary text, pinned by citation and by content
hash when the text is in the repo) and `relation` (adopted, diverged, chosen
over), placed `under` the answer it grounds, stamped like any node. The
`grounds` field of the revision-2 model dissolves into this. What it buys for
free: the authority classes, the review queue (a deferred reading is a deferred
answer), rank for reading attention (flows from the grounded node), recursion
(a reading under a reading), and a page per reading. Failure semantics of the
form: a reading whose verdict changes is trigger 5 of L08, not an automatic
failure of the node above.

**Disposition home.** The schema (L14).

## L10 the bootstrap grant

**Source.** Author: "For the purpose of bootstrap procedure and onboarding AI
has broad authority to stub dispositions and materialized implementation and
place stub on ledger for ratification before bootstrap exit."

**Content.** During bootstrap the AI may stub nodes and implementation. Every
stub is stamped deferred, appears on this ledger, and is ratified, amended, or
pruned before exit. The grant decouples the critical path to `/align` from the
onboarding order: schema nodes can be stubbed at once and ratified in the order
the onboarding walk reaches them.

**Disposition home.** The bootstrap-operation node, a target under
`commons.systems/purpose` whose instrument is L16.

## L11 reconciliation runs in both directions

**Source.** Author: "Doctrine/implementation for reconciler bite work to work
in conjunction with office hours review to resolve in both directions: from
disposition -> unimplemented materialized implementation AND from
implementation not supported by disposition (including incumbent code/skills/
rules and legacy graph) -> new disposition or pruned implementation."

**Content.** Direction one: a target or rule whose instrument fails is a
frontier item; a bite materializes. Direction two: any materialized artifact
with no supporting disposition (code, skills, rules, the legacy `intentions/`
tree, the README) is a frontier item of class "unsupported implementation";
the reconciler proposes a new disposition, citing the artifact as evidence, or
proposes pruning; office hours rules. Proposal: a coverage map (which
dispositions cite or instrument which paths) ranks unsupported items; an
uncovered artifact is a prune-by-default proposal. This subsumes legacy
transcription and the legacy drain: legacy nodes are pulled in when a question
needs them and pruned in bulk otherwise.

**Disposition home.** The work-loop schema node.

## L12 bootstrap is onboarding by progressive disclosure

**Source.** Author: "organize bootstrapping around progressive disclosure.
Then, it makes sense to start with questions about the core value of the repo
- what is this repo and why does it matter? The projected documentation
artifacts for these first nodes serve as repo README from which the full repo
can be explored via graph browser artifact (to be recorded and materialized
before bootstrap exit)." Also: "Do not accept incumbent code such as README.md
as doctrine - it is likely stale but can provide context."

**Content.** Round zero is `commons.systems/purpose`, question "What is this
repository for?", answered in the author's words, with why it matters as the
rationale that leads up to the archē. The archē is stubbed as its parent and
ratified in round one. The schema nodes are stubbed at once (L10) and ratified
as the walk reaches "how do I read this record". The purpose node's projection
becomes the README (L18). The graph browser projects node details lazily and
is itself recorded as a node before exit.

**Disposition home.** `commons.systems/purpose`; the browser node.

## L13 rank serves onboarding

**Source.** Author: "New doctrine: node ranking serves an additional function
- to guide onboarding. Bootstrap follows an onboarding path steered by the
author, this is reflected in node ranking which later steers frontier
attention and other recorded functions of ranking."

**Content.** Rank is one fact with three readings: onboarding order, frontier
attention, compaction floor. Proposal: the onboarding path is the `under` tree
walked in rank order, so prerequisites come from `under` and importance from
rank; the author's choice of what comes next in the bootstrap is therefore a
boost ratification, recorded as such. The bootstrap order and rank agree by
construction.

**Disposition home.** The attention schema node.

## L14 the schema nodes

**Proposal.** To stub under L10 and ratify in onboarding order: node (unit of
record), under (the one hierarchical edge; global-tier nodes carry `under`
too, tier is scope of application only), authority (classes, attenuation,
proposals inert, ratified written only by the author), growth (the propose,
project, ratify-or-steer loop; every node has a projection), persistence (L04),
projection (the browser; bite context per L05), namespaces and mount (L03),
attention (L13), instruments and evidence (L06 to L08), readings (L09), work
loop (L11), legacy disposition (L17), context focus (what a session loads).
Each tool is the instrument of one of these nodes: validator, lander, ratify
command, projector and browser, rank and frontier derivation, the reconciler
tick.

## L15 `/align` is materialized from the ratified schema

**Source.** Author: "we need to find a critical path to a materialized
`/align` skill so that we can continue to record disposition as we work";
"ledger is disposed of even before bootstrap exit. Disposing of the ledger is
the critical path to `/align` skill materialized from greenfield disposition
graph."

**Content.** The skill is operational text projected from node, under,
authority, growth, persistence, and readings. It lives on this ref under
`.claude/skills/align`. Until it exists, rounds run by hand in the bootstrap
session following BOOTSTRAP.md.

## L16 exit criteria

**Proposal.** Bootstrap exits when: every rule this project runs under is a
node or a declared shim; dispatch selects from this graph's frontier; `/align`
is the only path by which a node is recorded; nothing live reads the legacy
`intentions/` tree; this ledger is empty and deleted.

**Disposition home.** The bootstrap-operation node's instrument.

## L17 legacy nodes are evidence, never imported

**Proposal.** A legacy node under `intentions/` is read only when a question
in this graph needs its knowledge, and is then cited as evidence. Its
vocabulary (virtue, strategy, tactic, phase, clarification, condition) does
not enter this graph. The AI in the bootstrap session was measurably
over-bound by it (author, 2026-09-02: "this session is over-bound by legacy
disposition"); context focus for later sessions comes from L04 and L05.

## L18 the README is a projection of the purpose node

**Source.** Author (L12). The README on `main` becomes a materialized
projection of `commons.systems/purpose`, the first direction-one bite, with an
instrument that checks the README against the projection. Until then the
incumbent README is context, not doctrine.

## L19 the revision-2 model page is input, not doctrine

**Stub.** `bootstrap/model-proposal.html` on this ref is the onboarding page
published 2026-09-02 as the private artifact "The Disposition Graph"
(https://claude.ai/code/artifact/c499a263-08bd-46b4-84b5-05009d5bafd0). It
carries the revision-2 model, the author's six rulings, and legacy-facing
appendices. It is superseded node by node as the browser grows and is deleted
with this ledger.

## L20 delete this ledger

When L01 to L19 are `ratified` or `rejected`, delete this file. Its history
stays in git.
